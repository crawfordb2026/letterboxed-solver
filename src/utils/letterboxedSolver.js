import { WORD_LIST } from './wordlist.js';

/**
 * NYT Letterboxed Solver
 * 
 * Here's how this crazy puzzle works:
 * - You get a box with 4 sides, each side has 3 letters (so 12 total)
 * - Make words using these letters, but here's the catch...
 * - You can't use two letters in a row from the same side (that would be too easy!)
 * - Each new word has to start with whatever letter your last word ended with
 * - Oh, and you can totally reuse letters within the same word if you want
 * - The goal? Use ALL 12 letters. Good luck! 🎯
 */

export class LetterboxedSolver {
  constructor(sides) {
    // sides should be 4 arrays, each with 3 letters - pretty straightforward
    this.sides = sides.map(side => side.map(letter => letter.toUpperCase()));
    this.allLetters = this.sides.flat();
    this.letterToSide = {};
    
    // Let's figure out which letter belongs to which side - we'll need this later
    this.sides.forEach((side, sideIndex) => {
      side.forEach(letter => {
        this.letterToSide[letter] = sideIndex;
      });
    });
    
    // Time to filter our huge word list down to just the words we can actually make
    this.validWords = this.findValidWords();
    console.log(`Sweet! Found ${this.validWords.length} valid words for this puzzle`);
  }

  /**
   * Let's check if we can actually make this word with our letters
   */
  isWordValid(word) {
    word = word.toUpperCase();
    
    // Too short? Nope, we need at least 3 letters
    if (word.length < 3) return false;
    
    // Do we even have all these letters? Let's check...
    for (let letter of word) {
      if (!this.allLetters.includes(letter)) {
        return false;
      }
    }
    
    // Here's the tricky part - no two letters in a row from the same side!
    for (let i = 0; i < word.length - 1; i++) {
      const currentSide = this.letterToSide[word[i]];
      const nextSide = this.letterToSide[word[i + 1]];
      if (currentSide === nextSide) {
        return false; // Busted! Two letters from the same side
      }
    }
    
    return true; // We made it! This word is legit
  }

  /**
   * Time to go through our massive word list and see what we can actually use
   */
  findValidWords() {
    return WORD_LIST.filter(word => this.isWordValid(word));
  }

  /**
   * Give me all the words that start with this letter - we'll need this for chaining
   */
  getWordsStartingWith(letter) {
    return this.validWords.filter(word => word[0] === letter.toUpperCase());
  }

  /**
   * Count up all the unique letters we've used so far
   */
  getUsedLetters(words) {
    const used = new Set();
    words.forEach(word => {
      for (let letter of word) {
        used.add(letter);
      }
    });
    return used;
  }

  /**
   * The moment of truth - did we use all 12 letters?
   */
  isComplete(words) {
    const used = this.getUsedLetters(words);
    return used.size === 12 && this.allLetters.every(letter => used.has(letter));
  }

  /**
   * How good is this solution? Fewer words = better, longer words = better
   */
  calculateScore(words) {
    const wordCount = words.length;
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    const avgLength = totalLength / wordCount;
    
    // Math time! We want solutions that are both efficient AND use long words
    return (avgLength * 100) - (wordCount * 50);
  }

  /**
   * The big kahuna - let's find some actual solutions!
   * This uses backtracking, which is basically "try everything until something works"
   */
  findSolutions(maxSolutions = 20) {
    const solutions = [];
    const maxDepth = 10; // Allow for longer solution chains
    const startTime = Date.now();
    const timeLimit = 15000; // Give it more time - 15 seconds
    
    const backtrack = (currentWords, usedLetters, lastLetter, depth) => {
      // Are we taking too long? Time to bail out
      if (Date.now() - startTime > timeLimit) {
        return;
      }
      
      if (depth > maxDepth) return; // That's deep enough, thanks
      
      // Holy cow, we found a complete solution!
      if (usedLetters.size === 12) {
        solutions.push([...currentWords]);
        console.log(`Boom! Found solution #${solutions.length}: ${currentWords.join(' → ')}`);
        return;
      }
      
      // We've got enough solutions, let's not get greedy
      if (solutions.length >= maxSolutions) return;
      
      // What words can we try next?
      const possibleWords = lastLetter 
        ? this.getWordsStartingWith(lastLetter)
        : this.validWords;
      
      // Let's be smart about this - try words that give us the most new letters first
      const sortedWords = possibleWords.sort((a, b) => {
        const aNewLetters = [...a].filter(letter => !usedLetters.has(letter)).length;
        const bNewLetters = [...b].filter(letter => !usedLetters.has(letter)).length;
        // Prioritize words with more new letters, but also consider word length
        const aScore = aNewLetters * 3 + a.length;
        const bScore = bNewLetters * 3 + b.length;
        return bScore - aScore;
      });
      
      // Try more words, especially if we're early in the search
      const wordsToTry = depth < 3 ? sortedWords.slice(0, 50) : sortedWords.slice(0, 30);
      
      for (let word of wordsToTry) {
        const newUsedLetters = new Set(usedLetters);
        let hasNewLetter = false;
        
        // What new letters does this word give us?
        for (let letter of word) {
          if (!newUsedLetters.has(letter)) {
            hasNewLetter = true;
          }
          newUsedLetters.add(letter);
        }
        
        // Be more flexible - try words even if they don't add new letters sometimes
        const shouldTry = hasNewLetter || (depth === 0) || (usedLetters.size > 8);
        
        if (shouldTry && newUsedLetters.size <= 12) {
          currentWords.push(word);
          backtrack(
            currentWords,
            newUsedLetters,
            word[word.length - 1], // Next word starts with this letter
            depth + 1
          );
          currentWords.pop(); // Undo our choice and try the next word
        }
      }
    };
    
    console.log('Alright, let me think about this puzzle...');
    
    // Here we go! Start the recursive search
    backtrack([], new Set(), null, 0);
    
    console.log(`Done! Found ${solutions.length} ways to solve this thing`);
    
    // Sort them so the best solutions come first
    solutions.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
    
    return solutions;
  }

