import { LitElement, html, css } from 'lit'
import { href, navigate } from 'fzl-fund-appshell--lit'
import { DadosController, dadosService } from '../services/dados-service.js'
import { formatarPercentual, plural } from '../services/formato.js'
import { pagina } from './estilos.js'

const FILTROS_NIVEL = [
  { id: 'risco', label: 'Em risco' },
  { id: 'atencao', label: 'Atenção' },
  { id: 'todos', label: 'Todos' },
]

const SITUACAO_ALERTA = {
  novo: { classe: 'novo', label: 'Alerta novo', icon: 'notification_important' },
  visto: { classe: 'risco', label: 'Sem intervenção', icon: 'pending' },
  acompanhamento: { classe: 'acompanhamento', label: 'Em acompanhamento', icon: 'support_agent' },
}

/**
 * RF-03/RF-04 — Lista de alunos em risco, do maior indicador para o menor.
 * Os filtros ficam na URL (#/risco?turma=…&nivel=…&alertas=novos), para o
 * painel e o sino de alertas do cabeçalho poderem abrir a lista já filtrada.
 */
export class RiscoView extends LitElement {
  static properties = {
    turma: {},
    nivel: {},
    alertas: {},
  }

  static styles = [
    pagina,
    css`
      .filtros {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 16px;
        align-items: center;
        margin-bottom: 8px;
      }
      md-outlined-select {
        min-width: 220px;
      }
      .contagem {
        color: var(--md-sys-color-on-surface-variant);
        margin: 12px 0;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }
      a.linha {
        display: grid;
        grid-template-columns: 1fr minmax(120px, 180px) auto;
        grid-template-areas: 'nome indicador selos';
        gap: 6px 16px;
        align-items: center;
        padding: 12px 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        text-decoration: none;
        color: inherit;
      }
      a.linha:hover,
      a.linha:focus-visible {
        border-color: var(--md-sys-color-primary);
        background: var(--md-sys-color-surface-variant);
      }
      a.linha:focus-visible {
        outline: 2px solid var(--md-sys-color-primary);
        outline-offset: 2px;
      }
      @media (max-width: 600px) {
        a.linha {
          grid-template-columns: 1fr;
          grid-template-areas: 'nome' 'selos' 'indicador';
        }
        a.linha .selos {
          justify-content: flex-start;
        }
      }
      .nome {
        grid-area: nome;
        min-width: 0;
      }
      .nome strong {
        display: block;
      }
      .nome small {
        color: var(--md-sys-color-on-surface-variant);
      }
      .indicador {
        grid-area: indicador;
        display: grid;
        grid-template-columns: 1fr 3ch;
        gap: 8px;
        align-items: center;
        font-variant-numeric: tabular-nums;
        font-weight: 700;
      }
      .selos {
        grid-area: selos;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        justify-content: flex-end;
      }
      .selos md-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
      }
    `,
  ]

  constructor() {
    super()
    new DadosController(this)
    this.turma = ''
    this.nivel = 'risco'
    this.alertas = ''
  }

  render() {
    const turmas = dadosService.estado.turmas
    const nivel = FILTROS_NIVEL.some((f) => f.id === this.nivel) ? this.nivel : 'risco'
    const soNovos = this.alertas === 'novos'

    const lista = dadosService.avaliacao().filter((item) => {
      if (this.turma && item.turma.id !== this.turma) return false
      if (soNovos) return item.alerta === 'novo'
      if (nivel === 'risco') return item.risco.nivel.id === 'risco'
      if (nivel === 'atencao') return item.risco.nivel.id === 'atencao'
      return true
    })
    const { limiar } = dadosService.estado.criterios

    return html`
      <h1>Alunos em risco</h1>
      <p class="subtitulo">
        Indicador de 0 a 100, calculado pelos <a href=${href('criterios')}>critérios de risco</a>. Em risco a partir
        de ${limiar}; atenção a partir de ${Math.max(0, limiar - 20)}.
      </p>

      <div class="filtros">
        <md-outlined-select
          label="Turma"
          menu-positioning="popover"
          .value=${this.turma ?? ''}
          @change=${(e) => this._filtrar({ turma: e.target.value })}
        >
          <md-select-option value="" ?selected=${!this.turma}><div slot="headline">Todas as turmas</div></md-select-option>
          ${turmas.map(
            (t) => html`
              <md-select-option value=${t.id} ?selected=${t.id === this.turma}>
                <div slot="headline">${t.nome}</div>
              </md-select-option>
            `,
          )}
        </md-outlined-select>

        <md-chip-set aria-label="Filtrar por situação">
          ${FILTROS_NIVEL.map(
            (f) => html`
              <md-filter-chip
                label=${f.label}
                ?selected=${!soNovos && nivel === f.id}
                @click=${(e) => {
                  e.preventDefault()
                  this._filtrar({ nivel: f.id, alertas: null })
                }}
              ></md-filter-chip>
            `,
          )}
          <md-filter-chip
            label="Só alertas novos"
            ?selected=${soNovos}
            @click=${(e) => {
              e.preventDefault()
              this._filtrar({ alertas: soNovos ? null : 'novos' })
            }}
          ></md-filter-chip>
        </md-chip-set>
      </div>

      <p class="contagem" role="status">${plural(lista.length, 'aluno')}</p>

      ${lista.length
        ? html`<ul>
            ${lista.map((item) => this._linha(item))}
          </ul>`
        : html`<p class="vazio">Nenhum aluno com esses filtros.</p>`}
    `
  }

  _linha({ aluno, turma, frequencia, risco, alerta }) {
    const situacao = SITUACAO_ALERTA[alerta]
    return html`
      <li>
        <a class="linha" href=${href(`aluno/${aluno.id}`)}>
          <span class="nome">
            <strong>${aluno.nome}</strong>
            <small>
              ${turma.nome} · frequência ${formatarPercentual(frequencia.percentual)}
              ${frequencia.faltasConsecutivas >= 2 ? html` · ${frequencia.faltasConsecutivas} faltas seguidas` : ''}
            </small>
          </span>
          <span class="indicador">
            <span class="barra ${risco.nivel.id}" aria-hidden="true"><span style="width: ${risco.indicador}%"></span></span>
            <span><span class="visualmente-oculto">Indicador de risco </span>${risco.indicador}</span>
          </span>
          <span class="selos">
            <span class="selo ${risco.nivel.id}">${risco.nivel.label}</span>
            ${situacao
              ? html`<span class="selo ${situacao.classe}">
                  <md-icon aria-hidden="true">${situacao.icon}</md-icon>${situacao.label}
                </span>`
              : ''}
          </span>
        </a>
      </li>
    `
  }

  _filtrar(mudanca) {
    const atual = { turma: this.turma || null, nivel: this.nivel || null, alertas: this.alertas || null }
    const novo = { ...atual, ...mudanca }
    navigate('risco', {
      turma: novo.turma || null,
      nivel: novo.nivel && novo.nivel !== 'risco' ? novo.nivel : null,
      alertas: novo.alertas || null,
    })
  }
}

customElements.define('risco-view', RiscoView)
