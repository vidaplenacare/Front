import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, paletas, shadows, spacing, tons, type Area, type Tom } from '../theme';
import { COMPORTAMENTO_TECLADO } from '../hooks/useTeclado';

// Kit visual do app (aprovado em 2026-09-29 no quadro da área do cuidador). Membro e profissional
// usam os MESMOS componentes, só mudando a `area` (azul x verde). Medidas pensadas para público
// idoso: toque ≥ 48, texto ≥ 14, botões principais ≥ 54 de altura.

type NomeIcone = keyof typeof Ionicons.glyphMap;

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
  return (primeira + ultima).toUpperCase();
}

// ---------- Cabeçalho com gradiente e cantos arredondados ----------

interface CabecalhoHeroProps {
  area: Area;
  titulo?: string;
  subtitulo?: string;
  onVoltar?: () => void;
  /** Texto ao lado da seta ("Painel", "Pedidos"...). Padrão: "Voltar". */
  voltarRotulo?: string;
  /** Botão redondo à direita (ex.: sino de notificações). */
  direita?: { icone: NomeIcone; rotulo: string; onPress: () => void; badge?: number };
  /** Conteúdo à esquerda na linha de cima, quando não há "voltar" (ex.: marca do app). */
  esquerda?: React.ReactNode;
  /** Espaço extra embaixo para o primeiro cartão "subir" sobre o cabeçalho (use com `sobrepor`). */
  espacoInferior?: number;
  children?: React.ReactNode;
}

