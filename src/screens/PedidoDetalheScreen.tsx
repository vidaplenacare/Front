import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotaoDeslizante } from '../components/BotaoDeslizante';
import { CapturaSelfie } from '../components/CapturaSelfie';
import { useDialogo } from '../components/Dialogo';
import { FichaSaude } from '../components/FichaSaude';
import { FotoPessoa } from '../components/FotoPessoa';
import {
  Aviso,
  Botao,
  CabecalhoHero,
  Cartao,
  Etiqueta,
  LinhaInfo,
  estilosUi,
} from '../components/ui';
import { statusPedidoLabels, useCuidador, type FichaDoMembro, type PedidoRecebido } from '../contexts/CuidadorContext';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { colors, fontSize, fontWeight, paletas, shadows } from '../theme';
import { diaLongo, duracaoTexto, reais } from '../utils/formatos';
import type { RootStackScreenProps } from '../navigation/types';

const AREA = 'cuidador' as const;

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// `data` (YYYY-MM-DD) + `horario` (HH:mm) do pedido, combinados sem sufixo de fuso — o JS
// interpreta isso como horário local, que é como `dataHoraRelativa` (CuidadorContext.tsx) gera
// os dados mock, então os dois lados batem.
function dataHoraAgendada(pedido: PedidoRecebido): Date {
  return new Date(`${pedido.data}T${pedido.horarioInicio}:00`);
}

