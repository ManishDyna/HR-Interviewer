# Interview Assignee Management System

This document describes the new Interview Assignee Management System that allows administrators to manage users who can be assigned interviews.

## Overview

The Interview Assignee system creates a separate table (`interview_assignee`) to store users who can be assigned interviews, rather than using the existing `user` table. This provides a dedicated system for managing interview assignments with specific functionality for:

- Creating and managing assignees
- Assigning interviews to assignees
- Tracking assignment status and history
- Managing assignee information and notes

## Database Schema

### interview_assignee Table

```sql
CREATE TABLE interview_assignee (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    organization_id TEXT REFERENCES organization(id),
    interview_id TEXT REFERENCES interview(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    assigned_by TEXT REFERENCES "user"(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    notes TEXT
);
```

### Key Fields

- **id**: Unique identifier for the assignee
- **first_name, last_name**: Assignee's full name
- **email**: Unique email address for the assignee
- **phone**: Optional phone number
- **avatar_url**: Optional avatar image URL
- **organization_id**: Links to the organization
- **interview_id**: Links to the assigned interview (nullable)
- **status**: Current status ('active', 'inactive', 'pending')
- **assigned_by**: User who made the assignment
- **assigned_at**: When the interview was assigned
- **notes**: Additional notes about the assignee or assignment

## API Endpoints

### GET /api/assignees
List all assignees with optional filtering:
- `organizationId`: Required organization ID
- `search`: Optional search term
- `status`: Optional status filter

### POST /api/assignees
Create a new assignee:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "avatar_url": "https://example.com/avatar.jpg",
  "organization_id": "org-id",
  "status": "active",
  "notes": "Senior developer"
}
```

### GET /api/assignees/[id]
Get a specific assignee by ID.

### PUT /api/assignees/[id]
Update an assignee:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "status": "active",
  "notes": "Updated notes"
}
```

### DELETE /api/assignees/[id]
Delete an assignee.

### POST /api/assignees/assign-interview
Assign an interview to an assignee:
```json
{
  "assignee_id": 1,
  "interview_id": "interview-uuid",
  "assigned_by": "user-id",
  "notes": "Assignment notes"
}
```

### DELETE /api/assignees/assign-interview
Unassign an interview from an assignee:
```json
{
  "assignee_id": 1,
  "assigned_by": "user-id"
}
```

## Frontend Components

### AssigneeCard
Displays assignee information in a card format with:
- Name and email
- Status badge
- Assignment status (assigned/unassigned)
- Action menu (edit, delete, assign/unassign interview)

### CreateAssigneeModal
Modal for creating or editing assignees with fields for:
- First and last name
- Email address
- Phone number
- Avatar URL
- Status
- Notes

### AssigneesPage
Main page that displays:
- Statistics (total, active, assigned, unassigned)
- Search and filtering
- Grid and table views
- Create new assignee functionality

## Context and State Management

### AssigneesProvider
React context that provides:
- `assignees`: Array of all assignees
- `assigneesLoading`: Loading state
- `refreshAssignees()`: Refresh the assignees list
- `addAssignee()`: Create new assignee
- `updateAssignee()`: Update existing assignee
- `deleteAssignee()`: Delete assignee
- `assignInterview()`: Assign interview to assignee
- `unassignInterview()`: Unassign interview from assignee
- `searchAssignees()`: Search assignees
- `getAssigneesByStatus()`: Filter by status
- `getUnassignedAssignees()`: Get assignees without interviews

## Usage Examples

### Creating an Assignee
```typescript
const { addAssignee } = useAssignees();

const newAssignee = await addAssignee({
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  organization_id: "org-id",
  status: "active"
});
```

### Assigning an Interview
```typescript
const { assignInterview } = useAssignees();

await assignInterview({
  assignee_id: 1,
  interview_id: "interview-uuid",
  assigned_by: "current-user-id",
  notes: "Senior developer interview"
});
```

### Filtering Assignees
```typescript
const { getAssigneesByStatus, searchAssignees } = useAssignees();

// Get active assignees
const activeAssignees = await getAssigneesByStatus("active");

// Search assignees
const searchResults = await searchAssignees("john");
```

## Migration

To apply the database changes, run the migration:

```sql
-- Run the migration file
\i migrations/add_interview_assignee_table.sql
```

## Features

### ✅ Implemented
- [x] Database schema with proper relationships
- [x] CRUD operations for assignees
- [x] Interview assignment/unassignment
- [x] Search and filtering
- [x] Status management
- [x] Frontend components (cards, modals, pages)
- [x] API endpoints with authentication
- [x] React context for state management
- [x] Navigation integration

### 🔄 Future Enhancements
- [ ] Interview selection dropdown in assignment modal
- [ ] Bulk assignment operations
- [ ] Assignment history tracking
- [ ] Email notifications for assignments
- [ ] Assignment scheduling
- [ ] Performance analytics
- [ ] Export functionality

## Security Considerations

- All API endpoints require authentication
- Organization-based data isolation
- Input validation on all endpoints
- Proper error handling and logging
- Rate limiting on API endpoints

## Testing

The system includes comprehensive error handling and validation:
- Email uniqueness validation
- Required field validation
- Organization-based access control
- Interview assignment validation
- Proper error responses

## Troubleshooting

### Common Issues

1. **Email already exists**: Ensure email is unique within the organization
2. **Interview already assigned**: Check if assignee is already assigned to an interview
3. **Organization access**: Verify user has access to the organization
4. **Database constraints**: Check foreign key relationships

### Debug Mode

Enable debug logging by setting the appropriate environment variables and check the browser console for detailed error messages.
