const ServiceRequest = require("./ServiceRequest");
const { MAINTENANCE_OPTIONS } = require("../constants");
const { requireText, requireOption } = require("../validation");

/** MaintenanceRequest - damaged buildings, furniture, plumbing, electrical, etc. */
class MaintenanceRequest extends ServiceRequest {
  #building;
  #roomNumber;
  #hazardLevel;
  #equipmentAffected;

  /**
   * @param {object} commonRequestData - fields shared by every request
   * @param {object} specialisedData  - { building, roomNumber, hazardLevel, equipmentAffected }
   */
  constructor(commonRequestData, specialisedData = {}) {
    super({ ...commonRequestData, category: "Facilities Maintenance" });
    this.building = specialisedData.building;
    this.roomNumber = specialisedData.roomNumber;
    this.hazardLevel = specialisedData.hazardLevel;
    this.equipmentAffected = specialisedData.equipmentAffected;
  }

  get building() { return this.#building; }
  get roomNumber() { return this.#roomNumber; }
  get hazardLevel() { return this.#hazardLevel; }
  get equipmentAffected() { return this.#equipmentAffected; }

  set building(value) { this.#building = requireText(value, "Building"); }
  set roomNumber(value) { this.#roomNumber = requireText(value, "Room number"); }
  set hazardLevel(value) { this.#hazardLevel = requireOption(value, MAINTENANCE_OPTIONS.hazardLevels, "Hazard level"); }
  set equipmentAffected(value) { this.#equipmentAffected = requireText(value, "Equipment affected"); }

  // ---------- Overridden methods ----------
  validateSpecialisedFields() {
    requireText(this.#building, "Building");
    requireText(this.#roomNumber, "Room number");
    requireOption(this.#hazardLevel, MAINTENANCE_OPTIONS.hazardLevels, "Hazard level");
    requireText(this.#equipmentAffected, "Equipment affected");
    return true;
  }

  getRequestSummary() {
    return [
      this.getBaseSummary(),
      "--- Maintenance Details ---",
      `Building   : ${this.#building}`,
      `Room       : ${this.#roomNumber}`,
      `Hazard     : ${this.#hazardLevel}`,
      `Equipment  : ${this.#equipmentAffected}`,
    ].join("\n");
  }
}

module.exports = MaintenanceRequest;
