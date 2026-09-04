/*
  Program : Dining Meal Booking Feature - Lab 3 (Distinction Extension)
  File    : DiningAccount.js
  Student : Philemon KIRA
  ID      : 220538
  Course  : IS305 - Object-Oriented Programming

  Description:
  DiningAccount is the BASE CLASS of the dining account inheritance
  hierarchy. It demonstrates encapsulation (private #fields),
  a validating constructor with a DEFAULT parameter (simulated
  constructor overloading), and a deposit method that accepts one OR
  two arguments (simulated method overloading).

  A standard dining account can only pay for a meal when there are
  sufficient funds - its balance can never fall below zero.
*/

class DiningAccount {
    // Encapsulation: private fields
    #accountNumber;
    #balance;
    #transactions;

    /*
      Constructor.
      openingBalance has a DEFAULT value of 0.
      This demonstrates simulated CONSTRUCTOR OVERLOADING:
          new DiningAccount("DA001")          -> opening balance 0
          new DiningAccount("DA002", 1000)    -> opening balance 1000
    */
    constructor(accountNumber, openingBalance = 0) {
        // Validation: account number cannot be empty
        if (accountNumber === undefined ||
            accountNumber === null ||
            String(accountNumber).trim() === "") {
            throw new Error("Account number cannot be empty.");
        }

        // Validation: opening balance must be a valid, non-negative number
        if (typeof openingBalance !== "number" || Number.isNaN(openingBalance)) {
            throw new Error("Opening balance must be a number.");
        }

        if (openingBalance < 0) {
            throw new Error("Opening balance cannot be negative.");
        }

        this.#accountNumber = String(accountNumber).trim();
        this.#balance = openingBalance;
        this.#transactions = [];

        // Record the opening balance as the first transaction
        if (openingBalance > 0) {
            this.#record("Deposit", openingBalance, "Opening balance");
        }
    }

    /*
      Private helper that records a transaction in the history array.
      Each transaction stores: type, amount, description, date/time
      and the balance AFTER the transaction.
    */
    #record(type, amount, description) {
        this.#transactions.push({
            type: type,
            amount: amount,
            description: description,
            dateTime: new Date().toLocaleString(),
            balanceAfter: this.#balance
        });
    }

    /*
      Protected-by-convention helpers (underscore prefix).
      Subclasses that override the payment logic (e.g. CreditDiningAccount)
      use these to change the balance and record a transaction WITHOUT
      breaking the encapsulation of the private #balance field.
    */
    _credit(amount, type, description) {
        this.#balance += amount;
        this.#record(type, amount, description);
    }

    _debit(amount, type, description) {
        this.#balance -= amount;
        this.#record(type, amount, description);
    }

    /*
      Simulated METHOD OVERLOADING.
      deposit works with either one or two arguments:
          account.deposit(500)
          account.deposit(500, "Weekly meal allowance")
      A default value is used for the description when none is supplied.
    */
    deposit(amount, description = "Deposit") {
        if (typeof amount !== "number" || Number.isNaN(amount)) {
            throw new Error("Deposit amount must be a number.");
        }

        if (amount <= 0) {
            throw new Error("Deposit amount must be greater than zero.");
        }

        this._credit(amount, "Deposit", description);
        return true;
    }

    /*
      Pay for a meal from a STANDARD account.
      Money is deducted only when sufficient funds are available.
      Returns true when the payment succeeds, false when it is rejected.
      (CreditDiningAccount overrides this method.)
    */
    payForMeal(amount, description = "Meal Payment") {
        if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        // Standard account: balance cannot fall below zero
        if (amount > this.#balance) {
            return false;
        }

        this._debit(amount, "Meal Payment", description);
        return true;
    }

    // Return the current balance
    getBalance() {
        return this.#balance;
    }

    // Return the account number
    getAccountNumber() {
        return this.#accountNumber;
    }

    /*
      Return the account TYPE. Using this.constructor.name means the
      correct type ("DiningAccount", "RewardsDiningAccount",
      "CreditDiningAccount") is reported automatically - this supports
      POLYMORPHISM without any type-checking code.
    */
    getAccountType() {
        return this.constructor.name;
    }

    // Return a SAFE COPY of the transaction history (encapsulation)
    getTransactions() {
        return this.#transactions.map((t) => ({ ...t }));
    }

    /*
      Display the account summary.
      Subclasses OVERRIDE this method and call super.displayAccountSummary()
      to add their own specialised information.
    */
    displayAccountSummary() {
        console.log("----------------------------------------");
        console.log(`Account Type   : ${this.getAccountType()}`);
        console.log(`Account Number : ${this.getAccountNumber()}`);
        console.log(`Current Balance: K${this.getBalance().toFixed(2)}`);
    }
}

module.exports = DiningAccount;
