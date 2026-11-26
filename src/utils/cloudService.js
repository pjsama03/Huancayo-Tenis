import { supabase } from '../supabaseClient';

export const isCloudReady = Boolean(supabase);

const SITE_ORIGIN = 'https://huancayo-tenis.vercel.app';
const R2_BASE = 'https://pub-b9f6464ba7f04b679c870f63fb7997ff.r2.dev';
const PERU_TZ = 'America/Lima';
const AUTO_CONFIRM_HOURS = 24;
const MAX_CHALLENGES_HISTORY = 500;

function resolveVideoUrl(url = '') {
  if (typeof url !== 'string' || !url) return '';
  if (url.startsWith('/assets/video-')) {
    return `${R2_BASE}/${url.replace(/^\/assets\//, '')}`;
  }
  return url;
}

const CLUB_VISUAL_FALLBACKS = {
  'club-country': {
    logo: '/assets/club-country-huancas.png',
    cover: '/assets/sede-country-club.png',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Country+Club+Los+Huancas+Huancayo',
    gallery: [
      { id: 'cc-1', title: 'Cancha Central de Arcilla', image: '/assets/sede-country-club.png', url: '/assets/sede-country-club.png' },
      { id: 'cc-2', title: 'Copa Los Huancas · Pista 1', image: '/assets/torneo-apertura.png', url: '/assets/torneo-apertura.png' },
      { id: 'cc-3', title: 'Superficie Polvo de Ladrillo', image: '/assets/perfil-bg-arcilla.png', url: '/assets/perfil-bg-arcilla.png' },
    ],
    rates: { diaRegular: 36, diaVip: 28, nocheRegular: 46, nocheVip: 38 },
    services: ['6 canchas profesionales de arcilla', 'Iluminación LED hasta 10:00 p. m.', 'Vestuarios y estacionamiento privado'],
    vipBenefits: ['Tarifa preferencial VIP: S/ 28 día · S/ 38 noche LED', 'Descuento especial en horas valle', 'Prioridad en canchas centrales'],
  },
  'club-romina': {
    logo: '/assets/club-romina-cutipa.png',
    cover: '/assets/sede-romina-cutipa.png',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Academia+de+Tenis+Romina+Cutipa+Huancayo',
    gallery: [
      { id: 'rc-1', title: 'Pista Principal San Carlos', image: '/assets/sede-romina-cutipa.png', url: '/assets/sede-romina-cutipa.png' },
      { id: 'rc-2', title: 'Canchas de Competencia', image: '/assets/torneo-altura.png', url: '/assets/torneo-altura.png' },
      { id: 'rc-3', title: 'Entrenamiento Técnico', image: '/assets/portada-tips-semana.png', url: '/assets/portada-tips-semana.png' },
    ],
    rates: { diaRegular: 32, diaVip: 24, nocheRegular: 42, nocheVip: 34 },
    services: ['4 canchas de arcilla rápida con drenaje', 'Iluminación LED antideslumbrante', 'Zona de calentamiento físico'],
    vipBenefits: ['Tarifa preferencial VIP: S/ 24 día · S/ 34 noche LED', 'Tarifa Socio en clases grupales', 'Mañanas activas VIP a S/ 16/h'],
  },
  'club-tauro': {
    logo: '/assets/club-tauro.png',
    cover: '/assets/sede-club-tauro.png',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tauro+Tenis+Huancayo',
    gallery: [
      { id: 'tt-1', title: 'Canchas Club Tauro Tenis', image: '/assets/sede-club-tauro.png', url: '/assets/sede-club-tauro.png' },
      { id: 'tt-2', title: 'Torneos Nocturnos', image: '/assets/torneo-dobles-valle.png', url: '/assets/torneo-dobles-valle.png' },
      { id: 'tt-3', title: 'Arcilla al Atardecer', image: '/assets/bienvenida-hero-claro.png', url: '/assets/bienvenida-hero-claro.png' },
    ],
    rates: { diaRegular: 30, diaVip: 22, nocheRegular: 40, nocheVip: 32 },
    services: ['3 canchas de arcilla compacta', 'Torres LED nocturnas', 'Estacionamiento y terraza social'],
    vipBenefits: ['Tarifa preferencial VIP: S/ 22 día · S/ 32 noche LED', 'Promo Mediodía VIP S/ 15/h', 'Acceso preferente a relámpagos'],
  },
  'club-inkas': {
    logo: '/assets/club-los-inkas.png',
    cover: '/assets/sede-los-inkas.png',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Club+Los+Inkas+Huancayo+Tenis',
    gallery: [
      { id: 'li-1', title: 'Canchas Campestres Los Inkas', image: '/assets/sede-los-inkas.png', url: '/assets/sede-los-inkas.png' },
      { id: 'li-2', title: 'Vista Abierta al Valle', image: '/assets/bienvenida-hero-claro.png', url: '/assets/bienvenida-hero-claro.png' },
      { id: 'li-3', title: 'Cancha 1 Oficial', image: '/assets/torneo-altura.png', url: '/assets/torneo-altura.png' },
    ],
    rates: { diaRegular: 30, diaVip: 22, nocheRegular: 38, nocheVip: 30 },
    services: ['4 canchas campestres de arcilla', 'LED en Canchas 1 y 2', 'Áreas verdes y zona familiar'],
    vipBenefits: ['Tarifa preferencial VIP: S/ 22 día · S/ 30 noche LED', 'Tarifa Plana VIP S/ 14/h Mar–Mié', 'Descuento en clínicas de dobles'],
  },
};
CLUB_VISUAL_FALLBACKS['club-cutipa'] = CLUB_VISUAL_FALLBACKS['club-romina'];

