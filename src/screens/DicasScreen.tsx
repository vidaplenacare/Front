import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { completarUltimaLinha, useResponsivo } from '../hooks/useResponsivo';
import { dicas, type CategoriaDica, type Dica } from '../data/dicas';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const filtros: { id: 'todas' | CategoriaDica; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'nutricao', label: 'Nutrição' },
  { id: 'exercicios', label: 'Exercícios' },
  { id: 'saudeMental', label: 'Saúde Mental' },
  { id: 'prevencao', label: 'Prevenção' },
];

export function DicasScreen({ navigation }: RootStackScreenProps<'Dicas'>) {
  const [filtroAtivo, setFiltroAtivo] = useState<'todas' | CategoriaDica>('todas');
  const { porTamanho } = useResponsivo();
  const colunas = porTamanho(1, 2, 3);

  const listaFiltrada = filtroAtivo === 'todas' ? dicas : dicas.filter((d) => d.categoria === filtroAtivo);

  const renderItem = ({ item }: { item: Dica | null }) => {
    // Vaga vazia da última linha — sem isso os cards restantes esticariam.
    if (!item) return <View style={styles.cardVazio} />;

    return (
      <TouchableOpacity
        style={[styles.card, colunas > 1 && styles.cardEmColunas, shadows.card]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DicaDetalhe', { dicaId: item.id })}
      >
        <Image source={{ uri: item.imagem }} style={styles.image} />
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>
            {item.titulo}
          </Text>
          <Text style={styles.tempo}>{item.tempoLeitura} de leitura</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Dicas de Cuidado"
        subtitle="Saúde, bem-estar e qualidade de vida"
        onBack={() => navigation.goBack()}
        gradientColors={gradients.dicas}
      />

      <FlatList
        data={completarUltimaLinha(listaFiltrada, colunas)}
        keyExtractor={(item, index) => item?.id ?? `vaga-${index}`}
        renderItem={renderItem}
        // `numColumns` não muda em tempo real numa lista já montada — a `key` remonta quando a
        // largura muda de faixa (rotação/tablet). `columnWrapperStyle` só vale com 2+ colunas.
        key={colunas}
        numColumns={colunas}
        columnWrapperStyle={colunas > 1 ? styles.linhaColunas : undefined}
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
  listContent: { paddingBottom: spacing.xl },
  filtrosContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipTextActive: { color: colors.white },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  // Em 2+ colunas a margem lateral sai do card e vira padding da linha (`linhaColunas`).
  cardEmColunas: { flex: 1, marginHorizontal: 0 },
  linhaColunas: { gap: spacing.md, paddingHorizontal: spacing.lg },
  // Ocupa a vaga sem nada visível, para os cards reais da última linha não esticarem.
  cardVazio: { flex: 1 },
  image: { width: 96, height: 96 },
  cardBody: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  tempo: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
});
