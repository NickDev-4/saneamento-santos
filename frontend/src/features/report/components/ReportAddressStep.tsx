import { ReportLocationPicker } from '@/features/report/components/ReportLocationPicker';
import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { CheckCircle2 } from 'lucide-react';

type Props = Pick<
  ReportFormController,
  | 'endereco'
  | 'setAddress'
  | 'errors'
  | 'looking'
  | 'lookup'
  | 'lookupMessage'
  | 'location'
  | 'setLocation'
>;

export function ReportAddressStep({
  endereco,
  setAddress,
  errors,
  looking,
  lookup,
  lookupMessage,
  location,
  setLocation,
}: Props) {
  return (
    <div className="form-stack">
      <div className="cep-row">
        <Field label="CEP" htmlFor="cep" error={errors.cep}>
          <input
            id="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            placeholder="00000-000"
            value={endereco.cep.replace(/^(\d{5})(\d)/, '$1-$2')}
            onChange={(e) => setAddress('cep', e.target.value.replace(/\D/g, '').slice(0, 8))}
            aria-invalid={Boolean(errors.cep)}
          />
        </Field>
        <Button type="button" variant="secondary" disabled={looking} onClick={lookup}>
          {looking ? 'Buscando…' : 'Buscar CEP'}
        </Button>
      </div>
      {lookupMessage && (
        <p className="inline-success" role="status">
          <CheckCircle2 size={17} />
          {lookupMessage}
        </p>
      )}
      <Field label="Rua ou avenida" htmlFor="logradouro" error={errors.logradouro}>
        <input
          id="logradouro"
          autoComplete="street-address"
          value={endereco.logradouro}
          onChange={(e) => setAddress('logradouro', e.target.value)}
          aria-invalid={Boolean(errors.logradouro)}
        />
      </Field>
      <div className="form-columns">
        <Field label="Número" htmlFor="numero" error={errors.numero}>
          <input
            id="numero"
            value={endereco.numero}
            disabled={endereco.semNumero}
            onChange={(e) => setAddress('numero', e.target.value)}
            aria-invalid={Boolean(errors.numero)}
          />
        </Field>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={endereco.semNumero}
            onChange={(e) => setAddress('semNumero', e.target.checked)}
          />
          Sem número
        </label>
      </div>
      <div className="form-columns">
        <Field label="Bairro" htmlFor="bairro" error={errors.bairro}>
          <input
            id="bairro"
            value={endereco.bairro}
            onChange={(e) => setAddress('bairro', e.target.value)}
            aria-invalid={Boolean(errors.bairro)}
          />
        </Field>
        <Field label="Cidade" htmlFor="cidade">
          <input id="cidade" readOnly value="Santos, SP" />
        </Field>
      </div>
      <Field label="Ponto de referência" htmlFor="referencia" optional>
        <input
          id="referencia"
          placeholder="Ex.: em frente à praça"
          value={endereco.referencia}
          onChange={(e) => setAddress('referencia', e.target.value)}
        />
      </Field>
      <ReportLocationPicker location={location} setLocation={setLocation} errors={errors} />
    </div>
  );
}
