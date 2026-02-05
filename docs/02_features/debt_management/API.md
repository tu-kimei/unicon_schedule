# Debt Management - API Contracts (MVP)

## Overview

API endpoints cho tính năng Quản lý Công nợ MVP.

---

## Authentication & Authorization

Tất cả endpoints yêu cầu authentication và role-based permissions:

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access (CRUD + payment update) |
| **ACCOUNTING** | Full access (CRUD + payment update) |
| **OPS** | Read-only |
| **DISPATCHER** | No access |
| **DRIVER** | No access |

---

## Endpoints

### 1. Get All Debts (with filters)

**GET** `/api/debts`

**Query Parameters:**
```typescript
{
  customerId?: string;        // Filter by customer
  debtMonth?: string;         // Filter by month (YYYY-MM)
  status?: DebtStatus;        // UNPAID, PAID, OVERDUE, CANCELLED
  debtType?: DebtType;        // FREIGHT, ADVANCE, OTHER
  isOverdue?: boolean;        // true = only overdue debts
  page?: number;              // Pagination (default: 1)
  limit?: number;             // Items per page (default: 20)
  sortBy?: string;            // dueDate, amount, createdAt
  sortOrder?: 'asc' | 'desc'; // default: desc
}
```

**Response:**
```typescript
{
  debts: [
    {
      id: string;
      customer: {
        id: string;
        name: string;
        email: string;
        paymentTermDays: number;
        paymentTermType: 'DAYS' | 'MONTHS';
      };
      debtType: 'FREIGHT' | 'ADVANCE' | 'OTHER';
      debtMonth: string; // "2026-02"
      amount: number;
      documentLink: string | null;
      invoiceImages: string[];
      notes: string | null;
      recognitionDate: string; // ISO 8601
      dueDate: string; // ISO 8601
      status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      paidAmount: number | null;
      paidDate: string | null;
      paymentProofImages: string[];
      paymentNotes: string | null;
      createdBy: {
        id: string;
        fullName: string;
        email: string;
      };
      createdAt: string;
      updatedAt: string;
      
      // Computed fields
      isOverdue: boolean;
      daysOverdue: number | null;
      daysUntilDue: number | null;
    }
  ];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalAmount: number;
    totalUnpaid: number;
    totalPaid: number;
    totalOverdue: number;
    countUnpaid: number;
    countPaid: number;
    countOverdue: number;
  };
}
```

**Authorization:**
- ADMIN, ACCOUNTING: Full access
- OPS: Read-only access

---

### 2. Get Debt by ID

**GET** `/api/debts/:id`

**Response:**
```typescript
{
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    paymentTermDays: number;
    paymentTermType: 'DAYS' | 'MONTHS';
  };
  debtType: 'FREIGHT' | 'ADVANCE' | 'OTHER';
  debtMonth: string;
  amount: number;
  documentLink: string | null;
  invoiceImages: string[];
  notes: string | null;
  recognitionDate: string;
  dueDate: string;
  status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paidAmount: number | null;
  paidDate: string | null;
  paymentProofImages: string[];
  paymentNotes: string | null;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  
  // Computed
  isOverdue: boolean;
  daysOverdue: number | null;
  daysUntilDue: number | null;
}
```

**Authorization:**
- ADMIN, ACCOUNTING: Full access
- OPS: Read-only access

---

### 3. Create Debt

**POST** `/api/debts`

**Request Body:**
```typescript
{
  customerId: string;           // Required
  debtType: 'FREIGHT' | 'ADVANCE' | 'OTHER'; // Required
  debtMonth: string;            // Required, format: "YYYY-MM"
  amount: number;               // Required, > 0
  documentLink?: string;        // Optional
  invoiceImages?: string[];     // Optional, array of URLs
  notes?: string;               // Optional
  recognitionDate?: string;     // Optional, default: now()
}
```

**Response:**
```typescript
{
  id: string;
  customerId: string;
  debtType: string;
  debtMonth: string;
  amount: number;
  documentLink: string | null;
  invoiceImages: string[];
  notes: string | null;
  recognitionDate: string;
  dueDate: string; // Auto-calculated
  status: 'UNPAID';
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
```

