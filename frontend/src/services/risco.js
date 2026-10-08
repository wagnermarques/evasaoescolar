/**
 * Motor de risco (RF-03) — funções puras, sem DOM nem localStorage, para
 * poderem ser testadas em Node e trocadas depois por outro modelo (ver
 * "Evolução do sistema": modelo preditivo no lugar dos pesos manuais).
 *
 * Cada critério produz uma pontuação de 0 (sem sinal de risco) a 1 (sinal
 * máximo). O indicador é a média dessas pontuações ponderada pelos pesos que
 * a coordenação configura, em escala de 0 a 100.
 */

/** RD-01 — LDB, art. 24, VI: frequência mínima de 75% das horas letivas. */
export const FREQUENCIA_MINIMA_LEGAL = 0.75

/** Acima desta frequência o critério "frequência" não pontua. */
export const FREQUENCIA_SEM_RISCO = 0.95

export const CRITERIOS = [
  {
    id: 'frequencia',
    label: 'Frequência acumulada',
    descricao: 'Pontua a partir de 95% e chega ao máximo em 75%, a frequência mínima legal (LDB, art. 24, VI).',
  },
  {
    id: 'faltasConsecutivas',
    label: 'Faltas consecutivas recentes',
    descricao: 'Faltas seguidas até a última aula registrada; 5 ou mais pontuam o máximo.',
  },
  {
    id: 'desempenho',
    label: 'Desempenho',
    descricao: 'Média do último bimestre; pontua abaixo de 7 e chega ao máximo em 4.',
  },
  {
    id: 'quedaDesempenho',
    label: 'Queda de desempenho',
    descricao: 'Queda da média entre os dois últimos bimestres; 3 pontos ou mais pontuam o máximo.',
  },
]

export const CRITERIOS_PADRAO = {
  pesos: { frequencia: 40, faltasConsecutivas: 25, desempenho: 25, quedaDesempenho: 10 },
  /** Indicador (0–100) a partir do qual o aluno está "em risco" e gera alerta (RF-04). */
  limiar: 50,
}

/** Faixa abaixo do limiar em que o aluno fica "em atenção". */
export const FAIXA_ATENCAO = 20

export const NIVEIS = {
  risco: { id: 'risco', label: 'Em risco' },
  atencao: { id: 'atencao', label: 'Atenção' },
  baixo: { id: 'baixo', label: 'Baixo' },
}

const clamp01 = (x) => Math.min(1, Math.max(0, x))

/** 1 em `cheio`, 0 em `zero`, linear entre os dois (em qualquer sentido). */
function escala(valor, zero, cheio) {
  return clamp01((valor - zero) / (cheio - zero))
}

/**
 * Frequência de um aluno a partir dos registros da turma.
 * registros: { [dataISO]: [idsAusentes] } — só datas em que houve chamada.
 * Considera apenas as datas a partir da matrícula do aluno (desdeISO).
 */
export function frequenciaDoAluno(alunoId, registros = {}, { desdeISO = '' } = {}) {
  const datas = Object.keys(registros)
    .filter((d) => d >= desdeISO)
    .sort()
  let faltas = 0
  let faltasConsecutivas = 0
  const historico = []
  for (const data of datas) {
    const presente = !registros[data].includes(alunoId)
    historico.push({ data, presente })
    if (presente) {
      faltasConsecutivas = 0
    } else {
      faltas++
      faltasConsecutivas++
    }
  }
  const aulas = datas.length
  return {
    aulas,
    faltas,
    presencas: aulas - faltas,
    // Sem nenhuma chamada ainda, não há o que apontar: 100%.
    percentual: aulas === 0 ? 1 : (aulas - faltas) / aulas,
    faltasConsecutivas,
    historico,
  }
}

/** Pontuação 0–1 de cada critério para um aluno. */
export function pontuarCriterios({ frequencia, notas = [] }) {
  const ordenadas = [...notas].sort((a, b) => a.bimestre - b.bimestre)
  const ultima = ordenadas.at(-1)?.media
  const penultima = ordenadas.at(-2)?.media
  return {
    frequencia: escala(frequencia.percentual, FREQUENCIA_SEM_RISCO, FREQUENCIA_MINIMA_LEGAL),
    faltasConsecutivas: escala(frequencia.faltasConsecutivas, 0, 5),
    desempenho: ultima === undefined ? 0 : escala(ultima, 7, 4),
    quedaDesempenho: ultima === undefined || penultima === undefined ? 0 : escala(penultima - ultima, 0, 3),
  }
}

export function nivelDoIndicador(indicador, limiar) {
  if (indicador >= limiar) return NIVEIS.risco
  if (indicador >= limiar - FAIXA_ATENCAO) return NIVEIS.atencao
  return NIVEIS.baixo
}

/**
 * Indicador de risco (0–100) e o detalhamento por critério, para a tela do
 * aluno poder explicar *por que* ele está em risco.
 */
export function calcularRisco({ frequencia, notas }, criterios = CRITERIOS_PADRAO) {
  const pontuacoes = pontuarCriterios({ frequencia, notas })
  const pesoTotal = CRITERIOS.reduce((soma, c) => soma + (criterios.pesos[c.id] ?? 0), 0)
  const fatores = CRITERIOS.map((c) => {
    const peso = criterios.pesos[c.id] ?? 0
    return {
      ...c,
      peso,
      pontuacao: pontuacoes[c.id],
      // Pontos que o critério soma ao indicador final (0–100).
      contribuicao: pesoTotal === 0 ? 0 : (pontuacoes[c.id] * peso * 100) / pesoTotal,
    }
  })
  const indicador = Math.round(fatores.reduce((soma, f) => soma + f.contribuicao, 0))
  return { indicador, nivel: nivelDoIndicador(indicador, criterios.limiar), fatores }
}

/**
 * Avalia todos os alunos (ativos) do estado da aplicação. Devolve uma lista
 * com aluno, turma, frequência e risco, ordenada do maior indicador para o menor.
 */
export function avaliarAlunos(estado, criterios = estado.criterios) {
  const turmas = new Map(estado.turmas.map((t) => [t.id, t]))
  return estado.alunos
    .map((aluno) => {
      const frequencia = frequenciaDoAluno(aluno.id, estado.frequencias[aluno.turmaId], { desdeISO: aluno.matriculaEm })
      return {
        aluno,
        turma: turmas.get(aluno.turmaId),
        frequencia,
        risco: calcularRisco({ frequencia, notas: aluno.notas }, criterios),
      }
    })
    .sort((a, b) => b.risco.indicador - a.risco.indicador || a.aluno.nome.localeCompare(b.aluno.nome))
}
