import { describe, it, expect } from 'vitest';
import { MAX_PRESET_NAME, normalizePresetName, readSavedPresets, writeSavedPresets } from './savedPresets';

// Storage em memória com a mesma interface usada pelo localStorage
const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    data,
  };
};

describe('savedPresets', () => {
  it('grava e lê os presets de volta', () => {
    const storage = memoryStorage();
    expect(writeSavedPresets(storage, { 'Meu look': 'speed=7' })).toBe(true);
    expect(readSavedPresets(storage)).toEqual({ 'Meu look': 'speed=7' });
  });

  it('começa vazio quando não há nada salvo', () => {
    expect(readSavedPresets(memoryStorage())).toEqual({});
  });

  it('trata JSON corrompido como nenhum preset', () => {
    expect(readSavedPresets(memoryStorage({ 'gerador-ascii:presets': '{ isso não é json' }))).toEqual({});
  });

  it('descarta dados com formato inesperado', () => {
    expect(readSavedPresets(memoryStorage({ 'gerador-ascii:presets': '["lista"]' }))).toEqual({});
    expect(readSavedPresets(memoryStorage({ 'gerador-ascii:presets': '{"a": 1}' }))).toEqual({});
  });

  it('sem storage (bloqueado pelo navegador) não quebra e não grava', () => {
    expect(readSavedPresets(null)).toEqual({});
    expect(writeSavedPresets(null, { a: 'speed=2' })).toBe(false);
  });

  it('informa falha quando o storage recusa a gravação (ex.: cota cheia)', () => {
    const full = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
    };
    expect(writeSavedPresets(full, { a: 'speed=2' })).toBe(false);
  });
});

describe('normalizePresetName', () => {
  it('remove espaços e limita o tamanho', () => {
    expect(normalizePresetName('  Noite  ')).toBe('Noite');
    expect(normalizePresetName('x'.repeat(100))).toHaveLength(MAX_PRESET_NAME);
  });

  it('devolve vazio para nome só com espaços', () => {
    expect(normalizePresetName('   ')).toBe('');
  });
});
