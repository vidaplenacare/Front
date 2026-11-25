import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { Ionicons } from '@expo/vector-icons';
import { ListaTermos } from '../components/ListaTermos';
import { WizardHeader } from '../components/WizardHeader';
import { TERMOS_DO_CUIDADOR, VERSAO_TERMOS, declaracaoDeAceite } from '../data/termos';
import { Aviso, Botao, CaixaMarcar, Campo, Cartao, OpcaoEscolha, RodapeFixo, TituloSecao, estilosUi } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { colors, fontSize, fontWeight, paletas } from '../theme';
import { maskCpf, maskTelefone } from '../utils/masks';
import type { RootStackScreenProps } from '../navigation/types';

const AREA = 'cuidador' as const;

export type CategoriaProfissional = 'cuidador' | 'tecnico' | 'enfermeiro';

export const categorias: { id: CategoriaProfissional; nome: string; descricao: string }[] = [
  { id: 'cuidador', nome: 'Cuidador de Idosos', descricao: 'Sem registro profissional obrigatório' },
  { id: 'tecnico', nome: 'Técnico de Enfermagem', descricao: 'Requer COREN e certificado técnico' },
  { id: 'enfermeiro', nome: 'Enfermeiro', descricao: 'Requer COREN e diploma de graduação' },
];

// Termos aceitos na criação da conta (etapa 3): Termo de Uso, Termo do Prestador de Serviços e
// Política de Privacidade (versão oficial de 16.10.2026, em `data/termos.ts`). O Termo do Prestador
// já traz as regras específicas de cada categoria (itens 4 e 5). Substituíram em 2026-10-22 o
// rascunho de "termo de responsabilidade" por categoria que ficava aqui.

