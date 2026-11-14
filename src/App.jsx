// ============================================================================
// MATCHPOINT — CIRCUITO OFICIAL DE TENIS (VERSIÓN DEFINITIVA COMPLETA)
// ============================================================================
// === INICIO DEL BLOQUE 1 DE 6 ===

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ============================================================================
// 1. ESTILOS GLOBALES: BLINDAJE IPHONE 16 PRO MAX, TEMA DUAL, 3D Y ANIMACIONES
// ============================================================================
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --volt: #D6FF00;
    --electric: #00A3FF;
    --emerald: #10B981;
    --bg-base: #0B0E14;
    --bg-card: #131822;
    --bg-elevated: #1A2130;
    --text-main: #FFFFFF;
    --text-muted: #94A3B8;
    --border-subtle: rgba(255, 255, 255, 0.08);
    --accent-primary: #D6FF00;
    --accent-secondary: #00A3FF;
    --accent-text-on-card: #D6FF00;
  }

  /* Modo Claro de Alto Contraste para Lectura Bajo el Sol de Huancayo */
  .theme-light {
    --bg-base: #F1F5F9;
    --bg-card: #FFFFFF;
    --bg-elevated: #E2E8F0;
    --text-main: #0B0E14;
    --text-muted: #475569;
    --border-subtle: rgba(15, 23, 42, 0.12);
    --accent-primary: #0052CC;
    --accent-secondary: #059669;
    --accent-text-on-card: #0052CC;
  }

  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100dvh;
    overflow: hidden;
    overscroll-behavior-y: none;
    background-color: var(--bg-base);
    color: var(--text-main);
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .app-shell {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--bg-base);
    color: var(--text-main);
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  .app-scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding-bottom: 112px;
  }

  /* Blindaje Exacto bajo Isla Dinámica (iPhone 16 Pro Max = 54px mínimo) */
  .safe-top-header {
    padding-top: max(env(safe-area-inset-top, 54px), 54px);
    padding-left: 14px;
    padding-right: 14px;
    padding-bottom: 10px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-subtle);
    z-index: 50;
    flex-shrink: 0;
  }

  .safe-modal-top {
    padding-top: max(env(safe-area-inset-top, 56px), 56px);
  }

  .safe-bottom-bar {
    padding-bottom: max(env(safe-area-inset-bottom, 20px), 14px);
    background: var(--bg-card);
    border-top: 1px solid var(--border-subtle);
    z-index: 50;
    flex-shrink: 0;
  }

  /* Áreas de Toque Nativas de 48x48px sin Delay de 300ms en Safari */
  .touch-target {
    min-width: 48px;
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    cursor: pointer;
    user-select: none;
    transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.14s ease;
  }

  .touch-target:active {
    transform: scale(0.94);
  }

  .font-display {
    font-family: 'Outfit', sans-serif;
    letter-spacing: -0.02em;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  /* Giro Exclusivo en Eje Vertical (rotateY) para Raquetas 3D (Nunca boca abajo) */
  @keyframes racketRotateY {
    0% { transform: perspective(800px) rotateY(0deg) translateY(0px); }
    50% { transform: perspective(800px) rotateY(180deg) translateY(-4px); }
    100% { transform: perspective(800px) rotateY(360deg) translateY(0px); }
  }

  .racket-3d-spin {
    animation: racketRotateY 7s linear infinite;
    transform-style: preserve-3d;
  }

  /* Rotación 360 + Flotación para Pelotas 3D */
  @keyframes ballSpinFloat {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-5px) rotate(180deg); }
    100% { transform: translateY(0px) rotate(360deg); }
  }

  .ball-3d-anim {
    animation: ballSpinFloat 5.5s ease-in-out infinite;
  }

  /* Animaciones Físicas de Cambio de Puestos en el Ranking */
  @keyframes rankUpEpic {
    0% {
      transform: translateY(42px) scale(0.96);
      box-shadow: 0 0 0 rgba(214, 255, 0, 0);
      background: rgba(214, 255, 0, 0.28);
    }
    55% {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 14px 36px rgba(214, 255, 0, 0.38);
    }
    100% {
      transform: translateY(0) scale(1);
      box-shadow: 0 4px 18px rgba(214, 255, 0, 0.14);
    }
  }

  @keyframes rankUpSoft {
    0% { transform: translateY(24px); background: rgba(16, 185, 129, 0.24); }
    100% { transform: translateY(0); }
  }

  @keyframes rankDownSoft {
    0% { transform: translateY(-24px); background: rgba(239, 68, 68, 0.24); }
    100% { transform: translateY(0); }
  }

  .anim-rank-epic {
    animation: rankUpEpic 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    border: 2px solid #D6FF00 !important;
  }

  .anim-rank-up {
    animation: rankUpSoft 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    border-left: 4px solid #10B981 !important;
  }

  .anim-rank-down {
    animation: rankDownSoft 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    border-left: 4px solid #EF4444 !important;
  }

  /* Foco Neón para el Tutorial Estilo Videojuego */
  @keyframes voltSpotlightPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(214, 255, 0, 0.75), 0 0 24px rgba(214, 255, 0, 0.45);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(214, 255, 0, 0), 0 0 34px rgba(214, 255, 0, 0.85);
    }
  }

  .tutorial-spotlight {
    animation: voltSpotlightPulse 1.75s infinite;
    border: 2px solid #D6FF00 !important;
    position: relative;
    z-index: 80;
  }

  /* Badge Sede Oficial con Pulso Comercial */
  @keyframes goldPulse {
    0%, 100% { box-shadow: 0 0 12px rgba(214, 255, 0, 0.35); }
    50% { box-shadow: 0 0 22px rgba(234, 179, 8, 0.65); }
  }

  .sede-oficial-badge {
    animation: goldPulse 2.4s infinite;
  }

  /* Ocultar scrollbars manteniendo funcionalidad */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ============================================================================
// 2. COMPONENTE BLINDADO <SafeImage /> (CERO ICONO ROTO [?] EN SAFARI)
// ============================================================================
export const SafeImage = ({
  src,
  alt = "",
  className = "",
  fallbackText = "MP",
  style = {},
  circular = false,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = useMemo(() => {
    const clean = (fallbackText || alt || "MP").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  }, [fallbackText, alt]);

  if (!src || hasError) {
    return (
      <div
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1A2438 0%, #0E1525 100%)",
          color: "#D6FF00",
          fontWeight: 800,
          fontSize: "0.82rem",
          border: "1px solid rgba(214, 255, 0, 0.28)",
          borderRadius: circular ? "9999px" : "12px",
          userSelect: "none",
          overflow: "hidden",
          flexShrink: 0,
          ...style,
        }}
        role="img"
        aria-label={alt || fallbackText}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        objectFit: "cover",
        objectPosition: "center",
        borderRadius: circular ? "9999px" : undefined,
        ...style,
      }}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

// ============================================================================
// 3. INVENTARIO COMPLETO DE LOS 42 ARCHIVOS SUBIDOS A GITHUB (public/assets/)
// ============================================================================
export const ASSETS = {
  // Identidad y Barra Inferior (6 PNGs)
  logo: "/assets/logo-matchpoint.png",
  navPerfil: "/assets/nav-perfil.png",
  navRanking: "/assets/nav-ranking.png",
  navRetos: "/assets/nav-retos.png",
  navSedes: "/assets/nav-sedes.png",
  navTorneos: "/assets/nav-torneos.png",

  // Escudos Oficiales de los 4 Clubes de Huancayo (4 PNGs)
  clubCountry: "/assets/club-country-huancas.png",
  clubTauro: "/assets/club-tauro.png",
  clubCutipa: "/assets/club-romina-cutipa.png",
  clubInkas: "/assets/club-los-inkas.png",

  // Modelos 3D con Física CSS (4 PNGs)
  pelotaVoltAzul: "/assets/pelota-3d-volt-azul.png",
  pelotaClasica: "/assets/pelota-3d-clasica.png",
  raquetaProDark: "/assets/raqueta-3d-pro.png",
  raquetaOscuraLight: "/assets/raqueta-3d-oscura.png",

  // Clima Interactivo de Canchas (4 PNGs — con nombre exacto canva-clima-lluvia.png)
  climaSeco: "/assets/canva-clima-seco.png",
  climaHumedad: "/assets/canva-clima-humedad.png",
  climaLlovizna: "/assets/canva-clima-llovizna.png",
  climaLluvia: "/assets/canva-clima-lluvia.png",

  // Beneficios VIP, Tienda, Coach, Favorito y Racha (5 PNGs)
  goldenTicket: "/assets/canva-golden-ticket.png",
  proshopRollo: "/assets/canva-proshop-rollo.png",
  escudoCoach: "/assets/canva-escudo-coach.png",
  fuegoRacha3d: "/assets/fuego-racha-3d.png",
  badgeFavorito: "/assets/badge-favorito.png",

  // Pool Visual Contextual (9 PNGs)
  cancha1: "/assets/cancha-1.png",
  poolFuegoClasico: "/assets/pool-fuego-clasico.png",
  poolRaquetaPelota: "/assets/pool-raqueta-pelota.png",
  poolTenistaAccion: "/assets/pool-tenista-accion.png",
  raquetasCruzadasBlancas: "/assets/raquetas-cruzadas-blancas.png",
  raquetasCruzadasNegras: "/assets/raquetas-cruzadas-negras.png",
  siluetaDerechaNegra: "/assets/silueta-derecha-negra.png",
  siluetaSaqueBlanca: "/assets/silueta-saque-blanca.png",
  siluetaSaqueNegra: "/assets/silueta-saque-negra.png",

  // GIFs de Celebración (2 GIFs)
  gifVictoriaReto: "/assets/gif-celebracion-1.gif",
  gifAscensoCampeon: "/assets/gif-celebracion-2.gif",

  // Videos MP4 Bajo Demanda (4 Verticales 720x900 + 4 Horizontales 1280x720)
  videoCoachRodrigo: "/assets/video-coach-rodrigo.mp4",
  videoCoachRomina: "/assets/video-coach-romina.mp4",
  videoCoachDemo3: "/assets/video-coach-demo-3.mp4",
  videoCoachDemo4: "/assets/video-coach-demo-4.mp4",
  videoCircuitoH1: "/assets/video-circuito-horizontal.mp4",
  videoCoachH2: "/assets/video-coach-horizontal-2.mp4",
  videoCircuitoH3: "/assets/video-horizontal-3.mp4",
  videoCircuitoH4: "/assets/video-horizontal-4.mp4",
};

// Selector Inteligente del Pool Visual sin Repetición Consecutiva
const VISUAL_POOL_SEQUENCE = [
  ASSETS.cancha1,
  ASSETS.poolTenistaAccion,
  ASSETS.poolRaquetaPelota,
  ASSETS.poolFuegoClasico,
  ASSETS.siluetaSaqueBlanca,
];

export function getContextualPoolAsset(index = 0, isLightMode = false) {
  if (isLightMode && index % 4 === 3) return ASSETS.siluetaDerechaNegra;
  return VISUAL_POOL_SEQUENCE[Math.abs(index) % VISUAL_POOL_SEQUENCE.length];
}

// ============================================================================
// 4. SEDES OFICIALES DE HUANCAYO Y MATRIZ DEL SEMÁFORO CLIMÁTICO
// ============================================================================
export const SURFACE_WEATHER_STATES = [
  {
    id: "seco",
    label: "Cancha Seca · Óptima",
    indicator: "Pique perfecto. Rodamiento rápido y tracción total.",
    icon: ASSETS.climaSeco,
    color: "#D6FF00",
    lightColor: "#059669",
    bg: "rgba(214, 255, 0, 0.14)",
  },
  {
    id: "humedad",
    label: "Humedad Leve · Jugable",
    indicator: "Cancha blanda. Ideal para efecto topspin pesado.",
    icon: ASSETS.climaHumedad,
    color: "#00A3FF",
    lightColor: "#0052CC",
    bg: "rgba(0, 163, 255, 0.14)",
  },
  {
    id: "llovizna",
    label: "Llovizna · Precaución",
    indicator: "Líneas resbalosas. Se recomienda calzado de espiga.",
    icon: ASSETS.climaLlovizna,
    color: "#F59E0B",
    lightColor: "#D97706",
    bg: "rgba(245, 158, 11, 0.16)",
  },
  {
    id: "lluvia",
    label: "Lluvia · Injugable",
    indicator: "Superficie pesada / Encharcamiento. Partidos en pausa.",
    icon: ASSETS.climaLluvia,
    color: "#EF4444",
    lightColor: "#DC2626",
    bg: "rgba(239, 68, 68, 0.16)",
  },
];

export const HUANCAYO_CLUBS = [
  {
    id: "country",
    name: "Country Club Los Huancas",
    shortName: "Country Club",
    zone: "San Carlos, Huancayo",
    surface: "Arcilla Reglamentaria (4 Canchas)",
    courtsCount: 4,
    activePlayers: 60,
    shield: ASSETS.clubCountry,
    bannerImage: ASSETS.cancha1,
    color: "#D6FF00",
    vipDiscount: "TICKET VIP: 15% DCTO EN CANCHA (L-V Horario Valle)",
    realServices: [
      "Iluminación artificial LED nocturna",
      "Mantenimiento diario de polvo de ladrillo",
      "Zona de hidratación y cafetería social",
      "Venta de tubos de pelotas nuevas en recepción",
    ],
    surfaceStateId: "seco",
    lastReportBy: "Mateo Samaniego",
    lastReportTime: "Hace 18 min",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Country+Club+Los+Huancas+Huancayo",
    wazeUrl: "https://waze.com/ul?q=Country%20Club%20Los%20Huancas%20Huancayo",
  },
  {
    id: "cutipa",
    name: "Academia Romina Cutipa",
    shortName: "Romina Cutipa",
    zone: "El Tambo, Huancayo",
    surface: "Arcilla (3 Canchas · 1 Semi-Techada)",
    courtsCount: 3,
    activePlayers: 30,
    shield: ASSETS.clubCutipa,
    bannerImage: ASSETS.poolTenistaAccion,
    color: "#00A3FF",
    vipDiscount: "TICKET VIP: 20% DCTO EN ALQUILER DE CANCHA Y CLÍNICAS",
    realServices: [
      "Iluminación nocturna de alto contraste",
      "Servicio de encordado electrónico en sede",
      "Alquiler de raquetas y canastos de entrenamiento",
      "Venta de bebidas isotónicas y overgrips",
    ],
    surfaceStateId: "seco",
    lastReportBy: "Kenji Takahashi",
    lastReportTime: "Hace 32 min",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Academia+Tenis+Romina+Cutipa+Huancayo",
    wazeUrl: "https://waze.com/ul?q=Tenis%20Huancayo%20El%20Tambo",
  },
  {
    id: "tauro",
    name: "Club Tauro Tenis",
    shortName: "Club Tauro",
    zone: "Huancayo Centro / Pilcomayo",
    surface: "Arcilla Compactada (2 Canchas)",
    courtsCount: 2,
    activePlayers: 20,
    shield: ASSETS.clubTauro,
    bannerImage: ASSETS.poolRaquetaPelota,
    color: "#F59E0B",
    vipDiscount: "TICKET VIP: 15% DCTO EN TURNOS MAÑANA Y TARDE",
    realServices: [
      "Reflectores nocturnos para duelos post-trabajo",
      "Pasabolas disponibles previa coordinación",
      "Estacionamiento privado para jugadores del circuito",
      "hidratación y vestuarios completos",
    ],
    surfaceStateId: "humedad",
    lastReportBy: "Alejandro Tovar",
    lastReportTime: "Hace 45 min",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Club+Tauro+Tenis+Huancayo",
    wazeUrl: "https://waze.com/ul?q=Club%20Tauro%20Tenis%20Huancayo",
  },
  {
    id: "inkas",
    name: "Club Los Inkas / Xian",
    shortName: "Club Los Inkas",
    zone: "Chilca / Huancayo",
    surface: "Arcilla Abierta (2 Canchas)",
    courtsCount: 2,
    activePlayers: 20,
    shield: ASSETS.clubInkas,
    bannerImage: ASSETS.cancha1,
    color: "#10B981",
    vipDiscount: "TICKET VIP: S/ 10 DCTO EN RETO OFICIAL DE RANKING",
    realServices: [
      "Mantenimiento de flejes y red antes de cada turno",
      "Iluminación nocturna disponible",
      "Zona de descanso con vista a ambas canchas",
      "Venta de bebidas y accesorios básicos",
    ],
    surfaceStateId: "seco",
    lastReportBy: "Sebastián Rojas",
    lastReportTime: "Hace 1 h",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tenis+Los+Inkas+Huancayo",
    wazeUrl: "https://waze.com/ul?q=Tenis%20Los%20Inkas%20Huancayo",
  },
];

// Helper rápido para obtener los datos y el escudo de un club (o null si es Modo Individual)
export function getClubById(clubId) {
  if (!clubId || clubId === "individual") return null;
  return HUANCAYO_CLUBS.find((c) => c.id === clubId) || null;
}

// ============================================================================
// 5. ESCALA OFICIAL 0–5,000+ PUNTOS (1,000 PTS POR CATEGORÍA + PISOS EXACTOS)
// ============================================================================
export const CATEGORIES_5K = [
  {
    id: "5P",
    name: "5ª Principiante",
    short: "5ª P",
    min: 0,
    max: 999,
    floor: 100,
    seedFloor: 100,
    color: "#94A3B8",
    bg: "rgba(148, 163, 184, 0.16)",
  },
  {
    id: "5B",
    name: "5ª Básica",
    short: "5ª B",
    min: 1000,
    max: 1999,
    floor: 1000,
    seedFloor: 1000,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.16)",
  },
  {
    id: "5A",
    name: "5ª Avanzada",
    short: "5ª A",
    min: 2000,
    max: 2999,
    floor: 2000,
    seedFloor: 2000,
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.16)",
  },
  {
    id: "4TA",
    name: "4ª Categoría",
    short: "4ª Cat",
    min: 3000,
    max: 3999,
    floor: 3000,
    seedFloor: 3000,
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.18)",
  },
  {
    id: "3RA",
    name: "3ª Categoría",
    short: "3ª Cat",
    min: 4000,
    max: 4999,
    floor: 4000,
    seedFloor: 3800, // Candado Anti-Ego: Nadie entra a 4,000+ solo con encuesta
    color: "#D6FF00",
    bg: "rgba(214, 255, 0, 0.18)",
  },
  {
    id: "2DA",
    name: "2ª Categoría / Libre",
    short: "2ª Libre",
    min: 5000,
    max: 99999,
    floor: 5000,
    seedFloor: 4200,
    color: "#EC4899",
    bg: "rgba(236, 72, 153, 0.18)",
  },
];

export function getCategoryByElo(elo, categoryActivePlayersCount = 35) {
  const safeElo = Math.max(0, Math.round(Number(elo) || 0));
  const cat =
    CATEGORIES_5K.find((c) => safeElo >= c.min && safeElo <= c.max) ||
    CATEGORIES_5K[CATEGORIES_5K.length - 1];

  // Sub-escalón automático si la categoría supera los 50 jugadores activos
  let subDivision = null;
  if (categoryActivePlayersCount > 50 && cat.id !== "2DA") {
    const offset = safeElo - cat.min;
    if (offset < 333) subDivision = `${cat.short} Baja`;
    else if (offset < 666) subDivision = `${cat.short} Media`;
    else subDivision = `${cat.short} Alta`;
  }

  const nextIdx = CATEGORIES_5K.findIndex((c) => c.id === cat.id) + 1;
  const nextCat = nextIdx < CATEGORIES_5K.length ? CATEGORIES_5K[nextIdx] : null;
  const pointsInCurrentBand = Math.min(1000, Math.max(0, safeElo - cat.min));
  const pointsToNext = nextCat ? Math.max(0, nextCat.min - safeElo) : 0;
  const levelProgressPct =
    cat.id === "2DA" ? 100 : Math.min(100, Math.round((pointsInCurrentBand / 1000) * 100));

  return {
    ...cat,
    subDivision,
    nextCat,
    pointsInCurrentBand,
    pointsToNext,
    levelProgressPct,
    inPromotionZone: nextCat ? pointsToNext > 0 && pointsToNext <= 250 : false,
  };
}
// === FIN DEL BLOQUE 1 DE 6 ===

// === INICIO DEL BLOQUE 2 DE 6 ===

// ============================================================================
// 6. MOTOR ELO DE PROBABILIDADES FINITAS DE RESULTADO + VALIDADOR ITF/ATP
// ============================================================================
const LOGISTIC_DIVISOR = 2200; // 1,000 pts de ventaja = 74.0% (7.4 de 10 victorias reales)

// Auto-regulación demográfica de la constante K cuando el circuito supera 150 jugadores
export function getDynamicK(totalActivePlayers = 130, playerMatchesPlayed = 5) {
  if (Number(playerMatchesPlayed) < 5) {
    return 480; // K de Calibración (Partidos 1 al 5) en escala 5,000
  }
  const baseK = 300; // K Consolidada en escala 5,000
  if (totalActivePlayers <= 150) return baseK;
  return Math.round(baseK * Math.sqrt(150 / totalActivePlayers));
}

// Probabilidad esperada del Jugador A frente al Jugador B
export function getExpectedProbability(eloA, eloB) {
  return 1 / (1 + Math.pow(10, (Number(eloB) - Number(eloA)) / LOGISTIC_DIVISOR));
}

// Amortiguador Semanal Flexible de Revanchas (Sin bloqueo de 15 días)
export function getWeeklyRematchMultiplier(weeklyMatchesBetweenPair = 0) {
  if (weeklyMatchesBetweenPair <= 0) return { factor: 1.0, label: "100% Puntos (1er duelo semanal)" };
  if (weeklyMatchesBetweenPair === 1) return { factor: 0.75, label: "75% Puntos (2do duelo semanal)" };
  return { factor: 0.5, label: "50% Puntos (3er+ duelo semanal)" };
}

// Calcula los Techos Extremos ANTES del partido (Pronóstico Transparente Pre-Partido)
export function getPreMatchThresholds(
  playerA,
  playerB,
  totalActivePlayers = 130,
  weeklyMatchesBetweenPair = 0
) {
  const expA = getExpectedProbability(playerA.elo, playerB.elo);
  const kA = getDynamicK(totalActivePlayers, playerA.matchesPlayed);
  const rematch = getWeeklyRematchMultiplier(weeklyMatchesBetweenPair);
  const streakMultiplier = (Number(playerA.streak) || 0) >= 3 ? 1.25 : 1.0;

  // Techos independientes al 100% (Ganar 6-0, 6-0 vs Perder 0-6, 0-6)
  const rawMaxWin = kA * (1 - expA) * rematch.factor * streakMultiplier;
  const rawMaxLoss = kA * expA * rematch.factor;

  const maxWin = Math.max(20, Math.round(rawMaxWin));
  const maxLoss = -Math.max(18, Math.round(rawMaxLoss));

  // Mínimos (Partido al límite en 3 sets con Super Tie-Break dif. 2 puntos)
  const minWin = Math.max(14, Math.round(maxWin * 0.70));
  const minLoss = -Math.max(10, Math.round(Math.abs(maxLoss) * 0.38));

  // Partido típico en 2 sets normales (6-3, 6-2 o 6-4, 6-3)
  const typicalWin = Math.round(maxWin * 0.86);
  const typicalLoss = -Math.round(Math.abs(maxLoss) * 0.78);

  return {
    probability: Math.round(expA * 100),
    kUsed: kA,
    rematchFactor: rematch.factor,
    rematchLabel: rematch.label,
    streakMultiplier,
    maxWin,
    minWin,
    typicalWin,
    maxLoss,
    minLoss,
    typicalLoss,
  };
}

// JAULA 1 Y 2: Peso individual de 1 Set (0.250 a 0.500 del partido en 2 sets)
export function getSingleSetDominanceRatio(winnerGames, loserGames, tbDiff = 2) {
  const w = Number(winnerGames);
  const l = Number(loserGames);

  if (w === 6 && l === 0) return 0.500; // Dif 6 games (Set perfecto)
  if (w === 6 && l === 1) return 0.460; // Dif 5 games
  if (w === 6 && l === 2) return 0.420; // Dif 4 games
  if (w === 6 && l === 3) return 0.380; // Dif 3 games
  if (w === 6 && l === 4) return 0.340; // Dif 2 games
  if (w === 7 && l === 5) return 0.310; // Dif 2 games en alargue (7-5)

  // JAULA 2: Set en Tie-Break (7-6) -> 6 diferencias posibles (2 a 7 puntos)
  if (w === 7 && l === 6) {
    const clampedDiff = Math.min(7, Math.max(2, Math.abs(Number(tbDiff) || 2)));
    return Number((0.250 + (clampedDiff - 2) * 0.009).toFixed(3));
  }
  return 0.360;
}

// Validador Oficial de Reglamento ITF / ATP para cada Set y Partido Completo
export function validateOfficialItfScore(sets) {
  if (!Array.isArray(sets) || sets.length < 2) {
    return { valid: false, error: "Debes ingresar al menos 2 sets reglamentarios." };
  }

  let setsA = 0;
  let setsB = 0;

  for (let i = 0; i < 2; i++) {
    const s = sets[i];
    const a = Number(s.a);
    const b = Number(s.b);
    const high = Math.max(a, b);
    const low = Math.min(a, b);

    // Prohibido 8-6, 9-7, etc. en sets regulares
    const isRegularSix = high === 6 && low >= 0 && low <= 4;
    const isSevenFive = high === 7 && low === 5;
    const isTieBreakSet = high === 7 && low === 6;

    if (!isRegularSix && !isSevenFive && !isTieBreakSet) {
      return {
        valid: false,
        error: `Set ${i + 1} inválido (${a}-${b}). En tenis oficial un set se gana 6-0 a 6-4, 7-5 o 7-6 en Tie-Break.`,
      };
    }

    if (isTieBreakSet) {
      const tbA = Number(s.tbA ?? (a > b ? 7 : 5));
      const tbB = Number(s.tbB ?? (b > a ? 7 : 5));
      const tbHigh = Math.max(tbA, tbB);
      const tbLow = Math.min(tbA, tbB);
      if (tbHigh < 7 || tbHigh - tbLow < 2 || (tbHigh > 7 && tbHigh - tbLow !== 2)) {
        return {
          valid: false,
          error: `Tie-Break del Set ${i + 1} inválido (${tbA}-${tbB}). Debe ganarse a mínimo 7 puntos con diferencia de 2 (ej. 7-5, 8-6, 12-10).`,
        };
      }
    }

    if (a > b) setsA++;
    else setsB++;
  }

  // Si empatan 1-1 en sets, validamos el 3er Set (Match Tie-Break a 10 pts sin techo con dif. de 2)
  if (setsA === 1 && setsB === 1) {
    const s3 = sets[2];
    if (!s3) {
      return {
        valid: false,
        error: "Empate 1-1 en sets: ingresa el Match Tie-Break a 10 puntos del 3er set.",
      };
    }
    const a3 = Number(s3.a);
    const b3 = Number(s3.b);
    const high3 = Math.max(a3, b3);
    const low3 = Math.min(a3, b3);

    if (high3 < 10 || high3 - low3 < 2 || (high3 > 10 && high3 - low3 !== 2)) {
      return {
        valid: false,
        error: `Super Tie-Break inválido ([${a3}-${b3}]). Se gana a mínimo 10 puntos con diferencia obligatoria de 2 (ej. 10-8, 12-10, 15-13).`,
      };
    }
  }

  return { valid: true, error: null };
}

