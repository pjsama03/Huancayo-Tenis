import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ==========================================================================
   1. MAPA MAESTRO DE ACTIVOS (public/assets/)
   Conecta tus 42 archivos previos + 26 nuevos de TOTAL TENIS + ranuras Pro Shop
   ========================================================================== */
export const ASSETS = {
  // Identidad Oficial TOTAL TENIS
  logo: '/assets/logo-total-tenis.png',
  logoLight: '/assets/logo-total-tenis.png',
  splashDark: '/assets/splash-fondo-oscuro.jpg',
  bienvenidaClaro: '/assets/bienvenida-hero-claro.jpg',
  bienvenidaOscuro: '/assets/bienvenida-hero-oscuro.jpg',
  loginPoster: '/assets/login-poster-esmeralda.jpg',
  registroPoster: '/assets/registro-poster-purpura.jpg',

  // Barra Inferior Definitiva (Tus 5 PNGs exactos)
  navRetos: '/assets/nav-retos.png',
  navRanking: '/assets/nav-ranking.png',
  navTorneos: '/assets/nav-torneos.png',
  navSedes: '/assets/nav-sedes.png',
  navPerfil: '/assets/nav-perfil.png',

  // Escudos Oficiales de los 4 Clubes
  clubCountry: '/assets/club-country-huancas.png',
  clubTauro: '/assets/club-tauro.png',
  clubRomina: '/assets/club-romina-cutipa.png',
  clubInkas: '/assets/club-los-inkas.png',

  // Estados Vacíos Oficiales (Claro / Oscuro)
  estadoVacioClaro: '/assets/estado-vacio-claro.png',
  estadoVacioOscuro: '/assets/estado-vacio-oscuro.png',

  // Escenarios Grand Slam para Perfil (Sin jugador naranja detrás)
  bgArcilla: '/assets/perfil-bg-arcilla.jpg',
  bgCesped: '/assets/perfil-bg-cesped.jpg',
  bgDura: '/assets/perfil-bg-dura.jpg',
  bgFinals: '/assets/perfil-bg-finals.jpg',
  bgPurpuraOscuro: '/assets/perfil-bg-purpura-oscuro.jpg',

  // Portadas Únicas de Torneos
  torneoAltura: '/assets/torneo-altura.jpg',
  torneoApertura: '/assets/torneo-apertura.jpg',
  torneoDoblesValle: '/assets/torneo-dobles-valle.jpg',
  torneoMasterTop8: '/assets/torneo-master-top8.jpg',

  // Trofeos Oficiales Transparentes
  trofeoCampeonGira: '/assets/trofeo-campeon-gira.png',
  trofeoMasterTop8: '/assets/trofeo-master-top8.png',

  // Insignias Oficiales de Logro y Tienda
  badgeInvicto: '/assets/badge-invicto.png',
  badgeMaestroTop8: '/assets/badge-maestro-top8.png',
  badgeMataGigantes: '/assets/badge-mata-gigantes.png',
  badgeReyArcilla: '/assets/badge-rey-arcilla.png',
  badgeSaqueCanon: '/assets/badge-saque-canon.png',
  badgeVeteranoOro: '/assets/badge-veterano-oro.png',
  badgeFavorito: '/assets/badge-favorito.png',

  // Banners y Portadas Editoriales
  bannerPaseVip: '/assets/banner-pase-vip.jpg',
  bannerVisionIa: '/assets/banner-vision-ia.jpg',
  portadaAcademiaTv: '/assets/portada-academia-tv.jpg',
  portadaTipsSemana: '/assets/portada-tips-semana.jpg',

  // Clima, Tickets, Racha y Modelos 3D
  climaSeco: '/assets/canva-clima-seco.png',
  climaHumedad: '/assets/canva-clima-humedad.png',
  climaLlovizna: '/assets/canva-clima-llovizna.png',
  climaLluvia: '/assets/canva-clima-lluvia.png',
  goldenTicket: '/assets/canva-golden-ticket.png',
  proshopRollo: '/assets/canva-proshop-rollo.png',
  escudoCoach: '/assets/canva-escudo-coach.png',
  fuegoRacha: '/assets/fuego-racha-3d.png',
  pelotaVolt: '/assets/pelota-3d-volt-azul.png',
  pelotaClasica: '/assets/pelota-3d-clasica.png',
  raquetaPro: '/assets/raqueta-3d-pro.png',
  raquetaOscura: '/assets/raqueta-3d-oscura.png',

  // Ranuras Listas para tu Carnet VIP de Canva Pro
  carnetVipAnverso: '/assets/carnet-vip-anverso.png',
  carnetVipReverso: '/assets/carnet-vip-reverso.png',

  // Ranuras Listas para Pro Shop Estilo Amazon (Fondo Blanco #FFFFFF)
  proshopCuerda: '/assets/proshop-cuerda.png',
  proshopPelotas: '/assets/proshop-pelotas.png',
  proshopOvergrip: '/assets/proshop-overgrip.png',
  proshopAntivibrador: '/assets/proshop-antivibrador.png',
  proshopRaquetero: '/assets/proshop-raquetero.png',
  proshopRaqueta: '/assets/proshop-raqueta.png',

  // Pool Visual y Celebraciones
  cancha1: '/assets/cancha-1.png',
  poolTenistaAccion: '/assets/pool-tenista-accion.png',
  poolRaquetaPelota: '/assets/pool-raqueta-pelota.png',
  gifCelebracion1: '/assets/gif-celebracion-1.gif',
  gifCelebracion2: '/assets/gif-celebracion-2.gif',

  // Videos MP4 Bajo Demanda (preload="none" y playsInline)
  videoCoachRodrigo: '/assets/video-coach-rodrigo.mp4',
  videoCoachRomina: '/assets/video-coach-romina.mp4',
  videoCoach3: '/assets/video-coach-demo-3.mp4',
  videoCoach4: '/assets/video-coach-demo-4.mp4',
  videoCircuito1: '/assets/video-circuito-horizontal.mp4',
  videoCircuito2: '/assets/video-coach-horizontal-2.mp4',
  videoCircuito3: '/assets/video-horizontal-3.mp4',
  videoCircuito4: '/assets/video-horizontal-4.mp4',
};

