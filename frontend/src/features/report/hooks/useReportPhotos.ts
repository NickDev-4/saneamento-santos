import { useState } from 'react';

import type { Image } from '@/contracts';

import { useEffect } from 'react';

import type { SetStateAction } from 'react';

import type { Dispatch } from 'react';

export function useReportPhotos(setErrors: Dispatch<SetStateAction<Record<string, string>>>) {
  const [files, setFiles] = useState<File[]>([]);
  const [kept, setKept] = useState<Image[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list);
    if (files.length + kept.length + next.length > 3) {
      setErrors((e) => ({ ...e, imagens: 'Você pode anexar até três fotos.' }));
      return;
    }
    if (next.some((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))) {
      setErrors((e) => ({ ...e, imagens: 'Escolha fotos JPG, PNG ou WebP.' }));
      return;
    }
    if (next.some((f) => f.size > 5 * 1024 * 1024)) {
      setErrors((e) => ({ ...e, imagens: 'Cada foto pode ter até 5 MB.' }));
      return;
    }
    setFiles((f) => [...f, ...next]);
    setErrors((e) => ({ ...e, imagens: '' }));
  }
  return { files, setFiles, kept, setKept, previews, addFiles };
}
