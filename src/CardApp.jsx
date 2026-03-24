import { useState } from 'react';
import { Trash2, Plus, Check, Shuffle, CircleCheckBig, CircleChevronLeft, CircleChevronRight } from 'lucide-react';
import './CardApp.css';

export default function CardApp() {
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState({
    id: 0,
    question: '',
    answer: '',
    hidden: false,
    flipped: false
  });
  const [textFade, setTextFade] = useState(true);

  const [isModal, setModal] = useState(false);
  const [modalFade, setModalFade] = useState(false);
  const [input, setInput] = useState({
    question: '',
    answer: ''
  });

  let defaultSize = 30; /* Let user edit this? */

  const addCard = () => {
    setModalFade(true);
    setModal(true);
  };

  const handleCreate = () => {
    if (input.question != '' && input.answer != '') {
      const newCard = {
        id: Date.now(),
        question: input.question.trim(),
        answer: input.answer.trim(),
        hidden: false,
      };
      setCards([...cards, newCard]);
      setActiveCard({...newCard, flipped: false});
      setModalFade(false);
      setInput({question: '', answer: ''});
      setTimeout(() => {
        setModal(false);
      }, 150);
    }
  };

  const handleClose = () => {
    setModalFade(false)
    setInput({question: '', answer: ''})
    setTimeout(() => {
      setModal(false);
    }, 150);
  };

  const toggleCard = (id) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, hidden: !card.hidden } : card
    ));
  };

  const deleteCard = (id) => {
    setCards(cards.filter(card => card.id != id));
  };

  function shrinkText() {
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
          <h1 className="header-title">Flashcards 4 U</h1>
          <p className="header-subtitle">Keagan's POTI Project!</p>
        </div>

        {cards == 0 ? (
          <div className="empty-box">
            <div className="empty-icon">📝</div>
            <p className="header-subtitle">No flashcards yet. Add one below!</p>
          </div>
        ) : (
          <div onClick={() => {
            if (textFade) {
              setTextFade(false);
              setTimeout(() => {
                setActiveCard({...activeCard, flipped: !activeCard.flipped});
                setTimeout(() => {
                  const mainText = document.querySelector('.main-text');
                  mainText.style.fontSize = defaultSize + 'px';
                  mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
                  setTextFade(true);
                }, 1);
              }, 150);
            }
          }} className="active-box">
            <button onClick={() => {setActiveCard(cards[cards.findIndex(card => card.id == activeCard.id) - 1])}} className="edit-button" disabled={cards.findIndex(card => card.id == activeCard.id) == 0}>
              <CircleChevronLeft size={30} />
            </button>
            <p className={`main-text ${textFade ? 'fadeIn' : 'fadeOut'}`}>{activeCard.flipped ? activeCard.answer : activeCard.question}</p>
            <button onClick={() => {setActiveCard(cards[cards.findIndex(card => card.id == activeCard.id) + 1])}} className="edit-button" disabled={cards.findIndex(card => card.id == activeCard.id) == cards.length - 1}>
              <CircleChevronRight size={30} />
            </button>
          </div>
        )}

        <div className="card-list">
          <div className="input-section">
            <button onClick={addCard} className="grey-button">
              <CircleCheckBig size={20} />
              Toggle
            </button>
            <button onClick={addCard} className="add-button">
              <Plus size={20} />
              Add
            </button>
            <button onClick={addCard} className="grey-button">
              <Shuffle size={20} />
              Shuffle
            </button>
          </div>
          <ul className="card-items">
            {cards.map((card) => (
              <li key={card.id} className={`card-item ${card.hidden && 'card-completed'}`}>
                <button onClick={() => toggleCard(card.id)} className={`checkbox ${card.hidden ? '' : 'checkbox-completed'}`} >
                  {!card.hidden && <Check size={16} className="check-icon" />}
                </button>
                <p className='card-text'>
                  {card.flipped ? card.answer : card.question}
                </p>
                <button onClick={() => deleteCard(card.id)} className='delete-button' >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isModal && (
        <div className={`modal-overlay ${modalFade ? 'fadeIn' : 'fadeOut'}`}>
          <div className="modal">
            <p className="modal-header">Add New Card</p>
            
            <label>Question:</label>
            <textarea
              className="modal-field"
              value={input.question}
              onChange={(e) => setInput({...input, question: e.target.value})}
              placeholder="Enter question text..."
              rows={1}
            />

            <label>Answer:</label>
            <textarea 
              className="modal-field"
              value={input.answer}
              onChange={(e) => setInput({...input, answer: e.target.value})}
              placeholder="Enter answer text..."
              rows={4}
            />

            <div className="modal-button-group">
              <button onClick={handleCreate} className="create-button add-button" disabled={input.question == '' || input.answer == ''}>
                Create Card
              </button>
              <button onClick={handleClose} className="grey-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}