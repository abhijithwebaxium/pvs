import PropTypes from "prop-types";
import { useRole } from "../hooks/useRole";

/**
 * Component to conditionally render children based on user role
 * @param {Array} allowedRoles - Array of roles that can see the children
 * @param {ReactNode} children - Content to render if user has required role
 * @param {ReactNode} fallback - Optional content to render if user doesn't have required role
 */
const RoleGuard = ({ allowedRoles = [], children, fallback = null }) => {
  const { hasAnyRole } = useRole();

  if (!allowedRoles.length) {
    // If no roles specified, show to all authenticated users
    return children;
  }

  if (hasAnyRole(allowedRoles)) {
    return children;
  }

  return fallback;
};

RoleGuard.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default RoleGuard;
