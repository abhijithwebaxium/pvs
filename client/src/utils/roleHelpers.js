// Role-based access control utilities

export const ROLES = {
  EMPLOYEE: "employee",
  APPROVER: "approver",
  HR: "hr",
  ADMIN: "admin",
};

// Check if user has specific role
export const hasRole = (user, role) => {
  if (!user || !user.role) return false;
  return user.role === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (user, roles) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

// Check if user is admin
export const isAdmin = (user) => {
  return hasRole(user, ROLES.ADMIN);
};

// Check if user is HR
export const isHR = (user) => {
  return hasRole(user, ROLES.HR);
};

// Check if user is approver
export const isApprover = (user) => {
  return hasRole(user, ROLES.APPROVER);
};

// Check if user is employee
export const isEmployee = (user) => {
  return hasRole(user, ROLES.EMPLOYEE);
};

// Check if user can manage employees (HR or Admin)
export const canManageEmployees = (user) => {
  return hasAnyRole(user, [ROLES.HR, ROLES.ADMIN]);
};

// Check if user can manage branches (HR or Admin)
export const canManageBranches = (user) => {
  return hasAnyRole(user, [ROLES.HR, ROLES.ADMIN]);
};

// Check if user can approve (Approver, HR, or Admin)
export const canApprove = (user) => {
  return hasAnyRole(user, [ROLES.APPROVER, ROLES.HR, ROLES.ADMIN]);
};

// Check if user can view bonuses (all authenticated users)
export const canViewBonuses = (user) => {
  return !!user && !!user.role;
};

// Check if user can manage bonuses (HR or Admin)
export const canManageBonuses = (user) => {
  return hasAnyRole(user, [ROLES.HR, ROLES.ADMIN]);
};

// Get user display name
export const getUserDisplayName = (user) => {
  if (!user) return "User";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
};

// Get role display name
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.EMPLOYEE]: "Employee",
    [ROLES.APPROVER]: "Approver",
    [ROLES.HR]: "HR Manager",
    [ROLES.ADMIN]: "Administrator",
  };
  return roleNames[role] || role;
};
