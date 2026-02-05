# Database Migrations

**Last Updated**: 2026-02-04  
**Database**: PostgreSQL  
**ORM**: Prisma

---

## 📋 Migration History

| # | Migration | Date | Description | Status |
|---|-----------|------|-------------|--------|
| 1 | `20251222044353_init_db_for_m1` | 2025-12-22 | Initial database setup for M1 (Logistics) | ✅ Applied |
| 2 | `20251222045508_fix_sign_up` | 2025-12-22 | Fix user sign up flow | ✅ Applied |
| 3 | `20260203113316_add_debt_management` | 2026-02-03 | Add Debt Management system (M1.5) | ✅ Applied |

---

## 📝 Migration Details

### **Migration 1: init_db_for_m1** (2025-12-22)

**Purpose**: Initialize database for M1 - Core Operations (Logistics System)

**Models Created**:
- User (with roles: OPS, DISPATCHER, ACCOUNTING, DRIVER, ADMIN)
- Customer (basic info)
- Order
- Shipment
- ShipmentStop
- Vehicle
- Driver
- Dispatch
- ShipmentStatusEvent
- POD (Proof of Delivery)

**Enums Created**:
- OrderStatus (DRAFT, CONFIRMED, CANCELLED)
- ShipmentStatus (DRAFT, READY, ASSIGNED, IN_TRANSIT, COMPLETED, CANCELLED)
- Priority (LOW, NORMAL, HIGH, URGENT)
- StopType (PICKUP, DROPOFF, DEPOT, PORT)
- VehicleType (TRUCK_1T, TRUCK_3T, TRUCK_5T, TRUCK_10T, CONTAINER_TRUCK)
- VehicleStatus (AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE)
- DriverStatus (ACTIVE, INACTIVE, SUSPENDED)
- EventType (STATUS_CHANGE, EXCEPTION, NOTE)
- PODFileType (IMAGE_JPG, IMAGE_PNG, DOCUMENT_PDF)
- UserRole (OPS, DISPATCHER, ACCOUNTING, DRIVER, ADMIN)

**Indexes Created**:
- Shipment: (currentStatus, plannedStartDate)
- ShipmentStop: (shipmentId, sequence)
- ShipmentStatusEvent: (shipmentId, createdAt)
- POD: (shipmentId, isSubmitted)

---

### **Migration 2: fix_sign_up** (2025-12-22)

**Purpose**: Fix user sign up flow issues

**Changes**:
- Fixed user signup fields
- Updated email verification flow
- Adjusted password reset flow

**Impact**: Authentication system

---

### **Migration 3: add_debt_management** (2026-02-03)

**Purpose**: Add Debt Management system (M1.5)

**Models Created**:
- Debt (công nợ)

**Models Updated**:
- Customer (added payment terms)

**Enums Created**:
- DebtType (FREIGHT, ADVANCE, OTHER)
- DebtStatus (UNPAID, PAID, OVERDUE, CANCELLED)
- PaymentTermType (DAYS, MONTHS)

**Fields Added to Customer**:
- paymentTermDays (Int, default: 30)
- paymentTermType (PaymentTermType, default: DAYS)

**Debt Model Fields**:
- id, customerId, debtType, debtMonth
- amount, documentLink, invoiceImages, notes
- recognitionDate, dueDate
- status, paidAmount, paidDate
- paymentProofImages, paymentNotes
- createdById, createdAt, updatedAt, deletedAt

**Indexes Created**:
- Debt: (customerId, debtMonth)
- Debt: (status, dueDate)
- Debt: (debtMonth)

**Relations**:
- Debt → Customer
- Debt → User (createdBy)

---

## 🔄 Migration Workflow

### **Creating a New Migration**

```bash
# 1. Update schema.prisma with your changes
# 2. Create migration
npx prisma migrate dev --name descriptive_migration_name

# 3. Review generated SQL
# 4. Test migration on dev database
# 5. Commit migration files to git
```

