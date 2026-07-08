// Estado compartilhável via hash da URL. Chaves curtas para links menores.
export interface ShareState {
  pattern: string;
  speed: number;
  density: number;
  scale: number;
  width: number;
  height: number;
  characters: string;
  characterPreset: string;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  colorMode: 'mono' | 'gradient';
  colorA: string;
  colorB: string;
  textMode: boolean;
  textInput: string;
  textScale: number;
  textThickness: number;
}

type Compact = { [key: string]: string | number | boolean };

const KEYS: { [K in keyof ShareState]: string } = {
  pattern: 'p',
  speed: 'sp',
  density: 'd',
  scale: 'sc',
  width: 'w',
  height: 'h',
  characters: 'ch',
  characterPreset: 'cp',
  fontSize: 'fs',
  backgroundColor: 'bg',
  textColor: 'tc',
  colorMode: 'cm',
  colorA: 'c1',
  colorB: 'c2',
  textMode: 'tm',
  textInput: 'tx',
  textScale: 'ts',
  textThickness: 'tt',
};

export const encodeShareHash = (state: ShareState): string => {
  const compact: Compact = {};
  (Object.keys(KEYS) as (keyof ShareState)[]).forEach((key) => {
    compact[KEYS[key]] = state[key];
  });
  return '#' + encodeURIComponent(JSON.stringify(compact));
};

export const decodeShareHash = (hash: string): Partial<ShareState> | null => {
  if (!hash || hash.length < 2) return null;
  try {
    const compact = JSON.parse(decodeURIComponent(hash.slice(1))) as Compact;
    if (typeof compact !== 'object' || compact === null) return null;
    const state: Partial<ShareState> = {};
    (Object.keys(KEYS) as (keyof ShareState)[]).forEach((key) => {
      const value = compact[KEYS[key]];
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any)[key] = value;
      }
    });
    return state;
  } catch {
    return null;
  }
};
