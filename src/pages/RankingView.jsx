import React, { useMemo, useState } from 'react';
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
import { ELO_CONFIG, computeMasterTop8Race } from '../utils/tenisEngine';

/* ==========================================================================
   PALETAS ATMOSFÉRICAS POR DIVISIÓN (IDENTIDAD VISUAL PROPIA POR RAMA)
   - General    -> Esmeralda Firma TOTAL TENIS
   - Varones    -> Arcilla Roland Garros (Polvo de Ladrillo)
   - Damas      -> Orquídea Magenta Editorial
   - +40 Senior -> Oro Maestro
   ========================================================================== */
const DIVISION_FILTERS = [
  {
    id: 'ALL',
    label: 'General',
    shortTag: 'CLASIFICACIÓN GENERAL',
    accent: '#00DC7D',
    accentLight: '#008A4E',
    accentTextOnFill: '#10021E',
    pillGrad: 'linear-gradient(135deg, #00E080 0%, #00B365 100%)',
    softBg: 'rgba(0, 220, 125, 0.14)',
    softBorder: 'rgba(0, 220, 125, 0.48)',
    glow: 'rgba(0, 220, 125, 0.34)',
    stageGrad:
      'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(0, 220, 125, 0.2) 0%, rgba(28, 7, 50, 0.94) 64%, rgba(16, 3, 30, 0.99) 100%)',
    frameGrad: 'linear-gradient(155deg, #00DC7D 0%, #008A4E 100%)',
  },
  {
    id: 'Varones',
    label: 'Varones',
    shortTag: 'RAMA VARONES · ARCILLA',
    accent: '#E06D44',
    accentLight: '#B84720',
    accentTextOnFill: '#FFFFFF',
    pillGrad: 'linear-gradient(135deg, #E6754B 0%, #BD4720 100%)',
    softBg: 'rgba(217, 107, 67, 0.18)',
    softBorder: 'rgba(224, 109, 68, 0.58)',
    glow: 'rgba(217, 107, 67, 0.42)',
    stageGrad:
      'radial-gradient(ellipse 95% 65% at 50% 0%, rgba(217, 107, 67, 0.34) 0%, rgba(44, 15, 28, 0.94) 62%, rgba(20, 5, 32, 0.99) 100%)',
    frameGrad: 'linear-gradient(155deg, #E8825C 0%, #B4431D 100%)',
  },
  {
    id: 'Damas',
    label: 'Damas',
    shortTag: 'RAMA DAMAS · CIRCUIT',
    accent: '#F45CA5',
    accentLight: '#BE185D',
    accentTextOnFill: '#FFFFFF',
    pillGrad: 'linear-gradient(135deg, #F45CA5 0%, #C01C6E 100%)',
    softBg: 'rgba(244, 92, 165, 0.17)',
    softBorder: 'rgba(244, 92, 165, 0.56)',
    glow: 'rgba(244, 92, 165, 0.4)',
    stageGrad:
      'radial-gradient(ellipse 95% 65% at 50% 0%, rgba(236, 72, 153, 0.3) 0%, rgba(42, 10, 48, 0.94) 62%, rgba(18, 4, 32, 0.99) 100%)',
    frameGrad: 'linear-gradient(155deg, #F472B6 0%, #BE185D 100%)',
  },
  {
    id: 'SENIOR_40',
    label: '+40 Senior',
    shortTag: 'DIVISIÓN +40 SENIOR',
    accent: '#F5B027',
    accentLight: '#B45309',
    accentTextOnFill: '#1A0D00',
    pillGrad: 'linear-gradient(135deg, #FDE047 0%, #D97706 100%)',
    softBg: 'rgba(245, 158, 11, 0.17)',
    softBorder: 'rgba(245, 176, 39, 0.58)',
    glow: 'rgba(245, 158, 11, 0.4)',
    stageGrad:
      'radial-gradient(ellipse 95% 65% at 50% 0%, rgba(245, 158, 11, 0.28) 0%, rgba(36, 15, 44, 0.94) 62%, rgba(16, 3, 30, 0.99) 100%)',
    frameGrad: 'linear-gradient(155deg, #FCD34D 0%, #B45309 100%)',
  },
];

const MEDAL_PALETTE = {
  1: {
    key: 'gold',
    label: '#1 LÍDER',
    primary: '#F59E0B',
    highlight: '#FEF08A',
    deep: '#B45309',
    ring: 'linear-gradient(135deg, #FEF08A 0%, #F59E0B 48%, #B45309 100%)',
    glow: 'rgba(245, 158, 11, 0.38)',
  },
  2: {
    key: 'silver',
    label: '#2 PLATA',
    primary: '#CBD5E1',
    highlight: '#F8FAFC',
    deep: '#64748B',
    ring: 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 52%, #64748B 100%)',
    glow: 'rgba(203, 213, 225, 0.3)',
  },
  3: {
    key: 'bronze',
    label: '#3 BRONCE',
    primary: '#E07A5F',
    highlight: '#FED7AA',
    deep: '#9A3412',
    ring: 'linear-gradient(135deg, #FED7AA 0%, #D97706 52%, #7C2D12 100%)',
    glow: 'rgba(217, 119, 6, 0.3)',
  },
};

/* ==========================================================================
   SUBCOMPONENTE 1: CORONA DE LAURELES OLÍMPICOS EN SVG (ORO / PLATA / BRONCE)
   ========================================================================== */
function LaurelWreathAvatar({ rank = 1, player, club, size = 66, onClick }) {
  const medal = MEDAL_PALETTE[rank] || MEDAL_PALETTE[1];
  const outer = size + 24;
  const gradId = `tt-laurel-${medal.key}-${player?.id || rank}`;

  return (
    <button
      type="button"
      className={`tt-laurel-avatar-btn is-rank-${rank}`}
      onClick={(e) => {
        e.stopPropagation();
        triggerHaptic('light');
        if (onClick && player) onClick(player);
      }}
      aria-label={`Ver ficha de ${player?.name || 'jugador'} (Puesto #${rank})`}
      style={{ width: outer, height: outer }}
    >
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
        <ellipse cx="14" cy="56" rx="5.2" ry="2.7" transform="rotate(-32 14 56)" fill={`url(#${gradId})`} />
        <ellipse cx="16" cy="42" rx="5.2" ry="2.6" transform="rotate(-12 16 42)" fill={`url(#${gradId})`} />
        <ellipse cx="22" cy="29" rx="4.9" ry="2.5" transform="rotate(14 22 29)" fill={`url(#${gradId})`} />
        <ellipse cx="30" cy="19" rx="4.4" ry="2.3" transform="rotate(36 30 19)" fill={`url(#${gradId})`} />
        <ellipse cx="18" cy="69" rx="5.2" ry="2.6" transform="rotate(-52 18 69)" fill={`url(#${gradId})`} />
        <ellipse cx="28" cy="80" rx="5" ry="2.5" transform="rotate(-68 28 80)" fill={`url(#${gradId})`} />
        <ellipse cx="39" cy="87" rx="4.6" ry="2.3" transform="rotate(-80 39 87)" fill={`url(#${gradId})`} />

        <path
          d="M56 89C77 85 89 68 89 49C89 33 81 19 68 12"
          stroke={`url(#${gradId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse cx="86" cy="56" rx="5.2" ry="2.7" transform="rotate(32 86 56)" fill={`url(#${gradId})`} />
        <ellipse cx="84" cy="42" rx="5.2" ry="2.6" transform="rotate(12 84 42)" fill={`url(#${gradId})`} />
        <ellipse cx="78" cy="29" rx="4.9" ry="2.5" transform="rotate(-14 78 29)" fill={`url(#${gradId})`} />
        <ellipse cx="70" cy="19" rx="4.4" ry="2.3" transform="rotate(-36 70 19)" fill={`url(#${gradId})`} />
        <ellipse cx="82" cy="69" rx="5.2" ry="2.6" transform="rotate(52 82 69)" fill={`url(#${gradId})`} />
        <ellipse cx="72" cy="80" rx="5" ry="2.5" transform="rotate(68 72 80)" fill={`url(#${gradId})`} />
        <ellipse cx="61" cy="87" rx="4.6" ry="2.3" transform="rotate(80 61 87)" fill={`url(#${gradId})`} />

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
          boxShadow: `0 8px 22px ${medal.glow}`,
        }}
      >
        <SmartImage
          src={player?.avatar}
          alt={player?.name || 'Jugador'}
          initials={player?.name || 'TT'}
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
    </button>
  );
}

