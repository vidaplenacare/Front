# Integrações Externas — Vida Plena

> Catálogo de toda conexão com sistema externo (API de terceiro, serviço gerenciado, provedor
> pago) que o back-end vai precisar. Objetivo: nenhuma decisão de arquitetura tocar num provedor
> externo "de surpresa" — tudo que depende de terceiro está listado aqui, com o que já está
> decidido e o que ainda está em aberto.
>
> Convenção de status: ✅ Decidido · 🟡 Em aberto (decisão do usuário/equipe) · ⏳ Aguardando
> confirmação externa (ex.: aprovação de conta business).

## Resumo rápido

| # | Integração | Status | Usada em |
|---|---|---|---|
| 1 | Notificações push | 🟡 Provedor a definir (Expo Push recomendado) | Aviso 30min antes, confirmação de contratação, check-out |
| 2 | Mapas + Geocodificação | 🟡 `react-native-maps` instalado (2026-07-22), falta chave do Google Maps (Android) | Tela `AcompanharCuidadorScreen`, conversão de endereço → lat/lng |
| 3 | Canal de tempo real (localização ao vivo) | 🟡 Abordagem a definir | Acompanhamento do cuidador no mapa |
| 4 | WhatsApp Business API | 🟡 Em conversa com parceiro externo | Aviso ao familiar quando alguém é contratado |
| 5 | Validação de CPF / antecedentes criminais / COREN | 🟡 Motor de regras + mock implementados (2026-08-14), provedor real a definir | Cadastro de cuidador |
| 6 | API de informações de saúde | 🟡 Em definição pelo usuário | Área de cuidados/saúde (ainda não especificado no app) |
| 7 | Armazenamento de arquivos (uploads) | ✅ Decidido — Cloudflare R2 (2026-08-19) | Documentos do cadastro de cuidador, fotos de perfil |
| 8 | E-mail transacional | 🟡 Provedor a definir | Recuperação de senha (`RecuperarSenhaScreen`) |
| 9 | Pagamentos | 🟡 Não discutido ainda — sinalizado aqui | Cobrança do plano (`Plano`/faturamento, já existe no mock) |
| 10 | Biometria (digital/facial) | ✅ Decidido — é local, não externo | Login |

---

## 1. Notificações push

