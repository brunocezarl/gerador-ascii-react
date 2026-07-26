// Helpers de export: download de arquivos, PNG e GIF animado.
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadText = (text: string, filename: string): void => {
  downloadBlob(new Blob([text], { type: 'text/plain' }), filename);
};

export interface GifOptions {
  width: number; // px
  height: number; // px
  frameCount: number;
  delayMs: number;
  paint: (ctx: CanvasRenderingContext2D, frameIndex: number) => void;
  onProgress?: (progress: number) => void;
}

export const encodeGif = async (opts: GifOptions): Promise<Blob> => {
  const { width, height, frameCount, delayMs, paint, onProgress } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D não disponível');

  const gif = GIFEncoder();
  for (let i = 0; i < frameCount; i++) {
    paint(ctx, i);
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, { palette, delay: delayMs });
    onProgress?.((i + 1) / frameCount);
    // Devolve o controle para a UI entre frames para a barra de progresso andar
    if (i % 4 === 3) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
};
