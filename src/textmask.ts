// Fonte vetorial para o Text Mode: cada glifo é uma lista de segmentos
// [x1, y1, x2, y2] em coordenadas normalizadas (0..1, eixo y para baixo)
const strokeFont: { [key: string]: number[][] } = {
  A: [[0, 1, 0.5, 0], [0.5, 0, 1, 1], [0.2, 0.6, 0.8, 0.6]],
  B: [[0, 0, 0, 1], [0, 0, 0.8, 0], [0.8, 0, 0.8, 0.5], [0, 0.5, 0.8, 0.5], [0.8, 0.5, 0.8, 1], [0, 1, 0.8, 1]],
  C: [[1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 1, 1]],
  D: [[0, 0, 0, 1], [0, 0, 0.7, 0.15], [0.7, 0.15, 0.7, 0.85], [0.7, 0.85, 0, 1]],
  E: [[0, 0, 0, 1], [0, 0, 1, 0], [0, 0.5, 0.7, 0.5], [0, 1, 1, 1]],
  F: [[0, 0, 0, 1], [0, 0, 1, 0], [0, 0.5, 0.7, 0.5]],
  G: [[1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0.5], [1, 0.5, 0.5, 0.5]],
  H: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0.5, 1, 0.5]],
  I: [[0.5, 0, 0.5, 1], [0.2, 0, 0.8, 0], [0.2, 1, 0.8, 1]],
  J: [[1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0.7]],
  K: [[0, 0, 0, 1], [1, 0, 0, 0.5], [0, 0.5, 1, 1]],
  L: [[0, 0, 0, 1], [0, 1, 1, 1]],
  M: [[0, 1, 0, 0], [0, 0, 0.5, 0.5], [0.5, 0.5, 1, 0], [1, 0, 1, 1]],
  N: [[0, 1, 0, 0], [0, 0, 1, 1], [1, 1, 1, 0]],
  O: [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]],
  P: [[0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 1, 0.5], [1, 0.5, 0, 0.5]],
  Q: [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0], [0.6, 0.6, 1, 1]],
  R: [[0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 1, 0.5], [1, 0.5, 0, 0.5], [0.3, 0.5, 1, 1]],
  S: [[1, 0, 0, 0], [0, 0, 0, 0.5], [0, 0.5, 1, 0.5], [1, 0.5, 1, 1], [1, 1, 0, 1]],
  T: [[0, 0, 1, 0], [0.5, 0, 0.5, 1]],
  U: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0]],
  V: [[0, 0, 0.5, 1], [0.5, 1, 1, 0]],
  W: [[0, 0, 0.25, 1], [0.25, 1, 0.5, 0.4], [0.5, 0.4, 0.75, 1], [0.75, 1, 1, 0]],
  X: [[0, 0, 1, 1], [1, 0, 0, 1]],
  Y: [[0, 0, 0.5, 0.5], [1, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 1]],
  Z: [[0, 0, 1, 0], [1, 0, 0, 1], [0, 1, 1, 1]],
  '0': [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0], [1, 0, 0, 1]],
  '1': [[0.5, 0, 0.5, 1], [0.2, 0.2, 0.5, 0], [0.3, 1, 0.7, 1]],
  '2': [[0, 0, 1, 0], [1, 0, 1, 0.5], [1, 0.5, 0, 1], [0, 1, 1, 1]],
  '3': [[0, 0, 1, 0], [1, 0, 1, 1], [0, 1, 1, 1], [0.3, 0.5, 1, 0.5]],
  '4': [[0, 0, 0, 0.5], [0, 0.5, 1, 0.5], [1, 0, 1, 1]],
  '5': [[1, 0, 0, 0], [0, 0, 0, 0.5], [0, 0.5, 1, 0.5], [1, 0.5, 1, 1], [1, 1, 0, 1]],
  '6': [[1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0.5], [1, 0.5, 0, 0.5]],
  '7': [[0, 0, 1, 0], [1, 0, 0.4, 1]],
  '8': [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0], [0, 0.5, 1, 0.5]],
  '9': [[0, 0, 1, 0], [0, 0, 0, 0.5], [0, 0.5, 1, 0.5], [1, 0, 1, 1], [1, 1, 0, 1]],
  ' ': [],
  '.': [[0.5, 0.85, 0.5, 1]],
  '-': [[0.2, 0.5, 0.8, 0.5]],
  '!': [[0.5, 0, 0.5, 0.6], [0.5, 0.85, 0.5, 1]],
  '?': [[0, 0.15, 0, 0], [0, 0, 1, 0], [1, 0, 1, 0.4], [1, 0.4, 0.5, 0.55], [0.5, 0.55, 0.5, 0.7], [0.5, 0.9, 0.5, 1]],
};

// Largura visual de uma célula em relação à sua altura (fonte monoespaçada)
export const CELL_ASPECT = 0.6;

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
  const chars = text.split('');
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
    const glyph = strokeFont[ch];
    if (!glyph) return;
    const ox = startX + i * (glyphW + gap);
    for (const [x1, y1, x2, y2] of glyph) {
      segments.push([
        (ox + x1 * glyphW) * CELL_ASPECT, startY + y1 * glyphH,
        (ox + x2 * glyphW) * CELL_ASPECT, startY + y2 * glyphH,
      ]);
    }
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
