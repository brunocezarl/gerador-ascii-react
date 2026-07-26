import { describe, it, expect } from 'vitest';
import { computeField, fieldToText, fieldToSvg, makeColorLUT } from './engine';
import type { FieldOptions } from './engine';
import { buildTextMask } from './textmask';

const baseOptions = (overrides: Partial<FieldOptions> = {}): FieldOptions => ({
  patternName: 'waves',
  patternNameB: null,
  patternMix: 0,
  scale: 0.2,
  speed: 5,
  width: 20,
  height: 10,
  density: 0.5,
  textMask: null,
  imageLum: null,
  imageMix: 0,
  mouse: null,
  ...overrides,
});

describe('computeField', () => {
  it('gera um campo do tamanho da grade com valores em [0, 1)', () => {
    const field = computeField(10, baseOptions());
    expect(field).toHaveLength(20 * 10);
    for (const v of field) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('com mix=1 o blend equivale ao pattern secundário puro', () => {
    const blended = computeField(7, baseOptions({ patternNameB: 'mandala', patternMix: 1 }));
    const pure = computeField(7, baseOptions({ patternName: 'mandala' }));
    expect(Array.from(blended)).toEqual(Array.from(pure));
  });

  it('com mix=0 o pattern secundário não interfere', () => {
    const blended = computeField(7, baseOptions({ patternNameB: 'mandala', patternMix: 0 }));
    const pure = computeField(7, baseOptions());
    expect(Array.from(blended)).toEqual(Array.from(pure));
  });

  it('pattern desconhecido cai no fallback em vez de quebrar', () => {
    const fallback = computeField(3, baseOptions({ patternName: '__proto__' }));
    const waves = computeField(3, baseOptions({ patternName: 'waves' }));
    expect(Array.from(fallback)).toEqual(Array.from(waves));
  });

  it('text mask clareia o fundo e adensa o traço', () => {
    const mask = new Uint8Array(20 * 10);
    mask[0] = 1; // célula 0 faz parte do traço
    const field = computeField(5, baseOptions({ textMask: mask }));
    // Fora do traço tudo vira o valor mais claro possível
    expect(field[1]).toBeCloseTo(0.9999, 4);
    expect(field[0]).toBeLessThan(field[1]);
  });

  it('imagem escura adensa, imagem clara clareia (mix=1)', () => {
    const dark = new Float32Array(20 * 10).fill(0);
    const light = new Float32Array(20 * 10).fill(1);
    const darkField = computeField(5, baseOptions({ imageLum: dark, imageMix: 1 }));
    const lightField = computeField(5, baseOptions({ imageLum: light, imageMix: 1 }));
    expect(darkField[0]).toBeCloseTo(0, 4);
    expect(lightField[0]).toBeCloseTo(0.9999, 4);
  });
});

describe('fieldToText', () => {
  it('emite a grade completa com quebras de linha', () => {
    const field = computeField(0, baseOptions());
    const text = fieldToText(field, 20, 10, '█▓▒░·');
    const lines = text.split('\n');
    expect(lines).toHaveLength(11); // 10 linhas + newline final
    expect(lines[10]).toBe('');
    for (let i = 0; i < 10; i++) {
      expect([...lines[i]]).toHaveLength(20);
    }
  });

  it('usa espaço quando o charset está vazio', () => {
    const field = computeField(0, baseOptions());
    const text = fieldToText(field, 20, 10, '');
    expect(text.replace(/\n/g, '')).toBe(' '.repeat(200));
  });
});

describe('fieldToSvg', () => {
  const paint = (characters: string, background: string, colors: string[]) => {
    const field = computeField(0, baseOptions());
    return fieldToSvg(field, {
      width: 20,
      height: 10,
      characters,
      cellSize: 12,
      background,
      colors,
    });
  };

  it('gera um SVG com fundo e runs de texto', () => {
    const svg = paint('█▓▒░·', '#F0EEE6', makeColorLUT(['#000000', '#ffffff']));
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<rect');
    expect(svg).toContain('<text');
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('escapa payloads em atributos e no conteúdo', () => {
    const svg = paint('<&>', '#fff"/><script>alert(1)</script>', ['#000"/><script>x</script>']);
    expect(svg).not.toContain('<script');
    expect(svg).not.toContain('alert(1)</');
  });
});

describe('makeColorLUT', () => {
  it('interpola do primeiro ao último stop', () => {
    const lut = makeColorLUT(['#000000', '#ffffff'], 3);
    expect(lut[0]).toBe('rgb(0,0,0)');
    expect(lut[1]).toBe('rgb(128,128,128)');
    expect(lut[2]).toBe('rgb(255,255,255)');
  });

  it('lida com listas degeneradas', () => {
    expect(makeColorLUT([])).toEqual(['#000000']);
    expect(makeColorLUT(['#123456'])).toEqual(['#123456']);
  });
});

describe('buildTextMask', () => {
  it('marca células para glifos conhecidos', () => {
    const mask = buildTextMask('A', 8, 3, 40, 20);
    expect(mask.some((v) => v === 1)).toBe(true);
  });

  it('fica vazio para caracteres sem glifo', () => {
    const mask = buildTextMask('~~~', 8, 3, 40, 20);
    expect(mask.every((v) => v === 0)).toBe(true);
  });
});
