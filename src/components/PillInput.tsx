import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface PillInputProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  icon: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  /** Cor da borda quando o campo está em foco (padrão: azul do membro). */
  corFoco?: string;
}

// Campo com ícone. Mesmo visual do `Campo` de components/ui (canto 16, borda que acende no foco),
// para as telas antigas combinarem com as refeitas.
export function PillInput({ icon, rightIcon, onRightIconPress, corFoco = colors.blue, onFocus, onBlur, ...inputProps }: PillInputProps) {
  const [focado, setFocado] = useState(false);
  return (
    <View style={[styles.wrap, focado && { borderColor: corFoco }]}>
      <Ionicons name={icon} size={20} color={focado ? corFoco : colors.gray500} />
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.gray400}
        {...inputProps}
        onFocus={(e) => {
          setFocado(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          onBlur?.(e);
        }}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.direita} accessibilityRole="button">
          <Ionicons name={rightIcon} size={22} color={colors.gray500} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 17, color: colors.text },
  direita: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
});
