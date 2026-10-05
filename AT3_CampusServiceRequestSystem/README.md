# Campus Service Request Management System

**Course:** IS305 – Object-Oriented Programming, Divine Word University
**Assessment:** AT3 Major Project
**Student:** Philemon Kira — Student ID: DWU220538
**Repository:** https://github.com/PhileKIRA/IS305-DWU220538

## Description

A Node.js console application that records, assigns, processes and monitors campus service requests (ICT Support, Facilities Maintenance, Cleaning and Sanitation, General Campus Service) at Divine Word University. No database is used.

## Achievement Components Attempted

- [x] **Pass** – core service request system *(complete)*
- [ ] **Credit** – specialised requests and role workflows
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

## Project Folder Structure

```text
AT3_CampusServiceRequestSystem/
├── src/
│   ├── CampusServiceApp.js          # Console menu (input/output only)
│   ├── constants.js                 # Allowed categories, priorities, statuses, user types
│   ├── managers/
│   │   └── ServiceRequestManager.js # Stores users and requests in arrays; search and summaries
│   └── models/
│       ├── User.js                  # User class (private fields, validation)
│       └── ServiceRequest.js        # ServiceRequest class (private fields, update/cancel rules)
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

## Known Limitations (current stage)

- Data is kept in memory only and is lost when the program closes (JSON storage is added in the Distinction stage).
- No passwords: users identify themselves by user ID.

## AI Use Declaration

_(To be completed honestly before submission.)_
