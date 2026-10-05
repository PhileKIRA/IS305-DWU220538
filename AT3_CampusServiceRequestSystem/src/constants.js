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

// Pass statuses. Credit will add Reviewed, Assigned, In Progress, Resolved, Closed.
const STATUS = {
  SUBMITTED: "Submitted",
  CANCELLED: "Cancelled",
};

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
  EMAIL_PATTERN,
  YEAR_LEVELS,
  ICT_OPTIONS,
  MAINTENANCE_OPTIONS,
  CLEANING_OPTIONS,
};
