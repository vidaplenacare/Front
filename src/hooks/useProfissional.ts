import { useCallback, useEffect, useState } from 'react';
import type { Profissional } from '../data/profissionais';
import { buscarProfissional } from '../services/api';

// Um profissional do catálogo, SEMPRE vindo do servidor (foto, valor/hora, horários atuais).
//
// ⚠️ Antes (até 2026-09-30) Perfil do cuidador, Solicitar contratação e Acompanhar cuidador liam
// uma lista FIXA dentro do app (`data/profissionais.ts`): a lista "Cuidadores Credenciados" mostrava
// a foto nova (servidor) e, ao tocar, o perfil mostrava a foto antiga de banco de imagens — e um
// profissional cadastrado de verdade pelo app nem existia nessa lista. A lista fixa foi apagada.
export function useProfissional(id: string | undefined) {
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [carregando, setCarregando] = useState(!!id);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!id) {
      setProfissional(null);
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    setErro(null);
    buscarProfissional(id)
      .then((dados) => ativo && setProfissional(dados))
      .catch((e) => ativo && setErro(e instanceof Error ? e.message : 'Falha ao buscar o profissional'))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [id, tentativa]);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);

  return { profissional, carregando, erro, recarregar };
}
