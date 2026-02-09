const express = require('express');

const usersDb = require('../../db create config/users db create config/usersDbCreateConfig.js');

const router = express.Router();

router.post('/searchUser', async (req, res) => {

    const {username} = req.body;

    try {

        const searchedUser = usersDb.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (searchedUser) {
            return res.status(201).json({message: "User is found", user: searchedUser});
        } else {
            return res.status(404).json({error: "User is not found"});
        }

    } catch (error) {
        console.error('Server error', error.message);
        return res.status(500).json({ error: 'Server error' });
    }
})

module.exports = router;
