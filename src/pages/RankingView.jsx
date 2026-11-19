import React, { useMemo, useRef, useState } from 'react';
import {
  ASSETS,
  EmptyStateCard,
  IconBadge,
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
  ANNUAL_MASTER_TOP8_REWARDS,
  SEASON_QUARTERLY_REWARDS,
} from '../data/storeAndTournamentsData';
import { ELO_CONFIG, computeMasterTop8Race } from '../utils/tenisEngine';

/* ==========================================================================
   CONSTANTES DE FILTRO Y METADATOS DE DIVISIÓN
   ========================================================================== */
const DIVISION_FILTERS = [
  { id: 'ALL', label: 'General' },
  { id: 'Varones', label: 'Varones' },
  { id: 'Damas', label: 'Damas' },
  { id: 'SENIOR_40', label: '+40 Senior' },
];

const MEDAL_PALETTE = {
  1: {
    key: 'gold',
    label: '#1 LÍDER',
    primary: '#F59E0B',
    highlight: '#FDE68A',
    deep: '#B45309',
    ring: 'linear-gradient(135deg, #FEF08A 0%, #F59E0B 50%, #B45309 100%)',
    glow: 'rgba(245, 158, 11, 0.34)',
  },
  2: {
    key: 'silver',
    label: '#2 PLATA',
    primary: '#CBD5E1',
    highlight: '#F8FAFC',
    deep: '#64748B',
    ring: 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 52%, #64748B 100%)',
    glow: 'rgba(203, 213, 225, 0.28)',
  },
  3: {
    key: 'bronze',
    label: '#3 BRONCE',
    primary: '#D97706',
    highlight: '#FDBA74',
    deep: '#7C2D12',
    ring: 'linear-gradient(135deg, #FDBA74 0%, #D97706 52%, #7C2D12 100%)',
    glow: 'rgba(217, 119, 6, 0.28)',
  },
};

/* ==========================================================================
   SUBCOMPONENTE 1: CORONA DE LAURELES OLÍMPICOS EN SVG (ORO / PLATA / BRONCE)
   Contornea el avatar circular en el Top 3 de CADA categoría.
   ========================================================================== */
