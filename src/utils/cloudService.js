import { supabase } from '../supabaseClient';

/* ==========================================================================
   TOTAL TENIS · SERVICIO CLOUD EN TIEMPO REAL (SUPABASE + STORAGE + PUSH)
   - Sincronización multiusuario con respaldo automático de escudos y portadas.
   - Compresión inteligente en cliente (máx. 800px) -> Bucket público 'media'.
   - Candado anti-doble clic en redes 4G inestables.
   - Enlace OneSignal v16 + disparador seguro vía /api/push.
   - Utilidades oficiales: Hora Perú (America/Lima), WhatsApp +51 y regla 24h.
   ========================================================================== */

export const isCloudReady = Boolean(supabase);

const SITE_ORIGIN = 'https://huancayo-tenis.vercel.app';
const PERU_TZ = 'America/Lima';
const AUTO_CONFIRM_HOURS = 24;

/* Respaldo blindado de los 4 escudos oficiales, portadas, galerías y beneficios VIP */
const CLUB_VISUAL_FALLBACKS = {
  'club-country': {
    logo: '/assets/club-country-huancas.png',
    cover: '/assets/sede-country-club.jpg',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Country+Club+Los+Huancas+Huancayo',
    gallery: [
      { id: 'cc-1', title: 'Cancha Central de Arcilla', image: '/assets/sede-country-club.jpg' },
      { id: 'cc-2', title: 'Copa Los Huancas · Pista 1', image: '/assets/torneo-apertura.jpg' },
      { id: 'cc-3', title: 'Superficie Polvo de Ladrillo', image: '/assets/perfil-bg-arcilla.jpg' },
    ],
    rates: { diaRegular: 36, diaVip: 28, nocheRegular: 46, nocheVip: 38 },
    services: [
      '6 canchas profesionales de arcilla',
      'Iluminación LED nocturna hasta 10:00 p. m.',
      'Vestuarios con ducha y casilleros',
      'Estacionamiento privado y cafetería',
    ],
    vipBenefits: [
      'Tarifa preferencial VIP: S/ 28 día · S/ 38 noche LED',
      'Descuento especial en horas valle (Mar y Jue 10:00 a. m. – 2:00 p. m.)',
      'Prioridad de reserva en canchas centrales para retos oficiales',
    ],
  },
  'club-romina': {
    logo: '/assets/club-romina-cutipa.png',
    cover: '/assets/sede-romina-cutipa.jpg',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Academia+de+Tenis+Romina+Cutipa+Huancayo',
    gallery: [
      { id: 'rc-1', title: 'Pista Principal San Carlos', image: '/assets/sede-romina-cutipa.jpg' },
      { id: 'rc-2', title: 'Canchas de Competencia', image: '/assets/torneo-altura.jpg' },
      { id: 'rc-3', title: 'Entrenamiento Técnico', image: '/assets/portada-tips-semana.jpg' },
    ],
    rates: { diaRegular: 32, diaVip: 24, nocheRegular: 42, nocheVip: 34 },
    services: [
      '4 canchas de arcilla rápida con drenaje',
      'Iluminación LED antideslumbrante',
      'Zona de preparación física y calentamiento',
      'Área techada con vista directa a pista',
    ],
    vipBenefits: [
      'Tarifa preferencial VIP: S/ 24 día · S/ 34 noche LED',
      'Tarifa Socio en clases grupales y clínicas de la academia',
      'Mañanas activas VIP a S/ 16 la hora (Lun a Vie)',
    ],
  },
  'club-tauro': {
    logo: '/assets/club-tauro.png',
    cover: '/assets/sede-club-tauro.jpg',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tauro+Tenis+Huancayo',
    gallery: [
      { id: 'tt-1', title: 'Canchas Club Tauro Tenis', image: '/assets/sede-club-tauro.jpg' },
      { id: 'tt-2', title: 'Torneos Nocturnos', image: '/assets/torneo-dobles-valle.jpg' },
      { id: 'tt-3', title: 'Arcilla al Atardecer', image: '/assets/bienvenida-hero-claro.jpg' },
    ],
    rates: { diaRegular: 30, diaVip: 22, nocheRegular: 40, nocheVip: 32 },
    services: [
      '3 canchas de arcilla compacta',
      'Torres LED para turnos nocturnos',
      'Estacionamiento seguro junto a pista',
      'Terraza social post-partido',
    ],
    vipBenefits: [
      'Tarifa preferencial VIP: S/ 22 día · S/ 32 noche LED',
      'Promo Mediodía VIP a S/ 15/h (Lun a Jue 11:00 a. m. – 3:00 p. m.)',
      'Acceso preferente a torneos relámpago nocturnos',
    ],
  },
  'club-inkas': {
    logo: '/assets/club-los-inkas.png',
    cover: '/assets/sede-los-inkas.jpg',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Club+Los+Inkas+Huancayo+Tenis',
    gallery: [
      { id: 'li-1', title: 'Canchas Campestres Los Inkas', image: '/assets/sede-los-inkas.jpg' },
      { id: 'li-2', title: 'Vista Abierta al Valle', image: '/assets/bienvenida-hero-claro.jpg' },
      { id: 'li-3', title: 'Cancha 1 Oficial', image: '/assets/torneo-altura.jpg' },
    ],
    rates: { diaRegular: 30, diaVip: 22, nocheRegular: 38, nocheVip: 30 },
    services: [
      '4 canchas campestres de arcilla',
      'Iluminación LED en Canchas 1 y 2',
      'Áreas verdes y zona familiar',
      'Vestuarios y estacionamiento amplio',
    ],
    vipBenefits: [
      'Tarifa preferencial VIP: S/ 22 día · S/ 30 noche LED',
      'Tarifa Plana VIP a S/ 14/h los martes y miércoles',
      'Descuento en clínicas de dobles de fin de semana',
    ],
  },
};
CLUB_VISUAL_FALLBACKS['club-cutipa'] = CLUB_VISUAL_FALLBACKS['club-romina'];

