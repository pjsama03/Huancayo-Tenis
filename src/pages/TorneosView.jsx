import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  APP_CONFIG,
  CATEGORIES_SCALE,
  INITIAL_CLUBS,
  getCategoryByPoints,
  getClubById,
} from '../data/playersAndClubsData';
import {
  ANNUAL_MASTER_TOP8_REWARDS,
  SEASON_QUARTERLY_REWARDS,
} from '../data/storeAndTournamentsData';
import { computeMasterTop8Race } from '../utils/tenisEngine';
import { buildWhatsappLink } from '../utils/cloudService';

/* ==========================================================================
   DATOS BASE Y CONFIGURACIÓN DE LAS 4 GIRAS DEL AÑO
   ========================================================================== */
const SEASON_SWINGS = [
  { id: 'swing-1', name: 'Apertura', club: 'T1 · Ene–Mar', season: 1 },
  { id: 'swing-2', name: 'Altura', club: 'T2 · Abr–Jun', season: 2 },
  { id: 'swing-3', name: 'Mantaro', club: 'T3 · Jul–Sep', season: 3 },
  { id: 'swing-4', name: 'Master Top 8', club: 'T4 · Oct–Dic', season: 4 },
];

const PAYMENT_CHANNELS = {
  yapePlin: APP_CONFIG.paymentYapePlin || '964 812 340',
  holder: APP_CONFIG.paymentHolder || 'TOTAL TENIS · Organización Oficial',
  bankName: APP_CONFIG.paymentBank || 'BCP Soles',
  bankAccount: APP_CONFIG.paymentBankAccount || '355-98412031-0-42',
  cci: APP_CONFIG.paymentCci || '002-355-198412031042-61',
};

const FALLBACK_TOURNAMENTS = [
  {
    id: 'torneo-apertura-16',
    name: 'Abierto de Arcilla · Copa Los Huancas',
    shortName: 'Copa Los Huancas',
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    surface: 'Arcilla',
    status: 'IN_PLAY',
    dateLabel: '14 – 24 NOV',
    categoryLabel: '4ª Cat. & 5ª A',
    drawSize: 16,
    minPlayersForDraw: 8,
    entryFee: 45,
    includesBalls: true,
    includesItems: [
      'Pelotas presurizadas nuevas en cada ronda',
      'Hidratación en zona de jugadores',
      'Puntaje oficial para Ranking y Master Top 8',
    ],
    hasConsolation: true,
    banner: ASSETS.torneoApertura,
    prizes: {
      trophy: 'Copa Oficial Campeón + Medalla Finalista',
      cash: 'S/ 400 Campeón · S/ 150 Finalista',
      proShop: 'Vale S/ 120 en Encordado y Accesorios',
      points: '+220 pts Oficiales al Campeón',
      gems: '+250 💎 Campeón · +120 💎 Finalista',
    },
    participantsIds: [],
    pendingPaymentIds: [],
    bracketResults: {},
  },
  {
    id: 'torneo-altura-16',
    name: 'Challenger de Altura · Academia Cutipa',
    shortName: 'Challenger de Altura',
    clubId: 'club-romina',
    clubName: 'Academia Romina Cutipa',
    surface: 'Arcilla',
    status: 'OPEN',
    dateLabel: '05 – 14 DIC',
    categoryLabel: '5ª A · 5ª B · Damas',
    drawSize: 16,
    minPlayersForDraw: 8,
    entryFee: 40,
    includesBalls: true,
    includesItems: [
      'Tarro de pelotas nuevas en fase final',
      'Mínimo 2 partidos garantizados (Ronda Consuelo)',
      'Registro oficial en Ranking y Carrera Top 8',
    ],
    hasConsolation: true,
    banner: ASSETS.torneoAltura,
    prizes: {
      trophy: 'Trofeo Challenger de Altura + Medallas',
      cash: 'S/ 300 Campeón · S/ 100 Finalista',
      proShop: '2 Tarros Pro + Overgrips Oficiales',
      points: '+180 pts Oficiales al Campeón',
      gems: '+200 💎 Campeón · +100 💎 Finalista',
    },
    participantsIds: [],
    pendingPaymentIds: [],
    bracketResults: {},
  },
  {
    id: 'torneo-relampago-8',
    name: 'Relámpago Nocturno · Club Tauro',
    shortName: 'Relámpago Nocturno',
    clubId: 'club-tauro',
    clubName: 'Club Tauro Tenis',
    surface: 'Arcilla · LED',
    status: 'UPCOMING',
    dateLabel: '19 – 21 DIC',
    categoryLabel: '3ª Cat. & Libre',
    drawSize: 8,
    minPlayersForDraw: 6,
    entryFee: 35,
    includesBalls: false,
    includesItems: [
      'Iluminación LED profesional incluida',
      'Formato compacto de fin de semana',
      'Pelotas por acuerdo en cancha',
    ],
    hasConsolation: false,
    banner: ASSETS.bienvenidaOscuro,
    prizes: {
      trophy: 'Trofeo Nocturno Tauro',
      cash: 'S/ 250 al Campeón',
      proShop: 'Vale S/ 80 en Pro Shop',
      points: '+150 pts Oficiales al Campeón',
      gems: '+160 💎 Campeón · +80 💎 Finalista',
    },
    participantsIds: [],
    pendingPaymentIds: [],
    bracketResults: {},
  },
];

function mapInitialSubTab(subTab) {
  if (subTab === 'master') return 'master';
  if (subTab === 'fama' || subTab === 'hof') return 'fama';
  return 'torneos';
}

/* ==========================================================================
   SUBCOMPONENTE AISLADO: RELOJ SPLIT-FLAP FÍSICO DE CIERRE DE TEMPORADA
   - Calcula el tiempo real exacto hasta el fin del trimestre en hora Perú (-05:00).
   - Nunca se reinicia al abrir/cerrar la app.
   - Vive aislado en estado local para no re-renderizar la vista ni romper el scroll.
   ========================================================================== */
function getRealSeasonTargetMs(seasonNumber, snapshotYear, customEndDate = null) {
  const now = Date.now();
  if (customEndDate) {
    const parsed = new Date(`${customEndDate}T23:59:59-05:00`).getTime();
    if (!Number.isNaN(parsed) && parsed > now) return parsed;
  }
  const y = Number(snapshotYear) || new Date().getFullYear();
  const quarterEndIsoMap = {
    1: `${y}-03-31T23:59:59-05:00`,
    2: `${y}-06-30T23:59:59-05:00`,
    3: `${y}-09-30T23:59:59-05:00`,
    4: `${y}-12-31T23:59:59-05:00`,
  };
  let target = new Date(quarterEndIsoMap[seasonNumber] || quarterEndIsoMap[4]).getTime();

  if (Number.isNaN(target) || target <= now) {
    const d = new Date();
    const curY = d.getFullYear();
    const curQ = Math.floor(d.getMonth() / 3) + 1;
    const endMap = {
      1: `${curY}-03-31T23:59:59-05:00`,
      2: `${curY}-06-30T23:59:59-05:00`,
      3: `${curY}-09-30T23:59:59-05:00`,
      4: `${curY}-12-31T23:59:59-05:00`,
    };
    target = new Date(endMap[curQ]).getTime();
  }
  return target;
}

function computeRemainingParts(targetMs) {
  const diffSec = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

function FlipUnit({ value, label }) {
  const prevRef = useRef(value);
  const [tickKey, setTickKey] = useState(0);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setTickKey((k) => k + 1);
    }
  }, [value]);

  return (
    <div className="tt-flip-unit">
      <div className="tt-flip-card" key={tickKey}>
        <span className="tt-flip-num">{value}</span>
        <span className="tt-flip-hinge" aria-hidden="true" />
      </div>
      <span className="tt-flip-lbl">{label}</span>
    </div>
  );
}

function SeasonFlipCountdown({ seasonNumber = 4, year = 2026, customEndDate = null }) {
  const targetMs = useMemo(
    () => getRealSeasonTargetMs(seasonNumber, year, customEndDate),
    [seasonNumber, year, customEndDate]
  );
  const [parts, setParts] = useState(() => computeRemainingParts(targetMs));

  useEffect(() => {
    setParts(computeRemainingParts(targetMs));
    const timer = window.setInterval(() => {
      setParts(computeRemainingParts(targetMs));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetMs]);

  return (
    <div className="tt-flip-strip" aria-label={`Tiempo restante de la Temporada ${seasonNumber}`}>
      <div className="tt-flip-meta">
        <span className="tt-flip-dot" />
        <strong>CIERRE TEMPORADA {seasonNumber}</strong>
      </div>

      <div className="tt-flip-clock">
        <FlipUnit value={parts.days} label="DÍAS" />
        <span className="tt-flip-sep">:</span>
        <FlipUnit value={parts.hours} label="HRS" />
        <span className="tt-flip-sep">:</span>
        <FlipUnit value={parts.minutes} label="MIN" />
        <span className="tt-flip-sep">:</span>
        <FlipUnit value={parts.seconds} label="SEG" />
      </div>
    </div>
  );
}
  let target = new Date(quarterEndIsoMap[seasonNumber] || quarterEndIsoMap[4]).getTime();

  if (Number.isNaN(target) || target <= now) {
    const d = new Date();
    const curY = d.getFullYear();
    const curQ = Math.floor(d.getMonth() / 3) + 1;
    const endMap = {
      1: `${curY}-03-31T23:59:59-05:00`,
      2: `${curY}-06-30T23:59:59-05:00`,
      3: `${curY}-09-30T23:59:59-05:00`,
      4: `${curY}-12-31T23:59:59-05:00`,
    };
    target = new Date(endMap[curQ]).getTime();
  }
  return target;
}
  let target = new Date(quarterEndIsoMap[seasonNumber] || quarterEndIsoMap[4]).getTime();

  // Si la fecha configurada ya pasó, calcula automáticamente el fin del trimestre calendario real actual
  if (Number.isNaN(target) || target <= now) {
    const d = new Date();
    const curY = d.getFullYear();
    const curQ = Math.floor(d.getMonth() / 3) + 1;
    const endMap = {
      1: `${curY}-03-31T23:59:59-05:00`,
      2: `${curY}-06-30T23:59:59-05:00`,
      3: `${curY}-09-30T23:59:59-05:00`,
      4: `${curY}-12-31T23:59:59-05:00`,
    };
    target = new Date(endMap[curQ]).getTime();
  }
  return target;
}

