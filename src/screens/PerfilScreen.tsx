import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDialogo } from '../components/Dialogo';
import { FotoPessoa } from '../components/FotoPessoa';
import { ListaTermos } from '../components/ListaTermos';
import { SeletorHorario } from '../components/SeletorHorario';
import { TERMOS_DO_MEMBRO } from '../data/termos';
import { useTrocarFotoPerfil } from '../components/TrocarFotoPerfil';
import {
  Aviso,
  Botao,
  CabecalhoHero,
  Campo,
  Cartao,
  Etiqueta,
  FolhaInferior,
  IconeCirculo,
  LinhaLista,
  TituloSecao,
  estilosUi,
  sobrepor,
} from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import {
  statusSolicitacaoLabels,
  statusSolicitacaoTons,
  useApp,
  type ContatoEmergencia,
  type Medicamento,
} from '../contexts/AppContext';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { useRecarregarAoFocar } from '../hooks/useRecarregarAoFocar';
import { colors, fontSize, fontWeight, paletas, shadows, tons } from '../theme';
import { faixaHorario } from '../utils/atendimento';
import { ligarPara } from '../utils/linking';
import type { PerfilSecao, RootStackScreenProps } from '../navigation/types';

// Meu Perfil do membro — refeito no visual novo em 2026-09-30 (kit ui.tsx, área azul), a pedido do
// usuário ("está fora do design"). Tudo de saúde é salvo NO SERVIDOR e é o que o cuidador vê na
// Ficha de saúde do pedido (condições, alergias, medicamentos, contatos).
const AREA = 'membro' as const;
const SOBREPOSICAO = 56;

