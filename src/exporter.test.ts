import { describe, it, expect } from 'vitest';
import { buildSvg, gridSize, toLines } from './exporter';

const style = { fontSize: 10, background: '#f0eee6', color: '#333333' };

describe('toLines', () => {
  it('remove só a quebra de linha final', () => {
    expect(toLines('ab\ncd\n')).toEqual(['ab', 'cd']);
  });
});

describe('gridSize', () => {
  it('calcula largura e altura a partir de colunas, linhas e fonte', () => {
    // 10 colunas de 10 * (0.6 + 0.05) = 6.5 px, mais 20 px de padding de cada lado
    expect(gridSize(['0123456789', '0123456789'], 10)).toEqual({ width: 40 + 65, height: 40 + 20 });
  });

  it('conta caractere e não unidade de código (emoji ocupa uma coluna)', () => {
    expect(gridSize(['😀😀😀'], 10).width).toBe(gridSize(['abc'], 10).width);
  });
});

describe('buildSvg', () => {
  it('gera um SVG com o tamanho da grade e as cores escolhidas', () => {
    const svg = buildSvg(['AB'], style);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain(`width="${gridSize(['AB'], 10).width}"`);
    expect(svg).toContain('fill="#f0eee6"');
    expect(svg).toContain('fill="#333333"');
  });

  it('põe uma linha de texto por linha da arte, na ordem', () => {
    const svg = buildSvg(['AAA', 'BBB', 'CCC'], style);
    expect(svg.match(/<text /g)).toHaveLength(3);
    expect(svg.indexOf('>AAA<')).toBeLessThan(svg.indexOf('>BBB<'));
    expect(svg.indexOf('>BBB<')).toBeLessThan(svg.indexOf('>CCC<'));
  });

  it('escapa caracteres especiais para o XML continuar válido', () => {
    const svg = buildSvg(['<&>'], style);
    expect(svg).toContain('&lt;&amp;&gt;');
    expect(svg).not.toContain('<&>');
  });

  it('mantém os espaços da arte (xml:space)', () => {
    expect(buildSvg(['A B'], style)).toContain('xml:space="preserve"');
  });
});
