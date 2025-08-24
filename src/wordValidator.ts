import fs from 'fs';
import path from 'path';
import { logger } from './logger';

class WordValidator {
  private validWords: Set<string> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadWordList();
  }

  private loadWordList(): void {
    try {
      const filePath = path.join(process.cwd(), 'validation', 'english.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const words = fileContent
        .split('\n')
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0);

      this.validWords = new Set(words);
      this.isLoaded = true;

      logger.info('Word validation list loaded', {
        wordCount: this.validWords.size
      });
    } catch (error) {
      logger.error('Failed to load word validation list', {
        error: error instanceof Error ? error.message : error
      });
      throw new Error('Failed to initialize word validator');
    }
  }

  public isValidWord(word: string): boolean {
    if (!this.isLoaded) {
      throw new Error('Word validator not properly initialized');
    }

    // Check if it's a single word (no spaces or special characters)
    const trimmedWord = word.trim().toLowerCase();

    if (!trimmedWord) {
      return false;
    }

    // Check for multiple words
    if (trimmedWord.includes(' ')) {
      return false;
    }

    // Check for special characters (allow only letters and basic punctuation)
    if (!/^[a-z'-]+$/.test(trimmedWord)) {
      return false;
    }

    // Check if word is in our validation set
    return this.validWords.has(trimmedWord);
  }

  public getWordCount(): number {
    return this.validWords.size;
  }
}

// Export singleton instance
export const wordValidator = new WordValidator();