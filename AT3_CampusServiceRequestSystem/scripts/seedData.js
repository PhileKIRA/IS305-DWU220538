/**
 * Creates SIMULATED sample data in data/ for demonstrations: users of every
 * role and requests of every type in different workflow statuses.
 *
 *   npm run seed
 *
 * WARNING: this replaces the four files in data/. All names, IDs and emails
 * are made up - there is no real institutional data and no passwords.
 * Dates are relative to "now" so the overdue and resolution-time reports
 * have something to show.
 */
const path = require("path");
const ServiceRequestManager = require("../src/managers/ServiceRequestManager");
const UserFileRepository = require("../src/repositories/UserFileRepository");
const ServiceRequestFileRepository = require("../src/repositories/ServiceRequestFileRepository");
const RequestHistoryFileRepository = require("../src/repositories/RequestHistoryFileRepository");
const AuditFileRepository = require("../src/repositories/AuditFileRepository");

const DATA_DIR = path.join(__dirname, "..", "data");
const NOW = Date.now();
const hoursAgo = (hours) => new Date(NOW - hours * 3600000).toISOString();

const users = [
  { userId: "DWU2026001", firstName: "Mary", lastName: "Kila", email: "mary.kila@students.dwu.example", userType: "Student", programme: "Bachelor of Information Systems", yearLevel: 3 },
  { userId: "DWU2026014", firstName: "John", lastName: "Waim", email: "john.waim@students.dwu.example", userType: "Student", programme: "Bachelor of Business Studies", yearLevel: 2 },
  { userId: "DWU2026027", firstName: "Grace", lastName: "Pondros", email: "grace.pondros@students.dwu.example", userType: "Student", programme: "Bachelor of Health Science", yearLevel: 1 },
  { userId: "STF101", firstName: "Peter", lastName: "Sale", email: "peter.sale@staff.dwu.example", userType: "Staff", department: "Information Systems" },
  { userId: "STF102", firstName: "Ruth", lastName: "Kaupa", email: "ruth.kaupa@staff.dwu.example", userType: "Staff", department: "Library Services" },
  { userId: "OFF001", firstName: "Paul", lastName: "Agi", email: "paul.agi@staff.dwu.example", userType: "Service Officer", serviceSection: "ICT Services" },
  { userId: "OFF002", firstName: "Helen", lastName: "Tamb", email: "helen.tamb@staff.dwu.example", userType: "Service Officer", serviceSection: "Facilities and Estates" },
  { userId: "TECH001", firstName: "Ken", lastName: "Bais", email: "ken.bais@staff.dwu.example", userType: "Technician", technicalSpeciality: "Networking" },
  { userId: "TECH002", firstName: "Rose", lastName: "Lai", email: "rose.lai@staff.dwu.example", userType: "Technician", technicalSpeciality: "Electrical and Plumbing" },
  { userId: "TECH003", firstName: "Michael", lastName: "Yawa", email: "michael.yawa@staff.dwu.example", userType: "Technician", technicalSpeciality: "Cleaning and Sanitation" },
  { userId: "ADM001", firstName: "Ann", lastName: "Mek", email: "ann.mek@staff.dwu.example", userType: "System Administrator" },
];
const roleOf = Object.fromEntries(users.map((u) => [u.userId, u.userType]));

// Workflow steps in order: [status reached, action, who does it, comment]
const STEPS = [
  ["Reviewed", "Review request", "officer", "Request reviewed"],
  ["Assigned", "Assign Technician", "officer", null],
  ["In Progress", "Begin work", "tech", "Work started"],
  ["Resolved", "Resolve request", "tech", "Work completed"],
  ["Closed", "Close request", "officer", "Work verified and request closed"],
];

/**
 * One request definition → request record + history entries.
 * `hours` = hours after submission at which each workflow step happened.
 */
