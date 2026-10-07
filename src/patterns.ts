// Parâmetros recebidos por cada pattern
export interface PatternParams {
  scale: number;
  speed: number;
  width: number;
  height: number;
  density: number;
}

export type PatternFunction = (x: number, y: number, t: number, params: PatternParams) => number;

// Biblioteca de patterns. Cada função devolve um valor que o renderer
// converte em caractere; o ideal é ficar entre -1 e 1.
export const patterns = {
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

    // A soma das pétalas pode passar de 5; tanh a comprime para (-1, 1) sem cortar o gradiente
    return Math.tanh(petalPattern) * 0.8 + centerPattern * 0.2;
  }
} satisfies Record<string, PatternFunction>;

export type PatternName = keyof typeof patterns;
