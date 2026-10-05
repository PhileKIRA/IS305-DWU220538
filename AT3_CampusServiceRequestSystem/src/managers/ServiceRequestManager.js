const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");
const { STATUS } = require("../constants");

/**
 * ServiceRequestManager - stores and manages all users and requests.
 *
 * Pass stage: everything is kept in two JavaScript arrays.
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

  /** Returns e.g. { Submitted: 3, Cancelled: 1 } - every status is listed, even when 0. */
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
