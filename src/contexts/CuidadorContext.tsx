import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import type { Profissional } from '../data/profissionais';
import {
  agirNaSolicitacao,
  avaliarFamiliaApi,
  buscarFichaDoMembro,
  buscarProfissional,
  salvarPerfilPublicoCuidador,
  buscarSaldoCuidador,
  listarSolicitacoesRecebidas,
  solicitarResgateApi,
  definirSenhaResgateApi,
  type SolicitacaoApi,
} from '../services/api';
import { colors, type Tom } from '../theme';

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

// Dias da semana: o servidor guarda números (0 = domingo); a tela do Perfil público usa nomes.
const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Categoria da CONTA do cuidador → categoria do CATÁLOGO (o catálogo não tem "técnico").
const CATEGORIA_CATALOGO: Record<string, string> = {
  cuidador: 'cuidador',
  tecnico: 'enfermeiro',
  enfermeiro: 'enfermeiro',
};

const CATEGORIA_LABELS: Record<string, string> = {
  cuidador: 'Cuidador de Idosos',
  tecnico: 'Técnico de Enfermagem',
  enfermeiro: 'Enfermeiro',
};

// Gera `data`/`horario` relativos ao momento em que o app carrega, em vez de datas fixas no
// passado — assim o pedido mock sempre tem um horário agendado "à frente" pra dar pra testar a
// trava de `PedidoDetalheScreen` (não dá pra iniciar atendimento antes da hora marcada).
function dataHoraRelativa(minutosAPartirDeAgora: number): { data: string; horario: string } {
  const alvo = new Date(Date.now() + minutosAPartirDeAgora * 60 * 1000);
  // Tudo em horário local (não `toISOString`, que é UTC) — precisa bater exatamente com como
  // `PedidoDetalheScreen` reconstrói `new Date(\`${data}T${horario}:00\`)`, que o JS interpreta
  // como horário local quando não tem sufixo de fuso.
  const data = `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, '0')}-${String(alvo.getDate()).padStart(2, '0')}`;
  const horario = `${String(alvo.getHours()).padStart(2, '0')}:${String(alvo.getMinutes()).padStart(2, '0')}`;
  return { data, horario };
}

export type StatusDocumento = 'aprovado' | 'pendente';

export interface DocumentosColaborador {
  rg: StatusDocumento;
  comprovanteEndereco: StatusDocumento;
  carteiraConselho: StatusDocumento;
}

export type CategoriaCuidadorPerfil = 'cuidador' | 'tecnico' | 'enfermeiro';
export type StatusVerificacaoCadastro = 'em_analise' | 'aprovado' | 'reprovado';

export interface PerfilColaborador {
  nome: string;
  foto: string;
  funcaoRegistro: string;
  bio: string;
  especialidade: string;
  valorVisita: number;
  diasSemana: string[];
  horarioInicio: string;
  horarioFim: string;
  perfilCompleto: boolean;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  documentos: DocumentosColaborador;
  raioAtendimentoKm: number;
  cpf?: string;
  categoria?: CategoriaCuidadorPerfil;
  chavePix?: string;
  statusVerificacao: StatusVerificacaoCadastro;
  motivosReprovacao: string[];
}

export type StatusPedido = 'pendente' | 'aceito' | 'recusado' | 'cancelado' | 'em_andamento' | 'concluido';

export const statusPedidoCores: Record<StatusPedido, string> = {
  pendente: colors.orange,
  aceito: colors.success,
  recusado: colors.danger,
  cancelado: colors.gray400,
  em_andamento: colors.blue,
  concluido: colors.primary,
};

// Tom da etiqueta de status no visual novo (fundo claro + texto escuro; ver theme/areas.ts).
export const statusPedidoTons: Record<StatusPedido, Tom> = {
  pendente: 'laranja',
  aceito: 'verde',
  recusado: 'vermelho',
  cancelado: 'cinza',
  em_andamento: 'azul',
  concluido: 'cinza',
};

export const statusPedidoLabels: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

