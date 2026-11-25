// Termos jurídicos do app (versão de 16.10.2026, recebida em 2026-10-22).
//
// ⚠️ A versão OFICIAL são os .docx na pasta `vida-plena/` (raiz do projeto). Este arquivo é o texto
// deles transcrito sem alterar a redação — só a numeração/títulos viraram estrutura. Os campos entre
// colchetes ([razão social], [e-mail]...) estão assim no próprio documento, aguardando preenchimento.
// A linha final de assinatura de cada termo ("Eu, [nome completo], inscrito(a) no CPF...") não é
// mostrada na leitura: no app ela vira a declaração da caixa de aceite do cadastro, já com o nome e o
// CPF que a pessoa digitou (ver `declaracaoDeAceite`).
//
// Quando chegar versão nova: trocar o .docx, atualizar o texto aqui e mudar VERSAO_TERMOS — o
// servidor guarda em cada conta qual versão ela aceitou (`usuarios.termos_versao`).

export const VERSAO_TERMOS = '2026-10-16';

export type IdTermo = 'uso' | 'privacidade' | 'contratante' | 'prestador';

export interface SecaoTermo {
  titulo: string;
  paragrafos: string[];
}

export interface Termo {
  id: IdTermo;
  titulo: string;
  /** Nome curto, para listas e para a frase de aceite. */
  nomeCurto: string;
  /** Uma linha explicando para que serve o documento. */
  resumo: string;
  atualizadoEm: string;
  introducao?: string;
  secoes: SecaoTermo[];
}

