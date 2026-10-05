// Shared test helpers (not a test file itself - no ".test" in the name).
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const StudentRequester = require("../src/models/StudentRequester");
const ServiceOfficer = require("../src/models/ServiceOfficer");
const Technician = require("../src/models/Technician");

/** Makes a brand-new empty folder in the system temp directory. */
async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "at3-test-"));
}

async function removeDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

/** Registers one user of each role on a manager and returns them. */
function registerStandardUsers(manager) {
  return {
    student: manager.registerUser(new StudentRequester("DWU2026001", "Mary", "Kila", "mary.kila@dwu.ac.pg", "BIS", 3)),
    officer: manager.registerUser(new ServiceOfficer("OFF001", "Paul", "Agi", "paul.agi@dwu.ac.pg", "ICT Services")),
    tech: manager.registerUser(new Technician("TECH001", "Ken", "Bais", "ken.bais@dwu.ac.pg", "Networking")),
  };
}

module.exports = { makeTempDir, removeDir, registerStandardUsers };