// MOTOR CENTRAL: Calcula el cambio exacto de Puntos ELO para Ganador y Perdedor
export function calculateFiniteMatchElo({
  playerA,
  playerB,
  sets,
  totalActivePlayers = 130,
  weeklyMatchesBetweenPair = 0,
}) {
  let setsWonA = 0;
  let setsWonB = 0;
  let gamesWonA = 0;
  let gamesWonB = 0;

  sets.slice(0, 2).forEach((s) => {
    const ga = Number(s.a);
    const gb = Number(s.b);
    gamesWonA += ga;
    gamesWonB += gb;
    if (ga > gb) setsWonA += 1;
    else if (gb > ga) setsWonB += 1;
  });

  const wentToThreeSets = setsWonA === 1 && setsWonB === 1 && sets.length >= 3;
  if (wentToThreeSets) {
    const s3 = sets[2];
    if (Number(s3.a) > Number(s3.b)) setsWonA += 1;
    else setsWonB += 1;
  }

  const aIsWinner = setsWonA > setsWonB;
  const winner = aIsWinner ? playerA : playerB;
  const loser = aIsWinner ? playerB : playerA;

  const winnerThresholds = getPreMatchThresholds(
    winner,
    loser,
    totalActivePlayers,
    weeklyMatchesBetweenPair
  );
  const loserThresholds = getPreMatchThresholds(
    loser,
    winner,
    totalActivePlayers,
    weeklyMatchesBetweenPair
  );

  let rawDominance = 0.76;
  let winMultiplier = 0.86; // Ganador cobra siempre entre 70% y 100% de su Techo
  let lossMultiplier = 0.78; // Perdedor resta entre 38% y 100% de su Techo
  let formattedScore = "";

  if (!wentToThreeSets) {
    const s1 = sets[0];
    const s2 = sets[1];
    const w1 = aIsWinner ? Number(s1.a) : Number(s1.b);
    const l1 = aIsWinner ? Number(s1.b) : Number(s1.a);
    const w2 = aIsWinner ? Number(s2.a) : Number(s2.b);
    const l2 = aIsWinner ? Number(s2.b) : Number(s2.a);

    const tbDiff1 =
      w1 === 7 && l1 === 6
        ? Math.abs(Number(s1.tbA || 7) - Number(s1.tbB || 5))
        : 2;
    const tbDiff2 =
      w2 === 7 && l2 === 6
        ? Math.abs(Number(s2.tbA || 7) - Number(s2.tbB || 5))
        : 2;

    const r1 = getSingleSetDominanceRatio(w1, l1, tbDiff1);
    const r2 = getSingleSetDominanceRatio(w2, l2, tbDiff2);
    rawDominance = Number((r1 + r2).toFixed(3)); // De 0.500 a 1.000

    // Ganador en 2 sets: cobra del 76% (7-6, 7-6) al 100% (6-0, 6-0)
    winMultiplier = Number((0.76 + ((rawDominance - 0.5) / 0.5) * 0.24).toFixed(3));
    // Perdedor en 2 sets: resta del 56% (doble TB) al 100% (0-6, 0-6)
    lossMultiplier = Number((0.56 + ((rawDominance - 0.5) / 0.5) * 0.44).toFixed(3));

    const labelS1 =
      w1 === 7 && l1 === 6
        ? `7-6(${Math.min(Number(s1.tbA || 7), Number(s1.tbB || 5))})`
        : `${w1}-${l1}`;
    const labelS2 =
      w2 === 7 && l2 === 6
        ? `7-6(${Math.min(Number(s2.tbA || 7), Number(s2.tbB || 5))})`
        : `${w2}-${l2}`;
    formattedScore = `${labelS1}, ${labelS2}`;
  } else {
    // JAULA 3: 3er Set Match Tie-Break a 10 pts -> 9 diferencias finitas (2 a 10 pts)
    const s3 = sets[2];
    const w3 = aIsWinner ? Number(s3.a) : Number(s3.b);
    const l3 = aIsWinner ? Number(s3.b) : Number(s3.a);
    const superTbDiff = Math.min(10, Math.max(2, Math.abs(w3 - l3) || 2));

    rawDominance = Number((0.32 + ((superTbDiff - 2) / 8) * 0.14).toFixed(3));

    const winnerGames2 = aIsWinner ? gamesWonA : gamesWonB;
    const loserGames2 = aIsWinner ? gamesWonB : gamesWonA;
    const gameBonus = Math.max(-0.02, Math.min(0.02, (winnerGames2 - loserGames2) * 0.005));

    // Ganador en 3 sets cobra entre 70% y 75% de su techo
    winMultiplier = Number(
      Math.min(0.75, Math.max(0.70, 0.70 + ((superTbDiff - 2) / 8) * 0.05 + gameBonus)).toFixed(3)
    );
    // Perdedor en 3 sets recibe gran descuento por ganar 1 set: solo resta entre 38% y 50%
    lossMultiplier = Number(
      Math.min(0.50, Math.max(0.38, 0.38 + ((superTbDiff - 2) / 8) * 0.10 + gameBonus)).toFixed(3)
    );

    const s1 = sets[0];
    const s2 = sets[1];
    formattedScore = `${aIsWinner ? s1.a : s1.b}-${aIsWinner ? s1.b : s1.a}, ${
      aIsWinner ? s2.a : s2.b
    }-${aIsWinner ? s2.b : s2.a}, [${w3}-${l3}]`;
  }

  // Castigo severo "Detector de Humo" si alguien en Calibración (<5 partidos) pierde 0-6, 0-6 o 0-6, 1-6
  let severeCalibrationPenalty = false;
  const totalLoserGames = aIsWinner ? gamesWonB : gamesWonA;
  if (!wentToThreeSets && Number(loser.matchesPlayed) < 5 && totalLoserGames <= 1) {
    lossMultiplier = 1.25;
    severeCalibrationPenalty = true;
  }

  const winnerDelta = Math.max(12, Math.round(winnerThresholds.maxWin * winMultiplier));
  const loserDelta = -Math.max(10, Math.round(Math.abs(loserThresholds.maxLoss) * lossMultiplier));

  return {
    winnerId: winner.id,
    loserId: loser.id,
    winnerName: winner.name,
    loserName: loser.name,
    winnerDelta,
    loserDelta,
    winPercentageApplied: Math.round(winMultiplier * 100),
    lossPercentageApplied: Math.round(lossMultiplier * 100),
    winnerMaxPossible: winnerThresholds.maxWin,
    loserMaxPossible: loserThresholds.maxLoss,
    rematchLabel: winnerThresholds.rematchLabel,
    severeCalibrationPenalty,
    wentToThreeSets,
    formattedScore,
  };
}

// Regla de Fin de Temporada Estilo Clash Royale (Bajada estricta al Piso de mil inferior)
export function applySeasonFloorReset(elo) {
  const safeElo = Math.max(0, Math.round(Number(elo) || 0));
  if (safeElo < 1000) return 100; // Piso de 5ª P
  return Math.floor(safeElo / 1000) * 1000; // Ej: 3,490 -> 3,000 | 2,990 -> 2,000
}

// Resumen Oficial de Políticas ELO para el Menú Institucional y Modal de Reglas
export const ELO_POLICIES_SUMMARY = [
  {
    badge: "01 · ESCALA 5,000",
    title: "Categorías cada 1,000 Puntos Exactos",
    desc: "5ª P (0–999) · 5ª B (1,000–1,999) · 5ª A (2,000–2,999) · 4ª Cat (3,000–3,999) · 3ª Cat (4,000–4,999) · 2ª Libre (5,000+). Una categoría de ventaja equivale al 74% de probabilidad real.",
  },
  {
    badge: "02 · JAULAS FINITAS",
    title: "Cada Game y cada Tie-Break Cuenta",
    desc: "Antes de jugar ves tu ganancia máxima (6-0, 6-0) y tu pérdida máxima (0-6, 0-6). El ganador cobra del 70% al 100% de su techo según los games; el perdedor que lucha y saca un set reduce su pérdida hasta en un 62%.",
  },
  {
    badge: "03 · CALIBRACIÓN 5/5",
    title: "Arranque en el Piso Exacto y Candado Anti-Ego",
    desc: "El cuestionario ubica a cada tenista en el piso de su categoría (100, 1,000, 2,000 o 3,000 pts) con tope máximo en 3,800 pts. Para pisar 3ª (4,000+) hay que ganarlo en cancha. Perder 6-0, 6-0 en calibración aplica descenso acelerado (1.25x).",
  },
  {
    badge: "04 · REVANCHAS Y TOP 8",
    title: "Libertad Semanal y Cierre de Temporada",
    desc: "Puedes jugar con el mismo rival sin bloqueos (1er duelo semanal = 100%, 2do = 75%, 3ro+ = 50%). Al cierre de temporada, el Top 8 de cada categoría juega el Master Final y todos bajan al piso exacto de su bloque de mil.",
  },
];

// ============================================================================
// 7. CUESTIONARIO TÉCNICO PASO A PASO (5 PANTALLAS — EFECTOS Y CANCHA)
// ============================================================================
export const CALIBRATION_QUESTIONS = [
  {
    step: 1,
    title: "Dominio de Efectos en tus Golpes",
    subtitle: "¿Qué efectos utilizas con control real durante un peloteo de partido?",
    badge: "Efectos: Plano · Topspin · Slice",
    options: [
      {
        letter: "A",
        label: "Solo paso la pelota suave",
        detail: "Busco que la bola pase la red sin usar efectos todavía.",
        points: 100,
      },
      {
        letter: "B",
        label: "Golpe Plano básico",
        detail: "Pego plano cuando me queda cómoda, sin controlar topspin ni slice.",
        points: 1000,
      },
      {
        letter: "C",
        label: "Plano + Topspin de derecha y Slice defensivo",
        detail: "Uso topspin en mi derecha y slice de revés para defenderme.",
        points: 2000,
      },
      {
        letter: "D",
        label: "Topspin en ambos lados + Slice profundo + Drop Shot",
        detail: "Cambio alturas con topspin, corto con slice profundo y tiro dejadas.",
        points: 3000,
      },
      {
        letter: "E",
        label: "Dominio total de efectos a alta velocidad",
        detail: "Topspin pesado a las esquinas, slice agresivo, bote-pronto y contragolpe.",
        points: 3800,
      },
    ],
  },
  {
    step: 2,
    title: "Tu Primer y Segundo Saque",
    subtitle: "¿Qué recursos de servicio usas cuando sacas bajo presión (30-40 o Deuce)?",
    badge: "Servicio y Efectos de Saque",
    options: [
      {
        letter: "A",
        label: "Saque de iniciación",
        detail: "Me cuesta meter el saque por arriba o hago varias dobles faltas.",
        points: 100,
      },
      {
        letter: "B",
        label: "1er saque plano y 2do saque 'globito'",
        detail: "El segundo saque solo lo paso suave sin efecto para asegurar.",
        points: 1000,
      },
      {
        letter: "C",
        label: "1er saque firme y 2do saque controlado",
        detail: "Pocas dobles faltas en el set y buena dirección general.",
        points: 2000,
      },
      {
        letter: "D",
        label: "1er saque potente y 2do con Slice o Kick (Topspin)",
        detail: "Mi primer saque me da puntos gratis y mi segundo lleva buen efecto.",
        points: 3000,
      },
      {
        letter: "E",
        label: "Dominio de los 3 saques (Plano, Slice y Kick)",
        detail: "Abro ángulos a la T, al cuerpo y abierto tanto en 1er como en 2do saque.",
        points: 3800,
      },
    ],
  },
  {
    step: 3,
    title: "Ritmo y Consistencia de Peloteo",
    subtitle: "¿Cuántas bolas seguidas sostienes desde el fondo sin regalar el error?",
    badge: "Resistencia de Fondo",
    options: [
      {
        letter: "A",
        label: "De 1 a 3 pelotas seguidas",
        detail: "Recién estoy tomando distancia y tiempo al bote de la pelota.",
        points: 100,
      },
      {
        letter: "B",
        label: "De 4 a 7 pelotas a ritmo cómodo",
        detail: "Peloteo bien al centro, pero sufro cuando me mueven al revés.",
        points: 1000,
      },
      {
        letter: "C",
        label: "+10 pelotas seguidas a ritmo de 5ª Avanzada",
        detail: "Sostengo peloteos largos y recupero bolas desde las esquinas.",
        points: 2000,
      },
      {
        letter: "D",
        label: "Peloteo intenso moviendo al rival (Nivel 4ª)",
        detail: "Cambio de dirección (cruzado a paralela) y ataco bolas cortas.",
        points: 3000,
      },
      {
        letter: "E",
        label: "Ritmo pesado de 3ª Categoría / Torneo Abierto",
        detail: "Sostengo alta velocidad de bola sin ceder terreno en el fondo.",
        points: 3800,
      },
    ],
  },
  {
    step: 4,
    title: "Juego de Red y Cierre del Punto",
    subtitle: "¿Cómo resuelves cuando subes a la red o cuando el rival te ataca?",
    badge: "Volea · Smash · Passing Shot",
    options: [
      {
        letter: "A",
        label: "Me quedo siempre en el fondo",
        detail: "Todavía no subo a definir en la red durante los partidos.",
        points: 100,
      },
      {
        letter: "B",
        label: "Subo poco y aseguro bolas muy sencillas",
        detail: "Prefiero esperar el error del rival desde atrás.",
        points: 1000,
      },
      {
        letter: "C",
        label: "Defino voleas sencillas, smashes cortos y globos",
        detail: "Sé cuándo subir por una bola corta y cuándo tirar un globo defensivo.",
        points: 2000,
      },
      {
        letter: "D",
        label: "Volea firme, Smash seguro y Passing Shots",
        detail: "Armo el punto hacia el lado débil del rival para cerrar en la red.",
        points: 3000,
      },
      {
        letter: "E",
        label: "Repertorio táctico completo en toda la cancha",
        detail: "Saque y red, voleas bajas difíciles, contra-dejadas y lectura anticipada.",
        points: 3800,
      },
    ],
  },
  {
    step: 5,
    title: "Tu Referencia Real en las Canchas de Huancayo",
    subtitle: "Si hoy juegas un partido a 2 sets en tu club, ¿en qué grupo compites parejo?",
    badge: "Ubicación en Piso Exacto",
    options: [
      {
        letter: "A",
        label: "5ª Principiante (Piso Inicial: 100 pts)",
        detail: "Mis primeros partidos contando games y sets.",
        points: 100,
      },
      {
        letter: "B",
        label: "5ª Básica (Piso Inicial: 1,000 pts)",
        detail: "Juego sets amistosos y torneos de iniciación en 5ª B.",
        points: 1000,
      },
      {
        letter: "C",
        label: "5ª Avanzada (Piso Inicial: 2,000 pts)",
        detail: "Compito parejo en el bloque principal de 5ª A de mi club.",
        points: 2000,
      },
      {
        letter: "D",
        label: "4ª Categoría (Piso Inicial: 3,000 pts)",
        detail: "Compito de igual a igual contra jugadores consolidados de 4ª.",
        points: 3000,
      },
      {
        letter: "E",
        label: "Puerta a 3ª Categoría (Tope Encuesta: 3,800 pts)",
        detail: "Para entrar a 3ª (4,000+ pts) deberás ganarlo en cancha en tu calibración.",
        points: 3800,
      },
    ],
  },
];

export function calculateInitialSeedFromAnswers(pointsList = []) {
  if (!pointsList.length) return 1000;
  const avg = pointsList.reduce((acc, n) => acc + Number(n), 0) / pointsList.length;
  if (avg < 750) return 100; // Piso 5ª P
  if (avg < 1750) return 1000; // Piso exacto 5ª B
  if (avg < 2750) return 2000; // Piso exacto 5ª A
  if (avg < 3550) return 3000; // Piso exacto 4ª Categoría
  return 3800; // Candado Anti-Ego: Frontera 4ª Alta / Puerta a 3ª
}

// ============================================================================
// 8. POBLACIÓN INICIAL DE 10 PERFILES REALES DE HUANCAYO + SALÓN DE LA FAMA
// ============================================================================
export const INITIAL_PLAYERS_HUANCAYO = [
  {
    id: "p-mateo",
    name: "Mateo Samaniego",
    email: "mateo@matchpoint.pe",
    whatsapp: "964112233",
    whatsappPublic: true,
    age: 29,
    hand: "Diestro · Revés a 2 manos",
    preferredSchedule: "Tardes 17:00 - 20:00",
    clubId: "country",
    elo: 4360,
    matchesPlayed: 18,
    wins: 15,
    losses: 3,
    streak: 4,
    lastDelta: 88,
    rankChange: 0,
    active: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    style: "Agresivo de fondo · Topspin pesado",
    h2hWithCurrentUser: { userWins: 0, rivalWins: 1, lastScore: "3-6, 4-6" },
  },
  {
    id: "p-rodrigo",
    name: "Rodrigo Villavicencio",
    email: "rodrigo@matchpoint.pe",
    whatsapp: "964223344",
    whatsappPublic: true,
    age: 34,
    hand: "Diestro · Revés a 1 mano",
    preferredSchedule: "Noches 19:00 - 21:30",
    clubId: "country",
    elo: 4120,
    matchesPlayed: 14,
    wins: 10,
    losses: 4,
    streak: 2,
    lastDelta: 72,
    rankChange: 1,
    active: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    style: "Saque y red · Slice profundo",
    h2hWithCurrentUser: { userWins: 0, rivalWins: 0, lastScore: null },
  },
  {
    id: "p-alejandro",
    name: "Alejandro Tovar",
    email: "alejandro@matchpoint.pe",
    whatsapp: "964334455",
    whatsappPublic: true,
    age: 27,
    hand: "Zurdo · Topspin cruzado",
    preferredSchedule: "Sábados y Domingos Mañana",
    clubId: "tauro",
    elo: 3720,
    matchesPlayed: 16,
    wins: 11,
    losses: 5,
    streak: 1,
    lastDelta: 64,
    rankChange: 0,
    active: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    style: "Contraatacante · Zurdo de ángulos",
    h2hWithCurrentUser: { userWins: 1, rivalWins: 1, lastScore: "6-4, 5-7, [10-8]" },
  },
  {
    id: "p-jose",
    name: "José Clariana",
    email: "jose.clariana@matchpoint.pe",
    whatsapp: "964445566",
    whatsappPublic: true,
    age: 31,
    hand: "Diestro · Derecha invertida",
    preferredSchedule: "Martes y Jueves 18:30",
    clubId: "country",
    elo: 3360,
    matchesPlayed: 12,
    wins: 8,
    losses: 4,
    streak: 2,
    lastDelta: 108,
    rankChange: 1,
    active: true,
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    style: "Derecha invertida · Drop shot táctico",
    h2hWithCurrentUser: { userWins: 1, rivalWins: 0, lastScore: "6-4, 6-3" },
  },
  {
    id: "p-pablo",
    name: "Pablo (Tú)",
    email: "pablo@matchpoint.pe",
    whatsapp: "964556677",
    whatsappPublic: true,
    age: 26,
    hand: "Diestro · Topspin + Slice",
    preferredSchedule: "Lunes a Sábado Tardes",
    clubId: "country",
    elo: 3080,
    matchesPlayed: 9,
    wins: 6,
    losses: 3,
    streak: 3,
    lastDelta: 148,
    rankChange: 2,
    active: true,
    isCurrentUser: true,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    style: "Topspin + Slice · Jugador táctico de cancha completa",
    h2hWithCurrentUser: { userWins: 0, rivalWins: 0, lastScore: null },
  },
  {
    id: "p-kenji",
    name: "Kenji Takahashi",
    email: "kenji@matchpoint.pe",
    whatsapp: "964667788",
    whatsappPublic: true,
    age: 24,
    hand: "Diestro · Revés a 2 manos",
    preferredSchedule: "Tardes 16:00 - 19:00",
    clubId: "cutipa",
    elo: 2880,
    matchesPlayed: 11,
    wins: 7,
    losses: 4,
    streak: 1,
    lastDelta: 88,
    rankChange: 0,
    active: true,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    style: "Velocidad de piernas · Defensa sólida",
    h2hWithCurrentUser: { userWins: 2, rivalWins: 0, lastScore: "6-4, 4-6, [10-6]" },
  },
  {
    id: "p-hugo",
    name: "Hugo Paredes",
    email: "hugo@matchpoint.pe",
    whatsapp: "964778899",
    whatsappPublic: false,
    age: 33,
    hand: "Diestro · Clásico",
    preferredSchedule: "Fines de Semana 09:00",
    clubId: "tauro",
    elo: 2540,
    matchesPlayed: 10,
    wins: 5,
    losses: 5,
    streak: 0,
    lastDelta: -48,
    rankChange: -1,
    active: true,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    style: "Peloteador de arcilla · Globo y red",
    h2hWithCurrentUser: { userWins: 1, rivalWins: 1, lastScore: "6-7(5), 4-6" },
  },
  {
    id: "p-valeria",
    name: "Valeria Mendoza",
    email: "valeria@matchpoint.pe",
    whatsapp: "964889900",
    whatsappPublic: true,
    age: 25,
    hand: "Diestra · Revés plano",
    preferredSchedule: "Mañanas 08:00 - 11:00",
    clubId: "cutipa",
    elo: 2290,
    matchesPlayed: 4, // En Calibración [4/5]
    wins: 3,
    losses: 1,
    streak: 2,
    lastDelta: 176,
    rankChange: 1,
    active: true,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    style: "Consistencia de fondo · Anguladora",
    h2hWithCurrentUser: { userWins: 0, rivalWins: 0, lastScore: null },
  },
  {
    id: "p-george",
    name: "George Huamán",
    email: "george@matchpoint.pe",
    whatsapp: "964990011",
    whatsappPublic: true,
    age: 38,
    hand: "Diestro · Saque cortado",
    preferredSchedule: "Noches 20:00",
    clubId: "inkas",
    elo: 1640,
    matchesPlayed: 8,
    wins: 4,
    losses: 4,
    streak: 0,
    lastDelta: -62,
    rankChange: 0,
    active: true,
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
    style: "Saque seguro · Peloteo de control",
    h2hWithCurrentUser: { userWins: 1, rivalWins: 0, lastScore: "6-2, 6-3" },
  },
  {
    id: "p-fernando",
    name: "Fernando Salazar",
    email: "fernando@matchpoint.pe",
    whatsapp: "964101010",
    whatsappPublic: true,
    age: 22,
    hand: "Diestro · En formación",
    preferredSchedule: "Sábados Tarde",
    clubId: "individual", // Ejemplo en Modo Individual (Sin escudo de club)
    elo: 680,
    matchesPlayed: 2, // En Calibración [2/5]
    wins: 0,
    losses: 2,
    streak: 0, // Racha = 0 -> No muestra icono de fuego
    lastDelta: -94,
    rankChange: 0,
    active: true,
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    style: "Principiante activo · Mejorando servicio",
    h2hWithCurrentUser: { userWins: 0, rivalWins: 0, lastScore: null },
  },
];

// Campeones Vigentes del Salón de la Fama (Con Estadísticas Completas sin "11G - 1P")
export const HALL_OF_FAME_CHAMPIONS = [
  {
    id: "hof-3ra",
    categoryLabel: "CAMPEÓN 3ª CATEGORÍA · MASTER APERTURA",
    playerName: "Mateo Samaniego",
    clubId: "country",
    eloPeak: 4410,
    statsBadge: "15 VICTORIAS · 2 DERROTAS · 88% EFECTIVIDAD",
    finalScore: "Final: 6-3, 6-4 vs R. Villavicencio",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "hof-4ta",
    categoryLabel: "CAMPEÓN 4ª CATEGORÍA · MASTER APERTURA",
    playerName: "Alejandro Tovar",
    clubId: "tauro",
    eloPeak: 3840,
    statsBadge: "12 VICTORIAS · 2 DERROTAS · 86% EFECTIVIDAD",
    finalScore: "Final: 7-6(4), 6-3 vs J. Clariana",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "hof-5a",
    categoryLabel: "CAMPEÓN 5ª AVANZADA · MASTER APERTURA",
    playerName: "Kenji Takahashi",
    clubId: "cutipa",
    eloPeak: 2950,
    statsBadge: "11 VICTORIAS · 1 DERROTA · 92% EFECTIVIDAD",
    finalScore: "Final: 6-2, 6-4 vs H. Paredes",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
  },
];

// === FIN DEL BLOQUE 2 DE 6 ===

// === INICIO DEL BLOQUE 3 DE 6 ===

