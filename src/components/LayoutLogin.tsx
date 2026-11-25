import React, { useEffect, useRef } from 'react';
import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COMPORTAMENTO_TECLADO, useTecladoAberto } from '../hooks/useTeclado';
import { colors, fontSize, fontWeight, paletas, spacing, type Area } from '../theme';

// Moldura ÚNICA das telas de login (membro azul, profissional verde) — as duas eram cópias e
// divergiam. Resolve o teclado cobrindo os campos (usuário, 2026-09-30):
// 1. `behavior="padding"` também no Android (edge-to-edge, ver hooks/useTeclado.ts);
// 2. com o teclado aberto, o topo grande (logo) se recolhe e sobra espaço para os campos;
// 3. a tela rola até o fim quando o teclado abre, deixando o campo e o botão "Entrar" à vista.
export function LayoutLogin({
  area,
  slogan,
  selo,
  titulo,
  subtitulo,
  onVoltar,
  children,
}: {
  area: Area;
  slogan: string;
  selo: { icone: keyof typeof Ionicons.glyphMap; texto: string };
  titulo: string;
  subtitulo: string;
  onVoltar: () => void;
  children: React.ReactNode;
}) {
  const tecladoAberto = useTecladoAberto();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!tecladoAberto) return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [tecladoAberto]);

  return (
    <LinearGradient colors={paletas[area].gradiente} style={styles.flex}>
      <View style={styles.circuloUm} pointerEvents="none" />
      <View style={styles.circuloDois} pointerEvents="none" />

      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={COMPORTAMENTO_TECLADO}>
          <TouchableOpacity
            style={styles.voltar}
            onPress={onVoltar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={26} color={colors.white} />
          </TouchableOpacity>

          {tecladoAberto ? (
            <View style={styles.topoCompacto}>
              <Image source={require('../../assets/logo-simbolo-branco.png')} style={styles.simbolo} resizeMode="contain" />
              <Text style={styles.nomeCompacto}>Vida Plena</Text>
            </View>
          ) : (
            <View style={styles.topo}>
              <View style={styles.logoCaixa}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.nome}>Vida Plena</Text>
              <Text style={styles.slogan}>{slogan}</Text>
              <View style={styles.selo}>
                <Ionicons name={selo.icone} size={16} color={colors.white} />
                <Text style={styles.seloTexto}>{selo.texto}</Text>
              </View>
            </View>
          )}

          <View style={styles.cartao}>
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.cartaoConteudo}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.titulo} accessibilityRole="header">
                {titulo}
              </Text>
              <Text style={styles.subtitulo}>{subtitulo}</Text>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  voltar: { position: 'absolute', top: spacing.md, left: spacing.lg, zIndex: 1, minWidth: 48, minHeight: 48, justifyContent: 'center' },
  circuloUm: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)' },
  circuloDois: { position: 'absolute', top: 120, left: -70, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
  topo: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  topoCompacto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: spacing.md, minHeight: 64 },
  simbolo: { width: 32, height: 32 },
  nomeCompacto: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.white },
  logoCaixa: { width: 96, height: 96, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: spacing.sm },
  logo: { width: '100%', height: '100%' },
  nome: { fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold, color: colors.white, marginTop: spacing.sm },
  slogan: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  seloTexto: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  cartao: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 36, borderTopRightRadius: 36 },
  cartaoConteudo: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: 4 },
  titulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text },
  subtitulo: { fontSize: fontSize.md, color: colors.gray600, marginTop: spacing.xs },
});
