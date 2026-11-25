import React, { useState } from 'react';
import { KeyboardAvoidingView, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { PagamentoBox } from '../components/PagamentoBox';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { useApp, type ItemCarrinho } from '../contexts/AppContext';
import { produtos } from '../data/produtos';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';
import { abrirAPartirDoInicio, voltarAoInicio } from '../utils/navegacao';

type EtapaCheckout = 'carrinho' | 'pagamento' | 'sucesso';

export function CarrinhoScreen({ navigation }: RootStackScreenProps<'Carrinho'>) {
  const { carrinho, alterarQuantidade, removerDoCarrinho, limparCarrinho } = useApp();
  const [etapa, setEtapa] = useState<EtapaCheckout>('carrinho');

  const itensDetalhados = carrinho
    .map((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      return produto ? { ...item, produto } : null;
    })
    .filter((item): item is ItemCarrinho & { produto: (typeof produtos)[number] } => item !== null);

  const total = itensDetalhados.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0);

  const confirmarPagamento = () => {
    limparCarrinho();
    setEtapa('sucesso');
  };

  if (etapa === 'pagamento') {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Pagamento" onBack={() => setEtapa('carrinho')} gradientColors={gradients.produtos} />
        {/* Teclado não cobre os campos (Android edge-to-edge, hooks/useTeclado.ts). */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.listContent}>
            <View style={[styles.secaoCard, shadows.card]}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total do pedido</Text>
                <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
              </View>
            </View>
            <View style={[styles.secaoCard, shadows.card]}>
              <Text style={styles.secaoCardTitle}>Forma de pagamento</Text>
              <PagamentoBox valor={total} onConcluido={confirmarPagamento} />
            </View>
          </ScrollView>
        </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (etapa === 'sucesso') {
    return (
      <View style={styles.container}>
        {/* Fim da compra: volta ao início com o caminho limpo (`navigate('Home')` empilhava uma
            Home nova no React Navigation 7 — usuário, 2026-09-30). */}
        <ScreenHeader title="Carrinho" onBack={() => voltarAoInicio(navigation)} gradientColors={gradients.produtos} />
        <View style={styles.successWrap}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.successTitle}>Pedido realizado!</Text>
          <Text style={styles.successMessage}>Você receberá atualizações sobre a entrega.</Text>
          <TouchableOpacity style={styles.button} onPress={() => voltarAoInicio(navigation)}>
            <Text style={styles.buttonText}>Voltar para o início</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => abrirAPartirDoInicio(navigation, 'Produtos', undefined)} style={{ minHeight: 48, justifyContent: 'center' }}>
            <Text style={[styles.successMessage, { fontWeight: '700' }]}>Continuar comprando</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Carrinho" onBack={() => navigation.goBack()} gradientColors={gradients.produtos} />
      {/* Teclado não cobre os campos (Android edge-to-edge, hooks/useTeclado.ts). */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        {itensDetalhados.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="cart-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Seu carrinho está vazio</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Produtos')}>
              <Text style={styles.buttonText}>Ver produtos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={itensDetalhados}
              keyExtractor={(item) => item.produtoId}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={[styles.card, shadows.card]}>
                  <Image source={{ uri: item.produto.imagem }} style={styles.image} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.produto.nome}
                    </Text>
                    <Text style={styles.unitPrice}>R$ {item.produto.preco.toFixed(2)} un.</Text>
                    <View style={styles.quantityRow}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => alterarQuantidade(item.produtoId, item.quantidade - 1)}
                      >
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantidade}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => alterarQuantidade(item.produtoId, item.quantidade + 1)}
                      >
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.removeButton} onPress={() => removerDoCarrinho(item.produtoId)}>
                        <Ionicons name="trash" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.subtotal}>R$ {(item.produto.preco * item.quantidade).toFixed(2)}</Text>
                </View>
              )}
            />
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={() => setEtapa('pagamento')}>
                <Text style={styles.buttonText}>Ir para pagamento</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { ...conteudoCentralizado, padding: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  image: { width: 64, height: 64, borderRadius: radius.sm },
  cardInfo: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  unitPrice: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text, minWidth: 20, textAlign: 'center' },
  removeButton: { marginLeft: spacing.sm },
  subtotal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  footer: {
    ...conteudoCentralizado,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  totalLabel: { fontSize: fontSize.lg, color: colors.text },
  totalValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  secaoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  secaoCardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: fontWeight.medium },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  successTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  successMessage: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
});