function computeRemainingParts(targetMs) {
  const diffSec = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

function FlipUnit({ value, label }) {
  const prevRef = useRef(value);
  const [tickKey, setTickKey] = useState(0);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setTickKey((k) => k + 1);
    }
  }, [value]);

  return (
    <div className="tt-flip-unit">
      <div className="tt-flip-card" key={tickKey}>
        <span className="tt-flip-num">{value}</span>
        <span className="tt-flip-hinge" aria-hidden="true" />
      </div>
      <span className="tt-flip-lbl">{label}</span>
    </div>
  );
}

function SeasonFlipCountdown({ seasonNumber = 4, year = 2026, customEndDate = null }) {
  const targetMs = useMemo(
    () => getRealSeasonTargetMs(seasonNumber, year, customEndDate),
    [seasonNumber, year, customEndDate]
  );
  const [parts, setParts] = useState(() => computeRemainingParts(targetMs));

  useEffect(() => {
    setParts(computeRemainingParts(targetMs));
    const timer = window.setInterval(() => {
      setParts(computeRemainingParts(targetMs));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetMs]);

  return (
    <div className="tt-flip-strip" aria-label={`Tiempo restante de la Temporada ${seasonNumber}`}>
      <div className="tt-flip-meta">
        <span className="tt-flip-dot" />
        <strong>CIERRE TEMPORADA {seasonNumber}</strong>
      </div>

      <div className="tt-flip-clock">
        <FlipUnit value={parts.days} label="DÍAS" />
        <span className="tt-flip-sep">:</span>
        <FlipUnit value={parts.hours} label="HRS" />
        <span className="tt-flip-sep">:</span>
        <FlipUnit value={parts.minutes} label="MIN" />
        <span className="tt-flip-sep">:</span>
        <FlipUnit value={parts.seconds} label="SEG" />
      </div>
    </div>
  );
}

/* ==========================================================================
   MOTOR DE LLAVES REAL (OCTAVOS DE 16 -> CUARTOS -> SEMIS -> FINAL + CONSUELO)
   ========================================================================== */
function buildTournamentBracket(tournament, playersMap, allPlayers) {
  const drawSize = Number(tournament?.drawSize) === 8 ? 8 : 16;

  let ids = Array.isArray(tournament?.participantsIds) ? [...tournament.participantsIds] : [];
  if (ids.length === 0 && allPlayers.length > 0) {
    ids = allPlayers.slice(0, Math.min(drawSize, allPlayers.length)).map((p) => p.id);
  }

  const slotPlayers = Array.from({ length: drawSize }, (_, idx) => {
    const pid = ids[idx];
    return pid && playersMap[pid] ? playersMap[pid] : null;
  });

  const savedResults = tournament?.bracketResults || {};

  const resolveMatch = (matchId, pA, pB, roundLabel, defaultCourt, defaultScore) => {
    const saved = savedResults[matchId];
    const winnerSide =
      saved?.winnerSide ||
      (defaultScore && pA && pB ? (Number(pA.points || 0) >= Number(pB.points || 0) ? 'A' : 'B') : null);
    const score = saved?.score || (winnerSide ? defaultScore : null);
    const winner = winnerSide === 'A' ? pA : winnerSide === 'B' ? pB : null;
    const loser = winnerSide === 'A' ? pB : winnerSide === 'B' ? pA : null;

    return {
      id: matchId,
      roundLabel,
      court: saved?.court || defaultCourt,
      playerA: pA,
      playerB: pB,
      winnerSide,
      winner,
      loser,
      score,
      status: winner ? 'FINISHED' : pA && pB ? 'SCHEDULED' : 'TBD',
    };
  };

  const isStarted = tournament?.status === 'IN_PLAY' || tournament?.status === 'FINISHED';
  const sampleScores = [
    '6-3, 6-4',
    '7-5, 6-2',
    '6-4, 3-6, [10-7]',
    '6-2, 6-1',
    '7-6 (5), 6-4',
    '6-1, 6-3',
    '6-4, 6-4',
    '4-6, 6-3, [12-10]',
  ];

  let roundOf16 = [];
  let quarterFinals = [];

  if (drawSize === 16) {
    roundOf16 = Array.from({ length: 8 }, (_, idx) => {
      const pA = slotPlayers[idx * 2];
      const pB = slotPlayers[idx * 2 + 1];
      const demoScore = isStarted && idx < 6 ? sampleScores[idx % sampleScores.length] : null;
      return resolveMatch(
        `R16-${idx + 1}`,
        pA,
        pB,
        'Octavos de Final',
        `Cancha ${(idx % 3) + 1}`,
        demoScore
      );
    });

    quarterFinals = Array.from({ length: 4 }, (_, idx) => {
      const m1 = roundOf16[idx * 2];
      const m2 = roundOf16[idx * 2 + 1];
      const demoScore = isStarted && idx < 2 ? sampleScores[(idx + 2) % sampleScores.length] : null;
      return resolveMatch(
        `QF-${idx + 1}`,
        m1?.winner || null,
        m2?.winner || null,
        'Cuartos de Final',
        `Cancha ${(idx % 2) + 1}`,
        demoScore
      );
    });
  } else {
    quarterFinals = Array.from({ length: 4 }, (_, idx) => {
      const pA = slotPlayers[idx * 2];
      const pB = slotPlayers[idx * 2 + 1];
      const demoScore = isStarted && idx < 2 ? sampleScores[idx % sampleScores.length] : null;
      return resolveMatch(
        `QF-${idx + 1}`,
        pA,
        pB,
        'Cuartos de Final',
        `Cancha ${(idx % 2) + 1}`,
        demoScore
      );
    });
  }

  const semiFinals = Array.from({ length: 2 }, (_, idx) => {
    const q1 = quarterFinals[idx * 2];
    const q2 = quarterFinals[idx * 2 + 1];
    const demoScore = tournament?.status === 'FINISHED' ? sampleScores[idx] : null;
    return resolveMatch(
      `SF-${idx + 1}`,
      q1?.winner || null,
      q2?.winner || null,
      'Semifinal',
      'Cancha Central',
      demoScore
    );
  });

  const finalMatch = resolveMatch(
    'FINAL',
    semiFinals[0]?.winner || null,
    semiFinals[1]?.winner || null,
    'Gran Final',
    'Cancha Central',
    tournament?.status === 'FINISHED' ? '6-4, 7-6 (8-6)' : null
  );

  const firstRoundMatches = drawSize === 16 ? roundOf16 : quarterFinals;
  const consolationMatches = [];
  if (tournament?.hasConsolation) {
    const losers = firstRoundMatches.map((m) => m.loser);
    const pairCount = Math.floor(losers.length / 2);
    for (let i = 0; i < pairCount; i += 1) {
      consolationMatches.push(
        resolveMatch(
          `CONS-${i + 1}`,
          losers[i * 2] || null,
          losers[i * 2 + 1] || null,
          'Copa de Plata · Consuelo',
          `Cancha ${(i % 2) + 2}`,
          null
        )
      );
    }
  }

  return {
    drawSize,
    roundOf16,
    quarterFinals,
    semiFinals,
    finalMatch,
    consolationMatches,
    enrolledPlayers: ids.map((id) => playersMap[id]).filter(Boolean),
  };
}

/* ==========================================================================
   SUBCOMPONENTE: PARTIDO EN LLAVE Y COLLAGE DE PREMIOS
   ========================================================================== */
function BracketMatchCard({
  match,
  animIndex = 0,
  isAdmin,
  onSelectAdminWinner,
  onOpenPlayerProfile,
}) {
  const renderSlot = (player, side) => {
    const isWinner = match.winnerSide === side && Boolean(player);
    const isLoser = Boolean(match.winnerSide) && match.winnerSide !== side && Boolean(player);

    return (
      <div
        className={`tt-bm-slot ${isWinner ? 'is-winner' : ''} ${isLoser ? 'is-loser' : ''}`}
        onClick={() => {
          if (player && onOpenPlayerProfile) {
            triggerHaptic('light');
            onOpenPlayerProfile(player);
          }
        }}
      >
        <div className="tt-bm-player-left">
          {player ? (
            <SmartImage
              src={player.avatar}
              alt={player.name}
              initials={player.name}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: 'center top',
                border: isWinner
                  ? '2px solid #00DC7D'
                  : '1.5px solid rgba(250, 249, 245, 0.25)',
                flexShrink: 0,
              }}
            />
          ) : (
            <span className="tt-bm-tbd-avatar">?</span>
          )}

          <div style={{ minWidth: 0 }}>
            <strong className="tt-bm-name">{player ? player.name : 'Por definir'}</strong>
            {player && (
              <small className="tt-bm-sub">
                {getCategoryByPoints(player.points).name} ·{' '}
                {Number(player.points || 0).toLocaleString('es-PE')} pts
              </small>
            )}
          </div>
        </div>

        <div className="tt-bm-right">
          {isWinner && <span className="tt-bm-win-arrow">◀</span>}
          {isAdmin && match.playerA && match.playerB && !match.winner && (
            <button
              type="button"
              className="tt-bm-admin-pick"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('success');
                onSelectAdminWinner(match.id, side);
              }}
            >
              Ganó
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`tt-bm-card ${match.winner ? 'is-done' : ''}`}
      style={{ '--tn-delay': `${Math.min(animIndex, 7) * 40}ms` }}
    >
      <div className="tt-bm-head">
        <span>
          {match.id} · {match.court}
        </span>
        <span className={`tt-bm-state ${match.status.toLowerCase()}`}>
          {match.score || (match.status === 'SCHEDULED' ? 'Programado' : 'Por definir')}
        </span>
      </div>
      {renderSlot(match.playerA, 'A')}
      <div className="tt-bm-divider" />
      {renderSlot(match.playerB, 'B')}
    </div>
  );
}

