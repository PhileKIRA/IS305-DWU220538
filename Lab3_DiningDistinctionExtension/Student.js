/*
  Program : Dining Meal Booking Feature - Lab 3 (Distinction Extension)
  File    : Student.js
  Student : Philemon KIRA
  ID      : 220538
  Course  : IS305 - Object-Oriented Programming

  Description:
  The Student class from Lab 2 is preserved and EXTENDED for Lab 3 so a
  student can be connected (object composition) to ONE dining account.
  The account may be a DiningAccount or any of its subclasses
  (RewardsDiningAccount / CreditDiningAccount).
*/

const DiningAccount = require("./DiningAccount");

class Student {
    #studentId;
    #firstName;
    #lastName;
    #diningAccount; // Lab 3: composed dining account (base or subclass)

    constructor(studentId, firstName, lastName) {
        this.studentId = studentId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.#diningAccount = null;
    }

    // Student ID getter
    get studentId() {
        return this.#studentId;
    }

    // Student ID setter
    set studentId(value) {
        if (!value || value.trim() === "") {
            throw new Error("Student ID cannot be empty.");
        }

        this.#studentId = value.trim();
    }

    // First name getter
    get firstName() {
        return this.#firstName;
    }

    // First name setter
    set firstName(value) {
        if (!value || value.trim() === "") {
            throw new Error("First name cannot be empty.");
        }

        this.#firstName = value.trim();
    }

    // Last name getter
    get lastName() {
        return this.#lastName;
    }

    // Last name setter
    set lastName(value) {
        if (!value || value.trim() === "") {
            throw new Error("Last name cannot be empty.");
        }

        this.#lastName = value.trim();
    }

    // Return student's full name
    getFullName() {
        return `${this.#firstName} ${this.#lastName}`;
    }

    /*
      Lab 3: assign a dining account to this student.
      The assignment is only accepted when the supplied object is a valid
      DiningAccount or an object from one of its subclasses.
    */
    assignDiningAccount(account) {
        if (!(account instanceof DiningAccount)) {
            throw new Error(
                "A valid DiningAccount (or subclass) is required."
            );
        }

        this.#diningAccount = account;
    }

    // Lab 3: getter for the assigned dining account
    get diningAccount() {
        return this.#diningAccount;
    }

    // Display student information
    displayInfo() {
        console.log("========================================");
        console.log("          STUDENT INFORMATION");
        console.log("========================================");
        console.log(`Student ID: ${this.#studentId}`);
        console.log(`Student Name: ${this.getFullName()}`);

        if (this.#diningAccount) {
            console.log(
                `Dining Account: ${this.#diningAccount.getAccountType()} ` +
                `(${this.#diningAccount.getAccountNumber()})`
            );
        }

        console.log("========================================");
    }
}

module.exports = Student;
