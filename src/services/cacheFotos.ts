// Fotos do nosso armazenamento já convertidas em data URI, por chave ("perfil/<uuid>.jpg").
// Fica num módulo próprio para o AuthContext (que acabou de enviar a foto) e o FotoPessoa (que
// exibe) compartilharem o mesmo cache sem um importar o outro. Chave nova a cada foto → nunca
// fica velho.
export const cacheFotos = new Map<string, string>();

export function guardarFotoNoCache(chave: string, jpegBase64: string): void {
  cacheFotos.set(chave, `data:image/jpeg;base64,${jpegBase64}`);
}
