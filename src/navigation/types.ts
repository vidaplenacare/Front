import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CategoriaProfissional } from '../data/profissionais';
import type { IdTermo } from '../data/termos';
import type { Area } from '../theme';

export type PerfilSecao =
  | 'dadosPessoais'
  | 'medicamentos'
  | 'condicoes'
  | 'contatos'
  | 'cuidadoresSolicitados'
  | 'preferencias';

export type DenunciaTipo = 'membro_para_cuidador' | 'cuidador_para_membro';

export type RootStackParamList = {
  // Área de acesso
  ColaboradorSeletor: undefined;
  Login: undefined;
  RecuperarSenha: undefined;
  CriarContaSeletor: undefined;
  CadastroMembro: undefined;
  CuidadorLogin: undefined;
  CuidadorCadastro: undefined;
  /** Leitura de um termo jurídico — aberta do cadastro e do perfil/painel das duas áreas. */
  Termo: { id: IdTermo; area?: Area };

  // Área do membro
  Home: undefined;
  CuidadoresCategoria: undefined;
  Cuidadores: { categoriaInicial?: 'todos' | CategoriaProfissional } | undefined;
  CuidadorPerfil: { cuidadorId: string };
  SolicitarContratacao: { cuidadorId: string };
  AcompanharCuidador: { solicitacaoId: string };
  PagarConsulta: { solicitacaoId: string };
  Pagamentos: undefined;
  Produtos: undefined;
  ProdutoDetalhe: { produtoId: string };
  Carrinho: undefined;
  Dicas: undefined;
  DicaDetalhe: { dicaId: string };
  Notificacoes: undefined;
  Denuncia: { tipo: DenunciaTipo; alvoId?: string; alvoNome?: string };
  Perfil: { secao?: PerfilSecao } | undefined;
  Configuracoes: undefined;
  EmConstrucao: { titulo: string; mensagem?: string; accentColor?: string };

  // Área do colaborador
  CuidadorPainel: undefined;
  CuidadorVerificacao: undefined;
  CuidadorCompletarPerfil: undefined;
  CuidadorGanhos: undefined;
  CuidadorNotificacoes: undefined;
  PedidosRecebidos: undefined;
  PedidoDetalhe: { pedidoId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
