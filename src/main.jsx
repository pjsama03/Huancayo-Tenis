import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/* ==========================================================================
   CARGA AUTOMÁTICA DE TODAS LAS HOJAS DE ESTILO (src/styles/*.css)
   ========================================================================== */
import.meta.glob('./styles/*.css', { eager: true });
import.meta.glob('./*.css', { eager: true });

/* ==========================================================================
   CALIBRADOR DE PANTALLA, TECLADO Y ALTURA REAL IPHONE PWA (SIN GAP INFERIOR)
   ========================================================================== */
function initViewportCalibration() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const html = document.documentElement;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  const syncMetrics = () => {
    const isStandalone =
      window.navigator.standalone === true ||
      Boolean(
        window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
      );
    html.setAttribute('data-standalone', isStandalone ? 'true' : 'false');

    const vv = window.visualViewport;
    const width = vv ? vv.width : window.innerWidth;
    const rawHeight = vv ? vv.height : window.innerHeight;

    // Detección de teclado virtual abierto
    const keyboardOpen = Boolean(vv && window.innerHeight - vv.height > 140);
    html.setAttribute('data-keyboard', keyboardOpen ? 'open' : 'closed');

    // En iPhone PWA (standalone + black-translucent), WebKit a veces resta ~59px
    // (Isla Dinámica) a innerHeight/100dvh, levantando el dock y dejando un hueco abajo.
    // Con teclado cerrado, tomamos la altura física real de pantalla.
    let effectiveHeight = rawHeight;
    if (isStandalone && isIOS && !keyboardOpen && window.screen) {
      const isPortrait = window.innerHeight >= window.innerWidth;
      const fullScreenH = isPortrait
        ? Math.max(window.screen.height, window.screen.width)
        : Math.min(window.screen.height, window.screen.width);
      if (fullScreenH > rawHeight && fullScreenH - rawHeight <= 110) {
        effectiveHeight = fullScreenH;
      }
    }

    const roundedH = Math.round(effectiveHeight);
    html.style.setProperty('--tt-app-h', `${roundedH}px`);
    html.style.setProperty('--tt-dvh', `${roundedH}px`);
    html.style.setProperty('--tt-vh', `${(effectiveHeight * 0.01).toFixed(4)}px`);

    const screenProfile =
      width < 375 ? 'compact' : width >= 768 ? 'desktop' : 'standard';
    html.setAttribute('data-screen', screenProfile);
  };

  syncMetrics();
  window.addEventListener('resize', syncMetrics, { passive: true });
  window.addEventListener('orientationchange', syncMetrics, { passive: true });
  window.addEventListener('pageshow', syncMetrics, { passive: true });
  window.addEventListener('focus', syncMetrics, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncMetrics, { passive: true });
  }
}

/* ==========================================================================
   ESCUDO DE RECUPERACIÓN (ERROR BOUNDARY CON IDENTIDAD TOTAL TENIS)
   ========================================================================== */
class TotalTenisErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error inesperado de renderizado.',
    };
  }

  componentDidCatch(error, info) {
    console.error('[TOTAL TENIS Recovery]', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCacheAndReload = () => {
    try {
      window.localStorage.removeItem('tt_total_tenis_state_v2');
      window.localStorage.removeItem('tt_partner_studio_state_v1');
    } catch {
      // continuar
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: 'linear-gradient(180deg, #1E0734 0%, #120321 100%)',
          color: '#FAF9F5',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 24,
            padding: 24,
            background: '#290C46',
            border: '1.5px solid rgba(0, 220, 125, 0.45)',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.48)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <img
            src="/assets/logo-total-tenis.png"
            alt="TOTAL TENIS"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #00DC7D',
            }}
          />

          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
              color: '#00DC7D',
              textTransform: 'uppercase',
            }}
          >
            TOTAL TENIS · RECUPERACIÓN SEGURA
          </span>

          <h1
            style={{
              margin: 0,
              fontFamily: "'Antonio', 'Outfit', sans-serif",
              fontSize: '1.6rem',
              lineHeight: 1.05,
            }}
          >
            Ajustando la cancha...
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: '0.84rem',
              lineHeight: 1.48,
              color: 'rgba(250, 249, 245, 0.8)',
            }}
          >
            Detectamos un dato antiguo en la memoria de tu navegador. Toca abajo para recargar al instante sin afectar el circuito.
          </p>

          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                width: '100%',
                minHeight: 46,
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(90deg, #00A859 0%, #00DC7D 100%)',
                color: '#120321',
                fontWeight: 900,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              Recargar TOTAL TENIS
            </button>

            <button
              type="button"
              onClick={this.handleResetCacheAndReload}
              style={{
                width: '100%',
                minHeight: 42,
                borderRadius: 999,
                border: '1px solid rgba(250, 249, 245, 0.28)',
                background: 'rgba(250, 249, 245, 0.08)',
                color: '#FAF9F5',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Limpiar caché local y reiniciar
            </button>
          </div>
        </div>
      </div>
    );
  }
}

initViewportCalibration();

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <TotalTenisErrorBoundary>
        <App />
      </TotalTenisErrorBoundary>
    </React.StrictMode>
  );
}
