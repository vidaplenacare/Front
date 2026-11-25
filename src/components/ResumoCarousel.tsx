import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconeCirculo } from './ui';
import { useResponsivo } from '../hooks/useResponsivo';
import { colors, fontSize, fontWeight, paletas, shadows, spacing, type Tom } from '../theme';

export interface ResumoCarouselItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Tom do ícone em círculo (visual novo: fundo claro + ícone escuro da mesma cor). */
  tom: Tom;
  label: string;
  value: string;
  onPress: () => void;
}

interface ResumoCarouselProps {
  items: ResumoCarouselItem[];
  autoAdvanceMs?: number;
}

// Itens por página, por faixa de largura de tela. ⚠️ Mudar só este número (e o layout dentro da
// `pageRow`) é a forma suportada de mexer na densidade do carrossel — a paginação continua sendo
// "1 página = 1 largura de container medida via onLayout", nunca largura fixa em dp por card nem
// cálculo de scroll por item (ver DEV-NOTES.md, seção do ResumoCarousel).
const ITENS_POR_PAGINA_CELULAR = 2;
const ITENS_POR_PAGINA_TABLET = 3;
const ITENS_POR_PAGINA_TABLET_GRANDE = 4;

function agruparEmPaginas<T>(items: T[], porPagina: number): T[][] {
  const paginas: T[][] = [];
  for (let i = 0; i < items.length; i += porPagina) {
    paginas.push(items.slice(i, i + porPagina));
  }
  return paginas;
}

export function ResumoCarousel({ items, autoAdvanceMs = 4000 }: ResumoCarouselProps) {
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const arrastandoRef = useRef(false);
  const { porTamanho } = useResponsivo();

  const maximoPorPagina = porTamanho(
    ITENS_POR_PAGINA_CELULAR,
    ITENS_POR_PAGINA_TABLET,
    ITENS_POR_PAGINA_TABLET_GRANDE
  );

  // Usa o maior valor até `maximoPorPagina` que divide a lista em páginas cheias. Sem isso, 4
  // cards com 3 por página deixam 1 card sozinho na última página (o card "esticado e feio" que
  // apareceu no tablet em 2026-09-10) — com 2 por página os dois grupos ficam completos.
  // Quando nenhum valor divide certo (ex.: 5 cards), mantém o máximo e as vagas que sobram viram
  // espaçadores invisíveis no `pageRow`.
  const itensPorPagina = useMemo(() => {
    for (let porPagina = maximoPorPagina; porPagina >= ITENS_POR_PAGINA_CELULAR; porPagina--) {
      if (items.length % porPagina === 0) return porPagina;
    }
    return maximoPorPagina;
  }, [items.length, maximoPorPagina]);

  const paginas = useMemo(() => agruparEmPaginas(items, itensPorPagina), [items, itensPorPagina]);

  // Reinicia se a lista de páginas encolher (ex.: item removido) e o índice ficar fora do range.
  useEffect(() => {
    if (index > paginas.length - 1) setIndex(0);
  }, [paginas.length, index]);

  useEffect(() => {
    if (paginas.length <= 1 || pageWidth === 0) return;
    const interval = setInterval(() => {
      if (arrastandoRef.current) return;
      setIndex((prev) => (prev + 1) % paginas.length);
    }, autoAdvanceMs);
    return () => clearInterval(interval);
  }, [paginas.length, pageWidth, autoAdvanceMs]);

  useEffect(() => {
    if (pageWidth === 0) return;
    scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
  }, [index, pageWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setPageWidth(event.nativeEvent.layout.width);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    arrastandoRef.current = false;
    if (pageWidth === 0) return;
    const novoIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setIndex(Math.max(0, Math.min(novoIndex, paginas.length - 1)));
  };

  return (
    <View onLayout={handleLayout}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={() => {
          arrastandoRef.current = true;
        }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {paginas.map((pagina, paginaIndex) => (
          <View key={paginaIndex} style={{ width: pageWidth }}>
            <View style={styles.pageRow}>
              {pagina.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, shadows.suave]}
                  onPress={item.onPress}
                  activeOpacity={0.85}
                  disabled={pageWidth === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label}: ${item.value}`}
                >
                  <IconeCirculo icone={item.icon} tom={item.tom} tamanho={48} />
                  <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                    {item.label}
                  </Text>
                  <Text style={styles.value} numberOfLines={3}>
                    {item.value}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* ⚠️ Vagas vazias da última página precisam existir como espaçadores invisíveis.
                  Sem isso, um card sozinho numa página de 3/4 vagas estica com `flex: 1` e vira
                  um quadrado gigante (`aspectRatio: 1`) — bug visto no tablet em 2026-09-10. */}
              {Array.from({ length: itensPorPagina - pagina.length }, (_, vagaIndex) => (
                <View key={`vaga-${vagaIndex}`} style={styles.cardVazio} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {paginas.length > 1 && (
        <View style={styles.dotsRow}>
          {paginas.map((pagina, i) => (
            <View key={pagina.map((item) => item.id).join('-')} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: spacing.sm },
  pageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  // Ocupa a mesma vaga de um card, sem nada visível — mantém os cards reais do mesmo tamanho
  // quando a última página não enche.
  cardVazio: { flex: 1, aspectRatio: 1 },
  card: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray600, textAlign: 'center' },
  value: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: colors.text, textAlign: 'center', lineHeight: 21 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray300 },
  // Só a Home do membro usa este carrossel — bolinha ativa na cor da área (azul).
  dotActive: { width: 20, backgroundColor: paletas.membro.principal },
});
