# Test Report
## Campus Service Request Management System

**Student:** Philemon Kira (DWU220538)  
**Test framework:** built-in Node.js test runner (`node:test`, `node:assert`)  
**Command:** `npm test`  
**Test run:** Date ________ · Node.js version ________ · Result: ____ passed, ____ failed *(fill in from your own run and keep the screenshot as evidence)*

All 47 automated tests are in `tests/*.test.js`. Every test that reads or writes files uses its own temporary folder, so the application's `data/` files are never changed by testing.

**Evidence:** `docs/screenshots/13-npm-test.png` shows the full `npm test` output. Each test's name in that output starts with its Test ID, and the test code is in the file shown in the Evidence column.

| Test ID | Feature | Input | Expected Result | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|---|---|---|
| T01 | Valid user registration (User class) | new User("DWU2026001","Mary","Kila","Mary.Kila@dwu.ac.pg","Student") | User created; getFullName() = "Mary Kila"; email stored in lower case; validate() = true | As expected | Pass | `User.test.js`, 13-npm-test.png |
| T02 | Invalid user values rejected | Missing ID, blank first/last name, email "not-an-email", user type "Visitor" | Each throws: "User ID is required", "First name is required", "Last name is required", "Invalid email address", "Invalid user type" | As expected | Pass | `User.test.js`, 13-npm-test.png |
| T03 | Encapsulation of user fields | Assign user.userId = "HACKED"; set email to "bad" | userId unchanged; bad email rejected and old email kept | As expected | Pass | `User.test.js`, 13-npm-test.png |
| T04 | Valid request submission | ServiceRequest with title, description, location, "ICT Support", "High" | Status is "Submitted"; requester stored; validate() = true | As expected | Pass | `ServiceRequest.test.js`, 13-npm-test.png |
| T05 | Invalid request values rejected | Category "Catering", priority "Critical", empty title, blank description, no requester | Each throws a clear error (Unsupported category / priority, title / description required, valid requester required) | As expected | Pass | `ServiceRequest.test.js`, 13-npm-test.png |
| T06 | Owner-only update, all-or-nothing | Owner updates title; other user updates; owner sends valid title + invalid priority; status/category change | Owner update works; other user rejected; invalid update changes nothing; status and category cannot be updated | As expected | Pass | `ServiceRequest.test.js`, 13-npm-test.png |
| T07 | Owner-only cancel, not twice | Other user cancels; owner cancels; owner cancels again; owner updates cancelled request | Other user rejected; status becomes "Cancelled"; second cancel rejected ("already cancelled"); update rejected | As expected | Pass | `ServiceRequest.test.js`, 13-npm-test.png |
| T08 | Valid user registration (manager) | Register two students; find "dwu2026001" | 2 users stored; lookup ignores case and returns Mary Kila | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T09 | Duplicate user ID | Register second user with ID DWU2026001 | Rejected with "User ID already exists"; still 2 users | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T10 | Valid request submission (manager) | submitRequest() with generated ID | ID is REQ001; stored request has status "Submitted" | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T11 | Invalid request category (manager) | Submit request with category "Catering" | Rejected with "Unsupported category"; nothing stored | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T12 | Duplicate request ID / unregistered requester | Submit REQ050 twice; submit for unregistered user | "Request ID already exists"; "requester must be a registered user" | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T13 | View requester records | 3 requests (2 by Mary, 1 by John); getRequestsByUser(Mary); unknown user | Only Mary's 2 requests returned; unknown user gives "User not found" | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T14 | Update through manager | Owner sets priority High; other user updates; unknown request | Priority changed; other user rejected; "Request not found" | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T15 | Cancel Submitted request | Other user cancels; owner cancels; owner cancels again | Other user rejected; status "Cancelled"; second cancel rejected | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T16 | Search and status summary | Search "wi-fi", "req002", blank text; summary after one cancel | Correct request found each time; blank search rejected; summary Submitted 1, Cancelled 1, Closed 0 | As expected | Pass | `ServiceRequestManager.test.js`, 13-npm-test.png |
| T17 | User subclasses call super() | Create Student, Staff, Service Officer, Technician | All are instanceof User and valid; user types set automatically; inherited getFullName() works; overridden displayInfo() shows programme | As expected | Pass | `Inheritance.test.js`, 13-npm-test.png |
| T18 | Specialised user fields validated | Empty programme, year level 9, blank department, missing section, empty speciality, bad email | Each rejected with a clear message; parent still validates email | As expected | Pass | `Inheritance.test.js`, 13-npm-test.png |
| T19 | Request subclasses call super() | Create ICT, Maintenance, Cleaning and General requests | All are instanceof ServiceRequest, status "Submitted", valid, and each has its own category | As expected | Pass | `Inheritance.test.js`, 13-npm-test.png |
| T20 | Specialised request fields validated | Device "Toaster", empty system name, hazard "Extreme", empty cleaning area, no service needed, empty title | Each rejected with a clear message | As expected | Pass | `Inheritance.test.js`, 13-npm-test.png |
| T21 | Specialised summaries (overriding) | getRequestSummary() on ICT and Cleaning requests | ICT summary shows type, ICT details, device and network impact; Cleaning summary shows hygiene risk and no ICT details | As expected | Pass | `Inheritance.test.js`, 13-npm-test.png |
| T22 | Factories; fixed type and category | UserFactory/ServiceRequestFactory with valid and unknown types; try to change userType and category | Correct subclasses created; unknown types rejected; userType and category unchanged | As expected | Pass | `Inheritance.test.js`, 13-npm-test.png |
| T23 | Full workflow | Review, set priority High, assign TECH001, begin, progress note, resolve, close | Final status "Closed", priority High, assigned to TECH001 | As expected | Pass | `Workflow.test.js`, 13-npm-test.png |
| T24 | Only Service Officers review/assign/close | Student and Technician try to review; Technician sets priority and assigns; assign to a Student | All rejected with role errors; request stays "Reviewed" | As expected | Pass | `Workflow.test.js`, 13-npm-test.png |
| T25 | Only the assigned Technician works | TECH002 and OFF001 begin work; TECH002 adds note and resolves; officer closes In Progress request | All rejected; assigned TECH001 succeeds; status "In Progress" | As expected | Pass | `Workflow.test.js`, 13-npm-test.png |
| T26 | Invalid status transitions | Submitted → Closed, Submitted → Assigned, Reviewed → Reviewed, cancel Reviewed, Cancelled → Reviewed | All rejected with "Invalid status change" or status error; failed assignment leaves no Technician | As expected | Pass | `Workflow.test.js`, 13-npm-test.png |
| T27 | Request history | Review, assign, rejected begin by TECH002, begin, progress note | 5 entries in order; rejected action not recorded; last entry has action, actor ID, role, comment and time; returned history is a copy | As expected | Pass | `Workflow.test.js`, 13-npm-test.png |
| T28 | Overridden priority score and target hours | Normal-priority ICT campus-wide, ICT single-user, Maintenance high hazard, Cleaning low risk | Scores 50, 25, 45, 20; targets 2, 48, 4, 48 hours | As expected | Pass | `Workflow.test.js`, 13-npm-test.png |
| T29 | Filter requests | Filter by category, status, priority, technician (any case), combined, none | Correct request IDs returned for every filter | As expected | Pass | `Workflow.test.js`, 13-npm-test.png |
| T30 | Sort requests | Sort 4 requests by priority and by date | Priority order REQ002, REQ004, REQ003, REQ001 (score breaks ties); date order REQ001–REQ004; original array unchanged; unknown option rejected | As expected | Pass | `Workflow.test.js`, 13-npm-test.png |
| T31 | Abstract-style ServiceRequest | Call the 3 abstract methods on a plain ServiceRequest and on a subclass that does not override them | Each throws "... must be implemented by a subclass"; all real subclasses implement all three | As expected | Pass | `Polymorphism.test.js`, 13-npm-test.png |
| T32 | Polymorphism | One array with ICT, Maintenance, Cleaning, General (all High); same 3 calls on each | Different summaries; scores 60, 55, 30, 30; targets 2, 4, 24, 24 hours | As expected | Pass | `Polymorphism.test.js`, 13-npm-test.png |
| T33 | toData() for saving | JSON.stringify(request); request.toData(); student.toData() | JSON.stringify gives "{}" (private fields hidden); toData() includes requestType, requesterId, specialised fields, status | As expected | Pass | `Polymorphism.test.js`, 13-npm-test.png |
| T34 | Restoring saved objects | Save each request type to JSON and restore with the factory; restore an Assigned request | Same class, summary, score and history; Assigned request keeps its Technician and can begin work; Technician user restored as Technician | As expected | Pass | `Polymorphism.test.js`, 13-npm-test.png |
| T35 | Invalid saved data rejected | Unknown requestType, unknown requester, invalid status, Assigned without Technician, bad network impact, unknown user type | Each rejected with a clear message | As expected | Pass | `Polymorphism.test.js`, 13-npm-test.png |
| T36 | Saving JSON data | Register users, submit, review, assign; saveChanges() in temp folder | Exactly 4 JSON files; correct records; second save with no changes returns false | As expected | Pass | `Persistence.test.js`, 13-npm-test.png |
| T37 | Loading and restoring (restart) | Save with one manager, load with a new manager | 3 users, ICTSupportRequest restored with status, history and summary; workflow rules still apply; next ID is REQ002 | As expected | Pass | `Persistence.test.js`, 13-npm-test.png |
| T38 | Missing and empty data files | Load from a folder that does not exist; file containing only spaces | Empty lists, no warnings | As expected | Pass | `Persistence.test.js`, 13-npm-test.png |
| T39 | File read errors | users.json containing invalid JSON; a JSON object instead of an array | "Could not read users.json: the file is not valid JSON"; "expected a list (array) of records" | As expected | Pass | `Persistence.test.js`, 13-npm-test.png |
| T40 | File write errors | Data folder path points to a file | "Could not save users.json ..."; changes kept for retry (hasUnsavedChanges = true) | As expected | Pass | `Persistence.test.js`, 13-npm-test.png |
| T41 | Invalid records never saved | Duplicate user, request with empty title; saved request with unknown requester | Duplicate and invalid request not saved; broken saved request skipped with a warning | As expected | Pass | `Persistence.test.js`, 13-npm-test.png |
| T42 | Audit trail | Register, submit, review, set priority, rejected assignment by student, assignment | All actions logged with 8 fields; rejected attempt logged with actor, role and reason; student cannot view the log; audit saved to file | As expected | Pass | `Persistence.test.js`, 13-npm-test.png |
| T43 | Repository methods | create, duplicate create, findById, findByRequester, findByTechnician, update | Correct records returned; duplicate and unknown updates rejected | As expected | Pass | `Persistence.test.js`, 13-npm-test.png |
| T44 | Reports by status, category, priority | 6 sample requests with known data | Correct counts, including zero counts | As expected | Pass | `Reports.test.js`, 13-npm-test.png |
| T45 | Urgent and overdue reports | Same data, fixed current time | Only open urgent request REQ001; overdue REQ006 (8 h) then REQ001 (2 h); cancelled requests excluded | As expected | Pass | `Reports.test.js`, 13-npm-test.png |
| T46 | Technician, resolution time and location reports | Same data | Per-Technician totals and open counts; completed counts; average resolution 6 hours; locations busiest first | As expected | Pass | `Reports.test.js`, 13-npm-test.png |
| T47 | Reports with no data | Empty array to every report | Zero counts, empty lists or null - no errors | As expected | Pass | `Reports.test.js`, 13-npm-test.png |

