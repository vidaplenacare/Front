import React, { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, fontSize, fontWeight, gradients, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function RecuperarSenhaScreen({ navigation }: RootStackScreenProps<'RecuperarSenha'>) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Recuperar Senha"
        onBack={() => navigation.goBack()}
        gradientColors={gradients.loginMembro}
      />
      {/* Teclado não cobre os campos (Android edge-to-edge, hooks/useTeclado.ts). */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
      <SafeAreaView edges={['bottom']} style={styles.content}>
        {enviado ? (
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Link enviado!</Text>
            <Text style={styles.successMessage}>
              Enviamos um link de recuperação para {email || 'seu e-mail'}. Verifique sua caixa de
              entrada.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.description}>
              Informe o e-mail cadastrado para receber o link de recuperação de senha.
            </Text>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.button, !email && styles.buttonDisabled]}
              disabled={!email}
              onPress={() => setEnviado(true)}
            >
              <Text style={styles.buttonText}>Enviar link</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg },
  description: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  successWrap: { alignItems: 'center', marginTop: spacing.xl },
  successIcon: { marginBottom: spacing.md },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
