// Motor de render: calcula o campo de valores da grade e pinta em canvas ou texto.
import { patterns } from './patterns';
import type { PatternParams } from './patterns';
import { CELL_ASPECT } from './textmask';

export interface FieldOptions {
  patternName: string;
  scale: number;
  speed: number;
  width: number;
  height: number;
  density: number;
  textMask: Uint8Array | null;
  // Luminância por célula (0 = escuro, 1 = claro) vinda de uma imagem
  imageLum: Float32Array | null;
  imageMix: number;
  mouse: { x: number; y: number } | null;
}

// Calcula o campo já normalizado e ajustado pela densidade.
// Valores em [0, 1): baixo = caractere denso, alto = caractere leve.
export const computeField = (frame: number, opts: FieldOptions): Float32Array => {
  const t = frame * 0.05;
  const { width, height, density, textMask, imageLum, imageMix, mouse } = opts;
  const params: PatternParams = { scale: opts.scale, speed: opts.speed, width, height, density };
  const pattern = patterns[opts.patternName] ?? patterns.waves;
  const fn = pattern.fn;
  const field = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let value = fn(x, y, t, params);

      // Mistura com a luminância da imagem (escuro na imagem = denso no ASCII)
      if (imageLum && imageMix > 0) {
        const imageValue = imageLum[i] * 2 - 1;
        value = value * (1 - imageMix) + imageValue * imageMix;
      }

      // Interação com mouse
      if (mouse) {
        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.exp(-mouseDist * 0.2) * Math.sin(t * 3);
        value += influence * 0.5;
      }

      // Text Mode: o texto mostra o pattern animado, o fundo fica claro
      if (textMask) {
        if (textMask[i]) {
          value = value * 0.6 - 0.4; // Puxa para os caracteres mais densos
        } else {
          value = 1;
        }
      }

      const normalized = Math.max(0, Math.min(1, (value + 1) / 2));
      const adjusted = Math.pow(normalized, 1 / density);
      field[i] = Math.min(adjusted, 0.9999);
    }
  }

  return field;
};

export const fieldToText = (
  field: Float32Array,
  width: number,
  height: number,
  characters: string
): string => {
  const chars = characters.length > 0 ? characters : ' ';
  let result = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = Math.min(chars.length - 1, Math.floor(field[y * width + x] * chars.length));
      result += chars[index];
    }
    result += '\n';
  }
  return result;
};

export interface PaintOptions {
  width: number;
  height: number;
  characters: string;
  cellSize: number; // altura da célula em px
  background: string;
  colors: string[]; // LUT de cores; com 1 entrada vira cor única
}

export const paintField = (
  ctx: CanvasRenderingContext2D,
  field: Float32Array,
  opts: PaintOptions
): void => {
  const { width, height, cellSize, background, colors } = opts;
  const chars = opts.characters.length > 0 ? opts.characters : ' ';
  const cellW = cellSize * CELL_ASPECT;

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width * cellW, height * cellSize);
  ctx.font = `${cellSize}px 'Courier New', Courier, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let lastColor = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = field[y * width + x];
      const ch = chars[Math.min(chars.length - 1, Math.floor(v * chars.length))];
      if (ch === ' ') continue;
      const color = colors[Math.min(colors.length - 1, Math.floor(v * colors.length))];
      if (color !== lastColor) {
        ctx.fillStyle = color;
        lastColor = color;
      }
      ctx.fillText(ch, x * cellW + cellW / 2, y * cellSize + cellSize / 2);
    }
  }
};

// ---- Cores ----

const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Gera uma LUT interpolando linearmente entre as paradas de cor.
// A posição 0 corresponde ao caractere mais denso.
export const makeColorLUT = (stops: string[], steps = 48): string[] => {
  if (stops.length === 0) return ['#000000'];
  if (stops.length === 1) return [stops[0]];
  const rgb = stops.map(hexToRgb);
  const lut: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * (rgb.length - 1);
    const seg = Math.min(rgb.length - 2, Math.floor(t));
    const f = t - seg;
    const a = rgb[seg];
    const b = rgb[seg + 1];
    lut.push(
      `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`
    );
  }
  return lut;
};

export interface Palette {
  name: string;
  label: string;
  bg: string;
  stops: [string, string];
}

export const palettes: Palette[] = [
  { name: 'ink', label: 'Ink', bg: '#F0EEE6', stops: ['#1A1A1A', '#C9C3B4'] },
  { name: 'terminal', label: 'Terminal', bg: '#050E07', stops: ['#4AF626', '#0E3D14'] },
  { name: 'neon', label: 'Neon', bg: '#0A0A12', stops: ['#FF2EA6', '#00E5FF'] },
  { name: 'ocean', label: 'Ocean', bg: '#03141F', stops: ['#BFEFFF', '#0B4F6C'] },
  { name: 'sunset', label: 'Sunset', bg: '#1B1024', stops: ['#FFD166', '#EF476F'] },
  { name: 'forest', label: 'Forest', bg: '#0C150C', stops: ['#D8F3DC', '#2D6A4F'] },
  { name: 'blueprint', label: 'Blueprint', bg: '#0B2447', stops: ['#FFFFFF', '#576CBC'] },
];

// ---- Imagem ----

// Amostra a luminância de uma imagem na resolução da grade, preservando o
// aspecto visual (células não são quadradas). Área fora da imagem fica clara.
export const sampleImageLuminance = (
  img: HTMLImageElement,
  width: number,
  height: number
): Float32Array => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const out = new Float32Array(width * height);
  if (!ctx || !img.width || !img.height) {
    out.fill(1);
    return out;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // "Contain" no espaço visual: largura da grade comprimida pelo aspecto da célula
  const visualW = width * CELL_ASPECT;
  const s = Math.min(visualW / img.width, height / img.height);
  const dw = (img.width * s) / CELL_ASPECT;
  const dh = img.height * s;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);

  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 0; i < out.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    out[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  return out;
};
