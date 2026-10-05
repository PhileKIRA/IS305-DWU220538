# Campus Service Request Management System

**Course:** IS305 – Object-Oriented Programming, Divine Word University
**Assessment:** AT3 Major Project
**Student:** Philemon Kira — Student ID: DWU220538
**Repository:** https://github.com/PhileKIRA/IS305-DWU220538

## Description

A Node.js console application that records, assigns, processes and monitors campus service requests (ICT Support, Facilities Maintenance, Cleaning and Sanitation, General Campus Service) at Divine Word University. No database is used.

## Achievement Components Attempted

- [x] **Pass** – core service request system *(complete)*
- [x] **Credit** – specialised requests and role workflows *(complete)*
- [x] **Distinction** – polymorphism, JSON storage and reporting *(complete)*

## Features Completed (Pass)

- Register users with validation (missing ID/names, invalid email, duplicate ID rejected)
- Submit service requests in four categories with four priority levels (new requests start as *Submitted*)
- View a request by ID, view my requests, view all requests
- Update my own *Submitted* request (other users are blocked)
- Cancel my own *Submitted* request (other users and double-cancellation are blocked)
- Search requests by request ID or title
- Request summary by status
- Clear error messages; invalid input never crashes the menu

## Features Completed (Credit)

- User inheritance: `StudentRequester`, `StaffRequester`, `ServiceOfficer`, `Technician` extend `User` and call `super()`
- Request inheritance: `ICTSupportRequest`, `MaintenanceRequest`, `CleaningRequest`, `GeneralServiceRequest` extend `ServiceRequest` and call `super(commonRequestData)`
- Specialised fields are validated (e.g. year level 1–5, device type, hazard level, hygiene risk)
- Overridden `getRequestSummary()`, `validateSpecialisedFields()`, `validate()` and `displayInfo()`
- `UserFactory` and `ServiceRequestFactory` create the correct subclass from the console choices
- User type and request category are fixed once an object is created
- Controlled workflow: Submitted → Reviewed → Assigned → In Progress → Resolved → Closed (Cancelled is final); invalid transitions are rejected
- Role permissions: only Service Officers review, set priority, assign Technicians and close; only the assigned Technician begins work, adds progress notes and resolves
- Overridden `calculatePriorityScore()` and `getTargetResolutionHours()` (e.g. campus-wide network outage = 2-hour target)
- Filter by category, status, priority and assigned Technician; sort by date submitted or priority
- Every request keeps a history of approved workflow actions (previous/new status, action, actor ID and role, comment, time)

## Features Completed (Distinction)

- **Abstract-style base class:** `ServiceRequest.calculatePriorityScore()`, `getTargetResolutionHours()` and `getRequestSummary()` throw a clear error unless a subclass implements them
- **Polymorphism:** all request types are stored in one array and processed with the same method calls; each class runs its own version (menu option **15**)
- **JSON persistence** with `fs/promises`: data is loaded on start-up and saved after every change; missing files start as empty arrays; corrupt files stop the program with a clear message instead of overwriting data
- **Repository pattern:** `UserFileRepository`, `ServiceRequestFileRepository`, `RequestHistoryFileRepository`, `AuditFileRepository` (all extend `FileRepository`). The console and the domain classes never read or write files
- **Object restoration:** `ServiceRequestFactory.createFromData()` and `UserFactory.createFromData()` rebuild the correct subclasses from saved data
- **Audit trail:** registrations, request creation, updates, priority changes, assignments, status changes, cancellations, resolutions and closures are recorded, including rejected attempts
- **Nine management reports** using `filter()`, `map()`, `reduce()` and `sort()` (menu option **14**, System Administrator or Service Officer only)
- **47 automated tests** using the built-in Node.js test runner, with temporary folders for all file tests

## Project Folder Structure

