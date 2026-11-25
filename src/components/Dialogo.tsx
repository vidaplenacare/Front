import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, fontWeight, gradients, radius, shadows, spacing } from '../theme';

// Substitui o `Alert.alert` nativo do Android (visual do sistema, texto pequeno, botões miúdos) por
// uma janela no visual do app, pensada para leitura fácil: ícone grande, texto maior, botões
// grandes empilhados. Uso:
//   const dialogo = useDialogo();
//   if (await dialogo.confirmar({ titulo, mensagem, tom: 'perigo', confirmar: 'Sair' })) { ... }
//   await dialogo.avisar({ titulo, mensagem, tom: 'sucesso' });

export type TomDialogo = 'info' | 'sucesso' | 'perigo' | 'aviso' | 'colaborador';

interface OpcoesBase {
  titulo: string;
  mensagem?: string;
  tom?: TomDialogo;
  icone?: keyof typeof Ionicons.glyphMap;
}

export interface OpcoesConfirmar extends OpcoesBase {
  /** Texto do botão principal. Padrão: "Confirmar". */
  confirmar?: string;
  /** Texto do botão de voltar. Padrão: "Cancelar". */
  cancelar?: string;
}

export interface OpcoesAvisar extends OpcoesBase {
  /** Texto do único botão. Padrão: "Entendi". */
  botao?: string;
}

interface Pedido {
  tipo: 'confirmar' | 'avisar';
  opcoes: OpcoesConfirmar & OpcoesAvisar;
  resolver: (valor: boolean) => void;
}

interface DialogoValue {
  confirmar: (opcoes: OpcoesConfirmar) => Promise<boolean>;
  avisar: (opcoes: OpcoesAvisar) => Promise<void>;
}

const DialogoContext = createContext<DialogoValue | undefined>(undefined);

const VISUAL_DO_TOM: Record<
  TomDialogo,
  { cor: string; gradiente: readonly [string, string, ...string[]]; icone: keyof typeof Ionicons.glyphMap }
> = {
  info: { cor: colors.blue, gradiente: gradients.loginMembro, icone: 'information-circle' },
  colaborador: { cor: colors.primary, gradiente: gradients.loginColaborador, icone: 'information-circle' },
  sucesso: { cor: colors.success, gradiente: gradients.sucesso, icone: 'checkmark-circle' },
  perigo: { cor: colors.danger, gradiente: gradients.perigo, icone: 'alert-circle' },
  aviso: { cor: colors.orange, gradiente: gradients.farmacia, icone: 'warning' },
};

export function DialogoProvider({ children }: { children: React.ReactNode }) {
  // Fila: se um diálogo pede outro logo em seguida (ex.: "Confirmar resgate?" → "Resgate
  // solicitado"), o segundo espera o primeiro fechar em vez de sobrepor.
  // O pedido em exibição fica também num ref: a decisão "mostra agora ou enfileira" não pode
  // depender de um updater do setState (o React pode rodá-lo duas vezes em desenvolvimento).
  const fila = useRef<Pedido[]>([]);
  const atualRef = useRef<Pedido | null>(null);
  const [atual, setAtual] = useState<Pedido | null>(null);

  const exibir = useCallback((pedido: Pedido | null) => {
    atualRef.current = pedido;
    setAtual(pedido);
  }, []);

  const enfileirar = useCallback(
    (pedido: Pedido) => {
      if (atualRef.current) fila.current.push(pedido);
      else exibir(pedido);
    },
    [exibir]
  );

  const responder = useCallback(
    (valor: boolean) => {
      const pedido = atualRef.current;
      if (!pedido) return;
      pedido.resolver(valor);
      exibir(fila.current.shift() ?? null);
    },
    [exibir]
  );

  const value = useMemo<DialogoValue>(
    () => ({
      confirmar: (opcoes) =>
        new Promise<boolean>((resolver) => enfileirar({ tipo: 'confirmar', opcoes, resolver })),
      avisar: (opcoes) =>
        new Promise<void>((resolver) =>
          enfileirar({ tipo: 'avisar', opcoes, resolver: () => resolver() })
        ),
    }),
    [enfileirar]
  );

  const visual = VISUAL_DO_TOM[atual?.opcoes.tom ?? 'info'];
  const ehConfirmacao = atual?.tipo === 'confirmar';

  return (
    <DialogoContext.Provider value={value}>
      {children}
      <Modal
        visible={atual !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        // Botão "voltar" do Android = cancelar (ou fechar, no aviso).
        onRequestClose={() => responder(false)}
      >
        <View style={styles.overlay}>
          {atual && (
            <View style={[styles.card, shadows.modal]} accessibilityViewIsModal accessibilityRole="alert">
              <View style={[styles.iconeWrap, { backgroundColor: `${visual.cor}1A` }]}>
                <Ionicons name={atual.opcoes.icone ?? visual.icone} size={40} color={visual.cor} />
              </View>
              <Text style={styles.titulo}>{atual.opcoes.titulo}</Text>
              {atual.opcoes.mensagem ? <Text style={styles.mensagem}>{atual.opcoes.mensagem}</Text> : null}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => responder(true)}
                accessibilityRole="button"
                style={styles.botaoPrincipalToque}
              >
                <LinearGradient
                  colors={visual.gradiente}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.botaoPrincipal}
                >
                  <Text style={styles.botaoPrincipalTexto}>
                    {ehConfirmacao ? atual.opcoes.confirmar ?? 'Confirmar' : atual.opcoes.botao ?? 'Entendi'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {ehConfirmacao && (
                <TouchableOpacity
                  onPress={() => responder(false)}
                  accessibilityRole="button"
                  style={styles.botaoSecundario}
                >
                  <Text style={styles.botaoSecundarioTexto}>{atual.opcoes.cancelar ?? 'Cancelar'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>
    </DialogoContext.Provider>
  );
}

export function useDialogo(): DialogoValue {
  const contexto = useContext(DialogoContext);
  if (!contexto) throw new Error('useDialogo deve ser usado dentro de um DialogoProvider');
  return contexto;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  iconeWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titulo: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  mensagem: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  botaoPrincipalToque: { alignSelf: 'stretch', marginTop: spacing.lg },
  botaoPrincipal: {
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  botaoPrincipalTexto: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold, textAlign: 'center' },
  botaoSecundario: {
    alignSelf: 'stretch',
    minHeight: 50,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundarioTexto: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
