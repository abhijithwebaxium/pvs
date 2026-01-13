import Employee from '../models/Employee.js';
import AppError from '../utils/appError.js';
import bcrypt from 'bcryptjs';

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
export const getEmployees = async (req, res, next) => {
  try {
    const { isActive, branch, role } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (branch) {
      filter.branch = branch;
    }
    if (role) {
      filter.role = role;
    }

    const employees = await Employee.find(filter)
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .sort({ employeeId: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
export const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('supervisor', 'firstName lastName employeeId')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('level2Approver', 'firstName lastName employeeId')
      .populate('level3Approver', 'firstName lastName employeeId')
      .populate('level4Approver', 'firstName lastName employeeId')
      .populate('level5Approver', 'firstName lastName employeeId');

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin/HR only)
export const createEmployee = async (req, res, next) => {
  try {
    // Hash password before saving
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    const employee = await Employee.create(req.body);

    // Remove password from response
    const employeeData = employee.toObject();
    delete employeeData.password;

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employeeData,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return next(new AppError(`${field} already exists`, 400));
    }
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin/HR only)
export const updateEmployee = async (req, res, next) => {
  try {
    // Don't allow password update through this route
    if (req.body.password) {
      delete req.body.password;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .select('-password')
      .populate('branch', 'branchCode branchName location');

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle employee active status
// @route   PATCH /api/employees/:id/toggle-status
// @access  Private (Admin/HR only)
export const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    const employeeData = employee.toObject();
    delete employeeData.password;

    res.status(200).json({
      success: true,
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
      data: employeeData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employees by branch
// @route   GET /api/employees/branch/:branchId
// @access  Private
export const getEmployeesByBranch = async (req, res, next) => {
  try {
    const employees = await Employee.find({ branch: req.params.branchId })
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .sort({ employeeId: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync approver names to IDs for all employees
// @route   POST /api/employees/sync-approvers
// @access  Private (Admin/HR only)
export const syncApproverIds = async (req, res, next) => {
  try {
    // Get all employees at once
    const allEmployees = await Employee.find({}).lean();

    // Create lookup maps for fast searching
    const employeeIdMap = new Map();
    const nameMap = new Map();

    // Build lookup maps
    for (const emp of allEmployees) {
      // Map by employeeId
      employeeIdMap.set(emp.employeeId, emp);

      // Map by "LastName, FirstName" format
      const fullName = `${emp.lastName}, ${emp.firstName}`.toLowerCase();
      nameMap.set(fullName, emp);

      // Map by "FirstName LastName" format
      const reverseName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      nameMap.set(reverseName, emp);

      // DO NOT map by first name only - this causes false matches!
      // Removed: nameMap.set(emp.firstName.toLowerCase(), emp);
    }

    // Helper function to find approver using maps
    const findApproverByName = (nameOrId) => {
      if (!nameOrId || nameOrId === '-') return null;

      // Try employee ID first
      let approver = employeeIdMap.get(nameOrId);
      if (approver) return approver;

      // Try name matching with various formats
      const searchKey = nameOrId.toLowerCase().trim();

      // Direct match
      approver = nameMap.get(searchKey);
      if (approver) return approver;

      // Try "LastName, FirstName" format
      const nameParts = nameOrId.split(',').map(s => s.trim());
      if (nameParts.length === 2) {
        const [lastName, firstName] = nameParts;
        const key = `${lastName}, ${firstName}`.toLowerCase();
        approver = nameMap.get(key);
        if (approver) return approver;

        // Try reverse
        const reverseKey = `${firstName} ${lastName}`.toLowerCase();
        approver = nameMap.get(reverseKey);
        if (approver) return approver;
      }

      // Try "FirstName LastName" format
      const parts = nameOrId.split(' ').map(s => s.trim());
      if (parts.length >= 2) {
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];
        const key = `${firstName} ${lastName}`.toLowerCase();
        approver = nameMap.get(key);
        if (approver) return approver;

        const reverseKey = `${lastName}, ${firstName}`.toLowerCase();
        approver = nameMap.get(reverseKey);
        if (approver) return approver;
      }

      return null;
    };

    let updatedCount = 0;
    const errors = [];
    const bulkUpdates = [];

    // Process each employee
    for (const employee of allEmployees) {
      const updates = {};
      let hasUpdates = false;

      // Process each level (including supervisor)
      const levels = [
        { nameField: 'supervisorName', idField: 'supervisor' },
        { nameField: 'level1ApproverName', idField: 'level1Approver' },
        { nameField: 'level2ApproverName', idField: 'level2Approver' },
        { nameField: 'level3ApproverName', idField: 'level3Approver' },
        { nameField: 'level4ApproverName', idField: 'level4Approver' },
        { nameField: 'level5ApproverName', idField: 'level5Approver' },
      ];

      for (const level of levels) {
        const approverName = employee[level.nameField];

        if (approverName) {
          // Try to find the approver
          const approver = findApproverByName(approverName);

          if (approver) {
            // Only update if different from current value
            const currentId = employee[level.idField]?.toString();
            const newId = approver._id.toString();

            if (!currentId || currentId !== newId) {
              updates[level.idField] = approver._id;
              hasUpdates = true;
            }
          } else {
            // Log when person not found
            errors.push({
              employeeId: employee.employeeId,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              level: level.nameField.replace('ApproverName', '').replace('Name', ''),
              approverName: approverName,
              reason: 'Person not found in database'
            });
          }
        }
      }

      // Prepare bulk update
      if (hasUpdates) {
        bulkUpdates.push({
          updateOne: {
            filter: { _id: employee._id },
            update: { $set: updates }
          }
        });
        updatedCount++;
      }
    }

    // Execute all updates in one bulk operation
    if (bulkUpdates.length > 0) {
      await Employee.bulkWrite(bulkUpdates);
    }

    // If called via API, send response
    if (res) {
      return res.status(200).json({
        success: true,
        message: `Successfully synced supervisor and approver IDs`,
        updated: updatedCount,
        total: allEmployees.length,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    // If called internally, return result
    return { updated: updatedCount, total: allEmployees.length, errors };
  } catch (error) {
    if (res) {
      return next(error);
    }
    throw error;
  }
};

// @desc    Bulk create employees from Excel upload
// @route   POST /api/employees/bulk
// @access  Private (Admin/HR only)
export const bulkCreateEmployees = async (req, res, next) => {
  let employeesForDB = [];
  let reportingData = [];

  try {
    const { employees } = req.body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return next(new AppError('Please provide an array of employees', 400));
    }

    // Validate required fields for each employee
    const invalidEmployees = [];
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      if (!emp.employeeId || !emp.firstName) {
        invalidEmployees.push({
          index: i + 1,
          employeeId: emp.employeeId || 'N/A',
          employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'N/A',
          reason: 'Missing required fields (Employee Number, First Name)',
        });
      }
    }

    if (invalidEmployees.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some employees have validation errors',
        errors: invalidEmployees,
      });
    }

    // Separate employee data from reporting data

    try {
      for (const emp of employees) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(emp.password || 'password123', salt);

        // Extract reporting fields
        const { reporting1st, reporting2nd, reporting3rd, reporting4th, reporting5th, ...employeeData } = emp;

        // Store reporting separately
        reportingData.push({
          employeeId: emp.employeeId,
          reporting1st,
          reporting2nd,
          reporting3rd,
          reporting4th,
          reporting5th,
        });

        // Prepare employee for DB (without reporting fields)
        employeesForDB.push({
          ...employeeData,
          password: hashedPassword,
        });
      }
    } catch (hashError) {
      return next(new AppError('Failed to process employee data', 500));
    }

    // Insert all employees one by one to catch individual errors

    const createdEmployees = [];
    const skippedDuplicates = [];

    for (const empData of employeesForDB) {
      try {
        const created = await Employee.create(empData);
        createdEmployees.push(created);
      } catch (error) {
        // Track which employees failed and why
        const reason = error.code === 11000
          ? 'Duplicate entry (already exists in database)'
          : error.message || 'Validation error';

        skippedDuplicates.push({
          employeeId: empData.employeeId,
          employeeName: `${empData.firstName} ${empData.lastName}`.trim(),
          email: empData.email || 'N/A',
          reason: reason
        });
      }
    }

    // Helper function to find approver by name or ID
    const findApprover = async (reportingValue) => {
      if (!reportingValue) return null;

      // First, try to find by employee ID (if it looks like an ID)
      let approver = await Employee.findOne({ employeeId: reportingValue });
      if (approver) return approver;

      // If not found and looks like a name, try matching by full name
      // Expected format: "LastName, FirstName" or "FirstName LastName"
      const nameParts = reportingValue.split(',').map(s => s.trim());

      if (nameParts.length === 2) {
        // Format: "LastName, FirstName"
        const [lastName, firstName] = nameParts;
        approver = await Employee.findOne({
          firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
          lastName: { $regex: new RegExp(`^${lastName}`, 'i') }
        });
      } else {
        // Format: "FirstName LastName"
        const parts = reportingValue.split(' ');
        if (parts.length >= 2) {
          const firstName = parts[0];
          const lastName = parts[parts.length - 1];
          approver = await Employee.findOne({
            firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
            lastName: { $regex: new RegExp(`^${lastName}`, 'i') }
          });
        }
        // DO NOT match by first name only - this causes false matches!
        // Removed the first-name-only fallback
      }

      return approver;
    };

    // Second pass: Store approver names first (we'll sync IDs later)
    const reportingUpdates = [];

    for (const reportingInfo of reportingData) {
      const createdEmp = createdEmployees.find(ce => ce.employeeId === reportingInfo.employeeId);

      if (createdEmp) {
        const updateData = {};

        // Store approver names from Excel
        if (reportingInfo.reporting1st) {
          updateData.level1ApproverName = reportingInfo.reporting1st;
        }
        if (reportingInfo.reporting2nd) {
          updateData.level2ApproverName = reportingInfo.reporting2nd;
        }
        if (reportingInfo.reporting3rd) {
          updateData.level3ApproverName = reportingInfo.reporting3rd;
        }
        if (reportingInfo.reporting4th) {
          updateData.level4ApproverName = reportingInfo.reporting4th;
        }
        if (reportingInfo.reporting5th) {
          updateData.level5ApproverName = reportingInfo.reporting5th;
        }

        if (Object.keys(updateData).length > 0) {
          reportingUpdates.push(
            Employee.findByIdAndUpdate(createdEmp._id, updateData)
          );
        }
      }
    }

    // Execute all approver name updates
    if (reportingUpdates.length > 0) {
      await Promise.all(reportingUpdates);
    }

    // Third pass: Sync approver names to IDs
    const syncResult = await syncApproverIds();

    // If there were skipped duplicates, return 207 instead of 201
    const statusCode = skippedDuplicates.length > 0 ? 207 : 201;
    const message = skippedDuplicates.length > 0
      ? `Partially successful: ${createdEmployees.length} employees created, ${skippedDuplicates.length} skipped (already exist). Synced ${syncResult.updated} approver relationships.`
      : `Successfully created ${createdEmployees.length} employees. Synced ${syncResult.updated} approver relationships.`;

    res.status(statusCode).json({
      success: true,
      message,
      count: createdEmployees.length,
      reportingMapped: reportingUpdates.length,
      approversSynced: syncResult.updated,
      syncErrors: syncResult.errors.length > 0 ? syncResult.errors : undefined,
      skippedDuplicates: skippedDuplicates.length > 0 ? skippedDuplicates : undefined,
      data: createdEmployees.map((emp) => {
        const empData = emp.toObject();
        delete empData.password;
        return empData;
      }),
    });
  } catch (error) {
    // Handle bulk write errors (including duplicates)
    if (error.writeErrors || error.result) {
      const successCount = error.result?.nInserted || 0;
      const errorCount = error.writeErrors?.length || 0;

      const duplicates = error.writeErrors?.map((err) => {
        const employeeId = err.err?.op?.employeeId || err.op?.employeeId || 'Unknown';
        const email = err.err?.op?.email || err.op?.email || 'N/A';
        const firstName = err.err?.op?.firstName || err.op?.firstName || '';
        const lastName = err.err?.op?.lastName || err.op?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';

        return {
          employeeId,
          employeeName: fullName,
          email,
          reason: err.err?.code === 11000 || err.code === 11000
            ? 'Duplicate entry (already exists in database)'
            : (err.err?.errmsg || err.errmsg || JSON.stringify(err.err || 'Unknown error')),
        };
      }) || [];

      // Get successfully inserted documents
      const insertedDocs = error.insertedDocs || [];
      const insertedData = insertedDocs.map((doc) => {
        const empData = doc.toObject ? doc.toObject() : doc;
        delete empData.password;
        return empData;
      });

      return res.status(207).json({
        success: true,
        message: `Partially successful: ${successCount} employees created, ${errorCount} failed`,
        count: successCount,
        successCount,
        duplicates,
        data: insertedData,
      });
    }

    // Handle other errors
    next(error);
  }
};

// @desc    Clear and re-sync all approver IDs (fixes incorrect assignments)
// @route   POST /api/employees/approvals/reset-and-sync
// @access  Private (Admin/HR only)
export const resetAndSyncApprovers = async (req, res, next) => {
  try {
    // Step 1: Clear all approver ID fields and supervisor (keep the names)
    const clearResult = await Employee.updateMany(
      {},
      {
        $set: {
          supervisor: null,
          level1Approver: null,
          level2Approver: null,
          level3Approver: null,
          level4Approver: null,
          level5Approver: null,
        },
      }
    );

    // Step 2: Re-sync using the approver names
    const syncResult = await syncApproverIds();

    res.status(200).json({
      success: true,
      message: 'Successfully cleared and re-synced all supervisor and approver assignments',
      cleared: clearResult.modifiedCount,
      synced: syncResult.updated,
      total: syncResult.total,
      errors: syncResult.errors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Debug endpoint to check approver assignments
// @route   GET /api/employees/approvals/debug/:employeeId
// @access  Private (Admin/HR only)
export const debugApproverAssignments = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    // Find the approver
    const approver = await Employee.findOne({ employeeId }).select('_id employeeId firstName lastName');

    if (!approver) {
      return res.status(404).json({
        success: false,
        message: 'Approver not found',
      });
    }

    const approverId = approver._id;

    // Use the EXACT same queries as getMyApprovals
    const level1Count = await Employee.countDocuments({
      level1Approver: approverId,
      isActive: true,
      _id: { $ne: approverId },
    });

    const level2Count = await Employee.countDocuments({
      level2Approver: approverId,
      level1Approver: { $ne: approverId },
      isActive: true,
      _id: { $ne: approverId },
    });

    const level3Count = await Employee.countDocuments({
      level3Approver: approverId,
      level1Approver: { $ne: approverId },
      level2Approver: { $ne: approverId },
      isActive: true,
      _id: { $ne: approverId },
    });

    const level4Count = await Employee.countDocuments({
      level4Approver: approverId,
      level1Approver: { $ne: approverId },
      level2Approver: { $ne: approverId },
      level3Approver: { $ne: approverId },
      isActive: true,
      _id: { $ne: approverId },
    });

    const level5Count = await Employee.countDocuments({
      level5Approver: approverId,
      level1Approver: { $ne: approverId },
      level2Approver: { $ne: approverId },
      level3Approver: { $ne: approverId },
      level4Approver: { $ne: approverId },
      isActive: true,
      _id: { $ne: approverId },
    });

    // Get sample employees from Level 1 with ALL approver fields
    const sampleLevel1 = await Employee.find({
      level1Approver: approverId,
      isActive: true,
      _id: { $ne: approverId },
    })
      .select('employeeId firstName lastName level1ApproverName level2ApproverName level3ApproverName level4ApproverName level5ApproverName level1Approver level2Approver level3Approver level4Approver level5Approver')
      .populate('level1Approver', 'employeeId firstName lastName')
      .populate('level2Approver', 'employeeId firstName lastName')
      .populate('level3Approver', 'employeeId firstName lastName')
      .populate('level4Approver', 'employeeId firstName lastName')
      .populate('level5Approver', 'employeeId firstName lastName')
      .limit(10);

    // Get sample from Level 2
    const sampleLevel2 = await Employee.find({
      level2Approver: approverId,
      level1Approver: { $ne: approverId },
      isActive: true,
      _id: { $ne: approverId },
    })
      .select('employeeId firstName lastName level1ApproverName level2ApproverName level3ApproverName level4ApproverName level5ApproverName level1Approver level2Approver level3Approver level4Approver level5Approver')
      .populate('level1Approver', 'employeeId firstName lastName')
      .populate('level2Approver', 'employeeId firstName lastName')
      .populate('level3Approver', 'employeeId firstName lastName')
      .populate('level4Approver', 'employeeId firstName lastName')
      .populate('level5Approver', 'employeeId firstName lastName')
      .limit(10);

    res.status(200).json({
      success: true,
      approver: {
        employeeId: approver.employeeId,
        name: `${approver.firstName} ${approver.lastName}`,
        _id: approver._id,
      },
      counts: {
        level1: level1Count,
        level2: level2Count,
        level3: level3Count,
        level4: level4Count,
        level5: level5Count,
      },
      sampleLevel1Employees: sampleLevel1,
      sampleLevel2Employees: sampleLevel2,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employees for approver (by approval level)
// @route   GET /api/employees/approvals/my-approvals
// @access  Private (Approver only)
export const getMyApprovals = async (req, res, next) => {
  try {
    const approverId = req.user.userId || req.user._id;

    // Level 1: Only employees where this user is Level 1 approver
    const level1Employees = await Employee.find({
      level1Approver: approverId,
      isActive: true,
      _id: { $ne: approverId },
    })
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('approvalStatus.level1.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.enteredBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level1.approvedBy', 'firstName lastName employeeId')
      .sort({ employeeId: 1 });

    // Level 2: Only employees where this user is Level 2 approver
    // BUT NOT their Level 1 approver (to avoid duplicates across levels)
    const level2Employees = await Employee.find({
      level2Approver: approverId,
      level1Approver: { $ne: approverId }, // Make sure they're not also Level 1 under this user
      isActive: true,
      _id: { $ne: approverId },
    })
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('approvalStatus.level1.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level2.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.enteredBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level1.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level2.approvedBy', 'firstName lastName employeeId')
      .sort({ employeeId: 1 });

    // Level 3: Only employees where this user is Level 3 approver
    // BUT NOT their Level 1 or Level 2 approver
    const level3Employees = await Employee.find({
      level3Approver: approverId,
      level1Approver: { $ne: approverId },
      level2Approver: { $ne: approverId },
      isActive: true,
      _id: { $ne: approverId },
    })
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('level2Approver', 'firstName lastName employeeId')
      .populate('approvalStatus.level1.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level2.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level3.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.enteredBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level1.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level2.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level3.approvedBy', 'firstName lastName employeeId')
      .sort({ employeeId: 1 });

    // Level 4: Only employees where this user is Level 4 approver
    // BUT NOT their Level 1, 2, or 3 approver
    const level4Employees = await Employee.find({
      level4Approver: approverId,
      level1Approver: { $ne: approverId },
      level2Approver: { $ne: approverId },
      level3Approver: { $ne: approverId },
      isActive: true,
      _id: { $ne: approverId },
    })
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('level2Approver', 'firstName lastName employeeId')
      .populate('level3Approver', 'firstName lastName employeeId')
      .populate('approvalStatus.level1.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level2.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level3.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level4.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.enteredBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level1.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level2.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level3.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level4.approvedBy', 'firstName lastName employeeId')
      .sort({ employeeId: 1 });

    // Level 5: Only employees where this user is Level 5 approver
    // BUT NOT their Level 1, 2, 3, or 4 approver
    const level5Employees = await Employee.find({
      level5Approver: approverId,
      level1Approver: { $ne: approverId },
      level2Approver: { $ne: approverId },
      level3Approver: { $ne: approverId },
      level4Approver: { $ne: approverId },
      isActive: true,
      _id: { $ne: approverId },
    })
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('level2Approver', 'firstName lastName employeeId')
      .populate('level3Approver', 'firstName lastName employeeId')
      .populate('level4Approver', 'firstName lastName employeeId')
      .populate('approvalStatus.level1.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level2.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level3.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level4.approvedBy', 'firstName lastName employeeId')
      .populate('approvalStatus.level5.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.enteredBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level1.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level2.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level3.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level4.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level5.approvedBy', 'firstName lastName employeeId')
      .sort({ employeeId: 1 });

    res.status(200).json({
      success: true,
      data: {
        level1: level1Employees,
        level2: level2Employees,
        level3: level3Employees,
        level4: level4Employees,
        level5: level5Employees,
      },
      counts: {
        level1: level1Employees.length,
        level2: level2Employees.length,
        level3: level3Employees.length,
        level4: level4Employees.length,
        level5: level5Employees.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employees under a supervisor
// @route   GET /api/employees/supervisor/my-team
// @access  Private (Supervisor only)
export const getMySupervisedEmployees = async (req, res, next) => {
  try {
    const supervisorId = req.user.userId || req.user._id;

    const employees = await Employee.find({
      supervisor: supervisorId,
      isActive: true,
      _id: { $ne: supervisorId },
    })
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('level2Approver', 'firstName lastName employeeId')
      .populate('level3Approver', 'firstName lastName employeeId')
      .populate('level4Approver', 'firstName lastName employeeId')
      .populate('level5Approver', 'firstName lastName employeeId')
      .populate('bonus2025Status.enteredBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level1.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level2.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level3.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level4.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level5.approvedBy', 'firstName lastName employeeId')
      .sort({ employeeId: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update bonus for an employee (supervisor action)
// @route   PUT /api/employees/:id/bonus
// @access  Private (Supervisor only)
export const updateEmployeeBonus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bonus2025 } = req.body;
    const supervisorId = req.user.userId || req.user._id;

    if (bonus2025 === undefined || bonus2025 === null) {
      return next(new AppError('Bonus amount is required', 400));
    }

    if (bonus2025 < 0) {
      return next(new AppError('Bonus amount cannot be negative', 400));
    }

    // Find the employee
    const employee = await Employee.findById(id);

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Verify that the logged-in user is the supervisor
    if (!employee.supervisor || employee.supervisor.toString() !== supervisorId.toString()) {
      return next(new AppError('You are not authorized to set bonus for this employee', 403));
    }

    // Determine which approval levels are required based on available approvers
    const bonusStatusUpdate = {
      enteredBy: supervisorId,
      enteredAt: new Date(),
    };

    // Set status for each level based on whether approver exists
    if (employee.level1Approver) {
      bonusStatusUpdate.level1 = { status: 'pending' };
    } else {
      bonusStatusUpdate.level1 = { status: 'not_required' };
    }

    if (employee.level2Approver) {
      bonusStatusUpdate.level2 = { status: 'pending' };
    } else {
      bonusStatusUpdate.level2 = { status: 'not_required' };
    }

    if (employee.level3Approver) {
      bonusStatusUpdate.level3 = { status: 'pending' };
    } else {
      bonusStatusUpdate.level3 = { status: 'not_required' };
    }

    if (employee.level4Approver) {
      bonusStatusUpdate.level4 = { status: 'pending' };
    } else {
      bonusStatusUpdate.level4 = { status: 'not_required' };
    }

    if (employee.level5Approver) {
      bonusStatusUpdate.level5 = { status: 'pending' };
    } else {
      bonusStatusUpdate.level5 = { status: 'not_required' };
    }

    // Update the employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      {
        $set: {
          bonus2025,
          bonus2025Status: bonusStatusUpdate,
        },
      },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('level2Approver', 'firstName lastName employeeId')
      .populate('level3Approver', 'firstName lastName employeeId')
      .populate('level4Approver', 'firstName lastName employeeId')
      .populate('level5Approver', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Bonus updated successfully and sent for approval',
      data: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employees pending bonus approval for approver
// @route   GET /api/employees/bonus-approvals/my-approvals
// @access  Private (Approver only)
export const getMyBonusApprovals = async (req, res, next) => {
  try {
    const approverId = req.user.userId || req.user._id;

    // Helper function to determine the next required approval level
    const getNextApprovalLevel = (employee) => {
      // Check levels in order
      for (let level = 1; level <= 5; level++) {
        const levelKey = `level${level}`;
        const approverField = `${levelKey}Approver`;
        const statusPath = `bonus2025Status.${levelKey}.status`;

        // If this level has an approver
        if (employee[approverField]) {
          const status = employee.bonus2025Status?.[levelKey]?.status;

          // If pending, this is the next level
          if (status === 'pending') {
            return { level, approverId: employee[approverField] };
          }

          // If not approved/not_required, approval is blocked at this level
          if (status !== 'approved' && status !== 'not_required') {
            return null;
          }
        }
      }
      return null; // All levels approved or no more levels
    };

    // Find all active employees with bonus entered
    const allEmployees = await Employee.find({
      isActive: true,
      'bonus2025Status.enteredBy': { $exists: true, $ne: null },
    })
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('supervisor', 'firstName lastName employeeId')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('level2Approver', 'firstName lastName employeeId')
      .populate('level3Approver', 'firstName lastName employeeId')
      .populate('level4Approver', 'firstName lastName employeeId')
      .populate('level5Approver', 'firstName lastName employeeId')
      .populate('bonus2025Status.enteredBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level1.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level2.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level3.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level4.approvedBy', 'firstName lastName employeeId')
      .populate('bonus2025Status.level5.approvedBy', 'firstName lastName employeeId')
      .sort({ employeeId: 1 });

    // Filter to employees where this approver is the NEXT approver
    const myApprovals = allEmployees.filter((emp) => {
      const nextLevel = getNextApprovalLevel(emp);
      return nextLevel && nextLevel.approverId.toString() === approverId.toString();
    });

    res.status(200).json({
      success: true,
      count: myApprovals.length,
      data: myApprovals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process bonus approval/rejection
// @route   POST /api/employees/:employeeId/bonus-approval
// @access  Private (Approver only)
export const processBonusApproval = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { action, comments } = req.body;
    const approverId = req.user.userId || req.user._id;

    // Validate input
    if (!action) {
      return next(new AppError('Action is required', 400));
    }

    if (!['approve', 'reject'].includes(action)) {
      return next(new AppError('Action must be either approve or reject', 400));
    }

    // Find the employee
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Check if bonus has been entered
    if (!employee.bonus2025Status?.enteredBy) {
      return next(new AppError('No bonus has been entered for this employee', 400));
    }

    // Determine which level this approver should approve
    let approverLevel = null;

    for (let level = 1; level <= 5; level++) {
      const levelKey = `level${level}`;
      const approverField = `${levelKey}Approver`;

      if (employee[approverField]?.toString() === approverId.toString()) {
        const status = employee.bonus2025Status?.[levelKey]?.status;

        if (status === 'pending') {
          // Check if previous levels are approved or not_required
          let canApprove = true;

          for (let prevLevel = 1; prevLevel < level; prevLevel++) {
            const prevLevelKey = `level${prevLevel}`;
            const prevStatus = employee.bonus2025Status?.[prevLevelKey]?.status;

            // Previous level must be approved or not_required
            if (prevStatus !== 'approved' && prevStatus !== 'not_required') {
              canApprove = false;
              break;
            }
          }

          if (canApprove) {
            approverLevel = level;
            break;
          } else {
            return next(new AppError(`Previous approval levels must be completed first`, 400));
          }
        }
      }
    }

    if (!approverLevel) {
      return next(new AppError('You are not authorized to approve bonus for this employee at this time', 403));
    }

    // Update bonus approval status
    const levelKey = `level${approverLevel}`;
    const approvalUpdate = {
      [`bonus2025Status.${levelKey}.status`]: action === 'approve' ? 'approved' : 'rejected',
      [`bonus2025Status.${levelKey}.approvedBy`]: approverId,
      [`bonus2025Status.${levelKey}.approvedAt`]: new Date(),
    };

    if (comments) {
      approvalUpdate[`bonus2025Status.${levelKey}.comments`] = comments;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: approvalUpdate },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate('supervisor', 'firstName lastName employeeId')
      .populate('level1Approver', 'firstName lastName employeeId')
      .populate('level2Approver', 'firstName lastName employeeId')
      .populate('level3Approver', 'firstName lastName employeeId')
      .populate('level4Approver', 'firstName lastName employeeId')
      .populate('level5Approver', 'firstName lastName employeeId')
      .populate('bonus2025Status.enteredBy', 'firstName lastName employeeId')
      .populate(`bonus2025Status.${levelKey}.approvedBy`, 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: `Bonus ${action === 'approve' ? 'approved' : 'rejected'} successfully at level ${approverLevel}`,
      data: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process approval/rejection for an employee
// @route   POST /api/employees/approvals/:employeeId
// @access  Private (Approver only)
export const processApproval = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { level, action, comments } = req.body;
    const approverId = req.user.userId || req.user._id;

    // Validate input
    if (!level || !action) {
      return next(new AppError('Level and action are required', 400));
    }

    if (![1, 2, 3, 4, 5].includes(level)) {
      return next(new AppError('Level must be between 1 and 5', 400));
    }

    if (!['approve', 'reject'].includes(action)) {
      return next(new AppError('Action must be either approve or reject', 400));
    }

    // Find the employee
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // REMOVED: Regular approvals don't require bonus to be entered
    // This check was preventing approvers from approving employees
    // Bonus approvals are handled separately in processBonusApproval endpoint
    // if (!employee.bonus2025Status?.enteredBy) {
    //   return next(new AppError('No bonus has been entered for this employee. Cannot approve.', 400));
    // }

    // Verify that the logged-in user is the approver for this level
    const levelKey = `level${level}`;
    const approverField = `${levelKey}Approver`;

    if (!employee[approverField] || employee[approverField].toString() !== approverId.toString()) {
      return next(new AppError(`You are not authorized to approve/reject at level ${level} for this employee`, 403));
    }

    // Check if previous levels are approved or not_required (for level 2+)
    if (level > 1) {
      for (let i = 1; i < level; i++) {
        const prevLevelKey = `level${i}`;
        const prevApproverField = `${prevLevelKey}Approver`;
        const prevStatus = employee.approvalStatus?.[prevLevelKey]?.status;

        // If previous level has an approver assigned, it must be approved
        if (employee[prevApproverField]) {
          if (prevStatus !== 'approved') {
            return next(new AppError(`Level ${i} must be approved before level ${level} can be processed`, 400));
          }
        }
        // If no approver at previous level, it's automatically considered complete (not_required)
      }
    }

    // Check if already processed
    const currentStatus = employee.approvalStatus?.[levelKey]?.status;
    if (currentStatus === 'approved' || currentStatus === 'rejected') {
      return next(new AppError(`This employee has already been ${currentStatus} at level ${level}`, 400));
    }

    // Update approval status
    const approvalUpdate = {
      [`approvalStatus.${levelKey}.status`]: action === 'approve' ? 'approved' : 'rejected',
      [`approvalStatus.${levelKey}.approvedBy`]: approverId,
      [`approvalStatus.${levelKey}.approvedAt`]: new Date(),
    };

    if (comments) {
      approvalUpdate[`approvalStatus.${levelKey}.comments`] = comments;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: approvalUpdate },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('branch', 'branchCode branchName location')
      .populate(`${levelKey}Approver`, 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: `Employee ${action === 'approve' ? 'approved' : 'rejected'} successfully at level ${level}`,
      data: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};
