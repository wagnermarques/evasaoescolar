# Evasão Escolar — front-end (Fase 1: protótipo de validação)

Interface do Sistema de Acompanhamento da Evasão Escolar, construída sobre o
App Shell [fzl-fund-appshell--lit](https://github.com/wagnermarques/fzl-fund-appshell--lit)
(RNF-08): Lit + Material Web, Vite, PWA, hash router.

Esta fase é o **protótipo de validação** da Iteração 3 do plano de Engenharia
de Requisitos (`03-validacao.org`, seção "Protótipos"). Os requisitos ainda são
`:HIPOTESE:`; o protótipo existe para validá-los com os stakeholders.

> **Só dados fictícios.** Alunos, turmas e notas são gerados por sorteio
> (`src/data/seed.js`) e ficam no localStorage do navegador. Não digite dados
> reais: isso depende dos "Pontos a negociar decorrentes do RNF-08" e do RNF-05 (LGPD).

## Rodar

```sh
git submodule update --init   # baixa o App Shell em ./appshell
npm install
npm run dev                   # http://localhost:5173
npm test                      # testes do motor de risco (vitest)
npm run build                 # gera dist/ (PWA)
```

**Deploy:** cada push na `main` que altere `frontend/` roda os testes e
publica no GitHub Pages (`.github/workflows/deploy.yml`), em
`https://wagnermarques.github.io/evasaoescolar/`. Requer, uma vez, em
*Settings → Pages*, a fonte "GitHub Actions".

A versão do App Shell é o commit do submódulo `appshell` (`git submodule status`).
O `package.json` depende dele como workspace npm.

## Telas (todas são rotas do App Shell)

| Rota                         | Tela                      | Requisitos                    |
|------------------------------|---------------------------|-------------------------------|
| `#/`                         | Painel                    | RU-01, RU-02                  |
| `#/frequencia?turma=&data=`  | Registrar frequência      | RF-01, RNF-01, RNF-03, CT-01  |
| `#/risco?turma=&nivel=&alertas=novos` | Alunos em risco  | RF-03, RF-04, RD-01           |
| `#/aluno/:id`                | Ficha do aluno            | RF-03, RF-05, RD-01           |
| `#/aluno/:id/intervencao`    | Registrar intervenção     | RF-05                         |
| `#/criterios`                | Critérios de risco        | RF-03                         |
| `#/sobre`                    | Sobre o protótipo         | —                             |
| `#/config/acessibilidade`    | (do App Shell)            | RNF-09                        |

- **RF-01:** todos começam presentes e um toque marca a falta. A tela
  cronometra do primeiro toque até salvar e mostra se ficou dentro dos 2 minutos do CT-01.
- **RF-03:** o indicador (0–100) é a média ponderada de quatro critérios
  (`src/services/risco.js`). Pesos e limiar se ajustam em `#/criterios`, com
  prévia antes de salvar. Os valores padrão são hipóteses a validar.
- **RF-04:** o sino do cabeçalho conta os alertas novos. O alerta passa a
  "visto" quando a ficha é aberta, e a "em acompanhamento" quando há intervenção.

## Estrutura

```
src/
  main.js                  createAppShell(): rotas, drawer, sino de alertas
  data/seed.js             gerador da escola fictícia
  services/risco.js        motor de risco (puro, testado em risco.test.js)
  services/dados-service.js  estado no localStorage + DadosController (Lit)
  webcomponents/*-view.js  uma tela por rota
```

## Fora desta fase

RF-02 (importação CSV), RF-06 (relatórios), RF-07 (exportação anonimizada),
RNF-04 (perfis e log de acesso), backend Supabase e login obrigatório. O GA4
do App Shell fica desligado (`analytics: null`) até se decidir sobre usuários menores de idade.
