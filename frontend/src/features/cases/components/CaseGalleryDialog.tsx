import type { Case } from '@/contracts';
import type { CaseDetailController } from '@/features/cases/hooks/useCaseDetailPage';
import { Dialog } from '@/shared/ui/Dialog';

type Props = Pick<CaseDetailController, 'setGalleryOpen'> & { c: Case };

export function CaseGalleryDialog({ c, setGalleryOpen }: Props) {
  return (
    <Dialog title="Imagens do chamado" onClose={() => setGalleryOpen(false)}>
      <div className="gallery">
        {c.imagens.map((image, index) => (
          <figure key={image.id}>
            <img
              src={image.url}
              alt={
                image.ilustrativa
                  ? 'Ilustração do cenário de teste'
                  : `Foto ${index + 1} do chamado`
              }
            />
            <figcaption>
              {image.ilustrativa
                ? 'Ilustração de um cenário fictício para avaliação.'
                : `Imagem ${index + 1} enviada no atendimento.`}
            </figcaption>
          </figure>
        ))}
      </div>
    </Dialog>
  );
}
