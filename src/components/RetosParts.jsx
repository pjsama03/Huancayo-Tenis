import React from 'react';
import {
  ASSETS,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from './AppIcons';
import { getCategoryByPoints, getClubById } from '../data/playersAndClubsData';
import {
  createEmptyLiveScore,
  evaluateMatchScore,
  getMatchPermissions,
} from '../utils/tenisEngine';
import { buildWhatsappLink, getEffectiveContactPhone } from '../utils/cloudService';

/* ==========================================================================
   CONSTANTES Y UTILIDADES DE RETOS (HORA PERÚ + ANTI-ESCASEZ + SCORE DIRECTO)
   ========================================================================== */
export const MAX_OFFICIAL_ELO_WINDOW = 1200;
export const EXPANDED_ANTI_SCARCITY_WINDOW = 1800;
export const ANTI_SCARCITY_MIN_RIVALS = 6;
export const ANTI_SCARCITY_MAX_TARGETS = 8;

export const QUICK_TIME_SLOTS = [
  '07:00',
  '08:30',
  '10:00',
  '15:00',
  '16:30',
  '18:00',
  '19:00',
  '20:00',
];

export const BALLS_AGREEMENTS = [
  'Lata nueva a medias (50/50)',
  'Tarro nuevo (lleva retador)',
  'Pelotas en buen estado',
];

export function getTodayDateInputValue(daysAhead = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDynamicDateAndTime(isoString, fallbackDate = '', fallbackTime = '') {
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
    const fmtKey = (dt) => dt.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
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
        fallbackTime || d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export function isRegularSetFinished(a, b) {
  return (
    (a === 6 && b <= 4) ||
    (b === 6 && a <= 4) ||
    (a === 7 && (b === 5 || b === 6)) ||
    (b === 7 && (a === 5 || a === 6))
  );
}

export function createDirectDraftFromScore(liveScore) {
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

export function buildLiveScoreFromDirectDraft(draft) {
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
   MOTOR DE VENTANA DINÁMICA ANTI-ESCASEZ (REGLA OFICIAL APROBADA)
   ========================================================================== */
export function computeAdaptiveOfficialRivals(players = [], currentUser = null) {
  const myPoints = Number(currentUser?.points) || 1500;
  const pool = (players || [])
    .filter((p) => !p.isPaused && !p.isTutorOnly)
    .filter((p) => !currentUser || p.id !== currentUser.id)
    .map((p) => ({
      player: p,
      gap: Math.abs((Number(p.points) || 0) - myPoints),
    }))
    .sort((a, b) => a.gap - b.gap);

  const inBase = pool.filter((item) => item.gap <= MAX_OFFICIAL_ELO_WINDOW);
  const shouldExpand = Boolean(
    currentUser && !currentUser.isTutorOnly && inBase.length < ANTI_SCARCITY_MIN_RIVALS
  );

  const eligibleIds = new Set();
  if (shouldExpand) {
    pool
      .filter((item) => item.gap <= EXPANDED_ANTI_SCARCITY_WINDOW)
      .slice(0, ANTI_SCARCITY_MAX_TARGETS)
      .forEach((item) => eligibleIds.add(item.player.id));
  } else {
    inBase.forEach((item) => eligibleIds.add(item.player.id));
  }

  return {
    expanded: shouldExpand,
    inBaseCount: inBase.length,
    effectiveWindow: shouldExpand ? EXPANDED_ANTI_SCARCITY_WINDOW : MAX_OFFICIAL_ELO_WINDOW,
    monthlyQuota: shouldExpand ? 2 : 4,
    eligibleIds,
  };
}

/* ==========================================================================
   MOTOR DE GEMAS POR VICTORIA EN CANCHA (ESCALADO HASTA 6-0, 6-0 · VIP ×2.5)
   ========================================================================== */
export function getMatchVictoryGemsRange(isVip = false) {
  return isVip
    ? { min: 10, max: 25, standardMax: 10, vipMax: 25 }
    : { min: 4, max: 10, standardMax: 10, vipMax: 25 };
}

export function calculateMatchVictoryGems(liveScore, isVip = false, isWalkover = false) {
  if (isWalkover) {
    return {
      standard: 0,
      vip: 0,
      awarded: 0,
      tierLabel: 'Walkover (sin bono en cancha)',
      isDoubleBagel: false,
    };
  }

  const ev = evaluateMatchScore(liveScore);
  if (!ev?.finished || !ev?.winnerSide) {
    return {
      standard: 0,
      vip: 0,
      awarded: 0,
      tierLabel: 'Pendiente de cierre',
      isDoubleBagel: false,
    };
  }

  const s1 = liveScore?.set1 || {};
  const s2 = liveScore?.set2 || {};
  const s3 = liveScore?.set3 || {};
  const wentTo3Sets = Boolean(
    ev.needsSuperTieBreak || (Number(s3.a) || 0) > 0 || (Number(s3.b) || 0) > 0
  );

  const gamesConceded =
    ev.winnerSide === 'A'
      ? (Number(s1.b) || 0) + (Number(s2.b) || 0)
      : (Number(s1.a) || 0) + (Number(s2.a) || 0);

  let standard = 4;
  let tierLabel = 'Victoria peleada (3 sets)';
  let isDoubleBagel = false;

  if (!wentTo3Sets) {
    if (gamesConceded === 0) {
      standard = 10;
      tierLabel = 'Dominio total 6-0, 6-0 (Máximo)';
      isDoubleBagel = true;
    } else if (gamesConceded <= 4) {
      standard = 8;
      tierLabel = 'Victoria contundente';
    } else if (gamesConceded <= 8) {
      standard = 6;
      tierLabel = 'Victoria sólida en 2 sets';
    } else {
      standard = 4;
      tierLabel = 'Victoria peleada en 2 sets';
    }
  }

  const vip = Math.round(standard * 2.5);
  return {
    standard,
    vip,
    awarded: isVip ? vip : standard,
    tierLabel,
    isDoubleBagel,
  };
}

/* ==========================================================================
   SUBCOMPONENTE 1: AVATAR CON ANILLO LIMPIO Y ESCUDO REAL DEL CLUB
   ========================================================================== */
export function PlayerAvatarWithClub({
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
      className="tt-rt-avatar-btn"
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
   SUBCOMPONENTE 2: TARJETA PÓSTER VS (PASO 8F: 24H DOBLE ACUERDO · ÁRBITRO · 6H)
   ========================================================================== */
export function MatchPosterCard({
  challenge,
  playerA,
  playerB,
  judgePlayer,
  clubs,
  allPlayers = [],
  currentUser,
  isAdmin,
  onOpenScoreModal,
  onAcceptChallenge,
  onDeclineChallenge,
  onOpenReschedule,
  onRespondReschedule,
  onOpenAssignJudge,
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
    ? {
        label: perms.judgeSubmitted ? 'EN REVISIÓN · ÁRBITRO' : 'POR CONFIRMAR',
        cls: 'is-pending',
      }
    : isDisputed
    ? { label: 'EN REVISIÓN', cls: 'is-disputed' }
    : isPending
    ? { label: 'PENDIENTE DE ACEPTAR', cls: 'is-pending' }
    : isFinished
    ? { label: 'TERMINADO', cls: 'is-finished' }
    : { label: 'PROGRAMADO', cls: 'is-scheduled' };

  const opponent = perms.isPlayerA ? playerB : playerA;
  const effectivePhone = getEffectiveContactPhone(opponent, allPlayers);
  const waText = opponent?.isTutelado
    ? `Hola ${opponent.tutorName || 'Padre/Madre'}, te escribo desde TOTAL TENIS por nuestro partido con ${opponent.name} en ${challenge.clubName} (${dateText} · ${timeText}).`
    : `Hola ${opponent?.name || ''}, te escribo desde TOTAL TENIS por nuestro partido en ${challenge.clubName} (${dateText} · ${timeText}).`;
  const whatsappUrl = effectivePhone ? buildWhatsappLink(effectivePhone, waText) : null;

  const canManage = perms.isParticipant || perms.isJudge || isAdmin;
  const pendingResched = perms.pendingReschedule;
  const showUploadCountdown =
    (isScheduled || isLive) &&
    !challenge.judgeId &&
    perms.hoursSinceStart > 0 &&
    perms.isUploadWindowOpen &&
    (perms.isParticipant || isAdmin);

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
          {playerA?.isTutelado && <span className="tt-tutela-mini-pill">Tutelada</span>}
          <div className="tt-match-player-meta">
            <span className="tt-cat-dot-inline" style={{ backgroundColor: catA.color }} />
            <span>{catA.name}</span>
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
            ringColor="#E5C16C"
            onClick={onOpenPlayerProfile}
          />
          <strong className="tt-match-player-name">{playerB?.name || 'Jugador B'}</strong>
          {playerB?.isTutelado && <span className="tt-tutela-mini-pill">Tutelada</span>}
          <div className="tt-match-player-meta">
            <span className="tt-cat-dot-inline" style={{ backgroundColor: catB.color }} />
            <span>{catB.name}</span>
            <span>·</span>
            <span>{Number(playerB?.points || 0).toLocaleString('es-PE')} pts</span>
          </div>
          {isFinished && challenge.winnerId === playerB?.id && (
            <span className="tt-winner-chip">GANADOR</span>
          )}
        </div>
      </div>

      {/* Propuesta de cambio de hora con doble acuerdo (solo participantes / admin) */}
      {isScheduled && perms.hasPendingReschedule && (perms.isParticipant || isAdmin) && (
        <div className="tt-resched-proposal-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.75rem' }}>
            <TTIcon name="clock" size={15} style={{ color: '#F6E2A8', flexShrink: 0 }} />
            <div>
              <strong>Propuesta de cambio de hora: </strong>
              <span>
                {pendingResched.dateLabel} · {pendingResched.timeLabel}
              </span>
            </div>
          </div>

          {perms.canRespondReschedule && onRespondReschedule ? (
            <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
              <button
                type="button"
                className="tt-btn tt-btn-primary tt-btn-sm tt-glass-press"
                style={{ flex: 1 }}
                onClick={() => {
                  triggerHaptic('success');
                  onRespondReschedule(challenge, true);
                }}
              >
                Aceptar nueva hora
              </button>
              <button
                type="button"
                className="tt-btn tt-btn-ghost tt-btn-sm tt-glass-press"
                onClick={() => {
                  triggerHaptic('warning');
                  onRespondReschedule(challenge, false);
                }}
              >
                Mantener actual
              </button>
            </div>
          ) : (
            <small style={{ display: 'block', marginTop: 4, opacity: 0.82, fontSize: '0.7rem' }}>
              Esperando que tu rival acepte el cambio de horario.
            </small>
          )}
        </div>
      )}

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
              {isProposed && perms.judgeSubmitted
                ? `Revisión: ${perms.confirmations.a ? '✓' : '⏳'} ${
                    playerA?.name?.split(' ')[0] || 'A'
                  } · ${perms.confirmations.b ? '✓' : '⏳'} ${
                    playerB?.name?.split(' ')[0] || 'B'
                  }`
                : judgePlayer
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

      {/* Sede + Acuerdo de pelotas + Árbitro designado / Plazo 6h */}
      <div className="tt-match-venue-bar">
        <div className="tt-match-venue-item">
          <TTIcon name="mapPin" size={15} style={{ color: '#00DC7D' }} />
          <span>{challenge.clubName || 'Sede por definir'}</span>
        </div>
        {challenge.ballsAgreement && (
          <div className="tt-match-venue-item is-subtle">
            <TTIcon name="ball" size={14} style={{ color: '#E5C16C' }} />
            <span>{challenge.ballsAgreement}</span>
          </div>
        )}
        {judgePlayer && !isFinished && (
          <div className="tt-match-venue-item is-subtle" style={{ color: '#7CF5C0' }}>
            <TTIcon name="shield" size={14} style={{ color: '#00DC7D' }} />
            <span>Árbitro designado: {judgePlayer.name}</span>
          </div>
        )}
        {showUploadCountdown && (
          <div className="tt-match-venue-item is-subtle" style={{ color: '#F6E2A8' }}>
            <TTIcon name="clock" size={14} style={{ color: '#E5C16C' }} />
            <span>
              Plazo para subir resultado sin árbitro: quedan {perms.uploadHoursLeft} h (si vence se
              anula sin penalidad)
            </span>
          </div>
        )}
      </div>

      {/* Acciones por Rol (Reglas Estrictas Paso 8F) */}
      <div className="tt-match-actions">
        {isPending && perms.isPlayerB && (
          <>
            <button
              type="button"
              className="tt-btn tt-btn-primary tt-btn-sm tt-glass-press"
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
              className="tt-btn tt-btn-ghost tt-btn-sm tt-glass-press"
              onClick={() => {
                triggerHaptic('warning');
                onDeclineChallenge(challenge);
              }}
            >
              Declinar
            </button>
          </>
        )}

        {isPending && perms.isPlayerA && (
          <div className="tt-waiting-banner">
            <TTIcon name="clock" size={15} />
            <span>
              Esperando confirmación de{' '}
              {playerB?.isTutelado ? `tutor de ${playerB.name}` : playerB?.name || 'tu rival'}
            </span>
          </div>
        )}

        {isScheduled && perms.isJudge && (
          <button
            type="button"
            className="tt-btn tt-btn-primary tt-btn-sm tt-glass-press"
            style={{ flex: 1 }}
            onClick={() => {
              triggerHaptic('medium');
              onOpenScoreModal(challenge, 'live');
            }}
          >
            <TTIcon name="scoreboard" size={16} />
            Abrir Modo Árbitro (En Vivo)
          </button>
        )}

        {isScheduled && (perms.isParticipant || isAdmin) && !perms.isJudge && (
          <>
            {challenge.judgeId && !isAdmin ? (
              <button
                type="button"
                className="tt-btn tt-btn-secondary tt-btn-sm tt-glass-press"
                style={{ flex: 1 }}
                onClick={() => {
                  triggerHaptic('light');
                  onOpenScoreModal(challenge, 'live');
                }}
              >
                <TTIcon name="vision" size={15} />
                Ver Marcador (Árbitro)
              </button>
            ) : (
              <button
                type="button"
                className="tt-btn tt-btn-primary tt-btn-sm tt-glass-press"
                style={{ flex: 1 }}
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenScoreModal(challenge, 'direct');
                }}
              >
                <TTIcon name="scoreboard" size={16} />
                Subir Resultado
              </button>
            )}

            {/* >= 24h antes: Cambiar hora (doble acuerdo) */}
            {perms.canProposeReschedule && (
              <button
                type="button"
                className="tt-btn tt-btn-secondary tt-btn-sm tt-glass-press"
                onClick={() => {
                  triggerHaptic('light');
                  onOpenReschedule(challenge);
                }}
              >
                <TTIcon name="clock" size={15} />
                Cambiar hora
              </button>
            )}

            {/* 24h a 1 min antes: Designar Árbitro (SOLO visible a los 2 jugadores / admin) */}
            {perms.canAssignJudge && onOpenAssignJudge && (
              <button
                type="button"
                className="tt-btn tt-btn-secondary tt-btn-sm tt-glass-press"
                onClick={() => {
                  triggerHaptic('light');
                  onOpenAssignJudge(challenge);
                }}
              >
                <TTIcon name="shield" size={15} />
                {challenge.judgeId ? 'Cambiar Árbitro' : 'Designar Árbitro'}
              </button>
            )}
          </>
        )}

        {isLive && (
          <button
            type="button"
            className={`tt-btn ${
              perms.canEditScore ? 'tt-btn-primary' : 'tt-btn-secondary'
            } tt-btn-sm tt-glass-press`}
            style={{ flex: 1 }}
            onClick={() => {
              triggerHaptic('light');
              onOpenScoreModal(challenge, perms.isJudge || challenge.judgeId ? 'live' : 'direct');
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

        {isProposed && perms.isParticipant && (
          <div className="tt-waiting-banner">
            <TTIcon name="clock" size={15} />
            <span>
              {perms.judgeSubmitted
                ? perms.needsMyScoreConfirmation
                  ? 'El Árbitro cerró el marcador · Confirma o impugna en el aviso'
                  : 'Ya confirmaste · Esperando confirmación de tu rival'
                : challenge.proposedBy === currentUser?.id
                ? 'Resultado enviado · Esperando confirmación del rival'
                : 'Tu rival subió el marcador · Revisa la ventana de confirmación'}
            </span>
          </div>
        )}

        {isFinished && (perms.isParticipant || isAdmin) && onOpenStories && (
          <button
            type="button"
            className="tt-btn tt-btn-secondary tt-btn-sm tt-glass-press"
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

        {!canManage && (isScheduled || isPending) && (
          <div className="tt-spectator-pill">
            <TTIcon name="vision" size={14} />
            <span>Modo espectador · Solo lectura</span>
          </div>
        )}

        {!isFinished &&
          perms.isParticipant &&
          whatsappUrl &&
          (!opponent?.hideWhatsapp || opponent?.isTutelado) && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tt-icon-action-btn is-wa tt-glass-press"
              title={opponent?.isTutelado ? 'WhatsApp Padre/Madre Tutor' : 'WhatsApp'}
              aria-label={
                opponent?.isTutelado
                  ? `Coordinar por WhatsApp con el tutor de ${opponent.name}`
                  : `Coordinar por WhatsApp con ${opponent?.name}`
              }
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
   MODAL 3: PROPONER CAMBIO DE HORA (SOLO HASTA 24H ANTES · DOBLE ACUERDO)
   ========================================================================== */
export function RetosRescheduleModal({
  rescheduleTarget,
  currentUser,
  isAdmin,
  reschedDate,
  setReschedDate,
  reschedTime,
  setReschedTime,
  onConfirm,
  onClose,
}) {
  return (
    <ModalPortal
      isOpen={Boolean(rescheduleTarget)}
      onClose={onClose}
      title="Proponer Cambio de Horario"
      subtitle={rescheduleTarget?.clubName || ''}
      icon={<IconBadge name="clock" variant="gold" size={38} />}
    >
      {rescheduleTarget && (
        <form onSubmit={onConfirm} className="tt-form-stack">
          {(() => {
            const p = getMatchPermissions(rescheduleTarget, currentUser, isAdmin);
            const allowed = p.rescheduleMode === 'ORDINARY_ALLOWED';
            return (
              <>
                <div className={`tt-rule-callout ${allowed ? 'is-ok' : 'is-warn'}`}>
                  <TTIcon name={allowed ? 'check' : 'alert'} size={18} />
                  <div>
                    <strong>
                      {allowed
                        ? 'Cambio de horario por doble acuerdo (1 por partido)'
                        : 'Ventana de cambio de hora cerrada (< 24 h)'}
                    </strong>
                    <p style={{ margin: '3px 0 0', fontSize: '0.77rem', opacity: 0.88 }}>
                      {allowed
                        ? `Faltan ${p.hoursUntilMatch} h para el partido. Tu propuesta se enviará a tu rival y solo se aplicará cuando ambos estén de acuerdo.`
                        : 'Faltan menos de 24 horas para el encuentro. Si no logran jugarlo, a las 6 horas de la hora pactada se anula automáticamente sin penalidad.'}
                    </p>
                  </div>
                </div>

                {allowed && (
                  <>
                    <div className="tt-date-time-grid">
                      <div className="tt-field-group">
                        <label className="tt-field-label" htmlFor="tt-resched-date">
                          Nueva fecha propuesta
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
                          Nueva hora propuesta
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

                    <button
                      type="submit"
                      className="tt-btn tt-btn-primary tt-glass-press"
                      style={{ width: '100%' }}
                    >
                      Enviar Propuesta a mi Rival
                    </button>
                  </>
                )}
              </>
            );
          })()}
        </form>
      )}
    </ModalPortal>
  );
}

/* ==========================================================================
   MODAL 3B (PASO 8F): DESIGNAR ÁRBITRO (SOLO 24H A 1 MIN ANTES · 2 JUGADORES)
   ========================================================================== */
export function RetosAssignJudgeModal({
  challenge,
  players = [],
  onSelectJudge,
  onClose,
}) {
  const candidates = (players || []).filter(
    (p) =>
      !p.isPaused &&
      !p.isTutorOnly &&
      p.id !== challenge?.playerAId &&
      p.id !== challenge?.playerBId
  );

  return (
    <ModalPortal
      isOpen={Boolean(challenge)}
      onClose={onClose}
      title="Designar Árbitro en Cancha"
      subtitle="Ventana 24 h antes del partido · Modo Árbitro exclusivo"
      icon={<IconBadge name="shield" variant="emerald" size={38} />}
    >
      {challenge && (
        <div className="tt-form-stack">
          <div className="tt-rule-callout is-ok">
            <TTIcon name="shield" size={18} />
            <div>
              <strong>¿Cómo funciona el Modo Árbitro?</strong>
              <p style={{ margin: '3px 0 0', fontSize: '0.76rem', opacity: 0.9 }}>
                El tercero designado llevará el marcador game a game en vivo desde su celular. Al
                terminar, el resultado pasará a <b>EN REVISIÓN</b> para que ambos jugadores lo
                confirmen.
              </p>
            </div>
          </div>

          <div className="tt-field-group">
            <label className="tt-field-label" htmlFor="tt-assign-judge-sel">
              Selecciona al Árbitro del partido
            </label>
            <select
              id="tt-assign-judge-sel"
              className="tt-input"
              value={challenge.judgeId || ''}
              onChange={(e) => {
                const picked = e.target.value;
                triggerHaptic('success');
                if (onSelectJudge) onSelectJudge(challenge.id, picked || null);
                onClose();
              }}
            >
              <option value="">Sin árbitro externo (los jugadores suben marcador en 6h)</option>
              {candidates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({getCategoryByPoints(p.points).name})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="tt-btn tt-btn-ghost tt-glass-press"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      )}
    </ModalPortal>
  );
}

/* ==========================================================================
   MODAL 4 EXTRAÍDO: CELEBRACIÓN POST-PARTIDO + GEMAS GANADAS + STORIES
   ========================================================================== */
export function RetosCelebrationModal({
  celebrationPayload,
  onOpenStoriesWithMatch,
  onClose,
}) {
  return (
    <ModalPortal
      isOpen={Boolean(celebrationPayload)}
      onClose={onClose}
      title={celebrationPayload?.promoted ? '¡Ascenso de Categoría!' : '¡Resultado Confirmado!'}
      subtitle="TOTAL TENIS · Circuito Oficial"
      icon={<IconBadge name="trophy" variant="gold" size={38} />}
      isTopLayer
    >
      {celebrationPayload && (
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
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

          {celebrationPayload.isOfficial && celebrationPayload.victoryGems?.awarded > 0 && (
            <div
              className="tt-gems-preview-pill"
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <span>
                Bono por victoria ({celebrationPayload.victoryGems.tierLabel})
              </span>
              <strong>+{celebrationPayload.victoryGems.awarded} 💎</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            {onOpenStoriesWithMatch && (
              <button
                type="button"
                className="tt-btn tt-btn-primary tt-glass-press"
                style={{ flex: 1 }}
                onClick={() => {
                  const payload = {
                    challenge: celebrationPayload.challenge,
                    playerA: celebrationPayload.playerA,
                    playerB: celebrationPayload.playerB,
                  };
                  onClose();
                  onOpenStoriesWithMatch(payload);
                }}
              >
                <TTIcon name="stories" size={17} />
                Publicar en Stories
              </button>
            )}
            <button
              type="button"
              className="tt-btn tt-btn-secondary tt-glass-press"
              onClick={onClose}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </ModalPortal>
  );
}
