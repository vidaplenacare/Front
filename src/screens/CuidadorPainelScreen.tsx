import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDialogo } from '../components/Dialogo';
import { FotoPessoa } from '../components/FotoPessoa';
import { ListaTermos } from '../components/ListaTermos';
import { TERMOS_DO_CUIDADOR } from '../data/termos';
import {
  AvatarIniciais,
  Aviso,
  Botao,
  CabecalhoHero,
  Cartao,
  Etiqueta,
  IconeCirculo,
  LinhaLista,
  TituloSecao,
  estilosUi,
  sobrepor,
} from '../components/ui';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { useAuth } from '../contexts/AuthContext';
import { useCuidador, type PedidoRecebido, type StatusDocumento } from '../contexts/CuidadorContext';
import { useRecarregarAoFocar } from '../hooks/useRecarregarAoFocar';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { iniciarEnvioLocalizacao, type PararEnvioLocalizacao } from '../services/location';
import { criarConexaoSocket } from '../services/socket';
import { colors, fontSize, fontWeight, paletas, shadows, tons, type Tom } from '../theme';
import { diaCurto, duracaoTexto, partesDoDia, reais, saudacao } from '../utils/formatos';
import type { RootStackScreenProps } from '../navigation/types';

const AREA = 'cuidador' as const;
const SOBREPOSICAO = 64;

const documentoStatus: Record<StatusDocumento, { texto: string; tom: Tom }> = {
  aprovado: { texto: 'Aprovado', tom: 'verde' },
  pendente: { texto: 'Pendente', tom: 'laranja' },
};

type StatusAvisoTeste = 'aguardando' | 'aguardando_resposta' | 'agendado' | 'compartilhando' | 'recusado';

const labelStatusAvisoTeste: Record<StatusAvisoTeste, string> = {
  aguardando: 'Aguardando o horário do atendimento se aproximar...',
  aguardando_resposta: 'Aviso recebido — respondendo...',
  agendado: 'Compartilhamento agendado',
  compartilhando: 'Compartilhando localização em tempo real',
  recusado: 'Compartilhamento recusado',
};

const tomStatusAvisoTeste: Record<StatusAvisoTeste, Tom> = {
  aguardando: 'cinza',
  aguardando_resposta: 'laranja',
  agendado: 'azul',
  compartilhando: 'verde',
  recusado: 'vermelho',
};

// O atendimento confirmado mais próximo (em andamento vem primeiro: está acontecendo agora).
function proximoAtendimento(pedidos: PedidoRecebido[]): PedidoRecebido | undefined {
  const emAndamento = pedidos.find((p) => p.status === 'em_andamento');
  if (emAndamento) return emAndamento;
  return pedidos
    .filter((p) => p.status === 'aceito')
    .sort((a, b) => `${a.data}${a.horarioInicio}`.localeCompare(`${b.data}${b.horarioInicio}`))[0];
}

