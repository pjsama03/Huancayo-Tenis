import React, { useEffect, useRef, useState } from 'react';
import { ASSETS, SmartImage } from './AppIcons';

/* ==========================================================================
   TOTAL TENIS · SPLASH SCREEN LIMPIO Y ESCALABLE (2.6 SEGUNDOS)
   - Sin etiqueta geográfica fija (listo para expansión nacional/regional).
   - Precarga silenciosa de activos críticos para entrar a 0 parpadeos.
   - Animación 60/120Hz optimizada para GPU (transform + opacity).
   ========================================================================== */
const CRITICAL_PRELOAD_ASSETS = [
  ASSETS.logo,
  ASSETS.navRetos,
  ASSETS.navRanking,
  ASSETS.navTorneos,
  ASSETS.navSedes,
  ASSETS.navPerfil,
];

export default function SplashScreen({
  theme = 'dark',
  durationMs = 2400,
  exitDurationMs = 420,
  onComplete,
}) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);
  const [isLiteTier, setIsLiteTier] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsLiteTier(document.documentElement.getAttribute('data-tier') === 'lite');
    }

    // 1. Precarga silenciosa de activos críticos durante la ventana del Splash
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      CRITICAL_PRELOAD_ASSETS.forEach((src) => {
        if (!src) return;
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      });
    }

    // 2. Progreso suave sincronizado con la tasa de refresco real (60Hz / 120Hz)
    let rafId = 0;
    let exitTimer = 0;
    const startTs = performance.now();

    const tick = (now) => {
      const elapsed = now - startTs;
      const ratio = Math.min(1, elapsed / durationMs);
      // Curva easeOutCubic para un avance natural y elegante
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));

      if (ratio < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else if (!completedRef.current) {
        completedRef.current = true;
        setIsExiting(true);
        exitTimer = window.setTimeout(() => {
          setIsUnmounted(true);
          if (typeof onComplete === 'function') onComplete();
        }, exitDurationMs);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (exitTimer) window.clearTimeout(exitTimer);
    };
  }, [durationMs, exitDurationMs, onComplete]);

  if (isUnmounted) return null;

  const isLight = theme === 'light';
  const bgSource = isLight ? ASSETS.bienvenidaClaro : ASSETS.splashDark;

  return (
    <div
      className={`tt-splash-overlay ${isExiting ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando TOTAL TENIS"
      style={{
        paddingTop: 'var(--tt-safe-top)',
        paddingBottom: 'var(--tt-safe-bottom)',
        backgroundColor: '#140424',
      }}
    >
      {/* 1. Fondo personalizado de cancha / arena subido en public/assets/ */}
      <SmartImage
        src={bgSource}
        fallbackSrc={ASSETS.bienvenidaOscuro}
        alt=""
        priority
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLight ? 0.32 : 0.62,
          transform: isLiteTier ? 'none' : isExiting ? 'scale(1.06)' : 'scale(1.02)',
          transition: 'transform 1.8s var(--tt-ease-out)',
          pointerEvents: 'none',
        }}
      />

      {/* 2. Velo cromático Púrpura Noche + destello sutil Esmeralda/Arcilla */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 42%, rgba(0, 220, 125, 0.14) 0%, rgba(30, 7, 52, 0.72) 48%, rgba(16, 3, 29, 0.96) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3. Núcleo central: Emblema Oficial TOTAL TENIS (escalado móvil -> desktop) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 460,
          padding: '0 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 'clamp(168px, 46vw, 248px)',
            height: 'clamp(168px, 46vw, 248px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isLiteTier ? 'none' : 'ttSplashLogoFloat 2.4s var(--tt-ease-out) both',
          }}
        >
          {/* Halo ambiental sutil (solo en gama media/alta) */}
          {!isLiteTier && (
            <div
              style={{
                position: 'absolute',
                inset: -14,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(245, 158, 11, 0.24) 0%, rgba(0, 220, 125, 0.16) 45%, rgba(30, 7, 52, 0) 74%)',
                filter: 'blur(16px)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Aro fino exterior en degradado Esmeralda -> Ámbar Dorado */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: 34,
              padding: 3,
              background:
                'linear-gradient(135deg, rgba(245, 158, 11, 0.78) 0%, rgba(217, 107, 67, 0.65) 48%, rgba(0, 220, 125, 0.85) 100%)',
              boxShadow: isLiteTier
                ? '0 10px 24px rgba(0, 0, 0, 0.45)'
                : '0 22px 54px rgba(6, 1, 14, 0.72), 0 0 36px rgba(0, 220, 125, 0.22)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 31,
                backgroundColor: '#1E0734',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SmartImage
                src={ASSETS.logo}
                alt="TOTAL TENIS"
                priority
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>

        {/* Wordmark tipográfico complementario limpio (sin ubicación fija) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            className="tt-display-italic"
            style={{
              fontSize: 'clamp(1.9rem, 7.6vw, 2.75rem)',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <span style={{ color: '#FAF9F5' }}>TOTAL</span>
            <span
              style={{
                color: '#00DC7D',
                textShadow: isLiteTier ? 'none' : '0 0 22px rgba(0, 220, 125, 0.42)',
              }}
            >
              TENIS
            </span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(250, 249, 245, 0.64)',
            }}
          >
            Circuito Oficial de Competencia
          </span>
        </div>
      </div>

      {/* 4. Barra de progreso minimalista inferior (anclada sobre safe-area) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'calc(var(--tt-safe-bottom) + 42px)',
          transform: 'translateX(-50%)',
          zIndex: 2,
          width: 'min(76vw, 310px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 999,
            backgroundColor: 'rgba(250, 249, 245, 0.14)',
            overflow: 'hidden',
            border: '1px solid rgba(250, 249, 245, 0.1)',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #F59E0B 0%, #00DC7D 65%, #7CF5C0 100%)',
              boxShadow: isLiteTier ? 'none' : '0 0 14px rgba(0, 220, 125, 0.72)',
              transition: 'width 80ms linear',
            }}
          />
        </div>

        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'rgba(250, 249, 245, 0.68)',
          }}
        >
          Cargando... {progress}%
        </span>
      </div>

      {/* Keyframe encapsulado para entrada sutil del emblema */}
      <style>{`
        @keyframes ttSplashLogoFloat {
          0% {
            opacity: 0;
            transform: translate3d(0, 18px, 0) scale(0.92);
          }
          35% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, -4px, 0) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
