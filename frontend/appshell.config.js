// Config declarativa do appshell (RNF-08) — lida pelo vite.config.js (build)
// e pelo src/main.js. Só valores simples aqui: o vite.config.js roda no Node.
// Acessibilidade conforme RNF-09: as duas fontes, os quatro temas e texto de 1x a 2x.
import { defineAppShellConfig } from 'fzl-fund-appshell--lit/config'

export default defineAppShellConfig({
  title: 'Evasão Escolar',
  accessibility: {
    fonts: ['atkinson', 'opendyslexic'],
    themes: ['light', 'dark', 'high-contrast-light', 'high-contrast-dark'],
    textScale: { min: 1, max: 2 },
    defaults: { font: 'system', theme: 'system', textScale: 1 },
  },
})
