const User = require("./User");
const { CATEGORIES, PRIORITIES, STATUS } = require("../constants");

/**
 * ServiceRequest - one campus service problem reported by a requester.
 *
 * Encapsulation: all fields are private. Status can NOT be set from outside;
 * it only changes through controlled methods such as cancelRequest().
 *
 * Composition/association: a request holds a reference to the User object
 * who submitted it (#requester), not just their ID.
 */
class ServiceRequest {
  #requestId;
  #requester;
  #title;
  #description;
  #location;
  #category;
  #priority;
  #status;
  #dateSubmitted;
  #dateUpdated;

  /**
   * @param {object} data - common request data:
   *   { requestId, requester, title, description, location, category, priority }
   * One object is used (instead of 7 separate parameters) so that the
   * specialised subclasses in the Credit stage can call super(commonRequestData).
   */
  constructor(data = {}) {
    if (!(data.requester instanceof User)) {
      throw new Error("A valid requester (User object) is required.");
    }

    this.#requestId = ServiceRequest.#requireText(data.requestId, "Request ID");
    this.#requester = data.requester;
    this.title = data.title; // setters validate each value
    this.description = data.description;
    this.location = data.location;
    this.category = data.category;
    this.priority = data.priority ?? "Normal";

    this.#status = STATUS.SUBMITTED; // default status required by the spec
    this.#dateSubmitted = new Date().toISOString();
    this.#dateUpdated = this.#dateSubmitted;
  }

  // ---------- Getters ----------
  get requestId() { return this.#requestId; }
  get requester() { return this.#requester; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get location() { return this.#location; }
  get category() { return this.#category; }
  get priority() { return this.#priority; }
  get status() { return this.#status; }
  get dateSubmitted() { return this.#dateSubmitted; }
  get dateUpdated() { return this.#dateUpdated; }

  // ---------- Controlled setters ----------
  // There is deliberately NO setter for requestId, requester, status or dates.
  set title(value) {
    this.#title = ServiceRequest.#requireText(value, "Request title");
  }

  set description(value) {
    this.#description = ServiceRequest.#requireText(value, "Request description");
  }

  set location(value) {
    this.#location = ServiceRequest.#requireText(value, "Campus location");
  }

  set category(value) {
    if (!CATEGORIES.includes(value)) {
      throw new Error(`Unsupported category. Choose one of: ${CATEGORIES.join(", ")}.`);
    }
    this.#category = value;
  }

  set priority(value) {
    if (!PRIORITIES.includes(value)) {
      throw new Error(`Unsupported priority. Choose one of: ${PRIORITIES.join(", ")}.`);
    }
    this.#priority = value;
  }

  // ---------- Behaviour ----------
  isOwnedBy(userId) {
    return this.#requester.userId === userId;
  }

  validate() {
    this.#requester.validate();
    ServiceRequest.#requireText(this.#title, "Request title");
    ServiceRequest.#requireText(this.#description, "Request description");
    ServiceRequest.#requireText(this.#location, "Campus location");
    if (!CATEGORIES.includes(this.#category)) throw new Error("Unsupported category.");
    if (!PRIORITIES.includes(this.#priority)) throw new Error("Unsupported priority.");
    return true;
  }

  /**
   * Only the requester may update, and only while the request is Submitted.
   * All new values are checked FIRST; nothing changes unless every value is valid.
   */
  /**
   * The one place that decides whether a user may change this request.
   * action is "update" or "cancel". Throws a clear error if not allowed.
   * The console calls this early so users are not asked for details first.
   */
  checkCanModify(userId, action) {
    if (!this.isOwnedBy(userId)) {
      throw new Error(`Only the requester can ${action} this request.`);
    }
    if (action === "cancel" && this.#status === STATUS.CANCELLED) {
      throw new Error("This request is already cancelled.");
    }
    if (this.#status !== STATUS.SUBMITTED) {
      const verb = action === "cancel" ? "cancelled" : "updated";
      throw new Error(`Only Submitted requests can be ${verb} (current status: ${this.#status}).`);
    }
  }

  updateDetails(changes, userId) {
    this.checkCanModify(userId, "update");

    const allowedFields = ["title", "description", "location", "category", "priority"];
    const fields = Object.keys(changes ?? {});
    if (fields.length === 0) {
      throw new Error("No changes were provided.");
    }
    for (const field of fields) {
      if (!allowedFields.includes(field)) {
        throw new Error(`The field "${field}" cannot be updated.`);
      }
    }

    // Test the changes on a temporary copy so a bad value cannot leave
    // this request half-updated.
    const check = new ServiceRequest({
      requestId: this.#requestId,
      requester: this.#requester,
      title: this.#title,
      description: this.#description,
      location: this.#location,
      category: this.#category,
      priority: this.#priority,
      ...changes,
    });

    for (const field of fields) {
      this[field] = check[field];
    }
    this.#touch();
  }

  cancelRequest(userId) {
    this.checkCanModify(userId, "cancel");
    this.#status = STATUS.CANCELLED;
    this.#touch();
  }

  getRequestSummary() {
    return [
      `Request ID : ${this.#requestId}`,
      `Title      : ${this.#title}`,
      `Requester  : ${this.#requester.getFullName()} (${this.#requester.userId})`,
      `Category   : ${this.#category}`,
      `Location   : ${this.#location}`,
      `Priority   : ${this.#priority}`,
      `Status     : ${this.#status}`,
      `Submitted  : ${this.#dateSubmitted}`,
      `Updated    : ${this.#dateUpdated}`,
      `Details    : ${this.#description}`,
    ].join("\n");
  }

  // ---------- Private helpers ----------
  #touch() {
    this.#dateUpdated = new Date().toISOString();
  }

  static #requireText(value, fieldName) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${fieldName} is required.`);
    }
    return value.trim();
  }
}

module.exports = ServiceRequest;
