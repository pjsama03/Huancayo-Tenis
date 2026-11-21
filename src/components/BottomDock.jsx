import React, { useMemo } from 'react';
import { ASSETS, SmartImage, triggerHaptic } from './AppIcons';

export const DOCK_TABS = [
  {
    id: 'retos',
    label: 'Retos',
    compactLabel: 'Retos',
    ariaLabel: 'Ir a Retos y Cartelera en Vivo',
    icon: ASSETS.navRetos,
    fallback: ASSETS.cancha1,
  },
  {
    id: 'ranking',
    label: 'Ranking',
    compactLabel: 'Ranking',
    ariaLabel: 'Ir a Ranking Oficial y Temporadas',
    icon: ASSETS.navRanking,
    fallback: ASSETS.trofeoCampeonGira,
  },
  {
    id: 'torneos',
    label: 'Torneos',
    compactLabel: 'Torneos',
    ariaLabel: 'Ir a Torneos y Master Top 8',
    icon: ASSETS.navTorneos,
    fallback: ASSETS.trofeoMasterTop8,
  },
  {
    id: 'sedes',
    label: 'Sedes & Coach',
    compactLabel: 'Sedes',
    ariaLabel: 'Ir a Sedes, Clubes y Entrenadores',
    icon: ASSETS.navSedes,
    fallback: ASSETS.clubCountry,
  },
  {
    id: 'perfil',
    label: 'Mi Perfil',
    compactLabel: 'Perfil',
    ariaLabel: 'Ir a Mi Perfil, Carnet Digital y Stories',
    icon: ASSETS.navPerfil,
    fallback: ASSETS.logo,
  },
];

