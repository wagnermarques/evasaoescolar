/**
 * Dados de demonstração para o protótipo de validação (03-validacao.org,
 * "Protótipos"). TODOS os nomes e números são FICTÍCIOS, gerados aqui por
 * sorteio — nenhum dado pessoal real entra no protótipo, o que deixa os
 * pontos em aberto do RNF-08 (dados locais × LGPD) fora desta fase.
 *
 * O sorteio usa uma semente fixa, então a mesma data de geração produz
 * sempre a mesma escola. As chamadas cobrem os dias úteis anteriores à data
 * de geração, para que as "faltas recentes" sejam de fato recentes.
 */

const NOMES = [
  'Ana', 'Beatriz', 'Bruna', 'Camila', 'Carolina', 'Clara', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela',
  'Helena', 'Isabela', 'Júlia', 'Larissa', 'Laura', 'Letícia', 'Luana', 'Manuela', 'Mariana', 'Natália',
  'Rafaela', 'Sofia', 'Valentina', 'Vitória', 'Yasmin', 'Arthur', 'Bernardo', 'Bruno', 'Caio', 'Daniel',
  'Davi', 'Enzo', 'Felipe', 'Gabriel', 'Gustavo', 'Heitor', 'Henrique', 'João', 'José', 'Kauã',
  'Leonardo', 'Lucas', 'Matheus', 'Miguel', 'Nicolas', 'Pedro', 'Rafael', 'Samuel', 'Thiago', 'Vinícius',
]

const SOBRENOMES = [
  'Almeida', 'Alves', 'Andrade', 'Barbosa', 'Barros', 'Batista', 'Cardoso', 'Carvalho', 'Castro', 'Correia',
  'Costa', 'Dias', 'Duarte', 'Farias', 'Ferreira', 'Freitas', 'Gomes', 'Lima', 'Lopes', 'Machado',
  'Martins', 'Melo', 'Mendes', 'Moreira', 'Nascimento', 'Nunes', 'Oliveira', 'Pereira', 'Pinto', 'Ramos',
  'Ribeiro', 'Rocha', 'Santos', 'Silva', 'Soares', 'Souza', 'Teixeira', 'Vieira',
]

const TURMAS = [
  { id: 't-6a', nome: '6º ano A', turno: 'Manhã', alunos: 28 },
  { id: 't-7b', nome: '7º ano B', turno: 'Manhã', alunos: 32 },
  { id: 't-8a', nome: '8º ano A', turno: 'Tarde', alunos: 35 },
  // 40 alunos: o tamanho do critério de aceitação do RF-01 (CT-01).
  { id: 't-9c', nome: '9º ano C', turno: 'Tarde', alunos: 40 },
]

const DIAS_LETIVOS = 40

/** mulberry32 — PRNG pequeno e determinístico. */
function prng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function dataISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Os `n` dias úteis (seg–sex) anteriores a `ate`, do mais antigo ao mais recente. */
export function diasUteisAntes(ate, n) {
  const dias = []
  const d = new Date(ate)
  while (dias.length < n) {
    d.setDate(d.getDate() - 1)
    const semana = d.getDay()
    if (semana !== 0 && semana !== 6) dias.unshift(dataISO(d))
  }
  return dias
}

const arred = (x) => Math.round(x * 10) / 10

/**
 * Perfis de aluno: a maioria frequente e com boas notas; uma parte em
 * atenção; uma parte com o padrão do cenário C-01 (faltas acumuladas,
 * sequência recente de faltas, queda nas notas).
 */
function sortearPerfil(rand) {
  const r = rand()
  if (r < 0.12) return 'risco'
  if (r < 0.27) return 'atencao'
  return 'regular'
}

export function gerarDadosDemonstracao(hoje = new Date()) {
  const rand = prng(20261006)
  const pick = (lista) => lista[Math.floor(rand() * lista.length)]
  const entre = (min, max) => min + rand() * (max - min)

  const dias = diasUteisAntes(hoje, DIAS_LETIVOS)
  const usados = new Set()
  const turmas = []
  const alunos = []
  const frequencias = {}

  for (const t of TURMAS) {
    turmas.push({ id: t.id, nome: t.nome, turno: t.turno })
    const daTurma = []
    for (let i = 0; i < t.alunos; i++) {
      let nome
      do nome = `${pick(NOMES)} ${pick(SOBRENOMES)} ${pick(SOBRENOMES)}`
      while (usados.has(nome))
      usados.add(nome)

      const perfil = sortearPerfil(rand)
      const b1 = perfil === 'regular' ? entre(6.5, 9.8) : perfil === 'atencao' ? entre(5.5, 8) : entre(5.5, 8.5)
      const queda = perfil === 'regular' ? entre(-0.8, 0.8) : perfil === 'atencao' ? entre(0, 1.8) : entre(1.5, 4)
      daTurma.push({
        id: `${t.id}-${String(i + 1).padStart(2, '0')}`,
        nome,
        turmaId: t.id,
        // Uma aluna transferida no meio do período: a frequência dela só
        // conta a partir da matrícula.
        matriculaEm: i === 3 && t.id === 't-7b' ? dias[20] : dias[0],
        responsavel: `${pick(NOMES)} ${nome.split(' ').at(-1)}`,
        telefone: `(11) 9${Math.floor(entre(1000, 9999))}-${Math.floor(entre(1000, 9999))}`,
        notas: [
          { bimestre: 1, media: arred(b1) },
          { bimestre: 2, media: arred(Math.max(0, Math.min(10, b1 - queda))) },
        ],
        _perfil: perfil,
      })
    }
    daTurma.sort((a, b) => a.nome.localeCompare(b.nome))

    const registros = {}
    dias.forEach((dia, d) => {
      registros[dia] = daTurma
        .filter((a) => dia >= a.matriculaEm)
        .filter((a) => {
          const fimDoPeriodo = d >= DIAS_LETIVOS - 4
          if (a._perfil === 'risco') return fimDoPeriodo ? rand() < 0.85 : rand() < 0.2
          if (a._perfil === 'atencao') return rand() < 0.1
          return rand() < 0.03
        })
        .map((a) => a.id)
    })
    frequencias[t.id] = registros
    alunos.push(...daTurma)
  }

  // Um caso já em acompanhamento, para a tela de intervenções e o painel de
  // próximos acompanhamentos não começarem vazios.
  const exemplo = alunos.find((a) => a._perfil === 'risco')
  const intervencoes = exemplo
    ? [
        {
          id: 'demo-1',
          alunoId: exemplo.id,
          data: dias.at(-3),
          tipo: 'contato-familia',
          responsavel: 'Orientação educacional',
          descricao: 'Ligação para a família após faltas seguidas. Responsável relatou mudança de endereço.',
          resultado: 'Família informada; ficou de comparecer à escola.',
          proximoAcompanhamento: dataISO(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 3)),
          criadaEm: new Date(hoje).toISOString(),
        },
      ]
    : []

  return {
    versao: 1,
    geradoEm: dataISO(hoje),
    escola: { nome: 'Escola Estadual Fictícia de Demonstração' },
    turmas,
    alunos: alunos.map(({ _perfil, ...a }) => a),
    frequencias,
    intervencoes,
    alertasVistos: {},
  }
}
