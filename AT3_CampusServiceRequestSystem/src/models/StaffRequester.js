const User = require("./User");
const { requireText } = require("../validation");

/** StaffRequester - a staff member who reports campus problems. */
class StaffRequester extends User {
  #department;

  constructor(userId, firstName, lastName, email, department) {
    super(userId, firstName, lastName, email, "Staff");
    this.department = department;
  }

  get department() { return this.#department; }

  set department(value) {
    this.#department = requireText(value, "Department");
  }

  validate() {
    super.validate();
    requireText(this.#department, "Department");
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()}\nDepartment: ${this.#department}`;
  }

  toData() {
    return {
      ...super.toData(),
      department: this.#department,
    };
  }
}

module.exports = StaffRequester;
