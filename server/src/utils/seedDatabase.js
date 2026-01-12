import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import OrganizationHierarchy from '../models/OrganizationHierarchy.js';
import BonusCycle from '../models/BonusCycle.js';
import BonusBudget from '../models/BonusBudget.js';
import BonusAllocation from '../models/BonusAllocation.js';
import PortalUser from '../models/PortalUser.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to database\n');

    // Clear existing data
    await Promise.all([
      Employee.deleteMany({}),
      OrganizationHierarchy.deleteMany({}),
      BonusCycle.deleteMany({}),
      BonusBudget.deleteMany({}),
      BonusAllocation.deleteMany({}),
      PortalUser.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data\n');

    // Create Organization Hierarchy
    console.log('Creating organization hierarchy...');

    // Executive Level
    const executive = await OrganizationHierarchy.create({
      name: 'Executive',
      code: 'EXEC',
      type: 'Executive',
      level: 1,
    });

    // Businesses
    const retail = await OrganizationHierarchy.create({
      name: 'Retail Business',
      code: 'RETAIL',
      type: 'Business',
      parentId: executive._id,
      level: 2,
    });

    const corporate = await OrganizationHierarchy.create({
      name: 'Corporate Business',
      code: 'CORP',
      type: 'Business',
      parentId: executive._id,
      level: 2,
    });

    // Branches
    const eastBranch = await OrganizationHierarchy.create({
      name: 'East Branch',
      code: 'EAST',
      type: 'Branch',
      parentId: retail._id,
      level: 3,
    });

    const westBranch = await OrganizationHierarchy.create({
      name: 'West Branch',
      code: 'WEST',
      type: 'Branch',
      parentId: retail._id,
      level: 3,
    });

    // Departments
    const salesDept = await OrganizationHierarchy.create({
      name: 'Sales Department',
      code: 'SALES',
      type: 'Department',
      parentId: eastBranch._id,
      level: 4,
    });

    const marketingDept = await OrganizationHierarchy.create({
      name: 'Marketing Department',
      code: 'MRKT',
      type: 'Department',
      parentId: eastBranch._id,
      level: 4,
    });

    const itDept = await OrganizationHierarchy.create({
      name: 'IT Department',
      code: 'IT',
      type: 'Department',
      parentId: corporate._id,
      level: 4,
    });

    const hrDept = await OrganizationHierarchy.create({
      name: 'HR Department',
      code: 'HR',
      type: 'Department',
      parentId: corporate._id,
      level: 4,
    });

    const financeDept = await OrganizationHierarchy.create({
      name: 'Finance Department',
      code: 'FIN',
      type: 'Department',
      parentId: westBranch._id,
      level: 4,
    });

    console.log('✅ Created organization hierarchy\n');

    // Create Employees
    console.log('Creating employees...');

    // Managers
    const salesManager = await Employee.create({
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@company.com',
      departmentId: salesDept._id,
      position: 'Sales Manager',
      hireDate: new Date('2018-01-15'),
      salary: 85000,
      isManager: true,
    });

    const marketingManager = await Employee.create({
      employeeId: 'EMP002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
      departmentId: marketingDept._id,
      position: 'Marketing Manager',
      hireDate: new Date('2019-03-20'),
      salary: 80000,
      isManager: true,
    });

    const itManager = await Employee.create({
      employeeId: 'EMP003',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@company.com',
      departmentId: itDept._id,
      position: 'IT Manager',
      hireDate: new Date('2017-06-10'),
      salary: 95000,
      isManager: true,
    });

    const hrManager = await Employee.create({
      employeeId: 'EMP004',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@company.com',
      departmentId: hrDept._id,
      position: 'HR Manager',
      hireDate: new Date('2020-02-01'),
      salary: 75000,
      isManager: true,
    });

    const financeManager = await Employee.create({
      employeeId: 'EMP005',
      firstName: 'Robert',
      lastName: 'Wilson',
      email: 'robert.wilson@company.com',
      departmentId: financeDept._id,
      position: 'Finance Manager',
      hireDate: new Date('2016-09-15'),
      salary: 90000,
      isManager: true,
    });

    // Sales Team
    const salesEmp1 = await Employee.create({
      employeeId: 'EMP101',
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice.brown@company.com',
      departmentId: salesDept._id,
      managerId: salesManager._id,
      position: 'Sales Representative',
      hireDate: new Date('2020-05-10'),
      salary: 55000,
    });

    const salesEmp2 = await Employee.create({
      employeeId: 'EMP102',
      firstName: 'David',
      lastName: 'Martinez',
      email: 'david.martinez@company.com',
      departmentId: salesDept._id,
      managerId: salesManager._id,
      position: 'Sales Representative',
      hireDate: new Date('2021-01-15'),
      salary: 52000,
    });

    const salesEmp3 = await Employee.create({
      employeeId: 'EMP103',
      firstName: 'Jennifer',
      lastName: 'Taylor',
      email: 'jennifer.taylor@company.com',
      departmentId: salesDept._id,
      managerId: salesManager._id,
      position: 'Senior Sales Rep',
      hireDate: new Date('2019-07-20'),
      salary: 62000,
    });

    // Marketing Team
    const mktgEmp1 = await Employee.create({
      employeeId: 'EMP201',
      firstName: 'Chris',
      lastName: 'Anderson',
      email: 'chris.anderson@company.com',
      departmentId: marketingDept._id,
      managerId: marketingManager._id,
      position: 'Marketing Specialist',
      hireDate: new Date('2020-11-01'),
      salary: 58000,
    });

    const mktgEmp2 = await Employee.create({
      employeeId: 'EMP202',
      firstName: 'Lisa',
      lastName: 'Thomas',
      email: 'lisa.thomas@company.com',
      departmentId: marketingDept._id,
      managerId: marketingManager._id,
      position: 'Content Creator',
      hireDate: new Date('2021-03-15'),
      salary: 54000,
    });

    // IT Team
    const itEmp1 = await Employee.create({
      employeeId: 'EMP301',
      firstName: 'Kevin',
      lastName: 'Garcia',
      email: 'kevin.garcia@company.com',
      departmentId: itDept._id,
      managerId: itManager._id,
      position: 'Software Developer',
      hireDate: new Date('2019-08-12'),
      salary: 75000,
    });

    const itEmp2 = await Employee.create({
      employeeId: 'EMP302',
      firstName: 'Amanda',
      lastName: 'White',
      email: 'amanda.white@company.com',
      departmentId: itDept._id,
      managerId: itManager._id,
      position: 'System Administrator',
      hireDate: new Date('2020-04-20'),
      salary: 68000,
    });

    // HR Team
    const hrEmp1 = await Employee.create({
      employeeId: 'EMP401',
      firstName: 'Brian',
      lastName: 'Lee',
      email: 'brian.lee@company.com',
      departmentId: hrDept._id,
      managerId: hrManager._id,
      position: 'HR Coordinator',
      hireDate: new Date('2021-06-01'),
      salary: 50000,
    });

    // Finance Team
    const finEmp1 = await Employee.create({
      employeeId: 'EMP501',
      firstName: 'Michelle',
      lastName: 'Rodriguez',
      email: 'michelle.rodriguez@company.com',
      departmentId: financeDept._id,
      managerId: financeManager._id,
      position: 'Accountant',
      hireDate: new Date('2020-09-10'),
      salary: 60000,
    });

    const finEmp2 = await Employee.create({
      employeeId: 'EMP502',
      firstName: 'Daniel',
      lastName: 'Kim',
      email: 'daniel.kim@company.com',
      departmentId: financeDept._id,
      managerId: financeManager._id,
      position: 'Financial Analyst',
      hireDate: new Date('2019-12-05'),
      salary: 65000,
    });

    console.log('✅ Created employees\n');

    // Create Portal Users
    console.log('Creating portal users...');

    // Create manager users
    await PortalUser.create({
      employeeId: salesManager._id,
      email: salesManager.email,
      password: 'password123',
      role: 'Manager',
      accessLevel: 1,
      departmentAccess: [salesDept._id],
    });

    await PortalUser.create({
      employeeId: marketingManager._id,
      email: marketingManager.email,
      password: 'password123',
      role: 'Manager',
      accessLevel: 1,
      departmentAccess: [marketingDept._id],
    });

    await PortalUser.create({
      employeeId: itManager._id,
      email: itManager.email,
      password: 'password123',
      role: 'Manager',
      accessLevel: 1,
      departmentAccess: [itDept._id],
    });

    await PortalUser.create({
      employeeId: hrManager._id,
      email: hrManager.email,
      password: 'password123',
      role: 'Manager',
      accessLevel: 1,
      departmentAccess: [hrDept._id],
    });

    await PortalUser.create({
      employeeId: financeManager._id,
      email: financeManager.email,
      password: 'password123',
      role: 'Manager',
      accessLevel: 1,
      departmentAccess: [financeDept._id],
    });

    // Create HR Admin user
    const hrAdmin = await Employee.create({
      employeeId: 'ADMIN001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@company.com',
      departmentId: hrDept._id,
      position: 'HR Administrator',
      hireDate: new Date('2015-01-01'),
      salary: 100000,
      isManager: false,
    });

    await PortalUser.create({
      employeeId: hrAdmin._id,
      email: hrAdmin.email,
      password: 'admin123',
      role: 'HR Admin',
      accessLevel: 6,
      departmentAccess: [salesDept._id, marketingDept._id, itDept._id, hrDept._id, financeDept._id],
    });

    console.log('✅ Created portal users\n');

    // Create Bonus Cycles
    console.log('Creating bonus cycles...');

    const currentYear = new Date().getFullYear();

    const previousCycle = await BonusCycle.create({
      year: currentYear - 1,
      name: `${currentYear - 1} Annual Bonus`,
      startDate: new Date(`${currentYear - 1}-01-01`),
      endDate: new Date(`${currentYear - 1}-12-31`),
      managerDeadline: new Date(`${currentYear}-01-31`),
      reviewerDeadline: new Date(`${currentYear}-02-28`),
      status: 'Closed',
      totalBudget: 150000,
      isActive: false,
    });

    const currentCycle = await BonusCycle.create({
      year: currentYear,
      name: `${currentYear} Annual Bonus`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      managerDeadline: new Date(`${currentYear}-02-28`),
      reviewerDeadline: new Date(`${currentYear}-03-31`),
      status: 'Active',
      totalBudget: 200000,
      isActive: true,
    });

    console.log('✅ Created bonus cycles\n');

    // Create Budgets for Current Cycle
    console.log('Creating budgets...');

    await BonusBudget.create({
      cycleId: currentCycle._id,
      managerId: salesManager._id,
      departmentId: salesDept._id,
      allocatedBudget: 15000,
      employeeCount: 3,
    });

    await BonusBudget.create({
      cycleId: currentCycle._id,
      managerId: marketingManager._id,
      departmentId: marketingDept._id,
      allocatedBudget: 10000,
      employeeCount: 2,
    });

    await BonusBudget.create({
      cycleId: currentCycle._id,
      managerId: itManager._id,
      departmentId: itDept._id,
      allocatedBudget: 20000,
      employeeCount: 2,
    });

    await BonusBudget.create({
      cycleId: currentCycle._id,
      managerId: hrManager._id,
      departmentId: hrDept._id,
      allocatedBudget: 8000,
      employeeCount: 1,
    });

    await BonusBudget.create({
      cycleId: currentCycle._id,
      managerId: financeManager._id,
      departmentId: financeDept._id,
      allocatedBudget: 12000,
      employeeCount: 2,
    });

    console.log('✅ Created budgets\n');

    // Create Previous Year Allocations
    console.log('Creating previous year allocations...');

    await BonusAllocation.create([
      {
        cycleId: previousCycle._id,
        employeeId: salesEmp1._id,
        managerId: salesManager._id,
        departmentId: salesDept._id,
        bonusAmount: 3000,
        status: 'HR Approved',
      },
      {
        cycleId: previousCycle._id,
        employeeId: salesEmp2._id,
        managerId: salesManager._id,
        departmentId: salesDept._id,
        bonusAmount: 2500,
        status: 'HR Approved',
      },
      {
        cycleId: previousCycle._id,
        employeeId: salesEmp3._id,
        managerId: salesManager._id,
        departmentId: salesDept._id,
        bonusAmount: 4000,
        status: 'HR Approved',
      },
      {
        cycleId: previousCycle._id,
        employeeId: mktgEmp1._id,
        managerId: marketingManager._id,
        departmentId: marketingDept._id,
        bonusAmount: 3500,
        status: 'HR Approved',
      },
      {
        cycleId: previousCycle._id,
        employeeId: mktgEmp2._id,
        managerId: marketingManager._id,
        departmentId: marketingDept._id,
        bonusAmount: 3000,
        status: 'HR Approved',
      },
    ]);

    console.log('✅ Created previous year allocations\n');

    console.log('🎉 Database seeded successfully!\n');
    console.log('📋 Credentials:\n');
    console.log('Manager Login:');
    console.log('  Email: john.smith@company.com');
    console.log('  Password: password123\n');
    console.log('HR Admin Login:');
    console.log('  Email: admin@company.com');
    console.log('  Password: admin123\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