// Um pedido recebido é a MESMA contratação que o membro vê na área dele — só que pelo ângulo de
// quem vai atender. Vem de `GET /cuidador/solicitacoes`.
//
// Os dados pessoais do membro (foto, idade, endereço, condições, medicamentos, alergias) NÃO vêm
// nesta lista: são carregados sob demanda pela ficha (`carregarFicha`), porque o back-end libera
// endereço/telefone/medicamentos só depois que o cuidador aceita o pedido.
export interface PedidoRecebido {
  id: string;
  /** Conta do membro (agrupa "Pessoas que você atende"). Linhas antigas sem dono usam o nome. */
  membroId: string;
  membroNome: string;
  /** Foto (chave para `fonteDaFoto`) e idade do membro — vêm junto na lista desde 2026-09-30. */
  membroFoto: string | null;
  membroIdade: number | null;
  /** Avaliação que o MEMBRO deu a este profissional neste atendimento. */
  avaliacaoRecebida?: { nota: number; comentario: string; criadoEm: string };
  /** Avaliação que ESTE profissional deu à família neste atendimento. */
  avaliacaoFeita?: { nota: number; comentario: string };
  data: string;
  horarioInicio: string;
  horarioFim: string;
  observacoes: string;
  status: StatusPedido;
  checkInEm?: string;
  checkOutEm?: string;
  valorTotal: number;
  // Se o membro já pagou. É isto que libera o "Iniciar atendimento" (modelo de garantia).
  pagamentoConfirmado: boolean;
}

// A ficha de quem vai ser atendido, carregada por pedido. Os campos sensíveis chegam vazios
// enquanto o pedido está pendente — é o back-end que decide o que liberar, não a tela.
export interface FichaDoMembro {
  nome: string;
  idade: number | null;
  fotoUrl: string | null;
  condicoesMedicas: string[];
  alergias: string[];
  observacoes: string | null;
  telefone: string | null;
  endereco: string | null;
  medicamentos: { nome: string; dosagem: string; horarios: string[] }[];
  contatosEmergencia: { nome: string; relacao: string; telefone: string; principal: boolean }[];
}

/**
 * Uma pessoa que este profissional atende, montada a partir dos atendimentos REAIS (aceitos, em
 * andamento e concluídos). Até 2026-09-30 era uma lista inventada (data/pacientes.ts).
 */
export interface PessoaAtendida {
  membroId: string;
  nome: string;
  foto: string | null;
  idade: number | null;
  /** Último atendimento concluído que este profissional ainda NÃO avaliou (libera "Avaliar família"). */
  pedidoParaAvaliar?: PedidoRecebido;
  /** A avaliação mais recente que este profissional deu a esta família. */
  ultimaAvaliacaoFeita?: { nota: number; comentario: string };
  /** Próximo atendimento confirmado (ou o que está acontecendo agora), se houver. */
  proximo?: PedidoRecebido;
  /** Pedido que abre ao tocar: o próximo, senão o último concluído. */
  pedidoParaAbrir: PedidoRecebido;
  atendimentosConcluidos: number;
}

export interface GanhoRegistro {
  data: string;
  pacienteNome: string;
  valor: number;
}

export interface Ganhos {
  totalMes: number;
  proximoRecebimento: string;
  historico: GanhoRegistro[];
}

export interface ResgateRegistro {
  id: string;
  data: string;
  valor: number;
  chavePix: string;
  // A transferência Pix real (Asaas) é assíncrona: nasce `processando` e o webhook confirma.
  status: 'processando' | 'concluido' | 'falhou';
  motivoFalha: string | null;
}

export interface AvaliacaoRecebida {
  id: string;
  nota: number;
  comentario: string;
  familiaNome: string;
}

export interface AvaliacaoFamilia {
  pacienteId: string;
  nota: number;
  comentario: string;
}

export interface DenunciaContraMembro {
  id: string;
  pacienteId: string;
  membroNome: string;
  motivos: string[];
  descricao: string;
  data: string;
}


const STATUS_API_PARA_PEDIDO: Record<SolicitacaoApi['status'], StatusPedido> = {
  pendente: 'pendente',
  aceita: 'aceito',
  em_andamento: 'em_andamento',
  concluida: 'concluido',
  recusada: 'recusado',
  cancelada: 'cancelado',
};

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

