import { describe, it, expect } from 'vitest';
import { advanceTime, toPatternTime } from './animation';

// Simula N segundos de animação em um monitor com a taxa informada
const simulate = (refreshHz: number, seconds: number) => {
  let time = 0;
  const frames = Math.round(refreshHz * seconds);
  for (let i = 0; i < frames; i++) {
    time = advanceTime(time, 1000 / refreshHz);
  }
  return time;
};

describe('advanceTime', () => {
  // Regressão: a animação andava o dobro da velocidade em telas de 120 Hz
  it('avança 1 segundo em 60, 120 e 144 Hz', () => {
    expect(simulate(60, 1)).toBeCloseTo(1, 10);
    expect(simulate(120, 1)).toBeCloseTo(1, 10);
    expect(simulate(144, 1)).toBeCloseTo(1, 10);
  });

  it('limita o passo depois de uma pausa (ex.: aba em segundo plano)', () => {
    expect(advanceTime(0, 5000)).toBeCloseTo(0.1, 10);
  });

  it('nunca volta no tempo', () => {
    expect(advanceTime(2, -50)).toBe(2);
  });
});

describe('toPatternTime', () => {
  it('mantém a velocidade original (1 s = 3 unidades de pattern)', () => {
    expect(toPatternTime(1)).toBe(3);
  });
});
