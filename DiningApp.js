/*
  Program: Dining Meal Booking Feature
  Student Name: Philemon KIRA
  Student ID: 220538
  Date: 17 July 2026
  Description: A JavaScript program demonstrating classes,
  objects, constructors, private fields and methods.
*/

const readline = require("readline");
const MealBooking = require("./MealBooking");

const bookings = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Check for duplicate booking
function isDuplicateBooking(newBooking) {
    return bookings.some((booking) =>
        booking.studentId.toLowerCase() ===
            newBooking.studentId.toLowerCase() &&
        booking.mealDate === newBooking.mealDate &&
        booking.mealType.toLowerCase() ===
            newBooking.mealType.toLowerCase()
    );
}

// Create a new booking
async function createBooking() {
    try {
        console.log("\n========================================");
        console.log("       CREATE DINING MEAL BOOKING");
        console.log("========================================");

        const studentId = await askQuestion("Student ID: ");
        const studentName = await askQuestion("Student name: ");
        const mealDate = await askQuestion("Meal date (YYYY-MM-DD): ");

        console.log("\nMeal Types:");
        console.log("1. Breakfast - K10.00");
        console.log("2. Lunch     - K15.00");
        console.log("3. Dinner    - K20.00");

        const mealChoice = await askQuestion("Select meal type (1-3): ");

        let mealType;

        switch (mealChoice) {
            case "1":
                mealType = "Breakfast";
                break;

            case "2":
                mealType = "Lunch";
                break;

            case "3":
                mealType = "Dinner";
                break;

            default:
                throw new Error(
                    "Invalid meal type. Please select 1, 2 or 3."
                );
        }

        const quantity = await askQuestion("Quantity: ");

        const dietaryNote = await askQuestion(
            "Dietary note (press Enter for None): "
        );

        const booking = new MealBooking({
            studentId,
            studentName,
            mealDate,
            mealType,
            quantity,
            dietaryNote
        });

        // Validate booking
        booking.validate();

        // Check duplicate booking
        if (isDuplicateBooking(booking)) {
            throw new Error(
                "Duplicate booking. The same student has already " +
                "booked this meal type on this date."
            );
        }

        // Store booking in array
        bookings.push(booking);

        console.log("\nBOOKING CREATED SUCCESSFULLY");
        console.log(booking.getSummary());

    } catch (error) {
        console.log("\nERROR:", error.message);
    }
}

// Display all bookings
function displayAllBookings() {
    console.log("\n========================================");
    console.log("             ALL BOOKINGS");
    console.log("========================================");

    if (bookings.length === 0) {
        console.log("No bookings have been created.");
        return;
    }

    bookings.forEach((booking, index) => {
        console.log(`\nBooking ${index + 1}`);
        console.log(booking.getSummary());
    });
}

// Confirm a booking
async function confirmExistingBooking() {
    if (bookings.length === 0) {
        console.log("\nThere are no bookings to confirm.");
        return;
    }

    const studentId = await askQuestion(
        "\nEnter Student ID to confirm: "
    );

    const booking = bookings.find(
        (item) =>
            item.studentId.toLowerCase() ===
            studentId.toLowerCase()
    );

    if (!booking) {
        console.log("\nBooking not found.");
        return;
    }

    try {
        booking.confirmBooking();
        console.log("\nBooking confirmed successfully.");
        console.log(booking.getSummary());
    } catch (error) {
        console.log("\nERROR:", error.message);
    }
}

// Cancel a booking
async function cancelExistingBooking() {
    if (bookings.length === 0) {
        console.log("\nThere are no bookings to cancel.");
        return;
    }

    const studentId = await askQuestion(
        "\nEnter Student ID to cancel: "
    );

    const booking = bookings.find(
        (item) =>
            item.studentId.toLowerCase() ===
            studentId.toLowerCase()
    );

    if (!booking) {
        console.log("\nBooking not found.");
        return;
    }

    booking.cancelBooking();

    console.log("\nBooking cancelled successfully.");
    console.log(booking.getSummary());
}

