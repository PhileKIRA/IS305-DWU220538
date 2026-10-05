const ServiceRequest = require("./ServiceRequest");
const { ICT_OPTIONS } = require("../constants");
const { requireText, requireOption } = require("../validation");

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
}

module.exports = ICTSupportRequest;
