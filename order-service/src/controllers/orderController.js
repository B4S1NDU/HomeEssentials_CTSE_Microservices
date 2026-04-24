const crypto = require('crypto');
const Order = require('../models/Order');
const {
  validateUser,
  validateProduct,
  checkStock,
  reserveStock,
  deductStock,
  releaseStock,
  processPayment,
  getInventoryByProductId,
  getWarehouseById,
  getUserById,
  sendNotification
} = require('../services/externalClients');

const calculateTotalAmount = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

function buildCustomerSnapshot(user) {
  if (!user || typeof user !== 'object') {
    return { customerName: '', deliveryAddress: undefined };
  }
  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();
  const customerName = [first, last].filter(Boolean).join(' ') || user.email || 'Customer';
  let deliveryAddress;
  if (user.address && typeof user.address === 'object') {
    deliveryAddress = {
      line1: user.address.line1 || '',
      line2: user.address.line2 || '',
      city: user.address.city || '',
      district: user.address.district || '',
      postalCode: user.address.postalCode || '',
      country: user.address.country || ''
    };
  }
  return { customerName, deliveryAddress };
}

/** Normalize Address from order request; returns undefined if nothing provided */
function normalizeRequestAddress(body) {
  if (!body || typeof body !== 'object') return undefined;
  const keys = ['line1', 'line2', 'city', 'district', 'postalCode', 'country'];
  const hasAny = keys.some((k) => body[k] != null && String(body[k]).trim() !== '');
  if (!hasAny) return undefined;
  return {
    line1: (body.line1 || '').trim(),
    line2: (body.line2 || '').trim(),
    city: (body.city || '').trim(),
    district: (body.district || '').trim(),
    postalCode: (body.postalCode || '').trim(),
    country: (body.country || '').trim() || 'Sri Lanka'
  };
}

async function notifyWarehouseOwnerIfThresholdReached(items, authorization) {
  const seenProducts = new Set();

  for (const item of items) {
    if (!item?.productId || seenProducts.has(item.productId)) {
      continue;
    }
    seenProducts.add(item.productId);

    try {
      const inventory = await getInventoryByProductId(item.productId, authorization);
      if (!inventory) {
        continue;
      }

      const quantity = Number(inventory.quantity);
      const threshold = Number(inventory.lowStockThreshold);

      if (!Number.isFinite(quantity) || !Number.isFinite(threshold) || quantity > threshold) {
        console.log(
          `[ORDER] Low-stock condition not met for product ${item.productId} (quantity=${quantity}, threshold=${threshold})`
        );
        continue;
      }

      if (!inventory.warehouse_id) {
        console.log(`[ORDER] No warehouse_id found for product ${item.productId}; skipping low-stock alert`);
        continue;
      }

      const warehouse = await getWarehouseById(inventory.warehouse_id, authorization);
      const ownerUserId = warehouse?.user_id;
      if (!ownerUserId) {
        console.log(`[ORDER] Warehouse ${inventory.warehouse_id} has no owner user_id; skipping low-stock alert`);
        continue;
      }

      const owner = await getUserById(String(ownerUserId), authorization);
      const ownerEmail = owner?.email;
      if (!ownerEmail) {
        continue;
      }

      await sendNotification({
        userId: String(ownerUserId),
        email: ownerEmail,
        type: 'LOW_STOCK_ALERT',
        metadata: {
          productId: item.productId,
          productName: inventory.productName || item.productName,
          currentStock: quantity,
          threshold,
          recipientRole: owner?.role,
          warehouseId: inventory.warehouse_id
        }
      });

      console.log(
        `[ORDER] ✅ Low-stock alert sent to warehouse owner (${ownerEmail}) for product ${item.productId}`
      );
    } catch (error) {
      console.error(
        `[ORDER] ⚠️ Low-stock owner alert skipped for product ${item.productId}: ${error.message}`
      );
    }
  }
}

