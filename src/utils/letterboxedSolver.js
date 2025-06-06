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
  findSolutions(maxSolutions = 50) {
    const solutions = [];
    const maxDepth = 8; // Don't go crazy with super long solution chains
    const startTime = Date.now();
    const timeLimit = 10000; // Give up after 10 seconds - we're not running a supercomputer here
    
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
        return bNewLetters - aNewLetters;
      });
      
      for (let word of sortedWords) {
        const newUsedLetters = new Set(usedLetters);
        let hasNewLetter = false;
        
        // What new letters does this word give us?
        for (let letter of word) {
          if (!newUsedLetters.has(letter)) {
            hasNewLetter = true;
          }
          newUsedLetters.add(letter);
        }
        
        // Only try words that actually help us progress
        if (hasNewLetter && newUsedLetters.size <= 12) {
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
   * I'll make sure there are enough vowels so it's actually solvable
   */
  static generateRandomPuzzle() {
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
    
    const sides = [[], [], [], []];
    const usedLetters = new Set();
    
    // First, let's put at least one vowel on each side - trust me, you'll need them
    for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
      let vowel;
      do {
        vowel = vowels[Math.floor(Math.random() * vowels.length)];
      } while (usedLetters.has(vowel));
      
      sides[sideIndex].push(vowel);
      usedLetters.add(vowel);
    }
    
    // Now fill in the rest with consonants
    for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
      while (sides[sideIndex].length < 3) {
        let letter;
        do {
          letter = consonants[Math.floor(Math.random() * consonants.length)];
        } while (usedLetters.has(letter));
        
        sides[sideIndex].push(letter);
        usedLetters.add(letter);
      }
    }
    
    // Mix them up a bit so the vowels aren't all in the same spot
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