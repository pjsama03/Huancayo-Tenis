import React, { useEffect, useMemo, useState } from 'react';
import {
  ASSETS,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import {
  INITIAL_CLUBS,
  getCategoryByPoints,
  getClubById,
} from '../data/playersAndClubsData';
import { ELO_CONFIG } from '../utils/tenisEngine';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (CONFIGURA SPONSOR, COLORES O TEXTOS AQUÍ)
   --------------------------------------------------------------------------
   - sponsorLabel: Déjalo vacío '' hasta cerrar un auspiciador real (cero marcas
     inventadas). Cuando cierres convenio, pon ej. 'Presentado por Wilson Perú'.
   ========================================================================== */
export const H2H_EDITABLE_CONFIG = {
  sponsorLabel: '',
  colorPlayerA: '#00DC7D', // Verde Esmeralda TOTAL TENIS
  colorPlayerB: '#F59E0B', // Oro Campeón (alto contraste sobre Púrpura Noche)
  ringNeutralTrack: 'rgba(250, 249, 245, 0.16)',
  ringSize: 136,
  ringStroke: 13,
};

const H2H_SCOPE_FILTERS = [
  { id: 'ALL', label: 'Todos los cruces' },
  { id: 'SEASON', label: `Temporada ${new Date().getFullYear()}` },
  { id: 'OFFICIAL', label: 'Solo Oficiales' },
  { id: 'CLUB', label: 'Por sede' },
];

/* ==========================================================================
   UTILIDADES DE CÁLCULO REAL H2H (CERO PROBABILIDAD · SOLO DATOS OBJETIVOS)
   ========================================================================== */
function getPlayerRankMap(players = []) {
  const sorted = [...players].sort((a, b) => {
    const diff = (Number(b.points) || 0) - (Number(a.points) || 0);
    if (diff !== 0) return diff;
    return (Number(b.wins) || 0) - (Number(a.wins) || 0);
  });
  const map = {};
  sorted.forEach((p, idx) => {
    map[p.id] = idx + 1;
  });
  return map;
}

function countSetsWonFromChallenge(ch, playerId) {
  const ls = ch?.liveScore;
  if (!ls) return 0;
  const isA = ch.playerAId === playerId;
  let sets = 0;

  const checkReg = (s) => {
    if (!s) return;
    const my = isA ? Number(s.a) || 0 : Number(s.b) || 0;
    const opp = isA ? Number(s.b) || 0 : Number(s.a) || 0;
    if (my > opp && my >= 6) sets += 1;
  };
  checkReg(ls.set1);
  checkReg(ls.set2);

  if (ls.set3) {
    const my3 = isA ? Number(ls.set3.a) || 0 : Number(ls.set3.b) || 0;
    const opp3 = isA ? Number(ls.set3.b) || 0 : Number(ls.set3.a) || 0;
    if (my3 > opp3 && my3 >= 10) sets += 1;
  }
  return sets;
}

function formatH2HDate(isoStr, fallback = '') {
  if (!isoStr) return fallback || 'Temporada oficial';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return fallback || 'Temporada oficial';
  try {
    return d.toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return d.toLocaleDateString('es-PE');
  }
}

/* ==========================================================================
   SUBCOMPONENTE 1: ANILLO RADIAL SVG BICOLOR (ESTILO TRANSMISIÓN OFICIAL)
   - En 0-0 renderiza estado neutro elegante sin barras vacías ni 0% vs 0%.
   ========================================================================== */
function RadialH2HRing({ winsA = 0, winsB = 0 }) {
  const total = winsA + winsB;
  const size = H2H_EDITABLE_CONFIG.ringSize;
  const stroke = H2H_EDITABLE_CONFIG.ringStroke;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const ratioA = total > 0 ? winsA / total : 0;
  const ratioB = total > 0 ? winsB / total : 0;
  const dashA = circumference * ratioA;
  const dashB = circumference * ratioB;

  return (
    <div className="tt-h2h-ring-wrap" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={
          total > 0
            ? `Historial directo: ${winsA} victorias contra ${winsB} en ${total} partidos`
            : 'Primer enfrentamiento directo'
        }
      >
        {/* Pista neutra base */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={H2H_EDITABLE_CONFIG.ringNeutralTrack}
          strokeWidth={stroke}
        />

        {/* Arco Jugador B (Oro Campeón) */}
        {total > 0 && winsB > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={H2H_EDITABLE_CONFIG.colorPlayerB}
            strokeWidth={stroke}
            strokeDasharray={`${dashB} ${circumference}`}
            strokeDashoffset={-dashA}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 380ms ease, stroke-dashoffset 380ms ease' }}
          />
        )}

        {/* Arco Jugador A (Verde Esmeralda) */}
        {total > 0 && winsA > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={H2H_EDITABLE_CONFIG.colorPlayerA}
            strokeWidth={stroke}
            strokeDasharray={`${dashA} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 380ms ease' }}
          />
        )}
      </svg>

      {/* Núcleo central del anillo */}
      <div className="tt-h2h-ring-center">
        <strong>{total}</strong>
        <span>{total === 1 ? 'PARTIDO' : 'JUGADOS'}</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUBCOMPONENTE 2: FILA COMPARATIVA SIMÉTRICA (ESTADÍSTICAS CARA A CARA)
   ========================================================================== */
function StatCompareRow({
  label,
  leftDisplay,
  rightDisplay,
  leftNumeric = 0,
  rightNumeric = 0,
  higherIsBetter = true,
  showBars = true,
}) {
  const numL = Number(leftNumeric) || 0;
  const numR = Number(rightNumeric) || 0;
  const sum = numL + numR;

  let pctL = 50;
  let pctR = 50;
  if (sum > 0) {
    pctL = Math.round((numL / sum) * 100);
    pctR = 100 - pctL;
  }

  const leftLeads =
    numL !== numR && (higherIsBetter ? numL > numR : numL > 0 && (numR === 0 || numL < numR));
  const rightLeads =
    numL !== numR && (higherIsBetter ? numR > numL : numR > 0 && (numL === 0 || numR < numL));

  return (
    <div className="tt-h2h-stat-row">
      <div className="tt-h2h-stat-values">
        <strong className={`tt-h2h-val-left ${leftLeads ? 'is-lead' : ''}`}>
          {leftDisplay}
        </strong>
        <span className="tt-h2h-stat-label">{label}</span>
        <strong className={`tt-h2h-val-right ${rightLeads ? 'is-lead' : ''}`}>
          {rightDisplay}
        </strong>
      </div>

      {showBars && sum > 0 && (
        <div className="tt-h2h-dual-bar" aria-hidden="true">
          <div className="tt-h2h-bar-a" style={{ width: `${Math.max(6, pctL)}%` }} />
          <div className="tt-h2h-bar-b" style={{ width: `${Math.max(6, pctR)}%` }} />
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: HeadToHeadModal (BLOQUE 16 DE 26)
   ========================================================================== */
export default function HeadToHeadModal({
  isOpen = false,
  onClose,
  initialPlayerA = null,
  initialPlayerB = null,
  currentUser = null,
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  theme = 'dark',
  onQuickChallenge,
  onOpenStoriesWithMatch,
  onOpenPlayerProfile,
}) {
  const [playerAId, setPlayerAId] = useState(null);
  const [playerBId, setPlayerBId] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [selectedClubFilter, setSelectedClubFilter] = useState('ALL');

  // Selector instantáneo "Cambiar Jugador" ('A' | 'B' | null)
  const [swapSlot, setSwapSlot] = useState(null);
  const [swapSearch, setSwapSearch] = useState('');

  // Inicializar pareja de jugadores al abrir el modal sin repetir al mismo jugador
  useEffect(() => {
    if (!isOpen) return;

    const firstCandidate = initialPlayerA || currentUser || players[0] || null;
    const secondCandidate =
      initialPlayerB && initialPlayerB.id !== firstCandidate?.id
        ? initialPlayerB
        : players.find((p) => p.id !== firstCandidate?.id) || null;

    setPlayerAId(firstCandidate?.id || null);
    setPlayerBId(secondCandidate?.id || null);
    setScopeFilter('ALL');
    setSelectedClubFilter('ALL');
    setSwapSlot(null);
    setSwapSearch('');
  }, [isOpen, initialPlayerA, initialPlayerB, currentUser, players]);

  const playersMap = useMemo(() => {
    const m = {};
    (players || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [players]);

  const rankMap = useMemo(() => getPlayerRankMap(players), [players]);

  const playerA = playersMap[playerAId] || initialPlayerA || currentUser || players[0] || null;
  const playerB =
    playersMap[playerBId] ||
    players.find((p) => p.id !== playerA?.id) ||
    initialPlayerB ||
    null;

  const clubA = getClubById(clubs, playerA?.clubId);
  const clubB = getClubById(clubs, playerB?.clubId);
  const catA = getCategoryByPoints(playerA?.points);
  const catB = getCategoryByPoints(playerB?.points);

  // Todos los cruces finalizados entre A y B
  const allDirectMatches = useMemo(() => {
    if (!playerA?.id || !playerB?.id) return [];
    return (challenges || [])
      .filter((c) => {
        if (c.status !== 'FINISHED') return false;
        const pair1 = c.playerAId === playerA.id && c.playerBId === playerB.id;
        const pair2 = c.playerAId === playerB.id && c.playerBId === playerA.id;
        return pair1 || pair2;
      })
      .sort((a, b) => new Date(b.scheduledIso || 0) - new Date(a.scheduledIso || 0));
  }, [challenges, playerA?.id, playerB?.id]);

  // Cruces filtrados por píldora activa (Todos / Temporada / Oficiales / Por sede)
  const filteredDirectMatches = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return allDirectMatches.filter((m) => {
      if (scopeFilter === 'SEASON') {
        const y = m.scheduledIso ? new Date(m.scheduledIso).getFullYear() : currentYear;
        if (y !== currentYear) return false;
      }
      if (scopeFilter === 'OFFICIAL' && m.mode === 'Amistoso') return false;
      if (scopeFilter === 'CLUB' && selectedClubFilter !== 'ALL') {
        if (m.clubId !== selectedClubFilter) return false;
      }
      return true;
    });
  }, [allDirectMatches, scopeFilter, selectedClubFilter]);

  // Métricas objetivas directas A vs B (Sin "Probabilidad de Victoria")
  const h2hSummary = useMemo(() => {
    let winsA = 0;
    let winsB = 0;
    let setsA = 0;
    let setsB = 0;

    filteredDirectMatches.forEach((m) => {
      if (m.winnerId === playerA?.id) winsA += 1;
      else if (m.winnerId === playerB?.id) winsB += 1;
      setsA += countSetsWonFromChallenge(m, playerA?.id);
      setsB += countSetsWonFromChallenge(m, playerB?.id);
    });

    const total = winsA + winsB;
    const pctA = total > 0 ? ((winsA / total) * 100).toFixed(1) : null;
    const pctB = total > 0 ? ((winsB / total) * 100).toFixed(1) : null;

    return { winsA, winsB, total, pctA, pctB, setsA, setsB };
  }, [filteredDirectMatches, playerA?.id, playerB?.id]);

  // Métricas individuales con Psicología Positiva (nunca avergonzar con "0% Efectividad")
  const buildPlayerMetrics = (p) => {
    const w = Number(p?.wins) || 0;
    const l = Number(p?.losses) || 0;
    const played = w + l;
    const calib = p?.calibrationPlayed !== undefined ? Number(p.calibrationPlayed) : played;
    const isCalib = calib < ELO_CONFIG.CALIBRATION_MATCHES;
    const eff = played > 0 ? Math.round((w / played) * 100) : 0;
    const streak = Number(p?.streak) || 0;

    return {
      wins: w,
      losses: l,
      played,
      eff,
      effLabel:
        played > 0 && eff > 0
          ? `${eff}% (${w}V-${l}D)`
          : isCalib
          ? `Calibrando (${calib}/${ELO_CONFIG.CALIBRATION_MATCHES})`
          : 'Debutante',
      streak,
      streakLabel: w > 0 && streak >= 1 ? `+${streak} seguidas` : '—',
    };
  };

  const metricsA = buildPlayerMetrics(playerA);
  const metricsB = buildPlayerMetrics(playerB);

  // Lista filtrada para el buscador "Cambiar Jugador"
  const swapCandidates = useMemo(() => {
    const q = swapSearch.trim().toLowerCase();
    const otherSideId = swapSlot === 'A' ? playerB?.id : playerA?.id;
    return (players || [])
      .filter((p) => p.id !== otherSideId)
      .filter((p) => {
        if (!q) return true;
        return `${p.name || ''} ${p.clubName || ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
  }, [players, swapSearch, swapSlot, playerA?.id, playerB?.id]);

  const handleSwapSelect = (chosenPlayer) => {
    triggerHaptic('medium');
    if (swapSlot === 'A') setPlayerAId(chosenPlayer.id);
    else if (swapSlot === 'B') setPlayerBId(chosenPlayer.id);
    setSwapSlot(null);
    setSwapSearch('');
  };

  // Determinar a qué rival se puede lanzar reto directo desde aquí (nunca a ti mismo)
  const challengeableOpponent = useMemo(() => {
    if (!currentUser?.id || !playerA || !playerB) return null;
    if (currentUser.id === playerA.id && playerB.id !== currentUser.id) return playerB;
    if (currentUser.id === playerB.id && playerA.id !== currentUser.id) return playerA;
    return null;
  }, [currentUser?.id, playerA, playerB]);

  const formatAvailability = (p) => {
    const days = Array.isArray(p?.availabilityDays) && p.availabilityDays.length > 0
      ? p.availabilityDays.join(' · ')
      : 'Flexible';
    const times = Array.isArray(p?.availabilityTimes) && p.availabilityTimes.length > 0
      ? p.availabilityTimes
          .map((t) => (t === 'manana' ? 'Mañana' : t === 'tarde' ? 'Tarde' : 'Noche'))
          .join(' / ')
      : 'Tarde / Noche';
    return `${days} (${times})`;
  };

  if (!playerA || !playerB) {
    return (
      <ModalPortal
        isOpen={isOpen}
        onClose={onClose}
        title="Head to Head"
        subtitle="Comparador oficial cara a cara"
        icon={<IconBadge name="challenge" variant="emerald" size={38} />}
        isTopLayer
      >
        <p className="tt-muted" style={{ margin: 0, textAlign: 'center', padding: '18px 0' }}>
          Se necesitan al menos 2 jugadores registrados para abrir el comparador Head to Head.
        </p>
      </ModalPortal>
    );
  }

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Head to Head"
      subtitle={`${playerA.name} vs. ${playerB.name}`}
      icon={<IconBadge name="challenge" variant="emerald" size={38} />}
      isWide
      isTopLayer
    >
      <div className={`tt-h2h-root ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* ==================================================================
            1. CABECERA DEGRADADA VERDE MENTA + COLLAGE 50/50 + TARJETAS GEMELAS
            ================================================================== */}
        <div className="tt-h2h-hero-stage">
          {H2H_EDITABLE_CONFIG.sponsorLabel ? (
            <span className="tt-h2h-sponsor-pill">{H2H_EDITABLE_CONFIG.sponsorLabel}</span>
          ) : (
            <span className="tt-h2h-sponsor-pill">CIRCUITO OFICIAL · TOTAL TENIS</span>
          )}

          <h2 className="tt-h2h-monumental-title">HEAD TO HEAD</h2>

          {/* Collage Dividido 50/50 (Rivalry Rewind) con retratos enfrentados */}
          <div className="tt-h2h-split-collage">
            <div className="tt-h2h-half is-left">
              <SmartImage
                src={playerA.fullBodyPhoto || playerA.avatar}
                alt={playerA.name}
                initials={playerA.name}
                priority
                className="tt-h2h-half-img"
              />
              <div className="tt-h2h-half-fade is-a" />
              <span className="tt-h2h-corner-rank">
                #{rankMap[playerA.id] || '—'}
              </span>
            </div>

            <div className="tt-h2h-split-line" aria-hidden="true">
              <span>VS</span>
            </div>

            <div className="tt-h2h-half is-right">
              <SmartImage
                src={playerB.fullBodyPhoto || playerB.avatar}
                alt={playerB.name}
                initials={playerB.name}
                priority
                className="tt-h2h-half-img"
              />
              <div className="tt-h2h-half-fade is-b" />
              <span className="tt-h2h-corner-rank is-right">
                #{rankMap[playerB.id] || '—'}
              </span>
            </div>
          </div>

          {/* Dos Tarjetas Blancas Gemelas con Franja Inferior "CAMBIAR JUGADOR" */}
          <div className="tt-h2h-twins-grid">
            {[
              { side: 'A', p: playerA, club: clubA, cat: catA, accent: H2H_EDITABLE_CONFIG.colorPlayerA },
              { side: 'B', p: playerB, club: clubB, cat: catB, accent: H2H_EDITABLE_CONFIG.colorPlayerB },
            ].map(({ side, p, club, cat, accent }) => (
              <div key={side} className="tt-h2h-twin-card">
                <div
                  className="tt-h2h-twin-body"
                  onClick={() => {
                    if (onOpenPlayerProfile) {
                      triggerHaptic('light');
                      onClose && onClose();
                      onOpenPlayerProfile(p);
                    }
                  }}
                >
                  <span className="tt-h2h-twin-dot" style={{ backgroundColor: accent }} />
                  <strong className="tt-h2h-twin-name">{p.name}</strong>
                  <div className="tt-h2h-twin-club">
                    {club?.logo ? (
                      <SmartImage
                        src={club.logo}
                        alt={club.shortName}
                        style={{ width: 15, height: 15, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : null}
                    <span>{club ? club.shortName : 'Independiente'}</span>
                  </div>
                  <span
                    className="tt-h2h-twin-cat"
                    style={{ color: cat.color, backgroundColor: cat.badgeBg }}
                  >
                    {cat.name} · {Number(p.points || 0).toLocaleString('es-PE')} pts
                  </span>
                </div>

                <button
                  type="button"
                  className="tt-h2h-swap-bar"
                  onClick={() => {
                    triggerHaptic('light');
                    setSwapSlot(side);
                    setSwapSearch('');
                  }}
                >
                  ⇄ CAMBIAR JUGADOR
                </button>
              </div>
            ))}
          </div>

          {/* Buscador Instantáneo Inline cuando se pulsa "CAMBIAR JUGADOR" */}
          {swapSlot && (
            <div className="tt-h2h-swap-drawer">
              <div className="tt-h2h-swap-head">
                <strong>
                  Elegir {swapSlot === 'A' ? 'Jugador Izquierdo' : 'Jugador Derecho'}
                </strong>
                <button
                  type="button"
                  className="tt-h2h-swap-close"
                  onClick={() => setSwapSlot(null)}
                >
                  Cerrar
                </button>
              </div>
              <input
                type="search"
                className="tt-h2h-swap-input"
                value={swapSearch}
                onChange={(e) => setSwapSearch(e.target.value)}
                placeholder="Escribe nombre o club..."
                autoFocus
              />
              <div className="tt-h2h-swap-list">
                {swapCandidates.slice(0, 8).map((cand) => (
                  <button
                    key={cand.id}
                    type="button"
                    className="tt-h2h-swap-row"
                    onClick={() => handleSwapSelect(cand)}
                  >
                    <SmartImage
                      src={cand.avatar}
                      alt={cand.name}
                      initials={cand.name}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <strong>{cand.name}</strong>
                      <small>
                        {getCategoryByPoints(cand.points).name} · {cand.clubName || 'Independiente'}
                      </small>
                    </div>
                    <span className="tt-h2h-swap-pts">
                      {Number(cand.points || 0).toLocaleString('es-PE')} pts
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Píldoras de Filtro Real */}
          <div className="tt-h2h-filters-row">
            {H2H_SCOPE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`tt-h2h-filter-pill ${scopeFilter === f.id ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setScopeFilter(f.id);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {scopeFilter === 'CLUB' && (
            <div className="tt-h2h-filters-row">
              <button
                type="button"
                className={`tt-h2h-filter-pill is-sub ${selectedClubFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setSelectedClubFilter('ALL')}
              >
                Todas las sedes
              </button>
              {(clubs || []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`tt-h2h-filter-pill is-sub ${selectedClubFilter === c.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedClubFilter(c.id)}
                >
                  {c.shortName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ==================================================================
            2. MONOLITO CENTRAL OSCURO (#23083C · HISTORIAL Y STATS OBJETIVAS)
            CERO "Probabilidad de Victoria" · Anillo Radial + Primer Duelo 0-0
            ================================================================== */}
        <div className="tt-h2h-monolith">
          <div className="tt-h2h-mono-head">
            <span className="tt-h2h-mono-kicker">HISTORIAL DIRECTO EN CANCHA</span>
            {h2hSummary.total === 0 && (
              <span className="tt-h2h-first-duel-pill">Primer enfrentamiento directo</span>
            )}
          </div>

          {/* Marcador Monumental flanqueando el Anillo Radial */}
          <div className="tt-h2h-scoreboard-band">
            <div className="tt-h2h-score-side is-a">
              <strong>{h2hSummary.winsA}</strong>
              <span>{h2hSummary.pctA ? `${h2hSummary.pctA}% H2H` : 'Sin duelos'}</span>
              <small>{playerA.name.split(' ')[0]}</small>
            </div>

            <RadialH2HRing winsA={h2hSummary.winsA} winsB={h2hSummary.winsB} />

            <div className="tt-h2h-score-side is-b">
              <strong>{h2hSummary.winsB}</strong>
              <span>{h2hSummary.pctB ? `${h2hSummary.pctB}% H2H` : 'Sin duelos'}</span>
              <small>{playerB.name.split(' ')[0]}</small>
            </div>
          </div>

          {/* Tabla Simétrica ESTADÍSTICAS CARA A CARA */}
          <div className="tt-h2h-stats-table">
            <div className="tt-h2h-stats-title">ESTADÍSTICAS CARA A CARA</div>

            <StatCompareRow
              label="Puntos Oficiales"
              leftDisplay={Number(playerA.points || 0).toLocaleString('es-PE')}
              rightDisplay={Number(playerB.points || 0).toLocaleString('es-PE')}
              leftNumeric={playerA.points}
              rightNumeric={playerB.points}
            />

            <StatCompareRow
              label="Puesto en Ranking"
              leftDisplay={rankMap[playerA.id] ? `#${rankMap[playerA.id]}` : '—'}
              rightDisplay={rankMap[playerB.id] ? `#${rankMap[playerB.id]}` : '—'}
              leftNumeric={rankMap[playerA.id] || 0}
              rightNumeric={rankMap[playerB.id] || 0}
              higherIsBetter={false}
              showBars={false}
            />

            <StatCompareRow
              label="Victorias Totales"
              leftDisplay={String(metricsA.wins)}
              rightDisplay={String(metricsB.wins)}
              leftNumeric={metricsA.wins}
              rightNumeric={metricsB.wins}
            />

            <StatCompareRow
              label="Rendimiento Real"
              leftDisplay={metricsA.effLabel}
              rightDisplay={metricsB.effLabel}
              leftNumeric={metricsA.eff}
              rightNumeric={metricsB.eff}
              showBars={metricsA.played > 0 && metricsB.played > 0}
            />

            {(metricsA.streak > 0 || metricsB.streak > 0) && (
              <StatCompareRow
                label="Racha Activa"
                leftDisplay={metricsA.streakLabel}
                rightDisplay={metricsB.streakLabel}
                leftNumeric={metricsA.streak}
                rightNumeric={metricsB.streak}
              />
            )}

            {h2hSummary.total > 0 && (
              <StatCompareRow
                label="Sets Ganados en H2H"
                leftDisplay={String(h2hSummary.setsA)}
                rightDisplay={String(h2hSummary.setsB)}
                leftNumeric={h2hSummary.setsA}
                rightNumeric={h2hSummary.setsB}
              />
            )}

            <StatCompareRow
              label="Gemas Acumuladas"
              leftDisplay={`${Number(playerA.gems || 0).toLocaleString('es-PE')} 💎`}
              rightDisplay={`${Number(playerB.gems || 0).toLocaleString('es-PE')} 💎`}
              leftNumeric={playerA.gems}
              rightNumeric={playerB.gems}
            />
          </div>
        </div>

        {/* ==================================================================
            3. TARJETA BLANCA EDITORIAL: PERFILES DE JUGADOR (FILA POR FILA)
            ================================================================== */}
        <div className="tt-h2h-profiles-sheet">
          <div className="tt-h2h-sheet-head">
            <span>PERFILES DE JUGADOR</span>
            <small>Comparativa técnica y club</small>
          </div>

          <div className="tt-h2h-profile-rows">
            {[
              {
                label: 'Categoría Oficial',
                a: catA.name,
                b: catB.name,
              },
              {
                label: 'Club / Sede',
                a: clubA ? clubA.shortName : 'Independiente',
                b: clubB ? clubB.shortName : 'Independiente',
              },
              {
                label: 'Edad',
                a: playerA.age ? `${playerA.age} años${playerA.age >= 40 ? ' (+40)' : ''}` : '—',
                b: playerB.age ? `${playerB.age} años${playerB.age >= 40 ? ' (+40)' : ''}` : '—',
              },
              {
                label: 'Mano Hábil',
                a: playerA.hand || 'Diestro',
                b: playerB.hand || 'Diestro',
              },
              {
                label: 'Mejor Golpe',
                a: playerA.bestStroke || 'Derecha (Forehand)',
                b: playerB.bestStroke || 'Derecha (Forehand)',
              },
              {
                label: 'Disponibilidad',
                a: formatAvailability(playerA),
                b: formatAvailability(playerB),
              },
            ].map((row) => (
              <div key={row.label} className="tt-h2h-bio-row">
                <strong className="is-a">{row.a}</strong>
                <span>{row.label}</span>
                <strong className="is-b">{row.b}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ==================================================================
            4. HISTORIAL CRONOLÓGICO DE CRUCES DIRECTOS
            ================================================================== */}
        <div className="tt-h2h-history-box">
          <div className="tt-h2h-history-head">
            <strong>Historial de Marcadores Directos</strong>
            <span>{filteredDirectMatches.length} {filteredDirectMatches.length === 1 ? 'cruce' : 'cruces'}</span>
          </div>

          {filteredDirectMatches.length === 0 ? (
            <div className="tt-h2h-empty-history">
              <TTIcon name="challenge" size={20} style={{ color: '#00DC7D', flexShrink: 0 }} />
              <div>
                <strong>Primer enfrentamiento directo pendiente</strong>
                <p>
                  {playerA.name.split(' ')[0]} y {playerB.name.split(' ')[0]} todavía no registran partidos cerrados en este filtro. ¡El próximo duelo abrirá su historial oficial!
                </p>
              </div>
            </div>
          ) : (
            <div className="tt-h2h-matches-list">
              {filteredDirectMatches.map((m) => {
                const winnerIsA = m.winnerId === playerA.id;
                const s1L = m.playerAId === playerA.id ? m.liveScore?.set1?.a ?? 0 : m.liveScore?.set1?.b ?? 0;
                const s1R = m.playerAId === playerA.id ? m.liveScore?.set1?.b ?? 0 : m.liveScore?.set1?.a ?? 0;
                const s2L = m.playerAId === playerA.id ? m.liveScore?.set2?.a ?? 0 : m.liveScore?.set2?.b ?? 0;
                const s2R = m.playerAId === playerA.id ? m.liveScore?.set2?.b ?? 0 : m.liveScore?.set2?.a ?? 0;

                return (
                  <article key={m.id} className="tt-h2h-match-item">
                    <div className="tt-hm-top">
                      <span>{m.clubName || 'Sede oficial'}</span>
                      <span>{formatH2HDate(m.scheduledIso, m.dateLabel)}</span>
                    </div>

                    <div className={`tt-hm-line ${winnerIsA ? 'is-win' : ''}`}>
                      <strong>{playerA.name}</strong>
                      <div className="tt-hm-sets">
                        <span>{s1L}</span>
                        <span>{s2L}</span>
                        {winnerIsA && <em>◀</em>}
                      </div>
                    </div>

                    <div className={`tt-hm-line ${!winnerIsA ? 'is-win' : ''}`}>
                      <strong>{playerB.name}</strong>
                      <div className="tt-hm-sets">
                        <span>{s1R}</span>
                        <span>{s2R}</span>
                        {!winnerIsA && <em>◀</em>}
                      </div>
                    </div>

                    <div className="tt-hm-foot">
                      <span>{m.scoreSummary || 'Acta validada'}</span>
                      <span>{m.mode === 'Amistoso' ? 'Amistoso' : 'Oficial por puntos'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================================
            5. ACCIONES FINALES (DESAFIAR + PUBLICAR DUELO EN STORIES)
            ================================================================== */}
        <div className="tt-h2h-footer-actions">
          {challengeableOpponent && onQuickChallenge && (
            <button
              type="button"
              className="tt-btn tt-btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                triggerHaptic('medium');
                onClose && onClose();
                onQuickChallenge(challengeableOpponent);
              }}
            >
              <TTIcon name="challenge" size={17} />
              Desafiar a {challengeableOpponent.name.split(' ')[0]}
            </button>
          )}

          {onOpenStoriesWithMatch && (
            <button
              type="button"
              className="tt-btn tt-btn-secondary"
              style={{ flex: challengeableOpponent ? '0 0 auto' : 1 }}
              onClick={() => {
                triggerHaptic('light');
                onClose && onClose();
                onOpenStoriesWithMatch({
                  challenge: filteredDirectMatches[0] || {
                    clubName: clubA?.name || 'TOTAL TENIS',
                    scoreSummary: `${h2hSummary.winsA} - ${h2hSummary.winsB} H2H`,
                  },
                  playerA,
                  playerB,
                  presetMode: 'duel',
                });
              }}
            >
              <TTIcon name="stories" size={17} />
              Publicar en Stories
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          ESTILOS ENCAPSULADOS (HEAD TO HEAD EDITORIAL DE ALTO IMPACTO)
          ==================================================================== */}
      <style>{`
        .tt-h2h-root {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* 1. CABECERA DEGRADADA VERDE MENTA */
        .tt-h2h-hero-stage {
          border-radius: 22px;
          padding: 16px 14px;
          background: linear-gradient(180deg, #1AE68A 0%, #7EF3BE 58%, #EEFBF4 100%);
          color: #1A0530;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 11px;
        }
        .tt-h2h-sponsor-pill {
          padding: 3px 11px;
          border-radius: 999px;
          background: rgba(26, 5, 48, 0.12);
          color: #1A0530;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .tt-h2h-monumental-title {
          margin: 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: clamp(1.9rem, 7.5vw, 2.65rem);
          line-height: 0.92;
          letter-spacing: 0.03em;
          color: #1E0734;
          text-align: center;
        }

        /* Collage Dividido 50/50 */
        .tt-h2h-split-collage {
          position: relative;
          width: 100%;
          height: 174px;
          border-radius: 18px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #1A0530;
          box-shadow: 0 14px 30px rgba(26, 5, 48, 0.24);
        }
        .tt-h2h-half {
          position: relative;
          height: 100%;
          overflow: hidden;
        }
        .tt-h2h-half-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .tt-h2h-half-fade {
          position: absolute;
          inset: 0;
        }
        .tt-h2h-half-fade.is-a {
          background: linear-gradient(180deg, rgba(0, 220, 125, 0.08) 0%, rgba(18, 3, 33, 0.56) 100%);
        }
        .tt-h2h-half-fade.is-b {
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(18, 3, 33, 0.56) 100%);
        }
        .tt-h2h-corner-rank {
          position: absolute;
          left: 10px;
          bottom: 10px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(18, 3, 33, 0.82);
          border: 1px solid rgba(0, 220, 125, 0.55);
          color: #00DC7D;
          font-family: var(--tt-font-display);
          font-size: 0.92rem;
          font-weight: 900;
        }
        .tt-h2h-corner-rank.is-right {
          left: auto;
          right: 10px;
          border-color: rgba(245, 158, 11, 0.65);
          color: #FDE68A;
        }
        .tt-h2h-split-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          transform: translateX(-50%);
          background: #FFFFFF;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tt-h2h-split-line span {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #1E0734;
          border: 2px solid #FFFFFF;
          color: #00DC7D;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        /* Dos Tarjetas Blancas Gemelas */
        .tt-h2h-twins-grid {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }
        .tt-h2h-twin-card {
          border-radius: 16px;
          overflow: hidden;
          background: #FFFFFF;
          color: #1E0734;
          box-shadow: 0 8px 20px rgba(26, 5, 48, 0.14);
          display: flex;
          flex-direction: column;
        }
        .tt-h2h-twin-body {
          padding: 10px 9px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
          flex: 1;
          cursor: pointer;
        }
        .tt-h2h-twin-dot {
          width: 22px;
          height: 4px;
          border-radius: 999px;
        }
        .tt-h2h-twin-name {
          font-family: var(--tt-font-display);
          font-size: 1rem;
          font-weight: 900;
          line-height: 1.06;
          text-transform: uppercase;
        }
        .tt-h2h-twin-club {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 700;
          color: rgba(30, 7, 52, 0.68);
        }
        .tt-h2h-twin-cat {
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.63rem;
          font-weight: 800;
        }
        .tt-h2h-swap-bar {
          width: 100%;
          min-height: 34px;
          background: #1E0734;
          color: #00DC7D;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          transition: opacity 150ms ease;
        }
        .tt-h2h-swap-bar:active {
          opacity: 0.85;
        }

        /* Buscador Inline "Cambiar Jugador" */
        .tt-h2h-swap-drawer {
          width: 100%;
          border-radius: 16px;
          padding: 12px;
          background: #1E0734;
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-h2h-swap-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
        }
        .tt-h2h-swap-close {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.14);
          color: #FAF9F5;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-h2h-swap-input {
          width: 100%;
          min-height: 40px;
          padding: 0 12px;
          border-radius: 11px;
          background: rgba(250, 249, 245, 0.1);
          border: 1px solid rgba(0, 220, 125, 0.45);
          color: #FAF9F5;
          font-size: 0.84rem;
          outline: none;
        }
        .tt-h2h-swap-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 210px;
          overflow-y: auto;
        }
        .tt-h2h-swap-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 9px;
          border-radius: 12px;
          background: rgba(250, 249, 245, 0.07);
          color: #FAF9F5;
        }
        .tt-h2h-swap-row strong {
          display: block;
          font-size: 0.8rem;
        }
        .tt-h2h-swap-row small {
          display: block;
          font-size: 0.67rem;
          opacity: 0.72;
        }
        .tt-h2h-swap-pts {
          font-size: 0.74rem;
          font-weight: 800;
          color: #00DC7D;
          white-space: nowrap;
        }

        /* Píldoras de Filtro */
        .tt-h2h-filters-row {
          width: 100%;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tt-h2h-filters-row::-webkit-scrollbar {
          display: none;
        }
        .tt-h2h-filter-pill {
          flex-shrink: 0;
          min-height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(30, 7, 52, 0.12);
          color: #1E0734;
          font-size: 0.7rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .tt-h2h-filter-pill.is-active {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-h2h-filter-pill.is-sub {
          background: rgba(255, 255, 255, 0.75);
        }
        .tt-h2h-filter-pill.is-sub.is-active {
          background: #1E0734;
          color: #FAF9F5;
        }

        /* 2. MONOLITO CENTRAL OSCURO (#23083C) */
        .tt-h2h-monolith {
          border-radius: 22px;
          padding: 16px 14px;
          background: linear-gradient(180deg, #24083E 0%, #150426 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.28);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .tt-h2h-mono-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-h2h-mono-kicker {
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #7CF5C0;
        }
        .tt-h2h-first-duel-pill {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.16);
          border: 1px solid rgba(0, 220, 125, 0.45);
          color: #00DC7D;
          font-size: 0.67rem;
          font-weight: 800;
        }

        .tt-h2h-scoreboard-band {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
        }
        .tt-h2h-score-side {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2px;
        }
        .tt-h2h-score-side strong {
          font-family: var(--tt-font-display);
          font-size: 2.6rem;
          font-weight: 900;
          line-height: 0.9;
        }
        .tt-h2h-score-side.is-a strong {
          color: #00DC7D;
        }
        .tt-h2h-score-side.is-b strong {
          color: #F59E0B;
        }
        .tt-h2h-score-side span {
          font-size: 0.68rem;
          font-weight: 800;
          opacity: 0.85;
        }
        .tt-h2h-score-side small {
          font-size: 0.68rem;
          opacity: 0.64;
        }

        .tt-h2h-ring-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-h2h-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .tt-h2h-ring-center strong {
          font-family: var(--tt-font-display);
          font-size: 1.95rem;
          line-height: 0.95;
          color: #FAF9F5;
        }
        .tt-h2h-ring-center span {
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          opacity: 0.7;
        }

        .tt-h2h-stats-table {
          display: flex;
          flex-direction: column;
          gap: 11px;
          padding-top: 10px;
          border-top: 1px solid rgba(250, 249, 245, 0.12);
        }
        .tt-h2h-stats-title {
          text-align: center;
          font-family: var(--tt-font-display);
          font-size: 1.05rem;
          letter-spacing: 0.08em;
          color: rgba(250, 249, 245, 0.85);
        }
        .tt-h2h-stat-row {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding-bottom: 9px;
          border-bottom: 1px solid rgba(250, 249, 245, 0.08);
        }
        .tt-h2h-stat-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .tt-h2h-stat-values {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
        }
        .tt-h2h-val-left {
          text-align: left;
          color: rgba(250, 249, 245, 0.82);
        }
        .tt-h2h-val-left.is-lead {
          color: #00DC7D;
        }
        .tt-h2h-val-right {
          text-align: right;
          color: rgba(250, 249, 245, 0.82);
        }
        .tt-h2h-val-right.is-lead {
          color: #FDE68A;
        }
        .tt-h2h-stat-label {
          font-size: 0.67rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(250, 249, 245, 0.56);
          text-align: center;
        }
        .tt-h2h-dual-bar {
          height: 5px;
          border-radius: 999px;
          overflow: hidden;
          display: flex;
          gap: 2px;
        }
        .tt-h2h-bar-a {
          background: #00DC7D;
          border-radius: 999px 0 0 999px;
        }
        .tt-h2h-bar-b {
          background: #F59E0B;
          border-radius: 0 999px 999px 0;
        }

        /* 3. TARJETA BLANCA EDITORIAL: PERFILES DE JUGADOR */
        .tt-h2h-profiles-sheet {
          border-radius: 20px;
          padding: 15px 14px;
          background: #FAF9F5;
          color: #1E0734;
          border: 1px solid rgba(30, 7, 52, 0.12);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-h2h-sheet-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-bottom: 1.5px solid rgba(30, 7, 52, 0.1);
          padding-bottom: 8px;
        }
        .tt-h2h-sheet-head span {
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: 0.04em;
        }
        .tt-h2h-sheet-head small {
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(30, 7, 52, 0.58);
        }
        .tt-h2h-profile-rows {
          display: flex;
          flex-direction: column;
        }
        .tt-h2h-bio-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(30, 7, 52, 0.08);
          font-size: 0.76rem;
        }
        .tt-h2h-bio-row:last-child {
          border-bottom: none;
          padding-bottom: 2px;
        }
        .tt-h2h-bio-row strong.is-a {
          text-align: left;
          color: #1E0734;
        }
        .tt-h2h-bio-row strong.is-b {
          text-align: right;
          color: #1E0734;
        }
        .tt-h2h-bio-row span {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: rgba(30, 7, 52, 0.52);
          text-align: center;
        }

        /* 4. HISTORIAL CRONOLÓGICO */
        .tt-h2h-history-box {
          border-radius: 18px;
          padding: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-h2h-history-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
        }
        .tt-h2h-history-head span {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-h2h-empty-history {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px;
          border-radius: 13px;
          background: var(--tt-surface);
          font-size: 0.77rem;
        }
        .tt-h2h-empty-history p {
          margin: 3px 0 0;
          font-size: 0.73rem;
          color: var(--tt-text-muted);
          line-height: 1.4;
        }
        .tt-h2h-matches-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-h2h-match-item {
          padding: 11px;
          border-radius: 14px;
          background: #1B0630;
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-hm-top,
        .tt-hm-foot {
          display: flex;
          justify-content: space-between;
          font-size: 0.66rem;
          opacity: 0.72;
        }
        .tt-hm-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
        }
        .tt-hm-line.is-win strong {
          color: #00DC7D;
        }
        .tt-hm-sets {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--tt-font-display);
          font-size: 1rem;
        }
        .tt-hm-sets em {
          font-style: normal;
          color: #00DC7D;
          font-size: 0.7rem;
        }

        /* 5. ACCIONES FINALES */
        .tt-h2h-footer-actions {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }
      `}</style>
    </ModalPortal>
  );
}
