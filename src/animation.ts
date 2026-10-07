// Unidades de tempo do pattern por segundo. O app usava frame * 0.05 a 60 fps,
// o que dá 3 por segundo. Agora o tempo vem do relógio, então a velocidade
// é a mesma em telas de 60, 120 ou 144 Hz.
const PATTERN_TIME_PER_SECOND = 3;

// Limite do passo entre dois quadros. Depois de trocar de aba, o primeiro
// quadro chega com um intervalo grande e a animação daria um salto.
const MAX_STEP_MS = 100;

// Avança o tempo de animação (em segundos) pelo intervalo decorrido
export const advanceTime = (seconds: number, elapsedMs: number): number =>
  seconds + Math.min(Math.max(elapsedMs, 0), MAX_STEP_MS) / 1000;

export const toPatternTime = (seconds: number): number => seconds * PATTERN_TIME_PER_SECOND;