const COACH_PHOTO_FALLBACKS = {
  'coach-romina': '/assets/sede-romina-cutipa.jpg',
  'coach-rodrigo': '/assets/sede-country-club.jpg',
  'coach-carlos': '/assets/sede-club-tauro.jpg',
  'coach-andrea': '/assets/sede-los-inkas.jpg',
};

function getClubFallback(clubId, clubName = '') {
  if (CLUB_VISUAL_FALLBACKS[clubId]) return CLUB_VISUAL_FALLBACKS[clubId];
  const lower = String(clubName || '').toLowerCase();
  if (lower.includes('huancas') || lower.includes('country')) return CLUB_VISUAL_FALLBACKS['club-country'];
  if (lower.includes('romina') || lower.includes('cutipa')) return CLUB_VISUAL_FALLBACKS['club-romina'];
  if (lower.includes('tauro')) return CLUB_VISUAL_FALLBACKS['club-tauro'];
  if (lower.includes('inka') || lower.includes('inca')) return CLUB_VISUAL_FALLBACKS['club-inkas'];
  return {
    logo: '/assets/logo-total-tenis.png',
    cover: '/assets/torneo-apertura.jpg',
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clubName || 'Club de Tenis'} Huancayo`)}`,
    gallery: [{ id: 'def-1', title: 'Cancha Oficial', image: '/assets/torneo-apertura.jpg' }],
    rates: { diaRegular: 32, diaVip: 25, nocheRegular: 42, nocheVip: 34 },
    services: ['Canchas de arcilla', 'Iluminación LED', 'Estacionamiento'],
    vipBenefits: ['Tarifa preferencial en alquiler de cancha presentando tu Carnet 3D VIP'],
  };
}

function normalizeClubGallery(rawGallery, fallbackGallery, coverUrl) {
  const source = Array.isArray(rawGallery) && rawGallery.length > 0 ? rawGallery : fallbackGallery;
  const normalized = (source || [])
    .map((item, idx) => {
      if (typeof item === 'string' && item.trim()) {
        return { id: `gal-${idx}`, title: `Foto ${idx + 1}`, image: item.trim() };
      }
      if (item && (item.image || item.url)) {
        return {
          id: item.id || `gal-${idx}`,
          title: item.title || `Cancha ${idx + 1}`,
          image: item.image || item.url,
        };
      }
      return null;
    })
    .filter(Boolean);

  if (normalized.length === 0 && coverUrl) {
    return [{ id: 'gal-cover', title: 'Vista Principal', image: coverUrl }];
  }
  return normalized;
}

/* Candado en memoria para impedir envíos duplicados en 4G */
const inFlightLocks = new Set();

export async function runWithLock(lockKey, asyncFn) {
  if (inFlightLocks.has(lockKey)) {
    return { locked: true, data: null };
  }
  inFlightLocks.add(lockKey);
  try {
    const data = await asyncFn();
    return { locked: false, data };
  } finally {
    inFlightLocks.delete(lockKey);
  }
}

/* --------------------------------------------------------------------------
   1. UTILIDADES PERÚ: WHATSAPP +51, HORA LIMA Y SILENCIO POSITIVO 24H
   -------------------------------------------------------------------------- */
export function normalizePeruPhone(raw = '') {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('51') && digits.length === 11) return `+${digits}`;
  if (digits.length === 9 && digits.startsWith('9')) return `+51${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return digits;
}

export function buildWhatsappLink(rawPhone, message = '') {
  const normalized = normalizePeruPhone(rawPhone).replace(/\D/g, '');
  if (!normalized) return '';
  const encoded = encodeURIComponent(message || '');
  return `https://wa.me/${normalized}${encoded ? `?text=${encoded}` : ''}`;
}

export function formatPeruDate(isoOrDate, withTime = false) {
  try {
    const d = isoOrDate ? new Date(isoOrDate) : new Date();
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('es-PE', {
      timeZone: PERU_TZ,
      day: '2-digit',
      month: 'short',
      ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
    });
  } catch {
    return '';
  }
}

export function isScoreReadyForAutoConfirm(challenge) {
  if (!challenge || challenge.status !== 'SCORE_PROPOSED') return false;
  const proposedAtIso = challenge.liveScore?._meta?.proposedAt || challenge.createdAt;
  if (!proposedAtIso) return false;
  const elapsedMs = Date.now() - new Date(proposedAtIso).getTime();
  return elapsedMs >= AUTO_CONFIRM_HOURS * 60 * 60 * 1000;
}

export function hoursLeftForAutoConfirm(challenge) {
  if (!challenge || challenge.status !== 'SCORE_PROPOSED') return 0;
  const proposedAtIso = challenge.liveScore?._meta?.proposedAt || challenge.createdAt;
  if (!proposedAtIso) return AUTO_CONFIRM_HOURS;
  const remainingMs =
    AUTO_CONFIRM_HOURS * 60 * 60 * 1000 - (Date.now() - new Date(proposedAtIso).getTime());
  return Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000)));
}

/* --------------------------------------------------------------------------
   2. ENLACE ONESIGNAL v16
   -------------------------------------------------------------------------- */
export function linkOneSignalUser(playerId) {
  if (typeof window === 'undefined' || !playerId) return;
  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.login(String(playerId));
      } catch {
        // Silencioso
      }
    });
  } catch {
    // No interrumpir flujo
  }
}

export function unlinkOneSignalUser() {
  if (typeof window === 'undefined') return;
  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.logout();
      } catch {
        // Silencioso
      }
    });
  } catch {
    // No interrumpir flujo
  }
}

export async function requestPushPermission() {
  if (typeof window === 'undefined') return false;
  return new Promise((resolve) => {
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          if (OneSignal?.Notifications?.requestPermission) {
            await OneSignal.Notifications.requestPermission();
            resolve(Boolean(OneSignal.Notifications.permission));
            return;
          }
          resolve(false);
        } catch {
          resolve(false);
        }
      });
    } catch {
      resolve(false);
    }
  });
}

/* --------------------------------------------------------------------------
   3. COMPRESIÓN SEGURA + SUBIDA A SUPABASE STORAGE ('media')
   -------------------------------------------------------------------------- */
