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
	const [userAuth, setUserAuth] = useState(localStorage.getItem('flashcardUser'));
	const [tokenAuth, setTokenAuth] = useState(localStorage.getItem('flashcardToken'));

	useEffect(() => {
		updateAccounts();
	}, []);

	const checkPass = (passkey, admin) => {
		let key = 0;
		fetch(`http://localhost:3001/api/hash`)
		.then(response => response.json())
		.then(data => {
			key = data.key;
			const splitPass = password.split('');
			const codedPass = splitPass.map(s => s.charCodeAt(0) * key);
			if (codedPass.join(',') == passkey) window.location.href = `/${admin ? 'admin' : 'user'}`;
			else {
				setError('Username/password incorrect.');
				setLoading(false);
			}
		});
	}

	const handleSubmit = () => {
		setLoading(true);
		if (username && password) {
			if (register) {
				if (radio == 'user') window.location.href = '/user';
				else if (radio == 'admin') window.location.href = '/admin';
			}
			else {
				let found = 0;
				let passkey = '';
				accounts.map(acc => {
					if (acc.username == username) {
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
						checkPass(passkey, false);
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

	const updateAccounts = () => { 
		fetch(`http://localhost:3001/api/accounts`, {method: 'GET', headers: {'Content-Type':'application/json'}})
		.then(response => response.json())
		.then(data => {
		setAccounts(data);
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