### **Applying Migrations**

**Development**:
```bash
npx prisma migrate dev
```

**Production**:
```bash
npx prisma migrate deploy
```

### **Rolling Back**

⚠️ **Warning**: Prisma doesn't support automatic rollback. Manual intervention required.

**Steps**:
1. Restore database from backup
2. Or write manual SQL to reverse changes
3. Update schema.prisma to match database state
4. Run `npx prisma db pull` to sync

---

## 📐 Migration Best Practices

### **DO**
✅ Use descriptive migration names  
✅ Test migrations on dev database first  
✅ Backup production before migrating  
✅ Review generated SQL before applying  
✅ Add indexes for frequently queried fields  
✅ Use soft deletes (deletedAt) instead of hard deletes  
✅ Document breaking changes  

### **DON'T**
❌ Edit existing migrations (create new ones instead)  
❌ Delete migration files  
❌ Skip migrations  
❌ Apply untested migrations to production  
❌ Forget to commit migration files  

---

## 🗂️ Migration File Structure

Each migration directory contains:
```
20260203113316_add_debt_management/
├── migration.sql          # Generated SQL
└── README.md             # Optional: Migration notes
```

**Naming Convention**: `YYYYMMDDHHMMSS_descriptive_name`
- Timestamp ensures chronological order
- Descriptive name explains what changed

---

## 🔍 Checking Migration Status

```bash
# List all migrations
npx prisma migrate status

# View migration history
npx prisma migrate history

# Check if database is in sync
npx prisma migrate diff
```

---

## 🚨 Troubleshooting

### **Migration Failed**

**Symptoms**: Migration fails partway through

**Solutions**:
1. Check error message in console
2. Review generated SQL for syntax errors
3. Check database constraints
4. Restore from backup if needed
5. Fix schema.prisma
6. Create new migration

### **Database Out of Sync**

**Symptoms**: Schema doesn't match database

**Solutions**:
```bash
# Pull current database schema
npx prisma db pull

# Or reset database (DEV ONLY!)
npx prisma migrate reset
```

### **Migration Conflicts**

**Symptoms**: Multiple developers created migrations

**Solutions**:
1. Coordinate with team
2. Merge schema changes
3. Create new migration
4. Delete conflicting migrations (if not applied)

---

## 📅 Upcoming Migrations

### **Planned for M2**

**M2.1: Charge Items** (Week 3)
```prisma
model ChargeItem {
  id          String     @id @default(uuid())
  shipmentId  String
  chargeType  ChargeType
  description String
  amount      Decimal    @db.Decimal(15, 2)
  // ... more fields
}

enum ChargeType {
  FREIGHT, FUEL_SURCHARGE, TOLL, PARKING, 
  LOADING_UNLOADING, WAITING_TIME, OTHER
}
```

**M2.2: Link Debts to Shipments** (Week 4)
```prisma
model Debt {
  // ... existing fields
  shipmentId  String?   // NEW
  shipment    Shipment? @relation(...)
}
```

**M2.3: Invoice System** (Week 5)
```prisma
model Invoice {
  id              String        @id @default(uuid())
  invoiceNumber   String        @unique
  customerId      String
  status          InvoiceStatus
  // ... more fields
}

model InvoiceItem {
  id          String  @id @default(uuid())
  invoiceId   String
  description String
  amount      Decimal
  // ... more fields
}
```

---

## 🔐 Security Notes

- **Never** commit sensitive data in migrations
- **Always** use environment variables for credentials
- **Review** SQL before applying to production
- **Backup** before every production migration
- **Test** migrations on staging first

---

## 📚 References

- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Database Schema Docs](../docs/01_core/04_DATABASE_SCHEMA.md)
- [Data Migration Strategy](../docs/03_operations/DATA_MIGRATION.md)

---

**Document Status**: ✅ Active - Updated with each migration  
**Maintained By**: Backend Team
