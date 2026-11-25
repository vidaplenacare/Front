import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { categorias, type CategoriaProfissional } from './CuidadorCadastroScreen';
import {
  Aviso,
  Botao,
  CaixaMarcar,
  Campo,
  Cartao,
  Etiqueta,
  IconeCirculo,
  LinhaLista,
  OpcaoEscolha,
  RodapeFixo,
  TituloSecao,
  estilosUi,
} from '../components/ui';
import { WizardHeader } from '../components/WizardHeader';
import { CapturaSelfie } from '../components/CapturaSelfie';
import { FotoPessoa } from '../components/FotoPessoa';
import { useAuth } from '../contexts/AuthContext';
import { enviarCadastroCuidador, type TipoDocumentoCadastroApi } from '../services/api';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { colors, fontSize, fontWeight, paletas, tons } from '../theme';
import { maskCpf } from '../utils/masks';
import type { RootStackScreenProps } from '../navigation/types';

const AREA = 'cuidador' as const;
const TITULOS_ETAPA = ['Documentos', 'Recebimento', 'Avaliação', 'Confirmação'];

interface QuizOpcao {
  id: string;
  texto: string;
}

interface QuizQuestao {
  id: string;
  pergunta: string;
  opcoes: QuizOpcao[];
  respostaCorretaId: string;
}

// Bancos de perguntas do quiz de aptidão, por categoria profissional.
const quizCuidador: QuizQuestao[] = [
  {
    id: 'cuidador-1',
    pergunta: 'Você está autorizado a aplicar injeções ou administrar medicação por via endovenosa?',
    opcoes: [
      { id: 'a', texto: 'Sim' },
      { id: 'b', texto: 'Não' },
    ],
    respostaCorretaId: 'b',
  },
  {
    id: 'cuidador-2',
    pergunta: 'O idoso apresenta falta de ar súbita. Qual a ação correta?',
    opcoes: [
      { id: 'a', texto: 'Administrar medicação por conta própria' },
      { id: 'b', texto: 'Acionar o enfermeiro responsável ou o serviço de emergência (192) e manter a calma' },
    ],
    respostaCorretaId: 'b',
  },
  {
    id: 'cuidador-3',
    pergunta: 'Você pode trocar curativos em feridas abertas ou realizar procedimentos invasivos?',
    opcoes: [
      { id: 'a', texto: 'Sim, se achar necessário' },
      { id: 'b', texto: 'Não' },
    ],
    respostaCorretaId: 'b',
  },
  {
    id: 'cuidador-4',
    pergunta: 'Você pode ajustar a dose de um medicamento sem orientação de um profissional de saúde?',
    opcoes: [
      { id: 'a', texto: 'Sim, em casos de urgência' },
      { id: 'b', texto: 'Não, nunca' },
    ],
    respostaCorretaId: 'b',
  },
  {
    id: 'cuidador-5',
    pergunta: 'Qual destas atividades está dentro do seu papel como cuidador?',
    opcoes: [
      { id: 'a', texto: 'Auxiliar na higiene, alimentação e mobilidade' },
      { id: 'b', texto: 'Prescrever tratamento' },
      { id: 'c', texto: 'Aplicar soro' },
    ],
    respostaCorretaId: 'a',
  },
  {
    id: 'cuidador-6',
    pergunta: 'A família pede para você pular a administração de um remédio prescrito. O que fazer?',
    opcoes: [
      { id: 'a', texto: 'Seguir a orientação da família' },
      {
        id: 'b',
        texto: 'Explicar a importância da prescrição e orientar a buscar o profissional de saúde responsável antes de qualquer alteração',
      },
    ],
    respostaCorretaId: 'b',
  },
];

