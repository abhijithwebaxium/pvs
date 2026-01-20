import { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import SearchIcon from "@mui/icons-material/Search";
import useDashboardStats from "../../hooks/useDashboardStats";
import api from "../../utils/api";

const HRDashboard = ({ user }) => {
  const {
    staffCount,
    branchCount,
    loading: statsLoading,
    error: statsError,
  } = useDashboardStats();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/api/employees");
        setEmployees(response.data.data);
        setFilteredEmployees(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "An error occurred while fetching employees",
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await api.get("/api/branches");
        setBranches(response.data.data);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    fetchEmployees();
    fetchBranches();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    let filtered = [...employees];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employeeId?.toLowerCase().includes(query) ||
          emp.firstName?.toLowerCase().includes(query) ||
          emp.lastName?.toLowerCase().includes(query) ||
          emp.email?.toLowerCase().includes(query) ||
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query),
      );
    }

    // Branch filter
    if (selectedBranch) {
      filtered = filtered.filter((emp) => emp.branch?._id === selectedBranch);
    }

    // Role filter
    if (selectedRole) {
      filtered = filtered.filter((emp) => emp.role === selectedRole);
    }

    // Status filter
    if (selectedStatus !== "") {
      const isActive = selectedStatus === "active";
      filtered = filtered.filter((emp) => emp.isActive === isActive);
    }

    setFilteredEmployees(filtered);
  }, [searchQuery, selectedBranch, selectedRole, selectedStatus, employees]);

  // Calculate approval completion stats
  const totalEmployees = filteredEmployees.length;
  const fullyApprovedCount = filteredEmployees.filter((emp) => {
    // Check if all 5 levels are approved
    for (let i = 1; i <= 5; i++) {
      const approver = emp[`level${i}Approver`];
      if (approver) {
        const status = emp.approvalStatus?.[`level${i}`]?.status;
        if (status !== "approved") {
          return false;
        }
      }
    }
    // Employee must have at least one approver assigned
    return emp.level1Approver || emp.level2Approver || emp.level3Approver || emp.level4Approver || emp.level5Approver;
  }).length;

  const columns = [
    {
      field: "slNo",
      headerName: "SL. No",
      width: 70,
      renderCell: (params) => {
        const rows = params.api.getAllRowIds();
        return rows.indexOf(params.id) + 1;
      },
    },
    {
      field: "employeeId",
      headerName: "Employee ID",
      width: 120,
    },
    {
      field: "fullName",
      headerName: "Name",
      width: 220,
      valueGetter: (params, row) =>
        `${row.firstName || ""} ${row.lastName || ""}`,
    },
    {
      field: "branch",
      headerName: "Branch",
      width: 180,
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
      renderCell: (params) => params.value || "N/A",
    },
    {
      field: "annualSalary",
      headerName: "Annual Salary",
      width: 150,
      renderCell: (params) => `$${(params.value || 0).toLocaleString()}`,
    },
    {
      field: "hourlyPayRate",
      headerName: "Hourly Rate",
      width: 130,
      renderCell: (params) => `$${(params.value || 0).toLocaleString()}`,
    },
    {
      field: "bonus2024",
      headerName: "2024 Bonus",
      width: 130,
      renderCell: (params) => `$${(params.value || 0).toLocaleString()}`,
    },
    {
      field: "bonus2025",
      headerName: "2025 Bonus",
      width: 130,
      renderCell: (params) => `$${(params.value || 0).toLocaleString()}`,
    },
    {
      field: "level1ApproverName",
      headerName: "Approver 1",
      width: 160,
      renderCell: (params) => {
        const approverName = params.value || "Not Assigned";
        const status = params.row.approvalStatus?.level1?.status;
        const color =
          status === "approved"
            ? "success.main"
            : status === "rejected"
              ? "error.main"
              : "text.primary";
        return (
          <Typography sx={{ color, mt: 1 }}>{approverName}</Typography>
        );
      },
    },
    {
      field: "level2ApproverName",
      headerName: "Approver 2",
      width: 160,
      renderCell: (params) => {
        const approverName = params.value || "Not Assigned";
        const status = params.row.approvalStatus?.level2?.status;
        const color =
          status === "approved"
            ? "success.main"
            : status === "rejected"
              ? "error.main"
              : "text.primary";
        return (
          <Typography sx={{ color, mt: 1 }}>{approverName}</Typography>
        );
      },
    },
    {
      field: "level3ApproverName",
      headerName: "Approver 3",
      width: 160,
      renderCell: (params) => {
        const approverName = params.value || "Not Assigned";
        const status = params.row.approvalStatus?.level3?.status;
        const color =
          status === "approved"
            ? "success.main"
            : status === "rejected"
              ? "error.main"
              : "text.primary";
        return (
          <Typography sx={{ color, mt: 1 }}>{approverName}</Typography>
        );
      },
    },
    {
      field: "level4ApproverName",
      headerName: "Approver 4",
      width: 160,
      renderCell: (params) => {
        const approverName = params.value || "Not Assigned";
        const status = params.row.approvalStatus?.level4?.status;
        const color =
          status === "approved"
            ? "success.main"
            : status === "rejected"
              ? "error.main"
              : "text.primary";
        return (
          <Typography sx={{ color, mt: 1 }}>{approverName}</Typography>
        );
      },
    },
    {
      field: "level5ApproverName",
      headerName: "Approver 5",
      width: 160,
      renderCell: (params) => {
        const approverName = params.value || "Not Assigned";
        const status = params.row.approvalStatus?.level5?.status;
        const color =
          status === "approved"
            ? "success.main"
            : status === "rejected"
              ? "error.main"
              : "text.primary";
        return (
          <Typography sx={{ color, mt: 1 }}>{approverName}</Typography>
        );
      },
    },
  ];

  if (statsError || error) {
    return (
      <Box sx={{ mb: 4 }}>
        <Alert severity="error">
          Failed to load dashboard data: {statsError || error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: "16px",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
              border: "1px solid",
              borderColor: "divider",
              transition:
                "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Total Employees
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>
                    {statsLoading ? <CircularProgress size={30} /> : staffCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: "12px",
                    backgroundColor: "primary.light",
                    color: "primary.main",
                    opacity: 0.9,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 32, color: "#fff" }} />
                </Box>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Active staff members
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: "16px",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
              border: "1px solid",
              borderColor: "divider",
              transition:
                "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Branches
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>
                    {statsLoading ? (
                      <CircularProgress size={30} />
                    ) : (
                      branchCount
                    )}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: "12px",
                    backgroundColor: "success.light",
                    color: "success.main",
                    opacity: 0.9,
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 32, color: "#fff" }} />
                </Box>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Operational locations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper
        sx={{
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
          border: "1px solid",
          borderColor: "divider",
          mb: 4,
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {/* Table Header */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                Employees
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {fullyApprovedCount}/{totalEmployees} employee's approval has been completed
              </Typography>
            </Box>

            {/* Filters Container */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Search Bar */}
              <TextField
                size="small"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Branch Filter */}
              <TextField
                select
                size="small"
                label="Branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Branches</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch._id} value={branch._id}>
                    {branch.branchCode} - {branch.branchName}
                  </MenuItem>
                ))}
              </TextField>

              {/* Role Filter */}
              <TextField
                select
                size="small"
                label="Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="approver">Approver</MenuItem>
                <MenuItem value="hr">HR</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>

              {/* Status Filter */}
              <TextField
                select
                size="small"
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>

        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={filteredEmployees}
            columns={columns}
            getRowId={(row) => row._id}
            loading={loading}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "background.paper",
                borderBottom: "2px solid",
                borderColor: "divider",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid",
                borderColor: "divider",
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default HRDashboard;
