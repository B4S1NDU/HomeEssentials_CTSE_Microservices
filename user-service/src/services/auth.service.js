const bcrypt = require('bcrypt');
const User = require('../models/User');
const { issueToken } = require('./jwt.service');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');
const { errorResponse } = require('../utils/response');
const { sendUserRegisteredNotification } = require('./notification.service');

/**
 * Authentication service
 */

const register = async (firstName, lastName, email, password, address = null, role = 'Customer') => {
  // Validate input
  const validationErrors = validateRegisterInput(firstName, lastName, email, password);
  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.join('; '));
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // Validate role
  const { isValidRole } = require('../utils/validators');
  if (role && !isValidRole(role)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    address,
  });

  // Issue JWT token
  const accessToken = issueToken(user._id, user.role, user.email);

  // Trigger registration notification in background
  sendUserRegisteredNotification({
    userId: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  // Return safe user object
  const safeUser = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    ...(user.address && { address: user.address }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    user: safeUser,
    accessToken,
  };
};

const login = async (email, password) => {
  // Validate input
  const validationErrors = validateLoginInput(email, password);
  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.join('; '));
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Issue JWT token
  const accessToken = issueToken(user._id, user.role, user.email);

  // Return safe user object
  const safeUser = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    ...(user.address && { address: user.address }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    user: safeUser,
    accessToken,
  };
};

const changePassword = async (userId, oldPassword, newPassword, isAdmin = false) => {
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // Validate old password (skip for admins changing other users' passwords)
  if (!isAdmin) {
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Old password is incorrect');
      error.statusCode = 401;
      error.code = 'INVALID_PASSWORD';
      throw error;
    }
  }

  // Validate new password
  if (!newPassword || newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters long');
    error.statusCode = 400;
    error.code = 'INVALID_PASSWORD';
    throw error;
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user
  user.passwordHash = passwordHash;
  await user.save();

  // Return success
  const safeUser = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    ...(user.address && { address: user.address }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return safeUser;
};

module.exports = {
  register,
  login,
  changePassword,
};