const quizTecnicoEnfermeiro: QuizQuestao[] = [
  {
    id: 'tecnico-1',
    pergunta: 'Como técnico(a) de enfermagem, você pode prescrever cuidados de enfermagem de forma independente?',
    opcoes: [
      { id: 'a', texto: 'Sim' },
      { id: 'b', texto: 'Não, é atribuição exclusiva do enfermeiro' },
    ],
    respostaCorretaId: 'b',
  },
  {
    id: 'tecnico-2',
    pergunta: 'Diante de alteração significativa nos sinais vitais do paciente, qual a conduta correta?',
    opcoes: [
      { id: 'a', texto: 'Registrar e comunicar imediatamente ao enfermeiro/médico responsável' },
      { id: 'b', texto: 'Aguardar para ver se piora' },
    ],
    respostaCorretaId: 'a',
  },
  {
    id: 'tecnico-3',
    pergunta:
      'É permitido administrar medicação sem conferir a prescrição e os "6 certos" (paciente, medicamento, dose, via, horário e registro)?',
    opcoes: [
      { id: 'a', texto: 'Sim, se já conhece o paciente' },
      { id: 'b', texto: 'Não' },
    ],
    respostaCorretaId: 'b',
  },
  {
    id: 'tecnico-4',
    pergunta: 'Em caso de parada cardiorrespiratória, qual o procedimento inicial?',
    opcoes: [
      { id: 'a', texto: 'Acionar socorro e iniciar manobras de suporte básico de vida' },
      { id: 'b', texto: 'Aguardar a família decidir' },
    ],
    respostaCorretaId: 'a',
  },
  {
    id: 'tecnico-5',
    pergunta: 'Você concorda em atuar em conformidade com o Código de Ética dos Profissionais de Enfermagem (Resolução COFEN)?',
    opcoes: [
      { id: 'a', texto: 'Sim' },
      { id: 'b', texto: 'Não' },
    ],
    respostaCorretaId: 'a',
  },
];

// Perguntas cujo acerto é obrigatório para prosseguir — ajuste aqui se o banco de perguntas mudar.
const criticalQuestionIds: Record<CategoriaProfissional, string[]> = {
  cuidador: ['cuidador-1', 'cuidador-2', 'cuidador-3', 'cuidador-4'],
  tecnico: ['tecnico-1', 'tecnico-2', 'tecnico-3', 'tecnico-4', 'tecnico-5'],
  enfermeiro: ['tecnico-1', 'tecnico-2', 'tecnico-3', 'tecnico-4', 'tecnico-5'],
};

function quizPorCategoria(categoria: CategoriaProfissional): QuizQuestao[] {
  if (categoria === 'cuidador') return quizCuidador;
  return quizTecnicoEnfermeiro;
}