/* ==========================================================================
   2. VIBRACIÓN HÁPTICA SEGURA (SE ADAPTA A CADA DISPOSITIVO SIN ERRORES)
   ========================================================================== */
export function triggerHaptic(type = 'light') {
  try {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    const patterns = {
      light: 10,
      medium: 18,
      score: [14, 30, 18],
      success: [16, 40, 24, 30, 32],
      warning: [30, 40, 30],
    };
    navigator.vibrate(patterns[type] || 10);
  } catch (e) {
    // Silencioso en Safari iOS u otros navegadores sin Vibration API
  }
}

/* ==========================================================================
   3. HOOK SCROLL-REVEAL PROGRESIVO (ESTILO APPLE · CERO LAG EN GAMA BAJA)
   Calcula --tt-reveal de 0 a 1 conforme el usuario desliza la pantalla.
   ========================================================================== */
export function useScrollReveal(ref, { startRevealed = true } = {}) {
  const [progress, setProgress] = useState(startRevealed ? 1 : 0.25);

  useEffect(() => {
    const el = ref?.current;
    if (!el || typeof window === 'undefined') return undefined;

    const isLite = document.documentElement.getAttribute('data-tier') === 'lite';
    if (isLite) {
      el.style.setProperty('--tt-reveal', '1');
      setProgress(1);
      return undefined;
    }

    let rafId = 0;
    const update = () => {
      rafId = 0;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // En el tope superior (Hero inicial) empieza en 0.88 y llega a 1.0 suavemente al bajar
      const raw =
        rect.top <= 140
          ? Math.min(1, Math.max(0.84, 0.88 + Math.abs(Math.min(0, rect.top)) / 180))
          : Math.min(1, Math.max(0.15, (vh - rect.top) / (vh * 0.72)));
      const clamped = Number(raw.toFixed(3));
      ref.current.style.setProperty('--tt-reveal', String(clamped));
      setProgress(clamped);
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, startRevealed]);

  return progress;
}

/* ==========================================================================
   4. COMPONENTE <SmartImage /> (AUTO-CORRECCIÓN .PNG/.JPG/.WEBP + CERO ROTOS)
   ========================================================================== */
function buildExtensionCandidates(src, fallbackSrc) {
  const list = [];
  if (src) {
    list.push(src);
    // Si es un activo local en /assets/, probar extensiones alternas automáticamente
    const match = typeof src === 'string' && src.match(/^(\/assets\/.+)\.(png|jpg|jpeg|webp)$/i);
    if (match) {
      const base = match[1];
      const ext = match[2].toLowerCase();
      ['png', 'jpg', 'webp', 'jpeg'].forEach((alt) => {
        if (alt !== ext) list.push(`${base}.${alt}`);
      });
    }
  }
  if (fallbackSrc && !list.includes(fallbackSrc)) {
    list.push(fallbackSrc);
  }
  return list;
}

export function SmartImage({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  style = {},
  initials = '',
  priority = false,
  ...rest
}) {
  const candidates = buildExtensionCandidates(src, fallbackSrc);
  const [idx, setIdx] = useState(0);
  const [failedAll, setFailedAll] = useState(false);

  useEffect(() => {
    setIdx(0);
    setFailedAll(false);
  }, [src, fallbackSrc]);

  if (!candidates.length || failedAll) {
    const letters = (initials || alt || 'TT')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    return (
      <div
        className={className}
        aria-label={alt}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #290C46 0%, #1E0734 100%)',
          color: '#00DC7D',
          fontFamily: 'var(--tt-font-display)',
          fontWeight: 800,
          fontSize: '0.95rem',
          letterSpacing: '0.04em',
          border: '1px solid rgba(0, 220, 125, 0.28)',
          ...style,
        }}
      >
        {letters}
      </div>
    );
  }

  return (
    <img
      src={candidates[idx]}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      onError={() => {
        if (idx + 1 < candidates.length) {
          setIdx(idx + 1);
        } else {
          setFailedAll(true);
        }
      }}
      {...rest}
    />
  );
}

