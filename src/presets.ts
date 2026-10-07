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
