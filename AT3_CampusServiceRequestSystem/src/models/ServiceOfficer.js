const User = require("./User");
const { requireText } = require("../validation");

/**
 * ServiceOfficer - reviews requests, sets priority, assigns Technicians and
 * closes resolved requests (the workflow permissions are added in Week 12).
 */
class ServiceOfficer extends User {
  #serviceSection;

  constructor(userId, firstName, lastName, email, serviceSection) {
    super(userId, firstName, lastName, email, "Service Officer");
    this.serviceSection = serviceSection;
  }

  get serviceSection() { return this.#serviceSection; }

  set serviceSection(value) {
    this.#serviceSection = requireText(value, "Service section");
  }

  validate() {
    super.validate();
    requireText(this.#serviceSection, "Service section");
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()}\nSection   : ${this.#serviceSection}`;
  }

  toData() {
    return {
      ...super.toData(),
      serviceSection: this.#serviceSection,
    };
  }
}

module.exports = ServiceOfficer;
