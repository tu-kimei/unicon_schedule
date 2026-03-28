// Shipment business rules - extracted for testability

// ===== Operation Status =====

export const VALID_OPERATION_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

export const OPERATION_ROLE_PERMISSIONS: Record<string, string[]> = {
  PENDING: ['CUSTOMER_OPS', 'CUSTOMER_OWNER', 'OPS', 'ADMIN'],
  DISPATCHED: ['DISPATCHER', 'OPS', 'ADMIN'],
  IN_TRANSIT: ['DRIVER', 'ADMIN'],
  DELIVERED: ['DRIVER', 'ADMIN'],
  CANCELLED: ['CUSTOMER_OPS', 'CUSTOMER_OWNER', 'DISPATCHER', 'OPS', 'ADMIN'],
}

export function isValidOperationTransition(from: string, to: string): boolean {
  const allowed = VALID_OPERATION_TRANSITIONS[from]
  return !!allowed && allowed.includes(to)
}

export function canRoleSetOperationStatus(role: string, targetStatus: string): boolean {
  const allowed = OPERATION_ROLE_PERMISSIONS[targetStatus]
  return !!allowed && allowed.includes(role)
}

export function mapToLegacyStatus(operationStatus: string): string {
  const mapping: Record<string, string> = {
    DRAFT: 'DRAFT',
    PENDING: 'READY',
    DISPATCHED: 'ASSIGNED',
    IN_TRANSIT: 'IN_TRANSIT',
    DELIVERED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  }
  return mapping[operationStatus] || operationStatus
}

// ===== Document Status =====

export const VALID_DOCUMENT_TRANSITIONS: Record<string, string[]> = {
  DOC_PENDING: ['DOC_RECEIVED'],
  DOC_RECEIVED: ['DOC_RETURNED'],
  DOC_RETURNED: [],
}

export function isValidDocumentTransition(from: string, to: string): boolean {
  const allowed = VALID_DOCUMENT_TRANSITIONS[from]
  return !!allowed && allowed.includes(to)
}

// ===== Financial Status =====

export const VALID_FINANCIAL_TRANSITIONS: Record<string, string[]> = {
  NOT_BILLED: ['INVOICED'],
  INVOICED: ['PARTIAL_PAID', 'PAID', 'OVERDUE'],
  PARTIAL_PAID: ['PAID', 'OVERDUE'],
  PAID: [],
  OVERDUE: ['PARTIAL_PAID', 'PAID'],
}

export function isValidFinancialTransition(from: string, to: string): boolean {
  const allowed = VALID_FINANCIAL_TRANSITIONS[from]
  return !!allowed && allowed.includes(to)
}

// ===== Stop Templates =====

export const STOP_TEMPLATES = {
  EXPORT: [
    { sequence: 1, stopCategory: 'PICKUP_EMPTY', stopType: 'DEPOT', requiredPhotos: ['CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR', 'PORT_GATE_PASS'] },
    { sequence: 2, stopCategory: 'WAREHOUSE_LOAD', stopType: 'PICKUP', requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'] },
    { sequence: 3, stopCategory: 'PORT_DELIVERY', stopType: 'PORT', requiredPhotos: ['PORT_GATE_PASS'] },
  ],
  IMPORT: [
    { sequence: 1, stopCategory: 'PORT_PICKUP', stopType: 'PORT', requiredPhotos: ['PORT_GATE_PASS'] },
    { sequence: 2, stopCategory: 'WAREHOUSE_UNLOAD', stopType: 'DROPOFF', requiredPhotos: ['WAREHOUSE_GATE_PASS', 'WEIGHT_TICKET'] },
    { sequence: 3, stopCategory: 'RETURN_EMPTY', stopType: 'DEPOT', requiredPhotos: ['PORT_GATE_PASS', 'CONTAINER_EXTERIOR', 'CONTAINER_INTERIOR'] },
  ],
} as const

// ===== Role Guards =====

export const CUSTOMER_ROLES = ['CUSTOMER_OWNER', 'CUSTOMER_OPS'] as const
export const INTERNAL_ROLES = ['ADMIN', 'OPS', 'DISPATCHER', 'DRIVER', 'ACCOUNTING'] as const

export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/customer': ['CUSTOMER_OWNER', 'CUSTOMER_OPS', 'ADMIN'],
  '/dispatcher': ['DISPATCHER', 'ADMIN'],
  '/driver': ['DRIVER', 'ADMIN'],
  '/ops': ['OPS', 'ADMIN', 'DISPATCHER'],
  '/accounting': ['ACCOUNTING', 'ADMIN'],
  '/admin': ['ADMIN'],
  '/resources': ['ADMIN', 'OPS', 'DISPATCHER'],
}

export function getRedirectForRole(role: string): string {
  if (CUSTOMER_ROLES.includes(role as any)) return '/customer'
  if (role === 'DRIVER') return '/driver'
  if (role === 'DISPATCHER') return '/dispatcher'
  return '/ops/shipments'
}

// ===== Validation Helpers =====

export function validateStopSequences(stops: { sequence: number }[]): { valid: boolean; error?: string } {
  if (!stops || stops.length === 0) {
    return { valid: false, error: 'Cần ít nhất một điểm dừng' }
  }
  const sequences = stops.map(s => s.sequence).sort((a, b) => a - b)
  const hasDuplicates = sequences.some((seq, i) => i > 0 && seq === sequences[i - 1])
  if (hasDuplicates || sequences[0] !== 1) {
    return { valid: false, error: 'Thứ tự điểm dừng phải là duy nhất và bắt đầu từ 1' }
  }
  return { valid: true }
}

export function validateDateRange(startDate: string | Date, endDate: string | Date): boolean {
  return new Date(endDate) > new Date(startDate)
}
