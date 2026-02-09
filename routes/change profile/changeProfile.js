const express = require('express');

const usersDb = require('../../db create config/users db create config/usersDbCreateConfig.js');
const messagesDb = require('../../db create config/messages db create config/messagesDbCreateConfig');

const bcrypt = require("bcrypt");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const SALT_ROUNDS = 10;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = 'uploads';

        if (!fs.existsSync(tempDir)){
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'temp-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

router.post('/changeAvatar', upload.single('image'), async (req, res) => {

    const { username } = req.body;

    if (!req.file || !username) {
        return res.status(400).json({ error: 'File or username doesn\'t exist' });
    }

    const userDir = path.join('uploads', username);

    if (!fs.existsSync(userDir)){
        fs.mkdirSync(userDir, { recursive: true });
    }

    try {
        const files = fs.readdirSync(userDir);
        for (const file of files) {
            fs.unlinkSync(path.join(userDir, file));
        }

    } catch (err) {
        console.error('Old files delete operations failed', err);
    }

    const oldPath = req.file.path;
    const newPath = path.join(userDir, req.file.filename);

    fs.renameSync(oldPath, newPath);

    const filePath = `http://localhost:3000/server/uploads/${username}/${req.file.filename}`;

    const changeAvatar = usersDb.prepare('UPDATE users SET iconSrc = ? WHERE username = ?').run(filePath, username);

    if (changeAvatar) {
        res.json({ message: 'Icon is changed', path: filePath });
    }

});

router.post('/changeUsername', async (req, res) => {

    const { oldUsername, newUsername} = req.body;

    try {
        const changeUserResult = usersDb.prepare("UPDATE users SET username = ? WHERE username = ?").run(newUsername, oldUsername);

        if (changeUserResult.changes > 0) {
            const changeMessagesResult = messagesDb.prepare("UPDATE messages SET sender = ? WHERE sender = ?").run(newUsername, oldUsername);

            let changeMessagesRecipientResult = null;
            changeMessagesRecipientResult = messagesDb.prepare("UPDATE messages SET recipient = ? WHERE recipient = ?").run(newUsername, oldUsername);

            if (changeMessagesResult.changes >= 0 && changeMessagesRecipientResult.changes >= 0) {
                res.status(200).json({ marker: "true" });
            } else {
                res.status(500).json({ marker: "false"});
            }
        } else {
            res.status(404).json({ message: "Username update operation failed" });
        }
    } catch (error) {
        console.log("Server error:", error.message);
        res.status(500).json({ marker: "fail", message: "Server Error" });
    }
});

router.post('/changePassword', async (req, res) => {

    const { oldPassword, newPassword, username, token } = req.body;

    try {
        const userPasswordRecord = usersDb.prepare('SELECT password FROM users WHERE username = ?').get(username);

        if (!userPasswordRecord) {
            return res.status(404).json({ marker: "fail", message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, userPasswordRecord.password);

        if (isPasswordValid) {
            const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

            const changeResult = usersDb.prepare('UPDATE users SET password = ? WHERE username = ? AND token = ?').run(newHashedPassword, username, token);

            if (changeResult.changes > 0) {
                res.status(200).json({ marker: "success" });
            } else {
                res.status(400).json({ marker: "fail", message: "Password reset fail" });
            }
        } else {
            res.status(401).json({ marker: "fail", message: "Password not match" });
        }

    } catch (error) {
        console.error('Server error:', error.message);
        return res.status(500).json({ error: 'Server Error' });
    }
});

router.post('/deleteAccount', async (req, res) => {

    const { username, token } = req.body;

    try {

        const user = usersDb.prepare('SELECT * FROM users WHERE username = ? and token = ?').get(username, token);

        if (user) {

            const deletePassword = usersDb.prepare('DELETE FROM users WHERE username = ?');
            deletePassword.run(username);

            const deleteAllUsersMessages = messagesDb.prepare("DELETE * FROM messages WHERE sender = ? || recipient = ?");
            deleteAllUsersMessages.run(username);

            res.status(201).json({ marker: "success", message: "User was deleted" });

        } else {
            res.status(401).json({ marker: "fail", message: "User not found" });
        }


    } catch (error) {
        console.log("Server error:", error.message);
        res.status(401).json({ marker: "fail", message: "Server error" });
    }

})

module.exports = router;
