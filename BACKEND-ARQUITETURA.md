# Arquitetura de Back-end — Vida Plena

> Documento de planejamento para começar a separar o back-end do app (hoje 100% front-end
> mockado, estado local em `src/contexts/AppContext.tsx`). Serve de ponto de partida para o
> desenvolvedor que vai montar o banco de dados e a API real. Ver também
> [`INTEGRACOES-EXTERNAS.md`](./INTEGRACOES-EXTERNAS.md) para tudo que depende de provedor
> terceiro — este arquivo foca em modelo de dados, fluxos e decisões de infraestrutura própria.

## 1. Decisões já fechadas

- **Hospedagem**: DigitalOcean.
- **Banco de dados**: será definido depois, por outro desenvolvedor — este documento lista os
  *requisitos* que o schema precisa cobrir (seção 3), não prescreve o engine. Recomendação: seja
  qual for o engine relacional escolhido, o **DigitalOcean Managed Databases** (Postgres/MySQL
  gerenciado) evita ter que administrar backup/replicação manualmente.
- **Check-in/check-out do cuidador**: **manual** — o cuidador aperta um botão para
  iniciar/concluir o atendimento. Sem geofence automático nesta fase (decisão do usuário: mais
  simples de implementar e de prever comportamento; geofence pode virar uma camada de verificação
  numa fase 2, mas não é requisito agora).
- **Biometria (digital/facial) no login**: resolvida no dispositivo (`expo-local-authentication`),
  o back-end só participa guardando um refresh token liberado após aprovação local. Ver seção 10
  do `INTEGRACOES-EXTERNAS.md`.
- **Fase atual**: o back-end vai rodar "nos testes" primeiro (ambiente de desenvolvimento/staging,
  possivelmente com dados mockados ou um banco local simples) antes de existir um banco de
  produção definitivo — ou seja, a API deve ser construída de forma que trocar o banco por trás
  depois seja barato (repositório/camada de acesso a dados isolada da lógica de negócio, não SQL
  espalhado pelos controllers).

## 2. Decisões em aberto (não bloqueiam o início, mas precisam fechar antes de produção)

