import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import AppError from "../utils/appError.js";

// Protect routes - verify JWT token
// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookie or Authorization header
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      // Allow request to proceed without user (optional auth)
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await Employee.findById(decoded.userId).select("-password");
      if (!user || !user.isActive) {
        // Token exists but user invalid -> proceed as unauthenticated
        return next();
      }

      // Add user data to request
      req.user = {
        userId: decoded.userId,
        employeeId: user.employeeId,
        role: user.role,
      };

      next();
    } catch (err) {
      // Token invalid -> proceed as unauthenticated
      return next();
    }
  } catch (error) {
    next(error);
  }
};

// Role-based authorization - REMOVED
// All authenticated users can access all routes
export const authorize = (...roles) => {
  return (req, res, next) => {
    // No role checking - just pass through
    next();
  };
};

// Access level authorization - REMOVED
export const authorizeLevel = (minLevel) => {
  return (req, res, next) => {
    // No level checking - just pass through
    next();
  };
};
