const test = require("node:test");
const assert = require("node:assert");

const StudentRequester = require("../src/models/StudentRequester");
const ServiceOfficer = require("../src/models/ServiceOfficer");
const Technician = require("../src/models/Technician");
const ICTSupportRequest = require("../src/models/ICTSupportRequest");
const MaintenanceRequest = require("../src/models/MaintenanceRequest");
const CleaningRequest = require("../src/models/CleaningRequest");
const ServiceRequestManager = require("../src/managers/ServiceRequestManager");

// A fresh manager with one user of each role, for every test.
function setup() {
  const manager = new ServiceRequestManager();
  const student = manager.registerUser(new StudentRequester("DWU2026001", "Mary", "Kila", "mary.kila@dwu.ac.pg", "BIS", 3));
  const officer = manager.registerUser(new ServiceOfficer("OFF001", "Paul", "Agi", "paul.agi@dwu.ac.pg", "ICT Services"));
  const tech = manager.registerUser(new Technician("TECH001", "Ken", "Bais", "ken.bais@dwu.ac.pg", "Networking"));
  const otherTech = manager.registerUser(new Technician("TECH002", "Rose", "Lai", "rose.lai@dwu.ac.pg", "Electrical"));
  return { manager, student, officer, tech, otherTech };
}

function common(manager, requester, overrides = {}) {
  return {
    requestId: manager.generateRequestId(),
    requester,
    title: "Wi-Fi down in library",
    description: "No connection on Level 2.",
    location: "Library Level 2",
    priority: "Normal",
    ...overrides,
  };
}

function submitIct(manager, requester, networkImpact = "Building", overrides = {}) {
  return manager.submitRequest(
    new ICTSupportRequest(common(manager, requester, overrides), {
      deviceType: "Network Equipment", systemName: "DWU-Student Wi-Fi", faultType: "Network", networkImpact,
    })
  );
}

test("T23 - full workflow: Submitted → Reviewed → Assigned → In Progress → Resolved → Closed", () => {
  const { manager, student } = setup();
  submitIct(manager, student);

  manager.reviewRequest("REQ001", "OFF001", "Checked with library staff");
  manager.setRequestPriority("REQ001", "OFF001", "High");
  manager.assignTechnician("REQ001", "OFF001", "TECH001");
  manager.beginWork("REQ001", "TECH001");
  manager.addProgressNote("REQ001", "TECH001", "Replaced faulty access point");
  manager.resolveRequest("REQ001", "TECH001", "Wi-Fi working again");
  manager.closeRequest("REQ001", "OFF001", "Confirmed with requester");

  const request = manager.findRequestById("REQ001");
  assert.strictEqual(request.status, "Closed");
  assert.strictEqual(request.priority, "High");
  assert.strictEqual(request.assignedTechnician.userId, "TECH001");
});

test("T24 - only a Service Officer can review, set priority, assign and close", () => {
  const { manager, student } = setup();
  submitIct(manager, student);

  assert.throws(() => manager.reviewRequest("REQ001", "DWU2026001"), /Only a Service Officer can review/);
  assert.throws(() => manager.reviewRequest("REQ001", "TECH001"), /Only a Service Officer can review/);
  manager.reviewRequest("REQ001", "OFF001");

  assert.throws(() => manager.setRequestPriority("REQ001", "TECH001", "Urgent"), /Only a Service Officer can set the priority/);
  assert.throws(() => manager.assignTechnician("REQ001", "TECH001", "TECH001"), /Only a Service Officer can assign a Technician/);
  assert.throws(() => manager.assignTechnician("REQ001", "OFF001", "DWU2026001"), /only be assigned to a registered Technician/);
  assert.strictEqual(manager.findRequestById("REQ001").status, "Reviewed"); // nothing changed
});

test("T25 - only the assigned Technician can begin, update progress and resolve", () => {
  const { manager, student } = setup();
  submitIct(manager, student);
  manager.reviewRequest("REQ001", "OFF001");
  manager.assignTechnician("REQ001", "OFF001", "TECH001");

  assert.throws(() => manager.beginWork("REQ001", "TECH002"), /Only the assigned Technician can start work/);
  assert.throws(() => manager.beginWork("REQ001", "OFF001"), /Only the assigned Technician/);
  manager.beginWork("REQ001", "TECH001");

  assert.throws(() => manager.addProgressNote("REQ001", "TECH002", "Hi"), /Only the assigned Technician can add progress notes/);
  assert.throws(() => manager.resolveRequest("REQ001", "TECH002"), /Only the assigned Technician can resolve/);
  assert.throws(() => manager.closeRequest("REQ001", "OFF001"), /Invalid status change: In Progress → Closed/);
  assert.strictEqual(manager.findRequestById("REQ001").status, "In Progress");
});

test("T26 - invalid status transitions are rejected; Closed and Cancelled are final", () => {
  const { manager, student } = setup();
  submitIct(manager, student);

  // Submitted → Closed / Resolved / Assigned are not allowed
  assert.throws(() => manager.closeRequest("REQ001", "OFF001"), /Invalid status change: Submitted → Closed/);
  assert.throws(() => manager.assignTechnician("REQ001", "OFF001", "TECH001"), /Submitted → Assigned/);
  assert.strictEqual(manager.findRequestById("REQ001").assignedTechnician, null); // not assigned by the failed attempt

  // Reviewed → Resolved is not allowed
  manager.reviewRequest("REQ001", "OFF001");
  assert.throws(() => manager.reviewRequest("REQ001", "OFF001"), /Reviewed → Reviewed/);
  assert.throws(() => manager.cancelRequest("REQ001", "DWU2026001"), /Only Submitted requests can be cancelled/);

  // Cancelled → Assigned is not allowed (Cancelled is final)
  submitIct(manager, student);
  manager.cancelRequest("REQ002", "DWU2026001");
  assert.throws(() => manager.reviewRequest("REQ002", "OFF001"), /Cancelled → Reviewed/);
});

