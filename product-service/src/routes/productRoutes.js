const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { verifyJWT, checkRole } = require('../middleware/auth');

// Roles allowed to manage the product catalogue
const ADMIN_ROLES = ['Admin', 'StoreManager'];

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['rice', 'soap', 'detergent', 'cooking-oil', 'spices', 'cleaning', 'personal-care', 'other'])
    .withMessage('Invalid category'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('unit')
    .notEmpty().withMessage('Unit is required')
    .isIn(['kg', 'g', 'l', 'ml', 'piece', 'pack'])
    .withMessage('Invalid unit'),
  body('imageUrl')
    .optional()
    .isURL().withMessage('Image URL must be a valid URL'),
  body('brand')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
];

// Routes
// Public read routes
router.get('/categories/list', productController.getCategories);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected write routes — require valid JWT + Admin or StoreManager role
router.post('/', verifyJWT, checkRole(...ADMIN_ROLES), productValidation, productController.createProduct);
router.put('/:id', verifyJWT, checkRole(...ADMIN_ROLES), productValidation, productController.updateProduct);
router.delete('/:id', verifyJWT, checkRole(...ADMIN_ROLES), productController.deleteProduct);

module.exports = router;
