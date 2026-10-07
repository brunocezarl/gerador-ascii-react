# Gerador ASCII

Gerador de patterns ASCII animados que roda no navegador. Escolha um efeito, um set de caracteres e uma paleta, ajuste a grade e exporte o resultado como texto, imagem, SVG ou vídeo.

## Recursos

- **16 patterns** animados, de ondas e espirais a padrões inspirados em Almir Mavignier e na proporção áurea.
- **10 sets de caracteres** (blocos, pontos, braille, geométricos...) e um set personalizado.
- **Text Mode:** desenha um texto dentro da arte. Aceita letras acentuadas do português (Ç, Ã, É...). Caracteres sem desenho aparecem listados na interface.
- **Interação com o mouse ou o toque:** segure o clique (ou arraste o dedo) sobre a arte para distorcê-la.
- **Passo a passo:** com a animação pausada, avance ou volte um frame.
- **Paletas:** nove pares de fundo e texto, com contraste verificado. Cores próprias também são aceitas.
- **Aleatorizar:** sorteia padrão, caracteres, paleta e valores dos sliders.
- **Presets salvos:** guarde configurações com um nome. Ficam neste navegador.
- **Compartilhar:** a configuração fica na URL. O botão "Copiar link" copia o endereço atual.
- **Exportar:** `.txt`, `.svg` (vetorial, com cores), `.png` (2x) e vídeo de 6 segundos (WebM ou MP4, conforme o navegador).
- **Responsivo:** em celular, a arte fica no topo e os controles embaixo. A fonte diminui sozinha quando a grade não cabe no painel.

## Como rodar

Requisitos: Node.js 22.13 ou mais recente (exigido pelo ESLint 10 e pelo Vitest 5).

```bash
npm install
npm run dev       # servidor de desenvolvimento
```

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run build` | Checa os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Serve a versão gerada pelo `build` |
| `npm test` | Roda os testes unitários (Vitest) |
| `npm run lint` | Roda o ESLint |

## Compartilhar uma configuração

Os parâmetros da URL só aparecem quando o valor difere do padrão. Um link sem mudanças fica limpo.

| Parâmetro | Valores | Campo |
| --- | --- | --- |
| `pattern` | nome de um dos 16 patterns, ex.: `golden_petals` | padrão |
| `speed` | 1 a 20 | velocidade |
| `density` | 0.1 a 2 (passo 0.1) | densidade |
| `scale` | 0.05 a 1 (passo 0.05) | escala |
| `width` / `height` | 20 a 120 / 10 a 60 | tamanho da grade |
| `font` | 8 a 24 | tamanho da fonte (pode diminuir sozinho para caber) |
| `chars` | `blocks`, `dots`, `circles`, `squares`, `lines`, `gradients`, `minimal`, `ascii`, `braille`, `geometric` ou `custom` | set de caracteres |
| `custom` | até 200 caracteres (só com `chars=custom`) | caracteres personalizados |
| `bg` / `fg` | cor hexadecimal sem `#`, ex.: `0d0221` | fundo e texto |
| `animate` | `1` ou `0` | animação ligada |
| `mouse` | `1` ou `0` | interação com o mouse |
| `textmode` | `1` ou `0` | Text Mode |
| `text` | até 40 caracteres (vira maiúsculas) | texto do Text Mode |
| `textsize` | 4 a 15 | tamanho do texto |
| `thickness` | 1 a 8 | espessura do traço |

Valores inválidos são ignorados, e números fora do intervalo são ajustados para o limite mais próximo.

Exemplo: `http://localhost:5173/?pattern=golden_petals&speed=7&bg=0d0221&fg=ff2e88`

## Presets salvos

Os presets ficam no `localStorage` do navegador, na chave `gerador-ascii:presets`. Não há sincronização entre dispositivos. Para levar um preset a outro lugar, use o link.

## Estrutura

```
src/
├── App.tsx              # Tela principal: estado, efeitos e interface
├── App.css
├── main.tsx             # Ponto de entrada
├── patterns.ts          # Os 16 patterns (funções de valor por célula)
├── renderAscii.ts       # Converte o valor de cada célula em caractere
├── presets.ts           # Sets de caracteres
├── palettes.ts          # Paletas de fundo e texto
├── settings.ts          # Configuração completa, limites dos sliders e codificação da URL
├── randomize.ts         # Aleatorizar
├── savedPresets.ts      # Presets salvos no navegador
├── textMask.ts          # Máscara do Text Mode (fonte vetorial, acentos)
├── strokeFont.ts        # Desenho das letras e números
├── fit.ts               # Encaixe da fonte no painel
├── animation.ts         # Relógio da animação e passo a passo
├── exporter.ts          # SVG, PNG, vídeo e download
└── components/
    ├── Slider.tsx
    └── SavedPresetsPanel.tsx
```

Os módulos de lógica não dependem do React, e os que têm comportamento testável têm um `.test.ts` ao lado. `presets.ts` e `strokeFont.ts` são só dados.

## Stack

React 18, TypeScript, Vite 8 (com o plugin do React 6), Vitest 5 e ESLint 10.

## Limitações

- **Vídeo:** depende de `MediaRecorder` e de `canvas.captureStream`. Em navegadores que não suportam, o botão fica desabilitado. A gravação leva os 6 segundos reais.
- **Copiar:** o clipboard exige contexto seguro (HTTPS ou `localhost`). Sem ele, o app mostra uma mensagem e você pode usar a exportação.
- **Acentos no Text Mode:** cobrem agudo, grave, circunflexo, til, trema e cedilha. Outros caracteres aparecem na lista de "ignorados".
- **Fonte:** a arte usa `Courier New` (ou fallback monoespaçado). Outras fontes podem mudar a proporção do Text Mode.
