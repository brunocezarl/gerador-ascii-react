import { describe, it, expect } from 'vitest';
import { findPaletteId, palettes } from './palettes';

// Razão de contraste WCAG entre duas cores hexadecimais
const luminance = (hex: string): number => {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe('palettes', () => {
  it.each(palettes)('$label tem contraste de texto de pelo menos 4.5:1', ({ background, text }) => {
    expect(contrast(background, text)).toBeGreaterThanOrEqual(4.5);
  });

  it('tem ids únicos', () => {
    const ids = palettes.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('findPaletteId', () => {
  it('acha a paleta pelas cores, sem diferenciar maiúsculas', () => {
    expect(findPaletteId('#0B1020', '#7DD3FC')).toBe('noite');
  });

  it('devolve "custom" quando as cores não batem com nenhuma paleta', () => {
    expect(findPaletteId('#123456', '#654321')).toBe('custom');
  });
});