// ============================================================================
// 9. MARKETPLACE COACH PRO (RESEÑAS VERIFICADAS, PACKS Y VIDEOS BAJO DEMANDA)
// ============================================================================
export const INITIAL_COACHES_PRO = [
  {
    id: "coach-rodrigo",
    name: "Prof. Rodrigo Villavicencio",
    certification: "NIVEL COACH ITF · EX TOP NACIONAL",
    clubs: ["Country Club Los Huancas", "Club Tauro"],
    basePriceLabel: "DESDE S/ 50 / TURNO",
    studentsPromoted: 9,
    whatsapp: "964223344",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    actionPhoto: ASSETS.poolTenistaAccion,
    verticalVideo: ASSETS.videoCoachRodrigo,
    horizontalVideo: ASSETS.videoCoachH2,
    specialties: ["Biomecánica de Saque", "Táctica en Arcilla", "Adultos 40+"],
    packs: [
      {
        id: "pack-1",
        title: "Sesión Técnica Individual (1h)",
        detail: "Corrección biomecánica de golpe y video-análisis en cancha.",
        price: "S/ 50",
        promoBadge: null,
      },
      {
        id: "pack-4",
        title: "Pack 4 Clases · Subida de Categoría",
        detail: "Plan intensivo de saque, topspin profundo y cierre en la red.",
        price: "S/ 180",
        promoBadge: "AHORRAS S/ 20 · INCLUYE DIAGNÓSTICO ELO",
      },
      {
        id: "pack-clinic",
        title: "Clínica Grupal (3 a 4 Jugadores)",
        detail: "Entrenamiento dinámico de peloteo bajo presión y puntos reales.",
        price: "S/ 35 c/u",
        promoBadge: "ALTA DEMANDA",
      },
    ],
    availableSlots: [
      "Martes 16:00 · Country Club",
      "Jueves 17:00 · Country Club",
      "Sábado 09:00 · Club Tauro",
      "Sábado 11:00 · Country Club",
    ],
    reviews: [
      {
        id: "rev-1",
        authorId: "p-pablo",
        authorName: "Pablo",
        authorCategory: "Cat. 4ª",
        authorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
        rating: 5,
        comment: "Corrigió mi segundo saque con efecto kick en dos sesiones. Subí directo a 4ª categoría.",
        date: "Hace 4 días",
      },
      {
        id: "rev-2",
        authorId: "p-alejandro",
        authorName: "Alejandro Tovar",
        authorCategory: "Cat. 4ª Alta",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
        rating: 5,
        comment: "Excelente lectura táctica para abrir ángulos en cancha de arcilla.",
        date: "Hace 1 semana",
      },
    ],
  },
  {
    id: "coach-romina",
    name: "Prof. Romina Cutipa",
    certification: "DIRECTORA ACADEMIA · COACH FEDERACIÓN",
    clubs: ["Academia Romina Cutipa"],
    basePriceLabel: "DESDE S/ 45 / TURNO",
    studentsPromoted: 12,
    whatsapp: "964667788",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    actionPhoto: ASSETS.cancha1,
    verticalVideo: ASSETS.videoCoachRomina,
    horizontalVideo: ASSETS.videoCircuitoH1,
    specialties: ["Iniciación Adultos", "Clases Damas", "Consistencia de Fondo"],
    packs: [
      {
        id: "pack-r1",
        title: "Clase Individual Personalizada (1h)",
        detail: "Control de derecha, revés y desplazamientos sobre polvo de ladrillo.",
        price: "S/ 45",
        promoBadge: null,
      },
      {
        id: "pack-r4",
        title: "Pack 4 Sesiones · Base Competitiva",
        detail: "Ideal para pasar de 5ª Principiante a competir en 5ª Básica / Avanzada.",
        price: "S/ 160",
        promoBadge: "AHORRAS S/ 20 · INCLUYE DIAGNÓSTICO ELO",
      },
      {
        id: "pack-rclinic",
        title: "Clínica Damas & Mixto Fin de Semana",
        detail: "90 minutos de técnica, peloteo dirigido y tie-breaks.",
        price: "S/ 30 c/u",
        promoBadge: "CUPOS LIMITADOS",
      },
    ],
    availableSlots: [
      "Lunes 10:00 · Academia Cutipa",
      "Miércoles 18:00 · Academia Cutipa",
      "Viernes 17:00 · Academia Cutipa",
      "Domingo 10:00 · Academia Cutipa",
    ],
    reviews: [
      {
        id: "rev-3",
        authorId: "p-kenji",
        authorName: "Kenji Takahashi",
        authorCategory: "Cat. 5ª A",
        authorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
        rating: 5,
        comment: "Sus ejercicios de movilidad de piernas cambiaron por completo mi defensa en el fondo.",
        date: "Hace 3 días",
      },
    ],
  },
];

// ============================================================================
// 10. PARTIDOS EN VIVO (MODO ÁRBITRO), RETOS PENDIENTES Y CATÁLOGO PRO SHOP
// ============================================================================
export const INITIAL_CHALLENGES = [
  // 1. Reto entrante pendiente para Pablo (Activa el Pop-Up automático al iniciar sesión)
  {
    id: "ch-incoming-1",
    status: "pending", // pending | confirmed | live | completed
    challengerId: "p-jose",
    challengedId: "p-pablo",
    clubId: "country",
    customVenue: "",
    scheduledTime: "Mañana · 18:00 hrs",
    formatRule: "Deuce / Ventaja (Regla ATP)",
    createdAt: "Hace 12 min",
  },
  // 2. Partido en Vivo en la Cartelera Pública (Con Modo Árbitro Comunitario)
  {
    id: "ch-live-1",
    status: "live",
    challengerId: "p-mateo",
    challengedId: "p-alejandro",
    clubId: "country",
    customVenue: "Cancha Central #1 · Country Club",
    scheduledTime: "En juego ahora",
    formatRule: "Deuce / Ventaja · 3er Set Match TB [10 pts]",
    serverPlayerId: "p-mateo",
    liveUmpireName: "Rodrigo Villavicencio",
    liveUpdatedAgo: "Hace 1 min",
    currentSetIndex: 1, // 0 = Set 1 (cerrado), 1 = Set 2 (en juego), 2 = Super TB
    liveSets: [
      { a: 6, b: 4, locked: true, isTb: false, tbA: 0, tbB: 0 },
      { a: 5, b: 5, locked: false, isTb: false, tbA: 0, tbB: 0 },
      { a: 0, b: 0, locked: false, isSuperTb: true },
    ],
  },
  // 3. Duelo Confirmado de Pablo listo para cargar Marcador Oficial en "Tus Desafíos"
  {
    id: "ch-confirmed-pablo",
    status: "confirmed",
    challengerId: "p-pablo",
    challengedId: "p-kenji",
    clubId: "cutipa",
    customVenue: "",
    scheduledTime: "Hoy · 19:30 hrs",
    formatRule: "Punto de Oro (No-Ad) · 3er Set Match TB [10 pts]",
    createdAt: "Confirmado hoy",
  },
];

// Catálogo Limpio PRO SHOP (100% Identidad MATCHPOINT — Cero Marcas Ficticias)
export const PRO_SHOP_ITEMS = [
  {
    id: "shop-1",
    title: "Servicio de Encordado Electrónico de Precisión",
    category: "TALLER OFICIAL MATCHPOINT",
    publicPrice: "S/ 45",
    vipPrice: "S/ 32",
    badge: "PRECIO SOCIO VIP",
    image: ASSETS.proshopRollo,
    detail: "Tensión exacta en libras para arcilla de altura (Huancayo 3,259 m s. n. m.).",
  },
  {
    id: "shop-2",
    title: "Tubo Presurizado Pelotas Oficiales Clay Court (x3)",
    category: " EQUIPAMIENTO DE CANCHA",
    publicPrice: "S/ 38",
    vipPrice: "S/ 29",
    badge: "ALTA DURACIÓN EN ARCILLA",
    image: ASSETS.pelotaVoltAzul,
    detail: "Fieltro tejido de alta visibilidad para polvo de ladrillo y juego nocturno.",
  },
  {
    id: "shop-3",
    title: "Pack x3 Overgrips Pro Adherencia Seca",
    category: "ACCESORIOS PRO",
    publicPrice: "S/ 25",
    vipPrice: "S/ 18",
    badge: "ABSORCIÓN TOTAL",
    image: ASSETS.raquetaProDark,
    detail: "Máximo tacto y tracción antideslizante para partidos intensos a 3 sets.",
  },
];

// Torneos Oficiales por Categoría (Con Sorteo Transparente, Round Robin y Ronda Consuelo)
export const INITIAL_TOURNAMENTS = [
  {
    id: "tor-master-4ta",
    title: "Abierto Oficial de Huancayo · 4ª Categoría",
    categoryShort: "4ª Cat",
    clubId: "country",
    venueName: "Country Club Los Huancas",
    banner: ASSETS.cancha1,
    dates: "21 – 29 Noviembre · Arcilla",
    format: "Cuadro Top 8 Eliminación Directa + Ronda Consuelo",
    entryFee: "S/ 60",
    maxSlots: 8,
    enrolledIds: ["p-alejandro", "p-jose", "p-pablo", "p-kenji"],
    mainBracket: [
      {
        id: "qf-1",
        round: "Cuartos de Final",
        playerA: "Alejandro Tovar",
        playerB: "Kenji Takahashi",
        score: "6-3, 6-4",
        winner: "Alejandro Tovar",
        loserToConsolation: "Kenji Takahashi",
        status: "Finalizado (Validado por Comité)",
      },
      {
        id: "qf-2",
        round: "Cuartos de Final",
        playerA: "José Clariana",
        playerB: "Pablo (Tú)",
        score: "En programación",
        winner: null,
        loserToConsolation: null,
        status: "Pendiente de Cancha",
      },
    ],
    consolationBracket: [
      {
        id: "cons-1",
        round: "Semifinal Consuelo (2º Partido Garantizado)",
        playerA: "Kenji Takahashi",
        playerB: "Perdedor Llave QF-2",
        score: "Esperando rival",
        status: "Automático al caer en 1ra Ronda",
      },
    ],
  },
  {
    id: "tor-rr-5a",
    title: "Copa Circuito Valle del Mantaro · 5ª Avanzada",
    categoryShort: "5ª A",
    clubId: "cutipa",
    venueName: "Academia Romina Cutipa",
    banner: ASSETS.poolTenistaAccion,
    dates: "05 – 13 Diciembre · Arcilla",
    format: "Fase de Grupos Round Robin (3 Partidos Garantizados) + Final",
    entryFee: "S/ 50",
    maxSlots: 6,
    enrolledIds: ["p-kenji", "p-hugo", "p-valeria", "p-george"],
    mainBracket: [
      {
        id: "rr-1",
        round: "Grupo A · Fecha 1",
        playerA: "Kenji Takahashi",
        playerB: "Hugo Paredes",
        score: "6-7(5), 6-4, [10-8]",
        winner: "Kenji Takahashi",
        status: "Finalizado (Validado por Comité)",
      },
      {
        id: "rr-2",
        round: "Grupo A · Fecha 1",
        playerA: "Valeria Mendoza",
        playerB: "George Huamán",
        score: "6-2, 6-3",
        winner: "Valeria Mendoza",
        status: "Finalizado (Validado por Comité)",
      },
    ],
    consolationBracket: [],
  },
];

// Noticias Reales de Respaldo + Marcadores Profesionales ATP/WTA (Solo Lectura)
export const INITIAL_TENNIS_NEWS = [
  {
    id: "news-1",
    source: "ATP Tour en Español",
    title: "El ascenso del tenis sudamericano en arcilla marca el ritmo de la gira de fin de año",
    timeAgo: "Hace 28 min",
    image: ASSETS.poolTenistaAccion,
    url: "https://www.atptour.com/es/news",
  },
  {
    id: "news-2",
    source: "Punto de Break",
    title: "Ignacio Buse y la nueva generación peruana consolidan su calendario de torneos Challenger",
    timeAgo: "Hace 1 h",
    image: ASSETS.cancha1,
    url: "https://www.puntodebreak.com/",
  },
  {
    id: "news-3",
    source: "ESPN Tenis",
    title: "Análisis táctico: cómo el segundo saque con kick domina los tie-breaks bajo presión",
    timeAgo: "Hace 2 h",
    image: ASSETS.poolRaquetaPelota,
    url: "https://espndeportes.espn.com/tenis/",
  },
];

export const INITIAL_ATP_LIVE_SCORES = [
  {
    id: "atp-1",
    tournament: "ATP FINALS · TURÍN",
    player1: "C. Alcaraz",
    player2: "A. Zverev",
    score: "6-4, 5-6 (40-30*)",
    status: "EN VIVO · SET 2",
    url: "https://www.atptour.com/es/scores/current",
  },
  {
    id: "atp-2",
    tournament: "CHALLENGER LIMA · ARCILLA",
    player1: "I. Buse (PER)",
    player2: "F. Comesaña",
    score: "6-3, 3-2*",
    status: "EN VIVO · SET 2",
    url: "https://www.atptour.com/es/scores/current-challenger",
  },
  {
    id: "atp-3",
    tournament: "WTA FINALS",
    player1: "A. Sabalenka",
    player2: "I. Swiatek",
    score: "7-6(5), 6-4",
    status: "FINALIZADO",
    url: "https://www.wtatennis.com/scores",
  },
];

// ============================================================================
// 11. GENERADOR HTML5 CANVAS VERTICAL (9:16) PARA STORIES (IG / FB / WHATSAPP)
// ============================================================================
export const StoryPosterModal = ({ matchData, onClose }) => {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (!matchData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    // Fondo Oscuro Atlético MATCHPOINT (9:16)
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, "#0B0E14");
    grad.addColorStop(0.5, "#131C2E");
    grad.addColorStop(1, "#090D16");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Halo Decorativo Superior Volt y Inferior Azul Eléctrico
    ctx.fillStyle = "rgba(214, 255, 0, 0.12)";
    ctx.beginPath();
    ctx.arc(540, 260, 420, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0, 163, 255, 0.12)";
    ctx.beginPath();
    ctx.arc(540, 1620, 460, 0, Math.PI * 2);
    ctx.fill();

    // Marco Perimetral
    ctx.strokeStyle = "rgba(214, 255, 0, 0.45)";
    ctx.lineWidth = 6;
    ctx.strokeRect(54, 54, 972, 1812);

    // Encabezado MATCHPOINT
    ctx.fillStyle = "#D6FF00";
    ctx.font = "900 68px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MATCHPOINT", 540, 190);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "700 30px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("CIRCUITO OFICIAL DE TENIS · RESULTADO OFICIAL", 540, 248);

    // Etiqueta de Victoria
    ctx.fillStyle = "#D6FF00";
    ctx.fillRect(290, 320, 500, 76);
    ctx.fillStyle = "#0B0E14";
    ctx.font = "900 36px Outfit, sans-serif";
    ctx.fillText("⚡ VICTORIA OFICIAL EN CANCHA", 540, 370);

    // Ganador
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 64px Outfit, sans-serif";
    ctx.fillText(matchData.winnerName || "Ganador", 540, 540);

    ctx.fillStyle = "#D6FF00";
    ctx.font = "800 46px Outfit, sans-serif";
    ctx.fillText(`+${matchData.winnerDelta} PUNTOS RANKING`, 540, 610);

    // Caja Central del Marcador por Sets
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(120, 720, 840, 320);
    ctx.strokeStyle = "rgba(0, 163, 255, 0.5)";
    ctx.lineWidth = 4;
    ctx.strokeRect(120, 720, 840, 320);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "700 30px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("MARCADOR OFICIAL ITF / ATP", 540, 790);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 110px Outfit, sans-serif";
    ctx.fillText(matchData.formattedScore || "6-3, 6-2", 540, 935);

    // Rival
    ctx.fillStyle = "#94A3B8";
    ctx.font = "700 36px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`vs. ${matchData.loserName || "Rival"} (${matchData.loserDelta} pts)`, 540, 1160);

    // Sede
    ctx.fillStyle = "#00A3FF";
    ctx.font = "800 38px Outfit, sans-serif";
    ctx.fillText(`📍 ${matchData.venueLabel || "Country Club Los Huancas"}`, 540, 1260);

    // Pie de firma para Instagram / WhatsApp
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 42px Outfit, sans-serif";
    ctx.fillText("@MatchPoint.Oficial", 540, 1710);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Sube tu historia y etiqueta al circuito · Huancayo", 540, 1765);

    setImageUrl(canvas.toDataURL("image/png"));
  }, [matchData]);

  if (!matchData) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `MatchPoint-Story-${Date.now()}.png`;
    a.click();
  };

  const handleNativeShare = async () => {
    if (!imageUrl || !navigator.share) {
      handleDownload();
      return;
    }
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "matchpoint-story.png", { type: "image/png" });
      await navigator.share({
        title: "Victoria Oficial en MATCHPOINT",
        text: `¡Gané ${matchData.formattedScore} (+${matchData.winnerDelta} pts) en @MatchPoint.Oficial!`,
        files: [file],
      });
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 safe-modal-top">
      <div
        className="w-full max-w-md rounded-3xl p-5 border overflow-y-auto max-h-[88dvh]"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#D6FF00] text-[#0B0E14]">
              Formato 9:16 Stories
            </span>
            <h3 className="font-display text-xl font-black mt-1">Póster de tu Victoria</h3>
          </div>
          <button
            onClick={onClose}
            className="touch-target rounded-full bg-white/10 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-white/15 mb-4 bg-black flex justify-center">
            <img
              src={imageUrl}
              alt="Story Poster 9:16"
              className="max-h-[46dvh] w-auto object-contain"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            className="touch-target w-full py-3 rounded-xl font-display font-extrabold text-sm border border-white/20 bg-white/5"
          >
            ⬇ Descargar PNG
          </button>
          <button
            onClick={handleNativeShare}
            className="touch-target w-full py-3 rounded-xl font-display font-extrabold text-sm bg-[#D6FF00] text-[#0B0E14]"
          >
            📲 Subir a IG / WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 12. CUESTIONARIO PASO A PASO (1X1) + TUTORIAL VIDEOJUEGO EN 4 PASOS
