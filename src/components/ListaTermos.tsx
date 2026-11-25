import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Cartao, IconeCirculo, LinhaLista } from './ui';
import { TERMOS, type IdTermo } from '../data/termos';
import { colors, fontSize, fontWeight, type Area } from '../theme';

const ICONES: Record<IdTermo, React.ComponentProps<typeof Ionicons>['name']> = {
  uso: 'document-text-outline',
  privacidade: 'shield-checkmark-outline',
  contratante: 'people-outline',
  prestador: 'medkit-outline',
};

// Cartão com um item por termo; tocar abre o texto inteiro (`TermoScreen`). Usado no cadastro (antes
// da caixa de aceite) e, depois, no perfil do membro, nas configurações e no painel do cuidador.
export function ListaTermos({ ids, area }: { ids: IdTermo[]; area: Area }) {
  const navigation = useNavigation();

  return (
    <Cartao style={styles.cartao}>
      {ids.map((id, i) => {
        const termo = TERMOS[id];
        return (
          <LinhaLista
            key={id}
            ultima={i === ids.length - 1}
            onPress={() => navigation.navigate('Termo', { id, area })}
            rotulo={`Ler ${termo.nomeCurto}`}
          >
            <IconeCirculo icone={ICONES[id]} area={area} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.titulo}>{termo.nomeCurto}</Text>
              <Text style={styles.resumo}>{termo.resumo}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.gray400} />
          </LinhaLista>
        );
      })}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { paddingVertical: 4 },
  titulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  resumo: { fontSize: fontSize.sm, color: colors.gray600, lineHeight: 20 },
});
