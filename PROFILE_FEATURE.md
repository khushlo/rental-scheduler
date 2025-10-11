# Profile Management Feature

## Overview

A comprehensive profile management system has been implemented with a profile button in the top-right corner of the navigation bar. This feature allows tenants to manage their account information, credentials, and view store details.

## Features Implemented

### 🔹 **Profile Button**
- Located in the top-right corner of the navigation
- Shows user avatar with initials
- Available on both desktop and mobile views
- Integrated seamlessly with existing theme toggle

### 🔹 **Profile Drawer/Sheet**
- Sliding drawer interface using shadcn Sheet component
- Clean, modern design with proper spacing and typography
- Responsive design that works on all screen sizes
- Smooth animations and transitions

### 🔹 **Database Schema Updates**
- Added `username` and `password` fields to the Tenant model
- Both fields are nullable (optional)
- Secure password hashing using bcryptjs

### 🔹 **Profile Information Management**
- **Basic Information Section:**
  - Display Name (editable)
  - Subdomain (read-only)
  - Store Email (read-only with link to store settings)

- **Credentials Section:**
  - Username (optional, must be unique)
  - Password (optional, minimum 6 characters)
  - Password confirmation
  - Toggle to show/hide password fields

## Database Schema Changes

```sql
-- Added to Tenant table
username    String?  -- Optional username for login
password    String?  -- Hashed password for authentication
```

## API Endpoints

### Get Profile Information
```http
GET /api/tenant/profile?tenantId=1
```

**Response:**
```json
{
  "id": 1,
  "name": "Adiman Art",
  "subdomain": "default",
  "username": "admin",
  "storeEmail": "info@adimanart.com",
  "storeName": "Adiman Art",
  "createdAt": "2024-10-11T...",
  "updatedAt": "2024-10-11T..."
}
```

### Update Profile Information
```http
PUT /api/tenant/profile
Content-Type: application/json

{
  "tenantId": 1,
  "name": "Updated Name",
  "username": "newusername",
  "password": "newpassword123"
}
```

## Security Features

### 🔐 **Password Security**
- Passwords are hashed using bcryptjs with salt rounds = 12
- Passwords are never returned in API responses
- Minimum password length requirement (6 characters)
- Password confirmation validation

### 🔐 **Username Validation**
- Unique username constraint across all tenants
- Minimum length requirement (3 characters)
- Optional field - can be left empty

### 🔐 **Input Validation**
- Server-side validation for all fields
- Client-side validation with real-time feedback
- Proper error handling and user feedback

## UI/UX Features

### 📱 **Responsive Design**
- Works perfectly on desktop, tablet, and mobile
- Adaptive drawer width for different screen sizes
- Touch-friendly controls for mobile users

### 🎨 **Design Elements**
- Consistent with existing application theme
- Proper icons using Lucide React
- Loading states and success/error messages
- Smooth animations and transitions

### 🔄 **User Experience**
- Auto-close drawer after successful save
- Clear validation messages
- Separate sections for different types of information
- Optional field handling with clear indicators

## Component Structure

```
src/components/profile/
├── profile-drawer.tsx          # Main profile drawer component

src/app/api/tenant/profile/
├── route.ts                    # API endpoints for profile operations
```

## Usage Examples

### Opening Profile Settings
```tsx
// The profile button is automatically available in the navigation
// Users can click the avatar button to open the profile drawer
```

### Updating Profile Information
```tsx
// Example API call from the frontend
const updateProfile = async (data) => {
  const response = await fetch('/api/tenant/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: 1,
      name: "New Display Name",
      username: "newuser",
      password: "securepass123"
    })
  });
  
  return response.json();
};
```

## Validation Rules

### ✅ **Name Field**
- Required field
- Minimum 1 character after trimming
- No special validation rules

### ✅ **Username Field**
- Optional field
- Minimum 3 characters if provided
- Must be unique across all tenants
- Case-sensitive

### ✅ **Password Field**
- Optional field
- Minimum 6 characters if provided
- Must match confirmation password
- Automatically hashed before storage

## Error Handling

### Client-Side Errors
- Form validation with real-time feedback
- Password mismatch detection
- Required field validation
- Network error handling

### Server-Side Errors
- Username uniqueness validation
- Database constraint validation
- Proper HTTP status codes
- Detailed error messages

## Future Enhancements

### 🚀 **Potential Improvements**
1. **Profile Picture Upload**: Add avatar image upload functionality
2. **Two-Factor Authentication**: Implement 2FA for enhanced security
3. **Password Strength Meter**: Visual password strength indicator
4. **Login History**: Track and display recent login attempts
5. **Account Recovery**: Password reset functionality
6. **Role Management**: Different user roles and permissions
7. **Session Management**: Active session tracking and management

### 🔧 **Technical Improvements**
1. **Password Policies**: Configurable password complexity rules
2. **Rate Limiting**: Prevent brute force attacks
3. **Audit Logging**: Track profile changes for security
4. **Email Verification**: Verify email addresses on change
5. **OAuth Integration**: Social login options

## Installation Requirements

The following packages were added to support this feature:

```bash
npm install bcryptjs @types/bcryptjs
npx shadcn@latest add sheet input label avatar
```

## Migration Notes

- The database schema changes are applied safely using `npx prisma db push`
- Existing data is preserved - new fields are nullable
- No breaking changes to existing functionality
- Backward compatible with current tenant system

## Testing

### Manual Testing Checklist
- [ ] Profile button appears in navigation
- [ ] Drawer opens and closes smoothly
- [ ] Form validation works correctly
- [ ] Password hashing works properly
- [ ] Username uniqueness validation
- [ ] Responsive design on mobile
- [ ] Success/error messages display correctly
- [ ] Data persists after page refresh

### API Testing
```bash
# Test profile fetch
curl -X GET "http://localhost:3000/api/tenant/profile?tenantId=1"

# Test profile update
curl -X PUT "http://localhost:3000/api/tenant/profile" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":1,"name":"Test User","username":"testuser","password":"testpass123"}'
```

This profile management feature provides a solid foundation for user account management while maintaining security best practices and a great user experience.