import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSETS,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import { INITIAL_CLUBS, getCategoryByPoints } from '../data/playersAndClubsData';
import {
  buildWhatsappLink,
  isCloudReady,
  uploadCompressedMedia,
  upsertCloudClub,
  upsertCloudCoach,
} from '../utils/cloudService';

/* ==========================================================================
   CATÁLOGOS UNIVERSALES (MISMO CONTRATO EXACTO QUE SedesView.jsx)
   ========================================================================== */
const COACH_THEMES = [
  { id: 'emerald', label: 'Esmeralda', hex: '#00DC7D' },
  { id: 'gold', label: 'Champán', hex: '#E5C16C' },
  { id: 'clay', label: 'Arcilla', hex: '#DE8566' },
  { id: 'royal', label: 'Estadio', hex: '#60A5FA' },
];

const QUICK_SLOTS = [
  'Hoy · 05:00 p. m.',
  'Hoy · 06:00 p. m.',
  'Hoy · 07:00 p. m.',
  'Mañana · 08:00 a. m.',
  'Sábado · 09:00 a. m.',
  '',
];

const CLUB_QUICK_HOURS = [
  'Hoy · 04:00 p. m. y 06:00 p. m.',
  'Hoy · 07:00 p. m. (LED)',
  'Hoy · 08:00 p. m. (LED)',
  'Mañana · 07:00 a. m. – 11:00 a. m.',
  'Canchas libres todo el día',
  '',
];

const CLASS_LEVEL_OPTIONS = [
  { id: 'todos', label: 'Todos los niveles' },
  { id: 'cero', label: 'Desde Cero / 5ª P' },
  { id: 'intermedio', label: 'Intermedio (5ª B–A)' },
  { id: 'avanzado', label: 'Avanzado (4ª–2ª)' },
];

const CLASS_AGE_OPTIONS = [
  { id: 'todas', label: 'Todas las edades' },
  { id: 'ninos', label: 'Niños (6–12)' },
  { id: 'juveniles', label: 'Juveniles (13–17)' },
  { id: 'adultos', label: 'Adultos (+18)' },
  { id: 'senior', label: 'Senior (+40)' },
];

const CLASS_MODALITY_OPTIONS = [
  'PRIVADA 1 A 1',
  'DÚO (2 ALUMNOS)',
  'GRUPAL',
  'CLÍNICA / OFERTA',
  'SPARRING TÁCTICO',
];

const SPECIALTIES = [
  'Técnica & Biomecánica',
  'Saque y Efecto',
  'Topspin en Arcilla',
  'Táctica Competitiva',
  'Desde Cero (5ª P / 5ª B)',
  'Niños & Semillero',
  'Damas Competitivo',
  'Senior +40',
  'Sparring Pre-Torneo',
];

const WEATHER_OPTS = [
  { key: 'seco', label: 'Seca', color: '#00DC7D' },
  { key: 'humeda', label: 'Húmeda', color: '#38BDF8' },
  { key: 'llovizna', label: 'Llovizna', color: '#E5C16C' },
  { key: 'lluvia', label: 'Lluvia', color: '#F87171' },
];

const CLUB_SHOWCASE_CATEGORIES = [
  { id: 'bebidas', label: 'Agua / Bebidas' },
  { id: 'alimentos', label: 'Alimentos / Café' },
  { id: 'alquiler', label: 'Alquiler Equipo' },
  { id: 'tienda', label: 'Pelotas / Tienda' },
  { id: 'servicio', label: 'Encordado / Servicio' },
];

const SLOT_STATUS_CYCLE = [
  { key: 'open', label: 'Disponible' },
  { key: 'few', label: 'Último cupo' },
  { key: 'full', label: 'Lleno' },
];

const VIDEO_QUOTAS = {
  COACH: { maxCount: 4, maxMB: 25, maxSec: 90 },
  CLUB: { maxCount: 2, maxMB: 40, maxSec: 90 },
};

const themeHex = (id) =>
  COACH_THEMES.find((t) => t.id === id || t.hex === id)?.hex || '#00DC7D';

function formatFreshnessLabel(isoStr) {
  if (!isoStr) return 'Sin actualizar hoy';
  const dt = new Date(isoStr);
  if (Number.isNaN(dt.getTime())) return 'Actualizado recientemente';
  const now = new Date();
  const todayPeru = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const targetPeru = dt.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const timeEs = dt.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  if (todayPeru === targetPeru) return `Actualizado hoy · ${timeEs}`;
  const diffDays = Math.max(1, Math.round((now.getTime() - dt.getTime()) / (24 * 3600 * 1000)));
  if (diffDays === 1) return `Actualizado ayer · ${timeEs}`;
  return `Actualizado hace ${diffDays} días`;
}

function formatDurationSec(sec) {
  const s = Math.max(1, Math.round(Number(sec) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function readVideoDurationSec(file) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      const done = (val) => {
        URL.revokeObjectURL(url);
        resolve(val);
      };
      vid.onloadedmetadata = () => done(Number.isFinite(vid.duration) ? vid.duration : 0);
      vid.onerror = () => done(0);
      vid.src = url;
    } catch {
      resolve(0);
    }
  });
}

function detectVideoMime(file) {
  const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
  if (file?.type && allowed.includes(file.type.toLowerCase())) return file.type.toLowerCase();
  const ext = (file?.name || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'webm') return 'video/webm';
  return 'video/mp4';
}

async function uploadVideoDirectToR2({ file, ownerType, ownerId, currentCount, onProgress }) {
  const quota = VIDEO_QUOTAS[ownerType] || VIDEO_QUOTAS.COACH;
  const maxBytes = quota.maxMB * 1024 * 1024;
  if (currentCount >= quota.maxCount) {
    throw new Error(`Límite alcanzado (${quota.maxCount} videos). Borra uno para subir otro.`);
  }
  if (!file || file.size > maxBytes) {
    throw new Error(`El video pesa más de ${quota.maxMB} MB. Recórtalo o baja la resolución a 1080p/720p.`);
  }

  const durationSec = await readVideoDurationSec(file);
  if (durationSec > quota.maxSec + 2) {
    throw new Error(`El video dura ${formatDurationSec(durationSec)}. El máximo permitido es ${quota.maxSec} s.`);
  }

  const contentType = detectVideoMime(file);
  const presignRes = await fetch('/api/r2-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'presign',
      ownerType,
      ownerId,
      contentType,
      sizeBytes: file.size,
      currentCount,
    }),
  });
  const data = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok || !data?.uploadUrl) {
    throw new Error(data?.error || 'No se pudo autorizar la subida de video.');
  }

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', data.uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`Error al subir video a R2 (${xhr.status}). Verifica CORS en Cloudflare.`));
      }
    };
    xhr.onerror = () => reject(new Error('Sin conexión al subir el video. Intenta de nuevo.'));
    xhr.send(file);
  });

  return {
    publicUrl: data.publicUrl,
    r2Key: data.r2Key,
    duration: durationSec > 0 ? formatDurationSec(durationSec) : '0:45',
    sizeBytes: file.size,
  };
}

async function deleteVideoFromR2(r2Key) {
  if (!r2Key || !String(r2Key).startsWith('uploads/')) return;
  try {
    await fetch('/api/r2-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', r2Key }),
    });
  } catch {
    // silencioso
  }
}

function buildBaseCoach(partner) {
  return {
    id: partner?.id || 'coach-romina',
    name: partner?.name || 'Romina Cutipa',
    clubId: partner?.clubId || 'club-romina',
    clubName: 'Academia Romina Cutipa',
    title: 'Head Coach · Directora de Academia',
    role: 'Head Coach · Directora de Academia',
    bio: 'Técnica limpia sobre arcilla, corrección de saque y táctica competitiva.',
    photoUrl: ASSETS.portadaTipsSemana,
    photo: ASSETS.portadaTipsSemana,
    coverUrl: ASSETS.sedeRomina,
    accentTheme: 'emerald',
    accent: '#00DC7D',
    specialties: ['Técnica & Biomecánica', 'Topspin en Arcilla', 'Táctica Competitiva'],
    baseRate: 60,
    vipRate: 50,
    freeSlotToday: 'Hoy · 06:00 p. m.',
    availableToday: true,
    whatsapp: '51964201001',
    profileViews: 48,
    whatsappClicks: 14,
    updatedAt: new Date().toISOString(),
    gallery: [{ id: 'cg-1', url: ASSETS.portadaTipsSemana, caption: 'Entrenamiento en arcilla' }],
    videos: [
      {
        id: 'pv-1',
        title: 'Tip Gratis: Cómo controlar la pelota en altura',
        duration: '0:42',
        isFree: true,
        isExclusive: false,
        gemsCost: 0,
        url: ASSETS.videoCoachRomina,
        src: ASSETS.videoCoachRomina,
        poster: ASSETS.portadaTipsSemana,
        active: true,
      },
    ],
    packages: [
      {
        id: 'pk-1',
        type: 'PRIVADA 1 A 1',
        title: 'Sesión Técnica Personalizada (60 min)',
        name: 'Sesión Técnica Personalizada (60 min)',
        desc: 'Diagnóstico + corrección en vivo + clips por WhatsApp.',
        level: 'todos',
        ageGroup: 'adultos',
        photoUrl: '',
        priceRegular: 60,
        price: 60,
        priceVip: 50,
        vipPrice: 50,
        tag: 'MÁS PEDIDA',
        badge: 'MÁS PEDIDA',
      },
    ],
    groups: [
      {
        id: 'grp-1',
        day: 'Mié & Vie',
        time: '06:00 p. m.',
        label: 'Grupo Competitivo 5ª A / 4ª',
        level: 'intermedio',
        ageGroup: 'adultos',
        photoUrl: '',
        price: 30,
        vipPrice: 25,
        spotsUsed: 3,
        spotsTotal: 4,
        spotsFilled: 3,
        spotsMax: 4,
      },
    ],
    schedule: [
      { id: 'hs-1', day: 'Hoy', time: '06:00 p. m.', status: 'open', level: 'todos', ageGroup: 'adultos' },
      { id: 'hs-2', day: 'Mañana', time: '08:00 a. m.', status: 'open', level: 'cero', ageGroup: 'todas' },
      { id: 'hs-3', day: 'Sábado', time: '09:00 a. m.', status: 'open', level: 'intermedio', ageGroup: 'juveniles' },
    ],
    students: [
      {
        id: 'st-1',
        name: 'Valeria Paredes',
        level: '5ª A',
        groupName: 'Grupo Competitivo 5ª A / 4ª',
        whatsapp: '964112233',
        feeStatus: 'AL_DIA',
        attendedToday: true,
      },
    ],
  };
}

