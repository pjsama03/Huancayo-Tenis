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
   ========================================================================== */
const COACH_THEME_OPTIONS = [
  { id: 'emerald', label: 'Esmeralda', swatch: '#00DC7D' },
  { id: 'gold', label: 'Oro Champán', swatch: '#E5C16C' },
  { id: 'clay', label: 'Arcilla', swatch: '#D97B59' },
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
  'Saque y Efecto',
  'Táctica en Arcilla',
  'Derecha de Ataque',
  'Iniciación Adultos',
  'Damas Competitivo',
  'Senior +40',
  'Juego de Dobles',
  'Sparring Pre-Torneo',
];

const WEATHER_QUICK_OPTS = [
  { key: 'seco', label: 'Seca', color: '#00DC7D' },
  { key: 'humedad', label: 'Húmeda', color: '#38BDF8' },
  { key: 'llovizna', label: 'Llovizna', color: '#E5C16C' },
  { key: 'lluvia', label: 'Lluvia', color: '#F87171' },
];

function buildFallbackCoach(partner) {
  return {
    id: partner?.id || 'coach-romina',
    name: partner?.name || 'Romina Cutipa',
    clubId: partner?.clubId || 'club-romina',
    clubName: 'Academia Romina Cutipa',
    title: 'Head Coach · Alta Competencia',
    bio: 'Entrenamiento técnico en arcilla, corrección de saque y táctica de partido.',
    photoUrl: '/assets/sede-romina-cutipa.jpg',
    coverUrl: '/assets/torneo-altura.jpg',
    accentTheme: 'emerald',
    specialties: ['Saque y Efecto', 'Táctica en Arcilla', 'Damas Competitivo'],
    baseRate: 60,
    vipRate: 50,
    freeSlotToday: 'Hoy · 06:00 p. m.',
    whatsapp: '51964201001',
    profileViews: 48,
    whatsappClicks: 14,
    videos: [
      {
        id: 'pv-1',
        title: '2º saque con altura sin doble falta',
        duration: '01:45',
        isExclusive: false,
        gemsCost: 0,
        src: '/assets/video-coach-romina.mp4',
        poster: '/assets/portada-tips-semana.jpg',
        active: true,
      },
      {
        id: 'pv-2',
        title: 'Ángulos cortos en arcilla paso a paso',
        duration: '05:20',
        isExclusive: true,
        gemsCost: 40,
        src: '/assets/video-coach-demo-3.mp4',
        poster: '/assets/portada-academia-tv.jpg',
        active: true,
      },
    ],
    packages: [
      {
        id: 'pk-1',
        type: 'Privada 1 a 1',
        name: 'Sesión Técnica Personalizada (60 min)',
        price: 60,
        vipPrice: 50,
        badge: 'VIDEO FEEDBACK',
      },
      {
        id: 'pk-2',
        type: 'Pack Mensual',
        name: 'Plan Ascenso · 8 Clases',
        price: 440,
        vipPrice: 380,
        badge: 'PROMO MES',
      },
    ],
    groups: [
      {
        id: 'grp-1',
        day: 'Mié & Vie',
        time: '06:00 p. m.',
        label: 'Grupo Competitivo 5ª A / 4ª',
        price: 35,
        vipPrice: 28,
        spotsUsed: 3,
        spotsTotal: 4,
      },
      {
        id: 'grp-2',
        day: 'Sáb',
        time: '09:30 a. m.',
        label: 'Clínica de Saque y Resto',
        price: 40,
        vipPrice: 32,
        spotsUsed: 2,
        spotsTotal: 4,
      },
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

function hydrateClubDraft(club) {
  const ratesObj = club?.rates || club?.tarifas || {};
  const rawGallery = Array.isArray(club?.gallery) && club.gallery.length > 0
    ? club.gallery
    : Array.isArray(club?.galeria)
    ? club.galeria
    : [];

  return {
    ...club,
    hours: club?.hours || '06:00 a. m. – 10:00 p. m.',
    courtsCount: Number(club?.courtsCount) || 4,
    whatsapp: club?.whatsapp || '',
    mapsUrl: club?.mapsUrl || club?.googleMapsUrl || '',
    rates: {
      diaRegular: Number(ratesObj.diaRegular) || 32,
      diaVip: Number(ratesObj.diaVip) || 24,
      nocheRegular: Number(ratesObj.nocheRegular) || 42,
      nocheVip: Number(ratesObj.nocheVip) || 34,
      bookingUrl: ratesObj.bookingUrl || '',
      bookingVipCode: ratesObj.bookingVipCode || '',
    },
    gallery: rawGallery.map((g, idx) =>
      typeof g === 'string'
        ? { id: `cg-${idx}`, title: `Cancha ${idx + 1}`, image: g }
        : { id: g.id || `cg-${idx}`, title: g.title || `Vista ${idx + 1}`, image: g.image || g.url }
    ),
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

/* ==========================================================================
   COMPONENTE PRINCIPAL: PartnerStudioModal (B2B CLOUD STUDIO · SUPABASE)
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
  const clubPhotoRef = useRef(null);

  const [studioRole, setStudioRole] = useState(partner?.role === 'CLUB' ? 'CLUB' : 'COACH');
  const [coachTab, setCoachTab] = useState('hoy'); // 'hoy' | 'clases' | 'alumnos' | 'marca'
  const [clubTab, setClubTab] = useState('estado'); // 'estado' | 'vitrina' | 'promos' | 'validar'

  const [syncState, setSyncState] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Selector de Coach y Club activos
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

  // Formularios colapsables rápidos (Coach)
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [pkgType, setPkgType] = useState('Privada 1 a 1');
  const [pkgName, setPkgName] = useState('');
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

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [stName, setStName] = useState('');
  const [stLevel, setStLevel] = useState('5ª B');
  const [stPhone, setStPhone] = useState('');

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [vidTitle, setVidTitle] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidExclusive, setVidExclusive] = useState(false);
  const [vidGems, setVidGems] = useState(40);

  // Formularios colapsables rápidos (Club)
  const [newVipBenefit, setNewVipBenefit] = useState('');
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSchedule, setPromoSchedule] = useState('Lun–Vie · 10:00 a. m. – 02:00 p. m.');
  const [promoPrice, setPromoPrice] = useState('S/ 22 / hora · VIP S/ 18');

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('Viernes · 07:00 p. m.');
  const [evFee, setEvFee] = useState(30);
  const [evSpots, setEvSpots] = useState(12);

  // Validador de Carnet VIP en Recepción
  const [vipSearch, setVipSearch] = useState('');

  // Hidratar estado al abrir el estudio o cambiar de coach/club
  useEffect(() => {
    if (!isOpen) return;
    if (partner?.role === 'CLUB') setStudioRole('CLUB');
    else if (partner?.role === 'COACH') setStudioRole('COACH');

    const targetCoachId = partner?.id && partner.role !== 'CLUB'
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
        photoUrl: found.photoUrl || found.photo || base.photoUrl,
        coverUrl: found.coverUrl || found.photoUrl || base.coverUrl,
        packages: Array.isArray(found.packages) && found.packages.length ? found.packages : base.packages,
        groups: Array.isArray(found.groups) && found.groups.length ? found.groups : base.groups,
        videos: Array.isArray(found.videos) ? found.videos : base.videos,
        students: Array.isArray(found.students) ? found.students : base.students,
        specialties: Array.isArray(found.specialties) && found.specialties.length
          ? found.specialties
          : base.specialties,
      });
    } else {
      setCoachDraft(buildFallbackCoach(partner));
    }
  }, [selectedCoachId, coaches, partner]);

  useEffect(() => {
    const found = (clubs || INITIAL_CLUBS).find((c) => c.id === selectedClubId) || (clubs || INITIAL_CLUBS)[0];
    if (found) setClubDraft(hydrateClubDraft(found));
  }, [selectedClubId, clubs]);

  /* ------------------------------------------------------------------------
     PERSISTENCIA REAL EN SUPABASE (COACH Y CLUB) CON FEEDBACK INSTANTÁNEO
     ------------------------------------------------------------------------ */
  const saveCoachToCloud = async (nextCoach, toastMessage = '') => {
    setCoachDraft(nextCoach);
    setSyncState('saving');
    try {
      let persisted = nextCoach;
      if (isCloudReady) {
        const res = await upsertCloudCoach(nextCoach);
        if (res) persisted = { ...nextCoach, ...res };
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

  const saveClubToCloud = async (nextClub, toastMessage = '') => {
    setClubDraft(nextClub);
    setSyncState('saving');
    try {
      let persisted = nextClub;
      if (isCloudReady) {
        const res = await upsertCloudClub(nextClub);
        if (res) persisted = { ...nextClub, ...res };
      }
      if (onSaveClubChanges) onSaveClubChanges(nextClub.id, persisted);
      setSyncState('saved');
      if (toastMessage && onNotify) onNotify(toastMessage, 'success');
    } catch (err) {
      console.error('[PartnerStudio] Error guardando Club:', err);
      setSyncState('error');
      if (onNotify) onNotify('Cambio guardado localmente. Revisa tu conexión para sincronizar.', 'warning');
    }
  };

  /* ------------------------------------------------------------------------
     SUBIDA REAL DE FOTOS A SUPABASE STORAGE 'media' (COACH & CARRUSEL CLUB)
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
          'Foto profesional del Coach actualizada en la nube.'
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
            image: publicUrl,
          },
          ...(clubDraft.gallery || []),
        ].slice(0, 8);
        triggerHaptic('success');
        await saveClubToCloud(
          { ...clubDraft, gallery: nextGallery, coverUrl: nextGallery[0]?.image || clubDraft.coverUrl },
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
     ACCIONES RÁPIDAS COACH PRO
     ------------------------------------------------------------------------ */
  const handleSelectFreeSlot = (slotText) => {
    triggerHaptic('medium');
    saveCoachToCloud(
      { ...coachDraft, freeSlotToday: slotText },
      slotText ? `Horario libre publicado: ${slotText}` : 'Estado actualizado a Agenda completa.'
    );
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
    const created = {
      id: `pk-${Date.now()}`,
      type: pkgType,
      name: pkgName.trim(),
      price: Number(pkgPrice) || 60,
      vipPrice: Math.min(Number(pkgVipPrice) || 50, Number(pkgPrice) || 60),
      badge: pkgBadge.trim().toUpperCase(),
    };
    triggerHaptic('success');
    saveCoachToCloud(
      { ...coachDraft, packages: [created, ...(coachDraft.packages || [])] },
      'Programa publicado en tu ficha pública.'
    );
    setPkgName('');
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
    const created = {
      id: `grp-${Date.now()}`,
      day: grpDay.trim() || 'Turno',
      time: grpTime.trim() || '',
      label: grpLabel.trim(),
      price: Number(grpPrice) || 35,
      vipPrice: Math.min(Number(grpVipPrice) || 28, Number(grpPrice) || 35),
      spotsUsed: 1,
      spotsTotal: Math.max(2, Number(grpSpots) || 4),
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
      return { ...g, spotsUsed: Math.max(0, Math.min(total, used + delta)) };
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
    const next = cur.includes(sp)
      ? cur.filter((x) => x !== sp)
      : [...cur.slice(-2), sp]; // máximo 3 limpias
    saveCoachToCloud({ ...coachDraft, specialties: next });
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    if (vidTitle.trim().length < 3) return;
    const created = {
      id: `pv-${Date.now()}`,
      title: vidTitle.trim(),
      duration: '01:30',
      isExclusive: vidExclusive,
      gemsCost: vidExclusive ? Number(vidGems) || 40 : 0,
      src: vidUrl.trim() || '/assets/video-coach-romina.mp4',
      poster: vidExclusive ? '/assets/portada-academia-tv.jpg' : '/assets/portada-tips-semana.jpg',
      active: true,
    };
    triggerHaptic('success');
    saveCoachToCloud(
      { ...coachDraft, videos: [created, ...(coachDraft.videos || [])] },
      'Video publicado en tu perfil de Coach.'
    );
    setVidTitle('');
    setVidUrl('');
    setShowAddVideo(false);
  };

  /* ------------------------------------------------------------------------
     ACCIONES RÁPIDAS CLUB ALIADO
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
      title: promoTitle.trim(),
      schedule: promoSchedule.trim(),
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
    const created = {
      id: `ev-${Date.now()}`,
      title: evTitle.trim(),
      dateLabel: evDate.trim(),
      fee: Number(evFee) || 30,
      spotsUsed: 1,
      spotsTotal: Math.max(4, Number(evSpots) || 12),
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
          ? `${coachDraft.name} · Sincronizado en vivo`
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

          {/* KPIs Reales de Retorno Comercial */}
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
                    className={`tt-pst-sel-chip ${selectedCoachId === c.id ? 'is-on' : ''}`}
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

            {/* COACH TAB 1: HOY (10 SEGUNDOS ENTRE CLASES) */}
            {coachTab === 'hoy' && (
              <div key="ct-hoy" className="tt-pst-section tt-pst-enter">
                <div className="tt-pst-card">
                  <div className="tt-pst-sec-head">
                    <div>
                      <span className="tt-pst-mini-kicker">PUBLICACIÓN RÁPIDA EN 1 TOQUE</span>
                      <h3>¿Tienes una hora libre hoy?</h3>
                    </div>
                  </div>
                  <p className="tt-pst-help">
                    Lo que selecciones aparece al instante con punto verde arriba de tu tarjeta en Sedes & Coaches.
                  </p>

                  <div className="tt-quick-slots-grid">
                    {QUICK_FREE_SLOTS.map((slot) => {
                      const active = (coachDraft.freeSlotToday || '') === slot;
                      return (
                        <button
                          key={slot || 'full'}
                          type="button"
                          className={`tt-qs-pill ${active ? 'is-active' : ''}`}
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
                      placeholder="O escribe tu horario exacto (ej. Hoy · 04:30 p. m.)"
                    />
                    <button
                      type="button"
                      className="tt-btn tt-btn-primary tt-btn-sm"
                      onClick={() =>
                        saveCoachToCloud(coachDraft, 'Disponibilidad actualizada en tu ficha.')
                      }
                    >
                      Publicar
                    </button>
                  </div>

                  <button
                    type="button"
                    className="tt-pst-wa-banner"
                    onClick={handleShareFreeSlotWhatsApp}
                  >
                    <TTIcon name="whatsapp" size={18} />
                    <span>Compartir mi turno libre en mis grupos de WhatsApp</span>
                  </button>
                </div>

                {/* Resumen de asistencia rápida del día */}
                <div className="tt-pst-card">
                  <div className="tt-pst-sec-head">
                    <div>
                      <span className="tt-pst-mini-kicker">RESUMEN RÁPIDO</span>
                      <h3>Estado de tus Clases</h3>
                    </div>
                    <button
                      type="button"
                      className="tt-pst-link-btn"
                      onClick={() => setCoachTab('clases')}
                    >
                      Editar oferta →
                    </button>
                  </div>
                  <div className="tt-pst-mini-stats">
                    <div>
                      <strong>{(coachDraft.packages || []).length}</strong>
                      <span>Programas</span>
                    </div>
                    <div>
                      <strong>{(coachDraft.groups || []).length}</strong>
                      <span>Grupales</span>
                    </div>
                    <div>
                      <strong>{(coachDraft.students || []).length}</strong>
                      <span>Alumnos</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COACH TAB 2: CLASES, PAQUETES, PROMOS Y CUPOS EN VIVO */}
            {coachTab === 'clases' && (
              <div key="ct-clases" className="tt-pst-section tt-pst-enter">
                {/* Bloque 1: Clases Particulares, Packs Mensuales y Promos */}
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">PAQUETES Y PROMOCIONES</span>
                    <h3>Oferta Comercial</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
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
                        <option value="Privada 1 a 1">Privada 1 a 1</option>
                        <option value="Pack Semanal">Pack Semanal</option>
                        <option value="Pack Mensual">Pack Mensual</option>
                        <option value="Sparring">Sparring</option>
                        <option value="Clínica">Clínica</option>
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
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
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
                          {pk.badge && <span className="tt-pst-badge-soft">{pk.badge}</span>}
                        </div>
                        <h4>{pk.name}</h4>
                        <small>
                          Regular: S/ {pk.price} · <b style={{ color: '#E5C16C' }}>VIP: S/ {pk.vipPrice}</b>
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

                {/* Bloque 2: Clases Grupales con Cupos Vivos */}
                <div className="tt-pst-sec-head" style={{ marginTop: 6 }}>
                  <div>
                    <span className="tt-pst-mini-kicker">CONTROL DE VACANTES EN VIVO</span>
                    <h3>Horarios Grupales</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-ghost tt-btn-sm"
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
                        className="tt-pst-input"
                        value={grpDay}
                        onChange={(e) => setGrpDay(e.target.value)}
                        placeholder="Días (ej. Mar & Jue)"
                      />
                      <input
                        type="text"
                        className="tt-pst-input"
                        value={grpTime}
                        onChange={(e) => setGrpTime(e.target.value)}
                        placeholder="Hora (ej. 07:00 p. m.)"
                      />
                    </div>
                    <div className="tt-pst-grid-3">
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={grpPrice}
                        onChange={(e) => setGrpPrice(e.target.value)}
                        placeholder="S/ Reg"
                      />
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={grpVipPrice}
                        onChange={(e) => setGrpVipPrice(e.target.value)}
                        placeholder="S/ VIP"
                      />
                      <input
                        type="number"
                        min="2"
                        max="12"
                        className="tt-pst-input"
                        value={grpSpots}
                        onChange={(e) => setGrpSpots(e.target.value)}
                        placeholder="Cupos"
                      />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Crear Horario Grupal
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {(coachDraft.groups || []).map((grp) => {
                    const total = Number(grp.spotsTotal) || 4;
                    const used = Number(grp.spotsUsed) || 0;
                    const isFull = used >= total;
                    const pct = Math.min(100, Math.round((used / total) * 100));

                    return (
                      <article key={grp.id} className="tt-pst-group-card">
                        <div className="tt-pgc-top">
                          <div>
                            <span className="tt-pgc-type">
                              {grp.day} {grp.time ? `· ${grp.time}` : ''}
                            </span>
                            <h4>{grp.label || grp.name}</h4>
                          </div>
                          <div className="tt-pgc-spots-badge">
                            <strong>
                              {used}/{total}
                            </strong>
                            <span>CUPOS</span>
                          </div>
                        </div>

                        <div className="tt-pgc-bar">
                          <div style={{ width: `${pct}%` }} />
                        </div>

                        <div className="tt-pgc-bottom">
                          <span style={{ fontSize: '0.73rem', color: 'var(--tt-text-muted)' }}>
                            {isFull ? 'Grupo completo' : `${total - used} vacante(s) libre(s)`}
                          </span>
                          <div className="tt-pgc-controls">
                            <button
                              type="button"
                              className="tt-mini-step"
                              disabled={used <= 0}
                              onClick={() => handleStepGroupSpots(grp.id, -1)}
                            >
                              −
                            </button>
                            <button
                              type="button"
                              className="tt-mini-step is-plus"
                              disabled={isFull}
                              onClick={() => handleStepGroupSpots(grp.id, 1)}
                            >
                              +
                            </button>
                            {!isFull && (
                              <button
                                type="button"
                                className="tt-pgc-wa-btn"
                                onClick={() => handleBroadcastGroup(grp)}
                              >
                                <TTIcon name="whatsapp" size={14} />
                                Convocar
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COACH TAB 3: ALUMNOS Y ASISTENCIA */}
            {coachTab === 'alumnos' && (
              <div key="ct-alumnos" className="tt-pst-section tt-pst-enter">
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">CONTROL PRIVADO EN CANCHA</span>
                    <h3>Mis Alumnos ({(coachDraft.students || []).length})</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
                    onClick={() => setShowAddStudent((v) => !v)}
                  >
                    {showAddStudent ? 'Cerrar' : '+ Alumno'}
                  </button>
                </div>

                {showAddStudent && (
                  <form onSubmit={handleAddStudent} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={stName}
                      onChange={(e) => setStName(e.target.value)}
                      placeholder="Nombre del alumno"
                      required
                    />
                    <div className="tt-pst-grid-2">
                      <select
                        className="tt-pst-input"
                        value={stLevel}
                        onChange={(e) => setStLevel(e.target.value)}
                      >
                        {['5ª P', '5ª B', '5ª A', '4ª Cat.', '3ª Cat.'].map((lv) => (
                          <option key={lv} value={lv}>
                            {lv}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        className="tt-pst-input"
                        value={stPhone}
                        onChange={(e) => setStPhone(e.target.value)}
                        placeholder="Celular WhatsApp (9 dígitos)"
                      />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Guardar Alumno
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {(coachDraft.students || []).map((st) => (
                    <div key={st.id} className="tt-pst-student-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong>{st.name}</strong>
                          <span className="tt-st-level-chip">{st.level}</span>
                        </div>
                        <small>{st.groupName}</small>
                      </div>

                      <div className="tt-st-actions">
                        <button
                          type="button"
                          className={`tt-st-pill ${st.attendedToday ? 'is-ok' : ''}`}
                          onClick={() => handleToggleStudentField(st.id, 'attendedToday')}
                        >
                          {st.attendedToday ? '✓ Asistió' : 'Asistencia'}
                        </button>

                        <button
                          type="button"
                          className={`tt-st-pill ${st.feeStatus === 'AL_DIA' ? 'is-ok' : 'is-due'}`}
                          onClick={() => handleToggleStudentField(st.id, 'feeStatus')}
                        >
                          {st.feeStatus === 'AL_DIA' ? 'Al día' : 'Por renovar'}
                        </button>

                        {st.whatsapp && (
                          <a
                            href={buildWhatsappLink(
                              st.whatsapp,
                              `Hola ${st.name}, te escribe Coach ${coachDraft.name} para confirmar nuestra próxima clase en ${coachDraft.clubName}.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tt-st-wa-icon"
                            aria-label={`Escribir por WhatsApp a ${st.name}`}
                          >
                            <TTIcon name="whatsapp" size={15} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COACH TAB 4: MI MARCA (TEMA, FOTO STORAGE, ESPECIALIDADES Y VIDEOS) */}
            {coachTab === 'marca' && (
              <div key="ct-marca" className="tt-pst-section tt-pst-enter">
                {/* Foto en la nube + Estilo visual de su ficha */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mini-kicker">ESTUDIO DE MARCA PERSONAL</span>
                  <div className="tt-brand-photo-row">
                    <SmartImage
                      src={coachDraft.photoUrl}
                      fallbackSrc={ASSETS.torneoAltura}
                      alt={coachDraft.name}
                      style={{
                        width: 72,
                        height: 88,
                        borderRadius: 16,
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        border: '2px solid #00DC7D',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>
                        Foto de Portada y Perfil
                      </strong>
                      <small className="tt-muted" style={{ display: 'block', fontSize: '0.72rem', marginBottom: 8 }}>
                        Se comprime y actualiza al instante para todos los jugadores.
                      </small>
                      <input
                        ref={coachPhotoRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadCoachPhoto}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        disabled={isUploadingMedia}
                        className="tt-btn tt-btn-ghost tt-btn-sm"
                        onClick={() => coachPhotoRef.current?.click()}
                      >
                        <TTIcon name="camera" size={15} />
                        {isUploadingMedia ? 'Subiendo...' : 'Cambiar foto'}
                      </button>
                    </div>
                  </div>

                  {/* Selector de color de acento de su tarjeta */}
                  <div>
                    <span className="tt-pst-field-lbl">Color de acento de tu ficha</span>
                    <div className="tt-theme-swatches">
                      {COACH_THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`tt-swatch-pill ${coachDraft.accentTheme === opt.id ? 'is-on' : ''}`}
                          onClick={() => {
                            triggerHaptic('light');
                            saveCoachToCloud({ ...coachDraft, accentTheme: opt.id });
                          }}
                        >
                          <span style={{ backgroundColor: opt.swatch }} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Especialidades táctiles (máx 3) */}
                  <div>
                    <span className="tt-pst-field-lbl">Especialidades destacadas (elige hasta 3)</span>
                    <div className="tt-spec-pills">
                      {SPECIALTY_PRESETS.map((sp) => {
                        const on = (coachDraft.specialties || []).includes(sp);
                        return (
                          <button
                            key={sp}
                            type="button"
                            className={`tt-spec-btn ${on ? 'is-on' : ''}`}
                            onClick={() => handleToggleSpecialty(sp)}
                          >
                            {sp}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Datos editables + Botón Guardar */}
                  <div className="tt-pst-grid-2">
                    <label className="tt-pst-lbl">
                      <span>Tarifa Hora Regular (S/)</span>
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={coachDraft.baseRate}
                        onChange={(e) =>
                          setCoachDraft((prev) => ({ ...prev, baseRate: Number(e.target.value) || 0 }))
                        }
                      />
                    </label>
                    <label className="tt-pst-lbl">
                      <span>Tarifa Socio VIP (S/)</span>
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={coachDraft.vipRate}
                        onChange={(e) =>
                          setCoachDraft((prev) => ({ ...prev, vipRate: Number(e.target.value) || 0 }))
                        }
                      />
                    </label>
                  </div>

                  <div className="tt-pst-grid-2">
                    <label className="tt-pst-lbl">
                      <span>Título corto</span>
                      <input
                        type="text"
                        className="tt-pst-input"
                        value={coachDraft.title || ''}
                        onChange={(e) =>
                          setCoachDraft((prev) => ({ ...prev, title: e.target.value }))
                        }
                      />
                    </label>
                    <label className="tt-pst-lbl">
                      <span>WhatsApp Reservas</span>
                      <input
                        type="tel"
                        className="tt-pst-input"
                        value={coachDraft.whatsapp || ''}
                        onChange={(e) =>
                          setCoachDraft((prev) => ({ ...prev, whatsapp: e.target.value }))
                        }
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="tt-btn tt-btn-primary"
                    style={{ width: '100%' }}
                    onClick={() =>
                      saveCoachToCloud(coachDraft, 'Perfil de Coach guardado en Supabase.')
                    }
                  >
                    Guardar Cambios de Mi Marca
                  </button>
                </div>

                {/* Videos en Cancha */}
                <div className="tt-pst-card">
                  <div className="tt-pst-sec-head">
                    <div>
                      <span className="tt-pst-mini-kicker">TIPS Y MASTERCLASSES</span>
                      <h3>Videos en Cancha ({(coachDraft.videos || []).length})</h3>
                    </div>
                    <button
                      type="button"
                      className="tt-btn tt-btn-ghost tt-btn-sm"
                      onClick={() => setShowAddVideo((v) => !v)}
                    >
                      {showAddVideo ? 'Cerrar' : '+ Video'}
                    </button>
                  </div>

                  {showAddVideo && (
                    <form onSubmit={handleAddVideo} className="tt-pst-inline-form">
                      <input
                        type="text"
                        className="tt-pst-input"
                        value={vidTitle}
                        onChange={(e) => setVidTitle(e.target.value)}
                        placeholder="Título del tip en cancha"
                        required
                      />
                      <input
                        type="url"
                        className="tt-pst-input"
                        value={vidUrl}
                        onChange={(e) => setVidUrl(e.target.value)}
                        placeholder="URL MP4 o dejar vacío para demo local"
                      />
                      <div className="tt-pst-grid-2">
                        <button
                          type="button"
                          className={`tt-pst-toggle-btn ${vidExclusive ? 'is-on' : ''}`}
                          onClick={() => setVidExclusive((v) => !v)}
                        >
                          {vidExclusive ? `Masterclass (${vidGems} 💎)` : 'Tip Gratis'}
                        </button>
                        {vidExclusive && (
                          <input
                            type="number"
                            min="20"
                            step="10"
                            className="tt-pst-input"
                            value={vidGems}
                            onChange={(e) => setVidGems(e.target.value)}
                          />
                        )}
                      </div>
                      <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                        Publicar Video
                      </button>
                    </form>
                  )}

                  <div className="tt-pst-cards-stack">
                    {(coachDraft.videos || []).map((v) => (
                      <div key={v.id} className="tt-pst-vid-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{v.title}</strong>
                          <small>{v.gemsCost > 0 ? `Masterclass · ${v.gemsCost} 💎` : 'Tip Gratis'}</small>
                        </div>
                        <button
                          type="button"
                          className="tt-pst-del-btn"
                          onClick={() =>
                            saveCoachToCloud({
                              ...coachDraft,
                              videos: (coachDraft.videos || []).filter((item) => item.id !== v.id),
                            })
                          }
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

        {/* ==================================================================
            MODO B: PANEL DE CLUB ALIADO
            ================================================================== */}
        {studioRole === 'CLUB' && (
          <>
            <div className="tt-pst-selector-row">
              {(clubs || INITIAL_CLUBS).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`tt-pst-sel-chip ${selectedClubId === c.id ? 'is-on' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedClubId(c.id);
                  }}
                >
                  {c.shortName}
                </button>
              ))}
            </div>

            <div className="tt-pst-subtabs" role="tablist">
              <span
                className="tt-pst-subtab-slider is-gold"
                aria-hidden="true"
                style={{ transform: `translateX(${Math.max(0, clubTabIdx) * 100}%)` }}
              />
              {[
                { id: 'estado', label: 'Club & Web' },
                { id: 'vitrina', label: 'Fotos & VIP' },
                { id: 'promos', label: 'Promos' },
                { id: 'validar', label: 'Validar VIP' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={clubTab === t.id}
                  className={`tt-pst-subtab is-gold-mode ${clubTab === t.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setClubTab(t.id);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* CLUB TAB 1: CLIMA + CANAL WEB EXTERNO DE RESERVAS + TARIFAS */}
            {clubTab === 'estado' && (
              <div key="cl-estado" className="tt-pst-section tt-pst-enter">
                {/* Clima rápido de recepción */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mini-kicker">RECEPCIÓN · ESTADO DE ARCILLA EN VIVO</span>
                  <div className="tt-pst-wq-row">
                    {WEATHER_QUICK_OPTS.map((w) => {
                      const active = clubDraft.climaBase?.conditionKey === w.key;
                      return (
                        <button
                          key={w.key}
                          type="button"
                          className={`tt-pst-wq-btn ${active ? 'is-on' : ''}`}
                          style={active ? { borderColor: w.color, color: w.color } : undefined}
                          onClick={() => {
                            triggerHaptic('success');
                            if (onUpdateClubWeather) {
                              onUpdateClubWeather({ clubId: clubDraft.id, conditionKey: w.key });
                            }
                            saveClubToCloud(
                              {
                                ...clubDraft,
                                climaBase: { ...(clubDraft.climaBase || {}), conditionKey: w.key },
                              },
                              `Estado actualizado en ${clubDraft.shortName}: ${w.label}.`
                            );
                          }}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Canal Directo a Página Web de Reservas del Club (ej. Romina) */}
                <div className="tt-pst-card is-highlight">
                  <span className="tt-pst-mini-kicker">CONEXIÓN CON TU WEB DE RESERVAS</span>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Enlace de Reservas Online</h3>
                  <p className="tt-pst-help">
                    Si tu club tiene su propia web de reservas, pégala aquí. TOTAL TENIS enviará tráfico identificado (UTM) directo a tu página y mostrará tu código de beneficio VIP.
                  </p>

                  <label className="tt-pst-lbl">
                    <span>URL de tu página de reservas (opcional)</span>
                    <input
                      type="url"
                      className="tt-pst-input"
                      value={clubDraft.rates?.bookingUrl || ''}
                      onChange={(e) =>
                        setClubDraft((prev) => ({
                          ...prev,
                          rates: { ...prev.rates, bookingUrl: e.target.value },
                        }))
                      }
                      placeholder="https://reservas.tuclub.pe"
                    />
                  </label>

                  <div className="tt-pst-grid-2">
                    <label className="tt-pst-lbl">
                      <span>Código dcto. VIP en tu web</span>
                      <input
                        type="text"
                        className="tt-pst-input"
                        value={clubDraft.rates?.bookingVipCode || ''}
                        onChange={(e) =>
                          setClubDraft((prev) => ({
                            ...prev,
                            rates: { ...prev.rates, bookingVipCode: e.target.value.toUpperCase() },
                          }))
                        }
                        placeholder="Ej. TOTALTENIS15"
                      />
                    </label>
                    <label className="tt-pst-lbl">
                      <span>WhatsApp del Club</span>
                      <input
                        type="tel"
                        className="tt-pst-input"
                        value={clubDraft.whatsapp || ''}
                        onChange={(e) =>
                          setClubDraft((prev) => ({ ...prev, whatsapp: e.target.value }))
                        }
                        placeholder="964..."
                      />
                    </label>
                  </div>
                </div>

                {/* Tarifas y Horarios */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mini-kicker">TARIFAS POR HORA (S/) Y HORARIO</span>
                  <div className="tt-pst-grid-2">
                    <label className="tt-pst-lbl">
                      <span>Día Regular (S/)</span>
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={clubDraft.rates?.diaRegular || 32}
                        onChange={(e) =>
                          setClubDraft((prev) => ({
                            ...prev,
                            rates: { ...prev.rates, diaRegular: Number(e.target.value) || 0 },
                          }))
                        }
                      />
                    </label>
                    <label className="tt-pst-lbl">
                      <span>Día Socio VIP (S/)</span>
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={clubDraft.rates?.diaVip || 24}
                        onChange={(e) =>
                          setClubDraft((prev) => ({
                            ...prev,
                            rates: { ...prev.rates, diaVip: Number(e.target.value) || 0 },
                          }))
                        }
                      />
                    </label>
                    <label className="tt-pst-lbl">
                      <span>Noche LED Regular (S/)</span>
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={clubDraft.rates?.nocheRegular || 42}
                        onChange={(e) =>
                          setClubDraft((prev) => ({
                            ...prev,
                            rates: { ...prev.rates, nocheRegular: Number(e.target.value) || 0 },
                          }))
                        }
                      />
                    </label>
                    <label className="tt-pst-lbl">
                      <span>Noche LED VIP (S/)</span>
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={clubDraft.rates?.nocheVip || 34}
                        onChange={(e) =>
                          setClubDraft((prev) => ({
                            ...prev,
                            rates: { ...prev.rates, nocheVip: Number(e.target.value) || 0 },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className="tt-pst-lbl">
                    <span>Horario de atención</span>
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={clubDraft.hours || ''}
                      onChange={(e) =>
                        setClubDraft((prev) => ({ ...prev, hours: e.target.value }))
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="tt-btn tt-btn-primary"
                    style={{ width: '100%' }}
                    onClick={() =>
                      saveClubToCloud(clubDraft, `Datos de ${clubDraft.shortName} guardados en la nube.`)
                    }
                  >
                    Guardar Configuración del Club
                  </button>
                </div>
              </div>
            )}

            {/* CLUB TAB 2: FOTOS CARRUSEL + BENEFICIOS VIP PROPIOS */}
            {clubTab === 'vitrina' && (
              <div key="cl-vitrina" className="tt-pst-section tt-pst-enter">
                <div className="tt-pst-card">
                  <div className="tt-pst-sec-head">
                    <div>
                      <span className="tt-pst-mini-kicker">CARRUSEL DE LA SEDE</span>
                      <h3>Fotos de tus Canchas</h3>
                    </div>
                    <input
                      ref={clubPhotoRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadClubGalleryPhoto}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={isUploadingMedia}
                      className="tt-btn tt-btn-primary tt-btn-sm"
                      onClick={() => clubPhotoRef.current?.click()}
                    >
                      <TTIcon name="camera" size={15} />
                      {isUploadingMedia ? 'Subiendo...' : '+ Subir Foto'}
                    </button>
                  </div>

                  <div className="tt-club-gal-grid">
                    {(clubDraft.gallery || []).map((g) => (
                      <div key={g.id} className="tt-club-gal-item">
                        <SmartImage
                          src={g.image}
                          fallbackSrc={ASSETS.torneoApertura}
                          alt={g.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="tt-club-gal-del"
                          aria-label="Quitar foto"
                          onClick={() => handleRemoveClubPhoto(g.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beneficios VIP propios de este club */}
                <div className="tt-pst-card">
                  <span className="tt-pst-mini-kicker">BOTÓN «BENEFICIOS VIP EN ESTE CLUB»</span>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Ventajas Exclusivas para Socios VIP</h3>

                  <div className="tt-pst-cards-stack">
                    {(clubDraft.vipBenefits || []).map((b, idx) => (
                      <div key={idx} className="tt-vip-ben-row">
                        <span>• {b}</span>
                        <button
                          type="button"
                          className="tt-pst-del-btn"
                          onClick={() => handleRemoveVipBenefit(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddVipBenefit} className="tt-pst-inline-row">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newVipBenefit}
                      onChange={(e) => setNewVipBenefit(e.target.value)}
                      placeholder="Ej. -15% en alquiler Mar y Jue mañana"
                    />
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Añadir
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* CLUB TAB 3: PROMOS HORAS VALLE Y TORNEOS INTERNOS */}
            {clubTab === 'promos' && (
              <div key="cl-promos" className="tt-pst-section tt-pst-enter">
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">LLENA HORARIOS VALLE</span>
                    <h3>Promociones de Cancha</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
                    onClick={() => setShowAddPromo((v) => !v)}
                  >
                    {showAddPromo ? 'Cerrar' : '+ Promo'}
                  </button>
                </div>

                {showAddPromo && (
                  <form onSubmit={handleAddClubPromo} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      placeholder="Título (ej. Mañanas de Arcilla -20%)"
                      required
                    />
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={promoSchedule}
                      onChange={(e) => setPromoSchedule(e.target.value)}
                      placeholder="Horario"
                    />
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={promoPrice}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      placeholder="Tarifa promocional"
                    />
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Publicar Promo
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {(clubDraft.promos || []).map((pr) => (
                    <article key={pr.id} className="tt-pst-pkg-card">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4>{pr.title}</h4>
                        <small>
                          {pr.schedule} · {pr.priceNote}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="tt-pst-del-btn"
                        onClick={() =>
                          saveClubToCloud({
                            ...clubDraft,
                            promos: (clubDraft.promos || []).filter((x) => x.id !== pr.id),
                          })
                        }
                      >
                        ✕
                      </button>
                    </article>
                  ))}
                </div>

                <div className="tt-pst-sec-head" style={{ marginTop: 6 }}>
                  <div>
                    <span className="tt-pst-mini-kicker">COMUNIDAD DEL CLUB</span>
                    <h3>Torneos Internos</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-ghost tt-btn-sm"
                    onClick={() => setShowAddEvent((v) => !v)}
                  >
                    {showAddEvent ? 'Cerrar' : '+ Evento'}
                  </button>
                </div>

                {showAddEvent && (
                  <form onSubmit={handleAddClubEvent} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={evTitle}
                      onChange={(e) => setEvTitle(e.target.value)}
                      placeholder="Ej. Noche de Dobles Americano"
                      required
                    />
                    <div className="tt-pst-grid-3">
                      <input
                        type="text"
                        className="tt-pst-input"
                        value={evDate}
                        onChange={(e) => setEvDate(e.target.value)}
                      />
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={evFee}
                        onChange={(e) => setEvFee(e.target.value)}
                      />
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={evSpots}
                        onChange={(e) => setEvSpots(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Publicar Evento
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {(clubDraft.internalEvents || []).map((ev) => (
                    <article key={ev.id} className="tt-pst-pkg-card">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="tt-pgc-type">{ev.dateLabel}</span>
                        <h4>{ev.title}</h4>
                        <small>
                          Cuota S/ {ev.fee} · {ev.spotsUsed}/{ev.spotsTotal} inscritos
                        </small>
                      </div>
                      <button
                        type="button"
                        className="tt-pst-del-btn"
                        onClick={() =>
                          saveClubToCloud({
                            ...clubDraft,
                            internalEvents: (clubDraft.internalEvents || []).filter(
                              (x) => x.id !== ev.id
                            ),
                          })
                        }
                      >
                        ✕
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* CLUB TAB 4: VALIDADOR INSTANTÁNEO DE CARNET VIP EN RECEPCIÓN */}
            {clubTab === 'validar' && (
              <div key="cl-validar" className="tt-pst-section tt-pst-enter">
                <div className="tt-pst-card">
                  <span className="tt-pst-mini-kicker">VERIFICACIÓN EN RECEPCIÓN</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Validar Carnet Socio VIP</h3>
                  <p className="tt-pst-help">
                    Busca al jugador por nombre, código TT-2026 o celular para aplicar su tarifa preferencial al instante.
                  </p>
                  <input
                    type="search"
                    className="tt-pst-input"
                    value={vipSearch}
                    onChange={(e) => setVipSearch(e.target.value)}
                    placeholder="Nombre, código TT-2026 o celular..."
                  />

                  {vipSearch.trim().length > 0 && (
                    <div className="tt-pst-cards-stack" style={{ marginTop: 4 }}>
                      {vipValidationMatches.length === 0 ? (
                        <small className="tt-muted">No se encontró ningún jugador con ese dato.</small>
                      ) : (
                        vipValidationMatches.map((p) => (
                          <div key={p.id} className="tt-pst-val-row">
                            <SmartImage
                              src={p.avatar}
                              alt={p.name}
                              initials={p.name}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                objectPosition: 'center top',
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong>{p.name}</strong>
                              <small>
                                {p.credentialId || 'Socio'} · {getCategoryByPoints(p.points).name}
                              </small>
                            </div>
                            <span className={`tt-val-pill ${p.isVip ? 'is-vip' : 'is-std'}`}>
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
        .tt-ps-studio { display: flex; flex-direction: column; gap: 14px; }

        .tt-pst-hero {
          border-radius: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #24093F 0%, #130322 100%);
          color: #FAF9F5;
          border: 1px solid rgba(250, 249, 245, 0.14);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-pst-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .tt-pst-kicker { font-size: 0.58rem; font-weight: 900; letter-spacing: 0.1em; color: #00DC7D; }
        .tt-sync-pill {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.14);
          color: #7CF5C0;
          font-size: 0.6rem;
          font-weight: 800;
        }
        .tt-sync-pill.is-saving { background: rgba(229, 193, 108, 0.2); color: #F3DC9B; }
        .tt-sync-pill.is-error { background: rgba(248, 113, 113, 0.2); color: #FCA5A5; }
        .tt-pst-hero h2 { margin: 3px 0 0; font-family: var(--tt-font-display); font-size: 1.44rem; line-height: 1.04; }

        .tt-pst-role-switch { display: inline-flex; padding: 3px; border-radius: 999px; background: rgba(250, 249, 245, 0.1); }
        .tt-pst-role-switch button { padding: 6px 12px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; color: rgba(250, 249, 245, 0.76); }
        .tt-pst-role-switch button.is-active { background: #FAF9F5; color: #1E0734; font-weight: 900; }

        .tt-pst-kpi-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tt-pst-kpi-strip > div { padding: 9px 8px; border-radius: 13px; background: rgba(250, 249, 245, 0.07); text-align: center; }
        .tt-pst-kpi-strip span { display: block; font-size: 0.56rem; font-weight: 800; letter-spacing: 0.07em; opacity: 0.72; }
        .tt-pst-kpi-strip strong { font-family: var(--tt-font-display); font-size: 1.28rem; line-height: 1.08; }
        .tt-pst-kpi-strip .is-emerald strong { color: #00DC7D; }

        .tt-pst-selector-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
        .tt-pst-sel-chip {
          flex-shrink: 0;
          padding: 6px 12px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.72rem;
          font-weight: 800;
        }
        .tt-pst-sel-chip.is-on { background: #1E0734; border-color: #00DC7D; color: #00DC7D; }

        /* Subtabs con slider suave */
        .tt-pst-subtabs {
          position: relative;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          padding: 4px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-pst-subtab-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc((100% - 8px) / 4);
          border-radius: 11px;
          background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%);
          transition: transform 300ms cubic-bezier(0.22, 1.22, 0.36, 1);
          pointer-events: none;
          z-index: 0;
        }
        .tt-pst-subtab-slider.is-gold {
          background: linear-gradient(135deg, #F3DC9B 0%, #C89F45 100%);
        }
        .tt-ps-studio.is-light .tt-pst-subtab-slider:not(.is-gold) { background: #1E0734; }
        .tt-pst-subtab {
          position: relative;
          z-index: 1;
          min-height: 38px;
          padding: 0 4px;
          border-radius: 11px;
          font-size: 0.71rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          white-space: nowrap;
        }
        .tt-pst-subtab.is-active { color: #10021E; font-weight: 900; }
        .tt-ps-studio.is-light .tt-pst-subtab:not(.is-gold-mode).is-active { color: #00DC7D; }

        .tt-pst-section { display: flex; flex-direction: column; gap: 12px; }
        .tt-pst-enter { animation: ttPstIn 280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes ttPstIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tt-pst-card {
          padding: 14px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-pst-card.is-highlight { border-color: rgba(0, 220, 125, 0.4); }
        .tt-pst-sec-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .tt-pst-mini-kicker { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.08em; color: var(--tt-emerald-text); }
        .tt-pst-sec-head h3 { margin: 2px 0 0; font-family: var(--tt-font-display); font-size: 1.2rem; line-height: 1.05; }
        .tt-pst-help { margin: 0; font-size: 0.75rem; line-height: 1.4; color: var(--tt-text-muted); }
        .tt-pst-link-btn { font-size: 0.74rem; font-weight: 800; color: var(--tt-emerald-text); }

        .tt-quick-slots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; }
        @media (min-width: 540px) {
          .tt-quick-slots-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .tt-qs-pill {
          min-height: 38px;
          padding: 0 10px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-qs-pill.is-active { background: #00DC7D; border-color: #00DC7D; color: #10021E; }

        .tt-pst-inline-row { display: flex; gap: 8px; align-items: center; }
        .tt-pst-wa-banner {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 13px;
          background: rgba(37, 211, 102, 0.14);
          border: 1px solid rgba(37, 211, 102, 0.38);
          color: #16A34A;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.76rem;
          font-weight: 800;
        }
        .tt-ps-studio.is-dark .tt-pst-wa-banner { color: #4ADE80; }

        .tt-pst-mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; }
        .tt-pst-mini-stats > div { padding: 10px 6px; border-radius: 13px; background: var(--tt-surface); }
        .tt-pst-mini-stats strong { display: block; font-family: var(--tt-font-display); font-size: 1.35rem; color: var(--tt-emerald-text); }
        .tt-pst-mini-stats span { font-size: 0.68rem; color: var(--tt-text-muted); }

        .tt-pst-inline-form {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-pst-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tt-pst-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tt-pst-lbl, .tt-pst-field-lbl { display: flex; flex-direction: column; gap: 5px; font-size: 0.72rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-pst-input {
          width: 100%;
          min-height: 42px;
          padding: 8px 12px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border-medium);
          color: var(--tt-text);
          font-size: 16px;
        }
        .tt-pst-toggle-btn { min-height: 42px; border-radius: 12px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); color: var(--tt-text); font-size: 0.76rem; font-weight: 800; }
        .tt-pst-toggle-btn.is-on { border-color: #E5C16C; color: #E5C16C; }

        .tt-pst-cards-stack { display: flex; flex-direction: column; gap: 8px; }
        .tt-pst-pkg-card,
        .tt-pst-group-card,
        .tt-pst-vid-row,
        .tt-vip-ben-row {
          padding: 11px 12px;
          border-radius: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-pst-group-card { flex-direction: column; align-items: stretch; gap: 9px; }
        .tt-pst-pkg-card h4, .tt-pgc-top h4 { margin: 2px 0; font-size: 0.88rem; }
        .tt-pst-pkg-card small, .tt-pst-vid-row small { display: block; font-size: 0.72rem; color: var(--tt-text-muted); }
        .tt-pst-badge-soft { padding: 2px 7px; border-radius: 999px; background: rgba(0, 220, 125, 0.14); color: var(--tt-emerald-text); font-size: 0.58rem; font-weight: 900; }
        .tt-pst-del-btn { width: 30px; height: 30px; border-radius: 50%; background: var(--tt-surface-2); color: var(--tt-text-muted); flex-shrink: 0; font-size: 0.8rem; }

        .tt-pgc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .tt-pgc-type { font-size: 0.62rem; font-weight: 900; letter-spacing: 0.07em; color: var(--tt-emerald-text); text-transform: uppercase; }
        .tt-pgc-spots-badge { padding: 5px 10px; border-radius: 11px; background: #1E0734; color: #FAF9F5; text-align: center; }
        .tt-pgc-spots-badge strong { display: block; font-family: var(--tt-font-display); font-size: 1.1rem; line-height: 1; color: #00DC7D; }
        .tt-pgc-spots-badge span { font-size: 0.54rem; opacity: 0.75; font-weight: 800; }
        .tt-pgc-bar { height: 6px; border-radius: 999px; background: var(--tt-surface-2); overflow: hidden; }
        .tt-pgc-bar > div { height: 100%; border-radius: 999px; background: #00DC7D; }
        .tt-pgc-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .tt-pgc-controls { display: flex; align-items: center; gap: 6px; }
        .tt-mini-step { width: 32px; height: 32px; border-radius: 10px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text); font-weight: 900; }
        .tt-mini-step.is-plus { background: #00DC7D; border-color: #00DC7D; color: #10021E; }
        .tt-pgc-wa-btn { min-height: 32px; padding: 0 10px; border-radius: 10px; background: rgba(37, 211, 102, 0.14); border: 1px solid rgba(37, 211, 102, 0.38); color: #16A34A; font-size: 0.7rem; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; }
        .tt-ps-studio.is-dark .tt-pgc-wa-btn { color: #4ADE80; }

        .tt-pst-student-row {
          padding: 11px 12px;
          border-radius: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-pst-student-row small { display: block; font-size: 0.7rem; color: var(--tt-text-muted); }
        .tt-st-level-chip { padding: 2px 7px; border-radius: 999px; background: var(--tt-surface-2); color: var(--tt-emerald-text); font-size: 0.62rem; font-weight: 900; }
        .tt-st-actions { display: flex; align-items: center; gap: 6px; }
        .tt-st-pill { min-height: 30px; padding: 0 9px; border-radius: 999px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.68rem; font-weight: 800; }
        .tt-st-pill.is-ok { background: rgba(0, 220, 125, 0.16); border-color: rgba(0, 220, 125, 0.45); color: var(--tt-emerald-text); }
        .tt-st-pill.is-due { background: rgba(229, 193, 108, 0.18); border-color: rgba(229, 193, 108, 0.5); color: #B45309; }
        .tt-ps-studio.is-dark .tt-st-pill.is-due { color: #F3DC9B; }
        .tt-st-wa-icon { width: 30px; height: 30px; border-radius: 50%; background: rgba(37, 211, 102, 0.16); color: #22C55E; display: inline-flex; align-items: center; justify-content: center; }

        /* Marca Personal Coach */
        .tt-brand-photo-row { display: flex; align-items: center; gap: 12px; }
        .tt-theme-swatches { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 6px; }
        .tt-swatch-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 11px;
          border-radius: 999px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.72rem;
          font-weight: 800;
        }
        .tt-swatch-pill span { width: 10px; height: 10px; border-radius: 50%; }
        .tt-swatch-pill.is-on { border-color: #00DC7D; }
        .tt-spec-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .tt-spec-btn { padding: 5px 10px; border-radius: 999px; background: var(--tt-surface); border: 1px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.71rem; font-weight: 700; }
        .tt-spec-btn.is-on { background: rgba(0, 220, 125, 0.16); border-color: #00DC7D; color: var(--tt-emerald-text); font-weight: 800; }

        /* Club Clima + Galería + Validador */
        .tt-pst-wq-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .tt-pst-wq-btn { min-height: 38px; border-radius: 11px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); color: var(--tt-text); font-size: 0.74rem; font-weight: 800; }
        .tt-club-gal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tt-club-gal-item { position: relative; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: #140324; }
        .tt-club-gal-del { position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; border-radius: 50%; background: rgba(16, 3, 29, 0.85); color: #FAF9F5; font-size: 0.72rem; }
        .tt-vip-ben-row span { font-size: 0.76rem; color: var(--tt-text); }

        .tt-pst-val-row { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-radius: 13px; background: var(--tt-surface); border: 1px solid var(--tt-border); }
        .tt-pst-val-row strong { display: block; font-size: 0.85rem; }
        .tt-pst-val-row small { font-size: 0.69rem; color: var(--tt-text-muted); }
        .tt-val-pill { padding: 4px 10px; border-radius: 999px; font-size: 0.66rem; font-weight: 900; white-space: nowrap; }
        .tt-val-pill.is-vip { background: linear-gradient(135deg, #F3DC9B 0%, #C89F45 100%); color: #1A0D00; }
        .tt-val-pill.is-std { background: var(--tt-surface-2); color: var(--tt-text-muted); }
      `}</style>
    </ModalPortal>
  );
}
