export type CategoriaProfissional = 'cuidador' | 'enfermeiro' | 'fisioterapeuta' | 'acompanhante';

/** Nível de ocupação da agenda: livre = todos os horários livres, parcial = poucos já marcados, lotado = todos preenchidos. */
export type NivelOcupacao = 'livre' | 'parcial' | 'lotado';

export interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  categoria: CategoriaProfissional;
  experiencia: string;
  avaliacao: number;
  totalAvaliacoes: number;
  foto: string;
  nivelOcupacao: NivelOcupacao;
  bio: string;
  formacao: string;
  areasAtuacao: string[];
  disponibilidade: string;
  /** Dias da semana em que o profissional atende: 0 = domingo ... 6 = sábado. */
  diasDisponiveis: number[];
  horarioInicio: string;
  horarioFim: string;
  /**
   * Valor cobrado por HORA de atendimento (desde 2026-09-10, quando o contratante passou a
   * escolher a faixa de horário). O nome `valorVisita` é legado da coluna no Postgres — renomear
   * exige migração no back-end, registrada como pendência.
   */
  valorVisita: number;
  telefone: string;
}

// ⚠️ A lista FIXA de profissionais que ficava aqui foi APAGADA em 2026-09-30: telas que liam dela
// mostravam foto e valores antigos (ex.: foto de banco de imagens do "Carlos Eduardo Silva" no
// perfil, enquanto a lista do servidor já tinha a foto nova), e profissionais cadastrados de
// verdade nem existiam nela. Profissionais vêm SEMPRE do servidor: `buscarProfissionais()` /
// `useProfissional(id)`. Os dados de demonstração continuam no seed do back-end.