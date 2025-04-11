const userModel = require('../models/userModel');
const { 
  AppError, 
  ValidationError, 
  catchAsync 
} = require('../middleware/errorHandler');

// Show register form
exports.showRegister = (req, res) => {
  // Save the referring page to redirect back after registration
  req.session.returnTo = req.headers.referer || '/';
  res.render('register', { 
    csrfToken: req.csrfToken() 
  });
};

// Handle registration
exports.register = catchAsync(async (req, res) => {
  const { name, email, username, password } = req.body;
  const returnUrl = req.session.returnTo || '/classes';

  // Validate input (additional server-side validation)
  if (!name || !email || !username || !password) {
    return res.render('register', { 
      error: 'All fields are required',
      csrfToken: req.csrfToken()
    });
  }

  try {
    // Check if user already exists
    const existing = await new Promise((resolve, reject) => {
      userModel.getUserByUsername(username, (err, user) => {
        if (err) reject(err);
        resolve(user);
      });
    });

    if (existing) {
      return res.render('register', { 
        error: 'Username already taken',
        csrfToken: req.csrfToken()
      });
    }

    // Attempt to register user
    const newUser = await new Promise((resolve, reject) => {
      const userData = { 
        username, 
        password, 
        name, 
        email, 
        role: 'user' 
      };
      
      userModel.registerUser(userData, (err, user) => {
        if (err) reject(err);
        resolve(user);
      });
    });

    // Set user session
    req.session.user = newUser;
    delete req.session.returnTo; // Clear the stored URL

    // Redirect to return URL
    res.redirect(returnUrl);
  } catch (error) {
    // Handle registration errors
    console.error('Registration Error:', error);
    res.render('register', { 
      error: 'Failed to register. Please try again.',
      csrfToken: req.csrfToken()
    });
  }
});

// Show login form
exports.showLogin = (req, res) => {
  // Save the referring page to redirect back after login
  req.session.returnTo = req.headers.referer || '/';
  res.render('login', { 
    csrfToken: req.csrfToken() 
  });
};

// Handle login
exports.login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const returnUrl = req.session.returnTo || '/classes';

  try {
    // Attempt to authenticate user
    const user = await new Promise((resolve, reject) => {
      userModel.authenticateUser(username, password, (err, user) => {
        if (err || !user) {
          reject(err || new Error('Invalid username or password'));
        } else {
          resolve(user);
        }
      });
    });

    // Set user session
    req.session.user = user;
    delete req.session.returnTo; // Clear the stored URL
    
    // Redirect based on user role
    if (user.role === 'admin' && !returnUrl.includes('/admin') && !returnUrl.includes('/courses/')) {
      res.redirect('/courses/admin');
    } else {
      res.redirect(returnUrl);
    }
  } catch (error) {
    // Handle login errors
    console.error('Login Error:', error);
    res.render('login', { 
      error: error.message,
      csrfToken: req.csrfToken()
    });
  }
});

// Logout
exports.logout = (req, res) => {
  const returnUrl = req.headers.referer || '/';
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout Error:', err);
    }
    res.redirect(returnUrl);
  });
};

// Admin-only: Show user management dashboard
exports.showUsers = catchAsync(async (req, res) => {
  // Ensure admin access
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { 
      title: 'Access Denied',
      message: 'You do not have permission to access this page.'
    });
  }
  
  try {
    // Retrieve all users
    const users = await new Promise((resolve, reject) => {
      userModel.getAllUsers((err, users) => {
        if (err) reject(err);
        resolve(users);
      });
    });
    
    // Enrich users with role flags
    const enrichedUsers = users.map(user => ({
      ...user,
      isAdmin: user.role === 'admin',
      isUser: user.role === 'user'
    }));
    
    res.render('manage-users', {
      title: 'User Management',
      users: enrichedUsers,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('User Management Error:', error);
    res.status(500).render('error', { 
      title: 'Server Error',
      message: 'Failed to load users'
    });
  }
});

// Admin-only: Change a user's role
exports.updateUserRole = catchAsync(async (req, res) => {
  // Ensure admin access
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { 
      title: 'Access Denied',
      message: 'You do not have permission to perform this action.'
    });
  }
  
  const { username, role } = req.body;
  
  try {
    // Update user role
    await new Promise((resolve, reject) => {
      userModel.updateUserRole(username, role, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Role Update Error:', error);
    res.status(500).render('error', { 
      title: 'Update Failed',
      message: 'Failed to update user role'
    });
  }
});

// Admin-only: Delete a user
exports.deleteUser = catchAsync(async (req, res) => {
  // Ensure admin access
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { 
      title: 'Access Denied',
      message: 'You do not have permission to perform this action.'
    });
  }
  
  const { username } = req.params;
  
  // Prevent self-deletion
  if (username === req.session.user.username) {
    return res.status(400).render('error', {
      title: 'Action Prohibited',
      message: 'You cannot delete your own account'
    });
  }
  
  try {
    // Delete user
    await new Promise((resolve, reject) => {
      userModel.deleteUser(username, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User Deletion Error:', error);
    res.status(500).render('error', { 
      title: 'Deletion Failed',
      message: 'Failed to delete user'
    });
  }
});

module.exports = exports;