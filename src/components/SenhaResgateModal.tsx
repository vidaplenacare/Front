import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';

const TAMANHO_SENHA = 6;

export type ModoSenhaResgate = 'criar' | 'resgatar';

interface Props {
  visivel: boolean;
  modo: ModoSenhaResgate;
  valor: number;
  chavePix: string;
  onFechar: () => void;
  /** Cria a senha. Rejeitar com Error mostra a mensagem dentro da janela. */
  onCriar: (senha: string) => Promise<void>;
  /** Faz o resgate. Rejeitar com Error mostra a mensagem dentro da janela. */
  onResgatar: (senha: string) => Promise<void>;
  onEsqueciSenha: () => void;
}

// Janela da senha de resgate (6 números): cria a senha na primeira vez e pede em todo resgate.
// Quadradinhos grandes + teclado numérico + opção de mostrar os números (acessibilidade).
export function SenhaResgateModal({
  visivel,
  modo,
  valor,
  chavePix,
  onFechar,
  onCriar,
  onResgatar,
  onEsqueciSenha,
}: Props) {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [etapaConfirmar, setEtapaConfirmar] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!visivel) return;
    setSenha('');
    setConfirmacao('');
    setEtapaConfirmar(false);
    setErro(null);
  }, [visivel, modo]);

  const valorAtual = etapaConfirmar ? confirmacao : senha;
  const completo = valorAtual.length === TAMANHO_SENHA;

  const alterar = (texto: string) => {
    const numeros = texto.replace(/\D/g, '').slice(0, TAMANHO_SENHA);
    setErro(null);
    if (etapaConfirmar) setConfirmacao(numeros);
    else setSenha(numeros);
  };

  const continuar = async () => {
    if (!completo || enviando) return;
    if (modo === 'criar' && !etapaConfirmar) {
      setEtapaConfirmar(true);
      return;
    }
    if (modo === 'criar' && confirmacao !== senha) {
      setErro('As senhas não são iguais. Digite de novo.');
      setSenha('');
      setConfirmacao('');
      setEtapaConfirmar(false);
      return;
    }
    setEnviando(true);
    try {
      if (modo === 'criar') await onCriar(senha);
      else await onResgatar(senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível continuar. Tente novamente.');
      setSenha('');
      setConfirmacao('');
      setEtapaConfirmar(false);
    } finally {
      setEnviando(false);
    }
  };

  const titulo =
    modo === 'criar'
      ? etapaConfirmar
        ? 'Repita a senha'
        : 'Crie sua senha de resgate'
      : 'Digite sua senha de resgate';
  const descricao =
    modo === 'criar'
      ? etapaConfirmar
        ? 'Digite os mesmos 6 números para confirmar.'
        : 'Ela protege o seu dinheiro: será pedida em todo resgate. Use 6 números que só você sabe — nada de 123456 ou 111111.'
      : `Para transferir R$ ${valor.toFixed(2)} para a chave Pix ${chavePix}.`;
  const textoBotao =
    modo === 'criar' ? (etapaConfirmar ? 'Salvar senha' : 'Continuar') : `Resgatar R$ ${valor.toFixed(2)}`;

  return (
    <Modal visible={visivel} transparent animationType="slide" statusBarTranslucent onRequestClose={onFechar}>
      <KeyboardAvoidingView behavior={COMPORTAMENTO_TECLADO} style={styles.overlay}>
        <View style={[styles.folha, shadows.modal]} accessibilityViewIsModal>
          <View style={styles.topo}>
            <View style={styles.iconeWrap}>
              <Ionicons name={modo === 'criar' ? 'key-outline' : 'lock-closed-outline'} size={30} color={colors.primary} />
            </View>
            <TouchableOpacity onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar" style={styles.fechar}>
              <Ionicons name="close" size={26} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.descricao}>{descricao}</Text>

          <Pressable style={styles.caixas} accessibilityLabel={`${valorAtual.length} de ${TAMANHO_SENHA} números digitados`}>
            {Array.from({ length: TAMANHO_SENHA }).map((_, i) => {
              const digito = valorAtual[i];
              const ativa = i === valorAtual.length;
              return (
                <View key={i} style={[styles.caixa, ativa && styles.caixaAtiva, digito !== undefined && styles.caixaPreenchida]}>
                  {digito !== undefined &&
                    (mostrar ? <Text style={styles.digito}>{digito}</Text> : <View style={styles.ponto} />)}
                </View>
              );
            })}
            <TextInput
              value={valorAtual}
              onChangeText={alterar}
              keyboardType="number-pad"
              maxLength={TAMANHO_SENHA}
              autoFocus
              caretHidden
              secureTextEntry={!mostrar}
              textContentType="oneTimeCode"
              accessibilityLabel={titulo}
              style={styles.inputInvisivel}
              onSubmitEditing={continuar}
            />
          </Pressable>

          <TouchableOpacity onPress={() => setMostrar((m) => !m)} accessibilityRole="button" style={styles.mostrar}>
            <Ionicons name={mostrar ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.primary} />
            <Text style={styles.mostrarTexto}>{mostrar ? 'Esconder os números' : 'Mostrar os números'}</Text>
          </TouchableOpacity>

          {erro && (
            <View style={styles.erroBox} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.85} disabled={!completo || enviando} onPress={continuar} accessibilityRole="button">
            <LinearGradient
              colors={gradients.loginColaborador}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.botao, (!completo || enviando) && styles.botaoDesabilitado]}
            >
              {enviando ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.botaoTexto}>{textoBotao}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {modo === 'resgatar' && (
            <TouchableOpacity onPress={onEsqueciSenha} accessibilityRole="button" style={styles.esqueci}>
              <Text style={styles.esqueciTexto}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end' },
  folha: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconeWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fechar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.md },
  descricao: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 23, marginTop: spacing.xs },
  caixas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, gap: spacing.sm },
  caixa: {
    flex: 1,
    height: 60,
    maxWidth: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaAtiva: { borderColor: colors.primary, backgroundColor: colors.white },
  caixaPreenchida: { borderColor: colors.primaryLight, backgroundColor: colors.white },
  digito: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  ponto: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.text },
  // O TextInput de verdade fica por cima das caixas, invisível: tocar em qualquer caixa abre o
  // teclado numérico, e leitores de tela enxergam um campo normal.
  inputInvisivel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.01, color: 'transparent' },
  mostrar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'center', minHeight: 44, marginTop: spacing.sm },
  mostrarTexto: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.primary },
  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fef2f2',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  erroTexto: { flex: 1, fontSize: fontSize.md, color: '#991b1b', lineHeight: 22 },
  botao: {
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  botaoDesabilitado: { opacity: 0.45 },
  botaoTexto: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  esqueci: { alignSelf: 'center', minHeight: 48, justifyContent: 'center', marginTop: spacing.xs },
  esqueciTexto: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary, textDecorationLine: 'underline' },
});
