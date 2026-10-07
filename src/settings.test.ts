import { describe, it, expect } from 'vitest';
import { DEFAULTS, decodeSettings, encodeSettings, snapToRange, SLIDER, type Settings } from './settings';

const changed = (overrides: Partial<Settings>): Settings => ({ ...DEFAULTS, ...overrides });

describe('encodeSettings', () => {
  it('gera query vazia para a configuração padrão (link limpo)', () => {
    expect(encodeSettings(DEFAULTS)).toBe('');
  });

  it('inclui só o que difere do padrão', () => {
    const query = encodeSettings(changed({ pattern: 'golden_petals', speed: 7 }));
    const params = new URLSearchParams(query);
    expect(params.get('pattern')).toBe('golden_petals');
    expect(params.get('speed')).toBe('7');
    expect([...params.keys()]).toEqual(['pattern', 'speed']);
  });

  it('grava cores sem # e em minúsculas', () => {
    expect(new URLSearchParams(encodeSettings(changed({ backgroundColor: '#0b1020' }))).get('bg')).toBe('0b1020');
  });

  it('só inclui os caracteres personalizados quando o set é "custom"', () => {
    const notCustom = encodeSettings(changed({ customCharacters: 'XYZ' }));
    expect(notCustom).toBe('');
    const custom = encodeSettings(changed({ characterSet: 'custom', customCharacters: 'XYZ' }));
    expect(new URLSearchParams(custom).get('custom')).toBe('XYZ');
  });
});

describe('decodeSettings', () => {
  it('volta exatamente a configuração que foi codificada', () => {
    const original = changed({
      isAnimating: false,
      pattern: 'mavignier_lines',
      speed: 13,
      density: 1.5,
      scale: 0.75,
      width: 90,
      height: 40,
      fontSize: 16,
      characterSet: 'custom',
      customCharacters: '█#.',
      mouseInteraction: false,
      backgroundColor: '#1a1200',
      textColor: '#ffb000',
      textMode: true,
      textInput: 'AÇÃO',
      textScale: 10,
      textThickness: 5,
    });
    const decoded = decodeSettings(encodeSettings(original));
    expect({ ...DEFAULTS, ...decoded }).toEqual(original);
  });

  it('aceita a query com ou sem "?"', () => {
    expect(decodeSettings('?speed=9')).toEqual({ speed: 9 });
    expect(decodeSettings('speed=9')).toEqual({ speed: 9 });
  });

  it('limita números ao intervalo do slider e ao passo', () => {
    expect(decodeSettings('speed=99').speed).toBe(SLIDER.speed.max);
    expect(decodeSettings('speed=-4').speed).toBe(SLIDER.speed.min);
    expect(decodeSettings('density=0.33').density).toBe(0.3);
  });

  it('ignora valores inválidos e mantém os demais', () => {
    const decoded = decodeSettings('pattern=nao_existe&speed=abc&bg=zzzzzz&fg=ff0000&textmode=1');
    expect(decoded.pattern).toBeUndefined();
    expect(decoded.speed).toBeUndefined();
    expect(decoded.backgroundColor).toBeUndefined();
    expect(decoded.textColor).toBe('#ff0000');
    expect(decoded.textMode).toBe(true);
  });

  it('ignora parâmetros que não existem', () => {
    expect(decodeSettings('foo=bar&speed=3')).toEqual({ speed: 3 });
  });

  it('não aceita set de caracteres desconhecido', () => {
    expect(decodeSettings('chars=emoji').characterSet).toBeUndefined();
    expect(decodeSettings('chars=custom').characterSet).toBe('custom');
  });

  it('põe o texto do Text Mode em maiúsculas e limita o tamanho', () => {
    expect(decodeSettings('text=oi').textInput).toBe('OI');
    expect(decodeSettings(`text=${'a'.repeat(100)}`).textInput).toHaveLength(40);
  });
});

describe('snapToRange', () => {
  it('leva o valor para o passo mais próximo dentro do intervalo', () => {
    expect(snapToRange(0.26, SLIDER.density)).toBe(0.3);
    expect(snapToRange(5, SLIDER.speed)).toBe(5);
    expect(snapToRange(0, SLIDER.speed)).toBe(SLIDER.speed.min);
  });
});
