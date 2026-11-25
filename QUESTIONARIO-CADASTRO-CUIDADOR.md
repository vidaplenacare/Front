# Cadastro, Verificação Profissional e Termos de Responsabilidade — Etapas e Questionário

> Levantamento do fluxo atual em `src/screens/CuidadorCadastroScreen.tsx`,
> `src/screens/CuidadorVerificacaoScreen.tsx` e `src/screens/CadastroMembroScreen.tsx`. Os termos
> de responsabilidade e as perguntas do quiz abaixo são um **rascunho funcional para
> prototipagem** — pendente de revisão da equipe e de um advogado especializado em direito da
> saúde/trabalhista antes de produção.

## 1. Criar conta — Cuidador (`CuidadorCadastroScreen`) — 3 etapas

### Etapa 1 — Dados pessoais
- Nome completo
- Telefone
- E-mail
- CPF (opcional por enquanto)
- Senha (mínimo 6 caracteres)
- Confirmar senha

### Etapa 2 — Área de atuação
Escolha única entre:
- **Cuidador de Idosos** — sem registro profissional obrigatório
- **Técnico de Enfermagem** — requer COREN e certificado técnico
- **Enfermeiro** — requer COREN e diploma de graduação

### Etapa 3 — Termo de responsabilidade (NOVO — antes só aparecia na verificação opcional)
O termo (texto muda por categoria, ver seção 4 abaixo) é exibido e precisa ser aceito
("Li e concordo com os termos acima") para o botão "Criar conta" ser habilitado. Sem aceite, a
conta não é criada.

Ao concluir a etapa 3, a conta já é criada e o usuário vai direto para o painel. A verificação
profissional abaixo continua **opcional**, feita depois, pelo painel.

## 2. Criar conta — Membro/Contratante (`CadastroMembroScreen`) — 2 etapas

### Etapa 1 — Dados pessoais
- Nome completo
- CPF
- E-mail
- Telefone
- Endereço (usado para acompanhar a chegada do cuidador no mapa)
- Senha
- Confirmar senha

### Etapa 2 — Verificação de identidade (documentos opcionais) + Termo de responsabilidade
- Enviar RG — opcional
- Enviar selfie — opcional
- **Termo de responsabilidade e uso (NOVO — antes só existia o checkbox, sem texto nenhum)**: texto
  exibido na tela (ver seção 4 abaixo), com checkbox "Aceito os Termos de Uso" obrigatório para
  concluir o cadastro.

## 3. Verificação profissional (`CuidadorVerificacaoScreen`) — opcional, 4 etapas

> O termo de responsabilidade **não aparece mais aqui** — ele virou obrigatório já no cadastro
> (seção 1, etapa 3). Esta tela ficou só com documentos, Pix, quiz e confirmação.

### Etapa 1 — Documentos
- CPF
- RG ou CNH (frente e verso)
- Comprovante de endereço (emitido nos últimos 3 meses)
- Certidão de antecedentes criminais (obrigatória para todas as categorias)
- Se **Cuidador de Idosos**: certificado de curso de cuidador de idosos (obrigatório)
- Se **Técnico de Enfermagem** ou **Enfermeiro**:
  - Número de inscrição no COREN
  - Comprovante/carteira de inscrição no COREN (registro ativo)
  - Diploma ou certificado de formação

### Etapa 2 — Dados de recebimento
- Chave Pix (CPF, e-mail, telefone ou chave aleatória)

### Etapa 3 — Avaliação de aptidão (quiz)

As perguntas variam por categoria profissional. Perguntas marcadas como **crítica** precisam ser
respondidas corretamente para avançar.

#### Quiz — Cuidador de Idosos (6 perguntas, 4 críticas)

1. **[Crítica]** Você está autorizado a aplicar injeções ou administrar medicação por via
   endovenosa?
   - a) Sim
   - b) Não ✅

2. **[Crítica]** O idoso apresenta falta de ar súbita. Qual a ação correta?
   - a) Administrar medicação por conta própria
   - b) Acionar o enfermeiro responsável ou o serviço de emergência (192) e manter a calma ✅

3. **[Crítica]** Você pode trocar curativos em feridas abertas ou realizar procedimentos
   invasivos?
   - a) Sim, se achar necessário
   - b) Não ✅

4. **[Crítica]** Você pode ajustar a dose de um medicamento sem orientação de um profissional de
   saúde?
   - a) Sim, em casos de urgência
   - b) Não, nunca ✅

5. Qual destas atividades está dentro do seu papel como cuidador?
   - a) Auxiliar na higiene, alimentação e mobilidade ✅
   - b) Prescrever tratamento
   - c) Aplicar soro