export const TERMOS: Record<IdTermo, Termo> = {
  uso: {
    id: 'uso',
    titulo: 'Termo de Uso do Aplicativo Vida Plena',
    nomeCurto: 'Termo de Uso',
    resumo: 'Regras gerais do aplicativo, para todos os usuários.',
    atualizadoEm: '16.10.2026',
    secoes: [
      {
        titulo: '1. Aceitação e finalidade',
        paragrafos: [
          'Ao realizar o cadastro ou utilizar o aplicativo Vida Plena (“Plataforma”), o usuário declara que leu e concorda com estes Termos de Uso e com os demais documentos aplicáveis.',
          'A Vida Plena é uma plataforma digital que conecta pessoas que buscam serviços de cuidado e assistência a profissionais independentes, como cuidadores, técnicos de enfermagem e enfermeiros, respeitadas as qualificações profissionais e as habilitações legalmente exigidas para cada atividade.',
          'A Plataforma atua como intermediadora tecnológica, facilitando o contato entre contratantes e prestadores de serviço, sem executar diretamente os serviços de cuidado ou assistência, conforme o modelo de funcionamento disponibilizado no aplicativo.',
          'A contratação ocorre diretamente entre o contratante e o prestador de serviço escolhido, cabendo a cada parte cumprir as obrigações assumidas e a legislação aplicável. A utilização da Plataforma não garante a disponibilidade de profissionais nem resultados específicos na prestação dos serviços.',
          'Ao utilizar a Vida Plena, o usuário compromete-se a cumprir estes Termos de Uso, a Política de Privacidade e, conforme sua categoria, o Termo do Contratante ou o Termo do Prestador de Serviços.',
        ],
      },
      {
        titulo: '2. Papel da plataforma',
        paragrafos: [
          'A Vida Plena disponibiliza recursos digitais para cadastro, consulta de perfis, busca e contato entre usuários e profissionais, bem como para solicitação e organização de contratações, conforme as funcionalidades oferecidas pelo aplicativo.',
          'Sua atuação limita-se à disponibilização de ferramentas tecnológicas para aproximar as partes. A contratação ocorre diretamente entre Contratante e Prestador, que definem as condições do serviço, incluindo atividades, local, datas, horários, valores e forma de pagamento.',
          'A utilização da Vida Plena não implica vínculo empregatício entre a plataforma e os profissionais cadastrados, nem torna a plataforma responsável pela execução direta dos serviços contratados, cuja prestação ocorre sob a responsabilidade das partes.',
          'O aplicativo não se destina ao atendimento de urgências ou emergências médicas. Nessas situações, o usuário deverá acionar os serviços competentes.',
        ],
      },
      {
        titulo: '3. Cadastro e informações verdadeiras',
        paragrafos: [
          'Cada usuário deve fornecer informações verdadeiras, completas e atualizadas, manter sua senha em sigilo e comunicar qualquer suspeita de acesso indevido. É proibido criar contas falsas, utilizar documentos de terceiros, omitir impedimentos relevantes, apresentar qualificações inexistentes ou utilizar a plataforma para finalidades ilícitas. O usuário responde pela veracidade e pela legalidade dos dados e documentos que enviar.',
        ],
      },
      {
        titulo: '4. Perfis e verificação',
        paragrafos: [
          'A plataforma poderá solicitar documentos, certificados, comprovantes, registros profissionais e informações adicionais para verificar a identidade, a categoria declarada e a regularidade cadastral. A verificação limita-se aos procedimentos efetivamente realizados e às informações disponíveis; não equivale a uma garantia de conduta, competência, saúde, idoneidade futura ou qualidade do atendimento. O selo de verificação, se houver, não substitui a conferência pelo Contratante.',
          'A Vida Plena poderá solicitar a atualização de documentos, limitar funcionalidades ou suspender ou encerrar cadastros diante de informações falsas, documentos vencidos, indícios de fraude, riscos à segurança, descumprimento destes Termos ou exigência legal, observados os direitos aplicáveis e a possibilidade de esclarecimento, quando cabível.',
        ],
      },
      {
        titulo: '5. Autonomia e relação entre usuários',
        paragrafos: [
          'O Prestador cadastra-se para oferecer seus serviços de forma independente e pode, conforme as funcionalidades e condições anunciadas, avaliar oportunidades e aceitar ou recusar solicitações. A Vida Plena não contrata o Prestador como empregado, não define, por si só, o conteúdo técnico do atendimento e não dirige a execução cotidiana do serviço. O Contratante seleciona o Prestador e ajusta diretamente as condições da contratação.',
        ],
      },
      {
        titulo: '6. Segurança, conduta e limites de atuação',
        paragrafos: [
          'É proibido utilizar a plataforma para praticar ou facilitar atos de violência, abuso, discriminação, exploração financeira, fraude, assédio, violação de privacidade ou exercício irregular de profissão, bem como para realizar prescrições ou procedimentos incompatíveis com a habilitação profissional exigida.',
          'Os cuidadores devem restringir sua atuação às atividades de cuidado e apoio não técnico para as quais estejam capacitados, sem executar atos privativos de profissionais de saúde. Técnicos de enfermagem e enfermeiros devem atuar dentro dos limites de suas respectivas habilitações legais, registros profissionais e normas éticas aplicáveis.',
          'Em situações de urgência ou risco à vida, os usuários devem acionar imediatamente o SAMU (192) ou o serviço de emergência competente. As mensagens, notificações e os canais de suporte da Vida Plena não constituem serviços de emergência e podem não ser monitorados em tempo real.',
        ],
      },
      {
        titulo: '7. Preço, pagamento e cancelamento',
        paragrafos: [
          'O preço, a forma de pagamento, a política de cancelamento, o reembolso e eventual taxa da plataforma devem ser informados ao usuário antes da confirmação da contratação, conforme as funcionalidades disponíveis. Se o pagamento for combinado diretamente entre os usuários, a Vida Plena não receberá nem administrará esses valores. Se houver pagamento processado pelo aplicativo, também serão aplicáveis as condições apresentadas durante o fluxo de pagamento e as regras do prestador de pagamento.',
        ],
      },
      {
        titulo: '8. Avaliações, conteúdo e comunicações',
        paragrafos: [
          'Os usuários devem publicar avaliações verdadeiras, respeitosas e relacionadas a experiências efetivamente vivenciadas, sem expor dados de saúde, documentos, endereços ou outras informações de terceiros. A plataforma poderá moderar, ocultar ou remover conteúdo ilícito, abusivo, enganoso ou que viole estes Termos, sem obrigação de realizar monitoramento prévio universal.',
        ],
      },
      {
        titulo: '9. Disponibilidade e limitações técnicas',
        paragrafos: [
          'A Vida Plena buscará manter o aplicativo funcional e seguro, mas não garante seu funcionamento ininterrupto, a ausência de falhas, a compatibilidade com todos os dispositivos ou a disponibilidade permanente de serviços de terceiros. Poderão ocorrer manutenções, atualizações, interrupções ou alterações de funcionalidades.',
        ],
      },
      {
        titulo: '10. Suspensão, encerramento e alterações',
        paragrafos: [
          'O usuário poderá deixar de utilizar a plataforma e solicitar o encerramento da conta pelos canais disponíveis, sem prejuízo da conservação de registros necessária ao cumprimento de obrigação legal, à segurança, à prevenção a fraudes ou ao exercício regular de direitos. A Vida Plena poderá atualizar estes Termos e informará as alterações relevantes pelo aplicativo ou por outro canal adequado.',
        ],
      },
      {
        // Numeração como está no documento (não há item 11 na versão de 16.10.2026).
        titulo: '12. Contato e legislação',
        paragrafos: [
          'Dúvidas ou notificações: [e-mail de suporte/jurídico].',
          'Aplicam-se as leis brasileiras, respeitados os direitos dos consumidores e as regras de competência legalmente aplicáveis.',
        ],
      },
    ],
  },

  privacidade: {
    id: 'privacidade',
    titulo: 'Política de Privacidade',
    nomeCurto: 'Política de Privacidade',
    resumo: 'Quais dados usamos, para quê, e os seus direitos (LGPD).',
    atualizadoEm: '16.10.2026',
    secoes: [
      {
        titulo: '1. Quem trata os dados',
        paragrafos: [
          'A responsável pelo tratamento dos dados no âmbito da plataforma é [razão social], inscrita no CNPJ sob o nº [número] e contato pelo e-mail [e-mail].',
          'Esta Política explica, de forma resumida, quais dados podem ser tratados, para quais finalidades e como o titular pode exercer seus direitos. O conteúdo deve ser ajustado aos fluxos técnicos efetivamente implementados.',
        ],
      },
      {
        titulo: '2. Quais dados podem ser tratados',
        paragrafos: [
          'Conforme o uso do aplicativo, poderemos tratar: (a) dados cadastrais e de contato, como nome, telefone, e-mail e CPF; (b) dados de identificação, como RG, CNH, fotografia ou selfie e comprovante de endereço; (c) dados de qualificação profissional, como categoria, certificados, diploma e número e situação da inscrição no COREN; (d) certidão de antecedentes criminais; (e) dados relacionados à contratação, disponibilidade, mensagens, avaliações, reclamações e registros de suporte; (f) dados de pagamento ou chave Pix, quando necessários ao fluxo adotado; (g) dados técnicos, como registros de acesso, dispositivo, data, horário e eventos de segurança.',
          'Informações sobre a saúde do Contratante ou da pessoa assistida podem constituir dados pessoais sensíveis. Evite inserir no chat ou no perfil dados clínicos além do estritamente necessário. Quando for necessário tratar esses dados, a plataforma deverá definir e informar a hipótese legal aplicável, limitar o acesso e adotar salvaguardas reforçadas.',
        ],
      },
      {
        titulo: '3. Para que usamos os dados',
        paragrafos: [
          'Os dados poderão ser utilizados para criar e administrar contas; permitir a busca e o contato entre usuários; verificar identidade, documentos e qualificações; viabilizar solicitações e contratações; responder a solicitações; prevenir fraudes, abusos e riscos à segurança; cumprir obrigações legais e regulatórias; proteger direitos em procedimentos administrativos ou judiciais; e aprimorar a segurança e o funcionamento do aplicativo.',
        ],
      },
      {
        titulo: '4. Bases legais',
        paragrafos: [
          'O tratamento de dados pessoais pela Vida Plena será realizado com fundamento nas hipóteses legais previstas na Lei Geral de Proteção de Dados (LGPD), conforme a finalidade de cada operação. Essas hipóteses poderão incluir o consentimento do titular, quando necessário, o cumprimento de obrigações legais ou regulatórias, o exercício regular de direitos, a proteção da vida ou da incolumidade física e a prevenção à fraude.',
          'O tratamento de dados também poderá ocorrer para viabilizar o cadastro dos usuários, permitir a conexão entre Contratantes e Prestadores de Serviços, facilitar o contato entre as partes e disponibilizar as funcionalidades da plataforma. A Vida Plena atua exclusivamente como intermediadora digital, não sendo parte da contratação dos serviços, que é realizada diretamente entre o Contratante e o Prestador.',
        ],
      },
      {
        titulo: '5. Com quem os dados podem ser compartilhados',
        paragrafos: [
          'Os dados poderão ser compartilhados, na medida necessária, com o outro usuário envolvido na contratação, comunicação, mapas, validação documental, pagamentos e segurança; autoridades públicas, quando houver obrigação ou fundamento legal; e terceiros envolvidos na prevenção ou apuração de fraudes e incidentes.',
        ],
      },
      {
        titulo: '6. Localização, documentos e verificações',
        paragrafos: [
          'Se a geolocalização estiver ativa, será utilizada apenas para as finalidades informadas no aplicativo, como a indicação de endereço. O usuário poderá gerenciar as permissões de localização no dispositivo, embora isso possa limitar algumas funcionalidades.',
          'Documentos e informações utilizados para verificação terão acesso restrito e serão conservados pelo período necessário ao cumprimento da finalidade, à segurança e às obrigações legais aplicáveis.',
        ],
      },
      {
        titulo: '7. Retenção e segurança',
        paragrafos: [
          'A Vida Plena adota ou adotará medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados, perda, destruição, alteração, divulgação ou qualquer forma de tratamento inadequado ou ilícito. Apesar dessas medidas, nenhum sistema é totalmente seguro ou livre de falhas.',
          'Os dados pessoais serão armazenados pelo período necessário para viabilizar o funcionamento da plataforma, permitir a conexão entre Contratantes e Prestadores e atender às demais finalidades previstas nesta Política de Privacidade. Após esse período, os dados serão eliminados ou anonimizados, sempre que possível, ressalvadas as hipóteses em que sua conservação seja necessária para o cumprimento de obrigações legais ou regulatórias, a prevenção de fraudes ou o exercício regular de direitos.',
        ],
      },
      {
        titulo: '8. Direitos do titular',
        paragrafos: [
          'Nos termos da LGPD, o titular poderá solicitar acesso, correção, anonimização, bloqueio ou eliminação de dados, informações sobre seu tratamento e compartilhamento, portabilidade, quando cabível, revisão de decisões automatizadas e revogação do consentimento, quando aplicável.',
          'O exercício desses direitos poderá estar sujeito a limitações legais. As solicitações deverão ser encaminhadas para [canal de privacidade/e-mail], podendo a Vida Plena solicitar a confirmação da identidade do titular para garantir a segurança das informações.',
        ],
      },
      {
        titulo: '9. Crianças, adolescentes e pessoas assistidas',
        paragrafos: [
          'O cadastro na Vida Plena é permitido exclusivamente a pessoas maiores de 18 anos. Menores de idade não poderão criar ou manter contas na plataforma, devendo ser representados por seus responsáveis legais nas interações necessárias à utilização dos serviços oferecidos pelos Prestadores.',
          'Os dados pessoais de crianças, adolescentes e pessoas assistidas somente poderão ser fornecidos por seus responsáveis legais ou representantes autorizados, quando necessário à conexão entre Contratantes e Prestadores, observados o melhor interesse e a legislação aplicável. É proibida a divulgação de dados pessoais sensíveis dessas pessoas em perfis públicos, avaliações ou outros espaços de acesso público da plataforma.',
        ],
      },
      {
        titulo: '10. Incidentes e alterações',
        paragrafos: [
          'Em caso de incidente de segurança que possa acarretar risco ou dano relevante, a empresa avaliará as medidas e comunicações exigidas pela LGPD e pelas normas aplicáveis.',
          'Esta Política poderá ser atualizada para refletir alterações legais ou operacionais, com aviso aos titulares quando necessário.',
        ],
      },
    ],
  },

  contratante: {
    id: 'contratante',
    titulo: 'Termo do Contratante',
    nomeCurto: 'Termo do Contratante',
    resumo: 'Para quem contrata cuidado, para si ou para um familiar.',
    atualizadoEm: '16.10.2026',
    introducao:
      'Aplicável à pessoa que solicita ou contrata serviços por meio da Vida Plena, inclusive em benefício de familiar ou de pessoa assistida.',
    secoes: [
      {
        titulo: '1. Papel da plataforma Vida Plena',
        paragrafos: [
          'Ao utilizar a plataforma, o usuário declara estar ciente de que a plataforma Vida Plena é uma ferramenta digital destinada a conectar Contratantes e Prestadores cadastrados. A plataforma não presta diretamente serviços de cuidado pessoal, enfermagem, muito menos de atendimento médico, diagnóstico, tratamento ou emergência. Os serviços são prestados pelo profissional selecionado, mediante contratação direta entre as partes e conforme as condições por elas acordadas.',
          'A Vida Plena poderá realizar verificações cadastrais e documentais, conforme os procedimentos e recursos disponibilizados na plataforma. Essas verificações não representam garantia absoluta quanto à identidade, idoneidade, qualificação técnica, conduta ou resultado dos serviços prestados. Cabe ao Contratante avaliar o perfil, as qualificações, as referências disponíveis e a adequação do Prestador às necessidades da pessoa assistida antes de realizar a contratação.',
        ],
      },
      {
        titulo: '2. Escolha e contratação direta',
        paragrafos: [
          'O Contratante é responsável pela escolha do Prestador e pela definição das condições do serviço, incluindo escopo, local, dias, horários, preço, forma de pagamento, materiais necessários e condições de cancelamento. Também deverá fornecer informações verdadeiras e suficientes sobre as necessidades da pessoa assistida e verificar se o Prestador possui as qualificações e habilitações necessárias para as atividades pretendidas.',
          'É proibido solicitar ou exigir a realização de atividades incompatíveis com a qualificação ou a habilitação legal do prestador, especialmente procedimentos privativos de profissionais de saúde.',
          'A Vida Plena atua exclusivamente como plataforma digital de conexão entre Contratantes e Prestadores, não sendo parte da contratação nem responsável pela negociação ou execução dos serviços. A contratação ocorre diretamente entre as partes, que são responsáveis por acordar as condições do serviço e cumprir as obrigações legais aplicáveis.',
          'A Vida Plena atua exclusivamente como plataforma digital de conexão entre Contratantes e Prestadores, não sendo parte da contratação dos serviços nem estabelecendo vínculo empregatício com seus usuários ou Prestadores. A relação de prestação de serviços é estabelecida diretamente entre Contratante e Prestador, a quem compete definir as condições da contratação e cumprir as obrigações legais dela decorrentes.',
        ],
      },
      {
        titulo: '3. Informações sobre a pessoa assistida',
        paragrafos: [
          'O Contratante compromete-se a fornecer ao Prestador informações verdadeiras, atualizadas e necessárias à segurança e à adequada realização do serviço, incluindo, quando pertinente, limitações de mobilidade, alergias, riscos conhecidos, orientações relevantes, condições do ambiente e contatos de emergência, observada a legislação aplicável. Também deverá informar quando as necessidades da pessoa assistida exigirem profissional habilitado ou estrutura incompatível com a atuação de um cuidador.',
          'Caso realize o cadastro ou forneça informações em nome de terceiros, o Contratante declara possuir autorização ou legitimidade para tanto, responsabilizando-se pela veracidade e licitude dos dados fornecidos. Deverá, ainda, respeitar a autonomia, a dignidade, a privacidade e a vontade da pessoa assistida, conforme suas condições e a legislação aplicável.',
        ],
      },
      {
        titulo: '4. Segurança e emergências',
        paragrafos: [
          'A plataforma Vida Plena não constitui serviço de emergência, e as mensagens ou solicitações enviadas pelo aplicativo podem não ser visualizadas ou respondidas em tempo real. Em situações de urgência ou risco à vida, o Contratante deverá acionar imediatamente o SAMU (192) ou o serviço de emergência competente, sem aguardar resposta da plataforma.',
          'Para a adequada realização do serviço, o Contratante deverá informar os riscos relevantes, contribuir para a manutenção de um ambiente seguro e disponibilizar os materiais e orientações necessários, quando aplicável e sob sua responsabilidade. Também não poderá exigir do Prestador a realização de procedimentos ilegais, inseguros ou incompatíveis com sua qualificação ou habilitação profissional.',
        ],
      },
      {
        titulo: '5. Pagamentos, cancelamentos e condições',
        paragrafos: [
          'O Contratante deverá efetuar o pagamento diretamente ao Prestador, conforme os valores e as condições previamente acordadas entre as partes, bem como respeitar as regras de cancelamento informadas antes da contratação. Nos pagamentos realizados diretamente ao Prestador, a Vida Plena não será responsável pelo recebimento, pela retenção ou pelo repasse dos valores.',
          'Caso a plataforma disponibilize funcionalidades de processamento de pagamentos, serão aplicáveis as condições específicas apresentadas no aplicativo antes da confirmação da operação, respeitados os direitos assegurados pela legislação vigente.',
        ],
      },
      {
        titulo: '6. Conduta e proteção do prestador',
        paragrafos: [
          'O Contratante deverá tratar o Prestador com respeito e urbanidade, sendo vedadas condutas discriminatórias, assédio, ameaças, violência, exigências de atividades ilícitas ou incompatíveis com sua habilitação, bem como a retenção indevida de documentos ou pertences. Também deverá fornecer informações verdadeiras sobre o local e as condições em que o serviço será realizado.',
          'É vedada a divulgação indevida de acusações falsas, documentos, imagens ou dados pessoais do Prestador, sem fundamento legal ou autorização aplicável, devendo ser respeitados seus direitos à privacidade, à honra e à imagem.',
        ],
      },
      {
        titulo: '7. Responsabilidade e reclamações',
        paragrafos: [
          'O Contratante é responsável pelas informações fornecidas, pelas condições do ambiente sob seu controle, pelos pagamentos e pelos compromissos assumidos com o Prestador. Diante de riscos, suspeitas de abuso, fraude ou outros incidentes, deverá adotar as medidas necessárias à proteção dos envolvidos, comunicar às autoridades competentes, quando cabível, e informar a Vida Plena pelos canais disponíveis.',
          'A Vida Plena poderá receber reclamações, solicitar informações, restringir ou suspender contas e cooperar com as autoridades, conforme a legislação aplicável. Seus canais de atendimento não substituem os serviços de emergência ou às autoridades competentes.',
        ],
      },
      {
        titulo: '8. Declaração final',
        paragrafos: [
          'Ao utilizar a plataforma, o Contratante declara que leu e compreendeu este Termo, que as informações fornecidas são verdadeiras e que está ciente do papel da plataforma Vida Plena como ferramenta digital de conexão entre Contratantes e Prestadores, dos limites de atuação de cada categoria profissional e da necessidade de acionar diretamente os serviços de emergência em situações de urgência ou risco à vida.',
        ],
      },
    ],
  },

  prestador: {
    id: 'prestador',
    titulo: 'Termo do Prestador de Serviços',
    nomeCurto: 'Termo do Prestador',
    resumo: 'Para cuidadores, técnicos de enfermagem e enfermeiros.',
    atualizadoEm: '16.10.2026',
    introducao:
      'Aplicável a cuidadores de pessoas idosas, técnicos de enfermagem e enfermeiros cadastrados na plataforma Vida Plena.',
    secoes: [
      {
        titulo: '1. Adesão e autonomia',
        paragrafos: [
          'Ao aceitar este Termo, o Prestador declara que utiliza a plataforma Vida Plena por iniciativa própria, com a finalidade de apresentar seus serviços a potenciais Contratantes. Está ciente de que a Vida Plena atua exclusivamente como ferramenta digital de conexão entre as partes, não sendo sua empregadora, agência de trabalho ou responsável pela supervisão técnica dos serviços ou pela garantia de renda.',
          'A contratação ocorre diretamente entre o Prestador e o Contratante, cabendo às partes negociar as condições do serviço, incluindo preço, horários, local, escopo e demais condições aplicáveis. O Prestador poderá aceitar ou recusar solicitações, sendo responsável pelos serviços que aceitar, pelo cumprimento dos compromissos assumidos e pela manutenção de sua regularidade profissional, conforme as obrigações legais aplicáveis. A utilização da plataforma não garante quantidade mínima de solicitações, contratações ou remuneração.',
        ],
      },
      {
        titulo: '2. Cadastro, documentos e declarações',
        paragrafos: [
          'Para utilizar a plataforma Vida Plena, o Prestador deverá fornecer dados e documentos verdadeiros, atuais e de sua titularidade, manter o cadastro atualizado e informar eventuais impedimentos relevantes à prestação dos serviços. A análise dos documentos para fins de verificação cadastral será realizada conforme as finalidades e condições previstas na Política de Privacidade.',
          'Cabe ao Prestador manter válidos e regulares seus registros profissionais, habilitações, licenças e certificados exigidos para as atividades que pretende realizar. A verificação cadastral eventualmente efetuada pela Vida Plena não substitui essa obrigação nem representa garantia de regularidade profissional.',
        ],
      },
      {
        titulo: '3. Deveres de todos os prestadores',
        paragrafos: [
          'O Prestador deverá tratar a pessoa assistida e seus familiares com dignidade e respeito, sem discriminação, preservando sua privacidade, intimidade, bens e informações pessoais. Deverá atuar exclusivamente dentro dos limites de sua competência, capacitação e habilitação legal, abstendo-se de qualquer forma de violência, ameaça, humilhação, negligência, exploração financeira ou abuso, bem como da apropriação de dinheiro, cartões, senhas ou outros bens da pessoa assistida.',
          'Também deverá comunicar ao Contratante situações relevantes e incidentes relacionados ao serviço, não registrar ou divulgar imagens, áudios, vídeos ou dados da pessoa assistida sem autorização válida e em desacordo com a legislação aplicável, e não realizar atividades sob efeito de álcool ou de substâncias que comprometam a segurança ou sua capacidade de atuação.',
        ],
      },
      {
        titulo: '4. Regras específicas para cuidadores de pessoas idosas',
        paragrafos: [
          'O Prestador cadastrado como Cuidador de Pessoas Idosas deverá limitar sua atuação aos cuidados de apoio compatíveis com sua capacitação, como auxílio na higiene, alimentação e mobilidade, companhia e suporte à rotina previamente acordada com o Contratante. O cadastro nessa categoria não confere habilitação para exercer atividades privativas de profissionais de saúde.',
          'É vedado ao Cuidador diagnosticar, prescrever, alterar tratamentos ou dosagens de medicamentos, administrar medicamentos por vias invasivas, aplicar injeções, realizar procedimentos de enfermagem, curativos complexos ou quaisquer atos para os quais não esteja legalmente habilitado.',
          'Diante de sinais de urgência ou de qualquer situação que possa comprometer a saúde ou a segurança da pessoa assistida, incluindo falta de ar súbita, alteração importante do nível de consciência, queda grave, dor intensa, suspeita de AVC ou parada cardiorrespiratória, o Prestador deverá acionar imediatamente o SAMU (192) ou o serviço de emergência local, prestar somente os primeiros socorros para os quais esteja capacitado e comunicar o Contratante assim que possível.',
        ],
      },
      {
        titulo: '5. Regras específicas para Técnicos de Enfermagem e Enfermeiros',
        paragrafos: [
          'O Prestador cadastrado como Técnico de Enfermagem ou Enfermeiro deverá possuir a formação e a habilitação exigidas para sua categoria, manter seu registro ativo no Conselho Regional de Enfermagem (COREN) e cumprir a Lei nº 7.498/1986, seu regulamento, o Código de Ética e as demais normas profissionais aplicáveis. Deverá exercer suas atividades dentro dos limites legais de sua competência, observar os protocolos pertinentes e recusar determinações manifestamente ilegais ou inseguras.',
          'A Vida Plena atua exclusivamente como plataforma de conexão entre Contratantes e Prestadores, não assumindo a responsabilidade técnica, ética ou profissional pelos atos praticados pelo Prestador. Este deverá realizar procedimentos somente quando possuir a habilitação necessária e estiverem presentes as condições, prescrições e supervisões legalmente exigidas, além de comunicar prontamente intercorrências relevantes e acionar os serviços de emergência sempre que necessário.',
        ],
      },
      {
        titulo: '6. Contratação, remuneração e despesas',
        paragrafos: [
          'Antes de aceitar um serviço, o Prestador deverá acordar diretamente com o Contratante as condições da prestação, incluindo escopo, horários, remuneração, forma de pagamento, despesas, materiais necessários e regras de cancelamento.',
          'Salvo quando houver funcionalidade de pagamento expressamente disponibilizada pela plataforma, a Vida Plena não participará das transações financeiras entre as partes, nem será responsável pelo recebimento, repasse ou garantia dos valores acordados. Caberá ao Prestador cumprir as obrigações tributárias, previdenciárias, securitárias, profissionais e demais encargos que lhe forem legalmente aplicáveis.',
        ],
      },
      {
        titulo: '7. Ausência de vínculo automático com a plataforma',
        paragrafos: [
          'O cadastro e a utilização da plataforma Vida Plena não estabelecem vínculo empregatício entre o Prestador e a plataforma ou seus responsáveis. A Vida Plena atua exclusivamente como ferramenta digital de conexão entre Prestadores e Contratantes, sem garantir exclusividade, jornada de trabalho, remuneração fixa, benefícios ou demanda mínima de serviços.',
          'A prestação dos serviços é acordada diretamente entre o Prestador e o Contratante, sem participação da Vida Plena na negociação das condições ou na execução dos serviços. As partes são responsáveis pelas obrigações decorrentes da relação estabelecida, não cabendo à plataforma assumir responsabilidades próprias dessa contratação.',
        ],
      },
      {
        titulo: '8. Responsabilidade por atos e ocorrências',
        paragrafos: [
          'O Prestador é exclusivamente responsável pelos atos e omissões praticados no exercício de suas atividades e na execução dos serviços contratados, respondendo, nos termos da legislação aplicável, por danos causados ao Contratante, à pessoa assistida ou a terceiros em decorrência de sua conduta, inclusive por negligência, imprudência, imperícia, dolo, descumprimento de obrigações legais ou atuação fora dos limites de sua habilitação. Deverá comunicar imediatamente ao Contratante acidentes, suspeitas de abuso, reclamações graves, perda de documentos, incidentes envolvendo dados pessoais ou quaisquer ocorrências que possam comprometer a segurança dos envolvidos.',
          'A Vida Plena atua exclusivamente como plataforma digital de conexão entre Contratantes e Prestadores, não executando nem supervisionando diretamente os serviços contratados. O Prestador é responsável por seus atos e omissões na execução dos serviços, respondendo pelas consequências de sua conduta, conforme a legislação aplicável. É proibido utilizar a plataforma para praticar ou facilitar crimes, fraudes, falsificação de documentos, exercício ilegal de profissão ou qualquer outra atividade ilícita, sem prejuízo das responsabilidades legais aplicaveis.',
        ],
      },
      {
        titulo: '9. Confidencialidade e dados pessoais',
        paragrafos: [
          'O Prestador deverá utilizar os dados pessoais, as informações de saúde, os endereços, as rotinas e os documentos da pessoa assistida exclusivamente para a execução dos serviços contratados e na medida necessária à sua prestação. É proibido divulgar ou compartilhar essas informações com terceiros, bem como utilizá-las para fins próprios ou publicitários, salvo quando houver autorização válida ou outra hipótese legal aplicável. O Prestador deverá adotar medidas razoáveis de segurança para evitar acessos, usos ou divulgações indevidas. Encerrada a contratação, deverá cessar o uso dos dados.',
        ],
      },
      {
        titulo: '10. Reclamações, suspensão e encerramento',
        paragrafos: [
          'A Vida Plena poderá solicitar esclarecimentos, exigir a atualização de dados e documentos, restringir funcionalidades ou suspender ou encerrar o acesso do Prestador em caso de indícios de fraude, risco à segurança, irregularidade documental, reclamação ou descumprimento destes Termos, observada a legislação aplicável. O Prestador poderá deixar de utilizar a plataforma e solicitar o encerramento de sua conta a qualquer momento, permanecendo responsável pelo cumprimento das obrigações já assumidas diretamente com os Contratantes.',
        ],
      },
      {
        titulo: '11. Declaração final',
        paragrafos: [
          'Ao aceitar este Termo, o Prestador declara que leu e compreendeu suas disposições, que as informações fornecidas são verdadeiras e atualizadas e que se compromete a cumprir a legislação aplicável, respeitar os limites de sua qualificação profissional e preservar os direitos, a dignidade, a privacidade e a segurança da pessoa assistida.',
        ],
      },
    ],
  },
};

