import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ASSETS,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from './AppIcons';
import { getCategoryByPoints } from '../data/playersAndClubsData';

/* ==========================================================================
   HEADER FLOTANTE PROPORCIONADO + MENÚ LATERAL EN PORTAL (createPortal)
   - Ocupa su espacio real en Flexbox: jamás tapa Perfil, Sedes ni Retos.
   - Ancho calculado (~320px) para iPhone SE / 14 / 15 / 16 y Android sin cortes.
   - Menú ☰ montado en document.body (z-index 9990): abre desde cualquier vista.
   ========================================================================== */
export default function HeaderAndDrawer({
  currentUser = null,
  theme = 'dark',
  sunlightMode = false,
  activeTab = 'retos',
  unreadNoticesCount = 0,
  sponsorsConfig = null,
  onToggleTheme,
  onToggleSunlight,
  onNavigateTab,
  onOpenProShop,
  onOpenShop,
  onOpenGemsVault,
  onOpenVault,
  onOpenNotices,
  onOpenVipScale,
  onOpenStories,
  onOpenAuth,
  onOpenPartnerPortal,
  onOpenLegal,
  onOpenTutorial,
  onSecretAdminTrigger,
  onLogout,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  const gemsBalance = Number(currentUser?.gems) || 0;
  const isVip = Boolean(currentUser?.isVip);
  const sponsorName =
    sponsorsConfig?.titleSponsorActive && sponsorsConfig?.titleSponsorName
      ? sponsorsConfig.titleSponsorName
      : '';

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Disparador oculto de Suite Maestra Admin (5 toques rápidos al logotipo)
  const handleLogoTap = () => {
    triggerHaptic('light');
    tapCountRef.current += 1;
    if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      triggerHaptic('success');
      if (onSecretAdminTrigger) onSecretAdminTrigger();
      return;
    }

    tapTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 1500);
  };

  const openShopAction = () => {
    triggerHaptic('light');
    if (onOpenProShop) onOpenProShop();
    else if (onOpenShop) onOpenShop();
  };

  const openVaultAction = () => {
    triggerHaptic('light');
    if (onOpenGemsVault) onOpenGemsVault();
    else if (onOpenVault) onOpenVault();
  };

  const runDrawerAction = (fn) => {
    triggerHaptic('light');
    setDrawerOpen(false);
    if (fn) fn();
  };

  return (
    <>
      <header
        className={`tt-hdr-shell ${theme === 'light' ? 'is-light' : 'is-dark'}`}
        aria-label="Barra superior TOTAL TENIS"
      >
        <div className="tt-hdr-pill">
          {/* Izquierda: Menú ☰ + Logotipo + Marca íntegra sin recortes */}
          <div className="tt-hdr-left">
            <button
              type="button"
              className="tt-hdr-icon-btn"
              aria-label="Abrir menú principal"
              aria-expanded={drawerOpen}
              onClick={() => {
                triggerHaptic('light');
                setDrawerOpen(true);
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7H20M4 12H20M4 17H15"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <button
              type="button"
              className="tt-hdr-brand-btn"
              onClick={handleLogoTap}
              aria-label="TOTAL TENIS"
            >
              <SmartImage
                src={ASSETS.logo}
                alt="TOTAL TENIS"
                className="tt-hdr-logo"
              />
              <span className="tt-hdr-wordmark">
                TOTAL <em>TENIS</em>
              </span>
            </button>
          </div>

          {/* Derecha: Gemas + Tienda + Campana (todo proporcional en 1 fila) */}
          <div className="tt-hdr-right">
            <button
              type="button"
              className="tt-hdr-gems-pill"
              onClick={openVaultAction}
              aria-label={`Bóveda de Gemas: ${gemsBalance}`}
            >
              <span className="tt-hdr-gem-diamond" aria-hidden="true">◆</span>
              <span>{gemsBalance}</span>
            </button>

            <button
              type="button"
              className="tt-hdr-shop-pill"
              onClick={openShopAction}
              aria-label="Abrir Tienda Pro Shop"
            >
              <TTIcon name="shop" size={13} />
              <span>Tienda</span>
            </button>

            <button
              type="button"
              className="tt-hdr-icon-btn is-bell"
              aria-label="Notificaciones y actualidad"
              onClick={() => {
                triggerHaptic('light');
                if (onOpenNotices) onOpenNotices('notificaciones');
              }}
            >
              <TTIcon name="bell" size={17} />
              {unreadNoticesCount > 0 && (
                <span className="tt-hdr-bell-badge">
                  {unreadNoticesCount > 9 ? '9+' : unreadNoticesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {sponsorName && (
          <div className="tt-hdr-sponsor-strip">
            <span>TOTAL TENIS</span>
            <i>|</i>
            <strong>{sponsorName}</strong>
          </div>
        )}
      </header>

      {/* MENÚ LATERAL (3 RAYITAS) EN PORTAL GLOBAL */}
      {drawerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="tt-drw-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Menú lateral TOTAL TENIS"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDrawerOpen(false);
            }}
          >
            <aside className={`tt-drw-panel ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
              <div className="tt-drw-head">
                <div className="tt-drw-brand">
                  <SmartImage
                    src={ASSETS.logo}
                    alt="TOTAL TENIS"
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <strong>TOTAL TENIS</strong>
                    <small>Circuito Oficial</small>
                  </div>
                </div>

                <button
                  type="button"
                  className="tt-drw-close"
                  aria-label="Cerrar menú"
                  onClick={() => {
                    triggerHaptic('light');
                    setDrawerOpen(false);
                  }}
                >
                  <TTIcon name="close" size={18} />
                </button>
              </div>

              {currentUser ? (
                <div className="tt-drw-user-card">
                  <SmartImage
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    initials={currentUser.name}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      border: isVip ? '2px solid #F59E0B' : '2px solid #00DC7D',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong>{currentUser.name}</strong>
                    <small>
                      {getCategoryByPoints(currentUser.points).name} ·{' '}
                      {Number(currentUser.points || 0).toLocaleString('es-PE')} pts
                    </small>
                  </div>
                  {isVip && <span className="tt-drw-vip-tag">VIP</span>}
                </div>
              ) : (
                <button
                  type="button"
                  className="tt-drw-login-cta"
                  onClick={() => runDrawerAction(() => onOpenAuth && onOpenAuth('login'))}
                >
                  Iniciar Sesión / Crear Cuenta Gratis
                </button>
              )}

              <div className="tt-drw-toggles">
                <button
                  type="button"
                  className={`tt-drw-toggle-pill ${theme === 'light' ? 'is-on' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    if (onToggleTheme) onToggleTheme();
                  }}
                >
                  <span>{theme === 'light' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}</span>
                </button>

                <button
                  type="button"
                  className={`tt-drw-toggle-pill ${sunlightMode ? 'is-on' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    if (onToggleSunlight) onToggleSunlight();
                  }}
                >
                  <span>{sunlightMode ? '🕶️ Sol Intenso ON' : '🕶️ Sol Intenso'}</span>
                </button>
              </div>

              <div className="tt-drw-scroll">
                <span className="tt-drw-section-lbl">EXPLORAR CIRCUITO</span>
                <div className="tt-drw-list">
                  <button
                    type="button"
                    className={activeTab === 'retos' ? 'is-current' : ''}
                    onClick={() => runDrawerAction(() => onNavigateTab && onNavigateTab('retos'))}
                  >
                    <TTIcon name="challenge" size={17} />
                    <span>Retos y Cartelera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDrawerAction(() => onOpenVipScale && onOpenVipScale('vip'))}
                  >
                    <TTIcon name="crown" size={17} />
                    <span>Pase Socio VIP & Carnet 3D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDrawerAction(() => onOpenVipScale && onOpenVipScale('escala'))}
                  >
                    <TTIcon name="chart" size={17} />
                    <span>Categorías y Reglas</span>
                  </button>
                  <button type="button" onClick={() => runDrawerAction(openShopAction)}>
                    <TTIcon name="shop" size={17} />
                    <span>Tienda Oficial Pro Shop</span>
                  </button>
                  <button type="button" onClick={() => runDrawerAction(openVaultAction)}>
                    <TTIcon name="trophy" size={17} />
                    <span>Mi Bóveda de Gemas ({gemsBalance})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDrawerAction(() => onOpenStories && onOpenStories(null))}
                  >
                    <TTIcon name="share" size={17} />
                    <span>Publicar Victoria (Stories 9:16)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDrawerAction(() => onOpenNotices && onOpenNotices('actualidad'))}
                  >
                    <TTIcon name="news" size={17} />
                    <span>Actualidad Tenis y Marcadores</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDrawerAction(() => onOpenPartnerPortal && onOpenPartnerPortal())}
                  >
                    <TTIcon name="users" size={17} />
                    <span>Portal Aliados (Clubes y Coaches)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDrawerAction(() => onOpenTutorial && onOpenTutorial())}
                  >
                    <TTIcon name="check" size={17} />
                    <span>Guía Rápida en 4 Pasos</span>
                  </button>
                </div>

                <span className="tt-drw-section-lbl" style={{ marginTop: 14 }}>
                  INFORMACIÓN LEGAL (PERÚ)
                </span>
                <div className="tt-drw-list">
                  <button
                    type="button"
                    className="is-legal-book"
                    onClick={() => runDrawerAction(() => onOpenLegal && onOpenLegal('reclamaciones'))}
                  >
                    <TTIcon name="shield" size={17} />
                    <span>Libro de Reclamaciones Virtual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDrawerAction(() => onOpenLegal && onOpenLegal('terms'))}
                  >
                    <TTIcon name="news" size={17} />
                    <span>Términos y Condiciones</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runDrawerAction(() => onOpenLegal && onOpenLegal('privacy'))}
                  >
                    <TTIcon name="shield" size={17} />
                    <span>Política de Privacidad (Ley N° 29733)</span>
                  </button>
                </div>
              </div>

              <div className="tt-drw-foot">
                {currentUser && onLogout && (
                  <button
                    type="button"
                    className="tt-drw-logout"
                    onClick={() => runDrawerAction(onLogout)}
                  >
                    Cerrar sesión
                  </button>
                )}
                <small>© {new Date().getFullYear()} TOTAL TENIS. Todos los derechos reservados.</small>
              </div>
            </aside>
          </div>,
          document.body
        )}

      <style>{`
        /* FLUJO REAL EN FLEXBOX (NUNCA SE MONTA ENCIMA DE PERFIL, SEDES NI RETOS) */
        .tt-hdr-shell {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          z-index: 40;
          flex-shrink: 0;
          width: 100%;
          padding: calc(env(safe-area-inset-top, 0px) + 8px) 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: transparent;
        }
        .tt-hdr-pill {
          width: 100%;
          max-width: var(--tt-container-max, 760px);
          min-height: 48px;
          padding: 4px 6px;
          border-radius: 999px;
          background: #FFFFFF;
          color: #1E0734;
          border: 1px solid rgba(30, 7, 52, 0.1);
          box-shadow: 0 8px 22px rgba(10, 2, 20, 0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          box-sizing: border-box;
        }

        .tt-hdr-left {
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .tt-hdr-icon-btn {
          position: relative;
          z-index: 2;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(30, 7, 52, 0.06);
          color: #1E0734;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          touch-action: manipulation;
          transition: transform 120ms ease;
        }
        .tt-hdr-icon-btn:active {
          transform: scale(0.92);
        }
        .tt-hdr-brand-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          padding: 2px 0;
          flex-shrink: 0;
          cursor: pointer;
          touch-action: manipulation;
        }
        .tt-hdr-logo {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .tt-hdr-wordmark {
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: clamp(0.84rem, 3.3vw, 1.08rem);
          letter-spacing: 0.015em;
          line-height: 1;
          color: #1E0734;
          white-space: nowrap;
        }
        .tt-hdr-wordmark em {
          font-style: italic;
          color: #00A859;
        }

        /* CONTROLES DERECHOS COMPACTOS (CERO DESBORDES EN 360px-430px) */
        .tt-hdr-right {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .tt-hdr-gems-pill {
          height: 30px;
          padding: 0 7px;
          border-radius: 999px;
          background: #1E0734;
          color: #FAF9F5;
          font-size: 0.7rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .tt-hdr-gem-diamond {
          color: #00DC7D;
          font-size: 0.68rem;
          line-height: 1;
        }
        .tt-hdr-shop-pill {
          height: 30px;
          padding: 0 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
          font-size: 0.7rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          white-space: nowrap;
          flex-shrink: 0;
          overflow: hidden;
        }
        .tt-hdr-bell-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: #C85A32;
          color: #FFFFFF;
          font-size: 0.58rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
        }
        .tt-hdr-sponsor-strip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.64rem;
          letter-spacing: 0.08em;
          color: rgba(250, 249, 245, 0.76);
        }
        .tt-hdr-shell.is-light .tt-hdr-sponsor-strip {
          color: rgba(30, 7, 52, 0.72);
        }

        /* MENÚ LATERAL MONTADO EN document.body (z-index 9990) */
        .tt-drw-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9990;
          background: rgba(10, 2, 20, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          justify-content: flex-start;
        }
        .tt-drw-panel {
          width: min(84vw, 330px);
          height: 100%;
          padding: calc(env(safe-area-inset-top, 0px) + 14px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
          background: linear-gradient(180deg, #1E0734 0%, #120321 100%);
          color: #FAF9F5;
          border-right: 1px solid rgba(250, 249, 245, 0.14);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 16px 0 40px rgba(0, 0, 0, 0.48);
          animation: ttDrwSlide 200ms cubic-bezier(0.22, 1, 0.36, 1);
          box-sizing: border-box;
        }
        .tt-drw-panel.is-light {
          background: #FAF9F5;
          color: #1E0734;
          border-right-color: rgba(30, 7, 52, 0.12);
        }
        @keyframes ttDrwSlide {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .tt-drw-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-drw-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .tt-drw-brand strong {
          display: block;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-size: 1.16rem;
          line-height: 1;
        }
        .tt-drw-brand small {
          font-size: 0.66rem;
          opacity: 0.68;
        }
        .tt-drw-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(250, 249, 245, 0.12);
          color: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-drw-panel.is-light .tt-drw-close {
          background: rgba(30, 7, 52, 0.08);
        }

        .tt-drw-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 11px;
          border-radius: 15px;
          background: rgba(250, 249, 245, 0.08);
          border: 1px solid rgba(250, 249, 245, 0.12);
        }
        .tt-drw-panel.is-light .tt-drw-user-card {
          background: #FFFFFF;
          border-color: rgba(30, 7, 52, 0.1);
        }
        .tt-drw-user-card strong {
          display: block;
          font-size: 0.86rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-drw-user-card small {
          display: block;
          font-size: 0.7rem;
          opacity: 0.72;
        }
        .tt-drw-vip-tag {
          padding: 3px 8px;
          border-radius: 999px;
          background: #F59E0B;
          color: #1E1102;
          font-size: 0.62rem;
          font-weight: 900;
        }
        .tt-drw-login-cta {
          min-height: 42px;
          border-radius: 13px;
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
          font-size: 0.8rem;
          font-weight: 900;
        }

        .tt-drw-toggles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }
        .tt-drw-toggle-pill {
          min-height: 36px;
          padding: 0 8px;
          border-radius: 11px;
          background: rgba(250, 249, 245, 0.08);
          border: 1px solid rgba(250, 249, 245, 0.12);
          color: inherit;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .tt-drw-panel.is-light .tt-drw-toggle-pill {
          background: #FFFFFF;
          border-color: rgba(30, 7, 52, 0.12);
        }
        .tt-drw-toggle-pill.is-on {
          border-color: #00DC7D;
          color: #00DC7D;
        }
        .tt-drw-panel.is-light .tt-drw-toggle-pill.is-on {
          background: #1E0734;
          color: #00DC7D;
        }

        .tt-drw-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding-right: 2px;
          -webkit-overflow-scrolling: touch;
        }
        .tt-drw-section-lbl {
          display: block;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #00DC7D;
          margin-bottom: 6px;
        }
        .tt-drw-panel.is-light .tt-drw-section-lbl {
          color: #008A4E;
        }
        .tt-drw-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tt-drw-list button {
          width: 100%;
          min-height: 40px;
          padding: 0 11px;
          border-radius: 12px;
          color: inherit;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          text-align: left;
        }
        .tt-drw-list button:hover,
        .tt-drw-list button.is-current {
          background: rgba(0, 220, 125, 0.14);
          color: #00DC7D;
        }
        .tt-drw-panel.is-light .tt-drw-list button:hover,
        .tt-drw-panel.is-light .tt-drw-list button.is-current {
          background: rgba(30, 7, 52, 0.08);
          color: #1E0734;
        }
        .tt-drw-list button.is-legal-book {
          background: rgba(245, 158, 11, 0.14);
          color: #FDE68A;
        }
        .tt-drw-panel.is-light .tt-drw-list button.is-legal-book {
          background: rgba(245, 158, 11, 0.18);
          color: #92400E;
        }

        .tt-drw-foot {
          padding-top: 10px;
          border-top: 1px solid rgba(250, 249, 245, 0.12);
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-drw-panel.is-light .tt-drw-foot {
          border-top-color: rgba(30, 7, 52, 0.1);
        }
        .tt-drw-logout {
          min-height: 38px;
          border-radius: 11px;
          background: rgba(248, 113, 113, 0.16);
          color: #FCA5A5;
          font-size: 0.78rem;
          font-weight: 800;
        }
        .tt-drw-panel.is-light .tt-drw-logout {
          color: #B91C1C;
        }
        .tt-drw-foot small {
          font-size: 0.65rem;
          opacity: 0.6;
          text-align: center;
        }
      `}</style>
    </>
  );
}
