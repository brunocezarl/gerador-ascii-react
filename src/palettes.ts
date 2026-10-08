export interface Palette {
  id: string;
  label: string;
  background: string;
  text: string;
}

// Pares de fundo e texto em minúsculas. Todos têm contraste suficiente para ler a arte.
export const palettes: Palette[] = [
  { id: 'paper', label: 'Paper', background: '#f0eee6', text: '#333333' },
  { id: 'graphite', label: 'Graphite', background: '#1e1e1e', text: '#e6e6e6' },
  { id: 'night', label: 'Night', background: '#0b1020', text: '#7dd3fc' },
  { id: 'terminal', label: 'Terminal', background: '#0a0f0a', text: '#33ff66' },
  { id: 'amber', label: 'Amber', background: '#1a1200', text: '#ffb000' },
  { id: 'neon', label: 'Neon', background: '#0d0221', text: '#ff2e88' },
  { id: 'sepia', label: 'Sepia', background: '#f4e9d8', text: '#5b3f24' },
  { id: 'forest', label: 'Forest', background: '#e7f0e3', text: '#2f5233' },
  { id: 'cyanotype', label: 'Cyanotype', background: '#1f3a5f', text: '#f4f7fb' },
];

// Id da paleta que bate com essas cores, ou 'custom' se nenhuma bater
export const findPaletteId = (background: string, text: string): string => {
  const bg = background.toLowerCase();
  const fg = text.toLowerCase();
  return palettes.find((p) => p.background === bg && p.text === fg)?.id ?? 'custom';
};
