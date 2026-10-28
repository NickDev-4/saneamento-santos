import type { MapController } from '@/features/map/hooks/useMapPage';

import { Field } from '@/shared/ui/Field';

import { statusLabels } from '@/contracts';

import { publicStatuses } from '@/features/cases/constants/publicStatuses';

import { Button } from '@/shared/ui/Button';

import { Dialog } from '@/shared/ui/Dialog';

type Props = Pick<
  MapController,
  'data' | 'bairro' | 'update' | 'status' | 'setParams' | 'setFiltersOpen'
>;

export function MapFiltersDialog({
  data,
  bairro,
  update,
  status,
  setParams,
  setFiltersOpen,
}: Props) {
  return (
    <Dialog title="Filtrar chamados" onClose={() => setFiltersOpen(false)}>
      <div className="form-stack">
        <Field label="Bairro" htmlFor="f-bairro">
          <select id="f-bairro" value={bairro} onChange={(e) => update('bairro', e.target.value)}>
            <option value="">Todos os bairros</option>
            {[...new Set((data || []).map((c) => c.endereco.bairro))].sort().map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field label="Status do atendimento" htmlFor="f-status">
          <select id="f-status" value={status} onChange={(e) => update('status', e.target.value)}>
            <option value="">Todos os status</option>
            {publicStatuses.map((s) => (
              <option value={s} key={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </Field>
        <div className="dialog-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setParams({});
              setFiltersOpen(false);
            }}
          >
            Limpar
          </Button>
          <Button onClick={() => setFiltersOpen(false)}>Ver resultados</Button>
        </div>
      </div>
    </Dialog>
  );
}
