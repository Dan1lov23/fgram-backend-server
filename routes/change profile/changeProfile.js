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
        return res.status(400).json({ error: 'Файл или имя пользователя отсутствует' });
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
        console.error('Ошибка при удалении старых файлов:', err);
    }

    const oldPath = req.file.path;
    const newPath = path.join(userDir, req.file.filename);

    fs.renameSync(oldPath, newPath);

    const filePath = `http://localhost:3000/server/uploads/${username}/${req.file.filename}`;

    const changeAvatar = usersDb.prepare('UPDATE users SET iconSrc = ? WHERE username = ?').run(filePath, username);

    res.json({ message: 'Файл успешно загружен', path: filePath });
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
                // console.log('Процесс смены имени пользователя прошел успешно');
                res.status(200).json({ marker: "true" });
            } else {
                // console.log('Не удалось обновить сообщения');
                res.status(500).json({ marker: "false"});
            }
        } else {
            // console.log('Пользователь не найден или не произведено обновление');
            res.status(404).json({ message: "Пользователь не найден или не произведено обновление" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ marker: "fail", message: "Ошибка сервера" });
    }
});

router.post('/changePassword', async (req, res) => {
    const { oldPassword, newPassword, username, token } = req.body;
    console.log("\n Начат процесс смены пароля пользователя");

    try {
        const userPasswordRecord = usersDb.prepare('SELECT password FROM users WHERE username = ?').get(username);

        if (!userPasswordRecord) {
            console.log("Пользователь не найден");
            return res.status(404).json({ marker: "fail", message: "Пользователь не найден" });
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, userPasswordRecord.password);

        if (isPasswordValid) {
            const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

            const changeResult = usersDb.prepare('UPDATE users SET password = ? WHERE username = ? AND token = ?').run(newHashedPassword, username, token);

            if (changeResult.changes > 0) {
                console.log("Пароль успешно изменен");
                res.status(200).json({ marker: "success" });
            } else {
                console.log("Ошибка, пароль не изменен");
                res.status(400).json({ marker: "fail", message: "Ошибка на сервере, пароль не изменен" });
            }
        } else {
            console.log("Ошибка, неверный старый пароль");
            res.status(401).json({ marker: "fail", message: "Неверный старый пароль" });
        }

    } catch (error) {
        console.error('Ошибка на сервере:', error.message);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.post('/deleteAccount', async (req, res) => {

    const { username, token } = req.body;
    console.log(username, token);

    try {

        const user = usersDb.prepare('SELECT * FROM users WHERE username = ? and token = ?').get(username, token);

        if (user) {

            // console.log("User is found");
            const deletePassword = usersDb.prepare('DELETE FROM users WHERE username = ?');
            deletePassword.run(username);

            const deleteAllUsersMessages = messagesDb.prepare("DELETE * FROM messages WHERE sender = ? || recipient = ?");
            deleteAllUsersMessages.run(username);

            res.status(201).json({ marker: "success", message: "User was deleted" });

        } else {
            // console.log("User not found");
            res.status(401).json({ marker: "fail", message: "User not found" });
        }


    } catch (error) {
        console.log(error);
        res.status(401).json({ marker: "fail", message: "Server error" });
    }

})

module.exports = router;
