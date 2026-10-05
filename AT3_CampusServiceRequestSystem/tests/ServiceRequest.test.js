const test = require("node:test");
const assert = require("node:assert");
const User = require("../src/models/User");
const ServiceRequest = require("../src/models/ServiceRequest");

const student = new User("DWU2026001", "Mary", "Kila", "mary.kila@dwu.ac.pg", "Student");
const otherStudent = new User("DWU2026002", "John", "Waim", "john.waim@dwu.ac.pg", "Student");

function makeRequest(overrides = {}) {
  return new ServiceRequest({
    requestId: "REQ001",
    requester: student,
    title: "Unable to access campus Wi-Fi",
    description: "Laptop cannot connect to DWU-Student network.",
    location: "Library Level 2",
    category: "ICT Support",
    priority: "High",
    ...overrides,
  });
}

test("T04 - valid request submission is stored with Submitted status", () => {
  const request = makeRequest();
  assert.strictEqual(request.status, "Submitted");
  assert.strictEqual(request.requester.userId, "DWU2026001");
  assert.strictEqual(request.validate(), true);
  assert.match(request.getRequestSummary(), /Unable to access campus Wi-Fi/);
});

test("T05 - invalid request category, priority, title and description are rejected", () => {
  assert.throws(() => makeRequest({ category: "Catering" }), /Unsupported category/);
  assert.throws(() => makeRequest({ priority: "Critical" }), /Unsupported priority/);
  assert.throws(() => makeRequest({ title: "" }), /Request title is required/);
  assert.throws(() => makeRequest({ description: "  " }), /Request description is required/);
  assert.throws(() => makeRequest({ requester: null }), /valid requester/);
});

test("T06 - only the requester can update a Submitted request; bad updates change nothing", () => {
  const request = makeRequest();

  request.updateDetails({ title: "Wi-Fi drops every 5 minutes" }, "DWU2026001");
  assert.strictEqual(request.title, "Wi-Fi drops every 5 minutes");

  assert.throws(
    () => request.updateDetails({ title: "Hacked" }, otherStudent.userId),
    /Only the requester can update/
  );
  assert.throws(
    () => request.updateDetails({ title: "New title", category: "Catering" }, "DWU2026001"),
    /Unsupported category/
  );
  assert.strictEqual(request.title, "Wi-Fi drops every 5 minutes"); // unchanged
  assert.throws(() => request.updateDetails({ status: "Closed" }, "DWU2026001"), /cannot be updated/);
});

test("T07 - cancel Submitted request: owner only, and not twice", () => {
  const request = makeRequest();

  assert.throws(() => request.cancelRequest(otherStudent.userId), /Only the requester can cancel/);

  request.cancelRequest("DWU2026001");
  assert.strictEqual(request.status, "Cancelled");

  assert.throws(() => request.cancelRequest("DWU2026001"), /already cancelled/);
  assert.throws(() => request.updateDetails({ title: "x" }, "DWU2026001"), /Only Submitted requests/);
});
