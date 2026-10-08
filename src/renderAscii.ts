import { patterns, type PatternName, type PatternParams } from './patterns';
import type { GridPointer } from './pointer';

export interface RenderOptions {
  patternName: PatternName;
  scale: number;
  speed: number;
  width: number;
  height: number;
  density: number;
  characters: string;
  textMask: Uint8Array | null;
  mouse: GridPointer | null;
}

// Quanto o ponteiro empurra o valor do pattern, no máximo
const POINTER_STRENGTH = 0.5;

// Efeito do ponteiro na célula (x, y). A célula é desenhada no centro (x + 0.5, y + 0.5).
// A distância é medida na proporção da tela, então o efeito é um círculo e não uma elipse.
export const pointerInfluence = (x: number, y: number, t: number, pointer: GridPointer): number => {
  const dx = (x + 0.5 - pointer.x) * pointer.aspect;
  const dy = y + 0.5 - pointer.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return Math.exp(-distance * 0.2) * Math.sin(t * 3) * POINTER_STRENGTH;
};

// Converte o valor de um pattern em caractere.
// Valores fora de [-1, 1] são limitados: sem isso o Math.pow gera NaN para
// valores negativos e a célula vira espaço em branco.
export const valueToChar = (value: number, density: number, chars: string[]): string => {
  const clamped = Number.isNaN(value) ? 0 : Math.max(-1, Math.min(1, value));
  const normalized = (clamped + 1) / 2; // [-1, 1] -> [0, 1]
  const adjusted = Math.pow(normalized, 1 / density); // Ajusta densidade
  const index = Math.max(0, Math.min(chars.length - 1, Math.floor(adjusted * chars.length)));
  return chars[index] ?? ' ';
};

// `t` é o tempo do pattern (ver toPatternTime em animation.ts)
export const renderAscii = (t: number, opts: RenderOptions): string => {
  const { width, height, density, textMask, mouse } = opts;
  // Array.from separa por caractere real, então emoji não quebram em dois
  const chars = Array.from(opts.characters);
  const params: PatternParams = { scale: opts.scale, speed: opts.speed, width, height, density };
  const pattern = patterns[opts.patternName];
  let result = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = pattern(x, y, t, params);

      // Interação com mouse
      if (mouse) {
        value += pointerInfluence(x, y, t, mouse);
      }

      // Text Mode: o texto mostra o pattern animado, o fundo fica claro
      if (textMask) {
        if (textMask[y * width + x]) {
          value = value * 0.6 - 0.4; // Puxa para os caracteres mais densos
        } else {
          value = 1;
        }
      }

      result += valueToChar(value, density, chars);
    }
    result += '\n';
  }

  return result;
};
