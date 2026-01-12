import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import AppError from '../utils/appError.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookie or Authorization header
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await Employee.findById(decoded.userId).select('-password');
      if (!user || !user.isActive) {
        return next(new AppError('User no longer exists or is inactive', 401));
      }

      // Add user data to request
      req.user = {
        userId: decoded.userId,
        employeeId: user.employeeId,
        role: user.role,
      };

      next();
    } catch (err) {
      return next(new AppError('Invalid or expired token', 401));
    }
  } catch (error) {
    next(error);
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role ${req.user.role} is not authorized to access this route`, 403)
      );
    }

    next();
  };
};

// Access level authorization
export const authorizeLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }

    if (req.user.accessLevel < minLevel) {
      return next(
        new AppError('Insufficient access level for this operation', 403)
      );
    }

    next();
  };
};
