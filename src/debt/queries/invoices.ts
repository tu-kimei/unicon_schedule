import type { Invoice } from 'wasp/entities';
import type { GetAllInvoices, GetInvoice } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type InvoiceStatusType = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

type GetAllInvoicesInput = {
  customerId?: string;
  status?: InvoiceStatusType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

type GetInvoiceInput = {
  id: string;
};

// ============================================================================
// Get All Invoices
// ============================================================================

export const getAllInvoices: GetAllInvoices<GetAllInvoicesInput, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'Bạn không có quyền xem hóa đơn');
  }

  const {
    customerId,
    status,
    search,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = args || {};

  // Build where clause
  const where: any = {};

  if (customerId) {
    where.customerId = customerId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Get total count
  const total = await context.entities.Invoice.count({ where });

  // Get invoices with pagination
  const invoices = await context.entities.Invoice.findMany({
    where,
    include: {
      customer: true,
      shipment: {
        select: {
          id: true,
          shipmentNumber: true,
        },
      },
      items: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Calculate summary
  const allInvoices = await context.entities.Invoice.findMany({
    where: {},
    select: { status: true, grandTotal: true },
  });

  const summary = {
    total: allInvoices.length,
    draft: allInvoices.filter((i: any) => i.status === 'DRAFT').length,
    sent: allInvoices.filter((i: any) => i.status === 'SENT').length,
    paid: allInvoices.filter((i: any) => i.status === 'PAID').length,
    overdue: allInvoices.filter((i: any) => i.status === 'OVERDUE').length,
    partial: allInvoices.filter((i: any) => i.status === 'PARTIAL').length,
    cancelled: allInvoices.filter((i: any) => i.status === 'CANCELLED').length,
    totalAmount: allInvoices.reduce((sum: number, i: any) => sum + Number(i.grandTotal), 0),
    totalPaid: allInvoices
      .filter((i: any) => i.status === 'PAID')
      .reduce((sum: number, i: any) => sum + Number(i.grandTotal), 0),
  };

  return {
    invoices,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    summary,
  };
};

// ============================================================================
// Get Invoice by ID
// ============================================================================

export const getInvoice: GetInvoice<GetInvoiceInput, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Chưa đăng nhập');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING', 'OPS'].includes(user.role)) {
    throw new HttpError(403, 'Bạn không có quyền xem hóa đơn');
  }

  const invoice = await context.entities.Invoice.findUnique({
    where: { id: args.id },
    include: {
      customer: true,
      shipment: {
        select: {
          id: true,
          shipmentNumber: true,
          currentStatus: true,
        },
      },
      items: {
        include: {
          charge: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new HttpError(404, 'Không tìm thấy hóa đơn');
  }

  return invoice;
};
