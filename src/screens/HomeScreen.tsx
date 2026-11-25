import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FotoPessoa } from '../components/FotoPessoa';
import { ResumoCarousel, type ResumoCarouselItem } from '../components/ResumoCarousel';
import { ServiceCard } from '../components/ServiceCard';
import { useAuth } from '../contexts/AuthContext';
import {
  Aviso,
  Botao,
  CabecalhoHero,
  Cartao,
  Etiqueta,
  IconeCirculo,
  TituloSecao,
  estilosUi,
  sobrepor,
} from '../components/ui';
import { conteudoCentralizado, useResponsivo } from '../hooks/useResponsivo';
import { useRecarregarAoFocar } from '../hooks/useRecarregarAoFocar';
import {
  statusSolicitacaoLabels,
  statusSolicitacaoTons,
  useApp,
  type SolicitacaoCuidador,
} from '../contexts/AppContext';
import { colors, fontSize, fontWeight, shadows, tons } from '../theme';
import { faixaHorario } from '../utils/atendimento';
import { saudacao } from '../utils/formatos';
import { ligarPara } from '../utils/linking';
import type { RootStackScreenProps } from '../navigation/types';

const AREA = 'membro' as const;
const SOBREPOSICAO = 64;

// Espelha o default de INICIO_COMPARTILHAMENTO_MINUTOS_ANTES do back-end
// (vida-plena-backend/.env) — só usado aqui para decidir quando mostrar o ETA real.
const INICIO_COMPARTILHAMENTO_MINUTOS_ANTES = 15;
const INTERVALO_ATUALIZACAO_ETA_MS = 30000;

function proximoLembrete(medicamentos: { nome: string; ativo: boolean; horarios: string[] }[]): string {
  const agora = new Date();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const lembretes = medicamentos
    .filter((m) => m.ativo)
    .flatMap((m) => m.horarios.map((horario) => ({ nome: m.nome, horario })));

  if (lembretes.length === 0) return 'Nenhum medicamento ativo';

  const proximosHoje = lembretes
    .map((l) => {
      const [h, min] = l.horario.split(':').map(Number);
      return { ...l, minutos: h * 60 + min };
    })
    .filter((l) => l.minutos >= minutosAgora)
    .sort((a, b) => a.minutos - b.minutos);

  if (proximosHoje.length > 0) {
    return `${proximosHoje[0].nome} · ${proximosHoje[0].horario}`;
  }

  const ordenados = [...lembretes].sort((a, b) => {
    const [ha, ma] = a.horario.split(':').map(Number);
    const [hb, mb] = b.horario.split(':').map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });
  return `${ordenados[0].nome} · amanhã ${ordenados[0].horario}`;
}

