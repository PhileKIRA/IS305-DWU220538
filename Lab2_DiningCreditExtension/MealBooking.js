/*
  Program: Dining Meal Booking Feature
  Student Name: Philemon KIRA
  Student ID: 220538
*/
const Student = require("./Student");

class MealBooking {
    #student;
    #mealDate;
    #mealType;
    #quantity;
    #dietaryNote;
    #bookingStatus;

    constructor(
        student,
        mealDate,
        mealType,
        quantity,
        dietaryNote = "None",
        bookingStatus = "Pending"
    ) {
        // Validate Student object
        if (!(student instanceof Student)) {
            throw new Error("Invalid Student object.");
        }

        this.#student = student;

        // Validate meal date
        if (!mealDate || mealDate.trim() === "") {
            throw new Error("Meal date cannot be empty.");
        }

        this.#mealDate = mealDate.trim();

        // Validate meal type
        const validMealTypes = ["Breakfast", "Lunch", "Dinner"];

        if (!validMealTypes.includes(mealType)) {
            throw new Error(
                "Invalid meal type. Choose Breakfast, Lunch or Dinner."
            );
        }

        this.#mealType = mealType;

        // Validate quantity
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error("Quantity must be a positive whole number.");
        }

        this.#quantity = quantity;

        // Dietary note
        this.#dietaryNote =
            dietaryNote && dietaryNote.trim() !== ""
                ? dietaryNote.trim()
                : "None";

        // Booking status
        const validStatuses = ["Pending", "Confirmed", "Cancelled"];

        if (!validStatuses.includes(bookingStatus)) {
            throw new Error(
                "Invalid booking status. Use Pending, Confirmed or Cancelled."
            );
        }

        this.#bookingStatus = bookingStatus;
    }

    // Student getter
    get student() {
        return this.#student;
    }

    // Meal date getter
    get mealDate() {
        return this.#mealDate;
    }

    // Meal type getter
    get mealType() {
        return this.#mealType;
    }

    // Quantity getter
    get quantity() {
        return this.#quantity;
    }

    // Dietary note getter
    get dietaryNote() {
        return this.#dietaryNote;
    }

    // Booking status getter
    get bookingStatus() {
        return this.#bookingStatus;
    }

    // Calculate meal cost
    calculateTotal() {
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

    // Return booking summary
    getSummary() {
        return `
${this.#mealType} - ${this.#mealDate}
Quantity: ${this.#quantity}
Status: ${this.#bookingStatus}
Dietary Note: ${this.#dietaryNote}
Cost: K${this.calculateTotal().toFixed(2)}
Student: ${this.#student.getFullName()}
`;
    }

    // Display booking
    displayBooking() {
        console.log("----------------------------------------");
        console.log(`Meal: ${this.#mealType}`);
        console.log(`Date: ${this.#mealDate}`);
        console.log(`Quantity: ${this.#quantity}`);
        console.log(`Status: ${this.#bookingStatus}`);
        console.log(`Dietary Note: ${this.#dietaryNote}`);
        console.log(`Cost: K${this.calculateTotal().toFixed(2)}`);
        console.log(`Student: ${this.#student.getFullName()}`);
        console.log("----------------------------------------");
    }
}

module.exports = MealBooking;