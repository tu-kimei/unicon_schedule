import { describe, it, expect } from 'vitest'
import {
  isValidOperationTransition,
  canRoleSetOperationStatus,
  mapToLegacyStatus,
  isValidDocumentTransition,
  isValidFinancialTransition,
  validateStopSequences,
  validateDateRange,
  getRedirectForRole,
  STOP_TEMPLATES,
} from './shipmentRules'

// ===== Operation Status Transitions =====

describe('isValidOperationTransition', () => {
  // Valid transitions
  it('DRAFT → PENDING là hợp lệ', () => {
    expect(isValidOperationTransition('DRAFT', 'PENDING')).toBe(true)
  })

  it('DRAFT → CANCELLED là hợp lệ', () => {
    expect(isValidOperationTransition('DRAFT', 'CANCELLED')).toBe(true)
  })

  it('PENDING → DISPATCHED là hợp lệ', () => {
    expect(isValidOperationTransition('PENDING', 'DISPATCHED')).toBe(true)
  })

  it('DISPATCHED → IN_TRANSIT là hợp lệ', () => {
    expect(isValidOperationTransition('DISPATCHED', 'IN_TRANSIT')).toBe(true)
  })

  it('IN_TRANSIT → DELIVERED là hợp lệ', () => {
    expect(isValidOperationTransition('IN_TRANSIT', 'DELIVERED')).toBe(true)
  })

  // Invalid transitions
  it('DRAFT → DELIVERED là không hợp lệ (bỏ qua bước)', () => {
    expect(isValidOperationTransition('DRAFT', 'DELIVERED')).toBe(false)
  })

  it('DRAFT → IN_TRANSIT là không hợp lệ', () => {
    expect(isValidOperationTransition('DRAFT', 'IN_TRANSIT')).toBe(false)
  })

  it('DELIVERED → bất kỳ trạng thái nào cũng không hợp lệ (terminal)', () => {
    expect(isValidOperationTransition('DELIVERED', 'DRAFT')).toBe(false)
    expect(isValidOperationTransition('DELIVERED', 'CANCELLED')).toBe(false)
    expect(isValidOperationTransition('DELIVERED', 'PENDING')).toBe(false)
  })

  it('CANCELLED → bất kỳ trạng thái nào cũng không hợp lệ (terminal)', () => {
    expect(isValidOperationTransition('CANCELLED', 'DRAFT')).toBe(false)
    expect(isValidOperationTransition('CANCELLED', 'PENDING')).toBe(false)
  })

  it('PENDING → DRAFT là không hợp lệ (không quay lại)', () => {
    expect(isValidOperationTransition('PENDING', 'DRAFT')).toBe(false)
  })

  it('trạng thái không tồn tại trả về false', () => {
    expect(isValidOperationTransition('INVALID', 'PENDING')).toBe(false)
  })
})

// ===== Role Permissions =====

describe('canRoleSetOperationStatus', () => {
  // Customer roles
  it('CUSTOMER_OPS có thể set PENDING', () => {
    expect(canRoleSetOperationStatus('CUSTOMER_OPS', 'PENDING')).toBe(true)
  })

  it('CUSTOMER_OWNER có thể set CANCELLED', () => {
    expect(canRoleSetOperationStatus('CUSTOMER_OWNER', 'CANCELLED')).toBe(true)
  })

  it('CUSTOMER_OPS không thể set DISPATCHED', () => {
    expect(canRoleSetOperationStatus('CUSTOMER_OPS', 'DISPATCHED')).toBe(false)
  })

  it('CUSTOMER_OPS không thể set IN_TRANSIT', () => {
    expect(canRoleSetOperationStatus('CUSTOMER_OPS', 'IN_TRANSIT')).toBe(false)
  })

  // Dispatcher
  it('DISPATCHER có thể set DISPATCHED', () => {
    expect(canRoleSetOperationStatus('DISPATCHER', 'DISPATCHED')).toBe(true)
  })

  it('DISPATCHER không thể set IN_TRANSIT', () => {
    expect(canRoleSetOperationStatus('DISPATCHER', 'IN_TRANSIT')).toBe(false)
  })

  it('DISPATCHER có thể set CANCELLED', () => {
    expect(canRoleSetOperationStatus('DISPATCHER', 'CANCELLED')).toBe(true)
  })

  // Driver
  it('DRIVER có thể set IN_TRANSIT', () => {
    expect(canRoleSetOperationStatus('DRIVER', 'IN_TRANSIT')).toBe(true)
  })

  it('DRIVER có thể set DELIVERED', () => {
    expect(canRoleSetOperationStatus('DRIVER', 'DELIVERED')).toBe(true)
  })

  it('DRIVER không thể set DISPATCHED', () => {
    expect(canRoleSetOperationStatus('DRIVER', 'DISPATCHED')).toBe(false)
  })

  it('DRIVER không thể set CANCELLED', () => {
    expect(canRoleSetOperationStatus('DRIVER', 'CANCELLED')).toBe(false)
  })

  // Admin
  it('ADMIN có thể set mọi trạng thái', () => {
    expect(canRoleSetOperationStatus('ADMIN', 'PENDING')).toBe(true)
    expect(canRoleSetOperationStatus('ADMIN', 'DISPATCHED')).toBe(true)
    expect(canRoleSetOperationStatus('ADMIN', 'IN_TRANSIT')).toBe(true)
    expect(canRoleSetOperationStatus('ADMIN', 'DELIVERED')).toBe(true)
    expect(canRoleSetOperationStatus('ADMIN', 'CANCELLED')).toBe(true)
  })

  // OPS
  it('OPS có thể set PENDING và DISPATCHED', () => {
    expect(canRoleSetOperationStatus('OPS', 'PENDING')).toBe(true)
    expect(canRoleSetOperationStatus('OPS', 'DISPATCHED')).toBe(true)
  })

  it('OPS không thể set IN_TRANSIT', () => {
    expect(canRoleSetOperationStatus('OPS', 'IN_TRANSIT')).toBe(false)
  })

  // ACCOUNTING không có quyền
  it('ACCOUNTING không thể set bất kỳ operation status', () => {
    expect(canRoleSetOperationStatus('ACCOUNTING', 'PENDING')).toBe(false)
    expect(canRoleSetOperationStatus('ACCOUNTING', 'DISPATCHED')).toBe(false)
  })
})

