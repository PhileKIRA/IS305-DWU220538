const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");
const { STATUS, PRIORITIES } = require("../constants");

/**
 * ServiceRequestManager - stores and manages all users and requests.
 *
 * Everything is kept in two JavaScript arrays.
 * The manager holds the business rules that involve MORE than one object
 * (duplicate IDs, finding records, searching, summaries). Rules about a single
 * request (who may update or cancel it) live inside ServiceRequest itself.
 */
class ServiceRequestManager {
  #users = [];
  #requests = [];
  #nextRequestNumber = 1;

  // ---------- Users ----------
  registerUser(user) {
    if (!(user instanceof User)) {
      throw new Error("Only User objects can be registered.");
    }
    user.validate();
    if (this.findUserById(user.userId)) {
      throw new Error("User ID already exists.");
    }
    this.#users.push(user);
    return user;
  }

  findUserById(userId) {
    const id = String(userId ?? "").trim().toUpperCase();
    return this.#users.find((user) => user.userId.toUpperCase() === id);
  }

  getAllUsers() {
    return [...this.#users]; // a copy, so callers cannot change the real array
  }

  // ---------- Requests ----------
  /** Creates the next free ID: REQ001, REQ002, ... */
  generateRequestId() {
    let id;
    do {
      id = `REQ${String(this.#nextRequestNumber).padStart(3, "0")}`;
      this.#nextRequestNumber++;
    } while (this.findRequestById(id));
    return id;
  }

  submitRequest(request) {
    if (!(request instanceof ServiceRequest)) {
      throw new Error("Only ServiceRequest objects can be submitted.");
    }
    request.validate();
    if (!this.findUserById(request.requester.userId)) {
      throw new Error("The requester must be a registered user.");
    }
    if (this.findRequestById(request.requestId)) {
      throw new Error("Request ID already exists.");
    }
    this.#requests.push(request);
    return request;
  }

  findRequestById(requestId) {
    const id = String(requestId ?? "").trim().toUpperCase();
    return this.#requests.find((request) => request.requestId.toUpperCase() === id);
  }

  getRequestsByUser(userId) {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    return this.#requests.filter((request) => request.isOwnedBy(user.userId));
  }

  getAllRequests() {
    return [...this.#requests];
  }

  updateRequest(requestId, userId, changes) {
    const request = this.#getExistingRequest(requestId);
    const user = this.#getExistingUser(userId);
    request.updateDetails(changes, user.userId); // ownership + status checked here
    return request;
  }

  cancelRequest(requestId, userId) {
    const request = this.#getExistingRequest(requestId);
    const user = this.#getExistingUser(userId);
    request.cancelRequest(user.userId);
    return request;
  }

  /** Case-insensitive search on request ID or title. */
  searchRequests(searchText) {
    const text = String(searchText ?? "").trim().toLowerCase();
    if (text === "") {
      throw new Error("Please enter a request ID or title to search for.");
    }
    return this.#requests.filter(
      (request) =>
        request.requestId.toLowerCase().includes(text) ||
        request.title.toLowerCase().includes(text)
    );
  }

  // ---------- Workflow actions (Credit) ----------
  // Each method finds the objects by ID, then asks the request to perform the
  // action. The request itself checks the role and the status transition.
  reviewRequest(requestId, officerId, comment) {
    const request = this.#getExistingRequest(requestId);
    request.review(this.#getExistingUser(officerId), comment);
    return request;
  }

  setRequestPriority(requestId, officerId, priority, comment) {
    const request = this.#getExistingRequest(requestId);
    request.setPriority(this.#getExistingUser(officerId), priority, comment);
    return request;
  }

  assignTechnician(requestId, officerId, technicianId, comment) {
    const request = this.#getExistingRequest(requestId);
    const officer = this.#getExistingUser(officerId);
    const technician = this.findUserById(technicianId);
    if (!technician) {
      throw new Error("Technician not found.");
    }
    request.assignTechnician(officer, technician, comment);
    return request;
  }

  beginWork(requestId, technicianId, comment) {
    const request = this.#getExistingRequest(requestId);
    request.beginWork(this.#getExistingUser(technicianId), comment);
    return request;
  }

  addProgressNote(requestId, technicianId, note) {
    const request = this.#getExistingRequest(requestId);
    request.addProgressNote(this.#getExistingUser(technicianId), note);
    return request;
  }

  resolveRequest(requestId, technicianId, comment) {
    const request = this.#getExistingRequest(requestId);
    request.resolve(this.#getExistingUser(technicianId), comment);
    return request;
  }

  closeRequest(requestId, officerId, comment) {
    const request = this.#getExistingRequest(requestId);
    request.close(this.#getExistingUser(officerId), comment);
    return request;
  }

  getRequestHistory(requestId) {
    return this.#getExistingRequest(requestId).history;
  }

  getRequestsByTechnician(technicianId) {
    const id = String(technicianId ?? "").trim().toUpperCase();
    return this.#requests.filter((request) => request.assignedTechnician?.userId.toUpperCase() === id);
  }

  // ---------- Filter and sort (Credit) ----------
  /**
   * Returns requests matching every criterion given, e.g.
   * filterRequests({ category: "ICT Support", status: "Assigned" }).
   * Criteria that are left out are ignored.
   */
  filterRequests({ category, status, priority, technicianId } = {}) {
    return this.#requests.filter(
      (request) =>
        (!category || request.category === category) &&
        (!status || request.status === status) &&
        (!priority || request.priority === priority) &&
        (!technicianId || request.isAssignedTo(this.findUserById(technicianId)?.userId))
    );
  }

  /**
   * Returns a NEW sorted array (the original is not changed).
   * sortBy: "date" (oldest first), "date-desc" (newest first) or
   *         "priority" (Urgent first; ties broken by the priority score).
   */
  sortRequests(requests, sortBy = "date") {
    const sorted = [...requests];
    if (sortBy === "date") {
      sorted.sort((a, b) => a.dateSubmitted.localeCompare(b.dateSubmitted));
    } else if (sortBy === "date-desc") {
      sorted.sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted));
    } else if (sortBy === "priority") {
      sorted.sort(
        (a, b) =>
          PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority) ||
          b.calculatePriorityScore() - a.calculatePriorityScore()
      );
    } else {
      throw new Error(`Unknown sort option: ${sortBy}.`);
    }
    return sorted;
  }

  /** Returns e.g. { Submitted: 3, Reviewed: 0, ... } - every status is listed, even when 0. */
  getRequestSummaryByStatus() {
    const startingCounts = Object.fromEntries(Object.values(STATUS).map((status) => [status, 0]));
    return this.#requests.reduce((counts, request) => {
      counts[request.status] = (counts[request.status] ?? 0) + 1;
      return counts;
    }, startingCounts);
  }

  // ---------- Private helpers ----------
  #getExistingRequest(requestId) {
    const request = this.findRequestById(requestId);
    if (!request) {
      throw new Error("Request not found.");
    }
    return request;
  }

  #getExistingUser(userId) {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    return user;
  }
}

module.exports = ServiceRequestManager;