export async function compressImageToBlob(fileOrDataUrl, maxSide = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl = null;

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      }
    };

    img.onload = () => {
      try {
        let { naturalWidth: width, naturalHeight: height } = img;
        if (!width || !height) {
          cleanup();
          reject(new Error('Imagen inválida o vacía'));
          return;
        }
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            canvas.width = 0;
            canvas.height = 0;
            if (blob) resolve(blob);
            else reject(new Error('No se pudo comprimir la imagen'));
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('No se pudo cargar la imagen seleccionada'));
    };

    if (typeof fileOrDataUrl === 'string') {
      if (/^https?:\/\//i.test(fileOrDataUrl)) {
        img.crossOrigin = 'anonymous';
      }
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob) {
      objectUrl = URL.createObjectURL(fileOrDataUrl);
      img.src = objectUrl;
    } else {
      reject(new Error('Formato de imagen no soportado'));
    }
  });
}

export async function uploadCompressedMedia(fileOrDataUrl, folder = 'avatars', entityId = 'item') {
  const blob = await compressImageToBlob(fileOrDataUrl, 800, 0.8);

  if (!supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error leyendo imagen local'));
      reader.readAsDataURL(blob);
    });
  }

  const cleanFolder = String(folder || 'avatars').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanId = String(entityId || 'item').replace(/[^a-zA-Z0-9_-]/g, '');
  const path = `${cleanFolder}/${cleanId}-${Date.now()}.jpg`;

  const { error } = await supabase.storage.from('media').upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data?.publicUrl || '';
}

/* --------------------------------------------------------------------------
   4. AUTENTICACIÓN SEGURA EN SUPABASE AUTH
   -------------------------------------------------------------------------- */
export async function getCloudSession() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session || null;
  } catch {
    return null;
  }
}

export async function signUpCloudAccount({ email, password, metadata = {} }) {
  if (!supabase) throw new Error('Conexión en la nube no disponible');
  const cleanEmail = String(email || '').trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: metadata,
      emailRedirectTo: SITE_ORIGIN,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInCloudAccount({ email, password }) {
  if (!supabase) throw new Error('Conexión en la nube no disponible');
  const cleanEmail = String(email || '').trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });
  if (error) throw error;
  return data;
}

export async function sendCloudPasswordReset(email) {
  if (!supabase) throw new Error('Conexión en la nube no disponible');
  const cleanEmail = String(email || '').trim().toLowerCase();
  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: SITE_ORIGIN,
  });
  if (error) throw error;
  return true;
}

export async function signOutCloudAccount() {
  unlinkOneSignalUser();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Limpieza silenciosa
  }
}

export function onCloudAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => {
    data?.subscription?.unsubscribe();
  };
}

/* --------------------------------------------------------------------------
   5. CONVERSORES UNIFICADOS SQL (snake_case) <-> REACT (camelCase)
   Garantiza que logo, cover, banner, photo y scenarioId siempre lleguen completos.
   -------------------------------------------------------------------------- */
export function dbToPlayer(row) {
  if (!row) return null;
  const avatar = row.avatar_url || '';
  const scenario = row.cover_scenario || 'default';
  return {
    id: row.id,
    authId: row.auth_id || null,
    name: row.name || 'Tenista',
    email: row.email || '',
    whatsapp: row.whatsapp || '',
    showWhatsapp: row.show_whatsapp !== false,
    hideWhatsapp: row.show_whatsapp === false,
    age: Number(row.age) || 25,
    division: row.division || 'Varones',
    clubId: row.club_id || 'independiente',
    clubName: row.club_name || 'Independiente',
    points: Number(row.points) || 1200,
    wins: Number(row.wins) || 0,
    losses: Number(row.losses) || 0,
    streak: Number(row.streak) || 0,
    calibrationPlayed: Number(row.calibration_played) || 0,
    rankTrend: Number(row.rank_trend) || 0,
    gems: Number(row.gems) || 0,
    isVip: Boolean(row.is_vip),
    vipStatus: row.vip_status || 'STANDARD',
    isAdmin: Boolean(row.is_admin),
    isPaused: Boolean(row.is_paused),
    isDemo: Boolean(row.is_demo),
    avatar,
    fullBodyPhoto: avatar,
    coverScenario: scenario,
    scenarioId: scenario,
    unlockedScenarios: Array.isArray(row.unlocked_scenarios) ? row.unlocked_scenarios : ['default'],
    unlockedBadges: Array.isArray(row.unlocked_badges) ? row.unlocked_badges : [],
    activeBadgeId: row.active_badge_id || '',
    unlockedVideos: Array.isArray(row.unlocked_videos) ? row.unlocked_videos : [],
    hand: row.hand || 'Diestro',
    backhand: row.backhand || '2 manos',
    weapon: row.weapon || 'Derecha',
    bestStroke: row.weapon || 'Derecha (Forehand)',
    availability: row.availability || 'Noches y fines de semana',
    credentialId: row.credential_id || '',
    oneSignalId: row.onesignal_id || '',
  };
}

