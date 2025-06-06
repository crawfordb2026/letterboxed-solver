import React from 'react';
import './LetterBox.css';

const LetterBox = ({ sides, selectedLetters, onLetterClick, lastSelectedSide }) => {
  const getSidePosition = (sideIndex) => {
    const positions = ['top', 'right', 'bottom', 'left'];
    return positions[sideIndex];
  };

  const isLetterDisabled = (letter, sideIndex) => {
    // Disable if last selected letter was from the same side
    return lastSelectedSide === sideIndex;
  };

  const isLetterSelected = (letter) => {
    return selectedLetters.includes(letter);
  };

  return (
    <div className="letterbox-container">
      <div className="letterbox">
        {sides.map((side, sideIndex) => (
          <div key={sideIndex} className={`side ${getSidePosition(sideIndex)}`}>
            {side.map((letter, letterIndex) => (
              <button
                key={letterIndex}
                className={`letter-button ${
                  isLetterSelected(letter) ? 'selected' : ''
                } ${
                  isLetterDisabled(letter, sideIndex) ? 'disabled' : ''
                }`}
                onClick={() => onLetterClick(letter, sideIndex)}
                disabled={isLetterDisabled(letter, sideIndex)}
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
        <div className="center-area">
          <div className="game-title">LETTERBOXED</div>
        </div>
      </div>
    </div>
  );
};

export default LetterBox; 