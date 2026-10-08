import { describe, it, expect } from 'vitest';
import { paddingOf, pointerToGrid } from './pointer';

// Grade de 60 x 30 com fonte de 12 px: cada célula tem 0.65em de largura e 1em de altura
const box = { left: 100, top: 50, width: 508, height: 400 };
const padding = { left: 20, right: 20, top: 20, bottom: 20 };
const cellW = (508 - 40) / 60; // 7.8 px
const cellH = (400 - 40) / 30; // 12 px
const at = (col: number, row: number) => ({
  clientX: box.left + padding.left + col * cellW,
  clientY: box.top + padding.top + row * cellH,
});

describe('pointerToGrid', () => {
  it('ponteiro no centro da primeira célula fica em (0.5, 0.5)', () => {
    const p = pointerToGrid(box.left + padding.left + cellW / 2, box.top + padding.top + cellH / 2, box, padding, 60, 30);
    expect(p?.x).toBeCloseTo(0.5, 10);
    expect(p?.y).toBeCloseTo(0.5, 10);
  });

  // Regressão: o padding de 20 px entrava na conta e deslocava o efeito até 3 células na borda
  it('não conta o padding: a borda do texto fica em 0 e a outra borda em cols', () => {
    const start = pointerToGrid(at(0, 0).clientX, at(0, 0).clientY, box, padding, 60, 30);
    const end = pointerToGrid(box.left + box.width - padding.right, box.top + box.height - padding.bottom, box, padding, 60, 30);
    expect(start?.x).toBeCloseTo(0, 10);
    expect(start?.y).toBeCloseTo(0, 10);
    expect(end?.x).toBeCloseTo(60, 10);
    expect(end?.y).toBeCloseTo(30, 10);
  });

  it('ponteiro sobre o padding fica fora da grade', () => {
    const p = pointerToGrid(box.left + 5, box.top + 5, box, padding, 60, 30);
    expect(p?.x).toBeLessThan(0);
    expect(p?.y).toBeLessThan(0);
  });

  it('informa a proporção da célula na tela (0.65, com o espaçamento entre letras)', () => {
    const p = pointerToGrid(at(10, 10).clientX, at(10, 10).clientY, box, padding, 60, 30);
    expect(p?.aspect).toBeCloseTo(0.65, 10);
  });

  it('acompanha o tamanho do elemento quando a fonte muda (ex.: encaixe)', () => {
    // Mesma grade com fonte de 6 px: metade do tamanho, mas a posição relativa é a mesma
    const smaller = { left: 300, top: 200, width: 40 + 60 * 3.9, height: 40 + 30 * 6 };
    const p = pointerToGrid(smaller.left + padding.left + 3.9 * 10.5, smaller.top + padding.top + 6 * 4.5, smaller, padding, 60, 30);
    expect(p?.x).toBeCloseTo(10.5, 10);
    expect(p?.y).toBeCloseTo(4.5, 10);
  });

  it('sem tamanho medido não há posição', () => {
    expect(pointerToGrid(0, 0, { left: 0, top: 0, width: 0, height: 0 }, padding, 60, 30)).toBeNull();
    expect(pointerToGrid(0, 0, box, padding, 0, 30)).toBeNull();
  });
});

describe('paddingOf', () => {
  it('lê os quatro lados do padding computado', () => {
    const style = { paddingLeft: '20px', paddingRight: '18px', paddingTop: '4px', paddingBottom: '6px' };
    expect(paddingOf(style)).toEqual({ left: 20, right: 18, top: 4, bottom: 6 });
  });
});
