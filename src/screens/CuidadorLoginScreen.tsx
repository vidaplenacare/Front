import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LayoutLogin } from '../components/LayoutLogin';
import { Aviso, Botao, Campo } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { colors, fontSize, fontWeight, paletas, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const AREA = 'cuidador' as const;

export function CuidadorLoginScreen({ navigation }: RootStackScreenProps<'CuidadorLogin'>) {
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
      if (sessao.usuario.tipo !== 'cuidador') {
        await sair();
        setErro('Essa conta é de membro — entre pela área do Membro.');
        return;
      }
      navigation.replace('CuidadorPainel');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setEntrando(false);
    }
  };

  return (
    <LayoutLogin
      area={AREA}
      slogan="Área do Colaborador"
      selo={{ icone: 'medkit', texto: 'Espaço do Profissional' }}
      titulo="Acesse sua conta profissional"
      subtitulo="Entre para gerenciar seus atendimentos"
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

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('CuidadorCadastro')} accessibilityRole="button">
        <Text style={styles.linkTexto}>
          Ainda não é cadastrado? <Text style={[styles.linkDestaque, { color: paletas[AREA].principal }]}>Quero ser Cuidador</Text>
        </Text>
      </TouchableOpacity>
    </LayoutLogin>
  );
}

const styles = StyleSheet.create({
  campos: { gap: 18, marginTop: spacing.lg },
  olho: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  link: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: spacing.md },
  linkTexto: { color: colors.gray600, fontSize: fontSize.md, textAlign: 'center' },
  linkDestaque: { fontWeight: fontWeight.bold },
});
