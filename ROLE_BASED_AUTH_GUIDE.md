# Role-Based Authentication & Authorization Guide

This document explains the role-based authentication and authorization system implemented in the PVS application.

## Overview

The application implements a comprehensive role-based access control (RBAC) system with four distinct user roles:

1. **Employee** - Basic user with limited access
2. **Approver** - Can approve employee requests and bonuses
3. **HR** - Human Resources managers with employee and branch management capabilities
4. **Admin** - Full system access with all permissions

## User Roles & Permissions

### Employee Role (`employee`)
**Access:**
- View personal dashboard with employee information
- View own bonus information
- Access general resources

**Restricted From:**
- Managing other employees
- Managing branches
- Processing approvals

### Approver Role (`approver`)
**Access:**
- All Employee permissions
- View and process employee approvals
- Approve/reject bonus allocations
- View team members under supervision
- Access approvals dashboard

**Restricted From:**
- Managing employees (create, update, delete)
- Managing branches

### HR Role (`hr`)
**Access:**
- All Approver permissions
- Create, view, update, and delete employees
- Manage branches (create, update, delete)
- Bulk import employees
- Update employee bonuses
- Access HR-specific dashboard

**Restricted From:**
- System-level administrative functions

### Admin Role (`admin`)
**Access:**
- Full system access
- All HR permissions
- Delete branches and employees
- Sync and reset approver configurations
- Debug approver assignments
- Access admin dashboard
- System configuration

## Backend Authorization

### Middleware Functions

Located in `server/src/middlewares/auth.js`:

#### `protect`
Verifies JWT token and authenticates user. Required for all protected routes.

```javascript
router.use(protect); // Protects all routes in the router
```

#### `authorize(...roles)`
Restricts access to specific roles.

```javascript
router.get('/employees', authorize('hr', 'admin'), getEmployees);
```

### Route Protection Examples

#### Branch Routes (`server/src/routes/branchRoutes.js`)
```javascript
// HR and Admin can view and manage branches
router.get('/', authorize('hr', 'admin'), getBranches);
router.post('/', authorize('hr', 'admin'), createBranch);

// Only Admin can delete branches
router.delete('/:id', authorize('admin'), deleteBranch);
```

#### Employee Routes (`server/src/routes/employeeRoutes.js`)
```javascript
// HR and Admin can view and manage employees
router.get('/', authorize('hr', 'admin'), getEmployees);
router.post('/', authorize('hr', 'admin'), createEmployee);

// Approvers, HR, and Admin can access approvals
router.get('/approvals/my-approvals', authorize('approver', 'hr', 'admin'), getMyApprovals);

// Everyone can view their supervised employees
router.get('/supervisor/my-team', getMySupervisedEmployees);
```

## Frontend Authorization

### Route Protection

Located in `client/src/App.jsx`:

```javascript
{/* HR and Admin only routes */}
<Route element={<ProtectedRoute requiredRoles={['hr', 'admin']} />}>
  <Route path="/branches" element={<Branches />} />
  <Route path="/employees" element={<Employees />} />
</Route>

{/* Approver, HR and Admin routes */}
<Route element={<ProtectedRoute requiredRoles={['approver', 'hr', 'admin']} />}>
  <Route path="/approvals" element={<Approvals />} />
</Route>
```

### Navigation Menu

The side menu (`client/src/components/MenuContent.jsx`) dynamically shows/hides menu items based on user role:

```javascript
const menuItems = [
  { text: "Home", path: "/", roles: ["employee", "approver", "hr", "admin"] },
  { text: "Branches", path: "/branches", roles: ["hr", "admin"] },
  { text: "Employees", path: "/employees", roles: ["hr", "admin"] },
  { text: "Approvals", path: "/approvals", roles: ["approver", "hr", "admin"] },
  { text: "Bonuses", path: "/bonuses", roles: ["employee", "approver", "hr", "admin"] },
];
```

### Role-Based Dashboards

Each role has a dedicated dashboard component:

- **AdminDashboard** - Shows system-wide statistics and admin actions
- **HRDashboard** - Displays HR metrics and employee management tools
- **ApproverDashboard** - Shows pending approvals and team information
- **EmployeeDashboard** - Displays personal information and bonus details