// Required test demonstrations
function demonstrateTests() {
    console.log("\n========================================");
    console.log("        REQUIRED TEST DEMONSTRATIONS");
    console.log("========================================");

    // -------------------------------
    // Test 1: Valid booking
    // -------------------------------
    try {
        const validBooking = new MealBooking({
            studentId: "TEST001",
            studentName: "Test Student",
            mealDate: "2026-07-18",
            mealType: "Lunch",
            quantity: 2,
            dietaryNote: "No peanuts"
        });

        validBooking.validate();

        console.log("\nTEST 1 - VALID BOOKING");
        console.log("Result: PASSED");
        console.log(
            `Expected total: K30.00 | Actual total: K${validBooking
                .calculateTotal()
                .toFixed(2)}`
        );
    } catch (error) {
        console.log("\nTEST 1 - VALID BOOKING");
        console.log("Result: FAILED");
        console.log("Error:", error.message);
    }

    // -------------------------------
    // Test 2: Invalid booking
    // -------------------------------
    try {
        const invalidBooking = new MealBooking({
            studentId: "",
            studentName: "Invalid Student",
            mealDate: "2026-07-18",
            mealType: "Lunch",
            quantity: 0,
            dietaryNote: ""
        });

        invalidBooking.validate();

        console.log("\nTEST 2 - INVALID BOOKING");
        console.log("Result: FAILED");
    } catch (error) {
        console.log("\nTEST 2 - INVALID BOOKING");
        console.log("Result: PASSED");
        console.log("Application rejected invalid information.");
        console.log("Error:", error.message);
    }

    // -------------------------------
    // Test 3: Duplicate booking
    // -------------------------------
    try {
        const firstBooking = new MealBooking({
            studentId: "DUP001",
            studentName: "Duplicate Student",
            mealDate: "2026-07-18",
            mealType: "Dinner",
            quantity: 1,
            dietaryNote: ""
        });

        const secondBooking = new MealBooking({
            studentId: "DUP001",
            studentName: "Duplicate Student",
            mealDate: "2026-07-18",
            mealType: "Dinner",
            quantity: 1,
            dietaryNote: ""
        });

        bookings.push(firstBooking);

        if (isDuplicateBooking(secondBooking)) {
            throw new Error(
                "Duplicate booking detected successfully."
            );
        }

        bookings.push(secondBooking);

        console.log("\nTEST 3 - DUPLICATE BOOKING");
        console.log("Result: FAILED");
    } catch (error) {
        console.log("\nTEST 3 - DUPLICATE BOOKING");
        console.log("Result: PASSED");
        console.log(error.message);
    }

    // Remove demonstration booking
    bookings.length = 0;
}

// Main menu
async function mainMenu() {
    let running = true;

    while (running) {
        console.log("\n========================================");
        console.log("       DWU DINING MEAL BOOKING");
        console.log("========================================");
        console.log("1. Create Meal Booking");
        console.log("2. View All Bookings");
        console.log("3. Confirm Booking");
        console.log("4. Cancel Booking");
        console.log("5. Run Required Tests");
        console.log("6. Exit");
        console.log("========================================");

        const choice = await askQuestion("Enter your choice: ");

        switch (choice) {
            case "1":
                await createBooking();
                break;

            case "2":
                displayAllBookings();
                break;

            case "3":
                await confirmExistingBooking();
                break;

            case "4":
                await cancelExistingBooking();
                break;

            case "5":
                demonstrateTests();
                break;

            case "6":
                running = false;
                console.log(
                    "\nThank you for using DWU Dining Meal Booking."
                );
                rl.close();
                break;

            default:
                console.log(
                    "\nInvalid option. Please choose 1-6."
                );
        }
    }
}

mainMenu();