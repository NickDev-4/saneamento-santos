import { NoticesContext } from './NoticesContext';
import { useContext } from 'react';

export function useNoticeActions() {
  const context = useContext(NoticesContext);
  if (!context) throw new Error('NoticesProvider ausente');
  return context;
}
