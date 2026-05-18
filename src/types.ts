export interface Question {
  id: string;
  text: string;
  options: string[];
  answer: string;
  chapter?: string;
}

export interface SearchResult {
  question: Question;
  score: number;
}
