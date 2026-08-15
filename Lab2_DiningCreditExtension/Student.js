/*
  Program: Dining Meal Booking Feature
  Student Name: Philemon KIRA
  Student ID: 220538
*/
class Student {
    #studentId;
    #firstName;
    #lastName;

    constructor(studentId, firstName, lastName) {
        this.studentId = studentId;
        this.firstName = firstName;
        this.lastName = lastName;
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

    // Display student information
    displayInfo() {
        console.log("========================================");
        console.log("          STUDENT INFORMATION");
        console.log("========================================");
        console.log(`Student ID: ${this.#studentId}`);
        console.log(`Student Name: ${this.getFullName()}`);
        console.log("========================================");
    }
}

module.exports = Student;