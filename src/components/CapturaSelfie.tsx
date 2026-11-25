import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, IconeCirculo } from './ui';
import { colors, fontSize, fontWeight, paletas, tons, type Area } from '../theme';

// Foto do rosto: câmera frontal com moldura oval, e prévia "Ficou bom?" antes de usar.
//
// Onde é usado (fluxo definido pelo usuário em 2026-09-30, ver o Cérebro / DEV-NOTES):
// - Verificação profissional: selfie SÓ pela câmera → vira a foto de perfil do profissional.
// - "Deslize para iniciar": selfie SÓ pela câmera → verificação do rosto antes de liberar.
// - Meu Perfil (membro): câmera OU galeria. A galeria é aberta pela TELA com
//   `escolherFotoDaGaleria()` e este componente abre já na prévia (`fotoInicial`).
// ⚠️ A galeria NÃO pode ser aberta de dentro deste <Modal>: no Android a foto escolhida não volta
// para o app (nenhuma foto da galeria chegou ao servidor, nem escondendo o Modal antes).

// Tamanho enviado ao servidor: suficiente para reconhecer o rosto, leve para rede móvel.
const LARGURA_FINAL = 720;
const QUALIDADE_JPEG = 0.7;

export interface FotoPreparada {
  uri: string;
  base64: string;
}

// Câmera e galeria passam pelo mesmo tratamento: reduz para 720 px e converte para JPEG (o
// servidor só aceita JPEG — foto da galeria pode vir em PNG/HEIC).
async function prepararImagem(uri: string): Promise<FotoPreparada> {
  const imagem = await ImageManipulator.manipulate(uri).resize({ width: LARGURA_FINAL }).renderAsync();
  const reduzida = await imagem.saveAsync({ compress: QUALIDADE_JPEG, format: SaveFormat.JPEG, base64: true });
  if (!reduzida.base64) throw new Error('sem base64');
  return { uri: reduzida.uri, base64: reduzida.base64 };
}

/**
 * Abre a galeria do celular (chamar da TELA, nunca com um Modal aberto) e devolve a foto já
 * reduzida, ou `null` se a pessoa cancelar. Lança erro se a foto não puder ser lida.
 */
export async function escolherFotoDaGaleria(): Promise<FotoPreparada | null> {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });
  if (resultado.canceled || !resultado.assets?.[0]) return null;
  return prepararImagem(resultado.assets[0].uri);
}

interface CapturaSelfieProps {
  visivel: boolean;
  area: Area;
  titulo: string;
  instrucao: string;
  /** Texto do botão depois de tirar a foto (ex.: "Usar esta foto", "Iniciar atendimento"). */
  textoConfirmar: string;
  /** Recebe o JPEG em base64. Se lançar erro, a mensagem aparece e a pessoa pode tentar de novo. */
  onConfirmar: (imagemBase64: string) => Promise<void>;
  onFechar: () => void;
  /** Abre direto na prévia com esta foto (a que a pessoa escolheu na galeria). */
  fotoInicial?: FotoPreparada | null;
}

