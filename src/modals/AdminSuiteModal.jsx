import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ASSETS,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import { INITIAL_CLUBS, getCategoryByPoints } from '../data/playersAndClubsData';
import {
  applyCategoryFloorResetToPlayers,
  buildWhatsappLink,
  getCategoryFloorPoints,
} from '../utils/cloudService';
import { AdminSponsorsManager } from '../components/SponsorPlacements';

/* ==========================================================================
   CONFIGURACIÓN DEL PANEL ADMIN (SIN PIN EN FRONTEND · SE VALIDA EN SERVIDOR)
   El PIN maestro vive únicamente en Vercel (Environment Variable: ADMIN_MASTER_PIN).
   ========================================================================== */
export const ADMIN_SUITE_EDITABLE_CONFIG = {
  vipMonthlyBonusGems: 200,
  maxPlayersCapacity: 10000,
  maxMatchesBuffer: 10000,
  memoryAlertThresholdPct: 75,
  complaintsStorageKey: 'tt_indecopi_complaints_v1',
  sponsorsStorageKey: 'tt_admin_sponsors_v1',
  sessionPinKey: 'tt_admin_verified_pin_v1',
};

const ADMIN_TABS = [
  { id: 'pagos', label: 'Pagos & VIP' },
  { id: 'cuentas', label: 'Cuentas & Auth' },
  { id: 'temporadas', label: 'Temporadas' },
  { id: 'clubshop', label: 'Club & Shop' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'reclamaciones', label: 'Libro Rec.' },
  { id: 'respaldo', label: 'Respaldo' },
];

const ECOSYSTEM_DASHBOARDS = [
  { id: 'r2', label: 'Cloudflare R2', hint: '10 GB gratis · $0 tráfico', url: 'https://dash.cloudflare.com/' },
  { id: 'vercel', label: 'Vercel Usage', hint: '10 GB builds · 100 GB red', url: 'https://vercel.com/dashboard' },
  { id: 'supa', label: 'Supabase BD', hint: '500 MB SQL · 1 GB fotos', url: 'https://supabase.com/dashboard' },
  { id: 'push', label: 'OneSignal', hint: 'Push iOS / Android', url: 'https://dashboard.onesignal.com/' },
];

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function readSessionAdminPin() {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(ADMIN_SUITE_EDITABLE_CONFIG.sessionPinKey) || '';
  } catch {
    return '';
  }
}

function saveSessionAdminPin(pin) {
  if (typeof window === 'undefined') return;
  try {
    if (pin) {
      window.sessionStorage.setItem(ADMIN_SUITE_EDITABLE_CONFIG.sessionPinKey, pin);
    } else {
      window.sessionStorage.removeItem(ADMIN_SUITE_EDITABLE_CONFIG.sessionPinKey);
    }
  } catch {
    // continuar
  }
}

