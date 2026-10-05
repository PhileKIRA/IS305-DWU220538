// Shared lists of allowed values.
// Keeping them in one place means validation, menus and reports all agree.

const USER_TYPES = [
  "Student",
  "Staff",
  "Service Officer",
  "Technician",
  "System Administrator",
];

const CATEGORIES = [
  "ICT Support",
  "Facilities Maintenance",
  "Cleaning and Sanitation",
  "General Campus Service",
];

const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

// Request statuses. Pass used Submitted and Cancelled; Credit adds the workflow.
const STATUS = {
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

// The ONLY status changes allowed. Anything not listed here is rejected.
// Closed and Cancelled are final, so they have no next status.
const VALID_TRANSITIONS = {
  [STATUS.SUBMITTED]: [STATUS.REVIEWED, STATUS.CANCELLED],
  [STATUS.REVIEWED]: [STATUS.ASSIGNED],
  [STATUS.ASSIGNED]: [STATUS.IN_PROGRESS],
  [STATUS.IN_PROGRESS]: [STATUS.RESOLVED],
  [STATUS.RESOLVED]: [STATUS.CLOSED],
  [STATUS.CLOSED]: [],
  [STATUS.CANCELLED]: [],
};

// Used by calculatePriorityScore(): each priority level is worth these points.
const PRIORITY_POINTS = { Low: 10, Normal: 20, High: 30, Urgent: 40 };

// Default number of hours allowed to resolve a request, by priority.
const BASE_TARGET_HOURS = { Low: 72, Normal: 48, High: 24, Urgent: 8 };

// ----- Credit: allowed values for specialised fields -----
const YEAR_LEVELS = [1, 2, 3, 4, 5];

const ICT_OPTIONS = {
  deviceTypes: ["Laptop", "Desktop", "Printer", "Projector", "Phone or Tablet", "Network Equipment", "Other"],
  faultTypes: ["Hardware", "Software", "Network", "Account or Access"],
  networkImpacts: ["None", "Single User", "Building", "Campus-wide"],
};

const MAINTENANCE_OPTIONS = {
  hazardLevels: ["Low", "Medium", "High"],
};

const CLEANING_OPTIONS = {
  hygieneRisks: ["Low", "Medium", "High"],
  serviceTypes: ["Routine Cleaning", "Spill Clean-up", "Waste Removal", "Sanitisation", "Restroom Service"],
  serviceTimes: ["Morning", "Afternoon", "Evening", "Any Time"],
};

// Simple email check: something@something.something, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = {
  USER_TYPES,
  CATEGORIES,
  PRIORITIES,
  STATUS,
  VALID_TRANSITIONS,
  PRIORITY_POINTS,
  BASE_TARGET_HOURS,
  EMAIL_PATTERN,
  YEAR_LEVELS,
  ICT_OPTIONS,
  MAINTENANCE_OPTIONS,
  CLEANING_OPTIONS,
};
