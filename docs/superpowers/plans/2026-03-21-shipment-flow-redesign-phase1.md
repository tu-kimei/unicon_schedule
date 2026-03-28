# Shipment Flow Redesign - Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign luồng shipment container logistics với 3-tier status, DriverTask thay Dispatch, stop templates EXPORT/IMPORT, photo categories, in-app notifications, và document status tracking.

**Architecture:** Refactor dần trên nền Wasp hiện tại. Mở rộng schema (thêm enums, fields, entities mới), refactor actions/queries, cập nhật UI. Giữ nguyên Auth, User/Admin, Debt/Invoice, Customer modules.

**Tech Stack:** Wasp 0.21, TypeScript, Prisma, React, Tailwind CSS, PostgreSQL

**Spec:** `docs/superpowers/specs/2026-03-21-shipment-flow-redesign-design.md`

---

## Task 1: Schema - Thêm enums mới

**Files:**
- Modify: `schema.prisma`

- [ ] **Step 1: Thêm enums cho 3-tier status và stop categories**

Thêm vào cuối file `schema.prisma`:

```prisma
enum ShipmentType {
  EXPORT
  IMPORT
}

enum OperationStatus {
  DRAFT
  PENDING
  DISPATCHED
  IN_TRANSIT
  DELIVERED
  CANCELLED
}

enum DocumentStatus {
  DOC_PENDING
  DOC_RECEIVED
  DOC_RETURNED
}

enum FinancialStatus {
  NOT_BILLED
  INVOICED
  PARTIAL_PAID
  PAID
  OVERDUE
}

enum StopCategory {
  PICKUP_EMPTY
  WAREHOUSE_LOAD
  PORT_DELIVERY
  PORT_PICKUP
  WAREHOUSE_UNLOAD
  RETURN_EMPTY
}

enum PhotoCategory {
  CONTAINER_EXTERIOR
  CONTAINER_INTERIOR
  PORT_GATE_PASS
  WAREHOUSE_GATE_PASS
  WEIGHT_TICKET
  OTHER
}

enum DriverTaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

enum NotificationType {
  ORDER_CREATED
  DISPATCHED
  STOP_CHECKIN
  PHOTO_UPLOADED
  DELIVERED
  DOC_RETURNED
  INVOICED
  NOTI_OVERDUE
}

enum ReferenceType {
  REF_SHIPMENT
  REF_INVOICE
  REF_DOCUMENT
}
```

Note: Sử dụng prefix `DOC_`, `NOTI_`, `REF_` cho một số enum values để tránh conflict với enum values đã tồn tại (ví dụ `OVERDUE` trong `DebtStatus`/`InvoiceStatus`). Prisma 5+ cho phép duplicate enum values giữa các enum khác nhau (ví dụ `PENDING` trong `ShipmentStatus` và `DriverTaskStatus` đều OK).

**Lưu ý: Tasks 1-6 schema changes nên được gộp thành 1 migration duy nhất** thay vì chạy migrate riêng lẻ. Chỉ chạy `wasp db migrate-dev` sau khi hoàn tất tất cả thay đổi schema (cuối Task 6).

- [ ] **Step 2: Commit code (chưa migrate)**

```bash
git add schema.prisma
git commit -m "feat: add new enums for 3-tier status, stop categories, photo categories, driver task, notification"
```

---

## Task 2: Schema - Mở rộng Shipment model

**Files:**
- Modify: `schema.prisma`

- [ ] **Step 1: Thêm fields mới vào model Shipment**

Thêm các fields sau vào model `Shipment` (sau field `currentStatus`):

```prisma
  shipmentType      ShipmentType?
  operationStatus   OperationStatus  @default(DRAFT)
  documentStatus    DocumentStatus   @default(DOC_PENDING)
  financialStatus   FinancialStatus  @default(NOT_BILLED)
```

Thêm relation cho DriverTask (sau relation `dispatch`):

```prisma
  driverTasks       DriverTask[]
```

- [ ] **Step 2: Commit (chưa migrate - gộp vào cuối Task 6)**

```bash
git add schema.prisma
git commit -m "feat: extend Shipment with shipmentType, 3-tier status fields, driverTasks relation"
```

---

## Task 3: Schema - Mở rộng ShipmentStop model

**Files:**
- Modify: `schema.prisma`

- [ ] **Step 1: Thêm fields mới vào model ShipmentStop**

Thêm sau field `stopType`:

```prisma
  stopCategory      StopCategory?
  requiredPhotos    String[]         @default([])
```

- [ ] **Step 2: Commit (chưa migrate - gộp vào cuối Task 6)**

```bash
git add schema.prisma
git commit -m "feat: extend ShipmentStop with stopCategory and requiredPhotos"
```

---

## Task 4: Schema - Mở rộng POD model

**Files:**
- Modify: `schema.prisma`

- [ ] **Step 1: Thêm photoCategory vào model POD**

Thêm sau field `fileType`:

```prisma
  photoCategory     PhotoCategory?
```

- [ ] **Step 2: Commit (chưa migrate - gộp vào cuối Task 6)**

```bash
git add schema.prisma
git commit -m "feat: extend POD with photoCategory"
```

---

## Task 5: Schema - Tạo model DriverTask

**Files:**
- Modify: `schema.prisma`

- [ ] **Step 1: Thêm model DriverTask**

```prisma
model DriverTask {
  id            String           @id @default(uuid())
  driverId      String
  driver        Driver           @relation(fields: [driverId], references: [id])
  shipmentId    String
  shipment      Shipment         @relation(fields: [shipmentId], references: [id])
  tractorId     String
  tractor       Vehicle          @relation("TractorTasks", fields: [tractorId], references: [id])
  trailerId     String?
  trailer       Vehicle?         @relation("TrailerTasks", fields: [trailerId], references: [id])
  sequence      Int
  instructions  String?
  status        DriverTaskStatus @default(PENDING)
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@map("driver_tasks")
}
```

