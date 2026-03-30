import type { UploadInputInvoiceFilesApi } from 'wasp/server/api';
import fs from 'fs';
import path from 'path';
import { ensureInvoiceUploadDir, filePathToUrl, inputInvoiceUpload } from '../utils/fileUpload';

function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const uploadInputInvoiceFiles: UploadInputInvoiceFilesApi = (req, res, context) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!context.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!['ADMIN', 'ACCOUNTING'].includes(context.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const uploadMiddleware = inputInvoiceUpload.array('files', 20);

  uploadMiddleware(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: 'File upload failed', message: err.message });
    }

    try {
      const files = (req.files as any[]) || [];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const company = String(req.body.company || 'UNICON');
      const ym = currentYM();
      const targetDir = ensureInvoiceUploadDir(company, ym);

      const urls: string[] = [];
      const fileNames: string[] = [];
      const mimeTypes: string[] = [];
      const fileSizes: number[] = [];

      for (const file of files) {
        const targetPath = path.join(targetDir, path.basename(file.path));
        fs.renameSync(file.path, targetPath);
        urls.push(filePathToUrl(targetPath));
        fileNames.push(file.originalname);
        mimeTypes.push(file.mimetype);
        fileSizes.push(file.size);
      }

      return res.status(200).json({
        urls,
        fileNames,
        mimeTypes,
        fileSizes,
        count: urls.length,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'File processing failed', message: error.message || 'Unknown error' });
    }
  });
};
