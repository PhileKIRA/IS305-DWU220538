const test = require("node:test");
const assert = require("node:assert");

const StudentRequester = require("../src/models/StudentRequester");
const Technician = require("../src/models/Technician");
const ServiceRequest = require("../src/models/ServiceRequest");
const ICTSupportRequest = require("../src/models/ICTSupportRequest");
const MaintenanceRequest = require("../src/models/MaintenanceRequest");
const CleaningRequest = require("../src/models/CleaningRequest");
const GeneralServiceRequest = require("../src/models/GeneralServiceRequest");
const ServiceRequestFactory = require("../src/factories/ServiceRequestFactory");
const UserFactory = require("../src/factories/UserFactory");

const student = new StudentRequester("DWU2026001", "Mary", "Kila", "mary.kila@dwu.ac.pg", "BIS", 3);
const tech = new Technician("TECH001", "Ken", "Bais", "ken.bais@dwu.ac.pg", "Networking");

function common(requestId, priority = "High") {
  return { requestId, requester: student, title: `Request ${requestId}`, description: "Details", location: "Library", priority };
}

function makeMixedRequests() {
  return [
    new ICTSupportRequest(common("REQ001"), { deviceType: "Network Equipment", systemName: "DWU-Student Wi-Fi", faultType: "Network", networkImpact: "Campus-wide" }),
    new MaintenanceRequest(common("REQ002"), { building: "Science Block", roomNumber: "S4", hazardLevel: "High", equipmentAffected: "Exposed wiring" }),
    new CleaningRequest(common("REQ003"), { cleaningArea: "Staff room", hygieneRisk: "Low", serviceType: "Routine Cleaning", preferredServiceTime: "Any Time" }),
    new GeneralServiceRequest(common("REQ004"), { serviceNeeded: "Move 20 chairs to the hall" }),
  ];
}

test("T31 - ServiceRequest is abstract-style: required methods throw unless a subclass implements them", () => {
  const plain = new ServiceRequest({ ...common("REQ009"), category: "General Campus Service" });
  assert.throws(() => plain.calculatePriorityScore(), /calculatePriorityScore\(\) must be implemented by a subclass/);
  assert.throws(() => plain.getTargetResolutionHours(), /getTargetResolutionHours\(\) must be implemented by a subclass/);
  assert.throws(() => plain.getRequestSummary(), /getRequestSummary\(\) must be implemented by a subclass/);

  // A subclass that forgets to override is caught too:
  class IncompleteRequest extends ServiceRequest {}
  const incomplete = new IncompleteRequest({ ...common("REQ010"), category: "ICT Support" });
  assert.throws(() => incomplete.getRequestSummary(), /must be implemented by a subclass \(IncompleteRequest\)/);

  // Every real subclass implements all three:
  for (const request of makeMixedRequests()) {
    assert.doesNotThrow(() => request.getRequestSummary());
    assert.strictEqual(typeof request.calculatePriorityScore(), "number");
    assert.strictEqual(typeof request.getTargetResolutionHours(), "number");
  }
});

test("T32 - polymorphism: the same method calls on one array give type-specific results", () => {
  const requests = makeMixedRequests(); // four different classes in ONE collection
  const results = [];
  for (const request of requests) {
    results.push({
      type: request.requestType,
      summaryHeading: request.getRequestSummary().split("\n").find((line) => line.startsWith("--- ")),
      score: request.calculatePriorityScore(),
      hours: request.getTargetResolutionHours(),
    });
  }
  // All are "High" priority (30 points, 24 hours) but each class applies its own rule:
  assert.deepStrictEqual(results, [
    { type: "ICTSupportRequest", summaryHeading: "--- ICT Support Details ---", score: 60, hours: 2 },
    { type: "MaintenanceRequest", summaryHeading: "--- Maintenance Details ---", score: 55, hours: 4 },
    { type: "CleaningRequest", summaryHeading: "--- Cleaning Details ---", score: 30, hours: 24 },
    { type: "GeneralServiceRequest", summaryHeading: "--- General Service Details ---", score: 30, hours: 24 },
  ]);
});

test("T33 - toData() saves common and specialised fields; JSON.stringify alone cannot", () => {
  const [ict] = makeMixedRequests();
  assert.strictEqual(JSON.stringify(ict), "{}"); // private fields are invisible to JSON
  const data = ict.toData();
  assert.strictEqual(data.requestType, "ICTSupportRequest");
  assert.strictEqual(data.requesterId, "DWU2026001");
  assert.strictEqual(data.networkImpact, "Campus-wide");
  assert.strictEqual(data.status, "Submitted");
  assert.strictEqual(data.assignedTechnicianId, null);
  assert.deepStrictEqual(Object.keys(student.toData()), ["userId", "firstName", "lastName", "email", "userType", "programme", "yearLevel"]);
});

test("T34 - factory restores saved data as the correct class with status, Technician and history", () => {
  const users = { DWU2026001: student, TECH001: tech };
  const findUser = (id) => users[id];

  for (const original of makeMixedRequests()) {
    const savedData = JSON.parse(JSON.stringify(original.toData())); // simulate save + load
    const restored = ServiceRequestFactory.createFromData(savedData, findUser, original.history);
    assert.strictEqual(restored.constructor, original.constructor); // same class, not a plain object
    assert.strictEqual(restored.getRequestSummary(), original.getRequestSummary());
    assert.strictEqual(restored.calculatePriorityScore(), original.calculatePriorityScore());
    assert.deepStrictEqual(restored.history, original.history);
  }

  const assigned = ServiceRequestFactory.createFromData(
    { ...makeMixedRequests()[0].toData(), status: "Assigned", assignedTechnicianId: "TECH001" }, findUser, []);
  assert.strictEqual(assigned.status, "Assigned");
  assert.strictEqual(assigned.assignedTechnician, tech);
  assigned.beginWork(tech); // workflow rules still work after restoring
  assert.strictEqual(assigned.status, "In Progress");

  const restoredUser = UserFactory.createFromData(JSON.parse(JSON.stringify(tech.toData())));
  assert.ok(restoredUser instanceof Technician);
});

test("T35 - factory rejects unknown types, missing users and invalid saved data", () => {
  const findUser = (id) => ({ DWU2026001: student, TECH001: tech })[id];
  const good = makeMixedRequests()[0].toData();

  assert.throws(() => ServiceRequestFactory.createFromData({ ...good, requestType: "PizzaRequest" }, findUser), /unknown request type/);
  assert.throws(() => ServiceRequestFactory.createFromData({ ...good, requesterId: "NOBODY" }, findUser), /requester NOBODY not found/);
  assert.throws(() => ServiceRequestFactory.createFromData({ ...good, status: "Lost" }, findUser), /invalid status/);
  assert.throws(() => ServiceRequestFactory.createFromData({ ...good, status: "Assigned" }, findUser), /no assigned Technician/);
  assert.throws(() => ServiceRequestFactory.createFromData({ ...good, networkImpact: "Galaxy" }, findUser), /Invalid network impact/);
  assert.throws(() => UserFactory.createFromData({ userId: "X1", userType: "Pirate" }), /Unknown user type/);
});
