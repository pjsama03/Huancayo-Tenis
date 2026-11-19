import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ASSETS, IconBadge, SmartImage, TTIcon, triggerHaptic } from './AppIcons';
import { APP_CONFIG, getCategoryByPoints } from '../data/playersAndClubsData';

/* ==========================================================================
   TOTAL TENIS · CABECERA FLOTANTE + MENÚ LATERAL EDITORIAL (3 RAYITAS)
   - Destinos separados en cabecera: 💎 Bóveda de Gemas | 🛍️ Tienda Pro Shop
   - Gesto secreto oculto (5 toques en el logo) para Suite Maestra Admin
   - Drawer en Portal con backdrop-blur profundo y respeto total a Safe Area
   ========================================================================== */
export default function HeaderAndDrawer({
  currentUser,
  partnerSession,
  isDrawerOpen,
  onOpenDrawer,
  onCloseDrawer,
  unreadNoticesCount = 0,
  theme = 'dark',
  onToggleTheme,
  sunlightMode = false,
  onToggleSunlight,
  qualityMode = 'auto',
  onChangeQualityMode,
  onOpenGemsVault,
  onOpenProShop,
  onOpenNotices,
  onOpenStories,
  onOpenVipCard,
  onOpenScaleRules,
  onOpenPartnerPortal,
  onOpenClaimsBook,
  onOpenLegalTerms,
  onOpenAuth,
  onOpenProfileSettings,
  onLogout,
  onSecretAdminTrigger,
  onGoHome,
}) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  // Bloqueo limpio de scroll trasero y cierre con tecla Escape cuando el Drawer está abierto
  useEffect(() => {
    if (!isDrawerOpen || typeof document === 'undefined') return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onCloseDrawer) onCloseDrawer();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow || '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isDrawerOpen, onCloseDrawer]);

  // Gesto secreto de 5 toques en el logo (2.4 s) para abrir Suite Maestra Admin
  const handleBrandTap = () => {
    triggerHaptic('light');
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      triggerHaptic('success');
      if (typeof onSecretAdminTrigger === 'function') {
        onSecretAdminTrigger();
      }
      return;
    }

    tapTimerRef.current = window.setTimeout(() => {
      if (tapCountRef.current === 1 && typeof onGoHome === 'function') {
        onGoHome();
      }
      tapCountRef.current = 0;
    }, 520);
  };

  const userCategory = currentUser ? getCategoryByPoints(currentUser.points) : null;
  const userGems = Number(currentUser?.gems) || 0;

  const runDrawerAction = (fn) => {
    triggerHaptic('light');
    if (onCloseDrawer) onCloseDrawer();
    if (typeof fn === 'function') {
      // Pequeña espera para que el Portal del modal entre limpio sin solapar el cierre
      window.setTimeout(() => fn(), 40);
    }
  };

  const drawerContent =
    isDrawerOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            {/* Fondo difuminado profundo */}
            <div
              className="tt-drawer-backdrop"
              onClick={() => {
                triggerHaptic('light');
                if (onCloseDrawer) onCloseDrawer();
              }}
              aria-hidden="true"
            />

            {/* Panel Lateral Editorial */}
            <aside
              className="tt-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menú principal TOTAL TENIS"
            >
              {/* 1. CABECERA DEL MENÚ EN PÚRPURA NOCHE (SEGURO BAJO ISLA DINÁMICA) */}
              <div className="tt-drawer-header">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <SmartImage
                      src={ASSETS.logo}
                      alt="TOTAL TENIS"
                      priority
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1.5px solid rgba(245, 158, 11, 0.72)',
                      }}
                    />
                    <div>
                      <div
                        className="tt-display-italic"
                        style={{ fontSize: '1.3rem', display: 'flex', gap: 5, lineHeight: 1 }}
                      >
                        <span style={{ color: '#FAF9F5' }}>TOTAL</span>
                        <span style={{ color: '#00DC7D' }}>TENIS</span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'rgba(250, 249, 245, 0.62)',
                        }}
                      >
                        Circuito Oficial
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onCloseDrawer) onCloseDrawer();
                    }}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(250, 249, 245, 0.12)',
                      border: '1px solid rgba(250, 249, 245, 0.2)',
                      color: '#FAF9F5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TTIcon name="close" size={18} />
                  </button>
                </div>

                {/* Tarjeta del Jugador o Invitado en la cabecera */}
                {currentUser ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 16,
                      backgroundColor: 'rgba(250, 249, 245, 0.08)',
                      border: '1px solid rgba(250, 249, 245, 0.14)',
                    }}
                  >
                    <SmartImage
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      initials={currentUser.name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        border: currentUser.isVip
                          ? '2px solid #F59E0B'
                          : '2px solid rgba(0, 220, 125, 0.65)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '0.95rem',
                            color: '#FAF9F5',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 150,
                          }}
                        >
                          {currentUser.name}
                        </strong>
                        {currentUser.isVip ? (
                          <span className="tt-badge-vip">VIP</span>
                        ) : (
                          <span className="tt-badge-standard">ESTÁNDAR</span>
                        )}
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: '0.75rem',
                          color: 'rgba(250, 249, 245, 0.74)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>{userCategory?.name}</span>
                        <span>·</span>
                        <span style={{ color: '#00DC7D', fontWeight: 800 }}>
                          {Number(currentUser.points || 0).toLocaleString('es-PE')} PTS
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => runDrawerAction(() => onOpenAuth && onOpenAuth('register'))}
                  >
                    Crear Cuenta Oficial (+18)
                  </button>
                )}
              </div>

              {/* 2. CUERPO EDITORIAL MARFIL CON ACCESOS MOTIVADORES Y CLAROS */}
              <div className="tt-drawer-scroll">
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(30, 7, 52, 0.56)',
                    padding: '4px 4px 0',
                  }}
                >
                  Tu Circuito TOTAL TENIS
                </span>

                <button
                  type="button"
                  className="tt-drawer-item"
                  onClick={() => runDrawerAction(onOpenStories)}
                >
                  <IconBadge name="stories" variant="emerald" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E0734' }}>
                      Publica tus victorias en Stories
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                      Plantillas oficiales listas para Instagram y WhatsApp
                    </div>
                  </div>
                  <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                </button>

                <button
                  type="button"
                  className="tt-drawer-item"
                  onClick={() => runDrawerAction(onOpenVipCard)}
                >
                  <IconBadge name="crown" variant="gold" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E0734' }}>
                      Carnet Digital Socio VIP & Ahorro
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                      Credencial oficial, descuentos en cancha y +200 Gemas/mes
                    </div>
                  </div>
                  <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                </button>

                <button
                  type="button"
                  className="tt-drawer-item"
                  onClick={() => runDrawerAction(onOpenGemsVault)}
                >
                  <IconBadge name="gem" variant="purple" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E0734' }}>
                      Bóveda y Bitácora de Gemas
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                      Saldo: {userGems.toLocaleString('es-PE')} Gemas · 20 Gemas = S/ 1.00
                    </div>
                  </div>
                  <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                </button>

                <button
                  type="button"
                  className="tt-drawer-item"
                  onClick={() => runDrawerAction(onOpenProShop)}
                >
                  <IconBadge name="shop" variant="emerald" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E0734' }}>
                      Tienda Oficial Pro Shop
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                      Pelotas, encordados, escenarios de perfil y distintivos
                    </div>
                  </div>
                  <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                </button>

                <button
                  type="button"
                  className="tt-drawer-item"
                  onClick={() => runDrawerAction(onOpenScaleRules)}
                >
                  <IconBadge name="chart" variant="clay" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E0734' }}>
                      Escala de Categorías y Reglamento
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                      De 5ª P a 2ª Libre, 4 Temporadas y Master Top 8
                    </div>
                  </div>
                  <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                </button>

                <button
                  type="button"
                  className="tt-drawer-item"
                  onClick={() => runDrawerAction(onOpenPartnerPortal)}
                >
                  <IconBadge name="users" variant="purple" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E0734' }}>
                      {partnerSession
                        ? `Mi Estudio Aliado (${partnerSession.role === 'coach' ? 'Coach' : 'Club'})`
                        : 'Portal Aliados (Clubes & Coaches)'}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                      Gestiona videos en cancha, cupos grupales y promos valle
                    </div>
                  </div>
                  <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                </button>

                {currentUser && (
                  <button
                    type="button"
                    className="tt-drawer-item"
                    onClick={() => runDrawerAction(onOpenProfileSettings)}
                  >
                    <IconBadge name="settings" variant="purple" size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E0734' }}>
                        Ajustes de Perfil y Privacidad
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                        Club sede, visibilidad de WhatsApp y foto de portada
                      </div>
                    </div>
                    <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                  </button>
                )}

                {/* 3. APARIENCIA Y RENDIMIENTO ADAPTATIVO EN CANCHA */}
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(30, 7, 52, 0.56)',
                    padding: '10px 4px 0',
                  }}
                >
                  Pantalla y Rendimiento Móvil
                </span>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 18,
                    border: '1px solid rgba(30, 7, 52, 0.08)',
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {/* Conmutador Tema Oscuro / Claro */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <TTIcon
                        name={theme === 'dark' ? 'moon' : 'sun'}
                        size={19}
                        style={{ color: '#1E0734' }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.83rem', color: '#1E0734' }}>
                          Tema Visual
                        </div>
                        <div style={{ fontSize: '0.71rem', color: 'rgba(30, 7, 52, 0.6)' }}>
                          {theme === 'dark' ? 'Púrpura Noche (Oscuro)' : 'Marfil Editorial (Claro)'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        if (onToggleTheme) onToggleTheme();
                      }}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 999,
                        backgroundColor: '#1E0734',
                        color: '#00DC7D',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                      }}
                    >
                      {theme === 'dark' ? 'Cambiar a Claro' : 'Cambiar a Oscuro'}
                    </button>
                  </div>

                  {/* Conmutador Sol Intenso */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      paddingTop: 8,
                      borderTop: '1px solid rgba(30, 7, 52, 0.07)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1E0734' }}>
                        Modo Sol Intenso en Cancha
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(30, 7, 52, 0.6)' }}>
                        Refuerza el contraste al mediodía
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        if (onToggleSunlight) onToggleSunlight();
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        backgroundColor: sunlightMode ? '#00DC7D' : 'rgba(30, 7, 52, 0.08)',
                        color: '#1E0734',
                        fontWeight: 800,
                        fontSize: '0.74rem',
                      }}
                    >
                      {sunlightMode ? 'Activo' : 'Desactivado'}
                    </button>
                  </div>

                  {/* Selector Calidad Visual (Auto / Ultra 120Hz / Cero Lag) */}
                  <div
                    style={{
                      paddingTop: 8,
                      borderTop: '1px solid rgba(30, 7, 52, 0.07)',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        color: '#1E0734',
                        marginBottom: 6,
                      }}
                    >
                      Calidad Gráfica del Celular
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      {[
                        { id: 'auto', label: 'Automático' },
                        { id: 'ultra', label: 'Ultra 120Hz' },
                        { id: 'lite', label: 'Cero Lag' },
                      ].map((opt) => {
                        const active = qualityMode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              if (onChangeQualityMode) onChangeQualityMode(opt.id);
                            }}
                            style={{
                              padding: '7px 4px',
                              borderRadius: 10,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              backgroundColor: active ? '#1E0734' : 'rgba(30, 7, 52, 0.06)',
                              color: active ? '#00DC7D' : '#1E0734',
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. BLOQUE LEGAL PERÚ OBLIGATORIO (INDECOPI & LEY N° 29733) */}
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(30, 7, 52, 0.56)',
                    padding: '10px 4px 0',
                  }}
                >
                  Respaldo Legal · Perú
                </span>

                <button
                  type="button"
                  className="tt-drawer-item"
                  onClick={() => runDrawerAction(onOpenClaimsBook)}
                >
                  <IconBadge name="claimsBook" variant="clay" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#1E0734' }}>
                      Libro de Reclamaciones Virtual
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                      Código de Protección al Consumidor · Indecopi
                    </div>
                  </div>
                  <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                </button>

                <button
                  type="button"
                  className="tt-drawer-item"
                  onClick={() => runDrawerAction(onOpenLegalTerms)}
                >
                  <IconBadge name="shield" variant="purple" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#1E0734' }}>
                      Términos y Política de Privacidad
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(30, 7, 52, 0.64)' }}>
                      Protección de Datos Personales · Ley N° 29733
                    </div>
                  </div>
                  <TTIcon name="chevronRight" size={18} style={{ color: 'rgba(30, 7, 52, 0.4)' }} />
                </button>

                {/* 5. ACCIÓN DE SESIÓN Y PIE DE MARCA */}
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentUser ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => runDrawerAction(() => onOpenAuth && onOpenAuth('login'))}
                        style={{
                          minHeight: 42,
                          borderRadius: 12,
                          backgroundColor: 'rgba(30, 7, 52, 0.08)',
                          color: '#1E0734',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                        }}
                      >
                        Cambiar Cuenta
                      </button>
                      <button
                        type="button"
                        onClick={() => runDrawerAction(onLogout)}
                        style={{
                          minHeight: 42,
                          borderRadius: 12,
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#B91C1C',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                        }}
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="tt-btn tt-btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => runDrawerAction(() => onOpenAuth && onOpenAuth('login'))}
                    >
                      Iniciar Sesión en TOTAL TENIS
                    </button>
                  )}

                  <p
                    style={{
                      margin: '6px 0 0',
                      textAlign: 'center',
                      fontSize: '0.68rem',
                      color: 'rgba(30, 7, 52, 0.52)',
                      lineHeight: 1.4,
                    }}
                  >
                    {APP_CONFIG.copyright}
                    <br />
                    Versión {APP_CONFIG.version} · Motor Adaptativo Universal
                  </p>
                </div>
              </div>
            </aside>
          </>,
          document.body
        )
      : null;

  return (
    <>
      {/* CABECERA FLOTANTE PRINCIPAL */}
      <header className="tt-header-wrap">
        <div className="tt-header-bar">
          {/* Izquierda: Menú 3 Rayitas + Logo TOTAL TENIS (con gesto secreto Admin) */}
          <div className="tt-header-left">
            <button
              type="button"
              className="tt-header-icon-btn"
              aria-label="Abrir menú lateral"
              onClick={() => {
                triggerHaptic('light');
                if (onOpenDrawer) onOpenDrawer();
              }}
            >
              <TTIcon name="menu" size={21} />
            </button>

            <button
              type="button"
              className="tt-brand-trigger"
              onClick={handleBrandTap}
              aria-label="TOTAL TENIS Inicio"
            >
              <SmartImage
                src={ASSETS.logo}
                alt="TOTAL TENIS"
                priority
                className="tt-brand-logo-img"
              />
              <span className="tt-brand-wordmark">
                <span className="tt-word-total">TOTAL</span>
                <span className="tt-word-tenis">TENIS</span>
              </span>
            </button>
          </div>

          {/* Derecha: Destinos Separados (💎 Bóveda | Tienda Pro Shop | Campana Avisos) */}
          <div className="tt-header-right">
            <button
              type="button"
              className="tt-gems-pill"
              aria-label="Abrir Bóveda y Bitácora de Gemas"
              onClick={() => {
                triggerHaptic('light');
                if (onOpenGemsVault) onOpenGemsVault();
              }}
            >
              <TTIcon name="gem" size={16} />
              <span>{userGems.toLocaleString('es-PE')}</span>
            </button>

            <button
              type="button"
              className="tt-shop-pill"
              aria-label="Abrir Tienda Oficial Pro Shop"
              onClick={() => {
                triggerHaptic('light');
                if (onOpenProShop) onOpenProShop();
              }}
            >
              <TTIcon name="shop" size={16} />
              <span className="tt-shop-label">Tienda</span>
            </button>

            <button
              type="button"
              className="tt-header-icon-btn"
              aria-label="Abrir Centro de Avisos y Noticias en Vivo"
              onClick={() => {
                triggerHaptic('light');
                if (onOpenNotices) onOpenNotices();
              }}
            >
              <TTIcon name="bell" size={19} />
              {unreadNoticesCount > 0 && <span className="tt-notif-dot" />}
            </button>
          </div>
        </div>
      </header>

      {drawerContent}
    </>
  );
}
