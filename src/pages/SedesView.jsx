import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSETS,
  EmptyStateCard,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
  useScrollReveal,
} from '../components/AppIcons';
import {
  APP_CONFIG,
  INITIAL_CLUBS,
} from '../data/playersAndClubsData';
import {
  buildWhatsAppLink,
  fetchLiveClubWeather,
} from '../utils/tenisEngine';

/* ==========================================================================
   MATRIZ CLIMÁTICA INTERACTIVA DE 4 ESTADOS (CON TUS ICONOS 3D EN ASSETS)
   ========================================================================== */
const WEATHER_STATES = [
  {
    key: 'seco',
    label: 'Cancha Seca',
    badge: 'Óptima',
    color: '#00DC7D',
    bg: 'rgba(0, 220, 125, 0.16)',
    icon: ASSETS.climaSeco || '/assets/canva-clima-seco.png',
    sportNote: 'Pique rápido y tracción limpia. Ideal para partidos oficiales.',
  },
  {
    key: 'humedad',
    label: 'Humedad Leve',
    badge: 'Jugable',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.16)',
    icon: ASSETS.climaHumedad || '/assets/canva-clima-humedad.png',
    sportNote: 'Arcilla blanda con bote pesado. Perfecta para topspin profundo.',
  },
  {
    key: 'llovizna',
    label: 'Llovizna',
    badge: 'Precaución',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.16)',
    icon: ASSETS.climaLlovizna || '/assets/canva-clima-llovizna.png',
    sportNote: 'Líneas resbalosas. Juega solo con suela espiga para arcilla.',
  },
  {
    key: 'lluvia',
    label: 'Lluvia Fuerte',
    badge: 'Injugable',
    color: '#F87171',
    bg: 'rgba(248, 113, 113, 0.16)',
    icon: ASSETS.climaLluvia || '/assets/canva-clima-lluvia.png',
    sportNote: 'Arcilla encharcada. Partidos suspendidos hasta secado y mantenimiento.',
  },
];

/* ==========================================================================
   COACHES OFICIALES DE RESPALDO (100% SIN RESEÑAS FALSAS · VIDEOS EN CANCHA)
   ========================================================================== */
const DEFAULT_COACHES = [
  {
    id: 'coach-romina',
    name: 'Romina Cutipa',
    title: 'Directora Técnica · Alta Competencia',
    certification: 'Entrenadora Certificada · Ex Top Nacional',
    clubId: 'club-cutipa',
    clubName: 'Academia Romina Cutipa',
    featured: true,
    photo: '/assets/sede-romina-cutipa.jpg',
    fullBodyPhoto: '/assets/sede-romina-cutipa.jpg',
    studentsPromoted: 14,
    specialties: ['Biomecánica de Saque', 'Táctica en Arcilla', 'Competencia Damas y Adultos'],
    bio: 'Especialista en transición de 5ª A hacia 4ª y 3ª categoría mediante análisis de video en cancha, patrones tácticos y consistencia bajo presión.',
    baseRate: 65,
    vipRate: 52, // Descuento VIP real (-20%)
    maxGemCopaySoles: 15, // Hasta S/ 15 de copago = 300 Gemas
    whatsapp: '964812340',
    videos: [
      {
        id: 'vid-romina-1',
        title: 'Corrección de 2º saque con efecto en altura',
        duration: '02:18',
        src: '/assets/video-coach-romina.mp4',
        poster: '/assets/portada-tips-semana.jpg',
        isExclusive: false,
        gemsCost: 0,
      },
      {
        id: 'vid-romina-2',
        title: 'Masterclass: Cómo abrir ángulos en arcilla',
        duration: '06:45',
        src: '/assets/video-coach-demo-3.mp4',
        poster: '/assets/portada-academia-tv.jpg',
        isExclusive: true,
        gemsCost: 40,
      },
    ],
    programs: [
      {
        id: 'prog-r1',
        type: 'Privada 1 a 1',
        name: 'Sesión Técnica Personalizada (60 min)',
        price: 65,
        vipPrice: 52,
        spotsUsed: 0,
        spotsTotal: 1,
        badge: 'INCLUYE VIDEO ANÁLISIS',
      },
      {
        id: 'prog-r2',
        type: 'Pack 4 Clases',
        name: 'Plan Ascenso de Categoría (4 sesiones)',
        price: 230,
        vipPrice: 195,
        spotsUsed: 0,
        spotsTotal: 1,
        badge: 'AHORRAS S/ 30 · DIAGNÓSTICO',
      },
      {
        id: 'prog-r3',
        type: 'Grupal',
        name: 'Grupo Competitivo 5ª A / 4ª (Máx. 4)',
        price: 35,
        vipPrice: 28,
        spotsUsed: 2,
        spotsTotal: 4,
        badge: 'QUEDAN 2 CUPOS',
      },
    ],
    slots: [
      { id: 'sl-r1', day: 'Mar', time: '08:00 AM', label: 'Privada / Sparring' },
      { id: 'sl-r2', day: 'Mié', time: '06:00 PM', label: 'Grupo Competitivo (2/4)' },
      { id: 'sl-r3', day: 'Vie', time: '05:00 PM', label: 'Clínica de Saque' },
      { id: 'sl-r4', day: 'Sáb', time: '09:30 AM', label: 'Evaluación Diagnóstica' },
    ],
  },
  {
    id: 'coach-rodrigo',
    name: 'Rodrigo Villavicencio',
    title: 'Head Coach · Fundamentos y Preparación +40',
    certification: 'Coach Pro Nivel Avanzado · +10 años',
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    featured: false,
    photo: '/assets/sede-country-club.jpg',
    fullBodyPhoto: '/assets/sede-country-club.jpg',
    studentsPromoted: 11,
    specialties: ['Iniciación Adultos', 'Prevención de Lesiones +40', 'Juego en Red y Dobles'],
    bio: 'Entrenamientos dinámicos enfocados en economía de movimiento, revés sólido y construcción de punto para jugadores adultos y Senior +40.',
    baseRate: 60,
    vipRate: 48,
    maxGemCopaySoles: 12,
    whatsapp: '964812340',
    videos: [
      {
        id: 'vid-rod-1',
        title: 'Juego de pies en arcilla sin sobrecargar rodillas',
        duration: '03:04',
        src: '/assets/video-coach-rodrigo.mp4',
        poster: '/assets/portada-tips-semana.jpg',
        isExclusive: false,
        gemsCost: 0,
      },
      {
        id: 'vid-rod-2',
        title: 'Masterclass: Volea firme y cierres en dobles',
        duration: '05:32',
        src: '/assets/video-coach-demo-4.mp4',
        poster: '/assets/portada-academia-tv.jpg',
        isExclusive: true,
        gemsCost: 40,
      },
    ],
    programs: [
      {
        id: 'prog-v1',
        type: 'Privada 1 a 1',
        name: 'Clase Individual de Fundamentos (60 min)',
        price: 60,
        vipPrice: 48,
        spotsUsed: 0,
        spotsTotal: 1,
        badge: 'RITMO PERSONALIZADO',
      },
      {
        id: 'prog-v2',
        type: 'Grupal +40',
        name: 'Clínica Senior +40 · Consistencia',
        price: 30,
        vipPrice: 24,
        spotsUsed: 3,
        spotsTotal: 4,
        badge: 'ÚLTIMO CUPO',
      },
      {
        id: 'prog-v3',
        type: 'Pack 4 Clases',
        name: 'Pack Consolidación 5ª B / 5ª A',
        price: 210,
        vipPrice: 175,
        spotsUsed: 0,
        spotsTotal: 1,
        badge: 'AHORRAS S/ 30',
      },
    ],
    slots: [
      { id: 'sl-v1', day: 'Lun', time: '07:30 AM', label: 'Privada 1 a 1' },
      { id: 'sl-v2', day: 'Jue', time: '07:00 PM', label: 'Clínica +40 (3/4)' },
      { id: 'sl-v3', day: 'Sáb', time: '08:00 AM', label: 'Sparring Táctico' },
    ],
  },
  {
    id: 'coach-carlos',
    name: 'Carlos Méndez',
    title: 'Especialista en Sparring y Velocidad de Bola',
    certification: 'Entrenador Competitivo · Circuito Valle',
    clubId: 'club-tauro',
    clubName: 'Tauro Tenis Club',
    featured: false,
    photo: '/assets/sede-club-tauro.jpg',
    fullBodyPhoto: '/assets/sede-club-tauro.jpg',
    studentsPromoted: 9,
    specialties: ['Sparring Alta Intensidad', 'Devolución de Saque', 'Derecha Acelerada'],
    bio: 'Sesiones de peloteo intenso con lectura real de partido para preparar torneos oficiales y mejorar tus porcentajes en tie-breaks.',
    baseRate: 55,
    vipRate: 44,
    maxGemCopaySoles: 10,
    whatsapp: '964812340',
    videos: [
      {
        id: 'vid-car-1',
        title: 'Cómo acelerar la derecha desde mitad de cancha',
        duration: '02:45',
        src: '/assets/video-coach-horizontal-2.mp4',
        poster: '/assets/portada-tips-semana.jpg',
        isExclusive: false,
        gemsCost: 0,
      },
    ],
    programs: [
      {
        id: 'prog-c1',
        type: 'Sparring',
        name: 'Sparring Competitivo + Feedback (60 min)',
        price: 55,
        vipPrice: 44,
        spotsUsed: 0,
        spotsTotal: 1,
        badge: 'IDEAL PRE-TORNEO',
      },
      {
        id: 'prog-c2',
        type: 'Diagnóstico',
        name: 'Evaluación Técnica y Plan de Nivel',
        price: 45,
        vipPrice: 36,
        spotsUsed: 0,
        spotsTotal: 1,
        badge: 'RECOMENDADO NOVATOS',
      },
    ],
    slots: [
      { id: 'sl-c1', day: 'Mar', time: '06:30 PM', label: 'Sparring Nocturno' },
      { id: 'sl-c2', day: 'Jue', time: '05:00 PM', label: 'Evaluación Diagnóstica' },
      { id: 'sl-c3', day: 'Dom', time: '09:00 AM', label: 'Privada 1 a 1' },
    ],
  },
];

