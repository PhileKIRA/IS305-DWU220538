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

// Which class to rebuild for each saved "requestType".
const CLASS_FOR_TYPE = {
  ICTSupportRequest,
  MaintenanceRequest,
  CleaningRequest,
  GeneralServiceRequest,
};

/**
 * ServiceRequestFactory - creates the correct ServiceRequest subclass.
 *
 * createNew()      - for a new request typed in at the console.
 * createFromData() - for a request loaded from serviceRequests.json.
 *   JSON only stores plain data, not classes or methods. Without the factory a
 *   loaded request would be a plain object with no getRequestSummary(),
 *   no workflow rules and no polymorphism.
 */
class ServiceRequestFactory {
  static createNew(category, commonRequestData, specialisedData = {}) {
    const RequestClass = CLASS_FOR_CATEGORY[category];
    if (!RequestClass) {
      throw new Error(`Unsupported category: ${category}.`);
    }
    return new RequestClass(commonRequestData, specialisedData);
  }

  /**
   * Rebuilds a saved request as the correct class.
   * @param {object} savedData   - one record from serviceRequests.json
   * @param {Function} findUser  - looks up a User object by ID (requester / Technician)
   * @param {Array} history      - this request's entries from requestHistory.json
   */
  static createFromData(savedData, findUser, history = []) {
    const RequestClass = CLASS_FOR_TYPE[savedData?.requestType];
    if (!RequestClass) {
      throw new Error(`Cannot restore request ${savedData?.requestId}: unknown request type "${savedData?.requestType}".`);
    }

    const requester = findUser(savedData.requesterId);
    if (!requester) {
      throw new Error(`Cannot restore request ${savedData.requestId}: requester ${savedData.requesterId} not found.`);
    }
    let assignedTechnician = null;
    if (savedData.assignedTechnicianId) {
      assignedTechnician = findUser(savedData.assignedTechnicianId);
      if (!assignedTechnician) {
        throw new Error(`Cannot restore request ${savedData.requestId}: Technician ${savedData.assignedTechnicianId} not found.`);
      }
    }

    const commonRequestData = {
      requestId: savedData.requestId,
      requester,
      title: savedData.title,
      description: savedData.description,
      location: savedData.location,
      priority: savedData.priority,
      savedState: {
        status: savedData.status,
        dateSubmitted: savedData.dateSubmitted,
        dateUpdated: savedData.dateUpdated,
        assignedTechnician,
        history,
      },
    };
    // The subclass constructor picks out its own specialised fields from savedData,
    // and validates them exactly like a new request.
    return new RequestClass(commonRequestData, savedData);
  }
}

module.exports = ServiceRequestFactory;
