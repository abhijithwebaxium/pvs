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
} from "@mui/material";
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
    role: "employee",
    ssn: "",
    company: "",
    companyCode: "",
    location: "",
    jobTitle: "",
    employeeType: "",
    salaryType: "",
    annualSalary: "",
    hourlyPayRate: "",
    bonus2024: "",
    bonus2025: "",
    lastHireDate: "",
    state: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when employee prop changes
  useEffect(() => {
    if (employee && open) {
      setFormData({
        employeeId: employee.employeeId || "",
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        role: employee.role || "employee",
        ssn: employee.ssn || "",
        company: employee.company || "",
        companyCode: employee.companyCode || "",
        location: employee.location || "",
        jobTitle: employee.jobTitle || "",
        employeeType: employee.employeeType || "",
        salaryType: employee.salaryType || "",
        annualSalary: employee.annualSalary || "",
        hourlyPayRate: employee.hourlyPayRate || "",
        bonus2024: employee.bonus2024 || "",
        bonus2025: employee.bonus2025 || "",
        lastHireDate: employee.lastHireDate || "",
        state: employee.address?.state || "",
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

    setLoading(true);

    try {
      const payload = {
        employeeId: formData.employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        ssn: formData.ssn || undefined,
        company: formData.company || undefined,
        companyCode: formData.companyCode || undefined,
        location: formData.location || undefined,
        jobTitle: formData.jobTitle || undefined,
        employeeType: formData.employeeType || undefined,
        salaryType: formData.salaryType || undefined,
        annualSalary: formData.annualSalary ? parseFloat(formData.annualSalary) : undefined,
        hourlyPayRate: formData.hourlyPayRate ? parseFloat(formData.hourlyPayRate) : undefined,
        bonus2024: formData.bonus2024 ? parseFloat(formData.bonus2024) : undefined,
        bonus2025: formData.bonus2025 ? parseFloat(formData.bonus2025) : undefined,
        lastHireDate: formData.lastHireDate || undefined,
        isActive: formData.isActive,
        address: {
          state: formData.state || "",
        },
      };

      await api.put(`/api/employees/${employee._id}`, payload);

      // Reset form
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        role: "employee",
        ssn: "",
        company: "",
        companyCode: "",
        location: "",
        jobTitle: "",
        employeeType: "",
        salaryType: "",
        annualSalary: "",
        hourlyPayRate: "",
        bonus2024: "",
        bonus2025: "",
        lastHireDate: "",
        state: "",
        isActive: true,
      });

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
        role: "employee",
        ssn: "",
        company: "",
        companyCode: "",
        location: "",
        jobTitle: "",
        employeeType: "",
        salaryType: "",
        annualSalary: "",
        hourlyPayRate: "",
        bonus2024: "",
        bonus2025: "",
        lastHireDate: "",
        state: "",
        isActive: true,
      });
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="ssn"
                label="SSN"
                value={formData.ssn}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="company"
                label="Company"
                value={formData.company}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="companyCode"
                label="Company Code"
                value={formData.companyCode}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="location"
                label="Location"
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="jobTitle"
                label="Job Title"
                value={formData.jobTitle}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="employeeType"
                label="Employee Type"
                value={formData.employeeType}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="salaryType"
                label="Salary Type"
                value={formData.salaryType}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="">Select Type</MenuItem>
                <MenuItem value="Salary">Salary</MenuItem>
                <MenuItem value="Hourly">Hourly</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="annualSalary"
                label="Annual Salary"
                type="number"
                value={formData.annualSalary}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="hourlyPayRate"
                label="Hourly Pay Rate"
                type="number"
                value={formData.hourlyPayRate}
                onChange={handleChange}
                disabled={loading}
              />
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="bonus2025"
                label="2025 Bonus"
                type="number"
                value={formData.bonus2025}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="lastHireDate"
                label="Last Hire Date"
                type="date"
                value={formData.lastHireDate}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="state"
                label="State/Province"
                value={formData.state}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
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