/* ==========================================================================
   CAPÍTULOS DE SALA VISION IA (REPRODUCTOR ASIMÉTRICO 65% / 35%)
   ========================================================================== */
const VISION_IA_CHAPTERS = [
  {
    id: 'vis-1',
    tag: 'MEJORES PUNTOS',
    title: 'Intercambio de 18 golpes en arcilla · Final de Temporada',
    duration: '03:12',
    dateLabel: 'Cancha Central · 60 FPS',
    src: '/assets/video-circuito-horizontal.mp4',
    poster: '/assets/banner-vision-ia.jpg',
  },
  {
    id: 'vis-2',
    tag: 'SAQUES ACE',
    title: 'Velocidad y colocación a la T con seguimiento de trayectoria',
    duration: '01:48',
    dateLabel: 'Análisis Biomecánico',
    src: '/assets/video-horizontal-3.mp4',
    poster: '/assets/portada-tips-semana.jpg',
  },
  {
    id: 'vis-3',
    tag: 'TIE-BREAK FINAL',
    title: 'Definición 12-10 en Super Tie-Break · Cobertura completa',
    duration: '04:26',
    dateLabel: 'Match Center Oficial',
    src: '/assets/video-horizontal-4.mp4',
    poster: '/assets/portada-academia-tv.jpg',
  },
];

const CLUB_COVER_MAP = {
  'club-country': '/assets/sede-country-club.jpg',
  'club-cutipa': '/assets/sede-romina-cutipa.jpg',
  'club-tauro': '/assets/sede-club-tauro.jpg',
  'club-inkas': '/assets/sede-los-inkas.jpg',
};

const CLUB_REAL_SERVICES = [
  { icon: 'sun', label: 'Iluminación LED nocturna' },
  { icon: 'shield', label: 'Mantenimiento diario de arcilla' },
  { icon: 'shop', label: 'Venta de tubos y bebidas en sede' },
  { icon: 'mapPin', label: 'Estacionamiento y zona de descanso' },
];

/* ==========================================================================
   SUBCOMPONENTE: RETRATO DE CUERPO COMPLETO CON SCROLL-REVEAL PROGRESIVO
   ========================================================================== */