// Verificação profissional opcional, feita depois da conta já existir (ver DEV-NOTES.md
// 2026-08-15) — documentos, COREN, quiz de aptidão e chave Pix. `categoria` vem da conta (definida
// no cadastro), não é reperguntada aqui. O termo de responsabilidade não é mais exibido aqui: ele
// virou obrigatório já no cadastro (`CuidadorCadastroScreen`), então `aceiteResponsabilidade` é
// enviado como `true` — o usuário já concordou com o termo para conseguir criar a conta.
export function CuidadorVerificacaoScreen({ navigation }: RootStackScreenProps<'CuidadorVerificacao'>) {
  const { usuario, cuidador, token, atualizarCuidador, enviarFoto } = useAuth();
  const [selfieVisivel, setSelfieVisivel] = useState(false);
  const categoria = (cuidador?.categoria ?? 'cuidador') as CategoriaProfissional;
  const nome = usuario?.nome ?? '';
  const p = paletas[AREA];

  const [etapa, setEtapa] = useState(1);
  const [analisando, setAnalisando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [motivosReprovacao, setMotivosReprovacao] = useState<string[] | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const [cpf, setCpf] = useState('');

  const [rgCnhEnviado, setRgCnhEnviado] = useState(false);
  const [comprovanteEnderecoEnviado, setComprovanteEnderecoEnviado] = useState(false);
  const [antecedentesEnviado, setAntecedentesEnviado] = useState(false);
  const [certificadoCuidadorEnviado, setCertificadoCuidadorEnviado] = useState(false);
  const [corenNumero, setCorenNumero] = useState('');
  const [corenComprovanteEnviado, setCorenComprovanteEnviado] = useState(false);
  const [diplomaEnviado, setDiplomaEnviado] = useState(false);
  const [situacaoCadastralEnviado, setSituacaoCadastralEnviado] = useState(false);

  const [chavePix, setChavePix] = useState(cuidador?.chavePix ?? '');

  const [respostasSelecionadas, setRespostasSelecionadas] = useState<Record<string, string>>({});

  const precisaRegistro = categoria === 'tecnico' || categoria === 'enfermeiro';
  const questoes = quizPorCategoria(categoria);
  const idsCriticos = criticalQuestionIds[categoria];

  const etapa1Valida =
    !!usuario?.fotoPerfil &&
    cpf.length === 14 &&
    rgCnhEnviado &&
    comprovanteEnderecoEnviado &&
    antecedentesEnviado &&
    (categoria !== 'cuidador' || certificadoCuidadorEnviado) &&
    (!precisaRegistro ||
      (corenNumero.trim().length > 0 && corenComprovanteEnviado && diplomaEnviado && situacaoCadastralEnviado));
  const etapa2Valida = chavePix.trim().length > 0;

  const todasPerguntasRespondidas = questoes.every((q) => respostasSelecionadas[q.id] !== undefined);
  const criticasCorretas = idsCriticos.every((id) => respostasSelecionadas[id] === questoes.find((q) => q.id === id)?.respostaCorretaId);
  const etapa3Valida = todasPerguntasRespondidas && criticasCorretas;

  const responderPergunta = (perguntaId: string, opcaoId: string) => {
    setRespostasSelecionadas((prev) => ({ ...prev, [perguntaId]: opcaoId }));
  };

  const enviarVerificacao = async () => {
    setErroEnvio(null);
    setAnalisando(true);

    const documentosEnviados: TipoDocumentoCadastroApi[] = [
      ...(rgCnhEnviado ? (['rg_cnh'] as const) : []),
      ...(comprovanteEnderecoEnviado ? (['comprovante_endereco'] as const) : []),
      ...(antecedentesEnviado ? (['antecedentes_criminais'] as const) : []),
      ...(certificadoCuidadorEnviado ? (['certificado_cuidador'] as const) : []),
      ...(corenComprovanteEnviado ? (['coren_comprovante'] as const) : []),
      ...(diplomaEnviado ? (['diploma'] as const) : []),
      ...(situacaoCadastralEnviado ? (['situacao_cadastral'] as const) : []),
    ];

    const quizRespostas = questoes.map((questao) => ({
      questaoId: questao.id,
      respostaId: respostasSelecionadas[questao.id] ?? '',
      correta: respostasSelecionadas[questao.id] === questao.respostaCorretaId,
      critica: idsCriticos.includes(questao.id),
    }));

    try {
      const resultado = await enviarCadastroCuidador(
        {
          cpf,
          corenNumero: precisaRegistro ? corenNumero : undefined,
          chavePix,
          aceiteResponsabilidade: true,
          documentosEnviados,
          quizRespostas,
        },
        token ?? undefined
      );

      if (cuidador) {
        atualizarCuidador({
          ...cuidador,
          corenNumero: precisaRegistro ? corenNumero : null,
          chavePix,
          statusVerificacao: resultado.statusVerificacao,
          motivos: resultado.motivos,
        });
      }

      if (resultado.statusVerificacao === 'reprovado') {
        setMotivosReprovacao(resultado.motivos);
      } else {
        setConcluido(true);
      }
    } catch (erro) {
      setErroEnvio('Não foi possível enviar sua verificação agora. Confira sua conexão e tente novamente.');
    } finally {
      setAnalisando(false);
    }
  };

  if (analisando) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator size="large" color={p.principal} />
        <Text style={styles.estadoTitulo}>Verificando seus dados...</Text>
        <Text style={styles.estadoTexto}>
          {precisaRegistro
            ? 'Consultando seu registro no COREN e validando suas informações.'
            : 'Consultando CPF e antecedentes para validar suas informações.'}
        </Text>
      </View>
    );
  }

  if (concluido) {
    return (
      <View style={styles.estado}>
        <IconeCirculo icone="shield-checkmark" tom="verde" tamanho={104} />
        <Text style={styles.estadoTitulo}>Verificação aprovada!</Text>
        <Text style={styles.estadoTexto}>
          Seu perfil agora mostra o selo de verificado. As famílias confiam mais em quem tem o selo.
        </Text>
        <Botao
          area={AREA}
          titulo="Ir para o painel"
          icone="arrow-forward"
          onPress={() => navigation.replace('CuidadorPainel')}
          style={styles.estadoBotao}
        />
      </View>
    );
  }

  if (motivosReprovacao) {
    return (
      <ScrollView style={estilosUi.tela} contentContainerStyle={styles.estado}>
        <IconeCirculo icone="close" tom="vermelho" tamanho={104} />
        <Text style={styles.estadoTitulo}>Verificação não aprovada</Text>
        <Text style={styles.estadoTexto}>A verificação automática encontrou estes pontos. Corrija e envie de novo:</Text>
        <View style={styles.estadoLista}>
          <Aviso tom="vermelho" icone="alert-circle-outline">
            {motivosReprovacao.map((motivo, index) => (
              <Text key={index} style={styles.motivo}>
                • {motivo}
              </Text>
            ))}
          </Aviso>
        </View>
        <Botao
          area={AREA}
          titulo="Revisar e corrigir"
          icone="create-outline"
          iconeAntes
          onPress={() => setMotivosReprovacao(null)}
          style={styles.estadoBotao}
        />
      </ScrollView>
    );
  }

  const etapaValida =
    (etapa === 1 && etapa1Valida) || (etapa === 2 && etapa2Valida) || (etapa === 3 && etapa3Valida) || etapa === 4;

  const documento = (texto: string, descricao: string, marcado: boolean, alternar: () => void) => (
    <CaixaMarcar area={AREA} texto={texto} descricao={descricao} marcada={marcado} onAlternar={alternar} />
  );

  return (
    <View style={estilosUi.tela}>
      <WizardHeader
        title="Verificação profissional"
        subtitle={`Etapa ${etapa} de 4 — ${TITULOS_ETAPA[etapa - 1]}`}
        step={etapa}
        totalSteps={4}
        onBack={() => (etapa > 1 ? setEtapa((s) => s - 1) : navigation.goBack())}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
        <ScrollView
          contentContainerStyle={[estilosUi.miolo, conteudoCentralizado, { paddingTop: 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          {etapa === 1 && (
            <>
              <TituloSecao>Identificação</TituloSecao>
              <Cartao>
                <Campo
                  area={AREA}
                  rotulo="CPF"
                  icone="card-outline"
                  value={cpf}
                  onChangeText={(v) => setCpf(maskCpf(v))}
                  placeholder="000.000.000-00"
                  keyboardType="numeric"
                />
                {precisaRegistro && (
                  <Campo
                    area={AREA}
                    rotulo="Número de inscrição no COREN"
                    icone="document-text-outline"
                    value={corenNumero}
                    onChangeText={setCorenNumero}
                    placeholder="Ex.: 123456-SP"
                    autoCapitalize="characters"
                  />
                )}
              </Cartao>

              {/* Selfie da verificação (2026-09-30): SÓ câmera, na hora. Vira a foto de perfil do
                  profissional e é a referência para conferir o rosto ao iniciar cada atendimento. */}
              <TituloSecao>Foto do seu rosto</TituloSecao>
              <Cartao>
                <View style={styles.selfieLinha}>
                  <FotoPessoa foto={usuario?.fotoPerfil} nome={nome} area={AREA} tamanho={84} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.selfieTitulo}>
                      {usuario?.fotoPerfil ? 'Foto registrada' : 'Tire uma foto do seu rosto agora'}
                    </Text>
                    <Text style={estilosUi.textoApoio}>
                      Ela vira a sua foto de perfil e é conferida com o seu rosto sempre que você iniciar um
                      atendimento.
                    </Text>
                  </View>
                </View>
                <Botao
                  area={AREA}
                  variante={usuario?.fotoPerfil ? 'contorno' : 'primario'}
                  titulo={usuario?.fotoPerfil ? 'Tirar outra foto' : 'Abrir a câmera'}
                  icone="camera-outline"
                  iconeAntes
                  onPress={() => setSelfieVisivel(true)}
                />
              </Cartao>

              <TituloSecao>Documentos</TituloSecao>
              <Text style={estilosUi.textoCorpo}>Marque cada documento que você já enviou.</Text>
              <View style={{ gap: 10 }}>
                {documento('RG ou CNH (frente e verso)', 'Documento de identificação com foto', rgCnhEnviado, () =>
                  setRgCnhEnviado((v) => !v)
                )}
                {documento('Comprovante de endereço', 'Emitido nos últimos 3 meses', comprovanteEnderecoEnviado, () =>
                  setComprovanteEnderecoEnviado((v) => !v)
                )}
                {precisaRegistro ? (
                  <>
                    {documento(
                      'Carteira ou comprovante do COREN',
                      'Registro ativo no conselho',
                      corenComprovanteEnviado,
                      () => setCorenComprovanteEnviado((v) => !v)
                    )}
                    {documento('Diploma ou certificado de formação', 'Comprovante de conclusão do curso', diplomaEnviado, () =>
                      setDiplomaEnviado((v) => !v)
                    )}
                    {documento(
                      'Certidão de situação cadastral',
                      'Engloba regularidade ética, financeira e eleitoral perante o conselho',
                      situacaoCadastralEnviado,
                      () => setSituacaoCadastralEnviado((v) => !v)
                    )}
                  </>
                ) : (
                  documento(
                    'Certificado de curso de cuidador de idosos',
                    'Obrigatório para a categoria Cuidador de Idosos',
                    certificadoCuidadorEnviado,
                    () => setCertificadoCuidadorEnviado((v) => !v)
                  )
                )}
                {documento(
                  'Certidão de antecedentes criminais',
                  'Obrigatória para todas as categorias',
                  antecedentesEnviado,
                  () => setAntecedentesEnviado((v) => !v)
                )}
              </View>
            </>
          )}

          {etapa === 2 && (
            <>
              <TituloSecao>Onde você quer receber</TituloSecao>
              <Cartao>
                <Campo
                  area={AREA}
                  rotulo="Chave Pix"
                  ajuda="O dinheiro dos atendimentos vai para esta chave quando você resgatar."
                  icone="cash-outline"
                  value={chavePix}
                  onChangeText={setChavePix}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  autoCapitalize="none"
                />
              </Cartao>
              <Aviso
                tom="azul"
                icone="information-circle-outline"
                texto="Confira com cuidado: uma chave errada faz a transferência falhar (o valor volta para o seu saldo)."
              />
            </>
          )}

          {etapa === 3 && (
            <>
              <TituloSecao>Avaliação de aptidão</TituloSecao>
              <Text style={estilosUi.textoCorpo}>
                Responda com atenção. As perguntas marcadas como <Text style={styles.negrito}>segurança</Text> precisam
                ser respondidas corretamente para você avançar.
              </Text>

              {questoes.map((questao, index) => {
                const respostaSelecionada = respostasSelecionadas[questao.id];
                const respondida = respostaSelecionada !== undefined;
                const correta = respostaSelecionada === questao.respostaCorretaId;
                const critica = idsCriticos.includes(questao.id);

                return (
                  <Cartao key={questao.id}>
                    <View style={{ gap: 8 }}>
                      {critica && <Etiqueta texto="Segurança" tom="vermelho" icone="shield-outline" />}
                      <Text style={styles.pergunta}>
                        {index + 1}. {questao.pergunta}
                      </Text>
                    </View>
                    <View style={{ gap: 8 }} accessibilityRole="radiogroup">
                      {questao.opcoes.map((opcao) => (
                        <OpcaoEscolha
                          key={opcao.id}
                          area={AREA}
                          titulo={opcao.texto}
                          selecionada={respostaSelecionada === opcao.id}
                          onPress={() => responderPergunta(questao.id, opcao.id)}
                        />
                      ))}
                    </View>
                    {respondida &&
                      (correta ? (
                        <Etiqueta texto="Resposta correta" tom="verde" icone="checkmark" />
                      ) : (
                        <Etiqueta texto="Resposta incorreta — revise antes de continuar" tom="vermelho" icone="close" />
                      ))}
                  </Cartao>
                );
              })}
            </>
          )}

          {etapa === 4 && (
            <>
              <TituloSecao>Confira antes de enviar</TituloSecao>
              <Cartao style={styles.cartaoLista}>
                {[
                  ['Nome', nome],
                  ['CPF', cpf],
                  ['Categoria', categorias.find((c) => c.id === categoria)?.nome ?? ''],
                  ...(precisaRegistro ? [['COREN', corenNumero]] : []),
                  ['Chave Pix', chavePix],
                ].map(([rotulo, valor], i, lista) => (
                  <LinhaLista key={rotulo} ultima={i === lista.length - 1}>
                    <Text style={styles.resumoRotulo}>{rotulo}</Text>
                    <Text style={styles.resumoValor}>{valor}</Text>
                  </LinhaLista>
                ))}
              </Cartao>
              {erroEnvio && <Aviso tom="vermelho" icone="alert-circle-outline" texto={erroEnvio} />}
            </>
          )}
        </ScrollView>

        <RodapeFixo>
          <View style={styles.rodapeLinha}>
            {etapa > 1 && (
              <Botao area={AREA} variante="contorno" titulo="Voltar" onPress={() => setEtapa((s) => s - 1)} style={{ flex: 1 }} />
            )}
            {etapa < 4 ? (
              <Botao
                area={AREA}
                titulo="Continuar"
                icone="arrow-forward"
                desabilitado={!etapaValida}
                onPress={() => setEtapa((s) => s + 1)}
                style={{ flex: 2 }}
              />
            ) : (
              <Botao area={AREA} titulo="Enviar verificação" icone="checkmark" onPress={enviarVerificacao} style={{ flex: 2 }} />
            )}
          </View>
        </RodapeFixo>
      </KeyboardAvoidingView>

      <CapturaSelfie
        visivel={selfieVisivel}
        area={AREA}
        titulo="Foto do seu rosto"
        instrucao="Posicione o rosto dentro da moldura, de frente e num lugar bem iluminado."
        textoConfirmar="Usar esta foto"
        onFechar={() => setSelfieVisivel(false)}
        onConfirmar={async (imagemBase64) => {
          await enviarFoto(imagemBase64);
          setSelfieVisivel(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selfieLinha: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  selfieTitulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  estado: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.background,
    padding: 24,
  },
  estadoTitulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text, textAlign: 'center', marginTop: 6 },
  estadoTexto: { fontSize: fontSize.md, color: colors.gray600, textAlign: 'center', lineHeight: 23, maxWidth: 420 },
  estadoLista: { alignSelf: 'stretch', maxWidth: 520, width: '100%', alignItems: 'stretch', marginHorizontal: 'auto' },
  estadoBotao: { alignSelf: 'stretch', maxWidth: 420, width: '100%', marginTop: 8, marginHorizontal: 'auto' },
  motivo: { fontSize: fontSize.md, color: tons.vermelho.texto, lineHeight: 22 },
  negrito: { fontWeight: fontWeight.bold },
  pergunta: { fontSize: 17, fontWeight: fontWeight.bold, color: colors.text, lineHeight: 24 },
  cartaoLista: { gap: 0, paddingVertical: 6, paddingHorizontal: 18 },
  resumoRotulo: { fontSize: fontSize.md, color: colors.gray600, width: 96 },
  resumoValor: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'right' },
  rodapeLinha: { flexDirection: 'row', gap: 12 },
});