```text
AT3_CampusServiceRequestSystem/
├── src/
│   ├── CampusServiceApp.js          # Console menu (input/output only)
│   ├── constants.js                 # Allowed categories, priorities, statuses, user types, options
│   ├── validation.js                # Shared requireText / requireOption checks
│   ├── factories/
│   │   ├── UserFactory.js           # Creates the correct User subclass
│   │   └── ServiceRequestFactory.js # Creates the correct ServiceRequest subclass
│   ├── managers/
│   │   └── ServiceRequestManager.js # Service layer: arrays, workflow, audit, load/save via repositories
│   ├── repositories/
│   │   ├── FileRepository.js        # Base class: reads/writes one JSON file (fs/promises)
│   │   ├── UserFileRepository.js    # data/users.json
│   │   ├── ServiceRequestFileRepository.js  # data/serviceRequests.json
│   │   ├── RequestHistoryFileRepository.js  # data/requestHistory.json
│   │   └── AuditFileRepository.js   # data/auditLog.json
│   ├── services/
│   │   └── ReportService.js         # Management reports (filter/map/reduce/sort)
│   └── models/
│       ├── User.js                  # Base user class (private fields, validation)
│       ├── StudentRequester.js      # + programme, year level
│       ├── StaffRequester.js        # + department
│       ├── ServiceOfficer.js        # + service section
│       ├── Technician.js            # + technical speciality
│       ├── ServiceRequest.js        # Abstract-style base request class (workflow, history)
│       ├── ICTSupportRequest.js     # + device, system, fault type, network impact
│       ├── MaintenanceRequest.js    # + building, room, hazard level, equipment
│       ├── CleaningRequest.js       # + area, hygiene risk, service type, preferred time
│       └── GeneralServiceRequest.js # + service needed
├── data/                            # JSON data files (simulated data only)
├── scripts/
│   └── seedData.js                  # Recreates the simulated sample data (npm run seed)
├── tests/                           # Automated tests (node:test), *.test.js
├── docs/
│   ├── requirements/                # Requirements document
│   ├── uml/                         # Use case, class and sequence diagrams
│   ├── technical-documentation/     # Technical documentation
│   ├── user-guide/                  # User guide
│   ├── test-report/                 # Test report
│   ├── screenshots/                 # Console screenshots
│   └── AI_Use_Declaration.md
├── package.json
└── README.md
```

## Installation

1. Install **Node.js 20 or later** (check with `node -v`).
2. Clone the repository and open the project folder:

```bash
git clone https://github.com/PhileKIRA/IS305-DWU220538.git
cd IS305-DWU220538/AT3_CampusServiceRequestSystem
npm install
```

No third-party packages are used; `npm install` only prepares the project.

## Running the Application

```bash
node src/CampusServiceApp.js
```

or `npm start`.

### Resetting the sample data

```bash
npm run seed
```

This **replaces** the four files in `data/` with simulated DWU users and requests in every status.

## JSON Data Files

| File | Contents |
|---|---|
| `data/users.json` | One record per user: common fields, `userType`, and the specialised fields for that type (e.g. `programme`, `yearLevel`) |
| `data/serviceRequests.json` | One record per request: common fields, `requestType` (class name), `requesterId`, `assignedTechnicianId`, status, dates and the specialised fields |
| `data/requestHistory.json` | One record per history entry, linked to its request by `requestId` and kept in order by `sequence` |
| `data/auditLog.json` | System-level audit entries: `auditId`, actor ID and role, action, request ID, description, time and result |

The files contain **plain data only** — no code, passwords or confidential information. Objects are saved with each class's `toData()` method, because `JSON.stringify()` cannot see JavaScript private (`#`) fields. Users and requests are linked by ID, not copied.

**Request history vs audit log:** the history belongs to one request and shows its life cycle (status changes and progress notes). The audit log is a system-wide record of every important action by any user, including actions that were rejected.

## How Objects Are Restored from Saved Data

JSON files store plain data, not classes or methods. A loaded record such as `{ "requestType": "ICTSupportRequest", ... }` is just an object — it has no `getRequestSummary()`, no workflow rules and no polymorphism. On start-up:

```text
Application starts
      ↓
Repositories read the four JSON files (missing file → empty array)
      ↓
UserFactory.createFromData() rebuilds each user as StudentRequester, Technician, ...
      ↓
ServiceRequestFactory.createFromData() looks at requestType, finds the requester and
Technician objects by ID, attaches the history, and calls the correct subclass constructor
(which validates the data again)
      ↓
The application works with real objects
      ↓
After each change, the manager validates every object and the repositories save the JSON files
```