function normalizeCoach(d) {
  const nowIso = new Date().toISOString();
  const freeSlot = String(d.freeSlotToday || '').trim();
  const hex = themeHex(d.accentTheme || d.accent);
  const schedule = [...(d.schedule || [])].map((sl) => ({
    ...sl,
    status: sl.status || 'open',
    level: sl.level || 'todos',
    ageGroup: sl.ageGroup || 'todas',
    updatedAt: sl.updatedAt || nowIso,
  }));

  if (freeSlot) {
    const [dayStr, timeStr] = freeSlot.split('·').map((s) => s.trim());
    const dLabel = dayStr || 'Hoy';
    const tLabel = timeStr || freeSlot;
    if (!schedule.some((s) => s.day === dLabel && s.time === tLabel)) {
      schedule.unshift({
        id: `hs-${Date.now()}`,
        day: dLabel,
        time: tLabel,
        status: 'open',
        level: 'todos',
        ageGroup: 'todas',
        updatedAt: nowIso,
      });
    }
  }

  return {
    ...d,
    updatedAt: nowIso,
    title: d.title || d.role || 'Coach Oficial',
    role: d.title || d.role || 'Coach Oficial',
    photoUrl: d.photoUrl || d.photo || ASSETS.portadaTipsSemana,
    photo: d.photoUrl || d.photo || ASSETS.portadaTipsSemana,
    coverUrl: d.coverUrl || ASSETS.sedeRomina,
    accent: hex,
    freeSlotToday: freeSlot,
    availableToday: Boolean(freeSlot),
    schedule: schedule.slice(0, 18),
    videos: (d.videos || []).map((v) => ({
      ...v,
      url: v.url || v.src || (v.isTextTip ? '' : ASSETS.videoCoachRomina),
      src: v.url || v.src || (v.isTextTip ? '' : ASSETS.videoCoachRomina),
      isFree: !(Number(v.gemsCost) > 0) && !v.isExclusive,
      updatedAt: v.updatedAt || nowIso,
    })),
    packages: (d.packages || []).map((pk) => {
      const reg = Number(pk.priceRegular ?? pk.price ?? 60) || 60;
      const vip = Number(pk.priceVip ?? pk.vipPrice ?? 50) || 50;
      return {
        ...pk,
        title: pk.title || pk.name || 'Sesión Técnica',
        name: pk.title || pk.name || 'Sesión Técnica',
        level: pk.level || 'todos',
        ageGroup: pk.ageGroup || 'todas',
        photoUrl: pk.photoUrl || '',
        priceRegular: reg,
        price: reg,
        priceVip: vip,
        vipPrice: vip,
        tag: pk.tag || pk.badge || '',
        badge: pk.tag || pk.badge || '',
        updatedAt: pk.updatedAt || nowIso,
      };
    }),
    groups: (d.groups || []).map((g) => ({
      ...g,
      level: g.level || 'todos',
      ageGroup: g.ageGroup || 'todas',
      photoUrl: g.photoUrl || '',
      spotsUsed: Number(g.spotsUsed ?? g.spotsFilled ?? 0),
      spotsTotal: Number(g.spotsTotal ?? g.spotsMax ?? 4),
      spotsFilled: Number(g.spotsUsed ?? g.spotsFilled ?? 0),
      spotsMax: Number(g.spotsTotal ?? g.spotsMax ?? 4),
      updatedAt: g.updatedAt || nowIso,
    })),
  };
}

function hydrateClubServices(rawServices) {
  if (!Array.isArray(rawServices) || rawServices.length === 0) {
    return [
      {
        id: 'srv-agua',
        category: 'bebidas',
        title: 'Agua mineral / Isotónico frío',
        desc: 'Botella helada lista en recepción',
        price: 5,
        vipPrice: 4,
        photoUrl: '',
        available: true,
      },
      {
        id: 'srv-raqueta',
        category: 'alquiler',
        title: 'Alquiler de Raqueta Pro',
        desc: 'Grip nuevo + 3 pelotas de práctica',
        price: 15,
        vipPrice: 10,
        photoUrl: '',
        available: true,
      },
      {
        id: 'srv-tarro',
        category: 'tienda',
        title: 'Tarro de Pelotas Presurizadas (x3)',
        desc: 'Marca oficial de circuito en arcilla',
        price: 38,
        vipPrice: 34,
        photoUrl: '',
        available: true,
      },
    ];
  }
  return rawServices.map((item, idx) => {
    if (typeof item === 'string') {
      return {
        id: `srv-${idx}`,
        category: 'servicio',
        title: item,
        desc: 'Disponible en sede',
        price: 0,
        vipPrice: 0,
        photoUrl: '',
        available: true,
      };
    }
    return {
      id: item.id || `srv-${idx}`,
      category: item.category || 'servicio',
      title: item.title || item.name || 'Servicio en sede',
      desc: item.desc || item.detail || '',
      price: Number(item.price) || 0,
      vipPrice: Number(item.vipPrice) || 0,
      photoUrl: item.photoUrl || item.image || '',
      available: item.available !== false,
    };
  });
}

function hydrateClub(c) {
  const r = c?.rates || c?.tarifas || {};
  const diaReg = Number(c?.dayRate ?? r.diaRegular ?? r.day) || 32;
  const diaVip = Number(c?.vipDayRate ?? r.diaVip ?? r.vipDay) || 24;
  const nocReg = Number(c?.nightRate ?? r.nocheRegular ?? r.night) || 42;
  const nocVip = Number(c?.vipNightRate ?? r.nocheVip ?? r.vipNight) || 34;
  const bookingUrl = c?.bookingUrl || r.bookingUrl || '';
  const freeHoursToday = c?.freeHoursToday || r.freeHoursToday || '';
  const condRaw = c?.climaBase?.conditionKey || 'seco';
  const cond = condRaw === 'humedad' ? 'humeda' : condRaw;
  const gal = Array.isArray(c?.gallery) && c.gallery.length ? c.gallery : c?.galeria || [];

  return {
    ...c,
    logoUrl: c?.logoUrl || c?.logo || ASSETS.clubCountry,
    logo: c?.logoUrl || c?.logo || ASSETS.clubCountry,
    coverUrl: c?.coverUrl || c?.cover || ASSETS.sedeCountry,
    cover: c?.coverUrl || c?.cover || ASSETS.sedeCountry,
    hours: c?.hours || '06:00 a. m. – 10:00 p. m.',
    whatsapp: c?.whatsapp || '',
    freeHoursToday,
    updatedAt: c?.updatedAt || r.updatedAt || null,
    climaBase: { ...(c?.climaBase || {}), conditionKey: cond },
    dayRate: diaReg,
    vipDayRate: diaVip,
    nightRate: nocReg,
    vipNightRate: nocVip,
    bookingUrl,
    rates: {
      diaRegular: diaReg,
      diaVip,
      nocheRegular: nocReg,
      nocheVip: nocVip,
      day: diaReg,
      vipDay: diaVip,
      night: nocReg,
      vipNight: nocVip,
      bookingUrl,
      freeHoursToday,
      updatedAt: c?.updatedAt || r.updatedAt || null,
    },
    services: hydrateClubServices(c?.services),
    gallery: gal.map((g, i) =>
      typeof g === 'string'
        ? { id: `cg-${i}`, url: g, image: g, title: `Vista ${i + 1}`, caption: `Vista ${i + 1}` }
        : {
            id: g.id || `cg-${i}`,
            url: g.url || g.image,
            image: g.image || g.url,
            title: g.title || g.caption || `Vista ${i + 1}`,
            caption: g.caption || g.title || `Vista ${i + 1}`,
          }
    ),
    videos: Array.isArray(c?.videos) ? c.videos : [],
    vipBenefits:
      Array.isArray(c?.vipBenefits) && c.vipBenefits.length
        ? c.vipBenefits
        : ['Tarifa preferencial VIP en alquiler de cancha', 'Prioridad en horarios estelares'],
    promos: Array.isArray(c?.promos) && c.promos.length ? c.promos : c?.promosHorasValle || [],
    internalEvents:
      Array.isArray(c?.internalEvents) && c.internalEvents.length
        ? c.internalEvents
        : c?.torneosInternos || [],
  };
}

function normalizeClub(d) {
  const nowIso = new Date().toISOString();
  const diaReg = Number(d.rates?.diaRegular ?? d.dayRate) || 32;
  const diaVip = Number(d.rates?.diaVip ?? d.vipDayRate) || 24;
  const nocReg = Number(d.rates?.nocheRegular ?? d.nightRate) || 42;
  const nocVip = Number(d.rates?.nocheVip ?? d.vipNightRate) || 34;
  const bookingUrl = String(d.rates?.bookingUrl ?? d.bookingUrl ?? '').trim();
  const freeHoursToday = String(d.freeHoursToday ?? d.rates?.freeHoursToday ?? '').trim();

  return {
    ...d,
    updatedAt: nowIso,
    logoUrl: d.logoUrl || d.logo || ASSETS.clubCountry,
    logo: d.logoUrl || d.logo || ASSETS.clubCountry,
    coverUrl: d.coverUrl || d.cover || ASSETS.sedeCountry,
    cover: d.coverUrl || d.cover || ASSETS.sedeCountry,
    dayRate: diaReg,
    vipDayRate: diaVip,
    nightRate: nocReg,
    vipNightRate: nocVip,
    bookingUrl,
    freeHoursToday,
    rates: {
      diaRegular: diaReg,
      diaVip,
      nocheRegular: nocReg,
      nocheVip: nocVip,
      day: diaReg,
      vipDay: diaVip,
      night: nocReg,
      vipNight: nocVip,
      bookingUrl,
      freeHoursToday,
      updatedAt: nowIso,
    },
    services: Array.isArray(d.services) ? d.services : [],
    videos: Array.isArray(d.videos) ? d.videos : [],
    promos: (d.promos || []).map((pr) => ({
      ...pr,
      tag: pr.tag || 'PROMO',
      photoUrl: pr.photoUrl || '',
      priceText: pr.priceText || pr.priceNote || '',
      priceNote: pr.priceNote || pr.priceText || '',
    })),
    internalEvents: (d.internalEvents || []).map((ev) => {
      const used = Number(ev.spotsUsed) || 1;
      const total = Math.max(2, Number(ev.spotsTotal) || 12);
      return {
        ...ev,
        date: ev.date || ev.dateLabel || '',
        dateLabel: ev.dateLabel || ev.date || '',
        spots: `${used} / ${total} cupos`,
        pct: Math.min(100, Math.round((used / total) * 100)),
        fee: typeof ev.fee === 'number' ? `S/ ${ev.fee}` : ev.fee || 'Abierto',
      };
    }),
  };
}

