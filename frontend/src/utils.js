import { B, t } from './i18n';

// Number & Currency formatting (en-IN max 2 decimal places)
export const n = (x) => Number(x || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const cur = (x) => '₹' + Number(x || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const round_half_up = (val, decimals = 2) => Math.round((Number(val) || 0) * Math.pow(10, decimals)) / Math.pow(10, decimals);

// Date & Time formatting
export const dateOnly = (d) => {
  if (!d) return '-';
  try {
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime()) ? String(d) : dateObj.toLocaleDateString('en-IN', { dateStyle: 'short' });
  } catch {
    return String(d);
  }
};

export const dt = (d) => {
  if (!d) return '-';
  try {
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime()) ? String(d) : dateObj.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(d);
  }
};

export const now = () => {
  const d = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export const today = () => {
  const d = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const monthStart = () => {
  const d = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};

// Generates WhatsApp share text for Weighbridge Computerized Slip
export const generateWhatsAppSlip = (load, lang = 'en') => {
  const partyName = typeof load.party === 'object' ? (load.party?.name || '-') : (load.party || '-');
  return `*${lang === 'gu' ? B.nameGu : B.name}*
${lang === 'gu' ? B.taglineGu : B.tagline}
📍 ${B.addr}
📞 Mo: ${B.tel}
--------------------------------
🧾 *${t('slip', lang)}*
📅 ${t('date', lang)}: ${dt(load.date)}
🚛 ${t('veh', lang)}: *${load.vehicleNo || '-'}*
👥 ${t('party', lang)}: *${partyName}*
📦 ${t('sand', lang)}: ${load.sandType || 'Sand'}
🎫 ${t('pass', lang)}: ${load.royaltyPassNo || '-'}
--------------------------------
⚖️ ${t('full', lang)}: *${n(load.loadedKg)} kg*
⚖️ ${t('empty', lang)}: *${n(load.emptyKg)} kg*
⚖️ *${t('net', lang)}: ${n(load.netTon)} Ton*
💰 ${t('rate', lang)}: ₹${n(load.rate)}/Ton
💵 *${t('amt', lang)}: ₹${n(load.amount)}*
${load.cash ? `💵 ${t('cashnow', lang)}: ₹${n(load.cash)}\n` : ''}--------------------------------
${lang === 'gu' ? 'કમ્પ્યુટરાઈઝ્ડ વજન કાંટો પહોંચ' : 'Computerized Weighbridge Slip'}`;
};
