import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/userSlice";
import api from "../../utils/api";

const Bonuses = () => {
  const user = useSelector(selectUser);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bonusDialog, setBonusDialog] = useState({
    open: false,
    employee: null,
  });
  const [bonusAmount, setBonusAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMyTeam = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = user?.id || user?._id;
      const response = await api.get(
        `/api/employees/supervisor/my-team?supervisorId=${userId}`,
      );

      setEmployees(response.data.data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while fetching employees";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id || user?._id) {
      fetchMyTeam();
    }
  }, [user]);

  const handleOpenBonusDialog = (employee) => {
    setBonusDialog({
      open: true,
      employee,
    });
    setBonusAmount(employee.bonus2025 || "");
  };

  const handleCloseBonusDialog = () => {
    setBonusDialog({
      open: false,
      employee: null,
    });
    setBonusAmount("");
  };

  const handleSubmitBonus = async () => {
    if (!bonusAmount || parseFloat(bonusAmount) < 0) {
      setError("Please enter a valid bonus amount");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const userId = user?.id || user?._id;

      await api.put(
        `/api/employees/${bonusDialog.employee._id}/bonus?supervisorId=${userId}`,
        {
          bonus2025: parseFloat(bonusAmount),
        },
      );

      // Refresh the employee list
      await fetchMyTeam();
      handleCloseBonusDialog();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while updating bonus";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getApprovalStatus = (employee) => {
    if (!employee)
      return { status: "not_entered", label: "Not Entered", color: "default" };

    // A bonus is considered entered if ANY of these are true:
    // 1. enteredBy metadata is present
    // 2. A bonus amount for 2025 is actually set (non-zero)
    // 3. Any approval level is no longer 'not_required'
    const hasMetadata = !!employee.approvalStatus?.enteredBy;
    const hasBonusValue =
      employee.bonus2025 && parseFloat(employee.bonus2025) > 0;

    // Check if any level is active (pending, approved, or rejected)
    const levels = ["level1", "level2", "level3", "level4", "level5"];
    const hasActiveProcess = levels.some((lvl) => {
      const status = employee.approvalStatus?.[lvl]?.status;
      return status && !["pending", "unknown"].includes(status);
    });

    if (!hasMetadata && !hasBonusValue && !hasActiveProcess) {
      return { status: "not_entered", label: "Not Entered", color: "default" };
    }

    // Check all approval levels and track progress
    let approvedCount = 0;
    let totalRequired = 0;
    let currentStage = null;
    let anyRejected = false;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const approverField = `${level}Approver`;
      const status = employee.approvalStatus?.[level]?.status;

      // Check if this level has an approver
      if (employee[approverField]) {
        totalRequired++;

        if (status === "rejected") {
          anyRejected = true;
          break;
        }

        if (status === "approved") {
          approvedCount++;
        } else if (status === "pending") {
          if (!currentStage) {
            currentStage = i + 1;
          }
        }
      }
    }

    if (anyRejected) {
      return { status: "rejected", label: "Rejected", color: "error" };
    }

    if (approvedCount === totalRequired && totalRequired > 0) {
      return { status: "approved", label: "Fully Approved", color: "success" };
    }

    if (currentStage) {
      return {
        status: "pending",
        label: `Level ${currentStage} - ${approvedCount}/${totalRequired} Approved`,
        color: "warning",
      };
    }

    return { status: "unknown", label: "Unknown", color: "default" };
  };

  const getNextApprover = (employee) => {
    if (!employee || !employee.approvalStatus?.enteredBy) {
      return "N/A";
    }

    const levels = [
      { key: "level1", approver: employee.level1Approver },
      { key: "level2", approver: employee.level2Approver },
      { key: "level3", approver: employee.level3Approver },
      { key: "level4", approver: employee.level4Approver },
      { key: "level5", approver: employee.level5Approver },
    ];

    for (const level of levels) {
      const status = employee.approvalStatus?.[level.key]?.status;

      // Check if this level has an approver assigned
      if (level.approver) {
        // If status is pending at this level, this is the next approver
        if (status === "pending") {
          return `${level.approver.firstName} ${level.approver.lastName} (${level.approver.employeeId})`;
        }

        // If rejected, show that
        if (status === "rejected") {
          return "Rejected";
        }

        // If not approved yet and not pending, there's an issue
        if (status !== "approved") {
          return "Pending";
        }
      }
    }

    return "All Approved";
  };

  const columns = [
    {
      field: "slNo",
      headerName: "Sl No",
      width: 80,
      minWidth: 80,
      flex: 0.4,
      renderCell: (params) => {
        const index = employees.findIndex((emp) => emp._id === params.row._id);
        return index + 1;
      },
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      minWidth: 150,
      flex: 1.2,
      valueGetter: (params, row) =>
        `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    },
    {
      field: "jobTitle",
      headerName: "Job Title",
      width: 180,
      minWidth: 150,
      flex: 1,
      renderCell: (params) => params.row.jobTitle || "N/A",
    },
    {
      field: "branch",
      headerName: "Branch",
      width: 200,
      minWidth: 180,
      flex: 1,
      renderCell: (params) => {
        const branch = params.row.branch;
        return branch
          ? `${branch.branchCode} - ${branch.branchName}`
          : "Not Assigned";
      },
    },
    {
      field: "salaryType",
      headerName: "Salary Type",
      width: 130,
      minWidth: 120,
      flex: 0.7,
      renderCell: (params) => params.row.salaryType || "N/A",
    },
    {
      field: "annualSalary",
      headerName: "Annual Salary",
      width: 150,
      minWidth: 130,
      flex: 0.8,
      renderCell: (params) => {
        const salary = params.row.annualSalary || 0;
        return salary > 0 ? `$${salary.toLocaleString()}` : "N/A";
      },
    },
    {
      field: "hourlyPayRate",
      headerName: "Hourly Rate",
      width: 130,
      minWidth: 120,
      flex: 0.7,
      renderCell: (params) => {
        const rate = params.row.hourlyPayRate || 0;
        return rate > 0 ? `$${rate.toFixed(2)}` : "N/A";
      },
    },
    {
      field: "bonus2024",
      headerName: "Bonus 2024",
      width: 130,
      minWidth: 120,
      flex: 0.7,
      renderCell: (params) => {
        const bonus = params.row.bonus2024 || 0;
        return `$${bonus.toLocaleString()}`;
      },
    },
    {
      field: "bonus2025",
      headerName: "Bonus 2025",
      width: 130,
      minWidth: 120,
      flex: 0.7,
      renderCell: (params) => {
        const bonus = params.row.bonus2025 || 0;
        return `$${bonus.toLocaleString()}`;
      },
    },
    // {
    //   field: "approvalStatus",
    //   headerName: "Approval Status",
    //   width: 150,
    //   flex: 0.8,
    //   renderCell: (params) => {
    //     const approvalInfo = getApprovalStatus(params.row);
    //     return (
    //       <Chip
    //         label={approvalInfo.label}
    //         color={approvalInfo.color}
    //         size="small"
    //         icon={
    //           approvalInfo.status === "approved" ? (
    //             <CheckCircleIcon />
    //           ) : approvalInfo.status === "pending" ? (
    //             <PendingIcon />
    //           ) : approvalInfo.status === "rejected" ? (
    //             <CancelIcon />
    //           ) : null
    //         }
    //       />
    //     );
    //   },
    // },
    // {
    //   field: "nextApprover",
    //   headerName: "Next Approver",
    //   width: 200,
    //   flex: 1.2,
    //   renderCell: (params) => getNextApprover(params.row),
    // },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      minWidth: 120,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => {
        const approvalInfo = getApprovalStatus(params.row);
        const canEdit = approvalInfo.status !== "approved";

        // If bonus is not entered yet, show "Add Bonus" button
        if (approvalInfo.status === "not_entered") {
          return (
            <Button
              variant="contained"
              size="small"
              onClick={() => handleOpenBonusDialog(params.row)}
              sx={{ fontSize: "0.75rem", py: 0.5, minWidth: "auto" }}
            >
              Add Bonus
            </Button>
          );
        }

        // If bonus is entered, show "Edit Bonus" text button
        return (
          <Tooltip title={canEdit ? "" : "Cannot edit fully approved bonus"}>
            <span>
              <Button
                variant="outlined"
                size="small"
                disabled={!canEdit}
                onClick={() => handleOpenBonusDialog(params.row)}
                sx={{ fontSize: "0.75rem", py: 0.5, minWidth: "auto" }}
              >
                Edit Bonus
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography component="h2" variant="h6">
          Assign Employee Bonuses
        </Typography>

        <Box sx={{ textAlign: "right", pr: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: "medium" }}
          >
            TOTAL BONUS (2025)
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "primary.main" }}
          >
            $
            {employees
              .reduce((sum, emp) => sum + (parseFloat(emp.bonus2025) || 0), 0)
              .toLocaleString()}
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        As a supervisor, you can enter and update bonus amounts for employees
        under your supervision. Once entered, bonuses will go through the
        approval process.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: "100%", mb: 2, overflow: "auto" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
            }}
          >
            <CircularProgress />
          </Box>
        ) : employees.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
              p: 3,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No employees found under your supervision
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={employees}
            columns={columns}
            getRowId={(row) => row._id}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              minWidth: 1200,
              "& .MuiDataGrid-cell:hover": {
                cursor: "pointer",
              },
            }}
            autoHeight
          />
        )}
      </Paper>

      {/* Bonus Edit Dialog */}
      <Dialog
        open={bonusDialog.open}
        onClose={handleCloseBonusDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {getApprovalStatus(bonusDialog.employee).status !== "not_entered"
            ? "Edit"
            : "Add"}{" "}
          Bonus for {bonusDialog.employee?.firstName}{" "}
          {bonusDialog.employee?.lastName}
        </DialogTitle>
        <DialogContent>
          {bonusDialog.employee && (
            <>
              <Box sx={{ mb: 3, mt: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  <strong>Employee ID:</strong>{" "}
                  {bonusDialog.employee.employeeId}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  <strong>Job Title:</strong>{" "}
                  {bonusDialog.employee.jobTitle || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>2024 Bonus:</strong> $
                  {(bonusDialog.employee.bonus2024 || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>2025 Bonus:</strong> $
                  {(bonusDialog.employee.bonus2025 || 0).toLocaleString()}
                </Typography>
              </Box>

              <TextField
                autoFocus
                margin="dense"
                label="Bonus Amount for 2025"
                fullWidth
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="Enter bonus amount"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
                helperText="Enter the bonus amount for 2025. This will be sent for approval."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBonusDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitBonus}
            variant="contained"
            color="primary"
            disabled={submitting || !bonusAmount}
            sx={{
              color: "#FFFFFF",
              "&.Mui-disabled": {
                color: "#FFFFFF",
                opacity: 0.7,
                backgroundColor: "rgba(0, 0, 0, 0.12)",
              },
            }}
          >
            {submitting ? "Saving..." : "Save & Send for Approval"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bonuses;