// A API manda datas ISO; as telas do cuidador falam em "AAAA-MM-DD" + "HH:MM" (formato que
// `PedidoDetalheScreen` remonta para comparar com "agora"). Conversão num lugar só.
function pedidoDaApi(api: SolicitacaoApi): PedidoRecebido {
  const inicio = new Date(api.inicioEm);
  const fim = new Date(api.fimEm);
  return {
    id: api.id,
    membroId: api.usuarioId ?? `nome:${api.membroNome}`,
    membroNome: api.usuario?.nome ?? api.membroNome,
    membroFoto: api.usuario?.fotoPerfil ?? null,
    membroIdade: api.usuario?.membro?.idade ?? null,
    avaliacaoRecebida: (() => {
      const a = api.avaliacoes?.find((x) => x.autor === 'membro');
      return a ? { nota: a.nota, comentario: a.comentario ?? '', criadoEm: a.criadoEm } : undefined;
    })(),
    avaliacaoFeita: (() => {
      const a = api.avaliacoes?.find((x) => x.autor === 'cuidador');
      return a ? { nota: a.nota, comentario: a.comentario ?? '' } : undefined;
    })(),
    data: `${inicio.getFullYear()}-${doisDigitos(inicio.getMonth() + 1)}-${doisDigitos(inicio.getDate())}`,
    horarioInicio: `${doisDigitos(inicio.getHours())}:${doisDigitos(inicio.getMinutes())}`,
    horarioFim: `${doisDigitos(fim.getHours())}:${doisDigitos(fim.getMinutes())}`,
    observacoes: api.observacoes ?? '',
    status: STATUS_API_PARA_PEDIDO[api.status],
    checkInEm: api.atualizadoEm ?? undefined,
    valorTotal: api.valorTotal,
    // `liberado` é pago também — a diferença entre retido e repassado não muda o que a tela faz.
    pagamentoConfirmado: api.pagamento?.status === 'pago' || api.pagamento?.status === 'liberado',
  };
}

interface CuidadorContextValue {
  perfil: PerfilColaborador;
  /** Só campos locais (ex.: raio de atendimento, que ainda não tem coluna no servidor). */
  atualizarPerfil: (p: Partial<PerfilColaborador>) => void;
  /** true depois de carregar o perfil público do servidor (ou saber que ainda não existe). */
  perfilPublicoCarregado: boolean;
  /** Salva o perfil público NO SERVIDOR (PUT /cuidador/perfil). Lança erro se ele recusar. */
  completarPerfil: (dados: {
    bio: string;
    especialidade: string;
    valorVisita: number;
    diasSemana: string[];
    horarioInicio: string;
    horarioFim: string;
  }) => Promise<void>;

  // Contratações recebidas, vindas do back-end — as mesmas linhas que o membro vê na área dele.
  pedidos: PedidoRecebido[];
  carregandoPedidos: boolean;
  erroPedidos: string | null;
  recarregarPedidos: () => Promise<void>;
  /** Saldo e histórico de resgates — o status do saque muda no servidor (webhook da Asaas). */
  recarregarSaldo: () => Promise<void>;
  aceitarPedido: (id: string) => Promise<void>;
  recusarPedido: (id: string) => Promise<void>;
  cancelarPedido: (id: string) => Promise<void>;
  /** Exige a selfie tirada na hora (verificação do rosto) — JPEG em base64. */
  iniciarAtendimento: (id: string, selfieBase64: string) => Promise<void>;
  concluirAtendimento: (id: string) => Promise<void>;
  carregarFicha: (id: string) => Promise<FichaDoMembro>;

  pessoasAtendidas: PessoaAtendida[];

  ganhos: Ganhos;
  saldoDisponivel: number;
  resgates: ResgateRegistro[];
  resgatando: boolean;
  /** Exige a senha de resgate (6 dígitos). Repassa o erro do servidor (com `codigo`) pra tela. */
  solicitarResgate: (senhaResgate: string) => Promise<void>;
  temSenhaResgate: boolean;
  definirSenhaResgate: (novaSenha: string, senhaAtual?: string) => Promise<void>;

  avaliacoesRecebidas: AvaliacaoRecebida[];

  avaliacoesFeitasFamilias: AvaliacaoFamilia[];
  /** Avalia a família de um atendimento CONCLUÍDO (pelo id do pedido). Salva no servidor; lança
   * erro se ele recusar. Antes ficava só no celular e o membro nunca via. */
  avaliarFamilia: (pedidoId: string, nota: number, comentario: string) => Promise<void>;

