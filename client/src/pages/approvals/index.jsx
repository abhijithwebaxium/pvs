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
import API_URL from "../../config/api";

const Approvals = () => {
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
  const [currentTab, setCurrentTab] = useState(0);
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
      const response = await fetch(
        `${API_URL}/api/employees/approvals/my-approvals`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
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
    fetchApprovals();
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

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
      const response = await fetch(
        `${API_URL}/api/employees/approvals/${approvalDialog.employee._id}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            level: approvalDialog.level,
            action: approvalDialog.action,
            comments: comments,
          }),
        }
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
    // Check if previous levels are approved
    if (level === 1) return true; // Level 1 can always approve

    // For level 2+, check if previous levels are complete
    for (let i = 1; i < level; i++) {
      const levelKey = `level${i}`;
      const approverField = `${levelKey}Approver`;
      const status = employee.approvalStatus?.[levelKey]?.status;

      // If previous level has an approver assigned, it must be approved
      if (employee[approverField]) {
        if (status !== "approved") {
          return false;
        }
      }
      // If no approver at previous level, it's automatically considered complete
    }

    return true;
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
      const canPerformAction = canApprove(params.row, level);

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
          <Tooltip
            title={
              canPerformAction
                ? "Approve"
                : "Previous levels must be approved first"
            }
          >
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
          <Tooltip
            title={
              canPerformAction
                ? "Reject"
                : "Previous levels must be approved first"
            }
          >
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
      not_required: "N/A",
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
    if (!approver) return "Not Assigned";
    return `${approver.firstName} ${approver.lastName} (${approver.employeeId})`;
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
      field: "firstName",
      headerName: "First Name",
      width: 150,
      flex: 0.8,
    },
    {
      field: "lastName",
      headerName: "Last Name",
      width: 150,
      flex: 0.8,
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
      field: "email",
      headerName: "Email",
      width: 200,
      flex: 1.2,
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
      renderCell: (params) => getApproverInfo(params.row.level1Approver),
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
      renderCell: (params) => getApproverInfo(params.row.level1Approver),
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
      renderCell: (params) => getApproverInfo(params.row.level2Approver),
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
      renderCell: (params) => getApproverInfo(params.row.level2Approver),
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
      renderCell: (params) => getApproverInfo(params.row.level3Approver),
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
      renderCell: (params) => getApproverInfo(params.row.level1Approver),
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
      renderCell: (params) => getApproverInfo(params.row.level2Approver),
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
      renderCell: (params) => getApproverInfo(params.row.level3Approver),
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
      renderCell: (params) => getApproverInfo(params.row.level4Approver),
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

  const columnsMap = {
    0: level1Columns,
    1: level2Columns,
    2: level3Columns,
    3: level4Columns,
    4: level5Columns,
  };

  const dataMap = {
    0: approvalsData.level1,
    1: approvalsData.level2,
    2: approvalsData.level3,
    3: approvalsData.level4,
    4: approvalsData.level5,
  };

  const countsMap = {
    0: counts.level1,
    1: counts.level2,
    2: counts.level3,
    3: counts.level4,
    4: counts.level5,
  };

  // Calculate total pending and approved counts
  const calculateSummary = () => {
    // Total pending = sum of all level counts (from backend)
    const totalPending = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0
    );

    // Total approved = count employees where current user has approved at the specific level
    let totalApproved = 0;

    Object.keys(approvalsData).forEach((levelKey) => {
      // Extract level number from key (e.g., "level1" -> 1)
      const level = parseInt(levelKey.replace("level", ""));
      const employees = approvalsData[levelKey];

      if (Array.isArray(employees)) {
        employees.forEach((employee) => {
          const status = employee.approvalStatus?.[levelKey]?.status;
          if (status === "approved") {
            totalApproved++;
          }
        });
      }
    });

    return { totalPending, totalApproved };
  };

  const { totalPending, totalApproved } = calculateSummary();

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
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="approval levels"
          >
            <Tab
              label={
                <Badge badgeContent={counts.level1} color="primary">
                  Level 1
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={counts.level2} color="primary">
                  Level 2
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={counts.level3} color="primary">
                  Level 3
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={counts.level4} color="primary">
                  Level 4
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={counts.level5} color="primary">
                  Level 5
                </Badge>
              }
            />
          </Tabs>
        </Box>

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
            {countsMap[currentTab] === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 200,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No employees require your approval at Level {currentTab + 1}
                </Typography>
              </Box>
            ) : (
              <DataGrid
                rows={dataMap[currentTab]}
                columns={columnsMap[currentTab]}
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
            ? "Approve Employee"
            : "Reject Employee"}
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
                    (_, i) => i + 1
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
