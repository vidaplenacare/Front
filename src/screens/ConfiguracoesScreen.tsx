import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { useDialogo } from '../components/Dialogo';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../contexts/AppContext';
import { TERMOS, TERMOS_DO_MEMBRO } from '../data/termos';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function ConfiguracoesScreen({ navigation }: RootStackScreenProps<'Configuracoes'>) {
  const { dadosPessoais, atualizarDadosPessoais, preferencias, atualizarPreferencias } = useApp();
  const dialogo = useDialogo();

  const [novoEmail, setNovoEmail] = useState(dadosPessoais.email);
  const [novaSenha, setNovaSenha] = useState('');

  // ⚠️ As três ações abaixo ainda são SIMULADAS (2026-09-29): não há rota no back-end para trocar
  // e-mail/senha, exportar dados nem excluir a conta — só o visual do diálogo foi atualizado.
  const salvarConta = () => {
    atualizarDadosPessoais({ email: novoEmail });
    setNovaSenha('');
    void dialogo.avisar({
      titulo: 'Conta atualizada',
      mensagem: 'Suas informações de acesso foram atualizadas.',
      tom: 'sucesso',
    });
  };

  const baixarDados = () => {
    void dialogo.avisar({
      titulo: 'Solicitação recebida',
      mensagem: 'Você receberá uma cópia dos seus dados por e-mail em até 24 horas.',
      icone: 'download-outline',
      tom: 'info',
    });
  };

  const excluirConta = async () => {
    const confirmado = await dialogo.confirmar({
      titulo: 'Excluir conta',
      mensagem: 'Esta ação é irreversível: todos os seus dados serão removidos. Deseja continuar?',
      icone: 'trash-outline',
      tom: 'perigo',
      confirmar: 'Excluir minha conta',
    });
    if (confirmado) navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Configurações" onBack={() => navigation.goBack()} gradientColors={gradients.perfil} />
      {/* Teclado não cobre os campos (Android edge-to-edge, hooks/useTeclado.ts). */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Conta</Text>
            <Text style={styles.label}>E-mail</Text>
            <TextInput style={styles.input} value={novoEmail} onChangeText={setNovoEmail} autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>Nova senha</Text>
            <TextInput style={styles.input} value={novaSenha} onChangeText={setNovaSenha} secureTextEntry placeholder="Deixe em branco para manter a atual" placeholderTextColor={colors.textLight} />
            <TouchableOpacity style={styles.button} onPress={salvarConta}>
              <Text style={styles.buttonText}>Salvar alterações</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Notificações</Text>
            <View style={styles.linha}>
              <Text style={styles.itemTitulo}>Notificações push</Text>
              <Switch value={preferencias.notificacoes} onValueChange={(v) => atualizarPreferencias({ notificacoes: v })} />
            </View>
            <View style={styles.linha}>
              <Text style={styles.itemTitulo}>Lembretes de medicamento</Text>
              <Switch value={preferencias.lembretes} onValueChange={(v) => atualizarPreferencias({ lembretes: v })} />
            </View>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Privacidade e Dados</Text>
            <TouchableOpacity style={styles.linkRow} onPress={baixarDados}>
              <Ionicons name="download" size={20} color={colors.blue} />
              <Text style={styles.linkText}>Baixar meus dados</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={excluirConta}>
              <Ionicons name="trash" size={20} color={colors.danger} />
              <Text style={[styles.linkText, { color: colors.danger }]}>Excluir minha conta</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Suporte</Text>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Central de Ajuda' })}
            >
              <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
              <Text style={styles.linkText}>Central de ajuda</Text>
            </TouchableOpacity>
            {TERMOS_DO_MEMBRO.map((id) => (
              <TouchableOpacity
                key={id}
                style={styles.linkRow}
                onPress={() => navigation.navigate('Termo', { id, area: 'membro' })}
              >
                <Ionicons
                  name={id === 'privacidade' ? 'shield-checkmark' : 'document-text'}
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.linkText}>{TERMOS[id].nomeCurto}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  button: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  buttonText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  itemTitulo: { fontSize: fontSize.md, color: colors.text },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  linkText: { fontSize: fontSize.md, color: colors.text },
});
