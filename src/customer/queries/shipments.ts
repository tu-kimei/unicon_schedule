import { HttpError } from 'wasp/server';

// Get shipments for current customer user
export const getMyShipments = async (args: any, context: any) => {
  const { user } = context;

  // Validate user is customer
  if (user.userType !== 'CUSTOMER') {
    throw new HttpError(403, 'Chỉ tài khoản khách hàng mới có thể truy cập');
  }

  if (!user.customerId) {
    throw new HttpError(400, 'Tài khoản chưa được liên kết với khách hàng');
  }

  // Get shipments for this customer
  const shipments = await context.entities.Shipment.findMany({
    where: {
      customerId: user.customerId,
      deletedAt: null
    },
    include: {
      customer: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          userType: true
        }
      },
      stops: {
        orderBy: { sequence: 'asc' }
      },
      dispatch: {
        include: {
          vehicle: true,
          driver: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      },
      driverTasks: {
        include: {
          driver: {
            include: {
              user: {
                select: { fullName: true, email: true }
              }
            }
          },
          tractor: true,
          trailer: true,
        },
        orderBy: { sequence: 'asc' }
      },
      statusEvents: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      pods: {
        where: { isSubmitted: true },
        orderBy: { uploadedAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return shipments;
};

// Get single shipment details for customer
export const getMyShipmentDetails = async ({ id }: { id: string }, context: any) => {
  const { user } = context;

  // Validate user is customer
  if (user.userType !== 'CUSTOMER') {
    throw new HttpError(403, 'Chỉ tài khoản khách hàng mới có thể truy cập');
  }

  if (!user.customerId) {
    throw new HttpError(400, 'Tài khoản chưa được liên kết với khách hàng');
  }

  const shipment = await context.entities.Shipment.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          userType: true
        }
      },
      stops: {
        orderBy: { sequence: 'asc' }
      },
      dispatch: {
        include: {
          vehicle: true,
          driver: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      },
      driverTasks: {
        include: {
          driver: {
            include: {
              user: {
                select: { fullName: true, email: true, phone: true }
              }
            }
          },
          tractor: true,
          trailer: true,
        },
        orderBy: { sequence: 'asc' }
      },
      statusEvents: {
        orderBy: { createdAt: 'desc' }
      },
      pods: {
        orderBy: { uploadedAt: 'desc' }
      }
    }
  });

  if (!shipment) {
    throw new HttpError(404, 'Không tìm thấy chuyến hàng');
  }

  // Verify customer owns this shipment
  if (shipment.customerId !== user.customerId) {
    throw new HttpError(403, 'Bạn không có quyền xem chuyến hàng này');
  }

  return shipment;
};

// Get shipment statistics for customer dashboard
export const getMyShipmentStats = async (args: any, context: any) => {
  const { user } = context;

  // Validate user is customer
  if (user.userType !== 'CUSTOMER') {
    throw new HttpError(403, 'Chỉ tài khoản khách hàng mới có thể truy cập');
  }

  if (!user.customerId) {
    throw new HttpError(400, 'Tài khoản chưa được liên kết với khách hàng');
  }

  // Get counts by status
  const [total, draft, ready, assigned, inTransit, completed] = await Promise.all([
    context.entities.Shipment.count({
      where: { customerId: user.customerId, deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, currentStatus: 'DRAFT', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, currentStatus: 'READY', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, currentStatus: 'ASSIGNED', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, currentStatus: 'IN_TRANSIT', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, currentStatus: 'COMPLETED', deletedAt: null }
    })
  ]);

  // Get counts by operationStatus
  const [opDraft, opPending, opDispatched, opInTransit, opDelivered, opCancelled] = await Promise.all([
    context.entities.Shipment.count({
      where: { customerId: user.customerId, operationStatus: 'DRAFT', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, operationStatus: 'PENDING', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, operationStatus: 'DISPATCHED', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, operationStatus: 'IN_TRANSIT', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, operationStatus: 'DELIVERED', deletedAt: null }
    }),
    context.entities.Shipment.count({
      where: { customerId: user.customerId, operationStatus: 'CANCELLED', deletedAt: null }
    }),
  ]);

  return {
    total,
    draft,
    ready,
    assigned,
    inTransit,
    completed,
    active: assigned + inTransit, // Shipments đang vận chuyển
    byOperationStatus: {
      draft: opDraft,
      pending: opPending,
      dispatched: opDispatched,
      inTransit: opInTransit,
      delivered: opDelivered,
      cancelled: opCancelled,
    }
  };
};