/* ==========================================================================
   MOTOR DE CALENDARIO DE TEMPORADAS (~90 DÍAS + MANDO MANUAL + EXCEPCIONES)
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

  const activeEnd = addDaysIso(startIso, safeDays - 1);
  updated[targetIdx] = {
    ...updated[targetIdx],
    startDate: startIso,
    endDate: activeEnd,
    period: formatShortPeriod(startIso, activeEnd),
    locked: false,
    closedAt: null,
  };

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
    curNum === 1
      ? Math.max(2025, (Number(baseSnap?.year) || new Date().getFullYear()) - 1)
      : baseSnap?.year || new Date().getFullYear();

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
   COMPONENTE PRINCIPAL: AdminSuiteModal
   (PIN BLINDADO EN SERVIDOR + CENTRO DE RECUPERACIÓN AUTH + ACABADO 3D TÁCTIL)
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
  onAdminResetFloorPoints,
  onAdminResolveDispute,
  onAdminToggleClubActive,
  onAdminSaveSponsors,
  onPreviewSponsorInterstitial,
  onAdminPurgeArchivedMatches,
  onNotify,
}) {
  const [verifiedPin, setVerifiedPin] = useState(() => readSessionAdminPin());
  const [isUnlocked, setIsUnlocked] = useState(() => Boolean(isUnlockedInitially || readSessionAdminPin()));
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [inlinePinInput, setInlinePinInput] = useState('');
  const [activeTab, setActiveTab] = useState('pagos');

  // Cuentas, Directorio Auth y Recuperación Real
  const [accountSearch, setAccountSearch] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editGems, setEditGems] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [authDirectory, setAuthDirectory] = useState({
    loading: false,
    error: '',
    users: [],
    synced: false,
  });
  const [accountBusyId, setAccountBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmOrphanAuthId, setConfirmOrphanAuthId] = useState(null);

  // Control Total de Temporadas + Excepciones ("Modo Dios")
  const normalizedSeasons = useMemo(() => ensureFourSeasons(seasonSnapshots), [seasonSnapshots]);
  const [calSeasonNum, setCalSeasonNum] = useState(Number(seasonSnapshots?.currentSeason) || 4);
  const [calStartDate, setCalStartDate] = useState(getTodayIsoPeru());
  const [calDurationDays, setCalDurationDays] = useState(Number(seasonSnapshots?.durationDays) || 90);
  const [calAutoAdvance, setCalAutoAdvance] = useState(seasonSnapshots?.autoAdvance !== false);
  const [closeWithFloorReset, setCloseWithFloorReset] = useState(true);
  const [confirmFloorReset, setConfirmFloorReset] = useState(false);
  const [confirmClearSnap, setConfirmClearSnap] = useState(false);
  const [isResettingPoints, setIsResettingPoints] = useState(false);

  // Monitor del Ecosistema (Cloudflare R2 en Vivo)
  const [r2Stats, setR2Stats] = useState({ loading: false, error: '', data: null });

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

  /* ------------------------------------------------------------------------
     CONEXIÓN SEGURA CON /api/admin-accounts (SIN EXPONER PIN NI LLAVES)
     ------------------------------------------------------------------------ */
  const callAdminAccountsApi = useCallback(
    async (action, payload = {}, pinOverride = null) => {
      const pinToUse = String(pinOverride !== null ? pinOverride : verifiedPin || '').trim();
      if (!pinToUse) {
        throw new Error('Ingresa tu PIN maestro en la barra superior para operar cuentas en Auth.');
      }

      const res = await fetch('/api/admin-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin: pinToUse,
          action,
          ...payload,
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setVerifiedPin('');
        saveSessionAdminPin('');
        throw new Error(json?.error || 'PIN de administrador incorrecto.');
      }
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Error del servidor (${res.status}).`);
      }
      return json;
    },
    [verifiedPin]
  );

  const fetchAuthDirectory = useCallback(
    async (pinOverride = null) => {
      const pinToUse = String(pinOverride !== null ? pinOverride : verifiedPin || '').trim();
      if (!pinToUse) return false;
      setAuthDirectory((prev) => ({ ...prev, loading: true, error: '' }));
      try {
        const res = await callAdminAccountsApi('list_auth_users', {}, pinToUse);
        setAuthDirectory({
          loading: false,
          error: '',
          users: Array.isArray(res.users) ? res.users : [],
          synced: true,
        });
        return true;
      } catch (err) {
        setAuthDirectory((prev) => ({
          ...prev,
          loading: false,
          error: err?.message || 'No se pudo consultar el directorio de Auth.',
        }));
        return false;
      }
    },
    [callAdminAccountsApi, verifiedPin]
  );

  const fetchR2LiveStats = useCallback(async () => {
    setR2Stats((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await fetch('/api/r2-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Error ${res.status} leyendo Cloudflare R2.`);
      }
      setR2Stats({ loading: false, error: '', data: json });
    } catch (err) {
      setR2Stats({
        loading: false,
        error: err?.message || 'No se pudo consultar Cloudflare R2 ahora.',
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const savedPin = readSessionAdminPin();
    if (savedPin) setVerifiedPin(savedPin);
    if (isUnlockedInitially || savedPin) setIsUnlocked(true);

    setPinInput('');
    setPinError('');
    setConfirmFloorReset(false);
    setConfirmClearSnap(false);
    setConfirmPurgeDemo(false);
    setConfirmDeleteId(null);
    setConfirmOrphanAuthId(null);

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

  useEffect(() => {
    if (isOpen && isUnlocked && activeTab === 'respaldo') {
      fetchR2LiveStats();
    }
  }, [isOpen, isUnlocked, activeTab, fetchR2LiveStats]);

  useEffect(() => {
    if (isOpen && isUnlocked && activeTab === 'cuentas' && verifiedPin && !authDirectory.synced) {
      fetchAuthDirectory(verifiedPin);
    }
  }, [isOpen, isUnlocked, activeTab, verifiedPin, authDirectory.synced, fetchAuthDirectory]);

  /* ------------------------------------------------------------------------
     DERIVADOS DE ESTADO Y CRUCE CON SUPABASE AUTH
     ------------------------------------------------------------------------ */
  const playersMap = useMemo(() => {
    const m = {};
    (players || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [players]);

  const { authByIdMap, authByEmailMap, orphanAuthUsers } = useMemo(() => {
    const byId = {};
    const byEmail = {};
    (authDirectory.users || []).forEach((u) => {
      if (u.authId) byId[u.authId] = u;
      if (u.email) byEmail[String(u.email).trim().toLowerCase()] = u;
    });

    const knownAuthIds = new Set();
    const knownEmails = new Set();
    (players || []).forEach((p) => {
      if (p.authId) knownAuthIds.add(String(p.authId));
      if (p.email) knownEmails.add(String(p.email).trim().toLowerCase());
    });

    const orphans = (authDirectory.users || []).filter((u) => {
      const normEmail = String(u.email || '').trim().toLowerCase();
      return !knownAuthIds.has(String(u.authId)) && (!normEmail || !knownEmails.has(normEmail));
    });

    return { authByIdMap: byId, authByEmailMap: byEmail, orphanAuthUsers: orphans };
  }, [authDirectory.users, players]);

  const demoCount = useMemo(() => (players || []).filter((p) => p.isDemo).length, [players]);
  const minorsCount = useMemo(() => (players || []).filter((p) => p.isTutelado).length, [players]);

  const floorResetImpactCount = useMemo(
    () =>
      (players || []).filter(
        (p) => !p.isTutorOnly && Number(p.points || 0) !== getCategoryFloorPoints(p.points)
      ).length,
    [players]
  );

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
        const authUser =
          (p.authId && authByIdMap[p.authId]) ||
          (p.email && authByEmailMap[String(p.email).trim().toLowerCase()]) ||
          null;
        return `${p.name || ''} ${p.email || ''} ${authUser?.email || ''} ${p.whatsapp || ''} ${
          p.credentialId || ''
        } ${p.tutorName || ''}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
  }, [players, accountSearch, authByIdMap, authByEmailMap]);

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

  /* ------------------------------------------------------------------------
     DESBLOQUEO SEGURO CONTRA EL SERVIDOR (ADMIN_MASTER_PIN EN VERCEL)
     ------------------------------------------------------------------------ */
  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    const candidate = pinInput.trim();
    if (!candidate || isVerifyingPin) return;

    setIsVerifyingPin(true);
    setPinError('');
    try {
      const res = await callAdminAccountsApi('list_auth_users', {}, candidate);
      setVerifiedPin(candidate);
      saveSessionAdminPin(candidate);
      setAuthDirectory({
        loading: false,
        error: '',
        users: Array.isArray(res.users) ? res.users : [],
        synced: true,
      });
      setIsUnlocked(true);
      setPinInput('');
      triggerHaptic('success');
      if (onUnlockAdminSession) onUnlockAdminSession(true);
      if (onNotify) onNotify('Suite Maestra Admin desbloqueada de forma segura.', 'success');
    } catch (err) {
      triggerHaptic('warning');
      setPinError(err?.message || 'PIN incorrecto. Acceso exclusivo del organizador.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleVerifyServerPinInline = async (e) => {
    e.preventDefault();
    const candidate = inlinePinInput.trim();
    if (!candidate || isVerifyingPin) return;

    setIsVerifyingPin(true);
    try {
      const ok = await fetchAuthDirectory(candidate);
      if (ok) {
        setVerifiedPin(candidate);
        saveSessionAdminPin(candidate);
        setInlinePinInput('');
        triggerHaptic('success');
        if (onNotify) onNotify('Conexión segura con Supabase Auth activada.', 'success');
      } else {
        triggerHaptic('warning');
        if (onNotify) onNotify('PIN maestro incorrecto.', 'warning');
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

  /* ------------------------------------------------------------------------
     ACCIONES DE RECUPERACIÓN DE CUENTAS, CORREOS Y BORRADO TOTAL (AUTH + PERFIL)
     ------------------------------------------------------------------------ */
  const handleCopyEmail = async (email) => {
    if (!email) return;
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(email);
      if (onNotify) onNotify(`Correo copiado: ${email}`, 'success');
    } catch {
      if (onNotify) onNotify(`Correo: ${email}`, 'info');
    }
  };

  const handleRemindEmailWhatsapp = (p, resolvedEmail) => {
    if (!p?.whatsapp) {
      if (onNotify) onNotify('Este jugador no tiene WhatsApp registrado.', 'warning');
      return;
    }
    triggerHaptic('medium');
    const msg = resolvedEmail
      ? `Hola ${p.name.split(' ')[0]}, te escribimos de soporte TOTAL TENIS 🎾\n\nEl correo con el que está registrada tu cuenta es:\n📧 ${resolvedEmail}\n\nPuedes ingresar aquí: https://huancayo-tenis.vercel.app (si olvidaste tu clave avísanos y te enviamos un enlace directo).`
      : `Hola ${p.name.split(' ')[0]}, te escribimos de soporte TOTAL TENIS 🎾 para ayudarte a recuperar el acceso a tu cuenta.`;
    window.open(buildWhatsappLink(p.whatsapp, msg), '_blank', 'noopener,noreferrer');
  };

  const handleSendResetEmail = async (p, resolvedEmail) => {
    if (!resolvedEmail) {
      if (onNotify) onNotify('Esta cuenta no tiene correo registrado.', 'warning');
      return;
    }
    setAccountBusyId(`reset-mail-${p.id}`);
    try {
      const res = await callAdminAccountsApi('send_reset_email', { email: resolvedEmail });
      triggerHaptic('success');
      if (onNotify) onNotify(res.message || `Correo de recuperación enviado a ${resolvedEmail}.`, 'success');
    } catch (err) {
      triggerHaptic('warning');
      if (onNotify) onNotify(err?.message || 'No se pudo enviar el correo de recuperación.', 'warning');
    } finally {
      setAccountBusyId(null);
    }
  };

  const handleSendRecoveryWhatsapp = async (p, resolvedEmail) => {
    if (!resolvedEmail) {
      if (onNotify) onNotify('Esta cuenta no tiene correo registrado en Auth.', 'warning');
      return;
    }
    setAccountBusyId(`reset-wa-${p.id}`);
    try {
      const res = await callAdminAccountsApi('generate_recovery_link', { email: resolvedEmail });
      const link = res.actionLink;
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        // continuar
      }
      triggerHaptic('success');
      if (p.whatsapp) {
        const msg = `Hola ${p.name.split(' ')[0]} 🎾 Aquí tienes tu enlace privado de TOTAL TENIS para entrar y crear una nueva contraseña (correo: ${resolvedEmail}):\n\n${link}`;
        window.open(buildWhatsappLink(p.whatsapp, msg), '_blank', 'noopener,noreferrer');
        if (onNotify) onNotify('Enlace copiado y listo para enviar por WhatsApp.', 'success');
      } else {
        if (onNotify) onNotify('Enlace de recuperación copiado al portapapeles.', 'success');
      }
    } catch (err) {
      triggerHaptic('warning');
      if (onNotify) onNotify(err?.message || 'No se pudo generar el enlace de recuperación.', 'warning');
    } finally {
      setAccountBusyId(null);
    }
  };

  const openEditAccount = (p, resolvedEmail) => {
    triggerHaptic('light');
    setEditingPlayerId(p.id);
    setEditEmail(resolvedEmail || p.email || '');
    setEditPoints(String(p.points ?? 1000));
    setEditGems(String(p.gems ?? 0));
    setEditNewPassword('');
  };

  const handleSaveAccountEdit = async (p, authUser) => {
    const cleanEmail = editEmail.trim().toLowerCase();
    const cleanPass = editNewPassword.trim();
    const emailChanged = cleanEmail && cleanEmail !== String(p.email || '').trim().toLowerCase();

    if (cleanPass && cleanPass.length < 6) {
      triggerHaptic('warning');
      if (onNotify) onNotify('La nueva contraseña debe tener mínimo 6 caracteres.', 'warning');
      return;
    }

    setAccountBusyId(`save-${p.id}`);
    try {
      if (verifiedPin && (emailChanged || cleanPass)) {
        await callAdminAccountsApi('update_auth_account', {
          profileId: p.id,
          authId: p.authId || authUser?.authId || '',
          currentEmail: authUser?.email || p.email || '',
          newEmail: emailChanged ? cleanEmail : '',
          newPassword: cleanPass || '',
        });
        await fetchAuthDirectory(verifiedPin);
      }

      if (onAdminUpdatePlayer) {
        await onAdminUpdatePlayer(p.id, {
          email: cleanEmail,
          points: Math.max(0, Number(editPoints) || 0),
          gems: Math.max(0, Number(editGems) || 0),
        });
      }

      triggerHaptic('success');
      setEditingPlayerId(null);
      setEditNewPassword('');
      if (onNotify) {
        onNotify(
          cleanPass
            ? `Ficha y nueva contraseña real de ${p.name} actualizadas.`
            : `Ficha de ${p.name} actualizada en vivo.`,
          'success'
        );
      }
    } catch (err) {
      triggerHaptic('warning');
      if (onNotify) onNotify(err?.message || 'No se pudo actualizar la cuenta.', 'warning');
    } finally {
      setAccountBusyId(null);
    }
  };

  const handleFullDeleteAccount = async (p, authUser) => {
    if (confirmDeleteId !== p.id) {
      triggerHaptic('warning');
      setConfirmDeleteId(p.id);
      return;
    }
    setConfirmDeleteId(null);
    setAccountBusyId(`del-${p.id}`);
    try {
      let authCleaned = false;
      if (verifiedPin) {
        const res = await callAdminAccountsApi('delete_account_full', {
          profileId: p.id,
          authId: p.authId || authUser?.authId || '',
          email: authUser?.email || p.email || '',
        });
        authCleaned = Boolean(res.authDeleted);
        await fetchAuthDirectory(verifiedPin);
      }
      if (onAdminDeletePlayer) {
        await onAdminDeletePlayer(p.id);
      }
      triggerHaptic('success');
      if (onNotify) {
        onNotify(
          authCleaned
            ? `${p.name} eliminado por completo (Auth + Perfil). Su correo ya quedó libre.`
            : `Perfil de ${p.name} eliminado.`,
          'success'
        );
      }
    } catch (err) {
      triggerHaptic('warning');
      if (onNotify) onNotify(err?.message || 'Error eliminando la cuenta completa.', 'warning');
    } finally {
      setAccountBusyId(null);
    }
  };

  const handleDeleteOrphanAuth = async (orphan) => {
    if (confirmOrphanAuthId !== orphan.authId) {
      triggerHaptic('warning');
      setConfirmOrphanAuthId(orphan.authId);
      return;
    }
    setConfirmOrphanAuthId(null);
    setAccountBusyId(`orphan-${orphan.authId}`);
    try {
      await callAdminAccountsApi('delete_account_full', {
        authId: orphan.authId,
        email: orphan.email,
      });
      await fetchAuthDirectory(verifiedPin);
      triggerHaptic('success');
      if (onNotify) onNotify(`Correo liberado en Auth: ${orphan.email}`, 'success');
    } catch (err) {
      triggerHaptic('warning');
      if (onNotify) onNotify(err?.message || 'No se pudo liberar ese correo.', 'warning');
    } finally {
      setAccountBusyId(null);
    }
  };

  /* ------------------------------------------------------------------------
     ACCIONES TEMPORADAS + RESET REAL AL PISO DE CATEGORÍA (300+)
     ------------------------------------------------------------------------ */
  const executeFloorReset = async () => {
    setIsResettingPoints(true);
    try {
      if (onAdminResetFloorPoints) {
        await onAdminResetFloorPoints();
      } else {
        await applyCategoryFloorResetToPlayers(players);
      }
      return true;
    } catch (err) {
      console.error('[TOTAL TENIS] Error aplicando reset al piso:', err);
      if (onNotify) onNotify('No se pudo completar el reset al piso en la nube.', 'warning');
      return false;
    } finally {
      setIsResettingPoints(false);
    }
  };

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
        `Calendario guardado: Temporada ${nextSnap.currentSeason} inicia ${calStartDate} (${nextSnap.durationDays} días). Cierre automático 00:00 Perú: ${
          calAutoAdvance ? 'ON' : 'OFF'
        }.`,
        'success'
      );
    }
  };

  const handleCloseCurrentSeason = async () => {
    if (isResettingPoints) return;
    const nextSnap = closeActiveSeasonSnapshot(seasonSnapshots, players);
    if (onAdminCloseSeason) await onAdminCloseSeason(nextSnap);

    if (closeWithFloorReset) {
      await executeFloorReset();
    }

    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        closeWithFloorReset
          ? `Temporada cerrada (foto Master Top 8 guardada). Puntos ajustados al piso de categoría y Temporada ${nextSnap.currentSeason} abierta.`
          : `Temporada cerrada sin modificar puntos. Ahora está activa T${nextSnap.currentSeason} (${nextSnap.year}).`,
        'success'
      );
    }
  };

  const handleManualFloorResetNow = async () => {
    if (isResettingPoints) return;
    if (!confirmFloorReset) {
      triggerHaptic('warning');
      setConfirmFloorReset(true);
      return;
    }
    setConfirmFloorReset(false);
    const ok = await executeFloorReset();
    if (ok) {
      triggerHaptic('success');
      if (onNotify) {
        onNotify(
          `Reset al Piso aplicado: ${floorResetImpactCount} jugadores bajaron al piso de su categoría (300 / 1,000 / 2,000 / 3,000 / 4,000 / 5,000).`,
          'success'
        );
      }
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

  const handleClearCurrentSnapshot = () => {
    if (!confirmClearSnap) {
      triggerHaptic('warning');
      setConfirmClearSnap(true);
      return;
    }
    const nextSnap = resetCurrentSeasonSnapshot(seasonSnapshots);
    if (onAdminCloseSeason) onAdminCloseSeason(nextSnap);
    setConfirmClearSnap(false);
    triggerHaptic('success');
    if (onNotify) {
      onNotify(`Foto congelada de T${nextSnap.currentSeason} limpiada sin alterar el ELO vivo.`, 'info');
    }
  };

  /* Acciones Torneos, Sponsors y Excel */
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
      ['Credencial', 'Nombre', 'Tipo_Cuenta', 'Tutor', 'Correo', 'WhatsApp', 'Edad', 'Rama', 'Club', 'Categoria', 'Puntos', 'V', 'D', 'Gemas', 'Plan', 'Estado'],
      (players || []).map((p) => [
        p.credentialId || p.id,
        p.name,
        p.isTutelado ? 'TUTELADA (-18)' : p.isTutorOnly ? 'SOLO TUTOR' : 'TITULAR (+18)',
        p.tutorName || '',
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

  const r2MB = Number(r2Stats.data?.totalMB) || 0;
  const r2GB = (r2MB / 1024).toFixed(2);
  const r2Pct = Number(r2Stats.data?.pct) || 0;
  const r2Status = r2Stats.data?.blocked
    ? { label: 'FRENO 8.5 GB ACTIVO', cls: 'is-danger' }
    : r2MB >= 5120
    ? { label: 'ALERTA > 5 GB', cls: 'is-gold' }
    : { label: 'SEGURO · S/ 0.00', cls: 'is-emerald' };

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
            <p>
              Ingresa tu PIN maestro privado (validado en servidor) para aprobar pagos, recuperar
              cuentas, controlar temporadas y exportar respaldos.
            </p>
            <input
              type="password"
              maxLength={24}
              autoComplete="current-password"
              className="tt-adm-pin-input"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              placeholder="••••••••"
              autoFocus
            />
            {pinError && <span className="tt-adm-pin-error">{pinError}</span>}
            <button
              type="submit"
              disabled={isVerifyingPin || !pinInput.trim()}
              className="tt-adm-btn-emerald"
              style={{ width: '100%', maxWidth: 260 }}
            >
              {isVerifyingPin ? 'Verificando en servidor...' : 'Desbloquear Suite Maestra'}
            </button>
          </form>
        ) : (
          <div className="tt-adm-body">
            <div className="tt-adm-kpi-grid">
              <div>
                <span>JUGADORES</span>
                <strong>{players.length}</strong>
                <small>
                  {demoCount} demo · {minorsCount} juv.
                </small>
              </div>
              <div className="is-gold">
                <span>SOCIOS VIP</span>
                <strong>{players.filter((p) => p.isVip).length}</strong>
                <small>{pendingVipPlayers.length} pendientes</small>
              </div>
              <div className="is-emerald">
                <span>PAGOS TORNEO</span>
                <strong>{pendingTournamentRequests.length}</strong>
                <small>en revisión</small>
              </div>
              <div>
                <span>TEMPORADA</span>
                <strong>T{seasonSnapshots?.currentSeason || 4}</strong>
                <small>{seasonSnapshots?.year || new Date().getFullYear()}</small>
              </div>
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
                            <small>
                              {tournament.name} · Cuota S/ {tournament.entryFee}
                            </small>
                          </div>
                          <button
                            type="button"
                            className="tt-adm-btn-emerald is-sm"
                            onClick={() => {
                              triggerHaptic('success');
                              if (onAdminApproveTournamentPayment) {
                                onAdminApproveTournamentPayment(tournament.id, player.id);
                              }
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
                  <span className="tt-adm-kicker">
                    SOLICITUDES SOCIO VIP (+{ADMIN_SUITE_EDITABLE_CONFIG.vipMonthlyBonusGems} 💎)
                  </span>
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
                              if (onAdminApproveVip) {
                                onAdminApproveVip(
                                  p.id,
                                  true,
                                  ADMIN_SUITE_EDITABLE_CONFIG.vipMonthlyBonusGems
                                );
                              }
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
                          <small>
                            {p.isVip ? 'Socio VIP Activo' : 'Plan Estándar'} ·{' '}
                            {Number(p.gems || 0)} 💎
                          </small>
                        </div>
                        <button
                          type="button"
                          className={p.isVip ? 'tt-adm-btn-ghost is-sm' : 'tt-adm-btn-gold is-sm'}
                          onClick={() => {
                            triggerHaptic('medium');
                            if (onAdminApproveVip) {
                              onAdminApproveVip(
                                p.id,
                                !p.isVip,
                                !p.isVip ? ADMIN_SUITE_EDITABLE_CONFIG.vipMonthlyBonusGems : 0
                              );
                            }
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

            {/* 2. CUENTAS, DIRECTORIO REAL DE CORREOS AUTH & RECUPERACIÓN */}
            {activeTab === 'cuentas' && (
              <div className="tt-adm-stack">
                {!verifiedPin ? (
                  <form
                    onSubmit={handleVerifyServerPinInline}
                    className="tt-adm-panel is-highlight tt-adm-form-stack"
                  >
                    <span className="tt-adm-kicker" style={{ margin: 0, color: '#F3DC9B' }}>
                      CONECTAR CON SUPABASE AUTH (CORREOS, RECUPERACIÓN Y BORRADO TOTAL)
                    </span>
                    <p className="tt-adm-subcopy">
                      Confirma tu PIN maestro privado de Vercel para leer correos reales en Auth,
                      enviar enlaces de recuperación y borrar cuentas sin dejar correos atrapados.
                    </p>
                    <div className="tt-adm-inline-pin-row">
                      <input
                        type="password"
                        maxLength={24}
                        className="tt-adm-input"
                        value={inlinePinInput}
                        onChange={(e) => setInlinePinInput(e.target.value)}
                        placeholder="Tu PIN maestro (ADMIN_MASTER_PIN)"
                      />
                      <button
                        type="submit"
                        disabled={isVerifyingPin || !inlinePinInput.trim()}
                        className="tt-adm-btn-emerald is-sm"
                      >
                        {isVerifyingPin ? '...' : 'Conectar'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="tt-adm-panel is-highlight">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <span className="tt-adm-kicker" style={{ margin: 0 }}>
                          DIRECTORIO SUPABASE AUTH EN VIVO
                        </span>
                        <small style={{ color: 'rgba(250, 249, 245, 0.78)', fontSize: '0.7rem' }}>
                          {authDirectory.synced
                            ? `${authDirectory.users.length} cuentas en Auth · ${orphanAuthUsers.length} huérfanas`
                            : 'Listo para sincronizar correos reales'}
                        </small>
                      </div>
                      <button
                        type="button"
                        disabled={authDirectory.loading}
                        className="tt-adm-chip is-emerald"
                        onClick={() => {
                          triggerHaptic('light');
                          fetchAuthDirectory(verifiedPin);
                        }}
                      >
                        {authDirectory.loading ? 'Sincronizando...' : '↻ Sincronizar Auth'}
                      </button>
                    </div>
                    {authDirectory.error && (
                      <p className="tt-adm-subcopy" style={{ color: '#FCA5A5', marginTop: 6 }}>
                        {authDirectory.error}
                      </p>
                    )}
                  </div>
                )}

                {/* PANEL DE CORREOS HUÉRFANOS ATRAPADOS EN AUTH (SIN PERFIL) */}
                {orphanAuthUsers.length > 0 && (
                  <div className="tt-adm-panel is-alert tt-adm-form-stack">
                    <span className="tt-adm-kicker" style={{ margin: 0, color: '#FECACA' }}>
                      CORREOS HUÉRFANOS EN AUTH ({orphanAuthUsers.length}) · LIBERAR PARA PRUEBAS
                    </span>
                    <p className="tt-adm-subcopy">
                      Estos correos existen en Supabase Auth pero no tienen perfil en la app.
                      Libéralos si alguien intenta registrarse de nuevo y le dice que el correo ya
                      está en uso.
                    </p>
                    <div className="tt-adm-list">
                      {orphanAuthUsers.map((o) => {
                        const busy = accountBusyId === `orphan-${o.authId}`;
                        const confirming = confirmOrphanAuthId === o.authId;
                        return (
                          <div key={o.authId} className="tt-adm-row">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ wordBreak: 'break-all' }}>{o.email || o.authId}</strong>
                              <small>
                                {o.confirmed ? '✓ Verificado' : 'Sin confirmar'} · {o.provider}
                              </small>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              className="tt-adm-chip is-danger"
                              onClick={() => handleDeleteOrphanAuth(o)}
                            >
                              {busy
                                ? 'Borrando...'
                                : confirming
                                ? 'Confirmar liberar'
                                : 'Liberar correo'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <input
                  type="search"
                  className="tt-adm-input"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo, WhatsApp, código o tutor..."
                />

                <div className="tt-adm-list">
                  {filteredAccounts.map((p) => {
                    const isEditing = editingPlayerId === p.id;
                    const authUser =
                      (p.authId && authByIdMap[p.authId]) ||
                      (p.email && authByEmailMap[String(p.email).trim().toLowerCase()]) ||
                      null;
                    const resolvedEmail = authUser?.email || p.email || '';
                    const isBusySave = accountBusyId === `save-${p.id}`;
                    const isBusyMail = accountBusyId === `reset-mail-${p.id}`;
                    const isBusyWa = accountBusyId === `reset-wa-${p.id}`;
                    const isBusyDel = accountBusyId === `del-${p.id}`;

                    return (
                      <div
                        key={p.id}
                        className={`tt-adm-account-card ${p.isPaused ? 'is-paused' : ''}`}
                      >
                        <div className="tt-adm-acc-top">
                          <SmartImage
                            src={p.avatar}
                            alt={p.name}
                            initials={p.name}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              objectPosition: 'center top',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                flexWrap: 'wrap',
                              }}
                            >
                              <strong>{p.name}</strong>
                              {p.isVip && <span className="tt-adm-tag-gold">VIP</span>}
                              {p.isTutelado && <span className="tt-adm-tag-sky">TUTELADA (-18)</span>}
                              {p.isTutorOnly && <span className="tt-adm-tag-sky">SOLO TUTOR</span>}
                              {p.isDemo && <span className="tt-adm-tag-emerald">DEMO</span>}
                              {authUser && (
                                <span
                                  className={
                                    authUser.confirmed ? 'tt-adm-tag-emerald' : 'tt-adm-tag-gold'
                                  }
                                >
                                  {authUser.confirmed ? 'AUTH ✓' : 'PEND. EMAIL'}
                                </span>
                              )}
                              {p.isPaused && <span className="tt-adm-tag-red">PAUSADO</span>}
                            </div>

                            <small>
                              {p.isTutorOnly
                                ? `Padre/Tutor · ${p.whatsapp || 'Sin WhatsApp'}`
                                : `${getCategoryByPoints(p.points).name} · ${Number(
                                    p.points || 0
                                  )} pts (piso ${getCategoryFloorPoints(p.points)}) · ${Number(
                                    p.gems || 0
                                  )} 💎`}
                            </small>

                            {!p.isTutelado ? (
                              <div className="tt-adm-email-line">
                                <span>📧 {resolvedEmail || 'Sin correo vinculado'}</span>
                                {p.whatsapp && <span>· 📱 {p.whatsapp}</span>}
                              </div>
                            ) : (
                              <div className="tt-adm-email-line">
                                <span>🛡 Tutor: {p.tutorName || 'Verificado'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="tt-adm-edit-box">
                            <label className="tt-adm-lbl">
                              <span>Correo real (actualiza Auth + Perfil)</span>
                              <input
                                type="email"
                                className="tt-adm-input"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="correo@ejemplo.com"
                              />
                            </label>
                            <div className="tt-adm-grid-2">
                              <label className="tt-adm-lbl">
                                <span>Puntos ELO</span>
                                <input
                                  type="number"
                                  className="tt-adm-input"
                                  value={editPoints}
                                  onChange={(e) => setEditPoints(e.target.value)}
                                  placeholder="Puntos"
                                />
                              </label>
                              <label className="tt-adm-lbl">
                                <span>Gemas 💎</span>
                                <input
                                  type="number"
                                  className="tt-adm-input"
                                  value={editGems}
                                  onChange={(e) => setEditGems(e.target.value)}
                                  placeholder="Gemas"
                                />
                              </label>
                            </div>
                            {!p.isTutelado && verifiedPin && (
                              <label className="tt-adm-lbl">
                                <span>Nueva contraseña directa en Auth (opcional · mín. 6)</span>
                                <input
                                  type="text"
                                  className="tt-adm-input"
                                  value={editNewPassword}
                                  onChange={(e) => setEditNewPassword(e.target.value)}
                                  placeholder="Déjalo vacío si no deseas cambiar su clave"
                                />
                              </label>
                            )}
                            <div style={{ display: 'flex', gap: 7 }}>
                              <button
                                type="button"
                                disabled={isBusySave}
                                className="tt-adm-btn-emerald is-sm"
                                style={{ flex: 1 }}
                                onClick={() => handleSaveAccountEdit(p, authUser)}
                              >
                                {isBusySave ? 'Guardando...' : 'Guardar Cambios'}
                              </button>
                              <button
                                type="button"
                                className="tt-adm-btn-ghost is-sm"
                                onClick={() => {
                                  setEditingPlayerId(null);
                                  setEditNewPassword('');
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="tt-adm-acc-actions">
                            {onSwitchSandboxUser && (
                              <button
                                type="button"
                                className="tt-adm-chip is-emerald"
                                onClick={() => {
                                  triggerHaptic('medium');
                                  onSwitchSandboxUser(p);
                                  if (onClose) onClose();
                                }}
                              >
                                Ver como él
                              </button>
                            )}

                            <button
                              type="button"
                              className="tt-adm-chip"
                              onClick={() => openEditAccount(p, resolvedEmail)}
                            >
                              Editar / Clave
                            </button>

                            {!p.isTutelado && resolvedEmail && (
                              <button
                                type="button"
                                className="tt-adm-chip"
                                onClick={() => handleCopyEmail(resolvedEmail)}
                              >
                                Copiar email
                              </button>
                            )}

                            {!p.isTutelado && p.whatsapp && (
                              <button
                                type="button"
                                className="tt-adm-chip is-emerald"
                                onClick={() => handleRemindEmailWhatsapp(p, resolvedEmail)}
                              >
                                Recordar email WA
                              </button>
                            )}

                            {!p.isTutelado && resolvedEmail && verifiedPin && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusyMail}
                                  className="tt-adm-chip is-gold"
                                  onClick={() => handleSendResetEmail(p, resolvedEmail)}
                                >
                                  {isBusyMail ? 'Enviando...' : 'Enviar reset email'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusyWa}
                                  className="tt-adm-chip is-gold"
                                  onClick={() => handleSendRecoveryWhatsapp(p, resolvedEmail)}
                                >
                                  {isBusyWa ? 'Generando...' : 'Link clave por WA'}
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="tt-adm-chip"
                              onClick={() => {
                                triggerHaptic('light');
                                if (onAdminUpdatePlayer) {
                                  onAdminUpdatePlayer(p.id, { isPaused: !p.isPaused });
                                }
                              }}
                            >
                              {p.isPaused ? 'Reactivar' : 'Pausar'}
                            </button>

                            {onAdminDeletePlayer && (
                              <button
                                type="button"
                                disabled={isBusyDel}
                                className="tt-adm-chip is-danger"
                                onClick={() => handleFullDeleteAccount(p, authUser)}
                              >
                                {isBusyDel
                                  ? 'Borrando...'
                                  : confirmDeleteId === p.id
                                  ? 'Confirmar borrar todo'
                                  : verifiedPin
                                  ? 'Borrar Auth + Perfil'
                                  : 'Eliminar'}
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

            {/* 3. TEMPORADAS AUTÓNOMAS 00:00 + RESET AL PISO (300+) + EXCEPCIONES */}
            {activeTab === 'temporadas' && (
              <div className="tt-adm-stack">
                <form
                  onSubmit={handleSaveSeasonCalendar}
                  className="tt-adm-panel is-highlight tt-adm-form-stack"
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="tt-adm-kicker" style={{ margin: 0 }}>
                      CALENDARIO AUTÓNOMO (CIERRE 00:00 PERÚ)
                    </span>
                    <button
                      type="button"
                      className={`tt-adm-chip ${calAutoAdvance ? 'is-emerald' : 'is-danger'}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setCalAutoAdvance((v) => !v);
                      }}
                    >
                      Auto-cierre 00:00: {calAutoAdvance ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="tt-adm-seasons-strip">
                    {normalizedSeasons.map((s) => {
                      const isCur = s.number === (Number(seasonSnapshots?.currentSeason) || 4);
                      return (
                        <div
                          key={s.number}
                          className={`tt-adm-q-tile ${isCur ? 'is-cur' : s.locked ? 'is-done' : ''}`}
                        >
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
                          <option key={n} value={n}>
                            T{n}
                          </option>
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
                    Al llegar a las{' '}
                    <b>
                      00:00 del día siguiente al{' '}
                      {addDaysIso(calStartDate, Math.max(14, calDurationDays) - 1)}
                    </b>{' '}
                    (hora Perú), la app cierra sola, guarda el puntaje real para el{' '}
                    <b>Master Top 8</b> y ajusta a cada jugador al <b>piso de su categoría</b> (300
                    / 1,000 / 2,000 / 3,000 / 4,000 / 5,000).
                  </p>

                  <button type="submit" className="tt-adm-btn-emerald">
                    Programar y Guardar Calendario en Vivo
                  </button>
                </form>

                {/* PANEL DE EXCEPCIONES */}
                <div className="tt-adm-panel tt-adm-form-stack">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="tt-adm-kicker" style={{ margin: 0, color: '#F3DC9B' }}>
                      PANEL DE EXCEPCIONES · CONTROL MANUAL ADMIN
                    </span>
                    <button
                      type="button"
                      className={`tt-adm-chip ${closeWithFloorReset ? 'is-emerald' : 'is-gold'}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setCloseWithFloorReset((v) => !v);
                      }}
                    >
                      Reset Piso al cerrar: {closeWithFloorReset ? 'SÍ' : 'NO'}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isResettingPoints}
                    className="tt-adm-btn-gold"
                    onClick={handleCloseCurrentSeason}
                  >
                    {isResettingPoints
                      ? 'Procesando cierre...'
                      : closeWithFloorReset
                      ? `Cerrar T${
                          seasonSnapshots?.currentSeason || 4
                        }, Avanzar y Resetear al Piso (300+)`
                      : `Cerrar T${seasonSnapshots?.currentSeason || 4} y Avanzar (sin bajar puntos)`}
                  </button>

                  <div className="tt-adm-floor-legend">
                    <span>Pisos oficiales:</span>
                    <b>5ª P ≥300→300 (&lt;300→0)</b> · <b>5ª B→1,000</b> · <b>5ª A→2,000</b> ·{' '}
                    <b>4ª→3,000</b> · <b>3ª→4,000</b> · <b>2ª→5,000</b>
                  </div>

                  <button
                    type="button"
                    disabled={isResettingPoints}
                    className="tt-adm-btn-danger"
                    onClick={handleManualFloorResetNow}
                  >
                    {isResettingPoints
                      ? 'Reseteando puntos...'
                      : confirmFloorReset
                      ? `Confirmar: bajar ${floorResetImpactCount} jugadores a su piso ahora`
                      : `⬇ Resetear Puntos al Piso Ahora (${floorResetImpactCount} jugadores)`}
                  </button>

                  <div className="tt-adm-grid-2">
                    <button
                      type="button"
                      className="tt-adm-btn-ghost is-sm"
                      onClick={handleReopenPrevSeason}
                    >
                      ↺ Reabrir Anterior
                    </button>
                    <button
                      type="button"
                      className="tt-adm-btn-ghost is-sm"
                      onClick={handleClearCurrentSnapshot}
                    >
                      {confirmClearSnap
                        ? `Confirmar limpiar foto T${seasonSnapshots?.currentSeason || 4}`
                        : `Limpiar foto T${seasonSnapshots?.currentSeason || 4}`}
                    </button>
                  </div>
                </div>

                {/* Crear Torneo */}
                <div className="tt-adm-panel">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span className="tt-adm-kicker" style={{ margin: 0 }}>
                      CREAR TORNEO OFICIAL
                    </span>
                    <button
                      type="button"
                      className="tt-adm-btn-emerald is-sm"
                      onClick={() => setShowNewTourney((v) => !v)}
                    >
                      {showNewTourney ? 'Cerrar' : '+ Nuevo Torneo'}
                    </button>
                  </div>

                  {showNewTourney && (
                    <form
                      onSubmit={handleCreateCustomTournament}
                      className="tt-adm-form-stack"
                      style={{ marginTop: 10 }}
                    >
                      <input
                        className="tt-adm-input"
                        value={ntName}
                        onChange={(e) => setNtName(e.target.value)}
                        placeholder="Nombre del torneo"
                        required
                      />
                      <div className="tt-adm-grid-2">
                        <select
                          className="tt-adm-input"
                          value={ntClubId}
                          onChange={(e) => setNtClubId(e.target.value)}
                        >
                          {(clubs || []).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.shortName}
                            </option>
                          ))}
                        </select>
                        <input
                          className="tt-adm-input"
                          value={ntDate}
                          onChange={(e) => setNtDate(e.target.value)}
                          placeholder="Fechas (ej. 10 – 19 ENE)"
                        />
                      </div>
                      <div className="tt-adm-grid-2">
                        <select
                          className="tt-adm-input"
                          value={ntDrawSize}
                          onChange={(e) => setNtDrawSize(Number(e.target.value))}
                        >
                          <option value={16}>Cuadro 16 (Octavos)</option>
                          <option value={8}>Cuadro 8 (Cuartos)</option>
                        </select>
                        <input
                          type="number"
                          className="tt-adm-input"
                          value={ntFee}
                          onChange={(e) => setNtFee(Number(e.target.value))}
                          placeholder="Cuota S/"
                        />
                      </div>
                      <div className="tt-adm-grid-2">
                        <button
                          type="button"
                          className={`tt-adm-chip ${ntIncludesBalls ? 'is-emerald' : ''}`}
                          onClick={() => setNtIncludesBalls((v) => !v)}
                        >
                          {ntIncludesBalls ? '✓ Con pelotas' : 'Sin pelotas'}
                        </button>
                        <button
                          type="button"
                          className={`tt-adm-chip ${ntHasConsolation ? 'is-emerald' : ''}`}
                          onClick={() => setNtHasConsolation((v) => !v)}
                        >
                          {ntHasConsolation ? '✓ Consuelo ON' : 'Consuelo OFF'}
                        </button>
                      </div>
                      <button type="submit" className="tt-adm-btn-emerald">
                        Publicar Torneo
                      </button>
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
                            <strong>
                              {playersMap[ch.playerAId]?.name || 'A'} vs.{' '}
                              {playersMap[ch.playerBId]?.name || 'B'}
                            </strong>
                            <small>
                              {ch.clubName} · {ch.scoreSummary || ch.status}
                            </small>
                          </div>
                          {onAdminResolveDispute && (
                            <div style={{ display: 'flex', gap: 5 }}>
                              {(ch.status === 'DISPUTED' || ch.status === 'SCORE_PROPOSED') && (
                                <button
                                  type="button"
                                  className="tt-adm-chip is-emerald"
                                  onClick={() => onAdminResolveDispute(ch.id, 'CONFIRM')}
                                >
                                  Validar
                                </button>
                              )}
                              <button
                                type="button"
                                className="tt-adm-chip is-danger"
                                onClick={() => onAdminResolveDispute(ch.id, 'CANCEL')}
                              >
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
                  <span className="tt-adm-kicker">
                    SEDES OFICIALES (ENCENDER / OCULTAR SIN BORRAR)
                  </span>
                  <div className="tt-adm-list">
                    {(clubs || []).map((c) => {
                      const isOff = disabledClubIds.includes(c.id) || c.active === false;
                      return (
                        <div key={c.id} className="tt-adm-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{c.name}</strong>
                            <small>
                              {isOff ? 'Oculto temporalmente' : 'Visible en Sedes y Retos'}
                            </small>
                          </div>
                          <button
                            type="button"
                            className={`tt-adm-chip ${!isOff ? 'is-emerald' : 'is-danger'}`}
                            onClick={() => {
                              triggerHaptic('light');
                              setDisabledClubIds((prev) =>
                                prev.includes(c.id)
                                  ? prev.filter((id) => id !== c.id)
                                  : [...prev, c.id]
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
                    Para subir productos nuevos, editar stock, fotos, precios o el{' '}
                    <b>Cashback en Gemas</b> de Marcas Aliadas, abre la Tienda desde la barra
                    superior y pulsa <b>+ Gestionar Catálogo</b>.
                  </p>
                </div>
              </div>
            )}

           {/* 5. MOTOR COMERCIAL DE PATROCINADORES (3 NIVELES + MÉTRICAS) */}
         {activeTab === 'sponsors' && (
           <AdminSponsorsManager
             sponsorsConfig={sponsorsConfig || sponsors}
             onSaveSponsors={(nextCfg) => {
               setSponsors(nextCfg);
               try {
                 window.localStorage.setItem(
                   ADMIN_SUITE_EDITABLE_CONFIG.sponsorsStorageKey,
                   JSON.stringify(nextCfg)
                 );
               } catch {
                 // continuar
               }
               if (onAdminSaveSponsors) onAdminSaveSponsors(nextCfg);
             }}
             onPreviewInterstitial={(campaign) => {
               if (onPreviewSponsorInterstitial) {
                 onPreviewSponsorInterstitial(campaign);
               }
             }}
             onNotify={onNotify}
           />
         )}
                    {sponsors.titleSponsorActive ? 'ON' : 'OFF'}
                  </button>
                </div>
                <input
                  className="tt-adm-input"
                  value={sponsors.titleSponsorName}
                  onChange={(e) => setSponsors((s) => ({ ...s, titleSponsorName: e.target.value }))}
                  placeholder="Nombre del Sponsor Principal"
                />

                <div className="tt-adm-toggle-line">
                  <div>
                    <strong>Auspiciador Clima en Sedes</strong>
                    <small>Acompaña el estado de canchas en Sedes Oficiales.</small>
                  </div>
                  <button
                    type="button"
                    className={`tt-adm-chip ${sponsors.weatherSponsorActive ? 'is-emerald' : ''}`}
                    onClick={() =>
                      setSponsors((s) => ({
                        ...s,
                        weatherSponsorActive: !s.weatherSponsorActive,
                      }))
                    }
                  >
                    {sponsors.weatherSponsorActive ? 'ON' : 'OFF'}
                  </button>
                </div>
                <input
                  className="tt-adm-input"
                  value={sponsors.weatherSponsorName}
                  onChange={(e) =>
                    setSponsors((s) => ({ ...s, weatherSponsorName: e.target.value }))
                  }
                  placeholder="Nombre del Sponsor de Clima"
                />

                <label className="tt-adm-lbl">
                  <span>Premio del Sorteo Mensual (Pro Shop)</span>
                  <input
                    className="tt-adm-input"
                    value={sponsors.rafflePrizeText}
                    onChange={(e) => setSponsors((s) => ({ ...s, rafflePrizeText: e.target.value }))}
                  />
                </label>
                <button type="submit" className="tt-adm-btn-emerald">
                  Guardar Patrocinadores
                </button>
              </form>
            )}

            {/* 6. LIBRO DE RECLAMACIONES */}
            {activeTab === 'reclamaciones' && (
              <div className="tt-adm-panel">
                <span className="tt-adm-kicker">
                  LIBRO DE RECLAMACIONES (PLAZO 15 DÍAS HÁBILES)
                </span>
                {allComplaints.length === 0 ? (
                  <p className="tt-adm-empty">No hay hojas de reclamación registradas.</p>
                ) : (
                  <div className="tt-adm-list">
                    {allComplaints.map((c) => (
                      <div key={c.code} className="tt-adm-account-card">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <strong style={{ color: '#F3DC9B' }}>
                            {c.code} · {c.type || c.claimType}
                          </strong>
                          <span
                            className={
                              c.status === 'ATENDIDA' ? 'tt-adm-tag-emerald' : 'tt-adm-tag-gold'
                            }
                          >
                            {c.status}
                          </span>
                        </div>
                        <small>
                          {c.fullName} ({c.docType} {c.docNumber})
                        </small>
                        <p className="tt-adm-subcopy">{c.detail}</p>
                        <div className="tt-adm-acc-actions">
                          <button
                            type="button"
                            className="tt-adm-chip is-emerald"
                            onClick={() => {
                              const next = allComplaints.map((x) =>
                                x.code === c.code
                                  ? {
                                      ...x,
                                      status: x.status === 'ATENDIDA' ? 'REGISTRADA' : 'ATENDIDA',
                                    }
                                  : x
                              );
                              setLocalComplaints(next);
                              try {
                                window.localStorage.setItem(
                                  ADMIN_SUITE_EDITABLE_CONFIG.complaintsStorageKey,
                                  JSON.stringify(next)
                                );
                              } catch {
                                // continuar
                              }
                            }}
                          >
                            {c.status === 'ATENDIDA' ? 'Reabrir' : 'Marcar Atendida'}
                          </button>
                          {c.phone && (
                            <a
                              href={buildWhatsappLink(
                                c.phone,
                                `Hola ${c.fullName}, te contactamos de TOTAL TENIS respecto a tu Hoja de Reclamación ${c.code}.`
                              )}
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

            {/* 7. MONITOR DEL ECOSISTEMA (R2 EN VIVO) + RESPALDO EXCEL + PURGA DEMO */}
            {activeTab === 'respaldo' && (
              <div className="tt-adm-stack">
                <div
                  className={`tt-adm-panel ${
                    r2Stats.data?.blocked ? 'is-alert' : 'is-highlight'
                  } tt-adm-form-stack`}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="tt-adm-kicker" style={{ margin: 0 }}>
                      MONITOR DEL ECOSISTEMA · CLOUDFLARE R2
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {r2Stats.data && (
                        <span className={`tt-adm-chip ${r2Status.cls}`}>{r2Status.label}</span>
                      )}
                      <button
                        type="button"
                        disabled={r2Stats.loading}
                        className="tt-adm-chip"
                        onClick={() => {
                          triggerHaptic('light');
                          fetchR2LiveStats();
                        }}
                      >
                        {r2Stats.loading ? '...' : '↻ Medir'}
                      </button>
                    </div>
                  </div>

                  {r2Stats.error ? (
                    <p className="tt-adm-subcopy" style={{ color: '#FCA5A5' }}>
                      {r2Stats.error}
                    </p>
                  ) : r2Stats.data ? (
                    <>
                      <div className="tt-adm-mem-row">
                        <span>Videos en R2 ({r2Stats.data.objectCount} archivos)</span>
                        <strong>
                          {r2MB >= 1024 ? `${r2GB} GB` : `${r2MB} MB`} / {r2Stats.data.maxGB} GB
                          (freno)
                        </strong>
                      </div>
                      <div className="tt-adm-bar">
                        <div
                          className={
                            r2Stats.data.blocked ? 'is-danger' : r2MB >= 5120 ? 'is-warn' : ''
                          }
                          style={{ width: `${Math.max(2, r2Pct)}%` }}
                        />
                      </div>
                      <p className="tt-adm-subcopy">
                        Cuota gratuita real R2: <b>10 GB</b> + tráfico ilimitado ($0). El servidor
                        bloquea nuevas subidas automáticamente a los <b>8.5 GB</b> para garantizar
                        cero facturas sorpresa.
                      </p>
                    </>
                  ) : (
                    <p className="tt-adm-subcopy">
                      Consultando almacenamiento real en Cloudflare R2...
                    </p>
                  )}

                  <div className="tt-adm-eco-grid">
                    {ECOSYSTEM_DASHBOARDS.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tt-adm-eco-link"
                      >
                        <strong>{item.label} ↗</strong>
                        <small>{item.hint}</small>
                      </a>
                    ))}
                  </div>
                </div>

                <div className={`tt-adm-panel ${storageStats.isWarning ? 'is-alert' : ''}`}>
                  <span className="tt-adm-kicker">CAPACIDAD OPERATIVA (SUPABASE)</span>
                  <div className="tt-adm-mem-row">
                    <span>Jugadores</span>
                    <strong>
                      {storageStats.pCount} /{' '}
                      {ADMIN_SUITE_EDITABLE_CONFIG.maxPlayersCapacity.toLocaleString('es-PE')}
                    </strong>
                  </div>
                  <div className="tt-adm-bar">
                    <div style={{ width: `${Math.max(2, storageStats.pPct)}%` }} />
                  </div>
                  <div className="tt-adm-mem-row" style={{ marginTop: 9 }}>
                    <span>Partidos</span>
                    <strong>
                      {storageStats.mCount} /{' '}
                      {ADMIN_SUITE_EDITABLE_CONFIG.maxMatchesBuffer.toLocaleString('es-PE')}
                    </strong>
                  </div>
                  <div className="tt-adm-bar">
                    <div style={{ width: `${Math.max(2, storageStats.mPct)}%` }} />
                  </div>
                </div>

                {onAdminPurgeDemoPlayers && (
                  <div className="tt-adm-panel is-highlight tt-adm-form-stack">
                    <span className="tt-adm-kicker">LIMPIEZA PRE-LANZAMIENTO BETA</span>
                    <p className="tt-adm-subcopy">
                      Hay <b>{demoCount}</b> cuentas de prueba (<code>is_demo = true</code>). Úsalo
                      justo antes de invitar a los primeros jugadores reales.
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
                    <button
                      type="button"
                      className="tt-adm-btn-emerald"
                      onClick={handleExportPlayersExcel}
                    >
                      Excel Jugadores
                    </button>
                    <button
                      type="button"
                      className="tt-adm-btn-gold"
                      onClick={handleExportMatchesExcel}
                    >
                      Excel Partidos
                    </button>
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
                    {hasDownloadedBackup
                      ? 'Liberar Partidos Archivados'
                      : 'Descarga un Excel primero para liberar historial'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tt-adm-shell {
          border-radius: 22px;
          padding: 15px;
          background: linear-gradient(180deg, #21083A 0%, #120321 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.38);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 5px 0 #0B0116;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-adm-shell * {
          box-sizing: border-box;
        }

        /* PANTALLA DE BLOQUEO CON PIN EN SERVIDOR */
        .tt-adm-lock-screen {
          padding: 20px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .tt-adm-lock-icon {
          width: 66px;
          height: 66px;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(0, 220, 125, 0.22) 0%, rgba(0, 220, 125, 0.08) 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.56);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #005C32;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tt-adm-lock-screen h3 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.42rem;
          color: #FAF9F5;
        }
        .tt-adm-lock-screen p {
          margin: 0;
          font-size: 0.79rem;
          line-height: 1.44;
          color: rgba(250, 249, 245, 0.78);
          max-width: 380px;
        }
        .tt-adm-pin-input {
          width: 230px;
          height: 52px;
          padding: 0 14px;
          border-radius: 15px;
          background: rgba(12, 2, 24, 0.85);
          border: 1.5px solid #00DC7D;
          color: #FAF9F5;
          text-align: center;
          font-size: 1.25rem;
          letter-spacing: 0.22em;
          font-weight: 900;
          outline: none;
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
        }
        .tt-adm-pin-input:focus {
          box-shadow:
            inset 0 2px 6px rgba(0, 0, 0, 0.5),
            0 0 0 3px rgba(0, 220, 125, 0.22);
        }
        .tt-adm-pin-error {
          font-size: 0.76rem;
          font-weight: 800;
          color: #FCA5A5;
        }

        .tt-adm-inline-pin-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .tt-adm-body,
        .tt-adm-stack,
        .tt-adm-form-stack,
        .tt-adm-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        /* KPIS SUPERIORES 3D */
        .tt-adm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (min-width: 560px) {
          .tt-adm-kpi-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .tt-adm-kpi-grid > div {
          padding: 10px 8px;
          border-radius: 15px;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 3px 0 #0E021A;
          text-align: center;
        }
        .tt-adm-kpi-grid span {
          display: block;
          font-size: 0.56rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: rgba(250, 249, 245, 0.68);
        }
        .tt-adm-kpi-grid strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.44rem;
          line-height: 1.06;
          color: #FAF9F5;
        }
        .tt-adm-kpi-grid .is-gold strong {
          color: #F6E2A8;
        }
        .tt-adm-kpi-grid .is-emerald strong {
          color: #22F397;
        }
        .tt-adm-kpi-grid small {
          font-size: 0.64rem;
          color: rgba(250, 249, 245, 0.7);
        }

        /* PESTAÑAS 3D TÁCTILES DEL PANEL ADMIN */
        .tt-adm-tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding: 2px 1px 6px;
          scrollbar-width: none;
        }
        .tt-adm-tabs::-webkit-scrollbar {
          display: none;
        }
        .tt-adm-tab {
          flex-shrink: 0;
          min-height: 38px;
          padding: 0 13px;
          border-radius: 12px;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          color: rgba(250, 249, 245, 0.86);
          font-size: 0.73rem;
          font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 3px 0 #0F021C;
          transition: transform 110ms ease, box-shadow 110ms ease, background 160ms ease;
        }
        .tt-adm-tab:active {
          transform: translateY(2px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #0F021C;
        }
        .tt-adm-tab.is-active {
          background: linear-gradient(180deg, #22F397 0%, #00C96F 56%, #00A85B 100%);
          border-color: rgba(170, 255, 218, 0.8);
          color: #0D0219;
          font-weight: 900;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 3px 0 #007540,
            0 6px 14px rgba(0, 220, 125, 0.28);
        }

        /* PANELES Y FILAS CON RELIEVE */
        .tt-adm-panel {
          padding: 14px;
          border-radius: 17px;
          background: linear-gradient(180deg, rgba(44, 17, 74, 0.86) 0%, rgba(25, 7, 45, 0.94) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.13);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 0 #0E021A;
        }
        .tt-adm-panel.is-highlight {
          border-color: rgba(229, 193, 108, 0.54);
          background: linear-gradient(160deg, rgba(229, 193, 108, 0.14) 0%, rgba(28, 8, 49, 0.95) 70%);
        }
        .tt-adm-panel.is-alert {
          border-color: rgba(248, 113, 113, 0.65);
          background: linear-gradient(160deg, rgba(239, 68, 68, 0.18) 0%, rgba(30, 6, 36, 0.95) 75%);
        }
        .tt-adm-kicker {
          display: block;
          font-size: 0.61rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #22F397;
          margin-bottom: 8px;
        }
        .tt-adm-empty,
        .tt-adm-subcopy {
          margin: 0;
          font-size: 0.76rem;
          line-height: 1.44;
          color: rgba(250, 249, 245, 0.78);
        }

        .tt-adm-floor-legend {
          padding: 9px 11px;
          border-radius: 12px;
          background: rgba(14, 3, 27, 0.72);
          border: 1px solid rgba(250, 249, 245, 0.12);
          font-size: 0.68rem;
          line-height: 1.46;
          color: rgba(250, 249, 245, 0.8);
        }
        .tt-adm-floor-legend span {
          color: #7CF5C0;
          font-weight: 800;
          margin-right: 4px;
        }
        .tt-adm-floor-legend b {
          color: #FAF9F5;
        }

        .tt-adm-eco-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 2px;
        }
        .tt-adm-eco-link {
          padding: 10px 11px;
          border-radius: 13px;
          background: linear-gradient(180deg, #2C104D 0%, #1B0633 100%);
          border: 1px solid rgba(250, 249, 245, 0.15);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 3px 0 #0D0219;
          color: #FAF9F5;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 2px;
          transition: border-color 150ms ease, transform 110ms ease;
        }
        .tt-adm-eco-link:hover {
          border-color: #00DC7D;
        }
        .tt-adm-eco-link:active {
          transform: translateY(2px);
        }
        .tt-adm-eco-link strong {
          font-size: 0.75rem;
          color: #7CF5C0;
        }
        .tt-adm-eco-link small {
          font-size: 0.64rem;
          color: rgba(250, 249, 245, 0.7);
        }

        .tt-adm-seasons-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 7px;
        }
        .tt-adm-q-tile {
          padding: 9px 4px;
          border-radius: 13px;
          background: rgba(16, 4, 30, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 3px 0 #0B0116;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-adm-q-tile.is-cur {
          border-color: #00E582;
          background: rgba(0, 220, 125, 0.16);
        }
        .tt-adm-q-tile.is-done {
          border-color: rgba(229, 193, 108, 0.45);
        }
        .tt-adm-q-tile strong {
          font-size: 0.84rem;
        }
        .tt-adm-q-tile span {
          font-size: 0.59rem;
          opacity: 0.8;
        }
        .tt-adm-q-tile small {
          font-size: 0.57rem;
          font-weight: 900;
          color: #7CF5C0;
        }

        .tt-adm-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 11px;
          border-radius: 13px;
          background: rgba(16, 3, 30, 0.76);
          border: 1px solid rgba(250, 249, 245, 0.12);
        }
        .tt-adm-row strong {
          display: block;
          font-size: 0.83rem;
        }
        .tt-adm-row small {
          display: block;
          font-size: 0.7rem;
          color: rgba(250, 249, 245, 0.7);
        }

        .tt-adm-account-card {
          padding: 12px;
          border-radius: 16px;
          background: linear-gradient(180deg, #2B0F4B 0%, #1B0633 100%);
          border: 1.5px solid rgba(250, 249, 245, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 0 #0D0219;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-adm-account-card.is-paused {
          opacity: 0.7;
          border-style: dashed;
        }
        .tt-adm-acc-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .tt-adm-acc-top small {
          display: block;
          font-size: 0.69rem;
          color: rgba(250, 249, 245, 0.74);
        }
        .tt-adm-email-line {
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #BAE6FD;
          word-break: break-all;
        }
        .tt-adm-acc-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .tt-adm-edit-box {
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .tt-adm-input {
          width: 100%;
          min-height: 43px;
          padding: 0 12px;
          border-radius: 12px;
          background: #130323;
          border: 1.5px solid rgba(250, 249, 245, 0.22);
          color: #FAF9F5;
          font-size: 16px;
          outline: none;
        }
        .tt-adm-input:focus {
          border-color: #00DC7D;
          box-shadow: 0 0 0 3px rgba(0, 220, 125, 0.2);
        }
        .tt-adm-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-adm-grid-3 {
          display: grid;
          grid-template-columns: 0.8fr 1.3fr 0.9fr;
          gap: 7px;
        }
        @media (max-width: 480px) {
          .tt-adm-grid-3 {
            grid-template-columns: 1fr;
          }
        }
        .tt-adm-lbl {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.71rem;
          font-weight: 800;
          color: rgba(250, 249, 245, 0.82);
        }
        .tt-adm-toggle-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-adm-toggle-line strong {
          display: block;
          font-size: 0.81rem;
        }
        .tt-adm-toggle-line small {
          display: block;
          font-size: 0.69rem;
          color: rgba(250, 249, 245, 0.7);
        }

        /* BOTONES 3D TÁCTILES ADMIN */
        .tt-adm-btn-emerald,
        .tt-adm-btn-gold,
        .tt-adm-btn-ghost,
        .tt-adm-btn-danger {
          min-height: 43px;
          padding: 0 15px;
          border-radius: 13px;
          font-size: 0.78rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          border: 1px solid transparent;
          transition:
            transform 110ms cubic-bezier(0.22, 1.35, 0.36, 1),
            box-shadow 110ms ease;
        }
        .tt-adm-btn-emerald:active:not(:disabled),
        .tt-adm-btn-gold:active:not(:disabled),
        .tt-adm-btn-ghost:active:not(:disabled),
        .tt-adm-btn-danger:active:not(:disabled) {
          transform: translateY(3px) scale(0.985);
        }
        .tt-adm-btn-emerald.is-sm,
        .tt-adm-btn-gold.is-sm,
        .tt-adm-btn-ghost.is-sm,
        .tt-adm-btn-danger.is-sm {
          min-height: 36px;
          padding: 0 12px;
          font-size: 0.73rem;
        }

        .tt-adm-btn-emerald {
          background: linear-gradient(180deg, #22F397 0%, #00C96F 56%, #00A85B 100%);
          color: #0D0219;
          border-color: rgba(170, 255, 218, 0.78);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.7),
            0 4px 0 #007540,
            0 8px 18px rgba(0, 220, 125, 0.28);
        }
        .tt-adm-btn-emerald:active:not(:disabled) {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 0 #007540;
        }

        .tt-adm-btn-gold {
          background: linear-gradient(180deg, #FAE9B6 0%, #E5C16C 56%, #C89938 100%);
          color: #1A1002;
          border-color: rgba(255, 245, 214, 0.78);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 4px 0 #8A6012,
            0 8px 18px rgba(229, 193, 108, 0.28);
        }
        .tt-adm-btn-gold:active:not(:disabled) {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 0 #8A6012;
        }

        .tt-adm-btn-ghost {
          background: linear-gradient(180deg, #35155A 0%, #230A40 100%);
          border-color: rgba(255, 255, 255, 0.2);
          color: #FAF9F5;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 3px 0 #10021E;
        }
        .tt-adm-btn-ghost:active:not(:disabled) {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }

        .tt-adm-btn-danger {
          background: linear-gradient(180deg, rgba(248, 113, 113, 0.3) 0%, rgba(185, 28, 28, 0.22) 100%);
          border-color: rgba(248, 113, 113, 0.58);
          color: #FECACA;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 3px 0 #7F1D1D;
        }
        .tt-adm-btn-danger:active:not(:disabled) {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 0 #7F1D1D;
        }
        .tt-adm-btn-danger:disabled,
        .tt-adm-btn-gold:disabled,
        .tt-adm-btn-emerald:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* CHIPS 3D DE ACCIÓN RÁPIDA */
        .tt-adm-chip {
          padding: 6px 11px;
          border-radius: 10px;
          background: linear-gradient(180deg, #35155A 0%, #230A40 100%);
          border: 1px solid rgba(250, 249, 245, 0.2);
          color: #FAF9F5;
          font-size: 0.69rem;
          font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 2px 0 #0F021C;
          cursor: pointer;
          transition: transform 105ms ease, box-shadow 105ms ease;
        }
        .tt-adm-chip:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 #0F021C;
        }
        .tt-adm-chip.is-emerald {
          background: linear-gradient(180deg, rgba(0, 220, 125, 0.26) 0%, rgba(0, 168, 91, 0.16) 100%);
          border-color: rgba(0, 229, 130, 0.6);
          color: #86F7C3;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 2px 0 #005C32;
        }
        .tt-adm-chip.is-gold {
          background: linear-gradient(180deg, rgba(245, 225, 164, 0.24) 0%, rgba(204, 160, 70, 0.14) 100%);
          border-color: rgba(229, 193, 108, 0.62);
          color: #F8E5AC;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 0 #6B4709;
        }
        .tt-adm-chip.is-danger {
          background: linear-gradient(180deg, rgba(248, 113, 113, 0.26) 0%, rgba(185, 28, 28, 0.16) 100%);
          border-color: rgba(248, 113, 113, 0.6);
          color: #FECACA;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 2px 0 #7F1D1D;
        }

        .tt-adm-tag-gold,
        .tt-adm-tag-emerald,
        .tt-adm-tag-red,
        .tt-adm-tag-sky {
          padding: 2px 7px;
          border-radius: 7px;
          font-size: 0.56rem;
          font-weight: 900;
        }
        .tt-adm-tag-gold {
          background: #E5C16C;
          color: #1A1102;
        }
        .tt-adm-tag-emerald {
          background: #00DC7D;
          color: #0D0219;
        }
        .tt-adm-tag-red {
          background: #EF4444;
          color: #FFFFFF;
        }
        .tt-adm-tag-sky {
          background: rgba(56, 189, 248, 0.24);
          border: 1px solid rgba(125, 211, 252, 0.58);
          color: #E0F2FE;
        }

        .tt-adm-mem-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.76rem;
          margin-bottom: 5px;
        }
        .tt-adm-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.14);
          overflow: hidden;
        }
        .tt-adm-bar > div {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00DC7D 0%, #E5C16C 100%);
          transition: width 260ms ease;
        }
        .tt-adm-bar > div.is-warn {
          background: linear-gradient(90deg, #E5C16C 0%, #F59E0B 100%);
        }
        .tt-adm-bar > div.is-danger {
          background: linear-gradient(90deg, #F87171 0%, #DC2626 100%);
        }
      `}</style>
    </ModalPortal>
  );
}
