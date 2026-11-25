import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FotoPessoa } from '../components/FotoPessoa';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { completarUltimaLinha, useResponsivo } from '../hooks/useResponsivo';
import type { CategoriaProfissional, Profissional } from '../data/profissionais';
import { buscarProfissionais } from '../services/api';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import { abrirWhatsApp, ligarPara } from '../utils/linking';
import type { RootStackScreenProps } from '../navigation/types';

const filtros: { id: 'todos' | CategoriaProfissional; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'cuidador', label: 'Cuidadores' },
  { id: 'enfermeiro', label: 'Enfermeiros' },
  { id: 'fisioterapeuta', label: 'Fisioterapeutas' },
  { id: 'acompanhante', label: 'Acompanhantes' },
];

const ocupacaoInfo: Record<Profissional['nivelOcupacao'], { cor: string; label: string }> = {
  livre: { cor: colors.success, label: 'Disponível' },
  parcial: { cor: colors.yellow, label: 'Poucos horários' },
  lotado: { cor: colors.danger, label: 'Ocupado' },
};

export function CuidadoresScreen({ navigation, route }: RootStackScreenProps<'Cuidadores'>) {
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | CategoriaProfissional>(
    route.params?.categoriaInicial ?? 'todos'
  );
  const { porTamanho } = useResponsivo();
  const colunas = porTamanho(1, 2, 3);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(false);
    buscarProfissionais()
      .then((dados) => {
        if (!cancelado) setProfissionais(dados);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  const listaFiltrada =
    filtroAtivo === 'todos' ? profissionais : profissionais.filter((p) => p.categoria === filtroAtivo);

  const renderItem = ({ item }: { item: Profissional | null }) => {
    // Vaga vazia da última linha — sem isso os cards restantes esticariam.
    if (!item) return <View style={styles.cardVazio} />;

    return (
    <TouchableOpacity
      style={[styles.card, colunas > 1 && styles.cardEmColunas, shadows.card]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('CuidadorPerfil', { cuidadorId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrap}>
          <FotoPessoa foto={item.foto} nome={item.nome} area="membro" tamanho={72} />
          <View style={[styles.statusDot, { backgroundColor: ocupacaoInfo[item.nivelOcupacao].cor }]} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.nome}
            </Text>
            <View style={[styles.badgeOcupacao, { backgroundColor: ocupacaoInfo[item.nivelOcupacao].cor }]}>
              <Text style={styles.badgeOcupacaoText}>{ocupacaoInfo[item.nivelOcupacao].label}</Text>
            </View>
          </View>
          <Text style={styles.especialidade}>{item.especialidade}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={colors.yellow} />
            <Text style={styles.ratingText}>{item.avaliacao.toFixed(1)}</Text>
            <Text style={styles.experienciaText}>· {item.experiencia}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.callButton} onPress={() => ligarPara(item.telefone)}>
          <Ionicons name="call" size={18} color={colors.white} />
          <Text style={styles.actionText}>Ligar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton} onPress={() => abrirWhatsApp(item.telefone)}>
          <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
          <Text style={styles.actionText}>Mensagem</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Cuidadores Credenciados"
        subtitle="Profissionais qualificados e confiáveis"
        onBack={() => navigation.goBack()}
        gradientColors={gradients.cuidadores}
      />

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Ionicons name="cloud-offline" size={40} color={colors.textLight} />
          <Text style={styles.erroTexto}>
            Não foi possível conectar ao back-end local. Verifique se ele está rodando.
          </Text>
          <TouchableOpacity style={styles.tentarNovamenteButton} onPress={() => setTentativa((t) => t + 1)}>
            <Text style={styles.tentarNovamenteText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={completarUltimaLinha(listaFiltrada, colunas)}
          keyExtractor={(item, index) => item?.id ?? `vaga-${index}`}
          renderItem={renderItem}
          // `numColumns` não muda em tempo real numa lista já montada — a `key` remonta quando a
          // largura muda de faixa (rotação/tablet). `columnWrapperStyle` só vale com 2+ colunas.
          key={colunas}
          numColumns={colunas}
          columnWrapperStyle={colunas > 1 ? styles.linhaColunas : undefined}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <FlatList
              data={filtros}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtrosContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.chip, filtroAtivo === item.id && styles.chipActive]}
                  onPress={() => setFiltroAtivo(item.id)}
                >
                  <Text style={[styles.chipText, filtroAtivo === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  erroTexto: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  tentarNovamenteButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  tentarNovamenteText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  listContent: { paddingBottom: spacing.xl },
  filtrosContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipTextActive: { color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  // Em 2+ colunas a margem lateral sai do card e vira padding da linha (`linhaColunas`), senão
  // cada card ficaria com margem dobrada no meio da grade.
  cardEmColunas: { flex: 1, marginHorizontal: 0 },
  linhaColunas: { gap: spacing.md, paddingHorizontal: spacing.lg },
  // Ocupa a vaga sem nada visível, para os cards reais da última linha não esticarem.
  cardVazio: { flex: 1 },
  cardHeader: { flexDirection: 'row', gap: spacing.md },
  avatarWrap: { width: 72, height: 72 },
  avatar: { width: 72, height: 72, borderRadius: radius.md },
  statusDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.white,
  },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  name: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  especialidade: { fontSize: fontSize.sm, color: colors.blue, fontWeight: fontWeight.medium, marginTop: 2 },
  badgeOcupacao: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.lg },
  badgeOcupacaoText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  ratingText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  experienciaText: { fontSize: fontSize.sm, color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
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
});
