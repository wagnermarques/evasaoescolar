/** '2026-10-08' -> '08/10/2026' */
export function formatarData(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** '2026-10-08' -> 'qui., 08/10' */
export function formatarDataCurta(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const semana = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short' })
  return `${semana} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

/** 0.8734 -> '87%' */
export function formatarPercentual(fracao) {
  return `${Math.round(fracao * 100)}%`
}

export function formatarNota(media) {
  return media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** 125 (segundos) -> '2min05s' */
export function formatarDuracao(segundos) {
  const m = Math.floor(segundos / 60)
  const s = String(Math.round(segundos % 60)).padStart(2, '0')
  return m ? `${m}min${s}s` : `${Number(s)}s`
}

export function plural(n, singular, pluralForm = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForm}`
}
