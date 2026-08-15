/*
  Program: Dining Meal Booking Feature
  Student Name: Philemon KIRA
  Student ID: 220538
*/
const readline = require("readline");
const Student = require("./Student");
const MealBooking = require("./MealBooking");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Store all bookings
const bookings = [];

// Ask question helper
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Display booking history for a student
function displayBookingHistory(student, bookings) {
    const studentBookings = bookings.filter(
        (booking) => booking.student === student
    );

    console.log("\n========================================");
    console.log("          STUDENT INFORMATION");
    console.log("========================================");
    console.log(`Student ID: ${student.studentId}`);
    console.log(`Student Name: ${student.getFullName()}`);

    console.log("\n========================================");
    console.log("            BOOKING HISTORY");
    console.log("========================================");

    if (studentBookings.length === 0) {
        console.log("No bookings found for this student.");
        console.log("========================================");
        return;
    }

    let combinedCost = 0;

    studentBookings.forEach((booking, index) => {
        console.log(
            `\n${index + 1}. ${booking.mealType} - ${booking.mealDate}`
        );
        console.log(`   Quantity: ${booking.quantity}`);
        console.log(`   Status: ${booking.bookingStatus}`);
        console.log(`   Dietary Note: ${booking.dietaryNote}`);
        console.log(`   Cost: K${booking.calculateTotal().toFixed(2)}`);

        combinedCost += booking.calculateTotal();
    });

    console.log("\n----------------------------------------");
    console.log(`Total Bookings: ${studentBookings.length}`);
    console.log(`Combined Cost: K${combinedCost.toFixed(2)}`);
    console.log("========================================");
}

// Main application
async function main() {
    try {
        console.log("\n========================================");
        console.log("       DINING MEAL BOOKING SYSTEM");
        console.log("             IS305 LAB 2");
        console.log("========================================\n");

        // ==============================
        // STUDENT INFORMATION
        // ==============================

        const studentId = await askQuestion("Enter Student ID: ");
        const firstName = await askQuestion("Enter First Name: ");
        const lastName = await askQuestion("Enter Last Name: ");

        const student = new Student(
            studentId,
            firstName,
            lastName
        );

        student.displayInfo();

        // ==============================
        // FIRST BOOKING
        // ==============================

        console.log("\n========================================");
        console.log("           CREATE BOOKING 1");
        console.log("========================================");

        const mealDate1 = await askQuestion("Enter meal date: ");

        console.log("\nMeal Types:");
        console.log("1. Breakfast - K10");
        console.log("2. Lunch     - K15");
        console.log("3. Dinner    - K20");

        const mealChoice1 = await askQuestion(
            "Choose meal type (1-3): "
        );

        const mealType1 = convertMealChoice(mealChoice1);

        const quantity1 = parseInt(
            await askQuestion("Enter quantity: "),
            10
        );

        const dietaryNote1 = await askQuestion(
            "Enter dietary note (or press Enter for None): "
        );

        const booking1 = new MealBooking(
            student,
            mealDate1,
            mealType1,
            quantity1,
            dietaryNote1,
            "Confirmed"
        );

        bookings.push(booking1);

        console.log("\nBooking 1 created successfully!");

        // ==============================
        // SECOND BOOKING
        // ==============================

        const createSecondBooking = await askQuestion(
            "\nDo you want to create another booking? (yes/no): "
        );

        if (createSecondBooking.toLowerCase() === "yes") {
            console.log("\n========================================");
            console.log("           CREATE BOOKING 2");
            console.log("========================================");

            const mealDate2 = await askQuestion("Enter meal date: ");

            console.log("\nMeal Types:");
            console.log("1. Breakfast - K10");
            console.log("2. Lunch     - K15");
            console.log("3. Dinner    - K20");

            const mealChoice2 = await askQuestion(
                "Choose meal type (1-3): "
            );

            const mealType2 = convertMealChoice(mealChoice2);

            const quantity2 = parseInt(
                await askQuestion("Enter quantity: "),
                10
            );

            const dietaryNote2 = await askQuestion(
                "Enter dietary note (or press Enter for None): "
            );

            const booking2 = new MealBooking(
                student,
                mealDate2,
                mealType2,
                quantity2,
                dietaryNote2,
                "Pending"
            );

            bookings.push(booking2);

            console.log("\nBooking 2 created successfully!");
        }

        // ==============================
        // DISPLAY BOOKING HISTORY
        // ==============================

        displayBookingHistory(student, bookings);

        // ==============================
        // TEST STUDENT UPDATE
        // ==============================

        const updateName = await askQuestion(
            "\nDo you want to update the student's name? (yes/no): "
        );

        if (updateName.toLowerCase() === "yes") {
            const newFirstName = await askQuestion(
                "Enter new first name: "
            );

            const newLastName = await askQuestion(
                "Enter new last name: "
            );

            student.firstName = newFirstName;
            student.lastName = newLastName;

            console.log("\nStudent information updated successfully.");

            console.log("\n========================================");
            console.log("       UPDATED BOOKING HISTORY");
            console.log("========================================");

            displayBookingHistory(student, bookings);
        }

    } catch (error) {
        console.log("\nERROR: " + error.message);
    } finally {
        rl.close();
    }
}

// Convert menu choice into meal type
function convertMealChoice(choice) {
    switch (choice) {
        case "1":
            return "Breakfast";

        case "2":
            return "Lunch";

        case "3":
            return "Dinner";

        default:
            throw new Error(
                "Invalid meal choice. Please choose 1, 2 or 3."
            );
    }
}

// Start application
main();