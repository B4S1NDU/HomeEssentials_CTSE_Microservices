const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');

// Validation rules
const inventoryValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required'),
  body('productName')
    .notEmpty().withMessage('Product name is required'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer')
];

const reservationValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required'),
  body('orderId')
    .notEmpty().withMessage('Order ID is required'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

const checkStockValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// Routes
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/:productId', inventoryController.getInventoryByProductId);
router.get('/', inventoryController.getAllInventory);
router.post('/', inventoryValidation, inventoryController.createInventory);
router.put('/:productId', inventoryController.updateInventory);
router.post('/reserve', reservationValidation, inventoryController.reserveStock);
router.post('/release', body('orderId').notEmpty(), inventoryController.releaseStock);
router.post('/deduct', body('orderId').notEmpty(), inventoryController.deductStock);
router.post('/check', checkStockValidation, inventoryController.checkStockAvailability);

module.exports = router;
