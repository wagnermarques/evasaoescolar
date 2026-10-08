/** Tipos de intervenção (RF-05; glossário: "contato, reunião, encaminhamento").
 *  Lista a validar com a orientação educacional. */
export const TIPOS_INTERVENCAO = [
  { id: 'contato-familia', label: 'Contato com a família', icon: 'call' },
  { id: 'reuniao-familia', label: 'Reunião com a família', icon: 'groups' },
  { id: 'conversa-aluno', label: 'Conversa com o aluno', icon: 'forum' },
  { id: 'encaminhamento-orientacao', label: 'Encaminhamento à orientação educacional', icon: 'assignment_ind' },
  { id: 'encaminhamento-rede', label: 'Encaminhamento à rede de proteção (CRAS, Conselho Tutelar)', icon: 'diversity_3' },
  { id: 'visita-domiciliar', label: 'Visita domiciliar', icon: 'home' },
  { id: 'apoio-pedagogico', label: 'Apoio pedagógico / reforço', icon: 'school' },
  { id: 'outro', label: 'Outro', icon: 'more_horiz' },
]

export function tipoDeIntervencao(id) {
  return TIPOS_INTERVENCAO.find((t) => t.id === id) ?? { id, label: id, icon: 'more_horiz' }
}
