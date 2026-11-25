import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CabecalhoHero, Cartao, IconeCirculo, estilosUi } from '../components/ui';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { colors, fontSize, fontWeight, type Tom } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';
import { voltarAoInicio } from '../utils/navegacao';

const AREA = 'cuidador' as const;

interface NotificacaoItem {
  id: string;
  icone: keyof typeof Ionicons.glyphMap;
  tom: Tom;
  titulo: string;
  mensagem: string;
  data: string;
  /** Ausente = notificação sem destino próprio — card fica só informativo, sem toque. */
  aoTocar?: () => void;
}

// ⚠️ Lista ainda fixa (exemplo): as notificações reais, geradas pelo servidor, são uma pendência
// decidida (ver Cérebro "Notificações reais").
export function CuidadorNotificacoesScreen({ navigation }: RootStackScreenProps<'CuidadorNotificacoes'>) {
  const notificacoes: NotificacaoItem[] = [
    {
      id: 'not-1',
      icone: 'person-add-outline',
      tom: 'verde',
      titulo: 'Novo pedido recebido',
      mensagem: 'Carla Souza enviou uma solicitação de cuidado para você.',
      data: 'Hoje, 10:20',
      aoTocar: () => navigation.navigate('PedidosRecebidos'),
    },
    {
      id: 'not-2',
      icone: 'document-text-outline',
      tom: 'laranja',
      titulo: 'Documento pendente',
      mensagem: 'Envie o comprovante de endereço para concluir sua verificação profissional.',
      data: 'Ontem, 14:00',
      aoTocar: () => navigation.navigate('CuidadorVerificacao'),
    },
    {
      id: 'not-3',
      icone: 'alarm-outline',
      tom: 'azul',
      titulo: 'Lembrete de visita',
      mensagem: 'Você tem uma visita agendada para amanhã, às 10h. Prepare-se com antecedência.',
      data: '2 dias atrás',
      aoTocar: () => voltarAoInicio(navigation, 'CuidadorPainel'),
    },
  ];

  return (
    <View style={estilosUi.tela}>
      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <CabecalhoHero area={AREA} titulo="Notificações" onVoltar={() => navigation.goBack()} voltarRotulo="Painel" />
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.lateral, conteudoCentralizado]}>
            <Cartao onPress={item.aoTocar} rotulo={`${item.titulo}. ${item.mensagem}`} style={styles.item}>
              <IconeCirculo icone={item.icone} tom={item.tom} tamanho={48} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.titulo}>{item.titulo}</Text>
                <Text style={estilosUi.textoCorpo}>{item.mensagem}</Text>
                <Text style={styles.data}>{item.data}</Text>
              </View>
              {item.aoTocar && <Ionicons name="chevron-forward" size={22} color={colors.gray400} />}
            </Cartao>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lateral: { paddingHorizontal: 20 },
  item: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.text },
  data: { fontSize: fontSize.sm, color: colors.gray500, marginTop: 2 },
});
