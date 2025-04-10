const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { usersDB } = require('./db');

const saltRounds = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

// Register a new user
exports.registerUser = (userData, callback) => {
  // Check if password meets complexity requirements
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(userData.password)) {
    return callback(new Error('Password does not meet complexity requirements'));
  }

  bcrypt.hash(userData.password, saltRounds, (err, hash) => {
    if (err) return callback(err);
    
    // Set default role to "user" if not specified
    const user = {
      username: userData.username,
      password: hash,
      name: userData.name || userData.username,
      email: userData.email,
      role: userData.role || 'user',
      loginAttempts: 0,
      lockUntil: null,
      created: new Date()
    };
    
    usersDB.insert(user, callback);
  });
};

// Helper function to check if account is locked
const isAccountLocked = (user) => {
  // Check for a lockUntil timestamp and if it's in the future
  return !!(user.lockUntil && user.lockUntil > Date.now());
};

// Helper function to increment login attempts
const incrementLoginAttempts = (username, callback) => {
  usersDB.findOne({ username }, (err, user) => {
    if (err || !user) return callback(err);
    
    // If the lock has expired, restart at 1 attempt
    const updates = {};
    if (user.lockUntil && user.lockUntil < Date.now()) {
      updates.loginAttempts = 1;
      updates.lockUntil = null;
    } else {
      // Increment attempts, lock if reached max
      updates.loginAttempts = user.loginAttempts + 1;
      
      // Lock account if reached max attempts
      if (updates.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockUntil = Date.now() + LOCK_TIME;
      }
    }
    
    // Update the user record
    usersDB.update({ username }, { $set: updates }, {}, (err) => {
      if (err) return callback(err);
      return callback(null);
    });
  });
};

// Reset login attempts on successful login
const resetLoginAttempts = (username, callback) => {
  usersDB.update(
    { username },
    { $set: { loginAttempts: 0, lockUntil: null } },
    {},
    callback
  );
};

// Authenticate a user (login)
exports.authenticateUser = (username, password, callback) => {
  usersDB.findOne({ username }, (err, user) => {
    if (err) return callback(err);
    
    // If user not found
    if (!user) return callback(new Error('Invalid username/password'));
    
    // Check if account is locked
    if (isAccountLocked(user)) {
      const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 60000); // in minutes
      return callback(new Error(`Account is locked. Try again in ${timeLeft} minutes.`));
    }
    
    // Compare password
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return callback(err);
      
      if (result) {
        // Successful login - reset login attempts
        resetLoginAttempts(username, (err) => {
          if (err) return callback(err);
          return callback(null, user);
        });
      } else {
        // Failed login - increment attempts
        incrementLoginAttempts(username, (err) => {
          if (err) return callback(err);
          
          let attemptsLeft = MAX_LOGIN_ATTEMPTS - (user.loginAttempts + 1);
          if (attemptsLeft <= 0) {
            return callback(new Error('Account is now locked. Try again in 30 minutes.'));
          }
          return callback(new Error(`Invalid username/password. ${attemptsLeft} attempts remaining.`));
        });
      }
    });
  });
};

// Generate password reset token
exports.generateResetToken = (email, callback) => {
  usersDB.findOne({ email }, (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(new Error('No account with that email address exists.'));
    
    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour
    
    // Update user with reset token and expiry
    usersDB.update(
      { email },
      { $set: { resetToken, resetExpires } },
      {},
      (err) => {
        if (err) return callback(err);
        callback(null, { user, resetToken });
      }
    );
  });
};

// Verify password reset token
exports.verifyResetToken = (token, callback) => {
  usersDB.findOne({
    resetToken: token,
    resetExpires: { $gt: Date.now() }
  }, callback);
};

// Reset password with token
exports.resetPassword = (token, newPassword, callback) => {
  // First find the user with valid token
  this.verifyResetToken(token, (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(new Error('Password reset token is invalid or has expired.'));
    
    // Check if password meets complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return callback(new Error('Password does not meet complexity requirements'));
    }
    
    // Hash the new password
    bcrypt.hash(newPassword, saltRounds, (err, hash) => {
      if (err) return callback(err);
      
      // Update user with new password and clear reset token
      usersDB.update(
        { resetToken: token },
        { 
          $set: { password: hash },
          $unset: { resetToken: true, resetExpires: true }
        },
        {},
        callback
      );
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

// Get user by email
exports.getUserByEmail = (email, callback) => {
  usersDB.findOne({ email }, callback);
};

// Update user role (admin only)
exports.updateUserRole = (username, newRole, callback) => {
  usersDB.update({ username }, { $set: { role: newRole } }, {}, callback);
};

// Delete user (admin only)
exports.deleteUser = (username, callback) => {
  usersDB.remove({ username }, {}, callback);
};

// Change password
exports.changePassword = (username, currentPassword, newPassword, callback) => {
  usersDB.findOne({ username }, (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(new Error('User not found'));
    
    // Verify current password
    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
      if (err) return callback(err);
      if (!isMatch) return callback(new Error('Current password is incorrect'));
      
      // Check if password meets complexity requirements
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return callback(new Error('Password does not meet complexity requirements'));
      }
      
      // Hash new password
      bcrypt.hash(newPassword, saltRounds, (err, hash) => {
        if (err) return callback(err);
        
        // Update password
        usersDB.update(
          { username },
          { $set: { password: hash } },
          {},
          callback
        );
      });
    });
  });
};

// Export the database for direct access if needed
exports.usersDB = usersDB;