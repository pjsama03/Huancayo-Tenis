import React, { useEffect, useMemo, useState } from 'react';
import {
  ASSETS,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import { INITIAL_CLUBS, getCategoryByPoints } from '../data/playersAndClubsData';
import { buildWhatsappLink } from '../utils/cloudService';

export const ADMIN_SUITE_EDITABLE_CONFIG = {
  adminPin: '1234',
  defaultResetPassword: 'Tenis2026',
  vipMonthlyBonusGems: 200,
  maxPlayersCapacity: 10000,
  maxMatchesBuffer: 10000,
  memoryAlertThresholdPct: 75,
  complaintsStorageKey: 'tt_indecopi_complaints_v1',
  sponsorsStorageKey: 'tt_admin_sponsors_v1',
};

const ADMIN_TABS = [
  { id: 'pagos', label: 'Pagos & VIP' },
  { id: 'cuentas', label: 'Cuentas' },
  { id: 'temporadas', label: 'Temporadas' },
  { id: 'clubshop', label: 'Club & Shop' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'reclamaciones', label: 'Libro Rec.' },
  { id: 'respaldo', label: 'Respaldo' },
];

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/* ==========================================================================
   MOTOR DE CALENDARIO DE TEMPORADAS (~90 DÍAS + MANDO MANUAL COMPLETO)
   ========================================================================== */
function getTodayIsoPeru() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function addDaysIso(isoDate, deltaDays) {
  const [y, m, d] = String(isoDate || getTodayIsoPeru())
    .split('-')
    .map((n) => Number(n) || 1);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatShortPeriod(startIso, endIso) {
  const fmt = (iso) => {
    const parts = String(iso || '').split('-');
    if (parts.length !== 3) return '';
    const dd = Number(parts[2]);
    const mm = MONTHS_ES[Math.max(0, Math.min(11, Number(parts[1]) - 1))];
    return `${String(dd).padStart(2, '0')} ${mm}`;
  };
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

function ensureFourSeasons(snap) {
  const year = Number(snap?.year) || new Date().getFullYear();
  const defaults = [
    { number: 1, label: 'Temporada 1', startDate: `${year}-01-01`, endDate: `${year}-03-31` },
    { number: 2, label: 'Temporada 2', startDate: `${year}-04-01`, endDate: `${year}-06-30` },
    { number: 3, label: 'Temporada 3', startDate: `${year}-07-01`, endDate: `${year}-09-30` },
    { number: 4, label: 'Temporada 4', startDate: `${year}-10-01`, endDate: `${year}-12-31` },
  ];
  const existing = Array.isArray(snap?.seasons) ? snap.seasons : [];
  return defaults.map((def) => {
    const found = existing.find((s) => Number(s.number) === def.number);
    const startDate = found?.startDate || def.startDate;
    const endDate = found?.endDate || def.endDate;
    return {
      number: def.number,
      label: found?.label || def.label,
      startDate,
      endDate,
      period: found?.period || formatShortPeriod(startDate, endDate),
      locked: Boolean(found?.locked),
      closedAt: found?.closedAt || null,
      scores: found?.scores || {},
    };
  });
}

function buildProjectedSeasonSnapshots(baseSnap, activeNum, startIso, durationDays, autoAdvance) {
  const safeDays = Math.max(14, Math.min(180, Number(durationDays) || 90));
  const targetNum = Math.max(1, Math.min(4, Number(activeNum) || 1));
  const currentList = ensureFourSeasons(baseSnap);
  const yearFromStart = Number(String(startIso || '').slice(0, 4)) || new Date().getFullYear();

  const updated = currentList.map((s) => ({ ...s }));
  const targetIdx = targetNum - 1;

  // Fijar temporada elegida como activa y abierta
  const activeEnd = addDaysIso(startIso, safeDays - 1);
  updated[targetIdx] = {
    ...updated[targetIdx],
    startDate: startIso,
    endDate: activeEnd,
    period: formatShortPeriod(startIso, activeEnd),
    locked: false,
    closedAt: null,
  };

  // Proyectar hacia adelante (T+1 ... T4) automáticamente cada ~90 días
  for (let i = targetIdx + 1; i < 4; i += 1) {
    const nextStart = addDaysIso(updated[i - 1].endDate, 1);
    const nextEnd = addDaysIso(nextStart, safeDays - 1);
    updated[i] = {
      ...updated[i],
      startDate: nextStart,
      endDate: nextEnd,
      period: formatShortPeriod(nextStart, nextEnd),
      locked: false,
      closedAt: null,
    };
  }

  // Proyectar fechas hacia atrás solo si las temporadas previas no tenían fecha exacta
  for (let i = targetIdx - 1; i >= 0; i -= 1) {
    const prevEnd = addDaysIso(updated[i + 1].startDate, -1);
    const prevStart = addDaysIso(prevEnd, -(safeDays - 1));
    if (!updated[i].startDate || !updated[i].endDate) {
      updated[i] = {
        ...updated[i],
        startDate: prevStart,
        endDate: prevEnd,
        period: formatShortPeriod(prevStart, prevEnd),
      };
    }
  }

  return {
    ...(baseSnap || {}),
    year: yearFromStart,
    currentSeason: targetNum,
    durationDays: safeDays,
    autoAdvance: Boolean(autoAdvance),
    seasons: updated,
  };
}

function closeActiveSeasonSnapshot(baseSnap, players = []) {
  const curNum = Math.max(1, Math.min(4, Number(baseSnap?.currentSeason) || 1));
  const year = Number(baseSnap?.year) || new Date().getFullYear();
  const durationDays = Number(baseSnap?.durationDays) || 90;
  const frozenScores = {};
  (players || []).forEach((p) => {
    if (!p.isTutorOnly) frozenScores[p.id] = Number(p.points) || 0;
  });

  const list = ensureFourSeasons(baseSnap).map((s) =>
    s.number === curNum
      ? { ...s, locked: true, closedAt: new Date().toISOString(), scores: frozenScores }
      : s
  );

  const isYearEnd = curNum >= 4;
  return {
    ...(baseSnap || {}),
    year: isYearEnd ? year + 1 : year,
    currentSeason: isYearEnd ? 1 : curNum + 1,
    durationDays,
    autoAdvance: baseSnap?.autoAdvance !== false,
    seasons: isYearEnd
      ? buildProjectedSeasonSnapshots(
          { year: year + 1, durationDays, autoAdvance: baseSnap?.autoAdvance !== false },
          1,
          addDaysIso(list[3].endDate || getTodayIsoPeru(), 1),
          durationDays,
          baseSnap?.autoAdvance !== false
        ).seasons
      : list,
  };
}

function reopenPreviousSeasonSnapshot(baseSnap) {
  const curNum = Math.max(1, Math.min(4, Number(baseSnap?.currentSeason) || 1));
  const list = ensureFourSeasons(baseSnap);
  const prevNum = curNum > 1 ? curNum - 1 : 4;
  const nextYear =
    curNum === 1 ? Math.max(2025, (Number(baseSnap?.year) || new Date().getFullYear()) - 1) : baseSnap?.year || new Date().getFullYear();

  const updated = list.map((s) =>
    s.number === prevNum ? { ...s, locked: false, closedAt: null } : s
  );

  return {
    ...(baseSnap || {}),
    year: nextYear,
    currentSeason: prevNum,
    seasons: updated,
  };
}

function resetCurrentSeasonSnapshot(baseSnap) {
  const curNum = Math.max(1, Math.min(4, Number(baseSnap?.currentSeason) || 1));
  const updated = ensureFourSeasons(baseSnap).map((s) =>
    s.number === curNum ? { ...s, locked: false, closedAt: null, scores: {} } : s
  );
  return {
    ...(baseSnap || {}),
    currentSeason: curNum,
    seasons: updated,
  };
}

/* ==========================================================================
   EXPORTADOR EXCEL (.CSV CON BOM UTF-8)
   ========================================================================== */
function downloadExcelCsv(filename, headers, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: AdminSuiteModal (BLINDADO OSCURO + CONTROL TEMPORADAS)
   ========================================================================== */
export default function AdminSuiteModal({
  isOpen = false,
  onClose,
  isUnlockedInitially = false,
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  tournaments = [],
  complaints = [],
  seasonSnapshots = null,
  sponsorsConfig = null,
  onUnlockAdminSession,
  onSwitchSandboxUser,
  onAdminUpdatePlayer,
  onAdminDeletePlayer,
  onAdminPurgeDemoPlayers,
  onAdminApproveVip,
  onAdminApproveTournamentPayment,
  onAdminCreateTournament,
  onAdminCloseSeason,
  onAdminResolveDispute,
  onAdminToggleClubActive,
  onAdminSaveSponsors,
  onAdminPurgeArchivedMatches,
  onNotify,
}) {
  const [isUnlocked, setIsUnlocked] = useState(Boolean(isUnlockedInitially));
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('pagos');

  // Cuentas
  const [accountSearch, setAccountSearch] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editGems, setEditGems] = useState('');

  // Control Total de Temporadas
  const normalizedSeasons = useMemo(() => ensureFourSeasons(seasonSnapshots), [seasonSnapshots]);
  const [calSeasonNum, setCalSeasonNum] = useState(Number(seasonSnapshots?.currentSeason) || 4);
  const [calStartDate, setCalStartDate] = useState(getTodayIsoPeru());
  const [calDurationDays, setCalDurationDays] = useState(Number(seasonSnapshots?.durationDays) || 90);
  const [calAutoAdvance, setCalAutoAdvance] = useState(seasonSnapshots?.autoAdvance !== false);
  const [confirmResetSeason, setConfirmResetSeason] = useState(false);

  // Torneo Personalizable
  const [showNewTourney, setShowNewTourney] = useState(false);
  const [ntName, setNtName] = useState('');
  const [ntClubId, setNtClubId] = useState(clubs?.[0]?.id || 'club-country');
  const [ntDate, setNtDate] = useState('10 – 19 ENE');
  const [ntDrawSize, setNtDrawSize] = useState(16);
  const [ntFee, setNtFee] = useState(45);
  const [ntIncludesBalls, setNtIncludesBalls] = useState(true);
  const [ntHasConsolation, setNtHasConsolation] = useState(true);

  // Clubes & Sponsors
  const [disabledClubIds, setDisabledClubIds] = useState([]);
  const [sponsors, setSponsors] = useState(() => {
    if (sponsorsConfig) return sponsorsConfig;
    try {
      const saved = window.localStorage.getItem(ADMIN_SUITE_EDITABLE_CONFIG.sponsorsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // default limpio
    }
    return {
      titleSponsorActive: false,
      titleSponsorName: '',
      titleSponsorUrl: '',
      weatherSponsorActive: false,
      weatherSponsorName: '',
      raffleSponsorActive: true,
      rafflePrizeText: '2 Tarros de Pelotas Pro + 1 Encordado Completo',
    };
  });

  // Reclamaciones & Respaldo
  const [localComplaints, setLocalComplaints] = useState([]);
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);
  const [confirmPurgeDemo, setConfirmPurgeDemo] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isUnlockedInitially) setIsUnlocked(true);
    setPinInput('');
    setPinError('');
    setConfirmResetSeason(false);
    setConfirmPurgeDemo(false);

    const curNum = Number(seasonSnapshots?.currentSeason) || 4;
    const list = ensureFourSeasons(seasonSnapshots);
    const activeObj = list.find((s) => s.number === curNum) || list[0];
    setCalSeasonNum(curNum);
    setCalStartDate(activeObj?.startDate || getTodayIsoPeru());
    setCalDurationDays(Number(seasonSnapshots?.durationDays) || 90);
    setCalAutoAdvance(seasonSnapshots?.autoAdvance !== false);

    try {
      const raw = window.localStorage.getItem(ADMIN_SUITE_EDITABLE_CONFIG.complaintsStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setLocalComplaints(parsed);
    } catch {
      setLocalComplaints([]);
    }
  }, [isOpen, isUnlockedInitially, seasonSnapshots]);

  const playersMap = useMemo(() => {
    const m = {};
    (players || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [players]);

  const demoCount = useMemo(() => (players || []).filter((p) => p.isDemo).length, [players]);

  const pendingVipPlayers = useMemo(
    () => (players || []).filter((p) => p.vipStatus === 'PENDING_PAYMENT' && !p.isVip),
    [players]
  );

  const pendingTournamentRequests = useMemo(() => {
    const rows = [];
    (tournaments || []).forEach((t) => {
      (t.pendingPaymentIds || []).forEach((pid) => {
        const pl = playersMap[pid];
        if (pl) rows.push({ tournament: t, player: pl });
      });
    });
    return rows;
  }, [tournaments, playersMap]);

  const disputedChallenges = useMemo(
    () =>
      (challenges || []).filter(
        (c) => c.status === 'DISPUTED' || c.status === 'SCORE_PROPOSED' || c.status === 'IN_PLAY'
      ),
    [challenges]
  );

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    return [...(players || [])]
      .filter((p) => {
        if (!q) return true;
        return `${p.name || ''} ${p.email || ''} ${p.whatsapp || ''} ${p.credentialId || ''}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
  }, [players, accountSearch]);

  const allComplaints = useMemo(() => {
    const map = new Map();
    [...(complaints || []), ...(localComplaints || [])].forEach((c) => {
      if (c?.code) map.set(c.code, c);
    });
    return Array.from(map.values());
  }, [complaints, localComplaints]);

  const storageStats = useMemo(() => {
    const pCount = players.length;
    const mCount = challenges.length;
    const pPct = Math.min(100, Math.round((pCount / ADMIN_SUITE_EDITABLE_CONFIG.maxPlayersCapacity) * 100));
    const mPct = Math.min(100, Math.round((mCount / ADMIN_SUITE_EDITABLE_CONFIG.maxMatchesBuffer) * 100));
    const maxPct = Math.max(pPct, mPct);
    return {
      pCount,
      mCount,
      pPct,
      mPct,
      isWarning: maxPct >= ADMIN_SUITE_EDITABLE_CONFIG.memoryAlertThresholdPct,
    };
  }, [players.length, challenges.length]);

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_SUITE_EDITABLE_CONFIG.adminPin) {
      triggerHaptic('success');
      setIsUnlocked(true);
      setPinError('');
      if (onUnlockAdminSession) onUnlockAdminSession(true);
      if (onNotify) onNotify('Suite Maestra Admin desbloqueada.', 'success');
    } else {
      triggerHaptic('warning');
      setPinError('PIN incorrecto. Acceso exclusivo del organizador.');
    }
  };

  /* Acciones Temporadas */
  const handleSaveSeasonCalendar = (e) => {
    e.preventDefault();
    const nextSnap = buildProjectedSeasonSnapshots(
      seasonSnapshots,
      calSeasonNum,
      calStartDate,
      calDurationDays,
      calAutoAdvance
    );
    if (onAdminCloseSeason) onAdminCloseSeason(nextSnap);
    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        `Calendario guardado: Temporada ${nextSnap.currentSeason} inicia ${calStartDate} (${nextSnap.durationDays} días c/u).`,
        'success'
      );
    }
  };

  const handleCloseCurrentSeason = () => {
    const nextSnap = closeActiveSeasonSnapshot(seasonSnapshots, players);
    if (onAdminCloseSeason) onAdminCloseSeason(nextSnap);
    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        `Temporada cerrada. Ahora está activa la Temporada ${nextSnap.currentSeason} (${nextSnap.year}).`,
        'success'
      );
    }
  };

  const handleReopenPrevSeason = () => {
    const nextSnap = reopenPreviousSeasonSnapshot(seasonSnapshots);
    if (onAdminCloseSeason) onAdminCloseSeason(nextSnap);
    triggerHaptic('medium');
    if (onNotify) {
      onNotify(
        `Temporada ${nextSnap.currentSeason} (${nextSnap.year}) reabierta y activa nuevamente.`,
        'info'
      );
    }
  };

  const handleResetCurrentSeason = () => {
    if (!confirmResetSeason) {
      triggerHaptic('warning');
      setConfirmResetSeason(true);
      return;
    }
    const nextSnap = resetCurrentSeasonSnapshot(seasonSnapshots);
    if (onAdminCloseSeason) onAdminCloseSeason(nextSnap);
    setConfirmResetSeason(false);
    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        `Temporada ${nextSnap.currentSeason} reiniciada en la carrera anual (el Ranking ELO sigue intacto).`,
        'info'
      );
    }
  };

  /* Acciones Cuentas, Torneos, Sponsors y Excel */
  const openEditAccount = (p) => {
    triggerHaptic('light');
    setEditingPlayerId(p.id);
    setEditEmail(p.email || '');
    setEditPoints(String(p.points ?? 1000));
    setEditGems(String(p.gems ?? 0));
  };

  const handleSaveAccountEdit = (p) => {
    if (onAdminUpdatePlayer) {
      onAdminUpdatePlayer(p.id, {
        email: editEmail.trim().toLowerCase(),
        points: Math.max(100, Number(editPoints) || p.points || 100),
        gems: Math.max(0, Number(editGems) || 0),
      });
    }
    triggerHaptic('success');
    setEditingPlayerId(null);
    if (onNotify) onNotify(`Ficha de ${p.name} actualizada en vivo.`, 'success');
  };

  const handleCreateCustomTournament = (e) => {
    e.preventDefault();
    if (ntName.trim().length < 4) return;
    const clubObj = (clubs || []).find((c) => c.id === ntClubId);
    const created = {
      id: `torneo-${Date.now()}`,
      name: ntName.trim(),
      shortName: ntName.trim().slice(0, 26),
      clubId: clubObj?.id || 'club-country',
      clubName: clubObj?.name || 'Sede Oficial',
      surface: 'Arcilla',
      status: 'OPEN',
      dateLabel: ntDate.trim() || 'PRÓXIMA FECHA',
      categoryLabel: 'Abierto por Categorías',
      drawSize: Number(ntDrawSize) === 8 ? 8 : 16,
      minPlayersForDraw: Number(ntDrawSize) === 8 ? 6 : 8,
      entryFee: Number(ntFee) || 40,
      includesBalls: ntIncludesBalls,
      includesItems: [
        ntIncludesBalls ? 'Pelotas presurizadas nuevas incluidas' : 'Pelotas por acuerdo en cancha',
        ntHasConsolation ? 'Incluye Ronda Consuelo (Copa de Plata)' : 'Eliminación directa oficial',
        'Registro de puntos en Ranking Oficial TOTAL TENIS',
      ],
      hasConsolation: ntHasConsolation,
      banner: ASSETS.torneoApertura,
      prizes: {
        trophy: 'Trofeo Oficial de Campeón + Medalla Finalista',
        cash: `Bolsa según inscritos (cuota S/ ${ntFee})`,
        proShop: 'Vales Pro Shop Oficial',
        points: '+180 pts Oficiales al Campeón',
        gems: '+250 💎 Campeón · +120 💎 Finalista',
      },
      participantsIds: [],
      pendingPaymentIds: [],
      bracketResults: {},
    };

    if (onAdminCreateTournament) onAdminCreateTournament(created);
    setNtName('');
    setShowNewTourney(false);
    triggerHaptic('success');
    if (onNotify) onNotify(`Torneo "${created.name}" publicado.`, 'success');
  };

  const handleSaveSponsorsConfig = (e) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(ADMIN_SUITE_EDITABLE_CONFIG.sponsorsStorageKey, JSON.stringify(sponsors));
    } catch {
      // continuar
    }
    if (onAdminSaveSponsors) onAdminSaveSponsors(sponsors);
    triggerHaptic('success');
    if (onNotify) onNotify('Configuración de patrocinadores guardada.', 'success');
  };

  const handleExportPlayersExcel = () => {
    triggerHaptic('success');
    downloadExcelCsv(
      `TotalTenis-Jugadores-${getTodayIsoPeru()}.csv`,
      ['Credencial', 'Nombre', 'Correo', 'WhatsApp', 'Edad', 'Rama', 'Club', 'Categoria', 'Puntos', 'V', 'D', 'Gemas', 'Plan', 'Estado'],
      (players || []).map((p) => [
        p.credentialId || p.id,
        p.name,
        p.email || '',
        p.whatsapp || '',
        p.age || '',
        p.division || 'Varones',
        p.clubName || 'Independiente',
        getCategoryByPoints(p.points).name,
        p.points || 0,
        p.wins || 0,
        p.losses || 0,
        p.gems || 0,
        p.isVip ? 'SOCIO VIP' : 'ESTÁNDAR',
        p.isPaused ? 'PAUSADO' : 'ACTIVO',
      ])
    );
    setHasDownloadedBackup(true);
    if (onNotify) onNotify('Excel (.csv) de jugadores descargado.', 'success');
  };

  const handleExportMatchesExcel = () => {
    triggerHaptic('success');
    downloadExcelCsv(
      `TotalTenis-Partidos-${getTodayIsoPeru()}.csv`,
      ['ID', 'Fecha', 'Sede', 'Modalidad', 'Jugador_A', 'Jugador_B', 'Marcador', 'Ganador', 'Delta_A', 'Delta_B', 'Estado'],
      (challenges || []).map((c) => [
        c.id,
        c.scheduledIso || c.dateLabel || '',
        c.clubName || '',
        c.mode || 'Por puntos',
        playersMap[c.playerAId]?.name || c.playerAId,
        playersMap[c.playerBId]?.name || c.playerBId,
        c.scoreSummary || '',
        playersMap[c.winnerId]?.name || '',
        c.eloDeltaA ?? 0,
        c.eloDeltaB ?? 0,
        c.status,
      ])
    );
    setHasDownloadedBackup(true);
    if (onNotify) onNotify('Excel (.csv) de partidos descargado.', 'success');
  };

  const handlePurgeDemosClick = async () => {
    if (!confirmPurgeDemo) {
      triggerHaptic('warning');
      setConfirmPurgeDemo(true);
      return;
    }
    setConfirmPurgeDemo(false);
    if (onAdminPurgeDemoPlayers) {
      await onAdminPurgeDemoPlayers();
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Suite Maestra · Administración"
      subtitle="Control total del circuito · TOTAL TENIS"
      icon={<IconBadge name="shield" variant="gold" size={38} />}
      isWide
      isTopLayer
    >
      <div className="tt-adm-shell">
        {!isUnlocked ? (
          <form onSubmit={handleUnlockSubmit} className="tt-adm-lock-screen">
            <div className="tt-adm-lock-icon">
              <TTIcon name="shield" size={34} style={{ color: '#00DC7D' }} />
            </div>
            <h3>Acceso Restringido del Organizador</h3>
            <p>Ingresa tu PIN maestro para aprobar pagos, controlar temporadas, gestionar cuentas y exportar respaldos.</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              className="tt-adm-pin-input"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              placeholder="••••"
              autoFocus
            />
            {pinError && <span className="tt-adm-pin-error">{pinError}</span>}
            <button type="submit" className="tt-adm-btn-emerald" style={{ width: '100%', maxWidth: 260 }}>
              Desbloquear Suite Maestra
            </button>
          </form>
        ) : (
          <div className="tt-adm-body">
            <div className="tt-adm-kpi-grid">
              <div><span>JUGADORES</span><strong>{players.length}</strong><small>{demoCount} demo</small></div>
              <div className="is-gold"><span>SOCIOS VIP</span><strong>{players.filter((p) => p.isVip).length}</strong><small>{pendingVipPlayers.length} pendientes</small></div>
              <div className="is-emerald"><span>PAGOS TORNEO</span><strong>{pendingTournamentRequests.length}</strong><small>en revisión</small></div>
              <div><span>TEMPORADA</span><strong>T{seasonSnapshots?.currentSeason || 4}</strong><small>{seasonSnapshots?.year || new Date().getFullYear()}</small></div>
            </div>

            <div className="tt-adm-tabs" role="tablist">
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`tt-adm-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTab(tab.id);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 1. PAGOS & VIP */}
            {activeTab === 'pagos' && (
              <div className="tt-adm-stack">
                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">INSCRIPCIONES A TORNEOS (EN VERIFICACIÓN)</span>
                  {pendingTournamentRequests.length === 0 ? (
                    <p className="tt-adm-empty">No hay constancias de torneos pendientes.</p>
                  ) : (
                    <div className="tt-adm-list">
                      {pendingTournamentRequests.map(({ tournament, player }) => (
                        <div key={`${tournament.id}-${player.id}`} className="tt-adm-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{player.name}</strong>
                            <small>{tournament.name} · Cuota S/ {tournament.entryFee}</small>
                          </div>
                          <button
                            type="button"
                            className="tt-adm-btn-emerald is-sm"
                            onClick={() => {
                              triggerHaptic('success');
                              if (onAdminApproveTournamentPayment) onAdminApproveTournamentPayment(tournament.id, player.id);
                            }}
                          >
                            Aprobar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">SOLICITUDES SOCIO VIP (+{ADMIN_SUITE_EDITABLE_CONFIG.vipMonthlyBonusGems} 💎)</span>
                  {pendingVipPlayers.length === 0 ? (
                    <p className="tt-adm-empty">No hay solicitudes VIP pendientes.</p>
                  ) : (
                    <div className="tt-adm-list">
                      {pendingVipPlayers.map((p) => (
                        <div key={p.id} className="tt-adm-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{p.name}</strong>
                            <small>{p.email || p.whatsapp}</small>
                          </div>
                          <button
                            type="button"
                            className="tt-adm-btn-gold is-sm"
                            onClick={() => {
                              triggerHaptic('success');
                              if (onAdminApproveVip) onAdminApproveVip(p.id, true, ADMIN_SUITE_EDITABLE_CONFIG.vipMonthlyBonusGems);
                            }}
                          >
                            Activar VIP
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">CONTROL DIRECTO VIP</span>
                  <div className="tt-adm-list">
                    {players.slice(0, 8).map((p) => (
                      <div key={p.id} className="tt-adm-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{p.name}</strong>
                          <small>{p.isVip ? 'Socio VIP Activo' : 'Plan Estándar'} · {Number(p.gems || 0)} 💎</small>
                        </div>
                        <button
                          type="button"
                          className={p.isVip ? 'tt-adm-btn-ghost is-sm' : 'tt-adm-btn-gold is-sm'}
                          onClick={() => {
                            triggerHaptic('medium');
                            if (onAdminApproveVip) onAdminApproveVip(p.id, !p.isVip, !p.isVip ? ADMIN_SUITE_EDITABLE_CONFIG.vipMonthlyBonusGems : 0);
                          }}
                        >
                          {p.isVip ? 'Quitar VIP' : 'Dar VIP'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. CUENTAS & SANDBOX */}
            {activeTab === 'cuentas' && (
              <div className="tt-adm-stack">
                <input
                  type="search"
                  className="tt-adm-input"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo, WhatsApp o código..."
                />

                <div className="tt-adm-list">
                  {filteredAccounts.map((p) => {
                    const isEditing = editingPlayerId === p.id;
                    return (
                      <div key={p.id} className={`tt-adm-account-card ${p.isPaused ? 'is-paused' : ''}`}>
                        <div className="tt-adm-acc-top">
                          <SmartImage
                            src={p.avatar}
                            alt={p.name}
                            initials={p.name}
                            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <strong>{p.name}</strong>
                              {p.isVip && <span className="tt-adm-tag-gold">VIP</span>}
                              {p.isDemo && <span className="tt-adm-tag-emerald">DEMO</span>}
                              {p.isPaused && <span className="tt-adm-tag-red">PAUSADO</span>}
                            </div>
                            <small>
                              {getCategoryByPoints(p.points).name} · {Number(p.points || 0)} pts · {Number(p.gems || 0)} 💎 · {p.email || 'Sin correo'}
                            </small>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="tt-adm-edit-box">
                            <input type="email" className="tt-adm-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Correo" />
                            <div className="tt-adm-grid-2">
                              <input type="number" className="tt-adm-input" value={editPoints} onChange={(e) => setEditPoints(e.target.value)} placeholder="Puntos" />
                              <input type="number" className="tt-adm-input" value={editGems} onChange={(e) => setEditGems(e.target.value)} placeholder="Gemas" />
                            </div>
                            <div style={{ display: 'flex', gap: 7 }}>
                              <button type="button" className="tt-adm-btn-emerald is-sm" style={{ flex: 1 }} onClick={() => handleSaveAccountEdit(p)}>Guardar</button>
                              <button type="button" className="tt-adm-btn-ghost is-sm" onClick={() => setEditingPlayerId(null)}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="tt-adm-acc-actions">
                            {onSwitchSandboxUser && (
                              <button type="button" className="tt-adm-chip is-emerald" onClick={() => { triggerHaptic('medium'); onSwitchSandboxUser(p); if (onClose) onClose(); }}>
                                Ver como él
                              </button>
                            )}
                            <button type="button" className="tt-adm-chip" onClick={() => openEditAccount(p)}>Editar ELO / Gemas</button>
                            <button
                              type="button"
                              className="tt-adm-chip"
                              onClick={() => {
                                triggerHaptic('light');
                                if (onAdminUpdatePlayer) onAdminUpdatePlayer(p.id, { isPaused: !p.isPaused });
                              }}
                            >
                              {p.isPaused ? 'Reactivar' : 'Pausar (Lesión/Viaje)'}
                            </button>
                            {onAdminDeletePlayer && (
                              <button type="button" className="tt-adm-chip is-danger" onClick={() => { triggerHaptic('warning'); onAdminDeletePlayer(p.id); }}>
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. CONTROL TOTAL DE TEMPORADAS (~90 DÍAS + MANDO MANUAL) + TORNEOS + DISPUTAS */}
            {activeTab === 'temporadas' && (
              <div className="tt-adm-stack">
                <form onSubmit={handleSaveSeasonCalendar} className="tt-adm-panel is-highlight tt-adm-form-stack">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="tt-adm-kicker" style={{ margin: 0 }}>
                      CALENDARIO Y MANDO MANUAL DE TEMPORADAS
                    </span>
                    <button
                      type="button"
                      className={`tt-adm-chip ${calAutoAdvance ? 'is-emerald' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setCalAutoAdvance((v) => !v);
                      }}
                    >
                      Auto-cierre: {calAutoAdvance ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Mapa visual de las 4 temporadas */}
                  <div className="tt-adm-seasons-strip">
                    {normalizedSeasons.map((s) => {
                      const isCur = s.number === (Number(seasonSnapshots?.currentSeason) || 4);
                      return (
                        <div key={s.number} className={`tt-adm-q-tile ${isCur ? 'is-cur' : s.locked ? 'is-done' : ''}`}>
                          <strong>T{s.number}</strong>
                          <span>{s.period}</span>
                          <small>{s.locked ? 'Cerrada' : isCur ? 'Activa' : 'Próxima'}</small>
                        </div>
                      );
                    })}
                  </div>

                  <div className="tt-adm-grid-3">
                    <label className="tt-adm-lbl">
                      <span>Temporada activa</span>
                      <select
                        className="tt-adm-input"
                        value={calSeasonNum}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          setCalSeasonNum(num);
                          const found = normalizedSeasons.find((s) => s.number === num);
                          if (found?.startDate) setCalStartDate(found.startDate);
                        }}
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>T{n}</option>
                        ))}
                      </select>
                    </label>

                    <label className="tt-adm-lbl">
                      <span>Inicio (Calendario)</span>
                      <input
                        type="date"
                        className="tt-adm-input"
                        value={calStartDate}
                        onChange={(e) => setCalStartDate(e.target.value)}
                        required
                      />
                    </label>

                    <label className="tt-adm-lbl">
                      <span>Duración (días)</span>
                      <input
                        type="number"
                        min={14}
                        max={180}
                        className="tt-adm-input"
                        value={calDurationDays}
                        onChange={(e) => setCalDurationDays(Number(e.target.value) || 90)}
                        required
                      />
                    </label>
                  </div>

                  <p className="tt-adm-subcopy">
                    Al guardar, esta temporada dura {calDurationDays} días (cierra el <b>{addDaysIso(calStartDate, Math.max(14, calDurationDays) - 1)}</b>) y las siguientes se calculan solas en el reloj de Torneos y Ranking.
                  </p>

                  <button type="submit" className="tt-adm-btn-emerald">
                    Programar y Guardar Calendario en Vivo
                  </button>

                  {/* 3 Botones de mando manual directo */}
                  <div className="tt-adm-grid-2">
                    <button type="button" className="tt-adm-btn-gold is-sm" onClick={handleCloseCurrentSeason}>
                      Cerrar T{seasonSnapshots?.currentSeason || 4} y Avanzar
                    </button>
                    <button type="button" className="tt-adm-btn-ghost is-sm" onClick={handleReopenPrevSeason}>
                      ↺ Reabrir Anterior
                    </button>
                  </div>

                  <button
                    type="button"
                    className="tt-adm-btn-danger is-sm"
                    onClick={handleResetCurrentSeason}
                  >
                    {confirmResetSeason
                      ? `Toca de nuevo para confirmar Reset de T${seasonSnapshots?.currentSeason || 4}`
                      : `Resetear cierre de T${seasonSnapshots?.currentSeason || 4} (conserva Ranking ELO)`}
                  </button>
                </form>

                {/* Crear Torneo */}
                <div className="tt-adm-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="tt-adm-kicker" style={{ margin: 0 }}>CREAR TORNEO OFICIAL</span>
                    <button type="button" className="tt-adm-btn-emerald is-sm" onClick={() => setShowNewTourney((v) => !v)}>
                      {showNewTourney ? 'Cerrar' : '+ Nuevo Torneo'}
                    </button>
                  </div>

                  {showNewTourney && (
                    <form onSubmit={handleCreateCustomTournament} className="tt-adm-form-stack" style={{ marginTop: 10 }}>
                      <input className="tt-adm-input" value={ntName} onChange={(e) => setNtName(e.target.value)} placeholder="Nombre del torneo" required />
                      <div className="tt-adm-grid-2">
                        <select className="tt-adm-input" value={ntClubId} onChange={(e) => setNtClubId(e.target.value)}>
                          {(clubs || []).map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
                        </select>
                        <input className="tt-adm-input" value={ntDate} onChange={(e) => setNtDate(e.target.value)} placeholder="Fechas (ej. 10 – 19 ENE)" />
                      </div>
                      <div className="tt-adm-grid-2">
                        <select className="tt-adm-input" value={ntDrawSize} onChange={(e) => setNtDrawSize(Number(e.target.value))}>
                          <option value={16}>Cuadro 16 (Octavos)</option>
                          <option value={8}>Cuadro 8 (Cuartos)</option>
                        </select>
                        <input type="number" className="tt-adm-input" value={ntFee} onChange={(e) => setNtFee(Number(e.target.value))} placeholder="Cuota S/" />
                      </div>
                      <div className="tt-adm-grid-2">
                        <button type="button" className={`tt-adm-chip ${ntIncludesBalls ? 'is-emerald' : ''}`} onClick={() => setNtIncludesBalls((v) => !v)}>
                          {ntIncludesBalls ? '✓ Con pelotas' : 'Sin pelotas'}
                        </button>
                        <button type="button" className={`tt-adm-chip ${ntHasConsolation ? 'is-emerald' : ''}`} onClick={() => setNtHasConsolation((v) => !v)}>
                          {ntHasConsolation ? '✓ Consuelo ON' : 'Consuelo OFF'}
                        </button>
                      </div>
                      <button type="submit" className="tt-adm-btn-emerald">Publicar Torneo</button>
                    </form>
                  )}
                </div>

                {/* Disputas y Marcadores por Validar */}
                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">DISPUTAS Y MARCADORES EN CURSO</span>
                  {disputedChallenges.length === 0 ? (
                    <p className="tt-adm-empty">Sin disputas abiertas.</p>
                  ) : (
                    <div className="tt-adm-list">
                      {disputedChallenges.map((ch) => (
                        <div key={ch.id} className="tt-adm-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{playersMap[ch.playerAId]?.name || 'A'} vs. {playersMap[ch.playerBId]?.name || 'B'}</strong>
                            <small>{ch.clubName} · {ch.scoreSummary || ch.status}</small>
                          </div>
                          {onAdminResolveDispute && (
                            <div style={{ display: 'flex', gap: 5 }}>
                              {(ch.status === 'DISPUTED' || ch.status === 'SCORE_PROPOSED') && (
                                <button type="button" className="tt-adm-chip is-emerald" onClick={() => onAdminResolveDispute(ch.id, 'CONFIRM')}>
                                  Validar
                                </button>
                              )}
                              <button type="button" className="tt-adm-chip is-danger" onClick={() => onAdminResolveDispute(ch.id, 'CANCEL')}>
                                Anular
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. CLUBES ON/OFF */}
            {activeTab === 'clubshop' && (
              <div className="tt-adm-stack">
                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">SEDES OFICIALES (ENCENDER / OCULTAR SIN BORRAR)</span>
                  <div className="tt-adm-list">
                    {(clubs || []).map((c) => {
                      const isOff = disabledClubIds.includes(c.id) || c.active === false;
                      return (
                        <div key={c.id} className="tt-adm-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{c.name}</strong>
                            <small>{isOff ? 'Oculto temporalmente' : 'Visible en Sedes y Retos'}</small>
                          </div>
                          <button
                            type="button"
                            className={`tt-adm-chip ${!isOff ? 'is-emerald' : 'is-danger'}`}
                            onClick={() => {
                              triggerHaptic('light');
                              setDisabledClubIds((prev) =>
                                prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                              );
                              if (onAdminToggleClubActive) onAdminToggleClubActive(c.id, isOff);
                            }}
                          >
                            {isOff ? 'OFF · Reactivar' : 'ON · Visible'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">PRO SHOP · GESTIÓN EN VIVO</span>
                  <p className="tt-adm-subcopy">
                    Para subir productos nuevos, editar stock, fotos o precios del Pro Shop, abre la Tienda desde la barra superior y toca el botón <b>⚙ Gestionar</b>.
                  </p>
                </div>
              </div>
            )}

            {/* 5. PATROCINADORES NATIVOS */}
            {activeTab === 'sponsors' && (
              <form onSubmit={handleSaveSponsorsConfig} className="tt-adm-panel tt-adm-form-stack">
                <span className="tt-adm-kicker">PATROCINADORES OFICIALES DEL CIRCUITO</span>
                <div className="tt-adm-toggle-line">
                  <div><strong>Title Sponsor (Co-branding)</strong><small>Aparece en cabecera y pie de Stories 9:16.</small></div>
                  <button type="button" className={`tt-adm-chip ${sponsors.titleSponsorActive ? 'is-emerald' : ''}`} onClick={() => setSponsors((s) => ({ ...s, titleSponsorActive: !s.titleSponsorActive }))}>
                    {sponsors.titleSponsorActive ? 'ON' : 'OFF'}
                  </button>
                </div>
                <input className="tt-adm-input" value={sponsors.titleSponsorName} onChange={(e) => setSponsors((s) => ({ ...s, titleSponsorName: e.target.value }))} placeholder="Nombre del Sponsor Principal" />

                <div className="tt-adm-toggle-line">
                  <div><strong>Auspiciador Clima en Sedes</strong><small>Acompaña el estado de canchas en Sedes Oficiales.</small></div>
                  <button type="button" className={`tt-adm-chip ${sponsors.weatherSponsorActive ? 'is-emerald' : ''}`} onClick={() => setSponsors((s) => ({ ...s, weatherSponsorActive: !s.weatherSponsorActive }))}>
                    {sponsors.weatherSponsorActive ? 'ON' : 'OFF'}
                  </button>
                </div>
                <input className="tt-adm-input" value={sponsors.weatherSponsorName} onChange={(e) => setSponsors((s) => ({ ...s, weatherSponsorName: e.target.value }))} placeholder="Nombre del Sponsor de Clima" />

                <label className="tt-adm-lbl">
                  <span>Premio del Sorteo Mensual (Pro Shop)</span>
                  <input className="tt-adm-input" value={sponsors.rafflePrizeText} onChange={(e) => setSponsors((s) => ({ ...s, rafflePrizeText: e.target.value }))} />
                </label>
                <button type="submit" className="tt-adm-btn-emerald">Guardar Patrocinadores</button>
              </form>
            )}

            {/* 6. LIBRO DE RECLAMACIONES */}
            {activeTab === 'reclamaciones' && (
              <div className="tt-adm-panel">
                <span className="tt-adm-kicker">LIBRO DE RECLAMACIONES (PLAZO 15 DÍAS HÁBILES)</span>
                {allComplaints.length === 0 ? (
                  <p className="tt-adm-empty">No hay hojas de reclamación registradas.</p>
                ) : (
                  <div className="tt-adm-list">
                    {allComplaints.map((c) => (
                      <div key={c.code} className="tt-adm-account-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <strong style={{ color: '#F3DC9B' }}>{c.code} · {c.type || c.claimType}</strong>
                          <span className={c.status === 'ATENDIDA' ? 'tt-adm-tag-emerald' : 'tt-adm-tag-gold'}>{c.status}</span>
                        </div>
                        <small>{c.fullName} ({c.docType} {c.docNumber})</small>
                        <p className="tt-adm-subcopy">{c.detail}</p>
                        <div className="tt-adm-acc-actions">
                          <button
                            type="button"
                            className="tt-adm-chip is-emerald"
                            onClick={() => {
                              const next = allComplaints.map((x) =>
                                x.code === c.code ? { ...x, status: x.status === 'ATENDIDA' ? 'REGISTRADA' : 'ATENDIDA' } : x
                              );
                              setLocalComplaints(next);
                              try {
                                window.localStorage.setItem(ADMIN_SUITE_EDITABLE_CONFIG.complaintsStorageKey, JSON.stringify(next));
                              } catch {
                                // continuar
                              }
                            }}
                          >
                            {c.status === 'ATENDIDA' ? 'Reabrir' : 'Marcar Atendida'}
                          </button>
                          {c.phone && (
                            <a
                              href={buildWhatsappLink(c.phone, `Hola ${c.fullName}, te contactamos de TOTAL TENIS respecto a tu Hoja de Reclamación ${c.code}.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tt-adm-chip"
                              style={{ textDecoration: 'none' }}
                            >
                              WhatsApp ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. RESPALDO EXCEL + PURGA DE CUENTAS DEMO */}
            {activeTab === 'respaldo' && (
              <div className="tt-adm-stack">
                <div className={`tt-adm-panel ${storageStats.isWarning ? 'is-alert' : ''}`}>
                  <span className="tt-adm-kicker">CAPACIDAD OPERATIVA</span>
                  <div className="tt-adm-mem-row"><span>Jugadores</span><strong>{storageStats.pCount} / {ADMIN_SUITE_EDITABLE_CONFIG.maxPlayersCapacity.toLocaleString('es-PE')}</strong></div>
                  <div className="tt-adm-bar"><div style={{ width: `${Math.max(2, storageStats.pPct)}%` }} /></div>
                  <div className="tt-adm-mem-row" style={{ marginTop: 9 }}><span>Partidos</span><strong>{storageStats.mCount} / {ADMIN_SUITE_EDITABLE_CONFIG.maxMatchesBuffer.toLocaleString('es-PE')}</strong></div>
                  <div className="tt-adm-bar"><div style={{ width: `${Math.max(2, storageStats.mPct)}%` }} /></div>
                </div>

                {/* Purga de cuentas demo justo antes de abrir la Beta */}
                {onAdminPurgeDemoPlayers && (
                  <div className="tt-adm-panel is-highlight tt-adm-form-stack">
                    <span className="tt-adm-kicker">LIMPIEZA PRE-LANZAMIENTO BETA</span>
                    <p className="tt-adm-subcopy">
                      Hay <b>{demoCount}</b> cuentas de prueba (<code>is_demo = true</code>). Úsalo justo antes de invitar a los primeros jugadores reales.
                    </p>
                    <button
                      type="button"
                      disabled={demoCount === 0}
                      className="tt-adm-btn-danger"
                      onClick={handlePurgeDemosClick}
                    >
                      {demoCount === 0
                        ? '✓ Sin cuentas de prueba activas'
                        : confirmPurgeDemo
                        ? `Confirmar: borrar ${demoCount} cuentas demo ahora`
                        : `Purgar ${demoCount} Cuentas Demo`}
                    </button>
                  </div>
                )}

                <div className="tt-adm-panel tt-adm-form-stack">
                  <span className="tt-adm-kicker">EXPORTACIÓN EXCEL (.CSV UTF-8)</span>
                  <div className="tt-adm-grid-2">
                    <button type="button" className="tt-adm-btn-emerald" onClick={handleExportPlayersExcel}>Excel Jugadores</button>
                    <button type="button" className="tt-adm-btn-gold" onClick={handleExportMatchesExcel}>Excel Partidos</button>
                  </div>
                  <button
                    type="button"
                    className="tt-adm-btn-danger"
                    disabled={!hasDownloadedBackup}
                    onClick={() => {
                      triggerHaptic('warning');
                      if (onAdminPurgeArchivedMatches) onAdminPurgeArchivedMatches();
                      if (onNotify) onNotify('Partidos finalizados archivados liberados.', 'success');
                    }}
                  >
                    {hasDownloadedBackup ? 'Liberar Partidos Archivados' : 'Descarga un Excel primero para liberar historial'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tt-adm-shell {
          border-radius: 20px; padding: 14px;
          background: linear-gradient(180deg, #1E0734 0%, #120321 100%);
          color: #FAF9F5; border: 1px solid rgba(0, 220, 125, 0.35);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
          display: flex; flex-direction: column; gap: 13px;
        }
        .tt-adm-shell * { box-sizing: border-box; }
        .tt-adm-lock-screen { padding: 18px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 11px; }
        .tt-adm-lock-icon { width: 64px; height: 64px; border-radius: 18px; background: rgba(0, 220, 125, 0.14); border: 1.5px solid rgba(0, 220, 125, 0.5); display: flex; align-items: center; justify-content: center; }
        .tt-adm-lock-screen h3 { margin: 0; font-family: var(--tt-font-display); font-size: 1.38rem; }
        .tt-adm-lock-screen p { margin: 0; font-size: 0.78rem; color: rgba(250, 249, 245, 0.76); max-width: 360px; }
        .tt-adm-pin-input { width: 170px; height: 50px; border-radius: 14px; background: rgba(250, 249, 245, 0.1); border: 1.5px solid #00DC7D; color: #FAF9F5; text-align: center; font-size: 1.6rem; letter-spacing: 0.35em; font-weight: 900; outline: none; }
        .tt-adm-pin-error { font-size: 0.75rem; font-weight: 800; color: #FCA5A5; }

        .tt-adm-body, .tt-adm-stack, .tt-adm-form-stack, .tt-adm-list { display: flex; flex-direction: column; gap: 10px; }
        .tt-adm-kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        @media (min-width: 560px) { .tt-adm-kpi-grid { grid-template-columns: repeat(4, 1fr); } }
        .tt-adm-kpi-grid > div { padding: 9px 8px; border-radius: 14px; background: rgba(250, 249, 245, 0.07); border: 1px solid rgba(250, 249, 245, 0.12); text-align: center; }
        .tt-adm-kpi-grid span { display: block; font-size: 0.56rem; font-weight: 900; letter-spacing: 0.08em; color: rgba(250, 249, 245, 0.65); }
        .tt-adm-kpi-grid strong { display: block; font-family: var(--tt-font-display); font-size: 1.42rem; line-height: 1.05; }
        .tt-adm-kpi-grid .is-gold strong { color: #F3DC9B; }
        .tt-adm-kpi-grid .is-emerald strong { color: #00DC7D; }
        .tt-adm-kpi-grid small { font-size: 0.63rem; color: rgba(250, 249, 245, 0.66); }

        .tt-adm-tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .tt-adm-tabs::-webkit-scrollbar { display: none; }
        .tt-adm-tab { flex-shrink: 0; min-height: 35px; padding: 0 12px; border-radius: 999px; background: rgba(250, 249, 245, 0.08); border: 1px solid rgba(250, 249, 245, 0.14); color: rgba(250, 249, 245, 0.8); font-size: 0.72rem; font-weight: 800; }
        .tt-adm-tab.is-active { background: #00DC7D; border-color: #00DC7D; color: #10021E; font-weight: 900; }

        .tt-adm-panel { padding: 13px; border-radius: 16px; background: rgba(250, 249, 245, 0.06); border: 1px solid rgba(250, 249, 245, 0.12); }
        .tt-adm-panel.is-highlight { border-color: rgba(229, 193, 108, 0.48); background: rgba(229, 193, 108, 0.07); }
        .tt-adm-panel.is-alert { border-color: #F87171; background: rgba(248, 113, 113, 0.12); }
        .tt-adm-kicker { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.09em; color: #00DC7D; margin-bottom: 8px; }
        .tt-adm-empty, .tt-adm-subcopy { margin: 0; font-size: 0.75rem; line-height: 1.42; color: rgba(250, 249, 245, 0.76); }

        .tt-adm-seasons-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .tt-adm-q-tile { padding: 8px 4px; border-radius: 12px; background: rgba(16, 4, 30, 0.7); border: 1px solid rgba(255, 255, 255, 0.12); text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .tt-adm-q-tile.is-cur { border-color: #00DC7D; background: rgba(0, 220, 125, 0.14); }
        .tt-adm-q-tile.is-done { border-color: rgba(229, 193, 108, 0.42); }
        .tt-adm-q-tile strong { font-size: 0.82rem; }
        .tt-adm-q-tile span { font-size: 0.58rem; opacity: 0.78; }
        .tt-adm-q-tile small { font-size: 0.56rem; font-weight: 800; color: #7CF5C0; }

        .tt-adm-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 10px; border-radius: 12px; background: rgba(18, 3, 33, 0.65); border: 1px solid rgba(250, 249, 245, 0.1); }
        .tt-adm-row strong { display: block; font-size: 0.82rem; }
        .tt-adm-row small { display: block; font-size: 0.69rem; color: rgba(250, 249, 245, 0.68); }

        .tt-adm-account-card { padding: 11px; border-radius: 14px; background: rgba(18, 3, 33, 0.7); border: 1px solid rgba(250, 249, 245, 0.12); display: flex; flex-direction: column; gap: 8px; }
        .tt-adm-account-card.is-paused { opacity: 0.68; border-style: dashed; }
        .tt-adm-acc-top { display: flex; align-items: center; gap: 10px; }
        .tt-adm-acc-top small { display: block; font-size: 0.68rem; color: rgba(250, 249, 245, 0.7); }
        .tt-adm-acc-actions { display: flex; flex-wrap: wrap; gap: 6px; }
        .tt-adm-edit-box { display: flex; flex-direction: column; gap: 8px; }

        .tt-adm-input { width: 100%; min-height: 41px; padding: 0 11px; border-radius: 12px; background: #140324; border: 1px solid rgba(250, 249, 245, 0.22); color: #FAF9F5; font-size: 16px; }
        .tt-adm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tt-adm-grid-3 { display: grid; grid-template-columns: 0.8fr 1.3fr 0.9fr; gap: 7px; }
        @media (max-width: 480px) { .tt-adm-grid-3 { grid-template-columns: 1fr; } }
        .tt-adm-lbl { display: flex; flex-direction: column; gap: 4px; font-size: 0.7rem; font-weight: 800; color: rgba(250, 249, 245, 0.78); }
        .tt-adm-toggle-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .tt-adm-toggle-line strong { display: block; font-size: 0.8rem; }
        .tt-adm-toggle-line small { display: block; font-size: 0.68rem; color: rgba(250, 249, 245, 0.68); }

        .tt-adm-btn-emerald, .tt-adm-btn-gold, .tt-adm-btn-ghost, .tt-adm-btn-danger {
          min-height: 41px; padding: 0 14px; border-radius: 12px; font-size: 0.77rem; font-weight: 900;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: transform 160ms cubic-bezier(0.22, 1.38, 0.36, 1);
        }
        .tt-adm-btn-emerald:active, .tt-adm-btn-gold:active, .tt-adm-btn-ghost:active, .tt-adm-btn-danger:active { transform: scale(0.95); }
        .tt-adm-btn-emerald.is-sm, .tt-adm-btn-gold.is-sm, .tt-adm-btn-ghost.is-sm, .tt-adm-btn-danger.is-sm { min-height: 35px; padding: 0 11px; font-size: 0.72rem; }
        .tt-adm-btn-emerald { background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%); color: #10021E; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42); }
        .tt-adm-btn-gold { background: linear-gradient(135deg, #F5E1A4 0%, #CCA046 100%); color: #1A1102; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48); }
        .tt-adm-btn-ghost { background: rgba(250, 249, 245, 0.12); color: #FAF9F5; }
        .tt-adm-btn-danger { background: rgba(248, 113, 113, 0.18); border: 1px solid rgba(248, 113, 113, 0.48); color: #FECACA; }
        .tt-adm-btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }

        .tt-adm-chip { padding: 5px 10px; border-radius: 999px; background: rgba(250, 249, 245, 0.1); border: 1px solid rgba(250, 249, 245, 0.18); color: #FAF9F5; font-size: 0.68rem; font-weight: 800; }
        .tt-adm-chip.is-emerald { background: rgba(0, 220, 125, 0.18); border-color: #00DC7D; color: #7CF5C0; }
        .tt-adm-chip.is-gold { background: rgba(229, 193, 108, 0.2); border-color: #E5C16C; color: #F3DC9B; }
        .tt-adm-chip.is-danger { background: rgba(248, 113, 113, 0.18); border-color: #F87171; color: #FECACA; }

        .tt-adm-tag-gold, .tt-adm-tag-emerald, .tt-adm-tag-red { padding: 2px 7px; border-radius: 999px; font-size: 0.56rem; font-weight: 900; }
        .tt-adm-tag-gold { background: #E5C16C; color: #1A1102; }
        .tt-adm-tag-emerald { background: #00DC7D; color: #10021E; }
        .tt-adm-tag-red { background: #EF4444; color: #FFFFFF; }

        .tt-adm-mem-row { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px; }
        .tt-adm-bar { height: 7px; border-radius: 999px; background: rgba(250, 249, 245, 0.14); overflow: hidden; }
        .tt-adm-bar > div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00DC7D 0%, #E5C16C 100%); }
      `}</style>
    </ModalPortal>
  );
}
