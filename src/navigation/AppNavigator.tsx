import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from './types';

import { ColaboradorSeletorScreen } from '../screens/ColaboradorSeletorScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RecuperarSenhaScreen } from '../screens/RecuperarSenhaScreen';
import { CriarContaSeletorScreen } from '../screens/CriarContaSeletorScreen';
import { CadastroMembroScreen } from '../screens/CadastroMembroScreen';
import { CuidadorLoginScreen } from '../screens/CuidadorLoginScreen';
import { CuidadorCadastroScreen } from '../screens/CuidadorCadastroScreen';
import { TermoScreen } from '../screens/TermoScreen';

import { HomeScreen } from '../screens/HomeScreen';
import { CuidadoresCategoriaScreen } from '../screens/CuidadoresCategoriaScreen';
import { CuidadoresScreen } from '../screens/CuidadoresScreen';
import { CuidadorPerfilScreen } from '../screens/CuidadorPerfilScreen';
import { SolicitarContratacaoScreen } from '../screens/SolicitarContratacaoScreen';
import { AcompanharCuidadorScreen } from '../screens/AcompanharCuidadorScreen';
import { PagarConsultaScreen } from '../screens/PagarConsultaScreen';
import { PagamentosScreen } from '../screens/PagamentosScreen';
import { ProdutosScreen } from '../screens/ProdutosScreen';
import { ProdutoDetalheScreen } from '../screens/ProdutoDetalheScreen';
import { CarrinhoScreen } from '../screens/CarrinhoScreen';
import { DicasScreen } from '../screens/DicasScreen';
import { DicaDetalheScreen } from '../screens/DicaDetalheScreen';
import { NotificacoesScreen } from '../screens/NotificacoesScreen';
import { DenunciaScreen } from '../screens/DenunciaScreen';
import { PerfilScreen } from '../screens/PerfilScreen';
import { ConfiguracoesScreen } from '../screens/ConfiguracoesScreen';
import { EmConstrucaoScreen } from '../screens/EmConstrucaoScreen';

import { CuidadorPainelScreen } from '../screens/CuidadorPainelScreen';
import { CuidadorVerificacaoScreen } from '../screens/CuidadorVerificacaoScreen';
import { CuidadorCompletarPerfilScreen } from '../screens/CuidadorCompletarPerfilScreen';
import { CuidadorGanhosScreen } from '../screens/CuidadorGanhosScreen';
import { CuidadorNotificacoesScreen } from '../screens/CuidadorNotificacoesScreen';
import { PedidosRecebidosScreen } from '../screens/PedidosRecebidosScreen';
import { PedidoDetalheScreen } from '../screens/PedidoDetalheScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { usuario } = useAuth();
  // Calculado uma única vez na montagem (AppContent só monta isto depois que AuthProvider termina
  // de restaurar a sessão salva) — `initialRouteName` do React Navigation não reage a mudanças
  // depois disso, então login/logout durante o uso do app navegam explicitamente, não por aqui.
  const rotaInicial: keyof RootStackParamList =
    usuario?.tipo === 'membro' ? 'Home' : usuario?.tipo === 'cuidador' ? 'CuidadorPainel' : 'ColaboradorSeletor';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={rotaInicial} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ColaboradorSeletor" component={ColaboradorSeletorScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
        <Stack.Screen name="CriarContaSeletor" component={CriarContaSeletorScreen} />
        <Stack.Screen name="CadastroMembro" component={CadastroMembroScreen} />
        <Stack.Screen name="CuidadorLogin" component={CuidadorLoginScreen} />
        <Stack.Screen name="CuidadorCadastro" component={CuidadorCadastroScreen} />

        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CuidadoresCategoria" component={CuidadoresCategoriaScreen} />
        <Stack.Screen name="Cuidadores" component={CuidadoresScreen} />
        <Stack.Screen name="CuidadorPerfil" component={CuidadorPerfilScreen} />
        <Stack.Screen name="SolicitarContratacao" component={SolicitarContratacaoScreen} />
        <Stack.Screen name="AcompanharCuidador" component={AcompanharCuidadorScreen} />
        <Stack.Screen name="PagarConsulta" component={PagarConsultaScreen} />
        <Stack.Screen name="Pagamentos" component={PagamentosScreen} />
        <Stack.Screen name="Produtos" component={ProdutosScreen} />
        <Stack.Screen name="ProdutoDetalhe" component={ProdutoDetalheScreen} />
        <Stack.Screen name="Carrinho" component={CarrinhoScreen} />
        <Stack.Screen name="Dicas" component={DicasScreen} />
        <Stack.Screen name="DicaDetalhe" component={DicaDetalheScreen} />
        <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
        <Stack.Screen name="Denuncia" component={DenunciaScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
        <Stack.Screen name="EmConstrucao" component={EmConstrucaoScreen} />
        <Stack.Screen name="Termo" component={TermoScreen} />

        <Stack.Screen name="CuidadorPainel" component={CuidadorPainelScreen} />
        <Stack.Screen name="CuidadorVerificacao" component={CuidadorVerificacaoScreen} />
        <Stack.Screen name="CuidadorCompletarPerfil" component={CuidadorCompletarPerfilScreen} />
        <Stack.Screen name="CuidadorGanhos" component={CuidadorGanhosScreen} />
        <Stack.Screen name="CuidadorNotificacoes" component={CuidadorNotificacoesScreen} />
        <Stack.Screen name="PedidosRecebidos" component={PedidosRecebidosScreen} />
        <Stack.Screen name="PedidoDetalhe" component={PedidoDetalheScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
