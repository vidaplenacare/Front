import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDialogo } from '../components/Dialogo';
import { SenhaResgateModal, type ModoSenhaResgate } from '../components/SenhaResgateModal';
import {
  Aviso,
  Botao,
  CabecalhoHero,
  Cartao,
  Etiqueta,
  LinhaLista,
  TituloSecao,
  Vazio,
  estilosUi,
  sobrepor,
} from '../components/ui';
import { ErroApi } from '../services/api';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { useCuidador, type ResgateRegistro } from '../contexts/CuidadorContext';
import { useRecarregarAoFocar } from '../hooks/useRecarregarAoFocar';
import { colors, fontSize, fontWeight, paletas, type Tom } from '../theme';
import { dataHoraCurta, diaCurto, reais } from '../utils/formatos';
import type { RootStackScreenProps } from '../navigation/types';

const AREA = 'cuidador' as const;
const SOBREPOSICAO = 76;

const STATUS_RESGATE: Record<ResgateRegistro['status'], { texto: string; tom: Tom; icone?: 'checkmark' }> = {
  processando: { texto: 'Em processamento', tom: 'laranja' },
  concluido: { texto: 'Transferido', tom: 'verde', icone: 'checkmark' },
  falhou: { texto: 'Não realizado', tom: 'vermelho' },
};

// Mostra só o começo e o fim da chave Pix (o resto fica com •).
function mascararChave(chave: string): string {
  if (chave.includes('@')) {
    const [usuario, dominio] = chave.split('@');
    return `${usuario.charAt(0)}•••••@${dominio}`;
  }
  if (chave.length <= 6) return chave;
  return `${chave.slice(0, 3)}•••••${chave.slice(-2)}`;
}

