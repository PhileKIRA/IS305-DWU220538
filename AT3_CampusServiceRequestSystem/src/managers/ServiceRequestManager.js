const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");
const UserFactory = require("../factories/UserFactory");
const ServiceRequestFactory = require("../factories/ServiceRequestFactory");
const UserFileRepository = require("../repositories/UserFileRepository");
const ServiceRequestFileRepository = require("../repositories/ServiceRequestFileRepository");
const RequestHistoryFileRepository = require("../repositories/RequestHistoryFileRepository");
const AuditFileRepository = require("../repositories/AuditFileRepository");
const ReportService = require("../services/ReportService");
const { STATUS, PRIORITIES } = require("../constants");

/**
 * ServiceRequestManager - the service layer between the console and the objects.
 *
 * - Keeps all users and requests in two JavaScript arrays while the program runs.
 * - Holds rules that involve MORE than one object (duplicate IDs, look-ups,
 *   search, filter, sort). Rules about a single request (roles, status
 *   transitions) live inside ServiceRequest itself.
 * - Records an audit entry for every important action (success or rejected).
 * - Distinction: loads from and saves to JSON files through repositories.
 *   The manager never touches files directly, and neither does the console.
 *
 *   Console  →  ServiceRequestManager  →  domain objects
 *                       ↓↑
 *          factories ← repositories → JSON files
 */
class ServiceRequestManager {
  #users = [];
  #requests = [];
  #auditLog = [];
  #nextRequestNumber = 1;
  #repositories = null; // null = in-memory only (used by the Pass/Credit tests)
  #hasUnsavedChanges = false;

  /**
   * @param {object} [options]
   * @param {object} [options.repositories] - { users, requests, history, audit }
   */
  constructor({ repositories = null } = {}) {
    this.#repositories = repositories;
  }

  /** Creates a manager that saves to the four JSON files in dataDir. */
  static createWithJsonFiles(dataDir) {
    return new ServiceRequestManager({
      repositories: {
        users: new UserFileRepository(dataDir),
        requests: new ServiceRequestFileRepository(dataDir),
        history: new RequestHistoryFileRepository(dataDir),
        audit: new AuditFileRepository(dataDir),
      },
    });
  }

