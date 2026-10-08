import { LitElement, html, css } from 'lit'
import { href } from 'fzl-fund-appshell--lit'
import { DadosController, dadosService } from '../services/dados-service.js'

/**
 * RF-04 — sino no cabeçalho do shell com a quantidade de alertas novos
 * (alunos que passaram do limiar e cuja ficha a coordenação ainda não abriu).
 * Leva à lista de risco filtrada pelos alertas novos.
 */
export class AlertasIndicador extends LitElement {
  static styles = css`
    :host {
      position: relative;
      display: inline-flex;
    }
    .contador {
      position: absolute;
      top: 4px;
      right: 2px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      box-sizing: border-box;
      border-radius: 8px;
      background: var(--md-sys-color-error);
      color: var(--md-sys-color-on-error);
      font-size: 0.7rem;
      font-weight: 700;
      line-height: 16px;
      text-align: center;
      pointer-events: none;
    }
  `

  constructor() {
    super()
    new DadosController(this)
  }

  render() {
    const novos = dadosService.alertasNovos()
    const rotulo = novos === 0 ? 'Nenhum alerta novo de risco' : `${novos} ${novos === 1 ? 'alerta novo' : 'alertas novos'} de risco`
    return html`
      <md-icon-button href=${href('risco', { alertas: 'novos' })} aria-label=${rotulo} title=${rotulo}>
        <md-icon>${novos ? 'notifications_active' : 'notifications'}</md-icon>
      </md-icon-button>
      ${novos ? html`<span class="contador" aria-hidden="true">${novos > 99 ? '99+' : novos}</span>` : ''}
    `
  }
}

customElements.define('alertas-indicador', AlertasIndicador)
