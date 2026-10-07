import { patterns, type PatternName } from './patterns';
import { characterPresets, type CharacterSetName } from './presets';

// Tudo que define a aparência e o comportamento do app. Vai para a URL e para os presets.
export interface Settings {
  isAnimating: boolean;
  pattern: PatternName;
  speed: number;
  density: number;
  scale: number;
  width: number;
  height: number;
  fontSize: number;
  characterSet: CharacterSetName;
  customCharacters: string;
  mouseInteraction: boolean;
  backgroundColor: string;
  textColor: string;
  textMode: boolean;
  textInput: string;
  textScale: number;
  textThickness: number;
}

interface Range {
  min: number;
  max: number;
  step: number;
}

// Limites e passo de cada slider. A interface e a URL usam os mesmos valores.
export const SLIDER = {
  speed: { min: 1, max: 20, step: 1 },
  density: { min: 0.1, max: 2, step: 0.1 },
  scale: { min: 0.05, max: 1, step: 0.05 },
  width: { min: 20, max: 120, step: 1 },
  height: { min: 10, max: 60, step: 1 },
  fontSize: { min: 8, max: 24, step: 1 },
  textScale: { min: 4, max: 15, step: 1 },
  textThickness: { min: 1, max: 8, step: 1 },
} satisfies Record<string, Range>;

// Leva o valor para dentro do intervalo e para o passo mais próximo
export const snapToRange = (value: number, { min, max, step }: Range): number => {
  const clamped = Math.min(max, Math.max(min, value));
  return Number((Math.round((clamped - min) / step) * step + min).toFixed(4));
};

export const DEFAULTS: Settings = {
  isAnimating: true,
  pattern: 'waves',
  speed: 5,
  density: 0.3,
  scale: 0.2,
  width: 60,
  height: 30,
  fontSize: 12,
  characterSet: 'blocks',
  customCharacters: characterPresets.blocks,
  mouseInteraction: true,
  backgroundColor: '#f0eee6',
  textColor: '#333333',
  textMode: false,
  textInput: 'HELLO',
  textScale: 8,
  textThickness: 3,
};

// Como cada campo vira parâmetro da URL e como volta, com validação
interface Codec<T> {
  param: string;
  encode: (value: T) => string;
  decode: (raw: string) => T | undefined;
}

const toggle = (param: string): Codec<boolean> => ({
  param,
  encode: (value) => (value ? '1' : '0'),
  decode: (raw) => (raw === '1' ? true : raw === '0' ? false : undefined),
});

const number = (param: string, range: Range): Codec<number> => ({
  param,
  encode: (value) => String(value),
  decode: (raw) => {
    const value = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(value)) return undefined;
    return snapToRange(value, range);
  },
});

const choice = <T extends string>(param: string, options: readonly T[]): Codec<T> => ({
  param,
  encode: (value) => value,
  decode: (raw) => (options as readonly string[]).includes(raw) ? (raw as T) : undefined,
});

// Cor como hex sem '#' (ex.: "f0eee6"). Só aceita 6 dígitos hexadecimais.
const color = (param: string): Codec<string> => ({
  param,
  encode: (value) => value.slice(1),
  decode: (raw) => (/^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : undefined),
});

const text = (param: string, maxLength: number, transform: (raw: string) => string = (raw) => raw): Codec<string> => ({
  param,
  encode: (value) => value,
  decode: (raw) => transform(raw).slice(0, maxLength),
});

const codecs: { [K in keyof Settings]: Codec<Settings[K]> } = {
  isAnimating: toggle('animate'),
  pattern: choice<PatternName>('pattern', Object.keys(patterns) as PatternName[]),
  speed: number('speed', SLIDER.speed),
  density: number('density', SLIDER.density),
  scale: number('scale', SLIDER.scale),
  width: number('width', SLIDER.width),
  height: number('height', SLIDER.height),
  fontSize: number('font', SLIDER.fontSize),
  characterSet: choice<CharacterSetName>('chars', [...Object.keys(characterPresets), 'custom'] as CharacterSetName[]),
  customCharacters: text('custom', 200),
  mouseInteraction: toggle('mouse'),
  backgroundColor: color('bg'),
  textColor: color('fg'),
  textMode: toggle('textmode'),
  textInput: text('text', 40, (raw) => raw.toUpperCase()),
  textScale: number('textsize', SLIDER.textScale),
  textThickness: number('thickness', SLIDER.textThickness),
};

const FIELDS = Object.keys(codecs) as (keyof Settings)[];

// Só entra na URL o que difere do padrão, então um link sem mudanças fica limpo.
// Os caracteres personalizados só importam quando o set é "custom".
export const encodeSettings = (settings: Settings): string => {
  const params = new URLSearchParams();
  for (const field of FIELDS) {
    if (field === 'customCharacters' && settings.characterSet !== 'custom') continue;
    const codec = codecs[field] as Codec<unknown>;
    const value = codec.encode(settings[field]);
    if (value !== codec.encode(DEFAULTS[field])) params.set(codec.param, value);
  }
  return params.toString();
};

// Lê uma query (com ou sem '?'). Valores inválidos são ignorados e o resto é mantido.
export const decodeSettings = (query: string): Partial<Settings> => {
  const params = new URLSearchParams(query);
  const result: Record<string, unknown> = {};
  for (const field of FIELDS) {
    const codec = codecs[field] as Codec<unknown>;
    const raw = params.get(codec.param);
    if (raw === null) continue;
    const value = codec.decode(raw);
    if (value !== undefined) result[field] = value;
  }
  return result as Partial<Settings>;
};
