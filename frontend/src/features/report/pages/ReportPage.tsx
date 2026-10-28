import { ReportAddressStep } from '@/features/report/components/ReportAddressStep';
import { ReportConfirmation } from '@/features/report/components/ReportConfirmation';
import { ReportHeading } from '@/features/report/components/ReportHeading';
import { ReportNavigation } from '@/features/report/components/ReportNavigation';
import { ReportProblemStep } from '@/features/report/components/ReportProblemStep';
import { ReportReviewStep } from '@/features/report/components/ReportReviewStep';
import { ReportSteps } from '@/features/report/components/ReportSteps';
import { useReportForm } from '@/features/report/hooks/useReportForm';
import { BackLink } from '@/shared/ui/BackLink';
import { State } from '@/shared/ui/State';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ReportPage() {
  const {
    id,
    existing,
    catalogue,
    step,
    setStep,
    endereco,
    location,
    setLocation,
    tipoId,
    setTipoId,
    descricao,
    setDescricao,
    observadoEm,
    setObservadoEm,
    setFiles,
    kept,
    setKept,
    previews,
    errors,
    busy,
    looking,
    lookupMessage,
    created,
    heading,
    setAddress,
    lookup,
    addFiles,
    submit,
    typeName,
  } = useReportForm();
  if (id && (existing.loading || existing.error))
    return (
      <div className="page-container">
        <State loading={existing.loading} error={existing.error} retry={existing.retry} />
      </div>
    );
  if (id && existing.data && !existing.data.acoesPermitidas.includes('editar'))
    return (
      <div className="page-container">
        <State
          title="Este chamado já está em análise"
          text="Os dados do envio foram preservados. Você pode acompanhar o atendimento pelo detalhe."
        >
          <Link className="button button-primary" to={`/chamados/${id}?meu=1`}>
            Acompanhar chamado
          </Link>
        </State>
      </div>
    );
  if (created) return <ReportConfirmation id={id} created={created} />;
  return (
    <div className="page-container report-page">
      <BackLink to={id ? `/chamados/${id}?meu=1` : '/'}>
        {id ? 'Voltar ao chamado' : 'Voltar ao mapa'}
      </BackLink>
      <ReportHeading id={id} />
      <div className="report-layout">
        <ReportSteps step={step} />
        <form className="content-card report-form" onSubmit={submit} noValidate>
          <div className="mobile-steps">
            Etapa {step + 1} de 3<span>{['Local', 'Problema', 'Revisão'][step]}</span>
          </div>
          <h2 tabIndex={-1} ref={heading}>
            {['Onde está o problema?', 'O que você observou?', 'Está tudo certo?'][step]}
          </h2>
          <p className="form-intro">
            {
              [
                'Comece pelo CEP e confirme a posição no mapa.',
                'Essas informações ajudam a equipe a entender o relato.',
                'Confira os dados antes de enviar para análise.',
              ][step]
            }
          </p>
          {step === 0 && (
            <ReportAddressStep
              endereco={endereco}
              setAddress={setAddress}
              errors={errors}
              looking={looking}
              lookup={lookup}
              lookupMessage={lookupMessage}
              location={location}
              setLocation={setLocation}
            />
          )}
          {step === 1 && (
            <ReportProblemStep
              catalogue={catalogue}
              tipoId={tipoId}
              setTipoId={setTipoId}
              errors={errors}
              descricao={descricao}
              setDescricao={setDescricao}
              observadoEm={observadoEm}
              setObservadoEm={setObservadoEm}
              addFiles={addFiles}
              setKept={setKept}
              kept={kept}
              setFiles={setFiles}
              previews={previews}
            />
          )}
          {step === 2 && (
            <ReportReviewStep
              setStep={setStep}
              endereco={endereco}
              location={location}
              typeName={typeName}
              descricao={descricao}
              observadoEm={observadoEm}
              kept={kept}
              previews={previews}
            />
          )}
          {errors.envio && (
            <p className="inline-error" role="alert">
              {errors.envio}
            </p>
          )}
          <ReportNavigation setStep={setStep} step={step} id={id} busy={busy} />
        </form>
      </div>
      <p className="report-footer">
        <ChevronRight size={14} />
        As informações ajudam a equipe a avaliar e planejar o atendimento.
      </p>
    </div>
  );
}
