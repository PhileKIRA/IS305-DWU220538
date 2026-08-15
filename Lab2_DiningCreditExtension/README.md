# IS305 Lab 2 - Dining Booking Credit Extension

## Student Information

**Student Name:** Philemon KIRA

**Student ID:** 220538

**GitHub Repository:** Yhttps://github.com/PhileKIRA/IS305-DWU220538.git
---

## Project Description

This project is the Lab 2 extension of the IS305 Object-Oriented Programming Dining Meal Booking application.

Lab 2 extends the Lab 1 application by introducing a separate Student class.

In Lab 1, student information was stored directly inside the MealBooking object.

In Lab 2, student identity information is stored in a Student object, while MealBooking stores a reference to that Student object.

This allows one Student object to be connected to multiple MealBooking objects and reduces duplication of student information.

---

## Student Class

The Student class contains three private fields:

- student ID
- first name
- last name

The class uses:

- a constructor
- getters
- setters
- validation
- getFullName()
- displayInfo()

The setters reject empty student ID, first name and last name values.

---

## Student and MealBooking Relationship

A Student object is created first.

The Student object is then passed to the MealBooking constructor.

Example:

```javascript
const student = new Student(
    studentId,
    firstName,
    lastName
);

const booking = new MealBooking(
    student,
    mealDate,
    mealType,
    quantity,
    dietaryNote
);