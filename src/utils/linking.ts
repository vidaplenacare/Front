import { Linking } from 'react-native';

export function ligarPara(telefone: string): void {
  const digits = telefone.replace(/\D/g, '');
  Linking.openURL(`tel:${digits}`);
}

export function abrirWhatsApp(telefone: string, mensagem?: string): void {
  const digits = telefone.replace(/\D/g, '');
  const numero = digits.startsWith('55') ? digits : `55${digits}`;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';
  Linking.openURL(`https://wa.me/${numero}${texto}`);
}
