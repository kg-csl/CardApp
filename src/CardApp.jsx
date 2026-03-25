import { useState, useEffect } from 'react';
import { Trash2, Plus, Shuffle, CircleChevronLeft, CircleChevronRight, MoveUp, MoveDown, SquarePen, RefreshCcw} from 'lucide-react';
import './CardApp.css';

export default function CardApp() {
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState({
    id: 0,
    question: '',
    answer: '',
    flipped: false
  });

  const [textFade, setTextFade] = useState(true);
  const [freeze, setFreeze] = useState(false);

  const [isModal, setModal] = useState(false);
  const [modalFade, setModalFade] = useState(false);
  const [input, setInput] = useState({
    question: '',
    answer: ''
  });
  const [cardEdit, setEdit] = useState({
    id: 0,
    question: '',
    answer: ''
  });

  let defaultSize = 30; /* Let user edit this? */
  let disableMain = false;

  useEffect(() => {
    updateCards();
  }, []);

  const updateCards = () => {
    fetch('http://localhost:3001/api/cards')
    .then(response => response.json())
    .then(data => {
      setCards(data);
    })
    .catch(error => console.error('Error:', error));
  };

  const newEntry = (pos, card) => {
    fetch(`http://localhost:3001/api/cards`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        position: pos,
        id: card.id,
        question: card.question,
        answer: card.answer
      })
    })
    .then(updateCards);
  }

  const addCard = () => {
    setModalFade(true);
    setModal(true);
  };

  const editCard = (card) => {
    setEdit(card);
    setModalFade(true);
    setModal(true);
  };

  const jumpCard = (card) => {
    if (textFade && !freeze && !disableMain && card.id != activeCard.id) {
      setFreeze(true);
      setTextFade(false);
      setTimeout(() => {
        setActiveCard({...card, flipped: false});
        setTimeout(() => {
          const mainText = document.querySelector('.main-text');
          mainText.style.fontSize = defaultSize + 'px';
          mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
          setTextFade(true);
          setTimeout(() => { setFreeze(false) }, 150)
        }, 1);
      }, 150);
    }
  };

  const handleCreate = () => {
    if (input.question != '' && input.answer != '') {
      if (cardEdit.id != 0) {
        const newCard = {
          id: cardEdit.id,
          question: input.question.trim(),
          answer: input.answer.trim(),
        };
        setCards(cards.map((c) => {
          if (c.id == newCard.id) {
            return { 
              ...c, 
              question: newCard.question, 
              answer: newCard.answer
            };
          }
          else return c;
        }));
        activeCard.id == newCard.id && setActiveCard({...newCard, flipped: false});
        setTimeout(() => {
          const mainText = document.querySelector('.main-text');
          mainText.style.fontSize = defaultSize + 'px';
          mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
        }, 1);
        setModalFade(false);
        setTimeout(() => {
          setModal(false);
          setInput({question: '', answer: ''});
          setEdit({
            id: 0,
            question: '',
            answer: ''
          });
        }, 150);
      }
      else {
        const newCard = {
          id: Date.now(),
          question: input.question.trim(),
          answer: input.answer.trim(),
        };
        newEntry(cards.length + 1, newCard);
        setActiveCard({...newCard, flipped: false});
        setTimeout(() => {
          const mainText = document.querySelector('.main-text');
          mainText.style.fontSize = defaultSize + 'px';
          mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
        }, 50);
        setModalFade(false);
        setTimeout(() => {
          setModal(false);
          setInput({question: '', answer: ''});
        }, 150);
      }
    }
  };

  const handleClose = () => {
    setModalFade(false)
    setTimeout(() => {
      setModal(false);
      setInput({question: '', answer: ''});
      setEdit({
        id: 0,
        question: '',
        answer: ''
      });
    }, 150);
  };

  const deleteCard = (i) => {
    if (!freeze) {
      if (i == activeCard.id && cards.length > 1) {
        const index = cards.findIndex(card => card.id == i);
        setActiveCard({...cards[cards.length - 1 == index ? index - 1 : index + 1], flipped: false});
        setCards(cards.filter(card => card.id != i));
        setTimeout(() => {
          const mainText = document.querySelector('.main-text');
          mainText.style.fontSize = defaultSize + 'px';
          mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
        }, 1);
      }
      else if (i == 0) {
        fetch('http://localhost:3001/api/clear')
        .then(updateCards)
        .catch(error => console.error('Error:', error));
      }
    }
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
            if (textFade && !freeze && !disableMain) {
              setFreeze(true);
              setTextFade(false);
              setTimeout(() => {
                setActiveCard({...activeCard, flipped: !activeCard.flipped});
                setTimeout(() => {
                  const mainText = document.querySelector('.main-text');
                  mainText.style.fontSize = defaultSize + 'px';
                  mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
                  setTextFade(true);
                  setTimeout(() => { setFreeze(false) }, 150)
                }, 1);
              }, 150);
            }
          }} className="active-box">
            <button onClick={() => {if (!freeze) {
              setFreeze(true);
              setTextFade(false);
              setTimeout(() => {
                setActiveCard(cards[cards.findIndex(card => card.id == activeCard.id) - 1])
                setTimeout(() => {
                  const mainText = document.querySelector('.main-text');
                  mainText.style.fontSize = defaultSize + 'px';
                  mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
                  setTextFade(true);
                  setTimeout(() => { setFreeze(false) }, 150)
                }, 1);
              }, 150);
            }}}
            onMouseEnter={() => disableMain = true} 
            onMouseLeave={() => disableMain = false}
            className="edit-button" disabled={freeze || cards.findIndex(card => card.id == activeCard.id) == 0}>
              <CircleChevronLeft size={30} />
            </button>
            <p className={`main-text ${textFade ? 'fadeIn' : 'fadeOut'}`}>{activeCard.flipped ? activeCard.answer : activeCard.question}</p>
            <button onClick={() => {if (!freeze) {
              setFreeze(true);
              setTextFade(false);
              setTimeout(() => {
                setActiveCard(cards[cards.findIndex(card => card.id == activeCard.id) + 1])
                setTimeout(() => {
                  const mainText = document.querySelector('.main-text');
                  mainText.style.fontSize = defaultSize + 'px';
                  mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
                  setTextFade(true);
                  setTimeout(() => { setFreeze(false) }, 150)
                }, 1);
              }, 150);
            }}}
            onMouseEnter={() => disableMain = true} 
            onMouseLeave={() => disableMain = false}
            className="edit-button" disabled={freeze || cards.findIndex(card => card.id == activeCard.id) == cards.length - 1}>
              <CircleChevronRight size={30} />
            </button>
          </div>
        )}

        <div className="card-list">
          <div className="input-section">
            <button onClick={addCard} className="grey-button">
              <Shuffle size={20} />
              Shuffle
            </button>
            <button onClick={addCard} className="add-button">
              <Plus size={20} />
              Add
            </button>
            <button onClick={() => deleteCard(0)} className="grey-button">
              <RefreshCcw size={20} />
              Clear All
            </button>
          </div>
          <ul className="card-items">
            {cards.map((card) => (
              <li key={card.id} onClick={() => jumpCard(card)} className='card-item'>
                <button onClick={() => moveCard(card.id, true)} onMouseEnter={() => disableMain = true} onMouseLeave={() => disableMain = false} className='edit-button' >
                  <MoveUp size={18} />
                </button>
                <button onClick={() => moveCard(card.id, false)} onMouseEnter={() => disableMain = true} onMouseLeave={() => disableMain = false} className='edit-button' >
                  <MoveDown size={18} />
                </button>
                <p className='card-text' style={{ fontWeight: `${activeCard.id == card.id ? 600 : 400}`}}>
                  {card.question}
                </p>
                <button onClick={() => {
                  setInput({
                    question: card.question,
                    answer: card.answer
                  });
                  editCard(card);
                }} onMouseEnter={() => disableMain = true} onMouseLeave={() => disableMain = false} className='edit-button' >
                  <SquarePen size={18} />
                </button>
                <button onClick={() => deleteCard(card.id)} onMouseEnter={() => disableMain = true} onMouseLeave={() => disableMain = false} className='delete-button' >
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
            <p className="modal-header">{cardEdit.id != 0 ? 'Edit Card' : 'Add New Card'}</p>
            
            <label>Question:</label>
            <textarea maxLength="999"
              className="modal-field"
              value={input.question}
              onChange={(e) => setInput({...input, question: e.target.value})}
              placeholder="Enter question text..."
              rows={1}
            />

            <label>Answer:</label>
            <textarea maxLength="999"
              className="modal-field"
              value={input.answer}
              onChange={(e) => setInput({...input, answer: e.target.value})}
              placeholder="Enter answer text..."
              rows={4}
            />

            <div className="modal-button-group">
              <button onClick={handleCreate} className="create-button add-button" disabled={input.question == '' || input.answer == ''}>
                {cardEdit.id != 0 ? 'Save Card' : 'Create Card'}
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