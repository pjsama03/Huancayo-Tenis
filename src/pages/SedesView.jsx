import React, { useEffect, useMemo, useState } from 'react';
import {
  ASSETS,
  EmptyStateCard,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import {
  APP_CONFIG,
  INITIAL_CLUBS,
} from '../data/playersAndClubsData';
import { fetchLiveClubWeather } from '../utils/tenisEngine';
import {
  buildWhatsappLink,
  incrementCoachMetric,
  submitWeatherReportRpc,
} from '../utils/cloudService';

/* ==========================================================================
   MATRIZ CLIMÁTICA (4 ESTADOS CON ICONOS 3D · REPORTE SOLO DENTRO DEL CLUB)
   ========================================================================== */
const WEATHER_STATES = [
  {
    key: 'seco',
    label: 'Cancha Seca',
    shortLabel: 'Seca',
    badge: 'Óptima',
    color: '#00DC7D',
    icon: ASSETS.climaSeco || '/assets/canva-clima-seco.png',
    note: 'Tracción limpia y pique rápido.',
  },
  {
    key: 'humedad',
    label: 'Humedad Leve',
    shortLabel: 'Húmeda',
    badge: 'Jugable',
    color: '#38BDF8',
    icon: ASSETS.climaHumedad || '/assets/canva-clima-humedad.png',
    note: 'Arcilla blanda con bote más lento.',
  },
  {
    key: 'llovizna',
    label: 'Llovizna',
    shortLabel: 'Llovizna',
    badge: 'Precaución',
    color: '#E5C16C',
    icon: ASSETS.climaLlovizna || '/assets/canva-clima-llovizna.png',
    note: 'Líneas resbalosas. Juega con precaución.',
  },
  {
    key: 'lluvia',
    label: 'Lluvia Fuerte',
    shortLabel: 'Lluvia',
    badge: 'Pausada',
    color: '#F87171',
    icon: ASSETS.climaLluvia || '/assets/canva-clima-lluvia.png',
    note: 'Arcilla encharcada hasta secado.',
  },
];

/* ==========================================================================
   TEMAS REFINADOS PARA TARJETAS DE COACH (ALTO CONTRASTE · CERO NEÓN CHILLÓN)
   ========================================================================== */
const COACH_THEMES = {
  emerald: {
    accent: '#00DC7D',
    accentLight: '#007A44',
    soft: 'rgba(0, 220, 125, 0.14)',
    border: 'rgba(0, 220, 125, 0.38)',
  },
  gold: {
    accent: '#E5C16C',
    accentLight: '#9A6B16',
    soft: 'rgba(229, 193, 108, 0.15)',
    border: 'rgba(229, 193, 108, 0.44)',
  },
  clay: {
    accent: '#E28C6E',
    accentLight: '#A84826',
    soft: 'rgba(226, 140, 110, 0.15)',
    border: 'rgba(226, 140, 110, 0.42)',
  },
  royal: {
    accent: '#93C5FD',
    accentLight: '#1D4ED8',
    soft: 'rgba(147, 197, 253, 0.15)',
    border: 'rgba(147, 197, 253, 0.4)',
  },
};

/* ==========================================================================
   COACHES DE RESPALDO LIMPIOS (SI SUPABASE AÚN NO TIENE FILAS)
   ========================================================================== */
const FALLBACK_COACHES = [
  {
    id: 'coach-romina',
    name: 'Romina Cutipa',
    title: 'Head Coach · Alta Competencia',
    clubId: 'club-romina',
    clubName: 'Academia Romina Cutipa',
    featured: true,
    accentTheme: 'emerald',
    photoUrl: '/assets/sede-romina-cutipa.jpg',
    coverUrl: '/assets/torneo-altura.jpg',
    specialties: ['Saque & Efecto', 'Táctica Arcilla', 'Damas & Adultos'],
    baseRate: 60,
    vipRate: 50,
    freeSlotToday: 'Hoy · 06:00 p. m.',
    whatsapp: '51964201001',
    videos: [
      {
        id: 'vid-rom-1',
        title: 'Topspin profundo en altura',
        duration: '02:18',
        src: '/assets/video-coach-romina.mp4',
        poster: '/assets/portada-tips-semana.jpg',
        isExclusive: false,
        gemsCost: 0,
      },
      {
        id: 'vid-rom-2',
        title: 'Masterclass: Ángulos en arcilla',
        duration: '06:45',
        src: '/assets/video-coach-demo-3.mp4',
        poster: '/assets/portada-academia-tv.jpg',
        isExclusive: true,
        gemsCost: 40,
      },
    ],
    packages: [
      {
        id: 'pk-r1',
        type: 'Privada 1 a 1',
        name: 'Sesión Técnica (60 min)',
        price: 60,
        vipPrice: 50,
        badge: 'VIDEO FEEDBACK',
      },
      {
        id: 'pk-r2',
        type: 'Grupal (Máx. 4)',
        name: 'Grupo Competitivo 5ª A / 4ª',
        price: 35,
        vipPrice: 28,
        badge: '2 CUPOS LIBRES',
      },
      {
        id: 'pk-r3',
        type: 'Pack Mensual',
        name: 'Plan Ascenso · 8 Clases',
        price: 440,
        vipPrice: 380,
        badge: 'MÁS ELEGIDO',
      },
    ],
    groups: [
      { id: 'sl-r1', day: 'Mar', time: '08:00 a. m.', label: 'Privada 1 a 1' },
      { id: 'sl-r2', day: 'Mié', time: '06:00 p. m.', label: 'Grupal (2/4)' },
      { id: 'sl-r3', day: 'Vie', time: '05:00 p. m.', label: 'Clínica Saque' },
      { id: 'sl-r4', day: 'Sáb', time: '09:30 a. m.', label: 'Evaluación' },
    ],
  },
  {
    id: 'coach-rodrigo',
    name: 'Rodrigo Quispe',
    title: 'Coach Competitivo · 4ª / 3ª Cat.',
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    featured: false,
    accentTheme: 'gold',
    photoUrl: '/assets/sede-country-club.jpg',
    coverUrl: '/assets/torneo-apertura.jpg',
    specialties: ['Derecha de Ataque', 'Sparring Real', 'Senior +40'],
    baseRate: 65,
    vipRate: 54,
    freeSlotToday: 'Hoy · 07:00 p. m.',
    whatsapp: '51964202002',
    videos: [
      {
        id: 'vid-rod-1',
        title: 'Derecha invertida en arcilla',
        duration: '03:04',
        src: '/assets/video-coach-rodrigo.mp4',
        poster: '/assets/portada-tips-semana.jpg',
        isExclusive: false,
        gemsCost: 0,
      },
    ],
    packages: [
      {
        id: 'pk-v1',
        type: 'Privada',
        name: 'Clase Competitiva (60 min)',
        price: 65,
        vipPrice: 54,
        badge: 'TÁCTICA',
      },
      {
        id: 'pk-v2',
        type: 'Sparring',
        name: 'Set con Feedback en Vivo',
        price: 55,
        vipPrice: 46,
        badge: 'PRE-TORNEO',
      },
      {
        id: 'pk-v3',
        type: 'Pack 4 Clases',
        name: 'Pack Consolidación',
        price: 230,
        vipPrice: 195,
        badge: 'PROMO MES',
      },
    ],
    groups: [
      { id: 'sl-v1', day: 'Lun', time: '06:00 p. m.', label: 'Sparring' },
      { id: 'sl-v2', day: 'Jue', time: '07:00 p. m.', label: 'Grupo 4ª/3ª' },
      { id: 'sl-v3', day: 'Sáb', time: '08:00 a. m.', label: 'Privada' },
    ],
  },
  {
    id: 'coach-carlos',
    name: 'Carlos Mendoza',
    title: 'Iniciación & Base Técnica 5ª',
    clubId: 'club-tauro',
    clubName: 'Club Tauro Tenis',
    featured: false,
    accentTheme: 'clay',
    photoUrl: '/assets/sede-club-tauro.jpg',
    coverUrl: '/assets/torneo-dobles-valle.jpg',
    specialties: ['5ª P a 5ª A', 'Empuñaduras', 'Regularidad'],
    baseRate: 50,
    vipRate: 42,
    freeSlotToday: 'Mañana · 07:00 p. m.',
    whatsapp: '51964203003',
    videos: [
      {
        id: 'vid-car-1',
        title: '3 claves para subir de 5ª P',
        duration: '02:45',
        src: '/assets/video-coach-demo-4.mp4',
        poster: '/assets/torneo-dobles-valle.jpg',
        isExclusive: false,
        gemsCost: 0,
      },
    ],
    packages: [
      {
        id: 'pk-c1',
        type: 'Privada',
        name: 'Fundamentos 1 a 1 (60 min)',
        price: 50,
        vipPrice: 42,
        badge: 'IDEAL INICIO',
      },
      {
        id: 'pk-c2',
        type: 'Grupal',
        name: 'Escuela Nocturna 5ª Cat.',
        price: 30,
        vipPrice: 24,
        badge: '2 CUPOS',
      },
    ],
    groups: [
      { id: 'sl-c1', day: 'Mar', time: '07:00 p. m.', label: 'Grupal 5ª' },
      { id: 'sl-c2', day: 'Jue', time: '07:00 p. m.', label: 'Grupal 5ª' },
      { id: 'sl-c3', day: 'Sáb', time: '10:00 a. m.', label: 'Privada' },
    ],
  },
];

/* ==========================================================================
   NORMALIZADORES SEGUROS (SOPORTA SUPABASE + FALLBACK LOCAL SIN ERRORES)
   ========================================================================== */
function normalizeClubData(club) {
  const cover = club.cover || club.coverUrl || club.banner || ASSETS.torneoApertura;
  const rawGallery =
    Array.isArray(club.gallery) && club.gallery.length > 0
      ? club.gallery
      : Array.isArray(club.galeria) && club.galeria.length > 0
      ? club.galeria
      : [{ id: 'c-0', title: club.shortName || club.name, image: cover }];

  const gallery = rawGallery
    .map((item, idx) =>
      typeof item === 'string'
        ? { id: `g-${idx}`, title: `Cancha ${idx + 1}`, image: item }
        : {
            id: item.id || `g-${idx}`,
            title: item.title || `Vista ${idx + 1}`,
            image: item.image || item.url || cover,
          }
    )
    .filter((g) => Boolean(g.image));

  const ratesObj = club.rates || club.tarifas || {};
  const diaReg = ratesObj.diaRegular ?? ratesObj.dayRegular ?? 32;
  const diaVip = ratesObj.diaVip ?? ratesObj.dayVip ?? Math.max(18, diaReg - 8);
  const nocheReg = ratesObj.nocheRegular ?? ratesObj.nightRegular ?? 42;
  const nocheVip = ratesObj.nocheVip ?? ratesObj.nightVip ?? Math.max(26, nocheReg - 8);

  const rawServices =
    Array.isArray(club.services) && club.services.length > 0
      ? club.services
      : Array.isArray(club.instalaciones) && club.instalaciones.length > 0
      ? club.instalaciones
      : ['Canchas de arcilla', 'Iluminación LED', 'Estacionamiento', 'Vestuarios'];

  const services = rawServices.map((s) => (typeof s === 'string' ? s : s.label || '')).filter(Boolean);

  const vipBenefits =
    Array.isArray(club.vipBenefits) && club.vipBenefits.length > 0
      ? club.vipBenefits
      : [
          `Tarifa VIP: S/ ${diaVip} día · S/ ${nocheVip} noche LED`,
          'Prioridad de reserva en horarios estelares',
          'Beneficios exclusivos presentando tu Carnet 3D',
        ];

  const promos =
    Array.isArray(club.promos) && club.promos.length > 0
      ? club.promos
      : Array.isArray(club.promosHorasValle)
      ? club.promosHorasValle
      : [];

  return {
    ...club,
    logo: club.logo || club.logoUrl || ASSETS.logo,
    cover,
    gallery,
    rates: { diaReg, diaVip, nocheReg, nocheVip },
    services,
    vipBenefits,
    promos,
    mapsUrl:
      club.mapsUrl ||
      club.googleMapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${club.name} Huancayo Peru`)}`,
  };
}

function normalizeCoachData(c) {
  const rawPackages =
    Array.isArray(c.packages) && c.packages.length > 0
      ? c.packages
      : Array.isArray(c.programs) && c.programs.length > 0
      ? c.programs
      : Array.isArray(c.modalidades) && c.modalidades.length > 0
      ? c.modalidades
      : [
          {
            id: `${c.id}-p1`,
            type: 'Privada 1 a 1',
            name: 'Sesión Técnica (60 min)',
            price: Number(c.baseRate ?? c.basePriceRegular) || 60,
            vipPrice: Number(c.vipRate ?? c.basePriceVip) || 50,
            badge: 'PERSONALIZADA',
          },
        ];

  const packages = rawPackages.map((pk, idx) => ({
    id: pk.id || `${c.id}-pk-${idx}`,
    type: pk.type || 'Clase',
    name: pk.name || pk.title || pk.type || 'Sesión en cancha',
    price: Number(pk.price ?? pk.priceRegular ?? c.baseRate) || 60,
    vipPrice: Number(pk.vipPrice ?? pk.priceVip ?? c.vipRate) || 50,
    badge: pk.badge || pk.highlight || '',
  }));

  const rawSlots =
    Array.isArray(c.groups) && c.groups.length > 0
      ? c.groups
      : Array.isArray(c.slots) && c.slots.length > 0
      ? c.slots
      : Array.isArray(c.horariosSemanales) && c.horariosSemanales.length > 0
      ? c.horariosSemanales
      : [];

  const slots = rawSlots.map((sl, idx) => ({
    id: sl.id || `${c.id}-sl-${idx}`,
    day: sl.day || 'Turno',
    time: sl.time || '',
    label: sl.label || sl.slot || sl.name || 'Disponible',
  }));

  const rawVideos =
    Array.isArray(c.videos) && c.videos.length > 0
      ? c.videos
      : Array.isArray(c.videosEnCancha)
      ? c.videosEnCancha
      : [];

  const specialties = Array.isArray(c.specialties) && c.specialties.length > 0
    ? c.specialties
    : c.specialty
    ? String(c.specialty).split(',').map((s) => s.trim()).filter(Boolean)
    : ['Técnica', 'Táctica', 'Arcilla'];

  return {
    ...c,
    photo: c.photo || c.photoUrl || c.portrait || ASSETS.torneoApertura,
    cover: c.coverUrl || c.courtBackground || c.photo || c.photoUrl || ASSETS.torneoAltura,
    baseRate: Number(c.baseRate ?? c.basePriceRegular) || packages[0]?.price || 60,
    vipRate: Number(c.vipRate ?? c.basePriceVip) || packages[0]?.vipPrice || 50,
    specialties: specialties.slice(0, 3),
    packages,
    slots,
    videos: rawVideos,
    accentTheme: COACH_THEMES[c.accentTheme] ? c.accentTheme : 'emerald',
  };
}

/* ==========================================================================
   VISTA PRINCIPAL: SedesView (SOLO SEDES Y COACHES · ESTÉTICA LIMPIA)
   ========================================================================== */
export default function SedesView({
  clubs = INITIAL_CLUBS,
  coaches = [],
  currentUser = null,
  theme = 'dark',
  onReportClubWeather,
  onUnlockMasterclassVideo,
  onOpenPartnerPortal,
  onOpenVipCard,
  onOpenAuth,
  onNotify,
}) {
  // Punto 19: Solo 2 sub-pestañas ('sedes' | 'coaches') — Vision IA vive en menú ☰
  const [activeTab, setActiveTab] = useState('sedes');

  // Clima discreto y reportes locales/cloud
  const [liveTempC, setLiveTempC] = useState(19);
  const [clubWeatherOverrides, setClubWeatherOverrides] = useState({});
  const [isReportingWeather, setIsReportingWeather] = useState(false);

  // Acordeón "Beneficios VIP en este club" por clubId
  const [openVipClubIds, setOpenVipClubIds] = useState({});

  // Modales en Portal
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [unlockedVideoIds, setUnlockedVideoIds] = useState([]);

  useEffect(() => {
    let active = true;
    const coords = clubs?.[0]?.coordinates || { lat: -12.0651, lng: -75.2049 };
    fetchLiveClubWeather(coords.lat, coords.lng).then((res) => {
      if (active && res?.ok && typeof res.tempC === 'number') {
        setLiveTempC(res.tempC);
      }
    });
    return () => {
      active = false;
    };
  }, [clubs]);

  const normalizedClubs = useMemo(
    () => (clubs?.length ? clubs : INITIAL_CLUBS).map(normalizeClubData),
    [clubs]
  );

  const normalizedCoaches = useMemo(() => {
    const source = Array.isArray(coaches) && coaches.length > 0 ? coaches : FALLBACK_COACHES;
    return source
      .filter((c) => c.active !== false)
      .map(normalizeCoachData)
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [coaches]);

  const selectedClub = useMemo(
    () => normalizedClubs.find((c) => c.id === selectedClubId) || null,
    [normalizedClubs, selectedClubId]
  );

  const selectedCoach = useMemo(
    () => normalizedCoaches.find((c) => c.id === selectedCoachId) || null,
    [normalizedCoaches, selectedCoachId]
  );

  const getClubWeather = (club) => {
    const ov = clubWeatherOverrides[club.id];
    const key = ov?.conditionKey || club.climaBase?.conditionKey || 'seco';
    const meta = WEATHER_STATES.find((w) => w.key === key) || WEATHER_STATES[0];
    return {
      ...meta,
      reportedBy: ov?.reportedBy || club.climaBase?.reportedBy || '',
      updatedLabel: ov?.updatedLabel || '',
    };
  };

  /* ------------------------------------------------------------------------
     ACCIONES DE SEDE (CARRUSEL, ACORDEÓN VIP Y REPORTE CLIMA ANTI-FARMEO)
     ------------------------------------------------------------------------ */
  const openClubSheet = (club) => {
    triggerHaptic('light');
    setCarouselIdx(0);
    setSelectedClubId(club.id);
  };

  const toggleClubVipBenefits = (clubId) => {
    triggerHaptic('light');
    setOpenVipClubIds((prev) => ({ ...prev, [clubId]: !prev[clubId] }));
  };

  const handleReportWeatherInsideClub = async (club, conditionKey) => {
    if (isReportingWeather) return;
    if (!currentUser?.id) {
      if (onNotify) onNotify('Inicia sesión para reportar el estado de la cancha.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    setIsReportingWeather(true);
    try {
      const timeLabel = new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (onReportClubWeather) {
        await onReportClubWeather({ clubId: club.id, conditionKey });
      } else {
        const res = await submitWeatherReportRpc({
          playerId: currentUser.id,
          clubId: club.id,
          conditionKey,
        });
        if (onNotify) {
          onNotify(
            res?.message ||
              (res?.gems_awarded > 0
                ? `Clima actualizado en ${club.shortName}. +${res.gems_awarded} Gemas sumadas.`
                : `Estado de cancha actualizado en ${club.shortName}.`),
            res?.gems_awarded > 0 ? 'success' : 'info'
          );
        }
      }

      setClubWeatherOverrides((prev) => ({
        ...prev,
        [club.id]: {
          conditionKey,
          reportedBy: currentUser.name,
          updatedLabel: `Hoy · ${timeLabel}`,
        },
      }));
      triggerHaptic('success');
    } catch {
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos enviar el reporte ahora. Intenta nuevamente.', 'warning');
    } finally {
      setIsReportingWeather(false);
    }
  };

  /* ------------------------------------------------------------------------
     ACCIONES DE COACH (MÉTRICAS REALES SUPABASE + RESERVA WHATSAPP +51)
     ------------------------------------------------------------------------ */
  const openCoachSheet = (coach) => {
    triggerHaptic('light');
    setSelectedCoachId(coach.id);
    setSelectedPackageId(coach.packages?.[0]?.id || null);
    setSelectedSlotId(coach.slots?.[0]?.id || null);
    incrementCoachMetric(coach.id, 'profile_views');
  };

  const handleCoachWhatsappClick = (coach, pkg = null, slot = null) => {
    triggerHaptic('medium');
    incrementCoachMetric(coach.id, 'whatsapp_clicks');
    const isVip = Boolean(currentUser?.isVip);
    const chosenPkg = pkg || coach.packages?.[0];
    const price = chosenPkg
      ? isVip
        ? chosenPkg.vipPrice
        : chosenPkg.price
      : isVip
      ? coach.vipRate
      : coach.baseRate;

    const msg = [
      `Hola Coach ${coach.name}, te escribo desde TOTAL TENIS:`,
      chosenPkg ? `• Clase: ${chosenPkg.name} (${chosenPkg.type})` : '• Consulta de horarios disponibles',
      slot ? `• Turno: ${slot.day} ${slot.time} (${slot.label})` : '',
      `• Tarifa: S/ ${price} (${isVip ? 'Socio VIP' : 'Regular'})`,
      currentUser?.name ? `• Jugador: ${currentUser.name}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    window.open(
      buildWhatsappLink(coach.whatsapp || APP_CONFIG.supportWhatsApp, msg),
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleOpenCoachVideo = (video) => {
    const isUnlocked =
      !video.isExclusive ||
      unlockedVideoIds.includes(video.id) ||
      (currentUser?.unlockedVideos || []).includes(video.id);

    if (isUnlocked) {
      triggerHaptic('light');
      setActiveVideoModal(video);
      return;
    }

    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para desbloquear esta clase con Gemas.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const myGems = Number(currentUser.gems) || 0;
    if (myGems < video.gemsCost) {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify(
          `Necesitas ${video.gemsCost} Gemas para ver esta clase (tienes ${myGems}).`,
          'warning'
        );
      }
      return;
    }

    if (onUnlockMasterclassVideo) {
      onUnlockMasterclassVideo({ videoId: video.id, gemsCost: video.gemsCost, title: video.title });
    }
    setUnlockedVideoIds((prev) => Array.from(new Set([...prev, video.id])));
    triggerHaptic('success');
    setActiveVideoModal(video);
  };

  const activePackage = useMemo(() => {
    if (!selectedCoach) return null;
    return (
      selectedCoach.packages?.find((p) => p.id === selectedPackageId) ||
      selectedCoach.packages?.[0] ||
      null
    );
  }, [selectedCoach, selectedPackageId]);

  const activeSlot = useMemo(() => {
    if (!selectedCoach) return null;
    return (
      selectedCoach.slots?.find((s) => s.id === selectedSlotId) ||
      selectedCoach.slots?.[0] ||
      null
    );
  }, [selectedCoach, selectedSlotId]);

  const isLight = theme === 'light';

  return (
    <section
      className={`tt-sedes-view ${isLight ? 'is-light' : 'is-dark'}`}
      aria-label="Sedes y Coaches TOTAL TENIS"
    >
      {/* ====================================================================
          1. CONMUTADOR LIMPIO DE 2 PESTAÑAS (SEDES | COACHES)
          ==================================================================== */}
      <div className="tt-sd-tabs" role="tablist" aria-label="Elegir Sedes o Coaches">
        <span
          className="tt-sd-tab-slider"
          aria-hidden="true"
          style={{ transform: `translateX(${activeTab === 'sedes' ? '0%' : '100%'})` }}
        />
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sedes'}
          className={`tt-sd-tab ${activeTab === 'sedes' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('sedes');
          }}
        >
          <span>Sedes ({normalizedClubs.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'coaches'}
          className={`tt-sd-tab ${activeTab === 'coaches' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('coaches');
          }}
        >
          <span>Coaches ({normalizedCoaches.length})</span>
        </button>
      </div>

      {/* ====================================================================
          2. PESTAÑA SEDES (FOTO PROTAGONISTA · CLIMA DISCRETO · VIP DESPLEGABLE)
          ==================================================================== */}
      {activeTab === 'sedes' && (
        <div key="tab-sedes" className="tt-sd-stack tt-sd-enter">
          <div className="tt-clubs-grid">
            {normalizedClubs.map((club, idx) => {
              const weather = getClubWeather(club);
              const isVipOpen = Boolean(openVipClubIds[club.id]);

              return (
                <article
                  key={club.id}
                  className="tt-club-card"
                  style={{ '--sd-delay': `${idx * 65}ms` }}
                >
                  {/* Portada limpia con escudo real + clima discreto (cero naranja chillón) */}
                  <div className="tt-club-hero" onClick={() => openClubSheet(club)}>
                    <SmartImage
                      src={club.cover}
                      fallbackSrc={ASSETS.torneoApertura}
                      alt={club.name}
                      className="tt-club-hero-img"
                    />
                    <div className="tt-club-hero-scrim" />

                    <div className="tt-club-top-row">
                      <span className="tt-club-chip-glass">
                        <span className="tt-emerald-dot" />
                        Arcilla · {club.courtsCount} canchas
                      </span>

                      {/* Clima como dato discreto en esquina */}
                      <span className="tt-club-weather-pill">
                        <SmartImage
                          src={weather.icon}
                          alt={weather.shortLabel}
                          style={{ width: 17, height: 17, objectFit: 'contain' }}
                        />
                        <span>
                          {weather.shortLabel} · {liveTempC}°C
                        </span>
                      </span>
                    </div>

                    <div className="tt-club-bottom-row">
                      <div className="tt-club-crest-wrap">
                        <SmartImage
                          src={club.logo}
                          alt={club.shortName}
                          initials={club.shortName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 className="tt-club-name">{club.name}</h2>
                        <span className="tt-club-meta">
                          {club.district} · {club.hours}
                        </span>
                      </div>
                      {club.gallery.length > 1 && (
                        <span className="tt-club-photos-count">
                          {club.gallery.length} fotos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo ultra limpio */}
                  <div className="tt-club-body">
                    {/* Tarifa resumida en 1 línea clara */}
                    <div className="tt-club-rate-strip">
                      <span>
                        Día <strong>S/ {club.rates.diaReg}</strong>
                      </span>
                      <i />
                      <span>
                        Noche LED <strong>S/ {club.rates.nocheReg}</strong>
                      </span>
                      <i />
                      <span className="is-vip-rate">
                        VIP desde <strong>S/ {club.rates.diaVip}</strong>
                      </span>
                    </div>

                    {/* Botón dorado sobrio desplegable: "Beneficios VIP en este club" */}
                    <div className={`tt-vip-acc ${isVipOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="tt-vip-acc-btn"
                        aria-expanded={isVipOpen}
                        onClick={() => toggleClubVipBenefits(club.id)}
                      >
                        <TTIcon name="crown" size={15} />
                        <span>Beneficios VIP en este club</span>
                        <em className={`tt-vip-acc-arrow ${isVipOpen ? 'is-up' : ''}`}>▾</em>
                      </button>

                      {isVipOpen && (
                        <div className="tt-vip-acc-panel">
                          <ul>
                            {club.vipBenefits.map((line, i) => (
                              <li key={i}>
                                <TTIcon name="check" size={13} style={{ color: '#00DC7D', flexShrink: 0 }} />
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                          {onOpenVipCard && (
                            <button
                              type="button"
                              className="tt-vip-acc-card-link"
                              onClick={() => {
                                triggerHaptic('light');
                                onOpenVipCard();
                              }}
                            >
                              Ver mi Carnet VIP 3D →
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones: Ver fotos/info · Google Maps · Reservar WhatsApp +51 */}
                    <div className="tt-club-actions-row">
                      <button
                        type="button"
                        className="tt-btn tt-btn-ghost tt-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => openClubSheet(club)}
                      >
                        Ver Sede y Fotos
                      </button>

                      <a
                        href={club.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tt-btn tt-btn-ghost tt-btn-sm"
                        onClick={() => triggerHaptic('light')}
                      >
                        <TTIcon name="mapPin" size={15} style={{ color: '#00DC7D' }} />
                        Maps
                      </a>

                      <a
                        href={buildWhatsappLink(
                          club.whatsapp || APP_CONFIG.supportWhatsApp,
                          `Hola ${club.name}, te escribo desde TOTAL TENIS para reservar una cancha.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tt-btn tt-btn-primary tt-btn-sm"
                        onClick={() => triggerHaptic('medium')}
                      >
                        <TTIcon name="whatsapp" size={16} />
                        Reservar
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Acceso compacto para administradores de sede o entrenadores */}
          {onOpenPartnerPortal && (
            <button
              type="button"
              className="tt-partner-strip-btn"
              onClick={() => {
                triggerHaptic('light');
                onOpenPartnerPortal();
              }}
            >
              <div>
                <strong>¿Administras una sede o enseñas tenis?</strong>
                <span>Abre el Portal Aliados para gestionar fotos, horarios y promociones</span>
              </div>
              <TTIcon name="chevronRight" size={18} />
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          3. PESTAÑA COACHES (DISEÑO COMERCIAL ALTO CONTRASTE · CERO MUROS TEXTO)
          ==================================================================== */}
      {activeTab === 'coaches' && (
        <div key="tab-coaches" className="tt-sd-stack tt-sd-enter">
          {normalizedCoaches.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Entrenadores próximamente"
              description="Muy pronto verás aquí a los entrenadores oficiales y sus turnos libres."
            />
          ) : (
            <div className="tt-coaches-grid">
              {normalizedCoaches.map((coach, idx) => {
                const palette = COACH_THEMES[coach.accentTheme] || COACH_THEMES.emerald;
                const activeAccent = isLight ? palette.accentLight : palette.accent;

                return (
                  <article
                    key={coach.id}
                    className={`tt-coach-pro-card ${coach.featured ? 'is-featured' : ''}`}
                    style={{
                      '--coach-accent': activeAccent,
                      '--coach-soft': palette.soft,
                      '--coach-border': palette.border,
                      '--sd-delay': `${idx * 70}ms`,
                    }}
                    onClick={() => openCoachSheet(coach)}
                  >
                    {/* Cabecera visual foto-protagonista */}
                    <div className="tt-cp-media">
                      <SmartImage
                        src={coach.photo}
                        fallbackSrc={ASSETS.torneoAltura}
                        alt={coach.name}
                        className="tt-cp-img"
                      />
                      <div className="tt-cp-scrim" />

                      <div className="tt-cp-top-pills">
                        {coach.freeSlotToday ? (
                          <span className="tt-cp-free-pill">
                            <span className="tt-emerald-dot" />
                            Libre: {coach.freeSlotToday}
                          </span>
                        ) : (
                          <span className="tt-cp-free-pill">Coach Oficial</span>
                        )}

                        {coach.videos.length > 0 && (
                          <span className="tt-cp-vid-pill">
                            ▶ {coach.videos.length} {coach.videos.length === 1 ? 'video' : 'videos'}
                          </span>
                        )}
                      </div>

                      <div className="tt-cp-identity">
                        <h3>{coach.name}</h3>
                        <span>
                          {coach.title} · {coach.clubName}
                        </span>
                      </div>
                    </div>

                    {/* Cuerpo comercial directo y escaneable */}
                    <div className="tt-cp-body">
                      <div className="tt-cp-tags">
                        {coach.specialties.map((sp) => (
                          <span key={sp} className="tt-cp-tag">
                            {sp}
                          </span>
                        ))}
                      </div>

                      <div className="tt-cp-rates-bar">
                        <div className="tt-cp-rate-box">
                          <span>Clase desde</span>
                          <strong>S/ {coach.baseRate}</strong>
                        </div>
                        <div className="tt-cp-rate-box is-vip">
                          <span>Tarifa Socio VIP</span>
                          <strong>S/ {coach.vipRate}</strong>
                        </div>
                        <div className="tt-cp-rate-box">
                          <span>Programas</span>
                          <strong>{coach.packages.length}</strong>
                        </div>
                      </div>

                      <div className="tt-cp-actions">
                        <button
                          type="button"
                          className="tt-btn tt-btn-ghost tt-btn-sm"
                          style={{ flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openCoachSheet(coach);
                          }}
                        >
                          Horarios y Videos
                        </button>

                        <button
                          type="button"
                          className="tt-btn tt-btn-primary tt-btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCoachWhatsappClick(coach);
                          }}
                        >
                          <TTIcon name="whatsapp" size={16} />
                          Reservar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {onOpenPartnerPortal && (
            <button
              type="button"
              className="tt-partner-strip-btn"
              onClick={() => {
                triggerHaptic('light');
                onOpenPartnerPortal();
              }}
            >
              <div>
                <strong>¿Eres entrenador? Personaliza tu Estudio</strong>
                <span>Edita tus horarios libres de hoy, paquetes, videos y ve tus clics</span>
              </div>
              <TTIcon name="chevronRight" size={18} />
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL 1: FICHA DE SEDE (CARRUSEL FOTOS + CLIMA ANTI-FARMEO +3 GEMAS)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(selectedClub)}
        onClose={() => setSelectedClubId(null)}
        title={selectedClub?.name || 'Sede Oficial'}
        subtitle={
          selectedClub
            ? `${selectedClub.district} · Arcilla · ${selectedClub.hours}`
            : ''
        }
        icon={<IconBadge name="mapPin" variant="emerald" size={38} />}
        isWide
      >
        {selectedClub && (
          <div className="tt-club-modal-stack">
            {/* Carrusel Interactivo de Fotos de la Sede */}
            <div className="tt-club-carousel">
              <div className="tt-cc-stage">
                <SmartImage
                  key={selectedClub.gallery[carouselIdx % selectedClub.gallery.length]?.image}
                  src={selectedClub.gallery[carouselIdx % selectedClub.gallery.length]?.image}
                  fallbackSrc={ASSETS.torneoApertura}
                  alt={selectedClub.name}
                  className="tt-cc-img"
                />
                <div className="tt-cc-scrim" />
                <span className="tt-cc-caption">
                  {selectedClub.gallery[carouselIdx % selectedClub.gallery.length]?.title}
                </span>

                {selectedClub.gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="tt-cc-arrow is-prev"
                      aria-label="Foto anterior"
                      onClick={() => {
                        triggerHaptic('light');
                        setCarouselIdx(
                          (prev) =>
                            (prev - 1 + selectedClub.gallery.length) % selectedClub.gallery.length
                        );
                      }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="tt-cc-arrow is-next"
                      aria-label="Foto siguiente"
                      onClick={() => {
                        triggerHaptic('light');
                        setCarouselIdx((prev) => (prev + 1) % selectedClub.gallery.length);
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {selectedClub.gallery.length > 1 && (
                <div className="tt-cc-dots">
                  {selectedClub.gallery.map((g, i) => (
                    <button
                      key={g.id || i}
                      type="button"
                      aria-label={`Ver foto ${i + 1}`}
                      className={`tt-cc-dot ${
                        i === carouselIdx % selectedClub.gallery.length ? 'is-active' : ''
                      }`}
                      onClick={() => {
                        triggerHaptic('light');
                        setCarouselIdx(i);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tarifas claras */}
            <div className="tt-cm-rates-card">
              <span className="tt-cm-kicker">TARIFAS POR HORA</span>
              <div className="tt-cm-rates-grid">
                <div>
                  <span>Día Regular</span>
                  <strong>S/ {selectedClub.rates.diaReg}</strong>
                </div>
                <div>
                  <span>Noche LED</span>
                  <strong>S/ {selectedClub.rates.nocheReg}</strong>
                </div>
                <div className="is-vip">
                  <span>Socio VIP</span>
                  <strong>
                    S/ {selectedClub.rates.diaVip} – {selectedClub.rates.nocheVip}
                  </strong>
                </div>
              </div>
              {selectedClub.address && (
                <small className="tt-cm-hours-note">{selectedClub.address}</small>
              )}
            </div>

            {/* Instalaciones */}
            <div>
              <span className="tt-cm-kicker">INSTALACIONES</span>
              <div className="tt-cm-services-grid">
                {selectedClub.services.map((srv, idx) => (
                  <div key={idx} className="tt-cm-service-tile">
                    <TTIcon name="check" size={14} style={{ color: '#00DC7D', flexShrink: 0 }} />
                    <span>{srv}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Beneficios VIP propios de este club */}
            <div className="tt-cm-vip-card">
              <div style={{ flex: 1 }}>
                <span className="tt-cm-vip-kicker">BENEFICIOS VIP EN ESTA SEDE</span>
                <ul>
                  {selectedClub.vipBenefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              {onOpenVipCard && (
                <button
                  type="button"
                  className="tt-btn tt-btn-ghost tt-btn-sm"
                  onClick={() => {
                    setSelectedClubId(null);
                    onOpenVipCard();
                  }}
                >
                  Mi Carnet
                </button>
              )}
            </div>

            {/* Reporte Climático SOLO dentro del club (+3 Gemas · Anti-Farmeo 24h/3h) */}
            <div className="tt-cm-weather-box">
              <div className="tt-cm-weather-head">
                <div>
                  <span className="tt-cm-kicker" style={{ marginBottom: 2 }}>
                    ESTADO DE CANCHA EN VIVO · +3 💎
                  </span>
                  <small className="tt-muted" style={{ fontSize: '0.72rem' }}>
                    {(() => {
                      const w = getClubWeather(selectedClub);
                      return w.reportedBy
                        ? `Último reporte: ${w.label} por ${w.reportedBy} ${w.updatedLabel}`
                        : `Actual: ${w.label} (${liveTempC}°C) · 1 premio cada 24 h`;
                    })()}
                  </small>
                </div>
              </div>

              <div className="tt-cm-weather-grid">
                {WEATHER_STATES.map((st) => {
                  const isCurrent = getClubWeather(selectedClub).key === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      disabled={isReportingWeather}
                      className={`tt-cm-weather-btn ${isCurrent ? 'is-current' : ''}`}
                      onClick={() => handleReportWeatherInsideClub(selectedClub, st.key)}
                    >
                      <SmartImage
                        src={st.icon}
                        alt={st.label}
                        style={{ width: 26, height: 26, objectFit: 'contain' }}
                      />
                      <span>{st.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botones finales: Google Maps + WhatsApp */}
            <div style={{ display: 'flex', gap: 9 }}>
              <a
                href={selectedClub.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tt-btn tt-btn-ghost"
                style={{ flex: 1 }}
              >
                <TTIcon name="mapPin" size={16} style={{ color: '#00DC7D' }} />
                Google Maps
              </a>
              <a
                href={buildWhatsappLink(
                  selectedClub.whatsapp || APP_CONFIG.supportWhatsApp,
                  `Hola ${selectedClub.name}, quiero reservar una cancha desde TOTAL TENIS.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="tt-btn tt-btn-primary"
                style={{ flex: 1 }}
              >
                <TTIcon name="whatsapp" size={17} />
                Reservar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 2: FICHA COMERCIAL DEL COACH (PAQUETES, TURNOS Y VIDEOS)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(selectedCoach)}
        onClose={() => setSelectedCoachId(null)}
        title={selectedCoach?.name || 'Entrenador Oficial'}
        subtitle={selectedCoach ? `${selectedCoach.title} · ${selectedCoach.clubName}` : ''}
        icon={<IconBadge name="users" variant="emerald" size={38} />}
        isWide
      >
        {selectedCoach && (
          <div className="tt-coach-modal-stack">
            {/* Hero Visual Limpio */}
            <div className="tt-coach-sheet-hero">
              <SmartImage
                src={selectedCoach.photo}
                fallbackSrc={ASSETS.torneoAltura}
                alt={selectedCoach.name}
                className="tt-csh-img"
              />
              <div className="tt-csh-scrim" />
              <div className="tt-csh-caption">
                {selectedCoach.freeSlotToday && (
                  <span className="tt-cp-free-pill">
                    <span className="tt-emerald-dot" />
                    Disponible: {selectedCoach.freeSlotToday}
                  </span>
                )}
                <h3>{selectedCoach.name}</h3>
                <div className="tt-cp-tags" style={{ marginTop: 4 }}>
                  {selectedCoach.specialties.map((sp) => (
                    <span key={sp} className="tt-csh-tag">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Videos en Cancha */}
            {selectedCoach.videos.length > 0 && (
              <div>
                <span className="tt-cm-kicker">VIDEOS EN CANCHA</span>
                <div className="tt-coach-videos-grid">
                  {selectedCoach.videos.map((vid) => {
                    const unlocked =
                      !vid.isExclusive ||
                      unlockedVideoIds.includes(vid.id) ||
                      (currentUser?.unlockedVideos || []).includes(vid.id);
                    return (
                      <button
                        key={vid.id}
                        type="button"
                        className="tt-coach-vid-card"
                        onClick={() => handleOpenCoachVideo(vid)}
                      >
                        <SmartImage
                          src={vid.poster}
                          fallbackSrc={ASSETS.torneoApertura}
                          alt={vid.title}
                          className="tt-coach-vid-poster"
                        />
                        <div className="tt-coach-vid-overlay">
                          <span className={`tt-vid-pill ${unlocked ? 'is-free' : 'is-lock'}`}>
                            {unlocked
                              ? `▶ Ver · ${vid.duration || 'HD'}`
                              : `🔒 ${vid.gemsCost} 💎`}
                          </span>
                          <strong>{vid.title}</strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clases y Paquetes (Tarifa Regular vs. Socio VIP — CERO equivalencia Gemas/Soles) */}
            <div>
              <span className="tt-cm-kicker">CLASES Y PAQUETES</span>
              <div className="tt-programs-stack">
                {selectedCoach.packages.map((pkg) => {
                  const active = activePackage?.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      className={`tt-program-tile ${active ? 'is-active' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedPackageId(pkg.id);
                      }}
                    >
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className="tt-prog-type">{pkg.type}</span>
                          {pkg.badge && <span className="tt-prog-badge">{pkg.badge}</span>}
                        </div>
                        <strong className="tt-prog-name">{pkg.name}</strong>
                      </div>
                      <div className="tt-prog-prices">
                        <strong>S/ {pkg.price}</strong>
                        <small>VIP S/ {pkg.vipPrice}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Turnos disponibles */}
            {selectedCoach.slots.length > 0 && (
              <div>
                <span className="tt-cm-kicker">HORARIOS DISPONIBLES</span>
                <div className="tt-slots-grid">
                  {selectedCoach.slots.map((sl) => {
                    const active = activeSlot?.id === sl.id;
                    return (
                      <button
                        key={sl.id}
                        type="button"
                        className={`tt-slot-tile ${active ? 'is-active' : ''}`}
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedSlotId(sl.id);
                        }}
                      >
                        <strong>
                          {sl.day} {sl.time ? `· ${sl.time}` : ''}
                        </strong>
                        <span>{sl.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Barra final de reserva directa */}
            <div className="tt-coach-book-bar">
              <div>
                <span>{currentUser?.isVip ? 'Tarifa Socio VIP' : 'Tarifa Regular'}</span>
                <strong>
                  S/{' '}
                  {activePackage
                    ? currentUser?.isVip
                      ? activePackage.vipPrice
                      : activePackage.price
                    : currentUser?.isVip
                    ? selectedCoach.vipRate
                    : selectedCoach.baseRate}
                </strong>
              </div>
              <button
                type="button"
                className="tt-btn tt-btn-primary"
                onClick={() => handleCoachWhatsappClick(selectedCoach, activePackage, activeSlot)}
              >
                <TTIcon name="whatsapp" size={17} />
                Reservar por WhatsApp
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 3: REPRODUCTOR DE VIDEO EN CANCHA
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(activeVideoModal)}
        onClose={() => setActiveVideoModal(null)}
        title={activeVideoModal?.title || 'Video en Cancha'}
        subtitle={`Duración: ${activeVideoModal?.duration || 'HD'}`}
        icon={<IconBadge name="vision" variant="emerald" size={38} />}
        isTopLayer
        isWide
      >
        {activeVideoModal && (
          <video
            src={activeVideoModal.src}
            poster={activeVideoModal.poster}
            controls
            autoPlay
            playsInline
            style={{ width: '100%', borderRadius: 16, backgroundColor: '#000' }}
          />
        )}
      </ModalPortal>

      {/* ====================================================================
          ESTILOS LIMPIOS DE ALTO CONTRASTE (BLANCO + PÚRPURA + ESMERALDA)
          ==================================================================== */}
      <style>{`
        .tt-sedes-view {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* 1. CONMUTADOR DE 2 PESTAÑAS CON SLIDER ELÁSTICO */
        .tt-sd-tabs {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 4px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular);
        }
        .tt-sd-tab-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc((100% - 8px) / 2);
          border-radius: 13px;
          background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%);
          box-shadow: 0 6px 16px rgba(0, 220, 125, 0.3);
          transition: transform 320ms cubic-bezier(0.22, 1.24, 0.36, 1);
          pointer-events: none;
          z-index: 0;
        }
        .tt-sedes-view.is-light .tt-sd-tab-slider {
          background: #1E0734;
          box-shadow: 0 6px 16px rgba(30, 7, 52, 0.2);
        }
        .tt-sd-tab {
          position: relative;
          z-index: 1;
          min-height: 41px;
          border-radius: 13px;
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          transition: color 200ms ease;
        }
        .tt-sd-tab.is-active {
          color: #10021E;
          font-weight: 900;
        }
        .tt-sedes-view.is-light .tt-sd-tab.is-active {
          color: #00DC7D;
        }

        .tt-sd-stack { display: flex; flex-direction: column; gap: 14px; }
        .tt-sd-enter { animation: ttSdReveal 340ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes ttSdReveal {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* 2. TARJETAS DE SEDE (FOTO PROTAGONISTA · CERO SATURACIÓN NARANJA) */
        .tt-clubs-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 760px) {
          .tt-clubs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .tt-club-card {
          border-radius: 24px;
          overflow: hidden;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          animation: ttSdReveal 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--sd-delay, 0ms);
        }
        .tt-club-hero {
          position: relative;
          min-height: 186px;
          padding: 13px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          background: #160428;
          overflow: hidden;
        }
        .tt-club-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tt-club-card:hover .tt-club-hero-img { transform: scale(1.03); }
        .tt-club-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(14, 3, 26, 0.44) 0%,
            rgba(14, 3, 26, 0.16) 44%,
            rgba(14, 3, 26, 0.94) 100%
          );
        }
        .tt-club-top-row {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-club-chip-glass,
        .tt-club-weather-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(16, 4, 30, 0.76);
          border: 1px solid rgba(250, 249, 245, 0.2);
          backdrop-filter: blur(8px);
          color: #FAF9F5;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-emerald-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00DC7D;
          box-shadow: 0 0 8px rgba(0, 220, 125, 0.85);
          flex-shrink: 0;
        }
        .tt-club-bottom-row {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-club-crest-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #FFFFFF;
          border: 2px solid #FAF9F5;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.36);
        }
        .tt-club-name {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.24rem;
          font-weight: 900;
          line-height: 1.04;
          color: #FAF9F5;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }
        .tt-club-meta {
          display: block;
          margin-top: 2px;
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(250, 249, 245, 0.84);
        }
        .tt-club-photos-count {
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.16);
          color: #FAF9F5;
          font-size: 0.64rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .tt-club-body { padding: 13px; display: flex; flex-direction: column; gap: 10px; }
        .tt-club-rate-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 9px 11px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          font-size: 0.72rem;
          color: var(--tt-text-muted);
          flex-wrap: wrap;
        }
        .tt-club-rate-strip strong { color: var(--tt-text); font-weight: 900; }
        .tt-club-rate-strip i { width: 1px; height: 14px; background: var(--tt-border-medium); }
        .tt-club-rate-strip .is-vip-rate strong { color: #E5C16C; }
        .tt-sedes-view.is-light .tt-club-rate-strip .is-vip-rate strong { color: #9A6B16; }

        /* Acordeón Dorado Champán Sobrio (Beneficios VIP en este club) */
        .tt-vip-acc {
          border-radius: 14px;
          border: 1px solid rgba(229, 193, 108, 0.36);
          background: rgba(229, 193, 108, 0.08);
          overflow: hidden;
          transition: border-color 220ms ease;
        }
        .tt-sedes-view.is-light .tt-vip-acc {
          background: #FBF7EC;
          border-color: rgba(180, 132, 34, 0.34);
        }
        .tt-vip-acc-btn {
          width: 100%;
          min-height: 40px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #F3DC9B;
          font-size: 0.76rem;
          font-weight: 800;
          text-align: left;
        }
        .tt-sedes-view.is-light .tt-vip-acc-btn { color: #7C550E; }
        .tt-vip-acc-btn span { flex: 1; }
        .tt-vip-acc-arrow {
          font-style: normal;
          transition: transform 240ms cubic-bezier(0.22, 1.3, 0.36, 1);
        }
        .tt-vip-acc-arrow.is-up { transform: rotate(180deg); }
        .tt-vip-acc-panel {
          padding: 0 12px 11px;
          border-top: 1px solid rgba(229, 193, 108, 0.2);
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: ttSdReveal 220ms ease both;
        }
        .tt-vip-acc-panel ul {
          margin: 9px 0 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-vip-acc-panel li {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 0.74rem;
          color: var(--tt-text-secondary);
        }
        .tt-vip-acc-card-link {
          align-self: flex-start;
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--tt-emerald-text);
        }

        .tt-club-actions-row { display: flex; align-items: center; gap: 7px; }

        /* 3. TARJETAS DE COACHES (ALTO CONTRASTE COMERCIAL) */
        .tt-coaches-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 740px) {
          .tt-coaches-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .tt-coach-pro-card {
          border-radius: 24px;
          overflow: hidden;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          animation: ttSdReveal 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--sd-delay, 0ms);
        }
        .tt-coach-pro-card.is-featured {
          border-color: var(--coach-border);
        }
        .tt-cp-media {
          position: relative;
          min-height: 188px;
          padding: 13px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #160428;
          overflow: hidden;
        }
        .tt-cp-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .tt-cp-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(14, 3, 26, 0.38) 0%,
            rgba(14, 3, 26, 0.14) 40%,
            rgba(14, 3, 26, 0.95) 100%
          );
        }
        .tt-cp-top-pills {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-cp-free-pill,
        .tt-cp-vid-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(16, 4, 30, 0.8);
          border: 1px solid rgba(250, 249, 245, 0.22);
          backdrop-filter: blur(8px);
          color: #FAF9F5;
          font-size: 0.67rem;
          font-weight: 800;
        }
        .tt-cp-identity { position: relative; z-index: 2; color: #FAF9F5; }
        .tt-cp-identity h3 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.48rem;
          line-height: 1;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }
        .tt-cp-identity span {
          display: block;
          margin-top: 3px;
          font-size: 0.73rem;
          font-weight: 600;
          color: rgba(250, 249, 245, 0.86);
        }

        .tt-cp-body { padding: 13px; display: flex; flex-direction: column; gap: 11px; }
        .tt-cp-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tt-cp-tag {
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--tt-text-secondary);
        }
        .tt-cp-rates-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
        }
        .tt-cp-rate-box {
          padding: 8px 6px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          text-align: center;
        }
        .tt-cp-rate-box span { display: block; font-size: 0.62rem; color: var(--tt-text-muted); }
        .tt-cp-rate-box strong { font-family: var(--tt-font-display); font-size: 1.12rem; color: var(--tt-text); }
        .tt-cp-rate-box.is-vip strong { color: var(--coach-accent); }
        .tt-cp-actions { display: flex; align-items: center; gap: 8px; }

        /* Acceso discreto al Portal Aliados */
        .tt-partner-strip-btn {
          width: 100%;
          padding: 13px 15px;
          border-radius: 18px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          text-align: left;
        }
        .tt-partner-strip-btn strong { display: block; font-size: 0.82rem; }
        .tt-partner-strip-btn span { display: block; font-size: 0.71rem; color: var(--tt-text-muted); margin-top: 2px; }

        /* 4. MODAL SEDE (CARRUSEL DE FOTOS + CLIMA INTERNO +3 GEMAS) */
        .tt-club-modal-stack,
        .tt-coach-modal-stack { display: flex; flex-direction: column; gap: 14px; }
        .tt-club-carousel { display: flex; flex-direction: column; gap: 8px; }
        .tt-cc-stage {
          position: relative;
          height: 205px;
          border-radius: 18px;
          overflow: hidden;
          background: #140324;
        }
        .tt-cc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: ttSdReveal 280ms ease both;
        }
        .tt-cc-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 50%, rgba(14, 3, 26, 0.85) 100%);
        }
        .tt-cc-caption {
          position: absolute;
          left: 12px;
          bottom: 10px;
          z-index: 2;
          color: #FAF9F5;
          font-size: 0.76rem;
          font-weight: 800;
        }
        .tt-cc-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(14, 3, 26, 0.72);
          border: 1px solid rgba(250, 249, 245, 0.28);
          color: #FAF9F5;
          font-size: 1.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-cc-arrow.is-prev { left: 10px; }
        .tt-cc-arrow.is-next { right: 10px; }
        .tt-cc-dots { display: flex; justify-content: center; gap: 6px; }
        .tt-cc-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--tt-border-medium);
          transition: width 220ms ease, background-color 220ms ease;
        }
        .tt-cc-dot.is-active { width: 22px; background: #00DC7D; }

        .tt-cm-kicker {
          display: block;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: var(--tt-emerald-text);
          margin-bottom: 7px;
        }
        .tt-cm-rates-card {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-cm-rates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; }
        .tt-cm-rates-grid > div { padding: 9px 6px; border-radius: 12px; background: var(--tt-surface); }
        .tt-cm-rates-grid span { display: block; font-size: 0.64rem; color: var(--tt-text-muted); }
        .tt-cm-rates-grid strong { font-size: 0.88rem; font-weight: 900; }
        .tt-cm-rates-grid .is-vip strong { color: #E5C16C; }
        .tt-sedes-view.is-light .tt-cm-rates-grid .is-vip strong { color: #9A6B16; }
        .tt-cm-hours-note { display: block; margin-top: 8px; font-size: 0.72rem; color: var(--tt-text-muted); }

        .tt-cm-services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .tt-cm-service-tile {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 10px;
          border-radius: 12px;
          background: var(--tt-surface-2);
          font-size: 0.74rem;
          font-weight: 700;
        }
        .tt-cm-vip-card {
          padding: 13px;
          border-radius: 16px;
          background: rgba(229, 193, 108, 0.1);
          border: 1px solid rgba(229, 193, 108, 0.36);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-cm-vip-kicker { display: block; font-size: 0.62rem; font-weight: 900; letter-spacing: 0.08em; color: #E5C16C; margin-bottom: 5px; }
        .tt-sedes-view.is-light .tt-cm-vip-kicker { color: #8A5D10; }
        .tt-cm-vip-card ul { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: var(--tt-text-secondary); }

        .tt-cm-weather-box {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-cm-weather-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
        .tt-cm-weather-btn {
          padding: 9px 4px;
          border-radius: 13px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 800;
          transition: transform 150ms ease, border-color 180ms ease;
        }
        .tt-cm-weather-btn:active { transform: scale(0.94); }
        .tt-cm-weather-btn.is-current { border-color: #00DC7D; background: rgba(0, 220, 125, 0.12); }

        /* 5. MODAL COACH */
        .tt-coach-sheet-hero {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          height: 210px;
          background: #160428;
        }
        .tt-csh-img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
        .tt-csh-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16, 4, 30, 0.14) 24%, rgba(16, 4, 30, 0.94) 100%); }
        .tt-csh-caption { position: absolute; left: 14px; right: 14px; bottom: 13px; color: #FAF9F5; }
        .tt-csh-caption h3 { margin: 6px 0 0; font-family: var(--tt-font-display); font-size: 1.55rem; line-height: 1; }
        .tt-csh-tag { padding: 3px 9px; border-radius: 999px; background: rgba(250, 249, 245, 0.16); color: #FAF9F5; font-size: 0.66rem; font-weight: 700; }

        .tt-coach-videos-grid { display: grid; grid-template-columns: 1fr; gap: 9px; }
        @media (min-width: 560px) {
          .tt-coach-videos-grid { grid-template-columns: 1fr 1fr; }
        }
        .tt-coach-vid-card { position: relative; border-radius: 15px; overflow: hidden; min-height: 114px; background: #140324; text-align: left; padding: 0; border: 1px solid var(--tt-border); }
        .tt-coach-vid-poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.66; }
        .tt-coach-vid-overlay { position: relative; z-index: 2; height: 100%; padding: 10px; background: linear-gradient(180deg, rgba(16, 3, 29, 0.2) 0%, rgba(16, 3, 29, 0.92) 100%); color: #FAF9F5; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; }
        .tt-vid-pill { align-self: flex-start; padding: 3px 9px; border-radius: 999px; font-size: 0.64rem; font-weight: 900; }
        .tt-vid-pill.is-free { background: #00DC7D; color: #120321; }
        .tt-vid-pill.is-lock { background: rgba(18, 3, 33, 0.84); border: 1px solid #00DC7D; color: #7CF5C0; }
        .tt-coach-vid-overlay strong { font-size: 0.8rem; line-height: 1.24; }

        .tt-programs-stack { display: flex; flex-direction: column; gap: 8px; }
        .tt-program-tile {
          width: 100%;
          padding: 11px 12px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-program-tile.is-active { border-color: #00DC7D; background: rgba(0, 220, 125, 0.1); }
        .tt-prog-type { font-size: 0.64rem; font-weight: 900; text-transform: uppercase; color: var(--tt-text-muted); }
        .tt-prog-badge { padding: 2px 7px; border-radius: 999px; background: rgba(0, 220, 125, 0.14); color: var(--tt-emerald-text); font-size: 0.6rem; font-weight: 900; }
        .tt-prog-name { display: block; margin-top: 3px; font-size: 0.84rem; }
        .tt-prog-prices { text-align: right; flex-shrink: 0; }
        .tt-prog-prices strong { display: block; font-family: var(--tt-font-display); font-size: 1.22rem; line-height: 1; color: var(--tt-text); }
        .tt-prog-prices small { font-size: 0.68rem; font-weight: 800; color: #E5C16C; }
        .tt-sedes-view.is-light .tt-prog-prices small { color: #9A6B16; }

        .tt-slots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .tt-slot-tile {
          padding: 9px 10px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text);
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-slot-tile.is-active { border-color: #00DC7D; background: rgba(0, 220, 125, 0.12); }
        .tt-slot-tile strong { font-size: 0.8rem; }
        .tt-slot-tile span { font-size: 0.68rem; color: var(--tt-text-muted); }

        .tt-coach-book-bar {
          padding: 13px 14px;
          border-radius: 17px;
          background: linear-gradient(135deg, #21083A 0%, #140324 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.34);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-coach-book-bar span { display: block; font-size: 0.66rem; opacity: 0.78; }
        .tt-coach-book-bar strong { font-family: var(--tt-font-display); font-size: 1.55rem; line-height: 1; color: #00DC7D; }

        html[data-tier='lite'] .tt-club-card,
        html[data-tier='lite'] .tt-coach-pro-card { animation: none !important; }
      `}</style>
    </section>
  );
}
