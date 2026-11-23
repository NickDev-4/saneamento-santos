const MAX_SOURCE_SIZE = 20 * 1024 * 1024;
const MAX_OUTPUT_SIZE = 1 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function prepareCaseImage(file: File): Promise<File> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Escolha fotos JPG, PNG ou WebP.');
  }
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error('Cada foto pode ter até 20 MB antes da redução.');
  }

  let bitmap: ImageBitmap | undefined;
  let image: CanvasImageSource;
  let sourceWidth: number;
  let sourceHeight: number;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    image = bitmap;
    sourceWidth = bitmap.width;
    sourceHeight = bitmap.height;
  } catch {
    image = await loadImage(file);
    sourceWidth = (image as HTMLImageElement).naturalWidth;
    sourceHeight = (image as HTMLImageElement).naturalHeight;
  }

  try {
    if (!sourceWidth || !sourceHeight || sourceWidth * sourceHeight > 60_000_000) {
      throw new Error('A foto tem dimensões muito grandes. Escolha uma imagem menor.');
    }

    let width = Math.round(sourceWidth * Math.min(1, MAX_DIMENSION / sourceWidth, MAX_DIMENSION / sourceHeight));
    let height = Math.round(sourceHeight * Math.min(1, MAX_DIMENSION / sourceWidth, MAX_DIMENSION / sourceHeight));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar esta foto.');

    let output: Blob | null = null;
    let quality = 0.82;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      output = await canvasToBlob(canvas, quality);
      if (output.size <= MAX_OUTPUT_SIZE) break;

      if (quality > 0.5) {
        quality -= 0.12;
      } else {
        width = Math.max(1, Math.round(width * 0.85));
        height = Math.max(1, Math.round(height * 0.85));
        quality = 0.76;
      }
    }

    if (!output || output.size > MAX_OUTPUT_SIZE) {
      throw new Error('Não foi possível reduzir a foto o suficiente. Escolha outra imagem.');
    }

    const name = file.name.replace(/\.[^.]+$/, '') || 'foto';
    return new File([output], `${name}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } finally {
    bitmap?.close();
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível abrir esta foto. Escolha um arquivo de imagem válido.'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível preparar esta foto.'))),
      'image/jpeg',
      quality,
    );
  });
}
