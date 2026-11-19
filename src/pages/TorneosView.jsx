import React, { useMemo, useRef, useState } from 'react';
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
import {
  buildWhatsAppLink,
  computeMasterTop8Race,
} from '../utils/tenisEngine';

/* ==========================================================================
   DATOS DE RESPALDO SEGUROS (4 GIRAS, TORNEOS DEMO Y SALÓN DE LA FAMA)
   Se usan automáticamente si el estado global llega vacío durante pruebas.
   ========================================================================== */
const SEASON_SWINGS = [
  { id: 'swing-1', name: 'Gira Apertura', club: 'Country Club', season: 1, status: 'done' },
  { id: 'swing-2', name: 'Gira de Altura', club: 'El Tambo', season: 2, status: 'done' },
  { id: 'swing-3', name: 'Valle del Mantaro', club: 'Tauro & Inkas', season: 3, status: 'done' },
  { id: 'swing-4', name: 'Carrera Master Top 8', club: 'Gran Final', season: 4, status: 'active' },
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
    status: 'IN_PLAY', // OPEN | IN_PLAY | UPCOMING | FINISHED
    dateLabel: '14 – 24 NOV',
    categoryLabel: '4ª Categoría & 5ª A',
    drawSize: 16,
    minPlayersForDraw: 8,
    entryFee: 45,
    includesBalls: true,
    includesItems: [
      'Pelotas presurizadas nuevas en cada ronda',
      'Hidratación y fruta en zona de jugadores',
      'Cobertura fotográfica y placa oficial de puntaje',
    ],
    hasConsolation: true,
    banner: ASSETS.torneoApertura,
    prizes: {
      trophy: 'Copa Oficial de Campeón + Medalla Finalista',
      cash: 'S/ 400 al Campeón · S/ 150 al Finalista',
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
    clubId: 'club-cutipa',
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
      cash: 'S/ 300 al Campeón · S/ 100 al Finalista',
      proShop: '2 Tarros Pro + Sobregrips Oficiales',
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
    clubName: 'Tauro Tenis Club',
    surface: 'Arcilla · Nocturno',
    status: 'UPCOMING',
    dateLabel: '19 – 21 DIC',
    categoryLabel: '3ª Categoría & Libre',
    drawSize: 8,
    minPlayersForDraw: 6,
    entryFee: 35,
    includesBalls: false,
    includesItems: [
      'Canchas con iluminación LED profesional incluida',
      'Formato compacto de fin de semana (sin consuelo)',
      'Pelotas por acuerdo de jugadores en cancha',
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

/* ==========================================================================
   MOTOR DE LLAVES REAL (OCTAVOS DE 16 -> CUARTOS -> SEMIS -> FINAL + CONSUELO)
   Sin siembra preferente: todos ingresan en igualdad desde la 1ª ronda.
   ========================================================================== */
function buildTournamentBracket(tournament, playersMap, allPlayers) {
  const drawSize = Number(tournament?.drawSize) === 8 ? 8 : 16;

  // Poblar la lista de participantes reales (o completar con jugadores del circuito en demo)
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
  const sampleScores = ['6-3, 6-4', '7-5, 6-2', '6-4, 3-6, [10-7]', '6-2, 6-1', '7-6 (5), 6-4', '6-1, 6-3', '6-4, 6-4', '4-6, 6-3, [12-10]'];

  let roundOf16 = [];
  let quarterFinals = [];

  if (drawSize === 16) {
    // 1. OCTAVOS DE FINAL (8 PARTIDOS REALES)
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

    // 2. CUARTOS DE FINAL (4 PARTIDOS alimentados por los 8 ganadores de Octavos)
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
    // Cuadro de 8: inicia en Cuartos de Final (4 partidos)
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

  // 3. SEMIFINALES (2 PARTIDOS)
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

  // 4. GRAN FINAL (1 PARTIDO)
  const finalMatch = resolveMatch(
    'FINAL',
    semiFinals[0]?.winner || null,
    semiFinals[1]?.winner || null,
    'Gran Final',
    'Cancha Central',
    tournament?.status === 'FINISHED' ? '6-4, 7-6 (8-6)' : null
  );

  // 5. RONDA CONSUELO OPCIONAL (Perdedores de la primera ronda disputan Copa de Plata)
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
   SUBCOMPONENTE 1: TARJETA DE PARTIDO DENTRO DE LA LLAVE (BRACKET MATCH)
   ========================================================================== */
function BracketMatchCard({
  match,
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
            <strong className="tt-bm-name">
              {player ? player.name : 'Por definir en cancha'}
            </strong>
            {player && (
              <small className="tt-bm-sub">
                {getCategoryByPoints(player.points).name} · {Number(player.points || 0).toLocaleString('es-PE')} pts
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
    <div className={`tt-bm-card ${match.winner ? 'is-done' : ''}`}>
      <div className="tt-bm-head">
        <span>{match.id} · {match.court}</span>
        <span className={`tt-bm-state ${match.status.toLowerCase()}`}>
          {match.score || (match.status === 'SCHEDULED' ? 'Programado' : 'Esperando cruce')}
        </span>
      </div>
      {renderSlot(match.playerA, 'A')}
      <div className="tt-bm-divider" />
      {renderSlot(match.playerB, 'B')}
    </div>
  );
}

/* ==========================================================================
   SUBCOMPONENTE 2: VITRINA VISUAL TIPO COLLAGE DE PREMIOS DEL TORNEO
   ========================================================================== */
function PrizeCollageShowcase({ prizes }) {
  if (!prizes) return null;

  const cards = [
    {
      key: 'trophy',
      label: 'TROFEO & HONOR',
      value: prizes.trophy,
      icon: 'trophy',
      variant: 'gold',
      toneCls: 'is-gold',
    },
    {
      key: 'cash',
      label: 'PREMIO EN EFECTIVO',
      value: prizes.cash,
      icon: 'crown',
      variant: 'emerald',
      toneCls: 'is-cash',
    },
    {
      key: 'proShop',
      label: 'VALES & PRO SHOP',
      value: prizes.proShop,
      icon: 'shop',
      variant: 'clay',
      toneCls: 'is-shop',
    },
    {
      key: 'points',
      label: 'PUNTOS CIRCUITO',
      value: prizes.points,
      icon: 'chart',
      variant: 'purple',
      toneCls: 'is-pts',
    },
    {
      key: 'gems',
      label: 'BONO DE GEMAS',
      value: prizes.gems,
      icon: 'gem',
      variant: 'emerald',
      toneCls: 'is-gems',
    },
  ].filter((c) => Boolean(c.value));

  return (
    <div className="tt-prize-collage">
      <div className="tt-prize-collage-head">
        <span className="tt-prize-kicker">VITRINA OFICIAL DE PREMIACIÓN</span>
        <small>Premios verificados por el Comité Organizador</small>
      </div>

      <div className="tt-prize-collage-grid">
        {cards.map((c, idx) => (
          <div
            key={c.key}
            className={`tt-prize-tile ${c.toneCls} ${idx === 0 ? 'is-featured' : ''}`}
          >
            <IconBadge name={c.icon} variant={c.variant} size={36} />
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
   VISTA PRINCIPAL: TorneosView (BLOQUE 12 DE 26)
   ========================================================================== */
export default function TorneosView({
  players = [],
  clubs = INITIAL_CLUBS,
  tournaments = [],
  hallOfFame = [],
  seasonSnapshots = null,
  currentUser = null,
  isAdmin = false,
  theme = 'dark',
  sunlightMode = false,
  onRequestTournamentInscription,
  onAdminApproveInscription,
  onAdminUpdateBracketResult,
  onOpenPlayerProfile,
  onOpenHeadToHead,
  onOpenAuth,
  onNotify,
}) {
  const heroRef = useRef(null);
  useScrollReveal(heroRef, { startRevealed: true });

  // 3 Sub-vistas principales: Torneos Activos | Master Top 8 | Salón de la Fama
  const [activeTab, setActiveTab] = useState('torneos'); // 'torneos' | 'master' | 'fama'

  // Estado del Modal Completo del Torneo seleccionado
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [modalSection, setModalSection] = useState('cuadro'); // 'cuadro' | 'consuelo' | 'participantes' | 'premios'
  const [selectedRound, setSelectedRound] = useState('R16'); // 'R16' | 'QF' | 'SF' | 'FINAL'

  // Estado del Modal de Pago e Inscripción (Yape / Plin / Banco + blur)
  const [paymentTournament, setPaymentTournament] = useState(null);
  const [chosenCategory, setChosenCategory] = useState('');
  const [localPendingMap, setLocalPendingMap] = useState({});
  const [localBracketOverrides, setLocalBracketOverrides] = useState({});

  // Pestaña interna del Master Top 8 Finals
  const [masterSubTab, setMasterSubTab] = useState('resumen'); // 'resumen' | 'grupos' | 'clasificados' | 'premios'

  // Filtro de año / temporada en Salón de la Fama
  const [hofCategoryFilter, setHofCategoryFilter] = useState('ALL');

  // Mapa rápido ID -> Jugador
  const playersMap = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  // Lista efectiva de torneos (combina props globales + overrides locales de demo si aplica)
  const effectiveTournaments = useMemo(() => {
    const source = Array.isArray(tournaments) && tournaments.length > 0 ? tournaments : FALLBACK_TOURNAMENTS;
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

  // Cuadro construido para el torneo abierto en el modal
  const activeBracket = useMemo(() => {
    if (!selectedTournament) return null;
    return buildTournamentBracket(selectedTournament, playersMap, players);
  }, [selectedTournament, playersMap, players]);

  // Carrera real al Master Top 8 (100% solo lectura sobre snapshots de 4 temporadas)
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

  // Grupos A (Mantaro) y B (Huaytapallana) con distribución serpentina ATP/WTA Finals (1,4,5,8 vs 2,3,6,7)
  const masterGroups = useMemo(() => {
    const q = masterTop8Qualifiers;
    return {
      groupA: [q[0], q[3], q[4], q[7]].filter(Boolean),
      groupB: [q[1], q[2], q[5], q[6]].filter(Boolean),
    };
  }, [masterTop8Qualifiers]);

  // Salón de la Fama enriquecido (Campeones históricos con datos reales de jugadores)
  const effectiveHallOfFame = useMemo(() => {
    if (Array.isArray(hallOfFame) && hallOfFame.length > 0) return hallOfFame;

    const sorted = [...players].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
    const templates = [
      {
        id: 'hof-1',
        dateTop: '12 – 21',
        dateBottom: 'SEP',
        year: '2026',
        seasonLabel: 'GIRA VALLE DEL MANTARO',
        tournamentName: 'Abierto de Primavera · Country Club',
        surface: 'ARCILLA',
        category: '3ª Categoría',
        wins: 11,
        losses: 1,
        champion: sorted[0] || null,
      },
      {
        id: 'hof-2',
        dateTop: '18 – 27',
        dateBottom: 'JUN',
        year: '2026',
        seasonLabel: 'GIRA DE ALTURA',
        tournamentName: 'Copa El Tambo · Academia Cutipa',
        surface: 'ARCILLA',
        category: '4ª Categoría',
        wins: 9,
        losses: 1,
        champion: sorted[1] || sorted[0] || null,
      },
      {
        id: 'hof-3',
        dateTop: '14 – 23',
        dateBottom: 'MAR',
        year: '2026',
        seasonLabel: 'GIRA APERTURA',
        tournamentName: 'Master Apertura · Club Tauro',
        surface: 'ARCILLA',
        category: '5ª A',
        wins: 8,
        losses: 2,
        champion: sorted[2] || sorted[0] || null,
      },
      {
        id: 'hof-4',
        dateTop: '06 – 15',
        dateBottom: 'FEB',
        year: '2026',
        seasonLabel: 'COPA FEMENINA',
        tournamentName: 'Abierto Damas · Los Inkas',
        surface: 'ARCILLA',
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

  /* ------------------------------------------------------------------------
     ACCIONES OPERATIVAS (ABRIR FICHA, SOLICITAR PAGO, COPIAR CUENTA, ADMIN)
     ------------------------------------------------------------------------ */
  const handleOpenTournamentModal = (tournament, defaultSection = 'cuadro') => {
    triggerHaptic('light');
    setSelectedTournamentId(tournament.id);
    setModalSection(defaultSection);
    // Si es de 16 arranca en Octavos (R16), si es de 8 arranca en Cuartos (QF)
    setSelectedRound(Number(tournament.drawSize) === 8 ? 'QF' : 'R16');
  };

  const handleOpenPaymentModal = (tournament) => {
    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para solicitar tu inscripción oficial.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    triggerHaptic('medium');
    const userCat = getCategoryByPoints(currentUser.points).name;
    setChosenCategory(userCat);
    setPaymentTournament(tournament);
  };

  const handleCopyText = async (text, label) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(text);
      if (onNotify) onNotify(`${label} copiado al portapapeles.`, 'success');
    } catch (e) {
      if (onNotify) onNotify(`${label}: ${text}`, 'info');
    }
  };

  const handleSendPaymentVoucher = () => {
    if (!paymentTournament || !currentUser) return;

    // 1. Registrar estado "Pago en Verificación" (NUNCA inscribe directo al cuadro)
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

    // 2. Abrir WhatsApp oficial de organización con el comprobante pre-armado
    const waMsg = [
      `Hola organización de TOTAL TENIS, solicito validación de mi inscripción:`,
      `• Torneo: ${paymentTournament.name}`,
      `• Jugador: ${currentUser.name} (${currentUser.credentialId || 'Socio'})`,
      `• Categoría: ${chosenCategory || getCategoryByPoints(currentUser.points).name}`,
      `• Monto abonado: S/ ${paymentTournament.entryFee}.00`,
      `Adjunto aquí la captura de mi Yape / Plin / Depósito para quedar inscrito en el sorteo.`,
    ].join('\n');

    window.open(buildWhatsAppLink(APP_CONFIG.supportWhatsApp, waMsg), '_blank', 'noopener,noreferrer');

    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        'Solicitud registrada en estado "Pago en Verificación". Al validar tu constancia, el Comité te ingresará al cuadro.',
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
    if (onNotify) onNotify(`Resultado oficial validado en llave ${matchId}.`, 'success');
  };

  const getUserTournamentStatus = (t) => {
    if (!currentUser?.id) return 'NONE';
    if ((t.participantsIds || []).includes(currentUser.id)) return 'ENROLLED';
    if ((t.pendingPaymentIds || []).includes(currentUser.id)) return 'PENDING_PAYMENT';
    return 'NONE';
  };

  const progressPct = Math.min(100, Math.round((safeSnapshots.currentSeason / 4) * 100));

  return (
    <section
      className={`tt-torneos-view ${theme === 'light' ? 'is-light' : 'is-dark'} ${
        sunlightMode ? 'is-sunlight' : ''
      }`}
      aria-label="Torneos Oficiales y Master Top 8 TOTAL TENIS"
    >
      {/* ====================================================================
          1. BARRA DE PROGRESO DE TEMPORADA (SEASON PROGRESS POR LAS 4 GIRAS)
          ==================================================================== */}
      <header ref={heroRef} className="tt-season-progress-card tt-reveal-box">
        <div className="tt-sp-top">
          <div>
            <span className="tt-sp-eyebrow">CALENDARIO OFICIAL · {safeSnapshots.year}</span>
            <h1 className="tt-sp-title">GIRA Y TORNEOS</h1>
          </div>
          <div className="tt-sp-pct-badge">
            <strong>{progressPct}%</strong>
            <span>AVANCE ANUAL</span>
          </div>
        </div>

        {/* Línea segmentada de las 4 Giras */}
        <div className="tt-swings-track" aria-label="Progreso de las 4 Giras">
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
                <span>{sw.club}</span>
              </div>
            );
          })}
        </div>
      </header>

      {/* ====================================================================
          2. CONMUTADOR DE 3 SUB-VISTAS (TORNEOS | MASTER TOP 8 | SALÓN FAMA)
          ==================================================================== */}
      <div className="tt-tn-subtabs" role="tablist" aria-label="Secciones de Torneos">
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
          Torneos Activos
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'master'}
          className={`tt-tn-subtab is-gold ${activeTab === 'master' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
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
          Salón de la Fama
        </button>
      </div>

      {/* ====================================================================
          VISTA 1: GALERÍA DE FICHAS DE TORNEOS (TARJETA -> MODAL COMPLETO)
          ==================================================================== */}
      {activeTab === 'torneos' && (
        <div className="tt-tn-stack">
          <div className="tt-tournaments-grid">
            {effectiveTournaments.map((t) => {
              const club = getClubById(clubs, t.clubId);
              const enrolledCount = Math.max(
                (t.participantsIds || []).length,
                t.status === 'IN_PLAY' ? Math.min(t.drawSize, players.length) : Math.min(t.drawSize - 5, players.length)
              );
              const spotsLeft = Math.max(0, t.drawSize - enrolledCount);
              const fillPct = Math.min(100, Math.round((enrolledCount / t.drawSize) * 100));
              const userStatus = getUserTournamentStatus(t);

              const statusChip =
                t.status === 'IN_PLAY'
                  ? { label: 'EN CURSO · CUADRO VIVO', cls: 'is-live' }
                  : t.status === 'OPEN'
                  ? { label: 'INSCRIPCIONES ABIERTAS', cls: 'is-open' }
                  : t.status === 'FINISHED'
                  ? { label: 'FINALIZADO', cls: 'is-done' }
                  : { label: 'PRÓXIMA FECHA', cls: 'is-soon' };

              return (
                <article key={t.id} className="tt-tcard">
                  {/* Portada limpia con foto única y título en la base inferior */}
                  <div
                    className="tt-tcard-hero"
                    onClick={() => handleOpenTournamentModal(t, 'cuadro')}
                  >
                    <SmartImage
                      src={t.banner}
                      fallbackSrc={ASSETS.torneoApertura}
                      alt={t.name}
                      className="tt-tcard-img"
                    />
                    <div className="tt-tcard-scrim" />

                    {/* Top badges: Estado + Fecha verde menta sobre píldora oscura (alto contraste) */}
                    <div className="tt-tcard-top-badges">
                      <span className={`tt-tcard-status ${statusChip.cls}`}>
                        {statusChip.label}
                      </span>
                      <span className="tt-tcard-date-dark">{t.dateLabel}</span>
                    </div>

                    {/* Base inferior: Título despejando la foto de la cancha + Escudo */}
                    <div className="tt-tcard-hero-bottom">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="tt-tcard-surface">
                          {t.surface} · Cuadro de {t.drawSize} ({t.drawSize === 16 ? 'desde Octavos' : 'desde Cuartos'})
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

                  {/* Cuerpo informativo limpio */}
                  <div className="tt-tcard-body">
                    {/* Píldoras de características claras (Costo, Pelotas, Consuelo) */}
                    <div className="tt-tcard-specs-row">
                      <span className="tt-spec-chip is-price">S/ {t.entryFee}</span>
                      <span className="tt-spec-chip">{t.categoryLabel}</span>
                      <span className={`tt-spec-chip ${t.includesBalls ? 'is-ok' : ''}`}>
                        {t.includesBalls ? 'Incluye pelotas' : 'Sin pelotas'}
                      </span>
                      {t.hasConsolation && (
                        <span className="tt-spec-chip is-silver">Con Ronda Consuelo</span>
                      )}
                    </div>

                    {/* Control de Plazas y Condición de Sorteo */}
                    <div className="tt-spots-box">
                      <div className="tt-spots-head">
                        <span>
                          <strong>{enrolledCount}</strong> de {t.drawSize} inscritos
                        </span>
                        <span>
                          {spotsLeft > 0
                            ? `Quedan ${spotsLeft} cupos · Mín. ${t.minPlayersForDraw || 8} para sorteo`
                            : 'Cuadro completo'}
                        </span>
                      </div>
                      <div className="tt-spots-track">
                        <div className="tt-spots-fill" style={{ width: `${fillPct}%` }} />
                      </div>
                    </div>

                    {/* Resumen rápido de premio destacado */}
                    <div className="tt-tcard-prize-strip">
                      <TTIcon name="trophy" size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                      <span>
                        {t.prizes?.cash || t.prizes?.trophy} · {t.prizes?.gems}
                      </span>
                    </div>

                    {/* Botones 100 % Operativos */}
                    <div className="tt-tcard-actions">
                      <button
                        type="button"
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleOpenTournamentModal(t, 'cuadro')}
                      >
                        Ver Llaves y Premios
                      </button>

                      {t.status !== 'FINISHED' && (
                        <>
                          {userStatus === 'ENROLLED' ? (
                            <span className="tt-enrolled-pill">
                              <TTIcon name="check" size={14} />
                              Inscrito oficial
                            </span>
                          ) : userStatus === 'PENDING_PAYMENT' ? (
                            <span className="tt-verifying-pill">
                              <TTIcon name="clock" size={14} />
                              Pago en verificación
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="tt-btn tt-btn-primary tt-btn-sm"
                              disabled={spotsLeft === 0}
                              onClick={() => handleOpenPaymentModal(t)}
                            >
                              {spotsLeft === 0 ? 'Lleno' : `Inscribirme (S/ ${t.entryFee})`}
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
          VISTA 2: PORTADA HERO MASTER TOP 8 FINALS (100% SOLO LECTURA POR MÉRITO)
          Prohibido mostrar inscripción ni pago: clasifican los #1 al #8 del año.
          ==================================================================== */}
      {activeTab === 'master' && (
        <div className="tt-tn-stack">
          {/* Portada Hero Panorámica con Ficha Blanca Flotante */}
          <div className="tt-master-hero">
            <SmartImage
              src={ASSETS.torneoMasterTop8}
              fallbackSrc={ASSETS.torneoApertura}
              alt="Torneo de Maestros Master Top 8 Finals"
              className="tt-master-hero-bg"
            />
            <div className="tt-master-hero-scrim" />

            <div className="tt-master-hero-grid">
              <div className="tt-master-hero-left">
                <span className="tt-master-exclusive-pill">
                  <TTIcon name="crown" size={14} />
                  EVENTO ANUAL ÚNICO · SOLO POR MÉRITO
                </span>
                <h2 className="tt-master-title">MASTER TOP 8 FINALS</h2>
                <p className="tt-master-lead">
                  Los 8 jugadores con mayor puntaje acumulado en las 4 temporadas cerradas (T1 + T2 + T3 + T4) disputan la Copa de Maestros sin costo de inscripción.
                </p>
              </div>

              {/* Ficha Blanca Flotante Estilo Editorial */}
              <div className="tt-master-float-card">
                <div className="tt-mfc-head">
                  <SmartImage
                    src={ASSETS.trofeoMasterTop8}
                    alt="Copa Master Top 8"
                    style={{ width: 42, height: 42, objectFit: 'contain' }}
                  />
                  <div>
                    <strong>FINALES {safeSnapshots.year}</strong>
                    <span>ARCILLA · DICIEMBRE</span>
                  </div>
                </div>
                <div className="tt-mfc-meta">
                  <div>
                    <span>ACCESO</span>
                    <strong style={{ color: '#008A4E' }}>CLASIFICACIÓN TOP 8</strong>
                  </div>
                  <div>
                    <span>INSCRIPCIÓN</span>
                    <strong>S/ 0 · POR MÉRITO</strong>
                  </div>
                </div>
                <div className="tt-mfc-readonly">
                  Tabla oficial de solo lectura · Actualizada al cierre de cada temporada
                </div>
              </div>
            </div>

            {/* Pestañas píldora internas del Master Top 8 */}
            <div className="tt-master-pills-bar">
              {[
                { id: 'resumen', label: 'Formato · 3 Fases' },
                { id: 'grupos', label: 'Grupos A y B' },
                { id: 'clasificados', label: 'Clasificados Top 8' },
                { id: 'premios', label: 'Premios Mayores' },
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

          {/* Sub-sección Master 1: Las 3 Tarjetas Editoriales sobre Marfil */}
          {masterSubTab === 'resumen' && (
            <div className="tt-master-phases-grid">
              <article className="tt-phase-card">
                <span className="tt-phase-num">FASE 1</span>
                <h3>Clasificación Anual (T1 + T2 + T3 + T4)</h3>
                <p>
                  Al llegar la medianoche (00:00) del último día de cada trimestre, tus puntos oficiales se congelan en la tabla estática anual. Al cerrar la 4ª temporada, la suma total define del #1 al #8 sin pagar inscripción.
                </p>
              </article>

              <article className="tt-phase-card">
                <span className="tt-phase-num">FASE 2</span>
                <h3>Grupos A y B (Round Robin)</h3>
                <p>
                  Los 8 clasificados se reparten en Grupo A (Mantaro) y Grupo B (Huaytapallana) de 4 tenistas cada uno. Todos juegan contra todos en su grupo (3 partidos garantizados por maestro).
                </p>
              </article>

              <article className="tt-phase-card">
                <span className="tt-phase-num">FASE 3</span>
                <h3>Semifinales Cruzadas y Gran Final</h3>
                <p>
                  El #1 del Grupo A enfrenta al #2 del Grupo B, y el #1 del Grupo B al #2 del Grupo A. Los ganadores definen al Campeón Anual de Maestros con cobertura completa y premiación mayor.
                </p>
              </article>
            </div>
          )}

          {/* Sub-sección Master 2: Proyección Viva de Grupos A y B */}
          {masterSubTab === 'grupos' && (
            <div className="tt-master-groups-grid">
              {[
                { key: 'A', title: 'GRUPO A · MANTARO', rows: masterGroups.groupA },
                { key: 'B', title: 'GRUPO B · HUAYTAPALLANA', rows: masterGroups.groupB },
              ].map((grp) => (
                <div key={grp.key} className="tt-group-card">
                  <div className="tt-group-card-head">
                    <strong>{grp.title}</strong>
                    <span>Round Robin · Top 2 avanzan</span>
                  </div>

                  {grp.rows.length === 0 ? (
                    <p className="tt-muted" style={{ padding: 12, margin: 0, fontSize: '0.8rem' }}>
                      Aún no hay suficientes jugadores clasificados para proyectar este grupo.
                    </p>
                  ) : (
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
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              objectPosition: 'center top',
                              border: idx < 2 ? '2px solid #00DC7D' : '1.5px solid var(--tt-border)',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{row.player.name}</strong>
                            <small>{row.category.name} · {row.player.clubName || 'Independiente'}</small>
                          </div>
                          <div className="tt-group-pts">
                            <strong>{row.totalAnnual.toLocaleString('es-PE')}</strong>
                            <span>ANUAL</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sub-sección Master 3: Tabla de los 8 Clasificados */}
          {masterSubTab === 'clasificados' && (
            <div className="tt-master-q-list">
              {masterTop8Qualifiers.length === 0 ? (
                <EmptyStateCard
                  theme={theme}
                  title="Carrera anual en preparación"
                  description="Apenas se registren partidos oficiales verás aquí a los 8 líderes clasificados al Torneo de Maestros."
                />
              ) : (
                masterTop8Qualifiers.map((row) => (
                  <div
                    key={row.player.id}
                    className="tt-master-q-row"
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
                        height: 44,
                        borderRadius: 13,
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        border: '2px solid #00DC7D',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{row.player.name}</strong>
                      <small>
                        {row.category.name} · T1–T4 acumulados
                      </small>
                    </div>
                    <div className="tt-master-q-pts">
                      <strong>{row.totalAnnual.toLocaleString('es-PE')}</strong>
                      <span>PTS ANUALES</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-sección Master 4: Premios Mayores Anuales (Separados de Trimestrales) */}
          {masterSubTab === 'premios' && (
            <div className="tt-master-rewards-wrap">
              <div className="tt-mr-card is-annual">
                <span className="tt-mr-kicker is-gold">{ANNUAL_MASTER_TOP8_REWARDS.badge}</span>
                <h3>{ANNUAL_MASTER_TOP8_REWARDS.title}</h3>
                <p>{ANNUAL_MASTER_TOP8_REWARDS.qualificationRule}</p>
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
                <p>{SEASON_QUARTERLY_REWARDS.sustainabilityRule}</p>
                <div className="tt-mr-podium">
                  {SEASON_QUARTERLY_REWARDS.podium.map((p) => (
                    <div key={p.place} className="tt-mr-item">
                      <strong>{p.label}</strong>
                      <span>{p.physicalItems.join(' + ')} · {p.gemsRangeLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          VISTA 3: SALÓN DE LA FAMA (TARJETAS HORIZONTALES CON BLOQUE WINNER ESMERALDA)
          ==================================================================== */}
      {activeTab === 'fama' && (
        <div className="tt-tn-stack">
          <div className="tt-hof-intro">
            <IconBadge name="crown" variant="gold" size={40} />
            <div>
              <span className="tt-hof-kicker">CUADRO DE HONOR INAMOVIBLE</span>
              <h2 className="tt-hof-title">Salón de la Fama · Campeones Históricos</h2>
              <p className="tt-hof-sub">
                Registro oficial de ganadores de cada gira y torneo cerrado del circuito TOTAL TENIS.
              </p>
            </div>
          </div>

          {/* Filtros de categoría del Salón de la Fama */}
          <div className="tt-hof-filters">
            {['ALL', '3ª Categoría', '4ª Categoría', '5ª A', 'Damas'].map((catLabel) => (
              <button
                key={catLabel}
                type="button"
                className={`tt-hof-chip ${hofCategoryFilter === catLabel ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setHofCategoryFilter(catLabel);
                }}
              >
                {catLabel === 'ALL' ? 'Todos los campeones' : catLabel}
              </button>
            ))}
          </div>

          {filteredHallOfFame.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin registros en esta categoría"
              description="Selecciona otra categoría para explorar el historial de campeones del circuito."
              actionLabel="Ver todos los campeones"
              onAction={() => setHofCategoryFilter('ALL')}
            />
          ) : (
            <div className="tt-hof-cards-list">
              {filteredHallOfFame.map((entry) => {
                const champ = entry.champion;
                const total = (Number(entry.wins) || 0) + (Number(entry.losses) || 0);
                const eff = total > 0 ? ((entry.wins / total) * 100).toFixed(1) : '100.0';
                const club = getClubById(clubs, champ?.clubId);
                const surname = (champ?.name || 'CAMPEÓN').split(' ').slice(-1)[0].toUpperCase();

                return (
                  <article key={entry.id} className="tt-winner-row-card">
                    {/* Columna 1: Fecha condensada sobre Púrpura Noche */}
                    <div className="tt-wr-date-col">
                      <strong>{entry.dateTop}</strong>
                      <span>{entry.dateBottom}</span>
                      <small>{entry.year}</small>
                    </div>

                    {/* Columna 2: Ficha Editorial Blanca del Torneo + Récord estilo TV */}
                    <div className="tt-wr-center-col">
                      <div className="tt-wr-badges">
                        <span className="tt-wr-cat-pill">{entry.category}</span>
                        <span className="tt-wr-surf-pill">{entry.surface}</span>
                      </div>

                      <span className="tt-wr-season">{entry.seasonLabel}</span>
                      <h3 className="tt-wr-tourney-name">{entry.tournamentName}</h3>

                      {/* Fin al texto críptico "11G 1P": Píldora de récord estilo TV */}
                      <div className="tt-wr-record-strip">
                        <span className="is-wins">{entry.wins} VICTORIAS</span>
                        <span className="is-losses">
                          {entry.losses} {entry.losses === 1 ? 'DERROTA' : 'DERROTAS'}
                        </span>
                        <span className="is-eff">{eff}% EFECTIVIDAD</span>
                      </div>
                    </div>

                    {/* Columna 3: Módulo Derecho Integrado WINNER en Degradado Verde Esmeralda */}
                    <div className="tt-wr-emerald-col">
                      <div className="tt-wr-winner-text">
                        <span className="tt-wr-winner-tag">WINNER</span>
                        <strong className="tt-wr-surname">{surname}</strong>
                        <small className="tt-wr-fullname">
                          {champ?.name}
                          {club ? ` · ${club.shortName}` : ''}
                        </small>

                        <div className="tt-wr-circle-actions">
                          <button
                            type="button"
                            className="tt-wr-circle-btn"
                            aria-label={`Ver perfil de ${champ?.name}`}
                            title="Ver perfil"
                            onClick={() => {
                              triggerHaptic('light');
                              if (onOpenPlayerProfile && champ) onOpenPlayerProfile(champ);
                            }}
                          >
                            <TTIcon name="users" size={14} />
                          </button>

                          {onOpenHeadToHead && (!currentUser || currentUser.id !== champ?.id) && (
                            <button
                              type="button"
                              className="tt-wr-circle-btn"
                              aria-label={`Comparar Head to Head con ${champ?.name}`}
                              title="Head-to-Head"
                              onClick={() => {
                                triggerHaptic('light');
                                onOpenHeadToHead(champ);
                              }}
                            >
                              <TTIcon name="challenge" size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="tt-wr-portrait-box">
                        <SmartImage
                          src={champ?.avatar}
                          alt={champ?.name || 'Campeón'}
                          initials={champ?.name || 'TT'}
                          style={{
                            width: 68,
                            height: 68,
                            borderRadius: 16,
                            objectFit: 'cover',
                            objectPosition: 'center top',
                            border: '2.5px solid #F59E0B',
                            boxShadow: '0 8px 20px rgba(18, 3, 33, 0.34)',
                          }}
                        />
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
          MODAL 1 (PORTAL): FICHA COMPLETA DEL TORNEO + LLAVES DESDE OCTAVOS
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
            {/* Pestañas internas del Torneo (Ronda Consuelo solo si está activada en este torneo) */}
            <div className="tt-tmodal-tabs">
              <button
                type="button"
                className={`tt-tmodal-tab ${modalSection === 'cuadro' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setModalSection('cuadro');
                }}
              >
                Cuadro Principal
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
                  Ronda Consuelo
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
                Participantes ({activeBracket.enrolledPlayers.length}/{selectedTournament.drawSize})
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

            {/* SECCIÓN A: CUADRO PRINCIPAL (ARRANCA EN OCTAVOS DE FINAL SI ES DE 16) */}
            {modalSection === 'cuadro' && (
              <div className="tt-bracket-section">
                {/* Selector interactivo de rondas */}
                <div className="tt-rounds-pills">
                  {activeBracket.drawSize === 16 && (
                    <button
                      type="button"
                      className={`tt-round-pill ${selectedRound === 'R16' ? 'is-active' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedRound('R16');
                      }}
                    >
                      Octavos (8)
                    </button>
                  )}
                  <button
                    type="button"
                    className={`tt-round-pill ${selectedRound === 'QF' ? 'is-active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedRound('QF');
                    }}
                  >
                    Cuartos (4)
                  </button>
                  <button
                    type="button"
                    className={`tt-round-pill ${selectedRound === 'SF' ? 'is-active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedRound('SF');
                    }}
                  >
                    Semifinales (2)
                  </button>
                  <button
                    type="button"
                    className={`tt-round-pill is-final ${selectedRound === 'FINAL' ? 'is-active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedRound('FINAL');
                    }}
                  >
                    Gran Final (1)
                  </button>
                </div>

                {/* Partidos de la ronda activa */}
                <div className="tt-bracket-matches-grid">
                  {selectedRound === 'R16' &&
                    activeBracket.roundOf16.map((m) => (
                      <BracketMatchCard
                        key={m.id}
                        match={m}
                        isAdmin={isAdmin}
                        onSelectAdminWinner={handleAdminPickWinner}
                        onOpenPlayerProfile={onOpenPlayerProfile}
                      />
                    ))}

                  {selectedRound === 'QF' &&
                    activeBracket.quarterFinals.map((m) => (
                      <BracketMatchCard
                        key={m.id}
                        match={m}
                        isAdmin={isAdmin}
                        onSelectAdminWinner={handleAdminPickWinner}
                        onOpenPlayerProfile={onOpenPlayerProfile}
                      />
                    ))}

                  {selectedRound === 'SF' &&
                    activeBracket.semiFinals.map((m) => (
                      <BracketMatchCard
                        key={m.id}
                        match={m}
                        isAdmin={isAdmin}
                        onSelectAdminWinner={handleAdminPickWinner}
                        onOpenPlayerProfile={onOpenPlayerProfile}
                      />
                    ))}

                  {selectedRound === 'FINAL' && (
                    <BracketMatchCard
                      match={activeBracket.finalMatch}
                      isAdmin={isAdmin}
                      onSelectAdminWinner={handleAdminPickWinner}
                      onOpenPlayerProfile={onOpenPlayerProfile}
                    />
                  )}
                </div>
              </div>
            )}

            {/* SECCIÓN B: RONDA CONSUELO OPCIONAL (COPA DE PLATA) */}
            {modalSection === 'consuelo' && selectedTournament.hasConsolation && (
              <div className="tt-bracket-section">
                <div className="tt-consolation-note">
                  <TTIcon name="shield" size={17} style={{ color: '#00DC7D', flexShrink: 0 }} />
                  <span>
                    Quienes caen en su primer partido del Cuadro Principal pasan automáticamente a la Copa de Plata (Ronda Consuelo) para garantizar doble partido.
                  </span>
                </div>

                <div className="tt-bracket-matches-grid">
                  {activeBracket.consolationMatches.map((m) => (
                    <BracketMatchCard
                      key={m.id}
                      match={m}
                      isAdmin={isAdmin}
                      onSelectAdminWinner={handleAdminPickWinner}
                      onOpenPlayerProfile={onOpenPlayerProfile}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN C: PARTICIPANTES & SORTEO TRANSPARENTE (SIN SIEMBRA PREFERENTE) */}
            {modalSection === 'participantes' && (
              <div className="tt-participants-section">
                <div className="tt-consolation-note">
                  <TTIcon name="users" size={17} style={{ color: '#F59E0B', flexShrink: 0 }} />
                  <span>
                    Sorteo puro transparente sin siembra preferente: todos los inscritos compiten en igualdad de condiciones desde la primera ronda.
                  </span>
                </div>

                {/* Solicitudes en verificación visibles solo para Admin oculto */}
                {isAdmin && (selectedTournament.pendingPaymentIds || []).length > 0 && (
                  <div className="tt-admin-pending-box">
                    <strong>Pagos por aprobar ({selectedTournament.pendingPaymentIds.length})</strong>
                    {selectedTournament.pendingPaymentIds.map((pid) => {
                      const p = playersMap[pid];
                      if (!p) return null;
                      return (
                        <div key={pid} className="tt-admin-pending-row">
                          <span>{p.name} ({getCategoryByPoints(p.points).name})</span>
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
                            Aprobar e Inscribir
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
                        <small>{getCategoryByPoints(p.points).name} · {p.clubName || 'Independiente'}</small>
                      </div>
                      <span className="tt-enrolled-pts">
                        {Number(p.points || 0).toLocaleString('es-PE')} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN D: VITRINA COLLAGE DE PREMIOS + QUÉ INCLUYE EL TORNEO */}
            {modalSection === 'premios' && (
              <div className="tt-tmodal-prizes-stack">
                <PrizeCollageShowcase prizes={selectedTournament.prizes} />

                <div className="tt-includes-box">
                  <strong>¿Qué incluye tu inscripción (S/ {selectedTournament.entryFee})?</strong>
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

            {/* Pie del Modal: Botón de Inscripción si aún no está inscrito */}
            {selectedTournament.status !== 'FINISHED' && (
              <div className="tt-tmodal-foot">
                {getUserTournamentStatus(selectedTournament) === 'ENROLLED' ? (
                  <div className="tt-enrolled-pill" style={{ width: '100%', justifyContent: 'center' }}>
                    <TTIcon name="check" size={16} />
                    Ya estás inscrito oficialmente en este cuadro
                  </div>
                ) : getUserTournamentStatus(selectedTournament) === 'PENDING_PAYMENT' ? (
                  <div className="tt-verifying-pill" style={{ width: '100%', justifyContent: 'center' }}>
                    <TTIcon name="clock" size={16} />
                    Tu pago está en verificación · Te confirmaremos al ingresar al sorteo
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
                    Inscribirme al Torneo · S/ {selectedTournament.entryFee}.00
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 2 (PORTAL CON BLUR): INSCRIPCIÓN CON PAGO (YAPE / PLIN / BANCO)
          El jugador envía constancia -> Estado "Pago en Verificación" -> Admin aprueba
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(paymentTournament)}
        onClose={() => setPaymentTournament(null)}
        title="Inscripción Oficial al Torneo"
        subtitle={paymentTournament?.name || ''}
        icon={<IconBadge name="trophy" variant="emerald" size={38} />}
        isTopLayer
      >
        {paymentTournament && (
          <div className="tt-pay-modal-stack">
            {/* Monto y qué incluye */}
            <div className="tt-pay-hero-box">
              <div>
                <span>CUOTA DE INSCRIPCIÓN</span>
                <strong>S/ {paymentTournament.entryFee}.00</strong>
              </div>
              <span className={`tt-pay-balls-tag ${paymentTournament.includesBalls ? 'is-yes' : ''}`}>
                {paymentTournament.includesBalls ? 'Incluye pelotas nuevas' : 'No incluye pelotas'}
              </span>
            </div>

            <div className="tt-includes-box">
              <strong>Incluye en este torneo:</strong>
              <ul>
                {(paymentTournament.includesItems || []).map((item, idx) => (
                  <li key={idx}>
                    <TTIcon name="check" size={14} style={{ color: '#00DC7D', flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Selector de categoría */}
            <div className="tt-pay-field">
              <label htmlFor="tt-pay-cat">Categoría en la que participas</label>
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

            {/* Datos de pago copiables: Yape / Plin y Depósito Bancario */}
            <div className="tt-pay-channels-box">
              <span className="tt-pay-channels-title">MEDIOS DE PAGO OFICIALES</span>
              <p className="tt-pay-holder">Titular: {PAYMENT_CHANNELS.holder}</p>

              <div className="tt-pay-row">
                <div>
                  <small>Yape / Plin</small>
                  <strong>{PAYMENT_CHANNELS.yapePlin}</strong>
                </div>
                <button
                  type="button"
                  className="tt-copy-chip"
                  onClick={() => handleCopyText(PAYMENT_CHANNELS.yapePlin, 'Número Yape/Plin')}
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
                  onClick={() => handleCopyText(PAYMENT_CHANNELS.bankAccount, 'Cuenta bancaria')}
                >
                  Copiar
                </button>
              </div>

              <div className="tt-pay-row">
                <div>
                  <small>CCI Interbancario</small>
                  <strong style={{ fontSize: '0.78rem' }}>{PAYMENT_CHANNELS.cci}</strong>
                </div>
                <button
                  type="button"
                  className="tt-copy-chip"
                  onClick={() => handleCopyText(PAYMENT_CHANNELS.cci, 'CCI')}
                >
                  Copiar
                </button>
              </div>
            </div>

            <p className="tt-pay-disclaimer">
              Envía tu constancia por WhatsApp al Comité Organizador. Tu solicitud quedará en estado <strong>Pago en Verificación</strong> hasta que confirmemos tu abono y te ingresemos oficialmente al sorteo.
            </p>

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
          ESTILOS ENCAPSULADOS DE PRECISIÓN EDITORIAL (TORNEOS + MASTER + FAMA)
          ==================================================================== */}
      <style>{`
        .tt-torneos-view {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        /* 1. BARRA SEASON PROGRESS POR LAS 4 GIRAS */
        .tt-season-progress-card {
          border-radius: 24px;
          padding: 18px;
          background: linear-gradient(135deg, #1AE68A 0%, #6EF2B5 54%, #CCFCE5 100%);
          color: #160428;
          box-shadow: 0 14px 32px rgba(0, 184, 104, 0.22);
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-torneos-view.is-dark .tt-season-progress-card {
          background: linear-gradient(135deg, #103F30 0%, #1E0734 60%, #2D0C4F 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.34);
          box-shadow: 0 16px 36px rgba(8, 1, 18, 0.42);
        }
        .tt-sp-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-sp-eyebrow {
          display: inline-block;
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          opacity: 0.78;
        }
        .tt-torneos-view.is-dark .tt-sp-eyebrow {
          color: #00DC7D;
          opacity: 1;
        }
        .tt-sp-title {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: clamp(1.55rem, 6vw, 2.15rem);
          line-height: 0.98;
        }
        .tt-sp-pct-badge {
          padding: 7px 11px;
          border-radius: 14px;
          background: #1E0734;
          color: #FAF9F5;
          text-align: center;
          flex-shrink: 0;
        }
        .tt-sp-pct-badge strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.25rem;
          line-height: 1;
          color: #00DC7D;
        }
        .tt-sp-pct-badge span {
          font-size: 0.56rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          opacity: 0.8;
        }

        .tt-swings-track {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }
        .tt-swing-step {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .tt-swing-bar {
          height: 6px;
          border-radius: 999px;
          background: rgba(22, 4, 40, 0.16);
        }
        .tt-torneos-view.is-dark .tt-swing-bar {
          background: rgba(250, 249, 245, 0.14);
        }
        .tt-swing-step.is-done .tt-swing-bar {
          background: #1E0734;
        }
        .tt-torneos-view.is-dark .tt-swing-step.is-done .tt-swing-bar {
          background: #00DC7D;
        }
        .tt-swing-step.is-active .tt-swing-bar {
          background: linear-gradient(90deg, #F59E0B 0%, #00DC7D 100%);
          box-shadow: 0 0 10px rgba(0, 220, 125, 0.65);
        }
        .tt-swing-step strong {
          font-size: 0.68rem;
          font-weight: 900;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-swing-step span {
          font-size: 0.6rem;
          opacity: 0.72;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 2. SUB-TABS */
        .tt-tn-subtabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 5px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-tn-subtab {
          min-height: 42px;
          border-radius: 13px;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          transition: background-color 180ms ease, color 180ms ease, transform 120ms ease;
        }
        .tt-tn-subtab:active {
          transform: scale(0.97);
        }
        .tt-tn-subtab.is-active {
          background: #1E0734;
          color: #00DC7D;
          box-shadow: 0 6px 16px rgba(10, 2, 20, 0.22);
        }
        .tt-torneos-view.is-dark .tt-tn-subtab.is-active {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }
        .tt-torneos-view.is-dark .tt-tn-subtab.is-gold.is-active {
          background: linear-gradient(135deg, #FBBF24 0%, #D97706 100%);
          color: #1E1102;
        }

        .tt-tn-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* 3. FICHAS DE TORNEOS ACTIVOS */
        .tt-tournaments-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 760px) {
          .tt-tournaments-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .tt-tcard {
          border-radius: 24px;
          overflow: hidden;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
        }
        .tt-tcard-hero {
          position: relative;
          min-height: 196px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 13px 14px;
          background: #1A0530;
        }
        .tt-tcard-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-tcard-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(18, 3, 33, 0.45) 0%,
            rgba(18, 3, 33, 0.25) 45%,
            rgba(16, 3, 29, 0.95) 100%
          );
        }
        .tt-tcard-top-badges {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-tcard-status {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.06em;
        }
        .tt-tcard-status.is-live {
          background: #00DC7D;
          color: #120321;
        }
        .tt-tcard-status.is-open {
          background: #F59E0B;
          color: #1E1102;
        }
        .tt-tcard-status.is-soon {
          background: rgba(250, 249, 245, 0.18);
          color: #FAF9F5;
          backdrop-filter: blur(8px);
        }
        .tt-tcard-status.is-done {
          background: rgba(148, 163, 184, 0.28);
          color: #FAF9F5;
        }
        /* Fecha Verde Menta sobre píldora oscura (alto contraste garantizado) */
        .tt-tcard-date-dark {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(16, 3, 29, 0.86);
          border: 1px solid rgba(0, 220, 125, 0.45);
          color: #7CF5C0;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.05em;
        }
        .tt-tcard-hero-bottom {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-tcard-surface {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          color: #7CF5C0;
          margin-bottom: 2px;
        }
        .tt-tcard-title {
          margin: 0;
          font-family: var(--tt-font-display);
          font-weight: 900;
          font-size: 1.24rem;
          line-height: 1.08;
          color: #FAF9F5;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65);
        }
        .tt-tcard-club-logo {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: #FFFFFF;
          border: 2px solid rgba(250, 249, 245, 0.85);
          overflow: hidden;
          flex-shrink: 0;
        }

        .tt-tcard-body {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-tcard-specs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tt-spec-chip {
          padding: 4px 9px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }
        .tt-spec-chip.is-price {
          background: rgba(245, 158, 11, 0.16);
          border-color: rgba(245, 158, 11, 0.45);
          color: #F59E0B;
          font-weight: 900;
        }
        .tt-spec-chip.is-ok {
          background: rgba(0, 220, 125, 0.14);
          border-color: rgba(0, 220, 125, 0.42);
          color: #00DC7D;
        }
        .tt-torneos-view.is-light .tt-spec-chip.is-ok {
          color: #008A4E;
        }
        .tt-spec-chip.is-silver {
          background: rgba(56, 189, 248, 0.14);
          border-color: rgba(56, 189, 248, 0.36);
          color: #38BDF8;
        }

        .tt-spots-box {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-spots-head {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.72rem;
          color: var(--tt-text-muted);
          flex-wrap: wrap;
        }
        .tt-spots-head strong {
          color: var(--tt-text);
        }
        .tt-spots-track {
          height: 7px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          overflow: hidden;
        }
        .tt-spots-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00DC7D 0%, #F59E0B 100%);
        }

        .tt-tcard-prize-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 11px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--tt-text);
        }

        .tt-tcard-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-enrolled-pill,
        .tt-verifying-pill {
          min-height: 40px;
          padding: 0 13px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 800;
        }
        .tt-enrolled-pill {
          background: rgba(0, 220, 125, 0.16);
          border: 1px solid rgba(0, 220, 125, 0.45);
          color: #00DC7D;
        }
        .tt-torneos-view.is-light .tt-enrolled-pill {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-verifying-pill {
          background: rgba(245, 158, 11, 0.16);
          border: 1px solid rgba(245, 158, 11, 0.45);
          color: #F59E0B;
        }

        /* 4. MASTER TOP 8 FINALS (SOLO LECTURA POR MÉRITO) */
        .tt-master-hero {
          position: relative;
          border-radius: 26px;
          overflow: hidden;
          padding: 18px;
          background: #1A0530;
          color: #FAF9F5;
          border: 1.5px solid rgba(245, 158, 11, 0.42);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .tt-master-hero-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.52;
        }
        .tt-master-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(22, 4, 40, 0.94) 0%,
            rgba(30, 7, 52, 0.72) 55%,
            rgba(16, 3, 29, 0.96) 100%
          );
        }
        .tt-master-hero-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 720px) {
          .tt-master-hero-grid {
            grid-template-columns: 1.25fr 1fr;
            align-items: center;
          }
        }
        .tt-master-exclusive-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.22);
          border: 1px solid rgba(245, 158, 11, 0.58);
          color: #FDE68A;
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .tt-master-title {
          margin: 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: clamp(1.7rem, 6.5vw, 2.35rem);
          line-height: 0.98;
          color: #FAF9F5;
        }
        .tt-master-lead {
          margin: 8px 0 0;
          font-size: 0.82rem;
          line-height: 1.45;
          color: rgba(250, 249, 245, 0.84);
        }

        /* Ficha Blanca Flotante Derecha */
        .tt-master-float-card {
          border-radius: 20px;
          padding: 14px;
          background: #FAF9F5;
          color: #1E0734;
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.42);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-mfc-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-mfc-head strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          line-height: 1;
        }
        .tt-mfc-head span {
          font-size: 0.68rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.64);
          letter-spacing: 0.06em;
        }
        .tt-mfc-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 9px;
          border-radius: 13px;
          background: rgba(30, 7, 52, 0.06);
        }
        .tt-mfc-meta span {
          display: block;
          font-size: 0.6rem;
          font-weight: 800;
          color: rgba(30, 7, 52, 0.56);
        }
        .tt-mfc-meta strong {
          font-size: 0.78rem;
          font-weight: 900;
        }
        .tt-mfc-readonly {
          font-size: 0.68rem;
          font-weight: 700;
          color: rgba(30, 7, 52, 0.66);
          text-align: center;
        }

        .tt-master-pills-bar {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .tt-master-pill {
          flex-shrink: 0;
          min-height: 36px;
          padding: 0 13px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.12);
          border: 1px solid rgba(250, 249, 245, 0.22);
          color: #FAF9F5;
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-master-pill.is-active {
          background: #00DC7D;
          border-color: #00DC7D;
          color: #120321;
        }

        /* 3 Tarjetas de Formato sobre Marfil */
        .tt-master-phases-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 11px;
        }
        @media (min-width: 720px) {
          .tt-master-phases-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .tt-phase-card {
          border-radius: 20px;
          padding: 15px;
          background: #FAF9F5;
          color: #1E0734;
          border: 1px solid rgba(30, 7, 52, 0.1);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-phase-num {
          align-self: flex-start;
          padding: 3px 9px;
          border-radius: 999px;
          background: #1E0734;
          color: #00DC7D;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .tt-phase-card h3 {
          margin: 2px 0 0;
          font-size: 0.94rem;
          font-weight: 900;
        }
        .tt-phase-card p {
          margin: 0;
          font-size: 0.77rem;
          line-height: 1.45;
          color: rgba(30, 7, 52, 0.75);
        }

        /* Grupos A y B */
        .tt-master-groups-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 720px) {
          .tt-master-groups-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-group-card {
          border-radius: 20px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          overflow: hidden;
        }
        .tt-group-card-head {
          padding: 12px 14px;
          background: #1E0734;
          color: #FAF9F5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .tt-group-card-head strong {
          font-size: 0.8rem;
          letter-spacing: 0.06em;
          color: #00DC7D;
        }
        .tt-group-card-head span {
          font-size: 0.68rem;
          opacity: 0.76;
        }
        .tt-group-rows {
          display: flex;
          flex-direction: column;
        }
        .tt-group-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 13px;
          border-bottom: 1px solid var(--tt-border);
          cursor: pointer;
        }
        .tt-group-row:last-child {
          border-bottom: none;
        }
        .tt-group-row.is-advancing {
          box-shadow: inset 3px 0 0 #00DC7D;
        }
        .tt-group-seed {
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          font-weight: 900;
          min-width: 26px;
          color: #F59E0B;
        }
        .tt-group-row strong {
          display: block;
          font-size: 0.86rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-group-row small {
          display: block;
          font-size: 0.7rem;
          color: var(--tt-text-muted);
        }
        .tt-group-pts {
          text-align: right;
          flex-shrink: 0;
        }
        .tt-group-pts strong {
          font-family: var(--tt-font-display);
          font-size: 1.05rem;
          color: #00DC7D;
        }
        .tt-torneos-view.is-light .tt-group-pts strong {
          color: #1E0734;
        }
        .tt-group-pts span {
          font-size: 0.56rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }

        .tt-master-q-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-master-q-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 13px;
          border-radius: 17px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          cursor: pointer;
        }
        .tt-master-q-num {
          font-family: var(--tt-font-display);
          font-size: 1.35rem;
          font-weight: 900;
          color: #00DC7D;
          min-width: 30px;
        }
        .tt-torneos-view.is-light .tt-master-q-num {
          color: #1E0734;
        }
        .tt-master-q-row strong {
          display: block;
          font-size: 0.9rem;
        }
        .tt-master-q-row small {
          font-size: 0.72rem;
          color: var(--tt-text-muted);
        }
        .tt-master-q-pts {
          text-align: right;
        }
        .tt-master-q-pts strong {
          font-family: var(--tt-font-display);
          font-size: 1.2rem;
          color: #F59E0B;
        }
        .tt-master-q-pts span {
          font-size: 0.58rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }

        .tt-master-rewards-wrap {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 720px) {
          .tt-master-rewards-wrap {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-mr-card {
          border-radius: 20px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-mr-card.is-annual {
          border-color: rgba(245, 158, 11, 0.48);
        }
        .tt-mr-kicker {
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
        }
        .tt-mr-kicker.is-gold {
          color: #F59E0B;
        }
        .tt-mr-card h3 {
          margin: 0;
          font-size: 0.98rem;
        }
        .tt-mr-card p {
          margin: 0;
          font-size: 0.76rem;
          color: var(--tt-text-muted);
        }
        .tt-mr-podium {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-mr-item {
          padding: 9px 11px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.76rem;
        }

        /* 5. SALÓN DE LA FAMA — TARJETAS HORIZONTALES WINNER ESMERALDA */
        .tt-hof-intro {
          border-radius: 20px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid rgba(245, 158, 11, 0.35);
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .tt-hof-kicker {
          display: block;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #F59E0B;
        }
        .tt-hof-title {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.28rem;
          line-height: 1.08;
        }
        .tt-hof-sub {
          margin: 4px 0 0;
          font-size: 0.78rem;
          color: var(--tt-text-muted);
        }
        .tt-hof-filters {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
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
        .tt-hof-chip.is-active {
          background: #1E0734;
          border-color: #00DC7D;
          color: #00DC7D;
          font-weight: 800;
        }

        .tt-hof-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-winner-row-card {
          border-radius: 22px;
          overflow: hidden;
          background: #1E0734;
          border: 1px solid rgba(245, 158, 11, 0.35);
          display: grid;
          grid-template-columns: 1fr;
          box-shadow: 0 12px 28px rgba(10, 2, 20, 0.28);
        }
        @media (min-width: 680px) {
          .tt-winner-row-card {
            grid-template-columns: 82px 1.2fr 1.05fr;
          }
        }
        .tt-wr-date-col {
          padding: 12px 10px;
          background: #1A0530;
          color: #FAF9F5;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        @media (min-width: 680px) {
          .tt-wr-date-col {
            flex-direction: column;
            justify-content: center;
            text-align: center;
          }
        }
        .tt-wr-date-col strong {
          font-family: var(--tt-font-display);
          font-size: 1.05rem;
          line-height: 1;
        }
        .tt-wr-date-col span {
          font-size: 0.76rem;
          font-weight: 900;
          color: #00DC7D;
          letter-spacing: 0.08em;
        }
        .tt-wr-date-col small {
          font-size: 0.68rem;
          opacity: 0.68;
        }

        .tt-wr-center-col {
          padding: 14px;
          background: #FAF9F5;
          color: #1E0734;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
        }
        .tt-wr-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tt-wr-cat-pill {
          padding: 2px 8px;
          border-radius: 999px;
          background: #1E0734;
          color: #FAF9F5;
          font-size: 0.64rem;
          font-weight: 800;
        }
        .tt-wr-surf-pill {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(200, 90, 50, 0.14);
          color: #B44924;
          font-size: 0.64rem;
          font-weight: 900;
        }
        .tt-wr-season {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          color: rgba(30, 7, 52, 0.56);
        }
        .tt-wr-tourney-name {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          font-weight: 900;
          line-height: 1.08;
        }
        .tt-wr-record-strip {
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 0.66rem;
          font-weight: 900;
        }
        .tt-wr-record-strip .is-wins {
          padding: 3px 8px;
          border-radius: 7px;
          background: #00DC7D;
          color: #120321;
        }
        .tt-wr-record-strip .is-losses {
          padding: 3px 8px;
          border-radius: 7px;
          background: rgba(30, 7, 52, 0.1);
          color: rgba(30, 7, 52, 0.72);
        }
        .tt-wr-record-strip .is-eff {
          color: #008A4E;
        }

        /* Módulo Derecho Integrado WINNER Esmeralda */
        .tt-wr-emerald-col {
          padding: 13px 14px;
          background: linear-gradient(135deg, #00DC7D 0%, #6EF2B5 100%);
          color: #120321;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-wr-winner-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-wr-winner-tag {
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          opacity: 0.72;
        }
        .tt-wr-surname {
          font-family: var(--tt-font-display);
          font-size: 1.38rem;
          font-weight: 900;
          line-height: 0.96;
          color: #120321;
        }
        .tt-wr-fullname {
          font-size: 0.72rem;
          font-weight: 700;
          opacity: 0.82;
        }
        .tt-wr-circle-actions {
          margin-top: 6px;
          display: flex;
          gap: 7px;
        }
        .tt-wr-circle-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1E0734;
          color: #00DC7D;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(18, 3, 33, 0.25);
        }
        .tt-wr-portrait-box {
          flex-shrink: 0;
        }

        /* 6. MODAL DEL TORNEO (CUADROS, OCTAVOS, CONSUELO Y COLLAGE PREMIOS) */
        .tt-tmodal-wrap {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-tmodal-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .tt-tmodal-tab {
          flex-shrink: 0;
          min-height: 38px;
          padding: 0 13px;
          border-radius: 12px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.76rem;
          font-weight: 800;
        }
        .tt-tmodal-tab.is-active {
          background: #1E0734;
          border-color: #00DC7D;
          color: #00DC7D;
        }
        .tt-rounds-pills {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .tt-round-pill {
          flex-shrink: 0;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.73rem;
          font-weight: 800;
        }
        .tt-round-pill.is-active {
          background: rgba(0, 220, 125, 0.16);
          border-color: #00DC7D;
          color: #00DC7D;
        }
        .tt-torneos-view.is-light .tt-round-pill.is-active {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-round-pill.is-final.is-active {
          background: linear-gradient(135deg, #FBBF24 0%, #D97706 100%);
          border-color: #F59E0B;
          color: #1E1102;
        }

        .tt-bracket-section,
        .tt-participants-section,
        .tt-tmodal-prizes-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-bracket-matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 680px) {
          .tt-bracket-matches-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .tt-bm-card {
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          overflow: hidden;
        }
        .tt-bm-card.is-done {
          border-color: rgba(0, 220, 125, 0.34);
        }
        .tt-bm-head {
          padding: 7px 11px;
          background: rgba(30, 7, 52, 0.18);
          border-bottom: 1px solid var(--tt-border);
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-bm-state.finished {
          color: #00DC7D;
        }
        .tt-torneos-view.is-light .tt-bm-state.finished {
          color: #008A4E;
        }
        .tt-bm-slot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 11px;
          cursor: pointer;
        }
        .tt-bm-slot.is-winner {
          background: rgba(0, 220, 125, 0.12);
        }
        .tt-bm-slot.is-loser {
          opacity: 0.62;
        }
        .tt-bm-divider {
          height: 1px;
          background: var(--tt-border);
        }
        .tt-bm-player-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .tt-bm-tbd-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--tt-surface);
          border: 1px dashed var(--tt-border);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          flex-shrink: 0;
        }
        .tt-bm-name {
          display: block;
          font-size: 0.82rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-bm-sub {
          display: block;
          font-size: 0.66rem;
          color: var(--tt-text-muted);
        }
        .tt-bm-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .tt-bm-win-arrow {
          color: #00DC7D;
          font-size: 0.8rem;
          font-weight: 900;
        }
        .tt-bm-admin-pick {
          padding: 3px 8px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.66rem;
          font-weight: 900;
        }

        .tt-consolation-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          font-size: 0.77rem;
          line-height: 1.4;
          color: var(--tt-text-muted);
        }

        .tt-enrolled-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media (min-width: 640px) {
          .tt-enrolled-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-enrolled-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 11px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          cursor: pointer;
        }
        .tt-enrolled-num {
          font-family: var(--tt-font-display);
          font-size: 1rem;
          font-weight: 900;
          min-width: 22px;
          color: var(--tt-text-muted);
        }
        .tt-enrolled-row strong {
          display: block;
          font-size: 0.82rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-enrolled-row small {
          display: block;
          font-size: 0.68rem;
          color: var(--tt-text-muted);
        }
        .tt-enrolled-pts {
          font-size: 0.74rem;
          font-weight: 800;
          color: #00DC7D;
          white-space: nowrap;
        }
        .tt-torneos-view.is-light .tt-enrolled-pts {
          color: #008A4E;
        }

        .tt-admin-pending-box {
          padding: 12px;
          border-radius: 14px;
          background: rgba(245, 158, 11, 0.14);
          border: 1px solid rgba(245, 158, 11, 0.45);
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.8rem;
        }
        .tt-admin-pending-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        /* Vitrina Visual Tipo Collage de Premios */
        .tt-prize-collage {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-prize-collage-head {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-prize-kicker {
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #F59E0B;
        }
        .tt-prize-collage-head small {
          font-size: 0.74rem;
          color: var(--tt-text-muted);
        }
        .tt-prize-collage-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 9px;
        }
        @media (min-width: 560px) {
          .tt-prize-collage-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-prize-tile {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-prize-tile.is-featured {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(30, 7, 52, 0.18) 100%);
          border-color: rgba(245, 158, 11, 0.45);
        }
        .tt-prize-tile.is-cash {
          border-color: rgba(0, 220, 125, 0.4);
        }
        .tt-prize-tile-label {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--tt-text-muted);
        }
        .tt-prize-tile-val {
          display: block;
          font-size: 0.84rem;
          font-weight: 800;
          line-height: 1.25;
          margin-top: 2px;
        }

        .tt-includes-box {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          font-size: 0.8rem;
        }
        .tt-includes-box ul {
          margin: 8px 0 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-includes-box li {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          font-size: 0.77rem;
          color: var(--tt-text-muted);
        }
        .tt-tmodal-foot {
          padding-top: 6px;
          border-top: 1px solid var(--tt-border);
        }

        /* 7. MODAL DE PAGO E INSCRIPCIÓN (YAPE / PLIN / BANCO) */
        .tt-pay-modal-stack {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-pay-hero-box {
          padding: 14px;
          border-radius: 18px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.35);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-pay-hero-box span {
          display: block;
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          opacity: 0.74;
        }
        .tt-pay-hero-box strong {
          font-family: var(--tt-font-display);
          font-size: 1.85rem;
          line-height: 1;
          color: #00DC7D;
        }
        .tt-pay-balls-tag {
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.14);
          font-size: 0.72rem;
          font-weight: 800;
        }
        .tt-pay-balls-tag.is-yes {
          background: rgba(0, 220, 125, 0.2);
          color: #7CF5C0;
        }
        .tt-pay-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-pay-field label {
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-pay-select {
          min-height: 44px;
          padding: 0 12px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.88rem;
          font-weight: 700;
        }
        .tt-pay-channels-box {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-pay-channels-title {
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
        }
        .tt-torneos-view.is-light .tt-pay-channels-title {
          color: #008A4E;
        }
        .tt-pay-holder {
          margin: -4px 0 2px;
          font-size: 0.74rem;
          color: var(--tt-text-muted);
        }
        .tt-pay-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 11px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
        }
        .tt-pay-row small {
          display: block;
          font-size: 0.65rem;
          color: var(--tt-text-muted);
        }
        .tt-pay-row strong {
          font-size: 0.88rem;
          font-variant-numeric: tabular-nums;
        }
        .tt-copy-chip {
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.16);
          color: #00DC7D;
          font-size: 0.72rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .tt-torneos-view.is-light .tt-copy-chip {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-pay-disclaimer {
          margin: 0;
          font-size: 0.75rem;
          line-height: 1.45;
          color: var(--tt-text-muted);
        }
      `}</style>
    </section>
  );
}
