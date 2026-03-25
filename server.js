import mysql from 'mysql2';
import { createPool } from 'mysql2/promise';
import http from 'http';

const dbConnection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'flashcards_db'
});

const pool = createPool({ 
    host: 'localhost', 
    user: 'root', 
    password: 'root', 
    database: 'flashcards_db' 
});

async function addCardAndList(position, id, question, answer) {
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
}

async function repositionCard(position, id) {
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
}

dbConnection.connect();

dbConnection.query('SHOW DATABASES', (err, res) => {
    if (err) {
        console.log("DB Creation error:");
        console.log(err.message);
    }
    else {
        const dbNames = res.map(row => row['Database']).filter(name => name !== 'flashcards_db');
        if (dbNames.length === 0) {
            dbConnection.query('CREATE DATABASE flashcards_db');
        }
    }
});

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

dbConnection.query(createCardsQuery);
dbConnection.query(createListQuery);

http.createServer((req, res) => {
    const allowedHeaders = 'Content-Type';
    const allowedMethods = 'GET,POST,OPTIONS';
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', allowedMethods);
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders);

    if (req.url === '/api/cards') {
        dbConnection.query('SELECT * FROM cards ORDER BY id', (err, results) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
            else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            }
        });
    }
    if (req.url === '/api/list') {
        dbConnection.query('SELECT * FROM list ORDER BY position', (err, results) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
            else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            }
        });
    }
    if (req.url === '/api/all') {
        dbConnection.query('SELECT * FROM list NATURAL JOIN cards ORDER BY position', (err, results) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
            else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
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
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Missing data' }));
                        return;
                    }
                    try {
                        addCardAndList(data.position, data.id, data.question, data.answer).then(() => {
                            dbConnection.query('SELECT * FROM cards ORDER BY id', (err, updatedCards) => {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(updatedCards));
                            });
                        });
                    }
                    catch (err) {
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: err.message }));
                    }
                }
                else if (req.url.startsWith('/api/list')) {
                    if (!data.position || !data.id) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Missing data' }));
                        return;
                    }
                    try {
                        repositionCard(data.position, data.id).then(() => {
                            dbConnection.query('SELECT * FROM list ORDER BY position', (err, updatedList) => {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(updatedList));
                            });
                        });
                    }
                    catch (err) {
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: err.message }));
                    }
                } 
                else {
                    res.writeHead(404);
                    res.end('Not Found');
                }
            } 
            catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
    } 
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
}).listen(3001, () => {
    console.log(`Local MySQL Proxy Server running on http://localhost:3001`);
});
