const Datastore = require('nedb');
const path = require('path');

// Create or load the bookings database
const bookingsDB = new Datastore({ filename: path.join(__dirname, 'bookings.db'), autoload: true });

// Define createBooking
const createBooking = (booking, callback) => {
  bookingsDB.insert(booking, callback);
};

// Define getBookingsByCourse
const getBookingsByCourse = (courseId, callback) => {
  bookingsDB.find({ courseId }, callback);
};

// Export the methods and DB instance
module.exports = { bookingsDB, createBooking, getBookingsByCourse };

const getBookingsByUsername = (username, callback) => {
    bookingsDB.find({ username }, callback);
  };
  
  module.exports = {
    bookingsDB,
    createBooking,
    getBookingsByCourse,
    getBookingsByUsername
  };
  
  const checkDuplicateBooking = (query, callback) => {
    bookingsDB.findOne(query, callback);
  };
  
  module.exports = {
    bookingsDB,
    createBooking,
    getBookingsByCourse,
    getBookingsByUsername,
    checkDuplicateBooking
  };