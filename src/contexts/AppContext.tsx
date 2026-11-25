import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import type { DenunciaTipo } from '../navigation/types';
import {
  adicionarCondicaoApi,
  adicionarContatoApi,
  avaliarCuidadorApi,
  adicionarMedicamentoApi,
  buscarPerfilMembro,
  cancelarSolicitacaoApi,
  criarSolicitacao as criarSolicitacaoApi,
  definirContatoPrincipalApi,
  editarContatoApi,
  editarMedicamentoApi,
  iniciarPagamentoSolicitacao,
  listarSolicitacoes,
  removerCondicaoApi,
  removerContatoApi,
  removerMedicamentoApi,
  salvarPerfilMembro,
  type InicioPagamentoApi,
  type SolicitacaoApi,
} from '../services/api';
import type { FormaPagamento } from '../services/pagamentos';
import { colors, type Tom } from '../theme';

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export interface DadosPessoais {
  nome: string;
  idade: number;
  foto: string;
  telefone: string;
  email: string;
  endereco: string;
  cpf: string;
  documentoStatus: 'pendente' | 'verificado';
}

export interface Medicamento {
  id: string;
  nome: string;
  dosagem: string;
  horarios: string[];
  ativo: boolean;
}

export interface CondicaoMedica {
  id: string;
  nome: string;
}

export interface ContatoEmergencia {
  id: string;
  nome: string;
  relacao: string;
  telefone: string;
  principal: boolean;
}

export type StatusSolicitacao =
  | 'pendente'
  | 'aceita'
  | 'em_andamento'
  | 'concluida'
  | 'recusada'
  | 'cancelada';

// Cor e rótulo por status — ficam aqui (e não em cada tela) porque Home e Perfil mostram o mesmo
// status da mesma solicitação. Espelha o par `statusPedidoCores`/`statusPedidoLabels` que o
// CuidadorContext já expõe para o outro lado do app.
export const statusSolicitacaoCores: Record<StatusSolicitacao, string> = {
  pendente: colors.orange,
  aceita: colors.success,
  em_andamento: colors.blue,
  concluida: colors.primary,
  recusada: colors.danger,
  cancelada: colors.gray400,
};

// Tom da etiqueta (pílula) de status no visual novo — fundo claro + texto escuro (ver `tons`).
export const statusSolicitacaoTons: Record<StatusSolicitacao, Tom> = {
  pendente: 'laranja',
  aceita: 'verde',
  em_andamento: 'azul',
  concluida: 'cinza',
  recusada: 'vermelho',
  cancelada: 'cinza',
};

export const statusSolicitacaoLabels: Record<StatusSolicitacao, string> = {
  pendente: 'Pendente',
  aceita: 'Aceita',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  recusada: 'Recusada',
  cancelada: 'Cancelada',
};

export interface AvaliacaoCuidador {
  nota: number;
  comentario: string;
}

export type StatusPagamentoConsulta = 'pendente' | 'pago' | 'estornado';

export interface SolicitacaoCuidador {
  id: string;
  cuidadorId: string;
  cuidadorNome: string;
  cuidadorFoto: string;
  dataPreferida: string;
  // Faixa contratada: o membro escolhe de que hora a que hora precisa do cuidador. É a duração
  // dessa faixa que define o valor (cobrança por hora) e o que ocupa a agenda do profissional.
  horarioInicio: string;
  horarioFim: string;
  observacoes: string;
  status: StatusSolicitacao;
  checkInEm?: string;
  checkOutEm?: string;
  /** Selfie tirada pelo cuidador ao chegar (chave do armazenamento) e quando. */
  selfieChegada?: string;
  selfieChegadaEm?: string;
  /** Início exato da visita (ISO) — usado no "chegando em ~X min" da Home. */
  inicioEm: string;
  /** A avaliação que o MEMBRO deu ao cuidador (vem do servidor desde 2026-09-30). */
  avaliacao?: AvaliacaoCuidador;
  /** A avaliação que o CUIDADOR deu à família neste atendimento. */
  avaliacaoRecebida?: AvaliacaoCuidador;
  statusPagamento?: StatusPagamentoConsulta;
  formaPagamento?: FormaPagamento;
  pagoEm?: string;
  // Valor congelado na contratação, vindo do back-end — não recalcular no app: o preço do
  // profissional pode ter mudado depois que esta contratação foi fechada.
  valorTotal: number;
}

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

function avaliacaoDe(api: SolicitacaoApi, autor: 'membro' | 'cuidador'): AvaliacaoCuidador | undefined {
  const a = api.avaliacoes?.find((item) => item.autor === autor);
  return a ? { nota: a.nota, comentario: a.comentario ?? '' } : undefined;
}

