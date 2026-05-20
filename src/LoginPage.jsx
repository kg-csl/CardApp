import { useState, useEffect } from 'react';
import './global.css';

export default function LoginPage() {
	const [accounts, setAccounts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [register, setRegister] = useState(false);
	const [radio, setRadio] = useState('');
	const [error, setError] = useState(null);

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	useEffect(() => {
		updateAccounts(localStorage.getItem('flashcardUser'), localStorage.getItem('flashcardToken')); // refresh accounts on page reload, and redirect if already logged in
	}, []);

	const checkPass = (passkey, admin) => { // decrypt stored password and check it against typed password
		let key = 0;
		fetch(`http://localhost:3001/api/hash`)
		.then(response => response.json())
		.then(data => {
			key = data.key;
			const splitPass = password.split('');
			const codedPass = splitPass.map(s => s.charCodeAt(0) * key); // encryption formula is charcode * hash
			if (codedPass.join(',') != passkey) {
				setError('Username/password incorrect.');
				setLoading(false);
			}
			else return fetch(`http://localhost:3001/api/token`)
		})
		.then(resp => resp.json())
		.then(tok => { // redirect to user/admin page and update token
			localStorage.setItem('flashcardUser', username);
			localStorage.setItem('flashcardToken', tok.token);
			window.location.href = `/${admin ? 'admin' : 'user'}`; // redirect on success
		});
	}

	const handleSubmit = () => {
		setLoading(true);
		if (username && password) {
			if (register) { // creating an account
				let free = true; // first check if username is unique
				accounts.map(acc => {
					if (acc.username == username) {
						setLoading(false);
						free = false;
						if (acc.deleted == 1) {
							setError('This username belonged to a recently deleted account, please use another.');
						}
						else {
							setError('This username belongs to an existing account.');
						}
					}
				})
				if (free) {
					if (password.length > 30) { // length constraints
						setError('Passwords cannot be longer than 30 characters.');
						setLoading(false);
					}
					else if (password.length < 3) {
						setError('Passwords cannot be shorter than 3 characters.');
						setLoading(false);
					}
					else {
						fetch(`http://localhost:3001/api/hash`)
						.then(response => response.json())
						.then(data => {
							const key = data.key; // encrypt user password for db storage
							const splitPass = password.split('');
							const codedPass = splitPass.map(s => s.charCodeAt(0) * key);
							const finalPass = codedPass.join(',');
							return fetch(`http://localhost:3001/api/accounts`, {
							method: 'POST', headers: {'Content-Type':'application/json'},
							body: JSON.stringify({
								username: username,
								password: finalPass,
								admin: radio == 'admin'
							})})
						})
						.then(() => fetch(`http://localhost:3001/api/token`))
						.then(resp => resp.json())
						.then(tok => { // redirect to user/admin page and update token
							localStorage.setItem('flashcardUser', username);
							localStorage.setItem('flashcardToken', tok.token);
							window.location.href = `/${radio}`
						})		
						.catch(error => {setError(`Error creating account. Please restart backend server. Message: ${error}`)});
					}
				}
			}
			else { // logging into pre-existing account
				let found = 0;
				let passkey = '';
				accounts.map(acc => {
					if (acc.username == username) { // check for username matches in the account database
						if (acc.deleted == 1) found = -1;
						else if (acc.admin == 1) {
							found = 2;
							passkey = acc.password;
						}
						else {
							found = 1;
							passkey = acc.password;
						}
					}
				})
				switch (found) {
					case -1:
						setError('This username belonged to a recently deleted account, please use another.');
						setLoading(false);
						break;
					case 0:
						setError('Username/password incorrect.');
						setLoading(false);
						break;
					case 1:
						checkPass(passkey, false); // checkPass will decrypt the password
						break;
					case 2:
						checkPass(passkey, true);
						break;
				}
			}
		} else {
			setError('Please fill in all fields.');
		}
	};

	const updateAccounts = (user, token) => { 
		fetch(`http://localhost:3001/api/accounts`, {method: 'GET', headers: {'Content-Type':'application/json'}})
		.then(response => response.json())
		.then(data => {
			setAccounts(data);
			if (user && token) { // if user/token isn't null, verify its validity
				let found = false;
				data.map(account => {
					if (!found && account.username == user) fetch(`http://localhost:3001/api/token`) // if username exists, check token
					.then(response => response.json())
					.then(result => {
						found = true;
						if (result.token == token) window.location.href = `/${account.admin == 1 ? 'admin' : 'user'}`; // redirect
						else {
							localStorage.setItem('flashcardUser', null);
							localStorage.setItem('flashcardToken', null);
						}
					})
				})
				if (!found) {
					localStorage.setItem('flashcardUser', null);
					localStorage.setItem('flashcardToken', null);
				}
			}
		})
		.catch(error => {
			console.error('Error:', error);
			setError('There has been an issue contacting the SQL service. Please restart the server.');
		});
	};

	return (
		<div className="app-container">
		<div className="app-wrapper">
			<div className="header">
				<title>Flashcard Login</title>
				<h1 className="header-title">Flashcard Express</h1>
				<h1 className="header-subtitle">Log in to access your cards!</h1>
			</div>
			<div className="login-wrapper">
				{error && (
					<div className="error-message" style={{color: '#ef4444', textAlign: 'center', marginBottom: '1rem'}}>
					{error}
					</div>
				)}
				<div className="form-group">
					<label className="field-label">
						{register ? 'Choose a unique username:' : 'Username:'}
					</label>
					<input 
						id="username"
						className="card-input" 
						placeholder="Enter your username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="username"
						required
					/>
				</div>

				<div className="form-group">
					<label htmlFor="password" className="field-label">
						{register ? 'Choose a secure password:' : 'Password:'}
					</label>
					<input 
						type="password" 
						id="password"
						className="card-input" 
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						required
					/>
				</div>

				{register && (
				<div className="radio-box">
					<div className="radio">
						<input id="radio1" name="radio" type="radio" value="user" onChange={() => setRadio(document.querySelector('input[name="radio"]:checked').value)}/>
						<label htmlFor="radio1" className="radio-label">User account for learning</label>
					</div>

					<div className="radio">
						<input id="radio2" name="radio" type="radio" value="admin" onChange={() => setRadio(document.querySelector('input[name="radio"]:checked').value)}/>
						<label htmlFor="radio2" className="radio-label">Admin account for supervison</label>
					</div>
				</div>
				)}

				{register ? (
					<div className="modal-button-group">
						<button 
							onClick={() => {
								setRegister(false);
								setUsername('');
								setPassword('');
							}}
							className="grey-button"
							>
							{'Go back'}
						</button>
						<button 
							onClick={handleSubmit}
							className="add-button" 
							disabled={loading || !username || !password || radio == ''}
							>
							{loading ? 'Creating account...' : 'Create account'}
						</button>
					</div>
				) : (
					<div className="modal-button-group">
						<button 
							onClick={() => {
								setRegister(true);
								setUsername('');
								setPassword('');
								setRadio('');
							}}
							className="add-button register"
							>
							{'Register?'}
						</button>
						<button 
							onClick={handleSubmit}
							className="add-button" 
							disabled={loading || !username || !password}
							>
							{loading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>
				)}
			</div>	
		</div>
		</div>
	);
}
