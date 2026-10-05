const User = require("./User");
const { CATEGORIES, PRIORITIES, STATUS } = require("../constants");
const { requireText } = require("../validation");

/**
 * ServiceRequest - one campus service problem reported by a requester.
 * Base class for ICTSupportRequest, MaintenanceRequest, CleaningRequest and
 * GeneralServiceRequest.
 *
 * Encapsulation: all fields are private. Status can NOT be set from outside;
 * it only changes through controlled methods such as cancelRequest().
 *
 * Association: a request holds a reference to the User object who submitted
 * it (#requester), not just their ID.
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
   * Subclasses call super(commonRequestData) and supply their own category.
   */
  constructor(data = {}) {
    if (!(data.requester instanceof User)) {
      throw new Error("A valid requester (User object) is required.");
    }

    this.#requestId = requireText(data.requestId, "Request ID");
    this.#requester = data.requester;
    this.title = data.title; // setters validate each value
    this.description = data.description;
    this.location = data.location;
    this.priority = data.priority ?? "Normal";

    // Category is set once and has no setter: an ICT request must stay an ICT request.
    if (!CATEGORIES.includes(data.category)) {
      throw new Error(`Unsupported category. Choose one of: ${CATEGORIES.join(", ")}.`);
    }
    this.#category = data.category;

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

  /** The class name, e.g. "ICTSupportRequest" - shown in summaries. */
  get requestType() { return this.constructor.name; }

  // ---------- Controlled setters ----------
  // There is deliberately NO setter for requestId, requester, category, status or dates.
  set title(value) {
    this.#title = requireText(value, "Request title");
  }

  set description(value) {
    this.#description = requireText(value, "Request description");
  }

  set location(value) {
    this.#location = requireText(value, "Campus location");
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
    requireText(this.#title, "Request title");
    requireText(this.#description, "Request description");
    requireText(this.#location, "Campus location");
    if (!CATEGORIES.includes(this.#category)) throw new Error("Unsupported category.");
    if (!PRIORITIES.includes(this.#priority)) throw new Error("Unsupported priority.");
    this.validateSpecialisedFields(); // each subclass overrides this
    return true;
  }

  /** Subclasses override this to check their own fields. The base has none. */
  validateSpecialisedFields() {
    return true;
  }

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

  /**
   * Only the requester may update, and only while the request is Submitted.
   * All new values are checked FIRST; nothing changes unless every value is valid.
   */
  updateDetails(changes, userId) {
    this.checkCanModify(userId, "update");

    const allowedFields = ["title", "description", "location", "priority"];
    const fields = Object.keys(changes ?? {});
    if (fields.length === 0) {
      throw new Error("No changes were provided.");
    }
    for (const field of fields) {
      if (!allowedFields.includes(field)) {
        throw new Error(`The field "${field}" cannot be updated.`);
      }
    }

    // Step 1: check every new value (throws before anything is changed).
    const checked = {
      title: () => requireText(changes.title, "Request title"),
      description: () => requireText(changes.description, "Request description"),
      location: () => requireText(changes.location, "Campus location"),
      priority: () => {
        if (!PRIORITIES.includes(changes.priority)) {
          throw new Error(`Unsupported priority. Choose one of: ${PRIORITIES.join(", ")}.`);
        }
        return changes.priority;
      },
    };
    const newValues = fields.map((field) => [field, checked[field]()]);

    // Step 2: every value is valid, so apply them all.
    for (const [field, value] of newValues) {
      this[field] = value;
    }
    this.#touch();
  }

  cancelRequest(userId) {
    this.checkCanModify(userId, "cancel");
    this.#status = STATUS.CANCELLED;
    this.#touch();
  }

  /** Common summary lines. Subclasses add their own details after these. */
  getBaseSummary() {
    return [
      `Request ID : ${this.#requestId}`,
      `Type       : ${this.requestType}`,
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

  getRequestSummary() {
    return this.getBaseSummary();
  }

  // ---------- Private helpers ----------
  #touch() {
    this.#dateUpdated = new Date().toISOString();
  }
}

module.exports = ServiceRequest;
