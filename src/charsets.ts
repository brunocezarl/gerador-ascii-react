// Presets de caracteres, ordenados do mais denso para o mais leve.
export const characterPresets: { [key: string]: string } = {
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
};

export const characterPresetNames = Object.keys(characterPresets);
