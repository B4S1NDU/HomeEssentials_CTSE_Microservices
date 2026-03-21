const crypto = require('crypto');
const Order = require('../models/Order');
const {
  validateUser,
  validateProduct,
  checkStock,
  reserveStock,
  deductStock,
  releaseStock,
  processPayment
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

/** Normalize address from order request; returns undefined if nothing provided */
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

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        const error = new Error('Each item must have productId and quantity');
        error.statusCode = 400;
        throw error;
      }

      const product = await validateProduct(item.productId, authorization);

      const stockCheck = await checkStock(item.productId, item.quantity, authorization);
      if (!stockCheck.available) {
        const error = new Error(
          `Insufficient stock for product ${item.productId}, requested ${item.quantity}`
        );
        error.statusCode = 400;
        throw error;
      }

      await reserveStock(item.productId, orderId, item.quantity, authorization);

      enrichedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }

    const totalAmount = calculateTotalAmount(enrichedItems);

    const paymentResult = await processPayment({
      orderId,
      userId,
      amount: totalAmount
    });

    const paymentSuccess =
      paymentResult?.success !== undefined ? paymentResult.success : true;

    let status = paymentSuccess ? 'CONFIRMED' : 'CANCELLED';

    if (paymentSuccess) {
      await deductStock(orderId, authorization);
    } else {
      await releaseStock(orderId, authorization);
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

    if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      const err = new Error('Invalid status value');
      err.statusCode = 400;
      throw err;
    }

    const order = await Order.findOneAndUpdate(
      { orderId: id },
      { status },
      { new: true }
    );

    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
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

