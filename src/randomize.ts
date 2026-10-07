import { palettes } from './palettes';
import { patterns, type PatternName } from './patterns';
import { characterPresets, type CharacterPresetName } from './presets';
import { SLIDER, snapToRange, type Settings } from './settings';

type Rng = () => number;

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

// Valor inteiro entre min e max, inclusive
const integerIn = (min: number, max: number, rng: Rng): number =>
  min + Math.floor(rng() * (max - min + 1));

// Sorteia um padrão, um set de caracteres, uma paleta e valores dos sliders.
// Tamanho da grade, Font Size e modos (Animate, Mouse, Text Mode) não mudam.
export const randomSettings = (rng: Rng = Math.random): Partial<Settings> => {
  const palette = pick(palettes, rng);
  return {
    pattern: pick(Object.keys(patterns) as PatternName[], rng),
    characterSet: pick(Object.keys(characterPresets) as CharacterPresetName[], rng),
    backgroundColor: palette.background,
    textColor: palette.text,
    speed: integerIn(SLIDER.speed.min, SLIDER.speed.max, rng),
    density: snapToRange(SLIDER.density.min + rng() * (SLIDER.density.max - SLIDER.density.min), SLIDER.density),
    scale: snapToRange(SLIDER.scale.min + rng() * (SLIDER.scale.max - SLIDER.scale.min), SLIDER.scale),
  };
};
