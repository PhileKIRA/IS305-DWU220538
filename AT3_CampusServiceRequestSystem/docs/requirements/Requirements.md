# Requirements Document
## Campus Service Request Management System

**Course:** IS305 – Object-Oriented Programming, Divine Word University
**Student:** Philemon Kira (DWU220538)
**Version:** 1.0


---

## 1. Project Background

Divine Word University (DWU) supports students and staff with ICT services, building and facilities maintenance, cleaning and sanitation, and other general campus services. At present, problems are reported through telephone calls, informal conversations with staff, or emails.

Because these reports are not recorded in one place, requests can be forgotten or lost, nobody can easily see who is responsible for a job, and requesters cannot check progress. When a job is finished there is no reliable way to confirm that the problem was actually resolved, and management cannot produce reports on how many requests are received, how quickly they are handled, or which areas of campus need the most attention.

## 2. Problem Statement

DWU has no central system for recording and tracking campus service requests. Informal reporting by telephone, conversation and emails causes requests to be lost, leaves responsibility unclear, hides progress from requesters, and prevents the university from confirming completion or measuring service performance.

## 3. Objectives

**Main objective:** To design and develop an object-oriented Node.js console application that records, assigns, processes and monitors campus service requests at DWU.

**Specific objectives:**
1. Allow students and staff to register and submit service requests in four categories.
2. Allow requesters to view, update and cancel their own eligible requests.
3. Allow Service Officers to review requests, set priority, assign Technicians and close completed work.
4. Allow Technicians to start, record progress on, and resolve the requests assigned to them.
5. Enforce a controlled request status workflow and role-based permissions.
6. Keep a history of every status change and an audit trail of important user actions.
7. Save and reload all records using JSON files so information is kept after the program closes.
8. Produce management reports to support decision-making.

## 4. Scope

**In scope**
- Console (command-line) application written in JavaScript for Node.js.
- User registration for Student Requesters, Staff Requesters, Service Officers, Technicians and System Administrators.
- Request categories: ICT Support, Facilities Maintenance, Cleaning and Sanitation, General Campus Service.
- Request submission, viewing, updating, cancellation, searching, filtering and sorting.
- Controlled workflow: Submitted → Reviewed → Assigned → In Progress → Resolved → Closed (and Cancelled).
- Request history, audit log, and management reports.
- Persistence using JSON files and the Node.js `fs/promises` module.
- Automated tests using the built-in Node.js test runner.

**Out of scope**
- Web, mobile or graphical user interfaces.
- Databases (MongoDB, MySQL, SQLite, etc.).
- Passwords, login security and encryption.
- Email or SMS notifications.
- Integration with existing DWU systems.
- Use of real institutional data (simulated data only).

## 5. Actors and User Roles

| Actor | Responsibilities |
|---|---|
| Student Requester | Submits requests, views progress, updates or cancels own Submitted requests. |
| Staff Requester | Same as Student Requester, recorded with their department. |
| Service Officer | Reviews requests, sets priority, assigns Technicians, verifies and closes resolved requests. |
| Technician | Views assigned requests, begins work, adds progress notes, resolves requests. |
| System Administrator | Reviews system records, audit history and management reports (read-only). |

## 6. Functional Requirements

**Pass – core system**

| ID | Requirement |
|---|---|
| FR01 | The system shall register a user with a unique user ID, first name, last name, valid email address and user type. |
| FR02 | The system shall reject missing user IDs, missing names, invalid emails and duplicate user IDs. |
| FR03 | The system shall allow a registered user to submit a request with a title, description, campus location, category and priority. |
| FR04 | The system shall give every new request a unique request ID and the status *Submitted*. |
| FR05 | The system shall reject missing titles or descriptions, unsupported categories, unsupported priorities and duplicate request IDs. |
| FR06 | The system shall display a request by its request ID. |
| FR07 | The system shall display all requests submitted by a selected user. |
| FR08 | The system shall display all requests. |
| FR09 | The system shall allow a requester to update only their own request while it is *Submitted*. |
| FR10 | The system shall allow a requester to cancel only their own request while it is *Submitted*, and reject cancelling an already cancelled request. |
| FR11 | The system shall search requests by request ID or title. |
| FR12 | The system shall display a summary showing the number of requests in each status. |

