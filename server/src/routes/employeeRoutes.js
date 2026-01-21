import express from "express";
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
  setApproverRoles,
  processApproval,
  getMySupervisedEmployees,
  updateEmployeeBonus,
  getMyBonusApprovals,
  processBonusApproval,
  submitBonusesForApproval,
} from "../controllers/employeeController.js";
import { protect, authorize } from "../middlewares/auth.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.use(protect); // All routes are protected

// Download Excel template route (before other routes)
router.get("/template/download", authorize(["hr", "admin"]), async (req, res) => {
  try {
    console.log("Template download route hit");
    console.log("__dirname:", __dirname);
    const templatePath = path.join(__dirname, "../../employee excel template.xlsx");
    console.log("Template path:", templatePath);

    // Check if file exists
    const fs = await import('fs');
    if (!fs.existsSync(templatePath)) {
      console.error("Template file not found at:", templatePath);
      return res.status(404).json({
        success: false,
        message: "Template file not found",
      });
    }

    res.download(templatePath, "employee_template.xlsx", (err) => {
      if (err) {
        console.error("Error downloading template:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error downloading template file",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error in template download:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading template file",
    });
  }
});

// HR and Admin can view all employees and create new ones
router
  .route("/")
  .get(authorize(["hr", "admin"]), getEmployees)
  .post(authorize(["hr", "admin"]), createEmployee);

// HR and Admin can bulk create employees
router.post("/bulk", authorize(["hr", "admin"]), bulkCreateEmployees);

// Admin only for syncing approvers and setting approver roles
router.post("/sync-approvers", authorize(["admin"]), syncApproverIds);
router.post("/set-approver-roles", authorize(["admin"]), setApproverRoles);

// Supervisor routes - for managing bonuses of supervised employees
router.get("/supervisor/my-team", getMySupervisedEmployees);
router.post("/supervisor/submit-for-approval", authorize(["hr", "admin", "approver"]), submitBonusesForApproval);

// Bonus approval routes - approvers only
router.get(
  "/bonus-approvals/my-approvals",
  authorize(["approver", "hr", "admin"]),
  getMyBonusApprovals,
);
router.post(
  "/:employeeId/bonus-approval",
  authorize(["approver", "hr", "admin"]),
  processBonusApproval,
);

// Regular approval routes - approvers only
router.post(
  "/approvals/reset-and-sync",
  authorize(["admin"]),
  resetAndSyncApprovers,
);
router.get(
  "/approvals/debug/:employeeId",
  authorize(["admin"]),
  debugApproverAssignments,
);
router.get(
  "/approvals/my-approvals",
  authorize(["approver", "hr", "admin"]),
  getMyApprovals,
);
router.post(
  "/approvals/:employeeId",
  authorize(["approver", "hr", "admin"]),
  processApproval,
);

// HR and Admin can view employees by branch
router.get(
  "/branch/:branchId",
  authorize(["hr", "admin"]),
  getEmployeesByBranch,
);

// HR and Admin can view, update, and delete employees
router
  .route("/:id")
  .get(authorize(["hr", "admin"]), getEmployee)
  .put(authorize(["hr", "admin"]), updateEmployee)
  .delete(authorize(["admin"]), deleteEmployee);

// HR and Admin can toggle employee status
router.patch(
  "/:id/toggle-status",
  authorize(["hr", "admin"]),
  toggleEmployeeStatus,
);

// Bonus update route - HR and Admin only
router.put("/:id/bonus", authorize(["hr", "admin", "approver"]), updateEmployeeBonus);

export default router;
