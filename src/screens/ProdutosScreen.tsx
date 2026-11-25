import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { completarUltimaLinha, useResponsivo } from '../hooks/useResponsivo';
import { useApp } from '../contexts/AppContext';
import { produtos, type CategoriaProduto, type Produto } from '../data/produtos';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const filtros: { id: 'todos' | CategoriaProduto; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'mobilidade', label: 'Mobilidade' },
  { id: 'higiene', label: 'Higiene' },
  { id: 'conforto', label: 'Conforto' },
  { id: 'seguranca', label: 'Segurança' },
];

export function ProdutosScreen({ navigation }: RootStackScreenProps<'Produtos'>) {
  const { carrinho, adicionarAoCarrinho } = useApp();
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | CategoriaProduto>('todos');
  const { porTamanho } = useResponsivo();
  const colunas = porTamanho(2, 3, 4);

  const totalItensCarrinho = carrinho.reduce((total, item) => total + item.quantidade, 0);
  const listaFiltrada = filtroAtivo === 'todos' ? produtos : produtos.filter((p) => p.categoria === filtroAtivo);

  const renderItem = ({ item }: { item: Produto | null }) => {
    // Vaga vazia da última linha — sem isso os cards restantes esticariam (ver completarUltimaLinha).
    if (!item) return <View style={styles.cardVazio} />;

    return (
    <View style={[styles.card, shadows.card]}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('ProdutoDetalhe', { produtoId: item.id })}>
        <Image source={{ uri: item.imagem }} style={styles.image} />
        <Text style={styles.name} numberOfLines={2}>
          {item.nome}
        </Text>
        <Text style={styles.descricao} numberOfLines={1}>
          {item.descricao}
        </Text>
        <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} onPress={() => adicionarAoCarrinho(item.id)}>
        <Ionicons name="cart" size={16} color={colors.white} />
        <Text style={styles.addButtonText}>Adicionar</Text>
      </TouchableOpacity>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Produtos para Idoso"
        subtitle="Conforto, segurança e bem-estar"
        onBack={() => navigation.goBack()}
        gradientColors={gradients.produtos}
        rightIcon="cart"
        rightBadge={totalItensCarrinho}
        onRightPress={() => navigation.navigate('Carrinho')}
      />

      <FlatList
        data={completarUltimaLinha(listaFiltrada, colunas)}
        keyExtractor={(item, index) => item?.id ?? `vaga-${index}`}
        renderItem={renderItem}
        // `numColumns` não pode mudar em tempo real numa FlatList já montada (o RN lança erro) —
        // a `key` força a remontagem quando a largura da tela muda de faixa (rotação/tablet).
        key={colunas}
        numColumns={colunas}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <FlatList
            data={filtros}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtrosContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, filtroAtivo === item.id && styles.chipActive]}
                onPress={() => setFiltroAtivo(item.id)}
              >
                <Text style={[styles.chipText, filtroAtivo === item.id && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  filtrosContent: { paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.blueLight, borderColor: colors.blueLight },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipTextActive: { color: colors.white },
  row: { gap: spacing.md },
  // Ocupa a vaga sem nada visível, para os cards reais da última linha não esticarem.
  cardVazio: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  image: { width: '100%', height: 100, borderRadius: radius.sm, marginBottom: spacing.xs },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  descricao: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  preco: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary, marginTop: spacing.xs },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  addButtonText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});
