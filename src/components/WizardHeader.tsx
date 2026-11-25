import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, gradients, spacing } from '../theme';

interface WizardHeaderProps {
  title: string;
  subtitle: string;
  step?: number;
  totalSteps?: number;
  onBack: () => void;
  gradientColors?: readonly [string, string, ...string[]];
}

export function WizardHeader({
  title,
  subtitle,
  step,
  totalSteps,
  onBack,
  gradientColors = gradients.loginColaborador,
}: WizardHeaderProps) {
  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView edges={['top']}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[styles.subtitle, !totalSteps && styles.subtitleNoProgress]}>{subtitle}</Text>

        {!!totalSteps && (
          <View style={styles.progressRow}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View key={index} style={[styles.segment, index < (step ?? 0) && styles.segmentActive]} />
            ))}
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    minHeight: 48,
  },
  backText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  title: {
    color: colors.white,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.extrabold,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  subtitleNoProgress: { marginBottom: 0 },
  progressRow: { flexDirection: 'row', gap: spacing.xs },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  segmentActive: { backgroundColor: colors.white },
});
