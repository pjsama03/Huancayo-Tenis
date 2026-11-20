import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import * as PlayersData from './data/playersAndClubsData';
import * as StoreData from './data/storeAndTournamentsData';
import * as Engine from './utils/tenisEngine';

import {
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from './components/AppIcons';
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
   ZONA DE EDICIÓN RÁPIDA (CONFIGURACIÓN GLOBAL DEL MOTOR DE LA APP)
   ========================================================================== */
export const APP_RUNTIME_CONFIG = {
  storageKey: 'tt_total_tenis_state_v2',
  themeStorageKey: 'tt_theme_pref_v2',
  firstVisitKey: 'tt_visited_before_v2',
  defaultTab: 'retos',
  toastDurationMs: 3600,
  tickerMessages: [
    { id: 'tk-1', text: 'Tips gratis de la semana en cancha → Ver ahora', action: 'sedes' },
    { id: 'tk-2', text: 'Top 8 del Ranking van al Master Top 8', action: 'master' },
    { id: 'tk-3', text: 'Reporta el estado de tu sede y suma +5 Gemas', action: 'sedes' },
    { id: 'tk-4', text: 'Canjea tus Gemas en el Pro Shop (20 💎 = S/ 1.00)', action: 'shop' },
  ],
};

/* ==========================================================================
   CINTA SUPERIOR AISLADA (NO RE-RENDERIZA App NI RESETEA EL SCROLL DE MODALES)
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
   RESPALDOS SEGUROS DE ESTADO INICIAL
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

function buildInitialChallenges() {
  return PlayersData.INITIAL_CHALLENGES || StoreData.INITIAL_CHALLENGES || [];
}

function buildInitialTournaments() {
  return StoreData.INITIAL_TOURNAMENTS || StoreData.TOURNAMENTS_CATALOG || [];
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
    seasons: [
      { number: 1, label: 'Temporada 1', period: 'Ene – Mar', locked: true, scores: scoresT1 },
      { number: 2, label: 'Temporada 2', period: 'Abr – Jun', locked: true, scores: scoresT2 },
      { number: 3, label: 'Temporada 3', period: 'Jul – Sep', locked: true, scores: scoresT3 },
      { number: 4, label: 'Temporada 4', period: 'Oct – Dic', locked: false, scores: {} },
    ],
  };
}

function loadPersistedBundle() {
  try {
    const raw = window.localStorage.getItem(APP_RUNTIME_CONFIG.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.players) || parsed.players.length === 0) {
      return null;
    }
    const migratedPlayers = parsed.players.map((p) => ({
      ...p,
      gems: p.gems === 0 && (p.wins || 0) > 0 ? (p.isVip ? 220 : 35) : Number(p.gems) || 0,
    }));
    return { ...parsed, players: migratedPlayers };
  } catch (e) {
    return null;
  }
}

/* ==========================================================================
   COMPONENTE RAÍZ MAESTRO: App
   ========================================================================== */
export default function App() {
  const scrollContainerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const initialBundle = useMemo(() => {
    const saved = typeof window !== 'undefined' ? loadPersistedBundle() : null;
    const basePlayers = saved?.players || buildInitialPlayers();
    return {
      players: basePlayers,
      clubs: saved?.clubs?.length ? saved.clubs : buildInitialClubs(),
      challenges: saved?.challenges || buildInitialChallenges(),
      tournaments: saved?.tournaments || buildInitialTournaments(),
      seasonSnapshots: saved?.seasonSnapshots || buildInitialSnapshots(basePlayers),
      currentUserId:
        saved?.currentUserId !== undefined
          ? saved.currentUserId
          : basePlayers[0]?.id || null,
      gemLedger: saved?.gemLedger || [],
      complaints: saved?.complaints || [],
      notices: saved?.notices || [],
      sponsorsConfig: saved?.sponsorsConfig || null,
    };
  }, []);

  const [players, setPlayers] = useState(initialBundle.players);
  const [clubs, setClubs] = useState(initialBundle.clubs);
  const [challenges, setChallenges] = useState(initialBundle.challenges);
  const [tournaments, setTournaments] = useState(initialBundle.tournaments);
  const [seasonSnapshots, setSeasonSnapshots] = useState(initialBundle.seasonSnapshots);
  const [currentUserId, setCurrentUserId] = useState(initialBundle.currentUserId);
  const [gemLedger, setGemLedger] = useState(initialBundle.gemLedger);
  const [complaints, setComplaints] = useState(initialBundle.complaints);
  const [notices, setNotices] = useState(initialBundle.notices);
  const [sponsorsConfig, setSponsorsConfig] = useState(initialBundle.sponsorsConfig);

  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem(APP_RUNTIME_CONFIG.themeStorageKey) || 'dark';
    } catch (e) {
      return 'dark';
    }
  });
  const [sunlightMode, setSunlightMode] = useState(false);
  const [performanceTier, setPerformanceTier] = useState('standard');

  const [showSplash, setShowSplash] = useState(true);
  const [isFirstVisit] = useState(() => {
    try {
      return !window.localStorage.getItem(APP_RUNTIME_CONFIG.firstVisitKey);
    } catch (e) {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState(APP_RUNTIME_CONFIG.defaultTab);
  const [torneosInitialSubTab, setTorneosInitialSubTab] = useState('gira');

  const [isAdminSession, setIsAdminSession] = useState(false);
  const [activePartner, setActivePartner] = useState(null);

  // Control centralizado de los 10 Modales
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
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    if (!message) return;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, APP_RUNTIME_CONFIG.toastDurationMs);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.setAttribute('data-sunlight', sunlightMode ? 'true' : 'false');
    html.setAttribute('data-tier', performanceTier);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'light' ? '#FAF9F5' : '#1E0734');
    }

    try {
      window.localStorage.setItem(APP_RUNTIME_CONFIG.themeStorageKey, theme);
    } catch (e) {
      // continuar
    }
  }, [theme, sunlightMode, performanceTier]);

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

  useEffect(() => {
    try {
      const payload = {
        players,
        clubs,
        challenges,
        tournaments,
        seasonSnapshots,
        currentUserId,
        gemLedger: gemLedger.slice(0, 60),
        complaints: complaints.slice(0, 100),
        notices: notices.slice(0, 40),
        sponsorsConfig,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(APP_RUNTIME_CONFIG.storageKey, JSON.stringify(payload));
    } catch (e) {
      // continuar
    }
  }, [
    players,
    clubs,
    challenges,
    tournaments,
    seasonSnapshots,
    currentUserId,
    gemLedger,
    complaints,
    notices,
    sponsorsConfig,
  ]);

  const currentUser = useMemo(
    () => players.find((p) => p.id === currentUserId) || null,
    [players, currentUserId]
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

  const popupChallenge = useMemo(() => {
    if (showSplash || authModal.open || !currentUser?.id) return null;
    return incomingPendingChallenges.find((c) => !dismissedIncomingIds.includes(c.id)) || null;
  }, [showSplash, authModal.open, currentUser?.id, incomingPendingChallenges, dismissedIncomingIds]);

  const activeTournamentsCount = useMemo(
    () => tournaments.filter((t) => t.status === 'OPEN' || t.status === 'IN_PLAY').length,
    [tournaments]
  );

  const unreadNoticesCount = useMemo(() => {
    const unreadCustom = notices.filter((n) => !n.read).length;
    return incomingPendingChallenges.length + unreadCustom;
  }, [incomingPendingChallenges.length, notices]);

  const scrollMainToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const handleFinishSplash = useCallback(() => {
    setShowSplash(false);
    try {
      window.localStorage.setItem(APP_RUNTIME_CONFIG.firstVisitKey, '1');
    } catch (e) {
      // continuar
    }
  }, []);

  const appendGemLedger = useCallback((entry) => {
    setGemLedger((prev) => [{ id: `lg-${Date.now()}`, ...entry }, ...prev]);
  }, []);

  const handleUpdatePlayer = useCallback((playerId, patch) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, ...patch } : p)));
  }, []);

  const handleCreateChallenge = useCallback((newChallenge) => {
    setChallenges((prev) => [newChallenge, ...prev]);
  }, []);

  const handleUpdateChallenge = useCallback((challengeId, patch) => {
    setChallenges((prev) => prev.map((c) => (c.id === challengeId ? { ...c, ...patch } : c)));
  }, []);

  const handleFinalizeMatch = useCallback(
    ({ challenge, eloResult, liveScore }) => {
      if (!challenge || !eloResult?.ok) return;
      const winnerId = eloResult.winnerSide === 'A' ? challenge.playerAId : challenge.playerBId;

      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challenge.id
            ? {
                ...c,
                status: 'FINISHED',
                liveScore,
                winnerId,
                scoreSummary: eloResult.summary,
                eloDeltaA: eloResult.deltaA,
                eloDeltaB: eloResult.deltaB,
                finishedAt: new Date().toISOString(),
              }
            : c
        )
      );

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === challenge.playerAId || p.id === challenge.playerBId) {
            const isA = p.id === challenge.playerAId;
            const won = p.id === winnerId;
            const nextPoints = isA ? eloResult.newPointsA : eloResult.newPointsB;
            const nextStreak = won ? (Number(p.streak) || 0) + 1 : 0;
            const nextCalib = Math.min(
              Engine.ELO_CONFIG?.CALIBRATION_MATCHES || 5,
              (Number(p.calibrationPlayed) || 0) + 1
            );
            let bonusGems = 0;
            if (won && nextStreak >= 3) bonusGems = p.isVip ? 13 : 5;

            return {
              ...p,
              points: nextPoints,
              wins: (Number(p.wins) || 0) + (won ? 1 : 0),
              losses: (Number(p.losses) || 0) + (won ? 0 : 1),
              streak: nextStreak,
              calibrationPlayed: nextCalib,
              rankTrend: won ? Math.max(1, (Number(p.rankTrend) || 0) + 1) : -1,
              gems: (Number(p.gems) || 0) + bonusGems,
            };
          }
          return p;
        })
      );

      if (winnerId === currentUserId) {
        appendGemLedger({
          type: 'credit',
          amount: 5,
          title: 'Partido oficial completado',
          date: 'Hoy',
          detail: `Marcador ${eloResult.summary}`,
        });
      }
    },
    [currentUserId, appendGemLedger]
  );

  const handleQuickChallengeFromAnywhere = useCallback(
    (rival) => {
      if (!currentUser) {
        showToast('Inicia sesión para desafiar a este jugador.', 'info');
        setAuthModal({ open: true, mode: 'login' });
        return;
      }
      setInspectPlayerId(null);
      setActiveTab('retos');
      scrollMainToTop();
      showToast(
        `Ve a "Lanzar Reto" para pactar horario y sede con ${rival?.name || 'tu rival'}.`,
        'info'
      );
    },
    [currentUser, scrollMainToTop, showToast]
  );

  const handleRequestTournamentInscription = useCallback(({ tournamentId, playerId }) => {
    setTournaments((prev) =>
      prev.map((t) =>
        t.id === tournamentId
          ? {
              ...t,
              pendingPaymentIds: Array.from(new Set([...(t.pendingPaymentIds || []), playerId])),
            }
          : t
      )
    );
  }, []);

  const handleAdminApproveTournamentPayment = useCallback(
    (tournamentId, playerId) => {
      setTournaments((prev) =>
        prev.map((t) => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            pendingPaymentIds: (t.pendingPaymentIds || []).filter((id) => id !== playerId),
            participantsIds: Array.from(new Set([...(t.participantsIds || []), playerId])),
          };
        })
      );
      showToast('Pago validado. El jugador ya figura inscrito oficialmente en el cuadro.', 'success');
    },
    [showToast]
  );

  const handleAdminUpdateBracketResult = useCallback((tournamentId, matchId, resultObj) => {
    setTournaments((prev) =>
      prev.map((t) =>
        t.id === tournamentId
          ? { ...t, bracketResults: { ...(t.bracketResults || {}), [matchId]: resultObj } }
          : t
      )
    );
  }, []);

  const handleReportClubWeather = useCallback(
    ({ clubId, conditionKey, rewardGems = 5 }) => {
      setClubs((prev) =>
        prev.map((c) =>
          c.id === clubId
            ? { ...c, climaBase: { ...(c.climaBase || {}), conditionKey } }
            : c
        )
      );

      if (currentUserId && rewardGems > 0) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === currentUserId
              ? {
                  ...p,
                  gems: (Number(p.gems) || 0) + rewardGems,
                  weeklyGemsEarned: (Number(p.weeklyGemsEarned) || 0) + rewardGems,
                }
              : p
          )
        );
        appendGemLedger({
          type: 'credit',
          amount: rewardGems,
          title: 'Reporte de estado en sede',
          date: 'Hoy',
          detail: `Estado actualizado (${conditionKey})`,
        });
      }
    },
    [currentUserId, appendGemLedger]
  );

  const handleDeductGemsForUnlock = useCallback(
    ({ gemsCost, patchPlayer, ledgerTitle, ledgerDetail }) => {
      if (!currentUserId) return;
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== currentUserId) return p;
          const nextGems = Math.max(0, (Number(p.gems) || 0) - (Number(gemsCost) || 0));
          return {
            ...p,
            gems: nextGems,
            ...(typeof patchPlayer === 'function' ? patchPlayer(p) : patchPlayer),
          };
        })
      );
      if (gemsCost > 0) {
        appendGemLedger({
          type: 'debit',
          amount: gemsCost,
          title: ledgerTitle,
          date: 'Ahora mismo',
          detail: ledgerDetail,
        });
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
    (playerId, enableVip, bonusGems = 0) => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            isVip: enableVip,
            vipStatus: enableVip ? 'ACTIVE' : 'STANDARD',
            gems: (Number(p.gems) || 0) + (enableVip ? bonusGems : 0),
          };
        })
      );
      showToast(
        enableVip
          ? `Pase Socio VIP activado (+${bonusGems} Gemas mensuales acreditadas).`
          : 'Membresía VIP desactivada.',
        'success'
      );
    },
    [showToast]
  );

  const handleRegisterComplete = useCallback((newPlayer) => {
    setPlayers((prev) => [newPlayer, ...prev]);
    setCurrentUserId(newPlayer.id);
    setActiveTab('perfil');
    try {
      if (!window.localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
        window.setTimeout(() => setTutorialOpen(true), 650);
      }
    } catch (e) {
      // continuar
    }
  }, []);

  const popupChallenger = popupChallenge
    ? players.find((p) => p.id === popupChallenge.playerAId)
    : null;

  return (
    <div
      className={`tt-app-viewport ${theme === 'light' ? 'is-light' : 'is-dark'} ${
        sunlightMode ? 'is-sunlight' : ''
      }`}
    >
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
        onToggleSunlight={() => setSunlightMode((s) => !s)}
        onNavigateTab={handleSelectTab}
        onOpenProShop={() => setProShopModal({ open: true, mode: 'shop' })}
        onOpenShop={() => setProShopModal({ open: true, mode: 'shop' })}
        onOpenGemsVault={() => setProShopModal({ open: true, mode: 'vault' })}
        onOpenVault={() => setProShopModal({ open: true, mode: 'vault' })}
        onOpenNotices={(tab = 'notificaciones') => setNoticesModal({ open: true, tab })}
        onOpenVipScale={(tab = 'vip') => setVipScaleModal({ open: true, tab })}
        onOpenStories={(payload = null) => setStoriesModal({ open: true, payload })}
        onOpenAuth={(mode = 'login') => setAuthModal({ open: true, mode })}
        onOpenPartnerPortal={() => {
          if (activePartner) setPartnerModalOpen(true);
          else setAuthModal({ open: true, mode: 'partner' });
        }}
        onOpenLegal={(section = 'reclamaciones') => setLegalModal({ open: true, section })}
        onOpenTutorial={() => setTutorialOpen(true)}
        onSecretAdminTrigger={() => setAdminModalOpen(true)}
        onLogout={() => {
          triggerHaptic('medium');
          setCurrentUserId(null);
          setIsAdminSession(false);
          setActivePartner(null);
          showToast('Sesión cerrada. Puedes volver a entrar cuando quieras.', 'info');
        }}
      />

      {/* 3. CINTA SUPERIOR AISLADA (NO INTERFIERE CON EL SCROLL DE LOS MODALES) */}
      <SlimTickerBar
        onSelectTab={handleSelectTab}
        onOpenMaster={() => handleOpenTournamentsAt('master')}
        onOpenShop={() => setProShopModal({ open: true, mode: 'shop' })}
      />

      {/* 4. CONTENEDOR CENTRAL SCROLLABLE (COMIENZA LIMPIO DEBAJO DEL HEADER) */}
      <main ref={scrollContainerRef} className="tt-main-scroll">
        <div className="tt-main-inner">
          <div key={activeTab} className="tt-view-transition">
            {activeTab === 'retos' && (
              <RetosView
                players={activePlayers}
                clubs={activeClubs}
                challenges={challenges}
                currentUser={currentUser}
                isAdmin={isAdminSession}
                theme={theme}
                sunlightMode={sunlightMode}
                onCreateChallenge={handleCreateChallenge}
                onUpdateChallenge={handleUpdateChallenge}
                onFinalizeMatch={handleFinalizeMatch}
                onOpenPlayerProfile={(p) => setInspectPlayerId(p.id)}
                onOpenStoriesWithMatch={(payload) => setStoriesModal({ open: true, payload })}
                onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
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
                isAdmin={isAdminSession}
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
                onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
                onNotify={showToast}
              />
            )}

            {activeTab === 'sedes' && (
              <SedesView
                clubs={activeClubs}
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
                  if (activePartner) setPartnerModalOpen(true);
                  else setAuthModal({ open: true, mode: 'partner' });
                }}
                onOpenVipCard={() => setVipScaleModal({ open: true, tab: 'vip' })}
                onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
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
                theme={theme}
                sunlightMode={sunlightMode}
                onUpdateProfile={handleUpdatePlayer}
                onUnlockScenario={({ scenarioId, gemsCost }) =>
                  handleDeductGemsForUnlock({
                    gemsCost,
                    patchPlayer: (p) => ({
                      unlockedScenarios: Array.from(
                        new Set([...(p.unlockedScenarios || ['default']), scenarioId])
                      ),
                    }),
                    ledgerTitle: 'Escenario Grand Slam',
                    ledgerDetail: `Escenario "${scenarioId}" desbloqueado`,
                  })
                }
                onUnlockBadge={({ badgeId, gemsCost, name }) =>
                  handleDeductGemsForUnlock({
                    gemsCost,
                    patchPlayer: (p) => ({
                      unlockedBadges: Array.from(new Set([...(p.unlockedBadges || []), badgeId])),
                      activeBadgeId: badgeId,
                    }),
                    ledgerTitle: `Distintivo: ${name}`,
                    ledgerDetail: 'Equipado en Mi Perfil',
                  })
                }
                onOpenVipCard={() => setVipScaleModal({ open: true, tab: 'vip' })}
                onOpenHeadToHead={(rival) =>
                  setH2hModal({ open: true, playerA: currentUser, playerB: rival })
                }
                onOpenStoriesWithMatch={(payload) => setStoriesModal({ open: true, payload })}
                onQuickChallenge={handleQuickChallengeFromAnywhere}
                onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
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
              if (activePartner) setPartnerModalOpen(true);
              else setAuthModal({ open: true, mode: 'partner' });
            }}
            onOpenLegal={(section) => setLegalModal({ open: true, section })}
            onOpenTutorial={() => setTutorialOpen(true)}
            onNotify={showToast}
          />
        </div>
      </main>

      {/* 5. BARRA DE NAVEGACIÓN INFERIOR (INTACTA COMO TE GUSTA) */}
      <BottomDock
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onReselectActiveTab={scrollMainToTop}
        challengesCount={incomingPendingChallenges.length}
        liveMatchesCount={liveMatchesCount}
        activeTournamentsCount={activeTournamentsCount}
        theme={theme}
        sunlightMode={sunlightMode}
      />

      {/* MODAL HOMOGENEIZADO DE FICHA DE RIVAL */}
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
              currentUser={currentUser}
              players={activePlayers}
              clubs={activeClubs}
              challenges={challenges}
              theme={theme}
              sunlightMode={sunlightMode}
              onUpdateProfile={handleUpdatePlayer}
              onOpenHeadToHead={(rival) => {
                setInspectPlayerId(null);
                setH2hModal({ open: true, playerA: currentUser, playerB: rival });
              }}
              onQuickChallenge={handleQuickChallengeFromAnywhere}
              onOpenStoriesWithMatch={(payload) => {
                setInspectPlayerId(null);
                setStoriesModal({ open: true, payload });
              }}
              onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
              onNotify={showToast}
            />
          </div>
        )}
      </ModalPortal>

      {/* POP-UP AUTOMÁTICO DE RETO ENTRANTE (SIN BUCLE) */}
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
                  showToast('¡Desafío aceptado! Ya aparece en la Cartelera.', 'success');
                }}
              >
                Aceptar Desafío Ahora
              </button>

              <a
                href={Engine.buildWhatsAppLink(
                  popupChallenger?.whatsapp,
                  `Hola ${popupChallenger?.name || ''}, recibí tu reto en TOTAL TENIS para ${
                    popupChallenge.clubName
                  } (${popupChallenge.dateLabel} ${popupChallenge.timeLabel}). ¿Coordinamos otra hora o sede?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="tt-btn tt-btn-secondary"
                onClick={() => setDismissedIncomingIds((prev) => [...prev, popupChallenge.id])}
              >
                <TTIcon name="whatsapp" size={17} />
                Contraproponer Hora / Sede por WhatsApp
              </a>

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

      {/* LOS 10 MODALES PREMIUM EN CAPA GLOBAL */}
      <ProShopAndGemsModal
        isOpen={proShopModal.open}
        initialMode={proShopModal.mode}
        onClose={() => setProShopModal((s) => ({ ...s, open: false }))}
        currentUser={currentUser}
        products={StoreData.PROSHOP_PRODUCTS || StoreData.INITIAL_PRODUCTS || []}
        clubs={activeClubs}
        gemLedger={gemLedger}
        theme={theme}
        onProShopRedeem={({ gemsSpent, productName, cashAmount }) =>
          handleDeductGemsForUnlock({
            gemsCost: gemsSpent,
            patchPlayer: {},
            ledgerTitle: `Pro Shop: ${productName}`,
            ledgerDetail: cashAmount > 0 ? `Copago + S/ ${cashAmount}.00` : 'Canje 100 %',
          })
        }
        onOpenVipCard={() => setVipScaleModal({ open: true, tab: 'vip' })}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
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
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onNotify={showToast}
      />

      <AuthAndOnboardingModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal((s) => ({ ...s, open: false }))}
        players={players}
        clubs={activeClubs}
        onLoginSuccess={(p) => setCurrentUserId(p.id)}
        onRegisterComplete={handleRegisterComplete}
        onResetPassword={(playerId, newPass) => handleUpdatePlayer(playerId, { password: newPass })}
        onPartnerLoginSuccess={(partnerObj) => {
          setActivePartner(partnerObj);
          setPartnerModalOpen(true);
        }}
        onOpenLegalModal={(section) => setLegalModal({ open: true, section })}
        onNotify={showToast}
      />

      <LegalAndComplianceModal
        isOpen={legalModal.open}
        initialSection={legalModal.section}
        onClose={() => setLegalModal((s) => ({ ...s, open: false }))}
        currentUser={currentUser}
        complaints={complaints}
        onSubmitComplaint={(record) => setComplaints((prev) => [record, ...prev])}
        onNotify={showToast}
      />

      <PartnerStudioModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        partner={activePartner}
        players={activePlayers}
        clubs={clubs}
        theme={theme}
        onUpdateClubWeather={handleReportClubWeather}
        onNotify={showToast}
      />

      <AdminSuiteModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        isUnlockedInitially={isAdminSession}
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
          showToast(`Modo Sandbox activo: navegando como ${p.name}.`, 'info');
        }}
        onAdminUpdatePlayer={handleUpdatePlayer}
        onAdminDeletePlayer={(pid) => {
          setPlayers((prev) => prev.filter((p) => p.id !== pid));
          if (currentUserId === pid) setCurrentUserId(null);
          showToast('Cuenta eliminada definitivamente.', 'info');
        }}
        onAdminApproveVip={handleAdminApproveVip}
        onAdminApproveTournamentPayment={handleAdminApproveTournamentPayment}
        onAdminCreateTournament={(newT) => setTournaments((prev) => [newT, ...prev])}
        onAdminCloseSeason={(nextSnap) => setSeasonSnapshots(nextSnap)}
        onAdminResolveDispute={(chId, action) => {
          if (action === 'CANCEL') {
            handleUpdateChallenge(chId, { status: 'DECLINED' });
            showToast('Encuentro anulado sin impacto en puntos.', 'info');
          }
        }}
        onAdminToggleClubActive={(clubId, nextActive) =>
          setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, active: nextActive } : c)))
        }
        onAdminSaveSponsors={(cfg) => setSponsorsConfig(cfg)}
        onAdminPurgeArchivedMatches={() =>
          setChallenges((prev) => prev.filter((c) => c.status !== 'FINISHED'))
        }
        onNotify={showToast}
      />

      <OnboardingTutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onNavigateTab={handleSelectTab}
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

        /* Cinta superior de 1 sola línea, visible y sin chocar con el Header */
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
          min-height: 28px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.12);
          border: 1px solid rgba(0, 220, 125, 0.34);
          color: var(--tt-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 0.71rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
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

        /* Scroll interno principal: empieza limpio debajo de Header + Cinta */
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
          animation: ttViewFadeIn 200ms cubic-bezier(0.22, 1, 0.36, 1);
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
          padding: 10px 15px;
          border-radius: 999px;
          background: rgba(20, 4, 36, 0.96);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.6);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          animation: ttToastDrop 220ms cubic-bezier(0.22, 1.32, 0.36, 1);
        }
        .tt-global-toast.is-warning {
          border-color: #F59E0B;
        }
        .tt-global-toast.is-warning .tt-toast-dot {
          background: #F59E0B;
        }
        .tt-toast-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00DC7D;
          flex-shrink: 0;
        }
        @keyframes ttToastDrop {
          from { opacity: 0; transform: translate(-50%, -14px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