const COACH_PHOTO_FALLBACKS = {
  'coach-romina': '/assets/sede-romina-cutipa.png',
  'coach-rodrigo': '/assets/sede-country-club.png',
  'coach-carlos': '/assets/sede-club-tauro.png',
  'coach-diego': '/assets/sede-los-inkas.png',
  'coach-andrea': '/assets/sede-los-inkas.png',
};

function getClubFallback(clubId, clubName = '') {
  if (CLUB_VISUAL_FALLBACKS[clubId]) return CLUB_VISUAL_FALLBACKS[clubId];
  const l = String(clubName || '').toLowerCase();
  if (l.includes('huancas') || l.includes('country')) return CLUB_VISUAL_FALLBACKS['club-country'];
  if (l.includes('romina') || l.includes('cutipa')) return CLUB_VISUAL_FALLBACKS['club-romina'];
  if (l.includes('tauro')) return CLUB_VISUAL_FALLBACKS['club-tauro'];
  if (l.includes('inka') || l.includes('inca')) return CLUB_VISUAL_FALLBACKS['club-inkas'];
  return {
    logo: '/assets/logo-total-tenis.png',
    cover: '/assets/torneo-apertura.png',
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clubName || 'Club Tenis'} Huancayo`)}`,
    gallery: [{ id: 'def-1', title: 'Cancha Oficial', image: '/assets/torneo-apertura.png', url: '/assets/torneo-apertura.png' }],
    rates: { diaRegular: 32, diaVip: 25, nocheRegular: 42, nocheVip: 34 },
    services: ['Canchas de arcilla', 'Iluminación LED', 'Estacionamiento'],
    vipBenefits: ['Tarifa preferencial presentando tu Carnet 3D VIP'],
  };
}

function normalizeClubGallery(rawGallery, fallbackGallery, coverUrl) {
  const src = Array.isArray(rawGallery) && rawGallery.length > 0 ? rawGallery : fallbackGallery;
  const list = (src || [])
    .map((item, idx) => {
      if (typeof item === 'string' && item.trim()) {
        return { id: `gal-${idx}`, title: `Foto ${idx + 1}`, caption: `Foto ${idx + 1}`, image: item.trim(), url: item.trim() };
      }
      if (item && (item.image || item.url)) {
        const u = item.url || item.image;
        return {
          id: item.id || `gal-${idx}`,
          title: item.title || item.caption || `Vista ${idx + 1}`,
          caption: item.caption || item.title || `Vista ${idx + 1}`,
          image: u,
          url: u,
        };
      }
      return null;
    })
    .filter(Boolean);
  return list.length ? list : coverUrl ? [{ id: 'gal-cover', title: 'Vista Principal', caption: 'Vista Principal', image: coverUrl, url: coverUrl }] : [];
}

const inFlightLocks = new Set();
export async function runWithLock(lockKey, asyncFn) {
  if (inFlightLocks.has(lockKey)) return { locked: true, data: null };
  inFlightLocks.add(lockKey);
  try {
    return { locked: false, data: await asyncFn() };
  } finally {
    inFlightLocks.delete(lockKey);
  }
}

/* --------------------------------------------------------------------------
   1. UTILIDADES PERÚ + PISO DE CATEGORÍA + TUTELA WHATSAPP
   -------------------------------------------------------------------------- */
export function normalizePeruPhone(raw = '') {
  const d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('51') && d.length === 11) return `+${d}`;
  if (d.length === 9 && d.startsWith('9')) return `+51${d}`;
  if (d.length >= 10) return `+${d}`;
  return d;
}

export function buildWhatsappLink(rawPhone, message = '') {
  const n = normalizePeruPhone(rawPhone).replace(/\D/g, '');
  if (!n) return '';
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function getEffectiveContactPhone(player, allPlayers = []) {
  if (!player) return '';
  if (player.isTutelado && player.tutorId) {
    const tutor = (allPlayers || []).find((p) => p.id === player.tutorId);
    if (tutor?.whatsapp) return tutor.whatsapp;
  }
  return player.whatsapp || '';
}

export function getCategoryFloorPoints(points) {
  const pts = Number(points) || 0;
  if (pts >= 5000) return 5000;
  if (pts >= 4000) return 4000;
  if (pts >= 3000) return 3000;
  if (pts >= 2000) return 2000;
  if (pts >= 1000) return 1000;
  if (pts >= 300) return 300;
  return 0;
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
  const iso = challenge.liveScore?._meta?.proposedAt || challenge.createdAt;
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() >= AUTO_CONFIRM_HOURS * 3600 * 1000;
}

export function hoursLeftForAutoConfirm(challenge) {
  if (!challenge || challenge.status !== 'SCORE_PROPOSED') return 0;
  const iso = challenge.liveScore?._meta?.proposedAt || challenge.createdAt;
  if (!iso) return AUTO_CONFIRM_HOURS;
  const rem = AUTO_CONFIRM_HOURS * 3600 * 1000 - (Date.now() - new Date(iso).getTime());
  return Math.max(0, Math.ceil(rem / (3600 * 1000)));
}

/* --------------------------------------------------------------------------
   2. ONESIGNAL v16
   -------------------------------------------------------------------------- */
export function linkOneSignalUser(playerId) {
  if (typeof window === 'undefined' || !playerId) return;
  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try { await OneSignal.login(String(playerId)); } catch {}
    });
  } catch {}
}

