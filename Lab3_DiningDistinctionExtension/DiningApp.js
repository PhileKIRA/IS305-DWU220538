/*
  Program : Dining Meal Booking Feature - Lab 3 (Distinction Extension)
  File    : DiningApp.js
  Student : Philemon KIRA
  ID      : 220538
  Course  : IS305 - Object-Oriented Programming

  Description:
  Main demonstration application for Lab 3. Running this file with
  "node DiningApp.js" runs every required demonstration and prints the
  output in the format shown in the lab specification:

    Part 1 - Standard dining account
    Part 1 - Rewards dining account
    Part 2 - Credit dining account (overridden payment)
    Part 2 - Polymorphism (array of accounts)
    Part 2 - Student + MealBooking integration (payment through account)
    Part 2 - Duplicate payment prevention
    Part 2 - Transaction history
    Part 2 - Simulated constructor and method overloading

  No database is used - all data is held in JavaScript objects and arrays.
*/

const Student = require("./Student");
const MealBooking = require("./MealBooking");
const DiningAccount = require("./DiningAccount");
const RewardsDiningAccount = require("./RewardsDiningAccount");
const CreditDiningAccount = require("./CreditDiningAccount");

// Helper: print an account's full transaction history
function displayTransactionHistory(account) {
    console.log("========================================");
    console.log("          TRANSACTION HISTORY");
    console.log("========================================");

    const transactions = account.getTransactions();

    transactions.forEach((t, index) => {
        console.log(`${index + 1}. ${t.type} - K${t.amount.toFixed(2)}`);
        console.log(`   Description: ${t.description}`);
        console.log(`   Date/Time  : ${t.dateTime}`);
        console.log(`   Balance    : K${t.balanceAfter.toFixed(2)}`);
    });

    console.log(`Total Transactions: ${transactions.length}`);
    console.log("========================================");
}

// ============================================================
// PART 1 - STANDARD DINING ACCOUNT
// ============================================================
function demoStandardAccount() {
    console.log("========================================");
    console.log("       STANDARD DINING ACCOUNT");
    console.log("========================================");

    // Simulated constructor overloading: opening balance supplied
    const account = new DiningAccount("DA001", 1000);

    const depositAmount = 500;
    account.deposit(depositAmount); // simulated method overloading (1 arg)

    const mealPayment = 200;
    const paid = account.payForMeal(mealPayment);

    console.log(`Account Number: ${account.getAccountNumber()}`);
    console.log("Opening Balance: K1000.00");
    console.log(`Deposit: K${depositAmount.toFixed(2)}`);
    console.log(`Meal Payment: K${mealPayment.toFixed(2)}`);
    console.log(`Payment Status: ${paid ? "Successful" : "Rejected"}`);
    console.log(`Final Balance: K${account.getBalance().toFixed(2)}`);

    // Negative test: a payment larger than the balance must be rejected
    const bigPayment = 5000;
    const rejected = account.payForMeal(bigPayment);
    console.log(
        `Attempt K${bigPayment.toFixed(2)} payment: ` +
        `${rejected ? "Successful" : "Rejected - insufficient funds"}`
    );
    console.log(`Balance Unchanged: K${account.getBalance().toFixed(2)}`);
    console.log("");
}

// ============================================================
// PART 1 - REWARDS DINING ACCOUNT
// ============================================================
function demoRewardsAccount() {
    console.log("========================================");
    console.log("        REWARDS DINING ACCOUNT");
    console.log("========================================");

    // Opening balance 1500, reward rate 2.5%
    const rewards = new RewardsDiningAccount("RA001", 1500, 2.5);

    // Deposit 500 -> balance becomes 2000
    rewards.deposit(500);

    const balanceBefore = rewards.getBalance();
    const reward = rewards.calculateReward();
    rewards.applyReward();

    console.log(`Account Number: ${rewards.getAccountNumber()}`);
    console.log(`Balance Before Reward: K${balanceBefore.toFixed(2)}`);
    console.log(`Reward Rate: ${rewards.getRewardRate()}%`);
    console.log(`Reward Earned: K${reward.toFixed(2)}`);
    console.log(`Final Balance: K${rewards.getBalance().toFixed(2)}`);
    console.log("");
}

// ============================================================
// PART 2 - CREDIT DINING ACCOUNT (overridden payment)
// ============================================================
function demoCreditAccount() {
    console.log("========================================");
    console.log("        CREDIT DINING ACCOUNT");
    console.log("========================================");

    // Opening balance 1000, credit limit 500
    const credit = new CreditDiningAccount("CA001", 1000, 500);

    console.log(`Account Number: ${credit.getAccountNumber()}`);
    console.log(`Opening Balance: K${credit.getBalance().toFixed(2)}`);
    console.log(`Credit Limit: K${credit.getCreditLimit().toFixed(2)}`);

    // Payment of 1500 -> balance becomes -500 (allowed, within limit)
    const firstPayment = 1500;
    const firstResult = credit.payForMeal(firstPayment);
    console.log(
        `\nPayment 1: K${firstPayment.toFixed(2)} -> ` +
        `${firstResult ? "Accepted" : "Rejected"}`
    );
    console.log(`Resulting Balance: K${credit.getBalance().toFixed(2)}`);

    // Another payment that exceeds the approved credit limit -> rejected
    const secondPayment = 200;
    const secondResult = credit.payForMeal(secondPayment);
    console.log(
        `\nPayment 2: K${secondPayment.toFixed(2)} -> ` +
        `${secondResult ? "Accepted" : "Rejected - exceeds credit limit"}`
    );
    console.log(`Balance Unchanged: K${credit.getBalance().toFixed(2)}`);
    console.log("");
}

