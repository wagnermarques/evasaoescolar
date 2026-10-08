import { defineConfig, mergeConfig } from 'vite'
import { appshellConfig } from 'fzl-fund-appshell--lit/vite'
import appshell from './appshell.config.js'

export default defineConfig(
  mergeConfig(
    appshellConfig({
      ...appshell,
      // GitHub Pages serve o app em /evasaoescolar/ (definido no workflow de
      // deploy); localmente fica na raiz.
      base: process.env.APP_BASE ?? '/',
      manifest: {
        name: 'Evasão Escolar — Acompanhamento',
        short_name: 'Evasão Escolar',
        description: 'Protótipo do sistema de acompanhamento da evasão escolar - GEPIS',
        background_color: '#fffbfe',
        theme_color: '#6750a4',
        icons: [
          { src: 'icons/icon-48.png', sizes: '48x48', type: 'image/png' },
          { src: 'icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
    {
      // Os testes (vitest) cobrem só a lógica pura de src/services — o
      // appshell tem a sua própria suíte.
      test: { include: ['src/**/*.test.js'] },
    },
  ),
)
