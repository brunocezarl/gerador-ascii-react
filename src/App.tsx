import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './App.css';
import { patterns, patternNames } from './patterns';
import { characterPresets } from './charsets';
import { buildTextMask, CELL_ASPECT } from './textmask';
import {
  computeField,
  fieldToText,
  fieldToSvg,
  paintField,
  makeColorLUT,
  palettes,
  sampleImageLuminance,
} from './engine';
import type { FieldOptions, Palette } from './engine';
import { encodeShareHash, decodeShareHash } from './urlState';
import type { ShareState } from './urlState';
import { downloadBlob, downloadText, encodeGif } from './exporters';
import { loadPresets, persistPresets, MAX_PRESETS } from './presets';
import type { SavedPreset } from './presets';

const DEFAULTS: ShareState = {
  pattern: 'waves',
  patternB: 'none',
  patternMix: 0.5,
  speed: 5,
  density: 0.3,
  scale: 0.2,
  width: 60,
  height: 30,
  characters: '█▓▒░·',
  characterPreset: 'blocks',
  fontSize: 12,
  backgroundColor: '#F0EEE6',
  textColor: '#333333',
  colorMode: 'mono',
  colorA: '#1A1A1A',
  colorB: '#C9C3B4',
  textMode: false,
  textInput: 'HELLO',
  textScale: 8,
  textThickness: 3,
};

// Estado inicial vindo de um link compartilhado, se houver
const fromUrl = typeof window !== 'undefined' ? decodeShareHash(window.location.hash) : null;

const initStr = <K extends keyof ShareState>(key: K): ShareState[K] => {
  const value = fromUrl?.[key];
  return (typeof value === typeof DEFAULTS[key] ? value : DEFAULTS[key]) as ShareState[K];
};

const initNum = (key: keyof ShareState, min: number, max: number): number => {
  const value = Number(fromUrl?.[key]);
  if (!Number.isFinite(value)) return DEFAULTS[key] as number;
  return Math.min(max, Math.max(min, value));
};

const GIF_FPS = 12;
const GIF_SECONDS = 4;
// O preview anima a ~60fps (1 frame por rAF); o GIF avança o tempo na mesma taxa
const GIF_FRAME_STEP = Math.round(60 / GIF_FPS);
// GIF não comprime bem; acima disso o arquivo passa facilmente de 10 MB
const GIF_MAX_WIDTH_PX = 640;

