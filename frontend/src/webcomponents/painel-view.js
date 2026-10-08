import { LitElement, html, css } from 'lit'
import { href } from 'fzl-fund-appshell--lit'
import { DadosController, dadosService, hojeISO } from '../services/dados-service.js'
import { FREQUENCIA_MINIMA_LEGAL } from '../services/risco.js'
import { tipoDeIntervencao } from '../services/intervencoes.js'
import { formatarData, formatarPercentual, plural } from '../services/formato.js'
import { pagina } from './estilos.js'

/** Home: visão geral para a coordenação (RU-01, RU-02) e atalhos para as telas do protótipo. */
export class PainelView extends LitElement {
  static styles = [
    pagina,
    css`
      .indicadores {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }
      .indicador {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      a.indicador:hover,
      a.indicador:focus-visible {
        border-color: var(--md-sys-color-primary);
      }
      .indicador .valor {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1.1;
      }
      .indicador .rotulo {
        color: var(--md-sys-color-on-surface-variant);
        font-size: 0.9rem;
      }
      .indicador.destaque {
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
        border-color: var(--md-sys-color-error);
      }
      .indicador.destaque .rotulo {
        color: inherit;
      }
      .tabela {
        overflow-x: auto;
        /* Containing block do .visualmente-oculto (absolute) do cabeçalho:
           sem isso ele escapa do overflow e alarga a página no celular. */
        position: relative;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
      }
      th,
      td {
        text-align: left;
        padding: 10px 8px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        white-space: nowrap;
      }
      th {
        color: var(--md-sys-color-on-surface-variant);
        font-weight: 600;
        font-size: 0.85rem;
      }
      td.num,
      th.num {
        text-align: right;
      }
      td a {
        margin-right: 12px;
      }
      ul.lista {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      ul.lista li {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
      }
      ul.lista li:last-child {
        border-bottom: none;
      }
      .data {
        min-width: 92px;
        font-variant-numeric: tabular-nums;
      }
      .atrasado {
        color: var(--md-sys-color-error);
        font-weight: 600;
      }
      .nome {
        flex: 1;
        min-width: 0;
      }
      .nome small {
        display: block;
        color: var(--md-sys-color-on-surface-variant);
      }
      .colunas {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 0 24px;
      }
    `,
  ]

  constructor() {
    super()
    new DadosController(this)
  }

  render() {
    const { estado } = dadosService
    const avaliacao = dadosService.avaliacao()
    const emRisco = avaliacao.filter((i) => i.risco.nivel.id === 'risco')
    const alertasNovos = dadosService.alertasNovos()
    const freqMedia = avaliacao.reduce((s, i) => s + i.frequencia.percentual, 0) / (avaliacao.length || 1)

    return html`
      <h1>Painel</h1>
      <p class="subtitulo">${estado.escola.nome}</p>

      <div class="aviso" role="note">
        <md-icon aria-hidden="true">science</md-icon>
        <div>
          <strong>Protótipo de validação — dados fictícios.</strong> Esta versão serve para os stakeholders
          experimentarem as telas e validarem os requisitos. Nenhum dado real deve ser digitado aqui.
          <a href="#/sobre">Saiba mais</a>
        </div>
      </div>

      <div class="indicadores">
        <div class="cartao indicador">
          <div class="valor">${avaliacao.length}</div>
          <div class="rotulo">alunos em ${plural(estado.turmas.length, 'turma')}</div>
        </div>
        <a class="cartao indicador ${emRisco.length ? 'destaque' : ''}" href=${href('risco')}>
          <div class="valor">${emRisco.length}</div>
          <div class="rotulo">em risco de evasão</div>
        </a>
        <a class="cartao indicador" href=${href('risco', { alertas: 'novos' })}>
          <div class="valor">${alertasNovos}</div>
          <div class="rotulo">${alertasNovos === 1 ? 'alerta novo' : 'alertas novos'}</div>
        </a>
        <div class="cartao indicador">
          <div class="valor">${formatarPercentual(freqMedia)}</div>
          <div class="rotulo">frequência média</div>
        </div>
      </div>

      <div class="acoes">
        <md-filled-button href=${href('frequencia')}>
          <md-icon slot="icon">fact_check</md-icon>
          Registrar frequência
        </md-filled-button>
        <md-outlined-button href=${href('risco')}>
          <md-icon slot="icon">warning</md-icon>
          Ver alunos em risco
        </md-outlined-button>
      </div>

      <h2>Turmas</h2>
      <div class="tabela cartao">${this._tabelaTurmas(avaliacao)}</div>

      <div class="colunas">
        <section>
          <h2>Próximos acompanhamentos</h2>
          ${this._proximosAcompanhamentos()}
        </section>
        <section>
          <h2>Maiores indicadores de risco</h2>
          ${this._maioresRiscos(emRisco)}
        </section>
      </div>
    `
  }

