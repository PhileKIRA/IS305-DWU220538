const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const User = require("./models/User");
const ServiceRequest = require("./models/ServiceRequest");
const ServiceRequestManager = require("./managers/ServiceRequestManager");
const { USER_TYPES, CATEGORIES, PRIORITIES } = require("./constants");

const LINE = "=".repeat(50);

/**
 * CampusServiceApp - the console user interface.
 *
 * Its only jobs are: show menus, read input, call the manager, print results.
 * It contains no business rules, so the same manager could later be used by
 * a different interface (or by the automated tests) without changes.
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
    let running = true;

    while (running) {
      this.#showMenu();
      let choice;
      try {
        choice = (await this.#ask("Choose an option (1-10): ")).trim();
      } catch {
        break; // input stream closed (e.g. Ctrl+C or end of piped input)
      }

      try {
        running = await this.#handleChoice(choice);
      } catch (error) {
        // Every invalid action ends here: show a clear message and keep the menu running.
        console.log(`\nError: ${error.message}`);
      }
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
    console.log("10. Exit");
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
      case "10": return false;
      default: console.log("\nError: Please choose a number from 1 to 10.");
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

    const user = new User(userId, firstName, lastName, email, userType);
    this.#manager.registerUser(user);
    console.log(`\nUser registered successfully.\n${user.displayInfo()}`);
  }

  async #submitRequest() {
    console.log("\n--- Submit Service Request ---");
    const requester = await this.#askForRegisteredUser();
    const title = await this.#ask("Title: ");
    const description = await this.#ask("Description: ");
    const location = await this.#ask("Campus location (e.g. Library Level 2): ");
    const category = await this.#chooseFromList("Category", CATEGORIES);
    const priority = await this.#chooseFromList("Priority", PRIORITIES, "Normal");

    const request = new ServiceRequest({
      requestId: this.#manager.generateRequestId(),
      requester,
      title,
      description,
      location,
      category,
      priority,
    });
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
    const category = await this.#chooseFromList(`Category [${request.category}]`, CATEGORIES, null);
    if (category) changes.category = category;
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
    console.log(`${"ID".padEnd(8)}${"Status".padEnd(12)}${"Priority".padEnd(10)}${"Category".padEnd(26)}Title`);
    for (const r of requests) {
      console.log(`${r.requestId.padEnd(8)}${r.status.padEnd(12)}${r.priority.padEnd(10)}${r.category.padEnd(26)}${r.title}`);
    }
  }
}

// Start the menu only when this file is run directly (node src/CampusServiceApp.js),
// not when it is imported by a test.
if (require.main === module) {
  new CampusServiceApp().run();
}

module.exports = CampusServiceApp;
