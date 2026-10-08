import { LitElement, html, css } from 'lit'
import { href } from 'fzl-fund-appshell--lit'
import { DadosController, dadosService } from '../services/dados-service.js'
import { FREQUENCIA_MINIMA_LEGAL } from '../services/risco.js'
import { tipoDeIntervencao } from '../services/intervencoes.js'
import { formatarData, formatarDataCurta, formatarNota, formatarPercentual, plural } from '../services/formato.js'
import { pagina } from './estilos.js'

const ULTIMAS_AULAS = 20

/**
 * Ficha do aluno: indicador de risco com o detalhamento por critério
 * (RF-03), frequência (RF-01, RD-01), notas e histórico de intervenções (RF-05).
 * Abrir a ficha de um aluno com alerta novo marca o alerta como visto (RF-04).
 */
export class AlunoView extends LitElement {
  static properties = {
    alunoId: {},
  }

  static styles = [
    pagina,
    css`
      .voltar {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        text-decoration: none;
        margin-bottom: 4px;
      }
      header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .placar {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .placar .valor {
        font-size: 2.4rem;
        font-weight: 700;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .placar small {
        display: block;
        color: var(--md-sys-color-on-surface-variant);
      }
      .grade {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      .cartao h2 {
        margin-top: 0;
      }
      .cartao dl + h2 {
        margin-top: 24px;
      }
      .fator {
        margin: 0 0 14px;
      }
      .fator .topo {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 4px;
      }
      .fator .pontos {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        white-space: nowrap;
      }
      .fator small {
        color: var(--md-sys-color-on-surface-variant);
      }
      dl {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 6px 16px;
        margin: 0;
      }
      dt {
        color: var(--md-sys-color-on-surface-variant);
      }
      dd {
        margin: 0;
        font-weight: 600;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .tira {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin: 16px 0 4px;
        padding: 0;
        list-style: none;
      }
      .tira li {
        width: 22px;
        height: 22px;
        border-radius: 4px;
        display: grid;
        place-items: center;
        font-size: 0.7rem;
        font-weight: 700;
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
      }
      .tira li.falta {
        background: var(--md-sys-color-error);
        color: var(--md-sys-color-on-error);
      }
      .legenda {
        font-size: 0.8rem;
        color: var(--md-sys-color-on-surface-variant);
      }
      .intervencoes-topo {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 32px 0 12px;
      }
      .intervencoes-topo h2 {
        margin: 0;
      }
      ol.linha-do-tempo {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 12px;
      }
      ol.linha-do-tempo li {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 4px 12px;
      }
      ol.linha-do-tempo md-icon {
        grid-row: span 3;
        color: var(--md-sys-color-primary);
      }
      .meta {
        font-size: 0.85rem;
        color: var(--md-sys-color-on-surface-variant);
      }
      ol.linha-do-tempo p {
        margin: 2px 0;
        line-height: 1.5;
      }
    `,
  ]

  constructor() {
    super()
    new DadosController(this)
    this.alunoId = ''
  }

  updated(changed) {
    if (changed.has('alunoId') && dadosService.avaliacaoDoAluno(this.alunoId)?.alerta === 'novo') {
      dadosService.marcarAlertaVisto(this.alunoId)
    }
  }

