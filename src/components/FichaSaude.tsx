import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cartao, IconeCirculo, estilosUi } from './ui';
import { colors, fontSize, fontWeight, paletas, tons, type Area } from '../theme';

interface Props {
  area: Area;
  condicoes: string[];
  alergias: string[];
  medicamentos: { nome: string; dosagem: string; horarios: string[] }[];
  /** Texto quando não há medicamentos (ex.: "aparece depois que você aceitar"). */
  semMedicamentos?: string;
}

// Cartão "Ficha de saúde": condições em pílulas azuis, alergias em destaque vermelho (é o que não
// pode passar despercebido) e medicamentos com horário.
export function FichaSaude({ area, condicoes, alergias, medicamentos, semMedicamentos = 'Nenhum medicamento informado.' }: Props) {
  return (
    <Cartao>
      <View style={styles.titulo}>
        <Ionicons name="pulse-outline" size={22} color={paletas[area].principal} />
        <Text style={styles.tituloTexto} accessibilityRole="header">
          Ficha de saúde
        </Text>
      </View>

      <View style={styles.bloco}>
        <Text style={estilosUi.rotuloCampo}>Condições médicas</Text>
        {condicoes.length === 0 ? (
          <Text style={estilosUi.textoCorpo}>Nenhuma condição informada.</Text>
        ) : (
          <View style={styles.pilulas}>
            {condicoes.map((c) => (
              <View key={c} style={styles.pilula}>
                <Text style={styles.pilulaTexto}>{c}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.bloco}>
        <Text style={estilosUi.rotuloCampo}>Alergias</Text>
        {alergias.length === 0 ? (
          <Text style={estilosUi.textoCorpo}>Nenhuma alergia informada.</Text>
        ) : (
          alergias.map((a) => (
            <View key={a} style={styles.alergia} accessibilityLabel={`Alergia: ${a}`}>
              <Ionicons name="warning-outline" size={20} color={tons.vermelho.forte} />
              <Text style={styles.alergiaTexto}>{a}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.bloco}>
        <Text style={estilosUi.rotuloCampo}>Medicamentos e horários</Text>
        {medicamentos.length === 0 ? (
          <Text style={estilosUi.textoCorpo}>{semMedicamentos}</Text>
        ) : (
          medicamentos.map((m) => (
            <View key={m.nome} style={styles.medicamento}>
              <IconeCirculo icone="medkit-outline" tom="roxo" tamanho={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.medicamentoNome}>
                  {m.nome} {m.dosagem}
                </Text>
                <Text style={estilosUi.textoApoio}>{m.horarios.join(' e ')}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tituloTexto: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.text },
  bloco: { gap: 8 },
  pilulas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilula: { backgroundColor: tons.azul.fundo, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pilulaTexto: { color: tons.azul.forte, fontSize: 15, fontWeight: fontWeight.bold },
  alergia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: tons.vermelho.fundo,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  alergiaTexto: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: tons.vermelho.texto },
  medicamento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  medicamentoNome: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
});
