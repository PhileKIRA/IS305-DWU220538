const ServiceRequest = require("./ServiceRequest");
const { CLEANING_OPTIONS } = require("../constants");
const { requireText, requireOption } = require("../validation");

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
}

module.exports = CleaningRequest;
