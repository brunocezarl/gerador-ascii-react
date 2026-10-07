import { describe, it, expect } from 'vitest';
import { buildTextMask, findUnsupportedChars } from './textMask';

const WIDTH = 60;
const HEIGHT = 30;

const mask = (text: string) => buildTextMask(text, 8, 3, WIDTH, HEIGHT);
const countSet = (m: Uint8Array) => m.reduce((total, cell) => total + cell, 0);

describe('findUnsupportedChars', () => {
  // Regressão: "AÇÃO" perdia Ç e Ã sem aviso
  it('aceita letras acentuadas do português', () => {
    expect(findUnsupportedChars('AÇÃO É ÓTIMO')).toEqual([]);
  });

  it('ignora diferença entre maiúsculas e minúsculas', () => {
    expect(findUnsupportedChars('ação')).toEqual([]);
  });

  it('lista cada caractere sem desenho uma vez só', () => {
    expect(findUnsupportedChars('ЖAЖ')).toEqual(['Ж']);
  });
});

describe('buildTextMask', () => {
  it('marca células para o texto', () => {
    const m = mask('HELLO');
    expect(m.length).toBe(WIDTH * HEIGHT);
    expect(countSet(m)).toBeGreaterThan(0);
  });

  it('acento muda o desenho (Ã é diferente de A)', () => {
    expect(mask('Ã')).not.toEqual(mask('A'));
  });

  it('cedilha muda o desenho (Ç é diferente de C)', () => {
    expect(mask('Ç')).not.toEqual(mask('C'));
  });

  it('caractere sem desenho não marca nenhuma célula', () => {
    expect(countSet(mask('Ж'))).toBe(0);
  });

  it('espaço não marca nenhuma célula', () => {
    expect(countSet(mask(' '))).toBe(0);
  });
});