export function PerfilScreen({ navigation, route }: RootStackScreenProps<'Perfil'>) {
  const {
    dadosPessoais,
    atualizarDadosPessoais,
    medicamentos,
    adicionarMedicamento,
    editarMedicamento,
    removerMedicamento,
    toggleMedicamentoAtivo,
    condicoesMedicas,
    adicionarCondicaoMedica,
    removerCondicaoMedica,
    alergias,
    adicionarAlergia,
    removerAlergia,
    contatosEmergencia,
    adicionarContatoEmergencia,
    editarContatoEmergencia,
    removerContatoEmergencia,
    definirContatoPrincipal,
    solicitacoes,
    cancelarSolicitacao,
    avaliarSolicitacao,
    preferencias,
    atualizarPreferencias,
    recarregarSolicitacoes,
  } = useApp();
  const { sair: sairAuth, usuario } = useAuth();
  const dialogo = useDialogo();
  const p = paletas[AREA];
  const trocarFoto = useTrocarFotoPerfil({
    area: AREA,
    mensagemSucesso: 'Sua nova foto já aparece no seu perfil e para o cuidador que for atender você.',
  });
  useRecarregarAoFocar(recarregarSolicitacoes);

  // A Home abre o perfil já numa seção (ex.: "medicamentos" pelo lembrete de remédio).
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<PerfilSecao, number>>>({});
  const registrarOffset = (secao: PerfilSecao) => (event: LayoutChangeEvent) => {
    offsets.current[secao] = event.nativeEvent.layout.y;
  };
  useEffect(() => {
    const secao = route.params?.secao;
    if (!secao) return;
    const t = setTimeout(() => {
      const y = offsets.current[secao];
      if (y !== undefined) scrollRef.current?.scrollTo({ y: y + 180, animated: true });
    }, 300);
    return () => clearTimeout(t);
  }, [route.params?.secao]);

  // Tudo de saúde/endereço é salvo no SERVIDOR (é o que o cuidador vê na ficha). Se falhar, avisa.
  const salvarNoServidor = async (acao: () => Promise<void>): Promise<boolean> => {
    try {
      await acao();
      return true;
    } catch (e) {
      await dialogo.avisar({
        titulo: 'Não foi possível salvar',
        mensagem: `${e instanceof Error ? e.message : 'Falha de conexão'}. Confira a internet e tente de novo.`,
        tom: 'perigo',
      });
      return false;
    }
  };

  // ---- Dados pessoais ----
  const [folhaDados, setFolhaDados] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formIdade, setFormIdade] = useState('');
  const abrirDados = () => {
    setFormNome(dadosPessoais.nome);
    setFormTelefone(dadosPessoais.telefone);
    setFormEndereco(dadosPessoais.endereco);
    setFormIdade(dadosPessoais.idade ? String(dadosPessoais.idade) : '');
    setFolhaDados(true);
  };
  const salvarDados = async () => {
    const idade = Number(formIdade.replace(/\D/g, '')) || 0;
    const ok = await salvarNoServidor(() =>
      atualizarDadosPessoais({ nome: formNome, telefone: formTelefone, endereco: formEndereco, idade })
    );
    if (ok) setFolhaDados(false);
  };

  // ---- Condições e alergias ----
  const [novaCondicao, setNovaCondicao] = useState('');
  const [novaAlergia, setNovaAlergia] = useState('');

  const confirmarRemocao = (titulo: string, mensagem: string) =>
    dialogo.confirmar({ titulo, mensagem, icone: 'trash-outline', tom: 'perigo', confirmar: 'Remover' });

  // ---- Medicamentos ----
  const [folhaMedicamento, setFolhaMedicamento] = useState(false);
  const [medEditando, setMedEditando] = useState<Medicamento | null>(null);
  const [medNome, setMedNome] = useState('');
  const [medDosagem, setMedDosagem] = useState('');
  const [medHorarios, setMedHorarios] = useState<string[]>([]);
  const abrirMedicamento = (m: Medicamento | null) => {
    setMedEditando(m);
    setMedNome(m?.nome ?? '');
    setMedDosagem(m?.dosagem ?? '');
    setMedHorarios(m?.horarios ?? []);
    setFolhaMedicamento(true);
  };
  const salvarMedicamento = async () => {
    const horarios = [...medHorarios].sort();
    const ok = await salvarNoServidor(() =>
      medEditando
        ? editarMedicamento(medEditando.id, { nome: medNome, dosagem: medDosagem, horarios })
        : adicionarMedicamento({ nome: medNome, dosagem: medDosagem, horarios, ativo: true })
    );
    if (ok) setFolhaMedicamento(false);
  };

  // ---- Contatos de emergência ----
  const [folhaContato, setFolhaContato] = useState(false);
  const [contatoEditando, setContatoEditando] = useState<ContatoEmergencia | null>(null);
  const [contNome, setContNome] = useState('');
  const [contRelacao, setContRelacao] = useState('');
  const [contTelefone, setContTelefone] = useState('');
  const abrirContato = (c: ContatoEmergencia | null) => {
    setContatoEditando(c);
    setContNome(c?.nome ?? '');
    setContRelacao(c?.relacao ?? '');
    setContTelefone(c?.telefone ?? '');
    setFolhaContato(true);
  };
  const salvarContato = async () => {
    const ok = await salvarNoServidor(() =>
      contatoEditando
        ? editarContatoEmergencia(contatoEditando.id, { nome: contNome, relacao: contRelacao, telefone: contTelefone })
        : adicionarContatoEmergencia({ nome: contNome, relacao: contRelacao, telefone: contTelefone, principal: false })
    );
    if (ok) setFolhaContato(false);
  };

  // ---- Avaliação do cuidador (⚠️ ainda só no aparelho — sem servidor de avaliações) ----
  const [avaliandoId, setAvaliandoId] = useState<string | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');

  const sair = async () => {
    const confirmado = await dialogo.confirmar({
      titulo: 'Sair da conta',
      mensagem: 'Você vai precisar entrar de novo com seu e-mail e senha.',
      icone: 'log-out-outline',
      tom: 'perigo',
      confirmar: 'Sair',
    });
    if (!confirmado) return;
    await sairAuth();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={estilosUi.tela}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <CabecalhoHero
          area={AREA}
          titulo="Meu perfil"
          subtitulo="Suas informações e sua ficha de saúde"
          onVoltar={() => navigation.goBack()}
          voltarRotulo="Início"
          espacoInferior={SOBREPOSICAO}
        />

        <View style={[estilosUi.miolo, conteudoCentralizado, sobrepor(SOBREPOSICAO), { gap: 24 }]}>
          {/* Foto e identidade */}
          <Cartao destaque>
            <View style={styles.identidade}>
              <FotoPessoa foto={usuario?.fotoPerfil} nome={dadosPessoais.nome} area={AREA} tamanho={76} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.nome}>{dadosPessoais.nome}</Text>
                <Text style={estilosUi.textoApoio}>{dadosPessoais.email}</Text>
                {dadosPessoais.documentoStatus === 'verificado' ? (
                  <Etiqueta texto="Verificado" tom="verde" icone="checkmark" />
                ) : (
                  <Etiqueta texto="Documento em análise" tom="laranja" icone="time-outline" />
                )}
              </View>
            </View>
            <Text style={estilosUi.textoApoio}>
              Use uma foto clara, de frente, com o rosto visível — é assim que o cuidador reconhece você.
            </Text>
            <View style={styles.linhaBotoes}>
              <Botao area={AREA} variante="contorno" titulo="Tirar foto" icone="camera-outline" iconeAntes onPress={trocarFoto.abrirCamera} style={{ flex: 1 }} />
              <Botao area={AREA} variante="contorno" titulo="Da galeria" icone="images-outline" iconeAntes onPress={trocarFoto.abrirGaleria} style={{ flex: 1 }} />
            </View>
          </Cartao>

          {/* Dados pessoais */}
          <View style={styles.secao} onLayout={registrarOffset('dadosPessoais')}>
            <TituloSecao>Dados pessoais</TituloSecao>
            <Cartao style={styles.cartaoLista}>
              <Linha rotulo="Nome" valor={dadosPessoais.nome} />
              <Linha rotulo="Idade" valor={dadosPessoais.idade ? `${dadosPessoais.idade} anos` : 'Não informada'} />
              <Linha rotulo="Telefone" valor={dadosPessoais.telefone} />
              <Linha rotulo="Endereço" valor={dadosPessoais.endereco || 'Não informado'} />
              <Linha rotulo="CPF" valor={dadosPessoais.cpf || 'Não informado'} ultima />
            </Cartao>
            <Botao area={AREA} variante="contorno" titulo="Editar dados" icone="create-outline" iconeAntes onPress={abrirDados} />
          </View>

          {/* Ficha de saúde */}
          <Aviso
            tom="azul"
            icone="shield-checkmark-outline"
            titulo="Sua ficha de saúde"
            texto="O cuidador vê estas informações quando recebe o seu pedido. Mantenha tudo atualizado."
          />

          <View style={styles.secao} onLayout={registrarOffset('condicoes')}>
            <TituloSecao>Condições médicas</TituloSecao>
            <Cartao>
              {condicoesMedicas.length === 0 ? (
                <Text style={estilosUi.textoApoio}>Nenhuma condição informada.</Text>
              ) : (
                <View style={styles.pilulas}>
                  {condicoesMedicas.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.pilula, { backgroundColor: tons.azul.fundo }]}
                      onPress={async () => {
                        if (await confirmarRemocao('Remover condição', `"${c.nome}" sairá da sua ficha de saúde.`)) {
                          await salvarNoServidor(() => removerCondicaoMedica(c.id));
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${c.nome}. Toque para remover`}
                    >
                      <Text style={[styles.pilulaTexto, { color: tons.azul.forte }]}>{c.nome}</Text>
                      <Ionicons name="close" size={16} color={tons.azul.forte} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <AdicionarItem
                area={AREA}
                valor={novaCondicao}
                onMudar={setNovaCondicao}
                placeholder="Ex.: Hipertensão, diabetes"
                rotulo="Adicionar condição"
                onAdicionar={async () => {
                  const nome = novaCondicao.trim();
                  if (nome && (await salvarNoServidor(() => adicionarCondicaoMedica(nome)))) setNovaCondicao('');
                }}
              />
            </Cartao>
          </View>

          <View style={styles.secao}>
            <TituloSecao>Alergias</TituloSecao>
            <Cartao>
              {alergias.length === 0 ? (
                <Text style={estilosUi.textoApoio}>Nenhuma alergia informada.</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {alergias.map((a) => (
                    <View key={a} style={styles.alergia}>
                      <Ionicons name="warning-outline" size={20} color={tons.vermelho.forte} />
                      <Text style={styles.alergiaTexto}>{a}</Text>
                      <TouchableOpacity
                        onPress={async () => {
                          if (await confirmarRemocao('Remover alergia', `"${a}" sairá da sua ficha de saúde.`)) {
                            await salvarNoServidor(() => removerAlergia(a));
                          }
                        }}
                        style={styles.iconeAcao}
                        accessibilityRole="button"
                        accessibilityLabel={`Remover alergia ${a}`}
                      >
                        <Ionicons name="trash-outline" size={20} color={tons.vermelho.forte} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <AdicionarItem
                area={AREA}
                valor={novaAlergia}
                onMudar={setNovaAlergia}
                placeholder="Ex.: Dipirona, frutos do mar"
                rotulo="Adicionar alergia"
                onAdicionar={async () => {
                  const nome = novaAlergia.trim();
                  if (nome && (await salvarNoServidor(() => adicionarAlergia(nome)))) setNovaAlergia('');
                }}
              />
            </Cartao>
          </View>

          <View style={styles.secao} onLayout={registrarOffset('medicamentos')}>
            <TituloSecao>Medicamentos e horários</TituloSecao>
            <Cartao style={medicamentos.length > 0 ? styles.cartaoLista : undefined}>
              {medicamentos.length === 0 ? (
                <Text style={estilosUi.textoApoio}>Nenhum medicamento cadastrado.</Text>
              ) : (
                medicamentos.map((m, i) => (
                  <LinhaLista key={m.id} ultima={i === medicamentos.length - 1} onPress={() => abrirMedicamento(m)} rotulo={`Editar ${m.nome}`}>
                    <IconeCirculo icone="medkit-outline" tom="roxo" tamanho={40} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.itemTitulo, !m.ativo && { color: colors.gray400 }]}>
                        {m.nome} {m.dosagem}
                      </Text>
                      <Text style={estilosUi.textoApoio}>{m.horarios.length ? m.horarios.join(' · ') : 'Sem horário'}</Text>
                    </View>
                    <Switch
                      value={m.ativo}
                      onValueChange={() => void salvarNoServidor(() => toggleMedicamentoAtivo(m.id))}
                      trackColor={{ true: p.claro, false: colors.gray300 }}
                      thumbColor={colors.white}
                      accessibilityLabel={m.ativo ? `${m.nome} ativo` : `${m.nome} pausado`}
                    />
                  </LinhaLista>
                ))
              )}
            </Cartao>
            <Botao area={AREA} variante="contorno" titulo="Adicionar medicamento" icone="add" iconeAntes onPress={() => abrirMedicamento(null)} />
          </View>

          <View style={styles.secao} onLayout={registrarOffset('contatos')}>
            <TituloSecao>Contatos de emergência</TituloSecao>
            {contatosEmergencia.length === 0 ? (
              <Cartao>
                <Text style={estilosUi.textoApoio}>
                  Nenhum contato cadastrado. O botão SOS da tela inicial liga para o contato principal.
                </Text>
              </Cartao>
            ) : (
              contatosEmergencia.map((c) => (
                <Cartao key={c.id} onPress={() => abrirContato(c)} rotulo={`Editar contato ${c.nome}`}>
                  <View style={styles.contatoLinha}>
                    <IconeCirculo icone="person-outline" area={AREA} tamanho={44} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.itemTitulo}>{c.nome}</Text>
                      <Text style={estilosUi.textoApoio}>
                        {c.relacao} · {c.telefone}
                      </Text>
                      {c.principal && <Etiqueta texto="Principal · SOS" tom="laranja" icone="star" />}
                    </View>
                    <TouchableOpacity
                      style={[styles.ligar, { backgroundColor: p.principal }]}
                      onPress={() => ligarPara(c.telefone)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ligar para ${c.nome}`}
                    >
                      <Ionicons name="call" size={22} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </Cartao>
              ))
            )}
            <Botao area={AREA} variante="contorno" titulo="Adicionar contato" icone="add" iconeAntes onPress={() => abrirContato(null)} />
          </View>

          {/* Cuidadores solicitados */}
          <View style={styles.secao} onLayout={registrarOffset('cuidadoresSolicitados')}>
            <TituloSecao>Cuidadores solicitados</TituloSecao>
            {solicitacoes.length === 0 ? (
              <Cartao>
                <Text style={estilosUi.textoApoio}>Nenhuma solicitação até o momento.</Text>
              </Cartao>
            ) : (
              solicitacoes.map((s) => (
                <Cartao key={s.id}>
                  <View style={styles.contatoLinha}>
                    <FotoPessoa foto={s.cuidadorFoto} nome={s.cuidadorNome} area={AREA} tamanho={52} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.itemTitulo}>{s.cuidadorNome}</Text>
                      <Text style={estilosUi.textoApoio}>
                        {s.dataPreferida} · {faixaHorario(s.horarioInicio, s.horarioFim)}
                      </Text>
                      <Etiqueta texto={statusSolicitacaoLabels[s.status]} tom={statusSolicitacaoTons[s.status]} />
                    </View>
                  </View>
                  {s.statusPagamento === 'pendente' && (
                    <Botao area={AREA} titulo="Pagar o atendimento" icone="card-outline" iconeAntes onPress={() => navigation.navigate('PagarConsulta', { solicitacaoId: s.id })} />
                  )}
                  {s.statusPagamento === 'pago' && s.status === 'aceita' && (
                    <Etiqueta texto="Pagamento confirmado" tom="verde" icone="checkmark" />
                  )}
                  {(s.status === 'aceita' || s.status === 'em_andamento') && (
                    <Botao area={AREA} variante="contorno" titulo="Acompanhar no mapa" icone="map-outline" iconeAntes onPress={() => navigation.navigate('AcompanharCuidador', { solicitacaoId: s.id })} />
                  )}
                  {/* Avaliações das duas pontas, vindas do servidor (2026-09-30). */}
                  {!!s.avaliacao && <AvaliacaoVista titulo="Sua avaliação do cuidador" avaliacao={s.avaliacao} />}
                  {!!s.avaliacaoRecebida && <AvaliacaoVista titulo="O cuidador avaliou você" avaliacao={s.avaliacaoRecebida} />}
                  {s.status === 'concluida' && !s.avaliacao && (
                    <Botao
                      area={AREA}
                      variante="contorno"
                      titulo="Avaliar o cuidador"
                      icone="star"
                      corIcone={colors.yellow}
                      iconeAntes
                      onPress={() => {
                        setNota(5);
                        setComentario('');
                        setAvaliandoId(s.id);
                      }}
                    />
                  )}
                  {s.status === 'pendente' && (
                    <Botao
                      area={AREA}
                      variante="textoPerigo"
                      titulo="Cancelar solicitação"
                      onPress={async () => {
                        const ok = await dialogo.confirmar({
                          titulo: 'Cancelar solicitação',
                          mensagem: `A visita com ${s.cuidadorNome} será cancelada. Se você já pagou, o valor é estornado.`,
                          icone: 'calendar-clear-outline',
                          tom: 'perigo',
                          confirmar: 'Cancelar solicitação',
                          cancelar: 'Voltar',
                        });
                        if (ok) await salvarNoServidor(() => cancelarSolicitacao(s.id));
                      }}
                    />
                  )}
                </Cartao>
              ))
            )}
          </View>

          {/* Preferências (⚠️ ainda só no aparelho — sem servidor) */}
          <View style={styles.secao} onLayout={registrarOffset('preferencias')}>
            <TituloSecao>Preferências e privacidade</TituloSecao>
            <Cartao style={styles.cartaoLista}>
              <Preferencia rotulo="Notificações" valor={preferencias.notificacoes} onMudar={(v) => atualizarPreferencias({ notificacoes: v })} />
              <Preferencia rotulo="Lembretes de remédio" valor={preferencias.lembretes} onMudar={(v) => atualizarPreferencias({ lembretes: v })} />
              <Preferencia rotulo="Localização" valor={preferencias.localizacao} onMudar={(v) => atualizarPreferencias({ localizacao: v })} />
              <Preferencia rotulo="Modo acessível" valor={preferencias.modoAcessivel} onMudar={(v) => atualizarPreferencias({ modoAcessivel: v })} />
              <Preferencia
                rotulo="Consentimento de dados de saúde"
                valor={preferencias.consentimentoSaude}
                onMudar={(v) => atualizarPreferencias({ consentimentoSaude: v })}
                ultima
              />
            </Cartao>
            {!preferencias.consentimentoSaude && (
              <Aviso tom="laranja" icone="warning-outline" texto="Sem o consentimento, alguns serviços de saúde podem ficar indisponíveis." />
            )}
          </View>

          <View style={styles.secao}>
            <TituloSecao>Termos e privacidade</TituloSecao>
            <ListaTermos ids={TERMOS_DO_MEMBRO} area={AREA} />
          </View>

          <Botao area={AREA} variante="textoPerigo" titulo="Sair da conta" icone="log-out-outline" iconeAntes onPress={sair} />
        </View>
      </ScrollView>

      {/* ---- Folhas (formulários) ---- */}
      <FolhaInferior visivel={folhaDados} titulo="Editar dados" onFechar={() => setFolhaDados(false)}>
        <Campo area={AREA} rotulo="Nome" value={formNome} onChangeText={setFormNome} icone="person-outline" />
        <Campo area={AREA} rotulo="Idade" value={formIdade} onChangeText={setFormIdade} keyboardType="number-pad" icone="calendar-outline" />
        <Campo area={AREA} rotulo="Telefone" value={formTelefone} onChangeText={setFormTelefone} keyboardType="phone-pad" icone="call-outline" />
        <Campo
          area={AREA}
          rotulo="Endereço"
          ajuda="Onde o cuidador vai atender você."
          value={formEndereco}
          onChangeText={setFormEndereco}
          icone="home-outline"
          multilinha
        />
        <Botao area={AREA} titulo="Salvar" icone="checkmark" iconeAntes desabilitado={!formNome.trim()} onPress={salvarDados} />
      </FolhaInferior>

      <FolhaInferior
        visivel={folhaMedicamento}
        titulo={medEditando ? 'Editar medicamento' : 'Novo medicamento'}
        onFechar={() => setFolhaMedicamento(false)}
      >
        <Campo area={AREA} rotulo="Nome do remédio" value={medNome} onChangeText={setMedNome} placeholder="Ex.: Losartana" icone="medkit-outline" />
        <Campo area={AREA} rotulo="Dose" value={medDosagem} onChangeText={setMedDosagem} placeholder="Ex.: 50 mg, 1 comprimido" />
        <View style={{ gap: 8 }}>
          <Text style={styles.rotulo}>Horários</Text>
          {medHorarios.length > 0 && (
            <View style={styles.pilulas}>
              {[...medHorarios].sort().map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.pilula, { backgroundColor: tons.roxo.fundo }]}
                  onPress={() => setMedHorarios((lista) => lista.filter((x) => x !== h))}
                  accessibilityRole="button"
                  accessibilityLabel={`${h}. Toque para tirar`}
                >
                  <Text style={[styles.pilulaTexto, { color: tons.roxo.forte }]}>{h}</Text>
                  <Ionicons name="close" size={16} color={tons.roxo.forte} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row' }}>
            <SeletorHorario
              area={AREA}
              rotulo="Adicionar horário"
              valor=""
              desabilitado={(h) => medHorarios.includes(h)}
              onEscolher={(h) => setMedHorarios((lista) => (lista.includes(h) ? lista : [...lista, h]))}
            />
          </View>
        </View>
        <Botao area={AREA} titulo="Salvar" icone="checkmark" iconeAntes desabilitado={!medNome.trim()} onPress={salvarMedicamento} />
        {medEditando && (
          <Botao
            area={AREA}
            variante="textoPerigo"
            titulo="Remover medicamento"
            icone="trash-outline"
            iconeAntes
            onPress={async () => {
              const alvo = medEditando;
              if (await confirmarRemocao('Remover medicamento', `"${alvo.nome}" sairá da sua lista e da sua ficha de saúde.`)) {
                if (await salvarNoServidor(() => removerMedicamento(alvo.id))) setFolhaMedicamento(false);
              }
            }}
          />
        )}
      </FolhaInferior>

      <FolhaInferior visivel={folhaContato} titulo={contatoEditando ? 'Editar contato' : 'Novo contato'} onFechar={() => setFolhaContato(false)}>
        <Campo area={AREA} rotulo="Nome" value={contNome} onChangeText={setContNome} icone="person-outline" />
        <Campo area={AREA} rotulo="Relação" value={contRelacao} onChangeText={setContRelacao} placeholder="Filho, filha, cônjuge..." />
        <Campo area={AREA} rotulo="Telefone" value={contTelefone} onChangeText={setContTelefone} keyboardType="phone-pad" icone="call-outline" />
        <Botao
          area={AREA}
          titulo="Salvar"
          icone="checkmark"
          iconeAntes
          desabilitado={!contNome.trim() || !contTelefone.trim()}
          onPress={salvarContato}
        />
        {contatoEditando && !contatoEditando.principal && (
          <Botao
            area={AREA}
            variante="contorno"
            titulo="Tornar contato principal (SOS)"
            icone="star"
            corIcone={colors.yellow}
            iconeAntes
            onPress={async () => {
              if (await salvarNoServidor(() => definirContatoPrincipal(contatoEditando.id))) setFolhaContato(false);
            }}
          />
        )}
        {contatoEditando && (
          <Botao
            area={AREA}
            variante="textoPerigo"
            titulo="Remover contato"
            icone="trash-outline"
            iconeAntes
            onPress={async () => {
              const alvo = contatoEditando;
              if (await confirmarRemocao('Remover contato', `"${alvo.nome}" deixa de ser um contato de emergência.`)) {
                if (await salvarNoServidor(() => removerContatoEmergencia(alvo.id))) setFolhaContato(false);
              }
            }}
          />
        )}
      </FolhaInferior>

      <FolhaInferior visivel={avaliandoId !== null} titulo="Avaliar o cuidador" onFechar={() => setAvaliandoId(null)}>
        <View style={styles.estrelas}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setNota(n)}
              style={styles.estrela}
              accessibilityRole="button"
              accessibilityLabel={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
              accessibilityState={{ selected: n === nota }}
            >
              <Ionicons name={n <= nota ? 'star' : 'star-outline'} size={38} color={colors.yellow} />
            </TouchableOpacity>
          ))}
        </View>
        <Campo area={AREA} rotulo="Comentário (opcional)" value={comentario} onChangeText={setComentario} multilinha />
        <Botao
          area={AREA}
          titulo="Enviar avaliação"
          icone="send-outline"
          iconeAntes
          onPress={async () => {
            if (!avaliandoId) return;
            // Vai para o servidor: o cuidador vê a avaliação e ela entra na nota dele (2026-09-30).
            if (await salvarNoServidor(() => avaliarSolicitacao(avaliandoId, { nota, comentario }))) {
              setAvaliandoId(null);
              await dialogo.avisar({ titulo: 'Avaliação enviada', mensagem: 'Obrigado! O cuidador já pode ver a sua avaliação.', tom: 'sucesso' });
            }
          }}
        />
      </FolhaInferior>

      {trocarFoto.modal}
    </View>
  );
}

