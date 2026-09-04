/*
  Program : Dining Meal Booking Feature - Lab 3 (Distinction Extension)
  File    : CreditDiningAccount.js
  Student : Philemon KIRA
  ID      : 220538
  Course  : IS305 - Object-Oriented Programming

  Description:
  CreditDiningAccount is a DERIVED CLASS that INHERITS from DiningAccount.
  It adds an approved credit limit and OVERRIDES payForMeal() so that the
  balance may fall below zero, but never below the approved credit limit.

  Example:
    An account with a K1,000 balance and a K500 credit limit may make a
    payment of K1,500, leaving a balance of K-500. A payment greater than
    K1,500 is rejected.
*/

const DiningAccount = require("./DiningAccount");

class CreditDiningAccount extends DiningAccount {
    // Additional private field for this subclass
    #creditLimit;

    /*
      CONSTRUCTOR CHAINING: super() initialises the account number and
      opening balance in the base class; the subclass then validates and
      stores its own credit limit.
    */
    constructor(accountNumber, openingBalance = 0, creditLimit = 0) {
        super(accountNumber, openingBalance);

        if (typeof creditLimit !== "number" || Number.isNaN(creditLimit)) {
            throw new Error("Credit limit must be a number.");
        }

        if (creditLimit < 0) {
            throw new Error("Credit limit cannot be negative.");
        }

        this.#creditLimit = creditLimit;
    }

    // Credit limit getter
    getCreditLimit() {
        return this.#creditLimit;
    }

    // Total spending power = current balance + approved credit limit
    getAvailableFunds() {
        return this.getBalance() + this.#creditLimit;
    }

    /*
      METHOD OVERRIDING.
      The credit account allows the balance to fall below zero, but only
      within the approved credit limit. A payment that would push the
      balance below -creditLimit is rejected.

      This method has the SAME signature as the inherited payForMeal(), so
      the MealBooking workflow can call it polymorphically without knowing
      which account subtype it is dealing with.
    */
    payForMeal(amount, description = "Meal Payment") {
        if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        const projectedBalance = this.getBalance() - amount;

        // Reject when the payment would exceed the approved credit limit
        if (projectedBalance < -this.#creditLimit) {
            return false;
        }

        // Accept: _debit is the protected helper inherited from the base class
        this._debit(amount, "Meal Payment", description);
        return true;
    }

    /*
      METHOD OVERRIDING: extend the base summary with credit information.
    */
    displayAccountSummary() {
        super.displayAccountSummary();
        console.log(`Credit Limit   : K${this.#creditLimit.toFixed(2)}`);
        console.log(`Available Funds: K${this.getAvailableFunds().toFixed(2)}`);
    }
}

module.exports = CreditDiningAccount;
