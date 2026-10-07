import { strokeFont } from './strokeFont';

// Largura visual de uma célula em relação à sua altura (fonte monoespaçada)
export const CELL_ASPECT = 0.6;

// Acentos, desenhados na parte de cima da célula. Usam o mesmo formato da fonte.
// A cedilha fica abaixo da linha de base.
const diacriticStrokes: Record<string, number[][]> = {
  '́': [[0.45, 0.2, 0.7, 0.02]], // agudo
  '̀': [[0.3, 0.02, 0.55, 0.2]], // grave
  '̂': [[0.3, 0.2, 0.5, 0.02], [0.5, 0.02, 0.7, 0.2]], // circunflexo
  '̃': [[0.25, 0.15, 0.4, 0.05], [0.4, 0.05, 0.55, 0.15], [0.55, 0.15, 0.7, 0.05]], // til
  '̈': [[0.3, 0.12, 0.3, 0.12], [0.7, 0.12, 0.7, 0.12]], // trema
  '̧': [[0.5, 1, 0.5, 1.15], [0.5, 1.15, 0.3, 1.15]], // cedilha
};

// Quando a letra tem acento, ela ocupa só a parte de baixo da célula
const BASE_TOP = 0.3;

// Separa um caractere em letra base + acentos ("Ã" vira "A" + til).
// Devolve null se a letra ou algum acento não tiver desenho.
const getGlyphParts = (ch: string): { base: number[][]; marks: number[][][] } | null => {
  const [base, ...markChars] = Array.from(ch.normalize('NFD'));
  const baseStrokes = strokeFont[base];
  if (!baseStrokes) return null;

  const marks = markChars.map((mark) => diacriticStrokes[mark]);
  if (marks.some((strokes) => !strokes)) return null;

  return { base: baseStrokes, marks };
};

// Caracteres do texto que não têm desenho e serão ignorados (sem repetição)
export const findUnsupportedChars = (text: string): string[] => {
  const missing = new Set<string>();
  for (const ch of Array.from(text.toUpperCase())) {
    if (!getGlyphParts(ch)) missing.add(ch);
  }
  return [...missing];
};

// Distância de um ponto a um segmento de reta
const segmentDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const ex = px - (x1 + t * dx);
  const ey = py - (y1 + t * dy);
  return Math.sqrt(ex * ex + ey * ey);
};

// Gera a máscara do texto: 1 onde a célula faz parte de um traço, 0 fora.
// As distâncias são calculadas em "espaço visual" (x comprimido pelo aspecto
// da célula) para que os traços tenham espessura uniforme na tela.
export const buildTextMask = (
  text: string,
  textScale: number,
  textThickness: number,
  width: number,
  height: number
): Uint8Array => {
  const mask = new Uint8Array(width * height);
  const chars = Array.from(text.toUpperCase());
  let glyphH = textScale;
  let glyphW = (textScale * 0.6) / CELL_ASPECT;
  let gap = glyphW * 0.5;
  let totalW = chars.length * glyphW + Math.max(0, chars.length - 1) * gap;

  // Encolher o texto proporcionalmente se não couber na grade
  const maxW = width * 0.95;
  if (totalW > maxW) {
    const shrink = maxW / totalW;
    glyphH *= shrink;
    glyphW *= shrink;
    gap *= shrink;
    totalW = maxW;
  }

  const startX = (width - totalW) / 2;
  const startY = (height - glyphH) / 2;
  // O raio é limitado pelo tamanho do glifo para o traço não virar um borrão
  const radius = Math.min(textThickness * 0.3, glyphH * 0.25);

  // Converter os glifos em segmentos absolutos no espaço visual
  const segments: number[][] = [];
  chars.forEach((ch, i) => {
    const parts = getGlyphParts(ch);
    if (!parts) return;
    const ox = startX + i * (glyphW + gap);
    const top = parts.marks.length > 0 ? BASE_TOP : 0;

    const place = (strokes: number[][], yTop: number, yScale: number) => {
      for (const [x1, y1, x2, y2] of strokes) {
        segments.push([
          (ox + x1 * glyphW) * CELL_ASPECT, startY + (yTop + y1 * yScale) * glyphH,
          (ox + x2 * glyphW) * CELL_ASPECT, startY + (yTop + y2 * yScale) * glyphH,
        ]);
      }
    };

    place(parts.base, top, 1 - top);
    for (const mark of parts.marks) place(mark, 0, 1);
  });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (const [x1, y1, x2, y2] of segments) {
        if (segmentDistance(x * CELL_ASPECT, y, x1, y1, x2, y2) <= radius) {
          mask[y * width + x] = 1;
          break;
        }
      }
    }
  }

  return mask;
};
