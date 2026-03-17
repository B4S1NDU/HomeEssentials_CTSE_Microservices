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

exports.createOrder = async (req, res, next) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      const error = new Error('userId and at least one item are required');
      error.statusCode = 400;
      throw error;
    }

    const authorization = req.headers.authorization;

    await validateUser(userId, authorization);

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

