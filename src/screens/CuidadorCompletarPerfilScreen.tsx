import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDialogo } from '../components/Dialogo';
import { FotoPessoa } from '../components/FotoPessoa';
import { SeletorHorario } from '../components/SeletorHorario';
import { Aviso, Botao, CabecalhoHero, Campo, Cartao, Chips, TituloSecao, estilosUi } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useCuidador } from '../contexts/CuidadorContext';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { colors, fontSize, fontWeight, paletas, shadows } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';
import { voltarAoInicio } from '../utils/navegacao';

const AREA = 'cuidador' as const;
const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const RAIO_MIN = 5;
const RAIO_MAX = 50;
const RAIO_PASSO = 5;

export function CuidadorCompletarPerfilScreen({ navigation }: RootStackScreenProps<'CuidadorCompletarPerfil'>) {
  const { perfil, atualizarPerfil, completarPerfil, perfilPublicoCarregado } = useCuidador();
  const dialogo = useDialogo();
  const [salvando, setSalvando] = useState(false);
  const p = paletas[AREA];

  const [bio, setBio] = useState(perfil.bio);
  const [especialidade, setEspecialidade] = useState(perfil.especialidade);
  const [valorVisita, setValorVisita] = useState(perfil.valorVisita > 0 ? String(perfil.valorVisita) : '');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(perfil.diasSemana);
  const [horarioInicio, setHorarioInicio] = useState(perfil.horarioInicio);
  const [horarioFim, setHorarioFim] = useState(perfil.horarioFim);
  const [raioAtendimentoKm, setRaioAtendimentoKm] = useState(perfil.raioAtendimentoKm);
  const { usuario } = useAuth();

  // O perfil público chega do SERVIDOR depois que a tela abre: quando chegar, preenche o formulário
  // (antes abria sempre vazio, mesmo com o perfil já cadastrado no banco — 2026-09-30).
  useEffect(() => {
    if (!perfilPublicoCarregado) return;
    setBio(perfil.bio);
    setEspecialidade(perfil.especialidade);
    setValorVisita(perfil.valorVisita > 0 ? String(perfil.valorVisita) : '');
    setDiasSelecionados(perfil.diasSemana);
    setHorarioInicio(perfil.horarioInicio);
    setHorarioFim(perfil.horarioFim);
    // Só na chegada dos dados — não sobrescreve o que a pessoa está digitando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfilPublicoCarregado]);

  const toggleDia = (dia: string) => {
    setDiasSelecionados((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  };

  const valido =
    bio.trim().length > 0 &&
    especialidade.trim().length > 0 &&
    Number(valorVisita.replace(',', '.')) > 0 &&
    diasSelecionados.length > 0 &&
    horarioInicio.trim().length > 0 &&
    horarioFim.trim().length > 0;

  // Salva NO SERVIDOR (antes só mudava o aparelho e o catálogo não via nada — 2026-09-30).
  const salvar = async () => {
    setSalvando(true);
    try {
      await completarPerfil({
        bio,
        especialidade,
        // ⚠️ O campo se chama `valorVisita` por causa da coluna no banco, mas desde 2026-09-10 é o
        // valor por HORA (ver utils/atendimento.ts).
        valorVisita: Number(valorVisita.replace(',', '.')),
        diasSemana: diasSelecionados,
        horarioInicio,
        horarioFim,
      });
      // Raio de atendimento ainda não tem coluna no servidor: fica só neste aparelho (pendência).
      atualizarPerfil({ raioAtendimentoKm });
      await dialogo.avisar({
        titulo: 'Perfil salvo',
        mensagem: 'As famílias já veem as informações novas no catálogo.',
        tom: 'sucesso',
      });
      // Volta ao Painel com o caminho limpo (`navigate` empilhava um Painel novo no RN 7).
      voltarAoInicio(navigation, 'CuidadorPainel');
    } catch (e) {
      await dialogo.avisar({
        titulo: 'Não foi possível salvar',
        mensagem: `${e instanceof Error ? e.message : 'Falha de conexão'}. Nada foi alterado no seu perfil público.`,
        tom: 'perigo',
      });
    } finally {
      setSalvando(false);
    }
  };

  const botaoRaio = (icone: 'remove' | 'add', desabilitado: boolean, onPress: () => void, rotulo: string) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={[styles.raioBotao, { backgroundColor: p.suave }, desabilitado && { opacity: 0.4 }]}
    >
      <Ionicons name={icone} size={24} color={p.principal} />
    </TouchableOpacity>
  );

  return (
    <View style={estilosUi.tela}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <CabecalhoHero
            area={AREA}
            titulo={perfil.perfilCompleto ? 'Perfil público' : 'Complete seu perfil'}
            subtitulo="É isso que as famílias veem antes de contratar você"
            onVoltar={() => navigation.goBack()}
            voltarRotulo="Painel"
          />

          <View style={[estilosUi.miolo, conteudoCentralizado, { paddingTop: 20 }]}>
            {!perfil.perfilCompleto && (
              <Aviso
                tom="laranja"
                icone="alert-circle-outline"
                titulo="Sem perfil, você não aparece nas buscas"
                texto="Preencha tudo abaixo para começar a receber pedidos."
              />
            )}

            {/* A foto do profissional vem SÓ da selfie da Verificação profissional (câmera, na hora)
                e não é trocada aqui — é contra ela que o rosto é conferido ao iniciar cada
                atendimento. Decisão do usuário em 2026-09-30. */}
            <TituloSecao>Sua foto</TituloSecao>
            <Cartao>
              <View style={styles.foto}>
                <FotoPessoa foto={usuario?.fotoPerfil} nome={perfil.nome} area={AREA} tamanho={96} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.rotulo}>
                    {usuario?.fotoPerfil ? 'Esta é a foto que as famílias veem' : 'Você ainda não tem foto'}
                  </Text>
                  <Text style={estilosUi.textoApoio}>
                    {usuario?.fotoPerfil
                      ? 'Ela foi tirada na sua verificação profissional. Ao iniciar cada atendimento, o seu rosto é conferido com ela.'
                      : 'A foto é tirada na hora, pela câmera, durante a verificação profissional.'}
                  </Text>
                </View>
              </View>
              {!usuario?.fotoPerfil && (
                <Botao
                  area={AREA}
                  titulo="Fazer a verificação"
                  icone="shield-checkmark-outline"
                  iconeAntes
                  onPress={() => navigation.navigate('CuidadorVerificacao')}
                />
              )}
            </Cartao>

            <TituloSecao>Sobre você</TituloSecao>
            <Cartao style={{ gap: 18 }}>
              <Campo
                area={AREA}
                rotulo="Apresentação"
                ajuda="Conte sua experiência e como você gosta de cuidar."
                value={bio}
                onChangeText={setBio}
                placeholder="Ex.: Trabalho há 8 anos com idosos acamados…"
                multilinha
              />
              <Campo
                area={AREA}
                rotulo="Especialidade principal"
                value={especialidade}
                onChangeText={setEspecialidade}
                placeholder="Ex.: Cuidados com Alzheimer"
              />
              <Campo
                area={AREA}
                rotulo="Valor por hora (R$)"
                ajuda="A família paga as horas contratadas × este valor."
                value={valorVisita}
                onChangeText={(t) => setValorVisita(t.replace(/[^\d,.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="Ex.: 45"
                icone="cash-outline"
              />
            </Cartao>

            <TituloSecao>Quando você atende</TituloSecao>
            <Cartao style={{ gap: 18 }}>
              <View style={{ gap: 8 }}>
                <Text style={styles.rotulo}>Dias disponíveis</Text>
                <Chips
                  area={AREA}
                  opcoes={diasDaSemana.map((d) => ({ id: d, rotulo: d }))}
                  selecionados={diasSelecionados}
                  onAlternar={toggleDia}
                />
              </View>
              {/* Escolher tocando numa grade de horários, em vez de digitar (usuário, 2026-09-30). */}
              <View style={styles.horarios}>
                <SeletorHorario
                  area={AREA}
                  rotulo="Das"
                  valor={horarioInicio}
                  onEscolher={(h) => {
                    setHorarioInicio(h);
                    // Início novo depois do fim → o fim deixa de valer; a pessoa escolhe de novo.
                    if (horarioFim && horarioFim <= h) setHorarioFim('');
                  }}
                />
                <SeletorHorario
                  area={AREA}
                  rotulo="Até"
                  valor={horarioFim}
                  onEscolher={setHorarioFim}
                  desabilitado={(h) => !!horarioInicio && h <= horarioInicio}
                />
              </View>
            </Cartao>

            <TituloSecao>Onde você atende</TituloSecao>
            <Cartao>
              <Text style={styles.rotulo}>Distância máxima</Text>
              <Text style={estilosUi.textoApoio}>Você só recebe pedidos de quem estiver dentro dessa distância.</Text>
              <View style={styles.raio}>
                {botaoRaio(
                  'remove',
                  raioAtendimentoKm <= RAIO_MIN,
                  () => setRaioAtendimentoKm((km) => Math.max(RAIO_MIN, km - RAIO_PASSO)),
                  'Diminuir distância'
                )}
                <Text style={[styles.raioValor, { color: p.texto }]} accessibilityLiveRegion="polite">
                  {raioAtendimentoKm} km
                </Text>
                {botaoRaio(
                  'add',
                  raioAtendimentoKm >= RAIO_MAX,
                  () => setRaioAtendimentoKm((km) => Math.min(RAIO_MAX, km + RAIO_PASSO)),
                  'Aumentar distância'
                )}
              </View>
            </Cartao>
          </View>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={[styles.rodape, shadows.destaque]}>
          <View style={[conteudoCentralizado, { paddingHorizontal: 20, paddingVertical: 14, gap: 6 }]}>
            <Botao
              area={AREA}
              titulo={perfil.perfilCompleto ? 'Salvar alterações' : 'Salvar perfil'}
              icone="checkmark"
              desabilitado={!valido}
              carregando={salvando}
              onPress={salvar}
            />
            {!valido && <Text style={styles.faltando}>Preencha todos os campos para salvar.</Text>}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  foto: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  horarios: { flexDirection: 'row', gap: 12 },
  raio: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 4 },
  raioBotao: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  raioValor: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, minWidth: 90, textAlign: 'center' },
  rodape: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  faltando: { fontSize: fontSize.sm, color: colors.gray600, textAlign: 'center' },
});
