# Technical Documentation
## Campus Service Request Management System

**Course:** IS305 – Object-Oriented Programming, Divine Word University
**Student:** Philemon Kira (DWU220538)
**Technology:** JavaScript, Node.js 20+ (CommonJS modules), built-in modules only (`fs/promises`, `path`, `readline`, `node:test`)

---

## 1. Architecture Overview

The application is one Node.js console program, organised in layers. Each layer only talks to the layer below it.

```text
CampusServiceApp (console)        – shows menus, reads input, prints results
        ↓
ServiceRequestManager (service)   – arrays of objects, look-ups, audit log, load/save
        ↓                ↘
Domain objects (models)    Factories  – create/restore the correct subclass
        ↓
Repositories               – the ONLY code that reads/writes files (fs/promises)
        ↓
data/*.json                – plain JSON data
```

The application was built progressively. The Pass system (Weeks 8–10) was extended by the Credit features (Weeks 11–12) and then the Distinction features (Week 13), without replacing earlier work. The Git history shows each stage.

## 2. Project Folder Structure

```text
AT3_CampusServiceRequestSystem/
├── src/
│   ├── CampusServiceApp.js        Console user interface and program entry point
│   ├── constants.js               Allowed values: categories, priorities, statuses, transitions, options
│   ├── validation.js              requireText() and requireOption() helpers
│   ├── models/                    Domain classes (users and requests)
│   ├── managers/                  ServiceRequestManager (service layer)
│   ├── factories/                 UserFactory, ServiceRequestFactory
│   ├── repositories/              FileRepository + four JSON repositories
│   └── services/                  ReportService (management reports)
├── data/                          users.json, serviceRequests.json, requestHistory.json, auditLog.json
├── scripts/seedData.js            Recreates the simulated sample data (npm run seed)
├── tests/                         Automated tests (*.test.js) and helpers.js
├── docs/                          Requirements, UML, technical documentation, user guide, test report, screenshots
├── package.json                   npm scripts: start, test, seed
└── README.md
```

## 3. Responsibility of Each Class

| Class | File | Responsibility |
|---|---|---|
| `CampusServiceApp` | `src/CampusServiceApp.js` | Console menus and prompts only. Calls the manager and prints results. Contains no business rules and no file access. |
| `ServiceRequestManager` | `src/managers/` | Holds users and requests in arrays. Finds records, checks duplicate IDs, runs workflow actions by ID, searches, filters, sorts, records audit entries, and loads/saves through the repositories. |
| `User` | `src/models/User.js` | Base user: ID, names, email, user type, validation, `getFullName()`, `displayInfo()`, `toData()`. Also used directly for System Administrators. |
| `StudentRequester` | `src/models/` | A student requester. Adds programme and year level (1–5). |
| `StaffRequester` | `src/models/` | A staff requester. Adds department. |
| `ServiceOfficer` | `src/models/` | Reviews, prioritises, assigns and closes requests. Adds service section. |
| `Technician` | `src/models/` | Carries out assigned work. Adds technical speciality. |
| `ServiceRequest` | `src/models/ServiceRequest.js` | Abstract-style base request. Common fields, status workflow, role checks, request history, update/cancel rules, base summary, `toData()`. |
| `ICTSupportRequest` | `src/models/` | Device type, system name, fault type, network impact. Network impact affects score and target time. |
| `MaintenanceRequest` | `src/models/` | Building, room, hazard level, equipment. High hazard means a 4-hour target. |
| `CleaningRequest` | `src/models/` | Cleaning area, hygiene risk, service type, preferred time. High hygiene risk means a 6-hour target. |
| `GeneralServiceRequest` | `src/models/` | Service needed. Uses the base priority rules. |
| `UserFactory` | `src/factories/` | Creates the correct `User` subclass for new users and for users loaded from JSON. |
| `ServiceRequestFactory` | `src/factories/` | `createNew()` for console input; `createFromData()` restores saved requests as the correct subclass. |
| `FileRepository` | `src/repositories/` | Base repository: `loadAll`, `saveAll`, `create`, `findById`, `update` for one JSON file. Handles missing, empty and invalid files. |
| `UserFileRepository` | `src/repositories/` | `users.json` |
| `ServiceRequestFileRepository` | `src/repositories/` | `serviceRequests.json`; adds `findByRequester`, `findByTechnician` |
| `RequestHistoryFileRepository` | `src/repositories/` | `requestHistory.json`; adds `findByRequest` |
| `AuditFileRepository` | `src/repositories/` | `auditLog.json`; adds `findByRequest` |
| `ReportService` | `src/services/` | Nine management reports calculated with `filter`, `map`, `reduce` and `sort`. |

