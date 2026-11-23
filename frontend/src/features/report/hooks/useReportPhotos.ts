import { useState } from 'react';

import type { Image } from '@/contracts';

import { useEffect } from 'react';

import type { SetStateAction } from 'react';

import type { Dispatch } from 'react';
import { prepareCaseImage } from '@/shared/lib/prepareCaseImage';

export function useReportPhotos(setErrors: Dispatch<SetStateAction<Record<string, string>>>) {
  const [files, setFiles] = useState<File[]>([]);
  const [kept, setKept] = useState<Image[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  async function addFiles(list: FileList | null) {
    if (!list || processing) return;
    const next = Array.from(list);
    if (files.length + kept.length + next.length > 3) {
      setErrors((e) => ({ ...e, imagens: 'Você pode anexar até três fotos.' }));
      return;
    }
    if (next.some((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))) {
      setErrors((e) => ({ ...e, imagens: 'Escolha fotos JPG, PNG ou WebP.' }));
      return;
    }
    if (next.some((f) => f.size > 20 * 1024 * 1024)) {
      setErrors((e) => ({ ...e, imagens: 'Cada foto pode ter até 20 MB antes da redução.' }));
      return;
    }
    setProcessing(true);
    try {
      const prepared: File[] = [];
      for (const file of next) prepared.push(await prepareCaseImage(file));
      setFiles((f) => [...f, ...prepared]);
      setErrors((e) => ({ ...e, imagens: '' }));
    } catch (error) {
      setErrors((e) => ({
        ...e,
        imagens: error instanceof Error ? error.message : 'Não foi possível preparar as fotos.',
      }));
    } finally {
      setProcessing(false);
    }
  }
  return { files, setFiles, kept, setKept, previews, addFiles, processing };
}
