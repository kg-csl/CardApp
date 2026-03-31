"Flashcard Express" - a flashcard application.

This app allows you to create a set of flashcards, each with a question and answer. You can use them as memory aids or for study help. Flashcards can be shuffled, edited, deleted, and repositioned at will.

The technical stack operates as follows:
1. The user interfaces with the localhost frontend website.
2. The frontend is set up via CardApp.jsx.
3. CardApp.jsx is styled by CardApp.css.
4. CardApp.jsx receives and sends data to a server on port 3001 set up by server.js.
5. The server makes requests to a MySql database to perform CRUD actions.

Features:

Challenges:

This app requires a localhost MySql service with credentials root/root. Other dependencies can be found in package.json.

Start the app by running StartApp.bat, then follow the link on the VITE window (usually http://localhost:5173/). To shut the app down, close the 2 terminals that host the frontend and database server.