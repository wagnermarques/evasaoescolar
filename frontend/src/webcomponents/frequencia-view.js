import { LitElement, html, css } from 'lit'
import { href, navigate } from 'fzl-fund-appshell--lit'
import { announce } from 'fzl-fund-appshell--lit/a11y'
import { DadosController, dadosService, hojeISO } from '../services/dados-service.js'
import { formatarData, formatarDuracao, plural } from '../services/formato.js'
import { pagina } from './estilos.js'

/** Limite do critério de aceitação do RF-01 (CT-01): 40 alunos em até 2 minutos. */
const LIMITE_CT01_SEGUNDOS = 120

/**
 * RF-01 — Registrar frequência por turma (RNF-01 usabilidade, RNF-03 celular).
 *
 * Todos começam presentes e um toque marca a falta — o caso comum (quase
 * todos presentes) custa só o "Salvar". A tela cronometra do primeiro
 * toque ao salvar para medir o CT-01 nas sessões de validação.
 */
export class FrequenciaView extends LitElement {
  static properties = {
    turmaId: {},
    data: {},
    _ausentes: { state: true },
    _existente: { state: true },
    _salvo: { state: true },
  }

  static styles = [
    pagina,
    css`
      :host {
        padding-bottom: 0;
      }
      .filtros {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
      }
      @media (max-width: 520px) {
        .filtros {
          grid-template-columns: 1fr;
        }
      }
      .ferramentas {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 4px 0 8px;
        color: var(--md-sys-color-on-surface-variant);
      }
      ol {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li + li {
        border-top: 1px solid var(--md-sys-color-outline-variant);
      }
      button.aluno {
        all: unset;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 52px;
        padding: 6px 8px;
        cursor: pointer;
        border-radius: 8px;
        color: var(--md-sys-color-on-surface);
      }
      button.aluno:hover {
        background: var(--md-sys-color-surface-variant);
      }
      button.aluno:focus-visible {
        outline: 2px solid var(--md-sys-color-primary);
        outline-offset: -2px;
      }
      button.aluno[aria-pressed='true'] {
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
      }
      .numero {
        width: 2ch;
        text-align: right;
        color: var(--md-sys-color-on-surface-variant);
        font-variant-numeric: tabular-nums;
      }
      button.aluno[aria-pressed='true'] .numero {
        color: inherit;
      }
      .nome {
        flex: 1;
        min-width: 0;
      }
      .estado {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 96px;
        justify-content: flex-end;
        font-weight: 600;
      }
      .estado.presente {
        color: var(--md-sys-color-primary);
      }
      .rodape {
        position: sticky;
        bottom: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 16px;
        margin: 16px -16px 0;
        padding: 12px 16px;
        background: var(--md-sys-color-surface);
        border-top: 1px solid var(--md-sys-color-outline-variant);
      }
      .resumo {
        font-variant-numeric: tabular-nums;
      }
      .aviso.ok {
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
      }
    `,
  ]

  constructor() {
    super()
    new DadosController(this)
    this.turmaId = ''
    this.data = hojeISO()
    this._ausentes = new Set()
    this._existente = false
    this._salvo = null
    this._inicio = null
    this._carregado = ''
  }

  willUpdate(changed) {
    if (!this.turmaId) this.turmaId = dadosService.estado.turmas[0]?.id ?? ''
    if (!this.data) this.data = hojeISO()
    // Troca de turma ou data: carrega a chamada já feita (para corrigir) ou começa com todos presentes.
    const chave = `${this.turmaId}|${this.data}`
    if ((changed.has('turmaId') || changed.has('data')) && chave !== this._carregado) {
      this._carregado = chave
      const chamada = dadosService.chamada(this.turmaId, this.data)
      this._ausentes = new Set(chamada ?? [])
      this._existente = chamada !== null
      this._inicio = null
      // Mantém a confirmação só se ela é desta mesma chamada.
      if (this._salvo?.chave !== chave) this._salvo = null
    }
  }

