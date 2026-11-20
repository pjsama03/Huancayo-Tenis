import React, { useEffect, useMemo, useState } from 'react';
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
  CATEGORIES_SCALE,
  INITIAL_CLUBS,
  getCategoryByPoints,
  getClubById,
} from '../data/playersAndClubsData';
import {
  calculateOfficialMatchElo,
  canIncrementRegularGame,
  createEmptyLiveScore,
  evaluateMatchScore,
  getMatchPermissions,
  getPreMatchForecast,
  stepLiveScoreboard,
} from '../utils/tenisEngine';
import { buildWhatsappLink } from '../utils/cloudService';

/* ==========================================================================
   CONSTANTES Y UTILIDADES DE RETOS (HORA PERÚ + CONVERSOR DE SCORE DIRECTO)
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
  } catch {
    return {
      dateText: fallbackDate || d.toLocaleDateString('es-PE'),
      timeText:
        fallbackTime ||
        d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

function isRegularSetFinished(a, b) {
  return (
    (a === 6 && b <= 4) ||
    (b === 6 && a <= 4) ||
    (a === 7 && (b === 5 || b === 6)) ||
    (b === 7 && (a === 5 || a === 6))
  );
}

function createDirectDraftFromScore(liveScore) {
  const s1 = liveScore?.set1 || {};
  const s2 = liveScore?.set2 || {};
  const s3 = liveScore?.set3 || {};
  return {
    s1a: s1.a > 0 || s1.b > 0 ? String(s1.a) : '',
    s1b: s1.a > 0 || s1.b > 0 ? String(s1.b) : '',
    tb1a: s1.tbA > 0 ? String(s1.tbA) : '',
    tb1b: s1.tbB > 0 ? String(s1.tbB) : '',
    s2a: s2.a > 0 || s2.b > 0 ? String(s2.a) : '',
    s2b: s2.a > 0 || s2.b > 0 ? String(s2.b) : '',
    tb2a: s2.tbA > 0 ? String(s2.tbA) : '',
    tb2b: s2.tbB > 0 ? String(s2.tbB) : '',
    s3a: s3.a > 0 || s3.b > 0 ? String(s3.a) : '',
    s3b: s3.a > 0 || s3.b > 0 ? String(s3.b) : '',
  };
}

function buildLiveScoreFromDirectDraft(draft) {
  const base = createEmptyLiveScore();
  const s1a = draft.s1a === '' ? 0 : Math.max(0, Math.min(7, Number(draft.s1a) || 0));
  const s1b = draft.s1b === '' ? 0 : Math.max(0, Math.min(7, Number(draft.s1b) || 0));
  const s2a = draft.s2a === '' ? 0 : Math.max(0, Math.min(7, Number(draft.s2a) || 0));
  const s2b = draft.s2b === '' ? 0 : Math.max(0, Math.min(7, Number(draft.s2b) || 0));

  const s1Tb = (s1a === 7 && s1b === 6) || (s1b === 7 && s1a === 6);
  const s2Tb = (s2a === 7 && s2b === 6) || (s2b === 7 && s2a === 6);

  base.set1 = {
    ...base.set1,
    a: s1a,
    b: s1b,
    tbA: s1Tb ? (draft.tb1a !== '' ? Math.max(0, Number(draft.tb1a) || 0) : s1a === 7 ? 7 : 5) : 0,
    tbB: s1Tb ? (draft.tb1b !== '' ? Math.max(0, Number(draft.tb1b) || 0) : s1b === 7 ? 7 : 5) : 0,
    locked: isRegularSetFinished(s1a, s1b),
  };

  base.set2 = {
    ...base.set2,
    a: s2a,
    b: s2b,
    tbA: s2Tb ? (draft.tb2a !== '' ? Math.max(0, Number(draft.tb2a) || 0) : s2a === 7 ? 7 : 5) : 0,
    tbB: s2Tb ? (draft.tb2b !== '' ? Math.max(0, Number(draft.tb2b) || 0) : s2b === 7 ? 7 : 5) : 0,
    locked: isRegularSetFinished(s2a, s2b),
  };

  const w1 = base.set1.locked ? (s1a > s1b ? 'A' : 'B') : null;
  const w2 = base.set2.locked ? (s2a > s2b ? 'A' : 'B') : null;
  const needsStb = Boolean(w1 && w2 && w1 !== w2);

  if (needsStb) {
    const s3a = draft.s3a === '' ? 0 : Math.max(0, Number(draft.s3a) || 0);
    const s3b = draft.s3b === '' ? 0 : Math.max(0, Number(draft.s3b) || 0);
    base.set3 = {
      ...base.set3,
      a: s3a,
      b: s3b,
      locked: (s3a >= 10 || s3b >= 10) && Math.abs(s3a - s3b) >= 2,
    };
  }

  return { liveScore: base, s1Tb, s2Tb, needsStb };
}

/* ==========================================================================
   SUBCOMPONENTE 1: AVATAR CON ANILLO DE CATEGORÍA Y ESCUDO DE CLUB
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
          boxShadow: '0 6px 16px rgba(10, 2, 20, 0.28)',
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
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
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
   SUBCOMPONENTE 2: TARJETA PÓSTER VS (MULTIUSUARIO + MODO ESPECTADOR)
   ========================================================================== */
function MatchPosterCard({
  challenge,
  playerA,
  playerB,
  judgePlayer,
  clubs,
  currentUser,
  isAdmin,
  onOpenScoreModal,
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
  const isProposed = challenge.status === 'SCORE_PROPOSED';
  const isDisputed = challenge.status === 'DISPUTED';
  const isFinished = challenge.status === 'FINISHED';
  const isScheduled = challenge.status === 'SCHEDULED';
  const isOfficial = challenge.mode !== 'Amistoso';

  const statusMeta = isLive
    ? { label: 'EN JUEGO AHORA', cls: 'is-live' }
    : isProposed
    ? { label: 'POR CONFIRMAR', cls: 'is-pending' }
    : isDisputed
    ? { label: 'EN REVISIÓN', cls: 'is-disputed' }
    : isPending
    ? { label: 'PENDIENTE DE ACEPTAR', cls: 'is-pending' }
    : isFinished
    ? { label: 'TERMINADO', cls: 'is-finished' }
    : { label: 'PROGRAMADO', cls: 'is-scheduled' };

  const opponent = perms.isPlayerA ? playerB : playerA;
  const whatsappUrl = opponent
    ? buildWhatsappLink(
        opponent.whatsapp,
        `Hola ${opponent.name}, te escribo desde TOTAL TENIS por nuestro partido en ${challenge.clubName} (${dateText} · ${timeText}).`
      )
    : null;

  const canManage = perms.isParticipant || perms.isJudge || isAdmin;

  return (
    <article className={`tt-match-card ${statusMeta.cls}`}>
      <div className="tt-match-card-top">
        <span className={`tt-match-pill ${statusMeta.cls}`}>
          {isLive && <span className="tt-live-dot-inline" />}
          {statusMeta.label}
        </span>
        <span className="tt-match-mode-tag">
          {isOfficial ? 'Por puntos' : 'Amistoso'}
        </span>
      </div>

      {/* Centro VS */}
      <div className="tt-match-vs-grid">
        <div className="tt-match-side">
          <PlayerAvatarWithClub
            player={playerA}
            clubs={clubs}
            size={56}
            ringColor="#00DC7D"
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

        <div className="tt-match-center-col">
          <span className="tt-vs-emblem">VS</span>
          <span className="tt-match-date-chip">{dateText}</span>
          <span className="tt-match-time-chip">{timeText}</span>
        </div>

        <div className="tt-match-side">
          <PlayerAvatarWithClub
            player={playerB}
            clubs={clubs}
            size={56}
            ringColor="#F59E0B"
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

      {/* Marcador en Vivo, Por Confirmar o Resultado Final */}
      {(isLive || isProposed || isDisputed || isFinished) && (
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

          <div className="tt-mini-sb-foot">
            <span>{challenge.scoreSummary || scoreEval.summary || 'Partido en curso'}</span>
            <span>
              {judgePlayer
                ? `Árbitro: ${judgePlayer.name}`
                : isProposed
                ? 'Esperando confirmación del rival'
                : isDisputed
                ? 'Observado por revisión'
                : isLive
                ? canManage
                  ? 'Marcador en vivo'
                  : 'En vivo · Solo lectura'
                : 'Resultado confirmado'}
            </span>
          </div>
        </div>
      )}

      {/* Sede + Acuerdo de pelotas */}
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

      {/* Acciones por Rol (Contendientes editan · Espectadores solo ven) */}
      <div className="tt-match-actions">
        {/* 1. Pendiente: el retado acepta o declina */}
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

        {/* 2. Pendiente enviado por mí */}
        {isPending && perms.isPlayerA && (
          <div className="tt-waiting-banner">
            <TTIcon name="clock" size={15} />
            <span>Esperando confirmación de {playerB?.name || 'tu rival'}</span>
          </div>
        )}

        {/* 3. Programado: Contendientes suben resultado directo o reprograman */}
        {isScheduled && (perms.isParticipant || isAdmin) && (
          <>
            <button
              type="button"
              className="tt-btn tt-btn-primary tt-btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                triggerHaptic('medium');
                onOpenScoreModal(challenge, 'direct');
              }}
            >
              <TTIcon name="scoreboard" size={16} />
              Subir Resultado
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
                {perms.rescheduleMode === 'ORDINARY_ALLOWED' ? 'Cambiar hora' : 'Clima'}
              </button>
            )}
          </>
        )}

        {/* 4. En Juego: Contendientes / Árbitro editan · Espectadores solo siguen en vivo */}
        {isLive && (
          <button
            type="button"
            className={`tt-btn ${perms.canEditScore ? 'tt-btn-primary' : 'tt-btn-secondary'} tt-btn-sm`}
            style={{ flex: 1 }}
            onClick={() => {
              triggerHaptic('light');
              onOpenScoreModal(challenge, perms.isJudge ? 'live' : 'direct');
            }}
          >
            <TTIcon name="scoreboard" size={16} />
            {perms.isJudge
              ? 'Llevar Marcador (Árbitro)'
              : perms.canEditScore
              ? 'Subir / Ver Marcador'
              : 'Seguir en Vivo'}
          </button>
        )}

        {/* 5. Marcador propuesto (esperando confirmación del rival) */}
        {isProposed && perms.isParticipant && (
          <div className="tt-waiting-banner">
            <TTIcon name="clock" size={15} />
            <span>
              {challenge.proposedBy === currentUser?.id
                ? 'Resultado enviado · Esperando confirmación del rival'
                : 'Tu rival subió el marcador · Revisa la ventana de confirmación'}
            </span>
          </div>
        )}

        {/* 6. Finalizado: compartir Story 9:16 */}
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

        {/* 7. Espectador viendo un partido programado / pendiente */}
        {!canManage && (isScheduled || isPending) && (
          <div className="tt-spectator-pill">
            <TTIcon name="vision" size={14} />
            <span>Modo espectador · Solo lectura</span>
          </div>
        )}

        {/* WhatsApp directo solo para contendientes */}
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
   VISTA PRINCIPAL: RetosView (LIMPIA, SIN RELOJ/UV Y CON MARCADOR DIRECTO)
   ========================================================================== */
