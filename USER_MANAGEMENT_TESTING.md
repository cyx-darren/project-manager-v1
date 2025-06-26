# User Management UI Components - Manual Testing Checklist

## Overview
This document provides a comprehensive manual testing checklist for Subtask 9.13: "Create UI components for user management" implementation.

## Prerequisites
- Application running at http://localhost:5173
- Test credentials: darren@easyprintsg.com / Amber12345
- Access to Admin > API Test page
- Multiple browser tabs/windows for multi-user simulation

## Test Categories

### 1. Demo Component Access and Navigation

#### 1.1 Demo Component Loading
- [ ] Navigate to Admin > API Test page
- [ ] Locate "Show User Management Demo" button (violet colored)
- [ ] Click button to show the demo component
- [ ] Verify demo component loads without errors
- [ ] Confirm header shows "User Management Demo" with Users icon

#### 1.2 Tab Navigation
- [ ] Verify 4 tabs are visible: User Directory, Invitations, Invite Users, Role Management
- [ ] Click each tab and verify content switches correctly
- [ ] Confirm active tab has blue highlighting and proper visual state
- [ ] Verify tab icons display correctly (Users, Mail, UserPlus, Shield)

#### 1.3 Context and Role Controls
- [ ] Test Context Selector dropdown (Demo Workspace, Demo Project Alpha, Demo Project Beta)
- [ ] Switch between workspace and project contexts
- [ ] Verify context type is reflected in UI labels
- [ ] Test Role Selector (Member, Admin, Owner)
- [ ] Verify permissions change based on selected role

### 2. User Directory Tab Testing

#### 2.1 Basic Directory Functionality
- [ ] Navigate to User Directory tab
- [ ] Verify user list loads (may be empty for demo contexts)
- [ ] Test search functionality with email/name filters
- [ ] Test role filter dropdown (All Roles, Owner, Admin, Member)
- [ ] Test status filter dropdown (All Status, Active, Invited, Inactive)
- [ ] Verify member count display updates with filters

#### 2.2 User Display and Information
- [ ] Verify user avatars display correctly (or initials fallback)
- [ ] Check user name/email display formatting
- [ ] Verify role badges show with correct colors (yellow=owner, blue=admin, gray=member)
- [ ] Check status badges display appropriately
- [ ] Verify "Joined" date formatting

#### 2.3 Permission-Based Actions
- [ ] Set role to "Member" and verify no "Invite Member" button
- [ ] Set role to "Admin" and verify "Invite Member" button appears
- [ ] Set role to "Owner" and verify all management options available
- [ ] Test user menu (three dots) functionality

### 3. Invitations Tab Testing

#### 3.1 Invitation List Display
- [ ] Navigate to Invitations tab
- [ ] Verify invitation list loads (may be empty initially)
- [ ] Check pending invitation count in header
- [ ] Test refresh button functionality
- [ ] Verify empty state message when no invitations

#### 3.2 Invitation Details
- [ ] For any displayed invitations, verify:
  - [ ] Email address display
  - [ ] Role information (Member, Admin, Owner)
  - [ ] Status badges (Pending, Accepted, Expired, Revoked)
  - [ ] Sent date formatting
  - [ ] Time remaining for pending invitations
  - [ ] Inviter information display

#### 3.3 Invitation Management Actions
- [ ] Test "Resend" button for pending invitations (Admin/Owner only)
- [ ] Test "Revoke" button for pending invitations (Admin/Owner only)
- [ ] Verify confirmation dialog for revoke action
- [ ] Check permission restrictions for Member role
- [ ] Test processing states (buttons disabled during operations)

### 4. Invite Users Tab Testing

#### 4.1 Invitation Form Access
- [ ] Navigate to Invite Users tab
- [ ] With Member role: verify "Permission Required" message
- [ ] With Admin role: verify invitation form displays
- [ ] With Owner role: verify all role options available

#### 4.2 Form Functionality
- [ ] Test email input validation (required, format checking)
- [ ] Test role selection dropdown options
- [ ] Verify role descriptions display correctly
- [ ] Test optional message textarea
- [ ] Verify form submission with valid data
- [ ] Test form validation with invalid email

#### 4.3 Role-Based Form Behavior
- [ ] As Admin: verify Owner role not available in dropdown
- [ ] As Owner: verify all roles (Member, Admin, Owner) available
- [ ] Test role permission descriptions accuracy
- [ ] Verify appropriate role defaults

