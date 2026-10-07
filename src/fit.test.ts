import { describe, it, expect } from 'vitest';
import { fitFontSize, MIN_FONT_SIZE } from './fit';

// Texto de 100 x 50 px com fonte de 10 px: 10 px de largura e 5 px de altura por unidade de fonte
const text = { width: 100, height: 50 };
const noPadding = { x: 0, y: 0 };

const fit = (overrides: Partial<Parameters<typeof fitFontSize>[0]> = {}) =>
  fitFontSize({
    requested: 24,
    available: { width: 500, height: 500 },
    content: text,
    padding: noPadding,
    renderedFont: 10,
    ...overrides,
  });

describe('fitFontSize', () => {
  it('mantém o Font Size escolhido quando a grade cabe', () => {
    expect(fit({ requested: 12 })).toBe(12);
  });

  it('diminui a fonte quando a largura não cabe', () => {
    // Largura: 200 px / 10 px por unidade = 20. Altura: 500 / 5 = 100. Vale 20.
    expect(fit({ available: { width: 200, height: 500 } })).toBe(20);
  });

  it('diminui a fonte quando a altura não cabe', () => {
    // Altura: 60 px / 5 px por unidade = 12. Largura: 1000 / 10 = 100. Vale 12.
    expect(fit({ available: { width: 1000, height: 60 } })).toBe(12);
  });

  it('desconta o padding do elemento, que não cresce com a fonte', () => {
    // Elemento de 140 x 70 com padding de 40 x 20: o texto tem 100 x 50, como antes.
    // Painel de 240 px: sobram 200 px para o texto, então 200 / 10 = 20.
    const size = fit({
      content: { width: 140, height: 70 },
      padding: { x: 40, y: 20 },
      available: { width: 240, height: 500 },
    });
    expect(size).toBe(20);
  });

  it('não depende da fonte com que a arte foi medida', () => {
    const fromTen = fit({ available: { width: 200, height: 500 } });
    const fromTwenty = fit({
      available: { width: 200, height: 500 },
      content: { width: 200, height: 100 },
      renderedFont: 20,
    });
    expect(fromTwenty).toBe(fromTen);
  });

  it('nunca fica abaixo do mínimo, mesmo quando não cabe', () => {
    expect(fit({ available: { width: 1, height: 1 } })).toBe(MIN_FONT_SIZE);
  });

  it('arredonda para baixo, para não estourar o painel por fração de pixel', () => {
    // 205.7 px / 10 px por unidade = 20.57 -> 20.5, nunca 20.6
    expect(fit({ available: { width: 205.7, height: 500 } })).toBe(20.5);
  });

  it('volta ao Font Size quando ainda não há medida (arte vazia ou painel oculto)', () => {
    expect(fit({ requested: 12, available: { width: 0, height: 0 } })).toBe(12);
    expect(fit({ requested: 12, content: { width: 0, height: 0 } })).toBe(12);
  });
});
