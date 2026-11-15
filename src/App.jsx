// ============================================================================
// MATCHPOINT — CIRCUITO OFICIAL DE TENIS HUANCAYO (EDICIÓN DEFINITIVA PRO)
// Arquitectura Consolidada: Persistencia Síncrona (localStorage + Supabase),
// ATP Head-to-Head Bicolor, Carnet VIP 3D, Árbol de Torneos y Blur Nativo iOS
// ============================================================================
// === INICIO DEL BLOQUE 1 DE 10 ===

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ============================================================================
// 1. MOTOR DE PERSISTENCIA SÍNCRONA EN DISCO + SINCRONIZACIÓN SUPABASE
// ============================================================================
const STORAGE_PREFIX = "mp_huancayo_v4_";

export function usePersistentState(key, initialValue) {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null && raw !== "undefined") {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback seguro si el navegador restringe almacenamiento local
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignorar excesos de cuota
    }
  }, [storageKey, state]);

  return [state, setState];
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
// 2. SISTEMA DE DISEÑO GLOBAL: SIMETRÍA 1:1 CLARO/OSCURO, ARCILLA, ORO Y BLUR iOS
// ============================================================================
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  /* TEMA OSCURO (NIGHT SESSION ATP — AZUL MARINO PROFUNDO + ARCILLA + ORO) */
  :root {
    --volt: #D6FF00;
    --electric: #00A3FF;
    --clay: #E07A5F;
    --clay-bg: rgba(224, 122, 95, 0.14);
    --clay-border: rgba(224, 122, 95, 0.35);
    --gold: #F59E0B;
    --gold-metallic: #D4AF37;
    --gold-bg: rgba(245, 158, 11, 0.14);
    --gold-border: rgba(212, 175, 55, 0.42);
    --silver: #CBD5E1;
    --bronze: #CD7F32;
    --emerald: #10B981;
    --emerald-bg: rgba(16, 185, 129, 0.14);
    --purple-slam: #A855F7;
    --crimson: #F43F5E;

    --bg-base: #070C16;
    --bg-card: #0E1729;
    --bg-elevated: #131F36;
    --bg-subtle: rgba(255, 255, 255, 0.045);
    --bg-input: #09101E;
    --text-main: #F8FAFC;
    --text-secondary: #CBD5E1;
    --text-player: #60A5FA;
    --text-muted: #94A3B8;
    --border-hairline: rgba(255, 255, 255, 0.09);
    --border-strong: rgba(255, 255, 255, 0.18);
    --thermometer-fill: #FFFFFF;
    --thermometer-track: rgba(255, 255, 255, 0.12);
    --modal-backdrop: rgba(4, 8, 18, 0.62);
    --modal-surface: rgba(14, 23, 41, 0.92);
    --shadow-card: 0 10px 30px -10px rgba(0, 0, 0, 0.55);
  }

  /* TEMA CLARO (DAYLIGHT ATP — MISMA GEOMETRÍA EXACTA, ALTO CONTRASTE AL SOL) */
  .theme-light {
    --volt: #D6FF00;
    --electric: #0052CC;
    --clay: #C85A32;
    --clay-bg: #FFF4F0;
    --clay-border: rgba(200, 90, 50, 0.32);
    --gold: #B45309;
    --gold-metallic: #B45309;
    --gold-bg: #FEF3C7;
    --gold-border: rgba(180, 83, 9, 0.35);
    --silver: #475569;
    --bronze: #9A3412;
    --emerald: #059669;
    --emerald-bg: #ECFDF5;
    --purple-slam: #7E22CE;
    --crimson: #E11D48;

    --bg-base: #F2F5F9;
    --bg-card: #FFFFFF;
    --bg-elevated: #F8FAFC;
    --bg-subtle: #F1F5F9;
    --bg-input: #F8FAFC;
    --text-main: #0A1633;
    --text-secondary: #1E293B;
    --text-player: #0052CC;
    --text-muted: #64748B;
    --border-hairline: #E2E8F0;
    --border-strong: #CBD5E1;
    --thermometer-fill: #0A1633;
    --thermometer-track: #E2E8F0;
    --modal-backdrop: rgba(10, 22, 51, 0.44);
    --modal-surface: rgba(255, 255, 255, 0.95);
    --shadow-card: 0 8px 24px -8px rgba(10, 22, 51, 0.08);
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
    padding-bottom: 108px;
  }

  /* Blindaje exacto bajo Isla Dinámica iPhone 16 Pro Max */
  .safe-top-header {
    padding-top: max(env(safe-area-inset-top, 54px), 54px);
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 12px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-hairline);
    z-index: 40;
    flex-shrink: 0;
  }

  .safe-modal-top {
    padding-top: max(env(safe-area-inset-top, 52px), 52px);
  }

  .safe-bottom-bar {
    padding-bottom: max(env(safe-area-inset-bottom, 20px), 12px);
    background: var(--bg-card);
    border-top: 1px solid var(--border-hairline);
    z-index: 40;
    flex-shrink: 0;
  }

  /* Desenfoque Real Nativo Estilo iOS (Pop-ups siempre enfrente de la pantalla) */
  .ios-blur-backdrop {
    background: var(--modal-backdrop);
    backdrop-filter: blur(22px) saturate(165%);
    -webkit-backdrop-filter: blur(22px) saturate(165%);
    animation: fadeBackdrop 0.22s ease-out forwards;
  }

  .ios-modal-card {
    background: var(--modal-surface);
    backdrop-filter: blur(26px);
    -webkit-backdrop-filter: blur(26px);
    border: 1px solid var(--border-strong);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.42);
    animation: springModal 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Transición Fluida entre Vistas y Sub-pestañas */
  .view-transition {
    animation: viewSlideFade 0.26s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes viewSlideFade {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeBackdrop {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes springModal {
    0% { opacity: 0; transform: translateY(24px) scale(0.96); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  .atp-card {
    background: var(--bg-card);
    border: 1px solid var(--border-hairline);
    box-shadow: var(--shadow-card);
    border-radius: 18px;
  }

  .atp-hairline-row {
    border-bottom: 1px solid var(--border-hairline);
  }
  .atp-hairline-row:last-child {
    border-bottom: none;
  }

  .touch-btn {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    cursor: pointer;
    user-select: none;
    transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
  }
  .touch-btn:active {
    transform: scale(0.96);
  }

  .font-display {
    font-family: 'Outfit', sans-serif;
    letter-spacing: -0.02em;
  }

  .font-mono-code {
    font-family: 'JetBrains Mono', monospace;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  /* Giro Exclusivo en Eje Vertical (rotateY) para Raqueta 3D */
  @keyframes racketSpinY {
    0% { transform: perspective(800px) rotateY(0deg); }
    50% { transform: perspective(800px) rotateY(180deg); }
    100% { transform: perspective(800px) rotateY(360deg); }
  }
  .racket-3d-spin {
    animation: racketSpinY 8s linear infinite;
    transform-style: preserve-3d;
  }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ============================================================================
// 3. LIBRERÍA DE ICONOS VECTORIALES SVG LIMPIOS (CERO EMOJIS DE TECLADO)
// ============================================================================
export const Icons = {
  Menu: ({ size = 22, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Newspaper: ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
  Bag: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Search: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  Check: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  MapPin: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Trophy: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Calendar: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  Clock: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Lock: ({ size = 15, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  ),
  ArrowRight: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  Star: ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
};

// ============================================================================
// 4. COMPONENTE <SafeImage /> Y <LaurelAvatar /> (ORO #1, PLATA #2, BRONCE #3)
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
          background: "linear-gradient(135deg, #1E293B 0%, #0A1633 100%)",
          color: "#D6FF00",
          fontWeight: 800,
          fontSize: "0.75rem",
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

// Avatar con Ramas de Laurel (Oro #1, Plata #2, Bronce #3) para CADA categoría
export const LaurelAvatar = ({ src, name, rank, size = 42 }) => {
  const medalConfig = useMemo(() => {
    if (rank === 1) {
      return {
        stroke: "#F59E0B",
        fill: "#FDE68A",
        glow: "rgba(245, 158, 11, 0.32)",
        badgeBg: "linear-gradient(135deg, #FDE68A 0%, #D97706 100%)",
        badgeText: "#0A1633",
      };
    }
    if (rank === 2) {
      return {
        stroke: "#CBD5E1",
        fill: "#F1F5F9",
        glow: "rgba(203, 213, 225, 0.25)",
        badgeBg: "linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)",
        badgeText: "#0A1633",
      };
    }
    if (rank === 3) {
      return {
        stroke: "#CD7F32",
        fill: "#FDBA74",
        glow: "rgba(205, 127, 50, 0.28)",
        badgeBg: "linear-gradient(135deg, #FDBA74 0%, #9A3412 100%)",
        badgeText: "#FFFFFF",
      };
    }
    return null;
  }, [rank]);

  const outerSize = size + 14;

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
          {/* Aro interior de medalla */}
          <circle
            cx="32"
            cy="32"
            r="24"
            fill="none"
            stroke={medalConfig.stroke}
            strokeWidth="2.2"
          />
          {/* Rama de Laurel Izquierda */}
          <path
            d="M32 58 C16 56, 6 44, 6 28 C6 17, 13 9, 22 6"
            fill="none"
            stroke={medalConfig.stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse cx="9" cy="38" rx="2.2" ry="4" transform="rotate(-25 9 38)" fill={medalConfig.stroke} />
          <ellipse cx="7" cy="28" rx="2.2" ry="4" transform="rotate(-5 7 28)" fill={medalConfig.stroke} />
          <ellipse cx="10" cy="18" rx="2.2" ry="4" transform="rotate(20 10 18)" fill={medalConfig.stroke} />
          <ellipse cx="16" cy="10" rx="2" ry="3.6" transform="rotate(42 16 10)" fill={medalConfig.stroke} />
          {/* Rama de Laurel Derecha */}
          <path
            d="M32 58 C48 56, 58 44, 58 28 C58 17, 51 9, 42 6"
            fill="none"
            stroke={medalConfig.stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
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
          border: medalConfig
            ? "none"
            : "1.5px solid var(--border-strong)",
        }}
      />
    </div>
  );
};

// ============================================================================
// 5. MAPA COMPLETO DE LOS 42 ARCHIVOS SUBIDOS A GITHUB (public/assets/)
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

// === FIN DEL BLOQUE 1 DE 10 ===

// === INICIO DEL BLOQUE 2 DE 10 ===

// ============================================================================
// 6. ESCALERA PROGRESIVA + CHECKPOINTS MERECIDOS + IDENTIDAD CROMÁTICA
//    5ª P (0–499) · 5ª B (500–1,199) · 5ª A (1,200–1,999)
//    4ª Cat (2,000–3,499 | Checkpoint 4ª Alta: 2,750)
//    3ª Cat (3,500–4,999 | Checkpoint 3ª Élite: 4,250) · 2ª Libre (5,000+)
// ============================================================================
export const CATEGORIES_PROGRESSIVE = [
  {
    id: "5P",
    name: "5ª Principiante",
    short: "5ª P",
    min: 0,
    max: 499,
    floor: 100, // Piso protector: ningún principiante cae por debajo de 100 pts
    seedFloor: 150,
    checkpoint: null,
    checkpointLabel: null,
    color: "#64748B",
    bg: "rgba(100, 116, 139, 0.15)",
    border: "rgba(100, 116, 139, 0.36)",
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
    bg: "rgba(2, 132, 199, 0.15)",
    border: "rgba(2, 132, 199, 0.36)",
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
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.15)",
    border: "rgba(5, 150, 105, 0.36)",
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
    color: "#C85A32", // Terracota Roland Garros / Arcilla
    bg: "rgba(200, 90, 50, 0.15)",
    border: "rgba(200, 90, 50, 0.38)",
  },
  {
    id: "3RA",
    name: "3ª Categoría",
    short: "3ª Cat",
    min: 3500,
    max: 4999,
    floor: 3500,
    seedFloor: 3350, // Tope de encuesta inicial: exige ganar en cancha para pisar 3,500+
    checkpoint: 4250,
    checkpointLabel: "3ª Élite (4,250)",
    color: "#D97706", // Oro Campeón
    bg: "rgba(217, 119, 6, 0.16)",
    border: "rgba(217, 119, 6, 0.40)",
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
    color: "#7E22CE", // Púrpura Grand Slam / ATP Finals
    bg: "rgba(126, 34, 206, 0.16)",
    border: "rgba(126, 34, 206, 0.38)",
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

  // Cálculo hacia el siguiente objetivo (Checkpoint intermedio o siguiente categoría)
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

  // Regla de mérito: el Checkpoint intermedio se consolida si supera el umbral y tiene >= 4 partidos en temporada
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

// Reinicio de Temporada con respeto a Checkpoints Consolidados y Piso Protector
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
// 7. MOTOR MATEMÁTICO ELO: 3 JAULAS FINITAS, MODO DUAL (≤1,000 PTS) Y 7 BLINDAJES
// ============================================================================
export const ELO_CONSTANTS = {
  DIVISOR: 2200,
  K_REGULAR: 300,
  K_CALIBRATION: 480,
  CALIBRATION_MATCHES: 5,
  MAX_OFFICIAL_GAP: 1000, // > 1,000 pts de diferencia pasa automáticamente a Modo Amistoso H2H
  MIN_FLOOR_ELO: 100, // Vacío Legal #5: nadie cae por debajo de 100 pts
  MIN_SEASON_MATCHES_TOP8: 4, // Vacío Legal #4: mínimo 4 partidos oficiales para clasificar al Master Top 8
  WALKOVER_FIXED_DELTA: 25, // Vacío Legal #2: W.O. administrativo sin partido
  RETIREMENT_WIN_FACTOR: 0.75, // Vacío Legal #2: retiro por lesión en cancha paga 75% del techo
  AUTO_CONFIRM_HOURS: 24, // Vacío Legal #1: silencio positivo tras 24h
};

// Auto-escalado demográfico de K si el circuito crece más allá de 150 jugadores
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

// Vacío Legal #6 + Amortiguador Semanal/Mensual de Revanchas entre la misma pareja
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
    if (m.status !== "completed" || m.isFriendly) return;
    const samePair =
      (m.challengerId === playerAId && m.challengedId === playerBId) ||
      (m.challengerId === playerBId && m.challengedId === playerAId);
    if (!samePair) return;

    const ts = m.completedAt || m.createdAt || now;
    if (now - ts <= sevenDaysMs) weeklyCount += 1;
    if (now - ts <= thirtyDaysMs) monthlyCount += 1;
  });

  // A partir del 4.º partido en el mismo mes contra el mismo rival, pasa a Amistoso (0 pts)
  if (monthlyCount >= 3) {
    return {
      weeklyCount,
      monthlyCount,
      multiplier: 0,
      forcedFriendlyByCap: true,
      label: "Tope mensual alcanzado (3/3 oficiales este mes) · Modo Amistoso H2H",
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

// Calculadora Pre-Partido: Techos de Victoria (6-0, 6-0) y Pisos de Derrota (0-6, 0-6) para AMBOS jugadores
export function getPreMatchThresholds(
  playerA,
  playerB,
  options = { forceFriendly: false, completedMatches: [], totalActivePlayers: 130 }
) {
  if (!playerA || !playerB) {
    return {
      isFriendly: false,
      eloGap: 0,
      expectedA: 0.5,
      expectedB: 0.5,
      winCeilingA: 150,
      lossMaxA: -150,
      avgWin2SetsA: 132,
      winCeilingB: 150,
      lossMaxB: -150,
      avgWin2SetsB: 132,
      rematchInfo: { multiplier: 1, forcedFriendlyByCap: false },
    };
  }

  const eloA = Number(playerA.elo || 1000);
  const eloB = Number(playerB.elo || 1000);
  const eloGap = Math.abs(eloA - eloB);

  const rematchInfo = getPairRematchStatus(
    playerA.id,
    playerB.id,
    options.completedMatches || []
  );

  const gapExceedsLimit = eloGap > ELO_CONSTANTS.MAX_OFFICIAL_GAP;
  const isFriendly =
    Boolean(options.forceFriendly) ||
    gapExceedsLimit ||
    rematchInfo.forcedFriendlyByCap;

  let friendlyReason = null;
  if (gapExceedsLimit) {
    friendlyReason = `Diferencia de ${eloGap} pts (> ${ELO_CONSTANTS.MAX_OFFICIAL_GAP} pts) · Duelo Amistoso H2H`;
  } else if (rematchInfo.forcedFriendlyByCap) {
    friendlyReason = rematchInfo.label;
  } else if (options.forceFriendly) {
    friendlyReason = "Duelo Amistoso sin puntos en juego";
  }

  const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / ELO_CONSTANTS.DIVISOR));
  const expectedB = 1 - expectedA;

  if (isFriendly) {
    return {
      isFriendly: true,
      gapExceedsLimit,
      friendlyReason,
      eloGap,
      expectedA,
      expectedB,
      winCeilingA: 0,
      lossMaxA: 0,
      avgWin2SetsA: 0,
      winCeilingB: 0,
      lossMaxB: 0,
      avgWin2SetsB: 0,
      rematchInfo,
    };
  }

  const kA = getEffectiveK(playerA, options.totalActivePlayers || 130);
  const kB = getEffectiveK(playerB, options.totalActivePlayers || 130);
  const mult = rematchInfo.multiplier;

  const winCeilingA = Math.max(18, Math.round(kA * (1 - expectedA) * mult));
  const lossMaxA = -Math.max(15, Math.round(kA * expectedA * mult));
  const avgWin2SetsA = Math.max(15, Math.round(winCeilingA * 0.88));

  const winCeilingB = Math.max(18, Math.round(kB * (1 - expectedB) * mult));
  const lossMaxB = -Math.max(15, Math.round(kB * expectedB * mult));
  const avgWin2SetsB = Math.max(15, Math.round(winCeilingB * 0.88));

  return {
    isFriendly: false,
    gapExceedsLimit: false,
    friendlyReason: null,
    eloGap,
    expectedA,
    expectedB,
    winCeilingA,
    lossMaxA,
    avgWin2SetsA,
    winCeilingB,
    lossMaxB,
    avgWin2SetsB,
    rematchInfo,
  };
}

// ============================================================================
// 8. VALIDADOR OFICIAL ITF/ATP Y LAS 3 JAULAS FINITAS DE MARCADOR
//    - Jaula 1: Set regular (6-0, 6-1, 6-2, 6-3, 6-4, 7-5)
//    - Jaula 2: Tie-Break de set 7-6(x) con las 6 diferencias finitas (2 a 7+ pts)
//    - Jaula 3: Super Tie-Break a 10 pts con las 9 diferencias finitas (2 a 10+ pts)
// ============================================================================
export function evaluateRegularSetDominance(wGames, lGames, tbLoserPts = null) {
  if (wGames === 6 && lGames === 0) return 1.0; // 6-0
  if (wGames === 6 && lGames === 1) return 0.96; // 6-1
  if (wGames === 6 && lGames === 2) return 0.92; // 6-2
  if (wGames === 6 && lGames === 3) return 0.88; // 6-3
  if (wGames === 6 && lGames === 4) return 0.84; // 6-4
  if (wGames === 7 && lGames === 5) return 0.8; // 7-5

  // Jaula 2: Set definido en Tie-Break (7-6) según las 6 diferencias finitas (2 a 7+ pts)
  if (wGames === 7 && lGames === 6) {
    const loserTb = tbLoserPts !== null && tbLoserPts !== "" ? Number(tbLoserPts) : 5;
    const winnerTb = loserTb >= 6 ? loserTb + 2 : 7;
    const tbDiff = Math.min(7, Math.max(2, winnerTb - loserTb));
    // tbDiff = 2 (ej. 7-5 o 8-6) -> 0.76 | tbDiff = 7 (7-0) -> 0.79
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
    specialFinish = "normal", // 'normal' | 'retirement' | 'walkover'
    retiredWinnerSide = "A",
  } = scoreInput || {};

  // Caso Walkover (W.O. sin iniciar o por inasistencia)
  if (specialFinish === "walkover") {
    return {
      valid: true,
      specialFinish: "walkover",
      winnerSide: retiredWinnerSide,
      winnerFactor: 1,
      loserFactor: 1,
      isDoubleBagelOr61: false,
      formattedScore: "W.O. (Inasistencia)",
      setsSummary: "Walkover oficial",
    };
  }

  // Caso Retiro por lesión en cancha
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
      formattedScore: partialText,
      setsSummary: "Retiro por lesión (75% techo)",
    };
  }

  // Validación estricta de un set regular ITF/ATP
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
        error: `Marcador ${a}-${b} inválido en Set ${setNum}. Regla ATP: sets a 6 games (6-0 a 6-4), 7-5 o 7-6 en Tie-Break.`,
      };
    }

    let tbLoser = null;
    let tbWinner = null;
    if (is76) {
      if (tbLoserRaw === "" || tbLoserRaw === null || tbLoserRaw === undefined) {
        tbLoser = 5;
      } else {
        tbLoser = Number(tbLoserRaw);
      }
      if (!Number.isInteger(tbLoser) || tbLoser < 0) {
        return { ok: false, error: `Puntos del Tie-Break en Set ${setNum} inválidos.` };
      }
      tbWinner = tbLoser >= 6 ? tbLoser + 2 : 7;
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
      tbWinner,
      winner,
      dominance,
      label,
    };
  }

  const set1 = validateSingleSet(s1A, s1B, tb1Loser, 1);
  if (!set1.ok) return { valid: false, error: set1.error };

  const set2 = validateSingleSet(s2A, s2B, tb2Loser, 2);
  if (!set2.ok) return { valid: false, error: set2.error };

  // Si un jugador gana 2-0 en sets corridos
  if (set1.winner === set2.winner) {
    const winnerSide = set1.winner;
    // Promedio de las 2 jaulas de sets (rango 0.76 a 1.00)
    const winnerFactor = Number(((set1.dominance + set2.dominance) / 2).toFixed(4));
    // El perdedor en 2 sets resta entre 68% (si forzó doble 6-7) y 100% (si cayó 0-6, 0-6)
    const loserFactor = Number((0.68 + ((winnerFactor - 0.76) / 0.24) * 0.32).toFixed(4));

    const totalLoserGames = set1.minG + set2.minG;
    const isDoubleBagelOr61 = totalLoserGames <= 1; // 6-0, 6-0 o 6-0, 6-1

    return {
      valid: true,
      specialFinish: "normal",
      setsCount: 2,
      winnerSide,
      winnerFactor,
      loserFactor,
      isDoubleBagelOr61,
      formattedScore: `${set1.label}, ${set2.label}`,
      setsSummary: `Victoria en 2 sets (${Math.round(winnerFactor * 100)}% del techo)`,
    };
  }

  // Si empatan 1-1 en sets -> Jaula 3: Super Tie-Break a 10 puntos (diferencia mínima de 2 sin techo)
  if (stbA === "" || stbB === "" || stbA === undefined || stbB === undefined) {
    return {
      valid: false,
      needsStb: true,
      error: "Empate a 1 set por lado: ingresa el marcador del Super Tie-Break (a 10 puntos con diferencia de 2).",
    };
  }

  const aStb = Number(stbA);
  const bStb = Number(stbB);
  if (!Number.isInteger(aStb) || !Number.isInteger(bStb) || aStb < 0 || bStb < 0) {
    return { valid: false, error: "El Super Tie-Break debe contener números enteros." };
  }

  const maxStb = Math.max(aStb, bStb);
  const minStb = Math.min(aStb, bStb);
  const diffStb = maxStb - minStb;

  const validStb =
    (maxStb === 10 && minStb <= 8) || (maxStb > 10 && diffStb === 2);

  if (!validStb) {
    return {
      valid: false,
      error: `Super Tie-Break ${aStb}-${bStb} inválido. Se gana con 10 puntos (10-0 a 10-8) o diferencia exacta de 2 si pasan de 9-9 (ej. 11-9, 14-12).`,
    };
  }

  const winnerSide = aStb > bStb ? "A" : "B";
  // Jaula 3: Las 9 diferencias finitas del Super Tie-Break (2 a 10 pts)
  const clampedDiff = Math.min(10, Math.max(2, diffStb));
  // Victoria en 3 sets paga entre 70% (10-8) y 75% (10-0) del techo
  const winnerFactor = Number((0.7 + ((clampedDiff - 2) / 8) * 0.05).toFixed(4));
  // Derrota luchando en 3 sets protege al perdedor: solo resta entre 38% (perdió 8-10) y 50% (perdió 0-10)
  const loserFactor = Number((0.38 + ((clampedDiff - 2) / 8) * 0.12).toFixed(4));

  return {
    valid: true,
    specialFinish: "normal",
    setsCount: 3,
    winnerSide,
    winnerFactor,
    loserFactor,
    isDoubleBagelOr61: false,
    formattedScore: `${set1.label}, ${set2.label}, [${aStb}-${bStb}]`,
    setsSummary: `Definición en 3er Set Super TB (${Math.round(winnerFactor * 100)}% cobrado · Perdedor protegido al ${Math.round(loserFactor * 100)}%)`,
  };
}

// Liquidación Completa de Puntos post-partido con Recibo Transparente de 3 Líneas
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
      receiptWinner: {
        ceiling: 0,
        factorPct: 0,
        calibrationNote: null,
        finalDelta: 0,
      },
      receiptLoser: {
        floor: 0,
        factorPct: 0,
        calibrationNote: null,
        finalDelta: 0,
      },
    };
  }

  // Caso Walkover administrativo (+25 / -25 fijos)
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
      receiptWinner: {
        ceiling: ELO_CONSTANTS.WALKOVER_FIXED_DELTA,
        factorPct: 100,
        calibrationNote: "Walkover reglamentario (+25 pts)",
        finalDelta: ELO_CONSTANTS.WALKOVER_FIXED_DELTA,
      },
      receiptLoser: {
        floor: -ELO_CONSTANTS.WALKOVER_FIXED_DELTA,
        factorPct: 100,
        calibrationNote: "Penalización por inasistencia (-25 pts)",
        finalDelta: -ELO_CONSTANTS.WALKOVER_FIXED_DELTA,
      },
    };
  }

  const aWon = scoreEvaluation.winnerSide === "A";
  const winnerPlayer = aWon ? playerA : playerB;
  const loserPlayer = aWon ? playerB : playerA;

  const winnerCeiling = aWon ? pre.winCeilingA : pre.winCeilingB;
  const loserMaxDrop = aWon ? pre.lossMaxB : pre.lossMaxA; // negativo

  let winnerGain = Math.round(winnerCeiling * scoreEvaluation.winnerFactor);
  let loserDrop = Math.round(loserMaxDrop * scoreEvaluation.loserFactor); // negativo

  let winnerCalibNote = null;
  let loserCalibNote = null;

  // Vacío Legal #3: Detector de Tiburones (1.35x subida si barre 6-0, 6-0 en calibración)
  // y Castigo Anti-Ego (1.25x bajada si pierde 0-6, 0-6 en calibración)
  if (scoreEvaluation.isDoubleBagelOr61) {
    if ((winnerPlayer.calibrationMatches ?? 5) < ELO_CONSTANTS.CALIBRATION_MATCHES) {
      winnerGain = Math.round(winnerGain * 1.35);
      winnerCalibNote = "Ascenso acelerado en calibración (1.35x por dominio 6-0)";
    }
    if ((loserPlayer.calibrationMatches ?? 5) < ELO_CONSTANTS.CALIBRATION_MATCHES) {
      loserDrop = Math.round(loserDrop * 1.25);
      loserCalibNote = "Ajuste de nivel en calibración (1.25x)";
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
    winnerSide: scoreEvaluation.winnerSide,
    deltaA: aWon ? actualWinnerDelta : actualLoserDelta,
    deltaB: aWon ? actualLoserDelta : actualWinnerDelta,
    newEloA: aWon ? rawNewWinnerElo : rawNewLoserElo,
    newEloB: aWon ? rawNewLoserElo : rawNewWinnerElo,
    receiptWinner: {
      ceiling: winnerCeiling,
      factorPct: Math.round(scoreEvaluation.winnerFactor * 100),
      calibrationNote: winnerCalibNote,
      finalDelta: actualWinnerDelta,
    },
    receiptLoser: {
      floor: loserMaxDrop,
      factorPct: Math.round(scoreEvaluation.loserFactor * 100),
      calibrationNote: loserCalibNote,
      finalDelta: actualLoserDelta,
    },
  };
}

