export type InputInvoiceStatus = 'PROCESSING' | 'PENDING' | 'CONFIRMED' | 'ERROR';
export type InputInvoiceOCRStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
export type VehicleCompany = 'KHANH_HUY' | 'UNICON';

export type InputInvoiceListFilters = {
  company?: VehicleCompany;
  status?: InputInvoiceStatus;
  search?: string;
  invoiceMonth?: string;
  uploadMonth?: string;
  quarter?: number;
  year?: number;
  page?: number;
  limit?: number;
};

export type InputInvoiceRecord = {
  id: string;
  company: VehicleCompany;
  invoiceType?: string | null;
  invoiceNumber?: string | null;
  invoiceSymbol?: string | null;
  invoiceDate?: string | Date | null;
  supplierName?: string | null;
  supplierTaxCode?: string | null;
  subtotal?: number | string | null;
  taxRate?: number | string | null;
  taxAmount?: number | string | null;
  totalAmount?: number | string | null;
  description?: string | null;
  vehiclePlate?: string | null;
  buyerName?: string | null;
  notes?: string | null;
  status: InputInvoiceStatus;
  ocrStatus: InputInvoiceOCRStatus;
  ocrConfidence?: number | string | null;
  ocrErrorMsg?: string | null;
  fileUrls: string[];
  fileNames: string[];
  mimeTypes: string[];
  fileSizes: number[];
  createdAt: string | Date;
  updatedAt: string | Date;
  createdById: string;
  confirmedAt?: string | Date | null;
  confirmedById?: string | null;
  createdBy?: { id: string; fullName: string; email?: string } | null;
  confirmedBy?: { id: string; fullName: string; email?: string } | null;
  ocrTask?: {
    id: string;
    provider: string;
    retryCount: number;
    startedAt?: string | Date | null;
    completedAt?: string | Date | null;
    extractedData?: any;
  } | null;
};

export type CreateInputInvoicePayload = {
  company: VehicleCompany;
  fileUrls: string[];
  fileNames: string[];
  mimeTypes: string[];
  fileSizes: number[];
  invoiceNumber?: string;
  invoiceSymbol?: string;
  invoiceDate?: string;
  supplierName?: string;
  supplierTaxCode?: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  description?: string;
  vehiclePlate?: string;
  buyerName?: string;
  notes?: string;
};

export type UpdateInputInvoicePayload = {
  id: string;
  company?: VehicleCompany;
  invoiceNumber?: string | null;
  invoiceSymbol?: string | null;
  invoiceDate?: string | null;
  supplierName?: string | null;
  supplierTaxCode?: string | null;
  subtotal?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  description?: string | null;
  vehiclePlate?: string | null;
  buyerName?: string | null;
  notes?: string | null;
};

export type ExportInputInvoiceRow = {
  company: string;
  status: string;
  ocrStatus: string;
  invoiceNumber: string;
  invoiceSymbol: string;
  invoiceDate: string;
  supplierName: string;
  supplierTaxCode: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  description: string;
  vehiclePlate: string;
  buyerName: string;
  createdBy: string;
  createdAt: string;
  confirmedBy: string;
  confirmedAt: string;
};