  // ===================== Loading and saving (Distinction) =====================
  /**
   * Loads all JSON files and rebuilds real objects with the factories.
   * Missing files count as empty. Records that cannot be restored are skipped
   * and reported in `warnings` instead of crashing the program.
   */
  async load() {
    if (!this.#repositories) {
      return { users: 0, requests: 0, auditEntries: 0, warnings: [] };
    }
    const { users, requests, history, audit } = this.#repositories;
    const [userData, requestData, historyData, auditData] = await Promise.all([
      users.loadAll(),
      requests.loadAll(),
      history.loadAll(),
      audit.loadAll(),
    ]);

    const warnings = [];
    this.#users = [];
    for (const record of userData) {
      try {
        const user = UserFactory.createFromData(record);
        if (this.findUserById(user.userId)) throw new Error(`duplicate user ID ${user.userId}`);
        this.#users.push(user);
      } catch (error) {
        warnings.push(`Skipped user ${record?.userId ?? "(no ID)"}: ${error.message}`);
      }
    }

    this.#requests = [];
    for (const record of requestData) {
      try {
        const entries = historyData
          .filter((entry) => entry.requestId === record.requestId)
          .sort((a, b) => a.sequence - b.sequence);
        const request = ServiceRequestFactory.createFromData(record, (id) => this.findUserById(id), entries);
        request.validate();
        if (this.findRequestById(request.requestId)) throw new Error(`duplicate request ID ${request.requestId}`);
        this.#requests.push(request);
      } catch (error) {
        warnings.push(`Skipped request ${record?.requestId ?? "(no ID)"}: ${error.message}`);
      }
    }

    this.#auditLog = auditData.filter((entry) => entry && entry.auditId);
    this.#hasUnsavedChanges = false;
    return { users: this.#users.length, requests: this.#requests.length, auditEntries: this.#auditLog.length, warnings };
  }

  get hasUnsavedChanges() {
    return this.#hasUnsavedChanges;
  }

  /**
   * Saves users, requests, history and audit records to their JSON files.
   * Every object is validated first; if any is invalid, NOTHING is written.
   * Returns true if something was saved.
   */
  async saveChanges() {
    if (!this.#repositories || !this.#hasUnsavedChanges) {
      return false;
    }
    for (const user of this.#users) user.validate();
    for (const request of this.#requests) request.validate();

    const historyRecords = this.#requests.flatMap((request) =>
      request.history.map((entry, index) => ({
        historyId: `${request.requestId}-H${String(index + 1).padStart(2, "0")}`,
        requestId: request.requestId,
        sequence: index + 1,
        ...entry,
      }))
    );

    const { users, requests, history, audit } = this.#repositories;
    await users.saveAll(this.#users.map((user) => user.toData()));
    await requests.saveAll(this.#requests.map((request) => request.toData()));
    await history.saveAll(historyRecords);
    await audit.saveAll(this.#auditLog.map((entry) => ({ ...entry })));
    this.#hasUnsavedChanges = false;
    return true;
  }

  // ============================== Users ==============================
  registerUser(user) {
    if (!(user instanceof User)) {
      throw new Error("Only User objects can be registered.");
    }
    return this.#audited(user.userId, "User registration", null, () => {
      user.validate();
      if (this.findUserById(user.userId)) {
        throw new Error("User ID already exists.");
      }
      this.#users.push(user);
      return { result: user, description: `Registered ${user.userType} ${user.getFullName()}` };
    }, user.userType);
  }

  findUserById(userId) {
    const id = String(userId ?? "").trim().toUpperCase();
    return this.#users.find((user) => user.userId.toUpperCase() === id);
  }

  getAllUsers() {
    return [...this.#users]; // a copy, so callers cannot change the real array
  }

  // ============================== Requests ==============================
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
    return this.#audited(request.requester.userId, "Request creation", request.requestId, () => {
      request.validate();
      if (!this.findUserById(request.requester.userId)) {
        throw new Error("The requester must be a registered user.");
      }
      if (this.findRequestById(request.requestId)) {
        throw new Error("Request ID already exists.");
      }
      this.#requests.push(request);
      return { result: request, description: `${request.requestType} "${request.title}" submitted (${request.priority})` };
    });
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
    return this.#audited(userId, "Request update", requestId, () => {
      const request = this.#getExistingRequest(requestId);
      const user = this.#getExistingUser(userId);
      request.updateDetails(changes, user.userId); // ownership + status checked here
      return { result: request, description: `Updated ${Object.keys(changes ?? {}).join(", ")}` };
    });
  }

  cancelRequest(requestId, userId) {
    return this.#audited(userId, "Request cancellation", requestId, () => {
      const request = this.#getExistingRequest(requestId);
      const user = this.#getExistingUser(userId);
      request.cancelRequest(user.userId);
      return { result: request, description: "Status changed from Submitted to Cancelled" };
    });
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

  // ======================= Workflow actions (Credit) =======================
  // Each method finds the objects by ID, then asks the request to perform the
  // action. The request itself checks the role and the status transition.
  reviewRequest(requestId, officerId, comment) {
    return this.#statusAction(officerId, "Status change (review)", requestId, (request, officer) =>
      request.review(officer, comment));
  }

  setRequestPriority(requestId, officerId, priority, comment) {
    return this.#audited(officerId, "Priority change", requestId, () => {
      const request = this.#getExistingRequest(requestId);
      const oldPriority = request.priority;
      request.setPriority(this.#getExistingUser(officerId), priority, comment);
      return { result: request, description: `Priority changed from ${oldPriority} to ${request.priority}` };
    });
  }

  assignTechnician(requestId, officerId, technicianId, comment) {
    return this.#audited(officerId, "Technician assignment", requestId, () => {
      const request = this.#getExistingRequest(requestId);
      const officer = this.#getExistingUser(officerId);
      const technician = this.findUserById(technicianId);
      if (!technician) {
        throw new Error("Technician not found.");
      }
      request.assignTechnician(officer, technician, comment);
      return { result: request, description: `Assigned to ${technician.getFullName()} (${technician.userId}); status Reviewed → Assigned` };
    });
  }

  beginWork(requestId, technicianId, comment) {
    return this.#statusAction(technicianId, "Status change (begin work)", requestId, (request, technician) =>
      request.beginWork(technician, comment));
  }

  addProgressNote(requestId, technicianId, note) {
    return this.#audited(technicianId, "Progress update", requestId, () => {
      const request = this.#getExistingRequest(requestId);
      request.addProgressNote(this.#getExistingUser(technicianId), note);
      return { result: request, description: `Progress note: ${String(note).trim()}` };
    });
  }

  resolveRequest(requestId, technicianId, comment) {
    return this.#statusAction(technicianId, "Request resolution", requestId, (request, technician) =>
      request.resolve(technician, comment));
  }

  closeRequest(requestId, officerId, comment) {
    return this.#statusAction(officerId, "Request closure", requestId, (request, officer) =>
      request.close(officer, comment));
  }

  getRequestHistory(requestId) {
    return this.#getExistingRequest(requestId).history;
  }

  getRequestsByTechnician(technicianId) {
    const id = String(technicianId ?? "").trim().toUpperCase();
    return this.#requests.filter((request) => request.assignedTechnician?.userId.toUpperCase() === id);
  }

  // ========================= Filter and sort (Credit) =========================
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
    return ReportService.requestsByStatus(this.#requests);
  }

  // ===================== Reports and audit log (Distinction) =====================
  /** Only System Administrators and Service Officers may see reports and the audit log. */
  checkCanViewReports(viewerId) {
    const viewer = this.#getExistingUser(viewerId);
    if (!["System Administrator", "Service Officer"].includes(viewer.userType)) {
      throw new Error("Only a System Administrator or Service Officer can view reports and the audit log.");
    }
    return viewer;
  }

  getManagementReports(viewerId, now = new Date()) {
    this.checkCanViewReports(viewerId);
    const requests = this.#requests;
    return {
      byStatus: ReportService.requestsByStatus(requests),
      byCategory: ReportService.requestsByCategory(requests),
      byPriority: ReportService.requestsByPriority(requests),
      urgent: ReportService.urgentRequests(requests),
      overdue: ReportService.overdueRequests(requests, now),
      perTechnician: ReportService.requestsPerTechnician(requests),
      completedByTechnician: ReportService.completedByTechnician(requests),
      averageResolutionHours: ReportService.averageResolutionHours(requests),
      byLocation: ReportService.volumeByLocation(requests),
    };
  }

  getAuditLog(viewerId) {
    this.checkCanViewReports(viewerId);
    return this.#auditLog.map((entry) => ({ ...entry }));
  }

  // ============================ Private helpers ============================
  /**
   * Runs an action and writes ONE audit entry for it: "Success" if it worked,
   * or "Rejected: <reason>" if it threw. The error is then passed on so the
   * console can show it.
   */
  #audited(actorId, action, requestId, work, knownRole = null) {
    const actorRole = knownRole ?? this.findUserById(actorId)?.userType ?? "Unknown user";
    try {
      const { result, description } = work();
      this.#addAuditEntry(actorId, actorRole, action, requestId, description, "Success");
      return result;
    } catch (error) {
      this.#addAuditEntry(actorId, actorRole, action, requestId, `Attempted ${action.toLowerCase()}`, `Rejected: ${error.message}`);
      throw error;
    }
  }

  /** Shortcut for actions that only change the status. */
  #statusAction(actorId, action, requestId, perform) {
    return this.#audited(actorId, action, requestId, () => {
      const request = this.#getExistingRequest(requestId);
      const before = request.status;
      perform(request, this.#getExistingUser(actorId));
      return { result: request, description: `Status changed from ${before} to ${request.status}` };
    });
  }

  #addAuditEntry(actorId, actorRole, action, requestId, description, result) {
    this.#auditLog.push({
      auditId: `AUD${String(this.#auditLog.length + 1).padStart(4, "0")}`,
      actorId: String(actorId ?? "").trim() || "(blank)",
      actorRole,
      action,
      requestId: requestId ? String(requestId).trim().toUpperCase() : null,
      description,
      timestamp: new Date().toISOString(),
      result,
    });
    this.#hasUnsavedChanges = true;
  }

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