- [ ] **Step 2: Thêm relations vào Driver và Vehicle**

Thêm vào model `Driver`:
```prisma
  driverTasks    DriverTask[]
```

Thêm vào model `Vehicle`:
```prisma
  tractorTasks   DriverTask[]  @relation("TractorTasks")
  trailerTasks   DriverTask[]  @relation("TrailerTasks")
```

- [ ] **Step 3: Commit (chưa migrate - gộp vào cuối Task 6)**

```bash
git add schema.prisma
git commit -m "feat: create DriverTask model replacing Dispatch for multi-trip assignment"
```

---

## Task 6: Schema - Tạo model Notification

**Files:**
- Modify: `schema.prisma`

- [ ] **Step 1: Thêm model Notification**

```prisma
model Notification {
  id            String           @id @default(uuid())
  userId        String
  user          User             @relation(fields: [userId], references: [id])
  type          NotificationType
  title         String
  message       String
  referenceId   String?
  referenceType ReferenceType?
  channels      String[]         @default(["IN_APP"])
  isRead        Boolean          @default(false)
  sentAt        DateTime         @default(now())
  readAt        DateTime?

  @@index([userId, isRead])
  @@index([sentAt])
  @@map("notifications")
}
```

- [ ] **Step 2: Thêm relation vào User**

Thêm vào model `User`:
```prisma
  notifications  Notification[]
```

- [ ] **Step 3: Chạy migrate TẤT CẢ schema changes (Tasks 1-6 gộp)**

Run: `wasp db migrate-dev --name shipment-flow-redesign-schema`
Expected: Migration thành công với tất cả enums mới, fields mở rộng, models DriverTask và Notification

- [ ] **Step 4: Commit**

```bash
git add schema.prisma migrations/
git commit -m "feat: create Notification model and run batched migration for all schema changes"
```

---

## Task 7: Data Migration - Dispatch → DriverTask

**Dependencies:** Tasks 2, 5, 6 (schema phải đã migrate xong)

**Files:**
- Create: `migrations/manual/migrate-dispatch-to-driver-task.ts`

