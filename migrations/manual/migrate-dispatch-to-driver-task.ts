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
