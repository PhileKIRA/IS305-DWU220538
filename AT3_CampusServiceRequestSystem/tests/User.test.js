const test = require("node:test");
const assert = require("node:assert");
const User = require("../src/models/User");

test("T01 - creates a valid User", () => {
  const user = new User("DWU2026001", "Mary", "Kila", "Mary.Kila@dwu.ac.pg", "Student");

  assert.strictEqual(user.userId, "DWU2026001");
  assert.strictEqual(user.getFullName(), "Mary Kila");
  assert.strictEqual(user.email, "mary.kila@dwu.ac.pg"); // stored in lower case
  assert.strictEqual(user.validate(), true);
});

test("T02 - rejects missing user ID, names and invalid email", () => {
  assert.throws(() => new User("", "Mary", "Kila", "m@dwu.ac.pg", "Student"), /User ID is required/);
  assert.throws(() => new User("U1", "", "Kila", "m@dwu.ac.pg", "Student"), /First name is required/);
  assert.throws(() => new User("U1", "Mary", " ", "m@dwu.ac.pg", "Student"), /Last name is required/);
  assert.throws(() => new User("U1", "Mary", "Kila", "not-an-email", "Student"), /Invalid email address/);
  assert.throws(() => new User("U1", "Mary", "Kila", "m@dwu.ac.pg", "Visitor"), /Invalid user type/);
});

test("T03 - private fields cannot be changed directly; setters validate", () => {
  const user = new User("DWU2026001", "Mary", "Kila", "m@dwu.ac.pg", "Student");

  // userId has no setter, so assignment is ignored (or throws in strict mode).
  try {
    user.userId = "HACKED";
  } catch {
    // ignore - class bodies are strict mode, so this throws a TypeError
  }
  assert.strictEqual(user.userId, "DWU2026001");

  // A bad value through a setter is rejected and the old value is kept.
  assert.throws(() => (user.email = "bad"), /Invalid email address/);
  assert.strictEqual(user.email, "m@dwu.ac.pg");
});
