const User = require("./User");
const ServiceOfficer = require("./ServiceOfficer");
const Technician = require("./Technician");
const {
  CATEGORIES,
  PRIORITIES,
  STATUS,
  VALID_TRANSITIONS,
  PRIORITY_POINTS,
  BASE_TARGET_HOURS,
} = require("../constants");
const { requireText } = require("../validation");

/**
 * ServiceRequest - one campus service problem reported by a requester.
 *
 * ABSTRACT-STYLE BASE CLASS: it holds everything all requests share, but it
 * does not know how to score, time or summarise a request. Those three
 * methods throw an error here and MUST be implemented by each subclass
 * (ICTSupportRequest, MaintenanceRequest, CleaningRequest, GeneralServiceRequest).
 *
 * Encapsulation: all fields are private. Status can NOT be set from outside;
 * it only changes through workflow methods (review, assignTechnician, ...),
 * which all go through #changeStatus() and the VALID_TRANSITIONS table.
 *
 * Association: a request refers to its requester and assigned Technician objects.
 * Composition: a request owns its #history entries.
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
  #assignedTechnician = null;
  #history = [];

  /**
   * @param {object} data - common request data:
   *   { requestId, requester, title, description, location, category, priority }
   * Subclasses call super(commonRequestData) and supply their own category.
   *
   * data.savedState is only used by ServiceRequestFactory.createFromData() when a
   * request is loaded from JSON: { status, dateSubmitted, dateUpdated,
   * assignedTechnician, history }. It is validated, and it can only be used
   * while creating a NEW object - an existing request's status still cannot be changed.
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

    if (data.savedState) {
      this.#restoreState(data.savedState);
    } else {
      this.#status = STATUS.SUBMITTED; // default status required by the spec
      this.#dateSubmitted = new Date().toISOString();
      this.#dateUpdated = this.#dateSubmitted;
      this.#addHistory(null, STATUS.SUBMITTED, "Submit request", this.#requester, "Request submitted");
    }
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
  get assignedTechnician() { return this.#assignedTechnician; }

  /** A copy of the history, so callers cannot add or change entries. */
  get history() { return this.#history.map((entry) => ({ ...entry })); }

  /** The class name, e.g. "ICTSupportRequest" - shown in summaries. */
  get requestType() { return this.constructor.name; }

  // ---------- Controlled setters ----------
  // There is deliberately NO setter for requestId, requester, category, status,
  // dates, assignedTechnician or history.
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

  // ---------- Validation ----------
  isOwnedBy(userId) {
    return this.#requester.userId === userId;
  }

  isAssignedTo(userId) {
    return this.#assignedTechnician !== null && this.#assignedTechnician.userId === userId;
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

  // ---------- Requester actions (Pass) ----------
  /**
   * The one place that decides whether a requester may change this request.
   * action is "update" or "cancel". Throws a clear error if not allowed.
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
    this.#changeStatus(STATUS.CANCELLED, "Cancel request", this.#requester, "Cancelled by requester");
  }

  // ---------- Service Officer actions (Credit) ----------
  review(officer, comment = "Request reviewed") {
    ServiceRequest.#requireOfficer(officer, "review requests");
    this.#changeStatus(STATUS.REVIEWED, "Review request", officer, comment);
  }

  setPriority(officer, newPriority, comment = "") {
    ServiceRequest.#requireOfficer(officer, "set the priority");
    if (![STATUS.REVIEWED, STATUS.ASSIGNED].includes(this.#status)) {
      throw new Error(`Priority can only be set on Reviewed or Assigned requests (current status: ${this.#status}).`);
    }
    const oldPriority = this.#priority;
    this.priority = newPriority; // setter validates
    this.#addHistory(this.#status, this.#status, "Set priority", officer,
      comment || `Priority changed from ${oldPriority} to ${newPriority}`);
    this.#touch();
  }

  assignTechnician(officer, technician, comment = "") {
    ServiceRequest.#requireOfficer(officer, "assign a Technician");
    if (!(technician instanceof Technician)) {
      throw new Error("Requests can only be assigned to a registered Technician.");
    }
    this.#checkTransition(STATUS.ASSIGNED); // check BEFORE changing the technician
    this.#assignedTechnician = technician;
    this.#changeStatus(STATUS.ASSIGNED, "Assign Technician", officer,
      comment || `Assigned to ${technician.getFullName()} (${technician.userId})`);
  }

  close(officer, comment = "Work verified and request closed") {
    ServiceRequest.#requireOfficer(officer, "close requests");
    this.#changeStatus(STATUS.CLOSED, "Close request", officer, comment);
  }

  // ---------- Technician actions (Credit) ----------
  beginWork(technician, comment = "Work started") {
    this.#requireAssignedTechnician(technician, "start work on");
    this.#changeStatus(STATUS.IN_PROGRESS, "Begin work", technician, comment);
  }

  addProgressNote(technician, note) {
    this.#requireAssignedTechnician(technician, "add progress notes to");
    if (this.#status !== STATUS.IN_PROGRESS) {
      throw new Error(`Progress notes can only be added while work is In Progress (current status: ${this.#status}).`);
    }
    this.#addHistory(this.#status, this.#status, "Progress update", technician, requireText(note, "Progress note"));
    this.#touch();
  }

  resolve(technician, comment = "Work completed") {
    this.#requireAssignedTechnician(technician, "resolve");
    this.#changeStatus(STATUS.RESOLVED, "Resolve request", technician, comment);
  }

  // ---------- Priority and target time ----------
  /** Points for the priority level only. Subclasses add points for their own risks. */
  getBasePriorityScore() {
    return PRIORITY_POINTS[this.#priority];
  }

  /** Hours allowed for the priority level only. Subclasses can shorten this. */
  getBaseTargetHours() {
    return BASE_TARGET_HOURS[this.#priority];
  }

  // ---------- Abstract-style methods: every subclass MUST override these ----------
  calculatePriorityScore() {
    throw new Error(`calculatePriorityScore() must be implemented by a subclass (${this.requestType}).`);
  }

  getTargetResolutionHours() {
    throw new Error(`getTargetResolutionHours() must be implemented by a subclass (${this.requestType}).`);
  }

  getRequestSummary() {
    throw new Error(`getRequestSummary() must be implemented by a subclass (${this.requestType}).`);
  }

  // ---------- Summaries ----------
  /** Common summary lines. Subclasses add their own details after these. */
  getBaseSummary() {
    const technician = this.#assignedTechnician
      ? `${this.#assignedTechnician.getFullName()} (${this.#assignedTechnician.userId})`
      : "Not assigned";
    return [
      `Request ID : ${this.#requestId}`,
      `Type       : ${this.requestType}`,
      `Title      : ${this.#title}`,
      `Requester  : ${this.#requester.getFullName()} (${this.#requester.userId})`,
      `Category   : ${this.#category}`,
      `Location   : ${this.#location}`,
      `Priority   : ${this.#priority} (score ${this.calculatePriorityScore()}, target ${this.getTargetResolutionHours()} hours)`,
      `Status     : ${this.#status}`,
      `Technician : ${technician}`,
      `Submitted  : ${this.#dateSubmitted}`,
      `Updated    : ${this.#dateUpdated}`,
      `Details    : ${this.#description}`,
    ].join("\n");
  }

  // ---------- Saving (Distinction) ----------
  /**
   * Plain data for saving to serviceRequests.json. Private fields are not
   * included by JSON.stringify(), so each class lists its own fields here.
   * Subclasses override this and add their specialised fields.
   * The history is saved separately in requestHistory.json.
   */
  toData() {
    return {
      requestId: this.#requestId,
      requestType: this.requestType,
      requesterId: this.#requester.userId,
      title: this.#title,
      description: this.#description,
      location: this.#location,
      category: this.#category,
      priority: this.#priority,
      status: this.#status,
      assignedTechnicianId: this.#assignedTechnician ? this.#assignedTechnician.userId : null,
      dateSubmitted: this.#dateSubmitted,
      dateUpdated: this.#dateUpdated,
    };
  }

  // ---------- Private helpers ----------
  /** Puts a loaded request back into the state it was saved in (checked first). */
  #restoreState({ status, dateSubmitted, dateUpdated, assignedTechnician = null, history = [] }) {
    if (!Object.values(STATUS).includes(status)) {
      throw new Error(`Saved request ${this.#requestId} has an invalid status: ${status}.`);
    }
    if (assignedTechnician !== null && !(assignedTechnician instanceof Technician)) {
      throw new Error(`Saved request ${this.#requestId} is assigned to a user who is not a Technician.`);
    }
    const needsTechnician = [STATUS.ASSIGNED, STATUS.IN_PROGRESS, STATUS.RESOLVED, STATUS.CLOSED].includes(status);
    if (needsTechnician && assignedTechnician === null) {
      throw new Error(`Saved request ${this.#requestId} is ${status} but has no assigned Technician.`);
    }
    if (Number.isNaN(Date.parse(dateSubmitted)) || Number.isNaN(Date.parse(dateUpdated))) {
      throw new Error(`Saved request ${this.#requestId} has an invalid date.`);
    }
    if (!Array.isArray(history)) {
      throw new Error(`Saved request ${this.#requestId} has an invalid history.`);
    }
    this.#status = status;
    this.#dateSubmitted = dateSubmitted;
    this.#dateUpdated = dateUpdated;
    this.#assignedTechnician = assignedTechnician;
    this.#history = history.map((entry) => ({
      previousStatus: entry.previousStatus ?? null,
      newStatus: entry.newStatus,
      action: entry.action,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      comment: entry.comment,
      timestamp: entry.timestamp,
    }));
  }

  /** Throws if moving from the current status to newStatus is not allowed. */
  #checkTransition(newStatus) {
    const allowed = VALID_TRANSITIONS[this.#status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status change: ${this.#status} → ${newStatus} is not allowed.`);
    }
  }

  /** The ONLY place the status changes. Every change is checked and recorded. */
  #changeStatus(newStatus, action, actor, comment) {
    this.#checkTransition(newStatus);
    const previousStatus = this.#status;
    this.#status = newStatus;
    this.#addHistory(previousStatus, newStatus, action, actor, comment);
    this.#touch();
  }

  #addHistory(previousStatus, newStatus, action, actor, comment) {
    this.#history.push({
      previousStatus,
      newStatus,
      action,
      actorId: actor.userId,
      actorRole: actor.userType,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  #requireAssignedTechnician(technician, actionText) {
    if (!(technician instanceof Technician) || !this.isAssignedTo(technician.userId)) {
      throw new Error(`Only the assigned Technician can ${actionText} this request.`);
    }
  }

  static #requireOfficer(user, actionText) {
    if (!(user instanceof ServiceOfficer)) {
      throw new Error(`Only a Service Officer can ${actionText}.`);
    }
  }

  #touch() {
    this.#dateUpdated = new Date().toISOString();
  }
}

module.exports = ServiceRequest;