// A API fala em datas ISO; as telas falam em "DD/MM/AAAA" + "HH:MM". A conversão fica aqui, num
// lugar só, em vez de espalhada pelas telas.
export function solicitacaoDaApi(api: SolicitacaoApi): SolicitacaoCuidador {
  const inicio = new Date(api.inicioEm);
  const fim = new Date(api.fimEm);

  // Do ponto de vista do membro, `liberado` (já repassado ao cuidador) continua sendo "pago" —
  // a diferença entre retido e repassado é assunto do outro lado.
  //
  // ⚠️ Regra (2026-09-30): só EXISTE pagamento a fazer depois que o cuidador aceita. Antes, a Home
  // mostrava "pagamento pendente" de pedido ainda não respondido e de pedido RECUSADO (o pagamento
  // nasce junto com a solicitação no servidor). E `cancelado` caía no "senão → pago".
  const pagamentoEmAberto = api.status === 'aceita' || api.status === 'em_andamento';
  const statusPagamento: StatusPagamentoConsulta | undefined = (() => {
    switch (api.pagamento?.status) {
      case 'pendente':
        return pagamentoEmAberto ? 'pendente' : undefined;
      case 'pago':
      case 'liberado':
        return 'pago';
      case 'estornado':
        return 'estornado';
      default:
        return undefined; // sem pagamento, ou `cancelado` (encerrado sem nunca ter sido pago)
    }
  })();

  return {
    id: api.id,
    cuidadorId: api.cuidadorId,
    cuidadorNome: api.cuidador?.nome ?? api.membroNome,
    cuidadorFoto: api.cuidador?.foto ?? '',
    dataPreferida: `${doisDigitos(inicio.getDate())}/${doisDigitos(inicio.getMonth() + 1)}/${inicio.getFullYear()}`,
    horarioInicio: `${doisDigitos(inicio.getHours())}:${doisDigitos(inicio.getMinutes())}`,
    horarioFim: `${doisDigitos(fim.getHours())}:${doisDigitos(fim.getMinutes())}`,
    observacoes: api.observacoes ?? '',
    status: api.status,
    checkInEm: api.atualizadoEm ?? undefined,
    inicioEm: api.inicioEm,
    avaliacao: avaliacaoDe(api, 'membro'),
    avaliacaoRecebida: avaliacaoDe(api, 'cuidador'),
    selfieChegada: api.selfieInicio ?? undefined,
    selfieChegadaEm: api.selfieInicioEm ?? undefined,
    statusPagamento,
    formaPagamento: api.pagamento?.forma ?? undefined,
    pagoEm: api.pagamento?.pagoEm ?? undefined,
    valorTotal: api.valorTotal,
  };
}

export interface PreferenciasApp {
  notificacoes: boolean;
  lembretes: boolean;
  localizacao: boolean;
  modoAcessivel: boolean;
  consentimentoSaude: boolean;
}

export interface DenunciaRegistrada {
  id: string;
  tipo: DenunciaTipo;
  motivos: string[];
  descricao: string;
  data: string;
  alvoId?: string;
  alvoNome?: string;
}

export interface ItemCarrinho {
  produtoId: string;
  quantidade: number;
}

interface AppContextValue {
  dadosPessoais: DadosPessoais;
  /** Endereço e idade vão para o servidor; nome/e-mail/telefone ainda só no aparelho (falta rota
   * de editar a conta). Lança erro se o servidor recusar. */
  atualizarDadosPessoais: (dados: Partial<DadosPessoais>) => Promise<void>;

  // Perfil de SAÚDE do membro: vem do servidor e cada mudança é salva lá (2026-09-30). É o que o
  // cuidador vê na "Ficha de saúde" do pedido. Todas lançam erro se o servidor recusar — a tela
  // precisa avisar, senão a pessoa acha que salvou.
  carregandoPerfil: boolean;
  medicamentos: Medicamento[];
  adicionarMedicamento: (m: Omit<Medicamento, 'id'>) => Promise<void>;
  editarMedicamento: (id: string, m: Partial<Omit<Medicamento, 'id'>>) => Promise<void>;
  removerMedicamento: (id: string) => Promise<void>;
  toggleMedicamentoAtivo: (id: string) => Promise<void>;

  condicoesMedicas: CondicaoMedica[];
  adicionarCondicaoMedica: (nome: string) => Promise<void>;
  removerCondicaoMedica: (id: string) => Promise<void>;

