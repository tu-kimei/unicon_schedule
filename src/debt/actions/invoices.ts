import type { Invoice } from 'wasp/entities';
import type {
  CreateInvoice,
  UpdateInvoiceStatus,
  DeleteInvoice,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

// ============================================================================
// Types
// ============================================================================

type InvoiceStatusType = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

type CreateInvoiceInput = {
  customerId: string;
  shipmentId?: string;
  chargeIds: string[];
  notes?: string;
  paymentTerms?: string;
};

type UpdateInvoiceStatusInput = {
  invoiceId: string;
  status: InvoiceStatusType;
  paymentMethod?: string;
  paymentRef?: string;
};

type DeleteInvoiceInput = {
  invoiceId: string;
};

// ============================================================================
// Helper: Generate invoice number
// ============================================================================

async function generateInvoiceNumber(context: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Find the latest invoice for this year
  const latestInvoice = await context.entities.Invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestInvoice) {
    const lastNumber = parseInt(latestInvoice.invoiceNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

// ============================================================================
// Create Invoice
// ============================================================================

export const createInvoice: CreateInvoice<CreateInvoiceInput, Invoice> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can create invoices');
  }

  // Validate customer exists
  const customer = await context.entities.Customer.findUnique({
    where: { id: args.customerId },
  });

  if (!customer) {
    throw new HttpError(404, 'Customer not found');
  }

  // Validate shipment if provided
  if (args.shipmentId) {
    const shipment = await context.entities.Shipment.findUnique({
      where: { id: args.shipmentId },
    });
    if (!shipment) {
      throw new HttpError(404, 'Shipment not found');
    }
  }

  // Validate charge IDs
  if (!args.chargeIds || args.chargeIds.length === 0) {
    throw new HttpError(400, 'At least one charge is required');
  }

  // Fetch charges and validate they exist and are not already invoiced
  const charges = await context.entities.Charge.findMany({
    where: {
      id: { in: args.chargeIds },
    },
    include: {
      invoiceItem: true,
    },
  });

  if (charges.length !== args.chargeIds.length) {
    throw new HttpError(400, 'One or more charges not found');
  }

  // Check if any charge is already linked to an invoice
  const alreadyInvoiced = charges.filter((c: any) => c.invoiceItem !== null);
  if (alreadyInvoiced.length > 0) {
    throw new HttpError(400, 'One or more charges are already linked to an invoice');
  }

  // Calculate totals
  const subtotal = charges.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
  const vatRate = 10.0;
  const vatAmount = subtotal * (vatRate / 100);
  const grandTotal = subtotal + vatAmount;

  // Calculate due date from customer's paymentTermDays
  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + customer.paymentTermDays);

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(context);

  // Create invoice with items in a transaction
  const invoice = await context.entities.Invoice.create({
    data: {
      invoiceNumber,
      customerId: args.customerId,
      shipmentId: args.shipmentId || null,
      subtotal,
      vatRate,
      vatAmount,
      grandTotal,
      invoiceDate,
      dueDate,
      status: 'DRAFT',
      notes: args.notes || null,
      paymentTerms: args.paymentTerms || null,
      createdById: user.id,
      items: {
        create: charges.map((charge: any) => ({
          chargeId: charge.id,
          description: charge.description || `${charge.chargeType}`,
          quantity: charge.quantity,
          unitPrice: Number(charge.unitPrice),
          amount: Number(charge.amount),
        })),
      },
    },
    include: {
      customer: true,
      shipment: true,
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
        },
      },
    },
  });

  return invoice;
};

// ============================================================================
// Update Invoice Status
// ============================================================================

export const updateInvoiceStatus: UpdateInvoiceStatus<UpdateInvoiceStatusInput, Invoice> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can update invoice status');
  }

  // Get existing invoice
  const existingInvoice = await context.entities.Invoice.findUnique({
    where: { id: args.invoiceId },
  });

  if (!existingInvoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  // Prepare update data
  const updateData: any = {
    status: args.status,
  };

  // Set timestamps based on status
  if (args.status === 'PAID') {
    updateData.paidAt = new Date();
    if (args.paymentMethod) updateData.paymentMethod = args.paymentMethod;
    if (args.paymentRef) updateData.paymentRef = args.paymentRef;
  }

  if (args.status === 'SENT') {
    updateData.sentAt = new Date();
  }

  const updatedInvoice = await context.entities.Invoice.update({
    where: { id: args.invoiceId },
    data: updateData,
    include: {
      customer: true,
      shipment: true,
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
        },
      },
    },
  });

  return updatedInvoice;
};

// ============================================================================
// Delete Invoice (Only DRAFT)
// ============================================================================

export const deleteInvoice: DeleteInvoice<DeleteInvoiceInput, { message: string; id: string }> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { user } = context;

  // Check permissions
  if (!['ADMIN', 'ACCOUNTING'].includes(user.role)) {
    throw new HttpError(403, 'Only ADMIN and ACCOUNTING can delete invoices');
  }

  // Get existing invoice
  const existingInvoice = await context.entities.Invoice.findUnique({
    where: { id: args.invoiceId },
    include: {
      items: true,
    },
  });

  if (!existingInvoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  // Only DRAFT invoices can be deleted
  if (existingInvoice.status !== 'DRAFT') {
    throw new HttpError(400, 'Only DRAFT invoices can be deleted');
  }

  // Delete invoice items first (this unlinks charges)
  await context.entities.InvoiceItem.deleteMany({
    where: { invoiceId: args.invoiceId },
  });

  // Delete the invoice
  await context.entities.Invoice.delete({
    where: { id: args.invoiceId },
  });

  return {
    message: 'Invoice deleted successfully',
    id: args.invoiceId,
  };
};
