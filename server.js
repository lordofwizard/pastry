const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 8080;

const db = new sqlite3.Database('pastes.db');

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS pastes (token TEXT PRIMARY KEY, content TEXT)');
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/submit', (req, res) => {
    const token = crypto.randomBytes(5).toString('hex');
    const content = req.body.content;

    const insertStmt = db.prepare('INSERT INTO pastes VALUES (?, ?)');
    insertStmt.run(token, content);
    insertStmt.finalize();

    res.redirect(`/paste/${token}`);
});
app.use(express.static('.'));

app.get('/paste/:token', (req, res) => {
    const token = req.params.token;

    const selectStmt = db.prepare('SELECT content FROM pastes WHERE token = ?');
    selectStmt.get(token, (err, row) => {
        if (err) {
            console.error(err);
            res.send('Error retrieving paste');
        } else {
            const content = row ? row.content : 'Paste not found';
            res.send(`<pre>${content}</pre>`);
        }
    });

    selectStmt.finalize();
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