export function playerToDb(p) {
  const out = {};
  if (p.id !== undefined) out.id = p.id;
  if (p.authId !== undefined) out.auth_id = p.authId;
  if (p.name !== undefined) out.name = String(p.name).trim();
  if (p.email !== undefined) out.email = String(p.email).trim().toLowerCase();
  if (p.whatsapp !== undefined) out.whatsapp = normalizePeruPhone(p.whatsapp);
  if (p.hideWhatsapp !== undefined) out.show_whatsapp = !p.hideWhatsapp;
  else if (p.showWhatsapp !== undefined) out.show_whatsapp = Boolean(p.showWhatsapp);
  if (p.age !== undefined) out.age = Number(p.age) || 25;
  if (p.division !== undefined) out.division = p.division;
  if (p.clubId !== undefined) out.club_id = p.clubId;
  if (p.clubName !== undefined) out.club_name = p.clubName;
  if (p.points !== undefined) out.points = Number(p.points) || 1200;
  if (p.wins !== undefined) out.wins = Number(p.wins) || 0;
  if (p.losses !== undefined) out.losses = Number(p.losses) || 0;
  if (p.streak !== undefined) out.streak = Number(p.streak) || 0;
  if (p.calibrationPlayed !== undefined) out.calibration_played = Number(p.calibrationPlayed) || 0;
  if (p.rankTrend !== undefined) out.rank_trend = Number(p.rankTrend) || 0;
  if (p.gems !== undefined) out.gems = Number(p.gems) || 0;
  if (p.isVip !== undefined) out.is_vip = Boolean(p.isVip);
  if (p.vipStatus !== undefined) out.vip_status = p.vipStatus;
  if (p.isAdmin !== undefined) out.is_admin = Boolean(p.isAdmin);
  if (p.isPaused !== undefined) out.is_paused = Boolean(p.isPaused);
  if (p.isDemo !== undefined) out.is_demo = Boolean(p.isDemo);
  if (p.avatar !== undefined) out.avatar_url = p.avatar;
  else if (p.fullBodyPhoto !== undefined) out.avatar_url = p.fullBodyPhoto;
  if (p.scenarioId !== undefined) out.cover_scenario = p.scenarioId;
  else if (p.coverScenario !== undefined) out.cover_scenario = p.coverScenario;
  if (p.unlockedScenarios !== undefined) out.unlocked_scenarios = p.unlockedScenarios;
  if (p.unlockedBadges !== undefined) out.unlocked_badges = p.unlockedBadges;
  if (p.activeBadgeId !== undefined) out.active_badge_id = p.activeBadgeId;
  if (p.unlockedVideos !== undefined) out.unlocked_videos = p.unlockedVideos;
  if (p.hand !== undefined) out.hand = p.hand;
  if (p.backhand !== undefined) out.backhand = p.backhand;
  if (p.bestStroke !== undefined) out.weapon = p.bestStroke;
  else if (p.weapon !== undefined) out.weapon = p.weapon;
  if (p.availability !== undefined) out.availability = p.availability;
  if (p.credentialId !== undefined) out.credential_id = p.credentialId;
  if (p.oneSignalId !== undefined) out.onesignal_id = p.oneSignalId;
  out.updated_at = new Date().toISOString();
  return out;
}

export function dbToChallenge(row) {
  if (!row) return null;
  const liveScore = row.live_score && typeof row.live_score === 'object' ? row.live_score : {};
  const meta = liveScore._meta || {};
  const sched = row.scheduled_at || row.created_at;
  return {
    id: row.id,
    playerAId: row.player_a_id,
    playerBId: row.player_b_id,
    judgeId: meta.judgeId || null,
    clubId: row.club_id || 'libre',
    clubName: row.club_name || 'Cancha Libre',
    mode: row.mode || 'Por puntos',
    ballsAgreement: meta.ballsAgreement || '',
    rescheduleCount: Number(meta.rescheduleCount) || 0,
    scheduledAt: sched,
    scheduledIso: sched,
    dateLabel: row.date_label || '',
    timeLabel: row.time_label || '',
    status: row.status || 'PENDING',
    liveScore,
    proposedBy: row.proposed_by || '',
    scoreSummary: row.score_summary || '',
    winnerId: row.winner_id || '',
    eloDeltaA: Number(row.elo_delta_a) || 0,
    eloDeltaB: Number(row.elo_delta_b) || 0,
    disputeNote: row.dispute_note || '',
    createdAt: row.created_at,
    finishedAt: row.finished_at || null,
  };
}

export function challengeToDb(c) {
  const out = {};
  if (c.id !== undefined) out.id = c.id;
  if (c.playerAId !== undefined) out.player_a_id = c.playerAId;
  if (c.playerBId !== undefined) out.player_b_id = c.playerBId;
  if (c.clubId !== undefined) out.club_id = c.clubId;
  if (c.clubName !== undefined) out.club_name = c.clubName;
  if (c.mode !== undefined) out.mode = c.mode;
  if (c.scheduledIso !== undefined) out.scheduled_at = c.scheduledIso;
  else if (c.scheduledAt !== undefined) out.scheduled_at = c.scheduledAt;
  if (c.dateLabel !== undefined) out.date_label = c.dateLabel;
  if (c.timeLabel !== undefined) out.time_label = c.timeLabel;
  if (c.status !== undefined) out.status = c.status;

  if (
    c.liveScore !== undefined ||
    c.status === 'SCORE_PROPOSED' ||
    c.judgeId !== undefined ||
    c.ballsAgreement !== undefined ||
    c.rescheduleCount !== undefined
  ) {
    const baseLive = c.liveScore && typeof c.liveScore === 'object' ? { ...c.liveScore } : {};
    const nextMeta = { ...(baseLive._meta || {}) };
    if (c.status === 'SCORE_PROPOSED' && !nextMeta.proposedAt) {
      nextMeta.proposedAt = new Date().toISOString();
    }
    if (c.judgeId !== undefined) nextMeta.judgeId = c.judgeId;
    if (c.ballsAgreement !== undefined) nextMeta.ballsAgreement = c.ballsAgreement;
    if (c.rescheduleCount !== undefined) nextMeta.rescheduleCount = Number(c.rescheduleCount) || 0;
    baseLive._meta = nextMeta;
    out.live_score = baseLive;
  }

  if (c.proposedBy !== undefined) out.proposed_by = c.proposedBy;
  if (c.scoreSummary !== undefined) out.score_summary = c.scoreSummary;
  if (c.winnerId !== undefined) out.winner_id = c.winnerId;
  if (c.eloDeltaA !== undefined) out.elo_delta_a = Number(c.eloDeltaA) || 0;
  if (c.eloDeltaB !== undefined) out.elo_delta_b = Number(c.eloDeltaB) || 0;
  if (c.disputeNote !== undefined) out.dispute_note = c.disputeNote;
  if (c.finishedAt !== undefined) out.finished_at = c.finishedAt;
  return out;
}

