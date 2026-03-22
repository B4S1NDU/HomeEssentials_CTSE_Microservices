const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyJWT, checkRole } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * GET /users
 * Get all users with pagination (Admin only)
 */
router.get('/', verifyJWT, checkRole('Admin'), userController.getUsers);

/**
 * GET /users/internal/:id
 * Get user by ID for internal service-to-service calls (no auth required)
 */
router.get('/internal/:id', userController.getUserById);

/**
 * GET /users/:id
 * Get user by ID (Auth required - users can view own profile, admins can view any)
 */
router.get('/:id', verifyJWT, userController.getUserById);

/**
 * PATCH /users/:id
 * Update user (Auth required - users can update own profile, admins can update any)
 */
router.patch('/:id', verifyJWT, userController.updateUser);

module.exports = router;
