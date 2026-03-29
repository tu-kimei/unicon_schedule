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
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'public', 'uploads', 'input-invoices');
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
  const publicIndex = filePath.indexOf('public');
  if (publicIndex !== -1) {
    const relativePath = filePath.substring(publicIndex + 6);
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  }
  return filePath;
}

export function ensureInvoiceUploadDir(company: string, ym: string) {
  const dir = path.join(UPLOAD_DIR, company.toLowerCase(), ym);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
