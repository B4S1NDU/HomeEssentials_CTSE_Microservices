const Inventory = require('../models/Inventory');
const Warehouse = require('../models/Warehouse');
const Reservation = require('../models/Reservation');
const { validationResult } = require('express-validator');
const axios = require('axios');
const { sendLowStockAlert, ALLOWED_RECIPIENT_ROLES } = require('../services/notificationService');

// @desc    Get inventory by product ID
// @route   GET /api/inventory/:productId
// @access  Public
exports.getInventoryByProductId = async (req, res, next) => {
  try {
    const inventory = await Inventory.findOne({ productId: req.params.productId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: `Inventory not found for product: ${req.params.productId}`
      });
    }

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Public
exports.getAllInventory = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    
    // Filter by stock status
    if (status === 'LOW_STOCK') {
      filter.$expr = { $lte: ['$availableQuantity', '$lowStockThreshold'] };
    } else if (status === 'OUT_OF_STOCK') {
      filter.availableQuantity = 0;
    } else if (status === 'IN_STOCK') {
      filter.$expr = { $gt: ['$availableQuantity', '$lowStockThreshold'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const inventory = await Inventory.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ availableQuantity: 1 });

    const total = await Inventory.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: inventory.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Initialize inventory for a product
// @route   POST /api/inventory
// @access  Private (Admin)
exports.createInventory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Friendly validation for warehouse input before mongoose validation runs
    if (!req.body.warehouse_id || !String(req.body.warehouse_id).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse ID not found'
      });
    }

    const warehouse = await Warehouse.findOne({
      warehouse_id: req.body.warehouse_id,
      deletedAt: null
    });

    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse ID not found'
      });
    }

    // Check if inventory already exists
    const existingInventory = await Inventory.findOne({ productId: req.body.productId });
    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message: 'Inventory already exists for this product'
      });
    }

    const inventory = await Inventory.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Inventory created successfully',
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inventory stock
// @route   PUT /api/inventory/:productId
// @access  Private (Admin)
exports.updateInventory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const inventory = await Inventory.findOne({ productId: req.params.productId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    const wasLowStock = inventory.availableQuantity <= inventory.lowStockThreshold;

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        inventory[key] = req.body[key];
      }
    });

    await inventory.save();

    const isLowStock = inventory.availableQuantity <= inventory.lowStockThreshold;
    const crossedToLowStock = !wasLowStock && isLowStock;

    if (crossedToLowStock && req.user && ALLOWED_RECIPIENT_ROLES.includes(req.user.role)) {
      sendLowStockAlert({ recipient: req.user, inventory }).catch((err) => {
        console.error('Failed to send low stock alert:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:productId
// @access  Private (Admin)
exports.deleteInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findOneAndDelete({ productId: req.params.productId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory deleted successfully',
      data: { deletedProductId: req.params.productId }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reserve stock for an order
// @route   POST /api/inventory/reserve
// @access  Private (Order Service)
exports.reserveStock = async (req, res, next) => {
  try {
    const { productId, orderId, quantity } = req.body;

    console.log(`[INVENTORY-RESERVE] 📥 Received reserve request: ${quantity} units of ${productId} for order ${orderId}`);

    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      console.log(`[INVENTORY-RESERVE] ❌ Product ${productId} not found in inventory`);
      return res.status(404).json({
        success: false,
        message: 'Product not found in inventory'
      });
    }

    console.log(`[INVENTORY-RESERVE] Current state - Total: ${inventory.quantity}, Reserved: ${inventory.reservedQuantity}, Available: ${inventory.availableQuantity}`);

    // Check if enough stock available
    if (inventory.availableQuantity < quantity) {
      console.log(`[INVENTORY-RESERVE] ❌ Insufficient stock: requested ${quantity}, available ${inventory.availableQuantity}`);
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available',
        available: inventory.availableQuantity,
        requested: quantity
      });
    }

    // Create reservation
    const expirationMinutes = parseInt(process.env.RESERVATION_TIMEOUT_MINUTES) || 15;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const reservation = await Reservation.create({
      productId,
      orderId,
      quantity,
      expiresAt
    });

    // Update inventory
    inventory.reservedQuantity += quantity;
    await inventory.save();

    console.log(`[INVENTORY-RESERVE] ✅ Stock reserved! New state - Total: ${inventory.quantity}, Reserved: ${inventory.reservedQuantity}, Available: ${inventory.availableQuantity}`);
    console.log(`[INVENTORY-RESERVE] Reservation ID: ${reservation._id} (expires in ${expirationMinutes}min)\n`);

    res.status(200).json({
      success: true,
      message: 'Stock reserved successfully',
      data: {
        reservationId: reservation._id,
        productId,
        orderId,
        quantity,
        expiresAt,
        availableQuantity: inventory.availableQuantity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Release reserved stock
// @route   POST /api/inventory/release
// @access  Private (Order Service)
exports.releaseStock = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Find reservations that are either PENDING (not deducted) or CONFIRMED (already deducted, need to reverse)
    const reservations = await Reservation.find({ 
      orderId, 
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No pending or confirmed reservations found for this order'
      });
    }

    for (const reservation of reservations) {
      const inventory = await Inventory.findOne({ productId: reservation.productId });
      
      if (inventory) {
        // If reservation was CONFIRMED, we need to add back to quantity as well
        if (reservation.status === 'CONFIRMED') {
          inventory.quantity += reservation.quantity;
        }
        // Ensure reservedQuantity never goes negative
        inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - reservation.quantity);
        await inventory.save();
      }

      reservation.status = 'RELEASED';
      await reservation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Reserved stock released successfully',
      data: {
        orderId,
        releasedItems: reservations.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deduct stock after successful payment
// @route   POST /api/inventory/deduct
// @access  Private (Order Service)
exports.deductStock = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Find Reservations with PENDING or CONFIRMED status (idempotent - handle if already deducted)
    const reservations = await Reservation.find({ 
      orderId, 
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No pending or confirmed reservations found for this order'
      });
    }

    let deductedCount = 0;

    for (const reservation of reservations) {
      // Skip if already deducted
      if (reservation.status === 'CONFIRMED') {
        continue;
      }

      const inventory = await Inventory.findOne({ productId: reservation.productId });
      
      if (inventory) {
        // Deduct from total quantity
        inventory.quantity = Math.max(0, inventory.quantity - reservation.quantity);
        // Remove from reserved quantity now that stock has been permanently deducted
        inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - reservation.quantity);
        inventory.lastRestocked = Date.now();
        await inventory.save();
        // Stock deduction process complete for product: reservation.productId
      }

      reservation.status = 'CONFIRMED';
      await reservation.save();
      deductedCount++;
    }

    res.status(200).json({
      success: true,
      message: 'Stock deducted successfully',
      data: {
        orderId,
        deductedItems: deductedCount,
        totalItems: reservations.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private (Admin)
exports.getLowStockItems = async (req, res, next) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] }
    });

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check stock availability
// @route   POST /api/inventory/check
// @access  Public
exports.checkStockAvailability = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        available: false,
        message: 'Product not found in inventory'
      });
    }

    const available = inventory.availableQuantity >= quantity;

    res.status(200).json({
      success: true,
      available,
      productId,
      requestedQuantity: quantity,
      availableQuantity: inventory.availableQuantity,
      stockStatus: inventory.stockStatus
    });
  } catch (error) {
    next(error);
  }
};
