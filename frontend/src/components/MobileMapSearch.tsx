import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Props {
  value: string;
  onChange(value: string): void;
  onFilter(): void;
}

export function MobileMapSearch({ value, onChange, onFilter }: Props) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const expanded = open || Boolean(value);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    if (!expanded && restoreFocus.current) {
      toggle.current?.focus();
      restoreFocus.current = false;
    }
  }, [expanded]);

  function close() {
    restoreFocus.current = true;
    onChange('');
    setOpen(false);
  }

  return <div className="mobile-search">
    {expanded ? <div className="mobile-search-field">
      <Search size={18} aria-hidden="true"/>
      <input ref={input} id="busca-mapa-mobile" aria-label="Buscar rua, bairro ou protocolo"
        placeholder="Buscar local" enterKeyHint="search" value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => { if (event.key === 'Escape') close(); }}/>
      <button type="button" aria-label={value ? 'Limpar busca' : 'Fechar pesquisa'} onClick={close}>
        <X size={17} aria-hidden="true"/>
      </button>
    </div> : <button ref={toggle} type="button" className="icon-button mobile-search-toggle"
      aria-label="Pesquisar ocorrências" aria-expanded={false} onClick={() => setOpen(true)}>
      <Search size={19} aria-hidden="true"/>
    </button>}
    <button type="button" className="icon-button" aria-label="Abrir filtros" onClick={onFilter}>
      <SlidersHorizontal size={18} aria-hidden="true"/>
    </button>
  </div>;
}
