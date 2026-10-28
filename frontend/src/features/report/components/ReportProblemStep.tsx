import { ReportPhotos } from '@/features/report/components/ReportPhotos';
import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { localDate } from '@/shared/lib/localDate';
import { Field } from '@/shared/ui/Field';

type Props = Pick<
  ReportFormController,
  | 'catalogue'
  | 'tipoId'
  | 'setTipoId'
  | 'errors'
  | 'descricao'
  | 'setDescricao'
  | 'observadoEm'
  | 'setObservadoEm'
  | 'addFiles'
  | 'setKept'
  | 'kept'
  | 'setFiles'
  | 'previews'
>;

export function ReportProblemStep({
  catalogue,
  tipoId,
  setTipoId,
  errors,
  descricao,
  setDescricao,
  observadoEm,
  setObservadoEm,
  addFiles,
  setKept,
  kept,
  setFiles,
  previews,
}: Props) {
  return (
    <div className="form-stack">
      <Field label="Tipo de problema" htmlFor="tipo" error={errors.tipoId}>
        <select
          id="tipo"
          value={tipoId}
          onChange={(e) => setTipoId(e.target.value)}
          aria-invalid={Boolean(errors.tipoId)}
        >
          <option value="">Selecione uma opção</option>
          {catalogue.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </Field>
      {catalogue.error && (
        <p className="inline-error" role="alert">
          {catalogue.error}
          <button type="button" className="text-link" onClick={catalogue.retry}>
            Tentar novamente
          </button>
        </p>
      )}
      <Field
        label="Descrição do problema"
        htmlFor="descricao"
        error={errors.descricao}
        hint="Descreva o que acontece e o que ajuda a encontrar o local."
      >
        <textarea
          id="descricao"
          rows={5}
          maxLength={2000}
          placeholder="Ex.: esgoto saindo pela tampa de inspeção, próximo à esquina…"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          aria-invalid={Boolean(errors.descricao)}
        />
      </Field>
      <Field
        label="Quando você observou o problema?"
        htmlFor="observado"
        error={errors.observadoEm}
      >
        <input
          id="observado"
          type="datetime-local"
          value={observadoEm}
          max={localDate()}
          onChange={(e) => setObservadoEm(e.target.value)}
          aria-invalid={Boolean(errors.observadoEm)}
        />
      </Field>
      <ReportPhotos
        addFiles={addFiles}
        errors={errors}
        setKept={setKept}
        kept={kept}
        setFiles={setFiles}
        previews={previews}
      />
    </div>
  );
}
