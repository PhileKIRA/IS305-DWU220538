const User = require("./User");
const { requireText } = require("../validation");

/**
 * Technician - carries out the work on requests assigned to them
 * (begin work / progress notes / resolve are added in Week 12).
 */
class Technician extends User {
  #technicalSpeciality;

  constructor(userId, firstName, lastName, email, technicalSpeciality) {
    super(userId, firstName, lastName, email, "Technician");
    this.technicalSpeciality = technicalSpeciality;
  }

  get technicalSpeciality() { return this.#technicalSpeciality; }

  set technicalSpeciality(value) {
    this.#technicalSpeciality = requireText(value, "Technical speciality");
  }

  validate() {
    super.validate();
    requireText(this.#technicalSpeciality, "Technical speciality");
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()}\nSpeciality: ${this.#technicalSpeciality}`;
  }

  toData() {
    return {
      ...super.toData(),
      technicalSpeciality: this.#technicalSpeciality,
    };
  }
}

module.exports = Technician;