function formatarDataHoraAgendada(pedido: PedidoRecebido): string {
  return dataHoraAgendada(pedido).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function textoValor(pedido: PedidoRecebido): string {
  if (!pedido.pagamentoConfirmado) return 'aguardando o pagamento do membro';
  if (pedido.status === 'concluido') return 'liberado para o seu saldo';
  return 'já pago, fica guardado até o fim do atendimento';
}

export function PedidoDetalheScreen({ navigation, route }: RootStackScreenProps<'PedidoDetalhe'>) {
  const { pedidos, aceitarPedido, recusarPedido, cancelarPedido, iniciarAtendimento, concluirAtendimento, carregarFicha } =
    useCuidador();
  const dialogo = useDialogo();
  const p = paletas[AREA];
  const pedido = pedidos.find((item) => item.id === route.params.pedidoId);
  const [agindo, setAgindo] = useState(false);
  const [selfieVisivel, setSelfieVisivel] = useState(false);

  // A ficha do membro vem sob demanda, não na lista: o back-end libera endereço, telefone e
  // medicamentos só depois que este cuidador aceita o pedido. Recarrega quando o status muda
  // (aceitar destrava os campos que estavam ocultos).
  const [ficha, setFicha] = useState<FichaDoMembro | null>(null);
  const [erroFicha, setErroFicha] = useState<string | null>(null);
  const pedidoId = pedido?.id;
  const statusDoPedido = pedido?.status;
  useEffect(() => {
    if (!pedidoId) return;
    let ativo = true;
    carregarFicha(pedidoId)
      .then((dados) => {
        if (ativo) {
          setFicha(dados);
          setErroFicha(null);
        }
      })
      .catch((erro) => {
        if (ativo) setErroFicha(erro instanceof Error ? erro.message : 'Não foi possível carregar a ficha');
      });
    return () => {
      ativo = false;
    };
  }, [pedidoId, statusDoPedido, carregarFicha]);

  // Reavalia a cada 15s se o horário agendado já chegou — sem isso, quem deixasse a tela aberta
  // esperando o horário destravar só veria a mudança depois de sair e voltar.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 15000);
    return () => clearInterval(intervalo);
  }, []);

  if (!pedido) {
    return (
      <View style={estilosUi.tela}>
        <CabecalhoHero area={AREA} titulo="Pedido não encontrado" onVoltar={() => navigation.goBack()} voltarRotulo="Pedidos" />
      </View>
    );
  }

  // O servidor é quem valida cada ação (horário, pagamento, conflito de agenda): se recusar, a
  // mensagem dele aparece para o cuidador em vez de o botão "não fazer nada".
  const agir = async (acao: () => Promise<void>, sucesso?: { titulo: string; mensagem: string }) => {
    setAgindo(true);
    try {
      await acao();
      if (sucesso) await dialogo.avisar({ ...sucesso, tom: 'sucesso' });
      return true;
    } catch (e) {
      await dialogo.avisar({
        titulo: 'Não foi possível concluir',
        mensagem: e instanceof Error ? e.message : 'Tente novamente em instantes.',
        tom: 'perigo',
      });
      return false;
    } finally {
      setAgindo(false);
    }
  };

  const recusar = async () => {
    const confirmado = await dialogo.confirmar({
      titulo: 'Recusar pedido',
      mensagem: `${pedido.membroNome} será avisado de que você não poderá atender.`,
      icone: 'close-circle-outline',
      tom: 'perigo',
      confirmar: 'Recusar pedido',
      cancelar: 'Voltar',
    });
    if (confirmado && (await agir(() => recusarPedido(pedido.id)))) navigation.goBack();
  };

  const cancelar = async () => {
    const confirmado = await dialogo.confirmar({
      titulo: 'Cancelar atendimento',
      mensagem: `O atendimento de ${pedido.membroNome} será cancelado e o horário liberado na sua agenda.`,
      icone: 'calendar-clear-outline',
      tom: 'perigo',
      confirmar: 'Cancelar atendimento',
      cancelar: 'Voltar',
    });
    if (confirmado && (await agir(() => cancelarPedido(pedido.id)))) navigation.goBack();
  };

  const contato = ficha?.contatosEmergencia.find((c) => c.principal) ?? ficha?.contatosEmergencia[0];
  const horarioLiberado = agora >= dataHoraAgendada(pedido).getTime();
  const temRodape = pedido.status === 'pendente' || pedido.status === 'aceito' || pedido.status === 'em_andamento';

  return (
    <View style={estilosUi.tela}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <CabecalhoHero area={AREA} onVoltar={() => navigation.goBack()} voltarRotulo="Pedidos">
          <View style={styles.heroPessoa}>
            <FotoPessoa foto={ficha?.fotoUrl} nome={pedido.membroNome} area={AREA} tamanho={60} claro />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.heroNome} accessibilityRole="header">
                {pedido.membroNome}
              </Text>
              <View style={styles.heroEtiqueta}>
                <Text style={styles.heroEtiquetaTexto}>
                  {statusPedidoLabels[pedido.status]}
                  {pedido.pagamentoConfirmado ? ' · pago pelo membro' : ''}
                  {ficha?.idade != null ? ` · ${ficha.idade} anos` : ''}
                </Text>
              </View>
            </View>
          </View>
        </CabecalhoHero>

        <View style={[estilosUi.miolo, conteudoCentralizado, { paddingTop: 20 }]}>
          <Cartao>
            <Text style={styles.tituloCartao}>Visita</Text>
            <LinhaInfo
              icone="calendar-outline"
              area={AREA}
              titulo={diaLongo(pedido.data)}
              subtitulo={`${pedido.horarioInicio} às ${pedido.horarioFim} · ${duracaoTexto(pedido.horarioInicio, pedido.horarioFim)}`}
            />
            <LinhaInfo
              icone="location-outline"
              area={AREA}
              subtitulo={ficha?.endereco ?? 'O endereço aparece depois que você aceitar o pedido.'}
            />
            <LinhaInfo icone="wallet-outline" area={AREA}>
              <Text style={styles.textoLinha}>
                <Text style={[styles.valor, { color: p.texto }]}>{reais(pedido.valorTotal)}</Text> · {textoValor(pedido)}
              </Text>
            </LinhaInfo>
            {!!pedido.observacoes && (
              <View style={estilosUi.caixaCinza}>
                <Text style={estilosUi.rotuloCampo}>Observações da família</Text>
                <Text style={estilosUi.textoCorpo}>{pedido.observacoes}</Text>
              </View>
            )}
            {pedido.status === 'em_andamento' && pedido.checkInEm && (
              <Etiqueta texto={`Atendimento iniciado às ${formatarHora(pedido.checkInEm)}`} tom="azul" icone="play" />
            )}
            {pedido.status === 'concluido' && pedido.checkOutEm && (
              <Etiqueta texto={`Concluído às ${formatarHora(pedido.checkOutEm)}`} tom="verde" icone="checkmark" />
            )}
          </Cartao>

          {erroFicha && <Aviso tom="vermelho" icone="alert-circle-outline" texto={erroFicha} />}

          <FichaSaude
            area={AREA}
            condicoes={ficha?.condicoesMedicas ?? []}
            alergias={ficha?.alergias ?? []}
            medicamentos={ficha?.medicamentos ?? []}
            semMedicamentos={
              pedido.status === 'pendente'
                ? 'A lista de medicamentos aparece depois que você aceitar o pedido.'
                : 'Nenhum medicamento informado.'
            }
          />

          {contato && (
            <Cartao style={styles.contato}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={estilosUi.rotuloCampo}>Contato de emergência</Text>
                <Text style={styles.contatoNome}>
                  {contato.nome} · {contato.relacao}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => void Linking.openURL(`tel:${contato.telefone.replace(/\D/g, '')}`)}
                accessibilityRole="button"
                accessibilityLabel={`Ligar para ${contato.nome}`}
                style={[styles.ligar, { backgroundColor: p.suave }]}
              >
                <Ionicons name="call-outline" size={22} color={p.principal} />
              </TouchableOpacity>
            </Cartao>
          )}
        </View>
      </ScrollView>

      {temRodape && (
        <SafeAreaView edges={['bottom']} style={[styles.rodape, shadows.destaque]}>
          <View style={[conteudoCentralizado, styles.rodapeMiolo]}>
            {pedido.status === 'pendente' && (
              <View style={styles.rodapeLinha}>
                <Botao area={AREA} variante="perigo" titulo="Recusar" onPress={recusar} desabilitado={agindo} style={{ flex: 1 }} />
                <Botao
                  area={AREA}
                  titulo="Aceitar pedido"
                  icone="checkmark"
                  carregando={agindo}
                  onPress={() =>
                    void agir(() => aceitarPedido(pedido.id), {
                      titulo: 'Pedido aceito',
                      mensagem: `${pedido.membroNome} foi avisado. O endereço e a ficha completa já estão liberados.`,
                    })
                  }
                  style={{ flex: 1.6 }}
                />
              </View>
            )}

            {pedido.status === 'aceito' &&
              (horarioLiberado ? (
                <>
                  {/* Deslizar abre a câmera para verificar o rosto; batendo com a foto da verificação
                      profissional, o atendimento começa (fluxo definido pelo usuário em 2026-09-30). */}
                  <BotaoDeslizante
                    area={AREA}
                    texto="Deslize para iniciar"
                    carregando={agindo}
                    onConfirmar={async () => setSelfieVisivel(true)}
                  />
                  <Text style={styles.dica}>
                    Ao chegar à casa do membro, arraste o círculo até o fim. A câmera abre para confirmar que é você.
                  </Text>
                </>
              ) : (
                <View style={styles.bloqueado}>
                  <Ionicons name="time-outline" size={20} color={colors.gray600} />
                  <Text style={[estilosUi.textoApoio, { flex: 1 }]}>
                    Você poderá iniciar a partir de {formatarDataHoraAgendada(pedido)}, o horário marcado.
                  </Text>
                </View>
              ))}
            {pedido.status === 'aceito' && (
              <Botao area={AREA} variante="textoPerigo" titulo="Cancelar atendimento" onPress={cancelar} desabilitado={agindo} style={styles.cancelar} />
            )}

            {pedido.status === 'em_andamento' && (
              <>
                <BotaoDeslizante
                  area={AREA}
                  texto="Deslize para concluir"
                  carregando={agindo}
                  onConfirmar={() =>
                    agir(() => concluirAtendimento(pedido.id), {
                      titulo: 'Atendimento concluído',
                      mensagem: 'Obrigado! O valor deste atendimento foi para o seu saldo em Meus ganhos.',
                    }).then(() => undefined)
                  }
                />
                <Text style={styles.dica}>Arraste o círculo até o fim quando terminar o atendimento</Text>
              </>
            )}
          </View>
        </SafeAreaView>
      )}

      <CapturaSelfie
        visivel={selfieVisivel}
        area={AREA}
        titulo="Confirme que é você"
        instrucao="Posicione o rosto dentro da moldura. Vamos conferir com a foto da sua verificação."
        textoConfirmar="Verificar e iniciar"
        onFechar={() => setSelfieVisivel(false)}
        onConfirmar={async (selfieBase64) => {
          // Se o servidor recusar (rosto não confere, pagamento não caiu...), a mensagem aparece
          // dentro da câmera e dá para tentar de novo.
          await iniciarAtendimento(pedido.id, selfieBase64);
          setSelfieVisivel(false);
          await dialogo.avisar({
            titulo: 'Rosto confirmado',
            mensagem: 'Atendimento iniciado. Quando terminar, deslize para concluir.',
            tom: 'sucesso',
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroPessoa: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  heroNome: { fontSize: 26, fontWeight: fontWeight.extrabold, color: colors.white },
  heroEtiqueta: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroEtiquetaTexto: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  tituloCartao: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.text },
  textoLinha: { fontSize: fontSize.md, color: colors.gray700, lineHeight: 22 },
  valor: { fontWeight: fontWeight.extrabold },
  contato: { flexDirection: 'row', alignItems: 'center' },
  contatoNome: { fontSize: 17, fontWeight: fontWeight.extrabold, color: colors.text },
  ligar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  rodape: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  rodapeMiolo: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 10 },
  rodapeLinha: { flexDirection: 'row', gap: 12 },
  dica: { fontSize: fontSize.sm, color: colors.gray600, textAlign: 'center' },
  bloqueado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.gray50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cancelar: { marginTop: -4 },
});
