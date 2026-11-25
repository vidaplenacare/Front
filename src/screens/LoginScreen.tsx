import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LayoutLogin } from '../components/LayoutLogin';
import { Aviso, Botao, Campo } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { colors, fontSize, fontWeight, paletas, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

// Visual novo (2026-09-30): mesma moldura do login do profissional (`LayoutLogin`), em azul.
const AREA = 'membro' as const;

export function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { entrar, sair } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleEntrar = async () => {
    setErro(null);
    setEntrando(true);
    try {
      const sessao = await entrar(email.trim(), senha);
      if (sessao.usuario.tipo !== 'membro') {
        // Login certo, mas na tela errada — não deixa a sessão de cuidador ativa por engano.
        await sair();
        setErro('Essa conta é de cuidador — entre pela área do Colaborador.');
        return;
      }
      navigation.replace('Home');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setEntrando(false);
    }
  };

  return (
    <LayoutLogin
      area={AREA}
      slogan="Cuidado e bem-estar para você"
      selo={{ icone: 'shield-checkmark', texto: 'Hub de Cuidados em Saúde' }}
      titulo="Bem-vindo de volta!"
      subtitulo="Acesse sua conta para continuar"
      onVoltar={() => navigation.navigate('ColaboradorSeletor')}
    >
      <View style={styles.campos}>
        <Campo
          area={AREA}
          rotulo="E-mail"
          icone="mail-outline"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Campo
          area={AREA}
          rotulo="Senha"
          icone="lock-closed-outline"
          placeholder="Sua senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!mostrarSenha}
          autoComplete="password"
          onSubmitEditing={handleEntrar}
          direita={
            <TouchableOpacity
              onPress={() => setMostrarSenha((v) => !v)}
              style={styles.olho}
              accessibilityRole="button"
              accessibilityLabel={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
            >
              <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.gray500} />
            </TouchableOpacity>
          }
        />
        <TouchableOpacity
          style={styles.esqueci}
          onPress={() => navigation.navigate('RecuperarSenha')}
          accessibilityRole="button"
        >
          <Text style={[styles.esqueciTexto, { color: paletas[AREA].principal }]}>Esqueceu a senha?</Text>
        </TouchableOpacity>
        {!!erro && <Aviso tom="vermelho" icone="alert-circle-outline" texto={erro} />}
        <Botao
          area={AREA}
          titulo="Entrar"
          icone="log-in-outline"
          iconeAntes
          carregando={entrando}
          desabilitado={!email.trim() || !senha}
          onPress={handleEntrar}
        />
      </View>

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('CadastroMembro')} accessibilityRole="button">
        <Text style={styles.linkTexto}>
          Não tem uma conta? <Text style={[styles.linkDestaque, { color: paletas[AREA].principal }]}>Criar conta</Text>
        </Text>
      </TouchableOpacity>
    </LayoutLogin>
  );
}

const styles = StyleSheet.create({
  campos: { gap: 18, marginTop: spacing.lg },
  olho: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  esqueci: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -8 },
  esqueciTexto: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  link: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: spacing.md },
  linkTexto: { color: colors.gray600, fontSize: fontSize.md, textAlign: 'center' },
  linkDestaque: { fontWeight: fontWeight.bold },
});
