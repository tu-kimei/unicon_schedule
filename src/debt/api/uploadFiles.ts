import type { UploadFilesApi } from 'wasp/server/api';
import { upload, filePathToUrl } from '../utils/fileUpload';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Helper Functions
// ============================================================================

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ============================================================================
// Upload Files API
// ============================================================================

export const uploadFiles: UploadFilesApi = (req, res, context) => {
  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log('=== Upload API Called ===');
  console.log('User:', context.user?.email);
  console.log('User role:', context.user?.role);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Origin:', req.headers.origin);
  console.log('Cookies:', req.headers.cookie);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Has files in req?', 'files' in req);
  
  // Check authentication
  if (!context.user) {
    console.log('ERROR: Not authenticated');
    console.log('Session ID from cookie:', req.headers.cookie);
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Check permissions - Allow ADMIN, ACCOUNTING, OPS, and DISPATCHER
  if (!['ADMIN', 'ACCOUNTING', 'OPS', 'DISPATCHER'].includes(context.user.role)) {
    console.log('ERROR: Insufficient permissions. User role:', context.user.role);
    return res.status(403).json({ error: 'Insufficient permissions to upload files' });
  }
  
  console.log('Auth OK, proceeding with upload...');

  // Use multer middleware
  const uploadMiddleware = upload.array('files', 10);

  uploadMiddleware(req, res, (err: any) => {
    if (err) {
      console.error('Upload error:', err);
      res.status(400).json({
        error: 'File upload failed',
        message: err.message,
      });
      return;
    }

    try {
      // Get uploaded files
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        console.log('ERROR: No files in request');
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      console.log(`Processing ${files.length} files...`);
      console.log('Request body:', req.body);

      // Get upload category and type from request body
      const category = req.body.category || 'debts'; // 'debts', 'drivers', 'vehicles'
      const uploadType = req.body.type || 'invoices'; // For debts: 'invoices' or 'payments'
                                                        // For drivers: 'citizen_id' or 'license'
                                                        // For vehicles: 'registration', 'inspection', 'insurance'
      const debtMonth = req.body.debtMonth || getCurrentMonth();
      
      console.log(`Category: ${category}, Upload type: ${uploadType}, Month: ${debtMonth}`);

      // Move files to organized directories
      const urls: string[] = [];

      for (const file of files) {
        let targetDir: string;
        
        // Determine target directory based on category
        if (category === 'debts') {
          // Debts: /uploads/debts/invoices/2026-02/ or /uploads/debts/payments/2026-02/
          targetDir = path.join(
            path.dirname(file.path).replace('/debts', ''), // Remove /debts from temp path
            'debts',
            uploadType,
            debtMonth
          );
        } else if (category === 'drivers') {
          // Drivers: /uploads/drivers/citizen_id/ or /uploads/drivers/license/
          targetDir = path.join(
            path.dirname(file.path).replace('/debts', ''), // Remove /debts from temp path
            'drivers',
            uploadType
          );
        } else if (category === 'vehicles') {
          // Vehicles: /uploads/vehicles/registration/, /inspection/, /insurance/
          targetDir = path.join(
            path.dirname(file.path).replace('/debts', ''), // Remove /debts from temp path
            'vehicles',
            uploadType
          );
        } else {
          // Fallback to old behavior
          targetDir = path.join(
            path.dirname(file.path),
            uploadType,
            debtMonth
          );
        }
        
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Move file to target directory
        const targetPath = path.join(targetDir, path.basename(file.path));
        fs.renameSync(file.path, targetPath);
        
        // Convert to URL
        const url = filePathToUrl(targetPath);
        console.log(`File: ${file.originalname} -> ${url}`);
        urls.push(url);
      }

      console.log('Files uploaded successfully:', urls);

      res.status(200).json({
        urls,
        count: urls.length,
      });
    } catch (error: any) {
      console.error('Upload processing error:', error);
      res.status(500).json({
        error: 'File processing failed',
        message: error.message || 'Unknown error',
      });
    }
  });
};
