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
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import api from "../../utils/api";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddEmployeeModal = ({ open, onClose, onEmployeeAdded }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    branch: "",
    department: "",
    phone: "",
    role: "employee",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [branches, setBranches] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open]);

  const fetchBranches = async () => {
    try {
      const response = await api.get("/api/branches?isActive=true");
      setBranches(response.data.data);
    } catch (err) {
      // Error fetching branches
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
      !formData.email ||
      !formData.password
    ) {
      setError("Employee ID, Name, Email, and Password are required");
      return;
    }

    if (formData.password.length < 6) {
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
        password: formData.password,
        branch: formData.branch || undefined,
        department: formData.department || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
      };

      await api.post("/api/employees", payload);

      // Reset form
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        branch: "",
        department: "",
        phone: "",
        role: "employee",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      });
      setShowPassword(false);

      onEmployeeAdded();
    } catch (err) {
      setError(err.message || "An error occurred while creating employee");
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
        branch: "",
        department: "",
        phone: "",
        role: "employee",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
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
      <DialogTitle>Add New Employee</DialogTitle>
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
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
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
                name="branch"
                label="Branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="">None</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch._id} value={branch._id}>
                    {branch.branchCode} - {branch.branchName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="department"
                label="Department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="phone"
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="street"
                label="Street Address"
                value={formData.street}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="city"
                label="City"
                value={formData.city}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="state"
                label="State"
                value={formData.state}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="zipCode"
                label="Zip Code"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="country"
                label="Country"
                value={formData.country}
                onChange={handleChange}
                disabled={loading}
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
          {loading ? "Adding..." : "Add Employee"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEmployeeModal;