export function unlinkOneSignalUser() {
  if (typeof window === 'undefined') return;
  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try { await OneSignal.logout(); } catch {}
    });
  } catch {}
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
        } catch { resolve(false); }
      });
    } catch { resolve(false); }
  });
}

/* --------------------------------------------------------------------------
   3. COMPRESIÓN + SUBIDA A SUPABASE STORAGE ('media')
   -------------------------------------------------------------------------- */
export async function compressImageToBlob(fileOrDataUrl, maxSide = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objUrl = null;
    const clean = () => { if (objUrl) { try { URL.revokeObjectURL(objUrl); } catch {} } };

    img.onload = () => {
      try {
        let { naturalWidth: w, naturalHeight: h } = img;
        if (!w || !h) { clean(); return reject(new Error('Imagen inválida')); }
        if (w > maxSide || h > maxSide) {
          if (w >= h) { h = Math.round((h * maxSide) / w); w = maxSide; }
          else { w = Math.round((w * maxSide) / h); h = maxSide; }
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        c.toBlob((blob) => {
          clean(); c.width = 0; c.height = 0;
          if (blob) resolve(blob); else reject(new Error('Error comprimiendo imagen'));
        }, 'image/jpeg', quality);
      } catch (err) { clean(); reject(err); }
    };
    img.onerror = () => { clean(); reject(new Error('No se pudo cargar la imagen')); };

    if (typeof fileOrDataUrl === 'string') {
      if (/^https?:\/\//i.test(fileOrDataUrl)) img.crossOrigin = 'anonymous';
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob) {
      objUrl = URL.createObjectURL(fileOrDataUrl);
      img.src = objUrl;
    } else reject(new Error('Formato no soportado'));
  });
}

export async function uploadCompressedMedia(fileOrDataUrl, folder = 'avatars', entityId = 'item') {
  const blob = await compressImageToBlob(fileOrDataUrl, 800, 0.8);
  if (!supabase) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('Error leyendo imagen'));
      r.readAsDataURL(blob);
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
   4. AUTH SUPABASE
   -------------------------------------------------------------------------- */
export async function getCloudSession() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    return error ? null : data?.session || null;
  } catch { return null; }
}

export async function signUpCloudAccount({ email, password, metadata = {} }) {
  if (!supabase) throw new Error('Conexión en la nube no disponible');
  const { data, error } = await supabase.auth.signUp({
    email: String(email || '').trim().toLowerCase(),
    password,
    options: { data: metadata, emailRedirectTo: SITE_ORIGIN },
  });
  if (error) throw error;
  return data;
}

export async function signInCloudAccount({ email, password }) {
  if (!supabase) throw new Error('Conexión en la nube no disponible');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function sendCloudPasswordReset(email) {
  if (!supabase) throw new Error('Conexión en la nube no disponible');
  const { error } = await supabase.auth.resetPasswordForEmail(
    String(email || '').trim().toLowerCase(),
    { redirectTo: SITE_ORIGIN }
  );
  if (error) throw error;
  return true;
}

export async function signOutCloudAccount() {
  unlinkOneSignalUser();
  if (!supabase) return;
  try { await supabase.auth.signOut(); } catch {}
}

export function onCloudAuthStateChange(cb) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((ev, session) => cb(ev, session));
  return () => data?.subscription?.unsubscribe();
}

