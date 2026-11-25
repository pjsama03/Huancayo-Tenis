import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import * as PlayersData from './data/playersAndClubsData';
import * as StoreData from './data/storeAndTournamentsData';
import * as Engine from './utils/tenisEngine';
import {
  applyCategoryFloorResetToPlayers,
  buildWhatsappLink,
  createTuteladoProfile,
  dbToChallenge,
  dbToClub,
  dbToCoach,
  dbToPlayer,
  dbToProduct,
  dbToTournament,
  deleteCloudChallenge,
  deleteCloudPlayer,
  fetchAllCloudState,
  fetchPlayerGemLedger,
  formatPeruDate,
  getCloudSession,
  getEffectiveContactPhone,
  hoursLeftForAutoConfirm,
  insertGemLedgerEntry,
  isCloudReady,
  isScoreReadyForAutoConfirm,
  linkOneSignalUser,
  normalizePeruPhone,
  onCloudAuthStateChange,
  purgeDemoPlayers,
  requestPushPermission,
  runWithLock,
  saveCloudSetting,
  sendPushNotification,
  signOutCloudAccount,
  startMinorEmancipation,
  submitOfficialComplaintRpc,
  submitWeatherReportRpc,
  subscribeToCloudRealtime,
  uploadCompressedMedia,
  upsertCloudChallenge,
  upsertCloudClub,
  upsertCloudPlayer,
  upsertCloudTournament,
} from './utils/cloudService';

