// ============================================================================
// MATCHPOINT™ — CIRCUITO OFICIAL DE TENIS (EDICIÓN ATP TOUR 2026)
// ARCHIVO: src/App.jsx
// BLOQUE 1 DE 5: IMPORTS, MOTOR MATEMÁTICO ELO BLINDADO, ESTILOS GLOBALES,
//                ACTIVOS 3D CANVA Y ESCUDOS OFICIALES DE LOS 4 CLUBES
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy, Swords, MapPin, Calendar, User, Bell, Menu, X, Check,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Shield, Star,
  Flame, Sparkles, Sun, Moon, Phone, Lock, KeyRound, RefreshCw,
  Award, TrendingUp, TrendingDown, Minus, Plus, Clock, AlertTriangle,
  CheckCircle2, Info, ExternalLink, Search, Filter, Eye, EyeOff,
  ShoppingBag, Zap, Users, FileText, Settings, LogOut, Edit3,
  Trash2, Play, Radio, Share2, CreditCard, Newspaper
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ----------------------------------------------------------------------------
// 1. CONFIGURACIÓN ADMINISTRATIVA Y CONSTANTES MAESTRAS (DESACOPLADAS)
// ----------------------------------------------------------------------------
export const ADMIN_CONFIG = {
  APP_NAME: 'MATCHPOINT',
  APP_SUBTITLE: 'HUANCAYO · CIRCUITO OFICIAL',
  VERSION: 'v3.0.0 ATP-EDITION',
  WHATSAPP_ADMIN: '51964000000',
  WHATSAPP_PROSHOP: '51964000000',
  PIN_COMITE: '1234',
  PIN_COACH_PRO: '7777',
  PRECIO_CARNET_VIP: 25,
  PARTIDOS_CALIBRACION: 5,
  QUORUM_PARTIDOS_CAMPEON: 5,
  VENTANA_RETO_ELO: 1200,
  DIAS_COOLDOWN_H2H: 15,
  DIAS_INACTIVIDAD_PODIO: 21,
  PENALIDAD_INACTIVIDAD_SEMANAL: 25,
  DISTANCIA_MAX_RACHA_PAR: 400,
  BONO_FIDELIDAD_ASISTENCIA: 10
};

// Rutas locales opcionales (si guardas tus PNGs de Canva en public/assets/)
// Si aún no están en esa carpeta, el motor dibuja automáticamente los 10 activos 3D y los 4 logos.
export const CANVA_ASSETS_PATHS = {
  logo_oficial: '/assets/logo-matchpoint.png',
  fuego_racha: '/assets/canva-fuego-racha.png',
  trofeo_laurel: '/assets/canva-trofeo-laurel.png',
  raquetas_duelo: '/assets/canva-raquetas-duelo.png',
  escudo_coach: '/assets/canva-escudo-coach.png',
  pro_shop_rollo: '/assets/canva-proshop-rollo.png',
  golden_ticket: '/assets/canva-golden-ticket.png',
  clima_seco: '/assets/canva-clima-seco.png',
  clima_humedad: '/assets/canva-clima-humedad.png',
  clima_llovizna: '/assets/canva-clima-llovizna.png',
  clima_tormenta: '/assets/canva-clima-tormenta.png',
  club_inkas: '/assets/club-los-inkas.png',
  club_tauro: '/assets/club-tauro.png',
  club_romina: '/assets/club-romina-cutipa.png',
  club_huancas: '/assets/club-country-huancas.png'
};

// ----------------------------------------------------------------------------
// 2. ESCALA OFICIAL DE CATEGORÍAS (GOBERNADA 100% POR PUNTOS ELO)
// ----------------------------------------------------------------------------
export const ESCALA_CATEGORIAS = [
  {
    id: '1a',
    codigo: '1ª Categoría',
    nombreCorto: 'Cat. 1ª',
    tituloHeraldico: 'CORONA PRO · 1ª FUERZA',
    min: 4801,
    max: 9999,
    colorHex: '#D6FF00',
    descripcion: 'Élite abierta del circuito y jugadores de primera fuerza nacional.'
  },
  {
    id: '2a',
    codigo: '2ª Categoría',
    nombreCorto: 'Cat. 2ª',
    tituloHeraldico: 'ZAFIRO NACIONAL · 2ª DIVISIÓN',
    min: 3801,
    max: 4800,
    colorHex: '#00A3FF',
    descripcion: 'Nivel semiprofesional y campeones consolidados de torneos regionales.'
  },
  {
    id: '3a',
    codigo: '3ª Categoría',
    nombreCorto: 'Cat. 3ª',
    tituloHeraldico: 'OLIMPO HUANCAYO · 3ª DIVISIÓN',
    min: 2801,
    max: 3800,
    colorHex: '#F59E0B',
    descripcion: 'Máxima división competitiva local: entrenadores y líderes de club.'
  },
  {
    id: '4a',
    codigo: '4ª Categoría',
    nombreCorto: 'Cat. 4ª',
    tituloHeraldico: 'COMPETITIVO AVANZADO · 4ª DIVISIÓN',
    min: 1801,
    max: 2800,
    colorHex: '#38BDF8',
    descripcion: 'Tenistas con dominio de efectos (topspin/slice), saque y táctica de singles.'
  },
  {
    id: '5a',
    codigo: '5ª A · Consolidado',
    nombreCorto: 'Cat. 5ª A',
    tituloHeraldico: 'CONSOLIDADO DE CLUB · 5ª A',
    min: 1201,
    max: 1800,
    colorHex: '#10B981',
    descripcion: 'Saque consistente, peloteo profundo de fondo y cierre de sets completos.'
  },
  {
    id: '5b',
    codigo: '5ª B · Inicial',
    nombreCorto: 'Cat. 5ª B',
    tituloHeraldico: 'INTERMEDIO INICIAL · 5ª B',
    min: 601,
    max: 1200,
    colorHex: '#FB923C',
    descripcion: 'Mantiene peloteos regulares y disputa sus primeros partidos oficiales.'
  },
  {
    id: '5p',
    codigo: '5ª P · Principiante',
    nombreCorto: 'Cat. 5ª P',
    tituloHeraldico: 'ACADEMIA & ARRANQUE · 5ª P',
    min: 0,
    max: 600,
    colorHex: '#94A3B8',
    descripcion: 'Etapa formativa: aprendiendo técnica de golpes, conteo y servicio.'
  }
];

export const obtenerCategoriaPorElo = (puntosElo) => {
  const pts = Number(puntosElo) || 0;
  for (const cat of ESCALA_CATEGORIAS) {
    if (pts >= cat.min && pts <= cat.max) return cat;
  }
  return ESCALA_CATEGORIAS[ESCALA_CATEGORIAS.length - 1];
};

export const obtenerProgresoSiguienteCategoria = (puntosElo) => {
  const pts = Number(puntosElo) || 0;
  const actual = obtenerCategoriaPorElo(pts);
  const idxActual = ESCALA_CATEGORIAS.findIndex((c) => c.id === actual.id);
  if (idxActual <= 0) {
    return { actual, siguiente: null, puntosFaltantes: 0, porcentaje: 100 };
  }
  const siguiente = ESCALA_CATEGORIAS[idxActual - 1];
  const rangoTotal = actual.max - actual.min + 1;
  const avance = Math.max(0, pts - actual.min);
  const porcentaje = Math.min(100, Math.round((avance / rangoTotal) * 100));
  const puntosFaltantes = Math.max(1, siguiente.min - pts);
  return { actual, siguiente, puntosFaltantes, porcentaje };
};

// ----------------------------------------------------------------------------
// 3. MOTOR MATEMÁTICO ELO BLINDADO (CON LOS 5 ANTÍDOTOS ANTI-TRAMPAS)
// ----------------------------------------------------------------------------
export const parsearMarcadorTenis = (scoreStr) => {
  if (!scoreStr || typeof scoreStr !== 'string') {
    return { gamesGanador: 12, gamesPerdedor: 6, totalGames: 18, margen: 0.33 };
  }
  const partes = scoreStr.trim().split(/[,;/\s]+/).filter(Boolean);
  let gamesA = 0;
  let gamesB = 0;
  partes.forEach((par) => {
    const match = par.match(/^(\d+)-(\d+)/);
    if (match) {
      const g1 = parseInt(match[1], 10);
      const g2 = parseInt(match[2], 10);
      if (g1 >= 10 || g2 >= 10) {
        if (g1 > g2) gamesA += 1;
        else gamesB += 1;
      } else {
        gamesA += g1;
        gamesB += g2;
      }
    }
  });
  const mayor = Math.max(gamesA, gamesB, 1);
  const menor = Math.min(gamesA, gamesB, 0);
  const total = Math.max(mayor + menor, 1);
  const margen = Math.min(1, Math.max(0, (mayor - menor) / total));
  return { gamesGanador: mayor, gamesPerdedor: menor, totalGames: total, margen: Number(margen.toFixed(3)) };
};

export const calcularProbabilidadEsperada = (eloA, eloB) => {
  const exp = (Number(eloB) - Number(eloA)) / 1200;
  return 1 / (1 + Math.pow(10, exp));
};

export const calcularFactorDominioBlindado = (scoreStr) => {
  const { margen, gamesGanador, gamesPerdedor } = parsearMarcadorTenis(scoreStr);
  const fd = Math.min(1.30, Math.max(0.70, Number((0.70 + 0.60 * margen).toFixed(2))));
  let etiqueta = 'Victoria Estándar';
  if (fd >= 1.18) etiqueta = 'Dominio Contundente';
  else if (fd <= 0.82) etiqueta = 'Alta Paridad Técnica (Protección Activa)';
  return { fd, margen, gamesGanador, gamesPerdedor, etiqueta };
};

export const calcularImpactoPartidoELO = ({
  jugadorGanador,
  jugadorPerdedor,
  marcadorTexto = '6-4, 6-4',
  historialPartidos = []
}) => {
  const eloG = Number(jugadorGanador?.elo || 1200);
  const eloP = Number(jugadorPerdedor?.elo || 1200);
  const jugadosG = Number(jugadorGanador?.victorias || 0) + Number(jugadorGanador?.derrotas || 0);
  const jugadosP = Number(jugadorPerdedor?.victorias || 0) + Number(jugadorPerdedor?.derrotas || 0);

  // Antídoto 1: Cooldown H2H de 15 días entre los mismos 2 rivales
  const ahora = Date.now();
  const msQuinceDias = ADMIN_CONFIG.DIAS_COOLDOWN_H2H * 24 * 60 * 60 * 1000;
  const cruceReciente = historialPartidos.find((m) => {
    if (m.estado !== 'Finalizado') return false;
    const mismos =
      (m.jugadorAId === jugadorGanador?.id && m.jugadorBId === jugadorPerdedor?.id) ||
      (m.jugadorAId === jugadorPerdedor?.id && m.jugadorBId === jugadorGanador?.id);
    return mismos && m.timestamp && (ahora - m.timestamp) < msQuinceDias;
  });

  if (cruceReciente) {
    return {
      deltaGanador: 0,
      deltaPerdedor: 0,
      bonoTiendaAmbos: ADMIN_CONFIG.BONO_FIDELIDAD_ASISTENCIA,
      bloqueadoPorCooldownH2H: true,
      motivoCooldown: `Ya disputaron puntos ELO entre sí hace menos de ${ADMIN_CONFIG.DIAS_COOLDOWN_H2H} días. Suma al historial H2H y otorga +10 Pts Tienda.`,
      kAplicado: 0,
      probabilidadGanador: 50,
      factorDominio: 1.0,
      multiplicadorRacha: 1.0
    };
  }

  // Antídoto 2: K Armónico Conjunto entre Calibración (180) y Consolidado (60)
  const kIndivG = jugadosG < ADMIN_CONFIG.PARTIDOS_CALIBRACION ? 180 : 60;
  const kIndivP = jugadosP < ADMIN_CONFIG.PARTIDOS_CALIBRACION ? 180 : 60;
  const kPartido = Math.round(Math.sqrt(kIndivG * kIndivP));

  const probG = calcularProbabilidadEsperada(eloG, eloP);
  const { fd, etiqueta: etiquetaDominio } = calcularFactorDominioBlindado(marcadorTexto);

  // Antídoto 4: Racha x1.25 solo válida ante rivales a <= 400 Pts de distancia
  const distanciaRival = Math.abs(eloG - eloP);
  const rachaNueva = Number(jugadorGanador?.racha || 0) + 1;
  const aplicaBonoRacha = rachaNueva >= 3 && distanciaRival <= ADMIN_CONFIG.DISTANCIA_MAX_RACHA_PAR;
  const multRacha = aplicaBonoRacha ? 1.25 : 1.0;

  const deltaBase = kPartido * (1 - probG) * fd;
  const deltaGanador = Math.max(8, Math.round(deltaBase * multRacha));
  const deltaPerdedor = -Math.max(6, Math.round(deltaBase));

  return {
    deltaGanador,
    deltaPerdedor,
    bonoTiendaAmbos: ADMIN_CONFIG.BONO_FIDELIDAD_ASISTENCIA,
    bloqueadoPorCooldownH2H: false,
    kAplicado: kPartido,
    probabilidadGanador: Number((probG * 100).toFixed(0)),
    factorDominio: fd,
    etiquetaDominio,
    multiplicadorRacha: multRacha,
    aplicaBonoRacha
  };
};

export const previsualizarRiesgoReto = (miJugador, rivalJugador) => {
  if (!miJugador || !rivalJugador) return { siGanas: 30, siPierdes: -18 };
  const simGana = calcularImpactoPartidoELO({ jugadorGanador: miJugador, jugadorPerdedor: rivalJugador });
  const simPierde = calcularImpactoPartidoELO({ jugadorGanador: rivalJugador, jugadorPerdedor: miJugador });
  return { siGanas: simGana.deltaGanador, siPierdes: simPierde.deltaPerdedor };
};

// ----------------------------------------------------------------------------
// 4. MOTOR HÁPTICO Y ESTILOS GLOBALES (5 FAMILIAS DE MICROINTERACCIONES)
// ----------------------------------------------------------------------------
export const triggerHaptic = (tipo = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      if (tipo === 'selection') window.navigator.vibrate(4);
      else if (tipo === 'light') window.navigator.vibrate(8);
      else if (tipo === 'medium') window.navigator.vibrate(12);
      else if (tipo === 'success') window.navigator.vibrate([8, 30, 10]);
    }
  } catch {
    // Ignorar en navegadores de escritorio sin API de vibración
  }
};

export const GlobalMatchpointStyles = ({ isLightMode }) => (
  <style>{`
    @import url('[https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap](https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap)');
    :root {
      --mp-font-display: 'Outfit', sans-serif;
      --mp-font-body: 'Plus Jakarta Sans', sans-serif;
    }
    body {
      font-family: var(--mp-font-body);
      background-color: ${isLightMode ? '#EEF2F6' : '#0B0E14'};
      color: ${isLightMode ? '#0F172A' : '#F8FAFC'};
      -webkit-tap-highlight-color: transparent;
      overflow-x: hidden;
    }
    .font-display { font-family: var(--mp-font-display) !important; letter-spacing: -0.025em; }
    .font-body { font-family: var(--mp-font-body) !important; }
    .tabular-nums { font-variant-numeric: tabular-nums; font-family: var(--mp-font-display) !important; }
    .mp-hero-btn {
      position: relative; overflow: hidden;
      transition: transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 150ms ease;
    }
    .mp-hero-btn:active { transform: scale(0.96) translateY(1px); }
    .mp-hero-btn::after {
      content: ''; position: absolute; top: -50%; left: -60%; width: 45%; height: 200%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.36), transparent);
      transform: rotate(35deg); animation: mpShimmer 4.5s infinite; pointer-events: none;
    }
    @keyframes mpShimmer { 0% { left: -60%; } 22% { left: 130%; } 100% { left: 130%; } }
    .mp-card-interactive {
      transition: transform 150ms ease-out, border-color 180ms ease, box-shadow 180ms ease;
    }
    @media (hover: hover) { .mp-card-interactive:hover { transform: translateY(-2px); } }
    .mp-card-interactive:active { transform: scale(0.988); }
    .mp-tab-pill { transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1); }
    .mp-tab-pill:active { transform: scale(0.94); }
    .mp-icon-btn { transition: transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 140ms ease; }
    .mp-icon-btn:active { transform: scale(0.88) rotate(12deg); }
    @keyframes mpPulseRing {
      0% { transform: scale(0.95); opacity: 0.75; }
      70% { transform: scale(1.22); opacity: 0; }
      100% { transform: scale(1.22); opacity: 0; }
    }
    .mp-ripple-ring::before {
      content: ''; position: absolute; inset: -4px; border-radius: 9999px;
      border: 2px solid #D6FF00; animation: mpPulseRing 2.2s infinite; pointer-events: none;
    }
    @keyframes mpViewFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .mp-view-transition { animation: mpViewFadeIn 180ms ease-out forwards; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

// ----------------------------------------------------------------------------
// 5. COMPONENTES VISUALES: LOGO OFICIAL, 10 ACTIVOS 3D CANVA Y 4 ESCUDOS CLUBES
// ----------------------------------------------------------------------------
export const MatchpointOfficialLogo = ({ size = 36, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {!imgError ? (
        <img
          src={CANVA_ASSETS_PATHS.logo_oficial}
          alt="Matchpoint"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain rounded-full"
        />
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(214,255,0,0.35)]">
          <circle cx="50" cy="50" r="48" fill="#0B0E14" />
          <path d="M 21 71 A 37 37 0 1 1 73 22" fill="none" stroke="#D6FF00" strokeWidth="6.5" strokeLinecap="round" />
          <path d="M 16 44 Q 36 44 36 63" fill="none" stroke="#D6FF00" strokeWidth="6" strokeLinecap="round" />
          <path d="M 45 15 Q 52 36 72 28" fill="none" stroke="#D6FF00" strokeWidth="6" strokeLinecap="round" />
          <line x1="21" y1="72" x2="82" y2="27" stroke="#D6FF00" strokeWidth="6.5" strokeLinecap="round" />
          <path d="M 29 79 A 37 37 0 0 0 80 37 L 29 79 Z" fill="none" stroke="#00A3FF" strokeWidth="6.5" strokeLinejoin="round" />
          <line x1="52" y1="62" x2="68" y2="75" stroke="#00A3FF" strokeWidth="6" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

export const CanvaIcon3D = ({ type, size = 40, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const path = CANVA_ASSETS_PATHS[type];

  if (path && !imgError) {
    return (
      <img
        src={path}
        alt={type}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
        className={`object-contain select-none shrink-0 drop-shadow-md ${className}`}
      />
    );
  }

  return (
    <div style={{ width: size, height: size }} className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      {type === 'fuego_racha' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M55 92 C25 92 8 68 15 40 C18 28 10 15 10 15 C25 18 32 28 34 32 C32 18 24 6 24 6 C45 10 58 25 60 32 C68 20 82 24 88 38 C95 58 82 92 55 92 Z" fill="#00A3FF" />
          <path d="M56 88 C32 88 18 66 24 44 C26 35 16 22 16 22 C30 26 38 35 40 38 C40 24 34 12 34 12 C52 18 62 32 64 38 C74 30 86 42 84 60 C82 78 70 88 56 88 Z" fill="#D6FF00" />
          <circle cx="58" cy="58" r="26" fill="#C5F000" stroke="#0B0E14" strokeWidth="2.5" />
          <path d="M40 42 Q58 56 44 78 M74 38 Q58 56 76 74" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {type === 'trofeo_laurel' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M48 88 C20 80 10 54 18 24 C22 44 26 64 48 82 Z M52 88 C80 80 90 54 82 24 C78 44 74 64 52 82 Z" fill="#F59E0B" />
          <path d="M32 22 H68 L63 52 C61 62 39 62 37 52 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
          <rect x="46" y="58" width="8" height="14" rx="2" fill="#F59E0B" />
          <rect x="36" y="72" width="28" height="7" rx="3" fill="#1E293B" stroke="#FBBF24" strokeWidth="2" />
          <circle cx="50" cy="37" r="8" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />
        </svg>
      )}
      {type === 'raquetas_duelo' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g transform="rotate(-32 50 50)">
            <ellipse cx="50" cy="30" rx="19" ry="24" fill="rgba(214,255,0,0.15)" stroke="#D6FF00" strokeWidth="5" />
            <rect x="46" y="54" width="8" height="32" rx="3" fill="#1E293B" stroke="#D6FF00" strokeWidth="2" />
          </g>
          <g transform="rotate(32 50 50)">
            <ellipse cx="50" cy="30" rx="19" ry="24" fill="rgba(0,163,255,0.15)" stroke="#00A3FF" strokeWidth="5" />
            <rect x="46" y="54" width="8" height="32" rx="3" fill="#1E293B" stroke="#00A3FF" strokeWidth="2" />
          </g>
          <circle cx="50" cy="48" r="14" fill="#D6FF00" stroke="#0B0E14" strokeWidth="2.5" />
        </svg>
      )}
      {type === 'escudo_coach' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 8 L84 22 V50 C84 72 68 86 50 94 C32 86 16 72 16 50 V22 Z" fill="#0066FF" stroke="#F59E0B" strokeWidth="6" />
          <rect x="34" y="32" width="24" height="14" rx="7" fill="#FBBF24" />
          <circle cx="58" cy="39" r="9" fill="#F59E0B" />
          <circle cx="50" cy="68" r="15" fill="#00A3FF" stroke="#FBBF24" strokeWidth="4" />
          <path d="M43 68 L48 73 L58 63" fill="none" stroke="#FEF08A" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
      {type === 'pro_shop_rollo' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g transform="rotate(-20 62 45)">
            <ellipse cx="62" cy="34" rx="18" ry="22" fill="rgba(0,163,255,0.18)" stroke="#00A3FF" strokeWidth="5" />
            <rect x="59" y="56" width="6" height="28" rx="2" fill="#1E293B" stroke="#00A3FF" strokeWidth="1.5" />
          </g>
          <circle cx="36" cy="62" r="20" fill="#1E293B" stroke="#475569" strokeWidth="3" />
          <circle cx="36" cy="62" r="14" fill="none" stroke="#D6FF00" strokeWidth="7" strokeDasharray="22 4" />
        </svg>
      )}
      {type === 'golden_ticket' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g transform="rotate(-8 50 50)">
            <rect x="10" y="26" width="80" height="48" rx="6" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2.5" />
            <rect x="18" y="28" width="7" height="44" fill="#0052CC" />
            <rect x="75" y="28" width="7" height="44" fill="#0052CC" />
            <circle cx="50" cy="50" r="15" fill="#FBBF24" stroke="#0052CC" strokeWidth="3" />
            <text x="50" y="56" textAnchor="middle" fill="#0B0E14" fontSize="18" fontWeight="900">%</text>
          </g>
        </svg>
      )}
      {type === 'clima_seco' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="14" y="68" width="72" height="20" rx="5" fill="#E05A2B" stroke="#9A3412" strokeWidth="2" />
          <circle cx="50" cy="42" r="22" fill="#FACC15" stroke="#EA580C" strokeWidth="2" />
          <rect x="34" y="34" width="14" height="9" rx="2" fill="#0B0E14" />
          <rect x="52" y="34" width="14" height="9" rx="2" fill="#0B0E14" />
        </svg>
      )}
      {type === 'clima_humedad' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M42 14 C42 14 18 46 18 64 C18 78 29 88 42 88 C55 88 66 78 66 64 C66 46 42 14 42 14 Z" fill="#00A3FF" />
          <circle cx="68" cy="68" r="18" fill="#D6FF00" stroke="#0B0E14" strokeWidth="2" />
        </svg>
      )}
      {type === 'clima_llovizna' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M26 58 H72 A14 14 0 0 0 74 32 A20 20 0 0 0 36 28 A15 15 0 0 0 26 58 Z" fill="#94A3B8" />
          <path d="M35 66 L31 78 M50 68 L46 80 M65 66 L61 78" stroke="#00A3FF" strokeWidth="4.5" strokeLinecap="round" />
          <polygon points="74,26 92,56 56,56" fill="#FACC15" stroke="#0B0E14" strokeWidth="2" />
        </svg>
      )}
      {type === 'clima_tormenta' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M24 54 H76 A14 14 0 0 0 78 28 A22 22 0 0 0 36 24 A16 16 0 0 0 24 54 Z" fill="#334155" />
          <polygon points="54,44 38,68 50,68 44,90 66,62 53,62" fill="#D6FF00" stroke="#0B0E14" strokeWidth="1.5" />
        </svg>
      )}
    </div>
  );
};

export const ClubBadge = ({ clubName, size = 24, showLabel = false, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  if (!clubName || clubName.toLowerCase().includes('independiente')) {
    return showLabel ? (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold opacity-75 ${className}`}>
        <span>🎾 Independiente</span>
      </span>
    ) : null;
  }

  const norm = clubName.toLowerCase();
  let clubKey = 'inkas';
  let path = CANVA_ASSETS_PATHS.club_inkas;
  if (norm.includes('tauro')) {
    clubKey = 'tauro';
    path = CANVA_ASSETS_PATHS.club_tauro;
  } else if (norm.includes('romina') || norm.includes('cutipa')) {
    clubKey = 'romina';
    path = CANVA_ASSETS_PATHS.club_romina;
  } else if (norm.includes('country') || norm.includes('huancas')) {
    clubKey = 'huancas';
    path = CANVA_ASSETS_PATHS.club_huancas;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 select-none shrink-0 ${className}`} title={clubName}>
      <div style={{ width: size, height: size }} className="rounded-full overflow-hidden flex items-center justify-center shadow-md ring-2 ring-black/40 shrink-0">
        {!imgError && path ? (
          <img src={path} alt={clubName} onError={() => setImgError(true)} className="w-full h-full object-cover rounded-full" />
        ) : (
          <>
            {clubKey === 'inkas' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="50" fill="#FFFFFF" />
                <circle cx="50" cy="38" r="14" fill="#FACC15" stroke="#B45309" strokeWidth="2.5" />
                <text x="50" y="82" textAnchor="middle" fill="#0284C7" fontSize="16" fontWeight="900">INKAS</text>
              </svg>
            )}
            {clubKey === 'tauro' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="50" fill="#063F28" />
                <path d="M22 30 C16 48 28 58 38 56 C28 50 26 40 28 30 Z M78 30 C84 48 72 58 62 56 C72 50 74 40 72 30 Z" fill="#FBBF24" />
                <circle cx="50" cy="48" r="16" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" />
              </svg>
            )}
            {clubKey === 'romina' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="50" fill="#172554" />
                <circle cx="50" cy="50" r="34" fill="#FFFFFF" />
                <polygon points="22,56 42,30 56,48 68,34 80,56" fill="#1E3A8A" />
                <text x="56" y="64" textAnchor="middle" fill="#172554" fontSize="13" fontWeight="900">RC</text>
              </svg>
            )}
            {clubKey === 'huancas' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="50" fill="#FFFFFF" />
                <circle cx="50" cy="50" r="44" fill="#15803D" />
                <circle cx="50" cy="50" r="28" fill="#166534" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M44 38 A10 10 0 1 0 44 56 M62 38 A10 10 0 1 0 62 56" fill="none" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
          </>
        )}
      </div>
      {showLabel && <span className="text-xs font-bold tracking-tight truncate">{clubName}</span>}
    </div>
  );
};

export const PlayerAvatarWithClub = ({
  jugador,
  size = 48,
  ringColor = 'border-[#00A3FF]',
  showClubBadge = true,
  onClick
}) => {
  const clubSize = Math.max(18, Math.round(size * 0.4));
  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-full h-full rounded-full overflow-hidden border-2 ${ringColor} bg-[#161B26] flex items-center justify-center shadow-inner`}>
        {jugador?.foto_url ? (
          <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover object-center" />
        ) : (
          <span className="font-display font-black text-white/90" style={{ fontSize: Math.round(size * 0.36) }}>
            {(jugador?.nombre || 'MP').split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </span>
        )}
      </div>
      {showClubBadge && jugador?.club && !jugador.club.toLowerCase().includes('independiente') && (
        <div className="absolute -bottom-1 -right-1 z-10">
          <ClubBadge clubName={jugador.club} size={clubSize}/>
        </div>
      )}
    </div>
  );
};

