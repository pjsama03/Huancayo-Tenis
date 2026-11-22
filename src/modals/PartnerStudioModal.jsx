import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSETS,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import {
  INITIAL_CLUBS,
  getCategoryByPoints,
} from '../data/playersAndClubsData';
import {
  buildWhatsappLink,
  isCloudReady,
  uploadCompressedMedia,
  upsertCloudClub,
  upsertCloudCoach,
} from '../utils/cloudService';

/* ==========================================================================
   CONSTANTES Y TEMAS DE PERSONALIZACIÓN DEL ESTUDIO ALIADO B2B
   Contrato 100 % sincronizado con SedesView.jsx y Supabase.
   ========================================================================== */
const COACH_THEME_OPTIONS = [
  { id: 'emerald', label: 'Esmeralda', swatch: '#00DC7D' },
  { id: 'gold', label: 'Oro Champán', swatch: '#E5C16C' },
  { id: 'clay', label: 'Arcilla', swatch: '#DE8566' },
  { id: 'royal', label: 'Azul Estadio', swatch: '#60A5FA' },
];

const QUICK_FREE_SLOTS = [
  'Hoy · 05:00 p. m.',
  'Hoy · 06:00 p. m.',
  'Hoy · 07:00 p. m.',
  'Mañana · 08:00 a. m.',
  'Sábado · 09:00 a. m.',
  '',
];

const SPECIALTY_PRESETS = [
  'Técnica & Biomecánica',
  'Saque y Efecto',
  'Topspin en Arcilla',
  'Táctica Competitiva',
  'Desde Cero (5ª P / 5ª B)',
  'Damas Competitivo',
  'Senior +40',
  'Sparring Pre-Torneo',
];

const WEATHER_QUICK_OPTS = [
  { key: 'seco', label: 'Seca', color: '#00DC7D' },
  { key: 'humeda', label: 'Húmeda', color: '#38BDF8' },
  { key: 'llovizna', label: 'Llovizna', color: '#E5C16C' },
  { key: 'lluvia', label: 'Lluvia', color: '#F87171' },
];

function getAccentHex(themeId = 'emerald') {
  return (
    COACH_THEME_OPTIONS.find((t) => t.id === themeId || t.swatch === themeId)?.swatch ||
    '#00DC7D'
  );
}

function buildFallbackCoach(partner) {
  return {
    id: partner?.id || 'coach-romina',
    name: partner?.name || 'Romina Cutipa',
    clubId: partner?.clubId || 'club-romina',
    clubName: 'Academia Romina Cutipa',
    title: 'Head Coach · Directora de Academia',
    role: 'Head Coach · Directora de Academia',
    bio: 'Especialista en técnica limpia sobre arcilla, corrección de saque y táctica competitiva.',
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
    gallery: [
      { id: 'cg-1', url: ASSETS.portadaTipsSemana, caption: 'Corrección técnica en arcilla' },
      { id: 'cg-2', url: ASSETS.sedeRomina, caption: 'Academia Romina Cutipa' },
    ],
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
      {
        id: 'pv-2',
        title: 'Masterclass: Derecha pesada con Topspin',
        duration: '2:15',
        isFree: false,
        isExclusive: true,
        gemsCost: 45,
        url: ASSETS.videoCircuito2,
        src: ASSETS.videoCircuito2,
        poster: ASSETS.portadaAcademiaTv,
        active: true,
      },
    ],
    packages: [
      {
        id: 'pk-1',
        type: 'PRIVADA 1 A 1',
        name: 'Sesión Técnica Personalizada (60 min)',
        title: 'Sesión Técnica Personalizada (60 min)',
        desc: 'Diagnóstico + corrección en vivo + video corto de feedback.',
        price: 60,
        priceRegular: 60,
        vipPrice: 50,
        priceVip: 50,
        badge: 'MÁS PEDIDA',
        tag: 'MÁS PEDIDA',
      },
      {
        id: 'pk-2',
        type: 'PACK MENSUAL',
        name: 'Plan Pro 8 Clases Privadas / Mes',
        title: 'Plan Pro 8 Clases Privadas / Mes',
        desc: 'Seguimiento mensual de ascenso de categoría + video análisis.',
        price: 400,
        priceRegular: 400,
        vipPrice: 350,
        priceVip: 350,
        badge: 'AHORRA S/ 80',
        tag: 'AHORRA S/ 80',
      },
    ],
    groups: [
      {
        id: 'grp-1',
        day: 'Mié & Vie',
        time: '06:00 p. m.',
        label: 'Grupo Competitivo 5ª A / 4ª',
        price: 30,
        vipPrice: 25,
        spotsUsed: 3,
        spotsTotal: 4,
        spotsFilled: 3,
        spotsMax: 4,
      },
      {
        id: 'grp-2',
        day: 'Sáb',
        time: '09:30 a. m.',
        label: 'Clínica de Saque y Resto',
        price: 35,
        vipPrice: 28,
        spotsUsed: 2,
        spotsTotal: 4,
        spotsFilled: 2,
        spotsMax: 4,
      },
    ],
    schedule: [
      { id: 'hs-1', day: 'Hoy', time: '06:00 p. m.', status: 'open' },
      { id: 'hs-2', day: 'Mañana', time: '08:00 a. m.', status: 'open' },
      { id: 'hs-3', day: 'Jueves', time: '07:00 p. m.', status: 'open' },
      { id: 'hs-4', day: 'Sábado', time: '09:00 a. m.', status: 'open' },
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
      {
        id: 'st-2',
        name: 'Diego Torres',
        level: '4ª Cat.',
        groupName: 'Privada 1 a 1',
        whatsapp: '964223344',
        feeStatus: 'PENDIENTE',
        attendedToday: false,
      },
    ],
  };
}