function CoachFullBodyReveal({ src, alt, name, certification }) {
  const wrapRef = useRef(null);
  useScrollReveal(wrapRef, { startRevealed: true });

  return (
    <div ref={wrapRef} className="tt-coach-reveal-hero">
      <SmartImage
        src={src}
        fallbackSrc={ASSETS.torneoApertura}
        alt={alt || name}
        className="tt-coach-reveal-img"
      />
      <div className="tt-coach-reveal-scrim" />
      <div className="tt-coach-reveal-caption">
        <span className="tt-coach-cert-pill">{certification}</span>
        <h3>{name}</h3>
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTA PRINCIPAL: SedesView (BLOQUE 13 DE 26)
   ========================================================================== */
export default function SedesView({
  clubs = INITIAL_CLUBS,
  coaches = [],
  currentUser = null,
  theme = 'dark',
  sunlightMode = false,
  onReportClubWeather,
  onUnlockMasterclassVideo,
  onOpenPartnerPortal,
  onOpenVipCard,
  onOpenAuth,
  onNotify,
}) {
  // Sin título gigante duplicado arriba: arrancamos directo con las pestañas limpias
  const [sectionTab, setSectionTab] = useState('todo'); // 'todo' | 'sedes' | 'coaches' | 'vision'

  // Estado climático vivo por club (se hidrata con Open-Meteo + reportes comunitarios)
  const [clubWeatherMap, setClubWeatherMap] = useState({});
  const [liveMeteo, setLiveMeteo] = useState({ tempC: 19, uvIndex: 7, humidity: 48 });

  // Modales en Portal
  const [selectedClub, setSelectedClub] = useState(null);
  const [weatherModalClub, setWeatherModalClub] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Estado interactivo dentro de la ficha del Coach (Modalidad, Turno y Copago Gemas)
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [useGemCopay, setUseGemCopay] = useState(false);
  const [unlockedVideoIds, setUnlockedVideoIds] = useState([]);

  // Capítulo activo en la Sala Vision IA
  const [activeVisionId, setActiveVisionId] = useState(VISION_IA_CHAPTERS[0].id);

  // Cargar temperatura y UV real de Huancayo (Open-Meteo $0)
  useEffect(() => {
    let active = true;
    const coords = clubs?.[0]?.coordinates || { lat: -12.0651, lng: -75.2049 };
    fetchLiveClubWeather(coords.lat, coords.lng).then((res) => {
      if (active && res?.ok) {
        setLiveMeteo({
          tempC: res.tempC,
          uvIndex: res.uvIndex,
          humidity: res.humidity,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [clubs]);

  const effectiveCoaches = useMemo(
    () => (Array.isArray(coaches) && coaches.length > 0 ? coaches : DEFAULT_COACHES),
    [coaches]
  );

  // Coach Destacado 50/50 (Romina Cutipa) -> se excluye del listado inferior para CERO duplicados
  const featuredCoach = useMemo(
    () => effectiveCoaches.find((c) => c.featured) || effectiveCoaches[0] || null,
    [effectiveCoaches]
  );

  const otherCoaches = useMemo(
    () => effectiveCoaches.filter((c) => !featuredCoach || c.id !== featuredCoach.id),
    [effectiveCoaches, featuredCoach]
  );

  const activeVisionChapter = useMemo(
    () => VISION_IA_CHAPTERS.find((v) => v.id === activeVisionId) || VISION_IA_CHAPTERS[0],
    [activeVisionId]
  );

  const getClubWeatherState = (club) => {
    const custom = clubWeatherMap[club.id];
    const key = custom?.conditionKey || club.climaBase?.conditionKey || 'seco';
    const meta = WEATHER_STATES.find((w) => w.key === key) || WEATHER_STATES[0];
    return {
      ...meta,
      reportedBy: custom?.reportedBy || 'Reporte verificado en sede',
      updatedAt: custom?.updatedAt || 'Hace 18 min',
    };
  };

  const getGoogleMapsUrl = (club) => {
    if (club.googleMapsUrl) return club.googleMapsUrl;
    if (club.coordinates?.lat && club.coordinates?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${club.coordinates.lat},${club.coordinates.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${club.name} Huancayo Peru`
    )}`;
  };

  const handleOpenCoachModal = (coach) => {
    triggerHaptic('light');
    setSelectedCoach(coach);
    setSelectedProgramId(coach.programs?.[0]?.id || null);
    setSelectedSlotId(coach.slots?.[0]?.id || null);
    setUseGemCopay(false);
  };

  const handleReportWeather = (club, stateKey) => {
    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para reportar el estado de la cancha y sumar +5 Gemas.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    const timeLabel = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setClubWeatherMap((prev) => ({
      ...prev,
      [club.id]: {
        conditionKey: stateKey,
        reportedBy: currentUser.name,
        updatedAt: `Hoy · ${timeLabel}`,
      },
    }));

    if (onReportClubWeather) {
      onReportClubWeather({ clubId: club.id, conditionKey: stateKey, rewardGems: 5 });
    }
    triggerHaptic('success');
    const st = WEATHER_STATES.find((w) => w.key === stateKey);
    if (onNotify) {
      onNotify(
        `Estado actualizado en ${club.shortName}: ${st?.label || stateKey}. +5 Gemas acreditadas.`,
        'success'
      );
    }
    setWeatherModalClub(null);
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
      if (onNotify) onNotify('Inicia sesión para desbloquear esta Masterclass con Gemas.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const myGems = Number(currentUser.gems) || 0;
    if (myGems < video.gemsCost) {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify(
          `Necesitas ${video.gemsCost} Gemas para esta clase (tienes ${myGems}). Juega partidos o reporta clima para sumar.`,
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
    if (onNotify) onNotify(`Masterclass desbloqueada (-${video.gemsCost} Gemas).`, 'success');
    setActiveVideoModal(video);
  };

  // Cálculo exacto de Copago con Gemas (20 Gemas = S/ 1.00) dentro del modal de Coach
  const coachBookingSummary = useMemo(() => {
    if (!selectedCoach) return null;
    const prog =
      selectedCoach.programs?.find((p) => p.id === selectedProgramId) ||
      selectedCoach.programs?.[0];
    const slot =
      selectedCoach.slots?.find((s) => s.id === selectedSlotId) ||
      selectedCoach.slots?.[0];
    if (!prog) return null;

    const isVip = Boolean(currentUser?.isVip);
    const basePrice = isVip ? prog.vipPrice : prog.price;
    const myGems = Number(currentUser?.gems) || 0;
    const maxSolesByGems = Math.floor(myGems / APP_CONFIG.gemsPerSol); // 20 Gemas = S/ 1
    const maxAllowedCopay = Math.min(
      Number(selectedCoach.maxGemCopaySoles) || 10,
      Math.floor(basePrice * 0.25),
      maxSolesByGems
    );
    const appliedSoles = useGemCopay && maxAllowedCopay > 0 ? maxAllowedCopay : 0;
    const gemsSpent = appliedSoles * APP_CONFIG.gemsPerSol;
    const finalCash = Math.max(0, basePrice - appliedSoles);

    return {
      prog,
      slot,
      isVip,
      basePrice,
      maxAllowedCopay,
      appliedSoles,
      gemsSpent,
      finalCash,
    };
  }, [selectedCoach, selectedProgramId, selectedSlotId, useGemCopay, currentUser]);

  const handleReserveCoachWhatsApp = () => {
    if (!selectedCoach || !coachBookingSummary) return;
    const { prog, slot, isVip, appliedSoles, gemsSpent, finalCash } = coachBookingSummary;
    const msg = [
      `Hola Coach ${selectedCoach.name}, te escribo desde TOTAL TENIS para reservar:`,
      `• Programa: ${prog.name} (${prog.type})`,
      slot ? `• Turno elegido: ${slot.day} · ${slot.time} (${slot.label})` : '',
      `• Tarifa aplicada: ${isVip ? 'Socio VIP' : 'Estándar'}`,
      appliedSoles > 0
        ? `• Copago con Gemas TOTAL TENIS: -S/ ${appliedSoles}.00 (${gemsSpent} Gemas)`
        : '',
      `• Total a abonar en clase: S/ ${finalCash}.00`,
      `• Alumno: ${currentUser?.name || 'Jugador del circuito'}`,
    ]
      .filter(Boolean)
      .join('\n');

    triggerHaptic('success');
    window.open(buildWhatsAppLink(selectedCoach.whatsapp, msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      className={`tt-sedes-view ${theme === 'light' ? 'is-light' : 'is-dark'} ${
        sunlightMode ? 'is-sunlight' : ''
      }`}
      aria-label="Sedes Oficiales, Coaches y Vision IA"
    >
      {/* ====================================================================
          1. BARRA DE NAVEGACIÓN INTERNA LIMPIA (CENTRADA, CERO RECORTES)
          Sin bloque de título duplicado arriba robando espacio útil
          ==================================================================== */}
      <div className="tt-sd-nav-bar" role="tablist" aria-label="Filtrar Sedes y Coaches">
        {[
          { id: 'todo', label: 'Todo' },
          { id: 'sedes', label: `4 Sedes` },
          { id: 'coaches', label: 'Coaches' },
          { id: 'vision', label: 'Vision IA' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={sectionTab === tab.id}
            className={`tt-sd-nav-pill ${sectionTab === tab.id ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setSectionTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====================================================================
          2. SECCIÓN SEDES OFICIALES (4 CLUBES · ARCILLA · SEMÁFORO · GOOGLE MAPS)
          ==================================================================== */}
      {(sectionTab === 'todo' || sectionTab === 'sedes') && (
        <div className="tt-sd-section">
          <div className="tt-sd-section-head">
            <div>
              <span className="tt-sd-kicker">CLUBES ALIADOS · CLIMA EN VIVO {liveMeteo.tempC}°C · UV {liveMeteo.uvIndex}</span>
              <h2 className="tt-sd-heading">Sedes Oficiales del Circuito</h2>
            </div>
          </div>

          <div className="tt-clubs-grid">
            {(clubs || []).map((club) => {
              const weather = getClubWeatherState(club);
              const coverImg = club.banner || CLUB_COVER_MAP[club.id] || ASSETS.torneoApertura;
              const vipText =
                club.vipBenefit || '-15% en alquiler de cancha (Lun–Vie horario valle)';

              return (
                <article key={club.id} className="tt-club-card">
                  {/* Portada clicable con degradado protector inferior (abre ficha completa con blur) */}
                  <div
                    className="tt-club-hero"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedClub(club);
                    }}
                  >
                    <SmartImage
                      src={coverImg}
                      fallbackSrc={ASSETS.torneoApertura}
                      alt={club.name}
                      className="tt-club-hero-img"
                    />
                    <div className="tt-club-hero-scrim" />

                    {/* Fila superior: Badge Sede Oficial con pulso + Etiqueta limpia Arcilla */}
                    <div className="tt-club-top-row">
                      <span className="tt-official-venue-badge">
                        <span className="tt-gold-pulse-dot" />
                        SEDE OFICIAL
                      </span>
                      <span className="tt-club-surface-tag">
                        Arcilla · {club.courtsCount || 3} canchas
                      </span>
                    </div>

                    {/* Fila inferior: Escudo + Nombre clicable + Horario separado limpiamente */}
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
                        <h3 className="tt-club-name">{club.name}</h3>
                        <span className="tt-club-hours">
                          {club.district || 'Huancayo'} · {club.hours || '06:00 a 22:00 h'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo frontal limpio (sin muro de texto de servicios) */}
                  <div className="tt-club-body">
                    {/* Widget Climático Interactivo con icono 3D y reporte rápido (+5 Gemas) */}
                    <button
                      type="button"
                      className="tt-weather-strip"
                      style={{
                        backgroundColor: weather.bg,
                        borderColor: `${weather.color}55`,
                      }}
                      onClick={() => {
                        triggerHaptic('light');
                        setWeatherModalClub(club);
                      }}
                    >
                      <SmartImage
                        src={weather.icon}
                        alt={weather.label}
                        style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong style={{ color: weather.color, fontSize: '0.82rem' }}>
                            {weather.label}
                          </strong>
                          <span className="tt-weather-mini-badge">{weather.badge}</span>
                        </div>
                        <small className="tt-weather-reporter">
                          {weather.reportedBy} · {weather.updatedAt}
                        </small>
                      </div>
                      <span className="tt-report-cta">Reportar +5 💎</span>
                    </button>

                    {/* Golden Ticket VIP compacto (tocar abre el detalle completo del club) */}
                    <button
                      type="button"
                      className="tt-golden-ticket-compact"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedClub(club);
                      }}
                    >
                      <SmartImage
                        src="/assets/canva-golden-ticket.png"
                        fallbackSrc={ASSETS.logo}
                        alt="Golden Ticket VIP"
                        style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <span className="tt-gt-kicker">BENEFICIO EXCLUSIVO SOCIO VIP</span>
                        <strong className="tt-gt-text">{vipText}</strong>
                      </div>
                      <TTIcon name="chevronRight" size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                    </button>

                    {/* Barra de acciones: Ficha Completa + Google Maps (SIN Waze) + WhatsApp */}
                    <div className="tt-club-actions-row">
                      <button
                        type="button"
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedClub(club);
                        }}
                      >
                        Tarifas y Servicios
                      </button>

                      <a
                        href={getGoogleMapsUrl(club)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tt-btn tt-btn-ghost tt-btn-sm"
                        onClick={() => triggerHaptic('light')}
                      >
                        <TTIcon name="mapPin" size={15} style={{ color: '#00DC7D' }} />
                        Maps
                      </a>

                      <a
                        href={buildWhatsAppLink(
                          club.whatsapp || APP_CONFIG.supportWhatsApp,
                          `Hola ${club.name}, te escribo desde TOTAL TENIS para consultar disponibilidad y reservar cancha.`
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
        </div>
      )}

      {/* ====================================================================
          3. SECCIÓN COACHES OFICIALES (SPOTLIGHT 50/50 + VIDEOS + COPAGO GEMAS)
          Sin comentarios inventados · Sin duplicar al Coach destacado abajo
          ==================================================================== */}
      {(sectionTab === 'todo' || sectionTab === 'coaches') && (
        <div className="tt-sd-section">
          <div className="tt-sd-section-head">
            <div>
              <span className="tt-sd-kicker">ENTRENADORES CERTIFICADOS · COPAGO CON GEMAS</span>
              <h2 className="tt-sd-heading">Academia & Coaches Oficiales</h2>
            </div>
          </div>

          {/* Tarjeta Editorial 50/50: COACH DESTACADO DE LA SEMANA (sobre Marfil) */}
          {featuredCoach && (
            <article
              className="tt-featured-coach-5050"
              onClick={() => handleOpenCoachModal(featuredCoach)}
            >
              <div className="tt-fc-left">
                <span className="tt-fc-kicker">COACH DE LA SEMANA</span>
                <h3 className="tt-fc-name">{featuredCoach.name}</h3>
                <p className="tt-fc-role">{featuredCoach.title}</p>
                <p className="tt-fc-bio">{featuredCoach.bio}</p>

                <div className="tt-fc-metrics">
                  <span>
                    <strong>+{featuredCoach.studentsPromoted}</strong> Alumnos ascendidos
                  </span>
                  <span>
                    <strong>S/ {featuredCoach.baseRate}</strong> · VIP <strong>S/ {featuredCoach.vipRate}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  className="tt-fc-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCoachModal(featuredCoach);
                  }}
                >
                  Ver Videos, Cupos y Horarios
                </button>
              </div>

              <div className="tt-fc-right">
                <SmartImage
                  src={featuredCoach.photo}
                  fallbackSrc={ASSETS.torneoAltura}
                  alt={featuredCoach.name}
                  className="tt-fc-img"
                />
                <span className="tt-fc-video-chip">
                  ▶ {featuredCoach.videos?.length || 1} Videos en cancha
                </span>
              </div>
            </article>
          )}

          {/* Lista de Otros Coaches (NUNCA repite al coach destacado arriba) */}
          <div className="tt-coaches-grid">
            {otherCoaches.map((coach) => (
              <article
                key={coach.id}
                className="tt-coach-card"
                onClick={() => handleOpenCoachModal(coach)}
              >
                <div className="tt-coach-card-top">
                  <SmartImage
                    src={coach.photo}
                    fallbackSrc={ASSETS.torneoApertura}
                    alt={coach.name}
                    style={{
                      width: 66,
                      height: 66,
                      borderRadius: 18,
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      border: '2px solid rgba(0, 220, 125, 0.65)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="tt-coach-badge-mini">COACH VERIFICADO</span>
                    <h3 className="tt-coach-card-name">{coach.name}</h3>
                    <small className="tt-coach-card-club">{coach.clubName}</small>
                  </div>
                </div>

                {/* Píldoras de especialidad limpia */}
                <div className="tt-coach-tags">
                  {(coach.specialties || []).slice(0, 3).map((sp) => (
                    <span key={sp} className="tt-coach-tag-chip">
                      {sp}
                    </span>
                  ))}
                </div>

                {/* Métricas reales de valor (sin "420h" ni reseñas falsas) */}
                <div className="tt-coach-kpi-row">
                  <div>
                    <span>Desde</span>
                    <strong>S/ {coach.baseRate}</strong>
                  </div>
                  <div className="is-vip">
                    <span>Socio VIP</span>
                    <strong>S/ {coach.vipRate}</strong>
                  </div>
                  <div>
                    <span>Ascendidos</span>
                    <strong>+{coach.studentsPromoted}</strong>
                  </div>
                </div>

                <div className="tt-coach-card-foot">
                  <span className="tt-coach-slots-hint">
                    {coach.slots?.length || 0} turnos libres · Acepta Gemas 💎
                  </span>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCoachModal(coach);
                    }}
                  >
                    Ver Perfil
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          4. SALA VISION IA (65% VIDEO / 35% CAPÍTULOS) + 3 PILARES + MISIÓN
          ==================================================================== */}
      {(sectionTab === 'todo' || sectionTab === 'vision') && (
        <div className="tt-sd-section">
          {/* Reproductor Asimétrico 65% / 35% */}
          <div className="tt-vision-shell">
            <div className="tt-vision-head">
              <div>
                <span className="tt-vision-kicker">ANÁLISIS Y COBERTURA EN CANCHA</span>
                <h2 className="tt-vision-title">TOTAL TENIS VISION IA</h2>
              </div>
              <span className="tt-vision-live-tag">60 FPS · CAPÍTULOS</span>
            </div>

            <div className="tt-vision-grid">
              {/* Columna Izquierda (65%): Reproductor Principal */}
              <div className="tt-vision-player-col">
                <div className="tt-vision-video-frame">
                  <video
                    key={activeVisionChapter.src}
                    src={activeVisionChapter.src}
                    poster={activeVisionChapter.poster}
                    controls
                    playsInline
                    preload="metadata"
                    className="tt-vision-video"
                  />
                </div>
                <div className="tt-vision-now-meta">
                  <span className="tt-vision-cat-pill">{activeVisionChapter.tag}</span>
                  <strong>{activeVisionChapter.title}</strong>
                  <small>{activeVisionChapter.dateLabel}</small>
                </div>
              </div>

              {/* Columna Derecha (35%): Playlist Vertical de Capítulos */}
              <div className="tt-vision-playlist-col">
                {VISION_IA_CHAPTERS.map((ch) => {
                  const isActive = ch.id === activeVisionChapter.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      className={`tt-vision-item ${isActive ? 'is-active' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveVisionId(ch.id);
                      }}
                    >
                      <div className="tt-vision-item-text">
                        <span>{ch.tag}</span>
                        <strong>{ch.title}</strong>
                      </div>
                      <div className="tt-vision-thumb">
                        <SmartImage
                          src={ch.poster}
                          fallbackSrc={ASSETS.torneoApertura}
                          alt={ch.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span className="tt-vision-dur">▶ {ch.duration}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grilla de 3 Pilares sobre Púrpura Noche (1. Calibra · 2. Entrena · 3. Compite) */}
          <div className="tt-pillars-grid">
            {[
              {
                step: '01 · CALIBRA',
                title: 'Mide tu nivel real',
                desc: 'Juega tus primeros 5 partidos y ubica tu categoría exacta sin conjeturas.',
              },
              {
                step: '02 · ENTRENA',
                title: 'Perfecciona con Coaches',
                desc: 'Corrige saque, derecha y táctica usando tus Gemas como copago en clases.',
              },
              {
                step: '03 · COMPITE',
                title: 'Escala al Master Top 8',
                desc: 'Sube puestos cada semana en las 4 sedes oficiales y clasifica a fin de año.',
              },
            ].map((pil) => (
              <div key={pil.step} className="tt-pillar-card">
                <span>{pil.step}</span>
                <strong>{pil.title}</strong>
                <p>{pil.desc}</p>
              </div>
            ))}
          </div>

          {/* Banner Final: NUESTRA MISIÓN (Captación de Nuevos Clubes y Coaches) */}
          <div className="tt-mission-banner">
            <SmartImage
              src="/assets/banner-vision-ia.jpg"
              fallbackSrc={ASSETS.torneoMasterTop8}
              alt="Nuestra misión TOTAL TENIS"
              className="tt-mission-bg"
            />
            <div className="tt-mission-scrim" />
            <div className="tt-mission-content">
              <span className="tt-mission-kicker">PORTAL ALIADOS TOTAL TENIS</span>
              <h3>¿Diriges una academia, club o enseñas tenis?</h3>
              <p>
                Gestiona tus videos en cancha, cupos grupales y promociones en horario valle desde tu propio Estudio Aliado.
              </p>
              <button
                type="button"
                className="tt-btn tt-btn-primary tt-btn-sm"
                onClick={() => {
                  triggerHaptic('medium');
                  if (onOpenPartnerPortal) {
                    onOpenPartnerPortal();
                  } else {
                    window.open(
                      buildWhatsAppLink(
                        APP_CONFIG.supportWhatsApp,
                        'Hola equipo TOTAL TENIS, quiero afiliar mi sede o perfil de entrenador al Portal Aliados.'
                      ),
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }
                }}
              >
                Unirme como Entrenador / Sede
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 1 (PORTAL CON BLUR): FICHA COMPLETA DE SEDE OFICIAL
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(selectedClub)}
        onClose={() => setSelectedClub(null)}
        title={selectedClub?.name || 'Sede Oficial'}
        subtitle={
          selectedClub
            ? `${selectedClub.district || 'Huancayo'} · Arcilla · ${selectedClub.hours || '06:00 a 22:00 h'}`
            : ''
        }
        icon={<IconBadge name="mapPin" variant="emerald" size={38} />}
        isWide
      >
        {selectedClub && (
          <div className="tt-club-modal-stack">
            {/* Imagen Panorámica */}
            <div className="tt-cm-banner">
              <SmartImage
                src={selectedClub.banner || CLUB_COVER_MAP[selectedClub.id]}
                fallbackSrc={ASSETS.torneoApertura}
                alt={selectedClub.name}
                style={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: 18 }}
              />
            </div>

            {/* Tabla Clara de Tarifas por Hora (Día / Noche / Socio VIP) */}
            <div className="tt-cm-rates-card">
              <span className="tt-cm-kicker">TARIFAS REFERENCIALES POR HORA</span>
              <div className="tt-cm-rates-grid">
                <div>
                  <span>Horario Día</span>
                  <strong>{selectedClub.dayRate || 'S/ 30 / hora'}</strong>
                </div>
                <div>
                  <span>Horario Noche (LED)</span>
                  <strong>{selectedClub.nightRate || 'S/ 45 / hora'}</strong>
                </div>
                <div className="is-vip">
                  <span>Socio VIP Valle</span>
                  <strong>{selectedClub.vipRate || '-15% Dcto'}</strong>
                </div>
              </div>
              <small className="tt-cm-hours-note">
                Atención: {selectedClub.hours || 'Lunes a Domingo · 06:00 a 22:00 h'} · {selectedClub.address || selectedClub.district}
              </small>
            </div>

            {/* Instalaciones y Servicios Reales (Con icono propio por servicio) */}
            <div>
              <span className="tt-cm-kicker">INSTALACIONES Y SERVICIOS EN SEDE</span>
              <div className="tt-cm-services-grid">
                {CLUB_REAL_SERVICES.map((srv) => (
                  <div key={srv.label} className="tt-cm-service-tile">
                    <TTIcon name={srv.icon} size={17} style={{ color: '#00DC7D', flexShrink: 0 }} />
                    <span>{srv.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta Dorada Beneficios Exclusivos VIP */}
            <div className="tt-cm-vip-card">
              <SmartImage
                src="/assets/canva-golden-ticket.png"
                fallbackSrc={ASSETS.logo}
                alt="Golden Ticket VIP"
                style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="tt-gt-kicker">GOLDEN TICKET · SOCIO VIP</span>
                <strong>
                  {selectedClub.vipBenefit || '-15% en alquiler de cancha en horario valle presentando tu Carnet Digital VIP.'}
                </strong>
              </div>
              {onOpenVipCard && (
                <button
                  type="button"
                  className="tt-btn tt-btn-primary tt-btn-sm"
                  onClick={() => {
                    setSelectedClub(null);
                    onOpenVipCard();
                  }}
                >
                  Mi Carnet
                </button>
              )}
            </div>

            {/* Acciones Finales: Google Maps + WhatsApp */}
            <div style={{ display: 'flex', gap: 9 }}>
              <a
                href={getGoogleMapsUrl(selectedClub)}
                target="_blank"
                rel="noopener noreferrer"
                className="tt-btn tt-btn-secondary"
                style={{ flex: 1 }}
              >
                <TTIcon name="mapPin" size={17} />
                Abrir en Google Maps
              </a>
              <a
                href={buildWhatsAppLink(
                  selectedClub.whatsapp || APP_CONFIG.supportWhatsApp,
                  `Hola ${selectedClub.name}, quiero consultar horarios disponibles para alquilar cancha desde TOTAL TENIS.`
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
          MODAL 2 (PORTAL): REPORTAR SEMÁFORO CLIMÁTICO (+5 GEMAS)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(weatherModalClub)}
        onClose={() => setWeatherModalClub(null)}
        title="Estado de la Cancha en Vivo"
        subtitle={weatherModalClub ? `${weatherModalClub.name} · Gana +5 Gemas por reportar` : ''}
        icon={<IconBadge name="sun" variant="gold" size={38} />}
        isTopLayer
      >
        {weatherModalClub && (
          <div className="tt-weather-picker-stack">
            <p className="tt-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
              ¿Estás en la sede ahora? Toca el estado real de la arcilla para ayudar a toda la comunidad antes de salir de casa:
            </p>
            {WEATHER_STATES.map((st) => (
              <button
                key={st.key}
                type="button"
                className="tt-weather-option-card"
                style={{ borderColor: `${st.color}66` }}
                onClick={() => handleReportWeather(weatherModalClub, st.key)}
              >
                <SmartImage
                  src={st.icon}
                  alt={st.label}
                  style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }}
                />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ color: st.color }}>{st.label}</strong>
                    <span className="tt-weather-mini-badge">{st.badge}</span>
                  </div>
                  <small>{st.sportNote}</small>
                </div>
              </button>
            ))}
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 3 (PORTAL): PERFIL PRO DEL COACH (SCROLL-REVEAL + VIDEOS + COPAGO GEMAS)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(selectedCoach)}
        onClose={() => setSelectedCoach(null)}
        title={selectedCoach?.name || 'Coach Oficial'}
        subtitle={selectedCoach?.clubName || ''}
        icon={<IconBadge name="users" variant="emerald" size={38} />}
        isWide
      >
        {selectedCoach && coachBookingSummary && (
          <div className="tt-coach-modal-stack">
            {/* 1. Retrato de Cuerpo Completo con Scroll-Reveal Progresivo */}
            <CoachFullBodyReveal
              src={selectedCoach.fullBodyPhoto || selectedCoach.photo}
              name={selectedCoach.name}
              certification={selectedCoach.certification}
            />

            {/* 2. Portafolio de Videos Reales en Cancha (Reemplaza reseñas falsas) */}
            <div className="tt-cm-block">
              <span className="tt-cm-kicker">VIDEOS EN CANCHA · TIPS Y MASTERCLASSES</span>
              <div className="tt-coach-videos-grid">
                {(selectedCoach.videos || []).map((vid) => {
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
                          {unlocked ? `▶ Ver · ${vid.duration}` : `🔒 Desbloquear · ${vid.gemsCost} 💎`}
                        </span>
                        <strong>{vid.title}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Catálogo de Modalidades con Tarifa VIP Real y Cupos */}
            <div className="tt-cm-block">
              <span className="tt-cm-kicker">ELIGE TU MODALIDAD O PROGRAMA</span>
              <div className="tt-programs-stack">
                {(selectedCoach.programs || []).map((prog) => {
                  const active = coachBookingSummary.prog.id === prog.id;
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      className={`tt-program-tile ${active ? 'is-active' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedProgramId(prog.id);
                      }}
                    >
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className="tt-prog-type">{prog.type}</span>
                          {prog.badge && <span className="tt-prog-badge">{prog.badge}</span>}
                        </div>
                        <strong className="tt-prog-name">{prog.name}</strong>
                      </div>
                      <div className="tt-prog-prices">
                        <strong>S/ {prog.price}</strong>
                        <small>VIP: S/ {prog.vipPrice}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Calendario Semanal de Turnos Libres */}
            <div className="tt-cm-block">
              <span className="tt-cm-kicker">TURNOS LIBRES ESTA SEMANA</span>
              <div className="tt-slots-grid">
                {(selectedCoach.slots || []).map((sl) => {
                  const active = coachBookingSummary.slot?.id === sl.id;
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
                      <strong>{sl.day} · {sl.time}</strong>
                      <span>{sl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Copago Inteligente con Gemas (20 Gemas = S/ 1.00) */}
            <div className="tt-gem-copay-box">
              <div className="tt-gem-copay-head">
                <div>
                  <strong>Aplicar Copago con Gemas (20 💎 = S/ 1.00)</strong>
                  <small>
                    {coachBookingSummary.maxAllowedCopay > 0
                      ? `Puedes descontar hasta S/ ${coachBookingSummary.maxAllowedCopay}.00 usando ${coachBookingSummary.maxAllowedCopay * 20} Gemas.`
                      : 'Acumula 20+ Gemas jugando retos para descontar en tus clases.'}
                  </small>
                </div>
                <button
                  type="button"
                  disabled={coachBookingSummary.maxAllowedCopay <= 0}
                  className={`tt-copay-toggle ${useGemCopay ? 'is-on' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setUseGemCopay((v) => !v);
                  }}
                >
                  {useGemCopay ? 'Aplicado' : 'Usar Gemas'}
                </button>
              </div>

              <div className="tt-booking-total-bar">
                <div>
                  <span>Total a abonar al Coach</span>
                  <strong>S/ {coachBookingSummary.finalCash}.00</strong>
                </div>
                <button
                  type="button"
                  className="tt-btn tt-btn-primary"
                  onClick={handleReserveCoachWhatsApp}
                >
                  <TTIcon name="whatsapp" size={17} />
                  Reservar Turno
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 4 (PORTAL): REPRODUCTOR DE VIDEO EN CANCHA
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
          ESTILOS ENCAPSULADOS (SEDES + COACHES + VISION IA)
          ==================================================================== */}
      <style>{`
        .tt-sedes-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* 1. PÍLDORAS DE NAVEGACIÓN LIMPIAS Y CENTRADAS (SIN RECORTE) */
        .tt-sd-nav-bar {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
          padding: 5px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-sd-nav-pill {
          min-height: 40px;
          padding: 0 6px;
          border-radius: 13px;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          white-space: nowrap;
          text-align: center;
          transition: background-color 180ms ease, color 180ms ease, transform 120ms ease;
        }
        .tt-sd-nav-pill:active {
          transform: scale(0.96);
        }
        .tt-sd-nav-pill.is-active {
          background: #1E0734;
          color: #00DC7D;
          box-shadow: 0 5px 14px rgba(10, 2, 20, 0.22);
        }
        .tt-sedes-view.is-dark .tt-sd-nav-pill.is-active {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }

        .tt-sd-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-sd-section-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-sd-kicker {
          display: block;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
        }
        .tt-sedes-view.is-light .tt-sd-kicker {
          color: #008A4E;
        }
        .tt-sd-heading {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.42rem;
          font-weight: 900;
          line-height: 1.05;
        }

        /* 2. SEDES OFICIALES */
        .tt-clubs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 760px) {
          .tt-clubs-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .tt-club-card {
          border-radius: 24px;
          overflow: hidden;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
        }
        .tt-club-hero {
          position: relative;
          min-height: 184px;
          padding: 13px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          background: #1A0530;
        }
        .tt-club-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-club-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(18, 3, 33, 0.42) 0%,
            rgba(18, 3, 33, 0.22) 44%,
            rgba(16, 3, 29, 0.96) 100%
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
        .tt-official-venue-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.92) 0%, rgba(217, 119, 6, 0.95) 100%);
          color: #1E1102;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.42);
        }
        .tt-gold-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1E0734;
          animation: ttLivePulse 1.8s infinite;
        }
        .tt-club-surface-tag {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(16, 3, 29, 0.8);
          border: 1px solid rgba(250, 249, 245, 0.24);
          color: #FAF9F5;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-club-bottom-row {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-club-crest-wrap {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: #FFFFFF;
          border: 2px solid #FAF9F5;
          overflow: hidden;
          flex-shrink: 0;
        }
        .tt-club-name {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.2rem;
          font-weight: 900;
          line-height: 1.06;
          color: #FAF9F5;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }
        .tt-club-hours {
          display: block;
          margin-top: 2px;
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(250, 249, 245, 0.82);
        }

        .tt-club-body {
          padding: 13px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-weather-strip {
          width: 100%;
          padding: 9px 11px;
          border-radius: 15px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          gap: 9px;
          transition: transform 140ms ease;
        }
        .tt-weather-strip:active {
          transform: scale(0.98);
        }
        .tt-weather-mini-badge {
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(18, 3, 33, 0.14);
          color: var(--tt-text);
          font-size: 0.62rem;
          font-weight: 800;
        }
        .tt-weather-reporter {
          display: block;
          font-size: 0.68rem;
          color: var(--tt-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-report-cta {
          padding: 5px 9px;
          border-radius: 999px;
          background: #1E0734;
          color: #00DC7D;
          font-size: 0.66rem;
          font-weight: 900;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tt-golden-ticket-compact {
          width: 100%;
          padding: 9px 11px;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.06) 100%);
          border: 1px dashed rgba(245, 158, 11, 0.58);
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--tt-text);
        }
        .tt-gt-kicker {
          display: block;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #F59E0B;
        }
        .tt-gt-text {
          display: block;
          font-size: 0.76rem;
          font-weight: 800;
          line-height: 1.25;
        }
        .tt-club-actions-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        /* 3. SPOTLIGHT 50/50 COACH DE LA SEMANA + LISTA */
        .tt-featured-coach-5050 {
          border-radius: 24px;
          overflow: hidden;
          background: #FAF9F5;
          color: #1E0734;
          border: 1px solid rgba(30, 7, 52, 0.12);
          box-shadow: 0 14px 32px rgba(10, 2, 20, 0.24);
          display: grid;
          grid-template-columns: 1fr;
          cursor: pointer;
        }
        @media (min-width: 680px) {
          .tt-featured-coach-5050 {
            grid-template-columns: 1.15fr 0.85fr;
          }
        }
        .tt-fc-left {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          justify-content: center;
        }
        .tt-fc-kicker {
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #008A4E;
        }
        .tt-fc-name {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.65rem;
          font-weight: 900;
          line-height: 0.98;
        }
        .tt-fc-role {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 800;
          color: #B44924;
        }
        .tt-fc-bio {
          margin: 2px 0 0;
          font-size: 0.78rem;
          line-height: 1.44;
          color: rgba(30, 7, 52, 0.76);
        }
        .tt-fc-metrics {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 0.75rem;
          padding-top: 4px;
        }
        .tt-fc-cta {
          margin-top: 6px;
          align-self: flex-start;
          min-height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.76rem;
          font-weight: 900;
          box-shadow: 0 8px 20px rgba(0, 220, 125, 0.32);
        }
        .tt-fc-right {
          position: relative;
          min-height: 200px;
          background: #1E0734;
        }
        .tt-fc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .tt-fc-video-chip {
          position: absolute;
          left: 12px;
          bottom: 12px;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(18, 3, 33, 0.84);
          border: 1px solid rgba(0, 220, 125, 0.55);
          color: #00DC7D;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .tt-coaches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 720px) {
          .tt-coaches-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .tt-coach-card {
          border-radius: 22px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 11px;
          cursor: pointer;
        }
        .tt-coach-card-top {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .tt-coach-badge-mini {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
        }
        .tt-sedes-view.is-light .tt-coach-badge-mini {
          color: #008A4E;
        }
        .tt-coach-card-name {
          margin: 1px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.18rem;
          line-height: 1.05;
        }
        .tt-coach-card-club {
          font-size: 0.72rem;
          color: var(--tt-text-muted);
        }
        .tt-coach-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tt-coach-tag-chip {
          padding: 4px 9px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          font-size: 0.69rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }
        .tt-coach-kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 9px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          text-align: center;
        }
        .tt-coach-kpi-row span {
          display: block;
          font-size: 0.64rem;
          color: var(--tt-text-muted);
        }
        .tt-coach-kpi-row strong {
          font-size: 0.94rem;
          font-weight: 900;
        }
        .tt-coach-kpi-row .is-vip strong {
          color: #F59E0B;
        }
        .tt-coach-card-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-coach-slots-hint {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }

        /* 4. VISION IA (65% / 35%), 3 PILARES Y BANNER MISIÓN */
        .tt-vision-shell {
          border-radius: 24px;
          padding: 16px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.3);
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-vision-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-vision-kicker {
          display: block;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
        }
        .tt-vision-title {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-size: 1.45rem;
          line-height: 1;
        }
        .tt-vision-live-tag {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.16);
          border: 1px solid rgba(0, 220, 125, 0.45);
          color: #7CF5C0;
          font-size: 0.64rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .tt-vision-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 740px) {
          .tt-vision-grid {
            grid-template-columns: 1.75fr 1fr;
          }
        }
        .tt-vision-video-frame {
          border-radius: 16px;
          overflow: hidden;
          background: #090212;
          aspect-ratio: 16 / 9;
        }
        .tt-vision-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-vision-now-meta {
          margin-top: 9px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .tt-vision-cat-pill {
          align-self: flex-start;
          padding: 2px 8px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.62rem;
          font-weight: 900;
        }
        .tt-vision-now-meta strong {
          font-size: 0.92rem;
          line-height: 1.25;
        }
        .tt-vision-now-meta small {
          font-size: 0.72rem;
          opacity: 0.7;
        }
        .tt-vision-playlist-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-vision-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px;
          border-radius: 14px;
          background: rgba(250, 249, 245, 0.06);
          border: 1px solid rgba(250, 249, 245, 0.12);
          color: #FAF9F5;
          text-align: left;
        }
        .tt-vision-item.is-active {
          background: rgba(0, 220, 125, 0.14);
          border-color: #00DC7D;
        }
        .tt-vision-item-text {
          flex: 1;
          min-width: 0;
        }
        .tt-vision-item-text span {
          display: block;
          font-size: 0.58rem;
          font-weight: 900;
          color: #00DC7D;
          letter-spacing: 0.07em;
        }
        .tt-vision-item-text strong {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 0.75rem;
          line-height: 1.22;
          margin-top: 2px;
        }
        .tt-vision-thumb {
          position: relative;
          width: 78px;
          height: 52px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .tt-vision-dur {
          position: absolute;
          left: 4px;
          bottom: 4px;
          padding: 1px 5px;
          border-radius: 5px;
          background: rgba(0, 0, 0, 0.78);
          color: #FAF9F5;
          font-size: 0.58rem;
          font-weight: 800;
        }

        .tt-pillars-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 680px) {
          .tt-pillars-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .tt-pillar-card {
          border-radius: 18px;
          padding: 14px;
          background: #1E0734;
          color: #FAF9F5;
          border: 1px solid rgba(250, 249, 245, 0.14);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tt-pillar-card span {
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
        }
        .tt-pillar-card strong {
          font-size: 0.94rem;
        }
        .tt-pillar-card p {
          margin: 0;
          font-size: 0.75rem;
          line-height: 1.4;
          opacity: 0.78;
        }

        .tt-mission-banner {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          padding: 20px 18px;
          background: #1A0530;
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.3);
        }
        .tt-mission-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.42;
        }
        .tt-mission-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(20, 4, 36, 0.94) 0%, rgba(30, 7, 52, 0.74) 100%);
        }
        .tt-mission-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
          max-width: 520px;
        }
        .tt-mission-kicker {
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #00DC7D;
        }
        .tt-mission-content h3 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.38rem;
          line-height: 1.06;
        }
        .tt-mission-content p {
          margin: 0 0 4px;
          font-size: 0.8rem;
          opacity: 0.84;
          line-height: 1.42;
        }

        /* 5. MODALES DE SEDE, CLIMA Y COACH PRO (SCROLL-REVEAL + COPAGO) */
        .tt-club-modal-stack,
        .tt-weather-picker-stack,
        .tt-coach-modal-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-cm-kicker {
          display: block;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
          margin-bottom: 7px;
        }
        .tt-sedes-view.is-light .tt-cm-kicker {
          color: #008A4E;
        }
        .tt-cm-rates-card {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-cm-rates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          text-align: center;
        }
        .tt-cm-rates-grid > div {
          padding: 9px 6px;
          border-radius: 12px;
          background: var(--tt-surface);
        }
        .tt-cm-rates-grid span {
          display: block;
          font-size: 0.65rem;
          color: var(--tt-text-muted);
        }
        .tt-cm-rates-grid strong {
          font-size: 0.86rem;
          font-weight: 900;
        }
        .tt-cm-rates-grid .is-vip strong {
          color: #F59E0B;
        }
        .tt-cm-hours-note {
          display: block;
          margin-top: 8px;
          font-size: 0.72rem;
          color: var(--tt-text-muted);
        }
        .tt-cm-services-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-cm-service-tile {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          font-size: 0.76rem;
          font-weight: 700;
        }
        .tt-cm-vip-card {
          padding: 12px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.06) 100%);
          border: 1px dashed rgba(245, 158, 11, 0.6);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-cm-vip-card strong {
          display: block;
          font-size: 0.78rem;
          line-height: 1.3;
        }
        .tt-weather-option-card {
          width: 100%;
          padding: 11px 12px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1.5px solid var(--tt-border);
          display: flex;
          align-items: center;
          gap: 11px;
          color: var(--tt-text);
        }
        .tt-weather-option-card small {
          display: block;
          font-size: 0.74rem;
          color: var(--tt-text-muted);
          margin-top: 2px;
        }

        /* Retrato Scroll-Reveal del Coach */
        .tt-coach-reveal-hero {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          min-height: 220px;
          background: #1A0530;
          clip-path: inset(calc((1 - var(--tt-reveal, 1)) * 8%) 0 round 20px);
          transition: clip-path 260ms ease-out;
        }
        .tt-coach-reveal-img {
          width: 100%;
          height: 230px;
          object-fit: cover;
          object-position: center top;
          transform: scale(calc(1.06 - (var(--tt-reveal, 1) * 0.06)));
          transition: transform 280ms ease-out;
        }
        .tt-coach-reveal-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(20, 4, 36, 0.1) 25%, rgba(16, 3, 29, 0.94) 100%);
        }
        .tt-coach-reveal-caption {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 13px;
          color: #FAF9F5;
        }
        .tt-coach-cert-pill {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.24);
          border: 1px solid rgba(245, 158, 11, 0.6);
          color: #FDE68A;
          font-size: 0.64rem;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .tt-coach-reveal-caption h3 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.48rem;
          line-height: 1;
        }

        .tt-coach-videos-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 9px;
        }
        @media (min-width: 560px) {
          .tt-coach-videos-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-coach-vid-card {
          position: relative;
          border-radius: 15px;
          overflow: hidden;
          min-height: 118px;
          background: #140324;
          text-align: left;
          padding: 0;
          border: 1px solid var(--tt-border);
        }
        .tt-coach-vid-poster {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.68;
        }
        .tt-coach-vid-overlay {
          position: relative;
          z-index: 2;
          height: 100%;
          padding: 10px;
          background: linear-gradient(180deg, rgba(16, 3, 29, 0.2) 0%, rgba(16, 3, 29, 0.92) 100%);
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
        }
        .tt-vid-pill {
          align-self: flex-start;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 0.64rem;
          font-weight: 900;
        }
        .tt-vid-pill.is-free {
          background: #00DC7D;
          color: #120321;
        }
        .tt-vid-pill.is-lock {
          background: rgba(18, 3, 33, 0.82);
          border: 1px solid #00DC7D;
          color: #7CF5C0;
        }
        .tt-coach-vid-overlay strong {
          font-size: 0.8rem;
          line-height: 1.24;
        }

        .tt-programs-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
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
        .tt-program-tile.is-active {
          border-color: #00DC7D;
          background: rgba(0, 220, 125, 0.1);
        }
        .tt-prog-type {
          font-size: 0.64rem;
          font-weight: 900;
          text-transform: uppercase;
          color: var(--tt-text-muted);
        }
        .tt-prog-badge {
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.18);
          color: #F59E0B;
          font-size: 0.6rem;
          font-weight: 900;
        }
        .tt-prog-name {
          display: block;
          margin-top: 3px;
          font-size: 0.84rem;
        }
        .tt-prog-prices {
          text-align: right;
          flex-shrink: 0;
        }
        .tt-prog-prices strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.2rem;
          line-height: 1;
          color: #00DC7D;
        }
        .tt-sedes-view.is-light .tt-prog-prices strong {
          color: #1E0734;
        }
        .tt-prog-prices small {
          font-size: 0.68rem;
          font-weight: 800;
          color: #F59E0B;
        }

        .tt-slots-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
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
        .tt-slot-tile.is-active {
          border-color: #00DC7D;
          background: rgba(0, 220, 125, 0.12);
        }
        .tt-slot-tile strong {
          font-size: 0.8rem;
        }
        .tt-slot-tile span {
          font-size: 0.68rem;
          color: var(--tt-text-muted);
        }

        .tt-gem-copay-box {
          padding: 13px;
          border-radius: 17px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.35);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-gem-copay-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-gem-copay-head strong {
          display: block;
          font-size: 0.82rem;
        }
        .tt-gem-copay-head small {
          display: block;
          font-size: 0.7rem;
          opacity: 0.76;
          margin-top: 2px;
        }
        .tt-copay-toggle {
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.14);
          color: #FAF9F5;
          font-size: 0.72rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .tt-copay-toggle.is-on {
          background: #00DC7D;
          color: #120321;
        }
        .tt-copay-toggle:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }
        .tt-booking-total-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(250, 249, 245, 0.12);
        }
        .tt-booking-total-bar span {
          display: block;
          font-size: 0.68rem;
          opacity: 0.74;
        }
        .tt-booking-total-bar strong {
          font-family: var(--tt-font-display);
          font-size: 1.55rem;
          line-height: 1;
          color: #00DC7D;
        }
      `}</style>
    </section>
  );
}
