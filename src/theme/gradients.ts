import { colors } from './colors';

export const gradients = {
  loginMembro: [colors.blue, colors.blueLight] as const,
  loginColaborador: [colors.primaryDark, colors.primary] as const,
  homeHeader: [colors.blue, colors.blueLight] as const,

  cuidadores: [colors.blue, colors.navy] as const,
  produtos: [colors.blueLight, colors.blue] as const,
  farmacia: [colors.orange, colors.orangeLight] as const,
  sinaisVitais: [colors.primary, colors.primaryLight] as const,
  monitoramento: [colors.navy, colors.blue] as const,
  dicas: [colors.yellow, colors.orange] as const,
  perfil: [colors.gray700, colors.gray800] as const,

  sucesso: [colors.success, colors.primaryLight] as const,
  perigo: [colors.danger, colors.orange] as const,
} as const;
