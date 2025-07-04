import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Definindo os tipos para os parâmetros e estado
interface PatternParams {
  scale: number;
  speed: number;
  width: number;
  height: number;
  density: number;
}

type PatternFunction = (x: number, y: number, t: number, params: PatternParams) => number;

const PatternGenerator = () => {
  const [frame, setFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentPattern, setCurrentPattern] = useState('waves');
  const [speed, setSpeed] = useState(5);
  const [density, setDensity] = useState(0.3);
  const [scale, setScale] = useState(0.2);
  const [width, setWidth] = useState(60);
  const [height, setHeight] = useState(30);
  const [characters, setCharacters] = useState('█▓▒░·');
  const [characterPreset, setCharacterPreset] = useState('blocks');
  const [mouseInteraction, setMouseInteraction] = useState(true);
  
  // Presets de caracteres
  const characterPresets: { [key: string]: string } = {
    blocks: '█▓▒░·',
    dots: '●○◐◑◒◓',
    circles: '●◉○◎◌·',
    squares: '■▪▫◼◻▢',
    lines: '║│┃┆┇┊',
    gradients: '██▓▒░ ',
    minimal: '█░ ',
    ascii: '@#*+=:-.',
    braille: '⣿⣾⣽⣻⣟⣯⣷⣶',
    geometric: '▲△▼▽◆◇',
    custom: characters
  };

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseDown, setMouseDown] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#F0EEE6');
  const [textColor, setTextColor] = useState('#333333');
  const [fontSize, setFontSize] = useState(12);
  const [textInput, setTextInput] = useState('HELLO');
  const [textMode, setTextMode] = useState(false);
  const [textScale, setTextScale] = useState(8);
  const [textThickness, setTextThickness] = useState(3);
  const containerRef = useRef<HTMLPreElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Biblioteca de patterns
  const patterns: { [key: string]: PatternFunction } = {
    waves: (x, y, t, params) => {
      return Math.sin(x * params.scale + t * params.speed * 0.1) * 
             Math.cos(y * params.scale * 0.8 + t * params.speed * 0.05);
    },
    
    ripples: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      return Math.sin(dist * params.scale - t * params.speed * 0.1);
    },
    
    spiral: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const angle = Math.atan2(y - cy, x - cx);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      return Math.sin(angle * 3 + dist * params.scale + t * params.speed * 0.1);
    },
    
    maze: (x, y, t, params) => {
      const noise1 = Math.sin(x * params.scale + t * params.speed * 0.05);
      const noise2 = Math.cos(y * params.scale + t * params.speed * 0.03);
      return noise1 * noise2;
    },
    
    diamond: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const diamond = Math.abs(x - cx) + Math.abs(y - cy);
      return Math.sin(diamond * params.scale + t * params.speed * 0.1);
    },
    
    plasma: (x, y, t, params) => {
      const v1 = Math.sin(x * params.scale + t * params.speed * 0.1);
      const v2 = Math.sin(y * params.scale + t * params.speed * 0.08);
      const v3 = Math.sin((x + y) * params.scale * 0.5 + t * params.speed * 0.06);
      const v4 = Math.sin(Math.sqrt(x ** 2 + y ** 2) * params.scale + t * params.speed * 0.12);
      return (v1 + v2 + v3 + v4) / 4;
    },
    
    tunnel: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const angle = Math.atan2(y - cy, x - cx);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      return Math.sin(angle * 8) * Math.cos(1 / (dist * params.scale + 0.1) + t * params.speed * 0.1);
    },
    
    mandala: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const angle = Math.atan2(y - cy, x - cx);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      return Math.sin(angle * 6 + t * params.speed * 0.05) * 
             Math.cos(dist * params.scale + t * params.speed * 0.08);
    },
    
    // Inspirado em Almir Mavignier - Arte Óptica Brasileira
    mavignier_dots: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      
      // Padrão de pontos em expansão com distorção óptica
      const angle = Math.atan2(dy, dx);
      
      // Criar efeito de pontos em grade distorcida
      const gridX = Math.floor(x / 3) * 3;
      const gridY = Math.floor(y / 3) * 3;
      const gridDist = Math.sqrt((gridX - cx) ** 2 + (gridY - cy) ** 2);
      
      // Ondulação que simula a distorção óptica de Mavignier
      const wave = Math.sin(gridDist * params.scale + t * params.speed * 0.1);
      const optical = Math.cos(angle * 8 + t * params.speed * 0.05);
      
      return wave * optical;
    },
    
    mavignier_lines: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      
      // Linhas radiais que se curvam - inspirado nas composições geométricas
      const angle = Math.atan2(y - cy, x - cx);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      
      // Linhas radiais com curvatura progressiva
      const radialLines = Math.sin(angle * 12 + dist * params.scale * 0.2 + t * params.speed * 0.08);
      
      // Adicionar interferência circular
      const circularWave = Math.cos(dist * params.scale + t * params.speed * 0.06);
      
      return radialLines * 0.7 + circularWave * 0.3;
    },
    
    mavignier_kinetic: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      
      // Efeito cinético com múltiplas frequências
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // Três camadas de movimento com diferentes velocidades
      const layer1 = Math.sin(dist * params.scale * 0.3 + t * params.speed * 0.12);
      const layer2 = Math.cos(angle * 6 + t * params.speed * 0.08);
      const layer3 = Math.sin((dx + dy) * params.scale * 0.2 + t * params.speed * 0.15);
      
      // Combinação que cria efeito de movimento óptico
      return layer1 * 0.4 + layer2 * 0.35 + layer3 * 0.25;
    },
    
    mavignier_geometric: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      
      // Formas geométricas sobrepostas com rotação
      const rotatedX = (x - cx) * Math.cos(t * params.speed * 0.02) - (y - cy) * Math.sin(t * params.speed * 0.02);
      const rotatedY = (x - cx) * Math.sin(t * params.speed * 0.02) + (y - cy) * Math.cos(t * params.speed * 0.02);
      
      // Padrão de losangos e quadrados
      const diamond = Math.abs(rotatedX) + Math.abs(rotatedY);
      const square = Math.max(Math.abs(rotatedX), Math.abs(rotatedY));
      
      const pattern1 = Math.sin(diamond * params.scale + t * params.speed * 0.1);
      const pattern2 = Math.cos(square * params.scale * 0.8 + t * params.speed * 0.07);
      
      return pattern1 * 0.6 + pattern2 * 0.4;
    },
    
    // Inspirado na Proporção Áurea e Fibonacci
    golden_spiral: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      
      // Proporção áurea
      const phi = (1 + Math.sqrt(5)) / 2; // 1.618...
      
      // Converter para coordenadas polares
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // Espiral logarítmica baseada na proporção áurea
      const spiralRadius = Math.exp(angle / phi) * params.scale * 2;
      const spiralDiff = Math.abs(dist - spiralRadius);
      
      // Ondulação ao longo da espiral
      const spiralWave = Math.sin(spiralDiff * params.scale * 10 + t * params.speed * 0.1);
      
      // Adicionar rotação temporal
      const rotatedAngle = angle + t * params.speed * 0.05;
      const spiralPattern = Math.cos(rotatedAngle * phi);
      
      return spiralWave * 0.7 + spiralPattern * 0.3;
    },
    
    fibonacci_grid: (x, y, t, params) => {
      // Sequência de Fibonacci para criar grade proporcional
      const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      const phi = (1 + Math.sqrt(5)) / 2;
      
      // Criar grade baseada em proporções de Fibonacci
      const fibX = fib[Math.floor(x / 5) % fib.length];
      const fibY = fib[Math.floor(y / 5) % fib.length];
      
      // Ondulação baseada na razão áurea
      const goldenX = Math.sin(x * params.scale / phi + t * params.speed * 0.08);
      const goldenY = Math.cos(y * params.scale * phi + t * params.speed * 0.06);
      
      // Interferência entre números de Fibonacci
      const fibPattern = Math.sin(fibX * params.scale + t * params.speed * 0.1) * 
                        Math.cos(fibY * params.scale + t * params.speed * 0.07);
      
      return goldenX * 0.4 + goldenY * 0.4 + fibPattern * 0.2;
    },
    
    golden_rectangles: (x, y, t, params) => {
      const phi = (1 + Math.sqrt(5)) / 2;
      const cx = params.width / 2;
      const cy = params.height / 2;
      
      // Criar retângulos áureos concêntricos
      const layers = 5;
      let pattern = 0;
      
      for (let i = 0; i < layers; i++) {
        const scale = Math.pow(phi, i) * params.scale * 3;
        const rectWidth = scale;
        const rectHeight = scale / phi;
        
        // Rotação baseada no tempo e na camada
        const rotation = t * params.speed * 0.03 + i * Math.PI / 8;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        // Aplicar rotação
        const rotX = (x - cx) * cos - (y - cy) * sin;
        const rotY = (x - cx) * sin + (y - cy) * cos;
        
        // Verificar se está dentro do retângulo áureo
        const inRect = Math.abs(rotX) < rectWidth && Math.abs(rotY) < rectHeight;
        const edgeDist = Math.min(
          rectWidth - Math.abs(rotX),
          rectHeight - Math.abs(rotY)
        );
        
        if (inRect) {
          pattern += Math.sin(edgeDist * params.scale * 2 + t * params.speed * 0.1) * (1 / (i + 1));
        }
      }
      
      return pattern;
    },
    
    golden_petals: (x, y, t, params) => {
      const cx = params.width / 2;
      const cy = params.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      
      const phi = (1 + Math.sqrt(5)) / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Número de pétalas baseado em Fibonacci (tipicamente 5, 8, 13, 21...)
      const petals = 13;
      
      // Ângulo áureo (137.5°) - ângulo entre pétalas na natureza
      const goldenAngle = 2 * Math.PI * (1 - 1/phi);
      
      // Padrão de pétalas
      let petalPattern = 0;
      for (let i = 0; i < petals; i++) {
        const petalAngle = i * goldenAngle + t * params.speed * 0.02;
        const petalX = Math.cos(petalAngle);
        const petalY = Math.sin(petalAngle);
        
        // Distância do ponto atual à linha da pétala
        const dotProduct = dx * petalX + dy * petalY;
        const petalDist = Math.abs(dx * petalY - dy * petalX);
        
        if (dotProduct > 0) {
          const petalIntensity = Math.exp(-petalDist * params.scale * 0.5) * 
                                Math.sin(dotProduct * params.scale * 0.3 + t * params.speed * 0.1);
          petalPattern += petalIntensity;
        }
      }
      
      // Adicionar centro radial
      const centerPattern = Math.sin(dist * params.scale * 0.5 + t * params.speed * 0.08);
      
      return petalPattern * 0.8 + centerPattern * 0.2;
    }
  };

  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        setFrame(f => f + 1);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  const generatePattern = () => {
    const t = frame * 0.05;
    const params = { scale, speed, width, height, density };
    const pattern = patterns[currentPattern];
    let result = '';
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = pattern(x, y, t, params);
        
        // Interação com mouse
        if (mouseInteraction && mouseDown && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = ((mousePos.x - rect.left) / rect.width) * width;
          const mouseY = ((mousePos.y - rect.top) / rect.height) * height;
          const dx = x - mouseX;
          const dy = y - mouseY;
          const mouseDist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.exp(-mouseDist * 0.2) * Math.sin(t * 3);
          value += influence * 0.5;
        }
        
        // Mapear valor para caractere
        const normalized = (value + 1) / 2; // Normaliza de [-1,1] para [0,1]
        const adjusted = Math.pow(normalized, 1 / density); // Ajusta densidade
        const charIndex = Math.floor(adjusted * characters.length);
        const clampedIndex = Math.max(0, Math.min(characters.length - 1, charIndex));
        
        result += characters[clampedIndex] || ' ';
      }
      result += '\n';
    }
    
    return result;
  };

  const exportPattern = () => {
    const pattern = generatePattern();
    const blob = new Blob([pattern], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pattern-${currentPattern}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const pattern = generatePattern();
    navigator.clipboard.writeText(pattern).then(() => {
      alert('Pattern copiado para a área de transferência!');
    });
  };

  const resetSettings = () => {
    setSpeed(5);
    setDensity(0.3);
    setScale(0.2);
    setWidth(60);
    setHeight(30);
    setCharacterPreset('blocks');
    setCharacters('█▓▒░·');
    setBackgroundColor('#F0EEE6');
    setTextColor('#333333');
    setFontSize(12);
    setTextInput('HELLO');
    setTextMode(false);
    setTextScale(8);
    setTextThickness(3);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLPreElement>) => {
    if (mouseInteraction) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="app-container">
      {/* Painel de Controle */}
      <div className="controls-panel">
        <div className="control-group">
          <h3>/EFFECTS</h3>
          <ul className="pattern-list">
            {Object.keys(patterns).map(name => (
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
            type="range" min="20" max="120" value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <div className="slider-control">
            <label>Height</label>
            <span>{height}</span>
          </div>
          <input
            type="range" min="10" max="60" value={height}
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
              setCharacters(e.target.value);
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
          onMouseDown={() => setMouseDown(true)}
          onMouseUp={() => setMouseDown(false)}
          onMouseLeave={() => setMouseDown(false)}
        >
          {generatePattern()}
        </pre>
      </div>
    </div>
  );
};

export default PatternGenerator;