// === FIN DEL BLOQUE 2 DE 10 ===

// === INICIO DEL BLOQUE 3 DE 10 ===

// ============================================================================
// 9. SEDES OFICIALES DE HUANCAYO (ARCILLA, COORDENADAS GPS GOOGLE MAPS Y VIP)
// ============================================================================
export const SURFACE_WEATHER_STATES = [
  {
    id: "seco",
    label: "Cancha Seca · Óptima",
    shortLabel: "Seca · Óptima",
    indicator: "Pique rápido y tracción completa en polvo de ladrillo.",
    icon: ASSETS.climaSeco,
    color: "#10B981",
  },
  {
    id: "humedad",
    label: "Humedad Leve · Jugable",
    shortLabel: "Humedad Leve",
    indicator: "Arcilla asentada con bote medio, ideal para intercambios largos.",
    icon: ASSETS.climaHumedad,
    color: "#00A3FF",
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
    color: "#EF4444",
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
    priceInfo: "S/ 35 / hora · S/ 15 socio",
    shield: ASSETS.clubCountry,
    bannerImage:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80",
    vipHeadline: "15% Dcto. en alquiler de cancha (Lun–Vie 08:00 a 16:00)",
    vipBenefitsList: [
      "15% de descuento directo en alquiler de cancha en horario valle (Lunes a Viernes)",
      "Reserva anticipada de turnos nocturnos para partidos del Ranking",
      "Tarifa preferencial en tubo de pelotas presurizadas en recepción",
    ],
    facilities: [
      { title: "4 Canchas de Arcilla", detail: "Mantenimiento diario de polvo de ladrillo y flejes" },
      { title: "Iluminación LED Nocturna", detail: "Habilitada hasta las 22:00 h para retos y torneos" },
      { title: "Cafetería y Terraza Social", detail: "Vista directa a las canchas principales e hidratación" },
      { title: "Estacionamiento Privado", detail: "Ingreso vigilado para jugadores del circuito" },
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
    priceInfo: "S/ 30 / hora",
    shield: ASSETS.clubCutipa,
    bannerImage:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=80",
    vipHeadline: "20% Dcto. en alquiler de cancha y clínicas técnicas",
    vipBenefitsList: [
      "20% de descuento presentando tu Carnet Digital Socio VIP",
      "S/ 15 de descuento en encordado electrónico de precisión",
      "Acceso a canasto de pelotas en sesiones de entrenamiento",
    ],
    facilities: [
      { title: "3 Canchas de Arcilla (1 Semi-Techada)", detail: "Protección ideal ante lloviznas ligeras" },
      { title: "Taller de Encordado Electrónico", detail: "Servicio en sede con tensiómetro digital" },
      { title: "Reflectores de Alto Contraste", detail: "Juego nocturno nítido hasta las 22:00 h" },
      { title: "Zona de Hidratación y Pro Shop", detail: "Bebidas isotónicas, overgrips y antivibradores" },
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
    priceInfo: "S/ 30 / hora",
    shield: ASSETS.clubTauro,
    bannerImage:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80",
    vipHeadline: "15% Dcto. en turnos de mañana y tarde",
    vipBenefitsList: [
      "15% de descuento en alquiler de cancha de 07:00 a 17:00 h",
      "Coordinación de boleador / pasabolas sin recargo de gestión",
      "Prioridad de reserva para partidos de desempate del circuito",
    ],
    facilities: [
      { title: "2 Canchas de Arcilla Compactada", detail: "Excelente drenaje tras lluvias de estación" },
      { title: "Iluminación Nocturna", detail: "Turnos disponibles hasta las 21:30 h" },
      { title: "Estacionamiento Interno", detail: "Amplio espacio vehicular dentro del complejo" },
      { title: "Camerinos y Duchas", detail: "Vestuarios completos para socios y retadores" },
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
    priceInfo: "S/ 28 / hora",
    shield: ASSETS.clubInkas,
    bannerImage:
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1000&q=80",
    vipHeadline: "S/ 10 de descuento directo en retos oficiales del circuito",
    vipBenefitsList: [
      "S/ 10 de descuento por partido oficial agendado desde MATCHPOINT",
      "15 minutos adicionales de calentamiento sin costo según disponibilidad",
      "Hidratación de cortesía en torneos relámpago de fin de semana",
    ],
    facilities: [
      { title: "2 Canchas de Arcilla Abierta", detail: "Orientación norte-sur para evitar sol de frente" },
      { title: "Reflectores LED", detail: "Habilitados para duelos nocturnos" },
      { title: "Pérgola de Descanso", detail: "Zona techada junto a cancha para espectadores" },
      { title: "Venta de Accesorios Básicos", detail: "Overgrips, muñequeras y agua mineral" },
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
// 10. SELECTORES TÁCTILES DE PERFIL (MANO, MEJOR GOLPE, DÍAS Y FRANJAS HORARIAS)
// ============================================================================
export const HAND_OPTIONS = ["Diestro", "Zurdo"];

export const BEST_SHOT_OPTIONS = [
  "Derecha (Forehand)",
  "Revés a 2 Manos",
  "Revés a 1 Mano",
  "1er Saque",
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
// 11. CUESTIONARIO TÉCNICO INICIAL 1 POR 1 (EXCLUSIVO AL CREAR CUENTA NUEVA)
//     Semilla en el piso exacto de cada categoría con tope máximo en 3,350 pts
// ============================================================================
export const CALIBRATION_QUESTIONS_1X1 = [
  {
    id: "q_spin",
    step: 1,
    title: "Dominio de Efectos (Plano, Topspin y Slice)",
    subtitle: "¿Qué control tienes sobre los efectos con tu derecha y revés?",
    options: [
      {
        label: "Estoy empezando: paso la pelota plana buscando que entre en cancha",
        points: 0,
      },
      {
        label: "Golpeo plano con dirección básica y uso el slice para defenderme",
        points: 1,
      },
      {
        label: "Pego con topspin natural para dar margen sobre la red y corto con slice",
        points: 2,
      },
      {
        label: "Domino topspin pesado al fondo, slice bajo agresivo y drop shots",
        points: 3,
      },
    ],
  },
  {
    id: "q_serve",
    step: 2,
    title: "Consistencia de Primer y Segundo Saque",
    subtitle: "En un partido por puntos, ¿cómo responde tu servicio?",
    options: [
      {
        label: "Me cuesta coordinar el lanzamiento o cometo varias dobles faltas",
        points: 0,
      },
      {
        label: "Pongo el saque en juego con seguridad pero sin mucha velocidad",
        points: 1,
      },
      {
        label: "Tengo un 1er saque fuerte y un 2do saque seguro con efecto (slice/kick)",
        points: 2,
      },
      {
        label: "Busco ángulos abiertos o a la T en el 1ro y mi 2do saque con kick ataca",
        points: 3,
      },
    ],
  },
  {
    id: "q_rally",
    step: 3,
    title: "Ritmo de Peloteo desde el Fondo en Arcilla",
    subtitle: "¿Cuántas pelotas seguidas mantienes a buena velocidad sin fallar?",
    options: [
      {
        label: "Entre 2 y 4 golpes antes de dejarla en la red o tirarla larga",
        points: 0,
      },
      {
        label: "Mantengo peloteos de 6 a 8 golpes a ritmo moderado por el centro",
        points: 1,
      },
      {
        label: "Sostengo más de 10 golpes abriendo ángulos y cambiando direcciones",
        points: 2,
      },
      {
        label: "Sostengo peloteos intensos y defino cuando queda corta en media cancha",
        points: 3,
      },
    ],
  },
  {
    id: "q_net",
    step: 4,
    title: "Juego en la Red, Volea y Smash",
    subtitle: "Cuando el punto te lleva hacia adelante:",
    options: [
      {
        label: "Prefiero quedarme siempre en la línea de fondo",
        points: 0,
      },
      {
        label: "Subo solo si la pelota queda muy fácil cerca de la red",
        points: 1,
      },
      {
        label: "Cierro bien en la red con voleas firmes y aseguro el smash",
        points: 2,
      },
      {
        label: "Subo con tiro de aproximación (approach) y defino voleas con ángulo",
        points: 3,
      },
    ],
  },
  {
    id: "q_experience",
    step: 5,
    title: "Experiencia en Partidos y Torneos de Club",
    subtitle: "¿Cuál ha sido tu recorrido competitivo hasta hoy?",
    options: [
      {
        label: "Recién empiezo a jugar partidos con marcador oficial",
        points: 0,
      },
      {
        label: "Juego partidos entre amigos o en 5ª categoría de club",
        points: 1,
      },
      {
        label: "Compito regularmente en 5ª Avanzada o 4ª Categoría con buen nivel",
        points: 2,
      },
      {
        label: "He competido en 4ª Alta o 3ª Categoría en torneos de Huancayo/región",
        points: 3,
      },
    ],
  },
];

// Convierte el puntaje del test (0 a 15) al piso exacto de su categoría inicial (tope 3,350)
export function computeInitialSeedFromAnswers(answersArray = []) {
  const totalScore = answersArray.reduce((acc, v) => acc + Number(v || 0), 0);
  if (totalScore <= 3) {
    return { seedElo: 150, categoryId: "5P", recommendCoach: true };
  }
  if (totalScore <= 6) {
    return { seedElo: 500, categoryId: "5B", recommendCoach: false };
  }
  if (totalScore <= 9) {
    return { seedElo: 1200, categoryId: "5A", recommendCoach: false };
  }
  if (totalScore <= 12) {
    return { seedElo: 2000, categoryId: "4TA", recommendCoach: false };
  }
  // Puntaje 13 a 15 -> Tope Anti-Ego en 3,350 pts (4ª Alta al borde de 3ª; debe ganar en cancha para entrar a 3,500)
  return { seedElo: 3350, categoryId: "4TA", recommendCoach: false };
}

// ============================================================================
// 12. LOS 10 PERFILES REALES DE HUANCAYO (PABLO LIMPIO + MATEO RETRATO MASCULINO)
// ============================================================================
export const INITIAL_PLAYERS = [
  {
    id: "p_mateo",
    name: "Mateo Samaniego",
    email: "mateo@matchpoint.pe",
    phone: "964112233",
    password: "123",
    age: 29,
    clubId: "country",
    elo: 4320, // 3ª Categoría Élite (Checkpoint 4,250 consolidado)
    previousRank: 1,
    lastDelta: 118,
    wins: 16,
    losses: 3,
    seasonMatches: 19,
    streak: 4,
    calibrationMatches: 5,
    hand: "Diestro",
    bestShot: "Derecha (Forehand)",
    secondaryShot: "1er Saque",
    availableDays: ["M", "J", "S", "D"],
    availableSlots: ["18:00–22:00", "07:00–12:00"],
    whatsappPrivate: false,
    isVipMember: true,
    vipCode: "MP-2026-0101",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_alejandro",
    name: "Alejandro Tovar",
    email: "alejandro@matchpoint.pe",
    phone: "988445566",
    password: "123",
    age: 32,
    clubId: "tauro",
    elo: 3790, // 3ª Categoría Base
    previousRank: 2,
    lastDelta: 96,
    wins: 14,
    losses: 4,
    seasonMatches: 18,
    streak: 2,
    calibrationMatches: 5,
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
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_jose",
    name: "José Clariana",
    email: "jose@matchpoint.pe",
    phone: "954223344",
    password: "123",
    age: 31,
    clubId: "country",
    elo: 3360, // 4ª Categoría Alta (Checkpoint 2,750 consolidado)
    previousRank: 3,
    lastDelta: -74,
    wins: 11,
    losses: 4,
    seasonMatches: 15,
    streak: 0,
    calibrationMatches: 5,
    hand: "Diestro",
    bestShot: "Slice / Drop Shot",
    secondaryShot: "1er Saque",
    availableDays: ["M", "J", "V", "S", "D"],
    availableSlots: ["12:00–18:00", "18:00–22:00"],
    whatsappPrivate: false,
    isVipMember: true,
    vipCode: "MP-2026-0103",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_pablo",
    name: "Pablo",
    email: "pablo@matchpoint.pe",
    phone: "966778899",
    password: "123",
    age: 26,
    clubId: "country",
    elo: 3080, // 4ª Categoría Alta (Checkpoint 2,750 consolidado)
    previousRank: 5,
    lastDelta: 132,
    wins: 6,
    losses: 3,
    seasonMatches: 9,
    streak: 3,
    calibrationMatches: 5,
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
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_kenji",
    name: "Kenji Takahashi",
    email: "kenji@matchpoint.pe",
    phone: "999334455",
    password: "123",
    age: 27,
    clubId: "cutipa",
    elo: 2890, // 4ª Categoría Alta
    previousRank: 4,
    lastDelta: -88,
    wins: 9,
    losses: 5,
    seasonMatches: 14,
    streak: 0,
    calibrationMatches: 5,
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
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_valeria",
    name: "Valeria Montes",
    email: "valeria@matchpoint.pe",
    phone: "944889900",
    password: "123",
    age: 25,
    clubId: "cutipa",
    elo: 2340, // 4ª Categoría Base
    previousRank: 6,
    lastDelta: 112,
    wins: 8,
    losses: 4,
    seasonMatches: 12,
    streak: 2,
    calibrationMatches: 5,
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
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_sebastian",
    name: "Sebastián Rojas",
    email: "sebastian@matchpoint.pe",
    phone: "977556677",
    password: "123",
    age: 30,
    clubId: "inkas",
    elo: 1720, // 5ª Avanzada
    previousRank: 7,
    lastDelta: 94,
    wins: 7,
    losses: 3,
    seasonMatches: 10,
    streak: 3,
    calibrationMatches: 5,
    hand: "Diestro",
    bestShot: "1er Saque",
    secondaryShot: "Volea y Red",
    availableDays: ["V", "S", "D"],
    availableSlots: ["07:00–12:00", "12:00–18:00"],
    whatsappPrivate: false,
    isVipMember: false,
    vipCode: "MP-2026-0107",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_camila",
    name: "Camila Solís",
    email: "camila@matchpoint.pe",
    phone: "955778899",
    password: "123",
    age: 24,
    clubId: "country",
    elo: 1380, // 5ª Avanzada (En Calibración 4/5)
    previousRank: 8,
    lastDelta: 156,
    wins: 3,
    losses: 1,
    seasonMatches: 4,
    streak: 2,
    calibrationMatches: 4,
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
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_diego",
    name: "Diego Paredes",
    email: "diego@matchpoint.pe",
    phone: "933990011",
    password: "123",
    age: 28,
    clubId: "tauro",
    elo: 840, // 5ª Básica
    previousRank: 9,
    lastDelta: 82,
    wins: 4,
    losses: 4,
    seasonMatches: 8,
    streak: 1,
    calibrationMatches: 5,
    hand: "Diestro",
    bestShot: "Derecha (Forehand)",
    secondaryShot: "1er Saque",
    availableDays: ["M", "J", "S"],
    availableSlots: ["18:00–22:00"],
    whatsappPrivate: false,
    isVipMember: false,
    vipCode: "MP-2026-0109",
    lookingForMatchToday: false,
    activeStatus: "active",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_lucas",
    name: "Lucas Mendoza",
    email: "lucas@matchpoint.pe",
    phone: "922001122",
    password: "123",
    age: 22,
    clubId: "individual",
    elo: 320, // 5ª Principiante (En Calibración 2/5)
    previousRank: 10,
    lastDelta: 110,
    wins: 1,
    losses: 1,
    seasonMatches: 2,
    streak: 1,
    calibrationMatches: 2,
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
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80",
  },
];

// ============================================================================
// 13. PARTIDOS VERIFICADOS (HISTORIAL H2H) Y DESAFÍOS ACTIVOS EN CARTELERA
// ============================================================================
export const INITIAL_COMPLETED_MATCHES = [
  {
    id: "hist_1",
    challengerId: "p_pablo",
    challengedId: "p_kenji",
    winnerId: "p_pablo",
    loserId: "p_kenji",
    score: "6-4, 6-3",
    clubId: "cutipa",
    clubName: "Academia Romina Cutipa",
    dateLabel: "13 Nov 2026 · 19:00",
    completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    winnerDelta: 132,
    loserDelta: -88,
    isFriendly: false,
  },
  {
    id: "hist_2",
    challengerId: "p_jose",
    challengedId: "p_pablo",
    winnerId: "p_pablo",
    loserId: "p_jose",
    score: "7-6(5), 6-4",
    clubId: "country",
    clubName: "Country Club Los Huancas",
    dateLabel: "09 Nov 2026 · 18:00",
    completedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    winnerDelta: 144,
    loserDelta: -74,
    isFriendly: false,
  },
  {
    id: "hist_3",
    challengerId: "p_pablo",
    challengedId: "p_jose",
    winnerId: "p_jose",
    loserId: "p_pablo",
    score: "6-3, 4-6, [10-7]",
    clubId: "country",
    clubName: "Country Club Los Huancas",
    dateLabel: "28 Oct 2026 · 20:00",
    completedAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
    winnerDelta: 98,
    loserDelta: -54,
    isFriendly: false,
  },
  {
    id: "hist_4",
    challengerId: "p_mateo",
    challengedId: "p_alejandro",
    winnerId: "p_mateo",
    loserId: "p_alejandro",
    score: "6-4, 7-5",
    clubId: "country",
    clubName: "Country Club Los Huancas",
    dateLabel: "12 Nov 2026 · 20:00",
    completedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    winnerDelta: 118,
    loserDelta: -92,
    isFriendly: false,
  },
  {
    id: "hist_5",
    challengerId: "p_valeria",
    challengedId: "p_kenji",
    winnerId: "p_valeria",
    loserId: "p_kenji",
    score: "6-4, 3-6, [10-8]",
    clubId: "cutipa",
    clubName: "Academia Romina Cutipa",
    dateLabel: "10 Nov 2026 · 17:00",
    completedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    winnerDelta: 112,
    loserDelta: -62,
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
    status: "live", // Partido en juego ahora en Cartelera
    isFriendly: false,
    refereeName: "Rodrigo Villavicencio",
    refereeUpdatedAt: "Hace 1 min",
    proposedScore: null,
    liveScore: {
      currentSet: 2,
      s1A: 6,
      s1B: 4,
      tb1A: 0,
      tb1B: 0,
      set1Locked: true,
      s2A: 5,
      s2B: 4,
      tb2A: 0,
      tb2B: 0,
      set2Locked: false,
      stbA: 0,
      stbB: 0,
      serverSide: "A",
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
    status: "pending", // Reto entrante pendiente de aceptar una única vez (guardado en localStorage)
    isFriendly: false,
    proposedScore: null,
    liveScore: null,
  },
  {
    id: "ch_confirmed_pablo",
    challengerId: "p_pablo",
    challengedId: "p_kenji",
    clubId: "cutipa",
    customClubName: "Academia Romina Cutipa",
    dateTimeLabel: "15 Nov 2026 · 19:30",
    ballAgreement: "Retador lleva tarro nuevo",
    status: "confirmed", // Duelo confirmado listo para jugar o subir marcador
    isFriendly: false,
    proposedScore: null,
    liveScore: null,
  },
];

// === FIN DEL BLOQUE 3 DE 10 ===

// === INICIO DEL BLOQUE 4 DE 10 ===

// ============================================================================
// 14. MARKETPLACE COACH PRO B2B (PIN PRIVADO INDIVIDUAL POR ENTRENADOR)
// ============================================================================
export const INITIAL_COACHES = [
  {
    id: "coach_rodrigo",
    name: "Prof. Rodrigo Villavicencio",
    PrivatePin: "7101", // PIN individual exclusivo para Rodrigo
    clubId: "country",
    clubName: "Country Club Los Huancas",
    title: "Entrenador Principal · Nivel Competitivo",
    specialty: "Saque, Derecha yCierre en Red · Arcilla",
    rating: "5.0",
    reviewsCount: 28,
    studentsPromoted: 19,
    pricePerHour: 50,
    priceLabel: "Desde S/ 50",
    unitLabel: "por turno",
    phone: "51964112233",
    avatar:
      "https://images.unsplash.com/photo-1534368420009-621bfab424a8?auto=format&fit=crop&w=500&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80",
    videoVertical: ASSETS.videoCoachRodrigo,
    videoHorizontal: ASSETS.videoCircuitoH1,
    bio: "Preparación práctica en cancha de arcilla enfocada en regularidad de fondo, dirección de primer saque y cierre de partidos oficiales del circuito.",
    packages: [
      {
        id: "pack_rod_1",
        name: "Sesión Individual en Cancha (1 Hora)",
        badge: "CLASE PERSONALIZADA",
        description: "Corrección de golpes de fondo, saque y peloteo intensivo con canasto.",
        price: 50,
        vipPrice: 45,
      },
      {
        id: "pack_rod_4",
        name: "Pack Mensual 4 Sesiones + Sparring",
        badge: "AHORRAS S/ 20 · INCLUYE DIAGNÓSTICO ELO",
        description: "4 clases técnicas de 1 hora + partido de evaluación táctica en arcilla.",
        price: 180,
        vipPrice: 165,
      },
      {
        id: "pack_rod_duo",
        name: "Entrenamiento Dúo (2 Jugadores · 4 Sesiones)",
        badge: "IDEAL RIVALES DE CATEGORÍA",
        description: "Peloteo cruzado, puntos dirigidos y tie-breaks bajo presión.",
        price: 260,
        vipPrice: 240,
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
        author: "Pablo",
        category: "4ª Categoría",
        rating: 5,
        date: "10 Nov 2026",
        comment: "Con 4 sesiones corregí el lanzamiento del primer saque y subí más de 250 puntos en la tabla.",
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
    PrivatePin: "7202", // PIN individual exclusivo para Romina
    clubId: "cutipa",
    clubName: "Academia Romina Cutipa",
    title: "Directora de Academia · Formación y Ascenso",
    specialty: "Consistencia de Fondo y Revés a 2 Manos",
    rating: "5.0",
    reviewsCount: 34,
    studentsPromoted: 24,
    pricePerHour: 50,
    priceLabel: "Desde S/ 50",
    unitLabel: "por turno",
    phone: "51999334455",
    avatar:
      "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=500&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=80",
    videoVertical: ASSETS.videoCoachRomina,
    videoHorizontal: ASSETS.videoCoachH2,
    bio: "Especialista en llevar tenistas desde 5ª Principiante y 5ª Básica hacia categorías competitivas con técnica limpia y desplazamientos en arcilla.",
    packages: [
      {
        id: "pack_rom_1",
        name: "Clase Técnica Individual (1 Hora)",
        badge: "TODOS LOS NIVELES",
        description: "Trabajo específico de empuñaduras, apoyos en arcilla y control de dirección.",
        price: 50,
        vipPrice: 45,
      },
      {
        id: "pack_rom_4",
        name: "Programa Ascenso de Categoría (4 Sesiones)",
        badge: "AHORRAS S/ 20 · INCLUYE DIAGNÓSTICO ELO",
        description: "4 sesiones estructuradas + preparación de saques y devoluciones.",
        price: 180,
        vipPrice: 165,
      },
      {
        id: "pack_rom_8",
        name: "Plan Intensivo Temporada (8 Sesiones)",
        badge: "MÁXIMO PROGRESO",
        description: "2 entrenamientos por semana con seguimiento de partidos del ranking.",
        price: 340,
        vipPrice: 310,
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
        comment: "Muy puntual, cancha impecable y ejercicios dinámicos desde el primer minuto.",
      },
    ],
  },
  {
    id: "coach_carlos",
    name: "Prof. Carlos Méndez",
    PrivatePin: "7303", // PIN individual exclusivo para Carlos
    clubId: "tauro",
    clubName: "Club Tauro Tenis",
    title: "Entrenador de Partido y Sparring Pro",
    specialty: "Efecto Topspin, Slice Defensivo y Tie-Breaks",
    rating: "4.9",
    reviewsCount: 19,
    studentsPromoted: 14,
    pricePerHour: 45,
    priceLabel: "Desde S/ 45",
    unitLabel: "por turno",
    phone: "51954223344",
    avatar:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=500&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80",
    videoVertical: ASSETS.videoCoachDemo3,
    videoHorizontal: ASSETS.videoCircuitoH3,
    bio: "Entrenamiento de alta intensidad para jugadores que buscan sostener peloteos largos sin cometer errores no forzados.",
    packages: [
      {
        id: "pack_car_1",
        name: "Sesión de Sparring + Corrección (1 Hora)",
        badge: "RITMO DE PARTIDO",
        description: "Peloteo exigente y simulación de sets cortos con correcciones tácticas.",
        price: 45,
        vipPrice: 40,
      },
      {
        id: "pack_car_4",
        name: "Pack 4 Sesiones de Fondo y Saque",
        badge: "AHORRAS S/ 20 · INCLUYE DIAGNÓSTICO ELO",
        description: "Consistencia profunda con topspin y seguridad en el segundo saque.",
        price: 160,
        vipPrice: 145,
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
        comment: "Ideal para agarrar ritmo fuerte de bola antes de jugar un torneo de fin de semana.",
      },
    ],
  },
];

// ============================================================================
// 15. TORNEOS POR CATEGORÍAS (CON PAGO YAPE/PLIN, PELOTAS Y ÁRBOL DE LLAVES)
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

export const INITIAL_TOURNAMENTS = [
  {
    id: "tourn_4ta_country",
    title: "Abierto Los Huancas · 4ª Categoría",
    categoryId: "4TA",
    categoryLabel: "4ª Categoría",
    clubId: "country",
    clubName: "Country Club Los Huancas",
    surface: "Arcilla",
    dateRange: "21 – 23 Nov 2026",
    entryFee: 45,
    includesBalls: true,
    ballsLabel: "Incluye pelotas nuevas en cada ronda",
    formatLabel: "Cuadro Eliminatorio + Ronda Consuelo",
    prizeLabel: "Trofeo Oficial + +250 Pts Bonus Campeón + Pack Pro Shop",
    maxPlayers: 8,
    bannerImage:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80",
    enrolledPlayerIds: ["p_jose", "p_pablo", "p_kenji", "p_valeria"],
    pendingApplicantIds: [], // Jugadores que enviaron pago y esperan aprobación del Admin
    bracket: {
      quarters: [
        {
          id: "qf_1",
          roundLabel: "Semifinal Directa / Llave 1",
          playerAId: "p_jose",
          playerBId: "p_valeria",
          score: "6-4, 6-3",
          winnerId: "p_jose",
          loserId: "p_valeria",
        },
        {
          id: "qf_2",
          roundLabel: "Semifinal Directa / Llave 2",
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
    categoryId: "5A",
    categoryLabel: "5ª Avanzada & Básica",
    clubId: "cutipa",
    clubName: "Academia Romina Cutipa",
    surface: "Arcilla",
    dateRange: "28 – 30 Nov 2026",
    entryFee: 40,
    includesBalls: true,
    ballsLabel: "Incluye pelotas nuevas en cada partido",
    formatLabel: "Eliminación Directa + Ronda Consuelo Garantizada",
    prizeLabel: "Trofeo Oficial + Ascenso Directo + Encordado Pro",
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
    title: "Master Valle del Mantaro · 3ª Categoría",
    categoryId: "3RA",
    categoryLabel: "3ª Categoría",
    clubId: "tauro",
    clubName: "Club Tauro Tenis",
    surface: "Arcilla",
    dateRange: "05 – 07 Dic 2026",
    entryFee: 50,
    includesBalls: true,
    ballsLabel: "Incluye pelotas nuevas + Hidratación en cancha",
    formatLabel: "Cuadro Principal + Consuelo",
    prizeLabel: "Copa Master + Premio Efectivo / Equipamiento",
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

// Salón de la Fama (Integrado dentro de Torneos — Campeones de Ediciones Previas)
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
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
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
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
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
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
];

// ============================================================================
// 16. CATÁLOGO PRO SHOP (ESTILO TENNIS-POINT / TENNISPRO · PRECIO SOCIO VIP)
// ============================================================================
export const PRO_SHOP_ITEMS = [
  {
    id: "shop_1",
    name: "Servicio de Encordado Electrónico Pro",
    category: "Taller & Cuerdas",
    regularPrice: 45,
    vipPrice: 35,
    badge: "ENTREGA EN 24H",
    image: ASSETS.proshopRollo,
    specs: "Monofilamento poliéster co-poly o multifilamento a la tensión exacta en libras.",
  },
  {
    id: "shop_2",
    name: "Tubo Presurizado x3 Pelotas All-Court / Clay",
    category: "Pelotas Oficiales",
    regularPrice: 32,
    vipPrice: 26,
    badge: "OFICIAL RETO",
    image: ASSETS.pelotaClasica,
    specs: "Fieltro tejido de alta visibilidad optimizado para canchas de polvo de ladrillo en altura.",
  },
  {
    id: "shop_3",
    name: "Pack x3 Overgrips Adherentes Dry-Tacky",
    category: "Accesorios",
    regularPrice: 25,
    vipPrice: 20,
    badge: "ALTO AGARRE",
    image: ASSETS.raquetaProDark,
    specs: "Absorción superior de sudor y tacto firme de 0.6 mm de espesor.",
  },
  {
    id: "shop_4",
    name: "Bono de 2 Horas Cancha + Canasto de Pelotas",
    category: "Entrenamiento",
    regularPrice: 65,
    vipPrice: 50,
    badge: "EXCLUSIVO SEDES",
    image: ASSETS.goldenTicket,
    specs: "Válido en horario valle previa coordinación en sedes aliadas de Huancayo.",
  },
];

// ============================================================================
// 17. NOTICIERO DE TENIS Y MARCADORES ATP/WTA (SOLO EN MODAL DEL HEADER)
//     Extractor de foto real desde HTML RSS (Prohibido usar dibujos internos)
// ============================================================================
export const ATP_WTA_LIVE_TICKER = [
  {
    id: "atp_1",
    tour: "ATP FINALS · TURÍN",
    status: "FINAL",
    player1: "J. Sinner",
    player2: "T. Fritz",
    score: "6-4, 6-4",
    url: "https://www.atptour.com/en/scores/current",
  },
  {
    id: "atp_2",
    tour: "ATP FINALS · TURÍN",
    status: "FINAL",
    player1: "C. Alcaraz",
    player2: "A. Rublev",
    score: "6-3, 7-6(8)",
    url: "https://www.atptour.com/en/scores/current",
  },
  {
    id: "atp_3",
    tour: "ATP FINALS · TURÍN",
    status: "FINAL",
    player1: "A. Zverev",
    player2: "C. Ruud",
    score: "7-6(3), 6-3",
    url: "https://www.atptour.com/en/scores/current",
  },
];

export const FALLBACK_EDITORIAL_NEWS = [
  {
    id: "news_1",
    source: "Punto de Break",
    title: "Sinner y Alcaraz marcan el ritmo de la temporada en el cierre del calendario ATP",
    publishedAt: "Hace 2 horas",
    link: "https://www.puntodebreak.com/",
    imageUrl:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "news_2",
    source: "ATP Tour",
    title: "Así queda la lucha por el Top 10 del PIF ATP Rankings tras la gira europea",
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

// Extrae únicamente fotografías reales <img src="https://..."> del artículo RSS
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
  return null; // Si no hay foto de agencia, se renderiza tarjeta tipográfica limpia de prensa
}

// === FIN DEL BLOQUE 4 DE 10 ===

// === INICIO DEL BLOQUE 5 DE 10 ===

// ============================================================================
// 18. CARNET DIGITAL VIP METÁLICO 3D (PROPORCIÓN 1.58:1 · GRABADO LÁSER PISTA)
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
  const memberCode = player.vipCode || `MP-2026-0${100 + Number(String(player.id).length)}`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl select-none transition-transform duration-300"
      style={{
        aspectRatio: compact ? "1.75 / 1" : "1.586 / 1",
        background: isVip
          ? "linear-gradient(135deg, #271E0A 0%, #0E1525 48%, #3B2B0B 100%)"
          : "linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #090F1D 100%)",
        border: isVip
          ? "1.5px solid rgba(212, 175, 55, 0.65)"
          : "1px solid rgba(203, 213, 225, 0.25)",
        boxShadow: isVip
          ? "0 18px 40px -12px rgba(212, 175, 55, 0.28)"
          : "0 14px 32px -12px rgba(0, 0, 0, 0.5)",
        padding: compact ? "16px 18px" : "20px 22px",
        color: "#F8FAFC",
      }}
    >
      {/* Grabado láser de cancha de tenis en bajo relieve */}
      <svg
        viewBox="0 0 400 250"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: isVip ? 0.14 : 0.08 }}
      >
        <rect x="24" y="20" width="352" height="210" rx="6" fill="none" stroke={isVip ? "#FDE68A" : "#94A3B8"} strokeWidth="1.5" />
        <line x1="24" y1="48" x2="376" y2="48" stroke={isVip ? "#FDE68A" : "#94A3B8"} strokeWidth="1" />
        <line x1="24" y1="202" x2="376" y2="202" stroke={isVip ? "#FDE68A" : "#94A3B8"} strokeWidth="1" />
        <line x1="200" y1="20" x2="200" y2="230" stroke={isVip ? "#FDE68A" : "#94A3B8"} strokeWidth="1.4" strokeDasharray="4 3" />
        <line x1="106" y1="48" x2="106" y2="202" stroke={isVip ? "#FDE68A" : "#94A3B8"} strokeWidth="1" />
        <line x1="294" y1="48" x2="294" y2="202" stroke={isVip ? "#FDE68A" : "#94A3B8"} strokeWidth="1" />
        <line x1="106" y1="125" x2="294" y2="125" stroke={isVip ? "#FDE68A" : "#94A3B8"} strokeWidth="1" />
      </svg>

      {/* Halo metálico esquinero */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: isVip
            ? "radial-gradient(circle, rgba(253, 230, 138, 0.24) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Cabecera del Carnet */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <SafeImage
              src={ASSETS.logo}
              alt="MATCHPOINT"
              fallbackText="MP"
              style={{ width: 28, height: 28, borderRadius: 8 }}
            />
            <div>
              <div className="font-display font-black tracking-tight text-sm leading-none text-white">
                MATCHPOINT
              </div>
              <div
                className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
                style={{ color: isVip ? "#FDE68A" : "#94A3B8" }}
              >
                {isVip ? "PASE SOCIO VIP · TEMPORADA 2026" : "CREDENCIAL DE JUGADOR"}
              </div>
            </div>
          </div>

          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
            style={{
              background: isVip
                ? "linear-gradient(135deg, #FDE68A 0%, #D97706 100%)"
                : "rgba(255, 255, 255, 0.1)",
              color: isVip ? "#0A1633" : "#E2E8F0",
              border: isVip ? "none" : "1px solid rgba(255,255,255,0.18)",
            }}
          >
            {isVip ? "SOCIO VIP ACTIVO" : "SOCIO ESTÁNDAR"}
          </span>
        </div>

        {/* Chip Holográfico + Datos del Titular */}
        <div className="flex items-center justify-between gap-3 my-auto py-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Chip Metálico grabado */}
            <div
              className="w-10 h-8 rounded-md flex-shrink-0 relative overflow-hidden"
              style={{
                background: isVip
                  ? "linear-gradient(135deg, #FDE68A 0%, #B45309 100%)"
                  : "linear-gradient(135deg, #CBD5E1 0%, #64748B 100%)",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/30" />
              <div className="absolute inset-y-0 left-1/3 w-[1px] bg-black/30" />
              <div className="absolute inset-y-0 right-1/3 w-[1px] bg-black/30" />
            </div>

            <div className="min-w-0">
              <div className="text-base sm:text-lg font-display font-extrabold text-white truncate">
                {player.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                <span className="font-semibold" style={{ color: isVip ? "#FDE68A" : "#60A5FA" }}>
                  {catInfo.name}
                </span>
                <span>·</span>
                <span className="truncate">
                  {clubObj ? clubObj.shortName : "Jugador Independiente"}
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
                width: 38,
                height: 38,
                border: "1.5px solid rgba(255,255,255,0.28)",
                background: "#0A1633",
              }}
            />
          )}
        </div>

        {/* Pie del Carnet: Código Monoespaciado + Botón de Beneficios / Upgrade */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-slate-400">
              ID OFICIAL DEL CIRCUITO
            </div>
            <div
              className="font-mono-code text-xs font-bold tracking-wider"
              style={{ color: isVip ? "#FDE68A" : "#CBD5E1" }}
            >
              {memberCode}
            </div>
          </div>

          {onOpenVipUpgrade && (
            <button
              type="button"
              onClick={onOpenVipUpgrade}
              className="touch-btn px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all"
              style={{
                minHeight: 32,
                background: isVip
                  ? "rgba(253, 230, 138, 0.16)"
                  : "linear-gradient(135deg, #FDE68A 0%, #D97706 100%)",
                color: isVip ? "#FDE68A" : "#0A1633",
                border: isVip ? "1px solid rgba(253, 230, 138, 0.4)" : "none",
              }}
            >
              {isVip ? "Ver Beneficios VIP" : "Activar Pase VIP"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 19. TABLERO COMPLETO "ATP HEAD2HEAD" BICOLOR (ESTILO LEXUS ATP TOUR)
//     Anillo Radial Bicolor (#00A3FF vs #D6FF00), 8 Métricas Simétricas,
//     Historial Desplegable de Partidos y Selector de Rival con Buscador
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
  const [showMatchHistory, setShowMatchHistory] = useState(true);

  useEffect(() => {
    if (initialPlayerA?.id) setPlayerAId(initialPlayerA.id);
    if (initialPlayerB?.id && initialPlayerB.id !== initialPlayerA?.id) {
      setPlayerBId(initialPlayerB.id);
    } else if (initialPlayerA?.id && activePlayers.length > 1) {
      const alt = activePlayers.find((p) => p.id !== initialPlayerA.id);
      if (alt) setPlayerBId(alt.id);
    }
  }, [initialPlayerA, initialPlayerB, activePlayers]);

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

  // Historial directo entre Jugador A y Jugador B
  const directMatches = completedMatches.filter(
    (m) =>
      (m.challengerId === playerA?.id && m.challengedId === playerB?.id) ||
      (m.challengerId === playerB?.id && m.challengedId === playerA?.id)
  );

  const winsA = directMatches.filter((m) => m.winnerId === playerA?.id).length;
  const winsB = directMatches.filter((m) => m.winnerId === playerB?.id).length;
  const totalH2H = winsA + winsB;
  const pctA = totalH2H === 0 ? 50 : Math.round((winsA / totalH2H) * 100);

  // Geometría del Anillo Radial Bicolor SVG
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeA = (pctA / 100) * circumference;

  const totalMatchesA = (playerA?.wins || 0) + (playerA?.losses || 0);
  const effA =
    totalMatchesA > 0 ? Math.round(((playerA?.wins || 0) / totalMatchesA) * 100) : 0;

  const totalMatchesB = (playerB?.wins || 0) + (playerB?.losses || 0);
  const effB =
    totalMatchesB > 0 ? Math.round(((playerB?.wins || 0) / totalMatchesB) * 100) : 0;

  const comparisonRows = [
    {
      label: "Ranking",
      left: `#${rankA}`,
      right: `#${rankB}`,
    },
    {
      label: "Puntos",
      left: Number(playerA?.elo || 0).toLocaleString("es-PE"),
      right: Number(playerB?.elo || 0).toLocaleString("es-PE"),
    },
    {
      label: "Categoría",
      left: catA.short,
      right: catB.short,
    },
    {
      label: "Efectividad",
      left: `${effA}% (${playerA?.wins || 0}V-${playerA?.losses || 0}D)`,
      right: `${effB}% (${playerB?.wins || 0}V-${playerB?.losses || 0}D)`,
    },
    {
      label: "Racha Actual",
      left: playerA?.streak > 0 ? `+${playerA.streak} Seguidas` : "En ajuste",
      right: playerB?.streak > 0 ? `+${playerB.streak} Seguidas` : "En ajuste",
    },
    {
      label: "Edad",
      left: `${playerA?.age || 26} años`,
      right: `${playerB?.age || 28} años`,
    },
    {
      label: "Mano Hábil",
      left: playerA?.hand || "Diestro",
      right: playerB?.hand || "Diestro",
    },
    {
      label: "Mejor Golpe",
      left: playerA?.bestShot || "Derecha",
      right: playerB?.bestShot || "Derecha",
    },
  ];

  const filteredPickerPlayers = activePlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl my-auto border border-white/15"
        style={{
          background: "linear-gradient(180deg, #09132C 0%, #070C18 100%)",
          color: "#F8FAFC",
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior del Modal Head2Head */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <SafeImage
              src={ASSETS.logo}
              alt="MP"
              style={{ width: 24, height: 24, borderRadius: 6 }}
            />
            <span className="font-display font-black tracking-wider text-xs sm:text-sm uppercase text-white">
              MATCHPOINT <span style={{ color: "#D6FF00" }}>HEAD2HEAD</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Cerrar"
          >
            <Icons.Close size={18} />
          </button>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* Cabecera Visual Frente a Frente con Anillo Radial Bicolor */}
          <div className="grid grid-cols-3 items-center gap-2 pt-1">
            {/* Jugador Izquierdo (Azul Eléctrico #00A3FF) */}
            <div className="flex flex-col items-center text-center">
              <div
                className="relative rounded-full p-1"
                style={{
                  border: "2.5px solid #00A3FF",
                  boxShadow: "0 0 18px rgba(0, 163, 255, 0.35)",
                }}
              >
                <SafeImage
                  src={playerA?.avatar}
                  alt={playerA?.name}
                  fallbackText={playerA?.name}
                  circular
                  style={{ width: 72, height: 72 }}
                />
                {clubA && (
                  <SafeImage
                    src={clubA.shield}
                    alt={clubA.shortName}
                    circular
                    style={{
                      width: 24,
                      height: 24,
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      border: "1.5px solid #09132C",
                    }}
                  />
                )}
              </div>
              <div className="mt-2.5 font-display font-extrabold text-sm text-white leading-tight">
                {playerA?.name}
              </div>
              <div className="text-[11px] text-sky-400 font-semibold mt-0.5 truncate max-w-[115px]">
                {clubA ? clubA.shortName : "Independiente"}
              </div>
            </div>

            {/* Centro: Marcador Gigante + Anillo Radial Bicolor */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2.5">
                <span className="font-display font-black text-2xl sm:text-3xl tabular-nums text-white">
                  {winsA}
                </span>

                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
                    <circle
                      cx="54"
                      cy="54"
                      r={radius}
                      fill="none"
                      stroke="#D6FF00"
                      strokeWidth="6"
                    />
                    <circle
                      cx="54"
                      cy="54"
                      r={radius}
                      fill="none"
                      stroke="#00A3FF"
                      strokeWidth="6"
                      strokeDasharray={`${strokeA} ${circumference}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                      Vs
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      victorias
                    </span>
                  </div>
                </div>

                <span className="font-display font-black text-2xl sm:text-3xl tabular-nums text-white">
                  {winsB}
                </span>
              </div>
            </div>

            {/* Jugador Derecho (Amarillo Volt #D6FF00) */}
            <div className="flex flex-col items-center text-center">
              <div
                className="relative rounded-full p-1"
                style={{
                  border: "2.5px solid #D6FF00",
                  boxShadow: "0 0 18px rgba(214, 255, 0, 0.3)",
                }}
              >
                <SafeImage
                  src={playerB?.avatar}
                  alt={playerB?.name}
                  fallbackText={playerB?.name}
                  circular
                  style={{ width: 72, height: 72 }}
                />
                {clubB && (
                  <SafeImage
                    src={clubB.shield}
                    alt={clubB.shortName}
                    circular
                    style={{
                      width: 24,
                      height: 24,
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      border: "1.5px solid #09132C",
                    }}
                  />
                )}
              </div>
              <div className="mt-2.5 font-display font-extrabold text-sm text-white leading-tight">
                {playerB?.name}
              </div>
              <div
                className="text-[11px] font-semibold mt-0.5 truncate max-w-[115px]"
                style={{ color: "#D6FF00" }}
              >
                {clubB ? clubB.shortName : "Independiente"}
              </div>
            </div>
          </div>

          {/* Botones Centrales: Retar Directamente y Ver Detalle H2H */}
          <div className="flex items-center justify-center gap-2.5">
            {onLaunchChallenge && playerA?.id !== playerB?.id && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchChallenge(playerB);
                }}
                className="touch-btn px-4 py-2.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                style={{
                  background: "#D6FF00",
                  color: "#0A1633",
                }}
              >
                Retar a {playerB?.name.split(" ")[0]}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMatchHistory((v) => !v)}
              className="touch-btn px-4 py-2.5 rounded-xl font-semibold text-xs text-white border border-sky-400/40 bg-sky-500/15"
            >
              {showMatchHistory ? "Ocultar Cruces" : `Historial (${directMatches.length}) →`}
            </button>
          </div>

          {/* Historial Cronológico de Partidos Cara a Cara */}
          {showMatchHistory && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Enfrentamientos Directos Registrados
              </div>
              {directMatches.length === 0 ? (
                <div className="text-xs text-slate-300 py-1">
                  Primer enfrentamiento directo en el circuito.
                </div>
              ) : (
                directMatches.map((m) => {
                  const winnerName =
                    m.winnerId === playerA?.id ? playerA?.name : playerB?.name;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-white/10 last:border-none"
                    >
                      <div>
                        <span className="font-bold text-white">{winnerName}</span>{" "}
                        <span className="text-slate-400">ganó por</span>{" "}
                        <span className="font-bold" style={{ color: "#D6FF00" }}>
                          {m.score}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {m.clubName}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tabla Comparativa Simétrica Estilo ATP Tour (Hairlines 1px) */}
          <div className="border-t border-white/10 pt-2">
            {comparisonRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-3 items-center py-2.5 border-b border-white/10 text-xs sm:text-sm"
              >
                <div className="font-bold text-white text-left tabular-nums">
                  {row.left}
                </div>
                <div className="text-center text-xs font-medium text-slate-400">
                  {row.label}
                </div>
                <div className="font-bold text-white text-right tabular-nums">
                  {row.right}
                </div>
              </div>
            ))}
          </div>

          {/* Selector Inferior Tipo Cápsula ("Elegir Jugador" Izquierda / Derecha) */}
          <div className="space-y-2 pt-1">
            <div
              className="rounded-full p-1.5 flex items-center justify-between"
              style={{
                background: "#050B16",
                border: "1.5px solid rgba(214, 255, 0, 0.55)",
              }}
            >
              <button
                type="button"
                onClick={() => setPickerSide(pickerSide === "A" ? null : "A")}
                className="touch-btn w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#00A3FF", color: "#070C18" }}
                title="Cambiar Jugador Izquierdo"
              >
                <Icons.Search size={18} />
              </button>

              <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                {pickerSide
                  ? `Seleccionando Jugador ${pickerSide === "A" ? "Izquierdo" : "Derecho"}`
                  : "Comparar Otro Jugador"}
              </span>

              <button
                type="button"
                onClick={() => setPickerSide(pickerSide === "B" ? null : "B")}
                className="touch-btn w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#D6FF00", color: "#070C18" }}
                title="Cambiar Jugador Derecho"
              >
                <Icons.Search size={18} />
              </button>
            </div>

            {pickerSide && (
              <div className="rounded-2xl bg-slate-900/95 border border-white/15 p-3 space-y-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tenista por nombre..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none"
                />
                <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
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
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-left text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <SafeImage
                          src={p.avatar}
                          alt={p.name}
                          circular
                          style={{ width: 26, height: 26 }}
                        />
                        <span className="font-bold text-white">{p.name}</span>
                      </div>
                      <span className="font-bold text-sky-400 tabular-nums">
                        {p.elo} Pts
                      </span>
                    </button>
                  ))}
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
// 20. GENERADOR DE PÓSTER VERTICAL 9:16 (HTML5 CANVAS PARA IG / WA STORIES)
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

    // Fondo Azul Marino Noche ATP
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, "#0A1633");
    grad.addColorStop(0.55, "#070C18");
    grad.addColorStop(1, "#121E36");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Líneas sutiles de cancha
    ctx.strokeStyle = "rgba(214, 255, 0, 0.14)";
    ctx.lineWidth = 4;
    ctx.strokeRect(70, 90, 940, 1740);

    // Cabecera
    ctx.fillStyle = "#D6FF00";
    ctx.font = "900 54px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MATCHPOINT HUANCAYO", 540, 230);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "700 32px Plus Jakarta Sans, sans-serif";
    ctx.fillText(
      matchData.isFriendly ? "RESULTADO EXHIBICIÓN H2H" : "RESULTADO OFICIAL DEL CIRCUITO",
      540,
      295
    );

    const winner = players.find((p) => p.id === matchData.winnerId);
    const loser = players.find((p) => p.id === matchData.loserId);

    const winnerName = winner?.name || matchData.winnerName || "Ganador";
    const loserName = loser?.name || matchData.loserName || "Rival";

    // Caja Central Ganador
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(120, 420, 840, 340);
    ctx.strokeStyle = "#D6FF00";
    ctx.lineWidth = 3;
    ctx.strokeRect(120, 420, 840, 340);

    ctx.fillStyle = "#D6FF00";
    ctx.font = "800 30px Plus Jakarta Sans, sans-serif";
    ctx.fillText("VICTORIA OFICIAL", 540, 500);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 68px Outfit, sans-serif";
    ctx.fillText(winnerName.toUpperCase(), 540, 600);

    if (!matchData.isFriendly && matchData.winnerDelta) {
      ctx.fillStyle = "#10B981";
      ctx.font = "800 42px Plus Jakarta Sans, sans-serif";
      ctx.fillText(`+${matchData.winnerDelta} PTS RANKING`, 540, 685);
    }

    // Marcador Gigante
    ctx.fillStyle = "#0E1729";
    ctx.fillRect(140, 840, 800, 250);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(140, 840, 800, 250);

    ctx.fillStyle = "#D6FF00";
    ctx.font = "900 105px Outfit, sans-serif";
    ctx.fillText(matchData.score || "6-4, 6-3", 540, 1005);

    // Rival
    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 34px Plus Jakarta Sans, sans-serif";
    ctx.fillText("FRENTE A", 540, 1210);

    ctx.fillStyle = "#F8FAFC";
    ctx.font = "800 54px Outfit, sans-serif";
    ctx.fillText(loserName.toUpperCase(), 540, 1295);

    // Sede y Fecha
    ctx.fillStyle = "#E07A5F";
    ctx.font = "700 38px Plus Jakarta Sans, sans-serif";
    ctx.fillText(matchData.clubName || "Country Club Los Huancas", 540, 1510);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 30px Plus Jakarta Sans, sans-serif";
    ctx.fillText(matchData.dateLabel || "Temporada 2026", 540, 1570);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 32px Outfit, sans-serif";
    ctx.fillText("@MatchPoint.Oficial · Huancayo", 540, 1745);

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
    a.download = `MatchPoint-Victoria-${Date.now()}.png`;
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
            <h3 className="font-display font-extrabold text-base">
              Tarjeta de Victoria 9:16
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Lista para Instagram Stories o Estados de WhatsApp
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
          <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/30 max-h-[55dvh] flex justify-center">
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
            style={{ background: "#D6FF00", color: "#0A1633" }}
          >
            Descargar PNG
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

// === FIN DEL BLOQUE 5 DE 10 ===

// === INICIO DEL BLOQUE 6 DE 10 ===

// ============================================================================
// 21. HEADER SUPERIOR RECONSTRUIDO (ESTILO ATP TOUR · SIN SUPERPOSICIONES)
//     - Logo + MATCHPOINT grandes y limpios (Sin "CIRCUITO OFICIAL", sin "Guía")
//     - Sin foto de perfil duplicada arriba
//     - Botón "Pro Shop" en 1 sola línea compacta con alto contraste real
//     - Icono de Periódico / Boletín (Avisos del Circuito + Noticiero de Tenis)
//     - Gesto secreto: 5 toques seguidos en el logo MATCHPOINT abre Admin PIN
// ============================================================================
export const TopHeaderBar = ({
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
      {/* Izquierda: Menú Limpio + Marca MATCHPOINT Grande */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="touch-btn w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-main)",
          }}
          aria-label="Abrir menú"
        >
          <Icons.Menu size={20} />
        </button>

        <div
          onClick={handleBrandSecretTap}
          className="flex items-center gap-2.5 cursor-pointer min-w-0 py-1"
        >
          <SafeImage
            src={ASSETS.logo}
            alt="MATCHPOINT"
            fallbackText="MP"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "1px solid var(--border-strong)",
            }}
          />
          <span
            className="font-display font-black tracking-tight text-lg sm:text-xl leading-none truncate"
            style={{ color: "var(--text-main)" }}
          >
            MATCHPOINT
          </span>
        </div>
      </div>

      {/* Derecha: Píldora Compacta 1 Línea "Pro Shop" + Icono de Periódico/Avisos */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onOpenProShop}
          className="touch-btn px-3.5 rounded-full flex items-center gap-1.5 whitespace-nowrap"
          style={{
            height: 38,
            minHeight: 38,
            background: "#D6FF00",
            color: "#0A1633",
            border: "1px solid rgba(10, 22, 51, 0.14)",
            boxShadow: "0 4px 14px rgba(214, 255, 0, 0.18)",
          }}
        >
          <Icons.Bag size={15} />
          <span className="font-display font-extrabold text-xs tracking-tight">
            Pro Shop
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenBulletin}
          className="touch-btn relative w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-main)",
          }}
          aria-label="Avisos y Noticiero de Tenis"
        >
          <Icons.Newspaper size={19} />
          {unreadBulletinCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center tabular-nums"
              style={{
                background: "var(--crimson)",
                color: "#FFFFFF",
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
// 22. MODAL DE BOLETÍN Y NOTICIERO DE TENIS (AVISOS CIRCUITO + PRENSA REAL)
//     Solo se abre al tocar el icono de Periódico del Header (Cero estorbo)
// ============================================================================
export const BulletinAndNewsModal = ({
  isOpen,
  onClose,
  currentUser,
  challenges = [],
  players = [],
  newsItems = FALLBACK_EDITORIAL_NEWS,
  liveTicker = ATP_WTA_LIVE_TICKER,
  onAcceptChallenge,
  onRejectChallenge,
  onGoToChallenges,
}) => {
  const [activeTab, setActiveTab] = useState("actividad"); // 'actividad' | 'noticiero'

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
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "88dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div className="flex items-center gap-2.5">
            <Icons.Newspaper size={20} />
            <div>
              <h3 className="font-display font-extrabold text-base leading-tight">
                Centro de Avisos y Prensa
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Tus retos del circuito y actualidad ATP / WTA
              </p>
            </div>
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

        {/* Pestañas Subrayadas Estilo ATP */}
        <div
          className="grid grid-cols-2 px-5"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("actividad")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color:
                activeTab === "actividad"
                  ? "var(--text-main)"
                  : "var(--text-muted)",
            }}
          >
            Mis Avisos ({myIncomingPending.length + myConfirmedMatches.length})
            {activeTab === "actividad" && (
              <span
                className="absolute bottom-0 inset-x-4 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("noticiero")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color:
                activeTab === "noticiero"
                  ? "var(--text-main)"
                  : "var(--text-muted)",
            }}
          >
            Noticiero Tenis
            {activeTab === "noticiero" && (
              <span
                className="absolute bottom-0 inset-x-4 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {activeTab === "actividad" ? (
            <div className="space-y-3">
              {myIncomingPending.length === 0 && myConfirmedMatches.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center space-y-2"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div className="font-display font-bold text-sm">
                    Todo al día en tu bandeja
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No tienes desafíos pendientes por responder en este momento.
                  </p>
                </div>
              ) : (
                <>
                  {myIncomingPending.map((ch) => {
                    const challenger = players.find((p) => p.id === ch.challengerId);
                    return (
                      <div
                        key={ch.id}
                        className="rounded-2xl p-4 space-y-3"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-strong)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                            style={{
                              background: "#D6FF00",
                              color: "#0A1633",
                            }}
                          >
                            Nuevo Desafío Recibido
                          </span>
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {ch.dateTimeLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={challenger?.avatar}
                            alt={challenger?.name}
                            circular
                            style={{ width: 44, height: 44 }}
                          />
                          <div>
                            <div className="font-display font-extrabold text-sm">
                              {challenger?.name} te ha retado
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Sede: {ch.customClubName} · {ch.ballAgreement}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onAcceptChallenge && onAcceptChallenge(ch.id)}
                            className="touch-btn py-2.5 rounded-xl font-display font-extrabold text-xs"
                            style={{ background: "#D6FF00", color: "#0A1633" }}
                          >
                            Aceptar Reto
                          </button>
                          <button
                            type="button"
                            onClick={() => onRejectChallenge && onRejectChallenge(ch.id)}
                            className="touch-btn py-2.5 rounded-xl font-semibold text-xs border"
                            style={{
                              borderColor: "var(--border-strong)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Declinar
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {myConfirmedMatches.map((ch) => {
                    const rivalId =
                      ch.challengerId === currentUser?.id
                        ? ch.challengedId
                        : ch.challengerId;
                    const rival = players.find((p) => p.id === rivalId);
                    return (
                      <div
                        key={ch.id}
                        className="rounded-2xl p-4 flex items-center justify-between gap-3"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-hairline)",
                        }}
                      >
                        <div className="min-w-0">
                          <div
                            className="text-[10px] font-extrabold uppercase tracking-wider"
                            style={{ color: "var(--emerald)" }}
                          >
                            Duelo Confirmado · Pendiente de Marcador
                          </div>
                          <div className="font-display font-extrabold text-sm truncate mt-0.5">
                            {currentUser?.name} vs. {rival?.name}
                          </div>
                          <div
                            className="text-xs truncate"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {ch.customClubName} · {ch.dateTimeLabel}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onGoToChallenges) onGoToChallenges();
                          }}
                          className="touch-btn px-3 py-2 rounded-xl font-bold text-xs flex-shrink-0"
                          style={{
                            background: "var(--electric)",
                            color: "#FFFFFF",
                          }}
                        >
                          Ver Duelo
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Marcadores Profesionales ATP / WTA */}
              <div className="space-y-2">
                <div
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Marcadores ATP / WTA
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {liveTicker.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-[205px] rounded-2xl p-3 flex-shrink-0 block"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-hairline)",
                      }}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span style={{ color: "var(--clay)" }}>{item.tour}</span>
                        <span style={{ color: "var(--emerald)" }}>{item.status}</span>
                      </div>
                      <div className="font-display font-bold text-xs mt-1.5">
                        {item.player1} d. {item.player2}
                      </div>
                      <div
                        className="font-mono-code font-bold text-xs mt-0.5"
                        style={{ color: "var(--text-player)" }}
                      >
                        {item.score}
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Artículos de Prensa (Estilo Punto de Break con Fotos Reales) */}
              <div className="space-y-3">
                <div
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Titulares del Circuito Internacional
                </div>

                {newsItems.map((article) => (
                  <a
                    key={article.id}
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl overflow-hidden transition-transform active:scale-[0.99]"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    {article.imageUrl ? (
                      <div className="h-36 w-full overflow-hidden relative">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span
                          className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase"
                          style={{
                            background: "rgba(10, 22, 51, 0.85)",
                            color: "#D6FF00",
                          }}
                        >
                          {article.source}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="px-4 pt-3 flex items-center justify-between"
                      >
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                          style={{
                            background: "var(--clay-bg)",
                            color: "var(--clay)",
                          }}
                        >
                          {article.source}
                        </span>
                      </div>
                    )}

                    <div className="p-3.5 space-y-1">
                      <h4 className="font-display font-bold text-sm leading-snug">
                        {article.title}
                      </h4>
                      <div
                        className="text-[11px] flex items-center justify-between pt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span>{article.publishedAt}</span>
                        <span className="font-semibold" style={{ color: "var(--text-player)" }}>
                          Leer nota →
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 23. MODAL DE AJUSTES DE PERFIL (POP-UP CON BLUR iOS · CERO ACORDEÓN)
//     Selectores táctiles de Mano, Mejor Golpe, Días/Horas, Club y Privacidad
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
  const [hand, setHand] = useState(player?.hand || "Diestro");
  const [bestShot, setBestShot] = useState(
    player?.bestShot || "Derecha (Forehand)"
  );
  const [clubId, setClubId] = useState(player?.clubId || "country");
  const [selectedDays, setSelectedDays] = useState(
    player?.availableDays || ["M", "J", "S"]
  );
  const [selectedSlots, setSelectedSlots] = useState(
    player?.availableSlots || ["18:00–22:00"]
  );
  const [whatsappPrivate, setWhatsappPrivate] = useState(
    Boolean(player?.whatsappPrivate)
  );

  useEffect(() => {
    if (player) {
      setHand(player.hand || "Diestro");
      setBestShot(player.bestShot || "Derecha (Forehand)");
      setClubId(player.clubId || "country");
      setSelectedDays(player.availableDays || ["M", "J", "S"]);
      setSelectedSlots(player.availableSlots || ["18:00–22:00"]);
      setWhatsappPrivate(Boolean(player.whatsappPrivate));
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

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
        hand,
        bestShot,
        clubId,
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
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div className="flex items-center gap-2">
            <Icons.Settings size={19} />
            <h3 className="font-display font-extrabold text-base">
              Configuración de Perfil
            </h3>
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

        {/* Cuerpo de selectores táctiles (Cero escribir a mano) */}
        <div className="p-5 overflow-y-auto space-y-5 no-scrollbar">
          {/* 1. Mano Hábil */}
          <div className="space-y-2">
            <label
              className="text-xs font-extrabold uppercase tracking-wider block"
              style={{ color: "var(--text-muted)" }}
            >
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
                    className="touch-btn py-2.5 px-4 rounded-xl font-display font-bold text-xs border transition-all"
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

          {/* 2. Mejor Golpe */}
          <div className="space-y-2">
            <label
              className="text-xs font-extrabold uppercase tracking-wider block"
              style={{ color: "var(--text-muted)" }}
            >
              Mejor Golpe
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BEST_SHOT_OPTIONS.map((shot) => {
                const active = bestShot === shot;
                return (
                  <button
                    key={shot}
                    type="button"
                    onClick={() => setBestShot(shot)}
                    className="touch-btn py-2.5 px-3 rounded-xl font-semibold text-xs border text-left justify-start"
                    style={{
                      background: active ? "#D6FF00" : "var(--bg-subtle)",
                      color: active ? "#0A1633" : "var(--text-main)",
                      borderColor: active
                        ? "#D6FF00"
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

          {/* 3. Disponibilidad de Días y Franjas Horarias */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-extrabold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Días Disponibles para Jugar
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDays(["L", "M", "X", "J", "V"])}
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-player)",
                  }}
                >
                  Lun–Vie
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDays(["S", "D"])}
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-player)",
                  }}
                >
                  Fin de Semana
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {WEEK_DAYS_OPTIONS.map((d) => {
                const active = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className="touch-btn py-2 rounded-xl font-display font-extrabold text-xs border"
                    style={{
                      minHeight: 40,
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
                    className="touch-btn py-2 px-2 rounded-xl flex flex-col items-center justify-center border text-center"
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
                    <span className="text-[10px] opacity-80">{slot.hours}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Club Representado o Modo Individual */}
          <div className="space-y-2">
            <label
              className="text-xs font-extrabold uppercase tracking-wider block"
              style={{ color: "var(--text-muted)" }}
            >
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
                    className="touch-btn px-3.5 py-2.5 rounded-xl flex items-center justify-between border"
                    style={{
                      background: active ? "var(--bg-elevated)" : "var(--bg-subtle)",
                      borderColor: active
                        ? "var(--electric)"
                        : "var(--border-hairline)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <SafeImage
                        src={c.shield}
                        alt={c.name}
                        circular
                        style={{ width: 26, height: 26 }}
                      />
                      <span className="text-xs font-bold">{c.name}</span>
                    </div>
                    {active && <Icons.Check size={16} />}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setClubId("individual")}
                className="touch-btn px-3.5 py-2.5 rounded-xl flex items-center justify-between border"
                style={{
                  background:
                    clubId === "individual"
                      ? "var(--bg-elevated)"
                      : "var(--bg-subtle)",
                  borderColor:
                    clubId === "individual"
                      ? "var(--electric)"
                      : "var(--border-hairline)",
                }}
              >
                <span className="text-xs font-bold">
                  Jugador Independiente (Sin escudo de club)
                </span>
                {clubId === "individual" && <Icons.Check size={16} />}
              </button>
            </div>
          </div>

          {/* 5. Privacidad de WhatsApp */}
          <div
            className="rounded-2xl p-3.5 flex items-center justify-between gap-3"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div>
              <div className="text-xs font-bold">Privacidad de WhatsApp</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Ocultar número hasta que aceptes el desafío
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWhatsappPrivate((v) => !v)}
              className="px-3 py-1.5 rounded-full text-xs font-extrabold"
              style={{
                background: whatsappPrivate
                  ? "var(--emerald)"
                  : "var(--border-strong)",
                color: "#FFFFFF",
              }}
            >
              {whatsappPrivate ? "Protegido" : "Visible"}
            </button>
          </div>

          {/* 6. Acciones Secundarias: Ver Guía Rápida / Cambiar de Cuenta */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onOpenTutorialOnce && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTutorialOnce();
                }}
                className="touch-btn py-2.5 px-3 rounded-xl text-xs font-semibold border"
                style={{
                  borderColor: "var(--border-hairline)",
                  color: "var(--text-muted)",
                }}
              >
                Ver Guía Rápida
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSwitchAccount) onOpenSwitchAccount();
              }}
              className="touch-btn py-2.5 px-3 rounded-xl text-xs font-bold border"
              style={{
                borderColor: "rgba(244, 63, 94, 0.35)",
                color: "var(--crimson)",
              }}
            >
              Cambiar de Cuenta
            </button>
          </div>
        </div>

        {/* Pie del Modal: Guardar Cambios */}
        <div
          className="p-4 flex gap-2.5"
          style={{ borderTop: "1px solid var(--border-hairline)" }}
        >
          <button
            type="button"
            onClick={handleSave}
            className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
            style={{ background: "#D6FF00", color: "#0A1633" }}
          >
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 24. VISTA PRINCIPAL: MI PERFIL (TERMÓMETRO MONOCROMÁTICO + PELOTA 3D)
//     - Sin "(Tú)", sin "Ranking Oficial", sin emoji 🏛️
//     - 3 Cajas perfectamente centradas y simétricas
//     - Barra de calibración oculta si ya completó 5/5 partidos
// ============================================================================
export const MyProfileView = ({
  player,
  allPlayers = [],
  completedMatches = [],
  clubs = HUANCAYO_CLUBS,
  onOpenSettings,
  onOpenVipUpgrade,
  onOpenHeadToHead,
  onOpenStoryPoster,
  onToggleLookingForMatch,
}) => {
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

  const totalPlayed = (player.wins || 0) + (player.losses || 0);
  const winRatePct =
    totalPlayed > 0 ? Math.round(((player.wins || 0) / totalPlayed) * 100) : 0;

  const isCalibrating =
    Number(player.calibrationMatches ?? 5) < ELO_CONSTANTS.CALIBRATION_MATCHES;

  const myHistory = completedMatches.filter(
    (m) => m.challengerId === player.id || m.challengedId === player.id
  );

  const daysText = (player.availableDays || ["M", "J", "S"])
    .map((dId) => WEEK_DAYS_OPTIONS.find((w) => w.id === dId)?.label || dId)
    .join(", ");

  const slotsText = (player.availableSlots || ["18:00–22:00"]).join(" · ");

  return (
    <div className="view-transition px-4 pt-4 pb-8 space-y-4 max-w-xl mx-auto">
      {/* 1. Tarjeta Principal de Identidad del Tenista */}
      <div className="atp-card p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <LaurelAvatar
              src={player.avatar}
              name={player.name}
              rank={officialRank <= 3 ? officialRank : null}
              size={64}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
                  style={{
                    background: catInfo.bg,
                    color: catInfo.color,
                    border: `1px solid ${catInfo.border}`,
                  }}
                >
                  {catInfo.name}
                </span>
                <span
                  className="text-xs font-display font-extrabold tabular-nums"
                  style={{ color: "var(--text-player)" }}
                >
                  Puesto #{officialRank}
                </span>
              </div>

              <h1 className="font-display font-black text-xl sm:text-2xl mt-1 truncate">
                {player.name}
              </h1>

              {/* Club o Independiente (Con escudo oficial, sin emoji 🏛️) */}
              <div className="flex items-center gap-2 mt-1">
                {clubObj ? (
                  <>
                    <SafeImage
                      src={clubObj.shield}
                      alt={clubObj.name}
                      circular
                      style={{ width: 18, height: 18 }}
                    />
                    <span
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {clubObj.name}
                    </span>
                  </>
                ) : (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Jugador Independiente
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botón Ajustes (Abre Modal con Blur iOS) */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="touch-btn px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold flex-shrink-0"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-main)",
            }}
          >
            <Icons.Settings size={16} />
            <span>Ajustes</span>
          </button>
        </div>

        {/* 2. Tres Bloques Métricos 100% Simétricos y Centrados */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Puntos */}
          <div
            className="rounded-2xl p-3 flex flex-col items-center justify-center text-center min-h-[88px]"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Puntos
            </span>
            <span className="font-display font-black text-xl sm:text-2xl tabular-nums mt-1">
              {Number(player.elo).toLocaleString("es-PE")}
            </span>
            <span
              className="text-[10px] font-semibold mt-0.5"
              style={{ color: "var(--emerald)" }}
            >
              Piso: {catInfo.activeSeasonFloor}
            </span>
          </div>

          {/* % Efectividad */}
          <div
            className="rounded-2xl p-3 flex flex-col items-center justify-center text-center min-h-[88px]"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Efectividad
            </span>
            <span className="font-display font-black text-xl sm:text-2xl tabular-nums mt-1">
              {winRatePct}%
            </span>
            <span
              className="text-[10px] font-semibold mt-0.5 tabular-nums"
              style={{ color: "var(--text-muted)" }}
            >
              {player.wins}V · {player.losses}D
            </span>
          </div>

          {/* Racha / Estado (Alineado exactamente a la misma altura) */}
          <div
            className="rounded-2xl p-3 flex flex-col items-center justify-center text-center min-h-[88px]"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Racha
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              {player.streak > 0 && (
                <SafeImage
                  src={ASSETS.fuegoRacha3d}
                  alt="Racha"
                  style={{ width: 20, height: 20 }}
                />
              )}
              <span className="font-display font-black text-xl sm:text-2xl tabular-nums">
                {player.streak > 0 ? `+${player.streak}` : "Activa"}
              </span>
            </div>
            <span
              className="text-[10px] font-semibold mt-0.5"
              style={{
                color: player.streak > 0 ? "var(--gold)" : "var(--text-muted)",
              }}
            >
              {player.streak > 0 ? "Victorias seguidas" : "Temporada 2026"}
            </span>
          </div>
        </div>

        {/* 3. Barra de Calibración (SOLO se muestra si aún NO completó sus 5 partidos) */}
        {isCalibrating && (
          <div
            className="rounded-2xl p-3.5 space-y-2"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">Fase de Calibración Inicial</span>
              <span className="font-display font-extrabold tabular-nums">
                {player.calibrationMatches} de 5 partidos
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ background: "var(--thermometer-track)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(player.calibrationMatches / 5) * 100}%`,
                  background: "var(--electric)",
                }}
              />
            </div>
          </div>
        )}

        {/* 4. Barra de Progreso Estilo Termómetro Monocromático con Pelota 3D en la Punta */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold">
                Progreso hacia{" "}
                {catInfo.nextCat ? catInfo.nextCat.name : "Cima 2ª Libre"}
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {catInfo.consolidatedCheckpoint
                  ? `Checkpoint ${catInfo.checkpointLabel} asegurado para la próxima temporada`
                  : catInfo.checkpoint && player.elo < catInfo.checkpoint
                  ? `A ${catInfo.checkpoint - player.elo} pts del Checkpoint ${catInfo.checkpointLabel}`
                  : catInfo.nextCat
                  ? `A ${catInfo.pointsToNextCategory} pts del ascenso directo`
                  : "Máxima categoría alcanzada"}
              </div>
            </div>
            <span className="font-display font-black text-sm tabular-nums">
              {catInfo.levelProgressPct}%
            </span>
          </div>

          {/* Carril Monocromático + Indicador de Pelota de Tenis en la Punta */}
          <div className="relative py-2">
            <div
              className="h-2.5 w-full rounded-full"
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

            {/* Marca del Checkpoint Intermedio (50%) en 4ª y 3ª Categoría */}
            {catInfo.checkpoint && (
              <div
                className="absolute top-0.5 bottom-0.5 left-1/2 -translate-x-1/2 w-0.5"
                style={{ background: "var(--gold)" }}
                title={`Checkpoint ${catInfo.checkpoint}`}
              />
            )}

            {/* Pelota de Tenis 3D en el extremo exacto del termómetro */}
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
                  width: 24,
                  height: 24,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
                }}
              />
            </div>
          </div>

          <div
            className="flex items-center justify-between text-[11px] font-semibold tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            <span>Base: {catInfo.min} pts</span>
            {catInfo.checkpoint && (
              <span style={{ color: "var(--gold)" }}>
                Checkpoint: {catInfo.checkpoint} pts
              </span>
            )}
            <span>
              {catInfo.nextCat ? `Meta: ${catInfo.nextCat.min} pts` : "5,000+ pts"}
            </span>
          </div>
        </div>

        {/* 5. Mano, Mejor Golpe y Disponibilidad Horaria con Diseño Limpio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div
            className="rounded-2xl p-3.5 flex items-center justify-between"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div>
              <div
                className="text-[10px] font-extrabold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Perfil de Juego
              </div>
              <div className="font-display font-bold text-xs sm:text-sm mt-0.5">
                {player.hand || "Diestro"} · {player.bestShot || "Derecha"}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-xs font-bold"
              style={{ color: "var(--text-player)" }}
            >
              Editar
            </button>
          </div>

          <div
            className="rounded-2xl p-3.5 flex items-center justify-between"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div className="min-w-0">
              <div
                className="text-[10px] font-extrabold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Disponibilidad Habitual
              </div>
              <div className="font-display font-bold text-xs truncate mt-0.5">
                {daysText} · {slotsText}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-xs font-bold flex-shrink-0 ml-2"
              style={{ color: "var(--text-player)" }}
            >
              Cambiar
            </button>
          </div>
        </div>

        {/* 6. Interruptor Rápido: "Tengo cancha hoy / Busco rival" + Botón Head2Head */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onToggleLookingForMatch}
            className="touch-btn py-2.5 px-3 rounded-xl font-display font-bold text-xs border"
            style={{
              background: player.lookingForMatchToday
                ? "var(--emerald-bg)"
                : "var(--bg-subtle)",
              borderColor: player.lookingForMatchToday
                ? "var(--emerald)"
                : "var(--border-hairline)",
              color: player.lookingForMatchToday
                ? "var(--emerald)"
                : "var(--text-main)",
            }}
          >
            {player.lookingForMatchToday
              ? "Disponible Hoy Activo"
              : "Marcar Disponible Hoy"}
          </button>

          <button
            type="button"
            onClick={() => onOpenHeadToHead && onOpenHeadToHead(player, null)}
            className="touch-btn py-2.5 px-3 rounded-xl font-display font-extrabold text-xs"
            style={{
              background: "var(--electric)",
              color: "#FFFFFF",
            }}
          >
            Comparador Head2Head
          </button>
        </div>
      </div>

      {/* 7. Carnet Digital VIP Metálico 3D Integrado */}
      <CarnetDigitalVIP
        player={player}
        clubs={clubs}
        onOpenVipUpgrade={onOpenVipUpgrade}
      />

      {/* 8. Bitácora de Últimos Partidos Verificados del Jugador (Con Póster Story 9:16) */}
      <div className="atp-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold text-sm uppercase tracking-wider">
            Últimos Resultados Verificados
          </h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {myHistory.length} registrados
          </span>
        </div>

        {myHistory.length === 0 ? (
          <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>
            Aún no registras marcadores confirmados en esta temporada.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
            {myHistory.slice(0, 5).map((m) => {
              const iWon = m.winnerId === player.id;
              const rivalId =
                m.challengerId === player.id ? m.challengedId : m.challengerId;
              const rival = allPlayers.find((p) => p.id === rivalId);
              const myDelta = iWon ? m.winnerDelta : m.loserDelta;

              return (
                <div
                  key={m.id}
                  className="py-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                        style={{
                          background: iWon
                            ? "var(--emerald-bg)"
                            : "rgba(244, 63, 94, 0.14)",
                          color: iWon ? "var(--emerald)" : "var(--crimson)",
                        }}
                      >
                        {iWon ? "Victoria" : "Derrota"}
                      </span>
                      <span className="font-display font-bold text-xs sm:text-sm truncate">
                        vs. {rival?.name || "Rival"}
                      </span>
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Marcador:{" "}
                      <strong style={{ color: "var(--text-main)" }}>
                        {m.score}
                      </strong>{" "}
                      · {m.clubName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!m.isFriendly && (
                      <span
                        className="font-display font-extrabold text-xs tabular-nums"
                        style={{
                          color: iWon ? "var(--emerald)" : "var(--crimson)",
                        }}
                      >
                        {myDelta > 0 ? `+${myDelta}` : myDelta} Pts
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenStoryPoster && onOpenStoryPoster(m)}
                      className="touch-btn px-2.5 py-1.5 rounded-lg text-[11px] font-bold border"
                      style={{
                        minHeight: 32,
                        borderColor: "var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    >
                      Story 9:16
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 6 DE 10 ===

// === INICIO DEL BLOQUE 7 DE 10 ===

// ============================================================================
// 25. VISTA PRINCIPAL: RANKING OFICIAL (ESTILO PIF ATP RANKINGS)
//     - Laureles de Oro (#1), Plata (#2) y Bronce (#3) en CADA categoría
//     - Contenedor único con líneas divisorias finas 1px (Cero Box-in-Box)
//     - Buscador de tenistas por nombre + Filtro por Categorías y por Clubes
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClubFilter, setSelectedClubFilter] = useState("ALL");

  const activePlayers = useMemo(
    () =>
      [...players]
        .filter((p) => p.activeStatus !== "inactive")
        .sort((a, b) => b.elo - a.elo),
    [players]
  );

  const filteredPlayers = useMemo(() => {
    return activePlayers.filter((p) => {
      const cat = getCategoryByElo(p.elo, p.seasonMatches);
      if (selectedCategory !== "ALL" && cat.id !== selectedCategory) {
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
  }, [activePlayers, selectedCategory, selectedClubFilter, searchQuery]);

  const clubsStandings = useMemo(() => {
    return clubs
      .map((club) => {
        const members = activePlayers.filter((p) => p.clubId === club.id);
        const totalPoints = members.reduce((acc, p) => acc + Number(p.elo || 0), 0);
        const avgPoints =
          members.length > 0 ? Math.round(totalPoints / members.length) : 0;
        const totalWins = members.reduce((acc, p) => acc + Number(p.wins || 0), 0);
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

  const getRankBadgeStyle = (pos) => {
    if (pos === 1) {
      return {
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.16)",
        border: "1px solid rgba(245, 158, 11, 0.45)",
      };
    }
    if (pos === 2) {
      return {
        color: "#CBD5E1",
        bg: "rgba(203, 213, 225, 0.16)",
        border: "1px solid rgba(203, 213, 225, 0.42)",
      };
    }
    if (pos === 3) {
      return {
        color: "#CD7F32",
        bg: "rgba(205, 127, 50, 0.16)",
        border: "1px solid rgba(205, 127, 50, 0.42)",
      };
    }
    return {
      color: "var(--text-muted)",
      bg: "transparent",
      border: "1px solid transparent",
    };
  };

  return (
    <div className="view-transition px-4 pt-4 pb-8 space-y-4 max-w-xl mx-auto">
      <div className="atp-card overflow-hidden">
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div>
            <h1 className="font-display font-black text-lg sm:text-xl tracking-tight">
              Ranking Oficial Huancayo
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Clasificación en vivo · Top 8 de cada categoría clasifica al Master
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onSelectPlayerForH2H &&
              onSelectPlayerForH2H(currentUser || activePlayers[0], activePlayers[1])
            }
            className="touch-btn px-3 py-2 rounded-xl font-display font-extrabold text-xs flex-shrink-0"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-player)",
            }}
          >
            Head2Head
          </button>
        </div>

        <div
          className="grid grid-cols-2 px-5"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <button
            type="button"
            onClick={() => setViewMode("jugadores")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color:
                viewMode === "jugadores"
                  ? "var(--text-main)"
                  : "var(--text-muted)",
            }}
          >
            Individual ({filteredPlayers.length})
            {viewMode === "jugadores" && (
              <span
                className="absolute bottom-0 inset-x-6 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode("clubes")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color:
                viewMode === "clubes"
                  ? "var(--text-main)"
                  : "var(--text-muted)",
            }}
          >
            Clubes Oficiales ({clubs.length})
            {viewMode === "clubes" && (
              <span
                className="absolute bottom-0 inset-x-6 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>
        </div>

        {viewMode === "jugadores" ? (
          <>
            <div
              className="p-4 space-y-3"
              style={{ borderBottom: "1px solid var(--border-hairline)" }}
            >
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className="px-3.5 py-1.5 rounded-full font-display font-extrabold text-xs whitespace-nowrap transition-all"
                  style={{
                    background:
                      selectedCategory === "ALL"
                        ? "var(--electric)"
                        : "var(--bg-subtle)",
                    color:
                      selectedCategory === "ALL"
                        ? "#FFFFFF"
                        : "var(--text-main)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  Todas
                </button>

                {[...CATEGORIES_PROGRESSIVE].reverse().map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className="px-3.5 py-1.5 rounded-full font-display font-extrabold text-xs whitespace-nowrap transition-all"
                      style={{
                        background: active ? cat.color : "var(--bg-subtle)",
                        color: active ? "#FFFFFF" : "var(--text-main)",
                        border: `1px solid ${active ? cat.color : "var(--border-hairline)"}`,
                      }}
                    >
                      {cat.short}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div
                  className="sm:col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <Icons.Search size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar tenista en el ranking..."
                    className="w-full bg-transparent text-xs focus:outline-none"
                    style={{ color: "var(--text-main)" }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-xs font-bold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={selectedClubFilter}
                  onChange={(e) => setSelectedClubFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="ALL">Todos los Clubes</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
                  <option value="individual">Independientes</option>
                </select>
              </div>
            </div>

            <div
              className="px-4 py-2.5 grid grid-cols-12 items-center text-[10px] font-extrabold uppercase tracking-wider"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border-hairline)",
              }}
            >
              <div className="col-span-2">Pos.</div>
              <div className="col-span-6">Tenista / Categoría</div>
              <div className="col-span-2 text-right">Puntos</div>
              <div className="col-span-2 text-right">Acción</div>
            </div>

            <div>
              {filteredPlayers.length === 0 ? (
                <div
                  className="p-8 text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  No se encontraron jugadores con ese criterio de búsqueda.
                </div>
              ) : (
                filteredPlayers.map((p, index) => {
                  const posInView = index + 1;
                  const catInfo = getCategoryByElo(p.elo, p.seasonMatches);
                  const clubObj = getClubById(p.clubId, clubs);
                  const isMe = currentUser?.id === p.id;
                  const rankBadge = getRankBadgeStyle(posInView);
                  const qualifiesTop8 = posInView <= 8 && (p.seasonMatches || 0) >= 4;

                  return (
                    <div
                      key={p.id}
                      onClick={() =>
                        onSelectPlayerForH2H &&
                        onSelectPlayerForH2H(currentUser || activePlayers[0], p)
                      }
                      className="atp-hairline-row px-4 py-3 grid grid-cols-12 items-center gap-2 cursor-pointer transition-colors hover:bg-white/[0.03]"
                      style={{
                        background: isMe ? "var(--bg-subtle)" : "transparent",
                      }}
                    >
                      <div className="col-span-2 flex flex-col items-start justify-center">
                        <span
                          className="w-7 h-7 rounded-lg font-display font-black text-xs flex items-center justify-center tabular-nums"
                          style={rankBadge}
                        >
                          {posInView}
                        </span>
                        {p.lastDelta !== undefined && p.lastDelta !== 0 && (
                          <span
                            className="text-[10px] font-extrabold tabular-nums mt-0.5"
                            style={{
                              color:
                                p.lastDelta > 0
                                  ? "var(--emerald)"
                                  : "var(--crimson)",
                            }}
                          >
                            {p.lastDelta > 0
                              ? `▲ +${p.lastDelta}`
                              : `▼ ${p.lastDelta}`}
                          </span>
                        )}
                      </div>

                      <div className="col-span-6 flex items-center gap-2.5 min-w-0">
                        <LaurelAvatar
                          src={p.avatar}
                          name={p.name}
                          rank={posInView <= 3 ? posInView : null}
                          size={38}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="font-display font-extrabold text-xs sm:text-sm truncate"
                              style={{ color: "var(--text-player)" }}
                            >
                              {p.name}
                            </span>
                            {clubObj && (
                              <SafeImage
                                src={clubObj.shield}
                                alt={clubObj.shortName}
                                circular
                                style={{ width: 15, height: 15 }}
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-extrabold"
                              style={{
                                background: catInfo.bg,
                                color: catInfo.color,
                              }}
                            >
                              {catInfo.short}
                            </span>
                            <span
                              className="text-[10px] tabular-nums"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {p.wins}V-{p.losses}D
                            </span>
                            {qualifiesTop8 && (
                              <span
                                className="text-[9px] font-extrabold uppercase px-1.5 rounded"
                                style={{
                                  background: "var(--gold-bg)",
                                  color: "var(--gold)",
                                }}
                              >
                                Top 8
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        <div className="font-display font-black text-sm sm:text-base tabular-nums">
                          {Number(p.elo).toLocaleString("es-PE")}
                        </div>
                        <div
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Pts
                        </div>
                      </div>

                      <div
                        className="col-span-2 flex justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isMe ? (
                          <span
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Perfil
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              onLaunchChallenge && onLaunchChallenge(p)
                            }
                            className="touch-btn px-2.5 py-1.5 rounded-xl font-display font-extrabold text-[11px]"
                            style={{
                              minHeight: 34,
                              background: "#D6FF00",
                              color: "#0A1633",
                            }}
                          >
                            Retar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
            {clubsStandings.map((c, idx) => {
              const pos = idx + 1;
              const badge = getRankBadgeStyle(pos);
              return (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-7 h-7 rounded-lg font-display font-black text-xs flex items-center justify-center flex-shrink-0"
                      style={badge}
                    >
                      {pos}
                    </span>
                    <LaurelAvatar
                      src={c.shield}
                      name={c.name}
                      rank={pos <= 3 ? pos : null}
                      size={40}
                    />
                    <div className="min-w-0">
                      <div className="font-display font-extrabold text-sm truncate">
                        {c.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {c.membersCount} tenistas activos · {c.totalWins} victorias
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-display font-black text-base tabular-nums">
                      {c.totalPoints.toLocaleString("es-PE")} Pts
                    </div>
                    <div
                      className="text-[11px] font-semibold tabular-nums"
                      style={{ color: "var(--text-player)" }}
                    >
                      Prom: {c.avgPoints} ELO
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 26. VISTA PRINCIPAL: CENTRAL DE RETOS & MODO ÁRBITRO OFICIAL ITF/ATP
//     - Tope estricto por set (6-0 a 6-4, 7-5 o 7-6)
//     - En 6-6 de Set 1 o Set 2 se abre automáticamente el Tie-Break a 7 puntos
//       con diferencia mínima de 2 (7-5, 8-6, 10-8...), cerrando en 7-6(x)
//     - En empate 1-1 de sets se abre automáticamente el 3er Set Super Tie-Break
//       a 10 puntos con diferencia mínima de 2 (10-8, 12-10...)
// ============================================================================
export const ChallengesCenterView = ({
  challenges = [],
  players = [],
  currentUser,
  clubs = HUANCAYO_CLUBS,
  onOpenNewChallengeModal,
  onOpenOfficialScoreModal,
  onAcceptChallenge,
  onRejectChallenge,
  onUpdateLiveRefereeScore,
  onFinalizeRefereeMatchPendingReview,
  onOpenHeadToHead,
}) => {
  const [subTab, setSubTab] = useState("cartelera");
  const [timeFilter, setTimeFilter] = useState("ALL");

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
        if (timeFilter === "ALL") return true;
        const slotObj = TIME_SLOT_OPTIONS.find((s) => s.id === timeFilter);
        if (!slotObj) return true;
        return (p.availableSlots || []).includes(slotObj.hours);
      });
  }, [players, currentUser, timeFilter]);

  // Evaluador de un Set Regular (Set 1 o Set 2) con detección de Tie-Break en 6-6
  const evaluateSetState = (gA, gB, tbA = 0, tbB = 0) => {
    const a = Number(gA || 0);
    const b = Number(gB || 0);
    const tA = Number(tbA || 0);
    const tB = Number(tbB || 0);

    // Ganado en games regulares (6-0 a 6-4 o 7-5)
    if ((a === 6 && b <= 4) || (a === 7 && b === 5)) {
      return {
        finished: true,
        winner: "A",
        inTieBreak: false,
        label: `${a}-${b}`,
      };
    }
    if ((b === 6 && a <= 4) || (b === 7 && a === 5)) {
      return {
        finished: true,
        winner: "B",
        inTieBreak: false,
        label: `${a}-${b}`,
      };
    }

    // Ganado por Tie-Break cerrado (7-6 o 6-7)
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

    // En 6-6 se juega obligatoriamente Tie-Break a 7 puntos con diferencia mínima de 2
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

    return {
      finished: false,
      winner: null,
      inTieBreak: false,
      label: `${a}-${b}`,
    };
  };

  // Analiza el estado completo del partido en vivo bajo reglamento ITF/ATP
  const analyzeRefereeMatch = (ls = {}) => {
    const set1 = evaluateSetState(ls.s1A, ls.s1B, ls.tb1A, ls.tb1B);
    const set2 = evaluateSetState(ls.s2A, ls.s2B, ls.tb2A, ls.tb2B);

    // Si Set 1 aún no termina, estamos en Set 1
    if (!set1.finished) {
      return {
        matchFinished: false,
        winnerSide: null,
        activePhase: set1.inTieBreak ? "SET1_TB" : "SET1_GAMES",
        phaseTitle: set1.inTieBreak
          ? "Set 1 · Tie-Break en curso (a 7 pts, dif. 2)"
          : "Set 1 en juego",
        unitLabel: set1.inTieBreak ? "Punto TB" : "Game",
        fieldA: set1.inTieBreak ? "tb1A" : "s1A",
        fieldB: set1.inTieBreak ? "tb1B" : "s1B",
        set1,
        set2,
      };
    }

    // Si Set 1 terminó pero Set 2 aún no termina, estamos en Set 2
    if (!set2.finished) {
      return {
        matchFinished: false,
        winnerSide: null,
        activePhase: set2.inTieBreak ? "SET2_TB" : "SET2_GAMES",
        phaseTitle: set2.inTieBreak
          ? "Set 2 · Tie-Break en curso (a 7 pts, dif. 2)"
          : "Set 2 en juego",
        unitLabel: set2.inTieBreak ? "Punto TB" : "Game",
        fieldA: set2.inTieBreak ? "tb2A" : "s2A",
        fieldB: set2.inTieBreak ? "tb2B" : "s2B",
        set1,
        set2,
      };
    }

    // Ambos sets (1 y 2) terminaron: verificamos si alguien ganó 2-0
    if (set1.winner === set2.winner) {
      return {
        matchFinished: true,
        winnerSide: set1.winner,
        activePhase: "FINISHED_2_SETS",
        phaseTitle: "Partido concluido en 2 sets",
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
        phaseTitle: "Partido concluido en Super Tie-Break",
        scoreString: `${set1.label}, ${set2.label}, [${stbA}-${stbB}]`,
        set1,
        set2,
      };
    }

    return {
      matchFinished: false,
      winnerSide: null,
      activePhase: "SET3_STB",
      phaseTitle: "3er Set · Super Tie-Break (a 10 pts, dif. mínima 2)",
      unitLabel: "Punto Super TB",
      fieldA: "stbA",
      fieldB: "stbB",
      set1,
      set2,
    };
  };

  // Manejador inteligente al pulsar +1 o -1 en el Modo Árbitro
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

    // Aplicamos el cambio del punto o game
    onUpdateLiveRefereeScore(ch.id, targetField, delta);

    // Simulamos cómo queda el marcador tras este toque para cerrar Tie-Break o avanzar de set automáticamente
    const nextLs = { ...ls, [targetField]: Math.max(0, currentVal + delta) };

    // Si estábamos en Tie-Break de Set 1 y este punto lo cierra (>=7 y dif >=2), subimos el game a 7-6 y pasamos al Set 2
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

    // Si estábamos en Tie-Break de Set 2 y este punto lo cierra (>=7 y dif >=2), subimos el game a 7-6
    if (status.activePhase === "SET2_TB" && delta > 0) {
      const tA = Number(nextLs.tb2A || 0);
      const tB = Number(nextLs.tb2B || 0);
      if (Math.max(tA, tB) >= 7 && Math.abs(tA - tB) >= 2) {
        if (tA > tB) onUpdateLiveRefereeScore(ch.id, "s2A", 1);
        else onUpdateLiveRefereeScore(ch.id, "s2B", 1);
      }
    }

    // Sincronizamos el número de set activo visual (1, 2 o 3)
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
    <div className="view-transition px-4 pt-4 pb-8 space-y-4 max-w-xl mx-auto">
      <div className="atp-card p-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-lg sm:text-xl leading-tight">
            Central de Retos
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Partidos en juego, desafíos confirmados y búsqueda por horario
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewChallengeModal && onOpenNewChallengeModal(null)}
          className="touch-btn px-4 py-2.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider flex-shrink-0"
          style={{
            background: "#D6FF00",
            color: "#0A1633",
            boxShadow: "0 6px 18px rgba(214, 255, 0, 0.2)",
          }}
        >
          + Lanzar Reto
        </button>
      </div>

      <div className="atp-card overflow-hidden">
        <div
          className="grid grid-cols-2 px-4"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <button
            type="button"
            onClick={() => setSubTab("cartelera")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color:
                subTab === "cartelera"
                  ? "var(--text-main)"
                  : "var(--text-muted)",
            }}
          >
            Cartelera ({liveMatches.length + confirmedMatches.length})
            {subTab === "cartelera" && (
              <span
                className="absolute bottom-0 inset-x-6 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("mis_duelos")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color:
                subTab === "mis_duelos"
                  ? "var(--text-main)"
                  : "var(--text-muted)",
            }}
          >
            Rivales por Horario
            {subTab === "mis_duelos" && (
              <span
                className="absolute bottom-0 inset-x-6 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>
        </div>

        {subTab === "cartelera" ? (
          <div className="p-4 space-y-4">
            {/* 1. Retos Pendientes Recibidos */}
            {myPendingIncoming.map((ch) => {
              const challenger = players.find((p) => p.id === ch.challengerId);
              return (
                <div
                  key={ch.id}
                  className="rounded-2xl p-4 space-y-3"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1.5px solid #D6FF00",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                      style={{ background: "#D6FF00", color: "#0A1633" }}
                    >
                      Desafío Recibido
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {ch.dateTimeLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <SafeImage
                      src={challenger?.avatar}
                      alt={challenger?.name}
                      circular
                      style={{ width: 46, height: 46 }}
                    />
                    <div className="min-w-0">
                      <div className="font-display font-extrabold text-sm truncate">
                        {challenger?.name} vs. {currentUser?.name}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: "var(--clay)" }}
                      >
                        {ch.customClubName} · {ch.ballAgreement}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onAcceptChallenge && onAcceptChallenge(ch.id)}
                      className="touch-btn py-2.5 rounded-xl font-display font-extrabold text-xs"
                      style={{ background: "#D6FF00", color: "#0A1633" }}
                    >
                      Aceptar Reto
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectChallenge && onRejectChallenge(ch.id)}
                      className="touch-btn py-2.5 rounded-xl font-semibold text-xs border"
                      style={{
                        borderColor: "var(--border-strong)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Declinar
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 2. Partidos EN JUEGO AHORA (Con Tie-Break a 7 y Super Tie-Break a 10) */}
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
                <div
                  key={ch.id}
                  className="rounded-2xl p-4 space-y-4"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  {/* Cabecera Limpia: "En juego ahora" + Nombre Oficial del Club */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold"
                      style={{
                        background: "var(--emerald-bg)",
                        color: "var(--emerald)",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ background: "var(--emerald)" }}
                      />
                      En juego ahora
                    </span>

                    <span
                      className="text-xs font-bold truncate"
                      style={{ color: "var(--clay)" }}
                    >
                      {ch.customClubName}
                    </span>
                  </div>

                  {/* Enfrentamiento Central Limpio: Jugador A — VS — Jugador B */}
                  <div className="grid grid-cols-7 items-center gap-2">
                    <div
                      onClick={() =>
                        onOpenHeadToHead && onOpenHeadToHead(pA, pB)
                      }
                      className="col-span-3 flex items-center gap-2.5 min-w-0 cursor-pointer"
                    >
                      <SafeImage
                        src={pA?.avatar}
                        alt={pA?.name}
                        circular
                        style={{ width: 44, height: 44 }}
                      />
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                          {pA?.name}
                        </div>
                        <div
                          className="text-[11px] flex items-center gap-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {clubA && (
                            <SafeImage
                              src={clubA.shield}
                              alt={clubA.shortName}
                              circular
                              style={{ width: 13, height: 13 }}
                            />
                          )}
                          <span>{pA?.elo} Pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <span
                        className="font-display font-black text-xs px-2 py-1 rounded-lg"
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-hairline)",
                        }}
                      >
                        VS
                      </span>
                    </div>

                    <div
                      onClick={() =>
                        onOpenHeadToHead && onOpenHeadToHead(pA, pB)
                      }
                      className="col-span-3 flex items-center justify-end gap-2.5 min-w-0 text-right cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                          {pB?.name}
                        </div>
                        <div
                          className="text-[11px] flex items-center justify-end gap-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span>{pB?.elo} Pts</span>
                          {clubB && (
                            <SafeImage
                              src={clubB.shield}
                              alt={clubB.shortName}
                              circular
                              style={{ width: 13, height: 13 }}
                            />
                          )}
                        </div>
                      </div>
                      <SafeImage
                        src={pB?.avatar}
                        alt={pB?.name}
                        circular
                        style={{ width: 44, height: 44 }}
                      />
                    </div>
                  </div>

                  {/* Tablero de Sets + Tie-Break (7 pts) + Super Tie-Break (10 pts) */}
                  <div
                    className="rounded-xl p-3 space-y-2"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    <div
                      className="grid grid-cols-12 items-center text-[10px] font-extrabold uppercase pb-1 border-b"
                      style={{
                        borderColor: "var(--border-hairline)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <div className="col-span-6">{matchState.phaseTitle}</div>
                      <div className="col-span-2 text-center">Set 1</div>
                      <div className="col-span-2 text-center">Set 2</div>
                      <div className="col-span-2 text-center">
                        {showStbColumn ? "STB [10]" : "Set 3"}
                      </div>
                    </div>

                    {/* Fila Jugador A */}
                    <div className="grid grid-cols-12 items-center text-xs font-bold py-1">
                      <div className="col-span-6 truncate">{pA?.name}</div>
                      <div className="col-span-2 text-center tabular-nums">
                        {ls.s1A}
                        {(matchState.set1.inTieBreak ||
                          (ls.s1A === 7 && ls.s1B === 6) ||
                          (ls.s1B === 7 && ls.s1A === 6)) && (
                          <sup
                            className="ml-0.5 text-[10px] font-extrabold"
                            style={{ color: "var(--gold)" }}
                          >
                            ({ls.tb1A || 0})
                          </sup>
                        )}
                      </div>
                      <div
                        className="col-span-2 text-center tabular-nums"
                        style={{ color: "var(--electric)" }}
                      >
                        {ls.s2A}
                        {(matchState.set2.inTieBreak ||
                          (ls.s2A === 7 && ls.s2B === 6) ||
                          (ls.s2B === 7 && ls.s2A === 6)) && (
                          <sup
                            className="ml-0.5 text-[10px] font-extrabold"
                            style={{ color: "var(--gold)" }}
                          >
                            ({ls.tb2A || 0})
                          </sup>
                        )}
                      </div>
                      <div
                        className="col-span-2 text-center tabular-nums font-extrabold"
                        style={{
                          color: showStbColumn
                            ? "var(--gold)"
                            : "var(--text-muted)",
                        }}
                      >
                        {showStbColumn ? ls.stbA || 0 : "-"}
                      </div>
                    </div>

                    {/* Fila Jugador B */}
                    <div
                      className="grid grid-cols-12 items-center text-xs font-bold py-1 border-t"
                      style={{ borderColor: "var(--border-hairline)" }}
                    >
                      <div className="col-span-6 truncate">{pB?.name}</div>
                      <div className="col-span-2 text-center tabular-nums">
                        {ls.s1B}
                        {(matchState.set1.inTieBreak ||
                          (ls.s1A === 7 && ls.s1B === 6) ||
                          (ls.s1B === 7 && ls.s1A === 6)) && (
                          <sup
                            className="ml-0.5 text-[10px] font-extrabold"
                            style={{ color: "var(--gold)" }}
                          >
                            ({ls.tb1B || 0})
                          </sup>
                        )}
                      </div>
                      <div
                        className="col-span-2 text-center tabular-nums"
                        style={{ color: "var(--electric)" }}
                      >
                        {ls.s2B}
                        {(matchState.set2.inTieBreak ||
                          (ls.s2A === 7 && ls.s2B === 6) ||
                          (ls.s2B === 7 && ls.s2A === 6)) && (
                          <sup
                            className="ml-0.5 text-[10px] font-extrabold"
                            style={{ color: "var(--gold)" }}
                          >
                            ({ls.tb2B || 0})
                          </sup>
                        )}
                      </div>
                      <div
                        className="col-span-2 text-center tabular-nums font-extrabold"
                        style={{
                          color: showStbColumn
                            ? "var(--gold)"
                            : "var(--text-muted)",
                        }}
                      >
                        {showStbColumn ? ls.stbB || 0 : "-"}
                      </div>
                    </div>
                  </div>

                  {/* Controles Inteligentes del Modo Árbitro */}
                  {!ls.liveFinishedPendingReview ? (
                    <div className="space-y-2.5">
                      {!matchState.matchFinished ? (
                        <>
                          {/* Banner visual cuando entra a Tie-Break (6-6) o Super Tie-Break (1-1) */}
                          {(matchState.activePhase === "SET1_TB" ||
                            matchState.activePhase === "SET2_TB" ||
                            matchState.activePhase === "SET3_STB") && (
                            <div
                              className="rounded-xl px-3 py-2 flex items-center justify-between text-xs font-extrabold"
                              style={{
                                background: "var(--gold-bg)",
                                color: "var(--gold)",
                                border: "1px solid var(--gold-border)",
                              }}
                            >
                              <span>{matchState.phaseTitle}</span>
                              <span className="font-mono-code text-sm">
                                {matchState.activePhase === "SET1_TB"
                                  ? `${ls.tb1A || 0} - ${ls.tb1B || 0}`
                                  : matchState.activePhase === "SET2_TB"
                                  ? `${ls.tb2A || 0} - ${ls.tb2B || 0}`
                                  : `${ls.stbA || 0} - ${ls.stbB || 0}`}
                              </span>
                            </div>
                          )}

                          {/* Botones +1 y -1 (Corrección) para cada Jugador */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRefereeStep(ch, "A", 1)}
                                className="touch-btn flex-1 py-2.5 px-2.5 rounded-xl text-xs font-extrabold border"
                                style={{
                                  minHeight: 40,
                                  background: "var(--bg-card)",
                                  borderColor: "var(--border-strong)",
                                }}
                              >
                                +1 {matchState.unitLabel} {pA?.name.split(" ")[0]}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRefereeStep(ch, "A", -1)}
                                className="touch-btn px-2.5 rounded-xl text-xs font-bold border"
                                style={{
                                  minHeight: 40,
                                  background: "var(--bg-subtle)",
                                  borderColor: "var(--border-hairline)",
                                  color: "var(--text-muted)",
                                }}
                                title="Restar 1 si hubo error"
                              >
                                -1
                              </button>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRefereeStep(ch, "B", 1)}
                                className="touch-btn flex-1 py-2.5 px-2.5 rounded-xl text-xs font-extrabold border"
                                style={{
                                  minHeight: 40,
                                  background: "var(--bg-card)",
                                  borderColor: "var(--border-strong)",
                                }}
                              >
                                +1 {matchState.unitLabel} {pB?.name.split(" ")[0]}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRefereeStep(ch, "B", -1)}
                                className="touch-btn px-2.5 rounded-xl text-xs font-bold border"
                                style={{
                                  minHeight: 40,
                                  background: "var(--bg-subtle)",
                                  borderColor: "var(--border-hairline)",
                                  color: "var(--text-muted)",
                                }}
                                title="Restar 1 si hubo error"
                              >
                                -1
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() =>
                              onFinalizeRefereeMatchPendingReview &&
                              onFinalizeRefereeMatchPendingReview(
                                ch.id,
                                matchState.scoreString
                              )
                            }
                            className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                            style={{
                              background: "var(--emerald)",
                              color: "#FFFFFF",
                            }}
                          >
                            Finalizar Partido (Pendiente de Revisión ·{" "}
                            {matchState.scoreString})
                          </button>
                        </div>
                      )}

                      <div
                        className="flex items-center justify-between text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span>
                          Árbitro en cancha: {ch.refereeName || "Comunidad"} ·{" "}
                          {ch.refereeUpdatedAt || "En directo"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl p-3 text-xs font-semibold flex items-center justify-between"
                      style={{
                        background: "var(--gold-bg)",
                        color: "var(--gold)",
                        border: "1px solid var(--gold-border)",
                      }}
                    >
                      <span>
                        Partido finalizado por árbitro ({ch.proposedScore}) ·
                        Pendiente de revisión
                      </span>
                    </div>
                  )}

                  {isParticipant && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenOfficialScoreModal && onOpenOfficialScoreModal(ch)
                      }
                      className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                      style={{ background: "#D6FF00", color: "#0A1633" }}
                    >
                      Subir Marcador Oficial
                    </button>
                  )}
                </div>
              );
            })}

            {/* 3. Duelos Confirmados Programados */}
            {confirmedMatches.map((ch) => {
              const pA = players.find((p) => p.id === ch.challengerId);
              const pB = players.find((p) => p.id === ch.challengedId);
              const isParticipant =
                currentUser?.id === pA?.id || currentUser?.id === pB?.id;

              return (
                <div
                  key={ch.id}
                  className="rounded-2xl p-4 space-y-3.5"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                      style={{
                        background: ch.isFriendly
                          ? "rgba(2, 132, 199, 0.16)"
                          : "var(--emerald-bg)",
                        color: ch.isFriendly ? "#0284C7" : "var(--emerald)",
                      }}
                    >
                      {ch.isFriendly ? "Duelo Amistoso H2H" : "Duelo Confirmado"}
                    </span>

                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {ch.dateTimeLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 items-center gap-2">
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                      <SafeImage
                        src={pA?.avatar}
                        alt={pA?.name}
                        circular
                        style={{ width: 42, height: 42 }}
                      />
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                          {pA?.name}
                        </div>
                        <div
                          className="text-[11px] tabular-nums"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {pA?.elo} Pts
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <span className="font-display font-black text-xs">VS</span>
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-2.5 min-w-0 text-right">
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                          {pB?.name}
                        </div>
                        <div
                          className="text-[11px] tabular-nums"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {pB?.elo} Pts
                        </div>
                      </div>
                      <SafeImage
                        src={pB?.avatar}
                        alt={pB?.name}
                        circular
                        style={{ width: 42, height: 42 }}
                      />
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between text-xs pt-2 border-t"
                    style={{ borderColor: "var(--border-hairline)" }}
                  >
                    <span className="font-bold" style={{ color: "var(--clay)" }}>
                      {ch.customClubName}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {ch.ballAgreement}
                    </span>
                  </div>

                  {isParticipant && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenOfficialScoreModal && onOpenOfficialScoreModal(ch)
                      }
                      className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                      style={{ background: "#D6FF00", color: "#0A1633" }}
                    >
                      Subir Marcador Oficial
                    </button>
                  )}
                </div>
              );
            })}

            {myPendingOutgoing.length > 0 && (
              <div className="pt-2 space-y-2">
                <div
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Retos Enviados Esperando Respuesta
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
                        <div className="font-display font-bold text-xs sm:text-sm truncate">
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
                        href={`https://wa.me/51${rival?.phone || "964112233"}?text=${encodeURIComponent(
                          `Hola ${rival?.name}, te envié un desafío en MATCHPOINT para jugar en ${ch.customClubName} (${ch.dateTimeLabel}).`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="touch-btn px-3 py-1.5 rounded-xl text-xs font-extrabold flex-shrink-0"
                        style={{
                          minHeight: 34,
                          background: "var(--emerald)",
                          color: "#FFFFFF",
                        }}
                      >
                        Avisar WA
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setTimeFilter("ALL")}
                className="px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap"
                style={{
                  background:
                    timeFilter === "ALL"
                      ? "var(--electric)"
                      : "var(--bg-subtle)",
                  color:
                    timeFilter === "ALL" ? "#FFFFFF" : "var(--text-main)",
                }}
              >
                Todos los Horarios
              </button>
              {TIME_SLOT_OPTIONS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setTimeFilter(slot.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap"
                  style={{
                    background:
                      timeFilter === slot.id
                        ? "var(--electric)"
                        : "var(--bg-subtle)",
                    color:
                      timeFilter === slot.id ? "#FFFFFF" : "var(--text-main)",
                  }}
                >
                  {slot.label} ({slot.hours})
                </button>
              ))}
            </div>

            <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
              {availableRivals.map((rival) => {
                const cat = getCategoryByElo(rival.elo, rival.seasonMatches);
                const gap = Math.abs((currentUser?.elo || 1000) - rival.elo);
                const isFriendlyGap = gap > ELO_CONSTANTS.MAX_OFFICIAL_GAP;

                return (
                  <div
                    key={rival.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SafeImage
                        src={rival.avatar}
                        alt={rival.name}
                        circular
                        style={{ width: 42, height: 42 }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-xs sm:text-sm truncate">
                            {rival.name}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-extrabold"
                            style={{ background: cat.bg, color: cat.color }}
                          >
                            {cat.short} · {rival.elo}
                          </span>
                        </div>
                        <div
                          className="text-[11px] truncate mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Días: {(rival.availableDays || []).join(", ")} ·{" "}
                          {(rival.availableSlots || []).join(" / ")}
                        </div>
                        {rival.lookingForMatchToday && (
                          <div
                            className="text-[10px] font-bold mt-0.5"
                            style={{ color: "var(--emerald)" }}
                          >
                            Disponible hoy: {rival.lookingForMatchNote || "Cancha lista"}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenNewChallengeModal && onOpenNewChallengeModal(rival)
                      }
                      className="touch-btn px-3 py-2 rounded-xl font-display font-extrabold text-xs flex-shrink-0"
                      style={{
                        minHeight: 36,
                        background: isFriendlyGap
                          ? "var(--bg-subtle)"
                          : "#D6FF00",
                        color: isFriendlyGap ? "var(--text-main)" : "#0A1633",
                        border: isFriendlyGap
                          ? "1px solid var(--border-strong)"
                          : "none",
                      }}
                    >
                      {isFriendlyGap ? "Amistoso" : "Retar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 7 DE 10 ===

// === INICIO DEL BLOQUE 8 DE 10 ===

// ============================================================================
// 27. VISTA PRINCIPAL: SEDES & COACH PRO (EXPORTADA CON EL NOMBRE EXACTO
//     SedesAndCoachProView QUE LLAMA EL BLOQUE 10)
// ============================================================================
export const SedesAndCoachProView = ({
  clubs = HUANCAYO_CLUBS,
  coaches = INITIAL_COACHES,
  currentUser,
  liveWeather = { temp: 19, uv: 8 },
  surfaceWeatherStates = SURFACE_WEATHER_STATES,
  onUpdateSurfaceWeather,
  onOpenClubDetailModal,
  onOpenCoachProfileModal,
}) => {
  const [subTab, setSubTab] = useState("sedes"); // 'sedes' | 'coaches'

  return (
    <div className="view-transition px-4 pt-4 pb-8 space-y-4 max-w-xl mx-auto">
      {/* Cabecera con Clima e Índice UV de Huancayo en Tiempo Real */}
      <div className="atp-card p-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-lg sm:text-xl leading-tight">
            Sedes & Entrenadores
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Estado de canchas de arcilla, Google Maps y Coach Pro
          </p>
        </div>

        <div
          className="px-3 py-2 rounded-2xl text-right flex-shrink-0"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <div className="font-display font-black text-sm tabular-nums">
            {liveWeather?.temp ?? 19}°C · Huancayo
          </div>
          <div
            className="text-[10px] font-extrabold uppercase"
            style={{ color: "var(--gold)" }}
          >
            Índice UV {liveWeather?.uv ?? 8}
          </div>
        </div>
      </div>

      {/* Pestañas Subrayadas */}
      <div className="atp-card overflow-hidden">
        <div
          className="grid grid-cols-2 px-4"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <button
            type="button"
            onClick={() => setSubTab("sedes")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color: subTab === "sedes" ? "var(--text-main)" : "var(--text-muted)",
            }}
          >
            Sedes Oficiales ({clubs.length})
            {subTab === "sedes" && (
              <span
                className="absolute bottom-0 inset-x-6 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("coaches")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color: subTab === "coaches" ? "var(--text-main)" : "var(--text-muted)",
            }}
          >
            Coach Pro ({coaches.length})
            {subTab === "coaches" && (
              <span
                className="absolute bottom-0 inset-x-6 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>
        </div>

        {subTab === "sedes" ? (
          <div className="p-4 space-y-4">
            {clubs.map((club) => {
              const weather =
                surfaceWeatherStates.find((w) => w.id === club.surfaceStateId) ||
                surfaceWeatherStates[0];

              return (
                <div
                  key={club.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  {/* Foto Interactiva: al tocar la imagen o el título abre el Pop-up con Blur */}
                  <div
                    onClick={() =>
                      onOpenClubDetailModal && onOpenClubDetailModal(club)
                    }
                    className="h-40 w-full relative cursor-pointer group"
                  >
                    <img
                      src={club.bannerImage}
                      alt={club.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <SafeImage
                        src={club.shield}
                        alt={club.shortName}
                        circular
                        style={{
                          width: 40,
                          height: 40,
                          border: "2px solid rgba(255,255,255,0.85)",
                          background: "#0A1633",
                        }}
                      />
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase"
                        style={{
                          background: "var(--clay)",
                          color: "#FFFFFF",
                        }}
                      >
                        {club.surface}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1.5 shadow-md"
                        style={{
                          background: "rgba(10,22,51,0.88)",
                          color: weather.color,
                        }}
                      >
                        <SafeImage
                          src={weather.icon}
                          alt={weather.shortLabel}
                          style={{ width: 16, height: 16 }}
                        />
                        {weather.shortLabel}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                      <div>
                        <h3 className="font-display font-black text-base sm:text-lg text-white leading-tight">
                          {club.name}
                        </h3>
                        <p className="text-xs text-slate-300 font-medium">
                          {club.zone} · {club.courtsCount} Canchas · Toca para ver instalaciones
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo Limpio de la Sede */}
                  <div className="p-4 space-y-3.5">
                    {/* Selector Rápido de Estado de Cancha por la Comunidad */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className="font-bold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Estado de superficie (Reportado por {club.lastReportBy})
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          {club.lastReportTime}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
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
                              className="py-1.5 px-1.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 border transition-all"
                              style={{
                                background: isCurrent
                                  ? "var(--bg-card)"
                                  : "transparent",
                                borderColor: isCurrent
                                  ? st.color
                                  : "var(--border-hairline)",
                                color: isCurrent ? st.color : "var(--text-muted)",
                              }}
                            >
                              <SafeImage
                                src={st.icon}
                                alt={st.shortLabel}
                                style={{ width: 14, height: 14 }}
                              />
                              <span className="truncate">
                                {st.id === "seco"
                                  ? "Seca"
                                  : st.id === "humedad"
                                  ? "Húmeda"
                                  : st.id === "llovizna"
                                  ? "Llovizna"
                                  : "Lluvia"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Casilla Dorada de Beneficios Exclusivos VIP */}
                    <div
                      onClick={() =>
                        onOpenClubDetailModal && onOpenClubDetailModal(club)
                      }
                      className="rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors hover:bg-white/[0.04]"
                      style={{
                        background: "var(--gold-bg)",
                        border: "1px solid var(--gold-border)",
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SafeImage
                          src={ASSETS.goldenTicket}
                          alt="VIP"
                          style={{ width: 32, height: 32, borderRadius: 8 }}
                        />
                        <div className="min-w-0">
                          <div
                            className="text-[10px] font-extrabold uppercase tracking-wider"
                            style={{ color: "var(--gold)" }}
                          >
                            Beneficios Exclusivos VIP
                          </div>
                          <div
                            className="font-display font-bold text-xs truncate mt-0.5"
                            style={{ color: "var(--text-main)" }}
                          >
                            {club.vipHeadline}
                          </div>
                        </div>
                      </div>
                      <span
                        className="text-xs font-extrabold flex-shrink-0"
                        style={{ color: "var(--gold)" }}
                      >
                        Abrir →
                      </span>
                    </div>

                    {/* Botones: Google Maps Exacto (Sin Waze) + Instalaciones */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={club.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="touch-btn py-2.5 px-3 rounded-xl font-display font-bold text-xs border flex items-center justify-center gap-1.5"
                        style={{
                          borderColor: "var(--border-strong)",
                          color: "var(--text-main)",
                        }}
                      >
                        <Icons.MapPin size={15} />
                        <span>Google Maps</span>
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenClubDetailModal && onOpenClubDetailModal(club)
                        }
                        className="touch-btn py-2.5 px-3 rounded-xl font-display font-extrabold text-xs"
                        style={{ background: "#D6FF00", color: "#0A1633" }}
                      >
                        Instalaciones & VIP
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Marketplace Coach Pro B2B */
          <div className="p-4 space-y-4">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                onClick={() =>
                  onOpenCoachProfileModal && onOpenCoachProfileModal(coach)
                }
                className="rounded-2xl p-4 space-y-3.5 cursor-pointer transition-transform active:scale-[0.99]"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <SafeImage
                      src={coach.avatar}
                      alt={coach.name}
                      circular
                      style={{ width: 54, height: 54 }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {/* Caja 5.0 ★ compacta y proporcionada */}
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1"
                          style={{
                            background: "var(--gold-bg)",
                            color: "var(--gold)",
                            border: "1px solid var(--gold-border)",
                          }}
                        >
                          ★ {coach.rating} ({coach.reviewsCount})
                        </span>
                        <span
                          className="text-xs font-bold truncate"
                          style={{ color: "var(--clay)" }}
                        >
                          {coach.clubName}
                        </span>
                      </div>
                      <h3 className="font-display font-extrabold text-sm sm:text-base mt-1 truncate">
                        {coach.name}
                      </h3>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {coach.specialty}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Precio en tipografía mixta limpia (Sin TODO EN MAYÚSCULAS) */}
                <div
                  className="rounded-xl p-3 flex items-center justify-between text-xs"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {coach.studentsPromoted} alumnos ascendidos
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-sm tabular-nums">
                      {coach.priceLabel}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {coach.unitLabel}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenCoachProfileModal) onOpenCoachProfileModal(coach);
                  }}
                  className="touch-btn w-full py-2.5 rounded-xl font-display font-extrabold text-xs"
                  style={{ background: "#D6FF00", color: "#0A1633" }}
                >
                  Ver Packs, Turnos y Reseñas
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Alias de respaldo para evitar cualquier conflicto de nombre
export const SedesAndCoachView = SedesAndCoachProView;

// ============================================================================
// 28. MODAL DE DETALLE DE SEDE (POP-UP CON BLUR iOS AL TOCAR FOTO O TÍTULO)
// ============================================================================
export const ClubDetailModal = ({ isOpen, onClose, club, onOpenVipModal }) => {
  if (!isOpen || !club) return null;

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-44 w-full relative">
          <img
            src={club.bannerImage}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="touch-btn absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white"
          >
            <Icons.Close size={18} />
          </button>
          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
            <SafeImage
              src={club.shield}
              alt={club.name}
              circular
              style={{
                width: 44,
                height: 44,
                border: "2px solid #FFFFFF",
                background: "#0A1633",
              }}
            />
            <div>
              <h2 className="font-display font-black text-base sm:text-lg text-white">
                {club.name}
              </h2>
              <p className="text-xs text-slate-300">
                {club.address} · {club.courtsCount} Canchas de {club.surface}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Tarjeta Dorada de Beneficios Exclusivos VIP */}
          <div
            className="rounded-2xl p-4 space-y-2.5"
            style={{
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-extrabold uppercase tracking-wider"
                style={{ color: "var(--gold)" }}
              >
                Beneficios Exclusivos Socio VIP
              </span>
              {onOpenVipModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVipModal();
                  }}
                  className="text-[11px] font-extrabold underline"
                  style={{ color: "var(--gold)" }}
                >
                  Ver Carnet VIP
                </button>
              )}
            </div>
            <ul className="space-y-1.5 text-xs">
              {(club.vipBenefitsList || []).map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span style={{ color: "var(--gold)" }}>✓</span>
                  <span style={{ color: "var(--text-main)" }}>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instalaciones y Características del Club */}
          <div className="space-y-2.5">
            <h3
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Instalaciones y Servicios del Club
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {(club.facilities || []).map((fac, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div>
                    <div className="font-display font-bold text-xs">
                      {fac.title}
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {fac.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={club.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="touch-btn py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
              style={{ background: "#D6FF00", color: "#0A1633" }}
            >
              <Icons.MapPin size={15} />
              <span>Google Maps</span>
            </a>

            <a
              href={`https://wa.me/${club.whatsappPhone || "51964112233"}?text=${encodeURIComponent(
                `Hola ${club.name}, vengo de MATCHPOINT y deseo consultar disponibilidad de cancha de arcilla.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="touch-btn py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center"
              style={{ background: "var(--emerald)", color: "#FFFFFF" }}
            >
              Reservar Cancha
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 29. MODAL B2B DE COACH PRO (POP-UP CON BLUR iOS · PIN PRIVADO INDIVIDUAL)
// ============================================================================
export const CoachProProfileModal = ({
  isOpen,
  onClose,
  coach,
  currentUser,
  onSaveCoachProfile,
  onAddCoachReview,
}) => {
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [isCoachEditorOpen, setIsCoachEditorOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(coach?.pricePerHour || 50);
  const [newSlotText, setNewSlotText] = useState("");

  // Estado para dejar reseña verificada
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (coach) {
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
      alert("PIN incorrecto. Cada entrenador tiene su propio PIN privado.");
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
        priceLabel: `Desde S/ ${numPrice}`,
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
        author: currentUser?.name || "Jugador",
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
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-44 w-full relative">
          <img
            src={coach.bannerImage}
            alt={coach.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="touch-btn absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white"
          >
            <Icons.Close size={18} />
          </button>

          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
            <SafeImage
              src={coach.avatar}
              alt={coach.name}
              circular
              style={{ width: 56, height: 56, border: "2px solid #FFFFFF" }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-extrabold"
                  style={{ background: "#D6FF00", color: "#0A1633" }}
                >
                  ★ {coach.rating} ({coach.reviewsCount})
                </span>
                <span className="text-xs text-amber-300 font-bold truncate">
                  {coach.clubName}
                </span>
              </div>
              <h2 className="font-display font-black text-base sm:text-lg text-white truncate mt-0.5">
                {coach.name}
              </h2>
              <p className="text-xs text-slate-300 truncate">{coach.specialty}</p>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {coach.bio}
          </p>

          {/* Reproductor de Video con Texto Limpio ("Ver Video" / "Cerrar Video") */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                setActiveVideoUrl(
                  activeVideoUrl === coach.videoVertical
                    ? null
                    : coach.videoVertical
                )
              }
              className="touch-btn py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
              style={{ background: "var(--electric)", color: "#FFFFFF" }}
            >
              <Icons.Play size={14} />
              <span>
                {activeVideoUrl === coach.videoVertical
                  ? "Cerrar Video"
                  : "Ver Video"}
              </span>
            </button>

            {activeVideoUrl && (
              <div className="rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-64 flex justify-center">
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

          {/* Programas y Packs Oficiales */}
          <div className="space-y-2.5">
            <h3
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Packs & Programas de Entrenamiento
            </h3>

            <div className="space-y-2.5">
              {(coach.packages || []).map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl p-3.5 space-y-2"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                      style={{
                        background: "var(--gold-bg)",
                        color: "var(--gold)",
                      }}
                    >
                      {pkg.badge}
                    </span>
                    <div className="text-right">
                      <span className="font-display font-black text-sm tabular-nums">
                        S/ {pkg.price}
                      </span>
                      {pkg.vipPrice && (
                        <span
                          className="block text-[10px] font-bold"
                          style={{ color: "var(--gold)" }}
                        >
                          Socio VIP: S/ {pkg.vipPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-display font-bold text-xs sm:text-sm">
                    {pkg.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {pkg.description}
                  </div>

                  <a
                    href={`https://wa.me/${coach.phone}?text=${encodeURIComponent(
                      `Hola ${coach.name}, vi tu programa "${pkg.name}" (S/ ${pkg.price}) en MATCHPOINT y deseo reservar.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="touch-btn w-full py-2.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider block text-center"
                    style={{ background: "var(--emerald)", color: "#FFFFFF" }}
                  >
                    Reservar Programa por WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Huecos Libres para esta semana (Clic directo a WhatsApp) */}
          <div
            className="rounded-2xl p-4 space-y-2.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <h3 className="font-display font-bold text-xs uppercase tracking-wider">
              Huecos Libres esta Semana (Toca para reservar)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(coach.freeSlots || []).map((slot, idx) => (
                <a
                  key={idx}
                  href={`https://wa.me/${coach.phone}?text=${encodeURIComponent(
                    `Hola ${coach.name}, quiero separar el turno libre del ${slot} en ${coach.clubName}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold tabular-nums transition-transform active:scale-95"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--text-player)",
                  }}
                >
                  {slot}
                </a>
              ))}
            </div>
          </div>

          {/* Reseñas de Alumnos del Circuito */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3
                className="text-xs font-extrabold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Reseñas de Alumnos ({(coach.reviews || []).length})
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="text-xs font-extrabold"
                style={{ color: "var(--text-player)" }}
              >
                {showReviewForm ? "Cancelar" : "+ Dejar Reseña"}
              </button>
            </div>

            {showReviewForm && (
              <form
                onSubmit={handleSubmitReview}
                className="rounded-2xl p-3.5 space-y-2.5"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Comparte tu experiencia entrenando en cancha..."
                  className="w-full p-2.5 rounded-xl text-xs focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-main)",
                  }}
                />
                <button
                  type="submit"
                  className="touch-btn w-full py-2 rounded-xl font-display font-extrabold text-xs"
                  style={{ background: "#D6FF00", color: "#0A1633" }}
                >
                  Publicar Reseña
                </button>
              </form>
            )}

            <div className="space-y-2">
              {(coach.reviews || []).map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl p-3 space-y-1"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">
                      {rev.author} ·{" "}
                      <span style={{ color: "var(--text-player)" }}>
                        {rev.category}
                      </span>
                    </span>
                    <span style={{ color: "var(--gold)" }}>★★★★★</span>
                  </div>
                  <p
                    className="text-xs leading-snug"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Acceso Exclusivo con PIN Individual por Profesor */}
          <div
            className="pt-3 border-t"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            {!isCoachEditorOpen && !showPinAuth ? (
              <button
                type="button"
                onClick={() => setShowPinAuth(true)}
                className="text-xs font-bold flex items-center gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <Icons.Lock size={14} />
                <span>Acceso Profesor ({coach.name}) · Editar Turnos y Tarifa</span>
              </button>
            ) : showPinAuth ? (
              <form
                onSubmit={handleVerifyPin}
                className="rounded-2xl p-3.5 space-y-2.5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-strong)",
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
                    className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                  <button
                    type="submit"
                    className="touch-btn px-4 py-2 rounded-xl text-xs font-extrabold"
                    style={{ background: "#D6FF00", color: "#0A1633" }}
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
                  border: "1px solid var(--emerald)",
                }}
              >
                <div
                  className="font-display font-bold text-xs"
                  style={{ color: "var(--emerald)" }}
                >
                  Panel Privado de {coach.name} Activo
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    Tarifa base por turno (S/)
                  </label>
                  <input
                    type="number"
                    value={editingPrice}
                    onChange={(e) => setEditingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    Agregar nuevo hueco libre
                  </label>
                  <input
                    type="text"
                    value={newSlotText}
                    onChange={(e) => setNewSlotText(e.target.value)}
                    placeholder="Ej. Vie 17:00 - 18:00"
                    className="w-full px-3 py-2 rounded-xl text-xs"
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
                      className="px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{
                        background: "rgba(244,63,94,0.16)",
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
                  className="touch-btn w-full py-2.5 rounded-xl text-xs font-extrabold"
                  style={{ background: "var(--emerald)", color: "#FFFFFF" }}
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

// === FIN DEL BLOQUE 8 DE 10 ===

// === INICIO DEL BLOQUE 9 DE 10 ===

// ============================================================================
// 30. VISTA PRINCIPAL: TORNEOS OFICIALES & SALÓN DE LA FAMA
//     - Cuadros por categorías (4ª, 5ª, 3ª) con títulos limpios y escudos
//     - Árbol Visual Conectado (Semifinales/Cuartos ➔ Gran Final + Consuelo)
//     - Inscripción mediante Pago (Yape/Plin/BCP) + Aprobación del Admin
//     - CERO avisos o botones expuestos de "Suite Admin" para los jugadores
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
  const [subTab, setSubTab] = useState("torneos"); // 'torneos' | 'salon_fama'
  const [selectedTournamentId, setSelectedTournamentId] = useState(
    tournaments[0]?.id || "tourn_4ta_country"
  );

  const activeTournament =
    tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];

  const getPlayerById = (id) => players.find((p) => p.id === id) || null;

  return (
    <div className="view-transition px-4 pt-4 pb-8 space-y-4 max-w-xl mx-auto">
      {/* Cabecera */}
      <div className="atp-card p-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-lg sm:text-xl leading-tight">
            Torneos & Campeones
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Cuadros oficiales en arcilla, Ronda Consuelo y Salón de la Fama
          </p>
        </div>
      </div>

      {/* Pestañas Subrayadas: Cuadros Activos vs Salón de la Fama */}
      <div className="atp-card overflow-hidden">
        <div
          className="grid grid-cols-2 px-4"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <button
            type="button"
            onClick={() => setSubTab("torneos")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color:
                subTab === "torneos" ? "var(--text-main)" : "var(--text-muted)",
            }}
          >
            Torneos ({tournaments.length})
            {subTab === "torneos" && (
              <span
                className="absolute bottom-0 inset-x-6 h-0.5 rounded-full"
                style={{ background: "var(--electric)" }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("salon_fama")}
            className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
            style={{
              color:
                subTab === "salon_fama"
                  ? "var(--text-main)"
                  : "var(--text-muted)",
            }}
          >
            Salón de la Fama ({hallOfFame.length})
            {subTab === "salon_fama" && (
              <span
                className="absolute bottom-0 inset-x-6 h-0.5 rounded-full"
                style={{ background: "var(--gold)" }}
              />
            )}
          </button>
        </div>

        {subTab === "torneos" ? (
          <div className="p-4 space-y-4">
            {/* Selector de Categoría de Torneo en Píldoras */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {tournaments.map((t) => {
                const isSelected = t.id === activeTournament?.id;
                const clubObj = getClubById(t.clubId, clubs);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTournamentId(t.id)}
                    className="px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all border"
                    style={{
                      background: isSelected
                        ? "var(--bg-elevated)"
                        : "var(--bg-subtle)",
                      borderColor: isSelected
                        ? "var(--electric)"
                        : "var(--border-hairline)",
                    }}
                  >
                    {clubObj && (
                      <SafeImage
                        src={clubObj.shield}
                        alt={clubObj.shortName}
                        circular
                        style={{ width: 20, height: 20 }}
                      />
                    )}
                    <div className="text-left">
                      <div className="font-display font-extrabold text-xs">
                        {t.categoryLabel}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t.clubName}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeTournament && (
              <div className="space-y-4">
                {/* Banner Limpio del Torneo Seleccionado */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  <div className="h-40 w-full relative">
                    <img
                      src={activeTournament.bannerImage}
                      alt={activeTournament.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase"
                        style={{
                          background: "var(--clay)",
                          color: "#FFFFFF",
                        }}
                      >
                        {activeTournament.surface}
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase"
                        style={{
                          background: "rgba(10, 22, 51, 0.85)",
                          color: "#D6FF00",
                        }}
                      >
                        {activeTournament.dateRange}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <h2 className="font-display font-black text-base sm:text-lg text-white leading-tight">
                        {activeTournament.title}
                      </h2>
                      <p className="text-xs text-slate-300">
                        {activeTournament.clubName} · {activeTournament.ballsLabel}
                      </p>
                    </div>
                  </div>

                  {/* Barra de Estado de Inscripción y Botón de Pago */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span
                          className="font-bold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Inscripción:{" "}
                        </span>
                        <span className="font-display font-black text-sm">
                          S/ {activeTournament.entryFee}
                        </span>
                      </div>
                      <div
                        className="font-semibold tabular-nums"
                        style={{ color: "var(--text-player)" }}
                      >
                        {(activeTournament.enrolledPlayerIds || []).length} /{" "}
                        {activeTournament.maxPlayers} Inscritos
                      </div>
                    </div>

                    {(() => {
                      const isEnrolled = (
                        activeTournament.enrolledPlayerIds || []
                      ).includes(currentUser?.id);
                      const isPendingApproval = (
                        activeTournament.pendingApplicantIds || []
                      ).includes(currentUser?.id);

                      if (isEnrolled) {
                        return (
                          <div
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-center"
                            style={{
                              background: "var(--emerald-bg)",
                              color: "var(--emerald)",
                              border: "1px solid var(--emerald)",
                            }}
                          >
                            ✓ Inscrito Oficialmente en el Cuadro
                          </div>
                        );
                      }

                      if (isPendingApproval) {
                        return (
                          <div
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-center"
                            style={{
                              background: "var(--gold-bg)",
                              color: "var(--gold)",
                              border: "1px solid var(--gold-border)",
                            }}
                          >
                            Pago en Verificación · Pendiente de Aprobación
                          </div>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenTournamentPaymentModal &&
                            onOpenTournamentPaymentModal(activeTournament)
                          }
                          className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                          style={{ background: "#D6FF00", color: "#0A1633" }}
                        >
                          Inscribirse al Torneo (S/ {activeTournament.entryFee})
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* ÁRBOL VISUAL DE LLAVES ELIMINATORIAS (Semifinales ➔ Final + Consuelo) */}
                <div
                  className="rounded-2xl p-4 space-y-4"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-extrabold text-xs uppercase tracking-wider">
                      Cuadro Eliminatorio en Vivo
                    </h3>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Toca un cruce para ver el Head2Head
                    </span>
                  </div>

                  {/* Árbol Horizontal / Conectado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Columna 1: Semifinales / Llaves Previas */}
                    <div className="space-y-3">
                      <div
                        className="text-[10px] font-extrabold uppercase tracking-wider"
                        style={{ color: "var(--text-player)" }}
                      >
                        Ronda Clasificatoria / Semifinales
                      </div>
                      {(activeTournament.bracket?.quarters || []).map((match) => {
                        const pA = getPlayerById(match.playerAId);
                        const pB = getPlayerById(match.playerBId);
                        return (
                          <div
                            key={match.id}
                            onClick={() =>
                              pA &&
                              pB &&
                              onOpenHeadToHead &&
                              onOpenHeadToHead(pA, pB)
                            }
                            className="rounded-xl p-3 space-y-2 cursor-pointer transition-colors hover:bg-white/[0.04]"
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-strong)",
                            }}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span style={{ color: "var(--text-muted)" }}>
                                {match.roundLabel}
                              </span>
                              {match.score && (
                                <span
                                  className="font-mono-code font-bold"
                                  style={{ color: "var(--emerald)" }}
                                >
                                  {match.score}
                                </span>
                              )}
                            </div>

                            {/* Jugador A */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <SafeImage
                                  src={pA?.avatar}
                                  alt={pA?.name || "Por definir"}
                                  circular
                                  style={{ width: 22, height: 22 }}
                                />
                                <span
                                  className={`truncate ${
                                    match.winnerId === pA?.id
                                      ? "font-extrabold"
                                      : "font-medium"
                                  }`}
                                >
                                  {pA?.name || "Por definir"}
                                </span>
                              </div>
                              {match.winnerId === pA?.id && (
                                <span style={{ color: "var(--emerald)" }}>✓</span>
                              )}
                            </div>

                            {/* Jugador B */}
                            <div
                              className="flex items-center justify-between text-xs pt-1.5 border-t"
                              style={{ borderColor: "var(--border-hairline)" }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <SafeImage
                                  src={pB?.avatar}
                                  alt={pB?.name || "Por definir"}
                                  circular
                                  style={{ width: 22, height: 22 }}
                                />
                                <span
                                  className={`truncate ${
                                    match.winnerId === pB?.id
                                      ? "font-extrabold"
                                      : "font-medium"
                                  }`}
                                >
                                  {pB?.name || "Por definir"}
                                </span>
                              </div>
                              {match.winnerId === pB?.id && (
                                <span style={{ color: "var(--emerald)" }}>✓</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Columna 2: Gran Final + Final Ronda Consuelo */}
                    <div className="space-y-3">
                      <div
                        className="text-[10px] font-extrabold uppercase tracking-wider"
                        style={{ color: "var(--gold)" }}
                      >
                        Definición de Campeón & Consuelo
                      </div>

                      {/* Gran Final */}
                      {activeTournament.bracket?.final && (
                        <div
                          className="rounded-xl p-3.5 space-y-2"
                          style={{
                            background: "var(--gold-bg)",
                            border: "1px solid var(--gold-border)",
                          }}
                        >
                          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                            <span style={{ color: "var(--gold)" }}>
                              🏆 {activeTournament.bracket.final.roundLabel}
                            </span>
                            {activeTournament.bracket.final.score && (
                              <span className="font-mono-code">
                                {activeTournament.bracket.final.score}
                              </span>
                            )}
                          </div>

                          {[
                            getPlayerById(activeTournament.bracket.final.playerAId),
                            getPlayerById(activeTournament.bracket.final.playerBId),
                          ].map((finPlayer, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1"
                            >
                              <div className="flex items-center gap-2">
                                <SafeImage
                                  src={finPlayer?.avatar}
                                  alt={finPlayer?.name || "Ganador Semifinal"}
                                  circular
                                  style={{ width: 24, height: 24 }}
                                />
                                <span className="font-bold">
                                  {finPlayer?.name || `Ganador Llave ${idx + 1}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Final Ronda Consuelo */}
                      {activeTournament.bracket?.consolationFinal && (
                        <div
                          className="rounded-xl p-3 space-y-1.5"
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-hairline)",
                          }}
                        >
                          <div
                            className="text-[10px] font-extrabold uppercase"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {activeTournament.bracket.consolationFinal.roundLabel}
                          </div>
                          {[
                            getPlayerById(
                              activeTournament.bracket.consolationFinal.playerAId
                            ),
                            getPlayerById(
                              activeTournament.bracket.consolationFinal.playerBId
                            ),
                          ].map((cPlayer, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs py-0.5"
                            >
                              <SafeImage
                                src={cPlayer?.avatar}
                                alt={cPlayer?.name || "En espera"}
                                circular
                                style={{ width: 20, height: 20 }}
                              />
                              <span>
                                {cPlayer?.name || `2º Ronda Previa ${idx + 1}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sub-pestaña 2: SALÓN DE LA FAMA (Campeones de Torneos Previos) */
          <div className="p-4 space-y-3.5">
            {hallOfFame.map((item, idx) => {
              const clubObj = getClubById(item.championClubId, clubs);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 space-y-3"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--gold-border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                      style={{
                        background: "var(--gold-bg)",
                        color: "var(--gold)",
                      }}
                    >
                      Campeón · {item.categoryLabel}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {item.dateLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <LaurelAvatar
                      src={item.avatar}
                      name={item.championName}
                      rank={idx === 0 ? 1 : 1}
                      size={52}
                    />
                    <div className="min-w-0">
                      <div className="font-display font-black text-base truncate">
                        {item.championName}
                      </div>
                      <div
                        className="text-xs font-bold truncate"
                        style={{ color: "var(--text-player)" }}
                      >
                        {item.tournamentName}
                      </div>
                      <div
                        className="text-[11px] flex items-center gap-1.5 mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {clubObj && (
                          <SafeImage
                            src={clubObj.shield}
                            alt={clubObj.shortName}
                            circular
                            style={{ width: 14, height: 14 }}
                          />
                        )}
                        <span>
                          Final: {item.finalScore} vs. {item.finalistName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 31. MODAL DE INSCRIPCIÓN A TORNEO (PAGO YAPE / PLIN / BCP + APROBACIÓN ADMIN)
// ============================================================================
export const TournamentPaymentModal = ({
  isOpen,
  onClose,
  tournament,
  currentUser,
  onSubmitTournamentApplication,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("Yape / Plin");
  const [operationCode, setOperationCode] = useState("");

  if (!isOpen || !tournament || !currentUser) return null;

  const handleSendApplication = (e) => {
    e.preventDefault();
    if (onSubmitTournamentApplication) {
      onSubmitTournamentApplication(tournament.id, currentUser.id, {
        paymentMethod,
        operationCode: operationCode.trim() || "Constancia por WhatsApp",
      });
    }

    const waMessage = `Hola Comité MATCHPOINT, soy ${currentUser.name}. Solicito mi inscripción al torneo "${tournament.title}" (S/ ${tournament.entryFee} vía ${paymentMethod}). Envío mi constancia de pago para aprobación.`;
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
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div>
            <h3 className="font-display font-extrabold text-base">
              Inscripción Oficial al Torneo
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {tournament.title}
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

        <form
          onSubmit={handleSendApplication}
          className="p-5 overflow-y-auto space-y-4 no-scrollbar"
        >
          {/* Resumen de Costo y qué incluye */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Derecho de Inscripción</span>
              <span
                className="font-display font-black text-xl tabular-nums"
                style={{ color: "var(--emerald)" }}
              >
                S/ {tournament.entryFee}
              </span>
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              • <strong>Pelotas:</strong> {tournament.ballsLabel}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              • <strong>Formato:</strong> {tournament.formatLabel}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              • <strong>Sede:</strong> {tournament.clubName} ({tournament.dateRange})
            </div>
          </div>

          {/* Cuentas Oficiales Yape / Plin / BCP */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-border)",
            }}
          >
            <div
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color: "var(--gold)" }}
            >
              Medios de Pago Oficiales
            </div>
            <div className="text-xs font-bold">
              Yape / Plin:{" "}
              <span className="font-mono-code">
                {PAYMENT_METHODS_CONFIG.yapeNumber}
              </span>
            </div>
            <div className="text-xs font-bold">
              {PAYMENT_METHODS_CONFIG.bankAccountBcp}
            </div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Titular: {PAYMENT_METHODS_CONFIG.organizerName}
            </div>
          </div>

          {/* Selector de Medio Utilizado */}
          <div className="space-y-2">
            <label
              className="text-xs font-extrabold uppercase tracking-wider block"
              style={{ color: "var(--text-muted)" }}
            >
              Selecciona tu Medio de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Yape", "Plin", "BCP"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className="touch-btn py-2.5 rounded-xl font-display font-bold text-xs border"
                  style={{
                    background:
                      paymentMethod === m
                        ? "var(--electric)"
                        : "var(--bg-subtle)",
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold block">
              N.º de Operación o Nota (Opcional)
            </label>
            <input
              type="text"
              value={operationCode}
              onChange={(e) => setOperationCode(e.target.value)}
              placeholder="Ej. Op. 482910 — adjuntaré captura en WhatsApp"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-main)",
              }}
            />
          </div>

          <button
            type="submit"
            className="touch-btn w-full py-3.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
            style={{ background: "#D6FF00", color: "#0A1633" }}
          >
            Enviar Constancia por WhatsApp y Solicitar Cupo
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 32. MODAL DE MEMBRESÍA "PASE SOCIO VIP" & BENEFICIOS + TIENDA PRO SHOP
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
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div>
            <h3 className="font-display font-extrabold text-base">
              Pase Socio VIP · MATCHPOINT
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Descuentos oficiales en sedes aliadas y Pro Shop
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

        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          <CarnetDigitalVIP player={player} clubs={clubs} compact />

          <div
            className="rounded-2xl p-4 space-y-2.5"
            style={{
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-border)",
            }}
          >
            <div
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: "var(--gold)" }}
            >
              ¿Qué incluye el Pase Socio VIP?
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>• 15% a 20% de descuento en alquiler de canchas en los 4 clubes aliados.</li>
              <li>• Tarifa reducida en encordados electrónicos, pelotas y overgrips del Pro Shop.</li>
              <li>• Descuento directo en los packs de entrenamiento de Coach Pro.</li>
              <li>• Carnet Digital Dorado con código único verificable en recepción.</li>
            </ul>
          </div>

          {!player.isVipMember ? (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-strong)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  Membresía ({PAYMENT_METHODS_CONFIG.vipMembershipDuration})
                </span>
                <span className="font-display font-black text-lg">
                  S/ {PAYMENT_METHODS_CONFIG.vipMembershipPrice}
                </span>
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Yape / Plin: <strong>{PAYMENT_METHODS_CONFIG.yapeNumber}</strong> ·{" "}
                {PAYMENT_METHODS_CONFIG.bankAccountBcp}
              </div>
              <button
                type="button"
                onClick={handleRequestVip}
                className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                style={{
                  background: "linear-gradient(135deg, #FDE68A 0%, #D97706 100%)",
                  color: "#0A1633",
                }}
              >
                Enviar Constancia Yape/Plin y Activar VIP
              </button>
            </div>
          ) : (
            <div
              className="rounded-2xl p-3.5 text-center text-xs font-extrabold"
              style={{
                background: "var(--emerald-bg)",
                color: "var(--emerald)",
              }}
            >
              Tu Pase Socio VIP se encuentra activo en esta temporada.
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
  onOpenVipModal,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div className="flex items-center gap-2">
            <Icons.Bag size={19} />
            <div>
              <h3 className="font-display font-extrabold text-base">
                MATCHPOINT Pro Shop
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Equipamiento oficial, encordado y pelotas en Huancayo
              </p>
            </div>
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

        <div className="p-5 overflow-y-auto space-y-3.5 no-scrollbar">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl p-4 flex items-center justify-between gap-3.5"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <SafeImage
                src={item.image}
                alt={item.name}
                style={{ width: 58, height: 58, borderRadius: 14 }}
              />
              <div className="min-w-0 flex-1">
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase"
                  style={{
                    background: "var(--clay-bg)",
                    color: "var(--clay)",
                  }}
                >
                  {item.badge}
                </span>
                <h4 className="font-display font-extrabold text-xs sm:text-sm mt-1">
                  {item.name}
                </h4>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.specs}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-display font-black text-sm tabular-nums">
                    S/ {item.regularPrice}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-extrabold tabular-nums"
                    style={{
                      background: "var(--gold-bg)",
                      color: "var(--gold)",
                    }}
                  >
                    Socio VIP: S/ {item.vipPrice}
                  </span>
                </div>
              </div>

              <a
                href={`https://wa.me/${PAYMENT_METHODS_CONFIG.whatsappApprovalPhone}?text=${encodeURIComponent(
                  `Hola MATCHPOINT Pro Shop, deseo pedir: ${item.name} (${
                    currentUser?.isVipMember
                      ? `Precio Socio VIP S/ ${item.vipPrice}`
                      : `S/ ${item.regularPrice}`
                  }).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="touch-btn px-3 py-2 rounded-xl font-display font-extrabold text-xs flex-shrink-0"
                style={{ background: "#D6FF00", color: "#0A1633" }}
              >
                Pedir
              </a>
            </div>
          ))}

          {!currentUser?.isVipMember && onOpenVipModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVipModal();
              }}
              className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs"
              style={{
                background: "var(--gold-bg)",
                color: "var(--gold)",
                border: "1px solid var(--gold-border)",
              }}
            >
              Obtén tu Carnet Socio VIP para comprar con descuento →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 33. MODALES DE LANZAR RETO (MODO DUAL AUTOMÁTICO) Y SUBIR MARCADOR OFICIAL
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
  const [dateTimeLabel, setDateTimeLabel] = useState("17 Nov 2026 · 19:00");
  const [ballAgreement, setBallAgreement] = useState(BALL_AGREEMENT_OPTIONS[0]);
  const [voluntaryFriendly, setVoluntaryFriendly] = useState(false);

  useEffect(() => {
    if (preselectedRival?.id) setRivalId(preselectedRival.id);
    else if (rivalsList[0]?.id) setRivalId(rivalsList[0].id);
    setVoluntaryFriendly(false);
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
        dateTimeLabel: dateTimeLabel.trim() || "17 Nov 2026 · 19:00",
        ballAgreement,
        isFriendly: preCalc.isFriendly,
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
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <h3 className="font-display font-extrabold text-base">
            Lanzar Desafío
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-9 h-9 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto space-y-4 no-scrollbar"
        >
          {/* Selector de Rival */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider block">
              Elegir Rival
            </label>
            <select
              value={rivalId}
              onChange={(e) => setRivalId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-main)",
              }}
            >
              {rivalsList.map((r) => {
                const cat = getCategoryByElo(r.elo, r.seasonMatches);
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.elo} Pts ({cat.short})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Pronóstico Transparente Pre-Partido (o Aviso Automático de Amistoso si >1,000 pts) */}
          <div
            className="rounded-2xl p-3.5 space-y-2"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
            }}
          >
            {preCalc.isFriendly ? (
              <div className="space-y-1">
                <div
                  className="text-xs font-extrabold"
                  style={{ color: "var(--electric)" }}
                >
                  Modo Partido Amistoso / Exhibición H2H (0 Pts ELO)
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {preCalc.friendlyReason}. El resultado se registra en su
                  historial Head2Head y genera Póster Story 9:16 sin alterar el
                  ranking.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Pronóstico Oficial de Puntos</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: "var(--emerald)" }}
                  >
                    {preCalc.rematchInfo.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div
                    className="rounded-xl p-2.5"
                    style={{ background: "var(--bg-card)" }}
                  >
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Para {currentUser.name}
                    </div>
                    <div className="font-display font-bold mt-0.5">
                      <span style={{ color: "var(--emerald)" }}>
                        +{preCalc.winCeilingA} máx
                      </span>{" "}
                      /{" "}
                      <span style={{ color: "var(--crimson)" }}>
                        {preCalc.lossMaxA} máx
                      </span>
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-2.5"
                    style={{ background: "var(--bg-card)" }}
                  >
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Para {selectedRival?.name}
                    </div>
                    <div className="font-display font-bold mt-0.5">
                      <span style={{ color: "var(--emerald)" }}>
                        +{preCalc.winCeilingB} máx
                      </span>{" "}
                      /{" "}
                      <span style={{ color: "var(--crimson)" }}>
                        {preCalc.lossMaxB} máx
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!preCalc.gapExceedsLimit && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  ¿Prefieres jugarlo como Amistoso sin puntos?
                </span>
                <button
                  type="button"
                  onClick={() => setVoluntaryFriendly((v) => !v)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  style={{
                    background: voluntaryFriendly
                      ? "var(--electric)"
                      : "var(--bg-card)",
                    color: voluntaryFriendly ? "#FFFFFF" : "var(--text-muted)",
                  }}
                >
                  {voluntaryFriendly ? "Sí, Amistoso" : "Oficial por Puntos"}
                </button>
              </div>
            )}
          </div>

          {/* Sede Oficial u Otra Cancha */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider block">
              Sede del Encuentro
            </label>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-main)",
              }}
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="custom">Otra Cancha / Sede Personalizada</option>
            </select>

            {clubId === "custom" && (
              <input
                type="text"
                value={customVenueText}
                onChange={(e) => setCustomVenueText(e.target.value)}
                placeholder="Escribe el nombre de la cancha..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs mt-2 focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-main)",
                }}
              />
            )}
          </div>

          {/* Fecha y Hora + Acuerdo de Pelotas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold block">Fecha y Hora</label>
              <input
                type="text"
                value={dateTimeLabel}
                onChange={(e) => setDateTimeLabel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-main)",
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">Pelotas</label>
              <select
                value={ballAgreement}
                onChange={(e) => setBallAgreement(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-main)",
                }}
              >
                {BALL_AGREEMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="touch-btn w-full py-3.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
            style={{ background: "#D6FF00", color: "#0A1633" }}
          >
            Enviar Desafío Oficial
          </button>
        </form>
      </div>
    </div>
  );
};

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
    s1A !== "" && s1B !== "" && s2A !== "" && s2B !== "" && set1WinSide !== set2WinSide;

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
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div>
            <h3 className="font-display font-extrabold text-base">
              Confirmar Marcador Oficial
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {pA?.name} vs. {pB?.name}
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

        <form
          onSubmit={handleConfirm}
          className="p-5 overflow-y-auto space-y-4 no-scrollbar"
        >
          {/* Selector de Tipo de Finalización (Normal / Retiro / Walkover) */}
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
                className="touch-btn py-2 px-2 rounded-xl text-xs font-bold border"
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
              <label className="text-xs font-bold block">
                ¿Quién avanza como ganador oficial?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRetiredWinnerSide("A")}
                  className="touch-btn py-2.5 rounded-xl text-xs font-extrabold border"
                  style={{
                    background:
                      retiredWinnerSide === "A" ? "#D6FF00" : "var(--bg-subtle)",
                    color:
                      retiredWinnerSide === "A" ? "#0A1633" : "var(--text-main)",
                  }}
                >
                  {pA?.name}
                </button>
                <button
                  type="button"
                  onClick={() => setRetiredWinnerSide("B")}
                  className="touch-btn py-2.5 rounded-xl text-xs font-extrabold border"
                  style={{
                    background:
                      retiredWinnerSide === "B" ? "#D6FF00" : "var(--bg-subtle)",
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
            <div className="space-y-3">
              {/* Set 1 */}
              <div
                className="rounded-2xl p-3.5 space-y-2"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <div className="text-xs font-extrabold">Set 1 (Games)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-[11px] block mb-1"
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
                      className="w-full px-3 py-2 rounded-xl text-center font-display font-black text-base"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-[11px] block mb-1"
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
                      className="w-full px-3 py-2 rounded-xl text-center font-display font-black text-base"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                </div>
                {isSet1Tb && (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span>Puntos de quien perdió el Tie-Break 7-6:</span>
                    <input
                      type="number"
                      min="0"
                      value={tb1Loser}
                      onChange={(e) => setTb1Loser(e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg text-center font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Set 2 */}
              <div
                className="rounded-2xl p-3.5 space-y-2"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <div className="text-xs font-extrabold">Set 2 (Games)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-[11px] block mb-1"
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
                      className="w-full px-3 py-2 rounded-xl text-center font-display font-black text-base"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-[11px] block mb-1"
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
                      className="w-full px-3 py-2 rounded-xl text-center font-display font-black text-base"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                </div>
                {isSet2Tb && (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span>Puntos de quien perdió el Tie-Break 7-6:</span>
                    <input
                      type="number"
                      min="0"
                      value={tb2Loser}
                      onChange={(e) => setTb2Loser(e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg text-center font-bold"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Set 3: Super Tie-Break a 10 Puntos */}
              {isSplitSets && (
                <div
                  className="rounded-2xl p-3.5 space-y-2"
                  style={{
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                  }}
                >
                  <div
                    className="text-xs font-extrabold"
                    style={{ color: "var(--gold)" }}
                  >
                    3er Set · Super Tie-Break (a 10 puntos, dif. mínima 2)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="0"
                      placeholder={`Pts ${pA?.name.split(" ")[0]}`}
                      value={stbA}
                      onChange={(e) => setStbA(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-center font-display font-black text-base"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder={`Pts ${pB?.name.split(" ")[0]}`}
                      value={stbB}
                      onChange={(e) => setStbB(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-center font-display font-black text-base"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
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
              className="rounded-xl p-3 text-xs font-bold"
              style={{
                background: "rgba(244, 63, 94, 0.15)",
                color: "var(--crimson)",
              }}
            >
              {validationError}
            </div>
          )}

          <button
            type="submit"
            className="touch-btn w-full py-3.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
            style={{ background: "#D6FF00", color: "#0A1633" }}
          >
            Confirmar Marcador Oficial
          </button>
        </form>
      </div>
    </div>
  );
};

// === FIN DEL BLOQUE 9 DE 10 ===

// === INICIO DEL BLOQUE 10 DE 10 ===

// ============================================================================
// 34. MODAL DE REGLAS DEL CIRCUITO (100% VISUAL · CERO PÁRRAFOS LARGOS)
// ============================================================================
export const VisualRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div>
            <h3 className="font-display font-extrabold text-base">
              Sistema de Juego & Categorías
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Escalera progresiva, Checkpoints y puntuación por sets
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

        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* 1. Escalera Visual de Categorías y Checkpoints */}
          <div className="space-y-2">
            <div
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              1. Escalera Oficial & Checkpoints de Temporada
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES_PROGRESSIVE.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl p-3 space-y-1"
                  style={{
                    background: cat.bg,
                    border: `1px solid ${cat.border}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-display font-black text-xs"
                      style={{ color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <div className="font-mono-code font-bold text-xs">
                    {cat.id === "2DA"
                      ? "5,000+ Pts"
                      : `${cat.min} – ${cat.max} Pts`}
                  </div>
                  {cat.checkpoint && (
                    <div
                      className="text-[10px] font-extrabold"
                      style={{ color: "var(--gold)" }}
                    >
                      Checkpoint: {cat.checkpoint} Pts
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Las 3 Jaulas Finitas (Gráfico Visual Rápido) */}
          <div
            className="rounded-2xl p-4 space-y-2.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-player)" }}
            >
              2. Cada Game Cuenta (3 Jaulas de Marcador)
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div
                className="rounded-xl p-2.5"
                style={{ background: "var(--bg-card)" }}
              >
                <div
                  className="font-display font-black text-sm"
                  style={{ color: "var(--emerald)" }}
                >
                  76% – 100%
                </div>
                <div className="text-[10px] font-bold mt-0.5">
                  Victoria 2 Sets
                </div>
                <div
                  className="text-[9px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  6-0, 6-0 paga 100%
                </div>
              </div>

              <div
                className="rounded-xl p-2.5"
                style={{ background: "var(--bg-card)" }}
              >
                <div
                  className="font-display font-black text-sm"
                  style={{ color: "var(--electric)" }}
                >
                  70% – 75%
                </div>
                <div className="text-[10px] font-bold mt-0.5">
                  Victoria 3 Sets
                </div>
                <div
                  className="text-[9px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Super TB a 10 pts
                </div>
              </div>

              <div
                className="rounded-xl p-2.5"
                style={{ background: "var(--bg-card)" }}
              >
                <div
                  className="font-display font-black text-sm"
                  style={{ color: "var(--gold)" }}
                >
                  Protección
                </div>
                <div className="text-[10px] font-bold mt-0.5">
                  Caer en 3 Sets
                </div>
                <div
                  className="text-[9px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Ahorras hasta 62%
                </div>
              </div>
            </div>
          </div>

          {/* 3. Reglas Clave en Tarjetas Cortas */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className="rounded-xl p-3 space-y-1"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <div className="font-display font-extrabold">
                Duelos entre Amigos
              </div>
              <div
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Hasta 1,000 pts de brecha suma al Ranking. Si supera 1,000 pts,
                se juega como Amistoso H2H.
              </div>
            </div>

            <div
              className="rounded-xl p-3 space-y-1"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <div className="font-display font-extrabold">Master Top 8</div>
              <div
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Clasifican los 8 mejores de cada categoría con mínimo 4 partidos
                jugados en la temporada.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 35. MODAL DE ACCESO DUAL (CELULAR / CORREO), REGISTRO Y RECUPERACIÓN EN 2 PASOS
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

  // Registro de nuevo tenista
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regClubId, setRegClubId] = useState("country");
  const [regPassword, setRegPassword] = useState("");

  // Recuperación en 2 pasos reales separados
  const [recoverStep, setRecoverStep] = useState(1); // 1: Verificar identidad | 2: Nueva clave
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
      setAuthError("Ingresa tu nombre completo y número de WhatsApp.");
      return;
    }
    if (onRegisterNewPlayer) {
      onRegisterNewPlayer({
        name: regName.trim(),
        phone: regPhone.trim(),
        email:
          regEmail.trim() ||
          `${regName.trim().toLowerCase().replace(/\s+/g, ".")}@matchpoint.pe`,
        clubId: regClubId,
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
        "El correo y el número de WhatsApp no coinciden con ningún jugador registrado."
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
    setRecoverSuccessMsg("Contraseña actualizada correctamente.");
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
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <div className="flex items-center gap-2">
            <SafeImage
              src={ASSETS.logo}
              alt="MP"
              style={{ width: 26, height: 26, borderRadius: 7 }}
            />
            <h3 className="font-display font-extrabold text-base">
              Cuenta de Jugador
            </h3>
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

        {/* Pestañas */}
        <div
          className="grid grid-cols-3 px-4"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
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
              className="py-3 text-xs font-display font-extrabold uppercase tracking-wider relative"
              style={{
                color: tab === t.id ? "var(--text-main)" : "var(--text-muted)",
              }}
            >
              {t.label}
              {tab === t.id && (
                <span
                  className="absolute bottom-0 inset-x-3 h-0.5 rounded-full"
                  style={{ background: "var(--electric)" }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {tab === "login" && (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    Celular (WhatsApp) o Correo
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ej. 966778899 o pablo@matchpoint.pe"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu clave"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none pr-10"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-hairline)",
                        color: "var(--text-main)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showPass ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div
                    className="text-xs font-bold"
                    style={{ color: "var(--crimson)" }}
                  >
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                  style={{ background: "#D6FF00", color: "#0A1633" }}
                >
                  Iniciar Sesión
                </button>
              </form>

              {/* Selector de Cuentas Activas del Circuito */}
              <div
                className="pt-3 border-t space-y-2"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <div
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Cambio Rápido de Cuenta
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto no-scrollbar">
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
                        className="px-2.5 py-2 rounded-xl flex items-center gap-2 text-left border transition-all"
                        style={{
                          background: isCurrent
                            ? "var(--bg-elevated)"
                            : "var(--bg-subtle)",
                          borderColor: isCurrent
                            ? "#D6FF00"
                            : "var(--border-hairline)",
                        }}
                      >
                        <SafeImage
                          src={p.avatar}
                          alt={p.name}
                          circular
                          style={{ width: 26, height: 26 }}
                        />
                        <div className="min-w-0">
                          <div className="font-display font-bold text-xs truncate">
                            {p.name}
                          </div>
                          <div
                            className="text-[10px] tabular-nums"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {p.elo} Pts
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
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej. Rodrigo Mantari"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    WhatsApp (9 dígitos)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="964112233"
                    className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-hairline)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">
                    Club Principal
                  </label>
                  <select
                    value={regClubId}
                    onChange={(e) => setRegClubId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-hairline)",
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

              <div>
                <label className="text-xs font-bold block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Crea tu contraseña"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              {authError && (
                <div
                  className="text-xs font-bold"
                  style={{ color: "var(--crimson)" }}
                >
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="touch-btn w-full py-3.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                style={{ background: "#D6FF00", color: "#0A1633" }}
              >
                Registrarme y Realizar Diagnóstico Inicial →
              </button>
            </form>
          )}

          {tab === "recover" && (
            /* Flujo de Recuperación en 2 Pasos Separados */
            <div className="space-y-3">
              {recoverStep === 1 ? (
                <form onSubmit={handleVerifyStep1} className="space-y-3">
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <strong>Paso 1 de 2:</strong> Verifica tu identidad con tu
                    correo registrado y tu número de WhatsApp.
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">
                      Correo Registrado
                    </label>
                    <input
                      type="email"
                      value={recEmail}
                      onChange={(e) => setRecEmail(e.target.value)}
                      placeholder="Ej. pablo@matchpoint.pe"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-hairline)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">
                      Número de WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={recPhone}
                      onChange={(e) => setRecPhone(e.target.value)}
                      placeholder="Ej. 966778899"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-hairline)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  {authError && (
                    <div
                      className="text-xs font-bold"
                      style={{ color: "var(--crimson)" }}
                    >
                      {authError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                    style={{ background: "var(--electric)", color: "#FFFFFF" }}
                  >
                    Verificar Identidad →
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSaveNewPassStep2} className="space-y-3">
                  <div
                    className="text-xs font-bold"
                    style={{ color: "var(--emerald)" }}
                  >
                    ✓ Identidad verificada (Paso 2 de 2): Crea tu nueva
                    contraseña.
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Nueva contraseña"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={newPassConfirm}
                      onChange={(e) => setNewPassConfirm(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  {authError && (
                    <div
                      className="text-xs font-bold"
                      style={{ color: "var(--crimson)" }}
                    >
                      {authError}
                    </div>
                  )}
                  {recoverSuccessMsg && (
                    <div
                      className="text-xs font-extrabold"
                      style={{ color: "var(--emerald)" }}
                    >
                      {recoverSuccessMsg}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider"
                    style={{ background: "#D6FF00", color: "#0A1633" }}
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
// 36. CUESTIONARIO INICIAL 1 POR 1 (EXCLUSIVO REGISTRO NUEVO) Y GUÍA RÁPIDA
// ============================================================================
export const InitialCalibrationWizardModal = ({
  isOpen,
  player,
  onCompleteInitialSeed,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState([2, 2, 2, 2, 2]);

  if (!isOpen || !player) return null;

  const currentQ = CALIBRATION_QUESTIONS_1X1[stepIdx];

  const handleSelectOption = (pts) => {
    const next = [...answers];
    next[stepIdx] = pts;
    setAnswers(next);

    if (stepIdx + 1 < CALIBRATION_QUESTIONS_1X1.length) {
      setStepIdx(stepIdx + 1);
    } else {
      const seedResult = computeInitialSeedFromAnswers(next);
      if (onCompleteInitialSeed) {
        onCompleteInitialSeed(player.id, seedResult.seedElo);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-4">
      <div className="ios-modal-card w-full max-w-md rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold">
          <span style={{ color: "var(--electric)" }}>
            Diagnóstico Inicial Único · Pregunta {stepIdx + 1} de{" "}
            {CALIBRATION_QUESTIONS_1X1.length}
          </span>
          <span className="tabular-nums">
            {Math.round(((stepIdx + 1) / CALIBRATION_QUESTIONS_1X1.length) * 100)}%
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="font-display font-black text-base sm:text-lg">
            {currentQ.title}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {currentQ.subtitle}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {currentQ.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectOption(opt.points)}
              className="w-full p-3.5 rounded-2xl text-left text-xs font-semibold border transition-all hover:border-sky-400"
              style={{
                background: "var(--bg-subtle)",
                borderColor: "var(--border-strong)",
                color: "var(--text-main)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 37. MENÚ LATERAL (CONMUTADOR CLARO/OSCURO, REGLAS, COMITÉ) Y ADMIN OCULTO
// ============================================================================
export const SideNavigationDrawer = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  onOpenVisualRules,
  onOpenVipModal,
  onOpenAuthModal,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex justify-start"
      onClick={onClose}
    >
      <div
        className="w-72 max-w-[82vw] h-full p-5 flex flex-col justify-between safe-modal-top"
        style={{
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border-strong)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SafeImage
                src={ASSETS.logo}
                alt="MATCHPOINT"
                style={{ width: 32, height: 32, borderRadius: 8 }}
              />
              <span className="font-display font-black text-base">
                MATCHPOINT
              </span>
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

          {/* Conmutador Simétrico Modo Oscuro / Modo Claro */}
          <div
            className="rounded-2xl p-3.5 space-y-2"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div
              className="text-[10px] font-extrabold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Apariencia de Pantalla
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => theme !== "dark" && onToggleTheme()}
                className="touch-btn py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                style={{
                  minHeight: 38,
                  background:
                    theme === "dark" ? "var(--electric)" : "transparent",
                  color: theme === "dark" ? "#FFFFFF" : "var(--text-muted)",
                }}
              >
                <Icons.Moon size={15} />
                <span>Oscuro</span>
              </button>
              <button
                type="button"
                onClick={() => theme !== "light" && onToggleTheme()}
                className="touch-btn py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                style={{
                  minHeight: 38,
                  background:
                    theme === "light" ? "var(--electric)" : "transparent",
                  color: theme === "light" ? "#FFFFFF" : "var(--text-muted)",
                }}
              >
                <Icons.Sun size={15} />
                <span>Claro</span>
              </button>
            </div>
          </div>

          {/* Opciones del Menú */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenVisualRules) onOpenVisualRules();
              }}
              className="w-full p-3.5 rounded-2xl text-left font-display font-bold text-xs flex items-center justify-between"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <span>Sistema de Juego & Categorías</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenVipModal) onOpenVipModal();
              }}
              className="w-full p-3.5 rounded-2xl text-left font-display font-bold text-xs flex items-center justify-between"
              style={{
                background: "var(--gold-bg)",
                border: "1px solid var(--gold-border)",
                color: "var(--gold)",
              }}
            >
              <span>Pase Socio VIP & Beneficios</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="w-full p-3.5 rounded-2xl text-left font-display font-bold text-xs flex items-center justify-between"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <span>Cambiar de Cuenta / Registro</span>
              <span>→</span>
            </button>
          </div>

          {/* Contacto Comité Oficial (100% enfocado en asistencia) */}
          <div
            className="rounded-2xl p-4 space-y-2.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div className="font-display font-extrabold text-xs">
              Comité Organizador Huancayo
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Soporte oficial para inscripciones, coordinación de sedes y
              consultas del circuito.
            </p>
            <a
              href={`https://wa.me/${PAYMENT_METHODS_CONFIG.whatsappApprovalPhone}?text=${encodeURIComponent(
                "Hola Comité Oficial MATCHPOINT, necesito asistencia con mi cuenta del circuito."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="touch-btn w-full py-2.5 rounded-xl font-display font-extrabold text-xs block text-center"
              style={{ background: "var(--emerald)", color: "#FFFFFF" }}
            >
              Contactar al Comité por WhatsApp
            </a>
          </div>
        </div>

        <div
          className="text-[11px] text-center pt-3 border-t"
          style={{
            borderColor: "var(--border-hairline)",
            color: "var(--text-muted)",
          }}
        >
          MATCHPOINT Huancayo · Temporada 2026
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 38. SUITE ADMIN OCULTA (SOLO SE ABRE CON 5 TOQUES EN EL LOGO MATCHPOINT)
//     - Aprobación de pagos de Torneos e Inscripción al Cuadro
//     - Activación de Pase Socio VIP
//     - Gestión de Cuentas y Reset de Temporada
// ============================================================================
export const HiddenAdminSuiteModal = ({
  isOpen,
  onClose,
  players = [],
  tournaments = [],
  vipPendingPlayerIds = [],
  onApproveTournamentApplicant,
  onRejectTournamentApplicant,
  onApproveVipMember,
  onAdminResetPlayerPassword,
  onAdminTogglePlayerStatus,
  onTriggerSeasonReset,
}) => {
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  if (!isOpen) return null;

  const handlePinCheck = (e) => {
    e.preventDefault();
    if (pinInput.trim() === "1234") {
      setUnlocked(true);
    } else {
      alert("PIN de Administrador incorrecto.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ios-modal-card w-full max-w-md rounded-3xl overflow-hidden my-auto flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <h3 className="font-display font-extrabold text-base">
            Panel de Control del Organizador
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-9 h-9 rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Icons.Close size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {!unlocked ? (
            <form onSubmit={handlePinCheck} className="space-y-3">
              <label className="text-xs font-bold block">
                Ingresa tu PIN de Administrador
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN (1234)"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-main)",
                }}
              />
              <button
                type="submit"
                className="touch-btn w-full py-3 rounded-xl font-display font-extrabold text-xs"
                style={{ background: "#D6FF00", color: "#0A1633" }}
              >
                Desbloquear Panel
              </button>
            </form>
          ) : (
            <>
              {/* 1. Solicitudes de Inscripción a Torneos por Aprobar */}
              <div className="space-y-2">
                <div
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--gold)" }}
                >
                  1. Pagos de Torneos por Aprobar
                </div>
                {tournaments.map((t) =>
                  (t.pendingApplicantIds || []).map((pid) => {
                    const applicant = players.find((p) => p.id === pid);
                    return (
                      <div
                        key={`${t.id}_${pid}`}
                        className="rounded-xl p-3 flex items-center justify-between gap-2"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--gold-border)",
                        }}
                      >
                        <div className="min-w-0">
                          <div className="font-display font-bold text-xs truncate">
                            {applicant?.name}
                          </div>
                          <div
                            className="text-[11px] truncate"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {t.title} (S/ {t.entryFee})
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              onApproveTournamentApplicant &&
                              onApproveTournamentApplicant(t.id, pid)
                            }
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold"
                            style={{
                              background: "var(--emerald)",
                              color: "#FFFFFF",
                            }}
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onRejectTournamentApplicant &&
                              onRejectTournamentApplicant(t.id, pid)
                            }
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                            style={{
                              background: "var(--crimson)",
                              color: "#FFFFFF",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 2. Solicitudes de Pase Socio VIP */}
              {vipPendingPlayerIds.length > 0 && (
                <div className="space-y-2">
                  <div
                    className="text-xs font-extrabold uppercase tracking-wider"
                    style={{ color: "var(--gold)" }}
                  >
                    2. Activaciones de Pase Socio VIP Pendientes
                  </div>
                  {vipPendingPlayerIds.map((pid) => {
                    const p = players.find((item) => item.id === pid);
                    return (
                      <div
                        key={pid}
                        className="rounded-xl p-3 flex items-center justify-between"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-strong)",
                        }}
                      >
                        <span className="text-xs font-bold">{p?.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onApproveVipMember && onApproveVipMember(pid)
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-extrabold"
                          style={{
                            background: "var(--emerald)",
                            color: "#FFFFFF",
                          }}
                        >
                          Activar VIP
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Gestión de Cuentas de Jugadores */}
              <div className="space-y-2">
                <div
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Gestión de Cuentas y Claves
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-hairline)",
                      }}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">{p.name}</div>
                        <div
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {p.elo} Pts ·{" "}
                          {p.activeStatus === "inactive" ? "Pausado" : "Activo"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onAdminResetPlayerPassword &&
                            onAdminResetPlayerPassword(p.id)
                          }
                          className="px-2 py-1 rounded text-[10px] font-bold border"
                          style={{ borderColor: "var(--border-strong)" }}
                        >
                          Clave: Tenis2026
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAdminTogglePlayerStatus &&
                            onAdminTogglePlayerStatus(p.id)
                          }
                          className="px-2 py-1 rounded text-[10px] font-bold"
                          style={{
                            background:
                              p.activeStatus === "inactive"
                                ? "var(--emerald)"
                                : "var(--bg-card)",
                            color:
                              p.activeStatus === "inactive"
                                ? "#FFFFFF"
                                : "var(--text-muted)",
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

              {/* 4. Cierre de Temporada con Respeto a Checkpoints */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onTriggerSeasonReset}
                  className="touch-btn w-full py-2.5 rounded-xl text-xs font-bold border"
                  style={{
                    borderColor: "var(--gold-border)",
                    color: "var(--gold)",
                  }}
                >
                  Iniciar Nueva Temporada (Aplicar Pisos y Checkpoints)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 39. BARRA INFERIOR DE 5 PESTAÑAS CON HALO LUMINOSO ACTIVO
// ============================================================================
export const BottomTabNavigation = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: "perfil", label: "Mi Perfil", icon: ASSETS.navPerfil },
    { id: "ranking", label: "Ranking", icon: ASSETS.navRanking },
    { id: "retos", label: "Retos", icon: ASSETS.navRetos, isCenter: true },
    { id: "sedes", label: "Sedes", icon: ASSETS.navSedes },
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
              className="touch-btn flex flex-col items-center justify-center py-1 relative"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: isActive
                    ? "rgba(214, 255, 0, 0.16)"
                    : "var(--bg-subtle)",
                  border: isActive
                    ? "2px solid #D6FF00"
                    : "1px solid var(--border-hairline)",
                  boxShadow: isActive
                    ? "0 0 16px rgba(214, 255, 0, 0.32)"
                    : "none",
                  transform: tab.isCenter && isActive ? "scale(1.06)" : "none",
                }}
              >
                <SafeImage
                  src={tab.icon}
                  alt={tab.label}
                  circular
                  style={{ width: 26, height: 26 }}
                />
              </div>

              <span
                className="text-[10px] font-display font-extrabold mt-1 tracking-tight"
                style={{
                  color: isActive ? "var(--text-main)" : "var(--text-muted)",
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
// 40. COMPONENTE MAESTRO PRINCIPAL: export default function App()
// ============================================================================
export default function App() {
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
  const [vipPendingIds, setVipPendingIds] = usePersistentState(
    "vip_pending_ids",
    []
  );
  const [dismissedPendingPopupIds, setDismissedPendingPopupIds] =
    usePersistentState("dismissed_popups", []);

  // Modales independientes enfrente de pantalla
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulletinOpen, setIsBulletinOpen] = useState(false);
  const [isProShopOpen, setIsProShopOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isVisualRulesOpen, setIsVisualRulesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminSuiteOpen, setIsAdminSuiteOpen] = useState(false);

  const [h2hPair, setH2hPair] = useState({ open: false, pA: null, pB: null });
  const [storyPosterMatch, setStoryPosterMatch] = useState(null);
  const [launchChallengeTarget, setLaunchChallengeTarget] = useState({
    open: false,
    rival: null,
  });
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

  // Cierre universal de cualquier ventana emergente con la tecla Escape
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
        setH2hPair({ open: false, pA: null, pB: null });
        setStoryPosterMatch(null);
        setLaunchChallengeTarget({ open: false, rival: null });
        setOfficialScoreChallenge(null);
        setSelectedClubDetail(null);
        setSelectedCoachModal(null);
        setTournamentPaymentTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clima real de Huancayo (Open-Meteo) + Noticias reales con foto verificada
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
            source: "Punto de Break",
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

  // Reto pendiente entrante que dispara pop-up una sola vez hasta decidir
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

  // Handlers de Persistencia Real
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

  const handleCreateChallenge = useCallback(
    (payload) => {
      const newCh = {
        id: `ch_${Date.now()}`,
        ...payload,
        status: "pending", // Siempre nace como "pending" para notificar al rival
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
            s2A: 0,
            s2B: 0,
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

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === pA.id) {
            return {
              ...p,
              elo: settlement.newEloA,
              lastDelta: settlement.deltaA,
              wins: aWon ? (p.wins || 0) + 1 : p.wins || 0,
              losses: !aWon ? (p.losses || 0) + 1 : p.losses || 0,
              seasonMatches: (p.seasonMatches || 0) + 1,
              streak: aWon ? (p.streak || 0) + 1 : 0,
              calibrationMatches: Math.min(5, (p.calibrationMatches ?? 5) + 1),
            };
          }
          if (p.id === pB.id) {
            return {
              ...p,
              elo: settlement.newEloB,
              lastDelta: settlement.deltaB,
              wins: !aWon ? (p.wins || 0) + 1 : p.wins || 0,
              losses: aWon ? (p.losses || 0) + 1 : p.losses || 0,
              seasonMatches: (p.seasonMatches || 0) + 1,
              streak: !aWon ? (p.streak || 0) + 1 : 0,
              calibrationMatches: Math.min(5, (p.calibrationMatches ?? 5) + 1),
            };
          }
          return p;
        })
      );

      const completedRecord = {
        id: `hist_${Date.now()}`,
        challengerId: pA.id,
        challengedId: pB.id,
        winnerId: winner.id,
        loserId: loser.id,
        score: scoreEvaluation.formattedScore,
        clubId: ch.clubId,
        clubName: ch.customClubName,
        dateLabel: ch.dateTimeLabel,
        completedAt: Date.now(),
        winnerDelta: Math.abs(
          aWon ? settlement.deltaA : settlement.deltaB
        ),
        loserDelta: aWon ? settlement.deltaB : settlement.deltaA,
        isFriendly: settlement.isFriendly,
      };

      setCompletedMatches((prev) => [completedRecord, ...prev]);
      setChallenges((prev) => prev.filter((item) => item.id !== challengeId));
      setStoryPosterMatch(completedRecord);
    },
    [challenges, players, completedMatches, setPlayers, setCompletedMatches, setChallenges]
  );

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
    },
    [setClubs, currentUser]
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
    (tournamentId, playerId) => {
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
    [setTournaments]
  );

  const handleApproveTournamentApplicant = useCallback(
    (tournamentId, playerId) => {
      setTournaments((prev) =>
        prev.map((t) => {
          if (t.id !== tournamentId) return t;
          const nextPending = (t.pendingApplicantIds || []).filter(
            (id) => id !== playerId
          );
          const nextEnrolled = (t.enrolledPlayerIds || []).includes(playerId)
            ? t.enrolledPlayerIds
            : [...(t.enrolledPlayerIds || []), playerId];
          return {
            ...t,
            pendingApplicantIds: nextPending,
            enrolledPlayerIds: nextEnrolled,
          };
        })
      );
    },
    [setTournaments]
  );

  const handleRejectTournamentApplicant = useCallback(
    (tournamentId, playerId) => {
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
    },
    [setTournaments]
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
        age: 26,
        clubId: newPlayerData.clubId || "country",
        elo: 500,
        previousRank: players.length + 1,
        lastDelta: 0,
        wins: 0,
        losses: 0,
        seasonMatches: 0,
        streak: 0,
        calibrationMatches: 0,
        hand: "Diestro",
        bestShot: "Derecha (Forehand)",
        availableDays: ["S", "D"],
        availableSlots: ["18:00–22:00"],
        whatsappPrivate: false,
        isVipMember: false,
        vipCode: `MP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        activeStatus: "active",
        avatar: "",
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
        prev.map((p) => (p.id === playerId ? { ...p, elo: seedElo } : p))
      );
      setNewAccountCalibrationPlayerId(null);
      setActiveTab("perfil");
    },
    [setPlayers, setActiveTab]
  );

  return (
    <div className={`app-shell ${theme === "light" ? "theme-light" : ""}`}>
      <style>{GLOBAL_STYLES}</style>

      {/* 1. Header Superior Limpio Estilo ATP Tour */}
      <TopHeaderBar
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenProShop={() => setIsProShopOpen(true)}
        onOpenBulletin={() => setIsBulletinOpen(true)}
        onSecretAdminTrigger={() => setIsAdminSuiteOpen(true)}
        unreadBulletinCount={unreadAlertsCount}
      />

      {/* 2. Contenedor Principal de Vistas con Scroll Independiente */}
      <main className="app-scroll-container no-scrollbar">
        {activeTab === "perfil" && (
          <MyProfileView
            player={currentUser}
            allPlayers={players}
            completedMatches={completedMatches}
            clubs={clubs}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenVipUpgrade={() => setIsVipModalOpen(true)}
            onOpenHeadToHead={(pA, pB) =>
              setH2hPair({ open: true, pA, pB })
            }
            onOpenStoryPoster={(m) => setStoryPosterMatch(m)}
            onToggleLookingForMatch={handleToggleLookingForMatch}
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
            onRejectChallenge={handleRejectChallenge}
            onUpdateLiveRefereeScore={handleUpdateLiveRefereeScore}
            onFinalizeRefereeMatchPendingReview={
              handleFinalizeRefereeMatchPendingReview
            }
            onOpenHeadToHead={(pA, pB) =>
              setH2hPair({ open: true, pA, pB })
            }
          />
        )}

        {activeTab === "sedes" && (
          <SedesAndCoachProView
            clubs={clubs}
            coaches={coaches}
            currentUser={currentUser}
            liveWeather={liveWeatherHuancayo}
            onUpdateSurfaceWeather={handleUpdateSurfaceWeather}
            onOpenClubDetailModal={(club) => setSelectedClubDetail(club)}
            onOpenCoachProfileModal={(coach) => setSelectedCoachModal(coach)}
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

      {/* 3. Barra de Navegación Inferior de 5 Pestañas con Halo Activo */}
      <BottomTabNavigation
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
      />

      {/* 4. Pop-up Automático de Reto Entrante (Guardado en localStorage, Cero Bucle) */}
      {incomingPopupChallenge && (
        <div className="fixed inset-0 z-50 ios-blur-backdrop flex items-center justify-center p-4">
          <div className="ios-modal-card w-full max-w-sm rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                style={{ background: "#D6FF00", color: "#0A1633" }}
              >
                Nuevo Desafío Recibido
              </span>
              <button
                type="button"
                onClick={() =>
                  setDismissedPendingPopupIds((prev) => [
                    ...prev,
                    incomingPopupChallenge.id,
                  ])
                }
                className="touch-btn w-8 h-8 rounded-full"
                style={{ background: "var(--bg-subtle)" }}
              >
                <Icons.Close size={16} />
              </button>
            </div>

            {(() => {
              const challenger = players.find(
                (p) => p.id === incomingPopupChallenge.challengerId
              );
              return (
                <div className="flex items-center gap-3.5">
                  <SafeImage
                    src={challenger?.avatar}
                    alt={challenger?.name}
                    circular
                    style={{ width: 54, height: 54 }}
                  />
                  <div>
                    <div className="font-display font-black text-base">
                      {challenger?.name} te desafía
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: "var(--clay)" }}
                    >
                      {incomingPopupChallenge.customClubName}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {incomingPopupChallenge.dateTimeLabel} ·{" "}
                      {incomingPopupChallenge.ballAgreement}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  handleAcceptChallenge(incomingPopupChallenge.id)
                }
                className="touch-btn py-3 rounded-xl font-display font-extrabold text-xs uppercase"
                style={{ background: "#D6FF00", color: "#0A1633" }}
              >
                Aceptar Reto
              </button>
              <button
                type="button"
                onClick={() =>
                  handleRejectChallenge(incomingPopupChallenge.id)
                }
                className="touch-btn py-3 rounded-xl font-semibold text-xs border"
                style={{
                  borderColor: "var(--border-strong)",
                  color: "var(--text-muted)",
                }}
              >
                Declinar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Todos los Modales Independientes con Desenfoque iOS */}
      <SideNavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        onOpenVisualRules={() => setIsVisualRulesOpen(true)}
        onOpenVipModal={() => setIsVipModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <BulletinAndNewsModal
        isOpen={isBulletinOpen}
        onClose={() => setIsBulletinOpen(false)}
        currentUser={currentUser}
        challenges={challenges}
        players={players}
        newsItems={editorialNews}
        liveTicker={ATP_WTA_LIVE_TICKER}
        onAcceptChallenge={handleAcceptChallenge}
        onRejectChallenge={handleRejectChallenge}
        onGoToChallenges={() => setActiveTab("retos")}
      />

      <ProShopModal
        isOpen={isProShopOpen}
        onClose={() => setIsProShopOpen(false)}
        items={PRO_SHOP_ITEMS}
        currentUser={currentUser}
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
        vipPendingPlayerIds={vipPendingIds}
        onApproveTournamentApplicant={handleApproveTournamentApplicant}
        onRejectTournamentApplicant={handleRejectTournamentApplicant}
        onApproveVipMember={(pid) => {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === pid ? { ...p, isVipMember: true } : p
            )
          );
          setVipPendingIds((prev) => prev.filter((id) => id !== pid));
        }}
        onAdminResetPlayerPassword={(pid) =>
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === pid ? { ...p, password: "Tenis2026" } : p
            )
          )
        }
        onAdminTogglePlayerStatus={(pid) =>
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === pid
                ? {
                    ...p,
                    activeStatus:
                      p.activeStatus === "inactive" ? "active" : "inactive",
                  }
                : p
            )
          )
        }
        onTriggerSeasonReset={() =>
          setPlayers((prev) => prev.map((p) => applySeasonResetToPlayer(p)))
        }
      />
    </div>
  );
}

// === FIN DEL BLOQUE 10 DE 10 ===
