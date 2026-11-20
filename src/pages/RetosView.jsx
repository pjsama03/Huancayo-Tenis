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