export default function RetosView({
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  currentUser = null,
  isAdmin = false,
  theme = 'dark',
  onCreateChallenge,
  onUpdateChallenge,
  onFinalizeMatch,
  onOpenPlayerProfile,
  onOpenStoriesWithMatch,
  onOpenAuth,
  onGoToTournaments,
  onNotify,
}) {
  const [subTab, setSubTab] = useState('cartelera'); // 'cartelera' | 'mis-retos' | 'lanzar'
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  // Filtros de "Lanzar Reto"
  const [rivalSearch, setRivalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [onlyInRange, setOnlyInRange] = useState(true);

  // Filtro de Cartelera
  const [boardFilter, setBoardFilter] = useState('ALL');

  // Modales en Portal
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [activeScoreboardId, setActiveScoreboardId] = useState(null);
  const [scoreModalMode, setScoreModalMode] = useState('direct'); // 'direct' | 'live'
  const [directDraft, setDirectDraft] = useState(() => createDirectDraftFromScore(null));
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [celebrationPayload, setCelebrationPayload] = useState(null);
  const [showWalkoverBox, setShowWalkoverBox] = useState(false);

  // Formulario Crear Nuevo Desafío
  const [formMode, setFormMode] = useState('Por puntos');
  const [formClubId, setFormClubId] = useState(clubs?.[0]?.id || 'club-country');
  const [formCustomVenue, setFormCustomVenue] = useState('');
  const [formDate, setFormDate] = useState(() => getTodayDateInputValue(1));
  const [formTime, setFormTime] = useState('18:00');
  const [formBalls, setFormBalls] = useState(BALLS_AGREEMENTS[0]);

  // Formulario Reprogramar / Clima
  const [reschedDate, setReschedDate] = useState(() => getTodayDateInputValue(2));
  const [reschedTime, setReschedTime] = useState('19:00');
  const [reschedReason, setReschedReason] = useState('Lluvia intensa en cancha');

  const playersMap = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  const liveChallenges = useMemo(
    () => (challenges || []).filter((c) => c.status === 'IN_PLAY'),
    [challenges]
  );

  const incomingPending = useMemo(() => {
    if (!currentUser?.id) return [];
    return (challenges || []).filter(
      (c) => c.status === 'PENDING' && c.playerBId === currentUser.id
    );
  }, [challenges, currentUser]);

  const myChallenges = useMemo(() => {
    if (!currentUser?.id) return [];
    const orderWeight = {
      SCORE_PROPOSED: 0,
      PENDING: 1,
      IN_PLAY: 2,
      SCHEDULED: 3,
      DISPUTED: 4,
      FINISHED: 5,
    };
    return (challenges || [])
      .filter(
        (c) =>
          c.status !== 'DECLINED' &&
          (c.playerAId === currentUser.id ||
            c.playerBId === currentUser.id ||
            c.judgeId === currentUser.id)
      )
      .sort((a, b) => (orderWeight[a.status] ?? 9) - (orderWeight[b.status] ?? 9));
  }, [challenges, currentUser]);

  const publicBoardChallenges = useMemo(() => {
    const orderWeight = {
      IN_PLAY: 0,
      SCORE_PROPOSED: 1,
      SCHEDULED: 2,
      PENDING: 3,
      FINISHED: 4,
      DISPUTED: 5,
    };
    return (challenges || [])
      .filter((c) => c.status !== 'DECLINED')
      .filter((c) => {
        if (boardFilter === 'ALL') return true;
        if (boardFilter === 'IN_PLAY') return c.status === 'IN_PLAY' || c.status === 'SCORE_PROPOSED';
        return c.status === boardFilter;
      })
      .sort((a, b) => (orderWeight[a.status] ?? 9) - (orderWeight[b.status] ?? 9));
  }, [challenges, boardFilter]);

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

  const activeScoreboardChallenge = useMemo(
    () => (challenges || []).find((c) => c.id === activeScoreboardId) || null,
    [challenges, activeScoreboardId]
  );

  /* Carrusel Hero Compacto (Sin reloj, sin UV, sin tarjeta redundante) */
  const heroSlides = useMemo(() => {
    const featuredLive = liveChallenges[0];
    const pA = featuredLive ? playersMap[featuredLive.playerAId] : null;
    const pB = featuredLive ? playersMap[featuredLive.playerBId] : null;

    return [
      {
        id: 'slide-1',
        tag: featuredLive ? 'EN CANCHA AHORA' : 'CIRCUITO OFICIAL',
        title: featuredLive
          ? `${pA?.name?.split(' ')[0] || 'Duelo'} vs. ${pB?.name?.split(' ')[0] || 'Rival'}`
          : 'Pacta tu partido oficial y escala en el Ranking',
        subtitle: featuredLive
          ? `${featuredLive.clubName} · Marcador en vivo`
          : 'Elige rival de tu categoría, acuerda cancha y confirma el marcador.',
        image: ASSETS.torneoApertura,
        ctaLabel: featuredLive ? 'VER EN VIVO' : 'LANZAR UN RETO',
        onCta: () => {
          triggerHaptic('light');
          if (featuredLive) openScoreModal(featuredLive, 'live');
          else setSubTab('lanzar');
        },
      },
      {
        id: 'slide-2',
        tag: 'CARRERA ANUAL · MASTER TOP 8',
        title: 'Suma puntos todo el año y clasifica al Top 8',
        subtitle: 'Los 8 primeros del año juegan el Master Top 8 sin costo de inscripción.',
        image: ASSETS.torneoMasterTop8,
        ctaLabel: 'VER MASTER TOP 8',
        onCta: () => {
          triggerHaptic('light');
          if (onGoToTournaments) onGoToTournaments('master');
        },
      },
      {
        id: 'slide-3',
        tag: 'SEDES OFICIALES Y CANCHA LIBRE',
        title: 'Desafía rivales de tu nivel cuando quieras',
        subtitle: 'Juega en nuestras 4 sedes aliadas o en la cancha que acuerden.',
        image: ASSETS.torneoAltura,
        ctaLabel: 'LANZAR UN RETO',
        onCta: () => {
          triggerHaptic('light');
          setSubTab('lanzar');
        },
      },
    ];
  }, [liveChallenges, playersMap, onGoToTournaments]);

  const activeSlide = heroSlides[heroSlideIdx % heroSlides.length];

  // Auto-rotación pausada automáticamente cuando hay cualquier modal abierto
  useEffect(() => {
    if (challengeTarget || activeScoreboardId || rescheduleTarget || celebrationPayload) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, [heroSlides.length, challengeTarget, activeScoreboardId, rescheduleTarget, celebrationPayload]);

  /* ------------------------------------------------------------------------
     ACCIONES DE NEGOCIO
     ------------------------------------------------------------------------ */
  const openScoreModal = (ch, preferredMode = 'direct') => {
    if (!ch) return;
    const perms = getMatchPermissions(ch, currentUser, isAdmin);
    setActiveScoreboardId(ch.id);
    setDirectDraft(createDirectDraftFromScore(ch.liveScore));
    setShowWalkoverBox(false);
    // Si es árbitro designado o espectador de un partido en vivo, abre vista en vivo
    if (perms.isJudge || (!perms.canEditScore && ch.status === 'IN_PLAY')) {
      setScoreModalMode('live');
    } else {
      setScoreModalMode(preferredMode);
    }
  };

  const openCreateChallengeModal = (rival, forceFriendly = false) => {
    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para pactar un desafío.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    const gap = Math.abs((Number(rival.points) || 0) - (Number(currentUser.points) || 0));
    setFormMode(forceFriendly || gap > MAX_OFFICIAL_ELO_WINDOW ? 'Amistoso' : 'Por puntos');
    setFormClubId(
      currentUser.clubId && currentUser.clubId !== 'independiente'
        ? currentUser.clubId
        : clubs?.[0]?.id || 'club-country'
    );
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
    if (onNotify) onNotify('¡Desafío confirmado! Ya aparece en la Cartelera.', 'success');
  };

  const handleDeclineChallenge = (ch) => {
    if (!onUpdateChallenge) return;
    onUpdateChallenge(ch.id, { status: 'DECLINED' });
    if (onNotify) onNotify('Desafío declinado.', 'info');
  };

  const handleActivateLiveRefereeMode = (ch) => {
    if (!ch || !onUpdateChallenge) return;
    if (ch.status !== 'IN_PLAY') {
      onUpdateChallenge(ch.id, {
        status: 'IN_PLAY',
        liveScore: ch.liveScore || createEmptyLiveScore(),
      });
    }
    setScoreModalMode('live');
  };

  const handleScoreboardAction = (action) => {
    if (!activeScoreboardChallenge || !onUpdateChallenge) return;
    const nextScore = stepLiveScoreboard(activeScoreboardChallenge.liveScore, action);
    const patch = { liveScore: nextScore };
    if (activeScoreboardChallenge.status === 'SCHEDULED') {
      patch.status = 'IN_PLAY';
    }
    onUpdateChallenge(activeScoreboardChallenge.id, patch);
    setDirectDraft(createDirectDraftFromScore(nextScore));
  };

  const handleAssignJudge = (judgeId) => {
    if (!activeScoreboardChallenge || !onUpdateChallenge) return;
    const patch = { judgeId: judgeId || null };
    if (judgeId && activeScoreboardChallenge.status === 'SCHEDULED') {
      patch.status = 'IN_PLAY';
    }
    onUpdateChallenge(activeScoreboardChallenge.id, patch);
    const jPlayer = playersMap[judgeId];
    if (onNotify) {
      onNotify(
        jPlayer
          ? `${jPlayer.name} fue designado como Árbitro en cancha. Ya puede llevar el marcador en vivo.`
          : 'Se retiró el Árbitro en cancha.',
        'info'
      );
    }
  };

  const handleSubmitMatchResult = ({
    scoreObj,
    isWalkover = false,
    walkoverWinnerSide = null,
  }) => {
    if (!activeScoreboardChallenge) return;
    const pA = playersMap[activeScoreboardChallenge.playerAId];
    const pB = playersMap[activeScoreboardChallenge.playerBId];
    if (!pA || !pB) return;

    const finalScoreObj = scoreObj || activeScoreboardChallenge.liveScore || createEmptyLiveScore();
    const isOfficial = activeScoreboardChallenge.mode !== 'Amistoso';
    let eloResult;

    if (isOfficial) {
      eloResult = calculateOfficialMatchElo({
        playerA: pA,
        playerB: pB,
        liveScore: finalScoreObj,
        challenges,
        totalActivePlayers: Math.max(players.length, 130),
        isWalkover,
        walkoverWinnerSide,
      });
      if (!eloResult.ok) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            eloResult.error || 'Revisa el marcador: cada set se cierra 6-0 a 6-4, 7-5 o 7-6.',
            'warning'
          );
        }
        return;
      }
    } else {
      const ev = evaluateMatchScore(finalScoreObj);
      if (!isWalkover && (!ev.valid || !ev.finished)) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            ev.error || 'Completa un marcador válido (al mejor de 2 sets + Super Tie-Break).',
            'warning'
          );
        }
        return;
      }
      eloResult = {
        ok: true,
        winnerSide: isWalkover ? walkoverWinnerSide : ev.winnerSide,
        summary: isWalkover ? 'W.O.' : ev.summary,
        cageLabel: 'Partido Amistoso',
        deltaA: 0,
        deltaB: 0,
        newPointsA: pA.points,
        newPointsB: pB.points,
        promotedA: false,
        promotedB: false,
      };
    }

    const closesImmediately =
      isAdmin ||
      (activeScoreboardChallenge.status === 'SCORE_PROPOSED' &&
        activeScoreboardChallenge.proposedBy &&
        activeScoreboardChallenge.proposedBy !== currentUser?.id);

    if (onFinalizeMatch) {
      onFinalizeMatch({
        challenge: activeScoreboardChallenge,
        eloResult,
        liveScore: finalScoreObj,
        isWalkover,
        walkoverWinnerSide,
      });
    }

    triggerHaptic('success');
    setShowWalkoverBox(false);
    setActiveScoreboardId(null);

    if (closesImmediately) {
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
    }
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
        onNotify(`Reprogramación registrada (${reschedReason}).`, 'info');
      }
      if (rival && !rival.hideWhatsapp) {
        const wa = buildWhatsappLink(
          rival.whatsapp,
          `Hola ${rival.name}, aviso desde TOTAL TENIS: por "${reschedReason}", propongo reprogramar nuestro partido en ${rescheduleTarget.clubName} para el ${dateText} a las ${timeText}.`
        );
        window.open(wa, '_blank', 'noopener,noreferrer');
      }
    }

    setRescheduleTarget(null);
  };

  /* ------------------------------------------------------------------------
     CÁLCULOS EN VIVO PARA LOS MODALES
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

  const directBuilt = useMemo(
    () => buildLiveScoreFromDirectDraft(directDraft),
    [directDraft]
  );

  const activeSbData = useMemo(() => {
    if (!activeScoreboardChallenge) return null;
    const pA = playersMap[activeScoreboardChallenge.playerAId];
    const pB = playersMap[activeScoreboardChallenge.playerBId];
    const judgePlayer = activeScoreboardChallenge.judgeId
      ? playersMap[activeScoreboardChallenge.judgeId]
      : null;
    const perms = getMatchPermissions(activeScoreboardChallenge, currentUser, isAdmin);

    const liveScore = activeScoreboardChallenge.liveScore || createEmptyLiveScore();
    const effectiveScore =
      scoreModalMode === 'direct' && perms.canConfirmOfficial
        ? directBuilt.liveScore
        : liveScore;

    const scoreEval = evaluateMatchScore(effectiveScore);
    const previewElo =
      scoreEval.finished && activeScoreboardChallenge.mode !== 'Amistoso' && pA && pB
        ? calculateOfficialMatchElo({
            playerA: pA,
            playerB: pB,
            liveScore: effectiveScore,
            challenges,
            totalActivePlayers: Math.max(players.length, 130),
          })
        : null;

    return {
      pA,
      pB,
      judgePlayer,
      perms,
      liveScore,
      effectiveScore,
      scoreEval,
      previewElo,
    };
  }, [
    activeScoreboardChallenge,
    playersMap,
    currentUser,
    isAdmin,
    scoreModalMode,
    directBuilt.liveScore,
    challenges,
    players.length,
  ]);

  return (
    <section
      className={`tt-retos-view ${theme === 'light' ? 'is-light' : 'is-dark'}`}
      aria-label="Retos y Cartelera Oficial TOTAL TENIS"
    >
      {/* ====================================================================
          1. CARRUSEL HERO COMPACTO (SIN RELOJ, SIN UV, SIN BLOQUE REDUNDANTE)
          ==================================================================== */}
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

      {/* ====================================================================
          2. ALERTA PRIORITARIA DE RETOS ENTRANTES PENDIENTES
          ==================================================================== */}
      {incomingPending.length > 0 && (
        <div className="tt-incoming-alert">
          <div className="tt-incoming-alert-head">
            <IconBadge name="challenge" variant="emerald" size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="tt-incoming-kicker">
                TIENES {incomingPending.length}{' '}
                {incomingPending.length === 1 ? 'DESAFÍO PENDIENTE' : 'DESAFÍOS PENDIENTES'}
              </span>
              <strong style={{ display: 'block', fontSize: '0.94rem' }}>
                {playersMap[incomingPending[0].playerAId]?.name || 'Un jugador'} te retó en{' '}
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
          3. SELECTOR DE 3 SUB-VISTAS (CARTELERA | TUS DESAFÍOS | LANZAR RETO)
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
          4A. CARTELERA PÚBLICA
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
              actionLabel="Lanzar un Reto"
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
                  onOpenScoreModal={openScoreModal}
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
          4B. TUS DESAFÍOS
          ==================================================================== */}
      {subTab === 'mis-retos' && (
        <div className="tt-retos-panel">
          {!currentUser ? (
            <EmptyStateCard
              theme={theme}
              title="Inicia sesión para gestionar tus partidos"
              description="Aquí verás tus retos recibidos, partidos programados y resultados por confirmar."
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
                  onOpenScoreModal={openScoreModal}
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
          4C. LANZAR RETO (BUSCADOR DE RIVALES)
          ==================================================================== */}
      {subTab === 'lanzar' && (
        <div className="tt-retos-panel">
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
                        <span>{eff}% Victorias</span>
                      </div>

                      {forecast && inOfficialRange ? (
                        <div className="tt-rival-forecast-line">
                          <span className="is-win">
                            Si ganas: +{forecast.playerA.minWin} a +{forecast.playerA.maxWin} pts
                          </span>
                          <span>·</span>
                          <span className="is-loss">
                            Si pierdes: {forecast.playerA.minLoss} a {forecast.playerA.maxLoss} pts
                          </span>
                        </div>
                      ) : !inOfficialRange ? (
                        <div className="tt-rival-forecast-line">
                          <span>Diferencia mayor a 1,200 pts · Disponible como amistoso</span>
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
          MODAL 1: PACTAR NUEVO DESAFÍO
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
            {preMatchForecast && formMode === 'Por puntos' && (
              <div className="tt-forecast-box">
                <div className="tt-forecast-head">
                  <strong>Puntos en juego</strong>
                  <span className="tt-rematch-tag">{preMatchForecast.rematch.label}</span>
                </div>
                <div className="tt-forecast-grid">
                  <div className="tt-forecast-cell is-win">
                    <span>Si ganas (hasta)</span>
                    <strong>+{preMatchForecast.playerA.maxWin} pts</strong>
                    <small>
                      Según marcador: +{preMatchForecast.playerA.minWin} a +
                      {preMatchForecast.playerA.maxWin}
                    </small>
                  </div>
                  <div className="tt-forecast-cell is-loss">
                    <span>Si pierdes (hasta)</span>
                    <strong>{preMatchForecast.playerA.maxLoss} pts</strong>
                    <small>En 3 sets: {preMatchForecast.playerA.minLoss} pts</small>
                  </div>
                </div>
              </div>
            )}

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
                      {m === 'Por puntos' ? 'Oficial · Por puntos' : 'Amistoso'}
                    </button>
                  );
                })}
              </div>
            </div>

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
                      <span>{club.shortName || club.name}</span>
                    </button>
                  );
                })}

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
                  placeholder="Ej. Cancha Municipal, Club Privado o dirección..."
                  maxLength={70}
                  required
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <div className="tt-date-time-grid">
              <div className="tt-field-group">
                <label className="tt-field-label" htmlFor="tt-reto-date">
                  Fecha
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
                  Hora
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
                Enviar Desafío
              </button>
            </div>
          </form>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 2: SUBIR RESULTADO DIRECTO (JUGADORES) | EN VIVO (ÁRBITRO)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(activeScoreboardChallenge && activeSbData)}
        onClose={() => {
          setShowWalkoverBox(false);
          setActiveScoreboardId(null);
        }}
        title={
          scoreModalMode === 'direct' && activeSbData?.perms?.canConfirmOfficial
            ? 'Subir Resultado Final'
            : 'Marcador en Vivo'
        }
        subtitle={activeScoreboardChallenge?.clubName || ''}
        icon={<IconBadge name="scoreboard" variant="emerald" size={38} />}
        isWide
      >
        {activeScoreboardChallenge && activeSbData && (
          <div className="tt-mc-container">
            {/* Switch claro: Resultado Directo (Jugadores) vs. Modo Árbitro en Vivo */}
            {activeSbData.perms.canConfirmOfficial && (
              <div className="tt-score-mode-switch" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={scoreModalMode === 'direct'}
                  className={scoreModalMode === 'direct' ? 'is-active' : ''}
                  onClick={() => {
                    triggerHaptic('light');
                    setScoreModalMode('direct');
                  }}
                >
                  Resultado directo
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={scoreModalMode === 'live'}
                  className={scoreModalMode === 'live' ? 'is-active' : ''}
                  onClick={() => {
                    triggerHaptic('light');
                    handleActivateLiveRefereeMode(activeScoreboardChallenge);
                  }}
                >
                  Modo Árbitro (en vivo)
                </button>
              </div>
            )}

            {/* Tablero Resumen Superior */}
            <div className="tt-stadium-board">
              <div className="tt-stadium-head">
                <span>JUGADORES</span>
                <div className="tt-stadium-cols">
                  <span>S1</span>
                  <span>S2</span>
                  {(activeSbData.scoreEval.needsSuperTieBreak || directBuilt.needsStb) && (
                    <span style={{ color: '#F59E0B' }}>STB</span>
                  )}
                </div>
              </div>

              <div className="tt-stadium-row">
                <div className="tt-stadium-player">
                  <PlayerAvatarWithClub
                    player={activeSbData.pA}
                    clubs={clubs}
                    size={38}
                    ringColor="#00DC7D"
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong>{activeSbData.pA?.name}</strong>
                    <small>{getCategoryByPoints(activeSbData.pA?.points).name}</small>
                  </div>
                </div>
                <div className="tt-stadium-cols">
                  <span className="tt-st-num">
                    {activeSbData.effectiveScore.set1.a}
                    {activeSbData.effectiveScore.set1.tbA > 0 ||
                    activeSbData.effectiveScore.set1.tbB > 0 ? (
                      <sup>{activeSbData.effectiveScore.set1.tbA}</sup>
                    ) : null}
                  </span>
                  <span className="tt-st-num">
                    {activeSbData.effectiveScore.set2.a}
                    {activeSbData.effectiveScore.set2.tbA > 0 ||
                    activeSbData.effectiveScore.set2.tbB > 0 ? (
                      <sup>{activeSbData.effectiveScore.set2.tbA}</sup>
                    ) : null}
                  </span>
                  {(activeSbData.scoreEval.needsSuperTieBreak || directBuilt.needsStb) && (
                    <span className="tt-st-num is-stb">
                      {activeSbData.effectiveScore.set3.a}
                    </span>
                  )}
                </div>
              </div>

              <div className="tt-stadium-row">
                <div className="tt-stadium-player">
                  <PlayerAvatarWithClub
                    player={activeSbData.pB}
                    clubs={clubs}
                    size={38}
                    ringColor="#F59E0B"
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong>{activeSbData.pB?.name}</strong>
                    <small>{getCategoryByPoints(activeSbData.pB?.points).name}</small>
                  </div>
                </div>
                <div className="tt-stadium-cols">
                  <span className="tt-st-num">
                    {activeSbData.effectiveScore.set1.b}
                    {activeSbData.effectiveScore.set1.tbA > 0 ||
                    activeSbData.effectiveScore.set1.tbB > 0 ? (
                      <sup>{activeSbData.effectiveScore.set1.tbB}</sup>
                    ) : null}
                  </span>
                  <span className="tt-st-num">
                    {activeSbData.effectiveScore.set2.b}
                    {activeSbData.effectiveScore.set2.tbA > 0 ||
                    activeSbData.effectiveScore.set2.tbB > 0 ? (
                      <sup>{activeSbData.effectiveScore.set2.tbB}</sup>
                    ) : null}
                  </span>
                  {(activeSbData.scoreEval.needsSuperTieBreak || directBuilt.needsStb) && (
                    <span className="tt-st-num is-stb">
                      {activeSbData.effectiveScore.set3.b}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ==============================================================
                MODO A: CARGA DIRECTA POR SETS (PARA JUGADORES — RÁPIDO)
                ============================================================== */}
            {activeSbData.perms.canConfirmOfficial && scoreModalMode === 'direct' && (
              <div className="tt-mc-controls-wrap">
                <p className="tt-direct-hint">
                  Escribe el marcador final de cada set. Al enviarlo, tu rival recibirá una alerta para confirmarlo.
                </p>

                {/* Set 1 */}
                <div className="tt-direct-set-box">
                  <div className="tt-direct-set-head">
                    <strong>Set 1</strong>
                    <span>Ej. 6 - 4, 7 - 5 o 7 - 6</span>
                  </div>
                  <div className="tt-direct-inputs-row">
                    <label className="tt-direct-field">
                      <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        placeholder="0"
                        className="tt-direct-num-input"
                        value={directDraft.s1a}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, s1a: e.target.value.slice(0, 1) }))
                        }
                      />
                    </label>
                    <span className="tt-direct-dash">–</span>
                    <label className="tt-direct-field">
                      <span>{activeSbData.pB?.name?.split(' ')[0]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        placeholder="0"
                        className="tt-direct-num-input"
                        value={directDraft.s1b}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, s1b: e.target.value.slice(0, 1) }))
                        }
                      />
                    </label>
                  </div>

                  {directBuilt.s1Tb && (
                    <div className="tt-direct-tb-row">
                      <span>Tie-Break Set 1 (opcional):</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder={Number(directDraft.s1a) === 7 ? '7' : '5'}
                        className="tt-direct-tb-input"
                        value={directDraft.tb1a}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, tb1a: e.target.value.slice(0, 2) }))
                        }
                      />
                      <span>–</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder={Number(directDraft.s1b) === 7 ? '7' : '5'}
                        className="tt-direct-tb-input"
                        value={directDraft.tb1b}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, tb1b: e.target.value.slice(0, 2) }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Set 2 */}
                <div className="tt-direct-set-box">
                  <div className="tt-direct-set-head">
                    <strong>Set 2</strong>
                    <span>Ej. 6 - 3, 4 - 6 o 7 - 6</span>
                  </div>
                  <div className="tt-direct-inputs-row">
                    <label className="tt-direct-field">
                      <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        placeholder="0"
                        className="tt-direct-num-input"
                        value={directDraft.s2a}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, s2a: e.target.value.slice(0, 1) }))
                        }
                      />
                    </label>
                    <span className="tt-direct-dash">–</span>
                    <label className="tt-direct-field">
                      <span>{activeSbData.pB?.name?.split(' ')[0]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        placeholder="0"
                        className="tt-direct-num-input"
                        value={directDraft.s2b}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, s2b: e.target.value.slice(0, 1) }))
                        }
                      />
                    </label>
                  </div>

                  {directBuilt.s2Tb && (
                    <div className="tt-direct-tb-row">
                      <span>Tie-Break Set 2 (opcional):</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder={Number(directDraft.s2a) === 7 ? '7' : '5'}
                        className="tt-direct-tb-input"
                        value={directDraft.tb2a}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, tb2a: e.target.value.slice(0, 2) }))
                        }
                      />
                      <span>–</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder={Number(directDraft.s2b) === 7 ? '7' : '5'}
                        className="tt-direct-tb-input"
                        value={directDraft.tb2b}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, tb2b: e.target.value.slice(0, 2) }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Set 3 Super Tie-Break (aparece automáticamente si empataron 1-1) */}
                {directBuilt.needsStb && (
                  <div className="tt-direct-set-box is-stb-card">
                    <div className="tt-direct-set-head">
                      <strong>3er Set · Super Tie-Break (a 10+)</strong>
                      <span>Diferencia de 2 puntos</span>
                    </div>
                    <div className="tt-direct-inputs-row">
                      <label className="tt-direct-field">
                        <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={30}
                          placeholder="10"
                          className="tt-direct-num-input"
                          value={directDraft.s3a}
                          onChange={(e) =>
                            setDirectDraft((d) => ({ ...d, s3a: e.target.value.slice(0, 2) }))
                          }
                        />
                      </label>
                      <span className="tt-direct-dash">–</span>
                      <label className="tt-direct-field">
                        <span>{activeSbData.pB?.name?.split(' ')[0]}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={30}
                          placeholder="8"
                          className="tt-direct-num-input"
                          value={directDraft.s3b}
                          onChange={(e) =>
                            setDirectDraft((d) => ({ ...d, s3b: e.target.value.slice(0, 2) }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Previsualización y Envío */}
                {activeSbData.scoreEval.finished ? (
                  <div className="tt-elo-preview-card">
                    <div className="tt-elo-preview-head">
                      <strong>Marcador listo: {activeSbData.scoreEval.summary}</strong>
                      <span>
                        {activeScoreboardChallenge.mode === 'Amistoso'
                          ? 'Partido amistoso (sin cambio de puntos)'
                          : 'Se enviará a tu rival para confirmar los puntos'}
                      </span>
                    </div>

                    {activeSbData.previewElo?.ok && (
                      <div className="tt-elo-preview-deltas">
                        <div>
                          <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                          <strong
                            style={{
                              color: activeSbData.previewElo.deltaA >= 0 ? '#00B365' : '#EF4444',
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
                              color: activeSbData.previewElo.deltaB >= 0 ? '#00B365' : '#EF4444',
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

                    <button
                      type="button"
                      className="tt-btn tt-btn-primary"
                      style={{ width: '100%', marginTop: 10 }}
                      onClick={() =>
                        handleSubmitMatchResult({
                          scoreObj: activeSbData.effectiveScore,
                          isWalkover: false,
                        })
                      }
                    >
                      {isAdmin ? 'Confirmar Resultado Oficial' : 'Enviar Resultado a mi Rival'}
                    </button>
                  </div>
                ) : (
                  <div className="tt-direct-validation-note">
                    {directBuilt.needsStb
                      ? 'Empataron 1-1 en sets: ingresa el Super Tie-Break (a 10 puntos con diferencia de 2).'
                      : 'Completa Set 1 y Set 2 con un marcador válido (ej. 6-4, 6-2 o 7-6) para enviar el resultado.'}
                  </div>
                )}

                {/* Walkover discreto */}
                <div className="tt-mc-secondary-bar">
                  <button
                    type="button"
                    className="tt-text-action"
                    onClick={() => setShowWalkoverBox((v) => !v)}
                  >
                    Reportar Walkover (Inasistencia)
                  </button>
                </div>

                {showWalkoverBox && (
                  <div className="tt-wo-box">
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem' }}>
                      Selecciona quién se presentó en cancha para registrar el Walkover:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        onClick={() =>
                          handleSubmitMatchResult({
                            scoreObj: createEmptyLiveScore(),
                            isWalkover: true,
                            walkoverWinnerSide: 'A',
                          })
                        }
                      >
                        Gana {activeSbData.pA?.name?.split(' ')[0]} (W.O.)
                      </button>
                      <button
                        type="button"
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        onClick={() =>
                          handleSubmitMatchResult({
                            scoreObj: createEmptyLiveScore(),
                            isWalkover: true,
                            walkoverWinnerSide: 'B',
                          })
                        }
                      >
                        Gana {activeSbData.pB?.name?.split(' ')[0]} (W.O.)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==============================================================
                MODO B: MARCADOR EN VIVO GAME A GAME (EXCLUSIVO ÁRBITRO)
                ============================================================== */}
            {activeSbData.perms.canEditScore &&
              (scoreModalMode === 'live' || !activeSbData.perms.canConfirmOfficial) && (
                <div className="tt-mc-controls-wrap">
                  {activeSbData.perms.canAssignJudge && (
                    <div className="tt-judge-assign-box">
                      <label className="tt-field-label" htmlFor="tt-judge-select">
                        Designar Árbitro en Cancha (lleva los games en vivo)
                      </label>
                      <select
                        id="tt-judge-select"
                        className="tt-input"
                        value={activeScoreboardChallenge.judgeId || ''}
                        onChange={(e) => handleAssignJudge(e.target.value)}
                      >
                        <option value="">Sin árbitro externo asignado</option>
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

                  {['set1', 'set2'].map((setKey, idx) => {
                    const sObj = activeSbData.liveScore[setKey];
                    const setLabel = idx === 0 ? 'Set 1' : 'Set 2';
                    const inTieBreak = sObj.a === 6 && sObj.b === 6 && !sObj.locked;
                    const canAddA = canIncrementRegularGame(sObj, 'A');
                    const canAddB = canIncrementRegularGame(sObj, 'B');

                    if (
                      setKey === 'set2' &&
                      !activeSbData.liveScore.set1.locked &&
                      sObj.a === 0 &&
                      sObj.b === 0
                    ) {
                      return null;
                    }

                    return (
                      <div key={setKey} className="tt-set-control-card">
                        <div className="tt-set-control-head">
                          <strong>
                            {setLabel}{' '}
                            {sObj.locked
                              ? '· Cerrado'
                              : inTieBreak
                              ? '· Tie-Break a 7+'
                              : '· En curso'}
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
                                    handleScoreboardAction({
                                      type: 'GAME_DELTA',
                                      setKey,
                                      side: 'A',
                                      delta: -1,
                                    });
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
                                    handleScoreboardAction({
                                      type: 'GAME_DELTA',
                                      setKey,
                                      side: 'A',
                                      delta: 1,
                                    });
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
                                    handleScoreboardAction({
                                      type: 'GAME_DELTA',
                                      setKey,
                                      side: 'B',
                                      delta: -1,
                                    });
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
                                    handleScoreboardAction({
                                      type: 'GAME_DELTA',
                                      setKey,
                                      side: 'B',
                                      delta: 1,
                                    });
                                  }}
                                >
                                  +1 Game
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {inTieBreak && (
                          <div className="tt-tb-panel">
                            <div className="tt-tb-banner">TIE-BREAK A 7+ (DIFERENCIA DE 2)</div>
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
                                    onClick={() =>
                                      handleScoreboardAction({
                                        type: 'TB_DELTA',
                                        setKey,
                                        side: 'A',
                                        delta: -1,
                                      })
                                    }
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    className="tt-step-plus"
                                    onClick={() =>
                                      handleScoreboardAction({
                                        type: 'TB_DELTA',
                                        setKey,
                                        side: 'A',
                                        delta: 1,
                                      })
                                    }
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
                                    onClick={() =>
                                      handleScoreboardAction({
                                        type: 'TB_DELTA',
                                        setKey,
                                        side: 'B',
                                        delta: -1,
                                      })
                                    }
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    className="tt-step-plus is-amber"
                                    onClick={() =>
                                      handleScoreboardAction({
                                        type: 'TB_DELTA',
                                        setKey,
                                        side: 'B',
                                        delta: 1,
                                      })
                                    }
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

                  {activeSbData.scoreEval.needsSuperTieBreak && (
                    <div className="tt-set-control-card is-stb-card">
                      <div className="tt-set-control-head">
                        <strong>3er Set · Super Tie-Break a 10+</strong>
                        {activeSbData.liveScore.set3.locked && (
                          <button
                            type="button"
                            className="tt-unlock-btn"
                            onClick={() =>
                              handleScoreboardAction({ type: 'UNLOCK_SET', setKey: 'set3' })
                            }
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
                                onClick={() =>
                                  handleScoreboardAction({
                                    type: 'STB_DELTA',
                                    side: 'A',
                                    delta: -1,
                                  })
                                }
                              >
                                −
                              </button>
                              <button
                                type="button"
                                className="tt-step-plus"
                                onClick={() =>
                                  handleScoreboardAction({
                                    type: 'STB_DELTA',
                                    side: 'A',
                                    delta: 1,
                                  })
                                }
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
                                onClick={() =>
                                  handleScoreboardAction({
                                    type: 'STB_DELTA',
                                    side: 'B',
                                    delta: -1,
                                  })
                                }
                              >
                                −
                              </button>
                              <button
                                type="button"
                                className="tt-step-plus is-amber"
                                onClick={() =>
                                  handleScoreboardAction({
                                    type: 'STB_DELTA',
                                    side: 'B',
                                    delta: 1,
                                  })
                                }
                              >
                                +1 Punto
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSbData.scoreEval.finished && (
                    <div className="tt-elo-preview-card">
                      <div className="tt-elo-preview-head">
                        <strong>Marcador completo: {activeSbData.scoreEval.summary}</strong>
                      </div>
                      {activeSbData.perms.canConfirmOfficial ? (
                        <button
                          type="button"
                          className="tt-btn tt-btn-primary"
                          style={{ width: '100%' }}
                          onClick={() =>
                            handleSubmitMatchResult({
                              scoreObj: activeSbData.liveScore,
                              isWalkover: false,
                            })
                          }
                        >
                          {isAdmin ? 'Confirmar Resultado Oficial' : 'Enviar Resultado a mi Rival'}
                        </button>
                      ) : (
                        <p className="tt-muted" style={{ margin: 0, fontSize: '0.78rem' }}>
                          Como Árbitro en cancha completaste el marcador. Los dos jugadores ya pueden confirmar el resultado final.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="tt-mc-secondary-bar">
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
                </div>
              )}

            {/* MODO ESPECTADOR */}
            {!activeSbData.perms.canEditScore && (
              <div className="tt-spectator-note">
                <TTIcon name="vision" size={18} style={{ color: '#00DC7D' }} />
                <span>
                  Estás viendo el partido en modo espectador. El marcador se actualiza en vivo desde cancha.
                </span>
              </div>
            )}
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 3: REPROGRAMACIÓN Y REGLA 24 HORAS
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
                          ? 'Cambio de horario habilitado (1 por partido)'
                          : 'Faltan menos de 24 h o ya usaste tu cambio'}
                      </strong>
                      <p style={{ margin: '3px 0 0', fontSize: '0.77rem', opacity: 0.88 }}>
                        {isOrdinary
                          ? `Faltan ${p.hoursUntilMatch} horas para el partido. Puedes reprogramar 1 vez sin penalización.`
                          : 'Solo se permite reprogramar por lluvia o emergencia avisando directo por WhatsApp a tu rival.'}
                      </p>
                    </div>
                  </div>

                  {!isOrdinary && (
                    <div className="tt-field-group">
                      <label className="tt-field-label">Motivo</label>
                      <div className="tt-balls-stack">
                        {[
                          'Lluvia intensa en cancha',
                          'Cancha inundada',
                          'Emergencia médica o laboral',
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
          MODAL 4: CELEBRACIÓN POST-PARTIDO + STORIES
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(celebrationPayload)}
        onClose={() => setCelebrationPayload(null)}
        title={celebrationPayload?.promoted ? '¡Ascenso de Categoría!' : '¡Resultado Confirmado!'}
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
                width: 140,
                height: 140,
                borderRadius: 24,
                objectFit: 'cover',
                border: '2px solid rgba(0, 220, 125, 0.5)',
              }}
            />

            <div>
              <span className="tt-winner-chip" style={{ marginBottom: 6 }}>
                GANADOR
              </span>
              <h3 className="tt-title-lg" style={{ margin: '4px 0' }}>
                {celebrationPayload.winnerPlayer?.name}
              </h3>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00B365' }}>
                {celebrationPayload.eloResult.summary}
              </div>
            </div>

            {celebrationPayload.isOfficial && (
              <div className="tt-elo-preview-deltas" style={{ width: '100%' }}>
                <div>
                  <span>{celebrationPayload.playerA?.name}</span>
                  <strong
                    style={{
                      color: celebrationPayload.eloResult.deltaA >= 0 ? '#00B365' : '#EF4444',
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
                      color: celebrationPayload.eloResult.deltaB >= 0 ? '#00B365' : '#EF4444',
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

      <style>{`
        .tt-retos-view {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        /* 1. HERO COMPACTO (SUBE LOS DESAFÍOS ARRIBA DEL TODO) */
        .tt-hero-stage {
          position: relative;
          min-height: 176px;
          border-radius: 22px;
          overflow: hidden;
          background-color: #1A0530;
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-shadow-md);
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
        .tt-hero-stage-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(20, 5, 36, 0.22) 0%,
            rgba(20, 5, 36, 0.62) 48%,
            rgba(16, 3, 29, 0.95) 100%
          );
        }
        .tt-hero-stage-content {
          position: relative;
          z-index: 2;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          align-self: flex-start;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(18, 3, 33, 0.76);
          border: 1px solid rgba(0, 220, 125, 0.45);
          color: #00DC7D;
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .tt-hero-headline {
          margin: 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: clamp(1.25rem, 5vw, 1.72rem);
          line-height: 1.04;
          color: #FAF9F5;
          text-shadow: 0 3px 12px rgba(0, 0, 0, 0.65);
        }
        .tt-hero-subcopy {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.34;
          color: rgba(250, 249, 245, 0.86);
        }
        .tt-hero-footer-row {
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-hero-cta-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          background: #FAF9F5;
          color: #1E0734;
          font-size: 0.73rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
        }
        .tt-hero-cta-pill:active { transform: scale(0.96); }
        .tt-cta-emerald-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #00DC7D;
          flex-shrink: 0;
        }
        .tt-hero-controls { display: flex; align-items: center; gap: 8px; }
        .tt-hero-dots { display: flex; align-items: center; gap: 5px; }
        .tt-hero-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.38);
          transition: width 200ms ease, background-color 200ms ease;
        }
        .tt-hero-dot.is-active { width: 20px; background: #00DC7D; }
        .tt-hero-arrows { display: flex; gap: 5px; }
        .tt-circle-nav-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(250, 249, 245, 0.16);
          border: 1px solid rgba(250, 249, 245, 0.26);
          color: #FAF9F5;
          font-size: 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-live-dot-inline {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00DC7D;
          display: inline-block;
          animation: ttLivePulse 1.6s infinite;
        }

        /* 2. ALERTA RETOS ENTRANTES */
        .tt-incoming-alert {
          border-radius: 18px;
          padding: 13px;
          background: linear-gradient(135deg, #1E0734 0%, #2C0B4E 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.58);
          color: #FAF9F5;
        }
        .tt-incoming-alert-head { display: flex; align-items: center; gap: 11px; }
        .tt-incoming-kicker {
          display: block;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
        }

        /* 3. SUB-TABS */
        .tt-subtabs-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 5px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-subtab-btn {
          min-height: 40px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          transition: background-color 160ms ease, color 160ms ease;
        }
        .tt-subtab-btn.is-active {
          background: #1E0734;
          color: #00DC7D;
          box-shadow: 0 5px 14px rgba(10, 2, 20, 0.22);
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
          color: var(--tt-emerald-text);
          font-size: 0.66rem;
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
        .tt-retos-panel { display: flex; flex-direction: column; gap: 12px; }
        .tt-filter-pills-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tt-filter-pills-row::-webkit-scrollbar { display: none; }
        .tt-filter-chip {
          flex-shrink: 0;
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          font-size: 0.74rem;
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
        .tt-matches-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 760px) {
          .tt-matches-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .tt-match-card {
          border-radius: 22px;
          padding: 14px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-match-card.is-live { border-color: rgba(0, 220, 125, 0.52); }
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
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.06em;
        }
        .tt-match-pill.is-live { background: rgba(0, 220, 125, 0.18); color: #00DC7D; }
        .tt-retos-view.is-light .tt-match-pill.is-live { background: #1E0734; color: #00DC7D; }
        .tt-match-pill.is-scheduled { background: rgba(56, 189, 248, 0.16); color: #38BDF8; }
        .tt-retos-view.is-light .tt-match-pill.is-scheduled { background: rgba(30, 7, 52, 0.09); color: #1E0734; }
        .tt-match-pill.is-pending { background: rgba(245, 158, 11, 0.18); color: #F59E0B; }
        .tt-retos-view.is-light .tt-match-pill.is-pending { background: #FEF3C7; color: #92400E; }
        .tt-match-pill.is-disputed { background: rgba(239, 68, 68, 0.18); color: #F87171; }
        .tt-retos-view.is-light .tt-match-pill.is-disputed { background: #FEE2E2; color: #B91C1C; }
        .tt-match-pill.is-finished { background: var(--tt-surface-2); color: var(--tt-text-muted); }
        .tt-match-mode-tag { font-size: 0.7rem; font-weight: 700; color: var(--tt-text-muted); }

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
          font-size: 0.7rem;
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
        .tt-retos-view.is-light .tt-winner-chip { background: #007A44; color: #FFFFFF; }
        .tt-match-center-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding-top: 8px;
        }
        .tt-vs-emblem {
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 1.16rem;
          color: #D97706;
          line-height: 1;
        }
        .tt-match-date-chip { font-size: 0.69rem; font-weight: 800; color: var(--tt-text); white-space: nowrap; }
        .tt-match-time-chip { font-size: 0.68rem; font-weight: 700; color: var(--tt-text-muted); white-space: nowrap; }

        .tt-mini-scoreboard {
          border-radius: 14px;
          padding: 10px 12px;
          background: #17042A;
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.24);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-mini-sb-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tt-mini-sb-name { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; font-weight: 800; min-width: 76px; }
        .tt-mini-sb-sets { display: flex; gap: 6px; margin-left: auto; }
        .tt-sb-cell {
          width: 26px;
          height: 24px;
          border-radius: 7px;
          background: rgba(250, 249, 245, 0.12);
          font-weight: 900;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-sb-cell.is-stb {
          background: rgba(245, 158, 11, 0.22);
          color: #FDE68A;
          min-width: 30px;
          width: auto;
          padding: 0 6px;
        }
        .tt-delta-pill { min-width: 40px; text-align: right; font-size: 0.75rem; font-weight: 900; }
        .tt-delta-pill.is-pos { color: #00DC7D; }
        .tt-delta-pill.is-neg { color: #F87171; }
        .tt-mini-sb-foot {
          margin-top: 2px;
          padding-top: 6px;
          border-top: 1px solid rgba(250, 249, 245, 0.12);
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.68rem;
          color: rgba(250, 249, 245, 0.76);
        }

        .tt-match-venue-bar {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 9px 11px;
          border-radius: 13px;
          background: var(--tt-surface-2);
        }
        .tt-match-venue-item { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: var(--tt-text); }
        .tt-match-venue-item.is-subtle { font-size: 0.71rem; font-weight: 600; color: var(--tt-text-muted); }
        .tt-match-actions { display: flex; align-items: center; gap: 8px; }
        .tt-btn-sm { min-height: 40px !important; padding: 0 13px !important; font-size: 0.77rem !important; border-radius: 12px !important; }
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
          color: #16A34A;
          border: 1px solid rgba(37, 211, 102, 0.35);
        }
        .tt-waiting-banner {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 11px;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.14);
          color: #D97706;
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-spectator-pill {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 36px;
          border-radius: 11px;
          background: var(--tt-surface-2);
          color: var(--tt-text-muted);
          font-size: 0.72rem;
          font-weight: 700;
        }

        /* 6. RADAR DE RIVALES */
        .tt-radar-controls { display: flex; flex-direction: column; gap: 10px; }
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
          font-size: 16px;
          outline: none;
        }
        .tt-rivals-list { display: flex; flex-direction: column; gap: 10px; }
        .tt-rival-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 13px;
          border-radius: 18px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
        }
        .tt-rival-row.is-out-of-range { opacity: 0.75; }
        .tt-rival-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .tt-rival-name-line { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
        .tt-rival-name-line strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-rival-meta-line { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: var(--tt-text-muted); flex-wrap: wrap; }
        .tt-cat-mini-pill { padding: 2px 7px; border-radius: 999px; font-weight: 800; font-size: 0.67rem; }
        .tt-rival-forecast-line { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--tt-text-muted); flex-wrap: wrap; }
        .tt-rival-forecast-line .is-win { color: var(--tt-emerald-text); font-weight: 800; }
        .tt-rival-forecast-line .is-loss { color: #EF4444; font-weight: 700; }
        .tt-rival-cta-col { flex-shrink: 0; }

        /* 7. FORMULARIOS EN MODAL */
        .tt-form-stack { display: flex; flex-direction: column; gap: 14px; }
        .tt-field-group { display: flex; flex-direction: column; gap: 6px; }
        .tt-field-label { font-size: 0.74rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-forecast-box {
          border-radius: 16px;
          padding: 12px;
          background: linear-gradient(135deg, #1E0734 0%, #140424 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.34);
        }
        .tt-forecast-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; font-size: 0.8rem; }
        .tt-rematch-tag { padding: 3px 8px; border-radius: 999px; background: rgba(245, 158, 11, 0.22); color: #FDE68A; font-size: 0.66rem; font-weight: 800; }
        .tt-forecast-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tt-forecast-cell { padding: 9px 10px; border-radius: 12px; background: rgba(250, 249, 245, 0.07); display: flex; flex-direction: column; gap: 2px; }
        .tt-forecast-cell span { font-size: 0.68rem; opacity: 0.78; }
        .tt-forecast-cell strong { font-size: 1.15rem; font-weight: 900; }
        .tt-forecast-cell.is-win strong { color: #00DC7D; }
        .tt-forecast-cell.is-loss strong { color: #F87171; }
        .tt-forecast-cell small { font-size: 0.66rem; opacity: 0.74; }

        .tt-toggle-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tt-choice-pill {
          min-height: 42px;
          padding: 8px 12px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.78rem;
          font-weight: 700;
          text-align: center;
        }
        .tt-choice-pill.is-selected {
          background: rgba(0, 220, 125, 0.16);
          border-color: #00DC7D;
          color: var(--tt-emerald-text);
          font-weight: 800;
        }
        .tt-retos-view.is-light .tt-choice-pill.is-selected {
          background: #1E0734;
          border-color: #1E0734;
          color: #00DC7D;
        }
        .tt-venues-select-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
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
          font-size: 0.77rem;
          font-weight: 700;
          text-align: left;
        }
        .tt-venue-option.is-custom { grid-column: 1 / -1; justify-content: center; }
        .tt-venue-option.is-selected { border-color: #00DC7D; background: rgba(0, 220, 125, 0.14); }
        .tt-date-time-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 10px; }
        .tt-quick-slots-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
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
        .tt-slot-chip.is-selected { background: #00DC7D; border-color: #00DC7D; color: #120321; font-weight: 900; }
        .tt-balls-stack { display: flex; flex-direction: column; gap: 7px; }

        /* 8. MODAL MARCADOR DIRECTO + MODO ÁRBITRO */
        .tt-mc-container { display: flex; flex-direction: column; gap: 13px; }
        .tt-score-mode-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          padding: 4px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-score-mode-switch button {
          min-height: 38px;
          border-radius: 10px;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-score-mode-switch button.is-active {
          background: #1E0734;
          color: #00DC7D;
        }

        .tt-stadium-board {
          border-radius: 18px;
          padding: 13px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.34);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-stadium-head { display: flex; justify-content: space-between; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em; color: rgba(250, 249, 245, 0.6); }
        .tt-stadium-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 8px; border-top: 1px solid rgba(250, 249, 245, 0.1); }
        .tt-stadium-player { display: flex; align-items: center; gap: 9px; min-width: 0; }
        .tt-stadium-player strong { display: block; font-size: 0.86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-stadium-player small { font-size: 0.68rem; color: rgba(250, 249, 245, 0.66); }
        .tt-stadium-cols { display: flex; gap: 7px; flex-shrink: 0; }
        .tt-stadium-head .tt-stadium-cols span { width: 34px; text-align: center; }
        .tt-st-num {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(250, 249, 245, 0.12);
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-st-num sup { font-size: 0.6rem; color: #00DC7D; margin-left: 1px; }
        .tt-st-num.is-stb { background: rgba(245, 158, 11, 0.24); color: #FDE68A; min-width: 38px; width: auto; padding: 0 6px; }

        /* Inputs directos rápidos por set */
        .tt-direct-hint { margin: 0; font-size: 0.77rem; color: var(--tt-text-muted); line-height: 1.4; }
        .tt-direct-set-box {
          border-radius: 16px;
          padding: 12px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-direct-set-box.is-stb-card { border-color: rgba(245, 158, 11, 0.52); }
        .tt-direct-set-head { display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; }
        .tt-direct-set-head span { font-size: 0.7rem; color: var(--tt-text-muted); }
        .tt-direct-inputs-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: end;
          gap: 10px;
        }
        .tt-direct-field { display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .tt-direct-field span { font-size: 0.74rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-direct-num-input {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border-medium);
          color: var(--tt-text);
          text-align: center;
          font-family: var(--tt-font-display);
          font-size: 1.65rem;
          font-weight: 900;
        }
        .tt-direct-num-input:focus { outline: none; border-color: #00DC7D; }
        .tt-direct-dash { font-size: 1.4rem; font-weight: 900; padding-bottom: 12px; color: var(--tt-text-muted); }
        .tt-direct-tb-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding-top: 6px;
          border-top: 1px solid var(--tt-border);
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }
        .tt-direct-tb-input {
          width: 48px;
          height: 36px;
          border-radius: 10px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border-medium);
          color: var(--tt-text);
          text-align: center;
          font-weight: 900;
        }
        .tt-direct-validation-note {
          padding: 11px 13px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px dashed var(--tt-border-medium);
          color: var(--tt-text-muted);
          font-size: 0.76rem;
          font-weight: 700;
          text-align: center;
        }

        .tt-mc-controls-wrap { display: flex; flex-direction: column; gap: 11px; }
        .tt-set-control-card {
          border-radius: 16px;
          padding: 12px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-set-control-card.is-stb-card { border-color: rgba(245, 158, 11, 0.45); }
        .tt-set-control-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.8rem; }
        .tt-unlock-btn { padding: 4px 10px; border-radius: 999px; background: rgba(245, 158, 11, 0.16); color: #D97706; font-size: 0.7rem; font-weight: 800; }
        .tt-tb-panel { display: flex; flex-direction: column; gap: 10px; }
        .tt-tb-banner { text-align: center; padding: 6px 10px; border-radius: 10px; background: rgba(0, 220, 125, 0.15); color: var(--tt-emerald-text); font-size: 0.68rem; font-weight: 900; }
        .tt-dual-stepper { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .tt-stepper-side { display: flex; flex-direction: column; gap: 6px; }
        .tt-stepper-name { font-size: 0.76rem; font-weight: 800; color: var(--tt-text-muted); text-align: center; }
        .tt-stepper-btns { display: flex; gap: 6px; }
        .tt-step-minus { width: 40px; height: 44px; border-radius: 12px; background: var(--tt-surface); border: 1px solid var(--tt-border); color: var(--tt-text); font-size: 1.2rem; font-weight: 800; }
        .tt-step-plus { flex: 1; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%); color: #120321; font-size: 0.82rem; font-weight: 900; }
        .tt-step-plus.is-amber { background: linear-gradient(135deg, #FBBF24 0%, #D97706 100%); color: #1E1102; }

        .tt-judge-assign-box { display: flex; flex-direction: column; gap: 6px; }
        .tt-elo-preview-card {
          border-radius: 16px;
          padding: 13px;
          background: rgba(0, 220, 125, 0.1);
          border: 1.5px solid rgba(0, 220, 125, 0.45);
        }
        .tt-elo-preview-head { display: flex; flex-direction: column; gap: 2px; margin-bottom: 10px; }
        .tt-elo-preview-head span { font-size: 0.72rem; color: var(--tt-text-muted); }
        .tt-elo-preview-deltas { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tt-elo-preview-deltas > div { padding: 8px 10px; border-radius: 11px; background: var(--tt-surface); display: flex; flex-direction: column; gap: 2px; font-size: 0.76rem; }
        .tt-mc-secondary-bar { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding-top: 2px; }
        .tt-text-action { font-size: 0.75rem; font-weight: 700; color: var(--tt-text-muted); text-decoration: underline; }
        .tt-text-action.is-danger { color: #EF4444; }
        .tt-wo-box { padding: 11px; border-radius: 13px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.32); }
        .tt-spectator-note { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 14px; background: var(--tt-surface-2); font-size: 0.8rem; color: var(--tt-text-muted); }
        .tt-rule-callout { display: flex; gap: 10px; padding: 12px; border-radius: 14px; font-size: 0.82rem; }
        .tt-rule-callout.is-ok { background: rgba(0, 220, 125, 0.14); border: 1px solid rgba(0, 220, 125, 0.4); }
        .tt-rule-callout.is-warn { background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.42); }
      `}</style>
    </section>
  );
}