function AvaliacaoVista({ titulo, avaliacao }: { titulo: string; avaliacao: { nota: number; comentario: string } }) {
  return (
    <View style={styles.avaliacao} accessibilityLabel={`${titulo}: ${avaliacao.nota} de 5 estrelas. ${avaliacao.comentario}`}>
      <Text style={estilosUi.rotuloCampo}>{titulo}</Text>
      <View style={styles.estrelasPequenas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Ionicons key={n} name={n <= avaliacao.nota ? 'star' : 'star-outline'} size={20} color={colors.yellow} />
        ))}
      </View>
      {!!avaliacao.comentario && <Text style={estilosUi.textoCorpo}>“{avaliacao.comentario}”</Text>}
    </View>
  );
}

function Linha({ rotulo, valor, ultima }: { rotulo: string; valor: string; ultima?: boolean }) {
  return (
    <LinhaLista ultima={ultima}>
      <Text style={styles.linhaRotulo}>{rotulo}</Text>
      <Text style={styles.linhaValor}>{valor}</Text>
    </LinhaLista>
  );
}

function Preferencia({ rotulo, valor, onMudar, ultima }: { rotulo: string; valor: boolean; onMudar: (v: boolean) => void; ultima?: boolean }) {
  return (
    <LinhaLista ultima={ultima}>
      <Text style={[styles.itemTitulo, { flex: 1 }]}>{rotulo}</Text>
      <Switch
        value={valor}
        onValueChange={onMudar}
        trackColor={{ true: paletas[AREA].claro, false: colors.gray300 }}
        thumbColor={colors.white}
        accessibilityLabel={rotulo}
      />
    </LinhaLista>
  );
}

