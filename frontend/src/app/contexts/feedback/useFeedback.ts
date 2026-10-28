import { FeedbackContext } from './FeedbackContext';
import { useContext } from 'react';

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('FeedbackProvider ausente');
  return context;
}
