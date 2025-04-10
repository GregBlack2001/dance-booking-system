// seed-courses.js
const Datastore = require('nedb');
const path = require('path');

// Create or load the courses database
const coursesDB = new Datastore({ 
  filename: path.join(__dirname, 'models', 'courses.db'), 
  autoload: true 
});

// Dance classes data
const danceClasses = [
  // Weekly Classes (Regular Ongoing Sessions)
  {
    title: "Ballet Fundamentals",
    instructor: "Sarah Johnson",
    date: "2025-04-15",
    description: "A beginner-friendly ballet class focusing on proper technique, posture, and basic movements. Perfect for those new to ballet or returning after a break.",
    location: "Main Studio - Glasgow",
    price: 8.50,
    capacity: 15,
    duration: "1 hour 15 minutes",
    level: "Beginner",
    type: "weekly",
    frequency: "weekly",
    totalSessions: 12,
    time: "18:00-19:15"
  },
  {
    title: "Contemporary Flow",
    instructor: "Michaela Rivera",
    date: "2025-04-16",
    description: "Explore fluid movements and expressive choreography in this intermediate contemporary dance class. Previous dance experience recommended.",
    location: "Main Studio - Glasgow",
    price: 10.00,
    capacity: 12,
    duration: "1 hour 30 minutes",
    level: "Intermediate",
    type: "weekly",
    frequency: "weekly",
    totalSessions: 12,
    time: "19:30-21:00"
  },
  {
    title: "Hip Hop Foundations",
    instructor: "Jamal Williams",
    date: "2025-04-17",
    description: "Learn foundational hip hop moves and techniques in this energetic class suitable for all fitness levels. No previous dance experience required.",
    location: "Urban Dance Centre - Edinburgh",
    price: 9.00,
    capacity: 20,
    duration: "1 hour",
    level: "Beginner",
    type: "weekly",
    frequency: "weekly",
    totalSessions: 10,
    time: "18:30-19:30"
  },
  {
    title: "Scottish Country Dancing",
    instructor: "Fiona MacKenzie",
    date: "2025-04-14",
    description: "Learn traditional Scottish country dances in a friendly, supportive environment. Great way to keep fit and connect with Scottish culture.",
    location: "Community Hall - Stirling",
    price: 7.50,
    capacity: 24,
    duration: "1 hour 30 minutes",
    level: "All Levels",
    type: "weekly",
    frequency: "weekly",
    totalSessions: 8,
    time: "19:00-20:30"
  },
  {
    title: "Advanced Jazz Technique",
    instructor: "Daniel Martinez",
    date: "2025-04-18",
    description: "Refine your jazz technique with challenging combinations and choreography. For dancers with previous jazz experience.",
    location: "Main Studio - Glasgow",
    price: 12.00,
    capacity: 10,
    duration: "1 hour 30 minutes",
    level: "Advanced",
    type: "weekly",
    frequency: "weekly",
    totalSessions: 12,
    time: "17:30-19:00"
  },
  {
    title: "Dance Fitness",
    instructor: "Emma Thompson",
    date: "2025-04-15",
    description: "A fun, high-energy dance workout combining elements of different dance styles. Great for improving fitness and coordination.",
    location: "FitLife Centre - Stirling",
    price: 7.00,
    capacity: 25,
    duration: "1 hour",
    level: "All Levels",
    type: "weekly",
    frequency: "weekly",
    totalSessions: 10,
    time: "12:15-13:15"
  },
  {
    title: "Salsa for Beginners",
    instructor: "Carlos Rodriguez",
    date: "2025-04-17",
    description: "Learn the basics of salsa dancing in this fun, social class. No partner needed, all welcome!",
    location: "Southside Studio - Glasgow",
    price: 9.50,
    capacity: 20,
    duration: "1 hour 30 minutes",
    level: "Beginner",
    type: "weekly",
    frequency: "weekly",
    totalSessions: 8,
    time: "19:45-21:15"
  },
  {
    title: "Tap Dance Basics",
    instructor: "Thomas Reed",
    date: "2025-04-20",
    description: "Introduction to tap dancing fundamentals and simple routines. Tap shoes required, available to rent for a small fee.",
    location: "Main Studio - Glasgow",
    price: 8.50,
    capacity: 12,
    duration: "1 hour",
    level: "Beginner",
    type: "weekly",
    frequency: "weekly",
    totalSessions: 8,
    time: "10:00-11:00"
  },
  
  // Weekend Workshops
  {
    title: "Contemporary Choreography Intensive",
    instructor: "Zoe Clark",
    date: "2025-05-17",
    description: "An immersive weekend workshop focused on contemporary choreography and performance techniques. Suitable for intermediate to advanced dancers with previous contemporary experience.",
    location: "Main Studio - Glasgow",
    price: 85.00,
    capacity: 15,
    duration: "2 days (12 hours total)",
    level: "Intermediate/Advanced",
    type: "workshop",
    totalSessions: 4,
    time: "10:00-16:00",
    schedule: JSON.stringify([
      {day: "Saturday", sessions: ["10:00-12:00", "13:00-16:00"]},
      {day: "Sunday", sessions: ["10:00-12:00", "13:00-16:00"]}
    ])
  },
  {
    title: "Scottish Ceilidh Dance Weekend",
    instructor: "Hamish MacDonald",
    date: "2025-06-14",
    description: "Learn traditional Scottish ceilidh dances over a fun-filled weekend. No experience necessary, just bring your enthusiasm!",
    location: "Community Hall - Edinburgh",
    price: 45.00,
    capacity: 30,
    duration: "2 days (8 hours total)",
    level: "All Levels",
    type: "workshop",
    totalSessions: 4,
    time: "14:00-18:00",
    schedule: JSON.stringify([
      {day: "Saturday", sessions: ["14:00-16:00", "16:30-18:00"]},
      {day: "Sunday", sessions: ["14:00-16:00", "16:30-18:00"]}
    ])
  },
  {
    title: "Urban Dance Styles Masterclass",
    instructor: "Jamal Williams & Guest Instructors",
    date: "2025-07-26",
    description: "Explore various urban dance styles including hip hop, breaking, popping, and house in this dynamic weekend workshop with multiple instructors.",
    location: "Urban Dance Centre - Edinburgh",
    price: 70.00,
    capacity: 20,
    duration: "2 days (10 hours total)",
    level: "Intermediate",
    type: "workshop",
    totalSessions: 4,
    time: "12:00-17:00",
    schedule: JSON.stringify([
      {day: "Saturday", sessions: ["12:00-14:00", "15:00-17:00"]},
      {day: "Sunday", sessions: ["12:00-14:00", "15:00-17:00"]}
    ])
  },
  {
    title: "Ballet Intensive for Adults",
    instructor: "Alexandra Peters",
    date: "2025-09-20",
    description: "A comprehensive weekend ballet workshop designed for adult dancers of intermediate level. Focus on technique, musicality, and short combinations.",
    location: "Main Studio - Glasgow",
    price: 65.00,
    capacity: 12,
    duration: "2 days (10 hours total)",
    level: "Intermediate",
    type: "workshop",
    totalSessions: 4,
    time: "09:30-14:30",
    schedule: JSON.stringify([
      {day: "Saturday", sessions: ["09:30-11:30", "12:30-14:30"]},
      {day: "Sunday", sessions: ["09:30-11:30", "12:30-14:30"]}
    ])
  },
  
  // Short Courses
  {
    title: "Wedding Dance Preparation",
    instructor: "Maria Lopez",
    date: "2025-05-06",
    description: "A 4-week course for couples preparing for their first dance. Learn techniques to move confidently and create a memorable moment on your special day.",
    location: "Southside Studio - Glasgow",
    price: 120.00,
    capacity: 8,
    duration: "4 weeks (6 hours total)",
    level: "All Levels",
    type: "short_course",
    frequency: "weekly",
    totalSessions: 4,
    time: "19:30-21:00"
  },
  {
    title: "Introduction to Ballroom",
    instructor: "Richard and Julia Watson",
    date: "2025-04-24",
    description: "Learn the fundamentals of ballroom dancing including waltz, foxtrot, and quickstep in this beginner-friendly 6-week course.",
    location: "Main Studio - Glasgow",
    price: 60.00,
    capacity: 16,
    duration: "6 weeks (9 hours total)",
    level: "Beginner",
    type: "short_course",
    frequency: "weekly",
    totalSessions: 6,
    time: "19:00-20:30"
  },
  {
    title: "Modern Jazz for Teens",
    instructor: "Katie Bennett",
    date: "2025-05-03",
    description: "A dynamic 8-week jazz course specifically designed for teenagers ages 13-17. Develop technique while dancing to current music.",
    location: "Main Studio - Glasgow",
    price: 72.00,
    capacity: 15,
    duration: "8 weeks (12 hours total)",
    level: "Teen/Beginner-Intermediate",
    type: "short_course",
    frequency: "weekly",
    totalSessions: 8,
    time: "14:00-15:30"
  }
];

// Clear existing courses first (comment this out if you want to keep existing courses)
// If you want to keep your existing course, comment out the next 7 lines (from coursesDB.remove to the closing brace)
coursesDB.remove({}, { multi: true }, function(err) {
  if (err) {
    console.error('Error clearing database:', err);
    return;
  }
  
  console.log('Database cleared. Inserting new courses...');
  
  // Insert all courses
  coursesDB.insert(danceClasses, function(err, newDocs) {
    if (err) {
      console.error('Error inserting courses:', err);
    } else {
      console.log(`Successfully added ${newDocs.length} courses to the database.`);
    }
  });
});

// If you commented out the database clearing section above, uncomment these lines to add courses without clearing
/*
coursesDB.insert(danceClasses, function(err, newDocs) {
  if (err) {
    console.error('Error inserting courses:', err);
  } else {
    console.log(`Successfully added ${newDocs.length} courses to the database.`);
  }
});
*/