import {
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from './components/AppIcons';
import { calculateMatchVictoryGems } from './components/RetosParts';
import {
  SponsorInterstitialModal,
  normalizeSponsorsConfig,
  readCachedSponsorsConfig,
  writeCachedSponsorsConfig,
} from './components/SponsorPlacements';
import SplashScreen from './components/SplashScreen';
import HeaderAndDrawer from './components/HeaderAndDrawer';
import BottomDock from './components/BottomDock';
import InstitutionalFooter from './components/InstitutionalFooter';

import RetosView from './pages/RetosView';
import RankingView from './pages/RankingView';
import TorneosView from './pages/TorneosView';
import SedesView from './pages/SedesView';
import PerfilView from './pages/PerfilView';

import ProShopAndGemsModal from './modals/ProShopAndGemsModal';
import HeadToHeadModal from './modals/HeadToHeadModal';
import StoriesStudioModal from './modals/StoriesStudioModal';
import NoticesAndNewsModal from './modals/NoticesAndNewsModal';
import VipCardAndScaleModal from './modals/VipCardAndScaleModal';
import AuthAndOnboardingModal from './modals/AuthAndOnboardingModal';
import LegalAndComplianceModal from './modals/LegalAndComplianceModal';
import PartnerStudioModal from './modals/PartnerStudioModal';
import AdminSuiteModal from './modals/AdminSuiteModal';
import OnboardingTutorialModal, {
  TUTORIAL_STORAGE_KEY,
} from './modals/OnboardingTutorialModal';

/* ==========================================================================
   CONFIGURACIÓN GLOBAL DEL MOTOR DE LA APP
   ========================================================================== */
export const APP_RUNTIME_CONFIG = {
  themeStorageKey: 'tt_theme_pref_v2',
  firstVisitKey: 'tt_visited_before_v2',
  rankMemoryKey: 'tt_rk_seen_ranks_v2',
  sessionStorageKey: 'tt_active_session_v2',
  defaultTab: 'retos',
  toastDurationMs: 3800,
  tickerMessages: [
    { id: 'tk-1', text: 'Tips gratis de la semana en cancha → Ver ahora', action: 'sedes' },
    { id: 'tk-2', text: 'Top 8 del Ranking clasifican al Master Top 8', action: 'master' },
    { id: 'tk-3', text: 'Reporta el estado dentro de tu sede y suma +3 Gemas', action: 'sedes' },
    { id: 'tk-4', text: 'Canjea tus Gemas por stock y beneficios en el Pro Shop', action: 'shop' },
  ],
};

const MONTHS_ES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/* ==========================================================================
   PERSISTENCIA LOCAL DE SESIÓN ACTIVA (PERFILES RÁPIDOS, SANDBOX Y TUTELA)
   ========================================================================== */
function readSavedLocalSession() {
  try {
    const raw = window.localStorage.getItem(APP_RUNTIME_CONFIG.sessionStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.userId) return null;
    return {
      userId: String(parsed.userId),
      tutorParentId: parsed.tutorParentId ? String(parsed.tutorParentId) : null,
      isAdmin: Boolean(parsed.isAdmin),
    };
  } catch {
    return null;
  }
}

function writeSavedLocalSession({ userId, tutorParentId = null, isAdmin = false }) {
  try {
    if (!userId) return;
    window.localStorage.setItem(
      APP_RUNTIME_CONFIG.sessionStorageKey,
      JSON.stringify({
        userId: String(userId),
        tutorParentId: tutorParentId ? String(tutorParentId) : null,
        isAdmin: Boolean(isAdmin),
      })
    );
  } catch {
    // continuar si el navegador bloquea storage
  }
}

function clearSavedLocalSession() {
  try {
    window.localStorage.removeItem(APP_RUNTIME_CONFIG.sessionStorageKey);
  } catch {
    // continuar
  }
}

/* ==========================================================================
   CINTA SUPERIOR AISLADA (NO RE-RENDERIZA App NI RESETEA SCROLL DE MODALES)
   ========================================================================== */
function SlimTickerBar({ onSelectTab, onOpenMaster, onOpenShop }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((prev) => (prev + 1) % APP_RUNTIME_CONFIG.tickerMessages.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  const item = APP_RUNTIME_CONFIG.tickerMessages[idx];
  if (!item) return null;

  return (
    <div className="tt-slim-ticker-bar">
      <button
        type="button"
        className="tt-slim-ticker-btn"
        onClick={() => {
          triggerHaptic('light');
          if (item.action === 'shop') onOpenShop();
          else if (item.action === 'master') onOpenMaster();
          else onSelectTab(item.action);
        }}
      >
        <span className="tt-ticker-dot" aria-hidden="true" />
        <span key={item.id} className="tt-ticker-text">
          {item.text}
        </span>
      </button>
    </div>
  );
}

/* ==========================================================================
   SEMILLAS DE RESPALDO Y UTILIDADES DE TEMPORADA / TUTELA
   ========================================================================== */
function buildInitialPlayers() {
  const src = PlayersData.INITIAL_PLAYERS || PlayersData.DEMO_PLAYERS || [];
  return src.map((p) => ({
    ...p,
    gems: typeof p.gems === 'number' && p.gems >= 0 ? p.gems : p.isVip ? 220 : 35,
    unlockedScenarios: Array.isArray(p.unlockedScenarios) ? p.unlockedScenarios : ['default'],
    unlockedBadges: Array.isArray(p.unlockedBadges) ? p.unlockedBadges : [],
  }));
}

function buildInitialClubs() {
  return PlayersData.INITIAL_CLUBS || [];
}

function buildInitialCoaches() {
  return PlayersData.INITIAL_COACHES || StoreData.INITIAL_COACHES || [];
}

function buildInitialTournaments() {
  return StoreData.INITIAL_TOURNAMENTS || StoreData.TOURNAMENTS_CATALOG || [];
}

function buildInitialProducts() {
  return StoreData.PROSHOP_PRODUCTS || StoreData.INITIAL_PRODUCTS || [];
}

function buildInitialSnapshots(playersList) {
  if (PlayersData.INITIAL_SEASON_SNAPSHOTS?.seasons?.length) {
    return PlayersData.INITIAL_SEASON_SNAPSHOTS;
  }
  const year = new Date().getFullYear();
  const scoresT1 = {};
  const scoresT2 = {};
  const scoresT3 = {};
  (playersList || []).forEach((p) => {
    const base = Number(p.points) || 1200;
    scoresT1[p.id] = Math.max(200, Math.round(base * 0.88));
    scoresT2[p.id] = Math.max(200, Math.round(base * 0.93));
    scoresT3[p.id] = Math.max(200, Math.round(base * 0.97));
  });
  return {
    year,
    currentSeason: 4,
    durationDays: 90,
    autoAdvance: true,
    seasons: [
      { number: 1, label: 'Temporada 1', period: 'Ene – Mar', startDate: `${year}-01-01`, endDate: `${year}-03-31`, locked: true, scores: scoresT1 },
      { number: 2, label: 'Temporada 2', period: 'Abr – Jun', startDate: `${year}-04-01`, endDate: `${year}-06-30`, locked: true, scores: scoresT2 },
      { number: 3, label: 'Temporada 3', period: 'Jul – Sep', startDate: `${year}-07-01`, endDate: `${year}-09-30`, locked: true, scores: scoresT3 },
      { number: 4, label: 'Temporada 4', period: 'Oct – Dic', startDate: `${year}-10-01`, endDate: `${year}-12-31`, locked: false, scores: {} },
    ],
  };
}

function addDaysIsoUtc(isoDate, deltaDays) {
  const [y, m, d] = String(isoDate || new Date().toISOString().slice(0, 10))
    .split('-')
    .map((n) => Number(n) || 1);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
}

function formatShortRangeEs(startIso, endIso) {
  const fmt = (iso) => {
    const p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    return `${String(Number(p[2])).padStart(2, '0')} ${MONTHS_ES_SHORT[Math.max(0, Math.min(11, Number(p[1]) - 1))]}`;
  };
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

function buildAutonomousNextSeasonSnap(baseSnap, playersList) {
  const curNum = Math.max(1, Math.min(4, Number(baseSnap?.currentSeason) || 1));
  const year = Number(baseSnap?.year) || new Date().getFullYear();
  const durationDays = Math.max(14, Number(baseSnap?.durationDays) || 90);
  const list = Array.isArray(baseSnap?.seasons) ? baseSnap.seasons : [];

  const frozenScores = {};
  (playersList || []).forEach((p) => {
    if (!p.isTutorOnly) frozenScores[p.id] = Number(p.points) || 0;
  });

  const closedList = list.map((s) =>
    Number(s.number) === curNum
      ? { ...s, locked: true, closedAt: new Date().toISOString(), scores: frozenScores }
      : s
  );

  const isYearEnd = curNum >= 4;
  if (!isYearEnd) {
    return {
      ...baseSnap,
      year,
      currentSeason: curNum + 1,
      durationDays,
      autoAdvance: baseSnap?.autoAdvance !== false,
      seasons: closedList,
    };
  }

  const lastEnd = closedList.find((s) => Number(s.number) === 4)?.endDate || `${year}-12-31`;
  let cursorStart = addDaysIsoUtc(lastEnd, 1);
  const nextYearSeasons = [1, 2, 3, 4].map((num) => {
    const sStart = cursorStart;
    const sEnd = addDaysIsoUtc(sStart, durationDays - 1);
    cursorStart = addDaysIsoUtc(sEnd, 1);
    return {
      number: num,
      label: `Temporada ${num}`,
      startDate: sStart,
      endDate: sEnd,
      period: formatShortRangeEs(sStart, sEnd),
      locked: false,
      closedAt: null,
      scores: {},
    };
  });

  return {
    ...baseSnap,
    year: year + 1,
    currentSeason: 1,
    durationDays,
    autoAdvance: baseSnap?.autoAdvance !== false,
    seasons: nextYearSeasons,
  };
}

function resolvePushRecipients(targetIds = [], allPlayers = []) {
  const out = new Set();
  (targetIds || []).forEach((id) => {
    if (!id) return;
    out.add(String(id));
    const found = (allPlayers || []).find((p) => p.id === id);
    if (found?.isTutelado && found.tutorId) {
      out.add(String(found.tutorId));
    }
  });
  return Array.from(out);
}

function mergeListById(prevList, nextItem, prepend = true) {
  if (!nextItem?.id) return prevList;
  const exists = prevList.some((item) => item.id === nextItem.id);
  if (exists) {
    return prevList.map((item) => (item.id === nextItem.id ? { ...item, ...nextItem } : item));
  }
  return prepend ? [nextItem, ...prevList] : [...prevList, nextItem];
}

function sortPlayersForOfficialRanking(list) {
  return [...(list || [])]
    .filter((p) => !p.isPaused && !p.isTutorOnly)
    .sort((a, b) => {
      const diffPts = (Number(b.points) || 0) - (Number(a.points) || 0);
      if (diffPts !== 0) return diffPts;
      return (Number(b.wins) || 0) - (Number(a.wins) || 0);
    });
}

function snapshotPreMatchRankMap(playersList) {
  try {
    const ordered = sortPlayersForOfficialRanking(playersList);
    const rankMap = {};
    ordered.forEach((p, idx) => {
      rankMap[p.id] = idx + 1;
    });
    const raw = window.localStorage.getItem(APP_RUNTIME_CONFIG.rankMemoryKey);
    const prevAll = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(
      APP_RUNTIME_CONFIG.rankMemoryKey,
      JSON.stringify({ ...prevAll, 'ALL|ALL': rankMap })
    );
    return rankMap;
  } catch {
    return {};
  }
}

/* ==========================================================================
   COMPONENTE RAÍZ MAESTRO: App
   (SUPABASE REALTIME + SESIÓN PERSISTENTE + RETO 1 TOQUE + GEMAS 6-0, 6-0)
   ========================================================================== */
export default function App() {
  const scrollContainerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const playersRef = useRef([]);
  const seasonAutoCloseKeyRef = useRef('');

  const defaultSeeds = useMemo(() => {
    const seededPlayers = buildInitialPlayers();
    return {
      players: seededPlayers,
      clubs: buildInitialClubs(),
      coaches: buildInitialCoaches(),
      tournaments: buildInitialTournaments(),
      products: buildInitialProducts(),
      seasonSnapshots: buildInitialSnapshots(seededPlayers),
    };
  }, []);

  const initialSavedSession = useMemo(() => readSavedLocalSession(), []);

  const [players, setPlayers] = useState(defaultSeeds.players);
  const [clubs, setClubs] = useState(defaultSeeds.clubs);
  const [coaches, setCoaches] = useState(defaultSeeds.coaches);
  const [challenges, setChallenges] = useState([]);
  const [tournaments, setTournaments] = useState(defaultSeeds.tournaments);
  const [products, setProducts] = useState(defaultSeeds.products);
  const [seasonSnapshots, setSeasonSnapshots] = useState(defaultSeeds.seasonSnapshots);
  const [currentUserId, setCurrentUserId] = useState(() => initialSavedSession?.userId || null);
  const [tutorParentId, setTutorParentId] = useState(() => initialSavedSession?.tutorParentId || null);
  const [gemLedger, setGemLedger] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [sponsorsConfig, setSponsorsConfig] = useState(() => readCachedSponsorsConfig());
  const [previewSponsorCampaign, setPreviewSponsorCampaign] = useState(null);
  const sponsorsConfigRef = useRef(null);
  const trackedImpressionsRef = useRef(new Set());

  useEffect(() => {
    sponsorsConfigRef.current = sponsorsConfig;
    if (sponsorsConfig) writeCachedSponsorsConfig(sponsorsConfig);
  }, [sponsorsConfig]);

  const handleTrackSponsorMetric = useCallback((campaignId, field) => {
    if (!campaignId || (field !== 'impressions' && field !== 'clicks')) return;
    if (field === 'impressions') {
      if (trackedImpressionsRef.current.has(campaignId)) return;
      trackedImpressionsRef.current.add(campaignId);
    }
    const base = normalizeSponsorsConfig(sponsorsConfigRef.current);
    let found = false;
    const nextCampaigns = base.campaigns.map((c) => {
      if (c.id !== campaignId) return c;
      found = true;
      return { ...c, [field]: (Number(c[field]) || 0) + 1 };
    });
    if (!found) return;
    const nextCfg = { ...base, campaigns: nextCampaigns };
    setSponsorsConfig(nextCfg);
    writeCachedSponsorsConfig(nextCfg);
    saveCloudSetting('sponsors_config', nextCfg).catch(() => {});
  }, []);

  const handleTrackSponsorImpression = useCallback(
    (campaignId) => handleTrackSponsorMetric(campaignId, 'impressions'),
    [handleTrackSponsorMetric]
  );

  const handleTrackSponsorClick = useCallback(
    (campaignId) => handleTrackSponsorMetric(campaignId, 'clicks'),
    [handleTrackSponsorMetric]
  );
  const [cloudSynced, setCloudSynced] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem(APP_RUNTIME_CONFIG.themeStorageKey) || 'dark';
    } catch {
      return 'dark';
    }
  });
  const sunlightMode = false;
  const [performanceTier, setPerformanceTier] = useState('standard');

  const [showSplash, setShowSplash] = useState(true);
  const [isFirstVisit] = useState(() => {
    try {
      return !window.localStorage.getItem(APP_RUNTIME_CONFIG.firstVisitKey);
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState(APP_RUNTIME_CONFIG.defaultTab);
  const [torneosInitialSubTab, setTorneosInitialSubTab] = useState('gira');
  const [quickChallengeRival, setQuickChallengeRival] = useState(null);

  const [isAdminSession, setIsAdminSession] = useState(() => Boolean(initialSavedSession?.isAdmin));
  const [activePartner, setActivePartner] = useState(null);

  // Control centralizado de Modales
  const [proShopModal, setProShopModal] = useState({ open: false, mode: 'shop' });
  const [h2hModal, setH2hModal] = useState({ open: false, playerA: null, playerB: null });
  const [storiesModal, setStoriesModal] = useState({ open: false, payload: null });
  const [noticesModal, setNoticesModal] = useState({ open: false, tab: 'notificaciones' });
  const [vipScaleModal, setVipScaleModal] = useState({ open: false, tab: 'vip' });
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });
  const [legalModal, setLegalModal] = useState({ open: false, section: 'reclamaciones' });
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const [inspectPlayerId, setInspectPlayerId] = useState(null);
  const [dismissedIncomingIds, setDismissedIncomingIds] = useState([]);
  const [dismissedScoreIds, setDismissedScoreIds] = useState([]);
  const [busyActionId, setBusyActionId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Persistir sesión activa en disco para sobrevivir cierres de app (Elías, rápido, sandbox, tutela)
  useEffect(() => {
    if (currentUserId) {
      writeSavedLocalSession({
        userId: currentUserId,
        tutorParentId,
        isAdmin: isAdminSession,
      });
    }
  }, [currentUserId, tutorParentId, isAdminSession]);

  const showToast = useCallback((message, type = 'info') => {
    if (!message) return;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, APP_RUNTIME_CONFIG.toastDurationMs);
  }, []);

  const openAuthSheet = useCallback((mode = 'login') => {
    setAuthModal({ open: true, mode });
  }, []);

  /* ------------------------------------------------------------------------
     1. TEMA Y RENDIMIENTO ADAPTATIVO
     ------------------------------------------------------------------------ */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.setAttribute('data-sunlight', 'false');
    html.setAttribute('data-tier', performanceTier);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'light' ? '#FAF9F5' : '#1E0734');
    }

    try {
      window.localStorage.setItem(APP_RUNTIME_CONFIG.themeStorageKey, theme);
    } catch {
      // continuar
    }
  }, [theme, performanceTier]);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const lowMem = navigator.deviceMemory && navigator.deviceMemory <= 3;
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (lowMem || lowCores || prefersReduced) {
      setPerformanceTier('lite');
    }
  }, []);

  /* ------------------------------------------------------------------------
     2. SINCRONIZACIÓN INICIAL SUPABASE + SESIÓN REAL/PERSISTENTE + REALTIME
     ------------------------------------------------------------------------ */
  const resolveSessionPlayer = useCallback((session, list) => {
    if (!session?.user) return null;
    const authId = session.user.id;
    const email = String(session.user.email || '').trim().toLowerCase();
    return (
      (list || []).find((p) => p.authId && p.authId === authId) ||
      (list || []).find((p) => !p.isTutelado && p.email && p.email.toLowerCase() === email) ||
      null
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!isCloudReady) {
      setCloudSynced(true);
      return undefined;
    }

    (async () => {
      try {
        const [cloudData, session] = await Promise.all([
          fetchAllCloudState(defaultSeeds),
          getCloudSession(),
        ]);

        if (!mounted) return;

        let loadedPlayers = defaultSeeds.players;
        if (cloudData) {
          if (cloudData.players?.length) {
            loadedPlayers = cloudData.players;
            setPlayers(cloudData.players);
          }
          if (cloudData.clubs?.length) setClubs(cloudData.clubs);
          if (cloudData.coaches?.length) setCoaches(cloudData.coaches);
          if (Array.isArray(cloudData.challenges)) setChallenges(cloudData.challenges);
          if (cloudData.tournaments?.length) setTournaments(cloudData.tournaments);
          if (cloudData.products?.length) setProducts(cloudData.products);
          if (Array.isArray(cloudData.complaints)) setComplaints(cloudData.complaints);
          if (cloudData.seasonSnapshots?.seasons?.length) {
            setSeasonSnapshots(cloudData.seasonSnapshots);
          }
          if (cloudData.sponsorsConfig) setSponsorsConfig(cloudData.sponsorsConfig);
        }

        const saved = readSavedLocalSession();
        const matched = resolveSessionPlayer(session, loadedPlayers);

        if (matched) {
          // Si un padre con sesión real estaba gestionando a su hijo tutelado, conservar ese subperfil
          const savedChild =
            saved?.userId && saved.userId !== matched.id
              ? loadedPlayers.find(
                  (p) => p.id === saved.userId && p.isTutelado && p.tutorId === matched.id
                )
              : null;
          const activeProfile = savedChild || matched;
          setCurrentUserId(activeProfile.id);
          setTutorParentId(matched.isTutelado ? matched.tutorId : matched.id);
          setIsAdminSession(Boolean(matched.isAdmin || saved?.isAdmin));
          linkOneSignalUser(matched.id);
        } else if (saved?.userId) {
          // Restaurar perfil guardado localmente (ej. Elías, acceso rápido o modo pruebas)
          const savedPlayer = loadedPlayers.find((p) => p.id === saved.userId);
          if (savedPlayer) {
            setCurrentUserId(savedPlayer.id);
            setTutorParentId(
              savedPlayer.isTutelado ? savedPlayer.tutorId : saved.tutorParentId || savedPlayer.id
            );
            setIsAdminSession(Boolean(savedPlayer.isAdmin || saved.isAdmin));
            linkOneSignalUser(
              savedPlayer.isTutelado && savedPlayer.tutorId ? savedPlayer.tutorId : savedPlayer.id
            );
          } else {
            clearSavedLocalSession();
            setCurrentUserId(null);
            setTutorParentId(null);
            setIsAdminSession(false);
          }
        }
      } catch (err) {
        console.error('[TOTAL TENIS] Error en carga inicial cloud:', err);
      } finally {
        if (mounted) setCloudSynced(true);
      }
    })();

    const unsubscribeAuth = onCloudAuthStateChange((event, session) => {
      if (!mounted) return;
      // Solo limpiar cuando ocurre un cierre de sesión real (jamás en INITIAL_SESSION sin JWT)
      if (event === 'SIGNED_OUT') {
        clearSavedLocalSession();
        setCurrentUserId(null);
        setTutorParentId(null);
        setIsAdminSession(false);
        return;
      }
      if (!session?.user) return;
      const matched = resolveSessionPlayer(session, playersRef.current);
      if (matched) {
        const saved = readSavedLocalSession();
        const savedChild =
          saved?.userId && saved.userId !== matched.id
            ? playersRef.current.find(
                (p) => p.id === saved.userId && p.isTutelado && p.tutorId === matched.id
              )
            : null;
        const activeProfile = savedChild || matched;
        setCurrentUserId(activeProfile.id);
        setTutorParentId(matched.isTutelado ? matched.tutorId : matched.id);
        setIsAdminSession(Boolean(matched.isAdmin || saved?.isAdmin));
        linkOneSignalUser(matched.id);
      }
    });

    const unsubscribeRealtime = subscribeToCloudRealtime({
      onProfileChange: (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) setPlayers((prev) => prev.filter((p) => p.id !== oldId));
          return;
        }
        const next = dbToPlayer(payload.new);
        if (!next) return;
        setPlayers((prev) =>
          mergeListById(prev, next, false).sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
        );
      },
      onChallengeChange: (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) setChallenges((prev) => prev.filter((c) => c.id !== oldId));
          return;
        }
        const next = dbToChallenge(payload.new);
        if (next) setChallenges((prev) => mergeListById(prev, next, true));
      },
      onTournamentChange: (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) setTournaments((prev) => prev.filter((t) => t.id !== oldId));
          return;
        }
        const next = dbToTournament(payload.new);
        if (next) setTournaments((prev) => mergeListById(prev, next, true));
      },
      onClubChange: (payload) => {
        if (!mounted) return;
        const next = dbToClub(payload.new);
        if (next) setClubs((prev) => mergeListById(prev, next, false));
      },
      onCoachChange: (payload) => {
        if (!mounted) return;
        const next = dbToCoach(payload.new);
        if (next) setCoaches((prev) => mergeListById(prev, next, false));
      },
      onProductChange: (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) setProducts((prev) => prev.filter((p) => p.id !== oldId));
          return;
        }
        const next = dbToProduct(payload.new);
        if (next) {
          setProducts((prev) =>
            mergeListById(prev, next, false).sort((a, b) => (a.sortOrder || 10) - (b.sortOrder || 10))
          );
        }
      },
      onSettingChange: (payload) => {
        if (!mounted || !payload?.new) return;
        if (payload.new.key === 'season_snapshots' && payload.new.value) {
          setSeasonSnapshots(payload.new.value);
        }
        if (payload.new.key === 'sponsors_config') {
          setSponsorsConfig(payload.new.value || null);
        }
      },
    });

    return () => {
      mounted = false;
      unsubscribeAuth();
      unsubscribeRealtime();
    };
  }, [defaultSeeds, resolveSessionPlayer]);

  useEffect(() => {
    if (!currentUserId) {
      setGemLedger([]);
      return;
    }
    const activeObj = playersRef.current.find((p) => p.id === currentUserId);
    linkOneSignalUser(activeObj?.isTutelado && activeObj.tutorId ? activeObj.tutorId : currentUserId);
    if (activeObj?.isAdmin) setIsAdminSession(true);

    let alive = true;
    fetchPlayerGemLedger(currentUserId)
      .then((rows) => {
        if (alive && Array.isArray(rows)) setGemLedger(rows);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [currentUserId]);

  /* ------------------------------------------------------------------------
     3. CIERRE AUTÓNOMO 00:00 (HORA PERÚ) + RESET AL PISO DE CATEGORÍA (300+)
     ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!cloudSynced || !seasonSnapshots?.autoAdvance) return undefined;

    const checkAndCloseIfMidnightPassed = async () => {
      const curNum = Number(seasonSnapshots.currentSeason) || 1;
      const list = Array.isArray(seasonSnapshots.seasons) ? seasonSnapshots.seasons : [];
      const curObj = list.find((s) => Number(s.number) === curNum);
      if (!curObj || curObj.locked || !curObj.endDate) return;

      const todayPeru = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      if (todayPeru <= curObj.endDate) return;

      const cycleKey = `${seasonSnapshots.year}-T${curNum}-${curObj.endDate}`;
      if (seasonAutoCloseKeyRef.current === cycleKey) return;
      seasonAutoCloseKeyRef.current = cycleKey;

      await runWithLock(`auto-close-season-${cycleKey}`, async () => {
        const nextSnap = buildAutonomousNextSeasonSnap(seasonSnapshots, playersRef.current);
        setSeasonSnapshots(nextSnap);
        try {
          await saveCloudSetting('season_snapshots', nextSnap);
          const resetList = await applyCategoryFloorResetToPlayers(playersRef.current);
          setPlayers(
            [...resetList].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
          );
        } catch (err) {
          console.error('[TOTAL TENIS] Error en cierre autónomo 00:00:', err);
          seasonAutoCloseKeyRef.current = '';
        }
      });
    };

    checkAndCloseIfMidnightPassed();
    const timer = window.setInterval(checkAndCloseIfMidnightPassed, 60000);
    return () => window.clearInterval(timer);
  }, [cloudSynced, seasonSnapshots]);

/* ------------------------------------------------------------------------
     4. DERIVADOS DE ESTADO, TUTELA FAMILIAR Y DETECCIÓN MULTIUSUARIO
     ------------------------------------------------------------------------ */
  const currentUser = useMemo(
    () => players.find((p) => p.id === currentUserId) || null,
    [players, currentUserId]
  );

  const activeTutorParent = useMemo(() => {
    const parentId = currentUser?.isTutelado ? currentUser.tutorId : tutorParentId;
    if (!parentId) return null;
    return players.find((p) => p.id === parentId) || null;
  }, [players, currentUser, tutorParentId]);

  const effectiveIsAdmin = Boolean(
    isAdminSession || currentUser?.isAdmin || activeTutorParent?.isAdmin
  );

  const activePlayers = useMemo(() => players.filter((p) => !p.isPaused), [players]);
  const activeClubs = useMemo(() => clubs.filter((c) => c.active !== false), [clubs]);
  const inspectedPlayer = useMemo(
    () => players.find((p) => p.id === inspectPlayerId) || null,
    [players, inspectPlayerId]
  );

  const liveMatchesCount = useMemo(
    () => challenges.filter((c) => c.status === 'IN_PLAY').length,
    [challenges]
  );

  const incomingPendingChallenges = useMemo(() => {
    if (!currentUser?.id) return [];
    return challenges.filter((c) => c.status === 'PENDING' && c.playerBId === currentUser.id);
  }, [challenges, currentUser?.id]);

  const pendingScoreConfirmations = useMemo(() => {
    if (!currentUser?.id) return [];
    return challenges.filter((c) => {
      if (c.status !== 'SCORE_PROPOSED') return false;
      const isParticipant = c.playerAId === currentUser.id || c.playerBId === currentUser.id;
      if (!isParticipant) return false;
      if (c.proposedBy !== currentUser.id) return true;
      return isScoreReadyForAutoConfirm(c);
    });
  }, [challenges, currentUser?.id]);

  const popupChallenge = useMemo(() => {
    if (showSplash || authModal.open || !currentUser?.id) return null;
    return incomingPendingChallenges.find((c) => !dismissedIncomingIds.includes(c.id)) || null;
  }, [showSplash, authModal.open, currentUser?.id, incomingPendingChallenges, dismissedIncomingIds]);

  const scoreConfirmChallenge = useMemo(() => {
    if (showSplash || authModal.open || popupChallenge || !currentUser?.id) return null;
    return pendingScoreConfirmations.find((c) => !dismissedScoreIds.includes(c.id)) || null;
  }, [
    showSplash,
    authModal.open,
    popupChallenge,
    currentUser?.id,
    pendingScoreConfirmations,
    dismissedScoreIds,
  ]);

  const activeTournamentsCount = useMemo(
    () => tournaments.filter((t) => t.status === 'OPEN' || t.status === 'IN_PLAY').length,
    [tournaments]
  );

  const unreadNoticesCount = useMemo(() => {
    const unreadCustom = notices.filter((n) => !n.read).length;
    return incomingPendingChallenges.length + pendingScoreConfirmations.length + unreadCustom;
  }, [incomingPendingChallenges.length, pendingScoreConfirmations.length, notices]);

  const scrollMainToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Centra suavemente al jugador en su fila del Ranking (o Podio Top 3) acompañando el FLIP
  const focusMyPositionInRanking = useCallback((newRank) => {
    const scrollToTarget = () => {
      if (typeof document === 'undefined') return;
      if (newRank && newRank <= 3) {
        const podium = document.querySelector('.tt-podium-stage');
        if (podium && typeof podium.scrollIntoView === 'function') {
          podium.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      const myRow = document.getElementById('tt-my-ranking-row');
      if (myRow && typeof myRow.scrollIntoView === 'function') {
        myRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    window.setTimeout(scrollToTarget, 220);
    window.setTimeout(scrollToTarget, 1520);
  }, []);

  const handleSelectTab = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      scrollMainToTop();
    },
    [scrollMainToTop]
  );

  const handleOpenTournamentsAt = useCallback(
    (subTab = 'gira') => {
      setTorneosInitialSubTab(subTab);
      setActiveTab('torneos');
      scrollMainToTop();
    },
    [scrollMainToTop]
  );

  const handleConsumeQuickChallenge = useCallback(() => {
    setQuickChallengeRival(null);
  }, []);

  const handleFinishSplash = useCallback(() => {
    setShowSplash(false);
    try {
      window.localStorage.setItem(APP_RUNTIME_CONFIG.firstVisitKey, '1');
    } catch {
      // continuar
    }
  }, []);

  /* ------------------------------------------------------------------------
     5. GESTIÓN FAMILIAR (-18), EMANCIPACIÓN (+18) Y RESET AL PISO ADMIN
     ------------------------------------------------------------------------ */
  const handleCreateTutelado = useCallback(async (tutorPlayer, childData) => {
    const created = await createTuteladoProfile(tutorPlayer, childData);
    if (created?.id) {
      setPlayers((prev) =>
        mergeListById(prev, created, false).sort(
          (a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)
        )
      );
    }
    return created;
  }, []);

  const handleSwitchActiveProfile = useCallback(
    (targetProfileId) => {
      if (!targetProfileId) return;
      const target = playersRef.current.find((p) => p.id === targetProfileId);
      if (!target) return;

      const rootParentId =
        tutorParentId || (currentUser?.isTutelado ? currentUser.tutorId : currentUser?.id);

      const allowed =
        target.id === rootParentId ||
        (target.isTutelado && target.tutorId === rootParentId) ||
        effectiveIsAdmin;

      if (!allowed) {
        showToast('No tienes permisos para cambiar a esa cuenta.', 'warning');
        return;
      }

      if (!currentUser?.isTutelado && currentUser?.id) {
        setTutorParentId(currentUser.id);
      }
      setCurrentUserId(target.id);
      setDismissedIncomingIds([]);
      setDismissedScoreIds([]);
      triggerHaptic('medium');
      showToast(
        target.isTutelado
          ? `Gestionando subcuenta juvenil de ${target.name}.`
          : `Volviste a tu cuenta titular (${target.name.split(' ')[0]}).`,
        'info'
      );
    },
    [currentUser, tutorParentId, effectiveIsAdmin, showToast]
  );

  const handleStartEmancipation = useCallback(async (minorId) => {
    const updated = await startMinorEmancipation(minorId);
    if (updated?.id) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    }
    return updated;
  }, []);

  const handleAdminResetFloorPoints = useCallback(async () => {
    const resetList = await applyCategoryFloorResetToPlayers(playersRef.current);
    setPlayers([...resetList].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)));
    return resetList;
  }, []);

  /* ------------------------------------------------------------------------
     6. ACCIONES CONECTADAS A SUPABASE + STORAGE + GEMAS 6-0, 6-0 + FLIP
     ------------------------------------------------------------------------ */
  const appendGemLedger = useCallback(
    async (entry, targetPlayerId = currentUserId) => {
      const localEntry = {
        id: `lg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: entry.date || formatPeruDate(new Date(), false) || 'Hoy',
        ...entry,
      };
      if (!targetPlayerId || targetPlayerId === currentUserId) {
        setGemLedger((prev) => [localEntry, ...prev]);
      }
      if (targetPlayerId) {
        try {
          await insertGemLedgerEntry({
            playerId: targetPlayerId,
            type: entry.type || 'credit',
            amount: Number(entry.amount) || 0,
            title: entry.title || 'Movimiento de Gemas',
            detail: entry.detail || '',
          });
        } catch {
          // no bloquear UI
        }
      }
    },
    [currentUserId]
  );

  const handleUpdatePlayer = useCallback(
    async (playerId, patch) => {
      if (!playerId || !patch) return;
      const finalPatch = { ...patch };

      if (finalPatch.whatsapp !== undefined) {
        finalPatch.whatsapp = normalizePeruPhone(finalPatch.whatsapp);
      }

      if (
        finalPatch.avatar &&
        (String(finalPatch.avatar).startsWith('data:image/') || finalPatch.avatar instanceof Blob)
      ) {
        try {
          const uploadedUrl = await uploadCompressedMedia(finalPatch.avatar, 'avatars', playerId);
          if (uploadedUrl) {
            finalPatch.avatar = uploadedUrl;
            finalPatch.fullBodyPhoto = uploadedUrl;
          }
        } catch (err) {
          console.error('[TOTAL TENIS] Error subiendo foto a media:', err);
          showToast('No se pudo subir la foto a la nube. Intenta con otra imagen.', 'warning');
          return;
        }
      }

      const existing = playersRef.current.find((p) => p.id === playerId);
      const merged = existing ? { ...existing, ...finalPatch } : { id: playerId, ...finalPatch };

      setPlayers((prev) => prev.map((p) => (p.id === playerId ? merged : p)));

      try {
        await upsertCloudPlayer(merged);
      } catch (err) {
        console.error('[TOTAL TENIS] Error guardando perfil:', err);
        showToast('No se pudieron guardar los cambios en la nube.', 'warning');
      }
    },
    [showToast]
  );

  const handleCreateChallenge = useCallback(async (newChallenge) => {
    if (!newChallenge?.id) return;
    const res = await runWithLock(`create-challenge-${newChallenge.id}`, async () => {
      setChallenges((prev) => mergeListById(prev, newChallenge, true));
      await upsertCloudChallenge(newChallenge);

      const challenger = playersRef.current.find((p) => p.id === newChallenge.playerAId);
      if (newChallenge.playerBId) {
        sendPushNotification({
          targetPlayerIds: resolvePushRecipients([newChallenge.playerBId], playersRef.current),
          title: '¡Nuevo desafío en TOTAL TENIS!',
          message: `${challenger?.name || 'Un jugador'} te retó en ${
            newChallenge.clubName || 'cancha'
          } (${newChallenge.dateLabel || ''} ${newChallenge.timeLabel || ''}).`,
          path: '/',
        });
      }
      requestPushPermission();
    });

    if (res.locked) return;
  }, []);

  const handleUpdateChallenge = useCallback(
    async (challengeId, patch) => {
      if (!challengeId || !patch) return;
      const current = challenges.find((c) => c.id === challengeId);
      if (!current) return;

      const isParticipant =
        currentUser?.id &&
        (current.playerAId === currentUser.id || current.playerBId === currentUser.id);
      if (!isParticipant && !effectiveIsAdmin) {
        showToast('Solo los contendientes pueden modificar este encuentro.', 'warning');
        return;
      }

      const updated = { ...current, ...patch };
      await runWithLock(`update-challenge-${challengeId}`, async () => {
        setChallenges((prev) => prev.map((c) => (c.id === challengeId ? updated : c)));
        try {
          await upsertCloudChallenge(updated);
        } catch (err) {
          console.error('[TOTAL TENIS] Error actualizando reto:', err);
          showToast('Error sincronizando el reto. Intenta de nuevo.', 'warning');
          return;
        }

        if (patch.status === 'SCHEDULED' && current.status !== 'SCHEDULED') {
          const acceptor = playersRef.current.find((p) => p.id === current.playerBId);
          sendPushNotification({
            targetPlayerIds: resolvePushRecipients([current.playerAId], playersRef.current),
            title: '¡Desafío aceptado!',
            message: `${acceptor?.name || 'Tu rival'} aceptó el partido en ${current.clubName}.`,
            path: '/',
          });
        } else if (patch.status === 'DECLINED' && current.status !== 'DECLINED') {
          const targetId =
            currentUser?.id === current.playerAId ? current.playerBId : current.playerAId;
          sendPushNotification({
            targetPlayerIds: resolvePushRecipients([targetId], playersRef.current),
            title: 'Desafío cancelado',
            message: `El reto programado en ${current.clubName} fue cancelado.`,
            path: '/',
          });
        }
      });
    },
    [challenges, currentUser?.id, effectiveIsAdmin, showToast]
  );

  /* Confirmación definitiva de puntos + Gemas por victoria (hasta 6-0, 6-0) + Auto-scroll al Ranking */
  const applyOfficialMatchResult = useCallback(
    async ({
      challenge,
      winnerSide,
      summary,
      deltaA,
      deltaB,
      newPointsA,
      newPointsB,
      liveScore,
      isWalkover = false,
      autoJumpToRanking = true,
    }) => {
      if (!challenge?.id) return;

      const lockRes = await runWithLock(`apply-result-${challenge.id}`, async () => {
        setBusyActionId(challenge.id);

        const preRankMap = snapshotPreMatchRankMap(playersRef.current);

        const winnerId = winnerSide === 'A' ? challenge.playerAId : challenge.playerBId;
        const effectiveScore = liveScore || challenge.liveScore || {};
        const isOfficial = challenge.mode !== 'Amistoso';

        const finishedChallenge = {
          ...challenge,
          status: 'FINISHED',
          liveScore: effectiveScore,
          winnerId,
          scoreSummary: summary || challenge.scoreSummary || '',
          eloDeltaA: Number(deltaA) || 0,
          eloDeltaB: Number(deltaB) || 0,
          finishedAt: new Date().toISOString(),
        };

        const playerA = playersRef.current.find((p) => p.id === challenge.playerAId);
        const playerB = playersRef.current.find((p) => p.id === challenge.playerBId);

        const getCatRankIndex = (pts) => {
          const cat = PlayersData.getCategoryByPoints(pts);
          return (PlayersData.CATEGORIES_SCALE || []).findIndex((c) => c.id === cat?.id);
        };

        const buildUpdatedPlayer = (p, opponent, isA) => {
          if (!p) return null;
          const won = p.id === winnerId;
          const computedPoints = isA
            ? Number.isFinite(Number(newPointsA))
              ? Number(newPointsA)
              : Math.max(0, (Number(p.points) || 1200) + (Number(deltaA) || 0))
            : Number.isFinite(Number(newPointsB))
              ? Number(newPointsB)
              : Math.max(0, (Number(p.points) || 1200) + (Number(deltaB) || 0));

          const nextStreak = won ? (Number(p.streak) || 0) + 1 : 0;
          const nextCalib = Math.min(
            Engine.ELO_CONFIG?.CALIBRATION_MATCHES || 5,
            (Number(p.calibrationPlayed) || 0) + 1
          );

          const ledgerItems = [];
          let totalAwardedGems = 0;

          if (isOfficial && won) {
            // 1. Gemas por victoria oficial en cancha (hasta +10 Estándar / +25 VIP con 6-0, 6-0)
            const matchGems = calculateMatchVictoryGems(
              effectiveScore,
              Boolean(p.isVip),
              Boolean(isWalkover)
            );
            if (matchGems.awarded > 0) {
              totalAwardedGems += matchGems.awarded;
              ledgerItems.push({
                type: 'credit',
                amount: matchGems.awarded,
                title: matchGems.isDoubleBagel
                  ? 'Victoria perfecta 6-0, 6-0'
                  : 'Victoria oficial en cancha',
                detail: `${matchGems.tierLabel} · ${finishedChallenge.scoreSummary}`,
              });
            }

            // 2. Bono Mata Gigantes (victoria ante rival de categoría superior)
            if (!isWalkover && opponent) {
              const myCatIdx = getCatRankIndex(p.points);
              const oppCatIdx = getCatRankIndex(opponent.points);
              if (myCatIdx >= 0 && oppCatIdx > myCatIdx) {
                const giantBonus = p.isVip ? 25 : 10;
                totalAwardedGems += giantBonus;
                ledgerItems.push({
                  type: 'credit',
                  amount: giantBonus,
                  title: 'Bono Mata Gigantes',
                  detail: `Victoria ante categoría superior (${finishedChallenge.scoreSummary})`,
                });
              }
            }

            // 3. Bono por racha de 3+ victorias seguidas
            if (!isWalkover && nextStreak >= 3) {
              const streakBonus = p.isVip ? 13 : 5;
              totalAwardedGems += streakBonus;
              ledgerItems.push({
                type: 'credit',
                amount: streakBonus,
                title: `Bono por racha (${nextStreak} seguidas)`,
                detail: `Marcador ${finishedChallenge.scoreSummary}`,
              });
            }
          }

          return {
            updated: {
              ...p,
              points: computedPoints,
              wins: (Number(p.wins) || 0) + (won ? 1 : 0),
              losses: (Number(p.losses) || 0) + (won ? 0 : 1),
              streak: nextStreak,
              calibrationPlayed: nextCalib,
              rankTrend: won ? Math.max(1, (Number(p.rankTrend) || 0) + 1) : -1,
              gems: (Number(p.gems) || 0) + totalAwardedGems,
              weeklyGemsEarned: (Number(p.weeklyGemsEarned) || 0) + totalAwardedGems,
            },
            totalAwardedGems,
            ledgerItems,
          };
        };

        const resA = buildUpdatedPlayer(playerA, playerB, true);
        const resB = buildUpdatedPlayer(playerB, playerA, false);

        const nextPlayersList = playersRef.current
          .map((p) => {
            if (resA && p.id === resA.updated.id) return resA.updated;
            if (resB && p.id === resB.updated.id) return resB.updated;
            return p;
          })
          .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));

        setChallenges((prev) =>
          prev.map((c) => (c.id === challenge.id ? finishedChallenge : c))
        );
        setPlayers(nextPlayersList);

        await Promise.all([
          upsertCloudChallenge(finishedChallenge),
          resA ? upsertCloudPlayer(resA.updated) : Promise.resolve(),
          resB ? upsertCloudPlayer(resB.updated) : Promise.resolve(),
        ]);

        if (resA?.ledgerItems?.length) {
          for (const entry of resA.ledgerItems) {
            await appendGemLedger(entry, resA.updated.id);
          }
        }
        if (resB?.ledgerItems?.length) {
          for (const entry of resB.ledgerItems) {
            await appendGemLedger(entry, resB.updated.id);
          }
        }

        const winnerGems =
          resA && resA.updated.id === winnerId
            ? resA.totalAwardedGems
            : resB && resB.updated.id === winnerId
              ? resB.totalAwardedGems
              : 0;

        sendPushNotification({
          targetPlayerIds: resolvePushRecipients(
            [challenge.playerAId, challenge.playerBId],
            playersRef.current
          ),
          title: 'Marcador oficial confirmado',
          message: `Resultado final ${finishedChallenge.scoreSummary}${
            winnerGems > 0 ? ` (+${winnerGems} 💎 para el ganador)` : ''
          }. Tu ranking ya se actualizó.`,
          path: '/',
        });

        setDismissedScoreIds((prev) => prev.filter((id) => id !== challenge.id));
        setBusyActionId(null);

        // Salto automático directo a tu posición en el Ranking + centrado FLIP
        if (
          autoJumpToRanking &&
          isOfficial &&
          currentUserId &&
          (challenge.playerAId === currentUserId || challenge.playerBId === currentUserId)
        ) {
          const postOrdered = sortPlayersForOfficialRanking(nextPlayersList);
          const oldRank = preRankMap[currentUserId];
          const newRankIdx = postOrdered.findIndex((p) => p.id === currentUserId);
          const newRank = newRankIdx >= 0 ? newRankIdx + 1 : null;
          const myRes =
            resA && resA.updated.id === currentUserId
              ? resA
              : resB && resB.updated.id === currentUserId
                ? resB
                : null;
          const gemsSuffix =
            myRes && myRes.totalAwardedGems > 0 ? ` y sumaste +${myRes.totalAwardedGems} 💎` : '';

          window.setTimeout(() => {
            setActiveTab('ranking');
            focusMyPositionInRanking(newRank);

            if (oldRank && newRank && newRank < oldRank) {
              showToast(`¡Subiste al puesto #${newRank}${gemsSuffix}!`, 'success');
            } else if (oldRank && newRank && newRank > oldRank) {
              showToast(`Tu posición actualizó al puesto #${newRank} en el Ranking.`, 'info');
            } else if (newRank) {
              showToast(`Mantienes el puesto #${newRank} en el Ranking${gemsSuffix}.`, 'success');
            }
          }, 260);
        }
      });

      if (lockRes.locked) {
        showToast('Ya estamos procesando este marcador, espera un segundo...', 'info');
      }
    },
    [appendGemLedger, currentUserId, focusMyPositionInRanking, showToast]
  );

  /* Doble confirmación de marcador */
  const handleFinalizeMatch = useCallback(
    async ({ challenge, eloResult, liveScore, isWalkover = false }) => {
      if (!challenge || !eloResult?.ok) return;

      const isParticipant =
        currentUser?.id &&
        (challenge.playerAId === currentUser.id || challenge.playerBId === currentUser.id);

      if (!isParticipant && !effectiveIsAdmin) {
        showToast('Solo los contendientes o el Comité pueden cargar resultados.', 'warning');
        return;
      }

      const canFinalizeImmediately =
        effectiveIsAdmin ||
        (challenge.status === 'SCORE_PROPOSED' &&
          challenge.proposedBy &&
          challenge.proposedBy !== currentUser?.id);

      if (canFinalizeImmediately) {
        await applyOfficialMatchResult({
          challenge,
          winnerSide: eloResult.winnerSide,
          summary: eloResult.summary,
          deltaA: eloResult.deltaA,
          deltaB: eloResult.deltaB,
          newPointsA: eloResult.newPointsA,
          newPointsB: eloResult.newPointsB,
          liveScore,
          isWalkover: Boolean(isWalkover),
          autoJumpToRanking: true,
        });
        return;
      }

      await runWithLock(`propose-score-${challenge.id}`, async () => {
        const winnerId = eloResult.winnerSide === 'A' ? challenge.playerAId : challenge.playerBId;
        const proposedChallenge = {
          ...challenge,
          status: 'SCORE_PROPOSED',
          proposedBy: currentUser?.id || '',
          winnerId,
          scoreSummary: eloResult.summary,
          eloDeltaA: eloResult.deltaA,
          eloDeltaB: eloResult.deltaB,
          liveScore: {
            ...(liveScore || challenge.liveScore || {}),
            _meta: {
              proposedAt: new Date().toISOString(),
              proposedBy: currentUser?.id || '',
              winnerSide: eloResult.winnerSide,
              newPointsA: eloResult.newPointsA,
              newPointsB: eloResult.newPointsB,
              isWalkover: Boolean(isWalkover),
            },
          },
        };

        setChallenges((prev) =>
          prev.map((c) => (c.id === challenge.id ? proposedChallenge : c))
        );
        await upsertCloudChallenge(proposedChallenge);

        const rivalId =
          currentUser?.id === challenge.playerAId ? challenge.playerBId : challenge.playerAId;
        sendPushNotification({
          targetPlayerIds: resolvePushRecipients([rivalId], playersRef.current),
          title: 'Confirma tu marcador en TOTAL TENIS',
          message: `${currentUser?.name || 'Tu rival'} registró ${eloResult.summary}. Ábrelo para confirmar o impugnar.`,
          path: '/',
        });

        showToast(
          'Marcador enviado a tu rival. Cuando lo confirme (o tras 24h) se actualizarán puntos y Gemas.',
          'success'
        );
      });
    },
    [currentUser, effectiveIsAdmin, applyOfficialMatchResult, showToast]
  );

  const handleConfirmProposedScore = useCallback(
    async (ch) => {
      if (!ch || ch.status !== 'SCORE_PROPOSED') return;
      const meta = ch.liveScore?._meta || {};
      const winnerSide = meta.winnerSide || (ch.winnerId === ch.playerAId ? 'A' : 'B');

      await applyOfficialMatchResult({
        challenge: ch,
        winnerSide,
        summary: ch.scoreSummary,
        deltaA: ch.eloDeltaA,
        deltaB: ch.eloDeltaB,
        newPointsA: meta.newPointsA,
        newPointsB: meta.newPointsB,
        liveScore: ch.liveScore,
        isWalkover: Boolean(meta.isWalkover),
        autoJumpToRanking: true,
      });
      triggerHaptic('success');
    },
    [applyOfficialMatchResult]
  );

  const handleDisputeProposedScore = useCallback(
    async (ch) => {
      if (!ch) return;
      await runWithLock(`dispute-score-${ch.id}`, async () => {
        const updated = {
          ...ch,
          status: 'DISPUTED',
          disputeNote: `Impugnado por ${currentUser?.name || 'el rival'} el ${formatPeruDate(
            new Date(),
            true
          )}`,
        };
        setChallenges((prev) => prev.map((c) => (c.id === ch.id ? updated : c)));
        setDismissedScoreIds((prev) => [...prev, ch.id]);
        await upsertCloudChallenge(updated);

        const otherId =
          currentUser?.id === ch.playerAId ? ch.playerBId : ch.playerAId;
        sendPushNotification({
          targetPlayerIds: resolvePushRecipients([otherId], playersRef.current),
          title: 'Marcador en revisión',
          message: `${currentUser?.name || 'Tu rival'} observó el resultado ${ch.scoreSummary}. El Comité revisará el caso.`,
          path: '/',
        });

        showToast('Marcador impugnado. El Comité revisará el partido sin mover tus puntos.', 'warning');
      });
    },
    [currentUser, showToast]
  );

  /* Reto directo en 1 toque desde Ranking, Ficha de Rival o Cara a Cara (H2H) */
  const handleQuickChallengeFromAnywhere = useCallback(
    (rival) => {
      if (!rival?.id) return;
      if (!currentUser) {
        showToast('Inicia sesión para desafiar a este jugador.', 'info');
        openAuthSheet('login');
        return;
      }
      if (currentUser.isTutorOnly) {
        triggerHaptic('warning');
        showToast(
          'Tu cuenta está en modo Solo Padre/Tutor. Cambia a la subcuenta de tu hijo en Perfil para lanzar retos.',
          'info'
        );
        return;
      }
      if (rival.id === currentUser.id) {
        showToast('No puedes enviarte un desafío a ti mismo.', 'info');
        return;
      }

      triggerHaptic('medium');
      setInspectPlayerId(null);
      setH2hModal({ open: false, playerA: null, playerB: null });
      setQuickChallengeRival(rival);
      setActiveTab('retos');
      scrollMainToTop();
    },
    [currentUser, openAuthSheet, scrollMainToTop, showToast]
  );

  const handleRequestTournamentInscription = useCallback(
    async ({ tournamentId, playerId }) => {
      const target = tournaments.find((t) => t.id === tournamentId);
      if (!target || !playerId) return;
      const updated = {
        ...target,
        pendingPaymentIds: Array.from(new Set([...(target.pendingPaymentIds || []), playerId])),
      };
      setTournaments((prev) => prev.map((t) => (t.id === tournamentId ? updated : t)));
      try {
        await upsertCloudTournament(updated);
      } catch (err) {
        console.error('[TOTAL TENIS] Error guardando preinscripción:', err);
      }
    },
    [tournaments]
  );

  const handleAdminApproveTournamentPayment = useCallback(
    async (tournamentId, playerId) => {
      const target = tournaments.find((t) => t.id === tournamentId);
      if (!target) return;
      const updated = {
        ...target,
        pendingPaymentIds: (target.pendingPaymentIds || []).filter((id) => id !== playerId),
        participantsIds: Array.from(new Set([...(target.participantsIds || []), playerId])),
      };
      setTournaments((prev) => prev.map((t) => (t.id === tournamentId ? updated : t)));
      try {
        await upsertCloudTournament(updated);
        sendPushNotification({
          targetPlayerIds: resolvePushRecipients([playerId], playersRef.current),
          title: '¡Cupo de torneo confirmado!',
          message: `Tu inscripción en ${target.name} fue validada. Ya figuras en el cuadro oficial.`,
          path: '/',
        });
      } catch (err) {
        console.error('[TOTAL TENIS] Error aprobando torneo:', err);
      }
      showToast('Pago validado. El jugador ya figura inscrito oficialmente en el cuadro.', 'success');
    },
    [tournaments, showToast]
  );

  const handleAdminUpdateBracketResult = useCallback(
    async (tournamentId, matchId, resultObj) => {
      const target = tournaments.find((t) => t.id === tournamentId);
      if (!target) return;
      const updated = {
        ...target,
        bracketResults: { ...(target.bracketResults || {}), [matchId]: resultObj },
      };
      setTournaments((prev) => prev.map((t) => (t.id === tournamentId ? updated : t)));
      try {
        await upsertCloudTournament(updated);
      } catch (err) {
        console.error('[TOTAL TENIS] Error guardando llave:', err);
      }
    },
    [tournaments]
  );

  /* Reporte climático anti-farmeo (+3 Gemas, 1/24h usuario, 3h sede) */
  const handleReportClubWeather = useCallback(
    async ({ clubId, conditionKey }) => {
      if (!clubId || !conditionKey) return;

      await runWithLock(`weather-${clubId}`, async () => {
        setClubs((prev) =>
          prev.map((c) =>
            c.id === clubId
              ? {
                  ...c,
                  climaBase: {
                    ...(c.climaBase || {}),
                    conditionKey,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : c
          )
        );

        try {
          const rpcRes = await submitWeatherReportRpc({
            playerId: currentUserId,
            clubId,
            conditionKey,
          });

          const awarded = Number(rpcRes?.gems_awarded) || 0;
          if (currentUserId && awarded > 0) {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === currentUserId
                  ? { ...p, gems: (Number(p.gems) || 0) + awarded }
                  : p
              )
            );
            setGemLedger((prev) => [
              {
                id: `lg-${Date.now()}`,
                type: 'credit',
                amount: awarded,
                title: 'Reporte de estado en sede',
                date: formatPeruDate(new Date(), false) || 'Hoy',
                detail: `Estado actualizado (${conditionKey})`,
              },
              ...prev,
            ]);
          }
          if (rpcRes?.message) {
            showToast(rpcRes.message, awarded > 0 ? 'success' : 'info');
          }
        } catch (err) {
          console.error('[TOTAL TENIS] Error en reporte de clima:', err);
          const clubObj = clubs.find((c) => c.id === clubId);
          if (clubObj) {
            upsertCloudClub({
              ...clubObj,
              climaBase: { ...(clubObj.climaBase || {}), conditionKey },
            }).catch(() => {});
          }
          showToast('Estado de cancha actualizado.', 'info');
        }
      });
    },
    [currentUserId, clubs, showToast]
  );

  const handleDeductGemsForUnlock = useCallback(
    async ({ gemsCost, patchPlayer, ledgerTitle, ledgerDetail }) => {
      if (!currentUserId) return;
      const target = playersRef.current.find((p) => p.id === currentUserId);
      if (!target) return;

      const cost = Math.max(0, Number(gemsCost) || 0);
      const nextGems = Math.max(0, (Number(target.gems) || 0) - cost);
      const extraPatch =
        typeof patchPlayer === 'function' ? patchPlayer(target) : patchPlayer || {};
      const updated = { ...target, gems: nextGems, ...extraPatch };

      setPlayers((prev) => prev.map((p) => (p.id === currentUserId ? updated : p)));

      try {
        await upsertCloudPlayer(updated);
      } catch (err) {
        console.error('[TOTAL TENIS] Error guardando canje de gemas:', err);
      }

      if (cost > 0) {
        appendGemLedger(
          {
            type: 'debit',
            amount: cost,
            title: ledgerTitle,
            detail: ledgerDetail,
          },
          currentUserId
        );
      }
    },
    [currentUserId, appendGemLedger]
  );

  const handleRequestVipUpgrade = useCallback(
    ({ playerId }) => {
      handleUpdatePlayer(playerId, { vipStatus: 'PENDING_PAYMENT' });
    },
    [handleUpdatePlayer]
  );

  const handleAdminApproveVip = useCallback(
    async (playerId, enableVip, bonusGems = 0) => {
      const target = playersRef.current.find((p) => p.id === playerId);
      if (!target) return;

      const updated = {
        ...target,
        isVip: enableVip,
        vipStatus: enableVip ? 'ACTIVE' : 'STANDARD',
        gems: (Number(target.gems) || 0) + (enableVip ? bonusGems : 0),
      };
      setPlayers((prev) => prev.map((p) => (p.id === playerId ? updated : p)));

      try {
        await upsertCloudPlayer(updated);
        if (enableVip && bonusGems > 0) {
          appendGemLedger(
            {
              type: 'credit',
              amount: bonusGems,
              title: 'Activación Pase Socio VIP',
              detail: 'Bono mensual acreditado',
            },
            playerId
          );
        }
        sendPushNotification({
          targetPlayerIds: resolvePushRecipients([playerId], playersRef.current),
          title: enableVip ? '¡Bienvenido a Socio VIP!' : 'Actualización de membresía',
          message: enableVip
            ? `Tu Pase Socio VIP está activo con +${bonusGems} Gemas acreditadas.`
            : 'Tu membresía VIP fue actualizada por el Comité.',
          path: '/',
        });
      } catch (err) {
        console.error('[TOTAL TENIS] Error aprobando VIP:', err);
      }

      showToast(
        enableVip
          ? `Pase Socio VIP activado (+${bonusGems} Gemas acreditadas).`
          : 'Membresía VIP desactivada.',
        'success'
      );
    },
    [appendGemLedger, showToast]
  );

  const handleRegisterComplete = useCallback(
    async (newPlayer) => {
      if (!newPlayer?.id) return;
      const cleanPlayer = {
        ...newPlayer,
        whatsapp: normalizePeruPhone(newPlayer.whatsapp || ''),
        isDemo: false,
      };
      setPlayers((prev) =>
        mergeListById(prev, cleanPlayer, true).sort(
          (a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)
        )
      );
      setCurrentUserId(cleanPlayer.id);
      setTutorParentId(cleanPlayer.isTutelado ? cleanPlayer.tutorId : cleanPlayer.id);
      setIsAdminSession(Boolean(cleanPlayer.isAdmin));
      setActiveTab('perfil');
      linkOneSignalUser(cleanPlayer.id);
      requestPushPermission();

      try {
        await upsertCloudPlayer(cleanPlayer);
        if (Number(cleanPlayer.gems) > 0) {
          appendGemLedger(
            {
              type: 'credit',
              amount: Number(cleanPlayer.gems),
              title: 'Bono de bienvenida',
              detail: 'Registro en TOTAL TENIS',
            },
            cleanPlayer.id
          );
        }
      } catch (err) {
        console.error('[TOTAL TENIS] Error guardando nuevo jugador:', err);
      }

      try {
        if (!window.localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
          window.setTimeout(() => setTutorialOpen(true), 650);
        }
      } catch {
        // continuar
      }
    },
    [appendGemLedger]
  );

  const handleLogout = useCallback(async () => {
    triggerHaptic('medium');
    clearSavedLocalSession();
    await signOutCloudAccount();
    setCurrentUserId(null);
    setTutorParentId(null);
    setIsAdminSession(false);
    setActivePartner(null);
    setQuickChallengeRival(null);
    setGemLedger([]);
    setDismissedIncomingIds([]);
    setDismissedScoreIds([]);
    setInspectPlayerId(null);
    setAdminModalOpen(false);
    setPartnerModalOpen(false);
    setActiveTab((prev) => (prev === 'perfil' ? 'retos' : prev));
    showToast('Sesión cerrada. Puedes volver a entrar cuando quieras.', 'info');
  }, [showToast]);

  const popupChallenger = popupChallenge
    ? players.find((p) => p.id === popupChallenge.playerAId)
    : null;

  const scoreProposer = scoreConfirmChallenge
    ? players.find((p) => p.id === scoreConfirmChallenge.proposedBy)
    : null;
  const scoreWinner = scoreConfirmChallenge
    ? players.find((p) => p.id === scoreConfirmChallenge.winnerId)
    : null;

