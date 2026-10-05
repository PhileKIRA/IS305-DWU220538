const User = require("../models/User");
const StudentRequester = require("../models/StudentRequester");
const StaffRequester = require("../models/StaffRequester");
const ServiceOfficer = require("../models/ServiceOfficer");
const Technician = require("../models/Technician");

/**
 * UserFactory - creates the correct User subclass for a user type.
 * The console only says "make me a Technician"; the factory knows which class
 * and which constructor arguments that needs.
 */
class UserFactory {
  /**
   * @param {string} userType   - one of USER_TYPES
   * @param {object} common     - { userId, firstName, lastName, email }
   * @param {object} specialised - fields for that type (see SPECIALISED_FIELDS)
   */
  static createUser(userType, common, specialised = {}) {
    const { userId, firstName, lastName, email } = common;
    switch (userType) {
      case "Student":
        return new StudentRequester(userId, firstName, lastName, email, specialised.programme, specialised.yearLevel);
      case "Staff":
        return new StaffRequester(userId, firstName, lastName, email, specialised.department);
      case "Service Officer":
        return new ServiceOfficer(userId, firstName, lastName, email, specialised.serviceSection);
      case "Technician":
        return new Technician(userId, firstName, lastName, email, specialised.technicalSpeciality);
      case "System Administrator":
        // Administrators only read records and reports, so they need no extra fields.
        return new User(userId, firstName, lastName, email, "System Administrator");
      default:
        throw new Error(`Unknown user type: ${userType}.`);
    }
  }
}

module.exports = UserFactory;
