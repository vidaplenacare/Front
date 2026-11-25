import type { Profissional } from '../data/profissionais';

// IP local da máquina rodando o back-end (vida-plena-backend), na rede Wi-Fi. Se você trocar de
// rede ou de computador, descubra o IP atual com `ipconfig` (Windows) e atualize aqui — o celular
// só consegue conectar se estiver na mesma rede Wi-Fi que a máquina do back-end.
export const API_BASE_URL = 'http://192.168.0.151:3000';

// Erro de API com o status HTTP preservado: a tela precisa distinguir "esse horário acabou de ser
// reservado" (409) de uma falha genérica, e a mensagem vem do próprio back-end (campo `erro`).
export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    mensagem: string,
    // Código de máquina opcional vindo do back-end (campo `codigo`), ex.: CPF_OBRIGATORIO.
    public readonly codigo?: string,
  ) {
    super(mensagem);
    this.name = 'ErroApi';
  }
}

async function requisicao<T>(
  caminho: string,
  opcoes: { metodo?: string; token?: string | null; corpo?: unknown } = {}
): Promise<T> {
  const { metodo = 'GET', token, corpo } = opcoes;

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.json().catch(() => null);
    throw new ErroApi(resposta.status, detalhe?.erro ?? 'Falha na comunicação com o servidor', detalhe?.codigo);
  }
  // 204 (usado nos DELETE) não tem corpo — `json()` explodiria.
  if (resposta.status === 204) return undefined as T;
  return resposta.json();
}

export async function buscarProfissionais(): Promise<Profissional[]> {
  const resposta = await fetch(`${API_BASE_URL}/profissionais`);
  if (!resposta.ok) {
    throw new Error('Falha ao buscar profissionais');
  }
  return resposta.json();
}

/** Um profissional do catálogo, direto do servidor (`null` se não existir). Ver `useProfissional`. */
export async function buscarProfissional(id: string): Promise<Profissional | null> {
  const resposta = await fetch(`${API_BASE_URL}/profissionais/${encodeURIComponent(id)}`);
  if (resposta.status === 404) return null;
  if (!resposta.ok) throw new Error('Falha ao buscar o profissional');
  return resposta.json();
}