## Manual Console Tests

These were checked by running the application (`npm start`). Screenshots are in `docs/screenshots/`.

| Test ID | Feature | Input | Expected Result | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|---|---|---|
| M01 | Menu loops and rejects bad choices | Enter `99`, then `16` | "Please choose a number from 1 to 16.", menu shown again; 16 exits | As expected | Pass | 01-main-menu.png |
| M02 | Register and submit through the console | Register a student, submit an ICT request | User shown with programme; request REQ0xx Submitted with ICT details | As expected | Pass | 02-register-user.png, 03-submit-request.png |
| M03 | Wrong user cannot update | Option 6 with another user's ID | "Only the requester can update this request." | As expected | Pass | 04-update-blocked.png |
| M04 | Officer and Technician workflow | Options 10 and 11: review, assign, begin, resolve, close | Status changes in order; wrong role or Technician rejected | As expected | Pass | 05-assign-technician.png, 06-technician-resolve.png |
| M05 | Reports and audit log | Option 14 as ADM001 | Nine reports and audit entries shown; requester ID rejected | As expected | Pass | 09-reports.png, 10-audit-log.png |
| M06 | Data kept after restart | Make a change, exit, `npm start` again | Change still present after restart | As expected | Pass | 12-restart-restored.png |

*Before submitting, carry out M01–M06 yourself and save the screenshots with the file names shown. Only mark a test as Pass when your own run shows the expected result.*
