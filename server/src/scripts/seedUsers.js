import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    // Clear existing employees (optional)
    // await Employee.deleteMany({});
    // console.log('Cleared existing employees');

    // Hash password
    const hashedPassword = await bcrypt.hash('2424', 10);

    const users = [
      {
        employeeId: 'EMP001',
        firstName: 'HR',
        lastName: 'Manager',
        email: 'hr@company.com',
        password: hashedPassword,
        position: 'HR Manager',
        role: 'hr',
        hireDate: new Date('2020-01-01'),
        salary: 75000,
        isApprover: false,
      },
      {
        employeeId: 'EMP002',
        firstName: 'John',
        lastName: 'Supervisor',
        email: 'supervisor@company.com',
        password: hashedPassword,
        position: 'Department Supervisor',
        role: 'approver',
        hireDate: new Date('2020-06-01'),
        salary: 65000,
        isApprover: true,
        approverLevel: 'Level-1',
      },
      {
        employeeId: 'EMP003',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john.smith@company.com',
        password: hashedPassword,
        position: 'Senior Approver',
        role: 'approver',
        hireDate: new Date('2019-03-15'),
        salary: 70000,
        isApprover: true,
        approverLevel: 'Level-2',
      },
      {
        employeeId: 'EMP004',
        firstName: 'Mike',
        lastName: 'Employee',
        email: 'employee@company.com',
        password: hashedPassword,
        position: 'Software Developer',
        role: 'employee',
        hireDate: new Date('2021-09-01'),
        salary: 55000,
        isApprover: false,
      },
    ];

    // Insert users
    for (const user of users) {
      const existingUser = await Employee.findOne({ email: user.email });
      if (existingUser) {
        console.log(`User ${user.email} already exists, updating...`);
        await Employee.findOneAndUpdate(
          { email: user.email },
          user,
          { runValidators: true, new: true }
        );
      } else {
        await Employee.create(user);
        console.log(`Created user: ${user.email}`);
      }
    }

    console.log('\n✅ User seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('==================');
    console.log('HR User:');
    console.log('  Email: hr@company.com');
    console.log('  Password: 2424');
    console.log('\nApprover User (Supervisor):');
    console.log('  Email: supervisor@company.com');
    console.log('  Password: 2424');
    console.log('\nApprover User (John Smith):');
    console.log('  Email: john.smith@company.com');
    console.log('  Password: 2424');
    console.log('\nRegular Employee:');
    console.log('  Email: employee@company.com');
    console.log('  Password: 2424');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
