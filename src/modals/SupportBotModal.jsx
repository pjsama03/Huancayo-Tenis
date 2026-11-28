import React, { useMemo, useRef, useState } from 'react';
import {
  IconBadge,
  ModalPortal,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import { APP_CONFIG } from '../data/playersAndClubsData';
import { buildWhatsappLink } from '../utils/cloudService';

const SUPPORT_EMAIL = 'soporte.totaltenis@gmail.com';

/* ==========================================================================
   BASE DE CONOCIMIENTO OFICIAL (LENGUAJE NATURAL · CERO EQUIVALENCIA S/ GEMAS)
   ========================================================================== */
const HELP_CATEGORIES = [
  {
    id: 'elo',
    title: 'Puntos y Ranking',
    subtitle: 'Calibración, categorías y temporadas',
    icon: 'chart',
    variant: 'emerald',
    items: [
      {
        id: 'elo-calib',
        q: '¿Por qué aparezco en «Calibrando» y no en el Ranking Oficial?',
        a: 'Tus primeros 5 partidos oficiales son de prueba para ubicarte en tu categoría real (de 5ª P a 2ª Libre) con mayor velocidad. Apenas completes el 5º partido oficial, entras automáticamente al Ranking Oficial y tu barra de prueba desaparece.',
        action: { label: 'Ver Escala de Categorías', type: 'escala' },
      },
      {
        id: 'elo-rematch',
        q: '¿Qué pasa si juego varias veces contra el mismo rival?',
        a: 'Dentro de la misma semana (de lunes a domingo, hora Perú), el 1er duelo cuenta al 100%, la revancha al 75% y del 3er duelo en adelante al 50%. Si pactas un partido contra ese mismo jugador para otra semana, vuelve a valer 100% automáticamente.',
        action: { label: 'Ir a Retos', type: 'tab', value: 'retos' },
      },
      {
        id: 'elo-season',
        q: '¿Cómo funciona el cierre de temporada y el Master Top 8?',
        a: 'El año tiene 4 temporadas. Al cerrar cada temporada a la medianoche (hora Perú), tu puntaje se guarda en la Carrera Anual y arrancas la nueva temporada en el piso de tu categoría actual (sin bajar de división). Los 8 mejores del año clasifican al Master Top 8 con inscripción S/ 0.',
        action: { label: 'Ver Master Top 8', type: 'master' },
      },
      {
        id: 'elo-inactivity',
        q: '¿Pierdo puntos si no juego por lesión o viaje?',
        a: 'Quienes tienen menos de 2,000 pts nunca pierden puntos por inactividad. Por encima de 2,000 pts (o Top 20), la cuota mensual es de 4 partidos (o 2 si hay pocos rivales cerca). Si te lesionas o viajas, puedes pedir el Escudo de Pausa (1 por temporada, hasta 30 días).',
        action: { label: 'Escribir a Soporte', type: 'human', topic: 'Solicitud de Escudo de Pausa' },
      },
    ],
  },
  {
    id: 'retos',
    title: 'Retos y Árbitros',
    subtitle: 'Cambiar hora, 6 h límite y Modo Árbitro',
    icon: 'challenge',
    variant: 'purple',
    items: [
      {
        id: 'ret-resched',
        q: '¿Hasta cuándo puedo cambiar la hora de un partido?',
        a: 'Puedes proponer 1 cambio de hora hasta 24 horas antes del inicio; el cambio se aplica cuando tu rival acepta (doble acuerdo). Además, el sistema evita que pactes dos partidos superpuestos dentro de un margen de 90 minutos.',
        action: { label: 'Ver Tus Desafíos', type: 'tab', value: 'retos' },
      },
      {
        id: 'ret-judge',
        q: '¿Cómo funciona el botón «Designar Árbitro»?',
        a: 'Cuando faltan menos de 24 horas para empezar, aparece el botón «Designar Árbitro» para los 2 jugadores. La persona elegida lleva el marcador en vivo game por game y, al terminar, el resultado pasa a revisión para que ambos jugadores lo confirmen.',
        action: { label: 'Ir a Cartelera', type: 'tab', value: 'retos' },
      },
      {
        id: 'ret-6h',
        q: '¿Qué pasa si olvidamos subir el marcador después de jugar?',
        a: 'Sin árbitro designado tienes hasta 6 horas desde la hora pactada para cargar el marcador final. Si pasan las 6 horas sin resultado, el encuentro expira automáticamente sin penalidad para nadie.',
      },
      {
        id: 'ret-confirm',
        q: 'Subí el resultado, ¿por qué aún no cambian mis puntos?',
        a: 'Para cuidar la transparencia del circuito, el otro jugador recibe un aviso para confirmar el marcador. Apenas lo confirma, tus puntos, Gemas y posición en el Ranking se actualizan en vivo (o tras 24 horas si no hubo objeción).',
      },
    ],
  },
  {
    id: 'disputas',
    title: 'Disputas e Impugnación',
    subtitle: 'Marcador equivocado o desacuerdo',
    icon: 'shield',
    variant: 'clay',
    items: [
      {
        id: 'dis-how',
        q: 'Mi rival subió un marcador incorrecto, ¿qué hago?',
        a: 'En la alerta o tarjeta del partido toca «No estoy de acuerdo · Impugnar», elige el motivo y escribe el marcador real que reclamas. El partido queda congelado al instante sin mover puntos hasta que el Comité revise con ambos.',
        action: { label: 'Revisar mis partidos', type: 'tab', value: 'retos' },
      },
      {
        id: 'dis-resolve',
        q: '¿Cómo resuelve el Comité una disputa?',
        a: 'El Comité contacta a los dos jugadores (y al árbitro si hubo uno) y puede: confirmar el marcador original, corregir el resultado oficial, reabrir el partido como programado o anularlo sin impacto en puntos.',
      },
    ],
  },
  {
    id: 'gems',
    title: 'Gemas, Tienda y VIP',
    subtitle: 'Premios en cancha y Carnet Digital 3D',
    icon: 'crown',
    variant: 'gold',
    items: [
      {
        id: 'gem-earn',
        q: '¿Cómo gano Gemas dentro de TOTAL TENIS?',
        a: 'Sumas Gemas ganando partidos oficiales (cuanto más contundente el marcador, hasta 6-0 6-0, más Gemas recibes), manteniendo rachas de 3+ victorias, venciendo a rivales de categoría superior (Mata Gigantes) y reportando el clima en tu sede (+3 💎).',
        action: { label: 'Abrir mi Bóveda de Gemas', type: 'vault' },
      },
      {
        id: 'gem-shop',
        q: '¿Para qué sirven las Gemas y cómo las canjeo?',
        a: 'Puedes canjear tus Gemas en el Almacén TOTAL TENIS del Pro Shop por pelotas, grips, accesorios, fondos de perfil y Masterclasses de coaches. En Marcas Aliadas, además, puedes reclamar Gemas de recompensa tras tu compra.',
        action: { label: 'Ir al Pro Shop', type: 'shop' },
      },
      {
        id: 'gem-vip',
        q: '¿Cómo uso mis descuentos Socio VIP en los clubes?',
        a: 'No necesitas ningún código. Solo abre tu Carnet Digital 3D desde el menú o tu perfil y muéstralo en recepción del club aliado para recibir tu tarifa preferencial de cancha y beneficios VIP.',
        action: { label: 'Ver Pase Socio VIP', type: 'vip' },
      },
    ],
  },
  {
    id: 'cuenta',
    title: 'Cuenta, Menores y Legal',
    subtitle: 'Claves, tutela -18, ARCO e Indecopi',
    icon: 'users',
    variant: 'emerald',
    items: [
      {
        id: 'acc-pass',
        q: 'Olvidé mi contraseña o mi correo de acceso',
        a: 'En la pantalla de Iniciar Sesión toca «¿Olvidaste tu contraseña?» para recibir un enlace seguro en tu correo, o usa la opción de recuperar correo con tu celular de 9 dígitos.',
        action: { label: 'Abrir Inicio de Sesión', type: 'auth' },
      },
      {
        id: 'acc-minor',
        q: '¿Cómo inscribo a mi hijo menor de 18 años?',
        a: 'Las cuentas titulares son para mayores de 18 años. Desde tu pestaña Perfil puedes crear hasta 3 subcuentas juveniles tuteladas (-18) bajo tu control; toda coordinación por WhatsApp y retos llega siempre al padre o madre. Al cumplir 18 puede emanciparse con código TT-LIB conservando el 100% de sus puntos.',
        action: { label: 'Ir a mi Perfil', type: 'tab', value: 'perfil' },
      },
      {
        id: 'acc-legal',
        q: 'Quiero presentar un reclamo (Indecopi) o ejercer Derechos ARCO',
        a: 'Tienes acceso permanente al Libro de Reclamaciones Virtual (plazo legal máx. 15 días hábiles) y a la Política de Privacidad bajo la Ley N° 29733. También puedes escribir directamente a soporte.totaltenis@gmail.com.',
        action: { label: 'Abrir Libro de Reclamaciones', type: 'legal', value: 'reclamaciones' },
      },
    ],
  },
  {
    id: 'aliados',
    title: 'Clubes y Coaches',
    subtitle: 'Escaparate Pro, clases y reservas',
    icon: 'club',
    variant: 'purple',
    items: [
      {
        id: 'ali-coach',
        q: 'Soy entrenador o club, ¿cómo publico mis horarios y vitrina?',
        a: 'Ingresa al Portal Aliados desde el menú lateral o la pestaña Sedes. Desde ahí actualizas tus horarios libres del día en 1 toque, publicas clases por nivel y edad, subes fotos de tu vitrina y compartes videos cortos.',
        action: { label: 'Abrir Portal Aliados', type: 'partner' },
      },
      {
        id: 'ali-student',
        q: '¿Cómo encuentro profesor para mi nivel o para niños?',
        a: 'Ve a la pestaña Sedes → Coaches y usa los filtros rápidos de Nivel (Desde Cero, Intermedio, Avanzado), Edad (Niños, Juveniles, Adultos, Senior) y «Libre hoy». Elige tu clase y toca «Reservar Clase» para coordinar directo.',
        action: { label: 'Explorar Sedes y Coaches', type: 'tab', value: 'sedes' },
      },
    ],
  },
];

export default function SupportBotModal({
  isOpen = false,
  onClose,
  currentUser = null,
  theme = 'dark',
  onNavigateTab,
  onOpenProShop,
  onOpenVipScale,
  onOpenLegal,
  onOpenPartnerPortal,
  onOpenAuth,
  onOpenTutorial,
}) {
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [humanTopic, setHumanTopic] = useState('');
  const endRef = useRef(null);

  const isLight = theme === 'light';
  const modeClass = isLight ? 'is-light' : 'is-dark';

  const selectedCat = useMemo(
    () => HELP_CATEGORIES.find((c) => c.id === selectedCatId) || null,
    [selectedCatId]
  );

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const out = [];
    HELP_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        const hay = `${cat.title} ${item.q} ${item.a}`.toLowerCase();
        if (hay.includes(q)) {
          out.push({ ...item, catTitle: cat.title });
        }
      });
    });
    return out.slice(0, 6);
  }, [searchQuery]);

  const handlePickQuestion = (item) => {
    triggerHaptic('light');
    setHistory((prev) => {
      const next = [
        ...prev,
        { id: `u-${Date.now()}`, from: 'user', text: item.q },
        { id: `b-${Date.now() + 1}`, from: 'bot', text: item.a, action: item.action || null },
      ];
      return next.slice(-8);
    });
    setSearchQuery('');
    window.setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 90);
  };

  const handleRunAction = (action) => {
    if (!action) return;
    triggerHaptic('medium');

    if (action.type === 'human') {
      setHumanTopic(action.topic || 'Consulta desde Centro de Ayuda');
      window.setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 60);
      return;
    }

    if (onClose) onClose();
    if (action.type === 'tab' && onNavigateTab) onNavigateTab(action.value || 'retos');
    else if (action.type === 'master' && onNavigateTab) onNavigateTab('torneos');
    else if (action.type === 'escala' && onOpenVipScale) onOpenVipScale('escala');
    else if (action.type === 'vip' && onOpenVipScale) onOpenVipScale('vip');
    else if (action.type === 'shop' && onOpenProShop) onOpenProShop('shop');
    else if (action.type === 'vault' && onOpenProShop) onOpenProShop('vault');
    else if (action.type === 'legal' && onOpenLegal) onOpenLegal(action.value || 'reclamaciones');
    else if (action.type === 'partner' && onOpenPartnerPortal) onOpenPartnerPortal();
    else if (action.type === 'auth' && onOpenAuth) onOpenAuth('login');
    else if (action.type === 'tutorial' && onOpenTutorial) onOpenTutorial();
  };

  const mailtoHref = useMemo(() => {
    const subj = humanTopic
      ? `[TOTAL TENIS] ${humanTopic}`
      : '[TOTAL TENIS] Consulta desde Centro de Ayuda';
    const bodyLines = [
      'Hola equipo de soporte TOTAL TENIS,',
      '',
      currentUser?.name ? `Jugador: ${currentUser.name}` : 'Jugador: (Visitante)',
      currentUser?.credentialId ? `Credencial: ${currentUser.credentialId}` : '',
      currentUser?.email ? `Correo: ${currentUser.email}` : '',
      '',
      'Mi consulta:',
      '',
    ].filter((l) => l !== undefined);
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(
      bodyLines.join('\n')
    )}`;
  }, [currentUser, humanTopic]);

  const whatsappHref = useMemo(() => {
    const msg = [
      'Hola soporte TOTAL TENIS,',
      humanTopic ? `Tema: ${humanTopic}` : 'Tengo una consulta sobre la app.',
      currentUser?.name ? `Jugador: ${currentUser.name}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return buildWhatsappLink(APP_CONFIG.supportWhatsApp || '51964812340', msg);
  }, [currentUser, humanTopic]);

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Ayuda TOTAL TENIS"
      subtitle="Asistente guiado 24/7 · Respuestas al instante"
      icon={<IconBadge name="shield" variant="emerald" size={38} />}
      isWide
      isTopLayer
    >
      <div className={`tt-sb-shell ${modeClass}`}>
        {/* 1. SALUDO COMPACTO + BUSCADOR INSTANTÁNEO */}
        <div className="tt-sb-welcome-card">
          <div className="tt-sb-bot-head">
            <span className="tt-sb-online-dot" aria-hidden="true" />
            <div>
              <strong>
                Hola{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}. ¿En qué te
                ayudamos hoy?
              </strong>
              <small>Elige un tema o escribe una palabra clave (ej. «árbitro», «50%», «VIP»).</small>
            </div>
          </div>

          <div className="tt-sb-search-box">
            <TTIcon name="search" size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar duda rápida..."
              aria-label="Buscar en Centro de Ayuda"
            />
            {searchQuery && (
              <button
                type="button"
                className="tt-sb-clear-btn"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {searchMatches.length > 0 && (
            <div className="tt-sb-search-results">
              {searchMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="tt-sb-q-chip"
                  onClick={() => handlePickQuestion(item)}
                >
                  <small>{item.catTitle}</small>
                  <span>{item.q}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. CONVERSACIÓN ACTIVA (BURBUJAS TIPO BANCO) */}
        {history.length > 0 && (
          <div className="tt-sb-chat-thread" aria-live="polite">
            <div className="tt-sb-thread-head">
              <span>RESPUESTAS DE ESTA SESIÓN</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setHistory([]);
                }}
              >
                Limpiar
              </button>
            </div>

            {history.map((msg) => (
              <div key={msg.id} className={`tt-sb-bubble is-${msg.from}`}>
                <p>{msg.text}</p>
                {msg.action && (
                  <button
                    type="button"
                    className="tt-sb-inline-cta"
                    onClick={() => handleRunAction(msg.action)}
                  >
                    <span>{msg.action.label}</span>
                    <span>›</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3. MENÚ DE 6 TEMAS O PREGUNTAS DEL TEMA SELECCIONADO */}
        {!selectedCat ? (
          <div className="tt-sb-topics-section">
            <div className="tt-sb-sec-head">
              <span className="tt-sb-kicker">ELIGE UN TEMA</span>
              {onOpenTutorial && (
                <button
                  type="button"
                  className="tt-sb-link-mini"
                  onClick={() => handleRunAction({ type: 'tutorial' })}
                >
                  Ver Guía Rápida (4 pasos) ›
                </button>
              )}
            </div>

            <div className="tt-sb-cat-grid">
              {HELP_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="tt-sb-cat-card"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedCatId(cat.id);
                  }}
                >
                  <IconBadge name={cat.icon} variant={cat.variant} size={36} />
                  <div style={{ minWidth: 0, textAlign: 'left' }}>
                    <strong>{cat.title}</strong>
                    <small>{cat.subtitle}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="tt-sb-questions-section">
            <div className="tt-sb-sec-head">
              <button
                type="button"
                className="tt-sb-back-btn"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCatId(null);
                }}
              >
                ‹ Todos los temas
              </button>
              <span className="tt-sb-kicker" style={{ margin: 0 }}>
                {selectedCat.title.toUpperCase()}
              </span>
            </div>

            <div className="tt-sb-q-list">
              {selectedCat.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="tt-sb-q-row"
                  onClick={() => handlePickQuestion(item)}
                >
                  <span>{item.q}</span>
                  <i aria-hidden="true">›</i>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. ESCALADO A SOPORTE HUMANO (CORREO OFICIAL + WHATSAPP + INDECOPI) */}
        <div className="tt-sb-human-card" ref={endRef}>
          <div className="tt-sb-human-top">
            <span className="tt-sb-kicker" style={{ margin: 0 }}>
              ¿NECESITAS ATENCIÓN PERSONALIZADA?
            </span>
            <strong>Equipo TOTAL TENIS · Soporte Oficial</strong>
            <small>
              Te atendemos por correo ({SUPPORT_EMAIL}) o WhatsApp oficial. Para reclamos formales,
              usa el Libro de Reclamaciones Virtual.
            </small>
          </div>

          <div className="tt-sb-human-actions">
            <a href={mailtoHref} className="tt-sb-3d-btn is-emerald">
              <TTIcon name="news" size={16} />
              <span>Escribir al Correo</span>
            </a>

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="tt-sb-3d-btn is-secondary"
              >
                <TTIcon name="whatsapp" size={16} />
                <span>WhatsApp Soporte</span>
              </a>
            )}
          </div>

          {onOpenLegal && (
            <button
              type="button"
              className="tt-sb-legal-pill"
              onClick={() => handleRunAction({ type: 'legal', value: 'reclamaciones' })}
            >
              <TTIcon name="claimsBook" size={15} />
              <span>Ir al Libro de Reclamaciones Virtual (Indecopi)</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .tt-sb-shell {
          display: flex;
          flex-direction: column;
          gap: 13px;
          color: var(--tt-text);
        }
        .tt-sb-shell.is-light {
          color: #1E0734;
        }
        .tt-sb-kicker {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .tt-sb-shell.is-light .tt-sb-kicker {
          color: #007A44;
        }

        .tt-sb-welcome-card {
          padding: 13px;
          border-radius: 19px;
          background: linear-gradient(145deg, #250A42 0%, #140324 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.42);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 4px 0 #0D0219;
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-sb-bot-head {
          display: flex;
          align-items: flex-start;
          gap: 9px;
        }
        .tt-sb-online-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #00DC7D;
          box-shadow: 0 0 10px rgba(0, 220, 125, 0.85);
          margin-top: 5px;
          flex-shrink: 0;
        }
        .tt-sb-bot-head strong {
          display: block;
          font-size: 0.9rem;
          line-height: 1.25;
        }
        .tt-sb-bot-head small {
          display: block;
          font-size: 0.72rem;
          color: rgba(250, 249, 245, 0.78);
          margin-top: 2px;
        }

        .tt-sb-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 41px;
          padding: 0 12px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .tt-sb-search-box input {
          width: 100%;
          border: none;
          background: transparent;
          color: #FAF9F5;
          font-size: 16px;
          outline: none;
        }
        .tt-sb-search-box input::placeholder {
          color: rgba(250, 249, 245, 0.65);
        }
        .tt-sb-clear-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          color: #FAF9F5;
          font-size: 0.68rem;
          flex-shrink: 0;
        }
        .tt-sb-search-results {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-sb-q-chip {
          width: 100%;
          padding: 9px 11px;
          border-radius: 12px;
          background: rgba(0, 220, 125, 0.14);
          border: 1px solid rgba(0, 220, 125, 0.42);
          color: #FAF9F5;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-sb-q-chip small {
          font-size: 0.6rem;
          font-weight: 900;
          color: #7CF5C0;
          text-transform: uppercase;
        }
        .tt-sb-q-chip span {
          font-size: 0.77rem;
          font-weight: 800;
        }

        /* CONVERSACIÓN */
        .tt-sb-chat-thread {
          padding: 12px;
          border-radius: 17px;
          background: rgba(13, 2, 25, 0.56);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-sb-shell.is-light .tt-sb-chat-thread {
          background: #F4F0FA;
          border-color: rgba(30, 7, 52, 0.14);
        }
        .tt-sb-thread-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.59rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--tt-text-muted);
        }
        .tt-sb-thread-head button {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--tt-emerald-text);
          text-decoration: underline;
        }
        .tt-sb-bubble {
          max-width: 92%;
          padding: 10px 12px;
          border-radius: 15px;
          font-size: 0.78rem;
          line-height: 1.44;
          animation: ttSbPop 210ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ttSbPop {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tt-sb-bubble p {
          margin: 0;
        }
        .tt-sb-bubble.is-user {
          align-self: flex-end;
          background: linear-gradient(180deg, #22F397 0%, #00B866 100%);
          color: #0D0219;
          font-weight: 900;
          border-bottom-right-radius: 5px;
        }
        .tt-sb-bubble.is-bot {
          align-self: flex-start;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #FAF9F5;
          border-bottom-left-radius: 5px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-sb-shell.is-light .tt-sb-bubble.is-bot {
          background: #FFFFFF;
          border-color: rgba(30, 7, 52, 0.16);
          color: #1E0734;
        }
        .tt-sb-inline-cta {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 10px;
          background: rgba(0, 220, 125, 0.18);
          border: 1px solid rgba(0, 220, 125, 0.48);
          color: #22F397;
          font-size: 0.72rem;
          font-weight: 900;
          cursor: pointer;
          transition: transform 110ms ease;
        }
        .tt-sb-inline-cta:active {
          transform: scale(0.96);
        }
        .tt-sb-shell.is-light .tt-sb-inline-cta {
          background: #1E0734;
          border-color: #1E0734;
          color: #00E582;
        }

        /* GRILLA 6 TEMAS */
        .tt-sb-sec-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }
        .tt-sb-link-mini {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--tt-emerald-text);
        }
        .tt-sb-cat-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 9px;
        }
        @media (min-width: 520px) {
          .tt-sb-cat-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-sb-cat-card {
          width: 100%;
          padding: 11px 12px;
          border-radius: 16px;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 4px 0 #10021E;
          color: #FAF9F5;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 115ms ease, box-shadow 115ms ease;
        }
        .tt-sb-cat-card:active {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 0 #10021E;
        }
        .tt-sb-shell.is-light .tt-sb-cat-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F0FA 100%);
          border-color: rgba(30, 7, 52, 0.16);
          color: #1E0734;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #D2C8E6;
        }
        .tt-sb-cat-card strong {
          display: block;
          font-size: 0.83rem;
          font-weight: 900;
        }
        .tt-sb-cat-card small {
          display: block;
          font-size: 0.69rem;
          opacity: 0.76;
          margin-top: 1px;
        }

        /* LISTA DE PREGUNTAS DEL TEMA */
        .tt-sb-back-btn {
          padding: 5px 11px;
          border-radius: 10px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
        }
        .tt-sb-q-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-sb-q-row {
          width: 100%;
          padding: 11px 13px;
          border-radius: 14px;
          background: linear-gradient(180deg, #2E1150 0%, #1E0838 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 3px 0 #10021E;
          color: #FAF9F5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          text-align: left;
          font-size: 0.79rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 110ms ease;
        }
        .tt-sb-q-row:active {
          transform: translateY(2px);
        }
        .tt-sb-q-row i {
          font-style: normal;
          font-size: 1.15rem;
          color: #00DC7D;
          flex-shrink: 0;
        }
        .tt-sb-shell.is-light .tt-sb-q-row {
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F0FA 100%);
          border-color: rgba(30, 7, 52, 0.16);
          color: #1E0734;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #D2C8E6;
        }
        .tt-sb-shell.is-light .tt-sb-q-row i {
          color: #007A44;
        }

        /* ESCALADO HUMANO */
        .tt-sb-human-card {
          padding: 13px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1.5px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-sb-human-top strong {
          display: block;
          font-size: 0.87rem;
          margin-top: 3px;
        }
        .tt-sb-human-top small {
          display: block;
          font-size: 0.72rem;
          color: var(--tt-text-muted);
          margin-top: 2px;
          line-height: 1.38;
        }
        .tt-sb-human-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-sb-3d-btn {
          min-height: 41px;
          padding: 0 12px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 900;
          text-decoration: none;
          transition: transform 110ms ease, box-shadow 110ms ease;
        }
        .tt-sb-3d-btn:active {
          transform: translateY(2px);
        }
        .tt-sb-3d-btn.is-emerald {
          background: linear-gradient(180deg, #22F397 0%, #00B866 100%);
          color: #0D0219;
          border: 1px solid rgba(168, 255, 218, 0.75);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 3px 0 #007540;
        }
        .tt-sb-3d-btn.is-secondary {
          background: linear-gradient(180deg, #35155A 0%, #230A40 100%);
          color: #FAF9F5;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 3px 0 #10021E;
        }
        .tt-sb-shell.is-light .tt-sb-3d-btn.is-secondary {
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEAF8 100%);
          color: #1E0734;
          border-color: rgba(30, 7, 52, 0.18);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #C8BDDF;
        }
        .tt-sb-legal-pill {
          width: 100%;
          min-height: 37px;
          padding: 0 12px;
          border-radius: 11px;
          background: rgba(245, 158, 11, 0.14);
          border: 1px solid rgba(245, 158, 11, 0.44);
          color: #FDE68A;
          font-size: 0.72rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
        }
        .tt-sb-shell.is-light .tt-sb-legal-pill {
          background: #FEF3C7;
          color: #92400E;
          border-color: rgba(180, 83, 9, 0.35);
        }
      `}</style>
    </ModalPortal>
  );
}