// ===== Legacy Status Mapping =====

describe('mapToLegacyStatus', () => {
  it('DRAFT → DRAFT', () => {
    expect(mapToLegacyStatus('DRAFT')).toBe('DRAFT')
  })

  it('PENDING → READY', () => {
    expect(mapToLegacyStatus('PENDING')).toBe('READY')
  })

  it('DISPATCHED → ASSIGNED', () => {
    expect(mapToLegacyStatus('DISPATCHED')).toBe('ASSIGNED')
  })

  it('IN_TRANSIT → IN_TRANSIT', () => {
    expect(mapToLegacyStatus('IN_TRANSIT')).toBe('IN_TRANSIT')
  })

  it('DELIVERED → COMPLETED', () => {
    expect(mapToLegacyStatus('DELIVERED')).toBe('COMPLETED')
  })

  it('CANCELLED → CANCELLED', () => {
    expect(mapToLegacyStatus('CANCELLED')).toBe('CANCELLED')
  })

  it('trạng thái không xác định trả về chính nó', () => {
    expect(mapToLegacyStatus('UNKNOWN')).toBe('UNKNOWN')
  })
})

// ===== Document Status Transitions =====

describe('isValidDocumentTransition', () => {
  it('DOC_PENDING → DOC_RECEIVED là hợp lệ', () => {
    expect(isValidDocumentTransition('DOC_PENDING', 'DOC_RECEIVED')).toBe(true)
  })

  it('DOC_RECEIVED → DOC_RETURNED là hợp lệ', () => {
    expect(isValidDocumentTransition('DOC_RECEIVED', 'DOC_RETURNED')).toBe(true)
  })

  it('DOC_PENDING → DOC_RETURNED là không hợp lệ (bỏ qua bước)', () => {
    expect(isValidDocumentTransition('DOC_PENDING', 'DOC_RETURNED')).toBe(false)
  })

  it('DOC_RETURNED → bất kỳ là không hợp lệ (terminal)', () => {
    expect(isValidDocumentTransition('DOC_RETURNED', 'DOC_PENDING')).toBe(false)
    expect(isValidDocumentTransition('DOC_RETURNED', 'DOC_RECEIVED')).toBe(false)
  })
})

// ===== Financial Status Transitions =====

describe('isValidFinancialTransition', () => {
  it('NOT_BILLED → INVOICED là hợp lệ', () => {
    expect(isValidFinancialTransition('NOT_BILLED', 'INVOICED')).toBe(true)
  })

  it('INVOICED → PARTIAL_PAID là hợp lệ', () => {
    expect(isValidFinancialTransition('INVOICED', 'PARTIAL_PAID')).toBe(true)
  })

  it('INVOICED → PAID là hợp lệ', () => {
    expect(isValidFinancialTransition('INVOICED', 'PAID')).toBe(true)
  })

  it('INVOICED → OVERDUE là hợp lệ', () => {
    expect(isValidFinancialTransition('INVOICED', 'OVERDUE')).toBe(true)
  })

  it('PARTIAL_PAID → PAID là hợp lệ', () => {
    expect(isValidFinancialTransition('PARTIAL_PAID', 'PAID')).toBe(true)
  })

  it('OVERDUE → PAID là hợp lệ', () => {
    expect(isValidFinancialTransition('OVERDUE', 'PAID')).toBe(true)
  })

  it('NOT_BILLED → PAID là không hợp lệ (bỏ qua bước)', () => {
    expect(isValidFinancialTransition('NOT_BILLED', 'PAID')).toBe(false)
  })

  it('PAID → bất kỳ là không hợp lệ (terminal)', () => {
    expect(isValidFinancialTransition('PAID', 'NOT_BILLED')).toBe(false)
    expect(isValidFinancialTransition('PAID', 'OVERDUE')).toBe(false)
  })
})

