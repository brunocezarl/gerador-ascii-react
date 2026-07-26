import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STATE,
  sanitizeShareState,
  encodeShareHash,
  decodeShareHash,
} from './urlState';

describe('sanitizeShareState', () => {
  it('devolve exatamente os defaults para entrada vazia', () => {
    expect(sanitizeShareState({})).toEqual(DEFAULT_STATE);
  });

  it('mantém valores válidos', () => {
    const state = sanitizeShareState({
      pattern: 'mandala',
      patternB: 'plasma',
      patternMix: 0.4,
      width: 100,
      colorMode: 'gradient',
      colorA: '#FF00AA',
      textMode: true,
    });
    expect(state.pattern).toBe('mandala');
    expect(state.patternB).toBe('plasma');
    expect(state.patternMix).toBe(0.4);
    expect(state.width).toBe(100);
    expect(state.colorMode).toBe('gradient');
    expect(state.colorA).toBe('#FF00AA');
    expect(state.textMode).toBe(true);
  });

  it('clampa números fora do intervalo', () => {
    const state = sanitizeShareState({ width: 99999, height: -5, speed: 1000, patternMix: 7 });
    expect(state.width).toBe(160);
    expect(state.height).toBe(10);
    expect(state.speed).toBe(20);
    expect(state.patternMix).toBe(1);
  });

  it('rejeita números inválidos', () => {
    const state = sanitizeShareState({
      width: NaN,
      scale: 'abc' as unknown as number,
      density: Infinity,
    });
    expect(state.width).toBe(DEFAULT_STATE.width);
    expect(state.scale).toBe(DEFAULT_STATE.scale);
    expect(state.density).toBe(DEFAULT_STATE.density);
  });

  it('rejeita patterns desconhecidos e chaves de protótipo', () => {
    expect(sanitizeShareState({ pattern: 'nope' }).pattern).toBe(DEFAULT_STATE.pattern);
    expect(sanitizeShareState({ pattern: '__proto__' }).pattern).toBe(DEFAULT_STATE.pattern);
    expect(sanitizeShareState({ pattern: 'constructor' }).pattern).toBe(DEFAULT_STATE.pattern);
    expect(sanitizeShareState({ patternB: '__proto__' }).patternB).toBe('none');
    expect(sanitizeShareState({ characterPreset: '__proto__' }).characterPreset).toBe('custom');
  });

  it('só aceita cores hex', () => {
    expect(sanitizeShareState({ textColor: '#abc' }).textColor).toBe('#abc');
    expect(sanitizeShareState({ textColor: '#AABBCC' }).textColor).toBe('#AABBCC');
    expect(sanitizeShareState({ textColor: 'red' }).textColor).toBe(DEFAULT_STATE.textColor);
    expect(
      sanitizeShareState({ textColor: '#fff"/><script>alert(1)</script>' }).textColor
    ).toBe(DEFAULT_STATE.textColor);
  });

  it('trunca strings longas', () => {
    expect(sanitizeShareState({ characters: 'x'.repeat(1000) }).characters).toHaveLength(32);
    expect(sanitizeShareState({ textInput: 'x'.repeat(1000) }).textInput).toHaveLength(40);
  });
});

describe('encodeShareHash / decodeShareHash', () => {
  it('faz round-trip sem perder estado', () => {
    const state = sanitizeShareState({
      pattern: 'golden_petals',
      patternB: 'waves',
      patternMix: 0.65,
      colorMode: 'gradient',
      characters: '⣿⣾⣽',
      textMode: true,
      textInput: 'OI',
    });
    const decoded = decodeShareHash(encodeShareHash(state));
    expect(decoded).not.toBeNull();
    expect(sanitizeShareState(decoded!)).toEqual(state);
  });

  it('devolve null para hash vazio ou lixo', () => {
    expect(decodeShareHash('')).toBeNull();
    expect(decodeShareHash('#')).toBeNull();
    expect(decodeShareHash('#nao-e-json')).toBeNull();
    expect(decodeShareHash('#%7B')).toBeNull();
    expect(decodeShareHash('#"apenas-string"')).toBeNull();
  });
});