// === FIN DEL BLOQUE 1 DE 5 ===// ============================================================================
// BLOQUE 2 DE 5: DATOS MAESTROS OFICIALES (4 CLUBES, JUGADORES, SALÓN DE LA FAMA,
//                COACHES PRO, NOTICIAS ATP, TORNEOS, PRO SHOP) Y COMPONENTES
//                DE CABECERA INSTITUCIONAL, MAGAZINE ATP Y MAPA DE NIVELES
// ============================================================================

export const INITIAL_CLUBS = [
  {
    id: 'club-huancas',
    nombre: 'Country Club Los Huancas',
    zona: 'El Tambo · 3 Canchas de Arcilla Reglamentarias',
    badgeTipo: 'SEDE OFICIAL',
    esTechada: false,
    tarifaInfo: 'Tarifa institucional fija: S/ 15 por jugador/hora (Pago en recepción)',
    serviciosReales: [
      '🧱 3 Canchas de polvo de ladrillo con mantenimiento diario',
      '💡 Iluminación LED para turnos nocturnos',
      '🎾 Venta de tubos de pelotas Wilson & Babolat en recepción',
      '🚿 Vestuarios, duchas y estacionamiento privado'
    ],
    partnerBrand: 'WILSON ROLAND GARROS PARTNER',
    ticketVipTitulo: '15% DCTO EN HORARIO VALLE',
    ticketVipDetalle: 'Lun a Vie (10:00 a 15:00 hrs) presentando tu Carnet VIP Matchpoint.',
    estadoClima: 'seco',
    estadoTexto: 'Cancha Seca · Óptima',
    temperatura: '20°C · Soleado',
    ultimoReportePor: 'Rodrigo Quispe',
    horaReporte: '15:10',
    whatsapp: '51964000001',
    imagenUrl: '[https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80](https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80)'
  },
  {
    id: 'club-tauro',
    nombre: 'Club Tauro Tenis',
    zona: 'San Carlos · 2 Canchas de Arcilla Techadas',
    badgeTipo: 'SEDE TECHADA OFICIAL',
    esTechada: true,
    tarifaInfo: 'Alquiler abierto por hora (Sin requisito de membresía)',
    serviciosReales: [
      '🏛️ Cobertura techada integral (100% jugable con lluvia)',
      '💡 Reflectores de alta potencia para duelos nocturnos',
      '🥤 Zona de hidratación Gatorade & bebidas frías',
      '⚡ Recepción oficial de raquetas para taller de encordado'
    ],
    partnerBrand: 'BABOLAT PERÚ PARTNER',
    ticketVipTitulo: 'PRIORIDAD DE RESERVA EN LLUVIA',
    ticketVipDetalle: 'Turnos preferenciales asegurados para partidos oficiales del Ranking.',
    estadoClima: 'seco',
    estadoTexto: 'Techado · 100% Jugable',
    temperatura: '18°C · Cubierto',
    ultimoReportePor: 'Gonzalo Palacios',
    horaReporte: '14:45',
    whatsapp: '51964000002',
    imagenUrl: '[https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=80](https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=80)'
  },
  {
    id: 'club-romina',
    nombre: 'Academia Romina Cutipa',
    zona: 'Huancayo Este · 2 Canchas de Arcilla',
    badgeTipo: 'SEDE FORMATIVA & PRO',
    esTechada: false,
    tarifaInfo: 'Alquiler por hora y programas de entrenamiento técnico',
    serviciosReales: [
      '🎯 Canchas reglamentarias con canastos de alta capacidad',
      '🥤 Hidratación oficial Powerade & Gatorade en sede',
      '🎾 Alquiler de raquetas para alumnos de iniciación (5ª P / 5ª B)',
      '📋 Certificación oficial de nivel con entrenadores acreditados'
    ],
    partnerBrand: 'HEAD & GATORADE PARTNER',
    ticketVipTitulo: '20% DCTO EN DIAGNÓSTICO TÉCNICO',
    ticketVipDetalle: 'En tu primera sesión de biomecánica de saque con Carnet VIP.',
    estadoClima: 'humedad',
    estadoTexto: 'Humedad Leve · Jugable',
    temperatura: '17°C · Nublado parcial',
    ultimoReportePor: 'Diego Cárdenas',
    horaReporte: '16:00',
    whatsapp: '51964000003',
    imagenUrl: '[https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80](https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80)'
  },
  {
    id: 'club-inkas',
    nombre: 'Club Los Inkas Huancayo',
    zona: 'Huancayo · Canchas Abiertas de Polvo de Ladrillo',
    badgeTipo: 'SEDE OFICIAL',
    esTechada: false,
    tarifaInfo: 'Alquiler abierto por hora y retos de fin de semana',
    serviciosReales: [
      '🧱 Superficie de arcilla compactada de pique alto',
      '☀️ Excelente orientación solar para turnos de mañana y tarde',
      '🥤 Kiosco deportivo y terraza de visualización de partidos',
      '🤝 Sede anfitriona de la Guerra de Clubes Huancayo'
    ],
    partnerBrand: 'DUNLOP & POWERADE PARTNER',
    ticketVipTitulo: '15% DCTO EN ALQUILER DE CANCHA',
    ticketVipDetalle: 'En partidos pactados desde la Central de Retos Matchpoint.',
    estadoClima: 'seco',
    estadoTexto: 'Cancha Seca · Óptima',
    temperatura: '21°C · Despejado',
    ultimoReportePor: 'Mateo Samaniego',
    horaReporte: '15:30',
    whatsapp: '51964000004',
    imagenUrl: '[https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=1000&q=80](https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=1000&q=80)'
  }
];

export const INITIAL_PLAYERS = [
  {
    id: 'p-1',
    nombre: 'Rodrigo Quispe',
    elo: 3520,
    victorias: 11,
    derrotas: 1,
    racha: 5,
    tendenciaSemanal: 2,
    club: 'Country Club Los Huancas',
    divisionEspecial: 'General',
    edad: 29,
    estatura: '1.79 m',
    manoHabil: 'Diestro',
    tipoReves: 'Revés a dos manos',
    superficieFavorita: 'Arcilla (Polvo de ladrillo)',
    entrenador: 'Comité ITF Regional',
    mejorRankingHistorico: 1,
    titulosTemporada: 2,
    puntosTienda: 140,
    esVip: true,
    telefono: '964111001',
    email: 'rodrigo@matchpoint.pe',
    password: '123',
    dni: '70112233',
    ultimoPartidoTs: Date.now() - 2 * 86400000,
    foto_url: '[https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'p-2',
    nombre: 'Gonzalo Palacios',
    elo: 3180,
    victorias: 8,
    derrotas: 2,
    racha: 3,
    tendenciaSemanal: 1,
    club: 'Club Los Inkas Huancayo',
    divisionEspecial: 'General',
    edad: 31,
    estatura: '1.82 m',
    manoHabil: 'Diestro',
    tipoReves: 'Revés a una mano',
    superficieFavorita: 'Arcilla Techada',
    entrenador: 'Rodrigo Quispe',
    mejorRankingHistorico: 2,
    titulosTemporada: 1,
    puntosTienda: 110,
    esVip: true,
    telefono: '964111002',
    email: 'gonzalo@matchpoint.pe',
    password: '123',
    dni: '70112234',
    ultimoPartidoTs: Date.now() - 4 * 86400000,
    foto_url: '[https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'p-3',
    nombre: 'Mateo Samaniego',
    elo: 2790,
    victorias: 7,
    derrotas: 2,
    racha: 2,
    tendenciaSemanal: 0,
    club: 'Club Tauro Tenis',
    divisionEspecial: 'General',
    edad: 26,
    estatura: '1.76 m',
    manoHabil: 'Zurdo',
    tipoReves: 'Revés a dos manos',
    superficieFavorita: 'Arcilla',
    entrenador: 'Romina Cutipa',
    mejorRankingHistorico: 3,
    titulosTemporada: 1,
    puntosTienda: 90,
    esVip: false,
    telefono: '964111003',
    email: 'mateo@matchpoint.pe',
    password: '123',
    dni: '70112235',
    ultimoPartidoTs: Date.now() - 3 * 86400000,
    foto_url: '[https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'p-4',
    nombre: 'Alejandro Tovar',
    elo: 2500,
    victorias: 7,
    derrotas: 1,
    racha: 4,
    tendenciaSemanal: 3,
    club: 'Country Club Los Huancas',
    divisionEspecial: '+40 Senior',
    edad: 44,
    estatura: '1.80 m',
    manoHabil: 'Diestro',
    tipoReves: 'Revés a una mano',
    superficieFavorita: 'Arcilla',
    entrenador: 'Rodrigo Quispe',
    mejorRankingHistorico: 4,
    titulosTemporada: 1,
    puntosTienda: 120,
    esVip: true,
    telefono: '964111004',
    email: 'alejandro@matchpoint.pe',
    password: '123',
    dni: '40112236',
    ultimoPartidoTs: Date.now() - 5 * 86400000,
    foto_url: '[https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'p-5',
    nombre: 'Diego Cárdenas',
    elo: 2124,
    victorias: 9,
    derrotas: 2,
    racha: 2,
    tendenciaSemanal: -1,
    club: 'Academia Romina Cutipa',
    divisionEspecial: 'General',
    edad: 24,
    estatura: '1.75 m',
    manoHabil: 'Diestro',
    tipoReves: 'Revés a dos manos',
    superficieFavorita: 'Arcilla',
    entrenador: 'Romina Cutipa',
    mejorRankingHistorico: 4,
    titulosTemporada: 1,
    puntosTienda: 110,
    esVip: true,
    telefono: '964111005',
    email: 'diego@matchpoint.pe',
    password: '123',
    dni: '72112237',
    ultimoPartidoTs: Date.now() - 6 * 86400000,
    foto_url: '[https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'p-6',
    nombre: 'Romina Cutipa',
    elo: 2940,
    victorias: 8,
    derrotas: 0,
    racha: 8,
    tendenciaSemanal: 2,
    club: 'Academia Romina Cutipa',
    divisionEspecial: 'Damas',
    edad: 27,
    estatura: '1.68 m',
    manoHabil: 'Diestra',
    tipoReves: 'Revés a dos manos',
    superficieFavorita: 'Arcilla',
    entrenador: 'Head Coach',
    mejorRankingHistorico: 1,
    titulosTemporada: 2,
    puntosTienda: 160,
    esVip: true,
    telefono: '964111006',
    email: 'romina@matchpoint.pe',
    password: '123',
    dni: '71112238',
    ultimoPartidoTs: Date.now() - 1 * 86400000,
    foto_url: '[https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'p-7',
    nombre: 'Carlos Mendoza',
    elo: 1920,
    victorias: 5,
    derrotas: 3,
    racha: 0,
    tendenciaSemanal: -1,
    club: 'Independiente',
    divisionEspecial: 'General',
    edad: 33,
    estatura: '1.77 m',
    manoHabil: 'Diestro',
    tipoReves: 'Revés a dos manos',
    superficieFavorita: 'Arcilla',
    entrenador: 'Libre',
    mejorRankingHistorico: 5,
    titulosTemporada: 0,
    puntosTienda: 80,
    esVip: false,
    telefono: '964111007',
    email: 'carlos@matchpoint.pe',
    password: '123',
    dni: '70112239',
    ultimoPartidoTs: Date.now() - 8 * 86400000,
    foto_url: '[https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'p-8',
    nombre: 'Valeria Salazar',
    elo: 1640,
    victorias: 4,
    derrotas: 2,
    racha: 2,
    tendenciaSemanal: 1,
    club: 'Club Tauro Tenis',
    divisionEspecial: 'Damas',
    edad: 25,
    estatura: '1.66 m',
    manoHabil: 'Diestra',
    tipoReves: 'Revés a dos manos',
    superficieFavorita: 'Arcilla Techada',
    entrenador: 'Romina Cutipa',
    mejorRankingHistorico: 6,
    titulosTemporada: 0,
    puntosTienda: 60,
    esVip: false,
    telefono: '964111008',
    email: 'valeria@matchpoint.pe',
    password: '123',
    dni: '73112240',
    ultimoPartidoTs: Date.now() - 4 * 86400000,
    foto_url: '[https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80)'
  }
];

export const INITIAL_HALL_OF_FAME = [
  {
    id: 'hof-1',
    division: '3ª CATEGORÍA · OLIMPO HUANCAYO',
    jugadorId: 'p-1',
    nombre: 'Rodrigo Quispe',
    club: 'Country Club Los Huancas',
    victorias: 11,
    derrotas: 1,
    puntosCierre: 3520,
    temporada: 'TEMPORADA INVIERNO 2026',
    foto_url: '[https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'hof-2',
    division: '4ª CATEGORÍA · COMPETITIVO',
    jugadorId: 'p-5',
    nombre: 'Diego Cárdenas',
    club: 'Academia Romina Cutipa',
    victorias: 9,
    derrotas: 2,
    puntosCierre: 2480,
    temporada: 'TEMPORADA INVIERNO 2026',
    foto_url: '[https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'hof-3',
    division: 'DAMAS OFICIAL · ABIERTO',
    jugadorId: 'p-6',
    nombre: 'Romina Cutipa',
    club: 'Academia Romina Cutipa',
    victorias: 8,
    derrotas: 0,
    puntosCierre: 2940,
    temporada: 'TEMPORADA INVIERNO 2026',
    foto_url: '[https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80)'
  },
  {
    id: 'hof-4',
    division: 'SENIOR +40 · MASTERS',
    jugadorId: 'p-4',
    nombre: 'Alejandro Tovar',
    club: 'Country Club Los Huancas',
    victorias: 7,
    derrotas: 1,
    puntosCierre: 2500,
    temporada: 'TEMPORADA INVIERNO 2026',
    foto_url: '[https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80)'
  }
];

export const INITIAL_COACHES = [
  {
    id: 'coach-1',
    nombre: 'Rodrigo Quispe',
    credencial: 'COACH NIVEL ITF · EX N°1 REGIONAL',
    clubPrincipal: 'Country Club Los Huancas',
    precioBase: 50,
    alumnosAscendidos: 9,
    bio: 'Especialista en biomecánica de impacto, corrección de segundo servicio bajo presión y táctica de singles para jugadores de club.',
    especialidades: ['Adultos +40', 'Biomecánica de Saque', 'Táctica de Singles'],
    foto_url: '[https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80](https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80)',
    banner_url: '[https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80](https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80)',
    whatsapp: '51964111001',
    programas: [
      {
        id: 'prog-1',
        titulo: 'Sesión Individual 1 a 1',
        subtitulo: '60 min · Corrección de golpes y peloteo intensivo con canasto',
        precio: 50,
        unidad: 'sesión',
        badgePromo: null
      },
      {
        id: 'prog-2',
        titulo: 'Pack 4 Clases · Subida de Categoría',
        subtitulo: '4 horas al mes · Plan táctico para subir de división en el Ranking',
        precio: 180,
        unidad: 'pack',
        badgePromo: 'AHORRAS S/ 20 · INCLUYE DIAGNÓSTICO ELO'
      },
      {
        id: 'prog-3',
        titulo: 'Clínica Grupal Senior +40 (Sábados)',
        subtitulo: '90 min · Máximo 4 jugadores · Juego de red, dobles y colocación',
        precio: 35,
        unidad: 'alumno',
        badgePromo: 'CUPOS LIMITADOS'
      }
    ],
    horariosDisponibles: [
      { id: 'h-1', diaHora: 'Mañana · 08:00 AM', sede: 'Country Club Los Huancas', disponible: true },
      { id: 'h-2', diaHora: 'Mañana · 10:00 AM', sede: 'Country Club Los Huancas', disponible: true },
      { id: 'h-3', diaHora: 'Jueves · 07:00 PM', sede: 'Academia Romina Cutipa', disponible: true },
      { id: 'h-4', diaHora: 'Sábado · 09:00 AM', sede: 'Country Club Los Huancas', disponible: true }
    ],
    resenas: [
      {
        id: 'rev-1',
        autorId: 'p-4',
        autorNombre: 'Alejandro Tovar',
        autorCategoria: 'Senior +40',
        autorClub: 'Country Club Los Huancas',
        autorFoto: '[https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80](https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80)',
        rating: 5,
        comentario: 'Corrigió mi segundo saque en dos sesiones. Muy claro para explicar la biomecánica.',
        fecha: 'Hace 3 días'
      },
      {
        id: 'rev-2',
        autorId: 'p-3',
        autorNombre: 'Mateo Samaniego',
        autorCategoria: 'Cat. 4ª',
        autorClub: 'Club Tauro Tenis',
        autorFoto: '[https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80](https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80)',
        rating: 5,
        comentario: 'Excelentes ejercicios de ritmo de fondo y subida a la red. Subí 180 puntos ELO este mes.',
        fecha: 'Hace 1 semana'
      }
    ]
  },
  {
    id: 'coach-2',
    nombre: 'Romina Cutipa',
    credencial: 'HEAD COACH · DIRECTORA DE ACADEMIA',
    clubPrincipal: 'Academia Romina Cutipa',
    precioBase: 45,
    alumnosAscendidos: 14,
    bio: 'Formación integral desde nivel cero (5ª P) hasta competencia regional. Especialista en técnica moderna de topspin y tenis femenino.',
    especialidades: ['Iniciación desde Cero', 'Tenis Damas', 'Footwork & Topspin'],
    foto_url: '[https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80](https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80)',
    banner_url: '[https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80](https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80)',
    whatsapp: '51964111006',
    programas: [
      {
        id: 'prog-r1',
        titulo: 'Sesión Técnica Personalizada',
        subtitulo: '60 min · Canasto + corrección biomecánica de drive y revés',
        precio: 45,
        unidad: 'sesión',
        badgePromo: null
      },
      {
        id: 'prog-r2',
        titulo: 'Pack Arranque 5ª P (4 Sesiones)',
        subtitulo: 'Aprende desde cero hasta disputar tus primeros 5 partidos de calibración',
        precio: 160,
        unidad: 'pack',
        badgePromo: 'INCLUYE PRÉSTAMO DE RAQUETA'
      }
    ],
    horariosDisponibles: [
      { id: 'hr-1', diaHora: 'Mañana · 09:00 AM', sede: 'Academia Romina Cutipa', disponible: true },
      { id: 'hr-2', diaHora: 'Viernes · 04:00 PM', sede: 'Academia Romina Cutipa', disponible: true },
      { id: 'hr-3', diaHora: 'Sábado · 10:30 AM', sede: 'Club Tauro Tenis', disponible: true }
    ],
    resenas: [
      {
        id: 'rev-r1',
        autorId: 'p-8',
        autorNombre: 'Valeria Salazar',
        autorCategoria: 'Damas · 5ª A',
        autorClub: 'Club Tauro Tenis',
        autorFoto: '[https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80](https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80)',
        rating: 5,
        comentario: 'Empecé desde cero en la academia y en dos meses ya estoy compitiendo en el ranking.',
        fecha: 'Hace 5 días'
      }
    ]
  }
];

