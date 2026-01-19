import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  InputAdornment,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import AddEmployeeModal from '../../components/modals/AddEmployeeModal';
import UploadEmployeesModal from '../../components/modals/UploadEmployeesModal';
// import API_URL from '../../config/api';
import api from '../../utils/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

const fetchEmployees = async () => {
  setLoading(true);
  setError('');

  try {
    const response = await api.get('/api/employees');
    const { data } = response;

    setEmployees(data.data);
    setFilteredEmployees(data.data);
  } catch (err) {
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      'An error occurred while fetching employees';

    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

const fetchBranches = async () => {
  try {
    const response = await api.get('/api/branches');
    const { data } = response;

    setBranches(data.data);
  } catch (err) {
    console.error(
      err.response?.data?.message || 'Failed to fetch branches'
    );
  }
};

  useEffect(() => {
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
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query)
      );
    }

    // Branch filter
    if (selectedBranch) {
      filtered = filtered.filter(
        (emp) => emp.branch?._id === selectedBranch
      );
    }

    // Role filter
    if (selectedRole) {
      filtered = filtered.filter((emp) => emp.role === selectedRole);
    }

    // Status filter
    if (selectedStatus !== '') {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter((emp) => emp.isActive === isActive);
    }

    setFilteredEmployees(filtered);
  }, [searchQuery, selectedBranch, selectedRole, selectedStatus, employees]);

  const handleAddEmployee = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleEmployeeAdded = () => {
    setOpenModal(false);
    fetchEmployees(); // Refresh the list
  };

  const handleUploadClick = () => {
    setOpenUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setOpenUploadModal(false);
  };

  const handleEmployeesUploaded = () => {
    setOpenUploadModal(false);
    fetchEmployees(); // Refresh the list
  };

  const columns = [
    {
      field: 'employeeId',
      headerName: 'Employee ID',
      width: 130,
      flex: 0.6,
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      width: 150,
      flex: 0.8,
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      width: 150,
      flex: 0.8,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      flex: 1.2,
    },
    {
      field: 'branch',
      headerName: 'Branch',
      width: 180,
      flex: 1,
      renderCell: (params) => {
        const branch = params.row.branch;
        return branch
          ? `${branch.branchCode} - ${branch.branchName}`
          : 'Not Assigned';
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      flex: 0.8,
      renderCell: (params) => params.value || 'N/A',
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      flex: 0.6,
      renderCell: (params) => (
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            color: 'primary.dark',
            fontWeight: 'medium',
            textTransform: 'capitalize',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      flex: 0.8,
      renderCell: (params) => params.value || 'N/A',
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      flex: 0.5,
      renderCell: (params) => (
        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 1,
            color: params.value ? 'success.dark' : 'error.dark',
            fontWeight: 'medium',
          }}
        >
          {params.value ? 'Active' : 'Inactive'}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Employees
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          {/* Search, Filters, and Action Buttons - All in one row */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
              mb: 2,
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

            {/* Action Buttons - Push to the right */}
            <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddEmployee}
              >
                Add Employee
              </Button>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleUploadClick}
              >
                Upload Excel
              </Button>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredEmployees}
            columns={columns}
            getRowId={(row) => row._id}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell:hover': {
                cursor: 'pointer',
              },
            }}
            autoHeight
          />
        )}
      </Paper>

      <AddEmployeeModal
        open={openModal}
        onClose={handleCloseModal}
        onEmployeeAdded={handleEmployeeAdded}
      />

      <UploadEmployeesModal
        open={openUploadModal}
        onClose={handleCloseUploadModal}
        onEmployeesUploaded={handleEmployeesUploaded}
      />
    </Box>
  );
};

export default Employees;
