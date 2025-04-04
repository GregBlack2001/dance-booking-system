const { coursesDB } = require('./db');

// Create a course
exports.createCourse = (course, callback) => {
  coursesDB.insert(course, callback);
};

// Retrieve all courses
exports.getAllCourses = (callback) => {
  coursesDB.find({}, callback);
};

// Retrieve a single course by ID
exports.getCourseById = (id, callback) => {
  coursesDB.findOne({ _id: id }, callback);
};

// Update a course by ID
exports.updateCourse = (id, course, callback) => {
  coursesDB.update({ _id: id }, { $set: course }, {}, callback);
};

// Delete a course by ID
exports.deleteCourse = (id, callback) => {
  coursesDB.remove({ _id: id }, {}, callback);
};