**Validation:**
- `customerId`: Must exist in database
- `debtType`: Must be valid enum value
- `debtMonth`: Must match format "YYYY-MM"
- `amount`: Must be > 0
- `recognitionDate`: Must be valid date, defaults to now()
- `dueDate`: Auto-calculated from recognitionDate + customer.paymentTermDays

**Business Logic:**
```typescript
// Auto-calculate dueDate
const customer = await getCustomer(customerId);
const recognitionDate = input.recognitionDate || new Date();

if (customer.paymentTermType === 'DAYS') {
  dueDate = addDays(recognitionDate, customer.paymentTermDays);
} else {
  dueDate = addMonths(recognitionDate, customer.paymentTermDays);
}
```

**Authorization:**
- ADMIN, ACCOUNTING: Can create

---

### 4. Update Debt

**PUT** `/api/debts/:id`

**Request Body:**
```typescript
{
  debtType?: 'FREIGHT' | 'ADVANCE' | 'OTHER';
  debtMonth?: string;
  amount?: number;
  documentLink?: string;
  invoiceImages?: string[];
  notes?: string;
  recognitionDate?: string;
}
```

**Response:**
```typescript
{
  id: string;
  // ... updated debt object
}
```

**Validation:**
- Cannot update if status is 'PAID'
- If `recognitionDate` changes, `dueDate` is recalculated
- `amount` must be > 0

**Authorization:**
- ADMIN, ACCOUNTING: Can update unpaid debts

---

### 5. Mark Debt as Paid

**POST** `/api/debts/:id/pay`

**Request Body:**
```typescript
{
  paidAmount: number;           // Required, must equal debt.amount (MVP)
  paidDate: string;             // Required, ISO 8601 date
  paymentProofImages?: string[]; // Optional, array of UNC image URLs
  paymentNotes?: string;        // Optional
}
```

**Response:**
```typescript
{
  id: string;
  status: 'PAID';
  paidAmount: number;
  paidDate: string;
  paymentProofImages: string[];
  paymentNotes: string | null;
  updatedAt: string;
}
```

**Validation:**
- `paidAmount` must equal `debt.amount` (full payment only in MVP)
- `paidDate` must be valid date
- Cannot mark as paid if already paid
- Cannot mark as paid if cancelled

**Authorization:**
- ADMIN, ACCOUNTING: Can mark as paid

---

### 6. Cancel Debt

**POST** `/api/debts/:id/cancel`

**Request Body:**
```typescript
{
  reason?: string; // Optional cancellation reason
}
```

**Response:**
```typescript
{
  id: string;
  status: 'CANCELLED';
  notes: string; // Original notes + cancellation reason
  updatedAt: string;
}
```

**Validation:**
- Cannot cancel if already paid
- Adds cancellation reason to notes

**Authorization:**
- ADMIN, ACCOUNTING: Can cancel

---

### 7. Delete Debt (Soft Delete)

**DELETE** `/api/debts/:id`

**Response:**
```typescript
{
  message: "Debt deleted successfully";
  id: string;
}
```

**Validation:**
- Soft delete only (sets deletedAt timestamp)
- Cannot delete if status is 'PAID'

**Authorization:**
- ADMIN only

---

### 8. Upload Invoice Images

**POST** `/api/debts/:id/upload-invoice`

**Request:**
- Content-Type: `multipart/form-data`
- Field: `files` (multiple files allowed)
- Max file size: 5MB per file
- Allowed formats: JPG, PNG, PDF

**Response:**
```typescript
{
  urls: string[]; // Array of uploaded image URLs
}
```

**Authorization:**
- ADMIN, ACCOUNTING: Can upload

---

### 9. Upload Payment Proof Images

**POST** `/api/debts/:id/upload-payment-proof`

**Request:**
- Content-Type: `multipart/form-data`
- Field: `files` (multiple files allowed)
- Max file size: 5MB per file
- Allowed formats: JPG, PNG, PDF

**Response:**
```typescript
{
  urls: string[]; // Array of uploaded UNC image URLs
}
```

**Authorization:**
- ADMIN, ACCOUNTING: Can upload

---

### 10. Get Debts Summary by Customer