// ===== Stop Validation =====

describe('validateStopSequences', () => {
  it('stops hợp lệ với sequence 1, 2, 3', () => {
    const result = validateStopSequences([
      { sequence: 1 },
      { sequence: 2 },
      { sequence: 3 },
    ])
    expect(result.valid).toBe(true)
  })

  it('stops rỗng là không hợp lệ', () => {
    const result = validateStopSequences([])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('ít nhất một điểm dừng')
  })

  it('null stops là không hợp lệ', () => {
    const result = validateStopSequences(null as any)
    expect(result.valid).toBe(false)
  })

  it('sequence trùng lặp là không hợp lệ', () => {
    const result = validateStopSequences([
      { sequence: 1 },
      { sequence: 1 },
    ])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('duy nhất')
  })

  it('sequence không bắt đầu từ 1 là không hợp lệ', () => {
    const result = validateStopSequences([
      { sequence: 2 },
      { sequence: 3 },
    ])
    expect(result.valid).toBe(false)
  })

  it('một stop duy nhất sequence 1 là hợp lệ', () => {
    const result = validateStopSequences([{ sequence: 1 }])
    expect(result.valid).toBe(true)
  })
})

// ===== Date Validation =====

describe('validateDateRange', () => {
  it('ngày kết thúc sau ngày bắt đầu là hợp lệ', () => {
    expect(validateDateRange('2026-03-01', '2026-03-15')).toBe(true)
  })

  it('ngày kết thúc trước ngày bắt đầu là không hợp lệ', () => {
    expect(validateDateRange('2026-03-15', '2026-03-01')).toBe(false)
  })

  it('ngày bắt đầu và kết thúc cùng ngày là không hợp lệ', () => {
    expect(validateDateRange('2026-03-01', '2026-03-01')).toBe(false)
  })
})

// ===== Stop Templates =====

describe('STOP_TEMPLATES', () => {
  it('EXPORT có 3 stops', () => {
    expect(STOP_TEMPLATES.EXPORT).toHaveLength(3)
  })

  it('IMPORT có 3 stops', () => {
    expect(STOP_TEMPLATES.IMPORT).toHaveLength(3)
  })

  it('EXPORT bắt đầu bằng PICKUP_EMPTY', () => {
    expect(STOP_TEMPLATES.EXPORT[0].stopCategory).toBe('PICKUP_EMPTY')
  })

  it('EXPORT kết thúc bằng PORT_DELIVERY', () => {
    expect(STOP_TEMPLATES.EXPORT[2].stopCategory).toBe('PORT_DELIVERY')
  })

  it('IMPORT bắt đầu bằng PORT_PICKUP', () => {
    expect(STOP_TEMPLATES.IMPORT[0].stopCategory).toBe('PORT_PICKUP')
  })

  it('IMPORT kết thúc bằng RETURN_EMPTY', () => {
    expect(STOP_TEMPLATES.IMPORT[2].stopCategory).toBe('RETURN_EMPTY')
  })

  it('mỗi stop EXPORT có requiredPhotos', () => {
    STOP_TEMPLATES.EXPORT.forEach(stop => {
      expect(stop.requiredPhotos.length).toBeGreaterThan(0)
    })
  })

  it('mỗi stop IMPORT có requiredPhotos', () => {
    STOP_TEMPLATES.IMPORT.forEach(stop => {
      expect(stop.requiredPhotos.length).toBeGreaterThan(0)
    })
  })

  it('sequences bắt đầu từ 1 và liên tục', () => {
    STOP_TEMPLATES.EXPORT.forEach((stop, i) => {
      expect(stop.sequence).toBe(i + 1)
    })
    STOP_TEMPLATES.IMPORT.forEach((stop, i) => {
      expect(stop.sequence).toBe(i + 1)
    })
  })
})

// ===== Role Redirect =====

describe('getRedirectForRole', () => {
  it('CUSTOMER_OWNER redirect về /customer', () => {
    expect(getRedirectForRole('CUSTOMER_OWNER')).toBe('/customer')
  })

  it('CUSTOMER_OPS redirect về /customer', () => {
    expect(getRedirectForRole('CUSTOMER_OPS')).toBe('/customer')
  })

  it('DRIVER redirect về /driver', () => {
    expect(getRedirectForRole('DRIVER')).toBe('/driver')
  })

  it('DISPATCHER redirect về /dispatcher', () => {
    expect(getRedirectForRole('DISPATCHER')).toBe('/dispatcher')
  })

  it('ADMIN redirect về /ops/shipments', () => {
    expect(getRedirectForRole('ADMIN')).toBe('/ops/shipments')
  })

  it('OPS redirect về /ops/shipments', () => {
    expect(getRedirectForRole('OPS')).toBe('/ops/shipments')
  })

  it('ACCOUNTING redirect về /ops/shipments', () => {
    expect(getRedirectForRole('ACCOUNTING')).toBe('/ops/shipments')
  })
})
