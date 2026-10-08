export interface ExportStyle {
  fontSize: number;
  background: string;
  color: string;
}

// Mesma aparência da tela (ver App.css): fonte monoespaçada, letter-spacing e padding
const FONT_FAMILY = "'Courier New', Courier, monospace";
const ADVANCE_EM = 0.6;
const SPACING_EM = 0.05;
const PADDING = 20;

const XML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const escapeXml = (text: string): string => text.replace(/[&<>"']/g, (ch) => XML_ENTITIES[ch]);

// Texto gerado pela arte -> linhas (sem a quebra de linha final)
export const toLines = (text: string): string[] => text.replace(/\n$/, '').split('\n');

const columnsOf = (lines: string[]): number =>
  Math.max(0, ...lines.map((line) => Array.from(line).length));

// Tamanho da imagem exportada em px, sem escala
export const gridSize = (lines: string[], fontSize: number) => ({
  width: PADDING * 2 + columnsOf(lines) * fontSize * (ADVANCE_EM + SPACING_EM),
  height: PADDING * 2 + lines.length * fontSize,
});

// SVG vetorial com cor de fundo, cor do texto e linhas como texto selecionável
export const buildSvg = (lines: string[], style: ExportStyle): string => {
  const { width, height } = gridSize(lines, style.fontSize);
  const rows = lines
    .map((line, row) => `    <text x="${PADDING}" y="${PADDING + row * style.fontSize}" xml:space="preserve">${escapeXml(line)}</text>`)
    .join('\n');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `  <rect width="100%" height="100%" fill="${escapeXml(style.background)}"/>`,
    `  <g font-family="${FONT_FAMILY}" font-size="${style.fontSize}" letter-spacing="${Number((style.fontSize * SPACING_EM).toFixed(3))}" fill="${escapeXml(style.color)}" dominant-baseline="hanging">`,
    rows,
    '  </g>',
    '</svg>',
  ].join('\n');
};

// Canvas do tamanho da arte, multiplicado por `scale` (2 para PNG nítido)
export const createGridCanvas = (lines: string[], style: ExportStyle, scale: number): HTMLCanvasElement => {
  const { width, height } = gridSize(lines, style.fontSize);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  return canvas;
};

// Desenha as linhas no canvas, célula por célula, como a tela faz
export const drawGrid = (canvas: HTMLCanvasElement, lines: string[], style: ExportStyle, scale: number): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = gridSize(lines, style.fontSize);
  const cell = style.fontSize * (ADVANCE_EM + SPACING_EM);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = style.color;
  ctx.font = `${style.fontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'top';
  lines.forEach((line, row) => {
    let col = 0;
    for (const ch of line) {
      if (ch !== ' ') ctx.fillText(ch, PADDING + col * cell, PADDING + row * style.fontSize);
      col++;
    }
  });
};

const VIDEO_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];

// Formato de vídeo que este navegador grava, ou null se não der
export const pickVideoMimeType = (): string | null => {
  if (
    typeof MediaRecorder === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined' ||
    typeof HTMLCanvasElement.prototype.captureStream !== 'function'
  ) {
    return null;
  }
  return VIDEO_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
};

// Grava `seconds` de vídeo do canvas. drawFrame recebe o tempo decorrido em segundos
// e desenha o quadro correspondente. Resolve com o arquivo pronto.
export const recordVideo = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  seconds: number,
  fps: number,
  drawFrame: (elapsed: number) => void
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    const finish = () => stream.getTracks().forEach((track) => track.stop());

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      finish();
      reject(new Error('Recording failed'));
    };
    recorder.onstop = () => {
      finish();
      resolve(new Blob(chunks, { type: mimeType }));
    };

    const startedAt = performance.now();
    const tick = (now: number) => {
      try {
        const elapsed = (now - startedAt) / 1000;
        drawFrame(Math.min(elapsed, seconds));
        if (elapsed >= seconds) {
          recorder.stop();
          return;
        }
        requestAnimationFrame(tick);
      } catch (error) {
        if (recorder.state !== 'inactive') recorder.stop();
        finish();
        reject(error);
      }
    };

    recorder.start();
    requestAnimationFrame(tick);
  });

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Dá tempo para o navegador começar o download antes de liberar o arquivo
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
