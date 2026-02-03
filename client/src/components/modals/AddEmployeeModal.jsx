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

const AddEmployeeModal = ({ open, onClose, onEmployeeAdded }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    password: "",
    role: "employee",
    ssn: "",
    company: "",
    companyCode: "",
    supervisorName: "",
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
    level1Approver: "",
    level2Approver: "",
    level3Approver: "",
    level4Approver: "",
    level5Approver: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);

  // Fetch all employees for dropdowns
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get("/api/employees");
        setEmployees(response.data.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [open]);

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
      !formData.fullName ||
      !formData.email ||
      !formData.password
    ) {
      setError("Employee ID, Full Name, Email, and Password are required");
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
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ssn: formData.ssn || undefined,
        company: formData.company || undefined,
        companyCode: formData.companyCode || undefined,
        supervisorName: formData.supervisorName || undefined,
        location: formData.location || undefined,
        jobTitle: formData.jobTitle || undefined,
        employeeType: formData.employeeType || undefined,
        salaryType: formData.salaryType || undefined,
        annualSalary: formData.annualSalary ? parseFloat(formData.annualSalary) : undefined,
        hourlyPayRate: formData.hourlyPayRate ? parseFloat(formData.hourlyPayRate) : undefined,
        bonus2024: formData.bonus2024 ? parseFloat(formData.bonus2024) : undefined,
        bonus2025: formData.bonus2025 ? parseFloat(formData.bonus2025) : undefined,
        lastHireDate: formData.lastHireDate || undefined,
        level1Approver: formData.level1Approver || undefined,
        level2Approver: formData.level2Approver || undefined,
        level3Approver: formData.level3Approver || undefined,
        level4Approver: formData.level4Approver || undefined,
        level5Approver: formData.level5Approver || undefined,
        address: {
          state: formData.state || "",
          street: "",
          city: "",
          zipCode: "",
          country: "",
        },
      };

      await api.post("/api/employees", payload);

      // Reset form
      setFormData({
        employeeId: "",
        fullName: "",
        email: "",
        password: "",
        role: "employee",
        ssn: "",
        company: "",
        companyCode: "",
        supervisorName: "",
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
        level1Approver: "",
        level2Approver: "",
        level3Approver: "",
        level4Approver: "",
        level5Approver: "",
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
        fullName: "",
        email: "",
        password: "",
        role: "employee",
        ssn: "",
        company: "",
        companyCode: "",
        supervisorName: "",
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
        level1Approver: "",
        level2Approver: "",
        level3Approver: "",
        level4Approver: "",
        level5Approver: "",
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
            <Grid item xs={12} sm={6} width={'250px'}>
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
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="fullName"
                label="Full Name"
                value={formData.fullName}
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
            <Grid item xs={12} sm={6} width={'250px'}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.fullName || ""}
                value={employees.find(emp => emp._id === formData.supervisorName) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    supervisorName: newValue?._id || "",
                  });
                }}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supervisor Name"
                    placeholder="Search supervisor..."
                  />
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                ListboxProps={{
                  style: { maxHeight: 200 }
                }}
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
            <Grid item xs={12} sm={6} width={'250px'}>
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
            <Grid item xs={12} sm={6} width={'250px'}>
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
            <Grid item xs={12} sm={6} sx={{width:'250px'}}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.fullName || ""}
                value={employees.find(app => app._id === formData.level1Approver) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level1Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 1 Approver"
                    placeholder="Search level 1 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                ListboxProps={{
                  style: { maxHeight: 200 }
                }}
              />
            </Grid>
            <Grid item xs={12} width={'250px'}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.fullName || ""}
                value={employees.find(app => app._id === formData.level2Approver) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level2Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 2 Approver"
                    placeholder="Search level 2 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                ListboxProps={{
                  style: { maxHeight: 200 }
                }}
              />
            </Grid>
            <Grid item xs={12} width={'250px'}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.fullName || ""}
                value={employees.find(app => app._id === formData.level3Approver) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level3Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 3 Approver"
                    placeholder="Search level 3 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                ListboxProps={{
                  style: { maxHeight: 200 }
                }}
              />
            </Grid>
            <Grid item xs={12} width={'250px'}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.fullName || ""}
                value={employees.find(app => app._id === formData.level4Approver) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level4Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 4 Approver"
                    placeholder="Search level 4 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                ListboxProps={{
                  style: { maxHeight: 200 }
                }}
              />
            </Grid>
            <Grid item xs={12} width={'250px'}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.fullName || ""}
                value={employees.find(app => app._id === formData.level5Approver) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    level5Approver: newValue?._id || "",
                  });
                }}
                disabled={loading}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Level 5 Approver"
                    placeholder="Search level 5 approver..."
                  />
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                ListboxProps={{
                  style: { maxHeight: 200 }
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
          {loading ? "Adding..." : "Add Employee"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEmployeeModal;
