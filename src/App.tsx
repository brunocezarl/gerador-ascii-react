import { useState, useEffect, useMemo, useRef, type MouseEvent } from 'react';
import './App.css';
import Slider from './components/Slider';
import { advanceTime, toPatternTime } from './animation';
import { patterns, type PatternName } from './patterns';
import { characterPresets, DEFAULTS, type CharacterSetName } from './presets';
import { renderAscii } from './renderAscii';
import { buildTextMask, findUnsupportedChars } from './textMask';

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
  const [textInput, setTextInput] = useState(DEFAULTS.textInput);
  const [textMode, setTextMode] = useState(DEFAULTS.textMode);
  const [textScale, setTextScale] = useState(DEFAULTS.textScale);
  const [textThickness, setTextThickness] = useState(DEFAULTS.textThickness);
  const [notice, setNotice] = useState<{ message: string } | null>(null);

  // O set de caracteres é derivado: o preset escolhido ou o texto personalizado
  const characters = characterPreset === 'custom' ? customCharacters : characterPresets[characterPreset];

  // Tempo da animação (segundos) e mouse ficam em refs para não re-renderizar o React a cada quadro
  const timeRef = useRef(0);
  const containerRef = useRef<HTMLPreElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
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
      let mouse: { x: number; y: number } | null = null;
      if (mouseInteraction && mouseRef.current.down) {
        const rect = el.getBoundingClientRect();
        mouse = {
          x: ((mouseRef.current.x - rect.left) / rect.width) * width,
          y: ((mouseRef.current.y - rect.top) / rect.height) * height,
        };
      }

      // Escreve direto no DOM, sem passar pelo render do React
      el.textContent = renderAscii(toPatternTime(timeRef.current), {
        patternName: currentPattern,
        scale, speed, width, height, density, characters,
        textMask, mouse,
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

  // Quadro atual sem o efeito do mouse (usado por Copy e Export)
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

  const handleMouseMove = (e: MouseEvent<HTMLPreElement>) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    if (!isAnimating && mouseRef.current.down) {
      renderFrameRef.current?.();
    }
  };

  const handleMouseDown = (down: boolean) => {
    mouseRef.current.down = down;
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
            {(Object.keys(patterns) as PatternName[]).map(name => (
              <li
                key={name}
                className={`pattern-list-item ${currentPattern === name ? 'active' : ''}`}
                onClick={() => setCurrentPattern(name)}
              >
                [{currentPattern === name ? '*' : ' '}] {name.toUpperCase()}
              </li>
            ))}
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
          <Slider label="Font Size" value={fontSize} min={8} max={24} onChange={setFontSize} />
        </div>

        <div className="control-group character-set-group">
          <label>Character Set:</label>
          <select
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
        </div>

        <div className="control-group">
          <label>Background Color:</label>
          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="input-field" />
          <label>Text Color:</label>
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="input-field" />
        </div>

        <button onClick={copyToClipboard} className="button">Copy</button>
        <button onClick={exportPattern} className="button-secondary">Export</button>
        <button onClick={resetSettings} className="button-secondary">Reset</button>
        {notice && <p className="notice" role="status">{notice.message}</p>}
      </div>

      {/* Área de Visualização */}
      <div className="preview-panel" style={{ backgroundColor }}>
        <pre
          ref={containerRef}
          className="ascii-art"
          style={{
            fontSize: `${fontSize}px`,
            color: textColor,
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={() => handleMouseDown(true)}
          onMouseUp={() => handleMouseDown(false)}
          onMouseLeave={() => handleMouseDown(false)}
        />
      </div>
    </div>
  );
};

export default PatternGenerator;
