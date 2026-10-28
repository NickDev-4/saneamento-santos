import { State } from '@/shared/ui/State';
import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page-container">
      <State
        title="Página não encontrada"
        text="O endereço pode ter mudado. Volte ao mapa para continuar."
      >
        <Link className="button button-primary" to="/">
          Abrir mapa
          <LogIn size={17} />
        </Link>
      </State>
    </div>
  );
}
