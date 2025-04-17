Dance Booking System - README

Project Overview

This project implements a secure, web-based dance class booking system for a local dance organisation, built using Node.js, Express, NeDB, and Mustache templates.


Features:

Public Users:
View available dance classes and courses
Register for courses and individual classes

Organisers:
Create, read, update, and delete (CRUD) courses and classes
View and manage participant lists for each class
Authentication and authorization to ensure secure organiser access

Security:
Comprehensive server-side validation and sanitization
Session-based authentication
Input sanitization to prevent XSS attacks
Rate limiting to mitigate abuse and ensure server performance

Technology Stack:
Backend: Node.js, Express
Database: NeDB (embedded NoSQL)
Frontend: Mustache templates for server-side rendering, Bootstrap for responsive UI

Setup & Installation:
Prerequisites:
Node.js (version 18 or higher)
npm (included with Node.js)
Installation Steps

Clone the repository:
git clone https://github.com/GregBlack2001/dance-booking-system.git
cd dance-booking-system

create .env file
PORT=3000
SESSION_SECRET=18d726b706b455d5a578a83f30b1876d72e1921983e713eec8d0882e1e7f2537

Install dependencies:
npm install
Run the Application:

Start the server in development mode:
npm run dev

Access the application at:
http://localhost:3000

Testing:
Manual testing has been carried out extensively, covering:
Functional testing
UI testing
Acceptance testing

All features are validated against coursework specifications, with detailed results documented in the provided Test Report.

Usage:
Public User:
Navigate to the homepage to view available classes.
Click on a class to see more details and enrol.

Organiser:
Log in through the secure login page.
Manage courses and classes through the organiser dashboard.
View registered participants and manage class details.

Security Highlights:
Utilises CSRF protection, secure cookies, and comprehensive middleware configurations for enhanced security.
Strict validation and sanitization to protect against common vulnerabilities, such as XSS, injection, and other OWASP top security risks.

Author: Greg Black
Email: GBLACK301@caledonian.ac.uk
StudentID: S2334573


Admin: username = "admin1", password = "Test123!"
User: username = "user1", password = "Test123!"