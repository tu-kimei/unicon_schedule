import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Configuration
// ============================================================================

// In Wasp, we need to go up from .wasp/build/server to project root
const getProjectRoot = () => {
  const cwd = process.cwd();
  // If we're in .wasp/build/server, go up 3 levels
  if (cwd.includes('.wasp')) {
    return path.join(cwd, '..', '..', '..');
  }
  return cwd;
};

const PROJECT_ROOT = getProjectRoot();

// Production static is served by nginx from /var/www/schedule.unicon.ltd.
// In dev we keep files under the project so Vite can serve them from public/.
function resolveUploadsRoot(): string {
  if (process.env.UPLOADS_ROOT) return process.env.UPLOADS_ROOT;
  if (process.env.NODE_ENV === 'production') {
    return '/var/www/schedule.unicon.ltd/uploads';
  }
  return path.join(PROJECT_ROOT, 'public', 'uploads');
}

export const UPLOADS_ROOT = resolveUploadsRoot();
const UPLOAD_DIR = path.join(UPLOADS_ROOT, 'debts');

// One-time backfill: in production we historically wrote to <repo>/public/uploads.
// Copy any files from there into the nginx-served UPLOADS_ROOT if they're
// missing, so legacy records keep resolving after the path migration.
(function backfillFromLegacyPublic() {
  try {
    const legacyRoot = path.join(PROJECT_ROOT, 'public', 'uploads');
    if (legacyRoot === UPLOADS_ROOT) return;
    if (!fs.existsSync(legacyRoot)) return;
    if (!fs.existsSync(UPLOADS_ROOT)) fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
    const walk = (src: string, dst: string) => {
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dst, entry.name);
        if (entry.isDirectory()) {
          if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
          walk(s, d);
        } else if (entry.isFile() && !fs.existsSync(d)) {
          fs.copyFileSync(s, d);
        }
      }
    };
    walk(legacyRoot, UPLOADS_ROOT);
  } catch (err) {
    console.warn('legacy uploads backfill failed:', err);
  }
})();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

console.log('Upload directory:', UPLOAD_DIR);

// ============================================================================
// Multer Storage Configuration
// ============================================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // For multipart/form-data, body fields might not be parsed yet
    // Use a temporary directory first, we'll organize later
    const dir = UPLOAD_DIR;
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  
  filename: (req, file, cb) => {
    // Generate unique filename
    const uuid = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${uuid}-${timestamp}${ext}`;
    
    cb(null, filename);
  },
});

// ============================================================================
// File Filter
// ============================================================================

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: JPG, PNG, PDF. Got: ${file.mimetype}`));
  }
};

// ============================================================================
// Multer Instance
// ============================================================================

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 files per request
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Convert file path to URL
 */
export function filePathToUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');

  // Production path mapping: /var/www/schedule.unicon.ltd/uploads/... -> /uploads/...
  const prodBase = '/var/www/schedule.unicon.ltd';
  if (normalized.startsWith(prodBase)) {
    return normalized.substring(prodBase.length);
  }

  // Dev path mapping: <repo>/public/uploads/... -> /uploads/...
  const publicIndex = normalized.indexOf('/public/');
  if (publicIndex !== -1) {
    return normalized.substring(publicIndex + '/public'.length);
  }

  return normalized;
}

/**
 * Convert URL to file path
 */
export function urlToFilePath(url: string): string {
  // Strip leading '/uploads' and resolve under the configured uploads root
  const rel = url.startsWith('/uploads/') ? url.substring('/uploads/'.length) : url.replace(/^\//, '');
  return path.join(UPLOADS_ROOT, rel);
}

/**
 * Delete file from storage
 */
export function deleteFile(url: string): void {
  try {
    const filePath = urlToFilePath(url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * Validate file type
 */
export function validateFileType(mimetype: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimetype);
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimetype: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
  };
  return map[mimetype] || '';
}
