import Employee from "../models/Employee.js";
import ldapService from "../services/ldapService.js";
import { generateToken } from "../utils/jwt.js";
import AppError from "../utils/appError.js";

/**
 * @desc    Login user with LDAP authentication
 * @route   POST /api/auth/ldap/login
 * @access  Public
 */
export const ldapLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    // Authenticate against LDAP
    let ldapUser;
    try {
      ldapUser = await ldapService.authenticateUser(email, password);
    } catch (error) {
      // Handle LDAP-specific errors
      if (error.statusCode === 404) {
        return next(new AppError("User not found in Active Directory. Please verify your email address.", 404));
      }
      if (error.statusCode === 401) {
        return next(new AppError("Incorrect password. Please check your Active Directory password.", 401));
      }
      console.error("LDAP authentication error:", error);
      return next(new AppError("Active Directory authentication failed. Please try again.", 500));
    }

    // Find employee in database by email
    const employee = await Employee.findOne({
      email: email.toLowerCase()
    });

    if (!employee) {
      return next(
        new AppError(
          "Active Directory authentication successful, but no employee record found in the system. Please contact HR.",
          404
        )
      );
    }

    // Check if employee is active
    if (!employee.isActive) {
      return next(
        new AppError(
          "Your account has been deactivated. Please contact HR.",
          403
        )
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: employee._id,
      employeeId: employee.employeeId,
      email: employee.email,
      role: employee.role,
      isApprover: employee.isApprover,
      approverLevel: employee.approverLevel,
    });

    const isProd = process.env.NODE_ENV === "production";

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
      domain: isProd ? ".pvs-xi.vercel.app" : undefined,
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "LDAP authentication successful",
      data: {
        user: {
          id: employee._id,
          employeeId: employee.employeeId,
          email: employee.email,
          fullName: employee.fullName,
          position: employee.position,
          role: employee.role,
          isApprover: employee.isApprover,
          approverLevel: employee.approverLevel,
        },
        token,
        authMethod: "ldap",
      },
    });
  } catch (error) {
    console.error("LDAP login error:", error);
    next(error);
  }
};

/**
 * @desc    Test LDAP connection
 * @route   GET /api/auth/ldap/test
 * @access  Public (should be restricted in production)
 */
export const testLdapConnection = async (req, res, next) => {
  try {
    const isConnected = await ldapService.testConnection();

    if (isConnected) {
      res.status(200).json({
        success: true,
        message: "LDAP connection successful",
        ldapServer: process.env.HRPORTAL_LDAP_Server,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "LDAP connection failed",
      });
    }
  } catch (error) {
    console.error("LDAP connection test error:", error);
    next(error);
  }
};