export default function PartnerStudioModal({
  isOpen = false,
  onClose,
  partner = null,
  players = [],
  clubs = INITIAL_CLUBS,
  coaches = [],
  theme = 'dark',
  onSaveCoachChanges,
  onSaveClubChanges,
  onUpdateClubWeather,
  onNotify,
}) {
  const coachPhotoRef = useRef(null);
  const coachCoverRef = useRef(null);
  const coachGalRef = useRef(null);
  const coachVidRef = useRef(null);
  const itemPhotoRef = useRef(null);
  const clubLogoRef = useRef(null);
  const clubCoverRef = useRef(null);
  const clubPhotoRef = useRef(null);
  const clubVidRef = useRef(null);

  const [role, setRole] = useState(partner?.role === 'CLUB' ? 'CLUB' : 'COACH');
  const [coachTab, setCoachTab] = useState('hoy');
  const [clubTab, setClubTab] = useState('estado');
  const [syncState, setSyncState] = useState('saved');
  const [uploading, setUploading] = useState(false);
  const [videoPct, setVideoPct] = useState(null);

  const [coachId, setCoachId] = useState(partner?.id || coaches?.[0]?.id || 'coach-romina');
  const [coachDraft, setCoachDraft] = useState(() => buildBaseCoach(partner));
  const [clubId, setClubId] = useState(partner?.clubId || clubs?.[0]?.id || 'club-country');
  const [clubDraft, setClubDraft] = useState(() => hydrateClub((clubs || INITIAL_CLUBS)[0]));

  // Estados de formularios compactos
  const [openForm, setOpenForm] = useState(null);
  const [fTitle, setFTitle] = useState('');
  const [fSub, setFSub] = useState('');
  const [fA, setFA] = useState('60');
  const [fB, setFB] = useState('50');
  const [fC, setFC] = useState('4');
  const [fLevel, setFLevel] = useState('todos');
  const [fAge, setFAge] = useState('todas');
  const [fModality, setFModality] = useState('PRIVADA 1 A 1');
  const [fCategory, setFCategory] = useState('bebidas');
  const [fPhotoUrl, setFPhotoUrl] = useState('');
  const [fFlag, setFFlag] = useState(false);

  const [clubVidTitle, setClubVidTitle] = useState('');
  const [slotDay, setSlotDay] = useState('Mañana');
  const [slotTime, setSlotTime] = useState('06:00 p. m.');
  const [slotLevel, setSlotLevel] = useState('todos');
  const [slotAge, setSlotAge] = useState('todas');
  const [newBenefit, setNewBenefit] = useState('');
  const [vipSearch, setVipSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (partner?.role === 'CLUB') setRole('CLUB');
    else if (partner?.role === 'COACH') setRole('COACH');
    setCoachId(partner?.id && partner.role !== 'CLUB' ? partner.id : coaches?.[0]?.id || 'coach-romina');
    setClubId(partner?.clubId || clubs?.[0]?.id || 'club-country');
    setOpenForm(null);
    setVideoPct(null);
  }, [isOpen, partner, coaches, clubs]);

  useEffect(() => {
    const found = (coaches || []).find((c) => c.id === coachId);
    const base = buildBaseCoach(found || partner);
    if (!found) return setCoachDraft(base);
    setCoachDraft({
      ...base,
      ...found,
      title: found.title || found.role || base.title,
      photoUrl: found.photoUrl || found.photo || base.photoUrl,
      coverUrl: found.coverUrl || base.coverUrl,
      accentTheme: found.accentTheme || 'emerald',
      accent: found.accent || themeHex(found.accentTheme),
      updatedAt: found.updatedAt || found.schedule?.[0]?.updatedAt || base.updatedAt,
      gallery: found.gallery?.length ? found.gallery : base.gallery,
      packages: found.packages?.length ? found.packages : base.packages,
      groups: found.groups?.length ? found.groups : base.groups,
      schedule: found.schedule?.length ? found.schedule : base.schedule,
      videos: Array.isArray(found.videos) ? found.videos : base.videos,
      students: Array.isArray(found.students) ? found.students : base.students,
      specialties: found.specialties?.length ? found.specialties : base.specialties,
    });
  }, [coachId, coaches, partner]);

  useEffect(() => {
    const found = (clubs || INITIAL_CLUBS).find((c) => c.id === clubId) || (clubs || INITIAL_CLUBS)[0];
    if (found) setClubDraft(hydrateClub(found));
  }, [clubId, clubs]);

  const saveCoach = async (raw, toast = '') => {
    const clean = normalizeCoach(raw);
    setCoachDraft(clean);
    setSyncState('saving');
    try {
      const saved = isCloudReady ? (await upsertCloudCoach(clean)) || clean : clean;
      if (onSaveCoachChanges) onSaveCoachChanges({ ...clean, ...saved });
      setSyncState('saved');
      if (toast && onNotify) onNotify(toast, 'success');
    } catch {
      setSyncState('error');
      if (onNotify) onNotify('Guardado local. Revisa tu señal.', 'warning');
    }
  };

  const saveClub = async (raw, toast = '') => {
    const clean = normalizeClub(raw);
    setClubDraft(clean);
    setSyncState('saving');
    try {
      const saved = isCloudReady ? (await upsertCloudClub(clean)) || clean : clean;
      if (onSaveClubChanges) onSaveClubChanges(clean.id, { ...clean, ...saved });
      setSyncState('saved');
      if (toast && onNotify) onNotify(toast, 'success');
    } catch {
      setSyncState('error');
      if (onNotify) onNotify('Guardado local. Revisa tu señal.', 'warning');
    }
  };

  const uploadPhoto = async (e, folder, idPrefix, onUrl) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCompressedMedia(file, folder, idPrefix);
      if (url) {
        triggerHaptic('success');
        await onUrl(url);
      }
    } catch {
      triggerHaptic('warning');
      if (onNotify) onNotify('Error subiendo foto. Usa JPG o PNG.', 'warning');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCoachVideoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoPct(5);
    try {
      const uploaded = await uploadVideoDirectToR2({
        file,
        ownerType: 'COACH',
        ownerId: coachDraft.id,
        currentCount: (coachDraft.videos || []).filter((v) => !v.isTextTip).length,
        onProgress: setVideoPct,
      });
      const titleClean = fTitle.trim() || file.name.replace(/\.[^.]+$/, '').slice(0, 48) || 'Tip en cancha';
      const newVid = {
        id: `pv-${Date.now()}`,
        title: titleClean,
        duration: uploaded.duration,
        isFree: !fFlag,
        isExclusive: fFlag,
        isTextTip: false,
        gemsCost: fFlag ? Math.max(10, Number(fA) || 40) : 0,
        url: uploaded.publicUrl,
        src: uploaded.publicUrl,
        r2Key: uploaded.r2Key,
        sizeBytes: uploaded.sizeBytes,
        poster: fFlag ? ASSETS.portadaAcademiaTv : coachDraft.coverUrl || coachDraft.photoUrl || ASSETS.portadaTipsSemana,
        active: true,
      };
      triggerHaptic('success');
      await saveCoach({ ...coachDraft, videos: [newVid, ...(coachDraft.videos || [])] }, 'Video publicado en vivo.');
      setOpenForm(null);
    } catch (err) {
      triggerHaptic('warning');
      if (onNotify) onNotify(err?.message || 'No se pudo subir el video.', 'warning');
    } finally {
      setVideoPct(null);
      e.target.value = '';
    }
  };

  const handleClubVideoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoPct(5);
    try {
      const uploaded = await uploadVideoDirectToR2({
        file,
        ownerType: 'CLUB',
        ownerId: clubDraft.id,
        currentCount: (clubDraft.videos || []).length,
        onProgress: setVideoPct,
      });
      const titleClean = clubVidTitle.trim() || `Video Tour · ${clubDraft.shortName || clubDraft.name}`;
      const newVid = {
        id: `cv-${Date.now()}`,
        title: titleClean,
        duration: uploaded.duration,
        url: uploaded.publicUrl,
        r2Key: uploaded.r2Key,
        sizeBytes: uploaded.sizeBytes,
        poster: clubDraft.coverUrl || clubDraft.gallery?.[0]?.url || ASSETS.sedeCountry,
      };
      triggerHaptic('success');
      await saveClub({ ...clubDraft, videos: [newVid, ...(clubDraft.videos || [])] }, 'Trailer del club publicado.');
      setClubVidTitle('');
    } catch (err) {
      triggerHaptic('warning');
      if (onNotify) onNotify(err?.message || 'No se pudo subir el trailer.', 'warning');
    } finally {
      setVideoPct(null);
      e.target.value = '';
    }
  };

  const toggleForm = (id, defaults = {}) => {
    triggerHaptic('light');
    if (openForm === id) return setOpenForm(null);
    setFTitle(defaults.title || '');
    setFSub(defaults.sub || '');
    setFA(defaults.a || '');
    setFB(defaults.b || '');
    setFC(defaults.c || '');
    setFLevel(defaults.level || 'todos');
    setFAge(defaults.age || 'todas');
    setFModality(defaults.modality || 'PRIVADA 1 A 1');
    setFCategory(defaults.category || 'bebidas');
    setFPhotoUrl('');
    setFFlag(Boolean(defaults.flag));
    setOpenForm(id);
  };

  const vipMatches = useMemo(() => {
    const q = vipSearch.trim().toLowerCase();
    if (!q) return [];
    return (players || [])
      .filter((p) => `${p.name || ''} ${p.credentialId || ''} ${p.whatsapp || ''}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [players, vipSearch]);

  const conversion = useMemo(() => {
    const v = Number(coachDraft.profileViews) || 0;
    const c = Number(coachDraft.whatsappClicks) || 0;
    return v > 0 ? Math.min(100, Math.round((c / v) * 100)) : 0;
  }, [coachDraft.profileViews, coachDraft.whatsappClicks]);

  const coachVideoCount = useMemo(
    () => (coachDraft.videos || []).filter((v) => !v.isTextTip).length,
    [coachDraft.videos]
  );

  const cIdx = ['hoy', 'clases', 'alumnos', 'marca'].indexOf(coachTab);
  const clIdx = ['estado', 'vitrina', 'promos', 'validar'].indexOf(clubTab);

  const levelLabel = (id) => CLASS_LEVEL_OPTIONS.find((x) => x.id === id)?.label || 'Todos';
  const ageLabel = (id) => CLASS_AGE_OPTIONS.find((x) => x.id === id)?.label || 'Todas';
  const srvCatLabel = (id) => CLUB_SHOWCASE_CATEGORIES.find((x) => x.id === id)?.label || 'Servicio';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={role === 'COACH' ? 'Estudio Coach Pro' : 'Panel de Club Aliado'}
      subtitle={
        role === 'COACH'
          ? `${coachDraft.name} · ${formatFreshnessLabel(coachDraft.updatedAt)}`
          : `${clubDraft.name} · ${formatFreshnessLabel(clubDraft.updatedAt)}`
      }
      icon={
        <IconBadge
          name={role === 'COACH' ? 'users' : 'shield'}
          variant={role === 'COACH' ? 'emerald' : 'gold'}
          size={38}
        />
      }
      isWide
      isTopLayer
    >
      <div className={`tt-ps-studio ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* CABECERA B2B + KPIs */}
        <div className="tt-pst-hero">
          <div className="tt-pst-hero-top">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="tt-pst-kicker">ESCAPARATE PRO · TOTAL TENIS</span>
                <span className={`tt-sync-pill is-${syncState}`}>
                  {syncState === 'saving' ? 'Guardando...' : syncState === 'error' ? 'Local' : '● En vivo'}
                </span>
              </div>
              <h2>{role === 'COACH' ? coachDraft.name : clubDraft.name}</h2>
              <small className="tt-pst-fresh-line">
                {role === 'COACH'
                  ? formatFreshnessLabel(coachDraft.updatedAt)
                  : formatFreshnessLabel(clubDraft.updatedAt)}
              </small>
            </div>

            <div className="tt-pst-role-switch">
              {['COACH', 'CLUB'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={role === r ? 'is-active' : ''}
                  onClick={() => {
                    triggerHaptic('light');
                    setOpenForm(null);
                    setRole(r);
                  }}
                >
                  {r === 'COACH' ? 'Coach' : 'Club'}
                </button>
              ))}
            </div>
          </div>

          <div className="tt-pst-kpi-strip">
            {role === 'COACH' ? (
              <>
                <div><span>VISITAS</span><strong>{Number(coachDraft.profileViews) || 0}</strong></div>
                <div className="is-emerald"><span>WHATSAPP</span><strong>{Number(coachDraft.whatsappClicks) || 0}</strong></div>
                <div><span>INTERÉS</span><strong>{conversion}%</strong></div>
              </>
            ) : (
              <>
                <div><span>VITRINA</span><strong>{(clubDraft.services || []).length}</strong></div>
                <div className="is-emerald"><span>SOCIOS VIP</span><strong>{(players || []).filter((p) => p.isVip).length}</strong></div>
                <div><span>FOTOS / VID</span><strong>{(clubDraft.gallery || []).length}/{(clubDraft.videos || []).length}</strong></div>
              </>
            )}
          </div>
        </div>

        {/* ==================== MODO A: COACH PRO ==================== */}
        {role === 'COACH' && (
          <>
            {(coaches || []).length > 1 && (
              <div className="tt-pst-sel-row">
                {coaches.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`tt-pst-sel-chip tt-pst-press ${coachId === c.id ? 'is-on' : ''}`}
                    onClick={() => { triggerHaptic('light'); setCoachId(c.id); }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="tt-pst-tabs">
              <span className="tt-pst-slider" style={{ transform: `translateX(${Math.max(0, cIdx) * 100}%)` }} />
              {[
                { id: 'hoy', l: 'Agenda Hoy' },
                { id: 'clases', l: 'Clases & Packs' },
                { id: 'alumnos', l: 'Alumnos' },
                { id: 'marca', l: 'Perfil & Tips' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tt-pst-tab ${coachTab === t.id ? 'is-active' : ''}`}
                  onClick={() => { triggerHaptic('light'); setOpenForm(null); setCoachTab(t.id); }}
                >
                  {t.l}
                </button>
              ))}
            </div>

            {coachTab === 'hoy' && (
              <div className="tt-pst-sec">
                {/* 1 TOQUE: CONFIRMAR AGENDA DE HOY (SELLO "ACTUALIZADO HOY") */}
                <div className="tt-pst-fresh-cta-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="tt-pst-mk">CONFIANZA EN VIVO PARA ALUMNOS</span>
                    <strong>Confirma tu agenda de hoy en 1 toque</strong>
                    <small>
                      Los alumnos ven el sello <b>«Actualizado hoy»</b> y confían en que tus horarios están al día.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press"
                    onClick={() => {
                      triggerHaptic('success');
                      saveCoach(coachDraft, 'Sello «Actualizado hoy» renovado en tu escaparate.');
                    }}
                  >
                    ✓ Confirmar hoy
                  </button>
                </div>

                <div className="tt-pst-card">
                  <span className="tt-pst-mk">PUBLICACIÓN RÁPIDA · 1 TOQUE</span>
                  <h3>¿Tienes hora libre hoy?</h3>
                  <div className="tt-qs-grid">
                    {QUICK_SLOTS.map((s) => (
                      <button
                        key={s || 'full'}
                        type="button"
                        className={`tt-qs-pill tt-pst-press ${(coachDraft.freeSlotToday || '') === s ? 'is-on' : ''}`}
                        onClick={() => {
                          triggerHaptic('medium');
                          saveCoach(
                            { ...coachDraft, freeSlotToday: s, availableToday: Boolean(s) },
                            s ? `Publicado: ${s}` : 'Agenda marcada completa.'
                          );
                        }}
                      >
                        {s || 'Agenda completa'}
                      </button>
                    ))}
                  </div>
                  <div className="tt-pst-row">
                    <input
                      type="text"
                      className="tt-pst-in"
                      value={coachDraft.freeSlotToday || ''}
                      onChange={(e) => setCoachDraft((p) => ({ ...p, freeSlotToday: e.target.value }))}
                      placeholder="Ej. Hoy · 04:30 p. m."
                    />
                    <button type="button" className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press" onClick={() => saveCoach(coachDraft, 'Disponibilidad publicada.')}>
                      Publicar
                    </button>
                  </div>
                  <button
                    type="button"
                    className="tt-pst-wa tt-pst-press"
                    onClick={() => {
                      const msg = `🎾 ¡Turno libre con Coach ${coachDraft.name}! ${coachDraft.freeSlotToday || 'Esta semana'} en ${coachDraft.clubName}. Reserva directo en TOTAL TENIS.`;
                      window.open(buildWhatsappLink('', msg), '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <TTIcon name="whatsapp" size={17} /> Compartir turno libre en WhatsApp
                  </button>
                </div>

                {/* HORARIOS INTERACTIVOS POR NIVEL Y EDAD */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mk">HORARIOS POR NIVEL Y EDAD (TOCA PARA CAMBIAR CUPO)</span>
                  <form
                    className="tt-pst-form-clean"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!slotDay.trim() || !slotTime.trim()) return;
                      saveCoach(
                        {
                          ...coachDraft,
                          schedule: [
                            {
                              id: `hs-${Date.now()}`,
                              day: slotDay.trim(),
                              time: slotTime.trim(),
                              status: 'open',
                              level: slotLevel,
                              ageGroup: slotAge,
                              updatedAt: new Date().toISOString(),
                            },
                            ...(coachDraft.schedule || []),
                          ],
                        },
                        'Horario agregado a tu agenda.'
                      );
                    }}
                  >
                    <div className="tt-pst-g2">
                      <input className="tt-pst-in" value={slotDay} onChange={(e) => setSlotDay(e.target.value)} placeholder="Día (ej. Hoy, Jueves)" />
                      <input className="tt-pst-in" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} placeholder="Hora (ej. 06:00 p. m.)" />
                    </div>
                    <div className="tt-pst-g2">
                      <select className="tt-pst-in" value={slotLevel} onChange={(e) => setSlotLevel(e.target.value)}>
                        {CLASS_LEVEL_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>Nivel: {o.label}</option>
                        ))}
                      </select>
                      <select className="tt-pst-in" value={slotAge} onChange={(e) => setSlotAge(e.target.value)}>
                        {CLASS_AGE_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>Edad: {o.label}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press">
                      + Publicar horario en agenda
                    </button>
                  </form>

                  <div className="tt-pst-list">
                    {(coachDraft.schedule || []).map((sl) => {
                      const curIdx = Math.max(0, SLOT_STATUS_CYCLE.findIndex((s) => s.key === (sl.status || 'open')));
                      const nextSt = SLOT_STATUS_CYCLE[(curIdx + 1) % SLOT_STATUS_CYCLE.length];
                      const curSt = SLOT_STATUS_CYCLE[curIdx];
                      return (
                        <div key={sl.id} className="tt-pst-item">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{sl.day} · {sl.time}</strong>
                            <small>
                              {levelLabel(sl.level)} · {ageLabel(sl.ageGroup)}
                            </small>
                          </div>
                          <div className="tt-pst-row">
                            <button
                              type="button"
                              className={`tt-st-pill ${
                                curSt.key === 'open' ? 'is-ok' : curSt.key === 'few' ? 'is-due' : 'is-full'
                              }`}
                              onClick={() => {
                                triggerHaptic('light');
                                saveCoach({
                                  ...coachDraft,
                                  schedule: (coachDraft.schedule || []).map((x) =>
                                    x.id === sl.id ? { ...x, status: nextSt.key, updatedAt: new Date().toISOString() } : x
                                  ),
                                });
                              }}
                            >
                              {curSt.label}
                            </button>
                            <button
                              type="button"
                              className="tt-pst-del"
                              onClick={() =>
                                saveCoach({
                                  ...coachDraft,
                                  schedule: (coachDraft.schedule || []).filter((x) => x.id !== sl.id),
                                })
                              }
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {coachTab === 'clases' && (
              <div className="tt-pst-sec">
                <div className="tt-pst-head">
                  <div><span className="tt-pst-mk">VITRINA CON FOTO · NIVEL · EDAD</span><h3>Clases, Packs & Ofertas</h3></div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press"
                    onClick={() => toggleForm('pkg', { a: '60', b: '50', c: 'OFERTA', level: 'todos', age: 'todas' })}
                  >
                    {openForm === 'pkg' ? 'Cerrar' : '+ Nueva Clase'}
                  </button>
                </div>

                {openForm === 'pkg' && (
                  <form
                    className="tt-pst-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (fTitle.trim().length < 3) return;
                      const reg = Number(fA) || 60;
                      const vip = Math.min(Number(fB) || 50, reg);
                      saveCoach(
                        {
                          ...coachDraft,
                          packages: [
                            {
                              id: `pk-${Date.now()}`,
                              type: fModality,
                              title: fTitle.trim(),
                              name: fTitle.trim(),
                              desc: fSub.trim() || 'Entrenamiento práctico en cancha.',
                              level: fLevel,
                              ageGroup: fAge,
                              photoUrl: fPhotoUrl,
                              priceRegular: reg,
                              price: reg,
                              priceVip: vip,
                              vipPrice: vip,
                              tag: fC.trim().toUpperCase(),
                              badge: fC.trim().toUpperCase(),
                            },
                            ...(coachDraft.packages || []),
                          ],
                        },
                        'Clase publicada en tu escaparate.'
                      );
                      setOpenForm(null);
                    }}
                  >
                    <div className="tt-chips-wrap">
                      {CLASS_MODALITY_OPTIONS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`tt-spec-pill ${fModality === m ? 'is-on' : ''}`}
                          onClick={() => setFModality(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <input className="tt-pst-in" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Título (ej. Plan 4 Clases + Video Análisis)" required />
                    <input className="tt-pst-in" value={fSub} onChange={(e) => setFSub(e.target.value)} placeholder="Qué incluye (ej. raqueta de prueba, corrección de saque)" />

                    <div className="tt-pst-g2">
                      <select className="tt-pst-in" value={fLevel} onChange={(e) => setFLevel(e.target.value)}>
                        {CLASS_LEVEL_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>Nivel: {o.label}</option>
                        ))}
                      </select>
                      <select className="tt-pst-in" value={fAge} onChange={(e) => setFAge(e.target.value)}>
                        {CLASS_AGE_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>Edad: {o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="tt-pst-g3">
                      <input type="number" className="tt-pst-in" value={fA} onChange={(e) => setFA(e.target.value)} placeholder="S/ Reg" />
                      <input type="number" className="tt-pst-in" value={fB} onChange={(e) => setFB(e.target.value)} placeholder="S/ VIP" />
                      <input className="tt-pst-in" value={fC} onChange={(e) => setFC(e.target.value)} placeholder="Etiqueta" />
                    </div>

                    <div className="tt-pst-row">
                      <input
                        ref={itemPhotoRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          uploadPhoto(e, 'coaches', `${coachDraft.id}-pk`, (url) => setFPhotoUrl(url))
                        }
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        className="tt-btn tt-btn-ghost tt-btn-sm"
                        onClick={() => itemPhotoRef.current?.click()}
                      >
                        <TTIcon name="camera" size={14} />{' '}
                        {uploading ? 'Subiendo...' : fPhotoUrl ? '✓ Foto lista (cambiar)' : '+ Foto real (opcional)'}
                      </button>
                      {fPhotoUrl && (
                        <SmartImage src={fPhotoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                      )}
                    </div>

                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">Publicar en Escaparate</button>
                  </form>
                )}

                <div className="tt-pst-list">
                  {(coachDraft.packages || []).map((pk) => (
                    <div key={pk.id} className="tt-pst-item">
                      {pk.photoUrl && (
                        <SmartImage
                          src={pk.photoUrl}
                          alt={pk.title}
                          style={{ width: 48, height: 48, borderRadius: 11, objectFit: 'cover', flexShrink: 0 }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="tt-pst-mk">{pk.type} {pk.tag || pk.badge ? `· ${pk.tag || pk.badge}` : ''}</span>
                        <strong>{pk.title || pk.name}</strong>
                        <small>
                          S/ {pk.priceRegular ?? pk.price} (VIP S/ {pk.priceVip ?? pk.vipPrice}) · {levelLabel(pk.level)} · {ageLabel(pk.ageGroup)}
                        </small>
                      </div>
                      <button type="button" className="tt-pst-del" onClick={() => saveCoach({ ...coachDraft, packages: (coachDraft.packages || []).filter((x) => x.id !== pk.id) })}>✕</button>
                    </div>
                  ))}
                </div>

                {/* CLASES GRUPALES CON CUPOS EN VIVO */}
                <div className="tt-pst-head" style={{ marginTop: 4 }}>
                  <div><span className="tt-pst-mk">CUPOS EN VIVO · NIVEL Y EDAD</span><h3>Clases Grupales</h3></div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-ghost tt-btn-sm tt-pst-press"
                    onClick={() => toggleForm('grp', { sub: 'Mar & Jue · 7 p. m.', a: '35', b: '28', c: '4', level: 'intermedio', age: 'adultos' })}
                  >
                    {openForm === 'grp' ? 'Cerrar' : '+ Grupal'}
                  </button>
                </div>

                {openForm === 'grp' && (
                  <form
                    className="tt-pst-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (fTitle.trim().length < 3) return;
                      const [day, time] = fSub.split('·').map((s) => s.trim());
                      const max = Math.max(2, Number(fC) || 4);
                      saveCoach(
                        {
                          ...coachDraft,
                          groups: [
                            {
                              id: `grp-${Date.now()}`,
                              label: fTitle.trim(),
                              day: day || 'Turno',
                              time: time || '',
                              level: fLevel,
                              ageGroup: fAge,
                              price: Number(fA) || 35,
                              vipPrice: Number(fB) || 28,
                              spotsUsed: 1,
                              spotsTotal: max,
                              spotsFilled: 1,
                              spotsMax: max,
                            },
                            ...(coachDraft.groups || []),
                          ],
                        },
                        'Clase grupal publicada.'
                      );
                      setOpenForm(null);
                    }}
                  >
                    <input className="tt-pst-in" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Nombre (ej. Semillero Niños / Grupo Damas 5ª A)" required />
                    <input className="tt-pst-in" value={fSub} onChange={(e) => setFSub(e.target.value)} placeholder="Día · Hora (ej. Mar & Jue · 7 p. m.)" />
                    <div className="tt-pst-g2">
                      <select className="tt-pst-in" value={fLevel} onChange={(e) => setFLevel(e.target.value)}>
                        {CLASS_LEVEL_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>Nivel: {o.label}</option>
                        ))}
                      </select>
                      <select className="tt-pst-in" value={fAge} onChange={(e) => setFAge(e.target.value)}>
                        {CLASS_AGE_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>Edad: {o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="tt-pst-g3">
                      <input type="number" className="tt-pst-in" value={fA} onChange={(e) => setFA(e.target.value)} placeholder="S/ Reg" />
                      <input type="number" className="tt-pst-in" value={fB} onChange={(e) => setFB(e.target.value)} placeholder="S/ VIP" />
                      <input type="number" className="tt-pst-in" value={fC} onChange={(e) => setFC(e.target.value)} placeholder="Cupos" />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">Crear Grupo</button>
                  </form>
                )}

                <div className="tt-pst-list">
                  {(coachDraft.groups || []).map((g) => {
                    const used = Number(g.spotsUsed ?? g.spotsFilled) || 0;
                    const max = Number(g.spotsTotal ?? g.spotsMax) || 4;
                    const step = (d) =>
                      saveCoach({
                        ...coachDraft,
                        groups: (coachDraft.groups || []).map((x) =>
                          x.id === g.id ? { ...x, spotsUsed: Math.max(0, Math.min(max, used + d)) } : x
                        ),
                      });
                    return (
                      <div key={g.id} className="tt-pst-item is-col">
                        <div className="tt-pst-row" style={{ width: '100%', justifyContent: 'space-between' }}>
                          <div style={{ minWidth: 0 }}>
                            <span className="tt-pst-mk">
                              {g.day} {g.time ? `· ${g.time}` : ''} · {levelLabel(g.level)} · {ageLabel(g.ageGroup)}
                            </span>
                            <strong>{g.label}</strong>
                          </div>
                          <div className="tt-pst-row">
                            <button type="button" className="tt-step" disabled={used <= 0} onClick={() => step(-1)}>−</button>
                            <b style={{ fontSize: '0.82rem' }}>{used}/{max}</b>
                            <button type="button" className="tt-step is-plus" disabled={used >= max} onClick={() => step(1)}>+</button>
                            <button
                              type="button"
                              className="tt-pst-del"
                              onClick={() =>
                                saveCoach({
                                  ...coachDraft,
                                  groups: (coachDraft.groups || []).filter((x) => x.id !== g.id),
                                })
                              }
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {coachTab === 'alumnos' && (
              <div className="tt-pst-sec">
                <div className="tt-pst-head">
                  <div><span className="tt-pst-mk">PADRÓN PRIVADO</span><h3>Alumnos ({(coachDraft.students || []).length})</h3></div>
                  <button type="button" className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press" onClick={() => toggleForm('st', { sub: '5ª B' })}>
                    {openForm === 'st' ? 'Cerrar' : '+ Alumno'}
                  </button>
                </div>

                {openForm === 'st' && (
                  <form
                    className="tt-pst-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (fTitle.trim().length < 3) return;
                      saveCoach(
                        {
                          ...coachDraft,
                          students: [
                            {
                              id: `st-${Date.now()}`,
                              name: fTitle.trim(),
                              level: fSub || '5ª B',
                              groupName: coachDraft.groups?.[0]?.label || 'Particular',
                              whatsapp: fA.replace(/\D/g, ''),
                              feeStatus: 'AL_DIA',
                              attendedToday: true,
                            },
                            ...(coachDraft.students || []),
                          ],
                        },
                        'Alumno agregado.'
                      );
                      setOpenForm(null);
                    }}
                  >
                    <input className="tt-pst-in" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Nombre completo" required />
                    <div className="tt-pst-g2">
                      <select className="tt-pst-in" value={fSub} onChange={(e) => setFSub(e.target.value)}>
                        {['5ª P', '5ª B', '5ª A', '4ª Cat.', '3ª Cat.'].map((lv) => (
                          <option key={lv} value={lv}>{lv}</option>
                        ))}
                      </select>
                      <input type="tel" className="tt-pst-in" value={fA} onChange={(e) => setFA(e.target.value)} placeholder="Celular 9 dígitos" />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">Guardar Alumno</button>
                  </form>
                )}

                <div className="tt-pst-list">
                  {(coachDraft.students || []).map((st) => {
                    const toggleSt = (k) =>
                      saveCoach({
                        ...coachDraft,
                        students: (coachDraft.students || []).map((x) =>
                          x.id !== st.id
                            ? x
                            : k === 'att'
                            ? { ...x, attendedToday: !x.attendedToday }
                            : { ...x, feeStatus: x.feeStatus === 'AL_DIA' ? 'PENDIENTE' : 'AL_DIA' }
                        ),
                      });
                    return (
                      <div key={st.id} className="tt-pst-item">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{st.name} · <span style={{ color: '#00DC7D' }}>{st.level}</span></strong>
                          <small>{st.groupName}</small>
                        </div>
                        <div className="tt-pst-row">
                          <button type="button" className={`tt-st-pill ${st.attendedToday ? 'is-ok' : ''}`} onClick={() => toggleSt('att')}>
                            {st.attendedToday ? '✓ Hoy' : 'Asist.'}
                          </button>
                          <button type="button" className={`tt-st-pill ${st.feeStatus === 'AL_DIA' ? 'is-ok' : 'is-due'}`} onClick={() => toggleSt('fee')}>
                            {st.feeStatus === 'AL_DIA' ? 'Al día' : 'Pend.'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {coachTab === 'marca' && (
              <div className="tt-pst-sec">
                {/* IDENTIDAD SEPARADA: FOTO DE PERFIL + FONDO / PORTADA */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mk">IDENTIDAD VISUAL (PERFIL Y PORTADA SEPARADOS)</span>
                  <div className="tt-pst-g2">
                    <div className="tt-media-slot-box">
                      <SmartImage
                        src={coachDraft.photoUrl}
                        alt={coachDraft.name}
                        style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: `2px solid ${coachDraft.accent || '#00DC7D'}` }}
                      />
                      <strong>Foto de Perfil</strong>
                      <input
                        ref={coachPhotoRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          uploadPhoto(e, 'coaches', `${coachDraft.id}-avatar`, (url) =>
                            saveCoach({ ...coachDraft, photoUrl: url, photo: url }, 'Foto de perfil actualizada.')
                          )
                        }
                      />
                      <button type="button" disabled={uploading} className="tt-btn tt-btn-ghost tt-btn-sm tt-pst-press" onClick={() => coachPhotoRef.current?.click()}>
                        <TTIcon name="camera" size={13} /> {uploading ? '...' : 'Subir retrato'}
                      </button>
                    </div>

                    <div className="tt-media-slot-box">
                      <SmartImage
                        src={coachDraft.coverUrl || coachDraft.photoUrl}
                        alt="Portada"
                        style={{ width: '100%', height: 58, borderRadius: 11, objectFit: 'cover' }}
                      />
                      <strong>Fondo / Portada</strong>
                      <input
                        ref={coachCoverRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          uploadPhoto(e, 'coaches', `${coachDraft.id}-cover`, (url) =>
                            saveCoach({ ...coachDraft, coverUrl: url }, 'Portada de cancha actualizada.')
                          )
                        }
                      />
                      <button type="button" disabled={uploading} className="tt-btn tt-btn-ghost tt-btn-sm tt-pst-press" onClick={() => coachCoverRef.current?.click()}>
                        <TTIcon name="camera" size={13} /> {uploading ? '...' : 'Subir portada'}
                      </button>
                    </div>
                  </div>

                  <div className="tt-chips-wrap">
                    {COACH_THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`tt-sw-pill tt-pst-press ${coachDraft.accentTheme === t.id ? 'is-on' : ''}`}
                        onClick={() => saveCoach({ ...coachDraft, accentTheme: t.id, accent: t.hex })}
                      >
                        <i style={{ background: t.hex }} /> {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="tt-chips-wrap">
                    {SPECIALTIES.map((sp) => {
                      const on = (coachDraft.specialties || []).includes(sp);
                      return (
                        <button
                          key={sp}
                          type="button"
                          className={`tt-spec-pill ${on ? 'is-on' : ''}`}
                          onClick={() => {
                            const cur = coachDraft.specialties || [];
                            saveCoach({ ...coachDraft, specialties: on ? cur.filter((x) => x !== sp) : [...cur.slice(-3), sp] });
                          }}
                        >
                          {sp}
                        </button>
                      );
                    })}
                  </div>

                  <div className="tt-pst-g2">
                    <input className="tt-pst-in" value={coachDraft.title || ''} onChange={(e) => setCoachDraft((p) => ({ ...p, title: e.target.value, role: e.target.value }))} placeholder="Título corto" />
                    <input type="tel" className="tt-pst-in" value={coachDraft.whatsapp || ''} onChange={(e) => setCoachDraft((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp" />
                  </div>
                  <textarea rows={2} className="tt-pst-in" value={coachDraft.bio || ''} onChange={(e) => setCoachDraft((p) => ({ ...p, bio: e.target.value }))} placeholder="Presentación corta en tu ficha" />
                  <button type="button" className="tt-btn tt-btn-primary tt-pst-press" onClick={() => saveCoach(coachDraft, 'Perfil de Coach guardado en vivo.')}>
                    Guardar Mi Marca
                  </button>
                </div>

                {/* Galería de Fotos del Coach (Supabase Storage) */}
                <div className="tt-pst-card">
                  <div className="tt-pst-head">
                    <div><span className="tt-pst-mk">GALERÍA EN CANCHA</span><h3>Fotos ({(coachDraft.gallery || []).length}/8)</h3></div>
                    <input
                      ref={coachGalRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) =>
                        uploadPhoto(e, 'coaches', `${coachDraft.id}-g`, (url) =>
                          saveCoach(
                            { ...coachDraft, gallery: [{ id: `cog-${Date.now()}`, url, caption: coachDraft.name }, ...(coachDraft.gallery || [])].slice(0, 8) },
                            'Foto agregada a tu galería.'
                          )
                        )
                      }
                    />
                    <button type="button" disabled={uploading || (coachDraft.gallery || []).length >= 8} className="tt-btn tt-btn-ghost tt-btn-sm" onClick={() => coachGalRef.current?.click()}>
                      + Foto
                    </button>
                  </div>
                  <div className="tt-gal-grid">
                    {(coachDraft.gallery || []).map((g, i) => (
                      <div key={g.id || i} className="tt-gal-item">
                        <SmartImage src={g.url || g.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => saveCoach({ ...coachDraft, gallery: (coachDraft.gallery || []).filter((_, idx) => idx !== i) })}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Videos R2 + Tips Escritos Rápidos */}
                <div className="tt-pst-card">
                  <div className="tt-pst-head">
                    <div>
                      <span className="tt-pst-mk">VIDEOS R2 ({coachVideoCount}/{VIDEO_QUOTAS.COACH.maxCount}) + TIPS ESCRITOS</span>
                      <h3>Tips & Masterclasses</h3>
                    </div>
                    <div className="tt-pst-row">
                      <button
                        type="button"
                        className="tt-btn tt-btn-ghost tt-btn-sm tt-pst-press"
                        onClick={() => toggleForm('tip')}
                      >
                        {openForm === 'tip' ? 'Cerrar' : '+ Tip escrito'}
                      </button>
                      <button
                        type="button"
                        disabled={videoPct !== null}
                        className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press"
                        onClick={() => toggleForm('vid', { a: '40' })}
                      >
                        {openForm === 'vid' ? 'Cerrar' : '+ Video'}
                      </button>
                    </div>
                  </div>

                  {openForm === 'tip' && (
                    <form
                      className="tt-pst-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (fTitle.trim().length < 4 || fSub.trim().length < 8) return;
                        const newTip = {
                          id: `tip-${Date.now()}`,
                          title: fTitle.trim(),
                          summary: fSub.trim(),
                          isTextTip: true,
                          isFree: true,
                          gemsCost: 0,
                          duration: 'Lectura 15s',
                          active: true,
                        };
                        saveCoach({ ...coachDraft, videos: [newTip, ...(coachDraft.videos || [])] }, 'Tip escrito publicado.');
                        setOpenForm(null);
                      }}
                    >
                      <input className="tt-pst-in" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Título del tip (ej. Cómo restar saques rápidos en arcilla)" required />
                      <textarea rows={2} className="tt-pst-in" value={fSub} onChange={(e) => setFSub(e.target.value)} placeholder="Consejo práctico en 2 líneas..." required />
                      <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">Publicar Tip</button>
                    </form>
                  )}

                  {openForm === 'vid' && (
                    <div className="tt-pst-form">
                      <input className="tt-pst-in" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Título del video (ej. 2º saque con efecto)" />
                      <div className="tt-pst-g2">
                        <button type="button" className={`tt-qs-pill ${fFlag ? 'is-on' : ''}`} onClick={() => setFFlag((v) => !v)}>
                          {fFlag ? `Masterclass (${fA} 💎)` : 'Tip Gratis'}
                        </button>
                        {fFlag && <input type="number" className="tt-pst-in" value={fA} onChange={(e) => setFA(e.target.value)} placeholder="Gemas" />}
                      </div>

                      <input
                        ref={coachVidRef}
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        style={{ display: 'none' }}
                        onChange={handleCoachVideoFile}
                      />
                      <button
                        type="button"
                        disabled={videoPct !== null || coachVideoCount >= VIDEO_QUOTAS.COACH.maxCount}
                        className="tt-btn tt-btn-primary tt-pst-press"
                        onClick={() => coachVidRef.current?.click()}
                      >
                        <TTIcon name="video" size={16} />
                        {videoPct !== null ? `Subiendo video... ${videoPct}%` : 'Elegir Video del Celular (MP4 / MOV)'}
                      </button>

                      {videoPct !== null && (
                        <div className="tt-up-bar"><div style={{ width: `${videoPct}%` }} /></div>
                      )}
                    </div>
                  )}

                  <div className="tt-pst-list">
                    {(coachDraft.videos || []).map((v) => (
                      <div key={v.id} className="tt-pst-item">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{v.title}</strong>
                          <small>
                            {v.isTextTip
                              ? 'Tip escrito gratis'
                              : `${v.duration || '0:45'} · ${v.gemsCost > 0 ? `Masterclass · ${v.gemsCost} 💎` : 'Video Tip Gratis'}`}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="tt-pst-del"
                          onClick={async () => {
                            await deleteVideoFromR2(v.r2Key);
                            saveCoach({ ...coachDraft, videos: (coachDraft.videos || []).filter((x) => x.id !== v.id) }, 'Contenido eliminado.');
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== MODO B: CLUB ALIADO ==================== */}
        {role === 'CLUB' && (
          <>
            <div className="tt-pst-sel-row">
              {(clubs || INITIAL_CLUBS).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`tt-pst-sel-chip tt-pst-press ${clubId === c.id ? 'is-on' : ''}`}
                  onClick={() => { triggerHaptic('light'); setClubId(c.id); }}
                >
                  {c.shortName}
                </button>
              ))}
            </div>

            <div className="tt-pst-tabs">
              <span className="tt-pst-slider is-gold" style={{ transform: `translateX(${Math.max(0, clIdx) * 100}%)` }} />
              {[
                { id: 'estado', l: 'Club & Horas' },
                { id: 'vitrina', l: 'Vitrina & Media' },
                { id: 'promos', l: 'Promos' },
                { id: 'validar', l: 'Validar VIP' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tt-pst-tab is-gold ${clubTab === t.id ? 'is-active' : ''}`}
                  onClick={() => { triggerHaptic('light'); setOpenForm(null); setClubTab(t.id); }}
                >
                  {t.l}
                </button>
              ))}
            </div>

            {clubTab === 'estado' && (
              <div className="tt-pst-sec">
                {/* CONFIRMAR DISPONIBILIDAD DE HOY EN 1 TOQUE */}
                <div className="tt-pst-fresh-cta-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="tt-pst-mk">RECEPCIÓN EN VIVO</span>
                    <strong>¿Canchas libres hoy?</strong>
                    <small>Publica franjas libres en 1 toque con sello «Actualizado hoy».</small>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press"
                    onClick={() => saveClub(clubDraft, 'Disponibilidad del club actualizada hoy.')}
                  >
                    ✓ Confirmar hoy
                  </button>
                </div>

                <div className="tt-pst-card">
                  <span className="tt-pst-mk">HORAS LIBRES DE CANCHA HOY</span>
                  <div className="tt-qs-grid">
                    {CLUB_QUICK_HOURS.map((s) => (
                      <button
                        key={s || 'full-cl'}
                        type="button"
                        className={`tt-qs-pill tt-pst-press ${(clubDraft.freeHoursToday || '') === s ? 'is-on' : ''}`}
                        onClick={() => {
                          triggerHaptic('medium');
                          saveClub(
                            { ...clubDraft, freeHoursToday: s },
                            s ? `Horas libres publicadas: ${s}` : 'Sin franjas destacadas hoy.'
                          );
                        }}
                      >
                        {s || 'Sin aviso hoy'}
                      </button>
                    ))}
                  </div>
                  <div className="tt-pst-row">
                    <input
                      className="tt-pst-in"
                      value={clubDraft.freeHoursToday || ''}
                      onChange={(e) => setClubDraft((p) => ({ ...p, freeHoursToday: e.target.value }))}
                      placeholder="Ej. Cancha 2 libre hoy 5:00 p. m. y 8:00 p. m."
                    />
                    <button type="button" className="tt-btn tt-btn-primary tt-btn-sm" onClick={() => saveClub(clubDraft, 'Horas libres publicadas.')}>
                      Publicar
                    </button>
                  </div>
                </div>

                <div className="tt-pst-card">
                  <span className="tt-pst-mk">CLIMA EN VIVO DESDE RECEPCIÓN</span>
                  <div className="tt-pst-g4">
                    {WEATHER_OPTS.map((w) => {
                      const on = clubDraft.climaBase?.conditionKey === w.key;
                      return (
                        <button
                          key={w.key}
                          type="button"
                          className={`tt-wq-btn tt-pst-press ${on ? 'is-on' : ''}`}
                          style={on ? { borderColor: w.color, color: w.color } : undefined}
                          onClick={() => {
                            triggerHaptic('success');
                            if (onUpdateClubWeather) onUpdateClubWeather({ clubId: clubDraft.id, conditionKey: w.key });
                            saveClub(
                              { ...clubDraft, climaBase: { ...(clubDraft.climaBase || {}), conditionKey: w.key } },
                              `Clima en ${clubDraft.shortName}: ${w.label}.`
                            );
                          }}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* IDENTIDAD VISUAL DEL CLUB (LOGO + PORTADA SEPARADOS) */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mk">IDENTIDAD VISUAL (LOGO Y PORTADA SEPARADOS)</span>
                  <div className="tt-pst-g2">
                    <div className="tt-media-slot-box">
                      <SmartImage
                        src={clubDraft.logoUrl}
                        alt={clubDraft.shortName}
                        style={{ width: 54, height: 54, borderRadius: 14, objectFit: 'cover', background: '#FFFFFF' }}
                      />
                      <strong>Logo / Escudo</strong>
                      <input
                        ref={clubLogoRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          uploadPhoto(e, 'clubs', `${clubDraft.id}-logo`, (url) =>
                            saveClub({ ...clubDraft, logoUrl: url, logo: url }, 'Logo del club actualizado.')
                          )
                        }
                      />
                      <button type="button" disabled={uploading} className="tt-btn tt-btn-ghost tt-btn-sm" onClick={() => clubLogoRef.current?.click()}>
                        <TTIcon name="camera" size={13} /> {uploading ? '...' : 'Cambiar logo'}
                      </button>
                    </div>

                    <div className="tt-media-slot-box">
                      <SmartImage
                        src={clubDraft.coverUrl}
                        alt="Portada club"
                        style={{ width: '100%', height: 54, borderRadius: 11, objectFit: 'cover' }}
                      />
                      <strong>Foto de Portada</strong>
                      <input
                        ref={clubCoverRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          uploadPhoto(e, 'clubs', `${clubDraft.id}-cover`, (url) =>
                            saveClub({ ...clubDraft, coverUrl: url, cover: url }, 'Portada del club actualizada.')
                          )
                        }
                      />
                      <button type="button" disabled={uploading} className="tt-btn tt-btn-ghost tt-btn-sm" onClick={() => clubCoverRef.current?.click()}>
                        <TTIcon name="camera" size={13} /> {uploading ? '...' : 'Cambiar portada'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="tt-pst-card">
                  <span className="tt-pst-mk">WEB EXTERNA DE RESERVAS + TARIFAS</span>
                  <input
                    type="url"
                    className="tt-pst-in"
                    value={clubDraft.rates?.bookingUrl || ''}
                    onChange={(e) => setClubDraft((p) => ({ ...p, bookingUrl: e.target.value, rates: { ...p.rates, bookingUrl: e.target.value } }))}
                    placeholder="URL de reservas del club (ej. https://reservas.tuclub.pe)"
                  />
                  <div className="tt-pst-g2">
                    <input type="tel" className="tt-pst-in" value={clubDraft.whatsapp || ''} onChange={(e) => setClubDraft((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp del club" />
                    <input className="tt-pst-in" value={clubDraft.hours || ''} onChange={(e) => setClubDraft((p) => ({ ...p, hours: e.target.value }))} placeholder="Horario de atención" />
                  </div>
                  <div className="tt-pst-g2">
                    <label className="tt-pst-lbl">Día Regular (S/)
                      <input type="number" className="tt-pst-in" value={clubDraft.rates?.diaRegular || 32} onChange={(e) => setClubDraft((p) => ({ ...p, dayRate: Number(e.target.value) || 0, rates: { ...p.rates, diaRegular: Number(e.target.value) || 0 } }))} />
                    </label>
                    <label className="tt-pst-lbl">Día VIP (S/)
                      <input type="number" className="tt-pst-in" value={clubDraft.rates?.diaVip || 24} onChange={(e) => setClubDraft((p) => ({ ...p, vipDayRate: Number(e.target.value) || 0, rates: { ...p.rates, diaVip: Number(e.target.value) || 0 } }))} />
                    </label>
                    <label className="tt-pst-lbl">Noche LED (S/)
                      <input type="number" className="tt-pst-in" value={clubDraft.rates?.nocheRegular || 42} onChange={(e) => setClubDraft((p) => ({ ...p, nightRate: Number(e.target.value) || 0, rates: { ...p.rates, nocheRegular: Number(e.target.value) || 0 } }))} />
                    </label>
                    <label className="tt-pst-lbl">Noche VIP (S/)
                      <input type="number" className="tt-pst-in" value={clubDraft.rates?.nocheVip || 34} onChange={(e) => setClubDraft((p) => ({ ...p, vipNightRate: Number(e.target.value) || 0, rates: { ...p.rates, nocheVip: Number(e.target.value) || 0 } }))} />
                    </label>
                  </div>
                  <button type="button" className="tt-btn tt-btn-primary tt-pst-press" onClick={() => saveClub(clubDraft, `Configuración de ${clubDraft.shortName} guardada.`)}>
                    Guardar Configuración
                  </button>
                </div>
              </div>
            )}

            {clubTab === 'vitrina' && (
              <div className="tt-pst-sec">
                {/* VITRINA CON FOTOS REALES DEL CLUB (AGUA, ALIMENTOS, ALQUILER, PELOTAS, ENCORDADO) */}
                <div className="tt-pst-card">
                  <div className="tt-pst-head">
                    <div>
                      <span className="tt-pst-mk">ALIMENTOS · BEBIDAS · ALQUILER · TIENDA EN SEDE</span>
                      <h3>Vitrina del Club ({(clubDraft.services || []).length})</h3>
                    </div>
                    <button
                      type="button"
                      className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press"
                      onClick={() => toggleForm('srv', { a: '10', b: '8', category: 'bebidas' })}
                    >
                      {openForm === 'srv' ? 'Cerrar' : '+ Producto / Servicio'}
                    </button>
                  </div>

                  {openForm === 'srv' && (
                    <form
                      className="tt-pst-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (fTitle.trim().length < 2) return;
                        const newSrv = {
                          id: `srv-${Date.now()}`,
                          category: fCategory,
                          title: fTitle.trim(),
                          desc: fSub.trim() || 'Disponible en recepción',
                          price: Number(fA) || 0,
                          vipPrice: Number(fB) || 0,
                          photoUrl: fPhotoUrl,
                          available: true,
                        };
                        saveClub(
                          { ...clubDraft, services: [newSrv, ...(clubDraft.services || [])] },
                          'Producto/servicio publicado en tu vitrina.'
                        );
                        setOpenForm(null);
                      }}
                    >
                      <div className="tt-chips-wrap">
                        {CLUB_SHOWCASE_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className={`tt-spec-pill ${fCategory === cat.id ? 'is-on' : ''}`}
                            onClick={() => setFCategory(cat.id)}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      <input className="tt-pst-in" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Ej. Gatorade 500 ml / Alquiler Raqueta / Sandwich de pollo" required />
                      <input className="tt-pst-in" value={fSub} onChange={(e) => setFSub(e.target.value)} placeholder="Descripción corta (ej. frío en barra, incluye 3 pelotas)" />
                      <div className="tt-pst-g2">
                        <input type="number" className="tt-pst-in" value={fA} onChange={(e) => setFA(e.target.value)} placeholder="S/ Regular" />
                        <input type="number" className="tt-pst-in" value={fB} onChange={(e) => setFB(e.target.value)} placeholder="S/ Socio VIP (opcional)" />
                      </div>
                      <div className="tt-pst-row">
                        <input
                          ref={itemPhotoRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) =>
                            uploadPhoto(e, 'clubs', `${clubDraft.id}-srv`, (url) => setFPhotoUrl(url))
                          }
                        />
                        <button
                          type="button"
                          disabled={uploading}
                          className="tt-btn tt-btn-ghost tt-btn-sm"
                          onClick={() => itemPhotoRef.current?.click()}
                        >
                          <TTIcon name="camera" size={14} />{' '}
                          {uploading ? 'Subiendo...' : fPhotoUrl ? '✓ Foto lista' : '+ Subir foto real'}
                        </button>
                        {fPhotoUrl && (
                          <SmartImage src={fPhotoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                        )}
                      </div>
                      <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">Guardar en Vitrina</button>
                    </form>
                  )}

                  <div className="tt-pst-list">
                    {(clubDraft.services || []).map((srv) => (
                      <div key={srv.id} className="tt-pst-item">
                        {srv.photoUrl && (
                          <SmartImage
                            src={srv.photoUrl}
                            alt={srv.title}
                            style={{ width: 46, height: 46, borderRadius: 11, objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span className="tt-pst-mk">{srvCatLabel(srv.category)}</span>
                          <strong>{srv.title}</strong>
                          <small>
                            {srv.price > 0 ? `S/ ${srv.price}` : 'Consultar'}
                            {srv.vipPrice > 0 ? ` · VIP S/ ${srv.vipPrice}` : ''}
                            {srv.desc ? ` · ${srv.desc}` : ''}
                          </small>
                        </div>
                        <div className="tt-pst-row">
                          <button
                            type="button"
                            className={`tt-st-pill ${srv.available !== false ? 'is-ok' : 'is-full'}`}
                            onClick={() =>
                              saveClub({
                                ...clubDraft,
                                services: (clubDraft.services || []).map((x) =>
                                  x.id === srv.id ? { ...x, available: x.available === false } : x
                                ),
                              })
                            }
                          >
                            {srv.available !== false ? 'Stock' : 'Agotado'}
                          </button>
                          <button
                            type="button"
                            className="tt-pst-del"
                            onClick={() =>
                              saveClub({
                                ...clubDraft,
                                services: (clubDraft.services || []).filter((x) => x.id !== srv.id),
                              })
                            }
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Galería de Fotos del Club */}
                <div className="tt-pst-card">
                  <div className="tt-pst-head">
                    <div><span className="tt-pst-mk">CARRUSEL DE SEDE</span><h3>Fotos ({(clubDraft.gallery || []).length}/8)</h3></div>
                    <input
                      ref={clubPhotoRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) =>
                        uploadPhoto(e, 'clubs', clubDraft.id, (url) => {
                          const nextGal = [
                            { id: `cg-${Date.now()}`, url, image: url, title: clubDraft.shortName, caption: clubDraft.shortName },
                            ...(clubDraft.gallery || []),
                          ].slice(0, 8);
                          return saveClub({ ...clubDraft, gallery: nextGal }, 'Foto agregada al carrusel.');
                        })
                      }
                    />
                    <button type="button" disabled={uploading || (clubDraft.gallery || []).length >= 8} className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press" onClick={() => clubPhotoRef.current?.click()}>
                      <TTIcon name="camera" size={14} /> {uploading ? 'Subiendo...' : '+ Foto'}
                    </button>
                  </div>

                  <div className="tt-gal-grid">
                    {(clubDraft.gallery || []).map((g) => (
                      <div key={g.id} className="tt-gal-item">
                        <SmartImage src={g.url || g.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => saveClub({ ...clubDraft, gallery: (clubDraft.gallery || []).filter((x) => x.id !== g.id) })}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Tours / Trailers del Club -> Cloudflare R2 */}
                <div className="tt-pst-card">
                  <div className="tt-pst-head">
                    <div>
                      <span className="tt-pst-mk">VIDEO TOUR DIRECTO R2 · MÁX. {VIDEO_QUOTAS.CLUB.maxMB} MB · {VIDEO_QUOTAS.CLUB.maxSec}S</span>
                      <h3>Trailers ({(clubDraft.videos || []).length}/{VIDEO_QUOTAS.CLUB.maxCount})</h3>
                    </div>
                  </div>

                  <div className="tt-pst-row">
                    <input
                      className="tt-pst-in"
                      value={clubVidTitle}
                      onChange={(e) => setClubVidTitle(e.target.value)}
                      placeholder="Título (ej. Recorrido Cancha Central LED)"
                    />
                    <input
                      ref={clubVidRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      style={{ display: 'none' }}
                      onChange={handleClubVideoFile}
                    />
                    <button
                      type="button"
                      disabled={videoPct !== null || (clubDraft.videos || []).length >= VIDEO_QUOTAS.CLUB.maxCount}
                      className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => clubVidRef.current?.click()}
                    >
                      <TTIcon name="video" size={14} /> {videoPct !== null ? `${videoPct}%` : '+ Video'}
                    </button>
                  </div>

                  {videoPct !== null && (
                    <div className="tt-up-bar"><div style={{ width: `${videoPct}%` }} /></div>
                  )}

                  <div className="tt-pst-list">
                    {(clubDraft.videos || []).map((v) => (
                      <div key={v.id} className="tt-pst-item">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{v.title}</strong>
                          <small>{v.duration || '0:30'} · Visible en Video Tour</small>
                        </div>
                        <button
                          type="button"
                          className="tt-pst-del"
                          onClick={async () => {
                            await deleteVideoFromR2(v.r2Key);
                            saveClub({ ...clubDraft, videos: (clubDraft.videos || []).filter((x) => x.id !== v.id) }, 'Trailer eliminado.');
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beneficios VIP Golden Ticket */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mk">GOLDEN TICKET · BENEFICIOS VIP (CARNET DIGITAL 3D)</span>
                  <div className="tt-pst-list">
                    {(clubDraft.vipBenefits || []).map((b, i) => (
                      <div key={i} className="tt-pst-item">
                        <span style={{ fontSize: '0.76rem' }}>{b}</span>
                        <button type="button" className="tt-pst-del" onClick={() => saveClub({ ...clubDraft, vipBenefits: (clubDraft.vipBenefits || []).filter((_, idx) => idx !== i) })}>✕</button>
                      </div>
                    ))}
                  </div>
                  <form
                    className="tt-pst-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newBenefit.trim().length < 4) return;
                      saveClub({ ...clubDraft, vipBenefits: [...(clubDraft.vipBenefits || []), newBenefit.trim()] }, 'Beneficio VIP agregado.');
                      setNewBenefit('');
                    }}
                  >
                    <input className="tt-pst-in" value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} placeholder="Nuevo beneficio VIP en sede..." />
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">Añadir</button>
                  </form>
                </div>
              </div>
            )}

            {clubTab === 'promos' && (
              <div className="tt-pst-sec">
                <div className="tt-pst-head">
                  <div><span className="tt-pst-mk">HORAS VALLE</span><h3>Promociones</h3></div>
                  <button type="button" className="tt-btn tt-btn-primary tt-btn-sm" onClick={() => toggleForm('promo', { sub: 'Lun–Vie · 10 a. m. – 2 p. m.', a: 'S/ 22 / hora' })}>
                    {openForm === 'promo' ? 'Cerrar' : '+ Promo'}
                  </button>
                </div>

                {openForm === 'promo' && (
                  <form
                    className="tt-pst-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (fTitle.trim().length < 4) return;
                      saveClub(
                        {
                          ...clubDraft,
                          promos: [
                            { id: `pr-${Date.now()}`, tag: 'HORAS VALLE', title: fTitle.trim(), schedule: fSub.trim(), priceText: fA.trim(), priceNote: fA.trim(), photoUrl: fPhotoUrl, active: true },
                            ...(clubDraft.promos || []),
                          ],
                        },
                        'Promoción publicada.'
                      );
                      setOpenForm(null);
                    }}
                  >
                    <input className="tt-pst-in" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Título (ej. Mañanas -20%)" required />
                    <input className="tt-pst-in" value={fSub} onChange={(e) => setFSub(e.target.value)} placeholder="Horario" />
                    <input className="tt-pst-in" value={fA} onChange={(e) => setFA(e.target.value)} placeholder="Tarifa (ej. S/ 22 / hora)" />
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">Publicar Promo</button>
                  </form>
                )}

                <div className="tt-pst-list">
                  {(clubDraft.promos || []).map((pr) => (
                    <div key={pr.id} className="tt-pst-item">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{pr.title}</strong>
                        <small>{pr.schedule} · {pr.priceText || pr.priceNote}</small>
                      </div>
                      <button type="button" className="tt-pst-del" onClick={() => saveClub({ ...clubDraft, promos: (clubDraft.promos || []).filter((x) => x.id !== pr.id) })}>✕</button>
                    </div>
                  ))}
                </div>

                <div className="tt-pst-head" style={{ marginTop: 4 }}>
                  <div><span className="tt-pst-mk">COMUNIDAD</span><h3>Eventos del Club</h3></div>
                  <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={() => toggleForm('ev', { sub: 'Viernes · 7 p. m.', a: '30', b: '12' })}>
                    {openForm === 'ev' ? 'Cerrar' : '+ Evento'}
                  </button>
                </div>

                {openForm === 'ev' && (
                  <form
                    className="tt-pst-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (fTitle.trim().length < 4) return;
                      saveClub(
                        {
                          ...clubDraft,
                          internalEvents: [
                            { id: `ev-${Date.now()}`, title: fTitle.trim(), date: fSub.trim(), dateLabel: fSub.trim(), fee: `S/ ${Number(fA) || 30}`, spotsUsed: 1, spotsTotal: Math.max(4, Number(fB) || 12) },
                            ...(clubDraft.internalEvents || []),
                          ],
                        },
                        'Evento interno publicado.'
                      );
                      setOpenForm(null);
                    }}
                  >
                    <input className="tt-pst-in" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Nombre (ej. Americano Nocturno)" required />
                    <div className="tt-pst-g3">
                      <input className="tt-pst-in" value={fSub} onChange={(e) => setFSub(e.target.value)} placeholder="Día y hora" />
                      <input type="number" className="tt-pst-in" value={fA} onChange={(e) => setFA(e.target.value)} placeholder="S/ Cuota" />
                      <input type="number" className="tt-pst-in" value={fB} onChange={(e) => setFB(e.target.value)} placeholder="Cupos" />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">Publicar Evento</button>
                  </form>
                )}

                <div className="tt-pst-list">
                  {(clubDraft.internalEvents || []).map((ev) => (
                    <div key={ev.id} className="tt-pst-item">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="tt-pst-mk">{ev.date || ev.dateLabel}</span>
                        <strong>{ev.title}</strong>
                        <small>{ev.fee} · {ev.spots || `${ev.spotsUsed}/${ev.spotsTotal} cupos`}</small>
                      </div>
                      <button type="button" className="tt-pst-del" onClick={() => saveClub({ ...clubDraft, internalEvents: (clubDraft.internalEvents || []).filter((x) => x.id !== ev.id) })}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clubTab === 'validar' && (
              <div className="tt-pst-sec">
                <div className="tt-pst-card">
                  <span className="tt-pst-mk">RECEPCIÓN · VERIFICACIÓN INSTANTÁNEA</span>
                  <h3>Validar Carnet Socio VIP</h3>
                  <input type="search" className="tt-pst-in" value={vipSearch} onChange={(e) => setVipSearch(e.target.value)} placeholder="Nombre, código TT-2026 o celular..." />
                  {vipSearch.trim().length > 0 && (
                    <div className="tt-pst-list">
                      {vipMatches.length === 0 ? (
                        <small className="tt-muted">Sin coincidencias.</small>
                      ) : (
                        vipMatches.map((p) => (
                          <div key={p.id} className="tt-pst-item">
                            <SmartImage src={p.avatar} alt={p.name} initials={p.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong>{p.name}</strong>
                              <small>{p.credentialId || 'Socio'} · {getCategoryByPoints(p.points).name}</small>
                            </div>
                            <span className={`tt-val-pill ${p.isVip ? 'is-vip' : ''}`}>
                              {p.isVip ? '✓ VIP ACTIVO' : 'ESTÁNDAR'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .tt-ps-studio { display: flex; flex-direction: column; gap: 13px; }
        .tt-pst-press { transition: transform 160ms cubic-bezier(0.22, 1.38, 0.36, 1) !important; }
        .tt-pst-press:active { transform: scale(0.95) !important; }

        .tt-pst-hero {
          border-radius: 20px; padding: 14px;
          background: linear-gradient(135deg, #24093F 0%, #130322 100%);
          color: #FAF9F5; border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 12px 24px rgba(8, 1, 18, 0.34);
          display: flex; flex-direction: column; gap: 11px;
        }
        .tt-pst-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .tt-pst-kicker { font-size: 0.58rem; font-weight: 900; letter-spacing: 0.1em; color: #00DC7D; }
        .tt-pst-fresh-line { display: block; margin-top: 3px; font-size: 0.69rem; color: #7CF5C0; font-weight: 700; }
        .tt-sync-pill { padding: 2px 8px; border-radius: 999px; background: rgba(0, 220, 125, 0.14); color: #7CF5C0; font-size: 0.6rem; font-weight: 800; }
        .tt-sync-pill.is-saving { background: rgba(229, 193, 108, 0.2); color: #F3DC9B; }
        .tt-sync-pill.is-error { background: rgba(248, 113, 113, 0.2); color: #FCA5A5; }
        .tt-pst-hero h2 { margin: 2px 0 0; font-family: var(--tt-font-display); font-size: 1.4rem; line-height: 1.05; }
        .tt-pst-role-switch { display: inline-flex; padding: 3px; border-radius: 999px; background: rgba(255, 255, 255, 0.12); }
        .tt-pst-role-switch button { padding: 5px 12px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; color: rgba(255, 255, 255, 0.78); }
        .tt-pst-role-switch button.is-active { background: #FAF9F5; color: #1E0734; font-weight: 900; }
        .tt-pst-kpi-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tt-pst-kpi-strip > div { padding: 8px 6px; border-radius: 13px; background: rgba(255, 255, 255, 0.08); text-align: center; }
        .tt-pst-kpi-strip span { display: block; font-size: 0.56rem; font-weight: 800; opacity: 0.74; }
        .tt-pst-kpi-strip strong { font-family: var(--tt-font-display); font-size: 1.24rem; }
        .tt-pst-kpi-strip .is-emerald strong { color: #00DC7D; }

        .tt-pst-fresh-cta-card {
          padding: 13px; border-radius: 17px;
          background: linear-gradient(135deg, rgba(0, 220, 125, 0.14) 0%, var(--tt-surface-2) 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.44);
          display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
        }
        .tt-pst-fresh-cta-card strong { display: block; font-size: 0.88rem; }
        .tt-pst-fresh-cta-card small { display: block; font-size: 0.72rem; color: var(--tt-text-muted); margin-top: 2px; line-height: 1.35; }

        .tt-pst-sel-row { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
        .tt-pst-sel-row::-webkit-scrollbar { display: none; }
        .tt-pst-sel-chip { flex-shrink: 0; padding: 6px 12px; border-radius: 999px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.72rem; font-weight: 800; }
        .tt-pst-sel-chip.is-on { background: #1E0734; border-color: #00DC7D; color: #00DC7D; }

        .tt-pst-tabs { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); padding: 4px; border-radius: 15px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-pst-slider { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 4); border-radius: 11px; background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%); transition: transform 280ms cubic-bezier(0.22, 1.24, 0.36, 1); pointer-events: none; }
        .tt-pst-slider.is-gold { background: linear-gradient(135deg, #F3DC9B 0%, #C89F45 100%); }
        .tt-ps-studio.is-light .tt-pst-slider:not(.is-gold) { background: #1E0734; }
        .tt-pst-tab { position: relative; z-index: 1; min-height: 36px; font-size: 0.68rem; font-weight: 800; color: var(--tt-text-muted); white-space: nowrap; }
        .tt-pst-tab.is-active { color: #10021E; font-weight: 900; }
        .tt-ps-studio.is-light .tt-pst-tab:not(.is-gold).is-active { color: #00DC7D; }

        .tt-pst-sec { display: flex; flex-direction: column; gap: 11px; }
        .tt-pst-card, .tt-pst-form { padding: 13px; border-radius: 17px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 10px; }
        .tt-pst-form-clean { display: flex; flex-direction: column; gap: 8px; }
        .tt-pst-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .tt-pst-mk { display: block; font-size: 0.59rem; font-weight: 900; letter-spacing: 0.08em; color: var(--tt-emerald-text); }
        .tt-pst-card h3, .tt-pst-head h3 { margin: 0; font-family: var(--tt-font-display); font-size: 1.15rem; line-height: 1.08; }
        .tt-pst-row { display: flex; align-items: center; gap: 8px; }
        .tt-pst-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tt-pst-g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
        .tt-pst-g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .tt-pst-lbl { display: flex; flex-direction: column; gap: 4px; font-size: 0.7rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-pst-in { width: 100%; min-height: 41px; padding: 8px 11px; border-radius: 12px; background: var(--tt-surface); border: 1px solid var(--tt-border-medium); color: var(--tt-text); font-size: 16px; font-family: inherit; }

        .tt-media-slot-box {
          padding: 11px; border-radius: 14px; background: var(--tt-surface); border: 1px solid var(--tt-border);
          display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center;
        }
        .tt-media-slot-box strong { font-size: 0.76rem; }

        .tt-up-bar { height: 7px; border-radius: 999px; background: var(--tt-surface); overflow: hidden; border: 1px solid var(--tt-border); }
        .tt-up-bar > div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00DC7D 0%, #E5C16C 100%); transition: width 180ms ease; }

        .tt-qs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; }
        @media (min-width: 540px) { .tt-qs-grid { grid-template-columns: repeat(3, 1fr); } }
        .tt-qs-pill, .tt-wq-btn { min-height: 37px; padding: 0 9px; border-radius: 11px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); color: var(--tt-text); font-size: 0.73rem; font-weight: 800; }
        .tt-qs-pill.is-on { background: #00DC7D; border-color: #00DC7D; color: #10021E; }
        .tt-pst-wa { min-height: 41px; border-radius: 13px; background: rgba(37, 211, 102, 0.14); border: 1px solid rgba(37, 211, 102, 0.36); color: #16A34A; font-size: 0.76rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 7px; }
        .tt-ps-studio.is-dark .tt-pst-wa { color: #4ADE80; }

        .tt-pst-list { display: flex; flex-direction: column; gap: 8px; }
        .tt-pst-item { padding: 10px 12px; border-radius: 14px; background: var(--tt-surface); border: 1px solid var(--tt-border); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .tt-pst-item.is-col { flex-direction: column; align-items: stretch; }
        .tt-pst-item strong { display: block; font-size: 0.85rem; }
        .tt-pst-item small { display: block; font-size: 0.71rem; color: var(--tt-text-muted); }
        .tt-pst-del { width: 28px; height: 28px; border-radius: 50%; background: var(--tt-surface-2); color: var(--tt-text-muted); flex-shrink: 0; font-size: 0.75rem; }
        .tt-step { width: 30px; height: 30px; border-radius: 9px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text); font-weight: 900; }
        .tt-step.is-plus { background: #00DC7D; border-color: #00DC7D; color: #10021E; }

        .tt-chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .tt-st-pill { min-height: 29px; padding: 0 9px; border-radius: 999px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.67rem; font-weight: 800; white-space: nowrap; }
        .tt-st-pill.is-ok { background: rgba(0, 220, 125, 0.16); border-color: rgba(0, 220, 125, 0.45); color: var(--tt-emerald-text); }
        .tt-st-pill.is-due { background: rgba(229, 193, 108, 0.18); border-color: rgba(229, 193, 108, 0.5); color: #8A5D10; }
        .tt-ps-studio.is-dark .tt-st-pill.is-due { color: #F3DC9B; }
        .tt-st-pill.is-full { background: rgba(239, 68, 68, 0.18); border-color: rgba(248, 113, 113, 0.5); color: #FCA5A5; }
        .tt-ps-studio.is-light .tt-st-pill.is-full { color: #B91C1C; }

        .tt-sw-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); color: var(--tt-text); font-size: 0.71rem; font-weight: 800; }
        .tt-sw-pill i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .tt-sw-pill.is-on { border-color: #00DC7D; }
        .tt-spec-pill { padding: 5px 9px; border-radius: 999px; background: var(--tt-surface); border: 1px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.7rem; font-weight: 700; }
        .tt-spec-pill.is-on { background: rgba(0, 220, 125, 0.16); border-color: #00DC7D; color: var(--tt-emerald-text); font-weight: 800; }

        .tt-gal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tt-gal-item { position: relative; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: #140324; }
        .tt-gal-item button { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(16, 3, 29, 0.85); color: #FAF9F5; font-size: 0.68rem; }

        .tt-val-pill { padding: 4px 10px; border-radius: 999px; background: var(--tt-surface-2); color: var(--tt-text-muted); font-size: 0.65rem; font-weight: 900; white-space: nowrap; }
        .tt-val-pill.is-vip { background: linear-gradient(135deg, #F3DC9B 0%, #C89F45 100%); color: #1A0D00; }
      `}</style>
    </ModalPortal>
  );
}
