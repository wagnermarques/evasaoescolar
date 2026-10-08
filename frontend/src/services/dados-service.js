/**
 * Estado da aplicação (turmas, alunos, chamadas, intervenções, critérios),
 * guardado no localStorage deste navegador — o "storage local offline-first"
 * do appshell (RNF-08).
 *
 * Nesta fase (protótipo de validação) só há dados FICTÍCIOS (ver
 * src/data/seed.js). Antes de guardar dados reais é preciso resolver os
 * "Pontos a negociar decorrentes do RNF-08" (dados locais, backend
 * obrigatório, hospedagem) junto com RNF-04 e RNF-05. A interface abaixo é
 * a que a troca por um backend (Supabase) deve manter.
 */
import { gerarDadosDemonstracao, dataISO } from '../data/seed.js'
import { CRITERIOS_PADRAO, avaliarAlunos } from './risco.js'

// Mesmo prefixo que o appshell usa nas suas chaves (__APP_STORAGE_PREFIX__,
// constante de build do preset), para não colidir com outros apps na mesma origem.
const CHAVE = `${__APP_STORAGE_PREFIX__}:dados`

const listeners = new Set()
let estado = carregar()

function carregar() {
  try {
    const salvo = JSON.parse(globalThis.localStorage.getItem(CHAVE))
    if (salvo?.versao === 1) return salvo
  } catch {
    // dado corrompido ou storage indisponível: recomeça da demonstração
  }
  return novoEstado()
}

function novoEstado() {
  return { ...gerarDadosDemonstracao(), criterios: structuredClone(CRITERIOS_PADRAO) }
}

function gravar(novo) {
  estado = novo
  try {
    globalThis.localStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    // modo privado/cota cheia: segue só em memória nesta sessão
  }
  avaliacaoCache = null
  listeners.forEach((fn) => fn(estado))
}

let avaliacaoCache = null

export function hojeISO() {
  return dataISO(new Date())
}

/**
 * Situação do alerta de um aluno (RF-04):
 *  - null: aluno não está em risco, não há alerta;
 *  - 'novo': em risco, a coordenação ainda não viu;
 *  - 'visto': coordenação viu, mas nenhuma intervenção foi registrada;
 *  - 'acompanhamento': já há intervenção registrada.
 */
function situacaoDoAlerta(alunoId, risco) {
  if (risco.nivel.id !== 'risco') return null
  if (estado.intervencoes.some((i) => i.alunoId === alunoId)) return 'acompanhamento'
  return estado.alertasVistos[alunoId] ? 'visto' : 'novo'
}

export const dadosService = {
  get estado() {
    return estado
  },

  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  /** Todos os alunos com frequência, risco e situação do alerta, do maior risco para o menor. */
  avaliacao() {
    avaliacaoCache ??= avaliarAlunos(estado).map((item) => ({
      ...item,
      alerta: situacaoDoAlerta(item.aluno.id, item.risco),
    }))
    return avaliacaoCache
  },

  avaliacaoDoAluno(alunoId) {
    return this.avaliacao().find((item) => item.aluno.id === alunoId) ?? null
  },

  alertasNovos() {
    return this.avaliacao().filter((item) => item.alerta === 'novo').length
  },

  turma(turmaId) {
    return estado.turmas.find((t) => t.id === turmaId) ?? null
  },

  alunosDaTurma(turmaId, dataISO = hojeISO()) {
    return estado.alunos.filter((a) => a.turmaId === turmaId && a.matriculaEm <= dataISO)
  },

  /** ids dos ausentes na chamada da turma nessa data, ou null se ainda não houve chamada. */
  chamada(turmaId, data) {
    return estado.frequencias[turmaId]?.[data] ?? null
  },

  /** RF-01: grava (ou substitui) a chamada da turma numa data. */
  salvarChamada(turmaId, data, ausentes) {
    gravar({
      ...estado,
      frequencias: {
        ...estado.frequencias,
        [turmaId]: { ...estado.frequencias[turmaId], [data]: [...ausentes] },
      },
    })
  },

  intervencoesDoAluno(alunoId) {
    return estado.intervencoes
      .filter((i) => i.alunoId === alunoId)
      .sort((a, b) => b.data.localeCompare(a.data) || b.criadaEm.localeCompare(a.criadaEm))
  },

  /** Intervenções cujo próximo acompanhamento ainda não foi feito, da data mais próxima para a mais distante. */
  proximosAcompanhamentos() {
    // Só a intervenção mais recente de cada aluno vale: uma nova intervenção
    // registrada é o acompanhamento da anterior.
    const ultimas = new Map()
    for (const i of estado.intervencoes) {
      const atual = ultimas.get(i.alunoId)
      if (!atual || i.data > atual.data || (i.data === atual.data && i.criadaEm > atual.criadaEm)) {
        ultimas.set(i.alunoId, i)
      }
    }
    return [...ultimas.values()]
      .filter((i) => i.proximoAcompanhamento)
      .sort((a, b) => a.proximoAcompanhamento.localeCompare(b.proximoAcompanhamento))
  },

  /** RF-05 */
  registrarIntervencao(dados) {
    const intervencao = { ...dados, id: crypto.randomUUID?.() ?? String(Date.now()), criadaEm: new Date().toISOString() }
    gravar({ ...estado, intervencoes: [...estado.intervencoes, intervencao] })
    return intervencao
  },

  /** A coordenação viu o alerta do aluno (RF-04). */
  marcarAlertaVisto(alunoId) {
    if (estado.alertasVistos[alunoId]) return
    gravar({ ...estado, alertasVistos: { ...estado.alertasVistos, [alunoId]: hojeISO() } })
  },

  /** RF-03: critérios e pesos configuráveis pela coordenação. */
  salvarCriterios(criterios) {
    gravar({ ...estado, criterios: structuredClone(criterios) })
  },

  /** Volta aos dados fictícios iniciais (útil entre sessões de validação). */
  restaurarDemonstracao() {
    gravar(novoEstado())
  },
}

/**
 * Controller do Lit: a view que o instancia (`new DadosController(this)`)
 * re-renderiza sempre que o estado muda — inclusive quando a mudança veio
 * de outra view.
 */
export class DadosController {
  constructor(host) {
    this.host = host
    host.addController(this)
  }

  hostConnected() {
    this._unsubscribe = dadosService.subscribe(() => this.host.requestUpdate())
  }

  hostDisconnected() {
    this._unsubscribe?.()
  }
}