function horaCurta(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function proximaVisitaCuidador(solicitacoes: SolicitacaoCuidador[]): SolicitacaoCuidador | null {
  const ativas = solicitacoes.filter((s) => s.status === 'aceita' || s.status === 'em_andamento');
  return ativas[0] ?? null;
}

export function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
  const { dadosPessoais, medicamentos, contatosEmergencia, solicitacoes, recarregarSolicitacoes } = useApp();
  useRecarregarAoFocar(recarregarSolicitacoes);
  const [sosVisivel, setSosVisivel] = useState(false);
  const { usuario } = useAuth();
  const { porTamanho } = useResponsivo();
  const colunasServicos = porTamanho(2, 3, 4);

  const pagamentosPendentes = solicitacoes.filter((s) => s.statusPagamento === 'pendente');
  // Atendimento em curso mostrado na Home: da aceitação até a conclusão. Antes de o cuidador
  // aceitar não há o que acompanhar, e depois de concluído o acompanhamento sai da Home
  // (o histórico continua em Perfil → Cuidadores Solicitados).
  const solicitacaoAtiva =
    solicitacoes.find((s) => s.status === 'aceita' || s.status === 'em_andamento') ?? null;

  const lembrete = useMemo(() => proximoLembrete(medicamentos), [medicamentos]);
  const contatoPrincipal = contatosEmergencia.find((c) => c.principal) ?? contatosEmergencia[0];
  const proximaVisita = useMemo(() => proximaVisitaCuidador(solicitacoes), [solicitacoes]);

  // "Chegando em ~X min" com o horário REAL da visita (antes só funcionava para a visita de teste
  // "sol-1" — 2026-09-30). Com uma visita ativa, a Home recarrega a cada 30s: assim o membro vê
  // na hora quando o cuidador inicia o atendimento, sem precisar sair e voltar.
  const [agora, setAgora] = useState(() => Date.now());
  const temVisitaAtiva = !!proximaVisita;
  useEffect(() => {
    if (!temVisitaAtiva) return;
    const intervalo = setInterval(() => {
      setAgora(Date.now());
      void recarregarSolicitacoes();
    }, INTERVALO_ATUALIZACAO_ETA_MS);
    return () => clearInterval(intervalo);
  }, [temVisitaAtiva, recarregarSolicitacoes]);

  const minutosParaAtendimento = proximaVisita
    ? Math.round((new Date(proximaVisita.inicioEm).getTime() - agora) / 60000)
    : null;
  const dentroDaJanelaDeChegada =
    minutosParaAtendimento !== null && minutosParaAtendimento <= INICIO_COMPARTILHAMENTO_MINUTOS_ANTES;

  const resumoCards = useMemo<ResumoCarouselItem[]>(() => {
    const valorCuidador = !proximaVisita
      ? 'Nenhuma visita agendada'
      : dentroDaJanelaDeChegada
        ? minutosParaAtendimento !== null && minutosParaAtendimento > 0
          ? `Chegando em ~${minutosParaAtendimento} min`
          : 'Cuidador a caminho'
        : `${proximaVisita.cuidadorNome} · ${proximaVisita.dataPreferida} ${faixaHorario(proximaVisita.horarioInicio, proximaVisita.horarioFim)}`;

    return [
      {
        id: 'lembrete',
        icon: 'alarm-outline',
        tom: 'roxo',
        label: 'Lembrete de remédio',
        value: lembrete,
        onPress: () => navigation.navigate('Perfil', { secao: 'medicamentos' }),
      },
      {
        id: 'cuidador',
        icon: 'walk-outline',
        tom: 'azul',
        label: 'Chegada do cuidador',
        value: valorCuidador,
        onPress:
          proximaVisita && dentroDaJanelaDeChegada
            ? () => navigation.navigate('AcompanharCuidador', { solicitacaoId: proximaVisita.id })
            : () => navigation.navigate('Perfil', { secao: 'cuidadoresSolicitados' }),
      },
      {
        id: 'promocao',
        icon: 'pricetag-outline',
        tom: 'laranja',
        label: 'Promoção de remédios',
        value: 'Até 20% OFF nesta semana',
        onPress: () => navigation.navigate('EmConstrucao', { titulo: 'Farmácia', accentColor: colors.orange }),
      },
    ];
  }, [lembrete, navigation, proximaVisita, dentroDaJanelaDeChegada, minutosParaAtendimento]);

  return (
    <View style={estilosUi.tela}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <CabecalhoHero
          area={AREA}
          espacoInferior={SOBREPOSICAO}
          direita={{
            icone: 'notifications-outline',
            rotulo: 'Notificações',
            onPress: () => navigation.navigate('Notificacoes'),
            badge: 3,
          }}
          esquerda={
            <View style={styles.marca}>
              {/* Símbolo real do logo em branco, sem caixa — a caixa branca competia com o avatar
                  (usuário, 2026-09-30). Gerado de assets/logo.png, ver DEV-NOTES. */}
              <Image
                source={require('../../assets/logo-simbolo-branco.png')}
                style={styles.marcaLogo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <View>
                <Text style={styles.marcaNome}>Vida Plena</Text>
                <Text style={styles.marcaSub}>Cuidado e bem-estar</Text>
              </View>
            </View>
          }
        >
          <View style={styles.pessoa}>
            {/* Só mostra: a foto é tirada/trocada apenas na tela de Perfil (usuário, 2026-09-30). */}
            <FotoPessoa foto={usuario?.fotoPerfil} nome={dadosPessoais.nome} area={AREA} tamanho={64} claro />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.saudacao}>{saudacao()},</Text>
              <Text style={styles.nome} accessibilityRole="header">
                {dadosPessoais.nome.split(' ')[0]}
              </Text>
              <Text style={styles.pergunta}>Como podemos ajudar você hoje?</Text>
            </View>
          </View>
        </CabecalhoHero>

        <View style={[estilosUi.miolo, conteudoCentralizado, sobrepor(SOBREPOSICAO), { gap: 24 }]}>
          {solicitacaoAtiva ? (
            <Cartao destaque>
              <Text style={styles.rotuloCartao}>Seu atendimento</Text>
              <View style={styles.atendimentoTopo}>
                <FotoPessoa foto={solicitacaoAtiva.cuidadorFoto} nome={solicitacaoAtiva.cuidadorNome} area={AREA} tamanho={56} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.atendimentoNome}>{solicitacaoAtiva.cuidadorNome}</Text>
                  <Text style={estilosUi.textoCorpo}>
                    {solicitacaoAtiva.dataPreferida} ·{' '}
                    {faixaHorario(solicitacaoAtiva.horarioInicio, solicitacaoAtiva.horarioFim)}
                  </Text>
                  <Etiqueta
                    texto={statusSolicitacaoLabels[solicitacaoAtiva.status]}
                    tom={statusSolicitacaoTons[solicitacaoAtiva.status]}
                    icone={solicitacaoAtiva.status === 'em_andamento' ? 'play' : undefined}
                  />
                </View>
              </View>

              {solicitacaoAtiva.statusPagamento === 'pendente' ? (
                <>
                  <Aviso
                    tom="laranja"
                    icone="time-outline"
                    texto="O cuidador aceitou. A visita só fica confirmada depois do pagamento."
                  />
                  <Botao
                    area={AREA}
                    titulo="Pagar o atendimento"
                    icone="card-outline"
                    iconeAntes
                    onPress={() => navigation.navigate('PagarConsulta', { solicitacaoId: solicitacaoAtiva.id })}
                  />
                </>
              ) : solicitacaoAtiva.status === 'em_andamento' ? (
                <>
                  {/* Quem recebe o cuidador precisa ter certeza de que é a pessoa contratada: foto do
                      perfil e a selfie que ele tirou ao iniciar (verificação do rosto), lado a lado.
                      Fluxo definido pelo usuário em 2026-09-30. */}
                  <View style={styles.conferencia}>
                    <Text style={styles.conferenciaTitulo}>Confira quem chegou</Text>
                    {solicitacaoAtiva.selfieChegada ? (
                      <View style={styles.conferenciaFotos}>
                        <View style={styles.conferenciaItem}>
                          <FotoPessoa foto={solicitacaoAtiva.cuidadorFoto} nome={solicitacaoAtiva.cuidadorNome} area={AREA} tamanho={96} />
                          <Text style={styles.conferenciaLegenda}>Foto do perfil</Text>
                        </View>
                        <Ionicons name="swap-horizontal" size={26} color={colors.gray400} />
                        <View style={styles.conferenciaItem}>
                          <FotoPessoa foto={solicitacaoAtiva.selfieChegada} nome={solicitacaoAtiva.cuidadorNome} area={AREA} tamanho={96} />
                          <Text style={styles.conferenciaLegenda}>
                            {solicitacaoAtiva.selfieChegadaEm ? `Na chegada · ${horaCurta(solicitacaoAtiva.selfieChegadaEm)}` : 'Na chegada'}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <FotoPessoa
                        foto={solicitacaoAtiva.cuidadorFoto}
                        nome={solicitacaoAtiva.cuidadorNome}
                        area={AREA}
                        tamanho={120}
                        style={{ alignSelf: 'center' }}
                      />
                    )}
                    <Text style={[estilosUi.textoCorpo, { textAlign: 'center' }]}>
                      Quem está na sua casa deve ser <Text style={{ fontWeight: fontWeight.bold }}>{solicitacaoAtiva.cuidadorNome}</Text>, a pessoa desta foto.
                    </Text>
                    <Text style={[estilosUi.textoApoio, { textAlign: 'center' }]}>
                      Se não for a mesma pessoa, não abra a porta e avise a gente.
                    </Text>
                    <Botao
                      area={AREA}
                      variante="textoPerigo"
                      titulo="Não é a mesma pessoa"
                      icone="alert-circle-outline"
                      iconeAntes
                      onPress={() =>
                        navigation.navigate('Denuncia', {
                          tipo: 'membro_para_cuidador',
                          alvoId: solicitacaoAtiva.cuidadorId,
                          alvoNome: solicitacaoAtiva.cuidadorNome,
                        })
                      }
                    />
                  </View>
                  <Botao
                    area={AREA}
                    titulo="Acompanhar no mapa"
                    icone="map-outline"
                    iconeAntes
                    onPress={() => navigation.navigate('AcompanharCuidador', { solicitacaoId: solicitacaoAtiva.id })}
                  />
                </>
              ) : (
                <Aviso
                  tom="verde"
                  icone="checkmark-circle-outline"
                  texto="Pagamento confirmado. Ao chegar, o cuidador confirma o rosto pela câmera e a foto aparece aqui para você comparar."
                />
              )}
            </Cartao>
          ) : (
            <Cartao destaque>
              <View style={styles.atendimentoTopo}>
                <IconeCirculo icone="people-outline" area={AREA} tamanho={56} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.atendimentoNome}>Precisa de um cuidador?</Text>
                  <Text style={estilosUi.textoApoio}>
                    Profissionais verificados, com agenda e valor por hora à vista.
                  </Text>
                </View>
              </View>
              <Botao
                area={AREA}
                titulo="Encontrar um cuidador"
                icone="arrow-forward"
                onPress={() => navigation.navigate('CuidadoresCategoria')}
              />
            </Cartao>
          )}

          <View style={styles.secao}>
            <TituloSecao>Resumo de hoje</TituloSecao>
            {/* O carrossel tem 8 de respiro lateral próprio (sombra) — compensado aqui para
                alinhar com os outros cartões. */}
            <View style={{ marginHorizontal: -8 }}>
              <ResumoCarousel items={resumoCards} />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sos, shadows.suave]}
            onPress={() => setSosVisivel(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="SOS, emergência. Toque para pedir ajuda"
          >
            <View style={styles.sosIcone}>
              <Ionicons name="alert-circle" size={30} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sosTitulo}>SOS · Emergência</Text>
              <Text style={styles.sosTexto}>Toque para pedir ajuda rapidamente</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.secao}>
            <TituloSecao>Serviços</TituloSecao>
            {/* ⚠️ Cada serviço mantém a sua cor: é acessibilidade (o idoso lembra da área pela cor).
                Desde 2026-10-15 o card é branco e a cor fica na linha de baixo e no ícone (os
                clientes acharam a cor cheia "muito colorida"). Não tirar a cor de cada serviço. */}
            <View style={[styles.grade, colunasServicos > 2 && styles.gradeLarga]}>
              <ServiceCard
                title="Pagamentos"
                icon="card-outline"
                color={colors.orange}
                corIcone={colors.orangeDark}
                colunas={colunasServicos}
                badge={pagamentosPendentes.length}
                onPress={() => navigation.navigate('Pagamentos')}
              />
              <ServiceCard
                title="Cuidadores"
                icon="people-outline"
                color={colors.blue}
                colunas={colunasServicos}
                onPress={() => navigation.navigate('CuidadoresCategoria')}
              />
              <ServiceCard
                title="Produtos"
                icon="cart-outline"
                color={colors.blueLight}
                corIcone={colors.info}
                colunas={colunasServicos}
                onPress={() => navigation.navigate('Produtos')}
              />
              <ServiceCard
                title="Farmácia"
                icon="medkit-outline"
                color={colors.orange}
                corIcone={colors.orangeDark}
                colunas={colunasServicos}
                onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Farmácia', accentColor: colors.orange })}
              />
              <ServiceCard
                title="Dicas de Cuidado"
                icon="bulb-outline"
                color={colors.yellow}
                corIcone={colors.yellowDark}
                colunas={colunasServicos}
                onPress={() => navigation.navigate('Dicas')}
              />
              <ServiceCard
                title="Meu Perfil"
                icon="person-circle-outline"
                color={colors.gray700}
                colunas={colunasServicos}
                onPress={() => navigation.navigate('Perfil')}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={sosVisivel}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSosVisivel(false)}
      >
        <View style={styles.modalFundo}>
          <View style={[styles.modalFolha, shadows.modal]}>
            <View style={styles.modalTopo}>
              <IconeCirculo icone="alert-circle" tom="vermelho" tamanho={64} />
              <Text style={styles.modalTitulo}>Emergência</Text>
              <Text style={[estilosUi.textoCorpo, { textAlign: 'center' }]}>Escolha para quem ligar agora:</Text>
            </View>
            <TouchableOpacity
              style={[styles.botaoLigar, !contatoPrincipal && { opacity: 0.45 }]}
              onPress={() => {
                setSosVisivel(false);
                if (contatoPrincipal) ligarPara(contatoPrincipal.telefone);
              }}
              disabled={!contatoPrincipal}
              accessibilityRole="button"
              accessibilityState={{ disabled: !contatoPrincipal }}
            >
              <Ionicons name="call" size={22} color={colors.white} />
              <Text style={styles.botaoLigarTexto}>
                {contatoPrincipal ? `Ligar para ${contatoPrincipal.nome}` : 'Nenhum contato cadastrado'}
              </Text>
            </TouchableOpacity>
            <Botao
              area={AREA}
              variante="perigo"
              titulo="Ligar para o SAMU (192)"
              icone="medical"
              iconeAntes
              onPress={() => {
                setSosVisivel(false);
                ligarPara('192');
              }}
            />
            <Botao area={AREA} variante="texto" titulo="Cancelar" onPress={() => setSosVisivel(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marcaLogo: { width: 38, height: 38 },
  marcaNome: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.white },
  marcaSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.85)' },
  pessoa: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  saudacao: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.88)' },
  nome: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.white, lineHeight: 28 },
  pergunta: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.88)', lineHeight: 22 },
  secao: { gap: 12 },
  rotuloCartao: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray600 },
  atendimentoTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  atendimentoNome: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.text },
  conferencia: { backgroundColor: colors.gray50, borderRadius: 16, padding: 14, gap: 12 },
  conferenciaTitulo: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.text, textAlign: 'center' },
  conferenciaFotos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  conferenciaItem: { alignItems: 'center', gap: 6 },
  conferenciaLegenda: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray600 },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 84,
    backgroundColor: tons.vermelho.forte,
    borderRadius: 24,
    padding: 18,
  },
  sosIcone: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitulo: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.white },
  sosTexto: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.92)', marginTop: 2 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  // Em 3+ colunas, `space-between` jogaria os cards da última linha incompleta para as bordas
  // opostas; com `flex-start` eles ficam colados na sequência, como na grade cheia.
  gradeLarga: { justifyContent: 'flex-start' },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end' },
  modalFolha: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 32,
    gap: 12,
  },
  modalTopo: { alignItems: 'center', gap: 8, marginBottom: 8 },
  modalTitulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text },
  botaoLigar: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: tons.vermelho.forte,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  botaoLigarTexto: { color: colors.white, fontSize: 17, fontWeight: fontWeight.bold },
});