// Campo + botão "+" para adicionar um item curto (condição, alergia).
function AdicionarItem({
  area,
  valor,
  onMudar,
  placeholder,
  rotulo,
  onAdicionar,
}: {
  area: typeof AREA;
  valor: string;
  onMudar: (v: string) => void;
  placeholder: string;
  rotulo: string;
  onAdicionar: () => void;
}) {
  const p = paletas[area];
  return (
    <View style={styles.adicionar}>
      <TextInput
        style={styles.adicionarCampo}
        value={valor}
        onChangeText={onMudar}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        onSubmitEditing={onAdicionar}
        returnKeyType="done"
        accessibilityLabel={rotulo}
      />
      <TouchableOpacity
        style={[styles.adicionarBotao, { backgroundColor: p.principal }, !valor.trim() && { opacity: 0.45 }]}
        onPress={onAdicionar}
        disabled={!valor.trim()}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
      >
        <Ionicons name="add" size={26} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { gap: 12 },
  identidade: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nome: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.text },
  linhaBotoes: { flexDirection: 'row', gap: 12 },
  cartaoLista: { gap: 0, paddingVertical: 6, paddingHorizontal: 18 },
  linhaRotulo: { width: 92, fontSize: fontSize.md, color: colors.gray600 },
  linhaValor: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  itemTitulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  rotulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  pilulas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilula: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, minHeight: 40 },
  pilulaTexto: { fontSize: 15, fontWeight: fontWeight.bold },
  alergia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: tons.vermelho.fundo,
    borderRadius: 14,
    paddingLeft: 12,
    minHeight: 48,
  },
  alergiaTexto: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: tons.vermelho.texto },
  iconeAcao: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  adicionar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adicionarCampo: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.white,
  },
  adicionarBotao: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...shadows.suave },
  contatoLinha: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ligar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  estrelas: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  estrelasPequenas: { flexDirection: 'row', gap: 2 },
  avaliacao: { backgroundColor: colors.gray50, borderRadius: 16, padding: 12, gap: 6 },
  estrela: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
