import { useState, useEffect, useMemo, useRef, type PointerEvent } from 'react';
import './App.css';
import Slider from './components/Slider';
import SavedPresetsPanel from './components/SavedPresetsPanel';
import { advanceTime, stepTime, toPatternTime } from './animation';
import {
  buildSvg, createGridCanvas, downloadBlob, drawGrid, gridSize, pickVideoMimeType, recordVideo, toLines,
  type ExportStyle,
} from './exporter';
import { fitFontSize, MIN_FONT_SIZE } from './fit';
import { findPaletteId, palettes } from './palettes';
import { patterns, type PatternName } from './patterns';
import { characterPresets, type CharacterSetName } from './presets';
import { randomSettings } from './randomize';
import { renderAscii } from './renderAscii';
import {
  browserStorage, normalizePresetName, readSavedPresets, writeSavedPresets, type SavedPresets,
} from './savedPresets';
import { DEFAULTS, decodeSettings, encodeSettings, SLIDER, type Settings } from './settings';
import { buildTextMask, findUnsupportedChars } from './textMask';

// Quantas vezes o encaixe pode descer 0,1px até a arte real caber
const MAX_FIT_ATTEMPTS = 10;
// Vídeo exportado: duração, quadros por segundo e largura máxima em px
const VIDEO_SECONDS = 6;
const VIDEO_FPS = 30;
const VIDEO_MAX_WIDTH = 1280;

