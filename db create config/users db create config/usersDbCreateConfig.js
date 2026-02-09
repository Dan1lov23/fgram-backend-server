const Database = require('better-sqlite3');

const usersDb = new Database('../databases/users db/user.db');

try {
    usersDb.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT,
        iconSrc TEXT,
        isActivated TEXT,
        token TEXT
    )`);
} catch (err) {
    console.error('Db open error: ' + err.message);
}

module.exports = usersDb;
