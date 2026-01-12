import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/userSlice";
import {
  hasRole,
  hasAnyRole,
  isAdmin,
  isHR,
  isApprover,
  isEmployee,
  canManageEmployees,
  canManageBranches,
  canApprove,
  canViewBonuses,
  canManageBonuses,
  ROLES,
} from "../utils/roleHelpers";

/**
 * Custom hook for role-based access control
 * @returns {Object} Role checking utilities
 */
export const useRole = () => {
  const user = useSelector(selectUser);

  return {
    user,
    hasRole: (role) => hasRole(user, role),
    hasAnyRole: (roles) => hasAnyRole(user, roles),
    isAdmin: isAdmin(user),
    isHR: isHR(user),
    isApprover: isApprover(user),
    isEmployee: isEmployee(user),
    canManageEmployees: canManageEmployees(user),
    canManageBranches: canManageBranches(user),
    canApprove: canApprove(user),
    canViewBonuses: canViewBonuses(user),
    canManageBonuses: canManageBonuses(user),
    ROLES,
  };
};
