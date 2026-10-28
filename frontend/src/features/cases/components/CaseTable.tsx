import type { Case } from '@/contracts';
import { CaseCard } from '@/features/cases/components/CaseCard';
import { StatusBadge } from '@/features/cases/components/StatusBadge';
import { date } from '@/shared/lib/date';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CaseTable({ cases, staff = false }: { cases: Case[]; staff?: boolean }) {
  const to = (c: Case) => (staff ? `/sabesp/chamados/${c.id}` : `/chamados/${c.id}`);
  return (
    <>
      <div className="desktop-table">
        <table>
          <thead>
            <tr>
              <th>Chamado / problema</th>
              <th>Local</th>
              <th>Status</th>
              {staff && <th>Publicação</th>}
              <th>Registro</th>
              <th>
                <span className="sr-only">Acessar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={to(c)}>
                    <strong>{c.protocolo}</strong>
                    <span>{c.tipo}</span>
                  </Link>
                </td>
                <td>
                  <strong>{c.endereco.logradouro}</strong>
                  <span>{c.endereco.bairro}</span>
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                {staff && (
                  <td>
                    <span className={`publication-label publication-${c.publicacao.toLowerCase()}`}>
                      {c.publicacao === 'APROVADO'
                        ? 'Publicado'
                        : c.publicacao === 'REJEITADO'
                          ? 'Não aprovado'
                          : 'Pendente'}
                    </span>
                  </td>
                )}
                <td>{date(c.criadoEm)}</td>
                <td>
                  <Link className="icon-button" to={to(c)} aria-label={`Abrir ${c.protocolo}`}>
                    <ArrowRight size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-case-list">
        {cases.map((c) => (
          <CaseCard key={c.id} item={c} to={to(c)} />
        ))}
      </div>
    </>
  );
}