// Groundwork para push remoto de verdade (ver INTEGRACOES-EXTERNAS.md #1) — hoje só é chamada se
// o dispositivo conseguir gerar um Expo push token (não acontece em Expo Go no Android desde a
// SDK 53). Enviar a notificação de fato a partir desse token ainda não está implementado.
export async function registrarPushToken(token: string): Promise<void> {
  const resposta = await fetch(`${API_BASE_URL}/push-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!resposta.ok) {
    throw new Error('Falha ao registrar push token');
  }
}

export type StatusSolicitacaoApi =
  | 'pendente'
  | 'aceita'
  | 'em_andamento'
  | 'concluida'
  | 'recusada'
  | 'cancelada';

export type FormaPagamentoApi = 'pix' | 'cartao';
// `cancelado` (2026-09-30): solicitação encerrada sem nunca ter sido paga.
export type StatusPagamentoApi = 'pendente' | 'pago' | 'liberado' | 'estornado' | 'cancelado';

export interface AvaliacaoApi {
  autor: 'membro' | 'cuidador';
  nota: number;
  comentario: string | null;
  criadoEm: string;
}

/** Membro avalia o cuidador de um atendimento concluído. Devolve a solicitação atualizada. */
export function avaliarCuidadorApi(
  token: string,
  solicitacaoId: string,
  dados: { nota: number; comentario?: string }
): Promise<SolicitacaoApi> {
  return requisicao<SolicitacaoApi>(`/solicitacoes/${solicitacaoId}/avaliacao`, { metodo: 'POST', token, corpo: dados });
}

/** Cuidador avalia a família de um atendimento concluído. Devolve a solicitação atualizada. */
export function avaliarFamiliaApi(
  token: string,
  solicitacaoId: string,
  dados: { nota: number; comentario?: string }
): Promise<SolicitacaoApi> {
  return requisicao<SolicitacaoApi>(`/cuidador/solicitacoes/${solicitacaoId}/avaliacao`, { metodo: 'POST', token, corpo: dados });
}

export interface PagamentoApi {
  id: string;
  solicitacaoId: string;
  valor: number;
  forma: FormaPagamentoApi | null;
  status: StatusPagamentoApi;
  pagoEm: string | null;
  liberadoEm: string | null;
}

// Uma contratação. É a MESMA linha que o membro e o cuidador enxergam, cada um pela sua área —
// não são dois registros diferentes.
export interface SolicitacaoApi {
  id: string;
  cuidadorId: string;
  usuarioId: string | null;
  membroNome: string;
  status: StatusSolicitacaoApi;
  observacoes: string | null;
  inicioEm: string;
  fimEm: string;
  valorHora: number;
  valorTotal: number;
  ultimaLatitude: number | null;
  ultimaLongitude: number | null;
  atualizadoEm: string | null;
  criadoEm: string;
  avisoEnviadoEm: string | null;
  compartilhamentoAutorizado: boolean;
  // Selfie que o cuidador tirou ao iniciar (chave para `fonteDaFoto`) — o membro compara com a
  // foto do perfil para ter certeza de quem chegou (2026-09-30).
  selfieInicio?: string | null;
  selfieInicioEm?: string | null;
  pagamento?: PagamentoApi | null;
  /** O membro, como o cuidador vê na lista: nome, foto e idade (2026-09-30). */
  usuario?: { nome: string; fotoPerfil: string | null; membro: { idade: number | null } | null } | null;
  /** Avaliações das duas pontas do atendimento (2026-09-30). */
  avaliacoes?: AvaliacaoApi[];
  // Vem junto na resposta para o app não ter que cruzar com a lista de profissionais.
  cuidador?: {
    id: string;
    nome: string;
    foto: string;
    especialidade: string;
    telefone: string;
    valorVisita: number;
  } | null;
}

// Busca a última posição conhecida de uma solicitação real (sistema de GPS), pra tela do mapa
// ter algo pra mostrar antes do primeiro ping ao vivo chegar via Socket.IO.
export async function buscarSolicitacao(id: string): Promise<SolicitacaoApi | null> {
  const resposta = await fetch(`${API_BASE_URL}/solicitacoes/${id}`);
  if (resposta.status === 404) return null;
  if (!resposta.ok) {
    throw new Error('Falha ao buscar solicitação');
  }
  return resposta.json();
}

// --- Agenda do profissional (o que a tela de contratação usa para riscar horários ocupados) ---

export interface FaixaOcupadaApi {
  inicioEm: string;
  fimEm: string;
}

export interface AgendaApi {
  cuidadorId: string;
  de: string;
  ate: string;
  expediente: { diasDisponiveis: number[]; horarioInicio: string; horarioFim: string };
  ocupado: FaixaOcupadaApi[];
}

export function buscarAgenda(cuidadorId: string, de?: string, ate?: string): Promise<AgendaApi> {
  const parametros = new URLSearchParams();
  if (de) parametros.set('de', de);
  if (ate) parametros.set('ate', ate);
  const query = parametros.toString();
  return requisicao<AgendaApi>(`/profissionais/${cuidadorId}/agenda${query ? `?${query}` : ''}`);
}

// --- Contratações do membro ---

export function listarSolicitacoes(token: string): Promise<SolicitacaoApi[]> {
  return requisicao<SolicitacaoApi[]>('/solicitacoes', { token });
}

export function criarSolicitacao(
  token: string,
  dados: { cuidadorId: string; inicioEm: string; fimEm: string; observacoes?: string }
): Promise<SolicitacaoApi> {
  return requisicao<SolicitacaoApi>('/solicitacoes', { metodo: 'POST', token, corpo: dados });
}

export interface InicioPagamentoApi {
  pagamento: PagamentoApi;
  // Só vem quando forma = 'pix': o QR code e o "copia e cola" da cobrança real na Asaas.
  pix: { copiaECola: string; qrCodeBase64: string; expiraEm: string } | null;
  // Página de pagamento da Asaas — é por ela que o membro paga com cartão.
  urlPagamento: string | null;
}

// Pede a cobrança ao back-end (que cria na Asaas, ou devolve a mesma se já existir). NÃO confirma o
// pagamento: quem confirma é o webhook da Asaas no servidor — o app só acompanha o status.
// `cpf` só é necessário quando o back-end responde CPF_OBRIGATORIO (membro cadastrado sem CPF).
export function iniciarPagamentoSolicitacao(
  token: string,
  solicitacaoId: string,
  forma: FormaPagamentoApi,
  cpf?: string
): Promise<InicioPagamentoApi> {
  return requisicao<InicioPagamentoApi>(`/solicitacoes/${solicitacaoId}/pagamento`, {
    metodo: 'POST',
    token,
    corpo: { forma, ...(cpf ? { cpf } : {}) },
  });
}

export function cancelarSolicitacaoApi(token: string, solicitacaoId: string): Promise<SolicitacaoApi> {
  return requisicao<SolicitacaoApi>(`/solicitacoes/${solicitacaoId}/cancelar`, {
    metodo: 'POST',
    token,
  });
}

// --- Lado do cuidador (mesmas contratações, outra visão) ---

export function listarSolicitacoesRecebidas(token: string): Promise<SolicitacaoApi[]> {
  return requisicao<SolicitacaoApi[]>('/cuidador/solicitacoes', { token });
}

export type AcaoCuidador = 'aceitar' | 'recusar' | 'iniciar' | 'concluir' | 'cancelar';

export function agirNaSolicitacao(
  token: string,
  solicitacaoId: string,
  acao: AcaoCuidador,
  // `iniciar` exige `selfieBase64`: a verificação do rosto antes de liberar o atendimento
  // (2026-09-30). O back-end compara com a foto da verificação profissional.
  corpo?: { selfieBase64?: string }
): Promise<SolicitacaoApi> {
  return requisicao<SolicitacaoApi>(`/cuidador/solicitacoes/${solicitacaoId}/${acao}`, {
    metodo: 'POST',
    token,
    corpo,
  });
}

// ---- Fotos (2026-09-30) ------------------------------------------------------------------------
// Só pela câmera do app, na hora. O back-end guarda o arquivo e devolve uma chave
// ("perfil/<uuid>.jpg"), que as telas transformam em imagem com `fonteDaFoto`.

export function enviarFotoPerfil(
  token: string,
  imagemBase64: string
): Promise<{ fotoPerfil: string; fotoPerfilEm: string }> {
  return requisicao('/fotos/perfil', { metodo: 'POST', token, corpo: { imagemBase64 } });
}

/**
 * Converte o que o banco guarda em algo que o `<Image>` entende. Chave do nosso armazenamento →
 * URL do back-end com o token em `?token=` (as fotos não são públicas). ⚠️ Não usar
 * `source.headers`: no Android/Expo Go o <Image> não mandou o cabeçalho (2026-09-30). O back-end
 * só aceita token na URL nas rotas GET /fotos (`autenticarImagem`). Endereço completo (fotos de
 * demonstração dos seeds) → usado direto. Vazio → `null` (a tela mostra as iniciais).
 */
export function fonteDaFoto(foto: string | null | undefined, token: string | null): { uri: string } | null {
  if (!foto) return null;
  if (/^https?:\/\//.test(foto)) return { uri: foto };
  if (!token) return null;
  return { uri: `${API_BASE_URL}/fotos/${foto}?token=${encodeURIComponent(token)}` };
}

// A ficha do membro que o cuidador vai atender. Campos sensíveis vêm nulos/vazios enquanto a
// solicitação está `pendente` — o back-end só libera endereço, telefone, medicamentos e contatos
// depois que o cuidador aceita.
export interface FichaMembroApi {
  solicitacaoId: string;
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

export function buscarFichaDoMembro(token: string, solicitacaoId: string): Promise<FichaMembroApi> {
  return requisicao<FichaMembroApi>(`/cuidador/solicitacoes/${solicitacaoId}/ficha`, { token });
}

export interface ResgateApi {
  id: string;
  valor: number;
  chavePix: string;
  status: 'processando' | 'concluido' | 'falhou';
  motivoFalha: string | null;
  criadoEm: string;
  concluidoEm: string | null;
}

export interface SaldoCuidadorApi {
  saldoDisponivel: number;
  chavePix: string | null;
  // Se o cuidador já criou a senha de 6 dígitos exigida em todo resgate.
  temSenhaResgate: boolean;
  resgates: ResgateApi[];
}

export function buscarSaldoCuidador(token: string): Promise<SaldoCuidadorApi> {
  return requisicao<SaldoCuidadorApi>('/cuidador/saldo', { token });
}

// Erros com `codigo` que a tela trata: SENHA_RESGATE_NAO_DEFINIDA, SENHA_RESGATE_INCORRETA (vem com
// quantas tentativas restam na mensagem) e SENHA_RESGATE_BLOQUEADA (5 erros seguidos = 15 min).
export function solicitarResgateApi(token: string, senhaResgate: string): Promise<ResgateApi> {
  return requisicao<ResgateApi>('/cuidador/resgates', { metodo: 'POST', token, corpo: { senhaResgate } });
}

// Cria a senha de resgate (primeira vez) ou troca (aí `senhaAtual` é obrigatória).
export function definirSenhaResgateApi(
  token: string,
  novaSenha: string,
  senhaAtual?: string
): Promise<{ temSenhaResgate: boolean }> {
  return requisicao<{ temSenhaResgate: boolean }>('/cuidador/senha-resgate', {
    metodo: 'POST',
    token,
    corpo: { novaSenha, ...(senhaAtual ? { senhaAtual } : {}) },
  });
}

export function salvarPerfilPublicoCuidador(
  token: string,
  dados: {
    especialidade: string;
    categoria: string;
    experiencia?: string;
    bio?: string;
    formacao?: string;
    areasAtuacao?: string[];
    disponibilidade?: string;
    diasDisponiveis: number[];
    horarioInicio: string;
    horarioFim: string;
    valorHora: number;
    foto?: string;
    telefone?: string;
  }
): Promise<Profissional> {
  return requisicao<Profissional>('/cuidador/perfil', { metodo: 'PUT', token, corpo: dados });
}

// --- Perfil e saúde do membro ---

export interface CondicaoMedicaApi {
  id: string;
  nome: string;
}

export interface MedicamentoApi {
  id: string;
  nome: string;
  dosagem: string;
  horarios: string[];
  ativo: boolean;
}

export interface ContatoEmergenciaApi {
  id: string;
  nome: string;
  relacao: string;
  telefone: string;
  principal: boolean;
}

export interface PerfilMembroApi {
  id: string;
  idade: number | null;
  fotoUrl: string | null;
  endereco: string | null;
  alergias: string[];
  documentoStatus: 'pendente' | 'verificado';
  condicoesMedicas: CondicaoMedicaApi[];
  medicamentos: MedicamentoApi[];
  contatosEmergencia: ContatoEmergenciaApi[];
}

export function buscarPerfilMembro(token: string): Promise<PerfilMembroApi> {
  return requisicao<PerfilMembroApi>('/membro/perfil', { token });
}

export function salvarPerfilMembro(
  token: string,
  dados: { idade?: number | null; fotoUrl?: string; endereco?: string; alergias?: string[] }
): Promise<PerfilMembroApi> {
  return requisicao<PerfilMembroApi>('/membro/perfil', { metodo: 'PUT', token, corpo: dados });
}

export function adicionarCondicaoApi(token: string, nome: string): Promise<CondicaoMedicaApi> {
  return requisicao<CondicaoMedicaApi>('/membro/condicoes', { metodo: 'POST', token, corpo: { nome } });
}

export function removerCondicaoApi(token: string, id: string): Promise<void> {
  return requisicao<void>(`/membro/condicoes/${id}`, { metodo: 'DELETE', token });
}

export function adicionarMedicamentoApi(
  token: string,
  dados: { nome: string; dosagem: string; horarios: string[]; ativo?: boolean }
): Promise<MedicamentoApi> {
  return requisicao<MedicamentoApi>('/membro/medicamentos', { metodo: 'POST', token, corpo: dados });
}

export function editarMedicamentoApi(
  token: string,
  id: string,
  dados: { nome?: string; dosagem?: string; horarios?: string[]; ativo?: boolean }
): Promise<MedicamentoApi> {
  return requisicao<MedicamentoApi>(`/membro/medicamentos/${id}`, { metodo: 'PATCH', token, corpo: dados });
}

export function removerMedicamentoApi(token: string, id: string): Promise<void> {
  return requisicao<void>(`/membro/medicamentos/${id}`, { metodo: 'DELETE', token });
}

export function adicionarContatoApi(
  token: string,
  dados: { nome: string; relacao: string; telefone: string; principal?: boolean }
): Promise<ContatoEmergenciaApi> {
  return requisicao<ContatoEmergenciaApi>('/membro/contatos', { metodo: 'POST', token, corpo: dados });
}

export function definirContatoPrincipalApi(token: string, id: string): Promise<ContatoEmergenciaApi[]> {
  return requisicao<ContatoEmergenciaApi[]>(`/membro/contatos/${id}/principal`, { metodo: 'POST', token });
}

export function removerContatoApi(token: string, id: string): Promise<void> {
  return requisicao<void>(`/membro/contatos/${id}`, { metodo: 'DELETE', token });
}

export function editarContatoApi(
  token: string,
  id: string,
  dados: { nome?: string; relacao?: string; telefone?: string }
): Promise<ContatoEmergenciaApi> {
  return requisicao<ContatoEmergenciaApi>(`/membro/contatos/${id}`, { metodo: 'PATCH', token, corpo: dados });
}

export type CategoriaCuidadorApi = 'cuidador' | 'tecnico' | 'enfermeiro';
export type TipoDocumentoCadastroApi =
  | 'rg_cnh'
  | 'comprovante_endereco'
  | 'antecedentes_criminais'
  | 'certificado_cuidador'
  | 'coren_comprovante'
  | 'diploma'
  | 'situacao_cadastral';

export interface QuizRespostaApi {
  questaoId: string;
  respostaId: string;
  correta: boolean;
  critica: boolean;
}

export interface CadastroCuidadorPayload {
  // nome/telefone/email/categoria só são obrigatórios sem conta logada — com token, o back-end
  // usa os dados da conta e ignora o que vier aqui (ver services/api.ts `enviarCadastroCuidador`).
  nome?: string;
  cpf: string;
  telefone?: string;
  email?: string;
  categoria?: CategoriaCuidadorApi;
  corenNumero?: string;
  chavePix: string;
  aceiteResponsabilidade: boolean;
  documentosEnviados: TipoDocumentoCadastroApi[];
  quizRespostas: QuizRespostaApi[];
}

export interface CadastroCuidadorResultado {
  id: string;
  statusVerificacao: 'em_analise' | 'aprovado' | 'reprovado';
  motivos: string[];
}

// Motor de regras roda no back-end (src/validacao/) e decide aprovação/reprovação automaticamente
// — ver DEV-NOTES.md 2026-08-14. CPF/antecedentes/COREN hoje são adaptadores mock (nenhum
// provedor pago contratado ainda, ver INTEGRACOES-EXTERNAS.md #5). Desde 2026-08-15 essa
// verificação é opcional e feita depois do login (ver `CuidadorVerificacaoScreen.tsx`) — passar o
// `token` da sessão liga o resultado à conta.
export async function enviarCadastroCuidador(
  payload: CadastroCuidadorPayload,
  token?: string
): Promise<CadastroCuidadorResultado> {
  const resposta = await fetch(`${API_BASE_URL}/cuidadores-cadastro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!resposta.ok) {
    throw new Error('Falha ao enviar cadastro');
  }
  return resposta.json();
}