Records that cannot be restored (for example, a request whose requester no longer exists) are skipped with a warning instead of crashing the program.

## Running the Tests

```bash
npm test
```

The tests cover object construction and validation, duplicate IDs, role permissions, status transitions, specialised behaviour, polymorphism, saving and loading JSON, object restoration, missing/empty/corrupt files, write errors, the audit log and report calculations. Every file test uses its own temporary folder, so `data/` is never changed by the tests.

## Sample User Scenario (Pass)

1. Option **1** – register `DWU2026001`, Mary Kila, `mary.kila@dwu.ac.pg`, Student.
2. Option **2** – as `DWU2026001`, submit "Wi-Fi not working", Library Level 2, ICT Support, High → `REQ001` (Submitted).
3. Option **6** – try to update `REQ001` as another user → *Error: Only the requester can update this request.*
4. Option **6** – update `REQ001` as `DWU2026001` → title changed.
5. Option **8** – search `wi-fi` → `REQ001` found.
6. Option **7** – cancel `REQ001` as `DWU2026001` → status *Cancelled*. Cancelling again → *Error: This request is already cancelled.*
7. Option **9** – summary shows Submitted 0, Cancelled 1.

## Sample User Scenario (Credit workflow)

1. Register a Student (`DWU2026001`), a Service Officer (`OFF001`) and two Technicians (`TECH001`, `TECH002`).
2. As the student, submit an ICT Support request → `REQ001` (Submitted).
3. Option **10** as `DWU2026001` → review → *Error: Only a Service Officer can review requests.*
4. Option **10** as `OFF001` → close → *Error: Invalid status change: Submitted → Closed is not allowed.*
5. Option **10** as `OFF001` → review, set priority to High, assign `TECH001`.
6. Option **11** as `TECH002` → begin work → *Error: Only the assigned Technician can start work on this request.*
7. Option **11** as `TECH001` → begin work, add a progress note, resolve.
8. Option **10** as `OFF001` → verify and close → `REQ001` is Closed.
9. Option **13** → history shows every step with who did it and when.

## Sample User Scenario (Distinction)

1. `npm run seed`, then `npm start` → *Loaded 11 users, 9 requests and 42 audit entries.*
2. Option **15** → every request in one array answers the same three method calls differently.
3. Option **14** as `ADM001` → management reports and the audit log. As `DWU2026001` → *Error: Only a System Administrator or Service Officer can view reports and the audit log.*
4. Option **11** as `TECH001` → begin work on `REQ001`. Exit (option **16**).
5. `npm start` again → option **3** `REQ001` is still *In Progress*, and option **13** shows the full history.

## Known Limitations

- No passwords or login: users identify themselves by user ID (passwords must not be stored in the data files).
- JSON files suit one user at a time; two people running the program at once could overwrite each other's changes.
- The whole file is rewritten on each save, which is fine for hundreds of records but slow for very large data sets.
- No email or SMS notifications.

## Future Improvements

- Login with securely hashed passwords and sessions.
- A web interface using the same manager and model classes.
- A proper database for many simultaneous users (not allowed for this assessment).
- Notifications to requesters when their request changes status.

## Documentation

| Document | Location |
|---|---|
| Requirements document | `docs/requirements/Requirements.md` |
| UML diagrams and class relationships | `docs/uml/` (see `docs/uml/README.md`) |
| Technical documentation | `docs/technical-documentation/TechnicalDocumentation.md` |
| User guide | `docs/user-guide/UserGuide.md` |
| Test report | `docs/test-report/TestReport.md` |
| Console screenshots | `docs/screenshots/` |
| AI Use Declaration | `docs/AI_Use_Declaration.md` |

## AI Use Declaration

AI (Claude, by Anthropic) was used extensively as a development and learning assistant: to analyse the specification, generate the source code, tests and UML diagrams, and draft the documentation, one milestone at a time. I set up the repository, made all commits, ran and checked the application and tests on my own computer, took the screenshots, and studied the code so that I can explain and modify it. I am responsible for the submitted work. The full declaration is in `docs/AI_Use_Declaration.md`.
