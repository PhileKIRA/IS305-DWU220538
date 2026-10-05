const { USER_TYPES, EMAIL_PATTERN } = require("../constants");

/**
 * User - a person who uses the Campus Service Request System.
 *
 * Encapsulation: every field is private (#). Code outside this class can
 * only read values through getters and change them through setters that
 * validate first, so a User can never hold invalid data.
 */
class User {
  #userId;
  #firstName;
  #lastName;
  #email;
  #userType;

  constructor(userId, firstName, lastName, email, userType) {
    // userId is set once here and has no setter, so it can never change.
    this.#userId = User.#requireText(userId, "User ID");
    this.firstName = firstName; // goes through the setter -> validated
    this.lastName = lastName;
    this.email = email;

    // userType has no setter either: a StudentRequester must always stay a Student.
    if (!USER_TYPES.includes(userType)) {
      throw new Error(`Invalid user type. Choose one of: ${USER_TYPES.join(", ")}.`);
    }
    this.#userType = userType;
  }

  // ---------- Getters (read-only access) ----------
  get userId() {
    return this.#userId;
  }

  get firstName() {
    return this.#firstName;
  }

  get lastName() {
    return this.#lastName;
  }

  get email() {
    return this.#email;
  }

  get userType() {
    return this.#userType;
  }

  // ---------- Controlled setters (validate before changing) ----------
  set firstName(value) {
    this.#firstName = User.#requireText(value, "First name");
  }

  set lastName(value) {
    this.#lastName = User.#requireText(value, "Last name");
  }

  set email(value) {
    const email = User.#requireText(value, "Email address").toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error("Invalid email address.");
    }
    this.#email = email;
  }

  // ---------- Behaviour ----------
  getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  /**
   * Re-checks every field. The setters already validate, so this returns
   * true for any User that was constructed successfully. It is still useful
   * as a final check before an object is stored (and later, saved to JSON).
   */
  validate() {
    User.#requireText(this.#userId, "User ID");
    User.#requireText(this.#firstName, "First name");
    User.#requireText(this.#lastName, "Last name");
    if (!EMAIL_PATTERN.test(this.#email)) {
      throw new Error("Invalid email address.");
    }
    if (!USER_TYPES.includes(this.#userType)) {
      throw new Error("Invalid user type.");
    }
    return true;
  }

  displayInfo() {
    return [
      `User ID   : ${this.#userId}`,
      `Name      : ${this.getFullName()}`,
      `Email     : ${this.#email}`,
      `User Type : ${this.#userType}`,
    ].join("\n");
  }

  // Private static helper: trims text and rejects empty values.
  static #requireText(value, fieldName) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${fieldName} is required.`);
    }
    return value.trim();
  }
}

module.exports = User;
