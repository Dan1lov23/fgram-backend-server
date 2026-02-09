const express = require('express');
const cors = require('cors');
const app = express();

const authRouter = require('../routes/auth/auth.js');
const searchRouter = require('../routes/search/search');
const messageRouter = require('../routes/messages/messages');
const chatsRouter = require('../routes/chats/chats');
const changeProfileRouter = require('../routes/change profile/changeProfile');

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRouter);
app.use('/api/search', searchRouter);
app.use('/api/messages', messageRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/changeProfile', changeProfileRouter);

app.use('/server/uploads', express.static('uploads'));

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server run at ${PORT} port`);
});
