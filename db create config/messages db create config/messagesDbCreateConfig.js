const Database = require('better-sqlite3');

const messagesDb = new Database('../databases/messages db/messages.db');

try {
    messagesDb.exec(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        recipient TEXT,
        messageText TEXT,
        messageTime INTEGER
    )`);
} catch (err) {
    console.error('Db open error: ' + err.message);
}

module.exports = messagesDb;