// ============================================================
// PART 2 - POLYMORPHISM (array of different account objects)
// ============================================================
function demoPolymorphism() {
    console.log("========================================");
    console.log("      POLYMORPHIC ACCOUNT PROCESSING");
    console.log("========================================");

    // One array holding three different account types
    const diningAccounts = [
        new DiningAccount("DA100", 800),
        new RewardsDiningAccount("RA100", 1200, 5),
        new CreditDiningAccount("CA100", 600, 400)
    ];

    // The SAME method call produces the correct behaviour for each object
    for (const account of diningAccounts) {
        account.displayAccountSummary();
    }

    console.log("----------------------------------------");
    console.log("");
}

// ============================================================
// PART 2 - STUDENT + MEALBOOKING INTEGRATION
// ============================================================
function demoStudentBookingIntegration() {
    // Student with a rewards dining account (opening balance K100)
    const student = new Student("DWU2026001", "Maria", "Kila");
    const account = new RewardsDiningAccount("RA001", 100, 2.5);
    student.assignDiningAccount(account);

    console.log("========================================");
    console.log("          STUDENT DINING ACCOUNT");
    console.log("========================================");
    console.log(`Student: ${student.getFullName()}`);
    console.log(`Student ID: ${student.studentId}`);
    console.log(`Account Type: ${account.getAccountType()}`);
    console.log(`Account Number: ${account.getAccountNumber()}`);
    console.log(`Opening Balance: K100.00`);

    // Create a Dinner booking, quantity 2 -> total K40.00
    const booking = new MealBooking(student, "2026-09-10", "Dinner", 2);

    console.log("========================================");
    console.log("             MEAL BOOKING");
    console.log("========================================");
    console.log(`Meal: ${booking.mealType}`);
    console.log(`Quantity: ${booking.quantity}`);
    console.log(`Total Cost: K${booking.calculateTotal().toFixed(2)}`);

    // Process payment through the student's assigned account (polymorphic)
    const result = booking.processPayment(student.diningAccount);

    console.log(`Payment Status: ${result.success ? "Successful" : "Failed"}`);
    console.log(`Booking Status: ${booking.bookingStatus}`);
    console.log(`Remaining Balance: K${account.getBalance().toFixed(2)}`);
    console.log("");

    // --- Duplicate payment prevention ---
    console.log("========================================");
    console.log("       DUPLICATE PAYMENT PREVENTION");
    console.log("========================================");
    const secondAttempt = booking.processPayment(student.diningAccount);
    console.log(`Second Payment Attempt: ${secondAttempt.success ? "Charged again" : "Blocked"}`);
    console.log(`Message: ${secondAttempt.message}`);
    console.log(`Booking Status: ${booking.bookingStatus}`);
    console.log(`Balance Unchanged: K${account.getBalance().toFixed(2)}`);
    console.log("");

    // --- Transaction history for the account ---
    displayTransactionHistory(account);
    console.log("");
}

// ============================================================
// PART 2 - SIMULATED CONSTRUCTOR AND METHOD OVERLOADING
// ============================================================
function demoOverloading() {
    console.log("========================================");
    console.log("   SIMULATED OVERLOADING DEMONSTRATION");
    console.log("========================================");

    // Constructor variations (default opening balance)
    const a1 = new DiningAccount("DA001");        // opening balance defaults to 0
    const a2 = new DiningAccount("DA002", 500);   // opening balance supplied
    console.log(
        `new DiningAccount("DA001")      -> balance K${a1.getBalance().toFixed(2)}`
    );
    console.log(
        `new DiningAccount("DA002", 500) -> balance K${a2.getBalance().toFixed(2)}`
    );

    // Method variations (default description)
    a1.deposit(100);                              // one argument
    a1.deposit(100, "Additional meal funds");     // two arguments
    console.log('a1.deposit(100)                        -> uses default description');
    console.log('a1.deposit(100, "Additional meal funds") -> uses supplied description');

    const txns = a1.getTransactions();
    txns.forEach((t, i) => {
        console.log(`  Transaction ${i + 1}: ${t.type} K${t.amount.toFixed(2)} - "${t.description}"`);
    });
    console.log("========================================");
    console.log("");
}

// ============================================================
// RUN ALL DEMONSTRATIONS
// ============================================================
function main() {
    console.log("\n########################################");
    console.log("#   IS305 LAB 3 - DINING ACCOUNT       #");
    console.log("#      DISTINCTION EXTENSION           #");
    console.log("#   Philemon KIRA - 220538             #");
    console.log("########################################\n");

    demoStandardAccount();
    demoRewardsAccount();
    demoCreditAccount();
    demoPolymorphism();
    demoStudentBookingIntegration();
    demoOverloading();

    console.log("All Lab 3 demonstrations completed successfully.");
    console.log("Run the automated test suite with: node Lab3Tests.js\n");
}

main();
