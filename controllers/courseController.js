const courseModel = require('../models/courseModel');

// Show all courses
exports.showCourses = (req, res) => {
  courseModel.getAllCourses((err, courses) => {
    if (err) return res.status(500).send("Error retrieving courses");
    res.render('courses', {
      courses,
      isAdmin: req.session.user.role === 'admin'
    });
  });
};

// Show add course form
exports.addCourseForm = (req, res) => {
  res.render('add-course');
};

// Handle add course
exports.addCourse = (req, res) => {
  const course = {
    title: req.body.title,
    instructor: req.body.instructor,
    date: req.body.date,
    description: req.body.description
  };
  courseModel.createCourse(course, (err) => {
    if (err) return res.status(500).send("Error adding course");
    res.redirect('/courses');
  });
};

// Show edit form
exports.editCourseForm = (req, res) => {
  courseModel.getCourseById(req.params.id, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");
    res.render('edit-course', { course });
  });
};

// Handle edit course
exports.editCourse = (req, res) => {
  const updated = {
    title: req.body.title,
    instructor: req.body.instructor,
    date: req.body.date,
    description: req.body.description
  };
  courseModel.updateCourse(req.params.id, updated, (err) => {
    if (err) return res.status(500).send("Error updating course");
    res.redirect('/courses');
  });
};

// Handle delete course
exports.deleteCourse = (req, res) => {
  courseModel.deleteCourse(req.params.id, (err) => {
    if (err) return res.status(500).send("Error deleting course");
    res.redirect('/courses');
  });
};

