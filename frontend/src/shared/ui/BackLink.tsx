import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function BackLink({ to = '/', children = 'Voltar' }: { to?: string; children?: ReactNode }) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={17} />
      {children}
    </Link>
  );
}
