import { LitElement, html, css } from 'lit'
import { href } from 'fzl-fund-appshell--lit'
import { announce } from 'fzl-fund-appshell--lit/a11y'
import { DadosController, dadosService } from '../services/dados-service.js'
import { CRITERIOS, CRITERIOS_PADRAO, avaliarAlunos } from '../services/risco.js'
import { plural } from '../services/formato.js'
import { pagina } from './estilos.js'

/**
 * RF-03 — critérios e pesos configuráveis pela coordenação. A prévia
 * recalcula a lista a cada ajuste, antes de salvar (critério de aceitação:
 * "alterar um peso recalcula os indicadores e a lista de risco reflete a mudança").
 */
export class CriteriosView extends LitElement {
  static properties = {
    _rascunho: { state: true },
  }

  static styles = [
    pagina,
    css`
      :host {
        max-width: 760px;
      }
      .criterio {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 2px 16px;
        padding: 12px 0;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
      }
      .criterio:last-of-type {
        border-bottom: none;
      }
      .criterio label {
        font-weight: 600;
      }
      .criterio .parte {
        color: var(--md-sys-color-on-surface-variant);
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .criterio p {
        grid-column: 1 / -1;
        margin: 0;
        font-size: 0.875rem;
        color: var(--md-sys-color-on-surface-variant);
      }
      md-slider {
        grid-column: 1 / -1;
        width: 100%;
        margin: 0 -8px;
      }
      .previa {
        position: sticky;
        bottom: 0;
        margin: 16px -16px 0;
        padding: 12px 16px;
        background: var(--md-sys-color-surface);
        border-top: 1px solid var(--md-sys-color-outline-variant);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 16px;
      }
      .previa .numeros {
        font-variant-numeric: tabular-nums;
      }
      .previa .acoes {
        margin: 0;
      }
    `,
  ]

  constructor() {
    super()
    new DadosController(this)
    this._rascunho = structuredClone(dadosService.estado.criterios)
  }

  render() {
    const salvos = dadosService.estado.criterios
    const r = this._rascunho
    const total = CRITERIOS.reduce((s, c) => s + r.pesos[c.id], 0)
    const alterado = JSON.stringify(r) !== JSON.stringify(salvos)
    const emRisco = (criterios) =>
      avaliarAlunos(dadosService.estado, criterios).filter((i) => i.risco.nivel.id === 'risco').length
    const antes = emRisco(salvos)
    const depois = alterado ? emRisco(r) : antes

    return html`
      <h1>Critérios de risco</h1>
      <p class="subtitulo">
        Cada critério dá um sinal de 0 a 100%. O indicador do aluno é a média desses sinais ponderada pelos pesos
        abaixo. Os valores iniciais são uma <strong>hipótese</strong> a validar com a coordenação.
      </p>

      <section class="cartao" aria-labelledby="t-pesos">
        <h2 id="t-pesos" style="margin-top: 0">Pesos</h2>
        ${total === 0
          ? html`<div class="aviso erro" role="alert">
              <md-icon aria-hidden="true">warning</md-icon>
              <div>Com todos os pesos em zero, nenhum aluno é apontado em risco.</div>
            </div>`
          : ''}
        ${CRITERIOS.map(
          (c) => html`
            <div class="criterio">
              <label id="l-${c.id}">${c.label}</label>
              <span class="parte">${total ? Math.round((r.pesos[c.id] * 100) / total) : 0}% do indicador</span>
              <md-slider
                aria-labelledby="l-${c.id}"
                min="0"
                max="100"
                step="5"
                labeled
                .value=${r.pesos[c.id]}
                @input=${(e) => this._mudar({ pesos: { ...r.pesos, [c.id]: Number(e.target.value) } })}
              ></md-slider>
              <p>${c.descricao}</p>
            </div>
          `,
        )}
      </section>

      <h2 id="t-limiar">Limiar de risco</h2>
      <section class="cartao">
        <div class="criterio">
          <label id="l-limiar">Em risco a partir de</label>
          <span class="parte">${r.limiar} de 100</span>
          <md-slider
            aria-labelledby="l-limiar"
            min="10"
            max="90"
            step="5"
            labeled
            .value=${r.limiar}
            @input=${(e) => this._mudar({ limiar: Number(e.target.value) })}
          ></md-slider>
          <p>
            Alunos com indicador igual ou acima deste valor geram alerta para a coordenação (RF-04). Os 20 pontos
            abaixo dele formam a faixa de atenção.
          </p>
        </div>
      </section>

      <div class="previa">
        <span class="numeros" role="status">
          ${alterado
            ? html`Com estes critérios: <strong>${plural(depois, 'aluno')}</strong> em risco (hoje: ${antes}).`
            : html`<strong>${plural(antes, 'aluno')}</strong> em risco. <a href=${href('risco')}>Ver lista</a>`}
        </span>
        <div class="acoes">
          <md-text-button @click=${this._padrao}>Restaurar padrão</md-text-button>
          <md-outlined-button ?disabled=${!alterado} @click=${this._descartar}>Descartar</md-outlined-button>
          <md-filled-button ?disabled=${!alterado} @click=${this._salvar}>Salvar</md-filled-button>
        </div>
      </div>
    `
  }

  _mudar(mudanca) {
    this._rascunho = { ...this._rascunho, ...mudanca }
  }

  _padrao() {
    this._rascunho = structuredClone(CRITERIOS_PADRAO)
  }

  _descartar() {
    this._rascunho = structuredClone(dadosService.estado.criterios)
  }

  _salvar() {
    dadosService.salvarCriterios(this._rascunho)
    announce('Critérios salvos. Os indicadores foram recalculados.')
  }
}

customElements.define('criterios-view', CriteriosView)
