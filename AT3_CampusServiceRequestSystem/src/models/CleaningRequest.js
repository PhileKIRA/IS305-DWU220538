const ServiceRequest = require("./ServiceRequest");
const { CLEANING_OPTIONS } = require("../constants");
const { requireText, requireOption } = require("../validation");

// Extra priority points for health risk.
const HYGIENE_POINTS = { Low: 0, Medium: 5, High: 15 };

/** CleaningRequest - cleaning and sanitation of campus areas. */
class CleaningRequest extends ServiceRequest {
  #cleaningArea;
  #hygieneRisk;
  #serviceType;
  #preferredServiceTime;

  /**
   * @param {object} commonRequestData - fields shared by every request
   * @param {object} specialisedData  - { cleaningArea, hygieneRisk, serviceType, preferredServiceTime }
   */
  constructor(commonRequestData, specialisedData = {}) {
    super({ ...commonRequestData, category: "Cleaning and Sanitation" });
    this.cleaningArea = specialisedData.cleaningArea;
    this.hygieneRisk = specialisedData.hygieneRisk;
    this.serviceType = specialisedData.serviceType;
    this.preferredServiceTime = specialisedData.preferredServiceTime;
  }

  get cleaningArea() { return this.#cleaningArea; }
  get hygieneRisk() { return this.#hygieneRisk; }
  get serviceType() { return this.#serviceType; }
  get preferredServiceTime() { return this.#preferredServiceTime; }

  set cleaningArea(value) { this.#cleaningArea = requireText(value, "Cleaning area"); }
  set hygieneRisk(value) { this.#hygieneRisk = requireOption(value, CLEANING_OPTIONS.hygieneRisks, "Hygiene risk"); }
  set serviceType(value) { this.#serviceType = requireOption(value, CLEANING_OPTIONS.serviceTypes, "Service type"); }
  set preferredServiceTime(value) {
    this.#preferredServiceTime = requireOption(value, CLEANING_OPTIONS.serviceTimes, "Preferred service time");
  }

  // ---------- Overridden methods ----------
  validateSpecialisedFields() {
    requireText(this.#cleaningArea, "Cleaning area");
    requireOption(this.#hygieneRisk, CLEANING_OPTIONS.hygieneRisks, "Hygiene risk");
    requireOption(this.#serviceType, CLEANING_OPTIONS.serviceTypes, "Service type");
    requireOption(this.#preferredServiceTime, CLEANING_OPTIONS.serviceTimes, "Preferred service time");
    return true;
  }

  /** Hygiene risks (e.g. blocked toilets) score higher. */
  calculatePriorityScore() {
    return this.getBasePriorityScore() + HYGIENE_POINTS[this.#hygieneRisk];
  }

  /** A high hygiene risk must be cleaned within 6 hours. */
  getTargetResolutionHours() {
    if (this.#hygieneRisk === "High") return Math.min(this.getBaseTargetHours(), 6);
    return this.getBaseTargetHours();
  }

  getRequestSummary() {
    return [
      this.getBaseSummary(),
      "--- Cleaning Details ---",
      `Area       : ${this.#cleaningArea}`,
      `Hygiene    : ${this.#hygieneRisk} risk`,
      `Service    : ${this.#serviceType}`,
      `Preferred  : ${this.#preferredServiceTime}`,
    ].join("\n");
  }

  /** Adds this type's own fields to the common data saved by the base class. */
  toData() {
    return {
      ...super.toData(),
      cleaningArea: this.#cleaningArea,
      hygieneRisk: this.#hygieneRisk,
      serviceType: this.#serviceType,
      preferredServiceTime: this.#preferredServiceTime,
    };
  }
}

module.exports = CleaningRequest;
