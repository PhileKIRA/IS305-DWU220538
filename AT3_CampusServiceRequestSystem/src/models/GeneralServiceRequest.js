const ServiceRequest = require("./ServiceRequest");
const { requireText } = require("../validation");

/**
 * GeneralServiceRequest - anything that is not ICT, maintenance or cleaning
 * (e.g. furniture moving, signage, event set-up).
 * Needed so that the "General Campus Service" category has its own class once
 * ServiceRequest becomes an abstract-style base class (Distinction stage).
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

  getRequestSummary() {
    return [
      this.getBaseSummary(),
      "--- General Service Details ---",
      `Service    : ${this.#serviceNeeded}`,
    ].join("\n");
  }
}

module.exports = GeneralServiceRequest;
