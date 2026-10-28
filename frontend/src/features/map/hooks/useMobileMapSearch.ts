import { useEffect, useRef, useState } from 'react';

export function useMobileMapSearch(value: string, onChange: (value: string) => void) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const expanded = open || Boolean(value);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
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
  return { setOpen, input, toggle, expanded, close };
}

export type MobileMapSearchController = ReturnType<typeof useMobileMapSearch>;
