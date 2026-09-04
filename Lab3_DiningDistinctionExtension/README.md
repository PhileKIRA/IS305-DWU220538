# IS305 Lab 3 – Dining Account Distinction Extension

## Student Information

**Student Name:** Philemon KIRA
**Student ID:** 220538
**Course:** IS305 – Object-Oriented Programming
**Assessment:** Programming Lab Activity 3 – Dining Account Distinction Extension
**Technology:** JavaScript and Node.js (no database)

## GitHub Repository

https://github.com/PhileKIRA/IS305-DWU220538.git

---

## How Lab 3 Extends Labs 1 and 2

This lab does **not** create a new application. It extends the same Dining Meal
Booking application built in Labs 1 and 2.

- **Lab 1 (Pass):** Created the basic Dining Meal Booking feature using classes,
  objects, constructors, private fields, methods and arrays.
- **Lab 2 (Credit):** Added a `Student` class and connected `Student` objects to
  `MealBooking` objects (object composition).
- **Lab 3 (Distinction):** Adds a dining account inheritance hierarchy
  (`DiningAccount`, `RewardsDiningAccount`, `CreditDiningAccount`), constructor
  chaining, method overriding, polymorphism, transaction processing and
  simulated overloading, and connects account payment to the existing
  meal-booking workflow.

The original `Student`, `MealBooking` and `DiningApp` remain part of the solution
and were extended rather than replaced.

---

## How to Run the Program

Make sure Node.js is installed, then open a terminal in this folder and run:

```bash
node DiningApp.js
```

To run the automated test suite:

```bash
node Lab3Tests.js
```

`DiningApp.js` runs every required demonstration (standard account, rewards
account, credit account, polymorphism, student + booking integration, duplicate
payment prevention, transaction history and simulated overloading).

---

## Class Inheritance Hierarchy

```
              DiningAccount            (base class)
                    |
      --------------------------------
      |                              |
RewardsDiningAccount        CreditDiningAccount   (derived classes)
```

- **DiningAccount** is the base class. It holds the private fields
  `#accountNumber`, `#balance` and `#transactions`, and provides `deposit()`,
  `payForMeal()`, `getBalance()`, `getTransactions()` and
  `displayAccountSummary()`.
- **RewardsDiningAccount** inherits from `DiningAccount` and adds `#rewardRate`
  with `calculateReward()` and `applyReward()`.
- **CreditDiningAccount** inherits from `DiningAccount` and adds `#creditLimit`,
  and overrides `payForMeal()` to allow controlled credit.

## Constructor Chaining

Each subclass constructor calls the base class constructor with `super()` before
initialising its own fields. For example:

```javascript
constructor(accountNumber, openingBalance, creditLimit) {
    super(accountNumber, openingBalance); // initialise base fields first
    // then validate and set the credit limit
    this.#creditLimit = creditLimit;
}
```

This guarantees the account number and opening balance are validated and stored
by the base class before the subclass adds its own data.

## Method Overriding and Polymorphism

`CreditDiningAccount` **overrides** the inherited `payForMeal()` method so the
balance may fall below zero, but only within the approved credit limit. Both
`RewardsDiningAccount` and `CreditDiningAccount` also override
`displayAccountSummary()` (calling `super.displayAccountSummary()` first) to add
their specialised information.

**Polymorphism** is demonstrated in `DiningApp.js`: a single array holds a
`DiningAccount`, a `RewardsDiningAccount` and a `CreditDiningAccount`, and a loop
calls the same method on each object:

```javascript
for (const account of diningAccounts) {
    account.displayAccountSummary();
}
```

The correct specialised behaviour runs for each object automatically. The
`MealBooking.processPayment()` method also relies on polymorphism – it calls the
same `payForMeal()` method for every account type and contains no subtype-specific
payment code.

## Simulated Overloading in JavaScript

JavaScript does not support traditional method or constructor overloading (you
cannot declare two methods with the same name). This lab simulates overloading
using **default and optional parameters**:

- **Constructor overloading:** `openingBalance` has a default value.
  `new DiningAccount("DA001")` uses an opening balance of `0`, while
  `new DiningAccount("DA002", 500)` supplies one.
- **Method overloading:** `deposit(amount, description = "Deposit")` works with
  one or two arguments. `deposit(100)` uses the default description; while
  `deposit(100, "Additional meal funds")` supplies one.

Because the parameters are optional, one method definition behaves like several
overloaded versions.

## How Student, MealBooking and DiningAccount Are Connected

- A `Student` is created and a dining account is attached with
  `student.assignDiningAccount(account)`. The method verifies the object is a
  `DiningAccount` (or a subclass) using `instanceof`.
- A `MealBooking` references the `Student` (from Lab 2).
- `MealBooking.processPayment(account)` calculates the total cost and sends it to
  the account's `payForMeal()` method. A successful payment confirms the booking;
  a failed payment leaves it `Pending`; and a booking cannot be paid twice.
- Every deposit, reward and payment is recorded in the account's transaction
  history array and can be displayed afterwards.

---

## Files

| File | Purpose |
|------|---------|
| `DiningAccount.js` | Base account class (encapsulation, validation, deposit, payment, transactions). |
| `RewardsDiningAccount.js` | Inherits `DiningAccount`; adds reward rate, `calculateReward()`, `applyReward()`. |
| `CreditDiningAccount.js` | Inherits `DiningAccount`; adds credit limit; overrides `payForMeal()`. |
| `Student.js` | Lab 2 class extended with `assignDiningAccount()` and a dining-account getter. |
| `MealBooking.js` | Lab 2 class extended with `processPayment()` and duplicate-payment prevention. |
| `DiningApp.js` | Main demonstration – run with `node DiningApp.js`. |
| `Lab3Tests.js` | Automated test suite – run with `node Lab3Tests.js`. |
| `README.md` | This file. |

---

## Tests Completed and Results

Run `node Lab3Tests.js`. All tests pass (15 / 15).

| # | Test | Type | Result |
|---|------|------|--------|
| 1 | Standard account payment with sufficient funds | Positive | PASSED |
| 2 | Insufficient standard balance rejected, balance unchanged | Negative | PASSED |
| 3 | Rewards calculation and application correct | Positive | PASSED |
| 4 | Credit account payment within limit accepted | Positive | PASSED |
| 5 | Credit limit exceeded rejected, balance unchanged | Negative | PASSED |
| 6 | Polymorphic processing reports correct account type | Positive | PASSED |
| 7 | Successful booking payment confirms the booking | Positive | PASSED |
| 8 | Duplicate payment prevented (charged only once) | Negative | PASSED |
| 9 | Failed payment keeps booking Pending | Negative | PASSED |
| 10 | Empty account number rejected | Negative | PASSED |
| 11 | Negative opening balance rejected | Negative | PASSED |
| 12 | Non-positive deposit rejected | Negative | PASSED |
| 13 | `assignDiningAccount` rejects invalid object | Negative | PASSED |
| 14 | Simulated method overloading (1 or 2 arguments) | Positive | PASSED |
| 15 | `getTransactions()` returns a safe copy | Positive | PASSED |

---

## Approved Use of AI Tools

An AI assistant was used to help structure the inheritance hierarchy, review the
code against the lab specification and marking criteria, and check the console
output format. All code was reviewed and understood by the student, and the
solution follows the required JavaScript/Node.js technology with no database.
