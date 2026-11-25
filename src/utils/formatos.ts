// Formatação de texto para as telas (dinheiro, datas). Tudo em pt-BR, escrito por extenso quando
// ajuda quem lê devagar ("Quarta, 01 de outubro" em vez de "2026-10-01").

import { horasEntre } from './atendimento';

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function reais(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

// "2026-10-01" → Date ao meio-dia local (evita virar o dia anterior por causa do fuso).
function deDataIso(data: string): Date | null {
  const d = new Date(`${data.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** "Qui, 02/10" */
export function diaCurto(data: string): string {
  const d = deDataIso(data);
  if (!d) return data;
  return `${DIAS_CURTOS[d.getDay()]}, ${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`;
}

/** "Quarta, 01 de outubro" */
export function diaLongo(data: string): string {
  const d = deDataIso(data);
  if (!d) return data;
  return `${DIAS_LONGOS[d.getDay()]}, ${doisDigitos(d.getDate())} de ${MESES[d.getMonth()]}`;
}

/** Para o bloco de calendário: { semana: 'QUA', dia: '01', mes: 'OUT' } */
export function partesDoDia(data: string): { semana: string; dia: string; mes: string } {
  const d = deDataIso(data);
  if (!d) return { semana: '', dia: '', mes: '' };
  return {
    semana: DIAS_CURTOS[d.getDay()].toUpperCase().slice(0, 3),
    dia: doisDigitos(d.getDate()),
    mes: MESES[d.getMonth()].slice(0, 3).toUpperCase(),
  };
}

/** "8 horas", "1 hora", "2h30" */
export function duracaoTexto(inicio: string, fim: string): string {
  const horas = horasEntre(inicio, fim);
  const inteiras = Math.floor(horas);
  const minutos = Math.round((horas - inteiras) * 60);
  if (minutos === 0) return `${inteiras} ${inteiras === 1 ? 'hora' : 'horas'}`;
  return `${inteiras}h${doisDigitos(minutos)}`;
}

/** "29/09 · 16:36" a partir de um ISO completo. */
export function dataHoraCurta(iso: string): string {
  const d = new Date(iso);
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)} · ${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

/** "Bom dia" / "Boa tarde" / "Boa noite" */
export function saudacao(agora = new Date()): string {
  const h = agora.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
