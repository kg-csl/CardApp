"Flashcard Express" - a flashcard application.

This app allows you to create a set of flashcards, each with a question and answer. You can use them as memory aids or for study help. Flashcards can be shuffled, edited, deleted, and repositioned at will.

The technical stack operates as follows:
1. The user interfaces with the localhost frontend website.
2. The frontend is set up via CardApp, LoginPage, and AdminPanel.
3. Everything is styled by global.css.
4. Pages receive and send data to a server on port 3001 set up by server.js.
5. The server makes requests to a MySQL database to perform CRUD actions.

Features:
- Click anywhere on a card to flip it. A small arrow indicator will appear when cards are flipped.
- Cards can be sorted through with the use of animated arrows, or a live search.
- An intuitive list UI is located under the main card, allowing you to edit cards and their order.
- Cards can be randomised with a click of the Shuffle button.
- Cards can be mass deleted with a click of the Clear All button.
- Cards and your preferred order are stored locally, and per-user.
- Sites will automatically reroute you to relevant pages depending on whether you are logged in as a user or admin.

Folder structure:
CardApp/
├─ node_modules/
├─ src/  #where all the logic is stored
|   ├─ AdminPanel.jsx  #frontend for admins
|   ├─ App.css
|   ├─ App.jsx
|   ├─ CardApp.jsx  #frontend for users
|   ├─ global.css  #css for AdminPanel, CardApp, and LoginPage
|   ├─ index.css
|   ├─ LoginPage.jsx  #frontend for login
|   ├─ main.jsx
|   ├─ server.js  #backend
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ README.md
├─ StartApp.bat  #launches both the frontend and backend
├─ vite.config.js


Challenges:
- Data persistance was tricky, but I was able to use the SQL modules to work out how to create a local database.
- Many animations were buggy but I powered through the React logic to make them work.
- I faced several issues with aligning items using CSS but I employed the use of different styling methods to make everything seamless.
- Having persistent logins and tokens was an issue as the lectures were all about connecting JWT to FastAPI, which I was not using. However, I was able to implement my own version of tokens, taking a live-generated unique number from the server to verify if accounts were used in the same session.


This app requires a localhost MySQL service with credentials root/root. Other dependencies can be found in package.json.

Start the app by running StartApp.bat, then follow the link on the VITE window (usually http://localhost:5173/). To shut the app down, close the 2 terminals that host the frontend and database server.