- [ ] **Step 1: Viết script migration**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dispatches = await prisma.dispatch.findMany({
    include: { shipment: true }
  })

  for (const dispatch of dispatches) {
    await prisma.driverTask.create({
      data: {
        driverId: dispatch.driverId,
        shipmentId: dispatch.shipmentId,
        tractorId: dispatch.vehicleId,
        trailerId: null,
        sequence: 1,
        instructions: dispatch.notes,
        status: dispatch.shipment.currentStatus === 'COMPLETED' ? 'COMPLETED' :
                dispatch.shipment.currentStatus === 'IN_TRANSIT' ? 'IN_PROGRESS' : 'PENDING',
        startedAt: dispatch.shipment.actualStartDate,
        completedAt: dispatch.shipment.actualEndDate,
      }
    })
  }

  console.log(`Migrated ${dispatches.length} dispatches to driver tasks`)

  // Migrate currentStatus → operationStatus
  const shipments = await prisma.shipment.findMany()
  for (const shipment of shipments) {
    const statusMap: Record<string, string> = {
      'DRAFT': 'DRAFT',
      'READY': 'PENDING',
      'ASSIGNED': 'DISPATCHED',
      'IN_TRANSIT': 'IN_TRANSIT',
      'COMPLETED': 'DELIVERED',
      'CANCELLED': 'CANCELLED',
    }
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        operationStatus: statusMap[shipment.currentStatus] as any,
      }
    })
  }

  console.log(`Migrated ${shipments.length} shipment statuses`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Chạy migration script**

Run: `npx tsx migrations/manual/migrate-dispatch-to-driver-task.ts`
Expected: Output hiển thị số records migrated

- [ ] **Step 3: Commit**

```bash
git add migrations/manual/
git commit -m "feat: migrate existing Dispatch records to DriverTask and sync operationStatus"
```

---

## Task 8: Wasp - Đăng ký DriverTask entity và operations mới

**Files:**
- Modify: `main.wasp`

- [ ] **Step 1: Thêm DriverTask entity declaration**

Thêm vào `main.wasp` (sau các entity declarations khác):

```wasp
entity DriverTask {=psl
  // defined in schema.prisma
psl=}

entity Notification {=psl
  // defined in schema.prisma
psl=}
```

- [ ] **Step 2: Đăng ký queries cho DriverTask**

```wasp
query getDriverTasks {
  fn: import { getDriverTasks } from "@src/logistics/queries/driverTasks",
  entities: [DriverTask, Shipment, Driver, Vehicle, ShipmentStop]
}

query getDriverTasksByDriver {
  fn: import { getDriverTasksByDriver } from "@src/logistics/queries/driverTasks",
  entities: [DriverTask, Shipment, Driver, Vehicle, ShipmentStop]
}
```

- [ ] **Step 3: Đăng ký actions cho DriverTask**

```wasp
action createDriverTask {
  fn: import { createDriverTask } from "@src/logistics/actions/driverTasks",
  entities: [DriverTask, Shipment, Vehicle, Driver, ShipmentStatusEvent, Notification, User]
}

action updateDriverTaskSequence {
  fn: import { updateDriverTaskSequence } from "@src/logistics/actions/driverTasks",
  entities: [DriverTask]
}

action updateDriverTaskStatus {
  fn: import { updateDriverTaskStatus } from "@src/logistics/actions/driverTasks",
  entities: [DriverTask, Shipment, ShipmentStop, ShipmentStatusEvent, Notification, User]
}
```

- [ ] **Step 4: Đăng ký queries/actions cho Notification**

```wasp
query getNotifications {
  fn: import { getNotifications } from "@src/notifications/queries",
  entities: [Notification]
}

query getUnreadNotificationCount {
  fn: import { getUnreadNotificationCount } from "@src/notifications/queries",
  entities: [Notification]
}

action markNotificationRead {
  fn: import { markNotificationRead } from "@src/notifications/actions",
  entities: [Notification]
}

action markAllNotificationsRead {
  fn: import { markAllNotificationsRead } from "@src/notifications/actions",
  entities: [Notification]
}
```

- [ ] **Step 5: Đăng ký action mới cho shipment status updates**

```wasp
action updateOperationStatus {
  fn: import { updateOperationStatus } from "@src/logistics/actions/operationStatus",
  entities: [Shipment, ShipmentStop, ShipmentStatusEvent, DriverTask, Notification, User]
}

action updateDocumentStatus {
  fn: import { updateDocumentStatus } from "@src/logistics/actions/documentStatus",
  entities: [Shipment, Notification, User]
}
```

- [ ] **Step 6: Commit**

```bash
git add main.wasp
git commit -m "feat: register DriverTask, Notification entities and new operations in main.wasp"
```

---

## Task 9: Actions - createDriverTask (thay createDispatch)

**Files:**
- Create: `src/logistics/actions/driverTasks.ts`

- [ ] **Step 1: Implement createDriverTask**

```typescript
import { type CreateDriverTask, type UpdateDriverTaskSequence, type UpdateDriverTaskStatus } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

type CreateDriverTaskInput = {
  shipmentId: string
  driverId: string
  tractorId: string
  trailerId?: string
  sequence?: number
  instructions?: string
}

export const createDriverTask: CreateDriverTask<CreateDriverTaskInput, any> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  const allowedRoles = ['ADMIN', 'DISPATCHER']
  if (!allowedRoles.includes(context.user.role)) {
    throw new HttpError(403, 'Not authorized')
  }

  // Validate shipment exists and is PENDING
  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId },
    include: { driverTasks: true }
  })
  if (!shipment) throw new HttpError(404, 'Shipment not found')
  if (shipment.operationStatus !== 'PENDING' && shipment.operationStatus !== 'DRAFT') {
    throw new HttpError(400, 'Shipment must be in PENDING or DRAFT status to assign')
  }

  // Validate tractor
  const tractor = await context.entities.Vehicle.findUnique({ where: { id: args.tractorId } })
  if (!tractor) throw new HttpError(404, 'Tractor not found')
  if (tractor.vehicleType !== 'TRACTOR') throw new HttpError(400, 'Vehicle must be a TRACTOR')
  if (tractor.status === 'OUT_OF_SERVICE') throw new HttpError(400, 'Tractor is out of service')

  // Validate trailer if provided
  if (args.trailerId) {
    const trailer = await context.entities.Vehicle.findUnique({ where: { id: args.trailerId } })
    if (!trailer) throw new HttpError(404, 'Trailer not found')
    if (trailer.vehicleType !== 'TRAILER') throw new HttpError(400, 'Vehicle must be a TRAILER')
    if (trailer.status === 'OUT_OF_SERVICE') throw new HttpError(400, 'Trailer is out of service')
  }

  // Validate driver
  const driver = await context.entities.Driver.findUnique({ where: { id: args.driverId } })
  if (!driver) throw new HttpError(404, 'Driver not found')
  if (driver.status !== 'ACTIVE') throw new HttpError(400, 'Driver is not active')

  // Determine sequence
  const maxSequence = shipment.driverTasks.length > 0
    ? Math.max(...shipment.driverTasks.map(t => t.sequence))
    : 0
  const sequence = args.sequence ?? maxSequence + 1

  // Create driver task + update shipment status
  const driverTask = await context.entities.DriverTask.create({
    data: {
      driverId: args.driverId,
      shipmentId: args.shipmentId,
      tractorId: args.tractorId,
      trailerId: args.trailerId ?? null,
      sequence,
      instructions: args.instructions ?? null,
      status: 'PENDING',
    }
  })

  // Update shipment to DISPATCHED
  await context.entities.Shipment.update({
    where: { id: args.shipmentId },
    data: {
      operationStatus: 'DISPATCHED',
      currentStatus: 'ASSIGNED',
    }
  })

  // Create status event
  await context.entities.ShipmentStatusEvent.create({
    data: {
      shipmentId: args.shipmentId,
      status: 'ASSIGNED',
      eventType: 'STATUS_CHANGE',
      description: `Dispatched to driver ${driver.fullName} with tractor ${tractor.licensePlate}`,
      createdById: context.user.id,
    }
  })

  // Create notifications for driver and customer
  if (driver.userId) {
    await context.entities.Notification.create({
      data: {
        userId: driver.userId,
        type: 'DISPATCHED',
        title: 'Chuyến mới được gán',
        message: `Bạn được gán chuyến ${shipment.shipmentNumber}`,
        referenceId: args.shipmentId,
        referenceType: 'REF_SHIPMENT',
        channels: ['IN_APP'],
      }
    })
  }

  // Notify customer
  const customerUsers = await context.entities.User.findMany({
    where: { customerId: shipment.customerId, isActive: true }
  })
  for (const cu of customerUsers) {
    await context.entities.Notification.create({
      data: {
        userId: cu.id,
        type: 'DISPATCHED',
        title: 'Chuyến hàng đã được điều phối',
        message: `Chuyến ${shipment.shipmentNumber} đã được gán xe và tài xế`,
        referenceId: args.shipmentId,
        referenceType: 'REF_SHIPMENT',
        channels: ['IN_APP'],
      }
    })
  }

  return driverTask
}
```

- [ ] **Step 2: Implement updateDriverTaskSequence**

```typescript
type UpdateSequenceInput = {
  driverId: string
  tasks: { id: string; sequence: number }[]
}

export const updateDriverTaskSequence: UpdateDriverTaskSequence<UpdateSequenceInput, void> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  const allowedRoles = ['ADMIN', 'DISPATCHER']
  if (!allowedRoles.includes(context.user.role)) {
    throw new HttpError(403, 'Not authorized')
  }

  for (const task of args.tasks) {
    await context.entities.DriverTask.update({
      where: { id: task.id },
      data: { sequence: task.sequence }
    })
  }
}
```

- [ ] **Step 3: Implement updateDriverTaskStatus**

```typescript
type UpdateDriverTaskStatusInput = {
  driverTaskId: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  stopUpdates?: {
    stopId: string
    actualArrival?: string
    actualDeparture?: string
  }[]
}

export const updateDriverTaskStatus: UpdateDriverTaskStatus<UpdateDriverTaskStatusInput, any> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  const driverTask = await context.entities.DriverTask.findUnique({
    where: { id: args.driverTaskId },
    include: { shipment: { include: { stops: true } }, driver: true }
  })
  if (!driverTask) throw new HttpError(404, 'Driver task not found')

  // Validate: driver can only update own tasks, dispatcher/admin can update any
  const allowedRoles = ['ADMIN', 'DISPATCHER', 'DRIVER']
  if (!allowedRoles.includes(context.user.role)) {
    throw new HttpError(403, 'Not authorized')
  }
  if (context.user.role === 'DRIVER') {
    const driver = await context.entities.Driver.findFirst({ where: { userId: context.user.id } })
    if (!driver || driver.id !== driverTask.driverId) {
      throw new HttpError(403, 'Not authorized to update this task')
    }
  }

  // Update driver task status
  const now = new Date()
  const updateData: any = { status: args.status }
  if (args.status === 'IN_PROGRESS') updateData.startedAt = now
  if (args.status === 'COMPLETED') updateData.completedAt = now

  await context.entities.DriverTask.update({
    where: { id: args.driverTaskId },
    data: updateData
  })

  // Update shipment operation status based on task status
  if (args.status === 'IN_PROGRESS' && driverTask.shipment.operationStatus === 'DISPATCHED') {
    await context.entities.Shipment.update({
      where: { id: driverTask.shipmentId },
      data: {
        operationStatus: 'IN_TRANSIT',
        currentStatus: 'IN_TRANSIT',
        actualStartDate: now,
      }
    })
    await context.entities.ShipmentStatusEvent.create({
      data: {
        shipmentId: driverTask.shipmentId,
        status: 'IN_TRANSIT',
        eventType: 'STATUS_CHANGE',
        description: 'Driver started trip',
        createdById: context.user.id,
      }
    })

    // Notify customer
    const customerUsers = await context.entities.User.findMany({
      where: { customerId: driverTask.shipment.customerId, isActive: true }
    })
    for (const cu of customerUsers) {
      await context.entities.Notification.create({
        data: {
          userId: cu.id,
          type: 'STOP_CHECKIN',
          title: 'Tài xế bắt đầu chuyến',
          message: `Chuyến ${driverTask.shipment.shipmentNumber} đang được vận chuyển`,
          referenceId: driverTask.shipmentId,
          referenceType: 'REF_SHIPMENT',
          channels: ['IN_APP'],
        }
      })
    }
  }

  if (args.status === 'COMPLETED') {
    // Check if all driver tasks for this shipment are completed
    const allTasks = await context.entities.DriverTask.findMany({
      where: { shipmentId: driverTask.shipmentId }
    })
    const allCompleted = allTasks.every(t =>
      t.id === args.driverTaskId ? true : t.status === 'COMPLETED' || t.status === 'SKIPPED'
    )

    if (allCompleted) {
      await context.entities.Shipment.update({
        where: { id: driverTask.shipmentId },
        data: {
          operationStatus: 'DELIVERED',
          currentStatus: 'COMPLETED',
          actualEndDate: now,
        }
      })
      await context.entities.ShipmentStatusEvent.create({
        data: {
          shipmentId: driverTask.shipmentId,
          status: 'COMPLETED',
          eventType: 'STATUS_CHANGE',
          description: 'All driver tasks completed - shipment delivered',
          createdById: context.user.id,
        }
      })

      // Notify customer and OPS
      const customerUsers = await context.entities.User.findMany({
        where: { customerId: driverTask.shipment.customerId, isActive: true }
      })
      for (const cu of customerUsers) {
        await context.entities.Notification.create({
          data: {
            userId: cu.id,
            type: 'DELIVERED',
            title: 'Chuyến hàng hoàn tất',
            message: `Chuyến ${driverTask.shipment.shipmentNumber} đã giao thành công`,
            referenceId: driverTask.shipmentId,
            referenceType: 'REF_SHIPMENT',
            channels: ['IN_APP'],
          }
        })
      }
    }
  }

  // Update stop times if provided
  if (args.stopUpdates) {
    for (const su of args.stopUpdates) {
      await context.entities.ShipmentStop.update({
        where: { id: su.stopId },
        data: {
          actualArrival: su.actualArrival ? new Date(su.actualArrival) : undefined,
          actualDeparture: su.actualDeparture ? new Date(su.actualDeparture) : undefined,
        }
      })
    }
  }

  return { success: true }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/logistics/actions/driverTasks.ts
git commit -m "feat: implement DriverTask actions - create, reorder, status update with notifications"
```

---

## Task 10: Queries - DriverTask queries

**Files:**
- Create: `src/logistics/queries/driverTasks.ts`

- [ ] **Step 1: Implement getDriverTasks**

```typescript
import { type GetDriverTasks, type GetDriverTasksByDriver } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

export const getDriverTasks: GetDriverTasks<{ shipmentId?: string }, any[]> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  const where: any = {}
  if (args.shipmentId) where.shipmentId = args.shipmentId

  return context.entities.DriverTask.findMany({
    where,
    include: {
      driver: true,
      shipment: {
        include: {
          customer: true,
          stops: { orderBy: { sequence: 'asc' } },
        }
      },
      tractor: true,
      trailer: true,
    },
    orderBy: { sequence: 'asc' }
  })
}

export const getDriverTasksByDriver: GetDriverTasksByDriver<{ driverId?: string; date?: string }, any[]> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  // If DRIVER role, get own tasks
  let driverId = args.driverId
  if (context.user.role === 'DRIVER') {
    const driver = await context.entities.Driver.findFirst({ where: { userId: context.user.id } })
    if (!driver) throw new HttpError(404, 'Driver profile not found')
    driverId = driver.id
  }

  if (!driverId) throw new HttpError(400, 'driverId required')

  const where: any = { driverId }
  if (args.date) {
    const start = new Date(args.date)
    const end = new Date(args.date)
    end.setDate(end.getDate() + 1)
    where.createdAt = { gte: start, lt: end }
  }

  return context.entities.DriverTask.findMany({
    where,
    include: {
      shipment: {
        include: {
          customer: true,
          stops: { orderBy: { sequence: 'asc' } },
        }
      },
      tractor: true,
      trailer: true,
    },
    orderBy: { sequence: 'asc' }
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/logistics/queries/driverTasks.ts
git commit -m "feat: implement DriverTask queries - getDriverTasks and getDriverTasksByDriver"
```

---

## Task 11: Actions - Operation & Document Status

**Files:**
- Create: `src/logistics/actions/operationStatus.ts`
- Create: `src/logistics/actions/documentStatus.ts`

- [ ] **Step 1: Implement updateOperationStatus**

```typescript
import { type UpdateOperationStatus } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

type UpdateOperationStatusInput = {
  shipmentId: string
  status: string
  description?: string
}

const validTransitions: Record<string, string[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
}

const rolePermissions: Record<string, string[]> = {
  CUSTOMER_OPS: ['PENDING', 'CANCELLED'],
  CUSTOMER_OWNER: ['PENDING', 'CANCELLED'],
  DISPATCHER: ['DISPATCHED', 'CANCELLED'],
  DRIVER: ['IN_TRANSIT', 'DELIVERED'],
  OPS: ['PENDING', 'DISPATCHED'],
  ADMIN: ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
}

export const updateOperationStatus: UpdateOperationStatus<UpdateOperationStatusInput, any> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId }
  })
  if (!shipment) throw new HttpError(404, 'Shipment not found')

  // Validate transition
  const allowed = validTransitions[shipment.operationStatus]
  if (!allowed || !allowed.includes(args.status)) {
    throw new HttpError(400, `Cannot transition from ${shipment.operationStatus} to ${args.status}`)
  }

  // Validate role
  const roleAllowed = rolePermissions[context.user.role]
  if (!roleAllowed || !roleAllowed.includes(args.status)) {
    throw new HttpError(403, `Role ${context.user.role} cannot set status to ${args.status}`)
  }

  // Customer can only cancel own shipments
  if (context.user.userType === 'CUSTOMER') {
    if (shipment.customerId !== context.user.customerId) {
      throw new HttpError(403, 'Not authorized for this shipment')
    }
    if (!['DRAFT', 'PENDING'].includes(shipment.operationStatus)) {
      throw new HttpError(400, 'Customer can only cancel DRAFT or PENDING shipments')
    }
  }

  // Map new status to legacy currentStatus for backwards compatibility
  const statusMap: Record<string, string> = {
    DRAFT: 'DRAFT',
    PENDING: 'READY',
    DISPATCHED: 'ASSIGNED',
    IN_TRANSIT: 'IN_TRANSIT',
    DELIVERED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  }

  await context.entities.Shipment.update({
    where: { id: args.shipmentId },
    data: {
      operationStatus: args.status as any,
      currentStatus: statusMap[args.status] as any,
    }
  })

  await context.entities.ShipmentStatusEvent.create({
    data: {
      shipmentId: args.shipmentId,
      status: statusMap[args.status],
      eventType: 'STATUS_CHANGE',
      description: args.description ?? `Status changed to ${args.status}`,
      createdById: context.user.id,
    }
  })

  return { success: true }
}
```

- [ ] **Step 2: Implement updateDocumentStatus**

```typescript
import { type UpdateDocumentStatus } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

type UpdateDocumentStatusInput = {
  shipmentId: string
  status: 'DOC_RECEIVED' | 'DOC_RETURNED'
}

export const updateDocumentStatus: UpdateDocumentStatus<UpdateDocumentStatusInput, any> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  const allowedRoles = ['ADMIN', 'OPS']
  if (!allowedRoles.includes(context.user.role)) {
    throw new HttpError(403, 'Not authorized')
  }

  const shipment = await context.entities.Shipment.findUnique({
    where: { id: args.shipmentId }
  })
  if (!shipment) throw new HttpError(404, 'Shipment not found')

  // Validate transition
  if (args.status === 'DOC_RECEIVED' && shipment.documentStatus !== 'DOC_PENDING') {
    throw new HttpError(400, 'Document status must be DOC_PENDING to mark as received')
  }
  if (args.status === 'DOC_RETURNED' && shipment.documentStatus !== 'DOC_RECEIVED') {
    throw new HttpError(400, 'Document status must be DOC_RECEIVED to mark as returned')
  }

  await context.entities.Shipment.update({
    where: { id: args.shipmentId },
    data: { documentStatus: args.status }
  })

  // Notify customer when documents returned
  if (args.status === 'DOC_RETURNED') {
    const customerUsers = await context.entities.User.findMany({
      where: { customerId: shipment.customerId, isActive: true }
    })
    for (const cu of customerUsers) {
      await context.entities.Notification.create({
        data: {
          userId: cu.id,
          type: 'DOC_RETURNED',
          title: 'Chứng từ gốc đã trả',
          message: `Chứng từ gốc chuyến ${shipment.shipmentNumber} đã được trả`,
          referenceId: args.shipmentId,
          referenceType: 'REF_SHIPMENT',
          channels: ['IN_APP'],
        }
      })
    }
  }

  return { success: true }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/logistics/actions/operationStatus.ts src/logistics/actions/documentStatus.ts
git commit -m "feat: implement operation status and document status actions with validation and notifications"
```

---

## Task 12: Actions - Notification queries & actions

**Files:**
- Create: `src/notifications/queries.ts`
- Create: `src/notifications/actions.ts`

- [ ] **Step 1: Implement notification queries**

```typescript
// src/notifications/queries.ts
import { type GetNotifications, type GetUnreadNotificationCount } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

export const getNotifications: GetNotifications<{ limit?: number; offset?: number }, any[]> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  return context.entities.Notification.findMany({
    where: { userId: context.user.id },
    orderBy: { sentAt: 'desc' },
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
  })
}

export const getUnreadNotificationCount: GetUnreadNotificationCount<void, number> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  return context.entities.Notification.count({
    where: { userId: context.user.id, isRead: false }
  })
}
```

- [ ] **Step 2: Implement notification actions**

```typescript
// src/notifications/actions.ts
import { type MarkNotificationRead, type MarkAllNotificationsRead } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

export const markNotificationRead: MarkNotificationRead<{ id: string }, any> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  const notification = await context.entities.Notification.findUnique({ where: { id: args.id } })
  if (!notification || notification.userId !== context.user.id) {
    throw new HttpError(404, 'Notification not found')
  }

  return context.entities.Notification.update({
    where: { id: args.id },
    data: { isRead: true, readAt: new Date() }
  })
}

export const markAllNotificationsRead: MarkAllNotificationsRead<void, { count: number }> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authenticated')

  const result = await context.entities.Notification.updateMany({
    where: { userId: context.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() }
  })

  return { count: result.count }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/notifications/
git commit -m "feat: implement notification queries and actions"
```

---

## Task 13: Refactor - Customer shipment creation với shipmentType + stop templates

**Files:**
- Modify: `src/customer/actions/shipments.ts`

- [ ] **Step 1: Đọc file hiện tại**

Read: `src/customer/actions/shipments.ts`

- [ ] **Step 2: Refactor createShipmentRequest để hỗ trợ shipmentType**

Cập nhật function `createShipmentRequest` - thêm `shipmentType` vào input và auto-generate stops từ template:

```typescript
// Thêm vào input type
shipmentType: 'EXPORT' | 'IMPORT'

// Thêm stop template logic
const STOP_TEMPLATES = {
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
}

// Auto-generate stops from template, merge with customer-provided location details
```

Cũng set `operationStatus: 'DRAFT'` và `shipmentType` khi tạo.

- [ ] **Step 3: Commit**

```bash
git add src/customer/actions/shipments.ts
git commit -m "feat: refactor customer shipment creation with shipmentType and auto-generated stop templates"
```

---

## Task 14: Refactor - Internal shipment creation

**Files:**
- Modify: `src/logistics/actions/shipments.ts`

- [ ] **Step 1: Đọc file hiện tại**

Read: `src/logistics/actions/shipments.ts`

- [ ] **Step 2: Cập nhật createShipment với shipmentType + operationStatus**

Tương tự Task 13, thêm `shipmentType` và stop templates vào `createShipment`. Set `operationStatus: 'DRAFT'` thay vì chỉ dùng `currentStatus`.

- [ ] **Step 3: Commit**

```bash
git add src/logistics/actions/shipments.ts
git commit -m "feat: refactor internal shipment creation with shipmentType and 3-tier status"
```

---

## Task 15: Refactor - POD upload với photoCategory

**Files:**
- Modify: `src/logistics/actions/pods.ts`

- [ ] **Step 1: Đọc file hiện tại**

Read: `src/logistics/actions/pods.ts`

- [ ] **Step 2: Thêm photoCategory vào uploadPOD**

Thêm `photoCategory` vào input type và lưu vào POD record. Thêm validation: kiểm tra photo category có nằm trong `requiredPhotos` của stop không.

Thêm notification cho KH khi tài xế upload ảnh.

- [ ] **Step 3: Commit**

```bash
git add src/logistics/actions/pods.ts
git commit -m "feat: extend POD upload with photoCategory and customer notification"
```

---

## Task 16: Refactor - Shipment queries include new fields

**Files:**
- Modify: `src/logistics/queries/shipments.ts`
- Modify: `src/customer/queries/shipments.ts`

- [ ] **Step 1: Cập nhật getAllShipments và getShipment**

Thêm `driverTasks` (với tractor, trailer, driver) vào include. Thêm `shipmentType`, `operationStatus`, `documentStatus`, `financialStatus` vào select/return.

- [ ] **Step 2: Cập nhật getMyShipments và getMyShipmentDetails**

Tương tự, thêm các fields mới và driverTasks relation.

- [ ] **Step 3: Cập nhật getMyShipmentStats**

Thêm count theo `operationStatus` thay vì chỉ `currentStatus`.

- [ ] **Step 4: Commit**

```bash
git add src/logistics/queries/shipments.ts src/customer/queries/shipments.ts
git commit -m "feat: update shipment queries to include driverTasks, 3-tier status, and shipmentType"
```

---

## Task 17: UI - Notification bell component

**Files:**
- Create: `src/shared/components/NotificationBell.tsx`

- [ ] **Step 1: Implement NotificationBell**

```tsx
import { getNotifications, getUnreadNotificationCount } from 'wasp/client/operations'
import { markNotificationRead, markAllNotificationsRead } from 'wasp/client/operations'
import { useQuery } from 'wasp/client/operations'
import { useState } from 'react'

export function NotificationBell() {
  const { data: count } = useQuery(getUnreadNotificationCount)
  const { data: notifications } = useQuery(getNotifications, { limit: 10 })
  const [isOpen, setIsOpen] = useState(false)

  const handleMarkRead = async (id: string) => {
    await markNotificationRead({ id })
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count && count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h3 className="font-semibold">Thông báo</h3>
            <button onClick={handleMarkAllRead} className="text-sm text-blue-600 hover:underline">
              Đánh dấu tất cả đã đọc
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications?.map((n: any) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`cursor-pointer border-b px-4 py-3 hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-500">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(n.sentAt).toLocaleString('vi-VN')}
                </p>
              </div>
            ))}
            {(!notifications || notifications.length === 0) && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Không có thông báo</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Thêm NotificationBell vào Header**

Modify: `src/shared/components/Header.tsx` - import và render `NotificationBell` component.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/NotificationBell.tsx src/shared/components/Header.tsx
git commit -m "feat: add notification bell component with unread count and dropdown"
```

---

## Task 18: UI - Cập nhật CreateShipmentRequestPage với shipmentType

**Files:**
- Modify: `src/customer/pages/CreateShipmentRequestPage.tsx` (hoặc `.jsx`)

- [ ] **Step 1: Đọc file hiện tại**

Read file page hiện tại.

- [ ] **Step 2: Thêm shipmentType selector**

Thêm radio/select cho EXPORT/IMPORT ở đầu form. Khi chọn, auto-populate stop template (3 stops theo loại). KH vẫn nhập location details (địa chỉ, người liên hệ) cho mỗi stop.

- [ ] **Step 3: Thêm hiển thị required photos**

Hiển thị danh sách ảnh bắt buộc tại mỗi stop (read-only, informational).

- [ ] **Step 4: Commit**

```bash
git add src/customer/pages/CreateShipmentRequestPage.*
git commit -m "feat: update customer shipment form with EXPORT/IMPORT type and auto-generated stops"
```

---

## Task 19: UI - Dispatcher Dashboard với DriverTask drag-drop

**Files:**
- Modify: `src/logistics/pages/DispatcherDashboardPage.tsx` (hoặc `.jsx`)
- Create: `src/logistics/components/DriverTaskBoard.tsx`

- [ ] **Step 1: Đọc DispatcherDashboardPage hiện tại**

Read file page hiện tại.

- [ ] **Step 2: Implement DriverTaskBoard component**

Tạo board hiển thị:
- Cột trái: danh sách shipments PENDING chờ gán
- Cột phải: danh sách tài xế + chuyến đã gán (drag-drop reorder)
- Modal gán: chọn tractor + trailer + driver
- Instructions text field cho mỗi task

Sử dụng HTML5 Drag and Drop API (không thêm thư viện mới).

- [ ] **Step 3: Tích hợp vào DispatcherDashboardPage**

Thay thế dispatch view cũ bằng DriverTaskBoard.

- [ ] **Step 4: Commit**

```bash
git add src/logistics/pages/DispatcherDashboardPage.* src/logistics/components/DriverTaskBoard.tsx
git commit -m "feat: implement dispatcher dashboard with drag-drop driver task board"
```

---

## Task 20: UI - Driver view (PWA) - Danh sách chuyến + check-in/out

**Files:**
- Create: `src/driver/pages/DriverDashboardPage.tsx`
- Create: `src/driver/components/StopCheckInOut.tsx`
- Create: `src/driver/components/PhotoUpload.tsx`
- Modify: `main.wasp` - thêm route

- [ ] **Step 1: Thêm route trong main.wasp**

```wasp
route DriverDashboardRoute { path: "/driver", to: DriverDashboardPage }
page DriverDashboardPage {
  component: import { DriverDashboardPage } from "@src/driver/pages/DriverDashboardPage",
  authRequired: true
}
```

- [ ] **Step 2: Implement DriverDashboardPage**

Hiển thị danh sách chuyến theo thứ tự (từ getDriverTasksByDriver). Mỗi chuyến:
- Thông tin shipment (số, KH, loại Xuất/Nhập)
- Tractor + Trailer info
- Instructions từ Dispatcher
- Danh sách stops với trạng thái check-in/out
- Button bắt đầu chuyến / hoàn tất chuyến

- [ ] **Step 3: Implement StopCheckInOut component**

Cho mỗi stop:
- Button "Check-in" (ghi actualArrival)
- Danh sách required photos với status (đã upload / chưa)
- Button "Check-out" (ghi actualDeparture, chỉ enable khi đã upload đủ ảnh required)

- [ ] **Step 4: Implement PhotoUpload component**

Upload ảnh theo photoCategory:
- Camera capture trên mobile
- Preview ảnh trước khi upload
- Gọi uploadPOD action với photoCategory

- [ ] **Step 5: Cập nhật Sidebar navigation**

Modify: `src/shared/components/Sidebar.tsx` - thêm menu item "Chuyến của tôi" cho role DRIVER, link đến `/driver`.

- [ ] **Step 6: Commit**

```bash
git add src/driver/ main.wasp src/shared/components/Sidebar.tsx
git commit -m "feat: implement driver dashboard with stop check-in/out and photo upload (PWA-ready)"
```

---

## Task 21: UI - Shipment details với 3-tier status

**Files:**
- Modify: `src/logistics/pages/ShipmentDetailsPage.tsx` (hoặc `.jsx`)
- Modify: `src/customer/pages/MyShipmentDetailsPage.tsx` (hoặc `.jsx`)

- [ ] **Step 1: Cập nhật ShipmentDetailsPage**

Thêm hiển thị:
- 3 status badges (Operation / Document / Financial)
- DriverTask list (thay vì Dispatch info cũ)
- Tractor + Trailer info
- Document status actions (OPS: mark received/returned)
- PODs grouped by stop và photoCategory

- [ ] **Step 2: Cập nhật MyShipmentDetailsPage**

Thêm hiển thị cho KH:
- 3 status badges
- Real-time photos per stop
- Driver + Vehicle info từ DriverTask
- Timeline events

- [ ] **Step 3: Commit**

```bash
git add src/logistics/pages/ShipmentDetailsPage.* src/customer/pages/MyShipmentDetailsPage.*
git commit -m "feat: update shipment detail pages with 3-tier status display and driver task info"
```

---

## Task 22: UI - Cập nhật shipment list pages

**Files:**
- Modify: `src/logistics/pages/OpsShipmentsPage.tsx` (hoặc `.jsx`)
- Modify: `src/customer/pages/MyShipmentsPage.tsx` (hoặc `.jsx`)

- [ ] **Step 1: Cập nhật OpsShipmentsPage**

- Thêm filter theo `shipmentType` (EXPORT/IMPORT/All)
- Thêm filter theo `operationStatus` thay vì `currentStatus`
- Hiển thị 3 status badges trên mỗi card
- Thêm document status filter cho OPS role

- [ ] **Step 2: Cập nhật MyShipmentsPage**

- Thêm filter theo `shipmentType`
- Hiển thị operationStatus + documentStatus badges

- [ ] **Step 3: Commit**

```bash
git add src/logistics/pages/OpsShipmentsPage.* src/customer/pages/MyShipmentsPage.*
git commit -m "feat: update shipment list pages with shipmentType filter and 3-tier status display"
```

---

## Task 23: PWA Setup

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `main.wasp` - thêm manifest link vào head

- [ ] **Step 1: Tạo manifest.json**

```json
{
  "name": "Unicon Logistics",
  "short_name": "Unicon",
  "start_url": "/driver",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#FFCC00",
  "icons": [
    {
      "src": "/favicon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 2: Tạo service worker cơ bản**

```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
```

- [ ] **Step 3: Thêm manifest vào head trong main.wasp**

Thêm vào `head[]`:
```
"<link rel='manifest' href='/manifest.json' />"
"<meta name='theme-color' content='#FFCC00' />"
```

- [ ] **Step 4: Register service worker**

Thêm script register vào `src/App.tsx`:
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json public/sw.js main.wasp src/App.tsx
git commit -m "feat: add PWA support with manifest and basic service worker"
```

---

## Task 24: Integration test - Full flow E2E

**Files:**
- Create: `src/test/shipment-flow.test.ts` (manual test script)

- [ ] **Step 1: Viết checklist test thủ công**

Tạo file checklist test flow end-to-end:

1. KH tạo lệnh EXPORT → verify stops auto-generated
2. KH submit (DRAFT → PENDING) → verify notification cho Dispatcher
3. Dispatcher gán tractor + trailer + tài xế → verify DISPATCHED + notification
4. Dispatcher sắp xếp thứ tự chuyến (drag-drop) → verify sequence updated
5. Tài xế xem danh sách chuyến → verify đúng thứ tự
6. Tài xế check-in stop 1 → verify IN_TRANSIT + notification cho KH
7. Tài xế upload ảnh container → verify POD với photoCategory
8. Tài xế check-out stop 1, check-in/out stop 2, 3 → verify DELIVERED
9. OPS đánh dấu nhận chứng từ → verify DOC_RECEIVED
10. OPS đánh dấu trả chứng từ → verify DOC_RETURNED + notification
11. Lặp lại flow cho IMPORT

- [ ] **Step 2: Commit**

```bash
git add src/test/
git commit -m "docs: add manual E2E test checklist for shipment flow"
```

---

## Notes

**Dispatch entity deprecation:** Bảng `Dispatch` cũ và các references trong `main.wasp` được giữ lại tạm thời cho backwards compatibility. Sau khi Phase 1 hoàn tất và verified, tạo task riêng để remove `Dispatch` model, xóa `createDispatch` action, và cleanup references.

**Configurable required photos:** Phase 1 dùng hardcoded `STOP_TEMPLATES`. Phase 2 sẽ thêm database-configurable photo requirements per customer/route.

---

## Summary

| Task | Mô tả | Dependencies |
|------|--------|-------------|
| 1 | Schema - enums mới | - |
| 2 | Schema - mở rộng Shipment | Task 1 |
| 3 | Schema - mở rộng ShipmentStop | Task 1 |
| 4 | Schema - mở rộng POD | Task 1 |
| 5 | Schema - tạo DriverTask | Tasks 1, 2 |
| 6 | Schema - tạo Notification + chạy migration gộp | Task 1 |
| 7 | Data migration Dispatch → DriverTask | Tasks 2, 5, 6 |
| 8 | Wasp - đăng ký entities & operations | Tasks 5, 6 |
| 9 | Actions - createDriverTask | Task 8 |
| 10 | Queries - DriverTask | Task 8 |
| 11 | Actions - Operation & Document Status | Task 8 |
| 12 | Actions - Notification | Task 8 |
| 13 | Refactor - Customer shipment creation | Tasks 2, 3 |
| 14 | Refactor - Internal shipment creation | Tasks 2, 3 |
| 15 | Refactor - POD upload | Task 4 |
| 16 | Refactor - Shipment queries | Tasks 2, 5 |
| 17 | UI - Notification bell | Task 12 |
| 18 | UI - Customer create shipment | Task 13 |
| 19 | UI - Dispatcher dashboard | Tasks 9, 10 |
| 20 | UI - Driver dashboard (PWA) | Tasks 9, 10, 15 |
| 21 | UI - Shipment details | Tasks 11, 16 |
| 22 | UI - Shipment list pages | Task 16 |
| 23 | PWA Setup | - |
| 24 | E2E test checklist | All |
