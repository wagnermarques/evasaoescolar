import { html } from 'lit'
import { createAppShell, pattern } from 'fzl-fund-appshell--lit'
import 'fzl-fund-appshell--lit/styles/theme.css'
import appshell from '../appshell.config.js'
import { dadosService } from './services/dados-service.js'
import './webcomponents/md-imports.js'
import './webcomponents/alertas-indicador.js'
import './webcomponents/painel-view.js'
import './webcomponents/frequencia-view.js'
import './webcomponents/risco-view.js'
import './webcomponents/aluno-view.js'
import './webcomponents/intervencao-view.js'
import './webcomponents/criterios-view.js'
import './webcomponents/sobre-view.js'

const nomeDoAluno = ({ params }) => dadosService.estado.alunos.find((a) => a.id === params.id)?.nome ?? 'Aluno'

createAppShell({
  mount: '#app',
  title: appshell.title,
  home: () => html`<painel-view></painel-view>`,

  // Todas as telas são rotas do App Shell (critério de aceitação do RNF-08).
  routes: [
    {
      name: 'frequencia',
      title: 'Registrar frequência',
      match: pattern('frequencia'),
      render: ({ query }) => html`<frequencia-view .turmaId=${query.turma ?? ''} .data=${query.data ?? ''}></frequencia-view>`,
    },
    {
      name: 'risco',
      title: 'Alunos em risco',
      match: pattern('risco'),
      render: ({ query }) =>
        html`<risco-view .turma=${query.turma ?? ''} .nivel=${query.nivel ?? 'risco'} .alertas=${query.alertas ?? ''}></risco-view>`,
    },
    {
      name: 'aluno-intervencao',
      title: (rota) => `Registrar intervenção — ${nomeDoAluno(rota)}`,
      match: pattern('aluno/:id/intervencao'),
      render: ({ params }) => html`<intervencao-view .alunoId=${params.id}></intervencao-view>`,
    },
    {
      name: 'aluno',
      title: nomeDoAluno,
      match: pattern('aluno/:id'),
      render: ({ params }) => html`<aluno-view .alunoId=${params.id}></aluno-view>`,
    },
    {
      name: 'criterios',
      title: 'Critérios de risco',
      match: pattern('criterios'),
      render: () => html`<criterios-view></criterios-view>`,
    },
    {
      name: 'sobre',
      title: 'Sobre o protótipo',
      match: pattern('sobre'),
      render: () => html`<sobre-view></sobre-view>`,
    },
  ],

  drawer: {
    sections: [
      {
        id: 'acompanhamento',
        label: 'Acompanhamento',
        items: [
          { label: 'Painel', icon: 'dashboard', href: '#/' },
          { label: 'Registrar frequência', icon: 'fact_check', href: '#/frequencia' },
          { label: 'Alunos em risco', icon: 'warning', href: '#/risco' },
        ],
      },
      {
        id: 'coordenacao',
        label: 'Coordenação',
        items: [{ label: 'Critérios de risco', icon: 'tune', href: '#/criterios' }],
      },
      {
        id: 'prototipo',
        label: 'Protótipo',
        items: [{ label: 'Sobre o protótipo', icon: 'info', href: '#/sobre' }],
      },
    ],
  },

  headerActions: () => html`<alertas-indicador></alertas-indicador>`,

  // Sem analytics nesta fase: o uso de GA4 com usuários menores de idade é
  // um dos "Pontos a negociar decorrentes do RNF-08".
  analytics: null,
})
