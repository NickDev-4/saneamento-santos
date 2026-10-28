import { useBottomSheet } from '@/features/map/hooks/useBottomSheet';
import type { ReactNode } from 'react';

interface Props {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children: ReactNode;
}

export function BottomSheet({ expanded, onExpandedChange, children }: Props) {
  const { sheet, gesture, height, clearGesture, start, move, finish, click } = useBottomSheet(
    expanded,
    onExpandedChange,
  );
  return (
    <aside
      ref={sheet}
      className={`map-sheet ${height !== null ? 'is-dragging' : ''}`}
      aria-label="Lista e detalhes dos chamados"
      style={height === null ? undefined : { height }}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={clearGesture}
      onLostPointerCapture={() => {
        if (gesture.current) clearGesture();
      }}
    >
      <button
        type="button"
        className="sheet-handle"
        data-sheet-drag-area
        aria-label={expanded ? 'Recolher lista' : 'Expandir lista'}
        aria-expanded={expanded}
        aria-controls="conteudo-painel-chamados"
        onClick={click}
        onKeyDown={(event) => {
          if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            onExpandedChange(event.key === 'ArrowUp' || event.key === 'End');
          }
        }}
      >
        <span />
      </button>
      <div id="conteudo-painel-chamados" className="sheet-content">
        {children}
      </div>
    </aside>
  );
}
