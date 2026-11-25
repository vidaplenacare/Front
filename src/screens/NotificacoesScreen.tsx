import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, fontSize, fontWeight, gradients, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

interface NotificacaoItem {
  id: string;
  icone: keyof typeof Ionicons.glyphMap;
  cor: string;
  titulo: string;
  mensagem: string;
  data: string;
  /** Ausente = notificação sem destino próprio (ex.: comunicado geral) — card fica só informativo,
   * sem toque. Presente = navega pra tela de onde a notificação "veio", pro usuário conseguir ver
   * o contexto completo em vez de só ler o resumo aqui. */
  aoTocar?: () => void;
}

export function NotificacoesScreen({ navigation }: RootStackScreenProps<'Notificacoes'>) {
  const notificacoes: NotificacaoItem[] = [
    {
      id: 'not-1',
      icone: 'checkmark-circle',
      cor: colors.success,
      titulo: 'Solicitação aceita',
      mensagem:
        'Ana Paula Santos aceitou seu pedido de cuidado e em breve entrará em contato com os detalhes da visita.',
      data: 'Hoje, 09:14',
      aoTocar: () => navigation.navigate('Perfil', { secao: 'cuidadoresSolicitados' }),
    },
    {
      id: 'not-2',
      icone: 'alarm',
      cor: colors.primary,
      titulo: 'Lembrete de medicamento',
      mensagem: 'Está na hora de tomar Losartana 50mg.',
      data: 'Hoje, 08:00',
      aoTocar: () => navigation.navigate('Perfil', { secao: 'medicamentos' }),
    },
    {
      id: 'not-4',
      icone: 'megaphone',
      cor: colors.blue,
      titulo: 'Comunicado Vida Plena',
      mensagem:
        'Em breve chega uma nova funcionalidade de monitoramento residencial para você acompanhar de perto quem você ama.',
      data: '2 dias atrás',
      // Sem `aoTocar` de propósito: é um aviso geral da plataforma, sem uma tela própria de
      // detalhe pra levar o usuário.
    },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notificações" onBack={() => navigation.goBack()} gradientColors={gradients.homeHeader} />
      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const Wrapper = item.aoTocar ? TouchableOpacity : View;
          return (
            <Wrapper
              style={[styles.card, shadows.card, { borderLeftColor: item.cor }]}
              onPress={item.aoTocar}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${item.cor}20` }]}>
                <Ionicons name={item.icone} size={24} color={item.cor} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.titulo}>{item.titulo}</Text>
                <Text style={styles.mensagem}>{item.mensagem}</Text>
                <Text style={styles.data}>{item.data}</Text>
              </View>
              {item.aoTocar && <Ionicons name="chevron-forward" size={20} color={colors.textLight} />}
            </Wrapper>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    borderLeftWidth: 4,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  titulo: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  mensagem: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 21 },
  data: { fontSize: fontSize.sm, color: colors.textLight, marginTop: spacing.sm },
});
