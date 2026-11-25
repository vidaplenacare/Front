import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function CriarContaSeletorScreen({ navigation }: RootStackScreenProps<'CriarContaSeletor'>) {
  return (
    <LinearGradient colors={[colors.blue, colors.primary]} style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('ColaboradorSeletor')} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.logo}>Criar conta</Text>
            <Text style={styles.slogan}>Como você quer participar do Vida Plena?</Text>
          </View>

          <View style={styles.cards}>
            <TouchableOpacity
              style={[styles.card, shadows.card]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('CadastroMembro')}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.blue}15` }]}>
                <Ionicons name="person" size={28} color={colors.blue} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>Quero ser Membro</Text>
                <Text style={styles.cardSubtitle}>Cuidados para você ou sua família</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, shadows.card]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('CuidadorCadastro')}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="medkit" size={28} color={colors.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>Quero ser Colaborador</Text>
                <Text style={styles.cardSubtitle}>Oferecer meus serviços profissionais</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('ColaboradorSeletor')}>
            <Text style={styles.loginLinkText}>
              Já tem uma conta? <Text style={styles.loginLinkTextBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
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
    marginBottom: spacing.md,
  },
  logoImage: { width: '100%', height: '100%' },
  logo: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  slogan: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
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
  loginLink: { alignItems: 'center', marginTop: spacing.xl },
  loginLinkText: { color: colors.white, opacity: 0.9, fontSize: fontSize.sm },
  loginLinkTextBold: { fontWeight: fontWeight.bold, opacity: 1 },
});
