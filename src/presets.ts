// Presets de caracteres
export const characterPresets = {
  blocks: '█▓▒░·',
  dots: '●○◐◑◒◓',
  circles: '●◉○◎◌·',
  squares: '■▪▫◼◻▢',
  lines: '║│┃┆┇┊',
  gradients: '██▓▒░ ',
  minimal: '█░ ',
  ascii: '@#*+=:-.',
  braille: '⣿⣾⣽⣻⣟⣯⣷⣶',
  geometric: '▲△▼▽◆◇',
} satisfies Record<string, string>;

export type CharacterPresetName = keyof typeof characterPresets;

// 'custom' usa o texto digitado pelo usuário
export type CharacterSetName = CharacterPresetName | 'custom';

// Valores iniciais. Reset volta para eles.
export const DEFAULTS = {
  speed: 5,
  density: 0.3,
  scale: 0.2,
  width: 60,
  height: 30,
  characterPreset: 'blocks' as CharacterPresetName,
  fontSize: 12,
  backgroundColor: '#F0EEE6',
  textColor: '#333333',
  textInput: 'HELLO',
  textMode: false,
  textScale: 8,
  textThickness: 3,
};
