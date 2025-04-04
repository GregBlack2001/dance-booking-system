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

  // Check if user already exists
  userModel.getUserByUsername(username, (err, existing) => {
    if (err) return res.render('register', { error: 'Error checking username' });
    if (existing) return res.render('register', { error: 'Username already taken' });

    const userData = { username, password, name, email, role: 'user' };
    userModel.registerUser(userData, (err, newUser) => {
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
      res.redirect('/courses/admin');
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

// Admin-only: Show user management dashboard
exports.showUsers = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access Denied');
  }
  
  userModel.getAllUsers((err, users) => {
    if (err) return res.status(500).send('Failed to load users');
    
    res.render('manage-users', {
      title: 'User Management',
      users
    });
  });
};

// Admin-only: Change a user's role
exports.updateUserRole = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access Denied');
  }
  
  const { username, role } = req.body;
  
  userModel.updateUserRole(username, role, (err) => {
    if (err) return res.status(500).send('Failed to update user role');
    
    res.redirect('/admin/users');
  });
};

// Admin-only: Delete a user
exports.deleteUser = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access Denied');
  }
  
  const { username } = req.params;
  
  userModel.deleteUser(username, (err) => {
    if (err) return res.status(500).send('Failed to delete user');
    
    res.redirect('/admin/users');
  });
};