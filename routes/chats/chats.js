const express = require('express');

const userDb = require('../../db create config/users db create config/usersDbCreateConfig.js');
const messagesDb = require('../../db create config/messages db create config/messagesDbCreateConfig.js');

const router = express.Router();

router.post('/getAllUserChats', async (req, res) => {

    const {username} = req.body;

    try {

        const allUsersMessages = messagesDb.prepare("SELECT sender, recipient FROM messages WHERE sender = ? OR recipient = ?").all(username, username);

        const chatsNamesAndIcons = [];

        const chatsNames = [];

        if (chatsNamesAndIcons) {

            for (let a = 0; a < allUsersMessages.length; a++) {
                if (allUsersMessages[a].sender !== username && !chatsNames.includes(allUsersMessages[a].sender)) {
                    const sender = allUsersMessages[a].sender;
                    const senderIcon = userDb.prepare('SELECT iconSrc FROM users WHERE username = ?').all(sender);
                    chatsNames.push(sender);
                    chatsNamesAndIcons.push({chatName: allUsersMessages[a].sender, iconSrc: senderIcon[0].iconSrc});
                } else if (allUsersMessages[a].recipient !== username && !chatsNames.includes(allUsersMessages[a].recipient)) {
                    const recipient = allUsersMessages[a].recipient;
                    const recipientIcon = userDb.prepare('SELECT iconSrc FROM users WHERE username = ?').all(recipient);
                    chatsNames.push(recipient);
                    chatsNamesAndIcons.push({chatName: allUsersMessages[a].recipient, iconSrc: recipientIcon[0].iconSrc});
                }
            }


            res.status(201).json({chats: chatsNamesAndIcons});

        } else {
            res.status(200).json({message: "Chats not found"});
        }

    } catch (error) {
        console.error('Server error:', error.message);
        return res.status(500).json({ error: 'Server Error' });
    }

})

module.exports = router;
