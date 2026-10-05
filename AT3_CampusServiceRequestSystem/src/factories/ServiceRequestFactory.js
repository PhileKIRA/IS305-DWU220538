const ICTSupportRequest = require("../models/ICTSupportRequest");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const CleaningRequest = require("../models/CleaningRequest");
const GeneralServiceRequest = require("../models/GeneralServiceRequest");

// Which class handles each category.
const CLASS_FOR_CATEGORY = {
  "ICT Support": ICTSupportRequest,
  "Facilities Maintenance": MaintenanceRequest,
  "Cleaning and Sanitation": CleaningRequest,
  "General Campus Service": GeneralServiceRequest,
};

/**
 * ServiceRequestFactory - creates the correct ServiceRequest subclass.
 * (In the Distinction stage it will also rebuild requests loaded from JSON.)
 */
class ServiceRequestFactory {
  static createNew(category, commonRequestData, specialisedData = {}) {
    const RequestClass = CLASS_FOR_CATEGORY[category];
    if (!RequestClass) {
      throw new Error(`Unsupported category: ${category}.`);
    }
    return new RequestClass(commonRequestData, specialisedData);
  }
}

module.exports = ServiceRequestFactory;
