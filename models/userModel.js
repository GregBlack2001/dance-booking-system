const bcrypt = require('bcrypt');
const { usersDB } = require('./db');

const saltRounds = 10;

// Register a new user
exports.registerUser = (username, password, callback) => {
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return callback(err);
    // Default role to "user"
    usersDB.insert({ username, password: hash, role: 'user' }, callback);
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