export function CapturaSelfie({
  visivel,
  area,
  titulo,
  instrucao,
  textoConfirmar,
  onConfirmar,
  onFechar,
  fotoInicial,
}: CapturaSelfieProps) {
  const [permissao, pedirPermissao] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [foto, setFoto] = useState<FotoPreparada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const p = paletas[area];

  // Cada abertura começa do zero — ou já na prévia, se veio com a foto da galeria.
  useEffect(() => {
    if (visivel) {
      setFoto(fotoInicial ?? null);
      setErro(null);
      setCameraPronta(false);
    }
  }, [visivel, fotoInicial]);

  const tirarFoto = async () => {
    if (!cameraRef.current || capturando) return;
    setCapturando(true);
    setErro(null);
    try {
      const original = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setFoto(await prepararImagem(original.uri));
    } catch {
      setErro('Não foi possível tirar a foto. Tente de novo.');
    } finally {
      setCapturando(false);
    }
  };

  const confirmar = async () => {
    if (!foto) return;
    setEnviando(true);
    setErro(null);
    try {
      await onConfirmar(foto.base64);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar a foto. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  const veioDaGaleria = !!fotoInicial;

  const conteudo = () => {
    // A prévia vem ANTES de checar a permissão da câmera: quem escolheu da galeria não precisa da
    // câmera (antes aparecia "Precisamos usar a câmera" depois de escolher — usuário, 2026-09-30).
    if (foto) {
      return (
        <View style={styles.previa}>
          <Text style={styles.titulo}>Ficou bom?</Text>
          <Text style={styles.instrucao}>
            O seu rosto precisa aparecer inteiro e com nitidez, de frente, sem óculos escuros nem boné.
          </Text>
          <Image source={{ uri: foto.uri }} style={styles.previaImagem} accessibilityLabel="Foto escolhida" />
          {!!erro && (
            <View style={styles.erro} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={18} color={tons.vermelho.forte} />
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          )}
          <View style={styles.acoes}>
            <Botao area={area} titulo={textoConfirmar} icone="checkmark" iconeAntes carregando={enviando} onPress={confirmar} />
            {veioDaGaleria ? (
              // A galeria não pode ser reaberta daqui de dentro (ver topo do arquivo): fecha e a
              // pessoa toca em "Da galeria" de novo.
              <Botao area={area} variante="contorno" titulo="Escolher outra foto" icone="images-outline" iconeAntes desabilitado={enviando} onPress={onFechar} style={styles.contornoClaro} />
            ) : (
              <Botao area={area} variante="contorno" titulo="Tirar outra foto" icone="refresh" iconeAntes desabilitado={enviando} onPress={() => setFoto(null)} style={styles.contornoClaro} />
            )}
          </View>
        </View>
      );
    }

    if (!permissao) {
      return (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.white} size="large" />
        </View>
      );
    }

    if (!permissao.granted) {
      return (
        <View style={styles.permissao}>
          <IconeCirculo icone="camera-outline" area={area} tamanho={72} />
          <Text style={styles.permissaoTitulo}>Precisamos usar a câmera</Text>
          <Text style={styles.permissaoTexto}>
            A foto é tirada na hora, com a câmera da frente, para confirmar que é você mesmo.
          </Text>
          {permissao.canAskAgain ? (
            <Botao area={area} titulo="Permitir a câmera" icone="camera-outline" iconeAntes onPress={pedirPermissao} style={styles.largura} />
          ) : (
            <>
              <Text style={styles.permissaoTexto}>
                A câmera foi bloqueada para o Vida Plena. Libere nas configurações do celular.
              </Text>
              <Botao area={area} titulo="Abrir configurações" icone="settings-outline" iconeAntes onPress={() => Linking.openSettings()} style={styles.largura} />
            </>
          )}
          <Botao area={area} variante="texto" titulo="Agora não" onPress={onFechar} style={styles.largura} />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" onCameraReady={() => setCameraPronta(true)} />
        <View style={styles.sobreposicao} pointerEvents="box-none">
          <View style={styles.topo}>
            <Text style={styles.titulo}>{titulo}</Text>
            <Text style={styles.instrucao}>{instrucao}</Text>
          </View>
          <View style={[styles.oval, { borderColor: p.claro }]} accessibilityElementsHidden />
          <View style={styles.rodape}>
            {!!erro && <Text style={[styles.erroTexto, styles.erroSobreCamera]}>{erro}</Text>}
            <TouchableOpacity
              onPress={tirarFoto}
              disabled={!cameraPronta || capturando}
              style={[styles.disparo, (!cameraPronta || capturando) && { opacity: 0.5 }]}
              accessibilityRole="button"
              accessibilityLabel="Tirar foto"
            >
              {capturando ? <ActivityIndicator color={p.principal} /> : <View style={[styles.disparoMiolo, { backgroundColor: p.principal }]} />}
            </TouchableOpacity>
            <Text style={styles.dica}>Toque no círculo para tirar a foto</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <SafeAreaView style={styles.tela} edges={['top', 'bottom']}>
        <View style={styles.barra}>
          <TouchableOpacity onPress={onFechar} style={styles.fechar} accessibilityRole="button" accessibilityLabel="Fechar a câmera" hitSlop={8} disabled={enviando}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>
        {conteudo()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#0b1220' },
  barra: { position: 'absolute', top: 0, right: 0, left: 0, zIndex: 2, alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 40 },
  fechar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permissao: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, backgroundColor: colors.white },
  permissaoTitulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text, textAlign: 'center' },
  permissaoTexto: { fontSize: fontSize.md, color: colors.gray600, textAlign: 'center', lineHeight: 23 },
  largura: { alignSelf: 'stretch' },
  sobreposicao: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  topo: { alignSelf: 'stretch', backgroundColor: 'rgba(11,18,32,0.72)', paddingTop: 96, paddingBottom: 18, paddingHorizontal: 24, gap: 6 },
  titulo: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.white, textAlign: 'center' },
  instrucao: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 },
  oval: { width: '68%', aspectRatio: 0.78, borderRadius: 999, borderWidth: 4, borderStyle: 'dashed' },
  rodape: { alignSelf: 'stretch', alignItems: 'center', gap: 10, paddingTop: 18, paddingBottom: 28, backgroundColor: 'rgba(11,18,32,0.72)' },
  disparo: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  disparoMiolo: { width: 66, height: 66, borderRadius: 33 },
  dica: { fontSize: fontSize.md, color: colors.white, fontWeight: fontWeight.semibold },
  previa: { flex: 1, paddingTop: 96, paddingHorizontal: 24, paddingBottom: 24, gap: 10, alignItems: 'center' },
  previaImagem: { width: '72%', aspectRatio: 0.78, borderRadius: 999, marginVertical: 12, backgroundColor: '#1e293b' },
  acoes: { alignSelf: 'stretch', gap: 12, marginTop: 'auto' },
  contornoClaro: { backgroundColor: colors.white, borderRadius: 16 },
  erro: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tons.vermelho.fundo, borderRadius: 14, padding: 12, alignSelf: 'stretch' },
  erroTexto: { flex: 1, fontSize: fontSize.md, color: tons.vermelho.texto },
  erroSobreCamera: { flex: 0, color: colors.white, textAlign: 'center', paddingHorizontal: 24 },
});