export default function BottomDock({
  activeTab = 'retos',
  onSelectTab,
  onReselectActiveTab,
  challengesCount = 0,
  liveMatchesCount = 0,
  activeTournamentsCount = 0,
  theme = 'dark',
  sunlightMode = false,
}) {
  const isLight = theme === 'light';

  const activeIndex = useMemo(() => {
    const idx = DOCK_TABS.findIndex((t) => t.id === activeTab);
    return idx >= 0 ? idx : 0;
  }, [activeTab]);

  const handleTabPress = (tabId) => {
    triggerHaptic('light');

    if (tabId === activeTab) {
      if (typeof onReselectActiveTab === 'function') {
        onReselectActiveTab(tabId);
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (typeof onSelectTab === 'function') {
      onSelectTab(tabId);
    }
  };

  return (
    <>
      <nav
        className={`tt-bottom-dock tt-dock-v2 ${isLight ? 'is-light' : 'is-dark'} ${
          sunlightMode ? 'is-sunlight' : ''
        }`}
        aria-label="Navegación principal TOTAL TENIS"
        data-active-tab={activeTab}
        data-active-index={activeIndex}
      >
        <div className="tt-dock-inner tt-dock-v2-inner" role="tablist">
          {DOCK_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showRetosLive = tab.id === 'retos' && liveMatchesCount > 0;
            const showRetosCount =
              tab.id === 'retos' && !showRetosLive && challengesCount > 0;
            const showTorneosDot = tab.id === 'torneos' && activeTournamentsCount > 0;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tt-dock-tab-${tab.id}`}
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.ariaLabel}
                className={`tt-dock-item tt-dock-v2-item ${isActive ? 'is-active' : ''}`}
                onClick={() => handleTabPress(tab.id)}
              >
                {/* Capa 1: Techo luminoso Verde Esmeralda (#00DC7D) */}
                <span className="tt-dock-v2-topline" aria-hidden="true" />

                {/* Capa 2: Cascada volumétrica y halo difuminado detrás del icono/texto */}
                <span className="tt-dock-v2-beam" aria-hidden="true" />
                <span className="tt-dock-v2-aura" aria-hidden="true" />

                {/* Capa 3: Icono PNG oficial + Etiqueta (ambos escalan 1.14x juntos) */}
                <div className="tt-dock-content tt-dock-v2-content">
                  <div className="tt-dock-v2-icon-wrap">
                    <SmartImage
                      src={tab.icon}
                      fallbackSrc={tab.fallback}
                      alt=""
                      initials={tab.label}
                      priority
                      className="tt-dock-img tt-dock-v2-img"
                    />

                    {showRetosLive && (
                      <span
                        className="tt-dock-v2-live-dot"
                        title={`${liveMatchesCount} partido(s) en vivo`}
                        aria-hidden="true"
                      />
                    )}

                    {showRetosCount && (
                      <span className="tt-dock-v2-badge" aria-hidden="true">
                        {challengesCount > 9 ? '9+' : challengesCount}
                      </span>
                    )}

                    {showTorneosDot && (
                      <span className="tt-dock-v2-gold-dot" aria-hidden="true" />
                    )}
                  </div>

                  <span className="tt-dock-label tt-dock-v2-label">
                    <span className="tt-dock-label-full">{tab.label}</span>
                    <span className="tt-dock-label-compact">{tab.compactLabel}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Estilos encapsulados de precisión visual para la Barra Inferior Definitiva */}
      <style>{`
        .tt-dock-v2 {
          position: absolute !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: var(--tt-z-dock, 70);
          padding-bottom: var(--tt-safe-bottom, env(safe-area-inset-bottom, 0px));
          padding-left: var(--tt-safe-left, env(safe-area-inset-left, 0px));
          padding-right: var(--tt-safe-right, env(safe-area-inset-right, 0px));
          user-select: none;
          -webkit-user-select: none;
          transition: transform var(--tt-dur-base, 240ms) var(--tt-ease-smooth, ease),
            background-color 220ms ease,
            border-color 220ms ease;
        }

        html[data-standalone='true'] .tt-dock-v2 {
          padding-bottom: max(env(safe-area-inset-bottom, 0px), 18px);
        }

        /* Tema Oscuro (Púrpura Noche translúcido) */
        .tt-dock-v2.is-dark {
          background: linear-gradient(
            180deg,
            rgba(25, 6, 46, 0.92) 0%,
            rgba(18, 4, 34, 0.98) 100%
          );
          border-top: 1px solid rgba(250, 249, 245, 0.11);
          box-shadow: 0 -10px 30px rgba(8, 1, 18, 0.45);
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
        }

        /* Tema Claro (Marfil Editorial de alto contraste) */
        .tt-dock-v2.is-light {
          background: linear-gradient(
            180deg,
            rgba(250, 249, 245, 0.96) 0%,
            rgba(244, 241, 234, 0.99) 100%
          );
          border-top: 1px solid rgba(30, 7, 52, 0.12);
          box-shadow: 0 -8px 26px rgba(30, 7, 52, 0.09);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .tt-dock-v2-inner {
          max-width: var(--tt-container-max, 680px);
          margin: 0 auto;
          height: 68px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          align-items: stretch;
          padding: 0 4px;
        }

        /* Anular pseudo-elementos heredados de layout.css para evitar doble halo */
        .tt-dock-v2-item::before,
        .tt-dock-v2-item::after {
          display: none !important;
          content: none !important;
        }

        .tt-dock-v2-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 54px;
          padding: 8px 2px 6px;
          border: none;
          background: transparent;
          overflow: visible;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        /* 1. LÍNEA SUPERIOR LUMINOSA ESMERALDA (#00DC7D) */
        .tt-dock-v2-topline {
          position: absolute;
          top: -1px;
          left: 14%;
          right: 14%;
          height: 3.5px;
          border-radius: 0 0 6px 6px;
          background: linear-gradient(90deg, #00B868 0%, #00DC7D 50%, #7CF5C0 100%);
          box-shadow: 0 0 10px rgba(0, 220, 125, 0.92),
            0 2px 14px rgba(0, 220, 125, 0.58);
          opacity: 0;
          transform: scaleX(0.2);
          transform-origin: center top;
          transition: opacity 220ms ease,
            transform 280ms cubic-bezier(0.22, 1.32, 0.36, 1);
          pointer-events: none;
          z-index: 2;
        }

        .tt-dock-v2-item.is-active .tt-dock-v2-topline {
          opacity: 1;
          transform: scaleX(1);
        }

        /* 2. CASCADA VOLUMÉTRICA DESDE EL TECHO ESMERALDA */
        .tt-dock-v2-beam {
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 46px;
          background: linear-gradient(
            180deg,
            rgba(0, 220, 125, 0.28) 0%,
            rgba(0, 220, 125, 0.08) 54%,
            rgba(0, 220, 125, 0) 100%
          );
          clip-path: polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%);
          opacity: 0;
          transform: scaleY(0.4);
          transform-origin: center top;
          transition: opacity 240ms ease,
            transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          z-index: 0;
        }

        .tt-dock-v2-item.is-active .tt-dock-v2-beam {
          opacity: 1;
          transform: scaleY(1);
        }

        /* 3. HALO DIFUMINADO DETRÁS DEL ICONO Y TEXTO ACTIVO */
        .tt-dock-v2-aura {
          position: absolute;
          inset: 4px 2px 2px;
          border-radius: 18px;
          background: radial-gradient(
            circle at 50% 44%,
            rgba(0, 220, 125, 0.32) 0%,
            rgba(0, 220, 125, 0.11) 46%,
            rgba(0, 220, 125, 0) 76%
          );
          opacity: 0;
          transform: scale(0.68);
          transition: opacity 240ms ease,
            transform 300ms cubic-bezier(0.22, 1.25, 0.36, 1);
          pointer-events: none;
          z-index: 0;
        }

        .tt-dock-v2-item.is-active .tt-dock-v2-aura {
          opacity: 1;
          transform: scale(1);
        }

        .tt-dock-v2.is-light .tt-dock-v2-beam {
          background: linear-gradient(
            180deg,
            rgba(0, 184, 104, 0.2) 0%,
            rgba(0, 184, 104, 0.05) 55%,
            rgba(0, 184, 104, 0) 100%
          );
        }

        .tt-dock-v2.is-light .tt-dock-v2-aura {
          background: radial-gradient(
            circle at 50% 44%,
            rgba(0, 184, 104, 0.22) 0%,
            rgba(0, 184, 104, 0.07) 48%,
            rgba(0, 184, 104, 0) 76%
          );
        }

        /* 4. CONJUNTO ICONO + TEXTO: ESCALA 1.14x SUAVE AL ACTIVARSE */
        .tt-dock-v2-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transform: scale(1) translate3d(0, 0, 0);
          transition: transform 280ms cubic-bezier(0.22, 1.32, 0.36, 1);
          will-change: transform;
        }

        .tt-dock-v2-item.is-active .tt-dock-v2-content {
          transform: scale(1.14) translate3d(0, -2px, 0);
        }

        .tt-dock-v2-item:active .tt-dock-v2-content {
          transform: scale(0.93) translate3d(0, 0, 0);
        }

        .tt-dock-v2-icon-wrap {
          position: relative;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .tt-dock-v2-img {
          width: 26px;
          height: 26px;
          object-fit: contain;
          border-radius: 7px;
          opacity: 0.7;
          filter: saturate(0.75) brightness(0.92);
          transition: opacity 220ms ease, filter 240ms ease;
        }

        .tt-dock-v2.is-light .tt-dock-v2-img {
          opacity: 0.72;
          filter: saturate(0.85) contrast(1.04);
        }

        .tt-dock-v2-item.is-active .tt-dock-v2-img {
          opacity: 1;
          filter: drop-shadow(0 0 9px rgba(0, 220, 125, 0.76)) brightness(1.12)
            saturate(1.15);
        }

        .tt-dock-v2.is-light .tt-dock-v2-item.is-active .tt-dock-v2-img {
          opacity: 1;
          filter: drop-shadow(0 2px 7px rgba(0, 168, 93, 0.45)) saturate(1.18);
        }

        /* 5. ETIQUETAS TIPOGRAFÍA LEGIBLE Y ADAPTATIVA */
        .tt-dock-v2-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          line-height: 1.05;
          white-space: nowrap;
          text-align: center;
          transition: color 200ms ease, text-shadow 220ms ease;
        }

        .tt-dock-v2.is-dark .tt-dock-v2-label {
          color: rgba(250, 249, 245, 0.62);
        }

        .tt-dock-v2.is-dark .tt-dock-v2-item.is-active .tt-dock-v2-label {
          color: #00DC7D;
          font-weight: 800;
          text-shadow: 0 0 12px rgba(0, 220, 125, 0.48);
        }

        .tt-dock-v2.is-light .tt-dock-v2-label {
          color: rgba(30, 7, 52, 0.62);
        }

        .tt-dock-v2.is-light .tt-dock-v2-item.is-active .tt-dock-v2-label {
          color: #008A4E;
          font-weight: 800;
          text-shadow: none;
        }

        .tt-dock-label-compact {
          display: none;
        }

        @media (max-width: 365px) {
          .tt-dock-label-full { display: none; }
          .tt-dock-label-compact { display: inline; }
          .tt-dock-v2-label { font-size: 0.64rem; }
        }

        .tt-dock-v2-live-dot {
          position: absolute;
          top: -2px;
          right: -4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #00DC7D;
          border: 1.5px solid #160428;
          box-shadow: 0 0 8px rgba(0, 220, 125, 0.9);
          animation: ttLivePulse 1.6s infinite;
        }

        .tt-dock-v2-badge {
          position: absolute;
          top: -4px;
          right: -8px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
          font-size: 0.6rem;
          font-weight: 900;
          line-height: 16px;
          text-align: center;
          box-shadow: 0 2px 7px rgba(0, 0, 0, 0.4);
        }

        .tt-dock-v2-gold-dot {
          position: absolute;
          top: -2px;
          right: -3px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #F59E0B;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.8);
        }

        html[data-tier='lite'] .tt-dock-v2.is-dark {
          background: #160428 !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        html[data-tier='lite'] .tt-dock-v2.is-light {
          background: #FAF9F5 !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        html[data-tier='lite'] .tt-dock-v2-beam,
        html[data-tier='lite'] .tt-dock-v2-aura {
          display: none !important;
        }
        html[data-tier='lite'] .tt-dock-v2-item.is-active .tt-dock-v2-img {
          filter: brightness(1.1) !important;
        }

        @media (min-width: 768px) {
          .tt-dock-v2-inner {
            max-width: 660px;
            height: 72px;
          }
          .tt-dock-v2-icon-wrap {
            width: 30px;
            height: 30px;
          }
          .tt-dock-v2-img {
            width: 28px;
            height: 28px;
          }
          .tt-dock-v2-label {
            font-size: 0.74rem;
          }
        }
      `}</style>
    </>
  );
}
