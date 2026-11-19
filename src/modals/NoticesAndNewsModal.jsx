import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ASSETS,
  EmptyStateCard,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import {
  INITIAL_CLUBS,
  getClubById,
} from '../data/playersAndClubsData';
import { buildWhatsAppLink } from '../utils/tenisEngine';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (FUENTES RSS, MARCADORES PRO Y AVISO DEL CIRCUITO)
   --------------------------------------------------------------------------
   - Cero noticias inventadas y cero fotos recicladas de la app como prensa.
   - Marcadores ATP / WTA 100 % solo lectura con refresco cada 60 segundos.
   ========================================================================== */
export const NOTICES_NEWS_EDITABLE_CONFIG = {
  proScoreRefreshMs: 60000, // Refresco automático cada 60 segundos
  rssFeeds: [
    {
      id: 'puntodebreak',
      sourceName: 'Punto de Break',
      accent: '#C85A32',
      badgeBg: 'rgba(200, 90, 50, 0.14)',
      rssUrl: 'https://www.puntodebreak.com/rss.xml',
      portalUrl: 'https://www.puntodebreak.com/',
    },
    {
      id: 'espn-tenis',
      sourceName: 'ESPN Tenis',
      accent: '#DC2626',
      badgeBg: 'rgba(220, 38, 38, 0.12)',
      rssUrl: 'https://www.espn.com.pe/espn/rss/tennis/news',
      portalUrl: 'https://www.espn.com.pe/tenis/',
    },
    {
      id: 'atp-es',
      sourceName: 'ATP Tour',
      accent: '#1D4ED8',
      badgeBg: 'rgba(29, 78, 216, 0.12)',
      rssUrl: 'https://www.atptour.com/es/media/rss-feed/xml-feed',
      portalUrl: 'https://www.atptour.com/es',
    },
  ],
  officialPortals: [
    { id: 'p-pdb', name: 'Punto de Break', url: 'https://www.puntodebreak.com/' },
    { id: 'p-atp', name: 'ATP Tour', url: 'https://www.atptour.com/es' },
    { id: 'p-wta', name: 'WTA Tour', url: 'https://www.wtatennis.com/' },
    { id: 'p-espn', name: 'ESPN Tenis', url: 'https://www.espn.com.pe/tenis/' },
    { id: 'p-tc', name: 'Tennis Channel', url: 'https://www.tennischannel.com/' },
  ],
  circuitBulletin: {
    id: 'bulletin-season-4',
    category: 'CIRCUITO',
    title: 'Recta final hacia el Master Top 8: suma puntos oficiales antes del cierre a las 00:00',
    subtitle: 'Los puestos #1 al #8 de la tabla anual acumulada clasifican sin costo al Torneo de Maestros.',
    timeLabel: 'Aviso oficial',
    actionLabel: 'VER TORNEOS',
    actionTarget: 'torneos',
    logo: ASSETS.trofeoMasterTop8,
  },
};

/* ==========================================================================
   UTILIDADES DE TIEMPO RELATIVO Y EXTRACCIÓN DE IMÁGENES REALES EN RSS
   ========================================================================== */
