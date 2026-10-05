const { STATUS, CATEGORIES, PRIORITIES } = require("../constants");

const HOUR_MS = 60 * 60 * 1000;
const OPEN_STATUSES = [STATUS.SUBMITTED, STATUS.REVIEWED, STATUS.ASSIGNED, STATUS.IN_PROGRESS];
const COMPLETED_STATUSES = [STATUS.RESOLVED, STATUS.CLOSED];

/**
 * ReportService - management reports calculated from an array of requests
 * using filter(), map(), reduce() and sort(). No database query engine.
 *
 * Every method receives the requests array and returns plain results, so the
 * reports can be tested without the console or the JSON files.
 * Every method is safe on an empty array.
 */
class ReportService {
  /** Counts requests by a key. startingKeys makes zero counts appear too. */
  static #countBy(requests, getKey, startingKeys = []) {
    const start = Object.fromEntries(startingKeys.map((key) => [key, 0]));
    return requests.reduce((counts, request) => {
      const key = getKey(request);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, start);
  }

  // 1. Requests grouped by status
  static requestsByStatus(requests) {
    return ReportService.#countBy(requests, (r) => r.status, Object.values(STATUS));
  }

  // 2. Requests grouped by category
  static requestsByCategory(requests) {
    return ReportService.#countBy(requests, (r) => r.category, CATEGORIES);
  }

  // 3. Requests grouped by priority
  static requestsByPriority(requests) {
    return ReportService.#countBy(requests, (r) => r.priority, PRIORITIES);
  }

  // 4. Urgent requests that are still open, highest priority score first
  static urgentRequests(requests) {
    return requests
      .filter((r) => r.priority === "Urgent" && OPEN_STATUSES.includes(r.status))
      .sort((a, b) => b.calculatePriorityScore() - a.calculatePriorityScore());
  }

  /**
   * 5. Overdue requests: still open and open for longer than their target time.
   * getTargetResolutionHours() is polymorphic - each request type sets its own target.
   * @param {Date} now - passed in so tests can use a fixed time
   */
  static overdueRequests(requests, now = new Date()) {
    return requests
      .filter((r) => OPEN_STATUSES.includes(r.status))
      .map((r) => {
        const hoursOpen = (now - new Date(r.dateSubmitted)) / HOUR_MS;
        const targetHours = r.getTargetResolutionHours();
        return { request: r, hoursOpen: Math.round(hoursOpen * 10) / 10, targetHours, hoursOverdue: Math.round((hoursOpen - targetHours) * 10) / 10 };
      })
      .filter((row) => row.hoursOverdue > 0)
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue);
  }

  // 6. Requests assigned to each Technician (open = Assigned or In Progress)
  static requestsPerTechnician(requests) {
    return requests
      .filter((r) => r.assignedTechnician)
      .reduce((report, r) => {
        const tech = r.assignedTechnician;
        report[tech.userId] ??= { name: tech.getFullName(), total: 0, open: 0 };
        report[tech.userId].total += 1;
        if ([STATUS.ASSIGNED, STATUS.IN_PROGRESS].includes(r.status)) report[tech.userId].open += 1;
        return report;
      }, {});
  }

  // 7. Completed (Resolved or Closed) requests by Technician
  static completedByTechnician(requests) {
    return requests
      .filter((r) => r.assignedTechnician && COMPLETED_STATUSES.includes(r.status))
      .reduce((report, r) => {
        const tech = r.assignedTechnician;
        report[tech.userId] ??= { name: tech.getFullName(), completed: 0 };
        report[tech.userId].completed += 1;
        return report;
      }, {});
  }

  /**
   * 8. Average resolution time in hours, from submission to the "Resolved"
   * entry in each request's history. Returns null when nothing has been resolved.
   */
  static averageResolutionHours(requests) {
    const hours = requests
      .map((r) => {
        const resolvedEntry = r.history.find((h) => h.newStatus === STATUS.RESOLVED);
        return resolvedEntry ? (new Date(resolvedEntry.timestamp) - new Date(r.dateSubmitted)) / HOUR_MS : null;
      })
      .filter((value) => value !== null);
    if (hours.length === 0) return null;
    const average = hours.reduce((sum, value) => sum + value, 0) / hours.length;
    return Math.round(average * 10) / 10;
  }

  // 9. Request volume by campus location, busiest first
  static volumeByLocation(requests) {
    const counts = ReportService.#countBy(requests, (r) => r.location);
    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location));
  }
}

module.exports = ReportService;
