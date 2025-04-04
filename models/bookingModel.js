const Datastore = require('nedb');
const path = require('path');

// Create or load the bookings database
const bookingsDB = new Datastore({ filename: path.join(__dirname, 'bookings.db'), autoload: true });

// Create a new booking
const createBooking = (booking, callback) => {
  const newBooking = {
    ...booking,
    bookingDate: new Date()
  };
  
  bookingsDB.insert(newBooking, callback);
};

// Get all bookings
const getAllBookings = (callback) => {
  bookingsDB.find({}).sort({ bookingDate: -1 }).exec(callback);
};

// Get bookings for a specific course
const getBookingsByCourse = (courseId, callback) => {
  bookingsDB.find({ courseId }).sort({ bookingDate: -1 }).exec(callback);
};

// Get bookings for a specific user
const getBookingsByUsername = (username, callback) => {
  bookingsDB.find({ username }).sort({ bookingDate: -1 }).exec(callback);
};

// Get a specific booking by ID
const getBookingById = (id, callback) => {
  bookingsDB.findOne({ _id: id }, callback);
};

// Check for duplicate bookings
const checkDuplicateBooking = (query, callback) => {
  bookingsDB.findOne(query, callback);
};

// Delete a booking
const deleteBooking = (id, callback) => {
  bookingsDB.remove({ _id: id }, {}, callback);
};

// Export all functions
module.exports = {
  bookingsDB,
  createBooking,
  getAllBookings,
  getBookingsByCourse,
  getBookingsByUsername,
  getBookingById,
  checkDuplicateBooking,
  deleteBooking
};