export function dbToClub(row) {
  if (!row) return null;
  const fb = getClubFallback(row.id, row.name);
  const resolvedLogo = row.logo_url || fb.logo;
  const resolvedCover = row.cover_url || fb.cover;
  const resolvedMaps = row.maps_url || fb.mapsUrl;
  const resolvedGallery = normalizeClubGallery(row.gallery, fb.gallery, resolvedCover);
  const resolvedRates =
    row.rates && Object.keys(row.rates).length > 0 ? row.rates : fb.rates;
  const resolvedServices =
    Array.isArray(row.services) && row.services.length > 0 ? row.services : fb.services;
  const resolvedVipBenefits =
    Array.isArray(row.vip_benefits) && row.vip_benefits.length > 0
      ? row.vip_benefits
      : fb.vipBenefits;

  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name || row.name,
    district: row.district || 'Huancayo',
    address: row.address || '',
    hours: row.hours || '06:00 a. m. – 10:00 p. m.',
    surface: row.surface || 'Arcilla',
    courtsCount: Number(row.courts_count) || 4,
    mapsUrl: resolvedMaps,
    googleMapsUrl: resolvedMaps,
    whatsapp: row.whatsapp || '',
    // Alias unificados para que TODAS las pantallas muestren escudos y portadas sin fallos
    logo: resolvedLogo,
    logoUrl: resolvedLogo,
    cover: resolvedCover,
    coverUrl: resolvedCover,
    banner: resolvedCover,
    gallery: resolvedGallery,
    galeria: resolvedGallery,
    rates: resolvedRates,
    tarifas: resolvedRates,
    services: resolvedServices,
    vipBenefits: resolvedVipBenefits,
    promos: Array.isArray(row.promos) ? row.promos : [],
    internalEvents: Array.isArray(row.internal_events) ? row.internal_events : [],
    climaBase: {
      conditionKey: row.weather_condition || 'seco',
      updatedAt: row.weather_updated_at || null,
      reportedBy: row.weather_reported_by || '',
    },
    active: row.active !== false,
  };
}

export function dbToCoach(row) {
  if (!row) return null;
  const resolvedPhoto =
    row.photo_url || COACH_PHOTO_FALLBACKS[row.id] || '/assets/sede-country-club.jpg';
  const resolvedCover = row.cover_url || resolvedPhoto;

  return {
    id: row.id,
    ownerProfileId: row.owner_profile_id || '',
    clubId: row.club_id || '',
    clubName: row.club_name || '',
    name: row.name,
    title: row.title || 'Entrenador Oficial',
    bio: row.bio || '',
    photo: resolvedPhoto,
    photoUrl: resolvedPhoto,
    portrait: resolvedPhoto,
    fullBodyPhoto: resolvedPhoto,
    coverUrl: resolvedCover,
    accentTheme: row.accent_theme || 'emerald',
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    baseRate: Number(row.base_rate) || 60,
    vipRate: Number(row.vip_rate) || 50,
    freeSlotToday: row.free_slot_today || '',
    videos: Array.isArray(row.videos) ? row.videos : [],
    groups: Array.isArray(row.groups) ? row.groups : [],
    packages: Array.isArray(row.packages) ? row.packages : [],
    students: Array.isArray(row.students) ? row.students : [],
    whatsapp: row.whatsapp || '',
    profileViews: Number(row.profile_views) || 0,
    whatsappClicks: Number(row.whatsapp_clicks) || 0,
    featured: Boolean(row.featured),
    active: row.active !== false,
  };
}

export function dbToTournament(row) {
  if (!row) return null;
  const resolvedBanner = row.banner_url || '/assets/torneo-apertura.jpg';
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name || row.name,
    clubId: row.club_id || '',
    clubName: row.club_name || '',
    surface: row.surface || 'Arcilla',
    status: row.status || 'OPEN',
    dateLabel: row.date_label || '',
    categoryLabel: row.category_label || 'Abierto',
    drawSize: Number(row.draw_size) || 16,
    minPlayers: Number(row.min_players) || 8,
    minPlayersForDraw: Number(row.min_players) || 8,
    entryFee: Number(row.entry_fee) || 45,
    includesBalls: row.includes_balls !== false,
    hasConsolation: row.has_consolation !== false,
    includesItems: Array.isArray(row.includes_items) ? row.includes_items : [],
    banner: resolvedBanner,
    bannerUrl: resolvedBanner,
    prizes: row.prizes || {},
    participantsIds: Array.isArray(row.participants_ids) ? row.participants_ids : [],
    pendingPaymentIds: Array.isArray(row.pending_payment_ids) ? row.pending_payment_ids : [],
    bracketResults: row.bracket_results || {},
  };
}

export function dbToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    channel: row.channel || 'OWN_STOCK',
    name: row.name,
    subtitle: row.subtitle || '',
    description: row.description || '',
    image: row.image_url || '',
    imageUrl: row.image_url || '',
    priceSoles: Number(row.price_soles) || 0,
    oldPriceSoles: row.old_price_soles ? Number(row.old_price_soles) : null,
    vipPriceSoles: row.vip_price_soles ? Number(row.vip_price_soles) : null,
    gemsCost: Number(row.gems_cost) || 0,
    externalUrl: row.external_url || '',
    coachId: row.coach_id || '',
    coachWhatsapp: row.coach_whatsapp || '',
    badgeText: row.badge_text || '',
    inStock: row.in_stock !== false,
    clicksCount: Number(row.clicks_count) || 0,
    active: row.active !== false,
    sortOrder: Number(row.sort_order) || 10,
  };
}

/* --------------------------------------------------------------------------
   6. CARGA INICIAL COMPLETA + SEMILLA CON LOGOS Y PORTADAS REALES
   -------------------------------------------------------------------------- */
