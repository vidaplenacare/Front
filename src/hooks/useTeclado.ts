import { useEffect, useState } from 'react';
import { Keyboard, Platform, type KeyboardAvoidingViewProps } from 'react-native';

// Teclado cobrindo o campo (relatado pelo usuário em 2026-09-30 no login): desde o Expo SDK 54 o
// Android roda "edge-to-edge" e NÃO encolhe mais a tela quando o teclado abre. Por isso o
// `KeyboardAvoidingView` precisa de `behavior="padding"` TAMBÉM no Android — o padrão antigo
// `Platform.OS === 'ios' ? 'padding' : undefined` deixava o teclado por cima dos campos.
//
// ⚠️ Toda tela com campo de texto usa `COMPORTAMENTO_TECLADO` no KeyboardAvoidingView.
export const COMPORTAMENTO_TECLADO: KeyboardAvoidingViewProps['behavior'] = 'padding';

/** true enquanto o teclado está aberto (ex.: para recolher um cabeçalho grande). */
export function useTecladoAberto(): boolean {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const mostrar = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setAberto(true));
    const esconder = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setAberto(false));
    return () => {
      mostrar.remove();
      esconder.remove();
    };
  }, []);
  return aberto;
}