// Cria a conta de cuidador — dados pessoais, categoria e aceite dos termos
// (ver DEV-NOTES.md 2026-08-15 sobre o cadastro ser rápido de propósito). A verificação
// profissional completa (documentos/COREN/quiz, que pode reprovar) continua opcional, feita
// depois em `CuidadorVerificacaoScreen`, acessível pelo painel.
export function CuidadorCadastroScreen({ navigation }: RootStackScreenProps<'CuidadorCadastro'>) {
  const { cadastrarCuidador } = useAuth();

  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [categoria, setCategoria] = useState<CategoriaProfissional | null>(null);
  const [aceiteResponsabilidade, setAceiteResponsabilidade] = useState(false);

  const etapa1Valida =
    nome.trim().length > 0 &&
    telefone.length >= 14 &&
    email.trim().length > 0 &&
    senha.length >= 6 &&
    senha === confirmarSenha;
  const etapa2Valida = categoria !== null;
  const etapa3Valida = aceiteResponsabilidade;

  const criarConta = async () => {
    if (!categoria || !aceiteResponsabilidade) return;
    setErro(null);
    setEnviando(true);
    try {
      await cadastrarCuidador({
        nome,
        email: email.trim(),
        senha,
        telefone,
        categoria,
        cpf: cpf.trim() || undefined,
        versaoTermos: VERSAO_TERMOS,
      });
      navigation.replace('CuidadorPainel');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar sua conta. Tente novamente.');
      setEnviando(false);
    }
  };

  if (enviando) {
    return (
      <View style={styles.analise}>
        <ActivityIndicator size="large" color={paletas[AREA].principal} />
        <Text style={styles.analiseTitulo}>Criando sua conta...</Text>
        <Text style={estilosUi.textoCorpo}>Isso pode levar alguns instantes.</Text>
      </View>
    );
  }

  const etapaValida =
    (etapa === 1 && etapa1Valida) || (etapa === 2 && etapa2Valida) || (etapa === 3 && etapa3Valida);

  const senhasDiferentes = confirmarSenha.length > 0 && senha !== confirmarSenha;

  const olho = (visivel: boolean, alternar: () => void) => (
    <TouchableOpacity
      onPress={alternar}
      style={styles.olho}
      accessibilityRole="button"
      accessibilityLabel={visivel ? 'Esconder senha' : 'Mostrar senha'}
    >
      <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.gray500} />
    </TouchableOpacity>
  );

  return (
    <View style={estilosUi.tela}>
      <WizardHeader
        title="Quero ser Cuidador"
        subtitle={`Criar conta profissional — etapa ${etapa} de 3`}
        step={etapa}
        totalSteps={3}
        onBack={() => (etapa > 1 ? setEtapa((e) => (e - 1) as 1 | 2) : navigation.goBack())}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
        <ScrollView
          contentContainerStyle={[estilosUi.miolo, conteudoCentralizado, { paddingTop: 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          {etapa === 1 && (
            <>
              <TituloSecao>Dados pessoais</TituloSecao>
              <Cartao style={{ gap: 18 }}>
                <Campo
                  area={AREA}
                  rotulo="Nome completo"
                  icone="person-outline"
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
                <Campo
                  area={AREA}
                  rotulo="Telefone"
                  icone="call-outline"
                  value={telefone}
                  onChangeText={(v) => setTelefone(maskTelefone(v))}
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                />
                <Campo
                  area={AREA}
                  rotulo="E-mail"
                  icone="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seuemail@exemplo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <Campo
                  area={AREA}
                  rotulo="CPF"
                  ajuda="Opcional por enquanto — é pedido na verificação profissional."
                  icone="card-outline"
                  value={cpf}
                  onChangeText={(v) => setCpf(maskCpf(v))}
                  placeholder="000.000.000-00"
                  keyboardType="numeric"
                />
              </Cartao>

              <TituloSecao>Senha de acesso</TituloSecao>
              <Cartao style={{ gap: 18 }}>
                <Campo
                  area={AREA}
                  rotulo="Senha"
                  ajuda="Mínimo de 6 caracteres."
                  icone="lock-closed-outline"
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Crie uma senha"
                  secureTextEntry={!mostrarSenha}
                  direita={olho(mostrarSenha, () => setMostrarSenha((v) => !v))}
                />
                <Campo
                  area={AREA}
                  rotulo="Confirmar senha"
                  icone="lock-closed-outline"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Digite a senha de novo"
                  secureTextEntry={!mostrarConfirmarSenha}
                  erro={senhasDiferentes ? 'As senhas não são iguais.' : null}
                  direita={olho(mostrarConfirmarSenha, () => setMostrarConfirmarSenha((v) => !v))}
                />
              </Cartao>
            </>
          )}

          {etapa === 2 && (
            <>
              <TituloSecao>Qual é a sua área?</TituloSecao>
              <View style={{ gap: 10 }} accessibilityRole="radiogroup">
                {categorias.map((cat) => (
                  <OpcaoEscolha
                    key={cat.id}
                    area={AREA}
                    icone={cat.id === 'cuidador' ? 'heart-outline' : 'medkit-outline'}
                    titulo={cat.nome}
                    descricao={cat.descricao}
                    selecionada={categoria === cat.id}
                    onPress={() => setCategoria(cat.id)}
                  />
                ))}
              </View>
              <Aviso
                tom="azul"
                icone="information-circle-outline"
                texto="Depois de criar a conta, você completa a verificação profissional (documentos, registro e avaliação) quando quiser, pelo seu painel."
              />
            </>
          )}

          {etapa === 3 && categoria && (
            <>
              <TituloSecao>Termos e privacidade</TituloSecao>
              <Text style={estilosUi.textoCorpo}>
                Leia com atenção antes de criar sua conta como {categorias.find((c) => c.id === categoria)?.nome}. Toque
                em cada documento para abrir.
              </Text>
              <ListaTermos ids={TERMOS_DO_CUIDADOR} area={AREA} />
              <CaixaMarcar
                area={AREA}
                texto="Li e concordo"
                descricao={declaracaoDeAceite(nome, cpf, TERMOS_DO_CUIDADOR)}
                marcada={aceiteResponsabilidade}
                onAlternar={() => setAceiteResponsabilidade((v) => !v)}
              />
              {erro && <Aviso tom="vermelho" icone="alert-circle-outline" texto={erro} />}
            </>
          )}
        </ScrollView>

        <RodapeFixo>
          <View style={styles.rodapeLinha}>
            {etapa > 1 && (
              <Botao
                area={AREA}
                variante="contorno"
                titulo="Voltar"
                onPress={() => setEtapa((e) => (e - 1) as 1 | 2)}
                style={{ flex: 1 }}
              />
            )}
            {etapa < 3 ? (
              <Botao
                area={AREA}
                titulo="Continuar"
                icone="arrow-forward"
                desabilitado={!etapaValida}
                onPress={() => setEtapa((e) => (e + 1) as 2 | 3)}
                style={{ flex: 2 }}
              />
            ) : (
              <Botao
                area={AREA}
                titulo="Criar conta"
                icone="checkmark"
                desabilitado={!etapaValida}
                onPress={criarConta}
                style={{ flex: 2 }}
              />
            )}
          </View>
        </RodapeFixo>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  olho: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  rodapeLinha: { flexDirection: 'row', gap: 12 },
  analise: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background, padding: 24 },
  analiseTitulo: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.text, textAlign: 'center' },
});