export async function buscarCadastroCuidador(id: string): Promise<CadastroCuidadorResultado | null> {
  const resposta = await fetch(`${API_BASE_URL}/cuidadores-cadastro/${id}`);
  if (resposta.status === 404) return null;
  if (!resposta.ok) {
    throw new Error('Falha ao buscar cadastro');
  }
  return resposta.json();
}

// Login real (ver DEV-NOTES.md 2026-08-15) — antes disso não existia conta persistida em lugar
// nenhum. `cpf` é opcional em ambos os cadastros de propósito: pedido do usuário pra não travar a
// criação da conta atrás de campos que só importam pra verificação profissional (opcional agora).
export type TipoUsuarioApi = 'membro' | 'cuidador';

export interface UsuarioApi {
  id: string;
  tipo: TipoUsuarioApi;
  nome: string;
  email: string;
  telefone: string;
  cpf: string | null;
  /** Chave da foto de perfil tirada pela câmera (ver `fonteDaFoto`), ou null se ainda não tirou. */
  fotoPerfil: string | null;
  criadoEm: string;
  ultimoLoginEm: string | null;
}

export interface CuidadorApi {
  id: string;
  usuarioId: string;
  categoria: CategoriaCuidadorApi;
  corenNumero: string | null;
  chavePix: string | null;
  statusVerificacao: 'em_analise' | 'aprovado' | 'reprovado';
  motivos: string[];
  // Id do perfil público (catálogo) desta conta, ou null se ainda não foi criado — é o que diz se
  // o cuidador já pode ser contratado. Vem no login e no /auth/me.
  perfilPublicoId?: string | null;
}

