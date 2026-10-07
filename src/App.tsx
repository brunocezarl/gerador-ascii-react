import { useState, useEffect, useMemo, useRef, type PointerEvent } from 'react';
import './App.css';
import Slider from './components/Slider';
import { advanceTime, toPatternTime } from './animation';
import { fitFontSize, MIN_FONT_SIZE } from './fit';
import { patterns, type PatternName } from './patterns';
import { characterPresets, DEFAULTS, type CharacterSetName } from './presets';
import { renderAscii } from './renderAscii';
import { buildTextMask, findUnsupportedChars } from './textMask';

// Quantas vezes o encaixe pode descer 0,1px até a arte real caber
const MAX_FIT_ATTEMPTS = 10;

const PatternGenerator = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentPattern, setCurrentPattern] = useState<PatternName>('waves');
  const [speed, setSpeed] = useState(DEFAULTS.speed);
  const [density, setDensity] = useState(DEFAULTS.density);
  const [scale, setScale] = useState(DEFAULTS.scale);
  const [width, setWidth] = useState(DEFAULTS.width);
  const [height, setHeight] = useState(DEFAULTS.height);
  const [characterPreset, setCharacterPreset] = useState<CharacterSetName>(DEFAULTS.characterPreset);
  const [customCharacters, setCustomCharacters] = useState<string>(characterPresets[DEFAULTS.characterPreset]);
  const [mouseInteraction, setMouseInteraction] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULTS.backgroundColor);
  const [textColor, setTextColor] = useState(DEFAULTS.textColor);
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize);
  // Fonte realmente usada na arte: igual ao Font Size, ou menor se a grade não couber no painel
  const [fittedFont, setFittedFont] = useState(DEFAULTS.fontSize);
  const [textInput, setTextInput] = useState(DEFAULTS.textInput);
  const [textMode, setTextMode] = useState(DEFAULTS.textMode);
  const [textScale, setTextScale] = useState(DEFAULTS.textScale);
  const [textThickness, setTextThickness] = useState(DEFAULTS.textThickness);
  const [notice, setNotice] = useState<{ message: string } | null>(null);

  // O set de caracteres é derivado: o preset escolhido ou o texto personalizado
  const characters = characterPreset === 'custom' ? customCharacters : characterPresets[characterPreset];

  // Tempo da animação (segundos) e ponteiro ficam em refs para não re-renderizar o React a cada quadro
  const timeRef = useRef(0);
  const containerRef = useRef<HTMLPreElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, down: false });
  const renderFrameRef = useRef<(() => void) | null>(null);

  // A máscara do texto só é recalculada quando os parâmetros do texto mudam
  const textMask = useMemo(
    () => (textMode ? buildTextMask(textInput, textScale, textThickness, width, height) : null),
    [textMode, textInput, textScale, textThickness, width, height]
  );
  const unsupportedChars = useMemo(
    () => (textMode ? findUnsupportedChars(textInput) : []),
    [textMode, textInput]
  );

  // Mensagens de Copy somem sozinhas depois de um tempo
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    const renderFrame = () => {
      const el = containerRef.current;
      if (!el) return;

      // O rect é consultado uma vez por frame, fora do loop de células
      let pointer: { x: number; y: number } | null = null;
      if (mouseInteraction && pointerRef.current.down) {
        const rect = el.getBoundingClientRect();
        pointer = {
          x: ((pointerRef.current.x - rect.left) / rect.width) * width,
          y: ((pointerRef.current.y - rect.top) / rect.height) * height,
        };
      }

      // Escreve direto no DOM, sem passar pelo render do React
      el.textContent = renderAscii(toPatternTime(timeRef.current), {
        patternName: currentPattern,
        scale, speed, width, height, density, characters,
        textMask, mouse: pointer,
      });
    };

    renderFrameRef.current = renderFrame;
    renderFrame();

    if (!isAnimating) return;

    let rafId: number;
    let last = performance.now();
    const loop = (now: number) => {
      timeRef.current = advanceTime(timeRef.current, now - last);
      last = now;
      renderFrame();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [isAnimating, currentPattern, scale, speed, width, height, density, characters, mouseInteraction, textMask]);

  // Encaixe: se a arte não cabe no painel, a fonte diminui (nunca passa do Font Size).
  // Vem depois do efeito da animação, que já escreveu a grade nova no DOM.
  useEffect(() => {
    const panel = panelRef.current;
    const el = containerRef.current;
    if (!panel || !el) return;

    const fit = () => {
      const style = getComputedStyle(el);
      let size = fitFontSize({
        requested: fontSize,
        available: { width: panel.clientWidth, height: panel.clientHeight },
        content: { width: el.offsetWidth, height: el.offsetHeight },
        padding: {
          x: parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
          y: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
        },
        renderedFont: parseFloat(style.fontSize),
      });
      // A conta acima é uma proporção, e o texto não escala exatamente assim em tamanhos
      // pequenos (arredondamento dos glifos). Por isso confere com a arte real e desce 0,1px
      // até caber. Escreve direto no estilo para a medida ser da fonte testada.
      for (let attempt = 0; attempt < MAX_FIT_ATTEMPTS && size > MIN_FONT_SIZE; attempt++) {
        el.style.fontSize = `${size}px`;
        if (el.offsetWidth <= panel.clientWidth && el.offsetHeight <= panel.clientHeight) break;
        size = Math.max(MIN_FONT_SIZE, Math.floor((size - 0.1) * 10) / 10);
      }
      el.style.fontSize = `${size}px`;
      setFittedFont(size);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [fontSize, width, height, characters]);

  // Quadro atual sem o efeito do ponteiro (usado por Copy e Export)
  const snapshot = () => renderAscii(toPatternTime(timeRef.current), {
    patternName: currentPattern,
    scale, speed, width, height, density, characters,
    textMask, mouse: null,
  });

  const exportPattern = () => {
    const blob = new Blob([snapshot()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pattern-${currentPattern}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(snapshot());
      setNotice({ message: 'Pattern copiado para a área de transferência!' });
    } catch {
      // Sem contexto seguro (ex.: HTTP) o navegador bloqueia a área de transferência
      setNotice({ message: 'Não foi possível copiar. Use Export para salvar o arquivo.' });
    }
  };

  const resetSettings = () => {
    setSpeed(DEFAULTS.speed);
    setDensity(DEFAULTS.density);
    setScale(DEFAULTS.scale);
    setWidth(DEFAULTS.width);
    setHeight(DEFAULTS.height);
    setCharacterPreset(DEFAULTS.characterPreset);
    setCustomCharacters(characterPresets[DEFAULTS.characterPreset]);
    setBackgroundColor(DEFAULTS.backgroundColor);
    setTextColor(DEFAULTS.textColor);
    setFontSize(DEFAULTS.fontSize);
    setTextInput(DEFAULTS.textInput);
    setTextMode(DEFAULTS.textMode);
    setTextScale(DEFAULTS.textScale);
    setTextThickness(DEFAULTS.textThickness);
  };

  // Mouse e toque usam o mesmo evento: com pointer events, arrastar o dedo na arte também funciona
  const handlePointerMove = (e: PointerEvent<HTMLPreElement>) => {
    pointerRef.current.x = e.clientX;
    pointerRef.current.y = e.clientY;
    if (!isAnimating && pointerRef.current.down) {
      renderFrameRef.current?.();
    }
  };

  const setPointerDown = (down: boolean) => {
    pointerRef.current.down = down;
    if (!isAnimating) {
      renderFrameRef.current?.();
    }
  };

  return (
    <div className="app-container">
      {/* Painel de Controle */}
      <div className="controls-panel">
        <div className="control-group">
          <h3>/EFFECTS</h3>
          <ul className="pattern-list">
            {(Object.keys(patterns) as PatternName[]).map(name => {
              const active = currentPattern === name;
              return (
                <li key={name} className="pattern-list-item">
                  <button
                    type="button"
                    className={`pattern-button${active ? ' active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setCurrentPattern(name)}
                  >
                    [{active ? '*' : ' '}] {name.toUpperCase()}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="control-group">
          <Slider label="Speed" value={speed} min={1} max={20} onChange={setSpeed} />
        </div>

        <div className="control-group">
          <Slider
            label="Density" value={density} min={0.1} max={2} step={0.1}
            display={density.toFixed(2)} onChange={setDensity}
          />
        </div>

        <div className="control-group">
          <Slider
            label="Scale" value={scale} min={0.05} max={1} step={0.05}
            display={scale.toFixed(2)} onChange={setScale}
          />
        </div>

        <div className="control-group">
          <Slider label="Width" value={width} min={20} max={120} onChange={setWidth} />
        </div>

        <div className="control-group">
          <Slider label="Height" value={height} min={10} max={60} onChange={setHeight} />
        </div>

        <div className="control-group">
          <Slider
            label="Font Size" value={fontSize} min={8} max={24}
            display={fittedFont < fontSize ? `${fittedFont.toFixed(1)} (ajustado)` : undefined}
            onChange={setFontSize}
          />
        </div>

        <div className="control-group character-set-group">
          <label htmlFor="character-set">Character Set:</label>
          <select
            id="character-set"
            value={characterPreset}
            className="select-field"
            onChange={(e) => {
              const next = e.target.value as CharacterSetName;
              // Ao personalizar, o ponto de partida é o set que está em uso
              if (next === 'custom') setCustomCharacters(characters);
              setCharacterPreset(next);
            }}
          >
            <option value="blocks">Blocks</option>
            <option value="dots">Dots</option>
            <option value="circles">Circles</option>
            <option value="squares">Squares</option>
            <option value="lines">Lines</option>
            <option value="gradients">Gradients</option>
            <option value="minimal">Minimal</option>
            <option value="ascii">ASCII</option>
            <option value="braille">Braille</option>
            <option value="geometric">Geometric</option>
            <option value="custom">Custom</option>
          </select>
          <input
            type="text"
            aria-label="Caracteres personalizados"
            value={characters}
            className="input-field"
            onChange={(e) => {
              setCustomCharacters(e.target.value);
              setCharacterPreset('custom');
            }}
            disabled={characterPreset !== 'custom'}
          />
        </div>

        <div className="control-group">
          <label className="checkbox-control">
            <input type="checkbox" checked={textMode} onChange={(e) => setTextMode(e.target.checked)} />
            Text Mode
          </label>
          {textMode && (
            <>
              <input
                type="text"
                aria-label="Texto para o Text Mode"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value.toUpperCase())}
                placeholder="Your text..."
                className="input-field"
              />
              {unsupportedChars.length > 0 && (
                <p className="notice">Sem desenho, ignorados: {unsupportedChars.join(' ')}</p>
              )}
              <Slider label="Text Size" value={textScale} min={4} max={15} onChange={setTextScale} />
              <Slider label="Thickness" value={textThickness} min={1} max={8} onChange={setTextThickness} />
            </>
          )}
        </div>

        <div className="control-group">
          <label className="checkbox-control">
            <input type="checkbox" checked={isAnimating} onChange={(e) => setIsAnimating(e.target.checked)} />
            Animate
          </label>
          <label className="checkbox-control">
            <input type="checkbox" checked={mouseInteraction} onChange={(e) => setMouseInteraction(e.target.checked)} />
            Mouse Interaction
          </label>
          {mouseInteraction && (
            <p className="notice">Segure o clique (ou arraste o dedo) sobre a arte.</p>
          )}
        </div>

        <div className="control-group">
          <label htmlFor="background-color">Background Color:</label>
          <input id="background-color" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="input-field" />
          <label htmlFor="text-color">Text Color:</label>
          <input id="text-color" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="input-field" />
        </div>

        <button onClick={copyToClipboard} className="button">Copy</button>
        <button onClick={exportPattern} className="button-secondary">Export</button>
        <button onClick={resetSettings} className="button-secondary">Reset</button>
        {notice && <p className="notice" role="status">{notice.message}</p>}
      </div>

      {/* Área de Visualização. A arte é decorativa para leitores de tela; o role descreve o padrão */}
      <div
        ref={panelRef}
        className="preview-panel"
        role="img"
        aria-label={`Arte ASCII: ${currentPattern}`}
        style={{ backgroundColor }}
      >
        <pre
          ref={containerRef}
          aria-hidden="true"
          className="ascii-art"
          style={{
            fontSize: `${fittedFont}px`,
            color: textColor,
          }}
          onPointerMove={handlePointerMove}
          onPointerDown={() => setPointerDown(true)}
          onPointerUp={() => setPointerDown(false)}
          onPointerLeave={() => setPointerDown(false)}
          onPointerCancel={() => setPointerDown(false)}
        />
      </div>
    </div>
  );
};

export default PatternGenerator;
