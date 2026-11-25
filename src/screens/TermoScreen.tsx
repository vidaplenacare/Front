import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, CabecalhoHero, Cartao, estilosUi } from '../components/ui';
import { TERMOS } from '../data/termos';
import { conteudoCentralizado } from '../hooks/useResponsivo';
import { colors, fontSize, fontWeight } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

// Leitura de um termo inteiro (Termo de Uso, Política de Privacidade, Termo do Contratante ou do
// Prestador). Aberta do cadastro, do perfil do membro, das configurações e do painel do cuidador;
// `area` só muda a cor do cabeçalho. Texto em `data/termos.ts` (cópia fiel dos .docx oficiais).
export function TermoScreen({ navigation, route }: RootStackScreenProps<'Termo'>) {
  const { id, area = 'membro' } = route.params;
  const termo = TERMOS[id];

  return (
    <View style={estilosUi.tela}>
      <CabecalhoHero
        area={area}
        titulo={termo.titulo}
        subtitulo={`Última atualização: ${termo.atualizadoEm}`}
        onVoltar={() => navigation.goBack()}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[estilosUi.miolo, conteudoCentralizado, { paddingTop: 20 }]}>
          {!!termo.introducao && <Text style={styles.introducao}>{termo.introducao}</Text>}

          {termo.secoes.map((secao) => (
            <Cartao key={secao.titulo} style={styles.secao}>
              <Text style={styles.secaoTitulo} accessibilityRole="header">
                {secao.titulo}
              </Text>
              {secao.paragrafos.map((paragrafo, i) => (
                <Text key={i} style={styles.paragrafo}>
                  {paragrafo}
                </Text>
              ))}
            </Cartao>
          ))}

          <Aviso
            tom="vermelho"
            icone="call-outline"
            texto="Em urgência ou risco à vida, ligue para o SAMU (192). O aplicativo não é serviço de emergência."
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  introducao: { fontSize: fontSize.md, color: colors.gray700, lineHeight: 24, fontStyle: 'italic' },
  secao: { gap: 10 },
  secaoTitulo: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  // Corpo em 16/24: leitura longa, público idoso.
  paragrafo: { fontSize: fontSize.md, color: colors.gray700, lineHeight: 24 },
});
