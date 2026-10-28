import { createContext } from 'react';

export interface Feedback {
  notify(message: string, error?: boolean): void;
  runAction(work: () => Promise<unknown>, message: string): Promise<boolean>;
}

export const FeedbackContext = createContext<Feedback | null>(null);
