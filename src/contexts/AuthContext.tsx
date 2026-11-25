import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  buscarUsuarioAtual,
  cadastrarCuidador as cadastrarCuidadorApi,
  cadastrarMembro as cadastrarMembroApi,
  enviarFotoPerfil,
  login as loginApi,
  logout as logoutApi,
  type CategoriaCuidadorApi,
  type CuidadorApi,
  type SessaoApi,
  type UsuarioApi,
} from '../services/api';
import { guardarFotoNoCache } from '../services/cacheFotos';

const CHAVE_TOKEN = 'vida-plena-token';

interface AuthContextValue {
  usuario: UsuarioApi | null;
  cuidador: CuidadorApi | null;
  token: string | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<SessaoApi>;
  cadastrarMembro: (dados: Parameters<typeof cadastrarMembroApi>[0]) => Promise<SessaoApi>;
  cadastrarCuidador: (dados: Parameters<typeof cadastrarCuidadorApi>[0]) => Promise<SessaoApi>;
  atualizarCuidador: (cuidador: CuidadorApi) => void;
  /** Envia a foto tirada pela câmera e já atualiza a conta no aparelho. */
  enviarFoto: (imagemBase64: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioApi | null>(null);
  const [cuidador, setCuidador] = useState<CuidadorApi | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Restaura a sessão salva no aparelho ao abrir o app — se o token não existir mais/tiver sido
  // revogado, `buscarUsuarioAtual` devolve `null` e o app simplesmente abre deslogado.
  useEffect(() => {
    (async () => {
      const tokenSalvo = await SecureStore.getItemAsync(CHAVE_TOKEN);
      if (tokenSalvo) {
        const sessao = await buscarUsuarioAtual(tokenSalvo);
        if (sessao) {
          setUsuario(sessao.usuario);
          setCuidador(sessao.cuidador ?? null);
          setToken(tokenSalvo);
        } else {
          await SecureStore.deleteItemAsync(CHAVE_TOKEN);
        }
      }
      setCarregando(false);
    })();
  }, []);

  const aplicarSessao = async (sessao: SessaoApi) => {
    await SecureStore.setItemAsync(CHAVE_TOKEN, sessao.token);
    setUsuario(sessao.usuario);
    setCuidador(sessao.cuidador ?? null);
    setToken(sessao.token);
    return sessao;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      cuidador,
      token,
      carregando,
      entrar: async (email, senha) => aplicarSessao(await loginApi(email, senha)),
      cadastrarMembro: async (dados) => aplicarSessao(await cadastrarMembroApi(dados)),
      cadastrarCuidador: async (dados) => aplicarSessao(await cadastrarCuidadorApi(dados)),
      atualizarCuidador: (novoCuidador) => setCuidador(novoCuidador),
      enviarFoto: async (imagemBase64) => {
        if (!token) throw new Error('Entre na sua conta para enviar a foto');
        const { fotoPerfil } = await enviarFotoPerfil(token, imagemBase64);
        // A foto já está no aparelho: aparece na hora, sem baixar de volta do servidor.
        guardarFotoNoCache(fotoPerfil, imagemBase64);
        setUsuario((atual) => (atual ? { ...atual, fotoPerfil } : atual));
      },
      sair: async () => {
        if (token) await logoutApi(token);
        await SecureStore.deleteItemAsync(CHAVE_TOKEN);
        setUsuario(null);
        setCuidador(null);
        setToken(null);
      },
    }),
    [usuario, cuidador, token, carregando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
