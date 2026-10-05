const readline = require("node:readline/promises");
const path = require("node:path");
const { stdin, stdout } = require("node:process");

const ServiceRequestManager = require("./managers/ServiceRequestManager");
const UserFactory = require("./factories/UserFactory");
const ServiceRequestFactory = require("./factories/ServiceRequestFactory");
const {
  USER_TYPES,
  CATEGORIES,
  PRIORITIES,
  STATUS,
  YEAR_LEVELS,
  ICT_OPTIONS,
  MAINTENANCE_OPTIONS,
  CLEANING_OPTIONS,
} = require("./constants");

const LINE = "=".repeat(50);
const EXIT_OPTION = "16";
const DATA_DIR = path.join(__dirname, "..", "data");

/**
 * CampusServiceApp - the console user interface.
 *
 * Its only jobs are: show menus, read input, call the manager, print results.
 * It contains no business rules and NEVER reads or writes files - loading and
 * saving are done by the manager through the repository classes.
 */
class CampusServiceApp {
  #manager;
  #rl;
  #lines;

  constructor(manager = new ServiceRequestManager()) {
    this.#manager = manager;
  }

  async run() {
    this.#rl = readline.createInterface({ input: stdin, output: stdout, terminal: false });
    this.#lines = this.#rl[Symbol.asyncIterator]();

    if (!(await this.#loadData())) {
      this.#rl.close();
      return;
    }
    let running = true;

    while (running) {
      this.#showMenu();
      let choice;
      try {
        choice = (await this.#ask(`Choose an option (1-${EXIT_OPTION}): `)).trim();
      } catch {
        break; // input stream closed (e.g. Ctrl+C or end of piped input)
      }

      try {
        running = await this.#handleChoice(choice);
      } catch (error) {
        // Every invalid action ends here: show a clear message and keep the menu running.
        console.log(`\nError: ${error.message}`);
      }
      await this.#saveData(); // saves only if something changed (including audit entries)
    }

    this.#rl.close();
    console.log("\nThank you for using the Campus Service Request System. Goodbye!");
  }

  #showMenu() {
    console.log(`\n${LINE}`);
    console.log("       CAMPUS SERVICE REQUEST SYSTEM");
    console.log(LINE);
    console.log("1. Register User");
    console.log("2. Submit Service Request");
    console.log("3. View Request by ID");
    console.log("4. View My Requests");
    console.log("5. View All Requests");
    console.log("6. Update My Request");
    console.log("7. Cancel My Request");
    console.log("8. Search Requests");
    console.log("9. View Request Summary");
    console.log("--- Staff workflow ---");
    console.log("10. Service Officer Menu");
    console.log("11. Technician Menu");
    console.log("12. Filter and Sort Requests");
    console.log("13. View Request History");
    console.log("--- Management ---");
    console.log("14. Reports and Audit Log");
    console.log("15. Polymorphism Demonstration");
    console.log(`${EXIT_OPTION}. Exit`);
    console.log(LINE);
  }

  async #handleChoice(choice) {
    switch (choice) {
      case "1": await this.#registerUser(); break;
      case "2": await this.#submitRequest(); break;
      case "3": await this.#viewRequestById(); break;
      case "4": await this.#viewMyRequests(); break;
      case "5": this.#viewAllRequests(); break;
      case "6": await this.#updateMyRequest(); break;
      case "7": await this.#cancelMyRequest(); break;
      case "8": await this.#searchRequests(); break;
      case "9": this.#viewSummary(); break;
      case "10": await this.#serviceOfficerMenu(); break;
      case "11": await this.#technicianMenu(); break;
      case "12": await this.#filterAndSort(); break;
      case "13": await this.#viewHistory(); break;
      case "14": await this.#reportsMenu(); break;
      case "15": this.#polymorphismDemo(); break;
      case EXIT_OPTION: return false;
      default: console.log(`\nError: Please choose a number from 1 to ${EXIT_OPTION}.`);
    }
    return true;
  }

