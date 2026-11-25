import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, spacing } from '../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  gradientColors?: readonly [string, string, ...string[]];
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightBadge?: number;
}

// Cabeçalho das telas antigas, no desenho do visual novo (mesmo do `CabecalhoHero` de
// components/ui): "← Voltar" em cima, título grande alinhado à esquerda, botão redondo à direita.
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  gradientColors = [colors.blue, colors.blueLight],
  rightIcon,
  onRightPress,
  rightBadge,
}: ScreenHeaderProps) {
  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView edges={['top']}>
        {(onBack || rightIcon) && (
          <View style={styles.row}>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.voltar}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Ionicons name="arrow-back" size={22} color={colors.white} />
                <Text style={styles.voltarTexto}>Voltar</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {rightIcon && (
              <TouchableOpacity
                onPress={onRightPress}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={rightBadge ? `${rightBadge} novas` : undefined}
              >
                <Ionicons name={rightIcon} size={24} color={colors.white} />
                {rightBadge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{rightBadge > 9 ? '9+' : rightBadge}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingRight: spacing.sm },
  voltarTexto: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.white, fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold, marginTop: spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.88)', fontSize: fontSize.md, marginTop: spacing.xs, lineHeight: 22 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: fontWeight.extrabold },
});
