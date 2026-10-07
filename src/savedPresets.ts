// Presets salvos pelo usuário: nome -> query string (formato de settings.ts).
// Ficam só neste navegador, no localStorage.
export type SavedPresets = Record<string, string>;

export const MAX_PRESET_NAME = 40;

const STORAGE_KEY = 'gerador-ascii:presets';

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

// localStorage pode não existir ou estar bloqueado (modo privado, política do site)
export const browserStorage = (): KeyValueStorage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isStringRecord = (value: unknown): value is Record<string, string> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === 'string');

// Lê os presets. Dado corrompido ou storage indisponível vira "nenhum preset".
export const readSavedPresets = (storage: KeyValueStorage | null): SavedPresets => {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isStringRecord(parsed) ? { ...parsed } : {};
  } catch {
    return {};
  }
};

// Devolve false se não foi possível gravar (ex.: cota cheia)
export const writeSavedPresets = (storage: KeyValueStorage | null, presets: SavedPresets): boolean => {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(presets));
    return storage !== null;
  } catch {
    return false;
  }
};

// Nome limpo para usar como chave, ou '' se não sobrar nada
export const normalizePresetName = (name: string): string => name.trim().slice(0, MAX_PRESET_NAME);
