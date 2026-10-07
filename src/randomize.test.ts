import { describe, it, expect } from 'vitest';
import { randomSettings } from './randomize';
import { palettes } from './palettes';
import { patterns } from './patterns';
import { characterPresets } from './presets';
import { SLIDER, snapToRange } from './settings';

// Gerador determinístico: devolve sempre o mesmo valor (0 a 1, exclusivo)
const constantRng = (value: number) => () => value;

describe('randomSettings', () => {
  it('escolhe valores válidos com qualquer sorteio', () => {
    for (const seed of [0, 0.25, 0.5, 0.75, 0.999]) {
      const random = randomSettings(constantRng(seed));
      expect(Object.keys(patterns)).toContain(random.pattern);
      expect(Object.keys(characterPresets)).toContain(random.characterSet);
      expect(palettes.map((p) => p.background)).toContain(random.backgroundColor);
      expect(palettes.map((p) => p.text)).toContain(random.textColor);
    }
  });

  it('mantém os valores dos sliders dentro do intervalo e no passo', () => {
    for (const seed of [0, 0.13, 0.5, 0.87, 0.9999]) {
      const random = randomSettings(constantRng(seed));
      expect(random.speed).toBeGreaterThanOrEqual(SLIDER.speed.min);
      expect(random.speed).toBeLessThanOrEqual(SLIDER.speed.max);
      expect(Number.isInteger(random.speed)).toBe(true);
      expect(random.density).toBe(snapToRange(random.density as number, SLIDER.density));
      expect(random.scale).toBe(snapToRange(random.scale as number, SLIDER.scale));
    }
  });

  it('chega aos extremos dos intervalos', () => {
    const low = randomSettings(constantRng(0));
    const high = randomSettings(constantRng(0.9999));
    expect(low.speed).toBe(SLIDER.speed.min);
    expect(high.speed).toBe(SLIDER.speed.max);
    expect(low.density).toBe(SLIDER.density.min);
    expect(high.density).toBe(SLIDER.density.max);
  });

  it('não mexe em tamanho, fonte nem modos', () => {
    const keys = Object.keys(randomSettings(constantRng(0.4)));
    for (const forbidden of ['width', 'height', 'fontSize', 'isAnimating', 'mouseInteraction', 'textMode', 'textInput']) {
      expect(keys).not.toContain(forbidden);
    }
  });
});
