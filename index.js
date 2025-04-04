const express = require('express');
const mustacheExpress = require('mustache-express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Mustache templating setup with partials
app.engine('mustache', mustacheExpress(path.join(__dirname, 'views', 'partials')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set true if using HTTPS
}));

// Inject user & isAdmin to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  next();
});

// Route setup
const courseRoutes = require('./routes/courseRoutes');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use('/courses', courseRoutes);
app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', bookingRoutes);

// Server startup
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
