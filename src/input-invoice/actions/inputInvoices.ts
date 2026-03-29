import type {
  CreateInputInvoice,
  UpdateInputInvoice,
  ConfirmInputInvoice,
  RetryInputInvoiceOCR,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { parseInputInvoiceWith9RouterVision } from '../services/ocr';

const ALLOWED_ROLES = ['ADMIN', 'ACCOUNTING'];

function assertPermission(context: any) {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }
  if (!ALLOWED_ROLES.includes(context.user.role)) {
    throw new HttpError(403, 'Bạn không có quyền thực hiện thao tác này');
  }
}

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

type CreatePayload = {
  company: 'KHANH_HUY' | 'UNICON';
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

export const createInputInvoice: CreateInputInvoice<CreatePayload, any> = async (args, context) => {
  assertPermission(context);

  if (!args.fileUrls?.length) {
    throw new HttpError(400, 'Cần upload ít nhất 1 file');
  }

  if (!['KHANH_HUY', 'UNICON'].includes(args.company)) {
    throw new HttpError(400, 'Công ty không hợp lệ');
  }

  const user = context.user!;

  const created = await context.entities.InputInvoice.create({
    data: {
      company: args.company,
      invoiceType: 'OTHER',
      invoiceNumber: args.invoiceNumber || null,
      invoiceSymbol: args.invoiceSymbol || null,
      invoiceDate: toDateOrNull(args.invoiceDate),
      supplierName: args.supplierName || null,
      supplierTaxCode: args.supplierTaxCode || null,
      subtotal: args.subtotal ?? null,
      taxRate: args.taxRate ?? null,
      taxAmount: args.taxAmount ?? null,
      totalAmount: args.totalAmount ?? null,
      description: args.description || null,
      vehiclePlate: args.vehiclePlate || null,
      buyerName: args.buyerName || null,
      notes: args.notes || null,
      fileUrls: args.fileUrls,
      fileNames: args.fileNames || [],
      mimeTypes: args.mimeTypes || [],
      fileSizes: args.fileSizes || [],
      status: 'PROCESSING',
      ocrStatus: 'PROCESSING',
      createdById: user.id,
      ocrTask: {
        create: {
          provider: '9router_vision',
          startedAt: new Date(),
        },
      },
    },
    include: { ocrTask: true },
  });

  // Phase 1 OCR async-like flow (currently inline scaffold)
  const started = Date.now();
  const ocr = await parseInputInvoiceWith9RouterVision({
    fileUrls: created.fileUrls,
    fileNames: created.fileNames,
  });

  const extracted = ocr.data || {};

  const invoice = await context.entities.InputInvoice.update({
    where: { id: created.id },
    data: {
      status: ocr.success ? 'PENDING' : 'PENDING',
      ocrStatus: ocr.success ? 'SUCCESS' : 'PARTIAL',
      ocrErrorMsg: ocr.error || null,
      ocrConfidence: extracted.confidence ?? null,
      ocrResult: extracted.raw || extracted,
      invoiceNumber: created.invoiceNumber || extracted.invoiceNumber || null,
      invoiceSymbol: created.invoiceSymbol || extracted.invoiceSymbol || null,
      invoiceDate: created.invoiceDate || toDateOrNull(extracted.invoiceDate || null),
      supplierName: created.supplierName || extracted.supplierName || null,
      supplierTaxCode: created.supplierTaxCode || extracted.supplierTaxCode || null,
      subtotal: created.subtotal ?? extracted.subtotal ?? null,
      taxRate: created.taxRate ?? extracted.taxRate ?? null,
      taxAmount: created.taxAmount ?? extracted.taxAmount ?? null,
      totalAmount: created.totalAmount ?? extracted.totalAmount ?? null,
      description: created.description || extracted.description || null,
      vehiclePlate: created.vehiclePlate || extracted.vehiclePlate || null,
      buyerName: created.buyerName || extracted.buyerName || null,
      ocrTask: {
        update: {
          completedAt: new Date(),
          processingTimeMs: Date.now() - started,
          extractedData: extracted,
          rawResponse: extracted.raw || extracted,
        },
      },
    },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      confirmedBy: { select: { id: true, fullName: true, email: true } },
      ocrTask: true,
    },
  });

  return invoice;
};

