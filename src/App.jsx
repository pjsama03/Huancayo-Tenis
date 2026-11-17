// ============================================================================
// MATCHPOINT — CIRCUITO OFICIAL DE TENIS · HUANCAYO
// PARTE 1 DE 14: MOTOR MÓVIL (2018-2026), SILUETA WTA, 82 ACTIVOS Y FÍSICAS CSS
// ============================================================================

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ----------------------------------------------------------------------------
// 1. CONFIGURACIÓN CENTRAL Y CONECTOR EN VIVO CON SUPABASE + UMBRAL 80% MEMORIA
// ----------------------------------------------------------------------------
export const CIRCUIT_CONFIG = {
  brandName: "MATCHPOINT",
  city: "Huancayo",
  region: "Valle del Mantaro · Junín",
  seasonLabel: "Temporada Oficial 2026",
  adminWhatsApp: "51999888777",
  adminYapeNumber: "999 888 777",
  adminPlinNumber: "999 888 777",
  adminHolderName: "Comité Oficial MatchPoint Huancayo",
  adminSecretPin: "1234",
  vipMonthlyPriceSoles: 29.9,
  vipAnnualPriceSoles: 279.0,
  storageSafeLimitRecords: 500, // Tope de referencia para alerta preventiva al 80%
  coordinatesHuancayo: {
    latitude: -12.0651,
    longitude: -75.2049,
  },
  socialLinks: {
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
    facebook: "https://facebook.com",
    youtube: "https://youtube.com",
    x: "https://x.com",
    whatsapp: "https://wa.me/51999888777",
  },
};

const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  "";
const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  "";

export async function syncRecordToSupabase(table, payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, mode: "local_only" };
  }
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { ok: false, status: response.status };
    }
    const data = await response.json().catch(() => null);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function fetchTableFromSupabase(table, queryParams = "select=*") {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, data: null };
  }
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) return { ok: false, data: null };
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, data: null, error };
  }
}

// Evalúa el porcentaje de uso de memoria de registros históricos y genera CSV
export function evaluateStorageUsage(matches = [], challenges = [], claims = []) {
  const totalRecords =
    (Array.isArray(matches) ? matches.length : 0) +
    (Array.isArray(challenges) ? challenges.length : 0) +
    (Array.isArray(claims) ? claims.length : 0);
  const limit = CIRCUIT_CONFIG.storageSafeLimitRecords;
  const usagePercent = Math.min(100, Math.round((totalRecords / limit) * 100));
  return {
    totalRecords,
    limit,
    usagePercent,
    isWarningZone: usagePercent >= 75,
    isCriticalZone: usagePercent >= 85,
  };
}

export function exportHistoricalDataToCSV({ matches = [], players = [], claims = [] }) {
  try {
    const headers = [
      "Tipo_Registro",
      "ID",
      "Fecha",
      "Jugador_A",
      "Jugador_B",
      "Marcador",
      "Sede",
      "Ganador",
      "Variacion_Puntos",
    ];
    const rows = matches.map((m) => [
      "PARTIDO_OFICIAL",
      m.id || "",
      m.date || "",
      m.playerAName || "",
      m.playerBName || "",
      Array.isArray(m.sets) ? m.sets.map((s) => `${s.a}-${s.b}`).join(" / ") : m.score || "",
      m.club || "",
      m.winnerName || "",
      m.eloDelta || 0,
    ]);
    claims.forEach((c) => {
      rows.push([
        `LIBRO_RECLAMACIONES_${c.type || "RECLAMO"}`,
        c.code || "",
        c.createdAt || "",
        c.fullName || "",
        c.documentId || "",
        (c.detail || "").replace(/[\n\r,]+/g, " "),
        c.phone || "",
        c.email || "",
        0,
      ]);
    });

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `MATCHPOINT_Historico_${stamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------------------------------
// 2. MOTOR DE IMAGEN EN CLIENTE: COMPRESIÓN (< 55 KB), ENCUADRE Y SILUETA WTA
// ----------------------------------------------------------------------------
export function compressImageFile(file, maxWidth = 720, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No se seleccionó ningún archivo"));
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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Renderiza la foto con el Zoom (1x - 2.4x), Desplazamiento X/Y y Ángulo (-15° a +15°)
// elegidos por el jugador en el Estudio de Foto del Perfil.
export function renderFramedPlayerPhoto(
  imageSrc,
  { zoom = 1, offsetX = 0, offsetY = 0, angle = 0, outputWidth = 640, outputHeight = 800 } = {}
) {
  return new Promise((resolve) => {
    if (!imageSrc) return resolve("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, outputWidth, outputHeight);

        ctx.save();
        ctx.translate(outputWidth / 2 + (offsetX * outputWidth) / 100, outputHeight / 2 + (offsetY * outputHeight) / 100);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const scaleCover = Math.max(outputWidth / img.width, outputHeight / img.height);
        const drawW = img.width * scaleCover;
        const drawH = img.height * scaleCover;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

// Algoritmo de Recorte de Silueta / Cuerpo Estilo WTA (Portrait Cutout)
// Detecta el color perimetral de fondo y despeja el contorno dejando la figura del tenista.
export function processWtaSilhouetteCutout(imageSrc, tolerance = 42) {
  return new Promise((resolve) => {
    if (!imageSrc) return resolve("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 660;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const sampleCoords = [
          [3, 3],
          [w - 4, 3],
          [Math.floor(w * 0.5), 3],
          [3, Math.floor(h * 0.22)],
          [w - 4, Math.floor(h * 0.22)],
        ];
        let rBg = 0,
          gBg = 0,
          bBg = 0;
        sampleCoords.forEach(([sx, sy]) => {
          const i = (sy * w + sx) * 4;
          rBg += data[i];
          gBg += data[i + 1];
          bBg += data[i + 2];
        });
        rBg /= sampleCoords.length;
        gBg /= sampleCoords.length;
        bBg /= sampleCoords.length;

        const centerX = w * 0.5;
        const centerY = h * 0.56;
        const rx = w * 0.42;
        const ry = h * 0.48;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const colorDiff = Math.sqrt(
              Math.pow(r - rBg, 2) + Math.pow(g - gBg, 2) + Math.pow(b - bBg, 2)
            );
            const coreDistance =
              Math.pow((x - centerX) / rx, 2) + Math.pow((y - centerY) / ry, 2);

            if (colorDiff < tolerance && coreDistance > 0.38) {
              data[idx + 3] = 0;
            } else if (colorDiff < tolerance * 1.32 && coreDistance > 0.62) {
              data[idx + 3] = Math.round(data[idx + 3] * 0.28);
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

// ----------------------------------------------------------------------------
// 3. HOOK DE PERSISTENCIA BLINDADO CON LIMPIEZA PREVENTIVA EN SAFARI iOS
// ----------------------------------------------------------------------------
const STORAGE_NAMESPACE = "mp_wta_v12_";

export function usePersistentState(key, initialValue) {
  const storageKey = STORAGE_NAMESPACE + key;
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") {
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null && saved !== undefined && saved !== "undefined") {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Usa valor por defecto si hay corrupción previa
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (quotaErr) {
      try {
        Object.keys(window.localStorage).forEach((k) => {
          if (k.startsWith("mp_") && !k.startsWith(STORAGE_NAMESPACE)) {
            window.localStorage.removeItem(k);
          }
        });
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e2) {
        // Silencioso en modo privado antiguo
      }
    }
  }, [storageKey, state]);

  return [state, setState];
}

// ----------------------------------------------------------------------------
// 4. MOTOR SILENCIOSO DE CALIBRACIÓN UNIVERSAL (CELULARES 2018 A 2026)
// ----------------------------------------------------------------------------
export function useMobileViewportEngine() {
  const [viewportInfo, setViewportInfo] = useState({
    screenClass: "standard", // 'compact' (<=368px), 'standard' (369-411px), 'large' (>=412px)
    isLowPowerDevice: false,
    isHighRefreshCapable: true,
    isIOS: false,
    isInAppBrowser: false,
    width: 390,
    height: 844,
    keyboardOpen: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Line|TikTok/i.test(ua);
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const isOldOS = /OS (12|13|14)_/.test(ua) || /Android (7|8|9)/.test(ua);
    const isLowPowerDevice = (cores <= 4 && memory <= 3) || isOldOS;
    const dpr = window.devicePixelRatio || 2;
    const isHighRefreshCapable = !isLowPowerDevice && dpr >= 2;

    let maxObservedHeight = window.innerHeight;

    const recalibrateViewport = () => {
      const vv = window.visualViewport;
      const currentW = vv ? Math.round(vv.width) : window.innerWidth;
      const currentH = vv ? Math.round(vv.height) : window.innerHeight;

      if (currentH > maxObservedHeight) {
        maxObservedHeight = currentH;
      }

      const keyboardOpen = maxObservedHeight - currentH > 135;
      const screenClass =
        currentW <= 368 ? "compact" : currentW >= 412 ? "large" : "standard";

      const root = document.documentElement;
      root.style.setProperty("--app-height", `${ keyboardOpen ? maxObservedHeight : currentH }px`);
      root.style.setProperty("--visual-height", `${currentH}px`);
      root.style.setProperty("--app-width", `${currentW}px`);
      root.setAttribute("data-screen-class", screenClass);
      root.setAttribute("data-power-tier", isLowPowerDevice ? "lite" : "ultra");

      setViewportInfo({
        screenClass,
        isLowPowerDevice,
        isHighRefreshCapable,
        isIOS,
        isInAppBrowser,
        width: currentW,
        height: currentH,
        keyboardOpen,
      });
    };

    recalibrateViewport();
    window.addEventListener("resize", recalibrateViewport, { passive: true });
    window.addEventListener("orientationchange", recalibrateViewport, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", recalibrateViewport, { passive: true });
    }

    return () => {
      window.removeEventListener("resize", recalibrateViewport);
      window.removeEventListener("orientationchange", recalibrateViewport);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", recalibrateViewport);
      }
    };
  }, []);

  return viewportInfo;
}

// ----------------------------------------------------------------------------
// 5. FEEDBACK TÁCTIL DIFERENCIADO POR FAMILIA DE BOTÓN
// ----------------------------------------------------------------------------
export function triggerHaptic(type = "light") {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    switch (type) {
      case "hero": // Botones primarios (Retar, Inscribir, Confirmar)
        navigator.vibrate(12);
        break;
      case "success": // Confirmación de marcador o canje
        navigator.vibrate([8, 30, 12]);
        break;
      case "tab": // Cambio de pestaña o filtro magnético
        navigator.vibrate(4);
        break;
      case "card": // Toque en fila de ranking o sede
        navigator.vibrate(7);
        break;
      case "score": // Punto en el Modo Árbitro en vivo
        navigator.vibrate(10);
        break;
      default:
        navigator.vibrate(6);
    }
  } catch (e) {
    // Dispositivos sin API de vibración habilitada
  }
}

// ----------------------------------------------------------------------------
// 6. CATÁLOGO MAESTRO DE LOS 82 ACTIVOS (42 EXISTENTES + 40 NUEVOS CANVA PRO)
//    Y SISTEMA DE RESPALDO AUTOMÁTICO DE ALTA RESOLUCIÓN
// ----------------------------------------------------------------------------
export const ASSETS = {
  // === A. 42 ARCHIVOS EXISTENTES EN public/assets/ ===
  logoLegacy: "/assets/logo-matchpoint.png",
  navPerfil: "/assets/nav-perfil.png",
  navRanking: "/assets/nav-ranking.png",
  navRetos: "/assets/nav-retos.png",
  navSedes: "/assets/nav-sedes.png",
  navTorneos: "/assets/nav-torneos.png",

  clubCountry: "/assets/club-country-huancas.png",
  clubTauro: "/assets/club-tauro.png",
  clubRomina: "/assets/club-romina-cutipa.png",
  clubInkas: "/assets/club-los-inkas.png",

  pelotaVoltAzul: "/assets/pelota-3d-volt-azul.png",
  pelotaClasica: "/assets/pelota-3d-clasica.png",
  raquetaPro: "/assets/raqueta-3d-pro.png",
  raquetaOscura: "/assets/raqueta-3d-oscura.png",

  climaSeco: "/assets/canva-clima-seco.png",
  climaHumedad: "/assets/canva-clima-humedad.png",
  climaLlovizna: "/assets/canva-clima-llovizna.png",
  climaLluvia: "/assets/canva-clima-lluvia.png",

  goldenTicket: "/assets/canva-golden-ticket.png",
  proshopRollo: "/assets/canva-proshop-rollo.png",
  escudoCoach: "/assets/canva-escudo-coach.png",
  fuegoRacha: "/assets/fuego-racha-3d.png",
  badgeFavorito: "/assets/badge-favorito.png",

  cancha1: "/assets/cancha-1.png",
  poolFuego: "/assets/pool-fuego-clasico.png",
  poolRaquetaPelota: "/assets/pool-raqueta-pelota.png",
  poolTenistaAccion: "/assets/pool-tenista-accion.png",
  raquetasBlancas: "/assets/raquetas-cruzadas-blancas.png",
  raquetasNegras: "/assets/raquetas-cruzadas-negras.png",
  siluetaDerechaNegra: "/assets/silueta-derecha-negra.png",
  siluetaSaqueBlanca: "/assets/silueta-saque-blanca.png",
  siluetaSaqueNegra: "/assets/silueta-saque-negra.png",

  gifCelebracion1: "/assets/gif-celebracion-1.gif",
  gifCelebracion2: "/assets/gif-celebracion-2.gif",

  videoCoachRodrigo: "/assets/video-coach-rodrigo.mp4",
  videoCoachRomina: "/assets/video-coach-romina.mp4",
  videoCoachDemo3: "/assets/video-coach-demo-3.mp4",
  videoCoachDemo4: "/assets/video-coach-demo-4.mp4",
  videoCircuitoHorizontal: "/assets/video-circuito-horizontal.mp4",
  videoCoachHorizontal2: "/assets/video-coach-horizontal-2.mp4",
  videoHorizontal3: "/assets/video-horizontal-3.mp4",
  videoHorizontal4: "/assets/video-horizontal-4.mp4",

  // === B. 40 NUEVOS ARCHIVOS DE CANVA PRO (Ronda 38) ===
  // Bloque 1: Bienvenida, Pantalla de Carga y Logos
  bienvenidaHeroOscuro: "/assets/bienvenida-hero-oscuro.jpg",
  bienvenidaHeroClaro: "/assets/bienvenida-hero-claro.jpg",
  splashFondoOscuro: "/assets/splash-fondo-oscuro.jpg",
  splashFondoClaro: "/assets/splash-fondo-claro.jpg",
  logoMatchpointBlanco: "/assets/logo-matchpoint-blanco.png",
  logoMatchpointOscuro: "/assets/logo-matchpoint-oscuro.png",

  // Bloque 2: Fondos de Perfil Estilo Grand Slam y Base Claro/Oscuro
  perfilBgPurpuraOscuro: "/assets/perfil-bg-purpura-oscuro.jpg",
  perfilBgMarfilClaro: "/assets/perfil-bg-marfil-claro.jpg",
  perfilBgArcilla: "/assets/perfil-bg-arcilla.jpg",
  perfilBgCesped: "/assets/perfil-bg-cesped.jpg",
  perfilBgDura: "/assets/perfil-bg-dura.jpg",
  perfilBgFinals: "/assets/perfil-bg-finals.jpg",

  // Bloque 3: 6 Distintivos y Parches Oficiales Canjeables
  badgeReyArcilla: "/assets/badge-rey-arcilla.png",
  badgeInvicto: "/assets/badge-invicto.png",
  badgeMataGigantes: "/assets/badge-mata-gigantes.png",
  badgeMaestroTop8: "/assets/badge-maestro-top8.png",
  badgeSaqueCanon: "/assets/badge-saque-canon.png",
  badgeVeteranoOro: "/assets/badge-veterano-oro.png",

  // Bloque 4: Carrusel Horizontal de Torneos y Trofeos 3D
  torneoApertura: "/assets/torneo-apertura.jpg",
  torneoAltura: "/assets/torneo-altura.jpg",
  torneoMasterTop8: "/assets/torneo-master-top8.jpg",
  torneoDoblesValle: "/assets/torneo-dobles-valle.jpg",
  trofeoMasterTop8: "/assets/trofeo-master-top8.png",
  trofeoCampeonGira: "/assets/trofeo-campeon-gira.png",

  // Bloque 5: Portadas de las 4 Sedes y Estados Vacíos
  sedeCountryClub: "/assets/sede-country-club.jpg",
  sedeRominaCutipa: "/assets/sede-romina-cutipa.jpg",
  sedeClubTauro: "/assets/sede-club-tauro.jpg",
  sedeLosInkas: "/assets/sede-los-inkas.jpg",
  estadoVacioOscuro: "/assets/estado-vacio-oscuro.png",
  estadoVacioClaro: "/assets/estado-vacio-claro.png",

  // Bloque 6: Banners Especiales, Videos y Portal Split-Screen
  bannerVisionIa: "/assets/banner-vision-ia.jpg",
  bannerPaseVip: "/assets/banner-pase-vip.jpg",
  portadaTipsSemana: "/assets/portada-tips-semana.jpg",
  portadaAcademiaTv: "/assets/portada-academia-tv.jpg",
  loginPosterEsmeralda: "/assets/login-poster-esmeralda.jpg",
  registroPosterPurpura: "/assets/registro-poster-purpura.jpg",

  // Bloque 7: Marcos de Historias 9:16 para Redes Sociales
  storyMarcoVictoriaOscuro: "/assets/story-marco-victoria-oscuro.png",
  storyMarcoVictoriaClaro: "/assets/story-marco-victoria-claro.png",
  storyMarcoDuelo: "/assets/story-marco-duelo.png",
  storyRoundupJornada: "/assets/story-roundup-jornada.jpg",
};

// Mapa de respaldo provisional automático: si un archivo de los 40 nuevos aún no
// está en GitHub, <SmartImage/> carga al instante esta fotografía editorial de alta nitidez.
export const FALLBACK_BY_PATH = {
  "/assets/bienvenida-hero-oscuro.jpg":
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=82",
  "/assets/bienvenida-hero-claro.jpg":
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=82",
  "/assets/splash-fondo-oscuro.jpg":
    "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1100&q=80",
  "/assets/splash-fondo-claro.jpg":
    "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1100&q=80",
  "/assets/logo-matchpoint-blanco.png": "/assets/logo-matchpoint.png",
  "/assets/logo-matchpoint-oscuro.png": "/assets/logo-matchpoint.png",

  "/assets/perfil-bg-purpura-oscuro.jpg":
    "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1100&q=80",
  "/assets/perfil-bg-marfil-claro.jpg":
    "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1100&q=80",
  "/assets/perfil-bg-arcilla.jpg":
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1100&q=82",
  "/assets/perfil-bg-cesped.jpg":
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1100&q=82",
  "/assets/perfil-bg-dura.jpg":
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1100&q=82",
  "/assets/perfil-bg-finals.jpg":
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1100&q=82",

  "/assets/badge-rey-arcilla.png": "/assets/badge-favorito.png",
  "/assets/badge-invicto.png": "/assets/fuego-racha-3d.png",
  "/assets/badge-mata-gigantes.png": "/assets/canva-escudo-coach.png",
  "/assets/badge-maestro-top8.png": "/assets/canva-golden-ticket.png",
  "/assets/badge-saque-canon.png": "/assets/pelota-3d-volt-azul.png",
  "/assets/badge-veterano-oro.png": "/assets/pelota-3d-clasica.png",

  "/assets/torneo-apertura.jpg":
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1100&q=82",
  "/assets/torneo-altura.jpg":
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1100&q=82",
  "/assets/torneo-master-top8.jpg":
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1100&q=82",
  "/assets/torneo-dobles-valle.jpg":
    "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1100&q=82",
  "/assets/trofeo-master-top8.png": "/assets/nav-torneos.png",
  "/assets/trofeo-campeon-gira.png": "/assets/nav-ranking.png",

  "/assets/sede-country-club.jpg":
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1100&q=80",
  "/assets/sede-romina-cutipa.jpg":
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1100&q=80",
  "/assets/sede-club-tauro.jpg":
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1100&q=80",
  "/assets/sede-los-inkas.jpg":
    "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1100&q=80",
  "/assets/estado-vacio-oscuro.png": "/assets/raquetas-cruzadas-blancas.png",
  "/assets/estado-vacio-claro.png": "/assets/raquetas-cruzadas-negras.png",

  "/assets/banner-vision-ia.jpg":
    "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1100&q=80",
  "/assets/banner-pase-vip.jpg":
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1100&q=80",
  "/assets/portada-tips-semana.jpg":
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1100&q=80",
  "/assets/portada-academia-tv.jpg":
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1100&q=80",
  "/assets/login-poster-esmeralda.jpg":
    "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1000&q=82",
  "/assets/registro-poster-purpura.jpg":
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=82",
  "/assets/story-roundup-jornada.jpg":
    "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1080&q=82",
};

// ----------------------------------------------------------------------------
// 7. COLECCIONES OFICIALES GRAND SLAM Y DISTINTIVOS DE PERFIL (CANJE CON GEMAS)
// ----------------------------------------------------------------------------
export const GRAND_SLAM_SURFACES = [
  {
    id: "finals",
    name: "Estadio Nocturno Finals",
    subtitle: "Reflectores Esmeralda & Púrpura Noche",
    surfaceLabel: "PISTA CENTRAL",
    bgAsset: ASSETS.perfilBgFinals,
    fallbackGradient:
      "radial-gradient(circle at 75% 22%, rgba(0,220,125,0.34) 0%, rgba(41,12,70,0.92) 48%, #1E0734 100%)",
    accentHex: "#00DC7D",
    pillBg: "rgba(0, 220, 125, 0.18)",
    costGems: 0, // Desbloqueado por defecto
    unlockedByDefault: true,
  },
  {
    id: "arcilla",
    name: "Tierra Batida Roland Garros",
    subtitle: "Polvo de Ladrillo Oficial del Valle",
    surfaceLabel: "ARCILLA",
    bgAsset: ASSETS.perfilBgArcilla,
    fallbackGradient:
      "linear-gradient(135deg, #4A1C12 0%, #9E3E1E 48%, #C85A32 82%, #1E0734 100%)",
    accentHex: "#E07A5F",
    pillBg: "rgba(200, 90, 50, 0.28)",
    costGems: 60,
    unlockedByDefault: false,
  },
  {
    id: "cesped",
    name: "Césped Clásico Wimbledon",
    subtitle: "Tradición sobre Grama Sagrada",
    surfaceLabel: "CÉSPED",
    bgAsset: ASSETS.perfilBgCesped,
    fallbackGradient:
      "linear-gradient(135deg, #092E20 0%, #0F5238 52%, #00A859 88%, #1E0734 100%)",
    accentHex: "#6EF2B5",
    pillBg: "rgba(0, 220, 125, 0.24)",
    costGems: 80,
    unlockedByDefault: false,
  },
  {
    id: "dura",
    name: "Cancha Rápida US Open",
    subtitle: "Velocidad Nocturna en Pista Dura",
    surfaceLabel: "PISTA DURA",
    bgAsset: ASSETS.perfilBgDura,
    fallbackGradient:
      "linear-gradient(135deg, #0D1B4C 0%, #1D3587 50%, #290C46 88%, #1E0734 100%)",
    accentHex: "#60A5FA",
    pillBg: "rgba(96, 165, 250, 0.24)",
    costGems: 80,
    unlockedByDefault: false,
  },
];

export const OFFICIAL_PROFILE_BADGES = [
  {
    id: "badge-rey-arcilla",
    name: "Rey de la Arcilla",
    shortLabel: "Rey de Arcilla",
    description: "Dominio demostrado en canchas de polvo de ladrillo de Huancayo.",
    howToEarn: "Gana 3 partidos seguidos en arcilla o canjéalo en tu perfil.",
    asset: ASSETS.badgeReyArcilla,
    accentColor: "#C85A32",
    costGems: 50,
  },
  {
    id: "badge-invicto",
    name: "Racha Imparable",
    shortLabel: "En Racha",
    description: "Insignia de constancia para quienes encadenan victorias consecutivas.",
    howToEarn: "Consigue una racha activa de 3 o más victorias seguidas.",
    asset: ASSETS.badgeInvicto,
    accentColor: "#00DC7D",
    costGems: 65,
  },
  {
    id: "badge-mata-gigantes",
    name: "Matagigantes",
    shortLabel: "Matagigantes",
    description: "Distintivo de honor por derrotar a un rival con mayor puntaje en el ranking.",
    howToEarn: "Vence en cancha a un jugador ubicado más arriba en la tabla.",
    asset: ASSETS.badgeMataGigantes,
    accentColor: "#6EF2B5",
    costGems: 80,
  },
  {
    id: "badge-saque-canon",
    name: "Saque Cañón",
    shortLabel: "Saque Cañón",
    description: "Potencia y precisión cerrando games con tu primer servicio.",
    howToEarn: "Gana un set por 6-0 o 6-1 o desbloquéalo con tus gemas.",
    asset: ASSETS.badgeSaqueCanon,
    accentColor: "#00DC7D",
    costGems: 55,
  },
  {
    id: "badge-veterano-oro",
    name: "Honor +40 Master",
    shortLabel: "+40 Master",
    description: "Prestigio y vigencia competitiva en la división +40 del Valle del Mantaro.",
    howToEarn: "Compite en la división +40 Master o desbloquéalo en tienda.",
    asset: ASSETS.badgeVeteranoOro,
    accentColor: "#D97706",
    costGems: 70,
  },
  {
    id: "badge-maestro-top8",
    name: "Maestro Top 8",
    shortLabel: "Top 8 Finals",
    description: "Corona reservada a los clasificados al Torneo de Maestros de fin de año.",
    howToEarn: "Entra entre los 8 mejores del ranking general o +40 Master.",
    asset: ASSETS.badgeMaestroTop8,
    accentColor: "#F59E0B",
    costGems: 120,
  },
];

// ----------------------------------------------------------------------------
// 8. HOJA MAESTRA DE ESTILOS MOBILE-FIRST + LAS 5 FAMILIAS DE MICROINTERACCIONES
// ----------------------------------------------------------------------------
export const GLOBAL_WTA_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Antonio:wght@600;700&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --app-height: 100dvh;
    --visual-height: 100dvh;
    --app-width: 100vw;

    /* Paleta Oficial Fusión WTA + Tierra Batida Huancayo */
    --wta-purple-deep: #1E0734;
    --wta-purple-card: #290C46;
    --wta-purple-elevated: #341158;
    --wta-emerald: #00DC7D;
    --wta-emerald-dark: #00A859;
    --wta-emerald-mint: #6EF2B5;
    --wta-ivory: #FAF9F5;
    --wta-white: #FFFFFF;
    --wta-clay: #C85A32;
    --wta-clay-light: #E07A5F;
    --wta-gold: #D97706;
    --wta-gold-bright: #F59E0B;

    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
  }

  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    height: -webkit-fill-available;
    overflow: hidden;
    overscroll-behavior: none;
    background-color: #1E0734;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    user-select: none;
  }

  /* Contenedor Raíz Anclado (Anti-Rebote en Safari iPhone y Navegadores In-App) */
  .mp-app-shell {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: var(--app-height, 100dvh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: background-color 0.28s ease, color 0.28s ease;
  }

  /* Área Scrolleable con Margen Inferior Blindado (Jamás Muerde el Carnet VIP) */
  .mp-scroll-container {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    scroll-behavior: smooth;
    padding-bottom: calc(116px + var(--safe-bottom));
  }

  .mp-scroll-container::-webkit-scrollbar,
  .no-scrollbar::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Tipografías Atléticas con Escalado Fluido según Ancho del Celular */
  .font-wta-condensed {
    font-family: 'Antonio', 'Outfit', sans-serif;
    letter-spacing: -0.015em;
    line-height: 1.03;
    text-transform: uppercase;
  }
  .font-wta-display {
    font-family: 'Outfit', sans-serif;
    letter-spacing: -0.02em;
  }
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  /* Ajustes Automáticos para Celulares Compactos (2018-2020: <=368px) */
  html[data-screen-class="compact"] .mp-responsive-title {
    font-size: 1.35rem !important;
    line-height: 1.15 !important;
  }
  html[data-screen-class="compact"] .mp-responsive-pad {
    padding-left: 0.75rem !important;
    padding-right: 0.75rem !important;
  }

  /* Modo Ligero Silencioso para Equipos de 2-3 GB RAM (Cero Lag) */
  html[data-power-tier="lite"] .mp-glass-surface,
  html[data-power-tier="lite"] .mp-modal-backdrop {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* ==========================================================================
     FAMILIA 1: BOTONES PRIMARIOS HERO CTAs (COMPRESIÓN ELÁSTICA + SHIMMER)
     ========================================================================== */
  .mp-btn-tactile,
  .mp-btn-emerald,
  .mp-btn-purple,
  .mp-btn-gold,
  .mp-btn-clay {
    position: relative;
    overflow: hidden;
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.22s ease,
                background-color 0.2s ease,
                border-color 0.2s ease,
                opacity 0.2s ease;
    will-change: transform;
    cursor: pointer;
  }
  .mp-btn-tactile:active,
  .mp-btn-emerald:active,
  .mp-btn-purple:active,
  .mp-btn-gold:active,
  .mp-btn-clay:active {
    transform: scale(0.955);
  }
  .mp-btn-emerald {
    background: linear-gradient(135deg, #00A859 0%, #00DC7D 100%);
    color: #1E0734;
    font-weight: 800;
    box-shadow: 0 6px 20px -4px rgba(0, 220, 125, 0.45);
  }
  .mp-btn-emerald:hover {
    box-shadow: 0 8px 26px -2px rgba(0, 220, 125, 0.62);
  }
  .mp-btn-purple {
    background: linear-gradient(135deg, #290C46 0%, #1E0734 100%);
    color: #FFFFFF;
    font-weight: 800;
    border: 1.5px solid rgba(0, 220, 125, 0.45);
  }
  .mp-btn-gold {
    background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
    color: #1E0734;
    font-weight: 800;
    box-shadow: 0 6px 20px -4px rgba(245, 158, 11, 0.42);
  }
  .mp-btn-clay {
    background: linear-gradient(135deg, #A34220 0%, #C85A32 100%);
    color: #FFFFFF;
    font-weight: 800;
    box-shadow: 0 6px 18px -4px rgba(200, 90, 50, 0.45);
  }

  /* Destello Diagonal Shimmer en Botones Principales */
  @keyframes mpShimmerSweep {
    0% { transform: translateX(-130%) skewX(-22deg); }
    100% { transform: translateX(220%) skewX(-22deg); }
  }
  .mp-btn-shimmer::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 45%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.36) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: mpShimmerSweep 3.4s infinite ease-in-out;
    pointer-events: none;
  }

  /* ==========================================================================
     FAMILIA 2: TARJETAS CON AURA VERDE ESMERALDA WTA (PARTIDOS, SEDES, JUGADORES)
     ========================================================================== */
  .wta-card-aura {
    transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
                border-color 0.22s ease,
                box-shadow 0.22s ease,
                background-color 0.22s ease;
    will-change: transform, box-shadow;
  }
  .wta-card-aura:hover,
  .wta-card-aura:active,
  .wta-card-aura:focus-within {
    border-color: #00DC7D !important;
    box-shadow: 0 0 24px rgba(0, 220, 125, 0.32);
    transform: translateY(-1.5px);
  }
  .wta-card-aura:active {
    transform: scale(0.988);
  }

  /* ==========================================================================
     FAMILIA 3: PÍLDORAS DE NAVEGACIÓN Y FILTROS MAGNÉTICOS SEGMENTADOS
     ========================================================================== */
  .wta-pill-tab {
    transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
  }
  .wta-pill-tab-inactive {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.16);
  }
  .wta-pill-tab-inactive:hover,
  .wta-pill-tab-inactive:active {
    background: #FFFFFF !important;
    color: #1E0734 !important;
    border-color: #FFFFFF !important;
    transform: scale(1.03);
  }
  .wta-pill-tab-active {
    background: #FFFFFF !important;
    color: #1E0734 !important;
    font-weight: 800;
    border: 1.5px solid #00DC7D;
    box-shadow: 0 4px 16px rgba(0, 220, 125, 0.28);
    transform: scale(1.03);
  }

  /* ==========================================================================
     FAMILIA 4: CAJAS DE TEXTO VIVAS, ICONOS ROTATIVOS Y ONDA RIPPLE
     ========================================================================== */
  .mp-input-alive {
    font-size: 16px !important; /* Bloquea el zoom automático de Safari en iPhone */
    transition: border-color 0.22s ease,
                box-shadow 0.22s ease,
                transform 0.16s cubic-bezier(0.22, 1, 0.36, 1),
                background-color 0.2s ease;
  }
  .mp-input-alive:focus {
    outline: none;
    border-color: #00DC7D !important;
    box-shadow: 0 0 0 3.5px rgba(0, 220, 125, 0.22);
    transform: translateY(-1px);
  }

  .mp-gear-spin {
    transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .mp-gear-spin:hover,
  .mp-gear-spin:active {
    transform: rotate(45deg) scale(1.08);
  }

  .mp-close-btn {
    transition: transform 0.16s ease, opacity 0.16s ease, background-color 0.16s ease;
  }
  .mp-close-btn:active {
    transform: scale(0.88);
    opacity: 0.75;
  }

  @keyframes challengeRipplePulse {
    0% { box-shadow: 0 0 0 0 rgba(0, 220, 125, 0.65); }
    70% { box-shadow: 0 0 0 11px rgba(0, 220, 125, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 220, 125, 0); }
  }
  .mp-challenge-ripple {
    animation: challengeRipplePulse 2s infinite cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* ==========================================================================
     FAMILIA 5: TRANSICIONES ENTRE PESTAÑAS, CORTINAS Y MODALES BLUR iOS
     ========================================================================== */
  @keyframes mpViewEnter {
    0% {
      opacity: 0;
      transform: translateY(12px) scale(0.992);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .mp-view-enter {
    animation: mpViewEnter 0.26s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes mpModalBackdropIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes mpModalSheetIn {
    0% {
      opacity: 0;
      transform: translateY(26px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .mp-modal-backdrop {
    background: rgba(16, 4, 28, 0.66);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    animation: mpModalBackdropIn 0.22s ease forwards;
  }
  .mp-modal-sheet {
    animation: mpModalSheetIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Transición Tipo Cortina Vertical (2ª+ Apertura: Logo Splash -> Retos) */
  @keyframes curtainSlideWipeUp {
    0% {
      transform: translateY(0%);
      opacity: 1;
    }
    100% {
      transform: translateY(-103%);
      opacity: 0.98;
    }
  }
  .curtain-slide-exit {
    animation: curtainSlideWipeUp 0.58s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }

  /* Enfoque Progresivo de Reflectores (Blur-to-Sharp WTA) */
  @keyframes blurToSharpReveal {
    0% {
      filter: blur(18px);
      transform: scale(1.04);
      opacity: 0.65;
    }
    100% {
      filter: blur(0px);
      transform: scale(1);
      opacity: 1;
    }
  }
  .wta-blur-to-sharp {
    animation: blurToSharpReveal 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Halo Luminoso Animado en TU Propia Fila del Ranking */
  @keyframes emeraldRankRowHalo {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(0, 220, 125, 0.45), inset 0 0 16px rgba(0, 220, 125, 0.16);
    }
    50% {
      box-shadow: 0 0 22px 3px rgba(0, 220, 125, 0.36), inset 0 0 22px rgba(0, 220, 125, 0.26);
    }
  }
  .my-rank-halo-row {
    border: 2px solid #00DC7D !important;
    animation: emeraldRankRowHalo 2.6s infinite ease-in-out;
  }

  /* Giro Exclusivo en Eje Vertical para Raquetas 3D */
  @keyframes racketRotateY {
    0%, 100% { transform: perspective(700px) rotateY(-16deg) translateY(0px); }
    50% { transform: perspective(700px) rotateY(16deg) translateY(-4px); }
  }
  .mp-racket-3d-spin {
    animation: racketRotateY 4.5s infinite ease-in-out;
  }

  /* Carrusel Horizontal Magnético para Torneos y Stories */
  .mp-horizontal-snap {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .mp-horizontal-snap::-webkit-scrollbar {
    display: none;
  }
  .mp-snap-card {
    scroll-snap-align: center;
    flex-shrink: 0;
  }
`;

// === FIN DEL BLOQUE 1 DE 14 ===

// ============================================================================
// PARTE 2 DE 14: ICONOGRAFÍA VECTORIAL SVG (+45 ICONOS), LOGOTIPO OFICIAL EN
// 3 VARIANTES, RETRATOS ESMERALDA WTA, MODALES BLUR iOS Y ARRANQUE EN 2 CAMINOS
// ============================================================================

// ----------------------------------------------------------------------------
// 1. COMPONENTE <SmartImage/> (Y ALIAS <SafeImage/>) CON RESPALDO AUTOMÁTICO
//    DE ALTA NITIDEZ, CARGA DIFERIDA Y CERO ICONOS ROTOS [?] EN SAFARI iOS
// ----------------------------------------------------------------------------
export function SmartImage({
  src,
  alt = "",
  className = "",
  style = {},
  fallbackSrc = "",
  fallbackText = "MP",
  isAvatar = false,
  eager = false,
  onClick,
}) {
  const resolvedPrimary = useMemo(() => {
    if (!src) return fallbackSrc || FALLBACK_BY_PATH["/assets/perfil-bg-finals.jpg"];
    return src;
  }, [src, fallbackSrc]);

  const resolvedBackup = useMemo(() => {
    if (fallbackSrc) return fallbackSrc;
    if (src && FALLBACK_BY_PATH[src]) return FALLBACK_BY_PATH[src];
    if (isAvatar) {
      return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80";
    }
    return "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80";
  }, [src, fallbackSrc, isAvatar]);

  const [currentSrc, setCurrentSrc] = useState(resolvedPrimary);
  const [hasFailedAll, setHasFailedAll] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(resolvedPrimary);
    setHasFailedAll(false);
  }, [resolvedPrimary]);

  const handleImageError = () => {
    if (currentSrc !== resolvedBackup && resolvedBackup) {
      setCurrentSrc(resolvedBackup);
    } else {
      setHasFailedAll(true);
    }
  };

  if (hasFailedAll) {
    const initials = String(fallbackText || alt || "MP")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase();

    return (
      <div
        onClick={onClick}
        style={style}
        className={`inline-flex items-center justify-center bg-gradient-to-br from-[#290C46] via-[#1E0734] to-[#00A859] text-white font-wta-display font-extrabold select-none overflow-hidden ${className}`}
      >
        <span className="text-xs tracking-wider opacity-95">{initials || "MP"}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onClick={onClick}
      onLoad={() => setLoaded(true)}
      onError={handleImageError}
      style={{
        ...style,
        opacity: loaded ? 1 : 0.92,
        transition: "opacity 0.24s ease",
      }}
      className={`object-cover ${className}`}
    />
  );
}

export const SafeImage = SmartImage;

// ----------------------------------------------------------------------------
// 2. LIBRERÍA COMPLETA DE +45 ICONOS VECTORIALES SVG DE TRAZO FINO (CERO EMOJIS
//    DE SISTEMA EN CONTROLES E INTERFAZ)
// ----------------------------------------------------------------------------
export function WtaIcon({ name, size = 20, className = "", strokeWidth = 2 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: `inline-block shrink-0 ${className}`,
  };

  switch (name) {
    case "gem":
      return (
        <svg {...commonProps}>
          <polygon
            points="6 3 18 3 22 9 12 22 2 9 6 3"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <polyline points="2 9 22 9" />
          <polyline points="12 22 8 9 6 3" />
          <polyline points="12 22 16 9 18 3" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...commonProps}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case "swords":
    case "challenge":
      return (
        <svg {...commonProps}>
          <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
          <line x1="13" y1="19" x2="19" y2="13" />
          <line x1="16" y1="16" x2="20" y2="20" />
          <line x1="19" y1="21" x2="21" y2="19" />
          <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
          <line x1="5" y1="14" x2="9" y2="18" />
          <line x1="7" y1="17" x2="4" y2="20" />
          <line x1="3" y1="19" x2="5" y2="21" />
        </svg>
      );
    case "ranking":
    case "crown":
      return (
        <svg {...commonProps}>
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
      );
    case "court":
    case "sedes":
      return (
        <svg {...commonProps}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="6" y1="4" x2="6" y2="20" />
          <line x1="18" y1="4" x2="18" y2="20" />
        </svg>
      );
    case "user":
    case "profile":
      return (
        <svg {...commonProps}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "users":
    case "h2h":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "camera":
      return (
        <svg {...commonProps}>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "scissors":
    case "cutout":
      return (
        <svg {...commonProps}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      );
    case "sparkles":
    case "magic":
      return (
        <svg {...commonProps}>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
        </svg>
      );
    case "swap":
      return (
        <svg {...commonProps}>
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case "bell":
      return (
        <svg {...commonProps}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "newspaper":
    case "bulletin":
      return (
        <svg {...commonProps}>
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      );
    case "menu":
      return (
        <svg {...commonProps}>
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="15" y2="17" />
        </svg>
      );
    case "settings":
    case "gear":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "close":
    case "x":
      return (
        <svg {...commonProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "check":
      return (
        <svg {...commonProps}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...commonProps}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...commonProps}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...commonProps}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...commonProps}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "map-pin":
      return (
        <svg {...commonProps}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "clock":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "play":
      return (
        <svg {...commonProps}>
          <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
        </svg>
      );
    case "video":
      return (
        <svg {...commonProps}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case "lock":
      return (
        <svg {...commonProps}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "unlock":
      return (
        <svg {...commonProps}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </svg>
      );
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "book-claim":
    case "reclamaciones":
      return (
        <svg {...commonProps}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
      );
    case "bag":
    case "shop":
      return (
        <svg {...commonProps}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "sun":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    case "moon":
      return (
        <svg {...commonProps}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      );
    case "eye":
      return (
        <svg {...commonProps}>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "eye-off":
      return (
        <svg {...commonProps}>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      );
    case "share":
      return (
        <svg {...commonProps}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      );
    case "download":
      return (
        <svg {...commonProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "star":
      return (
        <svg {...commonProps}>
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg {...commonProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...commonProps}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...commonProps}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...commonProps}>
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...commonProps}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...commonProps}>
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      );
    case "x-social":
      return (
        <svg {...commonProps}>
          <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
          <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </svg>
      );
  }
}

// ----------------------------------------------------------------------------
// 3. LOGOTIPO VECTORIAL OFICIAL <BrandLogo/> EN 3 VARIANTES AUTOMÁTICAS
//    1) "pill-light" (sobre barra blanca o Modo Claro)
//    2) "night-cobrand" (sobre fondo oscuro + Co-Branding MATCHPOINT | Sponsor)
//    3) "isotipo" (escudo compacto MP sin texto que se corte en pantallas estrechas)
// ----------------------------------------------------------------------------
export function BrandLogo({
  variant = "isotipo", // 'isotipo' | 'pill-light' | 'night-cobrand' | 'full'
  sponsorName = "",
  size = "md",
  onSecretAdminTrigger,
  className = "",
}) {
  const tapCounterRef = useRef({ count: 0, timer: null });

  const handleLogoTap = () => {
    triggerHaptic("light");
    if (!onSecretAdminTrigger) return;
    tapCounterRef.current.count += 1;
    if (tapCounterRef.current.timer) clearTimeout(tapCounterRef.current.timer);
    if (tapCounterRef.current.count >= 5) {
      tapCounterRef.current.count = 0;
      onSecretAdminTrigger();
      return;
    }
    tapCounterRef.current.timer = setTimeout(() => {
      tapCounterRef.current.count = 0;
    }, 1800);
  };

  const badgeSizeClass =
    size === "sm"
      ? "w-8 h-8 rounded-xl"
      : size === "lg"
      ? "w-14 h-14 rounded-2xl"
      : size === "xl"
      ? "w-20 h-20 rounded-3xl"
      : "w-9 h-9 rounded-xl";

  const IsotipoMark = (
    <div
      onClick={handleLogoTap}
      title="MATCHPOINT"
      className={`relative inline-flex items-center justify-center bg-gradient-to-br from-[#290C46] via-[#1E0734] to-[#120322] border border-[#00DC7D]/55 shadow-[0_4px_14px_rgba(0,220,125,0.25)] shrink-0 cursor-pointer select-none ${badgeSizeClass}`}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-[72%] h-[72%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Monograma MP con corte diagonal de línea de saque */}
        <path
          d="M6 36V12H12.5L18.5 24.5L24.5 12H31V36H25.5V21.5L19.5 33H17.5L11.5 21.5V36H6Z"
          fill="#FFFFFF"
        />
        <path
          d="M33.5 12H40.5C43.8 12 46 14.2 46 17.8C46 21.4 43.8 23.8 40.5 23.8H37V36H33.5V12ZM37 19.6H39.8C41.4 19.6 42.3 18.9 42.3 17.8C42.3 16.7 41.4 16 39.8 16H37V19.6Z"
          fill="#00DC7D"
        />
        {/* Línea de saque diagonal y pelota esmeralda */}
        <line
          x1="7"
          y1="39"
          x2="42"
          y2="39"
          stroke="#00DC7D"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="43.5" cy="10.5" r="3.2" fill="#00DC7D" />
      </svg>
    </div>
  );

  if (variant === "isotipo") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {IsotipoMark}
        {sponsorName ? (
          <div className="flex items-center gap-2">
            <span className="h-4 w-[1.5px] bg-current opacity-25" />
            <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider opacity-85 truncate max-w-[78px]">
              {sponsorName}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  const isLightPill = variant === "pill-light";
  const textColor = isLightPill ? "text-[#1E0734]" : "text-white";

  return (
    <div
      onClick={handleLogoTap}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${className}`}
    >
      {IsotipoMark}
      <div className="flex items-center gap-2">
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-0.5">
            <span
              className={`font-wta-condensed font-bold tracking-tight ${
                size === "lg" ? "text-2xl" : size === "xl" ? "text-3xl" : "text-lg"
              } ${textColor}`}
            >
              MATCH
            </span>
            <span
              className={`font-wta-condensed font-bold tracking-tight ${
                size === "lg" ? "text-2xl" : size === "xl" ? "text-3xl" : "text-lg"
              } text-[#00DC7D]`}
            >
              POINT
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00DC7D] ml-0.5 mb-2" />
          </div>
        </div>

        {sponsorName && (
          <>
            <span
              className={`h-5 w-[1.5px] ${
                isLightPill ? "bg-[#1E0734]/20" : "bg-white/25"
              }`}
            />
            <span
              className={`text-[10px] font-wta-display font-extrabold uppercase tracking-widest ${
                isLightPill ? "text-[#1E0734]/75" : "text-white/80"
              }`}
            >
              {sponsorName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 4. RETRATO ESMERALDA OFICIAL WTA (<WtaEmeraldPortrait/>) Y LAURELES DE PODIO
// ----------------------------------------------------------------------------
export function WtaEmeraldPortrait({
  player,
  size = "md", // 'sm' | 'md' | 'lg'
  showActionArrow = true,
  onClick,
  className = "",
}) {
  const dimensions =
    size === "sm"
      ? "w-11 h-11 rounded-xl"
      : size === "lg"
      ? "w-16 h-16 rounded-2xl"
      : "w-13 h-13 rounded-2xl";

  const badgeObj = useMemo(() => {
    if (!player?.activeBadgeId) return null;
    return OFFICIAL_PROFILE_BADGES.find((b) => b.id === player.activeBadgeId) || null;
  }, [player?.activeBadgeId]);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div
        className={`relative overflow-hidden bg-gradient-to-b from-[#00DC7D] via-[#1AE68A] to-[#009E52] border border-white/25 shadow-[0_6px_16px_rgba(0,220,125,0.28)] ${dimensions}`}
        style={{
          width: size === "sm" ? 44 : size === "lg" ? 64 : 52,
          height: size === "sm" ? 44 : size === "lg" ? 64 : 52,
        }}
      >
        {/* Líneas decorativas sutiles de cancha sobre el fondo esmeralda */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-2 left-0 right-0 h-[1px] bg-white" />
          <div className="absolute bottom-2 left-2 right-2 top-2 border border-white/60 rounded-lg" />
        </div>

        <SmartImage
          src={player?.cutoutAvatar || player?.avatar}
          alt={player?.name || "Tenista"}
          isAvatar
          fallbackText={player?.name || "MP"}
          className="relative z-10 w-full h-full object-cover object-top transform transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Distintivo oficial activo en la esquina superior izquierda */}
      {badgeObj && (
        <div
          title={badgeObj.name}
          className="absolute -top-1.5 -left-1.5 z-20 w-5 h-5 rounded-full bg-[#1E0734] border border-[#00DC7D] p-0.5 shadow-md flex items-center justify-center"
        >
          <SmartImage
            src={badgeObj.asset}
            alt={badgeObj.shortLabel}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Botón circular superpuesto en el borde derecho (Estilo tabla WTA) */}
      {showActionArrow && (
        <div className="
          absolute -right-1.5 bottom-0.5 z-20 w-5 h-5 rounded-full
          bg-[#1E0734] text-[#00DC7D] border border-[#00DC7D]/70
          flex items-center justify-center shadow-md
          transition-transform duration-200 group-hover:scale-110
        ">
          <WtaIcon name="chevron-right" size={12} strokeWidth={2.6} />
        </div>
      )}
    </div>
  );
}

// Corona de Laureles para el Top 3 (#1 Oro, #2 Plata, #3 Bronce) y Racha Verificada
export function LaurelAvatar({
  player,
  rankPosition = 0,
  size = "md",
  onClick,
}) {
  const isTop3 = rankPosition >= 1 && rankPosition <= 3;
  const hasRealStreak = Number(player?.wins || 0) > 0 && Number(player?.streak || 0) > 0;

  const ringColors =
    rankPosition === 1
      ? "from-[#F59E0B] via-[#FDE68A] to-[#D97706] text-[#1E0734]"
      : rankPosition === 2
      ? "from-[#E2E8F0] via-[#F8FAFC] to-[#94A3B8] text-[#1E0734]"
      : "from-[#D97706] via-[#FBBF24] to-[#92400E] text-white";

  return (
    <div className="relative inline-flex items-center justify-center" onClick={onClick}>
      <WtaEmeraldPortrait
        player={player}
        size={size}
        showActionArrow={!isTop3}
      />

      {isTop3 && (
        <div
          className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.2 rounded-full bg-gradient-to-r ${ringColors} text-[9px] font-wta-display font-black tracking-tight shadow-md border border-white/50 flex items-center gap-0.5`}
        >
          <span>#{rankPosition}</span>
        </div>
      )}

      {/* Regla estricta: solo muestra llama si victorias > 0 y racha > 0 */}
      {hasRealStreak && (
        <div
          title={`Racha de ${player.streak} victorias seguidas`}
          className="absolute -top-1.5 -right-1.5 z-20 px-1.5 py-0.5 rounded-full bg-[#1E0734] border border-[#00DC7D] text-[#00DC7D] text-[9px] font-extrabold flex items-center gap-0.5 shadow-md"
        >
          <SmartImage
            src={ASSETS.fuegoRacha}
            alt="Racha"
            className="w-3 h-3 object-contain"
          />
          <span>{player.streak}</span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 5. ENVOLTORIO UNIVERSAL DE MODALES ENFRENTE DE PANTALLA (<WtaModalWrapper/>)
//    CON DESENFOQUE NATIVO DE iPHONE (BLUR 22PX) Y CABECERA SIMÉTRICA CENTRADA
// ----------------------------------------------------------------------------
export function WtaModalWrapper({
  isOpen,
  onClose,
  title,
  subtitle = "",
  badgeText = "",
  iconName = "trophy",
  maxWidthClass = "max-w-lg",
  lightMode = false,
  children,
  footerContent = null,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full ${maxWidthClass} max-h-[88dvh] flex flex-col rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)] border mp-modal-sheet ${
          lightMode
            ? "bg-[#FAF9F5] text-[#1E0734] border-[#1E0734]/15"
            : "bg-[#23083C] text-white border-[#00DC7D]/35"
        }`}
      >
        {/* Botón de cierre asintomático en la esquina superior derecha */}
        {onClose && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            aria-label="Cerrar ventana"
            className={`absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full flex items-center justify-center mp-close-btn ${
              lightMode
                ? "bg-[#1E0734]/10 text-[#1E0734] hover:bg-[#1E0734]/20"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
            }`}
          >
            <WtaIcon name="close" size={18} strokeWidth={2.4} />
          </button>
        )}

        {/* Cabecera Simétrica Centrada */}
        {title && (
          <div
            className={`px-5 pt-5 pb-4 text-center border-b relative overflow-hidden shrink-0 ${
              lightMode
                ? "bg-gradient-to-b from-[#00DC7D]/15 to-transparent border-[#1E0734]/10"
                : "bg-gradient-to-b from-[#00DC7D]/16 via-[#290C46] to-[#23083C] border-white/10"
            }`}
          >
            <div className="mx-auto mb-2 w-10 h-10 rounded-2xl bg-[#00DC7D]/20 border border-[#00DC7D]/50 text-[#00DC7D] flex items-center justify-center shadow-sm">
              <WtaIcon name={iconName} size={20} />
            </div>

            {badgeText && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-extrabold uppercase tracking-wider mb-1.5">
                <span>{badgeText}</span>
              </div>
            )}

            <h3 className="font-wta-condensed text-2xl sm:text-[26px] font-bold tracking-tight uppercase px-6">
              {title}
            </h3>

            {subtitle && (
              <p
                className={`mt-1 text-xs sm:text-[13px] max-w-md mx-auto leading-relaxed ${
                  lightMode ? "text-[#1E0734]/75" : "text-white/75"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Cuerpo Scrolleable del Modal */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {children}
        </div>

        {/* Pie Opcional del Modal */}
        {footerContent && (
          <div
            className={`px-4 py-3.5 border-t shrink-0 ${
              lightMode
                ? "bg-white border-[#1E0734]/10"
                : "bg-[#1E0734]/90 border-white/10"
            }`}
          >
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 6. FLUJO DE ARRANQUE INTELIGENTE EN 2 CAMINOS (<SmartOnboardingAndSplash/>)
//    - CAMINO 1 (1ª visita absoluta): Portada de bienvenida diseñada en Canva
//      + galería tipo telón con tarjetas Frosted Glass. Guarda estado permanente.
//    - CAMINO 2 (2ª, 3ª e infinitas aperturas): Pantalla rápida (< 0.85s) con el
//      logotipo oficial + aro esmeralda que se desliza como cortina hacia Retos.
// ----------------------------------------------------------------------------
export function SmartOnboardingAndSplash({
  hasCompletedOnboarding,
  onFinishOnboarding,
  onFinishQuickSplash,
  lightMode = false,
  sponsorName = "",
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isCurtainClosing, setIsCurtainClosing] = useState(false);

  const onboardingSlides = useMemo(
    () => [
      {
        id: "welcome-1",
        tag: "CIRCUITO OFICIAL HUANCAYO",
        title: "EL TENIS DEL VALLE EN UNA SOLA CANCHA DIGITAL",
        highlight: "4 Sedes Oficiales",
        description:
          "Desafía a tenistas de tu nivel en Country Club Los Huancas, Academia Romina Cutipa, Club Tauro y Los Inkas con marcador oficial.",
        bgImage: lightMode ? ASSETS.bienvenidaHeroClaro : ASSETS.bienvenidaHeroOscuro,
        statBadge: "Arcilla & Pista Central",
      },
      {
        id: "welcome-2",
        tag: "RANKING EN VIVO & MÉRITO REAL",
        title: "SUBE DE CATEGORÍA Y GANA GEMAS EN CANCHA",
        highlight: "Personaliza tu Perfil",
        description:
          "Suma puntos en cada reto, encadena rachas de victorias y canjea tus Gemas por escenarios Grand Slam, distintivos y descuentos en tienda.",
        bgImage: ASSETS.perfilBgArcilla,
        statBadge: "5ª P hasta 2ª Libre y +40 Master",
      },
      {
        id: "welcome-3",
        tag: "CARRERA DE TEMPORADA",
        title: "CLASIFICA AL TORNEO DE MAESTROS TOP 8",
        highlight: "Premios a los Top 3",
        description:
          "Los 8 mejores tenistas del año disputan la Gran Final por trofeos, equipamiento profesional y el título anual de Huancayo.",
        bgImage: ASSETS.torneoMasterTop8,
        statBadge: "Master Top 8 Finals",
      },
    ],
    [lightMode]
  );

  // Camino 2: Si ya entró antes, muestra el logo con aro esmeralda y abre cortina hacia Retos
  useEffect(() => {
    if (!hasCompletedOnboarding) return;
    const timerSlide = setTimeout(() => {
      setIsCurtainClosing(true);
    }, 620);
    const timerDone = setTimeout(() => {
      if (onFinishQuickSplash) onFinishQuickSplash();
    }, 1150);

    return () => {
      clearTimeout(timerSlide);
      clearTimeout(timerDone);
    };
  }, [hasCompletedOnboarding, onFinishQuickSplash]);

  const handleCompleteFirstTime = () => {
    triggerHaptic("hero");
    setIsCurtainClosing(true);
    setTimeout(() => {
      if (onFinishOnboarding) onFinishOnboarding();
    }, 520);
  };

  // RENDERIZADO DEL CAMINO 2: PANTALLA RÁPIDA CON LOGO + CORTINA DIRECTA A RETOS
  if (hasCompletedOnboarding) {
    return (
      <div
        className={`fixed inset-0 z-[80] flex flex-col items-center justify-between px-6 py-10 select-none overflow-hidden ${
          isCurtainClosing ? "curtain-slide-exit" : ""
        } ${lightMode ? "bg-[#FAF9F5] text-[#1E0734]" : "bg-[#1E0734] text-white"}`}
      >
        {/* Imagen de patrón de fondo suave */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <SmartImage
            src={lightMode ? ASSETS.splashFondoClaro : ASSETS.splashFondoOscuro}
            alt="Fondo de pista"
            eager
            className="w-full h-full object-cover"
          />
          <div
            className={`absolute inset-0 ${
              lightMode
                ? "bg-gradient-to-b from-[#FAF9F5]/90 via-[#FAF9F5]/75 to-[#FAF9F5]"
                : "bg-gradient-to-b from-[#1E0734]/90 via-[#1E0734]/75 to-[#1E0734]"
            }`}
          />
        </div>

        {/* Zona superior segura (Isla Dinámica iPhone) */}
        <div className="relative z-10 pt-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-wta-display font-extrabold uppercase tracking-widest bg-[#00DC7D]/15 text-[#00DC7D] border border-[#00DC7D]/35">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00DC7D] animate-ping" />
            Huancayo · Temporada 2026
          </span>
        </div>

        {/* Centro con Logotipo Oficial y Aro Giratorio Verde Esmeralda */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative flex items-center justify-center w-28 h-28 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-[#00DC7D]/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00DC7D] border-r-[#00DC7D] animate-spin" />
            <BrandLogo variant="isotipo" size="lg" />
          </div>

          <BrandLogo
            variant={lightMode ? "pill-light" : "night-cobrand"}
            sponsorName={sponsorName}
            size="lg"
          />
          <p
            className={`mt-2 text-xs font-medium tracking-wide ${
              lightMode ? "text-[#1E0734]/70" : "text-white/70"
            }`}
          >
            Abriendo cartelera de retos en vivo...
          </p>
        </div>

        {/* Pie inferior seguro */}
        <div className="relative z-10 pb-2 text-center">
          <div className="w-12 h-1 rounded-full bg-[#00DC7D]/50 mx-auto" />
        </div>
      </div>
    );
  }

  // RENDERIZADO DEL CAMINO 1: BIENVENIDA ÚNICA DE PRIMERA VEZ (DISEÑO CANVA 1170x2532)
  const activeSlide = onboardingSlides[slideIndex] || onboardingSlides[0];

  return (
    <div
      className={`fixed inset-0 z-[80] flex flex-col justify-between overflow-hidden select-none ${
        isCurtainClosing ? "curtain-slide-exit" : ""
      } bg-[#1E0734] text-white`}
    >
      {/* Fotografía vertical a pantalla completa con efecto Blur-to-Sharp al cambiar de lámina */}
      <div key={activeSlide.id} className="absolute inset-0 wta-blur-to-sharp">
        <SmartImage
          src={activeSlide.bgImage}
          alt={activeSlide.title}
          eager
          className="w-full h-full object-cover"
        />
        {/* Degradado protector en la parte superior e inferior para lectura nítida en iPhone */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(30,7,52,0.82) 0%, rgba(30,7,52,0.22) 38%, rgba(30,7,52,0.78) 72%, rgba(30,7,52,0.97) 100%)",
          }}
        />
      </div>

      {/* ZONA SEGURA SUPERIOR (Respeta los 220px de Isla Dinámica / Hora en iPhone) */}
      <div
        className="relative z-10 px-5 flex items-center justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 16px) + 14px)" }}
      >
        <BrandLogo variant="night-cobrand" sponsorName={sponsorName} size="md" />
        <button
          type="button"
          onClick={handleCompleteFirstTime}
          className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold tracking-wide border border-white/20 mp-btn-tactile"
        >
          Saltar intro
        </button>
      </div>

      {/* ZONA CENTRAL Y TARJETA DE CRISTAL ESMERILADO (FROSTED GLASS CARD) */}
      <div className="relative z-10 px-5 my-auto flex flex-col justify-end pt-16">
        <div className="rounded-3xl p-5 bg-white/90 text-[#1E0734] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-white">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-extrabold uppercase tracking-wider">
              {activeSlide.tag}
            </span>
            <span className="text-[11px] font-extrabold text-[#C85A32]">
              {activeSlide.statBadge}
            </span>
          </div>

          <h1 className="font-wta-condensed text-3xl sm:text-4xl font-bold uppercase text-[#1E0734] tracking-tight leading-none mb-2">
            {activeSlide.title}
          </h1>

          <p className="text-xs sm:text-sm text-[#1E0734]/85 leading-relaxed mb-3">
            <strong className="text-[#00A859] font-extrabold">
              {activeSlide.highlight}:{" "}
            </strong>
            {activeSlide.description}
          </p>

          {/* Indicadores de lámina estilo WTA (píldora verde alargada en la activa) */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1E0734]/10">
            <div className="flex items-center gap-1.5">
              {onboardingSlides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setSlideIndex(idx);
                  }}
                  aria-label={`Diapositiva ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === slideIndex
                      ? "w-7 bg-[#00A859]"
                      : "w-2 bg-[#1E0734]/25 hover:bg-[#1E0734]/45"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-[#1E0734]/60">
              {slideIndex + 1} / {onboardingSlides.length}
            </span>
          </div>
        </div>
      </div>

      {/* ZONA SEGURA INFERIOR (340px inferiores con Botón Táctil Principal) */}
      <div
        className="relative z-10 px-5 pt-3 flex flex-col gap-2.5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 18px)" }}
      >
        <div className="flex items-center gap-2.5">
          {slideIndex < onboardingSlides.length - 1 ? (
            <>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setSlideIndex((prev) => prev + 1);
                }}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-white/15 border border-white/25 text-white font-wta-display font-bold text-sm flex items-center justify-center gap-2 mp-btn-tactile"
              >
                <span>Siguiente</span>
                <WtaIcon name="arrow-right" size={16} />
              </button>
              <button
                type="button"
                onClick={handleCompleteFirstTime}
                className="flex-1 py-3.5 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <span>Entrar ahora</span>
                <WtaIcon name="bolt" size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCompleteFirstTime}
              className="w-full py-4 px-6 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-base flex items-center justify-center gap-2 shadow-xl"
            >
              <span>Entrar al Circuito Oficial</span>
              <WtaIcon name="arrow-right" size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 7. MODAL DE CELEBRACIÓN Y PREMIACIÓN (<CelebrationRewardModal/>)
//    Muestra GIFs oficiales de celebración, variación de puntos y gemas ganadas
// ----------------------------------------------------------------------------
export function CelebrationRewardModal({
  celebrationData,
  onClose,
  onOpenStoryShare,
}) {
  if (!celebrationData) return null;

  const {
    title = "¡Victoria Oficial Registrada!",
    subtitle = "Tu puntaje y posición en el ranking se han actualizado.",
    eloDelta = 0,
    newElo = 1500,
    gemsEarned = 0,
    reasonLabel = "Victoria en Cancha",
    isMajorAchievement = false,
    matchSummary = null,
  } = celebrationData;

  return (
    <WtaModalWrapper
      isOpen={Boolean(celebrationData)}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badgeText={reasonLabel}
      iconName="trophy"
      maxWidthClass="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-[#00DC7D] shadow-[0_0_30px_rgba(0,220,125,0.35)] bg-[#1E0734]">
          <SmartImage
            src={isMajorAchievement ? ASSETS.gifCelebracion2 : ASSETS.gifCelebracion1}
            alt="Celebración"
            eager
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="p-3.5 rounded-2xl bg-white/8 border border-[#00DC7D]/40 flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
              Puntos Ranking
            </span>
            <span className="font-wta-condensed text-3xl font-bold text-[#00DC7D] mt-0.5">
              {eloDelta >= 0 ? `+${eloDelta}` : eloDelta} PTS
            </span>
            <span className="text-[11px] text-white/60 mt-0.5">
              Total actual: <strong className="text-white">{newElo}</strong>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/8 border border-[#F59E0B]/45 flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
              Gemas de Mérito
            </span>
            <span className="font-wta-condensed text-3xl font-bold text-[#F59E0B] mt-0.5 flex items-center gap-1">
              +{gemsEarned} <WtaIcon name="gem" size={20} className="text-[#00DC7D]" />
            </span>
            <span className="text-[11px] text-white/60 mt-0.5">
              {gemsEarned > 0 ? "Sumadas a tu cuenta" : "Sigue en racha"}
            </span>
          </div>
        </div>

        {matchSummary && (
          <div className="w-full p-3.5 rounded-2xl bg-[#1E0734] border border-white/10 text-left">
            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
              <span>{matchSummary.club || "Sede Oficial"}</span>
              <span className="text-[#00DC7D] font-bold">{matchSummary.scoreText}</span>
            </div>
            <div className="text-sm font-bold text-white">
              {matchSummary.winnerName} venció a {matchSummary.loserName}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 w-full pt-1">
          {onOpenStoryShare && matchSummary && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("hero");
                onOpenStoryShare(matchSummary);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/12 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 mp-btn-tactile"
            >
              <WtaIcon name="share" size={15} />
              <span>Crear Story 9:16</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-2xl mp-btn-emerald font-extrabold text-xs flex items-center justify-center gap-1.5"
          >
            <span>Continuar</span>
            <WtaIcon name="check" size={15} />
          </button>
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// === FIN DEL BLOQUE 2 DE 14 ===

// ============================================================================
// PARTE 3 DE 14: MOTOR MATEMÁTICO ELO (3 JAULAS FINITAS + CHECKPOINTS),
// VALIDADOR OFICIAL ITF/ATP, ECONOMÍA EQUILIBRADA DE GEMAS Y BASE DE DATOS
// MAESTRA COMPLETA DEL CIRCUITO DE HUANCAYO
// ============================================================================

// ----------------------------------------------------------------------------
// 1. ESCALERA OFICIAL DE CATEGORÍAS (DESDE 5ª P HASTA 2ª LIBRE) Y CHECKPOINTS
// ----------------------------------------------------------------------------
export const CATEGORY_LADDER = [
  {
    id: "5P",
    name: "5ª P",
    fullName: "5ª Principiante",
    minElo: 100,
    maxElo: 499,
    seedElo: 150,
    floorElo: 100,
    checkpointElo: null,
    badgeColor: "#94A3B8",
    pillBg: "rgba(148, 163, 184, 0.18)",
    description: "Iniciación competitiva y primeros partidos reglamentarios en cancha.",
  },
  {
    id: "5B",
    name: "5ª B",
    fullName: "5ª Básica",
    minElo: 500,
    maxElo: 1199,
    seedElo: 550,
    floorElo: 500,
    checkpointElo: null,
    badgeColor: "#38BDF8",
    pillBg: "rgba(56, 189, 248, 0.18)",
    description: "Peloteo constante de fondo, servicio regular y nociones tácticas.",
  },
  {
    id: "5A",
    name: "5ª A",
    fullName: "5ª Avanzada",
    minElo: 1200,
    maxElo: 1999,
    seedElo: 1250,
    floorElo: 1200,
    checkpointElo: null,
    badgeColor: "#00DC7D",
    pillBg: "rgba(0, 220, 125, 0.18)",
    description: "Control direccional, primeros saques con efecto y cierres en la red.",
  },
  {
    id: "4TA",
    name: "4ª Categoría",
    fullName: "4ª Categoría Oficial",
    minElo: 2000,
    maxElo: 3499,
    seedElo: 2050,
    floorElo: 2000,
    checkpointElo: 2750, // Checkpoint intermedio merecido
    badgeColor: "#C85A32",
    pillBg: "rgba(200, 90, 50, 0.22)",
    description: "Tenistas de club con consistencia alta, potencia y lectura de partido.",
  },
  {
    id: "3RA",
    name: "3ª Categoría",
    fullName: "3ª Categoría Oficial",
    minElo: 3500,
    maxElo: 4999,
    seedElo: 3350, // Tope máximo por test inicial para exigir ascenso en cancha
    floorElo: 3500,
    checkpointElo: 4250, // Checkpoint intermedio merecido
    badgeColor: "#F59E0B",
    pillBg: "rgba(245, 158, 11, 0.22)",
    description: "Competidores avanzados de torneos regionales con dominio técnico completo.",
  },
  {
    id: "2DA",
    name: "2ª / Libre",
    fullName: "2ª Categoría & Primera Libre",
    minElo: 5000,
    maxElo: 9999,
    seedElo: 5000,
    floorElo: 5000,
    checkpointElo: 5500,
    badgeColor: "#00DC7D",
    pillBg: "rgba(0, 220, 125, 0.28)",
    description: "Máxima división del Valle del Mantaro y referentes del circuito.",
  },
];

export const SEASON_CHECKPOINTS = [100, 500, 1200, 2000, 2750, 3500, 4250, 5000];

export function getCategoryByElo(elo = 1200) {
  const numericElo = Math.max(100, Number(elo) || 100);
  for (let i = CATEGORY_LADDER.length - 1; i >= 0; i--) {
    if (numericElo >= CATEGORY_LADDER[i].minElo) {
      return CATEGORY_LADDER[i];
    }
  }
  return CATEGORY_LADDER[0];
}

// Calcula el porcentaje exacto para la barra termómetro monocromática con pelota 3D
export function getCategoryProgress(elo = 1200) {
  const numericElo = Math.max(100, Number(elo) || 100);
  const currentCat = getCategoryByElo(numericElo);
  const currentIndex = CATEGORY_LADDER.findIndex((c) => c.id === currentCat.id);
  const nextCat =
    currentIndex < CATEGORY_LADDER.length - 1
      ? CATEGORY_LADDER[currentIndex + 1]
      : null;

  if (!nextCat) {
    return {
      currentCat,
      nextCat: null,
      progressPercent: 100,
      pointsToNext: 0,
      nextThreshold: currentCat.minElo,
      activeFloor: 5000,
    };
  }

  const span = nextCat.minElo - currentCat.minElo;
  const gained = numericElo - currentCat.minElo;
  const progressPercent = Math.min(100, Math.max(3, Math.round((gained / span) * 100)));
  const pointsToNext = Math.max(0, nextCat.minElo - numericElo);

  let activeFloor = currentCat.floorElo;
  if (currentCat.checkpointElo && numericElo >= currentCat.checkpointElo) {
    activeFloor = currentCat.checkpointElo;
  }

  return {
    currentCat,
    nextCat,
    progressPercent,
    pointsToNext,
    nextThreshold: nextCat.minElo,
    activeFloor,
  };
}

// ----------------------------------------------------------------------------
// 2. VALIDADOR OFICIAL ITF / ATP DE MARCADORES (SETS, TIE-BREAK Y SUPER TB)
// ----------------------------------------------------------------------------
export function validateOfficialTennisScore(sets = [], thirdSetSuperTb = true) {
  if (!Array.isArray(sets) || sets.length < 2) {
    return {
      valid: false,
      reason: "Debes ingresar al menos los 2 primeros sets del partido.",
    };
  }

  let setsWonA = 0;
  let setsWonB = 0;
  const normalizedSets = [];

  for (let i = 0; i < sets.length; i++) {
    const s = sets[i];
    const a = Number(s?.a ?? 0);
    const b = Number(s?.b ?? 0);
    const tbA = s?.tbA !== undefined && s?.tbA !== "" ? Number(s.tbA) : null;
    const tbB = s?.tbB !== undefined && s?.tbB !== "" ? Number(s.tbB) : null;

    if (i === 2 && setsWonA === 1 && setsWonB === 1 && thirdSetSuperTb) {
      // 3.er Set como Super Tie-Break a 10 puntos con diferencia mínima de 2
      const maxPts = Math.max(a, b);
      const minPts = Math.min(a, b);
      const diff = maxPts - minPts;
      if (maxPts < 10 || diff < 2) {
        return {
          valid: false,
          reason:
            "El Super Tie-Break del 3.er set se gana llegando al menos a 10 puntos con ventaja mínima de 2 (ej. 10-8 o 12-10).",
        };
      }
      if (a > b) setsWonA++;
      else setsWonB++;
      normalizedSets.push({ a, b, isSuperTb: true });
      continue;
    }

    // Validación de Set Normal (6-0 a 6-4, 7-5 o 7-6 con Tie-Break)
    const maxG = Math.max(a, b);
    const minG = Math.min(a, b);
    const diffG = maxG - minG;

    if (maxG < 6 || maxG > 7) {
      return {
        valid: false,
        reason: `El Set ${i + 1} (${a}-${b}) no es válido. Un set termina en 6 o 7 games.`,
      };
    }
    if (maxG === 6 && diffG < 2) {
      return {
        valid: false,
        reason: `En el Set ${i + 1} (${a}-${b}), con 6-5 aún no termina el set; debe llegar a 7-5 o 7-6.`,
      };
    }
    if (maxG === 7 && minG < 5) {
      return {
        valid: false,
        reason: `El Set ${i + 1} (${a}-${b}) no es posible: solo se llega a 7 games en un 7-5 o 7-6.`,
      };
    }

    if (maxG === 7 && minG === 6 && tbA !== null && tbB !== null) {
      const maxTb = Math.max(tbA, tbB);
      const minTb = Math.min(tbA, tbB);
      if (maxTb < 7 || maxTb - minTb < 2) {
        return {
          valid: false,
          reason: `El Tie-Break del Set ${i + 1} debe llegar al menos a 7 puntos con diferencia mínima de 2.`,
        };
      }
    }

    if (a > b) setsWonA++;
    else setsWonB++;
    normalizedSets.push({ a, b, tbA, tbB, isSuperTb: false });

    if ((setsWonA === 2 || setsWonB === 2) && i === 1) {
      break;
    }
  }

  if (setsWonA < 2 && setsWonB < 2) {
    return {
      valid: false,
      reason: "El partido se define al mejor de 3 sets (un tenista debe ganar 2 sets).",
    };
  }

  const winnerSide = setsWonA > setsWonB ? "A" : "B";
  const scoreText = normalizedSets
    .map((s) =>
      s.isSuperTb
        ? `[${s.a}-${s.b}]`
        : s.tbA !== null && s.tbB !== null
        ? `${s.a}-${s.b}(${Math.min(s.tbA, s.tbB)})`
        : `${s.a}-${s.b}`
    )
    .join(", ");

  return {
    valid: true,
    winnerSide,
    setsWonA,
    setsWonB,
    normalizedSets,
    scoreText,
  };
}

// ----------------------------------------------------------------------------
// 3. MOTOR MATEMÁTICO ELO DE LAS 3 JAULAS FINITAS + EQUILIBRIO +40 MASTER
//    + ECONOMÍA PROGRESIVA DE GEMAS (CERO PÉRDIDA DE DINERO)
// ----------------------------------------------------------------------------
export function calculateMatchEloAndGems({
  playerA,
  playerB,
  sets = [],
  isTournament = false,
  isFriendly = false,
}) {
  const validation = validateOfficialTennisScore(sets, true);
  if (!validation.valid) {
    return { valid: false, reason: validation.reason };
  }

  const eloA = Number(playerA?.elo || 1200);
  const eloB = Number(playerB?.elo || 1200);
  const gap = Math.abs(eloA - eloB);

  // Brecha dual: si supera 1,000 pts de diferencia o se pactó amistoso, no altera puntos
  const effectiveFriendly = isFriendly || (!isTournament && gap > 1000);
  const winnerIsA = validation.winnerSide === "A";
  const winner = winnerIsA ? playerA : playerB;
  const loser = winnerIsA ? playerB : playerA;
  const winnerElo = winnerIsA ? eloA : eloB;
  const loserElo = winnerIsA ? eloB : eloA;

  if (effectiveFriendly) {
    return {
      valid: true,
      isFriendlyResult: true,
      winnerSide: validation.winnerSide,
      scoreText: validation.scoreText,
      deltaWinner: 0,
      deltaLoser: 0,
      newEloA: eloA,
      newEloB: eloB,
      gemsA: playerA?.isVip ? 2 : 0,
      gemsB: playerB?.isVip ? 2 : 0,
      gemReasonA: "Partido amistoso completado",
      gemReasonB: "Partido amistoso completado",
    };
  }

  // Probabilidad esperada E del ganador y techos de la Jaula Finita (Base 150)
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 600));
  const rawMaxGain = Math.round(150 * (1 - expectedWinner));
  const rawMaxLoss = Math.round(150 * expectedWinner);

  // Factor de contundencia según sets y games (premia ganar claro y protege al que lucha en 3 sets)
  let totalGamesWinner = 0;
  let totalGamesLoser = 0;
  validation.normalizedSets.forEach((s) => {
    if (s.isSuperTb) {
      totalGamesWinner += winnerIsA ? (s.a > s.b ? 1 : 0) : s.b > s.a ? 1 : 0;
    } else {
      totalGamesWinner += winnerIsA ? s.a : s.b;
      totalGamesLoser += winnerIsA ? s.b : s.a;
    }
  });

  const wentThreeSets = validation.normalizedSets.length === 3;
  const gameShare =
    totalGamesWinner + totalGamesLoser > 0
      ? totalGamesWinner / (totalGamesWinner + totalGamesLoser)
      : 0.6;

  // Modulador de ganancia (entre 72% y 96% del techo) y de pérdida (protección si luchó 3 sets)
  const gainFactor = wentThreeSets ? 0.76 : Math.min(0.95, 0.72 + (gameShare - 0.5) * 0.55);
  const lossFactor = wentThreeSets ? 0.42 : Math.min(0.9, 0.65 + (gameShare - 0.5) * 0.5);

  // Multiplicador en partidos de prueba (primeros 5 partidos del jugador)
  const winnerInTrial = Number(winner?.matchesPlayed || 0) < 5;
  const loserInTrial = Number(loser?.matchesPlayed || 0) < 5;

  let deltaWinner = Math.max(12, Math.round(rawMaxGain * gainFactor * (winnerInTrial ? 1.35 : 1)));
  let deltaLoser = Math.max(8, Math.round(rawMaxLoss * lossFactor * (loserInTrial ? 1.25 : 1)));

  // Regla anti-rebasamiento en un solo partido cuando la distancia previa era > 120 pts
  if (winnerElo < loserElo && loserElo - winnerElo > 120) {
    const maxAllowedGain = Math.floor((loserElo - winnerElo) * 0.48);
    deltaWinner = Math.min(deltaWinner, Math.max(18, maxAllowedGain));
  }

  // Equilibrio generacional +40 Master: amortigua un 20% la caída ante rivales menores de 30 años
  if (Number(loser?.age || 30) >= 40 && Number(winner?.age || 30) < 32) {
    deltaLoser = Math.max(6, Math.round(deltaLoser * 0.8));
  }

  // Protección de piso de categoría y Checkpoint alcanzado
  const loserProgress = getCategoryProgress(loserElo);
  const protectedLoserElo = Math.max(loserProgress.activeFloor, loserElo - deltaLoser);
  const finalDeltaLoser = loserElo - protectedLoserElo;
  const finalWinnerElo = winnerElo + deltaWinner;

  // ==========================================================================
  // CÁLCULO DE GEMAS (ESTILO SPOTIFY / CLASH ROYALE — CERO PÉRDIDA FINANCIERA)
  // - Sólo se ganan por mérito real (Racha >= 3, Matagigantes, Desafío al Líder
  //   o Torneo Pagado). El Socio VIP tiene acelerador x2.5.
  // ==========================================================================
  const newWinnerStreak = Number(winner?.streak || 0) + 1;
  const isGiantSlayer = loserElo - winnerElo >= 180;
  const isBossChallenge = Number(loser?.rank || 99) <= 3 && Number(winner?.rank || 99) > 3;

  let baseWinnerGems = 0;
  const gemReasons = [];

  if (isTournament) {
    baseWinnerGems += 25;
    gemReasons.push("Victoria en Torneo Oficial");
  }
  if (newWinnerStreak >= 3) {
    baseWinnerGems += 6;
    gemReasons.push(`Racha de ${newWinnerStreak} victorias`);
  }
  if (isGiantSlayer) {
    baseWinnerGems += 10;
    gemReasons.push("Triunfo ante rival de mayor puntaje");
  }
  if (isBossChallenge) {
    baseWinnerGems += 14;
    gemReasons.push("Desafío al Top 3 superado");
  }

  const winnerVipMultiplier = winner?.isVip ? 2.5 : 1;
  const finalWinnerGems = Math.round(baseWinnerGems * winnerVipMultiplier) + (winner?.isVip ? 3 : 0);
  const finalLoserGems = loser?.isVip ? 2 : 0; // El perdedor gratis recibe 0 gemas (cero descapitalización)

  return {
    valid: true,
    isFriendlyResult: false,
    winnerSide: validation.winnerSide,
    scoreText: validation.scoreText,
    deltaWinner,
    deltaLoser: -finalDeltaLoser,
    newEloA: winnerIsA ? finalWinnerElo : protectedLoserElo,
    newEloB: winnerIsA ? protectedLoserElo : finalWinnerElo,
    gemsA: winnerIsA ? finalWinnerGems : finalLoserGems,
    gemsB: winnerIsA ? finalLoserGems : finalWinnerGems,
    gemReasonA: winnerIsA
      ? gemReasons.join(" · ") || (playerA?.isVip ? "Bonificación Socio VIP" : "Puntos sumados al ranking")
      : playerA?.isVip
      ? "Bonificación de constancia VIP"
      : "Sigue sumando para entrar en racha",
    gemReasonB: !winnerIsA
      ? gemReasons.join(" · ") || (playerB?.isVip ? "Bonificación Socio VIP" : "Puntos sumados al ranking")
      : playerB?.isVip
      ? "Bonificación de constancia VIP"
      : "Sigue sumando para entrar en racha",
    isMajorAchievement: isGiantSlayer || isBossChallenge || newWinnerStreak >= 3,
  };
}

// ----------------------------------------------------------------------------
// 4. LAS 5 PREGUNTAS DIDÁCTICAS DEL TEST INICIAL (CON DETECTOR DE INCONGRUENCIAS)
// ----------------------------------------------------------------------------
export const INITIAL_CALIBRATION_QUESTIONS = [
  {
    id: "q1_tiempo",
    stepNumber: 1,
    title: "¿Cuánto tiempo llevas jugando al tenis?",
    subtitle: "Esto nos ayuda a ubicarte con rivales que tengan una experiencia parecida.",
    options: [
      {
        id: "t1",
        label: "Estoy empezando (menos de 6 meses)",
        detail: "Aprendiendo a empuñar la raqueta y pasar la pelota.",
        points: 180,
        tierTag: "5ª P",
        accentColor: "#94A3B8",
      },
      {
        id: "t2",
        label: "Entre 6 meses y 2 años",
        detail: "Ya peloteo desde el fondo y conozco las reglas.",
        points: 680,
        tierTag: "5ª B",
        accentColor: "#38BDF8",
      },
      {
        id: "t3",
        label: "Entre 2 y 5 años constantes",
        detail: "Juego partidos completos todas las semanas.",
        points: 1450,
        tierTag: "5ª A",
        accentColor: "#00DC7D",
      },
      {
        id: "t4",
        label: "Más de 5 años jugando en clubes",
        detail: "Tengo golpes formados y experiencia competitiva.",
        points: 2350,
        tierTag: "4ª Categoría",
        accentColor: "#C85A32",
      },
    ],
  },
  {
    id: "q2_frecuencia",
    stepNumber: 2,
    title: "¿Cuántas veces por semana entras a cancha?",
    subtitle: "El ritmo actual influye mucho en la regularidad de tus golpes.",
    options: [
      {
        id: "f1",
        label: "1 vez al mes o de forma ocasional",
        detail: "Juego por recreación cuando hay tiempo libre.",
        points: 150,
        tierTag: "Ritmo Suave",
        accentColor: "#94A3B8",
      },
      {
        id: "f2",
        label: "1 vez por semana fijo",
        detail: "Partidos de fin de semana con amigos.",
        points: 620,
        tierTag: "Ritmo Regular",
        accentColor: "#38BDF8",
      },
      {
        id: "f3",
        label: "2 a 3 veces por semana",
        detail: "Combino entrenamientos y partidos de práctica.",
        points: 1500,
        tierTag: "Ritmo Activo",
        accentColor: "#00DC7D",
      },
      {
        id: "f4",
        label: "4 o más veces por semana",
        detail: "Preparación física y técnica intensiva.",
        points: 2600,
        tierTag: "Ritmo Intenso",
        accentColor: "#F59E0B",
      },
    ],
  },
  {
    id: "q3_torneos",
    stepNumber: 3,
    title: "¿Has participado en torneos oficiales o de clubes?",
    subtitle: "Jugar con público y presión de marcador marca la diferencia.",
    options: [
      {
        id: "tr1",
        label: "Todavía no he jugado ningún torneo",
        detail: "Este será mi primer circuito con ranking.",
        points: 160,
        tierTag: "Debutante",
        accentColor: "#94A3B8",
      },
      {
        id: "tr2",
        label: "He jugado de 1 a 3 torneos locales",
        detail: "En categorías de iniciación o quinta.",
        points: 780,
        tierTag: "Competidor Inicial",
        accentColor: "#38BDF8",
      },
      {
        id: "tr3",
        label: "Juego torneos cada temporada",
        detail: "Compito regularmente en 5ª Avanzada o 4ª.",
        points: 1950,
        tierTag: "Habitual de Cuadros",
        accentColor: "#00DC7D",
      },
      {
        id: "tr4",
        label: "Compito en 4ª alta, 3ª o categorías superiores",
        detail: "Amplia trayectoria en campeonatos regionales.",
        points: 3150,
        tierTag: "Torneos Avanzados",
        accentColor: "#C85A32",
      },
    ],
  },
  {
    id: "q4_logros",
    stepNumber: 4,
    title: "¿Cuál ha sido tu mejor resultado en campeonatos?",
    subtitle: "Sé sincero: tus primeros 5 partidos ajustarán tu puntaje real en cancha.",
    options: [
      {
        id: "lg1",
        label: "Sin torneos previos o primeras rondas",
        detail: "Busco ganar mis primeros partidos oficiales.",
        points: 180,
        tierTag: "En Crecimiento",
        accentColor: "#94A3B8",
      },
      {
        id: "lg2",
        label: "He superado fase de grupos o cuartos de final",
        detail: "En categorías 5ª B o 5ª A.",
        points: 1150,
        tierTag: "Cuartofinalista",
        accentColor: "#38BDF8",
      },
      {
        id: "lg3",
        label: "Finalista o campeón en categoría 5ª / 4ª",
        detail: "Cuento con podios verificables en clubes.",
        points: 2350,
        tierTag: "Podio de Club",
        accentColor: "#00DC7D",
      },
      {
        id: "lg4",
        label: "Campeón o finalista en 3ª categoría o superior",
        detail: "Nivel alto contrastado en el Valle del Mantaro.",
        points: 3350,
        tierTag: "Campeón Regional",
        accentColor: "#F59E0B",
      },
    ],
  },
  {
    id: "q5_juego",
    stepNumber: 5,
    title: "¿Cómo describirías tu saque y peloteo hoy?",
    subtitle: "Último paso para asignarte tu categoría inicial.",
    options: [
      {
        id: "jg1",
        label: "Saque suave para poner la pelota en juego",
        detail: "En peloteos largos todavía cometo errores frecuentes.",
        points: 200,
        tierTag: "5ª P",
        accentColor: "#94A3B8",
      },
      {
        id: "jg2",
        label: "Sostengo 8 a 10 bolas seguidas desde el fondo",
        detail: "Mi primer saque entra con regularidad.",
        points: 850,
        tierTag: "5ª B",
        accentColor: "#38BDF8",
      },
      {
        id: "jg3",
        label: "Domino efectos (topspin y slice) y subo a la red",
        detail: "Puedo variar direcciones y cerrar el punto.",
        points: 1850,
        tierTag: "5ª A / 4ª",
        accentColor: "#00DC7D",
      },
      {
        id: "jg4",
        label: "Saque potente con efecto y segundo saque seguro",
        detail: "Armo el punto con velocidad y precisión táctica.",
        points: 3100,
        tierTag: "4ª Alta / 3ª",
        accentColor: "#C85A32",
      },
    ],
  },
];

// Evalúa las 5 respuestas con detector cruzado de incongruencias
export function evaluateInitialCalibration(answersMap = {}) {
  const values = Object.values(answersMap);
  if (values.length === 0) {
    return {
      assignedElo: 1200,
      category: getCategoryByElo(1200),
      hadIncongruenceAdjustment: false,
      explanation: "Nivel base intermedio asignado.",
    };
  }

  const q1 = answersMap.q1_tiempo?.points ?? 600;
  const q2 = answersMap.q2_frecuencia?.points ?? 600;
  const q3 = answersMap.q3_torneos?.points ?? 600;
  const q4 = answersMap.q4_logros?.points ?? 600;
  const q5 = answersMap.q5_juego?.points ?? 600;

  let avg = Math.round(q1 * 0.2 + q2 * 0.15 + q3 * 0.22 + q4 * 0.23 + q5 * 0.2);
  let hadIncongruenceAdjustment = false;

  // Detector cruzado: si declara nunca haber jugado torneos (q3 <= 200) o llevar menos de 6 meses (q1 <= 200)
  // pero marca ser campeón de 3ª categoría (q4 >= 3000), se corrige automáticamente.
  if ((q1 <= 200 || q3 <= 200) && (q4 >= 2300 || q5 >= 3000)) {
    avg = Math.min(avg, 950);
    hadIncongruenceAdjustment = true;
  }

  // Tope máximo por encuesta inicial: 3,350 pts (obliga a ganar en cancha para entrar a 3ª Categoría 3,500+)
  const clampedElo = Math.min(3350, Math.max(150, avg));
  const category = getCategoryByElo(clampedElo);

  return {
    assignedElo: clampedElo,
    category,
    hadIncongruenceAdjustment,
    explanation: hadIncongruenceAdjustment
      ? "Ajustamos tu punto de partida de forma preventiva para que tus primeros 5 partidos de prueba midan tu nivel en cancha."
      : `Comienzas en ${category.fullName} con ${clampedElo} puntos. Tus primeros 5 partidos terminarán de afinar tu puesto.`,
  };
}

// ----------------------------------------------------------------------------
// 5. LOS 10 TENISTAS REALES DE HUANCAYO (CON SILUETAS, TEMAS GRAND SLAM,
//    DISTINTIVOS, GEMAS, EDADES +40 MASTER Y PRIVACIDAD DE WHATSAPP)
// ----------------------------------------------------------------------------
export const INITIAL_PLAYERS = [
  {
    id: "p-mateo",
    name: "Mateo Villavicencio",
    firstName: "Mateo",
    lastName: "Villavicencio",
    elo: 4320,
    bestRank: 1,
    rank: 1,
    age: 29,
    height: "1.81 m",
    city: "Huancayo",
    club: "Country Club Los Huancas",
    clubLogo: ASSETS.clubCountry,
    individualMode: false,
    hand: "Diestro",
    backhand: "Revés a dos manos",
    bestShot: "Derecha invertida con topspin",
    availability: "Lun a Vie · 18:00 a 21:30 / Sáb · Mañanas",
    wins: 24,
    losses: 3,
    streak: 5,
    titles: 3,
    matchesPlayed: 27,
    gems: 420,
    isVip: true,
    vipCode: "MP-2026-0001",
    whatsapp: "51987654321",
    whatsappPrivacy: "rivals_only",
    email: "mateo@matchpoint.pe",
    surfaceThemeId: "finals",
    unlockedThemes: ["finals", "arcilla", "cesped", "dura"],
    activeBadgeId: "badge-maestro-top8",
    unlockedBadges: ["badge-maestro-top8", "badge-rey-arcilla", "badge-invicto"],
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
  {
    id: "p-alejandro",
    name: "Alejandro Santiváñez",
    firstName: "Alejandro",
    lastName: "Santiváñez",
    elo: 3790,
    bestRank: 2,
    rank: 2,
    age: 43, // Referente +40 Master
    height: "1.78 m",
    city: "El Tambo · Huancayo",
    club: "Academia Romina Cutipa",
    clubLogo: ASSETS.clubRomina,
    individualMode: false,
    hand: "Zurdo",
    backhand: "Revés a una mano",
    bestShot: "Saque abierto con slice",
    availability: "Mar, Jue y Sáb · 07:00 a 10:00",
    wins: 19,
    losses: 5,
    streak: 3,
    titles: 2,
    matchesPlayed: 24,
    gems: 310,
    isVip: true,
    vipCode: "MP-2026-0002",
    whatsapp: "51987111222",
    whatsappPrivacy: "public",
    email: "alejandro@matchpoint.pe",
    surfaceThemeId: "arcilla",
    unlockedThemes: ["finals", "arcilla"],
    activeBadgeId: "badge-veterano-oro",
    unlockedBadges: ["badge-veterano-oro", "badge-rey-arcilla"],
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
  {
    id: "p-pablo",
    name: "Pablo Samaniego",
    firstName: "Pablo",
    lastName: "Samaniego",
    elo: 3080,
    bestRank: 3,
    rank: 3,
    age: 26,
    height: "1.79 m",
    city: "Huancayo",
    club: "Country Club Los Huancas",
    clubLogo: ASSETS.clubCountry,
    individualMode: false,
    hand: "Diestro",
    backhand: "Revés a dos manos",
    bestShot: "Derecha paralela profunda",
    availability: "Lun a Sáb · 17:00 a 21:00",
    wins: 15,
    losses: 4,
    streak: 4,
    titles: 1,
    matchesPlayed: 19,
    gems: 245,
    isVip: true,
    vipCode: "MP-2026-0003",
    whatsapp: "51999888777",
    whatsappPrivacy: "rivals_only",
    email: "pablo@matchpoint.pe",
    surfaceThemeId: "finals",
    unlockedThemes: ["finals", "arcilla", "cesped", "dura"],
    activeBadgeId: "badge-rey-arcilla",
    unlockedBadges: ["badge-rey-arcilla", "badge-invicto", "badge-mata-gigantes"],
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
  {
    id: "p-jose",
    name: "José Carlos Bastidas",
    firstName: "José Carlos",
    lastName: "Bastidas",
    elo: 2840,
    bestRank: 3,
    rank: 4,
    age: 45, // +40 Master
    height: "1.76 m",
    city: "Huancayo",
    club: "Club Tauro Tenis",
    clubLogo: ASSETS.clubTauro,
    individualMode: false,
    hand: "Diestro",
    backhand: "Revés con slice",
    bestShot: "Dejada corta y globo defensivo",
    availability: "Vie y Sáb · Tardes / Dom · Mañanas",
    wins: 14,
    losses: 6,
    streak: 2,
    titles: 1,
    matchesPlayed: 20,
    gems: 165,
    isVip: false,
    vipCode: "MP-2026-0004",
    whatsapp: "51988222333",
    whatsappPrivacy: "public",
    email: "jose@matchpoint.pe",
    surfaceThemeId: "arcilla",
    unlockedThemes: ["finals", "arcilla"],
    activeBadgeId: "badge-veterano-oro",
    unlockedBadges: ["badge-veterano-oro"],
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
  {
    id: "p-kenji",
    name: "Kenji Takahashi",
    firstName: "Kenji",
    lastName: "Takahashi",
    elo: 2490,
    bestRank: 4,
    rank: 5,
    age: 27,
    height: "1.75 m",
    city: "El Tambo · Huancayo",
    club: "Academia Romina Cutipa",
    clubLogo: ASSETS.clubRomina,
    individualMode: false,
    hand: "Diestro",
    backhand: "Revés a dos manos plano",
    bestShot: "Contraataque sobre la carrera",
    availability: "Lun, Mié y Vie · 19:00 a 22:00",
    wins: 12,
    losses: 6,
    streak: 1,
    titles: 0,
    matchesPlayed: 18,
    gems: 110,
    isVip: true,
    vipCode: "MP-2026-0005",
    whatsapp: "51977333444",
    whatsappPrivacy: "rivals_only",
    email: "kenji@matchpoint.pe",
    surfaceThemeId: "dura",
    unlockedThemes: ["finals", "dura"],
    activeBadgeId: "badge-mata-gigantes",
    unlockedBadges: ["badge-mata-gigantes"],
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
  {
    id: "p-luciana",
    name: "Luciana Verástegui",
    firstName: "Luciana",
    lastName: "Verástegui",
    elo: 2180,
    bestRank: 5,
    rank: 6,
    age: 25,
    height: "1.69 m",
    city: "Huancayo",
    club: "Country Club Los Huancas",
    clubLogo: ASSETS.clubCountry,
    individualMode: false,
    hand: "Diestra",
    backhand: "Revés a dos manos",
    bestShot: "Devolución agresiva al cuerpo",
    availability: "Mar, Jue y Sáb · 16:00 a 19:30",
    wins: 11,
    losses: 4,
    streak: 3,
    titles: 1,
    matchesPlayed: 15,
    gems: 190,
    isVip: true,
    vipCode: "MP-2026-0006",
    whatsapp: "51966444555",
    whatsappPrivacy: "rivals_only",
    email: "luciana@matchpoint.pe",
    surfaceThemeId: "cesped",
    unlockedThemes: ["finals", "cesped", "arcilla"],
    activeBadgeId: "badge-invicto",
    unlockedBadges: ["badge-invicto", "badge-rey-arcilla"],
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "F",
    hasCompletedTest: true,
  },
  {
    id: "p-hugo",
    name: "Hugo Salvatierra",
    firstName: "Hugo",
    lastName: "Salvatierra",
    elo: 1740,
    bestRank: 6,
    rank: 7,
    age: 48, // +40 Master
    height: "1.74 m",
    city: "San Carlos · Huancayo",
    club: "Club Los Inkas",
    clubLogo: ASSETS.clubInkas,
    individualMode: false,
    hand: "Diestro",
    backhand: "Revés a una mano",
    bestShot: "Volea de definición en la red",
    availability: "Sáb y Dom · 08:00 a 12:00",
    wins: 8,
    losses: 5,
    streak: 0,
    titles: 0,
    matchesPlayed: 13,
    gems: 75,
    isVip: false,
    vipCode: "MP-2026-0007",
    whatsapp: "51955666777",
    whatsappPrivacy: "public",
    email: "hugo@matchpoint.pe",
    surfaceThemeId: "finals",
    unlockedThemes: ["finals"],
    activeBadgeId: "badge-saque-canon",
    unlockedBadges: ["badge-saque-canon"],
    avatar:
      "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
  {
    id: "p-sebastian",
    name: "Sebastián Ordoñez",
    firstName: "Sebastián",
    lastName: "Ordoñez",
    elo: 1380,
    bestRank: 7,
    rank: 8,
    age: 23,
    height: "1.80 m",
    city: "Huancayo",
    club: "Club Tauro Tenis",
    clubLogo: ASSETS.clubTauro,
    individualMode: false,
    hand: "Diestro",
    backhand: "Revés a dos manos",
    bestShot: "Primer saque plano al centro",
    availability: "Lun a Vie · 16:00 a 19:00",
    wins: 6,
    losses: 5,
    streak: 2,
    titles: 0,
    matchesPlayed: 11,
    gems: 55,
    isVip: false,
    vipCode: "MP-2026-0008",
    whatsapp: "51944555666",
    whatsappPrivacy: "public",
    email: "sebastian@matchpoint.pe",
    surfaceThemeId: "finals",
    unlockedThemes: ["finals"],
    activeBadgeId: "",
    unlockedBadges: [],
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
  {
    id: "p-gabriel",
    name: "Gabriel Ledesma",
    firstName: "Gabriel",
    lastName: "Ledesma",
    elo: 780,
    bestRank: 8,
    rank: 9,
    age: 31,
    height: "1.73 m",
    city: "El Tambo · Huancayo",
    club: "Academia Romina Cutipa",
    clubLogo: ASSETS.clubRomina,
    individualMode: false,
    hand: "Diestro",
    backhand: "Revés a dos manos",
    bestShot: "Globo profundo sobre el revés",
    availability: "Sáb y Dom · Tardes",
    wins: 2,
    losses: 1,
    streak: 1,
    titles: 0,
    matchesPlayed: 3, // En partidos de prueba (3 de 5)
    gems: 35,
    isVip: false,
    vipCode: "MP-2026-0009",
    whatsapp: "51933444555",
    whatsappPrivacy: "public",
    email: "gabriel@matchpoint.pe",
    surfaceThemeId: "finals",
    unlockedThemes: ["finals"],
    activeBadgeId: "",
    unlockedBadges: [],
    avatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
  {
    id: "p-fernando",
    name: "Fernando Breña",
    firstName: "Fernando",
    lastName: "Breña",
    elo: 410,
    bestRank: 9,
    rank: 10,
    age: 42, // +40 Master en iniciación
    height: "1.75 m",
    city: "Huancayo",
    club: "Club Los Inkas",
    clubLogo: ASSETS.clubInkas,
    individualMode: true,
    hand: "Diestro",
    backhand: "Revés a dos manos",
    bestShot: "Derecha cruzada consistente",
    availability: "Dom · 09:00 a 13:00",
    wins: 0,
    losses: 2,
    streak: 0, // Regla: Victorias = 0 -> jamás muestra llama ni contador de racha
    titles: 0,
    matchesPlayed: 2, // En partidos de prueba (2 de 5)
    gems: 20,
    isVip: false,
    vipCode: "MP-2026-0010",
    whatsapp: "51922333444",
    whatsappPrivacy: "rivals_only",
    email: "fernando@matchpoint.pe",
    surfaceThemeId: "finals",
    unlockedThemes: ["finals"],
    activeBadgeId: "",
    unlockedBadges: [],
    avatar:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80",
    heroPhoto:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=82",
    cutoutAvatar: "",
    photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
    gender: "M",
    hasCompletedTest: true,
  },
];

// ----------------------------------------------------------------------------
// 6. LAS 4 SEDES OFICIALES DE HUANCAYO (SIN CHOQUES DE TEXTO, HORARIO SEPARADO,
//    LENGUAJE HUMANO Y GALERÍA REVELADA TIPO TELÓN)
// ----------------------------------------------------------------------------
export const WEATHER_SURFACE_STATES = {
  seco: {
    id: "seco",
    label: "Cancha Seca · Lista para jugar",
    shortLabel: "Cancha Seca",
    iconAsset: ASSETS.climaSeco,
    badgeBg: "bg-[#00DC7D]/20 text-[#00DC7D] border-[#00DC7D]/50",
    dotColor: "#00DC7D",
    playable: true,
  },
  humedad: {
    id: "humedad",
    label: "Humedad Leve · Bote rápido",
    shortLabel: "Humedad Leve",
    iconAsset: ASSETS.climaHumedad,
    badgeBg: "bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/50",
    dotColor: "#38BDF8",
    playable: true,
  },
  llovizna: {
    id: "llovizna",
    label: "Llovizna · Cancha en secado",
    shortLabel: "En Secado",
    iconAsset: ASSETS.climaLlovizna,
    badgeBg: "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50",
    dotColor: "#F59E0B",
    playable: false,
  },
  lluvia: {
    id: "lluvia",
    label: "Lluvia Fuerte · Cancha cerrada",
    shortLabel: "Cerrada por Lluvia",
    iconAsset: ASSETS.climaLluvia,
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-400/50",
    dotColor: "#F43F5E",
    playable: false,
  },
};

export const INITIAL_SEDES = [
  {
    id: "sede-country",
    name: "Country Club Los Huancas",
    shortName: "Country Club",
    zone: "San Carlos · Huancayo",
    address: "Av. Calmell del Solar Km 2.5, San Carlos, Huancayo",
    scheduleText: "Lun a Dom · 6:00 a. m. – 9:30 p. m.",
    surfaceType: "Arcilla Tradicional (3 Canchas)",
    weatherState: "seco",
    lastWeatherReport: "Actualizado hace 18 min",
    priceDaySoles: 30,
    priceNightSoles: 40,
    priceVipSoles: 22,
    vipDiscountTag: "-S/ 8 por hora con Carnet VIP",
    vipBenefitDetail: "Tarifa preferencial en horario valle y prioridad de reserva en torneos.",
    logoAsset: ASSETS.clubCountry,
    coverAsset: ASSETS.sedeCountryClub,
    videoAsset: ASSETS.videoCircuitoHorizontal,
    whatsapp: "51999111222",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Country+Club+Los+Huancas+Huancayo",
    wazeUrl: "https://waze.com/ul?q=Country%20Club%20Los%20Huancas%20Huancayo",
    isOfficialSponsorVenue: true,
    services: [
      "Arcilla cuidada y regada a diario",
      "Iluminación LED hasta las 9:30 p. m.",
      "Encordado profesional en el club",
      "Estacionamiento privado y cafetería",
      "Camerinos con duchas de agua caliente",
      "Alquiler de raquetas y venta de bebidas",
    ],
    curtainGallery: [
      {
        title: "Cancha Central de Arcilla",
        caption: "Polvo de ladrillo compactado con mantenimiento matutino y vespertino.",
        image:
          "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Turnos Nocturnos Iluminados",
        caption: "Reflectores LED de alta visibilidad para jugar después del trabajo.",
        image:
          "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1000&q=80",
      },
    ],
  },
  {
    id: "sede-romina",
    name: "Academia Romina Cutipa",
    shortName: "Academia Cutipa",
    zone: "El Tambo · Huancayo",
    address: "Jr. Los Quinuales 420, Urb. Millotingo, El Tambo",
    scheduleText: "Lun a Dom · 6:30 a. m. – 10:00 p. m.",
    surfaceType: "Arcilla Rápida (2 Canchas)",
    weatherState: "seco",
    lastWeatherReport: "Actualizado hace 12 min",
    priceDaySoles: 28,
    priceNightSoles: 38,
    priceVipSoles: 20,
    vipDiscountTag: "-S/ 8 por hora con Carnet VIP",
    vipBenefitDetail: "Descuento directo en alquiler de cancha y 15% en clínicas grupales.",
    logoAsset: ASSETS.clubRomina,
    coverAsset: ASSETS.sedeRominaCutipa,
    videoAsset: ASSETS.videoCoachRomina,
    whatsapp: "51999222333",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Academia+de+Tenis+Romina+Cutipa+Huancayo",
    wazeUrl: "https://waze.com/ul?q=El%20Tambo%20Huancayo",
    isOfficialSponsorVenue: true,
    services: [
      "Iluminación LED hasta las 10:00 p. m.",
      "Arcilla cuidada y regada a diario",
      "Clases individuales y academia de menores",
      "Venta de pelotas, overgrips y bebidas",
      "Zona de calentamiento y gradería techada",
    ],
    curtainGallery: [
      {
        title: "Sede Principal en El Tambo",
        caption: "Canchas abrigadas del viento ideales para partidos de ranking.",
        image:
          "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Entrenamiento de Alto Rendimiento",
        caption: "Canastos de pelotas, conos de dirección y preparación técnica.",
        image:
          "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80",
      },
    ],
  },
  {
    id: "sede-tauro",
    name: "Club Tauro Tenis",
    shortName: "Club Tauro",
    zone: "Centro / Huancayo",
    address: "Prolongación Guido 840, Huancayo",
    scheduleText: "Lun a Dom · 7:00 a. m. – 9:00 p. m.",
    surfaceType: "Arcilla Clásica (2 Canchas)",
    weatherState: "humedad",
    lastWeatherReport: "Actualizado hace 35 min",
    priceDaySoles: 25,
    priceNightSoles: 35,
    priceVipSoles: 19,
    vipDiscountTag: "-S/ 6 por hora con Carnet VIP",
    vipBenefitDetail: "Tarifa especial para socios en partidos de mañana y primera tarde.",
    logoAsset: ASSETS.clubTauro,
    coverAsset: ASSETS.sedeClubTauro,
    videoAsset: ASSETS.videoCoachHorizontal2,
    whatsapp: "51999333444",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Tauro+Tenis+Huancayo",
    wazeUrl: "https://waze.com/ul?q=Huancayo%20Centro",
    isOfficialSponsorVenue: true,
    services: [
      "Arcilla cuidada y regada a diario",
      "Iluminación nocturna para retos",
      "Encordado y cambio de grips en sede",
      "Bebidas hidratantes y terraza de descanso",
    ],
    curtainGallery: [
      {
        title: "Tradición Tenística en Huancayo",
        caption: "Punto de encuentro clásico para retos de 4ª y 3ª categoría.",
        image:
          "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80",
      },
    ],
  },
  {
    id: "sede-inkas",
    name: "Club Los Inkas",
    shortName: "Club Los Inkas",
    zone: "Chilca / Huancayo",
    address: "Av. Arterial 1120, Sector Residencial, Huancayo",
    scheduleText: "Lun a Dom · 6:30 a. m. – 9:00 p. m.",
    surfaceType: "Arcilla & Muro de Práctica",
    weatherState: "seco",
    lastWeatherReport: "Actualizado hace 24 min",
    priceDaySoles: 24,
    priceNightSoles: 32,
    priceVipSoles: 18,
    vipDiscountTag: "-S/ 6 por hora con Carnet VIP",
    vipBenefitDetail: "1 hora libre de frontón al reservar 2 horas de cancha con tu carnet.",
    logoAsset: ASSETS.clubInkas,
    coverAsset: ASSETS.sedeLosInkas,
    videoAsset: ASSETS.videoHorizontal3,
    whatsapp: "51999444555",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Club+Tenis+Huancayo",
    wazeUrl: "https://waze.com/ul?q=Huancayo",
    isOfficialSponsorVenue: false,
    services: [
      "Arcilla cuidada y regada a diario",
      "Alquiler de raquetas para principiantes",
      "Frontón de calentamiento previo al partido",
      "Estacionamiento amplio dentro del local",
    ],
    curtainGallery: [
      {
        title: "Ambiente Rodeado de Árboles",
        caption: "Canchas tranquilas ideales para partidos de fin de semana.",
        image:
          "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1000&q=80",
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// 7. DIRECTORIO COACH PRO HUANCAYO Y TIPS DE LA SEMANA (GRATIS VS CANDADO GEMAS)
// ----------------------------------------------------------------------------
export const INITIAL_COACHES = [
  {
    id: "coach-romina",
    name: "Romina Cutipa",
    roleTitle: "Directora Técnica & Entrenadora Principal",
    specialty: "Biomecánica de Derecha, Juego de Pies en Arcilla y Competencia",
    club: "Academia Romina Cutipa",
    clubLogo: ASSETS.clubRomina,
    rating: 4.95,
    reviewsCount: 38,
    activeStudents: 42,
    experienceYears: "11 años formando tenistas en Junín",
    priceSingleSoles: 60,
    pricePack4Soles: 210,
    priceVipPack4Soles: 185,
    coachPin: "2026",
    whatsapp: "51999222333",
    isCoachOfTheWeek: true,
    spotlightQuote:
      "En la altura de Huancayo la pelota viaja más rápido: quien ordena los pies medio segundo antes domina el punto.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=80",
    actionPhoto:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=82",
    videoAsset: ASSETS.videoCoachRomina,
    availableSlots: [
      "Mañana · 07:00 a. m.",
      "Mañana · 08:30 a. m.",
      "Jueves · 04:00 p. m.",
      "Sábado · 09:00 a. m.",
    ],
    programs: [
      {
        id: "pack-romina-1",
        name: "Sesión Individual de Diagnóstico Técnico",
        duration: "60 min en cancha + canasto",
        priceSoles: 60,
        vipPriceSoles: 50,
      },
      {
        id: "pack-romina-4",
        name: "Programa Mensual 4 Clases Personalizadas",
        duration: "4 sesiones de 60 min + video corrección",
        priceSoles: 210,
        vipPriceSoles: 185,
      },
    ],
    reviews: [
      {
        author: "Kenji Takahashi (4ª Categoría)",
        text: "En tres sesiones corregimos el cierre de mi derecha con topspin para que no se vaya larga con la altura.",
        stars: 5,
      },
      {
        author: "Luciana Verástegui (4ª Categoría)",
        text: "Excelente ritmo de canasto y ejercicios reales de partido.",
        stars: 5,
      },
    ],
  },
  {
    id: "coach-rodrigo",
    name: "Rodrigo Quispe",
    roleTitle: "Especialista en Saque, Táctica Individual y +40 Master",
    specialty: "Primer Saque con Efecto, Subida a la Red y Lectura de Rival",
    club: "Country Club Los Huancas",
    clubLogo: ASSETS.clubCountry,
    rating: 4.92,
    reviewsCount: 31,
    activeStudents: 35,
    experienceYears: "9 años en circuito nacional y clubes",
    priceSingleSoles: 65,
    pricePack4Soles: 230,
    priceVipPack4Soles: 195,
    coachPin: "3030",
    whatsapp: "51999111222",
    isCoachOfTheWeek: false,
    spotlightQuote:
      "Un segundo saque con buen kick te ahorra la mitad del desgaste físico en un partido a tres sets.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
    actionPhoto:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=82",
    videoAsset: ASSETS.videoCoachRodrigo,
    availableSlots: [
      "Hoy · 06:00 p. m.",
      "Mañana · 05:00 p. m.",
      "Viernes · 07:00 a. m.",
      "Sábado · 11:00 a. m.",
    ],
    programs: [
      {
        id: "pack-rodrigo-1",
        name: "Clínica Intensiva de Primer y Segundo Saque",
        duration: "60 min + medición de dirección",
        priceSoles: 65,
        vipPriceSoles: 55,
      },
      {
        id: "pack-rodrigo-4",
        name: "Pack Competidor (4 Sesiones de Táctica y Puntos)",
        duration: "4 sesiones de 60 min en cancha de arcilla",
        priceSoles: 230,
        vipPriceSoles: 195,
      },
    ],
    reviews: [
      {
        author: "Alejandro Santiváñez (+40 Master)",
        text: "Mejoré muchísimo la regularidad de mi segundo saque sin forzar el hombro.",
        stars: 5,
      },
    ],
  },
  {
    id: "coach-carlos",
    name: "Carlos Mendoza",
    roleTitle: "Entrenador de Iniciación (5ª P / 5ª B) y Consistencia",
    specialty: "Golpes de Fondo desde Cero, Movilidad y Control de Pelota",
    club: "Club Tauro Tenis",
    clubLogo: ASSETS.clubTauro,
    rating: 4.88,
    reviewsCount: 22,
    activeStudents: 28,
    experienceYears: "8 años enseñando a adultos y jóvenes",
    priceSingleSoles: 50,
    pricePack4Soles: 180,
    priceVipPack4Soles: 155,
    coachPin: "4040",
    whatsapp: "51999333444",
    isCoachOfTheWeek: false,
    spotlightQuote:
      "La base para subir de 5ª a 4ª categoría es sostener diez pelotas cruzadas profundas sin apurarse.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80",
    actionPhoto:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=82",
    videoAsset: ASSETS.videoCoachDemo3,
    availableSlots: [
      "Mañana · 04:00 p. m.",
      "Jueves · 06:00 p. m.",
      "Sábado · 03:00 p. m.",
    ],
    programs: [
      {
        id: "pack-carlos-1",
        name: "Clase de Base y Peloteo Guiado",
        duration: "60 min (incluye préstamo de raqueta)",
        priceSoles: 50,
        vipPriceSoles: 42,
      },
      {
        id: "pack-carlos-4",
        name: "Pack Ascenso 5ª Categoría (4 Clases)",
        duration: "4 sesiones de 60 min",
        priceSoles: 180,
        vipPriceSoles: 155,
      },
    ],
    reviews: [
      {
        author: "Gabriel Ledesma (5ª B)",
        text: "Súper paciente y claro para explicar la empuñadura y el armado del golpe.",
        stars: 5,
      },
    ],
  },
];

// Los 2 Tips Gratuitos de la Semana (Abiertos desde la cinta fina superior) +
// Clases Avanzadas de Academia TV Desbloqueables con Gemas
export const WEEKLY_TIPS_AND_CLASSES = [
  {
    id: "tip-free-1",
    title: "Cómo controlar el bote alto en la altura de Huancayo",
    coachName: "Romina Cutipa",
    duration: "02:45",
    categoryTag: "Tip Gratis de la Semana",
    isFreeWeeklyTip: true,
    costGems: 0,
    thumbnail: ASSETS.portadaTipsSemana,
    videoSrc: ASSETS.videoCoachRomina,
    keyTakeaways: [
      "Prepara la raqueta apenas la pelota rival cruza la red.",
      "Cierra un poco más la cara de la raqueta al impactar arriba de la cintura.",
      "Apunta un metro antes de la línea de fondo con mayor efecto topspin.",
    ],
  },
  {
    id: "tip-free-2",
    title: "Segundo saque con efecto para no regalar dobles faltas",
    coachName: "Rodrigo Quispe",
    duration: "03:10",
    categoryTag: "Tip Gratis de la Semana",
    isFreeWeeklyTip: true,
    costGems: 0,
    thumbnail: ASSETS.portadaTipsSemana,
    videoSrc: ASSETS.videoCoachRodrigo,
    keyTakeaways: [
      "Lanza la pelota ligeramente sobre tu cabeza y cepilla de 7 a 1 del reloj.",
      "Acelera la muñeca igual o más que en el primer saque para que la bola baje.",
    ],
  },
  {
    id: "class-gem-1",
    title: "Táctica en Arcilla: Cómo abrir la cancha con derecha invertida",
    coachName: "Romina Cutipa",
    duration: "06:20",
    categoryTag: "Clase Exclusiva",
    isFreeWeeklyTip: false,
    costGems: 40,
    thumbnail: ASSETS.portadaAcademiaTv,
    videoSrc: ASSETS.videoCircuitoHorizontal,
    keyTakeaways: [
      "Desplazamiento lateral rápido rodeando el revés en pelotas cortas.",
      "Castigar el revés rival con bote alto y cerrar el siguiente tiro al espacio libre.",
    ],
  },
  {
    id: "class-gem-2",
    title: "Cómo jugar y ganar un Super Tie-Break a 10 puntos bajo presión",
    coachName: "Rodrigo Quispe",
    duration: "05:45",
    categoryTag: "Clase Exclusiva",
    isFreeWeeklyTip: false,
    costGems: 45,
    thumbnail: ASSETS.portadaAcademiaTv,
    videoSrc: ASSETS.videoCoachHorizontal2,
    keyTakeaways: [
      "Porcentaje alto de primeros saques al cuerpo en los primeros 4 puntos.",
      "No arriesgar a las líneas en la devolución; obligar al rival a jugar una bola más.",
    ],
  },
];

// ----------------------------------------------------------------------------
// 8. CALENDARIO POR GIRAS (SEASON PROGRESS), TORNEOS HORIZONTALES, SALÓN DE LA
//    FAMA (WINNER ESMERALDA) Y PREMIOS TOP 3 DE LA TEMPORADA
// ----------------------------------------------------------------------------
export const SEASON_TOURS_PROGRESS = [
  {
    id: "gira-1",
    name: "Gira Apertura Country Club",
    period: "Ene – Mar 2026",
    surface: "Arcilla",
    status: "completed",
    progressPct: 100,
    championName: "Mateo Villavicencio",
  },
  {
    id: "gira-2",
    name: "Gira de Altura El Tambo",
    period: "Abr – Jun 2026",
    surface: "Arcilla",
    status: "completed",
    progressPct: 100,
    championName: "Alejandro Santiváñez",
  },
  {
    id: "gira-3",
    name: "Gira Valle del Mantaro",
    period: "Jul – Oct 2026",
    surface: "Arcilla",
    status: "active",
    progressPct: 82,
    championName: "En disputa",
  },
  {
    id: "gira-4",
    name: "Carrera al Master Top 8 Finals",
    period: "Nov – Dic 2026",
    surface: "Pista Central",
    status: "upcoming",
    progressPct: 35,
    championName: "Clasificando Top 8",
  },
];

export const SEASON_TOP3_PRIZES = [
  {
    rank: 1,
    title: "Campeón Anual del Circuito (#1)",
    badgeLabel: "ORO CAMPEÓN",
    prizeSummary: "Trofeo Oficial + Raqueta Profesional o Vale de S/ 500 en Tienda Pro",
    gemsBonus: 1000,
    digitalHonor: "Distintivo Vitalicio Campeón 2026 + Fondo Finals Dorado",
    accentHex: "#F59E0B",
  },
  {
    rank: 2,
    title: "Subcampeón de la Temporada (#2)",
    badgeLabel: "PLATA FINALISTA",
    prizeSummary: "Trofeo de Honor + Raquetero Térmico o Vale de S/ 250 en Tienda Pro",
    gemsBonus: 600,
    digitalHonor: "Distintivo Oficial Finalista de Temporada",
    accentHex: "#E2E8F0",
  },
  {
    rank: 3,
    title: "Tercer Puesto del Circuito (#3)",
    badgeLabel: "BRONCE PODIO",
    prizeSummary: "Medalla Oficial + Pack de Encordados y Tubos de Pelotas (Valor S/ 100)",
    gemsBonus: 350,
    digitalHonor: "Distintivo Oficial Podio del Valle",
    accentHex: "#D97706",
  },
];

export const INITIAL_TOURNAMENTS = [
  {
    id: "torneo-abierto-huancas",
    name: "Abierto Valle del Mantaro · Copa Los Huancas",
    shortTitle: "ABIERTO LOS HUANCAS",
    city: "HUANCAYO",
    club: "Country Club Los Huancas",
    clubLogo: ASSETS.clubCountry,
    surface: "ARCILLA",
    status: "in_progress",
    statusLabel: "EN CURSO · CUARTOS DE FINAL",
    datesLabel: "14 – 22 NOV 2026",
    entryFeeSoles: 60,
    vipEntryFeeSoles: 50,
    championGemsReward: 400,
    finalistGemsReward: 200,
    prizePoolText: "Trofeos + Vale S/ 300 en Tienda Pro + 400 Gemas al Campeón",
    categories: ["3ª y 4ª Unificada", "5ª Categoría (A/B)", "+40 Master"],
    coverAsset: ASSETS.torneoApertura,
    spotsTotal: 16,
    spotsTaken: 14,
    registeredPlayerIds: [
      "p-mateo",
      "p-alejandro",
      "p-pablo",
      "p-jose",
      "p-kenji",
      "p-luciana",
      "p-hugo",
      "p-sebastian",
    ],
    bracket: {
      quarters: [
        {
          id: "qf-1",
          roundLabel: "Cuartos 1",
          playerA: "Mateo Villavicencio",
          playerB: "Sebastián Ordoñez",
          score: "6-2, 6-3",
          winner: "Mateo Villavicencio",
          loser: "Sebastián Ordoñez",
        },
        {
          id: "qf-2",
          roundLabel: "Cuartos 2",
          playerA: "José Carlos Bastidas",
          playerB: "Kenji Takahashi",
          score: "6-4, 4-6, [10-7]",
          winner: "José Carlos Bastidas",
          loser: "Kenji Takahashi",
        },
        {
          id: "qf-3",
          roundLabel: "Cuartos 3",
          playerA: "Pablo Samaniego",
          playerB: "Luciana Verástegui",
          score: "6-3, 6-4",
          winner: "Pablo Samaniego",
          loser: "Luciana Verástegui",
        },
        {
          id: "qf-4",
          roundLabel: "Cuartos 4",
          playerA: "Alejandro Santiváñez",
          playerB: "Hugo Salvatierra",
          score: "6-2, 6-4",
          winner: "Alejandro Santiváñez",
          loser: "Hugo Salvatierra",
        },
      ],
      semis: [
        {
          id: "sf-1",
          roundLabel: "Semifinal 1",
          playerA: "Mateo Villavicencio",
          playerB: "José Carlos Bastidas",
          score: "6-4, 6-3",
          winner: "Mateo Villavicencio",
        },
        {
          id: "sf-2",
          roundLabel: "Semifinal 2",
          playerA: "Pablo Samaniego",
          playerB: "Alejandro Santiváñez",
          score: "En programación",
          winner: "",
        },
      ],
      final: {
        id: "final-1",
        roundLabel: "Gran Final",
        playerA: "Mateo Villavicencio",
        playerB: "Ganador Semifinal 2",
        score: "Domingo · 11:00 a. m.",
        winner: "",
      },
      consolationSemis: [
        {
          id: "csf-1",
          roundLabel: "Consuelo Semifinal 1",
          playerA: "Sebastián Ordoñez",
          playerB: "Kenji Takahashi",
          score: "4-6, 3-6",
          winner: "Kenji Takahashi",
        },
        {
          id: "csf-2",
          roundLabel: "Consuelo Semifinal 2",
          playerA: "Luciana Verástegui",
          playerB: "Hugo Salvatierra",
          score: "6-4, 6-4",
          winner: "Luciana Verástegui",
        },
      ],
      consolationFinal: {
        id: "cfinal-1",
        roundLabel: "Final Ronda Consuelo",
        playerA: "Kenji Takahashi",
        playerB: "Luciana Verástegui",
        score: "Sábado · 4:00 p. m.",
        winner: "",
      },
    },
  },
  {
    id: "torneo-altura-cutipa",
    name: "Clásico de Altura El Tambo · Copa Romina Cutipa",
    shortTitle: "CLÁSICO DE ALTURA",
    city: "EL TAMBO",
    club: "Academia Romina Cutipa",
    clubLogo: ASSETS.clubRomina,
    surface: "ARCILLA",
    status: "upcoming",
    statusLabel: "INSCRIPCIONES ABIERTAS",
    datesLabel: "28 NOV – 06 DIC 2026",
    entryFeeSoles: 55,
    vipEntryFeeSoles: 45,
    championGemsReward: 350,
    finalistGemsReward: 180,
    prizePoolText: "Trofeos + Encordados Pro + 350 Gemas al Campeón (Incluye Ronda Consuelo)",
    categories: ["4ª Categoría", "5ª A y 5ª B", "5ª Principiante"],
    coverAsset: ASSETS.torneoAltura,
    spotsTotal: 24,
    spotsTaken: 16,
    registeredPlayerIds: ["p-pablo", "p-kenji", "p-luciana", "p-sebastian", "p-gabriel"],
    bracket: {
      quarters: [],
      semis: [],
      final: null,
      consolationSemis: [],
      consolationFinal: null,
    },
  },
  {
    id: "torneo-master-top8",
    name: "Torneo de Maestros · Master Top 8 Finals Huancayo",
    shortTitle: "MASTER TOP 8 FINALS",
    city: "HUANCAYO",
    club: "Sede Central Country Club Los Huancas",
    clubLogo: ASSETS.clubCountry,
    surface: "ARCILLA ESTADIO",
    status: "finals_race",
    statusLabel: "CLASIFICACIÓN TOP 8 EN VIVO",
    datesLabel: "18 – 20 DIC 2026",
    entryFeeSoles: 80,
    vipEntryFeeSoles: 65,
    championGemsReward: 1000,
    finalistGemsReward: 600,
    prizePoolText: "Gran Copa de Maestros + Premios Top 3 de Temporada + 1,000 Gemas",
    categories: ["Top 8 General", "Top 8 +40 Master"],
    coverAsset: ASSETS.torneoMasterTop8,
    spotsTotal: 8,
    spotsTaken: 8,
    registeredPlayerIds: [
      "p-mateo",
      "p-alejandro",
      "p-pablo",
      "p-jose",
      "p-kenji",
      "p-luciana",
      "p-hugo",
      "p-sebastian",
    ],
    bracket: {
      quarters: [],
      semis: [],
      final: null,
      consolationSemis: [],
      consolationFinal: null,
    },
  },
];

export const PAST_CHAMPIONS_HALL = [
  {
    id: "champ-1",
    tournamentName: "Copa Apertura Country Club",
    dateText: "MAR 2026",
    club: "Country Club Los Huancas",
    surface: "ARCILLA",
    category: "Primera / 3ª Unificada",
    winnerId: "p-mateo",
    winnerName: "Mateo Villavicencio",
    winnerSurname: "VILLAVICENCIO",
    finalistName: "Alejandro Santiváñez",
    score: "6-4, 3-6, [10-8]",
    gemsWon: 400,
  },
  {
    id: "champ-2",
    tournamentName: "Abierto de Otoño El Tambo",
    dateText: "JUN 2026",
    club: "Academia Romina Cutipa",
    surface: "ARCILLA",
    category: "+40 Master & 3ª",
    winnerId: "p-alejandro",
    winnerName: "Alejandro Santiváñez",
    winnerSurname: "SANTIVÁÑEZ",
    finalistName: "José Carlos Bastidas",
    score: "6-3, 6-4",
    gemsWon: 350,
  },
  {
    id: "champ-3",
    tournamentName: "Torneo Relámpago Valle del Mantaro",
    dateText: "SEP 2026",
    club: "Country Club Los Huancas",
    surface: "ARCILLA",
    category: "4ª Categoría Oficial",
    winnerId: "p-pablo",
    winnerName: "Pablo Samaniego",
    winnerSurname: "SAMANIEGO",
    finalistName: "Kenji Takahashi",
    score: "7-5, 6-4",
    gemsWon: 350,
  },
];

// ----------------------------------------------------------------------------
// 9. TIENDA PRO SHOP CON PRECIOS REALES DE PERÚ Y LOS 3 ESCALONES DE CANJE
//    (1: Digital S/0 costo, 2: Copago Inteligente S/0 pérdida, 3: Físico Directo)
// ----------------------------------------------------------------------------
export const INITIAL_PROSHOP_ITEMS = [
  // ESCALÓN 1: PRESTIGIO DIGITAL (Costo S/ 0 para la app, enganche inmediato)
  {
    id: "shop-dig-arcilla",
    tier: "digital",
    tierLabel: "Personalización de Perfil",
    name: "Escenario Tierra Batida Roland Garros",
    description: "Viste la portada de tu perfil con polvo de ladrillo oficial detrás de tu silueta.",
    marketPriceSoles: 0,
    copayCashSoles: 0,
    costGems: 60,
    vipOnly: false,
    imageAsset: ASSETS.perfilBgArcilla,
    unlocksThemeId: "arcilla",
  },
  {
    id: "shop-dig-cesped",
    tier: "digital",
    tierLabel: "Personalización de Perfil",
    name: "Escenario Césped Clásico Wimbledon",
    description: "Portada de grama verde histórica para destacar tu perfil en el ranking.",
    marketPriceSoles: 0,
    copayCashSoles: 0,
    costGems: 80,
    vipOnly: false,
    imageAsset: ASSETS.perfilBgCesped,
    unlocksThemeId: "cesped",
  },
  {
    id: "shop-dig-badge-arcilla",
    tier: "digital",
    tierLabel: "Distintivo Oficial",
    name: "Insignia Rey de la Arcilla",
    description: "Emblema heráldico que aparece junto a tu nombre en el Ranking y Retos.",
    marketPriceSoles: 0,
    copayCashSoles: 0,
    costGems: 50,
    vipOnly: false,
    imageAsset: ASSETS.badgeReyArcilla,
    unlocksBadgeId: "badge-rey-arcilla",
  },

  // ESCALÓN 2: CUPONES DE COPAGO INTELIGENTE (El jugador ahorra de verdad y el
  // efectivo pagado cubre tu costo base: la app jamás pierde dinero)
  {
    id: "shop-copay-encordado",
    tier: "copay",
    tierLabel: "Bono de Ahorro con Gemas",
    name: "Bono -S/ 20 en Encordado Profesional",
    description:
      "Precio normal en tienda: S/ 55. Canjeando tus Gemas solo abonas S/ 35 por cuerda poliéster + mano de obra.",
    marketPriceSoles: 55,
    copayCashSoles: 35, // Cubre el costo real de cuerda y mano de obra
    costGems: 220,
    vipOnly: false,
    imageAsset: ASSETS.proshopRollo,
  },
  {
    id: "shop-copay-pelotas",
    tier: "copay",
    tierLabel: "Bono de Ahorro con Gemas",
    name: "Bono -S/ 15 en Tarro de Pelotas Presurizadas (x3)",
    description:
      "Precio regular en Perú: S/ 50 (Wilson US Open / Head Tour). Con tus Gemas solo abonas S/ 35.",
    marketPriceSoles: 50,
    copayCashSoles: 35,
    costGems: 180,
    vipOnly: false,
    imageAsset: ASSETS.pelotaVoltAzul,
  },
  {
    id: "shop-copay-vision-ia",
    tier: "copay",
    tierLabel: "Grabación en Cancha",
    name: "Bono -40% en Sesión MatchPoint Vision IA",
    description:
      "Grabación de tu partido con resumen sin tiempos muertos, mapa de piques y conteo de golpes.",
    marketPriceSoles: 45,
    copayCashSoles: 27,
    costGems: 160,
    vipOnly: false,
    imageAsset: ASSETS.bannerVisionIa,
  },

  // ESCALÓN 3: ARTÍCULOS FÍSICOS 100% CON GEMAS O COMPRA DIRECTA (Precios reales Perú)
  {
    id: "shop-phys-overgrip",
    tier: "physical",
    tierLabel: "Accesorio de Cancha",
    name: "Overgrip Pro Absorbente (Unidad)",
    description: "Agarre seco antideslizante ideal para el clima soleado de Huancayo.",
    marketPriceSoles: 14,
    vipDirectPriceSoles: 11,
    copayCashSoles: 0,
    costGems: 140, // Alcanzable para un jugador gratis constante tras varias semanas
    vipOnly: false,
    imageAsset: ASSETS.raquetaPro,
  },
  {
    id: "shop-phys-antivibrador",
    tier: "physical",
    tierLabel: "Accesorio de Cancha",
    name: "Antivibrador de Silicona Oficial",
    description: "Reduce la vibración del encordado y protege el codo en golpes fuertes.",
    marketPriceSoles: 20,
    vipDirectPriceSoles: 16,
    copayCashSoles: 0,
    costGems: 195,
    vipOnly: false,
    imageAsset: ASSETS.pelotaClasica,
  },
  {
    id: "shop-phys-encordado-full",
    tier: "physical",
    tierLabel: "Servicio Completo en Club",
    name: "Encordado Profesional 100% Canjeado con Gemas",
    description:
      "Incluye cuerda co-poliéster hexagonal de control + tensión exacta en máquina electrónica.",
    marketPriceSoles: 55,
    vipDirectPriceSoles: 45,
    copayCashSoles: 0,
    costGems: 1850, // Requiere ganar torneos o acumular como Socio VIP
    vipOnly: true,
    imageAsset: ASSETS.proshopRollo,
  },
  {
    id: "shop-phys-raqueta-pro",
    tier: "physical",
    tierLabel: "Equipamiento de Alta Gama",
    name: "Raqueta Profesional Aro 98 / 100 (300g)",
    description:
      "Marco de grafito de competencia (referencia Wilson Blade / Babolat Pure Drive en Perú).",
    marketPriceSoles: 980,
    vipDirectPriceSoles: 890,
    copayCashSoles: 680, // Copago con gemas o compra directa
    costGems: 1200,
    vipOnly: true,
    imageAsset: ASSETS.raquetaPro,
  },
];

// ----------------------------------------------------------------------------
// 10. HISTORIAS VERTICALES (STORIES 9:16), TRIVIA SEMANAL, AUSPICIADORES Y
//     CARTELERA INICIAL DE PARTIDOS / RETOS
// ----------------------------------------------------------------------------
export const INITIAL_STORIES_9_16 = [
  {
    id: "story-1",
    isNew: true,
    categoryPill: "NUEVO · PARTIDAZO",
    title: "Villavicencio vs. Santiváñez: Duelo por la cima en Los Huancas",
    subtitle: "Resumen de los mejores puntos en polvo de ladrillo",
    image:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80",
    playerAId: "p-mateo",
    playerBId: "p-alejandro",
    scoreText: "6-4, 3-6, [10-8]",
    club: "Country Club Los Huancas",
  },
  {
    id: "story-2",
    isNew: true,
    categoryPill: "NUEVO · ASCENSO",
    title: "Pablo Samaniego suma 4 victorias al hilo en 4ª Categoría",
    subtitle: "Derecha paralela letal y clasificación directa al Top 8",
    image:
      "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=900&q=80",
    playerAId: "p-pablo",
    playerBId: "p-kenji",
    scoreText: "7-5, 6-4",
    club: "Country Club Los Huancas",
  },
  {
    id: "story-3",
    isNew: true,
    categoryPill: "TIP EN CANCHA",
    title: "Romina Cutipa: Cómo cerrar puntos en la red sin dudar",
    subtitle: "Mira el consejo gratuito de esta semana",
    image:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80",
    playerAId: "p-luciana",
    playerBId: "p-hugo",
    scoreText: "6-4, 6-4",
    club: "Academia Romina Cutipa",
  },
  {
    id: "story-4",
    isNew: false,
    categoryPill: "+40 MASTER",
    title: "Bastidas impone su slice en el clásico del Club Tauro",
    subtitle: "Vigencia y táctica en tres sets disputados",
    image:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
    playerAId: "p-jose",
    playerBId: "p-kenji",
    scoreText: "6-4, 4-6, [10-7]",
    club: "Club Tauro Tenis",
  },
];

export const WEEKLY_TRIVIA_QUESTIONS = [
  {
    id: "triv-1",
    question:
      "En un partido oficial del circuito, si ambos tenistas empatan 6-6 en el primer set, ¿cómo se define ese set?",
    options: [
      "Gana el primero que llegue a 7 games directos (7-6 sin desempate)",
      "Se juega un Tie-Break a 7 puntos con diferencia mínima de 2",
      "Se juega un Super Tie-Break a 10 puntos",
    ],
    correctIndex: 1,
    rewardGems: 5,
    explanation:
      "En 6-6 se disputa un Tie-Break a 7 puntos con ventaja mínima de 2 puntos (ej. 7-5 o 8-6).",
  },
  {
    id: "triv-2",
    question:
      "¿Por qué la pelota de tenis bota más rápido y viaja más largo en las canchas de Huancayo (3,259 m s. n. m.)?",
    options: [
      "Porque las canchas son más cortas",
      "Por la menor densidad del aire en la altura, que ofrece menos freno aerodinámico",
      "Porque las pelotas pesan el doble",
    ],
    correctIndex: 1,
    rewardGems: 5,
    explanation:
      "A mayor altitud el aire es más ligero; por eso conviene usar mayor efecto topspin y ajustar la tensión de las cuerdas.",
  },
];

export const INITIAL_SPONSORS = {
  titleSponsor: {
    name: "Valle Pro",
    tagline: "Hidratación & Deporte",
    active: true,
    websiteUrl: "https://wa.me/51999888777",
  },
  weatherSponsor: {
    name: "Fisioterapia Mantaro",
    tagline: "Recuperación Deportiva Oficial",
    benefitText: "15% de descuento en descarga muscular para jugadores activos",
    active: true,
  },
  monthlyRaffleSponsor: {
    name: "Pro Shop Huancayo",
    prizeTitle: "Sorteo Mensual: 2 Tarros de Pelotas + 1 Encordado Profesional",
    minMatchesRequired: 2,
    active: true,
  },
};

export const INITIAL_MATCHES = [
  {
    id: "m-101",
    date: "16 Nov 2026 · 18:30",
    club: "Country Club Los Huancas",
    surface: "ARCILLA",
    roundLabel: "Reto Oficial Ranking",
    durationText: "01:48",
    playerAId: "p-pablo",
    playerAName: "Pablo Samaniego",
    playerBId: "p-kenji",
    playerBName: "Kenji Takahashi",
    sets: [
      { a: 7, b: 5 },
      { a: 6, b: 4 },
    ],
    score: "7-5, 6-4",
    winnerId: "p-pablo",
    winnerName: "Pablo Samaniego",
    eloDelta: 42,
  },
  {
    id: "m-102",
    date: "15 Nov 2026 · 10:00",
    club: "Academia Romina Cutipa",
    surface: "ARCILLA",
    roundLabel: "Reto Oficial +40 Master",
    durationText: "02:05",
    playerAId: "p-alejandro",
    playerAName: "Alejandro Santiváñez",
    playerBId: "p-jose",
    playerBName: "José Carlos Bastidas",
    sets: [
      { a: 6, b: 4 },
      { a: 6, b: 3 },
    ],
    score: "6-4, 6-3",
    winnerId: "p-alejandro",
    winnerName: "Alejandro Santiváñez",
    eloDelta: 38,
  },
  {
    id: "m-103",
    date: "14 Nov 2026 · 16:00",
    club: "Country Club Los Huancas",
    surface: "ARCILLA",
    roundLabel: "Cuartos · Abierto Los Huancas",
    durationText: "01:36",
    playerAId: "p-mateo",
    playerAName: "Mateo Villavicencio",
    playerBId: "p-sebastian",
    playerBName: "Sebastián Ordoñez",
    sets: [
      { a: 6, b: 2 },
      { a: 6, b: 3 },
    ],
    score: "6-2, 6-3",
    winnerId: "p-mateo",
    winnerName: "Mateo Villavicencio",
    eloDelta: 24,
  },
  {
    id: "m-104",
    date: "13 Nov 2026 · 17:30",
    club: "Academia Romina Cutipa",
    surface: "ARCILLA",
    roundLabel: "Reto Oficial Ranking",
    durationText: "01:52",
    playerAId: "p-luciana",
    playerAName: "Luciana Verástegui",
    playerBId: "p-hugo",
    playerBName: "Hugo Salvatierra",
    sets: [
      { a: 6, b: 4 },
      { a: 6, b: 4 },
    ],
    score: "6-4, 6-4",
    winnerId: "p-luciana",
    winnerName: "Luciana Verástegui",
    eloDelta: 46,
  },
];

export const INITIAL_CHALLENGES = [
  {
    id: "ch-live-1",
    status: "in_play", // 'pending' | 'accepted' | 'in_play' | 'completed'
    challengerId: "p-mateo",
    challengerName: "Mateo Villavicencio",
    challengedId: "p-alejandro",
    challengedName: "Alejandro Santiváñez",
    club: "Country Club Los Huancas",
    dateText: "17 Nov 2026 · 18:00",
    ballsAgreement: "Tarro nuevo a medias",
    isFriendly: false,
    liveScore: {
      currentSet: 2,
      sets: [
        { a: 6, b: 4, locked: true },
        { a: 4, b: 3, locked: false },
        { a: 0, b: 0, locked: false },
      ],
      serverSide: "A",
    },
  },
  {
    id: "ch-accepted-1",
    status: "accepted",
    challengerId: "p-pablo",
    challengerName: "Pablo Samaniego",
    challengedId: "p-jose",
    challengedName: "José Carlos Bastidas",
    club: "Academia Romina Cutipa",
    dateText: "18 Nov 2026 · 19:00",
    ballsAgreement: "Tarro nuevo a medias",
    isFriendly: false,
    liveScore: null,
  },
  {
    id: "ch-pending-1",
    status: "pending",
    challengerId: "p-kenji",
    challengerName: "Kenji Takahashi",
    challengedId: "p-pablo", // Reto entrante dirigido a Pablo para probar el pop-up y contrapropuesta
    challengedName: "Pablo Samaniego",
    club: "Country Club Los Huancas",
    dateText: "20 Nov 2026 · 18:30",
    ballsAgreement: "El retador lleva tarro nuevo",
    isFriendly: false,
    message: "¡Hola Pablo! ¿Jugamos la revancha este viernes por la tarde en Los Huancas?",
    liveScore: null,
  },
];

// === FIN DEL BLOQUE 3 DE 14 ===

// ============================================================================
// PARTE 4 DE 14: PORTADA ASIMÉTRICA WTA, RELOJ ANALÓGICO + CLIMA REAL HUANCAYO,
// CARRUSEL STORIES 9:16 CON VISOR PANTALLA COMPLETA, CLÁSICOS 50/50 Y TRIVIA
// ============================================================================

// ----------------------------------------------------------------------------
// 1. HOOK EN TIEMPO REAL: HORA OFICIAL DE HUANCAYO (UTC-5) + CLIMA Y RADIACIÓN
//    UV EN VIVO DESDE OPEN-METEO API
// ----------------------------------------------------------------------------
export function useHuancayoLiveWeatherAndClock() {
  const [nowDate, setNowDate] = useState(() => new Date());
  const [weatherData, setWeatherData] = useState({
    tempC: 19,
    uvIndex: 8,
    rainProb: 10,
    windKmh: 11,
    conditionLabel: "Cielo despejado · Cancha rápida",
    surfaceAdvice: "Condición ideal para jugar en arcilla",
    loadedFromApi: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const { latitude, longitude } = CIRCUIT_CONFIG.coordinatesHuancayo;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,uv_index&timezone=America%2FLima`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Sin red"))))
      .then((json) => {
        if (!isMounted || !json?.current) return;
        const temp = Math.round(Number(json.current.temperature_2m ?? 19));
        const uv = Math.round(Number(json.current.uv_index ?? 7));
        const wind = Math.round(Number(json.current.wind_speed_10m ?? 10));
        const precip = Number(json.current.precipitation ?? 0);
        const code = Number(json.current.weather_code ?? 0);

        let conditionLabel = "Sol andino · Arcilla seca";
        let surfaceAdvice = "Bote vivo; usa protector solar en cancha";
        if (precip > 0.6 || code >= 61) {
          conditionLabel = "Lluvia en el valle · Revisar sedes";
          surfaceAdvice = "Consulta el estado de secado antes de salir";
        } else if (code >= 51 || precip > 0.1) {
          conditionLabel = "Llovizna ligera · Arcilla húmeda";
          surfaceAdvice = "Pelota más pesada y bote bajo";
        } else if (code >= 2 && code <= 3) {
          conditionLabel = "Parcialmente nublado · Clima templado";
          surfaceAdvice = "Visibilidad cómoda sin reflejo solar";
        }

        setWeatherData({
          tempC: temp,
          uvIndex: uv,
          rainProb: precip > 0 ? 75 : code >= 2 ? 20 : 5,
          windKmh: wind,
          conditionLabel,
          surfaceAdvice,
          loadedFromApi: true,
        });
      })
      .catch(() => {
        // Conserva valores climáticos por defecto si el celular está sin datos
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Calcula hora exacta en zona horaria de Perú (America/Lima)
  const peruTimeParts = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(nowDate);
      const hour24 = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
      const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
      const second = Number(parts.find((p) => p.type === "second")?.value ?? 0);
      const ampm = hour24 >= 12 ? "PM" : "AM";
      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const formatted12 = `${String(hour12).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
      )} ${ampm}`;
      return { hour24, minute, second, formatted12 };
    } catch (e) {
      const h = nowDate.getHours();
      const m = nowDate.getMinutes();
      const s = nowDate.getSeconds();
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return {
        hour24: h,
        minute: m,
        second: s,
        formatted12: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`,
      };
    }
  }, [nowDate]);

  return { peruTimeParts, weatherData };
}

// ----------------------------------------------------------------------------
// 2. RELOJ ANALÓGICO VECTORIAL EN VIVO (<WtaAnalogClockSvg/>)
//    Inspirado en el widget oficial de hora en cancha de wtatennis.com
// ----------------------------------------------------------------------------
export function WtaAnalogClockSvg({ hour24 = 10, minute = 10, second = 30, size = 48 }) {
  const hourAngle = ((hour24 % 12) + minute / 60) * 30;
  const minuteAngle = (minute + second / 60) * 6;
  const secondAngle = second * 6;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.28)]"
    >
      {/* Bisel exterior dorado/esmeralda y esfera oscura */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="#1E0734"
        stroke="#6EF2B5"
        strokeWidth="2.5"
      />
      <circle
        cx="32"
        cy="32"
        r="26.5"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
      />

      {/* 12 Marcas Horarias */}
      {[...Array(12)].map((_, idx) => {
        const angle = idx * 30;
        const isQuarter = idx % 3 === 0;
        return (
          <line
            key={idx}
            x1="32"
            y1={isQuarter ? "7.5" : "9"}
            x2="32"
            y2={isQuarter ? "12.5" : "11.5"}
            stroke={isQuarter ? "#00DC7D" : "rgba(255,255,255,0.55)"}
            strokeWidth={isQuarter ? "2.2" : "1.3"}
            strokeLinecap="round"
            transform={`rotate(${angle} 32 32)`}
          />
        );
      })}

      {/* Aguja de Horas */}
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="17"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 32 32)`}
      />

      {/* Aguja de Minutos */}
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="11.5"
        stroke="#6EF2B5"
        strokeWidth="2.1"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 32 32)`}
      />

      {/* Aguja de Segundos en Verde Esmeralda */}
      <line
        x1="32"
        y1="35"
        x2="32"
        y2="9.5"
        stroke="#00DC7D"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform={`rotate(${secondAngle} 32 32)`}
      />

      {/* Eje central */}
      <circle cx="32" cy="32" r="2.8" fill="#00DC7D" />
      <circle cx="32" cy="32" r="1.2" fill="#1E0734" />
    </svg>
  );
}

// ----------------------------------------------------------------------------
// 3. CABECERA ASIMÉTRICA WTA 65/35 (<WtaAsymmetricHeroSection/>)
//    - Carrusel principal con degradado protector, píldora de superficie,
//      indicadores verdes alargados y flechas circulares < >.
//    - Tarjeta "EN CANCHA AHORA" con el Trofeo 3D asomando en la esquina.
//    - Widget Verde Esmeralda con Reloj Analógico + Clima Real de Huancayo.
// ----------------------------------------------------------------------------
export function WtaAsymmetricHeroSection({
  liveChallenge,
  tournaments = [],
  sponsors = INITIAL_SPONSORS,
  lightMode = false,
  onOpenLiveMatch,
  onNavigateTab,
  onOpenMasterTop8,
  onOpenLaunchChallenge,
}) {
  const { peruTimeParts, weatherData } = useHuancayoLiveWeatherAndClock();
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  const heroSlides = useMemo(
    () => [
      {
        id: "hero-slide-1",
        badge: "TORNEO EN CURSO · HUANCAYO",
        surfaceTag: "ARCILLA",
        title: "ABIERTO LOS HUANCAS: CUARTOS DE FINAL AL ROJO VIVO",
        subtitle:
          "Revisa los cruces actualizados, sigue el marcador en cancha y suma puntos para la carrera anual.",
        ctaLabel: "Ver cuadro del torneo",
        image: ASSETS.torneoApertura,
        actionType: "tournaments",
      },
      {
        id: "hero-slide-2",
        badge: "CARRERA DE TEMPORADA",
        surfaceTag: "TOP 8 FINALS",
        title: "RUMBO AL MASTER TOP 8: CADA RETO CUENTA EN LA TABLA",
        subtitle:
          "Los 8 mejores del ranking general y +40 Master clasifican a la gran definición de diciembre.",
        ctaLabel: "Ver clasificación Top 8",
        image: ASSETS.torneoMasterTop8,
        actionType: "master_top8",
      },
      {
        id: "hero-slide-3",
        badge: "DESAFÍOS ENTRE CLUBES",
        surfaceTag: "4 SEDES ALIADAS",
        title: "LANZA UN RETO HOY Y DESBLOQUEA DISTINTIVOS DE PERFIL",
        subtitle:
          "Encadena 3 victorias seguidas o vence a un rival de mayor puntaje para ganar Gemas de mérito.",
        ctaLabel: "Lanzar nuevo reto",
        image: ASSETS.torneoAltura,
        actionType: "launch_challenge",
      },
    ],
    []
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const currentSlide = heroSlides[heroSlideIdx] || heroSlides[0];

  const handleSlideAction = () => {
    triggerHaptic("hero");
    if (currentSlide.actionType === "tournaments" && onNavigateTab) {
      onNavigateTab("torneos");
    } else if (currentSlide.actionType === "master_top8" && onOpenMasterTop8) {
      onOpenMasterTop8();
    } else if (currentSlide.actionType === "launch_challenge" && onOpenLaunchChallenge) {
      onOpenLaunchChallenge();
    }
  };

  return (
    <section className="px-3.5 sm:px-5 pt-2 pb-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* COLUMNA IZQUIERDA (65% -> 7 cols): CARRUSEL PANORÁMICO PRINCIPAL */}
        <div
          onClick={handleSlideAction}
          className="lg:col-span-7 relative rounded-3xl overflow-hidden min-h-[228px] sm:min-h-[268px] flex flex-col justify-between p-4 sm:p-5 border border-white/15 shadow-[0_14px_34px_rgba(0,0,0,0.35)] cursor-pointer group wta-card-aura"
        >
          {/* Imagen de fondo con transición suave */}
          <div key={currentSlide.id} className="absolute inset-0 wta-blur-to-sharp">
            <SmartImage
              src={currentSlide.image}
              alt={currentSlide.title}
              eager
              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(30,7,52,0.55) 0%, rgba(30,7,52,0.25) 35%, rgba(30,7,52,0.88) 78%, rgba(22,4,40,0.97) 100%)",
              }}
            />
          </div>

          {/* Fila Superior: Píldora de Categoría y Etiqueta Terracota de Superficie */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 text-[#1E0734] text-[10px] font-wta-display font-extrabold uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A859]" />
              {currentSlide.badge}
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-[#C85A32]/90 text-white border border-white/25 text-[10px] font-wta-display font-extrabold uppercase tracking-wider">
              {currentSlide.surfaceTag}
            </span>
          </div>

          {/* Contenido Central e Inferior del Hero */}
          <div className="relative z-10 mt-6">
            <h2 className="font-wta-condensed text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight leading-[1.03] drop-shadow-sm">
              {currentSlide.title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-[13px] text-white/85 line-clamp-2 leading-relaxed max-w-xl">
              {currentSlide.subtitle}
            </p>

            {/* Barra Inferior del Carrusel: Botón Píldora + Indicadores + Flechas < > */}
            <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlideAction();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#1E0734] hover:bg-[#00DC7D] text-xs font-wta-display font-extrabold tracking-tight shadow-md mp-btn-tactile"
              >
                <span className="w-2 h-2 rounded-full bg-[#00DC7D]" />
                <span>{currentSlide.ctaLabel}</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Indicadores de diapositiva (activo = píldora verde esmeralda alargada) */}
                <div className="flex items-center gap-1">
                  {heroSlides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Noticia ${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic("tab");
                        setHeroSlideIdx(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === heroSlideIdx
                          ? "w-6 bg-[#00DC7D]"
                          : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>

                {/* Botones Circulares < > */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Anterior"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic("tab");
                      setHeroSlideIdx(
                        (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                      );
                    }}
                    className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white border border-white/25 flex items-center justify-center mp-btn-tactile"
                  >
                    <WtaIcon name="chevron-left" size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Siguiente"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic("tab");
                      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
                    }}
                    className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white border border-white/25 flex items-center justify-center mp-btn-tactile"
                  >
                    <WtaIcon name="chevron-right" size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (35% -> 5 cols): 2 WIDGETS APILADOS (EN VIVO + RELOJ/CLIMA) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
          {/* WIDGET SUPERIOR: EN CANCHA AHORA (FOLLOW LIVE) + TROFEO 3D EN ESQUINA */}
          <div
            onClick={() => {
              triggerHaptic("card");
              if (liveChallenge && onOpenLiveMatch) {
                onOpenLiveMatch(liveChallenge);
              } else if (onOpenMasterTop8) {
                onOpenMasterTop8();
              }
            }}
            className="relative rounded-3xl p-4 bg-gradient-to-br from-[#290C46] via-[#23083C] to-[#170429] text-white border border-[#00DC7D]/35 shadow-lg overflow-hidden cursor-pointer wta-card-aura flex flex-col justify-between min-h-[126px]"
          >
            {/* Resplandor lateral esmeralda */}
            <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-[#00DC7D]/20 blur-xl pointer-events-none" />

            <div className="relative z-10 pr-16">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#00DC7D] animate-ping" />
                <span className="font-wta-condensed text-sm sm:text-base font-bold tracking-wider text-[#00DC7D] uppercase">
                  EN CANCHA AHORA
                </span>
              </div>

              {liveChallenge ? (
                <>
                  <p className="text-xs font-extrabold text-white truncate">
                    {liveChallenge.challengerName} vs. {liveChallenge.challengedName}
                  </p>
                  <p className="text-[11px] text-white/70 truncate mt-0.5">
                    {liveChallenge.club} · Set {liveChallenge.liveScore?.currentSet || 2} en juego
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-extrabold text-white">
                    Carrera al Master Top 8 Finals
                  </p>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    Sigue los partidos en vivo y la tabla anual.
                  </p>
                </>
              )}
            </div>

            <div className="relative z-10 mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1E0734] text-[11px] font-wta-display font-extrabold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00DC7D]" />
                <span>{liveChallenge ? "Ver marcador en vivo" : "Ver Top 8"}</span>
              </span>
            </div>

            {/* Trofeo 3D asomando recortado en la esquina inferior derecha (Estilo WTA) */}
            <div className="absolute -right-2 -bottom-2 w-20 h-20 pointer-events-none select-none opacity-95 transform rotate-[-8deg]">
              <SmartImage
                src={ASSETS.trofeoMasterTop8}
                alt="Trofeo Oficial"
                className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>

          {/* WIDGET INFERIOR: RELOJ ANALÓGICO EN VIVO + CLIMA Y UV REAL DE HUANCAYO */}
          <div
            onClick={() => {
              triggerHaptic("card");
              if (onNavigateTab) onNavigateTab("sedes");
            }}
            className="relative rounded-3xl p-3.5 sm:p-4 bg-gradient-to-r from-[#008F4C] via-[#00A859] to-[#00C46B] text-[#1E0734] border border-[#6EF2B5]/60 shadow-lg overflow-hidden cursor-pointer wta-card-aura flex items-center justify-between gap-3 min-h-[118px]"
          >
            {/* Reloj Analógico Funcional a la Izquierda */}
            <div className="flex items-center gap-3 min-w-0">
              <WtaAnalogClockSvg
                hour24={peruTimeParts.hour24}
                minute={peruTimeParts.minute}
                second={peruTimeParts.second}
                size={50}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-wta-display font-black uppercase tracking-wider text-[#1E0734]/80">
                    HORA HUANCAYO
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#1E0734] text-[#00DC7D] text-[9px] font-extrabold">
                    UV {weatherData.uvIndex}
                  </span>
                </div>

                <div className="font-wta-condensed text-2xl sm:text-[26px] font-bold text-white tracking-tight leading-none mt-0.5 tabular-nums drop-shadow-sm">
                  {peruTimeParts.formatted12}
                </div>

                <p className="text-[11px] font-extrabold text-[#1E0734] truncate mt-1">
                  {weatherData.tempC}°C · {weatherData.conditionLabel}
                </p>

                {sponsors?.weatherSponsor?.active && (
                  <p className="text-[9px] font-bold text-white/90 truncate mt-0.5">
                    Presentado por {sponsors.weatherSponsor.name}
                  </p>
                )}
              </div>
            </div>

            {/* Icono 3D Climático a la Derecha */}
            <div className="shrink-0 flex flex-col items-center justify-center bg-[#1E0734]/15 rounded-2xl p-2 border border-white/25">
              <SmartImage
                src={
                  weatherData.rainProb >= 60
                    ? ASSETS.climaLluvia
                    : weatherData.rainProb >= 25
                    ? ASSETS.climaLlovizna
                    : ASSETS.climaSeco
                }
                alt="Clima Huancayo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-[9px] font-extrabold text-white mt-0.5">Sedes ➔</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// 4. CARRUSEL VERTICAL STORIES 9:16 (<WtaStories916Carousel/>) CON VISOR A
//    PANTALLA COMPLETA E INTERACCIÓN DIRECTA HACIA PERFIL Y PÓSTER 9:16
// ----------------------------------------------------------------------------
export function WtaStories916Carousel({
  stories = INITIAL_STORIES_9_16,
  players = [],
  lightMode = false,
  onSelectPlayerProfile,
  onOpenStoryPoster,
  onOpenH2HWithPlayers,
}) {
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const scrollRef = useRef(null);

  const handleOpenStory = (idx) => {
    triggerHaptic("card");
    setActiveStoryIndex(idx);
  };

  const activeStory =
    activeStoryIndex !== null && stories[activeStoryIndex]
      ? stories[activeStoryIndex]
      : null;

  return (
    <section className="px-3.5 sm:px-5 py-2">
      <div
        className={`rounded-3xl p-4 sm:p-5 border transition-colors ${
          lightMode
            ? "bg-white border-[#1E0734]/10 shadow-sm"
            : "bg-[#23083C]/90 border-white/12 shadow-lg"
        }`}
      >
        {/* Cabecera de la sección Stories */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00DC7D]" />
              <h3
                className={`font-wta-condensed text-xl sm:text-2xl font-bold uppercase tracking-tight ${
                  lightMode ? "text-[#1E0734]" : "text-white"
                }`}
              >
                HISTORIAS DEL CIRCUITO
              </h3>
            </div>
            <p
              className={`text-xs ${
                lightMode ? "text-[#1E0734]/65" : "text-white/65"
              }`}
            >
              Momentos destacados, rachas y victorias de la semana en formato vertical
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
                }
              }}
              aria-label="Deslizar historias a la izquierda"
              className={`w-8 h-8 rounded-full flex items-center justify-center border mp-btn-tactile ${
                lightMode
                  ? "bg-[#FAF9F5] border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-white/10 border-white/15 text-white"
              }`}
            >
              <WtaIcon name="chevron-left" size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
                }
              }}
              aria-label="Deslizar historias a la derecha"
              className={`w-8 h-8 rounded-full flex items-center justify-center border mp-btn-tactile ${
                lightMode
                  ? "bg-[#FAF9F5] border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-white/10 border-white/15 text-white"
              }`}
            >
              <WtaIcon name="chevron-right" size={15} />
            </button>
          </div>
        </div>

        {/* Carrusel Horizontal de Tarjetas Verticales 9:16 */}
        <div ref={scrollRef} className="mp-horizontal-snap gap-3 pb-1">
          {stories.map((story, idx) => {
            const protagonist = players.find((p) => p.id === story.playerAId);
            return (
              <div
                key={story.id}
                onClick={() => handleOpenStory(idx)}
                className="mp-snap-card relative w-[152px] sm:w-[172px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/20 cursor-pointer group wta-card-aura select-none"
              >
                <SmartImage
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                />

                {/* Degradado oscuro inferior estilo WTA Stories */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(30,7,52,0.35) 0%, rgba(30,7,52,0.05) 38%, rgba(30,7,52,0.88) 78%, rgba(22,4,40,0.98) 100%)",
                  }}
                />

                {/* Píldora Superior Izquierda: NUEVO en Verde Esmeralda */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-wta-display font-black uppercase tracking-wider shadow-sm ${
                      story.isNew
                        ? "bg-[#00DC7D] text-[#1E0734]"
                        : "bg-white/85 text-[#1E0734]"
                    }`}
                  >
                    {story.categoryPill}
                  </span>
                </div>

                {/* Mini retrato y titular en la base */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-col justify-end">
                  {protagonist && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <SmartImage
                        src={protagonist.avatar}
                        alt={protagonist.name}
                        isAvatar
                        className="w-6 h-6 rounded-full border border-[#00DC7D]"
                      />
                      <span className="text-[10px] font-bold text-[#6EF2B5] truncate">
                        {protagonist.name}
                      </span>
                    </div>
                  )}

                  <h4 className="text-xs font-wta-display font-extrabold text-white leading-snug line-clamp-2 pr-6">
                    {story.title}
                  </h4>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#00DC7D]">
                      {story.scoreText}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-[#1E0734] text-[#00DC7D] border border-[#00DC7D]/60 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <WtaIcon name="arrow-right" size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VISOR INTERACTIVO A PANTALLA COMPLETA DE STORIES 9:16 */}
      {activeStory && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 mp-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveStoryIndex(null);
          }}
        >
          <div className="relative w-full max-w-[390px] aspect-[9/16] max-h-[90dvh] rounded-3xl overflow-hidden bg-[#1E0734] border-2 border-[#00DC7D] shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col justify-between mp-modal-sheet">
            {/* Imagen de fondo a sangre completa */}
            <SmartImage
              src={activeStory.image}
              alt={activeStory.title}
              eager
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(30,7,52,0.75) 0%, rgba(30,7,52,0.18) 35%, rgba(30,7,52,0.86) 72%, rgba(22,4,40,0.98) 100%)",
              }}
            />

            {/* Barras superiores de progreso por historia + Cabecera */}
            <div className="relative z-20 p-3.5 space-y-2.5">
              <div className="grid grid-cols-4 gap-1.5">
                {stories.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveStoryIndex(idx)}
                    className="h-1 rounded-full overflow-hidden bg-white/25"
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        idx <= activeStoryIndex ? "w-full bg-[#00DC7D]" : "w-0"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider">
                  {activeStory.categoryPill}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setActiveStoryIndex(null);
                  }}
                  className="w-8 h-8 rounded-full bg-black/45 text-white border border-white/25 flex items-center justify-center mp-close-btn"
                >
                  <WtaIcon name="close" size={16} />
                </button>
              </div>
            </div>

            {/* Zonas laterales táctiles para pasar a la historia anterior o siguiente */}
            <div className="relative z-10 flex-1 grid grid-cols-2">
              <div
                onClick={() => {
                  triggerHaptic("tab");
                  setActiveStoryIndex((prev) =>
                    prev > 0 ? prev - 1 : stories.length - 1
                  );
                }}
                className="cursor-pointer"
                title="Historia anterior"
              />
              <div
                onClick={() => {
                  triggerHaptic("tab");
                  setActiveStoryIndex((prev) =>
                    prev < stories.length - 1 ? prev + 1 : 0
                  );
                }}
                className="cursor-pointer"
                title="Siguiente historia"
              />
            </div>

            {/* Pie de la Historia con Marcador y Botones de Acción */}
            <div className="relative z-20 p-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/92 text-[#1E0734] backdrop-blur-md shadow-lg">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#C85A32] mb-1">
                  <span>{activeStory.club}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D]">
                    {activeStory.scoreText}
                  </span>
                </div>
                <h4 className="font-wta-condensed text-xl font-bold uppercase text-[#1E0734] leading-tight">
                  {activeStory.title}
                </h4>
                <p className="text-xs text-[#1E0734]/75 mt-0.5">
                  {activeStory.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onOpenH2HWithPlayers && (
                  <button
                    type="button"
                    onClick={() => {
                      const pA = players.find((p) => p.id === activeStory.playerAId);
                      const pB = players.find((p) => p.id === activeStory.playerBId);
                      setActiveStoryIndex(null);
                      onOpenH2HWithPlayers(pA, pB);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center justify-center gap-1.5 mp-btn-tactile"
                  >
                    <WtaIcon name="h2h" size={14} />
                    <span>Comparar H2H</span>
                  </button>
                )}

                {onOpenStoryPoster && (
                  <button
                    type="button"
                    onClick={() => {
                      const pA = players.find((p) => p.id === activeStory.playerAId);
                      const pB = players.find((p) => p.id === activeStory.playerBId);
                      setActiveStoryIndex(null);
                      onOpenStoryPoster({
                        winnerName: pA?.name || "Pablo Samaniego",
                        loserName: pB?.name || "Kenji Takahashi",
                        scoreText: activeStory.scoreText,
                        club: activeStory.club,
                      });
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl mp-btn-emerald text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <WtaIcon name="share" size={14} />
                    <span>Compartir Póster</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------------
// 5. COLLAGES DIVIDIDOS 50/50 RIVALRY REWIND (<WtaRivalryRewindSection/>)
//    Muestra los duelos clásicos del circuito con retrato dividido al 50%
// ----------------------------------------------------------------------------
export function WtaRivalryRewindSection({
  players = [],
  lightMode = false,
  onOpenH2HWithPlayers,
}) {
  const featuredRivalries = useMemo(() => {
    const pMateo = players.find((p) => p.id === "p-mateo") || players[0];
    const pAlejandro = players.find((p) => p.id === "p-alejandro") || players[1];
    const pPablo = players.find((p) => p.id === "p-pablo") || players[2];
    const pKenji = players.find((p) => p.id === "p-kenji") || players[4];

    return [
      {
        id: "riv-1",
        tag: "CLÁSICO DE CIMA · #1 VS #2",
        title: "Villavicencio vs. Santiváñez",
        seriesScore: "Serie: 3 – 2",
        lastResult: "Último: 6-4, 3-6, [10-8]",
        playerA: pMateo,
        playerB: pAlejandro,
      },
      {
        id: "riv-2",
        tag: "DUELO DE 4ª CATEGORÍA",
        title: "Samaniego vs. Takahashi",
        seriesScore: "Serie: 2 – 1",
        lastResult: "Último: 7-5, 6-4",
        playerA: pPablo,
        playerB: pKenji,
      },
    ];
  }, [players]);

  return (
    <section className="px-3.5 sm:px-5 py-1.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {featuredRivalries.map((riv) => (
          <div
            key={riv.id}
            onClick={() => {
              triggerHaptic("card");
              if (onOpenH2HWithPlayers) {
                onOpenH2HWithPlayers(riv.playerA, riv.playerB);
              }
            }}
            className="relative rounded-3xl overflow-hidden h-40 sm:h-44 border border-white/15 cursor-pointer group wta-card-aura shadow-md"
          >
            {/* Mitad Izquierda (50%) y Mitad Derecha (50%) divididas por línea blanca de 2px */}
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative h-full overflow-hidden bg-[#1E0734]">
                <SmartImage
                  src={riv.playerA?.avatar}
                  alt={riv.playerA?.name}
                  isAvatar
                  className="w-full h-full object-cover object-top transform transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="relative h-full overflow-hidden bg-[#290C46] border-l-2 border-[#00DC7D]">
                <SmartImage
                  src={riv.playerB?.avatar}
                  alt={riv.playerB?.name}
                  isAvatar
                  className="w-full h-full object-cover object-top transform transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Sombra degradada para lectura limpia */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(30,7,52,0.55) 0%, rgba(30,7,52,0.15) 42%, rgba(22,4,40,0.94) 100%)",
              }}
            />

            {/* Sello Central VS */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-[#1E0734] text-[#00DC7D] border-2 border-[#00DC7D] font-wta-condensed font-bold text-sm flex items-center justify-center shadow-lg">
              VS
            </div>

            {/* Etiqueta Superior */}
            <div className="relative z-10 p-3 flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734]/90 text-[#00DC7D] border border-[#00DC7D]/40 text-[9px] font-wta-display font-extrabold uppercase tracking-wider">
                {riv.tag}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white text-[#1E0734] text-[10px] font-extrabold">
                {riv.seriesScore}
              </span>
            </div>

            {/* Titular Inferior */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-2">
              <div>
                <h4 className="font-wta-condensed text-lg sm:text-xl font-bold uppercase text-white leading-none">
                  {riv.title}
                </h4>
                <p className="text-[11px] text-[#6EF2B5] font-semibold mt-0.5">
                  {riv.lastResult}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-extrabold shrink-0">
                Ver H2H ➔
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// 6. TRIVIA SEMANAL INTERACTIVA DEL CIRCUITO (<WeeklyTriviaGemsWidget/>)
//    Permite ganar Gemas respondiendo preguntas reales de reglamento y altura
// ----------------------------------------------------------------------------
export function WeeklyTriviaGemsWidget({
  currentUser,
  answeredTriviaIds = [],
  onClaimTriviaGems,
  lightMode = false,
}) {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'wrong' | null

  const currentQuestion =
    WEEKLY_TRIVIA_QUESTIONS[questionIdx] || WEEKLY_TRIVIA_QUESTIONS[0];
  const alreadyClaimed = answeredTriviaIds.includes(currentQuestion.id);
  const effectiveReward = currentUser?.isVip
    ? Math.round(currentQuestion.rewardGems * 2)
    : currentQuestion.rewardGems;

  const handleSelectOption = (idx) => {
    if (alreadyClaimed || feedbackState === "correct") return;
    triggerHaptic("tab");
    setSelectedOpt(idx);

    if (idx === currentQuestion.correctIndex) {
      triggerHaptic("success");
      setFeedbackState("correct");
      if (onClaimTriviaGems) {
        onClaimTriviaGems(currentQuestion.id, effectiveReward);
      }
    } else {
      setFeedbackState("wrong");
    }
  };

  return (
    <section className="px-3.5 sm:px-5 py-2">
      <div
        className={`rounded-3xl p-4 sm:p-5 border relative overflow-hidden wta-card-aura ${
          lightMode
            ? "bg-gradient-to-br from-white via-[#FAF9F5] to-[#00DC7D]/10 border-[#1E0734]/12 text-[#1E0734]"
            : "bg-gradient-to-br from-[#290C46] via-[#23083C] to-[#1E0734] border-[#00DC7D]/30 text-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider">
              TRIVIA DE LA SEMANA
            </span>
            <span
              className={`text-xs font-bold ${
                lightMode ? "text-[#1E0734]/70" : "text-white/70"
              }`}
            >
              Pregunta {questionIdx + 1} de {WEEKLY_TRIVIA_QUESTIONS.length}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/50 text-[#F59E0B] text-xs font-extrabold">
            +{effectiveReward} <WtaIcon name="gem" size={13} className="text-[#00DC7D]" />
          </span>
        </div>

        <h4 className="font-wta-display text-sm sm:text-base font-extrabold leading-snug mb-3">
          {currentQuestion.question}
        </h4>

        <div className="space-y-2">
          {currentQuestion.options.map((optText, idx) => {
            const isChosen = selectedOpt === idx;
            const isRightAnswer = idx === currentQuestion.correctIndex;
            const showSuccess =
              (alreadyClaimed || feedbackState === "correct") && isRightAnswer;
            const showError = feedbackState === "wrong" && isChosen && !isRightAnswer;

            return (
              <button
                key={idx}
                type="button"
                disabled={alreadyClaimed}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3 rounded-2xl border text-xs sm:text-[13px] font-semibold flex items-center justify-between gap-2 mp-btn-tactile ${
                  showSuccess
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold shadow-md"
                    : showError
                    ? "bg-rose-500/20 text-rose-200 border-rose-400/60"
                    : lightMode
                    ? "bg-white hover:bg-[#1E0734]/5 border-[#1E0734]/15 text-[#1E0734]"
                    : "bg-white/8 hover:bg-white/14 border-white/15 text-white"
                }`}
              >
                <span>{optText}</span>
                {showSuccess && <WtaIcon name="check" size={16} strokeWidth={2.8} />}
              </button>
            );
          })}
        </div>

        {(alreadyClaimed || feedbackState) && (
          <div
            className={`mt-3 p-3 rounded-2xl text-xs leading-relaxed flex items-start justify-between gap-3 ${
              feedbackState === "wrong" && !alreadyClaimed
                ? "bg-rose-500/15 text-rose-200 border border-rose-400/30"
                : "bg-[#00DC7D]/15 text-[#00DC7D] border border-[#00DC7D]/35"
            }`}
          >
            <div>
              <strong className="block font-extrabold mb-0.5">
                {alreadyClaimed || feedbackState === "correct"
                  ? `¡Respuesta correcta! Sumaste +${effectiveReward} Gemas.`
                  : "Respuesta incorrecta. ¡Intenta con otra opción!"}
              </strong>
              <span className={lightMode ? "text-[#1E0734]/80" : "text-white/85"}>
                {currentQuestion.explanation}
              </span>
            </div>

            {WEEKLY_TRIVIA_QUESTIONS.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setSelectedOpt(null);
                  setFeedbackState(null);
                  setQuestionIdx((prev) => (prev + 1) % WEEKLY_TRIVIA_QUESTIONS.length);
                }}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[#1E0734] text-[#00DC7D] border border-[#00DC7D]/50 font-bold text-[11px] mp-btn-tactile"
              >
                Siguiente ➔
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// === FIN DEL BLOQUE 4 DE 14 ===

// ============================================================================
// PARTE 5 DE 14: CENTRAL DE RETOS COMPLETA (LIVE TENNIS SCORES WTA), DETECTOR
// DE RETO ENTRANTE POR ID ÚNICO, CONTRAPROPUESTA WHATSAPP, LANZADOR CON SEDE
// PERSONALIZADA LIBRE Y MODO ÁRBITRO OFICIAL ITF/ATP CON CANDADO POR SET
// ============================================================================

// ----------------------------------------------------------------------------
// 1. MODAL DE RETO ENTRANTE DETECTADO POR ID ÚNICO (<IncomingChallengeModal/>)
//    Aparece enfrente con desenfoque iOS cuando el tenista activo recibe un
//    desafío pendiente (challengedId === currentUser.id).
// ----------------------------------------------------------------------------
export function IncomingChallengeModal({
  challenge,
  players = [],
  sedes = [],
  lightMode = false,
  onAcceptChallenge,
  onOpenCounterProposal,
  onDeclineChallenge,
  onClose,
}) {
  if (!challenge) return null;

  const challenger =
    players.find((p) => p.id === challenge.challengerId) || {
      id: challenge.challengerId,
      name: challenge.challengerName || "Tenista del Circuito",
      elo: 2200,
      club: challenge.club || "Country Club Los Huancas",
      avatar: "",
    };

  const challengerCat = getCategoryByElo(challenger.elo);
  const sedeObj = sedes.find((s) => s.name === challenge.club);

  return (
    <WtaModalWrapper
      isOpen={Boolean(challenge)}
      onClose={onClose}
      title="¡Tienes un Reto en Cancha!"
      subtitle="Un jugador del circuito te ha desafiado a un partido oficial."
      badgeText="DESAFÍO RECIBIDO"
      iconName="swords"
      lightMode={lightMode}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Tarjeta Principal del Rival Retador con Aura Esmeralda */}
        <div
          className={`p-4 rounded-3xl border relative overflow-hidden wta-card-aura ${
            lightMode
              ? "bg-white border-[#1E0734]/12 shadow-sm"
              : "bg-gradient-to-br from-[#290C46] via-[#1E0734] to-[#160428] border-[#00DC7D]/45 shadow-lg"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <WtaEmeraldPortrait player={challenger} size="lg" showActionArrow={false} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider">
                  {challengerCat.name}
                </span>
                <span
                  className={`text-xs font-extrabold tabular-nums ${
                    lightMode ? "text-[#00A859]" : "text-[#6EF2B5]"
                  }`}
                >
                  {challenger.elo} pts
                </span>
              </div>

              <h4
                className={`font-wta-condensed text-2xl font-bold uppercase tracking-tight truncate mt-0.5 ${
                  lightMode ? "text-[#1E0734]" : "text-white"
                }`}
              >
                {challenger.name}
              </h4>

              <p
                className={`text-xs truncate ${
                  lightMode ? "text-[#1E0734]/70" : "text-white/70"
                }`}
              >
                {challenger.club} · {challenger.hand || "Diestro"}
              </p>
            </div>
          </div>

          {challenge.message && (
            <div
              className={`mt-3 p-3 rounded-2xl text-xs italic leading-relaxed border ${
                lightMode
                  ? "bg-[#FAF9F5] border-[#1E0734]/10 text-[#1E0734]/85"
                  : "bg-white/8 border-white/12 text-white/90"
              }`}
            >
              “{challenge.message}”
            </div>
          )}
        </div>

        {/* Detalles de Cancha, Fecha/Hora y Acuerdo de Pelotas */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2.5 text-xs ${
            lightMode
              ? "bg-white border-[#1E0734]/10 text-[#1E0734]"
              : "bg-[#1E0734]/90 border-white/12 text-white"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="opacity-70 flex items-center gap-1.5 font-semibold">
              <WtaIcon name="map-pin" size={14} className="text-[#00DC7D]" />
              <span>Sede propuesta:</span>
            </span>
            <span className="font-extrabold text-right flex items-center gap-1.5">
              {sedeObj?.logoAsset && (
                <SmartImage
                  src={sedeObj.logoAsset}
                  alt={challenge.club}
                  className="w-4 h-4 rounded-full object-contain"
                />
              )}
              <span>{challenge.club}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-current/10">
            <span className="opacity-70 flex items-center gap-1.5 font-semibold">
              <WtaIcon name="calendar" size={14} className="text-[#00DC7D]" />
              <span>Fecha y hora:</span>
            </span>
            <span className="font-extrabold text-[#00DC7D]">{challenge.dateText}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-current/10">
            <span className="opacity-70 flex items-center gap-1.5 font-semibold">
              <WtaIcon name="bolt" size={14} className="text-[#F59E0B]" />
              <span>Pelotas:</span>
            </span>
            <span className="font-bold">
              {challenge.ballsAgreement || "Tarro nuevo a medias"}
            </span>
          </div>
        </div>

        {/* Botones de Respuesta Táctil */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("success");
              if (onAcceptChallenge) onAcceptChallenge(challenge.id);
            }}
            className="w-full py-3.5 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg"
          >
            <WtaIcon name="check" size={18} strokeWidth={2.6} />
            <span>Aceptar partido en esta fecha</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                if (onOpenCounterProposal) onOpenCounterProposal(challenge);
              }}
              className={`py-3 px-3 rounded-2xl font-wta-display font-bold text-xs flex items-center justify-center gap-1.5 border mp-btn-tactile ${
                lightMode
                  ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                  : "bg-white/12 hover:bg-white/20 border-white/20 text-white"
              }`}
            >
              <WtaIcon name="clock" size={15} className="text-[#00DC7D]" />
              <span>Cambiar hora / sede</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                if (onDeclineChallenge) onDeclineChallenge(challenge.id);
              }}
              className="py-3 px-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/35 font-wta-display font-bold text-xs flex items-center justify-center gap-1.5 mp-btn-tactile"
            >
              <WtaIcon name="close" size={15} />
              <span>No puedo jugar</span>
            </button>
          </div>
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 2. MODAL DE CONTRAPROPUESTA DE HORARIO Y SEDE (<CounterProposalModal/>)
//    Permite proponer nueva fecha/hora o sede personalizada y abrir WhatsApp.
// ----------------------------------------------------------------------------
export function CounterProposalModal({
  challenge,
  players = [],
  sedes = INITIAL_SEDES,
  lightMode = false,
  onSaveCounterProposal,
  onClose,
}) {
  const [selectedClub, setSelectedClub] = useState(
    challenge?.club || "Country Club Los Huancas"
  );
  const [customVenueText, setCustomVenueText] = useState("");
  const [dayLabel, setDayLabel] = useState("Sábado");
  const [timeSlot, setTimeSlot] = useState("16:00");
  const [ballsOption, setBallsOption] = useState(
    challenge?.ballsAgreement || "Tarro nuevo a medias"
  );
  const [note, setNote] = useState("");

  if (!challenge) return null;

  const rivalPlayer =
    players.find((p) => p.id === challenge.challengerId) ||
    players.find((p) => p.id === challenge.challengedId);

  const isCustomVenue = selectedClub === "SEDE_PERSONALIZADA";
  const finalVenueName = isCustomVenue
    ? customVenueText.trim() || "Cancha acordada entre jugadores"
    : selectedClub;
  const finalDateString = `${dayLabel} · ${timeSlot} h`;

  const handleConfirmCounter = () => {
    triggerHaptic("success");
    if (onSaveCounterProposal) {
      onSaveCounterProposal({
        challengeId: challenge.id,
        newClub: finalVenueName,
        newDateText: finalDateString,
        newBallsAgreement: ballsOption,
        note,
      });
    }

    // Abre WhatsApp con el mensaje listo si el rival tiene número registrado
    const phone = rivalPlayer?.whatsapp || CIRCUIT_CONFIG.adminWhatsApp;
    const textMsg = encodeURIComponent(
      `¡Hola ${rivalPlayer?.firstName || ""}! Vi tu reto en MATCHPOINT. ¿Te parece bien si lo jugamos el *${finalDateString}* en *${finalVenueName}* (${ballsOption})?${
        note ? ` Nota: ${note}` : ""
      }`
    );
    window.open(`https://wa.me/${phone}?text=${textMsg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <WtaModalWrapper
      isOpen={Boolean(challenge)}
      onClose={onClose}
      title="Proponer Otro Horario o Sede"
      subtitle={`Coordina una nueva fecha con ${rivalPlayer?.name || "tu rival"} sin perder el reto.`}
      badgeText="CONTRAPROPUESTA"
      iconName="calendar"
      lightMode={lightMode}
    >
      <div className="space-y-4">
        {/* Selector de Día Rápido */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 opacity-80">
            1. Elige el día que puedes jugar
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              "Hoy",
              "Mañana",
              "Viernes",
              "Sábado",
              "Domingo",
              "Lunes",
              "Martes",
              "Miércoles",
            ].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setDayLabel(d);
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold border mp-btn-tactile ${
                  dayLabel === d
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold shadow-sm"
                    : lightMode
                    ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                    : "bg-white/8 border-white/15 text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Hora */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 opacity-80">
            2. Elige el turno
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {["07:00", "08:30", "10:00", "15:00", "16:30", "18:00", "19:30", "20:30"].map(
              (hr) => (
                <button
                  key={hr}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setTimeSlot(hr);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold tabular-nums border mp-btn-tactile ${
                    timeSlot === hr
                      ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold shadow-sm"
                      : lightMode
                      ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                      : "bg-white/8 border-white/15 text-white"
                  }`}
                >
                  {hr}
                </button>
              )
            )}
          </div>
        </div>

        {/* Selector de Sede Oficial o Sede Personalizada Libre */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 opacity-80">
            3. Sede o cancha
          </label>
          <div className="grid grid-cols-1 gap-2">
            {sedes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setSelectedClub(s.name);
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 mp-btn-tactile ${
                  selectedClub === s.name
                    ? "bg-[#00DC7D]/20 border-[#00DC7D] text-white"
                    : lightMode
                    ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                    : "bg-white/6 border-white/12 text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SmartImage
                    src={s.logoAsset}
                    alt={s.name}
                    className="w-7 h-7 rounded-full object-contain bg-white p-0.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-extrabold truncate ${
                        lightMode ? "text-[#1E0734]" : "text-white"
                      }`}
                    >
                      {s.name}
                    </div>
                    <div className="text-[10px] opacity-70 truncate">{s.scheduleText}</div>
                  </div>
                </div>
                {selectedClub === s.name && (
                  <WtaIcon name="check" size={16} className="text-[#00DC7D]" />
                )}
              </button>
            ))}

            {/* Opción de Sede Personalizada con Campo de Texto Libre */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setSelectedClub("SEDE_PERSONALIZADA");
              }}
              className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 mp-btn-tactile ${
                isCustomVenue
                  ? "bg-[#00DC7D]/20 border-[#00DC7D]"
                  : lightMode
                  ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                  : "bg-white/6 border-white/12 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <WtaIcon name="map-pin" size={16} className="text-[#00DC7D]" />
                <span className="text-xs font-extrabold">
                  Otra cancha / Sede personalizada
                </span>
              </div>
              {isCustomVenue && (
                <WtaIcon name="check" size={16} className="text-[#00DC7D]" />
              )}
            </button>

            {isCustomVenue && (
              <input
                type="text"
                value={customVenueText}
                onChange={(e) => setCustomVenueText(e.target.value)}
                placeholder="Escribe el nombre de la cancha o club..."
                className={`w-full px-3.5 py-2.5 rounded-xl border mp-input-alive ${
                  lightMode
                    ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                    : "bg-[#1E0734] border-white/25 text-white"
                }`}
              />
            )}
          </div>
        </div>

        {/* Nota opcional */}
        <div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Comentario opcional (ej. yo reservo la cancha)..."
            className={`w-full px-3.5 py-2.5 rounded-xl border mp-input-alive ${
              lightMode
                ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                : "bg-[#1E0734] border-white/20 text-white"
            }`}
          />
        </div>

        <button
          type="button"
          onClick={handleConfirmCounter}
          className="w-full py-3.5 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg"
        >
          <WtaIcon name="whatsapp" size={17} />
          <span>Enviar propuesta y avisar por WhatsApp</span>
        </button>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 3. LANZADOR DE NUEVOS DESAFÍOS (<LaunchChallengeModal/>)
//    Con buscador de rival, aviso de partido oficial vs amistoso (> 1,000 pts)
//    y soporte para las 4 Sedes Oficiales o Sede Personalizada con texto libre.
// ----------------------------------------------------------------------------
export function LaunchChallengeModal({
  isOpen,
  onClose,
  currentUser,
  players = [],
  sedes = INITIAL_SEDES,
  preselectedOpponent = null,
  lightMode = false,
  onCreateChallenge,
}) {
  const availableOpponents = useMemo(
    () => players.filter((p) => p.id !== currentUser?.id),
    [players, currentUser?.id]
  );

  const [opponentId, setOpponentId] = useState(
    preselectedOpponent?.id || availableOpponents[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState("Country Club Los Huancas");
  const [customVenueName, setCustomVenueName] = useState("");
  const [selectedDay, setSelectedDay] = useState("Sábado 21 Nov");
  const [selectedHour, setSelectedHour] = useState("17:00");
  const [ballsAgreement, setBallsAgreement] = useState("Tarro nuevo a medias");
  const [matchMode, setMatchMode] = useState("official"); // 'official' | 'friendly'
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (preselectedOpponent?.id) {
      setOpponentId(preselectedOpponent.id);
    }
  }, [preselectedOpponent]);

  if (!isOpen) return null;

  const filteredOpponents = availableOpponents.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.club || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOpponent =
    availableOpponents.find((p) => p.id === opponentId) || availableOpponents[0];
  const eloDiff = Math.abs(
    Number(currentUser?.elo || 1500) - Number(selectedOpponent?.elo || 1500)
  );
  const exceedsOfficialGap = eloDiff > 1000;
  const isCustomVenue = selectedClub === "SEDE_PERSONALIZADA";

  const handleSendChallenge = (e) => {
    e.preventDefault();
    if (!selectedOpponent) return;
    triggerHaptic("hero");

    const finalClub = isCustomVenue
      ? customVenueName.trim() || "Cancha Independiente Huancayo"
      : selectedClub;

    if (onCreateChallenge) {
      onCreateChallenge({
        challengerId: currentUser?.id || "p-pablo",
        challengerName: currentUser?.name || "Pablo Samaniego",
        challengedId: selectedOpponent.id,
        challengedName: selectedOpponent.name,
        club: finalClub,
        dateText: `${selectedDay} · ${selectedHour}`,
        ballsAgreement,
        isFriendly: matchMode === "friendly" || exceedsOfficialGap,
        message:
          message.trim() ||
          `¡Hola ${selectedOpponent.firstName}! Te reto a un partido en ${finalClub}.`,
      });
    }
    onClose();
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Lanzar Reto en Cancha"
      subtitle="Elige a tu rival, selecciona el club o escribe una sede libre y coordina el partido."
      badgeText="NUEVO DESAFÍO"
      iconName="swords"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSendChallenge} className="space-y-4">
        {/* 1. Buscador y Selector Visual del Rival */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 opacity-80">
            1. Selecciona a tu rival
          </label>
          <div className="relative mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tenista por nombre o club..."
              className={`w-full pl-9 pr-3.5 py-2.5 rounded-2xl border mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/15 text-white"
              }`}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00DC7D]">
              <WtaIcon name="search" size={16} />
            </span>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {filteredOpponents.map((opp) => {
              const cat = getCategoryByElo(opp.elo);
              const isSelected = opp.id === selectedOpponent?.id;
              return (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setOpponentId(opp.id);
                  }}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 mp-btn-tactile ${
                    isSelected
                      ? "bg-[#00DC7D]/20 border-[#00DC7D] shadow-sm"
                      : lightMode
                      ? "bg-white border-[#1E0734]/10 text-[#1E0734]"
                      : "bg-white/6 border-white/10 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SmartImage
                      src={opp.avatar}
                      alt={opp.name}
                      isAvatar
                      className="w-10 h-10 rounded-xl object-cover border border-[#00DC7D]/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold truncate">{opp.name}</div>
                      <div className="text-[11px] opacity-70 truncate">
                        {cat.name} · {opp.club}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-wta-condensed text-lg font-bold text-[#00DC7D] tabular-nums">
                      {opp.elo} PTS
                    </div>
                    {opp.rank <= 3 && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#F59E0B] text-[#1E0734]">
                        Top #{opp.rank}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Indicador Claro de Modalidad: Oficial por Puntos vs Amistoso */}
        <div
          className={`p-3 rounded-2xl border text-xs ${
            exceedsOfficialGap
              ? "bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]"
              : "bg-[#00DC7D]/12 border-[#00DC7D]/35 text-[#00DC7D]"
          }`}
        >
          {exceedsOfficialGap ? (
            <p className="font-semibold">
              La diferencia de puntaje con {selectedOpponent?.firstName} es mayor a 1,000
              puntos ({eloDiff} pts). Este encuentro se jugará como{" "}
              <strong className="underline">Partido Amistoso</strong> sin arriesgar puntos
              del ranking.
            </p>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">Modalidad del encuentro:</span>
              <div className="inline-flex rounded-xl p-0.5 bg-[#1E0734] border border-white/15">
                <button
                  type="button"
                  onClick={() => setMatchMode("official")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                    matchMode === "official"
                      ? "bg-[#00DC7D] text-[#1E0734]"
                      : "text-white/75"
                  }`}
                >
                  Por Puntos
                </button>
                <button
                  type="button"
                  onClick={() => setMatchMode("friendly")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                    matchMode === "friendly"
                      ? "bg-[#00DC7D] text-[#1E0734]"
                      : "text-white/75"
                  }`}
                >
                  Amistoso
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Selector de Sede Oficial o Sede Personalizada Libre */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 opacity-80">
            2. ¿Dónde jugarán?
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {sedes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setSelectedClub(s.name);
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 mp-btn-tactile ${
                  selectedClub === s.name
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold shadow-sm"
                    : lightMode
                    ? "bg-white border-[#1E0734]/15 text-[#1E0734] font-semibold"
                    : "bg-white/8 border-white/15 text-white font-semibold"
                }`}
              >
                <SmartImage
                  src={s.logoAsset}
                  alt={s.shortName}
                  className="w-6 h-6 rounded-full object-contain bg-white p-0.5 shrink-0"
                />
                <span className="text-xs truncate">{s.shortName}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setSelectedClub("SEDE_PERSONALIZADA");
            }}
            className={`mt-1.5 w-full p-2.5 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 mp-btn-tactile ${
              isCustomVenue
                ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D]"
                : lightMode
                ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                : "bg-white/8 border-white/15 text-white"
            }`}
          >
            <WtaIcon name="map-pin" size={14} />
            <span>Otra cancha / Sede personalizada (escribir nombre)</span>
          </button>

          {isCustomVenue && (
            <input
              type="text"
              required
              value={customVenueName}
              onChange={(e) => setCustomVenueName(e.target.value)}
              placeholder="Ej. Cancha privada San Carlos, Club Militar..."
              className={`mt-2 w-full px-3.5 py-2.5 rounded-xl border mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/25 text-[#1E0734]"
                  : "bg-[#1E0734] border-[#00DC7D]/60 text-white"
              }`}
            />
          )}
        </div>

        {/* 3. Fecha, Hora y Pelotas */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
              Día propuesto
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border mp-input-alive font-bold ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/20 text-white"
              }`}
            >
              <option value="Hoy">Hoy</option>
              <option value="Mañana">Mañana</option>
              <option value="Viernes 20 Nov">Viernes 20 Nov</option>
              <option value="Sábado 21 Nov">Sábado 21 Nov</option>
              <option value="Domingo 22 Nov">Domingo 22 Nov</option>
              <option value="Lunes 23 Nov">Lunes 23 Nov</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
              Hora
            </label>
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border mp-input-alive font-bold ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/20 text-white"
              }`}
            >
              <option value="07:00">07:00 a. m.</option>
              <option value="08:30">08:30 a. m.</option>
              <option value="10:00">10:00 a. m.</option>
              <option value="15:30">03:30 p. m.</option>
              <option value="17:00">05:00 p. m.</option>
              <option value="18:30">06:30 p. m.</option>
              <option value="20:00">08:00 p. m.</option>
            </select>
          </div>
        </div>

        {/* Acuerdo de Pelotas */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
            Acuerdo de pelotas
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              "Tarro nuevo a medias",
              "Yo llevo tarro nuevo",
              "Pelotas seminuevas (1 uso)",
            ].map((bOpt) => (
              <button
                key={bOpt}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setBallsAgreement(bOpt);
                }}
                className={`p-2 rounded-xl border text-[11px] font-bold text-center mp-btn-tactile ${
                  ballsAgreement === bOpt
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold"
                    : lightMode
                    ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                    : "bg-white/8 border-white/15 text-white"
                }`}
              >
                {bOpt}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-6 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
        >
          <WtaIcon name="swords" size={17} />
          <span>Enviar Reto a {selectedOpponent?.firstName || "Rival"}</span>
        </button>
      </form>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 4. MODO ÁRBITRO OFICIAL ITF/ATP EN VIVO Y CARGA DE RESULTADO
//    (<LiveUmpireAndScoreModal/>)
//    - Tope reglamentario en 6 o 7 games (imposible subir a 8).
//    - Candado por set cerrado (6🔒 | 4).
//    - Tie-Break automático a 7 pts (dif. mínima 2) en 6-6 de Sets 1 y 2.
//    - Super Tie-Break automático a 10 pts (dif. mínima 2) cuando van 1-1 en sets.
// ----------------------------------------------------------------------------
export function LiveUmpireAndScoreModal({
  challenge,
  players = [],
  lightMode = false,
  onConfirmOfficialResult,
  onUpdateLiveChallengeScore,
  onClose,
}) {
  const [modeTab, setModeTab] = useState("umpire"); // 'umpire' | 'quick_form'
  const [setsState, setSetsState] = useState(() => {
    if (challenge?.liveScore?.sets?.length === 3) {
      return challenge.liveScore.sets.map((s) => ({
        a: Number(s.a || 0),
        b: Number(s.b || 0),
        tbA: s.tbA ?? 0,
        tbB: s.tbB ?? 0,
        locked: Boolean(s.locked),
      }));
    }
    return [
      { a: 6, b: 4, tbA: 0, tbB: 0, locked: false },
      { a: 6, b: 3, tbA: 0, tbB: 0, locked: false },
      { a: 0, b: 0, tbA: 0, tbB: 0, locked: false },
    ];
  });
  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [serverSide, setServerSide] = useState("A");
  const [errorMsg, setErrorMsg] = useState("");

  if (!challenge) return null;

  const playerA =
    players.find((p) => p.id === challenge.challengerId) || {
      id: challenge.challengerId,
      name: challenge.challengerName || "Jugador A",
      elo: 2000,
    };
  const playerB =
    players.find((p) => p.id === challenge.challengedId) || {
      id: challenge.challengedId,
      name: challenge.challengedName || "Jugador B",
      elo: 2000,
    };

  // Calcula cuántos sets ha ganado cada uno en los primeros 2 sets
  const isSetFinished = (s, idx) => {
    const a = Number(s.a || 0);
    const b = Number(s.b || 0);
    if (idx === 2) {
      const maxP = Math.max(a, b);
      const minP = Math.min(a, b);
      return maxP >= 10 && maxP - minP >= 2;
    }
    const maxG = Math.max(a, b);
    const minG = Math.min(a, b);
    if (maxG === 6 && maxG - minG >= 2) return true;
    if (maxG === 7 && (minG === 5 || minG === 6)) return true;
    return false;
  };

  const set1Done = isSetFinished(setsState[0], 0);
  const set2Done = isSetFinished(setsState[1], 1);
  const setsWonAfter2 = {
    a:
      (set1Done && setsState[0].a > setsState[0].b ? 1 : 0) +
      (set2Done && setsState[1].a > setsState[1].b ? 1 : 0),
    b:
      (set1Done && setsState[0].b > setsState[0].a ? 1 : 0) +
      (set2Done && setsState[1].b > setsState[1].a ? 1 : 0),
  };
  const needsThirdSetSuperTb = setsWonAfter2.a === 1 && setsWonAfter2.b === 1;

  // Ajusta games o puntos respetando topes reglamentarios ITF/ATP
  const handleScoreStep = (setIndex, side, delta) => {
    triggerHaptic("score");
    setErrorMsg("");

    setSetsState((prev) => {
      const next = prev.map((item) => ({ ...item }));
      const current = next[setIndex];
      if (current.locked) return prev;

      // Si es el 3.er set (Super Tie-Break a 10 pts con diferencia de 2)
      if (setIndex === 2) {
        const nextVal = Math.max(0, Number(current[side] || 0) + delta);
        current[side] = nextVal;
        return next;
      }

      // Sets 1 y 2: tope reglamentario en 6 o 7 games
      const otherSide = side === "a" ? "b" : "a";
      const otherVal = Number(current[otherSide] || 0);
      const maxAllowedForSide = otherVal >= 5 ? 7 : 6;
      const nextVal = Math.min(
        maxAllowedForSide,
        Math.max(0, Number(current[side] || 0) + delta)
      );
      current[side] = nextVal;

      // Si llegan a 7-6 o 6-7, inicializa un Tie-Break válido por defecto (7-5)
      if ((nextVal === 7 && otherVal === 6) || (nextVal === 6 && otherVal === 7)) {
        if (current.a > current.b) {
          current.tbA = Math.max(7, current.tbA || 7);
          current.tbB = Math.min(current.tbA - 2, current.tbB || 5);
        } else {
          current.tbB = Math.max(7, current.tbB || 7);
          current.tbA = Math.min(current.tbB - 2, current.tbA || 5);
        }
      }

      return next;
    });
  };

  const toggleLockSet = (idx) => {
    triggerHaptic("tab");
    setSetsState((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, locked: !s.locked } : s))
    );
  };

  const handleConfirmMatch = () => {
    setErrorMsg("");
    const relevantSets = needsThirdSetSuperTb
      ? setsState.slice(0, 3)
      : setsState.slice(0, 2);

    const validation = validateOfficialTennisScore(relevantSets, true);
    if (!validation.valid) {
      setErrorMsg(validation.reason);
      return;
    }

    triggerHaptic("success");
    if (onConfirmOfficialResult) {
      onConfirmOfficialResult({
        challengeId: challenge.id,
        playerA,
        playerB,
        sets: relevantSets,
        club: challenge.club,
        isFriendly: Boolean(challenge.isFriendly),
      });
    }
  };

  return (
    <WtaModalWrapper
      isOpen={Boolean(challenge)}
      onClose={onClose}
      title="Marcador Oficial en Cancha"
      subtitle={`${challenge.club} · ${
        challenge.isFriendly ? "Partido Amistoso" : "Partido Oficial por Puntos"
      }`}
      badgeText="MODO ÁRBITRO ITF / ATP"
      iconName="trophy"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        {/* Selector de Modo: Tablero en Vivo vs Carga Directa */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#1E0734] border border-white/15">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setModeTab("umpire");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-wta-display font-extrabold transition-all ${
              modeTab === "umpire"
                ? "bg-[#00DC7D] text-[#1E0734] shadow-md"
                : "text-white/75 hover:text-white"
            }`}
          >
            Tablero en Cancha
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setModeTab("quick_form");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-wta-display font-extrabold transition-all ${
              modeTab === "quick_form"
                ? "bg-[#00DC7D] text-[#1E0734] shadow-md"
                : "text-white/75 hover:text-white"
            }`}
          >
            Subir Resultado Final
          </button>
        </div>

        {/* Tablero de Marcador Estilo Grand Slam / WTA con Candado por Set */}
        <div className="rounded-3xl p-4 bg-gradient-to-b from-[#1E0734] to-[#140424] text-white border border-[#00DC7D]/40 shadow-xl space-y-3">
          {/* Cabecera del Tablero */}
          <div className="flex items-center justify-between text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#6EF2B5] pb-2 border-b border-white/10">
            <span>JUGADORES EN CANCHA</span>
            <div className="flex items-center gap-3 pr-1">
              <span>SET 1</span>
              <span>SET 2</span>
              {needsThirdSetSuperTb && <span className="text-[#F59E0B]">SUPER TB</span>}
            </div>
          </div>

          {/* Fila Jugador A */}
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => setServerSide("A")}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            >
              <SmartImage
                src={playerA.avatar}
                alt={playerA.name}
                isAvatar
                className="w-9 h-9 rounded-xl object-cover border border-[#00DC7D]"
              />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{playerA.name}</span>
                  {serverSide === "A" && (
                    <SmartImage
                      src={ASSETS.pelotaVoltAzul}
                      alt="Saque"
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                  )}
                </div>
                <span className="text-[10px] text-white/60">{playerA.elo} pts</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {[0, 1, ...(needsThirdSetSuperTb ? [2] : [])].map((sIdx) => {
                const s = setsState[sIdx];
                const isWinnerOfSet = isSetFinished(s, sIdx) && s.a > s.b;
                return (
                  <div
                    key={sIdx}
                    onClick={() => setActiveSetIdx(sIdx)}
                    className={`w-10 h-10 rounded-xl font-wta-condensed text-xl font-bold flex items-center justify-center border cursor-pointer tabular-nums ${
                      activeSetIdx === sIdx
                        ? "border-[#00DC7D] bg-[#00DC7D]/20 text-[#00DC7D]"
                        : isWinnerOfSet
                        ? "border-white/25 bg-white/12 text-[#00DC7D]"
                        : "border-white/12 bg-white/5 text-white/80"
                    }`}
                  >
                    {s.a}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fila Jugador B */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <div
              onClick={() => setServerSide("B")}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            >
              <SmartImage
                src={playerB.avatar}
                alt={playerB.name}
                isAvatar
                className="w-9 h-9 rounded-xl object-cover border border-white/30"
              />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{playerB.name}</span>
                  {serverSide === "B" && (
                    <SmartImage
                      src={ASSETS.pelotaVoltAzul}
                      alt="Saque"
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                  )}
                </div>
                <span className="text-[10px] text-white/60">{playerB.elo} pts</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {[0, 1, ...(needsThirdSetSuperTb ? [2] : [])].map((sIdx) => {
                const s = setsState[sIdx];
                const isWinnerOfSet = isSetFinished(s, sIdx) && s.b > s.a;
                return (
                  <div
                    key={sIdx}
                    onClick={() => setActiveSetIdx(sIdx)}
                    className={`w-10 h-10 rounded-xl font-wta-condensed text-xl font-bold flex items-center justify-center border cursor-pointer tabular-nums ${
                      activeSetIdx === sIdx
                        ? "border-[#00DC7D] bg-[#00DC7D]/20 text-[#00DC7D]"
                        : isWinnerOfSet
                        ? "border-white/25 bg-white/12 text-[#00DC7D]"
                        : "border-white/12 bg-white/5 text-white/80"
                    }`}
                  >
                    {s.b}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Controles Táctiles por Set con Candado de Seguridad */}
        <div className="space-y-2.5">
          {[0, 1, ...(needsThirdSetSuperTb ? [2] : [])].map((sIdx) => {
            const s = setsState[sIdx];
            const isSuperTb = sIdx === 2;
            const isTieBreak66 =
              !isSuperTb &&
              ((s.a === 7 && s.b === 6) ||
                (s.a === 6 && s.b === 7) ||
                (s.a === 6 && s.b === 6));

            return (
              <div
                key={sIdx}
                className={`p-3 rounded-2xl border transition-all ${
                  lightMode
                    ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                    : "bg-white/6 border-white/12 text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
                      {isSuperTb ? "3.er Set · Super Tie-Break (a 10 pts)" : `Set ${sIdx + 1}`}
                    </span>
                    {s.locked && (
                      <span className="text-[11px] font-bold text-[#F59E0B] flex items-center gap-1">
                        <WtaIcon name="lock" size={12} /> Set cerrado
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleLockSet(sIdx)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 border mp-btn-tactile ${
                      s.locked
                        ? "bg-[#F59E0B]/20 border-[#F59E0B]/50 text-[#F59E0B]"
                        : "bg-white/10 border-white/15 opacity-80"
                    }`}
                  >
                    <WtaIcon name={s.locked ? "lock" : "unlock"} size={12} />
                    <span>{s.locked ? "Desbloquear" : "Fijar Set"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Control Jugador A */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/10">
                    <span className="text-xs font-bold truncate pr-1">
                      {playerA.firstName || playerA.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={s.locked}
                        onClick={() => handleScoreStep(sIdx, "a", -1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 font-extrabold text-sm flex items-center justify-center disabled:opacity-40 mp-btn-tactile"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-wta-condensed text-lg font-bold text-[#00DC7D] tabular-nums">
                        {s.a}
                      </span>
                      <button
                        type="button"
                        disabled={s.locked}
                        onClick={() => handleScoreStep(sIdx, "a", 1)}
                        className="w-7 h-7 rounded-lg bg-[#00DC7D] text-[#1E0734] font-extrabold text-sm flex items-center justify-center disabled:opacity-40 mp-btn-tactile"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Control Jugador B */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/10">
                    <span className="text-xs font-bold truncate pr-1">
                      {playerB.firstName || playerB.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={s.locked}
                        onClick={() => handleScoreStep(sIdx, "b", -1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 font-extrabold text-sm flex items-center justify-center disabled:opacity-40 mp-btn-tactile"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-wta-condensed text-lg font-bold text-[#00DC7D] tabular-nums">
                        {s.b}
                      </span>
                      <button
                        type="button"
                        disabled={s.locked}
                        onClick={() => handleScoreStep(sIdx, "b", 1)}
                        className="w-7 h-7 rounded-lg bg-[#00DC7D] text-[#1E0734] font-extrabold text-sm flex items-center justify-center disabled:opacity-40 mp-btn-tactile"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desempate Tie-Break a 7 puntos cuando el set está 7-6 o 6-7 */}
                {isTieBreak66 && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#6EF2B5] font-bold">
                      Puntos del Tie-Break (mín. 7 con dif. de 2):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={s.tbA ?? 7}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSetsState((prev) =>
                            prev.map((item, idx) =>
                              idx === sIdx ? { ...item, tbA: val } : item
                            )
                          );
                        }}
                        className="w-12 py-1 text-center rounded-lg bg-[#1E0734] border border-[#00DC7D]/50 text-white font-bold"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={s.tbB ?? 5}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSetsState((prev) =>
                            prev.map((item, idx) =>
                              idx === sIdx ? { ...item, tbB: val } : item
                            )
                          );
                        }}
                        className="w-12 py-1 text-center rounded-lg bg-[#1E0734] border border-[#00DC7D]/50 text-white font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {onUpdateLiveChallengeScore && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onUpdateLiveChallengeScore(challenge.id, {
                  currentSet: needsThirdSetSuperTb ? 3 : 2,
                  sets: setsState,
                  serverSide,
                });
                onClose();
              }}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-white/12 hover:bg-white/20 text-white border border-white/20 font-wta-display font-bold text-xs mp-btn-tactile"
            >
              Guardar avance en vivo
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmMatch}
            className="flex-1 py-3.5 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xl"
          >
            <WtaIcon name="check" size={17} strokeWidth={2.6} />
            <span>Confirmar Marcador Oficial</span>
          </button>
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 5. VISTA PRINCIPAL 1: CENTRAL DE RETOS (<ChallengesCenterView/>)
//    Integra Hero Asimétrico 65/35, Stories 9:16, Cartelera LIVE TENNIS SCORES
//    con el ganador en Verde Esmeralda (◀), Clásicos 50/50 y Trivia Semanal.
// ----------------------------------------------------------------------------
export function ChallengesCenterView({
  currentUser,
  players = [],
  challenges = [],
  matches = [],
  sedes = INITIAL_SEDES,
  tournaments = [],
  stories = INITIAL_STORIES_9_16,
  sponsors = INITIAL_SPONSORS,
  answeredTriviaIds = [],
  lightMode = false,
  onOpenLaunchChallenge,
  onOpenLiveUmpire,
  onOpenAcceptIncoming,
  onOpenCounterProposal,
  onOpenStoryPoster,
  onOpenH2HWithPlayers,
  onSelectPlayerProfile,
  onNavigateTab,
  onOpenMasterTop8,
  onClaimTriviaGems,
}) {
  const [scoreFilter, setScoreFilter] = useState("all"); // 'all' | 'live' | 'scheduled' | 'finished'

  const liveChallenges = useMemo(
    () => challenges.filter((c) => c.status === "in_play"),
    [challenges]
  );
  const scheduledChallenges = useMemo(
    () => challenges.filter((c) => c.status === "accepted" || c.status === "pending"),
    [challenges]
  );

  // Detecta si el tenista actual tiene retos pendientes dirigidos a su ID único
  const incomingForCurrentUser = useMemo(
    () =>
      challenges.filter(
        (c) => c.status === "pending" && c.challengedId === currentUser?.id
      ),
    [challenges, currentUser?.id]
  );

  return (
    <div className="space-y-3 mp-view-enter">
      {/* Banner reactivo si tienes un reto pendiente de respuesta */}
      {incomingForCurrentUser.length > 0 && (
        <div className="px-3.5 sm:px-5 pt-2">
          <div
            onClick={() => {
              triggerHaptic("hero");
              if (onOpenAcceptIncoming) onOpenAcceptIncoming(incomingForCurrentUser[0]);
            }}
            className="p-3.5 rounded-3xl bg-gradient-to-r from-[#00A859] via-[#00DC7D] to-[#6EF2B5] text-[#1E0734] shadow-lg flex items-center justify-between gap-3 cursor-pointer mp-challenge-ripple"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#1E0734] text-[#00DC7D] flex items-center justify-center shrink-0">
                <WtaIcon name="swords" size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-wta-display font-black uppercase tracking-wider block">
                  DESAFÍO PENDIENTE PARA TI
                </span>
                <p className="text-xs sm:text-sm font-extrabold truncate">
                  {incomingForCurrentUser[0].challengerName} te retó en{" "}
                  {incomingForCurrentUser[0].club}
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-xs font-extrabold shrink-0">
              Responder ➔
            </span>
          </div>
        </div>
      )}

      {/* 1. Portada Asimétrica 65/35 + En Cancha Ahora + Reloj y Clima en Vivo */}
      <WtaAsymmetricHeroSection
        liveChallenge={liveChallenges[0] || scheduledChallenges[0]}
        tournaments={tournaments}
        sponsors={sponsors}
        lightMode={lightMode}
        onOpenLiveMatch={(ch) => onOpenLiveUmpire && onOpenLiveUmpire(ch)}
        onNavigateTab={onNavigateTab}
        onOpenMasterTop8={onOpenMasterTop8}
        onOpenLaunchChallenge={() => onOpenLaunchChallenge && onOpenLaunchChallenge(null)}
      />

      {/* 2. Bloque de Marcadores en Vivo y Cartelera (Estilo LIVE TENNIS SCORES WTA) */}
      <section className="px-3.5 sm:px-5 py-1">
        <div
          className={`rounded-3xl overflow-hidden border shadow-lg ${
            lightMode
              ? "bg-white border-[#1E0734]/10"
              : "bg-[#23083C] border-white/12"
          }`}
        >
          {/* Cabecera Degradada Verde Menta / Esmeralda Estilo WTA */}
          <div
            className="p-4 sm:p-5 text-[#1E0734]"
            style={{
              background:
                "linear-gradient(135deg, #00DC7D 0%, #6EF2B5 55%, #D8FCEB 100%)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
                    CARTELERA OFICIAL
                  </span>
                  {sponsors?.titleSponsor?.active && (
                    <span className="text-[11px] font-extrabold text-[#1E0734]/80">
                      | {sponsors.titleSponsor.name}
                    </span>
                  )}
                </div>
                <h2 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#1E0734] mt-1">
                  MARCADORES Y RETOS EN CANCHA
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("hero");
                  if (onOpenLaunchChallenge) onOpenLaunchChallenge(null);
                }}
                className="px-4 py-2.5 rounded-full bg-[#1E0734] hover:bg-[#290C46] text-[#00DC7D] font-wta-display font-extrabold text-xs flex items-center gap-2 shadow-md mp-btn-tactile"
              >
                <WtaIcon name="swords" size={15} />
                <span>Lanzar Reto</span>
              </button>
            </div>

            {/* Píldoras de Filtro Magnéticas */}
            <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: "all", label: "Todos los partidos" },
                { id: "live", label: `En juego (${liveChallenges.length})` },
                { id: "scheduled", label: `Programados (${scheduledChallenges.length})` },
                { id: "finished", label: `Finalizados (${matches.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setScoreFilter(tab.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-wta-display font-extrabold shrink-0 transition-all ${
                    scoreFilter === tab.id
                      ? "bg-[#1E0734] text-[#00DC7D] shadow-sm scale-[1.02]"
                      : "bg-white/75 text-[#1E0734] hover:bg-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Partidos En Juego, Programados y Recientes */}
          <div className="p-3.5 sm:p-4 space-y-3">
            {/* A. Partidos En Juego y Programados */}
            {(scoreFilter === "all" ||
              scoreFilter === "live" ||
              scoreFilter === "scheduled") &&
              challenges
                .filter((ch) => {
                  if (scoreFilter === "live") return ch.status === "in_play";
                  if (scoreFilter === "scheduled")
                    return ch.status === "accepted" || ch.status === "pending";
                  return true;
                })
                .map((ch) => {
                  const pA = players.find((p) => p.id === ch.challengerId);
                  const pB = players.find((p) => p.id === ch.challengedId);
                  const sedeInfo = sedes.find((s) => s.name === ch.club);
                  const isLive = ch.status === "in_play";
                  const isPendingForMe =
                    ch.status === "pending" && ch.challengedId === currentUser?.id;

                  return (
                    <div
                      key={ch.id}
                      className={`rounded-2xl border overflow-hidden wta-card-aura ${
                        lightMode
                          ? "bg-[#FAF9F5] border-[#1E0734]/12 text-[#1E0734]"
                          : "bg-[#1E0734] border-white/12 text-white"
                      }`}
                    >
                      {/* Barra Superior del Partido: Club + Superficie ARCILLA */}
                      <div
                        className={`px-3.5 py-2 flex items-center justify-between gap-2 border-b ${
                          lightMode
                            ? "bg-white border-[#1E0734]/10"
                            : "bg-[#290C46] border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {sedeInfo?.logoAsset ? (
                            <SmartImage
                              src={sedeInfo.logoAsset}
                              alt={ch.club}
                              className="w-5 h-5 rounded-full object-contain bg-white p-0.5 shrink-0"
                            />
                          ) : (
                            <WtaIcon
                              name="map-pin"
                              size={14}
                              className="text-[#00DC7D]"
                            />
                          )}
                          <span className="text-xs font-extrabold truncate">
                            {ch.club}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-wta-display font-black uppercase ${
                              isLive
                                ? "bg-[#00DC7D] text-[#1E0734]"
                                : ch.status === "accepted"
                                ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40"
                                : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40"
                            }`}
                          >
                            {isLive
                              ? "En juego ahora"
                              : ch.status === "accepted"
                              ? "Partido listo"
                              : "Por confirmar"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#C85A32] text-white text-[9px] font-extrabold uppercase">
                            ARCILLA
                          </span>
                        </div>
                      </div>

                      {/* Cuerpo del Enfrentamiento */}
                      <div className="p-3.5 space-y-2.5">
                        {/* Jugador A */}
                        <div className="flex items-center justify-between gap-2">
                          <div
                            onClick={() =>
                              pA && onSelectPlayerProfile && onSelectPlayerProfile(pA)
                            }
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          >
                            <SmartImage
                              src={pA?.avatar}
                              alt={ch.challengerName}
                              isAvatar
                              className="w-8 h-8 rounded-xl object-cover border border-[#00DC7D]/60 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs sm:text-sm font-extrabold block truncate">
                                {ch.challengerName}
                              </span>
                              <span className="text-[10px] opacity-65">
                                {pA ? `${getCategoryByElo(pA.elo).name} · ${pA.elo} pts` : ""}
                              </span>
                            </div>
                          </div>

                          {isLive && ch.liveScore?.sets && (
                            <div className="flex items-center gap-2 font-wta-condensed text-lg font-bold tabular-nums">
                              {ch.liveScore.sets.slice(0, 2).map((s, idx) => (
                                <span
                                  key={idx}
                                  className={
                                    s.a > s.b ? "text-[#00DC7D]" : "opacity-65"
                                  }
                                >
                                  {s.a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Jugador B */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-current/10">
                          <div
                            onClick={() =>
                              pB && onSelectPlayerProfile && onSelectPlayerProfile(pB)
                            }
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          >
                            <SmartImage
                              src={pB?.avatar}
                              alt={ch.challengedName}
                              isAvatar
                              className="w-8 h-8 rounded-xl object-cover border border-white/25 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs sm:text-sm font-extrabold block truncate">
                                {ch.challengedName}
                              </span>
                              <span className="text-[10px] opacity-65">
                                {pB ? `${getCategoryByElo(pB.elo).name} · ${pB.elo} pts` : ""}
                              </span>
                            </div>
                          </div>

                          {isLive && ch.liveScore?.sets && (
                            <div className="flex items-center gap-2 font-wta-condensed text-lg font-bold tabular-nums">
                              {ch.liveScore.sets.slice(0, 2).map((s, idx) => (
                                <span
                                  key={idx}
                                  className={
                                    s.b > s.a ? "text-[#00DC7D]" : "opacity-65"
                                  }
                                >
                                  {s.b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pie de Acciones del Reto */}
                        <div className="pt-2.5 border-t border-current/10 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold opacity-75 flex items-center gap-1">
                            <WtaIcon
                              name="clock"
                              size={13}
                              className="text-[#00DC7D]"
                            />
                            <span>{ch.dateText}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isPendingForMe ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenAcceptIncoming && onOpenAcceptIncoming(ch)
                                }
                                className="px-3.5 py-1.5 rounded-xl mp-btn-emerald text-xs font-extrabold"
                              >
                                Responder reto
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenCounterProposal && onOpenCounterProposal(ch)
                                  }
                                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold border border-current/15 mp-btn-tactile"
                                >
                                  Cambiar hora
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenLiveUmpire && onOpenLiveUmpire(ch)
                                  }
                                  className="px-3.5 py-1.5 rounded-xl mp-btn-emerald text-xs font-extrabold flex items-center gap-1"
                                >
                                  <WtaIcon name="trophy" size={13} />
                                  <span>Subir resultado</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

            {/* B. Partidos Finalizados con el Ganador en Verde Esmeralda y Triángulo ◀ */}
            {(scoreFilter === "all" || scoreFilter === "finished") &&
              matches.map((m) => {
                const winnerIsA = m.winnerId === m.playerAId;
                const pA = players.find((p) => p.id === m.playerAId);
                const pB = players.find((p) => p.id === m.playerBId);

                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl border overflow-hidden wta-card-aura ${
                      lightMode
                        ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                        : "bg-[#1E0734] border-white/12 text-white"
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2 flex items-center justify-between text-[11px] font-bold border-b ${
                        lightMode
                          ? "bg-[#FAF9F5] border-[#1E0734]/10"
                          : "bg-[#290C46]/70 border-white/10"
                      }`}
                    >
                      <span className="truncate">
                        {m.roundLabel || "Reto Oficial"} · {m.club}
                      </span>
                      <span className="text-[#00DC7D] shrink-0">Finalizado</span>
                    </div>

                    <div className="p-3.5 space-y-2">
                      {/* Fila Jugador A */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() =>
                            pA && onSelectPlayerProfile && onSelectPlayerProfile(pA)
                          }
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                        >
                          <SmartImage
                            src={pA?.avatar}
                            alt={m.playerAName}
                            isAvatar
                            className="w-8 h-8 rounded-xl object-cover shrink-0"
                          />
                          <span
                            className={`text-xs sm:text-sm truncate ${
                              winnerIsA
                                ? "font-extrabold text-[#00DC7D]"
                                : "font-semibold opacity-75"
                            }`}
                          >
                            {m.playerAName}
                          </span>
                          {winnerIsA && (
                            <span className="text-[#00DC7D] text-xs font-black">◀</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 font-wta-condensed text-lg font-bold tabular-nums">
                          {Array.isArray(m.sets) ? (
                            m.sets.map((s, idx) => (
                              <span
                                key={idx}
                                className={
                                  s.a > s.b ? "text-[#00DC7D]" : "opacity-60"
                                }
                              >
                                {s.a}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#00DC7D]">{m.score}</span>
                          )}
                        </div>
                      </div>

                      {/* Fila Jugador B */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-current/10">
                        <div
                          onClick={() =>
                            pB && onSelectPlayerProfile && onSelectPlayerProfile(pB)
                          }
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                        >
                          <SmartImage
                            src={pB?.avatar}
                            alt={m.playerBName}
                            isAvatar
                            className="w-8 h-8 rounded-xl object-cover shrink-0"
                          />
                          <span
                            className={`text-xs sm:text-sm truncate ${
                              !winnerIsA
                                ? "font-extrabold text-[#00DC7D]"
                                : "font-semibold opacity-75"
                            }`}
                          >
                            {m.playerBName}
                          </span>
                          {!winnerIsA && (
                            <span className="text-[#00DC7D] text-xs font-black">◀</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 font-wta-condensed text-lg font-bold tabular-nums">
                          {Array.isArray(m.sets) ? (
                            m.sets.map((s, idx) => (
                              <span
                                key={idx}
                                className={
                                  s.b > s.a ? "text-[#00DC7D]" : "opacity-60"
                                }
                              >
                                {s.b}
                              </span>
                            ))
                          ) : null}
                        </div>
                      </div>

                      {/* Pie de partido finalizado */}
                      <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                        <span className="opacity-65">
                          {m.date} {m.durationText ? `· Duración ${m.durationText}` : ""}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenH2HWithPlayers && onOpenH2HWithPlayers(pA, pB)
                            }
                            className="font-bold text-[#00DC7D] hover:underline"
                          >
                            Ver H2H
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenStoryPoster &&
                              onOpenStoryPoster({
                                winnerName: m.winnerName,
                                loserName: winnerIsA ? m.playerBName : m.playerAName,
                                scoreText: m.score,
                                club: m.club,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#00DC7D]/15 text-[#00DC7D] font-extrabold flex items-center gap-1"
                          >
                            <WtaIcon name="share" size={12} />
                            <span>Story 9:16</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* 3. Carrusel Vertical Stories 9:16 con Visor Interactivo */}
      <WtaStories916Carousel
        stories={stories}
        players={players}
        lightMode={lightMode}
        onSelectPlayerProfile={onSelectPlayerProfile}
        onOpenStoryPoster={onOpenStoryPoster}
        onOpenH2HWithPlayers={onOpenH2HWithPlayers}
      />

      {/* 4. Clásicos del Circuito Divididos 50/50 (Rivalry Rewind) */}
      <WtaRivalryRewindSection
        players={players}
        lightMode={lightMode}
        onOpenH2HWithPlayers={onOpenH2HWithPlayers}
      />

      {/* 5. Trivia Semanal para Ganar Gemas por Conocimiento */}
      <WeeklyTriviaGemsWidget
        currentUser={currentUser}
        answeredTriviaIds={answeredTriviaIds}
        onClaimTriviaGems={onClaimTriviaGems}
        lightMode={lightMode}
      />
    </div>
  );
}

// === FIN DEL BLOQUE 5 DE 14 ===

// ============================================================================
// PARTE 6 DE 14: VISTA 2 — RANKING OFICIAL ESTILO WTA (NOMBRES COMPLETOS EN
// 1 LÍNEA SIN CORTES, HALO EN TU FILA, CORTE AL PUESTO #8 DEL MASTER TOP 8,
// ESCALA DE CATEGORÍAS Y MODAL DE FICHA COMPLETA DE JUGADOR)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. MODAL DE ESCALA OFICIAL DE CATEGORÍAS Y PISOS PROTEGIDOS
//    (<CategoryLadderInfoModal/>)
//    Explica visualmente los rangos desde 5ª P hasta 2ª Libre y los pisos
//    de seguridad sin usar jerga técnica.
// ----------------------------------------------------------------------------
export function CategoryLadderInfoModal({
  isOpen,
  onClose,
  currentUser,
  lightMode = false,
}) {
  if (!isOpen) return null;

  const userElo = Number(currentUser?.elo || 1500);
  const userCat = getCategoryByElo(userElo);

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Escala Oficial de Categorías"
      subtitle="Conoce los puntajes de cada división y los pisos de protección alcanzados en cancha."
      badgeText="DIVISIONES DEL CIRCUITO"
      iconName="ranking"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-3">
        {/* Resumen del nivel actual del jugador */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
              : "bg-[#1E0734] border-[#00DC7D]/40 text-white"
          }`}
        >
          <div>
            <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
              TU UBICACIÓN ACTUAL
            </span>
            <div className="font-wta-condensed text-2xl font-bold uppercase mt-0.5">
              {userCat.fullName} · {userElo.toLocaleString()} PTS
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#00DC7D] text-[#1E0734] font-wta-display font-black text-xs">
            {userCat.name}
          </span>
        </div>

        {/* Lista de las 6 Categorías Oficiales */}
        <div className="space-y-2">
          {CATEGORY_LADDER.slice()
            .reverse()
            .map((cat) => {
              const isUserHere = cat.id === userCat.id;
              return (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isUserHere
                      ? "border-2 border-[#00DC7D] bg-[#00DC7D]/12 shadow-md"
                      : lightMode
                      ? "bg-white border-[#1E0734]/10 text-[#1E0734]"
                      : "bg-white/6 border-white/10 text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-wta-display font-black uppercase"
                        style={{
                          backgroundColor: cat.badgeColor,
                          color: "#1E0734",
                        }}
                      >
                        {cat.name}
                      </span>
                      <span className="font-wta-display font-extrabold text-xs sm:text-sm">
                        {cat.fullName}
                      </span>
                    </div>

                    <span className="font-wta-condensed text-base sm:text-lg font-bold text-[#00DC7D] tabular-nums">
                      {cat.maxElo >= 9000
                        ? `${cat.minElo.toLocaleString()}+ PTS`
                        : `${cat.minElo.toLocaleString()} – ${cat.maxElo.toLocaleString()} PTS`}
                    </span>
                  </div>

                  <p
                    className={`text-xs leading-relaxed ${
                      lightMode ? "text-[#1E0734]/75" : "text-white/75"
                    }`}
                  >
                    {cat.description}
                  </p>

                  <div className="mt-2 pt-2 border-t border-current/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold opacity-80">
                      Piso asegurado de categoría:{" "}
                      <strong className="text-[#00DC7D]">
                        {cat.floorElo.toLocaleString()} pts
                      </strong>
                    </span>
                    {cat.checkpointElo && (
                      <span className="px-2 py-0.5 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] font-extrabold">
                        Escalón seguro en {cat.checkpointElo.toLocaleString()} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 2. MODAL DE FICHA COMPLETA DE JUGADOR DESDE EL RANKING
//    (<PublicPlayerProfileModal/>)
//    Homogeneizado al 100% con la vista principal "Mi Perfil":
//    - Cabecera Hero con el escenario Grand Slam del jugador.
//    - 4 tarjetas simétricas de métricas (sin mostrar llama si victorias = 0).
//    - Termómetro monocromático con la pelota 3D en la punta móvil.
//    - Privacidad de WhatsApp respetada (Ley N° 29733).
//    - Últimos partidos con el ganador en Verde Esmeralda y triángulo ◀.
// ----------------------------------------------------------------------------
export function PublicPlayerProfileModal({
  player,
  currentUser,
  matches = [],
  challenges = [],
  lightMode = false,
  onClose,
  onChallengePlayer,
  onCompareH2H,
  onOpenStoryPoster,
}) {
  if (!player) return null;

  const isMe = player.id === currentUser?.id;
  const catInfo = getCategoryProgress(player.elo);
  const totalMatches = Number(player.wins || 0) + Number(player.losses || 0);
  const winRate =
    totalMatches > 0 ? Math.round((Number(player.wins || 0) / totalMatches) * 100) : 0;
  const hasActiveStreak = Number(player.wins || 0) > 0 && Number(player.streak || 0) > 0;
  const inTrialMatches = Number(player.matchesPlayed || 0) < 5;

  const surfaceTheme =
    GRAND_SLAM_SURFACES.find((s) => s.id === player.surfaceThemeId) ||
    GRAND_SLAM_SURFACES[0];

  const activeBadge =
    OFFICIAL_PROFILE_BADGES.find((b) => b.id === player.activeBadgeId) || null;

  // Verifica si el usuario actual tiene un reto aceptado o en curso con este jugador
  // para respetar la configuración de privacidad del teléfono (Ley N° 29733)
  const hasAcceptedChallengeTogether = useMemo(() => {
    if (isMe) return true;
    return challenges.some(
      (c) =>
        (c.status === "accepted" || c.status === "in_play") &&
        ((c.challengerId === currentUser?.id && c.challengedId === player.id) ||
          (c.challengerId === player.id && c.challengedId === currentUser?.id))
    );
  }, [challenges, currentUser?.id, player.id, isMe]);

  const canSeeWhatsApp =
    isMe ||
    player.whatsappPrivacy === "public" ||
    hasAcceptedChallengeTogether;

  const playerMatches = useMemo(
    () =>
      matches.filter(
        (m) => m.playerAId === player.id || m.playerBId === player.id
      ),
    [matches, player.id]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-3xl overflow-hidden shadow-[0_24px_65px_rgba(0,0,0,0.75)] border mp-modal-sheet ${
          lightMode
            ? "bg-[#FAF9F5] text-[#1E0734] border-[#1E0734]/15"
            : "bg-[#1E0734] text-white border-[#00DC7D]/40"
        }`}
      >
        {/* Botón flotante de cierre */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (onClose) onClose();
          }}
          aria-label="Cerrar ficha"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/25 flex items-center justify-center mp-close-btn"
        >
          <WtaIcon name="close" size={18} />
        </button>

        {/* Contenedor Scrolleable de la Ficha Completa */}
        <div className="flex-1 overflow-y-auto overscroll-contain space-y-4 pb-5">
          {/* 1. CABECERA HERO ESTILO ELENA RYBAKINA (wtatennis.com) */}
          <div
            className="relative min-h-[268px] sm:min-h-[290px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden"
            style={{ background: surfaceTheme.fallbackGradient }}
          >
            {/* Escenario Grand Slam de Fondo */}
            <SmartImage
              src={surfaceTheme.bgAsset}
              alt={surfaceTheme.name}
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(30,7,52,0.45) 0%, rgba(30,7,52,0.18) 38%, rgba(30,7,52,0.92) 85%, #1E0734 100%)",
              }}
            />

            {/* Silueta / Retrato Grande del Jugador a la Derecha */}
            <div className="absolute right-2 bottom-0 w-44 sm:w-52 h-56 sm:h-64 pointer-events-none select-none z-10 flex items-end justify-center">
              <SmartImage
                src={player.cutoutAvatar || player.avatar}
                alt={player.name}
                isAvatar
                className="w-full h-full object-cover object-top rounded-t-3xl shadow-2xl border-t-2 border-x-2 border-[#00DC7D]/50"
              />
            </div>

            {/* Fila Superior: Puesto Oficial + Superficie Elegida */}
            <div className="relative z-20 flex items-center gap-2 pr-10">
              <span className="px-3 py-1 rounded-full bg-[#00DC7D] text-[#1E0734] font-wta-display font-black text-xs uppercase tracking-wider shadow-md">
                PUESTO #{player.rank}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/45 text-white border border-white/20 text-[10px] font-wta-display font-extrabold uppercase tracking-wider backdrop-blur-md">
                {surfaceTheme.surfaceLabel}
              </span>
              {player.age >= 40 && (
                <span className="px-2.5 py-1 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
                  +40 MASTER
                </span>
              )}
            </div>

            {/* Nombre Apilado en Condensada + Club + Distintivo Activo */}
            <div className="relative z-20 mt-14 max-w-[62%]">
              {activeBadge && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1E0734]/90 border border-[#00DC7D]/60 text-[#00DC7D] text-[10px] font-extrabold mb-1.5 shadow-sm">
                  <SmartImage
                    src={activeBadge.asset}
                    alt={activeBadge.shortLabel}
                    className="w-3.5 h-3.5 object-contain"
                  />
                  <span>{activeBadge.shortLabel}</span>
                </div>
              )}

              <div className="font-wta-condensed text-2xl sm:text-3xl font-bold text-white uppercase leading-none tracking-tight">
                {player.firstName || player.name.split(" ")[0]}
              </div>
              <div className="font-wta-condensed text-3xl sm:text-4xl font-bold text-[#00DC7D] uppercase leading-none tracking-tight mt-0.5">
                {player.lastName || player.name.split(" ").slice(1).join(" ")}
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-xs text-white/90 font-bold">
                {!player.individualMode && player.clubLogo && (
                  <SmartImage
                    src={player.clubLogo}
                    alt={player.club}
                    className="w-5 h-5 rounded-full object-contain bg-white p-0.5 shrink-0"
                  />
                )}
                <span className="truncate">
                  {player.individualMode
                    ? "Jugador Independiente · Huancayo"
                    : player.club}
                </span>
              </div>

              {inTrialMatches && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/50 text-[#38BDF8] text-[10px] font-extrabold">
                  <span>Partidos de prueba ({player.matchesPlayed || 0} de 5)</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. LAS 4 TARJETAS SIMÉTRICAS DE ESTADÍSTICAS (ALINEADAS AL MILÍMETRO) */}
          <div className="px-4 -mt-3 relative z-20">
            <div className="grid grid-cols-4 gap-2">
              <div
                className={`p-2.5 rounded-2xl border text-center flex flex-col justify-center ${
                  lightMode
                    ? "bg-white border-[#1E0734]/12 shadow-sm"
                    : "bg-[#290C46]/95 border-white/15 shadow-lg"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase opacity-65">
                  Puntos
                </span>
                <span className="font-wta-condensed text-xl sm:text-2xl font-bold text-[#00DC7D] tabular-nums mt-0.5">
                  {player.elo}
                </span>
                <span className="text-[10px] font-bold opacity-75 truncate">
                  {catInfo.currentCat.name}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-2xl border text-center flex flex-col justify-center ${
                  lightMode
                    ? "bg-white border-[#1E0734]/12 shadow-sm"
                    : "bg-[#290C46]/95 border-white/15 shadow-lg"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase opacity-65">
                  Efectividad
                </span>
                <span className="font-wta-condensed text-xl sm:text-2xl font-bold tabular-nums mt-0.5">
                  {winRate}%
                </span>
                <span className="text-[10px] font-bold opacity-75">
                  {player.wins}V - {player.losses}D
                </span>
              </div>

              <div
                className={`p-2.5 rounded-2xl border text-center flex flex-col justify-center ${
                  lightMode
                    ? "bg-white border-[#1E0734]/12 shadow-sm"
                    : "bg-[#290C46]/95 border-white/15 shadow-lg"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase opacity-65">
                  Mejor Puesto
                </span>
                <span className="font-wta-condensed text-xl sm:text-2xl font-bold text-[#F59E0B] tabular-nums mt-0.5">
                  #{player.bestRank || player.rank}
                </span>
                <span className="text-[10px] font-bold opacity-75">
                  {player.titles || 0} {player.titles === 1 ? "título" : "títulos"}
                </span>
              </div>

              {/* Regla estricta: si victorias = 0, jamás renderiza llama ni racha */}
              <div
                className={`p-2.5 rounded-2xl border text-center flex flex-col justify-center ${
                  lightMode
                    ? "bg-white border-[#1E0734]/12 shadow-sm"
                    : "bg-[#290C46]/95 border-white/15 shadow-lg"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase opacity-65">
                  Momento
                </span>
                {hasActiveStreak ? (
                  <>
                    <div className="font-wta-condensed text-xl sm:text-2xl font-bold text-[#00DC7D] flex items-center justify-center gap-1 mt-0.5">
                      <SmartImage
                        src={ASSETS.fuegoRacha}
                        alt="Racha"
                        className="w-4 h-4 object-contain"
                      />
                      <span>+{player.streak}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#00DC7D]">
                      En racha
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-wta-condensed text-lg sm:text-xl font-bold opacity-85 mt-0.5">
                      Activo
                    </span>
                    <span className="text-[10px] font-bold opacity-70">
                      {totalMatches} jugados
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3. TERMÓMETRO MONOCROMÁTICO DE ASCENSO CON PELOTA 3D EN LA PUNTA */}
          <div className="px-4">
            <div
              className={`p-3.5 rounded-2xl border ${
                lightMode
                  ? "bg-white border-[#1E0734]/10"
                  : "bg-[#23083C] border-white/12"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold mb-2">
                <span>
                  Camino de {catInfo.currentCat.name}{" "}
                  {catInfo.nextCat ? `a ${catInfo.nextCat.name}` : "(División Máxima)"}
                </span>
                <span className="text-[#00DC7D] tabular-nums">
                  {catInfo.nextCat
                    ? `Faltan ${catInfo.pointsToNext} pts`
                    : "Cima del circuito"}
                </span>
              </div>

              <div className="relative h-3 rounded-full bg-black/30 border border-current/10 my-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    lightMode ? "bg-[#1E0734]" : "bg-white"
                  }`}
                  style={{ width: `${catInfo.progressPercent}%` }}
                />
                {/* Pelota 3D en la punta móvil del termómetro */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 pointer-events-none transition-all duration-500"
                  style={{ left: `${catInfo.progressPercent}%` }}
                >
                  <SmartImage
                    src={ASSETS.pelotaVoltAzul}
                    alt="Progreso"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] opacity-75 pt-1">
                <span>Piso protegido: {catInfo.activeFloor} pts</span>
                {catInfo.nextCat && (
                  <span>Meta: {catInfo.nextThreshold} pts</span>
                )}
              </div>
            </div>
          </div>

          {/* 4. FICHA DE JUEGO Y DISPONIBILIDAD HORARIA */}
          <div className="px-4">
            <div
              className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                lightMode
                  ? "bg-white border-[#1E0734]/10 text-[#1E0734]"
                  : "bg-[#23083C] border-white/12 text-white"
              }`}
            >
              <h4 className="font-wta-condensed text-base font-bold uppercase tracking-wider text-[#00DC7D]">
                PERFIL TÉCNICO DE CANCHA
              </h4>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-current/5 border border-current/10">
                  <span className="text-[10px] uppercase font-bold opacity-65 block">
                    Mano de juego
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm mt-0.5 block">
                    {player.hand || "Diestro"} · {player.backhand || "Revés a dos manos"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-current/5 border border-current/10">
                  <span className="text-[10px] uppercase font-bold opacity-65 block">
                    Mejor golpe
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm text-[#00DC7D] mt-0.5 block">
                    {player.bestShot || "Derecha con topspin"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-current/5 border border-current/10">
                  <span className="text-[10px] uppercase font-bold opacity-65 block">
                    Edad y estatura
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm mt-0.5 block">
                    {player.age || 28} años · {player.height || "1.77 m"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-current/5 border border-current/10">
                  <span className="text-[10px] uppercase font-bold opacity-65 block">
                    Contacto WhatsApp
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm mt-0.5 block truncate">
                    {canSeeWhatsApp
                      ? `+${player.whatsapp || CIRCUIT_CONFIG.adminWhatsApp}`
                      : "Visible al aceptar reto"}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-current/5 border border-current/10 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold opacity-65 block">
                    Horarios preferidos para jugar
                  </span>
                  <span className="font-extrabold text-xs">
                    {player.availability || "Tardes y fines de semana"}
                  </span>
                </div>
                <WtaIcon name="clock" size={16} className="text-[#00DC7D]" />
              </div>
            </div>
          </div>

          {/* 5. HISTORIAL RECIENTE DE PARTIDOS DEL JUGADOR */}
          <div className="px-4">
            <h4 className="font-wta-condensed text-lg font-bold uppercase tracking-tight mb-2">
              ÚLTIMOS PARTIDOS REGISTRADOS ({playerMatches.length})
            </h4>

            {playerMatches.length === 0 ? (
              <div
                className={`p-4 rounded-2xl border text-center text-xs opacity-75 ${
                  lightMode
                    ? "bg-white border-[#1E0734]/10"
                    : "bg-[#23083C] border-white/10"
                }`}
              >
                Todavía no registra partidos finalizados en esta temporada.
              </div>
            ) : (
              <div className="space-y-2">
                {playerMatches.slice(0, 4).map((m) => {
                  const wonMatch = m.winnerId === player.id;
                  const opponentName =
                    m.playerAId === player.id ? m.playerBName : m.playerAName;
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                        lightMode
                          ? "bg-white border-[#1E0734]/10"
                          : "bg-[#23083C] border-white/10"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              wonMatch
                                ? "bg-[#00DC7D] text-[#1E0734]"
                                : "bg-white/15 text-current"
                            }`}
                          >
                            {wonMatch ? "VICTORIA ◀" : "PARTIDO"}
                          </span>
                          <span className="text-[11px] opacity-70 truncate">
                            {m.club}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold truncate mt-1">
                          vs. {opponentName}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-wta-condensed text-lg font-bold text-[#00DC7D] tabular-nums">
                          {m.score}
                        </div>
                        <div className="text-[10px] opacity-65">{m.date}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Barra Inferior de Acciones Directas */}
        <div
          className={`px-4 py-3 border-t flex items-center gap-2 shrink-0 ${
            lightMode
              ? "bg-white border-[#1E0734]/10"
              : "bg-[#160428] border-white/12"
          }`}
        >
          {!isMe && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("hero");
                if (onChallengePlayer) onChallengePlayer(player);
              }}
              className="flex-1 py-3 px-4 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <WtaIcon name="swords" size={16} />
              <span>Retar a {player.firstName}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              if (onCompareH2H) {
                onCompareH2H(
                  isMe ? player : currentUser || player,
                  isMe ? INITIAL_PLAYERS[0] : player
                );
              }
            }}
            className={`flex-1 py-3 px-4 rounded-2xl font-wta-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border mp-btn-tactile ${
              lightMode
                ? "bg-[#1E0734] text-white border-[#1E0734]"
                : "bg-white/12 hover:bg-white/20 text-white border-white/20"
            }`}
          >
            <WtaIcon name="h2h" size={16} className="text-[#00DC7D]" />
            <span>Comparar H2H</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. VISTA PRINCIPAL 2: RANKING OFICIAL ESTILO WTA (<RankingOfficialView/>)
//    - Cabecera Verde Menta Degradada (wtatennis.com).
//    - Filas en 1 sola línea limpia (cero nombres truncados como "Mateo...").
//    - Halo luminoso animado en tu propia fila (my-rank-halo-row).
//    - Línea de corte al Puesto #8 del Torneo de Maestros (Master Top 8 Finals).
// ----------------------------------------------------------------------------
export function RankingOfficialView({
  players = [],
  currentUser,
  matches = [],
  challenges = [],
  lightMode = false,
  onSelectPlayerProfile,
  onChallengePlayer,
  onOpenH2HWithPlayers,
  onOpenMasterTop8,
}) {
  const [divisionFilter, setDivisionFilter] = useState("general"); // 'general' | 'master40' | 'damas'
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // 'ALL' | '2DA_3RA' | '4TA' | '5A' | '5B' | '5P'
  const [searchQuery, setSearchQuery] = useState("");
  const [showLadderModal, setShowLadderModal] = useState(false);

  const myRowRef = useRef(null);

  // Ordena los tenistas por puntos ELO descendente y asigna puesto real
  const sortedPlayers = useMemo(() => {
    const base = [...players].sort((a, b) => Number(b.elo || 0) - Number(a.elo || 0));
    return base.map((p, idx) => ({ ...p, computedRank: idx + 1 }));
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return sortedPlayers.filter((p) => {
      if (divisionFilter === "master40" && Number(p.age || 30) < 40) return false;
      if (divisionFilter === "damas" && p.gender !== "F") return false;

      if (categoryFilter !== "ALL") {
        const cat = getCategoryByElo(p.elo);
        if (categoryFilter === "2DA_3RA" && cat.id !== "2DA" && cat.id !== "3RA") {
          return false;
        }
        if (categoryFilter !== "2DA_3RA" && cat.id !== categoryFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchClub = (p.club || "").toLowerCase().includes(q);
        if (!matchName && !matchClub) return false;
      }

      return true;
    });
  }, [sortedPlayers, divisionFilter, categoryFilter, searchQuery]);

  const scrollToMyRow = () => {
    triggerHaptic("tab");
    if (myRowRef.current) {
      myRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-3 px-3.5 sm:px-5 pt-2 pb-4 mp-view-enter">
      {/* 1. CABECERA DEGRADADA VERDE MENTA / ESMERALDA ESTILO WTA RANKINGS */}
      <div
        className="rounded-3xl p-4 sm:p-5 text-[#1E0734] shadow-lg relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #00DC7D 0%, #6EF2B5 55%, #E3FDF0 100%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
              CLASIFICACIÓN EN VIVO · HUANCAYO
            </span>
            <h1 className="font-wta-condensed text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E0734] leading-none mt-1">
              RANKING OFICIAL SINGLES
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setShowLadderModal(true);
              }}
              className="px-3 py-2 rounded-full bg-white/85 hover:bg-white text-[#1E0734] font-wta-display font-extrabold text-xs flex items-center gap-1.5 shadow-sm mp-btn-tactile"
            >
              <WtaIcon name="ranking" size={14} />
              <span>Categorías</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("hero");
                if (onOpenH2HWithPlayers) {
                  onOpenH2HWithPlayers(
                    currentUser || sortedPlayers[2],
                    sortedPlayers[0]
                  );
                }
              }}
              className="px-3.5 py-2 rounded-full bg-[#1E0734] text-[#00DC7D] font-wta-display font-extrabold text-xs flex items-center gap-1.5 shadow-md mp-btn-tactile"
            >
              <WtaIcon name="h2h" size={14} />
              <span>Head to Head</span>
            </button>
          </div>
        </div>

        {/* Pestañas Segmentadas de División (General, +40 Master, Damas) */}
        <div className="mt-3.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex rounded-full p-1 bg-[#1E0734]/12 border border-[#1E0734]/15">
            {[
              { id: "general", label: "Circuito General" },
              { id: "master40", label: "+40 Master" },
              { id: "damas", label: "Damas" },
            ].map((div) => (
              <button
                key={div.id}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setDivisionFilter(div.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-wta-display font-extrabold transition-all ${
                  divisionFilter === div.id
                    ? "bg-[#1E0734] text-[#00DC7D] shadow-sm scale-[1.03]"
                    : "text-[#1E0734]/80 hover:text-[#1E0734]"
                }`}
              >
                {div.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={scrollToMyRow}
            className="px-3 py-1.5 rounded-full bg-white text-[#1E0734] text-xs font-extrabold border border-[#1E0734]/15 shadow-sm flex items-center gap-1 mp-btn-tactile"
          >
            <span className="w-2 h-2 rounded-full bg-[#00DC7D]" />
            <span>Ir a mi puesto</span>
          </button>
        </div>
      </div>

      {/* 2. FILTROS POR CATEGORÍA (5ª P A 2ª) Y BUSCADOR EN VIVO */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { id: "ALL", label: "Todas las categorías" },
            { id: "2DA_3RA", label: "2ª y 3ª Categoría" },
            { id: "4TA", label: "4ª Categoría" },
            { id: "5A", label: "5ª Avanzada" },
            { id: "5B", label: "5ª Básica" },
            { id: "5P", label: "5ª Principiante" },
          ].map((catTab) => (
            <button
              key={catTab.id}
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setCategoryFilter(catTab.id);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-wta-display font-bold shrink-0 wta-pill-tab ${
                categoryFilter === catTab.id
                  ? "wta-pill-tab-active"
                  : lightMode
                  ? "bg-white text-[#1E0734]/80 border border-[#1E0734]/15"
                  : "wta-pill-tab-inactive"
              }`}
            >
              {catTab.label}
            </button>
          ))}
        </div>

        {/* Buscador Rápido */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tenista por nombre o club..."
            className={`w-full pl-10 pr-9 py-2.5 rounded-2xl border mp-input-alive text-xs sm:text-sm font-medium ${
              lightMode
                ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                : "bg-[#23083C] border-white/15 text-white"
            }`}
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00DC7D]">
            <WtaIcon name="search" size={16} />
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
            >
              <WtaIcon name="close" size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 3. TABLA OFICIAL DE RANKING (DISEÑADA PARA LEERSE EN 1 SOLA LÍNEA LIMPIA) */}
      <div
        className={`rounded-3xl overflow-hidden border shadow-xl ${
          lightMode
            ? "bg-white border-[#1E0734]/12"
            : "bg-[#23083C] border-white/12"
        }`}
      >
        {/* Cabecera de Columnas */}
        <div
          className={`px-3.5 sm:px-4 py-2.5 text-[10px] font-wta-display font-extrabold uppercase tracking-wider flex items-center justify-between border-b ${
            lightMode
              ? "bg-[#FAF9F5] text-[#1E0734]/70 border-[#1E0734]/10"
              : "bg-[#1E0734]/80 text-[#6EF2B5] border-white/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-7 text-center">POS</span>
            <span>TENISTA / CLUB & CATEGORÍA</span>
          </div>
          <div className="flex items-center gap-4">
            <span>PUNTOS</span>
            <span className="hidden sm:inline-block w-20 text-right">ACCIÓN</span>
          </div>
        </div>

        {/* Filas de Jugadores */}
        <div className="divide-y divide-current/10">
          {filteredPlayers.map((player, index) => {
            const rankPos = player.computedRank;
            const isCurrentUserRow = player.id === currentUser?.id;
            const catObj = getCategoryByElo(player.elo);
            const isInTrial = Number(player.matchesPlayed || 0) < 5;
            const isTop3Leader = rankPos <= 3;
            const showMasterCutoffAfter =
              rankPos === 8 && divisionFilter === "general" && categoryFilter === "ALL";

            return (
              <React.Fragment key={player.id}>
                <div
                  ref={isCurrentUserRow ? myRowRef : null}
                  onClick={() => {
                    triggerHaptic("card");
                    if (onSelectPlayerProfile) onSelectPlayerProfile(player);
                  }}
                  className={`p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5 cursor-pointer group transition-all ${
                    isCurrentUserRow
                      ? "my-rank-halo-row bg-[#00DC7D]/12"
                      : lightMode
                      ? "hover:bg-[#FAF9F5]"
                      : "hover:bg-white/5"
                  }`}
                >
                  {/* IZQUIERDA: PUESTO GIGANTE + RETRATO ESMERALDA + NOMBRE COMPLETO */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                    {/* Número de Puesto en Tipografía Condensada Gigante */}
                    <div className="w-7 sm:w-9 text-center shrink-0">
                      <span
                        className={`font-wta-condensed text-2xl sm:text-3xl font-bold leading-none tabular-nums block ${
                          rankPos === 1
                            ? "text-[#F59E0B]"
                            : rankPos <= 3
                            ? "text-[#00DC7D]"
                            : lightMode
                            ? "text-[#1E0734]"
                            : "text-white"
                        }`}
                      >
                        {rankPos}
                      </span>
                      <span className="text-[9px] font-extrabold text-[#00DC7D] block">
                        {rankPos <= 8 ? "TOP 8" : "●"}
                      </span>
                    </div>

                    {/* Retrato Cuadrado Esmeralda WTA con Laureles si es Top 3 */}
                    <LaurelAvatar
                      player={player}
                      rankPosition={rankPos}
                      size="md"
                    />

                    {/* Bloque Central: Nombre Completo en 1 Línea + Fila Compacta de Datos */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-sm sm:text-base font-wta-display font-extrabold leading-tight ${
                            lightMode ? "text-[#1E0734]" : "text-white"
                          }`}
                        >
                          {player.name}
                        </span>

                        {isCurrentUserRow && (
                          <span className="px-2 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[9px] font-wta-display font-black uppercase tracking-wider shrink-0">
                            Tu puesto
                          </span>
                        )}
                      </div>

                      {/* Sub-línea limpia: Categoría + Club + Partidos de prueba si aplica */}
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span
                          className="px-2 py-0.2 rounded-md text-[10px] font-wta-display font-black uppercase"
                          style={{
                            backgroundColor: catObj.badgeColor,
                            color: "#1E0734",
                          }}
                        >
                          {catObj.name}
                        </span>

                        <span
                          className={`font-semibold truncate max-w-[145px] sm:max-w-[220px] ${
                            lightMode ? "text-[#1E0734]/70" : "text-white/70"
                          }`}
                        >
                          {player.individualMode ? "Independiente" : player.club}
                        </span>

                        {isInTrial && (
                          <span className="px-2 py-0.2 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 text-[9px] font-extrabold">
                            Partidos de prueba ({player.matchesPlayed}/5)
                          </span>
                        )}

                        {Number(player.age || 30) >= 40 && (
                          <span className="px-1.5 py-0.2 rounded bg-[#F59E0B]/20 text-[#F59E0B] text-[9px] font-extrabold">
                            +40
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DERECHA: PUNTOS EN CONDENSADA GIGANTE + BOTÓN RÁPIDO DE RETAR */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div
                        className={`font-wta-condensed text-2xl sm:text-3xl font-bold leading-none tabular-nums ${
                          isCurrentUserRow
                            ? "text-[#00DC7D]"
                            : lightMode
                            ? "text-[#1E0734]"
                            : "text-white"
                        }`}
                      >
                        {player.elo.toLocaleString()}
                      </div>
                      <span
                        className={`text-[10px] font-bold block mt-0.5 ${
                          lightMode ? "text-[#1E0734]/60" : "text-white/60"
                        }`}
                      >
                        {player.wins}V - {player.losses}D
                      </span>
                    </div>

                    {!isCurrentUserRow && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic("hero");
                          if (onChallengePlayer) onChallengePlayer(player);
                        }}
                        className={`px-2.5 sm:px-3 py-2 rounded-xl text-[11px] font-wta-display font-extrabold flex items-center gap-1 mp-btn-tactile ${
                          isTop3Leader
                            ? "bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-[#1E0734] shadow-md"
                            : "bg-[#00DC7D] text-[#1E0734] shadow-sm"
                        }`}
                      >
                        <WtaIcon name="swords" size={13} />
                        <span className="hidden xs:inline">
                          {isTop3Leader ? "Desafiar" : "Retar"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* LÍNEA DE CORTE OFICIAL AL PUESTO #8 DEL MASTER TOP 8 FINALS */}
                {showMasterCutoffAfter && (
                  <div
                    onClick={() => {
                      triggerHaptic("hero");
                      if (onOpenMasterTop8) onOpenMasterTop8();
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#1E0734] via-[#290C46] to-[#1E0734] border-y-2 border-[#00DC7D] flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#00DC7D] animate-ping shrink-0" />
                      <span className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] truncate">
                        ZONA DE CLASIFICACIÓN AL TORNEO DE MAESTROS (TOP 8 FINALS)
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-extrabold shrink-0 group-hover:scale-105 transition-transform">
                      Ver Formato Top 8 ➔
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Modal de Escala de Categorías */}
      <CategoryLadderInfoModal
        isOpen={showLadderModal}
        onClose={() => setShowLadderModal(false)}
        currentUser={currentUser}
        lightMode={lightMode}
      />
    </div>
  );
}

// === FIN DEL BLOQUE 6 DE 14 ===

// ============================================================================
// PARTE 7 DE 14: COMPARADOR MONUMENTAL HEAD TO HEAD ESTILO WTA (ANILLO RADIAL,
// TARJETAS GEMELAS CON CAMBIO INSTANTÁNEO DE JUGADOR, MONOLITO #23083C Y TABLA
// DE PERFILES) + ESTUDIO GENERADOR DE PÓSTER STORY 9:16 EN HTML5 CANVAS
// ============================================================================

// ----------------------------------------------------------------------------
// 1. ANILLO RADIAL VECTORIAL DE ENFRENTAMIENTOS (<WtaHeadToHeadRadialRing/>)
//    Muestra el total de partidos jugados en el centro y la proporción de
//    victorias de cada tenista en arcos de Verde Esmeralda y Blanco/Oro.
// ----------------------------------------------------------------------------
export function WtaHeadToHeadRadialRing({
  winsA = 0,
  winsB = 0,
  totalPlayed = 0,
  size = 132,
}) {
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const shareA = totalPlayed > 0 ? winsA / totalPlayed : 0.5;
  const dashA = circumference * shareA;
  const dashB = circumference - dashA;

  return (
    <div
      className="relative inline-flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Pista base */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />

        {/* Arco Jugador B (Derecha) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6EF2B5"
          strokeOpacity="0.45"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Arco Jugador A (Izquierda) en Verde Esmeralda Vibrante */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#00DC7D"
          strokeWidth={strokeWidth}
          strokeDasharray={`${dashA} ${dashB}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>

      {/* Centro del Anillo: Total de Partidos */}
      <div className="absolute inset-3 rounded-full bg-[#1E0734] border border-white/15 flex flex-col items-center justify-center text-center shadow-inner">
        <span className="font-wta-condensed text-3xl sm:text-4xl font-bold text-white leading-none tabular-nums">
          {totalPlayed}
        </span>
        <span className="text-[9px] font-wta-display font-extrabold uppercase tracking-widest text-[#00DC7D] mt-0.5">
          {totalPlayed === 1 ? "PARTIDO" : "JUGADOS"}
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2. COMPARADOR MONUMENTAL HEAD TO HEAD (<AtpHeadToHeadModal/>)
//    Inspirado en el frente a frente oficial de wtatennis.com:
//    - Cabecera en degradado Verde Menta (#00DC7D -> #6EF2B5 -> #F4FBF7).
//    - 2 retratos recortados flanqueando la cabecera.
//    - 2 tarjetas blancas gemelas con botón oscuro "CAMBIAR JUGADOR" y buscador.
//    - Monolito central oscuro (#23083C) con anillo radial y barras bicolores.
//    - Tarjeta blanca inferior comparando fila por fila el perfil técnico.
// ----------------------------------------------------------------------------
export function AtpHeadToHeadModal({
  isOpen,
  onClose,
  initialPlayerA = null,
  initialPlayerB = null,
  players = INITIAL_PLAYERS,
  matches = INITIAL_MATCHES,
  lightMode = false,
  onChallengePair,
  onOpenStoryFromH2H,
}) {
  const [playerAId, setPlayerAId] = useState(
    initialPlayerA?.id || players[2]?.id || "p-pablo"
  );
  const [playerBId, setPlayerBId] = useState(
    initialPlayerB?.id || players[0]?.id || "p-mateo"
  );
  const [swapPickerSide, setSwapPickerSide] = useState(null); // 'A' | 'B' | null
  const [swapSearch, setSwapSearch] = useState("");

  useEffect(() => {
    if (initialPlayerA?.id) setPlayerAId(initialPlayerA.id);
    if (initialPlayerB?.id) {
      if (initialPlayerB.id === initialPlayerA?.id && players.length > 1) {
        const alt = players.find((p) => p.id !== initialPlayerA.id);
        if (alt) setPlayerBId(alt.id);
      } else {
        setPlayerBId(initialPlayerB.id);
      }
    }
  }, [initialPlayerA, initialPlayerB, players]);

  useEffect(() => {
    if (!isOpen) {
      setSwapPickerSide(null);
      setSwapSearch("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playerA =
    players.find((p) => p.id === playerAId) || players[0] || INITIAL_PLAYERS[0];
  const playerB =
    players.find((p) => p.id === playerBId) || players[1] || INITIAL_PLAYERS[1];

  const catA = getCategoryByElo(playerA.elo);
  const catB = getCategoryByElo(playerB.elo);

  // Calcula enfrentamientos directos entre A y B
  const directMatches = matches.filter(
    (m) =>
      (m.playerAId === playerA.id && m.playerBId === playerB.id) ||
      (m.playerAId === playerB.id && m.playerBId === playerA.id)
  );

  const directWinsA = directMatches.filter((m) => m.winnerId === playerA.id).length;
  const directWinsB = directMatches.filter((m) => m.winnerId === playerB.id).length;
  const totalDirect = directMatches.length;

  const totalCareerA = Number(playerA.wins || 0) + Number(playerA.losses || 0);
  const totalCareerB = Number(playerB.wins || 0) + Number(playerB.losses || 0);
  const winPctA =
    totalCareerA > 0 ? Math.round((Number(playerA.wins || 0) / totalCareerA) * 100) : 0;
  const winPctB =
    totalCareerB > 0 ? Math.round((Number(playerB.wins || 0) / totalCareerB) * 100) : 0;

  // Probabilidad matemática en un duelo hoy
  const probA = Math.round(
    (1 / (1 + Math.pow(10, (Number(playerB.elo || 1500) - Number(playerA.elo || 1500)) / 600))) *
      100
  );
  const probB = 100 - probA;

  const filteredSwapCandidates = players.filter((p) => {
    if (!swapSearch.trim()) return true;
    const q = swapSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || (p.club || "").toLowerCase().includes(q)
    );
  });

  const handleSelectSwapPlayer = (chosenPlayer) => {
    triggerHaptic("tab");
    if (swapPickerSide === "A") {
      if (chosenPlayer.id === playerB.id) {
        setPlayerBId(playerA.id);
      }
      setPlayerAId(chosenPlayer.id);
    } else if (swapPickerSide === "B") {
      if (chosenPlayer.id === playerA.id) {
        setPlayerAId(playerB.id);
      }
      setPlayerBId(chosenPlayer.id);
    }
    setSwapPickerSide(null);
    setSwapSearch("");
  };

  const careerComparisonRows = [
    {
      label: "PUNTOS RANKING",
      valA: playerA.elo,
      valB: playerB.elo,
      format: (v) => v.toLocaleString(),
    },
    {
      label: "VICTORIAS TEMPORADA",
      valA: Number(playerA.wins || 0),
      valB: Number(playerB.wins || 0),
      format: (v) => v,
    },
    {
      label: "% EFECTIVIDAD",
      valA: winPctA,
      valB: winPctB,
      format: (v) => `${v}%`,
    },
    {
      label: "TÍTULOS OFICIALES",
      valA: Number(playerA.titles || 0),
      valB: Number(playerB.titles || 0),
      format: (v) => v,
    },
    {
      label: "RACHA ACTUAL",
      valA: Number(playerA.wins || 0) > 0 ? Number(playerA.streak || 0) : 0,
      valB: Number(playerB.wins || 0) > 0 ? Number(playerB.streak || 0) : 0,
      format: (v) => (v > 0 ? `+${v}` : "0"),
    },
    {
      label: "PROBABILIDAD EN CANCHA",
      valA: probA,
      valB: probB,
      format: (v) => `${v}%`,
    },
  ];

  const profileTableRows = [
    {
      label: "Puesto Actual",
      left: `#${playerA.rank}`,
      right: `#${playerB.rank}`,
    },
    {
      label: "Mejor Puesto",
      left: `#${playerA.bestRank || playerA.rank}`,
      right: `#${playerB.bestRank || playerB.rank}`,
    },
    {
      label: "Categoría Oficial",
      left: catA.name,
      right: catB.name,
    },
    {
      label: "Club / Sede",
      left: playerA.individualMode ? "Independiente" : playerA.club,
      right: playerB.individualMode ? "Independiente" : playerB.club,
    },
    {
      label: "Edad",
      left: `${playerA.age || 28} años`,
      right: `${playerB.age || 28} años`,
    },
    {
      label: "Estatura",
      left: playerA.height || "1.77 m",
      right: playerB.height || "1.77 m",
    },
    {
      label: "Mano de Juego",
      left: playerA.hand || "Diestro",
      right: playerB.hand || "Diestro",
    },
    {
      label: "Mejor Golpe",
      left: playerA.bestShot || "Derecha con topspin",
      right: playerB.bestShot || "Derecha con topspin",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-3xl overflow-hidden bg-[#FAF9F5] text-[#1E0734] shadow-[0_25px_70px_rgba(0,0,0,0.75)] border border-white/30 mp-modal-sheet">
        {/* Botón superior derecho de cierre */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (onClose) onClose();
          }}
          aria-label="Cerrar comparador"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-[#1E0734] text-white hover:bg-[#290C46] flex items-center justify-center shadow-md mp-close-btn"
        >
          <WtaIcon name="close" size={18} />
        </button>

        {/* Cuerpo Scrolleable del Head to Head */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-6">
          {/* 1. CABECERA MONUMENTAL EN DEGRADADO VERDE MENTA ESTILO WTA */}
          <div
            className="relative pt-5 pb-6 px-3.5 sm:px-6 overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #00DC7D 0%, #6EF2B5 52%, #FAF9F5 100%)",
            }}
          >
            <div className="text-center relative z-20 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-widest">
                COMPARADOR OFICIAL · SINGLES
              </span>
              <h2 className="font-wta-condensed text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#1E0734] leading-none mt-1">
                HEAD TO HEAD
              </h2>
            </div>

            {/* Retratos Enfrentados + 2 Tarjetas Blancas Gemelas con Botón CAMBIAR JUGADOR */}
            <div className="relative z-20 grid grid-cols-2 gap-2.5 sm:gap-4 items-end">
              {/* TARJETA GEMELA IZQUIERDA (JUGADOR A) */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-[0_12px_30px_rgba(30,7,52,0.14)] border border-[#1E0734]/10 flex flex-col justify-between">
                <div className="relative h-36 sm:h-44 bg-gradient-to-b from-[#00DC7D]/25 via-[#6EF2B5]/15 to-white flex items-end justify-center overflow-hidden pt-2">
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black">
                    #{playerA.rank}
                  </span>
                  <SmartImage
                    src={playerA.cutoutAvatar || playerA.avatar}
                    alt={playerA.name}
                    isAvatar
                    className="w-28 h-32 sm:w-36 sm:h-40 object-cover object-top rounded-t-2xl shadow-md"
                  />
                </div>

                <div className="p-3 text-center">
                  <div className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00A859] truncate">
                    {catA.name} · {playerA.elo} PTS
                  </div>
                  <div className="font-wta-condensed text-lg sm:text-2xl font-bold uppercase text-[#1E0734] truncate mt-0.5">
                    {playerA.name}
                  </div>
                  <div className="text-[11px] font-semibold text-[#1E0734]/65 truncate">
                    {playerA.individualMode ? "Independiente" : playerA.club}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setSwapPickerSide(swapPickerSide === "A" ? null : "A");
                  }}
                  className="w-full py-2.5 px-3 bg-[#1E0734] hover:bg-[#290C46] text-white text-[11px] font-wta-display font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 mp-btn-tactile"
                >
                  <WtaIcon name="swap" size={13} className="text-[#00DC7D]" />
                  <span>Cambiar jugador</span>
                </button>
              </div>

              {/* TARJETA GEMELA DERECHA (JUGADOR B) */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-[0_12px_30px_rgba(30,7,52,0.14)] border border-[#1E0734]/10 flex flex-col justify-between">
                <div className="relative h-36 sm:h-44 bg-gradient-to-b from-[#290C46]/15 via-[#00DC7D]/15 to-white flex items-end justify-center overflow-hidden pt-2">
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black">
                    #{playerB.rank}
                  </span>
                  <SmartImage
                    src={playerB.cutoutAvatar || playerB.avatar}
                    alt={playerB.name}
                    isAvatar
                    className="w-28 h-32 sm:w-36 sm:h-40 object-cover object-top rounded-t-2xl shadow-md"
                  />
                </div>

                <div className="p-3 text-center">
                  <div className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00A859] truncate">
                    {catB.name} · {playerB.elo} PTS
                  </div>
                  <div className="font-wta-condensed text-lg sm:text-2xl font-bold uppercase text-[#1E0734] truncate mt-0.5">
                    {playerB.name}
                  </div>
                  <div className="text-[11px] font-semibold text-[#1E0734]/65 truncate">
                    {playerB.individualMode ? "Independiente" : playerB.club}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setSwapPickerSide(swapPickerSide === "B" ? null : "B");
                  }}
                  className="w-full py-2.5 px-3 bg-[#1E0734] hover:bg-[#290C46] text-white text-[11px] font-wta-display font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 mp-btn-tactile"
                >
                  <WtaIcon name="swap" size={13} className="text-[#00DC7D]" />
                  <span>Cambiar jugador</span>
                </button>
              </div>
            </div>

            {/* Buscador Instantáneo Desplegable para Cambiar Jugador A o B */}
            {swapPickerSide && (
              <div className="mt-3 p-3.5 rounded-3xl bg-white border-2 border-[#00DC7D] shadow-2xl space-y-2.5 mp-view-enter">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-wta-display font-extrabold uppercase text-[#1E0734]">
                    Seleccionar tenista para el lado{" "}
                    {swapPickerSide === "A" ? "izquierdo" : "derecho"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSwapPickerSide(null)}
                    className="text-xs font-bold text-rose-600"
                  >
                    Cerrar
                  </button>
                </div>

                <input
                  type="text"
                  value={swapSearch}
                  onChange={(e) => setSwapSearch(e.target.value)}
                  placeholder="Escribe el nombre o club del tenista..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-[#1E0734] mp-input-alive"
                />

                <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredSwapCandidates.map((cand) => (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => handleSelectSwapPlayer(cand)}
                      className="p-2 rounded-xl border border-[#1E0734]/10 hover:border-[#00DC7D] bg-[#FAF9F5] flex items-center justify-between gap-2 text-left mp-btn-tactile"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <SmartImage
                          src={cand.avatar}
                          alt={cand.name}
                          isAvatar
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-[#1E0734] truncate">
                            {cand.name}
                          </div>
                          <div className="text-[10px] text-[#1E0734]/65 truncate">
                            #{cand.rank} · {cand.elo} pts
                          </div>
                        </div>
                      </div>
                      <WtaIcon
                        name="chevron-right"
                        size={14}
                        className="text-[#00A859]"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. MONOLITO CENTRAL OSCURO (#23083C · CAREER STATS & ANILLO RADIAL) */}
          <div className="px-3.5 sm:px-6">
            <div className="rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-[#23083C] via-[#1E0734] to-[#150426] text-white shadow-2xl border border-[#00DC7D]/30 space-y-5">
              {/* Anillo Radial Central de Victorias Directas */}
              <div className="text-center">
                <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-widest text-[#6EF2B5]">
                  HISTORIAL FRENTE A FRENTE EN CANCHA
                </span>

                <div className="mt-3 flex items-center justify-around gap-2">
                  {/* Lado A */}
                  <div className="text-center flex-1">
                    <div className="font-wta-condensed text-4xl sm:text-5xl font-bold text-[#00DC7D] leading-none tabular-nums">
                      {directWinsA}
                    </div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/80 mt-1">
                      Victorias
                    </div>
                    <div className="text-[10px] text-[#6EF2B5] font-bold">
                      {totalDirect > 0
                        ? `${Math.round((directWinsA / totalDirect) * 100)}% H2H`
                        : `${winPctA}% global`}
                    </div>
                  </div>

                  {/* Anillo Radial Central */}
                  <WtaHeadToHeadRadialRing
                    winsA={directWinsA || playerA.wins}
                    winsB={directWinsB || playerB.wins}
                    totalPlayed={totalDirect}
                    size={126}
                  />

                  {/* Lado B */}
                  <div className="text-center flex-1">
                    <div className="font-wta-condensed text-4xl sm:text-5xl font-bold text-[#6EF2B5] leading-none tabular-nums">
                      {directWinsB}
                    </div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/80 mt-1">
                      Victorias
                    </div>
                    <div className="text-[10px] text-[#6EF2B5] font-bold">
                      {totalDirect > 0
                        ? `${Math.round((directWinsB / totalDirect) * 100)}% H2H`
                        : `${winPctB}% global`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Barras Comparativas Bicolores (ESTADÍSTICAS DE TEMPORADA) */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="text-center text-xs font-wta-condensed font-bold uppercase tracking-widest text-[#00DC7D]">
                  COMPARATIVA DE RENDIMIENTO
                </div>

                {careerComparisonRows.map((row) => {
                  const total = Number(row.valA || 0) + Number(row.valB || 0);
                  const pctA = total > 0 ? Math.round((row.valA / total) * 100) : 50;
                  const pctB = 100 - pctA;
                  const aLeads = row.valA >= row.valB;

                  return (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-extrabold tabular-nums">
                        <span
                          className={
                            aLeads ? "text-[#00DC7D] text-sm" : "text-white/75"
                          }
                        >
                          {row.format(row.valA)}
                        </span>
                        <span className="text-[10px] font-wta-display font-bold uppercase tracking-wider text-white/70">
                          {row.label}
                        </span>
                        <span
                          className={
                            !aLeads ? "text-[#00DC7D] text-sm" : "text-white/75"
                          }
                        >
                          {row.format(row.valB)}
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-white/10 overflow-hidden flex gap-0.5">
                        <div
                          className={`h-full rounded-l-full transition-all duration-500 ${
                            aLeads ? "bg-[#00DC7D]" : "bg-white/35"
                          }`}
                          style={{ width: `${pctA}%` }}
                        />
                        <div
                          className={`h-full rounded-r-full transition-all duration-500 ${
                            !aLeads ? "bg-[#00DC7D]" : "bg-white/35"
                          }`}
                          style={{ width: `${pctB}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. TARJETA BLANCA INFERIOR: PLAYER PROFILES (FILA POR FILA) */}
          <div className="px-3.5 sm:px-6 mt-4">
            <div className="rounded-3xl bg-white border border-[#1E0734]/10 shadow-md overflow-hidden">
              <div className="px-4 py-3 bg-[#1E0734] text-white text-center">
                <h3 className="font-wta-condensed text-lg font-bold uppercase tracking-wider text-[#00DC7D]">
                  FICHA TÉCNICA COMPARADA
                </h3>
              </div>

              <div className="divide-y divide-[#1E0734]/10">
                {profileTableRows.map((r) => (
                  <div
                    key={r.label}
                    className="grid grid-cols-3 items-center px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-extrabold text-[#1E0734] text-left truncate pr-1">
                      {r.left}
                    </span>
                    <span className="text-[10px] font-wta-display font-bold uppercase tracking-wider text-[#1E0734]/55 text-center">
                      {r.label}
                    </span>
                    <span className="font-extrabold text-[#1E0734] text-right truncate pl-1">
                      {r.right}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. HISTORIAL DE PARTIDOS DIRECTOS ENTRE AMBOS */}
          {directMatches.length > 0 && (
            <div className="px-3.5 sm:px-6 mt-4">
              <div className="rounded-3xl bg-white border border-[#1E0734]/10 p-4 space-y-2.5">
                <h4 className="font-wta-condensed text-base font-bold uppercase text-[#1E0734]">
                  ENCUENTROS PREVIOS REGISTRADOS ({directMatches.length})
                </h4>
                {directMatches.map((dm) => (
                  <div
                    key={dm.id}
                    className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#1E0734]/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-[#00A859] block">
                        Ganador: {dm.winnerName} ◀
                      </span>
                      <span className="text-[11px] text-[#1E0734]/70">
                        {dm.club} · {dm.date}
                      </span>
                    </div>
                    <span className="font-wta-condensed text-lg font-bold text-[#1E0734] bg-[#00DC7D]/25 px-2.5 py-0.5 rounded-xl">
                      {dm.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barra Inferior de Acciones: Retar o Crear Póster Story 9:16 de Duelo */}
        <div className="px-4 py-3 bg-white border-t border-[#1E0734]/10 flex items-center gap-2 shrink-0">
          {onOpenStoryFromH2H && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                onOpenStoryFromH2H({
                  templateId: "duelo-vs",
                  winnerName: playerA.name,
                  loserName: playerB.name,
                  scoreText:
                    totalDirect > 0
                      ? `H2H ${directWinsA} - ${directWinsB}`
                      : `${playerA.elo} vs ${playerB.elo} PTS`,
                  club: playerA.club,
                });
              }}
              className="flex-1 py-3 px-3 rounded-2xl bg-[#1E0734] text-white font-wta-display font-bold text-xs flex items-center justify-center gap-1.5 mp-btn-tactile"
            >
              <WtaIcon name="share" size={15} className="text-[#00DC7D]" />
              <span>Crear Story VS</span>
            </button>
          )}

          {onChallengePair && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("hero");
                onChallengePair(playerB);
              }}
              className="flex-1 py-3 px-4 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <WtaIcon name="swords" size={16} />
              <span>Lanzar Reto Oficial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. GENERADOR DE PÓSTER VERTICAL 9:16 EN HTML5 CANVAS (<StoryPosterModal/>)
//    Genera imágenes listas en 1080x1920 px para Instagram Stories y Estados
//    de WhatsApp en 4 estilos (Victoria Nocturno, Victoria Claro Marfil,
//    Duelo VS y Resumen de Jornada Round Up) con Co-Branding oficial.
// ----------------------------------------------------------------------------
export function StoryPosterModal({
  isOpen,
  onClose,
  initialData = null,
  players = INITIAL_PLAYERS,
  sponsors = INITIAL_SPONSORS,
  lightMode = false,
}) {
  const [templateId, setTemplateId] = useState(
    initialData?.templateId || "victoria-oscuro"
  );
  const [winnerName, setWinnerName] = useState(
    initialData?.winnerName || "Pablo Samaniego"
  );
  const [loserName, setLoserName] = useState(
    initialData?.loserName || "Kenji Takahashi"
  );
  const [scoreText, setScoreText] = useState(
    initialData?.scoreText || "7-5, 6-4"
  );
  const [clubName, setClubName] = useState(
    initialData?.club || "Country Club Los Huancas"
  );
  const [headlineTag, setHeadlineTag] = useState("RESULTADO OFICIAL · HUANCAYO");
  const [posterDataUrl, setPosterDataUrl] = useState("");
  const [isRendering, setIsRendering] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!initialData) return;
    if (initialData.templateId) setTemplateId(initialData.templateId);
    if (initialData.winnerName) setWinnerName(initialData.winnerName);
    if (initialData.loserName) setLoserName(initialData.loserName);
    if (initialData.scoreText) setScoreText(initialData.scoreText);
    if (initialData.club) setClubName(initialData.club);
  }, [initialData]);

  // Dibuja el póster 1080x1920 en alta definición en el Canvas HTML5
  const renderStoryCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsRendering(true);

    const ctx = canvas.getContext("2d");
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    const isLightStyle =
      templateId === "victoria-claro" || templateId === "roundup-jornada";
    const isDuelStyle = templateId === "duelo-vs";

    // 1. Fondo Base según Plantilla
    if (isLightStyle) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#FAF9F5");
      grad.addColorStop(0.55, "#F2EFE9");
      grad.addColorStop(1, "#E5FBF0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#1E0734");
      grad.addColorStop(0.5, "#290C46");
      grad.addColorStop(1, "#120322");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Halo Esmeralda y Geometría Reglamentaria de Cancha de Tenis
    const radial = ctx.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.42, 620);
    radial.addColorStop(0, "rgba(0, 220, 125, 0.28)");
    radial.addColorStop(1, "rgba(0, 220, 125, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = isLightStyle
      ? "rgba(30, 7, 52, 0.10)"
      : "rgba(255, 255, 255, 0.10)";
    ctx.lineWidth = 4;
    ctx.strokeRect(70, 90, W - 140, H - 180);
    ctx.beginPath();
    ctx.moveTo(70, H * 0.5);
    ctx.lineTo(W - 70, H * 0.5);
    ctx.moveTo(W * 0.5, 360);
    ctx.lineTo(W * 0.5, H - 360);
    ctx.stroke();

    // 3. Cabecera Co-Branding: MATCHPOINT | Auspiciador
    ctx.fillStyle = isLightStyle ? "#1E0734" : "#FFFFFF";
    ctx.font = "900 54px 'Antonio', 'Outfit', sans-serif";
    ctx.textAlign = "center";
    const sponsorSuffix = sponsors?.titleSponsor?.active
      ? `  |  ${sponsors.titleSponsor.name.toUpperCase()}`
      : "";
    ctx.fillText(`MATCHPOINT${sponsorSuffix}`, W / 2, 195);

    // Píldora Superior de Evento
    ctx.fillStyle = "#00DC7D";
    ctx.beginPath();
    ctx.roundRect(W / 2 - 290, 235, 580, 62, 31);
    ctx.fill();

    ctx.fillStyle = "#1E0734";
    ctx.font = "800 26px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(
      isDuelStyle ? "DUELO ESTELAR EN CANCHA" : headlineTag.toUpperCase(),
      W / 2,
      276
    );

    // 4. Tarjeta Central de Protagonistas y Marcador
    ctx.fillStyle = isLightStyle ? "#FFFFFF" : "rgba(41, 12, 70, 0.92)";
    ctx.strokeStyle = "#00DC7D";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(105, 380, W - 210, 980, 48);
    ctx.fill();
    ctx.stroke();

    // Etiqueta de Sede y Superficie
    ctx.fillStyle = "#C85A32";
    ctx.beginPath();
    ctx.roundRect(W / 2 - 250, 435, 500, 54, 27);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 24px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${clubName.toUpperCase()} · ARCILLA`, W / 2, 470);

    // Nombre del Ganador / Jugador A
    ctx.fillStyle = isLightStyle ? "#00A859" : "#00DC7D";
    ctx.font = "800 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(isDuelStyle ? "RETADOR OFICIAL" : "GANADOR DEL PARTIDO ◀", W / 2, 575);

    ctx.fillStyle = isLightStyle ? "#1E0734" : "#FFFFFF";
    ctx.font = "900 72px 'Antonio', 'Outfit', sans-serif";
    ctx.fillText(winnerName.toUpperCase(), W / 2, 665);

    // Sello Central de Marcador o VS
    ctx.fillStyle = "#1E0734";
    ctx.beginPath();
    ctx.roundRect(180, 735, W - 360, 195, 38);
    ctx.fill();
    ctx.strokeStyle = "#00DC7D";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#00DC7D";
    ctx.font = "900 96px 'Antonio', 'Outfit', sans-serif";
    ctx.fillText(isDuelStyle ? `VS · ${scoreText}` : scoreText, W / 2, 868);

    // Nombre del Rival / Jugador B
    ctx.fillStyle = isLightStyle ? "rgba(30,7,52,0.65)" : "rgba(255,255,255,0.70)";
    ctx.font = "800 26px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(isDuelStyle ? "RIVAL DESAFIADO" : "FRENTE A", W / 2, 1025);

    ctx.fillStyle = isLightStyle ? "#1E0734" : "#FFFFFF";
    ctx.font = "900 60px 'Antonio', 'Outfit', sans-serif";
    ctx.fillText(loserName.toUpperCase(), W / 2, 1105);

    // Franja de Temporada dentro de la tarjeta
    ctx.fillStyle = isLightStyle ? "rgba(30,7,52,0.08)" : "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(165, 1185, W - 330, 110, 28);
    ctx.fill();

    ctx.fillStyle = isLightStyle ? "#1E0734" : "#6EF2B5";
    ctx.font = "800 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("RANKING OFICIAL DEL VALLE DEL MANTARO", W / 2, 1250);

    // 5. Pie del Póster 9:16
    ctx.fillStyle = isLightStyle ? "#1E0734" : "#FFFFFF";
    ctx.font = "800 34px 'Outfit', sans-serif";
    ctx.fillText("COMPITE · SUBE DE CATEGORÍA · GANA GEMAS", W / 2, 1540);

    ctx.fillStyle = "#00DC7D";
    ctx.font = "800 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("HUANCAYO · TEMPORADA OFICIAL 2026", W / 2, 1605);

    try {
      setPosterDataUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      // Silencioso
    }
    setIsRendering(false);
  }, [templateId, winnerName, loserName, scoreText, clubName, headlineTag, sponsors]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => renderStoryCanvas(), 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, renderStoryCanvas]);

  if (!isOpen) return null;

  const handleDownloadPoster = () => {
    triggerHaptic("success");
    if (!posterDataUrl) return;
    const link = document.createElement("a");
    link.href = posterDataUrl;
    link.download = `MATCHPOINT_Story_${winnerName.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNativeShare = async () => {
    triggerHaptic("hero");
    if (navigator.share && posterDataUrl) {
      try {
        const res = await fetch(posterDataUrl);
        const blob = await res.blob();
        const file = new File([blob], "matchpoint-story.png", { type: "image/png" });
        await navigator.share({
          title: "Resultado Oficial MATCHPOINT Huancayo",
          text: `${winnerName} vs ${loserName} (${scoreText}) en ${clubName} · Circuito Oficial MATCHPOINT`,
          files: [file],
        });
        return;
      } catch (err) {
        // Continúa al respaldo de WhatsApp si el usuario cancela
      }
    }
    const waText = encodeURIComponent(
      `🎾 *CIRCUITO OFICIAL MATCHPOINT HUANCAYO*\n🏆 *${winnerName}* vs. *${loserName}*\n📊 Marcador: *${scoreText}*\n📍 Sede: ${clubName}`
    );
    window.open(`https://wa.me/?text=${waText}`, "_blank", "noopener,noreferrer");
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Estudio de Póster Story 9:16"
      subtitle="Personaliza y comparte tu resultado o duelo en Instagram Stories y Estados de WhatsApp."
      badgeText="FORMATO 1080 × 1920 PX"
      iconName="share"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        {/* Selector de los 4 Estilos de Plantilla (Ronda 38) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { id: "victoria-oscuro", label: "Victoria Noche" },
            { id: "victoria-claro", label: "Victoria Marfil" },
            { id: "duelo-vs", label: "Duelo VS" },
            { id: "roundup-jornada", label: "Resumen WTA" },
          ].map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setTemplateId(tpl.id);
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-wta-display font-extrabold border mp-btn-tactile ${
                templateId === tpl.id
                  ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] shadow-sm"
                  : lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-white/8 border-white/15 text-white"
              }`}
            >
              {tpl.label}
            </button>
          ))}
        </div>

        {/* Vista Previa del Póster 9:16 */}
        <div className="flex justify-center">
          <div className="relative w-56 sm:w-64 aspect-[9/16] rounded-3xl overflow-hidden border-2 border-[#00DC7D] shadow-2xl bg-[#1E0734]">
            <canvas ref={canvasRef} className="hidden" />
            {posterDataUrl ? (
              <img
                src={posterDataUrl}
                alt="Vista previa Story 9:16"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                Generando póster...
              </div>
            )}
          </div>
        </div>

        {/* Controles Rápidos para Ajustar Nombres, Marcador y Sede */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-75">
              Tenista Ganador / Retador
            </label>
            <select
              value={winnerName}
              onChange={(e) => setWinnerName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/20 text-white"
              }`}
            >
              {players.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-75">
              Rival Enfrentado
            </label>
            <select
              value={loserName}
              onChange={(e) => setLoserName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/20 text-white"
              }`}
            >
              {players.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-75">
              Marcador Oficial
            </label>
            <input
              type="text"
              value={scoreText}
              onChange={(e) => setScoreText(e.target.value)}
              placeholder="Ej. 6-4, 6-3"
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/20 text-white"
              }`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-75">
              Sede del Encuentro
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/20 text-white"
              }`}
            />
          </div>
        </div>

        {/* Botones de Descarga Directa y Compartir en Redes */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadPoster}
            disabled={isRendering}
            className="py-3.5 px-4 rounded-2xl bg-white/12 hover:bg-white/20 text-current border border-current/20 font-wta-display font-extrabold text-xs flex items-center justify-center gap-1.5 mp-btn-tactile"
          >
            <WtaIcon name="download" size={16} className="text-[#00DC7D]" />
            <span>Descargar PNG</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            disabled={isRendering}
            className="py-3.5 px-4 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg"
          >
            <WtaIcon name="share" size={16} />
            <span>Compartir en Historias</span>
          </button>
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// === FIN DEL BLOQUE 7 DE 14 ===

// ============================================================================
// PARTE 8 DE 14: VISTA 3 — TORNEOS EN CARRUSEL HORIZONTAL, BARRA SEASON
// PROGRESS POR GIRAS, MODAL INTERACTIVO MASTER TOP 8 FINALS (TARJETA FLOTANTE
// + 3 FASES SOBRE MARFIL + GRUPOS A Y B), ÁRBOL DE LLAVES CON RONDA CONSUELO,
// PREMIOS TOP 3 DE TEMPORADA Y TARJETAS DE CAMPEONES CON BLOQUE WINNER ESMERALDA
// ============================================================================

// ----------------------------------------------------------------------------
// 1. MODAL INTERACTIVO DEL TORNEO DE MAESTROS (<MasterTop8FinalsModal/>)
//    Inspirado en la portada oficial de WTA Finals:
//    - Hero panorámico con tarjeta blanca flotante a la derecha.
//    - Barra de pestañas píldora (Resumen, Formato en 3 Fases, Grupos A y B,
//      Semifinales y Final).
//    - 3 tarjetas blancas sobre fondo Blanco Marfil (#FAF9F5) explicando las
//      3 etapas de forma visual.
//    - Simulación en vivo del Grupo A (Mantaro) y Grupo B (Huaytapallana) con
//      los 8 primeros tenistas reales del ranking.
// ----------------------------------------------------------------------------
export function MasterTop8FinalsModal({
  isOpen,
  onClose,
  players = INITIAL_PLAYERS,
  lightMode = false,
  onSelectPlayerProfile,
  onOpenDirectPayment,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'phases' | 'groups' | 'finals'
  const [divisionMode, setDivisionMode] = useState("general"); // 'general' | 'master40'

  const qualifiedTop8 = useMemo(() => {
    const sorted = [...players].sort((a, b) => Number(b.elo || 0) - Number(a.elo || 0));
    if (divisionMode === "master40") {
      const vets = sorted.filter((p) => Number(p.age || 30) >= 40);
      return (vets.length >= 4 ? vets : sorted).slice(0, 8);
    }
    return sorted.slice(0, 8);
  }, [players, divisionMode]);

  // Distribución oficial estilo Torneo de Maestros:
  // Grupo A (Mantaro): #1, #4, #5, #8 | Grupo B (Huaytapallana): #2, #3, #6, #7
  const groupAPlayers = useMemo(() => {
    const indices = [0, 3, 4, 7];
    return indices.map((idx, pos) => {
      const p = qualifiedTop8[idx] || qualifiedTop8[0];
      return {
        ...p,
        seedNumber: idx + 1,
        rrPlayed: 3,
        rrWins: pos === 0 ? 3 : pos === 1 ? 2 : pos === 2 ? 1 : 0,
        rrLosses: pos === 0 ? 0 : pos === 1 ? 1 : pos === 2 ? 2 : 3,
        setsBalance: pos === 0 ? "6-1" : pos === 1 ? "4-3" : pos === 2 ? "3-4" : "1-6",
        groupPoints: pos === 0 ? 6 : pos === 1 ? 4 : pos === 2 ? 2 : 0,
      };
    });
  }, [qualifiedTop8]);

  const groupBPlayers = useMemo(() => {
    const indices = [1, 2, 5, 6];
    return indices.map((idx, pos) => {
      const p = qualifiedTop8[idx] || qualifiedTop8[1] || qualifiedTop8[0];
      return {
        ...p,
        seedNumber: idx + 1,
        rrPlayed: 3,
        rrWins: pos === 0 ? 3 : pos === 1 ? 2 : pos === 2 ? 1 : 0,
        rrLosses: pos === 0 ? 0 : pos === 1 ? 1 : pos === 2 ? 2 : 3,
        setsBalance: pos === 0 ? "6-1" : pos === 1 ? "5-3" : pos === 2 ? "2-5" : "1-6",
        groupPoints: pos === 0 ? 6 : pos === 1 ? 4 : pos === 2 ? 2 : 0,
      };
    });
  }, [qualifiedTop8]);

  if (!isOpen) return null;

  const leaderA = groupAPlayers[0];
  const secondA = groupAPlayers[1];
  const leaderB = groupBPlayers[0];
  const secondB = groupBPlayers[1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] border mp-modal-sheet ${
          lightMode
            ? "bg-[#FAF9F5] text-[#1E0734] border-[#1E0734]/15"
            : "bg-[#1E0734] text-white border-[#00DC7D]/40"
        }`}
      >
        {/* Botón de cierre */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (onClose) onClose();
          }}
          aria-label="Cerrar Master Top 8"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white border border-white/25 flex items-center justify-center mp-close-btn"
        >
          <WtaIcon name="close" size={18} />
        </button>

        {/* Contenedor Scrolleable */}
        <div className="flex-1 overflow-y-auto overscroll-contain space-y-4 pb-6">
          {/* 1. PORTADA HERO CON TARJETA BLANCA FLOTANTE A LA DERECHA (ESTILO WTA FINALS) */}
          <div className="relative p-4 sm:p-6 pt-5 overflow-hidden bg-[#160428] text-white">
            <SmartImage
              src={ASSETS.torneoMasterTop8}
              alt="Master Top 8 Finals"
              className="absolute inset-0 w-full h-full object-cover opacity-45"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(22,4,40,0.65) 0%, rgba(30,7,52,0.5) 45%, rgba(30,7,52,0.98) 100%)",
              }}
            />

            {/* Breadcrumb Superior + Pastilla Verde de Evento */}
            <div className="relative z-10 flex items-center justify-between gap-2 pr-10 mb-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/75">
                <span>Torneos</span>
                <span>›</span>
                <span className="text-[#00DC7D] font-extrabold">Master Top 8 Finals</span>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-[#00A859] text-white text-[10px] font-wta-display font-extrabold uppercase tracking-wider">
                CIERRE DE TEMPORADA
              </span>
            </div>

            {/* Grid Hero: Izquierda Título Monumental / Derecha Tarjeta Blanca Flotante */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-7 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider">
                  <WtaIcon name="trophy" size={12} />
                  <span>LOS 8 MEJORES DEL AÑO</span>
                </span>

                <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold uppercase tracking-tight text-white leading-none">
                  TORNEO DE MAESTROS · MASTER TOP 8 HUANCAYO
                </h2>

                <p className="text-xs text-white/80 leading-relaxed">
                  Sede Central Country Club Los Huancas · Formato Todos contra Todos en
                  2 grupos de 4 tenistas + Semifinales y Gran Final.
                </p>

                {/* Selector de División Top 8 */}
                <div className="pt-1 inline-flex rounded-full p-1 bg-white/10 border border-white/15">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("tab");
                      setDivisionMode("general");
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-wta-display font-extrabold transition-all ${
                      divisionMode === "general"
                        ? "bg-[#00DC7D] text-[#1E0734]"
                        : "text-white/80"
                    }`}
                  >
                    Top 8 General
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("tab");
                      setDivisionMode("master40");
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-wta-display font-extrabold transition-all ${
                      divisionMode === "master40"
                        ? "bg-[#F59E0B] text-[#1E0734]"
                        : "text-white/80"
                    }`}
                  >
                    Top 8 +40 Master
                  </button>
                </div>
              </div>

              {/* TARJETA BLANCA FLOTANTE A LA DERECHA (ESTILO WTA FINALS CARD) */}
              <div className="sm:col-span-5 bg-white text-[#1E0734] rounded-2xl p-3.5 shadow-2xl border border-white flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SmartImage
                      src={ASSETS.trofeoMasterTop8}
                      alt="Copa Master"
                      className="w-9 h-9 object-contain"
                    />
                    <div>
                      <span className="px-2 py-0.2 rounded bg-[#1E0734] text-[#00DC7D] text-[9px] font-wta-display font-black uppercase">
                        FINALS OFICIAL
                      </span>
                      <div className="text-[11px] font-extrabold text-[#C85A32] mt-0.5">
                        SUPERFICIE: ARCILLA
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-[#1E0734]/10">
                  <div className="font-wta-condensed text-xl font-bold uppercase text-[#1E0734] leading-none">
                    CARRERA EN VIVO
                  </div>
                  <div className="text-[11px] font-bold text-[#1E0734]/70 mt-0.5">
                    18 – 20 Diciembre 2026 · 8 Cupos
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#1E0734]/10 text-[11px] font-extrabold">
                  <span className="text-[#00A859]">Premio: +1,000 Gemas</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#1E0734] text-white text-[10px]">
                    Inscripción S/ 80
                  </span>
                </div>
              </div>
            </div>

            {/* BARRA DE PESTAÑAS PÍLDORA DEBAJO DEL HERO (LA ACTIVA EN BLANCO SÓLIDO) */}
            <div className="relative z-10 mt-5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: "overview", label: "Clasificados Top 8" },
                { id: "phases", label: "Formato en 3 Fases" },
                { id: "groups", label: "Grupos A y B" },
                { id: "finals", label: "Semifinales y Final" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setActiveTab(tab.id);
                  }}
                  className={`px-3.5 py-2 rounded-full text-xs font-wta-display font-extrabold shrink-0 wta-pill-tab ${
                    activeTab === tab.id
                      ? "wta-pill-tab-active"
                      : "wta-pill-tab-inactive"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. CONTENIDO SEGÚN PESTAÑA SELECCIONADA */}
          <div className="px-4 sm:px-6 space-y-4">
            {/* PESTAÑA A: LOS 8 CLASIFICADOS ACTUALES */}
            {activeTab === "overview" && (
              <div className="space-y-3 mp-view-enter">
                <div className="flex items-center justify-between">
                  <h3 className="font-wta-condensed text-xl sm:text-2xl font-bold uppercase">
                    LOS 8 CLASIFICADOS AL DÍA DE HOY
                  </h3>
                  <span className="text-xs font-bold text-[#00DC7D]">
                    Corte directo por Ranking
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {qualifiedTop8.map((p, idx) => {
                    const cat = getCategoryByElo(p.elo);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          triggerHaptic("card");
                          if (onSelectPlayerProfile) onSelectPlayerProfile(p);
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer wta-card-aura ${
                          lightMode
                            ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                            : "bg-[#23083C] border-white/12 text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-xl bg-[#00DC7D] text-[#1E0734] font-wta-condensed font-bold text-base flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <SmartImage
                            src={p.avatar}
                            alt={p.name}
                            isAvatar
                            className="w-10 h-10 rounded-xl object-cover border border-[#00DC7D]/50 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-extrabold truncate">
                              {p.name}
                            </div>
                            <div className="text-[10px] opacity-70 truncate">
                              {cat.name} · {p.club}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-wta-condensed text-lg font-bold text-[#00DC7D] tabular-nums">
                            {p.elo} PTS
                          </div>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-current/10">
                            Semilla {idx + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PESTAÑA B: FORMATO EN 3 FASES SOBRE MARFIL (#FAF9F5 — RONDA 21) */}
            {activeTab === "phases" && (
              <div className="rounded-3xl p-4 sm:p-5 bg-[#FAF9F5] text-[#1E0734] border border-[#1E0734]/12 space-y-4 mp-view-enter">
                <div className="text-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
                    CÓMO SE JUEGA EL MASTER TOP 8
                  </span>
                  <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase text-[#1E0734] mt-1">
                    FORMATO OFICIAL EN 3 ETAPAS
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      phase: "FASE 1",
                      title: "Clasificación Anual Top 8",
                      desc: "Durante la temporada sumas puntos en retos y torneos. Los 8 tenistas con mayor puntaje aseguran su boleto directo.",
                      img: ASSETS.torneoApertura,
                      badge: "Puestos #1 al #8",
                    },
                    {
                      phase: "FASE 2",
                      title: "Fase de Grupos (Todos contra Todos)",
                      desc: "Se dividen en Grupo Mantaro (4) y Grupo Huaytapallana (4). Cada tenista juega 3 partidos asegurados; avanzan los 2 mejores de cada grupo.",
                      img: ASSETS.torneoAltura,
                      badge: "3 Partidos Mínimo",
                    },
                    {
                      phase: "FASE 3",
                      title: "Semifinales Cruzadas y Gran Final",
                      desc: "El 1° del Grupo A enfrenta al 2° del Grupo B, y el 1° del Grupo B al 2° del Grupo A. Los ganadores disputan la Copa de Maestros.",
                      img: ASSETS.torneoMasterTop8,
                      badge: "Campeón del Año",
                    },
                  ].map((item) => (
                    <div
                      key={item.phase}
                      className="rounded-2xl bg-white border border-[#1E0734]/10 p-3.5 shadow-sm flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-2">
                        <div className="relative h-28 rounded-xl overflow-hidden">
                          <SmartImage
                            src={item.img}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase">
                            {item.phase}
                          </span>
                        </div>

                        <h4 className="font-wta-condensed text-lg font-bold uppercase text-[#1E0734]">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#1E0734]/75 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#1E0734]/10 flex items-center justify-between text-[11px] font-extrabold text-[#00A859]">
                        <span>{item.badge}</span>
                        <span>✓ Oficial</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PESTAÑA C: SIMULACIÓN EN VIVO GRUPOS A (MANTARO) Y B (HUAYTAPALLANA) */}
            {activeTab === "groups" && (
              <div className="space-y-4 mp-view-enter">
                {[
                  {
                    groupTitle: "GRUPO A · VALLE DEL MANTARO",
                    subtitle: "Cabezas de serie #1, #4, #5 y #8",
                    rows: groupAPlayers,
                  },
                  {
                    groupTitle: "GRUPO B · NEVADO HUAYTAPALLANA",
                    subtitle: "Cabezas de serie #2, #3, #6 y #7",
                    rows: groupBPlayers,
                  },
                ].map((grp) => (
                  <div
                    key={grp.groupTitle}
                    className={`rounded-3xl overflow-hidden border shadow-md ${
                      lightMode
                        ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                        : "bg-[#23083C] border-white/12 text-white"
                    }`}
                  >
                    <div className="px-4 py-3 bg-gradient-to-r from-[#00A859] to-[#00DC7D] text-[#1E0734] flex items-center justify-between">
                      <div>
                        <h4 className="font-wta-condensed text-lg font-bold uppercase leading-none">
                          {grp.groupTitle}
                        </h4>
                        <span className="text-[11px] font-bold opacity-85">
                          {grp.subtitle}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-extrabold">
                        Avanzan Top 2
                      </span>
                    </div>

                    <div className="divide-y divide-current/10">
                      {grp.rows.map((r, idx) => {
                        const qualifiesToSemis = idx < 2;
                        return (
                          <div
                            key={r.id}
                            className={`p-3 flex items-center justify-between gap-2 text-xs ${
                              qualifiesToSemis ? "bg-[#00DC7D]/8" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-lg font-wta-condensed font-bold text-sm flex items-center justify-center shrink-0 ${
                                  qualifiesToSemis
                                    ? "bg-[#00DC7D] text-[#1E0734]"
                                    : "bg-current/10"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <SmartImage
                                src={r.avatar}
                                alt={r.name}
                                isAvatar
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-extrabold block truncate">
                                  {r.name}
                                </span>
                                <span className="text-[10px] opacity-65">
                                  Semilla #{r.seedNumber} · {r.elo} pts
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 tabular-nums font-bold">
                              <span className="text-[11px] opacity-75">
                                {r.rrWins}G - {r.rrLosses}P
                              </span>
                              <span className="text-[11px] opacity-75 hidden xs:inline">
                                Sets {r.setsBalance}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-[#00DC7D] text-[#1E0734] font-extrabold">
                                {r.groupPoints} pts
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PESTAÑA D: CRUCES DE SEMIFINALES Y GRAN FINAL */}
            {activeTab === "finals" && (
              <div className="space-y-3 mp-view-enter">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Semifinal 1: 1° Grupo A vs 2° Grupo B */}
                  <div
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      lightMode
                        ? "bg-white border-[#1E0734]/12"
                        : "bg-[#23083C] border-white/15"
                    }`}
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
                      SEMIFINAL CRUZADA 1 (1°A vs 2°B)
                    </span>
                    <div className="flex items-center justify-between text-xs font-extrabold pt-1">
                      <span>{leaderA?.name}</span>
                      <span className="text-[#00DC7D]">1° Grupo A</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-extrabold pt-2 border-t border-current/10">
                      <span>{secondB?.name}</span>
                      <span className="opacity-70">2° Grupo B</span>
                    </div>
                  </div>

                  {/* Semifinal 2: 1° Grupo B vs 2° Grupo A */}
                  <div
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      lightMode
                        ? "bg-white border-[#1E0734]/12"
                        : "bg-[#23083C] border-white/15"
                    }`}
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
                      SEMIFINAL CRUZADA 2 (1°B vs 2°A)
                    </span>
                    <div className="flex items-center justify-between text-xs font-extrabold pt-1">
                      <span>{leaderB?.name}</span>
                      <span className="text-[#00DC7D]">1° Grupo B</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-extrabold pt-2 border-t border-current/10">
                      <span>{secondA?.name}</span>
                      <span className="opacity-70">2° Grupo A</span>
                    </div>
                  </div>
                </div>

                {/* Gran Final por la Copa de Maestros */}
                <div className="p-4 rounded-3xl bg-gradient-to-r from-[#290C46] via-[#1E0734] to-[#00A859]/40 text-white border-2 border-[#00DC7D] flex items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
                      GRAN FINAL DE TEMPORADA
                    </span>
                    <h4 className="font-wta-condensed text-2xl font-bold uppercase mt-1">
                      GANADOR SEMIFINAL 1 vs. GANADOR SEMIFINAL 2
                    </h4>
                    <p className="text-xs text-white/80 mt-0.5">
                      Cancha Central Country Club Los Huancas · Grabación MatchPoint
                      Vision IA incluida.
                    </p>
                  </div>
                  <SmartImage
                    src={ASSETS.trofeoMasterTop8}
                    alt="Copa"
                    className="w-16 h-16 object-contain shrink-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie del Modal: Confirmar Participación / Inscripción Directa */}
        <div
          className={`px-4 py-3 border-t flex items-center justify-between gap-2 shrink-0 ${
            lightMode
              ? "bg-white border-[#1E0734]/10"
              : "bg-[#160428] border-white/12"
          }`}
        >
          <div className="text-xs">
            <span className="opacity-70 block">Derecho de participación:</span>
            <strong className="text-sm font-extrabold text-[#00DC7D]">
              S/ 80 Regular · S/ 65 Socio VIP
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              if (onOpenDirectPayment) {
                onOpenDirectPayment({
                  conceptTitle: "Inscripción Master Top 8 Finals",
                  amountSoles: 80,
                  vipAmountSoles: 65,
                  itemType: "tournament",
                  referenceId: "torneo-master-top8",
                });
              }
            }}
            className="py-3 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <WtaIcon name="trophy" size={16} />
            <span>Confirmar mi cupo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2. MODAL COMPLETO DE DETALLE DE TORNEO Y ÁRBOL DE LLAVES CON RONDA CONSUELO
//    (<TournamentFullDetailModal/>)
//    Muestra inscritos, premios, Cuadro Principal (Cuartos -> Semis -> Final)
//    y Ronda Consuelo (para quienes caen en el primer partido).
// ----------------------------------------------------------------------------
export function TournamentFullDetailModal({
  tournament,
  players = INITIAL_PLAYERS,
  currentUser,
  lightMode = false,
  onClose,
  onSelectPlayerProfile,
  onOpenDirectPayment,
}) {
  const [tab, setTab] = useState("draws"); // 'draws' | 'consolation' | 'players' | 'info'

  if (!tournament) return null;

  const enrolledPlayers = players.filter((p) =>
    (tournament.registeredPlayerIds || []).includes(p.id)
  );
  const hasBracket =
    Array.isArray(tournament.bracket?.quarters) &&
    tournament.bracket.quarters.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] border mp-modal-sheet ${
          lightMode
            ? "bg-[#FAF9F5] text-[#1E0734] border-[#1E0734]/15"
            : "bg-[#1E0734] text-white border-[#00DC7D]/40"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (onClose) onClose();
          }}
          aria-label="Cerrar torneo"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/55 text-white border border-white/25 flex items-center justify-center mp-close-btn"
        >
          <WtaIcon name="close" size={18} />
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain space-y-4 pb-6">
          {/* Cabecera Hero con Ficha Blanca Flotante */}
          <div className="relative p-4 sm:p-6 pt-5 overflow-hidden bg-[#160428] text-white">
            <SmartImage
              src={tournament.coverAsset}
              alt={tournament.name}
              className="absolute inset-0 w-full h-full object-cover opacity-45"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(22,4,40,0.6) 0%, rgba(30,7,52,0.45) 45%, rgba(30,7,52,0.98) 100%)",
              }}
            />

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pt-3">
              <div className="sm:col-span-7 space-y-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider">
                  {tournament.statusLabel}
                </span>
                <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold uppercase text-white leading-none">
                  {tournament.name}
                </h2>
                <p className="text-xs text-white/85 font-semibold">
                  {tournament.club} · {tournament.datesLabel}
                </p>
              </div>

              {/* Ficha Blanca Flotante Derecha */}
              <div className="sm:col-span-5 bg-white text-[#1E0734] rounded-2xl p-3.5 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SmartImage
                      src={tournament.clubLogo}
                      alt={tournament.club}
                      className="w-7 h-7 rounded-full object-contain"
                    />
                    <span className="text-xs font-extrabold truncate">
                      {tournament.city}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#C85A32] text-white text-[9px] font-extrabold uppercase">
                    {tournament.surface}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-[#1E0734]/10 flex items-center justify-between text-xs font-extrabold">
                  <span>Cupos confirmados:</span>
                  <span className="text-[#00A859]">
                    {tournament.spotsTaken} / {tournament.spotsTotal}
                  </span>
                </div>

                <div className="text-[11px] font-bold text-[#1E0734]/75">
                  Campeón: +{tournament.championGemsReward} Gemas
                </div>
              </div>
            </div>

            {/* Píldoras de Navegación del Torneo */}
            <div className="relative z-10 mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: "draws", label: "Cuadro Principal" },
                { id: "consolation", label: "Ronda Consuelo" },
                { id: "players", label: `Inscritos (${enrolledPlayers.length})` },
                { id: "info", label: "Premios y Categorías" },
              ].map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setTab(tItem.id);
                  }}
                  className={`px-3.5 py-2 rounded-full text-xs font-wta-display font-extrabold shrink-0 wta-pill-tab ${
                    tab === tItem.id
                      ? "wta-pill-tab-active"
                      : "wta-pill-tab-inactive"
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cuerpo según Pestaña */}
          <div className="px-4 sm:px-6 space-y-4">
            {/* PESTAÑA 1: ÁRBOL VISUAL DE LLAVES (CUARTOS -> SEMIS -> FINAL) */}
            {tab === "draws" && (
              <div className="space-y-4 mp-view-enter">
                {!hasBracket ? (
                  <div
                    className={`p-5 rounded-3xl border text-center space-y-2 ${
                      lightMode
                        ? "bg-white border-[#1E0734]/12"
                        : "bg-[#23083C] border-white/12"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#00DC7D]/20 text-[#00DC7D] flex items-center justify-center mx-auto">
                      <WtaIcon name="trophy" size={24} />
                    </div>
                    <h4 className="font-wta-condensed text-2xl font-bold uppercase">
                      SORTEO DE LLAVES AL CIERRE DE INSCRIPCIONES
                    </h4>
                    <p className="text-xs opacity-75 max-w-md mx-auto">
                      El cuadro eliminatorio se publica automáticamente con cabezas de
                      serie según el Ranking Oficial de Huancayo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cuartos de Final */}
                    <div>
                      <h4 className="font-wta-condensed text-lg font-bold uppercase tracking-wider text-[#00DC7D] mb-2">
                        CUARTOS DE FINAL
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {tournament.bracket.quarters.map((qf) => (
                          <div
                            key={qf.id}
                            className={`p-3 rounded-2xl border space-y-1.5 text-xs ${
                              lightMode
                                ? "bg-white border-[#1E0734]/12"
                                : "bg-[#23083C] border-white/12"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold opacity-65">
                              <span>{qf.roundLabel}</span>
                              <span className="text-[#00DC7D]">{qf.score}</span>
                            </div>
                            <div className="flex items-center justify-between font-extrabold">
                              <span
                                className={
                                  qf.winner === qf.playerA
                                    ? "text-[#00DC7D]"
                                    : "opacity-75"
                                }
                              >
                                {qf.playerA} {qf.winner === qf.playerA ? "◀" : ""}
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-extrabold pt-1 border-t border-current/10">
                              <span
                                className={
                                  qf.winner === qf.playerB
                                    ? "text-[#00DC7D]"
                                    : "opacity-75"
                                }
                              >
                                {qf.playerB} {qf.winner === qf.playerB ? "◀" : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Semifinales */}
                    {Array.isArray(tournament.bracket.semis) &&
                      tournament.bracket.semis.length > 0 && (
                        <div>
                          <h4 className="font-wta-condensed text-lg font-bold uppercase tracking-wider text-[#00DC7D] mb-2">
                            SEMIFINALES
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {tournament.bracket.semis.map((sf) => (
                              <div
                                key={sf.id}
                                className={`p-3.5 rounded-2xl border-2 border-[#00DC7D]/45 space-y-1.5 text-xs ${
                                  lightMode ? "bg-white" : "bg-[#290C46]"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-extrabold text-[#00DC7D]">
                                  <span>{sf.roundLabel}</span>
                                  <span>{sf.score}</span>
                                </div>
                                <div className="font-extrabold">
                                  {sf.playerA} {sf.winner === sf.playerA ? "◀" : ""}
                                </div>
                                <div className="font-extrabold pt-1 border-t border-current/10">
                                  {sf.playerB} {sf.winner === sf.playerB ? "◀" : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Gran Final */}
                    {tournament.bracket.final && (
                      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#290C46] via-[#1E0734] to-[#00A859]/35 text-white border-2 border-[#00DC7D] flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
                            {tournament.bracket.final.roundLabel}
                          </span>
                          <div className="font-wta-condensed text-2xl font-bold uppercase">
                            {tournament.bracket.final.playerA} vs.{" "}
                            {tournament.bracket.final.playerB}
                          </div>
                          <div className="text-xs text-[#6EF2B5] font-bold">
                            {tournament.bracket.final.score}
                          </div>
                        </div>
                        <SmartImage
                          src={ASSETS.trofeoCampeonGira}
                          alt="Trofeo"
                          className="w-14 h-14 object-contain shrink-0"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 2: RONDA CONSUELO AUTOMÁTICA */}
            {tab === "consolation" && (
              <div className="space-y-3 mp-view-enter">
                <div className="p-3.5 rounded-2xl bg-[#00DC7D]/12 border border-[#00DC7D]/35 text-xs">
                  <strong className="font-extrabold text-[#00DC7D] block mb-0.5">
                    Garantía de 2 Partidos por Inscripción:
                  </strong>
                  <span>
                    Todos los jugadores que caen en primera ronda pasan automáticamente
                    al cuadro de Ronda Consuelo para seguir compitiendo en cancha.
                  </span>
                </div>

                {Array.isArray(tournament.bracket?.consolationSemis) &&
                tournament.bracket.consolationSemis.length > 0 ? (
                  <div className="space-y-2.5">
                    {tournament.bracket.consolationSemis.map((cs) => (
                      <div
                        key={cs.id}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                          lightMode
                            ? "bg-white border-[#1E0734]/12"
                            : "bg-[#23083C] border-white/12"
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold text-[#00DC7D] block">
                            {cs.roundLabel}
                          </span>
                          <span className="font-extrabold">
                            {cs.playerA} vs. {cs.playerB}
                          </span>
                        </div>
                        <span className="font-wta-condensed text-base font-bold text-[#00DC7D]">
                          {cs.score}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-current/10 text-xs text-center opacity-75">
                    Las llaves de consuelo se habilitan al finalizar la primera ronda.
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: LISTA DE INSCRITOS CONFIRMADOS */}
            {tab === "players" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mp-view-enter">
                {enrolledPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (onSelectPlayerProfile) onSelectPlayerProfile(p);
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer wta-card-aura ${
                      lightMode
                        ? "bg-white border-[#1E0734]/12"
                        : "bg-[#23083C] border-white/12"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#00DC7D]/20 text-[#00DC7D] font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <SmartImage
                        src={p.avatar}
                        alt={p.name}
                        isAvatar
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate">{p.name}</div>
                        <div className="text-[10px] opacity-70 truncate">{p.club}</div>
                      </div>
                    </div>
                    <span className="font-wta-condensed text-base font-bold text-[#00DC7D] shrink-0">
                      {p.elo} PTS
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* PESTAÑA 4: PREMIOS Y CATEGORÍAS HABILITADAS */}
            {tab === "info" && (
              <div className="space-y-3 mp-view-enter">
                <div
                  className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    lightMode
                      ? "bg-white border-[#1E0734]/12"
                      : "bg-[#23083C] border-white/12"
                  }`}
                >
                  <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D]">
                    BOLSA DE PREMIOS Y PUNTOS
                  </span>
                  <p className="font-extrabold text-sm">{tournament.prizePoolText}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {(tournament.categories || []).map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-xl bg-[#00DC7D]/15 text-[#00DC7D] font-bold text-xs"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra Inferior de Inscripción Directa (Venta Directa Yape/Plin — Blindaje SBS) */}
        <div
          className={`px-4 py-3 border-t flex items-center justify-between gap-2 shrink-0 ${
            lightMode
              ? "bg-white border-[#1E0734]/10"
              : "bg-[#160428] border-white/12"
          }`}
        >
          <div className="text-xs">
            <span className="opacity-70 block">Inscripción oficial:</span>
            <strong className="text-sm font-extrabold text-[#00DC7D]">
              S/ {tournament.entryFeeSoles} Regular · S/ {tournament.vipEntryFeeSoles}{" "}
              Socio VIP
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              if (onOpenDirectPayment) {
                onOpenDirectPayment({
                  conceptTitle: `Inscripción: ${tournament.shortTitle}`,
                  amountSoles: currentUser?.isVip
                    ? tournament.vipEntryFeeSoles
                    : tournament.entryFeeSoles,
                  regularAmountSoles: tournament.entryFeeSoles,
                  vipAmountSoles: tournament.vipEntryFeeSoles,
                  itemType: "tournament",
                  referenceId: tournament.id,
                });
              }
            }}
            className="py-3 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg"
          >
            <WtaIcon name="trophy" size={16} />
            <span>Inscribirme al Torneo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. VISTA PRINCIPAL 3: TORNEOS HORIZONTALES, SEASON PROGRESS, PREMIOS TOP 3
//    Y SALÓN DE LA FAMA CON TARJETAS WINNER ESMERALDA
//    (<TournamentsAndHallOfFameView/>)
// ----------------------------------------------------------------------------
export function TournamentsAndHallOfFameView({
  tournaments = INITIAL_TOURNAMENTS,
  players = INITIAL_PLAYERS,
  currentUser,
  lightMode = false,
  onOpenTournamentDetail,
  onOpenMasterTop8,
  onSelectPlayerProfile,
  onOpenH2HWithPlayers,
  onOpenDirectPayment,
}) {
  const [calendarFilter, setCalendarFilter] = useState("all"); // 'all' | 'in_progress' | 'upcoming' | 'finals_race'
  const carouselRef = useRef(null);

  const visibleTournaments = useMemo(() => {
    if (calendarFilter === "all") return tournaments;
    return tournaments.filter((t) => t.status === calendarFilter);
  }, [tournaments, calendarFilter]);

  return (
    <div className="space-y-4 px-3.5 sm:px-5 pt-2 pb-5 mp-view-enter">
      {/* 1. BARRA DE PROGRESO ANUAL POR GIRAS (SEASON PROGRESS — RONDA 20) */}
      <div
        className="rounded-3xl p-4 sm:p-5 text-[#1E0734] shadow-lg relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #00DC7D 0%, #6EF2B5 55%, #E4FDF0 100%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
              CALENDARIO ANUAL · 4 GIRAS OFICIALES
            </span>
            <h1 className="font-wta-condensed text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E0734] leading-none mt-1">
              TORNEOS Y GIRA DEL VALLE
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              if (onOpenMasterTop8) onOpenMasterTop8();
            }}
            className="px-4 py-2 rounded-full bg-[#1E0734] text-[#00DC7D] font-wta-display font-extrabold text-xs flex items-center gap-1.5 shadow-md mp-btn-tactile"
          >
            <WtaIcon name="trophy" size={14} className="text-[#F59E0B]" />
            <span>Master Top 8 Finals</span>
          </button>
        </div>

        {/* Línea Segmentada de las 4 Giras de Huancayo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SEASON_TOURS_PROGRESS.map((tour) => (
            <div
              key={tour.id}
              className="p-2.5 rounded-2xl bg-white/85 backdrop-blur-sm border border-[#1E0734]/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-extrabold text-[#1E0734]/65">
                  <span>{tour.period}</span>
                  <span className="text-[#C85A32]">{tour.surface}</span>
                </div>
                <div className="font-wta-display text-xs font-black text-[#1E0734] leading-tight mt-0.5">
                  {tour.name}
                </div>
              </div>

              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-[#1E0734]/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00A859]"
                    style={{ width: `${tour.progressPct}%` }}
                  />
                </div>
                <div className="text-[10px] font-bold text-[#1E0734]/75 mt-1 truncate">
                  {tour.championName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CARRUSEL HORIZONTAL DESLIZABLE DE TORNEOS (RONDA 20 Y 29) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "Todos los torneos" },
              { id: "in_progress", label: "En curso" },
              { id: "upcoming", label: "Inscripciones abiertas" },
              { id: "finals_race", label: "Master Top 8" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setCalendarFilter(f.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-wta-display font-extrabold shrink-0 wta-pill-tab ${
                  calendarFilter === f.id
                    ? "wta-pill-tab-active"
                    : lightMode
                    ? "bg-white text-[#1E0734]/80 border border-[#1E0734]/15"
                    : "wta-pill-tab-inactive"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Botones Circulares < > para Deslizar el Carrusel Horizontal */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                if (carouselRef.current) {
                  carouselRef.current.scrollBy({ left: -290, behavior: "smooth" });
                }
              }}
              aria-label="Torneo anterior"
              className={`w-8 h-8 rounded-full border flex items-center justify-center mp-btn-tactile ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-white/10 border-white/15 text-white"
              }`}
            >
              <WtaIcon name="chevron-left" size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                if (carouselRef.current) {
                  carouselRef.current.scrollBy({ left: 290, behavior: "smooth" });
                }
              }}
              aria-label="Siguiente torneo"
              className={`w-8 h-8 rounded-full border flex items-center justify-center mp-btn-tactile ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-white/10 border-white/15 text-white"
              }`}
            >
              <WtaIcon name="chevron-right" size={16} />
            </button>
          </div>
        </div>

        {/* Tarjetas Horizontales Deslizables (scroll-snap) con Textura de Arcilla */}
        <div ref={carouselRef} className="mp-horizontal-snap gap-3.5 pb-2">
          {visibleTournaments.map((trn) => {
            const isMaster = trn.id === "torneo-master-top8";
            return (
              <div
                key={trn.id}
                onClick={() => {
                  triggerHaptic("card");
                  if (isMaster && onOpenMasterTop8) {
                    onOpenMasterTop8();
                  } else if (onOpenTournamentDetail) {
                    onOpenTournamentDetail(trn);
                  }
                }}
                className="mp-snap-card relative w-[86vw] max-w-[350px] sm:w-[350px] rounded-3xl overflow-hidden border border-white/20 shadow-xl cursor-pointer group wta-card-aura flex flex-col justify-between min-h-[258px] p-4 text-white"
              >
                <SmartImage
                  src={trn.coverAsset}
                  alt={trn.name}
                  className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(30,7,52,0.55) 0%, rgba(30,7,52,0.22) 38%, rgba(30,7,52,0.92) 78%, rgba(20,4,36,0.98) 100%)",
                  }}
                />

                {/* Fila Superior: Estado + Escudo del Club */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-wta-display font-black uppercase tracking-wider shadow-sm ${
                      trn.status === "in_progress"
                        ? "bg-white text-[#1E0734]"
                        : isMaster
                        ? "bg-[#F59E0B] text-[#1E0734]"
                        : "bg-[#00DC7D] text-[#1E0734]"
                    }`}
                  >
                    {trn.statusLabel}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#C85A32] text-white text-[9px] font-extrabold uppercase">
                      {trn.surface}
                    </span>
                    <SmartImage
                      src={trn.clubLogo}
                      alt={trn.club}
                      className="w-7 h-7 rounded-full object-contain bg-white p-0.5"
                    />
                  </div>
                </div>

                {/* Centro y Base de la Tarjeta de Torneo */}
                <div className="relative z-10 mt-10 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6EF2B5]">
                    {trn.city} · {trn.datesLabel}
                  </div>

                  <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase text-white leading-none">
                    {trn.shortTitle}
                  </h3>

                  <p className="text-xs text-white/80 line-clamp-2">
                    {trn.prizePoolText}
                  </p>

                  <div className="pt-2.5 border-t border-white/15 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-white/65 block text-[10px]">
                        Inscripción:
                      </span>
                      <strong className="font-extrabold text-[#00DC7D]">
                        S/ {trn.entryFeeSoles}{" "}
                        <span className="text-[10px] text-white/80">
                          (VIP S/ {trn.vipEntryFeeSoles})
                        </span>
                      </strong>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-[#1E0734] group-hover:bg-[#00DC7D] font-wta-display font-extrabold text-xs shadow-md transition-colors">
                      <span>Ver cuadro y llaves</span>
                      <WtaIcon name="arrow-right" size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. VITRINA DE PREMIOS OFICIALES AL TOP 3 DE LA TEMPORADA */}
      <div
        className={`rounded-3xl p-4 sm:p-5 border space-y-3 ${
          lightMode
            ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
            : "bg-[#23083C] border-[#F59E0B]/35 text-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider">
              RECOMPENSAS ANUALES DEL CIRCUITO
            </span>
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase mt-1">
              PREMIOS OFICIALES AL TOP 3 DE TEMPORADA
            </h3>
          </div>
          <SmartImage
            src={ASSETS.trofeoMasterTop8}
            alt="Premios Top 3"
            className="w-11 h-11 object-contain"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {SEASON_TOP3_PRIZES.map((prz) => (
            <div
              key={prz.rank}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 ${
                prz.rank === 1
                  ? "bg-gradient-to-br from-[#F59E0B]/20 via-transparent to-[#00DC7D]/10 border-[#F59E0B]"
                  : lightMode
                  ? "bg-[#FAF9F5] border-[#1E0734]/10"
                  : "bg-[#1E0734] border-white/12"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-wta-display font-black uppercase"
                    style={{
                      backgroundColor: prz.accentHex,
                      color: "#1E0734",
                    }}
                  >
                    PUESTO #{prz.rank} · {prz.badgeLabel}
                  </span>
                  <span className="text-xs font-extrabold text-[#00DC7D]">
                    +{prz.gemsBonus} Gemas
                  </span>
                </div>

                <h4 className="font-wta-condensed text-lg font-bold uppercase">
                  {prz.title}
                </h4>

                <p className="text-xs opacity-85 leading-relaxed">
                  {prz.prizeSummary}
                </p>
              </div>

              <div className="pt-2 border-t border-current/10 text-[11px] font-bold text-[#00DC7D]">
                ★ {prz.digitalHonor}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SALÓN DE LA FAMA CON BLOQUE DERECHO "GANADOR / WINNER" EN DEGRADADO
          VERDE ESMERALDA (CALCADO DE LAS TARJETAS DE CAMPEONES WTA — RONDA 20) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
              CUADRO DE HONOR · HUANCAYO
            </span>
            <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase">
              CAMPEONES RECIENTES DE GIRA
            </h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {PAST_CHAMPIONS_HALL.map((item) => {
            const champPlayer =
              players.find((p) => p.id === item.winnerId) || players[0];

            return (
              <div
                key={item.id}
                className="rounded-3xl overflow-hidden border border-white/15 shadow-lg grid grid-cols-1 sm:grid-cols-12 bg-white text-[#1E0734] wta-card-aura"
              >
                {/* Columna Izquierda: Fecha sobre Púrpura Noche + Datos del Torneo en Blanco */}
                <div className="sm:col-span-7 p-4 flex items-center gap-3.5 bg-white">
                  <div className="px-3 py-2.5 rounded-2xl bg-[#1E0734] text-white text-center shrink-0">
                    <span className="font-wta-condensed text-lg font-bold text-[#00DC7D] block leading-none">
                      {item.dateText}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/75 block mt-0.5">
                      {item.surface}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#C85A32] block">
                      {item.category}
                    </span>
                    <h4 className="font-wta-condensed text-xl sm:text-2xl font-bold uppercase text-[#1E0734] truncate">
                      {item.tournamentName}
                    </h4>
                    <p className="text-xs font-semibold text-[#1E0734]/70 truncate">
                      {item.club} · Final: {item.score} vs. {item.finalistName}
                    </p>
                  </div>
                </div>

                {/* Columna Derecha: Bloque Integrado en Degradado Verde Esmeralda WINNER */}
                <div
                  className="sm:col-span-5 p-3.5 flex items-center justify-between gap-2 text-[#1E0734]"
                  style={{
                    background:
                      "linear-gradient(135deg, #00DC7D 0%, #6EF2B5 65%, #C2F9DF 100%)",
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SmartImage
                      src={champPlayer?.avatar}
                      alt={item.winnerName}
                      isAvatar
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-[#1E0734] shadow-md shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="px-2 py-0.2 rounded bg-[#1E0734] text-[#00DC7D] text-[9px] font-wta-display font-black uppercase tracking-wider">
                        CAMPEÓN
                      </span>
                      <div className="font-wta-condensed text-xl font-bold uppercase text-[#1E0734] truncate mt-0.5">
                        {item.winnerSurname}
                      </div>
                      <div className="text-[10px] font-extrabold text-[#1E0734]/80 truncate">
                        {item.winnerName}
                      </div>
                    </div>
                  </div>

                  {/* 2 Botones Circulares: Ver Perfil y Comparar Head to Head */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Ver perfil del campeón"
                      onClick={() => {
                        triggerHaptic("card");
                        if (onSelectPlayerProfile && champPlayer) {
                          onSelectPlayerProfile(champPlayer);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-[#1E0734] text-[#00DC7D] flex items-center justify-center shadow-md mp-btn-tactile"
                    >
                      <WtaIcon name="user" size={14} />
                    </button>
                    <button
                      type="button"
                      title="Comparar en Head to Head"
                      onClick={() => {
                        triggerHaptic("card");
                        if (onOpenH2HWithPlayers && champPlayer) {
                          onOpenH2HWithPlayers(currentUser || players[2], champPlayer);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-[#1E0734] text-white flex items-center justify-center shadow-md mp-btn-tactile"
                    >
                      <WtaIcon name="h2h" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// === FIN DEL BLOQUE 8 DE 14 ===

// ============================================================================
// PARTE 9 DE 14: VISTA 4 — SEDES Y ACADEMIAS (SIN CHOQUES DE TEXTO, HORARIO
// SEPARADO, SEMÁFORO CLIMÁTICO 3D, CUPONES VIP Y GALERÍA TIPO TELÓN), SALA
// MATCHPOINT VISION IA (65/35 CON CAPÍTULOS) Y VITRINA COACH PRO CON TURNOS
// ============================================================================

// ----------------------------------------------------------------------------
// 1. MODAL COMPLETO DE SEDE OFICIAL + GALERÍA REVELADA TIPO TELÓN (CURTAIN WIPE)
//    + REPORTE CLIMÁTICO INTERACTIVO DE 4 ESTADOS (<ClubDetailModal/>)
// ----------------------------------------------------------------------------
export function ClubDetailModal({
  sede,
  currentUser,
  lightMode = false,
  onClose,
  onReportWeatherState,
  onLaunchChallengeAtSede,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'gallery' | 'weather' | 'video'
  const [selectedCurtainIdx, setSelectedCurtainIdx] = useState(0);

  if (!sede) return null;

  const weatherObj =
    WEATHER_SURFACE_STATES[sede.weatherState] || WEATHER_SURFACE_STATES.seco;
  const galleryItems =
    Array.isArray(sede.curtainGallery) && sede.curtainGallery.length > 0
      ? sede.curtainGallery
      : [
          {
            title: sede.name,
            caption: "Canchas reglamentarias de polvo de ladrillo en Huancayo.",
            image: sede.coverAsset,
          },
        ];

  const handleReserveByWhatsApp = (shiftType = "Turno de Cancha") => {
    triggerHaptic("hero");
    const msg = encodeURIComponent(
      `¡Hola *${sede.name}*! Soy *${
        currentUser?.name || "tenista del circuito"
      }* de MATCHPOINT${
        currentUser?.isVip ? ` (Socio VIP · Carnet ${currentUser.vipCode})` : ""
      }. Quisiera consultar disponibilidad para reservar cancha (${shiftType}).`
    );
    window.open(
      `https://wa.me/${sede.whatsapp || CIRCUIT_CONFIG.adminWhatsApp}?text=${msg}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full max-w-xl max-h-[90dvh] flex flex-col rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] border mp-modal-sheet ${
          lightMode
            ? "bg-[#FAF9F5] text-[#1E0734] border-[#1E0734]/15"
            : "bg-[#1E0734] text-white border-[#00DC7D]/40"
        }`}
      >
        {/* Botón de cierre */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (onClose) onClose();
          }}
          aria-label="Cerrar sede"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/55 text-white border border-white/25 flex items-center justify-center mp-close-btn"
        >
          <WtaIcon name="close" size={18} />
        </button>

        {/* Contenedor Scrolleable */}
        <div className="flex-1 overflow-y-auto overscroll-contain space-y-4 pb-6">
          {/* 1. CABECERA DE LA SEDE CON HORARIO SEPARADO DEL TÍTULO */}
          <div className="relative min-h-[225px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden bg-[#160428] text-white">
            <SmartImage
              src={sede.coverAsset}
              alt={sede.name}
              className="absolute inset-0 w-full h-full object-cover opacity-65"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(22,4,40,0.72) 0%, rgba(30,7,52,0.28) 40%, rgba(30,7,52,0.96) 100%)",
              }}
            />

            {/* Fila Superior: Estado Climático en Cancha (Separado arriba) */}
            <div className="relative z-10 flex items-center justify-between gap-2 pr-10">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-wta-display font-extrabold backdrop-blur-md ${weatherObj.badgeBg}`}
              >
                <SmartImage
                  src={weatherObj.iconAsset}
                  alt={weatherObj.shortLabel}
                  className="w-4 h-4 object-contain"
                />
                <span>{weatherObj.label}</span>
              </div>

              {sede.isOfficialSponsorVenue && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider shadow-sm">
                  Sede Oficial
                </span>
              )}
            </div>

            {/* Bloque Inferior: Escudo + Nombre Completo + Horario Debajo sin Montarse */}
            <div className="relative z-10 mt-10 flex items-end justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <SmartImage
                  src={sede.logoAsset}
                  alt={sede.name}
                  className="w-13 h-13 rounded-2xl object-contain bg-white p-1.5 border-2 border-[#00DC7D] shadow-lg shrink-0"
                  style={{ width: 52, height: 52 }}
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-extrabold text-[#6EF2B5] block truncate">
                    {sede.zone} · {sede.surfaceType}
                  </span>
                  <h2 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase text-white leading-tight">
                    {sede.name}
                  </h2>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/85 font-semibold">
                    <WtaIcon name="clock" size={13} className="text-[#00DC7D]" />
                    <span>{sede.scheduleText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Píldoras de Navegación Interna de la Sede */}
            <div className="relative z-10 mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: "overview", label: "¿Qué tiene el club?" },
                { id: "gallery", label: "Galería de Canchas" },
                { id: "weather", label: "Estado de Cancha" },
                { id: "video", label: "Ver Video" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setActiveTab(t.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-wta-display font-extrabold shrink-0 wta-pill-tab ${
                    activeTab === t.id
                      ? "wta-pill-tab-active"
                      : "wta-pill-tab-inactive"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. CONTENIDO SEGÚN PESTAÑA */}
          <div className="px-4 sm:px-5 space-y-4">
            {/* PESTAÑA A: SERVICIOS, TARIFAS Y TICKET DORADO VIP */}
            {activeTab === "overview" && (
              <div className="space-y-4 mp-view-enter">
                {/* Tarjeta de Tarifas por Hora */}
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`p-3 rounded-2xl border text-center ${
                      lightMode
                        ? "bg-white border-[#1E0734]/12"
                        : "bg-[#23083C] border-white/12"
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase opacity-65 block">
                      Turno Día
                    </span>
                    <span className="font-wta-condensed text-2xl font-bold text-[#00DC7D] tabular-nums mt-0.5 block">
                      S/ {sede.priceDaySoles}
                    </span>
                    <span className="text-[10px] opacity-70">por hora</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border text-center ${
                      lightMode
                        ? "bg-white border-[#1E0734]/12"
                        : "bg-[#23083C] border-white/12"
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase opacity-65 block">
                      Turno Noche LED
                    </span>
                    <span className="font-wta-condensed text-2xl font-bold tabular-nums mt-0.5 block">
                      S/ {sede.priceNightSoles}
                    </span>
                    <span className="text-[10px] opacity-70">por hora</span>
                  </div>

                  <div className="p-3 rounded-2xl border-2 border-[#F59E0B] bg-gradient-to-b from-[#F59E0B]/20 to-transparent text-center">
                    <span className="text-[10px] font-wta-display font-black uppercase text-[#F59E0B] block">
                      Socio VIP
                    </span>
                    <span className="font-wta-condensed text-2xl font-bold text-[#F59E0B] tabular-nums mt-0.5 block">
                      S/ {sede.priceVipSoles}
                    </span>
                    <span className="text-[10px] font-bold text-[#00DC7D]">
                      Tarifa preferencial
                    </span>
                  </div>
                </div>

                {/* Cupón Gráfico Dorado VIP (Golden Ticket) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#290C46] via-[#1E0734] to-[#D97706]/30 border border-[#F59E0B]/55 text-white flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <SmartImage
                      src={ASSETS.goldenTicket}
                      alt="Beneficio VIP"
                      className="w-11 h-11 object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="px-2 py-0.2 rounded bg-[#F59E0B] text-[#1E0734] text-[9px] font-wta-display font-black uppercase">
                        CUPÓN CARNET SOCIO VIP
                      </span>
                      <div className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                        {sede.vipDiscountTag}
                      </div>
                      <p className="text-[11px] text-white/75 leading-snug mt-0.5">
                        {sede.vipBenefitDetail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista Limpia de Servicios: "¿Qué tiene el club?" */}
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 ${
                    lightMode
                      ? "bg-white border-[#1E0734]/10"
                      : "bg-[#23083C] border-white/12"
                  }`}
                >
                  <h4 className="font-wta-condensed text-lg font-bold uppercase tracking-wider text-[#00DC7D]">
                    ¿QUÉ TIENE EL CLUB?
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(sede.services || []).map((srv) => (
                      <div
                        key={srv}
                        className="flex items-center gap-2 text-xs font-semibold p-2 rounded-xl bg-current/5"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#00DC7D]/20 text-[#00DC7D] flex items-center justify-center shrink-0">
                          <WtaIcon name="check" size={12} strokeWidth={2.8} />
                        </span>
                        <span>{srv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dirección y Botones Directos a Google Maps y Waze */}
                <div
                  className={`p-3.5 rounded-2xl border space-y-3 ${
                    lightMode
                      ? "bg-white border-[#1E0734]/10"
                      : "bg-[#23083C] border-white/12"
                  }`}
                >
                  <div className="flex items-start gap-2.5 text-xs">
                    <WtaIcon
                      name="map-pin"
                      size={16}
                      className="text-[#00DC7D] mt-0.5"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase opacity-65 block">
                        Ubicación exacta en Huancayo
                      </span>
                      <strong className="font-bold">{sede.address}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={sede.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => triggerHaptic("tab")}
                      className="py-2.5 px-3 rounded-xl bg-[#00DC7D]/15 hover:bg-[#00DC7D]/25 text-[#00DC7D] border border-[#00DC7D]/40 text-xs font-extrabold flex items-center justify-center gap-1.5 mp-btn-tactile"
                    >
                      <WtaIcon name="map-pin" size={14} />
                      <span>Abrir Google Maps</span>
                    </a>
                    <a
                      href={sede.wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => triggerHaptic("tab")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 mp-btn-tactile ${
                        lightMode
                          ? "bg-[#FAF9F5] border-[#1E0734]/15 text-[#1E0734]"
                          : "bg-white/10 border-white/20 text-white"
                      }`}
                    >
                      <WtaIcon name="arrow-right" size={14} />
                      <span>Ir con Waze</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA B: GALERÍA REVELADA TIPO TELÓN (STICKY CURTAIN WIPE + FROSTED GLASS) */}
            {activeTab === "gallery" && (
              <div className="space-y-3 mp-view-enter">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-[#160428] border border-white/15 shadow-xl">
                  <SmartImage
                    key={selectedCurtainIdx}
                    src={galleryItems[selectedCurtainIdx]?.image || sede.coverAsset}
                    alt={galleryItems[selectedCurtainIdx]?.title || sede.name}
                    className="w-full h-full object-cover wta-blur-to-sharp"
                  />

                  {/* Tarjeta Flotante de Cristal Esmerilado (Frosted Glass Card — Ronda 23) */}
                  <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-2xl bg-white/90 text-[#1E0734] backdrop-blur-xl shadow-lg border border-white">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[9px] font-wta-display font-black uppercase">
                        LÁMINA {selectedCurtainIdx + 1} DE {galleryItems.length}
                      </span>
                      <span className="text-[10px] font-extrabold text-[#C85A32]">
                        {sede.shortName}
                      </span>
                    </div>
                    <h4 className="font-wta-condensed text-lg font-bold uppercase text-[#1E0734]">
                      {galleryItems[selectedCurtainIdx]?.title}
                    </h4>
                    <p className="text-xs text-[#1E0734]/80 mt-0.5">
                      {galleryItems[selectedCurtainIdx]?.caption}
                    </p>
                  </div>
                </div>

                {/* Miniaturas para Revelar Telones */}
                <div className="grid grid-cols-2 gap-2">
                  {galleryItems.map((gItem, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        triggerHaptic("tab");
                        setSelectedCurtainIdx(idx);
                      }}
                      className={`p-2 rounded-2xl border text-left flex items-center gap-2.5 mp-btn-tactile ${
                        selectedCurtainIdx === idx
                          ? "border-2 border-[#00DC7D] bg-[#00DC7D]/15"
                          : lightMode
                          ? "bg-white border-[#1E0734]/12"
                          : "bg-white/6 border-white/12"
                      }`}
                    >
                      <SmartImage
                        src={gItem.image}
                        alt={gItem.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate">
                          {gItem.title}
                        </div>
                        <span className="text-[10px] text-[#00DC7D] font-bold">
                          Ver postal ➔
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PESTAÑA C: REPORTE CLIMÁTICO INTERACTIVO DE 4 ESTADOS (+3 GEMAS) */}
            {activeTab === "weather" && (
              <div className="space-y-3 mp-view-enter">
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    lightMode
                      ? "bg-white border-[#1E0734]/12"
                      : "bg-[#23083C] border-white/12"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D]">
                      REPORTE EN TIEMPO REAL DE JUGADORES
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-extrabold">
                      +3 Gemas por avisar
                    </span>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed">
                    ¿Estás en {sede.name} ahora mismo? Toca el estado actual de las
                    canchas para ayudar a otros tenistas del circuito.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    {Object.values(WEATHER_SURFACE_STATES).map((st) => {
                      const isCurrent = sede.weatherState === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic("success");
                            if (onReportWeatherState) {
                              onReportWeatherState(sede.id, st.id);
                            }
                          }}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 mp-btn-tactile ${
                            isCurrent
                              ? "border-2 border-[#00DC7D] bg-[#00DC7D]/20 shadow-md"
                              : lightMode
                              ? "bg-[#FAF9F5] border-[#1E0734]/12"
                              : "bg-white/6 border-white/12"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <SmartImage
                              src={st.iconAsset}
                              alt={st.shortLabel}
                              className="w-9 h-9 object-contain"
                            />
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[9px] font-black uppercase">
                                Actual
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold">{st.shortLabel}</div>
                            <div className="text-[10px] opacity-70">{st.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA D: VIDEO DE CANCHA CON PRECARGA CERO (CERO CONSUMO EN REPOSO) */}
            {activeTab === "video" && (
              <div className="space-y-3 mp-view-enter">
                <div className="rounded-3xl overflow-hidden bg-black border border-[#00DC7D]/40 aspect-video relative shadow-xl">
                  <video
                    src={sede.videoAsset}
                    poster={sede.coverAsset}
                    controls
                    playsInline
                    preload="none"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-center opacity-75">
                  Recorrido en cancha de {sede.name} · Superficie {sede.surfaceType}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Barra Inferior de Acciones de la Sede */}
        <div
          className={`px-4 py-3 border-t flex items-center gap-2 shrink-0 ${
            lightMode
              ? "bg-white border-[#1E0734]/10"
              : "bg-[#160428] border-white/12"
          }`}
        >
          {onLaunchChallengeAtSede && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                onClose();
                onLaunchChallengeAtSede(sede.name);
              }}
              className={`flex-1 py-3 px-3 rounded-2xl font-wta-display font-extrabold text-xs flex items-center justify-center gap-1.5 border mp-btn-tactile ${
                lightMode
                  ? "bg-[#1E0734] text-white border-[#1E0734]"
                  : "bg-white/12 hover:bg-white/20 text-white border-white/20"
              }`}
            >
              <WtaIcon name="swords" size={15} className="text-[#00DC7D]" />
              <span>Retar en este club</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleReserveByWhatsApp("Reserva de Cancha")}
            className="flex-1 py-3 px-4 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg"
          >
            <WtaIcon name="whatsapp" size={16} />
            <span>Reservar Cancha</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2. MODAL DE GRABACIÓN Y ANÁLISIS MATCHPOINT VISION IA (<MatchPointVisionIaModal/>)
//    Reproductor asimétrico 65% / 35% con capítulos, mapa de calor de piques en
//    cancha y reserva directa en Soles o con Bono de Gemas.
// ----------------------------------------------------------------------------
export function MatchPointVisionIaModal({
  isOpen,
  onClose,
  currentUser,
  sedes = INITIAL_SEDES,
  lightMode = false,
  onOpenDirectPayment,
}) {
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [selectedSedeName, setSelectedSedeName] = useState(
    "Country Club Los Huancas"
  );

  const chapters = useMemo(
    () => [
      {
        id: "chp-1",
        title: "Partido Condensado (Sin tiempos muertos)",
        duration: "14:20",
        tag: "Ahorra 70% de tiempo",
        videoSrc: ASSETS.videoCircuitoHorizontal,
        poster: ASSETS.bannerVisionIa,
        metrics: {
          maxServeKmh: 168,
          firstServePct: 67,
          winners: 22,
          unforcedErrors: 14,
          longestRally: 19,
        },
      },
      {
        id: "chp-2",
        title: "Mapa de Piques y Direcciones de Saque",
        duration: "03:45",
        tag: "Precisión en líneas",
        videoSrc: ASSETS.videoCoachHorizontal2,
        poster: ASSETS.portadaAcademiaTv,
        metrics: {
          maxServeKmh: 172,
          firstServePct: 71,
          winners: 9,
          unforcedErrors: 3,
          longestRally: 11,
        },
      },
      {
        id: "chp-3",
        title: "Mejores Puntos y Cierres en el Tie-Break",
        duration: "04:12",
        tag: "Listo para Instagram 9:16",
        videoSrc: ASSETS.videoHorizontal3,
        poster: ASSETS.portadaTipsSemana,
        metrics: {
          maxServeKmh: 164,
          firstServePct: 64,
          winners: 12,
          unforcedErrors: 4,
          longestRally: 24,
        },
      },
    ],
    []
  );

  if (!isOpen) return null;

  const activeChapter = chapters[selectedChapterIdx] || chapters[0];

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="MatchPoint Vision IA · En Cancha"
      subtitle="Grabación de tu partido en 60 fps sin tiempos muertos, conteo de golpes y mapa de piques."
      badgeText="ANÁLISIS DE VIDEO DEPORTIVO"
      iconName="video"
      lightMode={lightMode}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Reproductor Asimétrico MUST-SEE ACTION (65% Video / 35% Capítulos) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Columna 65% (7 cols): Reproductor con barra esmeralda */}
          <div className="md:col-span-7 rounded-3xl overflow-hidden bg-[#120322] border border-[#00DC7D]/45 shadow-xl flex flex-col justify-between">
            <div className="relative aspect-video bg-black">
              <video
                key={activeChapter.id}
                src={activeChapter.videoSrc}
                poster={activeChapter.poster}
                controls
                playsInline
                preload="none"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#1E0734]/90 text-[#00DC7D] border border-[#00DC7D]/40 text-[10px] font-wta-display font-black uppercase pointer-events-none">
                {activeChapter.tag}
              </span>
            </div>

            <div className="p-3.5 bg-[#1E0734] text-white flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  {activeChapter.title}
                </div>
                <div className="text-[10px] text-[#6EF2B5]">
                  Duración del clip: {activeChapter.duration} min
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-[#00DC7D]/20 text-[#00DC7D] text-[10px] font-extrabold shrink-0">
                HD 60 FPS
              </span>
            </div>
          </div>

          {/* Columna 35% (5 cols): Capítulos Automáticos */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-2">
            <div className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D]">
              CAPÍTULOS DE LA SESIÓN
            </div>
            {chapters.map((chp, idx) => {
              const isSelected = idx === selectedChapterIdx;
              return (
                <button
                  key={chp.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setSelectedChapterIdx(idx);
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 mp-btn-tactile ${
                    isSelected
                      ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold shadow-md"
                      : lightMode
                      ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                      : "bg-white/8 border-white/12 text-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#1E0734] text-[#00DC7D] flex items-center justify-center shrink-0">
                    <WtaIcon name="play" size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold truncate">{chp.title}</div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? "text-[#1E0734]/80 font-bold" : "opacity-65"
                      }`}
                    >
                      ▶ {chp.duration} · {chp.tag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mapa Vectorial de Piques en Cancha + Métricas de Golpeo */}
        <div
          className={`p-4 rounded-3xl border grid grid-cols-1 sm:grid-cols-12 gap-4 items-center ${
            lightMode
              ? "bg-white border-[#1E0734]/12"
              : "bg-[#1E0734] border-white/12"
          }`}
        >
          {/* Cancha SVG con Piques en Verde Esmeralda (Winners) y Terracota */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] mb-1.5">
              MAPA DE PIQUES DETECTADOS
            </span>
            <svg
              viewBox="0 0 220 120"
              className="w-full max-w-[230px] rounded-2xl border border-white/20 shadow-inner"
            >
              <rect width="220" height="120" fill="#9E3E1E" />
              <rect
                x="14"
                y="12"
                width="192"
                height="96"
                fill="#C85A32"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* Líneas de dobles y cuadros de saque */}
              <line x1="14" y1="24" x2="206" y2="24" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="14" y1="96" x2="206" y2="96" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="62" y1="24" x2="62" y2="96" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="158" y1="24" x2="158" y2="96" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="62" y1="60" x2="158" y2="60" stroke="#FFFFFF" strokeWidth="1.2" />
              {/* Red central */}
              <line
                x1="110"
                y1="8"
                x2="110"
                y2="112"
                stroke="#00DC7D"
                strokeWidth="2.5"
                strokeDasharray="3 2"
              />
              {/* Piques ganadores en Verde Esmeralda */}
              <circle cx="178" cy="34" r="4.5" fill="#00DC7D" stroke="#1E0734" strokeWidth="1.5" />
              <circle cx="186" cy="82" r="4.5" fill="#00DC7D" stroke="#1E0734" strokeWidth="1.5" />
              <circle cx="144" cy="48" r="4" fill="#00DC7D" stroke="#1E0734" strokeWidth="1.5" />
              <circle cx="192" cy="58" r="4.5" fill="#00DC7D" stroke="#1E0734" strokeWidth="1.5" />
              <circle cx="165" cy="88" r="4" fill="#F59E0B" stroke="#1E0734" strokeWidth="1.5" />
            </svg>
          </div>

          {/* 4 Indicadores de Rendimiento */}
          <div className="sm:col-span-7 grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-current/5 border border-current/10">
              <span className="text-[10px] font-bold uppercase opacity-65 block">
                Saque Máximo
              </span>
              <span className="font-wta-condensed text-2xl font-bold text-[#00DC7D]">
                {activeChapter.metrics.maxServeKmh} km/h
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-current/5 border border-current/10">
              <span className="text-[10px] font-bold uppercase opacity-65 block">
                1.er Servicio Adentro
              </span>
              <span className="font-wta-condensed text-2xl font-bold text-[#00DC7D]">
                {activeChapter.metrics.firstServePct}%
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-current/5 border border-current/10">
              <span className="text-[10px] font-bold uppercase opacity-65 block">
                Tiros Ganadores
              </span>
              <span className="font-wta-condensed text-2xl font-bold text-[#F59E0B]">
                {activeChapter.metrics.winners} Winners
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-current/5 border border-current/10">
              <span className="text-[10px] font-bold uppercase opacity-65 block">
                Peloteo Más Largo
              </span>
              <span className="font-wta-condensed text-2xl font-bold">
                {activeChapter.metrics.longestRally} golpes
              </span>
            </div>
          </div>
        </div>

        {/* Selector de Sede y Botón de Reserva de Grabación */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <select
            value={selectedSedeName}
            onChange={(e) => setSelectedSedeName(e.target.value)}
            className={`px-3.5 py-3 rounded-2xl border text-xs font-extrabold mp-input-alive ${
              lightMode
                ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                : "bg-[#1E0734] border-white/20 text-white"
            }`}
          >
            {sedes.map((s) => (
              <option key={s.id} value={s.name}>
                Sede: {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              if (onOpenDirectPayment) {
                onOpenDirectPayment({
                  conceptTitle: `Sesión MatchPoint Vision IA (${selectedSedeName})`,
                  amountSoles: currentUser?.isVip ? 35 : 45,
                  regularAmountSoles: 45,
                  vipAmountSoles: 35,
                  itemType: "vision_ia",
                  referenceId: "vision-ia-session",
                });
              }
            }}
            className="py-3.5 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
          >
            <WtaIcon name="video" size={16} />
            <span>
              Reservar Grabación (S/ {currentUser?.isVip ? 35 : 45})
            </span>
          </button>
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 3. MODAL DE PERFIL COMERCIAL DE ENTRENADOR (<CoachProProfileModal/>)
//    Muestra cabecera en cancha, métricas de reputación, programas de clases,
//    reseñas verificadas de alumnos y selector de turnos libres para WhatsApp.
// ----------------------------------------------------------------------------
export function CoachProProfileModal({
  coach,
  currentUser,
  lightMode = false,
  onClose,
  onOpenDirectPayment,
}) {
  const [selectedProgramId, setSelectedProgramId] = useState(
    coach?.programs?.[0]?.id || ""
  );
  const [selectedSlot, setSelectedSlot] = useState(
    coach?.availableSlots?.[0] || "Mañana · 08:00 a. m."
  );

  useEffect(() => {
    if (coach) {
      setSelectedProgramId(coach.programs?.[0]?.id || "");
      setSelectedSlot(coach.availableSlots?.[0] || "Mañana · 08:00 a. m.");
    }
  }, [coach]);

  if (!coach) return null;

  const chosenProgram =
    (coach.programs || []).find((p) => p.id === selectedProgramId) ||
    coach.programs?.[0] || {
      name: "Clase Individual en Cancha",
      duration: "60 min",
      priceSoles: coach.priceSingleSoles || 60,
      vipPriceSoles: Math.round((coach.priceSingleSoles || 60) * 0.85),
    };

  const handleBookViaWhatsApp = () => {
    triggerHaptic("hero");
    const msg = encodeURIComponent(
      `¡Hola Profe *${coach.name}*! Soy *${
        currentUser?.name || "jugador"
      }* del circuito MATCHPOINT. Quiero reservar el programa *${
        chosenProgram.name
      }* en el turno libre *${selectedSlot}* en *${coach.club}*.`
    );
    window.open(
      `https://wa.me/${coach.whatsapp || CIRCUIT_CONFIG.adminWhatsApp}?text=${msg}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full max-w-xl max-h-[90dvh] flex flex-col rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] border mp-modal-sheet ${
          lightMode
            ? "bg-[#FAF9F5] text-[#1E0734] border-[#1E0734]/15"
            : "bg-[#1E0734] text-white border-[#00DC7D]/40"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (onClose) onClose();
          }}
          aria-label="Cerrar entrenador"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/55 text-white border border-white/25 flex items-center justify-center mp-close-btn"
        >
          <WtaIcon name="close" size={18} />
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain space-y-4 pb-6">
          {/* Cabecera 16:9 en Cancha */}
          <div className="relative min-h-[220px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden bg-[#160428] text-white">
            <SmartImage
              src={coach.actionPhoto || coach.avatar}
              alt={coach.name}
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(22,4,40,0.6) 0%, rgba(30,7,52,0.3) 40%, rgba(30,7,52,0.97) 100%)",
              }}
            />

            <div className="relative z-10 flex items-center gap-2 pr-10">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider">
                ENTRENADOR CERTIFICADO
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/45 text-[#F59E0B] border border-[#F59E0B]/40 text-[10px] font-extrabold">
                ★ {coach.rating} ({coach.reviewsCount} reseñas)
              </span>
            </div>

            <div className="relative z-10 mt-10 flex items-end gap-3.5">
              <SmartImage
                src={coach.avatar}
                alt={coach.name}
                isAvatar
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00DC7D] shadow-xl shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[11px] font-extrabold text-[#6EF2B5] block truncate">
                  {coach.club} · {coach.experienceYears}
                </span>
                <h2 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase text-white leading-none mt-0.5">
                  {coach.name}
                </h2>
                <p className="text-xs text-white/80 mt-1 line-clamp-2">
                  {coach.specialty}
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-5 space-y-4">
            {/* 1. Programas de Entrenamiento Estructurados */}
            <div>
              <h4 className="font-wta-condensed text-lg font-bold uppercase tracking-wider text-[#00DC7D] mb-2">
                1. ELIGE TU PROGRAMA EN CANCHA
              </h4>
              <div className="space-y-2">
                {(coach.programs || []).map((prg) => {
                  const isSelected = prg.id === chosenProgram.id;
                  return (
                    <button
                      key={prg.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic("tab");
                        setSelectedProgramId(prg.id);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 mp-btn-tactile ${
                        isSelected
                          ? "border-2 border-[#00DC7D] bg-[#00DC7D]/15 shadow-md"
                          : lightMode
                          ? "bg-white border-[#1E0734]/12"
                          : "bg-[#23083C] border-white/12"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-extrabold">
                          {prg.name}
                        </div>
                        <div className="text-[11px] opacity-75 mt-0.5">
                          {prg.duration}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-wta-condensed text-xl font-bold text-[#00DC7D] tabular-nums">
                          S/ {currentUser?.isVip ? prg.vipPriceSoles : prg.priceSoles}
                        </div>
                        <span className="text-[10px] font-bold text-[#F59E0B] block">
                          VIP: S/ {prg.vipPriceSoles}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Selector Interactivo de Turnos Libres */}
            <div>
              <h4 className="font-wta-condensed text-lg font-bold uppercase tracking-wider text-[#00DC7D] mb-2">
                2. HORARIOS LIBRES DISPONIBLES ESTA SEMANA
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {(coach.availableSlots || []).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      triggerHaptic("tab");
                      setSelectedSlot(slot);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 mp-btn-tactile ${
                      selectedSlot === slot
                        ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] shadow-sm"
                        : lightMode
                        ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                        : "bg-white/8 border-white/15 text-white"
                    }`}
                  >
                    <WtaIcon name="clock" size={13} />
                    <span>{slot}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Reseñas Verificadas de Alumnos del Circuito */}
            {Array.isArray(coach.reviews) && coach.reviews.length > 0 && (
              <div>
                <h4 className="font-wta-condensed text-lg font-bold uppercase tracking-wider text-[#00DC7D] mb-2">
                  OPINIONES DE TENISTAS DEL CIRCUITO
                </h4>
                <div className="space-y-2">
                  {coach.reviews.map((rev, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl border text-xs space-y-1 ${
                        lightMode
                          ? "bg-white border-[#1E0734]/10"
                          : "bg-[#23083C] border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between font-extrabold">
                        <span>{rev.author}</span>
                        <span className="text-[#F59E0B]">★★★★★</span>
                      </div>
                      <p className="opacity-80 leading-relaxed">“{rev.text}”</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra Inferior de Reserva Directa */}
        <div
          className={`px-4 py-3 border-t flex items-center gap-2 shrink-0 ${
            lightMode
              ? "bg-white border-[#1E0734]/10"
              : "bg-[#160428] border-white/12"
          }`}
        >
          {onOpenDirectPayment && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                onOpenDirectPayment({
                  conceptTitle: `${chosenProgram.name} · ${coach.name} (${selectedSlot})`,
                  amountSoles: currentUser?.isVip
                    ? chosenProgram.vipPriceSoles
                    : chosenProgram.priceSoles,
                  regularAmountSoles: chosenProgram.priceSoles,
                  vipAmountSoles: chosenProgram.vipPriceSoles,
                  itemType: "coach_program",
                  referenceId: coach.id,
                });
              }}
              className={`py-3 px-3.5 rounded-2xl font-wta-display font-extrabold text-xs border mp-btn-tactile ${
                lightMode
                  ? "bg-[#1E0734] text-white border-[#1E0734]"
                  : "bg-white/12 text-white border-white/20"
              }`}
            >
              Separar con Yape
            </button>
          )}

          <button
            type="button"
            onClick={handleBookViaWhatsApp}
            className="flex-1 py-3 px-4 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg"
          >
            <WtaIcon name="whatsapp" size={16} />
            <span>Confirmar Turno por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 4. VISTA PRINCIPAL 4: SEDES, ACADEMIAS, VITRINA COACH PRO Y VISION IA
//    (<SedesAndCoachProView/>)
//    - Tarjetas de Sedes sin choques de texto (Horario separado del título) y
//      fila compacta de 3 botones (Reservar, Mapa, Detalles / Video).
//    - Tarjeta Destacada 50/50 "Entrenador de la Semana" sobre Blanco Marfil.
//    - Grilla de 3 Pilares del Circuito (1. Mide tu nivel · 2. Entrena · 3. Compite).
//    - Clases de Academia TV con candado de Gemas.
// ----------------------------------------------------------------------------
export function SedesAndCoachProView({
  sedes = INITIAL_SEDES,
  coaches = INITIAL_COACHES,
  classesList = WEEKLY_TIPS_AND_CLASSES,
  unlockedClassIds = [],
  currentUser,
  lightMode = false,
  onSelectSedeModal,
  onSelectCoachModal,
  onOpenVisionIaModal,
  onUnlockClassWithGems,
  onOpenWeeklyTipsModal,
  onLaunchChallengeAtSede,
}) {
  const [sectionTab, setSectionTab] = useState("all"); // 'all' | 'sedes' | 'coaches' | 'academia_tv'

  const spotlightCoach = useMemo(
    () => coaches.find((c) => c.isCoachOfTheWeek) || coaches[0],
    [coaches]
  );

  return (
    <div className="space-y-4 px-3.5 sm:px-5 pt-2 pb-5 mp-view-enter">
      {/* 1. CABECERA DEGRADADA VERDE MENTA ESTILO WTA COACH PROGRAM (RONDA 21) */}
      <div
        className="rounded-3xl p-4 sm:p-5 text-[#1E0734] shadow-lg relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #00DC7D 0%, #6EF2B5 55%, #E3FDF0 100%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
              4 CLUBES ALIADOS & ENTRENADORES CERTIFICADOS
            </span>
            <h1 className="font-wta-condensed text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#1E0734] leading-none mt-1">
              SEDES Y ENTRENADORES
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              if (onOpenVisionIaModal) onOpenVisionIaModal();
            }}
            className="px-3.5 py-2 rounded-full bg-[#1E0734] text-[#00DC7D] font-wta-display font-extrabold text-xs flex items-center gap-1.5 shadow-md mp-btn-tactile"
          >
            <WtaIcon name="video" size={15} />
            <span>Vision IA en Cancha</span>
          </button>
        </div>

        {/* Pestañas Píldora */}
        <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { id: "all", label: "Panorama Completo" },
            { id: "sedes", label: "4 Sedes de Huancayo" },
            { id: "coaches", label: "Entrenadores Coach Pro" },
            { id: "academia_tv", label: "Tips y Clases en Video" },
          ].map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setSectionTab(tb.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-wta-display font-extrabold shrink-0 transition-all ${
                sectionTab === tb.id
                  ? "bg-[#1E0734] text-[#00DC7D] shadow-sm scale-[1.02]"
                  : "bg-white/80 text-[#1E0734] hover:bg-white"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. LAS 4 SEDES OFICIALES DE HUANCAYO (CERO TEXTOS MONTADOS Y FILA COMPACTA
          DE 3 ACCIONES: RESERVAR, MAPA, DETALLES) */}
      {(sectionTab === "all" || sectionTab === "sedes") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
                ESTADO DE CANCHAS Y TARIFAS
              </span>
              <h2 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase">
                SEDES OFICIALES DEL CIRCUITO
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sedes.map((sede) => {
              const weatherObj =
                WEATHER_SURFACE_STATES[sede.weatherState] ||
                WEATHER_SURFACE_STATES.seco;

              return (
                <div
                  key={sede.id}
                  onClick={() => {
                    triggerHaptic("card");
                    if (onSelectSedeModal) onSelectSedeModal(sede);
                  }}
                  className={`rounded-3xl overflow-hidden border shadow-lg cursor-pointer group wta-card-aura flex flex-col justify-between ${
                    lightMode
                      ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                      : "bg-[#23083C] border-white/12 text-white"
                  }`}
                >
                  {/* Fotografía Superior con Estado Climático Arriba y Título Limpio Abajo */}
                  <div className="relative h-44 overflow-hidden bg-[#160428]">
                    <SmartImage
                      src={sede.coverAsset}
                      alt={sede.name}
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(22,4,40,0.62) 0%, rgba(30,7,52,0.18) 42%, rgba(22,4,40,0.95) 100%)",
                      }}
                    />

                    {/* Esquina Superior: Semáforo Climático 3D + Sello Sede Oficial */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-wta-display font-extrabold backdrop-blur-md ${weatherObj.badgeBg}`}
                      >
                        <SmartImage
                          src={weatherObj.iconAsset}
                          alt={weatherObj.shortLabel}
                          className="w-3.5 h-3.5 object-contain"
                        />
                        <span>{weatherObj.shortLabel}</span>
                      </span>

                      {sede.isOfficialSponsorVenue && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[9px] font-wta-display font-black uppercase tracking-wider shadow-sm">
                          Sede Oficial
                        </span>
                      )}
                    </div>

                    {/* Base de la Foto: Escudo + Nombre de Sede (SIN HORARIO ENCIMA) */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center gap-2.5">
                      <SmartImage
                        src={sede.logoAsset}
                        alt={sede.name}
                        className="w-11 h-11 rounded-2xl object-contain bg-white p-1 border border-[#00DC7D] shadow-md shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold text-[#6EF2B5] block truncate">
                          {sede.zone} · {sede.surfaceType}
                        </span>
                        <h3 className="font-wta-condensed text-xl sm:text-2xl font-bold uppercase text-white leading-none truncate">
                          {sede.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo Limpio Debajo de la Foto: Horario Separado + Tarifas + Cupón VIP */}
                  <div className="p-3.5 space-y-3">
                    {/* Fila de Horario y Precio Base bien separados */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold opacity-85">
                        <WtaIcon
                          name="clock"
                          size={14}
                          className="text-[#00DC7D]"
                        />
                        <span>{sede.scheduleText}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-wta-condensed text-lg font-bold text-[#00DC7D]">
                          S/ {sede.priceDaySoles}
                        </span>
                        <span className="text-[10px] opacity-65"> /h día</span>
                      </div>
                    </div>

                    {/* Cupón Compacto Dorado VIP */}
                    <div className="px-3 py-2 rounded-2xl bg-[#F59E0B]/12 border border-[#F59E0B]/40 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <SmartImage
                          src={ASSETS.goldenTicket}
                          alt="Ticket VIP"
                          className="w-6 h-6 object-contain shrink-0"
                        />
                        <span className="font-extrabold text-[#F59E0B] truncate">
                          {sede.vipDiscountTag}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold opacity-80 shrink-0">
                        VIP S/ {sede.priceVipSoles}/h
                      </span>
                    </div>

                    {/* Fila Horizontal Compacta de 3 Botones (Reservar · Mapa · Detalles) */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic("hero");
                          const msg = encodeURIComponent(
                            `¡Hola *${sede.name}*! Quisiera consultar disponibilidad de cancha desde MATCHPOINT.`
                          );
                          window.open(
                            `https://wa.me/${sede.whatsapp}?text=${msg}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        className="py-2.5 px-2 rounded-xl mp-btn-emerald text-xs font-wta-display font-extrabold flex items-center justify-center gap-1"
                      >
                        <WtaIcon name="whatsapp" size={13} />
                        <span>Reservar</span>
                      </button>

                      <a
                        href={sede.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic("tab");
                        }}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-wta-display font-extrabold flex items-center justify-center gap-1 mp-btn-tactile ${
                          lightMode
                            ? "bg-[#FAF9F5] border-[#1E0734]/15 text-[#1E0734]"
                            : "bg-white/8 border-white/15 text-white"
                        }`}
                      >
                        <WtaIcon
                          name="map-pin"
                          size={13}
                          className="text-[#00DC7D]"
                        />
                        <span>Mapa</span>
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic("tab");
                          if (onSelectSedeModal) onSelectSedeModal(sede);
                        }}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-wta-display font-extrabold flex items-center justify-center gap-1 mp-btn-tactile ${
                          lightMode
                            ? "bg-[#FAF9F5] border-[#1E0734]/15 text-[#1E0734]"
                            : "bg-white/8 border-white/15 text-white"
                        }`}
                      >
                        <span>Ver club ▾</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. VITRINA COACH PRO: TARJETA DESTACADA 50/50 SOBRE MARFIL + DIRECTORIO */}
      {(sectionTab === "all" || sectionTab === "coaches") && (
        <section className="space-y-3.5 pt-1">
          {/* Tarjeta Destacada 50/50: ENTRENADOR DE LA SEMANA (Ronda 20 y 21) */}
          {spotlightCoach && (
            <div
              onClick={() => {
                triggerHaptic("card");
                if (onSelectCoachModal) onSelectCoachModal(spotlightCoach);
              }}
              className="rounded-3xl overflow-hidden border border-[#00DC7D]/45 shadow-xl grid grid-cols-1 md:grid-cols-12 bg-[#FAF9F5] text-[#1E0734] cursor-pointer group wta-card-aura"
            >
              {/* Mitad Izquierda sobre Marfil (#FAF9F5) */}
              <div className="md:col-span-7 p-4 sm:p-6 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
                      ENTRENADOR DESTACADO DE LA SEMANA
                    </span>
                    <span className="text-xs font-extrabold text-[#C85A32]">
                      ★ {spotlightCoach.rating}
                    </span>
                  </div>

                  <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase text-[#1E0734] leading-none">
                    {spotlightCoach.name} · {spotlightCoach.club}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#1E0734]/80 italic leading-relaxed">
                    “{spotlightCoach.spotlightQuote}”
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1E0734]/10 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#00A859]">
                    Desde S/ {spotlightCoach.priceSingleSoles} por sesión · Turnos
                    disponibles
                  </span>
                  <span className="px-3.5 py-2 rounded-full bg-[#1E0734] text-[#00DC7D] text-xs font-wta-display font-extrabold inline-flex items-center gap-1.5">
                    <span>Ver horarios libres</span>
                    <WtaIcon name="arrow-right" size={14} />
                  </span>
                </div>
              </div>

              {/* Mitad Derecha: Fotografía en Cancha a Sangre Completa */}
              <div className="md:col-span-5 relative min-h-[190px] overflow-hidden bg-[#1E0734]">
                <SmartImage
                  src={spotlightCoach.actionPhoto || spotlightCoach.avatar}
                  alt={spotlightCoach.name}
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          )}

          {/* Lista Completa de Entrenadores Certificados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                onClick={() => {
                  triggerHaptic("card");
                  if (onSelectCoachModal) onSelectCoachModal(coach);
                }}
                className={`rounded-3xl p-4 border flex flex-col justify-between space-y-3 cursor-pointer wta-card-aura ${
                  lightMode
                    ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                    : "bg-[#23083C] border-white/12 text-white"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <SmartImage
                      src={coach.avatar}
                      alt={coach.name}
                      isAvatar
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[#00DC7D] shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="px-2 py-0.2 rounded bg-[#00DC7D]/20 text-[#00DC7D] text-[9px] font-wta-display font-black uppercase">
                        ★ {coach.rating} · {coach.reviewsCount} reseñas
                      </span>
                      <h4 className="font-wta-condensed text-xl font-bold uppercase truncate mt-0.5">
                        {coach.name}
                      </h4>
                      <span className="text-[11px] opacity-70 block truncate">
                        {coach.club}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs opacity-80 line-clamp-2 leading-relaxed">
                    {coach.specialty}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-current/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] opacity-65 block">Sesión 60 min</span>
                    <strong className="font-wta-condensed text-lg font-bold text-[#00DC7D]">
                      S/ {coach.priceSingleSoles}
                    </strong>
                  </div>

                  <span className="px-3 py-1.5 rounded-xl mp-btn-emerald text-xs font-extrabold">
                    Ver turnos ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. ACADEMIA TV: LOS 2 TIPS GRATUITOS SEMANALES VS CLASES CON CANDADO DE GEMAS */}
      {(sectionTab === "all" || sectionTab === "academia_tv") && (
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
                APRENDE CON LOS ENTRENADORES DE HUANCAYO
              </span>
              <h3 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase">
                TIPS DE LA SEMANA Y ACADEMIA EN VIDEO
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classesList.map((cls) => {
              const isUnlocked =
                cls.isFreeWeeklyTip || unlockedClassIds.includes(cls.id);
              return (
                <div
                  key={cls.id}
                  onClick={() => {
                    triggerHaptic("card");
                    if (isUnlocked) {
                      if (onOpenWeeklyTipsModal) onOpenWeeklyTipsModal(cls);
                    } else if (onUnlockClassWithGems) {
                      onUnlockClassWithGems(cls);
                    }
                  }}
                  className={`rounded-3xl overflow-hidden border cursor-pointer group wta-card-aura flex flex-col justify-between ${
                    lightMode
                      ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                      : "bg-[#23083C] border-white/12 text-white"
                  }`}
                >
                  <div className="relative h-36 overflow-hidden bg-[#160428]">
                    <SmartImage
                      src={cls.thumbnail}
                      alt={cls.title}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E0734] via-transparent to-black/40" />

                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-wta-display font-black uppercase ${
                          cls.isFreeWeeklyTip
                            ? "bg-[#00DC7D] text-[#1E0734]"
                            : "bg-[#F59E0B] text-[#1E0734]"
                        }`}
                      >
                        {cls.categoryTag}
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                        ▶ {cls.duration}
                      </span>
                    </div>

                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-[#1E0734]/65 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-3.5 py-2 rounded-full bg-[#1E0734] text-[#00DC7D] border border-[#00DC7D] text-xs font-wta-display font-extrabold flex items-center gap-1.5 shadow-lg">
                          <WtaIcon name="lock" size={14} />
                          <span>Desbloquear con {cls.costGems} Gemas</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold line-clamp-1">
                        {cls.title}
                      </h4>
                      <span className="text-[11px] opacity-70 block mt-0.5">
                        Por {cls.coachName}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-[#00DC7D]/15 text-[#00DC7D] text-[11px] font-extrabold shrink-0">
                      {isUnlocked ? "Ver video" : `${cls.costGems} 💎`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. GRILLA DE 3 PILARES SOBRE OSCURO (1. MIDE TU NIVEL · 2. ENTRENA · 3. COMPITE) */}
      <section className="rounded-3xl p-4 sm:p-5 bg-[#23083C] text-white border border-white/12 space-y-3">
        <div className="text-center">
          <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-widest text-[#00DC7D]">
            RECORRIDO OFICIAL DEL TENISTA
          </span>
          <h3 className="font-wta-condensed text-2xl font-bold uppercase mt-0.5">
            EL CAMINO COMPLETO EN HUANCAYO
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              step: "1. MIDE TU NIVEL",
              title: "Ubicación Justa desde el Día 1",
              desc: "Comienzas en tu categoría real (de 5ª P a 3ª) y tus primeros 5 partidos de prueba afinan tu puntaje.",
              img: ASSETS.torneoApertura,
            },
            {
              step: "2. ENTRENA EN CANCHA",
              title: "Mejora con Profesores y Video",
              desc: "Aprovecha los 2 tips gratuitos semanales, reserva clases individuales y analiza tus golpes con Vision IA.",
              img: ASSETS.portadaTipsSemana,
            },
            {
              step: "3. COMPITE Y GANA",
              title: "Sube al Master Top 8 Finals",
              desc: "Suma victorias en retos y torneos, gana Gemas por rachas y clasifica a la gran final anual.",
              img: ASSETS.torneoMasterTop8,
            },
          ].map((pil) => (
            <div
              key={pil.step}
              className="p-3.5 rounded-2xl bg-[#1E0734] border border-white/12 space-y-2"
            >
              <div className="h-24 rounded-xl overflow-hidden relative">
                <SmartImage
                  src={pil.img}
                  alt={pil.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[9px] font-wta-display font-black uppercase">
                  {pil.step}
                </span>
              </div>
              <h4 className="font-wta-condensed text-lg font-bold uppercase text-white">
                {pil.title}
              </h4>
              <p className="text-xs text-white/75 leading-relaxed">{pil.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// === FIN DEL BLOQUE 9 DE 14 ===

// ============================================================================
// PARTE 10 DE 14: VISTA 5 — MI PERFIL ESTILO WTA, ESTUDIO INTERACTIVO DE FOTO
// (ENCUADRE ZOOM/ÁNGULO + RECORTE AUTOMÁTICO DE SILUETA), COLECCIONES GRAND
// SLAM, 6 DISTINTIVOS OFICIALES, TERMÓMETRO CON PELOTA 3D Y AJUSTES TÁCTILES
// ============================================================================

// ----------------------------------------------------------------------------
// 1. ESTUDIO INTERACTIVO DE FOTO Y RECORTE DE SILUETA ESTILO WTA
//    (<PhotoFramingAndCutoutModal/>)
//    - Sube cualquier fotografía desde el celular o computadora y la comprime
//      automáticamente (< 55 KB) para nunca saturar la memoria de Safari iOS.
//    - Controles táctiles en vivo de Zoom (1x a 2.4x), Posición X/Y y Ángulo
//      (-15° a +15°).
//    - Botón de Recorte Automático de Silueta estilo WTA sobre los 4 fondos
//      oficiales de Grand Slam.
// ----------------------------------------------------------------------------
export function PhotoFramingAndCutoutModal({
  isOpen,
  onClose,
  currentUser,
  lightMode = false,
  onSavePlayerPhotoStudio,
}) {
  const [rawImageSrc, setRawImageSrc] = useState(
    currentUser?.avatar || INITIAL_PLAYERS[2].avatar
  );
  const [zoom, setZoom] = useState(currentUser?.photoFrame?.zoom || 1.08);
  const [offsetX, setOffsetX] = useState(currentUser?.photoFrame?.offsetX || 0);
  const [offsetY, setOffsetY] = useState(currentUser?.photoFrame?.offsetY || 0);
  const [angle, setAngle] = useState(currentUser?.photoFrame?.angle || 0);
  const [previewSurfaceId, setPreviewSurfaceId] = useState(
    currentUser?.surfaceThemeId || "finals"
  );
  const [cutoutPreview, setCutoutPreview] = useState(
    currentUser?.cutoutAvatar || ""
  );
  const [cutoutTolerance, setCutoutTolerance] = useState(40);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setRawImageSrc(currentUser.avatar || INITIAL_PLAYERS[2].avatar);
      setZoom(currentUser.photoFrame?.zoom || 1.05);
      setOffsetX(currentUser.photoFrame?.offsetX || 0);
      setOffsetY(currentUser.photoFrame?.offsetY || 0);
      setAngle(currentUser.photoFrame?.angle || 0);
      setPreviewSurfaceId(currentUser.surfaceThemeId || "finals");
      setCutoutPreview(currentUser.cutoutAvatar || "");
      setStatusMessage("");
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const activeSurface =
    GRAND_SLAM_SURFACES.find((s) => s.id === previewSurfaceId) ||
    GRAND_SLAM_SURFACES[0];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusMessage("Optimizando fotografía para pantalla Retina...");
    try {
      const compressed = await compressImageFile(file, 720, 0.82);
      setRawImageSrc(compressed);
      setCutoutPreview("");
      setZoom(1.05);
      setOffsetX(0);
      setOffsetY(0);
      setAngle(0);
      setStatusMessage("Fotografía cargada. Ajusta el encuadre o aplica el recorte.");
      triggerHaptic("success");
    } catch (err) {
      setStatusMessage("No se pudo leer la imagen seleccionada.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunSilhouetteCutout = async () => {
    if (!rawImageSrc) return;
    triggerHaptic("hero");
    setIsProcessing(true);
    setStatusMessage("Recortando silueta sobre el escenario Grand Slam...");
    try {
      const framedDataUrl = await renderFramedPlayerPhoto(rawImageSrc, {
        zoom,
        offsetX,
        offsetY,
        angle,
        outputWidth: 600,
        outputHeight: 750,
      });
      const cutoutUrl = await processWtaSilhouetteCutout(
        framedDataUrl,
        cutoutTolerance
      );
      setCutoutPreview(cutoutUrl);
      setStatusMessage("¡Silueta lista! Así se verá en tu portada y en el Ranking.");
      triggerHaptic("success");
    } catch (e) {
      setStatusMessage("Se aplicó el encuadre directo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveStudioChanges = async () => {
    triggerHaptic("success");
    setIsProcessing(true);
    try {
      const framedAvatar = await renderFramedPlayerPhoto(rawImageSrc, {
        zoom,
        offsetX,
        offsetY,
        angle,
        outputWidth: 600,
        outputHeight: 750,
      });

      if (onSavePlayerPhotoStudio) {
        onSavePlayerPhotoStudio({
          avatar: framedAvatar,
          cutoutAvatar: cutoutPreview || framedAvatar,
          photoFrame: { zoom, offsetX, offsetY, angle },
          surfaceThemeId: previewSurfaceId,
        });
      }
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Estudio de Foto y Silueta"
      subtitle="Ajusta el ángulo y el zoom de tu retrato o recorta tu silueta sobre las canchas oficiales."
      badgeText="RETRATO OFICIAL DEL CIRCUITO"
      iconName="camera"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        {/* 1. Visor en Vivo con Escenario Grand Slam Detrás */}
        <div
          className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border-2 border-[#00DC7D] shadow-2xl flex items-end justify-center select-none"
          style={{ background: activeSurface.fallbackGradient }}
        >
          <SmartImage
            src={activeSurface.bgAsset}
            alt={activeSurface.name}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(30,7,52,0.35) 0%, rgba(30,7,52,0.12) 45%, rgba(22,4,40,0.92) 100%)",
            }}
          />

          {/* Guías sutiles de encuadre de hombros y cabeza */}
          <div className="absolute inset-4 border border-dashed border-white/25 rounded-2xl pointer-events-none" />

          {/* Etiqueta superior del escenario activo */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734]/90 text-[#00DC7D] border border-[#00DC7D]/40 text-[10px] font-wta-display font-black uppercase">
              {activeSurface.name}
            </span>
            {cutoutPreview && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
                Silueta Activa
              </span>
            )}
          </div>

          {/* Imagen del Jugador con Transformaciones en Tiempo Real */}
          <div className="relative z-10 w-44 sm:w-48 h-56 sm:h-60 overflow-hidden rounded-t-3xl flex items-end justify-center">
            {cutoutPreview ? (
              <img
                src={cutoutPreview}
                alt="Silueta recortada"
                className="w-full h-full object-cover object-top drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
              />
            ) : (
              <img
                src={rawImageSrc}
                alt="Encuadre en vivo"
                style={{
                  transform: `translate(${offsetX}%, ${offsetY}%) rotate(${angle}deg) scale(${zoom})`,
                  transition: "transform 0.08s ease-out",
                }}
                className="w-full h-full object-cover object-top"
              />
            )}
          </div>

          {/* Botón flotante para subir foto desde el teléfono */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              fileInputRef.current?.click();
            }}
            className="absolute bottom-3 right-3 z-20 px-3.5 py-2 rounded-2xl bg-[#1E0734]/90 hover:bg-[#1E0734] text-[#00DC7D] border border-[#00DC7D]/60 text-xs font-wta-display font-extrabold flex items-center gap-1.5 shadow-lg mp-btn-tactile"
          >
            <WtaIcon name="camera" size={15} />
            <span>Subir otra foto</span>
          </button>
        </div>

        {statusMessage && (
          <div className="px-3.5 py-2 rounded-2xl bg-[#00DC7D]/15 border border-[#00DC7D]/35 text-[#00DC7D] text-xs font-bold text-center">
            {statusMessage}
          </div>
        )}

        {/* 2. Controles Deslizantes de Zoom, Posición y Ángulo */}
        <div
          className={`p-3.5 rounded-2xl border space-y-3 text-xs ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
              : "bg-[#1E0734] border-white/12 text-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] text-[11px]">
              AJUSTE DE ENCUADRE Y ÁNGULO
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setZoom(1.05);
                setOffsetX(0);
                setOffsetY(0);
                setAngle(0);
                setCutoutPreview("");
              }}
              className="text-[11px] font-bold opacity-75 hover:opacity-100 underline"
            >
              Restaurar centro
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span>Acercamiento (Zoom)</span>
                <span className="text-[#00DC7D] tabular-nums">
                  {zoom.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.9"
                max="2.2"
                step="0.02"
                value={zoom}
                onChange={(e) => {
                  setCutoutPreview("");
                  setZoom(Number(e.target.value));
                }}
                className="w-full accent-[#00DC7D]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span>Ángulo / Inclinación</span>
                <span className="text-[#00DC7D] tabular-nums">{angle}°</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={angle}
                onChange={(e) => {
                  setCutoutPreview("");
                  setAngle(Number(e.target.value));
                }}
                className="w-full accent-[#00DC7D]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span>Mover Izquierda / Derecha</span>
                <span className="text-[#00DC7D] tabular-nums">{offsetX}%</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={offsetX}
                onChange={(e) => {
                  setCutoutPreview("");
                  setOffsetX(Number(e.target.value));
                }}
                className="w-full accent-[#00DC7D]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span>Mover Arriba / Abajo</span>
                <span className="text-[#00DC7D] tabular-nums">{offsetY}%</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={offsetY}
                onChange={(e) => {
                  setCutoutPreview("");
                  setOffsetY(Number(e.target.value));
                }}
                className="w-full accent-[#00DC7D]"
              />
            </div>
          </div>

          {/* Herramienta de Recorte Automático de Silueta estilo WTA */}
          <div className="pt-2.5 border-t border-current/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold opacity-80">
                Sensibilidad de recorte:
              </span>
              <input
                type="range"
                min="22"
                max="68"
                step="2"
                value={cutoutTolerance}
                onChange={(e) => setCutoutTolerance(Number(e.target.value))}
                className="w-20 accent-[#00DC7D]"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRunSilhouetteCutout}
              className="py-2 px-3.5 rounded-xl bg-[#00DC7D]/20 hover:bg-[#00DC7D]/30 text-[#00DC7D] border border-[#00DC7D]/50 font-wta-display font-extrabold text-xs flex items-center gap-1.5 mp-btn-tactile"
            >
              <WtaIcon name="scissors" size={14} />
              <span>Recortar Silueta</span>
            </button>
          </div>
        </div>

        {/* 3. Vista Previa de los Fondos Desbloqueados */}
        <div>
          <span className="block text-[11px] font-wta-display font-extrabold uppercase tracking-wider opacity-75 mb-1.5">
            Probar con tus escenarios desbloqueados:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {GRAND_SLAM_SURFACES.map((surf) => {
              const isUnlocked =
                surf.unlockedByDefault ||
                (currentUser.unlockedThemes || []).includes(surf.id);
              const isSelected = previewSurfaceId === surf.id;
              return (
                <button
                  key={surf.id}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => {
                    triggerHaptic("tab");
                    setPreviewSurfaceId(surf.id);
                  }}
                  className={`p-2 rounded-xl border text-center text-[10px] font-extrabold transition-all mp-btn-tactile ${
                    isSelected
                      ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D]"
                      : isUnlocked
                      ? "bg-white/10 border-current/15"
                      : "opacity-40 cursor-not-allowed border-current/10"
                  }`}
                >
                  {surf.surfaceLabel}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={isProcessing}
          onClick={handleSaveStudioChanges}
          className="w-full py-3.5 px-6 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
        >
          <WtaIcon name="check" size={18} strokeWidth={2.6} />
          <span>Guardar Retrato en mi Perfil</span>
        </button>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 2. MODAL INDEPENDIENTE DE AJUSTES TÁCTILES (<PlayerTacticalSettingsModal/>)
//    - Selectores por botones (sin escribir a mano): Mano, Revés, Mejor Golpe,
//      Calendario de días L M M J V S D + turnos horarios, Club o Independiente.
//    - Control de Privacidad de WhatsApp (Ley N° 29733 Perú).
//    - Cambio Rápido de Cuenta Demo para que puedas probar retos entre tú mismo
//      en segundos sin crear cuentas nuevas.
// ----------------------------------------------------------------------------
export function PlayerTacticalSettingsModal({
  isOpen,
  onClose,
  currentUser,
  players = INITIAL_PLAYERS,
  sedes = INITIAL_SEDES,
  lightMode = false,
  onSaveProfileSettings,
  onSwitchActivePlayerAccount,
  onOpenCircuitGuide,
  onOpenAuthPortal,
}) {
  const [hand, setHand] = useState(currentUser?.hand || "Diestro");
  const [backhand, setBackhand] = useState(
    currentUser?.backhand || "Revés a dos manos"
  );
  const [bestShot, setBestShot] = useState(
    currentUser?.bestShot || "Derecha paralela profunda"
  );
  const [club, setClub] = useState(
    currentUser?.club || "Country Club Los Huancas"
  );
  const [individualMode, setIndividualMode] = useState(
    Boolean(currentUser?.individualMode)
  );
  const [whatsapp, setWhatsapp] = useState(
    currentUser?.whatsapp || "51999888777"
  );
  const [whatsappPrivacy, setWhatsappPrivacy] = useState(
    currentUser?.whatsappPrivacy || "rivals_only"
  );
  const [selectedDays, setSelectedDays] = useState(["Lun", "Mié", "Vie", "Sáb"]);
  const [selectedShift, setSelectedShift] = useState("Tardes / Noches (18:00 - 21:00)");

  useEffect(() => {
    if (isOpen && currentUser) {
      setHand(currentUser.hand || "Diestro");
      setBackhand(currentUser.backhand || "Revés a dos manos");
      setBestShot(currentUser.bestShot || "Derecha paralela profunda");
      setClub(currentUser.club || "Country Club Los Huancas");
      setIndividualMode(Boolean(currentUser.individualMode));
      setWhatsapp(currentUser.whatsapp || "51999888777");
      setWhatsappPrivacy(currentUser.whatsappPrivacy || "rivals_only");
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const toggleDay = (d) => {
    triggerHaptic("tab");
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]
    );
  };

  const handleSave = () => {
    triggerHaptic("success");
    const chosenSede = sedes.find((s) => s.name === club);
    const availabilityString = `${
      selectedDays.length > 0 ? selectedDays.join(", ") : "Fines de semana"
    } · ${selectedShift}`;

    if (onSaveProfileSettings) {
      onSaveProfileSettings({
        hand,
        backhand,
        bestShot,
        club,
        clubLogo: chosenSede?.logoAsset || ASSETS.clubCountry,
        individualMode,
        whatsapp: whatsapp.replace(/\s+/g, ""),
        whatsappPrivacy,
        availability: availabilityString,
      });
    }
    onClose();
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustes de Jugador y Cuenta"
      subtitle="Configura tu estilo de juego, horarios, privacidad de tu teléfono y cuenta activa."
      badgeText="CONFIGURACIÓN PERSONAL"
      iconName="settings"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        {/* 1. Mano Hábil y Tipo de Revés (Botones Táctiles) */}
        <div
          className={`p-3.5 rounded-2xl border space-y-3 ${
            lightMode
              ? "bg-white border-[#1E0734]/12"
              : "bg-[#1E0734] border-white/12"
          }`}
        >
          <span className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
            1. MANO DE JUEGO Y REVÉS
          </span>

          <div className="grid grid-cols-2 gap-2">
            {["Diestro", "Zurdo"].map((hOpt) => (
              <button
                key={hOpt}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setHand(hOpt);
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold mp-btn-tactile ${
                  hand === hOpt
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] shadow-sm"
                    : "bg-current/5 border-current/15"
                }`}
              >
                {hOpt}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              "Revés a dos manos",
              "Revés a una mano",
              "Revés con slice",
            ].map((bhOpt) => (
              <button
                key={bhOpt}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setBackhand(bhOpt);
                }}
                className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center mp-btn-tactile ${
                  backhand === bhOpt
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold"
                    : "bg-current/5 border-current/15"
                }`}
              >
                {bhOpt}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Mejor Golpe en Cancha (Píldoras Táctiles) */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            lightMode
              ? "bg-white border-[#1E0734]/12"
              : "bg-[#1E0734] border-white/12"
          }`}
        >
          <span className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
            2. TU MEJOR GOLPE
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Derecha paralela profunda",
              "Derecha invertida con topspin",
              "Primer saque plano potente",
              "Saque abierto con efecto",
              "Contraataque de fondo",
              "Volea de definición en la red",
              "Dejada corta y globo",
            ].map((shot) => (
              <button
                key={shot}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setBestShot(shot);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border mp-btn-tactile ${
                  bestShot === shot
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold"
                    : "bg-current/5 border-current/15"
                }`}
              >
                {shot}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Disponibilidad Horaria Visual (L M M J V S D + Turnos) */}
        <div
          className={`p-3.5 rounded-2xl border space-y-3 ${
            lightMode
              ? "bg-white border-[#1E0734]/12"
              : "bg-[#1E0734] border-white/12"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D]">
              3. DÍAS Y HORARIOS PARA JUGAR
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setSelectedDays(["Sáb", "Dom"]);
              }}
              className="text-[10px] font-extrabold text-[#00DC7D] underline"
            >
              Solo fines de semana
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => {
              const active = selectedDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`py-2 rounded-xl border text-xs font-extrabold mp-btn-tactile ${
                    active
                      ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D]"
                      : "bg-current/5 border-current/15 opacity-75"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              "Mañanas (06:30 - 11:00)",
              "Tardes (14:00 - 18:00)",
              "Tardes / Noches (18:00 - 21:00)",
            ].map((sh) => (
              <button
                key={sh}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setSelectedShift(sh);
                }}
                className={`p-2 rounded-xl border text-[11px] font-bold text-center mp-btn-tactile ${
                  selectedShift === sh
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold"
                    : "bg-current/5 border-current/15"
                }`}
              >
                {sh}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Club de Procedencia o Jugador Independiente */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            lightMode
              ? "bg-white border-[#1E0734]/12"
              : "bg-[#1E0734] border-white/12"
          }`}
        >
          <span className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
            4. CLUB O MODALIDAD INDEPENDIENTE
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {sedes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setIndividualMode(false);
                  setClub(s.name);
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs font-bold mp-btn-tactile ${
                  !individualMode && club === s.name
                    ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold"
                    : "bg-current/5 border-current/15"
                }`}
              >
                <SmartImage
                  src={s.logoAsset}
                  alt={s.shortName}
                  className="w-5 h-5 rounded-full object-contain bg-white p-0.5 shrink-0"
                />
                <span className="truncate">{s.shortName}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setIndividualMode(true);
            }}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-extrabold mp-btn-tactile ${
              individualMode
                ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D]"
                : "bg-current/5 border-current/15"
            }`}
          >
            Juego de forma independiente (sin club fijo)
          </button>
        </div>

        {/* 5. Privacidad de mi WhatsApp (Cumplimiento Ley N° 29733 — Perú) */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            lightMode
              ? "bg-white border-[#1E0734]/12"
              : "bg-[#1E0734] border-white/12"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D]">
              5. PRIVACIDAD DE MI WHATSAPP
            </span>
            <WtaIcon name="shield" size={15} className="text-[#00DC7D]" />
          </div>

          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="51999888777"
            className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold mp-input-alive ${
              lightMode
                ? "bg-[#FAF9F5] border-[#1E0734]/20 text-[#1E0734]"
                : "bg-[#23083C] border-white/20 text-white"
            }`}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setWhatsappPrivacy("rivals_only");
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold text-left mp-btn-tactile ${
                whatsappPrivacy === "rivals_only"
                  ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold"
                  : "bg-current/5 border-current/15"
              }`}
            >
              Solo rivales con reto aceptado
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setWhatsappPrivacy("public");
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold text-left mp-btn-tactile ${
                whatsappPrivacy === "public"
                  ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold"
                  : "bg-current/5 border-current/15"
              }`}
            >
              Visible para el circuito
            </button>
          </div>
        </div>

        {/* 6. Cambio Rápido de Cuenta / Simulador Multi-Jugador para Pruebas */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            lightMode
              ? "bg-[#FAF9F5] border-[#1E0734]/15"
              : "bg-[#290C46]/70 border-[#00DC7D]/35"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D]">
              CAMBIAR DE CUENTA ACTIVA
            </span>
            {onOpenAuthPortal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthPortal("login");
                }}
                className="text-xs font-extrabold text-[#00DC7D] underline"
              >
                Portal Login / Registro ➔
              </button>
            )}
          </div>

          <p className="text-[11px] opacity-75">
            Alterna entre perfiles para probar el envío y aceptación de retos en tiempo
            real:
          </p>

          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {players.map((p) => {
              const isCurrent = p.id === currentUser.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("hero");
                    if (onSwitchActivePlayerAccount) {
                      onSwitchActivePlayerAccount(p.id);
                    }
                    onClose();
                  }}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs mp-btn-tactile ${
                    isCurrent
                      ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] font-extrabold"
                      : "bg-black/20 border-current/15 font-semibold"
                  }`}
                >
                  <SmartImage
                    src={p.avatar}
                    alt={p.name}
                    isAvatar
                    className="w-6 h-6 rounded-lg object-cover shrink-0"
                  />
                  <span className="truncate">{p.firstName || p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botones Finales: Guía del Circuito y Guardar Ajustes */}
        <div className="flex items-center gap-2 pt-1">
          {onOpenCircuitGuide && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCircuitGuide();
              }}
              className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-current/20 font-wta-display font-bold text-xs mp-btn-tactile"
            >
              Guía del Circuito
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3.5 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
          >
            <WtaIcon name="check" size={18} strokeWidth={2.6} />
            <span>Guardar mis ajustes</span>
          </button>
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 3. VISTA PRINCIPAL 5: MI PERFIL ESTILO WTA (<PlayerProfileWtaView/>)
//    - Cabecera Hero con foto grande recortada, botón directo "Encuadrar Foto",
//      tuerca ⚙️ con rotación de 45° y nombre apilado en Verde Esmeralda.
//    - 4 tarjetas simétricas de métricas (sin llama si victorias = 0).
//    - Termómetro monocromático de ascenso con pelota 3D en la punta móvil
//      (ocultando la etiqueta de partidos de prueba cuando ya completó 5/5).
//    - Colecciones Grand Slam (4 pósteres verticales 3:4 estilo WTA Collections).
//    - Vitrina de los 6 Distintivos Oficiales canjeables con Gemas.
//    - Vista previa interactiva del Carnet Digital Socio VIP y Últimos Partidos.
// ----------------------------------------------------------------------------
export function PlayerProfileWtaView({
  currentUser,
  players = INITIAL_PLAYERS,
  matches = INITIAL_MATCHES,
  sedes = INITIAL_SEDES,
  lightMode = false,
  onUpdateCurrentUser,
  onSwitchActivePlayerAccount,
  onOpenVipCardModal,
  onOpenProShopModal,
  onOpenH2HWithPlayers,
  onOpenStoryPoster,
  onOpenCircuitGuide,
  onOpenAuthPortal,
}) {
  const [showPhotoStudio, setShowPhotoStudio] = useState(false);
  const [showTacticalSettings, setShowTacticalSettings] = useState(false);
  const [customFeedback, setCustomFeedback] = useState("");

  if (!currentUser) return null;

  const catInfo = getCategoryProgress(currentUser.elo);
  const totalMatches =
    Number(currentUser.wins || 0) + Number(currentUser.losses || 0);
  const winRate =
    totalMatches > 0
      ? Math.round((Number(currentUser.wins || 0) / totalMatches) * 100)
      : 0;

  // Reglas estrictas:
  // 1) Si victorias === 0, jamás renderiza llama ni racha.
  // 2) Si ya completó los 5 partidos iniciales, oculta por completo el aviso de prueba.
  const hasRealStreak =
    Number(currentUser.wins || 0) > 0 && Number(currentUser.streak || 0) > 0;
  const isStillInTrial = Number(currentUser.matchesPlayed || 0) < 5;

  const activeSurface =
    GRAND_SLAM_SURFACES.find((s) => s.id === currentUser.surfaceThemeId) ||
    GRAND_SLAM_SURFACES[0];

  const activeBadge =
    OFFICIAL_PROFILE_BADGES.find((b) => b.id === currentUser.activeBadgeId) ||
    null;

  const myRecentMatches = useMemo(
    () =>
      matches.filter(
        (m) => m.playerAId === currentUser.id || m.playerBId === currentUser.id
      ),
    [matches, currentUser.id]
  );

  // Equipa o desbloquea un escenario Grand Slam con Gemas
  const handleSelectOrUnlockSurface = (surf) => {
    const unlockedList = currentUser.unlockedThemes || ["finals"];
    const alreadyOwned =
      surf.unlockedByDefault || unlockedList.includes(surf.id);

    if (alreadyOwned) {
      triggerHaptic("tab");
      onUpdateCurrentUser({ surfaceThemeId: surf.id });
      setCustomFeedback(`Escenario ${surf.name} activado en tu portada.`);
      return;
    }

    if (Number(currentUser.gems || 0) < surf.costGems) {
      triggerHaptic("light");
      setCustomFeedback(
        `Necesitas ${surf.costGems} Gemas para desbloquear ${surf.name} (tienes ${currentUser.gems} Gemas).`
      );
      return;
    }

    triggerHaptic("success");
    onUpdateCurrentUser({
      gems: Number(currentUser.gems || 0) - surf.costGems,
      unlockedThemes: [...unlockedList, surf.id],
      surfaceThemeId: surf.id,
    });
    setCustomFeedback(`¡Desbloqueaste el escenario ${surf.name}!`);
  };

  // Equipa o desbloquea uno de los 6 Distintivos Oficiales
  const handleSelectOrUnlockBadge = (badge) => {
    const unlockedBadges = currentUser.unlockedBadges || [];
    const alreadyOwned = unlockedBadges.includes(badge.id);

    if (alreadyOwned) {
      triggerHaptic("tab");
      const nextBadgeId =
        currentUser.activeBadgeId === badge.id ? "" : badge.id;
      onUpdateCurrentUser({ activeBadgeId: nextBadgeId });
      setCustomFeedback(
        nextBadgeId
          ? `Distintivo "${badge.name}" equipado junto a tu nombre.`
          : "Distintivo ocultado."
      );
      return;
    }

    if (Number(currentUser.gems || 0) < badge.costGems) {
      triggerHaptic("light");
      setCustomFeedback(
        `Necesitas ${badge.costGems} Gemas para canjear el distintivo "${badge.name}".`
      );
      return;
    }

    triggerHaptic("success");
    onUpdateCurrentUser({
      gems: Number(currentUser.gems || 0) - badge.costGems,
      unlockedBadges: [...unlockedBadges, badge.id],
      activeBadgeId: badge.id,
    });
    setCustomFeedback(`¡Canjeaste y equipaste el distintivo "${badge.name}"!`);
  };

  return (
    <div className="space-y-4 px-3.5 sm:px-5 pt-2 pb-6 mp-view-enter">
      {/* 1. CABECERA HERO MONUMENTAL ESTILO WTA (ELENA RYBAKINA PROFILE) */}
      <div
        className="relative rounded-3xl overflow-hidden min-h-[296px] sm:min-h-[325px] p-4 sm:p-6 flex flex-col justify-between border border-white/15 shadow-2xl"
        style={{ background: activeSurface.fallbackGradient }}
      >
        <SmartImage
          src={activeSurface.bgAsset}
          alt={activeSurface.name}
          eager
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(30,7,52,0.5) 0%, rgba(30,7,52,0.18) 38%, rgba(30,7,52,0.92) 82%, #1E0734 100%)",
          }}
        />

        {/* Retrato / Silueta Recortada del Tenista a la Derecha */}
        <div
          onClick={() => {
            triggerHaptic("card");
            setShowPhotoStudio(true);
          }}
          title="Toca para ajustar encuadre o recortar silueta"
          className="absolute right-2 sm:right-5 bottom-0 w-44 sm:w-56 h-60 sm:h-72 z-10 flex items-end justify-center cursor-pointer group"
        >
          <SmartImage
            src={currentUser.cutoutAvatar || currentUser.avatar}
            alt={currentUser.name}
            isAvatar
            eager
            className="w-full h-full object-cover object-top rounded-t-3xl border-t-2 border-x-2 border-[#00DC7D]/60 shadow-[0_14px_35px_rgba(0,0,0,0.65)] transform transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>

        {/* Fila Superior: Puesto Oficial + Botones de Estudio de Foto y Ajustes ⚙️ */}
        <div className="relative z-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#00DC7D] text-[#1E0734] font-wta-display font-black text-xs uppercase tracking-wider shadow-md">
              PUESTO #{currentUser.rank}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/45 text-white border border-white/20 text-[10px] font-wta-display font-extrabold uppercase tracking-wider backdrop-blur-md">
              {activeSurface.surfaceLabel}
            </span>
            {Number(currentUser.age || 30) >= 40 && (
              <span className="px-2.5 py-1 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
                +40 MASTER
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setShowPhotoStudio(true);
              }}
              className="px-3 py-2 rounded-2xl bg-black/50 hover:bg-black/70 text-[#00DC7D] border border-[#00DC7D]/50 text-xs font-wta-display font-extrabold flex items-center gap-1.5 backdrop-blur-md mp-btn-tactile"
            >
              <WtaIcon name="camera" size={14} />
              <span className="hidden xs:inline">Encuadrar foto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setShowTacticalSettings(true);
              }}
              aria-label="Abrir ajustes de perfil"
              className="w-9 h-9 rounded-2xl bg-black/50 hover:bg-black/70 text-white border border-white/25 flex items-center justify-center backdrop-blur-md mp-gear-spin"
            >
              <WtaIcon name="settings" size={17} />
            </button>
          </div>
        </div>

        {/* Bloque Central/Inferior Izquierdo: Distintivo + Nombre Gigante Apilado + Club */}
        <div className="relative z-20 mt-14 max-w-[60%] space-y-1.5">
          {activeBadge && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1E0734]/90 border border-[#00DC7D] text-[#00DC7D] text-[10px] font-wta-display font-extrabold shadow-sm">
              <SmartImage
                src={activeBadge.asset}
                alt={activeBadge.shortLabel}
                className="w-3.5 h-3.5 object-contain"
              />
              <span>{activeBadge.name}</span>
            </div>
          )}

          <div>
            <div className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase text-white leading-none tracking-tight">
              {currentUser.firstName || currentUser.name.split(" ")[0]}
            </div>
            <div className="font-wta-condensed text-3xl sm:text-5xl font-bold uppercase text-[#00DC7D] leading-none tracking-tight mt-0.5">
              {currentUser.lastName ||
                currentUser.name.split(" ").slice(1).join(" ")}
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2 text-xs font-bold text-white/90">
            {!currentUser.individualMode && currentUser.clubLogo && (
              <SmartImage
                src={currentUser.clubLogo}
                alt={currentUser.club}
                className="w-5 h-5 rounded-full object-contain bg-white p-0.5 shrink-0"
              />
            )}
            <span className="truncate">
              {currentUser.individualMode
                ? "Tenista Independiente · Huancayo"
                : currentUser.club}
            </span>
          </div>

          {/* Solo aparece si tiene menos de 5 partidos jugados */}
          {isStillInTrial && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/50 text-[#38BDF8] text-[10px] font-extrabold">
              <span>
                Partidos de prueba ({currentUser.matchesPlayed || 0} de 5)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. LAS 4 CAJAS SIMÉTRICAS DE ESTADÍSTICAS (ALINEADAS VERTICAL Y HORIZONTALMENTE) */}
      <div className="grid grid-cols-4 gap-2">
        <div
          className={`p-3 rounded-2xl border text-center flex flex-col justify-center ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734] shadow-sm"
              : "bg-[#23083C] border-white/12 text-white shadow-md"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase opacity-65">
            Puntos
          </span>
          <span className="font-wta-condensed text-2xl sm:text-3xl font-bold text-[#00DC7D] tabular-nums leading-none mt-1">
            {currentUser.elo}
          </span>
          <span className="text-[10px] font-bold opacity-80 mt-1 truncate">
            {catInfo.currentCat.name}
          </span>
        </div>

        <div
          className={`p-3 rounded-2xl border text-center flex flex-col justify-center ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734] shadow-sm"
              : "bg-[#23083C] border-white/12 text-white shadow-md"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase opacity-65">
            Efectividad
          </span>
          <span className="font-wta-condensed text-2xl sm:text-3xl font-bold tabular-nums leading-none mt-1">
            {winRate}%
          </span>
          <span className="text-[10px] font-bold opacity-80 mt-1">
            {currentUser.wins}V - {currentUser.losses}D
          </span>
        </div>

        <div
          onClick={() => {
            triggerHaptic("tab");
            if (onOpenProShopModal) onOpenProShopModal();
          }}
          className={`p-3 rounded-2xl border text-center flex flex-col justify-center cursor-pointer wta-card-aura ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734] shadow-sm"
              : "bg-[#23083C] border-white/12 text-white shadow-md"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase opacity-65">
            Mis Gemas
          </span>
          <span className="font-wta-condensed text-2xl sm:text-3xl font-bold text-[#F59E0B] tabular-nums leading-none mt-1 flex items-center justify-center gap-1">
            <span>{currentUser.gems || 0}</span>
            <WtaIcon name="gem" size={16} className="text-[#00DC7D]" />
          </span>
          <span className="text-[10px] font-extrabold text-[#00DC7D] mt-1">
            Canjear ➔
          </span>
        </div>

        <div
          className={`p-3 rounded-2xl border text-center flex flex-col justify-center ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734] shadow-sm"
              : "bg-[#23083C] border-white/12 text-white shadow-md"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase opacity-65">
            Estado
          </span>
          {hasRealStreak ? (
            <>
              <div className="font-wta-condensed text-2xl sm:text-3xl font-bold text-[#00DC7D] leading-none mt-1 flex items-center justify-center gap-1">
                <SmartImage
                  src={ASSETS.fuegoRacha}
                  alt="Racha"
                  className="w-4 h-4 object-contain"
                />
                <span>+{currentUser.streak}</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#00DC7D] mt-1">
                En racha
              </span>
            </>
          ) : (
            <>
              <span className="font-wta-condensed text-xl sm:text-2xl font-bold leading-none mt-1">
                #{currentUser.bestRank || currentUser.rank}
              </span>
              <span className="text-[10px] font-bold opacity-75 mt-1">
                Mejor puesto
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. BARRA DE ASCENSO ESTILO TERMÓMETRO MONOCROMÁTICO CON PELOTA 3D */}
      <div
        className={`p-4 rounded-3xl border shadow-md ${
          lightMode
            ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
            : "bg-[#23083C] border-white/12 text-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2 text-xs font-extrabold mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
              {catInfo.currentCat.fullName}
            </span>
            {catInfo.nextCat && (
              <span className="opacity-75">➔ {catInfo.nextCat.name}</span>
            )}
          </div>
          <span className="text-[#00DC7D] tabular-nums">
            {catInfo.nextCat
              ? `A ${catInfo.pointsToNext} pts del ascenso`
              : "Categoría Máxima Alcanzada"}
          </span>
        </div>

        {/* Termómetro de un solo color sólido + Pelota 3D en la punta */}
        <div className="relative h-3.5 rounded-full bg-black/30 border border-current/15 my-2.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              lightMode ? "bg-[#1E0734]" : "bg-white"
            }`}
            style={{ width: `${catInfo.progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 pointer-events-none transition-all duration-500"
            style={{ left: `${catInfo.progressPercent}%` }}
          >
            <SmartImage
              src={ASSETS.pelotaVoltAzul}
              alt="Pelota 3D"
              className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold opacity-75">
          <span>Piso asegurado: {catInfo.activeFloor} pts</span>
          <span>Puntaje actual: {currentUser.elo} pts</span>
          {catInfo.nextCat && <span>Meta: {catInfo.nextThreshold} pts</span>}
        </div>
      </div>

      {/* 4. FICHA DE JUEGO COMPACTA + ACCESO AL CARNET DIGITAL SOCIO VIP 3D */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Perfil de Cancha (Mano, Mejor Golpe y Horarios) */}
        <div
          className={`md:col-span-7 p-4 rounded-3xl border flex flex-col justify-between space-y-3 ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
              : "bg-[#23083C] border-white/12 text-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-wta-condensed text-xl font-bold uppercase tracking-tight text-[#00DC7D]">
              FICHA DE JUEGO Y HORARIOS
            </h3>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setShowTacticalSettings(true);
              }}
              className="text-xs font-extrabold text-[#00DC7D] hover:underline flex items-center gap-1"
            >
              <span>Editar</span>
              <WtaIcon name="chevron-right" size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-2xl bg-current/5 border border-current/10">
              <span className="text-[10px] font-bold uppercase opacity-65 block">
                Mano y Revés
              </span>
              <strong className="font-extrabold block mt-0.5">
                {currentUser.hand || "Diestro"} ·{" "}
                {currentUser.backhand || "Dos manos"}
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-current/5 border border-current/10">
              <span className="text-[10px] font-bold uppercase opacity-65 block">
                Golpe Firma
              </span>
              <strong className="font-extrabold text-[#00DC7D] block mt-0.5 truncate">
                {currentUser.bestShot || "Derecha con topspin"}
              </strong>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-current/5 border border-current/10 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase opacity-65 block">
                Disponibilidad para retos
              </span>
              <strong className="font-extrabold block truncate">
                {currentUser.availability || "Lun a Sáb · Tardes"}
              </strong>
            </div>
            <WtaIcon name="clock" size={16} className="text-[#00DC7D] shrink-0" />
          </div>
        </div>

        {/* Tarjeta de Acceso Rápido al Carnet Digital Socio VIP Metálico 3D */}
        <div
          onClick={() => {
            triggerHaptic("hero");
            if (onOpenVipCardModal) onOpenVipCardModal();
          }}
          className="md:col-span-5 p-4 rounded-3xl bg-gradient-to-br from-[#290C46] via-[#1E0734] to-[#120322] text-white border-2 border-[#F59E0B]/60 shadow-xl flex flex-col justify-between cursor-pointer group wta-card-aura relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#F59E0B]/20 blur-xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider">
              {currentUser.isVip ? "SOCIO VIP ACTIVO" : "PASE SOCIO VIP"}
            </span>
            <SmartImage
              src={ASSETS.goldenTicket}
              alt="VIP"
              className="w-8 h-8 object-contain"
            />
          </div>

          <div className="my-2">
            <h4 className="font-wta-condensed text-2xl font-bold uppercase text-white leading-none">
              CARNET DIGITAL METÁLICO 3D
            </h4>
            <p className="text-xs text-white/75 mt-1">
              {currentUser.isVip
                ? `Código ${currentUser.vipCode || "MP-2026-VIP"} · Descuentos activos en las 4 sedes y multiplicador x2.5 de Gemas.`
                : "Descuentos de S/ 6 a S/ 10 por hora en canchas aliadas, cofre de 150 Gemas y beneficios en tienda."}
            </p>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs font-extrabold text-[#00DC7D]">
            <span>
              {currentUser.isVip
                ? "Abrir mi Carnet 3D en cancha"
                : "Ver beneficios VIP (S/ 29.90/mes)"}
            </span>
            <WtaIcon name="arrow-right" size={15} />
          </div>
        </div>
      </div>

      {/* 5. COLECCIONES GRAND SLAM (4 PÓSTERES VERTICALES 3:4 ESTILO WTA COLLECTIONS)
          + VITRINA DE LOS 6 DISTINTIVOS OFICIALES */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
          lightMode
            ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
            : "bg-[#23083C] border-white/12 text-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
              PERSONALIZACIÓN DE PORTADA Y NOMBRE
            </span>
            <h3 className="font-wta-condensed text-2xl font-bold uppercase">
              ESCENARIOS GRAND SLAM Y DISTINTIVOS OFICIALES
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/45 text-[#F59E0B] text-xs font-extrabold">
            <span>Saldo: {currentUser.gems || 0}</span>
            <WtaIcon name="gem" size={14} className="text-[#00DC7D]" />
          </span>
        </div>

        {customFeedback && (
          <div className="px-3.5 py-2 rounded-2xl bg-[#00DC7D]/15 border border-[#00DC7D]/40 text-[#00DC7D] text-xs font-bold">
            {customFeedback}
          </div>
        )}

        {/* 4 Pósteres Verticales de Superficies Grand Slam */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GRAND_SLAM_SURFACES.map((surf) => {
            const isOwned =
              surf.unlockedByDefault ||
              (currentUser.unlockedThemes || []).includes(surf.id);
            const isEquipped = currentUser.surfaceThemeId === surf.id;

            return (
              <div
                key={surf.id}
                onClick={() => handleSelectOrUnlockSurface(surf)}
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 cursor-pointer group wta-card-aura flex flex-col justify-between p-3 text-white ${
                  isEquipped ? "border-[#00DC7D]" : "border-white/15"
                }`}
              >
                <SmartImage
                  src={surf.bgAsset}
                  alt={surf.name}
                  className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E0734] via-[#1E0734]/30 to-black/35" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-black/55 text-[9px] font-wta-display font-black uppercase">
                    {surf.surfaceLabel}
                  </span>
                  {isEquipped && (
                    <span className="w-5 h-5 rounded-full bg-[#00DC7D] text-[#1E0734] flex items-center justify-center">
                      <WtaIcon name="check" size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="relative z-10 space-y-1.5">
                  <h4 className="font-wta-condensed text-base sm:text-lg font-bold uppercase leading-tight">
                    {surf.name}
                  </h4>

                  <span
                    className={`w-full py-1.5 px-2 rounded-xl text-[10px] font-wta-display font-extrabold flex items-center justify-center gap-1 ${
                      isEquipped
                        ? "bg-[#00DC7D] text-[#1E0734]"
                        : isOwned
                        ? "bg-white text-[#1E0734]"
                        : "bg-[#1E0734]/90 text-[#F59E0B] border border-[#F59E0B]/50"
                    }`}
                  >
                    {isEquipped
                      ? "En uso"
                      : isOwned
                      ? "Activar fondo"
                      : `Canjear ${surf.costGems} 💎`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Los 6 Distintivos / Parches Oficiales junto al Nombre */}
        <div className="pt-2 border-t border-current/10">
          <span className="text-xs font-extrabold block mb-2">
            Distintivos junto a tu nombre en el Ranking:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OFFICIAL_PROFILE_BADGES.map((bdg) => {
              const isOwned = (currentUser.unlockedBadges || []).includes(bdg.id);
              const isEquipped = currentUser.activeBadgeId === bdg.id;

              return (
                <button
                  key={bdg.id}
                  type="button"
                  onClick={() => handleSelectOrUnlockBadge(bdg)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 mp-btn-tactile ${
                    isEquipped
                      ? "border-2 border-[#00DC7D] bg-[#00DC7D]/15"
                      : lightMode
                      ? "bg-[#FAF9F5] border-[#1E0734]/12"
                      : "bg-[#1E0734] border-white/12"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SmartImage
                      src={bdg.asset}
                      alt={bdg.name}
                      className="w-8 h-8 object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold truncate">
                        {bdg.shortLabel}
                      </div>
                      <div className="text-[10px] text-[#00DC7D] font-bold">
                        {isEquipped
                          ? "Equipado ✓"
                          : isOwned
                          ? "Toca para usar"
                          : `${bdg.costGems} Gemas`}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. ÚLTIMOS PARTIDOS DEL JUGADOR (LATEST MATCHES WTA CON GANADOR EN ESMERALDA ◀) */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border space-y-3 ${
          lightMode
            ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
            : "bg-[#23083C] border-white/12 text-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
              HISTORIAL VERIFICADO EN CANCHA
            </span>
            <h3 className="font-wta-condensed text-2xl font-bold uppercase">
              MIS ÚLTIMOS PARTIDOS ({myRecentMatches.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              if (onOpenH2HWithPlayers) {
                onOpenH2HWithPlayers(currentUser, players[0]);
              }
            }}
            className="px-3 py-1.5 rounded-full bg-[#00DC7D]/15 text-[#00DC7D] text-xs font-extrabold flex items-center gap-1 mp-btn-tactile"
          >
            <WtaIcon name="h2h" size={14} />
            <span>Comparar H2H</span>
          </button>
        </div>

        {myRecentMatches.length === 0 ? (
          <div className="p-6 rounded-2xl border border-current/10 text-center space-y-2">
            <SmartImage
              src={
                lightMode ? ASSETS.estadoVacioClaro : ASSETS.estadoVacioOscuro
              }
              alt="Sin partidos"
              className="w-20 h-16 object-contain mx-auto opacity-85"
            />
            <p className="text-xs font-bold">
              Aún no tienes partidos registrados esta temporada. ¡Lanza un reto en
              cancha!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {myRecentMatches.map((m) => {
              const iWon = m.winnerId === currentUser.id;
              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border space-y-2 wta-card-aura ${
                    lightMode
                      ? "bg-[#FAF9F5] border-[#1E0734]/12"
                      : "bg-[#1E0734] border-white/12"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                    <span className="text-[#C85A32] truncate">
                      {m.club} · ARCILLA
                    </span>
                    <span
                      className={
                        iWon
                          ? "px-2 py-0.5 rounded bg-[#00DC7D] text-[#1E0734]"
                          : "opacity-70"
                      }
                    >
                      {iWon ? `VICTORIA (+${m.eloDelta || 35} PTS)` : "PARTIDO DISPUTADO"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          m.winnerId === m.playerAId
                            ? "font-extrabold text-[#00DC7D]"
                            : "opacity-75"
                        }
                      >
                        {m.playerAName} {m.winnerId === m.playerAId ? "◀" : ""}
                      </span>
                      <span className="font-wta-condensed text-base font-bold tabular-nums">
                        {Array.isArray(m.sets)
                          ? m.sets.map((s) => s.a).join("  ")
                          : m.score}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-current/10">
                      <span
                        className={
                          m.winnerId === m.playerBId
                            ? "font-extrabold text-[#00DC7D]"
                            : "opacity-75"
                        }
                      >
                        {m.playerBName} {m.winnerId === m.playerBId ? "◀" : ""}
                      </span>
                      <span className="font-wta-condensed text-base font-bold tabular-nums">
                        {Array.isArray(m.sets)
                          ? m.sets.map((s) => s.b).join("  ")
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-current/10 flex items-center justify-between text-[11px]">
                    <span className="opacity-65">{m.date}</span>
                    {onOpenStoryPoster && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenStoryPoster({
                            winnerName: m.winnerName,
                            loserName:
                              m.winnerId === m.playerAId
                                ? m.playerBName
                                : m.playerAName,
                            scoreText: m.score,
                            club: m.club,
                          })
                        }
                        className="font-extrabold text-[#00DC7D] flex items-center gap-1"
                      >
                        <WtaIcon name="share" size={12} />
                        <span>Compartir Story</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Estudio Interactivo de Foto y Silueta */}
      <PhotoFramingAndCutoutModal
        isOpen={showPhotoStudio}
        onClose={() => setShowPhotoStudio(false)}
        currentUser={currentUser}
        lightMode={lightMode}
        onSavePlayerPhotoStudio={(studioUpdates) => {
          onUpdateCurrentUser(studioUpdates);
          setCustomFeedback("¡Tu nuevo retrato oficial ha sido actualizado!");
        }}
      />

      {/* Modal 2: Ajustes Táctiles y Cambio Rápido de Cuenta */}
      <PlayerTacticalSettingsModal
        isOpen={showTacticalSettings}
        onClose={() => setShowTacticalSettings(false)}
        currentUser={currentUser}
        players={players}
        sedes={sedes}
        lightMode={lightMode}
        onSaveProfileSettings={(settingsUpdates) => {
          onUpdateCurrentUser(settingsUpdates);
          setCustomFeedback("Tus preferencias de juego han sido guardadas.");
        }}
        onSwitchActivePlayerAccount={onSwitchActivePlayerAccount}
        onOpenCircuitGuide={onOpenCircuitGuide}
        onOpenAuthPortal={onOpenAuthPortal}
      />
    </div>
  );
}

// === FIN DEL BLOQUE 10 DE 14 ===

// ============================================================================
// PARTE 11 DE 14 (RECONSTRUIDO Y AUDITADO AL MILÍMETRO):
// 1. MODAL DE PAGO DIRECTO YAPE/PLIN (BLINDAJE SBS + MATRIZ QR DINÁMICA +
//    SUBIDA DE CAPTURA DE COMPROBANTE + ESTADO "PAGO EN VERIFICACIÓN")
// 2. CARNET DIGITAL SOCIO VIP 3D (GIROSCOPIO ±7° + GIRO ANVERSO/REVERSO 180° +
//    PLAN MENSUAL S/ 29.90 Y ANUAL S/ 279.00 + CALCULADORA DE AHORRO EN CANCHA)
// 3. TIENDA OFICIAL PRO SHOP EN 3 ESCALONES (BUSCADOR VIVO + COMPARADOR DE
//    PRECIO TIENDA PERÚ VS COPAGO GEMAS + GENERADOR DE VOUCHER MP-CANJE-XXXX)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. GENERADOR VECTORIAL DINÁMICO DE MATRIZ QR (<DynamicPaymentQrSvg/>)
//    Genera un patrón QR determinista único a partir del canal (Yape/Plin),
//    número oficial, monto en Soles y concepto del servicio.
// ----------------------------------------------------------------------------
export function DynamicPaymentQrSvg({
  payloadString = "MATCHPOINT|999888777|29.90",
  channel = "Yape",
  size = 148,
}) {
  const cells = 21;
  const matrix = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < payloadString.length; i++) {
      hash ^= payloadString.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const grid = Array.from({ length: cells }, () => Array(cells).fill(false));

    const drawFinderPattern = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (isBorder || isInner) {
            grid[r0 + r][c0 + c] = true;
          }
        }
      }
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(0, cells - 7);
    drawFinderPattern(cells - 7, 0);

    for (let i = 8; i < cells - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    let seed = Math.abs(hash) || 123456789;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= cells - 8;
        const inBottomLeft = r >= cells - 8 && c < 8;
        const inCenterBadge = r >= 8 && r <= 12 && c >= 8 && c <= 12;
        if (inTopLeft || inTopRight || inBottomLeft || inCenterBadge || r === 6 || c === 6) {
          continue;
        }
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        grid[r][c] = (seed & 3) !== 0;
      }
    }
    return grid;
  }, [payloadString]);

  const accentColor = channel === "Yape" ? "#742284" : "#00A859";

  return (
    <div className="relative inline-flex items-center justify-center p-3 rounded-3xl bg-white border-2 border-[#1E0734]/15 shadow-md">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${cells} ${cells}`}
        shapeRendering="crispEdges"
        className="rounded-xl"
      >
        <rect width={cells} height={cells} fill="#FFFFFF" />
        {matrix.map((row, rIdx) =>
          row.map((val, cIdx) =>
            val ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx}
                y={rIdx}
                width={1}
                height={1}
                fill="#1E0734"
              />
            ) : null
          )
        )}
        {/* Emblema Central del Canal */}
        <rect
          x="8.2"
          y="8.2"
          width="4.6"
          height="4.6"
          rx="0.9"
          fill={accentColor}
        />
        <circle cx="10.5" cy="10.5" r="1.15" fill="#00DC7D" />
      </svg>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2. MODAL DE PAGO DIRECTO POR SERVICIO (<DirectPaymentYapePlinModal/>)
//    Cumplimiento estricto de la regulación financiera peruana (SBS):
//    - Cero billetera digital interna, cero saldos almacenados ni pozos.
//    - Flujo exclusivo de venta directa al organizador mostrando QR y número
//      oficial de Yape/Plin + subida opcional de captura del comprobante.
//    - Al enviar la constancia, registra el estado "Pago en Verificación" hasta
//      que el Administrador lo apruebe manualmente desde su panel privado.
// ----------------------------------------------------------------------------
export function DirectPaymentYapePlinModal({
  paymentRequest,
  currentUser,
  lightMode = false,
  onSubmitPaymentVerification,
  onClose,
}) {
  const [paymentChannel, setPaymentChannel] = useState("Yape"); // 'Yape' | 'Plin'
  const [operationRef, setOperationRef] = useState("");
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  const receiptFileRef = useRef(null);

  useEffect(() => {
    if (paymentRequest) {
      setPaymentChannel("Yape");
      setOperationRef("");
      setReceiptPreviewUrl("");
      setCopiedPhone(false);
      setSubmittedRecord(null);
    }
  }, [paymentRequest]);

  if (!paymentRequest) return null;

  const {
    conceptTitle = "Servicio Oficial MATCHPOINT",
    amountSoles = 29.9,
    regularAmountSoles = null,
    vipAmountSoles = null,
    itemType = "vip_pass",
    referenceId = "",
    gemsApplied = 0,
  } = paymentRequest;

  const activePhoneDisplay =
    paymentChannel === "Yape"
      ? CIRCUIT_CONFIG.adminYapeNumber
      : CIRCUIT_CONFIG.adminPlinNumber;

  const qrPayload = `${paymentChannel}|${activePhoneDisplay.replace(
    /\s+/g,
    ""
  )}|S/${Number(amountSoles).toFixed(2)}|${conceptTitle}`;

  const handleCopyNumber = () => {
    triggerHaptic("tab");
    const rawNum = activePhoneDisplay.replace(/\s+/g, "");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawNum).catch(() => {});
    }
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2200);
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingReceipt(true);
    try {
      const compressed = await compressImageFile(file, 640, 0.76);
      setReceiptPreviewUrl(compressed);
      triggerHaptic("success");
    } catch (err) {
      // Silencioso si se cancela
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  const handleConfirmDirectPayment = (e) => {
    e.preventDefault();
    triggerHaptic("success");

    const verificationTicketCode = `MP-VER-${String(Date.now()).slice(-5)}`;
    const newPaymentRecord = {
      id: `pay-${Date.now()}`,
      ticketCode: verificationTicketCode,
      playerId: currentUser?.id || "p-pablo",
      playerName: currentUser?.name || "Pablo Samaniego",
      playerWhatsapp: currentUser?.whatsapp || "",
      conceptTitle,
      amountSoles: Number(amountSoles),
      gemsApplied: Number(gemsApplied || 0),
      channel: paymentChannel,
      operationCode: operationRef.trim() || "Ver constancia en WhatsApp",
      receiptImage: receiptPreviewUrl || "",
      itemType,
      referenceId,
      status: "pending_verification",
      statusLabel: "Pago en Verificación",
      createdAt: new Date().toLocaleString("es-PE"),
    };

    if (onSubmitPaymentVerification) {
      onSubmitPaymentVerification(newPaymentRecord);
    }

    setSubmittedRecord(newPaymentRecord);

    const waMessage = encodeURIComponent(
      `Hola *Comité MATCHPOINT Huancayo*, envío mi constancia de pago directo por *${paymentChannel}*:\n` +
        `• Código de seguimiento: *${verificationTicketCode}*\n` +
        `• Tenista: *${currentUser?.name || "Jugador"}*\n` +
        `• Servicio: *${conceptTitle}*\n` +
        `• Monto transferido: *S/ ${Number(amountSoles).toFixed(2)}*\n` +
        `${
          Number(gemsApplied) > 0
            ? `• Bono aplicado: *${gemsApplied} Gemas descontadas*\n`
            : ""
        }` +
        `${
          operationRef.trim()
            ? `• N° de Operación: *${operationRef.trim()}*\n`
            : ""
        }` +
        `Quedo atento a la activación en mi perfil.`
    );
    window.open(
      `https://wa.me/${CIRCUIT_CONFIG.adminWhatsApp}?text=${waMessage}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <WtaModalWrapper
      isOpen={Boolean(paymentRequest)}
      onClose={onClose}
      title="Pago Directo al Organizador"
      subtitle="Transferencia directa sin intermediarios. Tu servicio queda en estado de verificación hasta validar tu constancia."
      badgeText="VENTA DIRECTA OFICIAL"
      iconName="shield"
      lightMode={lightMode}
      maxWidthClass="max-w-md"
    >
      {submittedRecord ? (
        <div className="space-y-4 mp-view-enter">
          <div className="p-5 rounded-3xl bg-[#00DC7D]/15 border-2 border-[#00DC7D] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00DC7D] text-[#1E0734] flex items-center justify-center mx-auto shadow-md">
              <WtaIcon name="clock" size={24} strokeWidth={2.6} />
            </div>

            <span className="px-3 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-widest inline-block">
              ESTADO: PAGO EN VERIFICACIÓN
            </span>

            <h4 className="font-wta-condensed text-2xl sm:text-3xl font-bold uppercase text-[#00DC7D] leading-none">
              SOLICITUD {submittedRecord.ticketCode}
            </h4>

            <p className="text-xs leading-relaxed opacity-90">
              Registramos tu pago directo de{" "}
              <strong>S/ {Number(amountSoles).toFixed(2)}</strong> por{" "}
              <strong>{conceptTitle}</strong>. En cuanto el Administrador verifique
              tu transferencia en el panel privado, tu servicio quedará activo.
            </p>

            <div className="p-3 rounded-2xl bg-black/25 border border-white/10 text-left text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="opacity-70">Canal directo:</span>
                <strong className="font-extrabold">{submittedRecord.channel}</strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">N° de operación:</span>
                <strong className="font-extrabold">
                  {submittedRecord.operationCode}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Fecha y hora:</span>
                <strong className="font-extrabold">
                  {submittedRecord.createdAt}
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              onClose();
            }}
            className="w-full py-3.5 px-5 rounded-2xl mp-btn-emerald font-wta-display font-extrabold text-xs sm:text-sm"
          >
            Listo, volver al circuito
          </button>
        </div>
      ) : (
        <form onSubmit={handleConfirmDirectPayment} className="space-y-4">
          {/* 1. Resumen del Servicio Directo y Ahorro Aplicado */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              lightMode
                ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                : "bg-[#1E0734] border-[#00DC7D]/35 text-white"
            }`}
          >
            <div className="min-w-0">
              <span className="text-[10px] font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
                CONCEPTO DEL SERVICIO DIRECTO
              </span>
              <div className="text-xs sm:text-sm font-extrabold leading-snug mt-0.5">
                {conceptTitle}
              </div>
              {regularAmountSoles &&
                vipAmountSoles &&
                Number(amountSoles) < Number(regularAmountSoles) && (
                  <span className="text-[10px] font-extrabold text-[#F59E0B] block mt-0.5">
                    ★ Ahorro Socio VIP aplicado (-S/{" "}
                    {(Number(regularAmountSoles) - Number(amountSoles)).toFixed(2)})
                  </span>
                )}
              {Number(gemsApplied) > 0 && (
                <span className="text-[10px] font-extrabold text-[#00DC7D] block mt-0.5">
                  ★ Bono de {gemsApplied} Gemas descontado
                </span>
              )}
            </div>

            <div className="text-right shrink-0">
              {regularAmountSoles &&
                Number(regularAmountSoles) > Number(amountSoles) && (
                  <span className="text-[11px] line-through opacity-55 block">
                    S/ {Number(regularAmountSoles).toFixed(2)}
                  </span>
                )}
              <span className="font-wta-condensed text-3xl font-bold text-[#00DC7D] tabular-nums">
                S/ {Number(amountSoles).toFixed(2)}
              </span>
            </div>
          </div>

          {/* 2. Selector Táctil de Canal Directo (Yape o Plin) */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "Yape", label: "Pagar con Yape", tag: "Inmediato con QR" },
              { id: "Plin", label: "Pagar con Plin", tag: "Interbancario directo" },
            ].map((ch) => {
              const isSelected = paymentChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setPaymentChannel(ch.id);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all mp-btn-tactile ${
                    isSelected
                      ? "bg-[#00DC7D] text-[#1E0734] border-[#00DC7D] shadow-md"
                      : lightMode
                      ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                      : "bg-white/8 border-white/15 text-white"
                  }`}
                >
                  <div className="text-xs font-wta-display font-extrabold">
                    {ch.label}
                  </div>
                  <div
                    className={`text-[10px] ${
                      isSelected ? "text-[#1E0734]/80 font-bold" : "opacity-65"
                    }`}
                  >
                    {ch.tag}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3. Tarjeta Blanca con QR Dinámico y Número Oficial del Organizador */}
          <div className="p-4 rounded-3xl bg-white text-[#1E0734] border-2 border-[#00DC7D] shadow-xl flex flex-col items-center text-center space-y-2.5">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
                DESTINATARIO OFICIAL
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#00DC7D]/20 text-[#00A859] text-[10px] font-extrabold">
                {paymentChannel}
              </span>
            </div>

            <div className="text-xs font-extrabold text-[#1E0734]">
              {CIRCUIT_CONFIG.adminHolderName}
            </div>

            <DynamicPaymentQrSvg
              payloadString={qrPayload}
              channel={paymentChannel}
              size={140}
            />

            <div className="w-full pt-2 border-t border-[#1E0734]/10 flex items-center justify-between gap-2">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase text-[#1E0734]/60 block">
                  Número oficial {paymentChannel}:
                </span>
                <span className="font-wta-condensed text-2xl font-bold text-[#1E0734] tabular-nums">
                  {activePhoneDisplay}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyNumber}
                className={`px-3 py-2 rounded-xl text-xs font-wta-display font-extrabold flex items-center gap-1.5 mp-btn-tactile ${
                  copiedPhone
                    ? "bg-[#00A859] text-white"
                    : "bg-[#1E0734] text-[#00DC7D]"
                }`}
              >
                <WtaIcon name={copiedPhone ? "check" : "share"} size={13} />
                <span>{copiedPhone ? "¡Copiado!" : "Copiar número"}</span>
              </button>
            </div>
          </div>

          {/* 4. Código de Operación y Captura Opcional del Comprobante */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-7">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
                N° de operación (opcional)
              </label>
              <input
                type="text"
                value={operationRef}
                onChange={(e) => setOperationRef(e.target.value)}
                placeholder="Ej. 18492031"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold mp-input-alive ${
                  lightMode
                    ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                    : "bg-[#1E0734] border-white/20 text-white"
                }`}
              />
            </div>

            <div className="sm:col-span-5 flex flex-col justify-end">
              <input
                ref={receiptFileRef}
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={isCompressingReceipt}
                onClick={() => {
                  triggerHaptic("tab");
                  receiptFileRef.current?.click();
                }}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 mp-btn-tactile ${
                  receiptPreviewUrl
                    ? "bg-[#00DC7D]/20 border-[#00DC7D] text-[#00DC7D]"
                    : lightMode
                    ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                    : "bg-white/10 border-white/20 text-white"
                }`}
              >
                <WtaIcon
                  name={receiptPreviewUrl ? "check" : "camera"}
                  size={14}
                />
                <span>
                  {isCompressingReceipt
                    ? "Cargando..."
                    : receiptPreviewUrl
                    ? "Captura adjunta"
                    : "Subir captura"}
                </span>
              </button>
            </div>
          </div>

          {/* Nota Legal de Venta Directa */}
          <p className="text-[11px] opacity-70 leading-relaxed text-center px-2">
            MATCHPOINT no almacena saldo de usuarios ni opera como billetera
            digital. Todo pago corresponde a la contratación directa del servicio
            seleccionado.
          </p>

          <button
            type="submit"
            className="w-full py-3.5 px-5 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl"
          >
            <WtaIcon name="whatsapp" size={17} />
            <span>Enviar constancia y pasar a verificación</span>
          </button>
        </form>
      )}
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 3. CARNET DIGITAL SOCIO VIP METÁLICO 3D CON GIROSCOPIO Y REVERSO VERIFICABLE
//    (<CarnetDigitalVIPModal/>)
//    - Inclinación giroscópica 3D (±7°) al mover el dedo o cursor.
//    - Giro de 180° (Anverso con datos y chip / Reverso con Código de Barras y
//      convenios en las 4 sedes de Huancayo).
//    - Selector de Plan Mensual (S/ 29.90) vs Plan Anual (S/ 279.00) y
//      calculadora interactiva de cuánto ahorras al mes según tus horas de cancha.
// ----------------------------------------------------------------------------
export function CarnetDigitalVIPModal({
  isOpen,
  onClose,
  currentUser,
  sedes = INITIAL_SEDES,
  lightMode = false,
  onOpenDirectPayment,
}) {
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
  });
  const [showBackSide, setShowBackSide] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("monthly"); // 'monthly' | 'annual'
  const [hoursPerMonth, setHoursPerMonth] = useState(6);

  useEffect(() => {
    if (isOpen) {
      setShowBackSide(false);
      setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const rotateY = (relX - 0.5) * 14;
    const rotateX = (0.5 - relY) * 14;
    setTilt({
      rotateX,
      rotateY,
      glareX: Math.round(relX * 100),
      glareY: Math.round(relY * 100),
    });
  };

  const resetTilt = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const catObj = getCategoryByElo(currentUser.elo);
  const estimatedMonthlySavingsSoles = hoursPerMonth * 8; // Promedio S/ 8 de ahorro por hora en sedes aliadas
  const netBenefitSoles =
    estimatedMonthlySavingsSoles - CIRCUIT_CONFIG.vipMonthlyPriceSoles;

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Carnet Digital Socio VIP"
      subtitle="Credencial metálica oficial con descuentos directos en canchas, torneos y tienda Pro Shop."
      badgeText={
        currentUser.isVip ? "SOCIO VIP VERIFICADO" : "MEMBRESÍA OFICIAL"
      }
      iconName="crown"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        {/* Cabecera de Control de la Credencial: Voltear Anverso / Reverso */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold opacity-75">
            {showBackSide
              ? "Mostrando reverso de validación en club"
              : "Desliza el dedo sobre la tarjeta para efecto 3D"}
          </span>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setShowBackSide((prev) => !prev);
            }}
            className="px-3 py-1 rounded-full bg-[#00DC7D]/20 text-[#00DC7D] border border-[#00DC7D]/50 font-wta-display font-extrabold text-[11px] flex items-center gap-1.5 mp-btn-tactile"
          >
            <WtaIcon name="swap" size={13} />
            <span>{showBackSide ? "Ver anverso" : "Voltear carnet"}</span>
          </button>
        </div>

        {/* CREDENCIAL METÁLICA 3D (PROPORCIÓN 1.58:1 CON ANVERSO Y REVERSO) */}
        <div
          onMouseMove={handlePointerMove}
          onMouseLeave={resetTilt}
          onTouchMove={handlePointerMove}
          onTouchEnd={resetTilt}
          onClick={() => {
            triggerHaptic("card");
            setShowBackSide((prev) => !prev);
          }}
          style={{
            transform: `perspective(1050px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition:
              tilt.rotateX === 0 && tilt.rotateY === 0
                ? "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)"
                : "transform 0.06s ease-out",
          }}
          className="relative w-full aspect-[1.58/1] rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#290C46] via-[#1E0734] to-[#0D0219] text-white border-2 border-[#F59E0B] shadow-[0_22px_55px_rgba(0,0,0,0.72)] overflow-hidden flex flex-col justify-between select-none cursor-pointer"
        >
          {/* Reflejo Holográfico Dinámico */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(0,220,125,0.45) 0%, rgba(245,158,11,0.22) 34%, transparent 72%)`,
            }}
          />

          {/* Grabado Láser de Cancha de Tenis */}
          <svg
            viewBox="0 0 320 200"
            className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
            fill="none"
          >
            <rect
              x="16"
              y="16"
              width="288"
              height="168"
              rx="10"
              stroke="#00DC7D"
              strokeWidth="2"
            />
            <line x1="160" y1="16" x2="160" y2="184" stroke="#00DC7D" strokeWidth="2" />
            <line x1="76" y1="16" x2="76" y2="184" stroke="#F59E0B" strokeWidth="1.5" />
            <line x1="244" y1="16" x2="244" y2="184" stroke="#F59E0B" strokeWidth="1.5" />
            <line x1="76" y1="100" x2="244" y2="100" stroke="#F59E0B" strokeWidth="1.5" />
          </svg>

          {!showBackSide ? (
            /* ================= ANVERSO DE LA TARJETA METÁLICA ================= */
            <>
              <div className="relative z-10 flex items-center justify-between">
                <BrandLogo variant="night-cobrand" size="sm" />

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-wta-display font-black uppercase tracking-wider shadow ${
                    currentUser.isVip
                      ? "bg-gradient-to-r from-[#00DC7D] to-[#6EF2B5] text-[#1E0734]"
                      : "bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-[#1E0734]"
                  }`}
                >
                  {currentUser.isVip ? "ACTIVO · TEMPORADA 2026" : "MEMBRESÍA VIP"}
                </span>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-3 my-auto">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Chip Metálico Tallado */}
                  <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-[#FDE68A] via-[#F59E0B] to-[#B45309] border border-white/60 p-1 grid grid-cols-2 gap-0.5 shadow-inner shrink-0">
                    <div className="border border-[#1E0734]/35 rounded-xs" />
                    <div className="border border-[#1E0734]/35 rounded-xs" />
                    <div className="border border-[#1E0734]/35 rounded-xs" />
                    <div className="border border-[#1E0734]/35 rounded-xs" />
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-[#6EF2B5] font-extrabold block">
                      SOCIO OFICIAL DEL CIRCUITO
                    </span>
                    <div className="font-wta-condensed text-xl sm:text-2xl font-bold uppercase text-white truncate">
                      {currentUser.name}
                    </div>
                    <span className="text-[11px] font-bold text-white/80 block truncate">
                      {catObj.fullName} · {currentUser.elo} PTS
                    </span>
                  </div>
                </div>

                <SmartImage
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  isAvatar
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#00DC7D] shadow-xl shrink-0"
                />
              </div>

              <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/60 block">
                    ID CREDENCIAL
                  </span>
                  <span className="font-wta-display font-extrabold tracking-widest text-[#F59E0B] tabular-nums">
                    {currentUser.vipCode || "MP-2026-0003"}
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[9px] uppercase tracking-widest text-white/60 block">
                    MULTIPLICADOR
                  </span>
                  <span className="font-wta-display font-black text-[#00DC7D]">
                    x2.5 GEMAS
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest text-white/60 block">
                    SALDO ACTUAL
                  </span>
                  <span className="font-wta-condensed text-lg font-bold text-[#00DC7D] flex items-center justify-end gap-1 tabular-nums">
                    <span>{currentUser.gems || 0}</span>
                    <WtaIcon name="gem" size={14} />
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* ================= REVERSO DE VALIDACIÓN EN SEDE ================= */
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <span className="text-[10px] font-wta-display font-black uppercase tracking-wider text-[#00DC7D]">
                  CONVENIOS ACTIVOS EN SEDES DE HUANCAYO
                </span>
                <span className="text-[10px] font-bold text-[#F59E0B]">
                  {currentUser.vipCode || "MP-2026-0003"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 my-auto py-1">
                {sedes.map((s) => (
                  <div
                    key={s.id}
                    className="p-1.5 rounded-xl bg-white/8 border border-white/12 flex items-center gap-2"
                  >
                    <SmartImage
                      src={s.logoAsset}
                      alt={s.shortName}
                      className="w-6 h-6 rounded-full object-contain bg-white p-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold text-white truncate">
                        {s.shortName}
                      </div>
                      <div className="text-[9px] font-bold text-[#00DC7D]">
                        Tarifa VIP: S/ {s.priceVipSoles}/h
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Código de Barras Vectorial de Verificación en Recepción del Club */}
              <div className="bg-white rounded-xl p-2 flex items-center justify-between gap-3 text-[#1E0734]">
                <svg className="h-7 flex-1" viewBox="0 0 220 28" fill="none">
                  {[
                    2, 6, 9, 15, 19, 24, 30, 33, 39, 45, 49, 55, 62, 66, 72, 78,
                    83, 88, 95, 100, 106, 112, 118, 122, 129, 134, 140, 146,
                    152, 158, 164, 170, 175, 182, 188, 194, 200, 206, 212,
                  ].map((xPos, idx) => (
                    <rect
                      key={xPos}
                      x={xPos}
                      y="2"
                      width={idx % 3 === 0 ? "3" : "1.5"}
                      height="24"
                      fill="#1E0734"
                    />
                  ))}
                </svg>
                <span className="font-wta-condensed text-sm font-bold tracking-wider shrink-0">
                  {currentUser.vipCode || "MP-2026-0003"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Calculadora Interactiva: "¿Por qué el Pase VIP se paga solo?" */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2.5 text-xs ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
              : "bg-[#1E0734] border-white/12 text-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] text-[11px]">
              CALCULADORA DE AHORRO EN CANCHA
            </span>
            <span className="font-extrabold text-[#F59E0B]">
              {hoursPerMonth} horas / mes
            </span>
          </div>

          <input
            type="range"
            min="2"
            max="16"
            step="1"
            value={hoursPerMonth}
            onChange={(e) => setHoursPerMonth(Number(e.target.value))}
            className="w-full accent-[#00DC7D]"
          />

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="opacity-80">
              Ahorro estimado en alquiler de canchas:
            </span>
            <strong className="text-sm font-extrabold text-[#00DC7D] tabular-nums">
              S/ {estimatedMonthlySavingsSoles.toFixed(2)} al mes
            </strong>
          </div>

          {netBenefitSoles > 0 && (
            <p className="text-[11px] font-bold text-[#6EF2B5]">
              ✓ Jugando {hoursPerMonth} horas al mes, recuperas el valor del Pase
              VIP y te ahorras S/ {netBenefitSoles.toFixed(2)} adicionales, más
              tus +150 Gemas de regalo.
            </p>
          )}
        </div>

        {/* Selector de Plan Mensual vs Anual y Botón de Activación */}
        {!currentUser.isVip ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setSelectedPlan("monthly");
                }}
                className={`p-3 rounded-2xl border text-left transition-all mp-btn-tactile ${
                  selectedPlan === "monthly"
                    ? "border-2 border-[#00DC7D] bg-[#00DC7D]/15"
                    : lightMode
                    ? "bg-white border-[#1E0734]/15"
                    : "bg-white/6 border-white/15"
                }`}
              >
                <span className="text-[10px] font-wta-display font-black uppercase text-[#00DC7D] block">
                  PLAN MENSUAL FLEXIBLE
                </span>
                <div className="font-wta-condensed text-2xl font-bold mt-0.5 tabular-nums">
                  S/ {CIRCUIT_CONFIG.vipMonthlyPriceSoles.toFixed(2)}{" "}
                  <span className="text-xs font-normal opacity-75">/ mes</span>
                </div>
                <span className="text-[10px] font-bold opacity-75 block mt-0.5">
                  Incluye cofre de +150 Gemas
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setSelectedPlan("annual");
                }}
                className={`p-3 rounded-2xl border text-left transition-all mp-btn-tactile relative ${
                  selectedPlan === "annual"
                    ? "border-2 border-[#F59E0B] bg-[#F59E0B]/15"
                    : lightMode
                    ? "bg-white border-[#1E0734]/15"
                    : "bg-white/6 border-white/15"
                }`}
              >
                <span className="px-2 py-0.2 rounded-full bg-[#F59E0B] text-[#1E0734] text-[9px] font-wta-display font-black uppercase">
                  AHORRA 2 MESES
                </span>
                <div className="font-wta-condensed text-2xl font-bold mt-0.5 tabular-nums">
                  S/ {CIRCUIT_CONFIG.vipAnnualPriceSoles.toFixed(2)}{" "}
                  <span className="text-xs font-normal opacity-75">/ año</span>
                </div>
                <span className="text-[10px] font-bold text-[#00DC7D] block mt-0.5">
                  Incluye +1,800 Gemas anuales
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("hero");
                if (onOpenDirectPayment) {
                  const isAnnual = selectedPlan === "annual";
                  onClose();
                  onOpenDirectPayment({
                    conceptTitle: isAnnual
                      ? "Membresía Anual Pase Socio VIP (+1,800 Gemas)"
                      : "Membresía Mensual Pase Socio VIP (+150 Gemas)",
                    amountSoles: isAnnual
                      ? CIRCUIT_CONFIG.vipAnnualPriceSoles
                      : CIRCUIT_CONFIG.vipMonthlyPriceSoles,
                    itemType: "vip_pass",
                    referenceId: isAnnual ? "vip-annual-2026" : "vip-monthly-2026",
                  });
                }
              }}
              className="w-full py-3.5 px-6 rounded-2xl mp-btn-gold mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
            >
              <WtaIcon name="crown" size={18} />
              <span>
                Activar{" "}
                {selectedPlan === "annual"
                  ? `Pase Anual (S/ ${CIRCUIT_CONFIG.vipAnnualPriceSoles.toFixed(2)})`
                  : `Pase Mensual (S/ ${CIRCUIT_CONFIG.vipMonthlyPriceSoles.toFixed(2)})`}
              </span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#00DC7D]/15 border border-[#00DC7D]/45 flex items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-[#00DC7D]">
              ✓ Membresía Socio VIP Activa · Muestra tu carnet en cualquiera de las
              4 sedes.
            </span>
          </div>
        )}
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 4. TIENDA OFICIAL PRO SHOP EN 3 ESCALONES CON GENERADOR DE VOUCHER DE CANJE
//    (<ProShopModal/>)
//    - Escalón 1: Portadas Grand Slam y Distintivos Oficiales (Costo S/ 0).
//    - Escalón 2: Cupones de Copago Inteligente (Ahorro real para el jugador y
//      el efectivo cubre el costo base: cero pérdida para la app).
//    - Escalón 3: Accesorios, Encordados y Raquetas con precios reales de Perú.
//    - Genera un Ticket/Voucher Oficial (`MP-CANJE-XXXX`) al canjear.
// ----------------------------------------------------------------------------
export function ProShopModal({
  isOpen,
  onClose,
  currentUser,
  proShopItems = INITIAL_PROSHOP_ITEMS,
  sponsors = INITIAL_SPONSORS,
  lightMode = false,
  onRedeemShopItemWithGems,
  onOpenDirectPayment,
  onOpenVipModal,
}) {
  const [tierFilter, setTierFilter] = useState("all"); // 'all' | 'digital' | 'copay' | 'physical'
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [generatedVoucher, setGeneratedVoucher] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFeedbackNotice("");
      setGeneratedVoucher(null);
      setSearchQuery("");
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const visibleItems = proShopItems.filter((item) => {
    if (tierFilter !== "all" && item.tier !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleActionClick = (item) => {
    setFeedbackNotice("");

    // Si es canje físico completo reservado para Socios VIP
    if (
      item.vipOnly &&
      !currentUser.isVip &&
      item.tier === "physical" &&
      Number(item.copayCashSoles || 0) === 0
    ) {
      triggerHaptic("light");
      setFeedbackNotice(
        `El canje completo de "${item.name}" sin copago requiere tener activo el Pase Socio VIP.`
      );
      return;
    }

    // Verifica saldo de Gemas
    if (Number(currentUser.gems || 0) < Number(item.costGems || 0)) {
      triggerHaptic("light");
      const missing = Number(item.costGems || 0) - Number(currentUser.gems || 0);
      setFeedbackNotice(
        `Te faltan ${missing} Gemas para "${item.name}" (tienes ${
          currentUser.gems || 0
        } Gemas). Suma victorias en racha, vence a rivales de mayor puntaje o responde la Trivia.`
      );
      return;
    }

    // Si es un Cupón de Copago Inteligente (Gemas + Efectivo que cubre el costo base)
    if (item.tier === "copay" && Number(item.copayCashSoles || 0) > 0) {
      triggerHaptic("success");
      if (onRedeemShopItemWithGems) {
        onRedeemShopItemWithGems(item, true);
      }
      if (onOpenDirectPayment) {
        onClose();
        onOpenDirectPayment({
          conceptTitle: `${item.name}`,
          amountSoles: item.copayCashSoles,
          regularAmountSoles: item.marketPriceSoles,
          vipAmountSoles: item.copayCashSoles,
          gemsApplied: item.costGems,
          itemType: "proshop_copay",
          referenceId: item.id,
        });
      }
      return;
    }

    // Canje 100% con Gemas: descuenta Gemas y emite Voucher Oficial MP-CANJE-XXXX
    triggerHaptic("success");
    if (onRedeemShopItemWithGems) {
      onRedeemShopItemWithGems(item, false);
    }

    const voucherCode = `MP-CANJE-${String(Date.now()).slice(-4)}`;
    setGeneratedVoucher({
      code: voucherCode,
      itemName: item.name,
      tier: item.tier,
      gemsUsed: item.costGems,
      playerName: currentUser.name,
      dateText: new Date().toLocaleString("es-PE"),
    });
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Tienda Oficial Pro Shop & Gemas"
      subtitle="Canjea tus Gemas por escenarios Grand Slam, bonos de ahorro real en encordados o equipamiento de cancha."
      badgeText={`SALDO DISPONIBLE: ${currentUser.gems || 0} GEMAS`}
      iconName="bag"
      lightMode={lightMode}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Si el jugador acaba de generar un Voucher de Canje, lo muestra arriba */}
        {generatedVoucher && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-[#00A859] via-[#00DC7D] to-[#6EF2B5] text-[#1E0734] shadow-xl space-y-2.5 mp-view-enter">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
                VOUCHER OFICIAL GENERADO
              </span>
              <span className="font-wta-condensed text-xl font-bold">
                {generatedVoucher.code}
              </span>
            </div>

            <div className="text-sm font-extrabold">
              {generatedVoucher.itemName} (-{generatedVoucher.gemsUsed} Gemas)
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] font-bold">
                Titular: {generatedVoucher.playerName}
              </span>
              {generatedVoucher.tier !== "digital" && (
                <button
                  type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `¡Hola *Pro Shop MATCHPOINT Huancayo*! Solicito coordinar la entrega de mi canje:\n` +
                        `• Código Voucher: *${generatedVoucher.code}*\n` +
                        `• Artículo: *${generatedVoucher.itemName}*\n` +
                        `• Tenista: *${generatedVoucher.playerName}*`
                    );
                    window.open(
                      `https://wa.me/${CIRCUIT_CONFIG.adminWhatsApp}?text=${msg}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#1E0734] text-[#00DC7D] text-xs font-extrabold flex items-center gap-1.5 mp-btn-tactile"
                >
                  <WtaIcon name="whatsapp" size={13} />
                  <span>Coordinar entrega en club</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Banner Bicolor ACTIVA TU PASE SOCIO VIP (Si el tenista es jugador gratuito) */}
        {!currentUser.isVip && (
          <div
            onClick={() => {
              triggerHaptic("hero");
              if (onOpenVipModal) {
                onClose();
                onOpenVipModal();
              }
            }}
            className="rounded-3xl overflow-hidden border border-[#00DC7D]/50 shadow-lg grid grid-cols-1 sm:grid-cols-12 cursor-pointer group wta-card-aura"
          >
            <div className="sm:col-span-7 p-4 bg-[#1E0734] text-white flex flex-col justify-between space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[9px] font-wta-display font-black uppercase tracking-wider w-fit">
                ACELERADOR OFICIAL VIP · x2.5 GEMAS
              </span>
              <h4 className="font-wta-condensed text-2xl font-bold uppercase text-[#00DC7D] leading-none">
                SUMA GEMAS EL DOBLE DE RÁPIDO Y AHORRA EN CANCHA
              </h4>
              <p className="text-xs text-white/80">
                Recibe +150 Gemas inmediatas al activar tu Pase Socio VIP, ahorra
                hasta S/ 8 por hora en clubes y accede a tarifas de socio.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#6EF2B5] group-hover:text-white">
                <span>Abrir Carnet y Beneficios VIP</span>
                <WtaIcon name="arrow-right" size={14} />
              </span>
            </div>

            <div
              className="sm:col-span-5 p-4 flex items-center justify-center relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #00A859 0%, #00DC7D 60%, #9EF7CE 100%)",
              }}
            >
              <SmartImage
                src={ASSETS.goldenTicket}
                alt="Pase VIP"
                className="w-24 h-24 object-contain drop-shadow-xl transform group-hover:scale-105 transition-transform"
              />
            </div>
          </div>
        )}

        {/* Sorteo Mensual Financiado por Patrocinador Local */}
        {sponsors?.monthlyRaffleSponsor?.active && (
          <div className="p-3 rounded-2xl bg-[#00DC7D]/12 border border-[#00DC7D]/35 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-wta-display font-black uppercase text-[#00DC7D] block">
                SORTEO MENSUAL DE JUGADORES ACTIVOS · AUSPICIA{" "}
                {sponsors.monthlyRaffleSponsor.name}
              </span>
              <span className="font-extrabold block truncate">
                {sponsors.monthlyRaffleSponsor.prizeTitle}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-[#1E0734] text-[#00DC7D] text-[10px] font-extrabold shrink-0">
              {Number(currentUser.matchesPlayed || 0) >= 2
                ? "✓ Ya participas"
                : "Juega 2 retos/mes"}
            </span>
          </div>
        )}

        {/* Buscador y Pestañas de los 3 Escalones */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: "all", label: "Todo el Pro Shop" },
              { id: "copay", label: "Bonos de Ahorro con Gemas" },
              { id: "digital", label: "Portadas y Distintivos" },
              { id: "physical", label: "Cuerdas, Pelotas y Raquetas" },
            ].map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setTierFilter(tb.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-wta-display font-extrabold shrink-0 wta-pill-tab ${
                  tierFilter === tb.id
                    ? "wta-pill-tab-active"
                    : lightMode
                    ? "bg-white text-[#1E0734]/80 border border-[#1E0734]/15"
                    : "wta-pill-tab-inactive"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar encordado, pelotas, overgrip, escenario..."
              className={`w-full pl-9 pr-3.5 py-2 rounded-2xl border text-xs font-semibold mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/15 text-white"
              }`}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00DC7D]">
              <WtaIcon name="search" size={15} />
            </span>
          </div>
        </div>

        {feedbackNotice && (
          <div className="p-3 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/45 text-[#F59E0B] text-xs font-extrabold">
            {feedbackNotice}
          </div>
        )}

        {/* Grilla de Productos y Bonos con Desglose de Ahorro Real */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleItems.map((item) => {
            const isCopay =
              item.tier === "copay" && Number(item.copayCashSoles) > 0;
            const hasDirectPurchase =
              item.tier === "physical" && Number(item.marketPriceSoles) > 0;
            const savingsSoles = isCopay
              ? Number(item.marketPriceSoles || 0) -
                Number(item.copayCashSoles || 0)
              : 0;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-3xl border flex flex-col justify-between space-y-3 wta-card-aura ${
                  lightMode
                    ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                    : "bg-[#1E0734] border-white/12 text-white"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-wta-display font-black uppercase ${
                        item.tier === "digital"
                          ? "bg-[#38BDF8]/20 text-[#38BDF8]"
                          : item.tier === "copay"
                          ? "bg-[#00DC7D] text-[#1E0734]"
                          : "bg-[#F59E0B]/20 text-[#F59E0B]"
                      }`}
                    >
                      {item.tierLabel}
                    </span>

                    {savingsSoles > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#00A859]/20 text-[#00DC7D] border border-[#00DC7D]/40 text-[9px] font-black uppercase">
                        Ahorras S/ {savingsSoles}
                      </span>
                    ) : item.vipOnly ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[9px] font-black uppercase">
                        Exclusivo VIP
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/8 border border-white/10 p-1 flex items-center justify-center shrink-0">
                      <SmartImage
                        src={item.imageAsset}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold leading-snug">
                        {item.name}
                      </h4>

                      {Number(item.marketPriceSoles) > 0 && (
                        <div className="mt-1 flex items-center gap-2 text-[11px]">
                          <span className="line-through opacity-55">
                            Tienda Perú: S/ {item.marketPriceSoles}
                          </span>
                          {isCopay && (
                            <span className="font-extrabold text-[#00DC7D]">
                              Con Gemas: S/ {item.copayCashSoles}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] opacity-75 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Botones de Acción: Canje con Gemas / Copago o Compra Directa */}
                <div className="pt-2 border-t border-current/10 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleActionClick(item)}
                    className="flex-1 py-2.5 px-3 rounded-xl mp-btn-emerald text-xs font-wta-display font-extrabold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <WtaIcon name="gem" size={14} />
                    <span>
                      {isCopay
                        ? `Usar ${item.costGems} 💎 + S/ ${item.copayCashSoles}`
                        : `Canjear ${item.costGems} Gemas`}
                    </span>
                  </button>

                  {hasDirectPurchase && onOpenDirectPayment && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("tab");
                        const directPrice =
                          currentUser.isVip && item.vipDirectPriceSoles
                            ? item.vipDirectPriceSoles
                            : item.marketPriceSoles;
                        onClose();
                        onOpenDirectPayment({
                          conceptTitle: `Compra Directa Pro Shop: ${item.name}`,
                          amountSoles: directPrice,
                          regularAmountSoles: item.marketPriceSoles,
                          vipAmountSoles: item.vipDirectPriceSoles,
                          itemType: "proshop_direct",
                          referenceId: item.id,
                        });
                      }}
                      title="Comprar directo sin usar Gemas"
                      className="py-2.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-current/15 text-[11px] font-extrabold shrink-0 mp-btn-tactile"
                    >
                      S/{" "}
                      {currentUser.isVip && item.vipDirectPriceSoles
                        ? item.vipDirectPriceSoles
                        : item.marketPriceSoles}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// === FIN DEL BLOQUE 11 DE 14 ===

// ============================================================================
// PARTE 12 DE 14: PORTAL DE ACCESO PROFESIONAL SPLIT-SCREEN 50/50 (LOGIN
// ESMERALDA, REGISTRO PÚRPURA CON BLOQUEO LEGAL +18 AÑOS, CHECKBOX OBLIGATORIO
// DESMARCADO POR DEFECTO, ENLACES LEGALES SIN PERDER DATOS Y TIMESTAMP EN
// SUPABASE, Y RECUPERACIÓN EN 2 PASOS) + TEST INICIAL DIDÁCTICO DE 5 PREGUNTAS
// + GUÍA VISUAL INTERACTIVA DEL CIRCUITO
// ============================================================================

// ----------------------------------------------------------------------------
// 1. CLÁUSULAS LEGALES OFICIALES INTEGRADAS (NORMATIVA PERÚ: LEY N° 29733,
//    INDECOPI Y DESLINDE DE RESPONSABILIDAD)
//    Disponibles tanto desde el Registro (sin perder los datos escritos) como
//    desde el Menú Lateral y Pie de Página.
// ----------------------------------------------------------------------------
export const OFFICIAL_TERMS_CLAUSES = [
  {
    number: "1",
    title: "Naturaleza del Servicio",
    body: "MATCHPOINT es una plataforma tecnológica de gestión deportiva y rankings recreativos; no organiza eventos médicos ni garantiza supervisión presencial permanente en canchas de terceros.",
  },
  {
    number: "2",
    title: "Exención de Responsabilidad Física (Deslinde)",
    body: "El usuario participa en los partidos, retos y torneos bajo su propia responsabilidad y riesgo físico. MATCHPOINT y sus administradores quedan exentos de toda responsabilidad civil, médica o penal por lesiones, accidentes, golpes de calor o altercados ocurridos antes, durante o después de los encuentros.",
  },
  {
    number: "3",
    title: "Política Estricta de No Reembolso",
    body: "Los pagos realizados por concepto de inscripciones a torneos, membresías VIP o servicios publicados son finales y no son reembolsables si el usuario cancela su participación con menos de 24 horas de anticipación, no se presenta al partido (walkover) o es descalificado.",
  },
  {
    number: "4",
    title: "Derecho de Admisión, Sanciones y Baneo",
    body: "El Comité Administrador se reserva el derecho de suspender temporal o definitivamente cualquier cuenta, sin derecho a reembolso ni indemnización, ante casos de suplantación de identidad, falsificación o arreglo de marcadores, agresión verbal/física o conducta antideportiva.",
  },
  {
    number: "5",
    title: "Reglas del Ranking y Modificaciones",
    body: "El sistema de puntaje oficial es administrado por la plataforma; MATCHPOINT puede ajustar parámetros técnicos para preservar la equidad deportiva.",
  },
];

export const OFFICIAL_PRIVACY_CLAUSES = [
  {
    number: "1",
    title: "Datos Recopilados",
    body: "Nombre completo, número de celular (WhatsApp), correo electrónico, fotografía de perfil, club de procedencia, edad y estadísticas de partidos.",
  },
  {
    number: "2",
    title: "Finalidad del Tratamiento",
    body: "Los datos se usan exclusivamente para operar el ranking deportivo, permitir la coordinación de partidos entre rivales autorizados, validar pagos y enviar comunicaciones oficiales del circuito.",
  },
  {
    number: "3",
    title: "Privacidad del Teléfono",
    body: "Desde los ajustes de tu perfil puedes elegir en cualquier momento si tu número de WhatsApp es visible para el circuito o restringido únicamente a rivales con reto aceptado.",
  },
  {
    number: "4",
    title: "Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)",
    body: "En cumplimiento de la Ley N° 29733 de Protección de Datos Personales del Perú, el usuario puede solicitar la modificación o eliminación definitiva de sus datos personales de la base de datos de MATCHPOINT enviando una solicitud al canal oficial de soporte y administración.",
  },
];

// ----------------------------------------------------------------------------
// 2. PORTAL DE ACCESO PROFESIONAL SPLIT-SCREEN 50/50 (<AuthAndAccountModal/>)
//    Inspirado en WTA Unlocked (Ronda 28) + Implementación Legal Perú:
//    - Transición breve de redirección con aro esmeralda.
//    - Login 50/50 con formulario limpio sobre blanco y póster esmeralda.
//    - Registro 50/50 con póster púrpura noche, validación estricta +18 años,
//      checkbox desmarcado por defecto, enlaces clicables a Términos y
//      Privacidad que abren encima sin perder los datos del formulario, y
//      guardado de timestamp en Supabase.
//    - Recuperación de contraseña en 2 pasos con franja inferior esmeralda.
// ----------------------------------------------------------------------------
export function AuthAndAccountModal({
  isOpen,
  onClose,
  initialMode = "login", // 'login' | 'register' | 'recover'
  players = INITIAL_PLAYERS,
  sedes = INITIAL_SEDES,
  currentUser,
  onLoginSuccess,
  onRegisterNewPlayer,
  onResetPlayerPassword,
  onTriggerAdminSuite,
}) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Estados de Login
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Estados de Registro (persisten intactos al abrir Términos o Privacidad)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("1.75 m");
  const [gender, setGender] = useState("M");
  const [hand, setHand] = useState("Diestro");
  const [bestShot, setBestShot] = useState("Derecha con topspin");
  const [club, setClub] = useState("Country Club Los Huancas");
  const [individualMode, setIndividualMode] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState("");
  // Checkbox obligatorio DESMARCADO por defecto
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Visor interno de documentos legales (se abre encima sin borrar el formulario)
  const [inlineLegalDoc, setInlineLegalDoc] = useState(null); // 'terms' | 'privacy' | null

  // Estados de Recuperación en 2 pasos
  const [recoverStep, setRecoverStep] = useState(1);
  const [recoverContact, setRecoverContact] = useState("");
  const [recoverAgeVerify, setRecoverAgeVerify] = useState("");
  const [recoverNewPass, setRecoverNewPass] = useState("");
  const [matchedRecoverPlayer, setMatchedRecoverPlayer] = useState(null);
  const [recoverStatusMsg, setRecoverStatusMsg] = useState("");

  const avatarFileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode || "login");
      setIsRedirecting(true);
      const t = setTimeout(() => setIsRedirecting(false), 460);
      return () => clearTimeout(t);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const switchModeWithTransition = (nextMode) => {
    triggerHaptic("tab");
    setLoginError("");
    setRegisterError("");
    setRecoverStatusMsg("");
    setIsRedirecting(true);
    setTimeout(() => {
      setAuthMode(nextMode);
      setIsRedirecting(false);
    }, 320);
  };

  // Validación estricta de mayoría de edad (+18 años) en tiempo real
  const numericAge = Number(age);
  const isUnderageEntered = age !== "" && (!numericAge || numericAge < 18);
  const isAdultValid = age !== "" && numericAge >= 18 && numericAge <= 95;
  const canSubmitRegistration =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 9 &&
    email.includes("@") &&
    password.length >= 4 &&
    isAdultValid &&
    acceptedLegalTerms === true;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 640, 0.8);
      setUploadedAvatar(compressed);
      triggerHaptic("success");
    } catch (err) {
      // Silencioso
    }
  };

  // Manejo de Inicio de Sesión Dual (Celular de 9 dígitos o Correo + Acceso Admin)
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");
    const cleanInput = loginIdentifier.trim().toLowerCase();

    if (!cleanInput) {
      setLoginError("Ingresa tu número de celular (9 dígitos) o tu correo electrónico.");
      return;
    }

    // Acceso oculto a la Suite de Administrador si escribe admin@matchpoint.pe + PIN 1234
    if (
      (cleanInput === "admin" || cleanInput === "admin@matchpoint.pe") &&
      loginPassword === CIRCUIT_CONFIG.adminSecretPin
    ) {
      triggerHaptic("success");
      onClose();
      if (onTriggerAdminSuite) onTriggerAdminSuite();
      return;
    }

    const digitsOnly = cleanInput.replace(/\D/g, "");
    const foundPlayer = players.find((p) => {
      const pEmail = (p.email || "").toLowerCase();
      const pPhone = (p.whatsapp || "").replace(/\D/g, "");
      const pName = (p.name || "").toLowerCase();
      return (
        pEmail === cleanInput ||
        (digitsOnly.length >= 9 && pPhone.endsWith(digitsOnly.slice(-9))) ||
        pName === cleanInput
      );
    });

    if (!foundPlayer) {
      setLoginError(
        "No encontramos una cuenta con ese celular o correo. Revisa el dato o crea tu cuenta gratis."
      );
      return;
    }

    if (
      foundPlayer.customPassword &&
      loginPassword &&
      foundPlayer.customPassword !== loginPassword
    ) {
      setLoginError("La contraseña ingresada no coincide.");
      return;
    }

    triggerHaptic("success");
    if (onLoginSuccess) onLoginSuccess(foundPlayer.id);
    onClose();
  };

  // Manejo de Registro con Respaldo Legal en Base de Datos (Timestamp exacto)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (!isAdultValid) {
      setRegisterError(
        "Debes ser mayor de 18 años para registrarte en MATCHPOINT (Ley N° 29733)."
      );
      return;
    }

    if (!acceptedLegalTerms) {
      setRegisterError(
        "Debes marcar la casilla aceptando los Términos y Condiciones y la Política de Privacidad."
      );
      return;
    }

    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length < 9) {
      setRegisterError("Ingresa un número de celular válido de 9 dígitos para WhatsApp.");
      return;
    }

    const formattedWhatsapp = cleanDigits.startsWith("51")
      ? cleanDigits
      : `51${cleanDigits.slice(-9)}`;

    const consentTimestamp = new Date().toISOString();
    const chosenSede = sedes.find((s) => s.name === club);

    const newPlayerPayload = {
      id: `p-user-${Date.now()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      elo: 1200, // Se ajustará enseguida con el Test Inicial de 5 preguntas
      bestRank: players.length + 1,
      rank: players.length + 1,
      age: numericAge,
      height: height || "1.75 m",
      city: "Huancayo",
      club: individualMode ? "Independiente" : club,
      clubLogo: chosenSede?.logoAsset || ASSETS.clubCountry,
      individualMode,
      hand,
      backhand: "Revés a dos manos",
      bestShot,
      availability: "Lun a Sáb · Tardes y fines de semana",
      wins: 0,
      losses: 0,
      streak: 0,
      titles: 0,
      matchesPlayed: 0,
      gems: 20, // Bono inicial equilibrado de 20 Gemas
      isVip: false,
      vipCode: `MP-2026-${String(players.length + 1).padStart(4, "0")}`,
      whatsapp: formattedWhatsapp,
      whatsappPrivacy: "rivals_only",
      email: email.trim().toLowerCase(),
      customPassword: password,
      surfaceThemeId: "finals",
      unlockedThemes: ["finals"],
      activeBadgeId: "",
      unlockedBadges: [],
      avatar:
        uploadedAvatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      heroPhoto: ASSETS.perfilBgFinals,
      cutoutAvatar: "",
      photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
      gender,
      hasCompletedTest: false, // Dispara automáticamente el Test Inicial Didáctico
      legalConsentAccepted: true,
      legalConsentVersion: "PERU-2026-V1",
      legalConsentTimestamp: consentTimestamp,
      declaredAdultOver18: true,
    };

    // Guarda el consentimiento y timestamp en Supabase como respaldo legal
    syncRecordToSupabase("players_legal_consents", {
      player_id: newPlayerPayload.id,
      full_name: newPlayerPayload.name,
      email: newPlayerPayload.email,
      whatsapp: newPlayerPayload.whatsapp,
      age_declared: numericAge,
      accepted_terms_and_privacy: true,
      consent_timestamp: consentTimestamp,
    }).catch(() => {});

    triggerHaptic("success");
    if (onRegisterNewPlayer) {
      onRegisterNewPlayer(newPlayerPayload);
    }
    onClose();
  };

  // Manejo de Recuperación en 2 pasos
  const handleVerifyRecoveryIdentity = (e) => {
    e.preventDefault();
    setRecoverStatusMsg("");
    const clean = recoverContact.trim().toLowerCase();
    const digits = clean.replace(/\D/g, "");

    const found = players.find((p) => {
      const pMail = (p.email || "").toLowerCase();
      const pPhone = (p.whatsapp || "").replace(/\D/g, "");
      return (
        pMail === clean ||
        (digits.length >= 9 && pPhone.endsWith(digits.slice(-9)))
      );
    });

    if (!found) {
      setRecoverStatusMsg(
        "No encontramos una cuenta con ese celular o correo. Puedes solicitar ayuda directa por WhatsApp abajo."
      );
      return;
    }

    if (
      recoverAgeVerify.trim() &&
      Number(recoverAgeVerify) !== Number(found.age)
    ) {
      setRecoverStatusMsg(
        "La edad ingresada no coincide con la registrada en el perfil."
      );
      return;
    }

    triggerHaptic("success");
    setMatchedRecoverPlayer(found);
    setRecoverStep(2);
  };

  const handleSaveRecoveredPassword = (e) => {
    e.preventDefault();
    if (!matchedRecoverPlayer || recoverNewPass.trim().length < 4) {
      setRecoverStatusMsg("Escribe una nueva contraseña de al menos 4 caracteres.");
      return;
    }
    triggerHaptic("success");
    if (onResetPlayerPassword) {
      onResetPlayerPassword(matchedRecoverPlayer.id, recoverNewPass.trim());
    }
    if (onLoginSuccess) {
      onLoginSuccess(matchedRecoverPlayer.id);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-2 sm:p-4 mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92dvh] rounded-3xl overflow-hidden bg-white text-[#1E0734] shadow-[0_25px_75px_rgba(0,0,0,0.8)] border border-white/40 flex flex-col mp-modal-sheet">
        {/* Botón flotante de cierre */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (onClose) onClose();
          }}
          aria-label="Cerrar portal de acceso"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-[#1E0734] text-white hover:bg-[#290C46] flex items-center justify-center shadow-lg mp-close-btn"
        >
          <WtaIcon name="close" size={18} />
        </button>

        {/* A. PANTALLA DE TRANSICIÓN / REDIRECCIÓN LIMPIA (ESTILO WTA UNLOCKED) */}
        {isRedirecting ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center p-8 bg-[#FAF9F5] text-[#1E0734] text-center space-y-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#1E0734]/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00DC7D] border-r-[#00DC7D] animate-spin" />
              <BrandLogo variant="isotipo" size="md" />
            </div>
            <div className="font-wta-condensed text-2xl font-bold uppercase tracking-tight">
              ABRIENDO PORTAL OFICIAL MATCHPOINT
            </div>
            <p className="text-xs text-[#1E0734]/65">
              Cargando credenciales seguras del circuito...
            </p>
          </div>
        ) : (
          /* B. PORTAL SPLIT-SCREEN 50/50 (FORMULARIO SOBRE BLANCO / PÓSTER DEPORTIVO) */
          <div className="flex-1 overflow-y-auto overscroll-contain grid grid-cols-1 lg:grid-cols-12">
            {/* ==================== MITAD IZQUIERDA (50% -> 6 COLS): FORMULARIO ==================== */}
            <div className="lg:col-span-6 p-5 sm:p-7 bg-white text-[#1E0734] flex flex-col justify-between space-y-4">
              {/* Cabecera del Formulario */}
              <div className="flex items-center justify-between gap-2 pr-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-extrabold text-[#1E0734]/70 hover:text-[#1E0734] flex items-center gap-1"
                >
                  <WtaIcon name="chevron-left" size={14} />
                  <span>Volver al circuito</span>
                </button>

                {authMode === "login" ? (
                  <button
                    type="button"
                    onClick={() => switchModeWithTransition("register")}
                    className="text-xs font-extrabold text-[#00A859] hover:underline"
                  >
                    ¿No tienes cuenta? Regístrate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchModeWithTransition("login")}
                    className="text-xs font-extrabold text-[#1E0734] hover:underline"
                  >
                    ¿Ya tienes cuenta? Inicia sesión
                  </button>
                )}
              </div>

              {/* ---------------- MODO 1: INICIO DE SESIÓN ---------------- */}
              {authMode === "login" && (
                <div className="space-y-4 my-auto">
                  <div>
                    <BrandLogo variant="pill-light" size="md" />
                    <h2 className="font-wta-condensed text-3xl sm:text-4xl font-bold uppercase text-[#1E0734] leading-none mt-2">
                      INICIA SESIÓN EN TU CUENTA
                    </h2>
                    <p className="text-xs text-[#1E0734]/70 mt-1">
                      Ingresa con tu número de celular peruano (9 dígitos) o correo
                      electrónico.
                    </p>
                  </div>

                  {/* Acceso Rápido Demo en 1 Toque para Pruebas entre Cuentas */}
                  <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#1E0734]/12 space-y-2">
                    <span className="text-[10px] font-wta-display font-black uppercase tracking-wider text-[#00A859] block">
                      CAMBIO RÁPIDO DE CUENTA (MODO PRUEBA EN CANCHA)
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {players.slice(0, 6).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic("hero");
                            if (onLoginSuccess) onLoginSuccess(p.id);
                            onClose();
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 shrink-0 mp-btn-tactile ${
                            p.id === currentUser?.id
                              ? "bg-[#1E0734] text-[#00DC7D] border-[#1E0734]"
                              : "bg-white border-[#1E0734]/15 text-[#1E0734]"
                          }`}
                        >
                          <SmartImage
                            src={p.avatar}
                            alt={p.firstName}
                            isAvatar
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{p.firstName}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Celular (WhatsApp) o Correo Electrónico
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Ej. 999888777 o pablo@matchpoint.pe"
                        className="w-full px-3.5 py-3 rounded-2xl border border-[#1E0734]/20 bg-[#FAF9F5] text-[#1E0734] font-semibold mp-input-alive"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E0734]/75">
                          Contraseña
                        </label>
                        <button
                          type="button"
                          onClick={() => switchModeWithTransition("recover")}
                          className="text-[11px] font-extrabold text-[#00A859] hover:underline"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Ingresa tu clave"
                          className="w-full pl-3.5 pr-10 py-3 rounded-2xl border border-[#1E0734]/20 bg-[#FAF9F5] text-[#1E0734] font-semibold mp-input-alive"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowLoginPassword((prev) => !prev)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E0734]/60 hover:text-[#1E0734]"
                        >
                          <WtaIcon
                            name={showLoginPassword ? "eye-off" : "eye"}
                            size={17}
                          />
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div className="p-3 rounded-2xl bg-rose-500/12 border border-rose-500/35 text-rose-700 text-xs font-bold">
                        {loginError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-full mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Entrar a mi cuenta</span>
                      <WtaIcon name="arrow-right" size={16} />
                    </button>
                  </form>
                </div>
              )}

              {/* ---------------- MODO 2: REGISTRO CON BLINDAJE LEGAL PERÚ ---------------- */}
              {authMode === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3 my-auto">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-wider">
                      NUEVO JUGADOR · BONO +20 GEMAS
                    </span>
                    <h2 className="font-wta-condensed text-3xl font-bold uppercase text-[#1E0734] leading-none mt-1.5">
                      CREA TU CUENTA OFICIAL GRATIS
                    </h2>
                  </div>

                  {/* Nombre y Apellido en 2 Columnas */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ej. Mateo"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ej. Villavicencio"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                      />
                    </div>
                  </div>

                  {/* Celular (WhatsApp) y Correo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Celular WhatsApp (9 dígitos) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="999 888 777"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                      />
                    </div>
                  </div>

                  {/* Edad (+18 Obligatorio), Estatura y Contraseña */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Edad (+18) *
                      </label>
                      <input
                        type="number"
                        min="18"
                        max="95"
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Ej. 28"
                        className={`w-full px-3 py-2.5 rounded-xl border bg-[#FAF9F5] text-xs font-bold mp-input-alive ${
                          isUnderageEntered
                            ? "border-rose-600 bg-rose-50 text-rose-700"
                            : "border-[#1E0734]/20 text-[#1E0734]"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Estatura
                      </label>
                      <input
                        type="text"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="1.76 m"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showRegisterPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Clave"
                          className="w-full pl-2.5 pr-7 py-2.5 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword((prev) => !prev)
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1E0734]/55"
                        >
                          <WtaIcon
                            name={showRegisterPassword ? "eye-off" : "eye"}
                            size={14}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Aviso inmediato si intenta ingresar menos de 18 años */}
                  {isUnderageEntered && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-600/40 text-rose-700 text-[11px] font-extrabold">
                      Bloqueo legal: Queda prohibido el registro a menores de 18 años en
                      MATCHPOINT.
                    </div>
                  )}

                  {/* Mano de Juego, Mejor Golpe, Club y Foto Opcional */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Mano hábil
                      </label>
                      <select
                        value={hand}
                        onChange={(e) => setHand(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                      >
                        <option value="Diestro">Diestro</option>
                        <option value="Zurdo">Zurdo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                        Club en Huancayo
                      </label>
                      <select
                        value={individualMode ? "INDEPENDIENTE" : club}
                        onChange={(e) => {
                          if (e.target.value === "INDEPENDIENTE") {
                            setIndividualMode(true);
                          } else {
                            setIndividualMode(false);
                            setClub(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                      >
                        {sedes.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.shortName}
                          </option>
                        ))}
                        <option value="INDEPENDIENTE">
                          Jugador Independiente
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#1E0734]/20 text-xs font-bold flex items-center gap-1.5 mp-btn-tactile"
                    >
                      <WtaIcon name="camera" size={14} className="text-[#00A859]" />
                      <span>
                        {uploadedAvatar ? "Foto cargada ✓" : "Subir foto (opcional)"}
                      </span>
                    </button>

                    <div className="inline-flex rounded-xl p-0.5 bg-[#FAF9F5] border border-[#1E0734]/15 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setGender("M")}
                        className={`px-2.5 py-1 rounded-lg ${
                          gender === "M" ? "bg-[#1E0734] text-white" : ""
                        }`}
                      >
                        Varones
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender("F")}
                        className={`px-2.5 py-1 rounded-lg ${
                          gender === "F" ? "bg-[#1E0734] text-white" : ""
                        }`}
                      >
                        Damas
                      </button>
                    </div>
                  </div>

                  {/* ==========================================================
                      CASILLA DE VERIFICACIÓN LEGAL OBLIGATORIA (NORMATIVA PERÚ)
                      - Desmarcada por defecto.
                      - Bloquea el botón "Crear Cuenta" hasta marcarla.
                      - Enlaces clicables a Términos y Privacidad sin perder datos.
                      ========================================================== */}
                  <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#1E0734]/20 space-y-1.5">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={acceptedLegalTerms}
                        onChange={(e) => {
                          triggerHaptic("tab");
                          setAcceptedLegalTerms(e.target.checked);
                        }}
                        className="mt-0.5 w-4 h-4 rounded accent-[#00A859] shrink-0 cursor-pointer"
                      />
                      <span className="text-[11px] leading-relaxed text-[#1E0734] font-semibold">
                        Declaro ser mayor de 18 años y acepto los{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerHaptic("tab");
                            setInlineLegalDoc("terms");
                          }}
                          className="font-extrabold text-[#00A859] underline hover:text-[#1E0734]"
                        >
                          Términos y Condiciones
                        </button>{" "}
                        y la{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerHaptic("tab");
                            setInlineLegalDoc("privacy");
                          }}
                          className="font-extrabold text-[#00A859] underline hover:text-[#1E0734]"
                        >
                          Política de Privacidad
                        </button>{" "}
                        de MATCHPOINT.
                      </span>
                    </label>
                  </div>

                  {registerError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-700 text-xs font-bold">
                      {registerError}
                    </div>
                  )}

                  {/* Botón Crear Cuenta: BLOQUEADO hasta marcar el checkbox y validar +18 */}
                  <button
                    type="submit"
                    disabled={!canSubmitRegistration}
                    className={`w-full py-3.5 px-6 rounded-full font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
                      canSubmitRegistration
                        ? "bg-[#1E0734] hover:bg-[#290C46] text-[#00DC7D] shadow-xl cursor-pointer mp-btn-tactile"
                        : "bg-[#1E0734]/20 text-[#1E0734]/45 cursor-not-allowed"
                    }`}
                  >
                    <WtaIcon
                      name={canSubmitRegistration ? "check" : "lock"}
                      size={16}
                    />
                    <span>
                      {canSubmitRegistration
                        ? "Crear Cuenta e Ir al Test Inicial"
                        : "Completa tus datos (+18) y acepta los términos"}
                    </span>
                  </button>
                </form>
              )}

              {/* ---------------- MODO 3: RECUPERACIÓN EN 2 PASOS ---------------- */}
              {authMode === "recover" && (
                <div className="space-y-4 my-auto">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D]/20 text-[#00A859] text-[10px] font-wta-display font-black uppercase tracking-wider">
                      RECUPERACIÓN DE ACCESO EN 2 PASOS
                    </span>
                    <h2 className="font-wta-condensed text-3xl font-bold uppercase text-[#1E0734] mt-1">
                      RESTABLECE TU CONTRASEÑA
                    </h2>
                  </div>

                  {recoverStep === 1 ? (
                    <form
                      onSubmit={handleVerifyRecoveryIdentity}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                          Paso 1: Tu celular (9 dígitos) o correo
                        </label>
                        <input
                          type="text"
                          required
                          value={recoverContact}
                          onChange={(e) => setRecoverContact(e.target.value)}
                          placeholder="Ej. 999888777 o correo@matchpoint.pe"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#1E0734]/75 mb-1">
                          Confirma tu edad registrada
                        </label>
                        <input
                          type="number"
                          value={recoverAgeVerify}
                          onChange={(e) => setRecoverAgeVerify(e.target.value)}
                          placeholder="Ej. 26"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                        />
                      </div>

                      {recoverStatusMsg && (
                        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-700 text-xs font-bold">
                          {recoverStatusMsg}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => switchModeWithTransition("login")}
                          className="py-3 px-4 rounded-full bg-[#FAF9F5] border border-[#1E0734]/20 text-xs font-extrabold mp-btn-tactile"
                        >
                          « Volver al Login
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 px-5 rounded-full bg-[#1E0734] text-[#00DC7D] font-wta-display font-extrabold text-xs mp-btn-tactile"
                        >
                          Verificar cuenta ➔
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleSaveRecoveredPassword}
                      className="space-y-3"
                    >
                      <div className="p-3 rounded-2xl bg-[#00DC7D]/15 border border-[#00A859]/40 text-xs font-bold text-[#1E0734]">
                        Identidad verificada para{" "}
                        <strong>{matchedRecoverPlayer?.name}</strong>. Ingresa tu
                        nueva contraseña:
                      </div>

                      <input
                        type="password"
                        required
                        value={recoverNewPass}
                        onChange={(e) => setRecoverNewPass(e.target.value)}
                        placeholder="Escribe tu nueva contraseña"
                        className="w-full px-3.5 py-3 rounded-xl border border-[#1E0734]/20 bg-[#FAF9F5] text-xs font-bold mp-input-alive"
                      />

                      <button
                        type="submit"
                        className="w-full py-3.5 px-5 rounded-full mp-btn-emerald font-wta-display font-extrabold text-xs"
                      >
                        Guardar nueva clave y entrar
                      </button>
                    </form>
                  )}

                  {/* Soporte Directo por WhatsApp con el Administrador */}
                  <div className="pt-2 border-t border-[#1E0734]/10">
                    <a
                      href={`https://wa.me/${
                        CIRCUIT_CONFIG.adminWhatsApp
                      }?text=${encodeURIComponent(
                        `Hola Administrador MATCHPOINT, solicito restablecer el acceso a mi cuenta vinculada a: ${
                          recoverContact || "mi celular"
                        }.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-2xl bg-[#00A859]/12 text-[#00A859] font-extrabold text-xs flex items-center justify-center gap-1.5"
                    >
                      <WtaIcon name="whatsapp" size={15} />
                      <span>Solicitar rescate directo por WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Franja Inferior Legal Verde Esmeralda (Estilo WTA Unlocked) */}
              <div className="pt-3 border-t border-[#1E0734]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[#1E0734]/65">
                <span>© 2026 MATCHPOINT</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInlineLegalDoc("terms")}
                    className="hover:text-[#00A859] underline"
                  >
                    Términos
                  </button>
                  <button
                    type="button"
                    onClick={() => setInlineLegalDoc("privacy")}
                    className="hover:text-[#00A859] underline"
                  >
                    Privacidad (Ley N° 29733)
                  </button>
                </div>
              </div>
            </div>

            {/* ==================== MITAD DERECHA (50% -> 6 COLS): PÓSTER EDITORIAL ==================== */}
            <div
              className={`lg:col-span-6 relative min-h-[260px] lg:min-h-[540px] p-6 flex flex-col justify-between overflow-hidden text-white ${
                authMode === "register" ? "bg-[#1E0734]" : "bg-[#00A859]"
              }`}
            >
              <SmartImage
                src={
                  authMode === "register"
                    ? ASSETS.registroPosterPurpura
                    : ASSETS.loginPosterEsmeralda
                }
                alt="Póster Oficial MatchPoint"
                className="absolute inset-0 w-full h-full object-cover opacity-55"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    authMode === "register"
                      ? "linear-gradient(180deg, rgba(30,7,52,0.55) 0%, rgba(30,7,52,0.35) 40%, rgba(22,4,40,0.96) 100%)"
                      : "linear-gradient(180deg, rgba(0,168,89,0.55) 0%, rgba(30,7,52,0.45) 45%, rgba(30,7,52,0.95) 100%)",
                }}
              />

              <div className="relative z-10">
                <BrandLogo variant="night-cobrand" size="md" />
              </div>

              <div className="relative z-10 space-y-3 mt-12">
                <span className="px-3 py-1 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-wider inline-block">
                  {authMode === "register"
                    ? "REGISTRO OFICIAL DE JUGADORES"
                    : "ACCESO AL CIRCUITO DE HUANCAYO"}
                </span>

                <h3 className="font-wta-condensed text-3xl sm:text-4xl font-bold uppercase leading-none">
                  {authMode === "register"
                    ? "CREA TU CUENTA GRATIS Y DESBLOQUEA EL CIRCUITO"
                    : "ENTRA A CANCHA, SUMA PUNTOS Y GANA GEMAS"}
                </h3>

                {/* Línea degradada esmeralda-oro bajo el titular */}
                <div className="h-1 w-28 rounded-full bg-gradient-to-r from-[#00DC7D] to-[#F59E0B]" />

                <ul className="space-y-1.5 text-xs text-white/90 font-semibold">
                  <li className="flex items-center gap-2">
                    <WtaIcon
                      name="check"
                      size={14}
                      className="text-[#00DC7D]"
                    />
                    <span>
                      Ranking oficial por categorías (5ª P hasta 2ª Libre y +40 Master)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <WtaIcon
                      name="check"
                      size={14}
                      className="text-[#00DC7D]"
                    />
                    <span>
                      Comparador Head to Head y Estudio de Silueta estilo WTA
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <WtaIcon
                      name="check"
                      size={14}
                      className="text-[#00DC7D]"
                    />
                    <span>
                      Canje de Gemas por escenarios Grand Slam y bonos en tienda
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* VISOR LEGAL SUPERPUESTO (SE ABRE ENCIMA SIN BORRAR LOS DATOS ESCRITOS EN EL REGISTRO) */}
        {inlineLegalDoc && (
          <div className="absolute inset-0 z-40 bg-[#1E0734]/95 text-white p-5 sm:p-7 flex flex-col justify-between mp-view-enter">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <span className="text-[10px] font-wta-display font-black uppercase tracking-wider text-[#00DC7D] block">
                  NORMATIVA LEGAL VIGENTE · PERÚ
                </span>
                <h3 className="font-wta-condensed text-2xl font-bold uppercase">
                  {inlineLegalDoc === "terms"
                    ? "TÉRMINOS Y CONDICIONES DE USO"
                    : "POLÍTICA DE PRIVACIDAD (LEY N° 29733)"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInlineLegalDoc(null)}
                className="px-3.5 py-1.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-xs font-extrabold"
              >
                Volver al formulario
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
              {(inlineLegalDoc === "terms"
                ? OFFICIAL_TERMS_CLAUSES
                : OFFICIAL_PRIVACY_CLAUSES
              ).map((cl) => (
                <div
                  key={cl.number}
                  className="p-3.5 rounded-2xl bg-white/8 border border-white/12 space-y-1"
                >
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#00DC7D]">
                    {cl.number}. {cl.title}
                  </h4>
                  <p className="text-xs text-white/85 leading-relaxed">
                    {cl.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-3">
              <span className="text-[11px] text-white/70">
                Tus datos escritos en el formulario se mantienen guardados.
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("success");
                  setAcceptedLegalTerms(true);
                  setInlineLegalDoc(null);
                }}
                className="py-2.5 px-5 rounded-full mp-btn-emerald font-wta-display font-extrabold text-xs"
              >
                Leído y Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. TEST INICIAL DIDÁCTICO DE 5 PREGUNTAS A PRUEBA DE INCONGRUENCIAS
//    (<InitialCalibrationWizardModal/>)
//    - Paso 0: Bienvenida explicada con lenguaje sencillo.
//    - Pasos 1 a 5: Botones grandes con colores por nivel, check animado y
//      opción de regresar a la pregunta anterior.
//    - Pantalla Final: Categoría asignada, bono de +20 Gemas y explicación
//      de los primeros 5 partidos de prueba.
// ----------------------------------------------------------------------------
export function InitialCalibrationWizardModal({
  isOpen,
  onClose,
  currentUser,
  lightMode = false,
  onCompleteCalibration,
}) {
  const [step, setStep] = useState(0); // 0 = Intro, 1..5 = Preguntas, 6 = Resultado
  const [answersMap, setAnswersMap] = useState({});
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setAnswersMap({});
      setDiagnosisResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQuestion =
    step >= 1 && step <= 5 ? INITIAL_CALIBRATION_QUESTIONS[step - 1] : null;

  const handleChooseOption = (questionObj, optionObj) => {
    triggerHaptic("tab");
    const updatedMap = {
      ...answersMap,
      [questionObj.id]: optionObj,
    };
    setAnswersMap(updatedMap);

    setTimeout(() => {
      if (step < 5) {
        setStep((prev) => prev + 1);
      } else {
        const result = evaluateInitialCalibration(updatedMap);
        setDiagnosisResult(result);
        setStep(6);
        triggerHaptic("success");
      }
    }, 220);
  };

  const handleConfirmFinish = () => {
    triggerHaptic("hero");
    if (onCompleteCalibration && diagnosisResult) {
      onCompleteCalibration({
        assignedElo: diagnosisResult.assignedElo,
        categoryName: diagnosisResult.category.name,
      });
    }
    onClose();
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={step === 6 ? handleConfirmFinish : onClose}
      title={
        step === 0
          ? "Ubica tu Categoría de Inicio"
          : step <= 5
          ? `Pregunta ${step} de 5`
          : "¡Tu Categoría Está Lista!"
      }
      subtitle={
        step === 0
          ? "Responde 5 preguntas breves sobre tu experiencia en cancha para emparejarte con rivales de tu mismo nivel."
          : step <= 5
          ? currentQuestion?.subtitle
          : "Ya puedes lanzar retos y competir en el circuito oficial de Huancayo."
      }
      badgeText="UBICACIÓN DE NIVEL (1 SOLA VEZ)"
      iconName="sparkles"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      {/* PASO 0: BIENVENIDA CERCANA Y DIDÁCTICA */}
      {step === 0 && (
        <div className="space-y-4 mp-view-enter">
          <div
            className={`p-4 rounded-3xl border space-y-3 text-xs leading-relaxed ${
              lightMode
                ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                : "bg-[#1E0734] border-white/12 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <SmartImage
                src={ASSETS.pelotaVoltAzul}
                alt="Pelota"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div>
                <h4 className="font-wta-condensed text-xl font-bold uppercase text-[#00DC7D]">
                  HOLA {currentUser?.firstName || "TENISTA"}, ASÍ FUNCIONA:
                </h4>
                <p className="opacity-85 mt-0.5">
                  Este cuestionario rápido solo se realiza una vez al crear tu
                  cuenta.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-current/10">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00DC7D] text-[#1E0734] font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  <strong>Toca la opción que mejor te describa:</strong> No hay
                  respuestas buenas ni malas; sirve para que no juegues contra
                  alguien de nivel muy distinto al tuyo.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00DC7D] text-[#1E0734] font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  <strong>Tus primeros 5 partidos de prueba:</strong> Una vez en
                  cancha, tus primeros 5 partidos ajustarán tu puntaje real de
                  forma automática.
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              setStep(1);
            }}
            className="w-full py-4 px-6 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
          >
            <span>Comenzar las 5 preguntas</span>
            <WtaIcon name="arrow-right" size={18} />
          </button>
        </div>
      )}

      {/* PASOS 1 A 5: LAS 5 PREGUNTAS CON BOTONES GRANDES Y REBOTE ELÁSTICO */}
      {step >= 1 && step <= 5 && currentQuestion && (
        <div key={currentQuestion.id} className="space-y-4 mp-view-enter">
          {/* Barra de progreso 1 a 5 */}
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx <= step ? "bg-[#00DC7D]" : "bg-current/15"
                }`}
              />
            ))}
          </div>

          <h4 className="font-wta-display text-base sm:text-lg font-extrabold leading-snug">
            {currentQuestion.title}
          </h4>

          <div className="space-y-2.5">
            {currentQuestion.options.map((opt) => {
              const isSelected = answersMap[currentQuestion.id]?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChooseOption(currentQuestion, opt)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-3 mp-btn-tactile ${
                    isSelected
                      ? "bg-[#00DC7D]/20 border-[#00DC7D] shadow-lg scale-[1.01]"
                      : lightMode
                      ? "bg-white border-[#1E0734]/12 hover:border-[#00DC7D]"
                      : "bg-[#1E0734] border-white/15 hover:border-[#00DC7D]"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.2 rounded text-[10px] font-wta-display font-black uppercase"
                        style={{
                          backgroundColor: opt.accentColor,
                          color: "#1E0734",
                        }}
                      >
                        {opt.tierTag}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold">
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-75 leading-snug">
                      {opt.detail}
                    </p>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-[#00DC7D] border-[#00DC7D] text-[#1E0734]"
                        : "border-current/25"
                    }`}
                  >
                    {isSelected && (
                      <WtaIcon name="check" size={15} strokeWidth={3} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                setStep((prev) => prev - 1);
              }}
              className="text-xs font-extrabold text-[#00DC7D] flex items-center gap-1 pt-1"
            >
              <WtaIcon name="chevron-left" size={14} />
              <span>Volver a la pregunta anterior</span>
            </button>
          )}
        </div>
      )}

      {/* PASO 6: DIAGNÓSTICO FINAL DE CATEGORÍA Y PUNTOS */}
      {step === 6 && diagnosisResult && (
        <div className="space-y-4 text-center mp-view-enter">
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#00DC7D]/20 via-[#1E0734] to-[#160428] border-2 border-[#00DC7D] text-white space-y-2.5 shadow-xl">
            <span className="px-3 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase tracking-widest inline-block">
              CATEGORÍA INICIAL ASIGNADA
            </span>

            <div className="font-wta-condensed text-4xl sm:text-5xl font-bold uppercase text-[#00DC7D] leading-none">
              {diagnosisResult.category.fullName}
            </div>

            <div className="font-wta-condensed text-2xl font-bold text-white tabular-nums">
              Puntaje de partida: {diagnosisResult.assignedElo} PTS
            </div>

            <p className="text-xs text-white/85 leading-relaxed max-w-md mx-auto">
              {diagnosisResult.explanation}
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmFinish}
            className="w-full py-4 px-6 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
          >
            <WtaIcon name="check" size={18} strokeWidth={2.8} />
            <span>Entrar al Ranking con mi Categoría</span>
          </button>
        </div>
      )}
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 4. GUÍA VISUAL DEL CIRCUITO (<VisualRulesModal/>)
//    Explica mediante ejemplos reales de marcadores cómo suben y se protegen
//    los puntos, el equilibrio +40 Master y la economía de Gemas.
// ----------------------------------------------------------------------------
export function VisualRulesModal({ isOpen, onClose, lightMode = false }) {
  if (!isOpen) return null;

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Guía Visual del Circuito"
      subtitle="Cómo funcionan los puntos, los pisos seguros de categoría y las Gemas de mérito en Huancayo."
      badgeText="REGLAS CLARAS EN CANCHA"
      iconName="trophy"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-3.5 text-xs">
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            lightMode
              ? "bg-white border-[#1E0734]/12"
              : "bg-[#1E0734] border-white/12"
          }`}
        >
          <span className="px-2.5 py-0.5 rounded-full bg-[#00DC7D] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
            1. CÓMO SE CALCULAN TUS PUNTOS EN CANCHA
          </span>
          <p className="leading-relaxed opacity-85">
            Cada partido oficial pone en juego un rango justo según la diferencia
            de nivel entre ambos tenistas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-current/5 border border-current/10">
              <strong className="text-[#00DC7D] block">Victoria clara (6-2, 6-1)</strong>
              <span className="text-[11px] opacity-80">
                Sumas cerca del tope máximo de puntos en juego.
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-current/5 border border-current/10">
              <strong className="text-[#6EF2B5] block">Batalla a 3 Sets</strong>
              <span className="text-[11px] opacity-80">
                Si das pelea y caes en el Super Tie-Break, pierdes menos de la
                mitad de puntos.
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-current/5 border border-current/10">
              <strong className="text-[#F59E0B] block">Pisos Protegidos</strong>
              <span className="text-[11px] opacity-80">
                Al subir de categoría o cruzar 2,750 y 4,250 pts, aseguras ese
                escalón.
              </span>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            lightMode
              ? "bg-white border-[#1E0734]/12"
              : "bg-[#1E0734] border-white/12"
          }`}
        >
          <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E0734] text-[10px] font-wta-display font-black uppercase">
            2. CÓMO GANAR GEMAS DE MÉRITO
          </span>
          <ul className="space-y-1.5 opacity-90">
            <li>• <strong>Racha de 3+ victorias seguidas:</strong> +6 a +15 Gemas por partido.</li>
            <li>• <strong>Vencer a un rival de mayor puntaje:</strong> +10 a +25 Gemas.</li>
            <li>• <strong>Campeón o Finalista de Torneo Oficial:</strong> +180 a +1,000 Gemas.</li>
            <li>• <strong>Trivia semanal y reporte de clima en sede:</strong> +3 a +5 Gemas.</li>
          </ul>
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// === FIN DEL BLOQUE 12 DE 14 ===

// ============================================================================
// PARTE 13 DE 14: LIBRO DE RECLAMACIONES VIRTUAL (INDECOPI), MODALES LEGALES
// PERÚ (TÉRMINOS Y PRIVACIDAD LEY N° 29733), REPRODUCTOR DE TIPS GRATUITOS,
// NOTICIERO EN GRILLA BENTO CON FOTOS REALES, CINTA SUPERIOR DE 1 LÍNEA (34PX),
// HEADER EN PÍLDORA FLOTANTE SIN RECORTES, MENÚ LATERAL INSTITUCIONAL, BARRA
// DE 6 REDES SOCIALES Y BARRA DE NAVEGACIÓN INFERIOR CON HALO ESMERALDA
// ============================================================================

// ----------------------------------------------------------------------------
// 1. LIBRO DE RECLAMACIONES VIRTUAL OFICIAL (<VirtualClaimsBookModal/>)
//    Cumplimiento estricto del Código de Protección y Defensa del Consumidor
//    (Indecopi — Perú):
//    - Distintivo oficial del Libro de Reclamaciones Virtual.
//    - Formulario con Nombre completo, DNI o Carné de Extranjería, Correo,
//      Teléfono, Tipo (Reclamo o Queja) y Detalle del incidente.
//    - Genera código correlativo automático (ej. LR-2026-001) y lo guarda en
//      el almacenamiento local y en Supabase.
// ----------------------------------------------------------------------------
export function VirtualClaimsBookModal({
  isOpen,
  onClose,
  currentUser,
  claimsHistory = [],
  lightMode = false,
  onSubmitNewClaim,
}) {
  const [fullName, setFullName] = useState(currentUser?.name || "");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.whatsapp || "");
  const [claimType, setClaimType] = useState("Reclamo"); // 'Reclamo' | 'Queja'
  const [serviceRelated, setServiceRelated] = useState(
    "Inscripción a Torneo / Ranking / Membresía VIP"
  );
  const [detail, setDetail] = useState("");
  const [consumerRequest, setConsumerRequest] = useState("");
  const [submittedClaim, setSubmittedClaim] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser?.name || "");
      setEmail(currentUser?.email || "");
      setPhone(currentUser?.whatsapp || "");
      setDocumentId("");
      setClaimType("Reclamo");
      setDetail("");
      setConsumerRequest("");
      setSubmittedClaim(null);
      setErrorMsg("");
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const nextSequentialNumber = (Array.isArray(claimsHistory) ? claimsHistory.length : 0) + 1;
  const previewCorrelativeCode = `LR-2026-${String(nextSequentialNumber).padStart(3, "0")}`;

  const handleSendClaim = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      fullName.trim().length < 3 ||
      documentId.trim().length < 7 ||
      email.trim().length < 5 ||
      phone.trim().length < 7 ||
      detail.trim().length < 10
    ) {
      setErrorMsg(
        "Por favor completa todos los campos obligatorios y detalla el incidente (mínimo 10 caracteres)."
      );
      return;
    }

    const nowStamp = new Date().toLocaleString("es-PE");
    const isoStamp = new Date().toISOString();

    const newClaimRecord = {
      id: `claim-${Date.now()}`,
      code: previewCorrelativeCode,
      fullName: fullName.trim(),
      documentId: documentId.trim(),
      email: email.trim(),
      phone: phone.trim(),
      type: claimType,
      serviceRelated,
      detail: detail.trim(),
      consumerRequest:
        consumerRequest.trim() || "Atención y respuesta conforme a ley.",
      status: "recibido",
      createdAt: nowStamp,
      createdAtIso: isoStamp,
    };

    // Guarda el registro en Supabase como respaldo legal ante Indecopi
    syncRecordToSupabase("indecopi_claims_book", {
      claim_code: newClaimRecord.code,
      full_name: newClaimRecord.fullName,
      document_id: newClaimRecord.documentId,
      email: newClaimRecord.email,
      phone: newClaimRecord.phone,
      claim_type: newClaimRecord.type,
      service_related: newClaimRecord.serviceRelated,
      incident_detail: newClaimRecord.detail,
      consumer_request: newClaimRecord.consumerRequest,
      created_at: isoStamp,
    }).catch(() => {});

    triggerHaptic("success");
    if (onSubmitNewClaim) {
      onSubmitNewClaim(newClaimRecord);
    }
    setSubmittedClaim(newClaimRecord);
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Libro de Reclamaciones Virtual"
      subtitle="Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571 — Indecopi Perú)."
      badgeText={`HOJA N° ${previewCorrelativeCode}`}
      iconName="reclamaciones"
      lightMode={lightMode}
      maxWidthClass="max-w-lg"
    >
      {submittedClaim ? (
        <div className="space-y-4 mp-view-enter">
          <div className="p-5 rounded-3xl bg-[#00DC7D]/15 border-2 border-[#00DC7D] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00DC7D] text-[#1E0734] flex items-center justify-center mx-auto shadow-md">
              <WtaIcon name="check" size={24} strokeWidth={2.8} />
            </div>

            <span className="px-3 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D] text-[10px] font-wta-display font-black uppercase tracking-widest inline-block">
              CONSTANCIA DE REGISTRO OFICIAL
            </span>

            <h4 className="font-wta-condensed text-3xl font-bold uppercase text-[#00DC7D] leading-none">
              CÓDIGO: {submittedClaim.code}
            </h4>

            <p className="text-xs leading-relaxed opacity-90">
              Tu <strong>{submittedClaim.type.toUpperCase()}</strong> ha quedado
              registrada en la base de datos de MATCHPOINT con fecha{" "}
              <strong>{submittedClaim.createdAt}</strong>. El Comité dará
              respuesta formal a tu correo electrónico dentro del plazo legal.
            </p>

            <div className="p-3 rounded-2xl bg-black/25 border border-white/10 text-left text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="opacity-70">Titular:</span>
                <strong className="font-extrabold">{submittedClaim.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">DNI / CE:</span>
                <strong className="font-extrabold">
                  {submittedClaim.documentId}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Tipo:</span>
                <strong className="font-extrabold text-[#00DC7D]">
                  {submittedClaim.type}
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const msg = encodeURIComponent(
                  `Constancia de Hoja de Reclamación *${submittedClaim.code}* en MATCHPOINT:\n` +
                    `• Titular: ${submittedClaim.fullName} (DNI/CE: ${submittedClaim.documentId})\n` +
                    `• Tipo: ${submittedClaim.type}\n` +
                    `• Detalle: ${submittedClaim.detail}`
                );
                window.open(
                  `https://wa.me/${CIRCUIT_CONFIG.adminWhatsApp}?text=${msg}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              className="py-3 px-4 rounded-2xl bg-white/12 hover:bg-white/20 border border-current/20 font-wta-display font-bold text-xs flex items-center justify-center gap-1.5 mp-btn-tactile"
            >
              <WtaIcon name="whatsapp" size={15} className="text-[#00DC7D]" />
              <span>Enviar copia a soporte</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl mp-btn-emerald font-wta-display font-extrabold text-xs"
            >
              Cerrar ventana
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendClaim} className="space-y-3.5">
          {/* Encabezado Reglamentario Indecopi */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              lightMode
                ? "bg-white border-[#1E0734]/15 text-[#1E0734]"
                : "bg-[#1E0734] border-[#00DC7D]/35 text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00DC7D]/20 text-[#00DC7D] border border-[#00DC7D]/50 flex items-center justify-center shrink-0">
                <WtaIcon name="reclamaciones" size={18} />
              </div>
              <div>
                <div className="font-extrabold text-xs">
                  Proveedor: MATCHPOINT · Circuito Oficial Huancayo
                </div>
                <div className="text-[10px] opacity-70">
                  Fecha de emisión: {new Date().toLocaleDateString("es-PE")}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-[#00DC7D] text-[#1E0734] font-wta-condensed font-bold text-sm shrink-0">
              {previewCorrelativeCode}
            </span>
          </div>

          {/* 1. Identificación del Consumidor Reclamante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombres y apellidos completos"
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold mp-input-alive ${
                  lightMode
                    ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                    : "bg-[#1E0734] border-white/20 text-white"
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
                DNI o Carné de Extranjería *
              </label>
              <input
                type="text"
                required
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Ej. 72849102"
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold mp-input-alive ${
                  lightMode
                    ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                    : "bg-[#1E0734] border-white/20 text-white"
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold mp-input-alive ${
                  lightMode
                    ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                    : "bg-[#1E0734] border-white/20 text-white"
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
                Teléfono / Celular *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="999 888 777"
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold mp-input-alive ${
                  lightMode
                    ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                    : "bg-[#1E0734] border-white/20 text-white"
                }`}
              />
            </div>
          </div>

          {/* 2. Selector de Tipo: Reclamo vs Queja (Definición Legal Indecopi) */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-80">
              Tipo de Solicitud *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: "Reclamo",
                  title: "Reclamo",
                  desc: "Disconformidad relacionada directamente a los servicios o productos.",
                },
                {
                  id: "Queja",
                  title: "Queja",
                  desc: "Malestar o descontento respecto a la atención al público.",
                },
              ].map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setClaimType(tp.id);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all mp-btn-tactile ${
                    claimType === tp.id
                      ? "border-2 border-[#00DC7D] bg-[#00DC7D]/15"
                      : lightMode
                      ? "bg-white border-[#1E0734]/15"
                      : "bg-white/6 border-white/15"
                  }`}
                >
                  <div className="text-xs font-extrabold text-[#00DC7D]">
                    {tp.title}
                  </div>
                  <p className="text-[10px] opacity-75 leading-snug mt-0.5">
                    {tp.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Detalle del Incidente y Pedido */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
              Detalle del Incidente *
            </label>
            <textarea
              rows={3}
              required
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Describe con detalle lo ocurrido, incluyendo fecha y servicio involucrado..."
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-medium mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/20 text-white"
              }`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-80">
              Pedido o solución esperada (opcional)
            </label>
            <input
              type="text"
              value={consumerRequest}
              onChange={(e) => setConsumerRequest(e.target.value)}
              placeholder="Ej. Revisión de inscripción o corrección de registro..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium mp-input-alive ${
                lightMode
                  ? "bg-white border-[#1E0734]/20 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/20 text-white"
              }`}
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl mp-btn-emerald mp-btn-shimmer font-wta-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
          >
            <WtaIcon name="reclamaciones" size={17} />
            <span>Enviar Hoja de Reclamación</span>
          </button>
        </form>
      )}
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 2. MODAL DE TÉRMINOS Y CONDICIONES (5 CLÁUSULAS) Y POLÍTICA DE PRIVACIDAD
//    (LEY N° 29733 — 4 CLÁUSULAS + DERECHOS ARCO) (<LegalTermsAndPrivacyModal/>)
// ----------------------------------------------------------------------------
export function LegalTermsAndPrivacyModal({
  isOpen,
  onClose,
  initialDoc = "terms", // 'terms' | 'privacy'
  currentUser,
  lightMode = false,
}) {
  const [activeDoc, setActiveDoc] = useState(initialDoc || "terms");

  useEffect(() => {
    if (isOpen && initialDoc) {
      setActiveDoc(initialDoc);
    }
  }, [isOpen, initialDoc]);

  if (!isOpen) return null;

  const isTerms = activeDoc === "terms";
  const clausesList = isTerms ? OFFICIAL_TERMS_CLAUSES : OFFICIAL_PRIVACY_CLAUSES;

  const handleRequestArcoRights = () => {
    triggerHaptic("hero");
    const msg = encodeURIComponent(
      `Hola *Soporte Legal MATCHPOINT*, en ejercicio de mis *Derechos ARCO (Ley N° 29733 — Protección de Datos Personales)*, yo *${
        currentUser?.name || "[Nombre Completo]"
      }* solicito la revisión / actualización / cancelación de mis datos vinculados al correo *${
        currentUser?.email || "[Mi Correo]"
      }*.`
    );
    window.open(
      `https://wa.me/${CIRCUIT_CONFIG.adminWhatsApp}?text=${msg}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        isTerms
          ? "Términos y Condiciones Oficiales"
          : "Política de Privacidad (Ley N° 29733)"
      }
      subtitle={
        isTerms
          ? "Reglamento de uso, exención de responsabilidad física y normas disciplinarias de MATCHPOINT."
          : "Protección de datos personales, privacidad de tu teléfono y ejercicio de Derechos ARCO en el Perú."
      }
      badgeText="MARCO LEGAL PERÚ · 2026"
      iconName="shield"
      lightMode={lightMode}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        {/* Conmutador entre Términos y Política de Privacidad */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#1E0734] border border-white/15">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setActiveDoc("terms");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-wta-display font-extrabold transition-all ${
              isTerms
                ? "bg-[#00DC7D] text-[#1E0734] shadow-sm"
                : "text-white/75 hover:text-white"
            }`}
          >
            Términos y Condiciones
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setActiveDoc("privacy");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-wta-display font-extrabold transition-all ${
              !isTerms
                ? "bg-[#00DC7D] text-[#1E0734] shadow-sm"
                : "text-white/75 hover:text-white"
            }`}
          >
            Política de Privacidad
          </button>
        </div>

        {/* Lista Estructurada de Cláusulas Obligatorias */}
        <div className="space-y-3">
          {clausesList.map((cl) => (
            <div
              key={cl.number}
              className={`p-4 rounded-2xl border space-y-1.5 ${
                lightMode
                  ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                  : "bg-[#1E0734] border-white/12 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#00DC7D] text-[#1E0734] font-wta-condensed font-bold text-sm flex items-center justify-center shrink-0">
                  {cl.number}
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#00DC7D]">
                  {cl.title}
                </h4>
              </div>
              <p className="text-xs leading-relaxed opacity-90 pl-8">
                {cl.body}
              </p>
            </div>
          ))}
        </div>

        {/* Canal Directo para Ejercer Derechos ARCO (Ley N° 29733) */}
        {!isTerms && (
          <div className="p-3.5 rounded-2xl bg-[#00DC7D]/15 border border-[#00DC7D]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <strong className="font-extrabold text-[#00DC7D] block">
                Solicitud de Derechos ARCO (Ley N° 29733):
              </strong>
              <span className="opacity-85">
                Solicita la modificación o eliminación definitiva de tus datos
                personales con nuestro canal de soporte.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRequestArcoRights}
              className="px-3.5 py-2 rounded-xl bg-[#1E0734] text-[#00DC7D] font-extrabold shrink-0 mp-btn-tactile"
            >
              Solicitar ARCO ➔
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl mp-btn-emerald font-wta-display font-extrabold text-xs sm:text-sm"
        >
          Entendido y Cerrar
        </button>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 3. MODAL REPRODUCTOR DE LOS 2 TIPS GRATUITOS DE LA SEMANA Y ACADEMIA TV
//    (<WeeklyFreeTipsPlayerModal/>)
//    Se abre desde la cinta superior fina (34px) o desde la sección de videos.
// ----------------------------------------------------------------------------
export function WeeklyFreeTipsPlayerModal({
  isOpen,
  onClose,
  initialClassItem = null,
  classesList = WEEKLY_TIPS_AND_CLASSES,
  unlockedClassIds = [],
  currentUser,
  lightMode = false,
  onUnlockClassWithGems,
}) {
  const [selectedVideo, setSelectedVideo] = useState(
    initialClassItem || classesList[0]
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedVideo(initialClassItem || classesList[0]);
    }
  }, [isOpen, initialClassItem, classesList]);

  if (!isOpen || !selectedVideo) return null;

  const isUnlocked =
    selectedVideo.isFreeWeeklyTip ||
    unlockedClassIds.includes(selectedVideo.id);

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Tips de la Semana & Academia TV"
      subtitle="Consejos prácticos grabados en las canchas de Huancayo por nuestros entrenadores."
      badgeText={selectedVideo.categoryTag}
      iconName="video"
      lightMode={lightMode}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        {/* Reproductor Principal */}
        <div className="rounded-3xl overflow-hidden bg-black border-2 border-[#00DC7D]/50 shadow-2xl relative aspect-video">
          {isUnlocked ? (
            <video
              key={selectedVideo.id}
              src={selectedVideo.videoSrc}
              poster={selectedVideo.thumbnail}
              controls
              playsInline
              preload="none"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
              <SmartImage
                src={selectedVideo.thumbnail}
                alt={selectedVideo.title}
                className="absolute inset-0 w-full h-full object-cover opacity-35"
              />
              <div className="relative z-10 space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#1E0734] text-[#00DC7D] border border-[#00DC7D] flex items-center justify-center mx-auto">
                  <WtaIcon name="lock" size={22} />
                </div>
                <h4 className="font-wta-condensed text-2xl font-bold uppercase">
                  {selectedVideo.title}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("hero");
                    if (onUnlockClassWithGems) {
                      onUnlockClassWithGems(selectedVideo);
                    }
                  }}
                  className="py-3 px-5 rounded-full mp-btn-emerald font-wta-display font-extrabold text-xs inline-flex items-center gap-1.5"
                >
                  <WtaIcon name="gem" size={14} />
                  <span>Desbloquear clase con {selectedVideo.costGems} Gemas</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Claves Técnicas del Video */}
        <div
          className={`p-4 rounded-2xl border space-y-2 text-xs ${
            lightMode
              ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
              : "bg-[#1E0734] border-white/12 text-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-wta-display font-extrabold uppercase text-[#00DC7D] text-[11px]">
              CLAVES DE {selectedVideo.coachName.toUpperCase()}
            </span>
            <span className="opacity-70 font-bold">
              Duración: {selectedVideo.duration}
            </span>
          </div>

          <h4 className="font-wta-display text-sm font-extrabold">
            {selectedVideo.title}
          </h4>

          <ul className="space-y-1.5 pt-1">
            {(selectedVideo.keyTakeaways || []).map((tk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#00DC7D]/20 text-[#00DC7D] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="opacity-90 leading-relaxed">{tk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Selector de los demás videos */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-wta-display font-extrabold uppercase tracking-wider opacity-75 block">
            Más consejos disponibles:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {classesList.map((item) => {
              const unlocked =
                item.isFreeWeeklyTip || unlockedClassIds.includes(item.id);
              const isCurrent = item.id === selectedVideo.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    setSelectedVideo(item);
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 mp-btn-tactile ${
                    isCurrent
                      ? "border-2 border-[#00DC7D] bg-[#00DC7D]/15"
                      : lightMode
                      ? "bg-white border-[#1E0734]/12"
                      : "bg-white/6 border-white/12"
                  }`}
                >
                  <div className="min-w-0">
                    <span
                      className={`text-[9px] font-wta-display font-black uppercase px-1.5 py-0.2 rounded ${
                        item.isFreeWeeklyTip
                          ? "bg-[#00DC7D] text-[#1E0734]"
                          : "bg-[#F59E0B] text-[#1E0734]"
                      }`}
                    >
                      {item.isFreeWeeklyTip ? "Gratis" : `${item.costGems} 💎`}
                    </span>
                    <div className="text-xs font-extrabold truncate mt-1">
                      {item.title}
                    </div>
                  </div>
                  <WtaIcon
                    name={unlocked ? "play" : "lock"}
                    size={14}
                    className="text-[#00DC7D] shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 4. MODAL DE AVISOS DEL CIRCUITO Y NOTICIERO EN GRILLA BENTO EDITORIAL
//    CON FOTOS REALES (<BulletinAndNewsModal/>)
//    - Pestaña 1: Avisos oficiales del circuito y estado de tus retos.
//    - Pestaña 2: Actualidad Tenis en Grilla Bento sobre Blanco Marfil (#FAF9F5)
//      con fotografías periodísticas reales (nunca ilustraciones internas 3D).
// ----------------------------------------------------------------------------
export const EDITORIAL_TENNIS_NEWS = [
  {
    id: "news-1",
    sourceName: "WTA / ATP Tour",
    timeAgo: "Hace 2 horas",
    category: "ACTUALIDAD INTERNACIONAL",
    title: "La gira sobre polvo de ladrillo marca récords de asistencia y partidos a tres sets",
    summary:
      "El calendario sudamericano y europeo confirma el auge de las superficies lentas para desarrollar resistencia táctica y variantes con efecto.",
    imageUrl:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80",
    externalUrl: "https://www.wtatennis.com/news",
    isFeaturedNeon: true,
  },
  {
    id: "news-2",
    sourceName: "Circuito Huancayo",
    timeAgo: "Hoy",
    category: "VALLE DEL MANTARO",
    title: "Recta final por los 8 cupos al Torneo de Maestros en Country Club Los Huancas",
    summary:
      "Cada reto oficial disputado en noviembre suma puntos directos para entrar al cuadro de honor de fin de temporada.",
    imageUrl:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80",
    externalUrl: "https://www.atptour.com/es/news",
    isFeaturedNeon: false,
  },
  {
    id: "news-3",
    sourceName: "Preparación Física",
    timeAgo: "Ayer",
    category: "SALUD EN CANCHA",
    title: "Hidratación y ajuste de tensión de cuerdas para jugar a más de 3,200 metros de altitud",
    summary:
      "Subir entre 2 y 3 libras la tensión habitual ayuda a mantener la pelota dentro de la línea de fondo en Huancayo.",
    imageUrl:
      "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=900&q=80",
    externalUrl: "https://www.puntodebreak.com",
    isFeaturedNeon: false,
  },
];

export function BulletinAndNewsModal({
  isOpen,
  onClose,
  announcements = [],
  challenges = [],
  currentUser,
  lightMode = false,
  onOpenIncomingChallenge,
}) {
  const [tab, setTab] = useState("notices"); // 'notices' | 'news_bento'

  if (!isOpen) return null;

  const myPendingChallenges = challenges.filter(
    (c) => c.status === "pending" && c.challengedId === currentUser?.id
  );

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Avisos y Actualidad Tenis"
      subtitle="Comunicados oficiales del Comité de Huancayo, alertas de retos y prensa deportiva."
      badgeText="BOLETÍN OFICIAL"
      iconName="newspaper"
      lightMode={lightMode}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Selector de Pestaña */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#1E0734] border border-white/15">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setTab("notices");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-wta-display font-extrabold transition-all ${
              tab === "notices"
                ? "bg-[#00DC7D] text-[#1E0734] shadow-sm"
                : "text-white/75 hover:text-white"
            }`}
          >
            Avisos del Circuito ({announcements.length + myPendingChallenges.length})
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              setTab("news_bento");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-wta-display font-extrabold transition-all ${
              tab === "news_bento"
                ? "bg-[#00DC7D] text-[#1E0734] shadow-sm"
                : "text-white/75 hover:text-white"
            }`}
          >
            Actualidad Tenis
          </button>
        </div>

        {/* PESTAÑA 1: AVISOS DEL CIRCUITO Y ALERTAS DE RETOS */}
        {tab === "notices" && (
          <div className="space-y-2.5 mp-view-enter">
            {myPendingChallenges.map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  onClose();
                  if (onOpenIncomingChallenge) onOpenIncomingChallenge(ch);
                }}
                className="p-3.5 rounded-2xl bg-[#00DC7D]/20 border-2 border-[#00DC7D] flex items-center justify-between gap-3 cursor-pointer"
              >
                <div>
                  <span className="px-2 py-0.5 rounded bg-[#00DC7D] text-[#1E0734] text-[9px] font-wta-display font-black uppercase">
                    RETO RECIBIDO
                  </span>
                  <div className="text-xs sm:text-sm font-extrabold mt-1">
                    {ch.challengerName} te desafió en {ch.club}
                  </div>
                  <span className="text-[11px] opacity-80">{ch.dateText}</span>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-[#1E0734] text-[#00DC7D] text-xs font-extrabold shrink-0">
                  Ver reto ➔
                </span>
              </div>
            ))}

            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border space-y-1 ${
                  lightMode
                    ? "bg-white border-[#1E0734]/12 text-[#1E0734]"
                    : "bg-[#1E0734] border-white/12 text-white"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-extrabold">
                  <span className="text-[#00DC7D] uppercase tracking-wider">
                    {ann.tag || "COMUNICADO OFICIAL"}
                  </span>
                  <span className="opacity-65">{ann.date}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold">{ann.title}</h4>
                <p className="text-xs opacity-80 leading-relaxed">{ann.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* PESTAÑA 2: GRILLA EDITORIAL BENTO SOBRE MARFIL (#FAF9F5 — RONDA 22) */}
        {tab === "news_bento" && (
          <div className="rounded-3xl p-4 bg-[#FAF9F5] text-[#1E0734] border border-[#1E0734]/12 space-y-3 mp-view-enter">
            {EDITORIAL_TENNIS_NEWS.map((art) => (
              <a
                key={art.id}
                href={art.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic("card")}
                className={`block rounded-2xl overflow-hidden bg-white transition-all wta-card-aura ${
                  art.isFeaturedNeon
                    ? "border-2 border-[#00DC7D] shadow-md"
                    : "border border-[#1E0734]/10"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 items-center">
                  <div className="sm:col-span-4 h-36 sm:h-full overflow-hidden bg-[#1E0734]">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-8 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-extrabold">
                      <span className="px-2 py-0.5 rounded-full bg-[#1E0734] text-[#00DC7D]">
                        {art.category}
                      </span>
                      <span className="text-[#1E0734]/60">
                        {art.sourceName} · {art.timeAgo}
                      </span>
                    </div>
                    <h4 className="font-wta-condensed text-lg sm:text-xl font-bold uppercase text-[#1E0734] leading-tight">
                      {art.title}
                    </h4>
                    <p className="text-xs text-[#1E0734]/75 line-clamp-2">
                      {art.summary}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 5. CINTA SUPERIOR DESLIZANTE DE 1 SOLA LÍNEA (<TopFreeTipsTickerBar/> — 34PX)
//    Reemplaza al antiguo bloque enorme de 1/3 de pantalla y lleva directo a
//    los 2 tips gratuitos de la semana sin recargar la vista en iPhone.
// ----------------------------------------------------------------------------
export function TopFreeTipsTickerBar({
  onOpenWeeklyTips,
  onOpenMasterTop8,
  lightMode = false,
}) {
  const [msgIndex, setMsgIndex] = useState(0);

  const tickerMessages = useMemo(
    () => [
      {
        id: "tk-1",
        badge: "TIPS GRATIS",
        text: "2 consejos de entrenadores en cancha disponibles esta semana",
        cta: "Ver video ➔",
        action: "tips",
      },
      {
        id: "tk-2",
        badge: "RACHA DE MÉRITO",
        text: "Encadena 3 victorias o vence a un rival superior para ganar Gemas",
        cta: "Ver cómo ➔",
        action: "tips",
      },
      {
        id: "tk-3",
        badge: "CARRERA TOP 8",
        text: "Los 8 primeros del Ranking clasifican al Torneo de Maestros",
        cta: "Ver Top 8 ➔",
        action: "top8",
      },
    ],
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [tickerMessages.length]);

  const currentMsg = tickerMessages[msgIndex] || tickerMessages[0];

  return (
    <div
      onClick={() => {
        triggerHaptic("tab");
        if (currentMsg.action === "top8" && onOpenMasterTop8) {
          onOpenMasterTop8();
        } else if (onOpenWeeklyTips) {
          onOpenWeeklyTips();
        }
      }}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      className={`w-full shrink-0 border-b cursor-pointer select-none transition-colors ${
        lightMode
          ? "bg-[#1E0734] text-white border-[#1E0734]/15"
          : "bg-gradient-to-r from-[#160428] via-[#290C46] to-[#160428] text-white border-white/10"
      }`}
    >
      <div className="h-[34px] px-3.5 sm:px-5 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.2 rounded-full bg-[#00DC7D] text-[#1E0734] text-[9px] font-wta-display font-black uppercase tracking-wider shrink-0">
            {currentMsg.badge}
          </span>
          <span className="font-semibold truncate text-white/90">
            {currentMsg.text}
          </span>
        </div>

        <span className="font-wta-display font-extrabold text-[#00DC7D] shrink-0">
          {currentMsg.cta}
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 6. CABECERA SUPERIOR EN PÍLDORA FLOTANTE SIN RECORTES (<TopFloatingPillHeader/>)
//    Resuelve de raíz el corte "MATC..." en pantallas estrechas de iPhone (375px):
//    - Muestra el botón de Menú Lateral (☰), el Isotipo Vectorial limpio (con
//      los 5 toques secretos para abrir la Suite Admin), el saldo de Gemas,
//      el botón compacto "Tienda" y la campana/boletín de avisos con punto verde.
// ----------------------------------------------------------------------------
export function TopFloatingPillHeader({
  currentUser,
  unreadNoticesCount = 1,
  sponsors = INITIAL_SPONSORS,
  lightMode = false,
  onOpenSideMenu,
  onOpenProShop,
  onOpenBulletin,
  onSecretAdminTrigger,
}) {
  return (
    <header className="px-3 sm:px-5 pt-2 pb-1.5 shrink-0 z-30">
      <div
        className={`h-13 px-3 sm:px-4 rounded-full flex items-center justify-between gap-2 shadow-[0_8px_26px_rgba(0,0,0,0.28)] border transition-colors ${
          lightMode
            ? "bg-white text-[#1E0734] border-[#1E0734]/12"
            : "bg-white text-[#1E0734] border-white/90"
        }`}
        style={{ height: 52 }}
      >
        {/* Izquierda: Menú Hamburguesa (☰) + Marca sin recortes */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              if (onOpenSideMenu) onOpenSideMenu();
            }}
            aria-label="Abrir menú principal"
            className="w-9 h-9 rounded-full bg-[#1E0734]/8 hover:bg-[#1E0734]/15 text-[#1E0734] flex items-center justify-center shrink-0 mp-btn-tactile"
          >
            <WtaIcon name="menu" size={19} strokeWidth={2.4} />
          </button>

          {/* En pantallas estrechas usa el isotipo limpio; en medianas/grandes muestra MATCHPOINT */}
          <div className="sm:hidden">
            <BrandLogo
              variant="isotipo"
              sponsorName={
                sponsors?.titleSponsor?.active ? sponsors.titleSponsor.name : ""
              }
              size="sm"
              onSecretAdminTrigger={onSecretAdminTrigger}
            />
          </div>
          <div className="hidden sm:block">
            <BrandLogo
              variant="pill-light"
              sponsorName={
                sponsors?.titleSponsor?.active ? sponsors.titleSponsor.name : ""
              }
              size="md"
              onSecretAdminTrigger={onSecretAdminTrigger}
            />
          </div>
        </div>

        {/* Derecha: Saldo de Gemas + Botón Tienda + Avisos con Punto Verde Esmeralda */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Píldora de Gemas */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              if (onOpenProShop) onOpenProShop();
            }}
            title="Mis Gemas acumuladas"
            className="px-2.5 py-1.5 rounded-full bg-[#1E0734] text-white text-xs font-wta-display font-extrabold flex items-center gap-1 shadow-sm mp-btn-tactile tabular-nums"
          >
            <WtaIcon name="gem" size={14} className="text-[#00DC7D]" />
            <span>{currentUser?.gems ?? 0}</span>
          </button>

          {/* Botón Píldora Tienda Pro Shop */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic("hero");
              if (onOpenProShop) onOpenProShop();
            }}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00A859] to-[#00DC7D] text-[#1E0734] text-xs font-wta-display font-extrabold flex items-center gap-1 shadow-sm mp-btn-tactile"
          >
            <WtaIcon name="bag" size={13} strokeWidth={2.5} />
            <span>Tienda</span>
          </button>

          {/* Icono de Boletín / Noticiero con Punto Verde Esmeralda */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              if (onOpenBulletin) onOpenBulletin();
            }}
            aria-label="Abrir avisos y noticiero"
            className="relative w-9 h-9 rounded-full bg-[#1E0734]/8 hover:bg-[#1E0734]/15 text-[#1E0734] flex items-center justify-center shrink-0 mp-btn-tactile"
          >
            <WtaIcon name="newspaper" size={18} strokeWidth={2.2} />
            {unreadNoticesCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00DC7D] border-2 border-white" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

// ----------------------------------------------------------------------------
// 7. MENÚ LATERAL INSTITUCIONAL (3 RAYITAS) Y SECCIÓN "INFORMACIÓN LEGAL"
//    (<InstitutionalSideDrawer/>)
//    - Switch deslizante Modo Claro (#FAF9F5) vs Modo Oscuro (#1E0734).
//    - Sección "Información Legal" obligatoria con los 3 botones:
//      1) Libro de Reclamaciones Virtual (Indecopi).
//      2) Términos y Condiciones.
//      3) Política de Privacidad (Ley N° 29733).
//    - Aviso de marca exacto en el Footer: "© 2026 MATCHPOINT. Todos los
//      derechos reservados."
// ----------------------------------------------------------------------------
export function InstitutionalSideDrawer({
  isOpen,
  onClose,
  currentUser,
  lightMode = false,
  onToggleLightMode,
  onNavigateTab,
  onOpenAuthPortal,
  onOpenVipCardModal,
  onOpenProShopModal,
  onOpenH2HModal,
  onOpenStoryPosterModal,
  onOpenVisionIaModal,
  onOpenVisualRulesModal,
  onOpenClaimsBookModal,
  onOpenLegalDocModal,
  onSecretAdminTrigger,
}) {
  const versionTapRef = useRef({ count: 0, timer: null });

  if (!isOpen) return null;

  const handleVersionTap = () => {
    triggerHaptic("light");
    versionTapRef.current.count += 1;
    if (versionTapRef.current.timer) clearTimeout(versionTapRef.current.timer);
    if (versionTapRef.current.count >= 3) {
      versionTapRef.current.count = 0;
      onClose();
      if (onSecretAdminTrigger) onSecretAdminTrigger();
      return;
    }
    versionTapRef.current.timer = setTimeout(() => {
      versionTapRef.current.count = 0;
    }, 1600);
  };

  const catObj = getCategoryByElo(currentUser?.elo || 1500);

  return (
    <div
      className="fixed inset-0 z-50 flex mp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <aside
        className={`w-[86vw] max-w-[340px] h-full flex flex-col justify-between overflow-y-auto overscroll-contain p-4 sm:p-5 shadow-[20px_0_60px_rgba(0,0,0,0.75)] border-r ${
          lightMode
            ? "bg-[#FAF9F5] text-[#1E0734] border-[#1E0734]/15"
            : "bg-[#1E0734] text-white border-[#00DC7D]/30"
        }`}
      >
        <div className="space-y-4">
          {/* 1. Cabecera del Menú + Selector Modo Claro / Oscuro */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-current/10">
            <BrandLogo
              variant={lightMode ? "pill-light" : "night-cobrand"}
              size="md"
              onSecretAdminTrigger={() => {
                onClose();
                if (onSecretAdminTrigger) onSecretAdminTrigger();
              }}
            />

            <div className="flex items-center gap-1.5">
              {/* Conmutador Sol / Luna */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  if (onToggleLightMode) onToggleLightMode();
                }}
                title={lightMode ? "Cambiar a Modo Noche" : "Cambiar a Modo Claro"}
                className={`px-2.5 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 mp-btn-tactile ${
                  lightMode
                    ? "bg-[#1E0734] text-[#00DC7D] border-[#1E0734]"
                    : "bg-white/10 text-[#00DC7D] border-white/20"
                }`}
              >
                <WtaIcon name={lightMode ? "moon" : "sun"} size={14} />
                <span>{lightMode ? "Noche" : "Claro"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center mp-close-btn"
              >
                <WtaIcon name="close" size={16} />
              </button>
            </div>
          </div>

          {/* 2. Tarjeta de Jugador Activo + Botón de Acceso / Registro */}
          {currentUser && (
            <div
              className={`p-3.5 rounded-3xl border space-y-2.5 ${
                lightMode
                  ? "bg-white border-[#1E0734]/12 shadow-sm"
                  : "bg-[#290C46] border-white/15 shadow-lg"
              }`}
            >
              <div className="flex items-center gap-3">
                <SmartImage
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  isAvatar
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-[#00DC7D] shrink-0"
                />
                <div className="min-w-0">
                  <span className="px-2 py-0.2 rounded bg-[#00DC7D] text-[#1E0734] text-[9px] font-wta-display font-black uppercase">
                    #{currentUser.rank} · {catObj.name}
                  </span>
                  <div className="font-wta-condensed text-xl font-bold uppercase truncate mt-0.5">
                    {currentUser.name}
                  </div>
                  <span className="text-[11px] opacity-70 block truncate">
                    {currentUser.elo} pts · {currentUser.gems || 0} Gemas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    onClose();
                    if (onOpenAuthPortal) onOpenAuthPortal("login");
                  }}
                  className="py-2 px-2.5 rounded-xl bg-[#00DC7D] text-[#1E0734] text-[11px] font-wta-display font-extrabold mp-btn-tactile"
                >
                  Cambiar cuenta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("tab");
                    onClose();
                    if (onOpenAuthPortal) onOpenAuthPortal("register");
                  }}
                  className="py-2 px-2.5 rounded-xl bg-current/10 border border-current/15 text-[11px] font-wta-display font-extrabold mp-btn-tactile"
                >
                  Crear cuenta
                </button>
              </div>
            </div>
          )}

          {/* 3. Herramientas Oficiales del Circuito */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-wta-display font-black uppercase tracking-widest text-[#00DC7D] px-1 block">
              HERRAMIENTAS DEL CIRCUITO
            </span>

            {[
              {
                label: "Carnet Digital Socio VIP 3D",
                badge: currentUser?.isVip ? "Activo" : "S/ 29.90",
                icon: "crown",
                onClick: () => {
                  onClose();
                  if (onOpenVipCardModal) onOpenVipCardModal();
                },
              },
              {
                label: "Tienda Oficial Pro Shop & Gemas",
                badge: `${currentUser?.gems || 0} 💎`,
                icon: "bag",
                onClick: () => {
                  onClose();
                  if (onOpenProShopModal) onOpenProShopModal();
                },
              },
              {
                label: "Comparador Head to Head",
                badge: "VS",
                icon: "h2h",
                onClick: () => {
                  onClose();
                  if (onOpenH2HModal) onOpenH2HModal();
                },
              },
              {
                label: "Estudio Póster Story 9:16",
                badge: "IG / WA",
                icon: "share",
                onClick: () => {
                  onClose();
                  if (onOpenStoryPosterModal) onOpenStoryPosterModal();
                },
              },
              {
                label: "MatchPoint Vision IA (Video)",
                badge: "60 FPS",
                icon: "video",
                onClick: () => {
                  onClose();
                  if (onOpenVisionIaModal) onOpenVisionIaModal();
                },
              },
              {
                label: "Guía Visual de Puntos y Categorías",
                badge: "Reglas",
                icon: "trophy",
                onClick: () => {
                  onClose();
                  if (onOpenVisualRulesModal) onOpenVisualRulesModal();
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  item.onClick();
                }}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 mp-btn-tactile ${
                  lightMode
                    ? "bg-white border-[#1E0734]/10 hover:border-[#00DC7D]"
                    : "bg-white/6 border-white/10 hover:border-[#00DC7D]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#00DC7D]/15 text-[#00DC7D] flex items-center justify-center shrink-0">
                    <WtaIcon name={item.icon} size={16} />
                  </div>
                  <span className="text-xs font-extrabold truncate">
                    {item.label}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[#00DC7D]/20 text-[#00DC7D] text-[10px] font-extrabold shrink-0">
                  {item.badge}
                </span>
              </button>
            ))}
          </div>

          {/* ================================================================
              4. SECCIÓN OBLIGATORIA: "INFORMACIÓN LEGAL" (NORMATIVA PERÚ)
                 - Botón 1: Libro de Reclamaciones Virtual (Indecopi).
                 - Botón 2: Términos y Condiciones.
                 - Botón 3: Política de Privacidad (Ley N° 29733).
              ================================================================ */}
          <div className="pt-2 border-t border-current/10 space-y-1.5">
            <span className="text-[10px] font-wta-display font-black uppercase tracking-widest text-[#F59E0B] px-1 block">
              INFORMACIÓN LEGAL (PERÚ)
            </span>

            {/* Botón 1 — Libro de Reclamaciones Virtual (Obligatorio por Indecopi) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("hero");
                onClose();
                if (onOpenClaimsBookModal) onOpenClaimsBookModal();
              }}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#00A859]/20 to-[#00DC7D]/10 border-2 border-[#00DC7D]/60 text-left flex items-center justify-between gap-2.5 mp-btn-tactile"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#00DC7D] text-[#1E0734] flex items-center justify-center shrink-0 shadow-sm">
                  <WtaIcon name="reclamaciones" size={18} strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold leading-tight">
                    Libro de Reclamaciones Virtual
                  </div>
                  <span className="text-[10px] text-[#00DC7D] font-bold block">
                    Hoja oficial conforme a Indecopi
                  </span>
                </div>
              </div>
              <WtaIcon
                name="chevron-right"
                size={15}
                className="text-[#00DC7D] shrink-0"
              />
            </button>

            {/* Botón 2 — Términos y Condiciones */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                onClose();
                if (onOpenLegalDocModal) onOpenLegalDocModal("terms");
              }}
              className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 mp-btn-tactile ${
                lightMode
                  ? "bg-white border-[#1E0734]/10"
                  : "bg-white/6 border-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <WtaIcon name="shield" size={16} className="text-[#00DC7D]" />
                <span className="text-xs font-extrabold">
                  Términos y Condiciones
                </span>
              </div>
              <WtaIcon name="chevron-right" size={14} className="opacity-65" />
            </button>

            {/* Botón 3 — Política de Privacidad (Ley N° 29733) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                onClose();
                if (onOpenLegalDocModal) onOpenLegalDocModal("privacy");
              }}
              className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 mp-btn-tactile ${
                lightMode
                  ? "bg-white border-[#1E0734]/10"
                  : "bg-white/6 border-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <WtaIcon name="lock" size={16} className="text-[#00DC7D]" />
                <span className="text-xs font-extrabold">
                  Política de Privacidad (Ley N° 29733)
                </span>
              </div>
              <WtaIcon name="chevron-right" size={14} className="opacity-65" />
            </button>
          </div>
        </div>

        {/* 5. Pie de Página (Footer) con Aviso de Marca Exacto */}
        <div className="pt-4 mt-4 border-t border-current/10 text-center space-y-1">
          <p className="text-[11px] font-extrabold opacity-80">
            © 2026 MATCHPOINT. Todos los derechos reservados.
          </p>
          <button
            type="button"
            onClick={handleVersionTap}
            className="text-[10px] opacity-55 hover:opacity-90 font-semibold"
          >
            Huancayo, Región Junín · v2.5.0
          </button>
        </div>
      </aside>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 8. BARRA INSTITUCIONAL DE LAS 6 REDES SOCIALES Y LINKS LEGALES EN EL FOOTER
//    DEL SCROLL (<WtaInstitutionalFooterBar/> — RONDAS 27 Y 28)
// ----------------------------------------------------------------------------
export function WtaInstitutionalFooterBar({
  lightMode = false,
  onOpenClaimsBookModal,
  onOpenLegalDocModal,
}) {
  const socialItems = [
    {
      id: "ig",
      name: "Instagram",
      icon: "instagram",
      href: CIRCUIT_CONFIG.socialLinks.instagram,
    },
    {
      id: "tt",
      name: "TikTok",
      icon: "tiktok",
      href: CIRCUIT_CONFIG.socialLinks.tiktok,
    },
    {
      id: "fb",
      name: "Facebook",
      icon: "facebook",
      href: CIRCUIT_CONFIG.socialLinks.facebook,
    },
    {
      id: "yt",
      name: "YouTube",
      icon: "youtube",
      href: CIRCUIT_CONFIG.socialLinks.youtube,
    },
    {
      id: "x",
      name: "X",
      icon: "x-social",
      href: CIRCUIT_CONFIG.socialLinks.x,
    },
    {
      id: "wa",
      name: "WhatsApp",
      icon: "whatsapp",
      href: CIRCUIT_CONFIG.socialLinks.whatsapp,
    },
  ];

  return (
    <footer className="px-3.5 sm:px-5 pt-2 pb-6 space-y-3">
      {/* Píldora Blanca con los 6 Botones Circulares de Redes Sociales */}
      <div className="p-3.5 rounded-3xl bg-white text-[#1E0734] shadow-md border border-[#1E0734]/10 flex flex-wrap items-center justify-between gap-3">
        <BrandLogo variant="pill-light" size="sm" />

        <div className="flex items-center gap-2">
          {socialItems.map((soc) => (
            <a
              key={soc.id}
              href={soc.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={soc.name}
              onClick={() => triggerHaptic("tab")}
              className="w-9 h-9 rounded-full bg-[#1E0734] text-white hover:text-[#00DC7D] hover:border-[#00DC7D] border border-transparent flex items-center justify-center shadow-sm transition-all mp-btn-tactile"
            >
              <WtaIcon name={soc.icon} size={16} />
            </a>
          ))}
        </div>
      </div>

      {/* Accesos Directos a Información Legal + Copyright Oficial */}
      <div
        className={`p-3.5 rounded-2xl border text-center space-y-2 text-xs ${
          lightMode
            ? "bg-white border-[#1E0734]/10 text-[#1E0734]"
            : "bg-[#23083C]/80 border-white/10 text-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-center gap-3 font-extrabold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              if (onOpenClaimsBookModal) onOpenClaimsBookModal();
            }}
            className="text-[#00DC7D] hover:underline flex items-center gap-1"
          >
            <WtaIcon name="reclamaciones" size={14} />
            <span>Libro de Reclamaciones Virtual</span>
          </button>
          <span className="opacity-30">|</span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              if (onOpenLegalDocModal) onOpenLegalDocModal("terms");
            }}
            className="hover:text-[#00DC7D] underline"
          >
            Términos y Condiciones
          </button>
          <span className="opacity-30">|</span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("tab");
              if (onOpenLegalDocModal) onOpenLegalDocModal("privacy");
            }}
            className="hover:text-[#00DC7D] underline"
          >
            Política de Privacidad
          </button>
        </div>

        <p className="text-[11px] opacity-70 font-semibold">
          © 2026 MATCHPOINT. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

// ----------------------------------------------------------------------------
// 9. BARRA DE NAVEGACIÓN INFERIOR CON CÁPSULA MAGNÉTICA Y HALO ESMERALDA
//    (<BottomNavigationDock/>)
//    - Anclada al fondo respetando env(safe-area-inset-bottom) en iPhone.
//    - 5 pestañas principales con tus iconos 3D de public/assets/ + onda
//      concéntrica si hay un reto entrante pendiente.
// ----------------------------------------------------------------------------
export function BottomNavigationDock({
  activeTab = "retos",
  onChangeTab,
  pendingChallengesCount = 0,
  lightMode = false,
}) {
  const navItems = [
    {
      id: "retos",
      label: "Retos",
      asset: ASSETS.navRetos,
      fallbackIcon: "swords",
      badgeCount: pendingChallengesCount,
    },
    {
      id: "ranking",
      label: "Ranking",
      asset: ASSETS.navRanking,
      fallbackIcon: "ranking",
      badgeCount: 0,
    },
    {
      id: "torneos",
      label: "Torneos",
      asset: ASSETS.navTorneos,
      fallbackIcon: "trophy",
      badgeCount: 0,
    },
    {
      id: "sedes",
      label: "Sedes",
      asset: ASSETS.navSedes,
      fallbackIcon: "court",
      badgeCount: 0,
    },
    {
      id: "perfil",
      label: "Mi Perfil",
      asset: ASSETS.navPerfil,
      fallbackIcon: "user",
      badgeCount: 0,
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 6px) + 6px)",
      }}
      className={`fixed bottom-0 left-0 right-0 z-40 px-3 pt-2 border-t backdrop-blur-2xl transition-colors ${
        lightMode
          ? "bg-white/95 border-[#1E0734]/12 text-[#1E0734] shadow-[0_-8px_28px_rgba(30,7,52,0.12)]"
          : "bg-[#160428]/95 border-white/12 text-white shadow-[0_-10px_34px_rgba(0,0,0,0.6)]"
      }`}
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const hasAlert = item.badgeCount > 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                triggerHaptic("tab");
                if (onChangeTab) onChangeTab(item.id);
              }}
              className={`relative py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 mp-btn-tactile ${
                isActive
                  ? lightMode
                    ? "bg-[#1E0734] text-[#00DC7D] shadow-md scale-[1.03]"
                    : "bg-[#00DC7D]/18 text-[#00DC7D] border border-[#00DC7D]/55 shadow-[0_0_16px_rgba(0,220,125,0.28)] scale-[1.03]"
                  : "opacity-75 hover:opacity-100"
              }`}
            >
              <div
                className={`relative w-7 h-7 flex items-center justify-center rounded-xl ${
                  hasAlert ? "mp-challenge-ripple" : ""
                }`}
              >
                <SmartImage
                  src={item.asset}
                  alt={item.label}
                  className="w-6 h-6 object-contain"
                />

                {hasAlert && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#00DC7D] text-[#1E0734] text-[9px] font-wta-display font-black flex items-center justify-center border border-[#1E0734]">
                    {item.badgeCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-wta-display tracking-tight mt-0.5 ${
                  isActive ? "font-black" : "font-bold"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// === FIN DEL BLOQUE 13 DE 14 ===

// ============================================================================
// PARTE 14 DE 14: SUITE DE ADMINISTRADOR CMS OCULTA DE 7 PESTAÑAS (5 TOQUES EN
// EL LOGO + PIN 1234: APROBACIÓN DE PAGOS YAPE/PLIN, TENISTAS/ELO/GEMAS,
// TORNEOS, SEDES, COACH/TIENDA, ALERTA 80% MEMORIA + CSV Y PATROCINADORES) +
// COMPONENTE MAESTRO PRINCIPAL export default function App()
// ============================================================================

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    tag: "COMUNICADO OFICIAL",
    date: "16 Nov 2026",
    title: "Abierto Valle del Mantaro en etapa de Cuartos de Final",
    body: "Los partidos de cuartos y semifinales se disputan este fin de semana en las canchas de arcilla del Country Club Los Huancas.",
  },
  {
    id: "ann-2",
    tag: "CARRERA ANUAL",
    date: "14 Nov 2026",
    title: "Clasificación al Torneo de Maestros (Master Top 8 Finals)",
    body: "Recuerda que los 8 mejores tenistas del Ranking General y de la división +40 Master clasifican directo a la gran definición de diciembre.",
  },
];

// ----------------------------------------------------------------------------
// 1. SUITE DE ADMINISTRADOR CMS OCULTA DE 7 PESTAÑAS (<HiddenAdminSuiteModal/>)
//    Acceso exclusivo mediante 5 toques en el logotipo + PIN 1234 (o ingresando
//    como admin@matchpoint.pe en el Login). Jamás aparece en botones públicos.
// ----------------------------------------------------------------------------
export function HiddenAdminSuiteModal({
  isOpen,
  onClose,
  players = [],
  setPlayers,
  challenges = [],
  setChallenges,
  matches = [],
  setMatches,
  sedes = [],
  setSedes,
  coaches = [],
  setCoaches,
  tournaments = [],
  setTournaments,
  proShopItems = [],
  setProShopItems,
  sponsors = INITIAL_SPONSORS,
  setSponsors,
  paymentVerifications = [],
  onApprovePaymentVerification,
  onRejectPaymentVerification,
  claimsHistory = [],
  onMarkClaimResolved,
  announcements = [],
  onPublishAnnouncement,
  lightMode = false,
}) {
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [adminTab, setAdminTab] = useState("pagos"); // 'pagos' | 'tenistas' | 'torneos' | 'sedes' | 'tienda' | 'sistema' | 'sponsors'
  const [adminToast, setAdminToast] = useState("");

  // Estados para crear un nuevo jugador desde el padrón
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerElo, setNewPlayerElo] = useState(1400);
  const [newPlayerAge, setNewPlayerAge] = useState(28);
  const [newPlayerClub, setNewPlayerClub] = useState("Country Club Los Huancas");
  const [newPlayerPhone, setNewPlayerPhone] = useState("51999888777");

  // Estados para crear un nuevo torneo
  const [newTrnName, setNewTrnName] = useState("");
  const [newTrnDates, setNewTrnDates] = useState("10 – 14 DIC 2026");
  const [newTrnFee, setNewTrnFee] = useState(60);
  const [newTrnClub, setNewTrnClub] = useState("Country Club Los Huancas");

  // Estados para publicar un comunicado oficial
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPinInput("");
      setPinError("");
      setAdminToast("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showQuickNotice = (msg) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(""), 3200);
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === CIRCUIT_CONFIG.adminSecretPin) {
      triggerHaptic("success");
      setPinVerified(true);
      setPinError("");
    } else {
      triggerHaptic("light");
      setPinError("PIN de Comité incorrecto. Intenta nuevamente.");
    }
  };

  const storageStatus = evaluateStorageUsage(matches, challenges, claimsHistory);
  const pendingPaymentsCount = paymentVerifications.filter(
    (pv) => pv.status === "pending_verification"
  ).length;

  // Ajuste rápido de puntos o gemas de un tenista
  const adjustPlayerMetric = (playerId, field, delta) => {
    triggerHaptic("tab");
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const nextVal = Math.max(
          field === "elo" ? 100 : 0,
          Number(p[field] || 0) + delta
        );
        return { ...p, [field]: nextVal };
      })
    );
    showQuickNotice("Registro del tenista actualizado en vivo.");
  };

  const togglePlayerVipStatus = (playerId) => {
    triggerHaptic("success");
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const nextVip = !p.isVip;
        return {
          ...p,
          isVip: nextVip,
          gems: nextVip ? Number(p.gems || 0) + 150 : p.gems,
        };
      })
    );
    showQuickNotice("Estado Socio VIP actualizado.");
  };

  const handleAdminCreatePlayer = (e) => {
    e.preventDefault();
    if (newPlayerName.trim().length < 3) return;
    triggerHaptic("success");
    const parts = newPlayerName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "Huancayo";
    const chosenSede = sedes.find((s) => s.name === newPlayerClub);

    const created = {
      id: `p-admin-${Date.now()}`,
      name: newPlayerName.trim(),
      firstName,
      lastName,
      elo: Number(newPlayerElo) || 1200,
      bestRank: players.length + 1,
      rank: players.length + 1,
      age: Number(newPlayerAge) || 28,
      height: "1.76 m",
      city: "Huancayo",
      club: newPlayerClub,
      clubLogo: chosenSede?.logoAsset || ASSETS.clubCountry,
      individualMode: false,
      hand: "Diestro",
      backhand: "Revés a dos manos",
      bestShot: "Derecha con topspin",
      availability: "Tardes y fines de semana",
      wins: 0,
      losses: 0,
      streak: 0,
      titles: 0,
      matchesPlayed: 0,
      gems: 20,
      isVip: false,
      vipCode: `MP-2026-${String(players.length + 1).padStart(4, "0")}`,
      whatsapp: newPlayerPhone.replace(/\D/g, "") || "51999888777",
      whatsappPrivacy: "rivals_only",
      email: `${firstName.toLowerCase()}@matchpoint.pe`,
      surfaceThemeId: "finals",
      unlockedThemes: ["finals"],
      activeBadgeId: "",
      unlockedBadges: [],
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      heroPhoto: ASSETS.perfilBgFinals,
      cutoutAvatar: "",
      photoFrame: { zoom: 1, offsetX: 0, offsetY: 0, angle: 0 },
      gender: "M",
      hasCompletedTest: true,
    };

    setPlayers((prev) => [...prev, created]);
    setNewPlayerName("");
    showQuickNotice(`Tenista ${created.name} incorporado al padrón oficial.`);
  };

  const handleAdminCreateTournament = (e) => {
    e.preventDefault();
    if (newTrnName.trim().length < 3) return;
    triggerHaptic("success");
    const chosenSede = sedes.find((s) => s.name === newTrnClub);

    const newTrn = {
      id: `torneo-${Date.now()}`,
      name: newTrnName.trim(),
      shortTitle: newTrnName.trim().toUpperCase(),
      city: "HUANCAYO",
      club: newTrnClub,
      clubLogo: chosenSede?.logoAsset || ASSETS.clubCountry,
      surface: "ARCILLA",
      status: "upcoming",
      statusLabel: "INSCRIPCIONES ABIERTAS",
      datesLabel: newTrnDates.toUpperCase(),
      entryFeeSoles: Number(newTrnFee) || 60,
      vipEntryFeeSoles: Math.max(35, (Number(newTrnFee) || 60) - 10),
      championGemsReward: 400,
      finalistGemsReward: 200,
      prizePoolText: "Trofeos Oficiales + Premios Pro Shop + 400 Gemas al Campeón",
      categories: ["3ª y 4ª Categoría", "5ª Categoría", "+40 Master"],
      coverAsset: ASSETS.torneoApertura,
      spotsTotal: 16,
      spotsTaken: 4,
      registeredPlayerIds: ["p-mateo", "p-pablo"],
      bracket: {
        quarters: [],
        semis: [],
        final: null,
        consolationSemis: [],
        consolationFinal: null,
      },
    };

    setTournaments((prev) => [newTrn, ...prev]);
    setNewTrnName("");
    showQuickNotice(`Torneo "${newTrn.name}" publicado en el carrusel.`);
  };

  return (
    <WtaModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Suite de Control del Comité (CMS)"
      subtitle="Administración integral de pagos Yape/Plin, tenistas, torneos, sedes, tienda, memoria y patrocinadores."
      badgeText="PANEL PRIVADO DEL ORGANIZADOR"
      iconName="settings"
      lightMode={lightMode}
      maxWidthClass="max-w-3xl"
    >
      {!pinVerified ? (
        <form
          onSubmit={handlePinSubmit}
          className="p-5 rounded-3xl bg-[#1E0734] border border-[#00DC7D]/45 text-white text-center space-y-4 max-w-sm mx-auto my-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#00DC7D]/20 text-[#00DC7D] border border-[#00DC7D]/50 flex items-center justify-center mx-auto">
            <WtaIcon name="lock" size={22} />
          </div>

          <div>
            <h4 className="font-wta-condensed text-2xl font-bold uppercase text-white">
              INGRESA EL PIN MAESTRO DEL COMITÉ
            </h4>
            <p className="text-xs text-white/70 mt-1">
              Acceso restringido a los administradores de MATCHPOINT Huancayo.
            </p>
          </div>

          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="PIN de 4 dígitos (1234)"
            className="w-full py-3 px-4 rounded-2xl bg-[#290C46] border border-[#00DC7D]/50 text-center font-wta-condensed text-2xl tracking-widest text-[#00DC7D] mp-input-alive"
          />

          {pinError && (
            <div className="text-xs font-bold text-rose-400">{pinError}</div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl mp-btn-emerald font-wta-display font-extrabold text-xs sm:text-sm"
          >
            Desbloquear Suite CMS
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Alerta automática si la memoria supera el 75% / 80% */}
          {storageStatus.isWarningZone && (
            <div className="p-3.5 rounded-2xl bg-[#F59E0B]/20 border-2 border-[#F59E0B] text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="font-extrabold text-[#F59E0B] block">
                  Aviso Preventivo de Capacidad ({storageStatus.usagePercent}% ocupado):
                </strong>
                <span>
                  Te recomendamos descargar el respaldo en Excel/CSV desde la
                  pestaña 6 para liberar espacio histórico.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAdminTab("sistema")}
                className="px-3 py-1.5 rounded-xl bg-[#F59E0B] text-[#1E0734] font-extrabold shrink-0"
              >
                Ir a Respaldo CSV ➔
              </button>
            </div>
          )}

          {adminToast && (
            <div className="p-3 rounded-2xl bg-[#00DC7D]/20 border border-[#00DC7D] text-[#00DC7D] text-xs font-extrabold text-center">
              ✓ {adminToast}
            </div>
          )}

          {/* Barra de las 7 Pestañas de la Suite Admin CMS */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              {
                id: "pagos",
                label: `1. Pagos y Reclamos (${pendingPaymentsCount})`,
              },
              { id: "tenistas", label: `2. Tenistas (${players.length})` },
              { id: "torneos", label: "3. Torneos y Llaves" },
              { id: "sedes", label: "4. Sedes y Clima" },
              { id: "tienda", label: "5. Coach & Pro Shop" },
              { id: "sistema", label: "6. Avisos y Memoria CSV" },
              { id: "sponsors", label: "7. Patrocinadores" },
            ].map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => {
                  triggerHaptic("tab");
                  setAdminTab(tb.id);
                }}
                className={`px-3.5 py-2 rounded-full text-xs font-wta-display font-extrabold shrink-0 wta-pill-tab ${
                  adminTab === tb.id
                    ? "wta-pill-tab-active"
                    : "wta-pill-tab-inactive"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* ================================================================
              PESTAÑA 1: APROBACIÓN MANUAL DE PAGOS YAPE/PLIN & RECLAMOS INDECOPI
              ================================================================ */}
          {adminTab === "pagos" && (
            <div className="space-y-4 mp-view-enter">
              <div className="space-y-2.5">
                <h4 className="font-wta-condensed text-lg font-bold uppercase text-[#00DC7D]">
                  SOLICITUDES DE PAGO DIRECTO (YAPE / PLIN) EN VERIFICACIÓN
                </h4>

                {paymentVerifications.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs opacity-75">
                    No hay pagos pendientes de verificación en este momento.
                  </div>
                ) : (
                  paymentVerifications.map((pv) => (
                    <div
                      key={pv.id}
                      className="p-3.5 rounded-2xl bg-[#1E0734] border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              pv.status === "approved"
                                ? "bg-[#00DC7D] text-[#1E0734]"
                                : pv.status === "rejected"
                                ? "bg-rose-500/30 text-rose-200"
                                : "bg-[#F59E0B] text-[#1E0734]"
                            }`}
                          >
                            {pv.status === "approved"
                              ? "APROBADO Y ACTIVO"
                              : pv.status === "rejected"
                              ? "RECHAZADO"
                              : "PAGO EN VERIFICACIÓN"}
                          </span>
                          <span className="font-extrabold text-[#6EF2B5]">
                            {pv.ticketCode || pv.id}
                          </span>
                          <span className="opacity-65">· {pv.createdAt}</span>
                        </div>

                        <div className="text-sm font-extrabold">
                          {pv.playerName} — {pv.conceptTitle}
                        </div>

                        <div className="text-white/75">
                          Canal: <strong>{pv.channel}</strong> · Monto:{" "}
                          <strong className="text-[#00DC7D]">
                            S/ {Number(pv.amountSoles).toFixed(2)}
                          </strong>{" "}
                          · Operación: <strong>{pv.operationCode}</strong>
                        </div>
                      </div>

                      {pv.status === "pending_verification" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic("success");
                              if (onApprovePaymentVerification) {
                                onApprovePaymentVerification(pv);
                              }
                              showQuickNotice(
                                `Pago de ${pv.playerName} aprobado y servicio activado.`
                              );
                            }}
                            className="px-3.5 py-2 rounded-xl mp-btn-emerald font-extrabold text-xs"
                          >
                            Aprobar y Activar ✓
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic("light");
                              if (onRejectPaymentVerification) {
                                onRejectPaymentVerification(pv.id);
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/40 font-bold text-xs"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Registro del Libro de Reclamaciones Virtual (Indecopi) */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <h4 className="font-wta-condensed text-lg font-bold uppercase text-[#F59E0B]">
                  HOJAS DEL LIBRO DE RECLAMACIONES VIRTUAL ({claimsHistory.length})
                </h4>

                {claimsHistory.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs opacity-75">
                    Sin hojas de reclamación registradas.
                  </div>
                ) : (
                  claimsHistory.map((cl) => (
                    <div
                      key={cl.id}
                      className="p-3.5 rounded-2xl bg-[#1E0734] border border-white/15 space-y-1.5 text-xs text-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-[#F59E0B] text-[#1E0734] font-black text-[10px]">
                          {cl.code} · {cl.type.toUpperCase()}
                        </span>
                        <span className="opacity-70">{cl.createdAt}</span>
                      </div>
                      <div className="font-extrabold">
                        {cl.fullName} (DNI/CE: {cl.documentId}) · {cl.phone} ·{" "}
                        {cl.email}
                      </div>
                      <p className="text-white/80 leading-relaxed">{cl.detail}</p>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] text-[#00DC7D] font-bold">
                          Estado: {cl.status === "atendido" ? "Atendido ✓" : "Recibido"}
                        </span>
                        {cl.status !== "atendido" && onMarkClaimResolved && (
                          <button
                            type="button"
                            onClick={() => {
                              onMarkClaimResolved(cl.id);
                              showQuickNotice(`Hoja ${cl.code} marcada como atendida.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#00DC7D] text-[#1E0734] font-extrabold text-[11px]"
                          >
                            Marcar atendido
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              PESTAÑA 2: PADRÓN DE TENISTAS, PUNTOS ELO, GEMAS Y NUEVO JUGADOR
              ================================================================ */}
          {adminTab === "tenistas" && (
            <div className="space-y-4 mp-view-enter">
              {/* Formulario para incorporar un nuevo tenista */}
              <form
                onSubmit={handleAdminCreatePlayer}
                className="p-4 rounded-2xl bg-[#1E0734] border border-[#00DC7D]/40 space-y-3 text-xs text-white"
              >
                <span className="font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
                  AGREGAR NUEVO TENISTA AL PADRÓN OFICIAL
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Nombre y Apellido"
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                  />
                  <input
                    type="number"
                    value={newPlayerElo}
                    onChange={(e) => setNewPlayerElo(e.target.value)}
                    placeholder="Puntos ELO"
                    className="px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                  />
                  <input
                    type="number"
                    value={newPlayerAge}
                    onChange={(e) => setNewPlayerAge(e.target.value)}
                    placeholder="Edad (+18)"
                    className="px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newPlayerClub}
                    onChange={(e) => setNewPlayerClub(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                  >
                    {sedes.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl mp-btn-emerald font-extrabold text-xs"
                  >
                    + Incorporar Tenista
                  </button>
                </div>
              </form>

              {/* Lista de Tenistas con Controles Directos de ELO, Gemas y VIP */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-[#1E0734] border border-white/12 flex flex-wrap items-center justify-between gap-2 text-xs text-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SmartImage
                        src={p.avatar}
                        alt={p.name}
                        isAvatar
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold truncate">{p.name}</div>
                        <div className="text-[11px] text-[#6EF2B5]">
                          {p.elo} pts · {p.gems || 0} 💎 ·{" "}
                          {p.isVip ? "Socio VIP" : "Gratis"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => adjustPlayerMetric(p.id, "elo", 25)}
                        className="px-2 py-1 rounded-lg bg-[#00DC7D]/20 text-[#00DC7D] font-extrabold text-[11px]"
                      >
                        +25 Pts
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustPlayerMetric(p.id, "elo", -25)}
                        className="px-2 py-1 rounded-lg bg-white/10 text-white font-bold text-[11px]"
                      >
                        -25 Pts
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustPlayerMetric(p.id, "gems", 50)}
                        className="px-2 py-1 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] font-extrabold text-[11px]"
                      >
                        +50 💎
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePlayerVipStatus(p.id)}
                        className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] ${
                          p.isVip
                            ? "bg-[#F59E0B] text-[#1E0734]"
                            : "bg-white/10 text-white/80"
                        }`}
                      >
                        {p.isVip ? "VIP Activo" : "Dar VIP"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
              PESTAÑA 3: CREACIÓN Y CONTROL DE TORNEOS OFICIALES
              ================================================================ */}
          {adminTab === "torneos" && (
            <div className="space-y-4 mp-view-enter">
              <form
                onSubmit={handleAdminCreateTournament}
                className="p-4 rounded-2xl bg-[#1E0734] border border-[#00DC7D]/40 space-y-3 text-xs text-white"
              >
                <span className="font-wta-display font-extrabold uppercase tracking-wider text-[#00DC7D] block">
                  PUBLICAR NUEVO TORNEO EN EL CARRUSEL
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={newTrnName}
                    onChange={(e) => setNewTrnName(e.target.value)}
                    placeholder="Nombre del Torneo"
                    className="px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                  />
                  <input
                    type="text"
                    value={newTrnDates}
                    onChange={(e) => setNewTrnDates(e.target.value)}
                    placeholder="Fechas (ej. 10 - 14 DIC)"
                    className="px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                  />
                  <input
                    type="number"
                    value={newTrnFee}
                    onChange={(e) => setNewTrnFee(e.target.value)}
                    placeholder="Inscripción S/"
                    className="px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl mp-btn-emerald font-extrabold text-xs"
                >
                  + Publicar Torneo Oficial
                </button>
              </form>

              <div className="space-y-2">
                {tournaments.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-[#1E0734] border border-white/15 flex items-center justify-between gap-2 text-xs text-white"
                  >
                    <div>
                      <div className="font-extrabold">{t.name}</div>
                      <div className="text-[11px] text-[#6EF2B5]">
                        {t.datesLabel} · S/ {t.entryFeeSoles} · {t.statusLabel}
                      </div>
                    </div>

                    <select
                      value={t.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value;
                        const labelMap = {
                          upcoming: "INSCRIPCIONES ABIERTAS",
                          in_progress: "EN CURSO · CUADRO ACTIVO",
                          finals_race: "CLASIFICACIÓN TOP 8 EN VIVO",
                        };
                        setTournaments((prev) =>
                          prev.map((item) =>
                            item.id === t.id
                              ? {
                                  ...item,
                                  status: nextStatus,
                                  statusLabel: labelMap[nextStatus],
                                }
                              : item
                          )
                        );
                        showQuickNotice("Estado del torneo actualizado.");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#290C46] border border-[#00DC7D]/50 text-[#00DC7D] font-bold text-xs"
                    >
                      <option value="upcoming">Inscripciones Abiertas</option>
                      <option value="in_progress">En Curso</option>
                      <option value="finals_race">Carrera Top 8</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
              PESTAÑA 4: SEDES, TARIFAS Y ESTADO CLIMÁTICO EN CANCHA
              ================================================================ */}
          {adminTab === "sedes" && (
            <div className="space-y-3 mp-view-enter">
              {sedes.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-[#1E0734] border border-white/15 space-y-2.5 text-xs text-white"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-extrabold text-[#00DC7D]">
                      {s.name}
                    </strong>
                    <select
                      value={s.weatherState}
                      onChange={(e) => {
                        const nextW = e.target.value;
                        setSedes((prev) =>
                          prev.map((item) =>
                            item.id === s.id
                              ? {
                                  ...item,
                                  weatherState: nextW,
                                  lastWeatherReport: "Actualizado por Comité",
                                }
                              : item
                          )
                        );
                        showQuickNotice(`Clima en ${s.shortName} actualizado.`);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#290C46] border border-[#00DC7D]/50 text-[#00DC7D] font-bold"
                    >
                      <option value="seco">Cancha Seca</option>
                      <option value="humedad">Humedad Leve</option>
                      <option value="llovizna">En Secado / Llovizna</option>
                      <option value="lluvia">Cerrada por Lluvia</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] opacity-70 block">
                        Día (S/)
                      </span>
                      <input
                        type="number"
                        value={s.priceDaySoles}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSedes((prev) =>
                            prev.map((item) =>
                              item.id === s.id
                                ? { ...item, priceDaySoles: val }
                                : item
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#290C46] border border-white/20 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] opacity-70 block">
                        Noche LED (S/)
                      </span>
                      <input
                        type="number"
                        value={s.priceNightSoles}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSedes((prev) =>
                            prev.map((item) =>
                              item.id === s.id
                                ? { ...item, priceNightSoles: val }
                                : item
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#290C46] border border-white/20 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#F59E0B] font-bold block">
                        Tarifa VIP (S/)
                      </span>
                      <input
                        type="number"
                        value={s.priceVipSoles}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSedes((prev) =>
                            prev.map((item) =>
                              item.id === s.id
                                ? { ...item, priceVipSoles: val }
                                : item
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#290C46] border border-[#F59E0B]/50 text-[#F59E0B] font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================================================================
              PESTAÑA 5: TARIFAS DE ENTRENADORES Y PRECIOS PRO SHOP
              ================================================================ */}
          {adminTab === "tienda" && (
            <div className="space-y-3 mp-view-enter max-h-80 overflow-y-auto pr-1">
              <h4 className="font-wta-condensed text-base font-bold uppercase text-[#00DC7D]">
                AJUSTE EN VIVO DE PRECIOS PRO SHOP (GEMAS Y COPAGO EN SOLES)
              </h4>

              {proShopItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#1E0734] border border-white/15 grid grid-cols-1 sm:grid-cols-12 items-center gap-2 text-xs text-white"
                >
                  <div className="sm:col-span-6 font-extrabold truncate">
                    {item.name}
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <span className="text-[10px] opacity-70">Gemas:</span>
                    <input
                      type="number"
                      value={item.costGems}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProShopItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id ? { ...it, costGems: val } : it
                          )
                        );
                      }}
                      className="w-20 px-2 py-1 rounded-lg bg-[#290C46] border border-[#00DC7D]/40 text-[#00DC7D] font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <span className="text-[10px] opacity-70">Copago S/:</span>
                    <input
                      type="number"
                      value={item.copayCashSoles || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProShopItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id
                              ? { ...it, copayCashSoles: val }
                              : it
                          )
                        );
                      }}
                      className="w-16 px-2 py-1 rounded-lg bg-[#290C46] border border-white/20 text-white font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================================================================
              PESTAÑA 6: COMUNICADOS, TEMPORADA Y CONTROL DEL 80% DE MEMORIA CSV
              ================================================================ */}
          {adminTab === "sistema" && (
            <div className="space-y-4 mp-view-enter">
              {/* Monitor de Memoria y Exportación CSV */}
              <div className="p-4 rounded-2xl bg-[#1E0734] border border-[#00DC7D]/40 space-y-3 text-xs text-white">
                <div className="flex items-center justify-between">
                  <span className="font-wta-display font-extrabold uppercase text-[#00DC7D]">
                    CAPACIDAD DE REGISTROS Y RESPALDO HISTÓRICO EN EXCEL / CSV
                  </span>
                  <span className="font-extrabold text-[#F59E0B]">
                    {storageStatus.totalRecords} / {storageStatus.limit} registros (
                    {storageStatus.usagePercent}%)
                  </span>
                </div>

                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      storageStatus.isWarningZone
                        ? "bg-[#F59E0B]"
                        : "bg-[#00DC7D]"
                    }`}
                    style={{ width: `${storageStatus.usagePercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("success");
                      exportHistoricalDataToCSV({
                        matches,
                        players,
                        claims: claimsHistory,
                      });
                      showQuickNotice(
                        "Archivo CSV descargado correctamente en tu dispositivo."
                      );
                    }}
                    className="py-2.5 px-4 rounded-xl mp-btn-emerald font-extrabold text-xs flex items-center justify-center gap-1.5"
                  >
                    <WtaIcon name="download" size={15} />
                    <span>Descargar Histórico en CSV / Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("tab");
                      setMatches((prev) => prev.slice(0, 6));
                      setChallenges((prev) =>
                        prev.filter((c) => c.status !== "completed")
                      );
                      showQuickNotice(
                        "Memoria histórica depurada conservando intacto el Ranking."
                      );
                    }}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs"
                  >
                    Limpiar historial antiguo (Mantener Ranking)
                  </button>
                </div>
              </div>

              {/* Publicar Comunicado en el Boletín */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!annTitle.trim() || !annBody.trim()) return;
                  triggerHaptic("success");
                  if (onPublishAnnouncement) {
                    onPublishAnnouncement({
                      id: `ann-${Date.now()}`,
                      tag: "COMUNICADO DEL COMITÉ",
                      date: new Date().toLocaleDateString("es-PE"),
                      title: annTitle.trim(),
                      body: annBody.trim(),
                    });
                  }
                  setAnnTitle("");
                  setAnnBody("");
                  showQuickNotice("Comunicado oficial publicado en el Boletín.");
                }}
                className="p-4 rounded-2xl bg-[#1E0734] border border-white/15 space-y-2.5 text-xs text-white"
              >
                <span className="font-wta-display font-extrabold uppercase text-[#00DC7D] block">
                  PUBLICAR AVISO OFICIAL A LOS JUGADORES
                </span>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Título del comunicado..."
                  className="w-full px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                />
                <textarea
                  rows={2}
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  placeholder="Mensaje para todos los tenistas del circuito..."
                  className="w-full px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white"
                />
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl mp-btn-emerald font-extrabold text-xs"
                >
                  Publicar Aviso Oficial
                </button>
              </form>
            </div>
          )}

          {/* ================================================================
              PESTAÑA 7: PATROCINADORES Y AUSPICIADORES NATIVOS (MODELO WTA)
              ================================================================ */}
          {adminTab === "sponsors" && (
            <div className="space-y-3 mp-view-enter text-xs">
              <div className="p-4 rounded-2xl bg-[#1E0734] border border-[#00DC7D]/40 space-y-3 text-white">
                <span className="font-wta-display font-extrabold uppercase text-[#00DC7D] block">
                  1. PATROCINADOR PRINCIPAL (CO-BRANDING CABECERA Y STORIES 9:16)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={sponsors?.titleSponsor?.name || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSponsors((prev) => ({
                        ...prev,
                        titleSponsor: { ...prev.titleSponsor, name: val },
                      }));
                    }}
                    placeholder="Nombre de Marca Aliada"
                    className="px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                  />
                  <label className="flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(sponsors?.titleSponsor?.active)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSponsors((prev) => ({
                          ...prev,
                          titleSponsor: {
                            ...prev.titleSponsor,
                            active: checked,
                          },
                        }));
                      }}
                      className="w-4 h-4 accent-[#00DC7D]"
                    />
                    <span>Mostrar en Cabecera y Pósteres 9:16</span>
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1E0734] border border-white/15 space-y-3 text-white">
                <span className="font-wta-display font-extrabold uppercase text-[#00DC7D] block">
                  2. AUSPICIADOR DEL WIDGET DE RELOJ Y CLIMA EN VIVO
                </span>
                <input
                  type="text"
                  value={sponsors?.weatherSponsor?.name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSponsors((prev) => ({
                      ...prev,
                      weatherSponsor: { ...prev.weatherSponsor, name: val },
                    }));
                  }}
                  placeholder="Ej. Fisioterapia Mantaro / Clínica Deportiva"
                  className="w-full px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#1E0734] border border-white/15 space-y-3 text-white">
                <span className="font-wta-display font-extrabold uppercase text-[#00DC7D] block">
                  3. SORTEO MENSUAL DE JUGADORES ACTIVOS (PRO SHOP)
                </span>
                <input
                  type="text"
                  value={sponsors?.monthlyRaffleSponsor?.prizeTitle || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSponsors((prev) => ({
                      ...prev,
                      monthlyRaffleSponsor: {
                        ...prev.monthlyRaffleSponsor,
                        prizeTitle: val,
                      },
                    }));
                  }}
                  placeholder="Descripción del premio mensual..."
                  className="w-full px-3 py-2 rounded-xl bg-[#290C46] border border-white/20 text-white font-bold"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </WtaModalWrapper>
  );
}

// ----------------------------------------------------------------------------
// 2. COMPONENTE MAESTRO PRINCIPAL: export default function App()
//    Ensambla las 14 partes en una arquitectura cohesiva de una sola pieza,
//    con arranque inteligente en 2 caminos, persistencia real y diseño WTA.
// ----------------------------------------------------------------------------
export default function App() {
  // Calibrador silencioso de pantalla para celulares desde 2018 hasta 2026
  const viewportProfile = useMobileViewportEngine();
  const mainScrollRef = useRef(null);

  // Estados persistentes en localStorage + sincronización con Supabase
  const [hasCompletedOnboarding, setHasCompletedOnboarding] =
    usePersistentState("onboarding_done_v1", false);
  const [showSplashCurtain, setShowSplashCurtain] = useState(true);
  const [lightMode, setLightMode] = usePersistentState("light_mode_v1", false);
  const [activeTab, setActiveTab] = usePersistentState("active_tab_v1", "retos");

  const [players, setPlayers] = usePersistentState("players_v1", INITIAL_PLAYERS);
  const [currentUserId, setCurrentUserId] = usePersistentState(
    "current_user_id_v1",
    "p-pablo"
  );
  const [challenges, setChallenges] = usePersistentState(
    "challenges_v1",
    INITIAL_CHALLENGES
  );
  const [matches, setMatches] = usePersistentState("matches_v1", INITIAL_MATCHES);
  const [sedes, setSedes] = usePersistentState("sedes_v1", INITIAL_SEDES);
  const [coaches, setCoaches] = usePersistentState("coaches_v1", INITIAL_COACHES);
  const [tournaments, setTournaments] = usePersistentState(
    "tournaments_v1",
    INITIAL_TOURNAMENTS
  );
  const [proShopItems, setProShopItems] = usePersistentState(
    "proshop_v1",
    INITIAL_PROSHOP_ITEMS
  );
  const [sponsors, setSponsors] = usePersistentState(
    "sponsors_v1",
    INITIAL_SPONSORS
  );
  const [answeredTriviaIds, setAnsweredTriviaIds] = usePersistentState(
    "trivia_answered_v1",
    []
  );
  const [unlockedClassIds, setUnlockedClassIds] = usePersistentState(
    "unlocked_classes_v1",
    []
  );
  const [paymentVerifications, setPaymentVerifications] = usePersistentState(
    "payment_verifications_v1",
    []
  );
  const [claimsHistory, setClaimsHistory] = usePersistentState(
    "indecopi_claims_v1",
    []
  );
  const [announcements, setAnnouncements] = usePersistentState(
    "announcements_v1",
    INITIAL_ANNOUNCEMENTS
  );

  // Estados de Modales Enfrente de Pantalla (Blur iOS 22px)
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [selectedPublicPlayer, setSelectedPublicPlayer] = useState(null);
  const [launchChallengeTarget, setLaunchChallengeTarget] = useState(undefined); // undefined = cerrado, null = abierto libre, obj = rival preseleccionado
  const [incomingChallengeModalItem, setIncomingChallengeModalItem] =
    useState(null);
  const [counterProposalChallenge, setCounterProposalChallenge] =
    useState(null);
  const [liveUmpireChallenge, setLiveUmpireChallenge] = useState(null);
  const [h2hModalPair, setH2hModalPair] = useState(null); // { playerA, playerB } | null
  const [storyPosterData, setStoryPosterData] = useState(null);
  const [selectedTournamentModal, setSelectedTournamentModal] = useState(null);
  const [isMasterTop8ModalOpen, setIsMasterTop8ModalOpen] = useState(false);
  const [selectedSedeModal, setSelectedSedeModal] = useState(null);
  const [selectedCoachModal, setSelectedCoachModal] = useState(null);
  const [isVisionIaModalOpen, setIsVisionIaModalOpen] = useState(false);
  const [isVipCardModalOpen, setIsVipCardModalOpen] = useState(false);
  const [isProShopModalOpen, setIsProShopModalOpen] = useState(false);
  const [directPaymentRequest, setDirectPaymentRequest] = useState(null);
  const [authPortalMode, setAuthPortalMode] = useState(null); // 'login' | 'register' | 'recover' | null
  const [isCalibrationWizardOpen, setIsCalibrationWizardOpen] = useState(false);
  const [isVisualRulesOpen, setIsVisualRulesOpen] = useState(false);
  const [isClaimsBookOpen, setIsClaimsBookOpen] = useState(false);
  const [legalDocModalType, setLegalDocModalType] = useState(null); // 'terms' | 'privacy' | null
  const [weeklyTipVideoItem, setWeeklyTipVideoItem] = useState(null);
  const [isBulletinOpen, setIsBulletinOpen] = useState(false);
  const [isAdminSuiteOpen, setIsAdminSuiteOpen] = useState(false);
  const [celebrationRewardData, setCelebrationRewardData] = useState(null);

  // Calcula el ranking ordenado en vivo y obtiene al usuario actual
  const rankedPlayers = useMemo(() => {
    const sorted = [...players].sort(
      (a, b) => Number(b.elo || 0) - Number(a.elo || 0)
    );
    return sorted.map((p, idx) => ({
      ...p,
      rank: idx + 1,
      bestRank: Math.min(Number(p.bestRank || idx + 1), idx + 1),
    }));
  }, [players]);

  const currentUser = useMemo(
    () =>
      rankedPlayers.find((p) => p.id === currentUserId) ||
      rankedPlayers[2] ||
      rankedPlayers[0],
    [rankedPlayers, currentUserId]
  );

  const pendingForCurrentUserCount = useMemo(
    () =>
      challenges.filter(
        (c) => c.status === "pending" && c.challengedId === currentUser?.id
      ).length,
    [challenges, currentUser?.id]
  );

  // Al cambiar de pestaña principal, sube suavemente el scroll al inicio
  const handleChangeMainTab = useCallback(
    (nextTab) => {
      setActiveTab(nextTab);
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setActiveTab]
  );

  // Actualiza atributos del jugador activo
  const handleUpdateCurrentUser = useCallback(
    (updates) => {
      if (!currentUser) return;
      setPlayers((prev) =>
        prev.map((p) => (p.id === currentUser.id ? { ...p, ...updates } : p))
      );
    },
    [currentUser, setPlayers]
  );

  // Crea un nuevo reto en estado "pending"
  const handleCreateChallenge = useCallback(
    (payload) => {
      const newCh = {
        id: `ch-${Date.now()}`,
        status: "pending",
        challengerId: payload.challengerId,
        challengerName: payload.challengerName,
        challengedId: payload.challengedId,
        challengedName: payload.challengedName,
        club: payload.club,
        dateText: payload.dateText,
        ballsAgreement: payload.ballsAgreement,
        isFriendly: Boolean(payload.isFriendly),
        message: payload.message || "",
        liveScore: null,
      };
      setChallenges((prev) => [newCh, ...prev]);
      syncRecordToSupabase("challenges", newCh).catch(() => {});
    },
    [setChallenges]
  );

  // Aceptar un reto entrante
  const handleAcceptIncomingChallenge = useCallback(
    (challengeId) => {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId ? { ...c, status: "accepted" } : c
        )
      );
      setIncomingChallengeModalItem(null);
    },
    [setChallenges]
  );

  // Rechazar un reto entrante
  const handleDeclineIncomingChallenge = useCallback(
    (challengeId) => {
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      setIncomingChallengeModalItem(null);
    },
    [setChallenges]
  );

  // Guardar contrapropuesta de fecha, hora o sede
  const handleSaveCounterProposal = useCallback(
    ({ challengeId, newClub, newDateText, newBallsAgreement }) => {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? {
                ...c,
                club: newClub,
                dateText: newDateText,
                ballsAgreement: newBallsAgreement,
                status: "accepted",
              }
            : c
        )
      );
      setCounterProposalChallenge(null);
      setIncomingChallengeModalItem(null);
    },
    [setChallenges]
  );

  // Confirmar resultado oficial desde el Modo Árbitro ITF/ATP y calcular ELO + Gemas
  const handleConfirmOfficialMatchResult = useCallback(
    ({ challengeId, playerA, playerB, sets, club, isFriendly }) => {
      const calc = calculateMatchEloAndGems({
        playerA,
        playerB,
        sets,
        isTournament: false,
        isFriendly,
      });

      if (!calc.valid) return;

      const winnerIsA = calc.winnerSide === "A";
      const winnerObj = winnerIsA ? playerA : playerB;
      const loserObj = winnerIsA ? playerB : playerA;

      // Actualiza ELO, Victorias, Derrotas, Rachas y Gemas de ambos tenistas
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === playerA.id) {
            return {
              ...p,
              elo: calc.newEloA,
              wins: winnerIsA ? Number(p.wins || 0) + 1 : Number(p.wins || 0),
              losses: !winnerIsA
                ? Number(p.losses || 0) + 1
                : Number(p.losses || 0),
              streak: winnerIsA ? Number(p.streak || 0) + 1 : 0,
              matchesPlayed: Number(p.matchesPlayed || 0) + 1,
              gems: Number(p.gems || 0) + Number(calc.gemsA || 0),
            };
          }
          if (p.id === playerB.id) {
            return {
              ...p,
              elo: calc.newEloB,
              wins: !winnerIsA ? Number(p.wins || 0) + 1 : Number(p.wins || 0),
              losses: winnerIsA
                ? Number(p.losses || 0) + 1
                : Number(p.losses || 0),
              streak: !winnerIsA ? Number(p.streak || 0) + 1 : 0,
              matchesPlayed: Number(p.matchesPlayed || 0) + 1,
              gems: Number(p.gems || 0) + Number(calc.gemsB || 0),
            };
          }
          return p;
        })
      );

      const newMatchRecord = {
        id: `m-${Date.now()}`,
        date: new Date().toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        club: club || "Country Club Los Huancas",
        surface: "ARCILLA",
        roundLabel: calc.isFriendlyResult
          ? "Partido Amistoso"
          : "Reto Oficial Ranking",
        durationText: "01:45",
        playerAId: playerA.id,
        playerAName: playerA.name,
        playerBId: playerB.id,
        playerBName: playerB.name,
        sets: calc.scoreText
          ? sets.slice(0, sets[2]?.a || sets[2]?.b ? 3 : 2)
          : sets,
        score: calc.scoreText,
        winnerId: winnerObj.id,
        winnerName: winnerObj.name,
        eloDelta: calc.deltaWinner,
      };

      setMatches((prev) => [newMatchRecord, ...prev]);
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      setLiveUmpireChallenge(null);

      syncRecordToSupabase("matches", newMatchRecord).catch(() => {});

      setCelebrationRewardData({
        title: `¡Victoria de ${winnerObj.firstName || winnerObj.name}!`,
        subtitle: calc.isFriendlyResult
          ? "Encuentro amistoso registrado en tu historial."
          : `El ranking oficial se ha actualizado en vivo (${calc.scoreText}).`,
        eloDelta: calc.deltaWinner,
        newElo: winnerIsA ? calc.newEloA : calc.newEloB,
        gemsEarned: winnerIsA ? calc.gemsA : calc.gemsB,
        reasonLabel: winnerIsA ? calc.gemReasonA : calc.gemReasonB,
        isMajorAchievement: calc.isMajorAchievement,
        matchSummary: {
          winnerName: winnerObj.name,
          loserName: loserObj.name,
          scoreText: calc.scoreText,
          club: newMatchRecord.club,
        },
      });
    },
    [setPlayers, setMatches, setChallenges]
  );

  // Aprobar pago desde la Suite Admin CMS
  const handleApprovePaymentVerification = useCallback(
    (paymentItem) => {
      setPaymentVerifications((prev) =>
        prev.map((pv) =>
          pv.id === paymentItem.id ? { ...pv, status: "approved" } : pv
        )
      );

      if (paymentItem.itemType === "vip_pass") {
        const isAnnual = paymentItem.referenceId === "vip-annual-2026";
        const bonusGems = isAnnual ? 1800 : 150;
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === paymentItem.playerId
              ? {
                  ...p,
                  isVip: true,
                  gems: Number(p.gems || 0) + bonusGems,
                }
              : p
          )
        );
      } else if (paymentItem.itemType === "tournament") {
        setTournaments((prev) =>
          prev.map((t) => {
            if (t.id !== paymentItem.referenceId) return t;
            const currentList = t.registeredPlayerIds || [];
            if (currentList.includes(paymentItem.playerId)) return t;
            return {
              ...t,
              spotsTaken: Math.min(t.spotsTotal, Number(t.spotsTaken || 0) + 1),
              registeredPlayerIds: [...currentList, paymentItem.playerId],
            };
          })
        );
      }
    },
    [setPaymentVerifications, setPlayers, setTournaments]
  );

  return (
    <div
      className={`mp-app-shell ${
        lightMode
          ? "bg-[#FAF9F5] text-[#1E0734]"
          : "bg-[#1E0734] text-white"
      }`}
    >
      {/* Inyección de la Hoja Maestra de Estilos WTA y las 5 Familias de Microinteracciones */}
      <style>{GLOBAL_WTA_STYLES}</style>

      {/* Flujo de Arranque en 2 Caminos:
          - 1ª vez: Bienvenida a pantalla completa y guarda estado permanente.
          - 2ª+ veces: Logo rápido con aro esmeralda y cortina directa a Retos. */}
      {(!hasCompletedOnboarding || showSplashCurtain) && (
        <SmartOnboardingAndSplash
          hasCompletedOnboarding={hasCompletedOnboarding}
          lightMode={lightMode}
          sponsorName={
            sponsors?.titleSponsor?.active ? sponsors.titleSponsor.name : ""
          }
          onFinishOnboarding={() => {
            setHasCompletedOnboarding(true);
            setShowSplashCurtain(false);
            setActiveTab("retos");
          }}
          onFinishQuickSplash={() => {
            setShowSplashCurtain(false);
          }}
        />
      )}

      {/* 1. Cinta Superior Deslizante de 1 Línea (34px) hacia los 2 Tips Gratuitos */}
      <TopFreeTipsTickerBar
        lightMode={lightMode}
        onOpenWeeklyTips={() =>
          setWeeklyTipVideoItem(WEEKLY_TIPS_AND_CLASSES[0])
        }
        onOpenMasterTop8={() => setIsMasterTop8ModalOpen(true)}
      />

      {/* 2. Cabecera Superior en Píldora Flotante (Cero cortes "MATC...") */}
      <TopFloatingPillHeader
        currentUser={currentUser}
        unreadNoticesCount={pendingForCurrentUserCount}
        sponsors={sponsors}
        lightMode={lightMode}
        onOpenSideMenu={() => setIsSideMenuOpen(true)}
        onOpenProShop={() => setIsProShopModalOpen(true)}
        onOpenBulletin={() => setIsBulletinOpen(true)}
        onSecretAdminTrigger={() => setIsAdminSuiteOpen(true)}
      />

      {/* 3. Contenedor Principal Scrolleable con las 5 Vistas Oficiales */}
      <main ref={mainScrollRef} className="mp-scroll-container">
        <div className="max-w-5xl mx-auto">
          {activeTab === "retos" && (
            <ChallengesCenterView
              currentUser={currentUser}
              players={rankedPlayers}
              challenges={challenges}
              matches={matches}
              sedes={sedes}
              tournaments={tournaments}
              stories={INITIAL_STORIES_9_16}
              sponsors={sponsors}
              answeredTriviaIds={answeredTriviaIds}
              lightMode={lightMode}
              onOpenLaunchChallenge={(opp) =>
                setLaunchChallengeTarget(opp || null)
              }
              onOpenLiveUmpire={(ch) => setLiveUmpireChallenge(ch)}
              onOpenAcceptIncoming={(ch) => setIncomingChallengeModalItem(ch)}
              onOpenCounterProposal={(ch) => setCounterProposalChallenge(ch)}
              onOpenStoryPoster={(data) => setStoryPosterData(data)}
              onOpenH2HWithPlayers={(pA, pB) =>
                setH2hModalPair({
                  playerA: pA || currentUser,
                  playerB: pB || rankedPlayers[0],
                })
              }
              onSelectPlayerProfile={(p) => setSelectedPublicPlayer(p)}
              onNavigateTab={handleChangeMainTab}
              onOpenMasterTop8={() => setIsMasterTop8ModalOpen(true)}
              onClaimTriviaGems={(triviaId, rewardGems) => {
                if (!answeredTriviaIds.includes(triviaId)) {
                  setAnsweredTriviaIds((prev) => [...prev, triviaId]);
                  handleUpdateCurrentUser({
                    gems: Number(currentUser?.gems || 0) + rewardGems,
                  });
                }
              }}
            />
          )}

          {activeTab === "ranking" && (
            <RankingOfficialView
              players={rankedPlayers}
              currentUser={currentUser}
              matches={matches}
              challenges={challenges}
              lightMode={lightMode}
              onSelectPlayerProfile={(p) => setSelectedPublicPlayer(p)}
              onChallengePlayer={(opp) => setLaunchChallengeTarget(opp)}
              onOpenH2HWithPlayers={(pA, pB) =>
                setH2hModalPair({
                  playerA: pA || currentUser,
                  playerB: pB || rankedPlayers[0],
                })
              }
              onOpenMasterTop8={() => setIsMasterTop8ModalOpen(true)}
            />
          )}

          {activeTab === "torneos" && (
            <TournamentsAndHallOfFameView
              tournaments={tournaments}
              players={rankedPlayers}
              currentUser={currentUser}
              lightMode={lightMode}
              onOpenTournamentDetail={(trn) => setSelectedTournamentModal(trn)}
              onOpenMasterTop8={() => setIsMasterTop8ModalOpen(true)}
              onSelectPlayerProfile={(p) => setSelectedPublicPlayer(p)}
              onOpenH2HWithPlayers={(pA, pB) =>
                setH2hModalPair({
                  playerA: pA || currentUser,
                  playerB: pB || rankedPlayers[0],
                })
              }
              onOpenDirectPayment={(req) => setDirectPaymentRequest(req)}
            />
          )}

          {activeTab === "sedes" && (
            <SedesAndCoachProView
              sedes={sedes}
              coaches={coaches}
              classesList={WEEKLY_TIPS_AND_CLASSES}
              unlockedClassIds={unlockedClassIds}
              currentUser={currentUser}
              lightMode={lightMode}
              onSelectSedeModal={(s) => setSelectedSedeModal(s)}
              onSelectCoachModal={(c) => setSelectedCoachModal(c)}
              onOpenVisionIaModal={() => setIsVisionIaModalOpen(true)}
              onOpenWeeklyTipsModal={(cls) => setWeeklyTipVideoItem(cls)}
              onUnlockClassWithGems={(cls) => {
                if (Number(currentUser?.gems || 0) >= cls.costGems) {
                  triggerHaptic("success");
                  handleUpdateCurrentUser({
                    gems: Number(currentUser.gems) - cls.costGems,
                  });
                  setUnlockedClassIds((prev) => [...prev, cls.id]);
                  setWeeklyTipVideoItem(cls);
                } else {
                  setWeeklyTipVideoItem(cls);
                }
              }}
              onLaunchChallengeAtSede={() => setLaunchChallengeTarget(null)}
            />
          )}

          {activeTab === "perfil" && (
            <PlayerProfileWtaView
              currentUser={currentUser}
              players={rankedPlayers}
              matches={matches}
              sedes={sedes}
              lightMode={lightMode}
              onUpdateCurrentUser={handleUpdateCurrentUser}
              onSwitchActivePlayerAccount={(nextId) => setCurrentUserId(nextId)}
              onOpenVipCardModal={() => setIsVipCardModalOpen(true)}
              onOpenProShopModal={() => setIsProShopModalOpen(true)}
              onOpenH2HWithPlayers={(pA, pB) =>
                setH2hModalPair({
                  playerA: pA || currentUser,
                  playerB: pB || rankedPlayers[0],
                })
              }
              onOpenStoryPoster={(data) => setStoryPosterData(data)}
              onOpenCircuitGuide={() => setIsVisualRulesOpen(true)}
              onOpenAuthPortal={(mode) => setAuthPortalMode(mode || "login")}
            />
          )}

          {/* Barra Institucional de 6 Redes Sociales y Enlaces Legales en el Pie del Scroll */}
          <WtaInstitutionalFooterBar
            lightMode={lightMode}
            onOpenClaimsBookModal={() => setIsClaimsBookOpen(true)}
            onOpenLegalDocModal={(docType) => setLegalDocModalType(docType)}
          />
        </div>
      </main>

      {/* 4. Barra de Navegación Inferior con Halo Esmeralda (Oculta si el teclado está abierto) */}
      {!viewportProfile.keyboardOpen && (
        <BottomNavigationDock
          activeTab={activeTab}
          onChangeTab={handleChangeMainTab}
          pendingChallengesCount={pendingForCurrentUserCount}
          lightMode={lightMode}
        />
      )}

      {/* ====================================================================
          5. MODALES Y HOJAS EMERGENTES ENFRENTE DE PANTALLA (BLUR iOS 22PX)
          ==================================================================== */}
      {/* Menú Lateral Institucional (3 Rayitas) */}
      <InstitutionalSideDrawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        currentUser={currentUser}
        lightMode={lightMode}
        onToggleLightMode={() => setLightMode((prev) => !prev)}
        onNavigateTab={handleChangeMainTab}
        onOpenAuthPortal={(mode) => setAuthPortalMode(mode || "login")}
        onOpenVipCardModal={() => setIsVipCardModalOpen(true)}
        onOpenProShopModal={() => setIsProShopModalOpen(true)}
        onOpenH2HModal={() =>
          setH2hModalPair({
            playerA: currentUser,
            playerB: rankedPlayers[0],
          })
        }
        onOpenStoryPosterModal={() =>
          setStoryPosterData({
            winnerName: currentUser?.name || "Pablo Samaniego",
            loserName: "Kenji Takahashi",
            scoreText: "7-5, 6-4",
            club: currentUser?.club || "Country Club Los Huancas",
          })
        }
        onOpenVisionIaModal={() => setIsVisionIaModalOpen(true)}
        onOpenVisualRulesModal={() => setIsVisualRulesOpen(true)}
        onOpenClaimsBookModal={() => setIsClaimsBookOpen(true)}
        onOpenLegalDocModal={(docType) => setLegalDocModalType(docType)}
        onSecretAdminTrigger={() => setIsAdminSuiteOpen(true)}
      />

      {/* Ficha Completa de Jugador al Tocar en el Ranking */}
      <PublicPlayerProfileModal
        player={selectedPublicPlayer}
        currentUser={currentUser}
        matches={matches}
        challenges={challenges}
        lightMode={lightMode}
        onClose={() => setSelectedPublicPlayer(null)}
        onChallengePlayer={(opp) => {
          setSelectedPublicPlayer(null);
          setLaunchChallengeTarget(opp);
        }}
        onCompareH2H={(pA, pB) => {
          setSelectedPublicPlayer(null);
          setH2hModalPair({ playerA: pA, playerB: pB });
        }}
        onOpenStoryPoster={(data) => {
          setSelectedPublicPlayer(null);
          setStoryPosterData(data);
        }}
      />

      {/* Lanzador de Desafíos con Sede Personalizada Libre */}
      <LaunchChallengeModal
        isOpen={launchChallengeTarget !== undefined}
        onClose={() => setLaunchChallengeTarget(undefined)}
        currentUser={currentUser}
        players={rankedPlayers}
        sedes={sedes}
        preselectedOpponent={launchChallengeTarget}
        lightMode={lightMode}
        onCreateChallenge={handleCreateChallenge}
      />

      {/* Reto Entrante Detectado por ID Único */}
      <IncomingChallengeModal
        challenge={incomingChallengeModalItem}
        players={rankedPlayers}
        sedes={sedes}
        lightMode={lightMode}
        onAcceptChallenge={handleAcceptIncomingChallenge}
        onOpenCounterProposal={(ch) => {
          setIncomingChallengeModalItem(null);
          setCounterProposalChallenge(ch);
        }}
        onDeclineChallenge={handleDeclineIncomingChallenge}
        onClose={() => setIncomingChallengeModalItem(null)}
      />

      {/* Contrapropuesta de Fecha, Hora o Sede por WhatsApp */}
      <CounterProposalModal
        challenge={counterProposalChallenge}
        players={rankedPlayers}
        sedes={sedes}
        lightMode={lightMode}
        onSaveCounterProposal={handleSaveCounterProposal}
        onClose={() => setCounterProposalChallenge(null)}
      />

      {/* Modo Árbitro Oficial ITF/ATP con Candado por Set */}
      <LiveUmpireAndScoreModal
        challenge={liveUmpireChallenge}
        players={rankedPlayers}
        lightMode={lightMode}
        onConfirmOfficialResult={handleConfirmOfficialMatchResult}
        onUpdateLiveChallengeScore={(chId, liveScoreObj) => {
          setChallenges((prev) =>
            prev.map((c) =>
              c.id === chId
                ? { ...c, status: "in_play", liveScore: liveScoreObj }
                : c
            )
          );
        }}
        onClose={() => setLiveUmpireChallenge(null)}
      />

      {/* Comparador Monumental HEAD TO HEAD */}
      <AtpHeadToHeadModal
        isOpen={Boolean(h2hModalPair)}
        onClose={() => setH2hModalPair(null)}
        initialPlayerA={h2hModalPair?.playerA}
        initialPlayerB={h2hModalPair?.playerB}
        players={rankedPlayers}
        matches={matches}
        lightMode={lightMode}
        onChallengePair={(opp) => {
          setH2hModalPair(null);
          setLaunchChallengeTarget(opp);
        }}
        onOpenStoryFromH2H={(data) => {
          setH2hModalPair(null);
          setStoryPosterData(data);
        }}
      />

      {/* Estudio Generador de Póster Story 9:16 */}
      <StoryPosterModal
        isOpen={Boolean(storyPosterData)}
        onClose={() => setStoryPosterData(null)}
        initialData={storyPosterData}
        players={rankedPlayers}
        sponsors={sponsors}
        lightMode={lightMode}
      />

      {/* Modal Completo de Detalle de Torneo y Llaves con Ronda Consuelo */}
      <TournamentFullDetailModal
        tournament={selectedTournamentModal}
        players={rankedPlayers}
        currentUser={currentUser}
        lightMode={lightMode}
        onClose={() => setSelectedTournamentModal(null)}
        onSelectPlayerProfile={(p) => {
          setSelectedTournamentModal(null);
          setSelectedPublicPlayer(p);
        }}
        onOpenDirectPayment={(req) => {
          setSelectedTournamentModal(null);
          setDirectPaymentRequest(req);
        }}
      />

      {/* Modal Interactivo del Torneo de Maestros (Master Top 8 Finals) */}
      <MasterTop8FinalsModal
        isOpen={isMasterTop8ModalOpen}
        onClose={() => setIsMasterTop8ModalOpen(false)}
        players={rankedPlayers}
        lightMode={lightMode}
        onSelectPlayerProfile={(p) => {
          setIsMasterTop8ModalOpen(false);
          setSelectedPublicPlayer(p);
        }}
        onOpenDirectPayment={(req) => {
          setIsMasterTop8ModalOpen(false);
          setDirectPaymentRequest(req);
        }}
      />

      {/* Modal de Sede Oficial y Reporte Climático (+3 Gemas) */}
      <ClubDetailModal
        sede={selectedSedeModal}
        currentUser={currentUser}
        lightMode={lightMode}
        onClose={() => setSelectedSedeModal(null)}
        onReportWeatherState={(sedeId, nextWeather) => {
          setSedes((prev) =>
            prev.map((s) =>
              s.id === sedeId
                ? {
                    ...s,
                    weatherState: nextWeather,
                    lastWeatherReport: "Reportado hace un instante",
                  }
                : s
            )
          );
          setSelectedSedeModal((prev) =>
            prev && prev.id === sedeId
              ? {
                  ...prev,
                  weatherState: nextWeather,
                  lastWeatherReport: "Reportado hace un instante",
                }
              : prev
          );
          handleUpdateCurrentUser({
            gems: Number(currentUser?.gems || 0) + 3,
          });
        }}
        onLaunchChallengeAtSede={() => setLaunchChallengeTarget(null)}
      />

      {/* Modal de Entrenador Coach Pro con Turnos Libres */}
      <CoachProProfileModal
        coach={selectedCoachModal}
        currentUser={currentUser}
        lightMode={lightMode}
        onClose={() => setSelectedCoachModal(null)}
        onOpenDirectPayment={(req) => {
          setSelectedCoachModal(null);
          setDirectPaymentRequest(req);
        }}
      />

      {/* Sala MatchPoint Vision IA */}
      <MatchPointVisionIaModal
        isOpen={isVisionIaModalOpen}
        onClose={() => setIsVisionIaModalOpen(false)}
        currentUser={currentUser}
        sedes={sedes}
        lightMode={lightMode}
        onOpenDirectPayment={(req) => {
          setIsVisionIaModalOpen(false);
          setDirectPaymentRequest(req);
        }}
      />

      {/* Carnet Digital Socio VIP Metálico 3D con Giroscopio */}
      <CarnetDigitalVIPModal
        isOpen={isVipCardModalOpen}
        onClose={() => setIsVipCardModalOpen(false)}
        currentUser={currentUser}
        sedes={sedes}
        lightMode={lightMode}
        onOpenDirectPayment={(req) => {
          setIsVipCardModalOpen(false);
          setDirectPaymentRequest(req);
        }}
      />

      {/* Tienda Oficial Pro Shop en 3 Escalones */}
      <ProShopModal
        isOpen={isProShopModalOpen}
        onClose={() => setIsProShopModalOpen(false)}
        currentUser={currentUser}
        proShopItems={proShopItems}
        sponsors={sponsors}
        lightMode={lightMode}
        onOpenVipModal={() => setIsVipCardModalOpen(true)}
        onOpenDirectPayment={(req) => {
          setIsProShopModalOpen(false);
          setDirectPaymentRequest(req);
        }}
        onRedeemShopItemWithGems={(item) => {
          if (!currentUser) return;
          const nextGems = Math.max(
            0,
            Number(currentUser.gems || 0) - Number(item.costGems || 0)
          );
          const updates = { gems: nextGems };
          if (item.unlocksThemeId) {
            const currentThemes = currentUser.unlockedThemes || ["finals"];
            if (!currentThemes.includes(item.unlocksThemeId)) {
              updates.unlockedThemes = [...currentThemes, item.unlocksThemeId];
            }
            updates.surfaceThemeId = item.unlocksThemeId;
          }
          if (item.unlocksBadgeId) {
            const currentBadges = currentUser.unlockedBadges || [];
            if (!currentBadges.includes(item.unlocksBadgeId)) {
              updates.unlockedBadges = [...currentBadges, item.unlocksBadgeId];
            }
            updates.activeBadgeId = item.unlocksBadgeId;
          }
          handleUpdateCurrentUser(updates);
        }}
      />

      {/* Modal de Pago Directo Yape/Plin (Blindaje SBS — Cero Billetera Digital) */}
      <DirectPaymentYapePlinModal
        paymentRequest={directPaymentRequest}
        currentUser={currentUser}
        lightMode={lightMode}
        onSubmitPaymentVerification={(record) => {
          setPaymentVerifications((prev) => [record, ...prev]);
          syncRecordToSupabase("payment_verifications", record).catch(() => {});
        }}
        onClose={() => setDirectPaymentRequest(null)}
      />

      {/* Portal de Acceso Profesional Split-Screen 50/50 (Login, Registro +18 y Recuperación) */}
      <AuthAndAccountModal
        isOpen={Boolean(authPortalMode)}
        onClose={() => setAuthPortalMode(null)}
        initialMode={authPortalMode || "login"}
        players={rankedPlayers}
        sedes={sedes}
        currentUser={currentUser}
        onLoginSuccess={(playerId) => setCurrentUserId(playerId)}
        onRegisterNewPlayer={(newPlayerObj) => {
          setPlayers((prev) => [...prev, newPlayerObj]);
          setCurrentUserId(newPlayerObj.id);
          // Abre automáticamente el Test Inicial de 5 preguntas para su cuenta nueva
          setTimeout(() => setIsCalibrationWizardOpen(true), 260);
        }}
        onResetPlayerPassword={(playerId, newPass) => {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === playerId ? { ...p, customPassword: newPass } : p
            )
          );
        }}
        onTriggerAdminSuite={() => setIsAdminSuiteOpen(true)}
      />

      {/* Test Inicial Didáctico de 5 Preguntas (1 solo uso al registrarse) */}
      <InitialCalibrationWizardModal
        isOpen={isCalibrationWizardOpen}
        onClose={() => setIsCalibrationWizardOpen(false)}
        currentUser={currentUser}
        lightMode={lightMode}
        onCompleteCalibration={({ assignedElo }) => {
          handleUpdateCurrentUser({
            elo: assignedElo,
            hasCompletedTest: true,
          });
          setActiveTab("ranking");
        }}
      />

      {/* Guía Visual del Circuito */}
      <VisualRulesModal
        isOpen={isVisualRulesOpen}
        onClose={() => setIsVisualRulesOpen(false)}
        lightMode={lightMode}
      />

      {/* Libro de Reclamaciones Virtual (Indecopi Perú) */}
      <VirtualClaimsBookModal
        isOpen={isClaimsBookOpen}
        onClose={() => setIsClaimsBookOpen(false)}
        currentUser={currentUser}
        claimsHistory={claimsHistory}
        lightMode={lightMode}
        onSubmitNewClaim={(claimRecord) =>
          setClaimsHistory((prev) => [claimRecord, ...prev])
        }
      />

      {/* Modales Legales de Términos y Condiciones y Política de Privacidad (Ley N° 29733) */}
      <LegalTermsAndPrivacyModal
        isOpen={Boolean(legalDocModalType)}
        onClose={() => setLegalDocModalType(null)}
        initialDoc={legalDocModalType || "terms"}
        currentUser={currentUser}
        lightMode={lightMode}
      />

      {/* Reproductor de los 2 Tips Gratuitos Semanales y Academia TV */}
      <WeeklyFreeTipsPlayerModal
        isOpen={Boolean(weeklyTipVideoItem)}
        onClose={() => setWeeklyTipVideoItem(null)}
        initialClassItem={weeklyTipVideoItem}
        classesList={WEEKLY_TIPS_AND_CLASSES}
        unlockedClassIds={unlockedClassIds}
        currentUser={currentUser}
        lightMode={lightMode}
        onUnlockClassWithGems={(cls) => {
          if (Number(currentUser?.gems || 0) >= cls.costGems) {
            triggerHaptic("success");
            handleUpdateCurrentUser({
              gems: Number(currentUser.gems) - cls.costGems,
            });
            setUnlockedClassIds((prev) => [...prev, cls.id]);
          }
        }}
      />

      {/* Centro de Avisos y Noticiero Bento con Fotos Reales */}
      <BulletinAndNewsModal
        isOpen={isBulletinOpen}
        onClose={() => setIsBulletinOpen(false)}
        announcements={announcements}
        challenges={challenges}
        currentUser={currentUser}
        lightMode={lightMode}
        onOpenIncomingChallenge={(ch) => setIncomingChallengeModalItem(ch)}
      />

      {/* Modal de Celebración de Victoria y Gemas */}
      <CelebrationRewardModal
        celebrationData={celebrationRewardData}
        onClose={() => setCelebrationRewardData(null)}
        onOpenStoryShare={(summary) => {
          setCelebrationRewardData(null);
          setStoryPosterData(summary);
        }}
      />

      {/* Suite de Administrador CMS Oculta de 7 Pestañas (5 toques en el logo + PIN 1234) */}
      <HiddenAdminSuiteModal
        isOpen={isAdminSuiteOpen}
        onClose={() => setIsAdminSuiteOpen(false)}
        players={players}
        setPlayers={setPlayers}
        challenges={challenges}
        setChallenges={setChallenges}
        matches={matches}
        setMatches={setMatches}
        sedes={sedes}
        setSedes={setSedes}
        coaches={coaches}
        setCoaches={setCoaches}
        tournaments={tournaments}
        setTournaments={setTournaments}
        proShopItems={proShopItems}
        setProShopItems={setProShopItems}
        sponsors={sponsors}
        setSponsors={setSponsors}
        paymentVerifications={paymentVerifications}
        onApprovePaymentVerification={handleApprovePaymentVerification}
        onRejectPaymentVerification={(id) =>
          setPaymentVerifications((prev) =>
            prev.map((pv) =>
              pv.id === id ? { ...pv, status: "rejected" } : pv
            )
          )
        }
        claimsHistory={claimsHistory}
        onMarkClaimResolved={(claimId) =>
          setClaimsHistory((prev) =>
            prev.map((c) =>
              c.id === claimId ? { ...c, status: "atendido" } : c
            )
          )
        }
        announcements={announcements}
        onPublishAnnouncement={(newAnn) =>
          setAnnouncements((prev) => [newAnn, ...prev])
        }
        lightMode={lightMode}
      />
    </div>
  );
}

// === FIN DEL BLOQUE 14 DE 14 (ARCHIVO src/App.jsx COMPLETO) ===