function LaurelWreathAvatar({
  rank = 1,
  player,
  club,
  size = 66,
  onClick,
}) {
  const medal = MEDAL_PALETTE[rank] || MEDAL_PALETTE[1];
  const outer = size + 24;
  const gradId = `tt-laurel-${medal.key}-${player?.id || rank}`;

  return (
    <button
      type="button"
      className="tt-laurel-avatar-btn"
      onClick={() => {
        triggerHaptic('light');
        if (onClick && player) onClick(player);
      }}
      aria-label={`Ver ficha de ${player?.name || 'jugador'} (Puesto #${rank})`}
      style={{ width: outer, height: outer }}
    >
      {/* Ramas de laurel olímpico SVG izquierdo y derecho */}
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

        {/* Rama Izquierda */}
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

        {/* Rama Derecha (Espejo exacto) */}
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

        {/* Estrella/corona sutil superior solo para el #1 Oro */}
        {rank === 1 && (
          <path
            d="M50 4L52.4 9.2L58 9.9L53.8 13.6L54.9 19L50 16.2L45.1 19L46.2 13.6L42 9.9L47.6 9.2L50 4Z"
            fill={`url(#${gradId})`}
          />
        )}
      </svg>

      {/* Avatar circular interior con anillo metálico */}
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

      {/* Micro-escudo del club (oculto si Independiente) */}
      {club?.logo && (
        <span className="tt-laurel-club-dot">
          <SmartImage
            src={club.logo}
            alt={club.shortName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </span>
      )}

      {/* Medalla numérica inferior (#1 / #2 / #3) */}
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
   SUBCOMPONENTE 2: FILA OFICIAL DE RANKING ESTILO WTA / ATP BROADCAST
   - Número condensado gigante + Tendencia semanal (▲ / ▼ / —)
   - Retrato cuadrado redondeado (14px) sobre fondo Verde Esmeralda (#00DC7D)
   - Psicología positiva (sin 0% ni racha en 0) y halo animado en tu propia fila
   ========================================================================== */
function WtaRankingRow({
  player,
  rank,
  club,
  isCurrentUser,
  showLaurelMini = false,
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

  return (
    <div
      id={isCurrentUser ? 'tt-my-ranking-row' : undefined}
      role="button"
      tabIndex={0}
      className={`tt-wta-row ${isCurrentUser ? 'is-me-halo' : ''} ${
        medal ? `is-medal-${medal.key}` : ''
      }`}
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
      {/* 1. Columna Puesto + Tendencia ATP (▲ / ▼ / —) */}
      <div className="tt-wta-rank-col">
        <span
          className="tt-wta-rank-num"
          style={medal ? { color: medal.primary } : undefined}
        >
          {rank}
        </span>
        <span
          className={`tt-wta-trend ${
            trend > 0 ? 'is-up' : trend < 0 ? 'is-down' : 'is-flat'
          }`}
          title={
            trend > 0
              ? `Subió ${trend} puesto(s)`
              : trend < 0
              ? `Bajó ${Math.abs(trend)} puesto(s)`
              : 'Sin cambio de puesto'
          }
        >
          {trend > 0 ? `▲ ${trend}` : trend < 0 ? `▼ ${Math.abs(trend)}` : '—'}
        </span>
      </div>

      {/* 2. Retrato Cuadrado Redondeado sobre Verde Esmeralda (#00DC7D) */}
      <div className="tt-wta-portrait-wrap">
        <div
          className="tt-wta-emerald-frame"
          style={medal ? { borderColor: medal.primary, boxShadow: `0 0 0 2px ${medal.glow}` } : undefined}
        >
          <SmartImage
            src={player.avatar}
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

        {/* Botón rápido de Retar directo sobre la esquina (solo para rivales, nunca a ti mismo) */}
        {!isCurrentUser && onQuickChallenge && (
          <button
            type="button"
            className="tt-wta-quick-challenge"
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

      {/* 3. Identidad del Jugador (Nombre limpio sin "(Tú)", Club, Categoría, Racha) */}
      <div className="tt-wta-info-col">
        <div className="tt-wta-name-line">
          <strong className="tt-wta-name">{player.name}</strong>
          {player.isVip && <span className="tt-badge-vip">VIP</span>}
          {isCurrentUser && <span className="tt-me-micro-pill">MI PUESTO</span>}
        </div>

        <div className="tt-wta-sub-line">
          <span
            className="tt-wta-cat-tag"
            style={{ color: cat.color, backgroundColor: cat.badgeBg }}
          >
            {cat.name}
          </span>

          {club?.logo ? (
            <span className="tt-wta-club-chip">
              <SmartImage
                src={club.logo}
                alt={club.shortName}
                style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span>{club.shortName}</span>
            </span>
          ) : (
            <span className="tt-wta-club-chip is-indep">Independiente</span>
          )}
        </div>

        <div className="tt-wta-metrics-line">
          {isCalibrating ? (
            <span className="tt-calib-pill">
              Calibrando {calibPlayed}/{ELO_CONFIG.CALIBRATION_MATCHES}
            </span>
          ) : eff !== null && eff > 0 ? (
            <span className="tt-eff-label">
              {wins}V – {losses}D · {eff}% Efectividad
            </span>
          ) : (
            <span className="tt-eff-label is-fresh">Listo para debutar</span>
          )}

          {/* Racha deportiva SOLO si tiene al menos 1 victoria consecutiva (Cero flama en 0) */}
          {wins > 0 && streak >= 1 && (
            <span className={`tt-streak-badge ${streak >= 3 ? 'is-hot' : ''}`}>
              {streak >= 3 ? `RACHA: ${streak} SEGUIDAS` : `RACHA +${streak}`}
            </span>
          )}
        </div>
      </div>

      {/* 4. Columna Derecha: Puntos Condensados Gigantes + Acceso H2H */}
      <div className="tt-wta-points-col">
        <strong className="tt-wta-points-val">
          {Number(player.points || 0).toLocaleString('es-PE')}
        </strong>
        <span className="tt-wta-points-unit">PTS</span>

        {!isCurrentUser && onOpenHeadToHead && (
          <button
            type="button"
            className="tt-wta-h2h-mini"
            aria-label={`Comparar Head to Head contra ${player.name}`}
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
   VISTA PRINCIPAL: RankingView (BLOQUE 11 DE 26)
   ========================================================================== */
export default function RankingView({
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  seasonSnapshots = null,
  currentUser = null,
  theme = 'dark',
  sunlightMode = false,
  onOpenPlayerProfile,
  onOpenHeadToHead,
  onQuickChallenge,
  onGoToTournaments,
}) {
  const heroRef = useRef(null);
  useScrollReveal(heroRef, { startRevealed: true });

  // 3 Sub-vistas limpias (Clasificación Oficial siempre primero)
  const [activeSubTab, setActiveSubTab] = useState('oficial'); // 'oficial' | 'temporadas' | 'clubes'

  // Filtros de Clasificación Oficial y 4 Temporadas
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRewardsGuide, setShowRewardsGuide] = useState(false);

  // Respaldo seguro para seasonSnapshots si aún no llega poblado
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

  // 1. Filtrado y ordenamiento estricto del Ranking Oficial ELO (sin modificar la fórmula)
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

  // Mi posición en la vista actual para el atajo "Ir a mi puesto"
  const myRankInCurrentView = useMemo(() => {
    if (!currentUser?.id) return null;
    const idx = rankedPlayers.findIndex((p) => p.id === currentUser.id);
    return idx >= 0 ? idx + 1 : null;
  }, [rankedPlayers, currentUser]);

  // Mostrar Podio Ceremonial Top 3 cuando hay >= 3 tenistas y no hay búsqueda de texto activa
  const showTop3Podium = rankedPlayers.length >= 3 && searchQuery.trim().length === 0;
  const podiumPlayers = showTop3Podium ? rankedPlayers.slice(0, 3) : [];
  const listPlayers = showTop3Podium ? rankedPlayers.slice(3) : rankedPlayers;
  const listStartRank = showTop3Podium ? 4 : 1;

  // 2. Tabla Estática Inamovible de 4 Temporadas -> Carrera al Master Top 8
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

  // 3. Guerra de Clubes (Ranking Institucional Dinámico de las 4 Sedes Oficiales)
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
          totalWins,
          totalLosses,
          winRate,
          topPlayer,
        };
      })
      .sort((a, b) => {
        if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints;
        return b.totalPoints - a.totalPoints;
      });
  }, [clubs, players]);

  // Conteo de partidos jugados por cada tenista para validar quórum físico (5 partidos)
  const getPlayerMatchesCount = (p) =>
    (Number(p?.wins) || 0) + (Number(p?.losses) || 0);

  const handleResetFilters = () => {
    triggerHaptic('light');
    setDivisionFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
  };

  const handleJumpToMyRow = () => {
    triggerHaptic('light');
    const el = document.getElementById('tt-my-ranking-row');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const activeCategoryObj = CATEGORIES_SCALE.find((c) => c.id === categoryFilter) || null;
  const activeSeasonMeta =
    safeSnapshots.seasons.find((s) => s.number === safeSnapshots.currentSeason) ||
    safeSnapshots.seasons[safeSnapshots.seasons.length - 1];

  return (
    <section
      className={`tt-ranking-view ${theme === 'light' ? 'is-light' : 'is-dark'} ${
        sunlightMode ? 'is-sunlight' : ''
      }`}
      aria-label="Ranking Oficial TOTAL TENIS"
    >
      {/* ====================================================================
          1. CABECERA EDITORIAL DE RANKING (DEGRADADO VERDE MENTA / PÚRPURA)
          Sin botones duplicados de Reglas ELO ni Subir Score
          ==================================================================== */}
      <header ref={heroRef} className="tt-rk-hero tt-reveal-box">
        <div className="tt-rk-hero-top">
          <div>
            <span className="tt-rk-eyebrow">
              TEMPORADA {safeSnapshots.currentSeason} · {activeSeasonMeta?.period || 'ACTIVA'} · {safeSnapshots.year}
            </span>
            <h1 className="tt-rk-title">RANKING OFICIAL</h1>
          </div>

          {/* Atajo rápido a tu propia posición si estás visible en la tabla */}
          {myRankInCurrentView && activeSubTab === 'oficial' && (
            <button
              type="button"
              className="tt-rk-jump-btn"
              onClick={handleJumpToMyRow}
            >
              <span>Mi puesto</span>
              <strong>#{myRankInCurrentView}</strong>
            </button>
          )}
        </div>

        <p className="tt-rk-subtitle">
          Clasificación oficial gobernada estrictamente por puntos en cancha. Cada categoría premia a su Top 3 trimestral y suma hacia el Torneo de Maestros Top 8.
        </p>

        {/* Indicadores rápidos de circuito */}
        <div className="tt-rk-stats-strip">
          <div className="tt-rk-stat-chip">
            <strong>{players.length}</strong>
            <span>Jugadores activos</span>
          </div>
          <div className="tt-rk-stat-chip">
            <strong>{challenges.filter((c) => c.status === 'FINISHED').length}</strong>
            <span>Actas cerradas</span>
          </div>
          <div className="tt-rk-stat-chip is-emerald">
            <strong>Top 8</strong>
            <span>Clasifican al Master</span>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. CONMUTADOR DE 3 SUB-VISTAS (CLASIFICACIÓN GENERAL PRIMERO)
          ==================================================================== */}
      <div className="tt-rk-subtabs" role="tablist" aria-label="Vistas del Ranking">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'oficial'}
          className={`tt-rk-subtab ${activeSubTab === 'oficial' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('oficial');
          }}
        >
          Clasificación
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'temporadas'}
          className={`tt-rk-subtab ${activeSubTab === 'temporadas' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('temporadas');
          }}
        >
          4 Temporadas
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'clubes'}
          className={`tt-rk-subtab ${activeSubTab === 'clubes' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('clubes');
          }}
        >
          Guerra Clubes
        </button>
      </div>

      {/* ====================================================================
          3. BARRA DE FILTROS (PARA CLASIFICACIÓN OFICIAL Y 4 TEMPORADAS)
          ==================================================================== */}
      {activeSubTab !== 'clubes' && (
        <div className="tt-rk-filters-wrap">
          {/* Buscador en tiempo real */}
          <div className="tt-rk-search-bar">
            <TTIcon name="search" size={17} style={{ opacity: 0.65, flexShrink: 0 }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tenista por nombre o club..."
              aria-label="Buscar en el ranking"
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

          {/* Divisiones: General | Varones | Damas | +40 Senior */}
          <div className="tt-rk-pills-row">
            {DIVISION_FILTERS.map((div) => (
              <button
                key={div.id}
                type="button"
                className={`tt-rk-pill is-div ${divisionFilter === div.id ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setDivisionFilter(div.id);
                }}
              >
                {div.label}
              </button>
            ))}
          </div>

          {/* Categorías oficiales: Todas + 2ª Libre a 5ª P */}
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
        </div>
      )}

      {/* ====================================================================
          VISTA A: CLASIFICACIÓN OFICIAL ELO + PODIO TOP 3 CON LAURELES
          ==================================================================== */}
      {activeSubTab === 'oficial' && (
        <div className="tt-rk-content-stack">
          {rankedPlayers.length === 0 ? (
            /* Blindaje anti-pantalla blanca (ej. Damas + 2ª Libre sin inscritos) */
            <EmptyStateCard
              theme={theme}
              title="Sin tenistas en este filtro todavía"
              description={`No hay jugadores registrados en ${
                DIVISION_FILTERS.find((d) => d.id === divisionFilter)?.label || 'esta división'
              }${activeCategoryObj ? ` · ${activeCategoryObj.name}` : ''}.`}
              actionLabel="Ver todas las categorías"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              {/* PODIO CEREMONIAL TOP 3 (CON LAURELES ORO / PLATA / BRONCE) */}
              {showTop3Podium && (
                <div className="tt-podium-stage">
                  <div className="tt-podium-stage-head">
                    <span className="tt-podium-kicker">
                      PODIO TOP 3 · {activeCategoryObj ? activeCategoryObj.name.toUpperCase() : 'CLASIFICACIÓN GENERAL'}
                    </span>
                    <span className="tt-podium-quorum-note">
                      Quórum trofeo: {ELO_CONFIG.MIN_MATCHES_SEASON_TROPHY}+ partidos
                    </span>
                  </div>

                  {/* Orden visual de podio clásico: #2 Izquierda | #1 Centro Elevado | #3 Derecha */}
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
                            borderColor: `${medal.primary}75`,
                            boxShadow:
                              rank === 1
                                ? `0 16px 36px ${medal.glow}`
                                : `0 10px 24px rgba(10, 2, 20, 0.24)`,
                          }}
                          onClick={() => {
                            triggerHaptic('light');
                            if (onOpenPlayerProfile) onOpenPlayerProfile(player);
                          }}
                        >
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
                            size={rank === 1 ? 68 : 54}
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

                          <span
                            className={`tt-quorum-dot ${hasQuorum ? 'is-ok' : 'is-pending'}`}
                            title={
                              hasQuorum
                                ? 'Cumple quórum mínimo de 5 partidos para premio físico'
                                : `Lleva ${matchesPlayed}/5 partidos del quórum de premiación`
                            }
                          >
                            {hasQuorum
                              ? 'Quórum OK'
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

              {/* CABECERA DE TABLA WTA + FILAS COMPLETAS */}
              {listPlayers.length > 0 && (
                <div className="tt-wta-table-shell">
                  <div className="tt-wta-table-head">
                    <span>PUESTO</span>
                    <span>TENISTA & NIVEL</span>
                    <span>PUNTOS</span>
                  </div>

                  <div className="tt-wta-rows-stack">
                    {listPlayers.map((player, idx) => {
                      const rank = listStartRank + idx;
                      const club = getClubById(clubs, player.clubId);
                      const isMe = Boolean(currentUser && currentUser.id === player.id);

                      return (
                        <React.Fragment key={player.id}>
                          <WtaRankingRow
                            player={player}
                            rank={rank}
                            club={club}
                            isCurrentUser={isMe}
                            showLaurelMini={!showTop3Podium}
                            onOpenProfile={onOpenPlayerProfile}
                            onQuickChallenge={onQuickChallenge}
                            onOpenHeadToHead={onOpenHeadToHead}
                          />

                          {/* LÍNEA DE CORTE AL MASTER TOP 8 (EXACTAMENTE DESPUÉS DEL PUESTO #8) */}
                          {rank === 8 && listPlayers.length > idx + 1 && (
                            <div className="tt-master-cutoff-divider" role="separator">
                              <span className="tt-cutoff-line" />
                              <span className="tt-cutoff-pill">
                                <TTIcon name="trophy" size={13} />
                                LÍNEA DE CORTE · TOP 8 MASTER FINALS
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
          VISTA B: TABLA ESTÁTICA INAMOVIBLE DE 4 TEMPORADAS -> MASTER TOP 8
          PROHIBIDO TOCAR EL ELO: Solo lee snapshots congelados + proyección T actual
          ==================================================================== */}
      {activeSubTab === 'temporadas' && (
        <div className="tt-rk-content-stack">
          {/* Explicación clara y ejecutiva de la exportación a medianoche */}
          <div className="tt-seasons-banner">
            <div className="tt-seasons-banner-top">
              <IconBadge name="trophy" variant="gold" size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="tt-seasons-kicker">
                  TABLA ESTÁTICA INAMOVIBLE · AÑO {safeSnapshots.year}
                </span>
                <h2 className="tt-seasons-title">Carrera al Torneo de Maestros (Top 8)</h2>
              </div>
            </div>

            <p className="tt-seasons-desc">
              A las 00:00 del último día de cada trimestre, tus puntos oficiales se congelan en esta tabla independiente. La suma de las 4 temporadas define a los 8 clasificados (#1 al #8) sin costo de inscripción.
            </p>

            {/* Estado visual de los 4 trimestres */}
            <div className="tt-quarters-strip">
              {safeSnapshots.seasons.map((s) => {
                const isCurrent = !s.locked && s.number === safeSnapshots.currentSeason;
                return (
                  <div
                    key={s.number}
                    className={`tt-quarter-chip ${
                      s.locked ? 'is-locked' : isCurrent ? 'is-live' : 'is-future'
                    }`}
                  >
                    <strong>{s.label}</strong>
                    <span>{s.period}</span>
                    <small>
                      {s.locked ? 'Congelada' : isCurrent ? 'En juego' : 'Próxima'}
                    </small>
                  </div>
                );
              })}
            </div>

            <div className="tt-seasons-actions-row">
              <button
                type="button"
                className="tt-btn tt-btn-secondary tt-btn-sm"
                onClick={() => {
                  triggerHaptic('light');
                  setShowRewardsGuide((v) => !v);
                }}
              >
                <TTIcon name="gem" size={15} />
                {showRewardsGuide
                  ? 'Ocultar cuadro de premios'
                  : 'Ver Premios Trimestrales vs. Master Anual'}
              </button>

              {onGoToTournaments && (
                <button
                  type="button"
                  className="tt-btn tt-btn-primary tt-btn-sm"
                  onClick={() => {
                    triggerHaptic('light');
                    onGoToTournaments();
                  }}
                >
                  Ir al Master Top 8
                </button>
              )}
            </div>
          </div>

          {/* COMPARADOR DESPLEGABLE: PREMIOS TRIMESTRALES VS. GRAN MASTER ANUAL */}
          {showRewardsGuide && (
            <div className="tt-rewards-split-grid">
              {/* Bloque 1: Cierre Trimestral Sostenible (4 veces al año) */}
              <div className="tt-reward-box is-quarterly">
                <span className="tt-reward-kicker">{SEASON_QUARTERLY_REWARDS.badge}</span>
                <h3>{SEASON_QUARTERLY_REWARDS.title}</h3>
                <p>{SEASON_QUARTERLY_REWARDS.sustainabilityRule}</p>
                <div className="tt-reward-podium-list">
                  {SEASON_QUARTERLY_REWARDS.podium.map((p) => (
                    <div key={p.place} className="tt-reward-item">
                      <strong>{p.label}</strong>
                      <span>{p.physicalItems.join(' + ')}</span>
                      <small>{p.gemsRangeLabel} · {p.digitalPerk}</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 2: Gran Master Top 8 Anual (1 vez al año) */}
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

          {/* TABLA ESTÁTICA DE 4 COLUMNAS + SUMA ANUAL */}
          {masterTop8Rows.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin jugadores en este filtro de la Carrera"
              description="Ajusta la división o categoría para consultar la suma acumulada de las 4 temporadas."
              actionLabel="Ver tabla completa"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="tt-static-table-card">
              <div className="tt-static-table-scroll">
                <table className="tt-static-table">
                  <thead>
                    <tr>
                      <th className="col-rank">#</th>
                      <th className="col-player">Tenista</th>
                      {safeSnapshots.seasons.map((s) => (
                        <th key={s.number} className="col-q">
                          {s.label}
                          {s.locked ? ' · 🔒' : ''}
                        </th>
                      ))}
                      <th className="col-total">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterTop8Rows.map((row, idx) => {
                      const isMe = Boolean(currentUser && currentUser.id === row.player.id);
                      const club = getClubById(clubs, row.player.clubId);

                      return (
                        <React.Fragment key={row.player.id}>
                          <tr
                            className={`tt-static-row ${
                              row.qualifiesMasterTop8 ? 'is-top8' : ''
                            } ${isMe ? 'is-me-row' : ''}`}
                            onClick={() => {
                              triggerHaptic('light');
                              if (onOpenPlayerProfile) onOpenPlayerProfile(row.player);
                            }}
                          >
                            <td className="col-rank">
                              <span
                                className={`tt-race-rank-pill ${
                                  row.qualifiesMasterTop8 ? 'is-in' : ''
                                }`}
                              >
                                {row.raceRank}
                              </span>
                            </td>
                            <td className="col-player">
                              <div className="tt-static-player-cell">
                                <SmartImage
                                  src={row.player.avatar}
                                  alt={row.player.name}
                                  initials={row.player.name}
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    objectFit: 'cover',
                                    objectPosition: 'center top',
                                    flexShrink: 0,
                                  }}
                                />
                                <div style={{ minWidth: 0 }}>
                                  <strong>{row.player.name}</strong>
                                  <small>
                                    {row.category.name}
                                    {club ? ` · ${club.shortName}` : ''}
                                  </small>
                                </div>
                              </div>
                            </td>
                            {row.seasonValues.map((val, sIdx) => {
                              const isLockedQ = safeSnapshots.seasons[sIdx]?.locked;
                              return (
                                <td
                                  key={sIdx}
                                  className={`col-q ${isLockedQ ? 'is-frozen' : 'is-proj'}`}
                                >
                                  {val > 0 ? val.toLocaleString('es-PE') : '—'}
                                </td>
                              );
                            })}
                            <td className="col-total">
                              <strong>{row.totalAnnual.toLocaleString('es-PE')}</strong>
                            </td>
                          </tr>

                          {/* Separador exacto tras el puesto #8 */}
                          {row.raceRank === 8 && masterTop8Rows.length > idx + 1 && (
                            <tr className="tt-static-cutoff-row">
                              <td colSpan={7}>
                                <span>
                                  ▲ ZONA CLASIFICADA AL TORNEO DE MAESTROS (TOP 8 SIN COSTO) ▲
                                </span>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          VISTA C: GUERRA DE CLUBES (RANKING INSTITUCIONAL DE LAS 4 SEDES)
          ==================================================================== */}
      {activeSubTab === 'clubes' && (
        <div className="tt-rk-content-stack">
          <div className="tt-clubs-war-intro">
            <IconBadge name="shield" variant="emerald" size={40} />
            <div>
              <span className="tt-seasons-kicker">COPA DE ACADEMIAS & SEDES OFICIALES</span>
              <h2 className="tt-seasons-title">Guerra de Clubes</h2>
              <p className="tt-seasons-desc" style={{ marginTop: 4 }}>
                Ordenado por puntaje promedio oficial de los socios afiliados a cada sede. Cada victoria individual eleva el prestigio de tu club.
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
                  style={
                    medal
                      ? { borderColor: `${medal.primary}70` }
                      : undefined
                  }
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
                      <span>ELO PROM.</span>
                    </div>
                  </div>

                  {/* Métricas de equipo */}
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
                      <span>Efectividad</span>
                      <strong>{item.winRate}%</strong>
                    </div>
                  </div>

                  {/* Representante #1 del Club */}
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
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                          border: '1.5px solid #00DC7D',
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
          ESTILOS ENCAPSULADOS DE PRECISIÓN EDITORIAL (WTA + TOTAL TENIS)
          ==================================================================== */}
      <style>{`
        .tt-ranking-view {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        /* 1. CABECERA EDITORIAL DE RANKING */
        .tt-rk-hero {
          border-radius: 24px;
          padding: 18px;
          background: linear-gradient(135deg, #1AE68A 0%, #00B868 48%, #1E0734 100%);
          color: #120321;
          box-shadow: 0 16px 36px rgba(0, 184, 104, 0.24);
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }
        .tt-ranking-view.is-dark .tt-rk-hero {
          background: linear-gradient(135deg, #0E3A2D 0%, #1E0734 55%, #2C0B4C 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.34);
          box-shadow: 0 16px 38px rgba(8, 1, 18, 0.42);
        }
        .tt-rk-hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-rk-eyebrow {
          display: inline-block;
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(18, 3, 33, 0.14);
          margin-bottom: 5px;
        }
        .tt-ranking-view.is-dark .tt-rk-eyebrow {
          background: rgba(0, 220, 125, 0.16);
          color: #00DC7D;
        }
        .tt-rk-title {
          margin: 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: clamp(1.65rem, 6.5vw, 2.25rem);
          line-height: 0.98;
          letter-spacing: 0.02em;
        }
        .tt-rk-subtitle {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.4;
          opacity: 0.88;
          max-width: 560px;
        }
        .tt-rk-jump-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 7px 12px;
          border-radius: 15px;
          background: #1E0734;
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.55);
          flex-shrink: 0;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
        }
        .tt-rk-jump-btn span {
          font-size: 0.62rem;
          font-weight: 700;
          opacity: 0.78;
        }
        .tt-rk-jump-btn strong {
          font-family: var(--tt-font-display);
          font-size: 1.25rem;
          line-height: 1;
          color: #00DC7D;
        }
        .tt-rk-stats-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 2px;
        }
        .tt-rk-stat-chip {
          padding: 9px 10px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .tt-ranking-view.is-dark .tt-rk-stat-chip {
          background: rgba(250, 249, 245, 0.07);
          border: 1px solid rgba(250, 249, 245, 0.1);
        }
        .tt-rk-stat-chip strong {
          font-family: var(--tt-font-display);
          font-size: 1.18rem;
          line-height: 1.05;
        }
        .tt-rk-stat-chip.is-emerald strong {
          color: #120321;
        }
        .tt-ranking-view.is-dark .tt-rk-stat-chip.is-emerald strong {
          color: #00DC7D;
        }
        .tt-rk-stat-chip span {
          font-size: 0.67rem;
          font-weight: 700;
          opacity: 0.82;
        }

        /* 2. SUB-TABS */
        .tt-rk-subtabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 5px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-rk-subtab {
          min-height: 42px;
          border-radius: 13px;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          transition: background-color 180ms ease, color 180ms ease, transform 120ms ease;
        }
        .tt-rk-subtab:active {
          transform: scale(0.97);
        }
        .tt-rk-subtab.is-active {
          background: #1E0734;
          color: #00DC7D;
          box-shadow: 0 6px 16px rgba(10, 2, 20, 0.22);
        }
        .tt-ranking-view.is-dark .tt-rk-subtab.is-active {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }

        /* 3. FILTROS Y BUSCADOR */
        .tt-rk-filters-wrap {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-rk-search-bar {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 45px;
          padding: 0 13px;
          border-radius: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
        }
        .tt-rk-search-bar input {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--tt-text);
          font-size: 0.88rem;
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
        .tt-rk-pills-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tt-rk-pills-row::-webkit-scrollbar {
          display: none;
        }
        .tt-rk-pill {
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
        .tt-rk-pill.is-active {
          background: rgba(0, 220, 125, 0.16);
          border-color: rgba(0, 220, 125, 0.56);
          color: #00DC7D;
          font-weight: 800;
        }
        .tt-ranking-view.is-light .tt-rk-pill.is-active {
          background: #1E0734;
          border-color: #1E0734;
          color: #00DC7D;
        }

        .tt-rk-content-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* 4. PODIO CEREMONIAL TOP 3 CON LAURELES SVG */
        .tt-podium-stage {
          border-radius: 22px;
          padding: 14px 12px 16px;
          background: linear-gradient(180deg, rgba(35, 9, 62, 0.92) 0%, rgba(19, 4, 34, 0.98) 100%);
          border: 1px solid rgba(245, 158, 11, 0.28);
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-ranking-view.is-light .tt-podium-stage {
          background: linear-gradient(180deg, #22083B 0%, #160428 100%);
          color: #FAF9F5;
        }
        .tt-podium-stage-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-podium-kicker {
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #FDE68A;
        }
        .tt-podium-quorum-note {
          font-size: 0.68rem;
          font-weight: 700;
          color: rgba(250, 249, 245, 0.65);
        }
        .tt-podium-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: end;
          gap: 8px;
        }
        .tt-podium-card {
          border-radius: 18px;
          padding: 11px 6px 12px;
          background: rgba(250, 249, 245, 0.05);
          border: 1.5px solid rgba(250, 249, 245, 0.14);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 5px;
          cursor: pointer;
          transition: transform 180ms ease;
        }
        .tt-podium-card:active {
          transform: scale(0.97);
        }
        .tt-podium-card.is-first {
          padding-top: 14px;
          padding-bottom: 14px;
          background: linear-gradient(
            180deg,
            rgba(245, 158, 11, 0.18) 0%,
            rgba(250, 249, 245, 0.06) 100%
          );
          transform: translateY(-4px);
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
          width: 22px;
          height: 22px;
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
          font-size: 0.62rem;
          font-weight: 800;
        }
        .tt-podium-pts {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }
        .tt-podium-pts strong {
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          font-weight: 900;
          color: #00DC7D;
          font-variant-numeric: tabular-nums;
        }
        .tt-podium-pts span {
          font-size: 0.58rem;
          font-weight: 800;
          opacity: 0.7;
        }
        .tt-quorum-dot {
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 999px;
        }
        .tt-quorum-dot.is-ok {
          background: rgba(0, 220, 125, 0.16);
          color: #7CF5C0;
        }
        .tt-quorum-dot.is-pending {
          background: rgba(250, 249, 245, 0.1);
          color: rgba(250, 249, 245, 0.65);
        }
        .tt-podium-reto-btn {
          margin-top: 2px;
          width: 90%;
          min-height: 28px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.18);
          border: 1px solid rgba(0, 220, 125, 0.5);
          color: #00DC7D;
          font-size: 0.68rem;
          font-weight: 800;
        }

        /* 5. TABLA OFICIAL WTA DE ALTA LEGIBILIDAD */
        .tt-wta-table-shell {
          border-radius: 22px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          overflow: hidden;
        }
        .tt-wta-table-head {
          display: grid;
          grid-template-columns: 52px 1fr 78px;
          padding: 11px 14px;
          background: var(--tt-surface-2);
          border-bottom: 1px solid var(--tt-border);
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: var(--tt-text-muted);
        }
        .tt-wta-table-head span:last-child {
          text-align: right;
        }
        .tt-wta-rows-stack {
          display: flex;
          flex-direction: column;
        }
        .tt-wta-row {
          display: grid;
          grid-template-columns: 44px 58px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--tt-border);
          cursor: pointer;
          transition: background-color 160ms ease;
          position: relative;
        }
        .tt-wta-row:last-child {
          border-bottom: none;
        }
        .tt-wta-row:active {
          background: var(--tt-surface-2);
        }

        /* Halo luminoso animado en TU propia fila */
        .is-me-halo {
          background: linear-gradient(
            90deg,
            rgba(0, 220, 125, 0.16) 0%,
            rgba(0, 220, 125, 0.05) 70%,
            rgba(0, 220, 125, 0.12) 100%
          ) !important;
          box-shadow: inset 3px 0 0 #00DC7D;
        }

        .tt-wta-rank-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }
        .tt-wta-rank-num {
          font-family: var(--tt-font-display);
          font-weight: 900;
          font-size: 1.7rem;
          line-height: 0.95;
          color: var(--tt-text);
          font-variant-numeric: tabular-nums;
        }
        .tt-wta-trend {
          font-size: 0.62rem;
          font-weight: 900;
          line-height: 1;
        }
        .tt-wta-trend.is-up {
          color: #00DC7D;
        }
        .tt-ranking-view.is-light .tt-wta-trend.is-up {
          color: #008A4E;
        }
        .tt-wta-trend.is-down {
          color: #F87171;
        }
        .tt-wta-trend.is-flat {
          color: var(--tt-text-muted);
          opacity: 0.55;
        }

        /* Retrato Cuadrado Redondeado sobre Verde Esmeralda Vibrante (#00DC7D) */
        .tt-wta-portrait-wrap {
          position: relative;
          width: 54px;
          height: 54px;
          flex-shrink: 0;
        }
        .tt-wta-emerald-frame {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(135deg, #00DC7D 0%, #00A85D 100%);
          border: 2px solid rgba(0, 220, 125, 0.72);
        }
        .tt-wta-quick-challenge {
          position: absolute;
          right: -6px;
          bottom: -5px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #1E0734;
          border: 1.5px solid #00DC7D;
          color: #00DC7D;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
        }

        .tt-wta-info-col {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .tt-wta-name-line {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
        .tt-wta-name {
          font-size: 0.94rem;
          font-weight: 800;
          color: var(--tt-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }
        .tt-me-micro-pill {
          padding: 1px 6px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.05em;
        }
        .tt-wta-sub-line {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tt-wta-cat-tag {
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 800;
        }
        .tt-wta-club-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--tt-text-muted);
        }
        .tt-wta-metrics-line {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 1px;
        }
        .tt-eff-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }
        .tt-eff-label.is-fresh {
          color: #38BDF8;
        }
        .tt-calib-pill {
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.16);
          color: #38BDF8;
          font-size: 0.64rem;
          font-weight: 800;
        }
        .tt-streak-badge {
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.16);
          color: #F59E0B;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.03em;
        }
        .tt-streak-badge.is-hot {
          background: #1B0902;
          border: 1px solid #F97316;
          color: #FB923C;
        }

        .tt-wta-points-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
          flex-shrink: 0;
        }
        .tt-wta-points-val {
          font-family: var(--tt-font-display);
          font-size: 1.65rem;
          font-weight: 900;
          line-height: 0.95;
          color: #00DC7D;
          font-variant-numeric: tabular-nums;
        }
        .tt-ranking-view.is-light .tt-wta-points-val {
          color: #1E0734;
        }
        .tt-wta-points-unit {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--tt-text-muted);
        }
        .tt-wta-h2h-mini {
          margin-top: 3px;
          padding: 2px 7px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.62rem;
          font-weight: 800;
        }

        /* Línea de Corte Master Top 8 */
        .tt-master-cutoff-divider {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(0, 220, 125, 0.08);
          border-bottom: 1px solid var(--tt-border);
        }
        .tt-cutoff-line {
          flex: 1;
          height: 1px;
          border-top: 1.5px dashed rgba(0, 220, 125, 0.65);
        }
        .tt-cutoff-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #1E0734;
          color: #00DC7D;
          border: 1px solid rgba(0, 220, 125, 0.5);
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        /* 6. TABLA ESTÁTICA DE 4 TEMPORADAS -> MASTER TOP 8 */
        .tt-seasons-banner {
          border-radius: 22px;
          padding: 16px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-seasons-banner-top {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .tt-seasons-kicker {
          display: block;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #F59E0B;
        }
        .tt-seasons-title {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.28rem;
          font-weight: 900;
          line-height: 1.08;
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
          padding: 8px 6px;
          border-radius: 13px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-quarter-chip strong {
          font-size: 0.82rem;
          font-weight: 900;
        }
        .tt-quarter-chip span {
          font-size: 0.64rem;
          color: var(--tt-text-muted);
        }
        .tt-quarter-chip small {
          font-size: 0.6rem;
          font-weight: 800;
        }
        .tt-quarter-chip.is-locked {
          border-color: rgba(245, 158, 11, 0.4);
        }
        .tt-quarter-chip.is-locked small {
          color: #F59E0B;
        }
        .tt-quarter-chip.is-live {
          border-color: rgba(0, 220, 125, 0.55);
          background: rgba(0, 220, 125, 0.12);
        }
        .tt-quarter-chip.is-live small {
          color: #00DC7D;
        }
        .tt-ranking-view.is-light .tt-quarter-chip.is-live small {
          color: #008A4E;
        }
        .tt-seasons-actions-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Cuadro Comparativo de Premios Separados */
        .tt-rewards-split-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 720px) {
          .tt-rewards-split-grid {
            grid-template-columns: 1fr 1fr;
          }
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
        .tt-reward-box.is-annual {
          border-color: rgba(245, 158, 11, 0.45);
        }
        .tt-reward-kicker {
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
        }
        .tt-ranking-view.is-light .tt-reward-kicker {
          color: #008A4E;
        }
        .tt-reward-kicker.is-gold {
          color: #F59E0B !important;
        }
        .tt-reward-box h3 {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 900;
        }
        .tt-reward-box p {
          margin: 0;
          font-size: 0.76rem;
          line-height: 1.4;
          color: var(--tt-text-muted);
        }
        .tt-reward-podium-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 2px;
        }
        .tt-reward-item {
          padding: 9px 11px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.76rem;
        }
        .tt-reward-item small {
          color: var(--tt-text-muted);
          font-size: 0.69rem;
        }

        /* Tabla Estática 4 Temporadas */
        .tt-static-table-card {
          border-radius: 20px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          overflow: hidden;
        }
        .tt-static-table-scroll {
          width: 100%;
          overflow-x: auto;
        }
        .tt-static-table {
          width: 100%;
          min-width: 540px;
          border-collapse: collapse;
          font-size: 0.78rem;
        }
        .tt-static-table th {
          padding: 11px 8px;
          background: var(--tt-surface-2);
          border-bottom: 1px solid var(--tt-border);
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: var(--tt-text-muted);
          text-align: center;
          white-space: nowrap;
        }
        .tt-static-table th.col-player {
          text-align: left;
          padding-left: 10px;
        }
        .tt-static-row {
          border-bottom: 1px solid var(--tt-border);
          cursor: pointer;
        }
        .tt-static-row.is-me-row {
          background: rgba(0, 220, 125, 0.12);
        }
        .tt-static-table td {
          padding: 10px 8px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .tt-static-table td.col-player {
          text-align: left;
          padding-left: 10px;
        }
        .tt-static-player-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tt-static-player-cell strong {
          display: block;
          font-size: 0.82rem;
          white-space: nowrap;
        }
        .tt-static-player-cell small {
          display: block;
          font-size: 0.68rem;
          color: var(--tt-text-muted);
        }
        .tt-race-rank-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 8px;
          font-weight: 900;
          background: var(--tt-surface-2);
          color: var(--tt-text-muted);
        }
        .tt-race-rank-pill.is-in {
          background: rgba(0, 220, 125, 0.2);
          color: #00DC7D;
        }
        .tt-ranking-view.is-light .tt-race-rank-pill.is-in {
          background: #1E0734;
          color: #00DC7D;
        }
        .col-q.is-frozen {
          color: var(--tt-text);
          font-weight: 700;
        }
        .col-q.is-proj {
          color: #00DC7D;
          font-weight: 800;
        }
        .tt-ranking-view.is-light .col-q.is-proj {
          color: #008A4E;
        }
        .col-total strong {
          font-family: var(--tt-font-display);
          font-size: 1.08rem;
          color: #F59E0B;
        }
        .tt-static-cutoff-row td {
          padding: 7px;
          background: rgba(0, 220, 125, 0.14);
          color: #00DC7D;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .tt-ranking-view.is-light .tt-static-cutoff-row td {
          background: #1E0734;
          color: #00DC7D;
        }

        /* 7. GUERRA DE CLUBES */
        .tt-clubs-war-intro {
          border-radius: 20px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
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
          .tt-clubs-standings-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .tt-club-rank-card {
          border-radius: 22px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-club-rank-card.is-leader {
          box-shadow: 0 14px 32px rgba(245, 158, 11, 0.14);
        }
        .tt-club-rank-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-club-rank-num {
          font-family: var(--tt-font-display);
          font-size: 1.55rem;
          font-weight: 900;
          min-width: 30px;
        }
        .tt-club-logo-frame {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          overflow: hidden;
          background: #FFFFFF;
          border: 1.5px solid var(--tt-border);
          flex-shrink: 0;
        }
        .tt-club-rank-name {
          display: block;
          font-size: 0.92rem;
          font-weight: 800;
          line-height: 1.18;
        }
        .tt-club-rank-district {
          display: block;
          font-size: 0.72rem;
          color: var(--tt-text-muted);
          margin-top: 2px;
        }
        .tt-club-avg-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
        }
        .tt-club-avg-badge strong {
          font-family: var(--tt-font-display);
          font-size: 1.45rem;
          line-height: 0.95;
          color: #00DC7D;
        }
        .tt-ranking-view.is-light .tt-club-avg-badge strong {
          color: #1E0734;
        }
        .tt-club-avg-badge span {
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: var(--tt-text-muted);
        }
        .tt-club-metrics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 10px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          text-align: center;
        }
        .tt-club-metrics-row span {
          display: block;
          font-size: 0.67rem;
          color: var(--tt-text-muted);
        }
        .tt-club-metrics-row strong {
          font-size: 0.92rem;
          font-weight: 900;
        }
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
        }
        .tt-club-top-rep small {
          display: block;
          font-size: 0.64rem;
          color: var(--tt-text-muted);
        }
        .tt-club-top-rep strong {
          display: block;
          font-size: 0.82rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-club-rep-pts {
          font-size: 0.76rem;
          font-weight: 800;
          color: #00DC7D;
          white-space: nowrap;
        }
        .tt-ranking-view.is-light .tt-club-rep-pts {
          color: #008A4E;
        }
      `}</style>
    </section>
  );
}
