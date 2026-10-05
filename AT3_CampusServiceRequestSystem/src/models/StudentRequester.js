const User = require("./User");
const { YEAR_LEVELS } = require("../constants");
const { requireText } = require("../validation");

/**
 * StudentRequester - a student who reports campus problems.
 * Inheritance: a StudentRequester IS-A User, so it gets userId, names, email,
 * getFullName(), etc. from User and only adds what is special to students.
 */
class StudentRequester extends User {
  #programme;
  #yearLevel;

  constructor(userId, firstName, lastName, email, programme, yearLevel) {
    // Constructor chaining: User's constructor runs first and validates the
    // common fields. The user type is fixed to "Student" for this subclass.
    super(userId, firstName, lastName, email, "Student");
    this.programme = programme;
    this.yearLevel = yearLevel;
  }

  get programme() { return this.#programme; }
  get yearLevel() { return this.#yearLevel; }

  set programme(value) {
    this.#programme = requireText(value, "Programme");
  }

  set yearLevel(value) {
    const year = Number(value);
    if (!YEAR_LEVELS.includes(year)) {
      throw new Error(`Year level must be a whole number from 1 to ${YEAR_LEVELS.length}.`);
    }
    this.#yearLevel = year;
  }

  // Overriding: extends the parent's checks with the student-only fields.
  validate() {
    super.validate();
    requireText(this.#programme, "Programme");
    if (!YEAR_LEVELS.includes(this.#yearLevel)) throw new Error("Invalid year level.");
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()}\nProgramme : ${this.#programme}\nYear Level: ${this.#yearLevel}`;
  }
}

module.exports = StudentRequester;
