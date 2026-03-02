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