// ============================================================================
export const OnboardingWizardModal = ({
  isOpen,
  onCompleteCalibrationSeed,
  onClose,
  onOpenCoachTab,
}) => {
  const [introAccepted, setIntroAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([null, null, null, null, null]);
  const [calculatedSeed, setCalculatedSeed] = useState(null);

  if (!isOpen) return null;

  const questionObj = CALIBRATION_QUESTIONS[currentStep];
  const progressPct = Math.round(((currentStep + 1) / CALIBRATION_QUESTIONS.length) * 100);

  const handleSelectOption = (points) => {
    const updated = [...answers];
    updated[currentStep] = points;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (answers[currentStep] === null) return;
    if (currentStep < CALIBRATION_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const seed = calculateInitialSeedFromAnswers(answers);
      setCalculatedSeed(seed);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 safe-modal-top">
      <div
        className="w-full max-w-md rounded-3xl p-5 border overflow-y-auto max-h-[88dvh]"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        {/* PANTALLA 0: AVISO OFICIAL DE CALIBRACIÓN ("CADA GAME CUENTA") */}
        {!introAccepted && calculatedSeed === null && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#D6FF00] text-[#0B0E14]">
                ⚡ FASE DE CALIBRACIÓN [0/5]
              </span>
              {onClose && (
                <button onClick={onClose} className="touch-target rounded-full bg-white/10">
                  ✕
                </button>
              )}
            </div>

            <h2 className="font-display text-2xl font-black mb-2">
              Tus primeros 5 partidos definen tu nivel real
            </h2>
            <p className="text-sm opacity-85 leading-relaxed mb-4">
              Responderás <strong>5 preguntas rápidas (una por una)</strong> sobre tus efectos y juego
              en cancha para asignarte el <strong>piso exacto de tu categoría</strong>.
            </p>

            <div className="rounded-2xl p-4 mb-4 border border-[#D6FF00]/40 bg-[#D6FF00]/10 space-y-2 text-xs">
              <div className="font-extrabold text-sm text-[#D6FF00]">
                🎾 Regla de Oro: ¡Aquí cada game vale oro!
              </div>
              <p className="opacity-90 leading-relaxed">
                • Nuestro motor de <strong>Probabilidades Finitas</strong> evalúa cada set y cada
                tie-break. Hacer games o ganar un set reduce tu pérdida al mínimo.
              </p>
              <p className="opacity-90 leading-relaxed">
                • <strong>Detector de Humo:</strong> Nadie entra a 3ª Categoría (4,000+ pts) solo con
                la encuesta (tope 3,800 pts). Si inflas tus respuestas y pierdes{" "}
                <strong>6-0, 6-0</strong> en calibración, recibirás un descenso inmediato (1.25x).
              </p>
            </div>

            <button
              onClick={() => setIntroAccepted(true)}
              className="touch-target w-full py-3.5 rounded-2xl font-display font-black text-base bg-[#D6FF00] text-[#0B0E14]"
            >
              Comenzar Diagnóstico (1 por 1) ➔
            </button>
          </div>
        )}

        {/* PANTALLAS 1 A 5: UNA SOLA PREGUNTA POR PANTALLA */}
        {introAccepted && calculatedSeed === null && (
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-[#00A3FF]">
                Pregunta {currentStep + 1} de {CALIBRATION_QUESTIONS.length}
              </span>
              <span className="tabular-nums opacity-75">{progressPct}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-[#00A3FF] to-[#D6FF00] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 mb-2">
              {questionObj.badge}
            </span>
            <h3 className="font-display text-xl font-black mb-1">{questionObj.title}</h3>
            <p className="text-xs opacity-75 mb-4">{questionObj.subtitle}</p>

            <div className="space-y-2.5 mb-5">
              {questionObj.options.map((opt) => {
                const selected = answers[currentStep] === opt.points;
                return (
                  <button
                    key={opt.letter}
                    onClick={() => handleSelectOption(opt.points)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      selected
                        ? "border-[#D6FF00] bg-[#D6FF00]/15 shadow-lg"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs flex-shrink-0 ${
                        selected ? "bg-[#D6FF00] text-[#0B0E14]" : "bg-white/10"
                      }`}
                    >
                      {opt.letter}
                    </span>
                    <div>
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-75 mt-0.5">{opt.detail}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="touch-target px-4 py-3 rounded-xl font-bold text-xs border border-white/15 bg-white/5"
                >
                  ← Anterior
                </button>
              )}
              <button
                disabled={answers[currentStep] === null}
                onClick={handleNext}
                className={`touch-target flex-1 py-3.5 rounded-xl font-display font-black text-sm ${
                  answers[currentStep] !== null
                    ? "bg-[#D6FF00] text-[#0B0E14]"
                    : "bg-white/10 opacity-40 cursor-not-allowed"
                }`}
              >
                {currentStep === CALIBRATION_QUESTIONS.length - 1
                  ? "Calcular mi Piso Inicial ⚡"
                  : "Siguiente Pregunta ➔"}
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA FINAL DEL WIZARD: REVELACIÓN DEL PISO EXACTO + CANALIZACIÓN COACH PRO */}
        {calculatedSeed !== null && (
          <div className="text-center py-2">
            <SafeImage
              src={ASSETS.gifAscensoCampeon}
              alt="Calibración Lista"
              className="w-20 h-20 mx-auto mb-3 rounded-2xl"
              fallbackText="MP"
            />
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#D6FF00] text-[#0B0E14]">
              🎯 SEMILLA ASIGNADA · CALIBRANDO [0/5]
            </span>
            <h3 className="font-display text-3xl font-black mt-3 tabular-nums">
              {calculatedSeed} Puntos
            </h3>
            <p className="text-sm font-bold text-[#00A3FF] mt-1">
              Piso Inicial: {getCategoryByElo(calculatedSeed).name}
            </p>
            <p className="text-xs opacity-80 mt-2 mb-4 leading-relaxed">
              Arrancas en el piso exacto de tu categoría. Completa tus primeros{" "}
              <strong>5 partidos oficiales</strong> para desbloquear tu puesto en el Ranking y en el
              Torneo Top 8.
            </p>

            {calculatedSeed <= 1000 && onOpenCoachTab && (
              <div className="rounded-2xl p-3.5 mb-4 border border-[#00A3FF]/40 bg-[#00A3FF]/10 text-left">
                <div className="text-xs font-extrabold text-[#00A3FF] mb-1">
                  🎓 Recomendación para tu inicio en cancha:
                </div>
                <p className="text-xs opacity-85 mb-2">
                  Contamos con entrenadores verificados en Huancayo con packs de iniciación y
                  diagnóstico ELO.
                </p>
                <button
                  onClick={() => {
                    onCompleteCalibrationSeed(calculatedSeed, false);
                    onOpenCoachTab();
                  }}
                  className="text-xs font-black underline text-[#D6FF00]"
                >
                  Ver Entrenadores Coach Pro disponibles ➔
                </button>
              </div>
            )}

            <button
              onClick={() => onCompleteCalibrationSeed(calculatedSeed, true)}
              className="touch-target w-full py-3.5 rounded-2xl font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]"
            >
              Iniciar Tutorial Rápido (4 Pasos) 🎮
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Tutorial Interactivo Estilo Videojuego (4 Pasos con Foco Neón #D6FF00)
export const VideoGameTutorialOverlay = ({ step, onNextStep, onCloseTutorial }) => {
  if (!step || step < 1 || step > 4) return null;

  const stepsContent = {
    1: {
      badge: "PASO 1 DE 4 · CALIBRACIÓN [X/5]",
      title: "Tu Barra de Calibración y Piso ELO",
      desc: "Tus primeros 5 partidos tienen constante acelerada (K=480) para ubicarte en tu categoría real. ¡Pelea cada game!",
      cta: "Siguiente: Tus Rivales ➔",
    },
    2: {
      badge: "PASO 2 DE 4 · EMPAREJAMIENTO JUSTO",
      title: "Rivales Recomendados de tu Nivel",
      desc: "El radar filtra automáticamente a los jugadores de tu misma categoría para que nunca tengas cruces disparejos.",
      cta: "Siguiente: Pronóstico ELO ➔",
    },
    3: {
      badge: "PASO 3 DE 4 · JAULAS FINITAS",
      title: "Mira tus Puntos Máximos y Mínimos antes de Jugar",
      desc: "Al tocar '⚡ Retar', verás cuánto sumas si ganas 6-0, 6-0 y cuánto amortiguas si pierdes peleando en 3 sets.",
      cta: "Siguiente: Cancha y Firma ➔",
    },
    4: {
      badge: "PASO 4 DE 4 · DOBLE FIRMA Y RANKING EN VIVO",
      title: "Confirma el Marcador Oficial y Sube en la Tabla",
      desc: "Ingresa los sets bajo reglamento ITF/ATP. Al confirmar, verás tu tarjeta subir con animación en vivo y podrás descargar tu Story 9:16.",
      cta: "¡Listo para Jugar! 🎾",
    },
  };

  const info = stepsContent[step];

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 px-4 pointer-events-auto">
      <div className="max-w-md mx-auto rounded-3xl p-4 border-2 border-[#D6FF00] bg-[#0B0E14]/95 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#D6FF00] text-[#0B0E14]">
            🎮 {info.badge}
          </span>
          <button
            onClick={onCloseTutorial}
            className="text-xs opacity-70 hover:opacity-100 px-2 py-1"
          >
            Saltar ✕
          </button>
        </div>
        <h4 className="font-display text-base font-black text-[#D6FF00]">{info.title}</h4>
        <p className="text-xs text-slate-200 mt-1 mb-3 leading-relaxed">{info.desc}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`h-2 rounded-full transition-all ${
                  n === step ? "w-6 bg-[#D6FF00]" : "w-2 bg-white/25"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onNextStep}
            className="touch-target px-4 py-2 rounded-xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14]"
          >
            {info.cta}
          </button>
        </div>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 3 DE 6 ===

// === INICIO DEL BLOQUE 4 DE 6 ===

// ============================================================================
// 13. FICHA HOMOGENEIZADA DE JUGADOR (USADA EN "MI PERFIL" Y MODAL DE RANKING)
// ============================================================================
export const PlayerProfileCardView = ({
  player,
  currentUser,
  isOwnProfile = false,
  isLightMode = false,
  onToggleTheme,
  onUpdateProfile,
  onLaunchChallenge,
  onOpenCalibrationWizard,
  onOpenAdminPinModal,
  onLogout,
  onCloseModal,
}) => {
  const [showGearSettings, setShowGearSettings] = useState(false);
  const [editHand, setEditHand] = useState(player?.hand || "Diestro · Topspin + Slice");
  const [editSchedule, setEditSchedule] = useState(
    player?.preferredSchedule || "Lunes a Sábado Tardes"
  );
  const [editClubId, setEditClubId] = useState(player?.clubId || "country");
  const [editWhatsappPublic, setEditWhatsappPublic] = useState(
    player?.whatsappPublic !== false
  );

  if (!player) return null;

  const catInfo = getCategoryByElo(player.elo);
  const clubObj = getClubById(player.clubId);
  const totalMatches = Number(player.matchesPlayed) || 0;
  const wins = Number(player.wins) || 0;
  const losses = Number(player.losses) || 0;
  const effectivenessPct =
    totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Regla estricta: Ocultar racha si victorias === 0 o streak === 0
  const hasActiveStreak = wins > 0 && (Number(player.streak) || 0) > 0;
  const calibrationDone = Math.min(5, totalMatches);
  const isCalibrating = totalMatches < 5;

  // Historial Cara a Cara (H2H) contra el usuario actual
  const h2h = player.h2hWithCurrentUser || { userWins: 0, rivalWins: 0, lastScore: null };
  const hasPlayedBefore = h2h.userWins + h2h.rivalWins > 0;

  const handleSaveSettings = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        ...player,
        hand: editHand,
        preferredSchedule: editSchedule,
        clubId: editClubId,
        whatsappPublic: editWhatsappPublic,
      });
    }
    setShowGearSettings(false);
  };

  return (
    <div
      className="rounded-3xl p-5 border relative overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Cabecera superior si se abre como modal desde el Ranking */}
      {onCloseModal && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#00A3FF]">
            Ficha Oficial del Tenista
          </span>
          <button
            onClick={onCloseModal}
            className="touch-target rounded-full bg-white/10 text-sm font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fila Principal: Foto Circular Centrada + Escudo Club + Tuerca Exclusiva en Mi Perfil */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <SafeImage
              src={player.avatar}
              alt={player.name}
              fallbackText={player.name}
              circular
              className="w-20 h-20 border-2 border-[#D6FF00]"
            />
            {clubObj && (
              <div
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-1 bg-[#0B0E14] border border-white/20 flex items-center justify-center shadow-md"
                title={clubObj.name}
              >
                <SafeImage
                  src={clubObj.shield}
                  alt={clubObj.shortName}
                  fallbackText={clubObj.shortName}
                  circular
                  className="w-full h-full"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-black"
                style={{ backgroundColor: catInfo.bg, color: catInfo.color }}
              >
                {catInfo.name}
              </span>
              {isCalibrating ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#00A3FF]/20 text-[#00A3FF]">
                  🎯 Calibrando {calibrationDone}/5
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400">
                  ✓ Ranking Oficial
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl font-black mt-1 leading-tight">
              {player.name}
            </h2>

            <div className="text-xs opacity-75 mt-0.5 flex flex-wrap items-center gap-2">
              <span>
                {clubObj ? `🏛️ ${clubObj.shortName}` : "🎾 Jugador Independiente"}
              </span>
              <span>· {player.age || 28} años</span>
            </div>
          </div>
        </div>

        {/* Icono de Tuerca (⚙️) Exclusivo en "Mi Perfil" */}
        {isOwnProfile && (
          <button
            onClick={() => setShowGearSettings(!showGearSettings)}
            className="touch-target rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-extrabold flex items-center gap-1.5"
            title="Configuración de Cuenta y Privacidad"
          >
            <span>⚙️</span>
            <span>Ajustes</span>
          </button>
        )}
      </div>

      {/* Bloque de Estadísticas con Terminología Deportiva Limpia (Cero "Win Rate" o "11G-1P") */}
      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <div className="rounded-2xl p-3 border border-white/10 bg-white/5 text-center">
          <div className="text-[11px] font-bold opacity-70 uppercase">Puntos Ranking</div>
          <div
            className="font-display text-2xl font-black tabular-nums mt-0.5"
            style={{ color: "var(--accent-text-on-card)" }}
          >
            {player.elo}
          </div>
          <div className="text-[11px] font-bold text-emerald-400 tabular-nums">
            {player.lastDelta >= 0 ? `▲ +${player.lastDelta} últ.` : `▼ ${player.lastDelta} últ.`}
          </div>
        </div>

        <div className="rounded-2xl p-3 border border-white/10 bg-white/5 text-center">
          <div className="text-[11px] font-bold opacity-70 uppercase">% Efectividad</div>
          <div className="font-display text-2xl font-black tabular-nums mt-0.5">
            {effectivenessPct}%
          </div>
          <div className="text-[10px] font-bold opacity-80">
            {wins} VICTORIAS · {losses} DERROTAS
          </div>
        </div>

        <div className="rounded-2xl p-3 border border-white/10 bg-white/5 text-center flex flex-col items-center justify-center">
          <div className="text-[11px] font-bold opacity-70 uppercase">Estado / Racha</div>
          {hasActiveStreak ? (
            <div className="flex items-center gap-1.5 mt-1">
              <SafeImage
                src={ASSETS.fuegoRacha3d}
                alt="Racha Activa"
                className="w-6 h-6"
                fallbackText="🔥"
              />
              <span className="font-display text-lg font-black text-[#D6FF00] tabular-nums">
                +{player.streak} Seguidas
              </span>
            </div>
          ) : (
            <div className="text-xs font-bold opacity-75 mt-1.5">
              {totalMatches === 0 ? "Listo para debutar" : "En competencia"}
            </div>
          )}
        </div>
      </div>

      {/* DESGLOSE DE LAS 2 BARRAS DE PROGRESO (Calibración X/5 + Avance de Categoría) */}
      <div className="mt-4 space-y-3 rounded-2xl p-3.5 border border-white/10 bg-black/20">
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span>1. Barra de Calibración Oficial</span>
            <span className="tabular-nums text-[#00A3FF]">
              {calibrationDone} de 5 partidos completados
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#00A3FF] transition-all duration-500"
              style={{ width: `${(calibrationDone / 5) * 100}%` }}
            />
          </div>
          <div className="text-[11px] opacity-70 mt-1">
            {isCalibrating
              ? `Te faltan ${5 - calibrationDone} partidos para desbloquear clasificación al Top 8.`
              : "Calibración completada · Habilitado para el Torneo Master Top 8."}
          </div>
        </div>

        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span>2. Progreso hacia {catInfo.nextCat ? catInfo.nextCat.name : "Cima 2ª Libre"}</span>
            <span className="tabular-nums" style={{ color: "var(--accent-text-on-card)" }}>
              {catInfo.pointsInCurrentBand} / 1,000 pts ({catInfo.levelProgressPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00A3FF] to-[#D6FF00] transition-all duration-500"
              style={{ width: `${catInfo.levelProgressPct}%` }}
            />
          </div>
          <div className="text-[11px] opacity-75 mt-1 flex items-center justify-between">
            <span>Piso actual: {catInfo.min} pts</span>
            {catInfo.nextCat && (
              <span className="font-bold">
                A {catInfo.pointsToNext} pts de {catInfo.nextCat.short} ({catInfo.nextCat.min} pts)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detalles técnicos de juego */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
          <span className="opacity-65 block text-[10px] uppercase font-bold">Golpe / Mano</span>
          <span className="font-bold">{player.hand || "Diestro"}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
          <span className="opacity-65 block text-[10px] uppercase font-bold">Disponibilidad</span>
          <span className="font-bold">{player.preferredSchedule || "Tardes y Fines de Semana"}</span>
        </div>
      </div>

      {/* Si es ficha de un RIVAL: Historial Cara a Cara (H2H) y Botón de Retar */}
      {!isOwnProfile && currentUser && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="rounded-2xl p-3.5 border border-[#00A3FF]/30 bg-[#00A3FF]/10 mb-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#00A3FF] mb-1">
              ⚔️ Historial Cara a Cara (Head-to-Head)
            </div>
            {hasPlayedBefore ? (
              <div className="flex items-center justify-between text-xs font-bold">
                <span>
                  TÚ: {h2h.userWins} VICTORIAS — {player.name.split(" ")[0].toUpperCase()}:{" "}
                  {h2h.rivalWins} VICTORIAS
                </span>
                {h2h.lastScore && (
                  <span className="px-2 py-0.5 rounded bg-black/30 text-[#D6FF00] tabular-nums">
                    Últ.: {h2h.lastScore}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm font-extrabold text-white">
                Primer enfrentamiento directo
              </div>
            )}
          </div>

          <div className="flex gap-2.5">
            {onLaunchChallenge && (
              <button
                onClick={() => onLaunchChallenge(player)}
                className="touch-target flex-1 py-3 rounded-2xl font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]"
              >
                ⚡ Retar a {player.name.split(" ")[0]}
              </button>
            )}
            {player.whatsappPublic && player.whatsapp && (
              <a
                href={`https://wa.me/51${player.whatsapp}?text=${encodeURIComponent(
                  `¡Hola ${player.name}! Te escribo desde MATCHPOINT para coordinar nuestro partido de ranking en Huancayo.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="touch-target px-4 py-3 rounded-2xl font-bold text-xs border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              >
                💬 WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* PANEL DESPLEGABLE DE LA TUERCA (⚙️) EXCLUSIVO EN "MI PERFIL" */}
      {isOwnProfile && showGearSettings && (
        <div className="mt-4 pt-4 border-t border-white/15 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm font-black text-[#D6FF00]">
              ⚙️ Configuración de Perfil y Privacidad
            </h4>
            <button
              onClick={onToggleTheme}
              className="touch-target px-3 py-1.5 rounded-xl text-xs font-extrabold border border-white/20 bg-white/10"
            >
              {isLightMode ? "🌙 Cambiar a Modo Oscuro" : "☀️ Cambiar a Modo Claro (Sol)"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-xs">
            <label className="block">
              <span className="font-bold opacity-80 block mb-1">
                Club Afiliado (o Modo Individual sin escudo):
              </span>
              <select
                value={editClubId}
                onChange={(e) => setEditClubId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-white font-bold"
              >
                <option value="country">Country Club Los Huancas</option>
                <option value="cutipa">Academia Romina Cutipa</option>
                <option value="tauro">Club Tauro Tenis</option>
                <option value="inkas">Club Los Inkas / Xian</option>
                <option value="individual">Modo Individual (Sin Escudo de Club)</option>
              </select>
            </label>

            <label className="block">
              <span className="font-bold opacity-80 block mb-1">Mano Hábil y Estilo de Juego:</span>
              <input
                type="text"
                value={editHand}
                onChange={(e) => setEditHand(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-white"
              />
            </label>

            <label className="block">
              <span className="font-bold opacity-80 block mb-1">Horario Preferido de Cancha:</span>
              <input
                type="text"
                value={editSchedule}
                onChange={(e) => setEditSchedule(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-white"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span>Mostrar mi botón de WhatsApp a todos los socios</span>
              <input
                type="checkbox"
                checked={editWhatsappPublic}
                onChange={(e) => setEditWhatsappPublic(e.target.checked)}
                className="w-5 h-5 accent-[#D6FF00]"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleSaveSettings}
              className="touch-target flex-1 py-2.5 rounded-xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14]"
            >
              Guardar Cambios
            </button>
            {onOpenCalibrationWizard && (
              <button
                onClick={onOpenCalibrationWizard}
                className="touch-target px-3 py-2.5 rounded-xl font-bold text-xs border border-[#00A3FF]/40 text-[#00A3FF]"
              >
                🎯 Re-hacer Test Inicial
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              onClick={onOpenAdminPinModal}
              className="text-slate-400 hover:text-white underline font-semibold"
            >
              🔐 Acceso de Gestión Técnica (PIN 1234)
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-rose-400 font-bold hover:underline"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 14. MODAL PARA LANZAR RETO (PRONÓSTICO PRE-PARTIDO + SEDE PERSONALIZADA)
// ============================================================================
export const ChallengeLaunchModal = ({
  challenger,
  opponent,
  totalActivePlayers = 130,
  weeklyMatchesBetweenPair = 0,
  onClose,
  onConfirmChallenge,
}) => {
  const [selectedClubId, setSelectedClubId] = useState(challenger?.clubId || "country");
  const [customVenueText, setCustomVenueText] = useState("");
  const [scheduledTime, setScheduledTime] = useState("Sábado · 16:00 hrs");
  const [formatRule, setFormatRule] = useState("Deuce / Ventaja (Regla ATP)");

  if (!challenger || !opponent) return null;

  const forecast = getPreMatchThresholds(
    challenger,
    opponent,
    totalActivePlayers,
    weeklyMatchesBetweenPair
  );

  const challengerClub = getClubById(challenger.clubId);
  const opponentClub = getClubById(opponent.clubId);

  const handleSubmit = () => {
    onConfirmChallenge({
      challengerId: challenger.id,
      challengedId: opponent.id,
      clubId: selectedClubId === "custom" ? "country" : selectedClubId,
      customVenue: selectedClubId === "custom" ? customVenueText.trim() || "Cancha Particular Huancayo" : "",
      scheduledTime,
      formatRule,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 safe-modal-top">
      <div
        className="w-full max-w-md rounded-3xl p-5 border overflow-y-auto max-h-[88dvh]"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#D6FF00] text-[#0B0E14]">
            ⚡ LANZAR RETO OFICIAL
          </span>
          <button onClick={onClose} className="touch-target rounded-full bg-white/10 font-bold">
            ✕
          </button>
        </div>

        {/* PÓSTER VS DE CARAS ENCARADAS + ESCUDOS */}
        <div className="rounded-2xl p-4 border border-white/10 bg-black/30 flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className="relative inline-block">
              <SafeImage
                src={challenger.avatar}
                alt={challenger.name}
                circular
                className="w-16 h-16 border-2 border-[#00A3FF]"
              />
              {challengerClub && (
                <SafeImage
                  src={challengerClub.shield}
                  alt={challengerClub.shortName}
                  circular
                  className="w-6 h-6 absolute -bottom-1 -right-1 border border-black"
                />
              )}
            </div>
            <div className="font-display font-extrabold text-sm mt-1.5 truncate">
              {challenger.name.split(" ")[0]}
            </div>
            <div className="text-xs font-black text-[#00A3FF] tabular-nums">
              {challenger.elo} Pts
            </div>
          </div>

          <div className="px-2 text-center">
            <div className="font-display text-xl font-black text-[#D6FF00]">VS</div>
            <div className="text-[10px] font-bold opacity-75 mt-0.5">
              Prob. {forecast.probability}%
            </div>
          </div>

          <div className="text-center flex-1">
            <div className="relative inline-block">
              <SafeImage
                src={opponent.avatar}
                alt={opponent.name}
                circular
                className="w-16 h-16 border-2 border-[#D6FF00]"
              />
              {opponentClub && (
                <SafeImage
                  src={opponentClub.shield}
                  alt={opponentClub.shortName}
                  circular
                  className="w-6 h-6 absolute -bottom-1 -right-1 border border-black"
                />
              )}
            </div>
            <div className="font-display font-extrabold text-sm mt-1.5 truncate">
              {opponent.name.split(" ")[0]}
            </div>
            <div className="text-xs font-black text-[#D6FF00] tabular-nums">
              {opponent.elo} Pts
            </div>
          </div>
        </div>

        {/* CALCULADORA PREDICTIVA DE JAULAS FINITAS (PUNTOS MÁXIMOS Y MÍNIMOS) */}
        <div className="rounded-2xl p-3.5 border border-[#D6FF00]/30 bg-[#D6FF00]/5 mb-4">
          <div className="flex items-center justify-between text-[11px] font-extrabold mb-2">
            <span className="text-[#D6FF00]">📊 PRONÓSTICO POR MARCADOR FINITO</span>
            <span className="opacity-75">{forecast.rematchLabel}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="rounded-xl p-2.5 bg-emerald-500/15 border border-emerald-500/30">
              <div className="text-[10px] font-extrabold text-emerald-300 uppercase">
                🟢 Si Ganas el Partido
              </div>
              <div className="font-display text-lg font-black text-emerald-400 tabular-nums mt-0.5">
                +{forecast.minWin} a +{forecast.maxWin} Pts
              </div>
              <div className="text-[10px] opacity-80">
                Normal (6-3, 6-2): <strong>+{forecast.typicalWin} pts</strong>
              </div>
            </div>

            <div className="rounded-xl p-2.5 bg-rose-500/15 border border-rose-500/30">
              <div className="text-[10px] font-extrabold text-rose-300 uppercase">
                🔴 Si Pierdes el Partido
              </div>
              <div className="font-display text-lg font-black text-rose-400 tabular-nums mt-0.5">
                {forecast.minLoss} a {forecast.maxLoss} Pts
              </div>
              <div className="text-[10px] opacity-80">
                Peleando en 3 sets: <strong>{forecast.minLoss} pts</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SELECTOR DE SEDE OFICIAL + OPCIÓN DE SEDE PERSONALIZADA (CAMPO DE TEXTO LIBRE) */}
        <div className="space-y-3 text-xs mb-4">
          <div>
            <label className="font-bold block mb-1.5">Selecciona Club o Sede Personalizada:</label>
            <div className="grid grid-cols-2 gap-2">
              {HUANCAYO_CLUBS.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => setSelectedClubId(club.id)}
                  className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 ${
                    selectedClubId === club.id
                      ? "border-[#D6FF00] bg-[#D6FF00]/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <SafeImage
                    src={club.shield}
                    alt={club.shortName}
                    circular
                    className="w-6 h-6"
                  />
                  <span className="truncate">{club.shortName}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedClubId("custom")}
                className={`col-span-2 p-2.5 rounded-xl border text-left font-bold ${
                  selectedClubId === "custom"
                    ? "border-[#00A3FF] bg-[#00A3FF]/15 text-[#00A3FF]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                📍 Otra Cancha / Sede Personalizada (Escribir nombre)
              </button>
            </div>
          </div>

          {selectedClubId === "custom" && (
            <div>
              <label className="font-bold block mb-1 text-[#00A3FF]">
                Nombre de la Cancha o Condominio:
              </label>
              <input
                type="text"
                placeholder="Ej. Cancha Privada San Antonio / Colegio Andino..."
                value={customVenueText}
                onChange={(e) => setCustomVenueText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-[#00A3FF]/50 text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Día y Hora Propuesta:</label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Formato en 40-40:</label>
              <select
                value={formatRule}
                onChange={(e) => setFormatRule(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-white font-bold"
              >
                <option value="Deuce / Ventaja (Regla ATP)">Deuce / Ventaja (ATP)</option>
                <option value="Punto de Oro (No-Ad)">Punto de Oro (No-Ad)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="touch-target w-full py-3.5 rounded-2xl font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]"
        >
          Enviar Desafío Oficial ⚡
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 15. MODAL DE CARGA Y DOBLE FIRMA DE MARCADOR OFICIAL ITF / ATP
// ============================================================================
export const OfficialScoreSubmitModal = ({
  challenge,
  playerA,
  playerB,
  totalActivePlayers = 130,
  onClose,
  onConfirmOfficialResult,
}) => {
  // Set 1 y Set 2 + Tie-Breaks + 3er Set Super Tie-Break a 10 puntos
  const [set1A, setSet1A] = useState(6);
  const [set1B, setSet1B] = useState(3);
  const [tb1A, setTb1A] = useState(7);
  const [tb1B, setTb1B] = useState(4);

  const [set2A, setSet2A] = useState(6);
  const [set2B, setSet2B] = useState(2);
  const [tb2A, setTb2A] = useState(7);
  const [tb2B, setTb2B] = useState(5);

  const [superTbA, setSuperTbA] = useState(10);
  const [superTbB, setSuperTbB] = useState(8);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!challenge || !playerA || !playerB) return null;

  const isSet1Tb =
    (Number(set1A) === 7 && Number(set1B) === 6) ||
    (Number(set1B) === 7 && Number(set1A) === 6);
  const isSet2Tb =
    (Number(set2A) === 7 && Number(set2B) === 6) ||
    (Number(set2B) === 7 && Number(set2A) === 6);

  const s1Winner = Number(set1A) > Number(set1B) ? "A" : Number(set1B) > Number(set1A) ? "B" : null;
  const s2Winner = Number(set2A) > Number(set2B) ? "A" : Number(set2B) > Number(set2A) ? "B" : null;
  const isSplitSets = s1Winner && s2Winner && s1Winner !== s2Winner;

  const builtSets = useMemo(() => {
    const arr = [
      { a: Number(set1A), b: Number(set1B), tbA: Number(tb1A), tbB: Number(tb1B) },
      { a: Number(set2A), b: Number(set2B), tbA: Number(tb2A), tbB: Number(tb2B) },
    ];
    if (isSplitSets) {
      arr.push({ isSuperTb: true, a: Number(superTbA), b: Number(superTbB) });
    }
    return arr;
  }, [set1A, set1B, tb1A, tb1B, set2A, set2B, tb2A, tb2B, isSplitSets, superTbA, superTbB]);

  const validation = useMemo(() => validateOfficialItfScore(builtSets), [builtSets]);

  const liveCalculation = useMemo(() => {
    if (!validation.valid) return null;
    return calculateFiniteMatchElo({
      playerA,
      playerB,
      sets: builtSets,
      totalActivePlayers,
    });
  }, [validation, playerA, playerB, builtSets, totalActivePlayers]);

  const handleConfirm = () => {
    if (!validation.valid) {
      setErrorMsg(validation.error);
      return;
    }
    setErrorMsg(null);
    onConfirmOfficialResult(challenge.id, builtSets, liveCalculation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 safe-modal-top">
      <div
        className="w-full max-w-md rounded-3xl p-5 border overflow-y-auto max-h-[88dvh]"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#D6FF00] text-[#0B0E14]">
              ACTA OFICIAL ITF / ATP
            </span>
            <h3 className="font-display text-xl font-black mt-1">
              Confirmar Marcador Oficial
            </h3>
          </div>
          <button onClick={onClose} className="touch-target rounded-full bg-white/10 font-bold">
            ✕
          </button>
        </div>

        <p className="text-xs opacity-75 mb-3">
          Solo los 2 tenistas inscritos pueden firmar este resultado. El motor bloquea marcadores
          irreales (como 8-6 en games) y exige diferencia de 2 en Tie-Breaks.
        </p>

        {/* Cabecera de Jugadores */}
        <div className="grid grid-cols-3 items-center text-center p-2.5 rounded-2xl bg-white/5 border border-white/10 mb-3 text-xs font-extrabold">
          <div className="truncate text-[#00A3FF]">{playerA.name.split(" ")[0]}</div>
          <div className="opacity-60">MARCADOR</div>
          <div className="truncate text-[#D6FF00]">{playerB.name.split(" ")[0]}</div>
        </div>

        {/* SET 1 */}
        <div className="p-3 rounded-2xl border border-white/10 bg-black/20 mb-2.5">
          <div className="grid grid-cols-3 items-center text-center">
            <input
              type="number"
              min="0"
              max="7"
              value={set1A}
              onChange={(e) => setSet1A(e.target.value)}
              className="w-16 mx-auto p-2 rounded-xl bg-white/10 text-center font-display text-xl font-black"
            />
            <span className="text-xs font-extrabold uppercase opacity-75">1º Set (Games)</span>
            <input
              type="number"
              min="0"
              max="7"
              value={set1B}
              onChange={(e) => setSet1B(e.target.value)}
              className="w-16 mx-auto p-2 rounded-xl bg-white/10 text-center font-display text-xl font-black"
            />
          </div>

          {isSet1Tb && (
            <div className="mt-2.5 pt-2.5 border-t border-white/10 grid grid-cols-3 items-center text-center">
              <input
                type="number"
                min="0"
                value={tb1A}
                onChange={(e) => setTb1A(e.target.value)}
                className="w-16 mx-auto p-1.5 rounded-lg bg-[#00A3FF]/20 border border-[#00A3FF] text-center font-bold text-sm"
              />
              <span className="text-[11px] font-bold text-[#00A3FF]">
                Tie-Break 7 pts (Dif. 2)
              </span>
              <input
                type="number"
                min="0"
                value={tb1B}
                onChange={(e) => setTb1B(e.target.value)}
                className="w-16 mx-auto p-1.5 rounded-lg bg-[#00A3FF]/20 border border-[#00A3FF] text-center font-bold text-sm"
              />
            </div>
          )}
        </div>

        {/* SET 2 */}
        <div className="p-3 rounded-2xl border border-white/10 bg-black/20 mb-2.5">
          <div className="grid grid-cols-3 items-center text-center">
            <input
              type="number"
              min="0"
              max="7"
              value={set2A}
              onChange={(e) => setSet2A(e.target.value)}
              className="w-16 mx-auto p-2 rounded-xl bg-white/10 text-center font-display text-xl font-black"
            />
            <span className="text-xs font-extrabold uppercase opacity-75">2º Set (Games)</span>
            <input
              type="number"
              min="0"
              max="7"
              value={set2B}
              onChange={(e) => setSet2B(e.target.value)}
              className="w-16 mx-auto p-2 rounded-xl bg-white/10 text-center font-display text-xl font-black"
            />
          </div>

          {isSet2Tb && (
            <div className="mt-2.5 pt-2.5 border-t border-white/10 grid grid-cols-3 items-center text-center">
              <input
                type="number"
                min="0"
                value={tb2A}
                onChange={(e) => setTb2A(e.target.value)}
                className="w-16 mx-auto p-1.5 rounded-lg bg-[#00A3FF]/20 border border-[#00A3FF] text-center font-bold text-sm"
              />
              <span className="text-[11px] font-bold text-[#00A3FF]">
                Tie-Break 7 pts (Dif. 2)
              </span>
              <input
                type="number"
                min="0"
                value={tb2B}
                onChange={(e) => setTb2B(e.target.value)}
                className="w-16 mx-auto p-1.5 rounded-lg bg-[#00A3FF]/20 border border-[#00A3FF] text-center font-bold text-sm"
              />
            </div>
          )}
        </div>

        {/* 3ER SET: MATCH TIE-BREAK A 10 PUNTOS SIN TECHO (SI EMPATAN 1-1) */}
        {isSplitSets && (
          <div className="p-3 rounded-2xl border-2 border-[#D6FF00] bg-[#D6FF00]/10 mb-3">
            <div className="text-center text-[11px] font-black text-[#D6FF00] mb-2 uppercase">
              ⚡ Empate 1-1 en Sets · Match Tie-Break a 10 Puntos (Dif. 2 sin límite)
            </div>
            <div className="grid grid-cols-3 items-center text-center">
              <input
                type="number"
                min="0"
                value={superTbA}
                onChange={(e) => setSuperTbA(e.target.value)}
                className="w-20 mx-auto p-2 rounded-xl bg-black/50 border border-[#D6FF00] text-center font-display text-xl font-black"
              />
              <span className="text-xs font-bold">Puntos Super TB</span>
              <input
                type="number"
                min="0"
                value={superTbB}
                onChange={(e) => setSuperTbB(e.target.value)}
                className="w-20 mx-auto p-2 rounded-xl bg-black/50 border border-[#D6FF00] text-center font-display text-xl font-black"
              />
            </div>
          </div>
        )}

        {/* Alerta de Error Reglamentario o Vista Previa Exacta del Cálculo ELO */}
        {!validation.valid || errorMsg ? (
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500 text-xs font-bold text-rose-200 mb-3">
            ⚠️ {errorMsg || validation.error}
          </div>
        ) : (
          liveCalculation && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 mb-4 text-xs">
              <div className="font-extrabold text-emerald-300 mb-1">
                ✓ Marcador Oficial Válido: {liveCalculation.formattedScore}
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>
                  🟢 {liveCalculation.winnerName}:{" "}
                  <strong className="text-[#D6FF00]">
                    +{liveCalculation.winnerDelta} pts ({liveCalculation.winPercentageApplied}% del techo)
                  </strong>
                </span>
                <span>
                  🔴 {liveCalculation.loserName}:{" "}
                  <strong className="text-rose-400">
                    {liveCalculation.loserDelta} pts ({liveCalculation.lossPercentageApplied}% del techo)
                  </strong>
                </span>
              </div>
            </div>
          )
        )}

        <button
          onClick={handleConfirm}
          className="touch-target w-full py-3.5 rounded-2xl font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]"
        >
          Confirmar Marcador Oficial ✍️
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 16. VISTA PRINCIPAL DE RANKING (ANIMACIÓN EN VIVO, CLUBES Y SALÓN DE LA FAMA)
// ============================================================================
export const RankingTabView = ({
  players,
  currentUser,
  animatedPlayerId,
  animationType, // 'epic' | 'up' | 'down' | null
  onSelectPlayerProfile,
  onLaunchChallenge,
  onSimulateLiveRankingShift,
  onOpenPoliciesModal,
  tutorialStep,
}) => {
  const [subTab, setSubTab] = useState("temporada"); // 'temporada' | 'hof'
  const [selectedFilter, setSelectedFilter] = useState("ALL"); // 'ALL' | '3RA' | '4TA' | '5A' | '5B' | '5P' | 'CLUBES'

  const activePlayers = useMemo(
    () => players.filter((p) => p.active !== false).sort((a, b) => b.elo - a.elo),
    [players]
  );

  const filteredPlayers = useMemo(() => {
    if (selectedFilter === "ALL" || selectedFilter === "CLUBES") return activePlayers;
    return activePlayers.filter((p) => getCategoryByElo(p.elo).id === selectedFilter);
  }, [activePlayers, selectedFilter]);

  // Tabla Acumulada de Clubes de Huancayo
  const clubStandings = useMemo(() => {
    return HUANCAYO_CLUBS.map((club) => {
      const members = activePlayers.filter((p) => p.clubId === club.id);
      const totalPts = members.reduce((acc, m) => acc + m.elo, 0);
      const totalWins = members.reduce((acc, m) => acc + (m.wins || 0), 0);
      return {
        ...club,
        membersCount: members.length,
        totalPts,
        totalWins,
      };
    }).sort((a, b) => b.totalPts - a.totalPts);
  }, [activePlayers]);

  return (
    <div className="space-y-4">
      {/* Conmutador Superior: [Temporada Actual] | [Salón de la Fama] */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="grid grid-cols-2 p-1 rounded-2xl border flex-1"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <button
            onClick={() => setSubTab("temporada")}
            className={`touch-target py-2 rounded-xl font-display font-extrabold text-xs transition-all ${
              subTab === "temporada" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
            }`}
          >
            🏆 Temporada Actual
          </button>
          <button
            onClick={() => setSubTab("hof")}
            className={`touch-target py-2 rounded-xl font-display font-extrabold text-xs transition-all ${
              subTab === "hof" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
            }`}
          >
            👑 Salón de la Fama
          </button>
        </div>

        <button
          onClick={onOpenPoliciesModal}
          className="touch-target px-3 py-2.5 rounded-2xl border text-xs font-extrabold"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          title="Políticas del Sistema ELO"
        >
          ⚖️ Reglas ELO
        </button>
      </div>

      {/* VISTA A: RANKING DE LA TEMPORADA ACTUAL */}
      {subTab === "temporada" && (
        <>
          {/* Barra de Filtros por Categoría + Píldora "Clubes" */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "ALL", label: "Todas" },
              { id: "3RA", label: "3ª Cat" },
              { id: "4TA", label: "4ª Cat" },
              { id: "5A", label: "5ª A" },
              { id: "5B", label: "5ª B" },
              { id: "5P", label: "5ª P" },
              { id: "CLUBES", label: "🏛️ Clubes" },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setSelectedFilter(pill.id)}
                className={`touch-target px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap border transition-all ${
                  selectedFilter === pill.id
                    ? "bg-[#D6FF00] text-[#0B0E14] border-[#D6FF00]"
                    : "bg-white/5 border-white/10 opacity-80"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* SI EL FILTRO ES "CLUBES": Muestra la Tabla Acumulada de Clubes */}
          {selectedFilter === "CLUBES" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-black">
                  Clasificación Acumulada por Clubes
                </h3>
                <span className="text-xs opacity-70">Puntos Oficiales Sumados</span>
              </div>
              {clubStandings.map((club, idx) => (
                <div
                  key={club.id}
                  className="rounded-2xl p-4 border flex items-center justify-between"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: idx === 0 ? "#D6FF00" : "var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl font-black w-6 text-center text-[#D6FF00]">
                      #{idx + 1}
                    </span>
                    <SafeImage
                      src={club.shield}
                      alt={club.name}
                      circular
                      className="w-12 h-12 border border-white/20"
                    />
                    <div>
                      <div className="font-display font-black text-base">{club.name}</div>
                      <div className="text-xs opacity-75">
                        {club.membersCount} tenistas en ranking · {club.totalWins} victorias
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-display text-xl font-black tabular-nums"
                      style={{ color: "var(--accent-text-on-card)" }}
                    >
                      {club.totalPts.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold uppercase opacity-70">Puntos Club</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Botón de Prueba Rápida de Animación de Subida Épica en Vivo */}
              <div
                className={`rounded-2xl p-3 border flex items-center justify-between gap-2 ${
                  tutorialStep === 2 ? "tutorial-spotlight" : ""
                }`}
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="text-xs">
                  <span className="font-extrabold block text-[#00A3FF]">
                    ⚡ Clasificación en Vivo · Escala 0 a 5,000 Pts
                  </span>
                  <span className="opacity-75">
                    Toca a cualquier jugador para ver su ficha completa y el cara a cara.
                  </span>
                </div>
                {onSimulateLiveRankingShift && (
                  <button
                    onClick={onSimulateLiveRankingShift}
                    className="touch-target px-3 py-2 rounded-xl font-display font-black text-[11px] bg-[#D6FF00]/20 text-[#D6FF00] border border-[#D6FF00]/50 whitespace-nowrap"
                  >
                    🚀 Probar Subida
                  </button>
                )}
              </div>

              {/* Lista de Jugadores con Podio Top 3 y Animaciones Físicas */}
              <div className="space-y-2.5">
                {filteredPlayers.map((player, index) => {
                  const rankPos = index + 1;
                  const cat = getCategoryByElo(player.elo);
                  const club = getClubById(player.clubId);
                  const isCalib = (Number(player.matchesPlayed) || 0) < 5;
                  const hasStreak = (player.wins || 0) > 0 && (player.streak || 0) > 0;
                  const isAnimated = animatedPlayerId === player.id;

                  let animClass = "";
                  if (isAnimated && animationType === "epic") animClass = "anim-rank-epic";
                  else if (isAnimated && animationType === "up") animClass = "anim-rank-up";
                  else if (isAnimated && animationType === "down") animClass = "anim-rank-down";

                  const medalBorder =
                    rankPos === 1
                      ? "border-amber-400/80"
                      : rankPos === 2
                      ? "border-slate-300/70"
                      : rankPos === 3
                      ? "border-amber-700/70"
                      : "";

                  return (
                    <div
                      key={player.id}
                      onClick={() => onSelectPlayerProfile(player)}
                      className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${medalBorder} ${animClass} ${
                        tutorialStep === 3 && player.id === "p-jose" ? "tutorial-spotlight" : ""
                      }`}
                      style={{
                        backgroundColor: player.isCurrentUser
                          ? "rgba(0, 163, 255, 0.12)"
                          : "var(--bg-card)",
                        borderColor: player.isCurrentUser ? "#00A3FF" : "var(--border-subtle)",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Posición + Indicador de Subida/Bajada estilo ATP */}
                        <div className="w-9 text-center flex-shrink-0">
                          <div className="font-display text-lg font-black tabular-nums leading-none">
                            #{rankPos}
                          </div>
                          {player.rankChange > 0 && (
                            <span className="text-[10px] font-black text-emerald-400">
                              ▲ +{player.rankChange}
                            </span>
                          )}
                          {player.rankChange < 0 && (
                            <span className="text-[10px] font-black text-rose-400">
                              ▼ {player.rankChange}
                            </span>
                          )}
                          {player.rankChange === 0 && (
                            <span className="text-[10px] opacity-40 font-bold">•</span>
                          )}
                        </div>

                        {/* Avatar + Escudo del Club */}
                        <div className="relative flex-shrink-0">
                          <SafeImage
                            src={player.avatar}
                            alt={player.name}
                            circular
                            className="w-12 h-12 border border-white/25"
                          />
                          {club && (
                            <SafeImage
                              src={club.shield}
                              alt={club.shortName}
                              circular
                              className="w-5 h-5 absolute -bottom-1 -right-1 border border-black bg-black"
                            />
                          )}
                        </div>

                        {/* Nombre, Categoría y Etiquetas */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-black text-sm truncate">
                              {player.name}
                            </span>
                            {rankPos === 1 && (
                              <SafeImage
                                src={ASSETS.badgeFavorito}
                                alt="Líder"
                                className="w-4 h-4"
                                fallbackText="★"
                              />
                            )}
                            {hasStreak && (
                              <SafeImage
                                src={ASSETS.fuegoRacha3d}
                                alt="Racha"
                                className="w-4 h-4"
                                fallbackText="🔥"
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span
                              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: cat.bg, color: cat.color }}
                            >
                              {cat.short}
                            </span>
                            {isCalib ? (
                              <span className="text-[10px] font-bold text-[#00A3FF]">
                                [Calibrando {player.matchesPlayed}/5]
                              </span>
                            ) : (
                              <span className="text-[10px] opacity-70">
                                {player.wins}V · {player.losses}D
                              </span>
                            )}
                            {isAnimated && animationType === "epic" && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#D6FF00] text-[#0B0E14]">
                                🚀 SUBIDA ÉPICA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Puntaje ELO y Botón Rápido de Retar */}
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="text-right">
                          <div
                            className="font-display text-xl font-black tabular-nums leading-none"
                            style={{ color: "var(--accent-text-on-card)" }}
                          >
                            {player.elo}
                          </div>
                          <div
                            className={`text-[10px] font-bold tabular-nums mt-0.5 ${
                              player.lastDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {player.lastDelta >= 0 ? `+${player.lastDelta}` : player.lastDelta} pts
                          </div>
                        </div>

                        {!player.isCurrentUser && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLaunchChallenge(player);
                            }}
                            className="touch-target px-3 py-2 rounded-xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14]"
                          >
                            ⚡ Retar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* VISTA B: SALÓN DE LA FAMA (CORONA DE LAURELES DORADOS Y ESTADÍSTICAS COMPLETAS) */}
      {subTab === "hof" && (
        <div className="space-y-3.5">
          <div className="rounded-2xl p-4 border border-amber-400/40 bg-amber-500/10">
            <h3 className="font-display text-lg font-black text-amber-300">
              👑 Muro de Campeones Vigentes · Salón de la Fama
            </h3>
            <p className="text-xs opacity-85 mt-0.5">
              Reconocimiento oficial a los campeones del Master Top 8 de cada categoría en Huancayo.
            </p>
          </div>

          {HALL_OF_FAME_CHAMPIONS.map((champ) => {
            const club = getClubById(champ.clubId);
            return (
              <div
                key={champ.id}
                className="rounded-3xl p-5 border-2 border-amber-400/50 relative overflow-hidden"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-400 text-[#0B0E14]">
                    🏆 {champ.categoryLabel}
                  </span>
                  <span className="font-display font-black text-sm text-amber-300 tabular-nums">
                    Peak: {champ.eloPeak} Pts
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Avatar rodeado con Corona de Laureles Dorados */}
                  <div className="relative p-1.5 rounded-full border-2 border-dashed border-amber-400">
                    <SafeImage
                      src={champ.avatar}
                      alt={champ.playerName}
                      circular
                      className="w-16 h-16 border-2 border-amber-300"
                    />
                    {club && (
                      <SafeImage
                        src={club.shield}
                        alt={club.shortName}
                        circular
                        className="w-6 h-6 absolute -bottom-1 -right-1 border border-black"
                      />
                    )}
                  </div>

                  <div>
                    <h4 className="font-display text-xl font-black">{champ.playerName}</h4>
                    <div className="inline-block mt-1 px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/40 text-[11px] font-extrabold text-amber-300">
                      {champ.statsBadge}
                    </div>
                    <div className="text-xs opacity-75 mt-1 font-semibold">
                      {champ.finalScore}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// === FIN DEL BLOQUE 4 DE 6 ===

// === INICIO DEL BLOQUE 5 DE 6 ===

// ============================================================================
// 17. CENTRAL DE RETOS (CARTELERA EN VIVO, MODO ÁRBITRO Y TUS DESAFÍOS)
// ============================================================================
export const ChallengesTabView = ({
  challenges,
  players,
  currentUser,
  isLightMode,
  totalActivePlayers = 130,
  onAcceptChallenge,
  onRejectChallenge,
  onOpenOfficialScoreModal,
  onOpenLaunchChallengeModal,
  onUpdateLiveUmpireScore,
  tutorialStep,
}) => {
  const [subTab, setSubTab] = useState("cartelera"); // 'cartelera' | 'mis-retos' | 'lanzar'

  const getPlayerById = useCallback(
    (id) => players.find((p) => p.id === id) || null,
    [players]
  );

  const liveAndConfirmedChallenges = useMemo(
    () => challenges.filter((c) => c.status === "live" || c.status === "confirmed"),
    [challenges]
  );

  const myChallenges = useMemo(() => {
    if (!currentUser) return [];
    return challenges.filter(
      (c) =>
        (c.challengerId === currentUser.id || c.challengedId === currentUser.id) &&
        c.status !== "completed"
    );
  }, [challenges, currentUser]);

  // Regla Oficial ITF/ATP para el Modo Árbitro Sencillo en Cancha (+1 Game / +1 Punto TB)
  const handleAddGameOrPoint = (challenge, side) => {
    const idx = challenge.currentSetIndex ?? 0;
    const setsCopy = challenge.liveSets.map((s) => ({ ...s }));
    const activeSet = setsCopy[idx];
    if (!activeSet || activeSet.locked) return;

    // Si es el 3er Set Match Tie-Break a 10 puntos (diferencia de 2 sin techo)
    if (idx === 2 || activeSet.isSuperTb) {
      if (side === "A") activeSet.a += 1;
      else activeSet.b += 1;
      onUpdateLiveUmpireScore(challenge.id, setsCopy, idx, currentUser?.name || "Socio en cancha");
      return;
    }

    // Si el set empató 6-6, estamos dentro del Tie-Break oficial a 7 puntos (dif. 2 sin techo)
    if (activeSet.a === 6 && activeSet.b === 6) {
      activeSet.isTb = true;
      if (side === "A") activeSet.tbA = (activeSet.tbA || 0) + 1;
      else activeSet.tbB = (activeSet.tbB || 0) + 1;

      const tbHigh = Math.max(activeSet.tbA || 0, activeSet.tbB || 0);
      const tbLow = Math.min(activeSet.tbA || 0, activeSet.tbB || 0);
      if (tbHigh >= 7 && tbHigh - tbLow >= 2) {
        if ((activeSet.tbA || 0) > (activeSet.tbB || 0)) activeSet.a = 7;
        else activeSet.b = 7;
      }
      onUpdateLiveUmpireScore(challenge.id, setsCopy, idx, currentUser?.name || "Socio en cancha");
      return;
    }

    // Comprobamos si el set ya alcanzó un cierre reglamentario (6-0..6-4, 7-5 o 7-6)
    const high = Math.max(activeSet.a, activeSet.b);
    const low = Math.min(activeSet.a, activeSet.b);
    const alreadyWonSet =
      (high === 6 && low <= 4) || (high === 7 && (low === 5 || low === 6));
    if (alreadyWonSet) return;

    if (side === "A") activeSet.a += 1;
    else activeSet.b += 1;

    if (activeSet.a === 6 && activeSet.b === 6) {
      activeSet.isTb = true;
    }

    onUpdateLiveUmpireScore(challenge.id, setsCopy, idx, currentUser?.name || "Socio en cancha");
  };

  // Botón "Cerrar Set y Pasar al Siguiente" con candado por set
  const handleLockSetAndAdvance = (challenge) => {
    const idx = challenge.currentSetIndex ?? 0;
    const setsCopy = challenge.liveSets.map((s) => ({ ...s }));
    const activeSet = setsCopy[idx];
    if (!activeSet) return;

    activeSet.locked = true;
    let nextIdx = idx;

    if (idx === 0) {
      nextIdx = 1;
    } else if (idx === 1) {
      const s1Winner = setsCopy[0].a > setsCopy[0].b ? "A" : "B";
      const s2Winner = setsCopy[1].a > setsCopy[1].b ? "A" : "B";
      if (s1Winner !== s2Winner) {
        nextIdx = 2; // Empate 1-1: Habilita el 3er Set Match Tie-Break a 10 pts
      }
    }

    onUpdateLiveUmpireScore(
      challenge.id,
      setsCopy,
      nextIdx,
      currentUser?.name || "Socio en cancha"
    );
  };

  return (
    <div className="space-y-4">
      {/* Sub-navegación de la Central de Retos */}
      <div
        className={`grid grid-cols-3 p-1 rounded-2xl border ${
          tutorialStep === 4 ? "tutorial-spotlight" : ""
        }`}
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <button
          onClick={() => setSubTab("cartelera")}
          className={`touch-target py-2 rounded-xl font-display font-extrabold text-xs transition-all ${
            subTab === "cartelera" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
          }`}
        >
          📡 Cartelera ({liveAndConfirmedChallenges.length})
        </button>
        <button
          onClick={() => setSubTab("mis-retos")}
          className={`touch-target py-2 rounded-xl font-display font-extrabold text-xs transition-all ${
            subTab === "mis-retos" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
          }`}
        >
          ⚔️ Tus Desafíos ({myChallenges.length})
        </button>
        <button
          onClick={() => setSubTab("lanzar")}
          className={`touch-target py-2 rounded-xl font-display font-extrabold text-xs transition-all ${
            subTab === "lanzar" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
          }`}
        >
          ⚡ + Lanzar Reto
        </button>
      </div>

      {/* SUB-PESTAÑA 1: CARTELERA PÚBLICA MATCH CENTER + MODO ÁRBITRO COMUNITARIO */}
      {subTab === "cartelera" && (
        <div className="space-y-4">
          {liveAndConfirmedChallenges.map((ch) => {
            const pA = getPlayerById(ch.challengerId);
            const pB = getPlayerById(ch.challengedId);
            if (!pA || !pB) return null;

            const clubA = getClubById(pA.clubId);
            const clubB = getClubById(pB.clubId);
            const venueClub = getClubById(ch.clubId);
            const forecast = getPreMatchThresholds(pA, pB, totalActivePlayers);
            const isParticipant =
              currentUser &&
              (currentUser.id === pA.id || currentUser.id === pB.id);

            const activeIdx = ch.currentSetIndex ?? 0;
            const currentSetObj = ch.liveSets ? ch.liveSets[activeIdx] : null;
            const canCloseCurrentSet =
              currentSetObj &&
              !currentSetObj.locked &&
              ((activeIdx < 2 &&
                ((Math.max(currentSetObj.a, currentSetObj.b) === 6 &&
                  Math.min(currentSetObj.a, currentSetObj.b) <= 4) ||
                  Math.max(currentSetObj.a, currentSetObj.b) === 7)) ||
                (activeIdx === 2 &&
                  Math.max(currentSetObj.a, currentSetObj.b) >= 10 &&
                  Math.abs(currentSetObj.a - currentSetObj.b) >= 2));

            return (
              <div
                key={ch.id}
                className="rounded-3xl p-4 border relative overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: ch.status === "live" ? "#D6FF00" : "var(--border-subtle)",
                }}
              >
                {/* Etiqueta Superior estilo Transmisión ATP */}
                <div className="flex items-center justify-between mb-3">
                  {ch.status === "live" ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#D6FF00] text-[#0B0E14] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                      EN CANCHA · MARCADOR EN VIVO
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#D6FF00] text-[#0B0E14]">
                      DUELO CONFIRMADO
                    </span>
                  )}
                  <span className="text-xs font-bold opacity-75">
                    {ch.customVenue || venueClub?.shortName || "Country Club"} · {ch.scheduledTime}
                  </span>
                </div>

                {/* Póster de Rostros Encarados + Escudos de Clubes + Delta en Disputa */}
                <div className="grid grid-cols-3 items-center text-center py-2">
                  <div>
                    <div className="relative inline-block">
                      <SafeImage
                        src={pA.avatar}
                        alt={pA.name}
                        circular
                        className="w-16 h-16 border-2 border-[#00A3FF]"
                      />
                      {clubA && (
                        <SafeImage
                          src={clubA.shield}
                          alt={clubA.shortName}
                          circular
                          className="w-6 h-6 absolute -bottom-1 -right-1 border border-black bg-black"
                        />
                      )}
                    </div>
                    <div className="font-display font-black text-sm mt-1.5 truncate">
                      {pA.name}
                    </div>
                    <div className="text-xs font-bold text-[#00A3FF] tabular-nums">
                      {pA.elo} Pts
                    </div>
                  </div>

                  <div className="px-1">
                    <div className="font-display text-2xl font-black text-[#D6FF00]">VS</div>
                    <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-extrabold tabular-nums">
                      En juego: +{forecast.typicalWin} / {forecast.typicalLoss} Pts
                    </div>
                    <div className="text-[10px] opacity-65 mt-1">{ch.formatRule}</div>
                  </div>

                  <div>
                    <div className="relative inline-block">
                      <SafeImage
                        src={pB.avatar}
                        alt={pB.name}
                        circular
                        className="w-16 h-16 border-2 border-[#D6FF00]"
                      />
                      {clubB && (
                        <SafeImage
                          src={clubB.shield}
                          alt={clubB.shortName}
                          circular
                          className="w-6 h-6 absolute -bottom-1 -right-1 border border-black bg-black"
                        />
                      )}
                    </div>
                    <div className="font-display font-black text-sm mt-1.5 truncate">
                      {pB.name}
                    </div>
                    <div className="text-xs font-bold text-[#D6FF00] tabular-nums">
                      {pB.elo} Pts
                    </div>
                  </div>
                </div>

                {/* TABLERO EN VIVO CON MODO ÁRBITRO COMUNITARIO (SI ESTÁ EN JUEGO) */}
                {ch.status === "live" && ch.liveSets && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="rounded-2xl p-3 bg-black/35 border border-white/10">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                        <span>
                          📡 En vivo · Árbitro en cancha:{" "}
                          <strong className="text-[#D6FF00]">{ch.liveUmpireName}</strong>
                        </span>
                        <span className="opacity-70">{ch.liveUpdatedAgo}</span>
                      </div>

                      {/* Tabla estilo Google / ATP por Sets */}
                      <div className="space-y-1.5 text-sm font-display font-black tabular-nums">
                        {[
                          { player: pA, side: "a", key: "A" },
                          { player: pB, side: "b", key: "B" },
                        ].map((row) => (
                          <div
                            key={row.player.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/5"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {ch.serverPlayerId === row.player.id && (
                                <SafeImage
                                  src={ASSETS.pelotaVoltAzul}
                                  alt="Saque"
                                  className="w-4 h-4 ball-3d-anim"
                                  fallbackText="🎾"
                                />
                              )}
                              <span className="truncate text-xs font-bold">
                                {row.player.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {ch.liveSets.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className={`w-9 text-center py-0.5 rounded ${
                                    sIdx === activeIdx
                                      ? "bg-[#D6FF00] text-[#0B0E14]"
                                      : "bg-white/10 text-white"
                                  }`}
                                >
                                  {row.side === "a" ? s.a : s.b}
                                  {s.isTb && sIdx < 2 && (
                                    <sup className="text-[9px] ml-0.5">
                                      {row.side === "a" ? s.tbA || 0 : s.tbB || 0}
                                    </sup>
                                  )}
                                  {s.locked && sIdx < activeIdx ? "🔒" : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Controles de 1 Dedo del Modo Árbitro Sencillo para Espectadores */}
                      <div className="mt-3 pt-2.5 border-t border-white/10">
                        <div className="text-[10px] font-bold opacity-75 mb-2 text-center">
                          Modo Árbitro en Cancha (Set {activeIdx + 1}{" "}
                          {currentSetObj?.isTb ? "· Tie-Break a 7 pts" : activeIdx === 2 ? "· Super TB a 10 pts" : ""})
                          — Informativo, no altera el ELO hasta firma oficial
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAddGameOrPoint(ch, "A")}
                            className="touch-target py-2 rounded-xl font-display font-black text-xs bg-[#00A3FF]/20 border border-[#00A3FF] text-[#00A3FF]"
                          >
                            +1 {currentSetObj?.isTb || activeIdx === 2 ? "Punto TB" : "Game"}{" "}
                            {pA.name.split(" ")[0]}
                          </button>
                          <button
                            onClick={() => handleAddGameOrPoint(ch, "B")}
                            className="touch-target py-2 rounded-xl font-display font-black text-xs bg-[#D6FF00]/20 border border-[#D6FF00] text-[#D6FF00]"
                          >
                            +1 {currentSetObj?.isTb || activeIdx === 2 ? "Punto TB" : "Game"}{" "}
                            {pB.name.split(" ")[0]}
                          </button>
                        </div>

                        {canCloseCurrentSet && (
                          <button
                            onClick={() => handleLockSetAndAdvance(ch)}
                            className="touch-target w-full mt-2 py-2 rounded-xl font-display font-black text-xs bg-emerald-500 text-[#0B0E14]"
                          >
                            🔒 Cerrar Set {activeIdx + 1} y Pasar al Siguiente Set
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Permiso Exclusivo: Solo los 2 Jugadores Inscritos ven el botón de Acta Oficial */}
                {isParticipant && (
                  <div className="mt-3">
                    <button
                      onClick={() => onOpenOfficialScoreModal(ch)}
                      className="touch-target w-full py-3 rounded-2xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14]"
                    >
                      ✍️ Subir y Firmar Marcador Oficial (Exclusivo Jugadores)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-PESTAÑA 2: TUS DESAFÍOS (CON ILUSTRACIÓN 3D DE RAQUETAS SI ESTÁ VACÍO) */}
      {subTab === "mis-retos" && (
        <div className="space-y-3.5">
          {myChallenges.length === 0 ? (
            <div
              className="rounded-3xl p-7 border text-center"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <SafeImage
                src={
                  isLightMode
                    ? ASSETS.raquetasCruzadasNegras
                    : ASSETS.raquetasCruzadasBlancas
                }
                alt="Raquetas Cruzadas 3D"
                className="w-28 h-28 mx-auto mb-3 object-contain"
                fallbackText="🎾"
              />
              <h3 className="font-display text-2xl font-black tracking-tight">
                LA CANCHA ESTÁ ESPERANDO
              </h3>
              <p className="text-xs opacity-75 mt-1 mb-5 max-w-xs mx-auto">
                No tienes desafíos pendientes en este momento. Reta a un rival de tu categoría y
                suma puntos hoy.
              </p>
              <button
                onClick={() => setSubTab("lanzar")}
                className="touch-target px-6 py-3.5 rounded-2xl font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]"
              >
                BUSCAR OPONENTE EN VIVO ⚡
              </button>
            </div>
          ) : (
            myChallenges.map((ch) => {
              const pA = getPlayerById(ch.challengerId);
              const pB = getPlayerById(ch.challengedId);
              if (!pA || !pB) return null;
              const isIncomingForMe =
                ch.status === "pending" && currentUser && ch.challengedId === currentUser.id;
              const venueClub = getClubById(ch.clubId);

              return (
                <div
                  key={ch.id}
                  className="rounded-3xl p-4 border"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: isIncomingForMe ? "#D6FF00" : "var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#00A3FF]/20 text-[#00A3FF]">
                      {isIncomingForMe
                        ? "🔔 RETO ENTRANTE PARA TI"
                        : ch.status === "pending"
                        ? "⏳ ESPERANDO RESPUESTA"
                        : "✅ DUELO CONFIRMADO"}
                    </span>
                    <span className="text-xs font-bold opacity-75">{ch.scheduledTime}</span>
                  </div>

                  <div className="font-display text-lg font-black">
                    {pA.name} vs. {pB.name}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5 mb-3">
                    📍 {ch.customVenue || venueClub?.name || "Country Club Los Huancas"} ·{" "}
                    {ch.formatRule}
                  </div>

                  {isIncomingForMe ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => onAcceptChallenge(ch.id)}
                        className="touch-target py-3 rounded-xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14]"
                      >
                        ✓ Aceptar Desafío
                      </button>
                      <button
                        onClick={() => onRejectChallenge(ch.id)}
                        className="touch-target py-3 rounded-xl font-bold text-xs border border-rose-500/40 text-rose-400"
                      >
                        ✕ Posponer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onOpenOfficialScoreModal(ch)}
                      className="touch-target w-full py-3 rounded-xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14]"
                    >
                      ✍️ Confirmar Marcador Oficial
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-PESTAÑA 3: + LANZAR RETO (CON PRE-CÁLCULO DE PUNTOS EN CADA FILA) */}
      {subTab === "lanzar" && (
        <div className="space-y-2.5">
          <div className="rounded-2xl p-3.5 border border-[#00A3FF]/30 bg-[#00A3FF]/10 text-xs">
            <strong className="text-[#00A3FF]">🎯 Radar de Emparejamiento Oficial:</strong> Todos los
            rivales muestran tu pronóstico exacto de puntos antes de retar.
          </div>

          {players
            .filter((p) => p.active !== false && p.id !== currentUser?.id)
            .map((opp) => {
              const cat = getCategoryByElo(opp.elo);
              const club = getClubById(opp.clubId);
              const forecast = currentUser
                ? getPreMatchThresholds(currentUser, opp, totalActivePlayers)
                : { typicalWin: 95, typicalLoss: -75, maxWin: 115 };

              return (
                <div
                  key={opp.id}
                  className="rounded-2xl p-3.5 border flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <SafeImage
                        src={opp.avatar}
                        alt={opp.name}
                        circular
                        className="w-12 h-12 border-2"
                        style={{ borderColor: cat.color }}
                      />
                      {club && (
                        <SafeImage
                          src={club.shield}
                          alt={club.shortName}
                          circular
                          className="w-5 h-5 absolute -bottom-1 -right-1 border border-black"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-display font-black text-sm truncate">{opp.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold mt-0.5">
                        <span style={{ color: cat.color }}>
                          {cat.short} · {opp.elo} Pts
                        </span>
                      </div>
                      <div className="text-[10px] font-extrabold mt-0.5 tabular-nums">
                        <span className="text-emerald-400">
                          Si ganas: +{forecast.typicalWin} (Máx +{forecast.maxWin})
                        </span>{" "}
                        |{" "}
                        <span className="text-rose-400">
                          Si pierdes: {forecast.typicalLoss}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenLaunchChallengeModal(opp)}
                    className="touch-target px-3.5 py-2.5 rounded-xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14] flex-shrink-0"
                  >
                    ⚡ Retar
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 18. PESTAÑA SEDES & ENTRENADORES (CLIMA VIVO, GOLDEN TICKETS Y COACH PRO)
// ============================================================================
export const VenuesAndCoachesTabView = ({
  clubs,
  coaches,
  currentUser,
  onUpdateClubWeather,
  onAddCoachReview,
  onUpdateCoachSlots,
}) => {
  const [subTab, setSubTab] = useState("sedes"); // 'sedes' | 'coaches'
  const [huancayoLiveWeather, setHuancayoLiveWeather] = useState({
    temp: 19,
    uv: 8.5,
    conditionText: "Cielo despejado en el Valle del Mantaro",
  });
  const [selectedCoachForModal, setSelectedCoachForModal] = useState(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewNotice, setReviewNotice] = useState(null);

  // Portal Coach Pro (PIN 7777) para actualizar horarios libres sin intervención del Admin
  const [showCoachPinBox, setShowCoachPinBox] = useState(false);
  const [coachPinInput, setCoachPinInput] = useState("");
  const [coachPortalUnlocked, setCoachPortalUnlocked] = useState(false);
  const [newSlotText, setNewSlotText] = useState("");

  // Consulta en vivo Costo $0 a Open-Meteo para Huancayo (-12.0651, -75.2049)
  useEffect(() => {
    let mounted = true;
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-12.0651&longitude=-75.2049&current=temperature_2m,uv_index,weather_code&timezone=auto"
    )
      .then((r) => r.json())
      .then((data) => {
        if (!mounted || !data?.current) return;
        const t = Math.round(data.current.temperature_2m ?? 19);
        const uv = Number(data.current.uv_index ?? 8).toFixed(1);
        const code = Number(data.current.weather_code ?? 0);
        let cond = "Seco y despejado · Ideal para arcilla";
        if (code >= 51 && code <= 67) cond = "Llovizna ligera en Huancayo";
        else if (code >= 80) cond = "Lluvia / Chubascos en la zona";
        else if (code >= 1 && code <= 3) cond = "Parcialmente nublado · Templado";
        setHuancayoLiveWeather({ temp: t, uv, conditionText: cond });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmitCoachReview = (coach) => {
    if (!currentUser) return;
    const alreadyVoted = coach.reviews.some((r) => r.authorId === currentUser.id);
    if (alreadyVoted) {
      setReviewNotice("⚠️ Ya registraste una reseña verificada para este entrenador.");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewNotice("Escribe un comentario breve sobre tu progreso en cancha.");
      return;
    }
    onAddCoachReview(coach.id, {
      id: `rev-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name.replace(" (Tú)", ""),
      authorCategory: `Cat. ${getCategoryByElo(currentUser.elo).short}`,
      authorAvatar: currentUser.avatar,
      rating: Number(reviewRating),
      comment: reviewComment.trim().slice(0, 140),
      date: "Hoy · Verificada",
    });
    setReviewComment("");
    setReviewNotice("✓ ¡Tu reseña verificada fue publicada con éxito!");
  };

  return (
    <div className="space-y-4">
      {/* Cabecera con título limpio (Letra "i" perfecta en Outfit) y Widget Open-Meteo Huancayo */}
      <div
        className="rounded-3xl p-4 border flex items-center justify-between gap-3"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D6FF00] text-[#0B0E14]">
            📍 HUANCAYO EN TIEMPO REAL
          </span>
          <h2 className="font-display text-xl font-black mt-1">
            Sedes &amp; Entrenadores
          </h2>
          <p className="text-xs opacity-75">{huancayoLiveWeather.conditionText}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-display text-2xl font-black text-[#D6FF00] tabular-nums">
            {huancayoLiveWeather.temp}°C
          </div>
          <div className="text-[11px] font-extrabold text-[#00A3FF] tabular-nums">
            Índice UV: {huancayoLiveWeather.uv}
          </div>
        </div>
      </div>

      {/* Selector de Sub-pestaña: [Sedes Oficiales] | [Coach Pro (Entrenadores)] */}
      <div
        className="grid grid-cols-2 p-1 rounded-2xl border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <button
          onClick={() => setSubTab("sedes")}
          className={`touch-target py-2.5 rounded-xl font-display font-extrabold text-xs transition-all ${
            subTab === "sedes" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
          }`}
        >
          🏛️ Sedes Oficiales ({clubs.length})
        </button>
        <button
          onClick={() => setSubTab("coaches")}
          className={`touch-target py-2.5 rounded-xl font-display font-extrabold text-xs transition-all ${
            subTab === "coaches" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
          }`}
        >
          🎓 Coach Pro ({coaches.length})
        </button>
      </div>

      {/* VISTA 1: SEDES OFICIALES, GOLDEN TICKETS VIP Y SEMÁFORO CLIMÁTICO INTERACTIVO */}
      {subTab === "sedes" && (
        <div className="space-y-4">
          {clubs.map((club) => {
            const currentWeatherState =
              SURFACE_WEATHER_STATES.find((w) => w.id === club.surfaceStateId) ||
              SURFACE_WEATHER_STATES[0];

            return (
              <div
                key={club.id}
                className="rounded-3xl overflow-hidden border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {/* Cabecera Visual con Escudo Oficial y Badge Comercial "Sede Oficial" */}
                <div className="relative h-36 bg-black">
                  <SafeImage
                    src={club.bannerImage}
                    alt={club.name}
                    className="w-full h-full object-cover opacity-65"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/40 to-transparent" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="sede-oficial-badge px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-[#D6FF00] to-amber-400 text-[#0B0E14] shadow-lg">
                      ★ SEDE OFICIAL ALIADA
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/75 text-white border border-white/15">
                      {club.courtsCount} Canchas
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                    <SafeImage
                      src={club.shield}
                      alt={club.name}
                      circular
                      className="w-14 h-14 border-2 border-[#D6FF00] bg-black"
                    />
                    <div>
                      <h3 className="font-display text-lg font-black text-white leading-tight">
                        {club.name}
                      </h3>
                      <div className="text-xs text-slate-300 font-semibold">
                        📍 {club.zone} · {club.surface}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3.5">
                  {/* CUPÓN GRÁFICO VIP TROQUELADO (GOLDEN TICKET) */}
                  <div className="rounded-2xl p-3 border-2 border-dashed border-amber-400/70 bg-amber-400/10 flex items-center gap-3">
                    <SafeImage
                      src={ASSETS.goldenTicket}
                      alt="Golden Ticket VIP"
                      className="w-12 h-12 rounded-xl flex-shrink-0"
                      fallbackText="VIP"
                    />
                    <div>
                      <div className="text-[10px] font-black uppercase text-amber-300">
                        Beneficio Exclusivo Carnet Socio MATCHPOINT
                      </div>
                      <div className="font-display font-black text-sm text-white">
                        {club.vipDiscount}
                      </div>
                    </div>
                  </div>

                  {/* Servicios Reales de Sede (Sin textos irreales de préstamo de pelotas) */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {club.realServices.map((srv, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5"
                      >
                        <span className="text-[#D6FF00] font-black">✓</span>
                        <span className="opacity-90 leading-snug">{srv}</span>
                      </div>
                    ))}
                  </div>

                  {/* WIDGET CLIMÁTICO INTERACTIVO DE SUPERFICIE (4 ESTADOS ILUSTRADOS) */}
                  <div className="rounded-2xl p-3.5 border border-white/10 bg-black/25">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SafeImage
                          src={currentWeatherState.icon}
                          alt={currentWeatherState.label}
                          className="w-8 h-8 rounded-lg"
                          fallbackText="☀️"
                        />
                        <div>
                          <div
                            className="font-display font-black text-xs"
                            style={{ color: currentWeatherState.color }}
                          >
                            {currentWeatherState.label}
                          </div>
                          <div className="text-[11px] opacity-75">
                            {currentWeatherState.indicator}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] opacity-65 text-right">
                        Reportado por {club.lastReportBy} ({club.lastReportTime})
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/10">
                      {SURFACE_WEATHER_STATES.map((st) => {
                        const active = club.surfaceStateId === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() =>
                              onUpdateClubWeather(
                                club.id,
                                st.id,
                                currentUser?.name || "Socio"
                              )
                            }
                            className={`p-1.5 rounded-xl border text-center transition-all ${
                              active
                                ? "border-[#D6FF00] bg-white/15 scale-[1.02]"
                                : "border-white/10 bg-white/5 opacity-70"
                            }`}
                          >
                            <SafeImage
                              src={st.icon}
                              alt={st.label}
                              className="w-6 h-6 mx-auto mb-0.5 rounded"
                              fallbackText="☀️"
                            />
                            <div className="text-[9px] font-extrabold truncate">
                              {st.label.split(" · ")[0]}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Enlaces Directos a Google Maps y Waze */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <a
                      href={club.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="touch-target py-2.5 rounded-xl font-display font-extrabold text-xs border border-white/15 bg-white/5 text-center"
                    >
                      🗺️ Abrir Google Maps
                    </a>
                    <a
                      href={club.wazeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="touch-target py-2.5 rounded-xl font-display font-extrabold text-xs border border-[#00A3FF]/40 bg-[#00A3FF]/15 text-[#00A3FF] text-center"
                    >
                      🚗 Ir con Waze
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA 2: MARKETPLACE COACH PRO (RESEÑAS VERIFICADAS, PACKS Y VIDEOS MP4) */}
      {subTab === "coaches" && (
        <div className="space-y-4">
          {coaches.map((coach) => {
            const avgRating =
              coach.reviews.length > 0
                ? (
                    coach.reviews.reduce((acc, r) => acc + Number(r.rating), 0) /
                    coach.reviews.length
                  ).toFixed(1)
                : "5.0";

            return (
              <div
                key={coach.id}
                className="rounded-3xl p-4 border space-y-4"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {/* Cabecera del Entrenador con Retrato Deportivo y Escudo Coach Pro */}
                <div className="flex items-start gap-3.5">
                  <div className="relative flex-shrink-0">
                    <SafeImage
                      src={coach.avatar}
                      alt={coach.name}
                      className="w-20 h-24 rounded-2xl border-2 border-[#D6FF00]"
                    />
                    <SafeImage
                      src={ASSETS.escudoCoach}
                      alt="Coach Pro"
                      circular
                      className="w-7 h-7 absolute -bottom-1.5 -right-1.5 border border-black bg-black"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-[#0B0E14]">
                      ★ { coach.certification }
                    </span>
                    <h3 className="font-display text-xl font-black mt-1 leading-tight">
                      {coach.name}
                    </h3>
                    <div className="text-xs opacity-75 mt-0.5">
                      📍 {coach.clubs.join(" · ")}
                    </div>

                    {/* Píldoras de Especialidad */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {coach.specialties.map((sp, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#00A3FF]/15 text-[#00A3FF] border border-[#00A3FF]/30"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LAS 3 MÉTRICAS DEPORTIVAS DE ALTO VALOR (CERO "420H EN CANCHA") */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="font-display text-base font-black text-amber-400">
                      ★ {avgRating} ({coach.reviews.length})
                    </div>
                    <div className="text-[10px] font-bold opacity-75">Valoración Real</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="font-display text-base font-black text-[#D6FF00]">
                      {coach.basePriceLabel}
                    </div>
                    <div className="text-[10px] font-bold opacity-75">Tarifa Transparente</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="font-display text-base font-black text-emerald-400">
                      +{coach.studentsPromoted} Alumnos
                    </div>
                    <div className="text-[10px] font-bold opacity-75">Ascendidos ELO</div>
                  </div>
                </div>

                {/* Botón de Video MP4 Bajo Demanda (preload="none" y playsInline) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setActiveVideoUrl(
                        activeVideoUrl === coach.verticalVideo ? null : coach.verticalVideo
                      )
                    }
                    className="touch-target flex-1 py-2.5 rounded-xl font-display font-extrabold text-xs border border-[#00A3FF]/50 bg-[#00A3FF]/15 text-[#00A3FF]"
                  >
                    {activeVideoUrl === coach.verticalVideo
                      ? "⏹ Ocultar Video en Cancha"
                      : "▶ Ver Video Demostrativo en Cancha"}
                  </button>
                  <button
                    onClick={() =>
                      setSelectedCoachForModal(
                        selectedCoachForModal?.id === coach.id ? null : coach
                      )
                    }
                    className="touch-target flex-1 py-2.5 rounded-xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14]"
                  >
                    Ver Packs, Turnos y Reseñas ⚡
                  </button>
                </div>

                {activeVideoUrl === coach.verticalVideo && (
                  <div className="rounded-2xl overflow-hidden border border-[#00A3FF]/40 bg-black">
                    <video
                      src={coach.verticalVideo}
                      controls
                      playsInline
                      preload="none"
                      className="w-full max-h-80 object-contain mx-auto"
                    />
                  </div>
                )}

                {/* FICHA EXPANDIDA DE CONVERSIÓN COMERCIAL: PACKS, HORARIOS Y RESEÑAS VERIFICADAS */}
                {selectedCoachForModal?.id === coach.id && (
                  <div className="pt-3 border-t border-white/15 space-y-4">
                    {/* Tarjetas Comerciales de Programas y Packs */}
                    <div className="space-y-2.5">
                      <h4 className="font-display text-sm font-black uppercase text-[#00A3FF]">
                        📦 Programas Deportivos y Packs de Subida ELO
                      </h4>
                      {coach.packs.map((pk) => (
                        <div
                          key={pk.id}
                          className="p-3.5 rounded-2xl bg-[#151921] border border-[#00A3FF]/40 relative overflow-hidden"
                        >
                          {pk.promoBadge && (
                            <span className="inline-block mb-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#D6FF00] text-[#0B0E14]">
                              ★ {pk.promoBadge}
                            </span>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-display font-black text-sm text-white">
                                {pk.title}
                              </div>
                              <div className="text-xs text-slate-300 mt-0.5">{pk.detail}</div>
                            </div>
                            <div className="font-display text-xl font-black text-[#D6FF00] tabular-nums flex-shrink-0">
                              {pk.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Parrilla de Turnos Libres con Disparo Directo a WhatsApp */}
                    <div>
                      <h4 className="font-display text-sm font-black uppercase text-[#D6FF00] mb-2">
                        📅 Huecos Libres esta Semana (Toca para Reservar por WhatsApp)
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {coach.availableSlots.map((slot, sIdx) => (
                          <a
                            key={sIdx}
                            href={`https://wa.me/51${coach.whatsapp}?text=${encodeURIComponent(
                              `¡Hola ${coach.name}! Soy ${currentUser?.name || "socio de MATCHPOINT"} y quiero reservar el turno libre: ${slot}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="touch-target p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-extrabold text-emerald-300 text-center"
                          >
                            ⚡ {slot}
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Módulo de Reseñas Reales Verificadas + Candado Anti-Spam */}
                    <div className="space-y-2.5 pt-2 border-t border-white/10">
                      <h4 className="font-display text-sm font-black uppercase">
                        ⭐ Testimonios Verificados de Alumnos ({coach.reviews.length})
                      </h4>
                      {coach.reviews.map((rv) => (
                        <div
                          key={rv.id}
                          className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3"
                        >
                          <SafeImage
                            src={rv.authorAvatar}
                            alt={rv.authorName}
                            circular
                            className="w-10 h-10 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">
                                {rv.authorName}{" "}
                                <span className="text-[#00A3FF]">({rv.authorCategory})</span>
                              </span>
                              <span className="text-xs font-black text-amber-400">
                                {"★".repeat(rv.rating)}
                              </span>
                            </div>
                            <p className="text-xs opacity-85 mt-1 italic">"{rv.comment}"</p>
                          </div>
                        </div>
                      ))}

                      {/* Formulario [+ Dejar Reseña sobre este Coach] */}
                      <div className="p-3 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>+ Dejar Reseña Verificada sobre este Coach</span>
                          <select
                            value={reviewRating}
                            onChange={(e) => setReviewRating(e.target.value)}
                            className="p-1 rounded bg-white/10 text-amber-400 font-black"
                          >
                            <option value={5}>★★★★★ (5/5)</option>
                            <option value={4}>★★★★☆ (4/5)</option>
                            <option value={3}>★★★☆☆ (3/5)</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          maxLength={140}
                          placeholder="Escribe cómo mejoró tu juego (máx. 140 caracteres)..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                        />
                        {reviewNotice && (
                          <div className="text-[11px] font-bold text-[#D6FF00]">
                            {reviewNotice}
                          </div>
                        )}
                        <button
                          onClick={() => handleSubmitCoachReview(coach)}
                          className="touch-target w-full py-2.5 rounded-xl font-display font-black text-xs bg-[#00A3FF] text-white"
                        >
                          Publicar Reseña Verificada
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Tarjeta Institucional al Final: Portal Coach Pro (PIN 7777) */}
          <div
            className="rounded-3xl p-4 border text-xs"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display font-black text-sm">
                  🎓 ¿Eres entrenador certificado en Huancayo?
                </div>
                <div className="opacity-75">
                  Actualiza tus turnos libres de la semana desde el Portal Coach Pro.
                </div>
              </div>
              <button
                onClick={() => setShowCoachPinBox(!showCoachPinBox)}
                className="touch-target px-3 py-2 rounded-xl font-bold border border-[#D6FF00]/40 text-[#D6FF00]"
              >
                Ingreso PIN 7777
              </button>
            </div>

            {showCoachPinBox && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                {!coachPortalUnlocked ? (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Ingresa PIN Coach (7777)"
                      value={coachPinInput}
                      onChange={(e) => setCoachPinInput(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/20 text-white"
                    />
                    <button
                      onClick={() => {
                        if (coachPinInput === "7777") setCoachPortalUnlocked(true);
                      }}
                      className="touch-target px-4 py-2 rounded-xl font-display font-black bg-[#D6FF00] text-[#0B0E14]"
                    >
                      Entrar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-bold text-emerald-400">
                      ✓ Portal Coach Pro Activo · Agregar nuevo horario disponible:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. Viernes 16:00 · Country Club"
                        value={newSlotText}
                        onChange={(e) => setNewSlotText(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/20 text-white"
                      />
                      <button
                        onClick={() => {
                          if (!newSlotText.trim()) return;
                          onUpdateCoachSlots(coaches[0].id, newSlotText.trim());
                          setNewSlotText("");
                        }}
                        className="touch-target px-4 py-2 rounded-xl font-display font-black bg-[#D6FF00] text-[#0B0E14]"
                      >
                        + Publicar Turno
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 19. PESTAÑA TORNEOS OFICIALES (SORTEO PURO, ROUND ROBIN Y RONDA CONSUELO)
// ============================================================================
export const TournamentsTabView = ({
  tournaments,
  players,
  currentUser,
  onToggleEnrollTournament,
  onOpenAdminPinModal,
}) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState(
    tournaments[0]?.id || "tor-master-4ta"
  );
  const [bracketTab, setBracketTab] = useState("main"); // 'main' | 'consolation' | 'participants'

  const activeTournament =
    tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];

  if (!activeTournament) return null;

  const isEnrolled =
    currentUser && activeTournament.enrolledIds.includes(currentUser.id);
  const clubObj = getClubById(activeTournament.clubId);

  return (
    <div className="space-y-4">
      {/* Selector de Torneos Activos */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tournaments.map((tor) => (
          <button
            key={tor.id}
            onClick={() => setSelectedTournamentId(tor.id)}
            className={`touch-target px-3.5 py-2 rounded-2xl font-display font-black text-xs whitespace-nowrap border transition-all ${
              selectedTournamentId === tor.id
                ? "bg-[#D6FF00] text-[#0B0E14] border-[#D6FF00]"
                : "bg-white/5 border-white/10 opacity-80"
            }`}
          >
            🏆 {tor.categoryShort} · {tor.venueName}
          </button>
        ))}
      </div>

      {/* TARJETA DE TORNEO CON TÍTULO ABAJO PARA DESPEJAR LA FOTO DE LA CANCHA ARRIBA */}
      <div
        className="rounded-3xl overflow-hidden border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="relative h-44 bg-black">
          <SafeImage
            src={activeTournament.banner}
            alt={activeTournament.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/30 to-transparent" />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#D6FF00] text-[#0B0E14]">
              CIRCUITO OFICIAL MATCHPOINT
            </span>
            {clubObj && (
              <SafeImage
                src={clubObj.shield}
                alt={clubObj.shortName}
                circular
                className="w-10 h-10 border-2 border-white bg-black"
              />
            )}
          </div>

          {/* Título bajado a la base inferior con Outfit Black */}
          <div className="absolute bottom-3 left-4 right-4">
            <div className="text-xs font-extrabold text-[#D6FF00]">
              📅 {activeTournament.dates} · Inscripción: {activeTournament.entryFee}
            </div>
            <h2 className="font-display text-xl font-black text-white leading-tight">
              {activeTournament.title}
            </h2>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {activeTournament.format}
            </div>
          </div>
        </div>

        {/* Botones Operativos: + Inscribirme y Navegación de Cuadros */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold">
              Inscritos:{" "}
              <strong className="text-[#D6FF00]">
                {activeTournament.enrolledIds.length} / {activeTournament.maxSlots} cupos
              </strong>
            </div>
            <button
              onClick={() => onToggleEnrollTournament(activeTournament.id)}
              className={`touch-target px-4 py-2.5 rounded-xl font-display font-black text-xs ${
                isEnrolled
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-[#D6FF00] text-[#0B0E14]"
              }`}
            >
              {isEnrolled ? "✓ Inscrito en el Cuadro" : "+ Inscribirme al Torneo"}
            </button>
          </div>

          {/* Sub-pestañas sin "Siembra Preferente": Cuadro Principal | Ronda Consuelo | Participantes & Sorteo */}
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-black/30 border border-white/10">
            <button
              onClick={() => setBracketTab("main")}
              className={`touch-target py-2 rounded-xl font-display font-extrabold text-[11px] ${
                bracketTab === "main" ? "bg-[#00A3FF] text-white" : "opacity-75"
              }`}
            >
              Cuadro Principal
            </button>
            <button
              onClick={() => setBracketTab("consolation")}
              className={`touch-target py-2 rounded-xl font-display font-extrabold text-[11px] ${
                bracketTab === "consolation" ? "bg-[#00A3FF] text-white" : "opacity-75"
              }`}
            >
              Ronda Consuelo
            </button>
            <button
              onClick={() => setBracketTab("participants")}
              className={`touch-target py-2 rounded-xl font-display font-extrabold text-[11px] ${
                bracketTab === "participants" ? "bg-[#00A3FF] text-white" : "opacity-75"
              }`}
            >
              Participantes ({activeTournament.enrolledIds.length})
            </button>
          </div>

          {/* CUADRO PRINCIPAL */}
          {bracketTab === "main" && (
            <div className="space-y-2.5">
              {activeTournament.mainBracket.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-[#00A3FF] uppercase">
                    <span>{m.round}</span>
                    <span>{m.status}</span>
                  </div>
                  <div className="flex items-center justify-between font-display font-black text-sm">
                    <span>
                      {m.playerA} vs. {m.playerB}
                    </span>
                    <span className="text-[#D6FF00] tabular-nums">{m.score}</span>
                  </div>
                </div>
              ))}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="opacity-75">
                  🔐 Solo el Comité / Administrador valida cierres de llave en torneos.
                </span>
                <button
                  onClick={onOpenAdminPinModal}
                  className="font-bold text-[#D6FF00] underline ml-2 whitespace-nowrap"
                >
                  Suite Admin
                </button>
              </div>
            </div>
          )}

          {/* RONDA CONSUELO AUTOMÁTICA */}
          {bracketTab === "consolation" && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-[#00A3FF]/10 border border-[#00A3FF]/30 text-xs">
                <strong>🛡️ Garantía de 2 Partidos:</strong> Todo jugador que cae en primera ronda
                pasa automáticamente al cuadro de Ronda Consuelo sin costo adicional.
              </div>
              {activeTournament.consolationBracket.length === 0 ? (
                <div className="p-4 text-center text-xs opacity-75">
                  Este torneo utiliza formato Round Robin (Todos contra todos · 3 partidos
                  garantizados en fase de grupos).
                </div>
              ) : (
                activeTournament.consolationBracket.map((cm) => (
                  <div
                    key={cm.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div className="text-[10px] font-extrabold text-amber-400 uppercase">
                      {cm.round}
                    </div>
                    <div className="flex items-center justify-between font-display font-black text-sm mt-1">
                      <span>
                        {cm.playerA} vs. {cm.playerB}
                      </span>
                      <span className="text-xs opacity-80">{cm.score}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PARTICIPANTES & SORTEO TRANSPARENTE (SIN SIEMBRA PREFERENTE) */}
          {bracketTab === "participants" && (
            <div className="space-y-2">
              <div className="text-xs opacity-75 mb-1">
                Emparejamientos equitativos por sorteo transparente de cuadro (sin privilegios ni
                siembra arbitraria).
              </div>
              {activeTournament.enrolledIds.map((pid, idx) => {
                const pl = players.find((p) => p.id === pid);
                if (!pl) return null;
                const cl = getClubById(pl.clubId);
                return (
                  <div
                    key={pid}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-display font-black text-xs w-5 text-[#D6FF00]">
                        #{idx + 1}
                      </span>
                      <SafeImage
                        src={pl.avatar}
                        alt={pl.name}
                        circular
                        className="w-8 h-8"
                      />
                      <div>
                        <div className="font-bold text-xs">{pl.name}</div>
                        <div className="text-[10px] opacity-70">
                          {cl ? cl.shortName : "Independiente"}
                        </div>
                      </div>
                    </div>
                    <span className="font-display font-black text-xs text-[#00A3FF] tabular-nums">
                      {pl.elo} Pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 5 DE 6 ===

// === INICIO DEL BLOQUE 6 DE 6 ===

// ============================================================================
// 20. SUITE ADMIN (PIN 1234), RECUPERACIÓN DE CLAVE, PRO SHOP Y MENÚ LIMPIO
// ============================================================================
export const AdminSuiteModal = ({
  isOpen,
  players,
  tournaments,
  onClose,
  onResetPlayerPassword,
  onUnlinkPlayerEmail,
  onTogglePlayerActive,
  onDeleteGhostPlayer,
  onExecuteSeasonReset,
  onAdminValidateTournamentMatch,
}) => {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [adminTab, setAdminTab] = useState("cuentas"); // 'cuentas' | 'torneos' | 'temporada'
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [newEmailText, setNewEmailText] = useState("");
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  if (!isOpen) return null;

  const notify = (msg) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 safe-modal-top">
      <div
        className="w-full max-w-md rounded-3xl p-5 border overflow-y-auto max-h-[88dvh]"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#D6FF00] text-[#0B0E14]">
            🔐 SUITE ADMIN · GESTIÓN TÉCNICA
          </span>
          <button onClick={onClose} className="touch-target rounded-full bg-white/10 font-bold">
            ✕
          </button>
        </div>

        {!unlocked ? (
          <div className="space-y-3 py-2">
            <h3 className="font-display text-xl font-black">Ingresa el PIN del Comité</h3>
            <p className="text-xs opacity-75">
              Acceso exclusivo para administración de cuentas, validación de cuadros de torneo y
              cierre de temporada (PIN oficial: <strong>1234</strong>).
            </p>
            <input
              type="password"
              placeholder="PIN de 4 dígitos (1234)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-3 rounded-2xl bg-black/50 border border-white/20 text-center font-display text-2xl font-black tracking-widest text-[#D6FF00]"
            />
            <button
              onClick={() => {
                if (pin === "1234") setUnlocked(true);
                else notify("⚠️ PIN incorrecto. Usa 1234.");
              }}
              className="touch-target w-full py-3.5 rounded-2xl font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]"
            >
              Desbloquear Suite Admin ⚡
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackBanner && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-xs font-bold text-emerald-300 text-center">
                {feedbackBanner}
              </div>
            )}

            <div className="grid grid-cols-3 p-1 rounded-2xl bg-black/30 border border-white/10 text-xs font-extrabold">
              <button
                onClick={() => setAdminTab("cuentas")}
                className={`py-2 rounded-xl ${
                  adminTab === "cuentas" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
                }`}
              >
                Cuentas ({players.length})
              </button>
              <button
                onClick={() => setAdminTab("torneos")}
                className={`py-2 rounded-xl ${
                  adminTab === "torneos" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
                }`}
              >
                Llaves Torneo
              </button>
              <button
                onClick={() => setAdminTab("temporada")}
                className={`py-2 rounded-xl ${
                  adminTab === "temporada" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
                }`}
              >
                Piso Temporada
              </button>
            </div>

            {/* MÓDULO 1: GESTIÓN DE CUENTAS, CORREOS, CLAVES E INACTIVOS */}
            {adminTab === "cuentas" && (
              <div className="space-y-2.5 max-h-[54dvh] overflow-y-auto pr-1">
                {players.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-display font-black text-sm">
                          {pl.name}{" "}
                          <span className="text-[#D6FF00] tabular-nums">({pl.elo} pts)</span>
                        </div>
                        <div className="text-[11px] opacity-70">{pl.email}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          pl.active !== false
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {pl.active !== false ? "ACTIVO" : "PAUSADO"}
                      </span>
                    </div>

                    {editingEmailId === pl.id && (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="email"
                          placeholder="Nuevo correo electrónico..."
                          value={newEmailText}
                          onChange={(e) => setNewEmailText(e.target.value)}
                          className="flex-1 p-2 rounded-xl bg-black/50 border border-[#00A3FF] text-white"
                        />
                        <button
                          onClick={() => {
                            if (newEmailText.trim()) {
                              onUnlinkPlayerEmail(pl.id, newEmailText.trim());
                              setEditingEmailId(null);
                              setNewEmailText("");
                              notify(`✓ Correo actualizado para ${pl.name} sin perder su ELO.`);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl font-black bg-[#00A3FF] text-white"
                        >
                          Guardar
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setEditingEmailId(editingEmailId === pl.id ? null : pl.id);
                          setNewEmailText(pl.email || "");
                        }}
                        className="p-2 rounded-xl border border-white/15 bg-white/5 font-bold"
                      >
                        ✉️ Liberar / Cambiar Correo
                      </button>
                      <button
                        onClick={() => {
                          onResetPlayerPassword(pl.id);
                          notify(`✓ Clave de ${pl.name} restablecida a temporal: Tenis2026`);
                        }}
                        className="p-2 rounded-xl border border-[#00A3FF]/40 bg-[#00A3FF]/15 text-[#00A3FF] font-bold"
                      >
                        🔑 Reset Clave (Tenis2026)
                      </button>
                      <button
                        onClick={() => {
                          onTogglePlayerActive(pl.id);
                          notify(
                            `✓ Estado de ${pl.name} cambiado (${
                              pl.active !== false ? "Oculto del ranking activo" : "Reactivado"
                            }).`
                          );
                        }}
                        className="p-2 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300 font-bold"
                      >
                        {pl.active !== false ? "⏸ Pausar Inactivo" : "▶ Reactivar Cuenta"}
                      </button>
                      {!pl.isCurrentUser && (
                        <button
                          onClick={() => {
                            onDeleteGhostPlayer(pl.id);
                            notify(`🗑️ Cuenta fantasma eliminada.`);
                          }}
                          className="p-2 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold"
                        >
                          🗑️ Borrar Fantasma
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MÓDULO 2: CONTROL EXCLUSIVO DE LLAVES DE TORNEOS POR EL ADMINISTRADOR */}
            {adminTab === "torneos" && (
              <div className="space-y-3 text-xs">
                <p className="opacity-80">
                  Valida marcadores oficiales de torneos para avanzar al ganador en el cuadro
                  principal y enviar automáticamente al perdedor de 1ra ronda a Consuelo:
                </p>
                {tournaments.map((tor) => (
                  <div
                    key={tor.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2"
                  >
                    <div className="font-display font-black text-sm text-[#D6FF00]">
                      {tor.title}
                    </div>
                    {tor.mainBracket.map((match) => (
                      <div
                        key={match.id}
                        className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold">
                            {match.playerA} vs. {match.playerB}
                          </div>
                          <div className="text-[10px] opacity-70">
                            {match.round} · {match.score}
                          </div>
                        </div>
                        {!match.winner ? (
                          <button
                            onClick={() => {
                              onAdminValidateTournamentMatch(
                                tor.id,
                                match.id,
                                match.playerB,
                                match.playerA,
                                "6-4, 6-3"
                              );
                              notify("✓ Llave oficial validada y Ronda Consuelo actualizada.");
                            }}
                            className="px-3 py-1.5 rounded-xl font-black bg-[#D6FF00] text-[#0B0E14]"
                          >
                            ✓ Validar Acta
                          </button>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-400">
                            ✓ Ganó {match.winner.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* MÓDULO 3: CIERRE DE TEMPORADA Y RESET DE PISO ESTILO CLASH ROYALE */}
            {adminTab === "temporada" && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 space-y-1.5">
                  <div className="font-display font-black text-sm text-amber-300">
                    🏆 Cierre de Temporada y Alineación al Piso Exacto
                  </div>
                  <p className="opacity-85 leading-relaxed">
                    Al ejecutar el cierre de temporada, el sistema clasifica al{" "}
                    <strong>Top 8 de cada categoría</strong> al Master Final y aplica la regla de
                    piso hacia abajo: cada jugador se alinea al múltiplo de 1,000 inferior de su
                    categoría (ej. 3,490 ➔ 3,000 | 2,880 ➔ 2,000).
                  </p>
                </div>
                <button
                  onClick={() => {
                    onExecuteSeasonReset();
                    notify("✓ Temporada cerrada: todos los jugadores alineados al piso de su categoría.");
                  }}
                  className="touch-target w-full py-3.5 rounded-2xl font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]"
                >
                  ⚡ Ejecutar Reset de Piso de Nueva Temporada
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Modal de Login y Recuperación de Contraseña (Con Ojo Mostrar/Ocultar Clave)
export const LoginAndRecoveryModal = ({ isOpen, onClose, onSwitchAccount, players }) => {
  const [mode, setMode] = useState("login"); // 'login' | 'recover'
  const [emailInput, setEmailInput] = useState("pablo@matchpoint.pe");
  const [passwordInput, setPasswordInput] = useState("Tenis2026");
  const [showPassword, setShowPassword] = useState(false);
  const [whatsappVerify, setWhatsappVerify] = useState("");
  const [newPass, setNewPass] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleQuickRecovery = () => {
    const found = players.find(
      (p) =>
        p.email?.toLowerCase() === emailInput.trim().toLowerCase() &&
        p.whatsapp === whatsappVerify.trim()
    );
    if (!found) {
      setStatusMessage(
        "⚠️ No coinciden el correo y el WhatsApp. Usa el botón de asistencia directa del Comité."
      );
      return;
    }
    setStatusMessage(`✓ Verificación exitosa para ${found.name}. Tu nueva clave ha sido activada.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 safe-modal-top">
      <div
        className="w-full max-w-md rounded-3xl p-5 border overflow-y-auto max-h-[88dvh]"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SafeImage src={ASSETS.logo} alt="MATCHPOINT" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-black text-lg">Acceso MATCHPOINT</span>
          </div>
          <button onClick={onClose} className="touch-target rounded-full bg-white/10 font-bold">
            ✕
          </button>
        </div>

        {mode === "login" ? (
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1">Correo Electrónico Obligatorio:</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/40 border border-white/20 text-white font-semibold"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Contraseña:</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-3 pr-16 rounded-xl bg-black/40 border border-white/20 text-white font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-bold"
                >
                  {showPassword ? "🙈 Ocultar" : "👁️ Ver"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setMode("recover")}
                className="text-[#00A3FF] font-bold underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              onClick={() => {
                const match = players.find(
                  (p) => p.email?.toLowerCase() === emailInput.trim().toLowerCase()
                );
                if (match) {
                  onSwitchAccount(match.id);
                  onClose();
                } else {
                  setStatusMessage("Selecciona una de las 10 cuentas demo abajo o verifica el correo.");
                }
              }}
              className="touch-target w-full py-3.5 rounded-2xl font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]"
            >
              Iniciar Sesión ⚡
            </button>

            {/* Selector Rápido de las 10 Cuentas Reales Precargadas para Pruebas */}
            <div className="pt-3 border-t border-white/10">
              <div className="font-bold opacity-75 mb-2">
                🔄 Cambio Rápido entre los 10 Perfiles Demo de Huancayo:
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSwitchAccount(p.id);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-left truncate hover:border-[#D6FF00]"
                  >
                    <span className="font-bold block truncate">{p.name}</span>
                    <span className="text-[10px] text-[#D6FF00]">{p.elo} Pts</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <h4 className="font-display text-base font-black text-[#00A3FF]">
              🔑 Recuperación Rápida de Contraseña
            </h4>
            <p className="opacity-80">
              Verifica tu correo registrado junto con tu número de WhatsApp para restablecer tu
              contraseña al instante:
            </p>
            <input
              type="email"
              placeholder="Tu correo registrado..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-white"
            />
            <input
              type="text"
              placeholder="Tu número de WhatsApp (ej. 964556677)"
              value={whatsappVerify}
              onChange={(e) => setWhatsappVerify(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-white"
            />
            <input
              type="password"
              placeholder="Escribe tu nueva contraseña"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/20 text-white"
            />
            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-white/10 text-[#D6FF00] font-bold">
                {statusMessage}
              </div>
            )}
            <button
              onClick={handleQuickRecovery}
              className="touch-target w-full py-3 rounded-xl font-display font-black bg-[#D6FF00] text-[#0B0E14]"
            >
              Restablecer Contraseña Ahora
            </button>
            <a
              href={`https://wa.me/51964556677?text=${encodeURIComponent(
                `¡Hola Comité MATCHPOINT! Olvidé mi clave y solicito reseteo para mi correo: ${emailInput}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="touch-target w-full py-2.5 rounded-xl font-bold border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 text-center block"
            >
              💬 Pedir Reseteo Directo al Comité por WhatsApp
            </a>
            <button
              onClick={() => setMode("login")}
              className="w-full text-center opacity-75 underline pt-1"
            >
              ← Volver a Iniciar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal PRO SHOP (Con Raqueta 3D girando solo sobre eje vertical rotateY y Precio Socio VIP)
export const ProShopModal = ({ isOpen, isLightMode, onClose, currentUser }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 safe-modal-top">
      <div
        className="w-full max-w-md rounded-3xl p-5 border overflow-y-auto max-h-[88dvh]"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full p-1 bg-white/10 border border-[#D6FF00] flex items-center justify-center">
              <SafeImage
                src={ASSETS.proshopRollo}
                alt="Pro Shop"
                circular
                className="w-full h-full"
              />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#D6FF00] text-[#0B0E14]">
                ⚡ TIENDA OFICIAL DEL CIRCUITO
              </span>
              <h3 className="font-display text-xl font-black">MATCHPOINT PRO SHOP</h3>
            </div>
          </div>
          <button onClick={onClose} className="touch-target rounded-full bg-white/10 font-bold">
            ✕
          </button>
        </div>

        {/* Banner 3D con Raqueta girando exclusivamente sobre su eje vertical (rotateY) */}
        <div className="rounded-2xl p-4 mb-4 border border-[#00A3FF]/40 bg-gradient-to-r from-[#0B0E14] via-[#131C2E] to-[#0B0E14] flex items-center justify-between">
          <div className="pr-2">
            <div className="text-[11px] font-black text-[#D6FF00] uppercase">
              Descuento Activo Carnet VIP
            </div>
            <div className="font-display text-lg font-black text-white leading-tight mt-0.5">
              Encordado Electrónico &amp; Accesorios Pro
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Precios preferenciales para jugadores activos del ranking en Huancayo.
            </p>
          </div>
          <SafeImage
            src={isLightMode ? ASSETS.raquetaOscuraLight : ASSETS.raquetaProDark}
            alt="Raqueta 3D Pro"
            className="w-20 h-20 object-contain racket-3d-spin flex-shrink-0"
            fallbackText="🎾"
          />
        </div>

        <div className="space-y-3">
          {PRO_SHOP_ITEMS.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between gap-3"
            >
              <SafeImage
                src={item.image}
                alt={item.title}
                className="w-14 h-14 rounded-2xl p-1 bg-white/10 border border-white/15 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-[#00A3FF] uppercase">
                  {item.category}
                </span>
                <div className="font-display font-black text-sm leading-snug">{item.title}</div>
                <div className="text-[11px] opacity-75 mt-0.5">{item.detail}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs line-through opacity-50">{item.publicPrice}</span>
                  <span className="px-2.5 py-0.5 rounded-lg font-display font-black text-sm bg-[#D6FF00] text-[#0B0E14]">
                    Socio VIP: {item.vipPrice}
                  </span>
                </div>
              </div>
              <a
                href={`https://wa.me/51964556677?text=${encodeURIComponent(
                  `¡Hola MATCHPOINT Pro Shop! Soy ${currentUser?.name || "socio"} y deseo solicitar: ${item.title} (${item.vipPrice}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="touch-target px-3 py-2 rounded-xl font-display font-black text-xs bg-[#00A3FF] text-white flex-shrink-0"
              >
                Pedir ⚡
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Menú de 3 Rayitas (☰) Limpio (3 Secciones Institucionales + Políticas ELO + Videos Circuito)
export const InstitutionalMenuModal = ({
  isOpen,
  initialSection = "elo",
  onClose,
  onGoToSedes,
  onOpenLoginModal,
}) => {
  const [section, setSection] = useState(initialSection); // 'elo' | 'beneficios' | 'comite'
  const [playCircuitVideo, setPlayCircuitVideo] = useState(false);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 safe-modal-top">
      <div
        className="w-full max-w-md rounded-3xl p-5 border overflow-y-auto max-h-[88dvh]"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SafeImage src={ASSETS.logo} alt="MATCHPOINT" className="w-8 h-8 rounded-lg" />
            <div>
              <h3 className="font-display text-lg font-black leading-none">MATCHPOINT</h3>
              <span className="text-[11px] opacity-70">Menú Institucional del Circuito</span>
            </div>
          </div>
          <button onClick={onClose} className="touch-target rounded-full bg-white/10 font-bold">
            ✕
          </button>
        </div>

        {/* Las 3 Secciones Institucionales Limpias */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/10 mb-4 text-[11px] font-extrabold">
          <button
            onClick={() => setSection("elo")}
            className={`py-2 rounded-xl ${
              section === "elo" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
            }`}
          >
            1. Reglas ELO
          </button>
          <button
            onClick={() => setSection("beneficios")}
            className={`py-2 rounded-xl ${
              section === "beneficios" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
            }`}
          >
            2. Beneficios VIP
          </button>
          <button
            onClick={() => setSection("comite")}
            className={`py-2 rounded-xl ${
              section === "comite" ? "bg-[#D6FF00] text-[#0B0E14]" : "opacity-75"
            }`}
          >
            3. Comité
          </button>
        </div>

        {section === "elo" && (
          <div className="space-y-2.5 text-xs">
            <div className="font-display font-black text-base text-[#D6FF00]">
              ⚖️ Políticas Oficiales del Sistema ELO (Escala 0–5,000 Pts)
            </div>
            {ELO_POLICIES_SUMMARY.map((pol, i) => (
              <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#00A3FF]/20 text-[#00A3FF]">
                  {pol.badge}
                </span>
                <div className="font-display font-black text-sm mt-1">{pol.title}</div>
                <p className="opacity-80 mt-0.5 leading-relaxed">{pol.desc}</p>
              </div>
            ))}
          </div>
        )}

        {section === "beneficios" && (
          <div className="space-y-3 text-xs">
            <div className="font-display font-black text-base text-amber-300">
              🎫 Clubes Aliados y Video del Circuito
            </div>
            <p className="opacity-80">
              Tu membresía activa de MATCHPOINT incluye descuentos directos en alquiler de canchas de
              arcilla en Country Club Los Huancas, Romina Cutipa, Club Tauro y Los Inkas.
            </p>
            <button
              onClick={() => setPlayCircuitVideo(!playCircuitVideo)}
              className="touch-target w-full py-2.5 rounded-xl font-display font-black border border-[#00A3FF] text-[#00A3FF]"
            >
              {playCircuitVideo
                ? "⏹ Cerrar Video del Circuito"
                : "▶ Ver Video Oficial del Circuito (Bajo Demanda)"}
            </button>
            {playCircuitVideo && (
              <video
                src={ASSETS.videoCircuitoH1}
                controls
                playsInline
                preload="none"
                className="w-full rounded-2xl border border-white/15 bg-black"
              />
            )}
            <button
              onClick={() => {
                onClose();
                onGoToSedes();
              }}
              className="touch-target w-full py-3 rounded-xl font-display font-black bg-[#D6FF00] text-[#0B0E14]"
            >
              Ir a Sedes y Golden Tickets VIP ➔
            </button>
          </div>
        )}

        {section === "comite" && (
          <div className="space-y-3 text-xs">
            <div className="font-display font-black text-base text-[#00A3FF]">
              🏛️ Contacto con el Comité del Circuito
            </div>
            <p className="opacity-80 leading-relaxed">
              ¿Necesitas reportar una incidencia en cancha, inscribir tu club como sede aliada o
              cambiar de cuenta?
            </p>
            <a
              href="https://wa.me/51964556677?text=Hola%20Comit%C3%A9%20MATCHPOINT%20Huancayo"
              target="_blank"
              rel="noreferrer"
              className="touch-target w-full py-3 rounded-xl font-display font-black bg-emerald-500 text-[#0B0E14] text-center block"
            >
              💬 Contactar Comité por WhatsApp Oficial
            </a>
            <button
              onClick={() => {
                onClose();
                onOpenLoginModal();
              }}
              className="touch-target w-full py-3 rounded-xl font-bold border border-white/20 bg-white/5"
            >
              🔄 Cambiar de Cuenta / Iniciar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 21. COMPONENTE PRINCIPAL <App /> (INTEGRACIÓN TOTAL DE LOS 7 BLOQUES)
// ============================================================================
export default function App() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [activeTab, setActiveTab] = useState("ranking"); // 'perfil' | 'ranking' | 'retos' | 'sedes' | 'torneos'
  const [players, setPlayers] = useState(INITIAL_PLAYERS_HUANCAYO);
  const [currentUserId, setCurrentUserId] = useState("p-pablo");
  const [challenges, setChallenges] = useState(INITIAL_CHALLENGES);
  const [clubs, setClubs] = useState(HUANCAYO_CLUBS);
  const [coaches, setCoaches] = useState(INITIAL_COACHES_PRO);
  const [tournaments, setTournaments] = useState(INITIAL_TOURNAMENTS);
  const [newsList, setNewsList] = useState(INITIAL_TENNIS_NEWS);
  const [atpScores] = useState(INITIAL_ATP_LIVE_SCORES);
  const [showNewsStrip, setShowNewsStrip] = useState(true);

  // Estados de Modales y Tutorial Interactivo
  const [showProShop, setShowProShop] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuInitialSection, setMenuInitialSection] = useState("elo");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0); // 0 = inactivo, 1..4 = pasos activos

  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);
  const [opponentForChallengeModal, setOpponentForChallengeModal] = useState(null);
  const [challengeForScoreModal, setChallengeForScoreModal] = useState(null);
  const [storyPosterData, setStoryPosterData] = useState(null);
  const [incomingPopupDismissed, setIncomingPopupDismissed] = useState(false);

  // Estados de Animación Física de Cambio de Puesto en el Ranking
  const [animatedPlayerId, setAnimatedPlayerId] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [celebrationToast, setCelebrationToast] = useState(null);

  const currentUser = useMemo(
    () => players.find((p) => p.id === currentUserId) || players[0],
    [players, currentUserId]
  );

  // Detección por ID único de reto entrante pendiente para mostrar Pop-up al iniciar sesión
  const pendingIncomingChallenge = useMemo(() => {
    if (!currentUser || incomingPopupDismissed) return null;
    return challenges.find(
      (c) => c.status === "pending" && c.challengedId === currentUser.id
    );
  }, [challenges, currentUser, incomingPopupDismissed]);

  // Lector RSS en vivo de Noticias Reales de Tenis (Costo $0 con fallback seguro)
  useEffect(() => {
    let active = true;
    fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.puntodebreak.com%2Frss.xml"
    )
      .then((res) => res.json())
      .then((data) => {
        if (!active || !Array.isArray(data?.items) || data.items.length === 0) return;
        const parsed = data.items.slice(0, 4).map((item, idx) => ({
          id: `rss-${idx}`,
          source: "Punto de Break · En Vivo",
          title: item.title,
          timeAgo: "Actualizado hoy",
          image: item.thumbnail || item.enclosure?.link || getContextualPoolAsset(idx),
          url: item.link || "https://www.puntodebreak.com/",
        }));
        setNewsList(parsed);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Confirmar Resultado Oficial ITF/ATP, Actualizar ELO y Disparar Animación en Vivo + Story 9:16
  const handleConfirmOfficialResult = (challengeId, sets, calcResult) => {
    const targetChallenge = challenges.find((c) => c.id === challengeId);
    const venueClub = getClubById(targetChallenge?.clubId);

    setPlayers((prev) =>
      prev.map((pl) => {
        if (pl.id === calcResult.winnerId) {
          const newElo = pl.elo + calcResult.winnerDelta;
          return {
            ...pl,
            elo: newElo,
            matchesPlayed: (pl.matchesPlayed || 0) + 1,
            wins: (pl.wins || 0) + 1,
            streak: (pl.streak || 0) + 1,
            lastDelta: calcResult.winnerDelta,
            rankChange: calcResult.winnerDelta >= 100 ? 2 : 1,
          };
        }
        if (pl.id === calcResult.loserId) {
          const newElo = Math.max(100, pl.elo + calcResult.loserDelta);
          return {
            ...pl,
            elo: newElo,
            matchesPlayed: (pl.matchesPlayed || 0) + 1,
            losses: (pl.losses || 0) + 1,
            streak: 0,
            lastDelta: calcResult.loserDelta,
            rankChange: -1,
          };
        }
        return pl;
      })
    );

    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, status: "completed" } : c))
    );

    setChallengeForScoreModal(null);
    setActiveTab("ranking");
    setAnimatedPlayerId(calcResult.winnerId);
    setAnimationType(calcResult.winnerDelta >= 100 ? "epic" : "up");

    setCelebrationToast({
      gif: calcResult.winnerDelta >= 120 ? ASSETS.gifAscensoCampeon : ASSETS.gifVictoriaReto,
      title: `¡Victoria Oficial de ${calcResult.winnerName}! (+${calcResult.winnerDelta} Pts)`,
      subtitle: `Marcador: ${calcResult.formattedScore}`,
    });

    setStoryPosterData({
      ...calcResult,
      venueLabel:
        targetChallenge?.customVenue ||
        venueClub?.name ||
        "Country Club Los Huancas",
    });

    setTimeout(() => {
      setAnimatedPlayerId(null);
      setAnimationType(null);
      setCelebrationToast(null);
    }, 5500);
  };

  // Simulador Instantáneo de Subida Épica en la Tabla de Ranking
  const handleSimulateLiveRankingShift = () => {
    if (!currentUser) return;
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentUser.id
          ? {
              ...p,
              elo: p.elo + 155,
              wins: (p.wins || 0) + 1,
              matchesPlayed: (p.matchesPlayed || 0) + 1,
              streak: (p.streak || 0) + 1,
              lastDelta: 155,
              rankChange: 2,
            }
          : p
      )
    );
    setAnimatedPlayerId(currentUser.id);
    setAnimationType("epic");
    setCelebrationToast({
      gif: ASSETS.gifAscensoCampeon,
      title: `🚀 ¡SUBIDA ÉPICA EN EL RANKING! (+155 Pts)`,
      subtitle: `${currentUser.name} escaló posiciones en vivo`,
    });
    setTimeout(() => {
      setAnimatedPlayerId(null);
      setAnimationType(null);
      setCelebrationToast(null);
    }, 4200);
  };

  return (
    <div className={`app-shell ${isLightMode ? "theme-light" : ""}`}>
      <style>{GLOBAL_STYLES}</style>

      {/* ====================================================================
          HEADER FIJO BAJO ISLA DINÁMICA (IPHONE 16 PRO MAX SAFE AREA)
      ==================================================================== */}
      <header className="safe-top-header flex items-center justify-between gap-2">
        {/* Izquierda: Menú 3 Rayitas + Estandarte Comercial PRO SHOP */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setMenuInitialSection("elo");
              setShowMenuModal(true);
            }}
            className="touch-target rounded-2xl border border-white/15 bg-white/5 px-3 font-black text-base"
            title="Menú Institucional"
          >
            ☰
          </button>

          <button
            onClick={() => setShowProShop(true)}
            className="touch-target px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-[#D6FF00] to-amber-400 text-[#0B0E14] font-display font-black text-[11px] flex items-center gap-1.5 shadow-md"
          >
            <span className="w-5 h-5 rounded-full bg-black/15 p-0.5 flex items-center justify-center overflow-hidden">
              <SafeImage
                src={ASSETS.proshopRollo}
                alt="Shop"
                circular
                className="w-full h-full"
              />
            </span>
            <span>⚡ PRO SHOP</span>
          </button>
        </div>

        {/* Centro: Logo Oficial + Marca Limpia MATCHPOINT */}
        <div
          onClick={() => setActiveTab("ranking")}
          className="flex items-center gap-1.5 cursor-pointer select-none"
        >
          <SafeImage
            src={ASSETS.logo}
            alt="MATCHPOINT"
            className="w-7 h-7 rounded-lg"
            fallbackText="MP"
          />
          <div className=" leading-none">
            <span className="font-display font-black text-base tracking-tight block">
              MATCHPOINT
            </span>
            <span className="text-[9px] font-bold opacity-65 block">
              CIRCUITO OFICIAL
            </span>
          </div>
        </div>

        {/* Derecha: Botón Tutorial Videojuego + Campana + Avatar a Mi Perfil */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTutorialStep(1)}
            className="touch-target px-2.5 rounded-2xl border border-[#D6FF00]/40 bg-[#D6FF00]/10 text-[#D6FF00] font-display font-black text-[11px]"
            title="Abrir Tutorial Interactivo"
          >
            🎮 Guía
          </button>

          <button
            onClick={() => setIncomingPopupDismissed(false)}
            className="touch-target relative rounded-2xl border border-white/15 bg-white/5 px-2.5"
            title="Notificaciones de Retos"
          >
            <span>🔔</span>
            {challenges.some(
              (c) => c.status === "pending" && c.challengedId === currentUser?.id
            ) && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF00] absolute top-2 right-2 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("perfil")}
            className={`touch-target rounded-full p-0.5 border-2 ${
              activeTab === "perfil" ? "border-[#D6FF00]" : "border-white/20"
            }`}
            title="Ir a Mi Perfil"
          >
            <SafeImage
              src={currentUser?.avatar}
              alt={currentUser?.name}
              circular
              className="w-8 h-8"
            />
          </button>
        </div>
      </header>

      {/* ====================================================================
          ÁREA CENTRAL CON SCROLL INDEPENDIENTE (60 FPS)
      ==================================================================== */}
      <main className="app-scroll-container px-3.5 pt-3 max-w-xl mx-auto w-full space-y-4">
        {/* Banner de Celebración Animado con GIF al Confirmar Victoria / Subida Épica */}
        {celebrationToast && (
          <div className="rounded-3xl p-3.5 border-2 border-[#D6FF00] bg-[#0B0E14] text-white flex items-center gap-3 shadow-2xl">
            <SafeImage
              src={celebrationToast.gif}
              alt="Celebración"
              className="w-12 h-12 rounded-2xl flex-shrink-0"
              fallbackText="🏆"
            />
            <div className="flex-1 min-w-0">
              <div className="font-display font-black text-sm text-[#D6FF00]">
                {celebrationToast.title}
              </div>
              <div className="text-xs opacity-85 truncate">{celebrationToast.subtitle}</div>
            </div>
          </div>
        )}

        {/* TICKER ATP EN VIVO (SOLO LECTURA) + NOTICIAS REALES DE TENIS */}
        <div
          className="rounded-2xl p-2.5 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between text-[11px] font-extrabold mb-1.5">
            <div className="flex items-center gap-1.5">
              <SafeImage
                src={ASSETS.pelotaVoltAzul}
                alt="ATP Live"
                className="w-4 h-4 ball-3d-anim"
              />
              <span className="text-[#00A3FF] uppercase">
                ATP / WTA Live Scores &amp; Noticias Reales
              </span>
            </div>
            <button
              onClick={() => setShowNewsStrip(!showNewsStrip)}
              className="text-[10px] opacity-70 underline px-1"
            >
              {showNewsStrip ? "Compactar ▲" : "Desplegar ▼"}
            </button>
          </div>

          {/* Cintillo Horizontal de Marcadores Profesionales */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {atpScores.map((sc) => (
              <a
                key={sc.id}
                href={sc.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 flex-shrink-0 text-[11px]"
              >
                <div className="text-[9px] font-black text-[#D6FF00]">{sc.tournament}</div>
                <div className="font-bold whitespace-nowrap">
                  {sc.player1} vs {sc.player2}:{" "}
                  <strong className="text-[#00A3FF] tabular-nums">{sc.score}</strong>
                </div>
              </a>
            ))}
          </div>

          {/* Carrusel de Noticias Reales de Tenis con Foto de Prensa y Fuente */}
          {showNewsStrip && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pt-2 mt-2 border-t border-white/10">
              {newsList.map((n) => (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-64 flex-shrink-0 rounded-xl p-2 bg-white/5 border border-white/10 flex items-center gap-2.5 hover:border-[#D6FF00]"
                >
                  <SafeImage
                    src={n.image}
                    alt={n.title}
                    className="w-14 h-14 rounded-lg flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase text-[#00A3FF] block">
                      {n.source} · {n.timeAgo}
                    </span>
                    <div className="font-bold text-xs line-clamp-2 leading-snug">
                      {n.title}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Tarjeta Superior de Estado de Calibración del Usuario (Spotlight Paso 1 del Tutorial) */}
        {currentUser && (
          <div
            className={`rounded-2xl p-3 border flex items-center justify-between gap-2 ${
              tutorialStep === 1 ? "tutorial-spotlight" : ""
            }`}
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <SafeImage
                src={ASSETS.pelotaClasica}
                alt="Nivel"
                className="w-8 h-8 ball-3d-anim flex-shrink-0"
              />
              <div className="min-w-0 text-xs">
                <div className="font-display font-black truncate">
                  {currentUser.name} ·{" "}
                  <span className="text-[#D6FF00] tabular-nums">{currentUser.elo} Pts</span> (
                  {getCategoryByElo(currentUser.elo).name})
                </div>
                <div className="opacity-75 text-[11px]">
                  {currentUser.matchesPlayed < 5
                    ? `🎯 En Calibración [${currentUser.matchesPlayed}/5] · K=480 activa`
                    : `✓ Jugador Consolidado [${currentUser.matchesPlayed} partidos] · K=300`}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowOnboardingWizard(true)}
              className="touch-target px-3 py-1.5 rounded-xl text-[11px] font-display font-black border border-[#00A3FF]/50 bg-[#00A3FF]/15 text-[#00A3FF] whitespace-nowrap"
            >
              🎯 Test Nivel
            </button>
          </div>
        )}

        {/* RENDERIZADO DE LAS 5 VISTAS PRINCIPALES DE LA BARRA INFERIOR */}
        {activeTab === "perfil" && (
          <PlayerProfileCardView
            player={currentUser}
            currentUser={currentUser}
            isOwnProfile={true}
            isLightMode={isLightMode}
            onToggleTheme={() => setIsLightMode(!isLightMode)}
            onUpdateProfile={(updated) =>
              setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
            }
            onOpenCalibrationWizard={() => setShowOnboardingWizard(true)}
            onOpenAdminPinModal={() => setShowAdminModal(true)}
            onLogout={() => setShowLoginModal(true)}
          />
        )}

        {activeTab === "ranking" && (
          <RankingTabView
            players={players}
            currentUser={currentUser}
            animatedPlayerId={animatedPlayerId}
            animationType={animationType}
            onSelectPlayerProfile={(pl) => setSelectedPlayerModal(pl)}
            onLaunchChallenge={(opp) => setOpponentForChallengeModal(opp)}
            onSimulateLiveRankingShift={handleSimulateLiveRankingShift}
            onOpenPoliciesModal={() => {
              setMenuInitialSection("elo");
              setShowMenuModal(true);
            }}
            tutorialStep={tutorialStep}
          />
        )}

        {activeTab === "retos" && (
          <ChallengesTabView
            challenges={challenges}
            players={players}
            currentUser={currentUser}
            isLightMode={isLightMode}
            totalActivePlayers={130}
            onAcceptChallenge={(chId) =>
              setChallenges((prev) =>
                prev.map((c) => (c.id === chId ? { ...c, status: "confirmed" } : c))
              )
            }
            onRejectChallenge={(chId) =>
              setChallenges((prev) => prev.filter((c) => c.id !== chId))
            }
            onOpenOfficialScoreModal={(ch) => setChallengeForScoreModal(ch)}
            onOpenLaunchChallengeModal={(opp) => setOpponentForChallengeModal(opp)}
            onUpdateLiveUmpireScore={(chId, updatedSets, nextIdx, umpireName) =>
              setChallenges((prev) =>
                prev.map((c) =>
                  c.id === chId
                    ? {
                        ...c,
                        liveSets: updatedSets,
                        currentSetIndex: nextIdx,
                        liveUmpireName: umpireName,
                        liveUpdatedAgo: "Ahora mismo",
                      }
                    : c
                )
              )
            }
            tutorialStep={tutorialStep}
          />
        )}

        {activeTab === "sedes" && (
          <VenuesAndCoachesTabView
            clubs={clubs}
            coaches={coaches}
            currentUser={currentUser}
            onUpdateClubWeather={(clubId, stateId, reporter) =>
              setClubs((prev) =>
                prev.map((cl) =>
                  cl.id === clubId
                    ? {
                        ...cl,
                        surfaceStateId: stateId,
                        lastReportBy: reporter,
                        lastReportTime: "Ahora mismo",
                      }
                    : cl
                )
              )
            }
            onAddCoachReview={(coachId, newRev) =>
              setCoaches((prev) =>
                prev.map((co) =>
                  co.id === coachId ? { ...co, reviews: [newRev, ...co.reviews] } : co
                )
              )
            }
            onUpdateCoachSlots={(coachId, slotText) =>
              setCoaches((prev) =>
                prev.map((co) =>
                  co.id === coachId
                    ? { ...co, availableSlots: [...co.availableSlots, slotText] }
                    : co
                )
              )
            }
          />
        )}

        {activeTab === "torneos" && (
          <TournamentsTabView
            tournaments={tournaments}
            players={players}
            currentUser={currentUser}
            onToggleEnrollTournament={(torId) => {
              if (!currentUser) return;
              setTournaments((prev) =>
                prev.map((t) => {
                  if (t.id !== torId) return t;
                  const exists = t.enrolledIds.includes(currentUser.id);
                  return {
                    ...t,
                    enrolledIds: exists
                      ? t.enrolledIds.filter((id) => id !== currentUser.id)
                      : [...t.enrolledIds, currentUser.id],
                  };
                })
              );
            }}
            onOpenAdminPinModal={() => setShowAdminModal(true)}
          />
        )}
      </main>

      {/* ====================================================================
          BARRA INFERIOR DE 5 PESTAÑAS CON HALO LUMINOSO ACTIVO EN TODAS
      ==================================================================== */}
      <nav className="safe-bottom-bar px-2 pt-2">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
          {[
            { id: "perfil", label: "Mi Perfil", icon: ASSETS.navPerfil, whiteBg: false },
            { id: "ranking", label: "Ranking", icon: ASSETS.navRanking, whiteBg: false },
            { id: "retos", label: "Retos", icon: ASSETS.navRetos, whiteBg: true },
            { id: "sedes", label: "Sedes", icon: ASSETS.navSedes, whiteBg: false },
            { id: "torneos", label: "Torneos", icon: ASSETS.navTorneos, whiteBg: true },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`touch-target flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
                  isActive
                    ? "bg-[#D6FF00]/15 border border-[#D6FF00] shadow-[0_0_18px_rgba(214,255,0,0.35)]"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center overflow-hidden ${
                    tab.whiteBg ? "bg-white p-0.5 border border-[#D6FF00]/50" : ""
                  }`}
                >
                  <SafeImage
                    src={tab.icon}
                    alt={tab.label}
                    circular={tab.whiteBg}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className={`text-[10px] font-display font-extrabold mt-0.5 ${
                    isActive ? "text-[#D6FF00]" : ""
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ====================================================================
          POP-UP AUTOMÁTICO DE RETO ENTRANTE AL INICIAR SESIÓN (POR ID ÚNICO)
      ==================================================================== */}
      {pendingIncomingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            className="w-full max-w-sm rounded-3xl p-5 border-2 border-[#D6FF00] shadow-2xl text-center"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#D6FF00] text-[#0B0E14]">
              ⚡ ¡NUEVO DESAFÍO ENTRANTE!
            </span>
            <h3 className="font-display text-xl font-black mt-2">
              {players.find((p) => p.id === pendingIncomingChallenge.challengerId)?.name} te ha
              retado
            </h3>
            <p className="text-xs opacity-80 mt-1 mb-4">
              📍{" "}
              {getClubById(pendingIncomingChallenge.clubId)?.name || "Country Club Los Huancas"} ·{" "}
              {pendingIncomingChallenge.scheduledTime}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setChallenges((prev) =>
                    prev.map((c) =>
                      c.id === pendingIncomingChallenge.id ? { ...c, status: "confirmed" } : c
                    )
                  );
                  setIncomingPopupDismissed(true);
                  setActiveTab("retos");
                }}
                className="touch-target py-3 rounded-xl font-display font-black text-xs bg-[#D6FF00] text-[#0B0E14]"
              >
                ✓ Aceptar Reto
              </button>
              <button
                onClick={() => setIncomingPopupDismissed(true)}
                className="touch-target py-3 rounded-xl font-bold text-xs border border-white/20 bg-white/5"
              >
                Ver Después
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FICHA HOMOGENEIZADA AL TOCAR A UN RIVAL EN EL RANKING */}
      {selectedPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 safe-modal-top">
          <div className="w-full max-w-md max-h-[88dvh] overflow-y-auto">
            <PlayerProfileCardView
              player={selectedPlayerModal}
              currentUser={currentUser}
              isOwnProfile={selectedPlayerModal.id === currentUser?.id}
              isLightMode={isLightMode}
              onToggleTheme={() => setIsLightMode(!isLightMode)}
              onCloseModal={() => setSelectedPlayerModal(null)}
              onLaunchChallenge={(opp) => {
                setSelectedPlayerModal(null);
                setOpponentForChallengeModal(opp);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL PARA LANZAR RETO CON PRONÓSTICO Y SEDE PERSONALIZADA */}
      {opponentForChallengeModal && currentUser && (
        <ChallengeLaunchModal
          challenger={currentUser}
          opponent={opponentForChallengeModal}
          totalActivePlayers={130}
          onClose={() => setOpponentForChallengeModal(null)}
          onConfirmChallenge={(newChData) => {
            setChallenges((prev) => [
              {
                id: `ch-${Date.now()}`,
                status: "confirmed",
                createdAt: "Confirmado ahora",
                ...newChData,
              },
              ...prev,
            ]);
            setOpponentForChallengeModal(null);
            setActiveTab("retos");
          }}
        />
      )}

      {/* MODAL DE CARGA Y DOBLE FIRMA DE MARCADOR OFICIAL ITF/ATP */}
      {challengeForScoreModal && (
        <OfficialScoreSubmitModal
          challenge={challengeForScoreModal}
          playerA={players.find((p) => p.id === challengeForScoreModal.challengerId)}
          playerB={players.find((p) => p.id === challengeForScoreModal.challengedId)}
          totalActivePlayers={130}
          onClose={() => setChallengeForScoreModal(null)}
          onConfirmOfficialResult={handleConfirmOfficialResult}
        />
      )}

      {/* MODAL DE PÓSTER VERTICAL 9:16 PARA STORIES (IG / FB / WHATSAPP) */}
      {storyPosterData && (
        <StoryPosterModal
          matchData={storyPosterData}
          onClose={() => setStoryPosterData(null)}
        />
      )}

      {/* WIZARD DE CALIBRACIÓN 1X1 (5 PANTALLAS) */}
      <OnboardingWizardModal
        isOpen={showOnboardingWizard}
        onClose={() => setShowOnboardingWizard(false)}
        onOpenCoachTab={() => {
          setShowOnboardingWizard(false);
          setActiveTab("sedes");
        }}
        onCompleteCalibrationSeed={(seedPts, launchTutorial) => {
          if (currentUser) {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === currentUser.id
                  ? { ...p, elo: seedPts, matchesPlayed: 0, wins: 0, losses: 0, streak: 0 }
                  : p
              )
            );
          }
          setShowOnboardingWizard(false);
          if (launchTutorial) setTutorialStep(1);
        }}
      />

      {/* TUTORIAL INTERACTIVO ESTILO VIDEOJUEGO EN 4 PASOS */}
      <VideoGameTutorialOverlay
        step={tutorialStep}
        onNextStep={() => {
          if (tutorialStep === 1) setActiveTab("ranking");
          if (tutorialStep === 2) setActiveTab("ranking");
          if (tutorialStep === 3) setActiveTab("retos");
          if (tutorialStep < 4) setTutorialStep(tutorialStep + 1);
          else setTutorialStep(0);
        }}
        onCloseTutorial={() => setTutorialStep(0)}
      />

      {/* SUITE ADMIN (PIN 1234) */}
      <AdminSuiteModal
        isOpen={showAdminModal}
        players={players}
        tournaments={tournaments}
        onClose={() => setShowAdminModal(false)}
        onResetPlayerPassword={() => {}}
        onUnlinkPlayerEmail={(pid, newMail) =>
          setPlayers((prev) => prev.map((p) => (p.id === pid ? { ...p, email: newMail } : p)))
        }
        onTogglePlayerActive={(pid) =>
          setPlayers((prev) =>
            prev.map((p) => (p.id === pid ? { ...p, active: p.active === false } : p))
          )
        }
        onDeleteGhostPlayer={(pid) =>
          setPlayers((prev) => prev.filter((p) => p.id !== pid))
        }
        onExecuteSeasonReset={() =>
          setPlayers((prev) =>
            prev.map((p) => ({
              ...p,
              elo: applySeasonFloorReset(p.elo),
              rankChange: 0,
            }))
          )
        }
        onAdminValidateTournamentMatch={(torId, matchId, winnerName, loserName, scoreStr) =>
          setTournaments((prev) =>
            prev.map((tor) => {
              if (tor.id !== torId) return tor;
              return {
                ...tor,
                mainBracket: tor.mainBracket.map((m) =>
                  m.id === matchId
                    ? {
                        ...m,
                        winner: winnerName,
                        score: scoreStr,
                        status: "Finalizado (Validado por Comité)",
                      }
                    : m
                ),
                consolationBracket: tor.consolationBracket.map((cm) => ({
                  ...cm,
                  playerB: loserName,
                  score: "Listo para jugar Consuelo",
                })),
              };
            })
          )
        }
      />

      {/* PRO SHOP MODAL */}
      <ProShopModal
        isOpen={showProShop}
        isLightMode={isLightMode}
        currentUser={currentUser}
        onClose={() => setShowProShop(false)}
      />

      {/* MENÚ INSTITUCIONAL 3 RAYITAS Y POLÍTICAS ELO */}
      <InstitutionalMenuModal
        isOpen={showMenuModal}
        initialSection={menuInitialSection}
        onClose={() => setShowMenuModal(false)}
        onGoToSedes={() => setActiveTab("sedes")}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* MODAL DE LOGIN, RECUPERACIÓN DE CLAVE Y CAMBIO ENTRE LOS 10 PERFILES DEMO */}
      <LoginAndRecoveryModal
        isOpen={showLoginModal}
        players={players}
        onClose={() => setShowLoginModal(false)}
        onSwitchAccount={(pid) => {
          setCurrentUserId(pid);
          setIncomingPopupDismissed(false);
        }}
      />
    </div>
  );
}

// === FIN DEL BLOQUE 6 DE 6 (ARCHIVO src/App.jsx COMPLETO) ===