function normalizeCoachForCloud(draft) {
  const accentHex = getAccentHex(draft.accentTheme || draft.accent);
  const freeSlot = String(draft.freeSlotToday || '').trim();
  const availToday = Boolean(freeSlot);

  // Sincronizar schedule con el turno libre de hoy + turnos propios + grupos
  const existingSchedule = Array.isArray(draft.schedule) ? draft.schedule : [];
  const mergedSchedule = [...existingSchedule];
  if (freeSlot) {
    const parts = freeSlot.split('·').map((s) => s.trim());
    const dayStr = parts[0] || 'Hoy';
    const timeStr = parts[1] || freeSlot;
    const alreadyExists = mergedSchedule.some(
      (s) => s.day === dayStr && s.time === timeStr
    );
    if (!alreadyExists) {
      mergedSchedule.unshift({
        id: `hs-free-${Date.now()}`,
        day: dayStr,
        time: timeStr,
        status: 'open',
      });
    }
  }

  return {
    ...draft,
    role: draft.title || draft.role || 'Entrenador Oficial',
    title: draft.title || draft.role || 'Entrenador Oficial',
    photo: draft.photoUrl || draft.photo || ASSETS.portadaTipsSemana,
    photoUrl: draft.photoUrl || draft.photo || ASSETS.portadaTipsSemana,
    accent: accentHex,
    availableToday: availToday,
    freeSlotToday: freeSlot,
    videos: (draft.videos || []).map((v) => ({
      ...v,
      url: v.url || v.src || ASSETS.videoCoachRomina,
      src: v.url || v.src || ASSETS.videoCoachRomina,
      isFree: !(Number(v.gemsCost) > 0) && !v.isExclusive,
    })),
    packages: (draft.packages || []).map((pk) => ({
      ...pk,
      title: pk.title || pk.name || 'Sesión Técnica',
      name: pk.title || pk.name || 'Sesión Técnica',
      priceRegular: Number(pk.priceRegular ?? pk.price ?? 60) || 60,
      price: Number(pk.priceRegular ?? pk.price ?? 60) || 60,
      priceVip: Number(pk.priceVip ?? pk.vipPrice ?? 50) || 50,
      vipPrice: Number(pk.priceVip ?? pk.vipPrice ?? 50) || 50,
      tag: pk.tag || pk.badge || '',
      badge: pk.tag || pk.badge || '',
    })),
    groups: (draft.groups || []).map((g) => ({
      ...g,
      spotsFilled: Number(g.spotsUsed ?? g.spotsFilled ?? 0),
      spotsMax: Number(g.spotsTotal ?? g.spotsMax ?? 4),
    })),
    schedule: mergedSchedule.slice(0, 12),
  };
}

function hydrateClubDraft(club) {
  const ratesObj = club?.rates || club?.tarifas || {};
  const rawGallery =
    Array.isArray(club?.gallery) && club.gallery.length > 0
      ? club.gallery
      : Array.isArray(club?.galeria)
      ? club.galeria
      : [];

  const diaRegular = Number(club?.dayRate ?? ratesObj.diaRegular ?? ratesObj.day) || 32;
  const diaVip = Number(club?.vipDayRate ?? ratesObj.diaVip ?? ratesObj.vipDay) || 24;
  const nocheRegular = Number(club?.nightRate ?? ratesObj.nocheRegular ?? ratesObj.night) || 42;
  const nocheVip = Number(club?.vipNightRate ?? ratesObj.nocheVip ?? ratesObj.vipNight) || 34;
  const bookingUrl = club?.bookingUrl || ratesObj.bookingUrl || '';
  const bookingVipCode = club?.vipBookingCode || ratesObj.bookingVipCode || '';

  const rawCond = club?.climaBase?.conditionKey || 'seco';
  const normalizedCond = rawCond === 'humedad' ? 'humeda' : rawCond;

  return {
    ...club,
    hours: club?.hours || '06:00 a. m. – 10:00 p. m.',
    courtsCount: Number(club?.courtsCount) || 4,
    whatsapp: club?.whatsapp || '',
    mapsUrl: club?.mapsUrl || club?.googleMapsUrl || '',
    climaBase: { ...(club?.climaBase || {}), conditionKey: normalizedCond },
    dayRate: diaRegular,
    vipDayRate: diaVip,
    nightRate: nocheRegular,
    vipNightRate: nocheVip,
    bookingUrl,
    vipBookingCode: bookingVipCode,
    rates: {
      diaRegular,
      diaVip,
      nocheRegular,
      nocheVip,
      day: diaRegular,
      vipDay: diaVip,
      night: nocheRegular,
      vipNight: nocheVip,
      bookingUrl,
      bookingVipCode,
    },
    gallery: rawGallery.map((g, idx) =>
      typeof g === 'string'
        ? { id: `cg-${idx}`, title: `Vista ${idx + 1}`, caption: `Vista ${idx + 1}`, image: g, url: g }
        : {
            id: g.id || `cg-${idx}`,
            title: g.title || g.caption || `Vista ${idx + 1}`,
            caption: g.caption || g.title || `Vista ${idx + 1}`,
            image: g.image || g.url,
            url: g.url || g.image,
          }
    ),
    videos: Array.isArray(club?.videos) ? club.videos : [],
    videoTourUrl: club?.videos?.[0]?.url || '',
    vipBenefits:
      Array.isArray(club?.vipBenefits) && club.vipBenefits.length > 0
        ? club.vipBenefits
        : [
            'Tarifa preferencial VIP en alquiler de cancha',
            'Prioridad en horarios estelares',
          ],
    promos:
      Array.isArray(club?.promos) && club.promos.length > 0
        ? club.promos
        : Array.isArray(club?.promosHorasValle)
        ? club.promosHorasValle
        : [],
    internalEvents:
      Array.isArray(club?.internalEvents) && club.internalEvents.length > 0
        ? club.internalEvents
        : Array.isArray(club?.torneosInternos)
        ? club.torneosInternos
        : [],
  };
}

