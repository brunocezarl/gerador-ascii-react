export interface Padding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Posição do ponteiro na grade. Colunas e linhas, com o centro da célula (c, r)
// em (c + 0.5, r + 0.5). `aspect` é a proporção de uma célula na tela (largura / altura).
export interface GridPointer {
  x: number;
  y: number;
  aspect: number;
}

export const paddingOf = (style: Pick<CSSStyleDeclaration, 'paddingLeft' | 'paddingRight' | 'paddingTop' | 'paddingBottom'>): Padding => ({
  left: parseFloat(style.paddingLeft),
  right: parseFloat(style.paddingRight),
  top: parseFloat(style.paddingTop),
  bottom: parseFloat(style.paddingBottom),
});

// Converte a posição do ponteiro na tela para colunas e linhas da grade.
// O `box` é o retângulo do elemento, que inclui o padding. O padding não é texto,
// então fica de fora da conta. Ponteiro sobre o padding dá valores negativos ou acima de cols/rows.
export const pointerToGrid = (
  clientX: number,
  clientY: number,
  box: Box,
  padding: Padding,
  cols: number,
  rows: number
): GridPointer | null => {
  const contentWidth = box.width - padding.left - padding.right;
  const contentHeight = box.height - padding.top - padding.bottom;
  if (contentWidth <= 0 || contentHeight <= 0 || cols <= 0 || rows <= 0) return null;

  // Cada coluna e cada linha ocupam a mesma medida na tela, então basta dividir o conteúdo
  const cellWidth = contentWidth / cols;
  const cellHeight = contentHeight / rows;
  return {
    x: (clientX - box.left - padding.left) / cellWidth,
    y: (clientY - box.top - padding.top) / cellHeight,
    aspect: cellWidth / cellHeight,
  };
};
