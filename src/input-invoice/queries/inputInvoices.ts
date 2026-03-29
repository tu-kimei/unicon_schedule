import type { GetInputInvoices, GetInputInvoice, ExportInputInvoices } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import * as XLSX from 'xlsx';

const ALLOWED_ROLES = ['ADMIN', 'ACCOUNTING'];

function canAccess(user: any) {
  return !!user && ALLOWED_ROLES.includes(user.role);
}

function toDateRange(month?: string, quarter?: number, year?: number) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 1);
    return { from, to };
  }

  if (quarter && year && quarter >= 1 && quarter <= 4) {
    const startMonth = (quarter - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 1);
    return { from, to };
  }

  return null;
}

type GetInputInvoicesInput = {
  company?: 'KHANH_HUY' | 'UNICON';
  status?: 'PROCESSING' | 'PENDING' | 'CONFIRMED' | 'ERROR';
  search?: string;
  invoiceMonth?: string;
  uploadMonth?: string;
  quarter?: number;
  year?: number;
  page?: number;
  limit?: number;
};

export const getInputInvoices: GetInputInvoices<GetInputInvoicesInput, any> = async (args, context) => {
  if (!canAccess(context.user)) {
    throw new HttpError(403, 'Bạn không có quyền truy cập hoá đơn đầu vào');
  }

  const {
    company,
    status,
    search,
    invoiceMonth,
    uploadMonth,
    quarter,
    year,
    page = 1,
    limit = 20,
  } = args || {};

  const where: any = {};

  if (company) where.company = company;
  if (status) where.status = status;

  const invoiceDateRange = toDateRange(invoiceMonth, quarter, year);
  if (invoiceDateRange) {
    where.invoiceDate = {
      gte: invoiceDateRange.from,
      lt: invoiceDateRange.to,
    };
  }

  const uploadDateRange = toDateRange(uploadMonth, undefined, undefined);
  if (uploadDateRange) {
    where.createdAt = {
      gte: uploadDateRange.from,
      lt: uploadDateRange.to,
    };
  }

  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { invoiceSymbol: { contains: q, mode: 'insensitive' } },
      { supplierName: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const total = await context.entities.InputInvoice.count({ where });

  const invoices = await context.entities.InputInvoice.findMany({
    where,
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      confirmedBy: { select: { id: true, fullName: true, email: true } },
      ocrTask: true,
    },
    orderBy: [
      { invoiceDate: 'desc' },
      { createdAt: 'desc' },
    ],
    skip: (page - 1) * limit,
    take: limit,
  });

  const summary = {
    total,
    processing: invoices.filter((i: any) => i.status === 'PROCESSING').length,
    pending: invoices.filter((i: any) => i.status === 'PENDING').length,
    confirmed: invoices.filter((i: any) => i.status === 'CONFIRMED').length,
    error: invoices.filter((i: any) => i.status === 'ERROR').length,
  };

  return {
    invoices,
    summary,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getInputInvoice: GetInputInvoice<{ id: string }, any> = async ({ id }, context) => {
  if (!canAccess(context.user)) {
    throw new HttpError(403, 'Bạn không có quyền truy cập hoá đơn đầu vào');
  }

  const invoice = await context.entities.InputInvoice.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      confirmedBy: { select: { id: true, fullName: true, email: true } },
      ocrTask: true,
    },
  });

  if (!invoice) {
    throw new HttpError(404, 'Không tìm thấy chứng từ đầu vào');
  }

  return invoice;
};

export const exportInputInvoices: ExportInputInvoices<GetInputInvoicesInput, { fileName: string; base64: string }> = async (args, context) => {
  if (!canAccess(context.user)) {
    throw new HttpError(403, 'Bạn không có quyền export hoá đơn đầu vào');
  }

  const data = await getInputInvoices({ ...args, page: 1, limit: 5000 }, context);
  const rows = data.invoices.map((i: any) => ({
    'Công ty': i.company,
    'Trạng thái': i.status,
    'OCR': i.ocrStatus,
    'Số hoá đơn': i.invoiceNumber || '',
    'Ký hiệu': i.invoiceSymbol || '',
    'Ngày hoá đơn': i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString('vi-VN') : '',
    'Nhà cung cấp': i.supplierName || '',
    'MST NCC': i.supplierTaxCode || '',
    'Tổng trước VAT': Number(i.subtotal || 0),
    'VAT %': Number(i.taxRate || 0),
    'Tiền VAT': Number(i.taxAmount || 0),
    'Tổng thanh toán': Number(i.totalAmount || 0),
    'Nội dung': i.description || '',
    'Biển số xe': i.vehiclePlate || '',
    'Người mua': i.buyerName || '',
    'Người upload': i.createdBy?.fullName || '',
    'Ngày upload': new Date(i.createdAt).toLocaleString('vi-VN'),
    'Người xác nhận': i.confirmedBy?.fullName || '',
    'Ngày xác nhận': i.confirmedAt ? new Date(i.confirmedAt).toLocaleString('vi-VN') : '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'InputInvoices');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const fileName = `input-invoices-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return {
    fileName,
    base64: buffer.toString('base64'),
  };
};
