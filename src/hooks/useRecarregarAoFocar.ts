import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Busca os dados de novo quando a tela aparece (inclusive ao voltar de outra tela) e quando o app
 * volta do segundo plano com a tela aberta.
 *
 * Existe porque várias mudanças acontecem FORA do aparelho: o pagamento é confirmado pelo webhook
 * da Asaas no servidor, e o cuidador aceita/inicia/conclui em outro celular. Sem isso, Home,
 * Pagamentos, Perfil e as telas do cuidador ficavam com o estado de quando o app abriu.
 *
 * `recarregar` precisa ser estável (useCallback no contexto), senão recarrega a cada render.
 */
export function useRecarregarAoFocar(recarregar: () => Promise<unknown> | void) {
  useFocusEffect(
    useCallback(() => {
      void recarregar();
      const assinatura = AppState.addEventListener('change', (estado) => {
        if (estado === 'active') void recarregar();
      });
      return () => assinatura.remove();
    }, [recarregar])
  );
}