/* ==========================================================================
   5. MOTOR UNIVERSAL <ModalPortal /> EN document.body (CERO PANTALLAS VACÍAS)
   ========================================================================== */
let openModalCount = 0;

export function ModalPortal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  isFullscreen = false,
  isWide = false,
  isTopLayer = false,
  forceDarkAdmin = false,
  hideHeader = false,
  headerExtra = null,
}) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    openModalCount += 1;
    const prevOverflow = document.body.style.overflow;
    if (openModalCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    // Forzar scroll al inicio desde el primer milisegundo (resuelve pantalla vacía iPhone)
    const raf = window.requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    });

    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKey);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = prevOverflow || '';
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`tt-modal-backdrop ${isFullscreen ? 'is-fullscreen' : ''} ${
        isTopLayer ? 'is-top-layer' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Ventana TOTAL TENIS'}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          triggerHaptic('light');
          onClose();
        }
      }}
    >
      <div
        className={`tt-modal-sheet ${isWide ? 'is-wide' : ''} ${
          forceDarkAdmin ? 'tt-admin-force-dark' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div className="tt-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
              <div style={{ minWidth: 0 }}>
                {title && (
                  <h2
                    className="tt-title-lg"
                    style={{
                      fontSize: 'clamp(1.08rem, 4.2vw, 1.32rem)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p
                    className="tt-muted"
                    style={{
                      margin: '2px 0 0',
                      fontSize: '0.76rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {headerExtra}
              {onClose && (
                <button
                  type="button"
                  className="tt-modal-close-btn"
                  aria-label="Cerrar ventana"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                >
                  <TTIcon name="close" size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={bodyRef} className="tt-modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   6. TARJETA DE ESTADO VACÍO (CON TUS ACTIVOS estado-vacio-claro / oscuro)
   ========================================================================== */
export function EmptyStateCard({
  theme = 'dark',
  title = 'Sin registros por ahora',
  description = 'Ajusta los filtros o vuelve en unos minutos.',
  actionLabel,
  onAction,
}) {
  const imgSrc = theme === 'light' ? ASSETS.estadoVacioClaro : ASSETS.estadoVacioOscuro;
  return (
    <div
      className="tt-card"
      style={{
        textAlign: 'center',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <SmartImage
        src={imgSrc}
        alt={title}
        style={{
          width: 112,
          height: 112,
          objectFit: 'contain',
          borderRadius: 20,
          opacity: 0.94,
        }}
      />
      <h3 className="tt-title-lg" style={{ fontSize: '1.15rem' }}>
        {title}
      </h3>
      <p className="tt-muted" style={{ margin: 0, maxWidth: 320, fontSize: '0.85rem' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          className="tt-btn tt-btn-primary"
          style={{ marginTop: 4 }}
          onClick={() => {
            triggerHaptic('light');
            onAction();
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   7. LAURELES CEREMONIALES DE PODIO (#1 ORO, #2 PLATA, #3 BRONCE)
   ========================================================================== */
export function LaurelBadge({ rank = 1, size = 56 }) {
  const uid = useId();
  const palettes = {
    1: { a: '#FFF0A8', b: '#F59E0B', c: '#B45309', text: '#FFF4C2', glow: 'rgba(245,158,11,0.45)' },
    2: { a: '#FFFFFF', b: '#CBD5E1', c: '#64748B', text: '#F8FAFC', glow: 'rgba(203,213,225,0.35)' },
    3: { a: '#FAD3BC', b: '#D97757', c: '#8C3F23', text: '#FCE2D2', glow: 'rgba(217,119,87,0.38)' },
  };
  const p = palettes[rank] || palettes[1];
  const gradId = `laurel-${rank}-${uid}`;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: `drop-shadow(0 3px 10px ${p.glow})`,
      }}
      aria-label={`Puesto número ${rank}`}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <defs>
          <linearGradient id={gradId} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={p.a} />
            <stop offset="52%" stopColor={p.b} />
            <stop offset="100%" stopColor={p.c} />
          </linearGradient>
        </defs>
        {/* Rama Izquierda */}
        <path
          d="M27 54C16 49 10 38 11 25C12 17 16 11 22 8"
          stroke={`url(#${gradId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse cx="14" cy="43" rx="5.2" ry="2.6" transform="rotate(-35 14 43)" fill={`url(#${gradId})`} />
        <ellipse cx="10.5" cy="34" rx="5.4" ry="2.6" transform="rotate(-12 10.5 34)" fill={`url(#${gradId})`} />
        <ellipse cx="11.5" cy="24" rx="5.2" ry="2.5" transform="rotate(14 11.5 24)" fill={`url(#${gradId})`} />
        <ellipse cx="15.5" cy="15" rx="4.8" ry="2.4" transform="rotate(36 15.5 15)" fill={`url(#${gradId})`} />
        <ellipse cx="21" cy="49" rx="4.8" ry="2.3" transform="rotate(-55 21 49)" fill={`url(#${gradId})`} />

        {/* Rama Derecha */}
        <path
          d="M37 54C48 49 54 38 53 25C52 17 48 11 42 8"
          stroke={`url(#${gradId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse cx="50" cy="43" rx="5.2" ry="2.6" transform="rotate(35 50 43)" fill={`url(#${gradId})`} />
        <ellipse cx="53.5" cy="34" rx="5.4" ry="2.6" transform="rotate(12 53.5 34)" fill={`url(#${gradId})`} />
        <ellipse cx="52.5" cy="24" rx="5.2" ry="2.5" transform="rotate(-14 52.5 24)" fill={`url(#${gradId})`} />
        <ellipse cx="48.5" cy="15" rx="4.8" ry="2.4" transform="rotate(-36 48.5 15)" fill={`url(#${gradId})`} />
        <ellipse cx="43" cy="49" rx="4.8" ry="2.3" transform="rotate(55 43 49)" fill={`url(#${gradId})`} />

        {/* Medallón Central */}
        <circle cx="32" cy="31" r="15.5" fill="#1E0734" stroke={`url(#${gradId})`} strokeWidth="2.2" />
        {/* Estrella superior en el #1 */}
        {rank === 1 && (
          <path
            d="M32 6L33.6 9.8L37.7 10.1L34.5 12.8L35.5 16.8L32 14.6L28.5 16.8L29.5 12.8L26.3 10.1L30.4 9.8L32 6Z"
            fill={`url(#${gradId})`}
          />
        )}
      </svg>
      <span
        style={{
          position: 'absolute',
          fontFamily: 'var(--tt-font-display)',
          fontWeight: 900,
          fontSize: size * 0.34,
          color: p.text,
          lineHeight: 1,
          marginTop: -1,
        }}
      >
        #{rank}
      </span>
    </div>
  );
}

/* ==========================================================================
   8. LIBRERÍA DE INSIGNIAS VECTORIALES DE DOBLE CAPA (CERO EMOJIS FEOS)
   Reemplaza "librito", "diamante 5 líneas", "camarita" y "trofeo básico".
   ========================================================================== */
export function IconBadge({ name, variant = 'emerald', size = 40 }) {
  const styles = {
    emerald: {
      bg: 'linear-gradient(135deg, #00DC7D 0%, #00A85D 100%)',
      color: '#120321',
      shadow: '0 6px 16px rgba(0, 220, 125, 0.32)',
    },
    gold: {
      bg: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 52%, #B45309 100%)',
      color: '#1E1102',
      shadow: '0 6px 16px rgba(245, 158, 11, 0.34)',
    },
    purple: {
      bg: 'linear-gradient(135deg, #431870 0%, #1E0734 100%)',
      color: '#00DC7D',
      shadow: '0 6px 16px rgba(30, 7, 52, 0.34)',
    },
    clay: {
      bg: 'linear-gradient(135deg, #E07A5F 0%, #C85A32 100%)',
      color: '#FFFFFF',
      shadow: '0 6px 16px rgba(200, 90, 50, 0.32)',
    },
  };
  const v = styles[variant] || styles.emerald;

  return (
    <span
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: Math.round(size * 0.32),
        background: v.bg,
        color: v.color,
        boxShadow: v.shadow,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Brillo superior sutil estilo relieve 3D */}
      <span
        style={{
          position: 'absolute',
          inset: '0 0 52% 0',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.28), rgba(255,255,255,0))',
          pointerEvents: 'none',
        }}
      />
      <TTIcon name={name} size={Math.round(size * 0.56)} />
    </span>
  );
}

export function TTIcon({ name, size = 20, className = '', style = {} }) {
  const uid = useId();
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    className,
    style: { flexShrink: 0, ...style },
    'aria-hidden': 'true',
  };

  switch (name) {
    /* GEMA FACETADA 3D CON BRILLO INTERNO (Adiós diamante de 5 líneas) */
    case 'gem': {
      const g1 = `gem-top-${uid}`;
      const g2 = `gem-bot-${uid}`;
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={g1} x1="3" y1="3" x2="21" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="55%" stopColor="#00DC7D" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id={g2} x1="4" y1="9" x2="20" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#00B868" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
          </defs>
          <polygon points="7,3 17,3 22,9.5 12,21.5 2,9.5" fill={`url(#${g2})`} />
          <polygon points="7,3 17,3 22,9.5 2,9.5" fill={`url(#${g1})`} />
          <polygon points="7,3 12,9.5 17,3" fill="rgba(255,255,255,0.42)" />
          <polygon points="12,9.5 17,9.5 12,21.5" fill="rgba(0,0,0,0.16)" />
          <polygon points="7,9.5 12,9.5 12,21.5" fill="rgba(255,255,255,0.22)" />
          <path d="M5.5 7.5L8 4.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        </svg>
      );
    }

    /* LIBRO DE RECLAMACIONES OFICIAL (Escudo editorial con hoja y check, cero librito feo) */
    case 'claimsBook':
      return (
        <svg {...common}>
          <path
            d="M4.5 5.5C4.5 4.1 5.6 3 7 3H18.5C19.3 3 20 3.7 20 4.5V18.5C20 19.3 19.3 20 18.5 20H7C5.6 20 4.5 18.9 4.5 17.5V5.5Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.9"
          />
          <path d="M8 3V20" stroke="currentColor" strokeWidth="1.7" />
          <path d="M11 8.5H16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M11 12H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M11.2 15.8L12.7 17.2L16.3 13.8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* PUBLICA TUS VICTORIAS EN STORIES (Marco vertical 9:16 + destello editorial, cero camarita fea) */
    case 'stories':
      return (
        <svg {...common}>
          <rect
            x="5.5"
            y="2.5"
            width="13"
            height="19"
            rx="3.2"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="1.9"
          />
          <circle cx="12" cy="11.5" r="3.4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M17.5 4.2L18.4 6L20.2 6.8L18.4 7.6L17.5 9.4L16.6 7.6L14.8 6.8L16.6 6L17.5 4.2Z"
            fill="currentColor"
          />
          <path d="M9.5 18H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    /* TROFEO ESCULPIDO DE DOBLE CAPA */
    case 'trophy':
      return (
        <svg {...common}>
          <path
            d="M7 4H17V9.5C17 12.6 14.8 15 12 15C9.2 15 7 12.6 7 9.5V4Z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path d="M7 6H4.5C4.5 9.2 5.6 11 7.5 11.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 6H19.5C19.5 9.2 18.4 11 16.5 11.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 15V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8.5 20H15.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    /* CORONA VIP METÁLICA */
    case 'crown':
      return (
        <svg {...common}>
          <path
            d="M3.5 17.5L5.2 7.5L9.5 11.5L12 5.5L14.5 11.5L18.8 7.5L20.5 17.5H3.5Z"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path d="M5 20H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    /* TIENDA PRO SHOP (BOLSA COMERCIAL) */
    case 'shop':
      return (
        <svg {...common}>
          <path
            d="M5 8.5H19L18 20H6L5 8.5Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path d="M8.5 8.5V6.5C8.5 4.6 10 3 12 3C14 3 15.5 4.6 15.5 6.5V8.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M9.5 13C10.1 14.3 11 15 12 15C13 15 13.9 14.3 14.5 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    /* MENÚ 3 RAYITAS ESTILIZADO */
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M4 12H16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M4 17H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    /* CERRAR X */
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      );

    /* CAMPANA DE AVISOS / NOTICIERO EN VIVO */
    case 'bell':
      return (
        <svg {...common}>
          <path
            d="M6.2 15.8L7.2 10.2C7.6 7.4 9.6 5.5 12 5.5C14.4 5.5 16.4 7.4 16.8 10.2L17.8 15.8H6.2Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path d="M4.5 16H19.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M10 19C10.5 20.1 11.2 20.6 12 20.6C12.8 20.6 13.5 20.1 14 19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );

    /* SOL (MODO CLARO) */
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.2" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.9" />
          <path
            d="M12 2.5V5M12 19V21.5M4.5 12H2M22 12H19.5M5.6 5.6L7.4 7.4M16.6 16.6L18.4 18.4M18.4 5.6L16.6 7.4M7.4 16.6L5.6 18.4"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );

    /* LUNA (MODO OSCURO) */
    case 'moon':
      return (
        <svg {...common}>
          <path
            d="M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5A8 8 0 1 0 19.5 14.5Z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* CALENDARIO */
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.9" />
          <path d="M3.5 9.5H20.5M8 3V6.5M16 3V6.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <circle cx="8.5" cy="13.5" r="1.2" fill="currentColor" />
          <circle cx="12" cy="13.5" r="1.2" fill="currentColor" />
          <circle cx="15.5" cy="13.5" r="1.2" fill="currentColor" />
        </svg>
      );

    /* RELOJ */
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.9" />
          <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    /* GOOGLE MAPS PIN */
    case 'mapPin':
      return (
        <svg {...common}>
          <path
            d="M12 21C12 21 18.5 14.8 18.5 9.8C18.5 6.2 15.6 3.5 12 3.5C8.4 3.5 5.5 6.2 5.5 9.8C5.5 14.8 12 21 12 21Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9.8" r="2.6" fill="currentColor" />
        </svg>
      );

    /* VIDEO / REELS EN CANCHA */
    case 'video':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3.5" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.9" />
          <polygon points="10,9 16,12 10,15" fill="currentColor" />
        </svg>
      );

    /* RAQUETAS / RETAR */
    case 'challenge':
      return (
        <svg {...common}>
          <ellipse cx="9.2" cy="8.8" rx="4.2" ry="5.2" transform="rotate(-35 9.2 8.8)" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12.5 12.6L19.5 19.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="17.8" cy="6.6" r="2.3" fill="#00DC7D" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );

    /* JUEZ / MARCADOR EN CANCHA */
    case 'scoreboard':
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="15" rx="3" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.9" />
          <path d="M12 4.5V19.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M6.5 10H9M6.5 14H9M15 10H17.5M15 14H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    /* ESCUDO LEGAL / VERIFICADO */
    case 'shield':
      return (
        <svg {...common}>
          <path
            d="M12 2.8L19.5 5.8V11.8C19.5 16.5 16.3 19.8 12 21.4C7.7 19.8 4.5 16.5 4.5 11.8V5.8L12 2.8Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path d="M8.8 12.2L11 14.4L15.6 9.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    /* TOTAL TENIS VISION IA */
    case 'vision':
      return (
        <svg {...common}>
          <path
            d="M2.5 12C4.8 7.5 8.2 5.5 12 5.5C15.8 5.5 19.2 7.5 21.5 12C19.2 16.5 15.8 18.5 12 18.5C8.2 18.5 4.8 16.5 2.5 12Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="1.9"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );

    /* AJUSTES / TUERCA */
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.9" />
          <path
            d="M19.4 15A1.7 1.7 0 0 0 19.7 16.9L19.8 17A2 2 0 1 1 17 19.8L16.9 19.7A1.7 1.7 0 0 0 15 19.4A1.7 1.7 0 0 0 14 20.9V21A2 2 0 1 1 10 21V20.9A1.7 1.7 0 0 0 9 19.4A1.7 1.7 0 0 0 7.1 19.7L7 19.8A2 2 0 1 1 4.2 17L4.3 16.9A1.7 1.7 0 0 0 4.6 15A1.7 1.7 0 0 0 3.1 14H3A2 2 0 1 1 3 10H3.1A1.7 1.7 0 0 0 4.6 9A1.7 1.7 0 0 0 4.3 7.1L4.2 7A2 2 0 1 1 7 4.2L7.1 4.3A1.7 1.7 0 0 0 9 4.6H9.1A1.7 1.7 0 0 0 10 3.1V3A2 2 0 1 1 14 3V3.1A1.7 1.7 0 0 0 15 4.6A1.7 1.7 0 0 0 16.9 4.3L17 4.2A2 2 0 1 1 19.8 7L19.7 7.1A1.7 1.7 0 0 0 19.4 9V9.1A1.7 1.7 0 0 0 20.9 10H21A2 2 0 1 1 21 14H20.9A1.7 1.7 0 0 0 19.4 15Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );

    /* COMPARTIR / EXPORTAR */
    case 'share':
      return (
        <svg {...common}>
          <circle cx="18" cy="5.5" r="2.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="6" cy="12" r="2.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="18" cy="18.5" r="2.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.3 10.8L15.7 6.7M8.3 13.2L15.7 17.3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );

    /* DESCARGA / EXCEL */
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3.5V14.5M12 14.5L7.5 10M12 14.5L16.5 10" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.5 17.5V19C4.5 19.8 5.2 20.5 6 20.5H18C18.8 20.5 19.5 19.8 19.5 19V17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    /* ESCALA / GRÁFICO RANKING */
    case 'chart':
      return (
        <svg {...common}>
          <rect x="4" y="13" width="3.8" height="7" rx="1.2" fill="currentColor" fillOpacity="0.24" stroke="currentColor" strokeWidth="1.8" />
          <rect x="10.1" y="9" width="3.8" height="11" rx="1.2" fill="currentColor" fillOpacity="0.24" stroke="currentColor" strokeWidth="1.8" />
          <rect x="16.2" y="4.5" width="3.8" height="15.5" rx="1.2" fill="currentColor" fillOpacity="0.24" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );

    /* COACH / USUARIOS / GRUPOS */
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9.2" cy="8.2" r="3.2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.5 19C3.8 15.8 6.1 14 9.2 14C12.3 14 14.6 15.8 14.9 19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <circle cx="16.6" cy="9.2" r="2.4" stroke="currentColor" strokeWidth="1.7" />
          <path d="M16.6 14.2C18.7 14.4 20.3 15.8 20.6 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    /* CLUB / SEDE */
    case 'club':
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.9" />
          <path d="M3.5 12H20.5M12 4.5V19.5M7 4.5V19.5M17 4.5V19.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );

    /* BUSCAR */
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16L20.5 20.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    /* CHECK VERIFICADO */
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12.5L9.8 17.2L19.2 7.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    /* FLECHA DERECHA */
    case 'chevronRight':
      return (
        <svg {...common}>
          <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    /* WHATSAPP */
    case 'whatsapp':
      return (
        <svg {...common}>
          <path
            d="M12 3.5C7.3 3.5 3.5 7.3 3.5 12C3.5 13.7 4 15.3 4.8 16.6L3.6 20.6L7.8 19.4C9 20.1 10.5 20.5 12 20.5C16.7 20.5 20.5 16.7 20.5 12C20.5 7.3 16.7 3.5 12 3.5Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path
            d="M9.4 9.2C9.1 9.5 8.8 10.2 9.4 11.4C10 12.6 11.4 14 12.6 14.6C13.8 15.2 14.5 14.9 14.8 14.6L15.4 14C15.6 13.8 15.6 13.4 15.3 13.2L14 12.5C13.7 12.3 13.4 12.4 13.2 12.7L12.8 13.1C12.2 12.8 11.2 11.8 10.9 11.2L11.3 10.8C11.6 10.6 11.7 10.3 11.5 10L10.8 8.7C10.6 8.4 10.2 8.4 10 8.6L9.4 9.2Z"
            fill="currentColor"
          />
        </svg>
      );

    /* INSTAGRAM */
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.9" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.9" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
        </svg>
      );

    /* RACHA FUEGO */
    case 'flame':
      return (
        <svg {...common}>
          <path
            d="M12.5 3C13.5 6.4 17.5 8.2 17.5 13.2C17.5 16.8 15 19.8 11.8 19.8C8.4 19.8 6.2 17.1 6.2 13.8C6.2 11.2 7.5 9.2 9 7.8C9 9.5 9.8 10.5 10.7 10.8C10.2 8.4 11 5.2 12.5 3Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* ALERTA / CLIMA */
    case 'alert':
      return (
        <svg {...common}>
          <path
            d="M12 3.5L20.5 18.8C20.9 19.5 20.4 20.3 19.6 20.3H4.4C3.6 20.3 3.1 19.5 3.5 18.8L12 3.5Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path d="M12 9.5V13.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.1" fill="currentColor" />
        </svg>
      );

    /* FLECHAS COMPARAR / HEAD TO HEAD */
    case 'swap':
      return (
        <svg {...common}>
          <path d="M4.5 8.5H19.5M19.5 8.5L15.8 4.8M19.5 8.5L15.8 12.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19.5 15.5H4.5M4.5 15.5L8.2 11.8M4.5 15.5L8.2 19.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    /* PELOTA DE TENIS */
    case 'ball':
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.9" />
          <path d="M5.8 6.4C8.6 8.8 8.6 15.2 5.8 17.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M18.2 6.4C15.4 8.8 15.4 15.2 18.2 17.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
  }
}
