import { Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${compact ? 'brand-compact' : ''}`}
      aria-label="Saneamento Santos, início"
    >
      <span className="brand-symbol">
        <Droplets size={25} strokeWidth={1.8} />
      </span>
      <span>
        Saneamento
        <strong>
          Santos<span className="brand-dot">.</span>
        </strong>
      </span>
    </Link>
  );
}
