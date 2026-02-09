const express = require('express');

const usersDb = require('../../db create config/users db create config/usersDbCreateConfig.js');

const router = express.Router();

router.post('/searchUser', async (req, res) => {

    try {

        const {username} = req.body;

        const searchedUser = usersDb.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (searchedUser) {
            return res.status(201).json({message: "Полльзователь найден", user: searchedUser});
        } else {
            return res.status(404).json({error: "Полльзователь не найден"});
        }

    } catch (error) {
        console.error('Server error', error.message);
        return res.status(500).json({ error: 'Server error' });
    }
})

module.exports = router;
