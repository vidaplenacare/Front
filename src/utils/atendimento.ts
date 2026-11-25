// Helpers de faixa de horário do atendimento. O contratante escolhe "das X às Y" e é essa
// duração que define o preço (cobrança por hora, decidida em 2026-09-10).

import type { SolicitacaoCuidador } from '../contexts/AppContext';

export function paraMinutos(horario: string): number {
  const [hora, minuto] = horario.split(':').map(Number);
  return hora * 60 + (minuto || 0);
}

export function horasEntre(inicio: string, fim: string): number {
  return Math.max(0, (paraMinutos(fim) - paraMinutos(inicio)) / 60);
}

export function faixaHorario(inicio: string, fim?: string): string {
  return fim ? `${inicio} às ${fim}` : inicio;
}

/**
 * Valor cobrado do membro: o que o SERVIDOR congelou ao criar a contratação (horas × valor/hora
 * daquele momento). ⚠️ Até 2026-09-30 isto recalculava com uma lista fixa de profissionais dentro
 * do app — o valor podia sair diferente do cobrado de verdade (e zerado para profissionais novos).
 */
export function valorDoAtendimento(solicitacao: SolicitacaoCuidador): number {
  return solicitacao.valorTotal;
}

/** Duas faixas se sobrepõem quando uma começa antes de a outra terminar (e vice-versa). */
export function faixasSobrepoem(
  inicioA: string,
  fimA: string,
  inicioB: string,
  fimB: string
): boolean {
  return paraMinutos(inicioA) < paraMinutos(fimB) && paraMinutos(inicioB) < paraMinutos(fimA);
}
