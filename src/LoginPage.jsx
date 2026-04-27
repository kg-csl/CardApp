import { useState } from 'react';
import './global.css';

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [register, setRegister] = useState(false);
	const [error, setError] = useState(null);

	const handleSubmit = () => {
		setLoading(true);
		
		// placeholder
		setTimeout(() => {
		if (username && password) {
			window.location.href = '/user';
		} else {
			setError('Please fill in all fields.');
		}
		}, 1000);
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
							{'Back to Sign In'}
						</button>
						<button 
							onClick={handleSubmit}
							className="add-button" 
							disabled={loading || !username || !password}
							>
							{loading ? 'Creating account...' : 'Create Account'}
						</button>
					</div>
				) : (
					<div className="modal-button-group">
						<button 
							onClick={() => {
								setRegister(true);
								setUsername('');
								setPassword('');
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
							{loading ? 'Signing in...' : 'Sign In'}
						</button>
					</div>
				)}
			</div>	
		</div>
		</div>
	);
}