function PrizeCollageShowcase({ prizes }) {
  if (!prizes) return null;
  const cards = [
    { key: 'trophy', label: 'TROFEO', value: prizes.trophy, icon: 'trophy', variant: 'gold' },
    { key: 'cash', label: 'EFECTIVO', value: prizes.cash, icon: 'crown', variant: 'emerald' },
    { key: 'proShop', label: 'PRO SHOP', value: prizes.proShop, icon: 'shop', variant: 'purple' },
    { key: 'points', label: 'PUNTOS', value: prizes.points, icon: 'chart', variant: 'emerald' },
    { key: 'gems', label: 'GEMAS', value: prizes.gems, icon: 'gem', variant: 'purple' },
  ].filter((c) => Boolean(c.value));

  return (
    <div className="tt-prize-collage">
      <div className="tt-prize-collage-grid">
        {cards.map((c, idx) => (
          <div key={c.key} className={`tt-prize-tile ${idx === 0 ? 'is-featured' : ''}`}>
            <IconBadge name={c.icon} variant={c.variant} size={34} />
            <div style={{ minWidth: 0 }}>
              <span className="tt-prize-tile-label">{c.label}</span>
              <strong className="tt-prize-tile-val">{c.value}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTA PRINCIPAL: TorneosView (ESTÉTICA LIMPIA · FLIP CLOCK · CERO MUROS TEXTO)
   ========================================================================== */
export default function TorneosView({
  players = [],
  clubs = INITIAL_CLUBS,
  tournaments = [],
  hallOfFame = [],
  seasonSnapshots = null,
  currentUser = null,
  isAdmin = false,
  initialSubTab = 'gira',
  theme = 'dark',
  onRequestTournamentInscription,
  onAdminApproveInscription,
  onAdminUpdateBracketResult,
  onOpenPlayerProfile,
  onOpenHeadToHead,
  onOpenAuth,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState(() => mapInitialSubTab(initialSubTab));

  useEffect(() => {
    setActiveTab(mapInitialSubTab(initialSubTab));
  }, [initialSubTab]);

  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [modalSection, setModalSection] = useState('cuadro');
  const [selectedRound, setSelectedRound] = useState('R16');

  const [paymentTournament, setPaymentTournament] = useState(null);
  const [chosenCategory, setChosenCategory] = useState('');
  const [localPendingMap, setLocalPendingMap] = useState({});
  const [localBracketOverrides, setLocalBracketOverrides] = useState({});

  const [masterSubTab, setMasterSubTab] = useState('clasificados');
  const [hofCategoryFilter, setHofCategoryFilter] = useState('ALL');

  const playersMap = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  const effectiveTournaments = useMemo(() => {
    const source =
      Array.isArray(tournaments) && tournaments.length > 0 ? tournaments : FALLBACK_TOURNAMENTS;
    return source.map((t) => ({
      ...t,
      bracketResults: {
        ...(t.bracketResults || {}),
        ...(localBracketOverrides[t.id] || {}),
      },
      pendingPaymentIds: Array.from(
        new Set([...(t.pendingPaymentIds || []), ...(localPendingMap[t.id] || [])])
      ),
    }));
  }, [tournaments, localBracketOverrides, localPendingMap]);

  const selectedTournament = useMemo(
    () => effectiveTournaments.find((t) => t.id === selectedTournamentId) || null,
    [effectiveTournaments, selectedTournamentId]
  );

  const activeBracket = useMemo(() => {
    if (!selectedTournament) return null;
    return buildTournamentBracket(selectedTournament, playersMap, players);
  }, [selectedTournament, playersMap, players]);

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

  const masterRaceAll = useMemo(
    () => computeMasterTop8Race(safeSnapshots, players, 'ALL', 'ALL'),
    [safeSnapshots, players]
  );

  const masterTop8Qualifiers = useMemo(() => masterRaceAll.slice(0, 8), [masterRaceAll]);

  const masterGroups = useMemo(() => {
    const q = masterTop8Qualifiers;
    return {
      groupA: [q[0], q[3], q[4], q[7]].filter(Boolean),
      groupB: [q[1], q[2], q[5], q[6]].filter(Boolean),
    };
  }, [masterTop8Qualifiers]);

  const effectiveHallOfFame = useMemo(() => {
    if (Array.isArray(hallOfFame) && hallOfFame.length > 0) return hallOfFame;

    const sorted = [...players].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
    const templates = [
      {
        id: 'hof-1',
        dateBadge: 'SEP 2026',
        tournamentName: 'Abierto de Primavera · Country Club',
        surface: 'Arcilla',
        category: '3ª Cat.',
        wins: 11,
        losses: 1,
        champion: sorted[0] || null,
      },
      {
        id: 'hof-2',
        dateBadge: 'JUN 2026',
        tournamentName: 'Copa El Tambo · Academia Cutipa',
        surface: 'Arcilla',
        category: '4ª Cat.',
        wins: 9,
        losses: 1,
        champion: sorted[1] || sorted[0] || null,
      },
      {
        id: 'hof-3',
        dateBadge: 'MAR 2026',
        tournamentName: 'Master Apertura · Club Tauro',
        surface: 'Arcilla',
        category: '5ª A',
        wins: 8,
        losses: 2,
        champion: sorted[2] || sorted[0] || null,
      },
      {
        id: 'hof-4',
        dateBadge: 'FEB 2026',
        tournamentName: 'Abierto Damas · Los Inkas',
        surface: 'Arcilla',
        category: 'Damas',
        wins: 7,
        losses: 0,
        champion:
          sorted.find((p) => p.division === 'Damas') || sorted[3] || sorted[0] || null,
      },
    ];
    return templates.filter((item) => Boolean(item.champion));
  }, [hallOfFame, players]);

  const filteredHallOfFame = useMemo(() => {
    if (hofCategoryFilter === 'ALL') return effectiveHallOfFame;
    return effectiveHallOfFame.filter((item) => item.category === hofCategoryFilter);
  }, [effectiveHallOfFame, hofCategoryFilter]);

  /* Acciones */
  const handleOpenTournamentModal = (tournament, defaultSection = 'cuadro') => {
    triggerHaptic('light');
    setSelectedTournamentId(tournament.id);
    setModalSection(defaultSection);
    setSelectedRound(Number(tournament.drawSize) === 8 ? 'QF' : 'R16');
  };

  const handleOpenPaymentModal = (tournament) => {
    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para solicitar tu inscripción.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    triggerHaptic('medium');
    setChosenCategory(getCategoryByPoints(currentUser.points).name);
    setPaymentTournament(tournament);
  };

  const handleCopyText = async (text, label) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(text);
      if (onNotify) onNotify(`${label} copiado.`, 'success');
    } catch {
      if (onNotify) onNotify(`${label}: ${text}`, 'info');
    }
  };

  const handleSendPaymentVoucher = () => {
    if (!paymentTournament || !currentUser) return;

    if (onRequestTournamentInscription) {
      onRequestTournamentInscription({
        tournamentId: paymentTournament.id,
        playerId: currentUser.id,
        category: chosenCategory || getCategoryByPoints(currentUser.points).name,
        amount: paymentTournament.entryFee,
      });
    } else {
      setLocalPendingMap((prev) => ({
        ...prev,
        [paymentTournament.id]: Array.from(
          new Set([...(prev[paymentTournament.id] || []), currentUser.id])
        ),
      }));
    }

    const waMsg = [
      'Hola organización de TOTAL TENIS, solicito validación de mi inscripción:',
      `• Torneo: ${paymentTournament.name}`,
      `• Jugador: ${currentUser.name} (${currentUser.credentialId || 'Socio'})`,
      `• Categoría: ${chosenCategory || getCategoryByPoints(currentUser.points).name}`,
      `• Monto abonado: S/ ${paymentTournament.entryFee}.00`,
      'Adjunto la constancia de mi Yape / Plin / Depósito.',
    ].join('\n');

    window.open(
      buildWhatsappLink(APP_CONFIG.supportWhatsApp, waMsg),
      '_blank',
      'noopener,noreferrer'
    );

    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        'Solicitud en estado "Pago en Verificación". Te confirmaremos apenas validemos tu abono.',
        'success'
      );
    }
    setPaymentTournament(null);
  };

  const handleAdminPickWinner = (matchId, side) => {
    if (!isAdmin || !selectedTournament) return;
    const score = '6-4, 6-3';
    if (onAdminUpdateBracketResult) {
      onAdminUpdateBracketResult(selectedTournament.id, matchId, { winnerSide: side, score });
    } else {
      setLocalBracketOverrides((prev) => ({
        ...prev,
        [selectedTournament.id]: {
          ...(prev[selectedTournament.id] || {}),
          [matchId]: { winnerSide: side, score },
        },
      }));
    }
    if (onNotify) onNotify(`Resultado validado en llave ${matchId}.`, 'success');
  };

  const getUserTournamentStatus = (t) => {
    if (!currentUser?.id) return 'NONE';
    if ((t.participantsIds || []).includes(currentUser.id)) return 'ENROLLED';
    if ((t.pendingPaymentIds || []).includes(currentUser.id)) return 'PENDING_PAYMENT';
    return 'NONE';
  };

  const progressPct = Math.min(100, Math.round((safeSnapshots.currentSeason / 4) * 100));
  const activeTabIdx = activeTab === 'torneos' ? 0 : activeTab === 'master' ? 1 : 2;

  return (
    <section
      className={`tt-torneos-view ${theme === 'light' ? 'is-light' : 'is-dark'}`}
      aria-label="Torneos Oficiales y Master Top 8 TOTAL TENIS"
    >
      {/* ====================================================================
          1. BARRA COMPACTA DE AVANCE ANUAL (SIN RECORTES NI SATURACIÓN)
          ==================================================================== */}
      <header className="tt-season-strip">
        <div className="tt-sp-top">
          <div>
            <span className="tt-sp-eyebrow">CIRCUITO {safeSnapshots.year} · TEMPORADA {safeSnapshots.currentSeason}/4</span>
            <h1 className="tt-sp-title">GIRA Y TORNEOS</h1>
          </div>
          <span className="tt-sp-pct-pill">{progressPct}% DEL AÑO</span>
        </div>

        <div className="tt-swings-track" aria-label="Avance de las 4 Giras">
          {SEASON_SWINGS.map((sw) => {
            const isDone = sw.season < safeSnapshots.currentSeason;
            const isActive = sw.season === safeSnapshots.currentSeason;
            return (
              <div
                key={sw.id}
                className={`tt-swing-step ${isDone ? 'is-done' : isActive ? 'is-active' : ''}`}
              >
                <div className="tt-swing-bar" />
                <strong>{sw.name}</strong>
              </div>
            );
          })}
        </div>
      </header>

      {/* ====================================================================
          2. CONMUTADOR DE 3 PESTAÑAS CON SLIDER ELÁSTICO
          ==================================================================== */}
      <div className="tt-tn-subtabs" role="tablist" aria-label="Secciones de Torneos">
        <span
          className={`tt-tn-subtab-slider ${activeTab === 'master' ? 'is-champagne' : ''}`}
          aria-hidden="true"
          style={{ transform: `translateX(${activeTabIdx * 100}%)` }}
        />

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'torneos'}
          className={`tt-tn-subtab ${activeTab === 'torneos' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('torneos');
          }}
        >
          Torneos
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'master'}
          className={`tt-tn-subtab is-champagne ${activeTab === 'master' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('medium');
            setActiveTab('master');
          }}
        >
          Master Top 8
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'fama'}
          className={`tt-tn-subtab ${activeTab === 'fama' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('fama');
          }}
        >
          Salón Fama
        </button>
      </div>

      {/* ====================================================================
          VISTA 1: TORNEOS ACTIVOS (PALETA LIMPIA · CERO CHOQUE VERDE/NARANJA)
          ==================================================================== */}
      {activeTab === 'torneos' && (
        <div key="tn-list" className="tt-tn-stack tt-tn-panel-reveal">
          <div className="tt-tournaments-grid">
            {effectiveTournaments.map((t, idx) => {
              const club = getClubById(clubs, t.clubId);
              const enrolledCount = Math.max(
                (t.participantsIds || []).length,
                t.status === 'IN_PLAY'
                  ? Math.min(t.drawSize, players.length)
                  : Math.min(Math.max(0, t.drawSize - 5), players.length)
              );
              const spotsLeft = Math.max(0, t.drawSize - enrolledCount);
              const fillPct = Math.min(100, Math.round((enrolledCount / t.drawSize) * 100));
              const userStatus = getUserTournamentStatus(t);

              const statusChip =
                t.status === 'IN_PLAY'
                  ? { label: 'EN CURSO', cls: 'is-live' }
                  : t.status === 'OPEN'
                  ? { label: 'INSCRIPCIONES ABIERTAS', cls: 'is-open' }
                  : t.status === 'FINISHED'
                  ? { label: 'FINALIZADO', cls: 'is-done' }
                  : { label: 'PRÓXIMAMENTE', cls: 'is-soon' };

              return (
                <article
                  key={t.id}
                  className="tt-tcard"
                  style={{ '--tn-delay': `${idx * 65}ms` }}
                >
                  <div
                    className="tt-tcard-hero"
                    onClick={() => handleOpenTournamentModal(t, 'cuadro')}
                  >
                    <SmartImage
                      src={t.banner || t.bannerUrl}
                      fallbackSrc={ASSETS.torneoApertura}
                      alt={t.name}
                      className="tt-tcard-img"
                    />
                    <div className="tt-tcard-scrim" />

                    <div className="tt-tcard-top-badges">
                      <span className={`tt-tcard-status ${statusChip.cls}`}>
                        {statusChip.cls === 'is-live' && <i className="tt-live-tiny" />}
                        {statusChip.label}
                      </span>
                      <span className="tt-tcard-date-glass">{t.dateLabel}</span>
                    </div>

                    <div className="tt-tcard-hero-bottom">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="tt-tcard-surface">
                          {t.surface} · Cuadro de {t.drawSize}
                        </span>
                        <h2 className="tt-tcard-title">{t.name}</h2>
                      </div>
                      {club?.logo && (
                        <div className="tt-tcard-club-logo">
                          <SmartImage
                            src={club.logo}
                            alt={club.shortName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tt-tcard-body">
                    <div className="tt-tcard-specs-row">
                      <span className="tt-spec-chip is-fee">S/ {t.entryFee}</span>
                      <span className="tt-spec-chip">{t.categoryLabel}</span>
                      {t.includesBalls && <span className="tt-spec-chip is-ok">Con pelotas</span>}
                      {t.hasConsolation && <span className="tt-spec-chip">Ronda Consuelo</span>}
                    </div>

                    <div className="tt-spots-box">
                      <div className="tt-spots-head">
                        <span>
                          <strong>{enrolledCount}</strong>/{t.drawSize} cupos
                        </span>
                        <span>{spotsLeft > 0 ? `Quedan ${spotsLeft}` : 'Cuadro lleno'}</span>
                      </div>
                      <div className="tt-spots-track">
                        <div className="tt-spots-fill" style={{ width: `${fillPct}%` }} />
                      </div>
                    </div>

                    <div className="tt-tcard-prize-strip">
                      <TTIcon name="trophy" size={15} style={{ color: '#E5C16C', flexShrink: 0 }} />
                      <span>{t.prizes?.cash || t.prizes?.trophy}</span>
                    </div>

                    <div className="tt-tcard-actions">
                      <button
                        type="button"
                        className="tt-btn tt-btn-ghost tt-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleOpenTournamentModal(t, 'cuadro')}
                      >
                        Llaves y Premios
                      </button>

                      {t.status !== 'FINISHED' && (
                        <>
                          {userStatus === 'ENROLLED' ? (
                            <span className="tt-enrolled-pill">
                              <TTIcon name="check" size={14} />
                              Inscrito
                            </span>
                          ) : userStatus === 'PENDING_PAYMENT' ? (
                            <span className="tt-verifying-pill">
                              <TTIcon name="clock" size={14} />
                              Verificando
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="tt-btn tt-btn-primary tt-btn-sm"
                              disabled={spotsLeft === 0}
                              onClick={() => handleOpenPaymentModal(t)}
                            >
                              {spotsLeft === 0 ? 'Lleno' : `Inscribirme`}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          VISTA 2: MASTER TOP 8 (COMPACTO + FLIP-CLOCK REAL + VISUAL)
          ==================================================================== */}
      {activeTab === 'master' && (
        <div key="tn-master" className="tt-tn-stack tt-tn-master-reveal">
          {/* Hero compacto con imagen, trofeo 3D y Flip-Clock físico en vivo */}
          <div className="tt-master-compact-hero">
            <SmartImage
              src={ASSETS.torneoMasterTop8}
              fallbackSrc={ASSETS.torneoApertura}
              alt="Master Top 8 Finals"
              className="tt-master-hero-bg"
            />
            <div className="tt-master-hero-scrim" />

            <div className="tt-mch-top">
              <div className="tt-mch-brand">
                <SmartImage
                  src={ASSETS.trofeoMasterTop8}
                  alt="Copa Master Top 8"
                  className="tt-mch-trophy"
                />
                <div>
                  <span className="tt-mch-tag">SOLO POR MÉRITO · S/ 0 INSCRIPCIÓN</span>
                  <h2 className="tt-mch-title">MASTER TOP 8 · {safeSnapshots.year}</h2>
                </div>
              </div>
            </div>

            {/* Contador físico Split-Flap en tiempo real (hora Perú, nunca se reinicia) */}
           <SeasonFlipCountdown
              seasonNumber={safeSnapshots.currentSeason}
              year={safeSnapshots.year}
              customEndDate={
                (safeSnapshots.seasons.find((s) => s.number === safeSnapshots.currentSeason) || {})
                  .endDate || null
              }
            />

            {/* Pestañas limpias internas */}
            <div className="tt-master-pills-bar">
              {[
                { id: 'clasificados', label: 'Top 8 Hoy' },
                { id: 'grupos', label: 'Grupos A y B' },
                { id: 'resumen', label: 'Formato' },
                { id: 'premios', label: 'Premios' },
              ].map((mTab) => (
                <button
                  key={mTab.id}
                  type="button"
                  className={`tt-master-pill ${masterSubTab === mTab.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setMasterSubTab(mTab.id);
                  }}
                >
                  {mTab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Clasificados Top 8 (abierto por defecto: datos reales al instante) */}
          {masterSubTab === 'clasificados' && (
            <div className="tt-master-q-list">
              {masterTop8Qualifiers.length === 0 ? (
                <EmptyStateCard
                  theme={theme}
                  title="Carrera anual en marcha"
                  description="Apenas se confirmen partidos verás aquí a los 8 clasificados."
                />
              ) : (
                masterTop8Qualifiers.map((row, idx) => (
                  <div
                    key={row.player.id}
                    className={`tt-master-q-row ${idx < 3 ? 'is-podium' : ''}`}
                    style={{ '--tn-delay': `${idx * 40}ms` }}
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenPlayerProfile) onOpenPlayerProfile(row.player);
                    }}
                  >
                    <span className="tt-master-q-num">#{row.raceRank}</span>
                    <SmartImage
                      src={row.player.avatar}
                      alt={row.player.name}
                      initials={row.player.name}
                      style={{
                        width: 44,
                        height: 52,
                        borderRadius: 12,
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        border: idx === 0 ? '2px solid #E5C16C' : '1.5px solid var(--tt-border-medium)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{row.player.name}</strong>
                      <small>{row.category.name}</small>
                    </div>
                    <div className="tt-master-q-pts">
                      <strong>{row.totalAnnual.toLocaleString('es-PE')}</strong>
                      <span>PTS AÑO</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. Proyección Grupos A y B */}
          {masterSubTab === 'grupos' && (
            <div className="tt-master-groups-grid">
              {[
                { key: 'A', title: 'GRUPO A · MANTARO', rows: masterGroups.groupA },
                { key: 'B', title: 'GRUPO B · HUAYTAPALLANA', rows: masterGroups.groupB },
              ].map((grp) => (
                <div key={grp.key} className="tt-group-card">
                  <div className="tt-group-card-head">
                    <strong>{grp.title}</strong>
                    <span>Top 2 avanzan</span>
                  </div>
                  <div className="tt-group-rows">
                    {grp.rows.map((row, idx) => (
                      <div
                        key={row.player.id}
                        className={`tt-group-row ${idx < 2 ? 'is-advancing' : ''}`}
                        onClick={() => {
                          triggerHaptic('light');
                          if (onOpenPlayerProfile) onOpenPlayerProfile(row.player);
                        }}
                      >
                        <span className="tt-group-seed">#{row.raceRank}</span>
                        <SmartImage
                          src={row.player.avatar}
                          alt={row.player.name}
                          initials={row.player.name}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            objectPosition: 'center top',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{row.player.name}</strong>
                          <small>{row.category.name}</small>
                        </div>
                        <strong className="tt-group-pts-val">
                          {row.totalAnnual.toLocaleString('es-PE')}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Formato Visual en 3 Pasos Cortos (Cero muros de texto) */}
          {masterSubTab === 'resumen' && (
            <div className="tt-master-phases-grid">
              {[
                {
                  num: '01',
                  icon: 'chart',
                  title: 'Suma T1 + T2 + T3 + T4',
                  desc: 'Los 8 primeros del año clasifican sin pagar inscripción.',
                },
                {
                  num: '02',
                  icon: 'users',
                  title: '2 Grupos de 4',
                  desc: 'Todos contra todos en fase de grupos (3 partidos mínimos).',
                },
                {
                  num: '03',
                  icon: 'trophy',
                  title: 'Semis y Gran Final',
                  desc: 'Cruces #1 vs #2 hasta coronar al Maestro del Año.',
                },
              ].map((ph, i) => (
                <article
                  key={ph.num}
                  className="tt-phase-tile"
                  style={{ '--tn-delay': `${i * 65}ms` }}
                >
                  <div className="tt-phase-top">
                    <span className="tt-phase-num">{ph.num}</span>
                    <IconBadge name={ph.icon} variant="gold" size={32} />
                  </div>
                  <h3>{ph.title}</h3>
                  <p>{ph.desc}</p>
                </article>
              ))}
            </div>
          )}

          {/* 4. Premios Mayores */}
          {masterSubTab === 'premios' && (
            <div className="tt-master-rewards-wrap">
              <div className="tt-mr-card is-annual">
                <span className="tt-mr-kicker is-gold">{ANNUAL_MASTER_TOP8_REWARDS.badge}</span>
                <h3>{ANNUAL_MASTER_TOP8_REWARDS.title}</h3>
                <div className="tt-mr-podium">
                  {ANNUAL_MASTER_TOP8_REWARDS.podium.map((p) => (
                    <div key={p.place} className="tt-mr-item">
                      <strong>{p.label}</strong>
                      <span>{p.rewards.join(' · ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tt-mr-card">
                <span className="tt-mr-kicker">{SEASON_QUARTERLY_REWARDS.badge}</span>
                <h3>{SEASON_QUARTERLY_REWARDS.title}</h3>
                <div className="tt-mr-podium">
                  {SEASON_QUARTERLY_REWARDS.podium.map((p) => (
                    <div key={p.place} className="tt-mr-item">
                      <strong>{p.label}</strong>
                      <span>
                        {p.physicalItems.join(' + ')} · {p.gemsRangeLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          VISTA 3: SALÓN DE LA FAMA VISUAL (TARJETAS DE TROFEO · CERO LECTURA LARGA)
          ==================================================================== */}
      {activeTab === 'fama' && (
        <div key="tn-fama" className="tt-tn-stack tt-tn-panel-reveal">
          <div className="tt-hof-filters">
            {['ALL', '3ª Cat.', '4ª Cat.', '5ª A', 'Damas'].map((catLabel) => (
              <button
                key={catLabel}
                type="button"
                className={`tt-hof-chip ${hofCategoryFilter === catLabel ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setHofCategoryFilter(catLabel);
                }}
              >
                {catLabel === 'ALL' ? 'Todos' : catLabel}
              </button>
            ))}
          </div>

          {filteredHallOfFame.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin campeones en esta categoría"
              description="Selecciona otra categoría para ver los títulos registrados."
              actionLabel="Ver todos"
              onAction={() => setHofCategoryFilter('ALL')}
            />
          ) : (
            <div className="tt-hof-visual-grid">
              {filteredHallOfFame.map((entry, idx) => {
                const champ = entry.champion;
                const total = (Number(entry.wins) || 0) + (Number(entry.losses) || 0);
                const eff = total > 0 ? Math.round((entry.wins / total) * 100) : 100;
                const club = getClubById(clubs, champ?.clubId);
                const surname = (champ?.name || 'CAMPEÓN').split(' ').slice(-1)[0].toUpperCase();

                return (
                  <article
                    key={entry.id}
                    className="tt-hof-card"
                    style={{ '--tn-delay': `${idx * 60}ms` }}
                    onClick={() => {
                      triggerHaptic('light');
                      if (onOpenPlayerProfile && champ) onOpenPlayerProfile(champ);
                    }}
                  >
                    {/* Retrato protagonista en marco champán */}
                    <div className="tt-hof-portrait">
                      <SmartImage
                        src={champ?.fullBodyPhoto || champ?.avatar}
                        alt={champ?.name || 'Campeón'}
                        initials={champ?.name || 'TT'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                        }}
                      />
                      <span className="tt-hof-crown-pill">
                        <TTIcon name="trophy" size={12} />
                        CAMPEÓN
                      </span>
                    </div>

                    {/* Datos visuales escaneables en 1 segundo */}
                    <div className="tt-hof-body">
                      <div className="tt-hof-meta-row">
                        <span className="tt-hof-cat-tag">{entry.category}</span>
                        <span className="tt-hof-date-tag">{entry.dateBadge || entry.year}</span>
                      </div>

                      <strong className="tt-hof-surname">{surname}</strong>
                      <span className="tt-hof-fullname">
                        {champ?.name}
                        {club ? ` · ${club.shortName}` : ''}
                      </span>

                      <span className="tt-hof-tourney">{entry.tournamentName}</span>

                      <div className="tt-hof-foot">
                        <div className="tt-hof-stats">
                          <span className="is-rec">
                            {entry.wins}V–{entry.losses}D
                          </span>
                          <span className="is-pct">{eff}%</span>
                        </div>

                        {onOpenHeadToHead && (!currentUser || currentUser.id !== champ?.id) && (
                          <button
                            type="button"
                            className="tt-hof-h2h-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('light');
                              onOpenHeadToHead(champ);
                            }}
                          >
                            H2H
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL 1: FICHA DEL TORNEO + LLAVES DESDE OCTAVOS
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(selectedTournament && activeBracket)}
        onClose={() => setSelectedTournamentId(null)}
        title={selectedTournament?.name || 'Torneo Oficial'}
        subtitle={
          selectedTournament
            ? `${selectedTournament.clubName} · ${selectedTournament.dateLabel} · S/ ${selectedTournament.entryFee}`
            : ''
        }
        icon={<IconBadge name="trophy" variant="gold" size={38} />}
        isWide
      >
        {selectedTournament && activeBracket && (
          <div className="tt-tmodal-wrap">
            <div className="tt-tmodal-tabs">
              <button
                type="button"
                className={`tt-tmodal-tab ${modalSection === 'cuadro' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setModalSection('cuadro');
                }}
              >
                Cuadro
              </button>

              {selectedTournament.hasConsolation && (
                <button
                  type="button"
                  className={`tt-tmodal-tab ${modalSection === 'consuelo' ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setModalSection('consuelo');
                  }}
                >
                  Consuelo
                </button>
              )}

              <button
                type="button"
                className={`tt-tmodal-tab ${modalSection === 'participantes' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setModalSection('participantes');
                }}
              >
                Inscritos ({activeBracket.enrolledPlayers.length}/{selectedTournament.drawSize})
              </button>

              <button
                type="button"
                className={`tt-tmodal-tab ${modalSection === 'premios' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setModalSection('premios');
                }}
              >
                Premios
              </button>
            </div>

            {modalSection === 'cuadro' && (
              <div className="tt-bracket-section">
                <div className="tt-rounds-pills">
                  {activeBracket.drawSize === 16 && (
                    <button
                      type="button"
                      className={`tt-round-pill ${selectedRound === 'R16' ? 'is-active' : ''}`}
                      onClick={() => setSelectedRound('R16')}
                    >
                      Octavos
                    </button>
                  )}
                  <button
                    type="button"
                    className={`tt-round-pill ${selectedRound === 'QF' ? 'is-active' : ''}`}
                    onClick={() => setSelectedRound('QF')}
                  >
                    Cuartos
                  </button>
                  <button
                    type="button"
                    className={`tt-round-pill ${selectedRound === 'SF' ? 'is-active' : ''}`}
                    onClick={() => setSelectedRound('SF')}
                  >
                    Semis
                  </button>
                  <button
                    type="button"
                    className={`tt-round-pill is-final ${selectedRound === 'FINAL' ? 'is-active' : ''}`}
                    onClick={() => setSelectedRound('FINAL')}
                  >
                    Final
                  </button>
                </div>

                <div key={selectedRound} className="tt-bracket-matches-grid">
                  {selectedRound === 'R16' &&
                    activeBracket.roundOf16.map((m, idx) => (
                      <BracketMatchCard
                        key={m.id}
                        match={m}
                        animIndex={idx}
                        isAdmin={isAdmin}
                        onSelectAdminWinner={handleAdminPickWinner}
                        onOpenPlayerProfile={onOpenPlayerProfile}
                      />
                    ))}
                  {selectedRound === 'QF' &&
                    activeBracket.quarterFinals.map((m, idx) => (
                      <BracketMatchCard
                        key={m.id}
                        match={m}
                        animIndex={idx}
                        isAdmin={isAdmin}
                        onSelectAdminWinner={handleAdminPickWinner}
                        onOpenPlayerProfile={onOpenPlayerProfile}
                      />
                    ))}
                  {selectedRound === 'SF' &&
                    activeBracket.semiFinals.map((m, idx) => (
                      <BracketMatchCard
                        key={m.id}
                        match={m}
                        animIndex={idx}
                        isAdmin={isAdmin}
                        onSelectAdminWinner={handleAdminPickWinner}
                        onOpenPlayerProfile={onOpenPlayerProfile}
                      />
                    ))}
                  {selectedRound === 'FINAL' && (
                    <BracketMatchCard
                      match={activeBracket.finalMatch}
                      animIndex={0}
                      isAdmin={isAdmin}
                      onSelectAdminWinner={handleAdminPickWinner}
                      onOpenPlayerProfile={onOpenPlayerProfile}
                    />
                  )}
                </div>
              </div>
            )}

            {modalSection === 'consuelo' && selectedTournament.hasConsolation && (
              <div className="tt-bracket-section">
                <div className="tt-bracket-matches-grid">
                  {activeBracket.consolationMatches.map((m, idx) => (
                    <BracketMatchCard
                      key={m.id}
                      match={m}
                      animIndex={idx}
                      isAdmin={isAdmin}
                      onSelectAdminWinner={handleAdminPickWinner}
                      onOpenPlayerProfile={onOpenPlayerProfile}
                    />
                  ))}
                </div>
              </div>
            )}

            {modalSection === 'participantes' && (
              <div className="tt-participants-section">
                {isAdmin && (selectedTournament.pendingPaymentIds || []).length > 0 && (
                  <div className="tt-admin-pending-box">
                    <strong>Pagos por aprobar ({selectedTournament.pendingPaymentIds.length})</strong>
                    {selectedTournament.pendingPaymentIds.map((pid) => {
                      const p = playersMap[pid];
                      if (!p) return null;
                      return (
                        <div key={pid} className="tt-admin-pending-row">
                          <span>{p.name}</span>
                          <button
                            type="button"
                            className="tt-btn tt-btn-primary tt-btn-sm"
                            onClick={() => {
                              triggerHaptic('success');
                              if (onAdminApproveInscription) {
                                onAdminApproveInscription(selectedTournament.id, pid);
                              }
                            }}
                          >
                            Aprobar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="tt-enrolled-grid">
                  {activeBracket.enrolledPlayers.map((p, idx) => (
                    <div
                      key={p.id}
                      className="tt-enrolled-row"
                      onClick={() => {
                        triggerHaptic('light');
                        if (onOpenPlayerProfile) onOpenPlayerProfile(p);
                      }}
                    >
                      <span className="tt-enrolled-num">{idx + 1}</span>
                      <SmartImage
                        src={p.avatar}
                        alt={p.name}
                        initials={p.name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{p.name}</strong>
                        <small>{getCategoryByPoints(p.points).name}</small>
                      </div>
                      <span className="tt-enrolled-pts">
                        {Number(p.points || 0).toLocaleString('es-PE')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalSection === 'premios' && (
              <div className="tt-tmodal-prizes-stack">
                <PrizeCollageShowcase prizes={selectedTournament.prizes} />
                <div className="tt-includes-box">
                  <strong>Incluye tu inscripción (S/ {selectedTournament.entryFee})</strong>
                  <ul>
                    {(selectedTournament.includesItems || []).map((line, i) => (
                      <li key={i}>
                        <TTIcon name="check" size={14} style={{ color: '#00DC7D', flexShrink: 0 }} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedTournament.status !== 'FINISHED' && (
              <div className="tt-tmodal-foot">
                {getUserTournamentStatus(selectedTournament) === 'ENROLLED' ? (
                  <div className="tt-enrolled-pill" style={{ width: '100%', justifyContent: 'center' }}>
                    <TTIcon name="check" size={16} />
                    Ya estás inscrito en este torneo
                  </div>
                ) : getUserTournamentStatus(selectedTournament) === 'PENDING_PAYMENT' ? (
                  <div className="tt-verifying-pill" style={{ width: '100%', justifyContent: 'center' }}>
                    <TTIcon name="clock" size={16} />
                    Pago en verificación
                  </div>
                ) : (
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      const target = selectedTournament;
                      setSelectedTournamentId(null);
                      handleOpenPaymentModal(target);
                    }}
                  >
                    Inscribirme · S/ {selectedTournament.entryFee}.00
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 2: INSCRIPCIÓN CON PAGO (YAPE / PLIN / BANCO)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(paymentTournament)}
        onClose={() => setPaymentTournament(null)}
        title="Inscripción al Torneo"
        subtitle={paymentTournament?.name || ''}
        icon={<IconBadge name="trophy" variant="emerald" size={38} />}
        isTopLayer
      >
        {paymentTournament && (
          <div className="tt-pay-modal-stack">
            <div className="tt-pay-hero-box">
              <div>
                <span>CUOTA DE INSCRIPCIÓN</span>
                <strong>S/ {paymentTournament.entryFee}.00</strong>
              </div>
              <span className={`tt-pay-balls-tag ${paymentTournament.includesBalls ? 'is-yes' : ''}`}>
                {paymentTournament.includesBalls ? 'Con pelotas nuevas' : 'Sin pelotas'}
              </span>
            </div>

            <div className="tt-pay-field">
              <label htmlFor="tt-pay-cat">Categoría</label>
              <select
                id="tt-pay-cat"
                className="tt-pay-select"
                value={chosenCategory}
                onChange={(e) => setChosenCategory(e.target.value)}
              >
                {CATEGORIES_SCALE.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="Damas">Damas</option>
                <option value="+40 Senior">+40 Senior</option>
              </select>
            </div>

            <div className="tt-pay-channels-box">
              <span className="tt-pay-channels-title">MEDIOS DE PAGO</span>
              <p className="tt-pay-holder">Titular: {PAYMENT_CHANNELS.holder}</p>

              <div className="tt-pay-row">
                <div>
                  <small>Yape / Plin</small>
                  <strong>{PAYMENT_CHANNELS.yapePlin}</strong>
                </div>
                <button
                  type="button"
                  className="tt-copy-chip"
                  onClick={() => handleCopyText(PAYMENT_CHANNELS.yapePlin, 'Yape / Plin')}
                >
                  Copiar
                </button>
              </div>

              <div className="tt-pay-row">
                <div>
                  <small>{PAYMENT_CHANNELS.bankName}</small>
                  <strong>{PAYMENT_CHANNELS.bankAccount}</strong>
                </div>
                <button
                  type="button"
                  className="tt-copy-chip"
                  onClick={() => handleCopyText(PAYMENT_CHANNELS.bankAccount, 'Cuenta')}
                >
                  Copiar
                </button>
              </div>
            </div>

            <button
              type="button"
              className="tt-btn tt-btn-primary"
              style={{ width: '100%' }}
              onClick={handleSendPaymentVoucher}
            >
              <TTIcon name="whatsapp" size={18} />
              Enviar Constancia por WhatsApp
            </button>
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          ESTILOS FLAGSHIP (CONTRASTE LIMPIO · CERO NARANJA FOSFORESCENTE · FLIP CLOCK)
          ==================================================================== */}
      <style>{`
        .tt-torneos-view {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        /* 1. BARRA COMPACTA DE AVANCE ANUAL */
        .tt-season-strip {
          border-radius: 20px;
          padding: 14px 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-sp-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .tt-sp-eyebrow { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.1em; color: var(--tt-emerald-text); }
        .tt-sp-title { margin: 2px 0 0; font-family: var(--tt-font-display); font-style: italic; font-weight: 900; font-size: 1.48rem; line-height: 1; color: var(--tt-text); }
        .tt-sp-pct-pill {
          padding: 5px 10px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border-medium);
          color: var(--tt-text);
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .tt-swings-track { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
        .tt-swing-step { display: flex; flex-direction: column; gap: 4px; }
        .tt-swing-bar { height: 5px; border-radius: 999px; background: var(--tt-surface-2); }
        .tt-swing-step.is-done .tt-swing-bar { background: rgba(0, 220, 125, 0.45); }
        .tt-torneos-view.is-light .tt-swing-step.is-done .tt-swing-bar { background: rgba(30, 7, 52, 0.35); }
        .tt-swing-step.is-active .tt-swing-bar { background: #00DC7D; box-shadow: 0 0 10px rgba(0, 220, 125, 0.55); }
        .tt-torneos-view.is-light .tt-swing-step.is-active .tt-swing-bar { background: #1E0734; box-shadow: none; }
        .tt-swing-step strong { font-size: 0.66rem; font-weight: 800; color: var(--tt-text-muted); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-swing-step.is-active strong { color: var(--tt-text); font-weight: 900; }

        /* 2. CONMUTADOR CON SLIDER ELÁSTICO */
        .tt-tn-subtabs {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 4px;
          border-radius: 17px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-tn-subtab-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc((100% - 8px) / 3);
          border-radius: 12px;
          background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%);
          box-shadow: 0 6px 16px rgba(0, 220, 125, 0.28);
          transition: transform 320ms cubic-bezier(0.22, 1.24, 0.36, 1), background 300ms ease;
          pointer-events: none;
          z-index: 0;
        }
        .tt-tn-subtab-slider.is-champagne {
          background: linear-gradient(135deg, #F5E1A4 0%, #CCA046 100%);
          box-shadow: 0 6px 16px rgba(204, 160, 70, 0.34);
        }
        .tt-torneos-view.is-light .tt-tn-subtab-slider:not(.is-champagne) {
          background: #1E0734;
          box-shadow: 0 5px 14px rgba(30, 7, 52, 0.2);
        }
        .tt-tn-subtab {
          position: relative;
          z-index: 1;
          min-height: 40px;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          transition: color 200ms ease;
        }
        .tt-tn-subtab.is-active { color: #10021E; font-weight: 900; }
        .tt-torneos-view.is-light .tt-tn-subtab.is-active:not(.is-champagne) { color: #00DC7D; }
        .tt-tn-subtab.is-champagne.is-active { color: #1B1202; }

        .tt-tn-stack { display: flex; flex-direction: column; gap: 13px; }
        .tt-tn-panel-reveal { animation: ttTnReveal 340ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .tt-tn-master-reveal { animation: ttMasterIn 400ms cubic-bezier(0.22, 1.12, 0.36, 1) both; }
        @keyframes ttTnReveal { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ttMasterIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        /* 3. TORNEOS ACTIVOS (SIN CHOQUE VERDE/NARANJA) */
        .tt-tournaments-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 760px) {
          .tt-tournaments-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .tt-tcard {
          border-radius: 23px;
          overflow: hidden;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          animation: ttTnReveal 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--tn-delay, 0ms);
        }
        .tt-tcard-hero {
          position: relative;
          min-height: 178px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 13px 14px;
          background: #160428;
          overflow: hidden;
        }
        .tt-tcard-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .tt-tcard-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(16, 4, 30, 0.45) 0%, rgba(16, 4, 30, 0.18) 44%, rgba(14, 3, 26, 0.94) 100%);
        }
        .tt-tcard-top-badges { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tt-tcard-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.06em;
        }
        .tt-tcard-status.is-live { background: #00DC7D; color: #10021E; }
        .tt-tcard-status.is-open { background: #FAF9F5; color: #1E0734; }
        .tt-tcard-status.is-soon { background: rgba(250, 249, 245, 0.18); color: #FAF9F5; backdrop-filter: blur(8px); }
        .tt-tcard-status.is-done { background: rgba(148, 163, 184, 0.25); color: #FAF9F5; }
        .tt-live-tiny { width: 6px; height: 6px; border-radius: 50%; background: #10021E; animation: ttLivePulse 1.6s infinite; }

        .tt-tcard-date-glass {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(16, 4, 30, 0.78);
          border: 1px solid rgba(250, 249, 245, 0.22);
          color: #FAF9F5;
          font-size: 0.66rem;
          font-weight: 800;
        }
        .tt-tcard-hero-bottom { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
        .tt-tcard-surface { display: block; font-size: 0.68rem; font-weight: 700; color: rgba(250, 249, 245, 0.8); margin-bottom: 2px; }
        .tt-tcard-title { margin: 0; font-family: var(--tt-font-display); font-weight: 900; font-size: 1.24rem; line-height: 1.06; color: #FAF9F5; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65); }
        .tt-tcard-club-logo { width: 44px; height: 44px; border-radius: 13px; background: #FFFFFF; border: 2px solid #FAF9F5; overflow: hidden; flex-shrink: 0; }

        .tt-tcard-body { padding: 13px; display: flex; flex-direction: column; gap: 10px; }
        .tt-tcard-specs-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .tt-spec-chip {
          padding: 4px 9px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          font-size: 0.69rem;
          font-weight: 700;
          color: var(--tt-text-secondary);
        }
        .tt-spec-chip.is-fee { background: #FAF9F5; color: #1E0734; border-color: transparent; font-weight: 900; }
        .tt-torneos-view.is-light .tt-spec-chip.is-fee { background: #1E0734; color: #FAF9F5; }
        .tt-spec-chip.is-ok { border-color: rgba(0, 220, 125, 0.35); color: var(--tt-emerald-text); }

        .tt-spots-box { display: flex; flex-direction: column; gap: 5px; }
        .tt-spots-head { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--tt-text-muted); }
        .tt-spots-head strong { color: var(--tt-text); }
        .tt-spots-track { height: 6px; border-radius: 999px; background: var(--tt-surface-2); overflow: hidden; }
        .tt-spots-fill { height: 100%; border-radius: 999px; background: #00DC7D; transition: width 480ms ease; }
        .tt-torneos-view.is-light .tt-spots-fill { background: #1E0734; }

        .tt-tcard-prize-strip { display: flex; align-items: center; gap: 8px; padding: 9px 11px; border-radius: 12px; background: var(--tt-surface-2); font-size: 0.74rem; font-weight: 700; color: var(--tt-text); }
        .tt-tcard-actions { display: flex; align-items: center; gap: 8px; }
        .tt-enrolled-pill, .tt-verifying-pill { min-height: 40px; padding: 0 13px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px; font-size: 0.76rem; font-weight: 800; }
        .tt-enrolled-pill { background: rgba(0, 220, 125, 0.14); border: 1px solid rgba(0, 220, 125, 0.45); color: var(--tt-emerald-text); }
        .tt-verifying-pill { background: rgba(229, 193, 108, 0.16); border: 1px solid rgba(229, 193, 108, 0.48); color: #E5C16C; }
        .tt-torneos-view.is-light .tt-verifying-pill { color: #8A5D10; }

        /* 4. MASTER TOP 8 COMPACTO + FLIP-CLOCK FÍSICO SPLIT-FLAP */
        .tt-master-compact-hero {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          padding: 15px;
          background: #160428;
          color: #FAF9F5;
          border: 1px solid rgba(229, 193, 108, 0.4);
          box-shadow: 0 16px 36px rgba(8, 1, 18, 0.42);
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-master-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.36; }
        .tt-master-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(155deg, rgba(22, 4, 40, 0.92) 0%, rgba(28, 7, 48, 0.8) 55%, rgba(14, 2, 26, 0.97) 100%);
        }
        .tt-mch-top { position: relative; z-index: 2; }
        .tt-mch-brand { display: flex; align-items: center; gap: 11px; }
        .tt-mch-trophy { width: 46px; height: 46px; object-fit: contain; flex-shrink: 0; filter: drop-shadow(0 6px 14px rgba(229, 193, 108, 0.36)); }
        .tt-mch-tag { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.1em; color: #E5C16C; }
        .tt-mch-title { margin: 2px 0 0; font-family: var(--tt-font-display); font-style: italic; font-weight: 900; font-size: 1.56rem; line-height: 1; color: #FAF9F5; }

        /* Reloj físico Split-Flap (tarjetas mecánicas con bisagra central) */
        .tt-flip-strip {
          position: relative;
          z-index: 2;
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(12, 2, 22, 0.72);
          border: 1px solid rgba(250, 249, 245, 0.14);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-flip-meta { display: inline-flex; align-items: center; gap: 7px; font-size: 0.64rem; letter-spacing: 0.08em; color: rgba(250, 249, 245, 0.84); }
        .tt-flip-dot { width: 7px; height: 7px; border-radius: 50%; background: #00DC7D; box-shadow: 0 0 8px rgba(0, 220, 125, 0.85); animation: ttLivePulse 1.8s infinite; }

        .tt-flip-clock { display: inline-flex; align-items: flex-start; gap: 5px; margin-left: auto; }
        .tt-flip-unit { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .tt-flip-card {
          position: relative;
          min-width: 38px;
          height: 36px;
          padding: 0 5px;
          border-radius: 8px;
          background: linear-gradient(180deg, #2B0D4B 0%, #21083B 49%, #140425 51%, #1D0734 100%);
          border: 1px solid rgba(250, 249, 245, 0.18);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 4px 10px rgba(0, 0, 0, 0.45);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          perspective: 260px;
          animation: ttFlipTick 360ms cubic-bezier(0.22, 1.15, 0.36, 1) both;
        }
        @keyframes ttFlipTick {
          0% { transform: rotateX(-38deg); opacity: 0.72; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        .tt-flip-num {
          font-family: var(--tt-font-display);
          font-size: 1.24rem;
          font-weight: 900;
          line-height: 1;
          color: #FAF9F5;
          font-variant-numeric: tabular-nums;
        }
        .tt-flip-hinge {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1.5px;
          background: rgba(8, 1, 16, 0.88);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
          pointer-events: none;
        }
        .tt-flip-lbl { font-size: 0.5rem; font-weight: 900; letter-spacing: 0.08em; color: rgba(250, 249, 245, 0.6); }
        .tt-flip-sep { font-family: var(--tt-font-display); font-size: 1.05rem; color: #E5C16C; padding-top: 6px; font-weight: 900; }

        .tt-master-pills-bar { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
        .tt-master-pill {
          min-height: 34px;
          padding: 0 6px;
          border-radius: 10px;
          background: rgba(250, 249, 245, 0.1);
          border: 1px solid rgba(250, 249, 245, 0.16);
          color: rgba(250, 249, 245, 0.84);
          font-size: 0.71rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .tt-master-pill.is-active { background: #FAF9F5; border-color: #FAF9F5; color: #1E0734; font-weight: 900; }

        /* Lista Clasificados Top 8 */
        .tt-master-q-list { display: flex; flex-direction: column; gap: 8px; }
        .tt-master-q-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 13px;
          border-radius: 17px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          cursor: pointer;
          animation: ttTnReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--tn-delay, 0ms);
        }
        .tt-master-q-row.is-podium { border-color: rgba(229, 193, 108, 0.38); }
        .tt-master-q-num { font-family: var(--tt-font-display); font-size: 1.32rem; font-weight: 900; color: var(--tt-text); min-width: 28px; }
        .tt-master-q-row.is-podium .tt-master-q-num { color: #E5C16C; }
        .tt-torneos-view.is-light .tt-master-q-row.is-podium .tt-master-q-num { color: #9A6B16; }
        .tt-master-q-row strong { display: block; font-size: 0.9rem; }
        .tt-master-q-row small { font-size: 0.72rem; color: var(--tt-text-muted); }
        .tt-master-q-pts { text-align: right; }
        .tt-master-q-pts strong { font-family: var(--tt-font-display); font-size: 1.2rem; color: var(--tt-emerald-text); }
        .tt-master-q-pts span { font-size: 0.54rem; font-weight: 800; color: var(--tt-text-muted); }

        /* Grupos A y B */
        .tt-master-groups-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 720px) { .tt-master-groups-grid { grid-template-columns: 1fr 1fr; } }
        .tt-group-card { border-radius: 20px; background: var(--tt-surface); border: 1px solid var(--tt-border); overflow: hidden; box-shadow: var(--tt-card-specular), var(--tt-shadow-sm); }
        .tt-group-card-head { padding: 11px 14px; background: #1E0734; color: #FAF9F5; display: flex; justify-content: space-between; align-items: center; }
        .tt-group-card-head strong { font-size: 0.76rem; letter-spacing: 0.06em; color: #E5C16C; }
        .tt-group-card-head span { font-size: 0.68rem; opacity: 0.76; }
        .tt-group-row { display: flex; align-items: center; gap: 10px; padding: 10px 13px; border-bottom: 1px solid var(--tt-border); cursor: pointer; }
        .tt-group-row:last-child { border-bottom: none; }
        .tt-group-row.is-advancing { box-shadow: inset 3px 0 0 #00DC7D; }
        .tt-group-seed { font-family: var(--tt-font-display); font-size: 1.1rem; font-weight: 900; min-width: 24px; color: var(--tt-text-muted); }
        .tt-group-row strong { display: block; font-size: 0.86rem; }
        .tt-group-row small { display: block; font-size: 0.7rem; color: var(--tt-text-muted); }
        .tt-group-pts-val { font-family: var(--tt-font-display); font-size: 1.08rem; color: var(--tt-emerald-text); }

        /* Formato 3 Pasos Visuales Cortos */
        .tt-master-phases-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 680px) { .tt-master-phases-grid { grid-template-columns: repeat(3, 1fr); } }
        .tt-phase-tile {
          border-radius: 19px;
          padding: 14px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: ttTnReveal 340ms ease both;
          animation-delay: var(--tn-delay, 0ms);
        }
        .tt-phase-top { display: flex; align-items: center; justify-content: space-between; }
        .tt-phase-num { font-family: var(--tt-font-display); font-size: 1.4rem; font-weight: 900; color: #E5C16C; line-height: 1; }
        .tt-torneos-view.is-light .tt-phase-num { color: #9A6B16; }
        .tt-phase-tile h3 { margin: 2px 0 0; font-size: 0.92rem; font-weight: 900; }
        .tt-phase-tile p { margin: 0; font-size: 0.76rem; line-height: 1.38; color: var(--tt-text-muted); }

        .tt-master-rewards-wrap { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 720px) { .tt-master-rewards-wrap { grid-template-columns: 1fr 1fr; } }
        .tt-mr-card { border-radius: 20px; padding: 15px; background: var(--tt-surface); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 8px; }
        .tt-mr-card.is-annual { border-color: rgba(229, 193, 108, 0.45); }
        .tt-mr-kicker { font-size: 0.62rem; font-weight: 900; letter-spacing: 0.08em; color: var(--tt-emerald-text); }
        .tt-mr-kicker.is-gold { color: #E5C16C; }
        .tt-torneos-view.is-light .tt-mr-kicker.is-gold { color: #9A6B16; }
        .tt-mr-card h3 { margin: 0; font-size: 0.96rem; }
        .tt-mr-podium { display: flex; flex-direction: column; gap: 7px; }
        .tt-mr-item { padding: 9px 11px; border-radius: 13px; background: var(--tt-surface-2); display: flex; flex-direction: column; gap: 2px; font-size: 0.76rem; }

        /* 5. SALÓN DE LA FAMA VISUAL (TARJETAS TROFEO ESCANEABLES) */
        .tt-hof-filters { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .tt-hof-filters::-webkit-scrollbar { display: none; }
        .tt-hof-chip {
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
        .tt-hof-chip.is-active { background: #FAF9F5; border-color: #FAF9F5; color: #1E0734; font-weight: 900; }
        .tt-torneos-view.is-light .tt-hof-chip.is-active { background: #1E0734; border-color: #1E0734; color: #00DC7D; }

        .tt-hof-visual-grid { display: grid; grid-template-columns: 1fr; gap: 11px; }
        @media (min-width: 680px) { .tt-hof-visual-grid { grid-template-columns: repeat(2, 1fr); } }
        .tt-hof-card {
          border-radius: 22px;
          padding: 12px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-card-specular), var(--tt-shadow-sm);
          display: flex;
          align-items: stretch;
          gap: 12px;
          cursor: pointer;
          animation: ttTnReveal 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--tn-delay, 0ms);
        }
        .tt-hof-portrait {
          position: relative;
          width: 92px;
          min-height: 116px;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid rgba(229, 193, 108, 0.75);
          background: #160428;
          flex-shrink: 0;
        }
        .tt-hof-crown-pill {
          position: absolute;
          left: 5px;
          right: 5px;
          bottom: 5px;
          padding: 3px 5px;
          border-radius: 8px;
          background: rgba(16, 4, 30, 0.88);
          color: #E5C16C;
          font-size: 0.54rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
        }
        .tt-hof-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .tt-hof-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .tt-hof-cat-tag { padding: 2px 8px; border-radius: 999px; background: var(--tt-surface-2); font-size: 0.62rem; font-weight: 800; color: var(--tt-text); }
        .tt-hof-date-tag { font-size: 0.64rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-hof-surname { font-family: var(--tt-font-display); font-size: 1.42rem; font-weight: 900; line-height: 0.98; color: var(--tt-text); margin-top: 2px; }
        .tt-hof-fullname { font-size: 0.74rem; font-weight: 700; color: var(--tt-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-hof-tourney { font-size: 0.7rem; color: var(--tt-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-hof-foot { margin-top: auto; padding-top: 7px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tt-hof-stats { display: inline-flex; align-items: center; gap: 6px; font-size: 0.68rem; font-weight: 900; }
        .tt-hof-stats .is-rec { padding: 3px 8px; border-radius: 8px; background: rgba(0, 220, 125, 0.14); color: var(--tt-emerald-text); }
        .tt-hof-stats .is-pct { color: var(--tt-text-muted); }
        .tt-hof-h2h-btn { padding: 4px 10px; border-radius: 8px; border: 1px solid var(--tt-border-medium); color: var(--tt-text); font-size: 0.66rem; font-weight: 800; }

        /* 6. MODALES TORNEO & PAGO */
        .tt-tmodal-wrap { display: flex; flex-direction: column; gap: 14px; }
        .tt-tmodal-tabs, .tt-rounds-pills { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
        .tt-tmodal-tab { flex-shrink: 0; min-height: 36px; padding: 0 13px; border-radius: 11px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.75rem; font-weight: 800; }
        .tt-tmodal-tab.is-active { background: #1E0734; border-color: #00DC7D; color: #00DC7D; }
        .tt-round-pill { flex-shrink: 0; min-height: 33px; padding: 0 12px; border-radius: 999px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.72rem; font-weight: 800; }
        .tt-round-pill.is-active { background: rgba(0, 220, 125, 0.16); border-color: #00DC7D; color: var(--tt-emerald-text); }
        .tt-round-pill.is-final.is-active { background: linear-gradient(135deg, #F5E1A4 0%, #CCA046 100%); border-color: transparent; color: #1B1202; }

        .tt-bracket-section, .tt-participants-section, .tt-tmodal-prizes-stack { display: flex; flex-direction: column; gap: 11px; }
        .tt-bracket-matches-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 680px) { .tt-bracket-matches-grid { grid-template-columns: repeat(2, 1fr); } }
        .tt-bm-card { border-radius: 16px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); overflow: hidden; animation: ttTnReveal 280ms ease both; animation-delay: var(--tn-delay, 0ms); }
        .tt-bm-card.is-done { border-color: rgba(0, 220, 125, 0.34); }
        .tt-bm-head { padding: 7px 11px; background: rgba(24, 6, 43, 0.22); border-bottom: 1px solid var(--tt-border); display: flex; justify-content: space-between; font-size: 0.68rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-bm-state.finished { color: var(--tt-emerald-text); }
        .tt-bm-slot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 11px; cursor: pointer; }
        .tt-bm-slot.is-winner { background: rgba(0, 220, 125, 0.11); }
        .tt-bm-slot.is-loser { opacity: 0.6; }
        .tt-bm-divider { height: 1px; background: var(--tt-border); }
        .tt-bm-player-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .tt-bm-tbd-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--tt-surface); border: 1px dashed var(--tt-border); display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; color: var(--tt-text-muted); flex-shrink: 0; }
        .tt-bm-name { display: block; font-size: 0.82rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-bm-sub { display: block; font-size: 0.66rem; color: var(--tt-text-muted); }
        .tt-bm-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .tt-bm-win-arrow { color: #00DC7D; font-size: 0.8rem; font-weight: 900; }
        .tt-bm-admin-pick { padding: 3px 8px; border-radius: 999px; background: #00DC7D; color: #10021E; font-size: 0.66rem; font-weight: 900; }

        .tt-enrolled-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
        @media (min-width: 640px) { .tt-enrolled-grid { grid-template-columns: 1fr 1fr; } }
        .tt-enrolled-row { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 14px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); cursor: pointer; }
        .tt-enrolled-num { font-family: var(--tt-font-display); font-size: 1rem; font-weight: 900; min-width: 22px; color: var(--tt-text-muted); }
        .tt-enrolled-row strong { display: block; font-size: 0.82rem; }
        .tt-enrolled-row small { display: block; font-size: 0.68rem; color: var(--tt-text-muted); }
        .tt-enrolled-pts { font-size: 0.74rem; font-weight: 800; color: var(--tt-emerald-text); }

        .tt-admin-pending-box { padding: 12px; border-radius: 14px; background: rgba(229, 193, 108, 0.14); border: 1px solid rgba(229, 193, 108, 0.45); display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem; }
        .tt-admin-pending-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

        .tt-prize-collage-grid { display: grid; grid-template-columns: 1fr; gap: 9px; }
        @media (min-width: 560px) { .tt-prize-collage-grid { grid-template-columns: 1fr 1fr; } }
        .tt-prize-tile { display: flex; align-items: center; gap: 11px; padding: 12px; border-radius: 15px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-prize-tile.is-featured { grid-column: 1 / -1; border-color: rgba(229, 193, 108, 0.45); }
        .tt-prize-tile-label { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.08em; color: var(--tt-text-muted); }
        .tt-prize-tile-val { display: block; font-size: 0.84rem; font-weight: 800; margin-top: 2px; }

        .tt-includes-box { padding: 13px; border-radius: 15px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); font-size: 0.8rem; }
        .tt-includes-box ul { margin: 8px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .tt-includes-box li { display: flex; align-items: flex-start; gap: 7px; font-size: 0.77rem; color: var(--tt-text-muted); }
        .tt-tmodal-foot { padding-top: 6px; border-top: 1px solid var(--tt-border); }

        .tt-pay-modal-stack { display: flex; flex-direction: column; gap: 12px; }
        .tt-pay-hero-box { padding: 14px; border-radius: 18px; background: linear-gradient(135deg, #24093F 0%, #130322 100%); color: #FAF9F5; border: 1px solid rgba(0, 220, 125, 0.35); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .tt-pay-hero-box span { display: block; font-size: 0.64rem; font-weight: 800; letter-spacing: 0.08em; opacity: 0.74; }
        .tt-pay-hero-box strong { font-family: var(--tt-font-display); font-size: 1.85rem; line-height: 1; color: #00DC7D; }
        .tt-pay-balls-tag { padding: 6px 11px; border-radius: 999px; background: rgba(250, 249, 245, 0.14); font-size: 0.72rem; font-weight: 800; }
        .tt-pay-balls-tag.is-yes { background: rgba(0, 220, 125, 0.2); color: #7CF5C0; }
        .tt-pay-field { display: flex; flex-direction: column; gap: 6px; }
        .tt-pay-field label { font-size: 0.74rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-pay-select { min-height: 44px; padding: 0 12px; border-radius: 13px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text); font-size: 16px; font-weight: 700; }
        .tt-pay-channels-box { padding: 13px; border-radius: 16px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 9px; }
        .tt-pay-channels-title { font-size: 0.65rem; font-weight: 900; letter-spacing: 0.09em; color: var(--tt-emerald-text); }
        .tt-pay-holder { margin: -4px 0 2px; font-size: 0.74rem; color: var(--tt-text-muted); }
        .tt-pay-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 11px; border-radius: 12px; background: var(--tt-surface); border: 1px solid var(--tt-border); }
        .tt-pay-row small { display: block; font-size: 0.65rem; color: var(--tt-text-muted); }
        .tt-pay-row strong { font-size: 0.88rem; }
        .tt-copy-chip { padding: 6px 11px; border-radius: 999px; background: rgba(0, 220, 125, 0.16); color: var(--tt-emerald-text); font-size: 0.72rem; font-weight: 800; }

        html[data-tier='lite'] .tt-flip-card,
        html[data-tier='lite'] .tt-tcard,
        html[data-tier='lite'] .tt-hof-card { animation: none !important; }
      `}</style>
    </section>
  );
}
