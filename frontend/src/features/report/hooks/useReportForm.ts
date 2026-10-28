import type { Address } from '@/contracts';

import type { Location } from '@/contracts';

import { useParams } from 'react-router-dom';

import { useSearchParams } from 'react-router-dom';

import { useFeedback } from '@/app/contexts/feedback/useFeedback';

import { useCaseActions } from '@/features/cases/context/useCaseActions';

import { useAddressActions } from '@/features/addresses/context/useAddressActions';

import { useCase } from '@/features/cases/hooks/useCase';

import { useCaseTypes } from '@/features/cases/hooks/useCaseTypes';

import { useState } from 'react';

import { localDate } from '@/shared/lib/localDate';

import { useReportPhotos } from '@/features/report/hooks/useReportPhotos';

import type { Case } from '@/contracts';

import { useRef } from 'react';

import { useEffect } from 'react';

import { isDemo } from '@/config/environment';

import { validateReportDraft } from '@/features/report/lib/validateReportDraft';

import { toApiError } from '@/shared/errors/ApiError';

import type { FormEvent } from 'react';

const blankAddress: Address = {
  cep: '',
  logradouro: '',
  numero: '',
  semNumero: false,
  bairro: '',
  cidade: 'Santos',
  uf: 'SP',
  referencia: '',
};

const initialLocation: Location = { latitude: -23.9652, longitude: -46.3343 };

export function useReportForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { notify } = useFeedback();
  const { save } = useCaseActions();
  const { address, geocode } = useAddressActions();
  const existing = useCase(id, 'mine');
  const catalogue = useCaseTypes();
  const [step, setStep] = useState(0);
  const [endereco, setEndereco] = useState<Address>({ ...blankAddress });
  const [location, setLocation] = useState<Location>({ ...initialLocation });
  const [tipoId, setTipoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [observadoEm, setObservadoEm] = useState(localDate());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { files, setFiles, kept, setKept, previews, addFiles } = useReportPhotos(setErrors);
  const [busy, setBusy] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [created, setCreated] = useState<Case | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const c = existing.data;
    if (c) {
      setEndereco(c.endereco);
      setLocation(c.localizacao);
      setTipoId(c.tipoId);
      setDescricao(c.descricao);
      setObservadoEm(localDate(c.observadoEm));
      setKept(c.imagens);
    }
  }, [existing.data]);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  function setAddress<K extends keyof Address>(key: K, value: Address[K]) {
    setEndereco((a) => ({ ...a, [key]: value }));
  }
  async function lookup() {
    if (endereco.cep.length !== 8) {
      setErrors((e) => ({ ...e, cep: 'Informe os 8 números do CEP.' }));
      return;
    }
    setLooking(true);
    setLookupMessage('');
    try {
      const result = await address(endereco.cep);
      if (result.cidade && result.cidade !== 'Santos')
        throw new Error('O atendimento deste projeto é para Santos. Confira o CEP.');
      const next = { ...endereco, ...result };
      setEndereco(next);
      setErrors({});
      try {
        setLocation(await geocode(next));
        setLookupMessage(
          isDemo
            ? 'Endereço de exemplo preenchido. Confira e ajuste o ponto.'
            : 'Endereço encontrado. Confira e ajuste o ponto.',
        );
      } catch {
        setLookupMessage('Endereço preenchido. Indique o ponto no mapa para continuar.');
      }
    } catch (e) {
      setErrors((er) => ({ ...er, cep: (e as Error).message }));
    } finally {
      setLooking(false);
    }
  }

  function validate() {
    const errors = validateReportDraft({
      step,
      endereco,
      location,
      tipoId,
      descricao,
      observadoEm,
      imageCount: files.length + kept.length,
    });
    setErrors(errors);
    return !Object.keys(errors).length;
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    if (step < 2) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const c = await save(
        {
          endereco,
          localizacao: location,
          tipoId,
          descricao: descricao.trim(),
          observadoEm: new Date(observadoEm).toISOString(),
          imagens: files,
          imagensMantidas: kept,
          reincidenciaDe: params.get('reincidencia'),
        },
        id,
      );
      setCreated(c);
      notify(id ? 'Alterações salvas.' : 'Registro enviado para análise.');
    } catch (e) {
      const failure = toApiError(e);
      setErrors({ ...failure.fields, envio: failure.message });
    } finally {
      setBusy(false);
    }
  }
  const typeName = catalogue.data?.find((t) => t.id === tipoId)?.nome;
  return {
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
  };
}

export type ReportFormController = ReturnType<typeof useReportForm>;
