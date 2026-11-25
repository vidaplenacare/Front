import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { FotoPessoa } from '../components/FotoPessoa';
import { useDialogo } from '../components/Dialogo';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientButton } from '../components/GradientButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { buscarAgenda, ErroApi, type FaixaOcupadaApi } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { useProfissional } from '../hooks/useProfissional';
import { abrirAPartirDoInicio, voltarAoInicio } from '../utils/navegacao';
import { faixaHorario, faixasSobrepoem, horasEntre, paraMinutos } from '../utils/atendimento';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const DIAS_EXIBIDOS = 21;
const diasSemanaAbrev = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function gerarProximosDias(quantidade: number): Date[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Array.from({ length: quantidade }, (_, i) => {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);
    return data;
  });
}

function gerarHorarios(inicio: string, fim: string, passoMinutos = 60): string[] {
  const [horaInicio, minInicio] = inicio.split(':').map(Number);
  const [horaFim, minFim] = fim.split(':').map(Number);
  let minutosInicio = horaInicio * 60 + minInicio;
  let minutosFim = horaFim * 60 + minFim;
  if (minutosFim <= minutosInicio) minutosFim += 24 * 60;

  const horarios: string[] = [];
  for (let m = minutosInicio; m <= minutosFim; m += passoMinutos) {
    const totalMinutos = m % (24 * 60);
    const h = Math.floor(totalMinutos / 60);
    const min = totalMinutos % 60;
    horarios.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return horarios;
}

export function SolicitarContratacaoScreen({ navigation, route }: RootStackScreenProps<'SolicitarContratacao'>) {
  const { criarSolicitacao } = useApp();
  const dialogo = useDialogo();
  // Dados do servidor: expediente, dias e valor/hora ATUAIS (ver useProfissional). O valor que vale
  // de verdade é o que o servidor congela ao criar a contratação.
  const { profissional, carregando: carregandoProfissional } = useProfissional(route.params.cuidadorId);

  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [inicioSelecionado, setInicioSelecionado] = useState<string | null>(null);
  const [fimSelecionado, setFimSelecionado] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [agenda, setAgenda] = useState<FaixaOcupadaApi[]>([]);
  const [erroAgenda, setErroAgenda] = useState<string | null>(null);

  const dias = useMemo(() => gerarProximosDias(DIAS_EXIBIDOS), []);
  const horarios = useMemo(
    () => (profissional ? gerarHorarios(profissional.horarioInicio, profissional.horarioFim) : []),
    [profissional]
  );

  // A agenda ocupada vem do servidor: são as reservas de TODOS os contratantes, não só as deste
  // membro — é isso que impede dois membros de fecharem o mesmo horário. Carregada uma vez para a
  // janela inteira de dias exibidos, e recarregada quando um envio bate em conflito.
  const cuidadorId = profissional?.id;
  const recarregarAgenda = useCallback(async () => {
    if (!cuidadorId) return;
    try {
      const resposta = await buscarAgenda(cuidadorId);
      setAgenda(resposta.ocupado);
      setErroAgenda(null);
    } catch (erro) {
      // Sem agenda confiável, a tela não pode fingir que está tudo livre — avisa e deixa o usuário
      // decidir, em vez de deixá-lo marcar um horário que vai ser recusado no envio.
      setErroAgenda(erro instanceof Error ? erro.message : 'Não foi possível carregar a agenda');
    }
  }, [cuidadorId]);

  useEffect(() => {
    void recarregarAgenda();
  }, [recarregarAgenda]);

  // Recorta a agenda no dia escolhido e converte para "HH:MM", que é como a tela compara.
  const faixasOcupadas = useMemo(() => {
    if (!diaSelecionado) return [] as { inicio: string; fim: string }[];
    return agenda
      .map((faixa) => ({ inicio: new Date(faixa.inicioEm), fim: new Date(faixa.fimEm) }))
      .filter((faixa) => faixa.inicio.toDateString() === diaSelecionado.toDateString())
      .map((faixa) => ({
        inicio: `${String(faixa.inicio.getHours()).padStart(2, '0')}:${String(faixa.inicio.getMinutes()).padStart(2, '0')}`,
        fim: `${String(faixa.fim.getHours()).padStart(2, '0')}:${String(faixa.fim.getMinutes()).padStart(2, '0')}`,
      }));
  }, [agenda, diaSelecionado]);

  // Uma hora está ocupada quando a faixa de 1h que começa nela colide com algo já reservado.
  const horaOcupada = (horario: string): boolean => {
    const [hora, minuto] = horario.split(':').map(Number);
    const fimDaHora = `${String(hora + 1).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    return faixasOcupadas.some((faixa) => faixasSobrepoem(horario, fimDaHora, faixa.inicio, faixa.fim));
  };

  // Términos válidos: depois do início escolhido e sem atravessar nenhum bloco ocupado.
  const fimEhValido = (fim: string): boolean => {
    if (!inicioSelecionado) return false;
    if (paraMinutos(fim) <= paraMinutos(inicioSelecionado)) return false;
    return !faixasOcupadas.some((faixa) =>
      faixasSobrepoem(inicioSelecionado, fim, faixa.inicio, faixa.fim)
    );
  };

  const horas = inicioSelecionado && fimSelecionado ? horasEntre(inicioSelecionado, fimSelecionado) : 0;
  const valorTotal = profissional ? profissional.valorVisita * horas : 0;

  const selecionarDia = (dia: Date) => {
    setDiaSelecionado(dia);
    // Trocar de dia zera a faixa: a agenda ocupada é outra, o horário anterior pode não valer.
    setInicioSelecionado(null);
    setFimSelecionado(null);
  };

  const selecionarInicio = (horario: string) => {
    setInicioSelecionado(horario);
    setFimSelecionado(null);
  };

  if (!profissional) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={carregandoProfissional ? 'Carregando…' : 'Profissional não encontrado'}
          onBack={() => navigation.goBack()}
          gradientColors={gradients.cuidadores}
        />
        {carregandoProfissional && <ActivityIndicator size="large" color={colors.blue} style={{ marginTop: spacing.xl }} />}
      </View>
    );
  }

  const valido = diaSelecionado !== null && inicioSelecionado !== null && fimSelecionado !== null;

  // Junta o dia escolhido com o horário (HH:MM) num instante local — é o que a API espera.
  const comHorario = (dia: Date, horario: string): Date => {
    const [hora, minuto] = horario.split(':').map(Number);
    const data = new Date(dia);
    data.setHours(hora, minuto, 0, 0);
    return data;
  };

  const enviar = async () => {
    if (!diaSelecionado || !inicioSelecionado || !fimSelecionado || enviando) return;

    setEnviando(true);
    try {
      await criarSolicitacao({
        cuidadorId: profissional.id,
        inicioEm: comHorario(diaSelecionado, inicioSelecionado),
        fimEm: comHorario(diaSelecionado, fimSelecionado),
        observacoes,
      });
      setEnviando(false);
      // Fim do processo: sai daqui com o caminho limpo — antes abria o Perfil POR CIMA e a pessoa
      // tinha que voltar tela por tela até a Home (usuário, 2026-09-30).
      const voltarInicio = await dialogo.confirmar({
        titulo: 'Solicitação enviada!',
        mensagem: 'Assim que o cuidador aceitar, você recebe o aviso e poderá pagar para confirmar a visita.',
        icone: 'paper-plane-outline',
        tom: 'sucesso',
        confirmar: 'Voltar para o início',
        cancelar: 'Ver minhas solicitações',
      });
      if (voltarInicio) voltarAoInicio(navigation);
      else abrirAPartirDoInicio(navigation, 'Perfil', { secao: 'cuidadoresSolicitados' });
    } catch (erro) {
      // 409 = alguém fechou esse horário entre a tela carregar e o envio. A mensagem do back-end
      // já explica isso; recarregar a agenda evita o usuário tentar o mesmo horário de novo.
      const conflito = erro instanceof ErroApi && erro.status === 409;
      if (conflito) void recarregarAgenda();
      void dialogo.avisar({
        titulo: conflito ? 'Horário indisponível' : 'Não foi possível enviar',
        mensagem: erro instanceof Error ? erro.message : 'Tente novamente.',
        icone: conflito ? 'time-outline' : undefined,
        tom: conflito ? 'aviso' : 'perigo',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Solicitar Contratação" onBack={() => navigation.goBack()} gradientColors={gradients.cuidadores} />
      {/* Teclado não cobre os campos (Android edge-to-edge, hooks/useTeclado.ts). */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.resumoCard, shadows.card]}>
            <FotoPessoa foto={profissional.foto} nome={profissional.nome} area="membro" tamanho={64} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profissional.nome}</Text>
              <Text style={styles.especialidade}>{profissional.especialidade}</Text>
              <Text style={styles.preco}>R$ {profissional.valorVisita.toFixed(2)} / hora</Text>
            </View>
          </View>

          <View style={[styles.card, shadows.card]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Escolha a data</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diasScrollContent}>
              {dias.map((dia) => {
                const diaSemana = dia.getDay();
                const disponivel = profissional.diasDisponiveis.includes(diaSemana);
                const selecionado = diaSelecionado?.toDateString() === dia.toDateString();
                return (
                  <TouchableOpacity
                    key={dia.toISOString()}
                    style={[
                      styles.diaCard,
                      selecionado && styles.diaCardSelecionado,
                      !disponivel && styles.diaCardDesabilitado,
                    ]}
                    disabled={!disponivel}
                    activeOpacity={0.8}
                    onPress={() => selecionarDia(dia)}
                  >
                    <Text
                      style={[
                        styles.diaCardSemana,
                        selecionado && styles.diaCardTextoSelecionado,
                        !disponivel && styles.diaCardTextoDesabilitado,
                      ]}
                    >
                      {diasSemanaAbrev[diaSemana]}
                    </Text>
                    <Text
                      style={[
                        styles.diaCardNumero,
                        selecionado && styles.diaCardTextoSelecionado,
                        !disponivel && styles.diaCardTextoDesabilitado,
                      ]}
                    >
                      {dia.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.dicaTexto}>Dias em cinza indicam que o profissional não atende nessa data.</Text>
          </View>

          <View style={[styles.card, shadows.card]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>De que horas até que horas?</Text>
            </View>

            {erroAgenda ? (
              <View style={styles.avisoAgenda}>
                <Ionicons name="warning" size={16} color={colors.orange} />
                <Text style={styles.avisoAgendaTexto}>
                  Não foi possível carregar a agenda do profissional ({erroAgenda}). Os horários
                  ocupados podem não aparecer — se der conflito, tente outro horário.
                </Text>
              </View>
            ) : null}

            {!diaSelecionado ? (
              <Text style={styles.dicaTexto}>Escolha primeiro a data para ver os horários livres.</Text>
            ) : (
              <>
                <Text style={styles.subLabel}>Início</Text>
                <View style={styles.horariosRow}>
                  {horarios.slice(0, -1).map((horario) => {
                    const ocupado = horaOcupada(horario);
                    const selecionado = inicioSelecionado === horario;
                    return (
                      <TouchableOpacity
                        key={horario}
                        style={[
                          styles.horarioChip,
                          selecionado && styles.horarioChipSelecionado,
                          ocupado && styles.horarioChipOcupado,
                        ]}
                        activeOpacity={0.8}
                        disabled={ocupado}
                        onPress={() => selecionarInicio(horario)}
                      >
                        <Text
                          style={[
                            styles.horarioChipText,
                            selecionado && styles.horarioChipTextSelecionado,
                            ocupado && styles.horarioChipTextOcupado,
                          ]}
                        >
                          {horario}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {inicioSelecionado && (
                  <>
                    <Text style={[styles.subLabel, { marginTop: spacing.md }]}>Término</Text>
                    <View style={styles.horariosRow}>
                      {horarios.map((horario) => {
                        const disponivel = fimEhValido(horario);
                        const selecionado = fimSelecionado === horario;
                        return (
                          <TouchableOpacity
                            key={horario}
                            style={[
                              styles.horarioChip,
                              selecionado && styles.horarioChipSelecionado,
                              !disponivel && styles.horarioChipOcupado,
                            ]}
                            activeOpacity={0.8}
                            disabled={!disponivel}
                            onPress={() => setFimSelecionado(horario)}
                          >
                            <Text
                              style={[
                                styles.horarioChipText,
                                selecionado && styles.horarioChipTextSelecionado,
                                !disponivel && styles.horarioChipTextOcupado,
                              ]}
                            >
                              {horario}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                <Text style={styles.dicaTexto}>
                  Horários em cinza já estão reservados na agenda do profissional.
                </Text>
              </>
            )}
          </View>

          {horas > 0 && (
            <View style={[styles.totalCard, shadows.card]}>
              <View style={styles.totalLinha}>
                <Text style={styles.totalLabel}>
                  {faixaHorario(inicioSelecionado!, fimSelecionado!)} · {horas}h
                </Text>
                <Text style={styles.totalHoras}>
                  {horas} × R$ {profissional.valorVisita.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalLinha}>
                <Text style={styles.totalTitulo}>Total</Text>
                <Text style={styles.totalValor}>R$ {valorTotal.toFixed(2)}</Text>
              </View>
            </View>
          )}

          <View style={[styles.card, shadows.card]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Observações</Text>
            </View>
            <TextInput
              style={styles.textArea}
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Conte um pouco sobre a necessidade de cuidado"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            title={enviando ? 'Enviando…' : 'Confirmar solicitação'}
            icon="checkmark"
            disabled={!valido || enviando}
            onPress={enviar}
          />
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { ...conteudoCentralizado, padding: spacing.lg, paddingBottom: spacing.lg },
  resumoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: { width: 64, height: 64, borderRadius: radius.md },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  especialidade: { fontSize: fontSize.sm, color: colors.blue, fontWeight: fontWeight.medium, marginTop: 2 },
  preco: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.bold, marginTop: 2 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  diasScrollContent: { gap: spacing.sm, paddingBottom: 2 },
  diaCard: {
    width: 56,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  diaCardSelecionado: { backgroundColor: colors.primary, borderColor: colors.primary },
  diaCardDesabilitado: { opacity: 0.4 },
  diaCardSemana: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium, textTransform: 'uppercase' },
  diaCardNumero: { fontSize: fontSize.lg, color: colors.text, fontWeight: fontWeight.bold },
  diaCardTextoSelecionado: { color: colors.white },
  diaCardTextoDesabilitado: { color: colors.textLight },
  dicaTexto: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.sm },
  horariosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  horarioChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  horarioChipSelecionado: { backgroundColor: colors.primary, borderColor: colors.primary },
  horarioChipOcupado: { backgroundColor: colors.gray100, borderColor: colors.gray200 },
  horarioChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  horarioChipTextSelecionado: { color: colors.white },
  horarioChipTextOcupado: { color: colors.textLight, textDecorationLine: 'line-through' },
  avisoAgenda: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  avisoAgendaTexto: { fontSize: fontSize.xs, color: colors.orange, flex: 1 },
  subLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.sm },
  totalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  totalLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.semibold },
  totalHoras: { fontSize: fontSize.xs, color: colors.textSecondary },
  totalTitulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  totalValor: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.gray50,
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    ...conteudoCentralizado,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
