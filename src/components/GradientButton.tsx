import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontWeight, gradients, spacing } from '../theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  gradientColors?: readonly [string, string, ...string[]];
}

// Botão principal antigo, com as medidas do visual novo (altura 54, canto 16) — é o mesmo desenho
// do `Botao` de components/ui. Telas refeitas usam `Botao` direto.
export function GradientButton({
  title,
  onPress,
  disabled,
  icon = 'arrow-forward',
  gradientColors = gradients.loginColaborador,
}: GradientButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <Text style={styles.text}>{title}</Text>
        <Ionicons name={icon} size={20} color={colors.white} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
  },
  buttonDisabled: { opacity: 0.45 },
  text: { color: colors.white, fontSize: 17, fontWeight: fontWeight.bold },
});
