import { useState, useEffect } from 'react';
import { Trash2, Plus, Shuffle, CircleChevronLeft, CircleChevronRight, MoveUp, MoveDown, SquarePen, RefreshCcw} from 'lucide-react';
import './CardApp.css';

export default function CardApp() {
  const [cards, setCards] = useState([]);
  const [order, setOrder] = useState([]);
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
  const [cardEdit, setEdit] = useState(0);

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
      if (data.length == 0) {
        setTimeout(() => {
          document.querySelector('.header-subtitle').style.fontSize = defaultSize + 'px';
        }, 50);
      }
      return fetch('http://localhost:3001/api/list');
    })
    .then(res => res.json())
    .then(ord => setOrder(ord))
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

  const editEntry = (card) => {
    fetch(`http://localhost:3001/api/cards`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        id: card.id,
        question: card.question,
        answer: card.answer
      })
    })
    .then(updateCards);
  }

  const deleteEntry = (i, p) => {
    fetch(`http://localhost:3001/api/cards`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        id: i,
        positionOld: p
      })
    })
    .then(updateCards);
  }

  const moveEntry = (i, p, q) => {
    fetch(`http://localhost:3001/api/list`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        position: p,
        positionOld: q,
        id: i
      })
    })
    .then(updateCards);
  }

  const addCard = () => {
    setModalFade(true);
    setModal(true);
  };

  const editCard = (card) => {
    setEdit(card.id);
    setModalFade(true);
    setModal(true);
  };

  const nextCard = (forward) => {
    if (!freeze) {
      setFreeze(true);
      setTextFade(false);
      setTimeout(() => {
        let pos = order.find(ord => ord.id == activeCard.id).position;
        pos = forward ? pos + 1 : pos - 1;
        setActiveCard({...cards.find(card => card.id == order.find(item => item.position == pos).id), flipped: false});
        setTimeout(() => {
          const mainText = document.querySelector('.main-text');
          mainText.style.fontSize = defaultSize + 'px';
          mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
          setTextFade(true);
          setTimeout(() => { setFreeze(false) }, 150)
        }, 1);
      }, 150);
    }
  }

  const checkPos = (pos) => {
    const currentOrder = order.find(item => item.id == activeCard.id)
    if (currentOrder) return currentOrder.position == pos;
    else return true;
  }

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
      if (cardEdit != 0) {
        const newCard = {
          id: cardEdit,
          question: input.question.trim(),
          answer: input.answer.trim(),
        };
        editEntry(newCard);
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
          setEdit(0);
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
      setEdit(0);
    }, 150);
  };

  const deleteCard = (i) => {
    if (!freeze) {
      if (i == 0) {
        fetch('http://localhost:3001/api/clear')
        .then(updateCards)
        .catch(error => console.error('Error:', error));
      }
      else {
        if ((i == activeCard.id && cards.length > 1)) {
          const index = cards.findIndex(card => card.id == i);
          setActiveCard({...cards[cards.length - 1 == index ? index - 1 : index + 1], flipped: false});
        }
        deleteEntry(i, order.find(item => item.id == i).position);
        setTimeout(() => {
          const mainText = document.querySelector('.main-text');
          mainText.style.fontSize = defaultSize + 'px';
          mainText.clientHeight >= document.querySelector('.active-box').clientHeight && shrinkText();
        }, 1);
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
          <h1 className="header-title">Flashcard Express</h1>
        </div>

        {order.length == 0 || activeCard.id == 0 ? (
          <div className="empty-box">
            <div className="empty-icon">📝</div>
            <p className="header-subtitle">{order.length == 0 ? 'No flashcards yet. Add one below!' : 'Nothing selected. Choose one below!'}</p>
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
            <button onClick={() => nextCard(false)}
            onMouseEnter={() => disableMain = true} 
            onMouseLeave={() => disableMain = false}
            className="edit-button" disabled={freeze || checkPos(1)}>
              <CircleChevronLeft size={30} />
            </button>
            <p className={`main-text ${textFade ? 'fadeIn' : 'fadeOut'}`}>{activeCard.flipped ? activeCard.answer : activeCard.question}</p>
            <button onClick={() => nextCard(true)}
            onMouseEnter={() => disableMain = true} 
            onMouseLeave={() => disableMain = false}
            className="edit-button" disabled={freeze || checkPos(order.length)}>
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
          {order.length != 0 && <ul className="card-items">
              {order.map((o) => {
                const card = cards.find(c => c.id == o.id);
                if (!card) return;
                return (<li key={o.position} onClick={() => jumpCard(card)} className='card-item'>
                  <button onClick={() => moveEntry(o.id, o.position - 1, o.position)} onMouseEnter={() => disableMain = true} onMouseLeave={() => disableMain = false} className='edit-button' disabled={o.position == 1}>
                    <MoveUp size={18} />
                  </button>
                  <button onClick={() => moveEntry(o.id, o.position + 1, o.position)} onMouseEnter={() => disableMain = true} onMouseLeave={() => disableMain = false} className='edit-button' disabled={o.id == order[order.length - 1].id}>
                    <MoveDown size={18} />
                  </button>
                  <p className='card-text' style={{ fontWeight: `${activeCard.id == o.id ? 600 : 400}`}}>
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
                  <button onClick={() => deleteCard(o.id)} onMouseEnter={() => disableMain = true} onMouseLeave={() => disableMain = false} className='delete-button' >
                    <Trash2 size={18} />
                  </button>
                </li>)
              })}
            </ul>}
        </div>
      </div>

      {isModal && (
        <div className={`modal-overlay ${modalFade ? 'fadeIn' : 'fadeOut'}`}>
          <div className="modal">
            <p className="modal-header">{cardEdit != 0 ? 'Edit Card' : 'Add New Card'}</p>
            
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
                {cardEdit != 0 ? 'Save Card' : 'Create Card'}
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