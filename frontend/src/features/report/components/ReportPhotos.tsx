import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { Camera, ImagePlus, X } from 'lucide-react';

type Props = Pick<
  ReportFormController,
  'addFiles' | 'errors' | 'setKept' | 'kept' | 'setFiles' | 'previews'
>;

export function ReportPhotos({ addFiles, errors, setKept, kept, setFiles, previews }: Props) {
  return (
    <div className="field">
      <label htmlFor="fotos">
        Fotos do problema<span className="optional">1 a 3 fotos</span>
      </label>
      <div className="upload-zone">
        <ImagePlus size={28} />
        <strong>Mostre o que está acontecendo</strong>
        <p>JPG, PNG ou WebP · até 5 MB por foto</p>
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
            <img src={image.url} alt={`Imagem mantida ${i + 1}`} />
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
