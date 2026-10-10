import { LitElement, html, css } from 'lit'
import { href } from 'fzl-fund-appshell--lit'
import { announce } from 'fzl-fund-appshell--lit/a11y'
import { dadosService } from '../services/dados-service.js'
import { formatarData } from '../services/formato.js'
import { pagina } from './estilos.js'

const REPOSITORIO = 'https://github.com/wagnermarques/evasaoescolar'
const DOCUMENTO = 'engenhariadesofware/especificacaoderequisitos/02-documento-de-requisitos.org'

const TELAS = [
  { tela: 'Registrar frequência', rota: 'frequencia', requisitos: 'RF-01, RNF-01, RNF-03, CT-01' },
  { tela: 'Alunos em risco', rota: 'risco', requisitos: 'RF-03, RF-04, RD-01' },
  { tela: 'Ficha do aluno', rota: null, requisitos: 'RF-03, RF-05, RD-01' },
  { tela: 'Registrar intervenção', rota: null, requisitos: 'RF-05' },
  { tela: 'Critérios de risco', rota: 'criterios', requisitos: 'RF-03' },
  { tela: 'Config → Acessibilidade (do App Shell)', rota: 'config/acessibilidade', requisitos: 'RNF-09' },
]

/** Explica o que é este protótipo, o que ele cobre e o que fica para depois. */
export class SobreView extends LitElement {
  static properties = {
    _restaurado: { state: true },
  }

  static styles = [
    pagina,
    css`
      :host {
        max-width: 760px;
      }
      p,
      li {
        line-height: 1.6;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        vertical-align: top;
      }
      th {
        color: var(--md-sys-color-on-surface-variant);
        font-size: 0.85rem;
      }
      code {
        background: var(--md-sys-color-surface-variant);
        color: var(--md-sys-color-on-surface-variant);
        padding: 1px 4px;
        border-radius: 4px;
        overflow-wrap: anywhere;
      }
    `,
  ]

  render() {
    return html`
      <h1>Sobre este protótipo</h1>
      <p class="subtitulo">Sistema de Acompanhamento da Evasão Escolar · GEPIS · versão ${__APP_VERSION__}</p>

      <div class="aviso" role="note">
        <md-icon aria-hidden="true">science</md-icon>
        <div>
          <strong>Fase 1 — protótipo de validação.</strong> Os requisitos ainda são hipóteses (tag
          <code>:HIPOTESE:</code>). Este protótipo existe para validá-los com os stakeholders (Iteração 3 do plano de
          Engenharia de Requisitos, seção "Protótipos" de <code>03-validacao.org</code>).
        </div>
      </div>

      <h2>Dados</h2>
      <p>
        Todos os alunos, turmas, notas e telefones são <strong>fictícios</strong>, gerados automaticamente em
        ${formatarData(dadosService.estado.geradoEm)}. Eles ficam só neste navegador (localStorage) e não são
        enviados a nenhum servidor. Não digite dados reais de alunos: armazenar dados pessoais de menores depende
        dos pontos em aberto do RNF-08 (dados locais, backend, hospedagem) e do RNF-05 (LGPD).
      </p>
      <p>Entre uma sessão de validação e outra, você pode voltar aos dados iniciais:</p>
      <md-outlined-button @click=${this._restaurar}>
        <md-icon slot="icon">restart_alt</md-icon>
        Restaurar dados de demonstração
      </md-outlined-button>
      ${this._restaurado ? html`<p role="status">Dados de demonstração restaurados.</p>` : ''}

      <h2>O que esta fase cobre</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Tela</th>
            <th scope="col">Requisitos</th>
          </tr>
        </thead>
        <tbody>
          ${TELAS.map(
            (t) => html`
              <tr>
                <td>${t.rota ? html`<a href=${href(t.rota)}>${t.tela}</a>` : t.tela}</td>
                <td>${t.requisitos}</td>
              </tr>
            `,
          )}
        </tbody>
      </table>

      <h2>O que fica para as próximas fases</h2>
      <ul>
        <li>RF-02 — importação de CSV do sistema acadêmico.</li>
        <li>RF-06 — relatórios exportáveis (PDF/CSV); RF-07 — exportação anonimizada para pesquisa.</li>
        <li>RNF-04 — perfis e controle de acesso por turma/escola, com log de acesso.</li>
        <li>Backend (fzlbpms, bundle Camel no Karaf) e autenticação obrigatória — hoje o login é o de demonstração do App Shell.</li>
        <li>Alertas por e-mail ou notificação; hoje o alerta (RF-04) aparece no sino do cabeçalho.</li>
      </ul>

      <h2>Como dar retorno</h2>
      <p>
        Anote o que estranhou, o que faltou e o que sobrou em cada tela. As observações entram na revisão de
        requisitos (<code>03-validacao.org</code>) ou viram solicitações de mudança no
        <a href="${REPOSITORIO}/issues" target="_blank" rel="noopener">GitHub do projeto</a>. Documento de
        requisitos: <a href="${REPOSITORIO}/blob/main/${DOCUMENTO}" target="_blank" rel="noopener">${DOCUMENTO}</a>.
      </p>
      <p>
        Interface construída sobre o App Shell
        <a href="https://github.com/wagnermarques/fzl-fund-appshell--lit" target="_blank" rel="noopener"
          >fzl-fund-appshell--lit</a
        >
        (RNF-08).
      </p>
    `
  }

  _restaurar() {
    dadosService.restaurarDemonstracao()
    this._restaurado = true
    announce('Dados de demonstração restaurados.')
  }
}

customElements.define('sobre-view', SobreView)
