import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

// Fim de um processo (contratar, pagar, comprar, salvar perfil...): a pessoa volta ao INÍCIO da
// área dela com o caminho LIMPO. Pedido do usuário em 2026-09-30: depois de contratar, era preciso
// voltar tela por tela pela setinha até chegar à Home.
//
// ⚠️ Não usar `navigation.navigate('Home')` para isso: no React Navigation 7 o `navigate` EMPILHA
// uma Home nova em vez de voltar à que já existe — a setinha passa a voltar para dentro do processo.

type Nav = NavigationProp<RootStackParamList>;
export type Inicio = 'Home' | 'CuidadorPainel';

/** Volta ao início (Home do membro ou Painel do profissional), sem nada empilhado. */
export function voltarAoInicio(navigation: Nav, inicio: Inicio = 'Home'): void {
  navigation.reset({ index: 0, routes: [{ name: inicio }] });
}

/** Abre uma tela tendo SÓ o início por baixo — a setinha dela volta direto para o início. */
export function abrirAPartirDoInicio<R extends keyof RootStackParamList>(
  navigation: Nav,
  rota: R,
  params: RootStackParamList[R],
  inicio: Inicio = 'Home'
): void {
  navigation.reset({ index: 1, routes: [{ name: inicio }, { name: rota, params } as never] });
}
