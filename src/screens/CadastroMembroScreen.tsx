import React, { useState } from 'react';
import { KeyboardAvoidingView, ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientButton } from '../components/GradientButton';
import { ListaTermos } from '../components/ListaTermos';
import { TERMOS_DO_MEMBRO, VERSAO_TERMOS, declaracaoDeAceite } from '../data/termos';
import { PillInput } from '../components/PillInput';
import { WizardHeader } from '../components/WizardHeader';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import { maskCpf, maskTelefone } from '../utils/masks';
import type { RootStackScreenProps } from '../navigation/types';

// Termos aceitos na criação da conta do membro/contratante: Termo de Uso, Termo do Contratante e
// Política de Privacidade (versão oficial de 16.10.2026, em `data/termos.ts`). Substituíram em
// 2026-10-22 o rascunho de "termo de responsabilidade e uso" que ficava aqui.

export function CadastroMembroScreen({ navigation }: RootStackScreenProps<'CadastroMembro'>) {
  const { atualizarDadosPessoais } = useApp();
  const { cadastrarMembro } = useAuth();
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // RG/selfie deixaram de ser obrigatórios (ver DEV-NOTES.md 2026-08-15) — só o termo de uso, que
  // é uma formalidade legal básica, não verificação de identidade.
  const [rgEnviado, setRgEnviado] = useState(false);
  const [selfieEnviada, setSelfieEnviada] = useState(false);
  const [aceiteTermos, setAceiteTermos] = useState(false);

  // CPF fica opcional (ver DEV-NOTES.md 2026-08-15); endereço continua obrigatório — não é campo
  // de verificação/KYC, é o ponto de referência usado pelo mapa de acompanhamento do cuidador.
  const etapa1Valida =
    nome.trim().length > 0 &&
    email.trim().length > 0 &&
    telefone.length >= 14 &&
    endereco.trim().length > 0 &&
    senha.length >= 6 &&
    senha === confirmarSenha;

  const etapa2Valida = aceiteTermos;

  const concluirCadastro = async () => {
    setErro(null);
    setEnviando(true);
    try {
      await cadastrarMembro({
        nome,
        email: email.trim(),
        senha,
        telefone,
        cpf: cpf.trim() || undefined,
        versaoTermos: VERSAO_TERMOS,
      });
      atualizarDadosPessoais({
        nome,
        cpf,
        email,
        telefone,
        endereco,
        documentoStatus: 'pendente',
      });
      navigation.replace('Home');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar sua conta. Tente novamente.');
      setEnviando(false);
    }
  };

  if (enviando) {
    return (
      <View style={styles.analiseContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.analiseTitle}>Criando sua conta...</Text>
        <Text style={styles.analiseSubtitle}>Isso pode levar alguns instantes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WizardHeader
        title="Criar Conta"
        subtitle={`Cadastro de membro — etapa ${etapa} de 2`}
        step={etapa}
        totalSteps={2}
        onBack={() => navigation.goBack()}
        gradientColors={gradients.loginMembro}
      />

      {/* Teclado não cobre os campos (Android edge-to-edge, hooks/useTeclado.ts). */}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>

      <SafeAreaView edges={['bottom']} style={styles.body}>
        <View style={[styles.card, shadows.card]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardContent}>
            {etapa === 1 ? (
              <>
                <Text style={styles.sectionTitle}>Dados pessoais</Text>
                <Text style={styles.label}>Nome completo</Text>
                <PillInput icon="person" value={nome} onChangeText={setNome} placeholder="Seu nome" />

                <Text style={styles.label}>CPF</Text>
                <PillInput icon="card" value={cpf} onChangeText={(v) => setCpf(maskCpf(v))} placeholder="000.000.000-00" keyboardType="numeric" />

                <Text style={styles.label}>E-mail</Text>
                <PillInput icon="mail" value={email} onChangeText={setEmail} placeholder="seuemail@exemplo.com" autoCapitalize="none" keyboardType="email-address" />

                <Text style={styles.label}>Telefone</Text>
                <PillInput icon="call" value={telefone} onChangeText={(v) => setTelefone(maskTelefone(v))} placeholder="(00) 00000-0000" keyboardType="phone-pad" />

                <Text style={styles.label}>Endereço</Text>
                <PillInput
                  icon="location"
                  value={endereco}
                  onChangeText={setEndereco}
                  placeholder="Rua, número - Bairro, Cidade - UF"
                />
                <Text style={styles.enderecoAjuda}>
                  Esse endereço é usado para acompanhar a chegada do cuidador no mapa.
                </Text>

                <Text style={styles.label}>Senha</Text>
                <PillInput
                  icon="lock-closed"
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Senha"
                  secureTextEntry={!mostrarSenha}
                  rightIcon={mostrarSenha ? 'eye-off' : 'eye'}
                  onRightIconPress={() => setMostrarSenha((v) => !v)}
                />

                <Text style={styles.label}>Confirmar senha</Text>
                <PillInput
                  icon="lock-closed"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Confirme a senha"
                  secureTextEntry={!mostrarConfirmarSenha}
                  rightIcon={mostrarConfirmarSenha ? 'eye-off' : 'eye'}
                  onRightIconPress={() => setMostrarConfirmarSenha((v) => !v)}
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Verificação de identidade</Text>
                <Text style={styles.description}>
                  Verificar sua identidade é opcional por enquanto — dá pra fazer depois, a
                  qualquer momento.
                </Text>

                <TouchableOpacity style={styles.uploadCard} onPress={() => setRgEnviado((v) => !v)} activeOpacity={0.8}>
                  <Ionicons
                    name={rgEnviado ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={rgEnviado ? colors.success : colors.textSecondary}
                  />
                  <View style={styles.uploadTextWrap}>
                    <Text style={styles.uploadTitle}>Enviar RG</Text>
                    <Text style={styles.uploadSubtitle}>Opcional — foto da frente e verso do documento</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadCard} onPress={() => setSelfieEnviada((v) => !v)} activeOpacity={0.8}>
                  <Ionicons
                    name={selfieEnviada ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selfieEnviada ? colors.success : colors.textSecondary}
                  />
                  <View style={styles.uploadTextWrap}>
                    <Text style={styles.uploadTitle}>Enviar selfie</Text>
                    <Text style={styles.uploadSubtitle}>Opcional — uma foto sua segurando o documento</Text>
                  </View>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, styles.termoTitle]}>Termos e privacidade</Text>
                <Text style={styles.description}>
                  Toque em cada documento para ler antes de criar sua conta.
                </Text>
                <ListaTermos ids={TERMOS_DO_MEMBRO} area="membro" />

                <TouchableOpacity
                  style={styles.termoCard}
                  onPress={() => setAceiteTermos((v) => !v)}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: aceiteTermos }}
                >
                  <Ionicons
                    name={aceiteTermos ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={aceiteTermos ? colors.success : colors.textSecondary}
                  />
                  <View style={styles.uploadTextWrap}>
                    <Text style={styles.uploadTitle}>Li e concordo</Text>
                    <Text style={styles.uploadSubtitle}>{declaracaoDeAceite(nome, cpf, TERMOS_DO_MEMBRO)}</Text>
                  </View>
                </TouchableOpacity>

                {erro && <Text style={styles.erroText}>{erro}</Text>}
              </>
            )}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          {etapa === 2 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setEtapa(1)}>
              <Text style={styles.secondaryButtonText}>Voltar</Text>
            </TouchableOpacity>
          )}
          <View style={styles.primaryButtonWrap}>
            {etapa === 1 ? (
              <GradientButton
                title="Continuar"
                disabled={!etapa1Valida}
                onPress={() => setEtapa(2)}
                gradientColors={gradients.loginMembro}
              />
            ) : (
              <GradientButton
                title="Concluir cadastro"
                icon="checkmark"
                disabled={!etapa2Valida}
                onPress={concluirCadastro}
                gradientColors={gradients.loginMembro}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 28,
  },
  cardContent: { padding: spacing.lg },
  footer: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md },
  primaryButtonWrap: { flex: 1 },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md },
  termoTitle: { marginTop: spacing.lg },
  termoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  description: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.md },
  enderecoAjuda: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.xs },
  erroText: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.md, textAlign: 'center' },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  uploadTextWrap: { flex: 1 },
  uploadTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  uploadSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  secondaryButton: {
    borderRadius: 28,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  analiseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  analiseTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  analiseSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
