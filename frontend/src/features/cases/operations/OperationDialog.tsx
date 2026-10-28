import type { Case } from '@/contracts';
import { activeStatuses } from '@/contracts';
import { address } from '@/features/cases/lib/address';
import type { CaseOperationsController } from '@/features/cases/operations/useCaseOperations';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Field } from '@/shared/ui/Field';

type Props = Pick<
  CaseOperationsController,
  'action' | 'others' | 'formError' | 'setAction' | 'busy' | 'submit' | 'actionTitle'
> & { c: Case };

export function OperationDialog({
  action,
  c,
  others,
  formError,
  setAction,
  busy,
  submit,
  actionTitle,
}: Props) {
  if (!action) return null;

  return (
    <Dialog title={actionTitle[action]} onClose={() => setAction(null)}>
      <form className="form-stack" onSubmit={submit}>
        {action === 'agendar' ? (
          <>
            <p>Informe a data e o intervalo em que a equipe fará a visita.</p>
            <Field label="Início da janela" htmlFor="inicio">
              <input id="inicio" name="inicio" type="datetime-local" required />
            </Field>
            <Field label="Fim da janela" htmlFor="fim">
              <input id="fim" name="fim" type="datetime-local" required />
            </Field>
          </>
        ) : (
          <>
            {action === 'vincular' && (
              <>
                <p>O registro será preservado e o cidadão acompanhará o atendimento principal.</p>
                <Field label="Atendimento principal" htmlFor="principal">
                  <select id="principal" name="principal" required>
                    <option value="">Selecione o atendimento</option>
                    {others.data
                      ?.filter(
                        (o) =>
                          o.id !== c.id &&
                          activeStatuses.includes(o.status) &&
                          o.status !== 'RECEBIDO',
                      )
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.protocolo} · {address(o)}
                        </option>
                      ))}
                  </select>
                </Field>
              </>
            )}
            <Field
              label={action === 'resolver' ? 'Solução realizada' : 'Justificativa'}
              htmlFor="acao-texto"
            >
              <textarea
                id="acao-texto"
                name="texto"
                rows={4}
                required
                placeholder={
                  action === 'resolver'
                    ? 'Descreva a solução para o cidadão…'
                    : 'Explique o motivo desta ação…'
                }
              />
            </Field>
            {action === 'resolver' && (
              <Field label="Foto da resolução" htmlFor="foto-resolucao" optional>
                <input
                  id="foto-resolucao"
                  type="file"
                  name="foto"
                  accept="image/jpeg,image/png,image/webp"
                />
              </Field>
            )}
          </>
        )}
        {formError && (
          <p className="inline-error" role="alert">
            {formError}
          </p>
        )}
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={() => setAction(null)}>
            Cancelar
          </Button>
          <Button disabled={busy}>{busy ? 'Salvando…' : 'Confirmar'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
