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
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";
import api from "../../utils/api";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UploadEmployeesModal = ({ open, onClose, onEmployeesUploaded }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState(""); // "error", "warning", "success"
  const [resultMessage, setResultMessage] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const processFile = (selectedFile) => {
    setError("");

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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (loading) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
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

    // Validation
    if (!file) {
      setError("Please select an Excel file to upload");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Smooth progress from 0 to 20 while starting
      let currentProgress = 0;
      const initialInterval = setInterval(() => {
        currentProgress += Math.random() * 3 + 1;
        if (currentProgress < 20) {
          setUploadProgress(Math.floor(currentProgress));
        }
      }, 80);

      // Parse Excel file
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for visual effect
      clearInterval(initialInterval);
      setUploadProgress(25);

      const employeesData = await parseExcelFile(file);
      setUploadProgress(40);

      if (!employeesData || employeesData.length === 0) {
        throw new Error("No employee data found in the Excel file");
      }

      // Helper function to parse employee name
      const parseEmployeeName = (fullName) => {
        if (!fullName) return "";
        return fullName.trim();
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
        // Try to get full name from various columns
        let fullName = "";

        // First, try the "Employee Name" column
        const employeeName =
          getColumnValue(
            row,
            "Employee Name",
            " Employee Name ",
            "employeeName",
            "EmployeeName",
          ) || "";

        if (employeeName) {
          fullName = parseEmployeeName(employeeName);
        } else {
          // If "Employee Name" doesn't exist, try to combine First Name and Last Name
          const firstName = getColumnValue(
            row,
            "First Name",
            " First Name ",
            "firstName",
            "FirstName",
          ) || "";
          const lastName = getColumnValue(
            row,
            "Last Name",
            " Last Name ",
            "lastName",
            "LastName",
          ) || "";

          if (firstName || lastName) {
            fullName = `${firstName} ${lastName}`.trim();
          }
        }

        const employeeNumber =
          getColumnValue(
            row,
            "Employee Number",
            " Employee Number ",
            "employeeNumber",
            "EmployeeNumber",
          ) || "";
        const workEmail =
          getColumnValue(
            row,
            "Work Email",
            " Work Email ",
            "workEmail",
            "WorkEmail",
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
            "hourly rate",
          ) || 0;

        const parsedHourlyRate = parseNumber(rawHourlyRate);

        const employeeData = {
          employeeId: employeeNumber,
          fullName: fullName,
          // Password will be set by backend (default: abc123xyz)
          ssn: getColumnValue(row, "SSN", " SSN ", "ssn") || "",
          company: getColumnValue(row, "Company", " Company ", "company") || "",
          companyCode:
            getColumnValue(
              row,
              "Company Code",
              " Company Code ",
              "companyCode",
              "CompanyCode",
            ) || "",
          supervisorName:
            getColumnValue(
              row,
              "Supervisor Name",
              " Supervisor Name ",
              "supervisorName",
              "SupervisorName",
            ) || "",
          location:
            getColumnValue(row, "Location", " Location ", "location") || "",
          jobTitle:
            getColumnValue(
              row,
              "Job Title",
              " Job Title ",
              "jobTitle",
              "JobTitle",
            ) || "",
          employeeType:
            getColumnValue(
              row,
              "Employee Type",
              " Employee Type ",
              "employeeType",
              "EmployeeType",
            ) || "",
          salaryType:
            getColumnValue(
              row,
              "Salary or Hourly",
              " Salary or Hourly ",
              "salaryType",
              "SalaryType",
            ) || null,
          annualSalary: parseNumber(
            getColumnValue(
              row,
              "Annual Salary",
              " Annual Salary ",
              "annualSalary",
              "AnnualSalary",
            ) || 0,
          ),
          hourlyPayRate: parsedHourlyRate,
          bonus2024: parseNumber(
            getColumnValue(row, "2024 Bonus", " 2024 Bonus ", "bonus2024") || 0,
          ),
          bonus2025: parseNumber(
            getColumnValue(row, "2025 Bonus", " 2025 Bonus ", "bonus2025") || 0,
          ),
          lastHireDate: parseDate(
            getColumnValue(
              row,
              "Last Hire Date",
              " Last Hire Date ",
              "lastHireDate",
              "LastHireDate",
            ),
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
                "State",
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
              "1stReporting",
            ) || "",
          reporting2nd:
            getColumnValue(
              row,
              "2nd Reporting",
              " 2nd Reporting ",
              "reporting2nd",
              "2ndReporting",
            ) || "",
          reporting3rd:
            getColumnValue(
              row,
              "3rd Reporting",
              " 3rd Reporting ",
              "reporting3rd",
              "3rdReporting",
            ) || "",
          reporting4th:
            getColumnValue(
              row,
              "4th Reporting",
              " 4th Reporting ",
              "reporting4th",
              "4thReporting",
            ) || "",
          reporting5th:
            getColumnValue(
              row,
              "5th Reporting",
              " 5th Reporting ",
              "reporting5th",
              "5thReporting",
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
            name: emp.fullName,
          });
        }
      });

      setUploadProgress(60);

      // Send data to API
      const response = await api.post("/api/employees/bulk", {
        employees: uniqueEmployees,
      });

      setUploadProgress(95);

      const { data } = response;

      // Handle partial success (207 Multi-Status) or 200/201
      // Axios doesn't throw on 207, so we check data/status
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
            .slice(0, 10)
            .map(
              (dup) =>
                `  • ${dup.employeeName || "Unknown"} (${dup.employeeId}) - ${
                  dup.reason
                }`,
            )
            .join("\n");
          const moreMsg =
            allDuplicates.length > 10
              ? `\n  ...and ${allDuplicates.length - 10} more`
              : "";
          duplicateInfo = `\n\nSkipped entries:\n${duplicateDetails}${moreMsg}`;
        }

        const excelDuplicatesInfo =
          skippedDuplicates.length > 0
            ? `\n\nNote: Also removed ${skippedDuplicates.length} duplicate entries from Excel file before upload`
            : "";

        // Show result in separate modal
        setResultType("warning");
        setResultMessage(
          `${data.message}${duplicateInfo}${excelDuplicatesInfo}`,
        );
        setShowResultModal(true);
        setLoading(false);
        setUploadProgress(0);
        setFile(null);
        return;
      }

      setUploadProgress(100);
      const reportingInfo = data.reportingMapped
        ? ` (${data.reportingMapped} reporting relationships mapped)`
        : "";
      const excelDuplicatesInfo =
        skippedDuplicates.length > 0
          ? `\n\nNote: Skipped ${skippedDuplicates.length} duplicate entries from Excel file`
          : "";

      // Show success in separate modal
      setResultType("success");
      setResultMessage(
        `Successfully uploaded ${
          data.count || uniqueEmployees.length
        } employees${reportingInfo}!${excelDuplicatesInfo}`,
      );
      setShowResultModal(true);
      setLoading(false);
      setUploadProgress(0);
      setFile(null);

      // Auto-close success modal and refresh after delay
      setTimeout(() => {
        setShowResultModal(false);
        onEmployeesUploaded();
        onClose();
      }, 2000);
    } catch (err) {
      // Show error in separate modal
      setResultType("error");
      setResultMessage(err.message || "An error occurred while uploading employees");
      setShowResultModal(true);
      setUploadProgress(0);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/api/employees/template/download", {
        responseType: "blob",
      });

      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = "employee_template.xlsx";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download template. Please try again.");
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setError("");
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <>
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
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Upload Employees from Excel</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            disabled={loading}
          >
            Download Template
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, whiteSpace: "pre-wrap" }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              border: "2px dashed",
              borderColor: isDragging ? "primary.dark" : "primary.main",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              backgroundColor: isDragging ? "action.selected" : "action.hover",
              mb: 2,
              transition: "all 0.2s ease",
              cursor: loading ? "not-allowed" : "pointer",
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
            <CloudUploadIcon
              sx={{
                fontSize: 48,
                color: isDragging ? "primary.dark" : "primary.main",
                mb: 1
              }}
            />
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              {isDragging ? "Drop your Excel file here" : "Drag & Drop Excel File"}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
              or
            </Typography>
            <label htmlFor="excel-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                Browse Files
              </Button>
            </label>
            {file && (
              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  color: "success.main",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1
                }}
              >
                ✓ Selected: {file.name}
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
                Uploading... {Math.floor(uploadProgress)}%
              </Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              📋 Excel Format Requirements:
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 1 }}>
              <strong>Required Columns:</strong>
            </Typography>
            <Typography variant="caption" component="div" sx={{ ml: 2, mb: 1 }}>
              • Employee Number<br />
              • Employee Name
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
              <strong>Optional Columns:</strong>
            </Typography>
            <Typography variant="caption" component="div" sx={{ ml: 2 }}>
              • Work Email, SSN, Role<br />
              • Company, Company Code, Location<br />
              • Supervisor Name<br />
              • 1st Reporting, 2nd Reporting, 3rd Reporting, 4th Reporting, 5th Reporting<br />
              • State/Province<br />
              • Last Hire Date<br />
              • Employee Type, Job Title<br />
              • Salary or Hourly, Annual Salary, Hourly Pay Rate<br />
              • 2024 Bonus, 2025 Bonus
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 1, fontStyle: "italic", color: "text.secondary" }}>
              💡 Tip: Download the template above for the correct format
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
          disabled={loading || !file}
        >
          {loading ? "Uploading..." : "Upload Employees"}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Result Modal */}
    <Dialog
      open={showResultModal}
      onClose={() => {
        setShowResultModal(false);
        if (resultType === "warning" || resultType === "error") {
          onEmployeesUploaded();
        }
      }}
      maxWidth="md"
      fullWidth
      slots={{
        transition: Transition,
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {resultType === "success" && (
            <>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "success.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                ✓
              </Box>
              <Typography variant="h6">Upload Successful</Typography>
            </>
          )}
          {resultType === "warning" && (
            <>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "warning.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                ⚠
              </Box>
              <Typography variant="h6">Partial Upload</Typography>
            </>
          )}
          {resultType === "error" && (
            <>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "error.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                ✕
              </Box>
              <Typography variant="h6">Upload Failed</Typography>
            </>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert
          severity={resultType}
          sx={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}
        >
          {resultMessage}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setShowResultModal(false);
            if (resultType === "warning" || resultType === "error") {
              onEmployeesUploaded();
            }
          }}
          variant="contained"
          color={resultType === "success" ? "success" : resultType === "warning" ? "warning" : "error"}
          sx={{
            '&:hover': {
              bgcolor: resultType === "success"
                ? "success.main"
                : resultType === "warning"
                ? "warning.main"
                : "error.main",
              opacity: 0.95
            }
          }}
        >
          {resultType === "success" ? "Great!" : "OK"}
        </Button>
      </DialogActions>
    </Dialog>
  </>
  );
};

export default UploadEmployeesModal;
