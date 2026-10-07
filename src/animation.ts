// Unidades de tempo do pattern por segundo. O app usava frame * 0.05 a 60 fps,
// o que dá 3 por segundo. Agora o tempo vem do relógio, então a velocidade
// é a mesma em telas de 60, 120 ou 144 Hz.
const PATTERN_TIME_PER_SECOND = 3;

// Duração de um frame a 60 fps. É a unidade do passo a passo.
export const FRAME_SECONDS = 1 / 60;

// Limite do passo entre dois quadros. Depois de trocar de aba, o primeiro
// quadro chega com um intervalo grande e a animação daria um salto.
const MAX_STEP_MS = 100;

// Avança o tempo de animação (em segundos) pelo intervalo decorrido
export const advanceTime = (seconds: number, elapsedMs: number): number =>
  seconds + Math.min(Math.max(elapsedMs, 0), MAX_STEP_MS) / 1000;

// Anda alguns frames para frente ou para trás, sem passar do início
export const stepTime = (seconds: number, frames: number): number =>
  Math.max(0, seconds + frames * FRAME_SECONDS);

export const toPatternTime = (seconds: number): number => seconds * PATTERN_TIME_PER_SECOND;