/* --------------------------------------------------------------------------
   5. CONVERSORES SQL <-> REACT (TUTELA + EMANCIPACIÓN + ÁRBITRO + REPROGRAMACIÓN)
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
    points: Number(row.points) || 0,
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
    isTutelado: Boolean(row.is_tutelado),
    tutorId: row.tutor_id || null,
    tutorName: row.tutor_name || '',
    isTutorOnly: Boolean(row.is_tutor_only),
    tutelaAcceptedAt: row.tutela_accepted_at || null,
    emancipationCode: row.emancipation_code || '',
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
  if (p.points !== undefined) out.points = Math.max(0, Number(p.points) || 0);
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
  if (p.isTutelado !== undefined) out.is_tutelado = Boolean(p.isTutelado);
  if (p.tutorId !== undefined) out.tutor_id = p.tutorId;
  if (p.tutorName !== undefined) out.tutor_name = p.tutorName || '';
  if (p.isTutorOnly !== undefined) out.is_tutor_only = Boolean(p.isTutorOnly);
  if (p.tutelaAcceptedAt !== undefined) out.tutela_accepted_at = p.tutelaAcceptedAt;
  if (p.emancipationCode !== undefined) out.emancipation_code = p.emancipationCode || null;
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
    judgeName: meta.judgeName || '',
    judgeSubmitted: Boolean(meta.judgeSubmitted),
    confirmations: meta.confirmations || { a: false, b: false },
    pendingReschedule: meta.pendingReschedule || null,
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
    c.judgeName !== undefined ||
    c.judgeSubmitted !== undefined ||
    c.confirmations !== undefined ||
    c.pendingReschedule !== undefined ||
    c.ballsAgreement !== undefined ||
    c.rescheduleCount !== undefined
  ) {
    const baseLive = c.liveScore && typeof c.liveScore === 'object' ? { ...c.liveScore } : {};
    const nextMeta = { ...(baseLive._meta || {}) };
    if (c.status === 'SCORE_PROPOSED' && !nextMeta.proposedAt) nextMeta.proposedAt = new Date().toISOString();
    if (c.judgeId !== undefined) nextMeta.judgeId = c.judgeId;
    if (c.judgeName !== undefined) nextMeta.judgeName = c.judgeName;
    if (c.judgeSubmitted !== undefined) nextMeta.judgeSubmitted = Boolean(c.judgeSubmitted);
    if (c.confirmations !== undefined) nextMeta.confirmations = c.confirmations;
    if (c.pendingReschedule !== undefined) nextMeta.pendingReschedule = c.pendingReschedule;
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
  const logo = row.logo_url || fb.logo;
  const cover = row.cover_url || fb.cover;
  const maps = row.maps_url || fb.mapsUrl;
  const gallery = normalizeClubGallery(row.gallery, fb.gallery, cover);
  const rates = row.rates && Object.keys(row.rates).length > 0 ? row.rates : fb.rates;
  const condRaw = row.weather_condition || 'seco';
  const cond = condRaw === 'humedad' ? 'humeda' : condRaw;
  const videos = Array.isArray(row.videos)
    ? row.videos.map((v) => ({ ...v, url: resolveVideoUrl(v.url || v.src || '') }))
    : [];

  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name || row.name,
    district: row.district || 'Huancayo',
    address: row.address || '',
    hours: row.hours || '06:00 a. m. – 10:00 p. m.',
    surface: row.surface || 'Arcilla',
    courtsCount: Number(row.courts_count) || 4,
    mapsUrl: maps,
    googleMapsUrl: maps,
    whatsapp: row.whatsapp || '',
    logo,
    logoUrl: logo,
    cover,
    coverUrl: cover,
    banner: cover,
    gallery,
    galeria: gallery,
    videos,
    rates,
    tarifas: rates,
    dayRate: Number(rates.diaRegular ?? rates.day) || 32,
    vipDayRate: Number(rates.diaVip ?? rates.vipDay) || 24,
    nightRate: Number(rates.nocheRegular ?? rates.night) || 42,
    vipNightRate: Number(rates.nocheVip ?? rates.vipNight) || 34,
    bookingUrl: rates.bookingUrl || '',
    vipBookingCode: rates.bookingVipCode || '',
    services: Array.isArray(row.services) && row.services.length > 0 ? row.services : fb.services,
    vipBenefits: Array.isArray(row.vip_benefits) && row.vip_benefits.length > 0 ? row.vip_benefits : fb.vipBenefits,
    promos: Array.isArray(row.promos) ? row.promos : [],
    internalEvents: Array.isArray(row.internal_events) ? row.internal_events : [],
    climaBase: { conditionKey: cond, updatedAt: row.weather_updated_at || null, reportedBy: row.weather_reported_by || '' },
    active: row.active !== false,
  };
}

export function dbToCoach(row) {
  if (!row) return null;
  const photo = row.photo_url || COACH_PHOTO_FALLBACKS[row.id] || '/assets/sede-country-club.png';
  const accentMap = { emerald: '#00DC7D', gold: '#E5C16C', clay: '#DE8566', royal: '#60A5FA' };
  const accentTheme = row.accent_theme || 'emerald';
  const videos = Array.isArray(row.videos)
    ? row.videos.map((v) => {
        const u = resolveVideoUrl(v.url || v.src || '');
        return { ...v, url: u, src: u, isFree: !(Number(v.gemsCost) > 0) && !v.isExclusive };
      })
    : [];

  return {
    id: row.id,
    ownerProfileId: row.owner_profile_id || '',
    clubId: row.club_id || '',
    clubName: row.club_name || '',
    name: row.name,
    title: row.title || 'Entrenador Oficial',
    role: row.title || 'Entrenador Oficial',
    bio: row.bio || '',
    photo,
    photoUrl: photo,
    portrait: photo,
    fullBodyPhoto: photo,
    coverUrl: row.cover_url || photo,
    accentTheme,
    accent: accentMap[accentTheme] || '#00DC7D',
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    baseRate: Number(row.base_rate) || 60,
    vipRate: Number(row.vip_rate) || 50,
    freeSlotToday: row.free_slot_today || '',
    availableToday: Boolean(String(row.free_slot_today || '').trim()),
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    videos,
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
  const banner = row.banner_url || '/assets/torneo-apertura.png';
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
    banner,
    bannerUrl: banner,
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
   6. CARGA INICIAL + CRUD EN VIVO + TOPE 500 PARTIDOS + TUTELA / EMANCIPACIÓN
   -------------------------------------------------------------------------- */
