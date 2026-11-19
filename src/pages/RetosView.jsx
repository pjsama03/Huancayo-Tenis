import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSETS,
  EmptyStateCard,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
  useScrollReveal,
} from '../components/AppIcons';
import {
  CATEGORIES_SCALE,
  INITIAL_CLUBS,
  getCategoryByPoints,
  getClubById,
} from '../data/playersAndClubsData';
import {
  ELO_CONFIG,
  buildWhatsAppLink,
  calculateOfficialMatchElo,
  canIncrementRegularGame,
  createEmptyLiveScore,
  evaluateMatchScore,
  fetchLiveClubWeather,
  getMatchPermissions,
  getPreMatchForecast,
  stepLiveScoreboard,
} from '../utils/tenisEngine';

/* ==========================================================================
   CONSTANTES Y UTILIDADES INTERNAS DE RETOS (FECHAS REALES Y RELOJ PERÚ)
   ========================================================================== */
const MAX_OFFICIAL_ELO_WINDOW = 1200;

const QUICK_TIME_SLOTS = [
  '07:00',
  '08:30',
  '10:00',
  '15:00',
  '16:30',
  '18:00',
  '19:00',
  '20:00',
];

const BALLS_AGREEMENTS = [
  'Lata nueva a medias (50/50)',
  'Tarro nuevo (lleva retador)',
  'Pelotas en buen estado',
];

function getTodayDateInputValue(daysAhead = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDynamicDateAndTime(isoString, fallbackDate = '', fallbackTime = '') {
  if (!isoString) {
    return {
      dateText: fallbackDate || 'Por coordinar',
      timeText: fallbackTime || '--:--',
    };
  }
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) {
    return {
      dateText: fallbackDate || 'Por coordinar',
      timeText: fallbackTime || '--:--',
    };
  }

  try {
    const now = new Date();
    const fmtKey = (dt) =>
      dt.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const targetKey = fmtKey(d);
    const todayKey = fmtKey(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowKey = fmtKey(tomorrow);

    const shortDate = d.toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });

    let dateText = shortDate.charAt(0).toUpperCase() + shortDate.slice(1);
    if (targetKey === todayKey) {
      const dm = d.toLocaleDateString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: 'short',
      });
      dateText = `Hoy · ${dm}`;
    } else if (targetKey === tomorrowKey) {
      const dm = d.toLocaleDateString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: 'short',
      });
      dateText = `Mañana · ${dm}`;
    }

    const timeText = d.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return { dateText, timeText };
  } catch (e) {
    return {
      dateText: fallbackDate || d.toLocaleDateString('es-PE'),
      timeText: fallbackTime || d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

function getLimaClockParts(nowDate) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    }).formatToParts(nowDate);
    const map = {};
    parts.forEach((p) => {
      map[p.type] = Number(p.value);
    });
    const hours = map.hour ?? nowDate.getHours();
    const minutes = map.minute ?? nowDate.getMinutes();
    const seconds = map.second ?? nowDate.getSeconds();
    const digital = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(nowDate);
    return { hours, minutes, seconds, digital };
  } catch (e) {
    return {
      hours: nowDate.getHours(),
      minutes: nowDate.getMinutes(),
      seconds: nowDate.getSeconds(),
      digital: nowDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

/* ==========================================================================
   SUBCOMPONENTE 1: RELOJ ANALÓGICO VECTORIAL EN VIVO (HORA OFICIAL PERÚ)
   ========================================================================== */
function AnalogClockLima({ hours, minutes, seconds, size = 44 }) {
  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  const minAngle = (minutes + seconds / 60) * 6;
  const secAngle = seconds * 6;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="24" cy="24" r="22" fill="#120321" stroke="rgba(250,249,245,0.45)" strokeWidth="2" />
      <circle cx="24" cy="24" r="18.5" stroke="rgba(0,220,125,0.28)" strokeWidth="1" strokeDasharray="2 3" />
      {/* Marcas de las 12, 3, 6 y 9 */}
      <path d="M24 5.5V9M24 39V42.5M5.5 24H9M39 24H42.5" stroke="#FAF9F5" strokeWidth="1.8" strokeLinecap="round" />
      {/* Aguja Horas */}
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="13.5"
        stroke="#FAF9F5"
        strokeWidth="2.4"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 24 24)`}
      />
      {/* Aguja Minutos */}
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="9.5"
        stroke="#00DC7D"
        strokeWidth="1.9"
        strokeLinecap="round"
        transform={`rotate(${minAngle} 24 24)`}
      />
      {/* Segundero sutil */}
      <line
        x1="24"
        y1="27"
        x2="24"
        y2="9"
        stroke="#F59E0B"
        strokeWidth="1"
        strokeLinecap="round"
        transform={`rotate(${secAngle} 24 24)`}
      />
      <circle cx="24" cy="24" r="2.3" fill="#00DC7D" stroke="#120321" strokeWidth="0.9" />
    </svg>
  );
}

/* ==========================================================================
   SUBCOMPONENTE 2: AVATAR DE JUGADOR CON ANILLO DE NIVEL Y ESCUDO DE CLUB
   (Oculta automáticamente el escudo si el jugador es Independiente)
   ========================================================================== */
function PlayerAvatarWithClub({
  player,
  clubs,
  size = 54,
  ringColor = '#00DC7D',
  onClick,
}) {
  const club = getClubById(clubs, player?.clubId);
  const badgeSize = Math.round(size * 0.4);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        triggerHaptic('light');
        if (onClick && player) onClick(player);
      }}
      aria-label={`Ver ficha de ${player?.name || 'jugador'}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        padding: 0,
        border: 'none',
        background: 'transparent',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <SmartImage
        src={player?.avatar}
        alt={player?.name || 'Jugador'}
        initials={player?.name || 'TT'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: 'center top',
          border: `2.5px solid ${ringColor}`,
          boxShadow: '0 6px 16px rgba(10, 2, 20, 0.34)',
        }}
      />
      {club?.logo && (
        <span
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '2px solid #1E0734',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
          }}
        >
          <SmartImage
            src={club.logo}
            alt={club.shortName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </span>
      )}
    </button>
  );
}

/* ==========================================================================
   SUBCOMPONENTE 3: TARJETA PÓSTER VS (CARTELERA PÚBLICA & TUS DESAFÍOS)
   ========================================================================== */
function MatchPosterCard({
  challenge,
  playerA,
  playerB,
  judgePlayer,
  clubs,
  currentUser,
  isAdmin,
  showManagementActions = false,
  onOpenScoreboard,
  onStartMatch,
  onAcceptChallenge,
  onDeclineChallenge,
  onOpenReschedule,
  onOpenPlayerProfile,
  onOpenStories,
}) {
  const perms = getMatchPermissions(challenge, currentUser, isAdmin);
  const { dateText, timeText } = formatDynamicDateAndTime(
    challenge.scheduledIso,
    challenge.dateLabel,
    challenge.timeLabel
  );
  const catA = getCategoryByPoints(playerA?.points);
  const catB = getCategoryByPoints(playerB?.points);
  const scoreEval = evaluateMatchScore(challenge.liveScore);

  const isLive = challenge.status === 'IN_PLAY';
  const isPending = challenge.status === 'PENDING';
  const isFinished = challenge.status === 'FINISHED';
  const isScheduled = challenge.status === 'SCHEDULED';
  const isOfficial = challenge.mode !== 'Amistoso';

  const statusMeta = isLive
    ? { label: 'EN JUEGO AHORA', cls: 'is-live' }
    : isPending
    ? { label: 'PENDIENTE DE CONFIRMAR', cls: 'is-pending' }
    : isFinished
    ? { label: 'FINALIZADO OFICIAL', cls: 'is-finished' }
    : { label: 'DUELO PROGRAMADO', cls: 'is-scheduled' };

  const opponent = perms.isPlayerA ? playerB : playerA;
  const whatsappUrl = opponent
    ? buildWhatsAppLink(
        opponent.whatsapp,
        `Hola ${opponent.name}, te escribo desde TOTAL TENIS por nuestro partido en ${challenge.clubName} (${dateText} · ${timeText}).`
      )
    : null;

  return (
    <article className={`tt-match-card ${statusMeta.cls}`}>
      {/* Franja superior: Estado único limpio + Sede oficial completa */}
      <div className="tt-match-card-top">
        <span className={`tt-match-pill ${statusMeta.cls}`}>
          {isLive && <span className="tt-live-dot-inline" />}
          {statusMeta.label}
        </span>
        <span className="tt-match-mode-tag">
          {isOfficial ? 'Oficial · Por puntos' : 'Amistoso'}
        </span>
      </div>

      {/* Centro VS: Rostros enfrentados con escudos de club */}
      <div className="tt-match-vs-grid">
        {/* Jugador A */}
        <div className="tt-match-side">
          <PlayerAvatarWithClub
            player={playerA}
            clubs={clubs}
            size={58}
            ringColor={
              isFinished && challenge.winnerId === playerA?.id ? '#00DC7D' : '#00DC7D'
            }
            onClick={onOpenPlayerProfile}
          />
          <strong className="tt-match-player-name">{playerA?.name || 'Jugador A'}</strong>
          <div className="tt-match-player-meta">
            <span style={{ color: catA.color, fontWeight: 800 }}>{catA.name}</span>
            <span>·</span>
            <span>{Number(playerA?.points || 0).toLocaleString('es-PE')} pts</span>
          </div>
          {isFinished && challenge.winnerId === playerA?.id && (
            <span className="tt-winner-chip">GANADOR</span>
          )}
        </div>

        {/* Separador VS o Marcador Compacto */}
        <div className="tt-match-center-col">
          <span className="tt-vs-emblem">VS</span>
          <span className="tt-match-date-chip">{dateText}</span>
          <span className="tt-match-time-chip">{timeText}</span>
        </div>

        {/* Jugador B */}
        <div className="tt-match-side">
          <PlayerAvatarWithClub
            player={playerB}
            clubs={clubs}
            size={58}
            ringColor={
              isFinished && challenge.winnerId === playerB?.id ? '#00DC7D' : '#F59E0B'
            }
            onClick={onOpenPlayerProfile}
          />
          <strong className="tt-match-player-name">{playerB?.name || 'Jugador B'}</strong>
          <div className="tt-match-player-meta">
            <span style={{ color: catB.color, fontWeight: 800 }}>{catB.name}</span>
            <span>·</span>
            <span>{Number(playerB?.points || 0).toLocaleString('es-PE')} pts</span>
          </div>
          {isFinished && challenge.winnerId === playerB?.id && (
            <span className="tt-winner-chip">GANADOR</span>
          )}
        </div>
      </div>

      {/* Tira de Marcador en Vivo o Resultado Final (estilo transmisión profesional) */}
      {(isLive || isFinished) && (
        <div className="tt-mini-scoreboard">
          <div className="tt-mini-sb-row">
            <span className="tt-mini-sb-name">
              {playerA?.name?.split(' ')[0] || 'A'}
              {isFinished && challenge.winnerId === playerA?.id && (
                <TTIcon name="check" size={13} style={{ color: '#00DC7D' }} />
              )}
            </span>
            <div className="tt-mini-sb-sets">
              <span className="tt-sb-cell">{challenge.liveScore?.set1?.a ?? 0}</span>
              <span className="tt-sb-cell">{challenge.liveScore?.set2?.a ?? 0}</span>
              {(scoreEval.needsSuperTieBreak ||
                (challenge.liveScore?.set3?.a ?? 0) > 0 ||
                (challenge.liveScore?.set3?.b ?? 0) > 0) && (
                <span className="tt-sb-cell is-stb">
                  {challenge.liveScore?.set3?.a ?? 0}
                </span>
              )}
            </div>
            {isFinished && typeof challenge.eloDeltaA === 'number' && isOfficial && (
              <span
                className={`tt-delta-pill ${challenge.eloDeltaA >= 0 ? 'is-pos' : 'is-neg'}`}
              >
                {challenge.eloDeltaA >= 0 ? `+${challenge.eloDeltaA}` : challenge.eloDeltaA}
              </span>
            )}
          </div>

          <div className="tt-mini-sb-row">
            <span className="tt-mini-sb-name">
              {playerB?.name?.split(' ')[0] || 'B'}
              {isFinished && challenge.winnerId === playerB?.id && (
                <TTIcon name="check" size={13} style={{ color: '#00DC7D' }} />
              )}
            </span>
            <div className="tt-mini-sb-sets">
              <span className="tt-sb-cell">{challenge.liveScore?.set1?.b ?? 0}</span>
              <span className="tt-sb-cell">{challenge.liveScore?.set2?.b ?? 0}</span>
              {(scoreEval.needsSuperTieBreak ||
                (challenge.liveScore?.set3?.a ?? 0) > 0 ||
                (challenge.liveScore?.set3?.b ?? 0) > 0) && (
                <span className="tt-sb-cell is-stb">
                  {challenge.liveScore?.set3?.b ?? 0}
                </span>
              )}
            </div>
            {isFinished && typeof challenge.eloDeltaB === 'number' && isOfficial && (
              <span
                className={`tt-delta-pill ${challenge.eloDeltaB >= 0 ? 'is-pos' : 'is-neg'}`}
              >
                {challenge.eloDeltaB >= 0 ? `+${challenge.eloDeltaB}` : challenge.eloDeltaB}
              </span>
            )}
          </div>

          {/* Trazabilidad limpia de Tie-Break o Juez en Cancha */}
          <div className="tt-mini-sb-foot">
            <span>
              {challenge.scoreSummary || scoreEval.summary || 'Partido iniciado'}
            </span>
            <span>
              {judgePlayer
                ? `Juez en cancha: ${judgePlayer.name}`
                : isLive
                ? perms.canEditScore
                  ? 'Edición habilitada'
                  : 'En vivo · Solo lectura'
                : 'Acta validada'}
            </span>
          </div>
        </div>
      )}

      {/* Meta de Sede Oficial + Acuerdo de Pelotas */}
      <div className="tt-match-venue-bar">
        <div className="tt-match-venue-item">
          <TTIcon name="mapPin" size={15} style={{ color: '#00DC7D' }} />
          <span>{challenge.clubName || 'Sede por definir'}</span>
        </div>
        {challenge.ballsAgreement && (
          <div className="tt-match-venue-item is-subtle">
            <TTIcon name="ball" size={14} style={{ color: '#F59E0B' }} />
            <span>{challenge.ballsAgreement}</span>
          </div>
        )}
      </div>

      {/* Barra de Acciones según Rol y Estado */}
      <div className="tt-match-actions">
        {/* Caso 1: Reto Pendiente y el usuario actual es el RETADO */}
        {isPending && perms.isPlayerB && (
          <>
            <button
              type="button"
              className="tt-btn tt-btn-primary tt-btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                triggerHaptic('success');
                onAcceptChallenge(challenge);
              }}
            >
              Aceptar Desafío
            </button>
            <button
              type="button"
              className="tt-btn tt-btn-ghost tt-btn-sm"
              onClick={() => {
                triggerHaptic('warning');
                onDeclineChallenge(challenge);
              }}
            >
              Declinar
            </button>
          </>
        )}

        {/* Caso 2: Reto Pendiente enviado por mí */}
        {isPending && perms.isPlayerA && (
          <div className="tt-waiting-banner">
            <TTIcon name="clock" size={15} />
            <span>Esperando confirmación de {playerB?.name || 'tu rival'}</span>
          </div>
        )}

        {/* Caso 3: Programado (Protagonistas pueden Iniciar en Cancha o Reprogramar 24h) */}
        {isScheduled && showManagementActions && (perms.isParticipant || isAdmin) && (
          <>
            <button
              type="button"
              className="tt-btn tt-btn-primary tt-btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                triggerHaptic('medium');
                onStartMatch(challenge);
              }}
            >
              <TTIcon name="scoreboard" size={16} />
              Iniciar en Cancha
            </button>

            {perms.canReschedule && (
              <button
                type="button"
                className="tt-btn tt-btn-secondary tt-btn-sm"
                onClick={() => {
                  triggerHaptic('light');
                  onOpenReschedule(challenge);
                }}
              >
                <TTIcon name="clock" size={15} />
                {perms.rescheduleMode === 'ORDINARY_ALLOWED' ? 'Cambiar hora' : 'Clima / Aviso'}
              </button>
            )}
          </>
        )}

        {/* Caso 4: En Juego -> Botón Match Center / Marcador (Editable solo para protagonistas/Juez/Admin) */}
        {isLive && (
          <button
            type="button"
            className={`tt-btn ${perms.canEditScore ? 'tt-btn-primary' : 'tt-btn-secondary'} tt-btn-sm`}
            style={{ flex: 1 }}
            onClick={() => {
              triggerHaptic('light');
              onOpenScoreboard(challenge);
            }}
          >
            <TTIcon name="scoreboard" size={16} />
            {perms.canEditScore ? 'Abrir Marcador Oficial' : 'Seguir Marcador en Vivo'}
          </button>
        )}

        {/* Caso 5: Finalizado -> Ver Acta o Publicar Victoria en Stories */}
        {isFinished && (perms.isParticipant || isAdmin) && onOpenStories && (
          <button
            type="button"
            className="tt-btn tt-btn-secondary tt-btn-sm"
            style={{ flex: 1 }}
            onClick={() => {
              triggerHaptic('light');
              onOpenStories({ challenge, playerA, playerB });
            }}
          >
            <TTIcon name="stories" size={16} />
            Publicar en Stories
          </button>
        )}

        {/* Acceso rápido WhatsApp (Solo para participantes en partidos no finalizados) */}
        {!isFinished && perms.isParticipant && whatsappUrl && !opponent?.hideWhatsapp && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tt-icon-action-btn is-wa"
            aria-label={`Coordinar por WhatsApp con ${opponent?.name}`}
            onClick={() => triggerHaptic('light')}
          >
            <TTIcon name="whatsapp" size={18} />
          </a>
        )}
      </div>
    </article>
  );
}