export interface SessaoApi {
  usuario: UsuarioApi;
  cuidador?: CuidadorApi;
  token: string;
}

async function postAuth(caminho: string, corpo: unknown): Promise<SessaoApi> {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.erro ?? 'Falha na autenticação');
  }
  return resposta.json();
}

export function cadastrarMembro(dados: {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cpf?: string;
  /** Versão dos termos que a pessoa aceitou no cadastro (`VERSAO_TERMOS`, data/termos.ts). */
  versaoTermos: string;
}): Promise<SessaoApi> {
  return postAuth('/auth/cadastro-membro', dados);
}

export function cadastrarCuidador(dados: {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  categoria: CategoriaCuidadorApi;
  cpf?: string;
  versaoTermos: string;
}): Promise<SessaoApi> {
  return postAuth('/auth/cadastro-cuidador', dados);
}

export function login(email: string, senha: string): Promise<SessaoApi> {
  return postAuth('/auth/login', { email, senha });
}

// Best-effort: não lança erro se falhar — sair da conta no aparelho não deveria travar por causa
// de uma falha de rede na revogação da sessão no servidor.
export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch {
    // silencioso de propósito
  }
}

// Usado no boot do app pra restaurar a sessão salva no aparelho — `null` em qualquer falha
// (token expirado/revogado, rede fora do ar) é tratado como "não tem sessão válida" pelo
// AuthContext, nunca deveria travar a inicialização do app.
export async function buscarUsuarioAtual(token: string): Promise<{ usuario: UsuarioApi; cuidador?: CuidadorApi } | null> {
  try {
    const resposta = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch {
    return null;
  }
}