export async function fetchAllCloudState(fallbackSeeds = {}) {
  if (!supabase) return null;

  const [
    profilesRes,
    clubsRes,
    coachesRes,
    challengesRes,
    tournamentsRes,
    productsRes,
    complaintsRes,
    settingsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('points', { ascending: false }),
    supabase.from('clubs').select('*'),
    supabase.from('coaches').select('*'),
    supabase.from('challenges').select('*').order('created_at', { ascending: false }),
    supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').order('sort_order', { ascending: true }),
    supabase.from('complaints').select('*').order('created_at', { ascending: false }),
    supabase.from('app_settings').select('*'),
  ]);

  let players = (profilesRes.data || []).map(dbToPlayer);
  let clubs = (clubsRes.data || []).map(dbToClub);
  let coaches = (coachesRes.data || []).map(dbToCoach);
  const challenges = (challengesRes.data || []).map(dbToChallenge);
  let tournaments = (tournamentsRes.data || []).map(dbToTournament);
  let products = (productsRes.data || []).map(dbToProduct);
  const complaints = complaintsRes.data || [];

  if (!profilesRes.error && players.length === 0 && fallbackSeeds.players?.length) {
    const demoRows = fallbackSeeds.players.map((p) => playerToDb({ ...p, isDemo: true }));
    const { data } = await supabase.from('profiles').upsert(demoRows).select();
    if (data) players = data.map(dbToPlayer);
  }

  if (!clubsRes.error && clubs.length === 0 && fallbackSeeds.clubs?.length) {
    const clubRows = fallbackSeeds.clubs.map((c) => {
      const fb = getClubFallback(c.id, c.name);
      return {
        id: c.id,
        name: c.name,
        short_name: c.shortName || c.name,
        district: c.district || 'Huancayo',
        address: c.address || '',
        hours: c.hours || '06:00 a. m. – 10:00 p. m.',
        surface: c.surface || 'Arcilla',
        courts_count: Number(c.courtsCount) || 4,
        maps_url: c.mapsUrl || c.googleMapsUrl || fb.mapsUrl,
        whatsapp: normalizePeruPhone(c.whatsapp || ''),
        cover_url: c.coverUrl || c.cover || c.banner || fb.cover,
        logo_url: c.logoUrl || c.logo || fb.logo,
        gallery: normalizeClubGallery(c.gallery || c.galeria, fb.gallery, fb.cover),
        rates: c.rates || c.tarifas || fb.rates,
        services:
          Array.isArray(c.services) && c.services.length > 0
            ? c.services
            : Array.isArray(c.instalaciones)
            ? c.instalaciones.map((i) => (typeof i === 'string' ? i : i.label))
            : fb.services,
        vip_benefits:
          Array.isArray(c.vipBenefits) && c.vipBenefits.length > 0
            ? c.vipBenefits
            : fb.vipBenefits,
        promos: c.promos || c.promosHorasValle || [],
        internal_events: c.internalEvents || c.torneosInternos || [],
        weather_condition: c.climaBase?.conditionKey || 'seco',
        active: true,
      };
    });
    const { data } = await supabase.from('clubs').upsert(clubRows).select();
    if (data) clubs = data.map(dbToClub);
  }

  if (!coachesRes.error && coaches.length === 0 && fallbackSeeds.coaches?.length) {
    const coachRows = fallbackSeeds.coaches.map((co) => ({
      id: co.id,
      owner_profile_id: co.ownerProfileId || '',
      club_id: co.clubId || '',
      club_name: co.clubName || '',
      name: co.name,
      title: co.title || 'Entrenador Oficial',
      bio: co.bio || co.specialty || '',
      photo_url:
        co.photoUrl || co.photo || co.portrait || COACH_PHOTO_FALLBACKS[co.id] || '',
      cover_url: co.coverUrl || co.courtBackground || COACH_PHOTO_FALLBACKS[co.id] || '',
      accent_theme: co.accentTheme || 'emerald',
      specialties: Array.isArray(co.specialties)
        ? co.specialties
        : co.specialty
        ? String(co.specialty).split(',').map((s) => s.trim())
        : [],
      base_rate: Number(co.baseRate ?? co.basePriceRegular) || 60,
      vip_rate: Number(co.vipRate ?? co.basePriceVip) || 50,
      free_slot_today: co.freeSlotToday || '',
      videos: co.videos || co.videosEnCancha || [],
      groups: co.groups || co.horariosSemanales || [],
      packages: co.packages || co.modalidades || [],
      students: co.students || co.alumnosActivos || [],
      whatsapp: normalizePeruPhone(co.whatsapp || ''),
      featured: Boolean(co.featured),
      active: true,
    }));
    const { data } = await supabase.from('coaches').upsert(coachRows).select();
    if (data) coaches = data.map(dbToCoach);
  }

  if (!tournamentsRes.error && tournaments.length === 0 && fallbackSeeds.tournaments?.length) {
    const tRows = fallbackSeeds.tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      short_name: t.shortName || t.name,
      club_id: t.clubId || '',
      club_name: t.clubName || '',
      surface: t.surface || 'Arcilla',
      status: t.status || 'OPEN',
      date_label: t.dateLabel || '',
      category_label: t.categoryLabel || 'Abierto',
      draw_size: Number(t.drawSize) || 16,
      min_players: Number(t.minPlayers ?? t.minPlayersForDraw) || 8,
      entry_fee: Number(t.entryFee) || 45,
      includes_balls: t.includesBalls !== false,
      has_consolation: t.hasConsolation !== false,
      includes_items: t.includesItems || [],
      banner_url: t.bannerUrl || t.banner || '/assets/torneo-apertura.jpg',
      prizes: t.prizes || {},
      participants_ids: t.participantsIds || [],
      pending_payment_ids: t.pendingPaymentIds || [],
      bracket_results: t.bracketResults || {},
    }));
    const { data } = await supabase.from('tournaments').upsert(tRows).select();
    if (data) tournaments = data.map(dbToTournament);
  }

  if (!productsRes.error && products.length === 0 && fallbackSeeds.products?.length) {
    const pRows = fallbackSeeds.products.map((pr, idx) => ({
      id: pr.id,
      channel: pr.channel || 'OWN_STOCK',
      name: pr.name,
      subtitle: pr.subtitle || '',
      description: pr.description || '',
      image_url: pr.imageUrl || pr.image || '',
      price_soles: Number(pr.priceSoles ?? pr.price) || 0,
      old_price_soles: pr.oldPriceSoles ? Number(pr.oldPriceSoles) : null,
      vip_price_soles: pr.vipPriceSoles ? Number(pr.vipPriceSoles) : null,
      gems_cost: Number(pr.gemsCost) || 0,
      external_url: pr.externalUrl || '',
      coach_id: pr.coachId || '',
      coach_whatsapp: normalizePeruPhone(pr.coachWhatsapp || ''),
      badge_text: pr.badgeText || '',
      in_stock: pr.inStock !== false,
      active: true,
      sort_order: idx + 1,
    }));
    const { data } = await supabase.from('products').upsert(pRows).select();
    if (data) products = data.map(dbToProduct);
  }

  const settingsMap = {};
  (settingsRes.data || []).forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return {
    players,
    clubs,
    coaches,
    challenges,
    tournaments,
    products,
    complaints,
    seasonSnapshots: settingsMap.season_snapshots || null,
    sponsorsConfig: settingsMap.sponsors_config || null,
  };
}