/* ==========================================================================
   VISTA PRINCIPAL: RetosView (BLOQUE 10 DE 26)
   ========================================================================== */
export default function RetosView({
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  currentUser = null,
  isAdmin = false,
  theme = 'dark',
  sunlightMode = false,
  onCreateChallenge,
  onUpdateChallenge,
  onFinalizeMatch,
  onOpenPlayerProfile,
  onOpenStoriesWithMatch,
  onOpenAuth,
  onGoToTournaments,
  onNotify,
}) {
  const heroRef = useRef(null);
  useScrollReveal(heroRef, { startRevealed: true });

  // Sub-pestaña activa: 'cartelera' | 'mis-retos' | 'lanzar'
  const [subTab, setSubTab] = useState('cartelera');
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  // Reloj en vivo (America/Lima) y clima real Open-Meteo
  const [clockNow, setClockNow] = useState(() => new Date());
  const [liveWeather, setLiveWeather] = useState(() => ({
    tempC: clubs?.[0]?.climaBase?.tempC ?? 19,
    uvIndex: clubs?.[0]?.climaBase?.uvIndex ?? 7,
    status: clubs?.[0]?.climaBase?.status ?? 'Seco y Óptimo',
    conditionKey: clubs?.[0]?.climaBase?.conditionKey ?? 'seco',
    updatedAt: null,
  }));

  // Filtros de la pestaña "Lanzar Reto"
  const [rivalSearch, setRivalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [onlyInRange, setOnlyInRange] = useState(true);

  // Filtro de la Cartelera
  const [boardFilter, setBoardFilter] = useState('ALL'); // ALL | IN_PLAY | SCHEDULED | FINISHED

  // Modales en Portal
  const [challengeTarget, setChallengeTarget] = useState(null); // Rival elegido para crear reto
  const [activeScoreboardId, setActiveScoreboardId] = useState(null); // ID del reto en el Match Center
  const [rescheduleTarget, setRescheduleTarget] = useState(null); // Reto a reprogramar / suspender
  const [celebrationPayload, setCelebrationPayload] = useState(null); // Celebración post-partido

  // Estado del formulario "Crear Nuevo Desafío"
  const [formMode, setFormMode] = useState('Por puntos');
  const [formClubId, setFormClubId] = useState(clubs?.[0]?.id || 'club-country');
  const [formCustomVenue, setFormCustomVenue] = useState('');
  const [formDate, setFormDate] = useState(() => getTodayDateInputValue(1));
  const [formTime, setFormTime] = useState('18:00');
  const [formBalls, setFormBalls] = useState(BALLS_AGREEMENTS[0]);

  // Estado del formulario "Reprogramar / Clima"
  const [reschedDate, setReschedDate] = useState(() => getTodayDateInputValue(2));
  const [reschedTime, setReschedTime] = useState('19:00');
  const [reschedReason, setReschedReason] = useState('Lluvia intensa en cancha');

  // Estado del modal de cierre oficial (Walkover)
  const [showWalkoverBox, setShowWalkoverBox] = useState(false);

  // 1. Reloj en vivo (actualización cada segundo para el segundero del reloj analógico)
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // 2. Clima real Open-Meteo ($0) al montar la vista
  useEffect(() => {
    let active = true;
    const coords = clubs?.[0]?.coordinates || { lat: -12.0651, lng: -75.2049 };
    fetchLiveClubWeather(coords.lat, coords.lng).then((res) => {
      if (active && res?.ok) {
        setLiveWeather(res);
      }
    });
    return () => {
      active = false;
    };
  }, [clubs]);

  // Mapa rápido ID -> Jugador
  const playersMap = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  // Retos clasificados
  const liveChallenges = useMemo(
    () => (challenges || []).filter((c) => c.status === 'IN_PLAY'),
    [challenges]
  );

  // Retos entrantes pendientes dirigidos al usuario actual (matching estricto por ID)
  const incomingPending = useMemo(() => {
    if (!currentUser?.id) return [];
    return (challenges || []).filter(
      (c) => c.status === 'PENDING' && c.playerBId === currentUser.id
    );
  }, [challenges, currentUser]);

  // Tus Desafíos (todos donde participas)
  const myChallenges = useMemo(() => {
    if (!currentUser?.id) return [];
    const orderWeight = { PENDING: 0, IN_PLAY: 1, SCHEDULED: 2, FINISHED: 3 };
    return (challenges || [])
      .filter((c) => c.playerAId === currentUser.id || c.playerBId === currentUser.id)
      .sort((a, b) => (orderWeight[a.status] ?? 9) - (orderWeight[b.status] ?? 9));
  }, [challenges, currentUser]);

  // Cartelera Pública filtrada
  const publicBoardChallenges = useMemo(() => {
    const orderWeight = { IN_PLAY: 0, SCHEDULED: 1, FINISHED: 2, PENDING: 3 };
    return (challenges || [])
      .filter((c) => c.status !== 'DECLINED')
      .filter((c) => (boardFilter === 'ALL' ? true : c.status === boardFilter))
      .sort((a, b) => (orderWeight[a.status] ?? 9) - (orderWeight[b.status] ?? 9));
  }, [challenges, boardFilter]);

  // Lista de Rivales para "Lanzar Reto"
  const availableRivals = useMemo(() => {
    const myPoints = Number(currentUser?.points) || 1500;
    const q = rivalSearch.trim().toLowerCase();

    return (players || [])
      .filter((p) => !currentUser || p.id !== currentUser.id)
      .filter((p) => {
        if (categoryFilter !== 'ALL' && getCategoryByPoints(p.points).id !== categoryFilter) {
          return false;
        }
        if (q) {
          const hay = `${p.name} ${p.clubName || ''} ${p.division || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((p) => {
        const gap = Math.abs((Number(p.points) || 0) - myPoints);
        const inOfficialRange = gap <= MAX_OFFICIAL_ELO_WINDOW;
        return { player: p, gap, inOfficialRange };
      })
      .filter((item) => (onlyInRange ? item.inOfficialRange : true))
      .sort((a, b) => {
        if (a.inOfficialRange !== b.inOfficialRange) return a.inOfficialRange ? -1 : 1;
        return a.gap - b.gap;
      });
  }, [players, currentUser, rivalSearch, categoryFilter, onlyInRange]);

  // Reto activo en el Match Center modal
  const activeScoreboardChallenge = useMemo(
    () => (challenges || []).find((c) => c.id === activeScoreboardId) || null,
    [challenges, activeScoreboardId]
  );

  // Diapositivas del Hero Editorial
  const heroSlides = useMemo(() => {
    const featuredLive = liveChallenges[0];
    const pA = featuredLive ? playersMap[featuredLive.playerAId] : null;
    const pB = featuredLive ? playersMap[featuredLive.playerBId] : null;

    return [
      {
        id: 'slide-1',
        tag: featuredLive ? 'DUELO ESTELAR EN CANCHA' : 'CIRCUITO OFICIAL',
        title: featuredLive
          ? `${pA?.name?.split(' ')[0] || 'Duelo'} vs. ${pB?.name?.split(' ')[0] || 'Rival'}: Partido al rojo vivo`
          : 'Pacta tu próximo partido oficial y escala en el Ranking',
        subtitle: featuredLive
          ? `${featuredLive.clubName} · Seguimiento oficial en tiempo real`
          : 'Cada set y cada tie-break cuentan bajo el motor de 3 Jaulas Finitas.',
        image: ASSETS.torneoApertura,
        ctaLabel: featuredLive ? 'VER MARCADOR EN VIVO' : 'LANZAR UN RETO',
        onCta: () => {
          triggerHaptic('light');
          if (featuredLive) setActiveScoreboardId(featuredLive.id);
          else setSubTab('lanzar');
        },
      },
      {
        id: 'slide-2',
        tag: 'CARRERA ANUAL · MASTER TOP 8',
        title: 'Suma puntos en las 4 temporadas y clasifica al Top 8',
        subtitle: 'Los 8 primeros del año juegan el Torneo de Maestros sin costo de inscripción.',
        image: ASSETS.torneoMasterTop8,
        ctaLabel: 'VER TORNEOS Y MASTER',
        onCta: () => {
          triggerHaptic('light');
          if (onGoToTournaments) onGoToTournaments();
        },
      },
      {
        id: 'slide-3',
        tag: 'ARCILLA Y COMPETENCIA',
        title: 'Desafía rivales de tu nivel en las 4 sedes oficiales',
        subtitle: 'Acuerda horario, sede oficial o cancha libre y registra el acta oficial.',
        image: ASSETS.torneoAltura,
        ctaLabel: 'BUSCAR RIVAL AHORA',
        onCta: () => {
          triggerHaptic('light');
          setSubTab('lanzar');
        },
      },
    ];
  }, [liveChallenges, playersMap, onGoToTournaments]);

  const activeSlide = heroSlides[heroSlideIdx % heroSlides.length];
  const limaClock = getLimaClockParts(clockNow);

  // Auto-rotación suave del Hero (cada 7.5 s)
  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 7500);
    return () => window.clearInterval(id);
  }, [heroSlides.length]);

  /* ------------------------------------------------------------------------
     ACCIONES DE NEGOCIO (CREAR RETO, ACEPTAR, INICIAR, MARCADOR, CERRAR)
     ------------------------------------------------------------------------ */
  const openCreateChallengeModal = (rival, forceFriendly = false) => {
    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para pactar un desafío oficial.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    const gap = Math.abs((Number(rival.points) || 0) - (Number(currentUser.points) || 0));
    setFormMode(forceFriendly || gap > MAX_OFFICIAL_ELO_WINDOW ? 'Amistoso' : 'Por puntos');
    setFormClubId(currentUser.clubId && currentUser.clubId !== 'independiente' ? currentUser.clubId : clubs?.[0]?.id || 'club-country');
    setFormCustomVenue('');
    setFormDate(getTodayDateInputValue(1));
    setFormTime('18:00');
    setFormBalls(BALLS_AGREEMENTS[0]);
    setChallengeTarget(rival);
  };

  const handleSubmitNewChallenge = (e) => {
    e.preventDefault();
    if (!currentUser || !challengeTarget) return;

    const isCustom = formClubId === 'custom';
    const selectedClub = clubs.find((c) => c.id === formClubId);
    const venueName = isCustom
      ? formCustomVenue.trim()
      : selectedClub?.name || 'Sede por definir';

    if (isCustom && venueName.length < 3) {
      if (onNotify) onNotify('Escribe el nombre de la cancha o sede personalizada.', 'warning');
      return;
    }

    const scheduledIso = new Date(`${formDate}T${formTime}:00-05:00`).toISOString();
    const { dateText, timeText } = formatDynamicDateAndTime(scheduledIso);

    const newChallenge = {
      id: `ch-${Date.now()}`,
      isDemo: false,
      playerAId: currentUser.id,
      playerBId: challengeTarget.id,
      judgeId: null,
      clubId: isCustom ? 'custom' : selectedClub?.id || 'custom',
      clubName: venueName,
      scheduledIso,
      dateLabel: dateText,
      timeLabel: timeText,
      mode: formMode,
      ballsAgreement: formBalls,
      status: 'PENDING',
      rescheduleCount: 0,
      liveScore: createEmptyLiveScore(),
      winnerId: null,
    };

    if (onCreateChallenge) onCreateChallenge(newChallenge);
    triggerHaptic('success');
    if (onNotify) {
      onNotify(`Desafío enviado a ${challengeTarget.name}. Queda pendiente de su aceptación.`, 'success');
    }
    setChallengeTarget(null);
    setSubTab('mis-retos');
  };

  const handleAcceptChallenge = (ch) => {
    if (!onUpdateChallenge) return;
    onUpdateChallenge(ch.id, { status: 'SCHEDULED' });
    if (onNotify) onNotify('¡Desafío confirmado! Ya aparece en la Cartelera Oficial.', 'success');
  };

  const handleDeclineChallenge = (ch) => {
    if (!onUpdateChallenge) return;
    onUpdateChallenge(ch.id, { status: 'DECLINED' });
    if (onNotify) onNotify('Desafío declinado.', 'info');
  };

  const handleStartMatch = (ch) => {
    if (!onUpdateChallenge) return;
    onUpdateChallenge(ch.id, {
      status: 'IN_PLAY',
      liveScore: ch.liveScore || createEmptyLiveScore(),
    });
    setActiveScoreboardId(ch.id);
    if (onNotify) onNotify('Partido en juego. El marcador en vivo ya está activo.', 'success');
  };

  const handleScoreboardAction = (action) => {
    if (!activeScoreboardChallenge || !onUpdateChallenge) return;
    const nextScore = stepLiveScoreboard(activeScoreboardChallenge.liveScore, action);
    onUpdateChallenge(activeScoreboardChallenge.id, { liveScore: nextScore });
  };

  const handleAssignJudge = (judgeId) => {
    if (!activeScoreboardChallenge || !onUpdateChallenge) return;
    onUpdateChallenge(activeScoreboardChallenge.id, {
      judgeId: judgeId || null,
    });
    const jPlayer = playersMap[judgeId];
    if (onNotify) {
      onNotify(
        jPlayer
          ? `${jPlayer.name} fue designado como Juez en Cancha para llevar el marcador.`
          : 'Se retiró el Juez en Cancha externo.',
        'info'
      );
    }
  };

  const handleConfirmOfficialResult = ({ isWalkover = false, walkoverWinnerSide = null } = {}) => {
    if (!activeScoreboardChallenge) return;
    const pA = playersMap[activeScoreboardChallenge.playerAId];
    const pB = playersMap[activeScoreboardChallenge.playerBId];
    if (!pA || !pB) return;

    const isOfficial = activeScoreboardChallenge.mode !== 'Amistoso';
    let eloResult;

    if (isOfficial) {
      eloResult = calculateOfficialMatchElo({
        playerA: pA,
        playerB: pB,
        liveScore: activeScoreboardChallenge.liveScore,
        challenges,
        totalActivePlayers: Math.max(players.length, 130),
        isWalkover,
        walkoverWinnerSide,
      });
      if (!eloResult.ok) {
        triggerHaptic('warning');
        if (onNotify) onNotify(eloResult.error || 'El marcador aún no cierra un partido válido.', 'warning');
        return;
      }
    } else {
      const ev = evaluateMatchScore(activeScoreboardChallenge.liveScore);
      if (!isWalkover && (!ev.valid || !ev.finished)) {
        if (onNotify) onNotify(ev.error || 'Completa un marcador válido antes de cerrar.', 'warning');
        return;
      }
      eloResult = {
        ok: true,
        winnerSide: isWalkover ? walkoverWinnerSide : ev.winnerSide,
        summary: isWalkover ? 'W.O.' : ev.summary,
        cageLabel: 'Partido Amistoso (Sin impacto ELO)',
        deltaA: 0,
        deltaB: 0,
        newPointsA: pA.points,
        newPointsB: pB.points,
        promotedA: false,
        promotedB: false,
      };
    }

    if (onFinalizeMatch) {
      onFinalizeMatch({
        challenge: activeScoreboardChallenge,
        eloResult,
        liveScore: activeScoreboardChallenge.liveScore,
        isWalkover,
        walkoverWinnerSide,
      });
    }

    triggerHaptic('success');
    setShowWalkoverBox(false);
    setActiveScoreboardId(null);

    // Disparar modal de celebración con GIF oficial
    const winnerPlayer = eloResult.winnerSide === 'A' ? pA : pB;
    const promoted = eloResult.winnerSide === 'A' ? eloResult.promotedA : eloResult.promotedB;
    setCelebrationPayload({
      challenge: {
        ...activeScoreboardChallenge,
        status: 'FINISHED',
        scoreSummary: eloResult.summary,
        winnerId: winnerPlayer.id,
        eloDeltaA: eloResult.deltaA,
        eloDeltaB: eloResult.deltaB,
      },
      playerA: pA,
      playerB: pB,
      winnerPlayer,
      eloResult,
      promoted,
      isOfficial,
    });
  };

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!rescheduleTarget || !onUpdateChallenge) return;
    const perms = getMatchPermissions(rescheduleTarget, currentUser, isAdmin);
    const rival =
      playersMap[
        rescheduleTarget.playerAId === currentUser?.id
          ? rescheduleTarget.playerBId
          : rescheduleTarget.playerAId
      ];

    const newIso = new Date(`${reschedDate}T${reschedTime}:00-05:00`).toISOString();
    const { dateText, timeText } = formatDynamicDateAndTime(newIso);

    if (perms.rescheduleMode === 'ORDINARY_ALLOWED') {
      onUpdateChallenge(rescheduleTarget.id, {
        scheduledIso: newIso,
        dateLabel: dateText,
        timeLabel: timeText,
        rescheduleCount: (Number(rescheduleTarget.rescheduleCount) || 0) + 1,
      });
      triggerHaptic('success');
      if (onNotify) onNotify(`Horario actualizado para ${dateText} · ${timeText}.`, 'success');
    } else {
      onUpdateChallenge(rescheduleTarget.id, {
        scheduledIso: newIso,
        dateLabel: dateText,
        timeLabel: timeText,
        climateNote: reschedReason,
      });
      triggerHaptic('medium');
      if (onNotify) {
        onNotify(`Reprogramación por clima/emergencia registrada (${reschedReason}).`, 'info');
      }
      if (rival && !rival.hideWhatsapp) {
        const wa = buildWhatsAppLink(
          rival.whatsapp,
          `Hola ${rival.name}, aviso urgente desde TOTAL TENIS: por motivo de "${reschedReason}", propongo reprogramar nuestro partido en ${rescheduleTarget.clubName} para el ${dateText} a las ${timeText}.`
        );
        window.open(wa, '_blank', 'noopener,noreferrer');
      }
    }

    setRescheduleTarget(null);
  };

  /* ------------------------------------------------------------------------
     CÁLCULOS EN VIVO PARA EL MODAL ACTIVO (CREAR RETO / MARCADOR)
     ------------------------------------------------------------------------ */
  const preMatchForecast = useMemo(() => {
    if (!currentUser || !challengeTarget) return null;
    return getPreMatchForecast(
      currentUser,
      challengeTarget,
      challenges,
      Math.max(players.length, 130)
    );
  }, [currentUser, challengeTarget, challenges, players.length]);

  const activeSbData = useMemo(() => {
    if (!activeScoreboardChallenge) return null;
    const pA = playersMap[activeScoreboardChallenge.playerAId];
    const pB = playersMap[activeScoreboardChallenge.playerBId];
    const judgePlayer = activeScoreboardChallenge.judgeId
      ? playersMap[activeScoreboardChallenge.judgeId]
      : null;
    const perms = getMatchPermissions(activeScoreboardChallenge, currentUser, isAdmin);
    const liveScore = activeScoreboardChallenge.liveScore || createEmptyLiveScore();
    const scoreEval = evaluateMatchScore(liveScore);
    const previewElo =
      scoreEval.finished && activeScoreboardChallenge.mode !== 'Amistoso' && pA && pB
        ? calculateOfficialMatchElo({
            playerA: pA,
            playerB: pB,
            liveScore,
            challenges,
            totalActivePlayers: Math.max(players.length, 130),
          })
        : null;

    return { pA, pB, judgePlayer, perms, liveScore, scoreEval, previewElo };
  }, [activeScoreboardChallenge, playersMap, currentUser, isAdmin, challenges, players.length]);

  const weatherIconMap = {
    seco: ASSETS.climaSeco,
    humedad: ASSETS.climaHumedad,
    llovizna: ASSETS.climaLlovizna,
    lluvia: ASSETS.climaLluvia,
  };

  return (
    <section
      className={`tt-retos-view ${theme === 'light' ? 'is-light' : 'is-dark'} ${
        sunlightMode ? 'is-sunlight' : ''
      }`}
      aria-label="Retos y Cartelera Oficial TOTAL TENIS"
    >
      {/* ====================================================================
          1. HERO EDITORIAL ASIMÉTRICO + WIDGETS EN VIVO (RELOJ + CLIMA REAL)
          ==================================================================== */}
      <div ref={heroRef} className="tt-retos-hero-grid tt-reveal-box">
        {/* Columna Izquierda: Carrusel Editorial Principal con Contraste Blindado */}
        <div className="tt-hero-stage">
          <SmartImage
            src={activeSlide.image}
            fallbackSrc={ASSETS.bienvenidaOscuro}
            alt={activeSlide.title}
            priority
            className="tt-hero-stage-bg"
          />
          <div className="tt-hero-stage-scrim" />

          <div className="tt-hero-stage-content">
            <span className="tt-hero-eyebrow">
              <span className="tt-live-dot-inline" />
              {activeSlide.tag}
            </span>

            <h1 className="tt-hero-headline">{activeSlide.title}</h1>
            <p className="tt-hero-subcopy">{activeSlide.subtitle}</p>

            <div className="tt-hero-footer-row">
              <button
                type="button"
                className="tt-hero-cta-pill"
                onClick={activeSlide.onCta}
              >
                <span className="tt-cta-emerald-dot" />
                {activeSlide.ctaLabel}
              </button>

              <div className="tt-hero-controls">
                <div className="tt-hero-dots" aria-hidden="true">
                  {heroSlides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`tt-hero-dot ${idx === heroSlideIdx ? 'is-active' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setHeroSlideIdx(idx);
                      }}
                      aria-label={`Ir a diapositiva ${idx + 1}`}
                    />
                  ))}
                </div>
                <div className="tt-hero-arrows">
                  <button
                    type="button"
                    aria-label="Anterior"
                    className="tt-circle-nav-btn"
                    onClick={() => {
                      triggerHaptic('light');
                      setHeroSlideIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Siguiente"
                    className="tt-circle-nav-btn"
                    onClick={() => {
                      triggerHaptic('light');
                      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: 2 Widgets Apilados (En Cancha Ahora + Reloj/Clima) */}
        <div className="tt-hero-side-stack">
          {/* Widget Superior: EN CANCHA AHORA + Trofeo 3D recortado */}
          <div className="tt-live-widget-card">
            <div className="tt-live-widget-body">
              <span className="tt-live-widget-kicker">
                <span className="tt-live-dot-inline" />
                EN CANCHA AHORA
              </span>
              <h2 className="tt-live-widget-title">
                {liveChallenges.length > 0
                  ? `${liveChallenges.length} ${liveChallenges.length === 1 ? 'Partido en vivo' : 'Partidos en vivo'}`
                  : 'Canchas listas'}
              </h2>
              <p className="tt-live-widget-desc">
                {liveChallenges.length > 0
                  ? 'Sigue games y tie-breaks en tiempo real.'
                  : 'Pacta tu desafío oficial hoy mismo.'}
              </p>
              <button
                type="button"
                className="tt-live-widget-btn"
                onClick={() => {
                  triggerHaptic('light');
                  if (liveChallenges[0]) {
                    setActiveScoreboardId(liveChallenges[0].id);
                  } else {
                    setSubTab('lanzar');
                  }
                }}
              >
                <span className="tt-cta-emerald-dot" />
                {liveChallenges[0] ? 'SEGUIR EN VIVO' : 'NUEVO RETO'}
              </button>
            </div>
            <SmartImage
              src={ASSETS.trofeoMasterTop8}
              fallbackSrc={ASSETS.trofeoCampeonGira}
              alt=""
              className="tt-live-widget-trophy"
            />
          </div>

          {/* Widget Inferior: HORA OFICIAL PERÚ (Reloj Analógico) + CLIMA REAL */}
          <div className="tt-clock-weather-pill">
            <div className="tt-cw-left">
              <AnalogClockLima
                hours={limaClock.hours}
                minutes={limaClock.minutes}
                seconds={limaClock.seconds}
                size={46}
              />
              <div>
                <span className="tt-cw-kicker">HORA DE CANCHA</span>
                <strong className="tt-cw-time">{limaClock.digital}</strong>
              </div>
            </div>

            <div className="tt-cw-divider" />

            <div className="tt-cw-right">
              <SmartImage
                src={weatherIconMap[liveWeather.conditionKey] || ASSETS.climaSeco}
                alt={liveWeather.status}
                style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <strong className="tt-cw-temp">
                  {liveWeather.tempC}°C · UV {liveWeather.uvIndex}
                </strong>
                <span className="tt-cw-status">{liveWeather.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. ALERTA PRIORITARIA DE RETOS ENTRANTES PENDIENTES (POR ID ÚNICO)
          ==================================================================== */}
      {incomingPending.length > 0 && (
        <div className="tt-incoming-alert">
          <div className="tt-incoming-alert-head">
            <IconBadge name="challenge" variant="emerald" size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="tt-incoming-kicker">
                TIENES {incomingPending.length} {incomingPending.length === 1 ? 'DESAFÍO PENDIENTE' : 'DESAFÍOS PENDIENTES'}
              </span>
              <strong style={{ display: 'block', fontSize: '0.94rem' }}>
                {playersMap[incomingPending[0].playerAId]?.name || 'Un jugador'} te ha retado en{' '}
                {incomingPending[0].clubName}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="tt-btn tt-btn-primary tt-btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                triggerHaptic('success');
                handleAcceptChallenge(incomingPending[0]);
              }}
            >
              Aceptar ahora
            </button>
            <button
              type="button"
              className="tt-btn tt-btn-secondary tt-btn-sm"
              onClick={() => {
                triggerHaptic('light');
                setSubTab('mis-retos');
              }}
            >
              Ver detalles
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          3. SELECTOR DE 3 SUB-VISTAS OPERATIVAS (CARTELERA | TUS DESAFÍOS | LANZAR)
          ==================================================================== */}
      <div className="tt-subtabs-bar" role="tablist" aria-label="Secciones de Retos">
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'cartelera'}
          className={`tt-subtab-btn ${subTab === 'cartelera' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setSubTab('cartelera');
          }}
        >
          <span>Cartelera</span>
          {liveChallenges.length > 0 && (
            <span className="tt-subtab-chip is-live">{liveChallenges.length}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'mis-retos'}
          className={`tt-subtab-btn ${subTab === 'mis-retos' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setSubTab('mis-retos');
          }}
        >
          <span>Tus Desafíos</span>
          {myChallenges.filter((c) => c.status !== 'FINISHED').length > 0 && (
            <span className="tt-subtab-chip">
              {myChallenges.filter((c) => c.status !== 'FINISHED').length}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'lanzar'}
          className={`tt-subtab-btn is-cta ${subTab === 'lanzar' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setSubTab('lanzar');
          }}
        >
          <TTIcon name="challenge" size={15} />
          <span>Lanzar Reto</span>
        </button>
      </div>

      {/* ====================================================================
          4A. SUB-VISTA 1: CARTELERA PÚBLICA (MODO ESPECTADOR & EN VIVO)
          ==================================================================== */}
      {subTab === 'cartelera' && (
        <div className="tt-retos-panel">
          <div className="tt-filter-pills-row">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'IN_PLAY', label: 'En juego' },
              { id: 'SCHEDULED', label: 'Programados' },
              { id: 'FINISHED', label: 'Resultados' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`tt-filter-chip ${boardFilter === f.id ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setBoardFilter(f.id);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {publicBoardChallenges.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="La cancha está esperando"
              description="Todavía no hay duelos publicados en este filtro. Sé el primero en abrir la jornada."
              actionLabel="Buscar Oponente Ahora"
              onAction={() => setSubTab('lanzar')}
            />
          ) : (
            <div className="tt-matches-grid">
              {publicBoardChallenges.map((ch) => (
                <MatchPosterCard
                  key={ch.id}
                  challenge={ch}
                  playerA={playersMap[ch.playerAId]}
                  playerB={playersMap[ch.playerBId]}
                  judgePlayer={ch.judgeId ? playersMap[ch.judgeId] : null}
                  clubs={clubs}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  showManagementActions={false}
                  onOpenScoreboard={(item) => setActiveScoreboardId(item.id)}
                  onStartMatch={handleStartMatch}
                  onAcceptChallenge={handleAcceptChallenge}
                  onDeclineChallenge={handleDeclineChallenge}
                  onOpenReschedule={(item) => {
                    setReschedDate(getTodayDateInputValue(2));
                    setReschedTime('19:00');
                    setRescheduleTarget(item);
                  }}
                  onOpenPlayerProfile={onOpenPlayerProfile}
                  onOpenStories={onOpenStoriesWithMatch}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          4B. SUB-VISTA 2: TUS DESAFÍOS (GESTIÓN PRIVADA Y ACTAS OFICIALES)
          ==================================================================== */}
      {subTab === 'mis-retos' && (
        <div className="tt-retos-panel">
          {!currentUser ? (
            <EmptyStateCard
              theme={theme}
              title="Inicia sesión para gestionar tus partidos"
              description="Aquí verás tus retos recibidos, partidos programados y actas oficiales listas para confirmar."
              actionLabel="Iniciar Sesión"
              onAction={() => onOpenAuth && onOpenAuth('login')}
            />
          ) : myChallenges.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Aún no tienes duelos pactados"
              description="Elige un rival de tu categoría en Lanzar Reto, acuerda sede y suma puntos oficiales."
              actionLabel="Lanzar mi Primer Reto"
              onAction={() => setSubTab('lanzar')}
            />
          ) : (
            <div className="tt-matches-grid">
              {myChallenges.map((ch) => (
                <MatchPosterCard
                  key={ch.id}
                  challenge={ch}
                  playerA={playersMap[ch.playerAId]}
                  playerB={playersMap[ch.playerBId]}
                  judgePlayer={ch.judgeId ? playersMap[ch.judgeId] : null}
                  clubs={clubs}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  showManagementActions
                  onOpenScoreboard={(item) => setActiveScoreboardId(item.id)}
                  onStartMatch={handleStartMatch}
                  onAcceptChallenge={handleAcceptChallenge}
                  onDeclineChallenge={handleDeclineChallenge}
                  onOpenReschedule={(item) => {
                    setReschedDate(getTodayDateInputValue(2));
                    setReschedTime('19:00');
                    setRescheduleTarget(item);
                  }}
                  onOpenPlayerProfile={onOpenPlayerProfile}
                  onOpenStories={onOpenStoriesWithMatch}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          4C. SUB-VISTA 3: LANZAR RETO (RADAR DE RIVALES Y VENTANA ±1,200 PTS)
          ==================================================================== */}
      {subTab === 'lanzar' && (
        <div className="tt-retos-panel">
          {/* Buscador y toggle de ventana reglamentaria */}
          <div className="tt-radar-controls">
            <div className="tt-search-box">
              <TTIcon name="search" size={17} style={{ opacity: 0.65 }} />
              <input
                type="search"
                value={rivalSearch}
                onChange={(e) => setRivalSearch(e.target.value)}
                placeholder="Buscar rival por nombre o club..."
                aria-label="Buscar rival"
              />
            </div>

            <div className="tt-filter-pills-row">
              <button
                type="button"
                className={`tt-filter-chip ${onlyInRange ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setOnlyInRange((v) => !v);
                }}
              >
                {onlyInRange ? 'Solo en mi rango (±1,200)' : 'Ver todos los niveles'}
              </button>

              <button
                type="button"
                className={`tt-filter-chip ${categoryFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setCategoryFilter('ALL');
                }}
              >
                Todas las categorías
              </button>

              {CATEGORIES_SCALE.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`tt-filter-chip ${categoryFilter === cat.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setCategoryFilter(cat.id);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {availableRivals.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin rivales con esos filtros"
              description="Amplía el rango de categorías o borra la búsqueda para ver todos los jugadores activos."
              actionLabel="Mostrar todos"
              onAction={() => {
                setRivalSearch('');
                setCategoryFilter('ALL');
                setOnlyInRange(false);
              }}
            />
          ) : (
            <div className="tt-rivals-list">
              {availableRivals.map(({ player, inOfficialRange }) => {
                const cat = getCategoryByPoints(player.points);
                const forecast = currentUser
                  ? getPreMatchForecast(
                      currentUser,
                      player,
                      challenges,
                      Math.max(players.length, 130)
                    )
                  : null;
                const wins = Number(player.wins) || 0;
                const losses = Number(player.losses) || 0;
                const total = wins + losses;
                const eff = total > 0 ? Math.round((wins / total) * 100) : 0;

                return (
                  <div
                    key={player.id}
                    className={`tt-rival-row ${!inOfficialRange ? 'is-out-of-range' : ''}`}
                  >
                    <PlayerAvatarWithClub
                      player={player}
                      clubs={clubs}
                      size={52}
                      ringColor={cat.color}
                      onClick={onOpenPlayerProfile}
                    />

                    <div className="tt-rival-info">
                      <div className="tt-rival-name-line">
                        <strong>{player.name}</strong>
                        {player.isVip && <span className="tt-badge-vip">VIP</span>}
                      </div>

                      <div className="tt-rival-meta-line">
                        <span
                          className="tt-cat-mini-pill"
                          style={{ color: cat.color, backgroundColor: cat.badgeBg }}
                        >
                          {cat.name}
                        </span>
                        <span>{Number(player.points || 0).toLocaleString('es-PE')} pts</span>
                        <span>·</span>
                        <span>{eff}% Efectividad</span>
                      </div>

                      {forecast && inOfficialRange ? (
                        <div className="tt-rival-forecast-line">
                          <span className="is-win">
                            Victoria: +{forecast.playerA.minWin} a +{forecast.playerA.maxWin} pts
                          </span>
                          <span>·</span>
                          <span className="is-loss">
                            Derrota: {forecast.playerA.minLoss} a {forecast.playerA.maxLoss} pts
                          </span>
                        </div>
                      ) : !inOfficialRange ? (
                        <div className="tt-rival-forecast-line">
                          <span>Fuera de ventana oficial (±1,200 pts) · Solo amistoso</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="tt-rival-cta-col">
                      {inOfficialRange ? (
                        <button
                          type="button"
                          className="tt-btn tt-btn-primary tt-btn-sm"
                          onClick={() => {
                            triggerHaptic('medium');
                            openCreateChallengeModal(player, false);
                          }}
                        >
                          Desafiar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="tt-btn tt-btn-ghost tt-btn-sm"
                          onClick={() => {
                            triggerHaptic('light');
                            openCreateChallengeModal(player, true);
                          }}
                        >
                          Amistoso
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL 1 (PORTAL): PACTAR NUEVO DESAFÍO + SEDE PERSONALIZADA
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(challengeTarget)}
        onClose={() => setChallengeTarget(null)}
        title="Pactar Nuevo Desafío"
        subtitle={
          challengeTarget
            ? `${currentUser?.name || 'Tú'} vs. ${challengeTarget.name}`
            : ''
        }
        icon={<IconBadge name="challenge" variant="emerald" size={38} />}
      >
        {challengeTarget && (
          <form onSubmit={handleSubmitNewChallenge} className="tt-form-stack">
            {/* Pronóstico Pre-Partido Transparente */}
            {preMatchForecast && formMode === 'Por puntos' && (
              <div className="tt-forecast-box">
                <div className="tt-forecast-head">
                  <strong>Pronóstico Oficial Pre-Partido</strong>
                  <span className="tt-rematch-tag">{preMatchForecast.rematch.label}</span>
                </div>
                <div className="tt-forecast-grid">
                  <div className="tt-forecast-cell is-win">
                    <span>Techo Victoria (6-0, 6-0)</span>
                    <strong>+{preMatchForecast.playerA.maxWin} pts</strong>
                    <small>Rango según score: +{preMatchForecast.playerA.minWin} a +{preMatchForecast.playerA.maxWin}</small>
                  </div>
                  <div className="tt-forecast-cell is-loss">
                    <span>Riesgo Derrota (0-6, 0-6)</span>
                    <strong>{preMatchForecast.playerA.maxLoss} pts</strong>
                    <small>En 3 sets: {preMatchForecast.playerA.minLoss} pts</small>
                  </div>
                </div>
              </div>
            )}

            {/* Modalidad del Encuentro */}
            <div className="tt-field-group">
              <label className="tt-field-label">Modalidad del partido</label>
              <div className="tt-toggle-pair">
                {['Por puntos', 'Amistoso'].map((m) => {
                  const gap = Math.abs(
                    (Number(challengeTarget.points) || 0) - (Number(currentUser?.points) || 0)
                  );
                  const blocked = m === 'Por puntos' && gap > MAX_OFFICIAL_ELO_WINDOW;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={blocked}
                      className={`tt-choice-pill ${formMode === m ? 'is-selected' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setFormMode(m);
                      }}
                    >
                      {m === 'Por puntos' ? 'Oficial · Por puntos' : 'Amistoso (Sin ELO)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector Visual de Sedes Oficiales + Sede Personalizada */}
            <div className="tt-field-group">
              <label className="tt-field-label">Elige la sede del encuentro</label>
              <div className="tt-venues-select-grid">
                {(clubs || []).map((club) => {
                  const selected = formClubId === club.id;
                  return (
                    <button
                      key={club.id}
                      type="button"
                      className={`tt-venue-option ${selected ? 'is-selected' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setFormClubId(club.id);
                      }}
                    >
                      <SmartImage
                        src={club.logo}
                        alt={club.shortName}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          backgroundColor: '#FFFFFF',
                          flexShrink: 0,
                        }}
                      />
                      <span>{club.shortName}</span>
                    </button>
                  );
                })}

                {/* Opción explícita: Otra Cancha / Sede Personalizada */}
                <button
                  type="button"
                  className={`tt-venue-option is-custom ${formClubId === 'custom' ? 'is-selected' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setFormClubId('custom');
                  }}
                >
                  <TTIcon name="mapPin" size={18} />
                  <span>Otra Cancha / Sede Personalizada</span>
                </button>
              </div>

              {formClubId === 'custom' && (
                <input
                  type="text"
                  className="tt-input"
                  value={formCustomVenue}
                  onChange={(e) => setFormCustomVenue(e.target.value)}
                  placeholder="Ej. Cancha Municipal, Club Privado o dirección exacta..."
                  maxLength={70}
                  required
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            {/* Fecha y Hora Táctil */}
            <div className="tt-date-time-grid">
              <div className="tt-field-group">
                <label className="tt-field-label" htmlFor="tt-reto-date">
                  Fecha del partido
                </label>
                <input
                  id="tt-reto-date"
                  type="date"
                  className="tt-input"
                  value={formDate}
                  min={getTodayDateInputValue(0)}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div className="tt-field-group">
                <label className="tt-field-label" htmlFor="tt-reto-time">
                  Hora exacta
                </label>
                <input
                  id="tt-reto-time"
                  type="time"
                  className="tt-input"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="tt-quick-slots-row">
              {QUICK_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`tt-slot-chip ${formTime === slot ? 'is-selected' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setFormTime(slot);
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>

            {/* Acuerdo de Pelotas */}
            <div className="tt-field-group">
              <label className="tt-field-label">Acuerdo de pelotas</label>
              <div className="tt-balls-stack">
                {BALLS_AGREEMENTS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`tt-choice-pill ${formBalls === opt ? 'is-selected' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setFormBalls(opt);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
              <button
                type="button"
                className="tt-btn tt-btn-ghost"
                onClick={() => setChallengeTarget(null)}
              >
                Cancelar
              </button>
              <button type="submit" className="tt-btn tt-btn-primary" style={{ flex: 1 }}>
                Enviar Desafío Oficial
              </button>
            </div>
          </form>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 2 (PORTAL): MATCH CENTER & MARCADOR INFINITO (TIE-BREAK 7+ / STB 10+)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(activeScoreboardChallenge && activeSbData)}
        onClose={() => {
          setShowWalkoverBox(false);
          setActiveScoreboardId(null);
        }}
        title="Marcador Oficial en Vivo"
        subtitle={activeScoreboardChallenge?.clubName || ''}
        icon={<IconBadge name="scoreboard" variant="emerald" size={38} />}
        isWide
      >
        {activeScoreboardChallenge && activeSbData && (
          <div className="tt-mc-container">
            {/* Cintillo de Permisos y Trazabilidad */}
            <div className="tt-mc-role-strip">
              <span className="tt-mc-role-badge">
                <TTIcon name="shield" size={14} />
                {activeSbData.perms.roleLabel}
              </span>
              {activeSbData.judgePlayer && (
                <span className="tt-mc-judge-tag">
                  Juez: {activeSbData.judgePlayer.name}
                </span>
              )}
            </div>

            {/* Tablero Estadio Principal */}
            <div className="tt-stadium-board">
              <div className="tt-stadium-head">
                <span>JUGADORES</span>
                <div className="tt-stadium-cols">
                  <span>S1</span>
                  <span>S2</span>
                  {activeSbData.scoreEval.needsSuperTieBreak && (
                    <span style={{ color: '#F59E0B' }}>STB</span>
                  )}
                </div>
              </div>

              {/* Fila Jugador A */}
              <div className="tt-stadium-row">
                <div className="tt-stadium-player">
                  <PlayerAvatarWithClub
                    player={activeSbData.pA}
                    clubs={clubs}
                    size={40}
                    ringColor="#00DC7D"
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong>{activeSbData.pA?.name}</strong>
                    <small>{getCategoryByPoints(activeSbData.pA?.points).name}</small>
                  </div>
                </div>
                <div className="tt-stadium-cols">
                  <span className={`tt-st-num ${activeSbData.liveScore.set1.locked ? 'is-locked' : ''}`}>
                    {activeSbData.liveScore.set1.a}
                    {activeSbData.liveScore.set1.tbA > 0 || activeSbData.liveScore.set1.tbB > 0 ? (
                      <sup>{activeSbData.liveScore.set1.tbA}</sup>
                    ) : null}
                  </span>
                  <span className={`tt-st-num ${activeSbData.liveScore.set2.locked ? 'is-locked' : ''}`}>
                    {activeSbData.liveScore.set2.a}
                    {activeSbData.liveScore.set2.tbA > 0 || activeSbData.liveScore.set2.tbB > 0 ? (
                      <sup>{activeSbData.liveScore.set2.tbA}</sup>
                    ) : null}
                  </span>
                  {activeSbData.scoreEval.needsSuperTieBreak && (
                    <span className="tt-st-num is-stb">{activeSbData.liveScore.set3.a}</span>
                  )}
                </div>
              </div>

              {/* Fila Jugador B */}
              <div className="tt-stadium-row">
                <div className="tt-stadium-player">
                  <PlayerAvatarWithClub
                    player={activeSbData.pB}
                    clubs={clubs}
                    size={40}
                    ringColor="#F59E0B"
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong>{activeSbData.pB?.name}</strong>
                    <small>{getCategoryByPoints(activeSbData.pB?.points).name}</small>
                  </div>
                </div>
                <div className="tt-stadium-cols">
                  <span className={`tt-st-num ${activeSbData.liveScore.set1.locked ? 'is-locked' : ''}`}>
                    {activeSbData.liveScore.set1.b}
                    {activeSbData.liveScore.set1.tbA > 0 || activeSbData.liveScore.set1.tbB > 0 ? (
                      <sup>{activeSbData.liveScore.set1.tbB}</sup>
                    ) : null}
                  </span>
                  <span className={`tt-st-num ${activeSbData.liveScore.set2.locked ? 'is-locked' : ''}`}>
                    {activeSbData.liveScore.set2.b}
                    {activeSbData.liveScore.set2.tbA > 0 || activeSbData.liveScore.set2.tbB > 0 ? (
                      <sup>{activeSbData.liveScore.set2.tbB}</sup>
                    ) : null}
                  </span>
                  {activeSbData.scoreEval.needsSuperTieBreak && (
                    <span className="tt-st-num is-stb">{activeSbData.liveScore.set3.b}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Controles Táctiles de Edición (SOLO Protagonistas, Juez designado o Admin) */}
            {activeSbData.perms.canEditScore ? (
              <div className="tt-mc-controls-wrap">
                {['set1', 'set2'].map((setKey, idx) => {
                  const sObj = activeSbData.liveScore[setKey];
                  const setLabel = idx === 0 ? 'Set 1' : 'Set 2';
                  const inTieBreak = sObj.a === 6 && sObj.b === 6 && !sObj.locked;
                  const canAddA = canIncrementRegularGame(sObj, 'A');
                  const canAddB = canIncrementRegularGame(sObj, 'B');

                  // Ocultar Set 2 si Set 1 aún no está cerrado y Set 2 está en 0-0
                  if (setKey === 'set2' && !activeSbData.liveScore.set1.locked && sObj.a === 0 && sObj.b === 0) {
                    return null;
                  }

                  return (
                    <div key={setKey} className="tt-set-control-card">
                      <div className="tt-set-control-head">
                        <strong>
                          {setLabel} {sObj.locked ? '· Cerrado' : inTieBreak ? '· Tie-Break a 7+ (Dif. 2)' : '· En juego'}
                        </strong>
                        {sObj.locked && (
                          <button
                            type="button"
                            className="tt-unlock-btn"
                            onClick={() => {
                              triggerHaptic('light');
                              handleScoreboardAction({ type: 'UNLOCK_SET', setKey });
                            }}
                          >
                            Corregir set
                          </button>
                        )}
                      </div>

                      {!sObj.locked && !inTieBreak && (
                        <div className="tt-dual-stepper">
                          <div className="tt-stepper-side">
                            <span className="tt-stepper-name">
                              {activeSbData.pA?.name?.split(' ')[0]}
                            </span>
                            <div className="tt-stepper-btns">
                              <button
                                type="button"
                                className="tt-step-minus"
                                disabled={sObj.a <= 0}
                                onClick={() => {
                                  triggerHaptic('light');
                                  handleScoreboardAction({ type: 'GAME_DELTA', setKey, side: 'A', delta: -1 });
                                }}
                              >
                                −
                              </button>
                              <button
                                type="button"
                                className="tt-step-plus"
                                disabled={!canAddA}
                                onClick={() => {
                                  triggerHaptic('score');
                                  handleScoreboardAction({ type: 'GAME_DELTA', setKey, side: 'A', delta: 1 });
                                }}
                              >
                                +1 Game
                              </button>
                            </div>
                          </div>

                          <div className="tt-stepper-side">
                            <span className="tt-stepper-name">
                              {activeSbData.pB?.name?.split(' ')[0]}
                            </span>
                            <div className="tt-stepper-btns">
                              <button
                                type="button"
                                className="tt-step-minus"
                                disabled={sObj.b <= 0}
                                onClick={() => {
                                  triggerHaptic('light');
                                  handleScoreboardAction({ type: 'GAME_DELTA', setKey, side: 'B', delta: -1 });
                                }}
                              >
                                −
                              </button>
                              <button
                                type="button"
                                className="tt-step-plus is-amber"
                                disabled={!canAddB}
                                onClick={() => {
                                  triggerHaptic('score');
                                  handleScoreboardAction({ type: 'GAME_DELTA', setKey, side: 'B', delta: 1 });
                                }}
                              >
                                +1 Game
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Panel Tie-Break en 6-6 (Sin techo superior: 7-5, 8-6, 18-16...) */}
                      {inTieBreak && (
                        <div className="tt-tb-panel">
                          <div className="tt-tb-banner">
                            TIE-BREAK OFICIAL (A 7+ PUNTOS · DIFERENCIA DE 2 SIN TECHO)
                          </div>
                          <div className="tt-dual-stepper">
                            <div className="tt-stepper-side">
                              <span className="tt-stepper-name">
                                {activeSbData.pA?.name?.split(' ')[0]} ({sObj.tbA})
                              </span>
                              <div className="tt-stepper-btns">
                                <button
                                  type="button"
                                  className="tt-step-minus"
                                  disabled={sObj.tbA <= 0}
                                  onClick={() => {
                                    triggerHaptic('light');
                                    handleScoreboardAction({ type: 'TB_DELTA', setKey, side: 'A', delta: -1 });
                                  }}
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  className="tt-step-plus"
                                  onClick={() => {
                                    triggerHaptic('score');
                                    handleScoreboardAction({ type: 'TB_DELTA', setKey, side: 'A', delta: 1 });
                                  }}
                                >
                                  +1 Pt TB
                                </button>
                              </div>
                            </div>

                            <div className="tt-stepper-side">
                              <span className="tt-stepper-name">
                                {activeSbData.pB?.name?.split(' ')[0]} ({sObj.tbB})
                              </span>
                              <div className="tt-stepper-btns">
                                <button
                                  type="button"
                                  className="tt-step-minus"
                                  disabled={sObj.tbB <= 0}
                                  onClick={() => {
                                    triggerHaptic('light');
                                    handleScoreboardAction({ type: 'TB_DELTA', setKey, side: 'B', delta: -1 });
                                  }}
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  className="tt-step-plus is-amber"
                                  onClick={() => {
                                    triggerHaptic('score');
                                    handleScoreboardAction({ type: 'TB_DELTA', setKey, side: 'B', delta: 1 });
                                  }}
                                >
                                  +1 Pt TB
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 3er Set Super Tie-Break (Solo si empatan 1-1 · A 10+ diferencia de 2 SIN TECHO) */}
                {activeSbData.scoreEval.needsSuperTieBreak && (
                  <div className="tt-set-control-card is-stb-card">
                    <div className="tt-set-control-head">
                      <strong>
                        3er Set · Super Tie-Break a 10+ (Dif. de 2 sin techo)
                      </strong>
                      {activeSbData.liveScore.set3.locked && (
                        <button
                          type="button"
                          className="tt-unlock-btn"
                          onClick={() => {
                            triggerHaptic('light');
                            handleScoreboardAction({ type: 'UNLOCK_SET', setKey: 'set3' });
                          }}
                        >
                          Corregir STB
                        </button>
                      )}
                    </div>

                    {!activeSbData.liveScore.set3.locked && (
                      <div className="tt-dual-stepper">
                        <div className="tt-stepper-side">
                          <span className="tt-stepper-name">
                            {activeSbData.pA?.name?.split(' ')[0]} ({activeSbData.liveScore.set3.a})
                          </span>
                          <div className="tt-stepper-btns">
                            <button
                              type="button"
                              className="tt-step-minus"
                              disabled={activeSbData.liveScore.set3.a <= 0}
                              onClick={() => {
                                triggerHaptic('light');
                                handleScoreboardAction({ type: 'STB_DELTA', side: 'A', delta: -1 });
                              }}
                            >
                              −
                            </button>
                            <button
                              type="button"
                              className="tt-step-plus"
                              onClick={() => {
                                triggerHaptic('score');
                                handleScoreboardAction({ type: 'STB_DELTA', side: 'A', delta: 1 });
                              }}
                            >
                              +1 Punto
                            </button>
                          </div>
                        </div>

                        <div className="tt-stepper-side">
                          <span className="tt-stepper-name">
                            {activeSbData.pB?.name?.split(' ')[0]} ({activeSbData.liveScore.set3.b})
                          </span>
                          <div className="tt-stepper-btns">
                            <button
                              type="button"
                              className="tt-step-minus"
                              disabled={activeSbData.liveScore.set3.b <= 0}
                              onClick={() => {
                                triggerHaptic('light');
                                handleScoreboardAction({ type: 'STB_DELTA', side: 'B', delta: -1 });
                              }}
                            >
                              −
                            </button>
                            <button
                              type="button"
                              className="tt-step-plus is-amber"
                              onClick={() => {
                                triggerHaptic('score');
                                handleScoreboardAction({ type: 'STB_DELTA', side: 'B', delta: 1 });
                              }}
                            >
                              +1 Punto
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Selector de Juez en Cancha (Exclusivo protagonistas / Admin) */}
                {activeSbData.perms.canAssignJudge && (
                  <div className="tt-judge-assign-box">
                    <label className="tt-field-label" htmlFor="tt-judge-select">
                      Designar Juez en Cancha (Opcional)
                    </label>
                    <select
                      id="tt-judge-select"
                      className="tt-input"
                      value={activeScoreboardChallenge.judgeId || ''}
                      onChange={(e) => handleAssignJudge(e.target.value)}
                    >
                      <option value="">Solo los 2 jugadores editan el marcador</option>
                      {players
                        .filter(
                          (p) =>
                            p.id !== activeScoreboardChallenge.playerAId &&
                            p.id !== activeScoreboardChallenge.playerBId
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({getCategoryByPoints(p.points).name})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Previsualización Matemática de Jaulas Finitas y Cierre Oficial */}
                {activeSbData.scoreEval.finished && (
                  <div className="tt-elo-preview-card">
                    <div className="tt-elo-preview-head">
                      <strong>Marcador completo: {activeSbData.scoreEval.summary}</strong>
                      {activeSbData.previewElo && (
                        <span>{activeSbData.previewElo.cageLabel}</span>
                      )}
                    </div>

                    {activeSbData.previewElo?.ok && (
                      <div className="tt-elo-preview-deltas">
                        <div>
                          <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                          <strong
                            style={{
                              color: activeSbData.previewElo.deltaA >= 0 ? '#00DC7D' : '#F87171',
                            }}
                          >
                            {activeSbData.previewElo.deltaA >= 0
                              ? `+${activeSbData.previewElo.deltaA}`
                              : activeSbData.previewElo.deltaA}{' '}
                            pts
                          </strong>
                        </div>
                        <div>
                          <span>{activeSbData.pB?.name?.split(' ')[0]}</span>
                          <strong
                            style={{
                              color: activeSbData.previewElo.deltaB >= 0 ? '#00DC7D' : '#F87171',
                            }}
                          >
                            {activeSbData.previewElo.deltaB >= 0
                              ? `+${activeSbData.previewElo.deltaB}`
                              : activeSbData.previewElo.deltaB}{' '}
                            pts
                          </strong>
                        </div>
                      </div>
                    )}

                    {activeSbData.perms.canConfirmOfficial ? (
                      <button
                        type="button"
                        className="tt-btn tt-btn-primary"
                        style={{ width: '100%', marginTop: 10 }}
                        onClick={() => handleConfirmOfficialResult({ isWalkover: false })}
                      >
                        Confirmar Marcador Oficial
                      </button>
                    ) : (
                      <p className="tt-muted" style={{ margin: '8px 0 0', fontSize: '0.78rem' }}>
                        Como Juez en Cancha has completado el marcador. Solo los dos jugadores del partido pueden firmar el cierre oficial de puntos.
                      </p>
                    )}
                  </div>
                )}

                {/* Opción discreta de Walkover (Inasistencia) y Reinicio */}
                {activeSbData.perms.canConfirmOfficial && (
                  <div className="tt-mc-secondary-bar">
                    <button
                      type="button"
                      className="tt-text-action"
                      onClick={() => setShowWalkoverBox((v) => !v)}
                    >
                      Reportar Walkover (Inasistencia)
                    </button>
                    <button
                      type="button"
                      className="tt-text-action is-danger"
                      onClick={() => {
                        triggerHaptic('warning');
                        handleScoreboardAction({ type: 'RESET' });
                      }}
                    >
                      Reiniciar marcador a 0-0
                    </button>
                  </div>
                )}

                {showWalkoverBox && activeSbData.perms.canConfirmOfficial && (
                  <div className="tt-wo-box">
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem' }}>
                      El Walkover otorga el 55 % del techo al ganador y aplica el 75 % de penalización al ausente. Selecciona quién se presentó en cancha:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        onClick={() =>
                          handleConfirmOfficialResult({ isWalkover: true, walkoverWinnerSide: 'A' })
                        }
                      >
                        Gana {activeSbData.pA?.name?.split(' ')[0]} (W.O.)
                      </button>
                      <button
                        type="button"
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        onClick={() =>
                          handleConfirmOfficialResult({ isWalkover: true, walkoverWinnerSide: 'B' })
                        }
                      >
                        Gana {activeSbData.pB?.name?.split(' ')[0]} (W.O.)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="tt-spectator-note">
                <TTIcon name="vision" size={18} style={{ color: '#00DC7D' }} />
                <span>
                  Estás en modo espectador de solo lectura. El marcador se actualiza en vivo desde cancha.
                </span>
              </div>
            )}
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 3 (PORTAL): REPROGRAMACIÓN Y REGLA EQUILIBRADA 24 HORAS
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title={
          rescheduleTarget &&
          getMatchPermissions(rescheduleTarget, currentUser, isAdmin).rescheduleMode ===
            'ORDINARY_ALLOWED'
            ? 'Cambiar Fecha y Hora'
            : 'Suspensión por Clima / Emergencia'
        }
        subtitle={rescheduleTarget?.clubName || ''}
        icon={<IconBadge name="clock" variant="gold" size={38} />}
      >
        {rescheduleTarget && (
          <form onSubmit={handleConfirmReschedule} className="tt-form-stack">
            {(() => {
              const p = getMatchPermissions(rescheduleTarget, currentUser, isAdmin);
              const isOrdinary = p.rescheduleMode === 'ORDINARY_ALLOWED';
              return (
                <>
                  <div className={`tt-rule-callout ${isOrdinary ? 'is-ok' : 'is-warn'}`}>
                    <TTIcon name={isOrdinary ? 'check' : 'alert'} size={18} />
                    <div>
                      <strong>
                        {isOrdinary
                          ? 'Cambio ordinario habilitado (1 por partido)'
                          : 'Ventana menor a 24 h o cambio ya usado'}
                      </strong>
                      <p style={{ margin: '3px 0 0', fontSize: '0.77rem', opacity: 0.88 }}>
                        {isOrdinary
                          ? `Faltan ${p.hoursUntilMatch} horas para el partido. Puedes reprogramar 1 vez sin penalización.`
                          : 'Para proteger las reservas de cancha, solo se permite reprogramar por lluvia intensa o emergencia con aviso directo por WhatsApp a tu rival.'}
                      </p>
                    </div>
                  </div>

                  {!isOrdinary && (
                    <div className="tt-field-group">
                      <label className="tt-field-label">Motivo de suspensión</label>
                      <div className="tt-balls-stack">
                        {[
                          'Lluvia intensa en cancha',
                          'Cancha inundada / impracticable',
                          'Emergencia médica o laboral comprobada',
                        ].map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            className={`tt-choice-pill ${reschedReason === reason ? 'is-selected' : ''}`}
                            onClick={() => setReschedReason(reason)}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="tt-date-time-grid">
                    <div className="tt-field-group">
                      <label className="tt-field-label" htmlFor="tt-resched-date">
                        Nueva fecha
                      </label>
                      <input
                        id="tt-resched-date"
                        type="date"
                        className="tt-input"
                        value={reschedDate}
                        min={getTodayDateInputValue(0)}
                        onChange={(e) => setReschedDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="tt-field-group">
                      <label className="tt-field-label" htmlFor="tt-resched-time">
                        Nueva hora
                      </label>
                      <input
                        id="tt-resched-time"
                        type="time"
                        className="tt-input"
                        value={reschedTime}
                        onChange={(e) => setReschedTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="tt-btn tt-btn-primary" style={{ width: '100%' }}>
                    {isOrdinary
                      ? 'Confirmar Nuevo Horario'
                      : 'Reprogramar y Avisar por WhatsApp'}
                  </button>
                </>
              );
            })()}
          </form>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 4 (PORTAL): CELEBRACIÓN POST-PARTIDO + PUBLICAR EN STORIES
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(celebrationPayload)}
        onClose={() => setCelebrationPayload(null)}
        title={celebrationPayload?.promoted ? '¡Ascenso de Categoría!' : '¡Acta Oficial Registrada!'}
        subtitle="TOTAL TENIS · Circuito Oficial"
        icon={<IconBadge name="trophy" variant="gold" size={38} />}
        isTopLayer
      >
        {celebrationPayload && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <SmartImage
              src={celebrationPayload.promoted ? ASSETS.gifCelebracion2 : ASSETS.gifCelebracion1}
              fallbackSrc={ASSETS.trofeoCampeonGira}
              alt="Celebración de victoria"
              style={{
                width: 148,
                height: 148,
                borderRadius: 24,
                objectFit: 'cover',
                border: '2px solid rgba(0, 220, 125, 0.5)',
                boxShadow: '0 14px 30px rgba(0, 220, 125, 0.22)',
              }}
            />

            <div>
              <span className="tt-winner-chip" style={{ marginBottom: 6 }}>
                GANADOR OFICIAL
              </span>
              <h3 className="tt-title-lg" style={{ margin: '4px 0' }}>
                {celebrationPayload.winnerPlayer?.name}
              </h3>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00DC7D' }}>
                {celebrationPayload.eloResult.summary}
              </div>
              <p className="tt-muted" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                {celebrationPayload.eloResult.cageLabel}
              </p>
            </div>

            {celebrationPayload.isOfficial && (
              <div className="tt-elo-preview-deltas" style={{ width: '100%' }}>
                <div>
                  <span>{celebrationPayload.playerA?.name}</span>
                  <strong
                    style={{
                      color: celebrationPayload.eloResult.deltaA >= 0 ? '#00DC7D' : '#F87171',
                    }}
                  >
                    {celebrationPayload.eloResult.deltaA >= 0
                      ? `+${celebrationPayload.eloResult.deltaA}`
                      : celebrationPayload.eloResult.deltaA}{' '}
                    pts
                  </strong>
                </div>
                <div>
                  <span>{celebrationPayload.playerB?.name}</span>
                  <strong
                    style={{
                      color: celebrationPayload.eloResult.deltaB >= 0 ? '#00DC7D' : '#F87171',
                    }}
                  >
                    {celebrationPayload.eloResult.deltaB >= 0
                      ? `+${celebrationPayload.eloResult.deltaB}`
                      : celebrationPayload.eloResult.deltaB}{' '}
                    pts
                  </strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              {onOpenStoriesWithMatch && (
                <button
                  type="button"
                  className="tt-btn tt-btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const payload = {
                      challenge: celebrationPayload.challenge,
                      playerA: celebrationPayload.playerA,
                      playerB: celebrationPayload.playerB,
                    };
                    setCelebrationPayload(null);
                    onOpenStoriesWithMatch(payload);
                  }}
                >
                  <TTIcon name="stories" size={17} />
                  Publicar en Stories
                </button>
              )}
              <button
                type="button"
                className="tt-btn tt-btn-secondary"
                onClick={() => setCelebrationPayload(null)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          ESTILOS ENCAPSULADOS DE PRECISIÓN EDITORIAL (MÓVIL -> DESKTOP)
          ==================================================================== */}
      <style>{`
        .tt-retos-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* 1. HERO ASIMÉTRICO CON SCROLL-REVEAL */
        .tt-retos-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          transform: translate3d(0, calc((1 - var(--tt-reveal, 1)) * 14px), 0);
          opacity: calc(0.65 + (var(--tt-reveal, 1) * 0.35));
          transition: transform 220ms ease-out, opacity 220ms ease-out;
        }
        @media (min-width: 760px) {
          .tt-retos-hero-grid {
            grid-template-columns: 1.55fr 1fr;
            gap: 14px;
          }
        }

        .tt-hero-stage {
          position: relative;
          min-height: 270px;
          border-radius: 24px;
          overflow: hidden;
          background-color: #1A0530;
          border: 1px solid rgba(250, 249, 245, 0.14);
          box-shadow: 0 18px 40px rgba(10, 2, 20, 0.36);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .tt-hero-stage-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 28%;
        }
        /* Degradado reforzado para blindar la lectura del título sobre fotos brillantes */
        .tt-hero-stage-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(20, 5, 36, 0.16) 0%,
            rgba(20, 5, 36, 0.56) 46%,
            rgba(16, 3, 29, 0.96) 100%
          );
        }
        .tt-hero-stage-content {
          position: relative;
          z-index: 2;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          align-self: flex-start;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(18, 3, 33, 0.72);
          border: 1px solid rgba(0, 220, 125, 0.42);
          color: #00DC7D;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }
        .tt-hero-headline {
          margin: 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: clamp(1.38rem, 5.4vw, 1.95rem);
          line-height: 1.04;
          letter-spacing: 0.01em;
          color: #FAF9F5;
          text-shadow: 0 3px 14px rgba(0, 0, 0, 0.65);
        }
        .tt-hero-subcopy {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.38;
          color: rgba(250, 249, 245, 0.84);
          max-width: 460px;
        }
        .tt-hero-footer-row {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-hero-cta-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 15px;
          border-radius: 999px;
          background: #FAF9F5;
          color: #1E0734;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
          transition: transform 140ms ease;
        }
        .tt-hero-cta-pill:active {
          transform: scale(0.96);
        }
        .tt-cta-emerald-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #00DC7D;
          box-shadow: 0 0 8px rgba(0, 220, 125, 0.85);
          flex-shrink: 0;
        }
        .tt-hero-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-hero-dots {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .tt-hero-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.35);
          transition: width 220ms ease, background-color 220ms ease;
        }
        .tt-hero-dot.is-active {
          width: 22px;
          background: #00DC7D;
        }
        .tt-hero-arrows {
          display: flex;
          gap: 6px;
        }
        .tt-circle-nav-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(250, 249, 245, 0.14);
          border: 1px solid rgba(250, 249, 245, 0.24);
          color: #FAF9F5;
          font-size: 1.05rem;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* Widgets Laterales */
        .tt-hero-side-stack {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .tt-live-widget-card {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          padding: 16px;
          background: linear-gradient(135deg, #2B0B4C 0%, #160428 100%);
          border: 1px solid rgba(0, 220, 125, 0.28);
          box-shadow: 0 12px 28px rgba(10, 2, 20, 0.3);
          min-height: 142px;
          display: flex;
          align-items: center;
        }
        .tt-live-widget-body {
          position: relative;
          z-index: 2;
          max-width: 72%;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-live-widget-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.67rem;
          font-weight: 800;
          letter-spacing: 0.09em;
          color: #00DC7D;
        }
        .tt-live-widget-title {
          margin: 0;
          font-family: var(--tt-font-display);
          font-weight: 900;
          font-size: 1.32rem;
          line-height: 1.08;
          color: #FAF9F5;
        }
        .tt-live-widget-desc {
          margin: 0;
          font-size: 0.76rem;
          color: rgba(250, 249, 245, 0.74);
        }
        .tt-live-widget-btn {
          margin-top: 6px;
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.12);
          border: 1px solid rgba(0, 220, 125, 0.5);
          color: #FAF9F5;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }
        .tt-live-widget-trophy {
          position: absolute;
          right: -12px;
          bottom: -14px;
          width: 112px;
          height: 124px;
          object-fit: contain;
          opacity: 0.94;
          filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.55));
          pointer-events: none;
        }

        /* Pastilla Reloj Analógico + Clima Real */
        .tt-clock-weather-pill {
          border-radius: 20px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #00C670 0%, #009B56 100%);
          color: #120321;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          box-shadow: 0 10px 24px rgba(0, 184, 104, 0.28);
        }
        .tt-cw-left,
        .tt-cw-right {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }
        .tt-cw-kicker {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          opacity: 0.78;
        }
        .tt-cw-time {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.08rem;
          font-weight: 900;
          line-height: 1.1;
          white-space: nowrap;
        }
        .tt-cw-divider {
          width: 1px;
          height: 36px;
          background: rgba(18, 3, 33, 0.22);
          flex-shrink: 0;
        }
        .tt-cw-temp {
          display: block;
          font-size: 0.84rem;
          font-weight: 900;
          line-height: 1.15;
          white-space: nowrap;
        }
        .tt-cw-status {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          opacity: 0.86;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .tt-live-dot-inline {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00DC7D;
          box-shadow: 0 0 8px rgba(0, 220, 125, 0.9);
          display: inline-block;
          animation: ttLivePulse 1.6s infinite;
        }

        /* 2. ALERTA RETOS ENTRANTES */
        .tt-incoming-alert {
          border-radius: 20px;
          padding: 14px;
          background: linear-gradient(135deg, rgba(0, 220, 125, 0.16) 0%, rgba(30, 7, 52, 0.92) 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.52);
          color: #FAF9F5;
        }
        .tt-incoming-alert-head {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .tt-incoming-kicker {
          display: block;
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
        }

        /* 3. SUB-TABS PÍLDORA */
        .tt-subtabs-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 5px;
          border-radius: 18px;
          background: var(--tt-surface-2, rgba(255, 255, 255, 0.06));
          border: 1px solid var(--tt-border, rgba(250, 249, 245, 0.1));
        }
        .tt-subtab-btn {
          min-height: 42px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          transition: background-color 180ms ease, color 180ms ease, transform 120ms ease;
        }
        .tt-subtab-btn:active {
          transform: scale(0.97);
        }
        .tt-subtab-btn.is-active {
          background: #1E0734;
          color: #00DC7D;
          box-shadow: 0 6px 16px rgba(10, 2, 20, 0.25);
        }
        .tt-retos-view.is-dark .tt-subtab-btn.is-active {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }
        .tt-subtab-chip {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.2);
          color: #00DC7D;
          font-size: 0.68rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-retos-view.is-dark .tt-subtab-btn.is-active .tt-subtab-chip {
          background: rgba(18, 3, 33, 0.22);
          color: #120321;
        }

        /* 4. FILTROS Y PANELES */
        .tt-retos-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-filter-pills-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tt-filter-pills-row::-webkit-scrollbar {
          display: none;
        }
        .tt-filter-chip {
          flex-shrink: 0;
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
        }
        .tt-filter-chip.is-active {
          background: rgba(0, 220, 125, 0.16);
          border-color: rgba(0, 220, 125, 0.55);
          color: #00DC7D;
          font-weight: 800;
        }
        .tt-retos-view.is-light .tt-filter-chip.is-active {
          background: #1E0734;
          border-color: #1E0734;
          color: #00DC7D;
        }

        /* 5. TARJETAS PÓSTER VS */
        .tt-matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 760px) {
          .tt-matches-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .tt-match-card {
          border-radius: 22px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-match-card.is-live {
          border-color: rgba(0, 220, 125, 0.48);
          box-shadow: 0 10px 26px rgba(0, 220, 125, 0.12);
        }
        .tt-match-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-match-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.06em;
        }
        .tt-match-pill.is-live {
          background: rgba(0, 220, 125, 0.18);
          color: #00DC7D;
        }
        .tt-retos-view.is-light .tt-match-pill.is-live {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-match-pill.is-scheduled {
          background: rgba(56, 189, 248, 0.16);
          color: #38BDF8;
        }
        .tt-retos-view.is-light .tt-match-pill.is-scheduled {
          background: rgba(30, 7, 52, 0.08);
          color: #1E0734;
        }
        .tt-match-pill.is-pending {
          background: rgba(245, 158, 11, 0.18);
          color: #F59E0B;
        }
        .tt-match-pill.is-finished {
          background: rgba(148, 163, 184, 0.16);
          color: var(--tt-text-muted);
        }
        .tt-match-mode-tag {
          font-size: 0.71rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }

        .tt-match-vs-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: start;
          gap: 8px;
        }
        .tt-match-side {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 5px;
          min-width: 0;
        }
        .tt-match-player-name {
          font-size: 0.86rem;
          font-weight: 800;
          line-height: 1.18;
          color: var(--tt-text);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .tt-match-player-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 0.71rem;
          color: var(--tt-text-muted);
          flex-wrap: wrap;
        }
        .tt-winner-chip {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.18);
          color: #00DC7D;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .tt-retos-view.is-light .tt-winner-chip {
          background: #008A4E;
          color: #FFFFFF;
        }

        .tt-match-center-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding-top: 8px;
        }
        .tt-vs-emblem {
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 1.2rem;
          color: #F59E0B;
          line-height: 1;
        }
        .tt-match-date-chip {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--tt-text);
          white-space: nowrap;
        }
        .tt-match-time-chip {
          font-size: 0.69rem;
          font-weight: 700;
          color: var(--tt-text-muted);
          white-space: nowrap;
        }

        /* Mini Scoreboard */
        .tt-mini-scoreboard {
          border-radius: 14px;
          padding: 10px 12px;
          background: #17042A;
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.22);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-mini-sb-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-mini-sb-name {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          font-weight: 800;
          min-width: 76px;
        }
        .tt-mini-sb-sets {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }
        .tt-sb-cell {
          width: 26px;
          height: 24px;
          border-radius: 7px;
          background: rgba(250, 249, 245, 0.1);
          font-weight: 900;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-variant-numeric: tabular-nums;
        }
        .tt-sb-cell.is-stb {
          background: rgba(245, 158, 11, 0.22);
          color: #FDE68A;
          min-width: 30px;
          width: auto;
          padding: 0 6px;
        }
        .tt-delta-pill {
          min-width: 40px;
          text-align: right;
          font-size: 0.75rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
        }
        .tt-delta-pill.is-pos {
          color: #00DC7D;
        }
        .tt-delta-pill.is-neg {
          color: #F87171;
        }
        .tt-mini-sb-foot {
          margin-top: 2px;
          padding-top: 6px;
          border-top: 1px solid rgba(250, 249, 245, 0.1);
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.69rem;
          color: rgba(250, 249, 245, 0.72);
        }

        .tt-match-venue-bar {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 9px 11px;
          border-radius: 13px;
          background: var(--tt-surface-2);
        }
        .tt-match-venue-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--tt-text);
        }
        .tt-match-venue-item.is-subtle {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--tt-text-muted);
        }

        .tt-match-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tt-btn-sm {
          min-height: 40px !important;
          padding: 0 13px !important;
          font-size: 0.78rem !important;
          border-radius: 12px !important;
        }
        .tt-icon-action-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-icon-action-btn.is-wa {
          background: rgba(37, 211, 102, 0.16);
          color: #25D366;
          border: 1px solid rgba(37, 211, 102, 0.35);
        }
        .tt-waiting-banner {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 11px;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.12);
          color: #F59E0B;
          font-size: 0.76rem;
          font-weight: 700;
        }

        /* 6. RADAR DE RIVALES (LANZAR RETO) */
        .tt-radar-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-search-box {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 14px;
          min-height: 46px;
          border-radius: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
        }
        .tt-search-box input {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--tt-text);
          font-size: 0.88rem;
          outline: none;
        }

        .tt-rivals-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-rival-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 13px;
          border-radius: 18px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
        }
        .tt-rival-row.is-out-of-range {
          opacity: 0.72;
        }
        .tt-rival-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .tt-rival-name-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
        }
        .tt-rival-name-line strong {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-rival-meta-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.73rem;
          color: var(--tt-text-muted);
          flex-wrap: wrap;
        }
        .tt-cat-mini-pill {
          padding: 2px 7px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.68rem;
        }
        .tt-rival-forecast-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: var(--tt-text-muted);
          flex-wrap: wrap;
        }
        .tt-rival-forecast-line .is-win {
          color: #00DC7D;
          font-weight: 700;
        }
        .tt-retos-view.is-light .tt-rival-forecast-line .is-win {
          color: #008A4E;
        }
        .tt-rival-forecast-line .is-loss {
          color: #F87171;
          font-weight: 700;
        }
        .tt-rival-cta-col {
          flex-shrink: 0;
        }

        /* 7. FORMULARIOS EN MODAL PORTAL */
        .tt-form-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-field-label {
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: var(--tt-text-muted);
        }
        .tt-input {
          width: 100%;
          min-height: 44px;
          padding: 0 13px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.88rem;
        }

        .tt-forecast-box {
          border-radius: 16px;
          padding: 12px;
          background: linear-gradient(135deg, rgba(30, 7, 52, 0.94) 0%, rgba(20, 4, 36, 0.98) 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.34);
        }
        .tt-forecast-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 0.8rem;
        }
        .tt-rematch-tag {
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.2);
          color: #FDE68A;
          font-size: 0.67rem;
          font-weight: 800;
        }
        .tt-forecast-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-forecast-cell {
          padding: 9px 10px;
          border-radius: 12px;
          background: rgba(250, 249, 245, 0.06);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-forecast-cell span {
          font-size: 0.68rem;
          opacity: 0.76;
        }
        .tt-forecast-cell strong {
          font-size: 1.15rem;
          font-weight: 900;
        }
        .tt-forecast-cell.is-win strong {
          color: #00DC7D;
        }
        .tt-forecast-cell.is-loss strong {
          color: #F87171;
        }
        .tt-forecast-cell small {
          font-size: 0.67rem;
          opacity: 0.72;
        }

        .tt-toggle-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-choice-pill {
          min-height: 42px;
          padding: 8px 12px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.8rem;
          font-weight: 700;
          text-align: center;
        }
        .tt-choice-pill.is-selected {
          background: rgba(0, 220, 125, 0.16);
          border-color: #00DC7D;
          color: #00DC7D;
          font-weight: 800;
        }
        .tt-retos-view.is-light .tt-choice-pill.is-selected {
          background: #1E0734;
          border-color: #1E0734;
          color: #00DC7D;
        }
        .tt-choice-pill:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tt-venues-select-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-venue-option {
          min-height: 46px;
          padding: 8px 10px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          text-align: left;
        }
        .tt-venue-option.is-custom {
          grid-column: 1 / -1;
          justify-content: center;
        }
        .tt-venue-option.is-selected {
          border-color: #00DC7D;
          background: rgba(0, 220, 125, 0.14);
        }

        .tt-date-time-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 10px;
        }
        .tt-quick-slots-row {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .tt-slot-chip {
          flex-shrink: 0;
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 700;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
        }
        .tt-slot-chip.is-selected {
          background: #00DC7D;
          border-color: #00DC7D;
          color: #120321;
          font-weight: 900;
        }
        .tt-balls-stack {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        /* 8. MATCH CENTER & MARCADOR ESTADIO */
        .tt-mc-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-mc-role-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-mc-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.15);
          color: #00DC7D;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .tt-mc-judge-tag {
          font-size: 0.73rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }

        .tt-stadium-board {
          border-radius: 18px;
          padding: 14px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.32);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-stadium-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.09em;
          color: rgba(250, 249, 245, 0.56);
        }
        .tt-stadium-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(250, 249, 245, 0.1);
        }
        .tt-stadium-player {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }
        .tt-stadium-player strong {
          display: block;
          font-size: 0.88rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-stadium-player small {
          font-size: 0.7rem;
          color: rgba(250, 249, 245, 0.64);
        }
        .tt-stadium-cols {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .tt-stadium-head .tt-stadium-cols span {
          width: 36px;
          text-align: center;
        }
        .tt-st-num {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(250, 249, 245, 0.12);
          font-family: var(--tt-font-display);
          font-size: 1.2rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-variant-numeric: tabular-nums;
        }
        .tt-st-num sup {
          font-size: 0.62rem;
          color: #00DC7D;
          margin-left: 1px;
        }
        .tt-st-num.is-locked {
          border: 1px solid rgba(0, 220, 125, 0.35);
        }
        .tt-st-num.is-stb {
          background: rgba(245, 158, 11, 0.24);
          color: #FDE68A;
          min-width: 40px;
          width: auto;
          padding: 0 7px;
        }

        .tt-mc-controls-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-set-control-card {
          border-radius: 16px;
          padding: 12px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-set-control-card.is-stb-card {
          border-color: rgba(245, 158, 11, 0.45);
        }
        .tt-set-control-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.8rem;
        }
        .tt-unlock-btn {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.16);
          color: #F59E0B;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .tt-tb-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-tb-banner {
          text-align: center;
          padding: 6px 10px;
          border-radius: 10px;
          background: rgba(0, 220, 125, 0.15);
          color: #00DC7D;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.06em;
        }
        .tt-dual-stepper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .tt-stepper-side {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-stepper-name {
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          text-align: center;
        }
        .tt-stepper-btns {
          display: flex;
          gap: 6px;
        }
        .tt-step-minus {
          width: 40px;
          height: 44px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 1.2rem;
          font-weight: 800;
        }
        .tt-step-minus:disabled {
          opacity: 0.35;
        }
        .tt-step-plus {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
          font-size: 0.82rem;
          font-weight: 900;
        }
        .tt-step-plus.is-amber {
          background: linear-gradient(135deg, #FBBF24 0%, #D97706 100%);
          color: #1E1102;
        }
        .tt-step-plus:disabled {
          opacity: 0.35;
        }

        .tt-judge-assign-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-elo-preview-card {
          border-radius: 16px;
          padding: 13px;
          background: rgba(0, 220, 125, 0.1);
          border: 1.5px solid rgba(0, 220, 125, 0.45);
        }
        .tt-elo-preview-head {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 10px;
        }
        .tt-elo-preview-head span {
          font-size: 0.72rem;
          color: var(--tt-text-muted);
        }
        .tt-elo-preview-deltas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-elo-preview-deltas > div {
          padding: 8px 10px;
          border-radius: 11px;
          background: var(--tt-surface);
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.76rem;
        }
        .tt-mc-secondary-bar {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 4px;
        }
        .tt-text-action {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--tt-text-muted);
          text-decoration: underline;
        }
        .tt-text-action.is-danger {
          color: #F87171;
        }
        .tt-wo-box {
          padding: 11px;
          border-radius: 13px;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
        }
        .tt-spectator-note {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          font-size: 0.8rem;
          color: var(--tt-text-muted);
        }
        .tt-rule-callout {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          font-size: 0.82rem;
        }
        .tt-rule-callout.is-ok {
          background: rgba(0, 220, 125, 0.14);
          border: 1px solid rgba(0, 220, 125, 0.4);
        }
        .tt-rule-callout.is-warn {
          background: rgba(245, 158, 11, 0.14);
          border: 1px solid rgba(245, 158, 11, 0.42);
        }
      `}</style>
    </section>
  );
}
