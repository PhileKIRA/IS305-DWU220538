// Small reusable checks used by the subclasses, so each rule is written once.

function requireText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

function requireOption(value, options, fieldName) {
  if (!options.includes(value)) {
    throw new Error(`Invalid ${fieldName.toLowerCase()}. Choose one of: ${options.join(", ")}.`);
  }
  return value;
}

module.exports = { requireText, requireOption };