/* ==========================================================================
   SUBCOMPONENTE 2: FILA EDITORIAL CON RETRATO RECTANGULAR VERTICAL (58x76)
   - Foto más protagónica con marco adaptado a la rama activa
   - Puntos equilibrados (1.34rem) y botones con jerarquía visual diferenciada
   ========================================================================== */
function RankingPlayerRow({
  player,
  rank,
  animIndex = 0,
  club,
  isCurrentUser,
  showLaurelMini = false,
  divisionTheme,
  onOpenProfile,
  onQuickChallenge,
  onOpenHeadToHead,
}) {
  const cat = getCategoryByPoints(player.points);
  const wins = Number(player.wins) || 0;
  const losses = Number(player.losses) || 0;
  const played = wins + losses;
  const calibPlayed =
    player.calibrationPlayed !== undefined ? Number(player.calibrationPlayed) : played;
  const isCalibrating = calibPlayed < ELO_CONFIG.CALIBRATION_MATCHES;
  const streak = Number(player.streak) || 0;
  const eff = played > 0 ? Math.round((wins / played) * 100) : null;
  const trend = Number(player.rankTrend || 0);
  const medal = showLaurelMini && rank <= 3 ? MEDAL_PALETTE[rank] : null;
  const staggerDelay = Math.min(animIndex, 10) * 42;

  return (
    <div
      id={isCurrentUser ? 'tt-my-ranking-row' : undefined}
      role="button"
      tabIndex={0}
      className={`tt-rk-row ${isCurrentUser ? 'is-me-halo' : ''} ${
        medal ? `is-medal-${medal.key}` : ''
      }`}
      style={{ '--rk-delay': `${staggerDelay}ms` }}
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
      {/* 1. Puesto + Tendencia */}
      <div className="tt-rk-rank-col">
        <span
          className="tt-rk-rank-num"
          style={medal ? { color: medal.primary } : undefined}
        >
          {rank}
        </span>
        <span
          className={`tt-rk-trend ${
            trend > 0 ? 'is-up' : trend < 0 ? 'is-down' : 'is-flat'
          }`}
        >
          {trend > 0 ? `▲ ${trend}` : trend < 0 ? `▼ ${Math.abs(trend)}` : '—'}
        </span>
      </div>

      {/* 2. Retrato Rectangular Vertical Grande (58x76) */}
      <div className="tt-rk-portrait-wrap">
        <div
          className="tt-rk-portrait-frame"
          style={{
            background: medal ? medal.ring : divisionTheme.frameGrad,
            boxShadow: medal
              ? `0 6px 18px ${medal.glow}`
              : `0 6px 16px ${divisionTheme.glow}`,
          }}
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

        {/* Botón joya rápido de Retar */}
        {!isCurrentUser && onQuickChallenge && (
          <button
            type="button"
            className="tt-rk-quick-reto"
            aria-label={`Desafiar a ${player.name}`}
            title={`Desafiar a ${player.name}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              onQuickChallenge(player);
            }}
          >
            <TTIcon name="challenge" size={13} />
          </button>
        )}
      </div>

      {/* 3. Identidad y métricas */}
      <div className="tt-rk-info-col">
        <div className="tt-rk-name-line">
          <strong className="tt-rk-name">{player.name}</strong>
          {player.isVip && <span className="tt-badge-vip">VIP</span>}
          {isCurrentUser && <span className="tt-me-micro-pill">TÚ</span>}
        </div>

        <div className="tt-rk-sub-line">
          <span
            className="tt-rk-cat-tag"
            style={{ color: cat.color, backgroundColor: cat.badgeBg }}
          >
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
          {isCalibrating ? (
            <span className="tt-calib-pill">
              Prueba {calibPlayed}/{ELO_CONFIG.CALIBRATION_MATCHES}
            </span>
          ) : eff !== null && eff > 0 ? (
            <span className="tt-eff-label">
              {wins}V – {losses}D · {eff}%
            </span>
          ) : (
            <span className="tt-eff-label is-fresh">Listo para debutar</span>
          )}

          {wins > 0 && streak >= 1 && (
            <span className={`tt-streak-badge ${streak >= 3 ? 'is-hot' : ''}`}>
              {streak >= 3 ? `🔥 ${streak} seguidas` : `Racha +${streak}`}
            </span>
          )}
        </div>
      </div>

      {/* 4. Columna Derecha: Puntos ligeramente más compactos + H2H elegante */}
      <div className="tt-rk-points-col">
        <strong className="tt-rk-points-val">
          {Number(player.points || 0).toLocaleString('es-PE')}
        </strong>
        <span className="tt-rk-points-unit">PTS</span>

        {!isCurrentUser && onOpenHeadToHead && (
          <button
            type="button"
            className="tt-rk-h2h-mini"
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
   VISTA PRINCIPAL: RankingView (LIMPIA, ARTESANAL Y CON IDENTIDAD POR RAMA)
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
  const [activeSubTab, setActiveSubTab] = useState('oficial'); // 'oficial' | 'temporadas' | 'clubes'
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRewardsGuide, setShowRewardsGuide] = useState(false);
  const [expandedSeasonIds, setExpandedSeasonIds] = useState({});

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

  /* 1. Clasificación Oficial filtrada e independiente por rama y categoría */
  const rankedPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return [...(players || [])]
      .filter((p) => {
        if (divisionFilter === 'Varones' && p.division !== 'Varones') return false;
        if (divisionFilter === 'Damas' && p.division !== 'Damas') return false;
        if (divisionFilter === 'SENIOR_40' && (Number(p.age) || 0) < 40) return false;

        if (categoryFilter !== 'ALL') {
          if (getCategoryByPoints(p.points).id !== categoryFilter) return false;
        }

        if (q) {
          const hay = `${p.name || ''} ${p.clubName || ''} ${p.credentialId || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const diffPts = (Number(b.points) || 0) - (Number(a.points) || 0);
        if (diffPts !== 0) return diffPts;
        return (Number(b.wins) || 0) - (Number(a.wins) || 0);
      });
  }, [players, divisionFilter, categoryFilter, searchQuery]);

  const myRankInCurrentView = useMemo(() => {
    if (!currentUser?.id) return null;
    const idx = rankedPlayers.findIndex((p) => p.id === currentUser.id);
    return idx >= 0 ? idx + 1 : null;
  }, [rankedPlayers, currentUser]);

  const showTop3Podium = rankedPlayers.length >= 3 && searchQuery.trim().length === 0;
  const podiumPlayers = showTop3Podium ? rankedPlayers.slice(0, 3) : [];
  const listPlayers = showTop3Podium ? rankedPlayers.slice(3) : rankedPlayers;
  const listStartRank = showTop3Podium ? 4 : 1;

  /* 2. Carrera Anual de Temporadas -> Master Top 8 */
  const masterTop8Rows = useMemo(() => {
    const engineDiv =
      divisionFilter === 'Varones' || divisionFilter === 'Damas' ? divisionFilter : 'ALL';
    let rows = computeMasterTop8Race(safeSnapshots, players, engineDiv, categoryFilter);

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

  /* 3. Ranking de Clubes */
  const clubsStandings = useMemo(() => {
    return (clubs || [])
      .map((club) => {
        const members = (players || []).filter((p) => p.clubId === club.id);
        const totalPoints = members.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
        const avgPoints = members.length > 0 ? Math.round(totalPoints / members.length) : 0;
        const totalWins = members.reduce((sum, p) => sum + (Number(p.wins) || 0), 0);
        const totalLosses = members.reduce((sum, p) => sum + (Number(p.losses) || 0), 0);
        const totalMatches = totalWins + totalLosses;
        const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
        const topPlayer = [...members].sort(
          (a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)
        )[0];

        return {
          club,
          membersCount: members.length,
          totalPoints,
          avgPoints,
          winRate,
          topPlayer,
        };
      })
      .sort((a, b) => {
        if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints;
        return b.totalPoints - a.totalPoints;
      });
  }, [clubs, players]);

  const getPlayerMatchesCount = (p) => (Number(p?.wins) || 0) + (Number(p?.losses) || 0);

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

  const activeCategoryObj = CATEGORIES_SCALE.find((c) => c.id === categoryFilter) || null;
  const activeTabIdx = activeSubTab === 'oficial' ? 0 : activeSubTab === 'temporadas' ? 1 : 2;

  const dynamicDivisionVars = {
    '--rk-accent': theme === 'light' ? divisionTheme.accentLight : divisionTheme.accent,
    '--rk-accent-vivid': divisionTheme.accent,
    '--rk-accent-on-fill': divisionTheme.accentTextOnFill,
    '--rk-pill-grad': divisionTheme.pillGrad,
    '--rk-soft-bg': divisionTheme.softBg,
    '--rk-soft-border': divisionTheme.softBorder,
    '--rk-glow': divisionTheme.glow,
    '--rk-stage-grad': divisionTheme.stageGrad,
  };

  return (
    <section
      className={`tt-ranking-view ${theme === 'light' ? 'is-light' : 'is-dark'} is-div-${divisionFilter.toLowerCase()}`}
      style={dynamicDivisionVars}
      aria-label="Clasificación Oficial TOTAL TENIS"
    >
      {/* ====================================================================
          1. BARRA SUPERIOR DIRECTA (SIN BANNER GIGANTE): CLASIFICACIÓN | TEMPORADAS | CLUBES
          Con indicador deslizante físico animado (spring cubic-bezier)
          ==================================================================== */}
      <div className="tt-rk-subtabs" role="tablist" aria-label="Vistas del Ranking">
        <span
          className="tt-rk-subtab-slider"
          aria-hidden="true"
          style={{ transform: `translateX(${activeTabIdx * 100}%)` }}
        />
        {[
          { id: 'oficial', label: 'Clasificación' },
          { id: 'temporadas', label: 'Temporadas' },
          { id: 'clubes', label: 'Clubes' },
        ].map((tab) => (
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====================================================================
          2. BUSCADOR + FILTROS INDEPENDIENTES CON PALETA VIVA POR DIVISIÓN
          ==================================================================== */}
      {activeSubTab !== 'clubes' && (
        <div className="tt-rk-filters-wrap">
          <div className="tt-rk-search-row">
            <div className="tt-rk-search-bar">
              <TTIcon name="search" size={17} style={{ opacity: 0.65, flexShrink: 0 }} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar jugador por nombre o club..."
                aria-label="Buscar en la clasificación"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="tt-rk-clear-btn"
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
                className="tt-rk-mypos-chip"
                onClick={handleJumpToMyRow}
                title="Ir a mi posición actual"
              >
                <small>MI PUESTO</small>
                <strong>#{myRankInCurrentView}</strong>
              </button>
            )}
          </div>

          {/* Divisiones con identidad cromática propia: General | Varones (Arcilla) | Damas (Orquídea) | +40 Senior (Oro) */}
          <div className="tt-rk-div-row" role="group" aria-label="Filtrar por rama o división">
            {DIVISION_FILTERS.map((div) => {
              const isSelected = divisionFilter === div.id;
              return (
                <button
                  key={div.id}
                  type="button"
                  className={`tt-rk-div-pill ${isSelected ? 'is-active' : ''}`}
                  style={
                    isSelected
                      ? {
                          background: div.pillGrad,
                          color: div.accentTextOnFill,
                          borderColor: 'transparent',
                          boxShadow: `0 6px 18px ${div.glow}`,
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
                    style={{ backgroundColor: isSelected ? div.accentTextOnFill : div.accent }}
                    aria-hidden="true"
                  />
                  <span>{div.label}</span>
                </button>
              );
            })}
          </div>

          {/* Categorías dentro de la división activa (Varones, Damas o General) */}
          {divisionFilter !== 'SENIOR_40' && (
            <div className="tt-rk-pills-row">
              <button
                type="button"
                className={`tt-rk-pill ${categoryFilter === 'ALL' ? 'is-active' : ''}`}
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
                  className={`tt-rk-pill ${categoryFilter === cat.id ? 'is-active' : ''}`}
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
          VISTA A: CLASIFICACIÓN + PODIO TOP 3 RECALCULADO POR RAMA/CATEGORÍA
          ==================================================================== */}
      {activeSubTab === 'oficial' && (
        <div
          key={`of-${divisionFilter}-${categoryFilter}`}
          className="tt-rk-content-stack tt-rk-panel-morph"
        >
          {rankedPlayers.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin jugadores en este filtro todavía"
              description={`No hay jugadores registrados en ${divisionTheme.label}${
                activeCategoryObj ? ` · ${activeCategoryObj.name}` : ''
              }.`}
              actionLabel="Ver clasificación completa"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              {/* PODIO CEREMONIAL TOP 3 (RECALCULADO PARA VARONES / DAMAS / +40 SENIOR) */}
              {showTop3Podium && (
                <div className="tt-podium-stage">
                  <div className="tt-podium-stage-head">
                    <span className="tt-podium-kicker">
                      PODIO TOP 3 ·{' '}
                      {activeCategoryObj
                        ? `${divisionTheme.label.toUpperCase()} · ${activeCategoryObj.name.toUpperCase()}`
                        : divisionTheme.shortTag}
                    </span>
                    <span className="tt-podium-quorum-note">
                      Mínimo {ELO_CONFIG.MIN_MATCHES_SEASON_TROPHY} partidos para premio
                    </span>
                  </div>

                  <div className="tt-podium-grid">
                    {[
                      { player: podiumPlayers[1], rank: 2, orderCls: 'is-second' },
                      { player: podiumPlayers[0], rank: 1, orderCls: 'is-first' },
                      { player: podiumPlayers[2], rank: 3, orderCls: 'is-third' },
                    ].map(({ player, rank, orderCls }) => {
                      if (!player) return null;
                      const medal = MEDAL_PALETTE[rank];
                      const club = getClubById(clubs, player.clubId);
                      const cat = getCategoryByPoints(player.points);
                      const matchesPlayed = getPlayerMatchesCount(player);
                      const hasQuorum = matchesPlayed >= ELO_CONFIG.MIN_MATCHES_SEASON_TROPHY;
                      const isMe = Boolean(currentUser && currentUser.id === player.id);

                      return (
                        <article
                          key={player.id}
                          id={isMe ? 'tt-my-ranking-row' : undefined}
                          className={`tt-podium-card ${orderCls} ${isMe ? 'is-me-halo' : ''}`}
                          style={{
                            borderColor: `${medal.primary}80`,
                            boxShadow:
                              rank === 1
                                ? `0 18px 36px ${medal.glow}`
                                : `0 10px 24px rgba(10, 2, 20, 0.28)`,
                          }}
                          onClick={() => {
                            triggerHaptic('light');
                            if (onOpenPlayerProfile) onOpenPlayerProfile(player);
                          }}
                        >
                          {rank === 1 && <span className="tt-podium-sheen" aria-hidden="true" />}

                          <span
                            className="tt-podium-tier-tag"
                            style={{ color: medal.primary }}
                          >
                            {medal.label}
                          </span>

                          <LaurelWreathAvatar
                            rank={rank}
                            player={player}
                            club={club}
                            size={rank === 1 ? 66 : 52}
                            onClick={onOpenPlayerProfile}
                          />

                          <strong className="tt-podium-name">{player.name}</strong>

                          <span
                            className="tt-podium-cat"
                            style={{ color: cat.color, backgroundColor: cat.badgeBg }}
                          >
                            {cat.name}
                          </span>

                          <div className="tt-podium-pts">
                            <strong>{Number(player.points || 0).toLocaleString('es-PE')}</strong>
                            <span>PTS</span>
                          </div>

                          <span className={`tt-quorum-dot ${hasQuorum ? 'is-ok' : 'is-pending'}`}>
                            {hasQuorum
                              ? 'Apto premio'
                              : `${matchesPlayed}/${ELO_CONFIG.MIN_MATCHES_SEASON_TROPHY} PJ`}
                          </span>

                          {!isMe && onQuickChallenge && (
                            <button
                              type="button"
                              className="tt-podium-reto-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('medium');
                                onQuickChallenge(player);
                              }}
                            >
                              Retar
                            </button>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LISTA DE POSICIONES CON RETRATO VERTICAL GRANDE Y ENTRADA ESCALONADA */}
              {listPlayers.length > 0 && (
                <div className="tt-rk-table-shell">
                  <div className="tt-rk-table-head">
                    <span>PUESTO</span>
                    <span>JUGADOR & CATEGORÍA</span>
                    <span>PUNTOS</span>
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
                            animIndex={idx}
                            club={club}
                            isCurrentUser={isMe}
                            showLaurelMini={!showTop3Podium}
                            divisionTheme={divisionTheme}
                            onOpenProfile={onOpenPlayerProfile}
                            onQuickChallenge={onQuickChallenge}
                            onOpenHeadToHead={onOpenHeadToHead}
                          />

                          {rank === 8 && listPlayers.length > idx + 1 && (
                            <div className="tt-master-cutoff-divider" role="separator">
                              <span className="tt-cutoff-line" />
                              <span className="tt-cutoff-pill">
                                <TTIcon name="trophy" size={13} />
                                ZONA CLASIFICATORIA · MASTER TOP 8
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
          VISTA B: TEMPORADAS (ACORDEÓN TÁCTIL + BOTÓN DORADO MASTER TOP 8)
          ==================================================================== */}
      {activeSubTab === 'temporadas' && (
        <div
          key={`temp-${divisionFilter}-${categoryFilter}`}
          className="tt-rk-content-stack tt-rk-panel-morph"
        >
          <div className="tt-seasons-banner">
            <div className="tt-seasons-banner-top">
              <IconBadge name="trophy" variant="gold" size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="tt-seasons-kicker">CARRERA ANUAL · {safeSnapshots.year}</span>
                <h2 className="tt-seasons-title">Puntos Totales al Master Top 8</h2>
              </div>
            </div>

            <p className="tt-seasons-desc">
              Al cierre de cada trimestre se guarda tu puntaje de esa temporada. La suma de las 4 temporadas clasifica a los 8 primeros al Torneo de Maestros sin costo de inscripción.
            </p>

            {/* Estado natural de las 4 temporadas (sin tecnicismos) */}
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
                    <small>
                      {s.locked ? 'Terminada' : isCurrent ? 'En curso' : 'Próxima'}
                    </small>
                  </div>
                );
              })}
            </div>

            {/* Botón Dorado Animado directo a Master Top 8 + Guía de Premios */}
            <div className="tt-seasons-actions-row">
              {onGoToTournaments && (
                <button
                  type="button"
                  className="tt-master-gold-cta"
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
                className="tt-btn tt-btn-ghost tt-btn-sm"
                onClick={() => {
                  triggerHaptic('light');
                  setShowRewardsGuide((v) => !v);
                }}
              >
                <TTIcon name="trophy" size={15} />
                {showRewardsGuide ? 'Ocultar premios' : 'Premios del año'}
              </button>
            </div>
          </div>

          {showRewardsGuide && (
            <div className="tt-rewards-split-grid">
              <div className="tt-reward-box">
                <span className="tt-reward-kicker">{SEASON_QUARTERLY_REWARDS.badge}</span>
                <h3>{SEASON_QUARTERLY_REWARDS.title}</h3>
                <p>{SEASON_QUARTERLY_REWARDS.sustainabilityRule}</p>
                <div className="tt-reward-podium-list">
                  {SEASON_QUARTERLY_REWARDS.podium.map((p) => (
                    <div key={p.place} className="tt-reward-item">
                      <strong>{p.label}</strong>
                      <span>{p.physicalItems.join(' + ')}</span>
                      <small>
                        {p.gemsRangeLabel} · {p.digitalPerk}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tt-reward-box is-annual">
                <span className="tt-reward-kicker is-gold">
                  {ANNUAL_MASTER_TOP8_REWARDS.badge}
                </span>
                <h3>{ANNUAL_MASTER_TOP8_REWARDS.title}</h3>
                <p>{ANNUAL_MASTER_TOP8_REWARDS.qualificationRule}</p>
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

          {/* ACORDEÓN TÁCTIL DE TEMPORADAS (SIN SCROLL HORIZONTAL) */}
          {masterTop8Rows.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin jugadores en este filtro"
              description="Cambia la rama o categoría para consultar los puntos acumulados del año."
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
                      style={{ '--rk-delay': `${Math.min(idx, 10) * 38}ms` }}
                    >
                      <button
                        type="button"
                        className="tt-acc-trigger"
                        aria-expanded={isOpen}
                        onClick={() => toggleSeasonAccordion(row.player.id)}
                      >
                        <span
                          className={`tt-race-rank-pill ${
                            row.qualifiesMasterTop8 ? 'is-in' : ''
                          }`}
                        >
                          #{row.raceRank}
                        </span>

                        <div className="tt-acc-avatar-frame">
                          <SmartImage
                            src={row.player.avatar}
                            alt={row.player.name}
                            initials={row.player.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center top',
                            }}
                          />
                        </div>

                        <div className="tt-acc-player-meta">
                          <strong>{row.player.name}</strong>
                          <small>
                            {row.category.name}
                            {club ? ` · ${club.shortName}` : ' · Independiente'}
                          </small>
                        </div>

                        <div className="tt-acc-total-col">
                          <small>PUNTOS TOTALES</small>
                          <strong>{row.totalAnnual.toLocaleString('es-PE')}</strong>
                        </div>

                        <span className={`tt-acc-chevron ${isOpen ? 'is-rotated' : ''}`} aria-hidden="true">
                          ▾
                        </span>
                      </button>

                      {/* Desglose desplegable T1 · T2 · T3 · T4 */}
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
                                  <small>
                                    {sMeta?.locked
                                      ? 'Terminada'
                                      : isCurrent
                                      ? 'En curso'
                                      : 'Próxima'}
                                  </small>
                                </div>
                              );
                            })}
                          </div>

                          <div className="tt-acc-footer">
                            <span className="tt-acc-status-tag">
                              {row.qualifiesMasterTop8
                                ? '✓ En zona de clasificación al Master Top 8'
                                : 'Sigue sumando para entrar al Top 8'}
                            </span>
                            <button
                              type="button"
                              className="tt-acc-profile-link"
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
                          <TTIcon name="crown" size={13} />
                          CORTE CLASIFICATORIO · TOP 8 MASTER
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
          VISTA C: RANKING DE CLUBES
          ==================================================================== */}
      {activeSubTab === 'clubes' && (
        <div className="tt-rk-content-stack tt-rk-panel-morph">
          <div className="tt-clubs-war-intro">
            <IconBadge name="shield" variant="emerald" size={40} />
            <div>
              <span className="tt-seasons-kicker">COPA DE SEDES OFICIALES</span>
              <h2 className="tt-seasons-title">Ranking de Clubes</h2>
              <p className="tt-seasons-desc" style={{ marginTop: 4 }}>
                Ordenado por puntaje promedio de los jugadores registrados en cada sede. Cada victoria suma prestigio para tu club.
              </p>
            </div>
          </div>

          <div className="tt-clubs-standings-grid">
            {clubsStandings.map((item, idx) => {
              const rank = idx + 1;
              const medal = MEDAL_PALETTE[rank];

              return (
                <article
                  key={item.club.id}
                  className={`tt-club-rank-card ${rank === 1 ? 'is-leader' : ''}`}
                  style={{
                    borderColor: medal ? `${medal.primary}75` : undefined,
                    '--rk-delay': `${idx * 65}ms`,
                  }}
                >
                  <div className="tt-club-rank-head">
                    <span
                      className="tt-club-rank-num"
                      style={medal ? { color: medal.primary } : undefined}
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
                        {item.club.district} · {item.club.courtsCount} canchas de arcilla
                      </span>
                    </div>

                    <div className="tt-club-avg-badge">
                      <strong>{item.avgPoints.toLocaleString('es-PE')}</strong>
                      <span>PROMEDIO</span>
                    </div>
                  </div>

                  <div className="tt-club-metrics-row">
                    <div>
                      <span>Jugadores</span>
                      <strong>{item.membersCount}</strong>
                    </div>
                    <div>
                      <span>Puntos totales</span>
                      <strong>{item.totalPoints.toLocaleString('es-PE')}</strong>
                    </div>
                    <div>
                      <span>Victorias</span>
                      <strong>{item.winRate}%</strong>
                    </div>
                  </div>

                  {item.topPlayer && (
                    <button
                      type="button"
                      className="tt-club-top-rep"
                      onClick={() => {
                        triggerHaptic('light');
                        if (onOpenPlayerProfile) onOpenPlayerProfile(item.topPlayer);
                      }}
                    >
                      <SmartImage
                        src={item.topPlayer.avatar}
                        alt={item.topPlayer.name}
                        initials={item.topPlayer.name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                          border: '2px solid #00DC7D',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <small>Líder de la sede</small>
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

      {/* ====================================================================
          ESTILOS ARTESANALES Y COREOGRAFÍA DE ANIMACIONES DIFERENCIADAS
          ==================================================================== */}
      <style>{`
        .tt-ranking-view {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        /* 1. SUB-TABS CON SLIDER FÍSICO ELÁSTICO */
        .tt-rk-subtabs {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 4px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular);
        }
        .tt-rk-subtab-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc((100% - 8px) / 3);
          border-radius: 13px;
          background: var(--rk-pill-grad);
          box-shadow: 0 6px 16px var(--rk-glow);
          transition:
            transform 340ms cubic-bezier(0.22, 1.22, 0.36, 1),
            background 360ms ease,
            box-shadow 360ms ease;
          pointer-events: none;
          z-index: 0;
        }
        .tt-ranking-view.is-light .tt-rk-subtab-slider {
          background: #1E0734;
          box-shadow: 0 6px 16px rgba(30, 7, 52, 0.22);
        }
        .tt-rk-subtab {
          position: relative;
          z-index: 1;
          min-height: 40px;
          border-radius: 13px;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          transition: color 240ms ease, transform 140ms ease;
        }
        .tt-rk-subtab:active {
          transform: scale(0.96);
        }
        .tt-rk-subtab.is-active {
          color: var(--rk-accent-on-fill);
          font-weight: 900;
        }
        .tt-ranking-view.is-light .tt-rk-subtab.is-active {
          color: #00DC7D;
        }

        /* 2. BUSCADOR + BOTÓN MI PUESTO + PÍLDORAS DE RAMA CON PALETA PROPIA */
        .tt-rk-filters-wrap {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-rk-search-row {
          display: flex;
          align-items: stretch;
          gap: 8px;
        }
        .tt-rk-search-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 44px;
          padding: 0 13px;
          border-radius: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular);
          transition: border-color 220ms ease, box-shadow 220ms ease;
        }
        .tt-rk-search-bar:focus-within {
          border-color: var(--rk-accent-vivid);
          box-shadow: 0 0 0 3px var(--rk-soft-bg);
        }
        .tt-rk-search-bar input {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--tt-text);
          font-size: 16px;
          outline: none;
        }
        .tt-rk-clear-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--tt-surface-2);
          color: var(--tt-text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-rk-mypos-chip {
          padding: 0 12px;
          border-radius: 15px;
          background: var(--rk-soft-bg);
          border: 1.5px solid var(--rk-soft-border);
          color: var(--tt-text);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 200ms cubic-bezier(0.22, 1.35, 0.36, 1), border-color 300ms ease;
        }
        .tt-rk-mypos-chip:active {
          transform: scale(0.93);
        }
        .tt-rk-mypos-chip small {
          font-size: 0.52rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          opacity: 0.78;
        }
        .tt-rk-mypos-chip strong {
          font-family: var(--tt-font-display);
          font-size: 1.08rem;
          line-height: 1;
          color: var(--rk-accent);
        }

        /* Selector de Rama: Varones (Arcilla) | Damas (Orquídea) | +40 Senior (Oro) */
        .tt-rk-div-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding: 2px 1px 4px;
          scrollbar-width: none;
        }
        .tt-rk-div-row::-webkit-scrollbar { display: none; }
        .tt-rk-div-pill {
          flex-shrink: 0;
          min-height: 36px;
          padding: 0 13px;
          border-radius: 999px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text-secondary);
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.76rem;
          font-weight: 800;
          transition:
            transform 240ms cubic-bezier(0.22, 1.35, 0.36, 1),
            background 320ms ease,
            color 220ms ease,
            box-shadow 320ms ease,
            border-color 260ms ease;
        }
        .tt-rk-div-pill:active {
          transform: scale(0.94);
        }
        .tt-rk-div-pill.is-active {
          transform: translateY(-1px);
          font-weight: 900;
        }
        .tt-rk-div-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: transform 260ms cubic-bezier(0.22, 1.4, 0.36, 1);
        }
        .tt-rk-div-pill.is-active .tt-rk-div-dot {
          transform: scale(1.2);
        }

        .tt-rk-pills-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tt-rk-pills-row::-webkit-scrollbar { display: none; }
        .tt-rk-pill {
          flex-shrink: 0;
          min-height: 33px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 0.73rem;
          font-weight: 700;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          transition: all 240ms ease;
        }
        .tt-rk-pill.is-active {
          background: var(--rk-soft-bg);
          border-color: var(--rk-soft-border);
          color: var(--rk-accent);
          font-weight: 900;
        }

        .tt-rk-content-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Transición suave y perceptible al cambiar de rama o vista */
        .tt-rk-panel-morph {
          animation: ttRkPanelEnter 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ttRkPanelEnter {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.992);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* 3. PODIO CEREMONIAL TOP 3 CON ATMÓSFERA DE RAMA Y ELEVACIÓN ESCALONADA */
        .tt-podium-stage {
          border-radius: 24px;
          padding: 15px 12px 16px;
          background: var(--rk-stage-grad);
          border: 1.5px solid var(--rk-soft-border);
          box-shadow: var(--tt-card-specular), 0 16px 38px rgba(8, 1, 18, 0.42);
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          gap: 13px;
          transition: background 420ms ease, border-color 380ms ease;
        }
        .tt-podium-stage-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-podium-kicker {
          font-size: 0.67rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #FDE68A;
        }
        .tt-podium-quorum-note {
          font-size: 0.67rem;
          font-weight: 700;
          color: rgba(250, 249, 245, 0.7);
        }
        .tt-podium-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: end;
          gap: 8px;
        }
        .tt-podium-card {
          position: relative;
          overflow: hidden;
          border-radius: 19px;
          padding: 11px 6px 12px;
          background: rgba(250, 249, 245, 0.06);
          border: 1.5px solid rgba(250, 249, 245, 0.16);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 5px;
          cursor: pointer;
          transition: transform 240ms cubic-bezier(0.22, 1.3, 0.36, 1);
          animation: ttPodiumRise 480ms cubic-bezier(0.22, 1.18, 0.36, 1) both;
        }
        .tt-podium-card.is-second { animation-delay: 80ms; }
        .tt-podium-card.is-third { animation-delay: 150ms; }
        .tt-podium-card.is-first {
          padding-top: 15px;
          padding-bottom: 14px;
          background: linear-gradient(
            180deg,
            rgba(245, 158, 11, 0.22) 0%,
            rgba(250, 249, 245, 0.07) 100%
          );
          transform: translateY(-5px);
          animation-delay: 10ms;
        }
        .tt-podium-card:active {
          transform: scale(0.96);
        }
        @keyframes ttPodiumRise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        /* Destello diagonal dorado exclusivo del #1 */
        .tt-podium-sheen {
          position: absolute;
          inset: -40%;
          background: linear-gradient(
            115deg,
            transparent 38%,
            rgba(254, 240, 138, 0.16) 49%,
            rgba(254, 240, 138, 0.03) 56%,
            transparent 64%
          );
          transform: translateX(-100%);
          animation: ttGoldSheen 5.2s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ttGoldSheen {
          0%, 62% { transform: translateX(-110%); }
          100% { transform: translateX(120%); }
        }
        .tt-podium-tier-tag {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .tt-laurel-avatar-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          background: transparent;
          flex-shrink: 0;
        }
        .tt-laurel-svg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .tt-laurel-ring {
          border-radius: 50%;
          padding: 2.5px;
          position: relative;
          z-index: 1;
        }
        .tt-laurel-club-dot {
          position: absolute;
          right: 6px;
          bottom: 12px;
          z-index: 3;
          width: 21px;
          height: 21px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1.5px solid #1E0734;
          overflow: hidden;
        }
        .tt-laurel-rank-pill {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 0.64rem;
          font-weight: 900;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
        }
        .tt-podium-name {
          font-size: 0.78rem;
          font-weight: 800;
          line-height: 1.15;
          color: #FAF9F5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.2em;
        }
        .tt-podium-cat {
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.61rem;
          font-weight: 800;
        }
        .tt-podium-pts {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }
        .tt-podium-pts strong {
          font-family: var(--tt-font-display);
          font-size: 1.06rem;
          font-weight: 900;
          color: #00DC7D;
          font-variant-numeric: tabular-nums;
        }
        .tt-podium-pts span {
          font-size: 0.56rem;
          font-weight: 800;
          opacity: 0.72;
        }
        .tt-quorum-dot {
          font-size: 0.59rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 999px;
        }
        .tt-quorum-dot.is-ok {
          background: rgba(0, 220, 125, 0.16);
          color: #7CF5C0;
        }
        .tt-quorum-dot.is-pending {
          background: rgba(250, 249, 245, 0.12);
          color: rgba(250, 249, 245, 0.72);
        }
        .tt-podium-reto-btn {
          margin-top: 2px;
          width: 88%;
          min-height: 28px;
          border-radius: 999px;
          background: var(--rk-pill-grad);
          color: var(--rk-accent-on-fill);
          font-size: 0.68rem;
          font-weight: 900;
          box-shadow: 0 4px 12px var(--rk-glow);
          transition: transform 160ms cubic-bezier(0.22, 1.35, 0.36, 1);
        }
        .tt-podium-reto-btn:active {
          transform: scale(0.92);
        }

        /* 4. TABLA DE POSICIONES CON RETRATO RECTANGULAR VERTICAL (58x76) */
        .tt-rk-table-shell {
          border-radius: 22px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          overflow: hidden;
        }
        .tt-rk-table-head {
          display: grid;
          grid-template-columns: 44px 1fr 74px;
          padding: 10px 14px;
          background: var(--tt-surface-2);
          border-bottom: 1px solid var(--tt-border);
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: var(--tt-text-muted);
        }
        .tt-rk-table-head span:last-child { text-align: right; }
        .tt-rk-rows-stack { display: flex; flex-direction: column; }

        .tt-rk-row {
          display: grid;
          grid-template-columns: 38px 62px 1fr auto;
          align-items: center;
          gap: 11px;
          padding: 11px 13px;
          border-bottom: 1px solid var(--tt-border);
          cursor: pointer;
          position: relative;
          transition: background-color 180ms ease, transform 180ms cubic-bezier(0.22, 1.2, 0.36, 1);
          animation: ttRkRowCascade 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--rk-delay, 0ms);
        }
        .tt-rk-row:last-child { border-bottom: none; }
        .tt-rk-row:active {
          background: var(--tt-surface-2);
          transform: scale(0.99);
        }
        @keyframes ttRkRowCascade {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .is-me-halo {
          background: linear-gradient(
            90deg,
            var(--rk-soft-bg) 0%,
            rgba(0, 220, 125, 0.04) 72%,
            var(--rk-soft-bg) 100%
          ) !important;
          box-shadow: inset 3.5px 0 0 var(--rk-accent-vivid);
        }

        .tt-rk-rank-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .tt-rk-rank-num {
          font-family: var(--tt-font-display);
          font-weight: 900;
          font-size: 1.48rem;
          line-height: 0.96;
          color: var(--tt-text);
          font-variant-numeric: tabular-nums;
        }
        .tt-rk-trend {
          font-size: 0.6rem;
          font-weight: 900;
          line-height: 1;
        }
        .tt-rk-trend.is-up { color: #00DC7D; }
        .tt-ranking-view.is-light .tt-rk-trend.is-up { color: #008A4E; }
        .tt-rk-trend.is-down { color: #F87171; }
        .tt-rk-trend.is-flat { color: var(--tt-text-muted); opacity: 0.55; }

        /* Retrato Rectangular Vertical Más Grande (58x76) */
        .tt-rk-portrait-wrap {
          position: relative;
          width: 58px;
          height: 76px;
          flex-shrink: 0;
        }
        .tt-rk-portrait-frame {
          width: 58px;
          height: 76px;
          padding: 2px;
          border-radius: 15px;
          overflow: hidden;
          transition: background 340ms ease, box-shadow 340ms ease;
        }
        .tt-rk-portrait-frame > * {
          border-radius: 13px;
        }
        .tt-rk-quick-reto {
          position: absolute;
          right: -6px;
          bottom: -4px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #1B0630;
          border: 1.5px solid var(--rk-accent-vivid);
          color: var(--rk-accent-vivid);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.38);
          transition: transform 180ms cubic-bezier(0.22, 1.4, 0.36, 1);
        }
        .tt-rk-quick-reto:active {
          transform: scale(0.86);
        }

        .tt-rk-info-col {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tt-rk-name-line {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
        .tt-rk-name {
          font-size: 0.94rem;
          font-weight: 800;
          color: var(--tt-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 175px;
        }
        .tt-me-micro-pill {
          padding: 1px 6px;
          border-radius: 999px;
          background: var(--rk-accent-vivid);
          color: var(--rk-accent-on-fill);
          font-size: 0.58rem;
          font-weight: 900;
        }
        .tt-rk-sub-line {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tt-rk-cat-tag {
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 800;
        }
        .tt-rk-club-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.71rem;
          font-weight: 600;
          color: var(--tt-text-muted);
        }
        .tt-rk-metrics-line {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tt-eff-label {
          font-size: 0.69rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }
        .tt-eff-label.is-fresh { color: #38BDF8; }
        .tt-calib-pill {
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.16);
          color: #38BDF8;
          font-size: 0.63rem;
          font-weight: 800;
        }
        .tt-streak-badge {
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.16);
          color: #F59E0B;
          font-size: 0.62rem;
          font-weight: 900;
        }
        .tt-streak-badge.is-hot {
          background: rgba(249, 115, 22, 0.18);
          border: 1px solid rgba(249, 115, 22, 0.55);
          color: #FB923C;
        }

        /* Puntos ligeramente más pequeños y proporcionados */
        .tt-rk-points-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }
        .tt-rk-points-val {
          font-family: var(--tt-font-display);
          font-size: 1.34rem;
          font-weight: 900;
          line-height: 0.98;
          color: var(--rk-accent);
          font-variant-numeric: tabular-nums;
          transition: color 300ms ease;
        }
        .tt-rk-points-unit {
          font-size: 0.56rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--tt-text-muted);
        }
        .tt-rk-h2h-mini {
          margin-top: 4px;
          padding: 3px 9px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid var(--tt-border-medium);
          color: var(--tt-text-secondary);
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          transition: border-color 180ms ease, color 180ms ease, transform 150ms ease;
        }
        .tt-rk-h2h-mini:active {
          transform: scale(0.92);
          border-color: var(--rk-accent-vivid);
          color: var(--rk-accent);
        }

        /* Línea de corte Master Top 8 */
        .tt-master-cutoff-divider {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(245, 158, 11, 0.08);
          border-bottom: 1px solid var(--tt-border);
        }
        .tt-master-cutoff-divider.is-rounded {
          border-radius: 14px;
          border: 1px dashed rgba(245, 158, 11, 0.45);
        }
        .tt-cutoff-line {
          flex: 1;
          height: 1px;
          border-top: 1.5px dashed rgba(245, 158, 11, 0.65);
        }
        .tt-cutoff-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #1E0734;
          color: #FDE68A;
          border: 1px solid rgba(245, 158, 11, 0.55);
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        /* 5. TEMPORADAS: BANNER + BOTÓN DORADO CON DESTELLO + ACORDEÓN TÁCTIL */
        .tt-seasons-banner {
          border-radius: 22px;
          padding: 16px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-seasons-banner-top { display: flex; align-items: center; gap: 11px; }
        .tt-seasons-kicker {
          display: block;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #F59E0B;
        }
        .tt-seasons-title {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.3rem;
          font-weight: 900;
          line-height: 1.06;
        }
        .tt-seasons-desc {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.44;
          color: var(--tt-text-muted);
        }
        .tt-quarters-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .tt-quarter-chip {
          padding: 8px 5px;
          border-radius: 13px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-quarter-chip strong { font-size: 0.82rem; font-weight: 900; }
        .tt-quarter-chip span { font-size: 0.62rem; color: var(--tt-text-muted); }
        .tt-quarter-chip small { font-size: 0.59rem; font-weight: 800; }
        .tt-quarter-chip.is-done { border-color: rgba(245, 158, 11, 0.42); }
        .tt-quarter-chip.is-done small { color: #D97706; }
        .tt-quarter-chip.is-live {
          border-color: rgba(0, 220, 125, 0.55);
          background: rgba(0, 220, 125, 0.12);
        }
        .tt-quarter-chip.is-live small { color: var(--tt-emerald-text); }

        .tt-seasons-actions-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        /* Botón Dorado Exclusivo Master Top 8 con brillo metálico deslizante */
        .tt-master-gold-cta {
          position: relative;
          overflow: hidden;
          flex: 1;
          min-width: 175px;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, #FEF08A 0%, #F59E0B 48%, #B45309 100%);
          color: #1A0D00;
          font-size: 0.82rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.65),
            0 10px 24px rgba(245, 158, 11, 0.36);
          transition: transform 200ms cubic-bezier(0.22, 1.35, 0.36, 1);
        }
        .tt-master-gold-cta:active {
          transform: scale(0.96);
        }
        .tt-master-gold-sweep {
          position: absolute;
          inset: -20%;
          background: linear-gradient(
            110deg,
            transparent 35%,
            rgba(255, 255, 255, 0.48) 50%,
            transparent 65%
          );
          transform: translateX(-115%);
          animation: ttGoldSheen 3.8s ease-in-out infinite;
          pointer-events: none;
        }
        .tt-master-arrow {
          font-size: 1rem;
          transition: transform 220ms ease;
        }
        .tt-master-gold-cta:hover .tt-master-arrow {
          transform: translateX(3px);
        }

        /* Tarjetas Acordeón de Temporadas */
        .tt-season-acc-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-acc-card {
          border-radius: 18px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          overflow: hidden;
          transition: border-color 240ms ease, box-shadow 260ms ease;
          animation: ttRkRowCascade 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--rk-delay, 0ms);
        }
        .tt-acc-card.is-open {
          border-color: var(--rk-soft-border);
          box-shadow: var(--tt-card-specular), 0 12px 28px var(--rk-glow);
        }
        .tt-acc-trigger {
          width: 100%;
          padding: 11px 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          color: var(--tt-text);
        }
        .tt-race-rank-pill {
          min-width: 30px;
          height: 28px;
          padding: 0 6px;
          border-radius: 9px;
          font-family: var(--tt-font-display);
          font-size: 0.98rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--tt-surface-2);
          color: var(--tt-text-muted);
          flex-shrink: 0;
        }
        .tt-race-rank-pill.is-in {
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
        }
        .tt-ranking-view.is-light .tt-race-rank-pill.is-in {
          background: #1E0734;
          color: #FDE68A;
        }
        .tt-acc-avatar-frame {
          width: 40px;
          height: 48px;
          border-radius: 11px;
          overflow: hidden;
          border: 1.5px solid var(--rk-soft-border);
          flex-shrink: 0;
        }
        .tt-acc-player-meta {
          flex: 1;
          min-width: 0;
        }
        .tt-acc-player-meta strong {
          display: block;
          font-size: 0.88rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-acc-player-meta small {
          display: block;
          font-size: 0.69rem;
          color: var(--tt-text-muted);
        }
        .tt-acc-total-col {
          text-align: right;
          flex-shrink: 0;
        }
        .tt-acc-total-col small {
          display: block;
          font-size: 0.52rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: var(--tt-text-muted);
        }
        .tt-acc-total-col strong {
          font-family: var(--tt-font-display);
          font-size: 1.28rem;
          line-height: 1;
          color: #F59E0B;
          font-variant-numeric: tabular-nums;
        }
        .tt-ranking-view.is-light .tt-acc-total-col strong {
          color: #B45309;
        }
        .tt-acc-chevron {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--tt-surface-2);
          color: var(--tt-text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.86rem;
          flex-shrink: 0;
          transition: transform 280ms cubic-bezier(0.22, 1.3, 0.36, 1), background-color 200ms ease;
        }
        .tt-acc-chevron.is-rotated {
          transform: rotate(180deg);
          background: var(--rk-soft-bg);
          color: var(--rk-accent);
        }

        .tt-acc-body {
          padding: 0 13px 13px;
          border-top: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: ttAccDrop 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ttAccDrop {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tt-acc-seasons-grid {
          padding-top: 11px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 7px;
        }
        .tt-acc-q-box {
          padding: 8px 6px;
          border-radius: 12px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-acc-q-box span {
          font-size: 0.62rem;
          font-weight: 900;
          color: var(--tt-text-muted);
        }
        .tt-acc-q-box strong {
          font-family: var(--tt-font-display);
          font-size: 1.05rem;
          color: var(--tt-text);
        }
        .tt-acc-q-box small {
          font-size: 0.56rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-acc-q-box.is-live {
          border-color: rgba(0, 220, 125, 0.45);
          background: rgba(0, 220, 125, 0.1);
        }
        .tt-acc-q-box.is-live strong,
        .tt-acc-q-box.is-live small {
          color: var(--tt-emerald-text);
        }
        .tt-acc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-acc-status-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }
        .tt-acc-profile-link {
          padding: 5px 11px;
          border-radius: 999px;
          background: var(--rk-soft-bg);
          color: var(--rk-accent);
          font-size: 0.7rem;
          font-weight: 900;
        }

        /* Cuadro Comparativo Premios */
        .tt-rewards-split-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 720px) {
          .tt-rewards-split-grid { grid-template-columns: 1fr 1fr; }
        }
        .tt-reward-box {
          border-radius: 20px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-reward-box.is-annual { border-color: rgba(245, 158, 11, 0.48); }
        .tt-reward-kicker {
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--tt-emerald-text);
        }
        .tt-reward-kicker.is-gold { color: #F59E0B !important; }
        .tt-reward-box h3 { margin: 0; font-size: 0.98rem; font-weight: 900; }
        .tt-reward-box p { margin: 0; font-size: 0.76rem; line-height: 1.4; color: var(--tt-text-muted); }
        .tt-reward-podium-list { display: flex; flex-direction: column; gap: 7px; }
        .tt-reward-item {
          padding: 9px 11px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.76rem;
        }
        .tt-reward-item small { color: var(--tt-text-muted); font-size: 0.69rem; }

        /* 6. CLUBES */
        .tt-clubs-war-intro {
          border-radius: 20px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .tt-clubs-standings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 720px) {
          .tt-clubs-standings-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .tt-club-rank-card {
          border-radius: 22px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: ttRkRowCascade 400ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--rk-delay, 0ms);
        }
        .tt-club-rank-card.is-leader { box-shadow: var(--tt-card-specular), 0 14px 32px rgba(245, 158, 11, 0.16); }
        .tt-club-rank-head { display: flex; align-items: center; gap: 10px; }
        .tt-club-rank-num { font-family: var(--tt-font-display); font-size: 1.5rem; font-weight: 900; min-width: 28px; }
        .tt-club-logo-frame {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          overflow: hidden;
          background: #FFFFFF;
          border: 1.5px solid var(--tt-border);
          flex-shrink: 0;
        }
        .tt-club-rank-name { display: block; font-size: 0.92rem; font-weight: 800; line-height: 1.18; }
        .tt-club-rank-district { display: block; font-size: 0.72rem; color: var(--tt-text-muted); margin-top: 2px; }
        .tt-club-avg-badge { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
        .tt-club-avg-badge strong { font-family: var(--tt-font-display); font-size: 1.38rem; line-height: 0.96; color: var(--tt-emerald-text); }
        .tt-club-avg-badge span { font-size: 0.56rem; font-weight: 900; letter-spacing: 0.06em; color: var(--tt-text-muted); }
        .tt-club-metrics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 10px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          text-align: center;
        }
        .tt-club-metrics-row span { display: block; font-size: 0.67rem; color: var(--tt-text-muted); }
        .tt-club-metrics-row strong { font-size: 0.92rem; font-weight: 900; }
        .tt-club-top-rep {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          width: 100%;
          transition: border-color 180ms ease;
        }
        .tt-club-top-rep:active { border-color: #00DC7D; }
        .tt-club-top-rep small { display: block; font-size: 0.64rem; color: var(--tt-text-muted); }
        .tt-club-top-rep strong { display: block; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-club-rep-pts { font-size: 0.76rem; font-weight: 800; color: var(--tt-emerald-text); white-space: nowrap; }

        /* Cero lag en equipos antiguos */
        html[data-tier='lite'] .tt-podium-sheen,
        html[data-tier='lite'] .tt-master-gold-sweep { display: none !important; }
        html[data-tier='lite'] .tt-rk-row,
        html[data-tier='lite'] .tt-podium-card,
        html[data-tier='lite'] .tt-acc-card { animation: none !important; }
      `}</style>
    </section>
  );
}