  render() {
    const turmas = dadosService.estado.turmas
    const turma = dadosService.turma(this.turmaId)
    const alunos = turma ? dadosService.alunosDaTurma(turma.id, this.data) : []
    const faltas = alunos.filter((a) => this._ausentes.has(a.id)).length
    const futuro = this.data > hojeISO()

    return html`
      <h1>Registrar frequência</h1>
      <p class="subtitulo">Toque no nome do aluno para marcar falta. Todos começam presentes.</p>

      <div class="filtros">
        <md-outlined-select
          label="Turma"
          menu-positioning="popover"
          .value=${this.turmaId}
          @change=${(e) => this._trocar({ turma: e.target.value })}
        >
          ${turmas.map(
            (t) => html`
              <md-select-option value=${t.id} ?selected=${t.id === this.turmaId}>
                <div slot="headline">${t.nome} — ${t.turno}</div>
              </md-select-option>
            `,
          )}
        </md-outlined-select>
        <md-outlined-text-field
          label="Data"
          type="date"
          max=${hojeISO()}
          .value=${this.data}
          @change=${(e) => e.target.value && this._trocar({ data: e.target.value })}
        ></md-outlined-text-field>
      </div>

      ${futuro
        ? html`<div class="aviso erro" role="alert">
            <md-icon aria-hidden="true">event_busy</md-icon>
            <div>Não é possível registrar frequência de uma data futura.</div>
          </div>`
        : ''}
      ${this._existente && !this._salvo
        ? html`<div class="aviso" role="status">
            <md-icon aria-hidden="true">edit_note</md-icon>
            <div>A chamada de ${formatarData(this.data)} já foi registrada. Você está corrigindo-a.</div>
          </div>`
        : ''}
      ${this._salvo ? this._confirmacao() : ''}

      <div class="ferramentas">
        <span>${plural(alunos.length, 'aluno')}</span>
        <md-text-button ?disabled=${faltas === 0} @click=${this._todosPresentes}>
          <md-icon slot="icon">done_all</md-icon>
          Marcar todos presentes
        </md-text-button>
      </div>

      <ol aria-label="Alunos da turma">
        ${alunos.map((aluno, i) => {
          const falta = this._ausentes.has(aluno.id)
          return html`
            <li>
              <button class="aluno" aria-pressed=${falta ? 'true' : 'false'} @click=${() => this._alternar(aluno.id)}>
                <span class="numero" aria-hidden="true">${i + 1}</span>
                <span class="nome">${aluno.nome}</span>
                <span class="estado ${falta ? 'falta' : 'presente'}">
                  <md-icon aria-hidden="true">${falta ? 'close' : 'check'}</md-icon>
                  ${falta ? 'Falta' : 'Presente'}
                </span>
              </button>
            </li>
          `
        })}
      </ol>

      <div class="rodape">
        <span class="resumo" aria-live="polite">
          <strong>${alunos.length - faltas}</strong> ${alunos.length - faltas === 1 ? 'presente' : 'presentes'} ·
          <strong>${faltas}</strong> ${faltas === 1 ? 'falta' : 'faltas'}
        </span>
        <md-filled-button ?disabled=${!alunos.length || futuro} @click=${() => this._salvar(alunos)}>
          <md-icon slot="icon">save</md-icon>
          ${this._existente ? 'Salvar correção' : 'Salvar chamada'}
        </md-filled-button>
      </div>
    `
  }

  _confirmacao() {
    const { presentes, faltas, segundos } = this._salvo
    const dentro = segundos !== null && segundos <= LIMITE_CT01_SEGUNDOS
    return html`
      <div class="aviso ok" role="status">
        <md-icon aria-hidden="true">task_alt</md-icon>
        <div>
          <strong>Chamada salva:</strong> ${presentes} ${presentes === 1 ? 'presente' : 'presentes'}, ${plural(faltas, 'falta')}.
          ${segundos !== null
            ? html`<br />Tempo de registro: ${formatarDuracao(segundos)}
                ${dentro ? '(dentro do limite de 2 min do RF-01)' : '(acima do limite de 2 min do RF-01)'}`
            : ''}
          <br /><a href=${href('risco', { turma: this.turmaId })}>Ver a situação de risco desta turma</a>
        </div>
      </div>
    `
  }

  _trocar({ turma = this.turmaId, data = this.data }) {
    // A turma e a data ficam na URL: o link pode ser favoritado e o "voltar" funciona.
    navigate('frequencia', { turma, data: data === hojeISO() ? null : data })
  }

  _iniciarCronometro() {
    this._inicio ??= performance.now()
    this._salvo = null
  }

  _alternar(alunoId) {
    this._iniciarCronometro()
    const ausentes = new Set(this._ausentes)
    if (ausentes.has(alunoId)) ausentes.delete(alunoId)
    else ausentes.add(alunoId)
    this._ausentes = ausentes
  }

  _todosPresentes() {
    this._iniciarCronometro()
    this._ausentes = new Set()
  }

  _salvar(alunos) {
    const ausentes = alunos.filter((a) => this._ausentes.has(a.id)).map((a) => a.id)
    // Sem nenhum toque (todos presentes, salvo direto) não há o que cronometrar.
    const segundos = this._inicio === null ? null : (performance.now() - this._inicio) / 1000
    dadosService.salvarChamada(this.turmaId, this.data, ausentes)
    this._existente = true
    this._inicio = null
    this._salvo = {
      chave: `${this.turmaId}|${this.data}`,
      presentes: alunos.length - ausentes.length,
      faltas: ausentes.length,
      segundos,
    }
    announce(`Chamada salva: ${this._salvo.presentes} presentes, ${ausentes.length} faltas.`)
    this.updateComplete.then(() => this.renderRoot.querySelector('.aviso.ok')?.scrollIntoView({ block: 'nearest' }))
  }
}

customElements.define('frequencia-view', FrequenciaView)
