const userModel = require('../models/userModel');

// Show register form
exports.showRegister = (req, res) => {
  // Save the referring page to redirect back after registration
  req.session.returnTo = req.headers.referer || '/';
  res.render('register');
};

// Handle registration
exports.register = (req, res) => {
  const { name, email, username, password } = req.body;
  const returnUrl = req.session.returnTo || '/classes';

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
      delete req.session.returnTo; // Clear the stored URL
      res.redirect(returnUrl);
    });
  });
};

// Show login form
exports.showLogin = (req, res) => {
  // Save the referring page to redirect back after login
  req.session.returnTo = req.headers.referer || '/';
  res.render('login');
};

// Handle login
exports.login = (req, res) => {
  const { username, password } = req.body;
  const returnUrl = req.session.returnTo || '/classes';

  userModel.authenticateUser(username, password, (err, user) => {
    if (err || !user) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    req.session.user = user;
    delete req.session.returnTo; // Clear the stored URL
    
    // If the user is an admin and was trying to access a non-admin page
    if (user.role === 'admin' && !returnUrl.includes('/admin') && !returnUrl.includes('/courses/')) {
      res.redirect('/courses/admin');
    } else {
      res.redirect(returnUrl);
    }
  });
};

// Logout
exports.logout = (req, res) => {
  const returnUrl = req.headers.referer || '/';
  req.session.destroy(() => {
    res.redirect(returnUrl);
  });
};

// Admin-only: Show user management dashboard
exports.showUsers = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access Denied');
  }
  
  userModel.getAllUsers((err, users) => {
    if (err) return res.status(500).send('Failed to load users');
    
    // Add boolean flags for each user's role to help with the template
    const enrichedUsers = users.map(user => ({
      ...user,
      isAdmin: user.role === 'admin',
      isUser: user.role === 'user'
    }));
    
    res.render('manage-users', {
      title: 'User Management',
      users: enrichedUsers
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
  
  // Prevent self-deletion
  if (username === req.session.user.username) {
    return res.status(400).send('You cannot delete your own account');
  }
  
  userModel.deleteUser(username, (err) => {
    if (err) return res.status(500).send('Failed to delete user');
    
    res.redirect('/admin/users');
  });
};