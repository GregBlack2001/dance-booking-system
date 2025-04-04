const bcrypt = require('bcrypt');
const { usersDB } = require('./db');

const saltRounds = 10;

// Register a new user
exports.registerUser = (userData, callback) => {
  bcrypt.hash(userData.password, saltRounds, (err, hash) => {
    if (err) return callback(err);
    
    // Set default role to "user" if not specified
    const user = {
      username: userData.username,
      password: hash,
      name: userData.name || userData.username,
      email: userData.email,
      role: userData.role || 'user'
    };
    
    usersDB.insert(user, callback);
  });
};

// Authenticate a user (login)
exports.authenticateUser = (username, password, callback) => {
  usersDB.findOne({ username }, (err, user) => {
    if (err || !user) return callback(new Error('Invalid username/password'));
    
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) callback(null, user);
      else callback(new Error('Invalid username/password'));
    });
  });
};

// Get all users (admin only)
exports.getAllUsers = (callback) => {
  usersDB.find({}, callback);
};

// Get user by username
exports.getUserByUsername = (username, callback) => {
  usersDB.findOne({ username }, callback);
};

// Update user role (admin only)
exports.updateUserRole = (username, newRole, callback) => {
  usersDB.update({ username }, { $set: { role: newRole } }, {}, callback);
};

// Delete user (admin only)
exports.deleteUser = (username, callback) => {
  usersDB.remove({ username }, {}, callback);
};

// Export the database for direct access if needed
exports.usersDB = usersDB;