#### 4.4 Form Submission and Feedback
- [ ] Submit valid invitation and verify success message
- [ ] Test error handling for duplicate invitations
- [ ] Verify form reset after successful submission
- [ ] Test cancel functionality if provided
- [ ] Check automatic redirect to Invitations tab after success

### 5. Role Management Tab Testing

#### 5.1 Role Manager Access
- [ ] Navigate to Role Management tab
- [ ] With Member role: verify "Permission Required" message
- [ ] With Admin role: verify role manager component loads
- [ ] With Owner role: verify full role management access

#### 5.2 User Role Information Display
- [ ] Verify current user information loads correctly
- [ ] Check avatar/initial display
- [ ] Verify current role badge display
- [ ] Check permissions list display
- [ ] Verify member since date

#### 5.3 Role Modification
- [ ] Test role change dropdown functionality
- [ ] Verify role change confirmation dialog
- [ ] Test role update process
- [ ] Verify success feedback after role change
- [ ] Check permission restrictions (can't modify own role, etc.)

### 6. Cross-Component Integration Testing

#### 6.1 Context Switching
- [ ] Switch from workspace to project context
- [ ] Verify all components update appropriately
- [ ] Test data isolation between contexts
- [ ] Verify UI labels update (Workspace Members vs Project Members)

#### 6.2 Permission Flow Testing
- [ ] Start as Member, verify limited access across all tabs
- [ ] Switch to Admin, verify expanded permissions
- [ ] Switch to Owner, verify full access
- [ ] Test permission indicators in header section

#### 6.3 Data Consistency
- [ ] Send invitation in Invite tab
- [ ] Switch to Invitations tab and verify it appears
- [ ] Test role changes reflect across components
- [ ] Verify refresh functionality maintains state

### 7. UI/UX Testing

#### 7.1 Visual Design
- [ ] Verify consistent color scheme across components
- [ ] Check proper spacing and layout
- [ ] Test responsive design on different screen sizes
- [ ] Verify icon consistency and clarity
- [ ] Check loading states and animations

#### 7.2 Accessibility
- [ ] Test keyboard navigation through forms
- [ ] Verify screen reader compatibility with labels
- [ ] Check color contrast for text readability
- [ ] Test focus indicators on interactive elements

#### 7.3 Error Handling
- [ ] Test network error scenarios
- [ ] Verify appropriate error messages display
- [ ] Test graceful degradation when services fail
- [ ] Check error message clarity and helpfulness

### 8. Performance Testing

#### 8.1 Loading Performance
- [ ] Measure initial component load time
- [ ] Test tab switching responsiveness
- [ ] Verify search/filter responsiveness
- [ ] Check large data set handling (if available)

#### 8.2 Memory Usage
- [ ] Monitor for memory leaks during extended use
- [ ] Test component cleanup when switching contexts
- [ ] Verify proper event listener cleanup

### 9. Browser Compatibility

#### 9.1 Cross-Browser Testing
- [ ] Test in Chrome (primary)
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Verify consistent behavior across browsers

### 10. Integration with Existing System

#### 10.1 Authentication Integration
- [ ] Verify proper user authentication handling
- [ ] Test behavior with expired sessions
- [ ] Check permission synchronization with backend

#### 10.2 Service Integration
- [ ] Test workspace service integration
- [ ] Test team service integration
- [ ] Test collaboration service integration
- [ ] Verify proper error handling for service failures

## Success Criteria

### Functional Requirements
- [ ] All 4 main components (Directory, Invitations, Invite, Roles) function correctly
- [ ] Permission-based access control works properly
- [ ] Context switching (workspace/project) functions correctly
- [ ] Form validation and submission work as expected
- [ ] Role management operates with proper restrictions

### User Experience Requirements
- [ ] Intuitive navigation between components
- [ ] Clear visual feedback for all actions
- [ ] Appropriate error messages and guidance
- [ ] Responsive design works on various screen sizes
- [ ] Consistent visual design throughout

### Technical Requirements
- [ ] No console errors during normal operation
- [ ] Proper TypeScript type safety
- [ ] Efficient re-rendering and state management
- [ ] Proper cleanup of resources and event listeners

## Notes
- Demo contexts may not have real user data - this is expected
- Some functionality may be limited due to demo/mock data
- Focus on UI behavior and component interaction rather than actual data manipulation
- Report any TypeScript errors or console warnings encountered 