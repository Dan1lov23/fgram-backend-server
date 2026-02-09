const express = require('express');
const messagesDb = require('../../db create config/messages db create config/messagesDbCreateConfig.js');

const router = express.Router();

router.post('/sendMessage', async (req, res) => {

    const {sender, recipient, messageText, messageTime} = req.body;

    try {

        const sendMessage = messagesDb.prepare('INSERT INTO messages (sender, recipient, messageText, messageTime) VALUES (?, ?, ?, ?)');
        sendMessage.run(sender, recipient, messageText, messageTime);

        res.status(201).json({message: "Message sent successfully."});

    } catch (error) {
        console.error('Server error:', error.message);
        return res.status(500).json({ error: 'Server Error' });
    }
})

router.post('/getMessages', async (req, res) => {

    const {user1, user2} = req.body;

    try {

        const searchedMessages = messagesDb.prepare('SELECT messageText, messageTime, sender, recipient, id FROM messages WHERE (sender = :user1 AND recipient = :user2) OR (sender = :user2 AND recipient = :user1)').all({ user1, user2 });

        if (searchedMessages) {
            res.status(201).json({messages: searchedMessages});
        } else {
            res.status(400).json({message: "Error"});
        }

    } catch (error) {
        console.error('Server error', error.message);
        return res.status(500).json({ error: 'Server error' });
    }

})

router.post('/deleteMessage', async (req, res) => {

    const {messageId, username} = req.body;

    try {

        const deleteMessage = messagesDb.prepare("DELETE FROM messages WHERE sender = ? AND id = ?").run(username, messageId);

        if (deleteMessage) {
            res.status(201).json({messages: "Success delete message operation"});
        } else {
            res.status(400).json({messages: "Fail delete message operation"});
        }

    } catch (error) {
        console.error('Server error:', error.message);
        return res.status(500).json({ error: 'Server error' });
    }
})

router.post('/updateMessage', async (req, res) => {

    const {messageId, newMessage} = req.body;

    try {

        const changeMessage = messagesDb.prepare("UPDATE messages SET messageText = ? WHERE id = ?").run(newMessage, messageId);

        if (changeMessage) {
            res.status(201).json({messages: "Success update message operation"});
        } else {
            res.status(400).json({message: "Fail update message operation"});
        }

    } catch (error) {
        console.error('Server error: ', error.message);
        return res.status(500).json({ error: 'Server error' });
    }

})

router.post('/deleteAllMessagesInChat', async (req, res) => {

    const {user1, user2} = req.body;

    try {

        const deleteAllMessagesInChat = messagesDb.prepare('DELETE FROM messages WHERE (sender = :user1 AND recipient = :user2) OR (sender = :user2 AND recipient = :user1)').run({ user1, user2 });
        if (deleteAllMessagesInChat) {
            res.status(201).json({messages: "Success delete chat operation"});
        } else {
            res.status(400).json({message: "Fail delete chat operation"});
        }

    } catch (error) {
        console.log("Server error:", error);
        return res.status(500).json({ error: 'Server error' });
    }

})

module.exports = router;