  denunciasContraMembros: DenunciaContraMembro[];
  denunciarMembro: (pacienteId: string, membroNome: string, motivos: string[], descricao: string) => void;
}

const CuidadorContext = createContext<CuidadorContextValue | undefined>(undefined);

export function CuidadorProvider({ children }: { children: React.ReactNode }) {
  // ⚠️ Até 2026-09-30 começava com dados INVENTADOS ("Ana Paula Santos", nota 4.9 com 127
  // avaliações, verificação "aprovado"). Agora começa neutro: identidade vem da conta e o perfil
  // público vem do servidor (efeito abaixo).
  const [perfil, setPerfil] = useState<PerfilColaborador>({
    nome: '',
    foto: '',
    funcaoRegistro: '',
    bio: '',
    especialidade: '',
    valorVisita: 0,
    diasSemana: [],
    horarioInicio: '',
    horarioFim: '',
    perfilCompleto: false,
    avaliacaoMedia: 0,
    totalAvaliacoes: 0,
    documentos: {
      rg: 'pendente',
      comprovanteEndereco: 'pendente',
      carteiraConselho: 'pendente',
    },
    // Raio de atendimento ainda NÃO tem coluna no servidor — fica só no aparelho (pendência).
    raioAtendimentoKm: 10,
    statusVerificacao: 'em_analise',
    motivosReprovacao: [],
  });

  // Identidade vem da conta; categoria/chavePix/status de verificação vêm do `Cuidador`
  // sincronizado no back-end (ver CuidadorVerificacaoScreen.tsx).
  const { usuario, cuidador, token, atualizarCuidador } = useAuth();

  // Perfil público (catálogo) do servidor: o que as famílias veem. Guardado inteiro porque o PUT
  // regrava todos os campos — sem mandar experiência/formação/áreas de volta, eles seriam apagados.
  const [perfilServidor, setPerfilServidor] = useState<Profissional | null>(null);
  const [perfilPublicoCarregado, setPerfilPublicoCarregado] = useState(false);
  const perfilPublicoId = cuidador?.perfilPublicoId ?? null;

  const aplicarPerfilServidor = useCallback((p: Profissional) => {
    setPerfilServidor(p);
    setPerfil((prev) => ({
      ...prev,
      bio: p.bio,
      especialidade: p.especialidade,
      valorVisita: p.valorVisita,
      diasSemana: p.diasDisponiveis.map((d) => NOMES_DIAS[d]).filter(Boolean),
      horarioInicio: p.horarioInicio,
      horarioFim: p.horarioFim,
      avaliacaoMedia: p.avaliacao,
      totalAvaliacoes: p.totalAvaliacoes,
      perfilCompleto: true,
    }));
  }, []);

  useEffect(() => {
    if (!perfilPublicoId) {
      setPerfilServidor(null);
      setPerfilPublicoCarregado(!!usuario);
      return;
    }
    let ativo = true;
    setPerfilPublicoCarregado(false);
    buscarProfissional(perfilPublicoId)
      .then((p) => {
        if (ativo && p) aplicarPerfilServidor(p);
      })
      .catch(() => {
        // Sem servidor: o formulário abre vazio, e salvar mostra o erro.
      })
      .finally(() => ativo && setPerfilPublicoCarregado(true));
    return () => {
      ativo = false;
    };
  }, [perfilPublicoId, usuario, aplicarPerfilServidor]);
  useEffect(() => {
    if (!usuario) return;
    // Os documentos são autodeclarados na verificação (não há análise por documento no back-end),
    // então o status de cada um acompanha o resultado da verificação — antes era um exemplo fixo
    // que mostrava "comprovante pendente" até para quem já estava aprovado.
    const statusDocumentos: StatusDocumento =
      cuidador?.statusVerificacao === 'aprovado' ? 'aprovado' : 'pendente';
    setPerfil((prev) => ({
      ...prev,
      documentos: cuidador
        ? { rg: statusDocumentos, comprovanteEndereco: statusDocumentos, carteiraConselho: statusDocumentos }
        : prev.documentos,
      // Vem do servidor: antes era só uma flag local que começava "incompleto" em todo aparelho,
      // mesmo com o perfil público já criado.
      perfilCompleto: cuidador?.perfilPublicoId ? true : prev.perfilCompleto,
      nome: usuario.nome,
      cpf: usuario.cpf ?? prev.cpf,
      categoria: cuidador?.categoria ?? prev.categoria,
      chavePix: cuidador?.chavePix ?? prev.chavePix,
      statusVerificacao: cuidador?.statusVerificacao ?? prev.statusVerificacao,
      motivosReprovacao: cuidador?.motivos ?? prev.motivosReprovacao,
      funcaoRegistro: cuidador
        ? `${CATEGORIA_LABELS[cuidador.categoria] ?? cuidador.categoria}${cuidador.corenNumero ? ` · COREN ${cuidador.corenNumero}` : ''}`
        : prev.funcaoRegistro,
    }));
  }, [usuario, cuidador]);

  const [pedidos, setPedidos] = useState<PedidoRecebido[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [erroPedidos, setErroPedidos] = useState<string | null>(null);

  const recarregarPedidos = useCallback(async () => {
    if (!token) {
      setPedidos([]);
      setErroPedidos(null);
      return;
    }
    setCarregandoPedidos(true);
    try {
      const dados = await listarSolicitacoesRecebidas(token);
      setPedidos(dados.map(pedidoDaApi));
      setErroPedidos(null);
    } catch (erro) {
      setErroPedidos(erro instanceof Error ? erro.message : 'Não foi possível carregar seus pedidos');
    } finally {
      setCarregandoPedidos(false);
    }
  }, [token]);

  useEffect(() => {
    void recarregarPedidos();
  }, [recarregarPedidos]);

  // Saldo e resgates também vêm do servidor: o saldo é calculado lá (liberado − já sacado), não
  // guardado como número acumulado.
  const recarregarSaldo = useCallback(async () => {
    if (!token) return;
    try {
      const dados = await buscarSaldoCuidador(token);
      setSaldoDisponivel(dados.saldoDisponivel);
      setTemSenhaResgate(dados.temSenhaResgate);
      setResgates(
        dados.resgates.map((r) => ({
          id: r.id,
          data: r.criadoEm,
          valor: r.valor,
          chavePix: r.chavePix,
          status: r.status,
          motivoFalha: r.motivoFalha,
        }))
      );
    } catch {
      // Silencioso de propósito: sem perfil público ainda (404), o cuidador simplesmente não tem
      // saldo para mostrar — não é um erro que valha interromper a tela.
    }
  }, [token]);

  useEffect(() => {
    void recarregarSaldo();
  }, [recarregarSaldo]);

  // "Pessoas que você atende": das contratações REAIS deste profissional (aceitas, em andamento e
  // concluídas), uma entrada por membro. Até 2026-09-30 era uma lista inventada.
  const pessoasAtendidas = useMemo<PessoaAtendida[]>(() => {
    const porMembro = new Map<string, PedidoRecebido[]>();
    for (const pedido of pedidos) {
      if (pedido.status !== 'aceito' && pedido.status !== 'em_andamento' && pedido.status !== 'concluido') continue;
      porMembro.set(pedido.membroId, [...(porMembro.get(pedido.membroId) ?? []), pedido]);
    }
    const chave = (p: PedidoRecebido) => `${p.data}T${p.horarioInicio}`;
    return [...porMembro.entries()]
      .map(([membroId, lista]) => {
        const ativos = lista
          .filter((p) => p.status === 'em_andamento' || p.status === 'aceito')
          .sort((a, b) => (a.status === 'em_andamento' ? -1 : b.status === 'em_andamento' ? 1 : chave(a).localeCompare(chave(b))));
        const concluidos = lista.filter((p) => p.status === 'concluido').sort((a, b) => chave(b).localeCompare(chave(a)));
        const proximo = ativos[0];
        return {
          membroId,
          nome: lista[0].membroNome,
          foto: lista.find((p) => p.membroFoto)?.membroFoto ?? null,
          idade: lista.find((p) => p.membroIdade != null)?.membroIdade ?? null,
          pedidoParaAvaliar: concluidos.find((p) => !p.avaliacaoFeita),
          ultimaAvaliacaoFeita: concluidos.find((p) => p.avaliacaoFeita)?.avaliacaoFeita,
          proximo,
          pedidoParaAbrir: proximo ?? concluidos[0],
          atendimentosConcluidos: concluidos.length,
        };
      })
      .sort((a, b) => (a.proximo ? 0 : 1) - (b.proximo ? 0 : 1) || a.nome.localeCompare(b.nome));
  }, [pedidos]);

  // "Atendimentos concluídos" em Meus ganhos: dos atendimentos REAIS concluídos. Até 2026-09-30
  // eram valores inventados (R$ 2.340, "Maria Aparecida Souza"). Valor = o combinado na contratação.
  const ganhos = useMemo<Ganhos>(() => {
    const concluidos = pedidos
      .filter((p) => p.status === 'concluido')
      .sort((a, b) => `${b.data}${b.horarioInicio}`.localeCompare(`${a.data}${a.horarioInicio}`));
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    return {
      totalMes: concluidos.filter((p) => p.data.startsWith(mesAtual)).reduce((soma, p) => soma + p.valorTotal, 0),
      proximoRecebimento: '',
      historico: concluidos.map((p) => ({ data: p.data, pacienteNome: p.membroNome, valor: p.valorTotal })),
    };
  }, [pedidos]);

  // Saldo e resgates vêm do servidor (recarregarSaldo). Começa em 0 — antes começava com R$ 330 de
  // exemplo, que aparecia se o servidor não respondesse.
  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [resgates, setResgates] = useState<ResgateRegistro[]>([]);
  const [resgatando, setResgatando] = useState(false);
  const [temSenhaResgate, setTemSenhaResgate] = useState(false);

  // Avaliações que as famílias deram a este profissional — do servidor, junto com os pedidos
  // (2026-09-30). Antes era uma avaliação inventada ("Família Souza") e depois uma lista vazia.
  const avaliacoesRecebidas = useMemo<AvaliacaoRecebida[]>(
    () =>
      pedidos
        .filter((p) => p.avaliacaoRecebida)
        .sort((a, b) => b.avaliacaoRecebida!.criadoEm.localeCompare(a.avaliacaoRecebida!.criadoEm))
        .map((p) => ({
          id: p.id,
          nota: p.avaliacaoRecebida!.nota,
          comentario: p.avaliacaoRecebida!.comentario,
          familiaNome: p.membroNome,
        })),
    [pedidos]
  );

  const [avaliacoesFeitasFamilias, setAvaliacoesFeitasFamilias] = useState<AvaliacaoFamilia[]>([]);
  const [denunciasContraMembros, setDenunciasContraMembros] = useState<DenunciaContraMembro[]>([]);

  const value = useMemo<CuidadorContextValue>(
    () => ({
      perfil,
      atualizarPerfil: (p) => setPerfil((prev) => ({ ...prev, ...p })),
      perfilPublicoCarregado,
      // Até 2026-09-30 isto só mudava o estado do aparelho — o servidor nunca recebia o perfil
      // público, e o catálogo continuava com os dados antigos.
      completarPerfil: async (dados) => {
        if (!token) throw new Error('Entre na sua conta para salvar o perfil');
        const categoria =
          perfilServidor?.categoria ?? CATEGORIA_CATALOGO[cuidador?.categoria ?? 'cuidador'] ?? 'cuidador';
        const salvo = await salvarPerfilPublicoCuidador(token, {
          especialidade: dados.especialidade.trim(),
          categoria,
          bio: dados.bio,
          valorHora: dados.valorVisita,
          diasDisponiveis: dados.diasSemana.map((nome) => NOMES_DIAS.indexOf(nome)).filter((d) => d >= 0),
          horarioInicio: dados.horarioInicio,
          horarioFim: dados.horarioFim,
          // Campos que esta tela não edita: vão de volta como estão, senão o servidor os apaga.
          experiencia: perfilServidor?.experiencia,
          formacao: perfilServidor?.formacao,
          areasAtuacao: perfilServidor?.areasAtuacao,
          disponibilidade: perfilServidor?.disponibilidade,
          telefone: perfilServidor?.telefone,
        });
        aplicarPerfilServidor(salvo);
        // Primeira vez: a conta passa a ter perfil público (é o que libera receber pedidos).
        if (cuidador && !cuidador.perfilPublicoId) atualizarCuidador({ ...cuidador, perfilPublicoId: salvo.id });
      },

      pedidos,
      carregandoPedidos,
      erroPedidos,
      recarregarPedidos,
      recarregarSaldo,
      // Cada ação vai ao servidor e recarrega a lista com o que ele respondeu, em vez de adivinhar
      // o novo estado aqui: é o back-end que valida (ex.: recusa iniciar antes de o pagamento cair,
      // ou barra dois atendimentos no mesmo horário).
      aceitarPedido: async (id) => {
        if (!token) return;
        const atualizada = await agirNaSolicitacao(token, id, 'aceitar');
        setPedidos((prev) => prev.map((item) => (item.id === id ? pedidoDaApi(atualizada) : item)));
      },
      recusarPedido: async (id) => {
        if (!token) return;
        const atualizada = await agirNaSolicitacao(token, id, 'recusar');
        setPedidos((prev) => prev.map((item) => (item.id === id ? pedidoDaApi(atualizada) : item)));
      },
      cancelarPedido: async (id) => {
        if (!token) return;
        const atualizada = await agirNaSolicitacao(token, id, 'cancelar');
        setPedidos((prev) => prev.map((item) => (item.id === id ? pedidoDaApi(atualizada) : item)));
      },
      iniciarAtendimento: async (id, selfieBase64) => {
        if (!token) return;
        const atualizada = await agirNaSolicitacao(token, id, 'iniciar', { selfieBase64 });
        setPedidos((prev) => prev.map((item) => (item.id === id ? pedidoDaApi(atualizada) : item)));
      },
      concluirAtendimento: async (id) => {
        if (!token) return;
        const atualizada = await agirNaSolicitacao(token, id, 'concluir');
        setPedidos((prev) => prev.map((item) => (item.id === id ? pedidoDaApi(atualizada) : item)));
        // Concluir libera o valor retido: o saldo muda no servidor, então recarrega.
        await recarregarSaldo();
      },
      carregarFicha: async (id) => {
        if (!token) throw new Error('Entre na sua conta para ver a ficha');
        return buscarFichaDoMembro(token, id);
      },

      pessoasAtendidas,

      ganhos,
      saldoDisponivel,
      resgates,
      resgatando,
      solicitarResgate: async (senhaResgate) => {
        if (!token || saldoDisponivel <= 0 || resgatando) return;
        setResgatando(true);
        try {
          await solicitarResgateApi(token, senhaResgate);
          // O servidor decide o valor (saldo liberado − já sacado) e devolve o novo estado.
          await recarregarSaldo();
        } finally {
          setResgatando(false);
        }
      },
      temSenhaResgate,
      definirSenhaResgate: async (novaSenha, senhaAtual) => {
        if (!token) throw new Error('Entre na sua conta para criar a senha de resgate');
        await definirSenhaResgateApi(token, novaSenha, senhaAtual);
        setTemSenhaResgate(true);
      },

      avaliacoesRecebidas,

      avaliacoesFeitasFamilias,
      avaliarFamilia: async (pedidoId, nota, comentario) => {
        if (!token) throw new Error('Entre na sua conta para avaliar');
        const atualizada = await avaliarFamiliaApi(token, pedidoId, { nota, comentario });
        setPedidos((prev) => prev.map((item) => (item.id === pedidoId ? pedidoDaApi(atualizada) : item)));
      },

      denunciasContraMembros,
      denunciarMembro: (pacienteId, membroNome, motivos, descricao) =>
        setDenunciasContraMembros((prev) => [
          ...prev,
          { id: gerarId('den'), pacienteId, membroNome, motivos, descricao, data: new Date().toISOString() },
        ]),
    }),
    [
      perfil,
      perfilPublicoCarregado,
      perfilServidor,
      cuidador,
      atualizarCuidador,
      aplicarPerfilServidor,
      pedidos,
      carregandoPedidos,
      erroPedidos,
      recarregarPedidos,
      recarregarSaldo,
      token,
      pessoasAtendidas,
      ganhos,
      saldoDisponivel,
      resgates,
      resgatando,
      temSenhaResgate,
      avaliacoesRecebidas,
      avaliacoesFeitasFamilias,
      denunciasContraMembros,
    ]
  );

  return <CuidadorContext.Provider value={value}>{children}</CuidadorContext.Provider>;
}

export function useCuidador(): CuidadorContextValue {
  const context = useContext(CuidadorContext);
  if (!context) {
    throw new Error('useCuidador deve ser usado dentro de um CuidadorProvider');
  }
  return context;
}
