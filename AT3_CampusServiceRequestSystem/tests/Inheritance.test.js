const test = require("node:test");
const assert = require("node:assert");

const User = require("../src/models/User");
const StudentRequester = require("../src/models/StudentRequester");
const StaffRequester = require("../src/models/StaffRequester");
const ServiceOfficer = require("../src/models/ServiceOfficer");
const Technician = require("../src/models/Technician");
const ServiceRequest = require("../src/models/ServiceRequest");
const ICTSupportRequest = require("../src/models/ICTSupportRequest");
const MaintenanceRequest = require("../src/models/MaintenanceRequest");
const CleaningRequest = require("../src/models/CleaningRequest");
const GeneralServiceRequest = require("../src/models/GeneralServiceRequest");
const UserFactory = require("../src/factories/UserFactory");
const ServiceRequestFactory = require("../src/factories/ServiceRequestFactory");

const student = new StudentRequester("DWU2026001", "Mary", "Kila", "mary.kila@dwu.ac.pg", "Bachelor of Information Systems", 3);

function common(overrides = {}) {
  return {
    requestId: "REQ001",
    requester: student,
    title: "Unable to access campus Wi-Fi",
    description: "Laptop cannot connect to DWU-Student network.",
    location: "Library Level 2",
    priority: "High",
    ...overrides,
  };
}

const ictDetails = { deviceType: "Laptop", systemName: "DWU-Student Wi-Fi", faultType: "Network", networkImpact: "Building" };

test("T17 - user subclass constructors call super(): common fields and user type are set", () => {
  const staff = new StaffRequester("STF001", "Grace", "Tom", "grace.tom@dwu.ac.pg", "Business Studies");
  const officer = new ServiceOfficer("OFF001", "Paul", "Agi", "paul.agi@dwu.ac.pg", "ICT Services");
  const tech = new Technician("TECH001", "Ken", "Bais", "ken.bais@dwu.ac.pg", "Networking");

  for (const user of [student, staff, officer, tech]) {
    assert.ok(user instanceof User); // IS-A User
    assert.strictEqual(user.validate(), true);
  }
  assert.strictEqual(student.userType, "Student");
  assert.strictEqual(student.getFullName(), "Mary Kila"); // inherited method
  assert.strictEqual(student.yearLevel, 3);
  assert.strictEqual(officer.userType, "Service Officer");
  assert.strictEqual(tech.technicalSpeciality, "Networking");
  assert.match(student.displayInfo(), /Programme : Bachelor of Information Systems/); // overridden displayInfo
});

test("T18 - specialised user fields are validated", () => {
  assert.throws(() => new StudentRequester("S1", "A", "B", "a@dwu.ac.pg", "", 2), /Programme is required/);
  assert.throws(() => new StudentRequester("S1", "A", "B", "a@dwu.ac.pg", "BIS", 9), /Year level/);
  assert.throws(() => new StaffRequester("S2", "A", "B", "a@dwu.ac.pg", " "), /Department is required/);
  assert.throws(() => new ServiceOfficer("S3", "A", "B", "a@dwu.ac.pg"), /Service section is required/);
  assert.throws(() => new Technician("S4", "A", "B", "a@dwu.ac.pg", ""), /Technical speciality is required/);
  // Common fields are still validated by the parent constructor:
  assert.throws(() => new Technician("S4", "A", "B", "bad-email", "Electrical"), /Invalid email address/);
});

test("T19 - request subclass constructors call super(commonRequestData) and set their own category", () => {
  const ict = new ICTSupportRequest(common(), ictDetails);
  const maintenance = new MaintenanceRequest(common({ requestId: "REQ002" }), {
    building: "Mary Help Hall", roomNumber: "12", hazardLevel: "High", equipmentAffected: "Ceiling fan",
  });
  const cleaning = new CleaningRequest(common({ requestId: "REQ003" }), {
    cleaningArea: "Block B toilets", hygieneRisk: "Medium", serviceType: "Sanitisation", preferredServiceTime: "Morning",
  });
  const general = new GeneralServiceRequest(common({ requestId: "REQ004" }), { serviceNeeded: "Move 20 chairs" });

  for (const request of [ict, maintenance, cleaning, general]) {
    assert.ok(request instanceof ServiceRequest);
    assert.strictEqual(request.status, "Submitted"); // default from the base constructor
    assert.strictEqual(request.validate(), true);
  }
  assert.strictEqual(ict.category, "ICT Support");
  assert.strictEqual(maintenance.category, "Facilities Maintenance");
  assert.strictEqual(cleaning.category, "Cleaning and Sanitation");
  assert.strictEqual(general.category, "General Campus Service");
});

test("T20 - specialised request fields are validated", () => {
  assert.throws(() => new ICTSupportRequest(common(), { ...ictDetails, deviceType: "Toaster" }), /Invalid device type/);
  assert.throws(() => new ICTSupportRequest(common(), { ...ictDetails, systemName: "" }), /System name is required/);
  assert.throws(
    () => new MaintenanceRequest(common(), { building: "Hall", roomNumber: "1", hazardLevel: "Extreme", equipmentAffected: "Door" }),
    /Invalid hazard level/
  );
  assert.throws(
    () => new CleaningRequest(common(), { cleaningArea: "", hygieneRisk: "Low", serviceType: "Sanitisation", preferredServiceTime: "Morning" }),
    /Cleaning area is required/
  );
  assert.throws(() => new GeneralServiceRequest(common(), {}), /Service needed is required/);
  // Common fields are still checked by the base class:
  assert.throws(() => new ICTSupportRequest(common({ title: "" }), ictDetails), /Request title is required/);
});

test("T21 - specialised summaries display the correct information (overriding)", () => {
  const ict = new ICTSupportRequest(common(), ictDetails);
  const summary = ict.getRequestSummary();
  assert.match(summary, /Type {7}: ICTSupportRequest/);
  assert.match(summary, /--- ICT Support Details ---/);
  assert.match(summary, /Device {5}: Laptop/);
  assert.match(summary, /Network {4}: Building impact/);
  assert.match(summary, /Title {6}: Unable to access campus Wi-Fi/); // common lines still included

  const cleaning = new CleaningRequest(common(), {
    cleaningArea: "Block B toilets", hygieneRisk: "High", serviceType: "Restroom Service", preferredServiceTime: "Any Time",
  });
  assert.match(cleaning.getRequestSummary(), /Hygiene {4}: High risk/);
  assert.doesNotMatch(cleaning.getRequestSummary(), /ICT Support Details/);
});

test("T22 - factories create the correct subclass; type and category cannot be changed", () => {
  const tech = UserFactory.createUser("Technician", { userId: "T1", firstName: "Ken", lastName: "Bais", email: "k@dwu.ac.pg" }, { technicalSpeciality: "Networking" });
  assert.ok(tech instanceof Technician);
  assert.ok(UserFactory.createUser("System Administrator", { userId: "A1", firstName: "Ann", lastName: "Mek", email: "a@dwu.ac.pg" }) instanceof User);
  assert.throws(() => UserFactory.createUser("Visitor", {}), /Unknown user type/);

  const request = ServiceRequestFactory.createNew("ICT Support", common(), ictDetails);
  assert.ok(request instanceof ICTSupportRequest);
  assert.throws(() => ServiceRequestFactory.createNew("Catering", common(), {}), /Unsupported category/);

  // No setters exist for these, so assignment has no effect
  // (it is silently ignored here, or throws a TypeError in strict-mode code).
  student.userType = "Technician";
  request.category = "Cleaning and Sanitation";
  assert.strictEqual(student.userType, "Student");
  assert.strictEqual(request.category, "ICT Support");
});
