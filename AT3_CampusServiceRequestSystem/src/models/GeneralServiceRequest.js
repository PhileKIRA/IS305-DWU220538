const ServiceRequest = require("./ServiceRequest");
const { requireText } = require("../validation");

/**
 * GeneralServiceRequest - anything that is not ICT, maintenance or cleaning
 * (e.g. furniture moving, signage, event set-up).
 * Needed because ServiceRequest is an abstract-style base class: every category
 * must have its own subclass that implements the required methods.
 */
class GeneralServiceRequest extends ServiceRequest {
  #serviceNeeded;

  /**
   * @param {object} commonRequestData - fields shared by every request
   * @param {object} specialisedData  - { serviceNeeded }
   */
  constructor(commonRequestData, specialisedData = {}) {
    super({ ...commonRequestData, category: "General Campus Service" });
    this.serviceNeeded = specialisedData.serviceNeeded;
  }

  get serviceNeeded() { return this.#serviceNeeded; }

  set serviceNeeded(value) { this.#serviceNeeded = requireText(value, "Service needed"); }

  // ---------- Overridden methods ----------
  validateSpecialisedFields() {
    requireText(this.#serviceNeeded, "Service needed");
    return true;
  }

  /** General requests have no extra risk factor, so they use the priority level only. */
  calculatePriorityScore() {
    return this.getBasePriorityScore();
  }

  getTargetResolutionHours() {
    return this.getBaseTargetHours();
  }

  getRequestSummary() {
    return [
      this.getBaseSummary(),
      "--- General Service Details ---",
      `Service    : ${this.#serviceNeeded}`,
    ].join("\n");
  }

  /** Adds this type's own fields to the common data saved by the base class. */
  toData() {
    return {
      ...super.toData(),
      serviceNeeded: this.#serviceNeeded,
    };
  }
}

module.exports = GeneralServiceRequest;
