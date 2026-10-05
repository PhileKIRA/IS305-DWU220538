const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs/promises");
const path = require("path");

const ServiceRequestManager = require("../src/managers/ServiceRequestManager");
const ServiceRequestFileRepository = require("../src/repositories/ServiceRequestFileRepository");
const UserFileRepository = require("../src/repositories/UserFileRepository");
const ICTSupportRequest = require("../src/models/ICTSupportRequest");
const CleaningRequest = require("../src/models/CleaningRequest");
const StudentRequester = require("../src/models/StudentRequester");
const { makeTempDir, removeDir, registerStandardUsers } = require("./helpers");

// Every test here uses its own temporary folder - the real data/ folder is never touched.

function submitIct(manager, requester) {
  return manager.submitRequest(new ICTSupportRequest(
    { requestId: manager.generateRequestId(), requester, title: "Wi-Fi down", description: "No connection", location: "Library", priority: "High" },
    { deviceType: "Laptop", systemName: "DWU-Student Wi-Fi", faultType: "Network", networkImpact: "Building" }
  ));
}

async function readJson(dir, fileName) {
  return JSON.parse(await fs.readFile(path.join(dir, fileName), "utf8"));
}

test("T36 - saving writes all four JSON files with plain data", async (t) => {
  const dir = await makeTempDir();
  t.after(() => removeDir(dir));

  const manager = ServiceRequestManager.createWithJsonFiles(dir);
  const { student } = registerStandardUsers(manager);
  submitIct(manager, student);
  manager.reviewRequest("REQ001", "OFF001");
  manager.assignTechnician("REQ001", "OFF001", "TECH001");
  assert.strictEqual(await manager.saveChanges(), true);

  const files = (await fs.readdir(dir)).sort();
  assert.deepStrictEqual(files, ["auditLog.json", "requestHistory.json", "serviceRequests.json", "users.json"]);
  assert.strictEqual((await readJson(dir, "users.json")).length, 3);
  const [saved] = await readJson(dir, "serviceRequests.json");
  assert.strictEqual(saved.requestType, "ICTSupportRequest");
  assert.strictEqual(saved.status, "Assigned");
  assert.strictEqual(saved.assignedTechnicianId, "TECH001");
  assert.strictEqual((await readJson(dir, "requestHistory.json")).length, 3);
  assert.ok((await readJson(dir, "auditLog.json")).length >= 6);
  assert.strictEqual(await manager.saveChanges(), false); // nothing new to save
});

test("T37 - loading restores real objects that keep working (restart simulation)", async (t) => {
  const dir = await makeTempDir();
  t.after(() => removeDir(dir));

  const first = ServiceRequestManager.createWithJsonFiles(dir);
  const { student } = registerStandardUsers(first);
  submitIct(first, student);
  first.reviewRequest("REQ001", "OFF001");
  first.assignTechnician("REQ001", "OFF001", "TECH001");
  await first.saveChanges();

  // "Restart": a brand-new manager reading the same folder
  const second = ServiceRequestManager.createWithJsonFiles(dir);
  const result = await second.load();
  assert.deepStrictEqual(result.warnings, []);
  assert.strictEqual(result.users, 3);

  const request = second.findRequestById("REQ001");
  assert.ok(request instanceof ICTSupportRequest);
  assert.strictEqual(request.status, "Assigned");
  assert.strictEqual(request.history.length, 3);
  assert.match(request.getRequestSummary(), /ICT Support Details/);

  // Workflow and role rules still apply after loading:
  assert.throws(() => second.closeRequest("REQ001", "OFF001"), /Invalid status change: Assigned → Closed/);
  second.beginWork("REQ001", "TECH001");
  assert.strictEqual(request.status, "In Progress");
  assert.strictEqual(second.generateRequestId(), "REQ002"); // IDs continue after loaded ones
});

test("T38 - missing and empty data files are treated as empty arrays", async (t) => {
  const dir = await makeTempDir();
  t.after(() => removeDir(dir));

  const manager = ServiceRequestManager.createWithJsonFiles(path.join(dir, "does-not-exist-yet"));
  assert.deepStrictEqual(await manager.load(), { users: 0, requests: 0, auditEntries: 0, warnings: [] });

  await fs.writeFile(path.join(dir, "users.json"), "   \n");
  assert.deepStrictEqual(await new UserFileRepository(dir).loadAll(), []);
});

test("T39 - file read errors give clear messages", async (t) => {
  const dir = await makeTempDir();
  t.after(() => removeDir(dir));

  await fs.writeFile(path.join(dir, "users.json"), "{ this is not json");
  await assert.rejects(new UserFileRepository(dir).loadAll(), /Could not read users\.json: the file is not valid JSON/);

  await fs.writeFile(path.join(dir, "users.json"), '{"userId": "U1"}');
  await assert.rejects(new UserFileRepository(dir).loadAll(), /expected a list \(array\) of records/);

  await assert.rejects(ServiceRequestManager.createWithJsonFiles(dir).load(), /Could not read users\.json/);
});

