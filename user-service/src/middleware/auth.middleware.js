const { verifyToken } = require('../services/jwt.service');
const { errorResponse } = require('../utils/response');

/**
 * JWT token verification middleware
 */
const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authorization token is missing');
      error.statusCode = 401;
      error.code = 'MISSING_TOKEN';
      throw error;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control middleware
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        const error = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!allowedRoles.includes(req.user.role)) {
        const error = new Error(`Access denied. Required role: ${allowedRoles.join(', ')}`);
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  verifyJWT,
  checkRole,
};
