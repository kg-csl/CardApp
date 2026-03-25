import mysql from 'mysql2';
import { createPool } from 'mysql2/promise';
import http from 'http';

const dbConnection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root'
});

async function addCardAndList(position, id, question, answer) {
  const pool = createPool({ 
      host: 'localhost', 
      user: 'root', 
      password: 'root', 
      database: 'flashcards_db' 
  });
  try {
    await pool.execute('START TRANSACTION');
    const insertCardQuery = `INSERT INTO cards (id, question, answer) VALUES (?, ?, ?)`;
    const insertListQuery = `INSERT INTO list (position, id) VALUES (?, ?)`;
    await pool.execute(insertCardQuery, [id, question, answer]);
    await pool.execute(insertListQuery, [position, id]);
    await pool.execute('COMMIT');
  } 
  catch (error) {
    await pool.execute('ROLLBACK');
    console.error('Transaction failed:', error);
    throw error;
  }
  finally {
    await pool.end();
  }
}

async function repositionCard(position, id) {
  const pool = createPool({ 
      host: 'localhost', 
      user: 'root', 
      password: 'root', 
      database: 'flashcards_db' 
  });
  try {
    await pool.execute('START TRANSACTION');
    const deleteItem = `DELETE FROM list WHERE id = (?)`;
    const insertItem = `INSERT INTO list (position, id) VALUES (?, ?)`;
    await pool.execute(deleteItem, [id]);
    await pool.execute(insertItem, [position, id]);
    await pool.execute('COMMIT');
  } 
  catch (error) {
    await pool.execute('ROLLBACK');
    console.error('Transaction failed:', error);
    throw error;
  }
  finally {
    await pool.end();
  }
}

dbConnection.connect();
dbConnection.query(`SHOW DATABASES LIKE 'flashcards_db'`, (err, res) => {
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

    const createCardsQuery = `
    CREATE TABLE IF NOT EXISTS cards (
        id BIGINT PRIMARY KEY,
        question VARCHAR(255) NOT NULL,
        answer VARCHAR(255) NOT NULL
    )`;

    const createListQuery = `
    CREATE TABLE IF NOT EXISTS list (
        position INT PRIMARY KEY,
        id BIGINT NOT NULL,
        CONSTRAINT fk_cards FOREIGN KEY (id) REFERENCES cards(id)
    )`;

    cardConnection.query(createCardsQuery);
    cardConnection.query(createListQuery);

    http.createServer((req, res) => {
        const allowedMethods = 'GET,POST,OPTIONS';
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Access-Control-Allow-Methods', allowedMethods);
        res.setHeader('Access-Control-Allow-Headers', '*');

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
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (req.url.startsWith('/api/cards')) {
                        if (!data.position || !data.id || !data.question || !data.answer) {
                            res.end(JSON.stringify({ error: 'Missing data' }));
                            return;
                        }
                        try {
                            addCardAndList(data.position, data.id, data.question, data.answer).then(() => {
                                cardConnection.query('SELECT * FROM cards ORDER BY id', (err, updatedCards) => {
                                    res.end(JSON.stringify(updatedCards));
                                });
                            });
                        }
                        catch (err) {
                            res.end(JSON.stringify({ error: err.message }));
                        }
                    }
                    else if (req.url.startsWith('/api/list')) {
                        if (!data.position || !data.id) {
                            res.end(JSON.stringify({ error: 'Missing data' }));
                            return;
                        }
                        try {
                            repositionCard(data.position, data.id).then(() => {
                                cardConnection.query('SELECT * FROM list ORDER BY position', (err, updatedList) => {
                                    res.end(JSON.stringify(updatedList));
                                });
                            });
                        }
                        catch (err) {
                            res.end(JSON.stringify({ error: err.message }));
                        }
                    } 
                    else {
                        res.end('Not Found');
                    }
                } 
                catch (e) {
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
        } 
        else {
            res.end('Not Found');
        }
    }).listen(3001, () => {
        console.log(`Local MySQL Proxy Server running on http://localhost:3001`);
    });
}