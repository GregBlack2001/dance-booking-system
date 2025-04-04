const userModel = require('../models/userModel');

// Show register form
exports.showRegister = (req, res) => {
  res.render('register');
};

// Handle registration
exports.register = (req, res) => {
  const { name, email, username, password } = req.body;

  if (!name || !email || !username || !password) {
    return res.render('register', { error: 'All fields are required' });
  }

  // Check if user already exists manually
  userModel.usersDB.findOne({ username }, (err, existing) => {
    if (err) return res.render('register', { error: 'Error checking username' });
    if (existing) return res.render('register', { error: 'Username already taken' });

    // Add name and email manually
    const user = { username, password, name, email, role: 'user' };
    userModel.usersDB.insert(user, (err, newUser) => {
      if (err) return res.render('register', { error: 'Failed to register' });

      req.session.user = newUser;
      res.redirect('/classes');
    });
  });
};

// Show login form
exports.showLogin = (req, res) => {
  res.render('login');
};

// Handle login
exports.login = (req, res) => {
  const { username, password } = req.body;

  userModel.authenticateUser(username, password, (err, user) => {
    if (err || !user) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    req.session.user = user;
    if (user.role === 'admin') {
      res.redirect('/courses');
    } else {
      res.redirect('/classes');
    }
  });
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};


