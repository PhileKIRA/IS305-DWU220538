const test = require("node:test");
const assert = require("node:assert");
const User = require("../src/models/User");
const ServiceRequest = require("../src/models/ServiceRequest");
const ServiceRequestManager = require("../src/managers/ServiceRequestManager");

// Builds a fresh manager with two students for each test, so tests never affect each other.
function setup() {
  const manager = new ServiceRequestManager();
  const mary = manager.registerUser(new User("DWU2026001", "Mary", "Kila", "mary.kila@dwu.ac.pg", "Student"));
  const john = manager.registerUser(new User("DWU2026002", "John", "Waim", "john.waim@dwu.ac.pg", "Student"));
  return { manager, mary, john };
}

function newRequest(manager, requester, overrides = {}) {
  return new ServiceRequest({
    requestId: manager.generateRequestId(),
    requester,
    title: "Broken ceiling fan",
    description: "Fan in room 12 does not turn on.",
    location: "Mary Help Hall",
    category: "Facilities Maintenance",
    priority: "Normal",
    ...overrides,
  });
}

test("T08 - valid user registration: user is added successfully", () => {
  const { manager } = setup();
  assert.strictEqual(manager.getAllUsers().length, 2);
  assert.strictEqual(manager.findUserById("dwu2026001").getFullName(), "Mary Kila"); // ID search ignores case
});

test("T09 - duplicate user ID: second user is rejected", () => {
  const { manager } = setup();
  const duplicate = new User("DWU2026001", "Peter", "Sale", "peter@dwu.ac.pg", "Staff");
  assert.throws(() => manager.registerUser(duplicate), /User ID already exists/);
  assert.strictEqual(manager.getAllUsers().length, 2);
});

test("T10 - valid request submission: request is stored with Submitted status", () => {
  const { manager, mary } = setup();
  const request = manager.submitRequest(newRequest(manager, mary));
  assert.strictEqual(request.requestId, "REQ001");
  assert.strictEqual(manager.findRequestById("REQ001").status, "Submitted");
});

test("T11 - invalid request category: request is rejected and not stored", () => {
  const { manager, mary } = setup();
  assert.throws(() => manager.submitRequest(newRequest(manager, mary, { category: "Catering" })), /Unsupported category/);
  assert.strictEqual(manager.getAllRequests().length, 0);
});

test("T12 - duplicate request ID and unregistered requester are rejected", () => {
  const { manager, mary } = setup();
  manager.submitRequest(newRequest(manager, mary, { requestId: "REQ050" }));
  assert.throws(() => manager.submitRequest(newRequest(manager, mary, { requestId: "REQ050" })), /Request ID already exists/);

  const stranger = new User("DWU2026999", "Not", "Registered", "nr@dwu.ac.pg", "Student");
  assert.throws(() => manager.submitRequest(newRequest(manager, stranger)), /registered user/);
});

test("T13 - view requester records: only the selected user's requests are shown", () => {
  const { manager, mary, john } = setup();
  manager.submitRequest(newRequest(manager, mary));
  manager.submitRequest(newRequest(manager, john, { title: "Projector not working" }));
  manager.submitRequest(newRequest(manager, mary, { title: "Wi-Fi down" }));

  const marysRequests = manager.getRequestsByUser("DWU2026001");
  assert.strictEqual(marysRequests.length, 2);
  assert.ok(marysRequests.every((r) => r.requester.userId === "DWU2026001"));
  assert.throws(() => manager.getRequestsByUser("NOBODY"), /User not found/);
});

test("T14 - update request through manager: owner only", () => {
  const { manager, mary } = setup();
  manager.submitRequest(newRequest(manager, mary));

  manager.updateRequest("REQ001", "DWU2026001", { priority: "High" });
  assert.strictEqual(manager.findRequestById("REQ001").priority, "High");
  assert.throws(() => manager.updateRequest("REQ001", "DWU2026002", { priority: "Low" }), /Only the requester can update/);
  assert.throws(() => manager.updateRequest("REQ999", "DWU2026001", { priority: "Low" }), /Request not found/);
});

test("T15 - cancel Submitted request: status changes to Cancelled", () => {
  const { manager, mary } = setup();
  manager.submitRequest(newRequest(manager, mary));

  assert.throws(() => manager.cancelRequest("REQ001", "DWU2026002"), /Only the requester can cancel/);
  manager.cancelRequest("REQ001", "DWU2026001");
  assert.strictEqual(manager.findRequestById("REQ001").status, "Cancelled");
  assert.throws(() => manager.cancelRequest("REQ001", "DWU2026001"), /already cancelled/);
});

test("T16 - search by request ID or title, and summary by status", () => {
  const { manager, mary, john } = setup();
  manager.submitRequest(newRequest(manager, mary, { title: "Wi-Fi down in library" }));
  manager.submitRequest(newRequest(manager, john, { title: "Leaking tap" }));
  manager.cancelRequest("REQ002", "DWU2026002");

  assert.deepStrictEqual(manager.searchRequests("wi-fi").map((r) => r.requestId), ["REQ001"]);
  assert.deepStrictEqual(manager.searchRequests("req002").map((r) => r.requestId), ["REQ002"]);
  assert.throws(() => manager.searchRequests("  "), /enter a request ID or title/);

  assert.deepStrictEqual(manager.getRequestSummaryByStatus(), { Submitted: 1, Cancelled: 1 });
});