  // Alergias (2026-09-30): o campo existia no banco e aparecia na ficha do cuidador, mas nenhuma
  // tela deixava o membro preencher — a ficha mostrava sempre "Nenhuma alergia informada".
  alergias: string[];
  adicionarAlergia: (nome: string) => Promise<void>;
  removerAlergia: (nome: string) => Promise<void>;

  contatosEmergencia: ContatoEmergencia[];
  adicionarContatoEmergencia: (c: Omit<ContatoEmergencia, 'id'>) => Promise<void>;
  editarContatoEmergencia: (id: string, c: Partial<Omit<ContatoEmergencia, 'id'>>) => Promise<void>;
  removerContatoEmergencia: (id: string) => Promise<void>;
  definirContatoPrincipal: (id: string) => Promise<void>;

  // Contratações do membro logado, vindas do back-end. É a MESMA linha que o cuidador vê na área
  // dele — quem move o status daqui em diante é ele (aceitar/iniciar/concluir), não o app.
  solicitacoes: SolicitacaoCuidador[];
  carregandoSolicitacoes: boolean;
  erroSolicitacoes: string | null;
  recarregarSolicitacoes: () => Promise<void>;
  criarSolicitacao: (dados: {
    cuidadorId: string;
    inicioEm: Date;
    fimEm: Date;
    observacoes?: string;
  }) => Promise<SolicitacaoCuidador>;
  cancelarSolicitacao: (id: string) => Promise<void>;
  /** Salva NO SERVIDOR (antes ficava só no celular — ninguém mais via). Lança erro se recusar. */
  avaliarSolicitacao: (id: string, avaliacao: AvaliacaoCuidador) => Promise<void>;
  /** Pede a cobrança real (Asaas). Não marca como pago — a confirmação chega pelo webhook no
   * servidor; a tela acompanha recarregando as solicitações. */
  iniciarPagamento: (id: string, formaPagamento: FormaPagamento, cpf?: string) => Promise<InicioPagamentoApi>;

  preferencias: PreferenciasApp;
  atualizarPreferencias: (p: Partial<PreferenciasApp>) => void;

  denuncias: DenunciaRegistrada[];
  registrarDenuncia: (d: Omit<DenunciaRegistrada, 'id' | 'data'>) => void;

  carrinho: ItemCarrinho[];
  adicionarAoCarrinho: (produtoId: string, quantidade?: number) => void;
  removerDoCarrinho: (produtoId: string) => void;
  alterarQuantidade: (produtoId: string, quantidade: number) => void;
  limparCarrinho: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ⚠️ Até 2026-09-30 tudo isto começava com dados de EXEMPLO ("Maria Oliveira", Losartana...) e
  // ficava só na memória do celular — o cuidador via a "Ficha de saúde" vazia, porque nada chegava
  // ao banco. Agora começa vazio e é carregado do servidor (GET /membro/perfil).
  const [dadosPessoais, setDadosPessoais] = useState<DadosPessoais>({
    nome: '',
    idade: 0,
    foto: '',
    telefone: '',
    email: '',
    endereco: '',
    cpf: '',
    documentoStatus: 'pendente',
  });

  // Identidade (nome, e-mail, telefone, CPF) vem da conta.
  const { usuario, token } = useAuth();
  useEffect(() => {
    if (!usuario) return;
    setDadosPessoais((prev) => ({
      ...prev,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      cpf: usuario.cpf ?? prev.cpf,
    }));
  }, [usuario]);

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [condicoesMedicas, setCondicoesMedicas] = useState<CondicaoMedica[]>([]);
  const [contatosEmergencia, setContatosEmergencia] = useState<ContatoEmergencia[]>([]);
  const [alergias, setAlergias] = useState<string[]>([]);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  // Endereço digitado no cadastro, antes de o token existir: é enviado assim que a sessão abrir.
  const enderecoPendenteRef = useRef<string | null>(null);