function buildRequest(def) {
  const submitted = hoursAgo(def.submittedHoursAgo);
  const history = [{ previousStatus: null, newStatus: "Submitted", action: "Submit request", actorId: def.requesterId,
    actorRole: roleOf[def.requesterId], comment: "Request submitted", timestamp: submitted }];

  let status = "Submitted";
  const stepCount = { Submitted: 0, Reviewed: 1, Assigned: 2, "In Progress": 3, Resolved: 4, Closed: 5, Cancelled: 0 }[def.status];
  STEPS.slice(0, stepCount).forEach(([newStatus, action, who, comment], index) => {
    const actorId = who === "officer" ? def.officerId : def.techId;
    const timestamp = new Date(Date.parse(submitted) + def.hours[index] * 3600000).toISOString();
    const techName = users.find((u) => u.userId === def.techId);
    history.push({ previousStatus: status, newStatus, action, actorId, actorRole: roleOf[actorId],
      comment: comment ?? `Assigned to ${techName.firstName} ${techName.lastName} (${def.techId})`, timestamp });
    status = newStatus;
    if (newStatus === "In Progress" && def.progressNote) {
      history.push({ previousStatus: status, newStatus: status, action: "Progress update", actorId, actorRole: "Technician",
        comment: def.progressNote, timestamp: new Date(Date.parse(timestamp) + 0.5 * 3600000).toISOString() });
    }
  });
  if (def.status === "Cancelled") {
    history.push({ previousStatus: "Submitted", newStatus: "Cancelled", action: "Cancel request", actorId: def.requesterId,
      actorRole: roleOf[def.requesterId], comment: "Cancelled by requester", timestamp: hoursAgo(def.submittedHoursAgo - 1) });
  }

  const record = {
    requestId: def.requestId, requestType: def.requestType, requesterId: def.requesterId, title: def.title,
    description: def.description, location: def.location, category: def.category, priority: def.priority,
    status: def.status, assignedTechnicianId: stepCount >= 2 ? def.techId : null,
    dateSubmitted: submitted, dateUpdated: history[history.length - 1].timestamp, ...def.details,
  };
  return { record, history };
}

const requestDefinitions = [
  { requestId: "REQ001", requestType: "ICTSupportRequest", category: "ICT Support", requesterId: "DWU2026001", officerId: "OFF001", techId: "TECH001",
    title: "Unable to access campus Wi-Fi", description: "Laptop cannot connect to the student Wi-Fi network on Level 2.", location: "Library Level 2",
    priority: "High", status: "Assigned", submittedHoursAgo: 6, hours: [1, 2],
    details: { deviceType: "Laptop", systemName: "DWU-Student Wi-Fi", faultType: "Network", networkImpact: "Building" } },
  { requestId: "REQ002", requestType: "MaintenanceRequest", category: "Facilities Maintenance", requesterId: "DWU2026014", officerId: "OFF002", techId: "TECH002",
    title: "Ceiling fan not working", description: "The ceiling fan in room 12 does not turn on.", location: "Mary Help Hall",
    priority: "Normal", status: "Closed", submittedHoursAgo: 120, hours: [2, 4, 20, 26, 30],
    details: { building: "Mary Help Hall", roomNumber: "12", hazardLevel: "Low", equipmentAffected: "Ceiling fan" } },
  { requestId: "REQ003", requestType: "CleaningRequest", category: "Cleaning and Sanitation", requesterId: "STF102", officerId: "OFF002", techId: "TECH003",
    title: "Blocked toilets in Block B", description: "Two toilets are blocked and overflowing.", location: "Block B",
    priority: "Urgent", status: "In Progress", submittedHoursAgo: 9, hours: [0.5, 1, 2], progressNote: "Plumber called for the second toilet",
    details: { cleaningArea: "Block B ground floor toilets", hygieneRisk: "High", serviceType: "Restroom Service", preferredServiceTime: "Any Time" } },
  { requestId: "REQ004", requestType: "ICTSupportRequest", category: "ICT Support", requesterId: "STF101", officerId: "OFF001", techId: "TECH001",
    title: "Moodle down across campus", description: "Moodle shows a server error for all users.", location: "ICT Centre",
    priority: "Urgent", status: "Resolved", submittedHoursAgo: 30, hours: [0.25, 0.5, 0.75, 3],
    details: { deviceType: "Other", systemName: "Moodle", faultType: "Software", networkImpact: "Campus-wide" } },
  { requestId: "REQ005", requestType: "MaintenanceRequest", category: "Facilities Maintenance", requesterId: "DWU2026027", officerId: "OFF002", techId: "TECH002",
    title: "Exposed wiring in science lab", description: "Wires are hanging out of the wall socket near bench 4.", location: "Science Block",
    priority: "High", status: "Reviewed", submittedHoursAgo: 7, hours: [1],
    details: { building: "Science Block", roomNumber: "S4", hazardLevel: "High", equipmentAffected: "Wall socket" } },
  { requestId: "REQ006", requestType: "GeneralServiceRequest", category: "General Campus Service", requesterId: "STF101", officerId: "OFF002", techId: "TECH002",
    title: "Chairs needed for seminar", description: "Need 40 chairs moved to the lecture theatre for Friday.", location: "Lecture Theatre 1",
    priority: "Low", status: "Submitted", submittedHoursAgo: 2, hours: [],
    details: { serviceNeeded: "Move 40 chairs to Lecture Theatre 1" } },
  { requestId: "REQ007", requestType: "CleaningRequest", category: "Cleaning and Sanitation", requesterId: "DWU2026001", officerId: "OFF002", techId: "TECH003",
    title: "Spill in computer lab", description: "Juice spilled under desks in Lab 3.", location: "ICT Centre",
    priority: "Normal", status: "Closed", submittedHoursAgo: 72, hours: [1, 2, 3, 5, 8],
    details: { cleaningArea: "Computer Lab 3", hygieneRisk: "Medium", serviceType: "Spill Clean-up", preferredServiceTime: "Afternoon" } },
  { requestId: "REQ008", requestType: "ICTSupportRequest", category: "ICT Support", requesterId: "DWU2026014", officerId: "OFF001", techId: "TECH001",
    title: "Printer jam in library", description: "Library printer shows paper jam error.", location: "Library Level 1",
    priority: "Normal", status: "Cancelled", submittedHoursAgo: 50, hours: [],
    details: { deviceType: "Printer", systemName: "Library print station", faultType: "Hardware", networkImpact: "None" } },
  { requestId: "REQ009", requestType: "ICTSupportRequest", category: "ICT Support", requesterId: "DWU2026027", officerId: "OFF001", techId: "TECH001",
    title: "Cannot log in to student portal", description: "Password reset email never arrives.", location: "Library Level 2",
    priority: "Normal", status: "Submitted", submittedHoursAgo: 60, hours: [],
    details: { deviceType: "Phone or Tablet", systemName: "Student portal", faultType: "Account or Access", networkImpact: "Single User" } },
];