/* --------------------------------------------------------------------------
   7. OPERACIONES CRUD EN VIVO
   -------------------------------------------------------------------------- */
export async function upsertCloudPlayer(playerObj) {
  if (!supabase || !playerObj?.id) return null;
  const { data, error } = await supabase
    .from('profiles')
    .upsert(playerToDb(playerObj))
    .select()
    .single();
  if (error) throw error;
  return dbToPlayer(data);
}

export async function deleteCloudPlayer(playerId) {
  if (!supabase || !playerId) return;
  const { error } = await supabase.from('profiles').delete().eq('id', playerId);
  if (error) throw error;
}

export async function purgeDemoPlayers() {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from('profiles')
    .delete()
    .eq('is_demo', true)
    .select('id');
  if (error) throw error;
  return data?.length || 0;
}

export async function upsertCloudChallenge(challengeObj) {
  if (!supabase || !challengeObj?.id) return null;
  const { data, error } = await supabase
    .from('challenges')
    .upsert(challengeToDb(challengeObj))
    .select()
    .single();
  if (error) throw error;
  return dbToChallenge(data);
}

export async function deleteCloudChallenge(challengeId) {
  if (!supabase || !challengeId) return;
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
  if (error) throw error;
}

export async function upsertCloudTournament(tournamentObj) {
  if (!supabase || !tournamentObj?.id) return null;
  const row = {
    id: tournamentObj.id,
    name: tournamentObj.name,
    short_name: tournamentObj.shortName || tournamentObj.name,
    club_id: tournamentObj.clubId || '',
    club_name: tournamentObj.clubName || '',
    surface: tournamentObj.surface || 'Arcilla',
    status: tournamentObj.status || 'OPEN',
    date_label: tournamentObj.dateLabel || '',
    category_label: tournamentObj.categoryLabel || 'Abierto',
    draw_size: Number(tournamentObj.drawSize) || 16,
    min_players: Number(tournamentObj.minPlayers ?? tournamentObj.minPlayersForDraw) || 8,
    entry_fee: Number(tournamentObj.entryFee) || 45,
    includes_balls: tournamentObj.includesBalls !== false,
    has_consolation: tournamentObj.hasConsolation !== false,
    includes_items: tournamentObj.includesItems || [],
    banner_url: tournamentObj.bannerUrl || tournamentObj.banner || '',
    prizes: tournamentObj.prizes || {},
    participants_ids: tournamentObj.participantsIds || [],
    pending_payment_ids: tournamentObj.pendingPaymentIds || [],
    bracket_results: tournamentObj.bracketResults || {},
  };
  const { data, error } = await supabase.from('tournaments').upsert(row).select().single();
  if (error) throw error;
  return dbToTournament(data);
}

export async function deleteCloudTournament(tournamentId) {
  if (!supabase || !tournamentId) return;
  const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
  if (error) throw error;
}

