const bcrypt = require('bcrypt');
const Datastore = require('nedb');
const path = require('path');
const db = new Datastore({ filename: path.join(__dirname, 'models', 'users.db'), autoload: true });

// First, clear the database
db.remove({}, { multi: true }, async function (err) {
    if (err) {
        console.error('Error clearing database:', err);
        return;
    }

    try {
        // Create a password hash
        const password = 'Test123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const adminUser = {
            username: "admin1",
            password: hashedPassword,
            name: "Admin User",
            email: "admin@example.com",
            role: "admin",
            _id: "admin1_" + Date.now(),
            loginAttempts: 0,
            lockUntil: null
        };

        // Create regular user
        const regularUser = {
            username: "user1",
            password: hashedPassword,
            name: "Regular User",
            email: "user@example.com",
            role: "user",
            _id: "user1_" + Date.now(),
            loginAttempts: 0,
            lockUntil: null
        };

        // Insert users
        db.insert([adminUser, regularUser], function(err, newDocs) {
            if (err) {
                console.error('Error inserting users:', err);
            } else {
                console.log('Users created successfully:', newDocs);
            }
            process.exit();
        });
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});