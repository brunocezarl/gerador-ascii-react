// Menor fonte usada no encaixe. Abaixo disso a arte fica ilegível, então ela
// passa a rolar dentro do painel.
export const MIN_FONT_SIZE = 4;

interface FitInput {
  // Font Size escolhido no slider: o encaixe nunca passa deste valor
  requested: number;
  // Espaço disponível para a arte (o painel de visualização)
  available: { width: number; height: number };
  // Tamanho atual do elemento da arte, com padding, medido com a fonte `renderedFont`
  content: { width: number; height: number };
  // Padding do elemento. Fica em px fixos, então não entra na conta de crescimento da fonte
  padding: { x: number; y: number };
  renderedFont: number;
}

// Tamanho de fonte para a arte caber no painel. Só diminui: se a grade cabe,
// vale o Font Size escolhido.
export const fitFontSize = ({ requested, available, content, padding, renderedFont }: FitInput): number => {
  const textWidth = content.width - padding.x;
  const textHeight = content.height - padding.y;
  const unmeasured =
    textWidth <= 0 || textHeight <= 0 || renderedFont <= 0 ||
    available.width <= 0 || available.height <= 0;
  if (unmeasured) return requested;

  // O texto cresce na mesma proporção que a fonte, então basta o tamanho por px de fonte
  const widthPerPx = textWidth / renderedFont;
  const heightPerPx = textHeight / renderedFont;
  const maxFont = Math.min(
    (available.width - padding.x) / widthPerPx,
    (available.height - padding.y) / heightPerPx
  );
  // Arredonda para baixo (0,1px) para que a arte não estoure o painel por fração de pixel
  const fit = Math.floor(maxFont * 10) / 10;

  return Math.min(requested, Math.max(MIN_FONT_SIZE, fit));
};
