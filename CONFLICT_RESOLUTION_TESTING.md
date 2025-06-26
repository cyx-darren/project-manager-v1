# Conflict Resolution Mechanism - Manual Testing Checklist

## Overview
This document provides a comprehensive manual testing checklist for Subtask 9.12: Conflict Resolution Mechanism implementation.

## Prerequisites
- Application running at http://localhost:3000
- Test credentials: darren@easyprintsg.com / Amber12345
- Multiple browser tabs/windows for multi-user simulation

## Test Categories

### 1. Basic Service Functionality Tests

#### 1.1 Service Initialization
- [ ] Navigate to API Tester page
- [ ] Click "Conflict Resolution Demo" button
- [ ] Verify demo component loads without errors
- [ ] Confirm initial statistics show zero operations/conflicts

#### 1.2 Operation Creation
- [ ] Select a test resource (Resource 1, 2, or 3)
- [ ] Choose resource type (task, project, comment)
- [ ] Enter content in the edit field
- [ ] Click "Apply Edit" button
- [ ] Verify operation appears in history
- [ ] Confirm statistics update (operations count increases)

#### 1.3 Version Management
- [ ] Perform multiple edits on same resource
- [ ] Verify version numbers increment correctly
- [ ] Check version vector updates in statistics
- [ ] Confirm resource-specific version tracking

### 2. Conflict Detection Tests

#### 2.1 Concurrent Edit Simulation
- [ ] Select a resource and apply an edit
- [ ] Click "Simulate Conflict" button immediately
- [ ] Verify conflict appears in "Active Conflicts" section
- [ ] Confirm conflict shows both operations with timestamps
- [ ] Check that statistics show conflict count increase

#### 2.2 Version Conflict Detection
- [ ] Apply multiple edits to create version history
- [ ] Use browser dev tools to modify version numbers artificially
- [ ] Attempt edit with outdated version
- [ ] Verify version conflict detection

#### 2.3 Multi-Resource Conflict Isolation
- [ ] Create conflicts on Resource 1
- [ ] Switch to Resource 2 and create different conflicts
- [ ] Verify conflicts are isolated per resource
- [ ] Confirm statistics track conflicts separately

### 3. Conflict Resolution Tests

#### 3.1 Last Write Wins Strategy
- [ ] Create a conflict with "Simulate Conflict"
- [ ] Click "Resolve: Last Write Wins" button
- [ ] Verify newer operation (by timestamp) is kept
- [ ] Confirm older operation is discarded
- [ ] Check that conflict disappears from active list

#### 3.2 Operational Transform Strategy
- [ ] Create insert/insert conflict (same position)
- [ ] Click "Resolve: Operational Transform"
- [ ] Verify both operations are preserved with adjusted positions
- [ ] Confirm content is properly merged
- [ ] Check operation history shows transformed operations

#### 3.3 Merge Strategy
- [ ] Create compatible operations (different positions)
- [ ] Click "Resolve: Merge"
- [ ] Verify both operations are applied
- [ ] Confirm no content duplication
- [ ] Check merged result is coherent

### 4. Operational Transformation Algorithm Tests

#### 4.1 Insert vs Insert Conflicts
- [ ] Create two insert operations at same position
- [ ] Apply OT resolution
- [ ] Verify second insert position is adjusted
- [ ] Confirm both insertions are preserved

#### 4.2 Insert vs Delete Conflicts
- [ ] Create insert operation
- [ ] Create delete operation affecting same area
- [ ] Apply OT resolution
- [ ] Verify position adjustments are correct

#### 4.3 Delete vs Delete Conflicts
- [ ] Create overlapping delete operations
- [ ] Apply OT resolution
- [ ] Verify deletion ranges are properly merged
- [ ] Confirm no duplicate deletions

#### 4.4 Update Conflicts
- [ ] Create concurrent update operations
- [ ] Apply OT resolution
- [ ] Verify content merging logic
- [ ] Check timestamp-based prioritization

### 5. User Interface Tests

#### 5.1 Statistics Display
- [ ] Verify real-time statistics updates
- [ ] Check all counters (operations, conflicts, pending, versions)
- [ ] Confirm color coding (green for normal, red for conflicts)
- [ ] Test statistics accuracy across operations