const popupChallengerPhone = getEffectiveContactPhone(popupChallenger, players);
  const popupWaText = popupChallenger?.isTutelado
    ? `Hola ${popupChallenger.tutorName || 'Padre/Madre'}, recibí el reto de ${popupChallenger.name} en TOTAL TENIS para ${popupChallenge?.clubName || ''} (${popupChallenge?.dateLabel || ''} ${popupChallenge?.timeLabel || ''}). ¿Coordinamos otra hora o sede?`
    : `Hola ${popupChallenger?.name || ''}, recibí tu reto en TOTAL TENIS para ${popupChallenge?.clubName || ''} (${popupChallenge?.dateLabel || ''} ${popupChallenge?.timeLabel || ''}). ¿Coordinamos otra hora o sede?`;

  return (
    <div className={`tt-app-viewport ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
      {/* 1. SPLASH SCREEN / BIENVENIDA */}
      {showSplash && (
        <SplashScreen
          theme={theme}
          isFirstVisit={isFirstVisit}
          sponsorsConfig={sponsorsConfig}
          onFinish={handleFinishSplash}
          onComplete={handleFinishSplash}
          onEnterApp={handleFinishSplash}
        />
      )}

      {/* 2. CABECERA SUPERIOR EN FLUJO REAL + MENÚ LATERAL (3 RAYITAS) */}
      <HeaderAndDrawer
        currentUser={currentUser}
        theme={theme}
        sunlightMode={sunlightMode}
        activeTab={activeTab}
        unreadNoticesCount={unreadNoticesCount}
        sponsorsConfig={sponsorsConfig}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onToggleSunlight={() => {}}
        onNavigateTab={handleSelectTab}
        onOpenProShop={() => setProShopModal({ open: true, mode: 'shop' })}
        onOpenShop={() => setProShopModal({ open: true, mode: 'shop' })}
        onOpenGemsVault={() => setProShopModal({ open: true, mode: 'vault' })}
        onOpenVault={() => setProShopModal({ open: true, mode: 'vault' })}
        onOpenNotices={(tab = 'notificaciones') => setNoticesModal({ open: true, tab })}
        onOpenVipScale={(tab = 'vip') => setVipScaleModal({ open: true, tab })}
        onOpenStories={(payload = null) => setStoriesModal({ open: true, payload })}
        onOpenAuth={openAuthSheet}
        onOpenPartnerPortal={() => {
          if (activePartner || effectiveIsAdmin) setPartnerModalOpen(true);
          else openAuthSheet('partner');
        }}
        onOpenLegal={(section = 'reclamaciones') => setLegalModal({ open: true, section })}
        onOpenTutorial={() => setTutorialOpen(true)}
        onSecretAdminTrigger={() => setAdminModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 3. CINTA SUPERIOR AISLADA */}
      <SlimTickerBar
        onSelectTab={handleSelectTab}
        onOpenMaster={() => handleOpenTournamentsAt('master')}
        onOpenShop={() => setProShopModal({ open: true, mode: 'shop' })}
      />

      {/* 4. CONTENEDOR CENTRAL SCROLLABLE */}
      <main ref={scrollContainerRef} className="tt-main-scroll">
        <div className="tt-main-inner">
          <div key={activeTab} className="tt-view-transition">
            {activeTab === 'retos' && (
              <RetosView
                players={activePlayers}
                clubs={activeClubs}
                challenges={challenges}
                currentUser={currentUser}
                isAdmin={effectiveIsAdmin}
                theme={theme}
                sunlightMode={sunlightMode}
                quickChallengeRival={quickChallengeRival}
                onConsumeQuickChallenge={handleConsumeQuickChallenge}
                onCreateChallenge={handleCreateChallenge}
                onUpdateChallenge={handleUpdateChallenge}
                onFinalizeMatch={handleFinalizeMatch}
                onOpenPlayerProfile={(p) => setInspectPlayerId(p.id)}
                onOpenStoriesWithMatch={(payload) => setStoriesModal({ open: true, payload })}
                onOpenAuth={openAuthSheet}
                onGoToTournaments={handleOpenTournamentsAt}
                onNotify={showToast}
              />
            )}

            {activeTab === 'ranking' && (
              <RankingView
                players={activePlayers}
                clubs={activeClubs}
                challenges={challenges}
                seasonSnapshots={seasonSnapshots}
                currentUser={currentUser}
                theme={theme}
                sunlightMode={sunlightMode}
                onOpenPlayerProfile={(p) => setInspectPlayerId(p.id)}
                onOpenHeadToHead={(rival) =>
                  setH2hModal({ open: true, playerA: currentUser, playerB: rival })
                }
                onQuickChallenge={handleQuickChallengeFromAnywhere}
                onGoToTournaments={handleOpenTournamentsAt}
              />
            )}

            {activeTab === 'torneos' && (
              <TorneosView
                players={activePlayers}
                clubs={activeClubs}
                tournaments={tournaments}
                seasonSnapshots={seasonSnapshots}
                currentUser={currentUser}
                isAdmin={effectiveIsAdmin}
                initialSubTab={torneosInitialSubTab}
                theme={theme}
                sunlightMode={sunlightMode}
                onRequestTournamentInscription={handleRequestTournamentInscription}
                onAdminApproveInscription={handleAdminApproveTournamentPayment}
                onAdminUpdateBracketResult={handleAdminUpdateBracketResult}
                onOpenPlayerProfile={(p) => setInspectPlayerId(p.id)}
                onOpenHeadToHead={(rival) =>
                  setH2hModal({ open: true, playerA: currentUser, playerB: rival })
                }
                onOpenAuth={openAuthSheet}
                onNotify={showToast}
              />
            )}

            {activeTab === 'sedes' && (
              <SedesView
                clubs={activeClubs}
                coaches={coaches}
                currentUser={currentUser}
                theme={theme}
                sunlightMode={sunlightMode}
                onReportClubWeather={handleReportClubWeather}
                onUnlockMasterclassVideo={({ videoId, gemsCost, title }) =>
                  handleDeductGemsForUnlock({
                    gemsCost,
                    patchPlayer: (p) => ({
                      unlockedVideos: Array.from(new Set([...(p.unlockedVideos || []), videoId])),
                    }),
                    ledgerTitle: `Masterclass: ${title}`,
                    ledgerDetail: 'Video en cancha desbloqueado',
                  })
                }
                onOpenPartnerPortal={() => {
                  if (activePartner || effectiveIsAdmin) setPartnerModalOpen(true);
                  else openAuthSheet('partner');
                }}
                onOpenVipCard={() => setVipScaleModal({ open: true, tab: 'vip' })}
                onOpenAuth={openAuthSheet}
                onNotify={showToast}
              />
            )}

            {activeTab === 'perfil' && (
              <PerfilView
                player={currentUser}
                currentUser={currentUser}
                players={activePlayers}
                clubs={activeClubs}
                challenges={challenges}
                seasonSnapshots={seasonSnapshots}
                theme={theme}
                sunlightMode={sunlightMode}
                readOnly={false}
                activeTutorParent={activeTutorParent}
                onUpdateProfile={handleUpdatePlayer}
                onCreateTutelado={handleCreateTutelado}
                onSwitchActiveProfile={handleSwitchActiveProfile}
                onStartEmancipation={handleStartEmancipation}
                onUnlockScenario={({ scenarioId, gemsCost }) =>
                  handleDeductGemsForUnlock({
                    gemsCost,
                    patchPlayer: (p) => ({
                      unlockedScenarios: Array.from(
                        new Set([...(p.unlockedScenarios || ['default']), scenarioId])
                      ),
                    }),
                    ledgerTitle: 'Fondo de Perfil',
                    ledgerDetail: `Escenario "${scenarioId}" desbloqueado`,
                  })
                }
                onOpenVipCard={() => setVipScaleModal({ open: true, tab: 'vip' })}
                onOpenHeadToHead={(rival) =>
                  setH2hModal({ open: true, playerA: currentUser, playerB: rival })
                }
                onOpenStoriesWithMatch={(payload) => setStoriesModal({ open: true, payload })}
                onQuickChallenge={handleQuickChallengeFromAnywhere}
                onOpenAuth={openAuthSheet}
                onNotify={showToast}
              />
            )}
          </div>

          <InstitutionalFooter
            sponsorsConfig={sponsorsConfig}
            onNavigateTab={(tabId) => {
              if (tabId === 'torneos') handleOpenTournamentsAt('master');
              else handleSelectTab(tabId);
            }}
            onOpenProShop={(mode) => setProShopModal({ open: true, mode })}
            onOpenVipScale={(tab) => setVipScaleModal({ open: true, tab })}
            onOpenStories={() => setStoriesModal({ open: true, payload: null })}
            onOpenNews={(tab) => setNoticesModal({ open: true, tab })}
            onOpenPartnerPortal={() => {
              if (activePartner || effectiveIsAdmin) setPartnerModalOpen(true);
              else openAuthSheet('partner');
            }}
            onOpenLegal={(section) => setLegalModal({ open: true, section })}
            onOpenTutorial={() => setTutorialOpen(true)}
            onNotify={showToast}
          />
        </div>
      </main>

      {/* 5. BARRA DE NAVEGACIÓN INFERIOR (SELLADA INTACTA) */}
      <BottomDock
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onReselectActiveTab={scrollMainToTop}
        challengesCount={incomingPendingChallenges.length + pendingScoreConfirmations.length}
        liveMatchesCount={liveMatchesCount}
        activeTournamentsCount={activeTournamentsCount}
        theme={theme}
        sunlightMode={sunlightMode}
      />

      {/* MODAL DE FICHA DE RIVAL — 100% SOLO LECTURA (SIN TUERQUITA NI CARNET) */}
      <ModalPortal
        isOpen={Boolean(inspectedPlayer)}
        onClose={() => setInspectPlayerId(null)}
        title={inspectedPlayer?.name || 'Ficha de Jugador'}
        subtitle={
          inspectedPlayer
            ? `${PlayersData.getCategoryByPoints(inspectedPlayer.points).name} · ${
                inspectedPlayer.clubName || 'Independiente'
              }`
            : ''
        }
        icon={<IconBadge name="users" variant="emerald" size={38} />}
        isWide
      >
        {inspectedPlayer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentUser && currentUser.id !== inspectedPlayer.id && (
              <div className="tt-rival-seg-bar">
                <span className="tt-rival-seg-active">Perfil & Bio</span>
                <button
                  type="button"
                  className="tt-rival-seg-btn"
                  onClick={() => {
                    const target = inspectedPlayer;
                    setInspectPlayerId(null);
                    setH2hModal({ open: true, playerA: currentUser, playerB: target });
                  }}
                >
                  Cara a Cara (H2H) →
                </button>
              </div>
            )}

            <PerfilView
              player={inspectedPlayer}
              currentUser={null}
              players={activePlayers}
              clubs={activeClubs}
              challenges={challenges}
              seasonSnapshots={seasonSnapshots}
              theme={theme}
              sunlightMode={sunlightMode}
              readOnly={true}
              onOpenHeadToHead={
                currentUser && currentUser.id !== inspectedPlayer.id
                  ? (rival) => {
                      setInspectPlayerId(null);
                      setH2hModal({ open: true, playerA: currentUser, playerB: rival });
                    }
                  : undefined
              }
              onQuickChallenge={
                !currentUser || currentUser.id !== inspectedPlayer.id
                  ? handleQuickChallengeFromAnywhere
                  : undefined
              }
              onOpenAuth={openAuthSheet}
              onNotify={showToast}
            />
          </div>
        )}
      </ModalPortal>

      {/* POP-UP AUTOMÁTICO DE RETO ENTRANTE (WHATSAPP ENRUTADO AL TUTOR SI APLICA) */}
      <ModalPortal
        isOpen={Boolean(popupChallenge)}
        onClose={() => {
          if (popupChallenge) {
            setDismissedIncomingIds((prev) => [...prev, popupChallenge.id]);
          }
        }}
        title="¡Tienes un Nuevo Desafío!"
        subtitle="Confirmación oficial de partido · TOTAL TENIS"
        icon={<IconBadge name="challenge" variant="emerald" size={38} />}
        isTopLayer
      >
        {popupChallenge && (
          <div className="tt-incoming-popup-stack">
            <div className="tt-ip-rival-card">
              <SmartImage
                src={popupChallenger?.avatar}
                alt={popupChallenger?.name || 'Retador'}
                initials={popupChallenger?.name || 'TT'}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  border: '2.5px solid #00DC7D',
                }}
              />
              <div>
                <strong>{popupChallenger?.name || 'Un rival del circuito'}</strong>
                <span>
                  {popupChallenge.clubName} · {popupChallenge.dateLabel} ·{' '}
                  {popupChallenge.timeLabel}
                </span>
                <small>
                  {popupChallenge.mode === 'Amistoso'
                    ? 'Partido Amistoso'
                    : 'Partido Oficial por puntos'}
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="tt-btn tt-btn-primary"
                onClick={() => {
                  triggerHaptic('success');
                  handleUpdateChallenge(popupChallenge.id, { status: 'SCHEDULED' });
                  setDismissedIncomingIds((prev) => [...prev, popupChallenge.id]);
                  requestPushPermission();
                  showToast('¡Desafío aceptado! Ya aparece en la Cartelera.', 'success');
                }}
              >
                Aceptar Desafío Ahora
              </button>

              {popupChallengerPhone && (
                <a
                  href={buildWhatsappLink(popupChallengerPhone, popupWaText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tt-btn tt-btn-secondary"
                  onClick={() => setDismissedIncomingIds((prev) => [...prev, popupChallenge.id])}
                >
                  <TTIcon name="whatsapp" size={17} />
                  {popupChallenger?.isTutelado
                    ? 'Contraproponer vía WhatsApp Tutor'
                    : 'Contraproponer Hora / Sede por WhatsApp'}
                </a>
              )}

              <button
                type="button"
                className="tt-btn tt-btn-ghost tt-btn-sm"
                onClick={() => setDismissedIncomingIds((prev) => [...prev, popupChallenge.id])}
              >
                Revisar más tarde
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* POP-UP DE DOBLE CONFIRMACIÓN DE MARCADOR */}
      <ModalPortal
        isOpen={Boolean(scoreConfirmChallenge)}
        onClose={() => {
          if (scoreConfirmChallenge) {
            setDismissedScoreIds((prev) => [...prev, scoreConfirmChallenge.id]);
          }
        }}
        title="Confirma el Marcador"
        subtitle="Validación oficial entre ambos jugadores"
        icon={<IconBadge name="trophy" variant="emerald" size={38} />}
        isTopLayer
      >
        {scoreConfirmChallenge && (
          <div className="tt-incoming-popup-stack">
            <div className="tt-ip-rival-card">
              <div style={{ width: '100%' }}>
                <strong>{scoreProposer?.name || 'Tu rival'} cargó el resultado</strong>
                <span>
                  {scoreConfirmChallenge.clubName} · Marcador:{' '}
                  <b style={{ color: '#00DC7D' }}>{scoreConfirmChallenge.scoreSummary}</b>
                </span>
                <small>
                  Ganador registrado: {scoreWinner?.name || 'Por confirmar'} ·{' '}
                  {isScoreReadyForAutoConfirm(scoreConfirmChallenge)
                    ? 'Plazo de 24h cumplido (listo para validar)'
                    : `Auto-validación en ${hoursLeftForAutoConfirm(scoreConfirmChallenge)}h`}
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="tt-btn tt-btn-primary"
                disabled={busyActionId === scoreConfirmChallenge.id}
                onClick={() => handleConfirmProposedScore(scoreConfirmChallenge)}
              >
                {busyActionId === scoreConfirmChallenge.id
                  ? 'Confirmando puntos...'
                  : 'Confirmar Marcador y Actualizar Puntos'}
              </button>

              {scoreConfirmChallenge.proposedBy !== currentUser?.id && (
                <button
                  type="button"
                  className="tt-btn tt-btn-secondary"
                  disabled={busyActionId === scoreConfirmChallenge.id}
                  onClick={() => handleDisputeProposedScore(scoreConfirmChallenge)}
                >
                  No estoy de acuerdo · Impugnar
                </button>
              )}

              <button
                type="button"
                className="tt-btn tt-btn-ghost tt-btn-sm"
                onClick={() =>
                  setDismissedScoreIds((prev) => [...prev, scoreConfirmChallenge.id])
                }
              >
                Revisar después
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* LOS 10 MODALES GLOBALES */}
      <ProShopAndGemsModal
        isOpen={proShopModal.open}
        initialMode={proShopModal.mode}
        onClose={() => setProShopModal((s) => ({ ...s, open: false }))}
        currentUser={currentUser}
        isAdmin={effectiveIsAdmin}
        products={products}
        clubs={activeClubs}
        gemLedger={gemLedger}
        theme={theme}
        onProductsUpdated={setProducts}
        onProShopRedeem={({ gemsSpent, productName }) =>
          handleDeductGemsForUnlock({
            gemsCost: gemsSpent,
            patchPlayer: {},
            ledgerTitle: `Pro Shop: ${productName}`,
            ledgerDetail: 'Canje en Almacén TOTAL TENIS',
          })
        }
        onOpenVipCard={() => setVipScaleModal({ open: true, tab: 'vip' })}
        onOpenAuth={openAuthSheet}
        onNotify={showToast}
      />

      <HeadToHeadModal
        isOpen={h2hModal.open}
        onClose={() => setH2hModal((s) => ({ ...s, open: false }))}
        initialPlayerA={h2hModal.playerA}
        initialPlayerB={h2hModal.playerB}
        currentUser={currentUser}
        players={activePlayers}
        clubs={activeClubs}
        challenges={challenges}
        theme={theme}
        onQuickChallenge={handleQuickChallengeFromAnywhere}
        onOpenStoriesWithMatch={(payload) => setStoriesModal({ open: true, payload })}
        onOpenPlayerProfile={(p) => setInspectPlayerId(p.id)}
      />

      <StoriesStudioModal
        isOpen={storiesModal.open}
        onClose={() => setStoriesModal({ open: false, payload: null })}
        initialPayload={storiesModal.payload}
        currentUser={currentUser}
        players={activePlayers}
        clubs={activeClubs}
        challenges={challenges}
        theme={theme}
        onNotify={showToast}
      />

      <NoticesAndNewsModal
        isOpen={noticesModal.open}
        initialTab={noticesModal.tab}
        onClose={() => setNoticesModal((s) => ({ ...s, open: false }))}
        currentUser={currentUser}
        players={activePlayers}
        clubs={activeClubs}
        challenges={challenges}
        tournaments={tournaments}
        notices={notices}
        onAcceptChallenge={(ch) => {
          handleUpdateChallenge(ch.id, { status: 'SCHEDULED' });
          showToast('¡Desafío confirmado en Cartelera!', 'success');
        }}
        onDeclineChallenge={(ch) => {
          handleUpdateChallenge(ch.id, { status: 'DECLINED' });
          showToast('Desafío declinado.', 'info');
        }}
        onMarkAllRead={() => setNotices((prev) => prev.map((n) => ({ ...n, read: true })))}
        onNavigateTab={handleSelectTab}
        onNotify={showToast}
      />

      <VipCardAndScaleModal
        isOpen={vipScaleModal.open}
        initialTab={vipScaleModal.tab}
        onClose={() => setVipScaleModal((s) => ({ ...s, open: false }))}
        currentUser={currentUser}
        clubs={activeClubs}
        theme={theme}
        onRequestVipUpgrade={handleRequestVipUpgrade}
        onOpenAuth={openAuthSheet}
        onNotify={showToast}
      />

      <LegalAndComplianceModal
        isOpen={legalModal.open}
        initialSection={legalModal.section}
        onClose={() => setLegalModal((s) => ({ ...s, open: false }))}
        currentUser={currentUser}
        complaints={complaints}
        onSubmitComplaint={async (record) => {
          try {
            const saved = await submitOfficialComplaintRpc({
              playerId: currentUser?.id || null,
              fullName: record.fullName || record.name || currentUser?.name || 'Consumidor',
              docType: record.docType || 'DNI',
              docNumber: record.docNumber || '',
              email: record.email || currentUser?.email || '',
              phone: record.phone || currentUser?.whatsapp || '',
              claimType: record.claimType || record.type || 'Reclamo',
              amount: record.amount || '',
              detail: record.detail || record.description || '',
              consumerRequest: record.consumerRequest || record.request || '',
            });
            setComplaints((prev) => [saved || record, ...prev]);
          } catch {
            setComplaints((prev) => [record, ...prev]);
          }
        }}
        onNotify={showToast}
      />

      <PartnerStudioModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        partner={activePartner}
        players={activePlayers}
        clubs={clubs}
        coaches={coaches}
        theme={theme}
        onSaveCoachChanges={(updatedCoach) => {
          if (updatedCoach?.id) {
            setCoaches((prev) => mergeListById(prev, updatedCoach, false));
          }
        }}
        onSaveClubChanges={(clubId, updatedClub) => {
          if (clubId && updatedClub) {
            setClubs((prev) =>
              prev.map((c) => (c.id === clubId ? { ...c, ...updatedClub } : c))
            );
          }
        }}
        onUpdateClubWeather={handleReportClubWeather}
        onNotify={showToast}
      />

      <AdminSuiteModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        isUnlockedInitially={effectiveIsAdmin}
        players={players}
        clubs={clubs}
        challenges={challenges}
        tournaments={tournaments}
        complaints={complaints}
        seasonSnapshots={seasonSnapshots}
        sponsorsConfig={sponsorsConfig}
        onUnlockAdminSession={(val) => setIsAdminSession(Boolean(val))}
        onSwitchSandboxUser={(p) => {
          setCurrentUserId(p.id);
          setTutorParentId(p.isTutelado ? p.tutorId : p.id);
          showToast(`Modo pruebas activo: viendo la app como ${p.name}.`, 'info');
        }}
        onAdminUpdatePlayer={handleUpdatePlayer}
        onAdminDeletePlayer={async (pid) => {
          setPlayers((prev) => prev.filter((p) => p.id !== pid));
          if (currentUserId === pid) {
            clearSavedLocalSession();
            setCurrentUserId(null);
          }
          try {
            await deleteCloudPlayer(pid);
          } catch (err) {
            console.error('[TOTAL TENIS] Error eliminando jugador:', err);
          }
          showToast('Cuenta eliminada definitivamente.', 'info');
        }}
        onAdminPurgeDemoPlayers={async () => {
          try {
            const removed = await purgeDemoPlayers();
            setPlayers((prev) => prev.filter((p) => !p.isDemo));
            showToast(`Se limpiaron ${removed} cuentas de prueba.`, 'success');
          } catch {
            showToast('No se pudieron limpiar las cuentas de prueba.', 'warning');
          }
        }}
        onAdminApproveVip={handleAdminApproveVip}
        onAdminApproveTournamentPayment={handleAdminApproveTournamentPayment}
        onAdminCreateTournament={async (newT) => {
          setTournaments((prev) => [newT, ...prev]);
          try {
            await upsertCloudTournament(newT);
          } catch (err) {
            console.error('[TOTAL TENIS] Error creando torneo:', err);
          }
        }}
        onAdminCloseSeason={async (nextSnap) => {
          setSeasonSnapshots(nextSnap);
          try {
            await saveCloudSetting('season_snapshots', nextSnap);
          } catch {
            // continuar
          }
        }}
        onAdminResetFloorPoints={handleAdminResetFloorPoints}
        onAdminResolveDispute={async (chId, action) => {
          const target = challenges.find((c) => c.id === chId);
          if (!target) return;
          if (action === 'CANCEL') {
            await handleUpdateChallenge(chId, { status: 'DECLINED' });
            showToast('Encuentro anulado sin impacto en puntos.', 'info');
          } else if (action === 'CONFIRM') {
            await handleConfirmProposedScore({ ...target, status: 'SCORE_PROPOSED' });
          }
        }}
        onAdminToggleClubActive={async (clubId, nextActive) => {
          const target = clubs.find((c) => c.id === clubId);
          if (!target) return;
          const updated = { ...target, active: nextActive };
          setClubs((prev) => prev.map((c) => (c.id === clubId ? updated : c)));
          try {
            await upsertCloudClub(updated);
          } catch {
            // continuar
          }
        }}
        onAdminSaveSponsors={async (cfg) => {
          setSponsorsConfig(cfg);
          try {
            await saveCloudSetting('sponsors_config', cfg);
          } catch {
            // continuar
          }
        }}
        onAdminPurgeArchivedMatches={async () => {
          const finishedIds = challenges.filter((c) => c.status === 'FINISHED').map((c) => c.id);
          setChallenges((prev) => prev.filter((c) => c.status !== 'FINISHED'));
          await Promise.all(finishedIds.map((id) => deleteCloudChallenge(id).catch(() => {})));
        }}
        onNotify={showToast}
      />

      <OnboardingTutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onNavigateTab={handleSelectTab}
      />

      {/* AUTH AL FINAL DEL ÁRBOL + CAPA MÁXIMA isAuthLayer PARA SUBIR SIEMPRE ENCIMA */}
      <AuthAndOnboardingModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        isAuthLayer={true}
        onClose={() => setAuthModal((s) => ({ ...s, open: false }))}
        players={players}
        clubs={activeClubs}
        onLoginSuccess={(p) => {
          if (!p?.id) return;
          setPlayers((prev) => mergeListById(prev, p, false));
          setCurrentUserId(p.id);
          setTutorParentId(p.isTutelado ? p.tutorId : p.id);
          setIsAdminSession(Boolean(p.isAdmin));
          linkOneSignalUser(p.id);
          requestPushPermission();
        }}
        onRegisterComplete={handleRegisterComplete}
        onResetPassword={(playerId, newPass) => handleUpdatePlayer(playerId, { password: newPass })}
        onPartnerLoginSuccess={(partnerObj) => {
          setActivePartner(partnerObj);
          setPartnerModalOpen(true);
        }}
        onOpenLegalModal={(section) => setLegalModal({ open: true, section })}
        onNotify={showToast}
      />

      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`tt-global-toast is-${toast.type}`}
          onClick={() => setToast(null)}
        >
          <span className="tt-toast-dot" aria-hidden="true" />
          <span>{toast.message}</span>
        </div>
      )}

      {!cloudSynced && (
        <div className="tt-cloud-sync-pill" aria-hidden="true">
          Sincronizando en vivo...
        </div>
      )}

      <style>{`
        .tt-app-viewport {
          position: fixed;
          inset: 0;
          height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--tt-bg, #160428);
          color: var(--tt-text, #FAF9F5);
        }

        .tt-slim-ticker-bar {
          flex-shrink: 0;
          padding: 0 10px 6px;
          display: flex;
          justify-content: center;
          z-index: 20;
        }
        .tt-slim-ticker-btn {
          width: 100%;
          max-width: var(--tt-container-max, 760px);
          min-height: 29px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.11);
          border: 1px solid rgba(0, 220, 125, 0.32);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: var(--tt-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 0.71rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          transition: transform 160ms cubic-bezier(0.22, 1.35, 0.36, 1);
        }
        .tt-slim-ticker-btn:active {
          transform: scale(0.98);
        }
        .tt-app-viewport.is-light .tt-slim-ticker-btn {
          background: #1E0734;
          border-color: #1E0734;
          color: #FAF9F5;
        }
        .tt-ticker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00DC7D;
          flex-shrink: 0;
        }
        .tt-ticker-text {
          overflow: hidden;
          text-overflow: ellipsis;
          animation: ttTickerFade 300ms ease;
        }
        @keyframes ttTickerFade {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tt-main-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior-y: contain;
          -webkit-overflow-scrolling: touch;
        }
        .tt-main-inner {
          max-width: var(--tt-container-max, 760px);
          margin: 0 auto;
          padding: 6px 12px calc(108px + env(safe-area-inset-bottom, 0px));
        }
        .tt-view-transition {
          animation: ttViewFadeIn 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes ttViewFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tt-rival-seg-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 4px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-rival-seg-active {
          min-height: 36px;
          border-radius: 10px;
          background: #1E0734;
          color: #00DC7D;
          font-size: 0.76rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-rival-seg-btn {
          min-height: 36px;
          border-radius: 10px;
          color: var(--tt-text);
          font-size: 0.76rem;
          font-weight: 800;
        }

        .tt-incoming-popup-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-ip-rival-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid rgba(0, 220, 125, 0.35);
        }
        .tt-ip-rival-card strong {
          display: block;
          font-size: 0.96rem;
        }
        .tt-ip-rival-card span {
          display: block;
          font-size: 0.76rem;
          color: var(--tt-text-muted);
          margin-top: 2px;
        }
        .tt-ip-rival-card small {
          display: inline-block;
          margin-top: 4px;
          font-size: 0.68rem;
          font-weight: 800;
          color: #00DC7D;
        }

        .tt-global-toast {
          position: fixed;
          left: 50%;
          top: calc(env(safe-area-inset-top, 0px) + 12px);
          transform: translateX(-50%);
          z-index: 9999;
          max-width: min(92vw, 440px);
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(20, 4, 36, 0.92);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.52);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 14px 32px rgba(0, 0, 0, 0.45);
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          animation: ttToastDrop 240ms cubic-bezier(0.22, 1.32, 0.36, 1);
        }
        .tt-global-toast.is-warning {
          border-color: #E5C16C;
        }
        .tt-global-toast.is-warning .tt-toast-dot {
          background: #E5C16C;
        }
        .tt-toast-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00DC7D;
          flex-shrink: 0;
        }
        .tt-cloud-sync-pill {
          position: fixed;
          right: 12px;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 86px);
          z-index: 40;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(20, 4, 36, 0.85);
          border: 1px solid rgba(0, 220, 125, 0.35);
          color: #7CF5C0;
          font-size: 0.66rem;
          font-weight: 800;
          pointer-events: none;
        }
        @keyframes ttToastDrop {
          from { opacity: 0; transform: translate(-50%, -14px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        /* LIQUID GLASS & FÍSICA ELÁSTICA GLOBAL (RANKING, TORNEOS, RETOS, SEDES) */
        .tt-btn {
          position: relative;
          overflow: hidden;
          transition:
            transform 175ms cubic-bezier(0.22, 1.38, 0.36, 1),
            box-shadow 220ms ease,
            border-color 200ms ease,
            filter 180ms ease !important;
        }
        .tt-btn:active {
          transform: scale(0.95) !important;
        }
        .tt-btn-primary {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            0 8px 20px rgba(0, 220, 125, 0.28) !important;
        }
        .tt-btn-secondary,
        .tt-btn-ghost {
          backdrop-filter: blur(14px) saturate(145%);
          -webkit-backdrop-filter: blur(14px) saturate(145%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14) !important;
        }
        .tt-card,
        .tt-torneos-view button:not(:disabled) {
          transition:
            transform 175ms cubic-bezier(0.22, 1.38, 0.36, 1),
            box-shadow 220ms ease,
            border-color 200ms ease;
        }
        .tt-torneos-view button:not(:disabled):active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
