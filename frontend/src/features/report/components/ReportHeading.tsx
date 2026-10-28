import type { ReportFormController } from '@/features/report/hooks/useReportForm';

type Props = Pick<ReportFormController, 'id'>;

export function ReportHeading({ id }: Props) {
  return (
    <div className="report-heading">
      <span className="eyebrow">UM RELATO PODE FAZER A DIFERENÇA</span>
      <h1>{id ? 'Editar chamado' : 'Registrar um problema'}</h1>
      <p>Conte o que está acontecendo. A equipe cuida dos próximos passos.</p>
    </div>
  );
}
