// Paletas das duas áreas do app. Mesmo desenho, cores diferentes: membro sempre azul, profissional
// sempre verde (regra do projeto). As telas escolhem a área e os componentes de `components/ui`
// pintam tudo a partir daqui — assim as duas áreas ficam iguais sem copiar estilo.
export type Area = 'cuidador' | 'membro';

export interface PaletaArea {
  escuro: string;
  principal: string;
  claro: string;
  /** Fundo de ícones em círculo, caixas de destaque. */
  suave: string;
  /** Borda de caixas com fundo `suave`. */
  borda: string;
  /** Texto forte sobre fundo claro (valores em dinheiro, títulos de destaque). */
  texto: string;
  gradiente: readonly [string, string];
}

export const paletas: Record<Area, PaletaArea> = {
  cuidador: {
    escuro: '#0f3d26',
    principal: '#1a5c3a',
    claro: '#2f8a5c',
    suave: '#ecfdf3',
    borda: '#bbf7d0',
    texto: '#0f3d26',
    gradiente: ['#0f3d26', '#1a5c3a'],
  },
  membro: {
    escuro: '#1e3a8a',
    principal: '#1e40af',
    claro: '#3b82f6',
    suave: '#eff6ff',
    borda: '#bfdbfe',
    texto: '#1e3a8a',
    gradiente: ['#1e3a8a', '#2563eb'],
  },
};

// Tons das etiquetas de status e caixas de aviso: fundo claro + texto escuro da mesma cor
// (contraste AA). laranja = novo/pendente, verde = pago/feito, vermelho = problema, azul = em
// andamento, cinza = encerrado/neutro.
export type Tom = 'laranja' | 'verde' | 'vermelho' | 'azul' | 'cinza' | 'roxo';

export const tons: Record<Tom, { fundo: string; texto: string; forte: string; borda: string }> = {
  laranja: { fundo: '#fff7ed', texto: '#9a3412', forte: '#c2410c', borda: '#fdba74' },
  verde: { fundo: '#f0fdf4', texto: '#166534', forte: '#15803d', borda: '#bbf7d0' },
  vermelho: { fundo: '#fef2f2', texto: '#991b1b', forte: '#b91c1c', borda: '#fecaca' },
  azul: { fundo: '#eff6ff', texto: '#1e3a8a', forte: '#1e40af', borda: '#bfdbfe' },
  cinza: { fundo: '#f1f5f9', texto: '#334155', forte: '#475569', borda: '#e2e8f0' },
  roxo: { fundo: '#f5f3ff', texto: '#5b21b6', forte: '#6d28d9', borda: '#ddd6fe' },
};