export function CuidadorPainelScreen({ navigation }: RootStackScreenProps<'CuidadorPainel'>) {
  const { perfil, pedidos, pessoasAtendidas, saldoDisponivel, avaliacoesRecebidas, avaliarFamilia, recarregarPedidos, recarregarSaldo } =
    useCuidador();
  useRecarregarAoFocar(recarregarPedidos);
  useRecarregarAoFocar(recarregarSaldo);
  const { sair, usuario } = useAuth();
  const dialogo = useDialogo();
  const p = paletas[AREA];

  const sairDaConta = async () => {
    const confirmado = await dialogo.confirmar({
      titulo: 'Sair da conta',
      mensagem: 'Você vai precisar entrar de novo com seu e-mail e senha.',
      icone: 'log-out-outline',
      tom: 'perigo',
      confirmar: 'Sair',
    });
    if (!confirmado) return;
    await sair();
    navigation.reset({ index: 0, routes: [{ name: 'CuidadorLogin' }] });
  };

  // Média real das avaliações que as famílias deram (vêm com os pedidos, 2026-09-30).
  const mediaRecebida = avaliacoesRecebidas.length
    ? avaliacoesRecebidas.reduce((soma, a) => soma + a.nota, 0) / avaliacoesRecebidas.length
    : 0;

  const pedidosPendentes = pedidos.filter((x) => x.status === 'pendente').length;
  const pedidosAceitos = pedidos.filter((x) => x.status === 'aceito').length;
  const pedidosEmAndamento = pedidos.filter((x) => x.status === 'em_andamento').length;
  const proximo = proximoAtendimento(pedidos);

  const [modalAvaliarVisivel, setModalAvaliarVisivel] = useState<string | null>(null);
  const [notaFamilia, setNotaFamilia] = useState(5);
  const [comentarioFamilia, setComentarioFamilia] = useState('');

  // Aviso de "atendimento se aproximando" + GPS a caminho. Escuta TODAS as visitas aceitas reais do
  // profissional (antes ficava preso à visita de teste "sol-1" — o aviso nunca chegava para uma
  // visita de verdade; corrigido em 2026-09-30). O servidor (scheduler.ts) avisa a partir de 30min
  // antes; autorizando, o GPS começa no instante `iniciarCompartilhamentoEm` (horário − 15min).
  const [statusAvisoTeste, setStatusAvisoTeste] = useState<StatusAvisoTeste>('aguardando');
  const [detalheAvisoTeste, setDetalheAvisoTeste] = useState('');
  const timeoutInicioRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pararEnvioTesteRef = useRef<PararEnvioLocalizacao | null>(null);

  // Salas = visitas aceitas ou em andamento (string estável, para não reconectar à toa).
  const salasAvisos = pedidos
    .filter((x) => x.status === 'aceito' || x.status === 'em_andamento')
    .map((x) => x.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!salasAvisos) return;
    const socket = criarConexaoSocket();
    for (const id of salasAvisos.split(',')) socket.emit('entrar-sala', { solicitacaoId: id });

    socket.on(
      'aviso-30min',
      async (dado: {
        solicitacaoId: string;
        membroNome: string;
        minutosAntes: number;
        iniciarEmMinutos: number;
        iniciarCompartilhamentoEm?: string;
      }) => {
        setStatusAvisoTeste('aguardando_resposta');
        const autorizou = await dialogo.confirmar({
          titulo: 'Atendimento se aproximando',
          mensagem: `Faltam ${dado.minutosAntes} minutos para atender ${dado.membroNome}. Deseja compartilhar sua localização em tempo real? A família acompanha você chegando, a partir de ${dado.iniciarEmMinutos} minutos antes do horário.`,
          icone: 'navigate-circle-outline',
          tom: 'colaborador',
          confirmar: 'Compartilhar localização',
          cancelar: 'Agora não',
        });
        if (!autorizou) {
          setStatusAvisoTeste('recusado');
          return;
        }
        socket.emit('autorizar-compartilhamento', { solicitacaoId: dado.solicitacaoId });
        const atraso = dado.iniciarCompartilhamentoEm
          ? Math.max(0, new Date(dado.iniciarCompartilhamentoEm).getTime() - Date.now())
          : dado.iniciarEmMinutos * 60 * 1000;
        setStatusAvisoTeste('agendado');
        setDetalheAvisoTeste(atraso > 0 ? `Começa em ${Math.ceil(atraso / 60000)} min.` : 'Começando agora.');
        timeoutInicioRef.current = setTimeout(async () => {
          try {
            pararEnvioTesteRef.current = await iniciarEnvioLocalizacao(dado.solicitacaoId);
            setStatusAvisoTeste('compartilhando');
            setDetalheAvisoTeste('');
          } catch {
            setDetalheAvisoTeste('Não foi possível iniciar: permissão de localização negada.');
          }
        }, atraso);
      }
    );

    return () => {
      socket.disconnect();
      if (timeoutInicioRef.current) clearTimeout(timeoutInicioRef.current);
      pararEnvioTesteRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salasAvisos]);

  const atalhos: {
    rotulo: string;
    icone: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    badge?: number;
  }[] = [
    { rotulo: 'Pedidos', icone: 'file-tray-outline', onPress: () => navigation.navigate('PedidosRecebidos'), badge: pedidosPendentes },
    { rotulo: 'Meus ganhos', icone: 'wallet-outline', onPress: () => navigation.navigate('CuidadorGanhos') },
    { rotulo: 'Perfil público', icone: 'person-outline', onPress: () => navigation.navigate('CuidadorCompletarPerfil') },
  ];

  const dia = proximo ? partesDoDia(proximo.data) : null;

  return (
    <View style={estilosUi.tela}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <CabecalhoHero
          area={AREA}
          espacoInferior={SOBREPOSICAO}
          direita={{
            icone: 'notifications-outline',
            rotulo: 'Notificações',
            onPress: () => navigation.navigate('CuidadorNotificacoes'),
          }}
          esquerda={
            <View style={styles.marca}>
              {/* Símbolo real do logo em branco (era um coração genérico) — 2026-09-30. */}
              <Image
                source={require('../../assets/logo-simbolo-branco.png')}
                style={styles.marcaLogo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <View>
                <Text style={styles.marcaNome}>Vida Plena</Text>
                <Text style={styles.marcaSub}>Área do profissional</Text>
              </View>
            </View>
          }
        >
          <View style={styles.pessoa}>
            {/* Só mostra: a foto é tirada/trocada apenas no Perfil público (usuário, 2026-09-30). */}
            <FotoPessoa foto={usuario?.fotoPerfil} nome={perfil.nome} area={AREA} tamanho={64} claro />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.saudacao}>{saudacao()},</Text>
              <Text style={styles.nome} accessibilityRole="header">
                {perfil.nome}
              </Text>
              {perfil.statusVerificacao === 'aprovado' && (
                <View style={styles.verificado}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={colors.white} />
                  <Text style={styles.verificadoTexto}>Perfil verificado</Text>
                </View>
              )}
            </View>
          </View>
        </CabecalhoHero>

        <View style={[estilosUi.miolo, conteudoCentralizado, sobrepor(SOBREPOSICAO), { gap: 24 }]}>
          <Cartao destaque>
            <View style={{ gap: 4 }}>
              <Text style={styles.rotuloSaldo}>Saldo disponível</Text>
              <Text style={[styles.saldo, { color: p.texto }]}>{reais(saldoDisponivel)}</Text>
            </View>
            <Botao area={AREA} titulo="Ver ganhos e resgatar" icone="arrow-forward" onPress={() => navigation.navigate('CuidadorGanhos')} />
          </Cartao>

          {!usuario?.fotoPerfil && (
            <Aviso
              tom="laranja"
              icone="camera-outline"
              titulo="Falta a foto do seu rosto"
              texto="Ela é tirada na verificação profissional e é conferida sempre que você inicia um atendimento."
              onPress={() => navigation.navigate('CuidadorVerificacao')}
            />
          )}
          {!perfil.perfilCompleto && (
            <Aviso
              tom="laranja"
              icone="alert-circle-outline"
              titulo="Complete seu perfil público"
              texto="Sem ele, as famílias não encontram você."
              onPress={() => navigation.navigate('CuidadorCompletarPerfil')}
            />
          )}
          {perfil.statusVerificacao === 'reprovado' && (
            <Aviso
              tom="vermelho"
              icone="close-circle-outline"
              titulo="Verificação não aprovada"
              onPress={() => navigation.navigate('CuidadorVerificacao')}
            >
              {perfil.motivosReprovacao.map((motivo, i) => (
                <Text key={i} style={[styles.motivo, { color: tons.vermelho.texto }]}>
                  • {motivo}
                </Text>
              ))}
            </Aviso>
          )}
          {perfil.statusVerificacao === 'em_analise' && (
            <Aviso
              tom="azul"
              icone="shield-checkmark-outline"
              titulo="Complete sua verificação"
              texto="Documentos, registro profissional e quiz. Perfis verificados recebem mais pedidos."
              onPress={() => navigation.navigate('CuidadorVerificacao')}
            />
          )}

          {proximo && dia && (
            <View style={styles.secao}>
              <TituloSecao>{proximo.status === 'em_andamento' ? 'Atendimento agora' : 'Próximo atendimento'}</TituloSecao>
              <Cartao>
                <View style={styles.proximoTopo}>
                  <View style={[styles.calendario, { backgroundColor: p.suave }]}>
                    <Text style={[styles.calendarioSemana, { color: p.texto }]}>{dia.semana}</Text>
                    <Text style={[styles.calendarioDia, { color: p.texto }]}>{dia.dia}</Text>
                    <Text style={[styles.calendarioSemana, { color: p.texto }]}>{dia.mes}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.proximoNome}>{proximo.membroNome}</Text>
                    <Text style={estilosUi.textoCorpo}>
                      {proximo.horarioInicio} às {proximo.horarioFim} · {duracaoTexto(proximo.horarioInicio, proximo.horarioFim)}
                    </Text>
                    {proximo.status === 'em_andamento' ? (
                      <Etiqueta texto="Em andamento" tom="azul" icone="play" />
                    ) : proximo.pagamentoConfirmado ? (
                      <Etiqueta texto="Pago pelo membro" tom="verde" icone="checkmark" />
                    ) : (
                      <Etiqueta texto="Aguardando pagamento" tom="laranja" />
                    )}
                  </View>
                </View>
                <Botao
                  area={AREA}
                  variante="contorno"
                  titulo="Ver detalhes do atendimento"
                  onPress={() => navigation.navigate('PedidoDetalhe', { pedidoId: proximo.id })}
                />
              </Cartao>
            </View>
          )}

          <View style={styles.secao}>
            <TituloSecao>Acesso rápido</TituloSecao>
            <View style={styles.atalhos}>
              {atalhos.map((a) => (
                <TouchableOpacity
                  key={a.rotulo}
                  onPress={a.onPress}
                  activeOpacity={0.85}
                  style={[styles.atalho, shadows.suave]}
                  accessibilityRole="button"
                  accessibilityLabel={a.badge ? `${a.rotulo}, ${a.badge} novos` : a.rotulo}
                >
                  {!!a.badge && (
                    <View style={styles.atalhoBadge}>
                      <Text style={styles.atalhoBadgeTexto}>{a.badge}</Text>
                    </View>
                  )}
                  <IconeCirculo icone={a.icone} area={AREA} tamanho={48} />
                  <Text style={styles.atalhoTexto}>{a.rotulo}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Cartao style={styles.cartaoLista}>
            <LinhaLista onPress={() => navigation.navigate('PedidosRecebidos')} rotulo={`Novos pedidos esperando resposta: ${pedidosPendentes}`}>
              <View style={[styles.ponto, { backgroundColor: colors.orange }]} />
              <Text style={styles.linhaTexto}>Novos pedidos esperando resposta</Text>
              <Text style={styles.linhaNumero}>{pedidosPendentes}</Text>
            </LinhaLista>
            <LinhaLista
              ultima={pedidosEmAndamento === 0}
              onPress={() => navigation.navigate('PedidosRecebidos')}
              rotulo={`Atendimentos confirmados: ${pedidosAceitos}`}
            >
              <View style={[styles.ponto, { backgroundColor: colors.success }]} />
              <Text style={styles.linhaTexto}>Atendimentos confirmados</Text>
              <Text style={styles.linhaNumero}>{pedidosAceitos}</Text>
            </LinhaLista>
            {pedidosEmAndamento > 0 && (
              <LinhaLista ultima onPress={() => navigation.navigate('PedidosRecebidos')}>
                <View style={[styles.ponto, { backgroundColor: colors.blueLight }]} />
                <Text style={styles.linhaTexto}>Em andamento agora</Text>
                <Text style={styles.linhaNumero}>{pedidosEmAndamento}</Text>
              </LinhaLista>
            )}
          </Cartao>

          <View style={styles.secao}>
            <TituloSecao>Seus documentos</TituloSecao>
            <Cartao style={styles.cartaoLista}>
              <LinhaDocumento label="RG" status={perfil.documentos.rg} ultima={false} />
              <LinhaDocumento
                label="Comprovante de endereço"
                status={perfil.documentos.comprovanteEndereco}
                ultima={perfil.categoria === 'cuidador'}
              />
              {perfil.categoria !== 'cuidador' && (
                <LinhaDocumento label="Carteira do conselho" status={perfil.documentos.carteiraConselho} ultima />
              )}
            </Cartao>
          </View>

          {/* Das contratações REAIS (aceitas, em andamento, concluídas). Tocar abre o pedido, que
              tem a ficha de saúde verdadeira vinda do perfil do membro. Antes era uma lista
              inventada (data/pacientes.ts, apagado em 2026-09-30). */}
          {pessoasAtendidas.length > 0 && (
            <View style={styles.secao}>
              <TituloSecao>Pessoas que você atende</TituloSecao>
              {pessoasAtendidas.map((pessoa) => (
                <Cartao
                  key={pessoa.membroId}
                  onPress={() => navigation.navigate('PedidoDetalhe', { pedidoId: pessoa.pedidoParaAbrir.id })}
                  rotulo={`Atendimento e ficha de ${pessoa.nome}`}
                >
                  <View style={styles.pacienteTopo}>
                    {/* Foto e idade do membro vêm do servidor junto com os pedidos (2026-09-30). */}
                    <FotoPessoa foto={pessoa.foto} nome={pessoa.nome} area="membro" tamanho={56} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.proximoNome}>{pessoa.nome}</Text>
                      {pessoa.idade != null && <Text style={estilosUi.textoApoio}>{pessoa.idade} anos</Text>}
                      <Text style={estilosUi.textoApoio}>
                        {pessoa.proximo
                          ? pessoa.proximo.status === 'em_andamento'
                            ? 'Atendimento acontecendo agora'
                            : `Próximo: ${diaCurto(pessoa.proximo.data)} · ${pessoa.proximo.horarioInicio} às ${pessoa.proximo.horarioFim}`
                          : 'Sem atendimento marcado'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color={colors.gray400} />
                  </View>
                  {pessoa.atendimentosConcluidos > 0 && (
                    <Etiqueta
                      texto={`${pessoa.atendimentosConcluidos} ${pessoa.atendimentosConcluidos === 1 ? 'atendimento concluído' : 'atendimentos concluídos'}`}
                      tom="cinza"
                      icone="checkmark"
                    />
                  )}
                  {!!pessoa.ultimaAvaliacaoFeita && !pessoa.pedidoParaAvaliar && (
                    <View style={styles.nota} accessibilityLabel={`Você avaliou com ${pessoa.ultimaAvaliacaoFeita.nota} estrelas`}>
                      <Text style={estilosUi.textoApoio}>Você avaliou: </Text>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Ionicons key={n} name={n <= pessoa.ultimaAvaliacaoFeita!.nota ? 'star' : 'star-outline'} size={16} color={colors.yellow} />
                      ))}
                    </View>
                  )}
                  <View style={styles.pacienteAcoes}>
                    {/* Os dois botões com a mesma largura, ícone e texto centralizados; estrela
                        amarela (pedido do usuário em 2026-09-30). Avaliar só existe para
                        atendimento CONCLUÍDO ainda não avaliado — a avaliação vai para o servidor e
                        o membro vê. */}
                    {!!pessoa.pedidoParaAvaliar && (
                      <Botao
                        area={AREA}
                        variante="contorno"
                        titulo="Avaliar família"
                        icone="star"
                        corIcone={colors.yellow}
                        iconeAntes
                        style={{ flex: 1 }}
                        onPress={() => {
                          setNotaFamilia(5);
                          setComentarioFamilia('');
                          setModalAvaliarVisivel(pessoa.pedidoParaAvaliar!.id);
                        }}
                      />
                    )}
                    <Botao
                      area={AREA}
                      variante="perigo"
                      titulo="Denunciar"
                      icone="flag-outline"
                      iconeAntes
                      style={{ flex: 1 }}
                      onPress={() =>
                        navigation.navigate('Denuncia', {
                          tipo: 'cuidador_para_membro',
                          alvoId: pessoa.membroId,
                          alvoNome: pessoa.nome,
                        })
                      }
                    />
                  </View>
                </Cartao>
              ))}
            </View>
          )}

          {avaliacoesRecebidas.length > 0 && (
            <View style={styles.secao}>
              <TituloSecao
                direita={
                  <View style={styles.nota}>
                    <Ionicons name="star" size={18} color={colors.yellow} />
                    <Text style={styles.notaTexto}>{mediaRecebida.toFixed(1)}</Text>
                    <Text style={estilosUi.textoApoio}>({avaliacoesRecebidas.length})</Text>
                  </View>
                }
              >
                Avaliações recebidas
              </TituloSecao>
              <Cartao style={styles.cartaoLista}>
                {avaliacoesRecebidas.map((avaliacao, i) => (
                  <LinhaLista key={avaliacao.id} ultima={i === avaliacoesRecebidas.length - 1}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.nota}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Ionicons key={n} name={n <= avaliacao.nota ? 'star' : 'star-outline'} size={16} color={colors.yellow} />
                        ))}
                        <Text style={[estilosUi.textoApoio, { marginLeft: 6 }]}>{avaliacao.familiaNome}</Text>
                      </View>
                      <Text style={estilosUi.textoCorpo}>{avaliacao.comentario}</Text>
                    </View>
                  </LinhaLista>
                ))}
              </Cartao>
            </View>
          )}

          {/* Status real do compartilhamento de localização (era o cartão "Modo teste" da visita
              sol-1). Só aparece depois que o aviso de atendimento chega. */}
          {statusAvisoTeste !== 'aguardando' && (
            <Cartao>
              <View style={styles.testeTopo}>
                <Ionicons name="navigate-circle-outline" size={22} color={paletas[AREA].principal} />
                <Text style={styles.testeTitulo}>Sua localização para a família</Text>
              </View>
              <Etiqueta texto={labelStatusAvisoTeste[statusAvisoTeste]} tom={tomStatusAvisoTeste[statusAvisoTeste]} />
              {!!detalheAvisoTeste && <Text style={estilosUi.textoApoio}>{detalheAvisoTeste}</Text>}
            </Cartao>
          )}

          <View style={styles.secao}>
            <TituloSecao>Termos e privacidade</TituloSecao>
            <ListaTermos ids={TERMOS_DO_CUIDADOR} area={AREA} />
          </View>

          <Botao area={AREA} variante="textoPerigo" titulo="Sair da conta" icone="log-out-outline" iconeAntes onPress={sairDaConta} />
        </View>
      </ScrollView>

      <Modal
        visible={modalAvaliarVisivel !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalAvaliarVisivel(null)}
      >
        <KeyboardAvoidingView style={styles.modalFundo} behavior={COMPORTAMENTO_TECLADO}>
          <View style={[styles.modalFolha, shadows.modal]}>
            <Text style={styles.modalTitulo}>Avaliar família</Text>
            <View style={styles.estrelas}>
              {[1, 2, 3, 4, 5].map((estrela) => (
                <TouchableOpacity
                  key={estrela}
                  onPress={() => setNotaFamilia(estrela)}
                  style={styles.estrela}
                  accessibilityRole="button"
                  accessibilityLabel={`${estrela} ${estrela === 1 ? 'estrela' : 'estrelas'}`}
                  accessibilityState={{ selected: estrela === notaFamilia }}
                >
                  <Ionicons name={estrela <= notaFamilia ? 'star' : 'star-outline'} size={36} color={colors.yellow} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.campo}
              value={comentarioFamilia}
              onChangeText={setComentarioFamilia}
              placeholder="Deixe um comentário (opcional)"
              placeholderTextColor={colors.textLight}
              multiline
            />
            <View style={styles.modalAcoes}>
              <Botao area={AREA} variante="contorno" titulo="Cancelar" style={{ flex: 1 }} onPress={() => setModalAvaliarVisivel(null)} />
              <Botao
                area={AREA}
                titulo="Enviar"
                style={{ flex: 1 }}
                onPress={async () => {
                  if (!modalAvaliarVisivel) return;
                  // Vai para o servidor e o membro vê (2026-09-30). Se falhar, avisa e mantém a janela.
                  try {
                    await avaliarFamilia(modalAvaliarVisivel, notaFamilia, comentarioFamilia);
                    setModalAvaliarVisivel(null);
                    await dialogo.avisar({ titulo: 'Avaliação enviada', mensagem: 'A família já pode ver a sua avaliação.', tom: 'sucesso' });
                  } catch (e) {
                    await dialogo.avisar({
                      titulo: 'Não foi possível enviar',
                      mensagem: e instanceof Error ? e.message : 'Tente novamente em instantes.',
                      tom: 'perigo',
                    });
                  }
                }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function LinhaDocumento({ label, status, ultima }: { label: string; status: StatusDocumento; ultima: boolean }) {
  const info = documentoStatus[status];
  return (
    <LinhaLista ultima={ultima}>
      <Text style={styles.linhaTexto}>{label}</Text>
      <Etiqueta texto={info.texto} tom={info.tom} icone={status === 'aprovado' ? 'checkmark' : undefined} />
    </LinhaLista>
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
  verificado: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 12,
  },
  verificadoTexto: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  rotuloSaldo: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray600 },
  saldo: { fontSize: fontSize.display, fontWeight: fontWeight.extrabold, letterSpacing: -0.5 },
  motivo: { fontSize: fontSize.sm, lineHeight: 20 },
  secao: { gap: 12 },
  proximoTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  calendario: { width: 60, height: 68, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calendarioSemana: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  calendarioDia: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, lineHeight: 26 },
  proximoNome: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.text },
  atalhos: { flexDirection: 'row', gap: 12 },
  atalho: {
    flex: 1,
    minHeight: 108,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  atalhoTexto: { fontSize: 15, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
  atalhoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoBadgeTexto: { color: colors.white, fontSize: 12, fontWeight: fontWeight.extrabold },
  cartaoLista: { gap: 0, paddingVertical: 6, paddingHorizontal: 18 },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  linhaTexto: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  linhaNumero: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.text },
  pacienteTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pacienteAcoes: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notaTexto: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold, color: colors.text },
  testeCartao: { borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', gap: 10 },
  testeTopo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  testeTitulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.gray700 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end' },
  modalFolha: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12 },
  modalTitulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text },
  estrelas: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  estrela: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  campo: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    fontSize: fontSize.md,
    color: colors.text,
    textAlignVertical: 'top',
  },
  modalAcoes: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