export async function upsertCloudClub(clubObj) {
  if (!supabase || !clubObj?.id) return null;
  const fb = getClubFallback(clubObj.id, clubObj.name);
  const row = {
    id: clubObj.id,
    name: clubObj.name,
    short_name: clubObj.shortName || clubObj.name,
    district: clubObj.district || 'Huancayo',
    address: clubObj.address || '',
    hours: clubObj.hours || '06:00 a. m. – 10:00 p. m.',
    surface: clubObj.surface || 'Arcilla',
    courts_count: Number(clubObj.courtsCount) || 4,
    maps_url: clubObj.mapsUrl || clubObj.googleMapsUrl || fb.mapsUrl,
    whatsapp: normalizePeruPhone(clubObj.whatsapp || ''),
    cover_url: clubObj.coverUrl || clubObj.cover || clubObj.banner || fb.cover,
    logo_url: clubObj.logoUrl || clubObj.logo || fb.logo,
    gallery: clubObj.gallery || clubObj.galeria || fb.gallery,
    rates: clubObj.rates || clubObj.tarifas || fb.rates,
    services: clubObj.services || fb.services,
    vip_benefits: clubObj.vipBenefits || fb.vipBenefits,
    promos: clubObj.promos || [],
    internal_events: clubObj.internalEvents || [],
    weather_condition: clubObj.climaBase?.conditionKey || 'seco',
    active: clubObj.active !== false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('clubs').upsert(row).select().single();
  if (error) throw error;
  return dbToClub(data);
}

export async function upsertCloudCoach(coachObj) {
  if (!supabase || !coachObj?.id) return null;
  const row = {
    id: coachObj.id,
    owner_profile_id: coachObj.ownerProfileId || '',
    club_id: coachObj.clubId || '',
    club_name: coachObj.clubName || '',
    name: coachObj.name,
    title: coachObj.title || 'Entrenador Oficial',
    bio: coachObj.bio || '',
    photo_url: coachObj.photoUrl || coachObj.photo || coachObj.portrait || '',
    cover_url: coachObj.coverUrl || '',
    accent_theme: coachObj.accentTheme || 'emerald',
    specialties: Array.isArray(coachObj.specialties) ? coachObj.specialties : [],
    base_rate: Number(coachObj.baseRate) || 60,
    vip_rate: Number(coachObj.vipRate) || 50,
    free_slot_today: coachObj.freeSlotToday || '',
    videos: Array.isArray(coachObj.videos) ? coachObj.videos : [],
    groups: Array.isArray(coachObj.groups) ? coachObj.groups : [],
    packages: Array.isArray(coachObj.packages) ? coachObj.packages : [],
    students: Array.isArray(coachObj.students) ? coachObj.students : [],
    whatsapp: normalizePeruPhone(coachObj.whatsapp || ''),
    featured: Boolean(coachObj.featured),
    active: coachObj.active !== false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('coaches').upsert(row).select().single();
  if (error) throw error;
  return dbToCoach(data);
}

export async function incrementCoachMetric(coachId, field = 'profile_views') {
  if (!supabase || !coachId) return;
  if (field !== 'profile_views' && field !== 'whatsapp_clicks') return;
  try {
    const { data } = await supabase.from('coaches').select(field).eq('id', coachId).single();
    const nextVal = (Number(data?.[field]) || 0) + 1;
    await supabase.from('coaches').update({ [field]: nextVal }).eq('id', coachId);
  } catch {
    // Métrica no bloqueante
  }
}

export async function upsertCloudProduct(productObj) {
  if (!supabase || !productObj?.id) return null;
  const row = {
    id: productObj.id,
    channel: productObj.channel || 'OWN_STOCK',
    name: productObj.name,
    subtitle: productObj.subtitle || '',
    description: productObj.description || '',
    image_url: productObj.imageUrl || productObj.image || '',
    price_soles: Number(productObj.priceSoles) || 0,
    old_price_soles: productObj.oldPriceSoles ? Number(productObj.oldPriceSoles) : null,
    vip_price_soles: productObj.vipPriceSoles ? Number(productObj.vipPriceSoles) : null,
    gems_cost: Number(productObj.gemsCost) || 0,
    external_url: productObj.externalUrl || '',
    coach_id: productObj.coachId || '',
    coach_whatsapp: normalizePeruPhone(productObj.coachWhatsapp || ''),
    badge_text: productObj.badgeText || '',
    in_stock: productObj.inStock !== false,
    active: productObj.active !== false,
    sort_order: Number(productObj.sortOrder) || 10,
  };
  const { data, error } = await supabase.from('products').upsert(row).select().single();
  if (error) throw error;
  return dbToProduct(data);
}

export async function deleteCloudProduct(productId) {
  if (!supabase || !productId) return;
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

export async function incrementProductClick(productId) {
  if (!supabase || !productId) return;
  try {
    const { data } = await supabase
      .from('products')
      .select('clicks_count')
      .eq('id', productId)
      .single();
    const nextVal = (Number(data?.clicks_count) || 0) + 1;
    await supabase.from('products').update({ clicks_count: nextVal }).eq('id', productId);
  } catch {
    // Métrica no bloqueante
  }
}

export async function saveCloudSetting(key, value) {
  if (!supabase || !key) return;
  const { error } = await supabase.from('app_settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/* --------------------------------------------------------------------------
   8. RPCs DE SERVIDOR: CLIMA ANTI-FARMEO, RECLAMOS Y GEMAS
   -------------------------------------------------------------------------- */
export async function submitWeatherReportRpc({ playerId, clubId, conditionKey }) {
  if (!supabase) {
    return { ok: true, gems_awarded: 0, message: 'Estado actualizado en modo local.' };
  }
  const { data, error } = await supabase.rpc('submit_club_weather_report', {
    p_player_id: playerId,
    p_club_id: clubId,
    p_condition_key: conditionKey,
  });
  if (error) throw error;
  return data;
}

export async function submitOfficialComplaintRpc(payload) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('create_official_complaint', {
    p_player_id: payload.playerId || null,
    p_full_name: payload.fullName,
    p_doc_type: payload.docType,
    p_doc_number: payload.docNumber,
    p_email: payload.email,
    p_phone: normalizePeruPhone(payload.phone || ''),
    p_claim_type: payload.claimType,
    p_amount: payload.amount || '',
    p_detail: payload.detail,
    p_consumer_request: payload.consumerRequest || '',
  });
  if (error) throw error;
  return data;
}

export async function insertGemLedgerEntry({ playerId, type, amount, title, detail = '' }) {
  if (!supabase || !playerId) return;
  await supabase.from('gem_ledger').insert({
    player_id: playerId,
    type,
    amount: Number(amount) || 0,
    title,
    detail,
  });
}

export async function fetchPlayerGemLedger(playerId) {
  if (!supabase || !playerId) return [];
  const { data } = await supabase
    .from('gem_ledger')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(40);
  return (data || []).map((r) => ({
    id: `lg-${r.id}`,
    type: r.type,
    amount: Number(r.amount) || 0,
    title: r.title,
    detail: r.detail || '',
    date: formatPeruDate(r.created_at, false),
  }));
}

/* --------------------------------------------------------------------------
   9. NOTIFICACIONES PUSH SEGURAS (VÍA SERVIDOR VERCEL /api/push)
   -------------------------------------------------------------------------- */
export async function sendPushNotification({
  targetPlayerIds = [],
  title = 'TOTAL TENIS',
  message = '',
  path = '/',
}) {
  try {
    const cleanIds = Array.from(new Set((targetPlayerIds || []).filter(Boolean).map(String)));
    if (!cleanIds.length || !message) return { skipped: true };

    const res = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPlayerIds: cleanIds,
        title,
        message,
        path,
      }),
    });
    return await res.json().catch(() => ({ ok: res.ok }));
  } catch {
    return { ok: false };
  }
}

/* --------------------------------------------------------------------------
   10. SUSCRIPCIÓN REALTIME EN VIVO ENTRE TODOS LOS DISPOSITIVOS
   -------------------------------------------------------------------------- */
export function subscribeToCloudRealtime(handlers = {}) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('total-tenis-live-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
      handlers.onProfileChange?.(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, (payload) => {
      handlers.onChallengeChange?.(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, (payload) => {
      handlers.onTournamentChange?.(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, (payload) => {
      handlers.onClubChange?.(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coaches' }, (payload) => {
      handlers.onCoachChange?.(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      handlers.onProductChange?.(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
      handlers.onSettingChange?.(payload);
    })
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      // ignore
    }
  };
}