export const INITIAL_MATCHES = [
  {
    id: 'm-live-1',
    jugadorAId: 'p-3',
    jugadorANombre: 'Mateo Samaniego',
    jugadorAElo: 2790,
    jugadorAClub: 'Club Tauro Tenis',
    jugadorAFoto: '[https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80)',
    jugadorBId: 'p-4',
    jugadorBNombre: 'Alejandro Tovar',
    jugadorBElo: 2500,
    jugadorBClub: 'Country Club Los Huancas',
    jugadorBFoto: '[https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80)',
    sede: 'Country Club Los Huancas · Pista 1',
    fechaHora: 'En Cancha Ahora',
    estado: 'En Cancha',
    enVivo: true,
    sacadorActual: 'A',
    sets: [{ a: 6, b: 4 }, { a: 3, b: 2 }],
    puntosGameActual: { a: '30', b: '15' },
    ultimaActualizacionMin: 3,
    veedorReporte: 'Carlos Mendoza',
    eloEnJuego: 38,
    timestamp: Date.now() - 1800000
  },
  {
    id: 'm-prog-1',
    jugadorAId: 'p-1',
    jugadorANombre: 'Rodrigo Quispe',
    jugadorAElo: 3520,
    jugadorAClub: 'Country Club Los Huancas',
    jugadorAFoto: '[https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80)',
    jugadorBId: 'p-2',
    jugadorBNombre: 'Gonzalo Palacios',
    jugadorBElo: 3180,
    jugadorBClub: 'Club Los Inkas Huancayo',
    jugadorBFoto: '[https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80)',
    sede: 'Club Tauro Tenis · Cancha Techada 1',
    fechaHora: 'Sábado · 17:00 hrs',
    estado: 'Programado',
    enVivo: false,
    sacadorActual: 'A',
    sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }],
    puntosGameActual: { a: '0', b: '0' },
    ultimaActualizacionMin: 0,
    veedorReporte: '',
    eloEnJuego: 42,
    timestamp: Date.now()
  },
  {
    id: 'm-hist-1',
    jugadorAId: 'p-1',
    jugadorANombre: 'Rodrigo Quispe',
    jugadorAElo: 3520,
    jugadorAClub: 'Country Club Los Huancas',
    jugadorAFoto: '[https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80)',
    jugadorBId: 'p-3',
    jugadorBNombre: 'Mateo Samaniego',
    jugadorBElo: 2790,
    jugadorBClub: 'Club Tauro Tenis',
    jugadorBFoto: '[https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80)',
    sede: 'Country Club Los Huancas',
    fechaHora: 'Hace 4 días',
    estado: 'Finalizado',
    marcadorFinal: '6-3, 6-4',
    ganadorId: 'p-1',
    deltaElo: 28,
    enVivo: false,
    sets: [{ a: 6, b: 3 }, { a: 6, b: 4 }],
    timestamp: Date.now() - 4 * 86400000
  }
];

export const INITIAL_NEWS = [
  {
    id: 'news-1',
    categoria: 'TENIS PERUANO · CHALLENGER',
    sponsorTag: 'PRESENTADO POR WILSON',
    titulo: 'Ignacio Buse firma una remontada épica y avanza a semifinales en arcilla',
    resumen: 'El tenista nacional conectó 9 aces y sostuvo el quiebre en el tercer set. Repasa las claves tácticas de su victoria.',
    imagenUrl: '[https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80](https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80)',
    fecha: 'Hoy · Redacción Matchpoint',
    ctaTexto: 'Ver Nota Completa',
    esSponsor: false
  },
  {
    id: 'news-2',
    categoria: 'CIRCUITO HUANCAYO · OFICIAL',
    sponsorTag: 'GATORADE MATCH TIME',
    titulo: 'Country Club Los Huancas y Club Los Inkas lideran la Guerra de Sedes',
    resumen: 'Los duelos de este fin de semana definirán qué institución encabeza el promedio ELO de la temporada.',
    imagenUrl: '[https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80](https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80)',
    fecha: 'Hace 1 día · Comité Oficial',
    ctaTexto: 'Explorar Sedes',
    esSponsor: true
  },
  {
    id: 'news-3',
    categoria: 'EQUIPAMIENTO & PRO SHOP',
    sponsorTag: 'TALLER OFICIAL MATCHPOINT',
    titulo: '¿Cada cuántos partidos debes cambiar el encordado en la altura de Huancayo?',
    resumen: 'A 3,259 m s. n. m. la pérdida de tensión reduce el control un 24%. Los socios con Carnet VIP tienen tarifa preferencial.',
    imagenUrl: '[https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80](https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80)',
    fecha: 'Hace 2 días · Pro Shop',
    ctaTexto: 'Ir a Pro Shop',
    esSponsor: true
  }
];

export const INITIAL_TOURNAMENTS = [
  {
    id: 'tor-1',
    titulo: 'Abierto de Huancayo · 3ª Categoría',
    subtitulo: 'Cuadro de Eliminación Directa + Ronda Consuelo Garantizada',
    sponsor: 'PRESENTADO POR WILSON & GATORADE',
    sede: 'Country Club Los Huancas',
    fechas: '21 y 22 de Noviembre 2026',
    categoria: 'Cat. 3ª',
    estado: 'Cuadro en Juego',
    inscritosActuales: 8,
    cuposTotales: 8,
    precioInscripcion: 40,
    premioCampeon: 'Trofeo Oficial + S/ 300 + +120 Pts ELO',
    imagenUrl: '[https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80](https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80)',
    participantes: [
      'Rodrigo Quispe', 'Gonzalo Palacios', 'Mateo Samaniego', 'Alejandro Tovar',
      'Diego Cárdenas', 'Carlos Mendoza', 'Romina Cutipa', 'Valeria Salazar'
    ],
    cuartos: [
      {
        id: 'qf-1',
        canchaHora: 'Pista 1 · Sáb 09:00',
        j1: 'Rodrigo Quispe', j1Club: 'Country Club Los Huancas',
        j2: 'Carlos Mendoza', j2Club: 'Independiente',
        estado: 'Finalizado', marcador: '6-3, 6-4', ganador: 'Rodrigo Quispe',
        sets: [{ a: 6, b: 3 }, { a: 6, b: 4 }], enVivo: false
      },
      {
        id: 'qf-2',
        canchaHora: 'Pista 2 · Sáb 09:00',
        j1: 'Alejandro Tovar', j1Club: 'Country Club Los Huancas',
        j2: 'Gonzalo Palacios', j2Club: 'Club Los Inkas Huancayo',
        estado: 'Finalizado', marcador: '7-5, 6-4', ganador: 'Alejandro Tovar',
        sets: [{ a: 7, b: 5 }, { a: 6, b: 4 }], enVivo: false
      },
      {
        id: 'qf-3',
        canchaHora: 'Pista 1 · Sáb 11:00',
        j1: 'Diego Cárdenas', j1Club: 'Academia Romina Cutipa',
        j2: 'Mateo Samaniego', j2Club: 'Club Tauro Tenis',
        estado: 'En Cancha', marcador: '6-4, 3-4', ganador: null,
        sets: [{ a: 6, b: 4 }, { a: 3, b: 4 }], enVivo: true, sacador: 1, actualizadoHaceMin: 2
      },
      {
        id: 'qf-4',
        canchaHora: 'Pista 2 · Sáb 11:00',
        j1: 'Romina Cutipa', j1Club: 'Academia Romina Cutipa',
        j2: 'Valeria Salazar', j2Club: 'Club Tauro Tenis',
        estado: 'Programado', marcador: '', ganador: null,
        sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }], enVivo: false
      }
    ],
    semifinales: [
      {
        id: 'sf-1',
        canchaHora: 'Pista Central · Dom 09:30',
        j1: 'Rodrigo Quispe', j1Club: 'Country Club Los Huancas',
        j2: 'Alejandro Tovar', j2Club: 'Country Club Los Huancas',
        estado: 'Programado', marcador: '', ganador: null,
        sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }], enVivo: false
      },
      {
        id: 'sf-2',
        canchaHora: 'Pista Central · Dom 11:00',
        j1: 'Por Definir (QF 3)', j1Club: 'Independiente',
        j2: 'Por Definir (QF 4)', j2Club: 'Independiente',
        estado: 'Pendiente', marcador: '', ganador: null,
        sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }], enVivo: false
      }
    ],
    final: [
      {
        id: 'fin-1',
        canchaHora: 'Gran Final · Dom 15:30',
        j1: 'Ganador Semifinal 1', j1Club: 'Independiente',
        j2: 'Ganador Semifinal 2', j2Club: 'Independiente',
        estado: 'Pendiente', marcador: '', ganador: null,
        sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }], enVivo: false
      }
    ],
    consuelo: [
      {
        id: 'con-1',
        canchaHora: 'Ronda Consuelo · Dom 10:00',
        j1: 'Carlos Mendoza', j1Club: 'Independiente',
        j2: 'Gonzalo Palacios', j2Club: 'Club Los Inkas Huancayo',
        estado: 'Programado', marcador: '', ganador: null,
        sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }], enVivo: false
      }
    ]
  }
];

export const INITIAL_PROSHOP_ITEMS = [
  {
    id: 'shop-1',
    categoria: 'ENCORDADO PROFESIONAL',
    nombre: 'Encordado Electrónico + Cuerda Poliéster Hexagonal Tour',
    descripcion: 'Tensión calibrada para la altura de Huancayo (48 a 56 lbs). Recepción en los 4 clubes.',
    precioRegular: 45,
    precioVip: 32,
    puntosCanje: 80,
    stockTexto: 'Entrega 24h'
  },
  {
    id: 'shop-2',
    categoria: 'PELOTAS OFICIALES',
    nombre: 'Tubo Wilson Roland Garros All Court (3 Pelotas)',
    descripcion: 'Pelota oficial de los torneos y retos del circuito Matchpoint. Fieltro de alta duración.',
    precioRegular: 38,
    precioVip: 30,
    puntosCanje: 100,
    stockTexto: 'En Cancha'
  },
  {
    id: 'shop-3',
    categoria: 'ACCESORIOS PRO',
    nombre: 'Pack x3 Overgrips Absorbentes Matchpoint Tour Feel',
    descripcion: 'Agarre seco antideslizante ideal para partidos intensos a mediodía.',
    precioRegular: 25,
    precioVip: 18,
    puntosCanje: 50,
    stockTexto: 'Disponible'
  }
];

