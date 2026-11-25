import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FotoPessoa } from '../components/FotoPessoa';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientButton } from '../components/GradientButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useProfissional } from '../hooks/useProfissional';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import { abrirWhatsApp, ligarPara } from '../utils/linking';
import type { RootStackScreenProps } from '../navigation/types';

const letrasDiaSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const ocupacaoInfo = {
  livre: { cor: colors.success, label: 'Disponível' },
  parcial: { cor: colors.yellow, label: 'Poucos horários' },
  lotado: { cor: colors.danger, label: 'Ocupado' },
} as const;

export function CuidadorPerfilScreen({ navigation, route }: RootStackScreenProps<'CuidadorPerfil'>) {
  // Dados do servidor (foto e valores atuais) — não da lista fixa antiga (ver useProfissional).
  const { profissional, carregando, erro, recarregar } = useProfissional(route.params.cuidadorId);

  if (!profissional) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={carregando ? 'Carregando…' : 'Perfil não encontrado'}
          onBack={() => navigation.goBack()}
          gradientColors={gradients.cuidadores}
        />
        <View style={styles.estado}>
          {carregando ? (
            <ActivityIndicator size="large" color={colors.blue} />
          ) : (
            <>
              <Text style={styles.estadoTexto}>{erro ?? 'Este profissional não está mais disponível.'}</Text>
              {!!erro && <GradientButton title="Tentar de novo" onPress={recarregar} />}
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={profissional.nome} onBack={() => navigation.goBack()} gradientColors={gradients.cuidadores} />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.heroCard, shadows.card]}>
            <View style={styles.avatarWrap}>
              <FotoPessoa foto={profissional.foto} nome={profissional.nome} area="membro" tamanho={96} />
              <View style={[styles.statusDot, { backgroundColor: ocupacaoInfo[profissional.nivelOcupacao].cor }]} />
            </View>
            <Text style={styles.name}>{profissional.nome}</Text>
            <Text style={styles.especialidade}>{profissional.especialidade}</Text>

            <View style={styles.statusRow}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={18} color={colors.yellow} />
                <Text style={styles.ratingText}>{profissional.avaliacao.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({profissional.totalAvaliacoes})</Text>
              </View>
              <View style={[styles.badgeOcupacao, { backgroundColor: ocupacaoInfo[profissional.nivelOcupacao].cor }]}>
                <Text style={styles.badgeOcupacaoText}>{ocupacaoInfo[profissional.nivelOcupacao].label}</Text>
              </View>
            </View>

            <View style={styles.precoBadge}>
              <Ionicons name="pricetag" size={16} color={colors.white} />
              <Text style={styles.precoBadgeText}>R$ {profissional.valorVisita.toFixed(2)} / hora</Text>
            </View>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Sobre</Text>
            <Text style={styles.bio}>{profissional.bio}</Text>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Formação</Text>
            <Text style={styles.bio}>{profissional.formacao}</Text>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Áreas de atuação</Text>
            <View style={styles.tagsRow}>
              {profissional.areasAtuacao.map((area) => (
                <View key={area} style={styles.tag}>
                  <Text style={styles.tagText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Disponibilidade</Text>
            <View style={styles.diasRow}>
              {letrasDiaSemana.map((letra, index) => {
                const ativo = profissional.diasDisponiveis.includes(index);
                return (
                  <View key={index} style={[styles.diaChip, ativo && styles.diaChipAtivo]}>
                    <Text style={[styles.diaLetra, ativo && styles.diaLetraAtiva]}>{letra}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.horarioRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.horarioText}>
                {profissional.horarioInicio} às {profissional.horarioFim}
              </Text>
            </View>
            <Text style={styles.disponibilidadeTexto}>{profissional.disponibilidade}</Text>
          </View>

          <View style={styles.contatoRow}>
            <TouchableOpacity style={styles.callButton} onPress={() => ligarPara(profissional.telefone)}>
              <Ionicons name="call" size={18} color={colors.white} />
              <Text style={styles.actionText}>Ligar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={() => abrirWhatsApp(profissional.telefone)}>
              <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
              <Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.denunciarButton}
            onPress={() =>
              navigation.navigate('Denuncia', {
                tipo: 'membro_para_cuidador',
                alvoId: profissional.id,
                alvoNome: profissional.nome,
              })
            }
          >
            <Ionicons name="flag" size={16} color={colors.danger} />
            <Text style={styles.denunciarText}>Denunciar profissional</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            title="Contratar"
            icon="calendar"
            onPress={() => navigation.navigate('SolicitarContratacao', { cuidadorId: profissional.id })}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  estado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  estadoTexto: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.lg },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatarWrap: { width: 96, height: 96, marginBottom: spacing.sm },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  statusDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: colors.white,
  },
  name: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
  especialidade: { fontSize: fontSize.md, color: colors.blue, fontWeight: fontWeight.medium, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  ratingCount: { fontSize: fontSize.sm, color: colors.textSecondary },
  badgeOcupacao: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.lg },
  badgeOcupacaoText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  precoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  precoBadgeText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  bio: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: colors.gray100, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.lg },
  tagText: { fontSize: fontSize.xs, color: colors.textSecondary },
  diasRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  diaChip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaChipAtivo: { backgroundColor: colors.primary },
  diaLetra: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.gray400 },
  diaLetraAtiva: { color: colors.white },
  horarioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  horarioText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  disponibilidadeTexto: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  contatoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.blue,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  denunciarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  denunciarText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
