import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function ColaboradorSeletorScreen({ navigation }: RootStackScreenProps<'ColaboradorSeletor'>) {
  return (
    <LinearGradient colors={[colors.blue, colors.primary]} style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.logo}>Vida Plena</Text>
          <Text style={styles.slogan}>Cuidado e bem-estar para você</Text>
          <Text style={styles.welcome}>Seja bem-vindo(a)! Escolha como deseja continuar.</Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, shadows.card]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Login')}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${colors.blue}15` }]}>
              <Ionicons name="person" size={28} color={colors.blue} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>Sou Membro</Text>
              <Text style={styles.cardSubtitle}>Acesse cuidados para você ou sua família</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, shadows.card]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('CuidadorLogin')}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="medkit" size={28} color={colors.primary} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>Sou Colaborador</Text>
              <Text style={styles.cardSubtitle}>Ofereça seus serviços profissionais</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardCriarConta, shadows.card]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('CriarContaSeletor')}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${colors.orange}15` }]}>
              <Ionicons name="person-add" size={28} color={colors.orange} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>Criar conta</Text>
              <Text style={styles.cardSubtitle}>Ainda não tem cadastro? Comece por aqui</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Cuidando de quem você ama</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  logoImage: { width: '100%', height: '100%' },
  logo: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.md,
  },
  slogan: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  welcome: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  cards: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardCriarConta: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    textAlign: 'center',
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xl,
    fontSize: fontSize.sm,
  },
});