// ----------------------------------------------------------------------------
// 7. HEADER INSTITUCIONAL (CON LOGO OFICIAL + ESTANDARTE COLGANTE PRO SHOP)
// ----------------------------------------------------------------------------
export const HeaderInstitucional = ({
  isLightMode,
  usuarioActivo,
  notificacionesCount,
  onOpenMenu,
  onOpenProShop,
  onOpenNotificaciones,
  onOpenAuth,
  onOpenPerfil
}) => {
  return (
    <header
      className={`sticky top-0 z-40 px-3.5 py-2.5 border-b backdrop-blur-xl transition-colors ${
        isLightMode
          ? 'bg-white/90 border-slate-200 text-slate-900'
          : 'bg-[#0B0E14]/90 border-white/10 text-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Izquierda: Menú + Estandarte Ribbon de Tienda (Sin icono duplicado) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { triggerHaptic('light'); onOpenMenu(); }}
            className={`mp-icon-btn w-10 h-10 rounded-xl flex items-center justify-center border ${
              isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-[#141923] border-white/10 text-white'
            }`}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5"/>
          </button>

          {/* Estandarte / Bandera Comercial Pro Shop */}
          <button
            type="button"
            onClick={() => { triggerHaptic('medium'); onOpenProShop(); }}
            className="mp-hero-btn relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D6FF00] via-[#E5FF4D] to-[#00A3FF] text-[#0B0E14] shadow-[0_0_15px_rgba(214,255,0,0.35)] border border-white/40"
          >
            <CanvaIcon3D size={20} type="pro_shop_rollo"/>
            <div className="text-left leading-none">
              <span className="block font-display font-black text-[10px] tracking-wider uppercase">
                PRO SHOP ⚡
              </span>
              <span className="block font-display font-bold text-[8px] opacity-85">
                ENCORDADO
              </span>
            </div>
          </button>
        </div>

        {/* Centro: Logo Oficial MATCHPOINT Siempre Visible */}
        <div
          onClick={() => { triggerHaptic('selection'); onOpenPerfil(); }}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <MatchpointOfficialLogo size={34}/>
          <div className="text-left leading-none hidden xs:block sm:block">
            <h1 className="font-display font-black text-base tracking-tight">
              MATCH<span className={isLightMode ? 'text-[#0066FF]' : 'text-[#D6FF00]'}>POINT</span>
            </h1>
            <p className="text-[8px] font-bold tracking-[0.2em] uppercase opacity-60">
              ATP CIRCUIT · HYO
            </p>
          </div>
        </div>

        {/* Derecha: Campanita Reactiva + Botón Entrar o Avatar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { triggerHaptic('light'); onOpenNotificaciones(); }}
            className={`mp-icon-btn relative w-10 h-10 rounded-xl flex items-center justify-center border ${
              isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-[#141923] border-white/10 text-white'
            }`}
          >
            <Bell className="w-4 h-4 text-[#00A3FF]"/>
            {notificacionesCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[10px] flex items-center justify-center shadow-md animate-bounce">
                {notificacionesCount}
              </span>
            )}
          </button>

          {usuarioActivo ? (
            <button
              type="button"
              onClick={() => { triggerHaptic('light'); onOpenPerfil(); }}
              className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-[#141923] border border-[#00A3FF]/40 text-white"
            >
              <PlayerAvatarWithClub jugador={usuarioActivo} showClubBadge={false} size={28}/>
              <span className="font-display font-extrabold text-xs max-w-[68px] truncate">
                {usuarioActivo.nombre.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { triggerHaptic('medium'); onOpenAuth(); }}
              className="mp-hero-btn px-3.5 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wide bg-[#00A3FF] text-white shadow-[0_0_14px_rgba(0,163,255,0.4)]"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// ----------------------------------------------------------------------------
// 8. CARRUSEL EDITORIAL MAGAZINE ATP (NOTICIAS & SPONSORS 16:9 SIN VIDEOS PESADOS)
// ----------------------------------------------------------------------------
export const NewsMagazineCarousel = ({ noticias, isLightMode, onSelectCta }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!noticias || noticias.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D6FF00] animate-ping" />
          <h2 className="font-display font-black text-xs uppercase tracking-widest opacity-85">
            ACTUALIDAD & SPONSORS · ATP PULSE
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {noticias.map((n, idx) => (
            <button
              key={n.id}
              type="button"
              onClick={() => { triggerHaptic('selection'); setActiveIdx(idx); }}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIdx
                  ? 'w-5 bg-[#00A3FF]'
                  : isLightMode ? 'w-1.5 bg-slate-300' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {noticias.map((item, idx) => (
          <article
            key={item.id}
            onClick={() => setActiveIdx(idx)}
            className={`snap-center shrink-0 w-[88%] sm:w-[82%] rounded-2xl overflow-hidden border relative shadow-lg mp-card-interactive ${
              isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/10'
            }`}
          >
            <div className="relative h-40 w-full overflow-hidden">
              <img
                src={item.imagenUrl}
                alt={item.titulo}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/55 to-transparent" />
              <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[9px] uppercase tracking-wider">
                  {item.categoria}
                </span>
                {item.sponsorTag && (
                  <span className="px-2 py-0.5 rounded-md bg-[#00A3FF]/90 text-white font-display font-bold text-[9px] uppercase">
                    {item.sponsorTag}
                  </span>
                )}
              </div>
              <div className="absolute bottom-2.5 left-3 right-3 text-white">
                <h3 className="font-display font-black text-sm sm:text-base leading-tight line-clamp-2">
                  {item.titulo}
                </h3>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between gap-2">
              <p className={`text-xs line-clamp-2 flex-1 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                {item.resumen}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  if (onSelectCta) onSelectCta(item);
                }}
                className="shrink-0 px-3 py-1.5 rounded-xl font-display font-extrabold text-[11px] bg-[#00A3FF]/15 text-[#00A3FF] border border-[#00A3FF]/30 hover:bg-[#00A3FF] hover:text-white transition-colors"
              >
                {item.ctaTexto || 'Explorar'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

// ----------------------------------------------------------------------------
// 9. MODAL DE ESCALA OFICIAL DE CATEGORÍAS (CENTRADO HERÁLDICO Y PROGRESIÓN)
// ----------------------------------------------------------------------------
export const LevelsProgressionModal = ({ isOpen, onClose, usuarioActivo, isLightMode }) => {
  if (!isOpen) return null;

  const miElo = Number(usuarioActivo?.elo || 1920);
  const progreso = obtenerProgresoSiguienteCategoria(miElo);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl border p-5 relative shadow-2xl ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E131D] border-white/15 text-white'
        }`}
      >
        {/* Botón de Cierre Flotante Desacoplado */}
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <X className="w-4 h-4"/>
        </button>

        {/* Cabecera Simétrica Centrada */}
        <div className="text-center mb-5 pt-1">
          <div className="inline-flex items-center justify-center mb-2">
            <CanvaIcon3D size={54} type="trofeo_laurel"/>
          </div>
          <span className="block font-display font-black text-[10px] tracking-[0.22em] uppercase text-[#00A3FF]">
            SISTEMA MATEMÁTICO ELO PURO
          </span>
          <h2 className="font-display font-black text-xl sm:text-2xl tracking-tight mt-0.5">
            Escala Oficial de Categorías
          </h2>
          <p className={`text-xs mt-1 max-w-xs mx-auto ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Tu división se define 100% por tus puntos oficiales acumulados. Al superar el umbral, tu ascenso es inmediato.
          </p>
        </div>

        {/* Barra Personal de Progreso ("Road to 1ª") */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#00A3FF]/15 via-[#D6FF00]/10 to-transparent border border-[#00A3FF]/40">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-display font-black uppercase text-[#D6FF00]">
              TU NIVEL: {progreso.actual.codigo}
            </span>
            <span className="tabular-nums font-display font-black text-sm">
              {miElo} PTS
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden p-0.5">
            <div
              style={{ width: `${progreso.porcentaje}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#00A3FF] to-[#D6FF00]"
            />
          </div>
          <p className="text-[11px] font-semibold mt-1.5 opacity-90 text-center">
            {progreso.siguiente
              ? `⚡ Estás a solo ${progreso.puntosFaltantes} PTS de ascender a ${progreso.siguiente.codigo}`
              : '👑 Has alcanzado la máxima división del circuito MATCHPOINT'}
          </p>
        </div>

        {/* Lingotes Heráldicos de Rango (Sin font-mono) */}
        <div className="space-y-2.5">
          {ESCALA_CATEGORIAS.map((cat) => {
            const esMiCategoria = cat.id === progreso.actual.id;
            return (
              <div
                key={cat.id}
                className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                  esMiCategoria
                    ? 'bg-gradient-to-r from-[#D6FF00]/15 to-[#00A3FF]/10 border-[#D6FF00] shadow-[0_0_20px_rgba(214,255,0,0.2)]'
                    : isLightMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#141A26] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: cat.colorHex }}
                      className="w-3 h-8 rounded-full shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-black text-sm uppercase tracking-tight">
                          {cat.codigo}
                        </h3>
                        {esMiCategoria && (
                          <span className="px-2 py-0.5 rounded-md bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[9px] uppercase">
                            TU DIVISIÓN
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {cat.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      style={{ color: isLightMode ? '#0052CC' : cat.colorHex }}
                      className="tabular-nums font-display font-black text-sm sm:text-base block"
                    >
                      {cat.max > 6000 ? `${cat.min}+` : `${cat.min} – ${cat.max}`}
                    </span>
                    <span className="font-display font-bold text-[9px] uppercase tracking-widest opacity-60">
                      PUNTOS ELO
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 2 DE 5 ===// ============================================================================
// BLOQUE 3 DE 5: TABLERO LEXUS ATP HEAD-TO-HEAD (H2H BICOLOR), FICHA HOMOGÉNEA
//                DE JUGADOR, CARNET DIGITAL VIP 3D Y TALLER PRO SHOP
// ============================================================================

// ----------------------------------------------------------------------------
// 10. TABLERO CARA A CARA (LEXUS ATP HEAD2HEAD BICOLOR AZUL #00A3FF vs VOLT #D6FF00)
// ----------------------------------------------------------------------------
export const LexusAtpHead2HeadBoard = ({
  jugadorIzq,
  jugadorDer,
  partidos = [],
  isLightMode,
  onRetarDirecto
}) => {
  if (!jugadorIzq || !jugadorDer) return null;

  const crucesDirectos = partidos.filter(
    (m) =>
      m.estado === 'Finalizado' &&
      ((m.jugadorAId === jugadorIzq.id && m.jugadorBId === jugadorDer.id) ||
        (m.jugadorAId === jugadorDer.id && m.jugadorBId === jugadorIzq.id))
  );

  let victoriasIzq = 0;
  let victoriasDer = 0;
  crucesDirectos.forEach((m) => {
    if (m.ganadorId === jugadorIzq.id) victoriasIzq += 1;
    else if (m.ganadorId === jugadorDer.id) victoriasDer += 1;
  });

  if (crucesDirectos.length === 0 && jugadorIzq.id !== jugadorDer.id) {
    victoriasIzq = Number(jugadorIzq.elo) >= Number(jugadorDer.elo) ? 2 : 1;
    victoriasDer = Number(jugadorIzq.elo) >= Number(jugadorDer.elo) ? 1 : 2;
  }

  const totalCruces = Math.max(1, victoriasIzq + victoriasDer);
  const porcentajeIzq = Math.round((victoriasIzq / totalCruces) * 100);
  const radioCirculo = 54;
  const circunferencia = 2 * Math.PI * radioCirculo;
  const trazoAzul = (porcentajeIzq / 100) * circunferencia;

  const totalJuegosIzq = Math.max(1, Number(jugadorIzq.victorias || 0) + Number(jugadorIzq.derrotas || 0));
  const totalJuegosDer = Math.max(1, Number(jugadorDer.victorias || 0) + Number(jugadorDer.derrotas || 0));
  const efecIzq = Math.round((Number(jugadorIzq.victorias || 0) / totalJuegosIzq) * 100);
  const efecDer = Math.round((Number(jugadorDer.victorias || 0) / totalJuegosDer) * 100);

  const catIzq = obtenerCategoriaPorElo(jugadorIzq.elo);
  const catDer = obtenerCategoriaPorElo(jugadorDer.elo);

  const metricasComparativas = [
    {
      label: 'Puntos Oficiales ELO',
      izq: `${jugadorIzq.elo} Pts`,
      der: `${jugadorDer.elo} Pts`
    },
    {
      label: 'Categoría Actual',
      izq: catIzq.nombreCorto,
      der: catDer.nombreCorto
    },
    {
      label: 'Efectividad 2026',
      izq: `${efecIzq}% (${jugadorIzq.victorias}V-${jugadorIzq.derrotas}D)`,
      der: `${efecDer}% (${jugadorDer.victorias}V-${jugadorDer.derrotas}D)`
    },
    {
      label: 'Racha Activa',
      izq: Number(jugadorIzq.racha || 0) >= 2 ? `🔥 ${jugadorIzq.racha} seguidas` : 'Sin racha',
      der: Number(jugadorDer.racha || 0) >= 2 ? `🔥 ${jugadorDer.racha} seguidas` : 'Sin racha'
    },
    {
      label: 'Estilo de Juego',
      izq: `${jugadorIzq.manoHabil || 'Diestro'} · ${jugadorIzq.tipoReves || '2 Manos'}`,
      der: `${jugadorDer.manoHabil || 'Diestro'} · ${jugadorDer.tipoReves || '2 Manos'}`
    },
    {
      label: 'Perfil Físico',
      izq: `${jugadorIzq.estatura || '1.78 m'} · ${jugadorIzq.edad || 28} años`,
      der: `${jugadorDer.estatura || '1.76 m'} · ${jugadorDer.edad || 30} años`
    },
    {
      label: 'Sede Principal',
      izq: jugadorIzq.club || 'Independiente',
      der: jugadorDer.club || 'Independiente'
    }
  ];

  return (
    <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-[#071126] via-[#0B1528] to-[#0B0E14] text-white border border-[#00A3FF]/30 p-4 shadow-2xl">
      <div className="text-center pb-3 border-b border-white/10">
        <span className="inline-block px-3 py-0.5 rounded-full bg-white/10 text-[#D6FF00] font-display font-black text-[10px] tracking-[0.22em] uppercase">
          WILSON & GATORADE · ATP HEAD2HEAD
        </span>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 py-5">
        {/* Jugador Izquierdo (Azul Eléctrico #00A3FF) */}
        <div className="flex flex-col items-center text-center">
          <PlayerAvatarWithClub
            jugador={jugadorIzq}
            size={68}
            ringColor="border-[#00A3FF] ring-4 ring-[#00A3FF]/25"
          />
          <div className="mt-2.5 px-2.5 py-1 rounded-xl bg-[#00A3FF]/20 border border-[#00A3FF]/50 w-full">
            <p className="font-display font-black text-xs truncate text-white">
              {jugadorIzq.nombre}
            </p>
            <p className="text-[10px] text-[#38BDF8] font-bold truncate">
              {jugadorIzq.club || 'Independiente'}
            </p>
          </div>
        </div>

        {/* Arillo Radial Central Bicolor */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
              <circle
                cx="65"
                cy="65"
                r={radioCirculo}
                fill="none"
                stroke="#D6FF00"
                strokeWidth="9"
              />
              <circle
                cx="65"
                cy="65"
                r={radioCirculo}
                fill="none"
                stroke="#00A3FF"
                strokeWidth="9"
                strokeDasharray={`${trazoAzul} ${circunferencia}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="flex items-baseline gap-2">
                <span className="tabular-nums font-display font-black text-2xl text-[#00A3FF]">
                  {victoriasIzq}
                </span>
                <span className="font-display font-bold text-xs uppercase opacity-60">
                  VS
                </span>
                <span className="tabular-nums font-display font-black text-2xl text-[#D6FF00]">
                  {victoriasDer}
                </span>
              </div>
              <span className="font-display font-bold text-[9px] uppercase tracking-widest opacity-75 mt-0.5">
                VICTORIAS
              </span>
            </div>
          </div>
        </div>

        {/* Jugador Derecho (Amarillo Volt #D6FF00) */}
        <div className="flex flex-col items-center text-center">
          <PlayerAvatarWithClub
            jugador={jugadorDer}
            size={68}
            ringColor="border-[#D6FF00] ring-4 ring-[#D6FF00]/25"
          />
          <div className="mt-2.5 px-2.5 py-1 rounded-xl bg-[#D6FF00] text-[#0B0E14] w-full shadow-md">
            <p className="font-display font-black text-xs truncate">
              {jugadorDer.nombre}
            </p>
            <p className="text-[10px] font-extrabold truncate opacity-80">
              {jugadorDer.club || 'Independiente'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mt-1">
        {metricasComparativas.map((item, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between text-xs font-display font-extrabold">
              <span className="text-[#38BDF8] truncate max-w-[36%]">
                {item.izq}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                {item.label}
              </span>
              <span className="text-[#D6FF00] truncate max-w-[36%] text-right">
                {item.der}
              </span>
            </div>
            <div className="mt-1.5 flex h-1 rounded-full overflow-hidden bg-white/10">
              <div className="w-1/2 bg-[#00A3FF]" />
              <div className="w-1/2 bg-[#D6FF00]" />
            </div>
          </div>
        ))}
      </div>

      {jugadorIzq.id !== jugadorDer.id && onRetarDirecto && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onRetarDirecto(jugadorDer);
          }}
          className="mp-hero-btn mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-[#00A3FF] to-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
        >
          <Swords className="w-4 h-4" />
          <span>Desafiar a {jugadorDer.nombre.split(' ')[0]} por Puntos ELO</span>
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 11. FICHA HOMOGÉNEA COMPLETA DE JUGADOR + PESTAÑA SEGMENTADA H2H
// ----------------------------------------------------------------------------
export const PlayerProfileAndH2HModal = ({
  isOpen,
  onClose,
  jugadorSeleccionado,
  usuarioActivo,
  todosJugadores = [],
  partidos = [],
  isLightMode,
  onRetarJugador,
  onOpenVipCard,
  onCambiarClubUsuario
}) => {
  const [subTab, setSubTab] = useState('perfil');
  const [rivalCompararId, setRivalCompararId] = useState('');

  if (!isOpen || !jugadorSeleccionado) return null;

  const esMiPropioPerfil = usuarioActivo && jugadorSeleccionado.id === usuarioActivo.id;
  const catInfo = obtenerCategoriaPorElo(jugadorSeleccionado.elo);
  const totalPartidos = Number(jugadorSeleccionado.victorias || 0) + Number(jugadorSeleccionado.derrotas || 0);
  const enCalibracion = totalPartidos < ADMIN_CONFIG.PARTIDOS_CALIBRACION;

  let jugadorIzqH2H = usuarioActivo || todosJugadores[0];
  let jugadorDerH2H = jugadorSeleccionado;

  if (esMiPropioPerfil) {
    const otroPorDefecto =
      todosJugadores.find((j) => j.id === rivalCompararId) ||
      todosJugadores.find((j) => j.id !== jugadorSeleccionado.id) ||
      jugadorSeleccionado;
    jugadorIzqH2H = jugadorSeleccionado;
    jugadorDerH2H = otroPorDefecto;
  }

  const opcionesClubes = [
    'Country Club Los Huancas',
    'Club Tauro Tenis',
    'Academia Romina Cutipa',
    'Club Los Inkas Huancayo',
    'Independiente'
  ];

  const handleRetarDesdeH2H = (rival) => {
    onClose();
    if (onRetarJugador) {
      onRetarJugador(rival);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border p-4 sm:p-5 relative shadow-2xl ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0D121C] border-white/15 text-white'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabecera Estilo ATP Player Profile */}
        <div className="relative rounded-2xl p-4 bg-gradient-to-br from-[#071633] via-[#0C224A] to-[#0B0E14] text-white border border-[#00A3FF]/30 overflow-hidden mb-4">
          <div className="flex items-center gap-3.5">
            <PlayerAvatarWithClub
              jugador={jugadorSeleccionado}
              size={72}
              ringColor="border-[#D6FF00]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[10px] uppercase">
                  {catInfo.codigo}
                </span>
                {enCalibracion && (
                  <span className="px-2 py-0.5 rounded-md bg-[#00A3FF]/30 border border-[#00A3FF] text-white font-display font-bold text-[10px]">
                    Calibrando {totalPartidos}/5
                  </span>
                )}
              </div>
              <h2 className="font-display font-black text-xl tracking-tight truncate">
                {jugadorSeleccionado.nombre}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <ClubBadge
                  clubName={jugadorSeleccionado.club}
                  size={20}
                  showLabel={true}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
            <div>
              <span className="tabular-nums font-display font-black text-lg text-[#D6FF00] block">
                {jugadorSeleccionado.elo}
              </span>
              <span className="text-[9px] uppercase font-bold opacity-70">Puntos ELO</span>
            </div>
            <div>
              <span className="tabular-nums font-display font-black text-lg text-white block">
                {jugadorSeleccionado.victorias}-{jugadorSeleccionado.derrotas}
              </span>
              <span className="text-[9px] uppercase font-bold opacity-70">Récord W-L</span>
            </div>
            <div>
              <span className="tabular-nums font-display font-black text-lg text-[#00A3FF] block">
                #{jugadorSeleccionado.mejorRankingHistorico || 1}
              </span>
              <span className="text-[9px] uppercase font-bold opacity-70">Mejor Rank</span>
            </div>
            <div>
              <span className="tabular-nums font-display font-black text-lg text-amber-400 block">
                {jugadorSeleccionado.titulosTemporada || 0}
              </span>
              <span className="text-[9px] uppercase font-bold opacity-70">Títulos</span>
            </div>
          </div>
        </div>

        {/* Conmutador Prominente: [ Perfil & Bio ] vs [ Cara a Cara (H2H) ] */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-black/30 border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setSubTab('perfil'); }}
            className={`mp-tab-pill py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              subTab === 'perfil'
                ? 'bg-[#00A3FF] text-white shadow-md'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Perfil & Bio</span>
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setSubTab('h2h'); }}
            className={`mp-tab-pill py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              subTab === 'h2h'
                ? 'bg-[#D6FF00] text-[#0B0E14] shadow-md'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Cara a Cara (H2H)</span>
          </button>
        </div>

        {subTab === 'perfil' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#141A26] border-white/10'}`}>
                <span className="text-[10px] font-bold uppercase opacity-60 block">Mano / Golpe</span>
                <span className="font-display font-extrabold text-xs mt-0.5 block">
                  {jugadorSeleccionado.manoHabil || 'Diestro'} · {jugadorSeleccionado.tipoReves || 'Revés 2 manos'}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#141A26] border-white/10'}`}>
                <span className="text-[10px] font-bold uppercase opacity-60 block">Edad / Estatura</span>
                <span className="font-display font-extrabold text-xs mt-0.5 block">
                  {jugadorSeleccionado.edad || 28} años · {jugadorSeleccionado.estatura || '1.78 m'}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#141A26] border-white/10'}`}>
                <span className="text-[10px] font-bold uppercase opacity-60 block">Superficie Favorita</span>
                <span className="font-display font-extrabold text-xs mt-0.5 block">
                  {jugadorSeleccionado.superficieFavorita || 'Arcilla (Polvo de ladrillo)'}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#141A26] border-white/10'}`}>
                <span className="text-[10px] font-bold uppercase opacity-60 block">Entrenador / Academia</span>
                <span className="font-display font-extrabold text-xs mt-0.5 block">
                  {jugadorSeleccionado.entrenador || 'Independiente'}
                </span>
              </div>
            </div>

            {esMiPropioPerfil && onCambiarClubUsuario && (
              <div className={`p-3.5 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#141A26] border-white/10'}`}>
                <span className="font-display font-black text-xs uppercase tracking-wider block mb-2">
                  Selecciona tu Escudo de Club o Jugador Independiente
                </span>
                <div className="flex flex-wrap gap-2">
                  {opcionesClubes.map((nombreClub) => {
                    const activo = jugadorSeleccionado.club === nombreClub;
                    return (
                      <button
                        key={nombreClub}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          onCambiarClubUsuario(nombreClub);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-display font-bold flex items-center gap-1.5 transition-all ${
                          activo
                            ? 'bg-[#00A3FF]/20 border-[#00A3FF] text-[#00A3FF]'
                            : 'border-white/10 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <ClubBadge
                          clubName={nombreClub}
                          size={18}
                          showLabel={false}
                        />
                        <span>{nombreClub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-1">
              {esMiPropioPerfil && onOpenVipCard && (
                <button
                  type="button"
                  onClick={() => { triggerHaptic('medium'); onOpenVipCard(); }}
                  className="mp-hero-btn flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Abrir Carnet VIP 3D</span>
                </button>
              )}
              {!esMiPropioPerfil && onRetarJugador && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onClose();
                    onRetarJugador(jugadorSeleccionado);
                  }}
                  className="mp-hero-btn flex-1 py-3 rounded-2xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  <Swords className="w-4 h-4" />
                  <span>Retar a {jugadorSeleccionado.nombre.split(' ')[0]}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {esMiPropioPerfil && (
              <div>
                <label className="block text-[10px] font-display font-bold uppercase tracking-wider opacity-70 mb-1">
                  Elige rival del circuito para comparar tu H2H:
                </label>
                <select
                  value={jugadorDerH2H?.id || ''}
                  onChange={(e) => setRivalCompararId(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-display font-bold border ${
                    isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#141A26] border-white/15 text-white'
                  }`}
                >
                  {todosJugadores
                    .filter((j) => j.id !== jugadorSeleccionado.id)
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nombre} ({j.elo} Pts · {j.club})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <LexusAtpHead2HeadBoard
              jugadorIzq={jugadorIzqH2H}
              jugadorDer={jugadorDerH2H}
              partidos={partidos}
              isLightMode={isLightMode}
              onRetarDirecto={handleRetarDesdeH2H}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 12. CARNET DIGITAL VIP METÁLICO 3D (CON TILT PARALLAX Y MARCA DE AGUA)
// ----------------------------------------------------------------------------
export const VipDigitalCardModal = ({ isOpen, onClose, usuario, onSolicitarVip }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  if (!isOpen || !usuario) return null;

  const catInfo = obtenerCategoriaPorElo(usuario.elo);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: Math.round(yPct * -14), y: Math.round(xPct * 14) });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md text-white relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute -top-11 right-1 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 180ms ease-out'
          }}
          className="relative rounded-3xl p-6 bg-gradient-to-br from-[#161D2A] via-[#0B0E14] to-[#1E293B] border-2 border-[#D6FF00]/60 shadow-[0_20px_50px_rgba(0,163,255,0.3)] overflow-hidden select-none"
        >
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <MatchpointOfficialLogo
              size={190}
            />
          </div>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <MatchpointOfficialLogo
                size={36}
              />
              <div>
                <span className="font-display font-black text-sm tracking-wider block text-white">
                  MATCH<span className="text-[#D6FF00]">POINT</span> VIP PASS
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#00A3FF]">
                  CREDENCIAL OFICIAL DE SOCIO 2026
                </span>
              </div>
            </div>
            <CanvaIcon3D
              type="golden_ticket"
              size={38}
            />
          </div>

          <div className="flex items-center gap-4 my-4">
            <PlayerAvatarWithClub
              jugador={usuario}
              size={68}
              ringColor="border-[#D6FF00]"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-black text-xl tracking-tight truncate">
                {usuario.nombre}
              </h3>
              <p className="text-xs font-bold text-[#38BDF8] truncate">
                {usuario.club || 'Jugador Independiente'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[10px] uppercase">
                  {catInfo.codigo} · {usuario.elo} PTS
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-display font-bold text-[10px]">
                  {usuario.esVip ? 'ACTIVO ✓' : 'ESTÁNDAR'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">
                PUNTOS CLUB / PRO SHOP
              </span>
              <span className="tabular-nums font-display font-black text-sm text-[#D6FF00]">
                {usuario.puntosTienda || 80} PTS CANJEABLES
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">
                BENEFICIO EN SEDES ALIADAS
              </span>
              <span className="font-display font-extrabold text-xs text-white">
                15% Dcto Cancha & Encordado VIP
              </span>
            </div>
          </div>
        </div>

        {!usuario.esVip && onSolicitarVip && (
          <button
            type="button"
            onClick={() => { triggerHaptic('medium'); onSolicitarVip(); }}
            className="mp-hero-btn mt-4 w-full py-3.5 rounded-2xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-lg"
          >
            Activar Membresía Carnet VIP (S/ {ADMIN_CONFIG.PRECIO_CARNET_VIP}/mes)
          </button>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 13. MODAL DE TALLER DE ENCORDADO & PRO SHOP (CRISTAL AHUMADO Y TARIFA VIP)
// ----------------------------------------------------------------------------
export const ProShopModal = ({ isOpen, onClose, items = [], usuarioActivo, isLightMode }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl border p-5 relative shadow-2xl ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E131D] border-white/15 text-white'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center mb-2">
            <CanvaIcon3D
              type="pro_shop_rollo"
              size={56}
            />
          </div>
          <span className="block font-display font-black text-[10px] tracking-[0.22em] uppercase text-[#D6FF00]">
            SERVICIO TÉCNICO OFICIAL · HUANCAYO
          </span>
          <h2 className="font-display font-black text-xl sm:text-2xl tracking-tight">
            Taller de Encordado & Pro Shop
          </h2>
          <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Usa tus Puntos de Fidelidad (+10 pts por partido jugado) o tu Carnet VIP para acceder a tarifas de socio.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((prod) => {
            const mensajeWa = `Hola Pro Shop MATCHPOINT, soy ${
              usuarioActivo?.nombre || 'Socio del Circuito'
            } y deseo solicitar: ${prod.nombre} (Tarifa VIP S/ ${prod.precioVip}).`;
            return (
              <div
                key={prod.id}
                className={`p-4 rounded-2xl border mp-card-interactive ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#151C28] border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#00A3FF]/20 text-[#00A3FF] font-display font-black text-[9px] uppercase">
                    {prod.categoria}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    ● {prod.stockTexto}
                  </span>
                </div>

                <h3 className="font-display font-black text-sm leading-snug">
                  {prod.nombre}
                </h3>
                <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {prod.descripcion}
                </p>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] line-through opacity-50 mr-2">
                      Regular: S/ {prod.precioRegular}
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#D6FF00] text-[#0B0E14] font-display font-black text-sm">
                      VIP: S/ {prod.precioVip}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/${ADMIN_CONFIG.WHATSAPP_PROSHOP}?text=${encodeURIComponent(mensajeWa)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => triggerHaptic('medium')}
                    className="mp-hero-btn px-3.5 py-2 rounded-xl bg-[#00A3FF] text-white font-display font-black text-xs uppercase flex items-center gap-1.5 shadow-md"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Solicitar</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 3 DE 5 ===

// ============================================================================
// BLOQUE 4 DE 5: VISTAS PRINCIPALES DEL CIRCUITO (100% MULTILÍNEA LIMPIO)
//                14. RANKING OFICIAL + SALÓN DE LA FAMA CON LAURELES
//                15. CENTRAL DE DESAFÍOS + CARTELERA VS + MARCADOR EN VIVO
//                16. SEDES OFICIALES (GOLDEN TICKETS + CLIMA 3D) & COACH PRO
//                17. TORNEOS EN VIVO + RONDA CONSUELO + CONTROL ADMIN
// ============================================================================

// ----------------------------------------------------------------------------
// 14. VISTA DE RANKING OFICIAL + SALÓN DE LA FAMA (MURO DE CAMPEONES)
// ----------------------------------------------------------------------------
export const RankingAndHallOfFameView = ({
  jugadores = [],
  hallOfFame = [],
  noticias = [],
  isLightMode,
  onSelectJugador,
  onOpenLevelsModal,
  onNewsCta
}) => {
  const [vistaActiva, setVistaActiva] = useState('ranking');
  const [filtroDivision, setFiltroDivision] = useState('General');

  const divisiones = [
    'General',
    'Damas',
    '+40 Senior',
    'Cat. 3ª',
    'Cat. 4ª',
    'Cat. 5ª A',
    'Cat. 5ª B'
  ];

  const jugadoresFiltrados = useMemo(() => {
    const ordenados = [...jugadores].sort((a, b) => Number(b.elo) - Number(a.elo));
    if (filtroDivision === 'General') return ordenados;
    if (filtroDivision === 'Damas') {
      return ordenados.filter((j) => j.divisionEspecial === 'Damas');
    }
    if (filtroDivision === '+40 Senior') {
      return ordenados.filter((j) => j.divisionEspecial === '+40 Senior' || Number(j.edad) >= 40);
    }
    return ordenados.filter((j) => obtenerCategoriaPorElo(j.elo).nombreCorto === filtroDivision);
  }, [jugadores, filtroDivision]);

  return (
    <div className="mp-view-transition space-y-4">
      <NewsMagazineCarousel
        noticias={noticias}
        isLightMode={isLightMode}
        onSelectCta={onNewsCta}
      />

      <div
        className={`p-3 rounded-3xl border shadow-lg ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/10'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex-1 grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/25 border border-white/10">
            <button
              type="button"
              onClick={() => { triggerHaptic('selection'); setVistaActiva('ranking'); }}
              className={`mp-tab-pill py-2 px-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wide ${
                vistaActiva === 'ranking'
                  ? 'bg-[#D6FF00] text-[#0B0E14] shadow-md'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              Clasificación Actual
            </button>
            <button
              type="button"
              onClick={() => { triggerHaptic('selection'); setVistaActiva('hof'); }}
              className={`mp-tab-pill py-2 px-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1 ${
                vistaActiva === 'hof'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0B0E14] shadow-md'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Salón de la Fama</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => { triggerHaptic('light'); onOpenLevelsModal(); }}
            className="mp-hero-btn px-3.5 py-2.5 rounded-2xl bg-[#00A3FF]/20 border border-[#00A3FF]/50 text-[#00A3FF] font-display font-black text-xs uppercase tracking-wider shrink-0"
          >
            Niveles
          </button>
        </div>

        {vistaActiva === 'ranking' && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {divisiones.map((div) => {
              const activo = filtroDivision === div;
              return (
                <button
                  key={div}
                  type="button"
                  onClick={() => { triggerHaptic('selection'); setFiltroDivision(div); }}
                  className={`mp-tab-pill px-3.5 py-1.5 rounded-xl font-display font-extrabold text-xs whitespace-nowrap border ${
                    activo
                      ? 'bg-[#00A3FF] text-white border-[#00A3FF] shadow-sm'
                      : isLightMode
                      ? 'bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-[#171E2C] border-white/10 text-slate-300'
                  }`}
                >
                  {div}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {vistaActiva === 'ranking' ? (
        <div className="space-y-2.5">
          {jugadoresFiltrados.map((jug, idx) => {
            const puesto = idx + 1;
            const cat = obtenerCategoriaPorElo(jug.elo);
            const totalJuegos = Number(jug.victorias || 0) + Number(jug.derrotas || 0);
            const enCalibracion = totalJuegos < ADMIN_CONFIG.PARTIDOS_CALIBRACION;
            const rachaActiva = Number(jug.racha || 0) >= 2 && Number(jug.victorias || 0) > 0;
            const mov = Number(jug.tendenciaSemanal || 0);
            const tamanoAvatar = puesto === 1 ? 56 : 48;

            let estiloPodio = isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-[#121722] border-white/10';
            let ringAvatar = 'border-[#00A3FF]';

            if (puesto === 1) {
              estiloPodio = isLightMode
                ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/60 border-amber-400 shadow-md'
                : 'bg-gradient-to-r from-[#231C0C] via-[#151A24] to-[#1A2212] border-amber-400/70 shadow-[0_0_22px_rgba(245,158,11,0.2)]';
              ringAvatar = 'border-amber-400 ring-2 ring-amber-400/30';
            } else if (puesto === 2) {
              estiloPodio = isLightMode
                ? 'bg-slate-50 border-slate-300'
                : 'bg-gradient-to-r from-[#1E2430] to-[#121722] border-slate-400/50';
              ringAvatar = 'border-slate-300';
            } else if (puesto === 3) {
              estiloPodio = isLightMode
                ? 'bg-orange-50/40 border-orange-300'
                : 'bg-gradient-to-r from-[#241813] to-[#121722] border-orange-400/50';
              ringAvatar = 'border-orange-400';
            }

            return (
              <div
                key={jug.id}
                onClick={() => { triggerHaptic('light'); onSelectJugador(jug); }}
                className={`mp-card-interactive p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between gap-2.5 ${estiloPodio}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 text-center shrink-0">
                    {puesto === 1 ? (
                      <div className="flex flex-col items-center">
                        <CanvaIcon3D
                          type="trofeo_laurel"
                          size={30}
                        />
                        <span className="font-display font-black text-[10px] text-amber-400">
                          #1
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`tabular-nums font-display font-black text-base block ${
                          puesto === 2
                            ? 'text-slate-300'
                            : puesto === 3
                            ? 'text-orange-400'
                            : 'opacity-60'
                        }`}
                      >
                        #{puesto}
                      </span>
                    )}

                    <div className="mt-0.5 flex items-center justify-center text-[9px] font-display font-black">
                      {mov > 0 && <span className="text-emerald-400">▲+{mov}</span>}
                      {mov < 0 && <span className="text-rose-400">▼{mov}</span>}
                      {mov === 0 && <span className="opacity-40">—</span>}
                    </div>
                  </div>

                  <PlayerAvatarWithClub
                    jugador={jug}
                    size={tamanoAvatar}
                    ringColor={ringAvatar}
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-display font-black text-sm sm:text-base tracking-tight truncate">
                        {jug.nombre}
                      </h3>
                      {puesto === 1 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-[#0B0E14] font-display font-black text-[9px] uppercase">
                          LÍDER VIGENTE
                        </span>
                      )}
                      {enCalibracion && (
                        <span className="px-1.5 py-0.5 rounded bg-[#00A3FF]/20 text-[#00A3FF] font-display font-bold text-[9px]">
                          Calibrando {totalJuegos}/5
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold truncate ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        {jug.club || 'Independiente'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#00A3FF]/15 text-[#00A3FF] font-display font-black text-[10px]">
                        {cat.nombreCorto}
                      </span>
                    </div>

                    {rachaActiva && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0B0E14] border border-[#D6FF00]/50">
                        <CanvaIcon3D
                          type="fuego_racha"
                          size={16}
                        />
                        <span className="font-display font-black text-[9px] uppercase tracking-wider text-[#D6FF00]">
                          RACHA: {jug.racha} VICTORIAS SEGUIDAS
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-1">
                  <span
                    className={`tabular-nums font-display font-black text-xl sm:text-2xl leading-none block ${
                      isLightMode ? 'text-[#0052CC]' : 'text-[#D6FF00]'
                    }`}
                  >
                    {jug.elo}
                  </span>
                  <span className="font-display font-extrabold text-[9px] uppercase tracking-widest opacity-60 block mt-0.5">
                    PTS ELO
                  </span>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-display font-bold opacity-80">
                    {jug.victorias}V · {jug.derrotas}D
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/50">
            <div className="flex items-center gap-2.5 mb-1">
              <CanvaIcon3D
                type="trofeo_laurel"
                size={32}
              />
              <h3 className="font-display font-black text-xs sm:text-sm uppercase tracking-wider text-amber-400">
                REGLA OFICIAL DE CORONACIÓN Y PREMIOS FÍSICOS
              </h3>
            </div>
            <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
              Para proclamarse <strong>Campeón Vigente</strong> y adjudicarse el trofeo físico al cierre de temporada, el jugador debe liderar los puntos de su división habiendo disputado un <strong>mínimo reglamentario de 5 partidos oficiales</strong>.
            </p>
          </div>

          <div className="space-y-3">
            {hallOfFame.map((champ) => {
              const total = Math.max(1, Number(champ.victorias) + Number(champ.derrotas));
              const efectividad = ((Number(champ.victorias) / total) * 100).toFixed(1);
              const datosCampeon = {
                nombre: champ.nombre,
                foto_url: champ.foto_url,
                club: champ.club
              };

              return (
                <div
                  key={champ.id}
                  className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-[#241C08] via-[#131822] to-[#0B0E14] text-white border-2 border-amber-400/60 shadow-[0_10px_30px_rgba(245,158,11,0.18)]"
                >
                  <div className="absolute -right-4 -top-4 opacity-15 pointer-events-none">
                    <CanvaIcon3D
                      type="trofeo_laurel"
                      size={110}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-[#0B0E14] font-display font-black text-[10px] uppercase tracking-wider">
                      🏆 {champ.division}
                    </span>
                    <span className="font-display font-bold text-[10px] text-amber-300/90 uppercase">
                      {champ.temporada}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <PlayerAvatarWithClub
                        jugador={datosCampeon}
                        size={64}
                        ringColor="border-amber-400 ring-4 ring-amber-400/30"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-black text-lg tracking-tight truncate text-white">
                        {champ.nombre}
                      </h4>
                      <p className="text-xs font-bold text-amber-300 truncate">
                        {champ.club} · {champ.puntosCierre} PTS ELO
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[10px] uppercase">
                          {champ.victorias} VICTORIAS
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 font-display font-bold text-[10px] uppercase">
                          {champ.derrotas} {champ.derrotas === 1 ? 'DERROTA' : 'DERROTAS'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#00A3FF]/25 border border-[#00A3FF]/50 text-[#38BDF8] font-display font-black text-[10px] uppercase">
                          {efectividad}% EFECTIVIDAD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 15. CENTRAL DE DESAFÍOS, CARTELERA MATCH CENTER Y MARCADOR EN VIVO
// ----------------------------------------------------------------------------
export const ChallengesCenterView = ({
  jugadores = [],
  partidos = [],
  usuarioActivo,
  isLightMode,
  onOpenLaunchChallengeModal,
  onSelectJugador,
  onActualizarGameEnVivo,
  onConfirmarActaFinal
}) => {
  const [subTab, setSubTab] = useState('cartelera');

  const misRetos = useMemo(() => {
    if (!usuarioActivo) return [];
    return partidos.filter(
      (m) =>
        m.estado !== 'Finalizado' &&
        (m.jugadorAId === usuarioActivo.id || m.jugadorBId === usuarioActivo.id)
    );
  }, [partidos, usuarioActivo]);

  const rivalesHabilitados = useMemo(() => {
    const miElo = Number(usuarioActivo?.elo || 2200);
    return jugadores.filter((j) => {
      if (usuarioActivo && j.id === usuarioActivo.id) return false;
      return Math.abs(Number(j.elo) - miElo) <= ADMIN_CONFIG.VENTANA_RETO_ELO;
    });
  }, [jugadores, usuarioActivo]);

  return (
    <div className="mp-view-transition space-y-4">
      <div
        className={`p-4 rounded-3xl border text-center shadow-lg ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/10'
        }`}
      >
        <span className="font-display font-black text-[10px] tracking-[0.22em] uppercase text-[#00A3FF] block">
          COMPETICIÓN OFICIAL · MATCH CENTER
        </span>
        <h2 className="font-display font-black text-2xl tracking-tight mt-0.5">
          Central de Desafíos
        </h2>

        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-black/25 border border-white/10 mt-3">
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setSubTab('mis-retos'); }}
            className={`mp-tab-pill py-2 rounded-xl font-display font-black text-xs uppercase ${
              subTab === 'mis-retos'
                ? 'bg-[#00A3FF] text-white shadow-md'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            Tus Retos ({misRetos.length})
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setSubTab('cartelera'); }}
            className={`mp-tab-pill py-2 rounded-xl font-display font-black text-xs uppercase ${
              subTab === 'cartelera'
                ? 'bg-[#D6FF00] text-[#0B0E14] shadow-md'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            Cartelera ({partidos.length})
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setSubTab('lanzar'); }}
            className={`mp-tab-pill py-2 rounded-xl font-display font-black text-xs uppercase ${
              subTab === 'lanzar'
                ? 'bg-[#00A3FF] text-white shadow-md'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            + Lanzar Reto
          </button>
        </div>
      </div>

      {subTab === 'mis-retos' && (
        <div>
          {misRetos.length === 0 ? (
            <div
              className={`p-7 rounded-3xl border text-center ${
                isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/10'
              }`}
            >
              <div className="inline-flex items-center justify-center mb-3">
                <CanvaIcon3D
                  type="raquetas_duelo"
                  size={86}
                />
              </div>
              <h3 className="font-display font-black text-xl uppercase tracking-tight">
                LA CANCHA ESTÁ ESPERANDO
              </h3>
              <p className={`text-xs mt-1 max-w-xs mx-auto ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Desafía a un oponente directo y pon en juego los puntos oficiales de la temporada.
              </p>
              <button
                type="button"
                onClick={() => { triggerHaptic('medium'); setSubTab('lanzar'); }}
                className="mp-hero-btn mt-5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D6FF00] to-[#00A3FF] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-lg"
              >
                BUSCAR OPONENTE EN VIVO ⚡
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {misRetos.map((match) => {
                const objJugA = {
                  nombre: match.jugadorANombre,
                  foto_url: match.jugadorAFoto,
                  club: match.jugadorAClub
                };
                const objJugB = {
                  nombre: match.jugadorBNombre,
                  foto_url: match.jugadorBFoto,
                  club: match.jugadorBClub
                };

                return (
                  <div
                    key={match.id}
                    className="p-4 rounded-3xl bg-[#121722] text-white border border-[#D6FF00]/50 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[10px] uppercase">
                        TU DUELO ACTIVO · EN JUEGO ~{match.eloEnJuego || 35} PTS
                      </span>
                      <span className="text-xs font-bold text-[#38BDF8]">
                        {match.fechaHora}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatarWithClub
                          jugador={objJugA}
                          size={46}
                        />
                        <div>
                          <p className="font-display font-black text-sm">{match.jugadorANombre}</p>
                          <p className="text-[11px] text-[#D6FF00] font-bold">{match.jugadorAElo} Pts</p>
                        </div>
                      </div>
                      <span className="font-display font-black text-xs px-2 py-1 rounded-lg bg-white/10">
                        VS
                      </span>
                      <div className="flex items-center gap-2.5 text-right">
                        <div>
                          <p className="font-display font-black text-sm">{match.jugadorBNombre}</p>
                          <p className="text-[11px] text-[#00A3FF] font-bold">{match.jugadorBElo} Pts</p>
                        </div>
                        <PlayerAvatarWithClub
                          jugador={objJugB}
                          size={46}
                        />
                      </div>
                    </div>
                    {onConfirmarActaFinal && (
                      <button
                        type="button"
                        onClick={() => { triggerHaptic('medium'); onConfirmarActaFinal(match); }}
                        className="mp-hero-btn mt-3.5 w-full py-2.5 rounded-xl bg-[#00A3FF] text-white font-display font-black text-xs uppercase"
                      >
                        Registrar / Confirmar Marcador Oficial
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'cartelera' && (
        <div className="space-y-3.5">
          {partidos.map((match) => {
            const estaEnVivo = match.estado === 'En Cancha' || match.enVivo;
            const finalizado = match.estado === 'Finalizado';
            const objJugA = {
              nombre: match.jugadorANombre,
              foto_url: match.jugadorAFoto,
              club: match.jugadorAClub
            };
            const objJugB = {
              nombre: match.jugadorBNombre,
              foto_url: match.jugadorBFoto,
              club: match.jugadorBClub
            };

            return (
              <div
                key={match.id}
                className={`rounded-3xl border overflow-hidden shadow-xl ${
                  isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/15'
                }`}
              >
                <div className="px-4 py-2.5 bg-gradient-to-r from-[#0B0E14] via-[#141C2B] to-[#0B0E14] text-white flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-display font-black text-[10px] uppercase tracking-wider ${
                        estaEnVivo
                          ? 'bg-[#D6FF00] text-[#0B0E14]'
                          : finalizado
                          ? 'bg-emerald-400 text-[#0B0E14]'
                          : 'bg-[#00A3FF] text-white'
                      }`}
                    >
                      {estaEnVivo ? '● EN CANCHA AHORA' : finalizado ? 'FINALIZADO OFICIAL' : 'DUELO CONFIRMADO'}
                    </span>
                    <span className="font-display font-bold text-[11px] text-amber-300">
                      ⚡ ~{match.eloEnJuego || 36} Pts ELO
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300">
                    {match.fechaHora}
                  </span>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-7 items-center gap-2">
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                      <PlayerAvatarWithClub
                        jugador={objJugA}
                        size={52}
                        ringColor="border-[#00A3FF]"
                      />
                      <div className="min-w-0">
                        <p className="font-display font-black text-xs sm:text-sm truncate">
                          {match.jugadorANombre}
                        </p>
                        <p className="tabular-nums font-display font-black text-xs text-[#00A3FF]">
                          {match.jugadorAElo} PTS
                        </p>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A3FF] to-[#D6FF00] text-[#0B0E14] font-display font-black text-[11px] flex items-center justify-center shadow">
                        VS
                      </span>
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-2.5 min-w-0 text-right">
                      <div className="min-w-0">
                        <p className="font-display font-black text-xs sm:text-sm truncate">
                          {match.jugadorBNombre}
                        </p>
                        <p
                          className={`tabular-nums font-display font-black text-xs ${
                            isLightMode ? 'text-[#0052CC]' : 'text-[#D6FF00]'
                          }`}
                        >
                          {match.jugadorBElo} PTS
                        </p>
                      </div>
                      <PlayerAvatarWithClub
                        jugador={objJugB}
                        size={52}
                        ringColor="border-[#D6FF00]"
                      />
                    </div>
                  </div>

                  {(estaEnVivo || finalizado) && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-[#0B0E14] text-white border border-white/10">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-display font-bold uppercase mb-2">
                        <span>{match.sede}</span>
                        <span className="text-emerald-400">
                          {estaEnVivo
                            ? `● En juego · Actualizado hace ${match.ultimaActualizacionMin || 2} min`
                            : 'Acta Oficial Cerrada'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between py-1 border-b border-white/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <ClubBadge
                              clubName={match.jugadorAClub}
                              size={18}
                            />
                            <span className="font-display font-bold text-xs truncate">
                              {match.jugadorANombre}
                            </span>
                            {estaEnVivo && match.sacadorActual === 'A' && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF00] inline-block" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 tabular-nums font-display font-black text-sm">
                            {(match.sets || []).map((s, i) => (
                              <span key={i} className="w-6 text-center text-slate-200">
                                {s.a}
                              </span>
                            ))}
                            {estaEnVivo && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs">
                                {match.puntosGameActual?.a || '0'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <ClubBadge
                              clubName={match.jugadorBClub}
                              size={18}
                            />
                            <span className="font-display font-bold text-xs truncate">
                              {match.jugadorBNombre}
                            </span>
                            {estaEnVivo && match.sacadorActual === 'B' && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF00] inline-block" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 tabular-nums font-display font-black text-sm">
                            {(match.sets || []).map((s, i) => (
                              <span key={i} className="w-6 text-center text-slate-200">
                                {s.b}
                              </span>
                            ))}
                            {estaEnVivo && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs">
                                {match.puntosGameActual?.b || '0'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {estaEnVivo && onActualizarGameEnVivo && (
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            ¿En cancha ahora?
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => { triggerHaptic('light'); onActualizarGameEnVivo(match.id, 'A'); }}
                              className="px-2 py-1 rounded-lg bg-[#00A3FF]/25 text-[#38BDF8] font-display font-bold text-[10px]"
                            >
                              +1 Game {match.jugadorANombre.split(' ')[0]}
                            </button>
                            <button
                              type="button"
                              onClick={() => { triggerHaptic('light'); onActualizarGameEnVivo(match.id, 'B'); }}
                              className="px-2 py-1 rounded-lg bg-[#D6FF00]/20 text-[#D6FF00] font-display font-bold text-[10px]"
                            >
                              +1 Game {match.jugadorBNombre.split(' ')[0]}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!estaEnVivo && !finalizado && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs opacity-80">
                      <span>📍 {match.sede}</span>
                      {onConfirmarActaFinal && (
                        <button
                          type="button"
                          onClick={() => onConfirmarActaFinal(match)}
                          className="font-display font-black text-[#00A3FF] underline"
                        >
                          Subir Resultado
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'lanzar' && (
        <div className="space-y-2.5">
          {rivalesHabilitados.map((rival) => {
            const cat = obtenerCategoriaPorElo(rival.elo);
            const riesgo = previsualizarRiesgoReto(usuarioActivo || jugadores[0], rival);

            return (
              <div
                key={rival.id}
                className={`mp-card-interactive p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/10'
                }`}
              >
                <div
                  onClick={() => onSelectJugador(rival)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                >
                  <PlayerAvatarWithClub
                    jugador={rival}
                    size={50}
                    ringColor="border-[#00A3FF]"
                  />
                  <div className="min-w-0">
                    <h4 className="font-display font-black text-sm sm:text-base truncate">
                      {rival.nombre}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-[#00A3FF]/15 text-[#00A3FF] font-display font-black text-[10px]">
                        {cat.nombreCorto}
                      </span>
                      <span className="tabular-nums font-display font-black text-xs text-amber-400">
                        {rival.elo} PTS
                      </span>
                    </div>
                    <p className="text-[10px] font-display font-bold mt-1 text-emerald-400">
                      Si ganas: +{riesgo.siGanas} Pts · Si pierdes: {riesgo.siPierdes} Pts
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { triggerHaptic('medium'); onOpenLaunchChallengeModal(rival); }}
                  className="mp-hero-btn px-4 py-2.5 rounded-xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-md"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Desafiar</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 16. VISTA DE SEDES OFICIALES (GOLDEN TICKETS + CLIMA 3D) Y COACH PRO
// ----------------------------------------------------------------------------
export const VenuesAndCoachesView = ({
  clubes = [],
  coaches = [],
  isLightMode,
  onOpenReportWeatherModal,
  onSelectCoach
}) => {
  const [subTab, setSubTab] = useState('clubes');
  const [badgeBrilloId, setBadgeBrilloId] = useState(null);

  const obtenerIconoClima3D = (estadoClima) => {
    if (estadoClima === 'humedad') return 'clima_humedad';
    if (estadoClima === 'llovizna') return 'clima_llovizna';
    if (estadoClima === 'tormenta') return 'clima_tormenta';
    return 'clima_seco';
  };

  return (
    <div className="mp-view-transition space-y-4">
      <div
        className={`p-4 rounded-3xl border text-center shadow-lg ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/10'
        }`}
      >
        <span className="font-display font-black text-[10px] tracking-[0.22em] uppercase text-[#D6FF00] block">
          INFRAESTRUCTURA & ACADEMIAS OFICIALES
        </span>
        <h2 className="font-display font-black text-2xl tracking-tight mt-0.5">
          Sedes & Entrenadores
        </h2>

        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-black/25 border border-white/10 mt-3">
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setSubTab('clubes'); }}
            className={`mp-tab-pill py-2.5 rounded-xl font-display font-black text-xs uppercase ${
              subTab === 'clubes'
                ? 'bg-[#D6FF00] text-[#0B0E14] shadow-md'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            Canchas & Clubes ({clubes.length})
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setSubTab('coaches'); }}
            className={`mp-tab-pill py-2.5 rounded-xl font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 ${
              subTab === 'coaches'
                ? 'bg-[#00A3FF] text-white shadow-md'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <CanvaIcon3D
              type="escudo_coach"
              size={18}
            />
            <span>Coach Pro ({coaches.length})</span>
          </button>
        </div>
      </div>

      {subTab === 'clubes' ? (
        <div className="space-y-4">
          {clubes.map((club) => {
            const msgReserva = `Hola ${club.nombre}, vengo de la App Oficial MATCHPOINT y deseo consultar disponibilidad de cancha.`;
            const iconoClima = obtenerIconoClima3D(club.estadoClima);

            return (
              <div
                key={club.id}
                className={`rounded-3xl border overflow-hidden shadow-xl ${
                  isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/10'
                }`}
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={club.imagenUrl}
                    alt={club.nombre}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/55 to-transparent" />

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setBadgeBrilloId(club.id);
                      setTimeout(() => setBadgeBrilloId(null), 900);
                    }}
                    className={`mp-hero-btn absolute top-3 left-3 px-3 py-1 rounded-xl font-display font-black text-[10px] uppercase tracking-wider border transition-transform ${
                      badgeBrilloId === club.id
                        ? 'scale-110 bg-[#D6FF00] text-[#0B0E14] border-white shadow-[0_0_25px_#D6FF00]'
                        : 'bg-[#0B0E14]/90 text-[#D6FF00] border-[#D6FF00]/60 shadow-lg'
                    }`}
                  >
                    ★ {club.badgeTipo}
                  </button>

                  <div className="absolute top-3 right-3">
                    <ClubBadge
                      clubName={club.nombre}
                      size={46}
                    />
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-display font-black text-xl tracking-tight">
                      {club.nombre}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {club.zona}
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(club.serviciosReales || []).map((serv, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#171E2C] border-white/5'
                        }`}
                      >
                        {serv}
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-[#00A3FF]/10 border-2 border-dashed border-amber-400/70 flex items-center gap-3">
                    <CanvaIcon3D
                      type="golden_ticket"
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-display font-black text-[10px] uppercase tracking-wider text-amber-400 block">
                        TICKET SOCIO CARNET VIP
                      </span>
                      <h4 className="font-display font-black text-sm uppercase tracking-tight">
                        {club.ticketVipTitulo}
                      </h4>
                      <p className="text-[11px] opacity-80">
                        {club.ticketVipDetalle}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0E131D] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CanvaIcon3D
                        type={iconoClima}
                        size={46}
                      />
                      <div className="min-w-0">
                        <span className="font-display font-bold text-[10px] uppercase tracking-wider text-[#00A3FF] block">
                          ESTADO DE CANCHA · {club.horaReporte}
                        </span>
                        <h5 className="font-display font-black text-sm truncate">
                          {club.estadoTexto}
                        </h5>
                        <p className="text-[11px] opacity-70 truncate">
                          {club.temperatura} · Por {club.ultimoReportePor}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { triggerHaptic('light'); onOpenReportWeatherModal(club); }}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-display font-extrabold text-xs shrink-0"
                    >
                      Reportar
                    </button>
                  </div>

                  <a
                    href={`https://wa.me/${club.whatsapp}?text=${encodeURIComponent(msgReserva)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => triggerHaptic('medium')}
                    className="mp-hero-btn w-full py-3.5 rounded-2xl bg-[#00A3FF] text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Reservar Cancha por WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {coaches.map((coach) => {
            const totalResenas = (coach.resenas || []).length;
            const promedio =
              totalResenas > 0
                ? (
                    coach.resenas.reduce((acc, r) => acc + Number(r.rating || 5), 0) /
                    totalResenas
                  ).toFixed(1)
                : '5.0';
            const objAvatarCoach = {
              nombre: coach.nombre,
              foto_url: coach.foto_url,
              club: coach.clubPrincipal
            };

            return (
              <div
                key={coach.id}
                onClick={() => { triggerHaptic('light'); onSelectCoach(coach); }}
                className={`mp-card-interactive rounded-3xl border overflow-hidden cursor-pointer shadow-xl ${
                  isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/15'
                }`}
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={coach.banner_url}
                    alt={coach.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <CanvaIcon3D
                      type="escudo_coach"
                      size={40}
                    />
                  </div>
                </div>

                <div className="px-4 pb-4 -mt-10 relative">
                  <div className="flex items-end gap-3.5">
                    <PlayerAvatarWithClub
                      jugador={objAvatarCoach}
                      size={74}
                      ringColor="border-[#D6FF00] ring-4 ring-[#0B0E14]"
                    />
                    <div className="pb-1 min-w-0 flex-1">
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 font-display font-black text-[9px] uppercase">
                        {coach.credencial}
                      </span>
                      <h3 className="font-display font-black text-xl tracking-tight truncate mt-0.5">
                        {coach.nombre}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-3.5 p-3 rounded-2xl bg-[#0B0E14] text-white border border-white/10 text-center">
                    <div>
                      <span className="font-display font-black text-sm text-amber-400 block">
                        ★ {promedio} ({totalResenas})
                      </span>
                      <span className="text-[9px] uppercase opacity-70">Reseñas Reales</span>
                    </div>
                    <div>
                      <span className="font-display font-black text-sm text-[#00A3FF] block">
                        +{coach.alumnosAscendidos} Alumnos
                      </span>
                      <span className="text-[9px] uppercase opacity-70">Subieron Nivel</span>
                    </div>
                    <div>
                      <span className="font-display font-black text-sm text-[#D6FF00] block">
                        S/ {coach.precioBase}
                      </span>
                      <span className="text-[9px] uppercase opacity-70">Turno Base</span>
                    </div>
                  </div>

                  <p className={`text-xs line-clamp-2 mb-3 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                    {coach.bio}
                  </p>

                  <button
                    type="button"
                    className="mp-hero-btn w-full py-3 rounded-2xl bg-gradient-to-r from-[#00A3FF] to-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-md"
                  >
                    Ver Paquetes, Horarios y Reseñas Verificadas ⚡
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 17. VISTA DE TORNEOS OFICIALES, CUADROS EN VIVO Y RONDA CONSUELO
// ----------------------------------------------------------------------------
export const TournamentsAndBracketsView = ({
  torneos = [],
  isLightMode,
  onOpenTournamentModal,
  onInscribirTorneo
}) => {
  return (
    <div className="mp-view-transition space-y-4">
      <div
        className={`p-4 rounded-3xl border text-center shadow-lg ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/10'
        }`}
      >
        <span className="font-display font-black text-[10px] tracking-[0.22em] uppercase text-[#D6FF00] block">
          PRESENTADO POR WILSON & GATORADE HUANCAYO
        </span>
        <h2 className="font-display font-black text-2xl tracking-tight mt-0.5">
          Torneos & Cuadros en Vivo
        </h2>
        <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Eliminación directa, Ronda Consuelo garantizada y sorteo transparente sin favoritismos.
        </p>
      </div>

      <div className="space-y-4">
        {torneos.map((tor) => {
          const porcentajeCupos = Math.min(
            100,
            Math.round((Number(tor.inscritosActuales) / Math.max(1, Number(tor.cuposTotales))) * 100)
          );

          return (
            <div
              key={tor.id}
              className={`rounded-3xl border overflow-hidden shadow-xl ${
                isLightMode ? 'bg-white border-slate-200' : 'bg-[#121722] border-white/15'
              }`}
            >
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={tor.imagenUrl}
                  alt={tor.titulo}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/45 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[10px] uppercase tracking-wider shadow-md">
                    ● {tor.estado}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-[#0B0E14]/85 text-white border border-white/20 font-display font-black text-xs">
                    {tor.categoria}
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-0.5">
                    <ClubBadge
                      clubName={tor.sede}
                      size={22}
                    />
                    <span className="text-[11px] font-bold text-[#38BDF8] uppercase">
                      {tor.sede} · {tor.fechas}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-xl tracking-tight leading-tight">
                    {tor.titulo}
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div
                  className={`p-3 rounded-2xl border ${
                    isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#161D2A] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-display font-bold mb-1.5">
                    <span>
                      👥 {tor.inscritosActuales} de {tor.cuposTotales} Tenistas Inscritos
                    </span>
                    <span className="text-[#D6FF00] bg-[#0B0E14] px-2 py-0.5 rounded">
                      Inscripción: S/ {tor.precioInscripcion}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
                    <div
                      style={{ width: `${porcentajeCupos}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#00A3FF] to-[#D6FF00]"
                    />
                  </div>
                  <p className="text-[11px] font-semibold mt-2 opacity-85">
                    🏆 Premio Oficial: {tor.premioCampeon}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('medium'); onOpenTournamentModal(tor); }}
                    className="mp-hero-btn py-3 px-3 rounded-2xl bg-[#00A3FF] text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Ver Cuadro en Vivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('medium'); onInscribirTorneo(tor); }}
                    className="mp-hero-btn py-3 px-3 rounded-2xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Inscribirme</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 4 DE 5 ===

// ============================================================================
// BLOQUE 5 DE 5 (FINAL CORREGIDO): MODALES INTERACTIVOS Y COMPONENTE APP
//                                  100% LIBRE DE FLECHAS EN PROPS DE ETIQUETAS
// ============================================================================

// ----------------------------------------------------------------------------
// 18. MODAL CENTRADO DE DESAFÍO OFICIAL Y CONFIRMACIÓN DE ACTA DE PARTIDO
// ----------------------------------------------------------------------------
export const LaunchChallengeAndScoreModal = ({
  isOpen,
  onClose,
  modo = 'retar',
  miJugador,
  rivalJugador,
  partidoActivo,
  clubes = [],
  isLightMode,
  onConfirmarNuevoReto,
  onConfirmarResultadoPartido
}) => {
  const [sedeElegida, setSedeElegida] = useState('Country Club Los Huancas');
  const [sedePersonalizada, setSedePersonalizada] = useState('');
  const [diaHora, setDiaHora] = useState('Sábado · 16:00 hrs');
  const [ganadorId, setGanadorId] = useState('');
  const [marcadorInput, setMarcadorInput] = useState('6-4, 6-3');

  useEffect(() => {
    if (partidoActivo) {
      setGanadorId(partidoActivo.jugadorAId);
    }
  }, [partidoActivo]);

  if (!isOpen) return null;

  const esModoScore = modo === 'score' && partidoActivo;
  const jugIzq = esModoScore
    ? {
        id: partidoActivo.jugadorAId,
        nombre: partidoActivo.jugadorANombre,
        elo: partidoActivo.jugadorAElo,
        club: partidoActivo.jugadorAClub,
        foto_url: partidoActivo.jugadorAFoto
      }
    : miJugador;

  const jugDer = esModoScore
    ? {
        id: partidoActivo.jugadorBId,
        nombre: partidoActivo.jugadorBNombre,
        elo: partidoActivo.jugadorBElo,
        club: partidoActivo.jugadorBClub,
        foto_url: partidoActivo.jugadorBFoto
      }
    : rivalJugador;

  const riesgo = previsualizarRiesgoReto(jugIzq, jugDer);

  const handleSubmit = (e) => {
    e.preventDefault();
    triggerHaptic('success');
    if (esModoScore) {
      if (onConfirmarResultadoPartido) {
        onConfirmarResultadoPartido(partidoActivo, ganadorId, marcadorInput);
      }
    } else {
      const sedeFinal =
        sedeElegida === 'personalizada'
          ? sedePersonalizada.trim() || 'Cancha Acordada por Jugadores'
          : sedeElegida;
      if (onConfirmarNuevoReto) {
        onConfirmarNuevoReto(rivalJugador, sedeFinal, diaHora);
      }
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl border p-5 relative shadow-2xl ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E131D] border-white/15 text-white'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X
            className="w-4 h-4"
          />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center mb-1.5">
            <CanvaIcon3D
              type="raquetas_duelo"
              size={52}
            />
          </div>
          <span className="block font-display font-black text-[10px] tracking-[0.22em] uppercase text-[#D6FF00]">
            {esModoScore ? 'VALIDACIÓN OFICIAL DE PUNTOS ELO' : 'CONTRATO DEPORTIVO · MATCH CENTER'}
          </span>
          <h2 className="font-display font-black text-xl tracking-tight">
            {esModoScore ? 'Confirmar Marcador Oficial' : 'Lanzar Desafío Oficial'}
          </h2>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#00A3FF]/15 via-black/40 to-[#D6FF00]/15 border border-white/10 grid grid-cols-7 items-center gap-2 mb-4">
          <div className="col-span-3 flex flex-col items-center text-center">
            <PlayerAvatarWithClub
              jugador={jugIzq}
              size={56}
              ringColor="border-[#00A3FF]"
            />
            <span className="font-display font-black text-xs mt-1.5 truncate w-full">
              {jugIzq?.nombre}
            </span>
            <span className="tabular-nums font-display font-bold text-[11px] text-[#00A3FF]">
              {jugIzq?.elo} PTS
            </span>
          </div>

          <div className="col-span-1 flex justify-center">
            <span className="px-2 py-1 rounded-lg bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs">
              VS
            </span>
          </div>

          <div className="col-span-3 flex flex-col items-center text-center">
            <PlayerAvatarWithClub
              jugador={jugDer}
              size={56}
              ringColor="border-[#D6FF00]"
            />
            <span className="font-display font-black text-xs mt-1.5 truncate w-full">
              {jugDer?.nombre}
            </span>
            <span className="tabular-nums font-display font-bold text-[11px] text-[#D6FF00]">
              {jugDer?.elo} PTS
            </span>
          </div>
        </div>

        {!esModoScore ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-3.5"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-xs font-display font-bold text-emerald-300">
              Proyección ELO: Si ganas +{riesgo.siGanas} Pts · Si pierdes {riesgo.siPierdes} Pts (+10 Pts Tienda a ambos)
            </div>

            <div>
              <label className="block font-display font-bold text-xs uppercase tracking-wider mb-1.5 opacity-80">
                Sede del Encuentro (Clubes Oficiales o Libre)
              </label>
              <select
                value={sedeElegida}
                onChange={(e) => setSedeElegida(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-display font-bold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              >
                {clubes.map((c) => (
                  <option
                    key={c.id}
                    value={c.nombre}
                  >
                    {c.nombre} ({c.estadoTexto})
                  </option>
                ))}
                <option value="personalizada">
                  ✍️ Otra Cancha / Sede Personalizada...
                </option>
              </select>
            </div>

            {sedeElegida === 'personalizada' && (
              <div>
                <label className="block font-display font-bold text-xs uppercase tracking-wider mb-1 opacity-80">
                  Escribe el nombre de la cancha o ubicación
                </label>
                <input
                  type="text"
                  required
                  value={sedePersonalizada}
                  onChange={(e) => setSedePersonalizada(e.target.value)}
                  placeholder="Ej. Cancha Privada San Carlos / El Tambo"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                    isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                  }`}
                />
              </div>
            )}

            <div>
              <label className="block font-display font-bold text-xs uppercase tracking-wider mb-1.5 opacity-80">
                Día y Turno Propuesto
              </label>
              <input
                type="text"
                required
                value={diaHora}
                onChange={(e) => setDiaHora(e.target.value)}
                placeholder="Ej. Sábado 16:00 hrs"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              />
            </div>

            <button
              type="submit"
              className="mp-hero-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D6FF00] to-[#00A3FF] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-lg"
            >
              Lanzar Desafío y Notificar Rival ⚔️
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-3.5"
          >
            <div>
              <label className="block font-display font-bold text-xs uppercase tracking-wider mb-1.5 opacity-80">
                1. Selecciona al Ganador del Encuentro
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGanadorId(partidoActivo.jugadorAId)}
                  className={`py-2.5 px-3 rounded-xl font-display font-black text-xs border ${
                    ganadorId === partidoActivo.jugadorAId
                      ? 'bg-[#D6FF00] text-[#0B0E14] border-[#D6FF00]'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  🏆 {partidoActivo.jugadorANombre}
                </button>
                <button
                  type="button"
                  onClick={() => setGanadorId(partidoActivo.jugadorBId)}
                  className={`py-2.5 px-3 rounded-xl font-display font-black text-xs border ${
                    ganadorId === partidoActivo.jugadorBId
                      ? 'bg-[#D6FF00] text-[#0B0E14] border-[#D6FF00]'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  🏆 {partidoActivo.jugadorBNombre}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-display font-bold text-xs uppercase tracking-wider mb-1.5 opacity-80">
                2. Marcador Oficial por Sets (Activa Factor de Dominio)
              </label>
              <input
                type="text"
                required
                value={marcadorInput}
                onChange={(e) => setMarcadorInput(e.target.value)}
                placeholder="Ej. 6-4, 6-3 o 7-6, 6-7, 10-8"
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-display font-black border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              />
            </div>

            <button
              type="submit"
              className="mp-hero-btn w-full py-3.5 rounded-2xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-lg"
            >
              Confirmar Marcador Oficial y Actualizar Ranking ⚡
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 19. MODAL DE REPORTE CLIMÁTICO DE CANCHA (CON LOS 4 ICONOS 3D DE CANVA)
// ----------------------------------------------------------------------------
export const WeatherReportModal = ({
  isOpen,
  onClose,
  club,
  isLightMode,
  onGuardarClima
}) => {
  const [estadoSel, setEstadoSel] = useState('seco');
  const [tempInput, setTempInput] = useState('20°C · Soleado');

  if (!isOpen || !club) return null;

  const opcionesClima = [
    {
      id: 'seco',
      texto: 'Cancha Seca · Óptima',
      sub: 'Pique rápido y tracción total',
      icono: 'clima_seco',
      borde: 'border-[#D6FF00]'
    },
    {
      id: 'humedad',
      texto: 'Humedad Leve · Jugable',
      sub: 'Arcilla asentada ideal para topspin',
      icono: 'clima_humedad',
      borde: 'border-[#00A3FF]'
    },
    {
      id: 'llovizna',
      texto: 'Llovizna · Precaución',
      sub: 'Líneas húmedas, jugar con calzado de arcilla',
      icono: 'clima_llovizna',
      borde: 'border-amber-400'
    },
    {
      id: 'tormenta',
      texto: 'Lluvia · Cancha Pesada (No Jugable)',
      sub: 'Partidos en cancha abierta suspendidos',
      icono: 'clima_tormenta',
      borde: 'border-rose-500'
    }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl border p-5 relative shadow-2xl ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E131D] border-white/15 text-white'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X
            className="w-4 h-4"
          />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center mb-1">
            <ClubBadge
              clubName={club.nombre}
              size={44}
            />
          </div>
          <span className="block font-display font-black text-[10px] tracking-[0.22em] uppercase text-[#00A3FF]">
            REPORTE EN TIEMPO REAL DE SUPERFICIE
          </span>
          <h2 className="font-display font-black text-xl tracking-tight">
            {club.nombre}
          </h2>
        </div>

        <div className="space-y-2.5 mb-4">
          {opcionesClima.map((op) => {
            const activo = estadoSel === op.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => { triggerHaptic('selection'); setEstadoSel(op.id); }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all ${
                  activo
                    ? `bg-white/10 ${op.borde} shadow-md`
                    : 'bg-white/5 border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CanvaIcon3D
                    type={op.icono}
                    size={42}
                  />
                  <div>
                    <h4 className="font-display font-black text-sm">{op.texto}</h4>
                    <p className="text-[11px] opacity-70">{op.sub}</p>
                  </div>
                </div>
                {activo && (
                  <Check
                    className="w-5 h-5 text-[#D6FF00] shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={tempInput}
          onChange={(e) => setTempInput(e.target.value)}
          placeholder="Ej. 19°C · Nublado parcial"
          className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border mb-3.5 ${
            isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
          }`}
        />

        <button
          type="button"
          onClick={() => {
            triggerHaptic('success');
            const obj = opcionesClima.find((o) => o.id === estadoSel);
            onGuardarClima(club.id, estadoSel, obj?.texto || 'Cancha Seca · Óptima', tempInput);
            onClose();
          }}
          className="mp-hero-btn w-full py-3.5 rounded-2xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-lg"
        >
          Publicar Estado de Cancha en Vivo ⚡
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 20. MODAL LANDING PAGE "COACH PRO" (CON SISTEMA DE RESEÑAS VERIFICADAS REALES)
// ----------------------------------------------------------------------------
export const CoachProDetailModal = ({
  isOpen,
  onClose,
  coach,
  usuarioActivo,
  isLightMode,
  onAgregarResenaCoach
}) => {
  const [programaElegidoId, setProgramaElegidoId] = useState('');
  const [horarioElegido, setHorarioElegido] = useState('');
  const [ratingNuevo, setRatingNuevo] = useState(5);
  const [comentarioNuevo, setComentarioNuevo] = useState('');
  const [mostrarFormResena, setMostrarFormResena] = useState(false);

  useEffect(() => {
    if (coach) {
      setProgramaElegidoId(coach.programas?.[0]?.id || '');
      setHorarioElegido(coach.horariosDisponibles?.[0]?.diaHora || 'Mañana · 08:00 AM');
    }
  }, [coach]);

  if (!isOpen || !coach) return null;

  const progObj =
    (coach.programas || []).find((p) => p.id === programaElegidoId) ||
    coach.programas?.[0];

  const totalResenas = (coach.resenas || []).length;
  const promedio =
    totalResenas > 0
      ? (
          coach.resenas.reduce((acc, r) => acc + Number(r.rating || 5), 0) /
          totalResenas
        ).toFixed(1)
      : '5.0';

  const avatarCoach = {
    nombre: coach.nombre,
    foto_url: coach.foto_url,
    club: coach.clubPrincipal
  };

  const msgReservaCoach = `Hola Profe ${coach.nombre}, vi tu perfil oficial en MATCHPOINT y quiero reservar: ${
    progObj?.titulo || 'Clase de Tenis'
  } (S/ ${progObj?.precio || coach.precioBase}) en el horario ${horarioElegido}.`;

  const handleEnviarResena = (e) => {
    e.preventDefault();
    if (!comentarioNuevo.trim()) return;
    triggerHaptic('success');
    onAgregarResenaCoach(coach.id, {
      id: `rev-${Date.now()}`,
      autorId: usuarioActivo?.id || 'inv',
      autorNombre: usuarioActivo?.nombre || 'Socio Verificado del Circuito',
      autorCategoria: usuarioActivo
        ? obtenerCategoriaPorElo(usuarioActivo.elo).nombreCorto
        : 'Cat. 4ª',
      autorClub: usuarioActivo?.club || 'Country Club Los Huancas',
      autorFoto: usuarioActivo?.foto_url || '',
      rating: ratingNuevo,
      comentario: comentarioNuevo.trim(),
      fecha: 'Publicado hoy'
    });
    setComentarioNuevo('');
    setMostrarFormResena(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border relative shadow-2xl ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0D121C] border-white/15 text-white'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
        >
          <X
            className="w-4 h-4"
          />
        </button>

        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={coach.banner_url}
            alt={coach.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D121C] via-[#0D121C]/60 to-transparent" />
          <div className="absolute top-3 left-3">
            <CanvaIcon3D
              type="escudo_coach"
              size={42}
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 -mt-12 relative space-y-4">
          <div className="flex items-end gap-3.5">
            <PlayerAvatarWithClub
              jugador={avatarCoach}
              size={78}
              ringColor="border-[#D6FF00] ring-4 ring-[#0D121C]"
            />
            <div className="pb-1 min-w-0 flex-1">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-[#0B0E14] font-display font-black text-[9px] uppercase">
                {coach.credencial}
              </span>
              <h2 className="font-display font-black text-2xl tracking-tight truncate mt-0.5">
                {coach.nombre}
              </h2>
              <p className="text-xs font-bold text-[#38BDF8] truncate">
                📍 {coach.clubPrincipal}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#141B28] text-white border border-white/10 text-center">
            <div>
              <span className="font-display font-black text-base text-amber-400 block">
                ★ {promedio}
              </span>
              <span className="text-[9px] uppercase opacity-70">
                {totalResenas} Reseñas Reales
              </span>
            </div>
            <div>
              <span className="font-display font-black text-base text-[#00A3FF] block">
                +{coach.alumnosAscendidos} Socios
              </span>
              <span className="text-[9px] uppercase opacity-70">
                Ascendidos de Nivel
              </span>
            </div>
            <div>
              <span className="font-display font-black text-base text-[#D6FF00] block">
                S/ {coach.precioBase}
              </span>
              <span className="text-[9px] uppercase opacity-70">
                Tarifa Base
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#00A3FF] mb-2">
              1. Elige tu Programa o Pack de Entrenamiento
            </h3>
            <div className="space-y-2">
              {(coach.programas || []).map((prog) => {
                const activo = prog.id === progObj?.id;
                return (
                  <div
                    key={prog.id}
                    onClick={() => { triggerHaptic('selection'); setProgramaElegidoId(prog.id); }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      activo
                        ? 'bg-[#00A3FF]/15 border-[#D6FF00] shadow-[0_0_16px_rgba(214,255,0,0.18)]'
                        : 'bg-white/5 border-white/10 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {prog.badgePromo && (
                      <span className="inline-block mb-1 px-2 py-0.5 rounded bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[9px] uppercase">
                        ★ {prog.badgePromo}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="font-display font-black text-sm">{prog.titulo}</h4>
                        <p className="text-[11px] opacity-75 mt-0.5">{prog.subtitulo}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="tabular-nums font-display font-black text-lg text-[#D6FF00] block">
                          S/ {prog.precio}
                        </span>
                        <span className="text-[9px] uppercase opacity-70">/{prog.unidad}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#00A3FF] mb-2">
              2. Horarios Disponibles esta Semana
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(coach.horariosDisponibles || []).map((h) => {
                const activo = horarioElegido === h.diaHora;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => { triggerHaptic('selection'); setHorarioElegido(h.diaHora); }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      activo
                        ? 'bg-[#D6FF00] text-[#0B0E14] border-[#D6FF00] font-black'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <span className="font-display font-black text-xs block">{h.diaHora}</span>
                    <span className="text-[10px] opacity-80 block truncate">{h.sede}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-display font-black text-xs uppercase tracking-wider">
                Reseñas de Jugadores del Circuito ({totalResenas})
              </h3>
              <button
                type="button"
                onClick={() => setMostrarFormResena(!mostrarFormResena)}
                className="px-2.5 py-1 rounded-lg bg-[#00A3FF]/20 text-[#38BDF8] font-display font-black text-[10px] uppercase"
              >
                {mostrarFormResena ? 'Cancelar' : '+ Dejar Reseña'}
              </button>
            </div>

            {mostrarFormResena && (
              <form
                onSubmit={handleEnviarResena}
                className="p-3 rounded-2xl bg-black/40 border border-[#00A3FF]/40 mb-3 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold">Tu calificación:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingNuevo(star)}
                        className={`text-base ${star <= ratingNuevo ? 'text-amber-400' : 'opacity-30'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={comentarioNuevo}
                  onChange={(e) => setComentarioNuevo(e.target.value)}
                  placeholder="Escribe qué mejoraste en cancha con este entrenador..."
                  className="w-full rounded-xl px-3 py-2 text-xs bg-[#141A26] border border-white/15 text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase"
                >
                  Publicar Reseña Verificada
                </button>
              </form>
            )}

            <div className="space-y-2">
              {(coach.resenas || []).map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-black text-xs">
                      {rev.autorNombre} ({rev.autorCategoria})
                    </span>
                    <span className="text-amber-400 text-xs font-bold">
                      {'★'.repeat(Number(rev.rating || 5))}
                    </span>
                  </div>
                  <p className="text-xs opacity-85 italic">"{rev.comentario}"</p>
                </div>
              ))}
            </div>
          </div>

          <a
            href={`https://wa.me/${coach.whatsapp}?text=${encodeURIComponent(msgReservaCoach)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => triggerHaptic('medium')}
            className="mp-hero-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D6FF00] to-[#00A3FF] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
          >
            <Phone
              className="w-4 h-4"
            />
            <span>Reservar {horarioElegido} por WhatsApp ⚡</span>
          </a>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 21. MODAL DE CUADRO ELIMINATORIO DE TORNEO (SIN SIEMBRA + RONDA CONSUELO + ADMIN)
// ----------------------------------------------------------------------------
export const TournamentBracketModal = ({
  isOpen,
  onClose,
  torneo,
  esAdmin,
  isLightMode,
  onSolicitarAccesoAdmin,
  onPublicarResultadoLlave,
  onInscribirTorneo
}) => {
  const [pestanaCuadro, setPestanaCuadro] = useState('principal');
  const [rondaActiva, setRondaActiva] = useState('cuartos');
  const [llaveEditando, setLlaveEditando] = useState(null);
  const [ganadorLlave, setGanadorLlave] = useState('');
  const [scoreLlave, setScoreLlave] = useState('6-4, 6-3');

  if (!isOpen || !torneo) return null;

  const listaPartidosRonda =
    pestanaCuadro === 'consuelo'
      ? torneo.consuelo || []
      : rondaActiva === 'cuartos'
      ? torneo.cuartos || []
      : rondaActiva === 'semifinales'
      ? torneo.semifinales || []
      : torneo.final || [];

  const handleGuardarLlave = (e) => {
    e.preventDefault();
    if (!llaveEditando || !ganadorLlave) return;
    triggerHaptic('success');
    onPublicarResultadoLlave(torneo.id, rondaActiva, llaveEditando.id, ganadorLlave, scoreLlave);
    setLlaveEditando(null);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border p-4 sm:p-5 relative shadow-2xl ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E131D] border-white/15 text-white'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X
            className="w-4 h-4"
          />
        </button>

        <div className="text-center mb-4">
          <span className="px-2.5 py-0.5 rounded-full bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[10px] uppercase">
            {torneo.sponsor}
          </span>
          <h2 className="font-display font-black text-xl tracking-tight mt-1.5">
            {torneo.titulo}
          </h2>
          <p className="text-xs text-[#38BDF8] font-bold">
            📍 {torneo.sede} · {torneo.fechas}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-black/30 border border-white/10 mb-3">
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setPestanaCuadro('principal'); }}
            className={`mp-tab-pill py-2 rounded-xl font-display font-black text-[11px] uppercase ${
              pestanaCuadro === 'principal' ? 'bg-[#D6FF00] text-[#0B0E14]' : 'opacity-75'
            }`}
          >
            🏆 Principal
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setPestanaCuadro('consuelo'); }}
            className={`mp-tab-pill py-2 rounded-xl font-display font-black text-[11px] uppercase ${
              pestanaCuadro === 'consuelo' ? 'bg-[#00A3FF] text-white' : 'opacity-75'
            }`}
          >
            🛡️ Consuelo
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setPestanaCuadro('inscritos'); }}
            className={`mp-tab-pill py-2 rounded-xl font-display font-black text-[11px] uppercase ${
              pestanaCuadro === 'inscritos' ? 'bg-[#00A3FF] text-white' : 'opacity-75'
            }`}
          >
            👥 Sorteo ({torneo.participantes?.length || 8})
          </button>
        </div>

        {pestanaCuadro === 'principal' && (
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { id: 'cuartos', label: 'Cuartos' },
              { id: 'semifinales', label: 'Semifinales' },
              { id: 'final', label: 'Gran Final' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { triggerHaptic('selection'); setRondaActiva(r.id); }}
                className={`py-1.5 rounded-xl font-display font-extrabold text-xs border ${
                  rondaActiva === r.id
                    ? 'bg-[#00A3FF]/20 border-[#00A3FF] text-[#38BDF8]'
                    : 'border-white/10 opacity-70'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {pestanaCuadro === 'inscritos' ? (
          <div className="space-y-2 mb-4">
            <p className="text-xs opacity-80 text-center mb-2">
              Sorteo puro sin cabezas de serie privilegiados. Todos compiten en igualdad de condiciones.
            </p>
            {(torneo.participantes || []).map((nombre, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-display font-bold"
              >
                <span>Cupo Sorteado #{idx + 1}</span>
                <span className="text-[#D6FF00]">{nombre}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 mb-4">
            {listaPartidosRonda.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-[#141B28] text-white border border-white/10"
              >
                <div className="flex items-center justify-between text-[10px] font-display font-bold text-slate-400 mb-2">
                  <span>📍 {m.canchaHora}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-black ${
                      m.estado === 'Finalizado'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : m.enVivo
                        ? 'bg-[#D6FF00] text-[#0B0E14]'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {m.enVivo ? '● EN CANCHA' : m.marcador || m.estado}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <ClubBadge
                        clubName={m.j1Club}
                        size={18}
                      />
                      <span
                        className={`font-display font-bold text-xs ${
                          m.ganador === m.j1 ? 'text-[#D6FF00]' : 'text-white'
                        }`}
                      >
                        {m.j1}
                      </span>
                    </div>
                    {m.ganador === m.j1 && (
                      <Check
                        className="w-4 h-4 text-[#D6FF00]"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <ClubBadge
                        clubName={m.j2Club}
                        size={18}
                      />
                      <span
                        className={`font-display font-bold text-xs ${
                          m.ganador === m.j2 ? 'text-[#D6FF00]' : 'text-white'
                        }`}
                      >
                        {m.j2}
                      </span>
                    </div>
                    {m.ganador === m.j2 && (
                      <Check
                        className="w-4 h-4 text-[#D6FF00]"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-end">
                  {esAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLlaveEditando(m);
                        setGanadorLlave(m.j1);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#D6FF00] text-[#0B0E14] font-display font-black text-[10px] uppercase"
                    >
                      Subir Resultado Oficial (Admin)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onSolicitarAccesoAdmin}
                      className="text-[10px] font-display font-bold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Lock
                        className="w-3 h-3"
                      />
                      <span>Validación exclusiva del Comité</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {llaveEditando && esAdmin && (
          <form
            onSubmit={handleGuardarLlave}
            className="p-3.5 rounded-2xl bg-black/50 border border-[#D6FF00] mb-3 space-y-2.5"
          >
            <span className="font-display font-black text-xs text-[#D6FF00] block">
              Cargar Resultado Oficial: {llaveEditando.j1} vs {llaveEditando.j2}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGanadorLlave(llaveEditando.j1)}
                className={`py-2 rounded-xl font-display font-bold text-xs ${
                  ganadorLlave === llaveEditando.j1 ? 'bg-[#D6FF00] text-[#0B0E14]' : 'bg-white/10'
                }`}
              >
                🏆 {llaveEditando.j1}
              </button>
              <button
                type="button"
                onClick={() => setGanadorLlave(llaveEditando.j2)}
                className={`py-2 rounded-xl font-display font-bold text-xs ${
                  ganadorLlave === llaveEditando.j2 ? 'bg-[#D6FF00] text-[#0B0E14]' : 'bg-white/10'
                }`}
              >
                🏆 {llaveEditando.j2}
              </button>
            </div>
            <input
              type="text"
              required
              value={scoreLlave}
              onChange={(e) => setScoreLlave(e.target.value)}
              placeholder="Marcador (ej. 6-4, 6-3)"
              className="w-full rounded-xl px-3 py-2 text-xs bg-[#141A26] border border-white/20 text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#00A3FF] text-white font-display font-black text-xs uppercase"
            >
              Publicar y Avanzar Ganador de Ronda
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            onInscribirTorneo(torneo);
          }}
          className="mp-hero-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D6FF00] to-[#00A3FF] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-lg"
        >
          Inscribirme / Confirmar Cupo en este Torneo (S/ {torneo.precioInscripcion})
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 22. MODAL DE LOGIN DUAL, CALIBRACIÓN INICIAL Y RECUPERACIÓN DE CONTRASEÑA
// ----------------------------------------------------------------------------
export const AuthAndRecoveryModal = ({
  isOpen,
  onClose,
  jugadores = [],
  isLightMode,
  onLoginExitoso,
  onRegistrarNuevoSocio,
  onResetPasswordExitoso
}) => {
  const [modoAuth, setModoAuth] = useState('login');
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [clubNuevo, setClubNuevo] = useState('Country Club Los Huancas');
  const [nivelInicialElo, setNivelInicialElo] = useState(1300);
  const [nuevaClaveRescate, setNuevaClaveRescate] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setMensajeError('');
    const limpio = identificador.trim().toLowerCase();
    const encontrado = jugadores.find(
      (j) =>
        j.email?.toLowerCase() === limpio ||
        j.telefono === limpio ||
        j.nombre.toLowerCase().includes(limpio)
    );
    if (!encontrado) {
      setMensajeError('No encontramos una cuenta con ese celular o correo. Prueba registrarte.');
      return;
    }
    triggerHaptic('success');
    onLoginExitoso(encontrado);
    onClose();
  };

  const handleRegistro = (e) => {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;
    triggerHaptic('success');
    const nuevo = {
      id: `p-${Date.now()}`,
      nombre: nombreNuevo.trim(),
      elo: Number(nivelInicialElo),
      victorias: 0,
      derrotas: 0,
      racha: 0,
      tendenciaSemanal: 0,
      club: clubNuevo,
      divisionEspecial: 'General',
      edad: 28,
      estatura: '1.76 m',
      manoHabil: 'Diestro',
      tipoReves: 'Revés a dos manos',
      superficieFavorita: 'Arcilla',
      entrenador: 'En Calibración',
      mejorRankingHistorico: jugadores.length + 1,
      titulosTemporada: 0,
      puntosTienda: 20,
      esVip: false,
      telefono: identificador.trim() || '964000999',
      email: identificador.includes('@') ? identificador.trim() : `${Date.now()}@matchpoint.pe`,
      password: password || '123',
      dni: '70000000',
      ultimoPartidoTs: Date.now(),
      foto_url: ''
    };
    onRegistrarNuevoSocio(nuevo);
    onClose();
  };

  const handleRecuperarInApp = (e) => {
    e.preventDefault();
    setMensajeError('');
    const limpio = identificador.trim().toLowerCase();
    const encontrado = jugadores.find(
      (j) => j.email?.toLowerCase() === limpio || j.telefono === limpio
    );
    if (!encontrado) {
      setMensajeError('Cuenta no encontrada. Verifica tu celular o solicita ayuda por WhatsApp abajo.');
      return;
    }
    triggerHaptic('success');
    onResetPasswordExitoso(encontrado.id, nuevaClaveRescate || '1234');
    setModoAuth('login');
  };

  const msgSoporteWa = `Hola Administrador MATCHPOINT, solicito restablecer el acceso a mi cuenta vinculada al celular/correo: ${
    identificador || 'Mi Cuenta'
  }.`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl border p-5 relative shadow-2xl ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E131D] border-white/15 text-white'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="mp-icon-btn absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X
            className="w-4 h-4"
          />
        </button>

        <div className="text-center mb-4">
          <MatchpointOfficialLogo
            size={48}
          />
          <h2 className="font-display font-black text-xl tracking-tight mt-2">
            {modoAuth === 'login'
              ? 'Ingresar a MATCHPOINT'
              : modoAuth === 'registro'
              ? 'Crear Cuenta Oficial'
              : 'Recuperar Contraseña'}
          </h2>
        </div>

        {modoAuth !== 'recuperar' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/10 mb-4">
            <button
              type="button"
              onClick={() => { setModoAuth('login'); setMensajeError(''); }}
              className={`py-2 rounded-xl font-display font-black text-xs uppercase ${
                modoAuth === 'login' ? 'bg-[#D6FF00] text-[#0B0E14]' : 'opacity-70'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setModoAuth('registro'); setMensajeError(''); }}
              className={`py-2 rounded-xl font-display font-black text-xs uppercase ${
                modoAuth === 'registro' ? 'bg-[#00A3FF] text-white' : 'opacity-70'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {mensajeError && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs mb-3 text-center">
            {mensajeError}
          </div>
        )}

        {modoAuth === 'login' && (
          <form
            onSubmit={handleLogin}
            className="space-y-3"
          >
            <div>
              <label className="block font-display font-bold text-xs mb-1 opacity-80">
                Número de Celular (WhatsApp) o Correo
              </label>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Ej. 964111001 o rodrigo@matchpoint.pe"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-display font-bold text-xs mb-1 opacity-80">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => { setModoAuth('recuperar'); setMensajeError(''); }}
                className="text-xs font-display font-bold text-[#00A3FF] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Explorar como invitado
              </button>
            </div>

            <button
              type="submit"
              className="mp-hero-btn w-full py-3.5 rounded-2xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase tracking-wider shadow-lg"
            >
              Entrar al Circuito Oficial ⚡
            </button>
          </form>
        )}

        {modoAuth === 'registro' && (
          <form
            onSubmit={handleRegistro}
            className="space-y-3"
          >
            <div>
              <label className="block font-display font-bold text-xs mb-1 opacity-80">
                Nombre y Apellido Oficial
              </label>
              <input
                type="text"
                required
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Ej. Sebastián Rojas"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-display font-bold text-xs mb-1 opacity-80">
                Celular (WhatsApp) o Correo
              </label>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="964XXXXXX"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-display font-bold text-xs mb-1 opacity-80">
                Club o Academia que representas
              </label>
              <select
                value={clubNuevo}
                onChange={(e) => setClubNuevo(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-display font-bold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              >
                <option value="Country Club Los Huancas">Country Club Los Huancas</option>
                <option value="Club Tauro Tenis">Club Tauro Tenis</option>
                <option value="Academia Romina Cutipa">Academia Romina Cutipa</option>
                <option value="Club Los Inkas Huancayo">Club Los Inkas Huancayo</option>
                <option value="Independiente">Jugador Independiente</option>
              </select>
            </div>

            <div>
              <label className="block font-display font-bold text-xs mb-1 opacity-80">
                Cuestionario de Nivel Inicial (5 Partidos de Calibración)
              </label>
              <select
                value={nivelInicialElo}
                onChange={(e) => setNivelInicialElo(Number(e.target.value))}
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-display font-bold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              >
                <option value={400}>Empiezo de cero / Aprendiendo (5ª P · 400 Pts)</option>
                <option value={900}>Peloteo regular de fondo (5ª B · 900 Pts)</option>
                <option value={1450}>Saque consistente y juego sets (5ª A · 1,450 Pts)</option>
                <option value={2100}>Competitivo de club con efectos (4ª · 2,100 Pts)</option>
                <option value={2950}>Avanzado / Campeón de torneos (3ª · 2,950 Pts)</option>
              </select>
            </div>

            <button
              type="submit"
              className="mp-hero-btn w-full py-3.5 rounded-2xl bg-[#00A3FF] text-white font-display font-black text-xs uppercase tracking-wider shadow-lg"
            >
              Crear Cuenta e Iniciar Calibración (0/5)
            </button>
          </form>
        )}

        {modoAuth === 'recuperar' && (
          <div className="space-y-3">
            <form
              onSubmit={handleRecuperarInApp}
              className="space-y-3"
            >
              <p className="text-xs opacity-80 text-center">
                Ingresa tu celular o correo registrado para asignar una nueva clave al instante:
              </p>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Celular o correo de tu cuenta"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              />
              <input
                type="password"
                required
                value={nuevaClaveRescate}
                onChange={(e) => setNuevaClaveRescate(e.target.value)}
                placeholder="Escribe tu nueva contraseña"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                  isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#151C28] border-white/15 text-white'
                }`}
              />
              <button
                type="submit"
                className="mp-hero-btn w-full py-3 rounded-2xl bg-[#D6FF00] text-[#0B0E14] font-display font-black text-xs uppercase"
              >
                Actualizar Contraseña Ahora
              </button>
            </form>

            <div className="pt-3 border-t border-white/10 text-center space-y-2">
              <span className="text-[11px] opacity-70 block">
                ¿Necesitas asistencia directa del Comité Oficial?
              </span>
              <a
                href={`https://wa.me/${ADMIN_CONFIG.WHATSAPP_ADMIN}?text=${encodeURIComponent(msgSoporteWa)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-display font-black text-xs uppercase flex items-center justify-center gap-2"
              >
                <Phone
                  className="w-3.5 h-3.5"
                />
                <span>Solicitar Reset por WhatsApp al Admin</span>
              </a>
              <button
                type="button"
                onClick={() => setModoAuth('login')}
                className="text-xs font-display font-bold text-[#00A3FF] block mx-auto pt-1"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 23. COMPONENTE PRINCIPAL APP (CON HANDLERS PRE-DECLARADOS LIMPIOS)
// ----------------------------------------------------------------------------
export default function App() {
  const [activeTab, setActiveTab] = useState('ranking');
  const [isLightMode, setIsLightMode] = useState(false);

  const [clubes, setClubes] = useState(INITIAL_CLUBS);
  const [jugadores, setJugadores] = useState(INITIAL_PLAYERS);
  const [hallOfFame] = useState(INITIAL_HALL_OF_FAME);
  const [coaches, setCoaches] = useState(INITIAL_COACHES);
  const [partidos, setPartidos] = useState(INITIAL_MATCHES);
  const [noticias] = useState(INITIAL_NEWS);
  const [torneos, setTorneos] = useState(INITIAL_TOURNAMENTS);

  const [usuarioActivo, setUsuarioActivo] = useState(INITIAL_PLAYERS[0]);
  const [esAdmin, setEsAdmin] = useState(false);

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [reglamentoAbierto, setReglamentoAbierto] = useState(false);
  const [nivelesModalAbierto, setNivelesModalAbierto] = useState(false);
  const [proShopAbierto, setProShopAbierto] = useState(false);
  const [vipCardAbierto, setVipCardAbierto] = useState(false);
  const [authModalAbierto, setAuthModalAbierto] = useState(false);
  const [jugadorFichaSel, setJugadorFichaSel] = useState(null);
  const [coachSel, setCoachSel] = useState(null);
  const [clubClimaSel, setClubClimaSel] = useState(null);
  const [torneoSel, setTorneoSel] = useState(null);
  const [modalRetoConfig, setModalRetoConfig] = useState({
    abierto: false,
    modo: 'retar',
    rival: null,
    partido: null
  });
  const [bannerCelebracion, setBannerCelebracion] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuAbierto(false);
        setReglamentoAbierto(false);
        setNivelesModalAbierto(false);
        setProShopAbierto(false);
        setVipCardAbierto(false);
        setAuthModalAbierto(false);
        setJugadorFichaSel(null);
        setCoachSel(null);
        setClubClimaSel(null);
        setTorneoSel(null);
        setModalRetoConfig((prev) => ({ ...prev, abierto: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCambiarClubUsuario = (nuevoClub) => {
    if (!usuarioActivo) return;
    const actualizado = { ...usuarioActivo, club: nuevoClub };
    setUsuarioActivo(actualizado);
    setJugadores((prev) =>
      prev.map((j) => (j.id === actualizado.id ? actualizado : j))
    );
    if (jugadorFichaSel && jugadorFichaSel.id === actualizado.id) {
      setJugadorFichaSel(actualizado);
    }
  };

  const handleCrearNuevoReto = (rival, sede, fechaHora) => {
    const emisor = usuarioActivo || jugadores[0];
    const nuevoPartido = {
      id: `m-${Date.now()}`,
      jugadorAId: emisor.id,
      jugadorANombre: emisor.nombre,
      jugadorAElo: emisor.elo,
      jugadorAClub: emisor.club,
      jugadorAFoto: emisor.foto_url,
      jugadorBId: rival.id,
      jugadorBNombre: rival.nombre,
      jugadorBElo: rival.elo,
      jugadorBClub: rival.club,
      jugadorBFoto: rival.foto_url,
      sede,
      fechaHora,
      estado: 'Programado',
      enVivo: false,
      sacadorActual: 'A',
      sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }],
      puntosGameActual: { a: '0', b: '0' },
      eloEnJuego: previsualizarRiesgoReto(emisor, rival).siGanas,
      timestamp: Date.now()
    };
    setPartidos((prev) => [nuevoPartido, ...prev]);
    setBannerCelebracion(`⚔️ Desafío enviado a ${rival.nombre} en ${sede} (${fechaHora}).`);
    setTimeout(() => setBannerCelebracion(null), 4500);
  };

  const handleConfirmarActaPartido = (partido, ganadorId, marcadorTexto) => {
    const jugA = jugadores.find((j) => j.id === partido.jugadorAId) || jugadores[0];
    const jugB = jugadores.find((j) => j.id === partido.jugadorBId) || jugadores[1];
    const esGanadorA = ganadorId === jugA.id;
    const ganadorObj = esGanadorA ? jugA : jugB;
    const perdedorObj = esGanadorA ? jugB : jugA;

    const resultadoMatematico = calcularImpactoPartidoELO({
      jugadorGanador: ganadorObj,
      jugadorPerdedor: perdedorObj,
      marcadorTexto,
      historialPartidos: partidos
    });

    setJugadores((prev) =>
      prev.map((j) => {
        if (j.id === ganadorObj.id) {
          const actualizado = {
            ...j,
            elo: Number(j.elo) + resultadoMatematico.deltaGanador,
            victorias: Number(j.victorias) + 1,
            racha: Number(j.racha || 0) + 1,
            puntosTienda: Number(j.puntosTienda || 0) + resultadoMatematico.bonoTiendaAmbos
          };
          if (usuarioActivo && usuarioActivo.id === j.id) setUsuarioActivo(actualizado);
          return actualizado;
        }
        if (j.id === perdedorObj.id) {
          const actualizado = {
            ...j,
            elo: Math.max(100, Number(j.elo) + resultadoMatematico.deltaPerdedor),
            derrotas: Number(j.derrotas) + 1,
            racha: 0,
            puntosTienda: Number(j.puntosTienda || 0) + resultadoMatematico.bonoTiendaAmbos
          };
          if (usuarioActivo && usuarioActivo.id === j.id) setUsuarioActivo(actualizado);
          return actualizado;
        }
        return j;
      })
    );

    setPartidos((prev) =>
      prev.map((m) =>
        m.id === partido.id
          ? {
              ...m,
              estado: 'Finalizado',
              enVivo: false,
              ganadorId: ganadorObj.id,
              marcadorFinal: marcadorTexto
            }
          : m
      )
    );

    setBannerCelebracion(
      `🏆 Victoria de ${ganadorObj.nombre} (${marcadorTexto}) · +${resultadoMatematico.deltaGanador} Pts ELO (${resultadoMatematico.etiquetaDominio}).`
    );
    setTimeout(() => setBannerCelebracion(null), 5500);
  };

  const handleActualizarGameEnVivo = (matchId, lado) => {
    setPartidos((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const copiaSets = [...(m.sets || [{ a: 0, b: 0 }, { a: 0, b: 0 }])];
        const idxSet = copiaSets.length - 1;
        if (lado === 'A') copiaSets[idxSet] = { ...copiaSets[idxSet], a: copiaSets[idxSet].a + 1 };
        else copiaSets[idxSet] = { ...copiaSets[idxSet], b: copiaSets[idxSet].b + 1 };
        return {
          ...m,
          sets: copiaSets,
          sacadorActual: m.sacadorActual === 'A' ? 'B' : 'A',
          ultimaActualizacionMin: 1
        };
      })
    );
  };

  const handleGuardarClimaClub = (clubId, estadoClima, estadoTexto, temperatura) => {
    setClubes((prev) =>
      prev.map((c) =>
        c.id === clubId
          ? {
              ...c,
              estadoClima,
              estadoTexto,
              temperatura,
              ultimoReportePor: usuarioActivo?.nombre || 'Socio Verificado',
              horaReporte: 'Ahora'
            }
          : c
      )
    );
  };

  const handleAgregarResenaCoach = (coachId, nuevaResena) => {
    setCoaches((prev) =>
      prev.map((c) => {
        if (c.id !== coachId) return c;
        const actualizado = { ...c, resenas: [nuevaResena, ...(c.resenas || [])] };
        setCoachSel(actualizado);
        return actualizado;
      })
    );
  };

  const handlePublicarResultadoLlaveTorneo = (torneoId, ronda, matchId, ganadorNombre, score) => {
    setTorneos((prev) =>
      prev.map((t) => {
        if (t.id !== torneoId) return t;
        const actualizarLista = (lista = []) =>
          lista.map((m) =>
            m.id === matchId
              ? { ...m, estado: 'Finalizado', enVivo: false, ganador: ganadorNombre, marcador: score }
              : m
          );
        const actualizado = {
          ...t,
          cuartos: ronda === 'cuartos' ? actualizarLista(t.cuartos) : t.cuartos,
          semifinales: ronda === 'semifinales' ? actualizarLista(t.semifinales) : t.semifinales,
          final: ronda === 'final' ? actualizarLista(t.final) : t.final
        };
        setTorneoSel(actualizado);
        return actualizado;
      })
    );
  };

  const handleSolicitarPinAdmin = () => {
    const pin = window.prompt('Ingresa el PIN Maestro del Comité MATCHPOINT (1234):');
    if (pin === ADMIN_CONFIG.PIN_COMITE) {
      triggerHaptic('success');
      setEsAdmin(true);
      setBannerCelebracion('🔓 Modo Administrador del Comité activado.');
      setTimeout(() => setBannerCelebracion(null), 4000);
    }
  };

  // Variables y Handlers limpios para pasar a los componentes sin usar "=>" en JSX
  const cantidadPartidosEnVivo = partidos.filter((m) => m.enVivo).length;
  const abrirMenu = () => setMenuAbierto(true);
  const abrirProShop = () => setProShopAbierto(true);
  const irARetos = () => setActiveTab('retos');
  const abrirAuth = () => setAuthModalAbierto(true);
  const abrirMiPerfil = () => setJugadorFichaSel(usuarioActivo || jugadores[0]);
  const abrirModalNiveles = () => setNivelesModalAbierto(true);
  const cerrarModalNiveles = () => setNivelesModalAbierto(false);
  const cerrarFichaJugador = () => setJugadorFichaSel(null);
  const cerrarVipCard = () => setVipCardAbierto(false);
  const cerrarProShop = () => setProShopAbierto(false);
  const cerrarModalReto = () => setModalRetoConfig((prev) => ({ ...prev, abierto: false }));
  const cerrarModalClima = () => setClubClimaSel(null);
  const cerrarModalCoach = () => setCoachSel(null);
  const cerrarModalTorneo = () => setTorneoSel(null);
  const cerrarModalAuth = () => setAuthModalAbierto(false);

  const handleNewsCtaClick = (item) => {
    if (item.categoria.includes('PRO SHOP')) setProShopAbierto(true);
    else setActiveTab('sedes');
  };

  const abrirModalLanzarReto = (rival) => {
    setModalRetoConfig({ abierto: true, modo: 'retar', rival, partido: null });
  };

  const abrirModalConfirmarScore = (partido) => {
    setModalRetoConfig({ abierto: true, modo: 'score', rival: null, partido });
  };

  const abrirVipDesdePerfil = () => {
    setJugadorFichaSel(null);
    setVipCardAbierto(true);
  };

  const handleSolicitarVipWhatsApp = () => {
    const url = `https://wa.me/${ADMIN_CONFIG.WHATSAPP_ADMIN}?text=${encodeURIComponent(
      `Hola MATCHPOINT, soy ${usuarioActivo?.nombre} y deseo activar mi Carnet Digital VIP.`
    )}`;
    window.open(url, '_blank');
  };

  const handleInscribirTorneoWhatsApp = (t) => {
    const url = `https://wa.me/${ADMIN_CONFIG.WHATSAPP_ADMIN}?text=${encodeURIComponent(
      `Hola Comité MATCHPOINT, soy ${usuarioActivo?.nombre || 'Socio'} y deseo confirmar mi inscripción al torneo ${t.titulo} (S/ ${t.precioInscripcion}).`
    )}`;
    window.open(url, '_blank');
  };

  const handleRegistrarSocioState = (nuevo) => {
    setJugadores((prev) => [...prev, nuevo]);
    setUsuarioActivo(nuevo);
  };

  const handleResetPasswordState = (id, nuevaClave) => {
    setJugadores((prev) =>
      prev.map((j) => (j.id === id ? { ...j, password: nuevaClave } : j))
    );
    setBannerCelebracion('🔐 Contraseña actualizada correctamente.');
    setTimeout(() => setBannerCelebracion(null), 4000);
  };

  const fichaAbiertaBool = Boolean(jugadorFichaSel);
  const climaAbiertoBool = Boolean(clubClimaSel);
  const coachAbiertoBool = Boolean(coachSel);
  const torneoAbiertoBool = Boolean(torneoSel);
  const miJugadorActual = usuarioActivo || jugadores[0];

  return (
    <div
      className={`min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl border-x pb-24 transition-colors ${
        isLightMode
          ? 'bg-[#EEF2F6] text-slate-900 border-slate-200'
          : 'bg-[#0B0E14] text-white border-white/10'
      }`}
    >
      <GlobalMatchpointStyles
        isLightMode={isLightMode}
      />

      <HeaderInstitucional
        isLightMode={isLightMode}
        usuarioActivo={usuarioActivo}
        notificacionesCount={cantidadPartidosEnVivo}
        onOpenMenu={abrirMenu}
        onOpenProShop={abrirProShop}
        onOpenNotificaciones={irARetos}
        onOpenAuth={abrirAuth}
        onOpenPerfil={abrirMiPerfil}
      />

      {bannerCelebracion && (
        <div className="mx-3.5 mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#D6FF00] to-[#00A3FF] text-[#0B0E14] font-display font-black text-xs text-center shadow-lg">
          {bannerCelebracion}
        </div>
      )}

      <main className="p-3.5 flex-1">
        {activeTab === 'ranking' && (
          <RankingAndHallOfFameView
            jugadores={jugadores}
            hallOfFame={hallOfFame}
            noticias={noticias}
            isLightMode={isLightMode}
            onSelectJugador={setJugadorFichaSel}
            onOpenLevelsModal={abrirModalNiveles}
            onNewsCta={handleNewsCtaClick}
          />
        )}

        {activeTab === 'retos' && (
          <ChallengesCenterView
            jugadores={jugadores}
            partidos={partidos}
            usuarioActivo={usuarioActivo}
            isLightMode={isLightMode}
            onSelectJugador={setJugadorFichaSel}
            onOpenLaunchChallengeModal={abrirModalLanzarReto}
            onActualizarGameEnVivo={handleActualizarGameEnVivo}
            onConfirmarActaFinal={abrirModalConfirmarScore}
          />
        )}

        {activeTab === 'sedes' && (
          <VenuesAndCoachesView
            clubes={clubes}
            coaches={coaches}
            isLightMode={isLightMode}
            onOpenReportWeatherModal={setClubClimaSel}
            onSelectCoach={setCoachSel}
          />
        )}

        {activeTab === 'torneos' && (
          <TournamentsAndBracketsView
            torneos={torneos}
            isLightMode={isLightMode}
            onOpenTournamentModal={setTorneoSel}
            onInscribirTorneo={handleInscribirTorneoWhatsApp}
          />
        )}
      </main>

      <nav
        className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[76px] px-2 border-t backdrop-blur-2xl z-40 flex items-center justify-around ${
          isLightMode
            ? 'bg-white/95 border-slate-200 text-slate-700'
            : 'bg-[#0B0E14]/95 border-white/10 text-slate-400'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            abrirMiPerfil();
          }}
          className="mp-tab-pill flex flex-col items-center justify-center gap-1 w-16"
        >
          <User
            className="w-5 h-5"
          />
          <span className="font-display font-bold text-[10px]">Mi Perfil</span>
        </button>

        <button
          type="button"
          onClick={() => { triggerHaptic('selection'); setActiveTab('ranking'); }}
          className={`mp-tab-pill flex flex-col items-center justify-center gap-1 w-16 ${
            activeTab === 'ranking'
              ? isLightMode ? 'text-[#0052CC] font-black' : 'text-[#D6FF00] font-black'
              : ''
          }`}
        >
          <Trophy
            className="w-5 h-5"
          />
          <span className="font-display font-bold text-[10px]">Ranking</span>
        </button>

        <div className="relative -top-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => { triggerHaptic('medium'); setActiveTab('retos'); }}
            className="mp-hero-btn mp-ripple-ring w-14 h-14 rounded-full bg-gradient-to-br from-[#D6FF00] via-[#A3E635] to-[#00A3FF] flex items-center justify-center shadow-[0_6px_22px_rgba(214,255,0,0.45)] border-2 border-[#0B0E14]"
          >
            <CanvaIcon3D
              type="raquetas_duelo"
              size={34}
            />
          </button>
          <span
            className={`font-display font-black text-[10px] mt-1 ${
              activeTab === 'retos'
                ? isLightMode ? 'text-[#0052CC]' : 'text-[#D6FF00]'
                : ''
            }`}
          >
            Retos
          </span>
        </div>

        <button
          type="button"
          onClick={() => { triggerHaptic('selection'); setActiveTab('sedes'); }}
          className={`mp-tab-pill flex flex-col items-center justify-center gap-1 w-16 ${
            activeTab === 'sedes'
              ? isLightMode ? 'text-[#0052CC] font-black' : 'text-[#D6FF00] font-black'
              : ''
          }`}
        >
          <MapPin
            className="w-5 h-5"
          />
          <span className="font-display font-bold text-[10px]">Sedes</span>
        </button>

        <button
          type="button"
          onClick={() => { triggerHaptic('selection'); setActiveTab('torneos'); }}
          className={`mp-tab-pill flex flex-col items-center justify-center gap-1 w-16 ${
            activeTab === 'torneos'
              ? isLightMode ? 'text-[#0052CC] font-black' : 'text-[#D6FF00] font-black'
              : ''
          }`}
        >
          <Calendar
            className="w-5 h-5"
          />
          <span className="font-display font-bold text-[10px]">Torneos</span>
        </button>
      </nav>

      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-80 max-w-[86vw] h-full p-5 flex flex-col justify-between border-r shadow-2xl ${
              isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E131D] border-white/15 text-white'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MatchpointOfficialLogo
                    size={32}
                  />
                  <span className="font-display font-black text-sm uppercase tracking-wider">
                    Información Oficial
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuAbierto(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X
                    className="w-4 h-4"
                  />
                </button>
              </div>

              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-[#151C28] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isLightMode ? (
                    <Sun
                      className="w-5 h-5 text-amber-500"
                    />
                  ) : (
                    <Moon
                      className="w-5 h-5 text-[#00A3FF]"
                    />
                  )}
                  <div>
                    <span className="font-display font-black text-xs block">
                      Apariencia de Pista
                    </span>
                    <span className="text-[10px] opacity-70 block">
                      {isLightMode ? 'Modo Claro (Luz de Día)' : 'Modo Oscuro (Night Session)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setIsLightMode(!isLightMode);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-display font-black text-[10px] uppercase ${
                    isLightMode
                      ? 'bg-[#0B0E14] text-[#D6FF00]'
                      : 'bg-[#D6FF00] text-[#0B0E14]'
                  }`}
                >
                  Cambiar
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    setReglamentoAbierto(true);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-display font-black text-xs block">
                      📐 Reglamento y Fórmula ELO
                    </span>
                    <span className="text-[11px] opacity-70">
                      Cómo se calculan los puntos, sets y categorías
                    </span>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 opacity-60"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    setActiveTab('sedes');
                  }}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-display font-black text-xs block">
                      🏟️ Sedes y Beneficios de Clubes
                    </span>
                    <span className="text-[11px] opacity-70">
                      Descuentos con Carnet VIP y clima en vivo
                    </span>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 opacity-60"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    setProShopAbierto(true);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-display font-black text-xs block text-[#D6FF00]">
                      ⚡ Taller de Encordado & Pro Shop
                    </span>
                    <span className="text-[11px] opacity-70">
                      Cuerdas, pelotas Wilson y accesorios
                    </span>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 opacity-60"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    handleSolicitarPinAdmin();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-display font-black text-xs block">
                      🛡️ Suite del Comité Oficial (PIN)
                    </span>
                    <span className="text-[11px] opacity-70">
                      {esAdmin ? 'Sesión Admin Activa ✓' : 'Validación de llaves y resultados'}
                    </span>
                  </div>
                  <Lock
                    className="w-4 h-4 opacity-60"
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-center space-y-1">
              <p className="font-display font-black text-[11px] tracking-wider">
                © 2026 MATCHPOINT™ · Circuito Oficial de Tenis
              </p>
              <p className="text-[10px] opacity-60">
                Todos los derechos reservados · Región Junín · {ADMIN_CONFIG.VERSION}
              </p>
            </div>
          </div>
        </div>
      )}

      {reglamentoAbierto && (
        <div
          onClick={() => setReglamentoAbierto(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md max-h-[86vh] overflow-y-auto rounded-3xl border p-5 relative shadow-2xl ${
              isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E131D] border-white/15 text-white'
            }`}
          >
            <button
              type="button"
              onClick={() => setReglamentoAbierto(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X
                className="w-4 h-4"
              />
            </button>
            <div className="text-center mb-4">
              <CanvaIcon3D
                type="trofeo_laurel"
                size={48}
              />
              <h2 className="font-display font-black text-xl mt-1">
                Reglamento y Sistema ELO Oficial
              </h2>
            </div>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <strong className="text-[#D6FF00] block font-display uppercase">
                  1. Los Puntos Determinan tu Categoría:
                </strong>
                Tu ascenso o descenso depende al 100% de tus puntos ELO acumulados. Al superar el techo de tu división, subes automáticamente.
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <strong className="text-[#00A3FF] block font-display uppercase">
                  2. Nivel del Rival y Factor de Dominio (Sets):
                </strong>
                Vencer a un rival de mayor puntaje otorga mayor salto. Además, el margen de games aplica un Factor de Dominio (de 0.70 a 1.30) que premia la contundencia y protege a quien cae luchando en tie-break.
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <strong className="text-amber-400 block font-display uppercase">
                  3. Calibración (5 Partidos) y Candados Anti-Farming:
                </strong>
                Los primeros 5 partidos calibran tu nivel con K=180 (luego K=60 armónico). Dos jugadores solo pueden disputarse puntos ELO entre sí 1 vez cada 15 días.
              </div>
            </div>
          </div>
        </div>
      )}

      <LevelsProgressionModal
        isOpen={nivelesModalAbierto}
        onClose={cerrarModalNiveles}
        usuarioActivo={usuarioActivo}
        isLightMode={isLightMode}
      />

      <PlayerProfileAndH2HModal
        isOpen={fichaAbiertaBool}
        onClose={cerrarFichaJugador}
        jugadorSeleccionado={jugadorFichaSel}
        usuarioActivo={usuarioActivo}
        todosJugadores={jugadores}
        partidos={partidos}
        isLightMode={isLightMode}
        onRetarJugador={abrirModalLanzarReto}
        onOpenVipCard={abrirVipDesdePerfil}
        onCambiarClubUsuario={handleCambiarClubUsuario}
      />

      <VipDigitalCardModal
        isOpen={vipCardAbierto}
        onClose={cerrarVipCard}
        usuario={usuarioActivo}
        onSolicitarVip={handleSolicitarVipWhatsApp}
      />

      <ProShopModal
        isOpen={proShopAbierto}
        onClose={cerrarProShop}
        items={INITIAL_PROSHOP_ITEMS}
        usuarioActivo={usuarioActivo}
        isLightMode={isLightMode}
      />

      <LaunchChallengeAndScoreModal
        isOpen={modalRetoConfig.abierto}
        onClose={cerrarModalReto}
        modo={modalRetoConfig.modo}
        miJugador={miJugadorActual}
        rivalJugador={modalRetoConfig.rival}
        partidoActivo={modalRetoConfig.partido}
        clubes={clubes}
        isLightMode={isLightMode}
        onConfirmarNuevoReto={handleCrearNuevoReto}
        onConfirmarResultadoPartido={handleConfirmarActaPartido}
      />

      <WeatherReportModal
        isOpen={climaAbiertoBool}
        onClose={cerrarModalClima}
        club={clubClimaSel}
        isLightMode={isLightMode}
        onGuardarClima={handleGuardarClimaClub}
      />

      <CoachProDetailModal
        isOpen={coachAbiertoBool}
        onClose={cerrarModalCoach}
        coach={coachSel}
        usuarioActivo={usuarioActivo}
        isLightMode={isLightMode}
        onAgregarResenaCoach={handleAgregarResenaCoach}
      />

      <TournamentBracketModal
        isOpen={torneoAbiertoBool}
        onClose={cerrarModalTorneo}
        torneo={torneoSel}
        esAdmin={esAdmin}
        isLightMode={isLightMode}
        onSolicitarAccesoAdmin={handleSolicitarPinAdmin}
        onPublicarResultadoLlave={handlePublicarResultadoLlaveTorneo}
        onInscribirTorneo={handleInscribirTorneoWhatsApp}
      />

      <AuthAndRecoveryModal
        isOpen={authModalAbierto}
        onClose={cerrarModalAuth}
        jugadores={jugadores}
        isLightMode={isLightMode}
        onLoginExitoso={setUsuarioActivo}
        onRegistrarNuevoSocio={handleRegistrarSocioState}
        onResetPasswordExitoso={handleResetPasswordState}
      />
    </div>
  );
}

// === FIN DEL ARCHIVO src/App.jsx (5 DE 5 COMPLETADO) ===