  /**
   * Give me the top 3 solutions - these should be the best ones
   */
  getTopSolutions() {
    const allSolutions = this.findSolutions();
    const topSolutions = allSolutions.slice(0, 3).map(words => ({
      words,
      score: this.calculateScore(words),
      letterCount: this.getUsedLetters(words).size
    }));
    
    console.log('Here are the best solutions I found:', topSolutions);
    return topSolutions;
  }

  /**
   * Want a new puzzle? Let me whip one up for you!
   * I'll make sure there are enough vowels and common consonants so it's actually solvable
   */
  static generateRandomPuzzle() {
    // First, let's try some known solvable puzzles
    const knownSolvablePuzzles = [
      [['T', 'E', 'R'], ['A', 'S', 'I'], ['N', 'O', 'L'], ['D', 'M', 'G']],
      [['P', 'A', 'R'], ['E', 'D', 'I'], ['N', 'T', 'O'], ['S', 'L', 'M']],
      [['B', 'U', 'S'], ['E', 'A', 'R'], ['N', 'T', 'I'], ['L', 'O', 'D']],
      [['C', 'A', 'T'], ['E', 'R', 'S'], ['N', 'O', 'I'], ['L', 'D', 'M']],
      [['F', 'I', 'R'], ['E', 'A', 'D'], ['N', 'O', 'T'], ['S', 'L', 'M']],
      [['G', 'A', 'M'], ['E', 'R', 'S'], ['T', 'O', 'I'], ['N', 'L', 'D']],
      [['H', 'A', 'R'], ['E', 'S', 'T'], ['I', 'O', 'N'], ['L', 'D', 'M']],
      [['M', 'A', 'R'], ['E', 'S', 'I'], ['T', 'O', 'N'], ['L', 'D', 'G']],
      [['W', 'A', 'R'], ['E', 'S', 'T'], ['I', 'O', 'N'], ['L', 'D', 'M']],
      [['L', 'A', 'R'], ['E', 'S', 'T'], ['I', 'O', 'N'], ['D', 'M', 'G']]
    ];
    
    // 70% chance to use a known solvable puzzle
    if (Math.random() < 0.7) {
      const randomPuzzle = knownSolvablePuzzles[Math.floor(Math.random() * knownSolvablePuzzles.length)];
      return randomPuzzle.map(side => [...side]); // Deep copy
    }
    
    // Otherwise, generate a new one and test it
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      const puzzle = this.generateRandomLetterCombination();
      
      // Quick solvability test - just check if we have enough valid words
      const testSolver = new LetterboxedSolver(puzzle);
      if (testSolver.validWords.length >= 20) {
        // Quick test for potential solutions - try for 2 seconds
        const quickStartTime = Date.now();
        const quickTimeLimit = 2000;
        let foundSolution = false;
        
        const quickBacktrack = (depth, usedLetters, lastLetter) => {
          if (Date.now() - quickStartTime > quickTimeLimit) return false;
          if (depth > 5) return false;
          if (usedLetters.size === 12) {
            foundSolution = true;
            return true;
          }
          
          const possibleWords = lastLetter 
            ? testSolver.getWordsStartingWith(lastLetter)
            : testSolver.validWords;
          
          const sortedWords = possibleWords
            .filter(word => {
              const newLetters = [...word].filter(letter => !usedLetters.has(letter)).length;
              return newLetters > 0;
            })
            .sort((a, b) => {
              const aNew = [...a].filter(letter => !usedLetters.has(letter)).length;
              const bNew = [...b].filter(letter => !usedLetters.has(letter)).length;
              return bNew - aNew;
            })
            .slice(0, 10);
          
          for (let word of sortedWords) {
            const newUsedLetters = new Set(usedLetters);
            for (let letter of word) newUsedLetters.add(letter);
            
            if (quickBacktrack(depth + 1, newUsedLetters, word[word.length - 1])) {
              return true;
            }
          }
          return false;
        };
        
        if (quickBacktrack(0, new Set(), null) || foundSolution) {
          console.log(`Generated new solvable puzzle after ${attempts + 1} attempts`);
          return puzzle;
        }
      }
      
      attempts++;
    }
    
