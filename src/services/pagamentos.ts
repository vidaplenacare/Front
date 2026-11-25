// Adaptador de pagamentos — isolado atrás de funções próprias pra poder trocar pela integração
// real da Asaas depois, sem mexer nas telas que chamam essas funções (mesmo padrão de
// vida-plena-backend/src/validacao/providers.ts). Nenhuma chamada de rede acontece aqui ainda: a
// sandbox da Asaas está sendo criada, então tudo é simulado localmente no app.

export type FormaPagamento = 'pix' | 'cartao';

export interface DadosCartao {
  numero: string;
  validade: string;
  cvv: string;
  nomeTitular: string;
}

export interface CobrancaPix {
  copiaECola: string;
  expiraEm: string;
}

export interface ResultadoCobranca {
  status: 'aprovado' | 'recusado';
  motivo?: string;
}

export interface ResultadoResgate {
  id: string;
  status: 'concluido';
}

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function atraso(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ⚠️ MOCK: nenhuma cobrança real é criada na Asaas ainda — isto só gera um payload no formato de
// um "copia e cola" Pix (BR Code) pra preencher a tela, sem ser um código válido de verdade.
// Trocar pela chamada real (POST /pixQrCode ou /payments com billingType PIX) assim que o sandbox
// estiver pronto — a tela que consome isto só precisa de `copiaECola` e `expiraEm`.
export function gerarCobrancaPix(valor: number): CobrancaPix {
  const expiraEm = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const copiaECola = `00020126580014BR.GOV.BCB.PIX0136vidaplena-mock@asaas.com5204000053039865406${valor
    .toFixed(2)
    .replace('.', '')}5802BR5913Vida Plena6009SAO PAULO62070503***6304MOCK`;
  return { copiaECola, expiraEm };
}

// ⚠️ MOCK: em produção, a confirmação do Pix chega via webhook da Asaas (evento PAYMENT_RECEIVED),
// não por um botão no app. Como ainda não existe back-end recebendo esse webhook, simula-se a
// confirmação aqui mesmo depois de um pequeno atraso — sempre aprova (Pix não tem "recusa" do lado
// de quem paga, só expira).
export async function confirmarPagamentoPix(): Promise<ResultadoCobranca> {
  await atraso(1200);
  return { status: 'aprovado' };
}

// ⚠️ MOCK: nenhum provedor de cartão foi contratado ainda (a Asaas cobraria via /payments com
// billingType CREDIT_CARD). Regra de teste arbitrária, mesmo padrão usado em
// vida-plena-backend/src/validacao/providers.ts: cartão cujo número termina em dígito ímpar simula
// recusa (ex.: "4111 1111 1111 1129"); terminado em par simula aprovação (ex.:
// "4111 1111 1111 1112"). Substituir o corpo desta função pela chamada real depois.
export async function pagarComCartao(dados: DadosCartao): Promise<ResultadoCobranca> {
  await atraso(1500);
  const digitos = dados.numero.replace(/\D/g, '');
  const ultimoDigito = Number(digitos[digitos.length - 1] ?? '0');
  if (Number.isNaN(ultimoDigito) || ultimoDigito % 2 !== 0) {
    return { status: 'recusado', motivo: 'Cartão recusado pela operadora. Tente outro cartão.' };
  }
  return { status: 'aprovado' };
}

// ⚠️ MOCK: repasse ao cuidador via split de pagamento da Asaas (transferência para a subconta
// ligada à chave Pix cadastrada) ainda não foi implementado — nenhuma subconta foi criada. Isto só
// simula a confirmação, sempre com sucesso e "instantâneo".
export async function solicitarResgatePix(_valor: number, _chavePix: string): Promise<ResultadoResgate> {
  await atraso(1200);
  return { id: gerarId('resgate'), status: 'concluido' };
}
