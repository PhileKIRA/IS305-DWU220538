# UML and System Design

All diagrams match the final submitted code. Each image can be regenerated from its source file (`.puml` = PlantUML, `.mmd` = Mermaid).

| Diagram | Source | Image |
|---|---|---|
| Use case diagram | `use-case.puml` | `use-case.png` |
| Complete class diagram | `class-diagram-final.puml` | `class-diagram-final.png` |
| Sequence: submit a request | `sequence-submit-request.mmd` | `sequence-submit-request.png` |
| Sequence: assign a Technician | `sequence-assign-technician.mmd` | `sequence-assign-technician.png` |
| Sequence: resolve and close a request | `sequence-resolve-close.mmd` | `sequence-resolve-close.png` |

The initial Pass-stage class diagram from Week 7 is kept in the Git history (commit "Add initial UML: use case, class and submit-request sequence diagrams").

## Explanation of the Class Relationships

**Inheritance (generalisation, hollow triangle arrows)**
- `StudentRequester`, `StaffRequester`, `ServiceOfficer` and `Technician` inherit from `User`. Each calls `super()` and adds its own field (programme and year level, department, service section, technical speciality). A System Administrator is a plain `User`, because it needs no extra data.
- `ICTSupportRequest`, `MaintenanceRequest`, `CleaningRequest` and `GeneralServiceRequest` inherit from the abstract-style `ServiceRequest`. Each calls `super(commonRequestData)`, adds its specialised fields, and overrides `calculatePriorityScore()`, `getTargetResolutionHours()`, `getRequestSummary()`, `validateSpecialisedFields()` and `toData()`.
- `UserFileRepository`, `ServiceRequestFileRepository`, `RequestHistoryFileRepository` and `AuditFileRepository` inherit the file-reading and file-writing code from `FileRepository`, and only add their file name and search methods.

**Association (solid arrows)**
- `ServiceRequest → User` (requester): every request refers to exactly one requester; one user can have many requests.
- `ServiceRequest → Technician` (assignedTechnician): a request has zero or one assigned Technician; a Technician can have many requests.
- `CampusServiceApp → ServiceRequestManager`: the console sends every action to the manager.

**Aggregation, one-to-many (hollow diamonds)**
- `ServiceRequestManager` holds all `User` objects and all `ServiceRequest` objects in two arrays. Users and requests are separate objects that the manager collects; a user still makes sense on its own.

**Composition (filled diamond)**
- `ServiceRequestManager` creates and owns its four repositories (`createWithJsonFiles()`); they exist only for that manager.
- Each `ServiceRequest` owns its private history entries. They are created inside the request, cannot be changed from outside, and have no meaning without the request (shown as the `history` attribute).

**Dependency (dashed arrows)**
- `CampusServiceApp` uses `UserFactory` and `ServiceRequestFactory` to create new objects from console input.
- `ServiceRequestManager` uses the factories to restore objects from JSON data, and `ReportService` to calculate reports.

**Repository and factory relationships**
- The repositories only handle plain data records. The manager converts objects to records with `toData()` before saving, and the factories convert records back to objects with `createFromData()` after loading. The console never touches the repositories or the files.
