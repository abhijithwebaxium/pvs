import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  getEmployeesByBranch,
  bulkCreateEmployees,
  syncApproverIds,
  getMyApprovals,
  debugApproverAssignments,
  resetAndSyncApprovers,
  processApproval,
  getMySupervisedEmployees,
  updateEmployeeBonus,
  getMyBonusApprovals,
  processBonusApproval,
} from '../controllers/employeeController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect); // All routes are protected

// HR and Admin can view all employees and create new ones
router.route('/').get(authorize('hr', 'admin'), getEmployees).post(authorize('hr', 'admin'), createEmployee);

// HR and Admin can bulk create employees
router.post('/bulk', authorize('hr', 'admin'), bulkCreateEmployees);

// Admin only for syncing approvers
router.post('/sync-approvers', authorize('admin'), syncApproverIds);

// Supervisor routes - for managing bonuses of supervised employees
router.get('/supervisor/my-team', getMySupervisedEmployees);

// Bonus approval routes - approvers only
router.get('/bonus-approvals/my-approvals', authorize('approver', 'hr', 'admin'), getMyBonusApprovals);
router.post('/:employeeId/bonus-approval', authorize('approver', 'hr', 'admin'), processBonusApproval);

// Regular approval routes - approvers only
router.post('/approvals/reset-and-sync', authorize('admin'), resetAndSyncApprovers);
router.get('/approvals/debug/:employeeId', authorize('admin'), debugApproverAssignments);
router.get('/approvals/my-approvals', authorize('approver', 'hr', 'admin'), getMyApprovals);
router.post('/approvals/:employeeId', authorize('approver', 'hr', 'admin'), processApproval);

// HR and Admin can view employees by branch
router.get('/branch/:branchId', authorize('hr', 'admin'), getEmployeesByBranch);

// HR and Admin can view, update, and delete employees
router.route('/:id').get(authorize('hr', 'admin'), getEmployee).put(authorize('hr', 'admin'), updateEmployee).delete(authorize('admin'), deleteEmployee);

// HR and Admin can toggle employee status
router.patch('/:id/toggle-status', authorize('hr', 'admin'), toggleEmployeeStatus);

// Bonus update route - HR and Admin only
router.put('/:id/bonus', authorize('hr', 'admin'), updateEmployeeBonus);

export default router;