    // If we can't generate a good one, fall back to a known solvable puzzle
    console.log('Falling back to known solvable puzzle');
    const fallback = knownSolvablePuzzles[Math.floor(Math.random() * knownSolvablePuzzles.length)];
    return fallback.map(side => [...side]);
  }
  
  /**
   * Generate a random letter combination (helper method)
   */
  static generateRandomLetterCombination() {
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    // Use more common consonants that appear in many words
    const commonConsonants = ['R', 'T', 'N', 'S', 'L', 'C', 'D', 'P', 'M', 'H', 'G', 'F', 'Y', 'W', 'B', 'V', 'K'];
    const lessCommonConsonants = ['J', 'X', 'Q', 'Z'];
    
    const sides = [[], [], [], []];
    const usedLetters = new Set();
    
    // First, let's put at least one vowel on each side - trust me, you'll need them
    const shuffledVowels = [...vowels].sort(() => Math.random() - 0.5);
    for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
      const vowel = shuffledVowels[sideIndex % vowels.length];
      if (!usedLetters.has(vowel)) {
        sides[sideIndex].push(vowel);
        usedLetters.add(vowel);
      } else {
        // Find an unused vowel
        for (let v of vowels) {
          if (!usedLetters.has(v)) {
            sides[sideIndex].push(v);
            usedLetters.add(v);
            break;
          }
        }
      }
    }
    
    // Add one common consonant to each side
    const shuffledCommon = [...commonConsonants].sort(() => Math.random() - 0.5);
    for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
      for (let consonant of shuffledCommon) {
        if (!usedLetters.has(consonant)) {
          sides[sideIndex].push(consonant);
          usedLetters.add(consonant);
          break;
        }
      }
    }
    
    // Fill remaining spots with a mix of common and less common consonants
    const allConsonants = [...commonConsonants, ...lessCommonConsonants];
    const shuffledAll = allConsonants.sort(() => Math.random() - 0.5);
    
    for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
      while (sides[sideIndex].length < 3) {
        for (let letter of shuffledAll) {
          if (!usedLetters.has(letter)) {
            sides[sideIndex].push(letter);
            usedLetters.add(letter);
            break;
          }
        }
      }
    }
    
    // Mix them up a bit so similar letters aren't always in the same positions
    sides.forEach(side => {
      for (let i = side.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [side[i], side[j]] = [side[j], side[i]];
      }
    });
    
    return sides;
  }

  /**
   * Stuck? Let me give you some ideas for your next word
   */
  getHint(currentWords) {
    const usedLetters = this.getUsedLetters(currentWords);
    const lastLetter = currentWords.length > 0 
      ? currentWords[currentWords.length - 1].slice(-1) 
      : null;
    
    const possibleWords = lastLetter 
      ? this.getWordsStartingWith(lastLetter)
      : this.validWords;
    
    // Look for words that actually help you progress
    const goodWords = possibleWords.filter(word => {
      const newUsedLetters = new Set(usedLetters);
      let hasNewLetter = false;
      
      for (let letter of word) {
        if (!newUsedLetters.has(letter)) {
          hasNewLetter = true;
        }
        newUsedLetters.add(letter);
      }
      
      return hasNewLetter && newUsedLetters.size <= 12;
    });
    
    // Sort by how helpful they are - longer words with more new letters are better
    goodWords.sort((a, b) => {
      const aNewLetters = [...a].filter(letter => !usedLetters.has(letter)).length;
      const bNewLetters = [...b].filter(letter => !usedLetters.has(letter)).length;
      const aScore = aNewLetters * a.length;
      const bScore = bNewLetters * b.length;
      return bScore - aScore;
    });
    
    return goodWords.slice(0, 5); // Here are 5 good options for you
  }
} 