export async function fetchAllCloudState(fallbackSeeds = {}) {
  if (!supabase) return null;
  const [pRes, clRes, coRes, chRes, tRes, prRes, cpRes, stRes] = await Promise.all([
    supabase.from('profiles').select('*').order('points', { ascending: false }),
    supabase.from('clubs').select('*'),
    supabase.from('coaches').select('*'),
    supabase.from('challenges').select('*').order('created_at', { ascending: false }).limit(MAX_CHALLENGES_HISTORY),
    supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').order('sort_order', { ascending: true }),
    supabase.from('complaints').select('*').order('created_at', { ascending: false }),
    supabase.from('app_settings').select('*'),
  ]);

  let players = (pRes.data || []).map(dbToPlayer);
  let clubs = (clRes.data || []).map(dbToClub);
  let coaches = (coRes.data || []).map(dbToCoach);
  const challenges = (chRes.data || []).map(dbToChallenge);
  let tournaments = (tRes.data || []).map(dbToTournament);
  let products = (prRes.data || []).map(dbToProduct);
  const complaints = cpRes.data || [];

  if (!pRes.error && players.length === 0 && fallbackSeeds.players?.length) {
    const { data } = await supabase.from('profiles').upsert(fallbackSeeds.players.map((p) => playerToDb({ ...p, isDemo: true }))).select();
    if (data) players = data.map(dbToPlayer);
  }
  if (!clRes.error && clubs.length === 0 && fallbackSeeds.clubs?.length) {
    const rows = fallbackSeeds.clubs.map((c) => {
      const fb = getClubFallback(c.id, c.name);
      return {
        id: c.id, name: c.name, short_name: c.shortName || c.name, district: c.district || 'Huancayo',
        address: c.address || '', hours: c.hours || '06:00 a. m. – 10:00 p. m.', surface: c.surface || 'Arcilla',
        courts_count: Number(c.courtsCount) || 4, maps_url: c.mapsUrl || fb.mapsUrl, whatsapp: normalizePeruPhone(c.whatsapp || ''),
        cover_url: c.coverUrl || c.cover || fb.cover, logo_url: c.logoUrl || c.logo || fb.logo,
        gallery: normalizeClubGallery(c.gallery, fb.gallery, fb.cover), videos: c.videos || [],
        rates: c.rates || fb.rates, services: c.services || fb.services, vip_benefits: c.vipBenefits || fb.vipBenefits,
        promos: c.promos || [], internal_events: c.internalEvents || [], weather_condition: 'seco', active: true,
      };
    });
    const { data } = await supabase.from('clubs').upsert(rows).select();
    if (data) clubs = data.map(dbToClub);
  }
  if (!coRes.error && coaches.length === 0 && fallbackSeeds.coaches?.length) {
    const rows = fallbackSeeds.coaches.map((co) => ({
      id: co.id, owner_profile_id: co.ownerProfileId || '', club_id: co.clubId || '', club_name: co.clubName || '',
      name: co.name, title: co.title || 'Entrenador Oficial', bio: co.bio || '',
      photo_url: co.photoUrl || co.photo || COACH_PHOTO_FALLBACKS[co.id] || '',
      cover_url: co.coverUrl || COACH_PHOTO_FALLBACKS[co.id] || '', accent_theme: co.accentTheme || 'emerald',
      specialties: Array.isArray(co.specialties) ? co.specialties : [], base_rate: Number(co.baseRate) || 60,
      vip_rate: Number(co.vipRate) || 50, free_slot_today: co.freeSlotToday || '',
      gallery: co.gallery || [], schedule: co.schedule || [], videos: co.videos || [],
      groups: co.groups || [], packages: co.packages || [], students: co.students || [],
      whatsapp: normalizePeruPhone(co.whatsapp || ''), featured: Boolean(co.featured), active: true,
    }));
    const { data } = await supabase.from('coaches').upsert(rows).select();
    if (data) coaches = data.map(dbToCoach);
  }
  if (!tRes.error && tournaments.length === 0 && fallbackSeeds.tournaments?.length) {
    const rows = fallbackSeeds.tournaments.map((t) => ({
      id: t.id, name: t.name, short_name: t.shortName || t.name, club_id: t.clubId || '', club_name: t.clubName || '',
      surface: t.surface || 'Arcilla', status: t.status || 'OPEN', date_label: t.dateLabel || '',
      category_label: t.categoryLabel || 'Abierto', draw_size: Number(t.drawSize) || 16,
      min_players: Number(t.minPlayers ?? t.minPlayersForDraw) || 8, entry_fee: Number(t.entryFee) || 45,
      includes_balls: t.includesBalls !== false, has_consolation: t.hasConsolation !== false,
      includes_items: t.includesItems || [], banner_url: t.bannerUrl || t.banner || '/assets/torneo-apertura.png',
      prizes: t.prizes || {}, participants_ids: t.participantsIds || [], pending_payment_ids: t.pendingPaymentIds || [],
      bracket_results: t.bracketResults || {},
    }));
    const { data } = await supabase.from('tournaments').upsert(rows).select();
    if (data) tournaments = data.map(dbToTournament);
  }
  if (!prRes.error && products.length === 0 && fallbackSeeds.products?.length) {
    const rows = fallbackSeeds.products.map((pr, idx) => ({
      id: pr.id, channel: pr.channel || 'OWN_STOCK', name: pr.name, subtitle: pr.subtitle || '',
      description: pr.description || '', image_url: pr.imageUrl || pr.image || '',
      price_soles: Number(pr.priceSoles ?? pr.price) || 0, old_price_soles: pr.oldPriceSoles ? Number(pr.oldPriceSoles) : null,
      vip_price_soles: pr.vipPriceSoles ? Number(pr.vipPriceSoles) : null, gems_cost: Number(pr.gemsCost) || 0,
      external_url: pr.externalUrl || '', coach_id: pr.coachId || '', coach_whatsapp: normalizePeruPhone(pr.coachWhatsapp || ''),
      badge_text: pr.badgeText || '', in_stock: pr.inStock !== false, active: true, sort_order: idx + 1,
    }));
    const { data } = await supabase.from('products').upsert(rows).select();
    if (data) products = data.map(dbToProduct);
  }

  const settingsMap = {};
  (stRes.data || []).forEach((s) => { settingsMap[s.key] = s.value; });

  return {
    players, clubs, coaches, challenges, tournaments, products, complaints,
    seasonSnapshots: settingsMap.season_snapshots || null,
    sponsorsConfig: settingsMap.sponsors_config || null,
  };
}

