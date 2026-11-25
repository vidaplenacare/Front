import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FotoPessoa } from '../components/FotoPessoa';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { useApp } from '../contexts/AppContext';
import { useRecarregarAoFocar } from '../hooks/useRecarregarAoFocar';
import { faixaHorario, valorDoAtendimento } from '../utils/atendimento';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function PagamentosScreen({ navigation }: RootStackScreenProps<'Pagamentos'>) {
  const { solicitacoes, recarregarSolicitacoes } = useApp();
  useRecarregarAoFocar(recarregarSolicitacoes);

  const pendentes = solicitacoes.filter((s) => s.statusPagamento === 'pendente');
  const pagos = solicitacoes.filter((s) => s.statusPagamento === 'pago');
  const totalPendente = pendentes.reduce((soma, s) => soma + valorDoAtendimento(s), 0);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Pagamentos"
        subtitle="Confirme suas visitas agendadas"
        onBack={() => navigation.goBack()}
        gradientColors={gradients.cuidadores}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.resumoCard, shadows.card]}>
            <Text style={styles.resumoLabel}>Total pendente</Text>
            <Text style={styles.resumoValor}>R$ {totalPendente.toFixed(2)}</Text>
            <Text style={styles.resumoAviso}>
              A visita só é confirmada depois que o pagamento é feito. O valor fica retido na
              plataforma e só é repassado ao cuidador quando o atendimento é concluído.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Aguardando pagamento</Text>
          {pendentes.length === 0 ? (
            <View style={[styles.vazioCard, shadows.card]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={styles.vazioTexto}>Nenhum pagamento pendente.</Text>
            </View>
          ) : (
            pendentes.map((solicitacao) => (
              <View key={solicitacao.id} style={[styles.card, shadows.card]}>
                <View style={styles.cardTopo}>
                  <FotoPessoa foto={solicitacao.cuidadorFoto} nome={solicitacao.cuidadorNome} area="membro" tamanho={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{solicitacao.cuidadorNome}</Text>
                    <Text style={styles.data}>
                      {solicitacao.dataPreferida} · {faixaHorario(solicitacao.horarioInicio, solicitacao.horarioFim)}
                    </Text>
                  </View>
                  <Text style={styles.valor}>R$ {valorDoAtendimento(solicitacao).toFixed(2)}</Text>
                </View>
                <View style={styles.avisoLinha}>
                  <Ionicons name="time" size={14} color={colors.orange} />
                  <Text style={styles.avisoTexto}>Aceita pelo cuidador — aguardando seu pagamento</Text>
                </View>
                <TouchableOpacity
                  style={styles.pagarButton}
                  onPress={() => navigation.navigate('PagarConsulta', { solicitacaoId: solicitacao.id })}
                >
                  <Ionicons name="card" size={16} color={colors.white} />
                  <Text style={styles.pagarButtonText}>Pagar agora</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {pagos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Pagos</Text>
              {pagos.map((solicitacao) => (
                <View key={solicitacao.id} style={[styles.card, shadows.card]}>
                  <View style={styles.cardTopo}>
                    <FotoPessoa foto={solicitacao.cuidadorFoto} nome={solicitacao.cuidadorNome} area="membro" tamanho={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nome}>{solicitacao.cuidadorNome}</Text>
                      <Text style={styles.data}>
                        {solicitacao.dataPreferida} · {faixaHorario(solicitacao.horarioInicio, solicitacao.horarioFim)}
                      </Text>
                    </View>
                    <Text style={styles.valor}>R$ {valorDoAtendimento(solicitacao).toFixed(2)}</Text>
                  </View>
                  <View style={styles.avisoLinha}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={[styles.avisoTexto, { color: colors.success }]}>
                      Pago via {solicitacao.formaPagamento === 'pix' ? 'Pix' : 'cartão'}
                      {solicitacao.status === 'concluida'
                        ? ' · repassado ao cuidador'
                        : ' · retido até a conclusão'}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { ...conteudoCentralizado, padding: spacing.lg, paddingBottom: spacing.xl },
  resumoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  resumoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  resumoValor: { fontSize: fontSize.display, fontWeight: fontWeight.bold, color: colors.orange, marginTop: 2 },
  resumoAviso: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: radius.sm },
  nome: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  data: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  valor: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  avisoLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  avisoTexto: { fontSize: fontSize.xs, color: colors.orange, flex: 1 },
  pagarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
  },
  pagarButtonText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  vazioCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  vazioTexto: { fontSize: fontSize.sm, color: colors.textSecondary },
});
