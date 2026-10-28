import { Button } from '@/shared/ui/Button';
import { CircleAlert, Droplets, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function State({
  loading,
  error,
  retry,
  title = 'Nenhum chamado por aqui',
  text,
  children,
}: {
  loading?: boolean;
  error?: string;
  retry?: () => void;
  title?: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {loading ? (
        <LoaderCircle className="spin" size={28} />
      ) : error ? (
        <CircleAlert size={30} />
      ) : (
        <Droplets size={34} />
      )}
      <h2>{loading ? 'Carregando…' : error ? 'Não foi possível carregar' : title}</h2>
      <p>
        {error ||
          text ||
          (loading
            ? 'Buscando as informações para você.'
            : 'Experimente outros filtros ou registre um problema.')}
      </p>
      {error && retry && (
        <Button variant="secondary" onClick={retry}>
          Tentar novamente
        </Button>
      )}
      {children}
    </div>
  );
}