## 4. Encapsulation

**Where:** every model class uses JavaScript private fields (`#`). Examples: `User` (`#userId`, `#firstName`, `#lastName`, `#email`, `#userType`) and `ServiceRequest` (`#status`, `#history`, `#assignedTechnician` and the other common fields).

**How it is controlled:**
- **Getters** give read-only access, e.g. `request.status`.
- **Controlled setters** validate before changing a value, e.g. `set email(value)` rejects invalid emails, and `set priority(value)` rejects unknown priorities.
- **No setter at all** for values that must never change: `userId`, `userType`, `requestId`, `requester`, `category`, `status`, the dates, `assignedTechnician` and `history`.
- `status` changes only through workflow methods (`review()`, `assignTechnician()`, `beginWork()`, ...), which all use the private `#changeStatus()` method.
- Collections are protected too. `getAllRequests()`, `getAllUsers()` and the `history` getter return **copies**, so outside code cannot add or remove items without validation.

## 5. Inheritance and Constructor Chaining

```text
User                              ServiceRequest (abstract-style)        FileRepository
├── StudentRequester              ├── ICTSupportRequest                  ├── UserFileRepository
├── StaffRequester                ├── MaintenanceRequest                 ├── ServiceRequestFileRepository
├── ServiceOfficer                ├── CleaningRequest                    ├── RequestHistoryFileRepository
└── Technician                    └── GeneralServiceRequest              └── AuditFileRepository
```

**Constructor chaining** is the first line of every subclass constructor:

```javascript
// src/models/StudentRequester.js
constructor(userId, firstName, lastName, email, programme, yearLevel) {
  super(userId, firstName, lastName, email, "Student"); // User validates the common fields
  this.programme = programme;                            // then the student-only fields
  this.yearLevel = yearLevel;
}

// src/models/ICTSupportRequest.js
constructor(commonRequestData, specialisedData = {}) {
  super({ ...commonRequestData, category: "ICT Support" });
  this.deviceType = specialisedData.deviceType;
  ...
}
```

`super()` runs the parent constructor first, so common validation is written once and every subclass reuses it. Each subclass fixes its own `userType` or `category`, so a `Technician` object is always a Technician and an `ICTSupportRequest` is always ICT Support.

## 6. Method Overriding

| Method | Base version | Overridden in |
|---|---|---|
| `validate()` | `User` checks common fields | Each user subclass calls `super.validate()` and checks its own fields |
| `displayInfo()` | `User` prints common lines | Each user subclass adds its own lines |
| `validateSpecialisedFields()` | `ServiceRequest` (no extra fields) | All four request subclasses |
| `calculatePriorityScore()` | abstract-style (throws) | All four request subclasses |
| `getTargetResolutionHours()` | abstract-style (throws) | All four request subclasses |
| `getRequestSummary()` | abstract-style (throws) | All four request subclasses |
| `toData()` | `User` / `ServiceRequest` common data | Every subclass adds its own fields with `{ ...super.toData(), ... }` |

**Priority rules** (kept simple on purpose):
- **Base points by priority:** Low 10, Normal 20, High 30, Urgent 40.
- **Base target hours:** Low 72, Normal 48, High 24, Urgent 8.
- **ICT:** adds 0 / 5 / 15 / 30 points for no / single-user / building / campus-wide impact. A campus-wide outage has a 2-hour target; a building outage at most 8 hours.
- **Maintenance:** adds 0 / 10 / 25 points for low / medium / high hazard. A high hazard has at most 4 hours.
- **Cleaning:** adds 0 / 5 / 15 points for low / medium / high hygiene risk. A high risk has at most 6 hours.
- **General:** base rules only.

