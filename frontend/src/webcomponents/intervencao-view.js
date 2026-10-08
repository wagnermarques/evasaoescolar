import { LitElement, html, css } from 'lit'
import { authService, href, navigate } from 'fzl-fund-appshell--lit'
import { announce } from 'fzl-fund-appshell--lit/a11y'
import { dadosService, hojeISO } from '../services/dados-service.js'
import { TIPOS_INTERVENCAO } from '../services/intervencoes.js'
import { pagina } from './estilos.js'

/**
 * RF-05 — Registrar intervenção: data, tipo, responsável, descrição,
 * resultado e próximo acompanhamento.
 */
export class IntervencaoView extends LitElement {
  static properties = {
    alunoId: {},
    _erro: { state: true },
  }

  static styles = [
    pagina,
    css`
      :host {
        max-width: 720px;
      }
      form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .inteiro {
        grid-column: 1 / -1;
      }
      @media (max-width: 520px) {
        form {
          grid-template-columns: 1fr;
        }
      }
      .botoes {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ]

  constructor() {
    super()
    this.alunoId = ''
    this._erro = ''
  }

  render() {
    const aluno = dadosService.estado.alunos.find((a) => a.id === this.alunoId)
    if (!aluno) {
      return html`
        <h1>Aluno não encontrado</h1>
        <md-filled-button href=${href('risco')}>Ver alunos em risco</md-filled-button>
      `
    }
    const turma = dadosService.turma(aluno.turmaId)
    const hoje = hojeISO()

    return html`
      <h1>Registrar intervenção</h1>
      <p class="subtitulo">${aluno.nome} · ${turma?.nome}</p>

      ${this._erro
        ? html`<div class="aviso erro" role="alert">
            <md-icon aria-hidden="true">error</md-icon>
            <div>${this._erro}</div>
          </div>`
        : ''}

      <form novalidate @submit=${(e) => this._salvar(e, aluno)}>
        <md-outlined-text-field name="data" label="Data" type="date" required max=${hoje} value=${hoje}></md-outlined-text-field>
        <md-outlined-select name="tipo" label="Tipo de intervenção" required menu-positioning="popover">
          ${TIPOS_INTERVENCAO.map(
            (t) => html`<md-select-option value=${t.id}><div slot="headline">${t.label}</div></md-select-option>`,
          )}
        </md-outlined-select>
        <md-outlined-text-field
          class="inteiro"
          name="responsavel"
          label="Responsável"
          required
          value=${authService.getCurrentUser()?.name ?? ''}
          supporting-text="Quem realizou a intervenção"
        ></md-outlined-text-field>
        <md-outlined-text-field
          class="inteiro"
          name="descricao"
          label="Descrição"
          type="textarea"
          rows="4"
          required
          supporting-text="O que foi feito e por quê. Registre só o necessário (LGPD)."
        ></md-outlined-text-field>
        <md-outlined-text-field
          class="inteiro"
          name="resultado"
          label="Resultado"
          type="textarea"
          rows="2"
          supporting-text="Opcional — pode ser preenchido no próximo acompanhamento"
        ></md-outlined-text-field>
        <md-outlined-text-field
          name="proximoAcompanhamento"
          label="Próximo acompanhamento"
          type="date"
          min=${hoje}
          supporting-text="Opcional"
        ></md-outlined-text-field>
        <div class="botoes inteiro">
          <md-text-button type="button" href=${href(`aluno/${aluno.id}`)}>Cancelar</md-text-button>
          <md-filled-button type="submit">
            <md-icon slot="icon">save</md-icon>
            Salvar intervenção
          </md-filled-button>
        </div>
      </form>
    `
  }

  _salvar(e, aluno) {
    e.preventDefault()
    const campos = [...this.renderRoot.querySelectorAll('[name]')]
    // reportValidity() de cada campo mostra o erro no próprio campo; o
    // primeiro inválido recebe o foco.
    const invalidos = campos.filter((c) => !c.reportValidity())
    if (invalidos.length) {
      this._erro = 'Preencha os campos obrigatórios: data, tipo, responsável e descrição.'
      invalidos[0].focus()
      return
    }
    const valores = Object.fromEntries(campos.map((c) => [c.name, String(c.value ?? '').trim()]))
    if (valores.proximoAcompanhamento && valores.proximoAcompanhamento < valores.data) {
      this._erro = 'O próximo acompanhamento não pode ser antes da data da intervenção.'
      return
    }
    dadosService.registrarIntervencao({ alunoId: aluno.id, ...valores })
    announce(`Intervenção registrada para ${aluno.nome}.`)
    navigate(`aluno/${aluno.id}`)
  }
}

customElements.define('intervencao-view', IntervencaoView)
