# Jogos IEQ

Histórias da Bíblia em jogos de pixel art 16-bit, para jogar no celular (deitado) ou no computador.

## Jogos

- **Modo história** com fases de plataforma, cenas entre capítulos e desafios:
  Davi (6 capítulos), Sansão (6), Pedro (6), Noé (5), José do Egito (7) e Jesus: o caminho (11).
- **Mais aventuras de Jesus:** Missões de Jesus, O Carpinteiro e Corrida da Fé.

Os jogos musicais (Jesus na Banda e o treino musical) ficam no app AuraPads.

## Rodar

```bash
npm install
npm run dev
```

`npm run build` gera o site em `dist/` (Vite + React + Tailwind).

## Estrutura

- `src/games/pixel` — kit compartilhado: palco, controles, diálogos, modo história.
- `src/games/platform` — motor de plataforma, personagens (`rig.ts`), céu e cenas de transição.
- `src/games/<saga>` — conteúdo e desafios de cada história.
- `src/games/bgm.ts` — música de fundo.
- `public/sprites` — sprite sheets (PNG + JSON) geradas a partir de `rig.ts`; prévias em `docs/sprites-preview`.

## Créditos

Músicas dos jogos: Purrple Cat ([purrplecat.com](https://purrplecat.com)), licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), convertidas para mono e comprimidas.
