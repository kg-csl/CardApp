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
        username VARCHAR(999) PRIMARY KEY,
        password VARCHAR(999) NOT NULL,
        admin BOOLEAN,
        deleted BOOLEAN
    )`;
    const createCardsQuery = `
    CREATE TABLE IF NOT EXISTS cards (
        id BIGINT PRIMARY KEY,
        question VARCHAR(999) NOT NULL,
        answer VARCHAR(999) NOT NULL,
        position INTEGER NOT NULL,
        username VARCHAR(999) NOT NULL,
        FOREIGN KEY (username) REFERENCES accounts
    )`;
    const createHistoryQuery = `
    CREATE TABLE IF NOT EXISTS history (
        timestamp BIGINT PRIMARY KEY,
        username VARCHAR(999) NOT NULL,
        type VARCHAR(10) NOT NULL,
        message VARCHAR(999) NOT NULL,
        q_his VARCHAR(999),
        a_his VARCHAR(999),
        FOREIGN KEY (username) REFERENCES accounts
    )`;

    cardConnection.query(createAccountsQuery);
    cardConnection.query(createCardsQuery);
    cardConnection.query(createHistoryQuery);

    http.createServer((req, res) => { // initalise backend server
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.url === '/api/cards') {
            cardConnection.query('SELECT * FROM cards ORDER BY position', (err, results) => {
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
                        if (!data.id) {
                            res.end(JSON.stringify({ error: 'Missing data' }));
                            return;
                        }
                        else if (data.position && data.question && data.answer) {
                            try {
                                const insertCardQuery = `INSERT INTO cards (id, question, answer, position) VALUES (?, ?, ?, ?)`;
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(insertCardQuery, [data.id, data.question, data.answer, data.position], () => {
                                        cardConnection.query('COMMIT', () => {
                                            res.end(JSON.stringify({message: `${data.id, data.question, data.answer} added to position ${data.position}`}));
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
                        else if (!data.position && data.question && data.answer) {
                            cardConnection.query(`UPDATE cards SET question = '${data.question}', answer = '${data.answer}' WHERE id = ${data.id}`, (err, results) => {
                                if (err) {
                                    res.end(JSON.stringify({ error: err.message }));
                                }
                                else {
                                    res.end(JSON.stringify({ success: true, message: results.toString() }));
                                }
                            });
                        }
                        else if (!data.position && !data.question && !data.answer && data.positionOld) {
                            try {
                                const deleteCard = `DELETE FROM cards WHERE id = (?)`;
                                const updatePos = `UPDATE cards SET position = position - 1 WHERE position > (?)`;
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(deleteCard, [data.id], () => {
                                        cardConnection.execute(updatePos, [data.positionOld], () => {
                                            cardConnection.query('COMMIT', () => {
                                                res.end(JSON.stringify({message: `${data.id} removed from database.`}));
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
                        else if (data.position && data.positionOld && !data.question && !data.answer) {
                            try {
                                const clearPos = `UPDATE cards SET position = ? WHERE position = ?`;
                                const moveItem = `UPDATE cards SET position = ? WHERE id = ?`;
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(clearPos, [data.positionOld, data.position], () => {
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