## 7. Abstraction and Polymorphism

**Abstraction.** `ServiceRequest` is an abstract-style base class. It contains everything all requests share, but these three methods throw an error unless a subclass overrides them:

```javascript
calculatePriorityScore() {
  throw new Error(`calculatePriorityScore() must be implemented by a subclass (${this.requestType}).`);
}
```

This forces every request type to define its own scoring, target time and summary. Test T31 proves a subclass that forgets to override is caught.

**Polymorphism.** All request types are kept in **one** array (`#requests` in the manager) and processed with the **same** method calls. Menu option 15 runs:

```javascript
for (const request of requests) {
  console.log(request.getRequestSummary());
  console.log(request.calculatePriorityScore());
  console.log(request.getTargetResolutionHours());
}
```

JavaScript calls the version belonging to each object's actual class, so the same call gives different results. In test T32, four "High" requests give scores of 60, 55, 30 and 30, and targets of 2, 4, 24 and 24 hours. Polymorphism is also used in `sortRequests()` (priority score), `ReportService.overdueRequests()` (each type's own target time) and every request summary.

## 8. Composition and Object Relationships

- A `ServiceRequest` holds references to its requester `User` object and its assigned `Technician` object (association), not just their IDs.
- A `ServiceRequest` owns its history entries (composition). They are created only inside the request and returned as copies.
- `ServiceRequestManager` aggregates many users and requests, and owns its four repositories.

See `docs/uml/README.md` for the full relationship explanation and `docs/uml/class-diagram-final.png` for the diagram.

## 9. How the Request Workflow Is Controlled

```text
Submitted → Reviewed → Assigned → In Progress → Resolved → Closed
    └──→ Cancelled   (Closed and Cancelled are final)
```

1. **Allowed transitions** are listed in one table, `VALID_TRANSITIONS` in `src/constants.js`.
2. **Every status change** goes through `ServiceRequest.#changeStatus()`, which calls `#checkTransition()`. A change not in the table throws, e.g. `Invalid status change: Submitted → Closed is not allowed.`
3. **Role checks** happen in the workflow methods before anything changes:

| Action | Method | Who may do it |
|---|---|---|
| Update / cancel | `updateDetails()`, `cancelRequest()` | Only the requester, only while Submitted (`checkCanModify()`) |
| Review, set priority, assign, close | `review()`, `setPriority()`, `assignTechnician()`, `close()` | Only a `ServiceOfficer` (`instanceof` check) |
| Begin work, add progress note, resolve | `beginWork()`, `addProgressNote()`, `resolve()` | Only the assigned `Technician` (`isAssignedTo()`) |
| View reports and audit log | `getManagementReports()`, `getAuditLog()` | System Administrator or Service Officer |

4. **Every approved action** adds a history entry (previous status, new status, action, actor ID, actor role, comment, timestamp). Rejected actions add nothing to the history, but they *are* recorded in the audit log.

## 10. Validation and Error Handling

- **Constructors and setters validate everything.** Examples: missing ID or names, invalid email, unsupported category or priority, year level outside 1–5, unknown device type or hazard level. An invalid object can never be created.
- **The manager validates across objects:** duplicate user or request IDs, unregistered requesters, unknown request or user IDs.
- **Updates are all-or-nothing:** `updateDetails()` checks every new value before changing any of them.
- **Errors are `Error` objects with plain-language messages,** e.g. `Only the requester can update this request.`
- **The console never crashes on bad input.** Each menu action runs inside `try/catch` in `run()`, prints `Error: <message>`, and returns to the menu.
- **File errors** are explained (`Could not read users.json: the file is not valid JSON.`). If a data file cannot be read at start-up, the program stops instead of starting empty, because otherwise the next save would overwrite the user's data. If saving fails, the message is shown, the changes stay in memory, and saving is tried again after the next action.

## 11. JSON Storage and Restoration

**Files** (in `data/`):
- `users.json` – user records
- `serviceRequests.json` – request records, including `requestType` and specialised fields
- `requestHistory.json` – history entries, each with `requestId` and `sequence`
- `auditLog.json` – audit entries

