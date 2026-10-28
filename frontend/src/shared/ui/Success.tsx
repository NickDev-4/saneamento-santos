import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Success({
  title,
  text,
  to,
  label,
}: {
  title: string;
  text: string;
  to: string;
  label: string;
}) {
  return (
    <div className="success-panel">
      <span className="success-icon">
        <Check size={34} />
      </span>
      <h1>{title}</h1>
      <p>{text}</p>
      <Link className="button button-primary" to={to}>
        {label}
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
