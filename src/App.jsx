// ============================================================================
// MATCHPOINT — CIRCUITO OFICIAL DE TENIS HUANCAYO (EDICIÓN MONUMENTAL WTA/ATP)
// Arquitectura Visual Oficial inspirada en wtatennis.com & atptour.com:
// - Splash 3D Interactivo, Perfil Hero Cuerpo Completo (Formato Elena Rybakina)
// - Head-to-Head Monumental Bicolor (Formato Sabalenka vs Rybakina + Swap Player)
// - Tabla de Ranking WTA con Números Condensados Gigantes y Halo en TU Posición
// - Economía de Gemas (💎), Test Didáctico Anti-Mentirosos, Equilibrio Senior +40
// - MatchPoint Vision IA (SwingVision) y Suite Admin CMS Total
// ============================================================================
// === INICIO DEL BLOQUE 1 DE 12 ===

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ============================================================================
// 1. MOTOR DE PERSISTENCIA SÍNCRONA EN DISCO + SUPABASE + SUBIDA DE FOTOS
// ============================================================================
const STORAGE_PREFIX = "mp_huancayo_wta_v5_";

export function usePersistentState(key, initialValue) {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null && raw !== "undefined") {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback seguro si el navegador restringe localStorage
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignorar si supera cuota local
    }
  }, [storageKey, state]);

  return [state, setState];
}

// Convierte cualquier foto subida desde el celular/PC a DataURL comprimida para persistencia real
export function readAndCompressImageFile(file, maxWidth = 900, quality = 0.84) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No se seleccionó imagen"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "";
const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || "";

export async function syncWithSupabase(table, payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// 2. LOS 4 ATUENDOS / TEMAS GRAND SLAM PARA EL PERFIL Y FONDO DE CANCHA
// ============================================================================
export const GRAND_SLAM_THEMES = [
  {
    id: "wta_finals",
    name: "WTA Finals (Púrpura & Esmeralda)",
    shortName: "WTA Finals",
    surfaceLabel: "Indoor Championship",
    unlockElo: 0,
    gemCost: 0,
    heroGradient: "linear-gradient(135deg, #1E0734 0%, #2B0948 52%, #130424 100%)",
    accentColor: "#00DC7D",
    secondaryAccent: "#D6FF00",
    courtLineColor: "rgba(255, 255, 255, 0.16)",
    cardGlassBg: "rgba(46, 14, 79, 0.68)",
    cardGlassBorder: "rgba(0, 220, 125, 0.38)",
    badgeText: "#0A1633",
  },
  {
    id: "roland_garros",
    name: "Roland Garros (Tierra Batida París)",
    shortName: "Roland Garros",
    surfaceLabel: "Polvo de Ladrillo · Clay",
    unlockElo: 1200,
    gemCost: 100,
    heroGradient: "linear-gradient(135deg, #3D160B 0%, #682714 52%, #240C05 100%)",
    accentColor: "#FDE68A",
    secondaryAccent: "#E07A5F",
    courtLineColor: "rgba(253, 230, 138, 0.20)",
    cardGlassBg: "rgba(64, 23, 12, 0.72)",
    cardGlassBorder: "rgba(253, 230, 138, 0.42)",
    badgeText: "#240C05",
  },
  {
    id: "wimbledon",
    name: "Wimbledon (Césped Sagrado Londres)",
    shortName: "Wimbledon",
    surfaceLabel: "Grass Court · Londres",
    unlockElo: 2000,
    gemCost: 150,
    heroGradient: "linear-gradient(135deg, #062919 0%, #0E472D 52%, #1D0B30 100%)",
    accentColor: "#00FF95",
    secondaryAccent: "#FDE68A",
    courtLineColor: "rgba(255, 255, 255, 0.22)",
    cardGlassBg: "rgba(8, 45, 28, 0.72)",
    cardGlassBorder: "rgba(0, 255, 149, 0.40)",
    badgeText: "#062919",
  },
  {
    id: "us_open",
    name: "US Open / ATP Electric (Arthur Ashe)",
    shortName: "US Open Electric",
    surfaceLabel: "Hardcourt Azul Eléctrico",
    unlockElo: 2750,
    gemCost: 200,
    heroGradient: "linear-gradient(135deg, #041B4D 0%, #003899 52%, #05112E 100%)",
    accentColor: "#D6FF00",
    secondaryAccent: "#00B4FF",
    courtLineColor: "rgba(0, 180, 255, 0.24)",
    cardGlassBg: "rgba(6, 30, 82, 0.72)",
    cardGlassBorder: "rgba(214, 255, 0, 0.45)",
    badgeText: "#041B4D",
  },
];

// ============================================================================
// 3. SISTEMA DE DISEÑO GLOBAL WTA / ATP: TIPOGRAFÍA GRANDE Y ANIMACIONES VIVAS
// ============================================================================
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Antonio:wght@600;700&family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');

  /* TEMA OSCURO (WTA FINALS & ATP NIGHT SESSION — PROFUNDO, VIBRANTE Y TEXTURIZADO) */
  :root {
    --wta-emerald: #00DC7D;
    --wta-emerald-soft: rgba(0, 220, 125, 0.16);
    --wta-mint-grad: linear-gradient(180deg, #1AE68A 0%, #72F2B8 46%, #EEFBF4 100%);
    --wta-purple-deep: #1E0734;
    --wta-purple-card: #260A40;
    --volt: #D6FF00;
    --electric: #0091FF;
    --electric-deep: #0052CC;
    --clay: #E07A5F;
    --clay-bg: rgba(224, 122, 95, 0.16);
    --clay-border: rgba(224, 122, 95, 0.42);
    --gold: #F59E0B;
    --gold-metallic: #D4AF37;
    --gold-bg: rgba(245, 158, 11, 0.16);
    --gold-border: rgba(245, 158, 11, 0.45);
    --silver: #CBD5E1;
    --bronze: #CD7F32;
    --emerald: #00DC7D;
    --emerald-bg: rgba(0, 220, 125, 0.16);
    --purple-slam: #A855F7;
    --crimson: #F43F5E;

    --bg-base: #0A0E1A;
    --bg-court-pattern: radial-gradient(circle at 50% 0%, rgba(0, 145, 255, 0.14) 0%, rgba(30, 7, 52, 0.28) 45%, #080C17 100%);
    --bg-card: #121A2E;
    --bg-match-card: #1F0836;
    --bg-elevated: #19243E;
    --bg-subtle: rgba(255, 255, 255, 0.06);
    --bg-input: #0D1425;
    --text-main: #FFFFFF;
    --text-secondary: #E2E8F0;
    --text-player: #38BDF8;
    --text-muted: #94A3B8;
    --border-hairline: rgba(255, 255, 255, 0.11);
    --border-strong: rgba(255, 255, 255, 0.22);
    --thermometer-fill: #00DC7D;
    --thermometer-track: rgba(255, 255, 255, 0.15);
    --modal-backdrop: rgba(6, 9, 20, 0.72);
    --modal-surface: #131C33;
    --notif-surface: #FAF9F5;
    --notif-text: #1B0930;
    --shadow-card: 0 14px 36px -10px rgba(0, 0, 0, 0.65);
  }

  /* TEMA CLARO (ATP ELECTRIC BLUE & WTA EDITORIAL — ALTO IMPACTO Y CERO VACÍO) */
  .theme-light {
    --wta-emerald: #00A859;
    --wta-emerald-soft: rgba(0, 168, 89, 0.14);
    --volt: #D6FF00;
    --electric: #0057FF;
    --electric-deep: #002868;
    --clay: #C85A32;
    --clay-bg: #FFF1EB;
    --clay-border: rgba(200, 90, 50, 0.36);
    --gold: #B45309;
    --gold-metallic: #B45309;
    --gold-bg: #FEF3C7;
    --gold-border: rgba(180, 83, 9, 0.38);
    --silver: #475569;
    --bronze: #9A3412;
    --emerald: #00A859;
    --emerald-bg: #E6F9F0;
    --purple-slam: #6B21A8;
    --crimson: #E11D48;

    --bg-base: #EEF3FA;
    --bg-court-pattern: linear-gradient(180deg, #E2ECFF 0%, #EEF3FA 45%, #F8FAFC 100%);
    --bg-card: #FFFFFF;
    --bg-match-card: #1F0836;
    --bg-elevated: #F1F6FF;
    --bg-subtle: #E8F0FE;
    --bg-input: #F4F7FC;
    --text-main: #001E50;
    --text-secondary: #1E293B;
    --text-player: #0057FF;
    --text-muted: #475569;
    --border-hairline: #D4E0F5;
    --border-strong: #94B4E8;
    --thermometer-fill: #0057FF;
    --thermometer-track: #CBD5E1;
    --modal-backdrop: rgba(0, 30, 80, 0.52);
    --modal-surface: #FFFFFF;
    --notif-surface: #FAF9F5;
    --notif-text: #1B0930;
    --shadow-card: 0 12px 30px -8px rgba(0, 40, 104, 0.14);
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
    background: var(--bg-base);
    color: var(--text-main);
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
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
    background: var(--bg-court-pattern);
    color: var(--text-main);
    transition: background 0.3s ease, color 0.25s ease;
  }

  /* Líneas vectoriales sutiles de cancha en el fondo de toda la app */
  .court-lines-bg {
    background-image:
      linear-gradient(to right, var(--border-hairline) 1px, transparent 1px),
      linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px);
    background-size: 64px 64px;
  }

  .app-scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding-bottom: 118px;
  }

  /* Blindaje Isla Dinámica iPhone 16 Pro Max */
  .safe-top-header {
    padding-top: max(env(safe-area-inset-top, 50px), 50px);
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 12px;
    background: var(--bg-card);
    border-bottom: 1.5px solid var(--border-hairline);
    z-index: 40;
    flex-shrink: 0;
  }

  .theme-light .safe-top-header {
    background: linear-gradient(90deg, #002868 0%, #0046B8 100%);
    color: #FFFFFF;
    border-bottom: 2px solid #0091FF;
  }

  .safe-bottom-bar {
    padding-bottom: max(env(safe-area-inset-bottom, 18px), 12px);
    background: var(--bg-card);
    border-top: 1.5px solid var(--border-hairline);
    z-index: 40;
    flex-shrink: 0;
  }

  /* Tipografía Condensada Monumental WTA (Elena Rybakina / Head to Head / Rankings) */
  .font-wta-condensed {
    font-family: 'Antonio', 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    line-height: 0.96;
  }

  .font-display {
    font-family: 'Outfit', sans-serif;
    letter-spacing: -0.015em;
  }

  .font-mono-code {
    font-family: 'JetBrains Mono', monospace;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  /* Desenfoque iOS y Animaciones Elásticas de Modales */
  .ios-blur-backdrop {
    background: var(--modal-backdrop);
    backdrop-filter: blur(22px) saturate(180%);
    -webkit-backdrop-filter: blur(22px) saturate(180%);
    animation: fadeBackdrop 0.24s ease-out forwards;
  }

  .ios-modal-card {
    background: var(--modal-surface);
    border: 1.5px solid var(--border-strong);
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.55);
    animation: modalPopElastic 0.34s cubic-bezier(0.18, 1.15, 0.32, 1) forwards;
  }

  /* Transiciones Vivas entre Pestañas */
  .view-transition {
    animation: viewSlideSpring 0.34s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes viewSlideSpring {
    0% { opacity: 0; transform: translateY(16px) scale(0.985); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes fadeBackdrop {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalPopElastic {
    0% { opacity: 0; transform: translateY(32px) scale(0.92); }
    70% { opacity: 1; transform: translateY(-4px) scale(1.01); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes pulseHalo {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0, 220, 125, 0.55), 0 0 22px rgba(0, 220, 125, 0.35); }
    50% { box-shadow: 0 0 0 6px rgba(0, 220, 125, 0), 0 0 32px rgba(214, 255, 0, 0.45); }
  }

  /* Halo Luminoso para TU Posición Actual en el Ranking */
  .my-rank-halo-row {
    animation: pulseHalo 2.6s infinite ease-in-out;
    border: 2px solid var(--wta-emerald) !important;
    position: relative;
  }

  /* Botones Interactivos con Relieve y Rebote Táctil */
  .touch-btn {
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    cursor: pointer;
    user-select: none;
    transition: transform 0.16s cubic-bezier(0.22, 1.3, 0.36, 1), box-shadow 0.2s ease, filter 0.18s ease;
  }
  .touch-btn:hover {
    filter: brightness(1.06);
    transform: translateY(-1px);
  }
  .touch-btn:active {
    transform: scale(0.93) !important;
  }

  .atp-card {
    background: var(--bg-card);
    border: 1.5px solid var(--border-hairline);
    box-shadow: var(--shadow-card);
    border-radius: 22px;
  }

  /* Tarjeta de Partido Estilo WTA Latest Matches (#1F0836 + Triángulo Esmeralda) */
  .wta-match-card {
    background: linear-gradient(145deg, #23083C 0%, #160428 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 22px;
    color: #FFFFFF;
    box-shadow: 0 14px 32px -8px rgba(18, 3, 34, 0.65);
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease;
  }
  .wta-match-card:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 220, 125, 0.45);
  }

  @keyframes float3D {
    0%, 100% { transform: translateY(0px) rotate(-4deg); }
    50% { transform: translateY(-12px) rotate(4deg); }
  }
  .float-3d-anim {
    animation: float3D 3.6s ease-in-out infinite;
  }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ============================================================================
// 4. PANTALLA DE CARGA INTERACTIVA 3D (SPLASH SCREEN CINEMATOGRÁFICO)
// ============================================================================
export const Interactive3DSplashScreen = ({ onFinishSplash }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(18);

  const slides = [
    {
      badge: "CIRCUITO OFICIAL HUANCAYO · 2026",
      title: "COMPITE COMO EN EL TOUR PROFESIONAL",
      subtitle:
        "Ranking ELO en tiempo real, estadísticas Head-to-Head estilo WTA/ATP y cuadros oficiales en las mejores canchas de arcilla.",
      accent: "#00DC7D",
    },
    {
      badge: "ECONOMÍA DE GEMAS & RECOMPENSAS",
      title: "CADA PARTIDO JUGADO SUMA GEMAS 💎",
      subtitle:
        "Ganes o pierdas, premiamos tu esfuerzo en cancha con Gemas canjeables por descuentos en torneos, pelotas y clases en Coach Pro.",
      accent: "#D6FF00",
    },
    {
      badge: "CARRERA AL MASTER TOP 8",
      title: "CLASIFICA AL TORNEO DE MAESTROS",
      subtitle:
        "Los 8 mejores de cada categoría avanzan al Master de Fin de Temporada con cobertura multimedia y análisis por IA.",
      accent: "#00B4FF",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 4 : 100));
    }, 90);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = slides[slideIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(circle at 50% 25%, #2D0B4E 0%, #0D152C 58%, #050811 100%)",
        color: "#FFFFFF",
      }}
    >
      {/* Escenario Vectorial 3D de Cancha de Tenis en Perspectiva */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-35">
        <svg
          viewBox="0 0 800 600"
          className="w-[130%] max-w-none h-auto"
          style={{
            transform: "perspective(650px) rotateX(58deg) translateY(80px)",
          }}
        >
          <rect
            x="100"
            y="60"
            width="600"
            height="480"
            fill="none"
            stroke={currentSlide.accent}
            strokeWidth="4"
          />
          <line x1="175" y1="60" x2="175" y2="540" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="625" y1="60" x2="625" y2="540" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="175" y1="180" x2="625" y2="180" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="175" y1="420" x2="625" y2="420" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="400" y1="180" x2="400" y2="420" stroke="#FFFFFF" strokeWidth="2.5" />
          <line
            x1="80"
            y1="300"
            x2="720"
            y2="300"
            stroke={currentSlide.accent}
            strokeWidth="5"
            strokeDasharray="10 6"
          />
        </svg>
      </div>

      {/* Cabecera del Splash */}
      <div className="relative z-10 flex items-center justify-between pt-6 max-w-md mx-auto w-full">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center font-wta-condensed text-2xl font-bold"
            style={{
              background: currentSlide.accent,
              color: "#0A1633",
              boxShadow: `0 0 24px ${currentSlide.accent}`,
            }}
          >
            MP
          </div>
          <div>
            <div className="font-wta-condensed text-2xl tracking-wider text-white">
              MATCHPOINT
            </div>
            <div className="text-xs font-bold tracking-widest uppercase text-emerald-400">
              HUANCAYO TOUR
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onFinishSplash}
          className="touch-btn px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/10 border border-white/20 text-white"
        >
          Entrar directo →
        </button>
      </div>

      {/* Centro Interactivo 3D + Diapositiva Activa */}
      <div className="relative z-10 max-w-md mx-auto w-full my-auto space-y-6 text-center py-4">
        {/* Esfera 3D + Pelota y Raqueta Orbitando */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: currentSlide.accent }}
          />
          <div
            className="w-36 h-36 rounded-full flex items-center justify-center relative float-3d-anim"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(0,220,125,0.18) 60%, rgba(10,22,51,0.9))",
              border: `2px solid ${currentSlide.accent}`,
              boxShadow: `0 20px 50px rgba(0, 220, 125, 0.35)`,
            }}
          >
            <img
              src="/assets/pelota-3d-volt-azul.png"
              alt="Tenis 3D"
              className="w-24 h-24 object-contain drop-shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Contenido de la Diapositiva */}
        <div key={slideIndex} className="view-transition space-y-3 px-2">
          <span
            className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{
              background: currentSlide.accent,
              color: "#0A1633",
            }}
          >
            {currentSlide.badge}
          </span>

          <h1
            className="font-wta-condensed text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: "#FFFFFF" }}
          >
            {currentSlide.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Indicadores de Diapositiva Interactivos */}
        <div className="flex items-center justify-center gap-2.5 pt-2">
          {slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSlideIndex(idx)}
              className="h-2.5 rounded-full transition-all duration-300"
              style={{
                width: slideIndex === idx ? 36 : 10,
                background:
                  slideIndex === idx
                    ? currentSlide.accent
                    : "rgba(255,255,255,0.25)",
              }}
              aria-label={`Diapositiva ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Pie del Splash: Barra de Carga + Botón de Acción */}
      <div className="relative z-10 max-w-md mx-auto w-full space-y-3 pb-4">
        <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progress}%`,
              background: currentSlide.accent,
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {slideIndex < slides.length - 1 ? (
            <>
              <button
                type="button"
                onClick={() => setSlideIndex((i) => i + 1)}
                className="touch-btn py-3.5 rounded-2xl font-display font-extrabold text-sm border border-white/25 bg-white/10 text-white"
              >
                Siguiente Slide →
              </button>
              <button
                type="button"
                onClick={onFinishSplash}
                className="touch-btn py-3.5 rounded-2xl font-display font-extrabold text-sm uppercase tracking-wider"
                style={{
                  background: currentSlide.accent,
                  color: "#0A1633",
                }}
              >
                Ingresar al Tour
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onFinishSplash}
              className="col-span-2 touch-btn py-4 rounded-2xl font-display font-black text-base uppercase tracking-wider shadow-xl"
              style={{
                background: "#00DC7D",
                color: "#0A1633",
                boxShadow: "0 10px 30px rgba(0, 220, 125, 0.4)",
              }}
            >
              Ingresar al Circuito Oficial →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. MODAL DE CELEBRACIÓN Y PREMIACIÓN DE GEMAS (VICTORIA / ESFUERZO / ASCENSO)
// ============================================================================
export const CelebrationRewardModal = ({
  celebrationData,
  onClose,
  onOpenStoryPoster,
  onOpenProShop,
}) => {
  if (!celebrationData) return null;

  const {
    title = "¡PARTIDO REGISTRADO!",
    subtitle = "Tu progreso y tus Gemas han sido acreditados",
    gemsEarned = 50,
    eloDelta = 0,
    isWin = true,
    customBannerText = "",
    matchRecord = null,
  } = celebrationData;

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl p-6 text-center space-y-5 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #1E0734 0%, #0F172A 60%, #09261E 100%)",
          color: "#FFFFFF",
          border: "2px solid #00DC7D",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-24 h-24 mx-auto rounded-3xl bg-white/10 border border-emerald-400/40 flex items-center justify-center overflow-hidden float-3d-anim">
          <img
            src={
              isWin
                ? "/assets/gif-celebracion-1.gif"
                : "/assets/pelota-3d-volt-azul.png"
            }
            alt="Celebración"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="space-y-1.5">
          <span
            className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{
              background: isWin ? "#00DC7D" : "#D6FF00",
              color: "#0A1633",
            }}
          >
            {isWin ? "🏆 VICTORIA OFICIAL" : "💪 ESFUERZO EN CANCHA PREMIADO"}
          </span>
          <h2 className="font-wta-condensed text-4xl font-bold pt-1">
            {title}
          </h2>
          <p className="text-sm text-slate-300">{subtitle}</p>
        </div>

        {/* Cajas de Recompensa: Puntos + Gemas MatchPoint */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3.5 bg-white/10 border border-white/15">
            <div className="text-xs font-bold uppercase text-slate-300">
              Ajuste Ranking
            </div>
            <div
              className="font-wta-condensed text-3xl font-bold mt-1"
              style={{ color: eloDelta >= 0 ? "#00DC7D" : "#38BDF8" }}
            >
              {eloDelta > 0 ? `+${eloDelta} PTS` : eloDelta === 0 ? "H2H" : `${eloDelta} PTS`}
            </div>
          </div>

          <div
            className="rounded-2xl p-3.5 border"
            style={{
              background: "rgba(0, 220, 125, 0.16)",
              borderColor: "#00DC7D",
            }}
          >
            <div className="text-xs font-bold uppercase text-emerald-300">
              Recompensa
            </div>
            <div className="font-wta-condensed text-3xl font-bold text-white mt-1">
              +{gemsEarned} 💎 GEMAS
            </div>
          </div>
        </div>

        {/* Anuncio Personalizado Inteligente según Victoria o Derrota */}
        {customBannerText && (
          <div className="rounded-2xl p-4 text-left bg-black/35 border border-white/15 space-y-2">
            <div className="text-xs font-extrabold uppercase text-amber-300">
              Recomendación Personalizada para Ti
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {customBannerText}
            </p>
            {onOpenProShop && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProShop();
                }}
                className="text-xs font-extrabold underline text-emerald-400"
              >
                Ir a Tienda de Canje de Gemas →
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {matchRecord && onOpenStoryPoster && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStoryPoster(matchRecord);
              }}
              className="touch-btn py-3 rounded-xl font-display font-extrabold text-xs uppercase bg-white/15 text-white border border-white/25"
            >
              Descargar Story 9:16
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`touch-btn py-3 rounded-xl font-display font-extrabold text-sm uppercase ${
              matchRecord ? "" : "col-span-2"
            }`}
            style={{ background: "#00DC7D", color: "#0A1633" }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};


// === FIN DEL BLOQUE 1 DE 12 ===

// === INICIO DEL BLOQUE 2 DE 12 ===

// ============================================================================
// 6. LIBRERÍA COMPLETA DE ICONOS VECTORIALES SVG (ALTA NITIDEZ)
// ============================================================================
export const Icons = {
  Menu: ({ size = 22, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="16" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Newspaper: ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
  Bag: ({ size = 17, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Gem: ({ size = 17, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 3h12l4 6-10 12L2 9l4-6Zm3.5 2L7 8.5h10L14.5 5h-5ZM4.8 10.5 11 18v-7.5H4.8Zm8.2 0V18l6.2-7.5H13Z" />
    </svg>
  ),
  Camera: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Swap: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  ),
  Users: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Video: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  ),
  Search: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Settings: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
  Close: ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  Check: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  MapPin: ({ size = 17, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Trophy: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Calendar: ({ size = 17, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  Clock: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Lock: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  Play: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  Share: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  ),
  Star: ({ size = 15, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Sun: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  Moon: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  Swords: ({ size = 17, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" x2="19" y1="19" y2="13" />
      <line x1="16" x2="20" y1="16" y2="20" />
      <line x1="19" x2="21" y1="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" x2="9" y1="14" y2="18" />
      <line x1="7" x2="4" y1="17" y2="20" />
      <line x1="3" x2="5" y1="19" y2="21" />
    </svg>
  ),
  Plus: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  ),
  Edit: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  Trash: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
};

// ============================================================================
// 7. COMPONENTES VISUALES <SafeImage />, <WtaEmeraldPortrait /> Y <LaurelAvatar />
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
          background: "linear-gradient(135deg, #00DC7D 0%, #059669 100%)",
          color: "#0A1633",
          fontWeight: 900,
          fontSize: "0.85rem",
          border: "1.5px solid rgba(255, 255, 255, 0.35)",
          borderRadius: circular ? "9999px" : "14px",
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
        objectPosition: "top center",
        borderRadius: circular ? "9999px" : undefined,
        ...style,
      }}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

// Retrato Cuadrado Redondeado sobre Fondo Verde Esmeralda Vibrante (#00DC7D)
// + Botón Circular Superpuesto a la Derecha (Formato Oficial WTA Rankings image_5c65c1.png)
export const WtaEmeraldPortrait = ({
  src,
  name,
  rank,
  size = 58,
  onQuickAction,
  isBoss = false,
}) => {
  const medalStroke =
    rank === 1
      ? "#F59E0B"
      : rank === 2
      ? "#CBD5E1"
      : rank === 3
      ? "#CD7F32"
      : isBoss
      ? "#A855F7"
      : "#00DC7D";

  return (
    <div
      className="relative inline-flex items-center flex-shrink-0 select-none"
      style={{ width: size + 16, height: size }}
    >
      <div
        className="relative overflow-hidden shadow-md"
        style={{
          width: size,
          height: size,
          borderRadius: 15,
          background:
            rank === 1
              ? "linear-gradient(145deg, #FDE68A 0%, #00DC7D 65%, #059669 100%)"
              : "linear-gradient(145deg, #00FF95 0%, #00DC7D 65%, #047857 100%)",
          border: `2px solid ${medalStroke}`,
        }}
      >
        <SafeImage
          src={src}
          alt={name}
          fallbackText={name}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 13,
          }}
        />
      </div>

      {/* Botón Circular Superpuesto al Borde Derecho estilo WTA */}
      {onQuickAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction();
          }}
          className="touch-btn absolute -right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          style={{
            minHeight: 32,
            background: "#EFEBF5",
            color: "#1E0734",
            border: "1.5px solid rgba(30, 7, 52, 0.16)",
          }}
          title={`Comparar o retar a ${name}`}
        >
          <Icons.Swords size={14} />
        </button>
      )}
    </div>
  );
};

// Avatar con Ramas de Laurel (Oro #1, Plata #2, Bronce #3)
export const LaurelAvatar = ({ src, name, rank, size = 48 }) => {
  const medalConfig = useMemo(() => {
    if (rank === 1) {
      return { stroke: "#F59E0B", glow: "rgba(245, 158, 11, 0.38)" };
    }
    if (rank === 2) {
      return { stroke: "#CBD5E1", glow: "rgba(203, 213, 225, 0.30)" };
    }
    if (rank === 3) {
      return { stroke: "#CD7F32", glow: "rgba(205, 127, 50, 0.32)" };
    }
    return null;
  }, [rank]);

  const outerSize = size + 16;

  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: outerSize, height: outerSize }}
    >
      {medalConfig && (
        <svg
          width={outerSize}
          height={outerSize}
          viewBox="0 0 64 64"
          className="absolute inset-0 pointer-events-none"
          style={{ filter: `drop-shadow(0 0 6px ${medalConfig.glow})` }}
        >
          <circle cx="32" cy="32" r="24" fill="none" stroke={medalConfig.stroke} strokeWidth="2.3" />
          <path d="M32 58 C16 56, 6 44, 6 28 C6 17, 13 9, 22 6" fill="none" stroke={medalConfig.stroke} strokeWidth="2.1" strokeLinecap="round" />
          <ellipse cx="9" cy="38" rx="2.2" ry="4" transform="rotate(-25 9 38)" fill={medalConfig.stroke} />
          <ellipse cx="7" cy="28" rx="2.2" ry="4" transform="rotate(-5 7 28)" fill={medalConfig.stroke} />
          <ellipse cx="10" cy="18" rx="2.2" ry="4" transform="rotate(20 10 18)" fill={medalConfig.stroke} />
          <ellipse cx="16" cy="10" rx="2" ry="3.6" transform="rotate(42 16 10)" fill={medalConfig.stroke} />
          <path d="M32 58 C48 56, 58 44, 58 28 C58 17, 51 9, 42 6" fill="none" stroke={medalConfig.stroke} strokeWidth="2.1" strokeLinecap="round" />
          <ellipse cx="55" cy="38" rx="2.2" ry="4" transform="rotate(25 55 38)" fill={medalConfig.stroke} />
          <ellipse cx="57" cy="28" rx="2.2" ry="4" transform="rotate(5 57 28)" fill={medalConfig.stroke} />
          <ellipse cx="54" cy="18" rx="2.2" ry="4" transform="rotate(-20 54 18)" fill={medalConfig.stroke} />
          <ellipse cx="48" cy="10" rx="2" ry="3.6" transform="rotate(-42 48 10)" fill={medalConfig.stroke} />
        </svg>
      )}
      <SafeImage
        src={src}
        alt={name}
        fallbackText={name}
        circular
        style={{
          width: size,
          height: size,
          border: medalConfig ? "none" : "2px solid var(--border-strong)",
        }}
      />
    </div>
  );
};

// ============================================================================
// 8. MAPA COMPLETO DE LOS 42 ARCHIVOS SUBIDOS A GITHUB (public/assets/)
// ============================================================================
export const ASSETS = {
  logo: "/assets/logo-matchpoint.png",
  navPerfil: "/assets/nav-perfil.png",
  navRanking: "/assets/nav-ranking.png",
  navRetos: "/assets/nav-retos.png",
  navSedes: "/assets/nav-sedes.png",
  navTorneos: "/assets/nav-torneos.png",

  clubCountry: "/assets/club-country-huancas.png",
  clubTauro: "/assets/club-tauro.png",
  clubCutipa: "/assets/club-romina-cutipa.png",
  clubInkas: "/assets/club-los-inkas.png",

  pelotaVoltAzul: "/assets/pelota-3d-volt-azul.png",
  pelotaClasica: "/assets/pelota-3d-clasica.png",
  raquetaProDark: "/assets/raqueta-3d-pro.png",
  raquetaOscuraLight: "/assets/raqueta-3d-oscura.png",

  climaSeco: "/assets/canva-clima-seco.png",
  climaHumedad: "/assets/canva-clima-humedad.png",
  climaLlovizna: "/assets/canva-clima-llovizna.png",
  climaLluvia: "/assets/canva-clima-lluvia.png",

  goldenTicket: "/assets/canva-golden-ticket.png",
  proshopRollo: "/assets/canva-proshop-rollo.png",
  escudoCoach: "/assets/canva-escudo-coach.png",
  fuegoRacha3d: "/assets/fuego-racha-3d.png",
  badgeFavorito: "/assets/badge-favorito.png",

  cancha1: "/assets/cancha-1.png",
  poolFuegoClasico: "/assets/pool-fuego-clasico.png",
  poolRaquetaPelota: "/assets/pool-raqueta-pelota.png",
  poolTenistaAccion: "/assets/pool-tenista-accion.png",
  raquetasCruzadasBlancas: "/assets/raquetas-cruzadas-blancas.png",
  raquetasCruzadasNegras: "/assets/raquetas-cruzadas-negras.png",
  siluetaDerechaNegra: "/assets/silueta-derecha-negra.png",
  siluetaSaqueBlanca: "/assets/silueta-saque-blanca.png",
  siluetaSaqueNegra: "/assets/silueta-saque-negra.png",

  gifVictoriaReto: "/assets/gif-celebracion-1.gif",
  gifAscensoCampeon: "/assets/gif-celebracion-2.gif",

  videoCoachRodrigo: "/assets/video-coach-rodrigo.mp4",
  videoCoachRomina: "/assets/video-coach-romina.mp4",
  videoCoachDemo3: "/assets/video-coach-demo-3.mp4",
  videoCoachDemo4: "/assets/video-coach-demo-4.mp4",
  videoCircuitoH1: "/assets/video-circuito-horizontal.mp4",
  videoCoachH2: "/assets/video-coach-horizontal-2.mp4",
  videoCircuitoH3: "/assets/video-horizontal-3.mp4",
  videoCircuitoH4: "/assets/video-horizontal-4.mp4",
};

// ============================================================================
// 9. ESCALERA PROGRESIVA + CHECKPOINTS MERECIDOS + CLASIFICACIÓN MASTER TOP 8
// ============================================================================
export const CATEGORIES_PROGRESSIVE = [
  {
    id: "5P",
    name: "5ª Principiante",
    short: "5ª P",
    min: 0,
    max: 499,
    floor: 100,
    seedFloor: 150,
    checkpoint: null,
    checkpointLabel: null,
    color: "#64748B",
    bg: "rgba(100, 116, 139, 0.18)",
    border: "rgba(100, 116, 139, 0.42)",
  },
  {
    id: "5B",
    name: "5ª Básica",
    short: "5ª B",
    min: 500,
    max: 1199,
    floor: 500,
    seedFloor: 500,
    checkpoint: null,
    checkpointLabel: null,
    color: "#0284C7",
    bg: "rgba(2, 132, 199, 0.18)",
    border: "rgba(2, 132, 199, 0.42)",
  },
  {
    id: "5A",
    name: "5ª Avanzada",
    short: "5ª A",
    min: 1200,
    max: 1999,
    floor: 1200,
    seedFloor: 1200,
    checkpoint: null,
    checkpointLabel: null,
    color: "#00DC7D",
    bg: "rgba(0, 220, 125, 0.16)",
    border: "rgba(0, 220, 125, 0.42)",
  },
  {
    id: "4TA",
    name: "4ª Categoría",
    short: "4ª Cat",
    min: 2000,
    max: 3499,
    floor: 2000,
    seedFloor: 2000,
    checkpoint: 2750,
    checkpointLabel: "4ª Alta (2,750)",
    color: "#E07A5F",
    bg: "rgba(224, 122, 95, 0.18)",
    border: "rgba(224, 122, 95, 0.44)",
  },
  {
    id: "3RA",
    name: "3ª Categoría",
    short: "3ª Cat",
    min: 3500,
    max: 4999,
    floor: 3500,
    seedFloor: 3350,
    checkpoint: 4250,
    checkpointLabel: "3ª Élite (4,250)",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.18)",
    border: "rgba(245, 158, 11, 0.45)",
  },
  {
    id: "2DA",
    name: "2ª Categoría / Libre",
    short: "2ª Libre",
    min: 5000,
    max: 99999,
    floor: 5000,
    seedFloor: 4200,
    checkpoint: null,
    checkpointLabel: null,
    color: "#A855F7",
    bg: "rgba(168, 85, 247, 0.18)",
    border: "rgba(168, 85, 247, 0.45)",
  },
];

export function getCategoryByElo(elo, seasonMatchesPlayed = 5) {
  const safeElo = Math.max(100, Math.round(Number(elo) || 150));
  const currentCat =
    CATEGORIES_PROGRESSIVE.find((c) => safeElo >= c.min && safeElo <= c.max) ||
    CATEGORIES_PROGRESSIVE[CATEGORIES_PROGRESSIVE.length - 1];

  const currentIndex = CATEGORIES_PROGRESSIVE.findIndex((c) => c.id === currentCat.id);
  const nextCat =
    currentIndex + 1 < CATEGORIES_PROGRESSIVE.length
      ? CATEGORIES_PROGRESSIVE[currentIndex + 1]
      : null;

  const bandWidth = currentCat.id === "2DA" ? 1000 : currentCat.max - currentCat.min + 1;
  const pointsInBand = Math.min(bandWidth, Math.max(0, safeElo - currentCat.min));
  const pointsToNextCategory = nextCat ? Math.max(0, nextCat.min - safeElo) : 0;

  const nextMilestoneTarget =
    currentCat.checkpoint && safeElo < currentCat.checkpoint
      ? currentCat.checkpoint
      : nextCat
      ? nextCat.min
      : safeElo;

  const nextMilestoneLabel =
    currentCat.checkpoint && safeElo < currentCat.checkpoint
      ? `Checkpoint ${currentCat.checkpointLabel}`
      : nextCat
      ? nextCat.name
      : "Cima del Circuito";

  const pointsToNextMilestone = Math.max(0, nextMilestoneTarget - safeElo);

  const levelProgressPct =
    currentCat.id === "2DA"
      ? 100
      : Math.min(100, Math.max(4, Math.round((pointsInBand / bandWidth) * 100)));

  const reachedCheckpoint =
    currentCat.checkpoint !== null && safeElo >= currentCat.checkpoint;
  const consolidatedCheckpoint = reachedCheckpoint && seasonMatchesPlayed >= 4;
  const activeSeasonFloor = consolidatedCheckpoint
    ? currentCat.checkpoint
    : currentCat.floor;

  return {
    ...currentCat,
    nextCat,
    bandWidth,
    pointsInBand,
    pointsToNextCategory,
    nextMilestoneTarget,
    nextMilestoneLabel,
    pointsToNextMilestone,
    levelProgressPct,
    reachedCheckpoint,
    consolidatedCheckpoint,
    activeSeasonFloor,
  };
}

export function applySeasonResetToPlayer(player) {
  const seasonMatches = Number(player.seasonMatches ?? (player.wins || 0) + (player.losses || 0));
  const catInfo = getCategoryByElo(player.elo, seasonMatches);
  return {
    ...player,
    previousSeasonElo: player.elo,
    elo: catInfo.activeSeasonFloor,
    seasonMatches: 0,
  };
}

// ============================================================================
// 10. MOTOR MATEMÁTICO ELO + EQUILIBRIO SENIOR (+40) + DESAFÍO AL BOSS + GEMAS
// ============================================================================
export const ELO_CONSTANTS = {
  DIVISOR: 2200,
  K_REGULAR: 300,
  K_CALIBRATION: 480,
  CALIBRATION_MATCHES: 5,
  MAX_OFFICIAL_GAP: 1000,
  MIN_FLOOR_ELO: 100,
  MIN_SEASON_MATCHES_TOP8: 4,
  WALKOVER_FIXED_DELTA: 25,
  RETIREMENT_WIN_FACTOR: 0.75,
  AUTO_CONFIRM_HOURS: 24,
  // Equilibrio Senior (+40 años frente a Sub-30)
  SENIOR_AGE_THRESHOLD: 40,
  SENIOR_WIN_BONUS_MULT: 1.10, // +10% mérito físico al vencer a un Sub-30
  SENIOR_LOSS_PROTECTION_MULT: 0.88, // -12% amortiguación de caída ante un Sub-30
  // Economía de Gemas MatchPoint (💎)
  GEMS_WIN_MATCH: 50,
  GEMS_EFFORT_PLAYED: 25, // Se gana por terminar el partido aunque caigas
  GEMS_BOSS_CHALLENGE_BONUS: 100,
  GEMS_WEATHER_REPORT: 5,
};

export function getEffectiveK(player, totalActivePlayers = 130) {
  const calibPlayed = Number(player?.calibrationMatches ?? 5);
  const baseK =
    calibPlayed < ELO_CONSTANTS.CALIBRATION_MATCHES
      ? ELO_CONSTANTS.K_CALIBRATION
      : ELO_CONSTANTS.K_REGULAR;

  if (totalActivePlayers <= 150) return baseK;
  const scaleFactor = Math.min(1.18, Math.max(0.9, Math.pow(totalActivePlayers / 130, 0.08)));
  return Math.round(baseK * scaleFactor);
}

export function getPairRematchStatus(playerAId, playerBId, completedMatches = []) {
  if (!playerAId || !playerBId) {
    return { weeklyCount: 0, monthlyCount: 0, multiplier: 1.0, forcedFriendlyByCap: false };
  }
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  let weeklyCount = 0;
  let monthlyCount = 0;

  completedMatches.forEach((m) => {
    if (m.status !== "completed" && !m.score) return;
    if (m.isFriendly) return;
    const samePair =
      (m.challengerId === playerAId && m.challengedId === playerBId) ||
      (m.challengerId === playerBId && m.challengedId === playerAId);
    if (!samePair) return;

    const ts = m.completedAt || m.createdAt || now;
    if (now - ts <= sevenDaysMs) weeklyCount += 1;
    if (now - ts <= thirtyDaysMs) monthlyCount += 1;
  });

  if (monthlyCount >= 3) {
    return {
      weeklyCount,
      monthlyCount,
      multiplier: 0,
      forcedFriendlyByCap: true,
      label: "Tope mensual alcanzado (3/3 oficiales este mes) · Modo Exhibición H2H",
    };
  }

  let multiplier = 1.0;
  if (weeklyCount === 1) multiplier = 0.75;
  else if (weeklyCount >= 2) multiplier = 0.5;

  return {
    weeklyCount,
    monthlyCount,
    multiplier,
    forcedFriendlyByCap: false,
    label:
      multiplier === 1
        ? "100% de puntos oficiales"
        : `Revancha semanal #${weeklyCount + 1} (${Math.round(multiplier * 100)}% de puntos)`,
  };
}

// Calculadora Pre-Partido: Rangos Deportivos (Sin Verde/Rojo Bolsa de Valores),
// Detección de "Desafío al Boss" y Equilibrio Senior (+40 años)
export function getPreMatchThresholds(
  playerA,
  playerB,
  options = {
    forceFriendly: false,
    bossChallengeTicket: false,
    completedMatches: [],
    totalActivePlayers: 130,
  }
) {
  if (!playerA || !playerB) {
    return {
      isFriendly: false,
      isBossMatch: false,
      seniorBalanceActive: false,
      eloGap: 0,
      expectedA: 0.5,
      expectedB: 0.5,
      winCeilingA: 150,
      typicalWinA: 128,
      lossMaxA: -150,
      typicalCloseLossA: -62,
      winCeilingB: 150,
      typicalWinB: 128,
      lossMaxB: -150,
      typicalCloseLossB: -62,
      rematchInfo: { multiplier: 1, forcedFriendlyByCap: false },
    };
  }

  const eloA = Number(playerA.elo || 1000);
  const eloB = Number(playerB.elo || 1000);
  const eloGap = Math.abs(eloA - eloB);

  const catA = getCategoryByElo(eloA);
  const catB = getCategoryByElo(eloB);

  // Detección de "Desafío al Boss" (Cuando un jugador reta a alguien con +500 pts o de categoría superior)
  const isBossMatch =
    Boolean(options.bossChallengeTicket) ||
    (eloB - eloA >= 450 && eloB - eloA <= 1350) ||
    (eloA - eloB >= 450 && eloA - eloB <= 1350);

  // Detección de Equilibrio Senior (+40 años jugando contra Sub-30)
  const ageA = Number(playerA.age || 28);
  const ageB = Number(playerB.age || 28);
  const aIsSeniorVsYoung = ageA >= ELO_CONSTANTS.SENIOR_AGE_THRESHOLD && ageB < 32;
  const bIsSeniorVsYoung = ageB >= ELO_CONSTANTS.SENIOR_AGE_THRESHOLD && ageA < 32;
  const seniorBalanceActive = aIsSeniorVsYoung || bIsSeniorVsYoung;

  const rematchInfo = getPairRematchStatus(
    playerA.id,
    playerB.id,
    options.completedMatches || []
  );

  // Si es Desafío al Boss con racha o ticket, se permite hasta 1,350 pts de brecha
  const effectiveMaxGap = isBossMatch ? 1350 : ELO_CONSTANTS.MAX_OFFICIAL_GAP;
  const gapExceedsLimit = eloGap > effectiveMaxGap;
  const isFriendly =
    Boolean(options.forceFriendly) ||
    gapExceedsLimit ||
    rematchInfo.forcedFriendlyByCap;

  let friendlyReason = null;
  if (gapExceedsLimit) {
    friendlyReason = `Diferencia de ${eloGap} pts · Duelo de Exhibición H2H (Suma +25 💎 Gemas y cuenta en su Head-to-Head)`;
  } else if (rematchInfo.forcedFriendlyByCap) {
    friendlyReason = rematchInfo.label;
  } else if (options.forceFriendly) {
    friendlyReason = "Duelo Amistoso de Exhibición (+25 💎 Gemas por jugar)";
  }

  const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / ELO_CONSTANTS.DIVISOR));
  const expectedB = 1 - expectedA;

  if (isFriendly) {
    return {
      isFriendly: true,
      isBossMatch,
      seniorBalanceActive,
      gapExceedsLimit,
      friendlyReason,
      eloGap,
      expectedA,
      expectedB,
      winCeilingA: 0,
      typicalWinA: 0,
      lossMaxA: 0,
      typicalCloseLossA: 0,
      winCeilingB: 0,
      typicalWinB: 0,
      lossMaxB: 0,
      typicalCloseLossB: 0,
      rematchInfo,
    };
  }

  const kA = getEffectiveK(playerA, options.totalActivePlayers || 130);
  const kB = getEffectiveK(playerB, options.totalActivePlayers || 130);
  const mult = rematchInfo.multiplier;

  const seniorWinMultA = aIsSeniorVsYoung ? ELO_CONSTANTS.SENIOR_WIN_BONUS_MULT : 1.0;
  const seniorLossMultA = aIsSeniorVsYoung ? ELO_CONSTANTS.SENIOR_LOSS_PROTECTION_MULT : 1.0;

  const seniorWinMultB = bIsSeniorVsYoung ? ELO_CONSTANTS.SENIOR_WIN_BONUS_MULT : 1.0;
  const seniorLossMultB = bIsSeniorVsYoung ? ELO_CONSTANTS.SENIOR_LOSS_PROTECTION_MULT : 1.0;

  const winCeilingA = Math.max(
    18,
    Math.round(kA * (1 - expectedA) * mult * seniorWinMultA)
  );
  const typicalWinA = Math.max(15, Math.round(winCeilingA * 0.85));
  const lossMaxA = -Math.max(
    14,
    Math.round(kA * expectedA * mult * seniorLossMultA)
  );
  const typicalCloseLossA = Math.round(lossMaxA * 0.45); // En partido parejo a 3 sets solo resta ~45%

  const winCeilingB = Math.max(
    18,
    Math.round(kB * (1 - expectedB) * mult * seniorWinMultB)
  );
  const typicalWinB = Math.max(15, Math.round(winCeilingB * 0.85));
  const lossMaxB = -Math.max(
    14,
    Math.round(kB * expectedB * mult * seniorLossMultB)
  );
  const typicalCloseLossB = Math.round(lossMaxB * 0.45);

  return {
    isFriendly: false,
    isBossMatch,
    bossLabel: isBossMatch
      ? eloB > eloA
        ? `⚔️ Desafío al Boss (${catB.short}) · Bono +100 💎 si ganas sets`
        : `🛡️ Defensa de Rango ante ${playerB.name} · Bono +60 💎`
      : null,
    seniorBalanceActive,
    seniorLabel: seniorBalanceActive
      ? "Equilibrio Generacional (+40 Master activo: +10% mérito físico y protección de piso)"
      : null,
    gapExceedsLimit: false,
    friendlyReason: null,
    eloGap,
    expectedA,
    expectedB,
    winCeilingA,
    typicalWinA,
    lossMaxA,
    typicalCloseLossA,
    winCeilingB,
    typicalWinB,
    lossMaxB,
    typicalCloseLossB,
    rematchInfo,
  };
}

// ============================================================================
// 11. VALIDADOR OFICIAL ITF/ATP Y LAS 3 JAULAS FINITAS DE MARCADOR
// ============================================================================
export function evaluateRegularSetDominance(wGames, lGames, tbLoserPts = null) {
  if (wGames === 6 && lGames === 0) return 1.0;
  if (wGames === 6 && lGames === 1) return 0.96;
  if (wGames === 6 && lGames === 2) return 0.92;
  if (wGames === 6 && lGames === 3) return 0.88;
  if (wGames === 6 && lGames === 4) return 0.84;
  if (wGames === 7 && lGames === 5) return 0.8;

  if (wGames === 7 && lGames === 6) {
    const loserTb = tbLoserPts !== null && tbLoserPts !== "" ? Number(tbLoserPts) : 5;
    const winnerTb = loserTb >= 6 ? loserTb + 2 : 7;
    const tbDiff = Math.min(7, Math.max(2, winnerTb - loserTb));
    return Number((0.76 + ((tbDiff - 2) / 5) * 0.03).toFixed(4));
  }
  return 0.85;
}

export function validateAndEvaluateMatchScore(scoreInput) {
  const {
    s1A,
    s1B,
    tb1Loser,
    s2A,
    s2B,
    tb2Loser,
    stbA,
    stbB,
    specialFinish = "normal",
    retiredWinnerSide = "A",
  } = scoreInput || {};

  if (specialFinish === "walkover") {
    return {
      valid: true,
      specialFinish: "walkover",
      winnerSide: retiredWinnerSide,
      winnerFactor: 1,
      loserFactor: 1,
      isDoubleBagelOr61: false,
      loserWonAtLeast4GamesOrSet: false,
      formattedScore: "W.O. (Inasistencia)",
      setsSummary: "Walkover oficial",
    };
  }

  if (specialFinish === "retirement") {
    const partial = [];
    if (s1A !== "" && s1B !== "") partial.push(`${s1A}-${s1B}`);
    if (s2A !== "" && s2B !== "") partial.push(`${s2A}-${s2B}`);
    const partialText = partial.length > 0 ? `${partial.join(", ")} (Ret.)` : "Retiro en cancha";
    return {
      valid: true,
      specialFinish: "retirement",
      winnerSide: retiredWinnerSide,
      winnerFactor: ELO_CONSTANTS.RETIREMENT_WIN_FACTOR,
      loserFactor: 0.65,
      isDoubleBagelOr61: false,
      loserWonAtLeast4GamesOrSet: true,
      formattedScore: partialText,
      setsSummary: "Retiro por lesión (75% techo)",
    };
  }

  function validateSingleSet(aRaw, bRaw, tbLoserRaw, setNum) {
    if (aRaw === "" || bRaw === "" || aRaw === undefined || bRaw === undefined) {
      return { ok: false, error: `Ingresa los games del Set ${setNum}.` };
    }
    const a = Number(aRaw);
    const b = Number(bRaw);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      return { ok: false, error: `El Set ${setNum} debe tener números enteros válidos.` };
    }
    const maxG = Math.max(a, b);
    const minG = Math.min(a, b);

    const isRegular6 = maxG === 6 && minG >= 0 && minG <= 4;
    const is75 = maxG === 7 && minG === 5;
    const is76 = maxG === 7 && minG === 6;

    if (!isRegular6 && !is75 && !is76) {
      return {
        ok: false,
        error: `Marcador ${a}-${b} inválido en Set ${setNum}. Se gana con 6 games (6-0 a 6-4), 7-5 o 7-6 en Tie-Break.`,
      };
    }

    let tbLoser = null;
    if (is76) {
      tbLoser =
        tbLoserRaw === "" || tbLoserRaw === null || tbLoserRaw === undefined
          ? 5
          : Number(tbLoserRaw);
      if (!Number.isInteger(tbLoser) || tbLoser < 0) {
        return { ok: false, error: `Puntos del Tie-Break en Set ${setNum} inválidos.` };
      }
    }

    const winner = a > b ? "A" : "B";
    const dominance = evaluateRegularSetDominance(maxG, minG, tbLoser);
    const label = is76 ? `${a}-${b}(${tbLoser})` : `${a}-${b}`;

    return {
      ok: true,
      a,
      b,
      maxG,
      minG,
      is76,
      tbLoser,
      winner,
      dominance,
      label,
    };
  }

  const set1 = validateSingleSet(s1A, s1B, tb1Loser, 1);
  if (!set1.ok) return { valid: false, error: set1.error };

  const set2 = validateSingleSet(s2A, s2B, tb2Loser, 2);
  if (!set2.ok) return { valid: false, error: set2.error };

  if (set1.winner === set2.winner) {
    const winnerSide = set1.winner;
    const winnerFactor = Number(((set1.dominance + set2.dominance) / 2).toFixed(4));
    const loserFactor = Number((0.68 + ((winnerFactor - 0.76) / 0.24) * 0.32).toFixed(4));

    const totalLoserGames = set1.minG + set2.minG;
    const isDoubleBagelOr61 = totalLoserGames <= 1;

    return {
      valid: true,
      specialFinish: "normal",
      setsCount: 2,
      s1A: set1.a,
      s1B: set1.b,
      s2A: set2.a,
      s2B: set2.b,
      stbA: null,
      stbB: null,
      winnerSide,
      winnerFactor,
      loserFactor,
      isDoubleBagelOr61,
      loserWonAtLeast4GamesOrSet: totalLoserGames >= 6,
      formattedScore: `${set1.label}, ${set2.label}`,
      setsSummary: `Victoria en 2 sets (${Math.round(winnerFactor * 100)}% del tope)`,
    };
  }

  if (stbA === "" || stbB === "" || stbA === undefined || stbB === undefined) {
    return {
      valid: false,
      needsStb: true,
      error: "Empate a 1 set por lado: ingresa los puntos del Super Tie-Break (a 10 puntos con diferencia mínima de 2).",
    };
  }

  const aStb = Number(stbA);
  const bStb = Number(stbB);
  if (!Number.isInteger(aStb) || !Number.isInteger(bStb) || aStb < 0 || bStb < 0) {
    return { valid: false, error: "El Super Tie-Break debe tener números enteros." };
  }

  const maxStb = Math.max(aStb, bStb);
  const minStb = Math.min(aStb, bStb);
  const diffStb = maxStb - minStb;

  const validStb =
    (maxStb === 10 && minStb <= 8) || (maxStb > 10 && diffStb === 2);

  if (!validStb) {
    return {
      valid: false,
      error: `Super Tie-Break ${aStb}-${bStb} inválido. Se gana con 10 puntos (10-0 a 10-8) o diferencia exacta de 2 si empatan 9-9 o más (ej. 11-9, 13-11).`,
    };
  }

  const winnerSide = aStb > bStb ? "A" : "B";
  const clampedDiff = Math.min(10, Math.max(2, diffStb));
  const winnerFactor = Number((0.7 + ((clampedDiff - 2) / 8) * 0.05).toFixed(4));
  const loserFactor = Number((0.38 + ((clampedDiff - 2) / 8) * 0.12).toFixed(4));

  return {
    valid: true,
    specialFinish: "normal",
    setsCount: 3,
    s1A: set1.a,
    s1B: set1.b,
    s2A: set2.a,
    s2B: set2.b,
    stbA: aStb,
    stbB: bStb,
    winnerSide,
    winnerFactor,
    loserFactor,
    isDoubleBagelOr61: false,
    loserWonAtLeast4GamesOrSet: true,
    formattedScore: `${set1.label}, ${set2.label}, [${aStb}-${bStb}]`,
    setsSummary: `Definición en 3er Set Super TB (Perdedor protegido al ${Math.round(
      (1 - loserFactor) * 100
    )}%)`,
  };
}

export function calculateMatchEloSettlement({
  playerA,
  playerB,
  scoreEvaluation,
  forceFriendly = false,
  completedMatches = [],
  totalActivePlayers = 130,
}) {
  const pre = getPreMatchThresholds(playerA, playerB, {
    forceFriendly,
    completedMatches,
    totalActivePlayers,
  });

  if (pre.isFriendly) {
    return {
      isFriendly: true,
      friendlyReason: pre.friendlyReason,
      winnerSide: scoreEvaluation.winnerSide,
      deltaA: 0,
      deltaB: 0,
      newEloA: playerA.elo,
      newEloB: playerB.elo,
      gemsWinner: ELO_CONSTANTS.GEMS_EFFORT_PLAYED + 15,
      gemsLoser: ELO_CONSTANTS.GEMS_EFFORT_PLAYED,
    };
  }

  if (scoreEvaluation.specialFinish === "walkover") {
    const aWon = scoreEvaluation.winnerSide === "A";
    const rawDeltaA = aWon
      ? ELO_CONSTANTS.WALKOVER_FIXED_DELTA
      : -ELO_CONSTANTS.WALKOVER_FIXED_DELTA;
    const rawDeltaB = -rawDeltaA;
    const newEloA = Math.max(ELO_CONSTANTS.MIN_FLOOR_ELO, playerA.elo + rawDeltaA);
    const newEloB = Math.max(ELO_CONSTANTS.MIN_FLOOR_ELO, playerB.elo + rawDeltaB);

    return {
      isFriendly: false,
      winnerSide: scoreEvaluation.winnerSide,
      deltaA: newEloA - playerA.elo,
      deltaB: newEloB - playerB.elo,
      newEloA,
      newEloB,
      gemsWinner: 30,
      gemsLoser: 0,
    };
  }

  const aWon = scoreEvaluation.winnerSide === "A";
  const winnerPlayer = aWon ? playerA : playerB;
  const loserPlayer = aWon ? playerB : playerA;

  const winnerCeiling = aWon ? pre.winCeilingA : pre.winCeilingB;
  const loserMaxDrop = aWon ? pre.lossMaxB : pre.lossMaxA;

  let winnerGain = Math.round(winnerCeiling * scoreEvaluation.winnerFactor);
  let loserDrop = Math.round(loserMaxDrop * scoreEvaluation.loserFactor);

  // Acelerador Anti-Tiburones y Anti-Mentirosos en Calibración (1.35x si barre 6-0, 6-0)
  if (scoreEvaluation.isDoubleBagelOr61) {
    if ((winnerPlayer.calibrationMatches ?? 5) < ELO_CONSTANTS.CALIBRATION_MATCHES) {
      winnerGain = Math.round(winnerGain * 1.35);
    }
    if ((loserPlayer.calibrationMatches ?? 5) < ELO_CONSTANTS.CALIBRATION_MATCHES) {
      loserDrop = Math.round(loserDrop * 1.25);
    }
  }

  // Protección especial en "Desafío al Boss": si el retador de abajo dio pelea (ganó 1 set o >=6 games), casi no pierde puntos y cobra +100 Gemas
  let gemsWinner = ELO_CONSTANTS.GEMS_WIN_MATCH;
  let gemsLoser = ELO_CONSTANTS.GEMS_EFFORT_PLAYED;

  if (pre.isBossMatch) {
    const underdogLost = loserPlayer.elo < winnerPlayer.elo;
    if (underdogLost && scoreEvaluation.loserWonAtLeast4GamesOrSet) {
      loserDrop = Math.round(loserDrop * 0.35); // 65% de protección por desafiar al Boss y ganarle sets/games
      gemsLoser = ELO_CONSTANTS.GEMS_BOSS_CHALLENGE_BONUS;
    } else if (!underdogLost) {
      // ¡El retador derrotó al Boss!
      gemsWinner = ELO_CONSTANTS.GEMS_BOSS_CHALLENGE_BONUS + 50;
    } else {
      gemsWinner = 60; // El Boss defendió su trono
    }
  }

  const rawNewWinnerElo = winnerPlayer.elo + winnerGain;
  const rawNewLoserElo = Math.max(
    ELO_CONSTANTS.MIN_FLOOR_ELO,
    loserPlayer.elo + loserDrop
  );

  const actualWinnerDelta = rawNewWinnerElo - winnerPlayer.elo;
  const actualLoserDelta = rawNewLoserElo - loserPlayer.elo;

  return {
    isFriendly: false,
    isBossMatch: pre.isBossMatch,
    winnerSide: scoreEvaluation.winnerSide,
    deltaA: aWon ? actualWinnerDelta : actualLoserDelta,
    deltaB: aWon ? actualLoserDelta : actualWinnerDelta,
    newEloA: aWon ? rawNewWinnerElo : rawNewLoserElo,
    newEloB: aWon ? rawNewLoserElo : rawNewWinnerElo,
    gemsWinner,
    gemsLoser,
  };
}

// === FIN DEL BLOQUE 2 DE 12 ===

// === INICIO DEL BLOQUE 3 DE 12 ===

// ============================================================================
// 12. SEDES OFICIALES DE HUANCAYO (CON VIDEO DE CANCHAS, PRECIOS DÍA/NOCHE,
//     HORARIOS DE ATENCIÓN, GRILLA DE SERVICIOS CON ICONOS Y GOOGLE MAPS)
// ============================================================================
export const SURFACE_WEATHER_STATES = [
  {
    id: "seco",
    label: "Cancha Seca · Óptima",
    shortLabel: "Seca · Óptima",
    indicator: "Pique rápido y tracción completa en polvo de ladrillo.",
    icon: ASSETS.climaSeco,
    color: "#00DC7D",
  },
  {
    id: "humedad",
    label: "Humedad Leve · Jugable",
    shortLabel: "Humedad Leve",
    indicator: "Arcilla asentada con bote medio, ideal para peloteos largos.",
    icon: ASSETS.climaHumedad,
    color: "#0091FF",
  },
  {
    id: "llovizna",
    label: "Llovizna · Precaución",
    shortLabel: "Llovizna",
    indicator: "Flejes húmedos. Se recomienda calzado de espiga profunda.",
    icon: ASSETS.climaLlovizna,
    color: "#F59E0B",
  },
  {
    id: "lluvia",
    label: "Lluvia · Pausada",
    shortLabel: "Pausada por Lluvia",
    indicator: "Cancha en secado y mantenimiento. Turnos reprogramables.",
    icon: ASSETS.climaLluvia,
    color: "#F43F5E",
  },
];

export const HUANCAYO_CLUBS = [
  {
    id: "country",
    name: "Country Club Los Huancas",
    shortName: "Country Club Los Huancas",
    zone: "San Carlos, Huancayo",
    address: "Av. San Carlos / Jr. Los Huancas, Huancayo",
    surface: "Arcilla",
    courtsCount: 4,
    operatingHours: "Lun a Dom · 06:00 a 22:00 h",
    dayPrice: 35,
    nightPrice: 45,
    memberPrice: 15,
    priceInfo: "Día: S/ 35 · Noche LED: S/ 45 · Socio: S/ 15",
    shield: ASSETS.clubCountry,
    videoUrl: ASSETS.videoCircuitoH1,
    bannerImage:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1100&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80",
    ],
    vipHeadline: "15% Dcto. en alquiler de cancha (Lun–Vie 08:00 a 16:00)",
    vipBenefitsList: [
      "15% de descuento directo en alquiler de cancha en horario diurno (Lunes a Viernes)",
      "Reserva prioritaria de turnos nocturnos para desafíos oficiales del Ranking",
      "Tarifa preferencial en tubo de pelotas presurizadas y servicio de encordado",
    ],
    facilities: [
      {
        iconKey: "court",
        title: "4 Canchas de Arcilla Oficiales",
        detail: "Mantenimiento diario de polvo de ladrillo, riego y cepillado de flejes",
      },
      {
        iconKey: "lights",
        title: "Iluminación LED Nocturna",
        detail: "Reflectores de alto contraste habilitados hasta las 22:00 h",
      },
      {
        iconKey: "cafe",
        title: "Cafetería & Terraza Panorámica",
        detail: "Vista directa a las canchas principales, bebidas isotónicas y snacks",
      },
      {
        iconKey: "parking",
        title: "Estacionamiento Privado y Camerinos",
        detail: "Seguridad interna, duchas con agua caliente y casilleros",
      },
    ],
    surfaceStateId: "seco",
    lastReportBy: "Mateo Samaniego",
    lastReportTime: "15 Nov · 16:40",
    coordinates: { lat: -12.0558, lng: -75.1984 },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=-12.0558,-75.1984",
    whatsappPhone: "51964112233",
  },
  {
    id: "cutipa",
    name: "Academia Romina Cutipa",
    shortName: "Academia Romina Cutipa",
    zone: "El Tambo, Huancayo",
    address: "Sector El Tambo, Huancayo",
    surface: "Arcilla",
    courtsCount: 3,
    operatingHours: "Lun a Dom · 06:30 a 22:00 h",
    dayPrice: 30,
    nightPrice: 40,
    memberPrice: 24,
    priceInfo: "Día: S/ 30 · Noche LED: S/ 40 · VIP: S/ 24",
    shield: ASSETS.clubCutipa,
    videoUrl: ASSETS.videoCoachH2,
    bannerImage:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1100&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
    ],
    vipHeadline: "20% Dcto. en alquiler de cancha y taller de encordado",
    vipBenefitsList: [
      "20% de descuento presentando tu Carnet Digital Socio VIP",
      "S/ 10 de descuento en encordado electrónico de precisión",
      "Préstamo de canasto de pelotas en sesiones de entrenamiento",
    ],
    facilities: [
      {
        iconKey: "court",
        title: "3 Canchas de Arcilla (1 Semi-Techada)",
        detail: "Protección superior para continuar jugando ante lloviznas ligeras",
      },
      {
        iconKey: "stringing",
        title: "Taller de Encordado Electrónico",
        detail: "Máquina digital de tensión constante y stock de cuerdas co-poly",
      },
      {
        iconKey: "lights",
        title: "Reflectores LED de Torneo",
        detail: "Visibilidad uniforme en toda la línea de fondo hasta las 22:00 h",
      },
      {
        iconKey: "shop",
        title: "Pro Shop & Zona de Hidratación",
        detail: "Venta de overgrips, antivibradores, muñequeras y pelotas nuevas",
      },
    ],
    surfaceStateId: "seco",
    lastReportBy: "Kenji Takahashi",
    lastReportTime: "15 Nov · 17:05",
    coordinates: { lat: -12.0482, lng: -75.2146 },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=-12.0482,-75.2146",
    whatsappPhone: "51999334455",
  },
  {
    id: "tauro",
    name: "Club Tauro Tenis",
    shortName: "Club Tauro Tenis",
    zone: "Pilcomayo / Huancayo",
    address: "Av. Coronel Parra, Pilcomayo - Huancayo",
    surface: "Arcilla",
    courtsCount: 2,
    operatingHours: "Lun a Dom · 06:00 a 21:30 h",
    dayPrice: 30,
    nightPrice: 38,
    memberPrice: 25,
    priceInfo: "Día: S/ 30 · Noche LED: S/ 38 · VIP: S/ 25",
    shield: ASSETS.clubTauro,
    videoUrl: ASSETS.videoCircuitoH3,
    bannerImage:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1100&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
    ],
    vipHeadline: "15% Dcto. en turnos de mañana y tarde + boleador",
    vipBenefitsList: [
      "15% de descuento en alquiler de cancha de 07:00 a 17:00 h",
      "Coordinación de boleador / pasabolas sin recargo adicional",
      "Prioridad de reserva para partidos de desempate del circuito",
    ],
    facilities: [
      {
        iconKey: "court",
        title: "2 Canchas de Arcilla Compactada",
        detail: "Rápido drenaje tras lluvias de estación y amplio fondo de cancha",
      },
      {
        iconKey: "lights",
        title: "Iluminación Nocturna",
        detail: "Turnos nocturnos habilitados hasta las 21:30 h",
      },
      {
        iconKey: "parking",
        title: "Estacionamiento Interno Amplio",
        detail: "Acceso directo vehicular dentro del complejo deportivo",
      },
      {
        iconKey: "cafe",
        title: "Camerinos, Duchas y Zona Social",
        detail: "Vestuarios completos y área de descanso post-partido",
      },
    ],
    surfaceStateId: "humedad",
    lastReportBy: "Alejandro Tovar",
    lastReportTime: "15 Nov · 15:50",
    coordinates: { lat: -12.0596, lng: -75.2421 },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=-12.0596,-75.2421",
    whatsappPhone: "51954223344",
  },
  {
    id: "inkas",
    name: "Club Los Inkas / Xian",
    shortName: "Club Los Inkas / Xian",
    zone: "Chilca, Huancayo",
    address: "Zona Residencial Chilca, Huancayo",
    surface: "Arcilla",
    courtsCount: 2,
    operatingHours: "Lun a Dom · 06:30 a 21:30 h",
    dayPrice: 28,
    nightPrice: 36,
    memberPrice: 20,
    priceInfo: "Día: S/ 28 · Noche LED: S/ 36 · VIP: S/ 20",
    shield: ASSETS.clubInkas,
    videoUrl: ASSETS.videoCircuitoH4,
    bannerImage:
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1100&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=900&q=80",
    ],
    vipHeadline: "S/ 8 de descuento directo en retos oficiales del circuito",
    vipBenefitsList: [
      "S/ 8 de descuento por partido oficial agendado desde MATCHPOINT",
      "15 minutos adicionales de calentamiento según disponibilidad",
      "Hidratación de cortesía en torneos relámpago de fin de semana",
    ],
    facilities: [
      {
        iconKey: "court",
        title: "2 Canchas de Arcilla Abierta",
        detail: "Orientación norte-sur óptima para jugar sin sol de frente",
      },
      {
        iconKey: "lights",
        title: "Reflectores LED",
        detail: "Habilitados para retos después de oficina",
      },
      {
        iconKey: "cafe",
        title: "Pérgola Techada de Espectadores",
        detail: "Zona cómoda junto a cancha para acompañantes y jugadores",
      },
      {
        iconKey: "shop",
        title: "Recepción con Accesorios Básicos",
        detail: "Overgrips, muñequeras, alquiler de raquetas y bebidas",
      },
    ],
    surfaceStateId: "seco",
    lastReportBy: "Sebastián Rojas",
    lastReportTime: "15 Nov · 14:20",
    coordinates: { lat: -12.0835, lng: -75.2068 },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=-12.0835,-75.2068",
    whatsappPhone: "51977556677",
  },
];

export function getClubById(clubId, clubsList = HUANCAYO_CLUBS) {
  if (!clubId || clubId === "individual") return null;
  return clubsList.find((c) => c.id === clubId) || null;
}

// ============================================================================
// 13. SELECTORES TÁCTILES DE PERFIL Y HORARIOS
// ============================================================================
export const HAND_OPTIONS = ["Diestro", "Zurdo"];

export const BEST_SHOT_OPTIONS = [
  "Derecha (Forehand)",
  "Revés a 2 Manos",
  "Revés a 1 Mano",
  "1er Saque Potente",
  "Slice / Drop Shot",
  "Volea y Red",
];

export const WEEK_DAYS_OPTIONS = [
  { id: "L", label: "Lun" },
  { id: "M", label: "Mar" },
  { id: "X", label: "Mié" },
  { id: "J", label: "Jue" },
  { id: "V", label: "Vie" },
  { id: "S", label: "Sáb" },
  { id: "D", label: "Dom" },
];

export const TIME_SLOT_OPTIONS = [
  { id: "manana", label: "Mañana", hours: "07:00–12:00" },
  { id: "tarde", label: "Tarde", hours: "12:00–18:00" },
  { id: "noche", label: "Noche", hours: "18:00–22:00" },
];

export const BALL_AGREEMENT_OPTIONS = [
  "Tarro nuevo a medias (50/50)",
  "Retador lleva tarro nuevo",
  "Pelotas seminuevas (1 partido)",
];

// ============================================================================
// 14. NUEVO TEST INICIAL DIDÁCTICO, HUMANO Y A PRUEBA DE MENTIROSOS
//     - Preguntas reales: Tiempo jugando, Días por semana, Torneos, Podios y Cancha
//     - Colores diferenciados por nivel de respuesta + Letra grande
//     - Algoritmo Detector de Incongruencias (Anti-Mentirosos)
// ============================================================================
export const CALIBRATION_QUESTIONS_1X1 = [
  {
    id: "q_time_playing",
    step: 1,
    title: "¿Cuánto tiempo llevas jugando al tenis?",
    subtitle: "Elige con confianza: esto nos ayuda a buscarte partidos divertidos y parejos.",
    options: [
      {
        badge: "INICIAL",
        label: "Recién empiezo este año (menos de 6 meses en cancha)",
        points: 0,
        color: "#64748B",
        bg: "rgba(100, 116, 139, 0.16)",
      },
      {
        badge: "BASE",
        label: "Llevo entre 6 meses y 1 año y medio practicando",
        points: 1,
        color: "#0284C7",
        bg: "rgba(2, 132, 199, 0.16)",
      },
      {
        badge: "CONSTANTE",
        label: "Juego desde hace 2 a 4 años de forma regular",
        points: 2,
        color: "#00DC7D",
        bg: "rgba(0, 220, 125, 0.16)",
      },
      {
        badge: "EXPERIENCIA",
        label: "Llevo más de 4 años jugando y conozco bien la competencia",
        points: 3,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.18)",
      },
    ],
  },
  {
    id: "q_days_week",
    step: 2,
    title: "¿Cuántos días a la semana entrenas o juegas actualmente?",
    subtitle: "Cuenta tanto clases con profesor como partidos con amigos.",
    options: [
      {
        badge: "OCASIONAL",
        label: "Juego de vez en cuando (1 o 2 veces al mes)",
        points: 0,
        color: "#64748B",
        bg: "rgba(100, 116, 139, 0.16)",
      },
      {
        badge: "FIN DE SEMANA",
        label: "Juego 1 día por semana regularmente",
        points: 1,
        color: "#0284C7",
        bg: "rgba(2, 132, 199, 0.16)",
      },
      {
        badge: "ACTIVO",
        label: "Entreno o juego entre 2 y 3 días por semana",
        points: 2,
        color: "#00DC7D",
        bg: "rgba(0, 220, 125, 0.16)",
      },
      {
        badge: "INTENSIVO",
        label: "Estoy en cancha 4 o más días por semana",
        points: 3,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.18)",
      },
    ],
  },
  {
    id: "q_tournaments",
    step: 3,
    title: "¿En cuántos torneos has participado y en qué categorías?",
    subtitle: "Si aún no has jugado torneos, marca la primera opción sin problema.",
    options: [
      {
        badge: "SIN TORNEOS",
        label: "Todavía no he jugado torneos oficiales (solo peloteo o clases)",
        points: 0,
        color: "#64748B",
        bg: "rgba(100, 116, 139, 0.16)",
      },
      {
        badge: "5ª CATEGORÍA",
        label: "He jugado 1 a 3 torneos de club en 5ª Principiante o 5ª Básica",
        points: 1,
        color: "#0284C7",
        bg: "rgba(2, 132, 199, 0.16)",
      },
      {
        badge: "5ª AVANZADA / 4ª",
        label: "Compito regularmente en torneos de 5ª Avanzada o 4ª Categoría",
        points: 2,
        color: "#00DC7D",
        bg: "rgba(0, 220, 125, 0.16)",
      },
      {
        badge: "4ª ALTA / 3ª CAT",
        label: "He competido en varios torneos de 4ª Alta o 3ª Categoría",
        points: 3,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.18)",
      },
    ],
  },
  {
    id: "q_podiums",
    step: 4,
    title: "¿Has logrado algún título, final o semifinal en torneos?",
    subtitle: "Tu historial en cuadros eliminatorios valida tu categoría real.",
    options: [
      {
        badge: "EN CAMINO",
        label: "Aún no he llegado a rondas finales o recién debuto",
        points: 0,
        color: "#64748B",
        bg: "rgba(100, 116, 139, 0.16)",
      },
      {
        badge: "RONDA CONSUELO / 5ª",
        label: "He ganado partidos o llegado a podio en 5ª Categoría / Consuelo",
        points: 1,
        color: "#0284C7",
        bg: "rgba(2, 132, 199, 0.16)",
      },
      {
        badge: "PODIO EN 4ª",
        label: "He llegado a Semifinales, Final o Campeón en 5ª A / 4ª Categoría",
        points: 2,
        color: "#00DC7D",
        bg: "rgba(0, 220, 125, 0.16)",
      },
      {
        badge: "CAMPEÓN / FINALISTA",
        label: "Tengo títulos o finales comprobables en 4ª Alta o 3ª Categoría",
        points: 3,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.18)",
      },
    ],
  },
  {
    id: "q_match_skills",
    step: 5,
    title: "En un partido real, ¿cómo están tu saque y tu peloteo?",
    subtitle: "Recuerda: tus primeros 5 partidos son de calibración y ajustan tu nivel rápido.",
    options: [
      {
        badge: "APRENDIENDO",
        label: "Paso la pelota suave y me cuesta meter el saque sin hacer doble falta",
        points: 0,
        color: "#64748B",
        bg: "rgba(100, 116, 139, 0.16)",
      },
      {
        badge: "PELOTEO MEDIO",
        label: "Aseguro el saque para empezar el punto y aguanto 6 a 8 bolas de fondo",
        points: 1,
        color: "#0284C7",
        bg: "rgba(2, 132, 199, 0.16)",
      },
      {
        badge: "COMPETITIVO",
        label: "Pego con efecto (topspin/slice), tengo buen 1er saque y cierro en la red",
        points: 2,
        color: "#00DC7D",
        bg: "rgba(0, 220, 125, 0.16)",
      },
      {
        badge: "DOMINIO ALTO",
        label: "Domino direcciones, segundo saque con efecto y peloteos de alta velocidad",
        points: 3,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.18)",
      },
    ],
  },
];

// Algoritmo Cruzado A Prueba de Mentirosos (Cruza Tiempo + Torneos + Podios vs Autopercepción)
export function computeInitialSeedFromAnswers(answersArray = [1, 1, 1, 1, 1]) {
  const [timePts = 0, daysPts = 0, tournPts = 0, podiumPts = 0, skillPts = 0] =
    answersArray.map((v) => Number(v || 0));

  let rawScore = timePts + daysPts + tournPts + podiumPts + skillPts;
  let antiLiarTriggered = false;
  let antiLiarNote = null;

  // Regla Anti-Mentirosos #1: Si dice tener dominio técnico máximo (skillPts === 3) o podios altos,
  // pero lleva menos de 6 meses jugando (timePts === 0) o nunca jugó un torneo (tournPts === 0)
  if ((skillPts >= 2 || podiumPts >= 2) && (timePts === 0 || tournPts === 0)) {
    rawScore = Math.min(rawScore, 5);
    antiLiarTriggered = true;
    antiLiarNote =
      "Ajuste preventivo aplicado: como indicaste poca experiencia previa en torneos, iniciarás en una base segura y subirás rápido si ganas en cancha.";
  }

  // Regla Anti-Mentirosos #2: Nadie puede saltar a 4ª Alta (3,350) sin haber competido en torneos de 4ª/3ª (tournPts >= 2) y tener podios (podiumPts >= 2)
  if (rawScore >= 13 && (tournPts < 2 || podiumPts < 2)) {
    rawScore = 10;
    antiLiarTriggered = true;
    antiLiarNote =
      "Ubicación calibrada en 4ª Base (2,000 Pts): demuestra tu nivel en tus primeros 5 partidos de calibración para ascender.";
  }

  if (rawScore <= 3) {
    return {
      seedElo: 150,
      categoryId: "5P",
      recommendCoach: true,
      antiLiarTriggered,
      antiLiarNote,
    };
  }
  if (rawScore <= 6) {
    return {
      seedElo: 500,
      categoryId: "5B",
      recommendCoach: false,
      antiLiarTriggered,
      antiLiarNote,
    };
  }
  if (rawScore <= 9) {
    return {
      seedElo: 1200,
      categoryId: "5A",
      recommendCoach: false,
      antiLiarTriggered,
      antiLiarNote,
    };
  }
  if (rawScore <= 12) {
    return {
      seedElo: 2000,
      categoryId: "4TA",
      recommendCoach: false,
      antiLiarTriggered,
      antiLiarNote,
    };
  }
  return {
    seedElo: 3350,
    categoryId: "4TA",
    recommendCoach: false,
    antiLiarTriggered,
    antiLiarNote,
  };
}

// ============================================================================
// 15. LOS 10 PERFILES REALES DE HUANCAYO (CON FOTO DE ROSTRO + FOTO HERO WTA,
//     EDADES COHERENTES INCLUYENDO +40 MASTER, SALDO DE GEMAS 💎 Y CALIBRACIÓN)
// ============================================================================
export const INITIAL_PLAYERS = [
  {
    id: "p_mateo",
    name: "Mateo Samaniego",
    email: "mateo@matchpoint.pe",
    phone: "964112233",
    password: "123",
    age: 29,
    heightLabel: "1.81 m",
    birthPlace: "Huancayo, PER",
    clubId: "country",
    elo: 4320,
    careerHighRank: 1,
    previousRank: 1,
    lastDelta: 118,
    wins: 16,
    losses: 3,
    careerWins: 48,
    careerLosses: 11,
    titlesCount: 3,
    seasonMatches: 19,
    streak: 4,
    calibrationMatches: 5,
    gems: 340,
    profileThemeId: "wta_finals",
    hand: "Diestro",
    bestShot: "Derecha (Forehand)",
    secondaryShot: "1er Saque Potente",
    availableDays: ["M", "J", "S", "D"],
    availableSlots: ["18:00–22:00", "07:00–12:00"],
    whatsappPrivate: false,
    isVipMember: true,
    vipCode: "MP-2026-0101",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_alejandro",
    name: "Alejandro Tovar",
    email: "alejandro@matchpoint.pe",
    phone: "988445566",
    password: "123",
    age: 42, // Jugador +40 Master (Activa Equilibrio Generacional Senior)
    heightLabel: "1.78 m",
    birthPlace: "Huancayo, PER",
    clubId: "tauro",
    elo: 3790,
    careerHighRank: 2,
    previousRank: 2,
    lastDelta: 96,
    wins: 14,
    losses: 4,
    careerWins: 41,
    careerLosses: 15,
    titlesCount: 2,
    seasonMatches: 18,
    streak: 2,
    calibrationMatches: 5,
    gems: 290,
    profileThemeId: "wimbledon",
    hand: "Diestro",
    bestShot: "Revés a 2 Manos",
    secondaryShot: "Derecha (Forehand)",
    availableDays: ["L", "X", "V", "S"],
    availableSlots: ["18:00–22:00"],
    whatsappPrivate: false,
    isVipMember: true,
    vipCode: "MP-2026-0102",
    lookingForMatchToday: true,
    lookingForMatchNote: "Cancha disponible hoy 19:30 en Club Tauro Tenis",
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_jose",
    name: "José Clariana",
    email: "jose@matchpoint.pe",
    phone: "954223344",
    password: "123",
    age: 44, // Jugador +40 Master
    heightLabel: "1.76 m",
    birthPlace: "Huancayo, PER",
    clubId: "country",
    elo: 3360,
    careerHighRank: 2,
    previousRank: 3,
    lastDelta: -74,
    wins: 11,
    losses: 4,
    careerWins: 35,
    careerLosses: 14,
    titlesCount: 2,
    seasonMatches: 15,
    streak: 1,
    calibrationMatches: 5,
    gems: 245,
    profileThemeId: "roland_garros",
    hand: "Diestro",
    bestShot: "Slice / Drop Shot",
    secondaryShot: "1er Saque Potente",
    availableDays: ["M", "J", "V", "S", "D"],
    availableSlots: ["12:00–18:00", "18:00–22:00"],
    whatsappPrivate: false,
    isVipMember: true,
    vipCode: "MP-2026-0103",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_pablo",
    name: "Pablo Lazo",
    email: "pablo@matchpoint.pe",
    phone: "966778899",
    password: "123",
    age: 26,
    heightLabel: "1.79 m",
    birthPlace: "Huancayo, PER",
    clubId: "country",
    elo: 3080,
    careerHighRank: 3,
    previousRank: 5,
    lastDelta: 132,
    wins: 6,
    losses: 3,
    careerWins: 22,
    careerLosses: 9,
    titlesCount: 1,
    seasonMatches: 9,
    streak: 3,
    calibrationMatches: 5,
    gems: 210,
    profileThemeId: "wta_finals",
    hand: "Diestro",
    bestShot: "Derecha (Forehand)",
    secondaryShot: "Slice / Drop Shot",
    availableDays: ["L", "M", "X", "J", "V", "S"],
    availableSlots: ["12:00–18:00", "18:00–22:00"],
    whatsappPrivate: false,
    isVipMember: true,
    vipCode: "MP-2026-0104",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_kenji",
    name: "Kenji Takahashi",
    email: "kenji@matchpoint.pe",
    phone: "999334455",
    password: "123",
    age: 27,
    heightLabel: "1.75 m",
    birthPlace: "Huancayo, PER",
    clubId: "cutipa",
    elo: 2890,
    careerHighRank: 4,
    previousRank: 4,
    lastDelta: -88,
    wins: 9,
    losses: 5,
    careerWins: 26,
    careerLosses: 14,
    titlesCount: 1,
    seasonMatches: 14,
    streak: 0,
    calibrationMatches: 5,
    gems: 165,
    profileThemeId: "us_open",
    hand: "Zurdo",
    bestShot: "Revés a 2 Manos",
    secondaryShot: "Derecha (Forehand)",
    availableDays: ["L", "X", "V", "D"],
    availableSlots: ["18:00–22:00"],
    whatsappPrivate: false,
    isVipMember: false,
    vipCode: "MP-2026-0105",
    lookingForMatchToday: true,
    lookingForMatchNote: "Busco single hoy 18:00 en Academia Romina Cutipa",
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_valeria",
    name: "Valeria Montes",
    email: "valeria@matchpoint.pe",
    phone: "944889900",
    password: "123",
    age: 25,
    heightLabel: "1.70 m",
    birthPlace: "Huancayo, PER",
    clubId: "cutipa",
    elo: 2340,
    careerHighRank: 5,
    previousRank: 6,
    lastDelta: 112,
    wins: 8,
    losses: 4,
    careerWins: 19,
    careerLosses: 8,
    titlesCount: 1,
    seasonMatches: 12,
    streak: 2,
    calibrationMatches: 5,
    gems: 195,
    profileThemeId: "wta_finals",
    hand: "Diestro",
    bestShot: "Derecha (Forehand)",
    secondaryShot: "Revés a 2 Manos",
    availableDays: ["M", "J", "S", "D"],
    availableSlots: ["07:00–12:00", "12:00–18:00"],
    whatsappPrivate: true,
    isVipMember: true,
    vipCode: "MP-2026-0106",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_sebastian",
    name: "Sebastián Rojas",
    email: "sebastian@matchpoint.pe",
    phone: "977556677",
    password: "123",
    age: 41, // Jugador +40 Master
    heightLabel: "1.77 m",
    birthPlace: "Huancayo, PER",
    clubId: "inkas",
    elo: 1720,
    careerHighRank: 7,
    previousRank: 7,
    lastDelta: 94,
    wins: 7,
    losses: 3,
    careerWins: 15,
    careerLosses: 7,
    titlesCount: 0,
    seasonMatches: 10,
    streak: 3,
    calibrationMatches: 5,
    gems: 140,
    profileThemeId: "roland_garros",
    hand: "Diestro",
    bestShot: "1er Saque Potente",
    secondaryShot: "Volea y Red",
    availableDays: ["V", "S", "D"],
    availableSlots: ["07:00–12:00", "12:00–18:00"],
    whatsappPrivate: false,
    isVipMember: false,
    vipCode: "MP-2026-0107",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_camila",
    name: "Camila Solís",
    email: "camila@matchpoint.pe",
    phone: "955778899",
    password: "123",
    age: 24,
    heightLabel: "1.68 m",
    birthPlace: "Huancayo, PER",
    clubId: "country",
    elo: 1380,
    careerHighRank: 8,
    previousRank: 8,
    lastDelta: 156,
    wins: 3,
    losses: 1,
    careerWins: 3,
    careerLosses: 1,
    titlesCount: 0,
    seasonMatches: 4,
    streak: 2,
    calibrationMatches: 3, // En Calibración (3/5) -> Se muestra claramente en el Ranking
    gems: 115,
    profileThemeId: "wta_finals",
    hand: "Diestro",
    bestShot: "Revés a 2 Manos",
    secondaryShot: "Derecha (Forehand)",
    availableDays: ["L", "X", "V", "S"],
    availableSlots: ["12:00–18:00"],
    whatsappPrivate: true,
    isVipMember: false,
    vipCode: "MP-2026-0108",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_diego",
    name: "Diego Paredes",
    email: "diego@matchpoint.pe",
    phone: "933990011",
    password: "123",
    age: 34,
    heightLabel: "1.74 m",
    birthPlace: "Huancayo, PER",
    clubId: "tauro",
    elo: 840,
    careerHighRank: 9,
    previousRank: 9,
    lastDelta: 82,
    wins: 4,
    losses: 4,
    careerWins: 9,
    careerLosses: 8,
    titlesCount: 0,
    seasonMatches: 8,
    streak: 1,
    calibrationMatches: 5,
    gems: 95,
    profileThemeId: "wta_finals",
    hand: "Diestro",
    bestShot: "Derecha (Forehand)",
    secondaryShot: "1er Saque Potente",
    availableDays: ["M", "J", "S"],
    availableSlots: ["18:00–22:00"],
    whatsappPrivate: false,
    isVipMember: false,
    vipCode: "MP-2026-0109",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p_lucas",
    name: "Lucas Mendoza",
    email: "lucas@matchpoint.pe",
    phone: "922001122",
    password: "123",
    age: 22,
    heightLabel: "1.75 m",
    birthPlace: "Huancayo, PER",
    clubId: "individual",
    elo: 320,
    careerHighRank: 10,
    previousRank: 10,
    lastDelta: 110,
    wins: 1,
    losses: 1,
    careerWins: 1,
    careerLosses: 1,
    titlesCount: 0,
    seasonMatches: 2,
    streak: 1,
    calibrationMatches: 2, // En Calibración (2/5) -> Se muestra claramente en el Ranking
    gems: 80,
    profileThemeId: "wta_finals",
    hand: "Diestro",
    bestShot: "Derecha (Forehand)",
    secondaryShot: "Revés a 2 Manos",
    availableDays: ["S", "D"],
    availableSlots: ["07:00–12:00", "12:00–18:00"],
    whatsappPrivate: false,
    isVipMember: false,
    vipCode: "MP-2026-0110",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=85",
  },
];

// ============================================================================
// 16. HISTORIAL DE PARTIDOS (FORMATO "LATEST MATCHES" WTA CON SETS POR COLUMNA)
// ============================================================================
export const INITIAL_COMPLETED_MATCHES = [
  {
    id: "hist_1",
    eventTitle: "Desafío Oficial Ranking · 4ª Categoría",
    challengerId: "p_pablo",
    challengedId: "p_kenji",
    winnerId: "p_pablo",
    loserId: "p_kenji",
    score: "6-4, 6-3",
    setsA: [6, 6, null],
    setsB: [4, 3, null],
    clubId: "cutipa",
    clubName: "Academia Romina Cutipa",
    dateLabel: "13 Nov 2026 · 19:00",
    completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    winnerDelta: 132,
    loserDelta: -88,
    gemsAwarded: 50,
    isFriendly: false,
  },
  {
    id: "hist_2",
    eventTitle: "Abierto Los Huancas · Duelo Directo",
    challengerId: "p_jose",
    challengedId: "p_pablo",
    winnerId: "p_pablo",
    loserId: "p_jose",
    score: "7-6(5), 6-4",
    setsA: [6, 4, null],
    setsB: [7, 6, null],
    clubId: "country",
    clubName: "Country Club Los Huancas",
    dateLabel: "09 Nov 2026 · 18:00",
    completedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    winnerDelta: 144,
    loserDelta: -74,
    gemsAwarded: 50,
    isFriendly: false,
  },
  {
    id: "hist_3",
    eventTitle: "Clásico San Carlos · 4ª Categoría Alta",
    challengerId: "p_pablo",
    challengedId: "p_jose",
    winnerId: "p_jose",
    loserId: "p_pablo",
    score: "6-3, 4-6, [10-7]",
    setsA: [3, 6, 7],
    setsB: [6, 4, 10],
    clubId: "country",
    clubName: "Country Club Los Huancas",
    dateLabel: "28 Oct 2026 · 20:00",
    completedAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
    winnerDelta: 98,
    loserDelta: -54,
    gemsAwarded: 25,
    isFriendly: false,
  },
  {
    id: "hist_4",
    eventTitle: "Estelar 3ª Categoría · Valle del Mantaro",
    challengerId: "p_mateo",
    challengedId: "p_alejandro",
    winnerId: "p_mateo",
    loserId: "p_alejandro",
    score: "6-4, 7-5",
    setsA: [6, 7, null],
    setsB: [4, 5, null],
    clubId: "country",
    clubName: "Country Club Los Huancas",
    dateLabel: "12 Nov 2026 · 20:00",
    completedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    winnerDelta: 118,
    loserDelta: -92,
    gemsAwarded: 50,
    isFriendly: false,
  },
  {
    id: "hist_5",
    eventTitle: "Duelo Oficial El Tambo · 4ª Categoría",
    challengerId: "p_valeria",
    challengedId: "p_kenji",
    winnerId: "p_valeria",
    loserId: "p_kenji",
    score: "6-4, 3-6, [10-8]",
    setsA: [6, 3, 10],
    setsB: [4, 6, 8],
    clubId: "cutipa",
    clubName: "Academia Romina Cutipa",
    dateLabel: "10 Nov 2026 · 17:00",
    completedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    winnerDelta: 112,
    loserDelta: -62,
    gemsAwarded: 50,
    isFriendly: false,
  },
];

export const INITIAL_CHALLENGES = [
  {
    id: "ch_live_1",
    challengerId: "p_mateo",
    challengedId: "p_alejandro",
    clubId: "country",
    customClubName: "Country Club Los Huancas",
    dateTimeLabel: "15 Nov 2026 · 17:30",
    ballAgreement: "Tarro nuevo a medias (50/50)",
    status: "live",
    isFriendly: false,
    isBossMatch: false,
    aiRecordingRequested: true,
    refereeName: "Rodrigo Villavicencio",
    refereeUpdatedAt: "En directo",
    proposedScore: null,
    liveScore: {
      currentSet: 2,
      s1A: 6,
      s1B: 4,
      tb1A: 0,
      tb1B: 0,
      s2A: 5,
      s2B: 4,
      tb2A: 0,
      tb2B: 0,
      stbA: 0,
      stbB: 0,
      liveFinishedPendingReview: false,
    },
  },
  {
    id: "ch_pending_pablo",
    challengerId: "p_jose",
    challengedId: "p_pablo",
    clubId: "country",
    customClubName: "Country Club Los Huancas",
    dateTimeLabel: "16 Nov 2026 · 19:00",
    ballAgreement: "Tarro nuevo a medias (50/50)",
    status: "pending",
    isFriendly: false,
    isBossMatch: false,
    aiRecordingRequested: false,
    counterProposalNote: null,
    proposedScore: null,
    liveScore: null,
  },
  {
    id: "ch_confirmed_pablo",
    challengerId: "p_pablo",
    challengedId: "p_kenji",
    clubId: "cutipa",
    customClubName: "Academia Romina Cutipa",
    dateTimeLabel: "17 Nov 2026 · 19:30",
    ballAgreement: "Retador lleva tarro nuevo",
    status: "confirmed",
    isFriendly: false,
    isBossMatch: false,
    aiRecordingRequested: true,
    proposedScore: null,
    liveScore: null,
  },
];

// === FIN DEL BLOQUE 3 DE 12 ===

// === INICIO DEL BLOQUE 4 DE 12 ===

// ============================================================================
// 17. ACADEMIA DE VIDEOS & TIPS TÉCNICOS (FORMATO HERO WTA CON 4 MINIATURAS
//     APILADAS A LA DERECHA · VIDEOS GRATIS + MASTERCLASSES CON GEMAS 💎)
// ============================================================================
export const WTA_VIDEO_ACADEMY_TIPS = [
  {
    id: "vid_tip_1",
    categoryBadge: "TIP GRATUITO · SAQUE EN ALTURA",
    title: "Cómo dominar el Primer Saque con Efecto Slice y Kick en la altura de Huancayo",
    coachName: "Prof. Rodrigo Villavicencio",
    clubName: "Country Club Los Huancas",
    duration: "04:15 min",
    isFree: true,
    gemCost: 0,
    videoUrl: ASSETS.videoCoachRodrigo,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80",
    keyTakeaways: [
      "Lanzamiento a las 11:30 para generar rotación sobre los 3,250 m s.n.m.",
      "Pronación suelta de muñeca para que la pelota baje dentro del cuadro",
      "Ahorro de energía física para sostener 3 sets sin fatiga de hombro",
    ],
  },
  {
    id: "vid_tip_2",
    categoryBadge: "TIP GRATUITO · FONDO DE CANCHA",
    title: "Apoyos abiertos y deslizamiento seguro sobre polvo de ladrillo",
    coachName: "Prof. Romina Cutipa",
    clubName: "Academia Romina Cutipa",
    duration: "03:45 min",
    isFree: true,
    gemCost: 0,
    videoUrl: ASSETS.videoCoachRomina,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80",
    keyTakeaways: [
      "Frenado con el borde interno antes del impacto de derecha",
      "Recuperación cruzada rápida para cubrir el centro de la cancha",
      "Altura óptima sobre la red para evitar dejar bolas cortas",
    ],
  },
  {
    id: "vid_tip_3",
    categoryBadge: "MASTERCLASS · CANJE CON GEMAS",
    title: "Táctica para ganar Tie-Breaks y Super Tie-Breaks a 10 puntos bajo presión",
    coachName: "Prof. Carlos Méndez",
    clubName: "Club Tauro Tenis",
    duration: "06:20 min",
    isFree: false,
    gemCost: 40,
    videoUrl: ASSETS.videoCoachDemo3,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
    keyTakeaways: [
      "Por qué asegurar el primer punto con tu saque cambia el 70% del Tie-Break",
      "Selección de tiros de alto margen cuando estás 8-8 en el Super Tie-Break",
      "Lectura del lado débil del rival en devolución",
    ],
  },
  {
    id: "vid_tip_4",
    categoryBadge: "MASTERCLASS · CANJE CON GEMAS",
    title: "Subida a la red (Approach), Volea profunda y definición de Smash",
    coachName: "Prof. Rodrigo Villavicencio",
    clubName: "Country Club Los Huancas",
    duration: "05:30 min",
    isFree: false,
    gemCost: 50,
    videoUrl: ASSETS.videoCircuitoH1,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=900&q=80",
    keyTakeaways: [
      "Split-step exacto en el instante en que el rival impacta la pelota",
      "Volea cruzada profunda al rincón vs. drop-volley corto",
      "Perfilado lateral para no perder nunca la caída del globo en el smash",
    ],
  },
];

// ============================================================================
// 18. SERVICIO PREMIUM: MATCHPOINT VISION IA (ESTILO SWINGVISION) & MULTIMEDIA
// ============================================================================
export const MATCHPOINT_VISION_IA_PACKAGES = [
  {
    id: "vision_ia_single",
    badge: "TECNOLOGÍA SWINGVISION IA",
    title: "Grabación Full HD + Análisis Estadístico por IA (1 Partido)",
    subtitle: "Instalamos el soporte en cancha y procesamos tu partido con Inteligencia Artificial.",
    regularPrice: 35,
    vipPrice: 25,
    gemDiscountPrice: 20, // Usando 60 Gemas
    gemsRequired: 60,
    features: [
      "Video resumido en 10 minutos sin tiempos muertos (solo puntos jugados)",
      "Mapa de calor de piques de pelota y velocidad estimada de saque/derecha",
      "Estadísticas automáticas: % de 1er saque, Winners vs. Errores No Forzados",
      "Clips listos en formato vertical 9:16 para subir a tu perfil y redes",
    ],
  },
  {
    id: "vision_pro_broadcast",
    badge: "COBERTURA PRODUCTORA MULTIMEDIA",
    title: "Transmisión Estelar + Cámara Pro & Drone (Finales / Reto al Boss)",
    subtitle: "Producción audiovisual profesional en alianza con realizadores de Huancayo.",
    regularPrice: 90,
    vipPrice: 70,
    gemDiscountPrice: 55,
    gemsRequired: 120,
    features: [
      "Filmación multicámara a ras de cancha + tomas aéreas del club",
      "Marcador gráfico estilo transmisión WTA / ATP integrado en el video",
      "Entrevista post-partido y reel cinematográfico de 60 segundos",
      "Ideal para Desafíos al Boss, Finales de Torneo o duelos clásicos",
    ],
  },
];

// ============================================================================
// 19. MARKETPLACE COACH PRO B2B (PIN PRIVADO INDIVIDUAL + CANJE DE GEMAS 💎)
// ============================================================================
export const INITIAL_COACHES = [
  {
    id: "coach_rodrigo",
    name: "Prof. Rodrigo Villavicencio",
    PrivatePin: "7101",
    clubId: "country",
    clubName: "Country Club Los Huancas",
    title: "Entrenador Principal · Nivel Competitivo & Alto Rendimiento",
    specialty: "Saque Potente, Derecha Invertida y Cierre en Red",
    rating: "5.0",
    reviewsCount: 28,
    studentsPromoted: 19,
    pricePerHour: 50,
    priceLabel: "S/ 50",
    unitLabel: "por hora",
    phone: "51964112233",
    avatar:
      "https://images.unsplash.com/photo-1534368420009-621bfab424a8?auto=format&fit=crop&w=600&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80",
    videoVertical: ASSETS.videoCoachRodrigo,
    videoHorizontal: ASSETS.videoCircuitoH1,
    bio: "Preparación integral en cancha de arcilla enfocada en dirección de primer saque, potencia controlada desde el fondo y lectura táctica para ascender de categoría.",
    packages: [
      {
        id: "pack_rod_1",
        name: "Sesión Individual en Cancha (1 Hora)",
        badge: "CLASE PERSONALIZADA",
        description: "Corrección biomecánica de golpes de fondo, saque y canasto intensivo.",
        price: 50,
        vipPrice: 45,
        gemRedeemText: "Canjea 80 💎 Gemas para S/ 15 de descuento directo",
      },
      {
        id: "pack_rod_4",
        name: "Pack Mensual 4 Sesiones + Sparring Evaluado",
        badge: "AHORRAS S/ 20 · INCLUYE ANÁLISIS DE VIDEO",
        description: "4 clases técnicas de 1 hora + set de práctica con diagnóstico táctico.",
        price: 180,
        vipPrice: 165,
        gemRedeemText: "Canjea 120 💎 Gemas para S/ 25 de descuento",
      },
      {
        id: "pack_rod_group",
        name: "Clínica Grupal de Fin de Semana (3 a 4 Tenistas)",
        badge: "CANJEABLE CON GEMAS",
        description: "90 minutos de ejercicios dinámicos de peloteo cruzado, volea y tie-breaks.",
        price: 35,
        vipPrice: 28,
        gemRedeemText: "Canjea 150 💎 Gemas por 1 pase libre a la clínica",
      },
    ],
    freeSlots: [
      "Lun 08:00 - 09:00",
      "Mar 16:00 - 17:00",
      "Mié 19:00 - 20:00",
      "Jue 09:00 - 10:00",
      "Sáb 10:00 - 11:00",
    ],
    reviews: [
      {
        id: "rev_1",
        author: "Pablo Lazo",
        category: "4ª Categoría",
        rating: 5,
        date: "10 Nov 2026",
        comment: "Con 4 sesiones ajusté el lanzamiento del primer saque y subí más de 250 puntos en la tabla.",
      },
      {
        id: "rev_2",
        author: "José Clariana",
        category: "4ª Categoría",
        rating: 5,
        date: "02 Nov 2026",
        comment: "Excelente ritmo de canasto y ejercicios reales para definir en media cancha.",
      },
    ],
  },
  {
    id: "coach_romina",
    name: "Prof. Romina Cutipa",
    PrivatePin: "7202",
    clubId: "cutipa",
    clubName: "Academia Romina Cutipa",
    title: "Directora de Academia · Formación Técnica y Ascenso",
    specialty: "Consistencia de Fondo, Movilidad en Arcilla y Revés a 2 Manos",
    rating: "5.0",
    reviewsCount: 34,
    studentsPromoted: 24,
    pricePerHour: 50,
    priceLabel: "S/ 50",
    unitLabel: "por hora",
    phone: "51999334455",
    avatar:
      "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=80",
    videoVertical: ASSETS.videoCoachRomina,
    videoHorizontal: ASSETS.videoCoachH2,
    bio: "Especialista en guiar tenistas desde 5ª Principiante y 5ª Básica hacia categorías competitivas con técnica sólida, apoyos limpios y confianza en partidos oficiales.",
    packages: [
      {
        id: "pack_rom_1",
        name: "Clase Técnica Individual (1 Hora)",
        badge: "TODOS LOS NIVELES",
        description: "Trabajo específico de empuñaduras, apoyos en arcilla y control de dirección.",
        price: 50,
        vipPrice: 45,
        gemRedeemText: "Canjea 80 💎 Gemas para S/ 15 de descuento directo",
      },
      {
        id: "pack_rom_4",
        name: "Programa Ascenso de Categoría (4 Sesiones)",
        badge: "AHORRAS S/ 20 · SEGUIMIENTO DE RANKING",
        description: "4 sesiones estructuradas + preparación de primeros y segundos saques.",
        price: 180,
        vipPrice: 165,
        gemRedeemText: "Canjea 120 💎 Gemas para S/ 25 de descuento",
      },
      {
        id: "pack_rom_group",
        name: "Clase Grupal Activa (Máximo 4 Jugadores)",
        badge: "IDEAL 5ª Y 4ª CATEGORÍA",
        description: "Entrenamiento dinámico de consistencia, peloteo largo y puntos en vivo.",
        price: 30,
        vipPrice: 25,
        gemRedeemText: "Canjea 140 💎 Gemas por 1 clase grupal completa",
      },
    ],
    freeSlots: [
      "Lun 15:00 - 16:00",
      "Mar 10:00 - 11:00",
      "Jue 17:00 - 18:00",
      "Vie 16:00 - 17:00",
      "Sáb 08:00 - 09:00",
    ],
    reviews: [
      {
        id: "rev_3",
        author: "Valeria Montes",
        category: "4ª Categoría",
        rating: 5,
        date: "12 Nov 2026",
        comment: "Sus clases de revés y movilidad en arcilla me dieron la seguridad para ganar mis retos en 2 sets.",
      },
      {
        id: "rev_4",
        author: "Kenji Takahashi",
        category: "4ª Categoría",
        rating: 5,
        date: "29 Oct 2026",
        comment: "Muy puntual, cancha impecable y ejercicios prácticos desde el primer minuto.",
      },
    ],
  },
  {
    id: "coach_carlos",
    name: "Prof. Carlos Méndez",
    PrivatePin: "7303",
    clubId: "tauro",
    clubName: "Club Tauro Tenis",
    title: "Entrenador de Partido & Sparring Oficial",
    specialty: "Efecto Topspin Pesado, Slice Defensivo y Tie-Breaks",
    rating: "4.9",
    reviewsCount: 19,
    studentsPromoted: 14,
    pricePerHour: 45,
    priceLabel: "S/ 45",
    unitLabel: "por hora",
    phone: "51954223344",
    avatar:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80",
    videoVertical: ASSETS.videoCoachDemo3,
    videoHorizontal: ASSETS.videoCircuitoH3,
    bio: "Entrenamiento de ritmo real de partido para jugadores que desean sostener peloteos exigentes sin cometer errores no forzados.",
    packages: [
      {
        id: "pack_car_1",
        name: "Sesión de Sparring + Corrección Táctica (1 Hora)",
        badge: "RITMO DE PARTIDO",
        description: "Peloteo intenso y simulación de sets cortos con correcciones en vivo.",
        price: 45,
        vipPrice: 40,
        gemRedeemText: "Canjea 70 💎 Gemas para S/ 12 de descuento",
      },
      {
        id: "pack_car_4",
        name: "Pack 4 Sesiones de Fondo y Segundo Saque",
        badge: "AHORRAS S/ 20",
        description: "Profundidad con topspin al fondo y seguridad total en momentos de presión.",
        price: 160,
        vipPrice: 145,
        gemRedeemText: "Canjea 110 💎 Gemas para S/ 22 de descuento",
      },
    ],
    freeSlots: [
      "Lun 18:00 - 19:00",
      "Mié 16:00 - 17:00",
      "Vie 19:00 - 20:00",
      "Dom 09:00 - 10:00",
    ],
    reviews: [
      {
        id: "rev_5",
        author: "Alejandro Tovar",
        category: "3ª Categoría",
        rating: 5,
        date: "05 Nov 2026",
        comment: "Ideal para agarrar ritmo fuerte de bola antes de competir en un torneo de fin de semana.",
      },
    ],
  },
];

// ============================================================================
// 20. TORNEOS POR FICHAS (CARDS PRIMERO ➔ MODAL COMPLETO AL HACER CLIC)
//     + REPLANTEAMIENTO DESDE CERO DEL TORNEO DE MAESTROS (MASTER TOP 8 FINALS)
// ============================================================================
export const PAYMENT_METHODS_CONFIG = {
  organizerName: "Comité Oficial MATCHPOINT Huancayo",
  yapeNumber: "964 112 233",
  plinNumber: "964 112 233",
  bankAccountBcp: "BCP Soles: 355-98765432-0-12",
  cciAccount: "CCI: 002-35519876543201234",
  whatsappApprovalPhone: "51964112233",
  vipMembershipPrice: 60,
  vipMembershipDuration: "Temporada Completa (3 Meses)",
};

// Estructura Oficial del Torneo de Maestros (Master Top 8 Finals — Formato WTA/ATP Finals)
export const MASTER_TOP8_FINALS_INFO = {
  title: "MATCHPOINT FINALS HUANCAYO · MASTER TOP 8",
  subtitle: "El Torneo de Maestros que corona a los mejores de la temporada en cada categoría",
  dateLabel: "18 – 21 Diciembre 2026",
  venueLabel: "Sede Central Country Club Los Huancas · Cancha Estelar",
  prizePoolLabel: "Copa Oficial de Maestros + S/ 1,200 en Premios & Equipamiento + +400 Pts + 300 💎",
  howToQualifySteps: [
    {
      step: "1",
      title: "Mantente entre los 8 Primeros de tu Categoría",
      detail:
        "En la tabla del Ranking verás la línea dorada del Top 8. Los puestos #1 al #8 al cierre de la fase regular ganan su boleto directo.",
    },
    {
      step: "2",
      title: "Mínimo 4 Partidos Oficiales Jugados en la Temporada",
      detail:
        "Para garantizar que clasifiquen tenistas activos en cancha, se requiere haber disputado al menos 4 desafíos o partidos de torneo.",
    },
    {
      step: "3",
      title: "Fase de Grupos Estilo ATP/WTA Finals (Grupo A y Grupo B)",
      detail:
        "Los 8 clasificados se dividen en 2 grupos de 4 jugadores (Todos contra todos — 3 partidos asegurados por tenista).",
    },
    {
      step: "4",
      title: "Semifinales Cruzadas y Gran Final con Cobertura Multimedia",
      detail:
        "El 1º del Grupo A enfrenta al 2º del Grupo B, y el 1º del Grupo B al 2º del Grupo A. Final filmada con análisis IA y entrega de trofeos.",
    },
  ],
  groupsPreview: {
    groupAName: "Grupo Mantaro (Cabezas de Serie Impares)",
    groupASlots: ["#1 Clasificado", "#3 Clasificado", "#5 Clasificado", "#7 Clasificado"],
    groupBName: "Grupo Huaytapallana (Cabezas de Serie Pares)",
    groupBSlots: ["#2 Clasificado", "#4 Clasificado", "#6 Clasificado", "#8 Clasificado"],
  },
};

export const INITIAL_TOURNAMENTS = [
  {
    id: "tourn_4ta_country",
    title: "Abierto Los Huancas · 4ª Categoría",
    shortBadge: "ABIERTO OFICIAL · ARCILLA",
    categoryId: "4TA",
    categoryLabel: "4ª Categoría",
    clubId: "country",
    clubName: "Country Club Los Huancas",
    surface: "Arcilla",
    dateRange: "21 – 23 Nov 2026",
    entryFee: 45,
    gemDiscountFee: 35, // Canjeando 80 Gemas
    gemsRequiredForDiscount: 80,
    includesBalls: true,
    ballsLabel: "Incluye tarro de pelotas nuevas en cada ronda",
    formatLabel: "Eliminación Directa + Ronda Consuelo (Mínimo 2 partidos asegurados)",
    prizeChampion: "Trofeo Oficial + +250 Pts ELO + +150 💎 + Encordado Pro",
    prizeFinalist: "Medalla Finalista + +120 Pts ELO + +80 💎 + Pack Overgrips",
    prizeConsolation: "Campeón Consuelo: +60 💎 Gemas + Tubo de Pelotas",
    maxPlayers: 8,
    bannerImage:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80",
    enrolledPlayerIds: ["p_jose", "p_pablo", "p_kenji", "p_valeria"],
    pendingApplicantIds: [],
    bracket: {
      quarters: [
        {
          id: "qf_1",
          roundLabel: "Semifinal 1 · Cancha Central",
          playerAId: "p_jose",
          playerBId: "p_valeria",
          score: "6-4, 6-3",
          winnerId: "p_jose",
          loserId: "p_valeria",
        },
        {
          id: "qf_2",
          roundLabel: "Semifinal 2 · Cancha 2",
          playerAId: "p_pablo",
          playerBId: "p_kenji",
          score: "",
          winnerId: null,
          loserId: null,
        },
      ],
      final: {
        id: "fin_1",
        roundLabel: "Gran Final · 4ª Categoría",
        playerAId: "p_jose",
        playerBId: null,
        score: "",
        winnerId: null,
      },
      consolationFinal: {
        id: "cons_1",
        roundLabel: "Final Ronda Consuelo",
        playerAId: "p_valeria",
        playerBId: null,
        score: "",
        winnerId: null,
      },
    },
  },
  {
    id: "tourn_5ta_cutipa",
    title: "Copa El Tambo · 5ª Categoría",
    shortBadge: "TORNEO DE ASCENSO",
    categoryId: "5A",
    categoryLabel: "5ª Avanzada & Básica",
    clubId: "cutipa",
    clubName: "Academia Romina Cutipa",
    surface: "Arcilla",
    dateRange: "28 – 30 Nov 2026",
    entryFee: 40,
    gemDiscountFee: 30,
    gemsRequiredForDiscount: 80,
    includesBalls: true,
    ballsLabel: "Incluye pelotas nuevas en todos los partidos",
    formatLabel: "Cuadro Principal + Ronda Consuelo Garantizada",
    prizeChampion: "Copa Campeón + Ascenso Directo + +220 Pts + +150 💎",
    prizeFinalist: "Trofeo Finalista + +110 Pts + +80 💎",
    prizeConsolation: "Campeón Consuelo: +60 💎 Gemas + Clase Grupal",
    maxPlayers: 8,
    bannerImage:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=80",
    enrolledPlayerIds: ["p_sebastian", "p_camila", "p_diego", "p_lucas"],
    pendingApplicantIds: [],
    bracket: {
      quarters: [
        {
          id: "qf_5_1",
          roundLabel: "Semifinal 1",
          playerAId: "p_sebastian",
          playerBId: "p_lucas",
          score: "6-2, 6-3",
          winnerId: "p_sebastian",
          loserId: "p_lucas",
        },
        {
          id: "qf_5_2",
          roundLabel: "Semifinal 2",
          playerAId: "p_camila",
          playerBId: "p_diego",
          score: "",
          winnerId: null,
          loserId: null,
        },
      ],
      final: {
        id: "fin_5_1",
        roundLabel: "Gran Final · 5ª Categoría",
        playerAId: "p_sebastian",
        playerBId: null,
        score: "",
        winnerId: null,
      },
      consolationFinal: {
        id: "cons_5_1",
        roundLabel: "Final Ronda Consuelo",
        playerAId: "p_lucas",
        playerBId: null,
        score: "",
        winnerId: null,
      },
    },
  },
  {
    id: "tourn_3ra_tauro",
    title: "Abierto Valle del Mantaro · 3ª Categoría",
    shortBadge: "SERIE ESTELAR 3ª",
    categoryId: "3RA",
    categoryLabel: "3ª Categoría & +40 Master",
    clubId: "tauro",
    clubName: "Club Tauro Tenis",
    surface: "Arcilla",
    dateRange: "05 – 07 Dic 2026",
    entryFee: 50,
    gemDiscountFee: 38,
    gemsRequiredForDiscount: 90,
    includesBalls: true,
    ballsLabel: "Incluye pelotas nuevas + Hidratación isotónica en cancha",
    formatLabel: "Cuadro Eliminatorio + Ronda Consuelo + Grabación IA en Final",
    prizeChampion: "Copa Valle del Mantaro + Premio Efectivo / Pro Shop + +300 Pts + +200 💎",
    prizeFinalist: "Trofeo Finalista + +140 Pts + +100 💎",
    prizeConsolation: "Campeón Consuelo: +75 💎 Gemas + Bono de Cancha",
    maxPlayers: 8,
    bannerImage:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80",
    enrolledPlayerIds: ["p_mateo", "p_alejandro"],
    pendingApplicantIds: [],
    bracket: {
      quarters: [
        {
          id: "qf_3_1",
          roundLabel: "Semifinal 1",
          playerAId: "p_mateo",
          playerBId: "p_alejandro",
          score: "",
          winnerId: null,
          loserId: null,
        },
      ],
      final: {
        id: "fin_3_1",
        roundLabel: "Gran Final · 3ª Categoría",
        playerAId: null,
        playerBId: null,
        score: "",
        winnerId: null,
      },
      consolationFinal: {
        id: "cons_3_1",
        roundLabel: "Final Ronda Consuelo",
        playerAId: null,
        playerBId: null,
        score: "",
        winnerId: null,
      },
    },
  },
];

export const HALL_OF_FAME_CHAMPIONS = [
  {
    id: "hof_1",
    tournamentName: "Master Apertura Huancayo 2026",
    categoryLabel: "3ª Categoría",
    championId: "p_mateo",
    championName: "Mateo Samaniego",
    championClubId: "country",
    finalistName: "Alejandro Tovar",
    finalScore: "6-4, 3-6, [10-7]",
    dateLabel: "Octubre 2026",
    recordLabel: "12 Victorias · Invicto en Arcilla",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "hof_2",
    tournamentName: "Abierto San Carlos 2026",
    categoryLabel: "4ª Categoría",
    championId: "p_jose",
    championName: "José Clariana",
    championClubId: "country",
    finalistName: "Kenji Takahashi",
    finalScore: "7-5, 6-4",
    dateLabel: "Septiembre 2026",
    recordLabel: "4 Partidos Ganados · 0 Sets Perdidos",
    avatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "hof_3",
    tournamentName: "Copa Invierno El Tambo 2026",
    categoryLabel: "5ª Avanzada",
    championId: "p_valeria",
    championName: "Valeria Montes",
    championClubId: "cutipa",
    finalistName: "Sebastián Rojas",
    finalScore: "6-3, 6-4",
    dateLabel: "Agosto 2026",
    recordLabel: "Campeona + Ascenso Directo a 4ª",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  },
];

// ============================================================================
// 21. TIENDA PRO SHOP & CENTRO DE CANJE DE GEMAS (💎 MATCHCOINS + SOLES)
//     Incluye: Entradas a Torneos, Clases Privadas/Grupales, Pelotas, Encordado y Vision IA
// ============================================================================
export const PRO_SHOP_ITEMS = [
  {
    id: "shop_tourn_voucher",
    name: "Bono de Descuento S/ 15 en Inscripción a Torneo Oficial",
    category: "Canje de Gemas",
    regularPrice: 15,
    vipPrice: 10,
    gemCost: 90, // Canjeable 100% con 90 Gemas
    canRedeemFullWithGems: true,
    badge: "CANJE DIRECTO CON 💎",
    image: ASSETS.goldenTicket,
    specs: "Aplica inmediatamente S/ 15 de descuento en tu próxima inscripción a cualquier torneo del circuito.",
  },
  {
    id: "shop_group_class",
    name: "Pase a Clínica Grupal de Técnica y Táctica (90 Minutos)",
    category: "Clases & Academia",
    regularPrice: 35,
    vipPrice: 28,
    gemCost: 140,
    canRedeemFullWithGems: true,
    badge: "RECOMPENSA ENTRENAMIENTO",
    image: ASSETS.escudoCoach,
    specs: "Sesión grupal en cancha de arcilla con los profesores oficiales de Coach Pro (Saque, derecha y tie-breaks).",
  },
  {
    id: "shop_private_discount",
    name: "Vale de S/ 20 en Clase Privada 1 a 1 con Entrenador",
    category: "Clases & Academia",
    regularPrice: 20,
    vipPrice: 15,
    gemCost: 100,
    canRedeemFullWithGems: true,
    badge: "MEJORA TU NIVEL",
    image: ASSETS.raquetaProDark,
    specs: "Descuento directo en una hora de entrenamiento personalizado en Country Club, Academia Cutipa o Club Tauro.",
  },
  {
    id: "shop_1",
    name: "Servicio de Encordado Electrónico de Precisión",
    category: "Taller & Cuerdas",
    regularPrice: 45,
    vipPrice: 35,
    gemCost: 180,
    canRedeemFullWithGems: true,
    badge: "ENTREGA EN 24H",
    image: ASSETS.proshopRollo,
    specs: "Monofilamento poliéster co-poly o multifilamento a la tensión exacta en libras que prefieras.",
  },
  {
    id: "shop_2",
    name: "Tubo Presurizado x3 Pelotas Oficiales Clay / All-Court",
    category: "Pelotas Oficiales",
    regularPrice: 32,
    vipPrice: 26,
    gemCost: 130,
    canRedeemFullWithGems: true,
    badge: "OFICIAL RETO",
    image: ASSETS.pelotaClasica,
    specs: "Fieltro tejido de alta visibilidad optimizado para canchas de polvo de ladrillo en altura.",
  },
  {
    id: "shop_3",
    name: "Pack x3 Overgrips Adherentes Pro Dry-Tacky",
    category: "Accesorios",
    regularPrice: 25,
    vipPrice: 20,
    gemCost: 95,
    canRedeemFullWithGems: true,
    badge: "ALTO AGARRE",
    image: ASSETS.pelotaVoltAzul,
    specs: "Absorción superior de sudor y tacto firme de 0.6 mm para máximo control del mango.",
  },
  {
    id: "shop_vision_ia",
    name: "Sesión MatchPoint Vision IA (Grabación + Estadísticas SwingVision)",
    category: "Análisis IA & Video",
    regularPrice: 35,
    vipPrice: 25,
    gemCost: 150,
    canRedeemFullWithGems: true,
    badge: "VIDEO + MAPA DE CALOR",
    image: ASSETS.poolTenistaAccion,
    specs: "Grabamos tu partido de ranking y te entregamos el video sin tiempos muertos más tus métricas de saque y golpes.",
  },
];

// ============================================================================
// 22. NOTICIERO DE TENIS Y MARCADORES ATP/WTA (PARA MODAL NOTIFICACIONES WTA)
// ============================================================================
export const ATP_WTA_LIVE_TICKER = [
  {
    id: "atp_1",
    tour: "WTA / ATP FINALS",
    status: "FINALIZADO",
    player1: "E. Rybakina",
    player2: "A. Sabalenka",
    score: "6-4, 6-3",
    url: "https://www.wtatennis.com/scores",
  },
  {
    id: "atp_2",
    tour: "ATP FINALS · TURÍN",
    status: "FINALIZADO",
    player1: "J. Sinner",
    player2: "T. Fritz",
    score: "6-4, 6-4",
    url: "https://www.atptour.com/en/scores/current",
  },
  {
    id: "atp_3",
    tour: "ATP FINALS · TURÍN",
    status: "FINALIZADO",
    player1: "C. Alcaraz",
    player2: "A. Rublev",
    score: "6-3, 7-6(8)",
    url: "https://www.atptour.com/en/scores/current",
  },
];

export const FALLBACK_EDITORIAL_NEWS = [
  {
    id: "news_1",
    source: "WTA Tour / Punto de Break",
    title: "Elena Rybakina y Aryna Sabalenka protagonizan el duelo estelar del cierre de temporada",
    publishedAt: "Hace 2 horas",
    link: "https://www.wtatennis.com/",
    imageUrl:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "news_2",
    source: "ATP Tour",
    title: "Sinner y Alcaraz lideran la carrera hacia la cima del PIF ATP Rankings",
    publishedAt: "Hace 4 horas",
    link: "https://www.atptour.com/en/news",
    imageUrl:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "news_3",
    source: "ESPN Tenis",
    title: "La gira sudamericana sobre polvo de ladrillo confirma su calendario oficial",
    publishedAt: "Hace 6 horas",
    link: "https://www.espn.com.pe/tenis/",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
  },
];

export function extractRealPhotoFromRssItem(item) {
  if (item?.enclosure?.link && /^https?:\/\//i.test(item.enclosure.link)) {
    return item.enclosure.link;
  }
  if (item?.thumbnail && /^https?:\/\//i.test(item.thumbnail)) {
    return item.thumbnail;
  }
  const htmlContent = `${item?.content || ""} ${item?.description || ""}`;
  const match = htmlContent.match(/<img[^>]+src=["'](https?:\/\/[^"'>]+)["']/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

// === FIN DEL BLOQUE 4 DE 12 ===

// === INICIO DEL BLOQUE 5 DE 12 ===

// ============================================================================
// 23. CARNET DIGITAL VIP METÁLICO 3D (PROPORCIÓN 1.58:1 · GRABADO LÁSER PISTA)
// ============================================================================
export const CarnetDigitalVIP = ({
  player,
  clubs = HUANCAYO_CLUBS,
  onOpenVipUpgrade,
  compact = false,
}) => {
  if (!player) return null;

  const isVip = Boolean(player.isVipMember);
  const catInfo = getCategoryByElo(player.elo, player.seasonMatches);
  const clubObj = getClubById(player.clubId, clubs);
  const memberCode = player.vipCode || `MP-2026-0104`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl select-none transition-transform duration-300"
      style={{
        aspectRatio: compact ? "1.72 / 1" : "1.586 / 1",
        background: isVip
          ? "linear-gradient(135deg, #2B1F06 0%, #121A2E 48%, #422F08 100%)"
          : "linear-gradient(135deg, #160628 0%, #1E293B 55%, #0B1325 100%)",
        border: isVip
          ? "2px solid rgba(253, 230, 138, 0.72)"
          : "1.5px solid rgba(0, 220, 125, 0.35)",
        boxShadow: isVip
          ? "0 20px 44px -12px rgba(212, 175, 55, 0.35)"
          : "0 16px 36px -12px rgba(0, 0, 0, 0.55)",
        padding: compact ? "18px 20px" : "22px 24px",
        color: "#FFFFFF",
      }}
    >
      {/* Grabado láser de cancha de tenis en bajo relieve */}
      <svg
        viewBox="0 0 400 250"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: isVip ? 0.16 : 0.1 }}
      >
        <rect
          x="22"
          y="18"
          width="356"
          height="214"
          rx="8"
          fill="none"
          stroke={isVip ? "#FDE68A" : "#00DC7D"}
          strokeWidth="1.8"
        />
        <line x1="22" y1="48" x2="378" y2="48" stroke={isVip ? "#FDE68A" : "#00DC7D"} strokeWidth="1.2" />
        <line x1="22" y1="202" x2="378" y2="202" stroke={isVip ? "#FDE68A" : "#00DC7D"} strokeWidth="1.2" />
        <line
          x1="200"
          y1="18"
          x2="200"
          y2="232"
          stroke={isVip ? "#FDE68A" : "#00DC7D"}
          strokeWidth="1.6"
          strokeDasharray="5 4"
        />
        <line x1="106" y1="48" x2="106" y2="202" stroke={isVip ? "#FDE68A" : "#00DC7D"} strokeWidth="1.2" />
        <line x1="294" y1="48" x2="294" y2="202" stroke={isVip ? "#FDE68A" : "#00DC7D"} strokeWidth="1.2" />
        <line x1="106" y1="125" x2="294" y2="125" stroke={isVip ? "#FDE68A" : "#00DC7D"} strokeWidth="1.2" />
      </svg>

      {/* Halo metálico superior */}
      <div
        className="absolute -top-20 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: isVip
            ? "radial-gradient(circle, rgba(253, 230, 138, 0.28) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(0, 220, 125, 0.22) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Cabecera del Carnet */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <SafeImage
              src={ASSETS.logo}
              alt="MATCHPOINT"
              fallbackText="MP"
              style={{ width: 34, height: 34, borderRadius: 10 }}
            />
            <div>
              <div className="font-wta-condensed text-xl tracking-wider leading-none text-white">
                MATCHPOINT TOUR
              </div>
              <div
                className="text-xs font-extrabold tracking-widest uppercase mt-0.5"
                style={{ color: isVip ? "#FDE68A" : "#00DC7D" }}
              >
                {isVip ? "PASE SOCIO VIP · TEMPORADA 2026" : "CREDENCIAL OFICIAL DE TENISTA"}
              </div>
            </div>
          </div>

          <span
            className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-md"
            style={{
              background: isVip
                ? "linear-gradient(135deg, #FDE68A 0%, #D97706 100%)"
                : "rgba(0, 220, 125, 0.18)",
              color: isVip ? "#0A1633" : "#00DC7D",
              border: isVip ? "none" : "1.5px solid rgba(0, 220, 125, 0.45)",
            }}
          >
            {isVip ? "★ SOCIO VIP" : "SOCIO ACTIVO"}
          </span>
        </div>

        {/* Chip Metálico + Datos del Jugador */}
        <div className="flex items-center justify-between gap-3 my-auto py-2">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-9 rounded-lg flex-shrink-0 relative overflow-hidden shadow-inner"
              style={{
                background: isVip
                  ? "linear-gradient(135deg, #FDE68A 0%, #B45309 100%)"
                  : "linear-gradient(135deg, #CBD5E1 0%, #64748B 100%)",
                border: "1px solid rgba(255,255,255,0.45)",
              }}
            >
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/35" />
              <div className="absolute inset-y-0 left-1/3 w-[1px] bg-black/35" />
              <div className="absolute inset-y-0 right-1/3 w-[1px] bg-black/35" />
            </div>

            <div className="min-w-0">
              <div className="font-wta-condensed text-2xl sm:text-3xl font-bold text-white truncate tracking-wide">
                {player.name}
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 truncate mt-0.5">
                <span
                  className="font-extrabold"
                  style={{ color: isVip ? "#FDE68A" : "#00DC7D" }}
                >
                  {catInfo.name}
                </span>
                <span>•</span>
                <span className="truncate font-semibold">
                  {clubObj ? clubObj.shortName : "Independiente"}
                </span>
              </div>
            </div>
          </div>

          {clubObj && (
            <SafeImage
              src={clubObj.shield}
              alt={clubObj.shortName}
              fallbackText={clubObj.shortName}
              circular
              style={{
                width: 44,
                height: 44,
                border: "2px solid rgba(255,255,255,0.38)",
                background: "#0A1633",
              }}
            />
          )}
        </div>

        {/* Pie del Carnet: ID Monoespaciado + Gemas + Botón VIP */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/15">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                ID CREDENCIAL
              </div>
              <div
                className="font-mono-code text-xs sm:text-sm font-bold tracking-wider"
                style={{ color: isVip ? "#FDE68A" : "#FFFFFF" }}
              >
                {memberCode}
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-black/35 border border-white/15 flex items-center gap-1.5">
              <span className="text-xs">💎</span>
              <span className="font-wta-condensed text-base font-bold text-emerald-400 tabular-nums">
                {player.gems ?? 150}
              </span>
            </div>
          </div>

          {onOpenVipUpgrade && (
            <button
              type="button"
              onClick={onOpenVipUpgrade}
              className="touch-btn px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg"
              style={{
                minHeight: 38,
                background: isVip
                  ? "rgba(253, 230, 138, 0.20)"
                  : "linear-gradient(135deg, #FDE68A 0%, #D97706 100%)",
                color: isVip ? "#FDE68A" : "#0A1633",
                border: isVip ? "1.5px solid rgba(253, 230, 138, 0.5)" : "none",
              }}
            >
              {isVip ? "Beneficios VIP" : "Activar Pase VIP"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 24. COMPARADOR MONUMENTAL "HEAD TO HEAD" (FORMATO OFICIAL WTA TOUR:
//     SABALENKA vs. RYBAKINA — image_5c6237.jpg, image_5c61fb.jpg, image_5c61dd.jpg)
// ============================================================================
export const AtpHeadToHeadModal = ({
  isOpen,
  onClose,
  initialPlayerA,
  initialPlayerB,
  allPlayers = [],
  completedMatches = [],
  clubs = HUANCAYO_CLUBS,
  onLaunchChallenge,
}) => {
  const activePlayers = useMemo(
    () =>
      [...allPlayers]
        .filter((p) => p.activeStatus !== "inactive")
        .sort((a, b) => b.elo - a.elo),
    [allPlayers]
  );

  const [playerAId, setPlayerAId] = useState(
    initialPlayerA?.id || activePlayers[0]?.id || "p_pablo"
  );
  const [playerBId, setPlayerBId] = useState(
    initialPlayerB?.id || activePlayers[2]?.id || "p_jose"
  );
  const [pickerSide, setPickerSide] = useState(null); // null | 'A' | 'B'
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeTab, setScopeTab] = useState("career"); // 'career' | 'ytd'
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'clay'

  useEffect(() => {
    if (initialPlayerA?.id) setPlayerAId(initialPlayerA.id);
    if (initialPlayerB?.id && initialPlayerB.id !== initialPlayerA?.id) {
      setPlayerBId(initialPlayerB.id);
    } else if (initialPlayerA?.id && activePlayers.length > 1) {
      const alt = activePlayers.find((p) => p.id !== initialPlayerA.id);
      if (alt) setPlayerBId(alt.id);
    }
    setPickerSide(null);
    setSearchQuery("");
  }, [initialPlayerA, initialPlayerB, activePlayers, isOpen]);

  if (!isOpen) return null;

  const playerA =
    activePlayers.find((p) => p.id === playerAId) || activePlayers[0];
  const playerB =
    activePlayers.find((p) => p.id === playerBId) ||
    activePlayers.find((p) => p.id !== playerA?.id) ||
    activePlayers[0];

  const rankA = activePlayers.findIndex((p) => p.id === playerA?.id) + 1;
  const rankB = activePlayers.findIndex((p) => p.id === playerB?.id) + 1;

  const catA = getCategoryByElo(playerA?.elo, playerA?.seasonMatches);
  const catB = getCategoryByElo(playerB?.elo, playerB?.seasonMatches);

  const clubA = getClubById(playerA?.clubId, clubs);
  const clubB = getClubById(playerB?.clubId, clubs);

  // Enfrentamientos directos entre A y B
  const directMatches = completedMatches.filter(
    (m) =>
      (m.challengerId === playerA?.id && m.challengedId === playerB?.id) ||
      (m.challengerId === playerB?.id && m.challengedId === playerA?.id)
  );

  const winsA = directMatches.filter((m) => m.winnerId === playerA?.id).length;
  const winsB = directMatches.filter((m) => m.winnerId === playerB?.id).length;
  const totalH2H = winsA + winsB;

  const winPctA =
    totalH2H === 0 ? "50.0" : ((winsA / totalH2H) * 100).toFixed(1);
  const winPctB =
    totalH2H === 0 ? "50.0" : ((winsB / totalH2H) * 100).toFixed(1);

  // Anillo Radial Verde Esmeralda estilo WTA (image_5c61fb.jpg)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const ratioA = totalH2H === 0 ? 0.5 : winsA / totalH2H;
  const strokeDashA = ratioA * circumference;

  const careerWinsA =
    scopeTab === "career"
      ? playerA?.careerWins ?? playerA?.wins ?? 0
      : playerA?.wins ?? 0;
  const careerLossesA =
    scopeTab === "career"
      ? playerA?.careerLosses ?? playerA?.losses ?? 0
      : playerA?.losses ?? 0;

  const careerWinsB =
    scopeTab === "career"
      ? playerB?.careerWins ?? playerB?.wins ?? 0
      : playerB?.wins ?? 0;
  const careerLossesB =
    scopeTab === "career"
      ? playerB?.careerLosses ?? playerB?.losses ?? 0
      : playerB?.losses ?? 0;

  const careerStatsRows = [
    {
      label: "Títulos Oficiales",
      left: playerA?.titlesCount ?? (rankA <= 3 ? 2 : 1),
      right: playerB?.titlesCount ?? (rankB <= 3 ? 2 : 1),
    },
    {
      label: "Puntos Ranking ELO",
      left: Number(playerA?.elo || 0).toLocaleString("es-PE"),
      right: Number(playerB?.elo || 0).toLocaleString("es-PE"),
    },
    {
      label: "Ganados / Perdidos (Singles)",
      left: `${careerWinsA}/${careerLossesA}`,
      right: `${careerWinsB}/${careerLossesB}`,
    },
    {
      label: "Racha Actual",
      left: playerA?.streak > 0 ? `+${playerA.streak} Seguidas` : "1 Activa",
      right: playerB?.streak > 0 ? `+${playerB.streak} Seguidas` : "1 Activa",
    },
    {
      label: "Gemas Acumuladas 💎",
      left: `${playerA?.gems ?? 150} 💎`,
      right: `${playerB?.gems ?? 150} 💎`,
    },
  ];

  const playerProfileRows = [
    {
      label: "Mejor Ranking Alcanzado",
      left: `#${playerA?.careerHighRank || Math.min(rankA, 2)}`,
      right: `#${playerB?.careerHighRank || Math.min(rankB, 3)}`,
    },
    {
      label: "Ranking Actual",
      left: `#${rankA}`,
      right: `#${rankB}`,
    },
    {
      label: "Categoría Oficial",
      left: catA.name,
      right: catB.name,
    },
    {
      label: "Edad",
      left: `${playerA?.age || 26} años${playerA?.age >= 40 ? " (+40 Master)" : ""}`,
      right: `${playerB?.age || 28} años${playerB?.age >= 40 ? " (+40 Master)" : ""}`,
    },
    {
      label: "Sede / Club Oficial",
      left: clubA ? clubA.shortName : "Independiente",
      right: clubB ? clubB.shortName : "Independiente",
    },
    {
      label: "Estatura",
      left: playerA?.heightLabel || "1.78 m",
      right: playerB?.heightLabel || "1.76 m",
    },
    {
      label: "Mano de Juego",
      left: playerA?.hand || "Diestro",
      right: playerB?.hand || "Diestro",
    },
    {
      label: "Mejor Golpe (Firma)",
      left: playerA?.bestShot || "Derecha (Forehand)",
      right: playerB?.bestShot || "Derecha (Forehand)",
    },
  ];

  const filteredPickerPlayers = activePlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl my-auto border border-white/25 flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, #1AE68A 0%, #80F5C4 34%, #EAFBF3 70%, #F5F9F7 100%)",
          color: "#1E0734",
          maxHeight: "94dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior de Navegación WTA Head to Head */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1E0734]/80">
            <span>Inicio</span>
            <span>›</span>
            <span>Jugadores</span>
            <span>›</span>
            <span className="underline font-black text-[#1E0734]">Head To Head</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full bg-[#1E0734] text-white shadow-lg"
            aria-label="Cerrar Head to Head"
          >
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Cuerpo Scrolleable Monumental */}
        <div className="overflow-y-auto px-4 sm:px-8 pb-8 space-y-6 no-scrollbar">
          {/* TÍTULO MONUMENTAL CENTRADO "HEAD TO HEAD" (image_5c6237.jpg) */}
          <div className="text-center pt-1">
            <h1
              className="font-wta-condensed text-5xl sm:text-6xl font-bold tracking-tight"
              style={{ color: "#23083C" }}
            >
              HEAD TO HEAD
            </h1>
          </div>

          {/* SECCIÓN SUPERIOR: RETRATOS GRANDES LATERALES + 2 TARJETAS BLANCAS CON "SWAP PLAYER" */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-4 pt-2">
            {/* Retrato Grande Jugador A (Izquierda) */}
            <div className="md:col-span-3 flex flex-col items-center">
              <div className="relative w-36 h-44 sm:w-44 sm:h-52 rounded-3xl overflow-hidden shadow-xl border-2 border-white bg-[#23083C]/10">
                <SafeImage
                  src={playerA?.heroPhoto || playerA?.avatar}
                  alt={playerA?.name}
                  fallbackText={playerA?.name}
                  style={{ width: "100%", height: "100%" }}
                />
                <span
                  className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-wta-condensed font-bold"
                  style={{ background: "#23083C", color: "#00DC7D" }}
                >
                  #{rankA}
                </span>
              </div>
            </div>

            {/* Centro: Las 2 Tarjetas Blancas Gemelas con botón inferior "🔄 CAMBIAR JUGADOR" */}
            <div className="md:col-span-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Tarjeta Blanca Jugador A */}
                <div className="rounded-2xl overflow-hidden bg-white shadow-xl border border-black/5 flex flex-col justify-between">
                  <div className="p-4 sm:p-5 text-center space-y-1.5">
                    <div
                      className="font-wta-condensed text-2xl sm:text-3xl font-bold leading-none"
                      style={{ color: "#23083C" }}
                    >
                      {playerA?.name}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      {clubA && (
                        <SafeImage
                          src={clubA.shield}
                          alt={clubA.shortName}
                          circular
                          style={{ width: 18, height: 18 }}
                        />
                      )}
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 truncate">
                        {clubA ? clubA.shortName : "HUANCAYO"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPickerSide(pickerSide === "A" ? null : "A")
                    }
                    className="touch-btn w-full py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white"
                    style={{ background: "#23083C", minHeight: 40 }}
                  >
                    <Icons.Swap size={14} />
                    <span>Cambiar Jugador</span>
                  </button>
                </div>

                {/* Tarjeta Blanca Jugador B */}
                <div className="rounded-2xl overflow-hidden bg-white shadow-xl border border-black/5 flex flex-col justify-between">
                  <div className="p-4 sm:p-5 text-center space-y-1.5">
                    <div
                      className="font-wta-condensed text-2xl sm:text-3xl font-bold leading-none"
                      style={{ color: "#23083C" }}
                    >
                      {playerB?.name}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      {clubB && (
                        <SafeImage
                          src={clubB.shield}
                          alt={clubB.shortName}
                          circular
                          style={{ width: 18, height: 18 }}
                        />
                      )}
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 truncate">
                        {clubB ? clubB.shortName : "HUANCAYO"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPickerSide(pickerSide === "B" ? null : "B")
                    }
                    className="touch-btn w-full py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white"
                    style={{ background: "#23083C", minHeight: 40 }}
                  >
                    <Icons.Swap size={14} />
                    <span>Cambiar Jugador</span>
                  </button>
                </div>
              </div>

              {/* Píldoras de Filtro Centrales Estilo WTA (BY SURFACE / CAREER / YTD 2026) */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFilterMode(filterMode === "all" ? "clay" : "all")
                  }
                  className="px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all"
                  style={{
                    background: "rgba(35, 8, 60, 0.12)",
                    color: "#23083C",
                  }}
                >
                  🎾 Superficie: Arcilla Huancayo
                </button>

                <div
                  className="inline-flex rounded-full p-1"
                  style={{ background: "rgba(35, 8, 60, 0.14)" }}
                >
                  <button
                    type="button"
                    onClick={() => setScopeTab("career")}
                    className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all"
                    style={{
                      background:
                        scopeTab === "career" ? "#23083C" : "transparent",
                      color: scopeTab === "career" ? "#FFFFFF" : "#23083C",
                    }}
                  >
                    Carrera Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeTab("ytd")}
                    className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all"
                    style={{
                      background:
                        scopeTab === "ytd" ? "#23083C" : "transparent",
                      color: scopeTab === "ytd" ? "#FFFFFF" : "#23083C",
                    }}
                  >
                    Temporada 2026
                  </button>
                </div>
              </div>
            </div>

            {/* Retrato Grande Jugador B (Derecha) */}
            <div className="md:col-span-3 flex flex-col items-center">
              <div className="relative w-36 h-44 sm:w-44 sm:h-52 rounded-3xl overflow-hidden shadow-xl border-2 border-white bg-[#23083C]/10">
                <SafeImage
                  src={playerB?.heroPhoto || playerB?.avatar}
                  alt={playerB?.name}
                  fallbackText={playerB?.name}
                  style={{ width: "100%", height: "100%" }}
                />
                <span
                  className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-xs font-wta-condensed font-bold"
                  style={{ background: "#23083C", color: "#D6FF00" }}
                >
                  #{rankB}
                </span>
              </div>
            </div>
          </div>

          {/* Buscador Desplegable cuando se toca "🔄 CAMBIAR JUGADOR" */}
          {pickerSide && (
            <div
              className="rounded-3xl p-4 space-y-3 shadow-2xl max-w-lg mx-auto"
              style={{
                background: "#23083C",
                color: "#FFFFFF",
                border: "2px solid #00DC7D",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Seleccionando Jugador {pickerSide === "A" ? "Izquierdo" : "Derecho"}
                </span>
                <button
                  type="button"
                  onClick={() => setPickerSide(null)}
                  className="text-xs font-bold text-slate-300"
                >
                  Cerrar ✕
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escribe el nombre del tenista..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm text-white focus:outline-none"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-1.5 no-scrollbar">
                {filteredPickerPlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (pickerSide === "A") setPlayerAId(p.id);
                      else setPlayerBId(p.id);
                      setPickerSide(null);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/15 text-left text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <SafeImage
                        src={p.avatar}
                        alt={p.name}
                        circular
                        style={{ width: 32, height: 32 }}
                      />
                      <span className="font-bold text-white">{p.name}</span>
                    </div>
                    <span className="font-wta-condensed text-lg font-bold text-emerald-400 tabular-nums">
                      {p.elo} PTS
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MONOLITO CENTRAL OSCURO: ANILLO RADIAL + "CAREER STATS" (image_5c61fb.jpg) */}
          <div
            className="rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-w-2xl mx-auto"
            style={{
              background: "#23083C",
              color: "#FFFFFF",
            }}
          >
            {/* Marcador Cara a Cara + Anillo Radial Verde Esmeralda */}
            <div className="grid grid-cols-3 items-center text-center gap-2">
              {/* Victorias Jugador A */}
              <div>
                <div
                  className="font-wta-condensed text-5xl sm:text-6xl font-bold tabular-nums"
                  style={{ color: "#00DC7D" }}
                >
                  {winsA}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
                  {winPctA}% Win
                </div>
              </div>

              {/* Anillo Radial Central con Total Jugados ("Played") */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.14)"
                      strokeWidth="9"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="none"
                      stroke="#00DC7D"
                      strokeWidth="9"
                      strokeDasharray={`${strokeDashA} ${circumference}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-wta-condensed text-4xl sm:text-5xl font-bold text-white tabular-nums leading-none">
                      {totalH2H}
                    </span>
                    <span className="text-xs font-bold text-slate-300 mt-1">
                      Jugados
                    </span>
                  </div>
                </div>
              </div>

              {/* Victorias Jugador B */}
              <div>
                <div className="font-wta-condensed text-5xl sm:text-6xl font-bold text-white tabular-nums">
                  {winsB}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
                  {winPctB}% Win
                </div>
              </div>
            </div>

            {/* Subtítulo Condensado "CAREER STATS" */}
            <div className="text-center pt-2">
              <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold tracking-wide text-white">
                {scopeTab === "career"
                  ? "ESTADÍSTICAS DE CARRERA"
                  : "ESTADÍSTICAS TEMPORADA 2026"}
              </h2>
            </div>

            {/* Filas Simétricas de Estadísticas dentro del Monolito Oscuro */}
            <div className="divide-y divide-white/15">
              {careerStatsRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-3 items-center py-3.5 text-sm sm:text-base"
                >
                  <div className="font-extrabold text-white text-left tabular-nums">
                    {row.left}
                  </div>
                  <div className="text-center text-xs sm:text-sm font-semibold text-slate-300">
                    {row.label}
                  </div>
                  <div className="font-extrabold text-white text-right tabular-nums">
                    {row.right}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón de Acción Directa: Retar desde el Head-to-Head */}
            {onLaunchChallenge && playerA?.id !== playerB?.id && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchChallenge(playerB);
                  }}
                  className="touch-btn px-8 py-3.5 rounded-full font-display font-black text-sm uppercase tracking-wider shadow-xl"
                  style={{
                    background: "#00DC7D",
                    color: "#1E0734",
                  }}
                >
                  ⚔️ Lanzar Desafío Oficial a {playerB?.name.split(" ")[0]}
                </button>
              </div>
            )}
          </div>

          {/* TARJETA BLANCA INFERIOR: "PLAYER PROFILES" (image_5c61dd.jpg) */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl max-w-2xl mx-auto space-y-5 border border-black/5">
            <div className="text-center">
              <h2
                className="font-wta-condensed text-3xl sm:text-4xl font-bold tracking-wide"
                style={{ color: "#23083C" }}
              >
                PERFILES DE JUGADOR
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {playerProfileRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-3 items-center py-3.5 text-sm sm:text-base"
                >
                  <div
                    className="font-extrabold text-left tabular-nums"
                    style={{ color: "#1E0734" }}
                  >
                    {row.left}
                  </div>
                  <div className="text-center text-xs sm:text-sm font-semibold text-slate-500">
                    {row.label}
                  </div>
                  <div
                    className="font-extrabold text-right tabular-nums"
                    style={{ color: "#1E0734" }}
                  >
                    {row.right}
                  </div>
                </div>
              ))}
            </div>

            {/* Historial de Partidos Jugados Entre Ambos */}
            {directMatches.length > 0 && (
              <div className="pt-4 space-y-2.5">
                <div
                  className="text-xs font-extrabold uppercase tracking-wider text-center"
                  style={{ color: "#23083C" }}
                >
                  Historial de Marcadores Directos ({directMatches.length})
                </div>
                <div className="space-y-2">
                  {directMatches.map((m) => {
                    const winnerName =
                      m.winnerId === playerA?.id ? playerA?.name : playerB?.name;
                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl px-4 py-3 flex items-center justify-between text-xs sm:text-sm"
                        style={{ background: "#F4F1F8", color: "#1E0734" }}
                      >
                        <div>
                          <span className="font-extrabold">{winnerName}</span>{" "}
                          <span>ganó por</span>{" "}
                          <span
                            className="font-mono-code font-extrabold px-2 py-0.5 rounded"
                            style={{ background: "#00DC7D", color: "#1E0734" }}
                          >
                            {m.score}
                          </span>
                        </div>
                        <span className="font-bold text-slate-600">
                          {m.clubName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 25. GENERADOR DE PÓSTER VERTICAL 9:16 (ESTILO TRANSMISIÓN WTA / ATP)
// ============================================================================
export const StoryPosterModal = ({
  isOpen,
  onClose,
  matchData,
  players = [],
}) => {
  const canvasRef = useRef(null);
  const [posterUrl, setPosterUrl] = useState(null);

  useEffect(() => {
    if (!isOpen || !matchData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    // Fondo Púrpura Noche & Esmeralda estilo WTA Finals
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, "#1E0734");
    grad.addColorStop(0.52, "#120422");
    grad.addColorStop(1, "#06281B");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Marco de cancha
    ctx.strokeStyle = "rgba(0, 220, 125, 0.28)";
    ctx.lineWidth = 5;
    ctx.strokeRect(70, 90, 940, 1740);

    // Cabecera
    ctx.fillStyle = "#00DC7D";
    ctx.font = "900 58px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MATCHPOINT HUANCAYO", 540, 225);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "700 32px Plus Jakarta Sans, sans-serif";
    ctx.fillText(
      matchData.isFriendly
        ? "RESULTADO EXHIBICIÓN HEAD TO HEAD"
        : "RESULTADO OFICIAL DEL CIRCUITO",
      540,
      290
    );

    const winner = players.find((p) => p.id === matchData.winnerId);
    const loser = players.find((p) => p.id === matchData.loserId);

    const winnerName = winner?.name || matchData.winnerName || "Ganador";
    const loserName = loser?.name || matchData.loserName || "Rival";

    // Caja Central Ganador
    ctx.fillStyle = "rgba(0, 220, 125, 0.12)";
    ctx.fillRect(110, 410, 860, 350);
    ctx.strokeStyle = "#00DC7D";
    ctx.lineWidth = 4;
    ctx.strokeRect(110, 410, 860, 350);

    ctx.fillStyle = "#00DC7D";
    ctx.font = "800 32px Plus Jakarta Sans, sans-serif";
    ctx.fillText("🏆 VICTORIA OFICIAL", 540, 495);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 72px Outfit, sans-serif";
    ctx.fillText(winnerName.toUpperCase(), 540, 595);

    if (!matchData.isFriendly && matchData.winnerDelta) {
      ctx.fillStyle = "#D6FF00";
      ctx.font = "800 42px Plus Jakarta Sans, sans-serif";
      ctx.fillText(
        `+${matchData.winnerDelta} PTS RANKING · +50 💎 GEMAS`,
        540,
        690
      );
    }

    // Marcador Gigante
    ctx.fillStyle = "#160428";
    ctx.fillRect(130, 840, 820, 260);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(130, 840, 820, 260);

    ctx.fillStyle = "#00DC7D";
    ctx.font = "900 112px Outfit, sans-serif";
    ctx.fillText(matchData.score || "6-4, 6-3", 540, 1010);

    // Rival
    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 34px Plus Jakarta Sans, sans-serif";
    ctx.fillText("FRENTE A", 540, 1215);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 56px Outfit, sans-serif";
    ctx.fillText(loserName.toUpperCase(), 540, 1300);

    // Sede y Fecha
    ctx.fillStyle = "#00DC7D";
    ctx.font = "700 40px Plus Jakarta Sans, sans-serif";
    ctx.fillText(matchData.clubName || "Country Club Los Huancas", 540, 1510);

    ctx.fillStyle = "#CBD5E1";
    ctx.font = "600 32px Plus Jakarta Sans, sans-serif";
    ctx.fillText(matchData.dateLabel || "Temporada 2026", 540, 1575);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 34px Outfit, sans-serif";
    ctx.fillText("@MatchPoint.Oficial · Huancayo Tour", 540, 1745);

    try {
      setPosterUrl(canvas.toDataURL("image/png"));
    } catch {
      setPosterUrl(null);
    }
  }, [isOpen, matchData, players]);

  if (!isOpen || !matchData) return null;

  const handleDownloadPoster = () => {
    if (!posterUrl) return;
    const a = document.createElement("a");
    a.href = posterUrl;
    a.download = `MatchPoint-Story-${Date.now()}.png`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-sm rounded-3xl p-5 space-y-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-lg">
              Póster Oficial 9:16
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Listo para Instagram Stories o Estados de WhatsApp
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-9 h-9 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={18} />
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {posterUrl && (
          <div className="rounded-2xl overflow-hidden border border-white/20 bg-black/40 max-h-[55dvh] flex justify-center">
            <img
              src={posterUrl}
              alt="Póster de Victoria"
              className="h-full max-h-[52dvh] w-auto object-contain"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadPoster}
            className="touch-btn py-3 px-4 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
            style={{ background: "#00DC7D", color: "#0A1633" }}
          >
            Descargar Imagen
          </button>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn py-3 px-4 rounded-xl font-semibold text-xs border"
            style={{
              borderColor: "var(--border-strong)",
              color: "var(--text-main)",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 5 DE 12 ===

// === INICIO DEL BLOQUE 6 DE 12 ===

// ============================================================================
// 26. HEADER SUPERIOR OFICIAL (CON SALDO VIVO DE 💎 GEMAS, PRO SHOP Y AVISOS)
// ============================================================================
export const TopHeaderBar = ({
  currentUser,
  onOpenDrawer,
  onOpenProShop,
  onOpenBulletin,
  onSecretAdminTrigger,
  unreadBulletinCount = 0,
}) => {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  const handleBrandSecretTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (onSecretAdminTrigger) onSecretAdminTrigger();
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1600);
  };

  return (
    <header className="safe-top-header flex items-center justify-between gap-2 select-none">
      {/* Izquierda: Menú + Marca MATCHPOINT */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="touch-btn w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--bg-subtle)",
            border: "1.5px solid var(--border-strong)",
            color: "var(--text-main)",
          }}
          aria-label="Abrir menú principal"
        >
          <Icons.Menu size={22} />
        </button>

        <div
          onClick={handleBrandSecretTap}
          className="flex items-center gap-2.5 cursor-pointer min-w-0 py-1"
          title="MATCHPOINT Huancayo"
        >
          <SafeImage
            src={ASSETS.logo}
            alt="MATCHPOINT"
            fallbackText="MP"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1.5px solid #00DC7D",
            }}
          />
          <div className="min-w-0">
            <span className="font-wta-condensed font-bold text-2xl sm:text-3xl tracking-wider leading-none block truncate">
              MATCHPOINT
            </span>
          </div>
        </div>
      </div>

      {/* Derecha: Píldora de Gemas 💎 + Botón Pro Shop + Notificaciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Saldo Vivo de Gemas MatchPoint */}
        <button
          type="button"
          onClick={onOpenProShop}
          className="touch-btn px-3 rounded-full flex items-center gap-1.5"
          style={{
            height: 40,
            minHeight: 40,
            background: "rgba(0, 220, 125, 0.16)",
            border: "1.5px solid #00DC7D",
            color: "var(--text-main)",
          }}
          title="Tus Gemas MatchPoint (Toca para canjear)"
        >
          <span className="text-sm">💎</span>
          <span className="font-wta-condensed font-bold text-lg tabular-nums">
            {currentUser?.gems ?? 150}
          </span>
        </button>

        {/* Botón Pro Shop en 1 sola línea de alto impacto */}
        <button
          type="button"
          onClick={onOpenProShop}
          className="touch-btn px-3.5 rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-md"
          style={{
            height: 40,
            minHeight: 40,
            background: "#D6FF00",
            color: "#0A1633",
            border: "1.5px solid rgba(10, 22, 51, 0.2)",
          }}
        >
          <Icons.Bag size={16} />
          <span className="font-display font-black text-xs sm:text-sm tracking-tight">
            Pro Shop
          </span>
        </button>

        {/* Botón de Notificaciones y Prensa */}
        <button
          type="button"
          onClick={onOpenBulletin}
          className="touch-btn relative w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{
            background: "var(--bg-subtle)",
            border: "1.5px solid var(--border-strong)",
            color: "var(--text-main)",
          }}
          aria-label="Notificaciones y Prensa"
        >
          <Icons.Newspaper size={20} />
          {unreadBulletinCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-xs font-black flex items-center justify-center tabular-nums shadow"
              style={{
                background: "#00DC7D",
                color: "#0A1633",
                border: "2px solid var(--bg-card)",
              }}
            >
              {unreadBulletinCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

// ============================================================================
// 27. VENTANA "NOTIFICACIONES" (FORMATO EXACTO WTA image_5c61bf.png)
//     - Superficie Blanco Marfil (#FAF9F5) con texto Púrpura Profundo (#1B0930)
//     - Botón circular ✕ arriba a la izquierda + Título condensado NOTIFICACIONES
//     - Píldora gris de categoría + Punto verde a la derecha + Botón borde verde
// ============================================================================
export const BulletinAndNewsModal = ({
  isOpen,
  onClose,
  currentUser,
  challenges = [],
  tournaments = [],
  players = [],
  clubs = HUANCAYO_CLUBS,
  newsItems = FALLBACK_EDITORIAL_NEWS,
  liveTicker = ATP_WTA_LIVE_TICKER,
  onAcceptChallenge,
  onOpenCounterProposal,
  onGoToChallenges,
  onGoToTournaments,
}) => {
  const [activeTab, setActiveTab] = useState("notificaciones"); // 'notificaciones' | 'prensa'

  if (!isOpen) return null;

  const myIncomingPending = challenges.filter(
    (c) => c.status === "pending" && c.challengedId === currentUser?.id
  );
  const myConfirmedMatches = challenges.filter(
    (c) =>
      c.status === "confirmed" &&
      (c.challengerId === currentUser?.id || c.challengedId === currentUser?.id)
  );

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col border border-black/10"
        style={{
          background: "#FAF9F5",
          color: "#1B0930",
          maxHeight: "90dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Exacta WTA Notifications (Botón ✕ a la izquierda + Título Condensado) */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-black/10 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-11 h-11 rounded-full border border-black/15 flex items-center justify-center text-[#1B0930] bg-white hover:bg-slate-100"
            aria-label="Cerrar notificaciones"
          >
            <Icons.Close size={20} />
          </button>

          <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold tracking-tight text-[#1B0930]">
            NOTIFICACIONES
          </h2>

          <div className="w-11" />
        </div>

        {/* Selector de Pestaña: Avisos del Circuito vs Prensa Internacional */}
        <div className="grid grid-cols-2 px-6 bg-white border-b border-black/10">
          <button
            type="button"
            onClick={() => setActiveTab("notificaciones")}
            className="py-3 text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color: activeTab === "notificaciones" ? "#1B0930" : "#64748B",
            }}
          >
            Avisos del Tour ({myIncomingPending.length + myConfirmedMatches.length + 1})
            {activeTab === "notificaciones" && (
              <span
                className="absolute bottom-0 inset-x-4 h-1 rounded-full"
                style={{ background: "#00DC7D" }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("prensa")}
            className="py-3 text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color: activeTab === "prensa" ? "#1B0930" : "#64748B",
            }}
          >
            Prensa & ATP/WTA
            {activeTab === "prensa" && (
              <span
                className="absolute bottom-0 inset-x-4 h-1 rounded-full"
                style={{ background: "#00DC7D" }}
              />
            )}
          </button>
        </div>

        {/* Lista Scrolleable de Tarjetas WTA Notifications */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {activeTab === "notificaciones" ? (
            <div className="divide-y divide-black/10">
              {/* 1. Desafíos Recibidos Pendientes */}
              {myIncomingPending.map((ch) => {
                const challenger = players.find((p) => p.id === ch.challengerId);
                const clubObj = getClubById(ch.clubId, clubs);
                return (
                  <div key={ch.id} className="py-4 first:pt-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                        style={{ background: "#E9E4F0", color: "#1B0930" }}
                      >
                        DESAFÍO OFICIAL RECIBIDO
                      </span>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#00DC7D" }}
                      />
                    </div>

                    <div>
                      <h4 className="font-display font-black text-lg text-[#1B0930] leading-snug">
                        {challenger?.name} te ha lanzado un reto en {ch.customClubName}
                      </h4>
                      <p className="text-sm text-slate-700 mt-1">
                        Fecha propuesta: <strong>{ch.dateTimeLabel}</strong> ·{" "}
                        {ch.ballAgreement}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Hace instantes</p>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onAcceptChallenge && onAcceptChallenge(ch.id)}
                          className="touch-btn px-5 py-2 rounded-full font-display font-extrabold text-xs uppercase tracking-wider"
                          style={{
                            minHeight: 38,
                            background: "#00DC7D",
                            color: "#1B0930",
                          }}
                        >
                          Aceptar Reto
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onOpenCounterProposal) onOpenCounterProposal(ch);
                          }}
                          className="touch-btn px-4 py-2 rounded-full font-display font-extrabold text-xs uppercase tracking-wider bg-white"
                          style={{
                            minHeight: 38,
                            border: "1.5px solid #00A859",
                            color: "#1B0930",
                          }}
                        >
                          Reprogramar / Declinar
                        </button>
                      </div>

                      {clubObj && (
                        <SafeImage
                          src={clubObj.shield}
                          alt={clubObj.shortName}
                          circular
                          style={{ width: 42, height: 42 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 2. Duelos Confirmados Listos para Jugar */}
              {myConfirmedMatches.map((ch) => {
                const rivalId =
                  ch.challengerId === currentUser?.id
                    ? ch.challengedId
                    : ch.challengerId;
                const rival = players.find((p) => p.id === rivalId);
                const clubObj = getClubById(ch.clubId, clubs);

                return (
                  <div key={ch.id} className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                        style={{ background: "#E9E4F0", color: "#1B0930" }}
                      >
                        PARTIDO CONFIRMADO
                      </span>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#00DC7D" }}
                      />
                    </div>

                    <div>
                      <h4 className="font-display font-black text-lg text-[#1B0930]">
                        {currentUser?.name} vs. {rival?.name} — {ch.customClubName}
                      </h4>
                      <p className="text-sm text-slate-700 mt-0.5">
                        Programado para el {ch.dateTimeLabel}. Recuerda que sumarás +50 💎 por victoria o +25 💎 por esfuerzo.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onGoToChallenges) onGoToChallenges();
                        }}
                        className="touch-btn px-5 py-2 rounded-full font-display font-extrabold text-xs uppercase tracking-wider bg-white"
                        style={{
                          minHeight: 38,
                          border: "1.5px solid #00A859",
                          color: "#1B0930",
                        }}
                      >
                        VER CARTELERA
                      </button>

                      {clubObj && (
                        <SafeImage
                          src={clubObj.shield}
                          alt={clubObj.shortName}
                          circular
                          style={{ width: 40, height: 40 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 3. Actualizaciones de Torneos Oficiales (Idéntico a TOURNAMENT UPDATE image_5c61bf.png) */}
              {tournaments.slice(0, 2).map((t) => {
                const clubObj = getClubById(t.clubId, clubs);
                return (
                  <div key={t.id} className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                        style={{ background: "#E9E4F0", color: "#1B0930" }}
                      >
                        ACTUALIZACIÓN DE TORNEO
                      </span>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#00DC7D" }}
                      />
                    </div>

                    <div>
                      <h4 className="font-display font-black text-lg text-[#1B0930]">
                        {t.title} - {t.clubName}
                      </h4>
                      <p className="text-sm text-slate-700 mt-0.5">
                        Cuadro eliminatorio y Ronda Consuelo publicados ({t.dateRange}).
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Temporada 2026</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onGoToTournaments) onGoToTournaments();
                        }}
                        className="touch-btn px-5 py-2 rounded-full font-display font-extrabold text-xs uppercase tracking-wider bg-white"
                        style={{
                          minHeight: 38,
                          border: "1.5px solid #00A859",
                          color: "#1B0930",
                        }}
                      >
                        VER TORNEO
                      </button>

                      {clubObj && (
                        <SafeImage
                          src={clubObj.shield}
                          alt={clubObj.shortName}
                          circular
                          style={{ width: 42, height: 42 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Pestaña 2: Marcadores y Prensa Internacional */
            <div className="space-y-4">
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {liveTicker.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-[210px] rounded-2xl p-3.5 bg-white border border-black/10 shadow-sm block"
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-purple-900">{item.tour}</span>
                      <span className="text-emerald-600">{item.status}</span>
                    </div>
                    <div className="font-display font-black text-sm text-[#1B0930] mt-1.5">
                      {item.player1} d. {item.player2}
                    </div>
                    <div className="font-mono-code font-bold text-sm text-emerald-700 mt-0.5">
                      {item.score}
                    </div>
                  </a>
                ))}
              </div>

              {newsItems.map((article) => (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl overflow-hidden bg-white border border-black/10 shadow-sm"
                >
                  {article.imageUrl && (
                    <div className="h-40 w-full overflow-hidden relative">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-[#1B0930] text-[#00DC7D]">
                        {article.source}
                      </span>
                    </div>
                  )}
                  <div className="p-4 space-y-1.5">
                    <h4 className="font-display font-black text-base text-[#1B0930] leading-snug">
                      {article.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>{article.publishedAt}</span>
                      <span className="font-extrabold text-emerald-700">
                        Leer nota completa →
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 28. MODAL DE AJUSTES DE PERFIL, SUBIDA DE FOTOS REALES Y ATUENDOS GRAND SLAM
// ============================================================================
export const ProfileSettingsModal = ({
  isOpen,
  onClose,
  player,
  clubs = HUANCAYO_CLUBS,
  onSaveProfile,
  onOpenSwitchAccount,
  onOpenTutorialOnce,
}) => {
  const [name, setName] = useState(player?.name || "");
  const [age, setAge] = useState(player?.age || 26);
  const [heightLabel, setHeightLabel] = useState(player?.heightLabel || "1.78 m");
  const [hand, setHand] = useState(player?.hand || "Diestro");
  const [bestShot, setBestShot] = useState(
    player?.bestShot || "Derecha (Forehand)"
  );
  const [clubId, setClubId] = useState(player?.clubId || "country");
  const [profileThemeId, setProfileThemeId] = useState(
    player?.profileThemeId || "wta_finals"
  );
  const [selectedDays, setSelectedDays] = useState(
    player?.availableDays || ["M", "J", "S"]
  );
  const [selectedSlots, setSelectedSlots] = useState(
    player?.availableSlots || ["18:00–22:00"]
  );
  const [whatsappPrivate, setWhatsappPrivate] = useState(
    Boolean(player?.whatsappPrivate)
  );
  const [avatarPreview, setAvatarPreview] = useState(player?.avatar || "");
  const [heroPhotoPreview, setHeroPhotoPreview] = useState(
    player?.heroPhoto || player?.avatar || ""
  );
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");

  const avatarInputRef = useRef(null);
  const heroInputRef = useRef(null);

  useEffect(() => {
    if (player && isOpen) {
      setName(player.name || "");
      setAge(player.age || 26);
      setHeightLabel(player.heightLabel || "1.78 m");
      setHand(player.hand || "Diestro");
      setBestShot(player.bestShot || "Derecha (Forehand)");
      setClubId(player.clubId || "country");
      setProfileThemeId(player.profileThemeId || "wta_finals");
      setSelectedDays(player.availableDays || ["M", "J", "S"]);
      setSelectedSlots(player.availableSlots || ["18:00–22:00"]);
      setWhatsappPrivate(Boolean(player.whatsappPrivate));
      setAvatarPreview(player.avatar || "");
      setHeroPhotoPreview(player.heroPhoto || player.avatar || "");
      setUploadStatusMsg("");
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadStatusMsg("Procesando imagen en alta definición...");
      const compressedDataUrl = await readAndCompressImageFile(
        file,
        type === "hero" ? 1000 : 600,
        0.85
      );
      if (type === "avatar") {
        setAvatarPreview(compressedDataUrl);
        if (!heroPhotoPreview) setHeroPhotoPreview(compressedDataUrl);
      } else {
        setHeroPhotoPreview(compressedDataUrl);
        if (!avatarPreview) setAvatarPreview(compressedDataUrl);
      }
      setUploadStatusMsg("✓ ¡Imagen lista! Pulsa Guardar Cambios abajo.");
    } catch {
      setUploadStatusMsg("No se pudo leer la imagen seleccionada.");
    }
  };

  const toggleDay = (dayId) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const toggleSlot = (slotHours) => {
    setSelectedSlots((prev) =>
      prev.includes(slotHours)
        ? prev.filter((s) => s !== slotHours)
        : [...prev, slotHours]
    );
  };

  const handleSave = () => {
    if (onSaveProfile) {
      onSaveProfile({
        ...player,
        name: name.trim() || player.name,
        age: Math.max(12, Math.min(85, Number(age) || 26)),
        heightLabel: heightLabel.trim() || "1.78 m",
        hand,
        bestShot,
        clubId,
        profileThemeId,
        avatar: avatarPreview,
        heroPhoto: heroPhotoPreview || avatarPreview,
        availableDays: selectedDays.length > 0 ? selectedDays : ["S", "D"],
        availableSlots:
          selectedSlots.length > 0 ? selectedSlots : ["18:00–22:00"],
        whatsappPrivate,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-lg rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div className="flex items-center gap-2.5">
            <Icons.Settings size={22} />
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold tracking-wide">
              PERSONALIZAR PERFIL & FOTOS
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Cuerpo Scrolleable */}
        <div className="p-6 overflow-y-auto space-y-6 no-scrollbar">
          {/* 1. SUBIDA REAL DE FOTO DE PERFIL Y FOTO DE CUERPO COMPLETO / HERO */}
          <div
            className="rounded-3xl p-4 space-y-4"
            style={{
              background: "var(--bg-subtle)",
              border: "1.5px solid var(--wta-emerald)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--wta-emerald)" }}
                >
                  📷 Fotografías de Jugador (Estilo WTA / ATP)
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Sube tu foto desde la galería o cámara de tu celular
                </p>
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, "avatar")}
            />
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, "hero")}
            />

            <div className="grid grid-cols-2 gap-3">
              {/* Foto Rostro / Ranking */}
              <div
                className="rounded-2xl p-3 flex flex-col items-center text-center space-y-2.5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <SafeImage
                  src={avatarPreview}
                  alt={name}
                  circular
                  style={{
                    width: 68,
                    height: 68,
                    border: "2px solid #00DC7D",
                  }}
                />
                <div className="text-xs font-bold">Foto de Ranking</div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="touch-btn w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5"
                  style={{
                    minHeight: 38,
                    background: "#00DC7D",
                    color: "#0A1633",
                  }}
                >
                  <Icons.Camera size={15} />
                  <span>Subir Foto</span>
                </button>
              </div>

              {/* Foto Cuerpo Completo / Portada Hero WTA */}
              <div
                className="rounded-2xl p-3 flex flex-col items-center text-center space-y-2.5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400">
                  <SafeImage
                    src={heroPhotoPreview}
                    alt={name}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div className="text-xs font-bold">Foto Portada / Cuerpo</div>
                <button
                  type="button"
                  onClick={() => heroInputRef.current?.click()}
                  className="touch-btn w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5"
                  style={{
                    minHeight: 38,
                    background: "#D6FF00",
                    color: "#0A1633",
                  }}
                >
                  <Icons.Camera size={15} />
                  <span>Foto Portada</span>
                </button>
              </div>
            </div>

            {uploadStatusMsg && (
              <div
                className="text-xs font-extrabold text-center py-1.5 rounded-xl"
                style={{
                  background: "rgba(0, 220, 125, 0.16)",
                  color: "var(--wta-emerald)",
                }}
              >
                {uploadStatusMsg}
              </div>
            )}
          </div>

          {/* 2. SELECTOR DE ATUENDO / TEMA DE PISTA GRAND SLAM */}
          <div className="space-y-2.5">
            <label
              className="text-xs font-extrabold uppercase tracking-wider block"
              style={{ color: "var(--text-muted)" }}
            >
              Escenario Grand Slam de tu Perfil (Fondo de Cancha)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {GRAND_SLAM_THEMES.map((slam) => {
                const isSelected = profileThemeId === slam.id;
                return (
                  <button
                    key={slam.id}
                    type="button"
                    onClick={() => setProfileThemeId(slam.id)}
                    className="p-3 rounded-2xl text-left transition-all relative overflow-hidden"
                    style={{
                      background: slam.heroGradient,
                      border: isSelected
                        ? `2.5px solid ${slam.accentColor}`
                        : "1.5px solid rgba(255,255,255,0.18)",
                      color: "#FFFFFF",
                    }}
                  >
                    <div
                      className="font-wta-condensed text-lg font-bold leading-tight"
                      style={{ color: slam.accentColor }}
                    >
                      {slam.shortName}
                    </div>
                    <div className="text-[11px] text-slate-200 mt-0.5">
                      {slam.surfaceLabel}
                    </div>
                    {isSelected && (
                      <span
                        className="mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase"
                        style={{
                          background: slam.accentColor,
                          color: slam.badgeText,
                        }}
                      >
                        ✓ Activo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. EDAD Y ESTATURA (Coherencia 100% con el Head-to-Head y Modo +40 Master) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider block">
                Edad (Años)
              </label>
              <input
                type="number"
                min="12"
                max="85"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-strong)",
                  color: "var(--text-main)",
                }}
              />
              {Number(age) >= 40 && (
                <span
                  className="text-[11px] font-extrabold block"
                  style={{ color: "var(--gold)" }}
                >
                  ★ Categoría +40 Master Activa
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider block">
                Estatura
              </label>
              <input
                type="text"
                value={heightLabel}
                onChange={(e) => setHeightLabel(e.target.value)}
                placeholder="Ej. 1.78 m"
                className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-strong)",
                  color: "var(--text-main)",
                }}
              />
            </div>
          </div>

          {/* 4. MANO HÁBIL Y MEJOR GOLPE */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider block">
              Mano de Juego
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {HAND_OPTIONS.map((opt) => {
                const active = hand === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHand(opt)}
                    className="touch-btn py-3 px-4 rounded-xl font-display font-extrabold text-sm border"
                    style={{
                      background: active ? "var(--electric)" : "var(--bg-subtle)",
                      color: active ? "#FFFFFF" : "var(--text-main)",
                      borderColor: active
                        ? "var(--electric)"
                        : "var(--border-hairline)",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider block">
              Mejor Golpe (Golpe Firma)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BEST_SHOT_OPTIONS.map((shot) => {
                const active = bestShot === shot;
                return (
                  <button
                    key={shot}
                    type="button"
                    onClick={() => setBestShot(shot)}
                    className="touch-btn py-3 px-3.5 rounded-xl text-xs sm:text-sm border text-left justify-start"
                    style={{
                      background: active ? "#00DC7D" : "var(--bg-subtle)",
                      color: active ? "#0A1633" : "var(--text-main)",
                      borderColor: active
                        ? "#00DC7D"
                        : "var(--border-hairline)",
                      fontWeight: active ? 800 : 600,
                    }}
                  >
                    {shot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. DISPONIBILIDAD DE DÍAS Y HORARIOS */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold uppercase tracking-wider block">
              Días y Horarios Disponibles
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEK_DAYS_OPTIONS.map((d) => {
                const active = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className="touch-btn py-2.5 rounded-xl font-display font-extrabold text-xs border"
                    style={{
                      minHeight: 42,
                      background: active ? "var(--electric)" : "var(--bg-subtle)",
                      color: active ? "#FFFFFF" : "var(--text-main)",
                      borderColor: active
                        ? "var(--electric)"
                        : "var(--border-hairline)",
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {TIME_SLOT_OPTIONS.map((slot) => {
                const active = selectedSlots.includes(slot.hours);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleSlot(slot.hours)}
                    className="touch-btn py-2.5 px-2 rounded-xl flex flex-col items-center justify-center border text-center"
                    style={{
                      background: active
                        ? "var(--emerald-bg)"
                        : "var(--bg-subtle)",
                      borderColor: active
                        ? "var(--emerald)"
                        : "var(--border-hairline)",
                      color: active ? "var(--emerald)" : "var(--text-main)",
                    }}
                  >
                    <span className="text-xs font-extrabold">{slot.label}</span>
                    <span className="text-[11px] opacity-85">{slot.hours}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. CLUB REPRESENTADO */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider block">
              Club o Academia Representada
            </label>
            <div className="grid grid-cols-1 gap-2">
              {clubs.map((c) => {
                const active = clubId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClubId(c.id)}
                    className="touch-btn px-4 py-3 rounded-xl flex items-center justify-between border"
                    style={{
                      background: active
                        ? "var(--bg-elevated)"
                        : "var(--bg-subtle)",
                      borderColor: active
                        ? "#00DC7D"
                        : "var(--border-hairline)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={c.shield}
                        alt={c.name}
                        circular
                        style={{ width: 28, height: 28 }}
                      />
                      <span className="text-sm font-bold">{c.name}</span>
                    </div>
                    {active && <Icons.Check size={18} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acciones Secundarias */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {onOpenTutorialOnce && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTutorialOnce();
                }}
                className="touch-btn py-3 px-3 rounded-xl text-xs font-bold border"
                style={{
                  borderColor: "var(--border-strong)",
                  color: "var(--text-main)",
                }}
              >
                Sistema de Juego
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSwitchAccount) onOpenSwitchAccount();
              }}
              className="touch-btn py-3 px-3 rounded-xl text-xs font-extrabold border"
              style={{
                borderColor: "rgba(244, 63, 94, 0.45)",
                color: "var(--crimson)",
              }}
            >
              Cambiar de Cuenta
            </button>
          </div>
        </div>

        {/* Botón Guardar */}
        <div
          className="p-4"
          style={{ borderTop: "1.5px solid var(--border-hairline)" }}
        >
          <button
            type="button"
            onClick={handleSave}
            className="touch-btn w-full py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-lg"
            style={{ background: "#00DC7D", color: "#0A1633" }}
          >
            Guardar Mi Perfil y Fotografías
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 29. VISTA MONUMENTAL: MI PERFIL (FORMATO EXACTO ELENA RYBAKINA WTA TOUR
//     image_5c62d8.jpg + SECCIÓN "ÚLTIMOS PARTIDOS" image_5c62b8.png)
//     - Cabecera Hero con foto grande de cuerpo/medio cuerpo y botón directo 📷
//     - Nombre apilado en 2 líneas gigantes en Verde Esmeralda (#00DC7D)
//     - 4 Tarjetas Glassmorphism superpuestas abajo (Sin mostrar jamás "0%")
//     - Selector de Escenario Grand Slam en vivo + Termómetro Monocromático
// ============================================================================
export const MyProfileView = ({
  player,
  allPlayers = [],
  completedMatches = [],
  clubs = HUANCAYO_CLUBS,
  onSaveProfile,
  onOpenSettings,
  onOpenVipUpgrade,
  onOpenHeadToHead,
  onOpenStoryPoster,
  onOpenProShop,
  onToggleLookingForMatch,
  onGoToChallenges,
}) => {
  const [statsScope, setStatsScope] = useState("ytd"); // 'ytd' | 'career'
  const quickPhotoInputRef = useRef(null);

  if (!player) return null;

  const activeSorted = useMemo(
    () =>
      [...allPlayers]
        .filter((p) => p.activeStatus !== "inactive")
        .sort((a, b) => b.elo - a.elo),
    [allPlayers]
  );

  const officialRank =
    activeSorted.findIndex((p) => p.id === player.id) + 1 || 1;
  const catInfo = getCategoryByElo(player.elo, player.seasonMatches);
  const clubObj = getClubById(player.clubId, clubs);

  const slamTheme =
    GRAND_SLAM_THEMES.find((t) => t.id === player.profileThemeId) ||
    GRAND_SLAM_THEMES[0];

  // Separamos Nombre y Apellido para apilarlos en 2 líneas monumentales como "ELENA / RYBAKINA"
  const nameParts = (player.name || "Tenista").trim().split(/\s+/);
  const firstName = nameParts[0] || player.name;
  const lastName =
    nameParts.length > 1 ? nameParts.slice(1).join(" ") : catInfo.short;

  const isCalibrating =
    Number(player.calibrationMatches ?? 5) < ELO_CONSTANTS.CALIBRATION_MATCHES;
  const qualifiesTop8 = officialRank <= 8 && (player.seasonMatches || 0) >= 4;

  const displayedWins =
    statsScope === "ytd"
      ? player.wins || 0
      : player.careerWins || player.wins || 0;
  const displayedLosses =
    statsScope === "ytd"
      ? player.losses || 0
      : player.careerLosses || player.losses || 0;

  const myHistory = completedMatches.filter(
    (m) => m.challengerId === player.id || m.challengedId === player.id
  );

  // Subida directa de foto desde el botón de cámara en la portada del perfil
  const handleQuickHeroPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onSaveProfile) return;
    try {
      const compressed = await readAndCompressImageFile(file, 950, 0.85);
      onSaveProfile({
        ...player,
        avatar: compressed,
        heroPhoto: compressed,
      });
    } catch {
      // Ignorar fallo de lectura
    }
  };

  return (
    <div className="view-transition px-3 sm:px-5 pt-4 pb-10 space-y-6 max-w-4xl mx-auto">
      {/* Input oculto para cambiar la foto con 1 solo clic desde la portada */}
      <input
        ref={quickPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleQuickHeroPhotoUpload}
      />

      {/* ====================================================================
          1. CABECERA HERO MONUMENTAL ESTILO WTA (ELENA RYBAKINA image_5c62d8.jpg)
         ==================================================================== */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/15"
        style={{
          background: slamTheme.heroGradient,
          color: "#FFFFFF",
        }}
      >
        {/* Línea Blanca Horizontal de Cancha cruzando detrás del jugador (como en la foto de Rybakina) */}
        <div
          className="absolute inset-x-0 top-[56%] h-[2px] pointer-events-none"
          style={{ background: slamTheme.courtLineColor }}
        />
        <div
          className="absolute left-1/2 top-[56%] bottom-0 w-[2px] pointer-events-none"
          style={{ background: slamTheme.courtLineColor }}
        />

        {/* Barra Superior dentro del Hero: Píldora de Clasificación + Botones Favorito / Cámara / Ajustes */}
        <div className="relative z-20 px-5 sm:px-7 pt-5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow"
              style={{
                background: slamTheme.accentColor,
                color: slamTheme.badgeText,
              }}
            >
              {isCalibrating
                ? `⚡ FASE DE CALIBRACIÓN (${player.calibrationMatches}/5)`
                : qualifiesTop8
                ? "★ CLASIFICADO MASTER TOP 8"
                : `${catInfo.name.toUpperCase()}`}
            </span>

            {player.age >= 40 && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                +40 MASTER
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Visible e Inmediato para Cambiar Foto */}
            <button
              type="button"
              onClick={() => quickPhotoInputRef.current?.click()}
              className="touch-btn px-3.5 py-2 rounded-full bg-white text-[#1E0734] font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
              style={{ minHeight: 38 }}
            >
              <Icons.Camera size={15} />
              <span>Cambiar Foto</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="touch-btn px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-display font-bold text-xs flex items-center gap-1.5 border border-white/25"
              style={{ minHeight: 38 }}
            >
              <Icons.Settings size={15} />
              <span>Ajustes</span>
            </button>
          </div>
        </div>

        {/* Cuerpo Central del Hero: Tipografía Monumental Izquierda + Retrato Grande Centro/Derecha */}
        <div className="relative z-10 px-5 sm:px-7 pt-3 pb-4 grid grid-cols-1 md:grid-cols-12 items-end gap-4">
          {/* Columna Izquierda: Nombre Apilado Gigante + Datos de Club/Edad + Selector YTD/CAREER */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <div
                className="font-wta-condensed text-5xl sm:text-7xl font-bold leading-[0.92] tracking-tight break-words"
                style={{ color: slamTheme.accentColor }}
              >
                <div>{firstName}</div>
                <div>{lastName}</div>
              </div>

              {/* Cinta de Bio: Escudo Club • Edad • Estatura • Mano & Golpe */}
              <div className="flex flex-wrap items-center gap-2.5 pt-3 text-sm sm:text-base font-bold text-white/95">
                {clubObj && (
                  <SafeImage
                    src={clubObj.shield}
                    alt={clubObj.shortName}
                    circular
                    style={{
                      width: 24,
                      height: 24,
                      border: "1.5px solid #FFFFFF",
                    }}
                  />
                )}
                <span>
                  {clubObj ? clubObj.shortName : "Independiente"} •{" "}
                  {player.age || 26} años • {player.heightLabel || "1.78 m"} •{" "}
                  {player.hand || "Diestro"}
                </span>
              </div>
            </div>

            {/* Fila del Selector Píldora "YTD 2026 | CAREER" + Botón Circular H2H (como en Rybakina) */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="inline-flex rounded-full p-1 bg-black/35 border border-white/15">
                <button
                  type="button"
                  onClick={() => setStatsScope("ytd")}
                  className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all"
                  style={{
                    background: statsScope === "ytd" ? "#FFFFFF" : "transparent",
                    color: statsScope === "ytd" ? "#1E0734" : "#CBD5E1",
                  }}
                >
                  YTD 2026
                </button>
                <button
                  type="button"
                  onClick={() => setStatsScope("career")}
                  className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all"
                  style={{
                    background:
                      statsScope === "career" ? "#FFFFFF" : "transparent",
                    color: statsScope === "career" ? "#1E0734" : "#CBD5E1",
                  }}
                >
                  CARRERA
                </button>
              </div>

              {/* Botón Circular Doble de Jugador / Head-to-Head (Esquina Derecha igual a WTA) */}
              <button
                type="button"
                onClick={() =>
                  onOpenHeadToHead && onOpenHeadToHead(player, null)
                }
                className="touch-btn px-4 py-2 rounded-full bg-white text-[#1E0734] font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg"
                style={{ minHeight: 40 }}
              >
                <Icons.Users size={16} />
                <span>Head to Head</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha / Centro: Foto Grande de Cuerpo Completo / Medio Cuerpo */}
          <div className="md:col-span-5 flex justify-center md:justify-end">
            <div
              onClick={() => quickPhotoInputRef.current?.click()}
              className="relative w-52 h-60 sm:w-60 sm:h-68 rounded-3xl overflow-hidden border-2 shadow-2xl cursor-pointer group"
              style={{
                borderColor: slamTheme.accentColor,
                background: "rgba(0,0,0,0.25)",
              }}
              title="Toca para cambiar tu fotografía de portada"
            >
              <SafeImage
                src={player.heroPhoto || player.avatar}
                alt={player.name}
                fallbackText={player.name}
                style={{ width: "100%", height: "100%" }}
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-center gap-1.5 text-xs font-extrabold text-white opacity-95 group-hover:opacity-100">
                <Icons.Camera size={14} />
                <span>Toca para cambiar foto</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================
            LAS 4 TARJETAS GLASSMORPHISM SUPERPUESTAS EN LA BASE DEL HERO
            (Idénticas a Current Singles Rank | Singles Titles | Won/Lost | Prize/Points)
           ================================================================== */}
        <div className="relative z-20 px-4 sm:px-7 pb-6 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tarjeta 1: Puesto Oficial */}
          <div
            className="rounded-2xl p-4 backdrop-blur-md transition-transform hover:-translate-y-0.5"
            style={{
              background: slamTheme.cardGlassBg,
              border: `1.5px solid ${slamTheme.cardGlassBorder}`,
            }}
          >
            <div className="text-xs font-bold text-slate-200">
              Puesto Ranking Oficial
            </div>
            <div className="font-wta-condensed text-4xl sm:text-5xl font-bold text-white mt-1.5 tabular-nums">
              #{officialRank}
            </div>
          </div>

          {/* Tarjeta 2: Títulos & Racha */}
          <div
            className="rounded-2xl p-4 backdrop-blur-md transition-transform hover:-translate-y-0.5"
            style={{
              background: slamTheme.cardGlassBg,
              border: `1.5px solid ${slamTheme.cardGlassBorder}`,
            }}
          >
            <div className="text-xs font-bold text-slate-200">
              {player.streak > 0 ? "Racha de Victorias" : "Títulos / Podios"}
            </div>
            <div
              className="font-wta-condensed text-4xl sm:text-5xl font-bold mt-1.5 tabular-nums flex items-center gap-2"
              style={{ color: slamTheme.accentColor }}
            >
              <span>
                {player.streak > 0
                  ? `+${player.streak}`
                  : player.titlesCount || 1}
              </span>
              <span className="text-2xl">
                {player.streak > 0 ? "🔥" : "🏆"}
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Ganados / Perdidos (Con Psicología Positiva: CERO "0% Efectividad") */}
          <div
            className="rounded-2xl p-4 backdrop-blur-md transition-transform hover:-translate-y-0.5"
            style={{
              background: slamTheme.cardGlassBg,
              border: `1.5px solid ${slamTheme.cardGlassBorder}`,
            }}
          >
            <div className="text-xs font-bold text-slate-200">
              {displayedWins > 0 ? "Ganados / Jugados" : "Golpe Firma"}
            </div>
            {displayedWins > 0 ? (
              <div className="font-wta-condensed text-4xl sm:text-5xl font-bold text-white mt-1.5 tabular-nums">
                {displayedWins} / {displayedWins + displayedLosses}
              </div>
            ) : (
              <div
                className="font-wta-condensed text-2xl sm:text-3xl font-bold mt-2 leading-tight"
                style={{ color: slamTheme.accentColor }}
              >
                {(player.bestShot || "DERECHA").split(" ")[0]} ★
              </div>
            )}
          </div>

          {/* Tarjeta 4: Puntos Oficiales & Gemas 💎 */}
          <div
            className="rounded-2xl p-4 backdrop-blur-md transition-transform hover:-translate-y-0.5"
            style={{
              background: slamTheme.cardGlassBg,
              border: `1.5px solid ${slamTheme.accentColor}`,
            }}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span>Puntos ELO</span>
              <span className="text-amber-300">💎 {player.gems ?? 150}</span>
            </div>
            <div
              className="font-wta-condensed text-4xl sm:text-5xl font-bold mt-1.5 tabular-nums"
              style={{ color: slamTheme.accentColor }}
            >
              {Number(player.elo).toLocaleString("es-PE")}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. SELECTOR RÁPIDO DE ESCENARIO GRAND SLAM + DISPONIBILIDAD HOY
         ==================================================================== */}
      <div className="atp-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            Escenario de Pista Activo:{" "}
            <span style={{ color: "var(--wta-emerald)" }}>
              {slamTheme.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {GRAND_SLAM_THEMES.map((slam) => {
              const active = slam.id === slamTheme.id;
              return (
                <button
                  key={slam.id}
                  type="button"
                  onClick={() =>
                    onSaveProfile &&
                    onSaveProfile({ ...player, profileThemeId: slam.id })
                  }
                  className="px-3 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap"
                  style={{
                    background: active ? slam.accentColor : "var(--bg-subtle)",
                    color: active ? slam.badgeText : "var(--text-main)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  {slam.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Termómetro de Progreso hacia la siguiente Categoría / Checkpoint */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm sm:text-base font-extrabold">
                Camino hacia{" "}
                {catInfo.nextCat ? catInfo.nextCat.name : "Cima 2ª Libre"}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                {catInfo.consolidatedCheckpoint
                  ? `✓ Checkpoint ${catInfo.checkpointLabel} blindado para la próxima temporada`
                  : catInfo.checkpoint && player.elo < catInfo.checkpoint
                  ? `Te faltan ${catInfo.checkpoint - player.elo} pts para blindar el Checkpoint ${catInfo.checkpointLabel}`
                  : catInfo.nextCat
                  ? `A solo ${catInfo.pointsToNextCategory} pts del ascenso directo`
                  : "Máxima división alcanzada"}
              </div>
            </div>
            <span
              className="font-wta-condensed text-2xl sm:text-3xl font-bold tabular-nums"
              style={{ color: "var(--wta-emerald)" }}
            >
              {catInfo.levelProgressPct}%
            </span>
          </div>

          <div className="relative py-2">
            <div
              className="h-3 w-full rounded-full"
              style={{ background: "var(--thermometer-track)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${catInfo.levelProgressPct}%`,
                  background: "var(--thermometer-fill)",
                }}
              />
            </div>

            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 pointer-events-none"
              style={{
                left: `${Math.min(97, Math.max(3, catInfo.levelProgressPct))}%`,
              }}
            >
              <SafeImage
                src={ASSETS.pelotaVoltAzul}
                alt="Nivel"
                circular
                style={{
                  width: 26,
                  height: 26,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          </div>

          <div
            className="flex items-center justify-between text-xs font-extrabold tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            <span>Piso: {catInfo.activeSeasonFloor} Pts</span>
            {catInfo.checkpoint && (
              <span style={{ color: "var(--gold)" }}>
                Checkpoint: {catInfo.checkpoint} Pts
              </span>
            )}
            <span>
              {catInfo.nextCat ? `Ascenso: ${catInfo.nextCat.min} Pts` : "5,000+ Pts"}
            </span>
          </div>
        </div>

        {/* Acciones Rápidas de Cancha y Canje de Gemas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onToggleLookingForMatch}
            className="touch-btn py-3 px-4 rounded-2xl font-display font-extrabold text-xs sm:text-sm border"
            style={{
              background: player.lookingForMatchToday
                ? "var(--emerald-bg)"
                : "var(--bg-subtle)",
              borderColor: player.lookingForMatchToday
                ? "var(--wta-emerald)"
                : "var(--border-strong)",
              color: player.lookingForMatchToday
                ? "var(--wta-emerald)"
                : "var(--text-main)",
            }}
          >
            {player.lookingForMatchToday
              ? "🟢 Disponible Hoy Activo"
              : "🎾 Marcar Disponible Hoy"}
          </button>

          <button
            type="button"
            onClick={() => onOpenHeadToHead && onOpenHeadToHead(player, null)}
            className="touch-btn py-3 px-4 rounded-2xl font-display font-extrabold text-xs sm:text-sm"
            style={{
              background: "var(--electric)",
              color: "#FFFFFF",
            }}
          >
            👥 Comparador Head to Head
          </button>

          <button
            type="button"
            onClick={onOpenProShop}
            className="touch-btn py-3 px-4 rounded-2xl font-display font-black text-xs sm:text-sm"
            style={{
              background: "#00DC7D",
              color: "#0A1633",
            }}
          >
            💎 Canjear Gemas ({player.gems ?? 150})
          </button>
        </div>
      </div>

      {/* ====================================================================
          3. SECCIÓN "ÚLTIMOS PARTIDOS" (FORMATO EXACTO WTA "LATEST MATCHES"
             image_5c62b8.png — TARJETAS PÚRPURA PROFUNDO CON TRIÁNGULO VERDE)
         ==================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold tracking-tight">
            ÚLTIMOS PARTIDOS
          </h2>

          {onGoToChallenges && (
            <button
              type="button"
              onClick={onGoToChallenges}
              className="touch-btn px-4 py-2 rounded-full font-display font-extrabold text-xs uppercase tracking-wider"
              style={{
                minHeight: 36,
                border: "1.5px solid #00DC7D",
                color: "var(--text-main)",
              }}
            >
              VER TODOS
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myHistory.map((m) => {
            const pA = allPlayers.find((p) => p.id === m.challengerId);
            const pB = allPlayers.find((p) => p.id === m.challengedId);
            const clubA = getClubById(pA?.clubId, clubs);
            const clubB = getClubById(pB?.clubId, clubs);
            const aWon = m.winnerId === pA?.id;
            const bWon = m.winnerId === pB?.id;

            const setsA = m.setsA || [6, 6, null];
            const setsB = m.setsB || [4, 3, null];

            return (
              <div key={m.id} className="wta-match-card p-5 space-y-4">
                {/* Cabecera del Torneo o Sede (como "Toray Pan Pacific Open Tennis") */}
                <div className="pb-3 border-b border-white/15 flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-sm text-white truncate">
                    {m.eventTitle || m.clubName}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400">
                    +{m.gemsAwarded || 50} 💎
                  </span>
                </div>

                {/* Filas de Jugadores con Ganador en Verde Esmeralda (#00DC7D) y Sets en Columnas */}
                <div className="space-y-3 py-1">
                  {/* Fila Jugador A */}
                  <div className="flex items-center justify-between gap-2 relative">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {clubA ? (
                        <SafeImage
                          src={clubA.shield}
                          alt={clubA.shortName}
                          circular
                          style={{ width: 22, height: 22 }}
                        />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-white/15 inline-block" />
                      )}
                      <span
                        className="font-display font-extrabold text-base truncate"
                        style={{ color: aWon ? "#00DC7D" : "#CBD5E1" }}
                      >
                        {pA?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono-code text-base font-bold tabular-nums">
                      <span style={{ color: aWon ? "#FFFFFF" : "#94A3B8" }}>
                        {setsA[0] ?? 6}
                      </span>
                      <span style={{ color: aWon ? "#FFFFFF" : "#94A3B8" }}>
                        {setsA[1] ?? 4}
                      </span>
                      <span style={{ color: aWon ? "#FFFFFF" : "#64748B" }}>
                        {setsA[2] !== null && setsA[2] !== undefined
                          ? setsA[2]
                          : "•"}
                      </span>
                      {aWon && (
                        <span
                          className="text-xs"
                          style={{ color: "#00DC7D" }}
                          title="Ganador del partido"
                        >
                          ◀
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fila Jugador B */}
                  <div className="flex items-center justify-between gap-2 relative">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {clubB ? (
                        <SafeImage
                          src={clubB.shield}
                          alt={clubB.shortName}
                          circular
                          style={{ width: 22, height: 22 }}
                        />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-white/15 inline-block" />
                      )}
                      <span
                        className="font-display font-extrabold text-base truncate"
                        style={{ color: bWon ? "#00DC7D" : "#CBD5E1" }}
                      >
                        {pB?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono-code text-base font-bold tabular-nums">
                      <span style={{ color: bWon ? "#FFFFFF" : "#94A3B8" }}>
                        {setsB[0] ?? 4}
                      </span>
                      <span style={{ color: bWon ? "#FFFFFF" : "#94A3B8" }}>
                        {setsB[1] ?? 3}
                      </span>
                      <span style={{ color: bWon ? "#FFFFFF" : "#64748B" }}>
                        {setsB[2] !== null && setsB[2] !== undefined
                          ? setsB[2]
                          : "•"}
                      </span>
                      {bWon && (
                        <span
                          className="text-xs"
                          style={{ color: "#00DC7D" }}
                          title="Ganador del partido"
                        >
                          ◀
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pie de Tarjeta: Reloj "Finalizado" + Botón Póster Story 9:16 */}
                <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Icons.Clock size={15} />
                    <span>Finalizado · {m.dateLabel}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenStoryPoster && onOpenStoryPoster(m)}
                    className="px-3 py-1.5 rounded-full font-display font-extrabold text-xs uppercase bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-400/35"
                  >
                    Story 9:16
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CARNET DIGITAL VIP METÁLICO 3D */}
      <CarnetDigitalVIP
        player={player}
        clubs={clubs}
        onOpenVipUpgrade={onOpenVipUpgrade}
      />
    </div>
  );
};

// === FIN DEL BLOQUE 6 DE 12 ===

// === INICIO DEL BLOQUE 7 DE 12 ===

// ============================================================================
// 30. MODAL DEL TORNEO DE MAESTROS: "MASTER TOP 8 FINALS" (REPLANTEADO DESDE 0)
//     Explica visualmente el formato WTA/ATP Finals (Grupo A + Grupo B -> Semis -> Final)
// ============================================================================
export const MasterTop8FinalsModal = ({
  isOpen,
  onClose,
  players = [],
  selectedCategory = "ALL",
  clubs = HUANCAYO_CLUBS,
  onSelectPlayerForH2H,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState(
    selectedCategory === "ALL" ? "4TA" : selectedCategory
  );

  useEffect(() => {
    if (selectedCategory && selectedCategory !== "ALL") {
      setActiveCategoryTab(selectedCategory);
    }
  }, [selectedCategory, isOpen]);

  if (!isOpen) return null;

  // Obtenemos los jugadores de la categoría seleccionada ordenados por ELO
  const categoryPlayers = [...players]
    .filter((p) => p.activeStatus !== "inactive")
    .filter((p) => {
      const cat = getCategoryByElo(p.elo, p.seasonMatches);
      return cat.id === activeCategoryTab;
    })
    .sort((a, b) => b.elo - a.elo);

  // Si una categoría demo tiene menos de 8 en la semilla, completamos visualmente con los mejores del circuito para mostrar el cuadro completo
  const top8Pool =
    categoryPlayers.length >= 4
      ? categoryPlayers.slice(0, 8)
      : [...players]
          .filter((p) => p.activeStatus !== "inactive")
          .sort((a, b) => b.elo - a.elo)
          .slice(0, 8);

  // Grupo A: Puestos Impares (#1, #3, #5, #7) | Grupo B: Puestos Pares (#2, #4, #6, #8)
  const groupAPlayers = top8Pool.filter((_, idx) => idx % 2 === 0);
  const groupBPlayers = top8Pool.filter((_, idx) => idx % 2 === 1);

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col border border-emerald-400/40"
        style={{
          background:
            "linear-gradient(165deg, #1E0734 0%, #11182E 55%, #071F18 100%)",
          color: "#FFFFFF",
          maxHeight: "92dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Monumental Master Top 8 */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-wta-condensed text-2xl font-bold shadow-lg"
              style={{ background: "#00DC7D", color: "#1E0734" }}
            >
              🏆
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                FORMATO OFICIAL WTA / ATP FINALS
              </span>
              <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold tracking-wide text-white leading-none mt-0.5">
                {MASTER_TOP8_FINALS_INFO.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 no-scrollbar">
          {/* Banner de Premio y Fecha */}
          <div
            className="rounded-3xl p-5 space-y-2"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,220,125,0.18) 0%, rgba(214,255,0,0.12) 100%)",
              border: "1.5px solid #00DC7D",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
              <span>📅 {MASTER_TOP8_FINALS_INFO.dateLabel}</span>
              <span>📍 {MASTER_TOP8_FINALS_INFO.venueLabel}</span>
            </div>
            <p className="font-display font-bold text-base sm:text-lg text-white">
              {MASTER_TOP8_FINALS_INFO.subtitle}
            </p>
            <div className="text-xs sm:text-sm font-extrabold text-emerald-300 pt-1">
              🎁 Bolsa de Premios: {MASTER_TOP8_FINALS_INFO.prizePoolLabel}
            </div>
          </div>

          {/* ¿Por qué clasifican los 8 Primeros y cómo se juega? (4 Tarjetas Visuales) */}
          <div className="space-y-3">
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold tracking-wide text-emerald-400">
              ¿CÓMO FUNCIONA LA CLASIFICACIÓN AL TOP 8?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MASTER_TOP8_FINALS_INFO.howToQualifySteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl p-4 bg-white/5 border border-white/15 space-y-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-full font-wta-condensed text-lg font-bold flex items-center justify-center"
                      style={{ background: "#00DC7D", color: "#1E0734" }}
                    >
                      {item.step}
                    </span>
                    <h4 className="font-display font-extrabold text-sm sm:text-base text-white">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulación en Vivo de los Grupos (Round Robin) por Categoría */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold tracking-wide text-white">
                PROYECCIÓN EN VIVO DE GRUPOS (ROUND ROBIN)
              </h3>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[...CATEGORIES_PROGRESSIVE].reverse().map((cat) => {
                  const active = activeCategoryTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryTab(cat.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all"
                      style={{
                        background: active ? "#00DC7D" : "rgba(255,255,255,0.1)",
                        color: active ? "#1E0734" : "#FFFFFF",
                      }}
                    >
                      {cat.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Grupo A (Cabezas de serie impares) */}
              <div className="rounded-3xl p-4 bg-black/35 border border-emerald-400/35 space-y-3">
                <div className="flex items-center justify-between border-b border-white/15 pb-2">
                  <span className="font-wta-condensed text-xl font-bold text-emerald-400">
                    GRUPO A · MANTARO
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Puestos #1, #3, #5, #7
                  </span>
                </div>

                <div className="space-y-2">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const p = groupAPlayers[slotIdx];
                    const seedNum = slotIdx * 2 + 1;
                    return (
                      <div
                        key={slotIdx}
                        onClick={() =>
                          p &&
                          onSelectPlayerForH2H &&
                          onSelectPlayerForH2H(p, groupAPlayers[0])
                        }
                        className="rounded-xl px-3 py-2.5 bg-white/5 border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-6 h-6 rounded-md font-wta-condensed text-sm font-bold flex items-center justify-center"
                            style={{ background: "#00DC7D", color: "#1E0734" }}
                          >
                            #{seedNum}
                          </span>
                          {p ? (
                            <>
                              <SafeImage
                                src={p.avatar}
                                alt={p.name}
                                circular
                                style={{ width: 28, height: 28 }}
                              />
                              <span className="font-display font-bold text-sm truncate text-white">
                                {p.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Cupo Abierto #{seedNum}
                            </span>
                          )}
                        </div>
                        {p && (
                          <span className="font-wta-condensed text-lg font-bold text-emerald-400 tabular-nums">
                            {p.elo} PTS
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grupo B (Cabezas de serie pares) */}
              <div className="rounded-3xl p-4 bg-black/35 border border-amber-400/35 space-y-3">
                <div className="flex items-center justify-between border-b border-white/15 pb-2">
                  <span className="font-wta-condensed text-xl font-bold text-amber-300">
                    GRUPO B · HUAYTAPALLANA
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Puestos #2, #4, #6, #8
                  </span>
                </div>

                <div className="space-y-2">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const p = groupBPlayers[slotIdx];
                    const seedNum = slotIdx * 2 + 2;
                    return (
                      <div
                        key={slotIdx}
                        onClick={() =>
                          p &&
                          onSelectPlayerForH2H &&
                          onSelectPlayerForH2H(p, groupBPlayers[0])
                        }
                        className="rounded-xl px-3 py-2.5 bg-white/5 border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-6 h-6 rounded-md font-wta-condensed text-sm font-bold flex items-center justify-center"
                            style={{ background: "#D6FF00", color: "#1E0734" }}
                          >
                            #{seedNum}
                          </span>
                          {p ? (
                            <>
                              <SafeImage
                                src={p.avatar}
                                alt={p.name}
                                circular
                                style={{ width: 28, height: 28 }}
                              />
                              <span className="font-display font-bold text-sm truncate text-white">
                                {p.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Cupo Abierto #{seedNum}
                            </span>
                          )}
                        </div>
                        {p && (
                          <span className="font-wta-condensed text-lg font-bold text-amber-300 tabular-nums">
                            {p.elo} PTS
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 31. VISTA PRINCIPAL: RANKING OFICIAL (FORMATO EXACTO WTA TOUR image_5c65c1.png)
//     - Números de Puesto y Puntos en Fuente Condensada Gigante (36px–44px)
//     - Retrato Cuadrado Redondeado sobre Fondo Verde Esmeralda (<WtaEmeraldPortrait />)
//     - Halo Luminoso Animado alrededor de TU Propia Ubicación ("TU POSICIÓN")
//     - Insignia clara "⚡ Calibrándose (X/5)" + Filtro "+40 Master" + Reto al "Boss"
// ============================================================================
export const RankingOfficialView = ({
  players = [],
  currentUser,
  clubs = HUANCAYO_CLUBS,
  onSelectPlayerForH2H,
  onLaunchChallenge,
}) => {
  const [viewMode, setViewMode] = useState("jugadores"); // 'jugadores' | 'clubes'
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [onlySenior40, setOnlySenior40] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClubFilter, setSelectedClubFilter] = useState("ALL");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [isMasterTop8ModalOpen, setIsMasterTop8ModalOpen] = useState(false);

  const activePlayers = useMemo(
    () =>
      [...players]
        .filter((p) => p.activeStatus !== "inactive")
        .sort((a, b) => b.elo - a.elo),
    [players]
  );

  // Posición general del usuario conectado para el banner superior rápido
  const myGlobalRank =
    activePlayers.findIndex((p) => p.id === currentUser?.id) + 1;

  const filteredPlayers = useMemo(() => {
    return activePlayers.filter((p) => {
      const cat = getCategoryByElo(p.elo, p.seasonMatches);
      if (selectedCategory !== "ALL" && cat.id !== selectedCategory) {
        return false;
      }
      if (onlySenior40 && Number(p.age || 28) < 40) {
        return false;
      }
      if (selectedClubFilter !== "ALL" && p.clubId !== selectedClubFilter) {
        return false;
      }
      if (
        searchQuery.trim() !== "" &&
        !p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [
    activePlayers,
    selectedCategory,
    onlySenior40,
    selectedClubFilter,
    searchQuery,
  ]);

  const clubsStandings = useMemo(() => {
    return clubs
      .map((club) => {
        const members = activePlayers.filter((p) => p.clubId === club.id);
        const totalPoints = members.reduce(
          (acc, p) => acc + Number(p.elo || 0),
          0
        );
        const avgPoints =
          members.length > 0 ? Math.round(totalPoints / members.length) : 0;
        const totalWins = members.reduce(
          (acc, p) => acc + Number(p.wins || 0),
          0
        );
        return {
          ...club,
          membersCount: members.length,
          totalPoints,
          avgPoints,
          totalWins,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [clubs, activePlayers]);

  return (
    <div className="view-transition px-3 sm:px-5 pt-4 pb-10 space-y-5 max-w-4xl mx-auto">
      {/* ====================================================================
          1. BARRA SUPERIOR INTERACTIVA: TU UBICACIÓN CON HALO + MASTER TOP 8
         ==================================================================== */}
      <div
        className="rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl"
        style={{
          background:
            "linear-gradient(135deg, #1E0734 0%, #121C36 60%, #09291E 100%)",
          border: "1.5px solid rgba(0, 220, 125, 0.45)",
          color: "#FFFFFF",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <SafeImage
              src={currentUser?.avatar}
              alt={currentUser?.name}
              circular
              style={{
                width: 52,
                height: 52,
                border: "2.5px solid #00DC7D",
              }}
            />
            <span
              className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full font-wta-condensed text-xs font-bold"
              style={{ background: "#00DC7D", color: "#1E0734" }}
            >
              #{myGlobalRank || 4}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                🌟 Tu Posición en el Circuito
              </span>
            </div>
            <div className="font-wta-condensed text-2xl sm:text-3xl font-bold text-white leading-tight">
              {currentUser?.name} ·{" "}
              <span style={{ color: "#00DC7D" }}>
                {Number(currentUser?.elo || 3080).toLocaleString("es-PE")} PTS
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMasterTop8ModalOpen(true)}
            className="touch-btn px-4 py-2.5 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
            style={{
              background: "#00DC7D",
              color: "#1E0734",
            }}
          >
            <Icons.Trophy size={16} />
            <span>Master Top 8 Finals</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelectPlayerForH2H &&
              onSelectPlayerForH2H(
                currentUser || activePlayers[0],
                activePlayers[0]?.id === currentUser?.id
                  ? activePlayers[1]
                  : activePlayers[0]
              )
            }
            className="touch-btn px-4 py-2.5 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/25"
          >
            Head to Head
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. CONTENEDOR PRINCIPAL DE LA TABLA DE RANKING ESTILO WTA (image_5c65c1.png)
         ==================================================================== */}
      <div className="atp-card overflow-hidden">
        {/* Barra Superior de Filtros Estilo WTA: Píldora "☰ FILTER" + Categorías + Buscador Circular */}
        <div
          className="p-4 sm:p-5 space-y-4"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Izquierda: Botón Píldora FILTER + Conmutador Individual / Clubes + Filtro +40 Master */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFiltersPanel((v) => !v)}
                className="touch-btn px-4 py-2 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2"
                style={{
                  minHeight: 40,
                  background: "var(--bg-subtle)",
                  border: "1.5px solid var(--border-strong)",
                  color: "var(--text-main)",
                }}
              >
                <span>☰ FILTRAR</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlySenior40((v) => !v)}
                className="touch-btn px-4 py-2 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all"
                style={{
                  minHeight: 40,
                  background: onlySenior40 ? "var(--gold)" : "var(--bg-subtle)",
                  color: onlySenior40 ? "#0A1633" : "var(--text-main)",
                  border: "1.5px solid var(--border-strong)",
                }}
              >
                {onlySenior40 ? "★ +40 Master Activo" : "+40 Master"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode(viewMode === "jugadores" ? "clubes" : "jugadores")
                }
                className="touch-btn px-4 py-2 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider"
                style={{
                  minHeight: 40,
                  background:
                    viewMode === "clubes"
                      ? "var(--electric)"
                      : "var(--bg-subtle)",
                  color:
                    viewMode === "clubes" ? "#FFFFFF" : "var(--text-main)",
                  border: "1.5px solid var(--border-hairline)",
                }}
              >
                {viewMode === "jugadores"
                  ? `Clubes (${clubs.length})`
                  : "Ver Tenistas"}
              </button>
            </div>

            {/* Derecha: Buscador Rápido Visible */}
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-full w-full sm:w-64"
              style={{
                background: "var(--bg-input)",
                border: "1.5px solid var(--border-strong)",
              }}
            >
              <Icons.Search size={17} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tenista..."
                className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                style={{ color: "var(--text-main)" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-black"
                  style={{ color: "var(--text-muted)" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Píldoras de Categorías Grandes y Diferenciadas */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className="px-4 py-2 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap transition-all"
              style={{
                background:
                  selectedCategory === "ALL" ? "#00DC7D" : "var(--bg-subtle)",
                color:
                  selectedCategory === "ALL" ? "#1E0734" : "var(--text-main)",
                border: "1.5px solid var(--border-hairline)",
              }}
            >
              Ranking General
            </button>

            {[...CATEGORIES_PROGRESSIVE].reverse().map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-4 py-2 rounded-full font-display font-extrabold text-xs sm:text-sm whitespace-nowrap transition-all"
                  style={{
                    background: active ? cat.color : "var(--bg-subtle)",
                    color: active ? "#FFFFFF" : "var(--text-main)",
                    border: `1.5px solid ${
                      active ? cat.color : "var(--border-hairline)"
                    }`,
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Panel Desplegable de Filtro por Club */}
          {showFiltersPanel && (
            <div
              className="rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-strong)",
              }}
            >
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Filtrar por Sede Oficial:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedClubFilter("ALL")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{
                    background:
                      selectedClubFilter === "ALL"
                        ? "#00DC7D"
                        : "var(--bg-card)",
                    color:
                      selectedClubFilter === "ALL"
                        ? "#1E0734"
                        : "var(--text-main)",
                  }}
                >
                  Todos
                </button>
                {clubs.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClubFilter(c.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{
                      background:
                        selectedClubFilter === c.id
                          ? "#00DC7D"
                          : "var(--bg-card)",
                      color:
                        selectedClubFilter === c.id
                          ? "#1E0734"
                          : "var(--text-main)",
                    }}
                  >
                    {c.shortName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {viewMode === "jugadores" ? (
          <>
            {/* CABECERA DE COLUMNAS ESTILO WTA (image_5c65c1.png: RANK ▲ | PLAYER | AGE | PLAYED | POINTS) */}
            <div
              className="px-4 sm:px-6 py-3.5 grid grid-cols-12 items-center text-xs font-extrabold uppercase tracking-wider"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--text-muted)",
                borderBottom: "1.5px solid var(--border-hairline)",
              }}
            >
              <div className="col-span-2 flex items-center gap-1">
                <span
                  className="pb-1 border-b-2"
                  style={{
                    borderColor: "var(--wta-emerald)",
                    color: "var(--text-main)",
                  }}
                >
                  RANK ▲
                </span>
              </div>
              <div className="col-span-5 sm:col-span-4">TENISTA</div>
              <div className="hidden sm:block sm:col-span-2 text-center">
                EDAD
              </div>
              <div className="col-span-2 text-center">PARTIDOS</div>
              <div className="col-span-3 sm:col-span-2 text-right">PUNTOS</div>
            </div>

            {/* FILAS MONUMENTALES DE JUGADORES (DISEÑO EXACTO ELENA RYBAKINA / SABALENKA) */}
            <div>
              {filteredPlayers.length === 0 ? (
                <div
                  className="p-10 text-center text-sm font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  No se encontraron tenistas con ese filtro.
                </div>
              ) : (
                filteredPlayers.map((p, index) => {
                  const posInView = index + 1;
                  const catInfo = getCategoryByElo(p.elo, p.seasonMatches);
                  const clubObj = getClubById(p.clubId, clubs);
                  const isMe = currentUser?.id === p.id;
                  const isCalibrating =
                    Number(p.calibrationMatches ?? 5) <
                    ELO_CONSTANTS.CALIBRATION_MATCHES;

                  // Detectar si este jugador es un "Boss" para el usuario actual (Categoría superior / +450 pts)
                  const isBossForMe =
                    !isMe &&
                    currentUser &&
                    p.elo - currentUser.elo >= 450 &&
                    p.elo - currentUser.elo <= 1350 &&
                    posInView <= 3;

                  const totalMatchesPlayed =
                    p.seasonMatches ?? (p.wins || 0) + (p.losses || 0);

                  return (
                    <React.Fragment key={p.id}>
                      <div
                        onClick={() =>
                          onSelectPlayerForH2H &&
                          onSelectPlayerForH2H(
                            currentUser || activePlayers[0],
                            p
                          )
                        }
                        className={`px-4 sm:px-6 py-4 sm:py-5 grid grid-cols-12 items-center gap-2 cursor-pointer transition-all hover:bg-white/[0.04] ${
                          isMe ? "my-rank-halo-row rounded-2xl my-1" : ""
                        }`}
                        style={{
                          borderBottom: "1px solid var(--border-hairline)",
                          background: isMe
                            ? "rgba(0, 220, 125, 0.10)"
                            : posInView <= 3
                            ? "rgba(245, 158, 11, 0.04)"
                            : "transparent",
                        }}
                      >
                        {/* COLUMNA 1: PUESTO EN TIPOGRAFÍA CONDENSADA GIGANTE + VARIACIÓN */}
                        <div className="col-span-2 flex items-center gap-2 sm:gap-3">
                          <span
                            className="font-wta-condensed text-3xl sm:text-4xl font-bold tabular-nums leading-none"
                            style={{
                              color:
                                posInView === 1
                                  ? "#F59E0B"
                                  : posInView === 2
                                  ? "#CBD5E1"
                                  : posInView === 3
                                  ? "#CD7F32"
                                  : isMe
                                  ? "#00DC7D"
                                  : "var(--text-main)",
                            }}
                          >
                            {posInView}
                          </span>

                          <div className="flex flex-col text-xs font-extrabold tabular-nums">
                            {p.lastDelta ? (
                              <span
                                style={{
                                  color:
                                    p.lastDelta > 0
                                      ? "var(--wta-emerald)"
                                      : "var(--text-muted)",
                                }}
                              >
                                {p.lastDelta > 0
                                  ? `+${p.lastDelta}`
                                  : p.lastDelta}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>
                                -
                              </span>
                            )}
                          </div>
                        </div>

                        {/* COLUMNA 2: RETRATO ESMERALDA WTA + NOMBRE GRANDE + CLUB + INSIGNIAS */}
                        <div className="col-span-5 sm:col-span-4 flex items-center gap-3 sm:gap-4 min-w-0">
                          <WtaEmeraldPortrait
                            src={p.avatar}
                            name={p.name}
                            rank={posInView <= 3 ? posInView : null}
                            isBoss={isBossForMe}
                            size={56}
                            onQuickAction={() => {
                              if (isMe) {
                                if (onSelectPlayerForH2H)
                                  onSelectPlayerForH2H(p, activePlayers[0]);
                              } else if (onLaunchChallenge) {
                                onLaunchChallenge(p);
                              }
                            }}
                          />

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="font-display font-black text-base sm:text-lg leading-tight truncate"
                                style={{ color: "var(--text-main)" }}
                              >
                                {p.name}
                              </span>

                              {isMe && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                                  style={{
                                    background: "#00DC7D",
                                    color: "#1E0734",
                                  }}
                                >
                                  TÚ
                                </span>
                              )}
                            </div>

                            {/* Fila de Club + Categoría + Estado Calibración / Boss */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {clubObj && (
                                <SafeImage
                                  src={clubObj.shield}
                                  alt={clubObj.shortName}
                                  circular
                                  style={{ width: 16, height: 16 }}
                                />
                              )}
                              <span
                                className="px-2 py-0.5 rounded text-xs font-extrabold"
                                style={{
                                  background: catInfo.bg,
                                  color: catInfo.color,
                                }}
                              >
                                {catInfo.short}
                              </span>

                              {/* FASE DE CALIBRACIÓN VISIBLE EN EL RANKING */}
                              {isCalibrating && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[11px] font-extrabold"
                                  style={{
                                    background: "rgba(0, 145, 255, 0.18)",
                                    color: "#38BDF8",
                                    border: "1px solid rgba(56, 189, 248, 0.45)",
                                  }}
                                >
                                  ⚡ Calibrándose ({p.calibrationMatches}/5)
                                </span>
                              )}

                              {isBossForMe && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase"
                                  style={{
                                    background: "rgba(168, 85, 247, 0.22)",
                                    color: "#D8B4FE",
                                    border: "1px solid rgba(168, 85, 247, 0.5)",
                                  }}
                                >
                                  👑 BOSS (+100 💎)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* COLUMNA 3: EDAD (Idéntico a WTA Rankings image_5c65c1.png) */}
                        <div className="hidden sm:flex sm:col-span-2 flex-col items-center justify-center">
                          <span className="font-display font-bold text-base tabular-nums">
                            {p.age || 27}
                          </span>
                          {p.age >= 40 && (
                            <span
                              className="text-[10px] font-extrabold uppercase"
                              style={{ color: "var(--gold)" }}
                            >
                              +40 Master
                            </span>
                          )}
                        </div>

                        {/* COLUMNA 4: PARTIDOS JUGADOS */}
                        <div className="col-span-2 text-center">
                          <div className="font-display font-bold text-base tabular-nums">
                            {totalMatchesPlayed}
                          </div>
                          <div
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {p.wins}V-{p.losses}D
                          </div>
                        </div>

                        {/* COLUMNA 5: PUNTOS EN TIPOGRAFÍA CONDENSADA GIGANTE + BOTÓN RETAR / BOSS */}
                        <div
                          className="col-span-3 sm:col-span-2 flex flex-col items-end justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="font-wta-condensed text-3xl sm:text-4xl font-bold tabular-nums leading-none"
                            style={{
                              color: isMe
                                ? "var(--wta-emerald)"
                                : "var(--text-main)",
                            }}
                          >
                            {Number(p.elo).toLocaleString("es-PE")}
                          </div>

                          {!isMe && (
                            <button
                              type="button"
                              onClick={() =>
                                onLaunchChallenge && onLaunchChallenge(p)
                              }
                              className="touch-btn px-3 py-1 rounded-full font-display font-extrabold text-xs uppercase tracking-wider"
                              style={{
                                minHeight: 30,
                                background: isBossForMe ? "#A855F7" : "#D6FF00",
                                color: isBossForMe ? "#FFFFFF" : "#0A1633",
                              }}
                            >
                              {isBossForMe ? "⚔️ Retar Boss" : "Retar"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* LÍNEA DE CORTE OFICIAL MASTER TOP 8 (Después del Puesto #8) */}
                      {posInView === 8 && (
                        <div
                          onClick={() => setIsMasterTop8ModalOpen(true)}
                          className="px-5 py-3 flex items-center justify-between gap-2 cursor-pointer"
                          style={{
                            background:
                              "linear-gradient(90deg, rgba(0,220,125,0.18) 0%, rgba(245,158,11,0.18) 100%)",
                            borderTop: "2px dashed #00DC7D",
                            borderBottom: "2px dashed #00DC7D",
                          }}
                        >
                          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                            ▲ Zona de Clasificación Directa al Torneo de Maestros (Top 8)
                          </span>
                          <span className="text-xs font-extrabold underline">
                            Ver Grupos →
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Vista de Clasificación por Clubes Oficiales */
          <div
            className="divide-y"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            {clubsStandings.map((c, idx) => {
              const pos = idx + 1;
              return (
                <div
                  key={c.id}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className="font-wta-condensed text-4xl font-bold tabular-nums w-8 text-center"
                      style={{
                        color:
                          pos === 1
                            ? "#F59E0B"
                            : pos === 2
                            ? "#CBD5E1"
                            : pos === 3
                            ? "#CD7F32"
                            : "var(--text-main)",
                      }}
                    >
                      {pos}
                    </span>
                    <LaurelAvatar
                      src={c.shield}
                      name={c.name}
                      rank={pos <= 3 ? pos : null}
                      size={48}
                    />
                    <div className="min-w-0">
                      <div className="font-display font-black text-base sm:text-lg truncate">
                        {c.name}
                      </div>
                      <div
                        className="text-xs sm:text-sm font-semibold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {c.membersCount} tenistas en ranking · {c.totalWins}{" "}
                        victorias acumuladas
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-wta-condensed text-3xl sm:text-4xl font-bold tabular-nums">
                      {c.totalPoints.toLocaleString("es-PE")}
                    </div>
                    <div
                      className="text-xs font-extrabold tabular-nums"
                      style={{ color: "var(--wta-emerald)" }}
                    >
                      Promedio: {c.avgPoints} PTS
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal del Torneo de Maestros (Master Top 8 Finals) */}
      <MasterTop8FinalsModal
        isOpen={isMasterTop8ModalOpen}
        onClose={() => setIsMasterTop8ModalOpen(false)}
        players={players}
        selectedCategory={selectedCategory}
        clubs={clubs}
        onSelectPlayerForH2H={onSelectPlayerForH2H}
      />
    </div>
  );
};

// === FIN DEL BLOQUE 7 DE 12 ===

// === INICIO DEL BLOQUE 8 DE 12 ===

// ============================================================================
// 32. MODAL DE CONTRAPROPUESTA DE RETO Y COORDINACIÓN POR WHATSAPP
//     Permite proponer otro día/hora dentro de la app + enviar WhatsApp al rival
// ============================================================================
export const CounterProposalModal = ({
  isOpen,
  onClose,
  challenge,
  players = [],
  clubs = HUANCAYO_CLUBS,
  onSendCounterProposal,
  onConfirmDecline,
}) => {
  const [newDateTime, setNewDateTime] = useState("Jueves 20:00 h");
  const [newClubId, setNewClubId] = useState(challenge?.clubId || "country");
  const [customNote, setCustomNote] = useState(
    "Se me cruza ese turno, pero tengo libre este horario:"
  );

  useEffect(() => {
    if (challenge && isOpen) {
      setNewDateTime("Jueves 19:30 h");
      setNewClubId(challenge.clubId || "country");
      setCustomNote("Se me complica ese horario, ¿te parece bien reprogramarlo para este turno?");
    }
  }, [challenge, isOpen]);

  if (!isOpen || !challenge) return null;

  const challenger = players.find((p) => p.id === challenge.challengerId);
  const challenged = players.find((p) => p.id === challenge.challengedId);
  const selectedClub = getClubById(newClubId, clubs) || clubs[0];

  const handleProposeNewTime = (e) => {
    e.preventDefault();
    const clubName = selectedClub?.name || challenge.customClubName;

    if (onSendCounterProposal) {
      onSendCounterProposal(challenge.id, {
        dateTimeLabel: newDateTime.trim() || challenge.dateTimeLabel,
        clubId: newClubId,
        customClubName: clubName,
        counterProposalNote: `${
          challenged?.name || "Tu rival"
        } propuso jugar el ${newDateTime} en ${clubName}`,
      });
    }

    const waText = `Hola ${
      challenger?.name || ""
    }, vi tu desafío en MATCHPOINT. ${customNote} 📅 *${newDateTime}* en *${clubName}*. ¿Te queda bien para confirmarlo?`;
    window.open(
      `https://wa.me/51${challenger?.phone || "964112233"}?text=${encodeURIComponent(
        waText
      )}`,
      "_blank"
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div>
            <span
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--wta-emerald)" }}
            >
              Coordinación Inteligente de Partido
            </span>
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold mt-0.5">
              REPROGRAMAR O DECLINAR RETO
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={20} />
          </button>
        </div>

        <form
          onSubmit={handleProposeNewTime}
          className="p-6 overflow-y-auto space-y-4 no-scrollbar"
        >
          <div
            className="rounded-2xl p-4 flex items-center gap-3.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
            }}
          >
            <SafeImage
              src={challenger?.avatar}
              alt={challenger?.name}
              circular
              style={{ width: 52, height: 52, border: "2px solid #00DC7D" }}
            />
            <div className="min-w-0">
              <div className="font-display font-black text-base truncate">
                Reto de {challenger?.name}
              </div>
              <div
                className="text-xs sm:text-sm font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Original: {challenge.dateTimeLabel} · {challenge.customClubName}
              </div>
            </div>
          </div>

          {/* Opción 1: Proponer nuevo día/hora y mandar por WhatsApp */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider block">
              1. Propón un Nuevo Día y Hora (Contrapropuesta)
            </label>
            <input
              type="text"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              placeholder="Ej. Viernes 18 Nov · 20:00 h"
              className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1.5px solid var(--border-strong)",
                color: "var(--text-main)",
              }}
            />

            <label className="text-xs font-extrabold uppercase tracking-wider block pt-1">
              Sede Sugerida
            </label>
            <select
              value={newClubId}
              onChange={(e) => setNewClubId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1.5px solid var(--border-strong)",
                color: "var(--text-main)",
              }}
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="text-xs font-extrabold uppercase tracking-wider block pt-1">
              Mensaje para WhatsApp
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full p-3.5 rounded-xl text-sm focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1.5px solid var(--border-hairline)",
                color: "var(--text-main)",
              }}
            />
          </div>

          <button
            type="submit"
            className="touch-btn w-full py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-lg"
            style={{ background: "#00DC7D", color: "#0A1633" }}
          >
            📅 Guardar Contrapropuesta y Enviar por WhatsApp
          </button>

          {/* Opción 2: Declinar definitivamente */}
          <div
            className="pt-3 border-t text-center"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            <button
              type="button"
              onClick={() => {
                if (onConfirmDecline) onConfirmDecline(challenge.id);
                onClose();
              }}
              className="touch-btn w-full py-3 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border"
              style={{
                borderColor: "rgba(244, 63, 94, 0.45)",
                color: "var(--crimson)",
              }}
            >
              No podré jugar esta semana · Declinar Definitivamente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 33. MODAL SERVICIO "MATCHPOINT VISION IA" (ESTILO SWINGVISION & MULTIMEDIA)
// ============================================================================
export const MatchPointVisionIaModal = ({
  isOpen,
  onClose,
  currentUser,
  packages = MATCHPOINT_VISION_IA_PACKAGES,
  onRedeemVisionWithGems,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col border border-emerald-400/40"
        style={{
          background:
            "linear-gradient(160deg, #1E0734 0%, #0D152C 55%, #072219 100%)",
          color: "#FFFFFF",
          maxHeight: "92dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "#00DC7D", color: "#1E0734" }}
            >
              <Icons.Video size={22} />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                ANÁLISIS BIOMECÁNICO & COBERTURA PRO
              </span>
              <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold text-white leading-none mt-0.5">
                MATCHPOINT VISION IA & MULTIMEDIA
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full bg-white/10 text-white"
          >
            <Icons.Close size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 no-scrollbar">
          {/* Simulación Visual del Mapa de Calor y Métricas IA estilo SwingVision */}
          <div className="rounded-3xl p-5 bg-black/40 border border-emerald-400/35 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-7 space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-400 text-[#1E0734]">
                Tecnología SwingVision + Productora Local
              </span>
              <h3 className="font-display font-black text-lg sm:text-xl text-white pt-1">
                Mira tus partidos sin tiempos muertos y conoce tus números reales
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Grabamos tu desafío o final en alta definición y nuestro sistema
                recorta automáticamente los descansos entre puntos, entregándote
                mapa de calor de bote, velocidad de saque y conteo de golpes
                ganadores.
              </p>
            </div>

            <div className="sm:col-span-5 grid grid-cols-2 gap-2.5 text-center">
              <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                <div className="font-wta-condensed text-3xl font-bold text-emerald-400">
                  164 KM/H
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  Pico 1er Saque
                </div>
              </div>
              <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                <div className="font-wta-condensed text-3xl font-bold text-amber-300">
                  74%
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  Profundidad Arcilla
                </div>
              </div>
              <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                <div className="font-wta-condensed text-3xl font-bold text-white">
                  24 WIN
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  Golpes Ganadores
                </div>
              </div>
              <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                <div className="font-wta-condensed text-3xl font-bold text-sky-400">
                  12 MIN
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  Resumen Compacto
                </div>
              </div>
            </div>
          </div>

          {/* Paquetes Disponibles */}
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-3xl p-5 bg-white/5 border border-white/15 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    {pkg.badge}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-wta-condensed text-3xl font-bold text-white">
                      S/ {currentUser?.isVipMember ? pkg.vipPrice : pkg.regularPrice}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                      Con {pkg.gemsRequired} 💎: S/ {pkg.gemDiscountPrice}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-display font-black text-base sm:text-lg text-white">
                    {pkg.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    {pkg.subtitle}
                  </p>
                </div>

                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                  {pkg.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-black">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href={`https://wa.me/${PAYMENT_METHODS_CONFIG.whatsappApprovalPhone}?text=${encodeURIComponent(
                      `Hola Comité MATCHPOINT, soy ${
                        currentUser?.name || "Jugador"
                      }. Deseo agendar el servicio "${pkg.title}" para mi próximo partido.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="touch-btn py-3 px-4 rounded-2xl font-display font-black text-xs uppercase tracking-wider text-center"
                    style={{ background: "#00DC7D", color: "#1E0734" }}
                  >
                    🎥 Agendar Grabación por WhatsApp
                  </a>

                  {onRedeemVisionWithGems && (
                    <button
                      type="button"
                      onClick={() => onRedeemVisionWithGems(pkg)}
                      className="touch-btn py-3 px-4 rounded-2xl font-display font-extrabold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/40"
                    >
                      💎 Usar {pkg.gemsRequired} Gemas (S/ {pkg.gemDiscountPrice})
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 34. VISTA PRINCIPAL: CENTRAL DE RETOS & PARTIDOS EN JUEGO
//     - Iconos y tarjetas que se agrandan con animación al seleccionarlos
//     - Modo Árbitro Oficial ITF/ATP con límite a 7, Tie-Break a 7 en 6-6 y
//       Super Tie-Break a 10 en el 3er Set
//     - Botón de Contrapropuesta + Acceso a MatchPoint Vision IA
// ============================================================================
export const ChallengesCenterView = ({
  challenges = [],
  players = [],
  currentUser,
  clubs = HUANCAYO_CLUBS,
  onOpenNewChallengeModal,
  onOpenOfficialScoreModal,
  onAcceptChallenge,
  onOpenCounterProposal,
  onUpdateLiveRefereeScore,
  onFinalizeRefereeMatchPendingReview,
  onOpenHeadToHead,
  onOpenVisionIaModal,
}) => {
  const [subTab, setSubTab] = useState("cartelera"); // 'cartelera' | 'rivales'
  const [timeFilter, setTimeFilter] = useState("ALL"); // 'ALL' | 'manana' | 'tarde' | 'noche'
  const [onlySeniorFilter, setOnlySeniorFilter] = useState(false);

  const liveMatches = challenges.filter((c) => c.status === "live");
  const confirmedMatches = challenges.filter((c) => c.status === "confirmed");
  const myPendingIncoming = challenges.filter(
    (c) => c.status === "pending" && c.challengedId === currentUser?.id
  );
  const myPendingOutgoing = challenges.filter(
    (c) => c.status === "pending" && c.challengerId === currentUser?.id
  );

  const availableRivals = useMemo(() => {
    return players
      .filter(
        (p) => p.id !== currentUser?.id && p.activeStatus !== "inactive"
      )
      .filter((p) => {
        if (onlySeniorFilter && Number(p.age || 28) < 40) return false;
        if (timeFilter === "ALL") return true;
        const slotObj = TIME_SLOT_OPTIONS.find((s) => s.id === timeFilter);
        if (!slotObj) return true;
        return (p.availableSlots || []).includes(slotObj.hours);
      });
  }, [players, currentUser, timeFilter, onlySeniorFilter]);

  // Evaluador Oficial ITF/ATP de cada Set Regular (Set 1 y Set 2) con Tie-Break a 7 en 6-6
  const evaluateSetState = (gA, gB, tbA = 0, tbB = 0) => {
    const a = Number(gA || 0);
    const b = Number(gB || 0);
    const tA = Number(tbA || 0);
    const tB = Number(tbB || 0);

    if ((a === 6 && b <= 4) || (a === 7 && b === 5)) {
      return { finished: true, winner: "A", inTieBreak: false, label: `${a}-${b}` };
    }
    if ((b === 6 && a <= 4) || (b === 7 && a === 5)) {
      return { finished: true, winner: "B", inTieBreak: false, label: `${a}-${b}` };
    }
    if (a === 7 && b === 6) {
      const loserPts = tB > 0 || tA > 0 ? Math.min(tA, tB) : 5;
      return {
        finished: true,
        winner: "A",
        inTieBreak: false,
        tbLoser: loserPts,
        label: `7-6(${loserPts})`,
      };
    }
    if (b === 7 && a === 6) {
      const loserPts = tA > 0 || tB > 0 ? Math.min(tA, tB) : 5;
      return {
        finished: true,
        winner: "B",
        inTieBreak: false,
        tbLoser: loserPts,
        label: `6-7(${loserPts})`,
      };
    }
    if (a === 6 && b === 6) {
      const maxTb = Math.max(tA, tB);
      const minTb = Math.min(tA, tB);
      if (maxTb >= 7 && maxTb - minTb >= 2) {
        const w = tA > tB ? "A" : "B";
        return {
          finished: true,
          winner: w,
          inTieBreak: false,
          tbLoser: minTb,
          label: w === "A" ? `7-6(${minTb})` : `6-7(${minTb})`,
        };
      }
      return {
        finished: false,
        winner: null,
        inTieBreak: true,
        label: `6-6 (TB ${tA}-${tB})`,
      };
    }
    return { finished: false, winner: null, inTieBreak: false, label: `${a}-${b}` };
  };

  // Analizador Maestro del Partido en Vivo (Impide pasar de 7 y activa Tie-Break a 7 y Super TB a 10)
  const analyzeRefereeMatch = (ls = {}) => {
    const set1 = evaluateSetState(ls.s1A, ls.s1B, ls.tb1A, ls.tb1B);
    const set2 = evaluateSetState(ls.s2A, ls.s2B, ls.tb2A, ls.tb2B);

    if (!set1.finished) {
      return {
        matchFinished: false,
        winnerSide: null,
        activePhase: set1.inTieBreak ? "SET1_TB" : "SET1_GAMES",
        phaseTitle: set1.inTieBreak
          ? "TIE-BREAK SET 1 (A 7 PTS · DIF. 2)"
          : "SET 1 EN JUEGO (MÁX. 7 GAMES)",
        unitLabel: set1.inTieBreak ? "Punto TB" : "Game",
        fieldA: set1.inTieBreak ? "tb1A" : "s1A",
        fieldB: set1.inTieBreak ? "tb1B" : "s1B",
        set1,
        set2,
      };
    }

    if (!set2.finished) {
      return {
        matchFinished: false,
        winnerSide: null,
        activePhase: set2.inTieBreak ? "SET2_TB" : "SET2_GAMES",
        phaseTitle: set2.inTieBreak
          ? "TIE-BREAK SET 2 (A 7 PTS · DIF. 2)"
          : "SET 2 EN JUEGO (MÁX. 7 GAMES)",
        unitLabel: set2.inTieBreak ? "Punto TB" : "Game",
        fieldA: set2.inTieBreak ? "tb2A" : "s2A",
        fieldB: set2.inTieBreak ? "tb2B" : "s2B",
        set1,
        set2,
      };
    }

    if (set1.winner === set2.winner) {
      return {
        matchFinished: true,
        winnerSide: set1.winner,
        activePhase: "FINISHED_2_SETS",
        phaseTitle: "PARTIDO DEFINIDO EN 2 SETS",
        scoreString: `${set1.label}, ${set2.label}`,
        set1,
        set2,
      };
    }

    // Empate 1-1 en sets -> 3er Set es SIEMPRE Super Tie-Break a 10 puntos (dif. mínima 2)
    const stbA = Number(ls.stbA || 0);
    const stbB = Number(ls.stbB || 0);
    const maxStb = Math.max(stbA, stbB);
    const minStb = Math.min(stbA, stbB);

    if (maxStb >= 10 && maxStb - minStb >= 2) {
      const winnerSide = stbA > stbB ? "A" : "B";
      return {
        matchFinished: true,
        winnerSide,
        activePhase: "FINISHED_STB",
        phaseTitle: "PARTIDO DEFINIDO EN SUPER TIE-BREAK",
        scoreString: `${set1.label}, ${set2.label}, [${stbA}-${stbB}]`,
        set1,
        set2,
      };
    }

    return {
      matchFinished: false,
      winnerSide: null,
      activePhase: "SET3_STB",
      phaseTitle: "3ER SET · SUPER TIE-BREAK (A 10 PTS · DIF. 2)",
      unitLabel: "Punto Super TB",
      fieldA: "stbA",
      fieldB: "stbB",
      set1,
      set2,
    };
  };

  const handleRefereeStep = (ch, side, delta) => {
    if (!onUpdateLiveRefereeScore) return;
    const ls = ch.liveScore || {
      currentSet: 1,
      s1A: 0,
      s1B: 0,
      tb1A: 0,
      tb1B: 0,
      s2A: 0,
      s2B: 0,
      tb2A: 0,
      tb2B: 0,
      stbA: 0,
      stbB: 0,
    };

    const status = analyzeRefereeMatch(ls);
    if (status.matchFinished && delta > 0) return;

    const targetField = side === "A" ? status.fieldA : status.fieldB;
    if (!targetField) return;

    const currentVal = Number(ls[targetField] || 0);
    if (delta < 0 && currentVal <= 0) return;

    onUpdateLiveRefereeScore(ch.id, targetField, delta);

    const nextLs = { ...ls, [targetField]: Math.max(0, currentVal + delta) };

    if (status.activePhase === "SET1_TB" && delta > 0) {
      const tA = Number(nextLs.tb1A || 0);
      const tB = Number(nextLs.tb1B || 0);
      if (Math.max(tA, tB) >= 7 && Math.abs(tA - tB) >= 2) {
        if (tA > tB) onUpdateLiveRefereeScore(ch.id, "s1A", 1);
        else onUpdateLiveRefereeScore(ch.id, "s1B", 1);
        onUpdateLiveRefereeScore(ch.id, "advanceSet", 2);
        return;
      }
    }

    if (status.activePhase === "SET2_TB" && delta > 0) {
      const tA = Number(nextLs.tb2A || 0);
      const tB = Number(nextLs.tb2B || 0);
      if (Math.max(tA, tB) >= 7 && Math.abs(tA - tB) >= 2) {
        if (tA > tB) onUpdateLiveRefereeScore(ch.id, "s2A", 1);
        else onUpdateLiveRefereeScore(ch.id, "s2B", 1);
      }
    }

    const afterStatus = analyzeRefereeMatch(nextLs);
    if (
      afterStatus.activePhase === "SET2_GAMES" ||
      afterStatus.activePhase === "SET2_TB"
    ) {
      if (ls.currentSet !== 2) onUpdateLiveRefereeScore(ch.id, "advanceSet", 2);
    } else if (afterStatus.activePhase === "SET3_STB") {
      if (ls.currentSet !== 3) onUpdateLiveRefereeScore(ch.id, "advanceSet", 3);
    }
  };

  return (
    <div className="view-transition px-3 sm:px-5 pt-4 pb-10 space-y-5 max-w-4xl mx-auto">
      {/* ====================================================================
          1. CABECERA DE ACCIÓN + BOTÓN DE GRABACIÓN IA (SWINGVISION)
         ==================================================================== */}
      <div
        className="rounded-3xl p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl"
        style={{
          background:
            "linear-gradient(135deg, #1E0734 0%, #16092B 55%, #08241B 100%)",
          border: "1.5px solid rgba(0, 220, 125, 0.4)",
          color: "#FFFFFF",
        }}
      >
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
            CARTELERA EN VIVO · +50 💎 VICTORIA / +25 💎 ESFUERZO
          </span>
          <h1 className="font-wta-condensed text-3xl sm:text-4xl font-bold text-white leading-none mt-1">
            CENTRAL DE RETOS & MARCADORES
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenVisionIaModal && (
            <button
              type="button"
              onClick={onOpenVisionIaModal}
              className="touch-btn px-4 py-2.5 rounded-full font-display font-extrabold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5"
            >
              <Icons.Video size={16} />
              <span>Vision IA (SwingVision)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onOpenNewChallengeModal && onOpenNewChallengeModal(null)
            }
            className="touch-btn px-5 py-3 rounded-full font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl"
            style={{
              background: "#D6FF00",
              color: "#0A1633",
              boxShadow: "0 8px 24px rgba(214, 255, 0, 0.3)",
            }}
          >
            ⚔️ + Lanzar Desafío
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. SELECTOR CON ICONOS QUE CRECEN DE TAMAÑO AL SELECCIONARLOS
         ==================================================================== */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            id: "cartelera",
            title: "CARTELERA EN VIVO",
            subtitle: `${liveMatches.length + confirmedMatches.length} Partidos Activos`,
            icon: ASSETS.navRetos,
          },
          {
            id: "rivales",
            title: "RIVALES POR HORARIO",
            subtitle: `${availableRivals.length} Tenistas Disponibles`,
            icon: ASSETS.pelotaVoltAzul,
          },
        ].map((item) => {
          const isSelected = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id)}
              className="touch-btn p-4 rounded-3xl flex items-center gap-3.5 text-left transition-all duration-300"
              style={{
                transform: isSelected ? "scale(1.03)" : "scale(0.98)",
                background: isSelected
                  ? "linear-gradient(135deg, #23083C 0%, #0C2E21 100%)"
                  : "var(--bg-card)",
                border: isSelected
                  ? "2px solid #00DC7D"
                  : "1.5px solid var(--border-hairline)",
                boxShadow: isSelected
                  ? "0 14px 32px rgba(0, 220, 125, 0.25)"
                  : "none",
                color: isSelected ? "#FFFFFF" : "var(--text-main)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                style={{
                  transform: isSelected ? "scale(1.18) rotate(-6deg)" : "scale(1)",
                  background: isSelected
                    ? "rgba(0, 220, 125, 0.22)"
                    : "var(--bg-subtle)",
                  border: isSelected
                    ? "1.5px solid #00DC7D"
                    : "1px solid var(--border-hairline)",
                }}
              >
                <SafeImage
                  src={item.icon}
                  alt={item.title}
                  circular
                  style={{ width: 32, height: 32 }}
                />
              </div>

              <div className="min-w-0">
                <div className="font-wta-condensed text-xl sm:text-2xl font-bold leading-none truncate">
                  {item.title}
                </div>
                <div
                  className="text-xs font-bold mt-1 truncate"
                  style={{
                    color: isSelected ? "#00DC7D" : "var(--text-muted)",
                  }}
                >
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          3. CONTENIDO DE LA PESTAÑA ACTIVA
         ==================================================================== */}
      {subTab === "cartelera" ? (
        <div className="space-y-5">
          {/* A. Desafíos Recibidos Pendientes (Con Botón Aceptar + Contrapropuesta) */}
          {myPendingIncoming.map((ch) => {
            const challenger = players.find((p) => p.id === ch.challengerId);
            return (
              <div
                key={ch.id}
                className="rounded-3xl p-5 space-y-4 shadow-xl"
                style={{
                  background: "var(--bg-card)",
                  border: "2px solid #D6FF00",
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span
                    className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                    style={{ background: "#D6FF00", color: "#0A1633" }}
                  >
                    ⚡ Nuevo Desafío Recibido
                  </span>
                  <span className="text-xs sm:text-sm font-bold">
                    📅 {ch.dateTimeLabel}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <WtaEmeraldPortrait
                    src={challenger?.avatar}
                    name={challenger?.name}
                    size={62}
                  />
                  <div className="min-w-0">
                    <div className="font-wta-condensed text-2xl sm:text-3xl font-bold truncate">
                      {challenger?.name} vs. {currentUser?.name}
                    </div>
                    <div
                      className="text-xs sm:text-sm font-bold mt-0.5"
                      style={{ color: "var(--clay)" }}
                    >
                      📍 {ch.customClubName} · 🎾 {ch.ballAgreement}
                    </div>
                    {ch.counterProposalNote && (
                      <div className="text-xs font-extrabold text-amber-400 mt-1">
                        💬 {ch.counterProposalNote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onAcceptChallenge && onAcceptChallenge(ch.id)
                    }
                    className="touch-btn py-3.5 rounded-2xl font-display font-black text-xs sm:text-sm uppercase tracking-wider"
                    style={{ background: "#00DC7D", color: "#0A1633" }}
                  >
                    ✓ Aceptar Desafío Oficial
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenCounterProposal && onOpenCounterProposal(ch)
                    }
                    className="touch-btn py-3.5 rounded-2xl font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider border"
                    style={{
                      borderColor: "var(--border-strong)",
                      color: "var(--text-main)",
                    }}
                  >
                    📅 Proponer Otra Hora / Declinar
                  </button>
                </div>
              </div>
            );
          })}

          {/* B. PARTIDOS EN JUEGO AHORA (MODO ÁRBITRO OFICIAL ITF/ATP CON LÍMITE A 7) */}
          {liveMatches.map((ch) => {
            const pA = players.find((p) => p.id === ch.challengerId);
            const pB = players.find((p) => p.id === ch.challengedId);
            const clubA = getClubById(pA?.clubId, clubs);
            const clubB = getClubById(pB?.clubId, clubs);
            const ls = ch.liveScore || {
              currentSet: 1,
              s1A: 0,
              s1B: 0,
              tb1A: 0,
              tb1B: 0,
              s2A: 0,
              s2B: 0,
              tb2A: 0,
              tb2B: 0,
              stbA: 0,
              stbB: 0,
            };
            const isParticipant =
              currentUser?.id === pA?.id || currentUser?.id === pB?.id;
            const matchState = analyzeRefereeMatch(ls);
            const showStbColumn =
              matchState.activePhase === "SET3_STB" ||
              matchState.activePhase === "FINISHED_STB";

            return (
              <div key={ch.id} className="wta-match-card p-5 sm:p-6 space-y-5">
                {/* Cabecera Limpia: "En juego ahora" + Sede + Insignia Vision IA */}
                <div className="flex items-center justify-between gap-2 flex-wrap border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      En juego ahora
                    </span>
                    {ch.aiRecordingRequested && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white/10 text-amber-300">
                        🎥 Vision IA Activo
                      </span>
                    )}
                  </div>

                  <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                    {ch.customClubName}
                  </span>
                </div>

                {/* Jugadores Frente a Frente (Tocar abre Head to Head) */}
                <div className="grid grid-cols-7 items-center gap-2">
                  <div
                    onClick={() =>
                      onOpenHeadToHead && onOpenHeadToHead(pA, pB)
                    }
                    className="col-span-3 flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <SafeImage
                      src={pA?.avatar}
                      alt={pA?.name}
                      circular
                      style={{
                        width: 52,
                        height: 52,
                        border: "2px solid #00DC7D",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-display font-black text-sm sm:text-lg text-white truncate">
                        {pA?.name}
                      </div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        {clubA && (
                          <SafeImage
                            src={clubA.shield}
                            alt={clubA.shortName}
                            circular
                            style={{ width: 15, height: 15 }}
                          />
                        )}
                        <span>{pA?.elo} PTS</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <span className="font-wta-condensed text-lg font-bold px-3 py-1 rounded-xl bg-white/10 text-white border border-white/20">
                      VS
                    </span>
                  </div>

                  <div
                    onClick={() =>
                      onOpenHeadToHead && onOpenHeadToHead(pA, pB)
                    }
                    className="col-span-3 flex items-center justify-end gap-3 min-w-0 text-right cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-display font-black text-sm sm:text-lg text-white truncate">
                        {pB?.name}
                      </div>
                      <div className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1.5">
                        <span>{pB?.elo} PTS</span>
                        {clubB && (
                          <SafeImage
                            src={clubB.shield}
                            alt={clubB.shortName}
                            circular
                            style={{ width: 15, height: 15 }}
                          />
                        )}
                      </div>
                    </div>
                    <SafeImage
                      src={pB?.avatar}
                      alt={pB?.name}
                      circular
                      style={{
                        width: 52,
                        height: 52,
                        border: "2px solid #D6FF00",
                      }}
                    />
                  </div>
                </div>

                {/* Tablero Oficial de Sets + Tie-Break (a 7) + Super Tie-Break (a 10) */}
                <div className="rounded-2xl p-4 bg-black/45 border border-white/15 space-y-2.5">
                  <div className="grid grid-cols-12 items-center text-xs font-extrabold uppercase text-emerald-400 pb-1.5 border-b border-white/15">
                    <div className="col-span-6">{matchState.phaseTitle}</div>
                    <div className="col-span-2 text-center">SET 1</div>
                    <div className="col-span-2 text-center">SET 2</div>
                    <div className="col-span-2 text-center">
                      {showStbColumn ? "STB [10]" : "SET 3"}
                    </div>
                  </div>

                  {/* Fila Jugador A */}
                  <div className="grid grid-cols-12 items-center py-1.5">
                    <div className="col-span-6 font-display font-extrabold text-sm sm:text-base text-white truncate">
                      {pA?.name}
                    </div>
                    <div className="col-span-2 text-center font-wta-condensed text-2xl sm:text-3xl font-bold text-white tabular-nums">
                      {ls.s1A}
                      {(matchState.set1.inTieBreak ||
                        (ls.s1A === 7 && ls.s1B === 6) ||
                        (ls.s1B === 7 && ls.s1A === 6)) && (
                        <sup className="ml-0.5 text-xs text-amber-300">
                          ({ls.tb1A || 0})
                        </sup>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-wta-condensed text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
                      {ls.s2A}
                      {(matchState.set2.inTieBreak ||
                        (ls.s2A === 7 && ls.s2B === 6) ||
                        (ls.s2B === 7 && ls.s2A === 6)) && (
                        <sup className="ml-0.5 text-xs text-amber-300">
                          ({ls.tb2A || 0})
                        </sup>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-wta-condensed text-2xl sm:text-3xl font-bold text-amber-300 tabular-nums">
                      {showStbColumn ? ls.stbA || 0 : "-"}
                    </div>
                  </div>

                  {/* Fila Jugador B */}
                  <div className="grid grid-cols-12 items-center py-1.5 border-t border-white/10">
                    <div className="col-span-6 font-display font-extrabold text-sm sm:text-base text-white truncate">
                      {pB?.name}
                    </div>
                    <div className="col-span-2 text-center font-wta-condensed text-2xl sm:text-3xl font-bold text-white tabular-nums">
                      {ls.s1B}
                      {(matchState.set1.inTieBreak ||
                        (ls.s1A === 7 && ls.s1B === 6) ||
                        (ls.s1B === 7 && ls.s1A === 6)) && (
                        <sup className="ml-0.5 text-xs text-amber-300">
                          ({ls.tb1B || 0})
                        </sup>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-wta-condensed text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
                      {ls.s2B}
                      {(matchState.set2.inTieBreak ||
                        (ls.s2A === 7 && ls.s2B === 6) ||
                        (ls.s2B === 7 && ls.s2A === 6)) && (
                        <sup className="ml-0.5 text-xs text-amber-300">
                          ({ls.tb2B || 0})
                        </sup>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-wta-condensed text-2xl sm:text-3xl font-bold text-amber-300 tabular-nums">
                      {showStbColumn ? ls.stbB || 0 : "-"}
                    </div>
                  </div>
                </div>

                {/* Controles del Modo Árbitro en Vivo */}
                {!ls.liveFinishedPendingReview ? (
                  <div className="space-y-3">
                    {!matchState.matchFinished ? (
                      <>
                        {/* Aviso luminoso cuando entra en Tie-Break (6-6) o Super Tie-Break (1-1) */}
                        {(matchState.activePhase === "SET1_TB" ||
                          matchState.activePhase === "SET2_TB" ||
                          matchState.activePhase === "SET3_STB") && (
                          <div className="rounded-2xl px-4 py-2.5 bg-amber-400/20 border border-amber-400 flex items-center justify-between text-xs sm:text-sm font-extrabold text-amber-300">
                            <span>⚡ {matchState.phaseTitle}</span>
                            <span className="font-mono-code text-base">
                              {matchState.activePhase === "SET1_TB"
                                ? `${ls.tb1A || 0} - ${ls.tb1B || 0}`
                                : matchState.activePhase === "SET2_TB"
                                ? `${ls.tb2A || 0} - ${ls.tb2B || 0}`
                                : `${ls.stbA || 0} - ${ls.stbB || 0}`}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRefereeStep(ch, "A", 1)}
                              className="touch-btn flex-1 py-3 px-3 rounded-2xl font-display font-extrabold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-emerald-400/50"
                            >
                              +1 {matchState.unitLabel} {pA?.name.split(" ")[0]}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRefereeStep(ch, "A", -1)}
                              className="touch-btn px-3.5 rounded-2xl font-bold text-xs bg-black/40 text-slate-300 border border-white/15"
                              title="Restar 1"
                            >
                              -1
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRefereeStep(ch, "B", 1)}
                              className="touch-btn flex-1 py-3 px-3 rounded-2xl font-display font-extrabold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-amber-400/50"
                            >
                              +1 {matchState.unitLabel} {pB?.name.split(" ")[0]}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRefereeStep(ch, "B", -1)}
                              className="touch-btn px-3.5 rounded-2xl font-bold text-xs bg-black/40 text-slate-300 border border-white/15"
                              title="Restar 1"
                            >
                              -1
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onFinalizeRefereeMatchPendingReview &&
                          onFinalizeRefereeMatchPendingReview(
                            ch.id,
                            matchState.scoreString
                          )
                        }
                        className="touch-btn w-full py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-xl"
                        style={{ background: "#00DC7D", color: "#0A1633" }}
                      >
                        ✓ Finalizar Partido (Pendiente de Revisión ·{" "}
                        {matchState.scoreString})
                      </button>
                    )}

                    <div className="text-xs text-slate-300 flex items-center justify-between">
                      <span>
                        Árbitro en cancha: <strong>{ch.refereeName || "Comunidad"}</strong>
                      </span>
                      <span>Reglamento ITF/ATP Activo</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-3.5 bg-emerald-400/20 border border-emerald-400 text-xs sm:text-sm font-extrabold text-emerald-300">
                    ✓ Marcador de árbitro cerrado ({ch.proposedScore}) · Listo
                    para confirmación oficial
                  </div>
                )}

                {isParticipant && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenOfficialScoreModal && onOpenOfficialScoreModal(ch)
                    }
                    className="touch-btn w-full py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider"
                    style={{ background: "#D6FF00", color: "#0A1633" }}
                  >
                    Subir y Confirmar Marcador Oficial (+50 💎)
                  </button>
                )}
              </div>
            );
          })}

          {/* C. Duelos Confirmados Programados */}
          {confirmedMatches.map((ch) => {
            const pA = players.find((p) => p.id === ch.challengerId);
            const pB = players.find((p) => p.id === ch.challengedId);
            const isParticipant =
              currentUser?.id === pA?.id || currentUser?.id === pB?.id;

            return (
              <div key={ch.id} className="wta-match-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-400 text-[#1E0734]">
                    {ch.isFriendly
                      ? "Exhibición Head to Head"
                      : "Duelo Oficial Confirmado"}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200">
                    📅 {ch.dateTimeLabel}
                  </span>
                </div>

                <div className="grid grid-cols-7 items-center gap-2">
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <SafeImage
                      src={pA?.avatar}
                      alt={pA?.name}
                      circular
                      style={{ width: 48, height: 48 }}
                    />
                    <div className="min-w-0">
                      <div className="font-display font-black text-sm sm:text-base text-white truncate">
                        {pA?.name}
                      </div>
                      <div className="text-xs font-bold text-emerald-400">
                        {pA?.elo} PTS
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <span className="font-wta-condensed text-lg font-bold text-white">
                      VS
                    </span>
                  </div>

                  <div className="col-span-3 flex items-center justify-end gap-3 min-w-0 text-right">
                    <div className="min-w-0">
                      <div className="font-display font-black text-sm sm:text-base text-white truncate">
                        {pB?.name}
                      </div>
                      <div className="text-xs font-bold text-amber-300">
                        {pB?.elo} PTS
                      </div>
                    </div>
                    <SafeImage
                      src={pB?.avatar}
                      alt={pB?.name}
                      circular
                      style={{ width: 48, height: 48 }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs sm:text-sm text-slate-300">
                  <span className="font-extrabold text-amber-300">
                    📍 {ch.customClubName}
                  </span>
                  <span>🎾 {ch.ballAgreement}</span>
                </div>

                {isParticipant && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenOfficialScoreModal && onOpenOfficialScoreModal(ch)
                    }
                    className="touch-btn w-full py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider"
                    style={{ background: "#00DC7D", color: "#0A1633" }}
                  >
                    Registrar Resultado Oficial (+50 💎)
                  </button>
                )}
              </div>
            );
          })}

          {myPendingOutgoing.length > 0 && (
            <div className="atp-card p-5 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider">
                Desafíos Enviados Esperando Confirmación
              </div>
              {myPendingOutgoing.map((ch) => {
                const rival = players.find((p) => p.id === ch.challengedId);
                return (
                  <div
                    key={ch.id}
                    className="rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    <div className="min-w-0">
                      <div className="font-display font-extrabold text-sm sm:text-base truncate">
                        {currentUser?.name} vs. {rival?.name}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {ch.customClubName} · {ch.dateTimeLabel}
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/51${
                        rival?.phone || "964112233"
                      }?text=${encodeURIComponent(
                        `Hola ${rival?.name}, te envié un desafío en MATCHPOINT para jugar en ${ch.customClubName} (${ch.dateTimeLabel}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="touch-btn px-4 py-2 rounded-xl text-xs font-extrabold flex-shrink-0"
                      style={{
                        minHeight: 38,
                        background: "#00DC7D",
                        color: "#0A1633",
                      }}
                    >
                      Avisar por WA
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Sub-pestaña 2: Rivales por Horario con Botones que Crecen al Seleccionarlos */
        <div className="atp-card p-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "Todos los Turnos" },
              ...TIME_SLOT_OPTIONS.map((s) => ({
                id: s.id,
                label: `${s.label} (${s.hours})`,
              })),
            ].map((btn) => {
              const active = timeFilter === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setTimeFilter(btn.id)}
                  className="touch-btn px-4 py-2.5 rounded-full font-display font-extrabold text-xs sm:text-sm transition-all duration-200"
                  style={{
                    minHeight: 40,
                    transform: active ? "scale(1.06)" : "scale(1)",
                    background: active ? "#00DC7D" : "var(--bg-subtle)",
                    color: active ? "#1E0734" : "var(--text-main)",
                    border: active
                      ? "2px solid #00DC7D"
                      : "1px solid var(--border-hairline)",
                  }}
                >
                  {btn.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setOnlySeniorFilter((v) => !v)}
              className="touch-btn px-4 py-2.5 rounded-full font-display font-extrabold text-xs sm:text-sm"
              style={{
                minHeight: 40,
                background: onlySeniorFilter
                  ? "var(--gold)"
                  : "var(--bg-subtle)",
                color: onlySeniorFilter ? "#0A1633" : "var(--text-main)",
              }}
            >
              {onlySeniorFilter ? "★ Solo +40 Master" : "+40 Master"}
            </button>
          </div>

          <div
            className="divide-y"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            {availableRivals.map((rival) => {
              const cat = getCategoryByElo(rival.elo, rival.seasonMatches);
              const isBoss =
                currentUser &&
                rival.elo - currentUser.elo >= 450 &&
                rival.elo - currentUser.elo <= 1350;

              return (
                <div
                  key={rival.id}
                  className="py-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <WtaEmeraldPortrait
                      src={rival.avatar}
                      name={rival.name}
                      isBoss={isBoss}
                      size={56}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-black text-base sm:text-lg truncate">
                          {rival.name}
                        </span>
                        <span
                          className="px-2.5 py-0.5 rounded text-xs font-extrabold"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          {cat.short} · {rival.elo} PTS
                        </span>
                        {rival.age >= 40 && (
                          <span className="text-xs font-extrabold text-amber-400">
                            +40 Master
                          </span>
                        )}
                      </div>
                      <div
                        className="text-xs sm:text-sm mt-1 truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        📅 Días: {(rival.availableDays || []).join(", ")} · 🕒{" "}
                        {(rival.availableSlots || []).join(" / ")}
                      </div>
                      {rival.lookingForMatchToday && (
                        <div className="text-xs font-extrabold text-emerald-400 mt-1">
                          🟢 Disponible hoy:{" "}
                          {rival.lookingForMatchNote || "Cancha lista"}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenNewChallengeModal && onOpenNewChallengeModal(rival)
                    }
                    className="touch-btn px-4 py-2.5 rounded-full font-display font-black text-xs uppercase tracking-wider flex-shrink-0 shadow-md"
                    style={{
                      minHeight: 40,
                      background: isBoss ? "#A855F7" : "#D6FF00",
                      color: isBoss ? "#FFFFFF" : "#0A1633",
                    }}
                  >
                    {isBoss ? "⚔️ Retar Boss" : "Retar"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// === FIN DEL BLOQUE 8 DE 12 ===

// === INICIO DEL BLOQUE 9 DE 12 ===

// ============================================================================
// 35. ICONOS ESPECÍFICOS DE SERVICIOS E INSTALACIONES DE SEDE (ORDEN VISUAL)
// ============================================================================
export const FacilityServiceIcon = ({ iconKey = "court" }) => {
  switch (iconKey) {
    case "lights":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      );
    case "cafe":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" x2="6" y1="2" y2="4" />
          <line x1="10" x2="10" y1="2" y2="4" />
          <line x1="14" x2="14" y1="2" y2="4" />
        </svg>
      );
    case "parking":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="4" />
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </svg>
      );
    case "stringing":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="10" r="7" />
          <line x1="8" x2="14" y1="7" y2="13" />
          <line x1="14" x2="8" y1="7" y2="13" />
          <path d="m16 15 5 6" />
        </svg>
      );
    case "shop":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="12" x2="12" y1="4" y2="20" />
          <line x1="2" x2="22" y1="12" y2="12" />
        </svg>
      );
  }
};

// ============================================================================
// 36. COMPONENTE HERO DE VIDEOS Y TIPS TÉCNICOS (FORMATO EXACTO WTA TOUR
//     image_5c103d.jpg: REPRODUCTOR PANORÁMICO + BOTÓN "• WATCH NOW" +
//     4 MINIATURAS APILADAS VERTICALMENTE A LA DERECHA CON BORDE ESMERALDA)
// ============================================================================
export const WtaVideoAcademyHero = ({
  videos = WTA_VIDEO_ACADEMY_TIPS,
  unlockedVideoIds = [],
  currentUser,
  onUnlockVideoWithGems,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const activeVid = videos[selectedIdx] || videos[0];
  const isUnlocked =
    activeVid?.isFree || (unlockedVideoIds || []).includes(activeVid?.id);

  const handleSelectThumbnail = (idx) => {
    setSelectedIdx(idx);
    setIsPlayingVideo(false);
  };

  const handleWatchAction = () => {
    if (isUnlocked) {
      setIsPlayingVideo((v) => !v);
      return;
    }
    if (onUnlockVideoWithGems) {
      const ok = onUnlockVideoWithGems(activeVid);
      if (ok) setIsPlayingVideo(true);
    }
  };

  if (!activeVid) return null;

  return (
    <div className="space-y-4">
      {/* ESCENARIO PANORÁMICO PRINCIPAL CON LAS 4 MINIATURAS APILADAS A LA DERECHA */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/15"
        style={{
          minHeight: 420,
          background: "#120422",
          color: "#FFFFFF",
        }}
      >
        {/* Fondo: Video en reproducción o Imagen Hero de alta resolución */}
        {isPlayingVideo && isUnlocked ? (
          <div className="w-full h-[420px] sm:h-[460px] bg-black flex items-center justify-center relative">
            <video
              src={activeVid.videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setIsPlayingVideo(false)}
              className="touch-btn absolute top-4 left-4 px-4 py-2 rounded-full bg-black/75 text-white text-xs font-extrabold uppercase tracking-wider border border-white/25"
            >
              ← Volver a Portada
            </button>
          </div>
        ) : (
          <div className="relative w-full h-[430px] sm:h-[460px]">
            <img
              src={activeVid.thumbnailUrl}
              alt={activeVid.title}
              className="w-full h-full object-cover transition-transform duration-700"
            />
            {/* Degradado cinematográfico estilo WTA */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(19,4,36,0.92) 0%, rgba(19,4,36,0.55) 55%, rgba(19,4,36,0.78) 100%), linear-gradient(0deg, rgba(19,4,36,0.95) 0%, transparent 65%)",
              }}
            />

            {/* Grid Interno: Izquierda Titular + "• VER AHORA" | Derecha 4 Miniaturas Apiladas */}
            <div className="absolute inset-0 p-5 sm:p-8 grid grid-cols-1 md:grid-cols-12 items-end gap-5">
              {/* Columna Izquierda (Abajo): Píldora FEATURES + Título Gigante + Botón "• WATCH NOW" */}
              <div className="md:col-span-8 space-y-3.5 my-auto md:my-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider backdrop-blur-md"
                    style={{
                      background: activeVid.isFree
                        ? "rgba(255, 255, 255, 0.18)"
                        : "rgba(245, 158, 11, 0.28)",
                      color: activeVid.isFree ? "#FFFFFF" : "#FDE68A",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    {activeVid.categoryBadge}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400">
                    ⏱ {activeVid.duration} · {activeVid.coachName}
                  </span>
                </div>

                <h2 className="font-display font-black text-2xl sm:text-4xl text-white leading-[1.12] tracking-tight max-w-xl">
                  {activeVid.title}
                </h2>

                {/* Claves Técnicas del Video */}
                <div className="hidden sm:flex flex-wrap gap-2 pt-1">
                  {(activeVid.keyTakeaways || []).map((tip, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 border border-white/10"
                    >
                      ✓ {tip}
                    </span>
                  ))}
                </div>

                {/* Botón Icónico WTA "• WATCH NOW" (o Desbloquear con Gemas) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleWatchAction}
                    className="touch-btn px-6 py-3 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-xl transition-transform"
                    style={{
                      background: isUnlocked
                        ? "rgba(19, 4, 36, 0.78)"
                        : "#00DC7D",
                      color: isUnlocked ? "#FFFFFF" : "#1E0734",
                      border: "2px solid #00DC7D",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: isUnlocked ? "#00DC7D" : "#1E0734",
                      }}
                    />
                    <span>
                      {isUnlocked
                        ? "VER VIDEO AHORA"
                        : `DESBLOQUEAR MASTERCLASS (${activeVid.gemCost} 💎 GEMAS)`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Las 4 Miniaturas Apiladas Verticalmente (image_5c103d.jpg) */}
              <div className="md:col-span-4 flex md:flex-col gap-2.5 overflow-x-auto md:overflow-visible no-scrollbar justify-end">
                {videos.map((vid, idx) => {
                  const isCurrent = idx === selectedIdx;
                  const unlocked =
                    vid.isFree || (unlockedVideoIds || []).includes(vid.id);
                  return (
                    <button
                      key={vid.id}
                      type="button"
                      onClick={() => handleSelectThumbnail(idx)}
                      className="relative flex-shrink-0 w-36 sm:w-44 md:w-48 h-20 sm:h-22 rounded-2xl overflow-hidden transition-all duration-300 group text-left"
                      style={{
                        transform: isCurrent ? "scale(1.05)" : "scale(0.96)",
                        border: isCurrent
                          ? "3px solid #00DC7D"
                          : "1.5px solid rgba(255,255,255,0.25)",
                        boxShadow: isCurrent
                          ? "0 8px 25px rgba(0, 220, 125, 0.45)"
                          : "none",
                      }}
                    >
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase"
                            style={{
                              background: unlocked ? "#00DC7D" : "#F59E0B",
                              color: "#1E0734",
                            }}
                          >
                            {unlocked ? "GRATIS" : `${vid.gemCost} 💎`}
                          </span>
                          <span className="text-[10px] font-bold text-white">
                            {vid.duration}
                          </span>
                        </div>
                        <div className="text-[11px] font-extrabold text-white leading-tight line-clamp-2">
                          {vid.title}
                        </div>
                      </div>
                      {/* Barra verde inferior de progreso activo (idéntica a la miniatura activa de la WTA) */}
                      {isCurrent && (
                        <div
                          className="absolute bottom-0 inset-x-0 h-1"
                          style={{ background: "#00DC7D" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 37. VISTA PRINCIPAL: SEDES OFICIALES, ACADEMIA TV & COACH PRO B2B
//     - CERO títulos redundantes arriba: Barra interactiva directa + Clima UV
//     - Fichas de Clubes con Precios Día/Noche, Horarios, Servicios con Iconos y Video
// ============================================================================
export const SedesAndCoachProView = ({
  clubs = HUANCAYO_CLUBS,
  coaches = INITIAL_COACHES,
  videos = WTA_VIDEO_ACADEMY_TIPS,
  unlockedVideoIds = [],
  currentUser,
  liveWeather = { temp: 19, uv: 8 },
  surfaceWeatherStates = SURFACE_WEATHER_STATES,
  onUpdateSurfaceWeather,
  onOpenClubDetailModal,
  onOpenCoachProfileModal,
  onUnlockVideoWithGems,
}) => {
  const [subTab, setSubTab] = useState("sedes"); // 'sedes' | 'academia_tv' | 'coaches'

  return (
    <div className="view-transition px-3 sm:px-5 pt-4 pb-10 space-y-5 max-w-4xl mx-auto">
      {/* ====================================================================
          1. BARRA SUPERIOR DIRECTA (SIN TÍTULOS DUPLICADOS) + CLIMA UV EN VIVO
         ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Píldoras de Navegación con Crecimiento Elástico al Seleccionar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            {
              id: "sedes",
              label: `🏟️ Clubes & Canchas (${clubs.length})`,
            },
            {
              id: "academia_tv",
              label: `🎬 Tips & Academia TV (${videos.length})`,
            },
            {
              id: "coaches",
              label: `🎾 Coach Pro (${coaches.length})`,
            },
          ].map((tab) => {
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className="touch-btn px-4 sm:px-5 py-2.5 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap transition-all duration-200"
                style={{
                  minHeight: 42,
                  transform: active ? "scale(1.05)" : "scale(1)",
                  background: active ? "#00DC7D" : "var(--bg-card)",
                  color: active ? "#1E0734" : "var(--text-main)",
                  border: active
                    ? "2px solid #00DC7D"
                    : "1.5px solid var(--border-strong)",
                  boxShadow: active
                    ? "0 8px 22px rgba(0, 220, 125, 0.28)"
                    : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Badge Compacto de Clima e Índice UV en Huancayo */}
        <div
          className="px-4 py-2 rounded-full flex items-center gap-2.5 text-xs sm:text-sm font-extrabold"
          style={{
            background: "var(--bg-card)",
            border: "1.5px solid var(--border-strong)",
          }}
        >
          <span>🌤️ {liveWeather?.temp ?? 19}°C Huancayo</span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-black"
            style={{ background: "var(--gold-bg)", color: "var(--gold)" }}
          >
            UV {liveWeather?.uv ?? 8}
          </span>
        </div>
      </div>

      {/* ====================================================================
          MODO 1: SEDES OFICIALES (CON PRECIOS, HORARIOS, SERVICIOS CON ICONOS Y VIDEO)
         ==================================================================== */}
      {subTab === "sedes" && (
        <div className="space-y-6">
          {clubs.map((club) => {
            const weather =
              surfaceWeatherStates.find(
                (w) => w.id === club.surfaceStateId
              ) || surfaceWeatherStates[0];

            return (
              <div
                key={club.id}
                className="atp-card overflow-hidden transition-all"
                style={{
                  border: "1.5px solid var(--border-strong)",
                }}
              >
                {/* Portada Hero de la Sede con Botón Directo de Video de Canchas */}
                <div
                  onClick={() =>
                    onOpenClubDetailModal && onOpenClubDetailModal(club)
                  }
                  className="h-48 sm:h-56 w-full relative cursor-pointer group overflow-hidden"
                >
                  <img
                    src={club.bannerImage}
                    alt={club.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {/* Escudo + Superficie + Horario de Operación */}
                  <div className="absolute top-3.5 left-4 flex items-center gap-2.5 flex-wrap">
                    <SafeImage
                      src={club.shield}
                      alt={club.shortName}
                      circular
                      style={{
                        width: 46,
                        height: 46,
                        border: "2px solid #FFFFFF",
                        background: "#0A1633",
                      }}
                    />
                    <span
                      className="px-3 py-1 rounded-full text-xs font-extrabold uppercase"
                      style={{ background: "var(--clay)", color: "#FFFFFF" }}
                    >
                      {club.courtsCount} Canchas · {club.surface}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 text-white border border-white/20">
                      🕒 {club.operatingHours || "06:00 a 22:00 h"}
                    </span>
                  </div>

                  {/* Estado Climático de la Superficie */}
                  <div className="absolute top-3.5 right-4">
                    <span
                      className="px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase flex items-center gap-1.5 shadow-lg"
                      style={{
                        background: "rgba(10, 22, 51, 0.90)",
                        color: weather.color,
                        border: `1.5px solid ${weather.color}`,
                      }}
                    >
                      <SafeImage
                        src={weather.icon}
                        alt={weather.shortLabel}
                        style={{ width: 18, height: 18 }}
                      />
                      <span>{weather.shortLabel}</span>
                    </span>
                  </div>

                  {/* Nombre Monumental del Club + Botón de Video */}
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold text-white leading-none">
                        {club.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-200 font-semibold mt-1">
                        📍 {club.address || club.zone}
                      </p>
                    </div>

                    <span
                      className="px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
                      style={{ background: "#00DC7D", color: "#1E0734" }}
                    >
                      <Icons.Play size={14} />
                      <span>Ver Video & Fotos</span>
                    </span>
                  </div>
                </div>

                {/* Cuerpo Ordenado del Club: 1. Tarifas Horarias | 2. Servicios con Iconos | 3. Clima (+5 💎) | 4. Botones */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* 1. TABLA CLARA DE PRECIOS POR HORA Y HORARIO DE OPERACIÓN */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div
                      className="rounded-2xl p-3"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-hairline)",
                      }}
                    >
                      <div
                        className="text-[11px] font-extrabold uppercase"
                        style={{ color: "var(--text-muted)" }}
                      >
                        ☀️ Turno Día
                      </div>
                      <div className="font-wta-condensed text-2xl sm:text-3xl font-bold mt-0.5 tabular-nums">
                        S/ {club.dayPrice ?? 30}
                      </div>
                      <div
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        06:00 a 18:00 h
                      </div>
                    </div>

                    <div
                      className="rounded-2xl p-3"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-hairline)",
                      }}
                    >
                      <div
                        className="text-[11px] font-extrabold uppercase"
                        style={{ color: "var(--electric)" }}
                      >
                        💡 Turno Noche LED
                      </div>
                      <div className="font-wta-condensed text-2xl sm:text-3xl font-bold mt-0.5 tabular-nums">
                        S/ {club.nightPrice ?? 40}
                      </div>
                      <div
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        18:00 a 22:00 h
                      </div>
                    </div>

                    <div
                      className="rounded-2xl p-3"
                      style={{
                        background: "var(--gold-bg)",
                        border: "1.5px solid var(--gold-border)",
                      }}
                    >
                      <div
                        className="text-[11px] font-extrabold uppercase"
                        style={{ color: "var(--gold)" }}
                      >
                        ★ Tarifa Socio VIP
                      </div>
                      <div
                        className="font-wta-condensed text-2xl sm:text-3xl font-bold mt-0.5 tabular-nums"
                        style={{ color: "var(--gold)" }}
                      >
                        S/ {club.memberPrice ?? 22}
                      </div>
                      <div
                        className="text-[11px] font-bold"
                        style={{ color: "var(--gold)" }}
                      >
                        Con Carnet VIP
                      </div>
                    </div>
                  </div>

                  {/* 2. GRILLA ORDENADA DE SERVICIOS CON SU PROPIO ICONO VECTORIAL */}
                  <div className="space-y-2.5">
                    <div
                      className="text-xs font-extrabold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Servicios e Instalaciones Verificadas
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(club.facilities || []).map((fac, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl p-3.5 flex items-start gap-3"
                          style={{
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border-hairline)",
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "rgba(0, 220, 125, 0.16)",
                              color: "var(--wta-emerald)",
                            }}
                          >
                            <FacilityServiceIcon iconKey={fac.iconKey} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-extrabold text-sm leading-tight">
                              {fac.title}
                            </div>
                            <div
                              className="text-xs mt-0.5 leading-snug"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {fac.detail}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. REPORTE COMUNITARIO DE ESTADO DE CANCHA (PREMIA CON +5 💎 GEMAS) */}
                  <div
                    className="rounded-2xl p-3.5 space-y-2.5"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold">
                        ¿Estás en el club? Reporta el estado de la cancha{" "}
                        <span style={{ color: "var(--wta-emerald)" }}>
                          (+5 💎 Gemas)
                        </span>
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        Último: {club.lastReportBy} ({club.lastReportTime})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {surfaceWeatherStates.map((st) => {
                        const isCurrent = club.surfaceStateId === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() =>
                              onUpdateSurfaceWeather &&
                              onUpdateSurfaceWeather(club.id, st.id)
                            }
                            className="touch-btn py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all"
                            style={{
                              minHeight: 38,
                              background: isCurrent
                                ? "var(--bg-card)"
                                : "transparent",
                              borderColor: isCurrent
                                ? st.color
                                : "var(--border-hairline)",
                              color: isCurrent
                                ? st.color
                                : "var(--text-muted)",
                            }}
                          >
                            <SafeImage
                              src={st.icon}
                              alt={st.shortLabel}
                              style={{ width: 16, height: 16 }}
                            />
                            <span>{st.shortLabel.split("·")[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. BOTONES DE ACCIÓN DIRECTA: DISPONIBILIDAD WHATSAPP + GOOGLE MAPS + VIDEO */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <a
                      href={`https://wa.me/${
                        club.whatsappPhone || "51964112233"
                      }?text=${encodeURIComponent(
                        `Hola ${club.name}, soy ${
                          currentUser?.name || "tenista de MATCHPOINT"
                        }. Deseo consultar disponibilidad de cancha de arcilla para hoy/esta semana.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="touch-btn py-3.5 px-4 rounded-2xl font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                      style={{ background: "#00DC7D", color: "#0A1633" }}
                    >
                      <span>💬 Consultar / Reservar</span>
                    </a>

                    <a
                      href={club.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="touch-btn py-3.5 px-4 rounded-2xl font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider border flex items-center justify-center gap-1.5"
                      style={{
                        borderColor: "var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    >
                      <Icons.MapPin size={16} />
                      <span>Ubicación Maps</span>
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenClubDetailModal && onOpenClubDetailModal(club)
                      }
                      className="touch-btn py-3.5 px-4 rounded-2xl font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider"
                      style={{
                        background: "#D6FF00",
                        color: "#0A1633",
                      }}
                    >
                      🎬 Video & Beneficios VIP
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================================
          MODO 2: ACADEMIA TV & TIPS TÉCNICOS (HERO WTA CON 4 MINIATURAS APILADAS)
         ==================================================================== */}
      {subTab === "academia_tv" && (
        <div className="space-y-5">
          <WtaVideoAcademyHero
            videos={videos}
            unlockedVideoIds={unlockedVideoIds}
            currentUser={currentUser}
            onUnlockVideoWithGems={onUnlockVideoWithGems}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((vid) => {
              const unlocked =
                vid.isFree || (unlockedVideoIds || []).includes(vid.id);
              return (
                <div
                  key={vid.id}
                  className="atp-card p-5 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                      style={{
                        background: unlocked
                          ? "var(--emerald-bg)"
                          : "var(--gold-bg)",
                        color: unlocked ? "var(--wta-emerald)" : "var(--gold)",
                      }}
                    >
                      {unlocked
                        ? "✓ Desbloqueado / Gratis"
                        : `Masterclass · ${vid.gemCost} 💎`}
                    </span>
                    <h4 className="font-display font-black text-sm sm:text-base leading-snug">
                      {vid.title}
                    </h4>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {vid.coachName} · {vid.clubName} ({vid.duration})
                    </div>
                  </div>

                  {!unlocked && onUnlockVideoWithGems && (
                    <button
                      type="button"
                      onClick={() => onUnlockVideoWithGems(vid)}
                      className="touch-btn px-4 py-2.5 rounded-xl font-display font-extrabold text-xs uppercase flex-shrink-0"
                      style={{ background: "#00DC7D", color: "#1E0734" }}
                    >
                      Canjear {vid.gemCost} 💎
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODO 3: MARKETPLACE COACH PRO B2B (ENTRENADORES DE HUANCAYO + GEMAS)
         ==================================================================== */}
      {subTab === "coaches" && (
        <div className="space-y-5">
          {/* Banner superior de Academia & Tips */}
          <WtaVideoAcademyHero
            videos={videos}
            unlockedVideoIds={unlockedVideoIds}
            currentUser={currentUser}
            onUnlockVideoWithGems={onUnlockVideoWithGems}
          />

          <div className="grid grid-cols-1 gap-4">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                onClick={() =>
                  onOpenCoachProfileModal && onOpenCoachProfileModal(coach)
                }
                className="atp-card p-5 sm:p-6 space-y-4 cursor-pointer transition-transform hover:-translate-y-0.5"
                style={{
                  border: "1.5px solid var(--border-strong)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <WtaEmeraldPortrait
                      src={coach.avatar}
                      name={coach.name}
                      rank={1}
                      size={66}
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2.5 py-0.5 rounded-md text-xs font-extrabold"
                          style={{
                            background: "var(--gold-bg)",
                            color: "var(--gold)",
                            border: "1px solid var(--gold-border)",
                          }}
                        >
                          ★ {coach.rating} ({coach.reviewsCount} reseñas)
                        </span>
                        <span
                          className="text-xs sm:text-sm font-extrabold"
                          style={{ color: "var(--clay)" }}
                        >
                          📍 {coach.clubName}
                        </span>
                      </div>

                      <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold leading-none truncate">
                        {coach.name}
                      </h3>

                      <p
                        className="text-xs sm:text-sm font-semibold truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {coach.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-wta-condensed text-3xl sm:text-4xl font-bold tabular-nums">
                      {coach.priceLabel}
                    </div>
                    <div
                      className="text-xs font-bold"
                      style={{ color: "var(--wta-emerald)" }}
                    >
                      Acepta canje de 💎 Gemas
                    </div>
                  </div>
                </div>

                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {coach.bio}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <span className="text-xs sm:text-sm font-bold text-emerald-400">
                    🏆 {coach.studentsPromoted} tenistas ascendidos de categoría
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenCoachProfileModal)
                        onOpenCoachProfileModal(coach);
                    }}
                    className="touch-btn px-5 py-2.5 rounded-full font-display font-black text-xs sm:text-sm uppercase tracking-wider"
                    style={{ background: "#00DC7D", color: "#0A1633" }}
                  >
                    Ver Packs, Videos y Turnos Libres →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SedesAndCoachView = SedesAndCoachProView;

// ============================================================================
// 38. MODAL COMPLETO DE SEDE (CON VIDEO DE LAS CANCHAS, GALERÍA DE FOTOS,
//     TABLA DE PRECIOS, SERVICIOS CON ICONOS Y BENEFICIOS VIP)
// ============================================================================
export const ClubDetailModal = ({ isOpen, onClose, club, onOpenVipModal }) => {
  const [mediaMode, setMediaMode] = useState("video"); // 'video' | 'photos'
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    setMediaMode("photos");
    setPhotoIdx(0);
  }, [club, isOpen]);

  if (!isOpen || !club) return null;

  const photos =
    club.gallery && club.gallery.length > 0
      ? club.gallery
      : [club.bannerImage];

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-2xl rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visor Superior: Video de las Canchas o Galería Fotográfica */}
        <div className="relative h-60 sm:h-72 w-full bg-black">
          {mediaMode === "video" && club.videoUrl ? (
            <video
              src={club.videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <img
                src={photos[photoIdx] || club.bannerImage}
                alt={club.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
            </>
          )}

          {/* Botones Superiores Flotantes: Alternar Video / Fotos + Cerrar */}
          <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMediaMode("photos")}
                className="px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase"
                style={{
                  background:
                    mediaMode === "photos" ? "#00DC7D" : "rgba(0,0,0,0.7)",
                  color: mediaMode === "photos" ? "#1E0734" : "#FFFFFF",
                }}
              >
                📷 Fotos ({photos.length})
              </button>
              {club.videoUrl && (
                <button
                  type="button"
                  onClick={() => setMediaMode("video")}
                  className="px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase flex items-center gap-1.5"
                  style={{
                    background:
                      mediaMode === "video" ? "#D6FF00" : "rgba(0,0,0,0.7)",
                    color: mediaMode === "video" ? "#0A1633" : "#FFFFFF",
                  }}
                >
                  <Icons.Play size={13} />
                  <span>Video de Canchas</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="touch-btn w-10 h-10 rounded-full bg-black/70 text-white"
            >
              <Icons.Close size={20} />
            </button>
          </div>

          {mediaMode === "photos" && (
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <SafeImage
                  src={club.shield}
                  alt={club.name}
                  circular
                  style={{
                    width: 50,
                    height: 50,
                    border: "2px solid #FFFFFF",
                    background: "#0A1633",
                  }}
                />
                <div>
                  <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold text-white leading-none">
                    {club.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1">
                    {club.address} · 🕒 {club.operatingHours || "06:00 a 22:00 h"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cuerpo Detallado del Club */}
        <div className="p-6 overflow-y-auto space-y-5 no-scrollbar">
          {/* Tabla de Tarifas y Horarios */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div
              className="rounded-2xl p-3.5"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <div className="text-xs font-extrabold uppercase">Turno Día</div>
              <div className="font-wta-condensed text-3xl font-bold mt-1">
                S/ {club.dayPrice ?? 30}
              </div>
              <div
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Por hora
              </div>
            </div>

            <div
              className="rounded-2xl p-3.5"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <div className="text-xs font-extrabold uppercase text-sky-400">
                Turno Noche LED
              </div>
              <div className="font-wta-condensed text-3xl font-bold mt-1">
                S/ {club.nightPrice ?? 40}
              </div>
              <div
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Con reflectores
              </div>
            </div>

            <div
              className="rounded-2xl p-3.5"
              style={{
                background: "var(--gold-bg)",
                border: "1.5px solid var(--gold-border)",
              }}
            >
              <div
                className="text-xs font-extrabold uppercase"
                style={{ color: "var(--gold)" }}
              >
                Socio VIP
              </div>
              <div
                className="font-wta-condensed text-3xl font-bold mt-1"
                style={{ color: "var(--gold)" }}
              >
                S/ {club.memberPrice ?? 22}
              </div>
              <div
                className="text-[11px] font-bold"
                style={{ color: "var(--gold)" }}
              >
                Tarifa Especial
              </div>
            </div>
          </div>

          {/* Beneficios Exclusivos Socio VIP */}
          <div
            className="rounded-3xl p-4 sm:p-5 space-y-2.5"
            style={{
              background: "var(--gold-bg)",
              border: "1.5px solid var(--gold-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs sm:text-sm font-extrabold uppercase tracking-wider"
                style={{ color: "var(--gold)" }}
              >
                ★ Convenio Oficial Pase Socio VIP
              </span>
              {onOpenVipModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVipModal();
                  }}
                  className="text-xs font-extrabold underline"
                  style={{ color: "var(--gold)" }}
                >
                  Activar Carnet VIP →
                </button>
              )}
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {(club.vipBenefitsList || []).map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 font-medium">
                  <span style={{ color: "var(--gold)" }}>✓</span>
                  <span style={{ color: "var(--text-main)" }}>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lista de Servicios con Iconos */}
          <div className="space-y-2.5">
            <h3 className="font-wta-condensed text-2xl font-bold tracking-wide">
              INSTALACIONES Y SERVICIOS EN SEDE
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(club.facilities || []).map((fac, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-3.5 flex items-start gap-3"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(0, 220, 125, 0.16)",
                      color: "var(--wta-emerald)",
                    }}
                  >
                    <FacilityServiceIcon iconKey={fac.iconKey} />
                  </div>
                  <div>
                    <div className="font-display font-extrabold text-sm">
                      {fac.title}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {fac.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={club.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="touch-btn py-3.5 rounded-2xl font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border"
              style={{
                borderColor: "var(--border-strong)",
                color: "var(--text-main)",
              }}
            >
              <Icons.MapPin size={16} />
              <span>Abrir Google Maps</span>
            </a>

            <a
              href={`https://wa.me/${
                club.whatsappPhone || "51964112233"
              }?text=${encodeURIComponent(
                `Hola ${club.name}, vengo de MATCHPOINT y deseo reservar cancha de arcilla.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="touch-btn py-3.5 rounded-2xl font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center shadow-lg"
              style={{ background: "#00DC7D", color: "#0A1633" }}
            >
              💬 Reservar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 39. MODAL B2B DE COACH PRO (CON CANJE DE GEMAS 💎 Y PIN PRIVADO INDIVIDUAL)
// ============================================================================
export const CoachProProfileModal = ({
  isOpen,
  onClose,
  coach,
  currentUser,
  onSaveCoachProfile,
  onAddCoachReview,
  onRedeemCoachPackageWithGems,
}) => {
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [isCoachEditorOpen, setIsCoachEditorOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(coach?.pricePerHour || 50);
  const [newSlotText, setNewSlotText] = useState("");

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (coach && isOpen) {
      setEditingPrice(coach.pricePerHour || 50);
      setShowPinAuth(false);
      setIsCoachEditorOpen(false);
      setEnteredPin("");
      setActiveVideoUrl(null);
      setShowReviewForm(false);
      setReviewComment("");
    }
  }, [coach, isOpen]);

  if (!isOpen || !coach) return null;

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (enteredPin.trim() === String(coach.PrivatePin)) {
      setIsCoachEditorOpen(true);
      setShowPinAuth(false);
    } else {
      alert("PIN incorrecto. Cada entrenador tiene su clave privada individual.");
      setEnteredPin("");
    }
  };

  const handleSaveCoachChanges = () => {
    const numPrice = Math.max(20, Number(editingPrice) || 50);
    const updatedSlots = newSlotText.trim()
      ? [...(coach.freeSlots || []), newSlotText.trim()]
      : coach.freeSlots || [];

    if (onSaveCoachProfile) {
      onSaveCoachProfile({
        ...coach,
        pricePerHour: numPrice,
        priceLabel: `S/ ${numPrice}`,
        freeSlots: updatedSlots,
      });
    }
    setNewSlotText("");
    setIsCoachEditorOpen(false);
  };

  const handleRemoveSlot = (slotToRemove) => {
    if (!onSaveCoachProfile) return;
    onSaveCoachProfile({
      ...coach,
      freeSlots: (coach.freeSlots || []).filter((s) => s !== slotToRemove),
    });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    const cat = getCategoryByElo(currentUser?.elo || 2000);
    if (onAddCoachReview) {
      onAddCoachReview(coach.id, {
        id: `rev_${Date.now()}`,
        author: currentUser?.name || "Tenista",
        category: cat.name,
        rating: 5,
        date: "15 Nov 2026",
        comment: reviewComment.trim(),
      });
    }
    setReviewComment("");
    setShowReviewForm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-xl rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Hero del Entrenador */}
        <div className="h-48 w-full relative">
          <img
            src={coach.bannerImage}
            alt={coach.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="touch-btn absolute top-3.5 right-4 w-10 h-10 rounded-full bg-black/70 text-white"
          >
            <Icons.Close size={20} />
          </button>

          <div className="absolute bottom-4 left-5 right-5 flex items-center gap-4">
            <SafeImage
              src={coach.avatar}
              alt={coach.name}
              circular
              style={{ width: 68, height: 68, border: "2.5px solid #00DC7D" }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
                  style={{ background: "#00DC7D", color: "#1E0734" }}
                >
                  ★ {coach.rating} ({coach.reviewsCount})
                </span>
                <span className="text-xs sm:text-sm text-amber-300 font-bold truncate">
                  {coach.clubName}
                </span>
              </div>
              <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold text-white truncate mt-1 leading-none">
                {coach.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 truncate mt-0.5">
                {coach.specialty}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 no-scrollbar">
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {coach.bio}
          </p>

          {/* Botón de Video Demostrativo del Profesor */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() =>
                setActiveVideoUrl(
                  activeVideoUrl === coach.videoVertical
                    ? null
                    : coach.videoVertical
                )
              }
              className="touch-btn py-2.5 px-5 rounded-full font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-2"
              style={{ background: "var(--electric)", color: "#FFFFFF" }}
            >
              <Icons.Play size={15} />
              <span>
                {activeVideoUrl === coach.videoVertical
                  ? "Cerrar Video"
                  : "Ver Video de Entrenamiento en Cancha"}
              </span>
            </button>

            {activeVideoUrl && (
              <div className="rounded-3xl overflow-hidden bg-black aspect-[9/16] max-h-72 flex justify-center">
                <video
                  src={activeVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-auto object-contain"
                />
              </div>
            )}
          </div>

          {/* Packs de Clases Individuales y Grupales + Canje con Gemas */}
          <div className="space-y-3">
            <h3 className="font-wta-condensed text-2xl font-bold tracking-wide">
              PROGRAMAS, CLASES GRUPALES & CANJE DE GEMAS 💎
            </h3>

            <div className="space-y-3">
              {(coach.packages || []).map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-3xl p-4 space-y-2.5"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1.5px solid var(--border-strong)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-3 py-0.5 rounded-full text-xs font-extrabold uppercase"
                      style={{
                        background: "var(--gold-bg)",
                        color: "var(--gold)",
                      }}
                    >
                      {pkg.badge}
                    </span>
                    <div className="text-right">
                      <span className="font-wta-condensed text-2xl sm:text-3xl font-bold tabular-nums">
                        S/ {pkg.price}
                      </span>
                      {pkg.vipPrice && (
                        <span
                          className="block text-xs font-extrabold"
                          style={{ color: "var(--wta-emerald)" }}
                        >
                          Socio VIP: S/ {pkg.vipPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-display font-black text-base">
                    {pkg.name}
                  </div>
                  <div
                    className="text-xs sm:text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {pkg.description}
                  </div>

                  {pkg.gemRedeemText && (
                    <div className="text-xs font-extrabold text-amber-400">
                      💎 {pkg.gemRedeemText}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <a
                      href={`https://wa.me/${coach.phone}?text=${encodeURIComponent(
                        `Hola ${coach.name}, vi tu programa "${pkg.name}" (S/ ${pkg.price}) en MATCHPOINT y deseo agendar.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="touch-btn py-3 rounded-2xl font-display font-black text-xs uppercase tracking-wider text-center"
                      style={{ background: "#00DC7D", color: "#0A1633" }}
                    >
                      💬 Reservar por WhatsApp
                    </a>

                    {onRedeemCoachPackageWithGems && (
                      <button
                        type="button"
                        onClick={() =>
                          onRedeemCoachPackageWithGems(coach, pkg)
                        }
                        className="touch-btn py-3 rounded-2xl font-display font-extrabold text-xs uppercase tracking-wider border"
                        style={{
                          borderColor: "var(--gold-border)",
                          background: "var(--gold-bg)",
                          color: "var(--gold)",
                        }}
                      >
                        💎 Aplicar Mis Gemas ({currentUser?.gems ?? 150})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Huecos Libres de esta Semana */}
          <div
            className="rounded-3xl p-4 space-y-2.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <h3 className="font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider">
              🕒 Turnos Libres esta Semana (Toca uno para separar)
            </h3>
            <div className="flex flex-wrap gap-2">
              {(coach.freeSlots || []).map((slot, idx) => (
                <a
                  key={idx}
                  href={`https://wa.me/${coach.phone}?text=${encodeURIComponent(
                    `Hola ${coach.name}, quiero separar el turno libre del ${slot} en ${coach.clubName}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold tabular-nums transition-transform active:scale-95"
                  style={{
                    background: "var(--bg-card)",
                    border: "1.5px solid var(--border-strong)",
                    color: "var(--text-player)",
                  }}
                >
                  {slot}
                </a>
              ))}
            </div>
          </div>

          {/* Reseñas Verificadas */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-wta-condensed text-2xl font-bold tracking-wide">
                RESEÑAS DE ALUMNOS ({(coach.reviews || []).length})
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="text-xs sm:text-sm font-extrabold"
                style={{ color: "var(--wta-emerald)" }}
              >
                {showReviewForm ? "Cancelar" : "+ Escribir Reseña"}
              </button>
            </div>

            {showReviewForm && (
              <form
                onSubmit={handleSubmitReview}
                className="rounded-2xl p-4 space-y-2.5"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1.5px solid var(--border-strong)",
                }}
              >
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Cuenta cómo te ayudaron las clases en tu juego..."
                  className="w-full p-3 rounded-xl text-sm focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-main)",
                  }}
                />
                <button
                  type="submit"
                  className="touch-btn w-full py-2.5 rounded-xl font-display font-black text-xs uppercase"
                  style={{ background: "#00DC7D", color: "#0A1633" }}
                >
                  Publicar Reseña
                </button>
              </form>
            )}

            <div className="space-y-2">
              {(coach.reviews || []).map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl p-3.5 space-y-1"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-extrabold">
                      {rev.author} ·{" "}
                      <span style={{ color: "var(--wta-emerald)" }}>
                        {rev.category}
                      </span>
                    </span>
                    <span style={{ color: "var(--gold)" }}>★★★★★</span>
                  </div>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Portal Privado del Profesor con PIN Individual */}
          <div
            className="pt-3 border-t"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            {!isCoachEditorOpen && !showPinAuth ? (
              <button
                type="button"
                onClick={() => setShowPinAuth(true)}
                className="text-xs font-extrabold flex items-center gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <Icons.Lock size={14} />
                <span>
                  Acceso Profesor ({coach.name}) · Editar Tarifas y Horarios
                </span>
              </button>
            ) : showPinAuth ? (
              <form
                onSubmit={handleVerifyPin}
                className="rounded-2xl p-4 space-y-2.5"
                style={{
                  background: "var(--bg-card)",
                  border: "1.5px solid var(--border-strong)",
                }}
              >
                <div className="text-xs font-bold">
                  Ingresa el PIN privado de {coach.name}
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    placeholder="PIN de 4 dígitos"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                  <button
                    type="submit"
                    className="touch-btn px-5 py-2.5 rounded-xl text-xs font-black uppercase"
                    style={{ background: "#00DC7D", color: "#0A1633" }}
                  >
                    Entrar
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: "var(--emerald-bg)",
                  border: "1.5px solid var(--wta-emerald)",
                }}
              >
                <div
                  className="font-display font-black text-sm"
                  style={{ color: "var(--wta-emerald)" }}
                >
                  ✓ Panel Privado Autorizado: {coach.name}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    Tarifa base por hora (S/)
                  </label>
                  <input
                    type="number"
                    value={editingPrice}
                    onChange={(e) => setEditingPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    Agregar nuevo turno libre
                  </label>
                  <input
                    type="text"
                    value={newSlotText}
                    onChange={(e) => setNewSlotText(e.target.value)}
                    placeholder="Ej. Vie 17:00 - 18:00"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(coach.freeSlots || []).map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleRemoveSlot(slot)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{
                        background: "rgba(244,63,94,0.18)",
                        color: "var(--crimson)",
                      }}
                    >
                      ✕ {slot}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveCoachChanges}
                  className="touch-btn w-full py-3 rounded-xl text-xs font-black uppercase"
                  style={{ background: "#00DC7D", color: "#0A1633" }}
                >
                  Guardar Cambios del Profesor
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 9 DE 12 ===

// === INICIO DEL BLOQUE 10 DE 12 ===

// ============================================================================
// 40. MODAL COMPLETO DE CADA TORNEO (SE ABRE AL HACER CLIC EN UNA FICHA)
//     Pestañas: 1. Premios y Detalles | 2. Jugadores Inscritos | 3. Cuadro y Fases
// ============================================================================
export const TournamentFullDetailModal = ({
  isOpen,
  onClose,
  tournament,
  players = [],
  currentUser,
  clubs = HUANCAYO_CLUBS,
  onOpenPaymentModal,
  onOpenHeadToHead,
}) => {
  const [activeTab, setActiveTab] = useState("premios"); // 'premios' | 'inscritos' | 'cuadro'

  useEffect(() => {
    setActiveTab("premios");
  }, [tournament, isOpen]);

  if (!isOpen || !tournament) return null;

  const clubObj = getClubById(tournament.clubId, clubs);
  const getPlayerById = (id) => players.find((p) => p.id === id) || null;

  const enrolledPlayers = (tournament.enrolledPlayerIds || [])
    .map((id) => getPlayerById(id))
    .filter(Boolean);

  const isEnrolled = (tournament.enrolledPlayerIds || []).includes(
    currentUser?.id
  );
  const isPendingApproval = (tournament.pendingApplicantIds || []).includes(
    currentUser?.id
  );

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col border border-white/20"
        style={{
          background:
            "linear-gradient(165deg, #1E0734 0%, #121A2E 58%, #071F17 100%)",
          color: "#FFFFFF",
          maxHeight: "92dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Portada Hero del Torneo Seleccionado */}
        <div className="relative h-52 sm:h-60 w-full">
          <img
            src={tournament.bannerImage}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E0734] via-black/45 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="touch-btn absolute top-4 right-4 w-10 h-10 rounded-full bg-black/70 text-white border border-white/20"
          >
            <Icons.Close size={20} />
          </button>

          <div className="absolute top-4 left-5 flex items-center gap-2 flex-wrap">
            <span
              className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
              style={{ background: "#00DC7D", color: "#1E0734" }}
            >
              {tournament.shortBadge || "TORNEO OFICIAL"}
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase bg-black/70 text-amber-300 border border-amber-400/40">
              📅 {tournament.dateRange}
            </span>
          </div>

          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {clubObj && (
                <SafeImage
                  src={clubObj.shield}
                  alt={clubObj.shortName}
                  circular
                  style={{
                    width: 52,
                    height: 52,
                    border: "2px solid #00DC7D",
                    background: "#0A1633",
                  }}
                />
              )}
              <div>
                <h2 className="font-wta-condensed text-3xl sm:text-5xl font-bold text-white leading-none">
                  {tournament.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 font-semibold mt-1">
                  📍 {tournament.clubName} · Superficie: {tournament.surface}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de 3 Pestañas del Torneo */}
        <div className="grid grid-cols-3 px-4 bg-black/35 border-b border-white/15">
          {[
            { id: "premios", label: "🏆 Premios & Info" },
            {
              id: "inscritos",
              label: `👥 Inscritos (${enrolledPlayers.length}/${tournament.maxPlayers})`,
            },
            { id: "cuadro", label: "🌳 Fases & Llaves" },
          ].map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className="py-3.5 text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider relative transition-colors"
                style={{
                  color: active ? "#00DC7D" : "#CBD5E1",
                }}
              >
                {t.label}
                {active && (
                  <span
                    className="absolute bottom-0 inset-x-4 h-1 rounded-full"
                    style={{ background: "#00DC7D" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido Scrolleable según la Pestaña */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 no-scrollbar flex-1">
          {activeTab === "premios" && (
            <div className="space-y-5">
              {/* Tarjetas de Premios Oficiales: Campeón, Finalista y Consuelo */}
              <div className="space-y-3">
                <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold tracking-wide text-emerald-400">
                  BOLSA DE PREMIOS, PUNTOS Y GEMAS 💎
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Premio Campeón */}
                  <div
                    className="rounded-3xl p-4 space-y-2"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(245,158,11,0.22) 0%, rgba(30,7,52,0.85) 100%)",
                      border: "1.5px solid #F59E0B",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-400 text-[#1E0734]">
                        🥇 CAMPEÓN
                      </span>
                      <span className="text-xl">🏆</span>
                    </div>
                    <p className="font-display font-extrabold text-sm sm:text-base text-white leading-snug">
                      {tournament.prizeChampion ||
                        "Trofeo Oficial + +250 Pts ELO + +150 💎 Gemas"}
                    </p>
                  </div>

                  {/* Premio Finalista */}
                  <div
                    className="rounded-3xl p-4 space-y-2"
                    style={{
                      background: "rgba(255, 255, 255, 0.07)",
                      border: "1.5px solid rgba(203, 213, 225, 0.4)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-slate-200 text-[#1E0734]">
                        🥈 FINALISTA
                      </span>
                      <span className="text-xl">🥈</span>
                    </div>
                    <p className="font-display font-extrabold text-sm sm:text-base text-white leading-snug">
                      {tournament.prizeFinalist ||
                        "Medalla Finalista + +120 Pts ELO + +80 💎 Gemas"}
                    </p>
                  </div>

                  {/* Premio Campeón Ronda Consuelo */}
                  <div
                    className="rounded-3xl p-4 space-y-2"
                    style={{
                      background: "rgba(0, 220, 125, 0.12)",
                      border: "1.5px solid rgba(0, 220, 125, 0.45)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-400 text-[#1E0734]">
                        🎾 RONDA CONSUELO
                      </span>
                      <span className="text-xl">💎</span>
                    </div>
                    <p className="font-display font-extrabold text-sm sm:text-base text-white leading-snug">
                      {tournament.prizeConsolation ||
                        "Campeón Consuelo: +60 💎 Gemas + Tubo de Pelotas"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalles Técnicos del Torneo */}
              <div className="rounded-3xl p-5 bg-white/5 border border-white/15 space-y-3">
                <h4 className="font-wta-condensed text-2xl font-bold text-white">
                  REGLAMENTO Y CONDICIONES DEL EVENTO
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
                  <div className="rounded-2xl p-3.5 bg-black/30 border border-white/10">
                    <div className="text-emerald-400 font-extrabold uppercase text-xs">
                      Formato Garantizado
                    </div>
                    <div className="font-semibold mt-1">
                      {tournament.formatLabel}
                    </div>
                  </div>
                  <div className="rounded-2xl p-3.5 bg-black/30 border border-white/10">
                    <div className="text-amber-300 font-extrabold uppercase text-xs">
                      Pelotas e Hidratación
                    </div>
                    <div className="font-semibold mt-1">
                      {tournament.ballsLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "inscritos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold text-white">
                  LISTA OFICIAL DE JUGADORES INSCRITOS ({enrolledPlayers.length}
                  /{tournament.maxPlayers})
                </h3>
                <span className="text-xs font-bold text-emerald-400">
                  Toca un tenista para ver su Head to Head
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enrolledPlayers.map((p, idx) => {
                  const pCat = getCategoryByElo(p.elo, p.seasonMatches);
                  const pClub = getClubById(p.clubId, clubs);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onClose();
                        if (onOpenHeadToHead)
                          onOpenHeadToHead(currentUser || p, p);
                      }}
                      className="rounded-2xl p-3.5 bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-wta-condensed text-2xl font-bold text-emerald-400 w-6">
                          #{idx + 1}
                        </span>
                        <WtaEmeraldPortrait
                          src={p.avatar}
                          name={p.name}
                          size={48}
                        />
                        <div className="min-w-0">
                          <div className="font-display font-black text-sm sm:text-base text-white truncate">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
                            {pClub && (
                              <SafeImage
                                src={pClub.shield}
                                alt={pClub.shortName}
                                circular
                                style={{ width: 14, height: 14 }}
                              />
                            )}
                            <span>{pCat.short}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-wta-condensed text-2xl font-bold text-white tabular-nums">
                          {p.elo}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-400 uppercase">
                          PTS ELO
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "cuadro" && (
            /* Árbol Visual de Llaves (Semifinales -> Final + Ronda Consuelo) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold text-white">
                  CUADRO ELIMINATORIO & RONDA CONSUELO
                </h3>
                <span className="text-xs font-bold text-emerald-400">
                  Toca cualquier cruce para abrir Head to Head
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Columna 1: Semifinales / Rondas Previas */}
                <div className="space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                    Fase Clasificatoria / Semifinales
                  </div>
                  {(tournament.bracket?.quarters || []).map((match) => {
                    const pA = getPlayerById(match.playerAId);
                    const pB = getPlayerById(match.playerBId);
                    return (
                      <div
                        key={match.id}
                        onClick={() => {
                          if (pA && pB && onOpenHeadToHead) {
                            onClose();
                            onOpenHeadToHead(pA, pB);
                          }
                        }}
                        className="wta-match-card p-4 space-y-2.5 cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs font-extrabold border-b border-white/15 pb-2">
                          <span className="text-slate-300">
                            {match.roundLabel}
                          </span>
                          {match.score ? (
                            <span className="font-mono-code text-emerald-400">
                              {match.score}
                            </span>
                          ) : (
                            <span className="text-amber-300">Programado</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <SafeImage
                              src={pA?.avatar}
                              alt={pA?.name || "Por definir"}
                              circular
                              style={{ width: 28, height: 28 }}
                            />
                            <span
                              className={`truncate ${
                                match.winnerId === pA?.id
                                  ? "font-black text-emerald-400"
                                  : "font-semibold text-white"
                              }`}
                            >
                              {pA?.name || "Por definir"}
                            </span>
                          </div>
                          {match.winnerId === pA?.id && (
                            <span className="text-emerald-400 font-black">
                              ◀
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <SafeImage
                              src={pB?.avatar}
                              alt={pB?.name || "Por definir"}
                              circular
                              style={{ width: 28, height: 28 }}
                            />
                            <span
                              className={`truncate ${
                                match.winnerId === pB?.id
                                  ? "font-black text-emerald-400"
                                  : "font-semibold text-white"
                              }`}
                            >
                              {pB?.name || "Por definir"}
                            </span>
                          </div>
                          {match.winnerId === pB?.id && (
                            <span className="text-emerald-400 font-black">
                              ◀
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Columna 2: Gran Final + Final Ronda Consuelo */}
                <div className="space-y-4">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    Definición de Título & Consuelo
                  </div>

                  {tournament.bracket?.final && (
                    <div
                      className="rounded-3xl p-4 space-y-2.5"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(245,158,11,0.22) 0%, rgba(35,8,60,0.9) 100%)",
                        border: "2px solid #F59E0B",
                      }}
                    >
                      <div className="flex items-center justify-between text-xs font-extrabold uppercase text-amber-300">
                        <span>🏆 {tournament.bracket.final.roundLabel}</span>
                        {tournament.bracket.final.score && (
                          <span className="font-mono-code">
                            {tournament.bracket.final.score}
                          </span>
                        )}
                      </div>

                      {[
                        getPlayerById(tournament.bracket.final.playerAId),
                        getPlayerById(tournament.bracket.final.playerBId),
                      ].map((finPlayer, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 text-sm font-bold py-1.5 border-b border-white/10 last:border-none"
                        >
                          <SafeImage
                            src={finPlayer?.avatar}
                            alt={finPlayer?.name || "Finalista"}
                            circular
                            style={{ width: 28, height: 28 }}
                          />
                          <span>
                            {finPlayer?.name || `Ganador Semifinal ${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {tournament.bracket?.consolationFinal && (
                    <div className="rounded-3xl p-4 bg-white/5 border border-emerald-400/35 space-y-2">
                      <div className="text-xs font-extrabold uppercase text-emerald-400">
                        🎾 {tournament.bracket.consolationFinal.roundLabel} (+60 💎)
                      </div>
                      {[
                        getPlayerById(
                          tournament.bracket.consolationFinal.playerAId
                        ),
                        getPlayerById(
                          tournament.bracket.consolationFinal.playerBId
                        ),
                      ].map((cPlayer, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 text-xs sm:text-sm py-1"
                        >
                          <SafeImage
                            src={cPlayer?.avatar}
                            alt={cPlayer?.name || "Consuelo"}
                            circular
                            style={{ width: 24, height: 24 }}
                          />
                          <span>
                            {cPlayer?.name || `2º Semifinal ${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie Fijo del Modal con Acción de Inscripción */}
        <div className="p-4 sm:p-5 bg-black/50 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-300">
              Inscripción General:{" "}
              <strong className="text-white text-sm">
                S/ {tournament.entryFee}
              </strong>
            </div>
            <div className="text-xs font-extrabold text-emerald-400">
              💎 Con {tournament.gemsRequiredForDiscount || 80} Gemas: S/{" "}
              {tournament.gemDiscountFee || tournament.entryFee - 10}
            </div>
          </div>

          {isEnrolled ? (
            <span className="px-5 py-3 rounded-full text-xs sm:text-sm font-black uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400">
              ✓ Ya estás inscrito en el cuadro
            </span>
          ) : isPendingApproval ? (
            <span className="px-5 py-3 rounded-full text-xs sm:text-sm font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400">
              ⏳ Pago en Verificación del Comité
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenPaymentModal) onOpenPaymentModal(tournament);
              }}
              className="touch-btn px-6 py-3.5 rounded-full font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl"
              style={{ background: "#00DC7D", color: "#1E0734" }}
            >
              Inscribirme a este Torneo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 41. VISTA PRINCIPAL: TORNEOS POR FICHAS (CARDS PRIMERO ➔ CLIC ABRE MODAL)
//     + ACCESO AL MASTER TOP 8 FINALS Y SALÓN DE LA FAMA
// ============================================================================
export const TournamentsAndHallOfFameView = ({
  tournaments = INITIAL_TOURNAMENTS,
  hallOfFame = HALL_OF_FAME_CHAMPIONS,
  players = [],
  currentUser,
  clubs = HUANCAYO_CLUBS,
  onOpenTournamentPaymentModal,
  onOpenHeadToHead,
}) => {
  const [subTab, setSubTab] = useState("fichas"); // 'fichas' | 'salon_fama'
  const [selectedTournamentForDetail, setSelectedTournamentForDetail] =
    useState(null);
  const [isMasterTop8Open, setIsMasterTop8Open] = useState(false);

  return (
    <div className="view-transition px-3 sm:px-5 pt-4 pb-10 space-y-5 max-w-4xl mx-auto">
      {/* Barra Superior Directa (Sin Títulos Redundantes): Fichas de Torneos | Master Top 8 | Salón de la Fama */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSubTab("fichas")}
            className="touch-btn px-5 py-2.5 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all"
            style={{
              minHeight: 42,
              transform: subTab === "fichas" ? "scale(1.05)" : "scale(1)",
              background: subTab === "fichas" ? "#00DC7D" : "var(--bg-card)",
              color: subTab === "fichas" ? "#1E0734" : "var(--text-main)",
              border: "1.5px solid var(--border-strong)",
            }}
          >
            🏆 Torneos Abiertos ({tournaments.length})
          </button>

          <button
            type="button"
            onClick={() => setSubTab("salon_fama")}
            className="touch-btn px-5 py-2.5 rounded-full font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all"
            style={{
              minHeight: 42,
              transform: subTab === "salon_fama" ? "scale(1.05)" : "scale(1)",
              background:
                subTab === "salon_fama" ? "var(--gold)" : "var(--bg-card)",
              color: subTab === "salon_fama" ? "#0A1633" : "var(--text-main)",
              border: "1.5px solid var(--border-strong)",
            }}
          >
            👑 Salón de la Fama ({hallOfFame.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsMasterTop8Open(true)}
          className="touch-btn px-4 py-2.5 rounded-full font-display font-extrabold text-xs uppercase tracking-wider"
          style={{
            minHeight: 40,
            background: "linear-gradient(135deg, #23083C 0%, #09291E 100%)",
            color: "#00DC7D",
            border: "1.5px solid #00DC7D",
          }}
        >
          ★ Master Top 8 Finals
        </button>
      </div>

      {subTab === "fichas" ? (
        /* GALERÍA DE FICHAS DE TORNEOS (Al tocar una ficha se abre el Modal Completo) */
        <div className="grid grid-cols-1 gap-6">
          {tournaments.map((t) => {
            const clubObj = getClubById(t.clubId, clubs);
            const enrolledCount = (t.enrolledPlayerIds || []).length;
            const isEnrolled = (t.enrolledPlayerIds || []).includes(
              currentUser?.id
            );
            const isPending = (t.pendingApplicantIds || []).includes(
              currentUser?.id
            );

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTournamentForDetail(t)}
                className="atp-card overflow-hidden cursor-pointer group transition-all hover:-translate-y-1"
                style={{
                  border: isEnrolled
                    ? "2px solid #00DC7D"
                    : "1.5px solid var(--border-strong)",
                }}
              >
                {/* Póster Superior de la Ficha */}
                <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                  <img
                    src={t.bannerImage}
                    alt={t.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="absolute top-3.5 left-4 flex items-center gap-2 flex-wrap">
                    <span
                      className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase"
                      style={{ background: "var(--clay)", color: "#FFFFFF" }}
                    >
                      {t.surface} · {t.categoryLabel}
                    </span>
                    <span
                      className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase"
                      style={{ background: "#1E0734", color: "#00DC7D" }}
                    >
                      📅 {t.dateRange}
                    </span>
                  </div>

                  {isEnrolled && (
                    <div className="absolute top-3.5 right-4">
                      <span
                        className="px-3.5 py-1 rounded-full text-xs font-black uppercase shadow-lg"
                        style={{ background: "#00DC7D", color: "#1E0734" }}
                      >
                        ✓ INSCRITO
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {clubObj && (
                        <SafeImage
                          src={clubObj.shield}
                          alt={clubObj.shortName}
                          circular
                          style={{
                            width: 46,
                            height: 46,
                            border: "2px solid #FFFFFF",
                            background: "#0A1633",
                          }}
                        />
                      )}
                      <div>
                        <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold text-white leading-none">
                          {t.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-200 font-semibold mt-1">
                          📍 {t.clubName} · {t.formatLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cuerpo de la Ficha: Resumen de Premios + Cupos + Botones */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Resumen Rápido de Premios */}
                  <div
                    className="rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2"
                    style={{
                      background: "var(--gold-bg)",
                      border: "1px solid var(--gold-border)",
                    }}
                  >
                    <div className="text-xs sm:text-sm font-extrabold">
                      <span style={{ color: "var(--gold)" }}>
                        🏆 Premio Campeón:{" "}
                      </span>
                      <span>
                        {t.prizeChampion ||
                          "Trofeo Oficial + +250 Pts ELO + +150 💎"}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Cupos e Importe con Gemas */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div
                          className="text-xs font-bold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Inscripción
                        </div>
                        <div className="font-wta-condensed text-3xl font-bold tabular-nums">
                          S/ {t.entryFee}
                        </div>
                      </div>

                      <div
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold"
                        style={{
                          background: "var(--emerald-bg)",
                          color: "var(--wta-emerald)",
                          border: "1px solid rgba(0, 220, 125, 0.35)",
                        }}
                      >
                        💎 Con {t.gemsRequiredForDiscount || 80} Gemas: S/{" "}
                        {t.gemDiscountFee || t.entryFee - 10}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-extrabold">
                        👥 {enrolledCount} de {t.maxPlayers} Cupos Ocupados
                      </div>
                      <div className="w-36 h-2 rounded-full bg-white/15 overflow-hidden mt-1 ml-auto">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (enrolledCount / t.maxPlayers) * 100
                            )}%`,
                            background: "#00DC7D",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de la Ficha */}
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTournamentForDetail(t)}
                      className="touch-btn py-3.5 px-4 rounded-2xl font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider border"
                      style={{
                        borderColor: "var(--border-strong)",
                        background: "var(--bg-subtle)",
                        color: "var(--text-main)",
                      }}
                    >
                      🌳 Ver Premios, Inscritos y Llaves
                    </button>

                    {isEnrolled ? (
                      <button
                        type="button"
                        onClick={() => setSelectedTournamentForDetail(t)}
                        className="touch-btn py-3.5 px-4 rounded-2xl font-display font-black text-xs sm:text-sm uppercase tracking-wider"
                        style={{
                          background: "var(--emerald-bg)",
                          color: "var(--wta-emerald)",
                          border: "1.5px solid var(--wta-emerald)",
                        }}
                      >
                        ✓ Inscrito · Ver Mi Llave
                      </button>
                    ) : isPending ? (
                      <div
                        className="py-3.5 px-4 rounded-2xl font-display font-bold text-xs text-center flex items-center justify-center"
                        style={{
                          background: "var(--gold-bg)",
                          color: "var(--gold)",
                        }}
                      >
                        ⏳ Pago en Verificación
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenTournamentPaymentModal &&
                          onOpenTournamentPaymentModal(t)
                        }
                        className="touch-btn py-3.5 px-4 rounded-2xl font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg"
                        style={{ background: "#00DC7D", color: "#0A1633" }}
                      >
                        Inscribirse Ahora (S/ {t.entryFee})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SALÓN DE LA FAMA */
        <div className="grid grid-cols-1 gap-4">
          {hallOfFame.map((item) => {
            const clubObj = getClubById(item.championClubId, clubs);
            return (
              <div
                key={item.id}
                className="atp-card p-5 sm:p-6 space-y-3"
                style={{
                  border: "1.5px solid var(--gold-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                    style={{
                      background: "var(--gold-bg)",
                      color: "var(--gold)",
                    }}
                  >
                    🏆 Campeón Oficial · {item.categoryLabel}
                  </span>
                  <span
                    className="text-xs sm:text-sm font-bold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.dateLabel}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <WtaEmeraldPortrait
                    src={item.avatar}
                    name={item.championName}
                    rank={1}
                    size={64}
                  />
                  <div className="min-w-0">
                    <div className="font-wta-condensed text-3xl sm:text-4xl font-bold truncate">
                      {item.championName}
                    </div>
                    <div
                      className="text-sm font-extrabold truncate"
                      style={{ color: "var(--wta-emerald)" }}
                    >
                      {item.tournamentName}
                    </div>
                    <div
                      className="text-xs sm:text-sm flex items-center gap-2 mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {clubObj && (
                        <SafeImage
                          src={clubObj.shield}
                          alt={clubObj.shortName}
                          circular
                          style={{ width: 18, height: 18 }}
                        />
                      )}
                      <span>
                        Final: <strong>{item.finalScore}</strong> vs.{" "}
                        {item.finalistName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Completo del Torneo Seleccionado */}
      <TournamentFullDetailModal
        isOpen={Boolean(selectedTournamentForDetail)}
        onClose={() => setSelectedTournamentForDetail(null)}
        tournament={selectedTournamentForDetail}
        players={players}
        currentUser={currentUser}
        clubs={clubs}
        onOpenPaymentModal={onOpenTournamentPaymentModal}
        onOpenHeadToHead={onOpenHeadToHead}
      />

      {/* Modal del Master Top 8 Finals */}
      <MasterTop8FinalsModal
        isOpen={isMasterTop8Open}
        onClose={() => setIsMasterTop8Open(false)}
        players={players}
        clubs={clubs}
        onSelectPlayerForH2H={onOpenHeadToHead}
      />
    </div>
  );
};

// ============================================================================
// 42. MODAL DE INSCRIPCIÓN A TORNEO (SOPORTA DESCUENTO CON 💎 GEMAS + YAPE/PLIN)
// ============================================================================
export const TournamentPaymentModal = ({
  isOpen,
  onClose,
  tournament,
  currentUser,
  onSubmitTournamentApplication,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("Yape");
  const [useGemsDiscount, setUseGemsDiscount] = useState(false);
  const [operationCode, setOperationCode] = useState("");

  useEffect(() => {
    setUseGemsDiscount(false);
    setOperationCode("");
  }, [tournament, isOpen]);

  if (!isOpen || !tournament || !currentUser) return null;

  const gemsNeeded = tournament.gemsRequiredForDiscount || 80;
  const userGems = Number(currentUser.gems ?? 150);
  const canUseGems = userGems >= gemsNeeded;
  const finalAmount =
    useGemsDiscount && canUseGems
      ? tournament.gemDiscountFee || tournament.entryFee - 10
      : tournament.entryFee;

  const handleSendApplication = (e) => {
    e.preventDefault();
    if (onSubmitTournamentApplication) {
      onSubmitTournamentApplication(tournament.id, currentUser.id, {
        paymentMethod,
        usedGems: useGemsDiscount && canUseGems ? gemsNeeded : 0,
        finalAmount,
        operationCode: operationCode.trim() || "Constancia por WhatsApp",
      });
    }

    const waMessage = `Hola Comité MATCHPOINT, soy ${currentUser.name}. Solicito mi inscripción al torneo "${tournament.title}" (Importe: S/ ${finalAmount}${
      useGemsDiscount && canUseGems ? ` aplicando ${gemsNeeded} 💎 Gemas` : ""
    } vía ${paymentMethod}). Envío mi constancia de pago para aprobación.`;
    window.open(
      `https://wa.me/${PAYMENT_METHODS_CONFIG.whatsappApprovalPhone}?text=${encodeURIComponent(
        waMessage
      )}`,
      "_blank"
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div>
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold">
              INSCRIPCIÓN OFICIAL AL TORNEO
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
              {tournament.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSendApplication}
          className="p-6 overflow-y-auto space-y-4 no-scrollbar"
        >
          {/* Importe + Opción de Canjear Gemas para Descuento */}
          <div
            className="rounded-3xl p-4 space-y-3"
            style={{
              background: "var(--bg-subtle)",
              border: "1.5px solid var(--border-strong)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold">Importe a Pagar</span>
              <span
                className="font-wta-condensed text-4xl font-bold tabular-nums"
                style={{ color: "var(--wta-emerald)" }}
              >
                S/ {finalAmount}
              </span>
            </div>

            {/* Interruptor para usar Gemas MatchPoint */}
            <div
              className="rounded-2xl p-3 flex items-center justify-between gap-2"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <div>
                <div className="text-xs font-extrabold">
                  💎 Canjear {gemsNeeded} Gemas por Descuento
                </div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Tu saldo actual: <strong>{userGems} 💎</strong> (Baja a S/{" "}
                  {tournament.gemDiscountFee || tournament.entryFee - 10})
                </div>
              </div>

              <button
                type="button"
                disabled={!canUseGems}
                onClick={() => setUseGemsDiscount((v) => !v)}
                className="px-3.5 py-2 rounded-xl text-xs font-black uppercase"
                style={{
                  background: !canUseGems
                    ? "var(--bg-subtle)"
                    : useGemsDiscount
                    ? "#00DC7D"
                    : "var(--electric)",
                  color: !canUseGems
                    ? "var(--text-muted)"
                    : useGemsDiscount
                    ? "#1E0734"
                    : "#FFFFFF",
                }}
              >
                {!canUseGems
                  ? "Saldo Insuf."
                  : useGemsDiscount
                  ? "✓ Descuento Activo"
                  : "Aplicar 💎"}
              </button>
            </div>
          </div>

          {/* Cuentas Oficiales */}
          <div
            className="rounded-3xl p-4 space-y-1.5"
            style={{
              background: "var(--gold-bg)",
              border: "1.5px solid var(--gold-border)",
            }}
          >
            <div
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--gold)" }}
            >
              Cuentas Oficiales del Comité
            </div>
            <div className="text-sm font-black">
              Yape / Plin:{" "}
              <span className="font-mono-code">
                {PAYMENT_METHODS_CONFIG.yapeNumber}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold">
              {PAYMENT_METHODS_CONFIG.bankAccountBcp}
            </div>
          </div>

          {/* Selector de Medio de Pago */}
          <div className="grid grid-cols-3 gap-2">
            {["Yape", "Plin", "BCP"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className="touch-btn py-3 rounded-xl font-display font-extrabold text-xs sm:text-sm border"
                style={{
                  background:
                    paymentMethod === m ? "var(--electric)" : "var(--bg-subtle)",
                  color: paymentMethod === m ? "#FFFFFF" : "var(--text-main)",
                  borderColor:
                    paymentMethod === m
                      ? "var(--electric)"
                      : "var(--border-hairline)",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={operationCode}
            onChange={(e) => setOperationCode(e.target.value)}
            placeholder="N.º de operación (Opcional)"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
            style={{
              background: "var(--bg-input)",
              border: "1.5px solid var(--border-hairline)",
              color: "var(--text-main)",
            }}
          />

          <button
            type="submit"
            className="touch-btn w-full py-4 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-xl"
            style={{ background: "#00DC7D", color: "#0A1633" }}
          >
            Enviar Constancia por WhatsApp y Separar Cupo
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 43. MODAL PASE SOCIO VIP + TIENDA PRO SHOP & CANJE DIRECTO DE 💎 GEMAS
// ============================================================================
export const VipMembershipModal = ({
  isOpen,
  onClose,
  player,
  clubs = HUANCAYO_CLUBS,
  onRequestVipActivation,
}) => {
  if (!isOpen || !player) return null;

  const handleRequestVip = () => {
    if (onRequestVipActivation) {
      onRequestVipActivation(player.id);
    }
    const msg = `Hola Comité MATCHPOINT, soy ${player.name}. Deseo activar mi Pase Socio VIP de Temporada (S/ ${PAYMENT_METHODS_CONFIG.vipMembershipPrice}). Envío mi constancia Yape/Plin.`;
    window.open(
      `https://wa.me/${PAYMENT_METHODS_CONFIG.whatsappApprovalPhone}?text=${encodeURIComponent(
        msg
      )}`,
      "_blank"
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div>
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold">
              PASE SOCIO VIP · MATCHPOINT
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
              Tarifas preferenciales en las 4 sedes y en el Pro Shop
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 no-scrollbar">
          <CarnetDigitalVIP player={player} clubs={clubs} compact />

          <div
            className="rounded-3xl p-4 space-y-2.5"
            style={{
              background: "var(--gold-bg)",
              border: "1.5px solid var(--gold-border)",
            }}
          >
            <div
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--gold)" }}
            >
              Beneficios Oficiales Incluidos
            </div>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>• 15% a 20% de descuento en alquiler de canchas en los 4 clubes aliados.</li>
              <li>• Precio Socio VIP en encordados electrónicos, pelotas y overgrips.</li>
              <li>• Descuento directo en clases de Coach Pro y sesiones MatchPoint Vision IA.</li>
            </ul>
          </div>

          {!player.isVipMember ? (
            <button
              type="button"
              onClick={handleRequestVip}
              className="touch-btn w-full py-4 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-xl"
              style={{
                background: "linear-gradient(135deg, #FDE68A 0%, #D97706 100%)",
                color: "#0A1633",
              }}
            >
              Activar Pase Socio VIP (S/ {PAYMENT_METHODS_CONFIG.vipMembershipPrice})
            </button>
          ) : (
            <div
              className="rounded-2xl p-4 text-center text-sm font-extrabold"
              style={{
                background: "var(--emerald-bg)",
                color: "var(--wta-emerald)",
              }}
            >
              ✓ Tu Pase Socio VIP está activo durante toda la temporada 2026
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProShopModal = ({
  isOpen,
  onClose,
  items = PRO_SHOP_ITEMS,
  currentUser,
  onRedeemItemWithGems,
  onOpenVipModal,
}) => {
  const [filterCat, setFilterCat] = useState("ALL");

  if (!isOpen) return null;

  const categories = [
    "ALL",
    "Canje de Gemas",
    "Clases & Academia",
    "Pelotas Oficiales",
    "Taller & Cuerdas",
    "Análisis IA & Video",
  ];

  const visibleItems = items.filter(
    (it) => filterCat === "ALL" || it.category === filterCat
  );

  const userGems = Number(currentUser?.gems ?? 150);

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-2xl rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera con Saldo Vivo de Gemas */}
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between gap-3"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "#D6FF00", color: "#0A1633" }}
            >
              <Icons.Bag size={22} />
            </div>
            <div>
              <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold leading-none">
                PRO SHOP & MERCADO DE GEMAS 💎
              </h3>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                Canjea tus Gemas por entradas a torneos, clases o equipamiento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="px-3.5 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: "rgba(0, 220, 125, 0.16)",
                border: "1.5px solid #00DC7D",
              }}
            >
              <span>💎</span>
              <span className="font-wta-condensed text-xl font-bold tabular-nums">
                {userGems}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="touch-btn w-10 h-10 rounded-full"
              style={{ background: "var(--bg-subtle)" }}
            >
              <Icons.Close size={20} />
            </button>
          </div>
        </div>

        {/* Filtro de Categorías de Recompensa */}
        <div
          className="px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          {categories.map((cat) => {
            const active = filterCat === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCat(cat)}
                className="px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase whitespace-nowrap transition-all"
                style={{
                  background: active ? "#00DC7D" : "var(--bg-subtle)",
                  color: active ? "#1E0734" : "var(--text-main)",
                }}
              >
                {cat === "ALL" ? "Todo el Catálogo" : cat}
              </button>
            );
          })}
        </div>

        {/* Catálogo de Productos y Recompensas */}
        <div className="p-6 overflow-y-auto space-y-4 no-scrollbar">
          {visibleItems.map((item) => {
            const enoughGems = userGems >= (item.gemCost || 9999);
            return (
              <div
                key={item.id}
                className="rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1.5px solid var(--border-strong)",
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    style={{ width: 68, height: 68, borderRadius: 16 }}
                  />
                  <div className="min-w-0 space-y-1">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                      style={{
                        background: "var(--emerald-bg)",
                        color: "var(--wta-emerald)",
                      }}
                    >
                      {item.badge}
                    </span>
                    <h4 className="font-display font-black text-base leading-snug">
                      {item.name}
                    </h4>
                    <p
                      className="text-xs sm:text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {item.specs}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="font-wta-condensed text-2xl font-bold tabular-nums">
                        S/ {item.regularPrice}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold tabular-nums"
                        style={{
                          background: "var(--gold-bg)",
                          color: "var(--gold)",
                        }}
                      >
                        Socio VIP: S/ {item.vipPrice}
                      </span>
                      {item.gemCost && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-400/20 text-emerald-400">
                          Canje: {item.gemCost} 💎
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones: Canjear con Gemas o Pedir en Soles */}
                <div className="flex sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                  {item.gemCost && onRedeemItemWithGems && (
                    <button
                      type="button"
                      onClick={() => onRedeemItemWithGems(item)}
                      className="touch-btn flex-1 px-4 py-2.5 rounded-2xl font-display font-black text-xs uppercase tracking-wider"
                      style={{
                        minHeight: 40,
                        background: enoughGems ? "#00DC7D" : "var(--bg-card)",
                        color: enoughGems ? "#1E0734" : "var(--text-muted)",
                        border: enoughGems
                          ? "none"
                          : "1px solid var(--border-strong)",
                      }}
                    >
                      💎 Canjear ({item.gemCost})
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${PAYMENT_METHODS_CONFIG.whatsappApprovalPhone}?text=${encodeURIComponent(
                      `Hola MATCHPOINT Pro Shop, deseo solicitar: ${item.name} (${
                        currentUser?.isVipMember
                          ? `Precio Socio VIP S/ ${item.vipPrice}`
                          : `S/ ${item.regularPrice}`
                      }).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="touch-btn flex-1 px-4 py-2.5 rounded-2xl font-display font-extrabold text-xs uppercase tracking-wider text-center"
                    style={{
                      minHeight: 40,
                      background: "#D6FF00",
                      color: "#0A1633",
                    }}
                  >
                    Pedir en S/
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

// ============================================================================
// 44. LANZADOR DE DESAFÍOS (SIN COLORES "BOLSA DE VALORES" VERDE/ROJO +
//     EXPLICACIÓN TRANSPARENTE DE PROTECCIÓN + SOLICITUD VISION IA + BOSS)
// ============================================================================
export const LaunchChallengeModal = ({
  isOpen,
  onClose,
  currentUser,
  preselectedRival,
  players = [],
  clubs = HUANCAYO_CLUBS,
  completedMatches = [],
  onCreateChallenge,
}) => {
  const rivalsList = useMemo(
    () =>
      players.filter(
        (p) => p.id !== currentUser?.id && p.activeStatus !== "inactive"
      ),
    [players, currentUser]
  );

  const [rivalId, setRivalId] = useState(
    preselectedRival?.id || rivalsList[0]?.id || ""
  );
  const [clubId, setClubId] = useState(clubs[0]?.id || "country");
  const [customVenueText, setCustomVenueText] = useState("");
  const [dateTimeLabel, setDateTimeLabel] = useState("18 Nov 2026 · 19:30");
  const [ballAgreement, setBallAgreement] = useState(BALL_AGREEMENT_OPTIONS[0]);
  const [voluntaryFriendly, setVoluntaryFriendly] = useState(false);
  const [aiRecordingRequested, setAiRecordingRequested] = useState(false);

  useEffect(() => {
    if (preselectedRival?.id) setRivalId(preselectedRival.id);
    else if (rivalsList[0]?.id) setRivalId(rivalsList[0].id);
    setVoluntaryFriendly(false);
    setAiRecordingRequested(false);
  }, [preselectedRival, rivalsList, isOpen]);

  if (!isOpen || !currentUser) return null;

  const selectedRival =
    rivalsList.find((r) => r.id === rivalId) || rivalsList[0];

  const preCalc = getPreMatchThresholds(currentUser, selectedRival, {
    forceFriendly: voluntaryFriendly,
    completedMatches,
    totalActivePlayers: players.length,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRival) return;
    const clubObj = getClubById(clubId, clubs);
    const finalClubName =
      clubId === "custom"
        ? customVenueText.trim() || "Cancha Privada / Otra Sede"
        : clubObj?.name || "Country Club Los Huancas";

    if (onCreateChallenge) {
      onCreateChallenge({
        challengerId: currentUser.id,
        challengedId: selectedRival.id,
        clubId,
        customClubName: finalClubName,
        dateTimeLabel: dateTimeLabel.trim() || "18 Nov 2026 · 19:30",
        ballAgreement,
        isFriendly: preCalc.isFriendly,
        isBossMatch: preCalc.isBossMatch,
        aiRecordingRequested,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-lg rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div>
            <span
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--wta-emerald)" }}
            >
              +50 💎 por Victoria · +25 💎 por Esfuerzo Garantizado
            </span>
            <h3 className="font-wta-condensed text-3xl font-bold mt-0.5">
              LANZAR DESAFÍO OFICIAL
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 no-scrollbar"
        >
          {/* Selector de Rival */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider block">
              Selecciona a tu Rival
            </label>
            <select
              value={rivalId}
              onChange={(e) => setRivalId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1.5px solid var(--border-strong)",
                color: "var(--text-main)",
              }}
            >
              {rivalsList.map((r) => {
                const cat = getCategoryByElo(r.elo, r.seasonMatches);
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.elo} PTS ({cat.short})
                    {r.age >= 40 ? " · +40 Master" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* TABLERO DE RECOMPENSA Y PROTECCIÓN DEPORTIVA (SIN VERDE/ROJO BOLSA DE VALORES) */}
          <div
            className="rounded-3xl p-4 space-y-3"
            style={{
              background: "var(--bg-subtle)",
              border: "1.5px solid var(--border-strong)",
            }}
          >
            {preCalc.isBossMatch && (
              <div
                className="rounded-2xl px-3.5 py-2 text-xs font-extrabold"
                style={{
                  background: "rgba(168, 85, 247, 0.22)",
                  color: "#E9D5FF",
                  border: "1px solid rgba(168, 85, 247, 0.5)",
                }}
              >
                {preCalc.bossLabel}
              </div>
            )}

            {preCalc.seniorBalanceActive && (
              <div
                className="rounded-2xl px-3.5 py-2 text-xs font-extrabold"
                style={{
                  background: "var(--gold-bg)",
                  color: "var(--gold)",
                  border: "1px solid var(--gold-border)",
                }}
              >
                ★ {preCalc.seniorLabel}
              </div>
            )}

            {preCalc.isFriendly ? (
              <div className="space-y-1.5">
                <div
                  className="text-sm font-extrabold"
                  style={{ color: "var(--electric)" }}
                >
                  🎾 Modo Partido de Exhibición Head to Head (+25 💎 Gemas)
                </div>
                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {preCalc.friendlyReason}. El partido suma a su historial cara a
                  cara y otorga Gemas a ambos sin arriesgar puntos de ranking.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold uppercase tracking-wider">
                    Escala de Mérito Deportivo
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: "var(--wta-emerald)" }}
                  >
                    {preCalc.rematchInfo.label}
                  </span>
                </div>

                {/* Cajas en Tonos Azul Cobalto / Oro (Cero Rojo Bursátil) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    className="rounded-2xl p-3 space-y-1"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    <div
                      className="text-[11px] font-bold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Si ganas ({currentUser.name.split(" ")[0]})
                    </div>
                    <div
                      className="font-wta-condensed text-2xl font-bold"
                      style={{ color: "var(--wta-emerald)" }}
                    >
                      +{preCalc.typicalWinA} a +{preCalc.winCeilingA} PTS
                    </div>
                    <div className="text-[11px] font-semibold text-amber-400">
                      +50 💎 Gemas aseguradas
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-3 space-y-1"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    <div
                      className="text-[11px] font-bold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Partido reñido / 3 Sets
                    </div>
                    <div
                      className="font-wta-condensed text-2xl font-bold"
                      style={{ color: "var(--electric)" }}
                    >
                      Protegido ({preCalc.typicalCloseLossA} PTS)
                    </div>
                    <div className="text-[11px] font-semibold text-amber-400">
                      +25 💎 Gemas por esfuerzo
                    </div>
                  </div>
                </div>

                {/* Nota Explicativa Clara sobre la Volatilidad */}
                <p
                  className="text-xs leading-relaxed pt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  💡 <strong>¿Cómo funciona?</strong> Nunca pierdes el tope
                  máximo ({preCalc.lossMaxA} pts) a menos que el partido termine
                  6-0, 6-0. Cada game y cada set que ganes protege tus puntos
                  hasta un 62%.
                </p>
              </>
            )}

            {!preCalc.gapExceedsLimit && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs font-semibold">
                  ¿Deseas jugarlo como Amistoso H2H sin mover puntos?
                </span>
                <button
                  type="button"
                  onClick={() => setVoluntaryFriendly((v) => !v)}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold"
                  style={{
                    background: voluntaryFriendly
                      ? "var(--electric)"
                      : "var(--bg-card)",
                    color: voluntaryFriendly ? "#FFFFFF" : "var(--text-main)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  {voluntaryFriendly ? "Sí, Amistoso" : "Oficial Ranking"}
                </button>
              </div>
            )}
          </div>

          {/* Sede y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase block">
                Sede Oficial
              </label>
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl text-sm font-bold focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-hairline)",
                  color: "var(--text-main)",
                }}
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="custom">Otra Cancha</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase block">
                Día y Hora Propuesta
              </label>
              <input
                type="text"
                value={dateTimeLabel}
                onChange={(e) => setDateTimeLabel(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl text-sm font-bold focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-hairline)",
                  color: "var(--text-main)",
                }}
              />
            </div>
          </div>

          {clubId === "custom" && (
            <input
              type="text"
              value={customVenueText}
              onChange={(e) => setCustomVenueText(e.target.value)}
              placeholder="Escribe el nombre de la cancha..."
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: "var(--bg-input)",
                border: "1.5px solid var(--border-strong)",
                color: "var(--text-main)",
              }}
            />
          )}

          {/* Acuerdo de Pelotas + Opción de Grabación MatchPoint Vision IA */}
          <div className="space-y-2.5">
            <select
              value={ballAgreement}
              onChange={(e) => setBallAgreement(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1.5px solid var(--border-hairline)",
                color: "var(--text-main)",
              }}
            >
              {BALL_AGREEMENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  🎾 {opt}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setAiRecordingRequested((v) => !v)}
              className="w-full p-3.5 rounded-2xl flex items-center justify-between text-left border transition-all"
              style={{
                background: aiRecordingRequested
                  ? "var(--emerald-bg)"
                  : "var(--bg-subtle)",
                borderColor: aiRecordingRequested
                  ? "var(--wta-emerald)"
                  : "var(--border-hairline)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <Icons.Video size={18} />
                <div>
                  <div className="text-xs sm:text-sm font-extrabold">
                    Solicitar Grabación MatchPoint Vision IA (SwingVision)
                  </div>
                  <div
                    className="text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Estadísticas de saque, mapa de calor y resumen sin tiempos muertos
                  </div>
                </div>
              </div>
              <span className="text-xs font-black uppercase">
                {aiRecordingRequested ? "✓ Incluido" : "+ Agregar"}
              </span>
            </button>
          </div>

          <button
            type="submit"
            className="touch-btn w-full py-4 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-xl"
            style={{ background: "#00DC7D", color: "#0A1633" }}
          >
            ⚔️ Enviar Desafío Oficial
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 45. MODAL PARA SUBIR Y CONFIRMAR MARCADOR OFICIAL ITF/ATP
// ============================================================================
export const SubmitOfficialScoreModal = ({
  isOpen,
  onClose,
  challenge,
  players = [],
  onConfirmOfficialScore,
}) => {
  const [s1A, setS1A] = useState("6");
  const [s1B, setS1B] = useState("4");
  const [tb1Loser, setTb1Loser] = useState("5");
  const [s2A, setS2A] = useState("6");
  const [s2B, setS2B] = useState("3");
  const [tb2Loser, setTb2Loser] = useState("5");
  const [stbA, setStbA] = useState("");
  const [stbB, setStbB] = useState("");
  const [specialFinish, setSpecialFinish] = useState("normal");
  const [retiredWinnerSide, setRetiredWinnerSide] = useState("A");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (challenge?.liveScore) {
      const ls = challenge.liveScore;
      setS1A(String(ls.s1A ?? 6));
      setS1B(String(ls.s1B ?? 4));
      setS2A(String(ls.s2A ?? 6));
      setS2B(String(ls.s2B ?? 3));
      setStbA(ls.stbA ? String(ls.stbA) : "");
      setStbB(ls.stbB ? String(ls.stbB) : "");
    } else {
      setS1A("6");
      setS1B("4");
      setS2A("6");
      setS2B("3");
      setStbA("");
      setStbB("");
    }
    setSpecialFinish("normal");
    setValidationError("");
  }, [challenge, isOpen]);

  if (!isOpen || !challenge) return null;

  const pA = players.find((p) => p.id === challenge.challengerId);
  const pB = players.find((p) => p.id === challenge.challengedId);

  const isSet1Tb =
    (Number(s1A) === 7 && Number(s1B) === 6) ||
    (Number(s1B) === 7 && Number(s1A) === 6);
  const isSet2Tb =
    (Number(s2A) === 7 && Number(s2B) === 6) ||
    (Number(s2B) === 7 && Number(s2A) === 6);

  const set1WinSide = Number(s1A) > Number(s1B) ? "A" : "B";
  const set2WinSide = Number(s2A) > Number(s2B) ? "A" : "B";
  const isSplitSets =
    s1A !== "" &&
    s1B !== "" &&
    s2A !== "" &&
    s2B !== "" &&
    set1WinSide !== set2WinSide;

  const handleConfirm = (e) => {
    e.preventDefault();
    const evaluation = validateAndEvaluateMatchScore({
      s1A,
      s1B,
      tb1Loser,
      s2A,
      s2B,
      tb2Loser,
      stbA,
      stbB,
      specialFinish,
      retiredWinnerSide,
    });

    if (!evaluation.valid) {
      setValidationError(evaluation.error);
      return;
    }

    setValidationError("");
    if (onConfirmOfficialScore) {
      onConfirmOfficialScore(challenge.id, evaluation);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div>
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold">
              CONFIRMAR MARCADOR OFICIAL
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
              {pA?.name} vs. {pB?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={20} />
          </button>
        </div>

        <form
          onSubmit={handleConfirm}
          className="p-6 overflow-y-auto space-y-4 no-scrollbar"
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "normal", label: "Partido Completo" },
              { id: "retirement", label: "Retiro Lesión" },
              { id: "walkover", label: "Walkover (W.O.)" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSpecialFinish(opt.id)}
                className="touch-btn py-2.5 px-2 rounded-xl text-xs font-extrabold border"
                style={{
                  background:
                    specialFinish === opt.id
                      ? "var(--electric)"
                      : "var(--bg-subtle)",
                  color:
                    specialFinish === opt.id ? "#FFFFFF" : "var(--text-main)",
                  borderColor:
                    specialFinish === opt.id
                      ? "var(--electric)"
                      : "var(--border-hairline)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {specialFinish !== "normal" && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold block">
                ¿Quién avanza como ganador oficial?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRetiredWinnerSide("A")}
                  className="touch-btn py-3 rounded-xl text-xs font-black border"
                  style={{
                    background:
                      retiredWinnerSide === "A" ? "#00DC7D" : "var(--bg-subtle)",
                    color:
                      retiredWinnerSide === "A" ? "#0A1633" : "var(--text-main)",
                  }}
                >
                  {pA?.name}
                </button>
                <button
                  type="button"
                  onClick={() => setRetiredWinnerSide("B")}
                  className="touch-btn py-3 rounded-xl text-xs font-black border"
                  style={{
                    background:
                      retiredWinnerSide === "B" ? "#00DC7D" : "var(--bg-subtle)",
                    color:
                      retiredWinnerSide === "B" ? "#0A1633" : "var(--text-main)",
                  }}
                >
                  {pB?.name}
                </button>
              </div>
            </div>
          )}

          {specialFinish !== "walkover" && (
            <div className="space-y-3.5">
              {/* Set 1 */}
              <div
                className="rounded-2xl p-4 space-y-2.5"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <div className="text-xs font-extrabold uppercase">
                  Set 1 (Games · Máx. 7)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-xs font-bold block mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {pA?.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={s1A}
                      onChange={(e) => setS1A(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-center font-wta-condensed text-3xl font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs font-bold block mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {pB?.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={s1B}
                      onChange={(e) => setS1B(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-center font-wta-condensed text-3xl font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                </div>
                {isSet1Tb && (
                  <div className="pt-1 flex items-center justify-between text-xs font-bold">
                    <span>Puntos de quien perdió el Tie-Break 7-6:</span>
                    <input
                      type="number"
                      min="0"
                      value={tb1Loser}
                      onChange={(e) => setTb1Loser(e.target.value)}
                      className="w-20 px-2 py-1.5 rounded-lg text-center font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Set 2 */}
              <div
                className="rounded-2xl p-4 space-y-2.5"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <div className="text-xs font-extrabold uppercase">
                  Set 2 (Games · Máx. 7)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-xs font-bold block mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {pA?.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={s2A}
                      onChange={(e) => setS2A(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-center font-wta-condensed text-3xl font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs font-bold block mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {pB?.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={s2B}
                      onChange={(e) => setS2B(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-center font-wta-condensed text-3xl font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                </div>
                {isSet2Tb && (
                  <div className="pt-1 flex items-center justify-between text-xs font-bold">
                    <span>Puntos de quien perdió el Tie-Break 7-6:</span>
                    <input
                      type="number"
                      min="0"
                      value={tb2Loser}
                      onChange={(e) => setTb2Loser(e.target.value)}
                      className="w-20 px-2 py-1.5 rounded-lg text-center font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 3er Set: Super Tie-Break a 10 Puntos */}
              {isSplitSets && (
                <div
                  className="rounded-2xl p-4 space-y-2.5"
                  style={{
                    background: "var(--gold-bg)",
                    border: "1.5px solid var(--gold-border)",
                  }}
                >
                  <div
                    className="text-xs font-extrabold uppercase"
                    style={{ color: "var(--gold)" }}
                  >
                    3er Set · Super Tie-Break (A 10 Puntos · Dif. mínima 2)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="0"
                      placeholder={`Pts ${pA?.name.split(" ")[0]}`}
                      value={stbA}
                      onChange={(e) => setStbA(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-center font-wta-condensed text-3xl font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder={`Pts ${pB?.name.split(" ")[0]}`}
                      value={stbB}
                      onChange={(e) => setStbB(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-center font-wta-condensed text-3xl font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {validationError && (
            <div
              className="rounded-2xl p-3.5 text-xs sm:text-sm font-extrabold"
              style={{
                background: "rgba(244, 63, 94, 0.16)",
                color: "var(--crimson)",
              }}
            >
              {validationError}
            </div>
          )}

          <button
            type="submit"
            className="touch-btn w-full py-4 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-xl"
            style={{ background: "#00DC7D", color: "#0A1633" }}
          >
            ✓ Confirmar Resultado y Acreditar Gemas 💎
          </button>
        </form>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 10 DE 12 ===

// === INICIO DEL BLOQUE 11 DE 12 ===

// ============================================================================
// 46. MODAL DE REGLAS Y SISTEMA DE JUEGO (PUNTO 2 EXPLICADO CON EJEMPLOS
//     CLAROS DE MARCADORES, ECONOMÍA DE GEMAS 💎, BOSS Y EQUILIBRIO +40)
// ============================================================================
export const VisualRulesModal = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState("puntos"); // 'puntos' | 'escalera' | 'gemas'

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-2xl rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div>
            <span
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--wta-emerald)" }}
            >
              Guía Oficial Interactiva · Lectura Fácil
            </span>
            <h3 className="font-wta-condensed text-3xl sm:text-4xl font-bold mt-0.5">
              CÓMO FUNCIONA EL CIRCUITO
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Pestañas Grandes de Navegación */}
        <div
          className="grid grid-cols-3 px-4"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          {[
            { id: "puntos", label: "1. Puntos y Sets" },
            { id: "escalera", label: "2. Categorías" },
            { id: "gemas", label: "3. Gemas & Boss" },
          ].map((tab) => {
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className="py-3.5 text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider relative"
                style={{
                  color: active ? "var(--wta-emerald)" : "var(--text-muted)",
                }}
              >
                {tab.label}
                {active && (
                  <span
                    className="absolute bottom-0 inset-x-3 h-1 rounded-full"
                    style={{ background: "var(--wta-emerald)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Cuerpo Scrolleable con Letra Grande */}
        <div className="p-6 overflow-y-auto space-y-5 no-scrollbar">
          {activeSection === "puntos" && (
            <div className="space-y-5">
              {/* Explicación Clara del Punto 2: Cómo se ganan y protegen los puntos según el marcador */}
              <div
                className="rounded-3xl p-5 space-y-3"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1.5px solid var(--border-strong)",
                }}
              >
                <div
                  className="text-xs sm:text-sm font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--wta-emerald)" }}
                >
                  ¿Por qué cada Game que luchas en cancha vale oro?
                </div>
                <p
                  className="text-sm sm:text-base leading-relaxed font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  En MATCHPOINT no da lo mismo perder <strong>6-0, 6-0</strong>{" "}
                  que caer luchando <strong>6-4, 4-6 y [8-10]</strong>. Antes de
                  jugar, el sistema calcula un <strong>Tope Máximo</strong>{" "}
                  según el nivel de ambos (por ejemplo, <strong>150 puntos</strong>
                  ) y te entrega un porcentaje según lo reñido del marcador:
                </p>

                {/* 3 Ejemplos Concretos de Marcadores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {/* Caso A: Victoria Contundente en 2 Sets */}
                  <div
                    className="rounded-2xl p-4 space-y-2"
                    style={{
                      background: "var(--bg-card)",
                      border: "1.5px solid #00DC7D",
                    }}
                  >
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase"
                      style={{ background: "#00DC7D", color: "#1E0734" }}
                    >
                      Escenario 1 · 2 Sets
                    </span>
                    <div className="font-wta-condensed text-2xl sm:text-3xl font-bold">
                      GANAR EN 2 SETS
                    </div>
                    <p
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      • Si ganas <strong>6-0, 6-0</strong> cobras el{" "}
                      <strong>100%</strong> de los puntos en juego.
                      <br />• Si ganas <strong>6-4, 6-4</strong> cobras el{" "}
                      <strong>84%</strong> y tu rival protege parte de sus
                      puntos por los 8 games que hizo.
                    </p>
                  </div>

                  {/* Caso B: Victoria en 3 Sets (Super Tie-Break) */}
                  <div
                    className="rounded-2xl p-4 space-y-2"
                    style={{
                      background: "var(--bg-card)",
                      border: "1.5px solid var(--electric)",
                    }}
                  >
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase text-white"
                      style={{ background: "var(--electric)" }}
                    >
                      Escenario 2 · 3 Sets
                    </span>
                    <div className="font-wta-condensed text-2xl sm:text-3xl font-bold">
                      GANAR EN SUPER TB
                    </div>
                    <p
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      • Si empatan a 1 set y ganas el{" "}
                      <strong>Super Tie-Break a 10 puntos</strong>, cobras entre
                      el <strong>70% y 75%</strong> del tope, más{" "}
                      <strong>+50 💎 Gemas</strong>.
                    </p>
                  </div>

                  {/* Caso C: Protección al Caer en 3 Sets */}
                  <div
                    className="rounded-2xl p-4 space-y-2"
                    style={{
                      background: "var(--bg-card)",
                      border: "1.5px solid var(--gold)",
                    }}
                  >
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase"
                      style={{ background: "var(--gold)", color: "#0A1633" }}
                    >
                      Escenario 3 · Escudo
                    </span>
                    <div className="font-wta-condensed text-2xl sm:text-3xl font-bold">
                      CAER LUCHANDO 1-2
                    </div>
                    <p
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      • Si pierdes pero ganaste <strong>1 Set</strong>, el
                      sistema <strong>protege hasta el 62% de tus puntos</strong>{" "}
                      (casi no bajas en el ranking) y además te premia con{" "}
                      <strong>+25 💎 Gemas</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Equilibrio Generacional (+40 Master) */}
              <div
                className="rounded-3xl p-5 flex items-start gap-4"
                style={{
                  background: "var(--gold-bg)",
                  border: "1.5px solid var(--gold-border)",
                }}
              >
                <div className="text-3xl">★</div>
                <div className="space-y-1">
                  <h4
                    className="font-display font-black text-base sm:text-lg"
                    style={{ color: "var(--gold)" }}
                  >
                    Equilibrio Generacional para Jugadores +40 Master
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    Cuando un tenista de <strong>40 años o más</strong> se
                    enfrenta a un jugador Sub-30 de su mismo nivel ELO, activa
                    automáticamente un{" "}
                    <strong>+10% de mérito físico al ganar</strong> y un{" "}
                    <strong>escudo extra de protección</strong> si el partido es
                    reñido. Además puedes filtrar rivales de tu misma generación
                    con el botón <strong>+40 Master</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "escalera" && (
            <div className="space-y-4">
              <p
                className="text-sm sm:text-base font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Cada categoría tiene un <strong>Piso Seguro</strong> y las
                categorías amplias (4ª y 3ª) tienen un{" "}
                <strong>Checkpoint Intermedio</strong> para que nunca pierdas el
                esfuerzo de tu temporada:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES_PROGRESSIVE.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-2xl p-4 space-y-1.5"
                    style={{
                      background: cat.bg,
                      border: `1.5px solid ${cat.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-wta-condensed text-2xl font-bold"
                        style={{ color: cat.color }}
                      >
                        {cat.name}
                      </span>
                      <span className="font-mono-code text-xs sm:text-sm font-extrabold">
                        {cat.id === "2DA"
                          ? "5,000+ PTS"
                          : `${cat.min} – ${cat.max} PTS`}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold">
                      Piso base de categoría: <strong>{cat.floor} Pts</strong>
                    </div>
                    {cat.checkpoint && (
                      <div
                        className="text-xs font-extrabold pt-0.5"
                        style={{ color: "var(--gold)" }}
                      >
                        🔒 Checkpoint Asegurable: {cat.checkpoint} Pts (con mín.
                        4 partidos)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "gemas" && (
            <div className="space-y-4">
              <div
                className="rounded-3xl p-5 space-y-3"
                style={{
                  background: "var(--emerald-bg)",
                  border: "1.5px solid var(--wta-emerald)",
                }}
              >
                <h4
                  className="font-wta-condensed text-2xl sm:text-3xl font-bold"
                  style={{ color: "var(--wta-emerald)" }}
                >
                  💎 ECONOMÍA DE GEMAS MATCHPOINT (PREMIAMOS TU CONSTANCIA)
                </h4>
                <ul className="space-y-2 text-sm sm:text-base font-medium">
                  <li>
                    • <strong>Ganar un partido oficial:</strong>{" "}
                    <span className="font-extrabold text-emerald-400">
                      +50 💎 Gemas
                    </span>
                  </li>
                  <li>
                    • <strong>Jugar y terminar un partido (aunque caigas):</strong>{" "}
                    <span className="font-extrabold text-emerald-400">
                      +25 💎 Gemas por esfuerzo y fair play
                    </span>
                  </li>
                  <li>
                    • <strong>Desafiar a un Boss y ganarle 1 set o 6 games:</strong>{" "}
                    <span className="font-extrabold text-amber-400">
                      +100 💎 Gemas de bonificación épica
                    </span>
                  </li>
                  <li>
                    • <strong>Reportar el clima de una sede:</strong>{" "}
                    <span className="font-extrabold text-sky-400">
                      +5 💎 Gemas
                    </span>
                  </li>
                </ul>
              </div>

              <div
                className="rounded-3xl p-5 space-y-2"
                style={{
                  background: "rgba(168, 85, 247, 0.14)",
                  border: "1.5px solid rgba(168, 85, 247, 0.45)",
                }}
              >
                <h4 className="font-wta-condensed text-2xl font-bold text-purple-300">
                  👑 ¿QUÉ ES EL MODO "DESAFÍO AL BOSS"?
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Los jugadores ubicados en el Top 3 de una categoría superior
                  aparecen con la insignia <strong>👑 BOSS</strong>. Si los
                  retas y logras hacerles un partido competitivo (ganar al menos
                  6 games o 1 set), tu puntaje queda protegido al 65% y cobras{" "}
                  <strong>+100 💎 Gemas</strong> para canjear en el Pro Shop o en
                  inscripciones a torneos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 47. NUEVO TEST INICIAL DIDÁCTICO, HUMANO Y A PRUEBA DE MENTIROSOS
//     - Paso 0: Presentación cálida y súper sencilla para cualquier edad
//     - Pasos 1 a 5: Botones grandes con colores diferenciados y animación al tocar
//     - Paso Final: Resumen de Categoría + Bono +50 💎 + Detector Anti-Mentirosos
// ============================================================================
export const InitialCalibrationWizardModal = ({
  isOpen,
  player,
  onCompleteInitialSeed,
}) => {
  const [stage, setStage] = useState("welcome"); // 'welcome' | 'questions' | 'result'
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState([1, 1, 1, 1, 1]);
  const [selectedAnimatingOption, setSelectedAnimatingOption] = useState(null);
  const [finalSeedData, setFinalSeedData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStage("welcome");
      setStepIdx(0);
      setAnswers([1, 1, 1, 1, 1]);
      setSelectedAnimatingOption(null);
      setFinalSeedData(null);
    }
  }, [isOpen]);

  if (!isOpen || !player) return null;

  const currentQ = CALIBRATION_QUESTIONS_1X1[stepIdx];

  const handleOptionPress = (pts, optIdx) => {
    // 1. Disparamos la animación visual inmediata en el botón presionado
    setSelectedAnimatingOption(optIdx);

    setTimeout(() => {
      const nextAnswers = [...answers];
      nextAnswers[stepIdx] = pts;
      setAnswers(nextAnswers);
      setSelectedAnimatingOption(null);

      if (stepIdx + 1 < CALIBRATION_QUESTIONS_1X1.length) {
        setStepIdx(stepIdx + 1);
      } else {
        const computed = computeInitialSeedFromAnswers(nextAnswers);
        setFinalSeedData(computed);
        setStage("result");
      }
    }, 340);
  };

  const assignedCat = finalSeedData
    ? getCategoryByElo(finalSeedData.seedElo, 0)
    : null;

  return (
    <div className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl my-auto border border-emerald-400/40"
        style={{
          background:
            "linear-gradient(165deg, #1E0734 0%, #101930 58%, #072219 100%)",
          color: "#FFFFFF",
        }}
      >
        {/* ====================================================================
            PASO 0: PRESENTACIÓN HUMANA, SENCILLA Y AMIGABLE PARA TODAS LAS EDADES
           ==================================================================== */}
        {stage === "welcome" && (
          <div className="p-6 sm:p-8 text-center space-y-6 view-transition">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-400/15 border-2 border-emerald-400 flex items-center justify-center float-3d-anim">
              <SafeImage
                src={ASSETS.pelotaVoltAzul}
                alt="Tenis"
                circular
                style={{ width: 64, height: 64 }}
              />
            </div>

            <div className="space-y-2.5">
              <span
                className="px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                style={{ background: "#00DC7D", color: "#1E0734" }}
              >
                ¡HOLA, {(player.name || "TENISTA").split(" ")[0].toUpperCase()}!
              </span>

              <h2 className="font-wta-condensed text-4xl sm:text-5xl font-bold leading-none pt-1">
                VAMOS A UBICARTE CON RIVALES DE TU MISMO NIVEL
              </h2>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-medium">
                Solo te haremos <strong>5 preguntas muy sencillas</strong> sobre
                tu experiencia jugando al tenis. No es un examen: sirve para que
                tus primeros partidos sean parejos y divertidos.
              </p>
            </div>

            {/* Guía Visual súper simple de cómo responder */}
            <div className="rounded-3xl p-4 bg-white/10 border border-white/15 text-left space-y-2.5">
              <div className="text-xs sm:text-sm font-extrabold uppercase text-amber-300">
                👆 ¿Cómo funciona? Es súper fácil:
              </div>
              <div className="text-sm sm:text-base text-slate-100 space-y-1.5">
                <div>
                  1. Lee la pregunta con calma (la letra es grande y clara).
                </div>
                <div>
                  2. <strong>Toca con tu dedo el recuadro de color</strong> que
                  mejor describa tu caso.
                </div>
                <div>
                  3. Al terminar recibirás tu Categoría Inicial y{" "}
                  <strong className="text-emerald-400">+50 💎 Gemas</strong> de
                  regalo.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStage("questions")}
              className="touch-btn w-full py-4 rounded-2xl font-display font-black text-base sm:text-lg uppercase tracking-wider shadow-xl"
              style={{
                background: "#00DC7D",
                color: "#1E0734",
                boxShadow: "0 10px 28px rgba(0, 220, 125, 0.38)",
              }}
            >
              Comenzar las 5 Preguntas →
            </button>
          </div>
        )}

        {/* ====================================================================
            PASOS 1 A 5: PREGUNTAS CON LETRA GRANDE, COLORES Y ANIMACIÓN AL TOCAR
           ==================================================================== */}
        {stage === "questions" && currentQ && (
          <div
            key={currentQ.id}
            className="p-6 sm:p-8 space-y-5 view-transition"
          >
            {/* Barra de Progreso Superior + Botón Atrás */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
                {stepIdx > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStepIdx((i) => i - 1)}
                    className="px-3 py-1 rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    ← Pregunta anterior
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStage("welcome")}
                    className="px-3 py-1 rounded-full bg-white/10 text-white"
                  >
                    ← Inicio
                  </button>
                )}

                <span className="text-emerald-400 uppercase tracking-wider">
                  Pregunta {stepIdx + 1} de {CALIBRATION_QUESTIONS_1X1.length}
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((stepIdx + 1) / CALIBRATION_QUESTIONS_1X1.length) * 100
                    }%`,
                    background: "#00DC7D",
                  }}
                />
              </div>
            </div>

            {/* Título Grande y Claro de la Pregunta */}
            <div className="space-y-2 pt-1">
              <h3 className="font-display font-black text-xl sm:text-2xl text-white leading-snug">
                {currentQ.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                {currentQ.subtitle}
              </p>
            </div>

            {/* Opciones con Colores Diferenciados y Rebote Elástico al Presionar */}
            <div className="space-y-3 pt-1">
              {currentQ.options.map((opt, idx) => {
                const isPressed = selectedAnimatingOption === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOptionPress(opt.points, idx)}
                    className="w-full p-4 rounded-2xl text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer"
                    style={{
                      transform: isPressed ? "scale(1.04)" : "scale(1)",
                      background: isPressed ? opt.color : opt.bg,
                      border: `2px solid ${opt.color}`,
                      boxShadow: isPressed
                        ? `0 0 26px ${opt.color}`
                        : "0 4px 14px rgba(0,0,0,0.25)",
                      color: isPressed ? "#0A1633" : "#FFFFFF",
                    }}
                  >
                    <div className="space-y-1 min-w-0">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider"
                        style={{
                          background: isPressed
                            ? "#0A1633"
                            : "rgba(0,0,0,0.45)",
                          color: isPressed ? "#FFFFFF" : opt.color,
                        }}
                      >
                        {opt.badge}
                      </span>
                      <div className="font-display font-bold text-base sm:text-lg leading-snug">
                        {opt.label}
                      </div>
                    </div>

                    {/* Círculo Indicador de Selección */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-base"
                      style={{
                        background: isPressed
                          ? "#0A1633"
                          : "rgba(255,255,255,0.12)",
                        color: isPressed ? "#00DC7D" : "#FFFFFF",
                        border: `2px solid ${opt.color}`,
                      }}
                    >
                      {isPressed ? "✓" : "→"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ====================================================================
            PASO FINAL: RESULTADO DEL DIAGNÓSTICO + DETECTOR ANTI-MENTIROSOS
           ==================================================================== */}
        {stage === "result" && finalSeedData && assignedCat && (
          <div className="p-6 sm:p-8 text-center space-y-5 view-transition">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-4xl">
              🏆
            </div>

            <div className="space-y-1.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-400 text-[#1E0734]">
                ✓ DIAGNÓSTICO COMPLETADO · +50 💎 ACREDITADAS
              </span>
              <h2 className="font-wta-condensed text-4xl sm:text-5xl font-bold pt-1">
                INICIAS EN {assignedCat.name.toUpperCase()}
              </h2>
              <p className="font-wta-condensed text-3xl font-bold text-emerald-400">
                PUNTAJE BASE ASIGNADO: {finalSeedData.seedElo} PTS ELO
              </p>
            </div>

            {/* Si el Detector Anti-Mentirosos detectó una incongruencia, lo explica con respeto */}
            {finalSeedData.antiLiarTriggered && (
              <div className="rounded-2xl p-4 bg-amber-400/15 border border-amber-400/50 text-left text-xs sm:text-sm text-amber-200 leading-relaxed">
                <strong>⚖️ Calibración Justa Activada:</strong>{" "}
                {finalSeedData.antiLiarNote}
              </div>
            )}

            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-left text-xs sm:text-sm text-slate-200 space-y-1.5">
              <div className="font-extrabold text-white">
                ⚡ Tus primeros 5 partidos son de Calibración Oficial:
              </div>
              <p>
                Durante estos 5 encuentros tu etiqueta dirá{" "}
                <strong className="text-sky-300">Calibrándose (0/5)</strong> y
                tus puntos se ajustarán con mayor velocidad para ubicarte con
                exactitud matemática en la tabla de Huancayo.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onCompleteInitialSeed &&
                onCompleteInitialSeed(player.id, finalSeedData.seedElo)
              }
              className="touch-btn w-full py-4 rounded-2xl font-display font-black text-base uppercase tracking-wider shadow-xl"
              style={{ background: "#00DC7D", color: "#1E0734" }}
            >
              Entrar a Mi Perfil Oficial →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 48. MODAL DE ACCESO DUAL, REGISTRO COHERENTE (CON EDAD, ESTATURA, MANO,
//     GOLPE Y FOTO) Y RECUPERACIÓN EN 2 PASOS SEPARADOS
// ============================================================================
export const AuthAndAccountModal = ({
  isOpen,
  onClose,
  players = [],
  currentUser,
  clubs = HUANCAYO_CLUBS,
  onSwitchUser,
  onRegisterNewPlayer,
  onResetPasswordSuccess,
}) => {
  const [tab, setTab] = useState("login"); // 'login' | 'register' | 'recover'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState("");

  // Campos de Registro 100% Coherentes con el Head-to-Head y Base de Datos
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("28");
  const [regHeight, setRegHeight] = useState("1.76 m");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regClubId, setRegClubId] = useState("country");
  const [regHand, setRegHand] = useState("Diestro");
  const [regBestShot, setRegBestShot] = useState("Derecha (Forehand)");
  const [regPassword, setRegPassword] = useState("");
  const [regPhotoDataUrl, setRegPhotoDataUrl] = useState("");
  const regFileInputRef = useRef(null);

  // Recuperación en 2 pasos reales
  const [recoverStep, setRecoverStep] = useState(1);
  const [recEmail, setRecEmail] = useState("");
  const [recPhone, setRecPhone] = useState("");
  const [verifiedPlayerId, setVerifiedPlayerId] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [recoverSuccessMsg, setRecoverSuccessMsg] = useState("");

  useEffect(() => {
    setAuthError("");
    setRecoverStep(1);
    setVerifiedPlayerId(null);
    setRecoverSuccessMsg("");
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleRegPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAndCompressImageFile(file, 850, 0.85);
      setRegPhotoDataUrl(dataUrl);
    } catch {
      // Ignorar si falla lectura
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const clean = identifier.trim().toLowerCase();
    const found = players.find(
      (p) =>
        p.email?.toLowerCase() === clean ||
        p.phone?.replace(/\s+/g, "") === clean
    );
    if (!found) {
      setAuthError("No encontramos una cuenta con ese celular o correo.");
      return;
    }
    if (password && found.password && password !== found.password) {
      setAuthError("Contraseña incorrecta.");
      return;
    }
    if (onSwitchUser) onSwitchUser(found.id);
    onClose();
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      setAuthError("Ingresa tu nombre completo y tu número de WhatsApp.");
      return;
    }
    const parsedAge = Math.max(12, Math.min(85, Number(regAge) || 28));
    if (onRegisterNewPlayer) {
      onRegisterNewPlayer({
        name: regName.trim(),
        age: parsedAge,
        heightLabel: regHeight.trim() || "1.76 m",
        phone: regPhone.trim(),
        email:
          regEmail.trim() ||
          `${regName.trim().toLowerCase().replace(/\s+/g, ".")}@matchpoint.pe`,
        clubId: regClubId,
        hand: regHand,
        bestShot: regBestShot,
        avatar: regPhotoDataUrl,
        heroPhoto: regPhotoDataUrl,
        password: regPassword || "123",
      });
    }
    onClose();
  };

  const handleVerifyStep1 = (e) => {
    e.preventDefault();
    const cleanMail = recEmail.trim().toLowerCase();
    const cleanPhone = recPhone.trim().replace(/\s+/g, "");
    const match = players.find(
      (p) =>
        p.email?.toLowerCase() === cleanMail &&
        p.phone?.replace(/\s+/g, "") === cleanPhone
    );
    if (!match) {
      setAuthError(
        "El correo y el número de WhatsApp no coinciden con ningún tenista registrado."
      );
      return;
    }
    setAuthError("");
    setVerifiedPlayerId(match.id);
    setRecoverStep(2);
  };

  const handleSaveNewPassStep2 = (e) => {
    e.preventDefault();
    if (!newPass || newPass.length < 3) {
      setAuthError("Ingresa una contraseña válida (mínimo 3 caracteres).");
      return;
    }
    if (newPass !== newPassConfirm) {
      setAuthError("Las contraseñas no coinciden.");
      return;
    }
    if (onResetPasswordSuccess && verifiedPlayerId) {
      onResetPasswordSuccess(verifiedPlayerId, newPass);
    }
    setAuthError("");
    setRecoverSuccessMsg("✓ Contraseña actualizada correctamente.");
    setTimeout(() => {
      setTab("login");
      setRecoverSuccessMsg("");
    }, 1100);
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-lg rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          <div className="flex items-center gap-3">
            <SafeImage
              src={ASSETS.logo}
              alt="MP"
              style={{ width: 32, height: 32, borderRadius: 9 }}
            />
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold">
              CUENTA OFICIAL DE TENISTA
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Pestañas */}
        <div
          className="grid grid-cols-3 px-4"
          style={{ borderBottom: "1.5px solid var(--border-hairline)" }}
        >
          {[
            { id: "login", label: "Ingresar" },
            { id: "register", label: "Crear Cuenta" },
            { id: "recover", label: "Recuperar" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="py-3.5 text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider relative"
              style={{
                color:
                  tab === t.id ? "var(--wta-emerald)" : "var(--text-muted)",
              }}
            >
              {t.label}
              {tab === t.id && (
                <span
                  className="absolute bottom-0 inset-x-3 h-1 rounded-full"
                  style={{ background: "var(--wta-emerald)" }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto space-y-4 no-scrollbar">
          {tab === "login" && (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Celular (WhatsApp) o Correo
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ej. 966778899 o pablo@matchpoint.pe"
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu clave"
                      className="w-full px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none pr-11"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-hairline)",
                        color: "var(--text-main)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showPass ? (
                        <Icons.EyeOff size={18} />
                      ) : (
                        <Icons.Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div
                    className="text-xs sm:text-sm font-extrabold"
                    style={{ color: "var(--crimson)" }}
                  >
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="touch-btn w-full py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-lg"
                  style={{ background: "#00DC7D", color: "#0A1633" }}
                >
                  Iniciar Sesión
                </button>
              </form>

              {/* Selector Rápido de Tenistas para Pruebas Instantáneas */}
              <div
                className="pt-4 border-t space-y-2.5"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <div
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Cambio Rápido de Cuenta Activa
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                  {players.map((p) => {
                    const isCurrent = p.id === currentUser?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (onSwitchUser) onSwitchUser(p.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-2xl flex items-center gap-2.5 text-left border transition-all"
                        style={{
                          background: isCurrent
                            ? "var(--bg-elevated)"
                            : "var(--bg-subtle)",
                          borderColor: isCurrent
                            ? "#00DC7D"
                            : "var(--border-hairline)",
                        }}
                      >
                        <SafeImage
                          src={p.avatar}
                          alt={p.name}
                          circular
                          style={{ width: 32, height: 32 }}
                        />
                        <div className="min-w-0">
                          <div className="font-display font-bold text-xs sm:text-sm truncate">
                            {p.name}
                          </div>
                          <div
                            className="text-[11px] font-bold tabular-nums"
                            style={{ color: "var(--wta-emerald)" }}
                          >
                            {p.elo} PTS · 💎 {p.gems ?? 150}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === "register" && (
            /* Formulario de Registro Completo y Coherente con Edad, Estatura, Mano, Golpe y Foto */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Subida Opcional de Foto desde el Registro */}
              <div
                className="rounded-2xl p-3.5 flex items-center justify-between gap-3"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1.5px solid var(--border-strong)",
                }}
              >
                <div className="flex items-center gap-3">
                  <SafeImage
                    src={regPhotoDataUrl}
                    alt={regName || "Nuevo"}
                    circular
                    style={{ width: 52, height: 52, border: "2px solid #00DC7D" }}
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold">
                      Fotografía de Jugador
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Se mostrará en tu Perfil WTA y Head to Head
                    </div>
                  </div>
                </div>

                <input
                  ref={regFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleRegPhotoUpload}
                />
                <button
                  type="button"
                  onClick={() => regFileInputRef.current?.click()}
                  className="touch-btn px-3.5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5"
                  style={{
                    minHeight: 38,
                    background: "#00DC7D",
                    color: "#1E0734",
                  }}
                >
                  <Icons.Camera size={14} />
                  <span>Subir Foto</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase block mb-1">
                  Nombre y Apellido Completo
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej. Rodrigo Mantari"
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1.5px solid var(--border-strong)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              {/* Edad y Estatura (Para Head to Head y Modo +40 Master) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Edad (Años)
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="85"
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-bold focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Estatura
                  </label>
                  <input
                    type="text"
                    value={regHeight}
                    onChange={(e) => setRegHeight(e.target.value)}
                    placeholder="Ej. 1.76 m"
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-bold focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              {/* WhatsApp y Club */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    WhatsApp (9 dígitos)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="964112233"
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-bold focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Club o Academia
                  </label>
                  <select
                    value={regClubId}
                    onChange={(e) => setRegClubId(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl text-sm font-bold focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shortName}
                      </option>
                    ))}
                    <option value="individual">Independiente</option>
                  </select>
                </div>
              </div>

              {/* Mano de Juego y Mejor Golpe */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Mano Hábil
                  </label>
                  <select
                    value={regHand}
                    onChange={(e) => setRegHand(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl text-sm font-bold focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  >
                    {HAND_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Mejor Golpe
                  </label>
                  <select
                    value={regBestShot}
                    onChange={(e) => setRegBestShot(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl text-sm font-bold focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  >
                    {BEST_SHOT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-3 rounded-xl text-sm focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold uppercase block mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Crea tu clave"
                    className="w-full px-3.5 py-3 rounded-xl text-sm focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              {authError && (
                <div
                  className="text-xs sm:text-sm font-extrabold"
                  style={{ color: "var(--crimson)" }}
                >
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="touch-btn w-full py-4 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-xl"
                style={{ background: "#00DC7D", color: "#0A1633" }}
              >
                Crear Mi Cuenta + Recibir +50 💎 Gemas →
              </button>
            </form>
          )}

          {tab === "recover" && (
            <div className="space-y-3.5">
              {recoverStep === 1 ? (
                <form onSubmit={handleVerifyStep1} className="space-y-3.5">
                  <div
                    className="text-xs sm:text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <strong>Paso 1 de 2:</strong> Verifica tu identidad con tu
                    correo y tu número de WhatsApp registrado.
                  </div>
                  <div>
                    <label className="text-xs font-extrabold uppercase block mb-1">
                      Correo Registrado
                    </label>
                    <input
                      type="email"
                      value={recEmail}
                      onChange={(e) => setRecEmail(e.target.value)}
                      placeholder="Ej. pablo@matchpoint.pe"
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-hairline)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold uppercase block mb-1">
                      Número de WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={recPhone}
                      onChange={(e) => setRecPhone(e.target.value)}
                      placeholder="Ej. 966778899"
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-hairline)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  {authError && (
                    <div
                      className="text-xs font-extrabold"
                      style={{ color: "var(--crimson)" }}
                    >
                      {authError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="touch-btn w-full py-3.5 rounded-2xl font-display font-extrabold text-sm uppercase tracking-wider"
                    style={{ background: "var(--electric)", color: "#FFFFFF" }}
                  >
                    Verificar Identidad →
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSaveNewPassStep2} className="space-y-3.5">
                  <div
                    className="text-xs sm:text-sm font-extrabold"
                    style={{ color: "var(--wta-emerald)" }}
                  >
                    ✓ Identidad verificada (Paso 2 de 2): Escribe tu nueva
                    contraseña.
                  </div>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Nueva contraseña"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-strong)",
                      color: "var(--text-main)",
                    }}
                  />
                  <input
                    type="password"
                    value={newPassConfirm}
                    onChange={(e) => setNewPassConfirm(e.target.value)}
                    placeholder="Confirmar nueva contraseña"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: "var(--bg-input)",
                      border: "1.5px solid var(--border-strong)",
                      color: "var(--text-main)",
                    }}
                  />
                  {authError && (
                    <div
                      className="text-xs font-extrabold"
                      style={{ color: "var(--crimson)" }}
                    >
                      {authError}
                    </div>
                  )}
                  {recoverSuccessMsg && (
                    <div
                      className="text-xs sm:text-sm font-extrabold"
                      style={{ color: "var(--wta-emerald)" }}
                    >
                      {recoverSuccessMsg}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="touch-btn w-full py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider"
                    style={{ background: "#00DC7D", color: "#0A1633" }}
                  >
                    Guardar Nueva Contraseña
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 49. MENÚ LATERAL (MODO OSCURO WTA / MODO CLARO AZUL ELÉCTRICO ATP)
// ============================================================================
export const SideNavigationDrawer = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  onOpenVisualRules,
  onOpenVipModal,
  onOpenVisionIaModal,
  onOpenAuthModal,
  onReplaySplash3D,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex justify-start"
      onClick={onClose}
    >
      <div
        className="w-80 max-w-[85vw] h-full p-5 flex flex-col justify-between overflow-y-auto no-scrollbar"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 48px), 48px)",
          background: "var(--bg-card)",
          borderRight: "1.5px solid var(--border-strong)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SafeImage
                src={ASSETS.logo}
                alt="MATCHPOINT"
                style={{ width: 36, height: 36, borderRadius: 10 }}
              />
              <span className="font-wta-condensed text-2xl font-bold tracking-wider">
                MATCHPOINT
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="touch-btn w-10 h-10 rounded-full"
              style={{ background: "var(--bg-subtle)" }}
            >
              <Icons.Close size={20} />
            </button>
          </div>

          {/* Conmutador Modo Oscuro WTA Finals / Modo Claro Azul Eléctrico ATP */}
          <div
            className="rounded-3xl p-4 space-y-2.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1.5px solid var(--border-hairline)",
            }}
          >
            <div
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Tema Visual del Circuito
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => theme !== "dark" && onToggleTheme()}
                className="touch-btn py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5"
                style={{
                  minHeight: 42,
                  background:
                    theme === "dark" ? "#00DC7D" : "var(--bg-card)",
                  color: theme === "dark" ? "#1E0734" : "var(--text-muted)",
                }}
              >
                <Icons.Moon size={16} />
                <span>WTA Dark</span>
              </button>
              <button
                type="button"
                onClick={() => theme !== "light" && onToggleTheme()}
                className="touch-btn py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5"
                style={{
                  minHeight: 42,
                  background:
                    theme === "light" ? "#0057FF" : "var(--bg-card)",
                  color: theme === "light" ? "#FFFFFF" : "var(--text-muted)",
                }}
              >
                <Icons.Sun size={16} />
                <span>ATP Electric</span>
              </button>
            </div>
          </div>

          {/* Accesos Rápidos del Menú */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenVisualRules) onOpenVisualRules();
              }}
              className="touch-btn w-full p-4 rounded-2xl text-left font-display font-extrabold text-sm flex items-center justify-between"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-main)",
              }}
            >
              <span>📘 Sistema de Juego, Puntos & Gemas</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenVisionIaModal) onOpenVisionIaModal();
              }}
              className="touch-btn w-full p-4 rounded-2xl text-left font-display font-extrabold text-sm flex items-center justify-between"
              style={{
                background: "var(--emerald-bg)",
                border: "1.5px solid var(--wta-emerald)",
                color: "var(--wta-emerald)",
              }}
            >
              <span>🎥 MatchPoint Vision IA (SwingVision)</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenVipModal) onOpenVipModal();
              }}
              className="touch-btn w-full p-4 rounded-2xl text-left font-display font-extrabold text-sm flex items-center justify-between"
              style={{
                background: "var(--gold-bg)",
                border: "1.5px solid var(--gold-border)",
                color: "var(--gold)",
              }}
            >
              <span>★ Pase Socio VIP & Beneficios</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="touch-btn w-full p-4 rounded-2xl text-left font-display font-extrabold text-sm flex items-center justify-between"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-main)",
              }}
            >
              <span>👤 Cambiar de Cuenta / Registro</span>
              <span>→</span>
            </button>

            {onReplaySplash3D && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReplaySplash3D();
                }}
                className="touch-btn w-full p-3.5 rounded-2xl text-left font-display font-bold text-xs flex items-center justify-between"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-muted)",
                }}
              >
                <span>✨ Ver Intro Interactiva 3D</span>
                <span>→</span>
              </button>
            )}
          </div>

          {/* Contacto Directo Comité Organizador */}
          <div
            className="rounded-3xl p-4 space-y-2.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div className="font-display font-black text-sm">
              Comité Organizador Huancayo
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Asistencia directa para inscripciones, coordinación de canchas y
              cobertura multimedia de partidos.
            </p>
            <a
              href={`https://wa.me/${PAYMENT_METHODS_CONFIG.whatsappApprovalPhone}?text=${encodeURIComponent(
                "Hola Comité Oficial MATCHPOINT, necesito asistencia con mi cuenta del circuito."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="touch-btn w-full py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider block text-center"
              style={{ background: "#00DC7D", color: "#0A1633" }}
            >
              💬 Contactar por WhatsApp
            </a>
          </div>
        </div>

        <div
          className="text-xs text-center pt-4 border-t"
          style={{
            borderColor: "var(--border-hairline)",
            color: "var(--text-muted)",
          }}
        >
          MATCHPOINT Huancayo Tour · Temporada 2026
        </div>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 11 DE 12 ===

// === INICIO DEL BLOQUE 12 DE 12 ===

// ============================================================================
// 50. SUITE DE ADMINISTRADOR CMS TOTAL (6 PESTAÑAS PARA MANEJAR TODA LA APP)
//     Se abre con 5 toques rápidos en el logo MATCHPOINT arriba a la izquierda (PIN: 1234)
// ============================================================================
export const HiddenAdminSuiteModal = ({
  isOpen,
  onClose,
  players = [],
  tournaments = [],
  clubs = [],
  coaches = [],
  proShopItems = [],
  vipPendingPlayerIds = [],
  globalAnnouncement = null,
  onApproveTournamentApplicant,
  onRejectTournamentApplicant,
  onApproveVipMember,
  onAdminUpdatePlayer,
  onAdminCreatePlayer,
  onAdminDeletePlayer,
  onAdminUpdateTournament,
  onAdminCreateTournament,
  onAdminDeleteTournament,
  onAdminUpdateClub,
  onAdminUpdateCoach,
  onAdminUpdateShopItem,
  onAdminCreateShopItem,
  onAdminUpdateAnnouncement,
  onAdminGiveGemsToAll,
  onTriggerSeasonReset,
}) => {
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [adminTab, setAdminTab] = useState("pagos"); // 'pagos' | 'jugadores' | 'torneos' | 'sedes' | 'coaches_shop' | 'temporada'

  // Estado para Crear Nuevo Jugador desde Admin
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerElo, setNewPlayerElo] = useState("1500");
  const [newPlayerGems, setNewPlayerGems] = useState("150");
  const [newPlayerAge, setNewPlayerAge] = useState("28");
  const [newPlayerClub, setNewPlayerClub] = useState("country");

  // Estado para Crear Nuevo Torneo desde Admin
  const [newTournTitle, setNewTournTitle] = useState("");
  const [newTournCat, setNewTournCat] = useState("4ª Categoría");
  const [newTournClubId, setNewTournClubId] = useState("country");
  const [newTournDate, setNewTournDate] = useState("12 – 14 Dic 2026");
  const [newTournFee, setNewTournFee] = useState("45");
  const [newTournPrize, setNewTournPrize] = useState(
    "Trofeo Oficial + +250 Pts ELO + +150 💎 Gemas"
  );

  // Estado para Crear Nuevo Producto en Pro Shop
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("30");
  const [newItemVipPrice, setNewItemVipPrice] = useState("24");
  const [newItemGems, setNewItemGems] = useState("100");

  // Estado para Banner de Anuncio Personalizado Global
  const [annTitle, setAnnTitle] = useState(
    globalAnnouncement?.title ||
      "¡Inscripciones Abiertas al Abierto Los Huancas!"
  );
  const [annSubtitle, setAnnSubtitle] = useState(
    globalAnnouncement?.subtitle ||
      "Usa tus 💎 Gemas acumuladas para descontar S/ 10 en tu inscripción oficial."
  );

  if (!isOpen) return null;

  const handlePinCheck = (e) => {
    e.preventDefault();
    if (pinInput.trim() === "1234") {
      setUnlocked(true);
    } else {
      alert("PIN de Administrador incorrecto (Usa 1234).");
    }
  };

  const handleCreatePlayerBtn = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !onAdminCreatePlayer) return;
    onAdminCreatePlayer({
      name: newPlayerName.trim(),
      elo: Number(newPlayerElo) || 1200,
      gems: Number(newPlayerGems) || 150,
      age: Number(newPlayerAge) || 28,
      clubId: newPlayerClub,
    });
    setNewPlayerName("");
  };

  const handleCreateTournamentBtn = (e) => {
    e.preventDefault();
    if (!newTournTitle.trim() || !onAdminCreateTournament) return;
    const clubObj = clubs.find((c) => c.id === newTournClubId) || clubs[0];
    onAdminCreateTournament({
      title: newTournTitle.trim(),
      categoryLabel: newTournCat,
      clubId: newTournClubId,
      clubName: clubObj?.name || "Country Club Los Huancas",
      dateRange: newTournDate,
      entryFee: Number(newTournFee) || 45,
      gemDiscountFee: Math.max(15, (Number(newTournFee) || 45) - 10),
      prizeChampion: newTournPrize,
    });
    setNewTournTitle("");
  };

  const handleCreateShopItemBtn = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !onAdminCreateShopItem) return;
    onAdminCreateShopItem({
      name: newItemName.trim(),
      regularPrice: Number(newItemPrice) || 30,
      vipPrice: Number(newItemVipPrice) || 24,
      gemCost: Number(newItemGems) || 100,
    });
    setNewItemName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-4xl rounded-3xl overflow-hidden my-auto flex flex-col border border-emerald-400/40"
        style={{ maxHeight: "94dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del CMS Admin */}
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{
            background: "linear-gradient(90deg, #1E0734 0%, #0D1B38 100%)",
            borderBottom: "1.5px solid rgba(0, 220, 125, 0.35)",
            color: "#FFFFFF",
          }}
        >
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              SUITE DE GESTIÓN INTEGRAL (CMS TOTAL)
            </span>
            <h3 className="font-wta-condensed text-3xl sm:text-4xl font-bold leading-none mt-0.5">
              PANEL DE CONTROL DEL ORGANIZADOR
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-10 h-10 rounded-full bg-white/10 text-white"
          >
            <Icons.Close size={20} />
          </button>
        </div>

        {!unlocked ? (
          <form onSubmit={handlePinCheck} className="p-6 space-y-4 max-w-md mx-auto w-full">
            <label className="text-sm font-extrabold uppercase tracking-wider block">
              Ingresa tu PIN Maestro de Organizador
            </label>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN Maestro (1234)"
              className="w-full px-4 py-3.5 rounded-2xl text-base font-bold focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1.5px solid var(--border-strong)",
                color: "var(--text-main)",
              }}
              autoFocus
            />
            <button
              type="submit"
              className="touch-btn w-full py-4 rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-xl"
              style={{ background: "#00DC7D", color: "#0A1633" }}
            >
              Desbloquear CMS Completo →
            </button>
          </form>
        ) : (
          <>
            {/* Barra de 6 Pestañas para Controlar TODA la Aplicación */}
            <div
              className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar"
              style={{
                background: "var(--bg-subtle)",
                borderBottom: "1.5px solid var(--border-hairline)",
              }}
            >
              {[
                { id: "pagos", label: "1. Pagos & VIP" },
                { id: "jugadores", label: `2. Tenistas (${players.length})` },
                { id: "torneos", label: `3. Torneos (${tournaments.length})` },
                { id: "sedes", label: `4. Sedes (${clubs.length})` },
                { id: "coaches_shop", label: "5. Coach & Pro Shop" },
                { id: "temporada", label: "6. Anuncios & Temporada" },
              ].map((t) => {
                const active = adminTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAdminTab(t.id)}
                    className="px-4 py-2 rounded-full text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider whitespace-nowrap transition-all"
                    style={{
                      background: active ? "#00DC7D" : "var(--bg-card)",
                      color: active ? "#1E0734" : "var(--text-main)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Cuerpo Scrolleable del CMS */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 no-scrollbar flex-1">
              {/* ==============================================================
                  PESTAÑA 1: APROBACIÓN DE PAGOS DE TORNEOS Y MEMBRESÍAS VIP
                 ============================================================== */}
              {adminTab === "pagos" && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h4 className="font-wta-condensed text-2xl font-bold text-emerald-400">
                      SOLICITUDES DE INSCRIPCIÓN A TORNEOS POR APROBAR
                    </h4>
                    {tournaments.every(
                      (t) => (t.pendingApplicantIds || []).length === 0
                    ) ? (
                      <div
                        className="rounded-2xl p-4 text-sm font-semibold"
                        style={{
                          background: "var(--bg-subtle)",
                          color: "var(--text-muted)",
                        }}
                      >
                        No hay solicitudes pendientes de verificación en este
                        momento.
                      </div>
                    ) : (
                      tournaments.map((t) =>
                        (t.pendingApplicantIds || []).map((pid) => {
                          const applicant = players.find((p) => p.id === pid);
                          return (
                            <div
                              key={`${t.id}_${pid}`}
                              className="rounded-2xl p-4 flex items-center justify-between gap-3"
                              style={{
                                background: "var(--bg-subtle)",
                                border: "1.5px solid var(--gold-border)",
                              }}
                            >
                              <div>
                                <div className="font-display font-black text-base">
                                  {applicant?.name}
                                </div>
                                <div
                                  className="text-xs sm:text-sm"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Torneo: <strong>{t.title}</strong> (S/{" "}
                                  {t.entryFee})
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onApproveTournamentApplicant &&
                                    onApproveTournamentApplicant(t.id, pid)
                                  }
                                  className="px-4 py-2 rounded-xl text-xs font-black uppercase"
                                  style={{
                                    background: "#00DC7D",
                                    color: "#1E0734",
                                  }}
                                >
                                  ✓ Aprobar Cupo
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRejectTournamentApplicant &&
                                    onRejectTournamentApplicant(t.id, pid)
                                  }
                                  className="px-3 py-2 rounded-xl text-xs font-bold"
                                  style={{
                                    background: "var(--crimson)",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="font-wta-condensed text-2xl font-bold text-amber-400">
                      SOLICITUDES DE PASE SOCIO VIP
                    </h4>
                    {vipPendingPlayerIds.length === 0 ? (
                      <div
                        className="rounded-2xl p-4 text-sm font-semibold"
                        style={{
                          background: "var(--bg-subtle)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Todas las solicitudes de Carnet Socio VIP están al día.
                      </div>
                    ) : (
                      vipPendingPlayerIds.map((pid) => {
                        const p = players.find((item) => item.id === pid);
                        return (
                          <div
                            key={pid}
                            className="rounded-2xl p-4 flex items-center justify-between"
                            style={{
                              background: "var(--bg-subtle)",
                              border: "1.5px solid var(--border-strong)",
                            }}
                          >
                            <span className="font-display font-black text-base">
                              {p?.name}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onApproveVipMember && onApproveVipMember(pid)
                              }
                              className="px-4 py-2 rounded-xl text-xs font-black uppercase"
                              style={{
                                background: "#00DC7D",
                                color: "#1E0734",
                              }}
                            >
                              ★ Activar Pase VIP
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  PESTAÑA 2: GESTOR TOTAL DE TENISTAS (ELO, GEMAS 💎, EDAD, VIP)
                 ============================================================== */}
              {adminTab === "jugadores" && (
                <div className="space-y-5">
                  {/* Crear Nuevo Jugador Directamente */}
                  <form
                    onSubmit={handleCreatePlayerBtn}
                    className="rounded-3xl p-4 space-y-3"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1.5px solid var(--wta-emerald)",
                    }}
                  >
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      + Agregar Nuevo Tenista al Ranking Oficial
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Nombre y Apellido"
                        className="sm:col-span-2 px-3.5 py-2.5 rounded-xl text-sm font-bold"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      />
                      <input
                        type="number"
                        value={newPlayerElo}
                        onChange={(e) => setNewPlayerElo(e.target.value)}
                        placeholder="ELO Inicial"
                        className="px-3 py-2.5 rounded-xl text-sm font-bold"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      />
                      <input
                        type="number"
                        value={newPlayerGems}
                        onChange={(e) => setNewPlayerGems(e.target.value)}
                        placeholder="💎 Gemas"
                        className="px-3 py-2.5 rounded-xl text-sm font-bold"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      />
                      <button
                        type="submit"
                        className="touch-btn py-2.5 px-4 rounded-xl font-display font-black text-xs uppercase"
                        style={{ background: "#00DC7D", color: "#1E0734" }}
                      >
                        + Crear
                      </button>
                    </div>
                  </form>

                  {/* Lista Editable de Todos los Jugadores */}
                  <div className="space-y-2.5">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-hairline)",
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <SafeImage
                            src={p.avatar}
                            alt={p.name}
                            circular
                            style={{ width: 42, height: 42 }}
                          />
                          <div>
                            <div className="font-display font-black text-sm sm:text-base">
                              {p.name}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Edad: {p.age} ·{" "}
                              {p.isVipMember ? "★ VIP" : "Estándar"} ·{" "}
                              {p.activeStatus === "inactive"
                                ? "Pausado"
                                : "Activo"}
                            </div>
                          </div>
                        </div>

                        {/* Controles Directos de ELO y Gemas 💎 */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 bg-black/25 px-2.5 py-1.5 rounded-xl border border-white/10">
                            <span className="text-xs font-bold">ELO:</span>
                            <input
                              type="number"
                              value={p.elo}
                              onChange={(e) =>
                                onAdminUpdatePlayer &&
                                onAdminUpdatePlayer(p.id, {
                                  elo: Math.max(100, Number(e.target.value) || 100),
                                })
                              }
                              className="w-20 bg-transparent font-wta-condensed text-xl font-bold text-center focus:outline-none"
                              style={{ color: "var(--wta-emerald)" }}
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-black/25 px-2.5 py-1.5 rounded-xl border border-white/10">
                            <span className="text-xs font-bold">💎:</span>
                            <input
                              type="number"
                              value={p.gems ?? 150}
                              onChange={(e) =>
                                onAdminUpdatePlayer &&
                                onAdminUpdatePlayer(p.id, {
                                  gems: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-16 bg-transparent font-wta-condensed text-xl font-bold text-center text-amber-300 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onAdminUpdatePlayer &&
                              onAdminUpdatePlayer(p.id, {
                                isVipMember: !p.isVipMember,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl text-xs font-extrabold border"
                            style={{
                              borderColor: "var(--gold-border)",
                              background: p.isVipMember
                                ? "var(--gold-bg)"
                                : "transparent",
                              color: "var(--gold)",
                            }}
                          >
                            {p.isVipMember ? "★ VIP Activo" : "Hacer VIP"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onAdminUpdatePlayer &&
                              onAdminUpdatePlayer(p.id, {
                                calibrationMatches:
                                  (p.calibrationMatches ?? 5) < 5 ? 5 : 0,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border"
                            style={{ borderColor: "var(--border-strong)" }}
                          >
                            {(p.calibrationMatches ?? 5) < 5
                              ? "⚡ En Calib."
                              : "Calibrado"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onAdminUpdatePlayer &&
                              onAdminUpdatePlayer(p.id, {
                                password: "123",
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold border"
                            style={{ borderColor: "var(--border-hairline)" }}
                            title="Resetear clave a 123"
                          >
                            Clave: 123
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onAdminUpdatePlayer &&
                              onAdminUpdatePlayer(p.id, {
                                activeStatus:
                                  p.activeStatus === "inactive"
                                    ? "active"
                                    : "inactive",
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold"
                            style={{
                              background:
                                p.activeStatus === "inactive"
                                  ? "#00DC7D"
                                  : "rgba(244,63,94,0.16)",
                              color:
                                p.activeStatus === "inactive"
                                  ? "#1E0734"
                                  : "var(--crimson)",
                            }}
                          >
                            {p.activeStatus === "inactive"
                              ? "Reactivar"
                              : "Pausar"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  PESTAÑA 3: GESTOR TOTAL DE TORNEOS Y AVANCE DE LLAVES EN VIVO
                 ============================================================== */}
              {adminTab === "torneos" && (
                <div className="space-y-5">
                  {/* Crear Nuevo Torneo */}
                  <form
                    onSubmit={handleCreateTournamentBtn}
                    className="rounded-3xl p-4 space-y-3"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1.5px solid var(--wta-emerald)",
                    }}
                  >
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      + Publicar Nueva Ficha de Torneo Oficial
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={newTournTitle}
                        onChange={(e) => setNewTournTitle(e.target.value)}
                        placeholder="Título (Ej. Copa Primavera 4ª)"
                        className="px-3.5 py-2.5 rounded-xl text-sm font-bold"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      />
                      <input
                        type="text"
                        value={newTournDate}
                        onChange={(e) => setNewTournDate(e.target.value)}
                        placeholder="Fechas (Ej. 12 - 14 Dic)"
                        className="px-3.5 py-2.5 rounded-xl text-sm font-bold"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newTournFee}
                          onChange={(e) => setNewTournFee(e.target.value)}
                          placeholder="Costo S/"
                          className="w-24 px-3 py-2.5 rounded-xl text-sm font-bold"
                          style={{
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-strong)",
                            color: "var(--text-main)",
                          }}
                        />
                        <button
                          type="submit"
                          className="touch-btn flex-1 py-2.5 px-4 rounded-xl font-display font-black text-xs uppercase"
                          style={{ background: "#00DC7D", color: "#1E0734" }}
                        >
                          + Crear Torneo
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Editar Torneos Existentes y sus Llaves */}
                  <div className="space-y-4">
                    {tournaments.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-3xl p-4 sm:p-5 space-y-3.5"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1.5px solid var(--border-strong)",
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-wta-condensed text-2xl font-bold">
                              {t.title}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {t.clubName} · {t.dateRange} · Inscritos:{" "}
                              {(t.enrolledPlayerIds || []).length}/{t.maxPlayers}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">Costo S/:</span>
                            <input
                              type="number"
                              value={t.entryFee}
                              onChange={(e) =>
                                onAdminUpdateTournament &&
                                onAdminUpdateTournament(t.id, {
                                  entryFee: Number(e.target.value) || 40,
                                })
                              }
                              className="w-16 px-2 py-1 rounded-lg text-center font-bold text-sm"
                              style={{
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-strong)",
                                color: "var(--text-main)",
                              }}
                            />
                            {onAdminDeleteTournament &&
                              tournaments.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => onAdminDeleteTournament(t.id)}
                                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20"
                                  title="Eliminar torneo"
                                >
                                  <Icons.Trash size={16} />
                                </button>
                              )}
                          </div>
                        </div>

                        {/* Edición Rápida de Premio Campeón */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold whitespace-nowrap">
                            Premio 1º:
                          </span>
                          <input
                            type="text"
                            value={t.prizeChampion || ""}
                            onChange={(e) =>
                              onAdminUpdateTournament &&
                              onAdminUpdateTournament(t.id, {
                                prizeChampion: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold"
                            style={{
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-hairline)",
                              color: "var(--text-main)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  PESTAÑA 4: GESTOR DE SEDES OFICIALES (PRECIOS DÍA/NOCHE/VIP)
                 ============================================================== */}
              {adminTab === "sedes" && (
                <div className="space-y-4">
                  {clubs.map((club) => (
                    <div
                      key={club.id}
                      className="rounded-3xl p-4 sm:p-5 space-y-3"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1.5px solid var(--border-strong)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={club.shield}
                            alt={club.name}
                            circular
                            style={{ width: 38, height: 38 }}
                          />
                          <div>
                            <div className="font-display font-black text-base">
                              {club.name}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {club.operatingHours}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold block mb-1">
                            Turno Día (S/)
                          </label>
                          <input
                            type="number"
                            value={club.dayPrice ?? 30}
                            onChange={(e) =>
                              onAdminUpdateClub &&
                              onAdminUpdateClub(club.id, {
                                dayPrice: Number(e.target.value) || 30,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl text-sm font-bold"
                            style={{
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-strong)",
                              color: "var(--text-main)",
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold block mb-1">
                            Noche LED (S/)
                          </label>
                          <input
                            type="number"
                            value={club.nightPrice ?? 40}
                            onChange={(e) =>
                              onAdminUpdateClub &&
                              onAdminUpdateClub(club.id, {
                                nightPrice: Number(e.target.value) || 40,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl text-sm font-bold"
                            style={{
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-strong)",
                              color: "var(--text-main)",
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold block mb-1">
                            Socio VIP (S/)
                          </label>
                          <input
                            type="number"
                            value={club.memberPrice ?? 20}
                            onChange={(e) =>
                              onAdminUpdateClub &&
                              onAdminUpdateClub(club.id, {
                                memberPrice: Number(e.target.value) || 20,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl text-sm font-bold"
                            style={{
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-strong)",
                              color: "var(--text-main)",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold block mb-1">
                          Titular Beneficio Socio VIP
                        </label>
                        <input
                          type="text"
                          value={club.vipHeadline || ""}
                          onChange={(e) =>
                            onAdminUpdateClub &&
                            onAdminUpdateClub(club.id, {
                              vipHeadline: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold"
                          style={{
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-hairline)",
                            color: "var(--text-main)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ==============================================================
                  PESTAÑA 5: GESTOR DE COACH PRO & PRODUCTOS PRO SHOP (GEMAS 💎)
                 ============================================================== */}
              {adminTab === "coaches_shop" && (
                <div className="space-y-6">
                  {/* Entrenadores Coach Pro */}
                  <div className="space-y-3">
                    <h4 className="font-wta-condensed text-2xl font-bold text-emerald-400">
                      ENTRENADORES OFICIALES (COACH PRO B2B)
                    </h4>
                    {coaches.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-hairline)",
                        }}
                      >
                        <div>
                          <div className="font-display font-black text-base">
                            {c.name}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {c.clubName} · PIN Privado:{" "}
                            <strong>{c.PrivatePin}</strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">Hora S/:</span>
                          <input
                            type="number"
                            value={c.pricePerHour}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 50;
                              if (onAdminUpdateCoach) {
                                onAdminUpdateCoach(c.id, {
                                  pricePerHour: val,
                                  priceLabel: `S/ ${val}`,
                                });
                              }
                            }}
                            className="w-20 px-2.5 py-1.5 rounded-xl text-center font-bold text-sm"
                            style={{
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-strong)",
                              color: "var(--text-main)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Productos y Recompensas Pro Shop */}
                  <div className="space-y-3">
                    <h4 className="font-wta-condensed text-2xl font-bold text-amber-400">
                      CATÁLOGO PRO SHOP & RECOMPENSAS EN GEMAS 💎
                    </h4>

                    <form
                      onSubmit={handleCreateShopItemBtn}
                      className="rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-5 gap-2"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1.5px solid var(--gold-border)",
                      }}
                    >
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Nuevo producto o recompensa..."
                        className="sm:col-span-2 px-3 py-2 rounded-xl text-xs font-bold"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      />
                      <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="Precio S/"
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      />
                      <input
                        type="number"
                        value={newItemGems}
                        onChange={(e) => setNewItemGems(e.target.value)}
                        placeholder="Costo 💎"
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      />
                      <button
                        type="submit"
                        className="touch-btn py-2 px-3 rounded-xl font-display font-black text-xs uppercase"
                        style={{ background: "#D6FF00", color: "#0A1633" }}
                      >
                        + Agregar Item
                      </button>
                    </form>

                    {proShopItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-hairline)",
                        }}
                      >
                        <span className="font-display font-bold text-sm truncate max-w-xs">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">S/:</span>
                          <input
                            type="number"
                            value={item.regularPrice}
                            onChange={(e) =>
                              onAdminUpdateShopItem &&
                              onAdminUpdateShopItem(item.id, {
                                regularPrice: Number(e.target.value) || 20,
                              })
                            }
                            className="w-16 px-2 py-1 rounded-lg text-center text-xs font-bold"
                            style={{
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-strong)",
                              color: "var(--text-main)",
                            }}
                          />
                          <span className="text-xs">💎:</span>
                          <input
                            type="number"
                            value={item.gemCost || 100}
                            onChange={(e) =>
                              onAdminUpdateShopItem &&
                              onAdminUpdateShopItem(item.id, {
                                gemCost: Number(e.target.value) || 50,
                              })
                            }
                            className="w-16 px-2 py-1 rounded-lg text-center text-xs font-bold text-emerald-400"
                            style={{
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-strong)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  PESTAÑA 6: ANUNCIOS PERSONALIZADOS, BONO GEMAS Y TEMPORADA
                 ============================================================== */}
              {adminTab === "temporada" && (
                <div className="space-y-5">
                  <div
                    className="rounded-3xl p-5 space-y-3"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1.5px solid var(--wta-emerald)",
                    }}
                  >
                    <h4 className="font-wta-condensed text-2xl font-bold text-emerald-400">
                      PUBLICAR BANNER DE ANUNCIO / INCENTIVO EN LA APP
                    </h4>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="Título del anuncio"
                      className="w-full px-4 py-3 rounded-xl text-sm font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                    <input
                      type="text"
                      value={annSubtitle}
                      onChange={(e) => setAnnSubtitle(e.target.value)}
                      placeholder="Subtítulo o beneficio con Gemas..."
                      className="w-full px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-hairline)",
                        color: "var(--text-main)",
                      }}
                    />
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (onAdminUpdateAnnouncement) {
                            onAdminUpdateAnnouncement({
                              active: true,
                              title: annTitle,
                              subtitle: annSubtitle,
                            });
                          }
                          alert("¡Anuncio publicado en la pantalla de los jugadores!");
                        }}
                        className="touch-btn px-5 py-3 rounded-xl font-display font-black text-xs uppercase"
                        style={{ background: "#00DC7D", color: "#1E0734" }}
                      >
                        Publicar Anuncio Activo
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onAdminUpdateAnnouncement) {
                            onAdminUpdateAnnouncement(null);
                          }
                        }}
                        className="touch-btn px-4 py-3 rounded-xl font-display font-bold text-xs uppercase border"
                        style={{ borderColor: "var(--border-strong)" }}
                      >
                        Ocultar Banner Global
                      </button>
                    </div>
                  </div>

                  {/* Bono Masivo de Gemas + Cierre de Temporada */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (onAdminGiveGemsToAll) onAdminGiveGemsToAll(50);
                        alert(
                          "¡Se acreditaron +50 💎 Gemas de incentivo a todos los tenistas del circuito!"
                        );
                      }}
                      className="touch-btn py-4 px-4 rounded-2xl font-display font-black text-xs sm:text-sm uppercase tracking-wider"
                      style={{
                        background: "var(--emerald-bg)",
                        color: "var(--wta-emerald)",
                        border: "1.5px solid var(--wta-emerald)",
                      }}
                    >
                      💎 Regalar +50 Gemas a Todos los Tenistas
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onTriggerSeasonReset) onTriggerSeasonReset();
                        alert(
                          "Nueva temporada iniciada aplicando Pisos y Checkpoints merecidos."
                        );
                      }}
                      className="touch-btn py-4 px-4 rounded-2xl font-display font-black text-xs sm:text-sm uppercase tracking-wider"
                      style={{
                        background: "var(--gold-bg)",
                        color: "var(--gold)",
                        border: "1.5px solid var(--gold-border)",
                      }}
                    >
                      🏆 Iniciar Nueva Temporada (Pisos & Checkpoints)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 51. BANNER INTELIGENTE DE INCENTIVO PERSONALIZADO POR CUENTA
//     Adapta el mensaje si el usuario viene de ganar, si viene de perder o si hay anuncio
// ============================================================================
export const PersonalizedIncentiveBanner = ({
  currentUser,
  globalAnnouncement,
  onOpenProShop,
  onGoToSedesTips,
  onGoToTournaments,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !currentUser) return null;

  const lastDelta = Number(currentUser.lastDelta || 0);
  const isComingFromWin = lastDelta >= 0 && (currentUser.streak || 0) > 0;

  const bannerConfig = globalAnnouncement?.active
    ? {
        badge: "📣 COMUNICADO OFICIAL DEL CIRCUITO",
        title: globalAnnouncement.title,
        subtitle: globalAnnouncement.subtitle,
        ctaLabel: "Ver Torneos",
        onCta: onGoToTournaments,
        borderColor: "#D6FF00",
        accent: "#D6FF00",
      }
    : isComingFromWin
    ? {
        badge: `🔥 RACHA ACTIVA (+${currentUser.streak || 1}) · TIENES ${
          currentUser.gems ?? 150
        } 💎 GEMAS`,
        title: `¡Gran momento en cancha, ${
          currentUser.name.split(" ")[0]
        }! Aprovecha tu impulso`,
        subtitle:
          "Usa tus Gemas acumuladas para descontar tu inscripción al próximo Torneo Oficial o canjear pelotas nuevas en el Pro Shop.",
        ctaLabel: "Canjear Gemas 💎",
        onCta: onOpenProShop,
        borderColor: "#00DC7D",
        accent: "#00DC7D",
      }
    : {
        badge: `💪 CONSTANCIA PREMIADA (+25 💎 POR PARTIDO) · SALDO: ${
          currentUser.gems ?? 150
        } 💎`,
        title: `${
          currentUser.name.split(" ")[0]
        }, cada partido jugado te acerca a tu mejor nivel`,
        subtitle:
          "Mira gratis el tip de Primer Saque en altura de Academia TV o canjea tus Gemas por un bono en clase técnica con Coach Pro.",
        ctaLabel: "Ver Tips Gratis 🎬",
        onCta: onGoToSedesTips,
        borderColor: "#38BDF8",
        accent: "#38BDF8",
      };

  return (
    <div className="px-3 sm:px-5 pt-3 max-w-4xl mx-auto">
      <div
        className="rounded-3xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg relative"
        style={{
          background:
            "linear-gradient(90deg, rgba(30,7,52,0.92) 0%, rgba(15,23,42,0.92) 100%)",
          border: `1.5px solid ${bannerConfig.borderColor}`,
          color: "#FFFFFF",
        }}
      >
        <div className="min-w-0 flex-1 space-y-0.5 pr-6">
          <div
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: bannerConfig.accent }}
          >
            {bannerConfig.badge}
          </div>
          <div className="font-display font-black text-sm sm:text-base text-white leading-snug">
            {bannerConfig.title}
          </div>
          <div className="text-xs text-slate-300 leading-snug">
            {bannerConfig.subtitle}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {bannerConfig.onCta && (
            <button
              type="button"
              onClick={bannerConfig.onCta}
              className="touch-btn px-4 py-2 rounded-full font-display font-black text-xs uppercase tracking-wider flex-shrink-0"
              style={{
                minHeight: 36,
                background: bannerConfig.accent,
                color: "#0A1633",
              }}
            >
              {bannerConfig.ctaLabel}
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs font-bold text-slate-400 hover:text-white px-1.5"
            aria-label="Ocultar recomendación"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 52. BARRA INFERIOR DE 5 PESTAÑAS CON CRECIMIENTO ELÁSTICO AL SELECCIONAR
// ============================================================================
export const BottomTabNavigation = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: "perfil", label: "Mi Perfil", icon: ASSETS.navPerfil },
    { id: "ranking", label: "Ranking", icon: ASSETS.navRanking },
    { id: "retos", label: "Retos", icon: ASSETS.navRetos, isCenter: true },
    { id: "sedes", label: "Sedes & TV", icon: ASSETS.navSedes },
    { id: "torneos", label: "Torneos", icon: ASSETS.navTorneos },
  ];

  return (
    <nav className="safe-bottom-bar px-2 pt-2 select-none">
      <div className="max-w-xl mx-auto grid grid-cols-5 items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="touch-btn flex flex-col items-center justify-center py-1 relative group"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  transform: isActive
                    ? "scale(1.22) translateY(-4px)"
                    : "scale(1)",
                  background: isActive
                    ? "linear-gradient(135deg, #00DC7D 0%, #D6FF00 100%)"
                    : "var(--bg-subtle)",
                  border: isActive
                    ? "2px solid #FFFFFF"
                    : "1.5px solid var(--border-hairline)",
                  boxShadow: isActive
                    ? "0 8px 24px rgba(0, 220, 125, 0.48)"
                    : "none",
                }}
              >
                <SafeImage
                  src={tab.icon}
                  alt={tab.label}
                  circular
                  style={{ width: 28, height: 28 }}
                />
              </div>

              <span
                className="text-xs font-display font-extrabold mt-1 tracking-tight transition-colors"
                style={{
                  color: isActive ? "var(--wta-emerald)" : "var(--text-muted)",
                  fontWeight: isActive ? 900 : 700,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ============================================================================
// 53. COMPONENTE MAESTRO PRINCIPAL: export default function App()
// ============================================================================
export default function App() {
  const [showSplash3D, setShowSplash3D] = useState(true);
  const [theme, setTheme] = usePersistentState("theme", "dark");
  const [activeTab, setActiveTab] = usePersistentState("active_tab", "perfil");
  const [players, setPlayers] = usePersistentState("players", INITIAL_PLAYERS);
  const [currentUserId, setCurrentUserId] = usePersistentState(
    "current_user_id",
    "p_pablo"
  );
  const [challenges, setChallenges] = usePersistentState(
    "challenges",
    INITIAL_CHALLENGES
  );
  const [completedMatches, setCompletedMatches] = usePersistentState(
    "completed_matches",
    INITIAL_COMPLETED_MATCHES
  );
  const [clubs, setClubs] = usePersistentState("clubs", HUANCAYO_CLUBS);
  const [coaches, setCoaches] = usePersistentState("coaches", INITIAL_COACHES);
  const [tournaments, setTournaments] = usePersistentState(
    "tournaments",
    INITIAL_TOURNAMENTS
  );
  const [proShopItems, setProShopItems] = usePersistentState(
    "proshop_items",
    PRO_SHOP_ITEMS
  );
  const [unlockedVideoIds, setUnlockedVideoIds] = usePersistentState(
    "unlocked_videos",
    []
  );
  const [vipPendingIds, setVipPendingIds] = usePersistentState(
    "vip_pending_ids",
    []
  );
  const [dismissedPendingPopupIds, setDismissedPendingPopupIds] =
    usePersistentState("dismissed_popups", []);
  const [globalAnnouncement, setGlobalAnnouncement] = usePersistentState(
    "global_announcement",
    null
  );

  // Estados de Ventanas Modales Independientes
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulletinOpen, setIsBulletinOpen] = useState(false);
  const [isProShopOpen, setIsProShopOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isVisualRulesOpen, setIsVisualRulesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminSuiteOpen, setIsAdminSuiteOpen] = useState(false);
  const [isVisionIaModalOpen, setIsVisionIaModalOpen] = useState(false);

  const [h2hPair, setH2hPair] = useState({ open: false, pA: null, pB: null });
  const [storyPosterMatch, setStoryPosterMatch] = useState(null);
  const [celebrationData, setCelebrationData] = useState(null);
  const [launchChallengeTarget, setLaunchChallengeTarget] = useState({
    open: false,
    rival: null,
  });
  const [counterProposalTarget, setCounterProposalTarget] = useState(null);
  const [officialScoreChallenge, setOfficialScoreChallenge] = useState(null);
  const [selectedClubDetail, setSelectedClubDetail] = useState(null);
  const [selectedCoachModal, setSelectedCoachModal] = useState(null);
  const [tournamentPaymentTarget, setTournamentPaymentTarget] = useState(null);
  const [newAccountCalibrationPlayerId, setNewAccountCalibrationPlayerId] =
    useState(null);

  const [liveWeatherHuancayo, setLiveWeatherHuancayo] = useState({
    temp: 19,
    uv: 8,
  });
  const [editorialNews, setEditorialNews] = useState(FALLBACK_EDITORIAL_NEWS);

  const currentUser = useMemo(
    () => players.find((p) => p.id === currentUserId) || players[0],
    [players, currentUserId]
  );

  // Cierre universal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
        setIsBulletinOpen(false);
        setIsProShopOpen(false);
        setIsSettingsOpen(false);
        setIsVipModalOpen(false);
        setIsVisualRulesOpen(false);
        setIsAuthModalOpen(false);
        setIsAdminSuiteOpen(false);
        setIsVisionIaModalOpen(false);
        setH2hPair({ open: false, pA: null, pB: null });
        setStoryPosterMatch(null);
        setCelebrationData(null);
        setLaunchChallengeTarget({ open: false, rival: null });
        setCounterProposalTarget(null);
        setOfficialScoreChallenge(null);
        setSelectedClubDetail(null);
        setSelectedCoachModal(null);
        setTournamentPaymentTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clima real de Huancayo + Noticias verificadas
  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-12.0651&longitude=-75.2049&current=temperature_2m,uv_index"
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current) {
          setLiveWeatherHuancayo({
            temp: Math.round(data.current.temperature_2m ?? 19),
            uv: Math.round(data.current.uv_index ?? 8),
          });
        }
      })
      .catch(() => {});

    fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.puntodebreak.com%2Frss.xml"
    )
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.items) && data.items.length > 0) {
          const parsed = data.items.slice(0, 6).map((item, idx) => ({
            id: `rss_${idx}`,
            source: "Punto de Break / WTA",
            title: item.title,
            publishedAt: item.pubDate
              ? item.pubDate.slice(0, 16)
              : "Actualidad",
            link: item.link || "https://www.puntodebreak.com/",
            imageUrl: extractRealPhotoFromRssItem(item),
          }));
          setEditorialNews(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const incomingPopupChallenge = useMemo(() => {
    return challenges.find(
      (c) =>
        c.status === "pending" &&
        c.challengedId === currentUser?.id &&
        !dismissedPendingPopupIds.includes(c.id)
    );
  }, [challenges, currentUser, dismissedPendingPopupIds]);

  const unreadAlertsCount = useMemo(() => {
    return challenges.filter(
      (c) => c.status === "pending" && c.challengedId === currentUser?.id
    ).length;
  }, [challenges, currentUser]);

  // Handlers de Persistencia y Gamificación con Gemas 💎
  const handleSaveProfile = useCallback(
    (updatedPlayer) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
      );
      syncWithSupabase("jugadores", updatedPlayer);
    },
    [setPlayers]
  );

  const handleToggleLookingForMatch = useCallback(() => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      lookingForMatchToday: !currentUser.lookingForMatchToday,
      lookingForMatchNote: !currentUser.lookingForMatchToday
        ? "Disponible hoy para single"
        : "",
    };
    handleSaveProfile(updated);
  }, [currentUser, handleSaveProfile]);

  const handleAcceptChallenge = useCallback(
    (challengeId) => {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId ? { ...c, status: "confirmed" } : c
        )
      );
      setDismissedPendingPopupIds((prev) =>
        prev.includes(challengeId) ? prev : [...prev, challengeId]
      );
    },
    [setChallenges, setDismissedPendingPopupIds]
  );

  const handleRejectChallenge = useCallback(
    (challengeId) => {
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      setDismissedPendingPopupIds((prev) =>
        prev.includes(challengeId) ? prev : [...prev, challengeId]
      );
    },
    [setChallenges, setDismissedPendingPopupIds]
  );

  const handleSendCounterProposal = useCallback(
    (challengeId, updatedFields) => {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId ? { ...c, ...updatedFields } : c
        )
      );
      setDismissedPendingPopupIds((prev) =>
        prev.includes(challengeId) ? prev : [...prev, challengeId]
      );
    },
    [setChallenges, setDismissedPendingPopupIds]
  );

  const handleCreateChallenge = useCallback(
    (payload) => {
      const newCh = {
        id: `ch_${Date.now()}`,
        ...payload,
        status: "pending",
        proposedScore: null,
        liveScore: null,
      };
      setChallenges((prev) => [newCh, ...prev]);
      syncWithSupabase("partidos", newCh);
    },
    [setChallenges]
  );

  const handleUpdateLiveRefereeScore = useCallback(
    (challengeId, fieldKey, deltaOrSet) => {
      setChallenges((prev) =>
        prev.map((ch) => {
          if (ch.id !== challengeId) return ch;
          const ls = ch.liveScore || {
            currentSet: 1,
            s1A: 0,
            s1B: 0,
            tb1A: 0,
            tb1B: 0,
            s2A: 0,
            s2B: 0,
            tb2A: 0,
            tb2B: 0,
            stbA: 0,
            stbB: 0,
          };
          if (fieldKey === "advanceSet") {
            return {
              ...ch,
              refereeName: currentUser?.name || "Árbitro",
              refereeUpdatedAt: "Ahora",
              liveScore: { ...ls, currentSet: deltaOrSet },
            };
          }
          const nextVal = Math.max(0, Number(ls[fieldKey] || 0) + deltaOrSet);
          return {
            ...ch,
            refereeName: currentUser?.name || "Árbitro",
            refereeUpdatedAt: "Ahora",
            liveScore: { ...ls, [fieldKey]: nextVal },
          };
        })
      );
    },
    [setChallenges, currentUser]
  );

  const handleFinalizeRefereeMatchPendingReview = useCallback(
    (challengeId, finalScoreString) => {
      setChallenges((prev) =>
        prev.map((ch) =>
          ch.id === challengeId
            ? {
                ...ch,
                proposedScore: finalScoreString,
                liveScore: {
                  ...(ch.liveScore || {}),
                  liveFinishedPendingReview: true,
                },
              }
            : ch
        )
      );
    },
    [setChallenges]
  );

  // Liquidación Oficial del Partido + Animación de Celebración y Acreditación de Gemas 💎
  const handleConfirmOfficialScore = useCallback(
    (challengeId, scoreEvaluation) => {
      const ch = challenges.find((c) => c.id === challengeId);
      if (!ch) return;

      const pA = players.find((p) => p.id === ch.challengerId);
      const pB = players.find((p) => p.id === ch.challengedId);
      if (!pA || !pB) return;

      const settlement = calculateMatchEloSettlement({
        playerA: pA,
        playerB: pB,
        scoreEvaluation,
        forceFriendly: ch.isFriendly,
        completedMatches,
        totalActivePlayers: players.length,
      });

      const aWon = scoreEvaluation.winnerSide === "A";
      const winner = aWon ? pA : pB;
      const loser = aWon ? pB : pA;

      const gemsForA = aWon ? settlement.gemsWinner : settlement.gemsLoser;
      const gemsForB = !aWon ? settlement.gemsWinner : settlement.gemsLoser;

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === pA.id) {
            return {
              ...p,
              elo: settlement.newEloA,
              lastDelta: settlement.deltaA,
              wins: aWon ? (p.wins || 0) + 1 : p.wins || 0,
              losses: !aWon ? (p.losses || 0) + 1 : p.losses || 0,
              careerWins: aWon
                ? (p.careerWins || p.wins || 0) + 1
                : p.careerWins || p.wins || 0,
              careerLosses: !aWon
                ? (p.careerLosses || p.losses || 0) + 1
                : p.careerLosses || p.losses || 0,
              seasonMatches: (p.seasonMatches || 0) + 1,
              streak: aWon ? (p.streak || 0) + 1 : 0,
              calibrationMatches: Math.min(5, (p.calibrationMatches ?? 5) + 1),
              gems: (p.gems ?? 150) + gemsForA,
            };
          }
          if (p.id === pB.id) {
            return {
              ...p,
              elo: settlement.newEloB,
              lastDelta: settlement.deltaB,
              wins: !aWon ? (p.wins || 0) + 1 : p.wins || 0,
              losses: aWon ? (p.losses || 0) + 1 : p.losses || 0,
              careerWins: !aWon
                ? (p.careerWins || p.wins || 0) + 1
                : p.careerWins || p.wins || 0,
              careerLosses: aWon
                ? (p.careerLosses || p.losses || 0) + 1
                : p.careerLosses || p.losses || 0,
              seasonMatches: (p.seasonMatches || 0) + 1,
              streak: !aWon ? (p.streak || 0) + 1 : 0,
              calibrationMatches: Math.min(5, (p.calibrationMatches ?? 5) + 1),
              gems: (p.gems ?? 150) + gemsForB,
            };
          }
          return p;
        })
      );

      const completedRecord = {
        id: `hist_${Date.now()}`,
        eventTitle: ch.isBossMatch
          ? "Desafío al Boss · Circuito Huancayo"
          : `Desafío Oficial · ${ch.customClubName}`,
        challengerId: pA.id,
        challengedId: pB.id,
        winnerId: winner.id,
        loserId: loser.id,
        score: scoreEvaluation.formattedScore,
        setsA: [
          scoreEvaluation.s1A ?? 6,
          scoreEvaluation.s2A ?? 6,
          scoreEvaluation.stbA ?? null,
        ],
        setsB: [
          scoreEvaluation.s1B ?? 4,
          scoreEvaluation.s2B ?? 3,
          scoreEvaluation.stbB ?? null,
        ],
        clubId: ch.clubId,
        clubName: ch.customClubName,
        dateLabel: ch.dateTimeLabel,
        completedAt: Date.now(),
        winnerDelta: Math.abs(aWon ? settlement.deltaA : settlement.deltaB),
        loserDelta: aWon ? settlement.deltaB : settlement.deltaA,
        gemsAwarded: settlement.gemsWinner,
        isFriendly: settlement.isFriendly,
      };

      setCompletedMatches((prev) => [completedRecord, ...prev]);
      setChallenges((prev) => prev.filter((item) => item.id !== challengeId));

      const iAmPlayerA = currentUser?.id === pA.id;
      const didIWin =
        currentUser?.id === winner.id ||
        (currentUser?.id !== pA.id && currentUser?.id !== pB.id && aWon);
      const myEloDelta = iAmPlayerA ? settlement.deltaA : settlement.deltaB;
      const myGemsEarned = iAmPlayerA ? gemsForA : gemsForB;

      setCelebrationData({
        title: didIWin
          ? `¡VICTORIA DE ${winner.name.toUpperCase()}!`
          : `¡GRAN ESFUERZO EN CANCHA!`,
        subtitle: `Marcador Oficial: ${scoreEvaluation.formattedScore} en ${ch.customClubName}`,
        gemsEarned: myGemsEarned,
        eloDelta: myEloDelta,
        isWin: didIWin,
        customBannerText: didIWin
          ? `Sumaste +${myGemsEarned} 💎 Gemas. Úsalas ahora para descontar tu entrada al Abierto Los Huancas o canjear pelotas en el Pro Shop.`
          : `Por tu fair play y entrega en cancha recibiste +${myGemsEarned} 💎 Gemas. Puedes canjearlas en una clínica grupal de Coach Pro.`,
        matchRecord: completedRecord,
      });
    },
    [
      challenges,
      players,
      completedMatches,
      currentUser,
      setPlayers,
      setCompletedMatches,
      setChallenges,
    ]
  );

  // Reportar el clima de una sede premia con +5 💎 Gemas
  const handleUpdateSurfaceWeather = useCallback(
    (clubId, newStateId) => {
      setClubs((prev) =>
        prev.map((c) =>
          c.id === clubId
            ? {
                ...c,
                surfaceStateId: newStateId,
                lastReportBy: currentUser?.name || "Jugador",
                lastReportTime: "Hace instantes",
              }
            : c
        )
      );
      if (currentUser) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === currentUser.id
              ? { ...p, gems: (p.gems ?? 150) + ELO_CONSTANTS.GEMS_WEATHER_REPORT }
              : p
          )
        );
      }
    },
    [setClubs, setPlayers, currentUser]
  );

  // Canjear un Video Masterclass con Gemas
  const handleUnlockVideoWithGems = useCallback(
    (videoObj) => {
      if (!currentUser || !videoObj) return false;
      const cost = Number(videoObj.gemCost || 40);
      const userGems = Number(currentUser.gems ?? 150);
      if (userGems < cost) {
        alert(
          `Necesitas ${cost} 💎 Gemas para desbloquear esta Masterclass (Tienes ${userGems} 💎). Juega un reto para ganar más Gemas.`
        );
        return false;
      }
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === currentUser.id ? { ...p, gems: userGems - cost } : p
        )
      );
      setUnlockedVideoIds((prev) =>
        prev.includes(videoObj.id) ? prev : [...prev, videoObj.id]
      );
      return true;
    },
    [currentUser, setPlayers, setUnlockedVideoIds]
  );

  // Canjear un Producto o Recompensa del Pro Shop con Gemas
  const handleRedeemItemWithGems = useCallback(
    (item) => {
      if (!currentUser || !item) return;
      const cost = Number(item.gemCost || 100);
      const userGems = Number(currentUser.gems ?? 150);
      if (userGems < cost) {
        alert(
          `Te faltan ${
            cost - userGems
          } 💎 Gemas para este canje. Recuerda que ganas +50 💎 por victoria y +25 💎 por cada partido jugado.`
        );
        return;
      }
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === currentUser.id ? { ...p, gems: userGems - cost } : p
        )
      );
      const waMsg = `Hola MATCHPOINT Pro Shop, soy ${currentUser.name}. Acabo de canjear ${cost} 💎 Gemas en la app por: "${item.name}".`;
      window.open(
        `https://wa.me/${PAYMENT_METHODS_CONFIG.whatsappApprovalPhone}?text=${encodeURIComponent(
          waMsg
        )}`,
        "_blank"
      );
    },
    [currentUser, setPlayers]
  );

  const handleSaveCoachProfile = useCallback(
    (updatedCoach) => {
      setCoaches((prev) =>
        prev.map((c) => (c.id === updatedCoach.id ? updatedCoach : c))
      );
      setSelectedCoachModal(updatedCoach);
    },
    [setCoaches]
  );

  const handleAddCoachReview = useCallback(
    (coachId, reviewObj) => {
      setCoaches((prev) =>
        prev.map((c) => {
          if (c.id !== coachId) return c;
          const updatedReviews = [reviewObj, ...(c.reviews || [])];
          return {
            ...c,
            reviewsCount: updatedReviews.length,
            reviews: updatedReviews,
          };
        })
      );
    },
    [setCoaches]
  );

  const handleSubmitTournamentApplication = useCallback(
    (tournamentId, playerId, paymentDetails) => {
      if (paymentDetails?.usedGems > 0) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  gems: Math.max(0, (p.gems ?? 150) - paymentDetails.usedGems),
                }
              : p
          )
        );
      }
      setTournaments((prev) =>
        prev.map((t) => {
          if (t.id !== tournamentId) return t;
          const currentPending = t.pendingApplicantIds || [];
          if (currentPending.includes(playerId)) return t;
          return {
            ...t,
            pendingApplicantIds: [...currentPending, playerId],
          };
        })
      );
    },
    [setTournaments, setPlayers]
  );

  const handleRegisterNewPlayer = useCallback(
    (newPlayerData) => {
      const newId = `p_${Date.now()}`;
      const created = {
        id: newId,
        name: newPlayerData.name,
        email: newPlayerData.email,
        phone: newPlayerData.phone,
        password: newPlayerData.password,
        age: newPlayerData.age || 28,
        heightLabel: newPlayerData.heightLabel || "1.76 m",
        birthPlace: "Huancayo, PER",
        clubId: newPlayerData.clubId || "country",
        elo: 500,
        careerHighRank: players.length + 1,
        previousRank: players.length + 1,
        lastDelta: 0,
        wins: 0,
        losses: 0,
        careerWins: 0,
        careerLosses: 0,
        titlesCount: 0,
        seasonMatches: 0,
        streak: 0,
        calibrationMatches: 0,
        gems: 150,
        profileThemeId: "wta_finals",
        hand: newPlayerData.hand || "Diestro",
        bestShot: newPlayerData.bestShot || "Derecha (Forehand)",
        availableDays: ["S", "D"],
        availableSlots: ["18:00–22:00"],
        whatsappPrivate: false,
        isVipMember: false,
        vipCode: `MP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        activeStatus: "active",
        avatar: newPlayerData.avatar || "",
        heroPhoto: newPlayerData.heroPhoto || newPlayerData.avatar || "",
      };
      setPlayers((prev) => [...prev, created]);
      setCurrentUserId(newId);
      setNewAccountCalibrationPlayerId(newId);
    },
    [players.length, setPlayers, setCurrentUserId]
  );

  const handleCompleteInitialSeed = useCallback(
    (playerId, seedElo) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? { ...p, elo: seedElo, gems: (p.gems ?? 150) + 50 }
            : p
        )
      );
      setNewAccountCalibrationPlayerId(null);
      setActiveTab("perfil");
    },
    [setPlayers, setActiveTab]
  );

  return (
    <div
      className={`app-shell court-lines-bg ${
        theme === "light" ? "theme-light" : ""
      }`}
    >
      <style>{GLOBAL_STYLES}</style>

      {/* 0. PANTALLA DE CARGA INTERACTIVA 3D AL INICIAR LA APP */}
      {showSplash3D && (
        <Interactive3DSplashScreen
          onFinishSplash={() => setShowSplash3D(false)}
        />
      )}

      {/* 1. HEADER SUPERIOR OFICIAL (CON CONTADOR DE 💎 GEMAS, PRO SHOP Y AVISOS) */}
      <TopHeaderBar
        currentUser={currentUser}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenProShop={() => setIsProShopOpen(true)}
        onOpenBulletin={() => setIsBulletinOpen(true)}
        onSecretAdminTrigger={() => setIsAdminSuiteOpen(true)}
        unreadBulletinCount={unreadAlertsCount}
      />

      {/* 2. CONTENEDOR PRINCIPAL DE VISTAS CON BANNER PERSONALIZADO DE INCENTIVO */}
      <main className="app-scroll-container no-scrollbar">
        <PersonalizedIncentiveBanner
          currentUser={currentUser}
          globalAnnouncement={globalAnnouncement}
          onOpenProShop={() => setIsProShopOpen(true)}
          onGoToSedesTips={() => setActiveTab("sedes")}
          onGoToTournaments={() => setActiveTab("torneos")}
        />

        {activeTab === "perfil" && (
          <MyProfileView
            player={currentUser}
            allPlayers={players}
            completedMatches={completedMatches}
            clubs={clubs}
            onSaveProfile={handleSaveProfile}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenVipUpgrade={() => setIsVipModalOpen(true)}
            onOpenHeadToHead={(pA, pB) =>
              setH2hPair({ open: true, pA, pB })
            }
            onOpenStoryPoster={(m) => setStoryPosterMatch(m)}
            onOpenProShop={() => setIsProShopOpen(true)}
            onToggleLookingForMatch={handleToggleLookingForMatch}
            onGoToChallenges={() => setActiveTab("retos")}
          />
        )}

        {activeTab === "ranking" && (
          <RankingOfficialView
            players={players}
            currentUser={currentUser}
            clubs={clubs}
            onSelectPlayerForH2H={(pA, pB) =>
              setH2hPair({ open: true, pA, pB })
            }
            onLaunchChallenge={(rival) =>
              setLaunchChallengeTarget({ open: true, rival })
            }
          />
        )}

        {activeTab === "retos" && (
          <ChallengesCenterView
            challenges={challenges}
            players={players}
            currentUser={currentUser}
            clubs={clubs}
            onOpenNewChallengeModal={(rival) =>
              setLaunchChallengeTarget({ open: true, rival })
            }
            onOpenOfficialScoreModal={(ch) => setOfficialScoreChallenge(ch)}
            onAcceptChallenge={handleAcceptChallenge}
            onOpenCounterProposal={(ch) => setCounterProposalTarget(ch)}
            onUpdateLiveRefereeScore={handleUpdateLiveRefereeScore}
            onFinalizeRefereeMatchPendingReview={
              handleFinalizeRefereeMatchPendingReview
            }
            onOpenHeadToHead={(pA, pB) =>
              setH2hPair({ open: true, pA, pB })
            }
            onOpenVisionIaModal={() => setIsVisionIaModalOpen(true)}
          />
        )}

        {activeTab === "sedes" && (
          <SedesAndCoachProView
            clubs={clubs}
            coaches={coaches}
            videos={WTA_VIDEO_ACADEMY_TIPS}
            unlockedVideoIds={unlockedVideoIds}
            currentUser={currentUser}
            liveWeather={liveWeatherHuancayo}
            onUpdateSurfaceWeather={handleUpdateSurfaceWeather}
            onOpenClubDetailModal={(club) => setSelectedClubDetail(club)}
            onOpenCoachProfileModal={(coach) => setSelectedCoachModal(coach)}
            onUnlockVideoWithGems={handleUnlockVideoWithGems}
          />
        )}

        {activeTab === "torneos" && (
          <TournamentsAndHallOfFameView
            tournaments={tournaments}
            hallOfFame={HALL_OF_FAME_CHAMPIONS}
            players={players}
            currentUser={currentUser}
            clubs={clubs}
            onOpenTournamentPaymentModal={(t) =>
              setTournamentPaymentTarget(t)
            }
            onOpenHeadToHead={(pA, pB) =>
              setH2hPair({ open: true, pA, pB })
            }
          />
        )}
      </main>

      {/* 3. BARRA INFERIOR DE 5 PESTAÑAS CON ICONOS QUE CRECEN AL TOCARLOS */}
      <BottomTabNavigation
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
      />

      {/* 4. POP-UP AUTOMÁTICO DE RETO RECIBIDO (CON OPCIÓN DE CONTRAPROPUESTA) */}
      {incomingPopupChallenge && (
        <div className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-4">
          <div className="ios-modal-card w-full max-w-md rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span
                className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase"
                style={{ background: "#D6FF00", color: "#0A1633" }}
              >
                ⚡ Nuevo Desafío Recibido
              </span>
              <button
                type="button"
                onClick={() =>
                  setDismissedPendingPopupIds((prev) => [
                    ...prev,
                    incomingPopupChallenge.id,
                  ])
                }
                className="touch-btn w-9 h-9 rounded-full"
                style={{ background: "var(--bg-subtle)" }}
              >
                <Icons.Close size={18} />
              </button>
            </div>

            {(() => {
              const challenger = players.find(
                (p) => p.id === incomingPopupChallenge.challengerId
              );
              return (
                <div className="flex items-center gap-4">
                  <WtaEmeraldPortrait
                    src={challenger?.avatar}
                    name={challenger?.name}
                    size={62}
                  />
                  <div>
                    <div className="font-wta-condensed text-3xl font-bold leading-none">
                      {challenger?.name} TE DESAFÍA
                    </div>
                    <div
                      className="text-sm font-extrabold mt-1"
                      style={{ color: "var(--clay)" }}
                    >
                      📍 {incomingPopupChallenge.customClubName}
                    </div>
                    <div
                      className="text-xs sm:text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      📅 {incomingPopupChallenge.dateTimeLabel} ·{" "}
                      {incomingPopupChallenge.ballAgreement}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  handleAcceptChallenge(incomingPopupChallenge.id)
                }
                className="touch-btn py-3.5 rounded-2xl font-display font-black text-xs sm:text-sm uppercase"
                style={{ background: "#00DC7D", color: "#0A1633" }}
              >
                ✓ Aceptar Reto
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissedPendingPopupIds((prev) => [
                    ...prev,
                    incomingPopupChallenge.id,
                  ]);
                  setCounterProposalTarget(incomingPopupChallenge);
                }}
                className="touch-btn py-3.5 rounded-2xl font-display font-extrabold text-xs sm:text-sm uppercase border"
                style={{
                  borderColor: "var(--border-strong)",
                  color: "var(--text-main)",
                }}
              >
                📅 Reprogramar / Declinar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TODOS LOS MODALES DEL ECOSISTEMA WTA / ATP */}
      <SideNavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        onOpenVisualRules={() => setIsVisualRulesOpen(true)}
        onOpenVipModal={() => setIsVipModalOpen(true)}
        onOpenVisionIaModal={() => setIsVisionIaModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onReplaySplash3D={() => setShowSplash3D(true)}
      />

      <BulletinAndNewsModal
        isOpen={isBulletinOpen}
        onClose={() => setIsBulletinOpen(false)}
        currentUser={currentUser}
        challenges={challenges}
        tournaments={tournaments}
        players={players}
        clubs={clubs}
        newsItems={editorialNews}
        liveTicker={ATP_WTA_LIVE_TICKER}
        onAcceptChallenge={handleAcceptChallenge}
        onOpenCounterProposal={(ch) => setCounterProposalTarget(ch)}
        onGoToChallenges={() => setActiveTab("retos")}
        onGoToTournaments={() => setActiveTab("torneos")}
      />

      <ProShopModal
        isOpen={isProShopOpen}
        onClose={() => setIsProShopOpen(false)}
        items={proShopItems}
        currentUser={currentUser}
        onRedeemItemWithGems={handleRedeemItemWithGems}
        onOpenVipModal={() => setIsVipModalOpen(true)}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        player={currentUser}
        clubs={clubs}
        onSaveProfile={handleSaveProfile}
        onOpenSwitchAccount={() => setIsAuthModalOpen(true)}
        onOpenTutorialOnce={() => setIsVisualRulesOpen(true)}
      />

      <VipMembershipModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        player={currentUser}
        clubs={clubs}
        onRequestVipActivation={(pid) =>
          setVipPendingIds((prev) =>
            prev.includes(pid) ? prev : [...prev, pid]
          )
        }
      />

      <VisualRulesModal
        isOpen={isVisualRulesOpen}
        onClose={() => setIsVisualRulesOpen(false)}
      />

      <AtpHeadToHeadModal
        isOpen={h2hPair.open}
        onClose={() => setH2hPair({ open: false, pA: null, pB: null })}
        initialPlayerA={h2hPair.pA || currentUser}
        initialPlayerB={h2hPair.pB}
        allPlayers={players}
        completedMatches={completedMatches}
        clubs={clubs}
        onLaunchChallenge={(rival) =>
          setLaunchChallengeTarget({ open: true, rival })
        }
      />

      <StoryPosterModal
        isOpen={Boolean(storyPosterMatch)}
        onClose={() => setStoryPosterMatch(null)}
        matchData={storyPosterMatch}
        players={players}
      />

      <CelebrationRewardModal
        celebrationData={celebrationData}
        onClose={() => setCelebrationData(null)}
        onOpenStoryPoster={(m) => setStoryPosterMatch(m)}
        onOpenProShop={() => setIsProShopOpen(true)}
      />

      <LaunchChallengeModal
        isOpen={launchChallengeTarget.open}
        onClose={() =>
          setLaunchChallengeTarget({ open: false, rival: null })
        }
        currentUser={currentUser}
        preselectedRival={launchChallengeTarget.rival}
        players={players}
        clubs={clubs}
        completedMatches={completedMatches}
        onCreateChallenge={handleCreateChallenge}
      />

      <CounterProposalModal
        isOpen={Boolean(counterProposalTarget)}
        onClose={() => setCounterProposalTarget(null)}
        challenge={counterProposalTarget}
        players={players}
        clubs={clubs}
        onSendCounterProposal={handleSendCounterProposal}
        onConfirmDecline={handleRejectChallenge}
      />

      <MatchPointVisionIaModal
        isOpen={isVisionIaModalOpen}
        onClose={() => setIsVisionIaModalOpen(false)}
        currentUser={currentUser}
        onRedeemVisionWithGems={(pkg) =>
          handleRedeemItemWithGems({
            name: pkg.title,
            gemCost: pkg.gemsRequired,
          })
        }
      />

      <SubmitOfficialScoreModal
        isOpen={Boolean(officialScoreChallenge)}
        onClose={() => setOfficialScoreChallenge(null)}
        challenge={officialScoreChallenge}
        players={players}
        onConfirmOfficialScore={handleConfirmOfficialScore}
      />

      <ClubDetailModal
        isOpen={Boolean(selectedClubDetail)}
        onClose={() => setSelectedClubDetail(null)}
        club={selectedClubDetail}
        onOpenVipModal={() => setIsVipModalOpen(true)}
      />

      <CoachProProfileModal
        isOpen={Boolean(selectedCoachModal)}
        onClose={() => setSelectedCoachModal(null)}
        coach={selectedCoachModal}
        currentUser={currentUser}
        onSaveCoachProfile={handleSaveCoachProfile}
        onAddCoachReview={handleAddCoachReview}
        onRedeemCoachPackageWithGems={(coach, pkg) =>
          handleRedeemItemWithGems({
            name: `${pkg.name} con ${coach.name}`,
            gemCost: 80,
          })
        }
      />

      <TournamentPaymentModal
        isOpen={Boolean(tournamentPaymentTarget)}
        onClose={() => setTournamentPaymentTarget(null)}
        tournament={tournamentPaymentTarget}
        currentUser={currentUser}
        onSubmitTournamentApplication={handleSubmitTournamentApplication}
      />

      <AuthAndAccountModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        players={players}
        currentUser={currentUser}
        clubs={clubs}
        onSwitchUser={(uid) => setCurrentUserId(uid)}
        onRegisterNewPlayer={handleRegisterNewPlayer}
        onResetPasswordSuccess={(uid, newPass) =>
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === uid ? { ...p, password: newPass } : p
            )
          )
        }
      />

      <InitialCalibrationWizardModal
        isOpen={Boolean(newAccountCalibrationPlayerId)}
        player={players.find((p) => p.id === newAccountCalibrationPlayerId)}
        onCompleteInitialSeed={handleCompleteInitialSeed}
      />

      <HiddenAdminSuiteModal
        isOpen={isAdminSuiteOpen}
        onClose={() => setIsAdminSuiteOpen(false)}
        players={players}
        tournaments={tournaments}
        clubs={clubs}
        coaches={coaches}
        proShopItems={proShopItems}
        vipPendingPlayerIds={vipPendingIds}
        globalAnnouncement={globalAnnouncement}
        onApproveTournamentApplicant={(tournamentId, playerId) => {
          setTournaments((prev) =>
            prev.map((t) => {
              if (t.id !== tournamentId) return t;
              return {
                ...t,
                pendingApplicantIds: (t.pendingApplicantIds || []).filter(
                  (id) => id !== playerId
                ),
                enrolledPlayerIds: (t.enrolledPlayerIds || []).includes(
                  playerId
                )
                  ? t.enrolledPlayerIds
                  : [...(t.enrolledPlayerIds || []), playerId],
              };
            })
          );
        }}
        onRejectTournamentApplicant={(tournamentId, playerId) => {
          setTournaments((prev) =>
            prev.map((t) =>
              t.id === tournamentId
                ? {
                    ...t,
                    pendingApplicantIds: (t.pendingApplicantIds || []).filter(
                      (id) => id !== playerId
                    ),
                  }
                : t
            )
          );
        }}
        onApproveVipMember={(pid) => {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === pid ? { ...p, isVipMember: true } : p
            )
          );
          setVipPendingIds((prev) => prev.filter((id) => id !== pid));
        }}
        onAdminUpdatePlayer={(pid, fields) =>
          setPlayers((prev) =>
            prev.map((p) => (p.id === pid ? { ...p, ...fields } : p))
          )
        }
        onAdminCreatePlayer={(newP) => {
          const created = {
            id: `p_${Date.now()}`,
            name: newP.name,
            email: `${newP.name.toLowerCase().replace(/\s+/g, ".")}@matchpoint.pe`,
            phone: "964112233",
            password: "123",
            age: newP.age || 28,
            heightLabel: "1.77 m",
            clubId: newP.clubId || "country",
            elo: newP.elo || 1200,
            gems: newP.gems || 150,
            wins: 0,
            losses: 0,
            seasonMatches: 0,
            streak: 0,
            calibrationMatches: 5,
            hand: "Diestro",
            bestShot: "Derecha (Forehand)",
            availableDays: ["S", "D"],
            availableSlots: ["18:00–22:00"],
            isVipMember: false,
            activeStatus: "active",
            avatar: "",
          };
          setPlayers((prev) => [...prev, created]);
        }}
        onAdminUpdateTournament={(tid, fields) =>
          setTournaments((prev) =>
            prev.map((t) => (t.id === tid ? { ...t, ...fields } : t))
          )
        }
        onAdminCreateTournament={(newT) => {
          const created = {
            id: `tourn_${Date.now()}`,
            title: newT.title,
            shortBadge: "TORNEO OFICIAL",
            categoryId: "4TA",
            categoryLabel: newT.categoryLabel,
            clubId: newT.clubId,
            clubName: newT.clubName,
            surface: "Arcilla",
            dateRange: newT.dateRange,
            entryFee: newT.entryFee,
            gemDiscountFee: newT.gemDiscountFee,
            gemsRequiredForDiscount: 80,
            includesBalls: true,
            ballsLabel: "Incluye pelotas nuevas en cada ronda",
            formatLabel: "Eliminación Directa + Ronda Consuelo Garantizada",
            prizeChampion: newT.prizeChampion,
            maxPlayers: 8,
            bannerImage:
              "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80",
            enrolledPlayerIds: [],
            pendingApplicantIds: [],
            bracket: { quarters: [], final: null, consolationFinal: null },
          };
          setTournaments((prev) => [created, ...prev]);
        }}
        onAdminDeleteTournament={(tid) =>
          setTournaments((prev) => prev.filter((t) => t.id !== tid))
        }
        onAdminUpdateClub={(cid, fields) =>
          setClubs((prev) =>
            prev.map((c) => (c.id === cid ? { ...c, ...fields } : c))
          )
        }
        onAdminUpdateCoach={(coachId, fields) =>
          setCoaches((prev) =>
            prev.map((c) => (c.id === coachId ? { ...c, ...fields } : c))
          )
        }
        onAdminUpdateShopItem={(itemId, fields) =>
          setProShopItems((prev) =>
            prev.map((it) => (it.id === itemId ? { ...it, ...fields } : it))
          )
        }
        onAdminCreateShopItem={(newItem) => {
          const created = {
            id: `shop_${Date.now()}`,
            name: newItem.name,
            category: "Canje de Gemas",
            regularPrice: newItem.regularPrice,
            vipPrice: newItem.vipPrice,
            gemCost: newItem.gemCost,
            canRedeemFullWithGems: true,
            badge: "NUEVO EN TIENDA",
            image: ASSETS.pelotaVoltAzul,
            specs: "Disponible para canje inmediato con Gemas o pedido directo.",
          };
          setProShopItems((prev) => [created, ...prev]);
        }}
        onAdminUpdateAnnouncement={(ann) => setGlobalAnnouncement(ann)}
        onAdminGiveGemsToAll={(amount) =>
          setPlayers((prev) =>
            prev.map((p) => ({ ...p, gems: (p.gems ?? 150) + amount }))
          )
        }
        onTriggerSeasonReset={() =>
          setPlayers((prev) => prev.map((p) => applySeasonResetToPlayer(p)))
        }
      />
    </div>
  );
}

// === FIN DEL BLOQUE 12 DE 12 ===
