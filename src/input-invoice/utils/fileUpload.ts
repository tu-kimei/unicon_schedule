import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const getProjectRoot = () => {
  const cwd = process.cwd();
  if (cwd.includes('.wasp')) {
    return path.join(cwd, '..', '..', '..');
  }
  return cwd;
};

const PROJECT_ROOT = getProjectRoot();

function resolveUploadDir() {
  if (process.env.INPUT_INVOICE_UPLOAD_DIR) {
    return process.env.INPUT_INVOICE_UPLOAD_DIR;
  }

  // Production static is served by nginx from /var/www/schedule.unicon.ltd
  if (process.env.NODE_ENV === 'production') {
    return '/var/www/schedule.unicon.ltd/uploads/input-invoices';
  }

  // Local dev fallback
  return path.join(PROJECT_ROOT, 'public', 'uploads', 'input-invoices');
}

const UPLOAD_DIR = resolveUploadDir();
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

const fileFilter = (_req: any, file: any, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`));
  }
};

export const inputInvoiceUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 20,
  },
});

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

export function ensureInvoiceUploadDir(company: string, ym: string) {
  const dir = path.join(UPLOAD_DIR, company.toLowerCase(), ym);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
