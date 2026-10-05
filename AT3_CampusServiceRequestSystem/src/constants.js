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

// Simple email check: something@something.something, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = { USER_TYPES, CATEGORIES, PRIORITIES, STATUS, EMAIL_PATTERN };
