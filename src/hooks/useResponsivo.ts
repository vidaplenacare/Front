import { useWindowDimensions } from 'react-native';

// Cortes de largura em dp. 600 é onde tablets pequenos (7"/8") já têm espaço sobrando para o
// layout pensado no celular; 900 cobre tablets grandes (10"+) e paisagem.
// Usa `useWindowDimensions` (não `Dimensions.get`) de propósito: reage a rotação e a mudança de
// tamanho de janela sem precisar de listener manual.
export const LARGURA_TABLET = 600;
export const LARGURA_TABLET_GRANDE = 900;

/**
 * Estilo para o conteúdo de telas de formulário/detalhe (uma coluna só): limita a largura e
 * centraliza. Sem isso, num tablet um formulário vira uma faixa de 1000dp de largura, com campos
 * e cards esticados e ilegíveis. Telas de grade/lista não usam isto — elas ganham mais colunas.
 * Aplicar no `contentContainerStyle` do ScrollView/FlatList, não no container externo.
 */
export const conteudoCentralizado = {
  width: '100%',
  maxWidth: 720,
  alignSelf: 'center',
} as const;

/**
 * Completa a última linha de uma grade com vagas vazias (`null`) para que os itens reais mantenham
 * a mesma largura das linhas cheias.
 *
 * ⚠️ Necessário sempre que os cards da grade usarem `flex: 1`: numa última linha incompleta, os
 * poucos itens restantes esticam para preencher a linha inteira (com `aspectRatio` viram blocos
 * gigantes). Bug visto no tablet em 2026-09-10, no carrossel da Home e nas grades.
 */
export function completarUltimaLinha<T>(itens: T[], colunas: number): (T | null)[] {
  if (colunas <= 1 || itens.length === 0) return itens;
  const faltando = (colunas - (itens.length % colunas)) % colunas;
  return faltando === 0 ? itens : [...itens, ...(Array(faltando).fill(null) as null[])];
}

export interface Responsivo {
  largura: number;
  isTablet: boolean;
  isTabletGrande: boolean;
  /**
   * Escolhe um valor por faixa de largura. Se o valor da faixa maior não for informado, cai para
   * o da faixa anterior — `porTamanho(2, 3)` dá 2 no celular e 3 em qualquer tablet.
   */
  porTamanho: <T>(celular: T, tablet?: T, tabletGrande?: T) => T;
}

export function useResponsivo(): Responsivo {
  const { width } = useWindowDimensions();
  const isTablet = width >= LARGURA_TABLET;
  const isTabletGrande = width >= LARGURA_TABLET_GRANDE;

  return {
    largura: width,
    isTablet,
    isTabletGrande,
    porTamanho: (celular, tablet, tabletGrande) => {
      if (isTabletGrande && tabletGrande !== undefined) return tabletGrande;
      if (isTablet && tablet !== undefined) return tablet;
      return celular;
    },
  };
}