  render() {
    const item = dadosService.avaliacaoDoAluno(this.alunoId)
    if (!item) {
      return html`
        <h1>Aluno não encontrado</h1>
        <p>Talvez os dados de demonstração tenham sido restaurados.</p>
        <md-filled-button href=${href('risco')}>Ver alunos em risco</md-filled-button>
      `
    }
    const { aluno, turma, frequencia, risco } = item

    return html`
      <a class="voltar" href=${href('risco', { turma: turma.id, nivel: 'todos' })}>
        <md-icon aria-hidden="true">arrow_back</md-icon> Alunos de ${turma.nome}
      </a>
      <header>
        <div>
          <h1>${aluno.nome}</h1>
          <p class="subtitulo">${turma.nome} · ${turma.turno}</p>
        </div>
        <div class="placar">
          <div>
            <div class="valor">${risco.indicador}</div>
            <small>indicador de risco</small>
          </div>
          <span class="selo ${risco.nivel.id}">${risco.nivel.label}</span>
        </div>
      </header>

      ${frequencia.percentual < FREQUENCIA_MINIMA_LEGAL
        ? html`<div class="aviso erro" role="note">
            <md-icon aria-hidden="true">gavel</md-icon>
            <div>
              Frequência abaixo do mínimo legal de 75% (LDB, art. 24, VI): ${formatarPercentual(frequencia.percentual)}.
            </div>
          </div>`
        : ''}

      <div class="grade">
        <section class="cartao" aria-labelledby="t-fatores">
          <h2 id="t-fatores">Por que este indicador</h2>
          ${risco.fatores.map(
            (f) => html`
              <div class="fator">
                <div class="topo">
                  <span>${f.label}</span>
                  <span class="pontos">+${Math.round(f.contribuicao)} pts</span>
                </div>
                <div class="barra ${risco.nivel.id}" aria-hidden="true">
                  <span style="width: ${Math.round(f.pontuacao * 100)}%"></span>
                </div>
                <small>Sinal ${Math.round(f.pontuacao * 100)}% · peso ${f.peso}</small>
              </div>
            `,
          )}
          <a href=${href('criterios')}>Ajustar critérios e pesos</a>
        </section>

        <section class="cartao" aria-labelledby="t-frequencia">
          <h2 id="t-frequencia">Frequência</h2>
          <dl>
            <dt>Frequência acumulada</dt>
            <dd>${formatarPercentual(frequencia.percentual)}</dd>
            <dt>Aulas registradas</dt>
            <dd>${frequencia.aulas}</dd>
            <dt>Faltas</dt>
            <dd>${frequencia.faltas}</dd>
            <dt>Faltas seguidas (até hoje)</dt>
            <dd>${frequencia.faltasConsecutivas}</dd>
          </dl>
          ${this._tira(frequencia.historico)}
        </section>

        <section class="cartao" aria-labelledby="t-notas">
          <h2 id="t-notas">Desempenho</h2>
          <dl>
            ${aluno.notas.map(
              (n) => html`
                <dt>Média do ${n.bimestre}º bimestre</dt>
                <dd>${formatarNota(n.media)}</dd>
              `,
            )}
          </dl>
          <h2>Responsável</h2>
          <dl>
            <dt>Nome</dt>
            <dd>${aluno.responsavel}</dd>
            <dt>Telefone</dt>
            <dd>${aluno.telefone}</dd>
          </dl>
        </section>
      </div>

      ${this._intervencoes(aluno)}
    `
  }

  _tira(historico) {
    const ultimas = historico.slice(-ULTIMAS_AULAS)
    if (!ultimas.length) return ''
    const faltas = ultimas.filter((h) => !h.presente).length
    return html`
      <p class="visualmente-oculto">
        Nas últimas ${ultimas.length} aulas: ${plural(faltas, 'falta')}.
      </p>
      <ul class="tira" aria-hidden="true">
        ${ultimas.map(
          (h) => html`<li class=${h.presente ? '' : 'falta'} title="${formatarDataCurta(h.data)}: ${h.presente ? 'presente' : 'falta'}">
            ${h.presente ? 'P' : 'F'}
          </li>`,
        )}
      </ul>
      <div class="legenda" aria-hidden="true">Últimas ${ultimas.length} aulas, da mais antiga para a mais recente</div>
    `
  }

  _intervencoes(aluno) {
    const lista = dadosService.intervencoesDoAluno(aluno.id)
    return html`
      <div class="intervencoes-topo">
        <h2 id="t-intervencoes">Intervenções</h2>
        <md-filled-button href=${href(`aluno/${aluno.id}/intervencao`)}>
          <md-icon slot="icon">add</md-icon>
          Registrar intervenção
        </md-filled-button>
      </div>
      ${lista.length
        ? html`<ol class="linha-do-tempo cartao" aria-labelledby="t-intervencoes">
            ${lista.map((i) => {
              const tipo = tipoDeIntervencao(i.tipo)
              return html`
                <li>
                  <md-icon aria-hidden="true">${tipo.icon}</md-icon>
                  <strong>${tipo.label}</strong>
                  <span class="meta">${formatarData(i.data)} · ${i.responsavel}</span>
                  <div>
                    <p>${i.descricao}</p>
                    ${i.resultado ? html`<p><strong>Resultado:</strong> ${i.resultado}</p>` : ''}
                    ${i.proximoAcompanhamento
                      ? html`<p class="meta">Próximo acompanhamento: ${formatarData(i.proximoAcompanhamento)}</p>`
                      : ''}
                  </div>
                </li>
              `
            })}
          </ol>`
        : html`<p class="vazio">Nenhuma intervenção registrada.</p>`}
    `
  }
}

customElements.define('aluno-view', AlunoView)
