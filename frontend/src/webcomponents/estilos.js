import { css } from 'lit'

/**
 * Estilos compartilhados pelas telas do app. Só usam os tokens de cor do
 * tema do appshell (--md-sys-color-*), então valem nos quatro temas,
 * inclusive nos de alto contraste (RNF-09). O nível de risco nunca é
 * indicado só pela cor: o selo sempre traz o texto.
 */
export const pagina = css`
  :host {
    display: block;
    max-width: 960px;
    margin: 0 auto;
    padding: 16px 16px 64px;
    color: var(--md-sys-color-on-surface);
  }
  h1 {
    font-size: 1.6rem;
    margin: 8px 0 4px;
  }
  h2 {
    font-size: 1.1rem;
    margin: 32px 0 12px;
  }
  .subtitulo {
    color: var(--md-sys-color-on-surface-variant);
    margin: 0 0 20px;
  }
  a {
    color: var(--md-sys-color-primary);
  }
  .cartao {
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 12px;
    background: var(--md-sys-color-surface);
    padding: 16px;
  }
  .aviso {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    margin: 0 0 16px;
    line-height: 1.5;
  }
  .aviso.erro {
    background: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }
  .aviso md-icon {
    flex-shrink: 0;
  }
  .acoes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0;
  }
  .vazio {
    color: var(--md-sys-color-on-surface-variant);
    font-style: italic;
  }
  .selo {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .selo.risco {
    background: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
    border-color: var(--md-sys-color-error);
  }
  .selo.atencao {
    background: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
    border-color: var(--md-sys-color-tertiary);
  }
  .selo.baixo {
    background: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface-variant);
  }
  .selo.novo {
    background: var(--md-sys-color-error);
    color: var(--md-sys-color-on-error);
  }
  .selo.acompanhamento {
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  .barra {
    height: 8px;
    border-radius: 4px;
    background: var(--md-sys-color-surface-variant);
    overflow: hidden;
  }
  .barra > span {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--md-sys-color-primary);
  }
  .barra.risco > span {
    background: var(--md-sys-color-error);
  }
  .barra.atencao > span {
    background: var(--md-sys-color-tertiary);
  }
  .barra.baixo > span {
    background: var(--md-sys-color-outline);
  }
  .visualmente-oculto {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
  md-outlined-select,
  md-outlined-text-field {
    min-width: 0;
  }
`