**Credit – specialised requests and workflow**

| ID | Requirement |
|---|---|
| FR13 | The system shall store specialised information for Student, Staff, Service Officer and Technician users. |
| FR14 | The system shall store specialised information for ICT Support, Maintenance, Cleaning and General Campus Service requests. |
| FR15 | The system shall allow only a Service Officer to review a request, set its priority and assign a Technician. |
| FR16 | The system shall allow only the assigned Technician to begin work, add progress notes and resolve the request. |
| FR17 | The system shall allow only a Service Officer to close a *Resolved* request. |
| FR18 | The system shall reject any status change that does not follow the permitted workflow. |
| FR19 | The system shall filter requests by category, status, priority and assigned Technician, and sort by date submitted and priority. |
| FR20 | The system shall record a history entry (previous status, new status, action, actor, comment, date/time) for every workflow action. |

**Distinction – persistence, audit and reporting**

| ID | Requirement |
|---|---|
| FR21 | The system shall load users, requests, history and audit records from JSON files when it starts, treating missing files as empty. |
| FR22 | The system shall save valid changes to the JSON files and never save invalid records. |
| FR23 | The system shall restore saved requests as the correct specialised request type. |
| FR24 | The system shall record an audit entry for registrations, request creation, updates, priority changes, assignments, status changes, cancellations, resolutions and closures. |
| FR25 | The system shall produce management reports, including requests by status, category and priority, urgent requests, overdue requests and requests per Technician. |
| FR26 | The system shall allow the System Administrator to view the audit log and reports. |

## 7. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR01 | Usability | Menus shall be numbered and clearly labelled; every error shall be shown as a plain-language message. |
| NFR02 | Reliability | Invalid input shall never crash the program; the menu shall continue after an error. |
| NFR03 | Data integrity | Objects shall be validated before they are stored or saved; private fields prevent direct changes to data. |
| NFR04 | Maintainability | Code shall be organised into separate classes and folders (models, manager, repositories, services) with one responsibility each. |
| NFR05 | Performance | Each menu action shall respond within one second for up to 1,000 requests. |
| NFR06 | Security | Data files shall contain simulated data only — no passwords or confidential information. Role checks shall prevent unauthorised workflow actions. |
| NFR07 | Portability | The application shall run on Windows, macOS and Linux with Node.js 20 or later and no third-party packages. |
| NFR08 | Testability | Core behaviour shall be covered by automated tests that use temporary files. |

## 8. Assumptions and Limitations

**Assumptions**
- Users have Node.js 20 or later installed.
- Only one person uses the console at a time.
- Users identify themselves by entering their user ID (no password).
- All data is simulated for assessment purposes.

**Limitations**
- No authentication: anyone at the console can act as any registered user.
- JSON files are not suitable for many simultaneous users.
- No notifications are sent when a request changes status.
- Text-only console interface.

## 9. User Stories

1. As a **Student Requester**, I want to submit a service request with a category and location, so that my problem is officially recorded and not forgotten.
2. As a **Student Requester**, I want to view all of my requests and their current status, so that I know what progress has been made.
3. As a **Staff Requester**, I want to update my request while it is still Submitted, so that I can correct mistakes or add details.
4. As a **Staff Requester**, I want to cancel my request while it is still Submitted, so that staff do not waste time on a problem that is already fixed.
5. As a **Service Officer**, I want to review new requests and set their priority, so that urgent problems are handled first.
6. As a **Service Officer**, I want to assign a request to a Technician, so that responsibility for the job is clear.
7. As a **Technician**, I want to see only the requests assigned to me, so that I can plan my work.
8. As a **Technician**, I want to record progress notes and mark a request as resolved, so that the officer and requester know the work is done.
9. As a **Service Officer**, I want to verify and close resolved requests, so that only completed work is marked as closed.
10. As a **System Administrator**, I want to view the audit log and management reports, so that I can monitor service performance and accountability.
11. As any **user**, I want to search and filter requests by status, category or priority, so that I can quickly find the requests I need.
