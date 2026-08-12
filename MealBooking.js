/*
  Program: Dining Meal Booking Feature
  Student Name: Philemon KIRA
  Student ID: 220538
  Date: 17 July 2026
  Description: A JavaScript program demonstrating classes,
  objects, constructors, private fields and methods.
*/

class MealBooking {
    #studentId;
    #studentName;
    #mealDate;
    #mealType;
    #quantity;
    #dietaryNote;
    #bookingStatus;

    constructor({
        studentId,
        studentName,
        mealDate,
        mealType,
        quantity,
        dietaryNote = ""
    }) {
        this.#studentId = studentId;
        this.#studentName = studentName;
        this.#mealDate = mealDate;
        this.#mealType = mealType;
        this.#quantity = quantity;
        this.#dietaryNote = dietaryNote;
        this.#bookingStatus = "Pending";
    }

    // Getters
    get studentId() {
        return this.#studentId;
    }

    get studentName() {
        return this.#studentName;
    }

    get mealDate() {
        return this.#mealDate;
    }

    get mealType() {
        return this.#mealType;
    }

    get quantity() {
        return this.#quantity;
    }

    get dietaryNote() {
        return this.#dietaryNote;
    }

    get bookingStatus() {
        return this.#bookingStatus;
    }

    // Setters
    set studentId(value) {
        this.#studentId = value;
    }

    set studentName(value) {
        this.#studentName = value;
    }

    set mealDate(value) {
        this.#mealDate = value;
    }

    set mealType(value) {
        this.#mealType = value;
    }

    set quantity(value) {
        this.#quantity = value;
    }

    set dietaryNote(value) {
        this.#dietaryNote = value;
    }

    // Validate booking information
    validate() {
        if (!this.#studentId || this.#studentId.trim() === "") {
            throw new Error("Student ID is required.");
        }

        if (!this.#studentName || this.#studentName.trim() === "") {
            throw new Error("Student name is required.");
        }

        if (!this.#mealDate || this.#mealDate.trim() === "") {
            throw new Error("Meal date is required.");
        }

        const validMealTypes = ["Breakfast", "Lunch", "Dinner"];

        if (!validMealTypes.includes(this.#mealType)) {
            throw new Error(
                "Invalid meal type. Choose Breakfast, Lunch or Dinner."
            );
        }

        if (
            !Number.isInteger(Number(this.#quantity)) ||
            Number(this.#quantity) < 1
        ) {
            throw new Error("Quantity must be at least 1.");
        }

        this.#quantity = Number(this.#quantity);

        return true;
    }

    // Calculate the total meal cost
    calculateTotal() {
        this.validate();

        let price;

        switch (this.#mealType) {
            case "Breakfast":
                price = 10;
                break;

            case "Lunch":
                price = 15;
                break;

            case "Dinner":
                price = 20;
                break;

            default:
                throw new Error("Invalid meal type.");
        }

        return price * this.#quantity;
    }

    // Confirm booking
    confirmBooking() {
        this.validate();

        if (this.#bookingStatus === "Cancelled") {
            throw new Error(
                "A cancelled booking cannot be confirmed."
            );
        }

        this.#bookingStatus = "Confirmed";
    }

    // Cancel booking
    cancelBooking() {
        this.#bookingStatus = "Cancelled";
    }

    // Return booking summary
    getSummary() {
        const total = this.calculateTotal();

        return `
========================================
          DINING MEAL BOOKING
========================================
Student: ${this.#studentName} (${this.#studentId})
Meal: ${this.#mealType} x ${this.#quantity}
Date: ${this.#mealDate}
Dietary note: ${this.#dietaryNote || "None"}
Status: ${this.#bookingStatus}
Total cost: K${total.toFixed(2)}
========================================
`;
    }
}

module.exports = MealBooking;