/** Documentos que cada tipo de conta aceita no cadastro (e vê depois no perfil/painel). */
export const TERMOS_DO_MEMBRO: IdTermo[] = ['uso', 'contratante', 'privacidade'];
export const TERMOS_DO_CUIDADOR: IdTermo[] = ['uso', 'prestador', 'privacidade'];

/** "o Termo de Uso, o Termo do Contratante e a Política de Privacidade" */
export function listarNomes(ids: IdTermo[]): string {
  const nomes = ids.map((id) => {
    const nome = TERMOS[id].nomeCurto;
    return `${id === 'privacidade' ? 'a' : 'o'} ${nome}`;
  });
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/**
 * Declaração de aceite do cadastro — a linha de assinatura dos termos ("Eu, [nome completo],
 * inscrito(a) no CPF sob o nº [CPF], declaro que li, compreendi e concordo...") com os dados que a
 * pessoa digitou. O CPF é opcional no cadastro; sem ele, a frase fica só com o nome.
 */
export function declaracaoDeAceite(nome: string, cpf: string, ids: IdTermo[]): string {
  const nomeExibido = nome.trim() || '[nome completo]';
  const trechoCpf = cpf.trim() ? `, inscrito(a) no CPF sob o nº ${cpf.trim()},` : '';
  return (
    `Eu, ${nomeExibido}${trechoCpf} declaro que li, compreendi e concordo com as disposições de ` +
    `${listarNomes(ids)}, comprometendo-me a respeitá-las e cumpri-las integralmente.`
  );
}