/* Tope automático de 500 partidos en `challenges` (mantiene intacto ELO/récord en `profiles`) */
export async function enforceChallengeHistoryCap(maxCount = MAX_CHALLENGES_HISTORY) {
  if (!supabase) return 0;
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('id, status, created_at')
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data) || data.length <= maxCount) return 0;

    const excess = data
      .slice(maxCount)
      .filter((r) => r.status === 'FINISHED' || r.status === 'DECLINED' || r.status === 'EXPIRED_NO_RESULT')
      .map((r) => r.id);

    if (excess.length === 0) return 0;
    const { error: delErr } = await supabase.from('challenges').delete().in('id', excess);
    if (delErr) return 0;
    return excess.length;
  } catch {
    return 0;
  }
}

export async function upsertCloudPlayer(playerObj) {
  if (!supabase || !playerObj?.id) return null;
  const { data, error } = await supabase.from('profiles').upsert(playerToDb(playerObj)).select().single();
  if (error) throw error;
  return dbToPlayer(data);
}

export async function applyCategoryFloorResetToPlayers(players = []) {
  const updated = (players || []).map((p) => {
    if (p.isTutorOnly) return p;
    return { ...p, points: getCategoryFloorPoints(p.points) };
  });
  if (supabase && updated.length > 0) {
    const rows = updated.filter((p) => !p.isTutorOnly).map((p) => playerToDb({ id: p.id, points: p.points }));
    if (rows.length > 0) await supabase.from('profiles').upsert(rows);
  }
  return updated;
}

export function generateEmancipationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i += 1) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `TT-LIB-${suffix}`;
}