  // Perfil de saúde do membro logado, direto do servidor. Só para conta de membro: a conta de
  // cuidador não tem perfil de saúde.
  const ehMembro = usuario?.tipo === 'membro';
  useEffect(() => {
    if (!token || !ehMembro) {
      setMedicamentos([]);
      setCondicoesMedicas([]);
      setContatosEmergencia([]);
      setAlergias([]);
      return;
    }
    let ativo = true;
    setCarregandoPerfil(true);
    (async () => {
      try {
        let perfil = await buscarPerfilMembro(token);
        if (enderecoPendenteRef.current && !perfil.endereco) {
          perfil = await salvarPerfilMembro(token, { endereco: enderecoPendenteRef.current });
          enderecoPendenteRef.current = null;
        }
        if (!ativo) return;
        setMedicamentos(perfil.medicamentos);
        setCondicoesMedicas(perfil.condicoesMedicas);
        setContatosEmergencia(perfil.contatosEmergencia);
        setAlergias(perfil.alergias);
        setDadosPessoais((prev) => ({
          ...prev,
          idade: perfil.idade ?? 0,
          endereco: perfil.endereco ?? '',
          documentoStatus: perfil.documentoStatus,
        }));
      } catch {
        // Sem servidor: a tela mostra as listas vazias; cada ação de salvar avisa o erro.
      } finally {
        if (ativo) setCarregandoPerfil(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [token, ehMembro]);

  const exigirToken = useCallback((): string => {
    if (!token) throw new Error('Entre na sua conta para salvar suas informações');
    return token;
  }, [token]);

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCuidador[]>([]);
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(false);
  const [erroSolicitacoes, setErroSolicitacoes] = useState<string | null>(null);

  const [preferencias, setPreferencias] = useState<PreferenciasApp>({
    notificacoes: true,
    lembretes: true,
    localizacao: false,
    modoAcessivel: false,
    consentimentoSaude: true,
  });

  const [denuncias, setDenuncias] = useState<DenunciaRegistrada[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // As contratações vêm do back-end: são a MESMA linha que o cuidador enxerga na área dele. Quem
  // move o status daqui em diante é ele (aceitar/iniciar/concluir) — o app não simula mais nada.
  // Recarrega ao trocar de sessão (login/logout) e sempre que uma ação muda algo no servidor.
  const recarregarSolicitacoes = useCallback(async () => {
    if (!token) {
      setSolicitacoes([]);
      setErroSolicitacoes(null);
      return;
    }
    setCarregandoSolicitacoes(true);
    try {
      const dados = await listarSolicitacoes(token);
      setSolicitacoes(dados.map(solicitacaoDaApi));
      setErroSolicitacoes(null);
    } catch (erro) {
      // Erro fica visível em vez de silencioso: sem back-end, a lista vazia sozinha faria parecer
      // que o membro não tem nenhuma contratação.
      setErroSolicitacoes(erro instanceof Error ? erro.message : 'Não foi possível carregar suas contratações');
    } finally {
      setCarregandoSolicitacoes(false);
    }
  }, [token]);

  useEffect(() => {
    void recarregarSolicitacoes();
  }, [recarregarSolicitacoes]);

  const value = useMemo<AppContextValue>(
    () => ({
      dadosPessoais,
      atualizarDadosPessoais: async (dados) => {
        setDadosPessoais((prev) => ({ ...prev, ...dados }));
        const paraServidor = {
          ...(dados.endereco !== undefined ? { endereco: dados.endereco } : {}),
          ...(dados.idade !== undefined ? { idade: dados.idade || null } : {}),
        };
        if (Object.keys(paraServidor).length === 0) return;
        if (!token) {
          // Cadastro: a conta acabou de ser criada e o token ainda não chegou aqui.
          if (dados.endereco) enderecoPendenteRef.current = dados.endereco;
          return;
        }
        await salvarPerfilMembro(token, paraServidor);
      },

      carregandoPerfil,
      medicamentos,
      adicionarMedicamento: async (m) => {
        const criado = await adicionarMedicamentoApi(exigirToken(), m);
        setMedicamentos((prev) => [...prev, criado]);
      },
      editarMedicamento: async (id, m) => {
        const atualizado = await editarMedicamentoApi(exigirToken(), id, m);
        setMedicamentos((prev) => prev.map((item) => (item.id === id ? atualizado : item)));
      },
      removerMedicamento: async (id) => {
        await removerMedicamentoApi(exigirToken(), id);
        setMedicamentos((prev) => prev.filter((item) => item.id !== id));
      },
      toggleMedicamentoAtivo: async (id) => {
        const atual = medicamentos.find((item) => item.id === id);
        if (!atual) return;
        const atualizado = await editarMedicamentoApi(exigirToken(), id, { ativo: !atual.ativo });
        setMedicamentos((prev) => prev.map((item) => (item.id === id ? atualizado : item)));
      },

      condicoesMedicas,
      adicionarCondicaoMedica: async (nome) => {
        const criada = await adicionarCondicaoApi(exigirToken(), nome);
        setCondicoesMedicas((prev) => [...prev, criada]);
      },
      removerCondicaoMedica: async (id) => {
        await removerCondicaoApi(exigirToken(), id);
        setCondicoesMedicas((prev) => prev.filter((item) => item.id !== id));
      },

      // O servidor guarda a lista inteira (PUT /membro/perfil { alergias }) — manda a lista nova.
      alergias,
      adicionarAlergia: async (nome) => {
        const limpo = nome.trim();
        if (!limpo || alergias.some((a) => a.toLowerCase() === limpo.toLowerCase())) return;
        const salvo = await salvarPerfilMembro(exigirToken(), { alergias: [...alergias, limpo] });
        setAlergias(salvo.alergias);
      },
      removerAlergia: async (nome) => {
        const salvo = await salvarPerfilMembro(exigirToken(), { alergias: alergias.filter((a) => a !== nome) });
        setAlergias(salvo.alergias);
      },

      contatosEmergencia,
      // O servidor decide o "principal" (o 1º contato vira principal sozinho) — por isso a lista é
      // recarregada inteira depois de criar.
      adicionarContatoEmergencia: async (c) => {
        const t = exigirToken();
        await adicionarContatoApi(t, c);
        setContatosEmergencia((await buscarPerfilMembro(t)).contatosEmergencia);
      },
      editarContatoEmergencia: async (id, c) => {
        const atualizado = await editarContatoApi(exigirToken(), id, c);
        setContatosEmergencia((prev) => prev.map((item) => (item.id === id ? atualizado : item)));
      },
      removerContatoEmergencia: async (id) => {
        const t = exigirToken();
        await removerContatoApi(t, id);
        setContatosEmergencia((await buscarPerfilMembro(t)).contatosEmergencia);
      },
      definirContatoPrincipal: async (id) => {
        setContatosEmergencia(await definirContatoPrincipalApi(exigirToken(), id));
      },

      solicitacoes,
      carregandoSolicitacoes,
      erroSolicitacoes,
      recarregarSolicitacoes,
      criarSolicitacao: async ({ cuidadorId, inicioEm, fimEm, observacoes }) => {
        if (!token) throw new Error('Entre na sua conta para contratar um cuidador');
        const criada = await criarSolicitacaoApi(token, {
          cuidadorId,
          inicioEm: inicioEm.toISOString(),
          fimEm: fimEm.toISOString(),
          observacoes,
        });
        const mapeada = solicitacaoDaApi(criada);
        setSolicitacoes((prev) => [mapeada, ...prev]);
        return mapeada;
      },
      cancelarSolicitacao: async (id) => {
        if (!token) return;
        const atualizada = await cancelarSolicitacaoApi(token, id);
        setSolicitacoes((prev) =>
          prev.map((item) => (item.id === id ? solicitacaoDaApi(atualizada) : item))
        );
      },
      avaliarSolicitacao: async (id, avaliacao) => {
        const atualizada = await avaliarCuidadorApi(exigirToken(), id, {
          nota: avaliacao.nota,
          comentario: avaliacao.comentario,
        });
        setSolicitacoes((prev) => prev.map((item) => (item.id === id ? solicitacaoDaApi(atualizada) : item)));
      },
      iniciarPagamento: async (id, formaPagamento, cpf) => {
        if (!token) throw new Error('Entre na sua conta para pagar');
        return iniciarPagamentoSolicitacao(token, id, formaPagamento, cpf);
      },

      preferencias,
      atualizarPreferencias: (p) => setPreferencias((prev) => ({ ...prev, ...p })),

      denuncias,
      registrarDenuncia: (d) =>
        setDenuncias((prev) => [
          ...prev,
          { ...d, id: gerarId('den'), data: new Date().toISOString() },
        ]),

      carrinho,
      adicionarAoCarrinho: (produtoId, quantidade = 1) =>
        setCarrinho((prev) => {
          const existente = prev.find((item) => item.produtoId === produtoId);
          if (existente) {
            return prev.map((item) =>
              item.produtoId === produtoId ? { ...item, quantidade: item.quantidade + quantidade } : item
            );
          }
          return [...prev, { produtoId, quantidade }];
        }),
      removerDoCarrinho: (produtoId) =>
        setCarrinho((prev) => prev.filter((item) => item.produtoId !== produtoId)),
      alterarQuantidade: (produtoId, quantidade) =>
        setCarrinho((prev) => {
          if (quantidade <= 0) {
            return prev.filter((item) => item.produtoId !== produtoId);
          }
          return prev.map((item) => (item.produtoId === produtoId ? { ...item, quantidade } : item));
        }),
      limparCarrinho: () => setCarrinho([]),
    }),
    [
      dadosPessoais,
      carregandoPerfil,
      exigirToken,
      alergias,
      medicamentos,
      condicoesMedicas,
      contatosEmergencia,
      solicitacoes,
      carregandoSolicitacoes,
      erroSolicitacoes,
      recarregarSolicitacoes,
      token,
      preferencias,
      denuncias,
      carrinho,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}
