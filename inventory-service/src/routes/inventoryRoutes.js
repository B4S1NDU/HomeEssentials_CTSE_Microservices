const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { verifyJWT, checkRole } = require('../middleware/auth');

// Roles allowed to create/update inventory records directly
const ADMIN_ROLES = ['Admin', 'StoreManager'];

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
// Public read routes
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/:productId', inventoryController.getInventoryByProductId);
router.get('/', inventoryController.getAllInventory);

// Admin/StoreManager — direct inventory CRUD
router.post('/', verifyJWT, checkRole(...ADMIN_ROLES), inventoryValidation, inventoryController.createInventory);
router.put('/:productId', verifyJWT, checkRole(...ADMIN_ROLES), inventoryController.updateInventory);

// Service-to-service routes (Order Service) — require valid JWT, any authenticated role
router.post('/reserve', verifyJWT, reservationValidation, inventoryController.reserveStock);
router.post('/release', verifyJWT, body('orderId').notEmpty(), inventoryController.releaseStock);
router.post('/deduct', verifyJWT, body('orderId').notEmpty(), inventoryController.deductStock);
router.post('/check', verifyJWT, checkStockValidation, inventoryController.checkStockAvailability);

module.exports = router;