#### 5.2 Operations History
- [ ] Verify chronological operation display
- [ ] Check user attribution (User A, User B)
- [ ] Confirm timestamp formatting
- [ ] Test operation type display (insert, delete, update, move)

#### 5.3 Activity Log
- [ ] Verify terminal-style log updates
- [ ] Check log entry formatting
- [ ] Confirm operation details in logs
- [ ] Test log scrolling and readability

#### 5.4 Error Handling Display
- [ ] Trigger service errors (invalid operations)
- [ ] Verify error messages appear
- [ ] Check error formatting and clarity
- [ ] Confirm errors don't crash interface

### 6. Integration Tests

#### 6.1 Real-time Service Integration
- [ ] Verify conflict resolution works with real-time updates
- [ ] Test cross-component communication
- [ ] Check service state consistency

#### 6.2 Task/Project Integration
- [ ] Test conflict resolution on actual tasks
- [ ] Verify project conflict handling
- [ ] Check database integration (where tables exist)

#### 6.3 Multiple User Simulation
- [ ] Open multiple browser tabs
- [ ] Login as different users (if possible)
- [ ] Create simultaneous edits
- [ ] Verify conflict detection across sessions

### 7. Performance Tests

#### 7.1 Large Operation History
- [ ] Create 50+ operations on single resource
- [ ] Verify performance remains responsive
- [ ] Check memory usage in dev tools
- [ ] Confirm UI doesn't lag

#### 7.2 Multiple Concurrent Conflicts
- [ ] Create 10+ simultaneous conflicts
- [ ] Verify resolution performance
- [ ] Check UI responsiveness
- [ ] Confirm statistics accuracy

#### 7.3 Cleanup Operations
- [ ] Use "Clear Conflicts" button
- [ ] Use "Clear Operations" button
- [ ] Verify complete state reset
- [ ] Check memory cleanup

### 8. Edge Cases and Error Scenarios

#### 8.1 Invalid Operations
- [ ] Attempt operations with invalid positions
- [ ] Test operations with empty content
- [ ] Try operations on non-existent resources
- [ ] Verify graceful error handling

#### 8.2 Network Simulation
- [ ] Simulate network delays (dev tools)
- [ ] Test offline/online scenarios
- [ ] Verify operation queuing
- [ ] Check reconnection handling

#### 8.3 Boundary Conditions
- [ ] Test operations at content boundaries
- [ ] Try maximum content length operations
- [ ] Test minimum operation sizes
- [ ] Verify position boundary handling

## Success Criteria

### Must Pass
- [ ] All basic service functionality works
- [ ] Conflict detection accurately identifies conflicts
- [ ] All resolution strategies work correctly
- [ ] OT algorithms properly transform operations
- [ ] UI displays all information correctly
- [ ] No JavaScript errors in console
- [ ] Statistics remain accurate throughout testing

### Should Pass
- [ ] Performance remains good with large datasets
- [ ] Error handling is graceful and informative
- [ ] Integration with existing systems works
- [ ] Multi-user scenarios work correctly

### Nice to Have
- [ ] Advanced OT scenarios work perfectly
- [ ] Complex conflict chains resolve correctly
- [ ] UI provides excellent user experience
- [ ] System handles edge cases elegantly

## Test Results Documentation

### Environment
- Date: ___________
- Browser: ___________
- Application Version: ___________
- Tester: ___________

### Results Summary
- Total Tests: ___________
- Passed: ___________
- Failed: ___________
- Skipped: ___________

### Failed Tests
| Test Case | Expected | Actual | Notes |
|-----------|----------|--------|-------|
|           |          |        |       |

### Additional Notes
_Document any observations, performance issues, or recommendations here._

## Recommendations for Playwright Testing

Based on manual testing results, focus automated testing on:
1. Core conflict detection and resolution flows
2. OT algorithm correctness
3. UI state management
4. Error handling scenarios
5. Performance under load

---

**Next Steps**: Complete manual testing, document results, then proceed with Playwright automated testing. 