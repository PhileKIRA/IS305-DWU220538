const ServiceRequest = require("./ServiceRequest");
const { ICT_OPTIONS } = require("../constants");
const { requireText, requireOption } = require("../validation");

// Extra priority points for how many people the fault affects.
const NETWORK_IMPACT_POINTS = { None: 0, "Single User": 5, Building: 15, "Campus-wide": 30 };

/** ICTSupportRequest - a computer, network, printer or system problem. */
class ICTSupportRequest extends ServiceRequest {
  #deviceType;
  #systemName;
  #faultType;
  #networkImpact;

  /**
   * @param {object} commonRequestData - fields shared by every request
   * @param {object} specialisedData  - { deviceType, systemName, faultType, networkImpact }
   */
  constructor(commonRequestData, specialisedData = {}) {
    // Constructor chaining: the base class validates and stores the common fields.
    super({ ...commonRequestData, category: "ICT Support" });
    this.deviceType = specialisedData.deviceType;
    this.systemName = specialisedData.systemName;
    this.faultType = specialisedData.faultType;
    this.networkImpact = specialisedData.networkImpact;
  }

  get deviceType() { return this.#deviceType; }
  get systemName() { return this.#systemName; }
  get faultType() { return this.#faultType; }
  get networkImpact() { return this.#networkImpact; }

  set deviceType(value) { this.#deviceType = requireOption(value, ICT_OPTIONS.deviceTypes, "Device type"); }
  set systemName(value) { this.#systemName = requireText(value, "System name"); }
  set faultType(value) { this.#faultType = requireOption(value, ICT_OPTIONS.faultTypes, "Fault type"); }
  set networkImpact(value) { this.#networkImpact = requireOption(value, ICT_OPTIONS.networkImpacts, "Network impact"); }

  // ---------- Overridden methods ----------
  validateSpecialisedFields() {
    requireOption(this.#deviceType, ICT_OPTIONS.deviceTypes, "Device type");
    requireText(this.#systemName, "System name");
    requireOption(this.#faultType, ICT_OPTIONS.faultTypes, "Fault type");
    requireOption(this.#networkImpact, ICT_OPTIONS.networkImpacts, "Network impact");
    return true;
  }

  /** Wider network impact affects more people, so it scores higher. */
  calculatePriorityScore() {
    return this.getBasePriorityScore() + NETWORK_IMPACT_POINTS[this.#networkImpact];
  }

  /** A campus-wide outage must be fixed within 2 hours; a building outage within 8. */
  getTargetResolutionHours() {
    if (this.#networkImpact === "Campus-wide") return 2;
    if (this.#networkImpact === "Building") return Math.min(this.getBaseTargetHours(), 8);
    return this.getBaseTargetHours();
  }

  getRequestSummary() {
    return [
      this.getBaseSummary(),
      "--- ICT Support Details ---",
      `Device     : ${this.#deviceType}`,
      `System     : ${this.#systemName}`,
      `Fault type : ${this.#faultType}`,
      `Network    : ${this.#networkImpact} impact`,
    ].join("\n");
  }

  /** Adds this type's own fields to the common data saved by the base class. */
  toData() {
    return {
      ...super.toData(),
      deviceType: this.#deviceType,
      systemName: this.#systemName,
      faultType: this.#faultType,
      networkImpact: this.#networkImpact,
    };
  }
}

module.exports = ICTSupportRequest;
