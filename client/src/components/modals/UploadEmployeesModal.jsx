import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  Slide,
  MenuItem,
  TextField,
  Typography,
  LinearProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import * as XLSX from "xlsx";
import API_URL from "../../config/api";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UploadEmployeesModal = ({ open, onClose, onEmployeesUploaded }) => {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open]);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_URL}/api/branches?isActive=true`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setBranches(data.data);
      }
    } catch (err) {
      // Error fetching branches
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError("");
    setSuccessMessage("");

    if (selectedFile) {
      // Validate file type
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls"].includes(fileExtension)) {
        setError("Please upload a valid Excel file (.xlsx or .xls)");
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          // Trim all column names to remove leading/trailing spaces
          const cleanedData = jsonData.map((row) => {
            const cleanedRow = {};
            Object.keys(row).forEach((key) => {
              const trimmedKey = key.trim();
              cleanedRow[trimmedKey] = row[key];
            });
            return cleanedRow;
          });

          resolve(cleanedData);
        } catch (error) {
          reject(new Error("Failed to parse Excel file"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validation
    if (!selectedBranch) {
      setError("Please select a branch");
      return;
    }

    if (!file) {
      setError("Please select an Excel file to upload");
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      // Parse Excel file
      const employeesData = await parseExcelFile(file);

      setUploadProgress(30);

      if (!employeesData || employeesData.length === 0) {
        throw new Error("No employee data found in the Excel file");
      }

      // Helper function to parse employee name
      const parseEmployeeName = (fullName) => {
        if (!fullName) return { firstName: "", lastName: "" };

        const trimmedName = fullName.trim();

        // Check if name contains comma (format: "LastName, FirstName MiddleInitial")
        if (trimmedName.includes(",")) {
          const parts = trimmedName.split(",").map((s) => s.trim());
          const lastName = parts[0]; // Everything before comma
          const firstName = parts.slice(1).join(" "); // Everything after comma
          return { firstName, lastName };
        }

        // Otherwise assume format: "FirstName MiddleInitial LastName"
        const nameParts = trimmedName.split(/\s+/);
        if (nameParts.length === 1) {
          return { firstName: nameParts[0], lastName: "" };
        }
        const lastName = nameParts[nameParts.length - 1];
        const firstName = nameParts.slice(0, -1).join(" ");
        return { firstName, lastName };
      };

      // Helper function to parse date (Excel stores dates as serial numbers)
      const parseDate = (dateValue) => {
        if (!dateValue) return null;

        // Check if it's an Excel serial date (number)
        if (typeof dateValue === "number") {
          // Excel date serial number (days since 1900-01-01, with 1900-01-01 = 1)
          const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
          const msPerDay = 24 * 60 * 60 * 1000;
          const date = new Date(excelEpoch.getTime() + dateValue * msPerDay);
          return date;
        }

        // Try parsing as regular date string
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      };

      // Helper function to parse number
      const parseNumber = (value) => {
        if (!value && value !== 0) return 0;
        // If it's already a number, return it
        if (typeof value === "number") return value;
        // Remove currency symbols, commas, but keep decimal point and negative sign
        const cleanedValue = value.toString().replace(/[$,\s]/g, "");
        const num = parseFloat(cleanedValue);
        return isNaN(num) ? 0 : num;
      };

      // Helper function to safely get column value (handles spaces in column names)
      const getColumnValue = (row, ...columnNames) => {
        for (const colName of columnNames) {
          if (
            row[colName] !== undefined &&
            row[colName] !== null &&
            row[colName] !== ""
          ) {
            return row[colName];
          }
        }
        return null;
      };

      // Transform data to match API format
      const formattedEmployees = employeesData.map((row, index) => {
        const employeeName =
          getColumnValue(
            row,
            "Employee Name",
            " Employee Name ",
            "employeeName",
            "EmployeeName"
          ) || "";
        const { firstName, lastName } = parseEmployeeName(employeeName);

        const employeeNumber =
          getColumnValue(
            row,
            "Employee Number",
            " Employee Number ",
            "employeeNumber",
            "EmployeeNumber"
          ) || "";
        const workEmail =
          getColumnValue(
            row,
            "Work Email",
            " Work Email ",
            "workEmail",
            "WorkEmail"
          ) || "";

        // Try multiple variations of the hourly pay rate column name
        const rawHourlyRate =
          getColumnValue(
            row,
            "Hourly Pay Rate",
            " Hourly Pay Rate ", // With spaces
            "hourly pay rate",
            "Hourly pay rate",
            "hourlyPayRate",
            "HourlyPayRate",
            "Hourly Rate",
            "hourly rate"
          ) || 0;

        const parsedHourlyRate = parseNumber(rawHourlyRate);

        const employeeData = {
          employeeId: employeeNumber,
          firstName: firstName,
          lastName: lastName,
          password: "password123", // Default password
          ssn: getColumnValue(row, "SSN", " SSN ", "ssn") || "",
          company: getColumnValue(row, "Company", " Company ", "company") || "",
          companyCode:
            getColumnValue(
              row,
              "Company Code",
              " Company Code ",
              "companyCode",
              "CompanyCode"
            ) || "",
          supervisorName:
            getColumnValue(
              row,
              "Supervisor Name",
              " Supervisor Name ",
              "supervisorName",
              "SupervisorName"
            ) || "",
          location:
            getColumnValue(row, "Location", " Location ", "location") || "",
          branch: selectedBranch,
          jobTitle:
            getColumnValue(
              row,
              "Job Title",
              " Job Title ",
              "jobTitle",
              "JobTitle"
            ) || "",
          employeeType:
            getColumnValue(
              row,
              "Employee Type",
              " Employee Type ",
              "employeeType",
              "EmployeeType"
            ) || "",
          salaryType:
            getColumnValue(
              row,
              "Salary or Hourly",
              " Salary or Hourly ",
              "salaryType",
              "SalaryType"
            ) || null,
          annualSalary: parseNumber(
            getColumnValue(
              row,
              "Annual Salary",
              " Annual Salary ",
              "annualSalary",
              "AnnualSalary"
            ) || 0
          ),
          hourlyPayRate: parsedHourlyRate,
          bonus2024: parseNumber(
            getColumnValue(row, "2024 Bonus", " 2024 Bonus ", "bonus2024") || 0
          ),
          bonus2025: parseNumber(
            getColumnValue(row, "2025 Bonus", " 2025 Bonus ", "bonus2025") || 0
          ),
          lastHireDate: parseDate(
            getColumnValue(
              row,
              "Last Hire Date",
              " Last Hire Date ",
              "lastHireDate",
              "LastHireDate"
            )
          ),

          // Parse Role
          role: (() => {
            const rawRole =
              getColumnValue(row, "Role", " Role ", "role", "Role") || "";
            const normalizedRole = rawRole.toLowerCase().trim();
            if (
              ["employee", "hr", "approver", "admin"].includes(normalizedRole)
            ) {
              return normalizedRole;
            }
            return "employee";
          })(),

          // Set isApprover flag based on role
          isApprover: (() => {
            const rawRole =
              getColumnValue(row, "Role", " Role ", "role", "Role") || "";
            const normalizedRole = rawRole.toLowerCase().trim();
            return normalizedRole === "approver";
          })(),

          address: {
            state:
              getColumnValue(
                row,
                "State/Province",
                " State/Province ",
                "state",
                "State"
              ) || "",
            street: "",
            city: "",
            zipCode: "",
            country: "",
          },
          // Store reporting hierarchy as temporary fields
          reporting1st:
            getColumnValue(
              row,
              "1st Reporting",
              " 1st Reporting ",
              "reporting1st",
              "1stReporting"
            ) || "",
          reporting2nd:
            getColumnValue(
              row,
              "2nd Reporting",
              " 2nd Reporting ",
              "reporting2nd",
              "2ndReporting"
            ) || "",
          reporting3rd:
            getColumnValue(
              row,
              "3rd Reporting",
              " 3rd Reporting ",
              "reporting3rd",
              "3rdReporting"
            ) || "",
          reporting4th:
            getColumnValue(
              row,
              "4th Reporting",
              " 4th Reporting ",
              "reporting4th",
              "4thReporting"
            ) || "",
          reporting5th:
            getColumnValue(
              row,
              "5th Reporting",
              " 5th Reporting ",
              "reporting5th",
              "5thReporting"
            ) || "",
        };

        // Only add email if it exists and is not empty
        if (workEmail && workEmail.trim() !== "") {
          employeeData.email = workEmail.trim();
        }

        return employeeData;
      });

      // Remove duplicates within the Excel file itself (keep only the first occurrence)
      const seenEmployeeIds = new Set();
      const uniqueEmployees = [];
      const skippedDuplicates = [];

      formattedEmployees.forEach((emp, index) => {
        if (!seenEmployeeIds.has(emp.employeeId)) {
          seenEmployeeIds.add(emp.employeeId);
          uniqueEmployees.push(emp);
        } else {
          skippedDuplicates.push({
            rowNumber: index + 2, // +2 because Excel rows start at 1 and we have header
            employeeId: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`.trim(),
          });
        }
      });

      setUploadProgress(50);

      // Send data to API
      const response = await fetch(`${API_URL}/api/employees/bulk`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employees: uniqueEmployees }),
      });

      setUploadProgress(80);

      const data = await response.json();

      // Handle partial success (207 Multi-Status)
      if (response.status === 207) {
        setUploadProgress(100);

        // Combine duplicates and skippedDuplicates
        const allDuplicates = [
          ...(data.duplicates || []),
          ...(data.skippedDuplicates || []),
        ];

        // Build detailed duplicate info
        let duplicateInfo = "";
        if (allDuplicates.length > 0) {
          const duplicateDetails = allDuplicates
            .slice(0, 5)
            .map(
              (dup) =>
                `  • ${dup.employeeName || "Unknown"} (${dup.employeeId}) - ${
                  dup.reason
                }`
            )
            .join("\n");
          const moreMsg =
            allDuplicates.length > 5
              ? `\n  ...and ${allDuplicates.length - 5} more`
              : "";
          duplicateInfo = `\n\nSkipped entries:\n${duplicateDetails}${moreMsg}`;
        }

        const excelDuplicatesInfo =
          skippedDuplicates.length > 0
            ? `\n\nNote: Also removed ${skippedDuplicates.length} duplicate entries from Excel file before upload`
            : "";

        setSuccessMessage(
          `${data.message}${duplicateInfo}${excelDuplicatesInfo}`
        );

        // Reset form after a short delay
        setTimeout(() => {
          setSelectedBranch("");
          setFile(null);
          setUploadProgress(0);
          onEmployeesUploaded();
        }, 2500);
        return;
      }

      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const errorDetails = data.errors
            .slice(0, 5)
            .map(
              (err) =>
                `Row ${err.index}: ${err.employeeName} (${err.employeeId}) - ${err.reason}`
            )
            .join("\n");
          const moreErrors =
            data.errors.length > 5
              ? `\n...and ${data.errors.length - 5} more`
              : "";
          throw new Error(`${data.message}\n\n${errorDetails}${moreErrors}`);
        }
        throw new Error(data.message || "Failed to upload employees");
      }

      setUploadProgress(100);
      const reportingInfo = data.reportingMapped
        ? ` (${data.reportingMapped} reporting relationships mapped)`
        : "";
      const excelDuplicatesInfo =
        skippedDuplicates.length > 0
          ? `\n\nNote: Skipped ${skippedDuplicates.length} duplicate entries from Excel file`
          : "";
      setSuccessMessage(
        `Successfully uploaded ${
          data.count || uniqueEmployees.length
        } employees${reportingInfo}!${excelDuplicatesInfo}`
      );

      // Reset form after a short delay
      setTimeout(() => {
        setSelectedBranch("");
        setFile(null);
        setUploadProgress(0);
        onEmployeesUploaded();
      }, 1500);
    } catch (err) {
      setError(err.message || "An error occurred while uploading employees");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedBranch("");
      setFile(null);
      setError("");
      setSuccessMessage("");
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slots={{
        transition: Transition,
      }}
      keepMounted
    >
      <DialogTitle>Upload Employees from Excel</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            required
            select
            name="branch"
            label="Select Branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            <MenuItem value="">Select a branch</MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch._id} value={branch._id}>
                {branch.branchCode} - {branch.branchName}
              </MenuItem>
            ))}
          </TextField>

          <Box
            sx={{
              border: "2px dashed",
              borderColor: "primary.main",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              backgroundColor: "action.hover",
              mb: 2,
            }}
          >
            <input
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              id="excel-file-upload"
              type="file"
              onChange={handleFileChange}
              disabled={loading}
            />
            <label htmlFor="excel-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                Choose Excel File
              </Button>
            </label>
            {file && (
              <Typography
                variant="body2"
                sx={{ mt: 2, color: "text.secondary" }}
              >
                Selected: {file.name}
              </Typography>
            )}
          </Box>

          {loading && (
            <Box sx={{ width: "100%", mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography
                variant="caption"
                sx={{ mt: 1, display: "block", textAlign: "center" }}
              >
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              Excel Format Requirements:
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
              <strong>Required columns:</strong> Employee Number, Employee Name
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
              <strong>Optional columns:</strong> SSN, Company, Company Code,
              Supervisor Name, Location, 1st Reporting, 2nd Reporting, 3rd
              Reporting, 4th Reporting, 5th Reporting, State/Province, Work
              Email, Last Hire Date, Employee Type, Job Title, Salary or Hourly,
              Annual Salary, Hourly Pay Rate, 2024 Bonus, 2025 Bonus
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !file || !selectedBranch}
        >
          {loading ? "Uploading..." : "Upload Employees"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadEmployeesModal;
