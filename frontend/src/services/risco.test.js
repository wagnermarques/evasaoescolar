import { describe, expect, it } from 'vitest'
import {
  CRITERIOS_PADRAO,
  avaliarAlunos,
  calcularRisco,
  frequenciaDoAluno,
  nivelDoIndicador,
  pontuarCriterios,
} from './risco.js'

/** n chamadas em dias consecutivos de outubro; `ausencias` são os índices das aulas faltadas. */
function registros(n, ausencias = [], alunoId = 'a1') {
  const out = {}
  for (let i = 0; i < n; i++) {
    out[`2026-10-${String(i + 1).padStart(2, '0')}`] = ausencias.includes(i) ? [alunoId] : []
  }
  return out
}

describe('frequenciaDoAluno', () => {
  it('sem chamadas, frequência é 100% e não há faltas', () => {
    expect(frequenciaDoAluno('a1', {})).toMatchObject({ aulas: 0, faltas: 0, percentual: 1, faltasConsecutivas: 0 })
  })

  it('conta faltas, percentual e faltas consecutivas até a última aula', () => {
    const f = frequenciaDoAluno('a1', registros(10, [1, 7, 8, 9]))
    expect(f).toMatchObject({ aulas: 10, faltas: 4, presencas: 6, faltasConsecutivas: 3 })
    expect(f.percentual).toBeCloseTo(0.6)
  })

  it('uma presença zera a sequência de faltas', () => {
    expect(frequenciaDoAluno('a1', registros(5, [2, 3])).faltasConsecutivas).toBe(0)
  })

  it('ignora as chamadas anteriores à matrícula', () => {
    const f = frequenciaDoAluno('a1', registros(10, [0, 1, 2]), { desdeISO: '2026-10-04' })
    expect(f).toMatchObject({ aulas: 7, faltas: 0 })
  })

  it('a ausência de outro aluno não conta', () => {
    expect(frequenciaDoAluno('a1', registros(4, [0, 1], 'a2')).faltas).toBe(0)
  })
})

describe('pontuarCriterios', () => {
  const freq = (percentual, faltasConsecutivas = 0) => ({ percentual, faltasConsecutivas })

  it('RD-01: frequência em 75% (mínimo legal) pontua o máximo; 95% ou mais não pontua', () => {
    expect(pontuarCriterios({ frequencia: freq(0.75) }).frequencia).toBe(1)
    expect(pontuarCriterios({ frequencia: freq(0.6) }).frequencia).toBe(1)
    expect(pontuarCriterios({ frequencia: freq(0.95) }).frequencia).toBe(0)
    expect(pontuarCriterios({ frequencia: freq(0.85) }).frequencia).toBeCloseTo(0.5)
  })

  it('desempenho e queda usam os dois últimos bimestres, em qualquer ordem', () => {
    const p = pontuarCriterios({
      frequencia: freq(1),
      notas: [
        { bimestre: 2, media: 5.5 },
        { bimestre: 1, media: 8.5 },
      ],
    })
    expect(p.desempenho).toBeCloseTo(0.5)
    expect(p.quedaDesempenho).toBe(1)
  })

  it('sem notas, os critérios de desempenho não pontuam', () => {
    const p = pontuarCriterios({ frequencia: freq(1), notas: [] })
    expect(p.desempenho).toBe(0)
    expect(p.quedaDesempenho).toBe(0)
  })
})

describe('calcularRisco', () => {
  const semRisco = { frequencia: { percentual: 1, faltasConsecutivas: 0 }, notas: [{ bimestre: 1, media: 9 }] }
  const riscoMaximo = {
    frequencia: { percentual: 0.5, faltasConsecutivas: 8 },
    notas: [
      { bimestre: 1, media: 8 },
      { bimestre: 2, media: 3 },
    ],
  }

  it('vai de 0 a 100', () => {
    expect(calcularRisco(semRisco).indicador).toBe(0)
    expect(calcularRisco(riscoMaximo).indicador).toBe(100)
    expect(calcularRisco(riscoMaximo).nivel.id).toBe('risco')
  })

  it('a soma das contribuições é o indicador', () => {
    const { indicador, fatores } = calcularRisco({
      frequencia: { percentual: 0.85, faltasConsecutivas: 2 },
      notas: [{ bimestre: 1, media: 6 }],
    })
    expect(Math.round(fatores.reduce((s, f) => s + f.contribuicao, 0))).toBe(indicador)
  })

  it('RF-03: alterar um peso muda o indicador', () => {
    const aluno = { frequencia: { percentual: 0.8, faltasConsecutivas: 0 }, notas: [{ bimestre: 1, media: 9 }] }
    const padrao = calcularRisco(aluno).indicador
    const soFrequencia = calcularRisco(aluno, {
      ...CRITERIOS_PADRAO,
      pesos: { frequencia: 100, faltasConsecutivas: 0, desempenho: 0, quedaDesempenho: 0 },
    }).indicador
    expect(soFrequencia).toBeGreaterThan(padrao)
    expect(soFrequencia).toBe(75)
  })

  it('todos os pesos em zero resultam em indicador 0, sem dividir por zero', () => {
    const pesos = { frequencia: 0, faltasConsecutivas: 0, desempenho: 0, quedaDesempenho: 0 }
    expect(calcularRisco(riscoMaximo, { pesos, limiar: 50 }).indicador).toBe(0)
  })
})

describe('nivelDoIndicador', () => {
  it('risco a partir do limiar, atenção nos 20 pontos abaixo dele', () => {
    expect(nivelDoIndicador(50, 50).id).toBe('risco')
    expect(nivelDoIndicador(30, 50).id).toBe('atencao')
    expect(nivelDoIndicador(29, 50).id).toBe('baixo')
  })
})

describe('avaliarAlunos', () => {
  it('RF-03: a lista reflete a mudança do limiar e vem ordenada pelo indicador', () => {
    const estado = {
      turmas: [{ id: 't1', nome: '6º A' }],
      alunos: [
        { id: 'a1', nome: 'Ana', turmaId: 't1', matriculaEm: '', notas: [{ bimestre: 1, media: 9 }] },
        { id: 'a2', nome: 'Bruno', turmaId: 't1', matriculaEm: '', notas: [{ bimestre: 1, media: 4 }] },
      ],
      frequencias: { t1: registros(10, [6, 7, 8, 9], 'a2') },
      criterios: CRITERIOS_PADRAO,
    }
    const lista = avaliarAlunos(estado)
    expect(lista.map((l) => l.aluno.id)).toEqual(['a2', 'a1'])
    const emRisco = (c) => avaliarAlunos(estado, c).filter((l) => l.risco.nivel.id === 'risco').length
    expect(emRisco({ ...CRITERIOS_PADRAO, limiar: 100 })).toBe(0)
    expect(emRisco({ ...CRITERIOS_PADRAO, limiar: 10 })).toBe(1)
  })
})
