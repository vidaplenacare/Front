import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, fontSize, fontWeight, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function EmConstrucaoScreen({ navigation, route }: RootStackScreenProps<'EmConstrucao'>) {
  const { titulo, mensagem, accentColor } = route.params;
  const cor = accentColor ?? colors.primary;

  return (
    <View style={styles.container}>
      <ScreenHeader title={titulo} onBack={() => navigation.goBack()} gradientColors={[cor, colors.primary]} />
      <SafeAreaView edges={['bottom']} style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: `${cor}20` }]}>
          <Ionicons name="construct" size={48} color={cor} />
        </View>
        <Text style={styles.title}>Em construção</Text>
        <Text style={styles.message}>
          {mensagem ?? 'Esta funcionalidade estará disponível em breve. Estamos trabalhando para trazer a melhor experiência para você.'}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