test("T27 - request history records every approved workflow action", () => {
  const { manager, student } = setup();
  submitIct(manager, student);
  manager.reviewRequest("REQ001", "OFF001");
  manager.assignTechnician("REQ001", "OFF001", "TECH001");
  assert.throws(() => manager.beginWork("REQ001", "TECH002")); // rejected: must NOT appear in history
  manager.beginWork("REQ001", "TECH001");
  manager.addProgressNote("REQ001", "TECH001", "Ordered a new cable");

  const history = manager.getRequestHistory("REQ001");
  assert.deepStrictEqual(
    history.map((h) => `${h.previousStatus}→${h.newStatus}`),
    ["null→Submitted", "Submitted→Reviewed", "Reviewed→Assigned", "Assigned→In Progress", "In Progress→In Progress"]
  );
  const last = history[history.length - 1];
  assert.strictEqual(last.action, "Progress update");
  assert.strictEqual(last.actorId, "TECH001");
  assert.strictEqual(last.actorRole, "Technician");
  assert.strictEqual(last.comment, "Ordered a new cable");
  assert.ok(last.timestamp);

  history.push({ fake: true }); // changing the copy...
  assert.strictEqual(manager.getRequestHistory("REQ001").length, 5); // ...does not change the real history
});

test("T28 - overridden priority score and target hours differ by request type", () => {
  const { manager, student } = setup();
  const campusWide = submitIct(manager, student, "Campus-wide");
  const singleUser = submitIct(manager, student, "Single User");
  const hazard = manager.submitRequest(new MaintenanceRequest(common(manager, student), {
    building: "Science Block", roomNumber: "S4", hazardLevel: "High", equipmentAffected: "Exposed wiring",
  }));
  const cleaning = manager.submitRequest(new CleaningRequest(common(manager, student), {
    cleaningArea: "Staff room", hygieneRisk: "Low", serviceType: "Routine Cleaning", preferredServiceTime: "Any Time",
  }));

  // All four are "Normal" priority (20 points, 48 hours), but each type adjusts it.
  assert.strictEqual(campusWide.calculatePriorityScore(), 50); // 20 + 30
  assert.strictEqual(campusWide.getTargetResolutionHours(), 2);
  assert.strictEqual(singleUser.calculatePriorityScore(), 25); // 20 + 5
  assert.strictEqual(singleUser.getTargetResolutionHours(), 48);
  assert.strictEqual(hazard.calculatePriorityScore(), 45); // 20 + 25
  assert.strictEqual(hazard.getTargetResolutionHours(), 4);
  assert.strictEqual(cleaning.calculatePriorityScore(), 20); // 20 + 0
  assert.strictEqual(cleaning.getTargetResolutionHours(), 48);
});

test("T29 - filter by category, status, priority and Technician", () => {
  const { manager, student } = setup();
  submitIct(manager, student, "Building", { priority: "High" });
  submitIct(manager, student, "None", { priority: "Low" });
  manager.submitRequest(new CleaningRequest(common(manager, student, { priority: "High" }), {
    cleaningArea: "Block B toilets", hygieneRisk: "High", serviceType: "Restroom Service", preferredServiceTime: "Morning",
  }));
  manager.reviewRequest("REQ001", "OFF001");
  manager.assignTechnician("REQ001", "OFF001", "TECH001");

  const ids = (list) => list.map((r) => r.requestId);
  assert.deepStrictEqual(ids(manager.filterRequests({ category: "ICT Support" })), ["REQ001", "REQ002"]);
  assert.deepStrictEqual(ids(manager.filterRequests({ status: "Assigned" })), ["REQ001"]);
  assert.deepStrictEqual(ids(manager.filterRequests({ priority: "High" })), ["REQ001", "REQ003"]);
  assert.deepStrictEqual(ids(manager.filterRequests({ technicianId: "tech001" })), ["REQ001"]);
  assert.deepStrictEqual(ids(manager.filterRequests({ category: "ICT Support", priority: "Low" })), ["REQ002"]);
  assert.strictEqual(manager.filterRequests().length, 3);
});

test("T30 - sort by date submitted and by priority", () => {
  const { manager, student } = setup();
  submitIct(manager, student, "None", { priority: "Low" });      // REQ001
  submitIct(manager, student, "Building", { priority: "Urgent" }); // REQ002
  submitIct(manager, student, "None", { priority: "High" });     // REQ003
  submitIct(manager, student, "Campus-wide", { priority: "High" }); // REQ004 - same level, higher score

  const all = manager.getAllRequests();
  const ids = (list) => list.map((r) => r.requestId);
  assert.deepStrictEqual(ids(manager.sortRequests(all, "priority")), ["REQ002", "REQ004", "REQ003", "REQ001"]);
  assert.deepStrictEqual(ids(manager.sortRequests(all, "date")), ["REQ001", "REQ002", "REQ003", "REQ004"]);
  assert.deepStrictEqual(ids(all), ["REQ001", "REQ002", "REQ003", "REQ004"]); // original array unchanged
  assert.throws(() => manager.sortRequests(all, "colour"), /Unknown sort option/);
});
