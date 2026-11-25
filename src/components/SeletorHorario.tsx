import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from './ui';
import { colors, fontSize, fontWeight, paletas, shadows, type Area } from '../theme';

// Escolher um horário TOCANDO, em vez de digitar "08:00" (pedido do usuário em 2026-09-30, no
// "Quando você atende" do Perfil público). Parece um campo; ao tocar abre uma folha de baixo com a
// grade de horários de 30 em 30 minutos.

export function gerarHorarios(de = '05:00', ate = '23:30', passoMin = 30): string[] {
  const [hDe, mDe] = de.split(':').map(Number);
  const [hAte, mAte] = ate.split(':').map(Number);
  const lista: string[] = [];
  for (let m = hDe * 60 + mDe; m <= hAte * 60 + mAte; m += passoMin) {
    lista.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return lista;
}

const HORARIOS_PADRAO = gerarHorarios();

export function SeletorHorario({
  rotulo,
  valor,
  onEscolher,
  area,
  desabilitado,
  opcoes = HORARIOS_PADRAO,
}: {
  rotulo: string;
  valor: string;
  onEscolher: (horario: string) => void;
  area: Area;
  /** Horários que não podem ser escolhidos (ex.: "Até" antes do "Das"). */
  desabilitado?: (horario: string) => boolean;
  opcoes?: string[];
}) {
  const [aberto, setAberto] = useState(false);
  const p = paletas[area];

  return (
    <View style={styles.bloco}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TouchableOpacity
        onPress={() => setAberto(true)}
        activeOpacity={0.85}
        style={[styles.campo, !!valor && { borderColor: p.principal }]}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor || 'escolher horário'}`}
      >
        <Ionicons name="time-outline" size={20} color={valor ? p.principal : colors.gray500} />
        <Text style={[styles.valor, !valor && styles.placeholder]}>{valor || 'Escolher'}</Text>
        <Ionicons name="chevron-down" size={20} color={colors.gray500} />
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setAberto(false)}>
        <View style={styles.fundo}>
          <SafeAreaView edges={['bottom']} style={[styles.folha, shadows.modal]}>
            <Text style={styles.titulo}>{rotulo}</Text>
            <Text style={styles.ajuda}>Toque no horário.</Text>
            <ScrollView contentContainerStyle={styles.grade} style={{ maxHeight: 360 }}>
              {opcoes.map((h) => {
                const bloqueado = desabilitado?.(h) ?? false;
                const ativo = h === valor;
                return (
                  <TouchableOpacity
                    key={h}
                    disabled={bloqueado}
                    onPress={() => {
                      onEscolher(h);
                      setAberto(false);
                    }}
                    style={[
                      styles.opcao,
                      ativo && { backgroundColor: p.principal, borderColor: p.principal },
                      bloqueado && styles.opcaoBloqueada,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo, disabled: bloqueado }}
                  >
                    <Text style={[styles.opcaoTexto, ativo && { color: colors.white }, bloqueado && { color: colors.gray400 }]}>{h}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Botao area={area} variante="texto" titulo="Cancelar" onPress={() => setAberto(false)} />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: 6, flex: 1 },
  rotulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  campo: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  valor: { flex: 1, fontSize: 17, fontWeight: fontWeight.bold, color: colors.text },
  placeholder: { color: colors.gray400, fontWeight: fontWeight.regular },
  fundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end' },
  folha: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 10 },
  titulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text },
  ajuda: { fontSize: fontSize.md, color: colors.gray600 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 6 },
  opcao: {
    width: '30%',
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  opcaoBloqueada: { backgroundColor: colors.gray100, borderColor: colors.gray200 },
  opcaoTexto: { fontSize: 17, fontWeight: fontWeight.bold, color: colors.text },
});
