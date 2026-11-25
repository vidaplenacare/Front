import React, { useEffect, useState } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { AvatarIniciais } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { fonteDaFoto } from '../services/api';
import { cacheFotos } from '../services/cacheFotos';
import { colors, type Area } from '../theme';

// Foto redonda de uma pessoa (membro ou cuidador). Sem foto — ou se ela não carregar — mostra as
// iniciais, como no desenho aprovado.
//
// De onde vem a imagem, em ordem:
// 1. a foto que ACABOU de ser enviada deste aparelho (cache em memória, `services/cacheFotos.ts`) —
//    aparece na hora, sem depender da rede;
// 2. a URL do back-end com o token em `?token=` (ver `fonteDaFoto`).
// ⚠️ Já tentado e descartado em 2026-09-30: `source.headers` (o Android não mandou o token) e
// `fetch().blob()` (gera aviso de desempenho do React Native).
export function FotoPessoa({
  foto,
  nome,
  area,
  tamanho = 52,
  claro,
  style,
}: {
  foto: string | null | undefined;
  nome: string;
  area: Area;
  tamanho?: number;
  /** Iniciais com fundo branco (sobre o cabeçalho colorido); com foto, vira uma borda branca. */
  claro?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { token } = useAuth();
  const [falhou, setFalhou] = useState(false);
  // Foto nova (acabou de trocar) → tenta carregar de novo, mesmo que a anterior tenha falhado.
  useEffect(() => setFalhou(false), [foto]);

  const doAparelho = foto ? cacheFotos.get(foto) : undefined;
  const fonte = doAparelho ? { uri: doAparelho } : fonteDaFoto(foto, token);

  if (!fonte || falhou) {
    return (
      <View style={style}>
        <AvatarIniciais nome={nome} area={area} tamanho={tamanho} claro={claro} />
      </View>
    );
  }

  return (
    <Image
      source={fonte}
      onError={() => setFalhou(true)}
      accessibilityLabel={`Foto de ${nome}`}
      style={[
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: colors.gray200,
          ...(claro ? { borderWidth: 3, borderColor: colors.white } : {}),
        },
        style as object,
      ]}
    />
  );
}