test("T40 - file write errors give clear messages and keep changes for a retry", async (t) => {
  const dir = await makeTempDir();
  t.after(() => removeDir(dir));

  const notAFolder = path.join(dir, "blocker.txt");
  await fs.writeFile(notAFolder, "this is a file, not a folder");
  const manager = ServiceRequestManager.createWithJsonFiles(notAFolder);
  registerStandardUsers(manager);

  await assert.rejects(manager.saveChanges(), /Could not save users\.json/);
  assert.strictEqual(manager.hasUnsavedChanges, true); // still waiting to be saved
});

test("T41 - invalid or rejected records are never saved; broken saved records are skipped", async (t) => {
  const dir = await makeTempDir();
  t.after(() => removeDir(dir));

  const manager = ServiceRequestManager.createWithJsonFiles(dir);
  const { student } = registerStandardUsers(manager);
  assert.throws(() => manager.registerUser(new StudentRequester("DWU2026001", "Copy", "Cat", "c@dwu.ac.pg", "BIS", 1)), /already exists/);
  assert.throws(() => new CleaningRequest(
    { requestId: "REQ900", requester: student, title: "", description: "x", location: "y" },
    { cleaningArea: "a", hygieneRisk: "Low", serviceType: "Sanitisation", preferredServiceTime: "Morning" }
  ), /Request title is required/);
  submitIct(manager, student);
  await manager.saveChanges();

  assert.strictEqual((await readJson(dir, "users.json")).length, 3); // duplicate not saved
  assert.deepStrictEqual((await readJson(dir, "serviceRequests.json")).map((r) => r.requestId), ["REQ001"]);

  // A saved request pointing at a user that no longer exists is skipped with a warning.
  const requestsRepo = new ServiceRequestFileRepository(dir);
  const [good] = await requestsRepo.loadAll();
  await requestsRepo.saveAll([good, { ...good, requestId: "REQ002", requesterId: "GHOST" }]);
  const result = await ServiceRequestManager.createWithJsonFiles(dir).load();
  assert.strictEqual(result.requests, 1);
  assert.match(result.warnings[0], /Skipped request REQ002: .*requester GHOST not found/);
});

test("T42 - audit trail records actions with all fields, including rejected attempts", async (t) => {
  const dir = await makeTempDir();
  t.after(() => removeDir(dir));

  const manager = ServiceRequestManager.createWithJsonFiles(dir);
  const { student } = registerStandardUsers(manager);
  manager.registerUser(new (require("../src/models/User"))("ADM001", "Ann", "Mek", "ann.mek@dwu.ac.pg", "System Administrator"));
  submitIct(manager, student);
  manager.reviewRequest("REQ001", "OFF001");
  manager.setRequestPriority("REQ001", "OFF001", "Urgent");
  assert.throws(() => manager.assignTechnician("REQ001", "DWU2026001", "TECH001"));
  manager.assignTechnician("REQ001", "OFF001", "TECH001");

  const log = manager.getAuditLog("ADM001");
  const actions = log.map((e) => e.action);
  for (const expected of ["User registration", "Request creation", "Status change (review)", "Priority change", "Technician assignment"]) {
    assert.ok(actions.includes(expected), `missing audit action: ${expected}`);
  }
  const rejected = log.find((e) => e.result.startsWith("Rejected"));
  assert.strictEqual(rejected.actorId, "DWU2026001");
  assert.strictEqual(rejected.actorRole, "Student");
  assert.match(rejected.result, /Only a Service Officer can assign a Technician/);
  assert.deepStrictEqual(Object.keys(log[0]), ["auditId", "actorId", "actorRole", "action", "requestId", "description", "timestamp", "result"]);

  assert.throws(() => manager.getAuditLog("DWU2026001"), /Only a System Administrator or Service Officer/);

  await manager.saveChanges();
  assert.strictEqual((await readJson(dir, "auditLog.json")).length, log.length); // audit is saved too
});

test("T43 - repository search and update methods", async (t) => {
  const dir = await makeTempDir();
  t.after(() => removeDir(dir));

  const repo = new ServiceRequestFileRepository(dir);
  await repo.create({ requestId: "REQ001", requesterId: "U1", assignedTechnicianId: "T1" });
  await repo.create({ requestId: "REQ002", requesterId: "U2", assignedTechnicianId: null });
  await assert.rejects(repo.create({ requestId: "REQ001" }), /already exists/);

  assert.strictEqual((await repo.findById("REQ002")).requesterId, "U2");
  assert.strictEqual(await repo.findById("REQ999"), null);
  assert.deepStrictEqual((await repo.findByRequester("U1")).map((r) => r.requestId), ["REQ001"]);
  assert.deepStrictEqual((await repo.findByTechnician("T1")).map((r) => r.requestId), ["REQ001"]);

  await repo.update("REQ002", { assignedTechnicianId: "T1" });
  assert.strictEqual((await repo.findByTechnician("T1")).length, 2);
  await assert.rejects(repo.update("REQ404", {}), /not found/);
});
