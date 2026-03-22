const User = require('../models/User');
const { successResponse } = require('../utils/response');
const { validateUpdateUserInput, isValidRole } = require('../utils/validators');

/**
 * User controller
 */

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authUser = req.user;

    // Check authorization: users can only view their own profile, admins can view anyone
    // Skip for internal service-to-service calls (when authUser is undefined)
    if (authUser && authUser.role !== 'Admin' && authUser.sub !== id) {
      const error = new Error('Access denied. You can only view your own profile');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const user = await User.findById(id);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

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

    res.status(200).json(successResponse(safeUser));
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments();

    const safeUsers = users.map((user) => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      ...(user.address && { address: user.address }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.status(200).json(
      successResponse({
        users: safeUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const authUser = req.user;

    // Check authorization: users can only update their own profile, admins can update anyone
    if (authUser.role !== 'Admin' && authUser.sub !== id) {
      const error = new Error('Access denied. You can only update your own profile');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // Validate input
    const validationErrors = validateUpdateUserInput(updateData);
    if (validationErrors.length > 0) {
      const error = new Error(validationErrors.join('; '));
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

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

    res.status(200).json(
      successResponse(safeUser, 'User updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserById,
  getUsers,
  updateUser,
};
