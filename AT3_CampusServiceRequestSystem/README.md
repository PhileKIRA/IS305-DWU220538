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
- [ ] **Distinction** – polymorphism, JSON storage and reporting

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
│   │   └── ServiceRequestManager.js # Stores users and requests in arrays; search and summaries
│   └── models/
│       ├── User.js                  # Base user class (private fields, validation)
│       ├── StudentRequester.js      # + programme, year level
│       ├── StaffRequester.js        # + department
│       ├── ServiceOfficer.js        # + service section
│       ├── Technician.js            # + technical speciality
│       ├── ServiceRequest.js        # Base request class (private fields, update/cancel rules)
│       ├── ICTSupportRequest.js     # + device, system, fault type, network impact
│       ├── MaintenanceRequest.js    # + building, room, hazard level, equipment
│       ├── CleaningRequest.js       # + area, hygiene risk, service type, preferred time
│       └── GeneralServiceRequest.js # + service needed
├── tests/                           # Automated tests (node:test)
├── docs/
│   ├── requirements/                # Requirements document
│   └── uml/                         # Use case, class and sequence diagrams
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

## Running the Tests

```bash
npm test
```

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

## Known Limitations (current stage)

- Data is kept in memory only and is lost when the program closes (JSON storage is added in the Distinction stage).
- No passwords: users identify themselves by user ID.

## AI Use Declaration

_(To be completed honestly before submission.)_
