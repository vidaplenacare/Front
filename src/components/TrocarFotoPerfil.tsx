import React, { useState } from 'react';
import { CapturaSelfie, escolherFotoDaGaleria, type FotoPreparada } from './CapturaSelfie';
import { useDialogo } from './Dialogo';
import { useAuth } from '../contexts/AuthContext';
import type { Area } from '../theme';

// Trocar a foto de perfil do MEMBRO (PerfilScreen): câmera ou galeria. O profissional NÃO usa
// isto — a foto dele vem da selfie da Verificação profissional (CuidadorVerificacaoScreen) e não é
// trocada no Perfil público (fluxo definido pelo usuário em 2026-09-30).
//
// - `abrirCamera()`: câmera frontal com moldura oval → prévia → envia.
// - `abrirGaleria()`: abre a galeria DA TELA (sem Modal aberto por cima — no Android a foto se
//   perdia quando a galeria abria de dentro do Modal) → prévia → envia.
// - `modal`: renderizar uma vez na tela.
export function useTrocarFotoPerfil({ area, mensagemSucesso }: { area: Area; mensagemSucesso: string }) {
  const { enviarFoto } = useAuth();
  const dialogo = useDialogo();
  const [visivel, setVisivel] = useState(false);
  const [fotoGaleria, setFotoGaleria] = useState<FotoPreparada | null>(null);

  const fechar = () => {
    setVisivel(false);
    setFotoGaleria(null);
  };

  const abrirCamera = () => {
    setFotoGaleria(null);
    setVisivel(true);
  };

  const abrirGaleria = async () => {
    try {
      const foto = await escolherFotoDaGaleria();
      if (!foto) return; // cancelou
      setFotoGaleria(foto);
      setVisivel(true);
    } catch {
      await dialogo.avisar({
        titulo: 'Não foi possível abrir a foto',
        mensagem: 'Tente escolher outra foto ou tire uma na hora pela câmera.',
        tom: 'perigo',
      });
    }
  };

  const modal = (
    <CapturaSelfie
      visivel={visivel}
      area={area}
      titulo="Sua foto de perfil"
      instrucao="Posicione o rosto dentro da moldura, num lugar bem iluminado."
      textoConfirmar="Usar esta foto"
      fotoInicial={fotoGaleria}
      onFechar={fechar}
      onConfirmar={async (imagemBase64) => {
        await enviarFoto(imagemBase64);
        fechar();
        await dialogo.avisar({ titulo: 'Foto salva', mensagem: mensagemSucesso, tom: 'sucesso' });
      }}
    />
  );

  return { abrirCamera, abrirGaleria, modal };
}
