import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { dicas } from '../data/dicas';
import { colors, fontSize, fontWeight, gradients, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function DicaDetalheScreen({ navigation, route }: RootStackScreenProps<'DicaDetalhe'>) {
  const dica = dicas.find((d) => d.id === route.params.dicaId);

  if (!dica) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Dica não encontrada" onBack={() => navigation.goBack()} gradientColors={gradients.dicas} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Dica de Cuidado" onBack={() => navigation.goBack()} gradientColors={gradients.dicas} />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView>
          <Image source={{ uri: dica.imagem }} style={styles.capa} />
          <View style={styles.content}>
            <Text style={styles.titulo}>{dica.titulo}</Text>
            <Text style={styles.subtitulo}>{dica.subtitulo}</Text>
            {dica.conteudo.map((paragrafo, index) => (
              <Text key={index} style={styles.paragrafo}>
                {paragrafo}
              </Text>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  capa: { width: '100%', height: 220 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  titulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
  subtitulo: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  paragrafo: { fontSize: fontSize.md, color: colors.text, lineHeight: 24, marginBottom: spacing.md },
});
