import React, { useState } from 'react';
import {
  ASSETS,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from './AppIcons';
import { APP_CONFIG } from '../data/playersAndClubsData';
import { buildWhatsAppLink } from '../utils/tenisEngine';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (REDES SOCIALES, BRANDING Y ENLACES DEL FOOTER)
   --------------------------------------------------------------------------
- Reemplaza cada `url` conforme crees las cuentas oficiales de TOTAL TENIS.
- Si un link está vacío '', el botón avisará suavemente que el canal está
     próximo a estrenarse sin abrir enlaces rotos.
   ========================================================================== */
export const SOCIAL_LINKS_CONFIG = [
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://www.tiktok.com/',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com/',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/',
  },
  {
    id: 'x',
    name: 'X',
    url: 'https://x.com/',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Oficial',
    url: buildWhatsAppLink(
      APP_CONFIG.supportWhatsApp || '964812340',
      'Hola equipo TOTAL TENIS, les escribo desde la app oficial del circuito.'
    ),
  },
];

/* ==========================================================================
   ICONOS VECTORIALES NÍTIDOS PARA LOS 6 BOTONES CIRCULARES DE REDES
   ========================================================================== */
function SocialVectorGlyph({ id }) {
  switch (id) {
    case 'instagram':
      return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14 4V14.5C14 16.98 11.98 19 9.5 19C7.02 19 5 16.98 5 14.5C5 12.02 7.02 10 9.5 10C10 10 10.5 10.08 11 10.24M14 4C14.8 6.4 16.8 8.2 19.5 8.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'facebook':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14 8H16.8V4.5H13.6C10.9 4.5 9.5 6.1 9.5 8.8V11H7V14.5H9.5V20H13.2V14.5H16.1L16.7 11H13.2V9.1C13.2 8.3 13.5 8 14 8Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'youtube':
      return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M10.2 9.4L15.4 12L10.2 14.6V9.4Z" fill="currentColor" />
        </svg>
      );
    case 'x':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4.5 4.5L19.5 19.5M19.5 4.5L4.5 19.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'whatsapp':
    default:
      return <TTIcon name="whatsapp" size={19} />;
  }
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: InstitutionalFooter (BLOQUE 24A DE 26)
   Estructura de 3 Niveles:
