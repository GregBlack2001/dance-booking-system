const Datastore = require('nedb');
const path = require('path');

// Create or load the courses database
const coursesDB = new Datastore({ 
  filename: path.join(__dirname, 'models', 'courses.db'), 
  autoload: true 
});

// Clear all existing courses
coursesDB.remove({}, { multi: true }, function(err) {
  if (err) {
    console.error('Error clearing database:', err);
    return;
  }

  console.log('Cleared existing courses. Adding new courses...');

  // Sample courses
  const courses = [
    {
      _id: "COURSE_001",
      title: "Ballet Fundamentals",
      instructor: "Sarah Johnson",
      date: "2025-04-15",
      description: "A beginner-friendly ballet class focusing on proper technique, posture, and basic movements.",
      location: "Main Studio - Glasgow",
      price: 8.50,
      capacity: 15,
      duration: "1 hour 15 minutes",
      level: "Beginner",
      type: "weekly",
      createdAt: new Date()
    },
    {
      _id: "COURSE_002",
      title: "Contemporary Flow",
      instructor: "Michaela Rivera",
      date: "2025-04-16",
      description: "Explore fluid movements and expressive choreography in this intermediate contemporary dance class.",
      location: "Main Studio - Glasgow",
      price: 10.00,
      capacity: 12,
      duration: "1 hour 30 minutes",
      level: "Intermediate",
      type: "weekly",
      createdAt: new Date()
    },
    {
      _id: "COURSE_003",
      title: "Hip Hop Dance",
      instructor: "James Wilson",
      date: "2025-04-17",
      description: "Learn hip hop dance moves and routines in this energetic class.",
      location: "Dance Studio B - Glasgow",
      price: 9.00,
      capacity: 20,
      duration: "1 hour",
      level: "All Levels",
      type: "weekly",
      createdAt: new Date()
    }
  ];

  // Insert the courses
  coursesDB.insert(courses, function(err, newDocs) {
    if (err) {
      console.error('Error seeding courses:', err);
    } else {
      console.log('Successfully seeded courses:', newDocs);
    }
    
    // Exit the script
    process.exit();
  });
});