type UpdatePayload = {
  id: string;
  company?: 'KHANH_HUY' | 'UNICON';
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

export const updateInputInvoice: UpdateInputInvoice<UpdatePayload, any> = async (args, context) => {
  assertPermission(context);

  const existing = await context.entities.InputInvoice.findUnique({
    where: { id: args.id },
  });

  if (!existing) {
    throw new HttpError(404, 'Không tìm thấy chứng từ đầu vào');
  }

  const updated = await context.entities.InputInvoice.update({
    where: { id: args.id },
    data: {
      company: args.company ?? undefined,
      invoiceNumber: args.invoiceNumber ?? undefined,
      invoiceSymbol: args.invoiceSymbol ?? undefined,
      invoiceDate: args.invoiceDate === undefined ? undefined : toDateOrNull(args.invoiceDate),
      supplierName: args.supplierName ?? undefined,
      supplierTaxCode: args.supplierTaxCode ?? undefined,
      subtotal: args.subtotal ?? undefined,
      taxRate: args.taxRate ?? undefined,
      taxAmount: args.taxAmount ?? undefined,
      totalAmount: args.totalAmount ?? undefined,
      description: args.description ?? undefined,
      vehiclePlate: args.vehiclePlate ?? undefined,
      buyerName: args.buyerName ?? undefined,
      notes: args.notes ?? undefined,
      status: existing.status === 'PROCESSING' ? 'PENDING' : existing.status,
    },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      confirmedBy: { select: { id: true, fullName: true, email: true } },
      ocrTask: true,
    },
  });

  return updated;
};

export const confirmInputInvoice: ConfirmInputInvoice<{ id: string }, any> = async ({ id }, context) => {
  assertPermission(context);

  const existing = await context.entities.InputInvoice.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new HttpError(404, 'Không tìm thấy chứng từ đầu vào');
  }

  const user = context.user!;

  const confirmed = await context.entities.InputInvoice.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedById: user.id,
      confirmedAt: new Date(),
    },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      confirmedBy: { select: { id: true, fullName: true, email: true } },
      ocrTask: true,
    },
  });

  return confirmed;
};

export const retryInputInvoiceOCR: RetryInputInvoiceOCR<{ id: string }, any> = async ({ id }, context) => {
  assertPermission(context);

  const existing = await context.entities.InputInvoice.findUnique({
    where: { id },
    include: { ocrTask: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Không tìm thấy chứng từ đầu vào');
  }

  await context.entities.InputInvoice.update({
    where: { id },
    data: {
      status: 'PROCESSING',
      ocrStatus: 'PROCESSING',
      ocrErrorMsg: null,
      ocrTask: {
        update: {
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
          startedAt: new Date(),
        },
      },
    },
  });

  const started = Date.now();
  const ocr = await parseInputInvoiceWith9RouterVision({
    fileUrls: existing.fileUrls,
    fileNames: existing.fileNames,
  });

  const extracted = ocr.data || {};

  const updated = await context.entities.InputInvoice.update({
    where: { id },
    data: {
      status: 'PENDING',
      ocrStatus: ocr.success ? 'SUCCESS' : 'PARTIAL',
      ocrErrorMsg: ocr.error || null,
      ocrConfidence: extracted.confidence ?? null,
      ocrResult: extracted.raw || extracted,
      invoiceNumber: existing.invoiceNumber || extracted.invoiceNumber || null,
      invoiceSymbol: existing.invoiceSymbol || extracted.invoiceSymbol || null,
      invoiceDate: existing.invoiceDate || toDateOrNull(extracted.invoiceDate || null),
      supplierName: existing.supplierName || extracted.supplierName || null,
      supplierTaxCode: existing.supplierTaxCode || extracted.supplierTaxCode || null,
      subtotal: existing.subtotal ?? extracted.subtotal ?? null,
      taxRate: existing.taxRate ?? extracted.taxRate ?? null,
      taxAmount: existing.taxAmount ?? extracted.taxAmount ?? null,
      totalAmount: existing.totalAmount ?? extracted.totalAmount ?? null,
      description: existing.description || extracted.description || null,
      vehiclePlate: existing.vehiclePlate || extracted.vehiclePlate || null,
      buyerName: existing.buyerName || extracted.buyerName || null,
      ocrTask: {
        update: {
          completedAt: new Date(),
          processingTimeMs: Date.now() - started,
          extractedData: extracted,
          rawResponse: extracted.raw || extracted,
        },
      },
    },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      confirmedBy: { select: { id: true, fullName: true, email: true } },
      ocrTask: true,
    },
  });

  return updated;
};
