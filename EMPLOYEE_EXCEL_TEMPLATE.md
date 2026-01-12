# Employee Excel Upload Template

## Required Columns

| Column Name      | Description                           | Example               |
|------------------|---------------------------------------|-----------------------|
| Employee Number  | Unique employee identifier            | EMP001                |
| Employee Name    | Full name (First Last)                | John Doe              |

## Optional Columns

| Column Name        | Description                           | Example               |
|--------------------|---------------------------------------|-----------------------|
| SSN                | Social Security Number                | 123-45-6789           |
| Company            | Company name                          | Acme Corp             |
| Company Code       | Company code/identifier               | ACME001               |
| Supervisor Name    | Name of direct supervisor             | Jane Smith            |
| Location           | Work location                         | New York Office       |
| 1st Reporting      | First level approver (name or emp #)  | Jane Smith or EMP002  |
| 2nd Reporting      | Second level approver                 | Bob Johnson           |
| 3rd Reporting      | Third level approver                  | Alice Brown           |
| 4th Reporting      | Fourth level approver                 | Charlie Davis         |
| 5th Reporting      | Fifth level approver                  | David Wilson          |
| State/Province     | State or Province                     | NY                    |
| Work Email         | Corporate email address               | john.doe@company.com  |
| Last Hire Date     | Most recent hire date                 | 2024-01-15            |
| Employee Type      | Type of employment                    | Full-time             |
| Job Title          | Employee's job title                  | Software Engineer     |
| Salary or Hourly   | Compensation type                     | Salary                |
| Annual Salary      | Yearly salary amount                  | 75000                 |
| Hourly Pay Rate    | Hourly rate (if applicable)           | 35.50                 |
| 2024 Bonus         | Bonus amount for 2024                 | 5000                  |
| 2025 Bonus         | Bonus amount for 2025                 | 6000                  |

## Important Notes

1. **Work Email**: If not provided, the system will auto-generate an email using the format: `firstname.lastname.employeenumber@company.com`

2. **Reporting Hierarchy**: The reporting columns can contain either:
   - Employee Number (e.g., EMP002)
   - Employee Name (e.g., Jane Smith)

   The system will attempt to match and link these to existing employees in the database.

3. **Date Format**: Dates should be in YYYY-MM-DD format or Excel date format.

4. **Numbers**: Remove currency symbols and commas from salary and bonus fields. Use plain numbers only.

5. **Empty Fields**: Optional fields can be left empty. The system will handle them gracefully.

6. **Branch Assignment**: All employees in the upload will be assigned to the branch you select in the upload modal.

7. **Default Password**: All uploaded employees will have the password `password123` by default. Users should change this on first login.

## Sample Data Row

```
Employee Number: EMP001
Employee Name: John Doe
SSN: 123-45-6789
Company: Acme Corporation
Company Code: ACME
Supervisor Name: Jane Smith
Location: New York Office
1st Reporting: EMP002
2nd Reporting: Bob Johnson
State/Province: NY
Work Email: john.doe@acme.com
Last Hire Date: 2024-01-15
Employee Type: Full-time
Job Title: Software Engineer
Salary or Hourly: Salary
Annual Salary: 75000
2024 Bonus: 5000
2025 Bonus: 6000
```

## Excel File Requirements

- File format: `.xlsx` or `.xls`
- First row must contain column headers (matching the names above)
- Data starts from row 2
- Column order doesn't matter as long as headers match
- Column name matching is case-insensitive
