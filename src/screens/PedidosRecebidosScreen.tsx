import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FotoPessoa } from '../components/FotoPessoa';
import { Aviso, Botao, CabecalhoHero, Cartao, Etiqueta, Vazio, estilosUi } from '../components/ui';
import {
  statusPedidoLabels,
  statusPedidoTons,
  useCuidador,
  type PedidoRecebido,
  type StatusPedido,
} from '../contexts/CuidadorContext';
import { useRecarregarAoFocar } from '../hooks/useRecarregarAoFocar';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { colors, fontSize, fontWeight, paletas, tons } from '../theme';
import { diaCurto, duracaoTexto, reais } from '../utils/formatos';
import type { RootStackScreenProps } from '../navigation/types';

const AREA = 'cuidador' as const;

type FiltroStatus = 'pendente' | 'aceito' | 'em_andamento' | 'concluido' | 'todos';

const filtros: { id: FiltroStatus; label: string }[] = [
  { id: 'pendente', label: 'Novos' },
  { id: 'aceito', label: 'Aceitos' },
  { id: 'em_andamento', label: 'Em andamento' },
  { id: 'concluido', label: 'Concluídos' },
  { id: 'todos', label: 'Todos' },
];

const VAZIO_POR_FILTRO: Record<FiltroStatus, string> = {
  pendente: 'Nenhum pedido novo esperando resposta.',
  aceito: 'Nenhum atendimento aceito para os próximos dias.',
  em_andamento: 'Nenhum atendimento acontecendo agora.',
  concluido: 'Os atendimentos que você concluir aparecem aqui.',
  todos: 'Quando uma família contratar você, o pedido aparece aqui.',
};

// Na lista, "pendente" aparece como "Novo" (é o que o cuidador precisa responder).
function rotuloStatus(status: StatusPedido): string {
  return status === 'pendente' ? 'Novo' : statusPedidoLabels[status];
}

export function PedidosRecebidosScreen({ navigation }: RootStackScreenProps<'PedidosRecebidos'>) {
  const { pedidos, erroPedidos, carregandoPedidos, recarregarPedidos } = useCuidador();
  useRecarregarAoFocar(recarregarPedidos);
  const p = paletas[AREA];

  const contar = (id: FiltroStatus) => (id === 'todos' ? pedidos.length : pedidos.filter((x) => x.status === id).length);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroStatus>(() => (contar('pendente') > 0 ? 'pendente' : 'todos'));

  // ⚠️ O filtro por raio de atendimento saiu ao ligar na API: dependia de `distanciaKm`, que o
  // back-end não tem como calcular ainda (precisa da posição do membro geocodificada — ver
  // INTEGRACOES-EXTERNAS.md #2). Enquanto isso, a lista mostra todos os pedidos recebidos.
  const listaFiltrada = filtroAtivo === 'todos' ? pedidos : pedidos.filter((item) => item.status === filtroAtivo);

  const renderItem = ({ item }: { item: PedidoRecebido }) => {
    const abrir = () => navigation.navigate('PedidoDetalhe', { pedidoId: item.id });
    return (
      <View style={[styles.lateral, conteudoCentralizado]}>
        <Cartao style={styles.item}>
          <View style={styles.itemTopo}>
            <FotoPessoa foto={item.membroFoto} nome={item.membroNome} area="membro" tamanho={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.nome} numberOfLines={1}>
                {item.membroNome}
              </Text>
              <Text style={estilosUi.textoApoio}>{item.pagamentoConfirmado ? 'Pago pelo membro' : 'Aguardando pagamento'}</Text>
            </View>
            <Etiqueta texto={rotuloStatus(item.status)} tom={statusPedidoTons[item.status]} />
          </View>
          <View style={estilosUi.caixaCinza}>
            <View style={styles.infoLinha}>
              <Ionicons name="calendar-outline" size={18} color={p.principal} />
              <Text style={styles.infoTexto}>
                {diaCurto(item.data)} · {item.horarioInicio} às {item.horarioFim}
              </Text>
            </View>
            <View style={styles.infoLinha}>
              <Ionicons name="wallet-outline" size={18} color={p.principal} />
              <Text style={styles.infoTexto}>
                {duracaoTexto(item.horarioInicio, item.horarioFim)} ·{' '}
                <Text style={[styles.valor, { color: p.texto }]}>{reais(item.valorTotal)}</Text>
              </Text>
            </View>
          </View>
          {item.status === 'pendente' ? (
            <Botao area={AREA} titulo="Ver pedido e responder" icone="arrow-forward" onPress={abrir} />
          ) : (
            <Botao area={AREA} variante="contorno" titulo="Ver detalhes" onPress={abrir} />
          )}
        </Cartao>
      </View>
    );
  };

  return (
    <View style={estilosUi.tela}>
      <FlatList
        data={listaFiltrada}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshing={carregandoPedidos}
        onRefresh={recarregarPedidos}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListHeaderComponent={
          <>
            <CabecalhoHero
              area={AREA}
              titulo="Pedidos recebidos"
              subtitulo="Responda os novos pedidos o quanto antes"
              onVoltar={() => navigation.goBack()}
              voltarRotulo="Painel"
            />
            <View style={[styles.filtros, conteudoCentralizado]} accessibilityRole="tablist">
              {filtros.map((f) => {
                const ativo = filtroAtivo === f.id;
                const qtd = contar(f.id);
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setFiltroAtivo(f.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: ativo }}
                    accessibilityLabel={`${f.label}, ${qtd}`}
                    style={[styles.chip, ativo && { backgroundColor: p.principal, borderColor: p.principal }]}
                  >
                    <Text style={[styles.chipTexto, ativo && { color: colors.white }]}>{f.label}</Text>
                    {f.id === 'pendente' && qtd > 0 ? (
                      <View style={styles.chipBadge}>
                        <Text style={styles.chipBadgeTexto}>{qtd}</Text>
                      </View>
                    ) : f.id !== 'todos' && qtd > 0 ? (
                      <Text style={[styles.chipTexto, ativo && { color: colors.white }]}>· {qtd}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
            {erroPedidos && (
              <View style={[styles.lateral, conteudoCentralizado, { marginBottom: 14 }]}>
                <Aviso tom="laranja" icone="warning-outline" texto={erroPedidos} />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={[styles.lateral, conteudoCentralizado]}>
            <Cartao>
              <Vazio area={AREA} icone="file-tray-outline" titulo="Nada por aqui" texto={VAZIO_POR_FILTRO[filtroAtivo]} />
            </Cartao>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lateral: { paddingHorizontal: 20 },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipTexto: { fontSize: 15, fontWeight: fontWeight.bold, color: colors.gray700 },
  chipBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: tons.laranja.forte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadgeTexto: { color: colors.white, fontSize: 12, fontWeight: fontWeight.extrabold },
  item: { gap: 14 },
  itemTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nome: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.text },
  infoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoTexto: { flex: 1, fontSize: fontSize.md, color: colors.gray700 },
  valor: { fontWeight: fontWeight.extrabold },
});
