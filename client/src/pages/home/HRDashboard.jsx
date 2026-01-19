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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/api/employees");
        setEmployees(response.data.data);
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

    fetchEmployees();
  }, []);

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
      renderCell: (params) => params.value || "Not Assigned",
    },
    {
      field: "level2ApproverName",
      headerName: "Approver 2",
      width: 160,
      renderCell: (params) => params.value || "Not Assigned",
    },
    {
      field: "level3ApproverName",
      headerName: "Approver 3",
      width: 160,
      renderCell: (params) => params.value || "Not Assigned",
    },
    {
      field: "level4ApproverName",
      headerName: "Approver 4",
      width: 160,
      renderCell: (params) => params.value || "Not Assigned",
    },
    {
      field: "level5ApproverName",
      headerName: "Approver 5",
      width: 160,
      renderCell: (params) => params.value || "Not Assigned",
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

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Employees
      </Typography>
      <Paper
        sx={{
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={employees}
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