1. Píldora Blanca Superior (Instalación App PWA + 6 Redes con Aura Esmeralda)
2. 3 Columnas Editoriales sobre Púrpura Noche (#1E0734)
3. Barra Legal Inferior (Logo + Indecopi/Privacidad/Términos + Copyright)
   ========================================================================== */
export default function InstitutionalFooter({
  sponsorsConfig = null,
  onNavigateTab,
  onOpenProShop,
  onOpenVipScale,
  onOpenStories,
  onOpenNews,
  onOpenPartnerPortal,
  onOpenLegal,
  onOpenTutorial,
  onOpenSupport,
  onNotify,
}) {
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  const activeSponsorName =
    sponsorsConfig?.titleSponsorActive && sponsorsConfig?.titleSponsorName
      ? sponsorsConfig.titleSponsorName
      : '';

  const handleSocialClick = (e, network) => {
    triggerHaptic('light');
    if (!network.url) {
      e.preventDefault();
      if (onNotify) {
        onNotify(`Canal oficial de ${network.name} TOTAL TENIS próximamente disponible.`, 'info');
      }
    }
  };

  const scrollToTopAndGo = (tabId) => {
    triggerHaptic('light');
    if (onNavigateTab) onNavigateTab(tabId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="tt-inst-footer" aria-label="Pie de página institucional TOTAL TENIS">
        <div className="tt-if-container">
          {/* ================================================================
              NIVEL 1: PÍLDORA BLANCA FLOTANTE (INSTALA LA APP + 6 REDES)
              ================================================================ */}
          <div className="tt-if-white-pill">
            <div className="tt-if-wp-left">
              <span className="tt-if-wp-kicker">COMUNIDAD OFICIAL</span>
              <div className="tt-if-wp-title-row">
                <strong>SÍGUENOS E INSTALA LA APP</strong>
                <button
                  type="button"
                  className="tt-if-pwa-badge"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowPwaGuide(true);
                  }}
                >
                  iPhone / Android PWA
                </button>
              </div>
            </div>

            {/* 6 Botones Circulares (44px × 44px · #23083C -> Aura #00DC7D al hover/tap) */}
            <div className="tt-if-socials-row" aria-label="Redes sociales oficiales">
              {SOCIAL_LINKS_CONFIG.map((net) => (
                <a
                  key={net.id}
                  href={net.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tt-if-social-circle"
                  aria-label={net.name}
                  title={net.name}
                  onClick={(e) => handleSocialClick(e, net)}
                >
                  <SocialVectorGlyph id={net.id} />
                </a>
              ))}
            </div>
          </div>

          {/* ================================================================
              NIVEL 2: 3 COLUMNAS SOBRE PÚRPURA NOCHE (#1E0734)
              ================================================================ */}
          <div className="tt-if-columns">
            {/* Columna 1: EL CIRCUITO */}
            <div className="tt-if-col">
              <h4>EL CIRCUITO</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => scrollToTopAndGo('sedes')}>
                    Sedes Aliadas y Clima
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenVipScale) onOpenVipScale('escala');
                    }}
                  >
                    Escala y Reglamento
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenPartnerPortal) onOpenPartnerPortal();
                    }}
                  >
                    Portal Aliados (Clubes y Coaches)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenSupport) onOpenSupport();
                    }}
                  >
                    Centro de Ayuda y Soporte
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenTutorial) onOpenTutorial();
                    }}
                  >
                    Guía Rápida en 4 Pasos
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 2: MULTIMEDIA */}
            <div className="tt-if-col">
              <h4>MULTIMEDIA</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => scrollToTopAndGo('sedes')}>
                    TOTAL TENIS Vision IA
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenStories) onOpenStories();
                    }}
                  >
                    Publica tus victorias en Stories
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenNews) onOpenNews('actualidad');
                    }}
                  >
                    Actualidad Tenis en Vivo
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenNews) onOpenNews('marcadores');
                    }}
                  >
                    Marcadores ATP / WTA
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 3: ENLACES */}
            <div className="tt-if-col">
              <h4>ENLACES</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => scrollToTopAndGo('ranking')}>
                    Ranking Oficial
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToTopAndGo('torneos')}>
                    Master Top 8 Finals
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToTopAndGo('torneos')}>
                    Salón de la Fama
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenProShop) onOpenProShop('shop');
                    }}
                  >
                    Tienda Oficial Pro Shop
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* ================================================================
              NIVEL 3: BARRA LEGAL INFERIOR (LOGO + INDECOPI + COPYRIGHT)
              ================================================================ */}
          <div className="tt-if-legal-bar">
            <div className="tt-if-brand-foot">
              <SmartImage
                src={ASSETS.logoBlanco || ASSETS.logo}
                alt="TOTAL TENIS"
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span className="tt-if-brand-name">
                TOTAL TENIS
                {activeSponsorName ? `  |  ${activeSponsorName}` : ''}
              </span>
            </div>

            <div className="tt-if-legal-links">
              <button
                type="button"
                className="is-help"
                onClick={() => {
                  triggerHaptic('light');
                  if (onOpenSupport) onOpenSupport();
                }}
              >
                Centro de Ayuda
              </button>
              <button
                type="button"
                className="is-book"
                onClick={() => {
                  triggerHaptic('light');
                  if (onOpenLegal) onOpenLegal('reclamaciones');
                }}
              >
                Libro de Reclamaciones
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  if (onOpenLegal) onOpenLegal('terms');
                }}
              >
                Términos y Condiciones
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  if (onOpenLegal) onOpenLegal('privacy');
                }}
              >
                Privacidad (Ley N° 29733)
              </button>
            </div>

            <small className="tt-if-copy">
              © {new Date().getFullYear()} TOTAL TENIS. Todos los derechos reservados.
            </small>
          </div>
        </div>
      </footer>

      {/* Modal Rápido de Instalación en Pantalla de Inicio (iPhone Safari / Android) */}
      <ModalPortal
        isOpen={showPwaGuide}
        onClose={() => setShowPwaGuide(false)}
        title="Instala TOTAL TENIS en tu Celular"
        subtitle="Ábrela a pantalla completa como app nativa sin ocupar espacio"
        icon={
          <SmartImage
            src={ASSETS.logo}
            alt="TOTAL TENIS"
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
          />
        }
        isTopLayer
      >
        <div className="tt-pwa-guide-stack">
          <div className="tt-pwa-box">
            <span className="tt-pwa-kicker">EN IPHONE (SAFARI)</span>
            <ol>
              <li>Abre TOTAL TENIS desde el navegador <strong>Safari</strong>.</li>
              <li>Toca el botón inferior <strong>Compartir</strong> (cuadrado con flecha hacia arriba).</li>
              <li>Desliza y elige <strong>«Agregar a pantalla de inicio»</strong>.</li>
            </ol>
          </div>

          <div className="tt-pwa-box">
            <span className="tt-pwa-kicker">EN ANDROID (CHROME)</span>
            <ol>
              <li>Toca el menú de <strong>3 puntos (⋮)</strong> arriba a la derecha.</li>
              <li>Selecciona <strong>«Instalar aplicación»</strong> o <strong>«Agregar a pantalla principal»</strong>.</li>
              <li>¡Listo! Tendrás el ícono oficial de TOTAL TENIS con alertas activas.</li>
            </ol>
          </div>
        </div>
      </ModalPortal>

      <style>{`
        .tt-inst-footer {
          margin-top: 26px;
          border-radius: 26px;
          padding: 18px 16px 20px;
          background: linear-gradient(180deg, #1E0734 0%, #120321 100%);
          color: #FAF9F5;
          border: 1px solid rgba(250, 249, 245, 0.12);
          box-shadow: 0 18px 40px rgba(8, 1, 18, 0.34);
        }
        .tt-if-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* NIVEL 1: PÍLDORA BLANCA FLOTANTE */
        .tt-if-white-pill {
          border-radius: 24px;
          padding: 14px 16px;
          background: #FFFFFF;
          color: #1E0734;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 12px 28px rgba(8, 1, 18, 0.28);
        }
        @media (min-width: 720px) {
          .tt-if-white-pill {
            border-radius: 999px;
            padding: 12px 20px;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .tt-if-wp-kicker {
          display: block;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #008A4E;
        }
        .tt-if-wp-title-row {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 2px;
        }
        .tt-if-wp-title-row strong {
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: 0.03em;
          color: #23083C;
        }
        .tt-if-pwa-badge {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.16);
          border: 1px solid rgba(0, 138, 78, 0.35);
          color: #007542;
          font-size: 0.66rem;
          font-weight: 900;
        }

        .tt-if-socials-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-if-social-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #23083C;
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background-color 200ms ease, color 200ms ease,
            transform 220ms cubic-bezier(0.22, 1.32, 0.36, 1),
            box-shadow 220ms ease;
        }
        .tt-if-social-circle:hover,
        .tt-if-social-circle:focus-visible {
          background: #00DC7D;
          color: #1E0734;
          transform: scale(1.12);
          box-shadow: 0 0 18px rgba(0, 220, 125, 0.55);
          outline: none;
        }
        .tt-if-social-circle:active {
          transform: scale(0.95);
        }

        /* NIVEL 2: 3 COLUMNAS SOBRE PÚRPURA NOCHE */
        .tt-if-columns {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          padding: 4px 4px 0;
        }
        @media (min-width: 600px) {
          .tt-if-columns {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .tt-if-col h4 {
          margin: 0 0 9px;
          font-family: var(--tt-font-display);
          font-size: 1rem;
          letter-spacing: 0.08em;
          color: #00DC7D;
        }
        .tt-if-col ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-if-col button {
          padding: 2px 0;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(250, 249, 245, 0.82);
          text-align: left;
          transition: color 160ms ease, transform 160ms ease;
        }
        .tt-if-col button:hover {
          color: #00DC7D;
          transform: translateX(3px);
        }

        /* NIVEL 3: BARRA LEGAL INFERIOR */
        .tt-if-legal-bar {
          padding-top: 14px;
          border-top: 1px solid rgba(250, 249, 245, 0.14);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (min-width: 720px) {
          .tt-if-legal-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
          }
        }
        .tt-if-brand-foot {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .tt-if-brand-name {
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 1.08rem;
          letter-spacing: 0.05em;
          color: #FAF9F5;
        }
        .tt-if-legal-links {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tt-if-legal-links button {
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(250, 249, 245, 0.76);
        }
        .tt-if-legal-links button.is-help {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.16);
          border: 1px solid rgba(0, 220, 125, 0.48);
          color: #7CF5C0;
          font-weight: 800;
        }
        .tt-if-legal-links button.is-book {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.18);
          border: 1px solid rgba(245, 158, 11, 0.5);
          color: #FDE68A;
          font-weight: 800;
        }
        .tt-if-copy {
          font-size: 0.7rem;
          color: rgba(250, 249, 245, 0.56);
        }

        /* Guía PWA */
        .tt-pwa-guide-stack {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-pwa-box {
          padding: 13px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-pwa-kicker {
          display: block;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
          margin-bottom: 6px;
        }
        .tt-pwa-box ol {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 0.8rem;
          line-height: 1.42;
        }
      `}</style>
    </>
  );
}
