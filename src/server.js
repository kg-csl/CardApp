import mysql from 'mysql2';
import http from 'http';

const dbConnection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root'
});

dbConnection.connect();
dbConnection.query(`SHOW DATABASES LIKE 'flashcards_db'`, (err, res) => { /* detect whether database already exists */
    if (err) {
        console.log("DB detection error:");
        console.log(err.message);
    }
    else {
        if (res.length == 0) {
            dbConnection.query('CREATE DATABASE flashcards_db', (error) => {
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
        database : 'flashcards_db'
    });

    cardConnection.connect()

    /* create tables if they don't already exist in the database */
    const createCardsQuery = `
    CREATE TABLE IF NOT EXISTS cards (
        id BIGINT PRIMARY KEY,
        question VARCHAR(999) NOT NULL,
        answer VARCHAR(999) NOT NULL
    )`;

    const createListQuery = `
    CREATE TABLE IF NOT EXISTS list (
        position INT PRIMARY KEY,
        id BIGINT NOT NULL,
        CONSTRAINT fk_cards FOREIGN KEY (id) REFERENCES cards(id)
    )`;

    cardConnection.query(createCardsQuery);
    cardConnection.query(createListQuery);

    http.createServer((req, res) => { /* initialise backend server */
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.url === '/api/cards') {
            cardConnection.query('SELECT * FROM cards ORDER BY id', (err, results) => {
                if (err) {
                    res.end(JSON.stringify({ error: err.message }));
                }
                else {
                    res.end(JSON.stringify(results));
                }
            });
        }
        if (req.url === '/api/list') {
            cardConnection.query('SELECT * FROM list ORDER BY position', (err, results) => {
                if (err) {
                    res.end(JSON.stringify({ error: err.message }));
                }
                else {
                    res.end(JSON.stringify(results));
                }
            });
        }
        if (req.url === '/api/all') {
            cardConnection.query('SELECT * FROM list NATURAL JOIN cards ORDER BY position', (err, results) => {
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
                    cardConnection.query('DELETE FROM list', () => {
                        cardConnection.query('DELETE FROM cards', () => {
                            cardConnection.query('COMMIT', () => {
                                res.end('Cleared all.');
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
                                const insertCardQuery = `INSERT INTO cards (id, question, answer) VALUES (?, ?, ?)`;
                                const insertListQuery = `INSERT INTO list (position, id) VALUES (?, ?)`;
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(insertCardQuery, [data.id, data.question, data.answer], () => {
                                        cardConnection.execute(insertListQuery, [data.position, data.id], () => {
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
                                const deleteList = `DELETE FROM list WHERE id = (?)`;
                                const deleteCard = `DELETE FROM cards WHERE id = (?)`;
                                const updateList = `UPDATE list SET position = position - 1 WHERE position > (?)`;
                                cardConnection.query('START TRANSACTION', () => {
                                    cardConnection.execute(deleteList, [data.id], () => {
                                        cardConnection.execute(deleteCard, [data.id], () => {
                                            cardConnection.execute(updateList, [data.positionOld], () => {
                                                cardConnection.query('COMMIT', () => {
                                                    res.end(JSON.stringify({message: `${data.id} removed from database.`}));
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
                    }
                    if (req.url.startsWith('/api/list')) {
                        if (!data.position || !data.positionOld || !data.id) {
                            res.end(JSON.stringify({ error: 'Missing data from list' }));
                            return;
                        }
                        try {
                            const deleteItem = `DELETE FROM list WHERE id = (?)`;
                            const swapItem = `UPDATE list SET position = ? WHERE position = ?`;
                            const insertItem = `INSERT INTO list (position, id) VALUES (?, ?)`;
                            cardConnection.query('START TRANSACTION', () => {
                                cardConnection.execute(deleteItem, [data.id], () => {
                                    cardConnection.execute(swapItem, [data.positionOld, data.position], () => {
                                        cardConnection.execute(insertItem, [data.position, data.id], () => {
                                            cardConnection.query('COMMIT', () => {
                                                res.end(JSON.stringify({message: `${data.id} moved to position ${data.position}`}));
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