function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Reciente';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return 'Reciente';
  const diffMin = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (diffMin < 2) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr} h`;
  const diffDays = Math.round(diffHr / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays <= 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function stripHtmlText(html = '') {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRealPressImage(item) {
  // 1. Miniatura directa o enclosure del RSS
  if (item?.thumbnail && /^https?:\/\//i.test(item.thumbnail)) {
    return item.thumbnail;
  }
  if (item?.enclosure?.link && /^https?:\/\//i.test(item.enclosure.link)) {
    return item.enclosure.link;
  }
  // 2. Extraer primera etiqueta <img src="..."> real embebida en content o description
  const rawHtml = `${item?.content || ''} ${item?.description || ''}`;
  const match = rawHtml.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (match && match[1]) {
    return match[1];
  }
  // 3. Si el medio no incluye imagen real, devolver null (PROHIBIDO usar assets internos de la app)
  return null;
}

async function fetchSingleRssFeed(feedConfig) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7500);

  try {
    const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
      feedConfig.rssUrl
    )}`;
    const resp = await fetch(endpoint, { signal: controller.signal });
    if (!resp.ok) throw new Error('RSS unavailable');
    const data = await resp.json();
    if (data?.status !== 'ok' || !Array.isArray(data.items)) {
      throw new Error('Invalid RSS payload');
    }

    return data.items.slice(0, 6).map((item, idx) => ({
      id: `${feedConfig.id}-${idx}-${item.guid || item.link || idx}`,
      sourceId: feedConfig.id,
      sourceName: feedConfig.sourceName,
      accent: feedConfig.accent,
      badgeBg: feedConfig.badgeBg,
      title: stripHtmlText(item.title),
      excerpt: stripHtmlText(item.description || item.content).slice(0, 145),
      link: item.link || feedConfig.portalUrl,
      pubDate: item.pubDate || null,
      imageUrl: extractRealPressImage(item),
    }));
  } catch (e) {
    return [];
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchLiveProScoreboard(tour = 'atp') {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${tour}/scoreboard`;
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error('Scoreboard unavailable');
    const data = await resp.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    const parsedMatches = [];

    events.forEach((ev) => {
      const eventName = ev.name || ev.shortName || (tour === 'wta' ? 'WTA Tour' : 'ATP Tour');
      const groupings = Array.isArray(ev.groupings) ? ev.groupings : [];
      const competitions = [];

      if (groupings.length > 0) {
        groupings.forEach((g) => {
          if (Array.isArray(g.competitions)) {
            g.competitions.forEach((c) => competitions.push(c));
          }
        });
      } else if (Array.isArray(ev.competitions)) {
        ev.competitions.forEach((c) => competitions.push(c));
      }

      competitions.slice(0, 10).forEach((comp) => {
        const competitors = Array.isArray(comp.competitors) ? comp.competitors : [];
        if (competitors.length < 2) return;

        const c1 = competitors[0];
        const c2 = competitors[1];
        const name1 =
          c1?.athlete?.displayName || c1?.team?.displayName || c1?.athlete?.shortName || 'Jugador 1';
        const name2 =
          c2?.athlete?.displayName || c2?.team?.displayName || c2?.athlete?.shortName || 'Jugador 2';

        const state = comp?.status?.type?.state || 'pre'; // 'in' | 'post' | 'pre'
        const statusDetail =
          comp?.status?.type?.shortDetail ||
          comp?.status?.type?.description ||
          (state === 'in' ? 'En juego' : state === 'post' ? 'Finalizado' : 'Programado');

        const extractSets = (competitor) =>
          (Array.isArray(competitor?.linescores) ? competitor.linescores : []).map((ls) =>
            ls?.value !== undefined ? String(ls.value) : '-'
          );

        const officialLink =
          ev?.links?.[0]?.href ||
          (tour === 'wta' ? 'https://www.wtatennis.com/scores' : 'https://www.atptour.com/es/scores/current');

        parsedMatches.push({
          id: `${tour}-${comp.id || parsedMatches.length}`,
          tour: tour.toUpperCase(),
          tournamentName: eventName,
          roundName: comp?.round?.displayName || comp?.notes?.[0]?.headline || 'Cuadro Principal',
          state,
          statusDetail,
          player1: {
            name: name1,
            winner: Boolean(c1?.winner),
            sets: extractSets(c1),
          },
          player2: {
            name: name2,
            winner: Boolean(c2?.winner),
            sets: extractSets(c2),
          },
          officialLink,
        });
      });
    });

    // Priorizar partidos EN VIVO primero, luego finalizados y programados
    const weight = { in: 0, post: 1, pre: 2 };
    return parsedMatches
      .sort((a, b) => (weight[a.state] ?? 3) - (weight[b.state] ?? 3))
      .slice(0, 12);
  } catch (e) {
    return [];
  } finally {
    window.clearTimeout(timeout);
  }
}

/* ==========================================================================
   SUBCOMPONENTE: TARJETA EDITORIAL DE NOTICIA REAL (SIN ASSETS FALSOS)
   ========================================================================== */
function PressArticleCard({ article }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showRealPhoto = Boolean(article.imageUrl) && !imgFailed;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="tt-nn-press-card"
      onClick={() => triggerHaptic('light')}
    >
      {/* Foto real del medio O tarjeta tipográfica limpia del portal (cero assets internos) */}
      {showRealPhoto ? (
        <div className="tt-nn-press-media">
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="tt-nn-press-img"
          />
          <span
            className="tt-nn-source-float"
            style={{ backgroundColor: article.accent }}
          >
            {article.sourceName}
          </span>
        </div>
      ) : (
        <div
          className="tt-nn-press-editorial-banner"
          style={{ borderLeftColor: article.accent }}
        >
          <span
            className="tt-nn-source-chip"
            style={{ color: article.accent, backgroundColor: article.badgeBg }}
          >
            {article.sourceName}
          </span>
          <span className="tt-nn-press-time">{formatRelativeTime(article.pubDate)}</span>
        </div>
      )}

      <div className="tt-nn-press-body">
        {showRealPhoto && (
          <div className="tt-nn-press-meta-top">
            <span
              className="tt-nn-source-chip"
              style={{ color: article.accent, backgroundColor: article.badgeBg }}
            >
              {article.sourceName}
            </span>
            <span className="tt-nn-press-time">{formatRelativeTime(article.pubDate)}</span>
          </div>
        )}

        <h3 className="tt-nn-press-title">{article.title}</h3>
        {article.excerpt && <p className="tt-nn-press-excerpt">{article.excerpt}...</p>}

        <div className="tt-nn-press-foot">
          <span className="tt-nn-read-pill">VER NOTA ORIGINAL ↗</span>
        </div>
      </div>
    </a>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: NoticesAndNewsModal (BLOQUE 18 DE 26)
   ========================================================================== */
export default function NoticesAndNewsModal({
  isOpen = false,
  initialTab = 'notificaciones', // 'notificaciones' | 'actualidad' | 'marcadores'
  onClose,
  currentUser = null,
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  tournaments = [],
  notices = [],
  onAcceptChallenge,
  onDeclineChallenge,
  onMarkAllRead,
  onNavigateTab,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [readIds, setReadIds] = useState([]);

  // Estado Actualidad Tenis (RSS real en vivo)
  const [pressArticles, setPressArticles] = useState([]);
  const [isLoadingPress, setIsLoadingPress] = useState(false);
  const [pressSourceFilter, setPressSourceFilter] = useState('ALL');
  const [pressLastSync, setPressLastSync] = useState(null);

  // Estado Marcadores ATP / WTA (Solo lectura · Refresco cada 60 s)
  const [proTour, setProTour] = useState('atp'); // 'atp' | 'wta'
  const [proMatches, setProMatches] = useState([]);
  const [isLoadingPro, setIsLoadingPro] = useState(false);
  const [proLastSync, setProLastSync] = useState(null);

  // Permiso de notificaciones Push nativas (PWA)
  const [pushStatus, setPushStatus] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return window.Notification.permission; // 'default' | 'granted' | 'denied'
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'notificaciones');
    }
  }, [isOpen, initialTab]);

  // Mapa rápido de jugadores
  const playersMap = useMemo(() => {
    const m = {};
    (players || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [players]);

  /* ------------------------------------------------------------------------
     1. CARGA REAL DE NOTICIAS (RSS EN VIVO SIN RELLENO FALSO)
     ------------------------------------------------------------------------ */
  const loadPressFeeds = useCallback(async () => {
    setIsLoadingPress(true);
    try {
      const results = await Promise.all(
        NOTICES_NEWS_EDITABLE_CONFIG.rssFeeds.map((f) => fetchSingleRssFeed(f))
      );
      const merged = results
        .flat()
        .filter((a) => Boolean(a.title))
        .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

      setPressArticles(merged);
      setPressLastSync(
        new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      );
    } finally {
      setIsLoadingPress(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'actualidad' && pressArticles.length === 0) {
      loadPressFeeds();
    }
  }, [isOpen, activeTab, pressArticles.length, loadPressFeeds]);

  /* ------------------------------------------------------------------------
     2. CARGA Y AUTO-REFRESCO CADA 60 SEGUNDOS DE MARCADORES ATP / WTA
     ------------------------------------------------------------------------ */
  const loadProScores = useCallback(async (tourKey) => {
    setIsLoadingPro(true);
    try {
      const list = await fetchLiveProScoreboard(tourKey);
      setProMatches(list);
      setProLastSync(
        new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      );
    } finally {
      setIsLoadingPro(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || activeTab !== 'marcadores') return undefined;
    loadProScores(proTour);
    const intervalId = window.setInterval(() => {
      loadProScores(proTour);
    }, NOTICES_NEWS_EDITABLE_CONFIG.proScoreRefreshMs);
    return () => window.clearInterval(intervalId);
  }, [isOpen, activeTab, proTour, loadProScores]);

  /* ------------------------------------------------------------------------
     3. CONSTRUCCIÓN DE TARJETAS DE NOTIFICACIONES ACCIONABLES (BLANCO MARFIL)
     ------------------------------------------------------------------------ */
  const notificationItems = useMemo(() => {
    const items = [];

    // A. Retos entrantes pendientes para el usuario actual (matching estricto por ID)
    if (currentUser?.id) {
      (challenges || [])
        .filter((c) => c.status === 'PENDING' && c.playerBId === currentUser.id)
        .forEach((ch) => {
          const challenger = playersMap[ch.playerAId];
          const club = getClubById(clubs, ch.clubId);
          items.push({
            id: `noti-ch-${ch.id}`,
            category: 'NUEVO DESAFÍO',
            unread: !readIds.includes(`noti-ch-${ch.id}`),
            title: `${challenger?.name || 'Un jugador'} te ha retado en ${ch.clubName}`,
            subtitle: `${ch.dateLabel || 'Fecha propuesta'} · ${ch.timeLabel || ''} · ${
              ch.mode === 'Amistoso' ? 'Amistoso' : 'Oficial por puntos'
            }`,
            timeLabel: 'Pendiente de respuesta',
            logo: club?.logo || ASSETS.logo,
            challenge: ch,
            challenger,
            type: 'INCOMING_CHALLENGE',
          });
        });

      // B. Partidos del usuario que están EN JUEGO ahora
      (challenges || [])
        .filter(
          (c) =>
            c.status === 'IN_PLAY' &&
            (c.playerAId === currentUser.id || c.playerBId === currentUser.id)
        )
        .forEach((ch) => {
          const opp = playersMap[ch.playerAId === currentUser.id ? ch.playerBId : ch.playerAId];
          const club = getClubById(clubs, ch.clubId);
          items.push({
            id: `noti-live-${ch.id}`,
            category: 'EN CANCHA',
            unread: !readIds.includes(`noti-live-${ch.id}`),
            title: `Tu partido frente a ${opp?.name || 'tu rival'} está en curso`,
            subtitle: `${ch.clubName} · Marcador oficial listo para actualizar`,
            timeLabel: 'En vivo',
            logo: club?.logo || ASSETS.logo,
            type: 'GO_TO_TAB',
            targetTab: 'retos',
            ctaLabel: 'IR AL MARCADOR',
          });
        });
    }

    // C. Torneos con inscripciones abiertas
    (tournaments || [])
      .filter((t) => t.status === 'OPEN')
      .slice(0, 2)
      .forEach((t) => {
        const club = getClubById(clubs, t.clubId);
        items.push({
          id: `noti-tn-${t.id}`,
          category: 'TORNEO',
          unread: !readIds.includes(`noti-tn-${t.id}`),
          title: `Inscripciones abiertas: ${t.name}`,
          subtitle: `${t.clubName} · ${t.dateLabel} · Cuota S/ ${t.entryFee}`,
          timeLabel: 'Cupos disponibles',
          logo: club?.logo || ASSETS.trofeoCampeonGira,
          type: 'GO_TO_TAB',
          targetTab: 'torneos',
          ctaLabel: 'VER CUADRO',
        });
      });

    // D. Notificaciones personalizadas inyectadas desde el estado global
    (notices || []).forEach((n) => {
      items.push({
        id: n.id,
        category: n.category || 'CIRCUITO',
        unread: !n.read && !readIds.includes(n.id),
        title: n.title,
        subtitle: n.subtitle || n.body || '',
        timeLabel: formatRelativeTime(n.createdAt),
        logo: n.logo || ASSETS.logo,
        type: n.targetTab ? 'GO_TO_TAB' : 'INFO',
        targetTab: n.targetTab,
        ctaLabel: n.ctaLabel || 'VER DETALLE',
      });
    });

    // E. Boletín institucional fijado del circuito
    const bull = NOTICES_NEWS_EDITABLE_CONFIG.circuitBulletin;
    items.push({
      id: bull.id,
      category: bull.category,
      unread: !readIds.includes(bull.id),
      title: bull.title,
      subtitle: bull.subtitle,
      timeLabel: bull.timeLabel,
      logo: bull.logo,
      type: 'GO_TO_TAB',
      targetTab: bull.actionTarget,
      ctaLabel: bull.actionLabel,
    });

    return items;
  }, [currentUser?.id, challenges, playersMap, clubs, tournaments, notices, readIds]);

  const unreadCount = useMemo(
    () => notificationItems.filter((item) => item.unread).length,
    [notificationItems]
  );

  const filteredPress = useMemo(() => {
    if (pressSourceFilter === 'ALL') return pressArticles;
    return pressArticles.filter((a) => a.sourceId === pressSourceFilter);
  }, [pressArticles, pressSourceFilter]);

  /* ------------------------------------------------------------------------
     ACCIONES (MARCAR LEÍDO, ACTIVAR PUSH PWA, ACEPTAR/CONTRAPROPONER RETO)
     ------------------------------------------------------------------------ */
  const handleMarkAllAsRead = () => {
    triggerHaptic('light');
    setReadIds(notificationItems.map((i) => i.id));
    if (onMarkAllRead) onMarkAllRead();
    if (onNotify) onNotify('Todas las notificaciones fueron marcadas como leídas.', 'info');
  };

  const handleRequestPushPermission = async () => {
    triggerHaptic('light');
    if (typeof window === 'undefined' || !('Notification' in window)) {
      if (onNotify) {
        onNotify(
          'En iPhone, toca Compartir → "Agregar a pantalla de inicio" para activar alertas nativas con sonido.',
          'info'
        );
      }
      return;
    }
    try {
      const res = await window.Notification.requestPermission();
      setPushStatus(res);
      if (res === 'granted') {
        if (onNotify) onNotify('¡Alertas activadas! Recibirás avisos de retos y torneos.', 'success');
      } else {
        if (onNotify) onNotify('Puedes activar las alertas luego desde los ajustes de tu navegador.', 'info');
      }
    } catch (e) {
      if (onNotify) onNotify('Activa las alertas desde la configuración de tu dispositivo.', 'info');
    }
  };

  const handleCounterProposeWhatsApp = (ch, challenger) => {
    triggerHaptic('light');
    const msg = `Hola ${challenger?.name || ''}, recibí tu desafío en TOTAL TENIS para ${ch.clubName} (${ch.dateLabel} · ${ch.timeLabel}). ¿Te parece si coordinamos otra hora o sede?`;
    window.open(
      buildWhatsAppLink(challenger?.whatsapp, msg),
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="NOTIFICACIONES"
      subtitle="Avisos de tu circuito, Actualidad Tenis y Marcadores Pro"
      icon={<IconBadge name="bell" variant="emerald" size={38} />}
      isWide
      isTopLayer
    >
      {/* Superficie Editorial en Blanco Marfil (#FAF9F5) como el blueprint aprobado */}
      <div className="tt-nn-editorial-shell">
        {/* 1. CONMUTADOR DE 3 PESTAÑAS LIMPIAS */}
        <div className="tt-nn-tabs" role="tablist" aria-label="Notificaciones y Boletín Tenis">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notificaciones'}
            className={`tt-nn-tab ${activeTab === 'notificaciones' ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('notificaciones');
            }}
          >
            <span>Notificaciones</span>
            {unreadCount > 0 && <span className="tt-nn-count-dot">{unreadCount}</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'actualidad'}
            className={`tt-nn-tab ${activeTab === 'actualidad' ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('actualidad');
            }}
          >
            Actualidad Tenis
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'marcadores'}
            className={`tt-nn-tab ${activeTab === 'marcadores' ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('marcadores');
            }}
          >
            ATP / WTA
          </button>
        </div>

        {/* ==================================================================
            PESTAÑA 1: NOTIFICACIONES DEL CIRCUITO (ESTILO EDITORIAL MARFIL)
            ================================================================== */}
        {activeTab === 'notificaciones' && (
          <div className="tt-nn-stack">
            {/* Barra de acciones rápidas + Activación de Alertas Push */}
            <div className="tt-nn-utility-row">
              {pushStatus !== 'granted' ? (
                <button
                  type="button"
                  className="tt-nn-push-pill"
                  onClick={handleRequestPushPermission}
                >
                  <TTIcon name="bell" size={14} />
                  Activar alertas en mi celular
                </button>
              ) : (
                <span className="tt-nn-push-ok">● Alertas activas en este dispositivo</span>
              )}

              {unreadCount > 0 && (
                <button
                  type="button"
                  className="tt-nn-mark-read"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todo leído
                </button>
              )}
            </div>

            {notificationItems.length === 0 ? (
              <EmptyStateCard
                theme="light"
                title="Todo al día en tu bandeja"
                description="Aquí aparecerán tus retos recibidos, confirmaciones de horario y avisos de torneos."
              />
            ) : (
              <div className="tt-nn-cards-list">
                {notificationItems.map((item) => (
                  <article key={item.id} className="tt-nn-card">
                    {/* Fila Superior: Píldora gris de categoría + Punto verde activo */}
                    <div className="tt-nn-card-top">
                      <span className="tt-nn-cat-pill">{item.category}</span>
                      <div className="tt-nn-top-right">
                        <span className="tt-nn-time">{item.timeLabel}</span>
                        {item.unread && (
                          <span
                            className="tt-nn-green-dot"
                            aria-label="Sin leer"
                          />
                        )}
                      </div>
                    </div>

                    {/* Centro: Titular grande en negrita + Escudo del club/torneo a la derecha */}
                    <div className="tt-nn-card-mid">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="tt-nn-card-title">{item.title}</h3>
                        {item.subtitle && (
                          <p className="tt-nn-card-sub">{item.subtitle}</p>
                        )}
                      </div>

                      <div className="tt-nn-crest-box">
                        <SmartImage
                          src={item.logo}
                          fallbackSrc={ASSETS.logo}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>

                    {/* Pie: Botones píldora con borde verde a la izquierda */}
                    <div className="tt-nn-card-actions">
                      {item.type === 'INCOMING_CHALLENGE' && item.challenge && (
                        <>
                          <button
                            type="button"
                            className="tt-nn-pill-btn is-solid"
                            onClick={() => {
                              triggerHaptic('success');
                              if (onAcceptChallenge) onAcceptChallenge(item.challenge);
                              setReadIds((prev) => [...prev, item.id]);
                            }}
                          >
                            ACEPTAR
                          </button>

                          <button
                            type="button"
                            className="tt-nn-pill-btn"
                            onClick={() =>
                              handleCounterProposeWhatsApp(item.challenge, item.challenger)
                            }
                          >
                            REPROGRAMAR
                          </button>

                          <button
                            type="button"
                            className="tt-nn-text-decline"
                            onClick={() => {
                              triggerHaptic('warning');
                              if (onDeclineChallenge) onDeclineChallenge(item.challenge);
                              setReadIds((prev) => [...prev, item.id]);
                            }}
                          >
                            Declinar
                          </button>
                        </>
                      )}

                      {item.type === 'GO_TO_TAB' && (
                        <button
                          type="button"
                          className="tt-nn-pill-btn"
                          onClick={() => {
                            triggerHaptic('light');
                            setReadIds((prev) => [...prev, item.id]);
                            if (onNavigateTab && item.targetTab) {
                              onNavigateTab(item.targetTab);
                            }
                            if (onClose) onClose();
                          }}
                        >
                          {item.ctaLabel || 'VER DETALLE'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 2: ACTUALIDAD TENIS (FEEDS RSS REALES EN VIVO · $0)
            ================================================================== */}
        {activeTab === 'actualidad' && (
          <div className="tt-nn-stack">
            {/* Cabecera Editorial + Filtros por Medio */}
            <div className="tt-nn-press-bar">
              <div className="tt-nn-source-pills">
                <button
                  type="button"
                  className={`tt-nn-src-filter ${pressSourceFilter === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setPressSourceFilter('ALL');
                  }}
                >
                  Todos los medios
                </button>
                {NOTICES_NEWS_EDITABLE_CONFIG.rssFeeds.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`tt-nn-src-filter ${pressSourceFilter === f.id ? 'is-active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setPressSourceFilter(f.id);
                    }}
                  >
                    {f.sourceName}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="tt-nn-refresh-btn"
                disabled={isLoadingPress}
                onClick={() => {
                  triggerHaptic('light');
                  loadPressFeeds();
                }}
              >
                {isLoadingPress ? 'Cargando...' : pressLastSync ? `↻ ${pressLastSync}` : '↻ Actualizar'}
              </button>
            </div>

            {isLoadingPress && pressArticles.length === 0 ? (
              <div className="tt-nn-skeleton-stack">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="tt-nn-skeleton-card" />
                ))}
              </div>
            ) : filteredPress.length === 0 ? (
              <div className="tt-nn-fallback-box">
                <strong>No pudimos conectar con el feed en este momento</strong>
                <p>
                  Nunca mostramos noticias falsas ni desactualizadas. Puedes reintentar o abrir directamente los portales oficiales de tenis:
                </p>
                <div className="tt-nn-portal-links">
                  {NOTICES_NEWS_EDITABLE_CONFIG.officialPortals.map((p) => (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tt-nn-pill-btn"
                    >
                      {p.name} ↗
                    </a>
                  ))}
                </div>
                <button
                  type="button"
                  className="tt-nn-pill-btn is-solid"
                  onClick={loadPressFeeds}
                  style={{ marginTop: 6 }}
                >
                  Reintentar conexión
                </button>
              </div>
            ) : (
              <div className="tt-nn-press-grid">
                {filteredPress.map((art) => (
                  <PressArticleCard key={art.id} article={art} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 3: MARCADORES ATP / WTA EN VIVO (SOLO LECTURA · CADA 60 S)
            ================================================================== */}
        {activeTab === 'marcadores' && (
          <div className="tt-nn-stack">
            {/* Cabecera Verde Menta estilo Live Tennis Scores */}
            <div className="tt-nn-pro-hero">
              <div>
                <span className="tt-nn-pro-kicker">SOLO LECTURA · ACTUALIZACIÓN AUTOMÁTICA 60S</span>
                <h3>MARCADORES ATP & WTA</h3>
              </div>

              <div className="tt-nn-tour-switch">
                <button
                  type="button"
                  className={proTour === 'atp' ? 'is-active' : ''}
                  onClick={() => {
                    triggerHaptic('light');
                    setProTour('atp');
                  }}
                >
                  ATP Tour
                </button>
                <button
                  type="button"
                  className={proTour === 'wta' ? 'is-active' : ''}
                  onClick={() => {
                    triggerHaptic('light');
                    setProTour('wta');
                  }}
                >
                  WTA Tour
                </button>
              </div>
            </div>

            <div className="tt-nn-pro-sync-strip">
              <span>
                {proLastSync
                  ? `Última consulta: ${proLastSync}`
                  : 'Conectando marcadores oficiales...'}
              </span>
              <button
                type="button"
                className="tt-nn-refresh-btn"
                disabled={isLoadingPro}
                onClick={() => {
                  triggerHaptic('light');
                  loadProScores(proTour);
                }}
              >
                {isLoadingPro ? 'Actualizando...' : '↻ Refrescar ahora'}
              </button>
            </div>

            {isLoadingPro && proMatches.length === 0 ? (
              <div className="tt-nn-skeleton-stack">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="tt-nn-skeleton-card is-short" />
                ))}
              </div>
            ) : proMatches.length === 0 ? (
              <div className="tt-nn-fallback-box">
                <strong>Sin partidos profesionales en cancha ahora mismo</strong>
                <p>
                  Cuando haya jornada activa del circuito {proTour.toUpperCase()}, los sets se mostrarán aquí en tiempo real. También puedes consultar la cobertura oficial directa:
                </p>
                <div className="tt-nn-portal-links">
                  {NOTICES_NEWS_EDITABLE_CONFIG.officialPortals.slice(1).map((p) => (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tt-nn-pill-btn"
                    >
                      {p.name} ↗
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tt-nn-pro-grid">
                {proMatches.map((m) => (
                  <article
                    key={m.id}
                    className={`tt-nn-pro-card ${m.state === 'in' ? 'is-live' : ''}`}
                  >
                    <div className="tt-nn-pro-head">
                      <span className="tt-nn-pro-tourney">{m.tournamentName}</span>
                      <span className={`tt-nn-pro-state is-${m.state}`}>
                        {m.state === 'in' && <span className="tt-nn-live-dot" />}
                        {m.statusDetail}
                      </span>
                    </div>

                    <div className={`tt-nn-pro-row ${m.player1.winner ? 'is-win' : ''}`}>
                      <strong>{m.player1.name}</strong>
                      <div className="tt-nn-pro-sets">
                        {m.player1.sets.length > 0 ? (
                          m.player1.sets.map((s, i) => <span key={i}>{s}</span>)
                        ) : (
                          <span>—</span>
                        )}
                        {m.player1.winner && <em>◀</em>}
                      </div>
                    </div>

                    <div className={`tt-nn-pro-row ${m.player2.winner ? 'is-win' : ''}`}>
                      <strong>{m.player2.name}</strong>
                      <div className="tt-nn-pro-sets">
                        {m.player2.sets.length > 0 ? (
                          m.player2.sets.map((s, i) => <span key={i}>{s}</span>)
                        ) : (
                          <span>—</span>
                        )}
                        {m.player2.winner && <em>◀</em>}
                      </div>
                    </div>

                    <div className="tt-nn-pro-foot">
                      <span>{m.roundName}</span>
                      <a
                        href={m.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tt-nn-pro-ext"
                        onClick={() => triggerHaptic('light')}
                      >
                        Ver cobertura oficial ↗
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================================================================
          ESTILOS ENCAPSULADOS (BLANCO MARFIL EDITORIAL + ACENTOS ESMERALDA)
          ==================================================================== */}
      <style>{`
        .tt-nn-editorial-shell {
          border-radius: 20px;
          padding: 14px;
          background: #FAF9F5;
          color: #1E0734;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        /* Conmutador de 3 pestañas */
        .tt-nn-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 5px;
          padding: 4px;
          border-radius: 15px;
          background: rgba(30, 7, 52, 0.08);
        }
        .tt-nn-tab {
          min-height: 38px;
          padding: 0 6px;
          border-radius: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 0.74rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.68);
          white-space: nowrap;
        }
        .tt-nn-tab.is-active {
          background: #1E0734;
          color: #00DC7D;
          box-shadow: 0 4px 12px rgba(30, 7, 52, 0.22);
        }
        .tt-nn-count-dot {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.65rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .tt-nn-stack {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        /* 1. NOTIFICACIONES EDITORIALES */
        .tt-nn-utility-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-nn-push-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.16);
          border: 1px solid rgba(0, 138, 78, 0.32);
          color: #007542;
          font-size: 0.71rem;
          font-weight: 800;
        }
        .tt-nn-push-ok {
          font-size: 0.72rem;
          font-weight: 800;
          color: #008A4E;
        }
        .tt-nn-mark-read {
          font-size: 0.72rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.66);
          text-decoration: underline;
        }

        .tt-nn-cards-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-nn-card {
          border-radius: 18px;
          padding: 14px;
          background: #FFFFFF;
          border: 1px solid rgba(30, 7, 52, 0.1);
          box-shadow: 0 6px 18px rgba(30, 7, 52, 0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-nn-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-nn-cat-pill {
          padding: 3px 9px;
          border-radius: 999px;
          background: #EFEBF5;
          color: #1E0734;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.07em;
        }
        .tt-nn-top-right {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .tt-nn-time {
          font-size: 0.69rem;
          font-weight: 700;
          color: rgba(30, 7, 52, 0.56);
        }
        .tt-nn-green-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #00DC7D;
          box-shadow: 0 0 8px rgba(0, 220, 125, 0.75);
        }
        .tt-nn-card-mid {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .tt-nn-card-title {
          margin: 0;
          font-size: 0.94rem;
          font-weight: 900;
          line-height: 1.26;
          color: #1E0734;
        }
        .tt-nn-card-sub {
          margin: 4px 0 0;
          font-size: 0.76rem;
          line-height: 1.38;
          color: rgba(30, 7, 52, 0.7);
        }
        .tt-nn-crest-box {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          overflow: hidden;
          background: #FAF9F5;
          border: 1px solid rgba(30, 7, 52, 0.12);
          flex-shrink: 0;
        }
        .tt-nn-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-nn-pill-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          background: transparent;
          border: 1.5px solid #00B868;
          color: #1E0734;
          font-size: 0.69rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-decoration: none;
        }
        .tt-nn-pill-btn.is-solid {
          background: #00DC7D;
          border-color: #00DC7D;
          color: #120321;
        }
        .tt-nn-text-decline {
          font-size: 0.72rem;
          font-weight: 800;
          color: #DC2626;
          padding: 4px 6px;
        }

        /* 2. ACTUALIDAD TENIS (RSS REAL) */
        .tt-nn-press-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-nn-source-pills {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tt-nn-source-pills::-webkit-scrollbar {
          display: none;
        }
        .tt-nn-src-filter {
          flex-shrink: 0;
          min-height: 32px;
          padding: 0 11px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 1px solid rgba(30, 7, 52, 0.14);
          color: rgba(30, 7, 52, 0.72);
          font-size: 0.71rem;
          font-weight: 800;
        }
        .tt-nn-src-filter.is-active {
          background: #1E0734;
          border-color: #1E0734;
          color: #00DC7D;
        }
        .tt-nn-refresh-btn {
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(30, 7, 52, 0.08);
          color: #1E0734;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .tt-nn-press-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 11px;
        }
        @media (min-width: 660px) {
          .tt-nn-press-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .tt-nn-press-card {
          border-radius: 18px;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid rgba(30, 7, 52, 0.1);
          box-shadow: 0 6px 18px rgba(30, 7, 52, 0.06);
          color: #1E0734;
          text-decoration: none;
          display: flex;
          flex-direction: column;
        }
        .tt-nn-press-media {
          position: relative;
          aspect-ratio: 16 / 9;
          background: #1E0734;
          overflow: hidden;
        }
        .tt-nn-press-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-nn-source-float {
          position: absolute;
          left: 10px;
          top: 10px;
          padding: 3px 9px;
          border-radius: 999px;
          color: #FFFFFF;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.05em;
        }
        .tt-nn-press-editorial-banner {
          padding: 11px 13px 0;
          border-left: 4px solid #1E0734;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .tt-nn-press-body {
          padding: 12px 13px 13px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .tt-nn-press-meta-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .tt-nn-source-chip {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.64rem;
          font-weight: 900;
        }
        .tt-nn-press-time {
          font-size: 0.68rem;
          font-weight: 700;
          color: rgba(30, 7, 52, 0.55);
        }
        .tt-nn-press-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 900;
          line-height: 1.25;
          color: #1E0734;
        }
        .tt-nn-press-excerpt {
          margin: 0;
          font-size: 0.74rem;
          line-height: 1.4;
          color: rgba(30, 7, 52, 0.72);
        }
        .tt-nn-press-foot {
          margin-top: auto;
          padding-top: 6px;
        }
        .tt-nn-read-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1.5px solid #00B868;
          color: #1E0734;
          font-size: 0.66rem;
          font-weight: 900;
        }

        /* 3. MARCADORES ATP & WTA EN VIVO (SOLO LECTURA) */
        .tt-nn-pro-hero {
          border-radius: 18px;
          padding: 14px;
          background: linear-gradient(135deg, #1AE68A 0%, #7CF5C0 100%);
          color: #1E0734;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-nn-pro-kicker {
          display: block;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          opacity: 0.76;
        }
        .tt-nn-pro-hero h3 {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-size: 1.45rem;
          line-height: 1;
        }
        .tt-nn-tour-switch {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: rgba(30, 7, 52, 0.14);
        }
        .tt-nn-tour-switch button {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 900;
          color: #1E0734;
        }
        .tt-nn-tour-switch button.is-active {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-nn-pro-sync-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.71rem;
          font-weight: 700;
          color: rgba(30, 7, 52, 0.65);
        }

        .tt-nn-pro-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 660px) {
          .tt-nn-pro-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .tt-nn-pro-card {
          border-radius: 17px;
          padding: 12px 13px;
          background: #1E0734;
          color: #FAF9F5;
          border: 1px solid rgba(30, 7, 52, 0.14);
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-nn-pro-card.is-live {
          border-color: #00DC7D;
          box-shadow: 0 8px 20px rgba(0, 220, 125, 0.16);
        }
        .tt-nn-pro-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(250, 249, 245, 0.12);
          font-size: 0.67rem;
        }
        .tt-nn-pro-tourney {
          font-weight: 800;
          color: #7CF5C0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-nn-pro-state {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 900;
          white-space: nowrap;
        }
        .tt-nn-pro-state.is-in {
          color: #00DC7D;
        }
        .tt-nn-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00DC7D;
          animation: ttLivePulse 1.5s infinite;
        }
        .tt-nn-pro-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.84rem;
        }
        .tt-nn-pro-row.is-win strong {
          color: #00DC7D;
        }
        .tt-nn-pro-sets {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--tt-font-display);
          font-size: 1.04rem;
          font-variant-numeric: tabular-nums;
        }
        .tt-nn-pro-sets em {
          font-style: normal;
          color: #00DC7D;
          font-size: 0.72rem;
        }
        .tt-nn-pro-foot {
          margin-top: 2px;
          padding-top: 6px;
          border-top: 1px solid rgba(250, 249, 245, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.68rem;
          color: rgba(250, 249, 245, 0.72);
        }
        .tt-nn-pro-ext {
          color: #00DC7D;
          font-weight: 800;
          text-decoration: none;
        }

        /* Fallbacks y Skeletons limpios */
        .tt-nn-fallback-box {
          padding: 16px;
          border-radius: 18px;
          background: #FFFFFF;
          border: 1px solid rgba(30, 7, 52, 0.12);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .tt-nn-fallback-box p {
          margin: 0;
          font-size: 0.77rem;
          line-height: 1.44;
          color: rgba(30, 7, 52, 0.72);
          max-width: 440px;
        }
        .tt-nn-portal-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 7px;
          margin-top: 4px;
        }
        .tt-nn-skeleton-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-nn-skeleton-card {
          height: 142px;
          border-radius: 18px;
          background: linear-gradient(
            90deg,
            rgba(30, 7, 52, 0.06) 25%,
            rgba(30, 7, 52, 0.12) 50%,
            rgba(30, 7, 52, 0.06) 75%
          );
          background-size: 200% 100%;
          animation: ttShimmer 1.3s infinite linear;
        }
        .tt-nn-skeleton-card.is-short {
          height: 106px;
        }
        @keyframes ttShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </ModalPortal>
  );
}
