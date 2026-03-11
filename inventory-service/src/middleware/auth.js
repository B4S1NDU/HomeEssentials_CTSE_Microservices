const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT Bearer token attached to the request.
 * On success, sets req.user = decoded payload and calls next().
 * The JWT_SECRET must match the secret used by user-service.
 */
const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Authorization token is required' }
      });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'JWT secret not configured' }
      });
    }

    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' }
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
    });
  }
};

/**
 * Factory that returns middleware restricting access to the given roles.
 * Must be used after verifyJWT.
 */
const checkRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' }
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      }
    });
  }

  next();
};

module.exports = { verifyJWT, checkRole };