| Decisão | Depende de | Onde afeta |
|---|---|---|
| Engine do banco de dados | Outro desenvolvedor | Todo o schema (seção 3) |
| Runtime/framework do back-end | Recomendação: Node.js + TypeScript (mesma linguagem do app, tipos compartilháveis) | Todo o back-end |
| Provedor de push | Recomendação: Expo Push | Notificações (seção 6) |
| Provedor de mapas/geocodificação | Recomendação: Google Maps | Localização (seção 5) |
| Canal de tempo real (localização ao vivo) | Depende do banco escolhido | Localização (seção 5) |
| WhatsApp Business API | Em conversa externa do usuário | Notificações (seção 6) |
| Validação de CPF/antecedentes | Provedor a escolher | Cadastro de cuidador (seção 3.4) |
| Object storage para uploads | ✅ Decidido: Cloudflare R2 (2026-08-19, ver `INTEGRACOES-EXTERNAS.md` #7) | Cadastro de cuidador (seção 3.4) |

## 3. Modelo de dados

Extraído do que já existe mockado no front-end (`AppContext.tsx`, `data/profissionais.ts`,
`CuidadorCadastroScreen.tsx`) mais os campos novos que os fluxos de GPS/notificação exigem. Nomes
de campo aqui são sugestão de contrato — o dev do banco pode adaptar para a convenção do engine
escolhido, mas o **conteúdo/relação** deve ser preservado.

### 3.1. Conta e autenticação — ✅ implementado 2026-08-15 (ver DEV-NOTES.md)

```
Usuario
  id
  tipo                    # 'membro' | 'cuidador'
  nome
  email                   (único)
  senha_hash
  telefone
  cpf                     (único, NULLABLE — opcional de propósito, não trava o cadastro)
  criado_em
  ultimo_login_em

SessaoDispositivo
  id
  usuario_id              -> Usuario
  token_hash               # implementado como token opaco (não JWT); só o hash fica salvo
  criado_em
  revogado_em              (nullable)
```

Implementado em `vida-plena-backend/prisma/schema.prisma` (`Usuario`/`SessaoDispositivo`) +
`src/auth/` (hash de senha, geração/verificação de token, middleware `autenticar`/
`autenticacaoOpcional`) + rotas `src/routes/auth.ts`. Duas diferenças do que estava planejado
aqui: **sem `expo_push_token`/`biometria_habilitada` em `SessaoDispositivo`** ainda (o groundwork
de push token já existe separado, na tabela `PushToken`, sem ligação com `Usuario` ainda) e **sem
JWT** — token opaco simples, mais fácil de revogar (basta marcar `revogado_em`).

O gap de senha do cuidador (sinalizado aqui antes) está resolvido: `CuidadorCadastroScreen.tsx`
ganhou campo de senha e cria a conta direto — ver seção 3.4 abaixo e `DEV-NOTES.md` 2026-08-15
para o desenho completo (conta rápida, verificação profissional virou opcional/adiável).

### 3.2. Membro (hoje `DadosPessoais` no `AppContext`)

```
Membro                     (perfil estendido de Usuario tipo='membro')
  usuario_id               -> Usuario
  idade
  foto_url
  documento_status         # 'pendente' | 'verificado'

Endereco
  id
  membro_id                -> Membro
  logradouro, numero, complemento, bairro, cidade, uf, cep
  latitude, longitude       # geocodificado 1x no cadastro/edição (ver INTEGRACOES-EXTERNAS.md #2)
  principal                 # se o membro tiver mais de um endereço cadastrado no futuro
```

⚠️ Hoje `DadosPessoais.endereco` é uma string livre única
(`"Rua das Flores, 123 - São Paulo, SP"`). Precisa virar estruturado (acima) — é o ponto fixo
contra o qual a localização ao vivo do cuidador é comparada durante o atendimento.

```
Medicamento
  id, membro_id, nome, dosagem, ativo
MedicamentoHorario
  id, medicamento_id, horario                # 1 medicamento pode ter N horários/dia

CondicaoMedica
  id, membro_id, nome

ContatoEmergencia
  id, membro_id, nome, relacao, telefone, principal
  aceita_whatsapp                            # novo — usado quando WhatsApp for definido
  acompanhar_localizacao                     # novo — este contato recebe o acompanhamento por GPS também?
```

### 3.3. Preferências (hoje `PreferenciasApp` no `AppContext`)

```
PreferenciasMembro
  membro_id, notificacoes, lembretes, localizacao, modo_acessivel, consentimento_saude
```

O campo **`localizacao`** já existe e é exatamente o gancho para "essa opção poderá ser ativada
ou não dentro do perfil do usuário" que o usuário pediu — é o toggle mestre de "compartilhar meu
acompanhamento por GPS com os contatos de emergência marcados". Não precisa criar um conceito
novo, só decidir se o nome/rótulo na tela deve ficar mais explícito (ex.: "Compartilhar
localização do cuidador com a família") — isso é uma decisão de copy/UX para uma conversa
separada, não bloqueia o back-end.

### 3.4. Profissional/Cuidador (hoje `Profissional` em `data/profissionais.ts` + cadastro em `CuidadorCadastroScreen`)

```
Cuidador                   (perfil estendido de Usuario tipo='cuidador')
  usuario_id               -> Usuario
  categoria                # 'cuidador' | 'tecnico' | 'enfermeiro'
  especialidade, experiencia, bio, formacao
  foto_url
  avaliacao_media, total_avaliacoes
  nivel_ocupacao           # 'livre' | 'parcial' | 'lotado'  (hoje mock, futuramente calculado a partir da agenda real)
  valor_visita
  coren_numero             (nullable — só técnico/enfermeiro)
  status_verificacao       # 'em_analise' | 'aprovado' | 'reprovado'

CuidadorAreaAtuacao
  id, cuidador_id, descricao                 # N áreas de atuação por cuidador

CuidadorDisponibilidade
  id, cuidador_id, dia_semana (0-6), horario_inicio, horario_fim
  # substitui o array `diasDisponiveis` + par único horarioInicio/horarioFim do mock —
  # modelar por linha permite, no futuro, horários diferentes por dia (hoje o mock assume
  # o mesmo horário todo dia em que atende)

CuidadorDocumento
  id, cuidador_id, tipo     # 'rg_frente' | 'rg_verso' | 'cnh' | 'comprovante_endereco' |
                            # 'antecedentes_criminais' | 'certificado_cuidador' |
                            # 'coren_comprovante' | 'diploma'
  arquivo_url               # object storage, ver INTEGRACOES-EXTERNAS.md #7
  status                    # 'pendente' | 'aprovado' | 'reprovado'
  enviado_em

CuidadorQuizResposta
  id, cuidador_id, questao_id, resposta_id, correta (bool)
```

✅ **Atualizado 2026-08-15**: `Cuidador` acima também já existe de verdade agora (ver §3.1), mas
**bem mais enxuto** do que o desenhado aqui — só `usuario_id`, `categoria`, `coren_numero`,
`chave_pix`, `status_verificacao`, `motivos`. Decisão do usuário: criar conta de cuidador precisa
ser rápido (sem travar em documentos/quiz), então `especialidade`/`experiencia`/`bio`/`formacao`/
`foto_url`/`avaliacao_media`/`nivel_ocupacao`/`valor_visita`/disponibilidade continuam só no mock
do front-end (`CuidadorContext`) — ainda não migrados pro banco. `CadastroCuidador`/
`CadastroDocumento`/`CadastroQuizResposta` (2026-08-14, a verificação pesada) continuam existindo
como estavam, agora com `usuario_id` opcional: quando a verificação é enviada por alguém logado,
liga com a conta e sincroniza `Cuidador.status_verificacao`/`motivos`/`coren_numero`/`chave_pix` —
ver `DEV-NOTES.md` 2026-08-15 pro desenho completo (conta rápida + verificação opcional/adiável).

### 3.5. Solicitação de contratação (hoje `SolicitacaoCuidador` no `AppContext`) — precisa crescer bastante

```
Solicitacao
  id, membro_id, cuidador_id
  data_hora_agendada        # datetime real (hoje é `dataPreferida`+`horario` como strings soltas)
  observacoes
  status                    # 'pendente' | 'aceita' | 'recusada' | 'cancelada' |
                            #   'em_andamento' | 'concluida'   <- 2 status novos
  aviso_30min_enviado_em    (nullable) # marca que o job de aviso já disparou, evita duplicar
  check_in_em               (nullable) # timestamp do botão manual "Iniciar atendimento"
  check_out_em              (nullable) # timestamp do botão manual "Concluir atendimento"
  avaliacao_nota, avaliacao_comentario  (nullable)

LocalizacaoEvento
  id, solicitacao_id, latitude, longitude, registrado_em
  # 1 linha por ponto de GPS reportado pelo app do cuidador enquanto a solicitação está
  # 'em_andamento'. Serve tanto para desenhar a trilha no mapa em tempo real quanto para
  # auditoria depois (ex.: reclamação de que o cuidador não esteve no local).
```

Mudança de status em relação ao `StatusSolicitacao` atual do front-end
(`'pendente' | 'aceita' | 'recusada' | 'cancelada'`): precisa ganhar **`'em_andamento'`** (entre o
check-in e o check-out) e **`'concluida'`** (após o check-out) para o fluxo de acompanhamento
fazer sentido — hoje o mock não tem estado para "atendimento em curso".

⚠️ **Correção (2026-07-22)**: o check-in/out manual e os status `em_andamento`/`concluido` já
foram implementados no front-end, mas **só do lado do `CuidadorContext`**
(`PedidoRecebido.status`, botões "Iniciar atendimento"/"Concluir atendimento" em
`CuidadorPainelScreen`) — de propósito, para não criar uma ponte falsa entre os dois mocks
desconectados (ver nota abaixo). O `AppContext.SolicitacaoCuidador.status` do lado do membro
**continua só com os 4 valores originais** (`pendente`/`aceita`/`recusada`/`cancelada`) — a tabela
`Solicitacao` acima com os campos `check_in_em`/`check_out_em`/`em_andamento`/`concluida` é a
especificação de **como isso deve ficar no back-end real** (uma única fonte de verdade,
diferente do front-end mockado atual), não uma descrição do que já existe hoje no código.

### 3.6. Notificação (novo — log/auditoria)

```
NotificacaoEnviada
  id, usuario_id, canal      # 'push' | 'whatsapp'
  tipo                      # 'aviso_30min' | 'contratacao_confirmada' | 'check_in' | 'check_out'
  solicitacao_id            (nullable)
  enviado_em, entregue (bool, nullable)
```

Serve para: não duplicar envio (o job de "30min antes" varre solicitações e ignora as que já têm
uma `NotificacaoEnviada` do tipo certo), e para dar suporte/depuração ("o familiar diz que não
recebeu o aviso — foi enviado? entregue?").

## 4. Fluxo: aviso "30 minutos antes" + acompanhamento por GPS

1. Um **worker agendado** (cron, ex.: a cada 1-5min) varre `Solicitacao` com `status = 'aceita'` e
   `data_hora_agendada` entre agora e agora+30min, que ainda não têm `aviso_30min_enviado_em`.
2. Para cada uma: envia push para o **cuidador** ("sua localização será compartilhada com o
   contratante a partir de agora") e marca `aviso_30min_enviado_em`.
3. A partir desse momento, o app do cuidador passa a reportar posição (via canal de tempo real,
   seção 3 do `INTEGRACOES-EXTERNAS.md`) — mas só enquanto a `Solicitacao` está `'aceita'` ou
   `'em_andamento'`, nunca fora dessa janela (importante para bateria e para privacidade: o
   cuidador não deveria ser rastreado fora do horário do atendimento).
4. Cuidador aperta **"Iniciar atendimento"** → `check_in_em` preenchido, status vira
   `'em_andamento'`. App do membro passa a mostrar o mapa com a posição ao vivo.
5. Cuidador aperta **"Concluir atendimento"** → `check_out_em` preenchido, status vira
   `'concluida'`, envia-se push para o membro e para os `ContatoEmergencia` com
   `acompanhar_localizacao = true` avisando que o cuidador saiu. Localização ao vivo para de ser
   coletada/transmitida a partir daqui.

## 5. Fluxo: contratação → aviso ao familiar

1. Membro contrata um cuidador (`SolicitarContratacaoScreen` hoje só cria a `Solicitacao` local).
2. Quando `Solicitacao.status` vira `'aceita'` (o cuidador aceita — hoje não existe uma tela de
   "aceitar solicitação" no lado do cuidador, é um item de front-end ainda por construir), o
   back-end dispara notificação para os `ContatoEmergencia` do membro que tiverem
   `acompanhar_localizacao = true`, por push (se o contato também tiver conta no app) e/ou
   WhatsApp (quando definido — ver `INTEGRACOES-EXTERNAS.md` #4).
3. ⚠️ **Correção (2026-07-22)**: eu tinha registrado aqui, por engano, que não existia tela do
   cuidador para aceitar/recusar solicitação — **isso já existia** (card "Pedidos recebidos" em
   `CuidadorPainelScreen`, via `CuidadorContext.aceitarPedido`/`recusarPedido`). O que realmente
   faltava — e foi desenhado nesta data — era o **check-in/check-out manual** depois de aceitar
   (`iniciarAtendimento`/`concluirAtendimento`, status `em_andamento`/`concluido`) e a **tela de
   mapa de acompanhamento** do lado do membro (`AcompanharCuidadorScreen`, acessível pelo botão
   "Acompanhar no mapa" em `PerfilScreen` → "Cuidadores Solicitados", quando `status === 'aceita'`).
   O mapa usa `react-native-maps` com coordenadas e movimento **simulados** (não há GPS real nem
   ligação entre os dois contextos mockados) — ver `INTEGRACOES-EXTERNAS.md` #2 para o estado da
   dependência/chave de API.

## 6. Notificações — tipos e gatilhos (resumo)

| Tipo | Canal | Gatilho |
|---|---|---|
| Aviso 30min antes | Push (cuidador) | Worker agendado, seção 4 |
| Contratação confirmada | Push + WhatsApp (familiar) | Mudança de status para `'aceita'`, seção 5 |
| Check-in | Push (membro) | Cuidador aperta "Iniciar atendimento" |
| Check-out | Push + WhatsApp (membro/familiar) | Cuidador aperta "Concluir atendimento" |
| Lembrete de medicamento | Push (membro) | Já existe como lógica local no front (`HomeScreen`); vira job agendado real no back-end |

## 7. Próximos passos sugeridos

1. Fechar as decisões 🟡 da seção 2 que bloqueiam começar a codar (runtime do back-end e engine de
   banco são as duas que mais travam o resto).
2. Repassar este documento + `INTEGRACOES-EXTERNAS.md` para o desenvolvedor responsável pelo
   banco, como especificação de entidades/relacionamentos.
3. Desenhar (ainda em front-end, mockado) as telas que faltam para o fluxo funcionar de ponta a
   ponta: tela do cuidador para aceitar/recusar solicitação, botões de "Iniciar atendimento"/
   "Concluir atendimento", e a tela de mapa de acompanhamento em si — nenhuma delas existe ainda
   no app. Consistente com o pedido anterior do usuário de fechar o desenho de todas as telas
   antes de acoplar o back-end de verdade.
