import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registrarPushToken } from './api';

type ModuloNotificacoes = typeof import('expo-notifications');

// ⚠️ `expo-notifications` NÃO pode ser importado no topo deste arquivo. A partir da SDK 57 o módulo
// registra um listener de push token no próprio import (`DevicePushTokenAutoRegistration.fx`), e
// essa chamada **lança exceção** no Expo Go Android desde que a Expo removeu push remoto do Expo Go
// (SDK 53). Como `App.tsx` e `AppContext.tsx` carregam este arquivo na inicialização, o import
// estático derrubava o app inteiro com "[runtime not ready]" antes da primeira tela aparecer.
// Por isso: carregamento preguiçoso (só na primeira chamada) e pulado nesse caso específico.
// Em iOS/Expo Go o módulo só emite aviso, e num development build tudo funciona normalmente —
// nesses casos o comportamento continua igual ao de antes.
const indisponivelNoExpoGo = isRunningInExpoGo() && Platform.OS === 'android';

let modulo: ModuloNotificacoes | null = null;

async function carregarNotificacoes(): Promise<ModuloNotificacoes | null> {
  if (indisponivelNoExpoGo) return null;
  if (!modulo) {
    const carregado = await import('expo-notifications');
    // Mostra a notificação mesmo com o app aberto em primeiro plano — por padrão o Expo esconde
    // notificações nesse caso, mas é justamente quando o membro está com o app aberto (olhando o
    // mapa, por exemplo) que essas notificações locais disparam.
    carregado.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    modulo = carregado;
  }
  return modulo;
}

export async function configurarNotificacoes(): Promise<void> {
  const Notifications = await carregarNotificacoes();
  if (!Notifications) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('padrao', {
      name: 'Vida Plena',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permissaoAtual = await Notifications.getPermissionsAsync();
  if (permissaoAtual.status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }

  // Best-effort: groundwork para quando um development build existir (ver
  // INTEGRACOES-EXTERNAS.md #1) — em Expo Go não chega aqui.
  try {
    if (Device.isDevice) {
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      await registrarPushToken(token);
    }
  } catch {
    // Silencioso de propósito — notificação local (o que importa agora) não depende disso.
  }
}

export async function notificarLocal(titulo: string, corpo: string): Promise<void> {
  const Notifications = await carregarNotificacoes();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo },
    trigger: null,
  });
}
