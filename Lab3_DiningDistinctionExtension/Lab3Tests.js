/*
  Program : Dining Meal Booking Feature - Lab 3 (Distinction Extension)
  File    : Lab3Tests.js
  Student : Philemon KIRA
  ID      : 220538
  Course  : IS305 - Object-Oriented Programming

  Description:
  Automated test suite for Lab 3. Run with:  node Lab3Tests.js
  Each test prints PASSED or FAILED and covers the required tests from
  the marking rubric, including positive and negative cases.
*/

const Student = require("./Student");
const MealBooking = require("./MealBooking");
const DiningAccount = require("./DiningAccount");
const RewardsDiningAccount = require("./RewardsDiningAccount");
const CreditDiningAccount = require("./CreditDiningAccount");

let passed = 0;
let failed = 0;

// Simple assertion helper
function check(testName, condition) {
    if (condition) {
        passed++;
        console.log(`PASSED - ${testName}`);
    } else {
        failed++;
        console.log(`FAILED - ${testName}`);
    }
}

console.log("========================================");
console.log("            LAB 3 TEST SUITE");
console.log("========================================");

// Test 1: Standard account payment succeeds with sufficient funds
(() => {
    const a = new DiningAccount("T001", 1000);
    const ok = a.payForMeal(200);
    check("Standard account payment (sufficient funds)",
        ok === true && a.getBalance() === 800);
})();

// Test 2: Insufficient standard balance - payment rejected, balance unchanged
(() => {
    const a = new DiningAccount("T002", 100);
    const ok = a.payForMeal(500);
    check("Insufficient standard balance rejected (balance unchanged)",
        ok === false && a.getBalance() === 100);
})();

// Test 3: Rewards calculation and application are correct
(() => {
    const r = new RewardsDiningAccount("T003", 2000, 2.5);
    const reward = r.calculateReward(); // 2000 * 2.5 / 100 = 50
    r.applyReward();
    check("Rewards calculation and application",
        reward === 50 && r.getBalance() === 2050);
})();

// Test 4: Credit account within limit - payment accepted
(() => {
    const c = new CreditDiningAccount("T004", 1000, 500);
    const ok = c.payForMeal(1500); // balance -> -500 (within limit)
    check("Credit account payment within limit",
        ok === true && c.getBalance() === -500);
})();

// Test 5: Credit limit exceeded - payment rejected
(() => {
    const c = new CreditDiningAccount("T005", 1000, 500);
    c.payForMeal(1500);            // balance -> -500
    const ok = c.payForMeal(200);  // would be -700, exceeds -500 limit
    check("Credit limit exceeded rejected (balance unchanged)",
        ok === false && c.getBalance() === -500);
})();

// Test 6: Polymorphic account processing - correct type reported for each
(() => {
    const accounts = [
        new DiningAccount("T006a", 100),
        new RewardsDiningAccount("T006b", 100, 1),
        new CreditDiningAccount("T006c", 100, 100)
    ];
    const types = accounts.map((acc) => acc.getAccountType());
    check("Polymorphic account processing (correct types)",
        types[0] === "DiningAccount" &&
        types[1] === "RewardsDiningAccount" &&
        types[2] === "CreditDiningAccount");
})();

// Test 7: Booking payment - successful payment confirms the booking
(() => {
    const s = new Student("T007", "Test", "Student");
    const acc = new DiningAccount("T007A", 100);
    s.assignDiningAccount(acc);
    const booking = new MealBooking(s, "2026-09-10", "Dinner", 2); // K40
    const result = booking.processPayment(s.diningAccount);
    check("Booking payment confirms booking on success",
        result.success === true &&
        booking.bookingStatus === "Confirmed" &&
        acc.getBalance() === 60);
})();

// Test 8: Duplicate payment - a paid booking cannot be charged again
(() => {
    const s = new Student("T008", "Test", "Student");
    const acc = new DiningAccount("T008A", 100);
    s.assignDiningAccount(acc);
    const booking = new MealBooking(s, "2026-09-10", "Dinner", 2); // K40
    booking.processPayment(s.diningAccount);           // first payment -> 60
    const second = booking.processPayment(s.diningAccount); // must be blocked
    check("Duplicate payment prevented (charged only once)",
        second.success === false && acc.getBalance() === 60);
})();

// Test 9: Failed payment keeps the booking Pending
(() => {
    const s = new Student("T009", "Test", "Student");
    const acc = new DiningAccount("T009A", 5); // not enough for K40
    s.assignDiningAccount(acc);
    const booking = new MealBooking(s, "2026-09-10", "Dinner", 2);
    const result = booking.processPayment(s.diningAccount);
    check("Failed payment keeps booking Pending",
        result.success === false &&
        booking.bookingStatus === "Pending" &&
        acc.getBalance() === 5);
})();

// Test 10: Validation - empty account number is rejected
(() => {
    let threw = false;
    try {
        new DiningAccount("");
    } catch (e) {
        threw = true;
    }
    check("Validation rejects empty account number", threw === true);
})();

// Test 11: Validation - negative opening balance is rejected
(() => {
    let threw = false;
    try {
        new DiningAccount("T011", -50);
    } catch (e) {
        threw = true;
    }
    check("Validation rejects negative opening balance", threw === true);
})();

// Test 12: Validation - deposit of zero or less is rejected
(() => {
    let threw = false;
    const a = new DiningAccount("T012", 100);
    try {
        a.deposit(0);
    } catch (e) {
        threw = true;
    }
    check("Validation rejects non-positive deposit", threw === true);
})();

// Test 13: assignDiningAccount rejects an invalid object
(() => {
    let threw = false;
    const s = new Student("T013", "Test", "Student");
    try {
        s.assignDiningAccount({ notAnAccount: true });
    } catch (e) {
        threw = true;
    }
    check("assignDiningAccount rejects invalid object", threw === true);
})();

// Test 14: Simulated overloading - deposit works with 1 or 2 arguments
(() => {
    const a = new DiningAccount("T014");
    a.deposit(100);                          // default description
    a.deposit(100, "Additional meal funds"); // supplied description
    const t = a.getTransactions();
    check("Simulated method overloading (1 or 2 args)",
        t.length === 2 &&
        t[0].description === "Deposit" &&
        t[1].description === "Additional meal funds");
})();

// Test 15: getTransactions returns a safe copy (encapsulation)
(() => {
    const a = new DiningAccount("T015", 100);
    const copy = a.getTransactions();
    copy.push({ type: "Hack" }); // modifying the copy must not affect the account
    check("getTransactions returns a safe copy",
        a.getTransactions().length === 1);
})();

console.log("========================================");
console.log(`TOTAL: ${passed + failed}  |  PASSED: ${passed}  |  FAILED: ${failed}`);
console.log("========================================");

// Exit with a non-zero code if any test failed (useful for automation)
process.exit(failed === 0 ? 0 : 1);
