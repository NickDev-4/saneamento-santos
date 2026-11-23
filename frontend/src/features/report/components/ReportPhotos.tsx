import { environment } from '@/config/environment';
import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { resolveApiImageUrl } from '@/shared/lib/image-url';
import { Camera, ImagePlus, X } from 'lucide-react';

type Props = Pick<
  ReportFormController,
  'addFiles' | 'errors' | 'setKept' | 'kept' | 'setFiles' | 'previews' | 'photosProcessing'
>;

export function ReportPhotos({
  addFiles,
  errors,
  setKept,
  kept,
  setFiles,
  previews,
  photosProcessing,
}: Props) {
  return (
    <div className="field">
      <label htmlFor="fotos">
        Fotos do problema<span className="optional">1 a 3 fotos</span>
      </label>
      <div className="upload-zone">
        <ImagePlus size={28} />
        <strong>Mostre o que está acontecendo</strong>
        <p>JPG, PNG ou WebP · até 20 MB antes da redução (máximo 1 MB após)</p>
        {photosProcessing && <p role="status">Preparando as fotos para envio…</p>}
        <div className="upload-actions">
          <label className="button button-secondary" htmlFor="fotos">
            <ImagePlus size={17} />
            Escolher fotos
          </label>
          <input
            id="fotos"
            type="file"
            className="file-input"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={photosProcessing}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <label className="button button-ghost" htmlFor="camera">
            <Camera size={18} />
            Câmera
          </label>
          <input
            id="camera"
            type="file"
            className="file-input"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            disabled={photosProcessing}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>
      {errors.imagens && (
        <span className="field-message" role="alert">
          {errors.imagens}
        </span>
      )}
      <div className="photo-previews">
        {kept.map((image, i) => (
          <div key={image.id}>
            <img
              src={resolveApiImageUrl(image.url, environment.apiBaseUrl)}
              alt={`Imagem mantida ${i + 1}`}
            />
            <button
              type="button"
              aria-label={`Remover imagem mantida ${i + 1}`}
              onClick={() => setKept((k) => k.filter((x) => x.id !== image.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {previews.map((url, i) => (
          <div key={url}>
            <img src={url} alt={`Prévia da foto ${i + 1}`} />
            <button
              type="button"
              aria-label={`Remover foto ${i + 1}`}
              onClick={() => setFiles((f) => f.filter((_, index) => index !== i))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
