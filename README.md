# IS305 Assessment Task 1 – Dining Meal Booking Feature

## Student Information

**Student Name:** Philemon KIRA  
**Student ID:** 220538  
**Course:** IS305 – Object-Oriented Programming  
**Assessment:** Assessment Task 1 – Dining Meal Booking Feature

## GitHub Repository

GitHub Repository:
https://github.com/PhileKIRA/IS305-DWU220538.git

## Program Description

The Dining Meal Booking Feature is a console-based Node.js application developed for IS305 Object-Oriented Programming.

The application allows students to create dining meal bookings by entering their student ID, student name, meal date, meal type, quantity and dietary note.

The application calculates the total meal cost and validates the booking information.

It also prevents a student from making a duplicate booking for the same meal date and meal type.

The application does not use a database. All bookings are temporarily stored in a JavaScript array while the program is running.

## Meal Prices

| Meal | Price |
|---|---:|
| Breakfast | K10.00 |
| Lunch | K15.00 |
| Dinner | K20.00 |

## Files

### MealBooking.js

Contains the `MealBooking` class.

The class demonstrates:

- Private fields
- Constructor
- Getters
- Setters
- Validation
- Meal cost calculation
- Booking confirmation
- Booking cancellation
- Booking summary

### DiningApp.js

Contains the main Node.js console application.

It provides:

- Console input
- Booking creation
- Validation
- Duplicate booking detection
- JavaScript array storage
- Booking confirmation
- Booking cancellation
- Booking receipt
- Error handling
- Required test demonstrations

## How to Run

Make sure Node.js is installed.

Open a terminal inside the `AT1_DiningFeature` folder and run:

```bash
node DiningApp.js
