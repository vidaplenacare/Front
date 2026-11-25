import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import type { CategoriaProfissional } from '../data/profissionais';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

interface Categoria {
  id: CategoriaProfissional;
  titulo: string;
  descricao: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const categorias: Categoria[] = [
  {
    id: 'cuidador',
    titulo: 'Cuidador de Idosos',
    descricao: 'Apoio na rotina, higiene pessoal e mobilidade',
    icon: 'people',
    color: colors.blue,
  },
  {
    id: 'enfermeiro',
    titulo: 'Enfermagem',
    descricao: 'Curativos, medicação e cuidados clínicos',
    icon: 'medkit',
    color: colors.success,
  },
  {
    id: 'fisioterapeuta',
    titulo: 'Fisioterapia',
    descricao: 'Reabilitação motora e prevenção de quedas',
    icon: 'walk',
    color: colors.purple,
  },
  {
    id: 'acompanhante',
    titulo: 'Acompanhante',
    descricao: 'Companhia e segurança em qualquer horário',
    icon: 'moon',
    color: colors.orange,
  },
];

export function CuidadoresCategoriaScreen({ navigation }: RootStackScreenProps<'CuidadoresCategoria'>) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Cuidadores Credenciados"
        subtitle="Escolha o tipo de cuidado que você precisa"
        onBack={() => navigation.goBack()}
        gradientColors={gradients.cuidadores}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {categorias.map((categoria) => (
          <TouchableOpacity
            key={categoria.id}
            style={[styles.card, shadows.card]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Cuidadores', { categoriaInicial: categoria.id })}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${categoria.color}15` }]}>
              <Ionicons name={categoria.icon} size={28} color={categoria.color} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{categoria.titulo}</Text>
              <Text style={styles.cardSubtitle}>{categoria.descricao}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.verTodosButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Cuidadores', { categoriaInicial: 'todos' })}
        >
          <Text style={styles.verTodosText}>Ver todos os profissionais</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  cardSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  verTodosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  verTodosText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.primary },
});