const PatternGenerator = () => {
  // Começa com os padrões e aplica o que veio na URL, se houver
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULTS,
    ...decodeSettings(window.location.search),
  }));
  // Fonte realmente usada na arte: igual ao Font Size, ou menor se a grade não couber no painel
  const [fittedFont, setFittedFont] = useState(DEFAULTS.fontSize);
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const [savedPresets, setSavedPresets] = useState<SavedPresets>(() => readSavedPresets(browserStorage()));
  const [recording, setRecording] = useState(false);

  const {
    isAnimating, pattern, speed, density, scale, width, height, fontSize,
    characterSet, customCharacters, mouseInteraction, backgroundColor, textColor,
    textMode, textInput, textScale, textThickness,
  } = settings;

  const update = (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch }));

  // O set de caracteres é derivado: o preset escolhido ou o texto personalizado
  const characters = characterSet === 'custom' ? customCharacters : characterPresets[characterSet];
  const paletteId = findPaletteId(backgroundColor, textColor);
  const videoSupported = pickVideoMimeType() !== null;

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

  // Mensagens somem sozinhas depois de um tempo
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(id);
  }, [notice]);

  // Mantém a URL com a configuração atual, para copiar e compartilhar
  useEffect(() => {
    const query = encodeSettings(settings);
    try {
      window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
    } catch {
      // Alguns contextos não deixam mudar a URL; o app segue funcionando sem isso
    }
  }, [settings]);

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
        patternName: pattern,
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
  }, [isAnimating, pattern, scale, speed, width, height, density, characters, mouseInteraction, textMask]);

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

  const showNotice = (message: string) => setNotice({ message });

  // Quadro em um instante, sem o efeito do ponteiro. Base de Copy e de todas as exportações.
  const renderText = (seconds: number) => renderAscii(toPatternTime(seconds), {
    patternName: pattern,
    scale, speed, width, height, density, characters,
    textMask, mouse: null,
  });

  const exportStyle = (): ExportStyle => ({
    fontSize: fittedFont,
    background: backgroundColor,
    color: textColor,
  });

  const fileBase = () => `pattern-${pattern}-${Date.now()}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(renderText(timeRef.current));
      showNotice('Pattern copiado para a área de transferência!');
    } catch {
      // Sem contexto seguro (ex.: HTTP) o navegador bloqueia a área de transferência
      showNotice('Não foi possível copiar. Use Export para salvar o arquivo.');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showNotice('Link copiado! Ele abre com esta configuração.');
    } catch {
      showNotice('Não foi possível copiar o link. Copie a URL da barra de endereço.');
    }
  };

  const exportText = () => {
    downloadBlob(new Blob([renderText(timeRef.current)], { type: 'text/plain' }), `${fileBase()}.txt`);
  };

  const exportSvg = () => {
    const svg = buildSvg(toLines(renderText(timeRef.current)), exportStyle());
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${fileBase()}.svg`);
  };

  const exportPng = () => {
    const lines = toLines(renderText(timeRef.current));
    const style = exportStyle();
    const scaleFactor = 2; // dobro da resolução para a imagem ficar nítida
    const canvas = createGridCanvas(lines, style, scaleFactor);
    drawGrid(canvas, lines, style, scaleFactor);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${fileBase()}.png`);
      else showNotice('Não foi possível gerar o PNG.');
    }, 'image/png');
  };

  // Grava o que está na tela a partir do instante atual, com o mesmo padrão e as mesmas cores
  const exportVideo = async () => {
    const mimeType = pickVideoMimeType();
    if (!mimeType) {
      showNotice('Este navegador não permite gravar vídeo.');
      return;
    }
    const style = exportStyle();
    const startAt = timeRef.current;
    const firstLines = toLines(renderText(startAt));
    const scaleFactor = Math.min(1, VIDEO_MAX_WIDTH / gridSize(firstLines, style.fontSize).width);
    const canvas = createGridCanvas(firstLines, style, scaleFactor);

    setRecording(true);
    try {
      const blob = await recordVideo(canvas, mimeType, VIDEO_SECONDS, VIDEO_FPS, (elapsed) => {
        drawGrid(canvas, toLines(renderText(startAt + elapsed)), style, scaleFactor);
      });
      downloadBlob(blob, `${fileBase()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
    } catch {
      showNotice('Não foi possível gravar o vídeo.');
    } finally {
      setRecording(false);
    }
  };

  const savePreset = (rawName: string) => {
    const name = normalizePresetName(rawName);
    if (!name) return;
    const next = { ...savedPresets, [name]: encodeSettings(settings) };
    if (writeSavedPresets(browserStorage(), next)) {
      setSavedPresets(next);
      showNotice(`Preset "${name}" salvo.`);
    } else {
      showNotice('Não foi possível salvar o preset neste navegador.');
    }
  };

  const loadPreset = (name: string) => {
    const query = savedPresets[name];
    if (query !== undefined) setSettings({ ...DEFAULTS, ...decodeSettings(query) });
  };

  const deletePreset = (name: string) => {
    const next = { ...savedPresets };
    delete next[name];
    if (writeSavedPresets(browserStorage(), next)) setSavedPresets(next);
  };

  const choosePalette = (id: string) => {
    const palette = palettes.find((p) => p.id === id);
    if (palette) update({ backgroundColor: palette.background, textColor: palette.text });
  };

  const randomize = () => update(randomSettings());

  const resetSettings = () => update({
    ...DEFAULTS,
    // Como antes, Reset mantém o padrão escolhido e os modos Animate e Mouse
    pattern,
    isAnimating,
    mouseInteraction,
  });

  // Passo a passo com a animação pausada: um frame de 60 fps por clique
  const stepFrame = (frames: number) => {
    timeRef.current = stepTime(timeRef.current, frames);
    renderFrameRef.current?.();
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
              const active = pattern === name;
              return (
                <li key={name} className="pattern-list-item">
                  <button
                    type="button"
                    className={`pattern-button${active ? ' active' : ''}`}
                    aria-pressed={active}
                    onClick={() => update({ pattern: name })}
                  >
                    [{active ? '*' : ' '}] {name.toUpperCase()}
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" className="button-secondary compact" onClick={randomize}>
            Aleatorizar
          </button>
        </div>

        <div className="control-group">
          <Slider label="Speed" value={speed} {...SLIDER.speed} onChange={(v) => update({ speed: v })} />
        </div>

        <div className="control-group">
          <Slider
            label="Density" value={density} {...SLIDER.density}
            display={density.toFixed(2)} onChange={(v) => update({ density: v })}
          />
        </div>

        <div className="control-group">
          <Slider
            label="Scale" value={scale} {...SLIDER.scale}
            display={scale.toFixed(2)} onChange={(v) => update({ scale: v })}
          />
        </div>

        <div className="control-group">
          <Slider label="Width" value={width} {...SLIDER.width} onChange={(v) => update({ width: v })} />
        </div>

        <div className="control-group">
          <Slider label="Height" value={height} {...SLIDER.height} onChange={(v) => update({ height: v })} />
        </div>

        <div className="control-group">
          <Slider
            label="Font Size" value={fontSize} {...SLIDER.fontSize}
            display={fittedFont < fontSize ? `${fittedFont.toFixed(1)} (ajustado)` : undefined}
            onChange={(v) => update({ fontSize: v })}
          />
        </div>

        <div className="control-group stacked-group">
          <label htmlFor="character-set">Character Set:</label>
          <select
            id="character-set"
            value={characterSet}
            className="select-field"
            onChange={(e) => {
              const next = e.target.value as CharacterSetName;
              // Ao personalizar, o ponto de partida é o set que está em uso
              update(next === 'custom' ? { characterSet: next, customCharacters: characters } : { characterSet: next });
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
            onChange={(e) => update({ customCharacters: e.target.value, characterSet: 'custom' })}
            disabled={characterSet !== 'custom'}
          />
        </div>

        <div className="control-group">
          <label className="checkbox-control">
            <input type="checkbox" checked={textMode} onChange={(e) => update({ textMode: e.target.checked })} />
            Text Mode
          </label>
          {textMode && (
            <>
              <input
                type="text"
                aria-label="Texto para o Text Mode"
                value={textInput}
                onChange={(e) => update({ textInput: e.target.value.toUpperCase() })}
                placeholder="Your text..."
                className="input-field"
              />
              {unsupportedChars.length > 0 && (
                <p className="notice">Sem desenho, ignorados: {unsupportedChars.join(' ')}</p>
              )}
              <Slider label="Text Size" value={textScale} {...SLIDER.textScale} onChange={(v) => update({ textScale: v })} />
              <Slider label="Thickness" value={textThickness} {...SLIDER.textThickness} onChange={(v) => update({ textThickness: v })} />
            </>
          )}
        </div>

        <div className="control-group">
          <label className="checkbox-control">
            <input type="checkbox" checked={isAnimating} onChange={(e) => update({ isAnimating: e.target.checked })} />
            Animate
          </label>
          {!isAnimating && (
            <div className="step-row" role="group" aria-label="Passo a passo">
              <button type="button" className="button-secondary" aria-label="Frame anterior" onClick={() => stepFrame(-1)}>
                ◀ Frame
              </button>
              <button type="button" className="button-secondary" aria-label="Próximo frame" onClick={() => stepFrame(1)}>
                Frame ▶
              </button>
            </div>
          )}
          <label className="checkbox-control">
            <input type="checkbox" checked={mouseInteraction} onChange={(e) => update({ mouseInteraction: e.target.checked })} />
            Mouse Interaction
          </label>
          {mouseInteraction && (
            <p className="notice">Segure o clique (ou arraste o dedo) sobre a arte.</p>
          )}
        </div>

        <div className="control-group stacked-group">
          <label htmlFor="palette">Paleta:</label>
          <select
            id="palette"
            value={paletteId}
            className="select-field"
            onChange={(e) => choosePalette(e.target.value)}
          >
            {palettes.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            <option value="custom" disabled>Personalizada</option>
          </select>
          <label htmlFor="background-color">Background Color:</label>
          <input id="background-color" type="color" value={backgroundColor} onChange={(e) => update({ backgroundColor: e.target.value })} className="input-field" />
          <label htmlFor="text-color">Text Color:</label>
          <input id="text-color" type="color" value={textColor} onChange={(e) => update({ textColor: e.target.value })} className="input-field" />
        </div>

        <SavedPresetsPanel
          presets={savedPresets}
          onSave={savePreset}
          onLoad={loadPreset}
          onDelete={deletePreset}
        />

        <div className="control-group">
          <h3>Compartilhar</h3>
          <button onClick={copyToClipboard} className="button">Copy</button>
          <button onClick={copyLink} className="button-secondary">Copiar link</button>
        </div>

        <div className="control-group">
          <h3>Exportar</h3>
          <div className="button-row">
            <button onClick={exportText} className="button-secondary compact">.txt</button>
            <button onClick={exportSvg} className="button-secondary compact">.svg</button>
            <button onClick={exportPng} className="button-secondary compact">.png</button>
          </div>
          <button
            onClick={exportVideo}
            className="button-secondary"
            disabled={!videoSupported || recording}
            title={videoSupported ? undefined : 'Este navegador não permite gravar vídeo'}
          >
            {recording ? 'Gravando…' : `Vídeo (${VIDEO_SECONDS}s)`}
          </button>
        </div>

        <button onClick={resetSettings} className="button-secondary">Reset</button>
        {notice && <p className="notice" role="status">{notice.message}</p>}
      </div>

      {/* Área de Visualização. A arte é decorativa para leitores de tela; o role descreve o padrão */}
      <div
        ref={panelRef}
        className="preview-panel"
        role="img"
        aria-label={`Arte ASCII: ${pattern}`}
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
