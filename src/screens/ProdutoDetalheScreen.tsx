import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { GradientButton } from '../components/GradientButton';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { useApp } from '../contexts/AppContext';
import { produtos } from '../data/produtos';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const categoriaLabels: Record<string, string> = {
  mobilidade: 'Mobilidade',
  higiene: 'Higiene',
  conforto: 'Conforto',
  seguranca: 'Segurança',
};

export function ProdutoDetalheScreen({ navigation, route }: RootStackScreenProps<'ProdutoDetalhe'>) {
  const { carrinho, adicionarAoCarrinho } = useApp();
  const produto = produtos.find((p) => p.id === route.params.produtoId);
  const [quantidade, setQuantidade] = useState(1);

  const totalItensCarrinho = carrinho.reduce((total, item) => total + item.quantidade, 0);

  if (!produto) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Produto não encontrado" onBack={() => navigation.goBack()} gradientColors={gradients.produtos} />
      </View>
    );
  }

  const adicionar = () => {
    adicionarAoCarrinho(produto.id, quantidade);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Produto"
        onBack={() => navigation.goBack()}
        gradientColors={gradients.produtos}
        rightIcon="cart"
        rightBadge={totalItensCarrinho}
        onRightPress={() => navigation.navigate('Carrinho')}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Image source={{ uri: produto.imagem }} style={styles.imagem} />

          <View style={styles.categoriaChip}>
            <Text style={styles.categoriaChipText}>{categoriaLabels[produto.categoria] ?? produto.categoria}</Text>
          </View>

          <Text style={styles.nome}>{produto.nome}</Text>
          <Text style={styles.preco}>R$ {produto.preco.toFixed(2)}</Text>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Descrição</Text>
            <Text style={styles.descricao}>{produto.descricao}</Text>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Quantidade</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantidade((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantidade}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantidade((q) => q + 1)}>
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerConteudo}>
            <View style={styles.footerTotalRow}>
              <Text style={styles.footerTotalLabel}>Subtotal</Text>
              <Text style={styles.footerTotalValue}>R$ {(produto.preco * quantidade).toFixed(2)}</Text>
            </View>
            <GradientButton
              title="Adicionar ao carrinho"
              icon="cart"
              gradientColors={gradients.produtos}
              onPress={adicionar}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { ...conteudoCentralizado, padding: spacing.lg, paddingBottom: spacing.lg },
  imagem: { width: '100%', height: 260, borderRadius: radius.md, backgroundColor: colors.gray100 },
  categoriaChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blueLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.md,
  },
  categoriaChipText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  nome: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.sm },
  preco: { fontSize: fontSize.display, fontWeight: fontWeight.bold, color: colors.primary, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  descricao: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, minWidth: 28, textAlign: 'center' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  // Acompanha a mesma largura do conteúdo acima, senão o botão fica esticado de ponta a ponta
  // no tablet enquanto os cards param no meio da tela.
  footerConteudo: {
    ...conteudoCentralizado,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  footerTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  footerTotalLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  footerTotalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
});