export async function createTuteladoProfile(tutorPlayer, childData) {
  if (!tutorPlayer?.id) throw new Error('Sesión de padre/madre requerida.');
  const childObj = {
    id: `tut-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    authId: null,
    name: String(childData.name || '').trim(),
    email: '',
    whatsapp: normalizePeruPhone(tutorPlayer.whatsapp || ''),
    showWhatsapp: true,
    age: Math.min(17, Math.max(6, Number(childData.age) || 14)),
    division: childData.division || 'Varones',
    clubId: childData.clubId || tutorPlayer.clubId || 'independiente',
    clubName: childData.clubName || tutorPlayer.clubName || 'Independiente',
    points: Number(childData.initialPoints) || 600,
    wins: 0,
    losses: 0,
    streak: 0,
    calibrationPlayed: 0,
    gems: 50,
    isVip: false,
    vipStatus: 'STANDARD',
    isAdmin: false,
    isPaused: false,
    isDemo: false,
    isTutelado: true,
    tutorId: tutorPlayer.id,
    tutorName: tutorPlayer.name,
    isTutorOnly: false,
    tutelaAcceptedAt: new Date().toISOString(),
    emancipationCode: '',
    hand: childData.hand || 'Diestro',
    availability: childData.availability || 'Tardes y fines de semana',
    credentialId: `TT-JUV-${String(Date.now()).slice(-4)}`,
  };
  if (!supabase) return childObj;
  return upsertCloudPlayer(childObj);
}

export async function startMinorEmancipation(minorId) {
  const code = generateEmancipationCode();
  if (!supabase) return { id: minorId, emancipationCode: code };
  const { data, error } = await supabase
    .from('profiles')
    .update({ emancipation_code: code, updated_at: new Date().toISOString() })
    .eq('id', minorId)
    .select()
    .single();
  if (error) throw error;
  return dbToPlayer(data);
}

export async function claimEmancipatedProfile({ code, authId, email, whatsapp }) {
  if (!supabase) throw new Error('Requiere conexión en la nube.');
  const cleanCode = String(code || '').trim().toUpperCase();
  const { data: found, error: findErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('emancipation_code', cleanCode)
    .eq('is_tutelado', true)
    .maybeSingle();
  if (findErr || !found) throw new Error('Código de emancipación inválido o ya utilizado.');
  const { data: updated, error: updErr } = await supabase
    .from('profiles')
    .update({
      auth_id: authId,
      email: String(email || '').trim().toLowerCase(),
      whatsapp: normalizePeruPhone(whatsapp || ''),
      age: Math.max(18, Number(found.age) || 18),
      is_tutelado: false,
      tutor_id: null,
      tutor_name: '',
      emancipation_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', found.id)
    .select()
    .single();
  if (updErr) throw updErr;
  return dbToPlayer(updated);
}

export async function deleteCloudPlayer(playerId) {
  if (!supabase || !playerId) return;
  const { error } = await supabase.from('profiles').delete().eq('id', playerId);
  if (error) throw error;
}

export async function purgeDemoPlayers() {
  if (!supabase) return 0;
  const { data, error } = await supabase.from('profiles').delete().eq('is_demo', true).select('id');
  if (error) throw error;
  return data?.length || 0;
}

export async function upsertCloudChallenge(challengeObj) {
  if (!supabase || !challengeObj?.id) return null;
  const { data, error } = await supabase.from('challenges').upsert(challengeToDb(challengeObj)).select().single();
  if (error) throw error;
  if (challengeObj.status === 'FINISHED' || challengeObj.status === 'EXPIRED_NO_RESULT') {
    enforceChallengeHistoryCap(MAX_CHALLENGES_HISTORY).catch(() => {});
  }
  return dbToChallenge(data);
}

export async function deleteCloudChallenge(challengeId) {
  if (!supabase || !challengeId) return;
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
  if (error) throw error;
}

export async function upsertCloudTournament(t) {
  if (!supabase || !t?.id) return null;
  const row = {
    id: t.id, name: t.name, short_name: t.shortName || t.name, club_id: t.clubId || '', club_name: t.clubName || '',
    surface: t.surface || 'Arcilla', status: t.status || 'OPEN', date_label: t.dateLabel || '', category_label: t.categoryLabel || 'Abierto',
    draw_size: Number(t.drawSize) || 16, min_players: Number(t.minPlayers ?? t.minPlayersForDraw) || 8, entry_fee: Number(t.entryFee) || 45,
    includes_balls: t.includesBalls !== false, has_consolation: t.hasConsolation !== false, includes_items: t.includesItems || [],
    banner_url: t.bannerUrl || t.banner || '', prizes: t.prizes || {}, participants_ids: t.participantsIds || [],
    pending_payment_ids: t.pendingPaymentIds || [], bracket_results: t.bracketResults || {},
  };
  const { data, error } = await supabase.from('tournaments').upsert(row).select().single();
  if (error) throw error;
  return dbToTournament(data);
}

export async function deleteCloudTournament(id) {
  if (!supabase || !id) return;
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertCloudClub(clubObj) {
  if (!supabase || !clubObj?.id) return null;
  const fb = getClubFallback(clubObj.id, clubObj.name);
  const condRaw = clubObj.climaBase?.conditionKey || 'seco';
  const row = {
    id: clubObj.id, name: clubObj.name, short_name: clubObj.shortName || clubObj.name,
    district: clubObj.district || 'Huancayo', address: clubObj.address || '', hours: clubObj.hours || '06:00 a. m. – 10:00 p. m.',
    surface: clubObj.surface || 'Arcilla', courts_count: Number(clubObj.courtsCount) || 4,
    maps_url: clubObj.mapsUrl || clubObj.googleMapsUrl || fb.mapsUrl, whatsapp: normalizePeruPhone(clubObj.whatsapp || ''),
    cover_url: clubObj.coverUrl || clubObj.cover || clubObj.banner || fb.cover, logo_url: clubObj.logoUrl || clubObj.logo || fb.logo,
    gallery: clubObj.gallery || clubObj.galeria || fb.gallery, videos: Array.isArray(clubObj.videos) ? clubObj.videos : [],
    rates: clubObj.rates || clubObj.tarifas || fb.rates, services: clubObj.services || fb.services,
    vip_benefits: clubObj.vipBenefits || fb.vipBenefits, promos: clubObj.promos || [],
    internal_events: clubObj.internalEvents || [], weather_condition: condRaw === 'humedad' ? 'humeda' : condRaw,
    active: clubObj.active !== false, updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('clubs').upsert(row).select().single();
  if (error) throw error;
  return dbToClub(data);
}

export async function upsertCloudCoach(coachObj) {
  if (!supabase || !coachObj?.id) return null;
  const row = {
    id: coachObj.id, owner_profile_id: coachObj.ownerProfileId || '', club_id: coachObj.clubId || '',
    club_name: coachObj.clubName || '', name: coachObj.name, title: coachObj.title || coachObj.role || 'Entrenador Oficial',
    bio: coachObj.bio || '', photo_url: coachObj.photoUrl || coachObj.photo || coachObj.portrait || '',
    cover_url: coachObj.coverUrl || '', accent_theme: coachObj.accentTheme || 'emerald',
    specialties: Array.isArray(coachObj.specialties) ? coachObj.specialties : [], base_rate: Number(coachObj.baseRate) || 60,
    vip_rate: Number(coachObj.vipRate) || 50, free_slot_today: coachObj.freeSlotToday || '',
    gallery: Array.isArray(coachObj.gallery) ? coachObj.gallery : [], schedule: Array.isArray(coachObj.schedule) ? coachObj.schedule : [],
    videos: Array.isArray(coachObj.videos) ? coachObj.videos : [], groups: Array.isArray(coachObj.groups) ? coachObj.groups : [],
    packages: Array.isArray(coachObj.packages) ? coachObj.packages : [], students: Array.isArray(coachObj.students) ? coachObj.students : [],
    whatsapp: normalizePeruPhone(coachObj.whatsapp || ''), featured: Boolean(coachObj.featured),
    active: coachObj.active !== false, updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('coaches').upsert(row).select().single();
  if (error) throw error;
  return dbToCoach(data);
}

export async function incrementCoachMetric(coachId, field = 'profile_views') {
  if (!supabase || !coachId || (field !== 'profile_views' && field !== 'whatsapp_clicks')) return;
  try {
    const { data } = await supabase.from('coaches').select(field).eq('id', coachId).single();
    await supabase.from('coaches').update({ [field]: (Number(data?.[field]) || 0) + 1 }).eq('id', coachId);
  } catch {}
}

export async function upsertCloudProduct(p) {
  if (!supabase || !p?.id) return null;
  const row = {
    id: p.id, channel: p.channel || 'OWN_STOCK', name: p.name, subtitle: p.subtitle || '',
    description: p.description || '', image_url: p.imageUrl || p.image || '',
    price_soles: Number(p.priceSoles) || 0, old_price_soles: p.oldPriceSoles ? Number(p.oldPriceSoles) : null,
    vip_price_soles: p.vipPriceSoles ? Number(p.vipPriceSoles) : null, gems_cost: Number(p.gemsCost) || 0,
    external_url: p.externalUrl || '', coach_id: p.coachId || '', coach_whatsapp: normalizePeruPhone(p.coachWhatsapp || ''),
    badge_text: p.badgeText || '', in_stock: p.inStock !== false, active: p.active !== false, sort_order: Number(p.sortOrder) || 10,
  };
  const { data, error } = await supabase.from('products').upsert(row).select().single();
  if (error) throw error;
  return dbToProduct(data);
}

export async function deleteCloudProduct(id) {
  if (!supabase || !id) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementProductClick(productId) {
  if (!supabase || !productId) return;
  try {
    const { data } = await supabase.from('products').select('clicks_count').eq('id', productId).single();
    await supabase.from('products').update({ clicks_count: (Number(data?.clicks_count) || 0) + 1 }).eq('id', productId);
  } catch {}
}

export async function saveCloudSetting(key, value) {
  if (!supabase || !key) return;
  const { error } = await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/* --------------------------------------------------------------------------
   7. RPCs, PUSH Y REALTIME
   -------------------------------------------------------------------------- */
export async function submitWeatherReportRpc({ playerId, clubId, conditionKey }) {
  if (!supabase) return { ok: true, gems_awarded: 0, message: 'Actualizado localmente.' };
  const { data, error } = await supabase.rpc('submit_club_weather_report', {
    p_player_id: playerId, p_club_id: clubId, p_condition_key: conditionKey === 'humedad' ? 'humeda' : conditionKey,
  });
  if (error) throw error;
  return data;
}

export async function submitOfficialComplaintRpc(payload) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('create_official_complaint', {
    p_player_id: payload.playerId || null, p_full_name: payload.fullName, p_doc_type: payload.docType,
    p_doc_number: payload.docNumber, p_email: payload.email, p_phone: normalizePeruPhone(payload.phone || ''),
    p_claim_type: payload.claimType, p_amount: payload.amount || '', p_detail: payload.detail,
    p_consumer_request: payload.consumerRequest || '',
  });
  if (error) throw error;
  return data;
}

export async function insertGemLedgerEntry({ playerId, type, amount, title, detail = '' }) {
  if (!supabase || !playerId) return;
  await supabase.from('gem_ledger').insert({ player_id: playerId, type, amount: Number(amount) || 0, title, detail });
}

export async function fetchPlayerGemLedger(playerId) {
  if (!supabase || !playerId) return [];
  const { data } = await supabase.from('gem_ledger').select('*').eq('player_id', playerId).order('created_at', { ascending: false }).limit(40);
  return (data || []).map((r) => ({
    id: `lg-${r.id}`, type: r.type, amount: Number(r.amount) || 0, title: r.title, detail: r.detail || '', date: formatPeruDate(r.created_at, false),
  }));
}

export async function sendPushNotification({ targetPlayerIds = [], title = 'TOTAL TENIS', message = '', path = '/' }) {
  try {
    const cleanIds = Array.from(new Set((targetPlayerIds || []).filter(Boolean).map(String)));
    if (!cleanIds.length || !message) return { skipped: true };
    const res = await fetch('/api/push', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPlayerIds: cleanIds, title, message, path }),
    });
    return await res.json().catch(() => ({ ok: res.ok }));
  } catch { return { ok: false }; }
}

export function subscribeToCloudRealtime(handlers = {}) {
  if (!supabase) return () => {};
  const ch = supabase
    .channel('total-tenis-live-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (p) => handlers.onProfileChange?.(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, (p) => handlers.onChallengeChange?.(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, (p) => handlers.onTournamentChange?.(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, (p) => handlers.onClubChange?.(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coaches' }, (p) => handlers.onCoachChange?.(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (p) => handlers.onProductChange?.(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (p) => handlers.onSettingChange?.(p))
    .subscribe();
  return () => { try { supabase.removeChannel(ch); } catch {} };
}
