// Galeria de presets do usuário, persistida em localStorage.
import type { ShareState } from './urlState';

export interface SavedPreset {
  id: string;
  name: string;
  thumb: string; // data URL de um PNG pequeno
  state: ShareState;
  createdAt: number;
}

const STORAGE_KEY = 'ascii-studio-presets';
export const MAX_PRESETS = 24;

export const loadPresets = (): SavedPreset[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(
      (p): p is SavedPreset =>
        p && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.state === 'object'
    );
  } catch {
    return [];
  }
};

export const persistPresets = (list: SavedPreset[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_PRESETS)));
    return true;
  } catch {
    // localStorage cheio ou indisponível
    return false;
  }
};
