import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  EmptyStateCard,
  IconBadge,
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
  ANNUAL_MASTER_TOP8_REWARDS,
  SEASON_QUARTERLY_REWARDS,
} from '../data/storeAndTournamentsData';
import * as TenisEngine from '../utils/tenisEngine';

const { ELO_CONFIG, computeMasterTop8Race } = TenisEngine;

/* Helpers compatibles con tenisEngine.js (regla estricta >= 5 partidos oficiales) */
function getOfficialMatchesPlayed(player) {
  if (typeof TenisEngine.getPlayerOfficialMatches === 'function') {
    return TenisEngine.getPlayerOfficialMatches(player);
  }
  if (!player) return 0;
  const fromRecord = (Number(player.wins) || 0) + (Number(player.losses) || 0);
  const fromCalib = Number(player.calibrationPlayed) || 0;
  return Math.max(fromRecord, fromCalib);
}

function isPlayerOfficiallyRanked(player) {
  if (typeof TenisEngine.isOfficiallyRankedPlayer === 'function') {
    return TenisEngine.isOfficiallyRankedPlayer(player);
  }
  if (!player || player.isPaused || player.isTutorOnly) return false;
  return getOfficialMatchesPlayed(player) >= (ELO_CONFIG?.CALIBRATION_MATCHES || 5);
}

/* ==========================================================================
   PALETAS EDITORIALES SOBRIAS POR DIVISIÓN (MODO OSCURO Y MODO CLARO)
   ========================================================================== */
const DIVISION_FILTERS = [
  {
    id: 'ALL',
    label: 'General',
    shortTag: 'CLASIFICACIÓN GENERAL',
    accentDark: '#00DC7D',
    accentLight: '#007A44',
    accentOnFill: '#10021E',
    pillGradDark: 'linear-gradient(135deg, #00DC7D 0%, #00B365 100%)',
    pillGradLight: '#1E0734',
    pillTextLight: '#00DC7D',
    softBgDark: 'rgba(0, 220, 125, 0.12)',
    softBgLight: 'rgba(0, 122, 68, 0.09)',
    softBorderDark: 'rgba(0, 220, 125, 0.38)',
    softBorderLight: 'rgba(0, 122, 68, 0.28)',
    glow: 'rgba(0, 220, 125, 0.28)',
    frameBorder: 'rgba(0, 220, 125, 0.55)',
  },
  {
    id: 'Varones',
    label: 'Varones',
    shortTag: 'VARONES · ARCILLA',
    accentDark: '#DE8566',
    accentLight: '#A84826',
    accentOnFill: '#FFFFFF',
    pillGradDark: 'linear-gradient(135deg, #D97757 0%, #B44D2B 100%)',
    pillGradLight: '#A84826',
    pillTextLight: '#FFFFFF',
    softBgDark: 'rgba(217, 119, 87, 0.15)',
    softBgLight: 'rgba(168, 72, 38, 0.1)',
    softBorderDark: 'rgba(222, 133, 102, 0.44)',
    softBorderLight: 'rgba(168, 72, 38, 0.32)',
    glow: 'rgba(217, 119, 87, 0.3)',
    frameBorder: 'rgba(222, 133, 102, 0.62)',
  },
  {
    id: 'Damas',
    label: 'Damas',
    shortTag: 'DAMAS · CIRCUITO',
    accentDark: '#EA74AE',
    accentLight: '#B0256A',
    accentOnFill: '#FFFFFF',
    pillGradDark: 'linear-gradient(135deg, #DF5A9C 0%, #B0256A 100%)',
    pillGradLight: '#B0256A',
    pillTextLight: '#FFFFFF',
    softBgDark: 'rgba(234, 116, 174, 0.14)',
    softBgLight: 'rgba(176, 37, 106, 0.09)',
    softBorderDark: 'rgba(234, 116, 174, 0.44)',
    softBorderLight: 'rgba(176, 37, 106, 0.3)',
    glow: 'rgba(223, 90, 156, 0.28)',
    frameBorder: 'rgba(234, 116, 174, 0.6)',
  },
  {
    id: 'SENIOR_40',
    label: '+40 Senior',
    shortTag: '+40 SENIOR · MASTER',
    accentDark: '#E5C16C',
    accentLight: '#9A6B16',
    accentOnFill: '#1A1102',
    pillGradDark: 'linear-gradient(135deg, #F3DC9B 0%, #C69B3D 100%)',
    pillGradLight: '#8E6212',
    pillTextLight: '#FFFFFF',
    softBgDark: 'rgba(229, 193, 108, 0.14)',
    softBgLight: 'rgba(154, 107, 22, 0.1)',
    softBorderDark: 'rgba(229, 193, 108, 0.46)',
    softBorderLight: 'rgba(154, 107, 22, 0.34)',
    glow: 'rgba(229, 193, 108, 0.3)',
    frameBorder: 'rgba(229, 193, 108, 0.62)',
  },
];

/* Medallas metálicas sobrias (Champán, Plata cepillada, Bronce noble) */
const MEDAL_PALETTE = {
  1: {
    key: 'gold',
    label: '#1 LÍDER',
    primary: '#E5C16C',
    primaryLight: '#9A6B16',
    highlight: '#FAF0CA',
    deep: '#A67C23',
    ring: 'linear-gradient(135deg, #FAF0CA 0%, #E5C16C 48%, #9A6B16 100%)',
    glow: 'rgba(229, 193, 108, 0.34)',
  },
  2: {
    key: 'silver',
    label: '#2 PLATA',
    primary: '#CBD5E1',
    primaryLight: '#475569',
    highlight: '#F8FAFC',
    deep: '#64748B',
    ring: 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 52%, #64748B 100%)',
    glow: 'rgba(203, 213, 225, 0.26)',
  },
  3: {
    key: 'bronze',
    label: '#3 BRONCE',
    primary: '#D49A7A',
    primaryLight: '#9A4A28',
    highlight: '#F5D8C6',
    deep: '#8C4A2B',
    ring: 'linear-gradient(135deg, #F5D8C6 0%, #C6835E 52%, #7C3D21 100%)',
    glow: 'rgba(198, 131, 94, 0.26)',
  },
};

const RANK_MEMORY_KEY = 'tt_rk_seen_ranks_v2';

