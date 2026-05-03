import mysql from 'mysql2';
import http from 'http';

const dbConnection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root'
});

dbConnection.connect();
dbConnection.query(`SHOW DATABASES LIKE 'flashcard_express'`, (err, res) => { // detect whether database already exists
    if (err) {
        console.log("DB detection error:");
        console.log(err.message);
    }
    else {
        if (res.length == 0) {
            dbConnection.query('CREATE DATABASE flashcard_express', (error) => {
                if (error) {
                    console.log("DB creation error:");
                    console.log(err.message);
                }
                else {
                    dbConnection.end();
                    startServer();
                }
            });
        }
        else {
            dbConnection.end();
            startServer();
        }
    }
});

const startServer = () => {
    const cardConnection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'root',
        database : 'flashcard_express'
    });

    cardConnection.connect()

    // create tables if they don't exist
    const createAccountsQuery = `
    CREATE TABLE IF NOT EXISTS accounts (
        username VARCHAR(50) PRIMARY KEY,
        password VARCHAR(50) NOT NULL,
        admin BOOLEAN,
        deleted BOOLEAN
    )`;
    const createCardsQuery = `
    CREATE TABLE IF NOT EXISTS cards (
        id BIGINT PRIMARY KEY,
        question VARCHAR(999) NOT NULL,
        answer VARCHAR(999) NOT NULL,
        position INTEGER NOT NULL,
        username VARCHAR(50) NOT NULL,
        FOREIGN KEY (username) REFERENCES accounts(username) ON DELETE CASCADE
    )`;
    const createLogsQuery = `
    CREATE TABLE IF NOT EXISTS logs (
        timestamp BIGINT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        type VARCHAR(10) NOT NULL,
        log_question VARCHAR(999),
        log_answer VARCHAR(999),
        FOREIGN KEY (username) REFERENCES accounts(username) ON DELETE CASCADE
    )`;

    cardConnection.query(createAccountsQuery);
    cardConnection.query(createCardsQuery);
    cardConnection.query(createLogsQuery);

    http.createServer((req, res) => { // initalise backend server
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.url === '/api/cards') {
            cardConnection.query('SELECT * FROM cards ORDER BY username, position', (err, results) => {
                if (err) {
                    res.end(JSON.stringify({ error: err.message }));
                }
                else {
                    res.end(JSON.stringify(results));
                }
            });
        }
        if (req.url === '/api/clear') {
            try {
                cardConnection.query('START TRANSACTION', () => {
                    cardConnection.query('DELETE FROM cards', () => {
                        cardConnection.query('COMMIT', () => {
                            res.end('Cleared all.');
                        })
                    })
                });
            } 
            catch (error) {
                cardConnection.query('ROLLBACK', (err) => console.log(err.message));
                console.log('Transaction failed:', error);
                res.end('Transaction failed:', error);
            }
        }
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (req.url.startsWith('/api/cards')) {
                        if (data.username && !data.id) {
                            cardConnection.query(`SELECT id, question, answer, position FROM cards WHERE username = '${data.username}' ORDER BY position`, (err, results) => {
                                if (err) {
                                    res.end(JSON.stringify({ error: err.message }));
                                }
                                else {
                                    res.end(JSON.stringify(results));
                                }
                            });
                        }
                        else if (!data.id) {
                            res.end(JSON.stringify({ error: 'Missing data' }));
                            return;
                        }
                        else if (data.username && data.position && data.question && data.answer) { // create new card
                            try {
                                const insertCardQuery = `INSERT INTO cards (id, question, answer, position, username) VALUES (?, ?, ?, ?, ?)`;
                                const insertCardLog = `INSERT INTO logs (timestamp, username, type, log_question, log_answer) VALUES (?, ?, ?, ?, ?)`; // log creation
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(insertCardQuery, [data.id, data.question, data.answer, data.position, data.username], () => {
                                        cardConnection.execute(insertCardLog, [Date.now(), data.username, 'creation', data.question, data.answer], () => {
                                            cardConnection.query('COMMIT', () => {
                                                res.end(JSON.stringify({message: `${data.id, data.question, data.answer} added to position ${data.position}`}));
                                            })
                                        })
                                    })
                                });
                            } 
                            catch (error) {
                                cardConnection.query('ROLLBACK', (err) => console.log(err.message));
                                console.log('Transaction failed:', error);
                                res.end('Transaction failed:', error);
                            }
                        }
                        else if (!data.position && data.username && data.question && data.answer) { // edit card
                            try {
                                const editCardQuery = `UPDATE cards SET question = (?), answer = (?) WHERE id = (?)`;
                                const editCardLog = `INSERT INTO logs (timestamp, username, type, log_question, log_answer) VALUES (?, ?, ?, ?, ?)`; // log edition
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(editCardQuery, [data.question, data.answer, data.id], () => {
                                        cardConnection.execute(editCardLog, [Date.now(), data.username, 'edition', data.question, data.answer], () => {
                                            cardConnection.query('COMMIT', () => {
                                                res.end(JSON.stringify({message: `${data.id} edited successfully.`}));
                                            })
                                        })
                                    })
                                });
                            } 
                            catch (error) {
                                cardConnection.query('ROLLBACK', (err) => console.log(err.message));
                                console.log('Transaction failed:', error);
                                res.end('Transaction failed:', error);
                            }
                        }
                        else if (!data.position && !data.question && !data.answer && data.username && data.positionOld) { // delete card
                            try {
                                const deleteCard = `DELETE FROM cards WHERE id = (?)`;
                                const updatePos = `UPDATE cards SET position = position - 1 WHERE username = (?) AND position > (?)`;
                                const deleteCardLog = `INSERT INTO logs (timestamp, username, type) VALUES (?, ?, ?)`; // log deletion
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(deleteCard, [data.id], () => {
                                        cardConnection.execute(updatePos, [data.username, data.positionOld], () => {
                                            cardConnection.execute(deleteCardLog, [Date.now(), data.username, 'deletion'], () => {
                                                cardConnection.query('COMMIT', () => {
                                                    res.end(JSON.stringify({message: `${data.id} deleted successfully.`}));
                                                })
                                            })
                                        })
                                    })
                                });
                            } 
                            catch (error) {
                                cardConnection.query('ROLLBACK', (err) => console.log(err.message));
                                console.log('Transaction failed:', error);
                                res.end('Transaction failed:', error);
                            }
                        }
                        else if (data.position && data.positionOld && data.username && !data.question && !data.answer) { // swap card position
                            try {
                                const clearPos = `UPDATE cards SET position = (?) WHERE position = (?) AND username = (?)`;
                                const moveItem = `UPDATE cards SET position = (?) WHERE id = (?)`;
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(clearPos, [data.positionOld, data.position, data.username], () => {
                                        cardConnection.execute(moveItem, [data.position, data.id], () => {
                                            cardConnection.query('COMMIT', () => {
                                                res.end(JSON.stringify({message: `${data.id} moved to position ${data.position}`}));
                                            })
                                        })
                                    })
                                });
                            }
                            catch (error) {
                                cardConnection.query('ROLLBACK', (err) => console.log(err.message));
                                console.log('Transaction failed:', error);
                                res.end('Transaction failed:', error);
                            }
                        }
                    }
                } 
                catch (e) {
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
        }
    }).listen(3001, () => {
        console.log(`Local MySQL Proxy Server running on http://localhost:3001`);
    });
}