  _tabelaTurmas(avaliacao) {
    const hoje = hojeISO()
    return html`
      <table>
        <thead>
          <tr>
            <th scope="col">Turma</th>
            <th scope="col" class="num">Alunos</th>
            <th scope="col" class="num">Frequência média</th>
            <th scope="col" class="num">Abaixo de 75%</th>
            <th scope="col" class="num">Em risco</th>
            <th scope="col">Chamada de hoje</th>
            <th scope="col"><span class="visualmente-oculto">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          ${dadosService.estado.turmas.map((turma) => {
            const daTurma = avaliacao.filter((i) => i.turma.id === turma.id)
            const media = daTurma.reduce((s, i) => s + i.frequencia.percentual, 0) / (daTurma.length || 1)
            const abaixo = daTurma.filter((i) => i.frequencia.percentual < FREQUENCIA_MINIMA_LEGAL).length
            const risco = daTurma.filter((i) => i.risco.nivel.id === 'risco').length
            const feita = dadosService.chamada(turma.id, hoje) !== null
            return html`
              <tr>
                <th scope="row">${turma.nome} <small>(${turma.turno})</small></th>
                <td class="num">${daTurma.length}</td>
                <td class="num">${formatarPercentual(media)}</td>
                <td class="num">${abaixo}</td>
                <td class="num">${risco ? html`<span class="selo risco">${risco}</span>` : '0'}</td>
                <td>${feita ? 'Registrada' : html`<span class="vazio">Pendente</span>`}</td>
                <td>
                  <a href=${href('frequencia', { turma: turma.id })}>Chamada</a>
                  <a href=${href('risco', { turma: turma.id, nivel: 'todos' })}>Alunos</a>
                </td>
              </tr>
            `
          })}
        </tbody>
      </table>
    `
  }

  _proximosAcompanhamentos() {
    const lista = dadosService.proximosAcompanhamentos().slice(0, 6)
    if (!lista.length) return html`<p class="vazio">Nenhum acompanhamento agendado.</p>`
    const hoje = hojeISO()
    const alunos = new Map(dadosService.estado.alunos.map((a) => [a.id, a]))
    return html`
      <ul class="lista">
        ${lista.map((i) => {
          const aluno = alunos.get(i.alunoId)
          const atrasado = i.proximoAcompanhamento < hoje
          return html`
            <li>
              <span class="data ${atrasado ? 'atrasado' : ''}">
                ${formatarData(i.proximoAcompanhamento)}${atrasado ? html`<br /><small>atrasado</small>` : ''}
              </span>
              <span class="nome">
                <a href=${href(`aluno/${i.alunoId}`)}>${aluno?.nome ?? 'Aluno removido'}</a>
                <small>Após: ${tipoDeIntervencao(i.tipo).label}</small>
              </span>
            </li>
          `
        })}
      </ul>
    `
  }

  _maioresRiscos(emRisco) {
    if (!emRisco.length) return html`<p class="vazio">Nenhum aluno acima do limiar de risco.</p>`
    return html`
      <ul class="lista">
        ${emRisco.slice(0, 6).map(
          ({ aluno, turma, risco, alerta }) => html`
            <li>
              <span class="nome">
                <a href=${href(`aluno/${aluno.id}`)}>${aluno.nome}</a>
                <small>${turma.nome}</small>
              </span>
              ${alerta === 'novo' ? html`<span class="selo novo">Novo</span>` : ''}
              <span class="selo risco">${risco.indicador}</span>
            </li>
          `,
        )}
      </ul>
      ${emRisco.length > 6 ? html`<p><a href=${href('risco')}>Ver todos os ${emRisco.length}</a></p>` : ''}
    `
  }
}

customElements.define('painel-view', PainelView)
