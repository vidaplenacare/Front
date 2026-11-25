import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PillInput } from './PillInput';
import { GradientButton } from './GradientButton';
import {
  confirmarPagamentoPix,
  gerarCobrancaPix,
  pagarComCartao,
  type FormaPagamento,
} from '../services/pagamentos';
import { maskCartaoNumero, maskValidadeCartao } from '../utils/masks';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

interface PagamentoBoxProps {
  valor: number;
  onConcluido: (formaPagamento: FormaPagamento) => void;
}

export function PagamentoBox({ valor, onConcluido }: PagamentoBoxProps) {
  const [metodo, setMetodo] = useState<FormaPagamento | null>(null);

  return (
    <View>
      <View style={styles.seletor}>
        <TouchableOpacity
          style={[styles.seletorOpcao, metodo === 'pix' && styles.seletorOpcaoAtiva]}
          onPress={() => setMetodo('pix')}
        >
          <Ionicons name="qr-code-outline" size={18} color={metodo === 'pix' ? colors.white : colors.text} />
          <Text style={[styles.seletorTexto, metodo === 'pix' && styles.seletorTextoAtivo]}>Pix</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.seletorOpcao, metodo === 'cartao' && styles.seletorOpcaoAtiva]}
          onPress={() => setMetodo('cartao')}
        >
          <Ionicons name="card-outline" size={18} color={metodo === 'cartao' ? colors.white : colors.text} />
          <Text style={[styles.seletorTexto, metodo === 'cartao' && styles.seletorTextoAtivo]}>Cartão de crédito</Text>
        </TouchableOpacity>
      </View>

      {metodo === 'pix' && <PagamentoPix valor={valor} onConcluido={() => onConcluido('pix')} />}
      {metodo === 'cartao' && <PagamentoCartao onConcluido={() => onConcluido('cartao')} />}
    </View>
  );
}

function PagamentoPix({ valor, onConcluido }: { valor: number; onConcluido: () => void }) {
  const cobranca = useMemo(() => gerarCobrancaPix(valor), [valor]);
  const [confirmando, setConfirmando] = useState(false);

  const confirmar = async () => {
    setConfirmando(true);
    await confirmarPagamentoPix();
    setConfirmando(false);
    onConcluido();
  };

  return (
    <View style={styles.metodoBox}>
      <Text style={styles.metodoLabel}>Copie o código abaixo no app do seu banco</Text>
      <View style={styles.pixCodigoBox}>
        <Text style={styles.pixCodigoTexto} selectable numberOfLines={3}>
          {cobranca.copiaECola}
        </Text>
      </View>
      <Text style={styles.dicaTexto}>O código expira em 30 minutos.</Text>
      <View style={{ marginTop: spacing.md }}>
        <GradientButton
          title={confirmando ? 'Verificando pagamento…' : 'Já paguei'}
          icon={confirmando ? undefined : 'checkmark'}
          disabled={confirmando}
          onPress={confirmar}
        />
      </View>
    </View>
  );
}

function PagamentoCartao({ onConcluido }: { onConcluido: () => void }) {
  const [numero, setNumero] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [nomeTitular, setNomeTitular] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valido = numero.replace(/\D/g, '').length >= 15 && validade.length === 5 && cvv.length >= 3 && nomeTitular.trim().length > 0;

  const pagar = async () => {
    setErro(null);
    setProcessando(true);
    const resultado = await pagarComCartao({ numero, validade, cvv, nomeTitular });
    setProcessando(false);
    if (resultado.status === 'recusado') {
      setErro(resultado.motivo ?? 'Pagamento recusado.');
      return;
    }
    onConcluido();
  };

  return (
    <View style={styles.metodoBox}>
      <PillInput
        icon="card-outline"
        placeholder="Número do cartão"
        keyboardType="number-pad"
        value={numero}
        onChangeText={(v) => setNumero(maskCartaoNumero(v))}
      />
      <View style={[styles.linhaDupla, { marginTop: spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <PillInput
            icon="calendar-outline"
            placeholder="MM/AA"
            keyboardType="number-pad"
            value={validade}
            onChangeText={(v) => setValidade(maskValidadeCartao(v))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PillInput
            icon="lock-closed-outline"
            placeholder="CVV"
            keyboardType="number-pad"
            secureTextEntry
            value={cvv}
            onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
          />
        </View>
      </View>
      <View style={{ marginTop: spacing.sm }}>
        <PillInput
          icon="person-outline"
          placeholder="Nome impresso no cartão"
          autoCapitalize="words"
          value={nomeTitular}
          onChangeText={setNomeTitular}
        />
      </View>
      {erro && (
        <View style={styles.erroBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      )}
      <View style={{ marginTop: spacing.md }}>
        {processando ? (
          <View style={styles.processandoBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.dicaTexto}>Processando pagamento…</Text>
          </View>
        ) : (
          <GradientButton title="Pagar" icon="checkmark" disabled={!valido} onPress={pagar} />
        )}
      </View>
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
  pixCodigoBox: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pixCodigoTexto: { fontSize: fontSize.xs, color: colors.text },
  dicaTexto: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.sm },
  linhaDupla: { flexDirection: 'row', gap: spacing.sm },
  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  erroTexto: { fontSize: fontSize.xs, color: colors.danger, flex: 1 },
  processandoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
});