  // ---------- Menu actions ----------
  async #registerUser() {
    console.log("\n--- Register User ---");
    const userId = await this.#ask("User ID (e.g. DWU2026001): ");
    const firstName = await this.#ask("First name: ");
    const lastName = await this.#ask("Last name: ");
    const email = await this.#ask("Email address: ");
    const userType = await this.#chooseFromList("User type", USER_TYPES);
    const specialised = await this.#askUserDetails(userType);

    const user = UserFactory.createUser(userType, { userId, firstName, lastName, email }, specialised);
    this.#manager.registerUser(user);
    console.log(`\nUser registered successfully.\n${user.displayInfo()}`);
  }

  async #submitRequest() {
    console.log("\n--- Submit Service Request ---");
    const requester = await this.#askForRegisteredUser();
    const category = await this.#chooseFromList("Category", CATEGORIES);
    const title = await this.#ask("Title: ");
    const description = await this.#ask("Description: ");
    const location = await this.#ask("Campus location (e.g. Library Level 2): ");
    const priority = await this.#chooseFromList("Priority", PRIORITIES, "Normal");
    const specialised = await this.#askRequestDetails(category);

    const request = ServiceRequestFactory.createNew(
      category,
      { requestId: this.#manager.generateRequestId(), requester, title, description, location, priority },
      specialised
    );
    this.#manager.submitRequest(request);
    console.log(`\nRequest ${request.requestId} submitted successfully.\n`);
    console.log(request.getRequestSummary());
  }

  async #viewRequestById() {
    const requestId = await this.#ask("\nRequest ID: ");
    const request = this.#manager.findRequestById(requestId);
    if (!request) {
      throw new Error("Request not found.");
    }
    console.log(`\n${request.getRequestSummary()}`);
  }

  async #viewMyRequests() {
    const userId = await this.#ask("\nYour user ID: ");
    this.#printRequestList(this.#manager.getRequestsByUser(userId), "My Requests");
  }

  #viewAllRequests() {
    this.#printRequestList(this.#manager.getAllRequests(), "All Requests");
  }

  async #updateMyRequest() {
    console.log("\n--- Update My Request ---");
    const userId = await this.#ask("Your user ID: ");
    const requestId = await this.#ask("Request ID: ");
    const request = this.#findRequestForUser(requestId, userId, "update");

    console.log("\nPress Enter to keep the current value.");
    const changes = {};
    const title = await this.#ask(`Title [${request.title}]: `);
    if (title.trim()) changes.title = title;
    const description = await this.#ask(`Description [${request.description}]: `);
    if (description.trim()) changes.description = description;
    const location = await this.#ask(`Location [${request.location}]: `);
    if (location.trim()) changes.location = location;
    const priority = await this.#chooseFromList(`Priority [${request.priority}]`, PRIORITIES, null);
    if (priority) changes.priority = priority;

    this.#manager.updateRequest(requestId, userId, changes);
    console.log(`\nRequest ${request.requestId} updated successfully.\n`);
    console.log(request.getRequestSummary());
  }

  async #cancelMyRequest() {
    console.log("\n--- Cancel My Request ---");
    const userId = await this.#ask("Your user ID: ");
    const requestId = await this.#ask("Request ID: ");
    this.#findRequestForUser(requestId, userId, "cancel");
    const confirm = await this.#ask("Are you sure you want to cancel this request? (y/n): ");
    if (confirm.trim().toLowerCase() !== "y") {
      console.log("\nCancellation stopped. The request was not changed.");
      return;
    }
    const request = this.#manager.cancelRequest(requestId, userId);
    console.log(`\nRequest ${request.requestId} is now ${request.status}.`);
  }

  async #searchRequests() {
    const text = await this.#ask("\nEnter a request ID or part of a title: ");
    this.#printRequestList(this.#manager.searchRequests(text), `Search results for "${text.trim()}"`);
  }

  #viewSummary() {
    const summary = this.#manager.getRequestSummaryByStatus();
    const total = Object.values(summary).reduce((sum, count) => sum + count, 0);
    console.log("\n--- Request Summary by Status ---");
    for (const [status, count] of Object.entries(summary)) {
      console.log(`${status.padEnd(12)}: ${count}`);
    }
    console.log(`${"Total".padEnd(12)}: ${total}`);
  }

  // ---------- Distinction: loading and saving (through the manager) ----------
  async #loadData() {
    try {
      const result = await this.#manager.load();
      console.log(`\nLoaded ${result.users} users, ${result.requests} requests and ${result.auditEntries} audit entries.`);
      for (const warning of result.warnings) {
        console.log(`Warning: ${warning}`);
      }
      return true;
    } catch (error) {
      // Stop rather than continue with empty data - continuing could overwrite the files.
      console.log(`\nError: ${error.message}`);
      console.log("The program has stopped so that your data files are not overwritten. Please fix or restore the file and try again.");
      return false;
    }
  }

  async #saveData() {
    try {
      await this.#manager.saveChanges();
    } catch (error) {
      console.log(`\nError: ${error.message}`);
      console.log("Your changes are still in memory and will be saved after your next action.");
    }
  }

  // ---------- Distinction: reports, audit log and polymorphism ----------
  async #reportsMenu() {
    const viewerId = await this.#ask("\nSystem Administrator or Service Officer user ID: ");
    this.#manager.checkCanViewReports(viewerId);
    const choice = await this.#chooseFromList("Show", ["Management reports", "Audit log", "Back to main menu"]);
    if (choice === "Management reports") this.#printReports(this.#manager.getManagementReports(viewerId));
    if (choice === "Audit log") this.#printAuditLog(this.#manager.getAuditLog(viewerId));
  }

  #printReports(report) {
    const printCounts = (title, counts) => {
      console.log(`\n${title}`);
      for (const [key, count] of Object.entries(counts)) console.log(`  ${key.padEnd(26)}${count}`);
    };
    console.log("\n================ MANAGEMENT REPORTS ================");
    printCounts("1. Requests by status", report.byStatus);
    printCounts("2. Requests by category", report.byCategory);
    printCounts("3. Requests by priority", report.byPriority);

    console.log(`\n4. Urgent open requests (${report.urgent.length})`);
    report.urgent.forEach((r) => console.log(`  ${r.requestId}  score ${r.calculatePriorityScore()}  ${r.status.padEnd(12)} ${r.title}`));

    console.log(`\n5. Overdue requests (${report.overdue.length})`);
    report.overdue.forEach((row) =>
      console.log(`  ${row.request.requestId}  open ${row.hoursOpen}h, target ${row.targetHours}h, overdue by ${row.hoursOverdue}h  ${row.request.title}`));

    console.log("\n6. Requests assigned to each Technician");
    const perTech = Object.entries(report.perTechnician);
    if (perTech.length === 0) console.log("  (none)");
    perTech.forEach(([id, t]) => console.log(`  ${id.padEnd(9)}${t.name.padEnd(18)}total ${t.total}, open ${t.open}`));

    console.log("\n7. Completed requests by Technician");
    const completed = Object.entries(report.completedByTechnician);
    if (completed.length === 0) console.log("  (none)");
    completed.forEach(([id, t]) => console.log(`  ${id.padEnd(9)}${t.name.padEnd(18)}${t.completed} completed`));

    const average = report.averageResolutionHours;
    console.log(`\n8. Average resolution time: ${average === null ? "no resolved requests yet" : `${average} hours`}`);

    console.log("\n9. Request volume by campus location");
    if (report.byLocation.length === 0) console.log("  (none)");
    report.byLocation.forEach((row) => console.log(`  ${row.location.padEnd(26)}${row.count}`));
  }

  #printAuditLog(entries) {
    console.log(`\n--- Audit Log (${entries.length} entries, newest last) ---`);
    for (const e of entries) {
      console.log(`${e.auditId}  ${e.timestamp}  ${e.actorId} (${e.actorRole})  ${e.action}  ${e.requestId ?? "-"}`);
      console.log(`         ${e.description} → ${e.result}`);
    }
  }

  /**
   * POLYMORPHISM: the same three method calls are made on every request in ONE
   * array. Each object runs its OWN class's version, so ICT, maintenance,
   * cleaning and general requests give different scores, targets and summaries.
   */
  #polymorphismDemo() {
    const requests = this.#manager.getAllRequests();
    console.log(`\n--- Polymorphism Demonstration (${requests.length} requests in one array) ---`);
    if (requests.length === 0) {
      console.log("No requests yet. Submit some requests of different types first.");
      return;
    }
    for (const request of requests) {
      console.log(`\n>>> ${request.requestId}  (class: ${request.requestType})`);
      console.log(request.getRequestSummary());
      console.log(`calculatePriorityScore()   = ${request.calculatePriorityScore()}`);
      console.log(`getTargetResolutionHours() = ${request.getTargetResolutionHours()}`);
    }
  }

  // ---------- Credit: staff workflow menus ----------
  async #serviceOfficerMenu() {
    const officerId = await this.#ask("\nService Officer user ID: ");
    const options = [
      "Review a Submitted request",
      "Set request priority",
      "Assign a Technician",
      "Verify and close a Resolved request",
      "View requests waiting for action",
      "Back to main menu",
    ];
    const action = await this.#chooseFromList("Service Officer actions", options);

    if (action === options[4]) {
      this.#printRequestList(this.#manager.filterRequests({ status: "Submitted" }), "Submitted (waiting for review)");
      this.#printRequestList(this.#manager.filterRequests({ status: "Reviewed" }), "Reviewed (waiting for assignment)");
      this.#printRequestList(this.#manager.filterRequests({ status: "Resolved" }), "Resolved (waiting for closure)");
      return;
    }
    if (action === options[5]) return;

    const requestId = await this.#ask("Request ID: ");
    let request;
    if (action === options[0]) {
      const comment = await this.#ask("Review comment (Enter to skip): ");
      request = this.#manager.reviewRequest(requestId, officerId, comment.trim() || undefined);
    } else if (action === options[1]) {
      const priority = await this.#chooseFromList("New priority", PRIORITIES);
      request = this.#manager.setRequestPriority(requestId, officerId, priority);
    } else if (action === options[2]) {
      this.#printTechnicians();
      const technicianId = await this.#ask("Technician user ID: ");
      request = this.#manager.assignTechnician(requestId, officerId, technicianId);
    } else {
      const comment = await this.#ask("Verification comment (Enter to skip): ");
      request = this.#manager.closeRequest(requestId, officerId, comment.trim() || undefined);
    }
    console.log(`\nDone. ${request.requestId} is now ${request.status} (priority ${request.priority}).`);
  }

  async #technicianMenu() {
    const technicianId = await this.#ask("\nTechnician user ID: ");
    const options = ["View my assigned requests", "Begin work", "Add progress note", "Resolve request", "Back to main menu"];
    const action = await this.#chooseFromList("Technician actions", options);

    if (action === options[0]) {
      this.#printRequestList(this.#manager.getRequestsByTechnician(technicianId), `Requests assigned to ${technicianId.trim()}`);
      return;
    }
    if (action === options[4]) return;

    const requestId = await this.#ask("Request ID: ");
    let request;
    if (action === options[1]) {
      request = this.#manager.beginWork(requestId, technicianId);
    } else if (action === options[2]) {
      const note = await this.#ask("Progress note: ");
      request = this.#manager.addProgressNote(requestId, technicianId, note);
    } else {
      const comment = await this.#ask("Resolution comment (Enter to skip): ");
      request = this.#manager.resolveRequest(requestId, technicianId, comment.trim() || undefined);
    }
    console.log(`\nDone. ${request.requestId} is now ${request.status}.`);
  }

  async #filterAndSort() {
    console.log("\n--- Filter and Sort Requests ---");
    const filterBy = await this.#chooseFromList("Filter by", ["No filter (all requests)", "Category", "Status", "Priority", "Assigned Technician"]);
    const criteria = {};
    if (filterBy === "Category") criteria.category = await this.#chooseFromList("Category", CATEGORIES);
    if (filterBy === "Status") criteria.status = await this.#chooseFromList("Status", Object.values(STATUS));
    if (filterBy === "Priority") criteria.priority = await this.#chooseFromList("Priority", PRIORITIES);
    if (filterBy === "Assigned Technician") {
      this.#printTechnicians();
      criteria.technicianId = await this.#ask("Technician user ID: ");
    }

    const sortChoices = {
      "Date submitted (oldest first)": "date",
      "Date submitted (newest first)": "date-desc",
      "Priority (most urgent first)": "priority",
    };
    const sortLabel = await this.#chooseFromList("Sort by", Object.keys(sortChoices));
    const results = this.#manager.sortRequests(this.#manager.filterRequests(criteria), sortChoices[sortLabel]);
    this.#printRequestList(results, `${filterBy}, sorted by ${sortLabel.toLowerCase()}`);
  }

  async #viewHistory() {
    const requestId = await this.#ask("\nRequest ID: ");
    const history = this.#manager.getRequestHistory(requestId);
    console.log(`\n--- History for ${requestId.trim().toUpperCase()} (${history.length} entries) ---`);
    history.forEach((entry, index) => {
      const change = entry.previousStatus ? `${entry.previousStatus} → ${entry.newStatus}` : entry.newStatus;
      console.log(`${index + 1}. ${entry.timestamp}  ${entry.action}  [${change}]`);
      console.log(`   by ${entry.actorId} (${entry.actorRole}): ${entry.comment}`);
    });
  }

  #printTechnicians() {
    const technicians = this.#manager.getAllUsers().filter((user) => user.userType === "Technician");
    console.log("Registered Technicians:");
    if (technicians.length === 0) console.log("  (none - register a Technician first)");
    technicians.forEach((t) => console.log(`  ${t.userId} - ${t.getFullName()} (${t.technicalSpeciality})`));
  }

  // ---------- Input/output helpers ----------
  // Reads one line of input. The async iterator queues lines, so input that is
  // typed (or pasted/piped) quickly is never lost.
  async #ask(question) {
    stdout.write(question);
    const { value, done } = await this.#lines.next();
    if (done) {
      throw new Error("Input closed.");
    }
    return value;
  }

  async #askForRegisteredUser() {
    const userId = await this.#ask("Your user ID: ");
    const user = this.#manager.findUserById(userId);
    if (!user) {
      throw new Error("User not found. Please register first (option 1).");
    }
    console.log(`Welcome, ${user.getFullName()}.`);
    return user;
  }

  // Asks for the extra fields that each user type needs.
  async #askUserDetails(userType) {
    switch (userType) {
      case "Student":
        return {
          programme: await this.#ask("Programme (e.g. Bachelor of Information Systems): "),
          yearLevel: await this.#chooseFromList("Year level", YEAR_LEVELS),
        };
      case "Staff":
        return { department: await this.#ask("Department: ") };
      case "Service Officer":
        return { serviceSection: await this.#ask("Service section (e.g. ICT Services): ") };
      case "Technician":
        return { technicalSpeciality: await this.#ask("Technical speciality (e.g. Networking): ") };
      default:
        return {};
    }
  }

  // Asks for the extra fields that each request category needs.
  async #askRequestDetails(category) {
    console.log(`\n--- ${category} details ---`);
    switch (category) {
      case "ICT Support":
        return {
          deviceType: await this.#chooseFromList("Device type", ICT_OPTIONS.deviceTypes),
          systemName: await this.#ask("System or software name (e.g. Moodle, DWU-Student Wi-Fi): "),
          faultType: await this.#chooseFromList("Fault type", ICT_OPTIONS.faultTypes),
          networkImpact: await this.#chooseFromList("Network impact", ICT_OPTIONS.networkImpacts),
        };
      case "Facilities Maintenance":
        return {
          building: await this.#ask("Building: "),
          roomNumber: await this.#ask("Room number: "),
          hazardLevel: await this.#chooseFromList("Hazard level", MAINTENANCE_OPTIONS.hazardLevels),
          equipmentAffected: await this.#ask("Equipment affected (e.g. ceiling fan): "),
        };
      case "Cleaning and Sanitation":
        return {
          cleaningArea: await this.#ask("Cleaning area (e.g. Block B toilets): "),
          hygieneRisk: await this.#chooseFromList("Hygiene risk", CLEANING_OPTIONS.hygieneRisks),
          serviceType: await this.#chooseFromList("Service type", CLEANING_OPTIONS.serviceTypes),
          preferredServiceTime: await this.#chooseFromList("Preferred service time", CLEANING_OPTIONS.serviceTimes),
        };
      default:
        return { serviceNeeded: await this.#ask("Service needed (e.g. move 20 chairs to the hall): ") };
    }
  }

  // Checks early (before asking for more input) that the user exists, the
  // request exists, and this user is allowed to change it.
  #findRequestForUser(requestId, userId, action) {
    const user = this.#manager.findUserById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    const request = this.#manager.findRequestById(requestId);
    if (!request) {
      throw new Error("Request not found.");
    }
    request.checkCanModify(user.userId, action);
    return request;
  }

  /**
   * Shows a numbered list and returns the chosen value.
   * defaultValue: returned when the user just presses Enter
   * (undefined = an answer is required, null = "keep current value").
   */
  async #chooseFromList(label, options, defaultValue = undefined) {
    console.log(`${label}:`);
    options.forEach((option, index) => console.log(`  ${index + 1}. ${option}`));
    const hint = defaultValue ? ` (Enter = ${defaultValue})` : defaultValue === null ? " (Enter = keep)" : "";
    const answer = (await this.#ask(`Choose 1-${options.length}${hint}: `)).trim();

    if (answer === "" && defaultValue !== undefined) {
      return defaultValue;
    }
    const index = Number(answer) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= options.length) {
      throw new Error(`Unsupported ${label.split(" [")[0].toLowerCase()}. Please choose a number from 1 to ${options.length}.`);
    }
    return options[index];
  }

  #printRequestList(requests, heading) {
    console.log(`\n--- ${heading} (${requests.length}) ---`);
    if (requests.length === 0) {
      console.log("No requests found.");
      return;
    }
    console.log(`${"ID".padEnd(8)}${"Status".padEnd(13)}${"Priority".padEnd(10)}${"Score".padEnd(7)}${"Category".padEnd(25)}${"Technician".padEnd(12)}Title`);
    for (const r of requests) {
      const tech = r.assignedTechnician ? r.assignedTechnician.userId : "-";
      console.log(
        `${r.requestId.padEnd(8)}${r.status.padEnd(13)}${r.priority.padEnd(10)}${String(r.calculatePriorityScore()).padEnd(7)}` +
        `${r.category.padEnd(25)}${tech.padEnd(12)}${r.title}`
      );
    }
  }
}

// Start the menu only when this file is run directly (node src/CampusServiceApp.js),
// not when it is imported by a test.
if (require.main === module) {
  const manager = ServiceRequestManager.createWithJsonFiles(DATA_DIR);
  new CampusServiceApp(manager).run();
}

module.exports = CampusServiceApp;
