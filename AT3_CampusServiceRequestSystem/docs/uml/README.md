# UML and System Design

| Diagram | Source | Image | Status |
|---|---|---|---|
| Use case diagram | `use-case.puml` | `use-case.png` | Complete |
| Class diagram | `class-diagram-initial.mmd` | `class-diagram-initial.png` | **Initial (Pass)** – will be replaced by the final class diagram after the Credit and Distinction stages |
| Sequence: submit request | `sequence-submit-request.mmd` | `sequence-submit-request.png` | Complete for Pass |
| Sequence: assign Technician | `sequence-assign-technician.mmd` | `sequence-assign-technician.png` | Complete (Credit) |
| Sequence: resolve and close request | `sequence-resolve-close.mmd` | `sequence-resolve-close.png` | Complete (Credit) |

`.mmd` files are Mermaid and `.puml` files are PlantUML, so every diagram can be regenerated from its source.

## Class relationships (initial design)

- **Association (`ServiceRequest` → `User`)** – every request keeps a reference to the `User` object who submitted it (`#requester`). Many requests can belong to one user.
- **Aggregation, one-to-many (`ServiceRequestManager` → `User`, `ServiceRequest`)** – the manager stores all users and requests in two arrays (`#users`, `#requests`). The users and requests are separate objects that the manager collects and looks after.
- **Dependency (`CampusServiceApp` → `ServiceRequestManager`)** – the console app only reads input and prints output; it asks the manager to do all the work.
- **Encapsulation** – every attribute marked `#` is a JavaScript private field. Other classes can only use the public getters, controlled setters and methods.
