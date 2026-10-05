const test = require("node:test");
const assert = require("node:assert");

const ReportService = require("../src/services/ReportService");
const ServiceRequestFactory = require("../src/factories/ServiceRequestFactory");
const StudentRequester = require("../src/models/StudentRequester");
const Technician = require("../src/models/Technician");

const student = new StudentRequester("DWU2026001", "Mary", "Kila", "mary.kila@dwu.ac.pg", "BIS", 3);
const ken = new Technician("TECH001", "Ken", "Bais", "ken.bais@dwu.ac.pg", "Networking");
const rose = new Technician("TECH002", "Rose", "Lai", "rose.lai@dwu.ac.pg", "Electrical");
const users = { DWU2026001: student, TECH001: ken, TECH002: rose };

const NOW = new Date("2026-10-06T12:00:00.000Z"); // fixed "current time" so results never change

/** Builds a request with a known submission time, status and (optional) resolution time. */
function makeRequest({ id, type = "GeneralServiceRequest", priority = "Normal", status = "Submitted", tech = null,
  submittedHoursAgo = 1, resolvedAfterHours = null, location = "Library", extra = {} }) {
  const submitted = new Date(NOW - submittedHoursAgo * 3600000).toISOString();
  const history = [{ previousStatus: null, newStatus: "Submitted", action: "Submit request", actorId: "DWU2026001", actorRole: "Student", comment: "", timestamp: submitted }];
  if (resolvedAfterHours !== null) {
    history.push({ previousStatus: "In Progress", newStatus: "Resolved", action: "Resolve request", actorId: tech, actorRole: "Technician", comment: "",
      timestamp: new Date(Date.parse(submitted) + resolvedAfterHours * 3600000).toISOString() });
  }
  const defaults = {
    GeneralServiceRequest: { category: "General Campus Service", serviceNeeded: "Help" },
    ICTSupportRequest: { category: "ICT Support", deviceType: "Laptop", systemName: "Moodle", faultType: "Software", networkImpact: "None" },
    CleaningRequest: { category: "Cleaning and Sanitation", cleaningArea: "Toilets", hygieneRisk: "High", serviceType: "Sanitisation", preferredServiceTime: "Morning" },
  };
  return ServiceRequestFactory.createFromData({
    requestId: id, requestType: type, requesterId: "DWU2026001", title: `Title ${id}`, description: "d", location, priority,
    status, assignedTechnicianId: tech, dateSubmitted: submitted, dateUpdated: submitted, ...defaults[type], ...extra,
  }, (userId) => users[userId], history);
}

function sampleRequests() {
  return [
    makeRequest({ id: "REQ001", type: "ICTSupportRequest", priority: "Urgent", status: "In Progress", tech: "TECH001", submittedHoursAgo: 10 }), // target 8h → overdue 2h
    makeRequest({ id: "REQ002", type: "CleaningRequest", priority: "Low", status: "Submitted", submittedHoursAgo: 3 }), // target 6h → not overdue
    makeRequest({ id: "REQ003", priority: "High", status: "Closed", tech: "TECH001", submittedHoursAgo: 50, resolvedAfterHours: 4, location: "Mary Help Hall" }),
    makeRequest({ id: "REQ004", priority: "Normal", status: "Resolved", tech: "TECH002", submittedHoursAgo: 30, resolvedAfterHours: 8 }),
    makeRequest({ id: "REQ005", priority: "Urgent", status: "Cancelled", submittedHoursAgo: 100 }), // cancelled: never urgent/overdue
    makeRequest({ id: "REQ006", priority: "Low", status: "Reviewed", submittedHoursAgo: 80 }), // target 72h → overdue 8h
  ];
}

test("T44 - reports grouped by status, category and priority (zero counts included)", () => {
  const requests = sampleRequests();
  const byStatus = ReportService.requestsByStatus(requests);
  assert.deepStrictEqual(byStatus, { Submitted: 1, Reviewed: 1, Assigned: 0, "In Progress": 1, Resolved: 1, Closed: 1, Cancelled: 1 });
  assert.deepStrictEqual(ReportService.requestsByCategory(requests), {
    "ICT Support": 1, "Facilities Maintenance": 0, "Cleaning and Sanitation": 1, "General Campus Service": 4,
  });
  assert.deepStrictEqual(ReportService.requestsByPriority(requests), { Low: 2, Normal: 1, High: 1, Urgent: 2 });
});

test("T45 - urgent and overdue reports use open requests only", () => {
  const requests = sampleRequests();
  assert.deepStrictEqual(ReportService.urgentRequests(requests).map((r) => r.requestId), ["REQ001"]);

  const overdue = ReportService.overdueRequests(requests, NOW);
  assert.deepStrictEqual(overdue.map((row) => [row.request.requestId, row.targetHours, row.hoursOverdue]), [
    ["REQ006", 72, 8],
    ["REQ001", 8, 2],
  ]);
});

test("T46 - Technician, resolution time and location reports", () => {
  const requests = sampleRequests();
  assert.deepStrictEqual(ReportService.requestsPerTechnician(requests), {
    TECH001: { name: "Ken Bais", total: 2, open: 1 },
    TECH002: { name: "Rose Lai", total: 1, open: 0 },
  });
  assert.deepStrictEqual(ReportService.completedByTechnician(requests), {
    TECH001: { name: "Ken Bais", completed: 1 },
    TECH002: { name: "Rose Lai", completed: 1 },
  });
  assert.strictEqual(ReportService.averageResolutionHours(requests), 6); // (4 + 8) / 2
  assert.deepStrictEqual(ReportService.volumeByLocation(requests), [
    { location: "Library", count: 5 },
    { location: "Mary Help Hall", count: 1 },
  ]);
});

test("T47 - every report is safe with no requests", () => {
  assert.strictEqual(ReportService.requestsByStatus([]).Submitted, 0);
  assert.deepStrictEqual(ReportService.urgentRequests([]), []);
  assert.deepStrictEqual(ReportService.overdueRequests([], NOW), []);
  assert.deepStrictEqual(ReportService.requestsPerTechnician([]), {});
  assert.deepStrictEqual(ReportService.completedByTechnician([]), {});
  assert.strictEqual(ReportService.averageResolutionHours([]), null);
  assert.deepStrictEqual(ReportService.volumeByLocation([]), []);
});