- **Para quê**: aviso ao cuidador 30min antes do horário marcado ("sua localização será
  compartilhada"), aviso ao familiar quando alguém é contratado, aviso de check-out manual do
  cuidador, lembretes de medicamento (já existe na tela Home/Perfil como mock local).
- **Candidato recomendado**: **Expo Push Notification Service** — o app já é Expo, então é o
  caminho de menor atrito (`expo-notifications` no cliente, back-end só faz um POST HTTP pra API
  da Expo, que fala com FCM/APNs por trás). Alternativa é integrar direto com FCM/APNs, mas isso
  significa reimplementar o que a Expo já resolve.
- **O que o back-end precisa guardar**: `expoPushToken` por dispositivo/usuário logado (tabela de
  tokens, um usuário pode ter mais de um aparelho).
- 🟡 Em aberto: nenhuma decisão pendente de terceiro (não depende de aprovação externa), só
  confirmar que vamos de fato usar Expo Push em vez de FCM/APNs direto.
- ⚠️ **Descoberta importante (2026-07-23)**: desde a **SDK 53 do Expo, o Expo Go no Android não
  suporta mais push notification remota** (só notificação local ainda funciona no Expo Go
  Android; iOS Expo Go continua suportando push remoto). Pra testar push remoto de verdade
  chegando no Android, precisa de um **development build** (gerado via EAS ou toolchain Android
  local) — não dá mais só com Expo Go. Isso não muda a recomendação de usar Expo Push Service no
  back-end (continua sendo o caminho certo), só muda **como testar** durante o desenvolvimento.
- **Implementado 2026-07-23 (groundwork, não testável via Expo Go Android ainda)**: back-end
  ganhou `model PushToken` (Prisma) + rota `POST /push-tokens` (upsert por token, já testada com
  `curl`, funcionando). App ganhou `src/services/notifications.ts` com
  `configurarNotificacoes()`/`notificarLocal()` — as notificações que o usuário vê **hoje** são
  **locais** (disparadas pelo próprio app quando uma solicitação muda de status), não remotas.
  `registrarPushToken` só é chamado se o dispositivo conseguir gerar um Expo push token de
  verdade (não deve conseguir em Expo Go Android, por causa da limitação acima) — envolvido em
  try/catch, falha em silêncio sem quebrar o app.
- 🟡 **Ainda falta**: enviar de fato um push via
  `POST https://exp.host/--/api/v2/push/send` a partir do back-end usando os tokens registrados —
  não construído ainda porque não dava pra confirmar funcionando sem um development build. Próximo
  passo claro quando esse build existir.
- ⚠️ **Reforçado 2026-07-31**: ao implementar o aviso de 30min antes do atendimento, o usuário
  pediu de novo que a notificação chegasse **mesmo com o app fechado** (cuidador e membro) — mesma
  necessidade que só push remoto de verdade resolve. Decisão explícita do usuário foi adiar mais
  uma vez ("Ainda não — quero só o que funciona no Expo Go por enquanto") e usar Socket.IO como
  substituto por ora (ver item 3, "Implementado 2026-07-31"). Esse é hoje o gap mais visível do
  produto: o aviso e o compartilhamento de GPS **não funcionam com o app fechado**, ao contrário do
  que o fluxo desenhado pelo usuário pede. Primeiro candidato a resolver quando um development
  build entrar em pauta.

## 2. Mapas + Geocodificação

- **Para quê**: (a) mostrar o cuidador se movendo num mapa dentro do app do contratante; (b)
  transformar o **endereço cadastrado** do membro (`DadosPessoais.endereco`, hoje um texto livre)
  em coordenadas (lat/lng) — é contra esse ponto fixo que a localização ao vivo do cuidador será
  comparada.
- **Candidatos**: Google Maps Platform (Maps SDK for Android/iOS + Geocoding API — ecossistema
  mais maduro, cobre React Native bem via `react-native-maps`) ou Mapbox (mais barato em alto
  volume, também tem SDK RN). Recomendação: **Google Maps**, pela cobertura de geocodificação de
  endereços brasileiros e integração mais direta com `react-native-maps`.
- ⚠️ **Implicação de dado**: `DadosPessoais.endereco` hoje é uma string livre
  (`"Rua das Flores, 123 - São Paulo, SP"`). Para funcionar como ponto de referência de geofence,
  precisa virar endereço estruturado (logradouro/número/bairro/cidade/UF/CEP) + lat/lng
  geocodificados uma vez no cadastro/edição — não em toda comparação (evita custo de API repetido).
- 🟡 Em aberto: escolha final do provedor (Google vs Mapbox) e se a geocodificação roda no
  cadastro do endereço (uma vez) ou é recalculada periodicamente.
- **Atualização 2026-07-22**: `react-native-maps` já foi instalado e a tela
  `AcompanharCuidadorScreen` já usa `MapView`/`Marker`/`Polyline` — mas com **coordenadas
  mockadas** (constantes fixas no código, não geocodificadas a partir do endereço real) e
  **movimento simulado** (interpolação local, sem GPS de verdade). `app.json` já tem
  `android.config.googleMaps.apiKey` com um valor placeholder
  (`"ADICIONAR_CHAVE_DO_GOOGLE_MAPS_AQUI"`) — sem uma chave real do Google Maps, os tiles do mapa
  **não renderizam no Android** (fica em branco/cinza ou com erro), embora os marcadores e a
  lógica de navegação continuem funcionando e sejam verificáveis. iOS não precisa de chave (usa
  Apple Maps por padrão).
- **Atualização 2026-07-23**: usuário testou e confirmou que o mapa realmente ficava sem ruas no
  Android (esperado, ver acima). Solução aplicada **enquanto a chave do Google não sai**: tiles do
  **OpenStreetMap** via `<UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />`
  (do próprio `react-native-maps`, não é dependência nova) — não exige nenhuma chave de API,
  mostra ruas de verdade imediatamente. ⚠️ Tiles públicos do OSM têm política de uso que
  desaconselha tráfego pesado de produção sem servidor de tiles próprio — aceitável para
  dev/demo/testes, mas **revisar antes de um lançamento real**: trocar para Google Maps (com
  chave) ou Mapbox, ou hospedar tiles próprios. Trocar de volta pro Google Maps depois é só tirar
  o `<UrlTile>` e configurar a chave em `app.json` — não muda mais nada na tela.
- Endereço do membro (`DadosPessoais.endereco`) agora é coletado no cadastro
  (`CadastroMembroScreen`, campo obrigatório) e exibido como texto na tela do mapa — mas a
  **geocodificação real continua pendente** (o pino no mapa ainda usa uma coordenada mockada fixa,
  não o endereço digitado). Ver `BACKEND-ARQUITETURA.md` seção 3.2.

## 3. Canal de tempo real (localização ao vivo)

- **Para quê**: levar a coordenada do cuidador até o mapa do contratante conforme ele se move,
  durante a janela em que o serviço está ativo (após o aviso de 30min, até o check-out).
- Isso **não é necessariamente uma API de terceiro** — é uma decisão de infraestrutura:
  - Se o banco escolhido pelo outro dev for **Postgres com Supabase Realtime** → resolve de graça.
  - Se for um Postgres "puro" na DigitalOcean → precisa de um serviço à parte: WebSocket próprio
    (ex.: um servidor Node com `ws`/`socket.io`) ou um serviço gerenciado (Pusher, Ably).
  - Firebase Realtime Database/Firestore também resolveriam nativamente, mas o usuário já decidiu
    DigitalOcean como plataforma de hospedagem — Firebase ficaria "por fora" desse ecossistema.
- ⚠️ **Restrição de plataforma importante, independente do provedor escolhido**: localização em
  **background** no iOS (app fechado/minimizado) exige uma justificativa forte na revisão da App
  Store (`NSLocationAlwaysAndWhenInUseUsageDescription` + modo "Always") — apps de rastreamento
  tipo Uber conseguem aprovação, mas é revisão manual da Apple, não é automático. Precisa estar no
  radar do time desde já, não é só "configurar uma permissão".
- 🟡 Em aberto: depende da decisão de banco de dados (item ainda não definido pelo outro dev) — só
  dá pra fechar depois que soubermos qual Postgres/serviço será usado.
- **Implementado 2026-07-31**: escolhido **Socket.IO** (servidor Node com `socket.io`, não
  Supabase Realtime nem serviço gerenciado) — o back-end já é um servidor Node/Express próprio,
  então adicionar Socket.IO nele foi o caminho de menor atrito. `server.ts` agora cria um
  `http.Server` explícito (Socket.IO precisa disso, não se anexa direto ao app Express) +
  `new Server(httpServer)`; `src/realtime.ts` trata dois eventos (`entrar-sala`,
  `atualizar-localizacao`) e retransmite pra sala (`io.to(solicitacaoId).emit(...)`). Testado de
  ponta a ponta com dois clientes `socket.io-client` simulados — funciona.
- ⚠️ **Confirmado por pesquisa (2026-07-31)**: a restrição de localização em background do item
  acima é ainda mais séria do que só App Store review — **o Expo Go nem consegue rodar
  `expo-location` + `TaskManager` em background, em nenhuma plataforma** (mesma limitação do push
  notification remoto). Por isso o GPS implementado agora captura localização só em **primeiro
  plano** (`Location.watchPositionAsync`, com o app aberto) — background fica para quando houver
  development build.
- Modelo de dados mínimo criado no Prisma (`Solicitacao`/`LocalizacaoPing`, ver `DEV-NOTES.md`
  2026-07-31) — cobre só "última posição" + histórico de pings, não o modelo completo de
  solicitação/contratação do `BACKEND-ARQUITETURA.md` (que depende de autenticação real, ainda não
  implementada).
- **Implementado 2026-07-31 (aviso 30min/15min)**: o gatilho de compartilhamento agora é baseado
  em `Solicitacao.dataHoraAgendada`, não mais em ação manual. `src/scheduler.ts` faz polling (20s)
  e emite `aviso-30min` pela mesma sala Socket.IO quando falta `AVISO_MINUTOS_ANTES` (`.env`,
  default 30) pro horário marcado; o cuidador aceita via `Alert.alert` no `CuidadorPainelScreen`,
  e o envio de GPS de fato começa sozinho aos `INICIO_COMPARTILHAMENTO_MINUTOS_ANTES` (default 15).
  ⚠️ **Mesma restrição de fundo continua valendo**: como isso viaja por Socket.IO (não push
  remoto), só chega em quem estiver com o app aberto — usuário pediu explicitamente que
  funcionasse com o app fechado também, mas decidiu adiar isso de novo em vez de partir pra
  development build agora (ver item 1 abaixo, mesma decisão). Testado com um listener conectado
  **antes** do disparo, recebendo o evento ao vivo (não só verificado o estado final no banco).

## 4. WhatsApp Business API

- **Para quê**: avisar o familiar cadastrado (com número de WhatsApp) quando um cuidador é
  contratado para o membro, e compartilhar o acompanhamento por localização com ele também.
- **Candidatos**: API oficial da Meta (WhatsApp Cloud API — grátis até certo volume, mas exige
  conta business verificada e templates de mensagem pré-aprovados pela Meta, processo que não é
  instantâneo) ou provedor terceirizado por cima dela (Twilio, Zenvia, Gupshup — mais rápido de
  configurar, cobra por mensagem).
- ⏳ **Status conforme o usuário**: ainda em conversa com o parceiro/equipe externa sobre qual
  caminho seguir — **não implementar nada aqui até essa definição fechar**. Deixado registrado
  para não esquecer no meio do desenho do resto do sistema.
- Nota de dado: `ContatoEmergencia` já tem `telefone` — value ao adicionar (quando decidido) seria
  um campo tipo `aceitaWhatsapp: boolean` + o número (reaproveitando `telefone` se for o mesmo, ou
  campo separado se o WhatsApp puder ser diferente do telefone de contato).

## 5. Validação de CPF / antecedentes criminais

- **Para quê**: a Etapa 3 do cadastro de cuidador (`CuidadorCadastroScreen`) já pede upload de
  "certidão de antecedentes criminais" — hoje é só um mock de upload de arquivo
  (`antecedentesEnviado: boolean`), sem validação nenhuma por trás.
- **Candidatos** (mercado brasileiro de background check): consulta de CPF via Receita Federal
  (serviço público, mas limitado/lento para uso comercial em volume) ou provedores comerciais de
  consulta (Bhub, Neoway, SintegraWS, Serasa Experian, ScoreCred, entre outros) que agregam CPF +
  antecedentes + óbito + outras bases num único endpoint.
- ⚠️ **LGPD**: antecedentes criminais são dado sensível. Precisa de consentimento explícito e
  registrado do cuidador antes da consulta (o app já tem o padrão de toggle de consentimento em
  `preferencias.consentimentoSaude` no `AppContext` — o mesmo conceito se aplica aqui, um
  checkbox de consentimento específico para essa consulta, com timestamp registrado).
- 🟡 Em aberto: provedor específico ainda não escolhido — o usuário sinalizou que vai estruturar
  isso, mas ainda não fechou com quem.
- **Implementado 2026-08-14 (mock, ver DEV-NOTES.md)**: motor de regras real no back-end
  (`vida-plena-backend/src/validacao/`), decidindo aprovação/reprovação automaticamente por
  categoria (Cuidador/Técnico/Enfermeiro têm critérios diferentes) sem precisar de aprovação
  manual da equipe. `validarChecksumCpf` é validação real (algoritmo do dígito verificador, não
  depende de provedor). `consultarAntecedentes` e `consultarCoren` (este último cobre a consulta
  ao conselho de enfermagem, item que nem estava listado aqui antes) são **adaptadores mock**,
  com regra de teste arbitrária documentada no próprio código — trocar o corpo dessas duas
  funções pela chamada real ao provedor escolhido (a assinatura já é a interface esperada).
- 🟡 Nota adicionada: consulta ao **COREN/COFEN** (registro ativo de técnico/enfermeiro) também
  precisa de provedor — não achei uma API pública oficial pronta pra isso, provavelmente exige
  scraping do portal público do conselho ou um provedor de terceiro que já agregue esse dado
  (alguns dos mesmos provedores de CPF/antecedentes cobrem isso). Mockado junto com o item acima.
- 🟡 **Selfie de verificação — em aberto, não implementada (2026-08-14)**: fazia parte da lista de
  critérios de aprovação que o usuário propôs, mas ficou de fora desta rodada porque a **decisão
  de abordagem ainda é dos donos do produto**: vendor pronto de biometria (Unico, idwall, CAF —
  compara selfie x documento automaticamente, mais caro/rápido de configurar) vs. construir uma
  verificação própria (mais barato, mais trabalho, decisão de produto/segurança que precisa ser
  tomada com cuidado). Diferente do item 10 abaixo (biometria de *login*, resolvida localmente no
  aparelho) — isso aqui é biometria de *KYC* (confirmar que a pessoa do cadastro é quem diz ser),
  sempre vai precisar sair do aparelho para algum tipo de verificação.

## 6. API de informações de saúde

- **Para quê**: mencionado pelo usuário como necessário para "a área de cuidados" — ainda não há
  uma tela no app hoje que consuma isso especificamente (as telas atuais de saúde são
  `Medicamentos`/`Condições Médicas`, que são só dados que o próprio membro cadastra, sem
  integração externa).
- 🟡 **Totalmente em aberto**: precisa de uma conversa separada para definir o que exatamente essa
  API vai fazer (ex.: validação de prontuário? Consulta de CID? Integração com prescrições
  digitais? Telemedicina?) antes de sequer cotar provedores. Registrado aqui só para não perder o
  requisito no meio do resto — **não é um item bloqueante para começar o resto do back-end**.

## 7. Armazenamento de arquivos (uploads)

- **Para quê**: documentos do cadastro de cuidador (RG/CNH frente e verso, comprovante de
  endereço, certidão de antecedentes, carteira COREN, diploma/certificado), e fotos de perfil de
  membros/cuidadores.
- ✅ **Decidido 2026-08-19: Cloudflare R2** (não DigitalOcean Spaces, apesar da hospedagem ser
  DigitalOcean) — comparado os dois pensando num MVP de até ~1.000 usuários: Spaces tem piso fixo
  de US$ 5/mês mesmo com pouco uso, R2 cobra só pelo que for usado (deve custar centavos/mês nesse
  volume) e não cobra taxa de saída (egress), ao contrário da maioria dos concorrentes. Continua
  compatível com S3 (`aws-sdk`/`@aws-sdk/client-s3` apontando pro endpoint da Cloudflare) — não
  muda nada na forma como o back-end integra. Ver `MAPA-APIS-PAGAS.md` §6 para a comparação
  completa.
- 🟡 **2026-09-30 — fotos já funcionam, mas numa pasta local do back-end (TEMPORÁRIO).** Foto de
  perfil (membro e cuidador), por câmera ou galeria, é guardada em `vida-plena-backend/uploads/`
  (ou `PASTA_UPLOADS`). **Antes de produção:
  contratar o R2 e trocar `salvarImagem`/`lerImagem` em `src/lib/armazenamento.ts`** — o resto
  (banco, rotas, app) não muda. Os documentos do cadastro continuam sem upload real.
- 🟡 **Identidade pelo rosto — plano definitivo (usuário, 2026-09-30), implementar junto com o
  R2:** (1) selfie na hora no **primeiro acesso** de membro e cuidador; (2) comparação por API de
  reconhecimento facial com o banco/documento (candidatos: Serpro Datavalid, Unico, idwall); (3)
  depois de confirmado, **login pelo rosto**, sem selfie por atendimento; (4) aí a foto de perfil
  volta a ser só pela câmera. **Hoje (provisório):** foto de perfil aceita câmera ou galeria, e não
  há selfie ao iniciar o atendimento.
- ⚠️ Documentos de identidade e antecedentes criminais são dado sensível — precisam de bucket
  privado (não público), URLs assinadas com expiração curta para o app exibir/baixar, e política
  de retenção definida (por quanto tempo guardar documento de um cuidador reprovado/inativo).

## 8. E-mail transacional

- **Para quê**: `RecuperarSenhaScreen` já existe no app e manda um "link de recuperação para
  {email}" — hoje é só texto mockado, precisa de um envio real por trás.
- **Candidatos**: Amazon SES (barato, integra bem se o resto for AWS-adjacent, mas exige
  configuração de domínio/DKIM), SendGrid, Postmark, Mailgun. Recomendação inicial: **Postmark ou
  SendGrid** — configuração mais simples que SES para um time pequeno, boa entregabilidade.
- 🟡 Em aberto: escolha do provedor.

## 9. Pagamentos

- **Para quê**: o app **não tem modelo de fatura/assinatura mensal** (o card "Plano e Faturamento"
  mockado na tela de Perfil não faz parte deste fluxo) — o modelo real é **pagamento por
  consulta**: o membro paga o valor da visita depois que o atendimento é concluído, e o cuidador
  acumula esse valor como ganho, resgatável (via Pix) quando quiser.
- Candidatos de mercado para cobrança no Brasil: Stripe (cartão internacional, Pix ainda
  limitado), Pagar.me, Iugu, Asaas (Pix + boleto + cartão, fortes no mercado brasileiro).
- **2026-08-14**: usuário sinalizou que **Asaas** é o candidato mais provável, especificamente
  para pagar os cuidadores (não só cobrar do membro) — Asaas tem subconta/split de pagamento, o
  que se encaixaria em repassar o valor da visita ao cuidador. Passo inicial dado:
  `CuidadorCadastroScreen.tsx` já coleta uma **chave Pix** no cadastro (`CadastroCuidador.
  chavePix` no back-end), mas é **só um campo salvo por enquanto** — decisão consciente do
  usuário de não criar subconta Asaas nem chamar API nenhuma do Asaas ainda nesse ponto. Quando o
  Asaas for de fato integrado, essa chave Pix é o dado que falta pra criar a subconta do
  cuidador.
- **2026-09-01**: enquanto a sandbox da Asaas está sendo criada, as **telas de pagamento foram
  construídas com um mock isolado** (`src/services/pagamentos.ts`, mesmo padrão de
  `vida-plena-backend/src/validacao/providers.ts`) — sem nenhuma chamada de rede real ainda:
  - Membro paga a consulta (Pix ou cartão) na nova `PagarConsultaScreen`, acessível pelo card
    "Cuidadores Solicitados" do Perfil assim que a solicitação é concluída.
  - Checkout do carrinho (Produtos/Farmácia) ganhou uma etapa de forma de pagamento (mesmo
    componente `PagamentoBox`) antes da tela de sucesso.
  - `CuidadorGanhosScreen` ganhou saldo disponível + botão "Resgatar via Pix" (usa a chave Pix já
    coletada no cadastro; some se a verificação profissional ainda não foi concluída) — ganho é
    creditado automaticamente quando o cuidador conclui um atendimento (`valorVisita` do perfil).
  - Cartão mock usa a mesma convenção de teste do CPF/COREN no back-end: número terminado em
    dígito par aprova, ímpar recusa.
  - Trocar pela integração real assim que o sandbox estiver pronto: as funções de
    `pagamentos.ts` já têm a assinatura esperada, só o corpo precisa virar chamada HTTP à Asaas.

## 10. Biometria (digital/facial) — não é integração externa

- Diferente dos itens acima, isso **não fala com nenhum servidor de terceiro**. É a API nativa do
  aparelho (`expo-local-authentication` no Expo), que verifica a digital/Face ID *localmente* no
  celular e devolve só um "autorizado"/"não autorizado" pro app. O papel do back-end aqui é
  simplesmente: guardar um refresh token de sessão, que só é liberado do secure storage do
  aparelho depois que a biometria local aprovar. Nenhum dado biométrico chega a sair do celular
  ou a ser armazenado no servidor — bom para reduzir escopo de LGPD/segurança nessa parte.
- ✅ Não é uma decisão pendente — é assim que biometria funciona em qualquer app, não tem opção B
  viável (verificar digital "no servidor" exigiria hardware e dado biométrico bruto trafegando,
  o que nenhum provedor sério oferece nem seria desejável).

---

## Como usar este arquivo

Antes de fechar qualquer proposta de arquitetura ou schema de banco com o outro desenvolvedor,
confira se todos os itens marcados 🟡/⏳ acima já têm decisão — se não tiverem, o desenho do
back-end para aquela funcionalidade específica deve ficar como "stub"/mock até a decisão sair,
para não construir em cima de um provedor que pode mudar.
