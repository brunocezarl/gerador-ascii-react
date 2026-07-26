# ASCII Pattern Studio

Estúdio de patterns ASCII animados para designers e criativos. Gere composições
generativas em tempo real, misture-as com imagens e texto, e exporte em formatos
prontos para publicar.

## Features

- **16 patterns matemáticos** — waves, plasma, mandala, séries inspiradas em
  Almir Mavignier (arte óptica brasileira) e na proporção áurea/Fibonacci.
- **Blend de patterns** — misture dois patterns com um slider de mix e
  multiplique as possibilidades combinatórias.
- **Cor por gradiente** — mapeie a intensidade do pattern para um gradiente de
  duas cores, com paletas curadas (Ink, Terminal, Neon, Ocean, Sunset, Forest,
  Blueprint) ou cores customizadas.
- **Image-to-ASCII** — faça upload de uma imagem e misture a luminância dela com
  o pattern animado (slider de mix).
- **Text Mode** — escreva palavras com uma fonte vetorial própria, preenchidas
  pelo pattern animado.
- **Export profissional**
  - PNG em escala 1x–4x
  - SVG editável (texto real, abre no Figma/Illustrator)
  - GIF animado de 4s
  - TXT (e copiar para a área de transferência)
- **Link compartilhável** — todo o estado vive na URL; o botão *Share Link*
  copia um link que reproduz a composição exata.
- **Galeria de presets** — salve composições nomeadas com thumbnail
  (localStorage) e recarregue com um clique.
- **Interação** — influência do mouse ao arrastar, atalhos de teclado
  (`espaço` = play/pause, `R` = randomize) e layout responsivo.

## Rodando

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # build de produção
```

## Arquitetura

| Arquivo | Responsabilidade |
| --- | --- |
| `src/patterns.ts` | Biblioteca de patterns (função por célula + label) |
| `src/charsets.ts` | Presets de caracteres, do denso ao leve |
| `src/textmask.ts` | Fonte vetorial e máscara do Text Mode |
| `src/engine.ts` | Motor: campo de valores (com blend), pintura em canvas, geração de SVG, LUT de cores, paletas, amostragem de imagem |
| `src/exporters.ts` | Download de arquivos, encoding de GIF (via `gifenc`) |
| `src/urlState.ts` | Serialização do estado no hash da URL |
| `src/presets.ts` | Galeria de presets do usuário em localStorage |
| `src/App.tsx` | UI e orquestração |

Para adicionar um pattern novo, basta registrar uma entrada em
`src/patterns.ts` com `label` e `fn(x, y, t, params)` retornando um valor em
torno de `[-1, 1]` — ele aparece automaticamente na lista e nos exports.
