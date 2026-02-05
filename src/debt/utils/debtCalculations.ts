// Utility functions for debt calculations

/**
 * Calculate due date based on recognition date and payment terms
 */
export function calculateDueDate(
  recognitionDate: Date,
  paymentTermDays: number,
  paymentTermType: 'DAYS' | 'MONTHS'
): Date {
  const dueDate = new Date(recognitionDate);
  
  if (paymentTermType === 'DAYS') {
    dueDate.setDate(dueDate.getDate() + paymentTermDays);
  } else {
    // MONTHS
    dueDate.setMonth(dueDate.getMonth() + paymentTermDays);
  }
  
  return dueDate;
}

/**
 * Check if debt is overdue
 */
export function isDebtOverdue(debt: {
  status: string;
  dueDate: Date;
}): boolean {
  if (debt.status === 'PAID' || debt.status === 'CANCELLED') {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(debt.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  return dueDate < today;
}

/**
 * Get days overdue (negative if not yet due)
 */
export function getDaysOverdue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: Date): number {
  return -getDaysOverdue(dueDate);
}

/**
 * Format debt month (YYYY-MM to MM/YYYY)
 */
export function formatDebtMonth(debtMonth: string): string {
  const [year, month] = debtMonth.split('-');
  return `${month}/${year}`;
}

/**
 * Parse debt month (MM/YYYY to YYYY-MM)
 */
export function parseDebtMonth(formatted: string): string {
  const [month, year] = formatted.split('/');
  return `${year}-${month.padStart(2, '0')}`;
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get list of months for dropdown (last 12 months + next 3 months)
 */
export function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  // Last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;
    const label = `${month}/${year}`;
    options.push({ value, label });
  }
  
  // Next 3 months
  for (let i = 1; i <= 3; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;
    const label = `${month}/${year}`;
    options.push({ value, label });
  }
  
  return options;
}
