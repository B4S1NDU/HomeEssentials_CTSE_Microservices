const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifyJWT } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', authController.register);

/**
 * POST /auth/login
 * User login
 */
router.post('/login', authController.login);

/**
 * PATCH /auth/:userId/password
 * Change user password (Auth required - users can change own password, admins can change any)
 */
router.patch('/:userId/password', verifyJWT, authController.changePassword);

module.exports = router;
