const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../db create config/users db create config/usersDbCreateConfig.js');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

const nodemailer = require('nodemailer');
const user = require("nodemailer/lib/smtp-connection");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'svy1dan@gmail.com',
        pass: 'ulym azvb wmll rsqp'
    }
});

function sendEmail(to, subject, text, callback) {

    const setIsActivatedFunction = () => {
        fetch("http://localhost:3000/api/auth/activatedAccount", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email: to})
        } )
    }

    const mailOptions = {
        from: 'svy1dan@gmail.com',
        to: to,
        subject: subject,
        html: `
            <div class="text-align: center">
                <h2>Пожалуйста, подтвердите свою почту</h2>
                <a href="http://localhost:3000/confirmAccount">Ссылка на страницу с подтверждением</a>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Ошибка отправки email:', error);
            callback(error);
        } else {
            console.log('Email отправлен:', info.response);
            callback(null, info);
        }
    });
}

router.post('/register', async (req, res) => {

    const { username, password, email } = req.body;

    try {

        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

        if (existingUser) {
            return res.status(409).json({ marker: "fail", error: 'A user with this name already exists.' });
        }

        const emailCheck = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (emailCheck) {
            return res.status(409).json({ marker: "fail", error: 'A email with this name already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const runRegister = db.prepare('INSERT INTO users (username, email, password, token, iconSrc, isActivated) VALUES (?, ?, ?, ?, ?, ?)');
        runRegister.run(username, email, hashedPassword, "", "none", "false");

        sendEmail(`${email}`, "Confirm", "LOL", (err, info) => {
            if (err) {
                console.error('Ошибка при отправке письма:', err);
                return res.status(500).json({ success: false, message: 'Ошибка при отправке письма' });
            }

            res.status(201).json({ marker: "success", message: 'Пользователь успешно зарегистрирован и письмо отправлено', info });
        });

    } catch (err) {
        console.error('Server error:', err.message);
        console.log(`----------------------------------------------------`);
        return res.status(500).json({ marker: "fail", error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {

    const { username, password } = req.body;

    try {

        const user = db.prepare('SELECT id, username, password, iconSrc, email, isActivated FROM users WHERE username = ?').get(username);

        if (!user) {
            return res.status(401).json({ error: 'User does not exist' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log("Authentication failed, false password");
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        const setToken = db.prepare('UPDATE users SET token = ? WHERE id = ?');
        setToken.run(token, user.id);
        return res.status(201).json({ message: 'Successful login', token, username: user.username, iconSrc: user.iconSrc, email: user.email, isActivated: user.isActivated });
    } catch (err) {
        console.error('Server error:', err.message);
        console.log(`----------------------------------------------------`);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/sessionCheck', async (req, res) => {

    const {username, token} = req.body;

    try {

        const checkSessionToken = db.prepare('SELECT token from users WHERE username = ?').get(username);

        if (checkSessionToken.token === token) {
            res.json({marker: true})
        } else {
            res.json({marker: false})
        }

    } catch (err) {
        console.error('Server error', err.message);
        return res.status(500).json({ error: 'Server error' });
    }
})

router.post('/activatedAccount', async (req, res) => {

    const { email } = req.body;
    console.log(email);

    try {

        const setIsAccountActive = db.prepare("UPDATE users SET isActivated = ? WHERE email = ?").run("true", email);

        if (setIsAccountActive) {
            res.status(201).json({marker: "success", messages: "Success account active operation"});
        } else {
            res.status(400).json({marker: "fail", messages: "Fail account active operation"});
        }

    } catch (error) {
        console.log("Server error:", error);
        console.log(`----------------------------------------------------`);
        return res.status(500).json({ error: 'Server error' });
    }

})

module.exports = router;
