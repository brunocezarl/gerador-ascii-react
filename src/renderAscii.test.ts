import { describe, it, expect } from 'vitest';
import { renderAscii, valueToChar, type RenderOptions } from './renderAscii';
import { patterns, type PatternName } from './patterns';
import { characterPresets } from './presets';

const BLOCKS = Array.from(characterPresets.blocks);

const options = (overrides: Partial<RenderOptions> = {}): RenderOptions => ({
  patternName: 'waves',
  scale: 0.2,
  speed: 5,
  width: 20,
  height: 10,
  density: 0.3,
  characters: characterPresets.blocks,
  textMask: null,
  mouse: null,
  ...overrides,
});

describe('valueToChar', () => {
  it('mapeia -1 para o caractere mais denso e 1 para o mais leve', () => {
    expect(valueToChar(-1, 0.3, BLOCKS)).toBe('█');
    expect(valueToChar(1, 0.3, BLOCKS)).toBe('·');
  });

  // Regressão: valores fora de [-1, 1] viravam NaN e saíam como espaço
  it('limita valores fora do intervalo em vez de devolver espaço', () => {
    for (const value of [-5, -1.2, 1.2, 5, -Infinity, Infinity]) {
      expect(BLOCKS).toContain(valueToChar(value, 0.3, BLOCKS));
    }
  });

  it('trata NaN como 0', () => {
    expect(valueToChar(NaN, 0.3, BLOCKS)).toBe(valueToChar(0, 0.3, BLOCKS));
  });

  it('devolve espaço só quando não há caracteres', () => {
    expect(valueToChar(0, 0.3, [])).toBe(' ');
  });
});

describe('renderAscii', () => {
  it('monta uma grade de width x height', () => {
    const rows = renderAscii(0, options({ width: 12, height: 4 })).split('\n');
    expect(rows.slice(0, 4).every((row) => Array.from(row).length === 12)).toBe(true);
  });

  // Regressão: o charset era indexado por unidade UTF-16, e emoji saíam partidos
  it('separa emoji como um caractere só', () => {
    const out = renderAscii(0, options({ characters: '😀🔥' }));
    const cells = Array.from(out.replace(/\n/g, ''));
    expect(cells.every((c) => c === '😀' || c === '🔥')).toBe(true);
  });

  it.each(Object.keys(patterns) as PatternName[])('%s não gera células em branco', (name) => {
    for (const t of [0, 1.7, 9.3]) {
      const out = renderAscii(t, options({ patternName: name, width: 60, height: 30, scale: 0.2, density: 0.3 }));
      expect(out.replace(/\n/g, '')).not.toContain(' ');
    }
  });
});
