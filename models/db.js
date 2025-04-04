const Datastore = require('nedb');
const path = require('path');

const coursesDB = new Datastore({ filename: path.join(__dirname, 'courses.db'), autoload: true });
const usersDB = new Datastore({ filename: path.join(__dirname, 'users.db'), autoload: true });

module.exports = { coursesDB, usersDB };
