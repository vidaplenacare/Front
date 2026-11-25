import * as Location from 'expo-location';
import { criarConexaoSocket } from './socket';

export type PararEnvioLocalizacao = () => void;

// Pede permissão de localização em primeiro plano, conecta ao canal em tempo real e passa a
// enviar a posição real do aparelho a cada atualização de GPS. Reaproveitado tanto pelo botão de
// teste em AcompanharCuidadorScreen quanto pelo início automático após o aviso de 30min em
// CuidadorPainelScreen. Localização em background não funciona no Expo Go (ver DEV-NOTES.md) —
// isso só captura enquanto o app está aberto em primeiro plano.
export async function iniciarEnvioLocalizacao(solicitacaoId: string): Promise<PararEnvioLocalizacao> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissão de localização negada');
  }

  const socket = criarConexaoSocket();
  socket.emit('entrar-sala', { solicitacaoId });

  const watch = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 5 },
    (localizacao) => {
      socket.emit('atualizar-localizacao', {
        solicitacaoId,
        latitude: localizacao.coords.latitude,
        longitude: localizacao.coords.longitude,
      });
    }
  );

  return () => {
    watch.remove();
    socket.disconnect();
  };
}