exports.createOrder = async (req, res, next) => {
  try {
    const { userId, items, deliveryAddress: deliveryAddressBody, customerName: customerNameBody } =
      req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      const error = new Error('userId and at least one item are required');
      error.statusCode = 400;
      throw error;
    }

    const authorization = req.headers.authorization;

    const userData = await validateUser(userId, authorization);
    const snapshot = buildCustomerSnapshot(userData);

    let customerName = snapshot.customerName;
    if (customerNameBody != null && String(customerNameBody).trim() !== '') {
      customerName = String(customerNameBody).trim();
    }

    const requestAddress = normalizeRequestAddress(deliveryAddressBody);
    const deliveryAddress = requestAddress ?? snapshot.deliveryAddress;

    const enrichedItems = [];
    const orderId = `ORD-${crypto.randomUUID()}`;

    console.log(`\n═════════════════════════════════════`);
    console.log(`[ORDER] Creating new order: ${orderId} for user ${userId}`);
    console.log(`[ORDER] Items to order: ${items.length}`);

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        const error = new Error('Each item must have productId and quantity');
        error.statusCode = 400;
        throw error;
      }

      console.log(`[ORDER] Processing item: ${item.productId} x${item.quantity}`);

      const product = await validateProduct(item.productId, authorization);

      const stockCheck = await checkStock(item.productId, item.quantity, authorization);
      if (!stockCheck.available) {
        const error = new Error(
          `Insufficient stock for product ${item.productId}, requested ${item.quantity}`
        );
        error.statusCode = 400;
        throw error;
      }

      console.log(`[ORDER] ✅ Stock available, reserving...`);
      await reserveStock(item.productId, orderId, item.quantity, authorization);

      enrichedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }

    const totalAmount = calculateTotalAmount(enrichedItems);

    console.log(`[ORDER] ✅ All items reserved. Total: LKR ${totalAmount}`);
    console.log(`[ORDER] Processing payment...`);

    const paymentResult = await processPayment({
      orderId,
      userId,
      amount: totalAmount
    });

    // Only mark as CONFIRMED if payment explicitly succeeds
    // Default to PENDING if no success status provided
    const paymentSuccess = paymentResult?.success === true;

    let status = paymentSuccess ? 'CONFIRMED' : (paymentResult?.success === false ? 'CANCELLED' : 'PENDING');

    console.log(`[ORDER] Payment result: ${paymentSuccess ? '✅ SUCCESS' : (paymentResult?.success === false ? '❌ FAILED' : '⏳ PENDING')}`);

    if (paymentSuccess) {
      console.log(`[ORDER] Deducting stock...`);
      await deductStock(orderId, authorization);
      console.log(`[ORDER] ✅ Stock deducted, order CONFIRMED`);

      notifyWarehouseOwnerIfThresholdReached(enrichedItems, authorization).catch((error) => {
        console.error(`[ORDER] ⚠️ Failed to process low-stock notifications: ${error.message}`);
      });
    } else if (paymentResult?.success === false) {
      console.log(`[ORDER] Releasing reserved stock...`);
      await releaseStock(orderId, authorization);
      console.log(`[ORDER] ✅ Stock released, order CANCELLED`);
    } else {
      console.log(`[ORDER] Payment pending - order set to PENDING status`);
    }

    const order = await Order.create({
      orderId,
      userId,
      customerName,
      deliveryAddress,
      items: enrichedItems,
      totalAmount,
      status,
      paymentId: paymentResult?.data?.paymentId || paymentResult?.paymentId
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id });

    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const authorization = req.headers.authorization;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      const err = new Error('Invalid status value');
      err.statusCode = 400;
      throw err;
    }

    const order = await Order.findOne({ orderId: id });

    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    const previousStatus = order.status;
    console.log(`[ORDER-UPDATE] Updating order ${id} from ${previousStatus} to ${status}`);

    // Handle inventory operations based on status transition
    if (previousStatus === 'PENDING' && status === 'CONFIRMED') {
      console.log(`[ORDER-UPDATE] Confirming order - deducting stock...`);
      try {
        await deductStock(id, authorization);
        console.log(`[ORDER-UPDATE] ✅ Stock deducted successfully`);

        notifyWarehouseOwnerIfThresholdReached(order.items || [], authorization).catch((error) => {
          console.error(`[ORDER-UPDATE] ⚠️ Failed to process low-stock notifications: ${error.message}`);
        });
      } catch (error) {
        console.error(`[ORDER-UPDATE] ❌ Failed to deduct stock:`, error.message);
        throw error;
      }
    } else if ((previousStatus === 'PENDING' || previousStatus === 'CONFIRMED') && status === 'CANCELLED') {
      console.log(`[ORDER-UPDATE] Cancelling order - releasing reserved stock...`);
      try {
        await releaseStock(id, authorization);
        console.log(`[ORDER-UPDATE] ✅ Stock released successfully`);
      } catch (error) {
        console.error(`[ORDER-UPDATE] ❌ Failed to release stock:`, error.message);
        throw error;
      }
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: id },
      { status },
      { new: true }
    );

    console.log(`[ORDER-UPDATE] ✅ Order status updated to ${status}`);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDeliveryWindow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deliveryWindowStart, deliveryWindowEnd } = req.body;

    const order = await Order.findOne({ orderId: id });
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    let mergedStart = order.deliveryWindowStart;
    let mergedEnd = order.deliveryWindowEnd;

    const $set = {};
    const $unset = {};

    if (deliveryWindowStart !== undefined) {
      if (deliveryWindowStart === null || deliveryWindowStart === '') {
        mergedStart = undefined;
        $unset.deliveryWindowStart = '';
      } else {
        const d = new Date(deliveryWindowStart);
        if (Number.isNaN(d.getTime())) {
          const err = new Error('Invalid deliveryWindowStart');
          err.statusCode = 400;
          throw err;
        }
        mergedStart = d;
        $set.deliveryWindowStart = d;
      }
    }
    if (deliveryWindowEnd !== undefined) {
      if (deliveryWindowEnd === null || deliveryWindowEnd === '') {
        mergedEnd = undefined;
        $unset.deliveryWindowEnd = '';
      } else {
        const d = new Date(deliveryWindowEnd);
        if (Number.isNaN(d.getTime())) {
          const err = new Error('Invalid deliveryWindowEnd');
          err.statusCode = 400;
          throw err;
        }
        mergedEnd = d;
        $set.deliveryWindowEnd = d;
      }
    }

    if (mergedStart && mergedEnd && mergedStart > mergedEnd) {
      const err = new Error('Delivery start must be before or equal to delivery end');
      err.statusCode = 400;
      throw err;
    }

    const update = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;

    const updated = await Order.findOneAndUpdate({ orderId: id }, update, {
      new: true
    });

    res.json({
      success: true,
      message: 'Delivery window updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Order.findOneAndDelete({ orderId: id });

    if (!deleted) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

