import { describe, it, expect } from 'vitest';
import { patterns, type PatternName } from './patterns';

const W = 60;
const H = 30;
const params = { scale: 0.2, speed: 5, width: W, height: H, density: 0.3 };
const names = Object.keys(patterns) as PatternName[];

// Amostra da grade em alguns instantes da animação
const samples = (fn: (x: number, y: number, t: number) => number) => {
  const values: number[] = [];
  for (const t of [0, 1.7, 9.3]) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) values.push(fn(x, y, t));
    }
  }
  return values;
};

describe('patterns', () => {
  it.each(names)('%s devolve sempre números finitos', (name) => {
    const values = samples((x, y, t) => patterns[name](x, y, t, params));
    expect(values.every(Number.isFinite)).toBe(true);
  });

  // Regressão: sem compressão, golden_petals passava de ±5 e ficava com células em branco
  it('golden_petals fica dentro de [-1, 1]', () => {
    const values = samples((x, y, t) => patterns.golden_petals(x, y, t, params));
    expect(Math.max(...values.map(Math.abs))).toBeLessThanOrEqual(1);
  });
});
