import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../theme';

// Largura do card por quantidade de colunas da grade. Some sempre um pouco menos que 100% para
// sobrar espaço pro `gap` do container (ver `servicesGrid` em HomeScreen).
const LARGURA_POR_COLUNAS: Record<number, DimensionValue> = {
  2: '47%',
  3: '31%',
  4: '23%',
};

interface ServiceCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  /**
   * Cor do serviço: pinta a linha de baixo do card branco (e o ícone, se `corIcone` não vier).
   * ⚠️ A cor continua obrigatória por serviço: é acessibilidade — o público idoso lembra da área
   * pela cor (usuário, 2026-09-30). Desde 2026-10-15 ela aparece só na linha e no ícone, não mais
   * no fundo inteiro ("muito colorido" para os clientes).
   */
  color: string;
  /**
   * Cor do ícone, quando a cor do serviço é clara demais para traço fino em fundo branco
   * (laranja, amarelo, azul-claro). Sem ela, o ícone usa `color`.
   */
  corIcone?: string;
  onPress: () => void;
  /** Quantas colunas a grade tem nesta largura de tela. Padrão 2 (celular). */
  colunas?: number;
  /** Contador exibido no canto do card (ex.: pagamentos pendentes). Some quando é 0. */
  badge?: number;
}

export function ServiceCard({ title, icon, color, corIcone, onPress, colunas = 2, badge }: ServiceCardProps) {
  // O card cresce com a tela (aspectRatio 1 + largura em % — ver LARGURA_POR_COLUNAS), então o
  // ícone e a caixinha ao redor dele também precisam crescer proporcionalmente, senão ficam
  // pequenos e "soltos" dentro de um card grande em tablet. Mede o lado real do card renderizado
  // (em vez de supor um tamanho fixo por dispositivo) para funcionar em qualquer aparelho/rotação.
  const [ladoCard, setLadoCard] = useState(0);
  const aoMedirCard = (evento: LayoutChangeEvent) => setLadoCard(evento.nativeEvent.layout.width);

  const iconWrapLado = ladoCard > 0 ? ladoCard * 0.32 : 56;
  // Sem a caixinha translúcida atrás (removida a pedido do usuário em 2026-09-30), o ícone de
  // traço fica um pouco maior (0.17 → 0.2, ~36 no celular) para não parecer perdido no card.
  const iconSize = ladoCard > 0 ? ladoCard * 0.2 : 36;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: LARGURA_POR_COLUNAS[colunas] ?? LARGURA_POR_COLUNAS[2],
          height: ladoCard > 0 ? ladoCard : undefined,
        },
        shadows.suave,
      ]}
      onPress={onPress}
      onLayout={aoMedirCard}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${title}, ${badge} pendentes` : title}
    >
      {/* Linha colorida de baixo. Fica numa camada própria com overflow hidden para acompanhar o
          canto arredondado: pôr overflow hidden no card cortaria a sombra no iOS, e
          borderBottomWidth no card desenharia um arco que afina nos cantos. */}
      <View style={styles.camadaLinha} pointerEvents="none">
        <View style={[styles.linha, { backgroundColor: color }]} />
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
      <View
        style={[
          styles.iconWrap,
          { width: iconWrapLado, height: iconWrapLado },
        ]}
      >
        <Ionicons name={icon} size={iconSize} color={corIcone ?? color} />
      </View>
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    // largura vem inline (LARGURA_POR_COLUNAS); tamanho geral validado com o usuário em
    // 2026-07-09 (ver DEV-NOTES.md). iconWrap/ícone passaram a ter tamanho proporcional ao card
    // (calculado em runtime, ver `ladoCard` acima) em 2026-09-14, pra ficar centralizado e
    // proporcional em qualquer tamanho de tela/dispositivo — não voltar a valores fixos.
    // aspectRatio sozinho não garante card quadrado dentro da grade com flexWrap: no tablet (3
    // colunas) os cards saíam 233×185 e os das colunas laterais mantinham o conteúdo posicionado
    // pro quadrado de 233 (bloco empurrado pra baixo). Por isso: alignSelf flex-start (a linha da
    // grade não estica o card) + height explícito = largura medida (ver `ladoCard`).
    aspectRatio: 1,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    // width/height vêm inline, proporcionais ao card (ver ladoCard). Sem fundo desde 2026-09-30:
    // a caixa continua existindo só para manter o bloco ícone+título com a mesma altura.
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  // Título com altura fixa de UMA linha: o card centraliza ícone+título como um bloco só, e no
  // Android um Text em negrito às vezes é medido com uma linha extra que não desenha — isso
  // empurrava o bloco pra baixo só em alguns cards (dependia da palavra). Com 1 linha, lineHeight
  // explícito e sem font padding, o bloco tem a mesma altura em todos os cards.
  camadaLinha: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  // Espessura aprovada na prévia de 2026-10-15 (5px).
  linha: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 5 },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});
