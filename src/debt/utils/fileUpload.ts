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
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'public', 'uploads', 'debts');
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
  // Extract path after 'public/'
  const publicIndex = filePath.indexOf('public');
  if (publicIndex !== -1) {
    const relativePath = filePath.substring(publicIndex + 6); // 'public'.length = 6
    return relativePath.startsWith('/') ? relativePath : '/' + relativePath;
  }
  
  // Fallback: just return the path
  return filePath;
}

/**
 * Convert URL to file path
 */
export function urlToFilePath(url: string): string {
  // Add 'public/' prefix
  const filePath = path.join(PROJECT_ROOT, 'public', url);
  return filePath;
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
