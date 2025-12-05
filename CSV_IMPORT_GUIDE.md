# CSV Bulk Import Guide for Users

## Overview
You can now import multiple users at once using a CSV file. This feature allows you to add up to 1000 users in a single import.

## How to Use

### 1. Access the Import Feature
- Navigate to the **Dashboard > Users** page
- Click the **"Import CSV"** button in the top right corner

### 2. Download the Template
- In the import modal, click **"Download Template"** to get a sample CSV file
- The template includes example data showing the correct format

### 3. Prepare Your CSV File

#### Required Column:
- **email** - User's email address (required, must be unique and valid)

#### Optional Columns:
- **first_name** - User's first name
- **last_name** - User's last name
- **phone** - Phone number (any format)
- **role** - User role (options: admin, manager, interviewer, viewer)
- **status** - User status (options: active, inactive, pending, suspended)

#### Default Values:
- **role**: If not specified, defaults to `viewer`
- **status**: If not specified, defaults to `active`

### 4. CSV Format Example

```csv
email,first_name,last_name,phone,role,status
john.doe@example.com,John,Doe,+1234567890,viewer,active
jane.smith@example.com,Jane,Smith,+0987654321,manager,active
admin@example.com,Admin,User,+1122334455,admin,active
```

### 5. Upload and Import
1. Drag and drop your CSV file or click to browse
2. Review the preview of your data
3. Click **"Import [N] User(s)"** to start the import
4. View the results showing successful and failed imports

## Important Notes

### Validation Rules
- ✅ Email addresses must be valid and unique
- ✅ Maximum 1000 users per import
- ✅ Duplicate emails will be rejected
- ✅ Invalid roles or statuses will cause row to be skipped

### Valid Roles
- `admin` - Full system access
- `manager` - Can manage interviews and users
- `interviewer` - Can conduct interviews
- `viewer` - Read-only access (default)

### Valid Statuses
- `active` - User is active (default)
- `inactive` - User is inactive
- `pending` - User pending activation
- `suspended` - User is suspended

## Error Handling
- The import process validates each row
- Invalid rows are skipped and reported in the results
- Successfully imported users are added to the system
- View detailed error messages for failed imports

## Tips
- Keep your CSV file under 1000 rows
- Use lowercase for role and status values
- Test with a small file first (5-10 users)
- Ensure no duplicate emails in your CSV
- Check that all email addresses are properly formatted

## Troubleshooting

### Common Issues:
1. **"Invalid email format"** - Check email address formatting
2. **"User already exists"** - Email is already in the system
3. **"Invalid role"** - Use only: admin, manager, interviewer, or viewer
4. **"Invalid status"** - Use only: active, inactive, pending, or suspended
5. **"Failed to parse CSV"** - Check file format and encoding (UTF-8 recommended)

## Support
If you encounter any issues with the bulk import feature, please contact your system administrator.