const PatternGenerator = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentPattern, setCurrentPattern] = useState(() => {
    const p = initStr('pattern');
    return patterns[p] ? p : DEFAULTS.pattern;
  });
  const [patternB, setPatternB] = useState(() => {
    const p = initStr('patternB');
    return patterns[p] ? p : 'none';
  });
  const [patternMix, setPatternMix] = useState(() => initNum('patternMix', 0, 1));
  const [speed, setSpeed] = useState(() => initNum('speed', 1, 20));
  const [density, setDensity] = useState(() => initNum('density', 0.1, 2));
  const [scale, setScale] = useState(() => initNum('scale', 0.05, 1));
  const [width, setWidth] = useState(() => Math.round(initNum('width', 20, 160)));
  const [height, setHeight] = useState(() => Math.round(initNum('height', 10, 80)));
  const [characters, setCharacters] = useState(() => initStr('characters'));
  const [characterPreset, setCharacterPreset] = useState(() => initStr('characterPreset'));
  const [fontSize, setFontSize] = useState(() => Math.round(initNum('fontSize', 8, 24)));
  const [backgroundColor, setBackgroundColor] = useState(() => initStr('backgroundColor'));
  const [textColor, setTextColor] = useState(() => initStr('textColor'));
  const [colorMode, setColorMode] = useState<'mono' | 'gradient'>(() =>
    initStr('colorMode') === 'gradient' ? 'gradient' : 'mono'
  );
  const [colorA, setColorA] = useState(() => initStr('colorA'));
  const [colorB, setColorB] = useState(() => initStr('colorB'));
  const [paletteName, setPaletteName] = useState('custom');
  const [mouseInteraction, setMouseInteraction] = useState(true);
  const [textMode, setTextMode] = useState(() => initStr('textMode'));
  const [textInput, setTextInput] = useState(() => initStr('textInput'));
  const [textScale, setTextScale] = useState(() => initNum('textScale', 4, 15));
  const [textThickness, setTextThickness] = useState(() => initNum('textThickness', 1, 8));
  const [sourceImage, setSourceImage] = useState<{ img: HTMLImageElement; name: string } | null>(null);
  const [imageMix, setImageMix] = useState(0.8);
  const [exportScale, setExportScale] = useState(2);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [presets, setPresets] = useState<SavedPreset[]>(() => loadPresets());
  const [presetName, setPresetName] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // O frame e o mouse ficam em refs para não re-renderizar o React a cada quadro
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const renderFrameRef = useRef<(() => void) | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2500);
  }, []);

  // A máscara do texto só é recalculada quando os parâmetros do texto mudam
  const textMask = useMemo(
    () => (textMode ? buildTextMask(textInput, textScale, textThickness, width, height) : null),
    [textMode, textInput, textScale, textThickness, width, height]
  );

  // Luminância da imagem amostrada na resolução da grade
  const imageLum = useMemo(
    () => (sourceImage ? sampleImageLuminance(sourceImage.img, width, height) : null),
    [sourceImage, width, height]
  );

  const colorLUT = useMemo(
    () => (colorMode === 'gradient' ? makeColorLUT([colorA, colorB]) : [textColor]),
    [colorMode, colorA, colorB, textColor]
  );

  const buildFieldOptions = useCallback(
    (mouse: { x: number; y: number } | null): FieldOptions => ({
      patternName: currentPattern,
      patternNameB: patternB === 'none' ? null : patternB,
      patternMix,
      scale,
      speed,
      width,
      height,
      density,
      textMask,
      imageLum,
      imageMix: imageLum ? imageMix : 0,
      mouse,
    }),
    [currentPattern, patternB, patternMix, scale, speed, width, height, density, textMask, imageLum, imageMix]
  );

  // Pinta o estado atual em um contexto qualquer (preview ou export)
  const paintFrame = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number, cellSize: number, mouse: { x: number; y: number } | null) => {
      const field = computeField(frame, buildFieldOptions(mouse));
      paintField(ctx, field, {
        width,
        height,
        characters,
        cellSize,
        background: backgroundColor,
        colors: colorLUT,
      });
    },
    [buildFieldOptions, width, height, characters, backgroundColor, colorLUT]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cssW = Math.round(width * fontSize * CELL_ASPECT);
    const cssH = Math.round(height * fontSize);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const renderFrame = () => {
      // O rect é consultado uma vez por frame, fora do loop de células
      let mouse: { x: number; y: number } | null = null;
      if (mouseInteraction && mouseRef.current.down) {
        const rect = canvas.getBoundingClientRect();
        mouse = {
          x: ((mouseRef.current.x - rect.left) / rect.width) * width,
          y: ((mouseRef.current.y - rect.top) / rect.height) * height,
        };
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFrame(ctx, frameRef.current, fontSize, mouse);
    };

    renderFrameRef.current = renderFrame;
    renderFrame();

    if (!isAnimating) return;

    let rafId: number;
    const loop = () => {
      frameRef.current += 1;
      renderFrame();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [isAnimating, mouseInteraction, paintFrame, width, height, fontSize]);

  // Mantém a URL sincronizada com o estado para o link ser sempre compartilhável
  const shareState = useMemo<ShareState>(
    () => ({
      pattern: currentPattern,
      patternB,
      patternMix,
      speed,
      density,
      scale,
      width,
      height,
      characters,
      characterPreset,
      fontSize,
      backgroundColor,
      textColor,
      colorMode,
      colorA,
      colorB,
      textMode,
      textInput,
      textScale,
      textThickness,
    }),
    [currentPattern, patternB, patternMix, speed, density, scale, width, height,
     characters, characterPreset, fontSize, backgroundColor, textColor, colorMode,
     colorA, colorB, textMode, textInput, textScale, textThickness]
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      window.history.replaceState(null, '', encodeShareHash(shareState));
    }, 400);
    return () => window.clearTimeout(id);
  }, [shareState]);

  const applyPalette = useCallback((palette: Palette) => {
    setPaletteName(palette.name);
    setColorMode('gradient');
    setBackgroundColor(palette.bg);
    setColorA(palette.stops[0]);
    setColorB(palette.stops[1]);
  }, []);

  // Aplica um ShareState completo (preset salvo ou reset)
  const applyShareState = useCallback((state: ShareState) => {
    setCurrentPattern(patterns[state.pattern] ? state.pattern : DEFAULTS.pattern);
    setPatternB(patterns[state.patternB] ? state.patternB : 'none');
    setPatternMix(state.patternMix);
    setSpeed(state.speed);
    setDensity(state.density);
    setScale(state.scale);
    setWidth(state.width);
    setHeight(state.height);
    setCharacters(state.characters);
    setCharacterPreset(state.characterPreset);
    setFontSize(state.fontSize);
    setBackgroundColor(state.backgroundColor);
    setTextColor(state.textColor);
    setColorMode(state.colorMode === 'gradient' ? 'gradient' : 'mono');
    setColorA(state.colorA);
    setColorB(state.colorB);
    setPaletteName('custom');
    setTextMode(state.textMode);
    setTextInput(state.textInput);
    setTextScale(state.textScale);
    setTextThickness(state.textThickness);
  }, []);

  const randomize = useCallback(() => {
    const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    setCurrentPattern(pick(patternNames));
    if (Math.random() < 0.35) {
      setPatternB(pick(patternNames));
      setPatternMix(Math.round(rand(0.3, 0.7) * 100) / 100);
    } else {
      setPatternB('none');
    }
    setScale(Math.round(rand(0.05, 0.6) * 100) / 100);
    setDensity(Math.round(rand(0.2, 1.2) * 10) / 10);
    setSpeed(Math.round(rand(2, 12)));
    const preset = pick(Object.keys(characterPresets));
    setCharacterPreset(preset);
    setCharacters(characterPresets[preset]);
    if (Math.random() < 0.5) {
      applyPalette(pick(palettes));
    }
  }, [applyPalette]);

  // Atalhos: espaço = play/pause, R = randomize
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsAnimating((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        randomize();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [randomize]);

  const currentText = useCallback(
    () => fieldToText(computeField(frameRef.current, buildFieldOptions(null)), width, height, characters),
    [buildFieldOptions, width, height, characters]
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentText()).then(
      () => showToast('ASCII copiado para a área de transferência!'),
      () => showToast('Não foi possível copiar.')
    );
  };

  const exportTxt = () => {
    downloadText(currentText(), `ascii-${currentPattern}-${Date.now()}.txt`);
    showToast('TXT exportado!');
  };

  const makeExportCanvas = (maxWidthPx?: number) => {
    let cellSize = fontSize * exportScale;
    if (maxWidthPx && width * cellSize * CELL_ASPECT > maxWidthPx) {
      cellSize = maxWidthPx / (width * CELL_ASPECT);
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * cellSize * CELL_ASPECT);
    canvas.height = Math.round(height * cellSize);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, ctx, cellSize };
  };

  const exportPng = () => {
    const { canvas, ctx, cellSize } = makeExportCanvas();
    if (!ctx) return;
    paintFrame(ctx, frameRef.current, cellSize, null);
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `ascii-${currentPattern}-${Date.now()}.png`);
        showToast(`PNG ${canvas.width}×${canvas.height} exportado!`);
      }
    }, 'image/png');
  };

  const exportSvg = () => {
    const cellSize = fontSize * exportScale;
    const field = computeField(frameRef.current, buildFieldOptions(null));
    const svg = fieldToSvg(field, {
      width,
      height,
      characters,
      cellSize,
      background: backgroundColor,
      colors: colorLUT,
    });
    downloadBlob(
      new Blob([svg], { type: 'image/svg+xml' }),
      `ascii-${currentPattern}-${Date.now()}.svg`
    );
    showToast('SVG exportado! Editável no Figma/Illustrator.');
  };

  const exportGif = async () => {
    if (busy) return;
    const { canvas, cellSize } = makeExportCanvas(GIF_MAX_WIDTH_PX);
    const startFrame = frameRef.current;
    setBusy('Gerando GIF… 0%');
    try {
      const blob = await encodeGif({
        width: canvas.width,
        height: canvas.height,
        frameCount: GIF_FPS * GIF_SECONDS,
        delayMs: Math.round(1000 / GIF_FPS),
        paint: (ctx, i) => paintFrame(ctx, startFrame + i * GIF_FRAME_STEP, cellSize, null),
        onProgress: (p) => setBusy(`Gerando GIF… ${Math.round(p * 100)}%`),
      });
      downloadBlob(blob, `ascii-${currentPattern}-${Date.now()}.gif`);
      showToast(`GIF de ${GIF_SECONDS}s exportado!`);
    } catch (err) {
      console.error(err);
      showToast('Falha ao gerar o GIF.');
    } finally {
      setBusy(null);
    }
  };

  // Thumbnail pequeno do frame atual para a galeria de presets
  const makeThumbnail = () => {
    const cellSize = Math.max(2, 132 / (width * CELL_ASPECT));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * cellSize * CELL_ASPECT);
    canvas.height = Math.round(height * cellSize);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    paintFrame(ctx, frameRef.current, cellSize, null);
    return canvas.toDataURL('image/png');
  };

  const savePreset = () => {
    const name = presetName.trim() || patterns[currentPattern].label;
    const preset: SavedPreset = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      thumb: makeThumbnail(),
      state: shareState,
      createdAt: Date.now(),
    };
    const next = [preset, ...presets].slice(0, MAX_PRESETS);
    setPresets(next);
    setPresetName('');
    if (persistPresets(next)) {
      showToast(`Preset "${name}" salvo!`);
    } else {
      showToast('Não foi possível salvar o preset (armazenamento indisponível).');
    }
  };

  const applyPresetItem = (preset: SavedPreset) => {
    applyShareState({ ...DEFAULTS, ...preset.state });
    showToast(`Preset "${preset.name}" aplicado!`);
  };

  const deletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    persistPresets(next);
  };

  const shareLink = () => {
    const hash = encodeShareHash(shareState);
    window.history.replaceState(null, '', hash);
    const url = window.location.origin + window.location.pathname + window.location.search + hash;
    navigator.clipboard.writeText(url).then(
      () => showToast('Link copiado! Cole para compartilhar esta composição.'),
      () => showToast('Não foi possível copiar o link.')
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setSourceImage({ img, name: file.name });
      showToast(`Imagem "${file.name}" carregada!`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showToast('Não foi possível ler a imagem.');
    };
    img.src = url;
  };

  const removeImage = () => {
    setSourceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetSettings = () => {
    applyShareState(DEFAULTS);
    removeImage();
    setImageMix(0.8);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
            {patternNames.map((name) => (
              <li
                key={name}
                className={`pattern-list-item ${currentPattern === name ? 'active' : ''}`}
                onClick={() => setCurrentPattern(name)}
              >
                [{currentPattern === name ? '*' : ' '}] {patterns[name].label.toUpperCase()}
              </li>
            ))}
          </ul>
        </div>

        <div className="control-group">
          <label>Blend With:</label>
          <select
            value={patternB}
            className="select-field"
            onChange={(e) => setPatternB(e.target.value)}
          >
            <option value="none">None</option>
            {patternNames.map((name) => (
              <option key={name} value={name}>{patterns[name].label}</option>
            ))}
          </select>
          {patternB !== 'none' && (
            <>
              <div className="slider-control">
                <label>Blend Mix</label>
                <span>{Math.round(patternMix * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05" value={patternMix}
                onChange={(e) => setPatternMix(Number(e.target.value))}
              />
            </>
          )}
        </div>

        <div className="control-group">
          <div className="slider-control">
            <label>Speed</label>
            <span>{speed}</span>
          </div>
          <input
            type="range" min="1" max="20" value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <div className="slider-control">
            <label>Density</label>
            <span>{density.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0.1" max="2" step="0.1" value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <div className="slider-control">
            <label>Scale</label>
            <span>{scale.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0.05" max="1" step="0.05" value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <div className="slider-control">
            <label>Width</label>
            <span>{width}</span>
          </div>
          <input
            type="range" min="20" max="160" value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <div className="slider-control">
            <label>Height</label>
            <span>{height}</span>
          </div>
          <input
            type="range" min="10" max="80" value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <div className="slider-control">
            <label>Font Size</label>
            <span>{fontSize}</span>
          </div>
          <input
            type="range" min="8" max="24" value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </div>

        <div className="control-group character-set-group">
          <label>Character Set:</label>
          <select
            value={characterPreset}
            className="select-field"
            onChange={(e) => {
              setCharacterPreset(e.target.value);
              if (e.target.value !== 'custom') {
                setCharacters(characterPresets[e.target.value]);
              }
            }}
          >
            {Object.keys(characterPresets).map((name) => (
              <option key={name} value={name}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          <input
            type="text"
            value={characters}
            className="input-field"
            onChange={(e) => {
              setCharacters(e.target.value);
              setCharacterPreset('custom');
            }}
            disabled={characterPreset !== 'custom'}
          />
        </div>

        <div className="control-group">
          <h3>/COLOR</h3>
          <select
            value={colorMode}
            className="select-field"
            onChange={(e) => setColorMode(e.target.value as 'mono' | 'gradient')}
          >
            <option value="mono">Mono</option>
            <option value="gradient">Gradient</option>
          </select>

          {colorMode === 'gradient' ? (
            <>
              <label>Palette:</label>
              <select
                value={paletteName}
                className="select-field"
                onChange={(e) => {
                  const palette = palettes.find((p) => p.name === e.target.value);
                  if (palette) applyPalette(palette);
                  else setPaletteName('custom');
                }}
              >
                {palettes.map((p) => (
                  <option key={p.name} value={p.name}>{p.label}</option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <div className="color-row">
                <label>Dense</label>
                <input
                  type="color" value={colorA}
                  onChange={(e) => { setColorA(e.target.value); setPaletteName('custom'); }}
                />
                <label>Light</label>
                <input
                  type="color" value={colorB}
                  onChange={(e) => { setColorB(e.target.value); setPaletteName('custom'); }}
                />
              </div>
            </>
          ) : (
            <div className="color-row">
              <label>Text</label>
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
            </div>
          )}
          <div className="color-row">
            <label>Background</label>
            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
          </div>
        </div>

        <div className="control-group">
          <h3>/IMAGE</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="input-field"
            onChange={handleImageUpload}
          />
          {sourceImage && (
            <>
              <div className="slider-control">
                <label>Image Mix</label>
                <span>{Math.round(imageMix * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05" value={imageMix}
                onChange={(e) => setImageMix(Number(e.target.value))}
              />
              <button onClick={removeImage} className="button-secondary">Remove Image</button>
            </>
          )}
        </div>

        <div className="control-group">
          <h3>/TEXT</h3>
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
              <div className="slider-control">
                <label>Text Size</label>
                <span>{textScale}</span>
              </div>
              <input type="range" min="4" max="15" value={textScale} onChange={(e) => setTextScale(Number(e.target.value))} />
              <div className="slider-control">
                <label>Thickness</label>
                <span>{textThickness}</span>
              </div>
              <input type="range" min="1" max="8" value={textThickness} onChange={(e) => setTextThickness(Number(e.target.value))} />
            </>
          )}
        </div>

        <div className="control-group">
          <label className="checkbox-control">
            <input type="checkbox" checked={isAnimating} onChange={(e) => setIsAnimating(e.target.checked)} />
            Animate <span className="hint">(espaço)</span>
          </label>
          <label className="checkbox-control">
            <input type="checkbox" checked={mouseInteraction} onChange={(e) => setMouseInteraction(e.target.checked)} />
            Mouse Interaction
          </label>
        </div>

        <div className="control-group">
          <h3>/EXPORT</h3>
          <label>Export Scale:</label>
          <select
            value={exportScale}
            className="select-field"
            onChange={(e) => setExportScale(Number(e.target.value))}
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
            <option value={4}>4x</option>
          </select>
          <button onClick={exportPng} className="button">PNG</button>
          <button onClick={exportGif} className="button" disabled={busy !== null}>
            {busy ?? `GIF (${GIF_SECONDS}s)`}
          </button>
          <button onClick={exportSvg} className="button">SVG</button>
          <button onClick={copyToClipboard} className="button-secondary">Copy TXT</button>
          <button onClick={exportTxt} className="button-secondary">TXT</button>
          <button onClick={shareLink} className="button-secondary">Share Link</button>
        </div>

        <div className="control-group">
          <h3>/PRESETS</h3>
          <div className="preset-save-row">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nome do preset..."
              className="input-field"
              onKeyDown={(e) => { if (e.key === 'Enter') savePreset(); }}
            />
            <button onClick={savePreset} className="button-secondary preset-save-button">Save</button>
          </div>
          {presets.length > 0 && (
            <ul className="preset-list">
              {presets.map((preset) => (
                <li key={preset.id} className="preset-item">
                  <button className="preset-load" onClick={() => applyPresetItem(preset)}>
                    {preset.thumb && <img src={preset.thumb} alt="" className="preset-thumb" />}
                    <span className="preset-name">{preset.name}</span>
                  </button>
                  <button
                    className="preset-delete"
                    title="Excluir preset"
                    onClick={() => deletePreset(preset.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="control-group">
          <button onClick={randomize} className="button-secondary">Randomize (R)</button>
          <button onClick={resetSettings} className="button-secondary">Reset</button>
        </div>
      </div>

      {/* Área de Visualização */}
      <div className="preview-panel" style={{ backgroundColor }}>
        <canvas
          ref={canvasRef}
          className="ascii-canvas"
          onMouseMove={handleMouseMove}
          onMouseDown={() => handleMouseDown(true)}
          onMouseUp={() => handleMouseDown(false)}
          onMouseLeave={() => handleMouseDown(false)}
        />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default PatternGenerator;