6. A família pede para você pular a administração de um remédio prescrito. O que fazer?
   - a) Seguir a orientação da família
   - b) Explicar a importância da prescrição e orientar a buscar o profissional de saúde
     responsável antes de qualquer alteração ✅

#### Quiz — Técnico de Enfermagem / Enfermeiro (5 perguntas, todas críticas)

1. **[Crítica]** Como técnico(a) de enfermagem, você pode prescrever cuidados de enfermagem de
   forma independente?
   - a) Sim
   - b) Não, é atribuição exclusiva do enfermeiro ✅

2. **[Crítica]** Diante de alteração significativa nos sinais vitais do paciente, qual a conduta
   correta?
   - a) Registrar e comunicar imediatamente ao enfermeiro/médico responsável ✅
   - b) Aguardar para ver se piora

3. **[Crítica]** É permitido administrar medicação sem conferir a prescrição e os "5 certos"
   (paciente, medicamento, dose, via, horário)?
   - a) Sim, se já conhece o paciente
   - b) Não ✅

4. **[Crítica]** Em caso de parada cardiorrespiratória, qual o procedimento inicial?
   - a) Iniciar manobras de suporte básico de vida e acionar socorro ✅
   - b) Aguardar a família decidir

5. **[Crítica]** Você concorda em atuar em conformidade com o Código de Ética dos Profissionais de
   Enfermagem (Resolução COFEN)?
   - a) Sim ✅
   - b) Não

### Etapa 4 — Confirmação

Resumo antes de enviar para análise:
- Nome
- CPF
- Categoria
- COREN (se aplicável)
- Chave Pix

## 4. Textos dos termos de responsabilidade ("Li e concordo")

### Cuidador de Idosos
> Eu, [nome completo], portador(a) do CPF [CPF], declaro estar ciente de que minha atuação como
> Cuidador(a) de Idosos na plataforma Vida Plena não constitui exercício de profissão de saúde
> regulamentada, não estando autorizado(a) a realizar procedimentos de enfermagem, administrar
> medicação por vias não orais, aplicar injeções, trocar curativos complexos ou tomar decisões
> clínicas. Comprometo-me a buscar auxílio de profissional de enfermagem habilitado sempre que a
> situação exigir cuidado técnico de saúde, e reconheço minha responsabilidade pessoal pelos atos
> praticados dentro do escopo de cuidados não técnicos. Declaro que as informações prestadas neste
> cadastro são verdadeiras.

### Técnico de Enfermagem / Enfermeiro
> Eu, [nome completo], portador(a) do CPF [CPF] e registro COREN nº [número, a confirmar na
> verificação profissional], declaro estar regularmente inscrito(a) no Conselho Regional de
> Enfermagem e em situação ativa, comprometendo-me a exercer minhas atividades na plataforma Vida
> Plena em conformidade com a Lei do Exercício Profissional da Enfermagem (Lei nº 7.498/1986) e o
> Código de Ética dos Profissionais de Enfermagem (Resolução COFEN). Reconheço minha
> responsabilidade técnica e legal pelos atos de enfermagem praticados, dentro dos limites da minha
> categoria profissional. Declaro que as informações e documentos apresentados são verdadeiros.

### Membro / Contratante
> Eu, [nome completo], portador(a) do CPF [CPF], declaro estar ciente de que a plataforma Vida
> Plena atua como intermediária entre membros/famílias contratantes e cuidadores, técnicos de
> enfermagem e enfermeiros cadastrados, que prestam serviço como profissionais autônomos — não
> como funcionários ou prepostos da plataforma. A contratação, a supervisão do atendimento e o
> pagamento acordado com o profissional são de minha responsabilidade. Estou ciente de que a Vida
> Plena não presta atendimento médico de emergência: em caso de urgência ou risco de vida, devo
> acionar o SAMU (192) ou o serviço de emergência local imediatamente, e não aguardar resposta pelo
> aplicativo. Declaro que as informações fornecidas neste cadastro (incluindo endereço, usado para
> o acompanhamento da chegada do profissional no mapa) são verdadeiras e autorizo seu uso para
> viabilizar os serviços da plataforma, conforme a Política de Privacidade. Estou ciente de que
> posso completar a verificação de identidade (RG e selfie) a qualquer momento, e que ela é
> opcional no momento deste cadastro.

> ⚠️ **Nota exibida em todas as telas**: "este texto é um rascunho funcional para prototipagem.
> Antes de ir para produção, deve ser revisado por um advogado especializado em direito da
> saúde/trabalhista."

---

*Documento gerado a partir do código-fonte, atualizado em 2026-09-14 após mover o termo do cuidador
para o cadastro (etapa 3) e criar o termo do membro. Se as perguntas ou os termos forem alterados
pela equipe/advogado, este arquivo deve ser atualizado de novo.*