export function CabecalhoHero({
  area,
  titulo,
  subtitulo,
  onVoltar,
  voltarRotulo = 'Voltar',
  direita,
  esquerda,
  espacoInferior = 0,
  children,
}: CabecalhoHeroProps) {
  return (
    <LinearGradient
      colors={paletas[area].gradiente}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[estilos.hero, { paddingBottom: spacing.lg + espacoInferior }]}
    >
      <SafeAreaView edges={['top']}>
        {(onVoltar || direita || esquerda) && (
          <View style={estilos.heroTopo}>
            {onVoltar ? (
              <TouchableOpacity
                onPress={onVoltar}
                style={estilos.voltar}
                accessibilityRole="button"
                accessibilityLabel={`Voltar para ${voltarRotulo}`}
                hitSlop={8}
              >
                <Ionicons name="arrow-back" size={22} color={colors.white} />
                <Text style={estilos.voltarTexto}>{voltarRotulo}</Text>
              </TouchableOpacity>
            ) : (
              esquerda ?? <View />
            )}
            {direita && (
              <TouchableOpacity
                onPress={direita.onPress}
                style={estilos.heroBotaoRedondo}
                accessibilityRole="button"
                accessibilityLabel={
                  direita.badge ? `${direita.rotulo}, ${direita.badge} novas` : direita.rotulo
                }
              >
                <Ionicons name={direita.icone} size={24} color={colors.white} />
                {!!direita.badge && (
                  <View style={estilos.heroBadge}>
                    <Text style={estilos.heroBadgeTexto}>{direita.badge > 9 ? '9+' : direita.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        {!!titulo && (
          <Text style={estilos.heroTitulo} accessibilityRole="header">
            {titulo}
          </Text>
        )}
        {!!subtitulo && <Text style={estilos.heroSubtitulo}>{subtitulo}</Text>}
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

/** Estilo para o primeiro bloco depois do cabeçalho subir sobre ele. */
export function sobrepor(quanto: number): ViewStyle {
  return { marginTop: -quanto };
}

// ---------- Cartão ----------

interface CartaoProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  destaque?: boolean;
  rotulo?: string;
}

export function Cartao({ children, style, onPress, destaque, rotulo }: CartaoProps) {
  const conteudo = [estilos.cartao, destaque ? shadows.destaque : shadows.suave, style];
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={conteudo}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={conteudo}>{children}</View>;
}

// ---------- Títulos ----------

export function TituloSecao({ children, direita }: { children: string; direita?: React.ReactNode }) {
  return (
    <View style={estilos.tituloSecaoLinha}>
      <Text style={estilos.tituloSecao} accessibilityRole="header">
        {children}
      </Text>
      {direita}
    </View>
  );
}

// ---------- Etiqueta (pílula de status) ----------

export function Etiqueta({ texto, tom, icone }: { texto: string; tom: Tom; icone?: NomeIcone }) {
  const t = tons[tom];
  return (
    <View style={[estilos.etiqueta, { backgroundColor: t.fundo }]}>
      {icone && <Ionicons name={icone} size={14} color={t.forte} />}
      <Text style={[estilos.etiquetaTexto, { color: t.forte }]}>{texto}</Text>
    </View>
  );
}

// ---------- Ícone em círculo claro ----------

export function IconeCirculo({
  icone,
  area,
  tom,
  tamanho = 44,
}: {
  icone: NomeIcone;
  area?: Area;
  tom?: Tom;
  tamanho?: number;
}) {
  const fundo = tom ? tons[tom].fundo : paletas[area ?? 'membro'].suave;
  const cor = tom ? tons[tom].forte : paletas[area ?? 'membro'].principal;
  return (
    <View style={[estilos.iconeCirculo, { width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: fundo }]}>
      <Ionicons name={icone} size={Math.round(tamanho * 0.48)} color={cor} />
    </View>
  );
}

// ---------- Avatar com iniciais ----------

export function AvatarIniciais({
  nome,
  tamanho = 52,
  area,
  claro,
}: {
  nome: string;
  tamanho?: number;
  area: Area;
  /** true = fundo branco (sobre o cabeçalho colorido). */
  claro?: boolean;
}) {
  const p = paletas[area];
  return (
    <View
      style={[
        estilos.avatar,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: claro ? colors.white : p.suave,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[estilos.avatarTexto, { color: p.principal, fontSize: Math.round(tamanho * 0.38) }]}>
        {iniciais(nome)}
      </Text>
    </View>
  );
}

// ---------- Botões ----------

type VarianteBotao = 'primario' | 'contorno' | 'texto' | 'perigo' | 'textoPerigo';

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  area: Area;
  variante?: VarianteBotao;
  icone?: NomeIcone;
  /** Ícone antes do texto (padrão: depois). */
  iconeAntes?: boolean;
  /** Cor própria do ícone (ex.: estrela amarela em "Avaliar"). Padrão: a cor do texto. */
  corIcone?: string;
  desabilitado?: boolean;
  carregando?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Botao({
  titulo,
  onPress,
  area,
  variante = 'primario',
  icone,
  iconeAntes,
  corIcone,
  desabilitado,
  carregando,
  style,
}: BotaoProps) {
  const p = paletas[area];
  const inativo = desabilitado || carregando;
  const corTexto =
    variante === 'primario'
      ? colors.white
      : variante === 'perigo' || variante === 'textoPerigo'
        ? tons.vermelho.forte
        : p.principal;

  const miolo = carregando ? (
    <ActivityIndicator color={corTexto} />
  ) : (
    <>
      {icone && iconeAntes && <Ionicons name={icone} size={20} color={corIcone ?? corTexto} />}
      <Text style={[estilos.botaoTexto, { color: corTexto }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {titulo}
      </Text>
      {icone && !iconeAntes && <Ionicons name={icone} size={20} color={corIcone ?? corTexto} />}
    </>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      style={[inativo && estilos.botaoInativo, style]}
    >
      {variante === 'primario' ? (
        <LinearGradient colors={p.gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.botao}>
          {miolo}
        </LinearGradient>
      ) : (
        <View
          style={[
            estilos.botao,
            variante === 'contorno' && { borderWidth: 1.5, borderColor: p.principal },
            variante === 'perigo' && { borderWidth: 1.5, borderColor: tons.vermelho.borda },
            (variante === 'texto' || variante === 'textoPerigo') && estilos.botaoTextoSo,
          ]}
        >
          {miolo}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------- Linha de informação (ícone em círculo + textos) ----------

export function LinhaInfo({
  icone,
  area,
  titulo,
  subtitulo,
  children,
}: {
  icone: NomeIcone;
  area: Area;
  titulo?: string;
  subtitulo?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={estilos.linhaInfo}>
      <IconeCirculo icone={icone} area={area} tamanho={40} />
      <View style={{ flex: 1 }}>
        {!!titulo && <Text style={estilos.linhaInfoTitulo}>{titulo}</Text>}
        {!!subtitulo && <Text style={estilos.linhaInfoSub}>{subtitulo}</Text>}
        {children}
      </View>
    </View>
  );
}

// ---------- Aviso (banner colorido, opcionalmente clicável) ----------

export function Aviso({
  tom,
  icone,
  titulo,
  texto,
  onPress,
  children,
}: {
  tom: Tom;
  icone: NomeIcone;
  titulo?: string;
  texto?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const t = tons[tom];
  const conteudo = (
    <>
      <View style={[estilos.avisoIcone, { backgroundColor: '#ffffffaa' }]}>
        <Ionicons name={icone} size={22} color={t.forte} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        {!!titulo && <Text style={[estilos.avisoTitulo, { color: t.texto }]}>{titulo}</Text>}
        {!!texto && <Text style={[estilos.avisoTexto, { color: t.texto }]}>{texto}</Text>}
        {children}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={22} color={t.forte} />}
    </>
  );
  const estilo = [estilos.aviso, { backgroundColor: t.fundo, borderColor: t.borda }];
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={estilo} accessibilityRole="button">
        {conteudo}
      </TouchableOpacity>
    );
  }
  return <View style={estilo}>{conteudo}</View>;
}

// ---------- Linha de lista dentro de um cartão (com divisória) ----------

export function LinhaLista({
  children,
  ultima,
  onPress,
  rotulo,
}: {
  children: React.ReactNode;
  ultima?: boolean;
  onPress?: () => void;
  rotulo?: string;
}) {
  const estilo = [estilos.linhaLista, !ultima && estilos.linhaListaDivisoria];
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={estilo} accessibilityRole="button" accessibilityLabel={rotulo}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={estilo}>{children}</View>;
}

// ---------- Campo de texto com rótulo ----------

interface CampoProps extends Omit<TextInputProps, 'style'> {
  rotulo: string;
  area: Area;
  /** Texto de ajuda embaixo do rótulo. */
  ajuda?: string;
  erro?: string | null;
  multilinha?: boolean;
  /** Ícone dentro do campo, à esquerda. */
  icone?: NomeIcone;
  /** Elemento dentro do campo, à direita (ex.: botão de mostrar senha). */
  direita?: React.ReactNode;
}

export function Campo({ rotulo, area, ajuda, erro, multilinha, icone, direita, onFocus, onBlur, ...resto }: CampoProps) {
  const [focado, setFocado] = useState(false);
  const p = paletas[area];
  const corBorda = erro ? tons.vermelho.forte : focado ? p.principal : colors.gray300;
  return (
    <View style={estilos.campoBloco}>
      <Text style={estilos.campoRotulo}>{rotulo}</Text>
      {!!ajuda && <Text style={estilos.campoAjuda}>{ajuda}</Text>}
      <View style={[estilos.campoCaixa, multilinha && estilos.campoCaixaMulti, { borderColor: corBorda }]}>
        {icone && <Ionicons name={icone} size={20} color={focado ? p.principal : colors.gray500} />}
        <TextInput
          {...resto}
          multiline={multilinha}
          accessibilityLabel={rotulo}
          placeholderTextColor={colors.gray400}
          onFocus={(e) => {
            setFocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
          style={[estilos.campoInput, multilinha && estilos.campoInputMulti]}
        />
        {direita}
      </View>
      {!!erro && (
        <View style={estilos.campoErro} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={16} color={tons.vermelho.forte} />
          <Text style={estilos.campoErroTexto}>{erro}</Text>
        </View>
      )}
    </View>
  );
}

// ---------- Chips de escolha (um ou vários) ----------

export function Chips<T extends string>({
  opcoes,
  selecionados,
  onAlternar,
  area,
}: {
  opcoes: { id: T; rotulo: string }[];
  selecionados: T[];
  onAlternar: (id: T) => void;
  area: Area;
}) {
  const p = paletas[area];
  return (
    <View style={estilos.chips}>
      {opcoes.map((o) => {
        const ativo = selecionados.includes(o.id);
        return (
          <TouchableOpacity
            key={o.id}
            onPress={() => onAlternar(o.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ativo }}
            style={[estilos.chip, ativo && { backgroundColor: p.principal, borderColor: p.principal }]}
          >
            {ativo && <Ionicons name="checkmark" size={16} color={colors.white} />}
            <Text style={[estilos.chipTexto, ativo && { color: colors.white }]}>{o.rotulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------- Opção de escolha única (cartão com rádio) ----------

export function OpcaoEscolha({
  titulo,
  descricao,
  selecionada,
  onPress,
  area,
  icone,
}: {
  titulo: string;
  descricao?: string;
  selecionada: boolean;
  onPress: () => void;
  area: Area;
  icone?: NomeIcone;
}) {
  const p = paletas[area];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionada }}
      style={[estilos.opcao, selecionada && { borderColor: p.principal, backgroundColor: p.suave }]}
    >
      {icone && <IconeCirculo icone={icone} area={area} tamanho={44} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={estilos.opcaoTitulo}>{titulo}</Text>
        {!!descricao && <Text style={estilos.opcaoDescricao}>{descricao}</Text>}
      </View>
      <Ionicons
        name={selecionada ? 'radio-button-on' : 'radio-button-off'}
        size={26}
        color={selecionada ? p.principal : colors.gray400}
      />
    </TouchableOpacity>
  );
}

// ---------- Caixa de marcar (ex.: "Li e concordo") ----------

export function CaixaMarcar({
  texto,
  descricao,
  marcada,
  onAlternar,
  area,
}: {
  texto: string;
  descricao?: string;
  marcada: boolean;
  onAlternar: () => void;
  area: Area;
}) {
  const p = paletas[area];
  return (
    <TouchableOpacity
      onPress={onAlternar}
      activeOpacity={0.85}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      style={[estilos.opcao, marcada && { borderColor: p.principal, backgroundColor: p.suave }]}
    >
      <Ionicons name={marcada ? 'checkbox' : 'square-outline'} size={28} color={marcada ? p.principal : colors.gray500} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={estilos.opcaoTitulo}>{texto}</Text>
        {!!descricao && <Text style={estilos.opcaoDescricao}>{descricao}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ---------- Rodapé fixo (folha branca com o botão principal) ----------

export function RodapeFixo({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView edges={['bottom']} style={[estilos.rodape, shadows.destaque]}>
      <View style={estilos.rodapeMiolo}>{children}</View>
    </SafeAreaView>
  );
}

// ---------- Folha de baixo (formulário em janela) ----------

/**
 * Janela que sobe de baixo, para formulários curtos (editar dados, novo remédio...). Já trata o
 * teclado (behavior "padding" também no Android — ver hooks/useTeclado.ts) e rola o conteúdo.
 */
export function FolhaInferior({
  visivel,
  titulo,
  onFechar,
  children,
}: {
  visivel: boolean;
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visivel} transparent animationType="slide" statusBarTranslucent onRequestClose={onFechar}>
      <KeyboardAvoidingView style={estilos.folhaFundo} behavior={COMPORTAMENTO_TECLADO}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onFechar} accessibilityLabel="Fechar" />
        <SafeAreaView edges={['bottom']} style={[estilos.folha, shadows.modal]}>
          <View style={estilos.folhaTopo}>
            <Text style={estilos.folhaTitulo} accessibilityRole="header">
              {titulo}
            </Text>
            <TouchableOpacity onPress={onFechar} style={estilos.folhaFechar} accessibilityRole="button" accessibilityLabel="Fechar">
              <Ionicons name="close" size={26} color={colors.gray600} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={estilos.folhaConteudo} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------- Estado vazio ----------

export function Vazio({ icone, titulo, texto, area }: { icone: NomeIcone; titulo: string; texto?: string; area: Area }) {
  return (
    <View style={estilos.vazio}>
      <IconeCirculo icone={icone} area={area} tamanho={64} />
      <Text style={estilos.vazioTitulo}>{titulo}</Text>
      {!!texto && <Text style={estilos.vazioTexto}>{texto}</Text>}
    </View>
  );
}

export const estilosUi = StyleSheet.create({
  /** Fundo padrão das telas. */
  tela: { flex: 1, backgroundColor: colors.background },
  /** Miolo rolável: margens laterais de 20 e espaçamento entre blocos. */
  miolo: { paddingHorizontal: 20, paddingBottom: spacing.xl, gap: 18 },
  textoCorpo: { fontSize: fontSize.md, color: colors.gray700, lineHeight: 23 },
  textoApoio: { fontSize: fontSize.sm, color: colors.gray600, lineHeight: 20 },
  rotuloCampo: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.gray600 },
  caixaCinza: { backgroundColor: colors.gray50, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, gap: 8 },
});

const estilos = StyleSheet.create({
  hero: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
  heroTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingRight: spacing.sm },
  voltarTexto: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  heroBotaoRedondo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeTexto: { color: colors.white, fontSize: 11, fontWeight: fontWeight.extrabold },
  heroTitulo: { color: colors.white, fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold, marginTop: spacing.sm },
  heroSubtitulo: { color: 'rgba(255,255,255,0.88)', fontSize: fontSize.md, marginTop: spacing.xs, lineHeight: 22 },

  cartao: { backgroundColor: colors.white, borderRadius: 24, padding: 18, gap: 14 },

  tituloSecaoLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -6 },
  tituloSecao: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.text },

  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  etiquetaTexto: { fontSize: 13, fontWeight: fontWeight.extrabold },

  iconeCirculo: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  avatar: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTexto: { fontWeight: fontWeight.extrabold },

  botao: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
  },
  botaoTextoSo: { minHeight: 48 },
  botaoTexto: { fontSize: 17, fontWeight: fontWeight.bold },
  botaoInativo: { opacity: 0.45 },

  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linhaInfoTitulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  linhaInfoSub: { fontSize: fontSize.md, color: colors.gray700, lineHeight: 22 },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: spacing.md,
  },
  avisoIcone: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avisoTitulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  avisoTexto: { fontSize: fontSize.sm, lineHeight: 20 },

  linhaLista: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  linhaListaDivisoria: { borderBottomWidth: 1, borderBottomColor: '#eef2f6' },

  campoBloco: { gap: 6 },
  campoRotulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  campoAjuda: { fontSize: fontSize.sm, color: colors.gray600, lineHeight: 20 },
  campoCaixa: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  campoCaixaMulti: { alignItems: 'flex-start', paddingVertical: 12 },
  campoInput: { flex: 1, fontSize: 17, color: colors.text, paddingVertical: 12 },
  campoInputMulti: { minHeight: 96, textAlignVertical: 'top', paddingVertical: 0 },
  campoErro: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  campoErroTexto: { flex: 1, fontSize: fontSize.sm, color: tons.vermelho.texto },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipTexto: { fontSize: 15, fontWeight: fontWeight.bold, color: colors.gray700 },

  opcao: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 14,
  },
  opcaoTitulo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  opcaoDescricao: { fontSize: fontSize.sm, color: colors.gray600, lineHeight: 20 },

  rodape: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  rodapeMiolo: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, gap: 8 },

  folhaFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  folha: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
  folhaTopo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 },
  folhaTitulo: { flex: 1, fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.text },
  folhaFechar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  folhaConteudo: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 16 },

  vazio: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  vazioTitulo: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center', marginTop: spacing.xs },
  vazioTexto: { fontSize: fontSize.md, color: colors.gray600, textAlign: 'center', lineHeight: 22 },
});
