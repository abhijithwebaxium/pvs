import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Slide,
  Grid,
  MenuItem,
  InputAdornment,
  IconButton,
  Autocomplete,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import api from "../../utils/api";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditEmployeeModal = ({ open, onClose, onEmployeeUpdated, employee }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
    bonus2024: "",
    supervisor: "",
    level1Approver: "",
    level2Approver: "",
    level3Approver: "",
    level4Approver: "",
    level5Approver: "",
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [approvers, setApprovers] = useState([]);

  // Fetch employees and approvers for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesRes, approversRes] = await Promise.all([
          api.get("/api/employees"),
          api.get("/api/employees?role=approver"),
        ]);
        setEmployees(employeesRes.data.data || []);
        setApprovers(approversRes.data.data || []);
      } catch (err) {
        console.error("Error fetching employees/approvers:", err);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Populate form when employee prop changes
  useEffect(() => {
    if (employee && open) {
      setFormData({
        employeeId: employee.employeeId || "",
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        password: "", // Don't populate password for security
        role: employee.role || "employee",
        bonus2024: employee.bonus2024 || "",
        supervisor: employee.supervisor?._id || "",
        level1Approver: employee.level1Approver?._id || "",
        level2Approver: employee.level2Approver?._id || "",
        level3Approver: employee.level3Approver?._id || "",
        level4Approver: employee.level4Approver?._id || "",
        level5Approver: employee.level5Approver?._id || "",
        isActive: employee.isActive !== undefined ? employee.isActive : true,
      });
      setError("");
    }
  }, [employee, open]);

  const handleChange = (e) => {
    const value =
      e.target.name === "isActive" ? e.target.value === "true" : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !formData.employeeId ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.email
    ) {
      setError("Employee ID, Name, and Email are required");
      return;
    }

    // Only validate password if it's being changed
    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        employeeId: formData.employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        bonus2024: formData.bonus2024 || undefined,
        supervisor: formData.supervisor || undefined,
        level1Approver: formData.level1Approver || undefined,
        level2Approver: formData.level2Approver || undefined,
        level3Approver: formData.level3Approver || undefined,
        level4Approver: formData.level4Approver || undefined,
        level5Approver: formData.level5Approver || undefined,
      };

      // Only include password if it's being changed
      if (formData.password) {
        payload.password = formData.password;
      }

      await api.put(`/api/employees/${employee._id}`, payload);

      // Reset form
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "employee",
        bonus2024: "",
        supervisor: "",
        level1Approver: "",
        level2Approver: "",
        level3Approver: "",
        level4Approver: "",
        level5Approver: "",
        isActive: true,
      });
      setShowPassword(false);

      onEmployeeUpdated();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "An error occurred while updating employee",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "employee",
        bonus2024: "",
        supervisor: "",
        level1Approver: "",
        level2Approver: "",
        level3Approver: "",
        level4Approver: "",
        level5Approver: "",
        isActive: true,
      });
      setShowPassword(false);
      setError("");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slots={{
        transition: Transition,
      }}
      keepMounted
    >
      <DialogTitle>Edit Employee</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="employeeId"
                label="Employee ID"
                value={formData.employeeId}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="role"
                label="Role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="hr">HR</MenuItem>
                <MenuItem value="approver">Approver</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="password"
                label="Password (leave blank to keep current)"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                helperText="Only fill this if you want to change the password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="isActive"
                label="Status"
                value={formData.isActive.toString()}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="bonus2024"
                label="2024 Bonus"
                type="number"
                value={formData.bonus2024}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) =>
                  option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : ""
                }
                value={
                  employees.find((emp) => emp._id === formData.supervisor) ||
                  null
                }
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    supervisor: newValue?._id || "",
                  });
                }}
                disabled={loading}
                sx={{ width: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supervisor"
                    placeholder="Search supervisor..."
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
                ListboxProps={{
                  style: { maxHeight: 200 },
                }}
              />
            </Grid>

            {/* Approver Hierarchy */}
            <Grid item xs={12}>
              <Autocomplete
                options={approvers}
                getOptionLabel={(option) =>
                  option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : ""
                }
                value={
                  approvers.find(
                    (app) => app._id === formData.level1Approver,
                  ) || null
                }
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level1Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                sx={{ width: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 1 Approver"
                    placeholder="Search level 1 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
                ListboxProps={{
                  style: { maxHeight: 200 },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={approvers}
                getOptionLabel={(option) =>
                  option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : ""
                }
                value={
                  approvers.find(
                    (app) => app._id === formData.level2Approver,
                  ) || null
                }
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level2Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                sx={{ width: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 2 Approver"
                    placeholder="Search level 2 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
                ListboxProps={{
                  style: { maxHeight: 200 },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={approvers}
                getOptionLabel={(option) =>
                  option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : ""
                }
                value={
                  approvers.find(
                    (app) => app._id === formData.level3Approver,
                  ) || null
                }
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level3Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                sx={{ width: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 3 Approver"
                    placeholder="Search level 3 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
                ListboxProps={{
                  style: { maxHeight: 200 },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={approvers}
                getOptionLabel={(option) =>
                  option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : ""
                }
                value={
                  approvers.find(
                    (app) => app._id === formData.level4Approver,
                  ) || null
                }
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level4Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                sx={{ width: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 4 Approver"
                    placeholder="Search level 4 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
                ListboxProps={{
                  style: { maxHeight: 200 },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={approvers}
                getOptionLabel={(option) =>
                  option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : ""
                }
                value={
                  approvers.find(
                    (app) => app._id === formData.level5Approver,
                  ) || null
                }
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level5Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                sx={{ width: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 5 Approver"
                    placeholder="Search level 5 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
                ListboxProps={{
                  style: { maxHeight: 200 },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? "Updating..." : "Update Employee"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEmployeeModal;
