import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';
import { useDialogo } from '../components/Dialogo';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../contexts/AppContext';
import { useCuidador } from '../contexts/CuidadorContext';
import { colors, fontSize, fontWeight, gradients, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const motivosPorTipo = {
  membro_para_cuidador: ['Comportamento inadequado', 'Falta sem aviso', 'Cobrança indevida'],
  cuidador_para_membro: ['Não pagamento', 'Ambiente inseguro', 'Mau trato'],
} as const;

export function DenunciaScreen({ navigation, route }: RootStackScreenProps<'Denuncia'>) {
  const { tipo, alvoId, alvoNome } = route.params;
  const { registrarDenuncia } = useApp();
  const { denunciarMembro } = useCuidador();
  const dialogo = useDialogo();

  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [descricao, setDescricao] = useState('');

  const motivos = motivosPorTipo[tipo];
  const valido = motivosSelecionados.length > 0;

  const toggleMotivo = (motivo: string) => {
    setMotivosSelecionados((prev) =>
      prev.includes(motivo) ? prev.filter((m) => m !== motivo) : [...prev, motivo]
    );
  };

  const enviar = async () => {
    const confirmado = await dialogo.confirmar({
      titulo: 'Enviar denúncia',
      mensagem: 'Nossa equipe vai analisar o ocorrido com sigilo. Deseja enviar?',
      icone: 'flag-outline',
      tom: 'perigo',
      confirmar: 'Enviar denúncia',
    });
    if (!confirmado) return;
    if (tipo === 'membro_para_cuidador') {
      registrarDenuncia({ tipo, motivos: motivosSelecionados, descricao, alvoId, alvoNome });
    } else {
      denunciarMembro(alvoId ?? '', alvoNome ?? 'Membro', motivosSelecionados, descricao);
    }
    await dialogo.avisar({
      titulo: 'Denúncia enviada',
      mensagem: 'Obrigado por nos avisar. Nossa equipe vai analisar o ocorrido.',
      tom: 'sucesso',
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Denunciar" onBack={() => navigation.goBack()} gradientColors={gradients.perigo} />
      {/* Teclado não cobre os campos (Android edge-to-edge, hooks/useTeclado.ts). */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {alvoNome ? <Text style={styles.alvo}>Denúncia sobre: {alvoNome}</Text> : null}

          <Text style={styles.sectionTitle}>Selecione o motivo</Text>
          {motivos.map((motivo) => {
            const selecionado = motivosSelecionados.includes(motivo);
            return (
              <TouchableOpacity key={motivo} style={styles.motivoCard} onPress={() => toggleMotivo(motivo)} activeOpacity={0.8}>
                <Ionicons
                  name={selecionado ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={selecionado ? colors.danger : colors.textSecondary}
                />
                <Text style={styles.motivoText}>{motivo}</Text>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.sectionTitle}>Descreva o ocorrido</Text>
          <TextInput
            style={styles.textArea}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Conte com detalhes o que aconteceu"
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity style={[styles.button, !valido && styles.buttonDisabled]} disabled={!valido} onPress={enviar}>
            <Text style={styles.buttonText}>Enviar denúncia</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  alvo: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.md },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  motivoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  motivoText: { fontSize: fontSize.md, color: colors.text },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