function normalizeClubForCloud(draft) {
  const diaRegular = Number(draft.rates?.diaRegular ?? draft.dayRate) || 32;
  const diaVip = Number(draft.rates?.diaVip ?? draft.vipDayRate) || 24;
  const nocheRegular = Number(draft.rates?.nocheRegular ?? draft.nightRate) || 42;
  const nocheVip = Number(draft.rates?.nocheVip ?? draft.vipNightRate) || 34;
  const bookingUrl = String(draft.rates?.bookingUrl ?? draft.bookingUrl ?? '').trim();
  const bookingVipCode = String(
    draft.rates?.bookingVipCode ?? draft.vipBookingCode ?? ''
  )
    .trim()
    .toUpperCase();

  const videoUrl = String(draft.videoTourUrl || '').trim();
  const nextVideos = videoUrl
    ? [
        {
          id: `v-${draft.id}`,
          title: `Video Tour · ${draft.shortName || draft.name}`,
          duration: '0:30',
          url: videoUrl,
          poster: draft.gallery?.[0]?.url || draft.coverUrl || ASSETS.sedeCountry,
        },
      ]
    : draft.videos || [];

  return {
    ...draft,
    dayRate: diaRegular,
    vipDayRate: diaVip,
    nightRate: nocheRegular,
    vipNightRate: nocheVip,
    bookingUrl,
    vipBookingCode: bookingVipCode,
    rates: {
      diaRegular,
      diaVip,
      nocheRegular,
      nocheVip,
      day: diaRegular,
      vipDay: diaVip,
      night: nocheRegular,
      vipNight: nocheVip,
      bookingUrl,
      bookingVipCode,
    },
    gallery: (draft.gallery || []).map((g) => ({
      ...g,
      url: g.url || g.image,
      image: g.image || g.url,
      caption: g.caption || g.title || '',
      title: g.title || g.caption || '',
    })),
    videos: nextVideos,
    promos: (draft.promos || []).map((pr) => ({
      ...pr,
      tag: pr.tag || 'PROMO',
      priceText: pr.priceText || pr.priceNote || '',
      priceNote: pr.priceNote || pr.priceText || '',
    })),
    internalEvents: (draft.internalEvents || []).map((ev) => {
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

/* ==========================================================================
   COMPONENTE PRINCIPAL: PartnerStudioModal (B2B CLOUD STUDIO · LIQUID GLASS)
   ========================================================================== */
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
  const coachGalleryRef = useRef(null);
  const clubPhotoRef = useRef(null);

  const [studioRole, setStudioRole] = useState(partner?.role === 'CLUB' ? 'CLUB' : 'COACH');
  const [coachTab, setCoachTab] = useState('hoy'); // 'hoy' | 'clases' | 'alumnos' | 'marca'
  const [clubTab, setClubTab] = useState('estado'); // 'estado' | 'vitrina' | 'promos' | 'validar'

  const [syncState, setSyncState] = useState('saved');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [selectedCoachId, setSelectedCoachId] = useState(
    partner?.id || coaches?.[0]?.id || 'coach-romina'
  );
  const [coachDraft, setCoachDraft] = useState(() => buildFallbackCoach(partner));

  const [selectedClubId, setSelectedClubId] = useState(
    partner?.clubId || clubs?.[0]?.id || 'club-country'
  );
  const [clubDraft, setClubDraft] = useState(() =>
    hydrateClubDraft((clubs || INITIAL_CLUBS)[0])
  );

  // Formularios rápidos Coach
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [pkgType, setPkgType] = useState('PRIVADA 1 A 1');
  const [pkgName, setPkgName] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgPrice, setPkgPrice] = useState(60);
  const [pkgVipPrice, setPkgVipPrice] = useState(50);
  const [pkgBadge, setPkgBadge] = useState('PROMO SEMANA');

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [grpLabel, setGrpLabel] = useState('');
  const [grpDay, setGrpDay] = useState('Mar & Jue');
  const [grpTime, setGrpTime] = useState('07:00 p. m.');
  const [grpPrice, setGrpPrice] = useState(35);
  const [grpVipPrice, setGrpVipPrice] = useState(28);
  const [grpSpots, setGrpSpots] = useState(4);

  const [newSlotDay, setNewSlotDay] = useState('Mañana');
  const [newSlotTime, setNewSlotTime] = useState('06:00 p. m.');

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [stName, setStName] = useState('');
  const [stLevel, setStLevel] = useState('5ª B');
  const [stPhone, setStPhone] = useState('');

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [vidTitle, setVidTitle] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidExclusive, setVidExclusive] = useState(false);
  const [vidGems, setVidGems] = useState(40);

  // Formularios rápidos Club
  const [newVipBenefit, setNewVipBenefit] = useState('');
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSchedule, setPromoSchedule] = useState('Lun–Vie · 10:00 a. m. – 02:00 p. m.');
  const [promoPrice, setPromoPrice] = useState('S/ 22 / hora');

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('Viernes · 07:00 p. m.');
  const [evFee, setEvFee] = useState(30);
  const [evSpots, setEvSpots] = useState(12);

  const [vipSearch, setVipSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (partner?.role === 'CLUB') setStudioRole('CLUB');
    else if (partner?.role === 'COACH') setStudioRole('COACH');

    const targetCoachId =
      partner?.id && partner.role !== 'CLUB'
        ? partner.id
        : coaches?.[0]?.id || 'coach-romina';
    setSelectedCoachId(targetCoachId);

    const targetClubId = partner?.clubId || clubs?.[0]?.id || 'club-country';
    setSelectedClubId(targetClubId);
  }, [isOpen, partner, coaches, clubs]);

  useEffect(() => {
    const found = (coaches || []).find((c) => c.id === selectedCoachId);
    if (found) {
      const base = buildFallbackCoach(found);
      setCoachDraft({
        ...base,
        ...found,
        title: found.title || found.role || base.title,
        photoUrl: found.photoUrl || found.photo || base.photoUrl,
        coverUrl: found.coverUrl || found.photoUrl || base.coverUrl,
        accentTheme: found.accentTheme || 'emerald',
        accent: found.accent || getAccentHex(found.accentTheme),
        gallery:
          Array.isArray(found.gallery) && found.gallery.length ? found.gallery : base.gallery,
        packages:
          Array.isArray(found.packages) && found.packages.length ? found.packages : base.packages,
        groups: Array.isArray(found.groups) && found.groups.length ? found.groups : base.groups,
        schedule:
          Array.isArray(found.schedule) && found.schedule.length ? found.schedule : base.schedule,
        videos: Array.isArray(found.videos) && found.videos.length ? found.videos : base.videos,
        students: Array.isArray(found.students) ? found.students : base.students,
        specialties:
          Array.isArray(found.specialties) && found.specialties.length
            ? found.specialties
            : base.specialties,
      });
    } else {
      setCoachDraft(buildFallbackCoach(partner));
    }
  }, [selectedCoachId, coaches, partner]);

  useEffect(() => {
    const found =
      (clubs || INITIAL_CLUBS).find((c) => c.id === selectedClubId) || (clubs || INITIAL_CLUBS)[0];
    if (found) setClubDraft(hydrateClubDraft(found));
  }, [selectedClubId, clubs]);

  /* ------------------------------------------------------------------------
     PERSISTENCIA REAL EN SUPABASE + REFLEJO INMEDIATO EN SedesView
     ------------------------------------------------------------------------ */
  const saveCoachToCloud = async (nextCoachRaw, toastMessage = '') => {
    const normalized = normalizeCoachForCloud(nextCoachRaw);
    setCoachDraft(normalized);
    setSyncState('saving');
    try {
      let persisted = normalized;
      if (isCloudReady) {
        const res = await upsertCloudCoach(normalized);
        if (res) persisted = { ...normalized, ...res };
      }
      if (onSaveCoachChanges) onSaveCoachChanges(persisted);
      setSyncState('saved');
      if (toastMessage && onNotify) onNotify(toastMessage, 'success');
    } catch (err) {
      console.error('[PartnerStudio] Error guardando Coach:', err);
      setSyncState('error');
      if (onNotify) onNotify('Cambio guardado localmente. Revisa tu conexión para sincronizar.', 'warning');
    }
  };

  const saveClubToCloud = async (nextClubRaw, toastMessage = '') => {
    const normalized = normalizeClubForCloud(nextClubRaw);
    setClubDraft(normalized);
    setSyncState('saving');
    try {
      let persisted = normalized;
      if (isCloudReady) {
        const res = await upsertCloudClub(normalized);
        if (res) persisted = { ...normalized, ...res };
      }
      if (onSaveClubChanges) onSaveClubChanges(normalized.id, persisted);
      setSyncState('saved');
      if (toastMessage && onNotify) onNotify(toastMessage, 'success');
    } catch (err) {
      console.error('[PartnerStudio] Error guardando Club:', err);
      setSyncState('error');
      if (onNotify) onNotify('Cambio guardado localmente. Revisa tu conexión para sincronizar.', 'warning');
    }
  };

  /* ------------------------------------------------------------------------
     SUBIDA REAL DE FOTOS A SUPABASE STORAGE 'media'
     ------------------------------------------------------------------------ */
  const handleUploadCoachPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const publicUrl = await uploadCompressedMedia(file, 'coaches', coachDraft.id);
      if (publicUrl) {
        triggerHaptic('success');
        await saveCoachToCloud(
          { ...coachDraft, photoUrl: publicUrl, photo: publicUrl, coverUrl: publicUrl },
          'Foto de portada actualizada en vivo.'
        );
      }
    } catch {
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos subir esa foto. Prueba con JPG o PNG.', 'warning');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleUploadCoachGalleryPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const publicUrl = await uploadCompressedMedia(file, 'coaches', `${coachDraft.id}-gal`);
      if (publicUrl) {
        const nextGallery = [
          {
            id: `cog-${Date.now()}`,
            url: publicUrl,
            caption: `Entrenamiento · ${coachDraft.name}`,
          },
          ...(coachDraft.gallery || []),
        ].slice(0, 8);
        triggerHaptic('success');
        await saveCoachToCloud(
          { ...coachDraft, gallery: nextGallery },
          'Foto sumada a tu galería en cancha.'
        );
      }
    } catch {
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos subir la foto a tu galería.', 'warning');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleUploadClubGalleryPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const publicUrl = await uploadCompressedMedia(file, 'clubs', clubDraft.id);
      if (publicUrl) {
        const nextGallery = [
          {
            id: `cg-${Date.now()}`,
            title: `${clubDraft.shortName} · Foto ${clubDraft.gallery.length + 1}`,
            caption: `${clubDraft.shortName} · Vista ${(clubDraft.gallery || []).length + 1}`,
            image: publicUrl,
            url: publicUrl,
          },
          ...(clubDraft.gallery || []),
        ].slice(0, 8);
        triggerHaptic('success');
        await saveClubToCloud(
          {
            ...clubDraft,
            gallery: nextGallery,
            coverUrl: nextGallery[0]?.url || clubDraft.coverUrl,
            cover: nextGallery[0]?.url || clubDraft.cover,
          },
          'Foto agregada al carrusel de la sede.'
        );
      }
    } catch {
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos subir la foto del club.', 'warning');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  /* ------------------------------------------------------------------------
     ACCIONES COACH PRO
     ------------------------------------------------------------------------ */
  const handleSelectFreeSlot = (slotText) => {
    triggerHaptic('medium');
    saveCoachToCloud(
      { ...coachDraft, freeSlotToday: slotText, availableToday: Boolean(slotText) },
      slotText ? `Horario libre publicado: ${slotText}` : 'Estado actualizado a Agenda completa.'
    );
  };

  const handleAddScheduleSlot = (e) => {
    e.preventDefault();
    if (!newSlotDay.trim() || !newSlotTime.trim()) return;
    const created = {
      id: `hs-${Date.now()}`,
      day: newSlotDay.trim(),
      time: newSlotTime.trim(),
      status: 'open',
    };
    triggerHaptic('success');
    saveCoachToCloud(
      { ...coachDraft, schedule: [created, ...(coachDraft.schedule || [])] },
      'Turno disponible agregado a tu agenda.'
    );
  };

  const handleRemoveScheduleSlot = (slotId) => {
    triggerHaptic('light');
    saveCoachToCloud({
      ...coachDraft,
      schedule: (coachDraft.schedule || []).filter((s) => s.id !== slotId),
    });
  };

  const handleShareFreeSlotWhatsApp = () => {
    triggerHaptic('light');
    const msg = [
      `🎾 ¡Turno libre con Coach ${coachDraft.name}!`,
      coachDraft.freeSlotToday
        ? `• Horario disponible: ${coachDraft.freeSlotToday}`
        : '• Cupos disponibles esta semana',
      `• Sede: ${coachDraft.clubName}`,
      `• Clase desde S/ ${coachDraft.baseRate} (Socios VIP: S/ ${coachDraft.vipRate})`,
      'Reserva tu espacio respondiendo este mensaje o desde TOTAL TENIS.',
    ].join('\n');
    window.open(buildWhatsappLink('', msg), '_blank', 'noopener,noreferrer');
  };

  const handleAddPackage = (e) => {
    e.preventDefault();
    if (pkgName.trim().length < 3) return;
    const reg = Number(pkgPrice) || 60;
    const vip = Math.min(Number(pkgVipPrice) || 50, reg);
    const created = {
      id: `pk-${Date.now()}`,
      type: pkgType,
      name: pkgName.trim(),
      title: pkgName.trim(),
      desc: pkgDesc.trim() || 'Entrenamiento práctico en cancha.',
      price: reg,
      priceRegular: reg,
      vipPrice: vip,
      priceVip: vip,
      badge: pkgBadge.trim().toUpperCase(),
      tag: pkgBadge.trim().toUpperCase(),
    };
    triggerHaptic('success');
    saveCoachToCloud(
      { ...coachDraft, packages: [created, ...(coachDraft.packages || [])] },
      'Programa publicado en tu ficha pública.'
    );
    setPkgName('');
    setPkgDesc('');
    setShowAddPkg(false);
  };

  const handleRemovePackage = (id) => {
    triggerHaptic('light');
    saveCoachToCloud({
      ...coachDraft,
      packages: (coachDraft.packages || []).filter((p) => p.id !== id),
    });
  };

  const handleAddGroup = (e) => {
    e.preventDefault();
    if (grpLabel.trim().length < 3) return;
    const reg = Number(grpPrice) || 35;
    const vip = Math.min(Number(grpVipPrice) || 28, reg);
    const max = Math.max(2, Number(grpSpots) || 4);
    const created = {
      id: `grp-${Date.now()}`,
      day: grpDay.trim() || 'Turno',
      time: grpTime.trim() || '',
      label: grpLabel.trim(),
      price: reg,
      vipPrice: vip,
      spotsUsed: 1,
      spotsTotal: max,
      spotsFilled: 1,
      spotsMax: max,
    };
    triggerHaptic('success');
    saveCoachToCloud(
      { ...coachDraft, groups: [created, ...(coachDraft.groups || [])] },
      'Horario grupal creado con cupos en vivo.'
    );
    setGrpLabel('');
    setShowAddGroup(false);
  };

  const handleStepGroupSpots = (grpId, delta) => {
    triggerHaptic('light');
    const nextGroups = (coachDraft.groups || []).map((g) => {
      if (g.id !== grpId) return g;
      const total = Number(g.spotsTotal) || 4;
      const used = Number(g.spotsUsed) || 0;
      const nextUsed = Math.max(0, Math.min(total, used + delta));
      return { ...g, spotsUsed: nextUsed, spotsFilled: nextUsed };
    });
    saveCoachToCloud({ ...coachDraft, groups: nextGroups });
  };

  const handleBroadcastGroup = (grp) => {
    triggerHaptic('medium');
    const total = Number(grp.spotsTotal) || 4;
    const used = Number(grp.spotsUsed) || 0;
    const free = Math.max(0, total - used);
    const msg = [
      `🎾 ¡Quedan ${free} ${free === 1 ? 'cupo libre' : 'cupos libres'} en clase grupal!`,
      `• ${grp.label}`,
      `• ${grp.day} · ${grp.time} (${coachDraft.clubName})`,
      grp.price ? `• Tarifa: S/ ${grp.price} · Socio VIP: S/ ${grp.vipPrice || grp.price}` : '',
      'Escríbeme aquí para separar tu lugar.',
    ]
      .filter(Boolean)
      .join('\n');
    window.open(buildWhatsappLink('', msg), '_blank', 'noopener,noreferrer');
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (stName.trim().length < 3) return;
    const created = {
      id: `st-${Date.now()}`,
      name: stName.trim(),
      level: stLevel,
      groupName: coachDraft.groups?.[0]?.label || 'Clase particular',
      whatsapp: stPhone.replace(/\D/g, ''),
      feeStatus: 'AL_DIA',
      attendedToday: true,
    };
    triggerHaptic('success');
    saveCoachToCloud(
      { ...coachDraft, students: [created, ...(coachDraft.students || [])] },
      `${created.name} agregado a tu lista de alumnos.`
    );
    setStName('');
    setStPhone('');
    setShowAddStudent(false);
  };

  const handleToggleStudentField = (stId, field) => {
    triggerHaptic('light');
    const nextStudents = (coachDraft.students || []).map((s) => {
      if (s.id !== stId) return s;
      if (field === 'attendedToday') return { ...s, attendedToday: !s.attendedToday };
      return { ...s, feeStatus: s.feeStatus === 'AL_DIA' ? 'PENDIENTE' : 'AL_DIA' };
    });
    saveCoachToCloud({ ...coachDraft, students: nextStudents });
  };

  const handleToggleSpecialty = (sp) => {
    triggerHaptic('light');
    const cur = Array.isArray(coachDraft.specialties) ? coachDraft.specialties : [];
    const next = cur.includes(sp) ? cur.filter((x) => x !== sp) : [...cur.slice(-2), sp];
    saveCoachToCloud({ ...coachDraft, specialties: next });
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    if (vidTitle.trim().length < 3) return;
    const finalUrl = vidUrl.trim() || ASSETS.videoCoachRomina;
    const created = {
      id: `pv-${Date.now()}`,
      title: vidTitle.trim(),
      duration: '01:20',
      isFree: !vidExclusive,
      isExclusive: vidExclusive,
      gemsCost: vidExclusive ? Number(vidGems) || 40 : 0,
      url: finalUrl,
      src: finalUrl,
      poster: vidExclusive ? ASSETS.portadaAcademiaTv : ASSETS.portadaTipsSemana,
      active: true,
    };
    triggerHaptic('success');
    saveCoachToCloud(
      { ...coachDraft, videos: [created, ...(coachDraft.videos || [])] },
      'Video publicado en tu vitrina de Coach.'
    );
    setVidTitle('');
    setVidUrl('');
    setShowAddVideo(false);
  };

  /* ------------------------------------------------------------------------
     ACCIONES CLUB ALIADO
     ------------------------------------------------------------------------ */
  const handleAddVipBenefit = (e) => {
    e.preventDefault();
    const clean = newVipBenefit.trim();
    if (clean.length < 4) return;
    triggerHaptic('success');
    saveClubToCloud(
      { ...clubDraft, vipBenefits: [...(clubDraft.vipBenefits || []), clean] },
      'Beneficio VIP guardado para este club.'
    );
    setNewVipBenefit('');
  };

  const handleRemoveVipBenefit = (idx) => {
    triggerHaptic('light');
    saveClubToCloud({
      ...clubDraft,
      vipBenefits: (clubDraft.vipBenefits || []).filter((_, i) => i !== idx),
    });
  };

  const handleRemoveClubPhoto = (photoId) => {
    triggerHaptic('light');
    const nextGal = (clubDraft.gallery || []).filter((g) => g.id !== photoId);
    saveClubToCloud({ ...clubDraft, gallery: nextGal });
  };

  const handleAddClubPromo = (e) => {
    e.preventDefault();
    if (promoTitle.trim().length < 4) return;
    const created = {
      id: `pr-${Date.now()}`,
      tag: 'HORAS VALLE',
      title: promoTitle.trim(),
      schedule: promoSchedule.trim(),
      priceText: promoPrice.trim(),
      priceNote: promoPrice.trim(),
      active: true,
    };
    triggerHaptic('success');
    saveClubToCloud(
      { ...clubDraft, promos: [created, ...(clubDraft.promos || [])] },
      'Promoción de Hora Valle publicada.'
    );
    setPromoTitle('');
    setShowAddPromo(false);
  };

  const handleAddClubEvent = (e) => {
    e.preventDefault();
    if (evTitle.trim().length < 4) return;
    const max = Math.max(4, Number(evSpots) || 12);
    const created = {
      id: `ev-${Date.now()}`,
      title: evTitle.trim(),
      date: evDate.trim(),
      dateLabel: evDate.trim(),
      fee: `S/ ${Number(evFee) || 30}`,
      spotsUsed: 1,
      spotsTotal: max,
      spots: `1 / ${max} cupos`,
      pct: Math.round((1 / max) * 100),
    };
    triggerHaptic('success');
    saveClubToCloud(
      { ...clubDraft, internalEvents: [created, ...(clubDraft.internalEvents || [])] },
      'Evento interno del club publicado.'
    );
    setEvTitle('');
    setShowAddEvent(false);
  };

  const vipValidationMatches = useMemo(() => {
    const q = vipSearch.trim().toLowerCase();
    if (!q) return [];
    return (players || [])
      .filter((p) =>
        `${p.name || ''} ${p.credentialId || ''} ${p.whatsapp || ''}`.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [players, vipSearch]);

  const conversionRate = useMemo(() => {
    const views = Number(coachDraft.profileViews) || 0;
    const clicks = Number(coachDraft.whatsappClicks) || 0;
    if (views <= 0) return 0;
    return Math.min(100, Math.round((clicks / views) * 100));
  }, [coachDraft.profileViews, coachDraft.whatsappClicks]);

  const coachTabIdx = ['hoy', 'clases', 'alumnos', 'marca'].indexOf(coachTab);
  const clubTabIdx = ['estado', 'vitrina', 'promos', 'validar'].indexOf(clubTab);

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={studioRole === 'COACH' ? 'Estudio Coach Pro' : 'Panel de Club Aliado'}
      subtitle={
        studioRole === 'COACH'
          ? `${coachDraft.name} · Cambios en tiempo real`
          : `${clubDraft.name} · Gestión en la nube`
      }
      icon={
        <IconBadge
          name={studioRole === 'COACH' ? 'users' : 'shield'}
          variant={studioRole === 'COACH' ? 'emerald' : 'gold'}
          size={38}
        />
      }
      isWide
      isTopLayer
    >
      <div className={`tt-ps-studio ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* ==================================================================
            CABECERA EJECUTIVA + ESTADO CLOUD + SWITCH COACH / CLUB
            ================================================================== */}
        <div className="tt-pst-hero">
          <div className="tt-pst-hero-top">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="tt-pst-kicker">ESTUDIO ALIADOS · TOTAL TENIS</span>
                <span className={`tt-sync-pill is-${syncState}`}>
                  {syncState === 'saving'
                    ? 'Guardando...'
                    : syncState === 'error'
                    ? 'Modo local'
                    : '● En la nube'}
                </span>
              </div>
              <h2>{studioRole === 'COACH' ? coachDraft.name : clubDraft.name}</h2>
            </div>

            <div className="tt-pst-role-switch" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={studioRole === 'COACH'}
                className={studioRole === 'COACH' ? 'is-active' : ''}
                onClick={() => {
                  triggerHaptic('light');
                  setStudioRole('COACH');
                }}
              >
                Coach
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={studioRole === 'CLUB'}
                className={studioRole === 'CLUB' ? 'is-active' : ''}
                onClick={() => {
                  triggerHaptic('light');
                  setStudioRole('CLUB');
                }}
              >
                Club
              </button>
            </div>
          </div>

          {studioRole === 'COACH' ? (
            <div className="tt-pst-kpi-strip">
              <div>
                <span>VISITAS PERFIL</span>
                <strong>{Number(coachDraft.profileViews) || 0}</strong>
              </div>
              <div className="is-emerald">
                <span>CLICS WHATSAPP</span>
                <strong>{Number(coachDraft.whatsappClicks) || 0}</strong>
              </div>
              <div>
                <span>INTERÉS</span>
                <strong>{conversionRate}%</strong>
              </div>
            </div>
          ) : (
            <div className="tt-pst-kpi-strip">
              <div>
                <span>FOTOS SEDE</span>
                <strong>{(clubDraft.gallery || []).length}</strong>
              </div>
              <div className="is-emerald">
                <span>SOCIOS VIP</span>
                <strong>{(players || []).filter((p) => p.isVip).length}</strong>
              </div>
              <div>
                <span>CANAL WEB</span>
                <strong>{clubDraft.rates?.bookingUrl ? 'Activo' : 'WhatsApp'}</strong>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================
            MODO A: ESTUDIO COACH PRO
            ================================================================== */}
        {studioRole === 'COACH' && (
          <>
            {(coaches || []).length > 1 && (
              <div className="tt-pst-selector-row">
                {coaches.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`tt-pst-sel-chip tt-pst-press ${selectedCoachId === c.id ? 'is-on' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedCoachId(c.id);
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="tt-pst-subtabs" role="tablist">
              <span
                className="tt-pst-subtab-slider"
                aria-hidden="true"
                style={{ transform: `translateX(${Math.max(0, coachTabIdx) * 100}%)` }}
              />
              {[
                { id: 'hoy', label: 'Hoy' },
                { id: 'clases', label: 'Clases' },
                { id: 'alumnos', label: 'Alumnos' },
                { id: 'marca', label: 'Mi Marca' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={coachTab === t.id}
                  className={`tt-pst-subtab ${coachTab === t.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setCoachTab(t.id);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* COACH TAB 1: HOY (10 SEGUNDOS ENTRE CLASES + AGENDA LIBRE) */}
            {coachTab === 'hoy' && (
              <div key="ct-hoy" className="tt-pst-section tt-pst-enter">
                <div className="tt-pst-card">
                  <span className="tt-pst-mini-kicker">PUBLICACIÓN RÁPIDA EN 1 TOQUE</span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>¿Tienes una hora libre hoy?</h3>
                  <p className="tt-pst-help">
                    Al activar un horario, aparece el punto verde «Libre hoy» en tu tarjeta de Sedes & Coaches.
                  </p>

                  <div className="tt-quick-slots-grid">
                    {QUICK_FREE_SLOTS.map((slot) => {
                      const active = (coachDraft.freeSlotToday || '') === slot;
                      return (
                        <button
                          key={slot || 'full'}
                          type="button"
                          className={`tt-qs-pill tt-pst-press ${active ? 'is-active' : ''}`}
                          onClick={() => handleSelectFreeSlot(slot)}
                        >
                          {slot || 'Agenda completa'}
                        </button>
                      );
                    })}
                  </div>

                  <div className="tt-pst-inline-row">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={coachDraft.freeSlotToday || ''}
                      onChange={(e) =>
                        setCoachDraft((prev) => ({ ...prev, freeSlotToday: e.target.value }))
                      }
                      placeholder="Ej. Hoy · 04:30 p. m."
                    />
                    <button
                      type="button"
                      className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press"
                      onClick={() =>
                        saveCoachToCloud(coachDraft, 'Disponibilidad publicada al instante.')
                      }
                    >
                      Publicar
                    </button>
                  </div>

                  <button
                    type="button"
                    className="tt-pst-wa-banner tt-pst-press"
                    onClick={handleShareFreeSlotWhatsApp}
                  >
                    <TTIcon name="whatsapp" size={18} />
                    <span>Compartir mi turno libre en WhatsApp</span>
                  </button>
                </div>

                {/* Horarios Libres Semanales (conectados directo a pestaña Horarios de SedesView) */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mini-kicker">AGENDA VISIBLE PARA RESERVAR</span>
                  <h3 style={{ margin: 0, fontSize: '1.02rem' }}>
                    Horarios Libres ({(coachDraft.schedule || []).length})
                  </h3>

                  <form onSubmit={handleAddScheduleSlot} className="tt-pst-grid-3">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newSlotDay}
                      onChange={(e) => setNewSlotDay(e.target.value)}
                      placeholder="Día"
                    />
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      placeholder="Hora"
                    />
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press">
                      + Sumar
                    </button>
                  </form>

                  <div className="tt-slots-manage-wrap">
                    {(coachDraft.schedule || []).map((sl) => (
                      <span key={sl.id} className="tt-slot-manage-chip">
                        <b>{sl.day}</b> · {sl.time}
                        <button
                          type="button"
                          aria-label="Quitar horario"
                          onClick={() => handleRemoveScheduleSlot(sl.id)}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COACH TAB 2: CLASES, PAQUETES Y CUPOS EN VIVO */}
            {coachTab === 'clases' && (
              <div key="ct-clases" className="tt-pst-section tt-pst-enter">
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">PAQUETES Y PROMOCIONES</span>
                    <h3>Oferta Comercial</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press"
                    onClick={() => setShowAddPkg((v) => !v)}
                  >
                    {showAddPkg ? 'Cerrar' : '+ Paquete / Promo'}
                  </button>
                </div>

                {showAddPkg && (
                  <form onSubmit={handleAddPackage} className="tt-pst-inline-form">
                    <div className="tt-pst-grid-2">
                      <select
                        className="tt-pst-input"
                        value={pkgType}
                        onChange={(e) => setPkgType(e.target.value)}
                      >
                        <option value="PRIVADA 1 A 1">Privada 1 a 1</option>
                        <option value="PACK SEMANAL">Pack Semanal</option>
                        <option value="PACK MENSUAL">Pack Mensual</option>
                        <option value="SPARRING">Sparring</option>
                        <option value="CLÍNICA">Clínica</option>
                      </select>
                      <input
                        type="text"
                        className="tt-pst-input"
                        value={pkgBadge}
                        onChange={(e) => setPkgBadge(e.target.value)}
                        placeholder="Etiqueta (ej. PROMO MES)"
                      />
                    </div>
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={pkgName}
                      onChange={(e) => setPkgName(e.target.value)}
                      placeholder="Nombre (ej. Plan 4 Clases + Video)"
                      required
                    />
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={pkgDesc}
                      onChange={(e) => setPkgDesc(e.target.value)}
                      placeholder="Qué incluye (ej. Diagnóstico y clips por WhatsApp)"
                    />
                    <div className="tt-pst-grid-2">
                      <label className="tt-pst-lbl">
                        <span>Precio Regular (S/)</span>
                        <input
                          type="number"
                          className="tt-pst-input"
                          value={pkgPrice}
                          onChange={(e) => setPkgPrice(e.target.value)}
                        />
                      </label>
                      <label className="tt-pst-lbl">
                        <span>Tarifa Socio VIP (S/)</span>
                        <input
                          type="number"
                          className="tt-pst-input"
                          value={pkgVipPrice}
                          onChange={(e) => setPkgVipPrice(e.target.value)}
                        />
                      </label>
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm tt-pst-press">
                      Guardar y Publicar
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {(coachDraft.packages || []).map((pk) => (
                    <article key={pk.id} className="tt-pst-pkg-card">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="tt-pgc-type">{pk.type}</span>
                          {(pk.badge || pk.tag) && (
                            <span className="tt-pst-badge-soft">{pk.badge || pk.tag}</span>
                          )}
                        </div>
                        <h4>{pk.title || pk.name}</h4>
                        <small>
                          Regular: S/ {pk.priceRegular ?? pk.price} ·{' '}
                          <b style={{ color: '#E5C16C' }}>VIP: S/ {pk.priceVip ?? pk.vipPrice}</b>
                        </small>
                      </div>
                      <button
                        type="button"
                        className="tt-pst-del-btn"
                        aria-label="Eliminar paquete"
                        onClick={() => handleRemovePackage(pk.id)}
                      >
                        ✕
                      </button>
                    </article>
                  ))}
                </div>

                {/* Horarios Grupales */}
                <div className="tt-pst-sec-head" style={{ marginTop: 6 }}>
                  <div>
                    <span className="tt-pst-mini-kicker">CONTROL DE VACANTES EN VIVO</span>
                    <h3>Horarios Grupales</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-ghost tt-btn-sm tt-pst-press"
                    onClick={() => setShowAddGroup((v) => !v)}
                  >
                    {showAddGroup ? 'Cerrar' : '+ Horario'}
                  </button>
                </div>

                {showAddGroup && (
                  <form onSubmit={handleAddGroup} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={grpLabel}
                      onChange={(e) => setGrpLabel(e.target.value)}
                      placeholder="Nombre del grupo (ej. Grupo Damas 5ª A)"
                      required
                    />
                    <div className="tt-pst-grid-2">
                      <input
                        type="text"
                        className="tt-pst-input