export function CuidadorGanhosScreen({ navigation }: RootStackScreenProps<'CuidadorGanhos'>) {
  const {
    ganhos,
    saldoDisponivel,
    resgates,
    resgatando,
    solicitarResgate,
    perfil,
    recarregarSaldo,
    temSenhaResgate,
    definirSenhaResgate,
  } = useCuidador();
  useRecarregarAoFocar(recarregarSaldo);
  const dialogo = useDialogo();
  const [modalSenha, setModalSenha] = useState<ModoSenhaResgate | null>(null);
  const p = paletas[AREA];

  // Todo resgate passa pela senha de 6 números; na primeira vez, a janela pede pra criá-la.
  const resgatar = () => setModalSenha(temSenhaResgate ? 'resgatar' : 'criar');

  const criarSenha = async (senha: string) => {
    await definirSenhaResgate(senha);
    setModalSenha('resgatar');
  };

  const confirmarResgate = async (senha: string) => {
    try {
      await solicitarResgate(senha);
    } catch (e) {
      // Erros da senha ficam dentro da janela (o usuário tenta de novo ali mesmo).
      if (e instanceof ErroApi && e.codigo === 'SENHA_RESGATE_NAO_DEFINIDA') {
        setModalSenha('criar');
        return;
      }
      if (e instanceof ErroApi && e.codigo?.startsWith('SENHA_RESGATE')) throw e;
      setModalSenha(null);
      await dialogo.avisar({
        titulo: 'Não foi possível resgatar',
        mensagem: e instanceof Error ? e.message : 'Tente novamente em instantes.',
        tom: 'perigo',
      });
      return;
    }
    setModalSenha(null);
    await dialogo.avisar({
      titulo: 'Resgate solicitado',
      mensagem: 'A transferência está em processamento. Você acompanha o status no histórico de resgates.',
      tom: 'sucesso',
    });
  };

  // Recuperação por e-mail ainda não existe (sem provedor de e-mail contratado) — ver Cérebro.
  const esqueciSenha = () => {
    void dialogo.avisar({
      titulo: 'Recuperar senha de resgate',
      mensagem:
        'Em breve você vai poder criar uma nova senha por um link enviado ao seu e-mail. Por enquanto, fale com o suporte do Vida Plena.',
      icone: 'mail-outline',
      tom: 'colaborador',
    });
  };

  return (
    <View style={estilosUi.tela}>
      <SenhaResgateModal
        visivel={modalSenha !== null}
        modo={modalSenha ?? 'resgatar'}
        valor={saldoDisponivel}
        chavePix={perfil.chavePix ?? ''}
        onFechar={() => setModalSenha(null)}
        onCriar={criarSenha}
        onResgatar={confirmarResgate}
        onEsqueciSenha={esqueciSenha}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <CabecalhoHero
          area={AREA}
          titulo="Meus ganhos"
          onVoltar={() => navigation.goBack()}
          voltarRotulo="Painel"
          espacoInferior={SOBREPOSICAO}
        />

        <View style={[estilosUi.miolo, conteudoCentralizado, sobrepor(SOBREPOSICAO)]}>
          <Cartao destaque>
            <View style={{ gap: 4 }}>
              <Text style={styles.rotuloSaldo}>Disponível para resgate</Text>
              <Text style={[styles.saldo, { color: p.texto }]}>{reais(saldoDisponivel)}</Text>
            </View>

            {perfil.chavePix ? (
              <>
                <View style={styles.chavePix}>
                  <Ionicons name="lock-closed-outline" size={20} color={p.principal} />
                  <View>
                    <Text style={estilosUi.textoApoio}>Chave Pix cadastrada</Text>
                    <Text style={styles.chavePixValor}>{mascararChave(perfil.chavePix)}</Text>
                  </View>
                </View>
                {resgatando ? (
                  <View style={styles.processando}>
                    <ActivityIndicator color={p.principal} />
                    <Text style={estilosUi.textoApoio}>Enviando para sua chave Pix…</Text>
                  </View>
                ) : (
                  <Botao
                    area={AREA}
                    titulo="Resgatar via Pix"
                    icone="arrow-up-outline"
                    iconeAntes
                    desabilitado={saldoDisponivel <= 0}
                    onPress={resgatar}
                  />
                )}
                {saldoDisponivel <= 0 && !resgatando && (
                  <Text style={[estilosUi.textoApoio, { textAlign: 'center' }]}>
                    O valor de cada atendimento concluído aparece aqui para você resgatar.
                  </Text>
                )}
              </>
            ) : (
              <Aviso
                tom="laranja"
                icone="alert-circle-outline"
                titulo="Cadastre sua chave Pix"
                texto="Complete a verificação profissional para poder resgatar."
                onPress={() => navigation.navigate('CuidadorVerificacao')}
              />
            )}
          </Cartao>

          <TituloSecao>Resgates</TituloSecao>
          {resgates.length === 0 ? (
            <Cartao>
              <Vazio
                area={AREA}
                icone="swap-vertical-outline"
                titulo="Nenhum resgate ainda"
                texto="Quando você resgatar, o andamento da transferência aparece aqui."
              />
            </Cartao>
          ) : (
            <Cartao style={styles.cartaoLista}>
              {resgates.map((item, i) => {
                const status = STATUS_RESGATE[item.status];
                return (
                  <LinhaLista key={item.id} ultima={i === resgates.length - 1}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.linhaTitulo}>{dataHoraCurta(item.data)}</Text>
                      <Etiqueta texto={status.texto} tom={status.tom} icone={status.icone} />
                      {item.status === 'falhou' && (
                        <Text style={estilosUi.textoApoio}>
                          {item.motivoFalha ? `${item.motivoFalha} · ` : ''}o valor voltou ao saldo
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.linhaValor, item.status === 'falhou' && styles.valorRiscado]}>
                      {reais(item.valor)}
                    </Text>
                  </LinhaLista>
                );
              })}
            </Cartao>
          )}

          <TituloSecao>Atendimentos concluídos</TituloSecao>
          <Cartao style={styles.cartaoLista}>
            <LinhaLista>
              <Text style={[styles.linhaTitulo, { flex: 1 }]}>Total do mês</Text>
              <Text style={[styles.linhaValor, { color: p.texto }]}>{reais(ganhos.totalMes)}</Text>
            </LinhaLista>
            {ganhos.historico.map((item, i) => (
              <LinhaLista key={`${item.data}-${i}`} ultima={i === ganhos.historico.length - 1}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linhaTitulo}>{item.pacienteNome}</Text>
                  <Text style={estilosUi.textoApoio}>{diaCurto(item.data)}</Text>
                </View>
                <Text style={[styles.linhaValor, { color: p.texto }]}>{reais(item.valor)}</Text>
              </LinhaLista>
            ))}
          </Cartao>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rotuloSaldo: { fontSize: 15, fontWeight: fontWeight.semibold, color: colors.gray600 },
  saldo: { fontSize: fontSize.display, fontWeight: fontWeight.extrabold, letterSpacing: -0.5 },
  chavePix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.gray50,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chavePixValor: { fontSize: 15, fontWeight: fontWeight.bold, color: colors.gray700 },
  processando: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 54 },
  cartaoLista: { gap: 0, paddingVertical: 6, paddingHorizontal: 16 },
  linhaTitulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  linhaValor: { fontSize: 17, fontWeight: fontWeight.extrabold, color: colors.text },
  valorRiscado: { color: colors.textLight, textDecorationLine: 'line-through' },
});
