import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Question } from '../types';
import localQuestionBank from '../data/question_bank.json';

export function useQuestionBank() {
  const [questions] = useState<Question[]>(localQuestionBank as Question[]);

  const fuse = useMemo(() => {
    return new Fuse(questions, {
      keys: [
        { name: 'text', weight: 0.7 },
        { name: 'options', weight: 0.3 }
      ],
      threshold: 0.4, // Slightly looser for better robustness against OCR errors
      includeScore: true,
      minMatchCharLength: 3,
    });
  }, [questions]);

  const search = (query: string) => {
    if (!query) return [];
    return fuse.search(query).slice(0, 10);
  };

  return { questions, search };
}