function readStoredRanks() {
  try {
    const raw = window.localStorage.getItem(RANK_MEMORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredRanks(map) {
  try {
    window.localStorage.setItem(RANK_MEMORY_KEY, JSON.stringify(map));
  } catch {
    // ignorar cuota
  }
}

/* ==========================================================================
   RELOJ SPLIT-FLAP DE CIERRE DE TEMPORADA (SOPORTA endDate PERSONALIZADO)
   ========================================================================== */
function getRealSeasonEndMs(seasonNumber, snapshotYear, customEndDate = null) {
  const now = Date.now();
  if (customEndDate) {
    const parsed = new Date(`${customEndDate}T23:59:59-05:00`).getTime();
    if (!Number.isNaN(parsed) && parsed > now) return parsed;
  }
  const y = Number(snapshotYear) || new Date().getFullYear();
  const map = {
    1: `${y}-03-31T23:59:59-05:00`,
    2: `${y}-06-30T23:59:59-05:00`,
    3: `${y}-09-30T23:59:59-05:00`,
    4: `${y}-12-31T23:59:59-05:00`,
  };
  let target = new Date(map[seasonNumber] || map[4]).getTime();
  if (Number.isNaN(target) || target <= now) {
    const d = new Date();
    const cy = d.getFullYear();
    const cq = Math.floor(d.getMonth() / 3) + 1;
    const fb = {
      1: `${cy}-03-31T23:59:59-05:00`,
      2: `${cy}-06-30T23:59:59-05:00`,
      3: `${cy}-09-30T23:59:59-05:00`,
      4: `${cy}-12-31T23:59:59-05:00`,
    };
    target = new Date(fb[cq]).getTime();
  }
  return target;
}

function getCountdownParts(targetMs) {
  const diff = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  return {
    days: String(Math.floor(diff / 86400)).padStart(2, '0'),
    hours: String(Math.floor((diff % 86400) / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((diff % 3600) / 60)).padStart(2, '0'),
    seconds: String(diff % 60).padStart(2, '0'),
  };
}

function MiniFlipUnit({ value, label }) {
  const prev = useRef(value);
  const [flipId, setFlipId] = useState(0);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlipId((n) => n + 1);
    }
  }, [value]);

  return (
    <div className="tt-rk-flip-unit">
      <div className="tt-rk-flip-card" key={flipId}>
        <span>{value}</span>
        <i aria-hidden="true" />
      </div>
      <small>{label}</small>
    </div>
  );
}

function MiniSeasonCountdown({ seasonNumber = 4, year = 2026, customEndDate = null }) {
  const targetMs = useMemo(
    () => getRealSeasonEndMs(seasonNumber, year, customEndDate),
    [seasonNumber, year, customEndDate]
  );
  const [parts, setParts] = useState(() => getCountdownParts(targetMs));

  useEffect(() => {
    setParts(getCountdownParts(targetMs));
    const id = window.setInterval(() => setParts(getCountdownParts(targetMs)), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  return (
    <div className="tt-rk-flip-bar">
      <div className="tt-rk-flip-title">
        <span className="tt-rk-flip-dot" />
        <strong>CIERRE T{seasonNumber}</strong>
      </div>
      <div className="tt-rk-flip-group">
        <MiniFlipUnit value={parts.days} label="DÍAS" />
        <em>:</em>
        <MiniFlipUnit value={parts.hours} label="HRS" />
        <em>:</em>
        <MiniFlipUnit value={parts.minutes} label="MIN" />
        <em>:</em>
        <MiniFlipUnit value={parts.seconds} label="SEG" />
      </div>
    </div>
  );
}

/* ==========================================================================
   CORONA DE LAURELES METÁLICOS (ESCALA PROGRESIVA PARA #1, #2 Y #3)
   ========================================================================== */
function LaurelWreathAvatar({ rank = 1, player, club, size = 64 }) {
  const medal = MEDAL_PALETTE[rank] || MEDAL_PALETTE[1];
  const outer = size + 22;
  const gradId = `tt-laurel-${medal.key}-${player?.id || rank}`;

  return (
    <div className="tt-laurel-wrap" style={{ width: outer, height: outer }}>
      <svg
        width={outer}
        height={outer}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        className="tt-laurel-svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={medal.highlight} />
            <stop offset="52%" stopColor={medal.primary} />
            <stop offset="100%" stopColor={medal.deep} />
          </linearGradient>
        </defs>

        <path
          d="M44 89C23 85 11 68 11 49C11 33 19 19 32 12"
          stroke={`url(#${gradId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse cx="14" cy="56" rx="5" ry="2.5" transform="rotate(-32 14 56)" fill={`url(#${gradId})`} />
        <ellipse cx="16" cy="42" rx="5" ry="2.4" transform="rotate(-12 16 42)" fill={`url(#${gradId})`} />
        <ellipse cx="22" cy="29" rx="4.7" ry="2.3" transform="rotate(14 22 29)" fill={`url(#${gradId})`} />
        <ellipse cx="30" cy="19" rx="4.2" ry="2.2" transform="rotate(36 30 19)" fill={`url(#${gradId})`} />
        <ellipse cx="18" cy="69" rx="5" ry="2.4" transform="rotate(-52 18 69)" fill={`url(#${gradId})`} />
        <ellipse cx="28" cy="80" rx="4.8" ry="2.4" transform="rotate(-68 28 80)" fill={`url(#${gradId})`} />
        <ellipse cx="39" cy="87" rx="4.4" ry="2.2" transform="rotate(-80 39 87)" fill={`url(#${gradId})`} />

        <path
          d="M56 89C77 85 89 68 89 49C89 33 81 19 68 12"
          stroke={`url(#${gradId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse cx="86" cy="56" rx="5" ry="2.5" transform="rotate(32 86 56)" fill={`url(#${gradId})`} />
        <ellipse cx="84" cy="42" rx="5" ry="2.4" transform="rotate(12 84 42)" fill={`url(#${gradId})`} />
        <ellipse cx="78" cy="29" rx="4.7" ry="2.3" transform="rotate(-14 78 29)" fill={`url(#${gradId})`} />
        <ellipse cx="70" cy="19" rx="4.2" ry="2.2" transform="rotate(-36 70 19)" fill={`url(#${gradId})`} />
        <ellipse cx="82" cy="69" rx="5" ry="2.4" transform="rotate(52 82 69)" fill={`url(#${gradId})`} />
        <ellipse cx="72" cy="80" rx="4.8" ry="2.4" transform="rotate(68 72 80)" fill={`url(#${gradId})`} />
        <ellipse cx="61" cy="87" rx="4.4" ry="2.2" transform="rotate(80 61 87)" fill={`url(#${gradId})`} />

        {rank === 1 && (
          <path
            d="M50 4L52.4 9.2L58 9.9L53.8 13.6L54.9 19L50 16.2L45.1 19L46.2 13.6L42 9.9L47.6 9.2L50 4Z"
            fill={`url(#${gradId})`}
          />
        )}
      </svg>

      <div
        className="tt-laurel-ring"
        style={{
          width: size,
          height: size,
          background: medal.ring,
          boxShadow: `0 6px 18px ${medal.glow}`,
        }}
      >
        <SmartImage
          src={player?.avatar}
          alt={player?.name || 'Jugador'}
          initials={player?.name || 'TT'}
          priority={rank <= 3}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
      </div>

      {club?.logo && (
        <span className="tt-laurel-club-dot">
          <SmartImage
            src={club.logo}
            alt={club.shortName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </span>
      )}

      <span
        className="tt-laurel-rank-pill"
        style={{
          background: medal.ring,
          color: rank === 2 ? '#0F172A' : '#1E0734',
        }}
      >
        #{rank}
      </span>
    </div>
  );
}

/* ==========================================================================
   TOP 3 HORIZONTAL ESCALONADO (#1 GRANDE → #2 MEDIANO → #3 INTERMEDIO)
   Solo jugadores con >= 5 partidos oficiales jugados.
   ========================================================================== */
function TopThreeHorizontalRow({
  player,
  rank,
  club,
  isCurrentUser,
  isLight,
  moveHighlight = null,
  registerRowRef,
  onOpenProfile,
  onQuickChallenge,
  onOpenHeadToHead,
}) {
  const medal = MEDAL_PALETTE[rank] || MEDAL_PALETTE[1];
  const cat = getCategoryByPoints(player.points);
  const wins = Number(player.wins) || 0;
  const losses = Number(player.losses) || 0;
  const played = wins + losses;
  const eff = played > 0 ? Math.round((wins / played) * 100) : 0;
  const streak = Number(player.streak) || 0;
  const hasQuorum = getOfficialMatchesPlayed(player) >= ELO_CONFIG.MIN_MATCHES_SEASON_TROPHY;

  const avatarSize = rank === 1 ? 64 : rank === 2 ? 54 : 48;
  const moveCls =
    moveHighlight?.dir === 'up'
      ? 'is-rank-climb'
      : moveHighlight?.dir === 'down'
      ? 'is-rank-drop'
      : '';

  return (
    <article
      ref={(el) => registerRowRef(player.id, el)}
      id={isCurrentUser ? 'tt-my-ranking-row' : undefined}
      role="button"
      tabIndex={0}
      className={`tt-top3-hcard is-tier-${rank} ${isCurrentUser ? 'is-me-halo' : ''} ${moveCls}`}
      style={{
        '--medal-color': isLight ? medal.primaryLight : medal.primary,
        '--medal-glow': medal.glow,
        borderColor: `${medal.primary}${rank === 1 ? '92' : '64'}`,
      }}
      onClick={() => {
        triggerHaptic('light');
        if (onOpenProfile) onOpenProfile(player);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onOpenProfile) onOpenProfile(player);
        }
      }}
    >
      {rank === 1 && <span className="tt-top3-sheen" aria-hidden="true" />}

      <div className="tt-top3-left">
        <LaurelWreathAvatar rank={rank} player={player} club={club} size={avatarSize} />
      </div>

      <div className="tt-top3-mid">
        <div className="tt-top3-badge-line">
          <span className="tt-top3-tier-pill">{medal.label}</span>
          {moveHighlight && (
            <span className={`tt-rk-move-pill ${moveHighlight.dir === 'up' ? 'is-up' : 'is-down'}`}>
              {moveHighlight.dir === 'up' ? `▲ +${moveHighlight.delta}` : `▼ -${moveHighlight.delta}`}
            </span>
          )}
          {player.isVip && <span className="tt-vip-subtle-tag">VIP</span>}
          {player.isTutelado && <span className="tt-tutela-mini">Tutelada</span>}
          {isCurrentUser && <span className="tt-me-micro-pill">TÚ</span>}
        </div>

        <strong className="tt-top3-name">{player.name}</strong>

        <div className="tt-top3-sub">
          <span className="tt-rk-cat-pill">
            <i className="tt-rk-cat-dot" style={{ backgroundColor: cat.color }} />
            {cat.name}
          </span>
          <span className="tt-rk-club-chip">{club ? club.shortName : 'Independiente'}</span>
        </div>

        <div className="tt-top3-meta">
          <span>{played > 0 ? `${wins}V–${losses}D · ${eff}%` : 'Oficial'}</span>
          <span>·</span>
          <span className={hasQuorum ? 'is-quorum-ok' : ''}>
            {hasQuorum ? 'Apto premio' : `${getOfficialMatchesPlayed(player)}/${ELO_CONFIG.MIN_MATCHES_SEASON_TROPHY} PJ`}
          </span>
          {wins > 0 && streak >= 2 && <span className="tt-streak-clean">+{streak}</span>}
        </div>
      </div>

      <div className="tt-top3-right">
        <div className="tt-top3-pts-box">
          <strong>{Number(player.points || 0).toLocaleString('es-PE')}</strong>
          <span>PTS</span>
        </div>

        {!isCurrentUser && (
          <div className="tt-top3-actions">
            {onQuickChallenge && (
              <button
                type="button"
                className="tt-top3-reto-btn tt-rk-press"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onQuickChallenge(player);
                }}
              >
                Retar
              </button>
            )}
            {onOpenHeadToHead && (
              <button
                type="button"
                className="tt-rk-h2h-mini tt-rk-press"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  onOpenHeadToHead(player);
                }}
              >
                H2H
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ==========================================================================
   FILA ESTÁNDAR OFICIAL (#4 EN ADELANTE) CON RETRATO VERTICAL + FLIP APPLE
   ========================================================================== */
function RankingPlayerRow({
  player,
  rank,
  club,
  isCurrentUser,
  showLaurelMini = false,
  divisionTheme,
  moveHighlight = null,
  registerRowRef,
  onOpenProfile,
  onQuickChallenge,
  onOpenHeadToHead,
}) {
  const cat = getCategoryByPoints(player.points);
  const wins = Number(player.wins) || 0;
  const losses = Number(player.losses) || 0;
  const played = wins + losses;
  const streak = Number(player.streak) || 0;
  const eff = played > 0 ? Math.round((wins / played) * 100) : null;
  const trend = Number(player.rankTrend || 0);
  const medal = showLaurelMini && rank <= 3 ? MEDAL_PALETTE[rank] : null;

  const moveCls =
    moveHighlight?.dir === 'up'
      ? 'is-rank-climb'
      : moveHighlight?.dir === 'down'
      ? 'is-rank-drop'
      : '';

  return (
    <div
      ref={(el) => registerRowRef(player.id, el)}
      id={isCurrentUser ? 'tt-my-ranking-row' : undefined}
      role="button"
      tabIndex={0}
      className={`tt-rk-row ${isCurrentUser ? 'is-me-halo' : ''} ${moveCls}`}
      onClick={() => {
        triggerHaptic('light');
        if (onOpenProfile) onOpenProfile(player);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onOpenProfile) onOpenProfile(player);
        }
      }}
    >
      <div className="tt-rk-rank-col">
        <span className="tt-rk-rank-num" style={medal ? { color: medal.primary } : undefined}>
          {rank}
        </span>

        {moveHighlight ? (
          <span className={`tt-rk-move-pill ${moveHighlight.dir === 'up' ? 'is-up' : 'is-down'}`}>
            {moveHighlight.dir === 'up' ? `▲ +${moveHighlight.delta}` : `▼ -${moveHighlight.delta}`}
          </span>
        ) : (
          <span
            className={`tt-rk-trend ${trend > 0 ? 'is-up' : trend < 0 ? 'is-down' : 'is-flat'}`}
          >
            {trend > 0 ? `▲ ${trend}` : trend < 0 ? `▼ ${Math.abs(trend)}` : '—'}
          </span>
        )}
      </div>

      <div className="tt-rk-portrait-wrap">
        <div
          className="tt-rk-portrait-frame"
          style={{ borderColor: medal ? medal.primary : divisionTheme.frameBorder }}
        >
          <SmartImage
            src={player.fullBodyPhoto || player.avatar}
            alt={player.name}
            initials={player.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        </div>

        {!isCurrentUser && onQuickChallenge && (
          <button
            type="button"
            className="tt-rk-quick-reto tt-rk-press"
            aria-label={`Desafiar a ${player.name}`}
            title={`Desafiar a ${player.name}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              onQuickChallenge(player);
            }}
          >
            <TTIcon name="challenge" size={12} />
          </button>
        )}
      </div>

      <div className="tt-rk-info-col">
        <div className="tt-rk-name-line">
          <strong className="tt-rk-name">{player.name}</strong>
          {player.isVip && <span className="tt-vip-subtle-tag">VIP</span>}
          {player.isTutelado && <span className="tt-tutela-mini">Tutelada</span>}
          {isCurrentUser && <span className="tt-me-micro-pill">TÚ</span>}
        </div>

        <div className="tt-rk-sub-line">
          <span className="tt-rk-cat-pill">
            <i className="tt-rk-cat-dot" style={{ backgroundColor: cat.color }} />
            {cat.name}
          </span>

          {club?.logo ? (
            <span className="tt-rk-club-chip">
              <SmartImage
                src={club.logo}
                alt={club.shortName}
                style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span>{club.shortName}</span>
            </span>
          ) : (
            <span className="tt-rk-club-chip">Independiente</span>
          )}
        </div>

        <div className="tt-rk-metrics-line">
          <span className="tt-eff-label">
            {eff !== null ? `${wins}V – ${losses}D · ${eff}%` : `${getOfficialMatchesPlayed(player)} PJ oficiales`}
          </span>

          {wins > 0 && streak >= 2 && <span className="tt-streak-clean">Racha +{streak}</span>}
        </div>
      </div>

      <div className="tt-rk-points-col">
        <strong className="tt-rk-points-val">
          {Number(player.points || 0).toLocaleString('es-PE')}
        </strong>
        <span className="tt-rk-points-unit">PTS</span>

        {!isCurrentUser && onOpenHeadToHead && (
          <button
            type="button"
            className="tt-rk-h2h-mini tt-rk-press"
            aria-label={`Comparar cara a cara contra ${player.name}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onOpenHeadToHead(player);
            }}
          >
            H2H
          </button>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   FILA DE JUGADOR EN CALIBRACIÓN (< 5 PJ · SIN NÚMERO DE PUESTO NI #1)
   Muestra etiqueta notoria PROVISIONAL · X/5 PJ + ELO Provisional + Retar
   ========================================================================== */
function CalibratingPlayerRow({
  player,
  club,
  isCurrentUser,
  onOpenProfile,
  onQuickChallenge,
  onOpenHeadToHead,
}) {
  const cat = getCategoryByPoints(player.points);
  const required = ELO_CONFIG.CALIBRATION_MATCHES || 5;
  const played = Math.min(required, getOfficialMatchesPlayed(player));
  const remaining = Math.max(1, required - played);
  const progressPct = Math.round((played / required) * 100);
  const wins = Number(player.wins) || 0;
  const losses = Number(player.losses) || 0;

  return (
    <div
      id={isCurrentUser ? 'tt-my-calib-row' : undefined}
      role="button"
      tabIndex={0}
      className={`tt-rk-row is-calib-row ${isCurrentUser ? 'is-me-halo' : ''}`}
      onClick={() => {
        triggerHaptic('light');
        if (onOpenProfile) onOpenProfile(player);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onOpenProfile) onOpenProfile(player);
        }
      }}
    >
      {/* SIN NÚMERO DE PUESTO (#1): insignia clara PROV. + X/5 */}
      <div className="tt-calib-status-col">
        <span className="tt-calib-badge-main">PROV.</span>
        <strong className="tt-calib-ratio">
          {played}/{required}
        </strong>
      </div>

      <div className="tt-rk-portrait-wrap">
        <div className="tt-rk-portrait-frame is-calib-frame">
          <SmartImage
            src={player.fullBodyPhoto || player.avatar}
            alt={player.name}
            initials={player.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        </div>
      </div>

      <div className="tt-rk-info-col">
        <div className="tt-rk-name-line">
          <strong className="tt-rk-name">{player.name}</strong>
          {player.isVip && <span className="tt-vip-subtle-tag">VIP</span>}
          {player.isTutelado && <span className="tt-tutela-mini">Tutelada</span>}
          {isCurrentUser && <span className="tt-me-micro-pill">TÚ</span>}
        </div>

        <div className="tt-rk-sub-line">
          <span className="tt-rk-cat-pill">
            <i className="tt-rk-cat-dot" style={{ backgroundColor: cat.color }} />
            Ref. {cat.name}
          </span>
          <span className="tt-rk-club-chip">{club ? club.shortName : 'Independiente'}</span>
        </div>

        <div className="tt-calib-progress-wrap">
          <div className="tt-calib-progress-bar">
            <span style={{ width: `${Math.max(8, progressPct)}%` }} />
          </div>
          <small className="tt-calib-progress-txt">
            {played > 0 ? `${wins}V–${losses}D · ` : ''}
            Faltan {remaining} {remaining === 1 ? 'partido' : 'partidos'} para Oficial
          </small>
        </div>
      </div>

      <div className="tt-rk-points-col">
        <strong className="tt-rk-points-val is-prov-pts">
          {Number(player.points || 0).toLocaleString('es-PE')}
        </strong>
        <span className="tt-rk-points-unit is-prov-unit">ELO PROV.</span>

        {!isCurrentUser && (
          <div className="tt-calib-row-btns">
            {onQuickChallenge && (
              <button
                type="button"
                className="tt-top3-reto-btn tt-rk-press"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onQuickChallenge(player);
                }}
              >
                Retar
              </button>
            )}
            {onOpenHeadToHead && (
              <button
                type="button"
                className="tt-rk-h2h-mini tt-rk-press"
                aria-label={`Comparar cara a cara contra ${player.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  onOpenHeadToHead(player);
                }}
              >
                H2H
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTA PRINCIPAL: RankingView
   (RANKING OFICIAL >= 5 PJ | CALIBRÁNDOSE < 5 PJ SIN #1 | TEMPORADAS | CLUBES)
   ========================================================================== */
export default function RankingView({
  players = [],
  clubs = INITIAL_CLUBS,
  seasonSnapshots = null,
  currentUser = null,
  theme = 'dark',
  onOpenPlayerProfile,
  onOpenHeadToHead,
  onQuickChallenge,
  onGoToTournaments,
}) {
  const [activeSubTab, setActiveSubTab] = useState('oficial'); // 'oficial' | 'calibrando' | 'temporadas' | 'clubes'
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRewardsGuide, setShowRewardsGuide] = useState(false);
  const [expandedSeasonIds, setExpandedSeasonIds] = useState({});

  const rowRefs = useRef(new Map());
  const prevRectsRef = useRef(new Map());
  const settleTimerRef = useRef(null);
  const stageTimerRef = useRef(null);
  const lastLiveRanksRef = useRef(null);

  const [stagedOldOrderIds, setStagedOldOrderIds] = useState(null);
  const [activeMoves, setActiveMoves] = useState({});

  const registerRowRef = (playerId, el) => {
    if (el) rowRefs.current.set(playerId, el);
    else rowRefs.current.delete(playerId);
  };

  const captureRowRects = () => {
    const rects = new Map();
    rowRefs.current.forEach((node, id) => {
      if (node && typeof node.getBoundingClientRect === 'function') {
        rects.set(id, node.getBoundingClientRect().top);
      }
    });
    prevRectsRef.current = rects;
  };

  const divisionTheme = useMemo(
    () => DIVISION_FILTERS.find((d) => d.id === divisionFilter) || DIVISION_FILTERS[0],
    [divisionFilter]
  );

  const safeSnapshots = useMemo(() => {
    if (seasonSnapshots?.seasons?.length) return seasonSnapshots;
    return {
      year: new Date().getFullYear(),
      currentSeason: 4,
      seasons: [
        { number: 1, label: 'T1', period: 'Ene – Mar', locked: true, scores: {} },
        { number: 2, label: 'T2', period: 'Abr – Jun', locked: true, scores: {} },
        { number: 3, label: 'T3', period: 'Jul – Sep', locked: true, scores: {} },
        { number: 4, label: 'T4', period: 'Oct – Dic', locked: false, scores: {} },
      ],
    };
  }, [seasonSnapshots]);

  const currentSeasonObj = useMemo(
    () =>
      safeSnapshots.seasons.find((s) => s.number === safeSnapshots.currentSeason) ||
      safeSnapshots.seasons[safeSnapshots.seasons.length - 1],
    [safeSnapshots]
  );

  const matchesCommonFilters = (p, q) => {
    if (p.isPaused || p.isTutorOnly) return false;
    if (divisionFilter === 'Varones' && p.division !== 'Varones') return false;
    if (divisionFilter === 'Damas' && p.division !== 'Damas') return false;
    if (divisionFilter === 'SENIOR_40' && (Number(p.age) || 0) < 40) return false;

    if (categoryFilter !== 'ALL' && divisionFilter !== 'SENIOR_40') {
      if (getCategoryByPoints(p.points).id !== categoryFilter) return false;
    }

    if (q) {
      const hay = `${p.name || ''} ${p.clubName || ''} ${p.credentialId || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  /* 1. RANKING OFICIAL: ESTRICTAMENTE >= 5 PARTIDOS OFICIALES JUGADOS */
  const rankedPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...(players || [])]
      .filter((p) => isPlayerOfficiallyRanked(p) && matchesCommonFilters(p, q))
      .sort((a, b) => {
        const diffPts = (Number(b.points) || 0) - (Number(a.points) || 0);
        if (diffPts !== 0) return diffPts;
        return (Number(b.wins) || 0) - (Number(a.wins) || 0);
      });
  }, [players, divisionFilter, categoryFilter, searchQuery]);

  /* 2. CALIBRÁNDOSE (PROVISIONAL): < 5 PARTIDOS OFICIALES · SIN PUESTO # */
  const calibratingPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...(players || [])]
      .filter((p) => !isPlayerOfficiallyRanked(p) && matchesCommonFilters(p, q))
      .sort((a, b) => {
        const diffMatches = getOfficialMatchesPlayed(b) - getOfficialMatchesPlayed(a);
        if (diffMatches !== 0) return diffMatches;
        return (Number(b.points) || 0) - (Number(a.points) || 0);
      });
  }, [players, divisionFilter, categoryFilter, searchQuery]);

  const totalCalibratingCount = useMemo(
    () => (players || []).filter((p) => !p.isPaused && !p.isTutorOnly && !isPlayerOfficiallyRanked(p)).length,
    [players]
  );

  const currentUserIsCalibrating = useMemo(
    () => Boolean(currentUser && !currentUser.isTutorOnly && !isPlayerOfficiallyRanked(currentUser)),
    [currentUser]
  );

  const currentOrderSignature = useMemo(
    () => rankedPlayers.map((p) => p.id).join(','),
    [rankedPlayers]
  );

  useEffect(() => {
    if (activeSubTab !== 'oficial' || searchQuery.trim().length > 0 || rankedPlayers.length < 2) {
      return undefined;
    }

    const filterKey = `${divisionFilter}|${categoryFilter}`;
    const currentRankMap = {};
    rankedPlayers.forEach((p, idx) => {
      currentRankMap[p.id] = idx + 1;
    });

    if (!lastLiveRanksRef.current || lastLiveRanksRef.current.filterKey !== filterKey) {
      const storedAll = readStoredRanks();
      const prevMap = storedAll[filterKey];

      lastLiveRanksRef.current = { filterKey, rankMap: currentRankMap };
      writeStoredRanks({ ...storedAll, [filterKey]: currentRankMap });

      if (prevMap && Object.keys(prevMap).length >= 2) {
        const detectedMoves = {};
        rankedPlayers.forEach((p, idx) => {
          const newRank = idx + 1;
          const oldRank = prevMap[p.id];
          if (oldRank && oldRank !== newRank) {
            detectedMoves[p.id] = {
              dir: newRank < oldRank ? 'up' : 'down',
              delta: Math.abs(oldRank - newRank),
              oldRank,
              newRank,
            };
          }
        });

        const focusId =
          currentUser?.id && detectedMoves[currentUser.id]
            ? currentUser.id
            : Object.keys(detectedMoves)[0] || null;

        if (focusId) {
          const oldOrderedIds = [...rankedPlayers]
            .sort((a, b) => (prevMap[a.id] ?? 999) - (prevMap[b.id] ?? 999))
            .map((p) => p.id);

          setStagedOldOrderIds(oldOrderedIds);

          window.requestAnimationFrame(() => {
            const targetNode = rowRefs.current.get(focusId);
            if (targetNode) {
              targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });

          window.clearTimeout(stageTimerRef.current);
          stageTimerRef.current = window.setTimeout(() => {
            captureRowRects();
            setActiveMoves(
              currentUser?.id && detectedMoves[currentUser.id]
                ? { [currentUser.id]: detectedMoves[currentUser.id] }
                : detectedMoves
            );
            setStagedOldOrderIds(null);
            triggerHaptic(detectedMoves[focusId].dir === 'up' ? 'success' : 'warning');

            window.clearTimeout(settleTimerRef.current);
            settleTimerRef.current = window.setTimeout(() => {
              setActiveMoves({});
            }, 1750);
          }, 440);
        }
      }
      return undefined;
    }

    const prevLiveMap = lastLiveRanksRef.current.rankMap;
    const liveMoves = {};
    rankedPlayers.forEach((p, idx) => {
      const newRank = idx + 1;
      const oldRank = prevLiveMap[p.id];
      if (oldRank && oldRank !== newRank) {
        liveMoves[p.id] = {
          dir: newRank < oldRank ? 'up' : 'down',
          delta: Math.abs(oldRank - newRank),
          oldRank,
          newRank,
        };
      }
    });

    lastLiveRanksRef.current = { filterKey, rankMap: currentRankMap };
    const storedAll = readStoredRanks();
    writeStoredRanks({ ...storedAll, [filterKey]: currentRankMap });

    if (Object.keys(liveMoves).length > 0) {
      const focusMove =
        currentUser?.id && liveMoves[currentUser.id]
          ? { [currentUser.id]: liveMoves[currentUser.id] }
          : liveMoves;
      setActiveMoves(focusMove);

      const focusId = Object.keys(focusMove)[0];
      if (focusId) triggerHaptic(focusMove[focusId].dir === 'up' ? 'success' : 'warning');

      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        setActiveMoves({});
      }, 1750);
    }

    return undefined;
  }, [
    currentOrderSignature,
    activeSubTab,
    divisionFilter,
    categoryFilter,
    searchQuery,
    currentUser?.id,
  ]);

  useEffect(() => {
    return () => {
      window.clearTimeout(stageTimerRef.current);
      window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  const displayedRankedPlayers = useMemo(() => {
    if (!stagedOldOrderIds || stagedOldOrderIds.length === 0) return rankedPlayers;
    const byId = new Map(rankedPlayers.map((p) => [p.id, p]));
    const ordered = stagedOldOrderIds.map((id) => byId.get(id)).filter(Boolean);
    const extras = rankedPlayers.filter((p) => !stagedOldOrderIds.includes(p.id));
    return [...ordered, ...extras];
  }, [rankedPlayers, stagedOldOrderIds]);

  const showTop3Horizontal =
    displayedRankedPlayers.length >= 1 && searchQuery.trim().length === 0;
  const top3Players = showTop3Horizontal ? displayedRankedPlayers.slice(0, 3) : [];
  const listPlayers = showTop3Horizontal
    ? displayedRankedPlayers.slice(3)
    : displayedRankedPlayers;
  const listStartRank = showTop3Horizontal ? 4 : 1;

  useLayoutEffect(() => {
    if (activeSubTab !== 'oficial') return;
    const isLite =
      typeof document !== 'undefined' && document.documentElement.dataset.tier === 'lite';

    const prevRects = prevRectsRef.current;
    if (!isLite && prevRects.size > 0) {
      const animatedNodes = [];

      rowRefs.current.forEach((node, id) => {
        const oldTop = prevRects.get(id);
        if (oldTop === undefined) return;
        const newTop = node.getBoundingClientRect().top;
        const deltaY = oldTop - newTop;

        if (Math.abs(deltaY) >= 2) {
          const isPrimaryMover = Boolean(activeMoves[id]);
          node.style.transition = 'none';
          node.style.transform = isPrimaryMover
            ? `translate3d(0, ${deltaY}px, 0) scale(1.028)`
            : `translate3d(0, ${deltaY}px, 0)`;
          node.style.zIndex = isPrimaryMover ? '15' : '1';
          animatedNodes.push({ node, isPrimaryMover });
        }
      });

      if (animatedNodes.length > 0) {
        void document.body.offsetHeight;

        animatedNodes.forEach(({ node, isPrimaryMover }) => {
          node.style.transition = isPrimaryMover
            ? 'transform 960ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'transform 820ms cubic-bezier(0.22, 1, 0.36, 1)';
          node.style.transform = 'translate3d(0, 0, 0) scale(1)';

          const onEnd = () => {
            node.style.transition = '';
            node.style.transform = '';
            node.style.zIndex = '';
            node.removeEventListener('transitionend', onEnd);
          };
          node.addEventListener('transitionend', onEnd);
        });
      }
    }

    captureRowRects();
  }, [displayedRankedPlayers, activeSubTab, activeMoves]);

  const myRankInCurrentView = useMemo(() => {
    if (!currentUser?.id) return null;
    const idx = rankedPlayers.findIndex((p) => p.id === currentUser.id);
    return idx >= 0 ? idx + 1 : null;
  }, [rankedPlayers, currentUser]);

  const masterTop8Rows = useMemo(() => {
    const engineDiv =
      divisionFilter === 'Varones' || divisionFilter === 'Damas' ? divisionFilter : 'ALL';
    const officialOnly = (players || []).filter((p) => isPlayerOfficiallyRanked(p));
    let rows = computeMasterTop8Race(safeSnapshots, officialOnly, engineDiv, categoryFilter);

    if (divisionFilter === 'SENIOR_40') {
      rows = rows
        .filter((r) => (Number(r.player?.age) || 0) >= 40)
        .map((r, idx) => ({ ...r, raceRank: idx + 1, qualifiesMasterTop8: idx < 8 }));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        `${r.player?.name || ''} ${r.player?.clubName || ''}`.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [safeSnapshots, players, divisionFilter, categoryFilter, searchQuery]);

  /* Ranking de Clubes: solo considera jugadores oficialmente rankeados (>= 5 PJ) */
  const clubsStandings = useMemo(() => {
    return (clubs || [])
      .map((club) => {
        const members = (players || []).filter(
          (p) => p.clubId === club.id && isPlayerOfficiallyRanked(p)
        );
        const totalPoints = members.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
        const avgPoints = members.length > 0 ? Math.round(totalPoints / members.length) : 0;
        const totalWins = members.reduce((sum, p) => sum + (Number(p.wins) || 0), 0);
        const totalLosses = members.reduce((sum, p) => sum + (Number(p.losses) || 0), 0);
        const totalMatches = totalWins + totalLosses;
        const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
        const topPlayer = [...members].sort(
          (a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)
        )[0];

        return { club, membersCount: members.length, totalPoints, avgPoints, winRate, topPlayer };
      })
      .sort((a, b) => {
        if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints;
        return b.totalPoints - a.totalPoints;
      });
  }, [clubs, players]);

  const handleResetFilters = () => {
    triggerHaptic('light');
    setDivisionFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
  };

  const handleJumpToMyRow = () => {
    triggerHaptic('medium');
    const el = document.getElementById('tt-my-ranking-row');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleSeasonAccordion = (playerId) => {
    triggerHaptic('light');
    setExpandedSeasonIds((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  const isLight = theme === 'light';
  const activeCategoryObj = CATEGORIES_SCALE.find((c) => c.id === categoryFilter) || null;
  const subTabs = [
    { id: 'oficial', label: 'Oficial' },
    { id: 'calibrando', label: 'Calibrando', count: totalCalibratingCount },
    { id: 'temporadas', label: 'Temporadas' },
    { id: 'clubes', label: 'Clubes' },
  ];
  const activeTabIdx = Math.max(
    0,
    subTabs.findIndex((t) => t.id === activeSubTab)
  );

  const dynamicVars = {
    '--rk-accent': isLight ? divisionTheme.accentLight : divisionTheme.accentDark,
    '--rk-accent-vivid': divisionTheme.accentDark,
    '--rk-accent-on-fill': isLight ? divisionTheme.pillTextLight : divisionTheme.accentOnFill,
    '--rk-pill-grad': isLight ? divisionTheme.pillGradLight : divisionTheme.pillGradDark,
    '--rk-soft-bg': isLight ? divisionTheme.softBgLight : divisionTheme.softBgDark,
    '--rk-soft-border': isLight ? divisionTheme.softBorderLight : divisionTheme.softBorderDark,
    '--rk-glow': divisionTheme.glow,
  };

  return (
    <section
      className={`tt-ranking-view ${isLight ? 'is-light' : 'is-dark'}`}
      style={dynamicVars}
      aria-label="Clasificación Oficial TOTAL TENIS"
    >
      {/* 1. BARRA SUPERIOR LIQUID GLASS (4 PESTAÑAS: OFICIAL | CALIBRANDO | TEMPORADAS | CLUBES) */}
      <div className="tt-rk-subtabs" role="tablist" aria-label="Vistas del Ranking">
        <span
          className="tt-rk-subtab-slider"
          aria-hidden="true"
          style={{ transform: `translateX(${activeTabIdx * 100}%)` }}
        />
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === tab.id}
            className={`tt-rk-subtab ${activeSubTab === tab.id ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab(tab.id);
            }}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="tt-rk-tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* 2. BUSCADOR + FILTROS INDEPENDIENTES */}
      {activeSubTab !== 'clubes' && (
        <div className="tt-rk-filters-wrap">
          <div className="tt-rk-search-row">
            <div className="tt-rk-search-bar">
              <TTIcon name="search" size={17} style={{ opacity: 0.6, flexShrink: 0 }} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSubTab === 'calibrando'
                    ? 'Buscar jugador en calibración...'
                    : 'Buscar jugador o club...'
                }
                aria-label="Buscar en la clasificación"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="tt-rk-clear-btn tt-rk-press"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearchQuery('')}
                >
                  <TTIcon name="close" size={14} />
                </button>
              )}
            </div>

            {myRankInCurrentView && activeSubTab === 'oficial' && (
              <button
                type="button"
                className="tt-rk-mypos-chip tt-rk-press"
                onClick={handleJumpToMyRow}
                title="Ir a mi posición actual"
              >
                <small>MI PUESTO</small>
                <strong>#{myRankInCurrentView}</strong>
              </button>
            )}

            {currentUserIsCalibrating && activeSubTab === 'oficial' && (
              <button
                type="button"
                className="tt-rk-mypos-chip is-prov-chip tt-rk-press"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveSubTab('calibrando');
                }}
                title="Ver mi estado en Calibrando"
              >
                <small>PROV.</small>
                <strong>
                  {getOfficialMatchesPlayed(currentUser)}/{ELO_CONFIG.CALIBRATION_MATCHES}
                </strong>
              </button>
            )}
          </div>

          <div className="tt-rk-div-row" role="group" aria-label="Filtrar por división">
            {DIVISION_FILTERS.map((div) => {
              const isSelected = divisionFilter === div.id;
              return (
                <button
                  key={div.id}
                  type="button"
                  className={`tt-rk-div-pill tt-rk-press ${isSelected ? 'is-active' : ''}`}
                  style={
                    isSelected
                      ? {
                          background: isLight ? div.pillGradLight : div.pillGradDark,
                          color: isLight ? div.pillTextLight : div.accentOnFill,
                          borderColor: 'transparent',
                          boxShadow: isLight
                            ? 'inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 16px rgba(30, 7, 52, 0.18)'
                            : `inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 18px ${div.glow}`,
                        }
                      : undefined
                  }
                  onClick={() => {
                    triggerHaptic('medium');
                    setDivisionFilter(div.id);
                  }}
                >
                  <span
                    className="tt-rk-div-dot"
                    style={{
                      backgroundColor: isSelected
                        ? isLight
                          ? div.pillTextLight
                          : div.accentOnFill
                        : isLight
                        ? div.accentLight
                        : div.accentDark,
                    }}
                    aria-hidden="true"
                  />
                  <span>{div.label}</span>
                </button>
              );
            })}
          </div>

          {divisionFilter !== 'SENIOR_40' && (
            <div className="tt-rk-pills-row">
              <button
                type="button"
                className={`tt-rk-pill tt-rk-press ${categoryFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setCategoryFilter('ALL');
                }}
              >
                Todas las categorías
              </button>

              {[...CATEGORIES_SCALE].reverse().map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`tt-rk-pill tt-rk-press ${categoryFilter === cat.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setCategoryFilter(cat.id);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          VISTA A: RANKING OFICIAL (ESTRICTAMENTE >= 5 PARTIDOS JUGADOS)
          ==================================================================== */}
      {activeSubTab === 'oficial' && (
        <div
          key={`of-${divisionFilter}-${categoryFilter}`}
          className="tt-rk-content-stack tt-rk-panel-morph"
        >
          {currentUserIsCalibrating && (
            <div className="tt-calib-self-banner">
              <TTIcon name="shield" size={18} style={{ color: '#38BDF8', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>
                  Tu perfil está en Calibración ({getOfficialMatchesPlayed(currentUser)}/
                  {ELO_CONFIG.CALIBRATION_MATCHES} partidos)
                </strong>
                <p>
                  El Ranking Oficial muestra solo jugadores con {ELO_CONFIG.CALIBRATION_MATCHES}+
                  partidos confirmados. Tu ELO provisional ({Number(currentUser?.points || 0).toLocaleString('es-PE')}) sirve para pactar retos parejos hasta entrar aquí.
                </p>
              </div>
              <button
                type="button"
                className="tt-calib-switch-btn tt-rk-press"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveSubTab('calibrando');
                }}
              >
                Ver Calibrando →
              </button>
            </div>
          )}

          {displayedRankedPlayers.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Aún sin jugadores oficiales en este filtro"
              description={`Solo figuran aquí los jugadores con ${ELO_CONFIG.CALIBRATION_MATCHES} o más partidos oficiales en ${divisionTheme.label}${
                activeCategoryObj ? ` · ${activeCategoryObj.name}` : ''
              }.`}
              actionLabel={totalCalibratingCount > 0 ? 'Ver jugadores Calibrando' : 'Ver clasificación completa'}
              onAction={() => {
                if (totalCalibratingCount > 0) setActiveSubTab('calibrando');
                else handleResetFilters();
              }}
            />
          ) : (
            <>
              {showTop3Horizontal && top3Players.length > 0 && (
                <div className="tt-top3-stack-wrap">
                  <div className="tt-top3-stage-head">
                    <span className="tt-podium-kicker">
                      TOP 3 OFICIAL ·{' '}
                      {activeCategoryObj
                        ? `${divisionTheme.label.toUpperCase()} · ${activeCategoryObj.name.toUpperCase()}`
                        : divisionTheme.shortTag}
                    </span>
                    <span className="tt-podium-quorum-note">
                      Solo jugadores con {ELO_CONFIG.CALIBRATION_MATCHES}+ PJ
                    </span>
                  </div>

                  <div className="tt-top3-hlist">
                    {top3Players.map((player, idx) => (
                      <TopThreeHorizontalRow
                        key={player.id}
                        player={player}
                        rank={idx + 1}
                        club={getClubById(clubs, player.clubId)}
                        isCurrentUser={Boolean(currentUser && currentUser.id === player.id)}
                        isLight={isLight}
                        moveHighlight={activeMoves[player.id] || null}
                        registerRowRef={registerRowRef}
                        onOpenProfile={onOpenPlayerProfile}
                        onQuickChallenge={onQuickChallenge}
                        onOpenHeadToHead={onOpenHeadToHead}
                      />
                    ))}
                  </div>
                </div>
              )}

              {listPlayers.length > 0 && (
                <div className="tt-rk-table-shell">
                  <div className="tt-rk-table-head">
                    <span className="col-pos">#</span>
                    <span className="col-player">JUGADOR OFICIAL & CATEGORÍA</span>
                    <span className="col-pts">PUNTOS</span>
                  </div>

                  <div className="tt-rk-rows-stack">
                    {listPlayers.map((player, idx) => {
                      const rank = listStartRank + idx;
                      const club = getClubById(clubs, player.clubId);
                      const isMe = Boolean(currentUser && currentUser.id === player.id);

                      return (
                        <React.Fragment key={player.id}>
                          <RankingPlayerRow
                            player={player}
                            rank={rank}
                            club={club}
                            isCurrentUser={isMe}
                            showLaurelMini={!showTop3Horizontal}
                            divisionTheme={divisionTheme}
                            moveHighlight={activeMoves[player.id] || null}
                            registerRowRef={registerRowRef}
                            onOpenProfile={onOpenPlayerProfile}
                            onQuickChallenge={onQuickChallenge}
                            onOpenHeadToHead={onOpenHeadToHead}
                          />

                          {rank === 8 && listPlayers.length > idx + 1 && (
                            <div className="tt-master-cutoff-divider" role="separator">
                              <span className="tt-cutoff-line" />
                              <span className="tt-cutoff-pill">
                                <TTIcon name="trophy" size={12} />
                                CORTE MASTER TOP 8
                              </span>
                              <span className="tt-cutoff-line" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ====================================================================
          VISTA B: CALIBRÁNDOSE (PROVISIONAL < 5 PJ · SIN PODIO NI #1)
          ==================================================================== */}
      {activeSubTab === 'calibrando' && (
        <div
          key={`cal-${divisionFilter}-${categoryFilter}`}
          className="tt-rk-content-stack tt-rk-panel-morph"
        >
          <div className="tt-calib-hero-card">
            <IconBadge name="shield" variant="emerald" size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="tt-calib-kicker">LISTA PROVISIONAL · SIN PUESTO OFICIAL</span>
              <h3>Jugadores Calibrándose (&lt; {ELO_CONFIG.CALIBRATION_MATCHES} PJ)</h3>
              <p>
                Aquí aparecen los perfiles nuevos con su <b>ELO provisional</b> de referencia para
                medirse y pactar retos. No existe puesto #1 ni podio aquí: al completar{' '}
                <b>{ELO_CONFIG.CALIBRATION_MATCHES} partidos oficiales</b> pasan automáticamente al{' '}
                <b>Ranking Oficial</b>.
              </p>
            </div>
          </div>

          {calibratingPlayers.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="No hay jugadores en calibración en este filtro"
              description="Todos los jugadores de este filtro ya completaron sus 5 partidos oficiales o están en otra categoría."
              actionLabel="Ver Ranking Oficial"
              onAction={() => setActiveSubTab('oficial')}
            />
          ) : (
            <div className="tt-rk-table-shell is-calib-shell">
              <div className="tt-rk-table-head is-calib-head">
                <span className="col-pos">PROV.</span>
                <span className="col-player">JUGADOR EN CALIBRACIÓN</span>
                <span className="col-pts">ELO PROV.</span>
              </div>

              <div className="tt-rk-rows-stack">
                {calibratingPlayers.map((player) => (
                  <CalibratingPlayerRow
                    key={player.id}
                    player={player}
                    club={getClubById(clubs, player.clubId)}
                    isCurrentUser={Boolean(currentUser && currentUser.id === player.id)}
                    onOpenProfile={onOpenPlayerProfile}
                    onQuickChallenge={onQuickChallenge}
                    onOpenHeadToHead={onOpenHeadToHead}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          VISTA C: TEMPORADAS + RELOJ SPLIT-FLAP + ACORDEÓN (SOLO OFICIALES)
          ==================================================================== */}
      {activeSubTab === 'temporadas' && (
        <div
          key={`temp-${divisionFilter}-${categoryFilter}`}
          className="tt-rk-content-stack tt-rk-panel-morph"
        >
          <div className="tt-seasons-banner">
            <div className="tt-seasons-banner-top">
              <IconBadge name="trophy" variant="gold" size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="tt-seasons-kicker">CARRERA ANUAL · {safeSnapshots.year}</span>
                <h2 className="tt-seasons-title">Puntos Totales al Master Top 8</h2>
              </div>
            </div>

            <MiniSeasonCountdown
              seasonNumber={safeSnapshots.currentSeason}
              year={safeSnapshots.year}
              customEndDate={currentSeasonObj?.endDate || null}
            />

            <div className="tt-quarters-strip">
              {safeSnapshots.seasons.map((s) => {
                const isCurrent = !s.locked && s.number === safeSnapshots.currentSeason;
                return (
                  <div
                    key={s.number}
                    className={`tt-quarter-chip ${
                      s.locked ? 'is-done' : isCurrent ? 'is-live' : 'is-future'
                    }`}
                  >
                    <strong>T{s.number}</strong>
                    <span>{s.period}</span>
                    <small>{s.locked ? 'Terminada' : isCurrent ? 'En curso' : 'Próxima'}</small>
                  </div>
                );
              })}
            </div>

            <div className="tt-seasons-actions-row">
              {onGoToTournaments && (
                <button
                  type="button"
                  className="tt-master-gold-cta tt-rk-press"
                  onClick={() => {
                    triggerHaptic('medium');
                    onGoToTournaments('master');
                  }}
                >
                  <span className="tt-master-gold-sweep" aria-hidden="true" />
                  <TTIcon name="crown" size={16} />
                  <span>Ver Master Top 8</span>
                  <span className="tt-master-arrow">→</span>
                </button>
              )}

              <button
                type="button"
                className="tt-btn tt-btn-ghost tt-btn-sm tt-rk-press"
                onClick={() => {
                  triggerHaptic('light');
                  setShowRewardsGuide((v) => !v);
                }}
              >
                {showRewardsGuide ? 'Ocultar premios' : 'Premios'}
              </button>
            </div>
          </div>

          {showRewardsGuide && (
            <div className="tt-rewards-split-grid">
              <div className="tt-reward-box">
                <span className="tt-reward-kicker">{SEASON_QUARTERLY_REWARDS.badge}</span>
                <h3>{SEASON_QUARTERLY_REWARDS.title}</h3>
                <div className="tt-reward-podium-list">
                  {SEASON_QUARTERLY_REWARDS.podium.map((p) => (
                    <div key={p.place} className="tt-reward-item">
                      <strong>{p.label}</strong>
                      <span>{p.physicalItems.join(' + ')}</span>
                      <small>{p.gemsRangeLabel}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tt-reward-box is-annual">
                <span className="tt-reward-kicker is-gold">{ANNUAL_MASTER_TOP8_REWARDS.badge}</span>
                <h3>{ANNUAL_MASTER_TOP8_REWARDS.title}</h3>
                <div className="tt-reward-podium-list">
                  {ANNUAL_MASTER_TOP8_REWARDS.podium.map((p) => (
                    <div key={p.place} className="tt-reward-item">
                      <strong>{p.label}</strong>
                      <span>{p.rewards.join(' · ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {masterTop8Rows.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin jugadores oficiales en este filtro"
              description="Solo compiten en la carrera anual al Master Top 8 quienes ya completaron sus 5 partidos oficiales."
              actionLabel="Ver todos"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="tt-season-acc-list">
              {masterTop8Rows.map((row, idx) => {
                const isMe = Boolean(currentUser && currentUser.id === row.player.id);
                const club = getClubById(clubs, row.player.clubId);
                const isOpen = Boolean(expandedSeasonIds[row.player.id]);

                return (
                  <React.Fragment key={row.player.id}>
                    <article
                      className={`tt-acc-card ${row.qualifiesMasterTop8 ? 'is-top8' : ''} ${
                        isMe ? 'is-me-halo' : ''
                      } ${isOpen ? 'is-open' : ''}`}
                    >
                      <button
                        type="button"
                        className="tt-acc-trigger"
                        aria-expanded={isOpen}
                        onClick={() => toggleSeasonAccordion(row.player.id)}
                      >
                        <span className={`tt-race-rank-pill ${row.qualifiesMasterTop8 ? 'is-in' : ''}`}>
                          #{row.raceRank}
                        </span>

                        <div className="tt-acc-avatar-frame">
                          <SmartImage
                            src={row.player.avatar}
                            alt={row.player.name}
                            initials={row.player.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                          />
                        </div>

                        <div className="tt-acc-player-meta">
                          <strong>{row.player.name}</strong>
                          <small>
                            {row.category.name}
                            {club ? ` · ${club.shortName}` : ''}
                          </small>
                        </div>

                        <div className="tt-acc-total-col">
                          <small>TOTALES</small>
                          <strong>{row.totalAnnual.toLocaleString('es-PE')}</strong>
                        </div>

                        <span className={`tt-acc-chevron ${isOpen ? 'is-rotated' : ''}`}>▾</span>
                      </button>

                      {isOpen && (
                        <div className="tt-acc-body">
                          <div className="tt-acc-seasons-grid">
                            {row.seasonValues.map((val, sIdx) => {
                              const sMeta = safeSnapshots.seasons[sIdx];
                              const isCurrent =
                                sMeta && !sMeta.locked && sMeta.number === safeSnapshots.currentSeason;
                              return (
                                <div
                                  key={sIdx}
                                  className={`tt-acc-q-box ${
                                    sMeta?.locked ? 'is-done' : isCurrent ? 'is-live' : ''
                                  }`}
                                >
                                  <span>T{sIdx + 1}</span>
                                  <strong>{val > 0 ? val.toLocaleString('es-PE') : '—'}</strong>
                                  <small>{sMeta?.locked ? 'Terminada' : isCurrent ? 'En curso' : 'Próxima'}</small>
                                </div>
                              );
                            })}
                          </div>

                          <div className="tt-acc-footer">
                            <span className="tt-acc-status-tag">
                              {row.qualifiesMasterTop8
                                ? '✓ En zona Master Top 8'
                                : 'Sigue sumando para entrar al Top 8'}
                            </span>
                            <button
                              type="button"
                              className="tt-acc-profile-link tt-rk-press"
                              onClick={() => {
                                triggerHaptic('light');
                                if (onOpenPlayerProfile) onOpenPlayerProfile(row.player);
                              }}
                            >
                              Ver ficha →
                            </button>
                          </div>
                        </div>
                      )}
                    </article>

                    {row.raceRank === 8 && masterTop8Rows.length > idx + 1 && (
                      <div className="tt-master-cutoff-divider is-rounded" role="separator">
                        <span className="tt-cutoff-line" />
                        <span className="tt-cutoff-pill">
                          <TTIcon name="crown" size={12} />
                          CORTE TOP 8 MASTER
                        </span>
                        <span className="tt-cutoff-line" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          VISTA D: RANKING DE CLUBES (SOLO JUGADORES OFICIALES >= 5 PJ)
          ==================================================================== */}
      {activeSubTab === 'clubes' && (
        <div className="tt-rk-content-stack tt-rk-panel-morph">
          <div className="tt-clubs-standings-grid">
            {clubsStandings.map((item, idx) => {
              const rank = idx + 1;
              const medal = MEDAL_PALETTE[rank];

              return (
                <article
                  key={item.club.id}
                  className="tt-club-rank-card"
                  style={{ borderColor: medal ? `${medal.primary}68` : undefined }}
                >
                  <div className="tt-club-rank-head">
                    <span
                      className="tt-club-rank-num"
                      style={medal ? { color: isLight ? medal.primaryLight : medal.primary } : undefined}
                    >
                      #{rank}
                    </span>

                    <div className="tt-club-logo-frame">
                      <SmartImage
                        src={item.club.logo}
                        alt={item.club.name}
                        initials={item.club.shortName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong className="tt-club-rank-name">{item.club.name}</strong>
                      <span className="tt-club-rank-district">
                        {item.club.district} · {item.club.courtsCount} canchas
                      </span>
                    </div>

                    <div className="tt-club-avg-badge">
                      <strong>{item.avgPoints.toLocaleString('es-PE')}</strong>
                      <span>PROMEDIO</span>
                    </div>
                  </div>

                  <div className="tt-club-metrics-row">
                    <div><span>Oficiales</span><strong>{item.membersCount}</strong></div>
                    <div><span>Puntos</span><strong>{item.totalPoints.toLocaleString('es-PE')}</strong></div>
                    <div><span>Victorias</span><strong>{item.winRate}%</strong></div>
                  </div>

                  {item.topPlayer && (
                    <button
                      type="button"
                      className="tt-club-top-rep tt-rk-press"
                      onClick={() => {
                        triggerHaptic('light');
                        if (onOpenPlayerProfile) onOpenPlayerProfile(item.topPlayer);
                      }}
                    >
                      <SmartImage
                        src={item.topPlayer.avatar}
                        alt={item.topPlayer.name}
                        initials={item.topPlayer.name}
                        style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '1.5px solid #00DC7D' }}
                      />
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <small>Líder oficial de la sede</small>
                        <strong>{item.topPlayer.name}</strong>
                      </div>
                      <span className="tt-club-rep-pts">
                        {Number(item.topPlayer.points || 0).toLocaleString('es-PE')} pts
                      </span>
                      <TTIcon name="chevronRight" size={16} style={{ opacity: 0.55 }} />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .tt-ranking-view { display: flex; flex-direction: column; gap: 13px; }
        .tt-rk-press { transition: transform 170ms cubic-bezier(0.22, 1.38, 0.36, 1), box-shadow 200ms ease, border-color 180ms ease !important; }
        .tt-rk-press:active { transform: scale(0.95) !important; }

        /* 1. SUB-TABS LIQUID GLASS (4 PESTAÑAS) */
        .tt-rk-subtabs {
          position: relative; display: grid; grid-template-columns: repeat(4, 1fr);
          padding: 4px; border-radius: 18px; background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        }
        .tt-rk-subtab-slider {
          position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 4);
          border-radius: 13px; background: var(--rk-pill-grad);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38), 0 6px 16px var(--rk-glow);
          transition: transform 320ms cubic-bezier(0.22, 1.24, 0.36, 1), background 300ms ease;
          pointer-events: none; z-index: 0;
        }
        .tt-rk-subtab {
          position: relative; z-index: 1; min-height: 41px; padding: 0 4px;
          border-radius: 13px; font-size: 0.72rem; font-weight: 800; color: var(--tt-text-muted);
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          white-space: nowrap; transition: color 200ms ease;
        }
        .tt-rk-subtab.is-active { color: var(--rk-accent-on-fill); font-weight: 900; }
        .tt-rk-tab-badge {
          min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px;
          background: rgba(56, 189, 248, 0.22); color: #7DD3FC;
          font-size: 0.58rem; font-weight: 900; display: inline-flex; align-items: center; justify-content: center;
        }
        .tt-ranking-view.is-light .tt-rk-tab-badge { background: rgba(3, 105, 161, 0.14); color: #0369A1; }
        .tt-rk-subtab.is-active .tt-rk-tab-badge { background: rgba(16, 2, 30, 0.22); color: inherit; }

        /* 2. BUSCADOR + FILTROS LIQUID GLASS */
        .tt-rk-filters-wrap { display: flex; flex-direction: column; gap: 9px; }
        .tt-rk-search-row { display: flex; align-items: stretch; gap: 8px; }
        .tt-rk-search-bar {
          flex: 1; display: flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 13px;
          border-radius: 15px; background: var(--tt-surface); border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: border-color 200ms ease;
        }
        .tt-rk-search-bar:focus-within { border-color: var(--rk-accent); }
        .tt-rk-search-bar input { width: 100%; border: none; background: transparent; color: var(--tt-text); font-size: 16px; outline: none; }
        .tt-rk-clear-btn { width: 25px; height: 25px; border-radius: 50%; background: var(--tt-surface-2); color: var(--tt-text-muted); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .tt-rk-mypos-chip {
          padding: 0 13px; border-radius: 15px; background: var(--rk-soft-bg);
          border: 1px solid var(--rk-soft-border); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
          color: var(--tt-text); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .tt-rk-mypos-chip.is-prov-chip {
          background: rgba(56, 189, 248, 0.14);
          border-color: rgba(56, 189, 248, 0.45);
        }
        .tt-rk-mypos-chip.is-prov-chip strong { color: #38BDF8; }
        .tt-ranking-view.is-light .tt-rk-mypos-chip.is-prov-chip strong { color: #0369A1; }
        .tt-rk-mypos-chip small { font-size: 0.5rem; font-weight: 900; letter-spacing: 0.08em; opacity: 0.74; }
        .tt-rk-mypos-chip strong { font-family: var(--tt-font-display); font-size: 1.06rem; line-height: 1; color: var(--rk-accent); }

        .tt-rk-div-row, .tt-rk-pills-row { display: flex; gap: 7px; overflow-x: auto; padding: 1px 1px 3px; scrollbar-width: none; }
        .tt-rk-div-row::-webkit-scrollbar, .tt-rk-pills-row::-webkit-scrollbar { display: none; }
        .tt-rk-div-pill {
          flex-shrink: 0; min-height: 36px; padding: 0 13px; border-radius: 999px;
          background: var(--tt-surface); border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09);
          color: var(--tt-text-secondary); display: inline-flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 800;
        }
        .tt-rk-div-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .tt-rk-pill {
          flex-shrink: 0; min-height: 33px; padding: 0 12px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 700; background: var(--tt-surface-2);
          border: 1px solid var(--tt-border); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          color: var(--tt-text-muted);
        }
        .tt-rk-pill.is-active {
          background: var(--rk-soft-bg); border-color: var(--rk-soft-border); color: var(--rk-accent); font-weight: 900;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 4px 12px var(--rk-glow);
        }

        .tt-rk-content-stack { display: flex; flex-direction: column; gap: 13px; }
        .tt-rk-panel-morph { animation: ttRkMorph 320ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes ttRkMorph { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* BANNER CALIBRACIÓN PROPIA + SECCIÓN CALIBRÁNDOSE */
        .tt-calib-self-banner {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 12px 13px; border-radius: 17px;
          background: rgba(56, 189, 248, 0.13); border: 1.5px solid rgba(56, 189, 248, 0.45);
          font-size: 0.74rem;
        }
        .tt-ranking-view.is-light .tt-calib-self-banner {
          background: #E8F6FE; border-color: rgba(14, 138, 198, 0.42);
        }
        .tt-calib-self-banner strong { display: block; font-size: 0.8rem; color: var(--tt-text); }
        .tt-calib-self-banner p { margin: 2px 0 0; color: var(--tt-text-muted); line-height: 1.38; }
        .tt-calib-switch-btn {
          padding: 7px 12px; border-radius: 11px;
          background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
          color: #08121E; font-size: 0.72rem; font-weight: 900; white-space: nowrap;
        }

        .tt-calib-hero-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px; border-radius: 20px;
          background: var(--tt-surface); border: 1.5px solid rgba(56, 189, 248, 0.45);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), var(--tt-shadow-sm);
        }
        .tt-calib-kicker {
          display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.09em; color: #38BDF8;
        }
        .tt-ranking-view.is-light .tt-calib-kicker { color: #0369A1; }
        .tt-calib-hero-card h3 {
          margin: 2px 0 0; font-family: var(--tt-font-display); font-size: 1.18rem; line-height: 1.08;
        }
        .tt-calib-hero-card p {
          margin: 4px 0 0; font-size: 0.75rem; line-height: 1.42; color: var(--tt-text-muted);
        }

        .tt-rk-table-shell.is-calib-shell { border-color: rgba(56, 189, 248, 0.35); }
        .tt-rk-table-head.is-calib-head { grid-template-columns: 46px 1fr 84px; }
        .tt-rk-row.is-calib-row { grid-template-columns: 46px 54px 1fr auto; }
        .tt-calib-status-col {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
        }
        .tt-calib-badge-main {
          padding: 2px 5px; border-radius: 6px;
          background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(125, 211, 252, 0.5);
          color: #7DD3FC; font-size: 0.52rem; font-weight: 900; letter-spacing: 0.05em;
        }
        .tt-ranking-view.is-light .tt-calib-badge-main {
          background: #E0F2FE; border-color: #38BDF8; color: #0369A1;
        }
        .tt-calib-ratio {
          font-family: var(--tt-font-display); font-size: 0.98rem; font-weight: 900; color: var(--tt-text);
          line-height: 1;
        }
        .tt-rk-portrait-frame.is-calib-frame { border-color: rgba(56, 189, 248, 0.62); }
        .tt-calib-progress-wrap { display: flex; flex-direction: column; gap: 3px; margin-top: 1px; }
        .tt-calib-progress-bar {
          height: 5px; width: 100%; max-width: 150px; border-radius: 999px;
          background: rgba(56, 189, 248, 0.16); overflow: hidden;
        }
        .tt-calib-progress-bar span {
          display: block; height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #38BDF8 0%, #00DC7D 100%);
        }
        .tt-calib-progress-txt { font-size: 0.64rem; font-weight: 700; color: var(--tt-text-muted); }
        .tt-rk-points-val.is-prov-pts { color: #7DD3FC; }
        .tt-ranking-view.is-light .tt-rk-points-val.is-prov-pts { color: #0369A1; }
        .tt-rk-points-unit.is-prov-unit { color: #38BDF8; opacity: 0.9; }
        .tt-ranking-view.is-light .tt-rk-points-unit.is-prov-unit { color: #0369A1; }
        .tt-calib-row-btns { display: flex; align-items: center; gap: 5px; margin-top: 3px; }

        /* ==================================================================
           3. TOP 3 HORIZONTAL CON ESCALA PROGRESIVA (#1 GRANDE → #2 → #3)
           ================================================================== */
        .tt-top3-stack-wrap { display: flex; flex-direction: column; gap: 9px; }
        .tt-top3-stage-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 4px; }
        .tt-podium-kicker { font-size: 0.64rem; font-weight: 900; letter-spacing: 0.09em; color: var(--rk-accent); }
        .tt-podium-quorum-note { font-size: 0.65rem; font-weight: 700; color: var(--tt-text-muted); }

        .tt-top3-hlist { display: flex; flex-direction: column; gap: 9px; position: relative; }
        .tt-top3-hcard {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 22px;
          border: 1.5px solid var(--tt-border);
          background: var(--tt-surface);
          backdrop-filter: blur(18px) saturate(145%);
          -webkit-backdrop-filter: blur(18px) saturate(145%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), var(--tt-shadow-sm);
          cursor: pointer;
          transition: transform 200ms cubic-bezier(0.22, 1.32, 0.36, 1), box-shadow 360ms ease, border-color 360ms ease, background 360ms ease;
          will-change: transform;
        }
        .tt-top3-hcard:active { transform: scale(0.975); }

        .tt-top3-hcard.is-tier-1 {
          padding: 15px 14px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(229, 193, 108, 0.18) 0%, rgba(30, 7, 52, 0.88) 54%, rgba(229, 193, 108, 0.08) 100%);
          box-shadow: inset 0 1px 0 rgba(250, 240, 202, 0.32), 0 14px 32px rgba(229, 193, 108, 0.18);
        }
        .tt-ranking-view.is-light .tt-top3-hcard.is-tier-1 {
          background: linear-gradient(135deg, #FDF9EC 0%, #FFFFFF 64%, #FAF3DC 100%);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 12px 28px rgba(154, 107, 22, 0.14);
        }

        .tt-top3-hcard.is-tier-2 {
          padding: 13px 14px;
          border-radius: 21px;
          background: linear-gradient(135deg, rgba(203, 213, 225, 0.14) 0%, rgba(28, 7, 48, 0.86) 62%, rgba(203, 213, 225, 0.05) 100%);
          box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.24), 0 10px 24px rgba(15, 23, 42, 0.22);
        }
        .tt-ranking-view.is-light .tt-top3-hcard.is-tier-2 {
          background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 70%, #F1F5F9 100%);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 8px 20px rgba(71, 85, 105, 0.1);
        }

        .tt-top3-hcard.is-tier-3 {
          padding: 11px 14px;
          border-radius: 19px;
          background: linear-gradient(135deg, rgba(212, 154, 122, 0.13) 0%, rgba(28, 7, 48, 0.84) 64%, rgba(212, 154, 122, 0.04) 100%);
          box-shadow: inset 0 1px 0 rgba(245, 216, 198, 0.2), 0 8px 20px rgba(124, 61, 33, 0.16);
        }
        .tt-ranking-view.is-light .tt-top3-hcard.is-tier-3 {
          background: linear-gradient(135deg, #FDF6F2 0%, #FFFFFF 70%, #F9ECE4 100%);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 6px 18px rgba(154, 74, 40, 0.09);
        }

        .tt-top3-sheen {
          position: absolute; inset: -40%;
          background: linear-gradient(115deg, transparent 42%, rgba(250, 240, 202, 0.15) 50%, transparent 58%);
          transform: translateX(-110%);
          animation: ttGoldSheen 5.6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ttGoldSheen { 0%, 66% { transform: translateX(-110%); } 100% { transform: translateX(120%); } }

        .tt-top3-left { flex-shrink: 0; position: relative; z-index: 2; }
        .tt-laurel-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tt-laurel-svg { position: absolute; inset: 0; pointer-events: none; }
        .tt-laurel-ring { border-radius: 50%; padding: 2.5px; position: relative; z-index: 1; }
        .tt-laurel-club-dot { position: absolute; right: 4px; bottom: 10px; z-index: 3; width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF; border: 1.5px solid #1E0734; overflow: hidden; }
        .tt-laurel-rank-pill { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 3; padding: 1px 7px; border-radius: 999px; font-size: 0.61rem; font-weight: 900; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.32); }

        .tt-top3-mid { flex: 1; min-width: 0; position: relative; z-index: 2; display: flex; flex-direction: column; gap: 4px; }
        .tt-top3-badge-line { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .tt-top3-tier-pill { font-size: 0.6rem; font-weight: 900; letter-spacing: 0.08em; color: var(--medal-color); }
        .tt-top3-name { font-weight: 900; color: var(--tt-text); line-height: 1.12; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-top3-hcard.is-tier-1 .tt-top3-name { font-size: 1.08rem; }
        .tt-top3-hcard.is-tier-2 .tt-top3-name { font-size: 0.99rem; }
        .tt-top3-hcard.is-tier-3 .tt-top3-name { font-size: 0.94rem; }

        .tt-top3-sub { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .tt-top3-meta { display: flex; align-items: center; gap: 5px; font-size: 0.67rem; font-weight: 700; color: var(--tt-text-muted); flex-wrap: wrap; }
        .tt-top3-meta .is-quorum-ok { color: var(--tt-emerald-text); font-weight: 800; }

        .tt-top3-right { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .tt-top3-pts-box { display: flex; flex-direction: column; align-items: flex-end; line-height: 1; }
        .tt-top3-pts-box strong { font-family: var(--tt-font-display); font-weight: 900; color: var(--rk-accent); font-variant-numeric: tabular-nums; }
        .tt-top3-hcard.is-tier-1 .tt-top3-pts-box strong { font-size: 1.66rem; color: var(--medal-color); }
        .tt-top3-hcard.is-tier-2 .tt-top3-pts-box strong { font-size: 1.48rem; }
        .tt-top3-hcard.is-tier-3 .tt-top3-pts-box strong { font-size: 1.38rem; }
        .tt-top3-pts-box span { font-size: 0.52rem; font-weight: 900; letter-spacing: 0.08em; color: var(--tt-text-muted); margin-top: 2px; }

        .tt-top3-actions { display: flex; align-items: center; gap: 5px; }
        .tt-top3-reto-btn {
          min-height: 28px; padding: 0 11px; border-radius: 999px;
          background: var(--rk-pill-grad); color: var(--rk-accent-on-fill);
          font-size: 0.68rem; font-weight: 900;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 4px 12px var(--rk-glow);
        }

        /* 4. TABLA DEL #4 EN ADELANTE */
        .tt-rk-table-shell {
          border-radius: 22px; background: var(--tt-surface); border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), var(--tt-shadow-sm);
          overflow: hidden;
        }
        .tt-rk-table-head {
          display: grid; grid-template-columns: 38px 1fr 78px; gap: 12px; padding: 10px 14px;
          background: var(--tt-surface-2); border-bottom: 1px solid var(--tt-border);
          font-size: 0.63rem; font-weight: 900; letter-spacing: 0.09em; color: var(--tt-text-muted);
        }
        .tt-rk-table-head .col-pos { text-align: center; }
        .tt-rk-table-head .col-pts { text-align: right; }

        .tt-rk-rows-stack { display: flex; flex-direction: column; position: relative; }
        .tt-rk-row {
          display: grid; grid-template-columns: 38px 54px 1fr auto; align-items: center; gap: 11px;
          padding: 10px 14px; border-bottom: 1px solid var(--tt-border); cursor: pointer;
          position: relative; background: var(--tt-surface);
          transition: background-color 480ms ease, box-shadow 480ms ease, border-color 480ms ease;
          will-change: transform;
        }
        .tt-rk-row:last-child { border-bottom: none; }
        .tt-rk-row:active { background: var(--tt-surface-2); }

        .is-me-halo {
          background: linear-gradient(90deg, var(--rk-soft-bg) 0%, transparent 76%);
          box-shadow: inset 3px 0 0 var(--rk-accent);
        }
        .is-rank-climb {
          background: linear-gradient(90deg, rgba(0, 220, 125, 0.24) 0%, rgba(0, 220, 125, 0.09) 65%, rgba(0, 220, 125, 0.18) 100%) !important;
          box-shadow: inset 4px 0 0 #00DC7D, 0 12px 30px rgba(0, 220, 125, 0.28) !important;
          border-color: rgba(0, 220, 125, 0.65) !important;
        }
        .is-rank-drop {
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.24) 0%, rgba(239, 68, 68, 0.09) 65%, rgba(239, 68, 68, 0.18) 100%) !important;
          box-shadow: inset 4px 0 0 #EF4444, 0 12px 30px rgba(239, 68, 68, 0.26) !important;
          border-color: rgba(239, 68, 68, 0.65) !important;
        }

        .tt-rk-move-pill { padding: 2px 5px; border-radius: 999px; font-size: 0.56rem; font-weight: 900; white-space: nowrap; }
        .tt-rk-move-pill.is-up { background: #00DC7D; color: #10021E; }
        .tt-rk-move-pill.is-down { background: #EF4444; color: #FFFFFF; }

        .tt-rk-rank-col { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .tt-rk-rank-num { font-family: var(--tt-font-display); font-weight: 900; font-size: 1.4rem; line-height: 0.96; color: var(--tt-text); font-variant-numeric: tabular-nums; }
        .tt-rk-trend { font-size: 0.58rem; font-weight: 900; line-height: 1; }
        .tt-rk-trend.is-up { color: var(--tt-emerald-text); }
        .tt-rk-trend.is-down { color: #EF4444; }
        .tt-rk-trend.is-flat { color: var(--tt-text-muted); opacity: 0.5; }

        .tt-rk-portrait-wrap { position: relative; width: 52px; height: 68px; flex-shrink: 0; }
        .tt-rk-portrait-frame { width: 52px; height: 68px; border-radius: 13px; border: 1.5px solid var(--tt-border-medium); overflow: hidden; background: var(--tt-surface-2); }
        .tt-rk-quick-reto {
          position: absolute; right: -5px; bottom: -4px; width: 24px; height: 24px; border-radius: 50%;
          background: #1B0630; border: 1.5px solid var(--rk-accent-vivid); color: var(--rk-accent-vivid);
          display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.32);
        }
        .tt-ranking-view.is-light .tt-rk-quick-reto { background: #FFFFFF; border-color: var(--rk-accent); color: var(--rk-accent); }

        .tt-rk-info-col { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .tt-rk-name-line { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .tt-rk-name { font-size: 0.9rem; font-weight: 800; color: var(--tt-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }
        .tt-vip-subtle-tag { padding: 1px 6px; border-radius: 6px; background: rgba(229, 193, 108, 0.16); border: 1px solid rgba(229, 193, 108, 0.45); color: #E5C16C; font-size: 0.57rem; font-weight: 900; letter-spacing: 0.06em; }
        .tt-ranking-view.is-light .tt-vip-subtle-tag { background: #FBF4E0; border-color: rgba(154, 107, 22, 0.35); color: #8A5D10; }
        .tt-tutela-mini { padding: 1px 6px; border-radius: 6px; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.42); color: #7DD3FC; font-size: 0.56rem; font-weight: 900; }
        .tt-ranking-view.is-light .tt-tutela-mini { background: #E0F2FE; color: #0369A1; }
        .tt-me-micro-pill { padding: 1px 6px; border-radius: 6px; background: var(--rk-pill-grad); color: var(--rk-accent-on-fill); font-size: 0.56rem; font-weight: 900; }

        .tt-rk-sub-line { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .tt-rk-cat-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 7px; border-radius: 999px; background: var(--tt-surface-2); font-size: 0.64rem; font-weight: 800; color: var(--tt-text-secondary); }
        .tt-rk-cat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .tt-rk-club-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 600; color: var(--tt-text-muted); }

        .tt-rk-metrics-line { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .tt-eff-label { font-size: 0.67rem; font-weight: 700; color: var(--tt-text-muted); }
        .tt-streak-clean { padding: 2px 7px; border-radius: 999px; background: var(--rk-soft-bg); color: var(--rk-accent); font-size: 0.61rem; font-weight: 800; }

        .tt-rk-points-col { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
        .tt-rk-points-val { font-family: var(--tt-font-display); font-size: 1.28rem; font-weight: 900; line-height: 0.98; color: var(--rk-accent); font-variant-numeric: tabular-nums; }
        .tt-rk-points-unit { font-size: 0.54rem; font-weight: 900; letter-spacing: 0.08em; color: var(--tt-text-muted); }
        .tt-rk-h2h-mini {
          min-height: 26px; padding: 2px 9px; border-radius: 8px;
          background: var(--tt-surface-2); border: 1px solid var(--tt-border-medium);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
          color: var(--tt-text-secondary); font-size: 0.61rem; font-weight: 800;
        }

        .tt-master-cutoff-divider { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: rgba(229, 193, 108, 0.07); border-bottom: 1px solid var(--tt-border); }
        .tt-master-cutoff-divider.is-rounded { border-radius: 13px; border: 1px dashed rgba(229, 193, 108, 0.42); }
        .tt-cutoff-line { flex: 1; height: 1px; border-top: 1px dashed rgba(229, 193, 108, 0.52); }
        .tt-cutoff-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: #1E0734; color: #E5C16C; border: 1px solid rgba(229, 193, 108, 0.45); font-size: 0.6rem; font-weight: 900; letter-spacing: 0.06em; white-space: nowrap; }

        /* 5. TEMPORADAS + RELOJ SPLIT-FLAP */
        .tt-seasons-banner { border-radius: 22px; padding: 15px; background: var(--tt-surface); border: 1px solid var(--tt-border); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), var(--tt-shadow-sm); display: flex; flex-direction: column; gap: 11px; }
        .tt-seasons-banner-top { display: flex; align-items: center; gap: 11px; }
        .tt-seasons-kicker { display: block; font-size: 0.61rem; font-weight: 900; letter-spacing: 0.09em; color: #E5C16C; }
        .tt-ranking-view.is-light .tt-seasons-kicker { color: #9A6B16; }
        .tt-seasons-title { margin: 2px 0 0; font-family: var(--tt-font-display); font-size: 1.28rem; font-weight: 900; line-height: 1.06; }

        .tt-rk-flip-bar { padding: 9px 11px; border-radius: 15px; background: #18042B; color: #FAF9F5; border: 1px solid rgba(250, 249, 245, 0.14); display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .tt-rk-flip-title { display: inline-flex; align-items: center; gap: 6px; font-size: 0.64rem; letter-spacing: 0.08em; }
        .tt-rk-flip-dot { width: 7px; height: 7px; border-radius: 50%; background: #00DC7D; animation: ttLivePulse 1.8s infinite; }
        .tt-rk-flip-group { display: inline-flex; align-items: flex-start; gap: 4px; margin-left: auto; }
        .tt-rk-flip-group em { font-style: normal; font-family: var(--tt-font-display); color: #E5C16C; padding-top: 5px; font-weight: 900; }
        .tt-rk-flip-unit { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .tt-rk-flip-card { position: relative; min-width: 34px; height: 32px; padding: 0 4px; border-radius: 7px; background: linear-gradient(180deg, #2D0E4E 0%, #21083B 49%, #140425 51%, #1D0734 100%); border: 1px solid rgba(250, 249, 245, 0.16); display: inline-flex; align-items: center; justify-content: center; animation: ttRkFlip 340ms cubic-bezier(0.22, 1.15, 0.36, 1) both; }
        @keyframes ttRkFlip { 0% { transform: rotateX(-36deg); opacity: 0.72; } 100% { transform: rotateX(0); opacity: 1; } }
        .tt-rk-flip-card span { font-family: var(--tt-font-display); font-size: 1.12rem; font-weight: 900; line-height: 1; font-variant-numeric: tabular-nums; }
        .tt-rk-flip-card i { position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: rgba(8, 1, 16, 0.86); }
        .tt-rk-flip-unit small { font-size: 0.48rem; font-weight: 900; letter-spacing: 0.08em; opacity: 0.62; }

        .tt-quarters-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .tt-quarter-chip { padding: 8px 5px; border-radius: 12px; text-align: center; display: flex; flex-direction: column; gap: 1px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-quarter-chip strong { font-size: 0.8rem; font-weight: 900; }
        .tt-quarter-chip span { font-size: 0.61rem; color: var(--tt-text-muted); }
        .tt-quarter-chip small { font-size: 0.57rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-quarter-chip.is-live { border-color: rgba(0, 220, 125, 0.48); background: rgba(0, 220, 125, 0.1); }
        .tt-quarter-chip.is-live small { color: var(--tt-emerald-text); }

        .tt-seasons-actions-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .tt-master-gold-cta {
          position: relative; overflow: hidden; flex: 1; min-width: 175px; min-height: 43px; padding: 0 16px;
          border-radius: 14px; background: linear-gradient(135deg, #F5E1A4 0%, #CCA046 100%);
          color: #1A1102; font-size: 0.82rem; font-weight: 900;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 8px 20px rgba(204, 160, 70, 0.3);
        }
        .tt-master-gold-sweep { position: absolute; inset: -20%; background: linear-gradient(110deg, transparent 36%, rgba(255, 255, 255, 0.44) 50%, transparent 64%); transform: translateX(-115%); animation: ttGoldSheen 4.4s ease-in-out infinite; pointer-events: none; }
        .tt-master-arrow { font-size: 1rem; }

        .tt-season-acc-list { display: flex; flex-direction: column; gap: 8px; }
        .tt-acc-card { border-radius: 18px; background: var(--tt-surface); border: 1px solid var(--tt-border); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09), var(--tt-shadow-sm); overflow: hidden; }
        .tt-acc-card.is-open { border-color: var(--rk-soft-border); }
        .tt-acc-trigger { width: 100%; padding: 11px 13px; display: flex; align-items: center; gap: 10px; text-align: left; color: var(--tt-text); }
        .tt-race-rank-pill { min-width: 30px; height: 28px; padding: 0 6px; border-radius: 9px; font-family: var(--tt-font-display); font-size: 0.96rem; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; background: var(--tt-surface-2); color: var(--tt-text-muted); flex-shrink: 0; }
        .tt-race-rank-pill.is-in { background: rgba(229, 193, 108, 0.18); color: #E5C16C; }
        .tt-ranking-view.is-light .tt-race-rank-pill.is-in { background: #1E0734; color: #F3DC9B; }
        .tt-acc-avatar-frame { width: 38px; height: 46px; border-radius: 10px; overflow: hidden; border: 1px solid var(--tt-border-medium); flex-shrink: 0; }
        .tt-acc-player-meta { flex: 1; min-width: 0; }
        .tt-acc-player-meta strong { display: block; font-size: 0.87rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-acc-player-meta small { display: block; font-size: 0.69rem; color: var(--tt-text-muted); }
        .tt-acc-total-col { text-align: right; flex-shrink: 0; }
        .tt-acc-total-col small { display: block; font-size: 0.5rem; font-weight: 900; letter-spacing: 0.06em; color: var(--tt-text-muted); }
        .tt-acc-total-col strong { font-family: var(--tt-font-display); font-size: 1.24rem; line-height: 1; color: var(--rk-accent); }
        .tt-acc-chevron { width: 24px; height: 24px; border-radius: 50%; background: var(--tt-surface-2); color: var(--tt-text-muted); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 240ms ease; }
        .tt-acc-chevron.is-rotated { transform: rotate(180deg); color: var(--rk-accent); }

        .tt-acc-body { padding: 0 13px 13px; border-top: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 10px; }
        .tt-acc-seasons-grid { padding-top: 11px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
        .tt-acc-q-box { padding: 8px 5px; border-radius: 12px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .tt-acc-q-box span { font-size: 0.6rem; font-weight: 900; color: var(--tt-text-muted); }
        .tt-acc-q-box strong { font-family: var(--tt-font-display); font-size: 1.02rem; }
        .tt-acc-q-box small { font-size: 0.55rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-acc-q-box.is-live { border-color: rgba(0, 220, 125, 0.42); background: rgba(0, 220, 125, 0.09); }
        .tt-acc-q-box.is-live strong, .tt-acc-q-box.is-live small { color: var(--tt-emerald-text); }
        .tt-acc-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tt-acc-status-tag { font-size: 0.7rem; font-weight: 700; color: var(--tt-text-muted); }
        .tt-acc-profile-link { padding: 5px 11px; border-radius: 999px; background: var(--rk-soft-bg); color: var(--rk-accent); font-size: 0.7rem; font-weight: 900; }

        .tt-rewards-split-grid { display: grid; grid-template-columns: 1fr; gap: 11px; }
        @media (min-width: 720px) { .tt-rewards-split-grid { grid-template-columns: 1fr 1fr; } }
        .tt-reward-box { border-radius: 19px; padding: 14px; background: var(--tt-surface); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 8px; }
        .tt-reward-box.is-annual { border-color: rgba(229, 193, 108, 0.44); }
        .tt-reward-kicker { font-size: 0.62rem; font-weight: 900; letter-spacing: 0.08em; color: var(--tt-emerald-text); }
        .tt-reward-kicker.is-gold { color: #E5C16C !important; }
        .tt-ranking-view.is-light .tt-reward-kicker.is-gold { color: #9A6B16 !important; }
        .tt-reward-box h3 { margin: 0; font-size: 0.96rem; }
        .tt-reward-podium-list { display: flex; flex-direction: column; gap: 7px; }
        .tt-reward-item { padding: 9px 11px; border-radius: 12px; background: var(--tt-surface-2); display: flex; flex-direction: column; gap: 2px; font-size: 0.75rem; }
        .tt-reward-item small { color: var(--tt-text-muted); font-size: 0.68rem; }

        /* 6. CLUBES */
        .tt-clubs-standings-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 720px) { .tt-clubs-standings-grid { grid-template-columns: repeat(2, 1fr); } }
        .tt-club-rank-card { border-radius: 22px; padding: 14px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), var(--tt-shadow-sm); display: flex; flex-direction: column; gap: 11px; }
        .tt-club-rank-head { display: flex; align-items: center; gap: 10px; }
        .tt-club-rank-num { font-family: var(--tt-font-display); font-size: 1.48rem; font-weight: 900; min-width: 28px; }
        .tt-club-logo-frame { width: 46px; height: 46px; border-radius: 13px; overflow: hidden; background: #FFFFFF; border: 1px solid var(--tt-border); flex-shrink: 0; }
        .tt-club-rank-name { display: block; font-size: 0.91rem; font-weight: 800; line-height: 1.16; }
        .tt-club-rank-district { display: block; font-size: 0.71rem; color: var(--tt-text-muted); margin-top: 2px; }
        .tt-club-avg-badge { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
        .tt-club-avg-badge strong { font-family: var(--tt-font-display); font-size: 1.36rem; line-height: 0.96; color: var(--tt-emerald-text); }
        .tt-club-avg-badge span { font-size: 0.54rem; font-weight: 900; letter-spacing: 0.06em; color: var(--tt-text-muted); }
        .tt-club-metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 9px; border-radius: 13px; background: var(--tt-surface-2); text-align: center; }
        .tt-club-metrics-row span { display: block; font-size: 0.65rem; color: var(--tt-text-muted); }
        .tt-club-metrics-row strong { font-size: 0.9rem; font-weight: 900; }
        .tt-club-top-rep { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 13px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text); width: 100%; }
        .tt-club-top-rep small { display: block; font-size: 0.63rem; color: var(--tt-text-muted); }
        .tt-club-top-rep strong { display: block; font-size: 0.81rem; }
        .tt-club-rep-pts { font-size: 0.75rem; font-weight: 800; color: var(--tt-emerald-text); white-space: nowrap; }

        html[data-tier='lite'] .tt-top3-sheen,
        html[data-tier='lite'] .tt-master-gold-sweep { display: none !important; }
      `}</style>
    </section>
  );
}
