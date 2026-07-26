// Estado compartilhável via hash da URL. Chaves curtas para links menores.
import { patterns } from './patterns';
import { characterPresets } from './charsets';

export interface ShareState {
  pattern: string;
  patternB: string; // 'none' desliga o blend
  patternMix: number;
  speed: number;
  density: number;
  scale: number;
  width: number;
  height: number;
  characters: string;
  characterPreset: string;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  colorMode: 'mono' | 'gradient';
  colorA: string;
  colorB: string;
  textMode: boolean;
  textInput: string;
  textScale: number;
  textThickness: number;
}

export const DEFAULT_STATE: ShareState = {
  pattern: 'waves',
  patternB: 'none',
  patternMix: 0.5,
  speed: 5,
  density: 0.3,
  scale: 0.2,
  width: 60,
  height: 30,
  characters: '█▓▒░·',
  characterPreset: 'blocks',
  fontSize: 12,
  backgroundColor: '#F0EEE6',
  textColor: '#333333',
  colorMode: 'mono',
  colorA: '#1A1A1A',
  colorB: '#C9C3B4',
  textMode: false,
  textInput: 'HELLO',
  textScale: 8,
  textThickness: 3,
};

// Chaves como '__proto__' resolvem para o protótipo em acesso direto, então a
// validação precisa ser de propriedade própria
const hasOwn = (obj: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const clampNum = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number =>
  Math.round(clampNum(value, min, max, fallback));

// Cores atravessam URL/localStorage e acabam em atributos de SVG exportado,
// então só passa hex válido
const asColor = (value: unknown, fallback: string): string =>
  typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;

const asString = (value: unknown, fallback: string, maxLength: number): string =>
  typeof value === 'string' ? value.slice(0, maxLength) : fallback;

// Valida e normaliza um estado vindo de fora (URL, localStorage) para um
// ShareState seguro e completo. sanitizeShareState({}) === DEFAULT_STATE.
export const sanitizeShareState = (raw: Partial<ShareState>): ShareState => ({
  pattern: typeof raw.pattern === 'string' && hasOwn(patterns, raw.pattern) ? raw.pattern : DEFAULT_STATE.pattern,
  patternB: typeof raw.patternB === 'string' && hasOwn(patterns, raw.patternB) ? raw.patternB : 'none',
  patternMix: clampNum(raw.patternMix, 0, 1, DEFAULT_STATE.patternMix),
  speed: clampInt(raw.speed, 1, 20, DEFAULT_STATE.speed),
  density: clampNum(raw.density, 0.1, 2, DEFAULT_STATE.density),
  scale: clampNum(raw.scale, 0.05, 1, DEFAULT_STATE.scale),
  width: clampInt(raw.width, 20, 160, DEFAULT_STATE.width),
  height: clampInt(raw.height, 10, 80, DEFAULT_STATE.height),
  characters: asString(raw.characters, DEFAULT_STATE.characters, 32),
  characterPreset:
    raw.characterPreset === undefined
      ? DEFAULT_STATE.characterPreset
      : typeof raw.characterPreset === 'string' &&
          (hasOwn(characterPresets, raw.characterPreset) || raw.characterPreset === 'custom')
        ? raw.characterPreset
        : 'custom',
  fontSize: clampInt(raw.fontSize, 8, 24, DEFAULT_STATE.fontSize),
  backgroundColor: asColor(raw.backgroundColor, DEFAULT_STATE.backgroundColor),
  textColor: asColor(raw.textColor, DEFAULT_STATE.textColor),
  colorMode: raw.colorMode === 'gradient' ? 'gradient' : raw.colorMode === 'mono' ? 'mono' : DEFAULT_STATE.colorMode,
  colorA: asColor(raw.colorA, DEFAULT_STATE.colorA),
  colorB: asColor(raw.colorB, DEFAULT_STATE.colorB),
  textMode: typeof raw.textMode === 'boolean' ? raw.textMode : DEFAULT_STATE.textMode,
  textInput: asString(raw.textInput, DEFAULT_STATE.textInput, 40),
  textScale: clampNum(raw.textScale, 4, 15, DEFAULT_STATE.textScale),
  textThickness: clampNum(raw.textThickness, 1, 8, DEFAULT_STATE.textThickness),
});

type Compact = { [key: string]: string | number | boolean };

const KEYS: { [K in keyof ShareState]: string } = {
  pattern: 'p',
  patternB: 'p2',
  patternMix: 'pm',
  speed: 'sp',
  density: 'd',
  scale: 'sc',
  width: 'w',
  height: 'h',
  characters: 'ch',
  characterPreset: 'cp',
  fontSize: 'fs',
  backgroundColor: 'bg',
  textColor: 'tc',
  colorMode: 'cm',
  colorA: 'c1',
  colorB: 'c2',
  textMode: 'tm',
  textInput: 'tx',
  textScale: 'ts',
  textThickness: 'tt',
};

export const encodeShareHash = (state: ShareState): string => {
  const compact: Compact = {};
  (Object.keys(KEYS) as (keyof ShareState)[]).forEach((key) => {
    compact[KEYS[key]] = state[key];
  });
  return '#' + encodeURIComponent(JSON.stringify(compact));
};

export const decodeShareHash = (hash: string): Partial<ShareState> | null => {
  if (!hash || hash.length < 2) return null;
  try {
    const compact = JSON.parse(decodeURIComponent(hash.slice(1))) as Compact;
    if (typeof compact !== 'object' || compact === null) return null;
    const state: Partial<ShareState> = {};
    (Object.keys(KEYS) as (keyof ShareState)[]).forEach((key) => {
      const value = compact[KEYS[key]];
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any)[key] = value;
      }
    });
    return state;
  } catch {
    return null;
  }
};
