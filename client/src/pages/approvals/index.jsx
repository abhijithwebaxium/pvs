import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import InfoIcon from "@mui/icons-material/Info";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/userSlice";
import API_URL from "../../config/api";

const Approvals = () => {
  const user = useSelector(selectUser);
  const [approvalsData, setApprovalsData] = useState({
    level1: [],
    level2: [],
    level3: [],
    level4: [],
    level5: [],
  });
  const [counts, setCounts] = useState({
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    employee: null,
    level: null,
    action: null, // 'approve' or 'reject'
  });
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = user?.id || user?._id;
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/employees/approvals/my-approvals?approverId=${userId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch approvals");
      }

      setApprovalsData(data.data);
      setCounts(data.counts);
    } catch (err) {
      setError(err.message || "An error occurred while fetching approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id || user?._id) {
      fetchApprovals();
    }
  }, [user]);

  const handleOpenApprovalDialog = (employee, level, action) => {
    setApprovalDialog({
      open: true,
      employee,
      level,
      action,
    });
    setComments("");
  };

  const handleCloseApprovalDialog = () => {
    setApprovalDialog({
      open: false,
      employee: null,
      level: null,
      action: null,
    });
    setComments("");
  };

  const handleSubmitApproval = async () => {
    setSubmitting(true);
    setError("");

    try {
      const userId = user?.id || user?._id;
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/employees/approvals/${approvalDialog.employee._id}?approverId=${userId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            level: approvalDialog.level,
            action: approvalDialog.action,
            comments: comments,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process approval");
      }

      // Refresh the approvals list
      await fetchApprovals();
      handleCloseApprovalDialog();
    } catch (err) {
      setError(err.message || "An error occurred while processing approval");
    } finally {
      setSubmitting(false);
    }
  };

  const canApprove = (employee, level) => {
    // REQUIREMENT: Bonus must be entered
    // Consider it entered if enteredBy metadata exists OR bonus2025 is greater than 0
    const isBonusEntered = !!(
      employee.approvalStatus?.enteredBy ||
      (employee.bonus2025 && parseFloat(employee.bonus2025) > 0)
    );

    if (!isBonusEntered) {
      return { can: false, reason: "bonus_missing" };
    }

    // Check if previous levels are approved
    if (level === 1) return { can: true };

    // For level 2+, check if previous levels are complete
    for (let i = 1; i < level; i++) {
      const levelKey = `level${i}`;
      const approverField = `${levelKey}Approver`;
      const status = employee.approvalStatus?.[levelKey]?.status;

      if (employee[approverField]) {
        if (status !== "approved") {
          return { can: false, reason: "prev_level_pending", prevLevel: i };
        }
      }
    }

    return { can: true };
  };

  const getActionsColumn = (level) => ({
    field: "actions",
    headerName: "Actions",
    width: 120,
    flex: 0.6,
    sortable: false,
    renderCell: (params) => {
      const currentStatus =
        params.row.approvalStatus?.[`level${level}`]?.status || "pending";
      const isPending = currentStatus === "pending";
      const isApproved = currentStatus === "approved";
      const isRejected = currentStatus === "rejected";
      const approvalState = canApprove(params.row, level);
      const canPerformAction = approvalState.can;

      const getTooltipTitle = (action) => {
        if (canPerformAction)
          return action === "approve" ? "Approve" : "Reject";
        if (approvalState.reason === "bonus_missing")
          return "Bonus must be assigned before approval";
        if (approvalState.reason === "prev_level_pending")
          return `Level ${approvalState.prevLevel} must be approved first`;
        return "Not authorized at this time";
      };

      if (isApproved) {
        return (
          <Chip
            label="Approved"
            color="success"
            size="small"
            icon={<CheckCircleIcon />}
          />
        );
      }

      if (isRejected) {
        return (
          <Chip
            label="Rejected"
            color="error"
            size="small"
            icon={<CancelIcon />}
          />
        );
      }

      return (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title={getTooltipTitle("approve")}>
            <span>
              <IconButton
                size="small"
                color="success"
                disabled={!canPerformAction}
                onClick={() =>
                  handleOpenApprovalDialog(params.row, level, "approve")
                }
              >
                <CheckCircleIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={getTooltipTitle("reject")}>
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={!canPerformAction}
                onClick={() =>
                  handleOpenApprovalDialog(params.row, level, "reject")
                }
              >
                <CancelIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      );
    },
  });

  const getStatusChip = (status) => {
    const statusColors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      not_required: "default",
    };

    const statusLabels = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      not_required: "Not Approved",
    };

    return (
      <Chip
        label={statusLabels[status] || status}
        color={statusColors[status] || "default"}
        size="small"
      />
    );
  };

  const getApproverInfo = (approver) => {
    if (!approver || !approver.firstName) return null;
    return `${approver.firstName} ${approver.lastName || ""} (${approver.employeeId || "N/A"})`;
  };

  // Base columns that are common across all levels
  const baseColumns = [
    {
      field: "employeeId",
      headerName: "Employee ID",
      width: 130,
      flex: 0.6,
    },
    {
      field: "name",
      headerName: "Name",
      width: 250,
      flex: 1.2,
      valueGetter: (params, row) =>
        `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    },
    {
      field: "bonus2024",
      headerName: "Bonus 2024",
      width: 120,
      flex: 0.6,
      renderCell: (params) => {
        const bonus = params.row.bonus2024 || 0;
        return `$${bonus.toLocaleString()}`;
      },
    },
    {
      field: "bonus2025",
      headerName: "Bonus 2025",
      width: 120,
      flex: 0.6,
      renderCell: (params) => {
        const bonus = params.row.bonus2025 || 0;
        return `$${bonus.toLocaleString()}`;
      },
    },
    {
      field: "branch",
      headerName: "Branch",
      width: 180,
      flex: 1,
      renderCell: (params) => {
        const branch = params.row.branch;
        return branch
          ? `${branch.branchCode} - ${branch.branchName}`
          : "Not Assigned";
      },
    },
  ];

  // Level 1 columns - no previous approvals
  const level1Columns = [
    ...baseColumns,
    {
      field: "approvalStatus.level1.status",
      headerName: "Level 1 Status",
      width: 150,
      flex: 0.8,
      renderCell: (params) => {
        const status = params.row.approvalStatus?.level1?.status || "pending";
        return getStatusChip(status);
      },
    },
    getActionsColumn(1),
  ];

  // Level 2 columns - show level 1 info
  const level2Columns = [
    ...baseColumns,
    {
      field: "level1Approver",
      headerName: "Level 1 Approver",
      width: 200,
      flex: 1,
      renderCell: (params) =>
        getApproverInfo(params.row.level1Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level1.status",
      headerName: "Level 1 Status",
      width: 130,
      flex: 0.7,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level1?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "approvalStatus.level2.status",
      headerName: "Level 2 Status",
      width: 130,
      flex: 0.7,
      renderCell: (params) => {
        const status = params.row.approvalStatus?.level2?.status || "pending";
        return getStatusChip(status);
      },
    },
    getActionsColumn(2),
  ];

  // Level 3 columns - show level 1 & 2 info
  const level3Columns = [
    ...baseColumns,
    {
      field: "level1Approver",
      headerName: "Level 1 Approver",
      width: 200,
      flex: 0.9,
      renderCell: (params) =>
        getApproverInfo(params.row.level1Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level1.status",
      headerName: "L1 Status",
      width: 110,
      flex: 0.6,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level1?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "level2Approver",
      headerName: "Level 2 Approver",
      width: 200,
      flex: 0.9,
      renderCell: (params) =>
        getApproverInfo(params.row.level2Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level2.status",
      headerName: "L2 Status",
      width: 110,
      flex: 0.6,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level2?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "approvalStatus.level3.status",
      headerName: "L3 Status",
      width: 110,
      flex: 0.6,
      renderCell: (params) => {
        const status = params.row.approvalStatus?.level3?.status || "pending";
        return getStatusChip(status);
      },
    },
    getActionsColumn(3),
  ];

  // Level 4 columns - show level 1, 2 & 3 info
  const level4Columns = [
    ...baseColumns,
    {
      field: "level1Approver",
      headerName: "L1 Approver",
      width: 180,
      flex: 0.8,
      renderCell: (params) => getApproverInfo(params.row.level1Approver),
    },
    {
      field: "approvalStatus.level1.status",
      headerName: "L1",
      width: 90,
      flex: 0.5,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level1?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "level2Approver",
      headerName: "L2 Approver",
      width: 180,
      flex: 0.8,
      renderCell: (params) =>
        getApproverInfo(params.row.level2Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level2.status",
      headerName: "L2",
      width: 90,
      flex: 0.5,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level2?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "level3Approver",
      headerName: "L3 Approver",
      width: 180,
      flex: 0.8,
      renderCell: (params) =>
        getApproverInfo(params.row.level3Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level3.status",
      headerName: "L3",
      width: 90,
      flex: 0.5,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level3?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "approvalStatus.level4.status",
      headerName: "L4",
      width: 90,
      flex: 0.5,
      renderCell: (params) => {
        const status = params.row.approvalStatus?.level4?.status || "pending";
        return getStatusChip(status);
      },
    },
    getActionsColumn(4),
  ];

  // Level 5 columns - show all previous levels
  const level5Columns = [
    ...baseColumns,
    {
      field: "level1Approver",
      headerName: "L1 Approver",
      width: 170,
      flex: 0.7,
      renderCell: (params) =>
        getApproverInfo(params.row.level1Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level1.status",
      headerName: "L1",
      width: 85,
      flex: 0.4,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level1?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "level2Approver",
      headerName: "L2 Approver",
      width: 170,
      flex: 0.7,
      renderCell: (params) =>
        getApproverInfo(params.row.level2Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level2.status",
      headerName: "L2",
      width: 85,
      flex: 0.4,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level2?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "level3Approver",
      headerName: "L3 Approver",
      width: 170,
      flex: 0.7,
      renderCell: (params) =>
        getApproverInfo(params.row.level3Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level3.status",
      headerName: "L3",
      width: 85,
      flex: 0.4,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level3?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "level4Approver",
      headerName: "L4 Approver",
      width: 170,
      flex: 0.7,
      renderCell: (params) =>
        getApproverInfo(params.row.level4Approver) || "Not Assigned",
    },
    {
      field: "approvalStatus.level4.status",
      headerName: "L4",
      width: 85,
      flex: 0.4,
      renderCell: (params) => {
        const status =
          params.row.approvalStatus?.level4?.status || "not_required";
        return getStatusChip(status);
      },
    },
    {
      field: "approvalStatus.level5.status",
      headerName: "L5",
      width: 85,
      flex: 0.4,
      renderCell: (params) => {
        const status = params.row.approvalStatus?.level5?.status || "pending";
        return getStatusChip(status);
      },
    },
    getActionsColumn(5),
  ];

  // Create unified columns and merged data
  const unifiedColumns = [
    ...baseColumns,
    {
      field: "approverLevel",
      headerName: "Approver Level",
      width: 170,
      flex: 0.8,
      renderCell: (params) => {
        const currentLevel = params.row.currentPendingLevel;

        // Build tooltip content for all assigned levels
        const history = [];
        for (let i = 1; i <= 5; i++) {
          if (
            params.row[`level${i}Approver`] ||
            params.row[`level${i}ApproverName`]
          ) {
            const status =
              params.row.approvalStatus?.[`level${i}`]?.status || "pending";
            const approver = params.row[`level${i}Approver`];
            const approverName =
              approver && approver.firstName
                ? `${approver.lastName || ""}, ${approver.firstName} (${approver.employeeId || "N/A"})`
                : params.row[`level${i}ApproverName`] || "Assigned";
            history.push({
              level: i,
              status,
              approverName,
              isCurrent: i === currentLevel,
            });
          }
        }

        const tooltipContent = (
          <Box sx={{ p: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                fontWeight: "bold",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                pb: 0.5,
              }}
            >
              Approval History
            </Typography>
            {history.length === 0 ? (
              <Typography variant="caption">Initial approval level</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {history.map((h) => (
                  <Box
                    key={h.level}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: h.isCurrent ? 0.5 : 0,
                      borderRadius: 1,
                      bgcolor: h.isCurrent
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                      border: h.isCurrent
                        ? "1px solid rgba(255,255,255,0.2)"
                        : "none",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        minWidth: 50,
                        fontWeight: h.isCurrent ? "bold" : "normal",
                      }}
                    >
                      Level {h.level}:
                    </Typography>
                    <Chip
                      label={
                        h.status === "approved"
                          ? "APPROVED"
                          : h.status === "rejected"
                            ? "REJECTED"
                            : "NOT APPROVED"
                      }
                      size="small"
                      color={
                        h.status === "approved"
                          ? "success"
                          : h.status === "rejected"
                            ? "error"
                            : "default"
                      }
                      sx={{ height: 20, fontSize: "0.65rem" }}
                    />
                    <Typography
                      variant="caption"
                      color="inherit"
                      sx={{ fontStyle: "italic", ml: 0.5 }}
                    >
                      by {h.approverName}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`Level ${currentLevel}`}
              size="small"
              variant="outlined"
            />
            <Tooltip title={tooltipContent} arrow placement="right">
              <IconButton size="small" color="primary">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      flex: 0.6,
      sortable: false,
      renderCell: (params) => {
        const level = params.row.currentPendingLevel;
        const currentStatus =
          params.row.approvalStatus?.[`level${level}`]?.status || "pending";
        const isApproved = currentStatus === "approved";
        const isRejected = currentStatus === "rejected";
        const approvalState = canApprove(params.row, level);
        const canPerformAction = approvalState.can;

        const getTooltipTitle = (action) => {
          if (canPerformAction)
            return action === "approve" ? "Approve" : "Reject";
          if (approvalState.reason === "bonus_missing")
            return "Bonus must be assigned before approval";
          if (approvalState.reason === "prev_level_pending")
            return `Level ${approvalState.prevLevel} must be approved first`;
          return "Not authorized at this time";
        };

        if (isApproved)
          return (
            <Chip
              label="Approved"
              color="success"
              size="small"
              icon={<CheckCircleIcon />}
            />
          );
        if (isRejected)
          return (
            <Chip
              label="Rejected"
              color="error"
              size="small"
              icon={<CancelIcon />}
            />
          );

        return (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title={getTooltipTitle("approve")}>
              <span>
                <IconButton
                  size="small"
                  color="success"
                  disabled={!canPerformAction}
                  onClick={() =>
                    handleOpenApprovalDialog(params.row, level, "approve")
                  }
                >
                  <CheckCircleIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={getTooltipTitle("reject")}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={!canPerformAction}
                  onClick={() =>
                    handleOpenApprovalDialog(params.row, level, "reject")
                  }
                >
                  <CancelIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  // Calculate the current pending level for an employee
  const getPendingLevel = (emp) => {
    for (let i = 1; i <= 5; i++) {
      const status = emp.approvalStatus?.[`level${i}`]?.status || "pending";
      if (status === "pending" && emp[`level${i}Approver`]) {
        return i;
      }
    }
    return 1;
  };

  // Merge all levels into one array
  const mergedRows = [];
  if (
    approvalsData &&
    typeof approvalsData === "object" &&
    !Array.isArray(approvalsData)
  ) {
    Object.keys(approvalsData).forEach((levelKey) => {
      const level = parseInt(levelKey.replace("level", ""));
      const employees = approvalsData[levelKey];
      if (Array.isArray(employees)) {
        employees.forEach((emp) => {
          mergedRows.push({
            ...emp,
            currentPendingLevel: level,
            uniqueId: `${emp._id}-${level}`,
          });
        });
      }
    });
  } else if (Array.isArray(approvalsData)) {
    // Fallback if data is already a flat array
    approvalsData.forEach((emp) => {
      // Try to determine level from approvalStatus if not provided
      let level = 1;
      for (let i = 1; i <= 5; i++) {
        if (
          emp.approvalStatus?.[`level${i}`]?.status === "pending" &&
          emp[`level${i}Approver`]
        ) {
          level = i;
          break;
        }
      }
      mergedRows.push({
        ...emp,
        currentPendingLevel: level,
        uniqueId: `${emp._id}-${level}`,
      });
    });
  }

  // Calculate summary counts
  let totalPending = 0;
  let totalApproved = 0;

  if (
    approvalsData &&
    typeof approvalsData === "object" &&
    !Array.isArray(approvalsData)
  ) {
    Object.keys(approvalsData).forEach((levelKey) => {
      const employees = approvalsData[levelKey];
      if (Array.isArray(employees)) {
        employees.forEach((employee) => {
          const status =
            employee.approvalStatus?.[levelKey]?.status || "pending";
          if (status === "approved") {
            totalApproved++;
          } else if (status === "rejected") {
            // Not counted in either for now, or could be in total
          } else {
            totalPending++;
          }
        });
      }
    });
  } else if (Array.isArray(approvalsData)) {
    mergedRows.forEach((row) => {
      const status =
        row.approvalStatus?.[`level${row.currentPendingLevel}`]?.status ||
        "pending";
      if (status === "approved") {
        totalApproved++;
      } else if (status !== "rejected") {
        totalPending++;
      }
    });
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        My Approvals
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card
            sx={{ bgcolor: "warning.light", color: "warning.contrastText" }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{ fontWeight: "bold" }}
                  >
                    {totalPending}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Pending Approvals
                  </Typography>
                </Box>
                <PendingActionsIcon sx={{ fontSize: 60, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card
            sx={{ bgcolor: "success.light", color: "success.contrastText" }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{ fontWeight: "bold" }}
                  >
                    {totalApproved}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Approved
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 60, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: "100%", mb: 2 }}>
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
        ) : (
          <Box sx={{ p: 2 }}>
            {mergedRows.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 200,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No employees require your approval at any level.
                </Typography>
              </Box>
            ) : (
              <DataGrid
                rows={mergedRows}
                columns={unifiedColumns}
                getRowId={(row) => row.uniqueId}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
                pageSizeOptions={[5, 10, 25, 50]}
                disableRowSelectionOnClick
                sx={{
                  border: 0,
                  "& .MuiDataGrid-cell:hover": {
                    cursor: "pointer",
                  },
                }}
                autoHeight
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog.open}
        onClose={handleCloseApprovalDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {approvalDialog.action === "approve"
            ? "Approve Employee Bonus"
            : "Reject Employee Bonus"}
        </DialogTitle>
        <DialogContent>
          {approvalDialog.employee && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Employee:</strong> {approvalDialog.employee.firstName}{" "}
                  {approvalDialog.employee.lastName} (
                  {approvalDialog.employee.employeeId})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Current Level:</strong> {approvalDialog.level}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>2024 Bonus:</strong> $
                  {(approvalDialog.employee.bonus2024 || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>2025 Bonus:</strong> $
                  {(approvalDialog.employee.bonus2025 || 0).toLocaleString()}
                </Typography>
              </Box>

              {/* Show previous approval levels if level > 1 */}
              {approvalDialog.level > 1 && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: "background.default",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, fontWeight: "bold" }}
                  >
                    Previous Approval History
                  </Typography>
                  {Array.from(
                    { length: approvalDialog.level - 1 },
                    (_, i) => i + 1,
                  ).map((level) => {
                    const levelKey = `level${level}`;
                    const approvalInfo =
                      approvalDialog.employee.approvalStatus?.[levelKey];
                    const approver =
                      approvalDialog.employee[`level${level}Approver`];
                    const status = approvalInfo?.status || "pending";
                    const approvedAt = approvalInfo?.approvedAt;
                    const levelComments = approvalInfo?.comments;

                    return (
                      <Box
                        key={level}
                        sx={{
                          mb: 2,
                          pb: 2,
                          borderBottom:
                            level < approvalDialog.level - 1
                              ? "1px solid"
                              : "none",
                          borderColor: "divider",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            Level {level}:
                          </Typography>
                          {getStatusChip(status)}
                        </Box>
                        {approver && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            <strong>Approver:</strong> {approver.firstName}{" "}
                            {approver.lastName} ({approver.employeeId})
                          </Typography>
                        )}
                        {approvedAt && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            <strong>Date:</strong>{" "}
                            {new Date(approvedAt).toLocaleString()}
                          </Typography>
                        )}
                        {levelComments && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            <strong>Comments:</strong> {levelComments}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </>
          )}
          <TextField
            autoFocus
            margin="dense"
            label={`Level ${approvalDialog.level} Comments (Optional)`}
            fullWidth
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any comments about this decision..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApprovalDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitApproval}
            variant="contained"
            color={approvalDialog.action === "approve" ? "success" : "error"}
            disabled={submitting}
            sx={{ color: "white" }}
          >
            {submitting
              ? "Processing..."
              : approvalDialog.action === "approve"
                ? "Approve"
                : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Approvals;
