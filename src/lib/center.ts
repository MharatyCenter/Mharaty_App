import { toWhatsAppNumber } from './validation';

/** رقم واتساب المركز (من VITE_CENTER_WHATSAPP) بالصيغة الدولية، أو '' إذا لم يُضبط */
export const CENTER_WHATSAPP = toWhatsAppNumber((import.meta.env.VITE_CENTER_WHATSAPP || '').trim());

export const centerWhatsAppLink = (text: string) =>
  CENTER_WHATSAPP ? `https://wa.me/${CENTER_WHATSAPP}?text=${encodeURIComponent(text)}` : '';
