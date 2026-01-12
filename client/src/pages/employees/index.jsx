import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddEmployeeModal from '../../components/modals/AddEmployeeModal';
import UploadEmployeesModal from '../../components/modals/UploadEmployeesModal';
import API_URL from '../../config/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/employees`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch employees');
      }

      setEmployees(data.data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap:1 }}>
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
            rows={employees}
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
