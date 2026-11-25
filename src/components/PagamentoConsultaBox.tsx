import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from './GradientButton';
import { PillInput } from './PillInput';
import { ErroApi, type InicioPagamentoApi } from '../services/api';
import type { FormaPagamento } from '../services/pagamentos';
import { maskCpf } from '../utils/masks';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

const INTERVALO_VERIFICACAO_MS = 4000;

interface Props {
  iniciar: (forma: FormaPagamento, cpf?: string) => Promise<InicioPagamentoApi>;
  /** Recarrega o status do servidor. Quando o webhook da Asaas confirmar, a tela que usa este
   * componente passa a mostrar "pago" e o desmonta — é isso que para a verificação. */
  verificar: () => Promise<void>;
}

// Pagamento REAL de uma visita (Asaas). Diferente do `PagamentoBox` (mock, ainda usado no carrinho
// da loja): aqui nada é considerado pago no app — só o webhook da Asaas no servidor confirma.
export function PagamentoConsultaBox({ iniciar, verificar }: Props) {
  const [metodo, setMetodo] = useState<FormaPagamento | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pedindoCpf, setPedindoCpf] = useState(false);
  const [cpf, setCpf] = useState('');
  const [cobranca, setCobranca] = useState<InicioPagamentoApi | null>(null);

  const escolher = async (forma: FormaPagamento, cpfInformado?: string) => {
    setMetodo(forma);
    setErro(null);
    setCobranca(null);
    setCarregando(true);
    try {
      const resultado = await iniciar(forma, cpfInformado);
      setPedindoCpf(false);
      setCobranca(resultado);
      if (forma === 'cartao' && resultado.urlPagamento) {
        await Linking.openURL(resultado.urlPagamento);
      }
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === 'CPF_OBRIGATORIO') {
        setPedindoCpf(true);
        if (cpfInformado) setErro(e.message);
      } else {
        setErro(e instanceof Error ? e.message : 'Não foi possível iniciar o pagamento.');
      }
    } finally {
      setCarregando(false);
    }
  };

  // Enquanto há uma cobrança aberta, confere de tempos em tempos se o webhook já confirmou.
  useEffect(() => {
    if (!cobranca) return;
    const intervalo = setInterval(() => {
      verificar().catch(() => {});
    }, INTERVALO_VERIFICACAO_MS);
    return () => clearInterval(intervalo);
  }, [cobranca, verificar]);

  return (
    <View>
      <View style={styles.seletor}>
        <OpcaoMetodo
          ativo={metodo === 'pix'}
          icone="qr-code-outline"
          texto="Pix"
          onPress={() => escolher('pix')}
          desabilitado={carregando}
        />
        <OpcaoMetodo
          ativo={metodo === 'cartao'}
          icone="card-outline"
          texto="Cartão de crédito"
          onPress={() => escolher('cartao')}
          desabilitado={carregando}
        />
      </View>

      {pedindoCpf && metodo && (
        <View style={styles.metodoBox}>
          <Text style={styles.metodoLabel}>Para emitir a cobrança, precisamos do seu CPF.</Text>
          <PillInput
            icon="card-outline"
            placeholder="000.000.000-00"
            keyboardType="number-pad"
            value={cpf}
            onChangeText={(v) => setCpf(maskCpf(v))}
          />
          <View style={{ marginTop: spacing.md }}>
            <GradientButton
              title="Continuar"
              icon="arrow-forward"
              disabled={cpf.replace(/\D/g, '').length !== 11 || carregando}
              onPress={() => escolher(metodo, cpf)}
            />
          </View>
        </View>
      )}

      {carregando && (
        <View style={styles.processandoBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.dicaTexto}>Gerando cobrança…</Text>
        </View>
      )}

      {erro && (
        <View style={styles.erroBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      )}

      {cobranca && metodo === 'pix' && cobranca.pix && (
        <View style={styles.metodoBox}>
          <Text style={styles.metodoLabel}>Escaneie o QR code ou copie o código no app do seu banco</Text>
          <Image
            source={{ uri: `data:image/png;base64,${cobranca.pix.qrCodeBase64}` }}
            style={styles.qrCode}
            resizeMode="contain"
          />
          <View style={styles.pixCodigoBox}>
            <Text style={styles.pixCodigoTexto} selectable numberOfLines={3}>
              {cobranca.pix.copiaECola}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.linkAcao}
            onPress={() => Share.share({ message: cobranca.pix!.copiaECola })}
          >
            <Ionicons name="share-outline" size={16} color={colors.primary} />
            <Text style={styles.linkAcaoTexto}>Compartilhar código Pix</Text>
          </TouchableOpacity>
          <AguardandoConfirmacao />
        </View>
      )}

      {cobranca && metodo === 'cartao' && (
        <View style={styles.metodoBox}>
          <Text style={styles.metodoLabel}>
            Abrimos a página segura de pagamento. Os dados do cartão são digitados direto nela.
          </Text>
          {cobranca.urlPagamento && (
            <TouchableOpacity style={styles.linkAcao} onPress={() => Linking.openURL(cobranca.urlPagamento!)}>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.linkAcaoTexto}>Abrir a página de pagamento de novo</Text>
            </TouchableOpacity>
          )}
          <AguardandoConfirmacao />
        </View>
      )}
    </View>
  );
}

function OpcaoMetodo(props: {
  ativo: boolean;
  icone: keyof typeof Ionicons.glyphMap;
  texto: string;
  onPress: () => void;
  desabilitado: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.seletorOpcao, props.ativo && styles.seletorOpcaoAtiva]}
      onPress={props.onPress}
      disabled={props.desabilitado}
    >
      <Ionicons name={props.icone} size={18} color={props.ativo ? colors.white : colors.text} />
      <Text style={[styles.seletorTexto, props.ativo && styles.seletorTextoAtivo]}>{props.texto}</Text>
    </TouchableOpacity>
  );
}

function AguardandoConfirmacao() {
  return (
    <View style={styles.processandoBox}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.dicaTexto}>Aguardando a confirmação do pagamento — atualiza sozinho.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  seletor: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  seletorOpcao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.gray50,
  },
  seletorOpcaoAtiva: { backgroundColor: colors.primary, borderColor: colors.primary },
  seletorTexto: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  seletorTextoAtivo: { color: colors.white },
  metodoBox: { marginTop: spacing.sm },
  metodoLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  qrCode: { width: 200, height: 200, alignSelf: 'center', marginBottom: spacing.md },
  pixCodigoBox: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pixCodigoTexto: { fontSize: fontSize.xs, color: colors.text },
  linkAcao: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  linkAcaoTexto: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  dicaTexto: { fontSize: fontSize.xs, color: colors.textLight, flexShrink: 1 },
  erroBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  erroTexto: { fontSize: fontSize.xs, color: colors.danger, flex: 1 },
  processandoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
});
