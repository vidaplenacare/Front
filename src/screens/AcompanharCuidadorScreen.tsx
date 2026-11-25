import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FotoPessoa } from '../components/FotoPessoa';
import { useDialogo } from '../components/Dialogo';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../contexts/AppContext';
import { useProfissional } from '../hooks/useProfissional';
import { buscarSolicitacao } from '../services/api';
import { criarConexaoSocket } from '../services/socket';
import { iniciarEnvioLocalizacao, type PararEnvioLocalizacao } from '../services/location';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';
import { faixaHorario } from '../utils/atendimento';
import { abrirWhatsApp, ligarPara } from '../utils/linking';
import type { RootStackScreenProps } from '../navigation/types';

// Endereço cadastrado ainda é mockado: sem geocodificação real (ver BACKEND-ARQUITETURA.md), o
// pino do "seu endereço" fica fixo na Praça da Sé/SP. A posição do cuidador, a partir daqui, é
// real — vem do GPS de verdade via Socket.IO (services/socket.ts) + Prisma
// (`Solicitacao.ultimaLatitude/ultimaLongitude`, `LocalizacaoPing`), não mais simulada.
const ENDERECO_COORD = { latitude: -23.5505, longitude: -46.6333 };

type Coordenada = { latitude: number; longitude: number };

