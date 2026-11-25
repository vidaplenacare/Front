import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { FotoPessoa } from '../components/FotoPessoa';
import { useDialogo } from '../components/Dialogo';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { PagamentoConsultaBox } from '../components/PagamentoConsultaBox';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { useApp } from '../contexts/AppContext';
import { faixaHorario, horasEntre, valorDoAtendimento } from '../utils/atendimento';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';
import { voltarAoInicio } from '../utils/navegacao';

export function PagarConsultaScreen({ navigation, route }: RootStackScreenProps<'PagarConsulta'>) {
  const { solicitacoes, iniciarPagamento, recarregarSolicitacoes } = useApp();
  const dialogo = useDialogo();
  const solicitacao = solicitacoes.find((item) => item.id === route.params.solicitacaoId);
  const valor = solicitacao ? valorDoAtendimento(solicitacao) : 0;

  // Avisa quando a confirmação da Asaas chega enquanto o membro está nesta tela (a transição
  // pendente → pago acontece pelo webhook no servidor; a tela descobre ao recarregar).
  const statusAnterior = useRef(solicitacao?.statusPagamento);
  useEffect(() => {
    if (statusAnterior.current === 'pendente' && solicitacao?.statusPagamento === 'pago') {
      void dialogo
        .avisar({
          titulo: 'Pagamento confirmado!',
          mensagem:
            'Sua visita está confirmada. O valor fica guardado com segurança na plataforma e só é repassado ao cuidador depois do atendimento.',
          icone: 'shield-checkmark',
          tom: 'sucesso',
          botao: 'Voltar para o início',
        })
        // Fim do processo: volta ao início com o caminho limpo (usuário, 2026-09-30).
        .then(() => voltarAoInicio(navigation));
    }
    statusAnterior.current = solicitacao?.statusPagamento;
  }, [solicitacao?.statusPagamento, navigation, dialogo]);

  if (!solicitacao) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Pagar Consulta" onBack={() => navigation.goBack()} gradientColors={gradients.cuidadores} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Pagar Consulta" onBack={() => navigation.goBack()} gradientColors={gradients.cuidadores} />
      {/* Teclado não cobre os campos (Android edge-to-edge, hooks/useTeclado.ts). */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.resumoCard, shadows.card]}>
            <FotoPessoa foto={solicitacao.cuidadorFoto} nome={solicitacao.cuidadorNome} area="membro" tamanho={56} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{solicitacao.cuidadorNome}</Text>
              <Text style={styles.data}>
                {solicitacao.dataPreferida} · {faixaHorario(solicitacao.horarioInicio, solicitacao.horarioFim)}
              </Text>
            </View>
          </View>

          <View style={[styles.valorCard, shadows.card]}>
            <Text style={styles.valorLabel}>
              {horasEntre(solicitacao.horarioInicio, solicitacao.horarioFim)}h de atendimento
            </Text>
            <Text style={styles.valorValor}>R$ {valor.toFixed(2)}</Text>
          </View>

          {solicitacao.statusPagamento === 'pago' ? (
            <View style={[styles.pagoCard, shadows.card]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.pagoTitulo}>Consulta já paga</Text>
              <Text style={styles.pagoTexto}>
                Pago via {solicitacao.formaPagamento === 'pix' ? 'Pix' : 'cartão de crédito'}
                {solicitacao.pagoEm ? ` em ${new Date(solicitacao.pagoEm).toLocaleString('pt-BR')}` : ''}.
              </Text>
            </View>
          ) : (
            <View style={[styles.card, shadows.card]}>
              <Text style={styles.cardTitle}>Forma de pagamento</Text>
              <PagamentoConsultaBox
                iniciar={(forma, cpf) => iniciarPagamento(solicitacao.id, forma, cpf)}
                verificar={recarregarSolicitacoes}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { ...conteudoCentralizado, padding: spacing.lg, paddingBottom: spacing.xl },
  resumoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: { width: 56, height: 56, borderRadius: radius.md },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  data: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  valorCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  valorLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  valorValor: { fontSize: fontSize.display, fontWeight: fontWeight.bold, color: colors.primary, marginTop: 2 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md },
  pagoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pagoTitulo: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.xs },
  pagoTexto: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
});