**GET** `/api/debts/summary/by-customer`

**Query Parameters:**
```typescript
{
  customerId?: string; // Optional, if not provided, returns all customers
}
```

**Response:**
```typescript
{
  customers: [
    {
      customerId: string;
      customerName: string;
      totalDebts: number;
      totalUnpaid: number;
      totalPaid: number;
      totalOverdue: number;
      countUnpaid: number;
      countPaid: number;
      countOverdue: number;
      oldestOverdueDate: string | null;
      oldestOverdueDays: number | null;
    }
  ];
}
```

**Authorization:**
- ADMIN, ACCOUNTING: Full access
- OPS: Read-only access

---

### 11. Get Debts Summary by Month

**GET** `/api/debts/summary/by-month`

**Query Parameters:**
```typescript
{
  year?: number; // Optional, default: current year
}
```

**Response:**
```typescript
{
  months: [
    {
      month: string; // "2026-02"
      totalDebts: number;
      totalUnpaid: number;
      totalPaid: number;
      totalOverdue: number;
      countUnpaid: number;
      countPaid: number;
      countOverdue: number;
    }
  ];
}
```

**Authorization:**
- ADMIN, ACCOUNTING: Full access
- OPS: Read-only access

---

## Error Responses

### 400 Bad Request
```typescript
{
  error: "Validation Error";
  message: string;
  details: {
    field: string;
    message: string;
  }[];
}
```

### 401 Unauthorized
```typescript
{
  error: "Unauthorized";
  message: "Authentication required";
}
```

### 403 Forbidden
```typescript
{
  error: "Forbidden";
  message: "You don't have permission to access this resource";
}
```

### 404 Not Found
```typescript
{
  error: "Not Found";
  message: "Debt not found";
}
```

### 409 Conflict
```typescript
{
  error: "Conflict";
  message: "Cannot update paid debt";
}
```

### 500 Internal Server Error
```typescript
{
  error: "Internal Server Error";
  message: string;
}
```

---

## Wasp Implementation

### Queries

```wasp
// Get all debts with filters
query getAllDebts {
  fn: import { getAllDebts } from "@src/debt/queries/debts",
  entities: [Debt, Customer, User]
}

// Get single debt
query getDebt {
  fn: import { getDebt } from "@src/debt/queries/debts",
  entities: [Debt, Customer, User]
}

// Get summary by customer
query getDebtsSummaryByCustomer {
  fn: import { getDebtsSummaryByCustomer } from "@src/debt/queries/summary",
  entities: [Debt, Customer]
}

// Get summary by month
query getDebtsSummaryByMonth {
  fn: import { getDebtsSummaryByMonth } from "@src/debt/queries/summary",
  entities: [Debt]
}
```

### Actions

```wasp
// Create debt
action createDebt {
  fn: import { createDebt } from "@src/debt/actions/debts",
  entities: [Debt, Customer, User]
}

// Update debt
action updateDebt {
  fn: import { updateDebt } from "@src/debt/actions/debts",
  entities: [Debt, Customer]
}

// Mark as paid
action markDebtAsPaid {
  fn: import { markDebtAsPaid } from "@src/debt/actions/payment",
  entities: [Debt]
}

// Cancel debt
action cancelDebt {
  fn: import { cancelDebt } from "@src/debt/actions/debts",
  entities: [Debt]
}

// Delete debt
action deleteDebt {
  fn: import { deleteDebt } from "@src/debt/actions/debts",
  entities: [Debt]
}

// Upload invoice images
action uploadDebtInvoiceImages {
  fn: import { uploadDebtInvoiceImages } from "@src/debt/actions/upload",
  entities: [Debt]
}

// Upload payment proof images
action uploadDebtPaymentProofImages {
  fn: import { uploadDebtPaymentProofImages } from "@src/debt/actions/upload",
  entities: [Debt]
}
```

---

## Notes

- All dates use ISO 8601 format
- All monetary amounts in VND (no decimal places needed, but schema supports 2 decimals)
- File uploads use Cloudinary (same infrastructure as POD)
- Soft delete for audit trail
- Auto-calculation of overdue status happens on query (not stored)