export function AcompanharCuidadorScreen({ navigation, route }: RootStackScreenProps<'AcompanharCuidador'>) {
  const { dadosPessoais, solicitacoes } = useApp();
  const dialogo = useDialogo();
  const solicitacao = solicitacoes.find((s) => s.id === route.params.solicitacaoId);
  // Telefone do profissional vem do servidor (ver useProfissional), não da lista fixa antiga.
  const { profissional } = useProfissional(solicitacao?.cuidadorId);

  const [posicaoCuidador, setPosicaoCuidador] = useState<Coordenada | null>(null);
  const [trilha, setTrilha] = useState<Coordenada[]>([]);
  const [compartilhando, setCompartilhando] = useState(false);
  const pararEnvioRef = useRef<PararEnvioLocalizacao | null>(null);

  // Busca a última posição conhecida (caso o cuidador já tenha enviado localização antes de o
  // membro abrir esta tela) e depois conecta ao canal em tempo real para receber atualizações.
  useEffect(() => {
    if (!solicitacao) return;
    let ativo = true;

    buscarSolicitacao(solicitacao.id)
      .then((dados) => {
        if (ativo && dados?.ultimaLatitude != null && dados?.ultimaLongitude != null) {
          setPosicaoCuidador({ latitude: dados.ultimaLatitude, longitude: dados.ultimaLongitude });
        }
      })
      .catch(() => {
        // Sem back-end acessível: a tela continua funcionando, só sem posição inicial.
      });

    const socket = criarConexaoSocket();
    socket.emit('entrar-sala', { solicitacaoId: solicitacao.id });
    socket.on('localizacao-atualizada', (dado: { latitude: number; longitude: number }) => {
      const ponto = { latitude: dado.latitude, longitude: dado.longitude };
      setPosicaoCuidador(ponto);
      setTrilha((prev) => [...prev, ponto]);
    });

    return () => {
      ativo = false;
      socket.disconnect();
    };
  }, [solicitacao?.id]);

  useEffect(() => () => pararEnvioRef.current?.(), []);

  const iniciarCompartilhamento = async () => {
    if (!solicitacao) return;
    try {
      pararEnvioRef.current = await iniciarEnvioLocalizacao(solicitacao.id);
      setCompartilhando(true);
    } catch {
      void dialogo.avisar({
        titulo: 'Localização não permitida',
        mensagem: 'Para compartilhar sua localização, permita o acesso ao GPS nas configurações do aparelho.',
        icone: 'location-outline',
        tom: 'aviso',
      });
    }
  };

  const pararCompartilhamento = () => {
    pararEnvioRef.current?.();
    pararEnvioRef.current = null;
    setCompartilhando(false);
  };

  if (!solicitacao) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Solicitação não encontrada"
          onBack={() => navigation.goBack()}
          gradientColors={gradients.cuidadores}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={solicitacao.cuidadorNome}
        subtitle="Acompanhamento em tempo real"
        onBack={() => navigation.goBack()}
        gradientColors={gradients.cuidadores}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <View
          style={[
            styles.statusBanner,
            solicitacao.status === 'concluida'
              ? styles.statusBannerConcluido
              : solicitacao.status === 'em_andamento'
                ? styles.statusBannerChegou
                : styles.statusBannerCaminho,
          ]}
        >
          <Ionicons
            name={
              solicitacao.status === 'concluida'
                ? 'checkmark-done'
                : solicitacao.status === 'em_andamento'
                  ? 'checkmark-circle'
                  : 'navigate'
            }
            size={20}
            color={colors.white}
          />
          <Text style={styles.statusBannerText}>
            {solicitacao.status === 'concluida'
              ? 'Atendimento concluído'
              : solicitacao.status === 'em_andamento'
                ? 'Cuidador chegou · atendimento em andamento'
                : 'Cuidador a caminho'}
          </Text>
        </View>

        <View style={styles.enderecoRow}>
          <Ionicons name="location" size={14} color={colors.textSecondary} />
          <Text style={styles.enderecoTexto} numberOfLines={1}>
            Endereço cadastrado: {dadosPessoais.endereco}
          </Text>
        </View>

        {!posicaoCuidador && (
          <View style={styles.aguardandoRow}>
            <Ionicons name="time-outline" size={14} color={colors.orange} />
            <Text style={styles.aguardandoTexto}>Aguardando localização em tempo real do cuidador…</Text>
          </View>
        )}

        <MapView
          style={styles.map}
          initialRegion={{
            latitude: ENDERECO_COORD.latitude,
            longitude: ENDERECO_COORD.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Tiles do OpenStreetMap — não exigem chave de API, ao contrário do provider padrão
              (Google Maps no Android), que fica em branco sem uma chave configurada em app.json. */}
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
          <Marker coordinate={ENDERECO_COORD} title="Seu endereço" pinColor={colors.primary} />
          {posicaoCuidador && (
            <Marker coordinate={posicaoCuidador} title={solicitacao.cuidadorNome}>
              <View style={styles.marcadorCuidador}>
                <FotoPessoa foto={solicitacao.cuidadorFoto} nome={solicitacao.cuidadorNome} area="membro" tamanho={40} />
              </View>
            </Marker>
          )}
          {trilha.length > 1 && <Polyline coordinates={trilha} strokeColor={colors.blue} strokeWidth={3} />}
        </MapView>

        <View style={[styles.infoCard, shadows.card]}>
          <FotoPessoa foto={solicitacao.cuidadorFoto} nome={solicitacao.cuidadorNome} area="membro" tamanho={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoNome}>{solicitacao.cuidadorNome}</Text>
            <Text style={styles.infoHorario}>
              {solicitacao.dataPreferida} · {faixaHorario(solicitacao.horarioInicio, solicitacao.horarioFim)}
            </Text>
          </View>
          {profissional && (
            <View style={styles.infoAcoes}>
              <TouchableOpacity style={styles.callButton} onPress={() => ligarPara(profissional.telefone)} hitSlop={8}>
                <Ionicons name="call" size={18} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => abrirWhatsApp(profissional.telefone)}
                hitSlop={8}
              >
                <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.testeButton}
          onPress={compartilhando ? pararCompartilhamento : iniciarCompartilhamento}
        >
          <Ionicons name={compartilhando ? 'stop-circle-outline' : 'navigate-circle-outline'} size={18} color={colors.textSecondary} />
          <Text style={styles.testeButtonText}>
            {compartilhando
              ? 'Modo teste: parar de compartilhar minha localização'
              : 'Modo teste: compartilhar minha localização como cuidador'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  statusBannerCaminho: { backgroundColor: colors.blue },
  statusBannerChegou: { backgroundColor: colors.success },
  statusBannerConcluido: { backgroundColor: colors.primary },
  statusBannerText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  enderecoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray50,
  },
  enderecoTexto: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary },
  aguardandoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.orange}15`,
  },
  aguardandoTexto: { flex: 1, fontSize: fontSize.xs, color: colors.orange },
  map: { flex: 1 },
  marcadorCuidador: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcadorFoto: { width: 40, height: 40, borderRadius: 20 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  infoAvatar: { width: 56, height: 56, borderRadius: radius.md },
  infoNome: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  infoHorario: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  infoAcoes: { flexDirection: 'row', gap: spacing.sm },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  testeButtonText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
});