**Saving** (`ServiceRequestManager.saveChanges()`):
1. Runs after every menu action, but only if something changed.
2. Calls `validate()` on every user and request first. If anything is invalid, nothing is written.
3. Converts objects to plain records with `toData()`. This is needed because `JSON.stringify()` cannot see private fields: `JSON.stringify(request)` gives `{}`.
4. Each repository writes its file with `fs/promises`, first to a `.tmp` file and then renamed, so a failed write cannot leave a half-written file.

**Loading and restoration** (`ServiceRequestManager.load()`):
1. The repositories read the four files. A missing or empty file becomes `[]`.
2. `UserFactory.createFromData()` rebuilds each user as its real subclass, so `instanceof ServiceOfficer` still works.
3. For each request record, `ServiceRequestFactory.createFromData()`:
   - picks the class from `requestType`;
   - looks up the requester and Technician **objects** by ID;
   - collects that request's history entries;
   - calls the subclass constructor with the saved state, so all validation runs again.
4. Records that cannot be restored (e.g. an unknown requester) are skipped with a warning.

Without the factory, loaded requests would be plain objects with no methods, no workflow rules and no polymorphism.

**Request history vs audit log.** History is one request's life cycle and belongs to that request. The audit log is a system-wide record of important actions by every user, including rejected attempts. Each audit entry has an audit ID, actor ID and role, action, request ID, description, timestamp and result.

## 12. Management Reports

`ReportService` has nine static methods. Each takes the requests array and is safe on an empty array:

1. Requests by status (`reduce`)
2. Requests by category (`reduce`)
3. Requests by priority (`reduce`)
4. Urgent open requests (`filter` + `sort` by priority score)
5. Overdue requests: open longer than their own target time (`filter`, `map`, `sort`)
6. Requests assigned to each Technician (`filter` + `reduce`)
7. Completed requests by Technician (`filter` + `reduce`)
8. Average resolution time, from submission to the "Resolved" history entry (`map`, `filter`, `reduce`)
9. Request volume by campus location (`reduce`, `map`, `sort`)

## 13. How the Tests Are Organised

Run with `npm test` (the built-in `node --test` runner finds every `*.test.js` file). There are 47 tests:

| File | Tests | What it covers |
|---|---|---|
| `User.test.js` | T01–T03 | Valid and invalid users, encapsulation |
| `ServiceRequest.test.js` | T04–T07 | Valid and invalid requests, owner-only update/cancel |
| `ServiceRequestManager.test.js` | T08–T16 | Pass workflow: registration, duplicates, submission, my requests, update, cancel, search, summary |
| `Inheritance.test.js` | T17–T22 | Subclass constructors, specialised validation, summaries, factories |
| `Workflow.test.js` | T23–T30 | Full workflow, role permissions, invalid transitions, history, priority overriding, filter, sort |
| `Polymorphism.test.js` | T31–T35 | Abstract-style methods, polymorphic loop, `toData()`, factory restoration |
| `Persistence.test.js` | T36–T43 | Save, load/restart, missing/empty files, read and write errors, invalid records, audit, repository methods |
| `Reports.test.js` | T44–T47 | All nine reports, including empty data |

**Isolation:** every file test creates its own temporary folder with `fs.mkdtemp()` (`tests/helpers.js`) and deletes it afterwards. The real `data/` files are never read or changed by tests. Report tests pass a fixed "now" time, so results never depend on when the tests run. See `docs/test-report/TestReport.md` for each test's input, expected and actual results.

## 14. Known Limitations

- No login or passwords. Users act by entering a user ID, so anyone at the keyboard can act as any user.
- JSON files suit one user at a time; simultaneous use could overwrite changes.
- The whole file is rewritten on each save, which is fine for hundreds of records but not for very large data.
- No notifications to requesters.
- Text-only console interface.

## 15. Future Improvements

- Secure login with hashed passwords, so role checks rely on authenticated users.
- A web or mobile interface that reuses the same manager and model classes.
- A database for many simultaneous users (excluded by this assessment).
- Email or SMS notifications when a request changes status.
- Attachments (e.g. photos of damage) on requests.