async function seed() {
  const built = requestDefinitions.map(buildRequest);
  const historyRecords = built.flatMap(({ record, history }) =>
    history.map((entry, index) => ({ historyId: `${record.requestId}-H${String(index + 1).padStart(2, "0")}`, requestId: record.requestId, sequence: index + 1, ...entry })));

  // Audit: one entry per registration and per history step, in time order.
  const events = [
    ...users.map((u, i) => ({ actorId: u.userId, actorRole: u.userType, action: "User registration", requestId: null,
      description: `Registered ${u.userType} ${u.firstName} ${u.lastName}`, timestamp: hoursAgo(200 - i) })),
    ...historyRecords.map((h) => ({
      actorId: h.actorId, actorRole: h.actorRole, requestId: h.requestId, timestamp: h.timestamp,
      action: { "Submit request": "Request creation", "Review request": "Status change (review)", "Assign Technician": "Technician assignment",
        "Begin work": "Status change (begin work)", "Progress update": "Progress update", "Resolve request": "Request resolution",
        "Close request": "Request closure", "Cancel request": "Request cancellation" }[h.action],
      description: h.previousStatus && h.previousStatus !== h.newStatus ? `Status changed from ${h.previousStatus} to ${h.newStatus}` : h.comment,
    })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const audit = events.map((e, i) => ({ auditId: `AUD${String(i + 1).padStart(4, "0")}`, actorId: e.actorId, actorRole: e.actorRole,
    action: e.action, requestId: e.requestId, description: e.description, timestamp: e.timestamp, result: "Success" }));

  await new UserFileRepository(DATA_DIR).saveAll(users);
  await new ServiceRequestFileRepository(DATA_DIR).saveAll(built.map((b) => b.record));
  await new RequestHistoryFileRepository(DATA_DIR).saveAll(historyRecords);
  await new AuditFileRepository(DATA_DIR).saveAll(audit);

  // Check: load everything back through the real classes - nothing may be skipped.
  const result = await ServiceRequestManager.createWithJsonFiles(DATA_DIR).load();
  if (result.warnings.length > 0) {
    throw new Error(`Sample data did not load cleanly:\n${result.warnings.join("\n")}`);
  }
  console.log(`Sample data written to ${DATA_DIR}: ${result.users} users, ${result.requests} requests, ${historyRecords.length} history entries, ${audit.length} audit entries.`);
}

seed().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
