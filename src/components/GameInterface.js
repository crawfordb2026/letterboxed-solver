import React, { useState, useEffect } from 'react';
import LetterBox from './LetterBox';
import { LetterboxedSolver } from '../utils/letterboxedSolver';
import './GameInterface.css';

const GameInterface = () => {
  const [sides, setSides] = useState([
    ['T', 'E', 'R'],
    ['A', 'S', 'I'], 
    ['N', 'O', 'L'],
    ['D', 'M', 'G']
  ]);
  
  const [solver, setSolver] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [lastSelectedSide, setLastSelectedSide] = useState(null);
  const [submittedWords, setSubmittedWords] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [showSolutions, setShowSolutions] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [hints, setHints] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSides, setCustomSides] = useState([
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]);

  // Initialize solver when sides change
  useEffect(() => {
    const newSolver = new LetterboxedSolver(sides);
    setSolver(newSolver);
    setSubmittedWords([]);
    setGameComplete(false);
    setSolutions([]);
    setShowSolutions(false);
  }, [sides]);

  // Check if game is complete when words change
  useEffect(() => {
    if (solver && submittedWords.length > 0) {
      const isComplete = solver.isComplete(submittedWords);
      setGameComplete(isComplete);
    }
  }, [submittedWords, solver]);

  const handleLetterClick = (letter, sideIndex) => {
    if (lastSelectedSide === sideIndex) return;
    
    // Check if this is the first letter and we need to start with a specific letter
    const requiredLetter = getNextRequiredLetter();
    if (currentWord.length === 0 && requiredLetter && letter !== requiredLetter) {
      alert(`You must start your next word with "${requiredLetter}"`);
      return;
    }
    
    setCurrentWord(prev => prev + letter);
    setSelectedLetters(prev => [...prev, letter]);
    setLastSelectedSide(sideIndex);
  };

  const handleSubmitWord = () => {
    if (!currentWord || !solver) return;

    const word = currentWord.toUpperCase();
    
    // Check minimum length
    if (word.length < 3) {
      alert('Words must be at least 3 letters long!');
      return;
    }
    
    // Check if word is valid
    if (!solver.isWordValid(word)) {
      alert('Invalid word! Make sure you\'re following the rules - no consecutive letters from the same side.');
      return;
    }

    // Check if it's a real word
    if (!solver.validWords.includes(word)) {
      alert('Word not found in dictionary!');
      return;
    }

    // Check chaining rule
    if (submittedWords.length > 0) {
      const lastWord = submittedWords[submittedWords.length - 1];
      const lastLetter = lastWord[lastWord.length - 1];
      if (word[0] !== lastLetter) {
        alert(`Next word must start with "${lastLetter}"`);
        return;
      }
    }

    // Check if word was already used
    if (submittedWords.includes(word)) {
      alert('You already used this word!');
      return;
    }

    setSubmittedWords(prev => [...prev, word]);
    setCurrentWord('');
    setSelectedLetters([]);
    setLastSelectedSide(null);
  };

  const handleBackspace = () => {
    if (currentWord.length > 0) {
      setCurrentWord(prev => prev.slice(0, -1));
      setSelectedLetters(prev => prev.slice(0, -1));
      
      if (selectedLetters.length > 1) {
        const prevLetter = selectedLetters[selectedLetters.length - 2];
        const prevSide = solver.letterToSide[prevLetter];
        setLastSelectedSide(prevSide);
      } else {
        setLastSelectedSide(null);
      }
    }
  };

  const handleClearWord = () => {
    setCurrentWord('');
    setSelectedLetters([]);
    setLastSelectedSide(null);
  };

  const handleNewPuzzle = () => {
    const newSides = LetterboxedSolver.generateRandomPuzzle();
    setSides(newSides);
  };

  const handleCustomLetterChange = (sideIndex, letterIndex, value) => {
    const newCustomSides = [...customSides];
    newCustomSides[sideIndex][letterIndex] = value.toUpperCase().slice(0, 1);
    setCustomSides(newCustomSides);
  };

  const handleApplyCustomPuzzle = () => {
    // Validate the custom puzzle
    const allLetters = customSides.flat().filter(letter => letter.trim() !== '');
    
    if (allLetters.length !== 12) {
      alert('Please enter exactly 12 letters (3 letters per side)');
      return;
    }
    
    const uniqueLetters = new Set(allLetters);
    if (uniqueLetters.size !== 12) {
      alert('All 12 letters must be unique');
      return;
    }
    
    // Check that each side has 3 letters
    for (let i = 0; i < 4; i++) {
      const sideLetters = customSides[i].filter(letter => letter.trim() !== '');
      if (sideLetters.length !== 3) {
        alert(`Side ${i + 1} must have exactly 3 letters`);
        return;
      }
    }
    
    // Apply the custom puzzle
    const validatedSides = customSides.map(side => 
      side.map(letter => letter.toUpperCase())
    );
    setSides(validatedSides);
    setShowCustomInput(false);
  };

  const handleClearCustomPuzzle = () => {
    setCustomSides([
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]);
  };

  const handleSolve = async () => {
    if (!solver) return;
    
    setIsLoading(true);
    try {
      // Use setTimeout to not block UI
      setTimeout(() => {
        const topSolutions = solver.getTopSolutions();
        setSolutions(topSolutions);
        setShowSolutions(true);
        setIsLoading(false);
      }, 100);
    } catch (error) {
      console.error('Error solving:', error);
      setIsLoading(false);
    }
  };

  const handleGetHint = () => {
    if (!solver) return;
    
    const newHints = solver.getHint(submittedWords);
    setHints(newHints);
    setShowHints(true);
  };

  const getUsedLetters = () => {
    if (!solver) return new Set();
    return solver.getUsedLetters(submittedWords);
  };

  const getNextRequiredLetter = () => {
    if (submittedWords.length === 0) return null;
    const lastWord = submittedWords[submittedWords.length - 1];
    return lastWord[lastWord.length - 1];
  };

  const usedLetters = getUsedLetters();
  const nextRequiredLetter = getNextRequiredLetter();

  return (
    <div className="game-interface">
      <div className="game-header">
        <h1>Letterboxed Solver & Game</h1>
        <div className="game-controls">
          <button onClick={handleNewPuzzle} className="control-button">
            New Puzzle
          </button>
          <button onClick={() => setShowCustomInput(true)} className="control-button custom-button">
            Custom Puzzle
          </button>
          <button 
            onClick={handleSolve} 
            className="control-button solve-button"
            disabled={isLoading}
          >
            {isLoading ? 'Solving...' : 'Solve'}
          </button>
          <button onClick={handleGetHint} className="control-button hint-button">
            Get Hint
          </button>
        </div>
      </div>

      <div className="game-content">
        <div className="game-left">
          <LetterBox 
            sides={sides}
            selectedLetters={selectedLetters}
            onLetterClick={handleLetterClick}
            lastSelectedSide={lastSelectedSide}
          />
          
          <div className="word-input-section">
            <div className="current-word">
              {currentWord || (nextRequiredLetter ? `Start with: ${nextRequiredLetter}` : 'Start typing...')}
            </div>
            <div className="word-controls">
              <button onClick={handleBackspace} disabled={!currentWord}>
                ⌫ Backspace
              </button>
              <button onClick={handleClearWord} disabled={!currentWord}>
                Clear
              </button>
              <button 
                onClick={handleSubmitWord} 
                disabled={!currentWord || currentWord.length < 3}
                className="submit-button"
              >
                Submit Word
              </button>
            </div>
          </div>
        </div>

        <div className="game-right">
          <div className="game-status">
            <h3>Progress</h3>
            <div className="letter-progress">
              <div>Letters used: {usedLetters.size}/12</div>
              <div className="letters-grid">
                {sides.flat().map((letter, index) => (
                  <span 
                    key={index} 
                    className={`letter-status ${usedLetters.has(letter) ? 'used' : 'unused'}`}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
            {gameComplete && (
              <div className="completion-message">
                🎉 Congratulations! You've used all 12 letters!
              </div>
            )}
          </div>

          <div className="submitted-words">
            <h3>Your Words ({submittedWords.length})</h3>
            <div className="words-list">
              {submittedWords.map((word, index) => (
                <div key={index} className="submitted-word">
                  {word} <span className="word-length">({word.length})</span>
                </div>
              ))}
            </div>
          </div>

          {showHints && hints.length > 0 && (
            <div className="hints-section">
              <h3>Hints</h3>
              <div className="hints-list">
                {hints.map((hint, index) => (
                  <div key={index} className="hint-word">
                    {hint}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowHints(false)} className="close-button">
                Close
              </button>
            </div>
          )}

          {showSolutions && (
            <div className="solutions-section">
              <h3>Top 3 Solutions</h3>
              {solutions.length === 0 ? (
                <div className="no-solutions">
                  <p>No complete solutions found! This puzzle might be very challenging.</p>
                  <p>Try using the hints to find words that use more letters.</p>
                </div>
              ) : (
                solutions.map((solution, index) => (
                  <div key={index} className="solution">
                    <div className="solution-header">
                      Solution #{index + 1} ({solution.words.length} words) - Score: {Math.round(solution.score)}
                    </div>
                    <div className="solution-words">
                      {solution.words.map((word, wordIndex) => (
                        <span key={wordIndex} className="solution-word">
                          {word}
                          {wordIndex < solution.words.length - 1 && <span className="arrow"> → </span>}
                        </span>
                      ))}
                    </div>
                    <div className="solution-stats">
                      Uses {solution.letterCount}/12 letters | Total letters: {solution.words.join('').length}
                    </div>
                  </div>
                ))
              )}
              <button onClick={() => setShowSolutions(false)} className="close-button">
                Close Solutions
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showCustomInput && (
        <div className="modal-overlay">
          <div className="custom-input-modal">
            <h3>Create Custom Puzzle</h3>
            <p>Enter 3 letters for each side of the box (12 unique letters total)</p>
            
            <div className="custom-sides-container">
              {['Top', 'Right', 'Bottom', 'Left'].map((sideName, sideIndex) => (
                <div key={sideIndex} className="custom-side">
                  <label>{sideName} Side:</label>
                  <div className="custom-letters">
                    {[0, 1, 2].map((letterIndex) => (
                      <input
                        key={letterIndex}
                        type="text"
                        maxLength="1"
                        value={customSides[sideIndex][letterIndex]}
                        onChange={(e) => handleCustomLetterChange(sideIndex, letterIndex, e.target.value)}
                        className="letter-input"
                        placeholder="?"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="custom-input-controls">
              <button onClick={handleApplyCustomPuzzle} className="control-button apply-button">
                Apply Puzzle
              </button>
              <button onClick={handleClearCustomPuzzle} className="control-button clear-button">
                Clear All
              </button>
              <button onClick={() => setShowCustomInput(false)} className="control-button cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInterface; 