/*
  Program : Dining Meal Booking Feature - Lab 3 (Distinction Extension)
  File    : MealBooking.js
  Student : Philemon KIRA
  ID      : 220538
  Course  : IS305 - Object-Oriented Programming

  Description:
  The MealBooking class from Lab 2 is preserved and EXTENDED for Lab 3 with
  processPayment(), which sends the total booking cost to the assigned
  dining account's payForMeal() method. Payment is POLYMORPHIC: MealBooking
  contains no per-subtype payment code - it calls the same payForMeal()
  method and lets the account object decide the result.
*/

const Student = require("./Student");
const DiningAccount = require("./DiningAccount");

class MealBooking {
    #student;
    #mealDate;
    #mealType;
    #quantity;
    #dietaryNote;
    #bookingStatus;
    #isPaid; // Lab 3: prevents the same booking being paid twice

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
        this.#isPaid = false;
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

    // Lab 3: has this booking already been paid?
    get isPaid() {
        return this.#isPaid;
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

    /*
      Lab 3: process the booking payment through a dining account.

      Steps:
        - verify a valid dining account was supplied;
        - prevent a booking from being paid twice;
        - calculate the total booking cost;
        - send the total to the account's payForMeal() method (POLYMORPHIC);
        - confirm the booking when payment succeeds;
        - keep the booking Pending when payment fails; and
        - return a clear payment result object.

      This method calls the SAME payForMeal() method for every account type.
      The specialised account object decides whether the payment succeeds,
      so there is no subtype-specific code here.
    */
    processPayment(diningAccount) {
        if (!(diningAccount instanceof DiningAccount)) {
            throw new Error(
                "A valid dining account is required to process payment."
            );
        }

        // Prevent duplicate payment
        if (this.#isPaid) {
            return {
                success: false,
                message:
                    "This booking has already been paid and cannot be " +
                    "charged again."
            };
        }

        const total = this.calculateTotal();

        // Polymorphic call - the account subtype determines the outcome
        const paymentAccepted = diningAccount.payForMeal(
            total,
            `${this.#mealType} booking`
        );

        if (paymentAccepted) {
            this.#isPaid = true;
            this.#bookingStatus = "Confirmed";

            return {
                success: true,
                message: "Payment successful. Booking confirmed.",
                total: total
            };
        }

        // Payment failed - booking stays Pending
        this.#bookingStatus = "Pending";

        return {
            success: false,
            message:
                "Payment failed - insufficient funds/credit. Booking " +
                "remains Pending.",
            total: total
        };
    }

    // Confirm booking manually (kept from earlier labs)
    confirmBooking() {
        if (this.#bookingStatus === "Cancelled") {
            throw new Error("A cancelled booking cannot be confirmed.");
        }

        this.#bookingStatus = "Confirmed";
    }

    // Cancel booking
    cancelBooking() {
        this.#bookingStatus = "Cancelled";
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
