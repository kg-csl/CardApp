import { useState } from 'react';
import { Trash2, Plus, Check } from 'lucide-react';
import './CardApp.css';

export default function CardApp() {
  const [cards, setCards] = useState([]);
  const [activeCard, changeActiveCard] = useState({
    id: 0,
    question: '',
    answer: '',
    hidden: false,
    flipped: false
  });

  const [isModal, setModal] = useState(false);
  const [modalFade, setModalFade] = useState(false);
  const [input, setInput] = useState({
    question: '',
    answer: ''
  });

  let index = 0;

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
      console.log(newCard);
      setCards([...cards, newCard]);
      changeActiveCard({...newCard, flipped: false});
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

  return (
    <div className={`app-container ${isModal ? 'active-modal' : ''}`}>
      <div className="app-wrapper">
        <div className="header">
          <h1 className="header-title">Flashcards 4 U</h1>
          <p className="header-subtitle">Keagan's POTI Project!</p>
        </div>

        <div className="input-section">
          <button onClick={addCard} className="add-button">
            <Plus size={20} />
            Add
          </button>
        </div>

        <div className="card-list">
          {cards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p className="header-subtitle">No flashcards yet. Add one above!</p>
            </div>
          ) : (
            <div onClick={() => changeActiveCard({...activeCard, flipped: !activeCard.flipped})} className='card-style-button'>
              <p className='card-text'>
                {activeCard.flipped ? activeCard.answer : activeCard.question}
              </p>
              <button onClick={() => deleteCard(activeCard.id)} className='delete-button' >
                <Trash2 size={18} />
              </button>
            </div>
          )}
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
              <button onClick={handleCreate} className="create-button add-button">
                Create Card
              </button>
              <button onClick={handleClose} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}