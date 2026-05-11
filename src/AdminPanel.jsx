import { useState, useEffect } from 'react';
import { Redo, CircleChevronLeft, CircleChevronRight, Eye, User } from 'lucide-react';
import './global.css';

export default function AdminPanel() {
	const [admin, setAdmin] = useState('admin');
	const [logs, setLogs] = useState([{
		timestamp: 0,
		username: '',
		type: '',
		log_id: 0,
		log_question: '',
		log_answer: ''
	}]);
	const [target, setTarget] = useState('default');
	const [cards, setCards] = useState([]);
	const [activeCard, setActiveCard] = useState({
		id: 0,
		question: '',
		answer: '',
		position: 0,
		flipped: false
	});
	const [spotlight, setSpotlight] = useState({
		question: '',
		answer: '',
		state: ''
	});

	const [freeze, setFreeze] = useState(false);
	const [textFade, setTextFade] = useState(1); // -1/1: fadeOut/In, -2/2: leftOut/In, -3/3, rightOut/In

	const [isModal, setModal] = useState(false);
	const [isError, setError] = useState(false);
	const [modalFade, setModalFade] = useState(false);

	let defaultSize = 30;
	let disableMain = false;

	useEffect(() => {
		updateCards(target);
		updateLogs();
	}, []);

	const updateCards = (user) => { 
		setFreeze(true);
		fetch(`http://localhost:3001/api/cards`, {
		method: 'GET', headers: {'Content-Type':'application/json'}})
		.then(response => response.json())
		.then(data => {
		let tempCards = [];
		data.map(d => {
			if (d.username == user) tempCards.push(d);
		})
		setCards(tempCards);
		if (tempCards.length == 0) {
			setTimeout(() => {
			setFreeze(false);
			document.querySelector('.header-subtitle').style.fontSize = defaultSize + 'px';
			}, 50);
		}
		else {
			setActiveCard({...tempCards[0], flipped: false});
			setTimeout(() => {
			setFreeze(false);
			document.querySelector('.header-subtitle').style.fontSize = defaultSize + 'px';
			}, 50);
		}
		})
		.catch(error => {
		console.error('Error:', error);
		errorModal();
		});
	};

	const updateLogs = () => { 
		fetch(`http://localhost:3001/api/logs`, {method: 'GET', headers: {'Content-Type':'application/json'}})
		.then(response => response.json())
		.then(data => {
		setLogs(data);
		})
		.catch(error => {
		console.error('Error:', error);
		errorModal();
		});
	};

	const errorModal = () => {
		setError(true);
		setModalFade(true);
		setModal(true);
	}

	const calcFade = () => {
		if (textFade > 0) return [null, 'fadeIn', 'fadeInLeft', 'fadeInRight'][textFade];
		else return [null, 'fadeOut', 'fadeOutLeft', 'fadeOutRight'][-textFade];
	}

	const nextCard = (forward) => {
		if (!freeze) {
		setFreeze(true);
		setTextFade(forward ? -2 : -3);
		setTimeout(() => {
			let pos = activeCard.position;
			pos = forward ? pos + 1 : pos - 1;
			setActiveCard({...cards.find(card => card.position == pos), flipped: false});
			setTimeout(() => {
			const mainText = document.querySelector('.main-text');
			mainText.style.fontSize = defaultSize + 'px';
			mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
			setTextFade(forward ? 3 : 2);
			setTimeout(() => { setFreeze(false) }, 150)
			}, 1);
		}, 150);
		}
	}

	const peek = (log) => {
		fetch(`http://localhost:3001/api/cards`, {method: 'GET', headers: {'Content-Type':'application/json'}})
		.then(response => response.json())
		.then(data => {
			let status = 'Deleted';
			try {
				const card = data.find(c => c.id == log.log_id);
				if (card.question == log.log_question && card.answer == log.log_answer) status = 'Active';
				else status = 'Edited';
			}
			catch { }
			setModalFade(true);
			setModal(true);
			setSpotlight({question: log.log_question, answer: log.log_answer, state: status});
		})
		.catch(error => {
		console.error('Error:', error);
		errorModal();
		});
	}

	const closeModal = () => {
		setModalFade(false);
		setTimeout(() => {
			setModal(false);
			setError(0);
		}, 150);
	};

	function shrinkText() { // runs whenever long text is rendered in the main card space, attempts to shrink text to fit the height of the box
		const inputField = document.querySelector('.main-text');
		const containerField = document.querySelector('.active-box');
		let fontSize = parseFloat(window.getComputedStyle(inputField).fontSize);
		inputField.style.fontSize = (fontSize - 1) + 'px';
		inputField.clientHeight >= containerField.clientHeight && shrinkText();
	}

	return (
		<div className={`app-container ${isModal ? 'active-modal' : ''}`}>
		<div className="app-wrapper">
			<div className="header">
			<title>Flashcard Admin Panel</title>
			<h1 className="header-title">Flashcard Admin Panel</h1>
			<h1 className="header-subtitle">Viewing active flashcards of user {target}</h1>
			</div>

			{cards.length == 0 ? (
			<div className="empty-box">
				<div className="empty-icon">📝</div>
				<p className="header-subtitle">Targeted user has no active flashcards.</p>
			</div>
			) : (
			<div onClick={() => { // click anywhere on this div to flip question/answer
				if (textFade > 0 && !freeze && !disableMain) {
				setFreeze(true);
				setTextFade(-1);
				setTimeout(() => {
					setActiveCard({...activeCard, flipped: !activeCard.flipped});
					setTimeout(() => {
					const mainText = document.querySelector('.main-text');
					mainText.style.fontSize = defaultSize + 'px';
					mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
					setTextFade(1);
					setTimeout(() => { setFreeze(false) }, 150)
					}, 1);
				}, 150);
				}
			}} className='active-box'>
				<div style={{ display: `flex`, justifyContent: `space-between`, alignItems: `center`, minHeight: `20em`, maxHeight: `20em`}}>
				<button onClick={() => nextCard(false)}
				onMouseEnter={() => disableMain = true} 
				onMouseLeave={() => disableMain = false}
				className="edit-button" disabled={freeze || activeCard.position == 1}>
					<CircleChevronLeft size={30} />
				</button>
				<p className={`main-text ${calcFade()}`}>
					{activeCard.flipped ? activeCard.answer : activeCard.question}
				</p>
				<button onClick={() => nextCard(true)}
				onMouseEnter={() => disableMain = true} 
				onMouseLeave={() => disableMain = false}
				className="edit-button" disabled={freeze || activeCard.position == cards.length}>
					<CircleChevronRight size={30} />
				</button>
				</div>
				<div style={{ padding: `0rem`, transform: `translate(-240px, -355px)`, opacity: `${activeCard.flipped ? 1 : 0}` }} className={`${activeCard.flipped ? 'fadeIn' : 'fadeOut'}`}>
				<Redo size={25}/>
				</div>
				<div style={{ padding: `0rem`, transform: `translate(0px, -20px)`}}>
				{`${activeCard.position} / ${cards.length}`}
				</div>
			</div>
			)}
		</div>

		<div className="card-list">
		<div className="input-section">
			<p>Filter logs by username...</p>
		</div>
		{logs.length != 0 && <ul className="card-items">
			{logs.map((log) => {
				if (!log) return; // don't attempt to render an empty log entry
				let time = '';
				let minutes = Math.round((Date.now() - log.timestamp) / 60000);
				if (minutes == 0) {
					time = 'Just now';
				}
				else if (minutes < 60) {
					time = minutes + 'min ago';
				}
				else if (minutes < 3600) {
					time = Math.round(minutes / 60) + 'hr ago';
				}
				else {
					time = Math.round(minutes / 1440) + 'd ago';
				}
				let message = 'User ' + log.username;
				switch (log.type) {
					case 'creation':
						message += ` created card with ID ${log.log_id}.`;
						break;
					case 'edition':
						message += ` edited card with ID ${log.log_id}.`;
						break;
					case 'deletion':
						message += ` deleted card with ID ${log.log_id}.`;
						break;
					case 'full deletion':
						message += ` deleted all their cards.`;
						break;
				}
				return (<li key={logs.findIndex(l => l.timestamp == log.timestamp)} className='card-item log-item'>
				<p className='card-text date'>
					{time}
				</p>
				<p className='card-text log'>
					{message}
				</p>
				<button className='add-button edit-button' onClick={() => peek(log)} disabled={log.type.includes('deletion')}>
					<Eye size={18} />
					Peek
				</button>
				<button className='add-button edit-button' disabled={freeze} onClick={() => {
					setFreeze(true);
					setTarget(log.username);
					updateCards(log.username);
				}}>
					<User size={18} />
					Focus user
				</button>
				</li>)
			})}
		</ul>}
		</div>

		{isModal && ( // handle pop-up display
			<div className={`modal-overlay ${modalFade ? 'fadeIn' : 'fadeOut'}`}>
			{isError ? ( // error message
			<div className="modal">
				<p className="modal-header">FATAL ERROR!</p>
				<p>There has been an issue contacting the SQL server. Ensure MySQL is installed correctly, with the same credentials found in the README file. Please restart server.js and refresh the site.</p>
			</div>
			) : (
			<div className="modal">
				<p className="modal-header">{spotlight.question}</p>
				<p>{spotlight.answer}</p>
				<div className="modal-button-group">
					<p style={{ padding: `0.6rem`, fontSize: `0.9rem`, color: `${spotlight.state == 'Active' ? '#00b777' : (spotlight.state == 'Edited' ? '#009de5' : '#ef4444')}`}}>
						State: {spotlight.state}
					</p>
					<button onClick={closeModal} className="grey-button">
						Close
					</button>
				</div>
			</div>
			)}
			</div>
		)}
		</div>
	);
}