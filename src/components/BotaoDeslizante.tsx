import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontWeight, paletas, type Area } from '../theme';

const ALTURA = 68;
const MARGEM = 5;
const BOLINHA = ALTURA - MARGEM * 2;
// Quanto do caminho precisa ser arrastado para valer (evita disparo por toque acidental).
const LIMIAR = 0.85;

interface Props {
  texto: string;
  area: Area;
  onConfirmar: () => void | Promise<void>;
  carregando?: boolean;
  desabilitado?: boolean;
}

// "Deslize para iniciar/concluir": ação importante que não pode acontecer por um toque sem querer.
// Leitores de tela (TalkBack/VoiceOver) não arrastam — para eles é um botão comum (toque duplo).
export function BotaoDeslizante({ texto, area, onConfirmar, carregando, desabilitado }: Props) {
  const p = paletas[area];
  const [largura, setLargura] = useState(0);
  const posicao = useRef(new Animated.Value(0)).current;
  const maximo = Math.max(largura - BOLINHA - MARGEM * 2, 1);
  const maximoRef = useRef(maximo);
  maximoRef.current = maximo;
  const bloqueadoRef = useRef(false);
  bloqueadoRef.current = !!(carregando || desabilitado);
  const confirmarRef = useRef(onConfirmar);
  confirmarRef.current = onConfirmar;

  const voltarAoInicio = () =>
    Animated.spring(posicao, { toValue: 0, useNativeDriver: false, bounciness: 6 }).start();

  const disparar = async () => {
    try {
      await confirmarRef.current();
    } finally {
      voltarAoInicio();
    }
  };

  const arrasto = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !bloqueadoRef.current,
      onMoveShouldSetPanResponder: (_, g) => !bloqueadoRef.current && Math.abs(g.dx) > 4,
      // Não deixa a rolagem da tela "roubar" o gesto no meio do arrasto.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => posicao.setValue(Math.min(Math.max(g.dx, 0), maximoRef.current)),
      onPanResponderRelease: (_, g) => {
        if (g.dx >= maximoRef.current * LIMIAR) {
          Animated.timing(posicao, { toValue: maximoRef.current, duration: 120, useNativeDriver: false }).start(
            () => void disparar()
          );
        } else {
          voltarAoInicio();
        }
      },
      onPanResponderTerminate: voltarAoInicio,
    })
  ).current;

  const opacidadeTexto = posicao.interpolate({ inputRange: [0, maximo * 0.6], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}
      style={[styles.trilho, { backgroundColor: p.suave, borderColor: p.borda }, desabilitado && styles.desabilitado]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint="Toque duas vezes para confirmar"
      accessibilityState={{ disabled: !!desabilitado, busy: !!carregando }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'activate' && !bloqueadoRef.current) void disparar();
      }}
    >
      <Animated.Text style={[styles.texto, { color: p.texto, opacity: opacidadeTexto }]}>
        {carregando ? 'Aguarde…' : texto}
      </Animated.Text>
      <Animated.View style={[styles.bolinhaWrap, { transform: [{ translateX: posicao }] }]} {...arrasto.panHandlers}>
        <LinearGradient colors={[p.escuro, p.claro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bolinha}>
          {carregando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Ionicons name="arrow-forward" size={26} color={colors.white} />
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  trilho: {
    height: ALTURA,
    borderRadius: ALTURA / 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desabilitado: { opacity: 0.5 },
  texto: { fontSize: 17, fontWeight: fontWeight.extrabold, paddingLeft: BOLINHA },
  bolinhaWrap: { position: 'absolute', left: MARGEM - 1.5, top: MARGEM - 1.5 },
  bolinha: {
    width: BOLINHA,
    height: BOLINHA,
    borderRadius: BOLINHA / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0f3d26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