## Utility Functions & Hooks

### Role Helper Functions (`client/src/utils/roleHelpers.js`)

```javascript
import { hasRole, hasAnyRole, isAdmin, canManageEmployees } from './utils/roleHelpers';

// Check specific role
if (hasRole(user, 'admin')) { /* ... */ }

// Check multiple roles
if (hasAnyRole(user, ['hr', 'admin'])) { /* ... */ }

// Convenience functions
if (isAdmin(user)) { /* ... */ }
if (canManageEmployees(user)) { /* ... */ }
```

### useRole Hook (`client/src/hooks/useRole.js`)

```javascript
import { useRole } from '../hooks/useRole';

function MyComponent() {
  const { isAdmin, canManageEmployees, user } = useRole();

  return (
    <div>
      {canManageEmployees && <EmployeeManagement />}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### RoleGuard Component (`client/src/components/RoleGuard.jsx`)

```javascript
import RoleGuard from '../components/RoleGuard';

function MyPage() {
  return (
    <div>
      <RoleGuard allowedRoles={['hr', 'admin']}>
        <SensitiveContent />
      </RoleGuard>

      <RoleGuard
        allowedRoles={['admin']}
        fallback={<div>Admin only</div>}
      >
        <AdminContent />
      </RoleGuard>
    </div>
  );
}
```

## Security Considerations

1. **Backend Validation is Primary**: Always validate permissions on the backend. Frontend restrictions are for UX only.

2. **JWT Token**: Stored in HTTP-only cookies for security. Contains user role information.

3. **Token Verification**: Every protected route verifies the JWT token and checks user status.

4. **Role Changes**: If a user's role changes, they must log out and log back in for changes to take effect.

5. **Unauthorized Access**: Users attempting to access unauthorized routes are redirected to `/unauthorized` page.

## Testing Different Roles

To test the application with different roles:

1. **Create test users** with different roles in the database:
   ```javascript
   { role: 'employee' }
   { role: 'approver', isApprover: true, approverLevel: 'Level-1' }
   { role: 'hr' }
   { role: 'admin' }
   ```

2. **Login** with each user to see different:
   - Navigation menu items
   - Dashboard layouts
   - Available features
   - Accessible routes

## Common Patterns

### Protecting a New Route

**Backend:**
```javascript
router.get('/new-feature', protect, authorize('hr', 'admin'), newFeatureHandler);
```

**Frontend:**
```javascript
// In App.jsx
<Route element={<ProtectedRoute requiredRoles={['hr', 'admin']} />}>
  <Route path="/new-feature" element={<NewFeature />} />
</Route>

// In MenuContent.jsx
{ text: "New Feature", path: "/new-feature", roles: ["hr", "admin"] }
```

### Conditional Rendering in Components

```javascript
import { useRole } from '../hooks/useRole';

function MyComponent() {
  const { canManageEmployees, isAdmin } = useRole();

  return (
    <div>
      {/* Show to HR and Admin */}
      {canManageEmployees && (
        <Button onClick={handleCreate}>Create Employee</Button>
      )}

      {/* Show only to Admin */}
      {isAdmin && (
        <Button onClick={handleDelete}>Delete All</Button>
      )}
    </div>
  );
}
```

## Troubleshooting

### User Can't Access Expected Routes
- Verify user's role in database matches expected role
- Check if user is logged in (token exists)
- Ensure user account is active (`isActive: true`)

### Menu Items Not Showing
- Check user role matches roles defined in `menuItems` array
- Verify user is properly loaded in Redux store

### Getting 403 Forbidden Errors
- User's role doesn't match required roles for the endpoint
- Check backend route authorization middleware
- Verify JWT token is valid and contains correct role

## Summary

The role-based authentication system provides:
- ✅ Secure backend authorization with JWT tokens
- ✅ Frontend route protection
- ✅ Dynamic navigation based on user roles
- ✅ Role-specific dashboards
- ✅ Reusable utility functions and hooks
- ✅ Consistent access control across the application

This ensures users only see and can access features appropriate for their role, maintaining security and providing a tailored user experience.
