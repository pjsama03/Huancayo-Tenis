import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  BALLS_AGREEMENTS,
  MAX_OFFICIAL_ELO_WINDOW,
  MatchPosterCard,
  PlayerAvatarWithClub,
  QUICK_TIME_SLOTS,
  RetosCelebrationModal,
  RetosRescheduleModal,
  buildLiveScoreFromDirectDraft,
  calculateMatchVictoryGems,
  computeAdaptiveOfficialRivals,
  createDirectDraftFromScore,
  formatDynamicDateAndTime,
  getMatchVictoryGemsRange,
  getTodayDateInputValue,
} from '../components/RetosParts';
import {
  CATEGORIES_SCALE,
  INITIAL_CLUBS,
  getCategoryByPoints,
} from '../data/playersAndClubsData';
import {
  calculateOfficialMatchElo,
  canIncrementRegularGame,
  createEmptyLiveScore,
  evaluateMatchScore,
  getMatchPermissions,
  getPreMatchForecast,
  stepLiveScoreboard,
} from '../utils/tenisEngine';
import { buildWhatsappLink, getEffectiveContactPhone } from '../utils/cloudService';
import {
  SponsorStaticBanner,
  buildSponsorHref,
  getActiveSponsorsByLevel,
} from '../components/SponsorPlacements';

/* ==========================================================================
   VISTA PRINCIPAL: RetosView
   (ACABADO 3D TÁCTIL + LIQUID GLASS + RETO EN 1 TOQUE + GEMAS HASTA 6-0, 6-0)
   ========================================================================== */
export default function RetosView({
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  currentUser = null,
  isAdmin = false,
  theme = 'dark',
  sponsorsConfig = null,
  onTrackSponsorImpression,
  onTrackSponsorClick,
  quickChallengeRival = null,
  onConsumeQuickChallenge,
  onCreateChallenge,
  onUpdateChallenge,
  onFinalizeMatch,
  onOpenPlayerProfile,
  onOpenStoriesWithMatch,
  onOpenAuth,
  onGoToTournaments,
  onNotify,
}) {
  const isLight = theme === 'light';
  const modeClass = isLight ? 'is-light' : 'is-dark';

  const [subTab, setSubTab] = useState('cartelera'); // 'cartelera' | 'mis-retos' | 'lanzar'
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  const [rivalSearch, setRivalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [onlyInRange, setOnlyInRange] = useState(true);
  const [boardFilter, setBoardFilter] = useState('ALL');

  const [challengeTarget, setChallengeTarget] = useState(null);
  const [activeScoreboardId, setActiveScoreboardId] = useState(null);
  const [scoreModalMode, setScoreModalMode] = useState('direct');
  const [directDraft, setDirectDraft] = useState(() => createDirectDraftFromScore(null));
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [celebrationPayload, setCelebrationPayload] = useState(null);
  const [showWalkoverBox, setShowWalkoverBox] = useState(false);

  const [formMode, setFormMode] = useState('Por puntos');
  const [formClubId, setFormClubId] = useState(clubs?.[0]?.id || 'club-country');
  const [formCustomVenue, setFormCustomVenue] = useState('');
  const [formDate, setFormDate] = useState(() => getTodayDateInputValue(1));
  const [formTime, setFormTime] = useState('18:00');
  const [formBalls, setFormBalls] = useState(BALLS_AGREEMENTS[0]);

  const [reschedDate, setReschedDate] = useState(() => getTodayDateInputValue(2));
  const [reschedTime, setReschedTime] = useState('19:00');
  const [reschedReason, setReschedReason] = useState('Lluvia intensa en cancha');

  const playersMap = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  // Motor adaptativo Anti-Escasez (±1,200 normal -> ±1,800 hasta 8 rivales si hay < 6 en tu rango)
  const adaptiveRadar = useMemo(
    () => computeAdaptiveOfficialRivals(players, currentUser),
    [players, currentUser]
  );

  const isRivalInOfficialRange = useCallback(
    (rival) => {
      if (!rival?.id) return false;
      if (!currentUser) {
        return Math.abs((Number(rival.points) || 0) - 1500) <= MAX_OFFICIAL_ELO_WINDOW;
      }
      return adaptiveRadar.eligibleIds.has(rival.id);
    },
    [adaptiveRadar, currentUser]
  );

  const liveChallenges = useMemo(
    () => (challenges || []).filter((c) => c.status === 'IN_PLAY'),
    [challenges]
  );

  const incomingPending = useMemo(() => {
    if (!currentUser?.id) return [];
    return (challenges || []).filter(
      (c) => c.status === 'PENDING' && c.playerBId === currentUser.id
    );
  }, [challenges, currentUser]);

  const myChallenges = useMemo(() => {
    if (!currentUser?.id) return [];
    const orderWeight = {
      SCORE_PROPOSED: 0,
      PENDING: 1,
      IN_PLAY: 2,
      SCHEDULED: 3,
      DISPUTED: 4,
      FINISHED: 5,
    };
    return (challenges || [])
      .filter(
        (c) =>
          c.status !== 'DECLINED' &&
          (c.playerAId === currentUser.id ||
            c.playerBId === currentUser.id ||
            c.judgeId === currentUser.id)
      )
      .sort((a, b) => (orderWeight[a.status] ?? 9) - (orderWeight[b.status] ?? 9));
  }, [challenges, currentUser]);

  const publicBoardChallenges = useMemo(() => {
    const orderWeight = {
      IN_PLAY: 0,
      SCORE_PROPOSED: 1,
      SCHEDULED: 2,
      PENDING: 3,
      FINISHED: 4,
      DISPUTED: 5,
    };
    return (challenges || [])
      .filter((c) => c.status !== 'DECLINED')
      .filter((c) => {
        if (boardFilter === 'ALL') return true;
        if (boardFilter === 'IN_PLAY') {
          return c.status === 'IN_PLAY' || c.status === 'SCORE_PROPOSED';
        }
        return c.status === boardFilter;
      })
      .sort((a, b) => (orderWeight[a.status] ?? 9) - (orderWeight[b.status] ?? 9));
  }, [challenges, boardFilter]);

  const availableRivals = useMemo(() => {
    const myPoints = Number(currentUser?.points) || 1500;
    const q = rivalSearch.trim().toLowerCase();

    return (players || [])
      .filter((p) => !p.isPaused && !p.isTutorOnly)
      .filter((p) => !currentUser || p.id !== currentUser.id)
      .filter((p) => {
        if (categoryFilter !== 'ALL' && getCategoryByPoints(p.points).id !== categoryFilter) {
          return false;
        }
        if (q) {
          const hay = `${p.name} ${p.clubName || ''} ${p.division || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((p) => {
        const gap = Math.abs((Number(p.points) || 0) - myPoints);
        const inOfficialRange = isRivalInOfficialRange(p);
        const viaExpanded = Boolean(
          adaptiveRadar.expanded && inOfficialRange && gap > MAX_OFFICIAL_ELO_WINDOW
        );
        return { player: p, gap, inOfficialRange, viaExpanded };
      })
      .filter((item) => (onlyInRange ? item.inOfficialRange : true))
      .sort((a, b) => {
        if (a.inOfficialRange !== b.inOfficialRange) return a.inOfficialRange ? -1 : 1;
        return a.gap - b.gap;
      });
  }, [
    players,
    currentUser,
    rivalSearch,
    categoryFilter,
    onlyInRange,
    isRivalInOfficialRange,
    adaptiveRadar.expanded,
  ]);

  const activeScoreboardChallenge = useMemo(
    () => (challenges || []).find((c) => c.id === activeScoreboardId) || null,
    [challenges, activeScoreboardId]
  );

  const openScoreModal = useCallback(
    (ch, preferredMode = 'direct') => {
      if (!ch) return;
      const perms = getMatchPermissions(ch, currentUser, isAdmin);
      setActiveScoreboardId(ch.id);
      setDirectDraft(createDirectDraftFromScore(ch.liveScore));
      setShowWalkoverBox(false);
      if (perms.isJudge || (!perms.canEditScore && ch.status === 'IN_PLAY')) {
        setScoreModalMode('live');
      } else {
        setScoreModalMode(preferredMode);
      }
    },
    [currentUser, isAdmin]
  );

  /* Carrusel Hero con las 3 fotos precargadas desde el segundo 0 */
  const heroSlides = useMemo(() => {
    const featuredLive = liveChallenges[0];
    const pA = featuredLive ? playersMap[featuredLive.playerAId] : null;
    const pB = featuredLive ? playersMap[featuredLive.playerBId] : null;

    const sponsorSlides = getActiveSponsorsByLevel(sponsorsConfig, 'CAROUSEL').map((sp) => {
      const href = buildSponsorHref(sp);
      return {
        id: `sp-hero-${sp.id}`,
        sponsorId: sp.id,
        tag: sp.priceText
          ? `${sp.tag || 'PATROCINADOR OFICIAL'} · ${sp.priceText}`
          : sp.tag || 'PATROCINADOR OFICIAL',
        title: sp.title || sp.brandName || 'Promoción Oficial',
        subtitle: sp.description || (sp.brandName ? `Presentado por ${sp.brandName}` : ''),
        image: sp.imageUrl || ASSETS.torneoApertura,
        ctaLabel: sp.ctaLabel || 'VER OFERTA',
        onCta: () => {
          triggerHaptic('medium');
          if (onTrackSponsorClick) onTrackSponsorClick(sp.id);
          if (href) window.open(href, '_blank', 'noopener,noreferrer');
        },
      };
    });

    const baseSlides = [
      {
        id: 'slide-1',
        tag: featuredLive ? 'EN CANCHA AHORA' : 'CIRCUITO OFICIAL',
        title: featuredLive
          ? `${pA?.name?.split(' ')[0] || 'Duelo'} vs. ${pB?.name?.split(' ')[0] || 'Rival'}`
          : 'Pacta tu partido oficial y escala en el Ranking',
        subtitle: featuredLive
          ? `${featuredLive.clubName} · Marcador en vivo`
          : 'Elige rival de tu categoría, acuerda cancha y confirma el marcador.',
        image: ASSETS.torneoApertura,
        ctaLabel: featuredLive ? 'VER EN VIVO' : 'LANZAR UN RETO',
        onCta: () => {
          triggerHaptic('light');
          if (featuredLive) openScoreModal(featuredLive, 'live');
          else setSubTab('lanzar');
        },
      },
      {
        id: 'slide-2',
        tag: 'CARRERA ANUAL · MASTER TOP 8',
        title: 'Suma puntos todo el año y clasifica al Top 8',
        subtitle: 'Los 8 primeros del año juegan el Master Top 8 sin costo de inscripción.',
        image: ASSETS.torneoMasterTop8,
        ctaLabel: 'VER MASTER TOP 8',
        onCta: () => {
          triggerHaptic('light');
          if (onGoToTournaments) onGoToTournaments('master');
        },
      },
      {
        id: 'slide-3',
        tag: 'SEDES OFICIALES Y CANCHA LIBRE',
        title: 'Desafía rivales de tu nivel cuando quieras',
        subtitle: 'Juega en nuestras 4 sedes aliadas o en la cancha que acuerden.',
        image: ASSETS.torneoAltura,
        ctaLabel: 'LANZAR UN RETO',
        onCta: () => {
          triggerHaptic('light');
          setSubTab('lanzar');
        },
      },
    ];

    return [...sponsorSlides, ...baseSlides];
  }, [
    liveChallenges,
    playersMap,
    sponsorsConfig,
    onGoToTournaments,
    openScoreModal,
    onTrackSponsorClick,
  ]);

  const currentSlideIdx = heroSlideIdx % heroSlides.length;
  const activeSlide = heroSlides[currentSlideIdx];

  useEffect(() => {
    if (activeSlide?.sponsorId && onTrackSponsorImpression) {
      onTrackSponsorImpression(activeSlide.sponsorId);
    }
  }, [activeSlide?.sponsorId, onTrackSponsorImpression]);
  const activeSlide = heroSlides[currentSlideIdx];

  useEffect(() => {
    if (challengeTarget || activeScoreboardId || rescheduleTarget || celebrationPayload) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, [heroSlides.length, challengeTarget, activeScoreboardId, rescheduleTarget, celebrationPayload]);

  /* ------------------------------------------------------------------------
     ACCIONES DE NEGOCIO (INCLUYE RETO DIRECTO EN 1 TOQUE DESDE RANKING/H2H)
     ------------------------------------------------------------------------ */
  const openCreateChallengeModal = useCallback(
    (rival, forceFriendly = false) => {
      if (!rival) return;
      if (!currentUser) {
        if (onNotify) onNotify('Inicia sesión para pactar un desafío.', 'info');
        if (onOpenAuth) onOpenAuth('login');
        return;
      }
      if (currentUser.isTutorOnly) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            'Tu cuenta está en modo Solo Padre/Tutor. Cambia a la subcuenta de tu hijo en Perfil para lanzar retos.',
            'info'
          );
        }
        return;
      }
      if (rival.id === currentUser.id) {
        if (onNotify) onNotify('No puedes enviarte un desafío a ti mismo.', 'info');
        return;
      }
      const eligibleOfficial = isRivalInOfficialRange(rival);
      setFormMode(forceFriendly || !eligibleOfficial ? 'Amistoso' : 'Por puntos');
      setFormClubId(
        currentUser.clubId && currentUser.clubId !== 'independiente'
          ? currentUser.clubId
          : clubs?.[0]?.id || 'club-country'
      );
      setFormCustomVenue('');
      setFormDate(getTodayDateInputValue(1));
      setFormTime('18:00');
      setFormBalls(BALLS_AGREEMENTS[0]);
      setChallengeTarget(rival);
    },
    [currentUser, isRivalInOfficialRange, clubs, onNotify, onOpenAuth]
  );

  // Disparo instantáneo del modal "Pactar Nuevo Desafío" al llegar desde Ranking, Perfil o H2H
  useEffect(() => {
    if (!quickChallengeRival?.id) return;
    openCreateChallengeModal(quickChallengeRival, false);
    if (onConsumeQuickChallenge) onConsumeQuickChallenge();
  }, [quickChallengeRival, openCreateChallengeModal, onConsumeQuickChallenge]);

  const handleSubmitNewChallenge = (e) => {
    e.preventDefault();
    if (!currentUser || !challengeTarget) return;

    const isCustom = formClubId === 'custom';
    const selectedClub = clubs.find((c) => c.id === formClubId);
    const venueName = isCustom
      ? formCustomVenue.trim()
      : selectedClub?.name || 'Sede por definir';

    if (isCustom && venueName.length < 3) {
      if (onNotify) onNotify('Escribe el nombre de la cancha o sede personalizada.', 'warning');
      return;
    }

    const scheduledIso = new Date(`${formDate}T${formTime}:00-05:00`).toISOString();
    const { dateText, timeText } = formatDynamicDateAndTime(scheduledIso);

    const newChallenge = {
      id: `ch-${Date.now()}`,
      isDemo: false,
      playerAId: currentUser.id,
      playerBId: challengeTarget.id,
      judgeId: null,
      clubId: isCustom ? 'custom' : selectedClub?.id || 'custom',
      clubName: venueName,
      scheduledIso,
      dateLabel: dateText,
      timeLabel: timeText,
      mode: formMode,
      ballsAgreement: formBalls,
      status: 'PENDING',
      rescheduleCount: 0,
      liveScore: createEmptyLiveScore(),
      winnerId: null,
    };

    if (onCreateChallenge) onCreateChallenge(newChallenge);
    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        challengeTarget.isTutelado
          ? `Desafío enviado al padre/madre tutor de ${challengeTarget.name}. Queda pendiente de aceptación.`
          : `Desafío enviado a ${challengeTarget.name}. Queda pendiente de su aceptación.`,
        'success'
      );
    }
    setChallengeTarget(null);
    setSubTab('mis-retos');
  };

  const handleAcceptChallenge = (ch) => {
    if (!onUpdateChallenge) return;
    onUpdateChallenge(ch.id, { status: 'SCHEDULED' });
    if (onNotify) onNotify('¡Desafío confirmado! Ya aparece en la Cartelera.', 'success');
  };

  const handleDeclineChallenge = (ch) => {
    if (!onUpdateChallenge) return;
    onUpdateChallenge(ch.id, { status: 'DECLINED' });
    if (onNotify) onNotify('Desafío declinado.', 'info');
  };

  const handleActivateLiveRefereeMode = (ch) => {
    if (!ch || !onUpdateChallenge) return;
    if (ch.status !== 'IN_PLAY') {
      onUpdateChallenge(ch.id, {
        status: 'IN_PLAY',
        liveScore: ch.liveScore || createEmptyLiveScore(),
      });
    }
    setScoreModalMode('live');
  };

  const handleScoreboardAction = (action) => {
    if (!activeScoreboardChallenge || !onUpdateChallenge) return;
    const nextScore = stepLiveScoreboard(activeScoreboardChallenge.liveScore, action);
    const patch = { liveScore: nextScore };
    if (activeScoreboardChallenge.status === 'SCHEDULED') {
      patch.status = 'IN_PLAY';
    }
    onUpdateChallenge(activeScoreboardChallenge.id, patch);
    setDirectDraft(createDirectDraftFromScore(nextScore));
  };

  const handleAssignJudge = (judgeId) => {
    if (!activeScoreboardChallenge || !onUpdateChallenge) return;
    const patch = { judgeId: judgeId || null };
    if (judgeId && activeScoreboardChallenge.status === 'SCHEDULED') {
      patch.status = 'IN_PLAY';
    }
    onUpdateChallenge(activeScoreboardChallenge.id, patch);
    const jPlayer = playersMap[judgeId];
    if (onNotify) {
      onNotify(
        jPlayer
          ? `${jPlayer.name} fue designado como Árbitro en cancha. Ya puede llevar el marcador en vivo.`
          : 'Se retiró el Árbitro en cancha.',
        'info'
      );
    }
  };

  const handleSubmitMatchResult = ({
    scoreObj,
    isWalkover = false,
    walkoverWinnerSide = null,
  }) => {
    if (!activeScoreboardChallenge) return;
    const pA = playersMap[activeScoreboardChallenge.playerAId];
    const pB = playersMap[activeScoreboardChallenge.playerBId];
    if (!pA || !pB) return;

    const finalScoreObj = scoreObj || activeScoreboardChallenge.liveScore || createEmptyLiveScore();
    const isOfficial = activeScoreboardChallenge.mode !== 'Amistoso';
    let eloResult;

    if (isOfficial) {
      eloResult = calculateOfficialMatchElo({
        playerA: pA,
        playerB: pB,
        liveScore: finalScoreObj,
        challenges,
        totalActivePlayers: Math.max(players.length, 130),
        isWalkover,
        walkoverWinnerSide,
      });
      if (!eloResult.ok) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            eloResult.error || 'Revisa el marcador: cada set se cierra 6-0 a 6-4, 7-5 o 7-6.',
            'warning'
          );
        }
        return;
      }
    } else {
      const ev = evaluateMatchScore(finalScoreObj);
      if (!isWalkover && (!ev.valid || !ev.finished)) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            ev.error || 'Completa un marcador válido (al mejor de 2 sets + Super Tie-Break).',
            'warning'
          );
        }
        return;
      }
      eloResult = {
        ok: true,
        winnerSide: isWalkover ? walkoverWinnerSide : ev.winnerSide,
        summary: isWalkover ? 'W.O.' : ev.summary,
        cageLabel: 'Partido Amistoso',
        deltaA: 0,
        deltaB: 0,
        newPointsA: pA.points,
        newPointsB: pB.points,
        promotedA: false,
        promotedB: false,
      };
    }

    const closesImmediately =
      isAdmin ||
      (activeScoreboardChallenge.status === 'SCORE_PROPOSED' &&
        activeScoreboardChallenge.proposedBy &&
        activeScoreboardChallenge.proposedBy !== currentUser?.id);

    if (onFinalizeMatch) {
      onFinalizeMatch({
        challenge: activeScoreboardChallenge,
        eloResult,
        liveScore: finalScoreObj,
        isWalkover,
        walkoverWinnerSide,
      });
    }

    triggerHaptic('success');
    setShowWalkoverBox(false);
    setActiveScoreboardId(null);

    if (closesImmediately) {
      const winnerPlayer = eloResult.winnerSide === 'A' ? pA : pB;
      const promoted = eloResult.winnerSide === 'A' ? eloResult.promotedA : eloResult.promotedB;
      const victoryGems = isOfficial
        ? calculateMatchVictoryGems(finalScoreObj, Boolean(winnerPlayer?.isVip), isWalkover)
        : null;

      setCelebrationPayload({
        challenge: {
          ...activeScoreboardChallenge,
          status: 'FINISHED',
          scoreSummary: eloResult.summary,
          winnerId: winnerPlayer.id,
          eloDeltaA: eloResult.deltaA,
          eloDeltaB: eloResult.deltaB,
        },
        playerA: pA,
        playerB: pB,
        winnerPlayer,
        eloResult,
        victoryGems,
        promoted,
        isOfficial,
      });
    }
  };

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!rescheduleTarget || !onUpdateChallenge) return;
    const perms = getMatchPermissions(rescheduleTarget, currentUser, isAdmin);
    const rival =
      playersMap[
        rescheduleTarget.playerAId === currentUser?.id
          ? rescheduleTarget.playerBId
          : rescheduleTarget.playerAId
      ];

    const newIso = new Date(`${reschedDate}T${reschedTime}:00-05:00`).toISOString();
    const { dateText, timeText } = formatDynamicDateAndTime(newIso);

    if (perms.rescheduleMode === 'ORDINARY_ALLOWED') {
      onUpdateChallenge(rescheduleTarget.id, {
        scheduledIso: newIso,
        dateLabel: dateText,
        timeLabel: timeText,
        rescheduleCount: (Number(rescheduleTarget.rescheduleCount) || 0) + 1,
      });
      triggerHaptic('success');
      if (onNotify) onNotify(`Horario actualizado para ${dateText} · ${timeText}.`, 'success');
    } else {
      onUpdateChallenge(rescheduleTarget.id, {
        scheduledIso: newIso,
        dateLabel: dateText,
        timeLabel: timeText,
        climateNote: reschedReason,
      });
      triggerHaptic('medium');
      if (onNotify) onNotify(`Reprogramación registrada (${reschedReason}).`, 'info');
      const targetPhone = getEffectiveContactPhone(rival, players);
      if (rival && targetPhone && (!rival.hideWhatsapp || rival.isTutelado)) {
        const waMsg = rival.isTutelado
          ? `Hola ${rival.tutorName || 'Padre/Madre'}, aviso desde TOTAL TENIS: por "${reschedReason}", propongo reprogramar el partido con ${rival.name} en ${rescheduleTarget.clubName} para el ${dateText} a las ${timeText}.`
          : `Hola ${rival.name}, aviso desde TOTAL TENIS: por "${reschedReason}", propongo reprogramar nuestro partido en ${rescheduleTarget.clubName} para el ${dateText} a las ${timeText}.`;
        const wa = buildWhatsappLink(targetPhone, waMsg);
        window.open(wa, '_blank', 'noopener,noreferrer');
      }
    }

    setRescheduleTarget(null);
  };

  /* ------------------------------------------------------------------------
     CÁLCULOS EN VIVO PARA LOS MODALES (ELO + GEMAS HASTA 6-0, 6-0)
     ------------------------------------------------------------------------ */
  const preMatchForecast = useMemo(() => {
    if (!currentUser || !challengeTarget) return null;
    return getPreMatchForecast(
      currentUser,
      challengeTarget,
      challenges,
      Math.max(players.length, 130)
    );
  }, [currentUser, challengeTarget, challenges, players.length]);

  const directBuilt = useMemo(
    () => buildLiveScoreFromDirectDraft(directDraft),
    [directDraft]
  );

  const activeSbData = useMemo(() => {
    if (!activeScoreboardChallenge) return null;
    const pA = playersMap[activeScoreboardChallenge.playerAId];
    const pB = playersMap[activeScoreboardChallenge.playerBId];
    const judgePlayer = activeScoreboardChallenge.judgeId
      ? playersMap[activeScoreboardChallenge.judgeId]
      : null;
    const perms = getMatchPermissions(activeScoreboardChallenge, currentUser, isAdmin);

    const liveScore = activeScoreboardChallenge.liveScore || createEmptyLiveScore();
    const effectiveScore =
      scoreModalMode === 'direct' && perms.canConfirmOfficial
        ? directBuilt.liveScore
        : liveScore;

    const scoreEval = evaluateMatchScore(effectiveScore);
    const previewElo =
      scoreEval.finished && activeScoreboardChallenge.mode !== 'Amistoso' && pA && pB
        ? calculateOfficialMatchElo({
            playerA: pA,
            playerB: pB,
            liveScore: effectiveScore,
            challenges,
            totalActivePlayers: Math.max(players.length, 130),
          })
        : null;

    const winnerPreviewObj =
      scoreEval.winnerSide === 'A' ? pA : scoreEval.winnerSide === 'B' ? pB : null;
    const previewVictoryGems =
      scoreEval.finished && activeScoreboardChallenge.mode !== 'Amistoso' && winnerPreviewObj
        ? calculateMatchVictoryGems(effectiveScore, Boolean(winnerPreviewObj.isVip), false)
        : null;

    return {
      pA,
      pB,
      judgePlayer,
      perms,
      liveScore,
      effectiveScore,
      scoreEval,
      previewElo,
      previewVictoryGems,
      winnerPreviewObj,
    };
  }, [
    activeScoreboardChallenge,
    playersMap,
    currentUser,
    isAdmin,
    scoreModalMode,
    directBuilt.liveScore,
    challenges,
    players.length,
  ]);

  const victoryGemsRange = useMemo(
    () => getMatchVictoryGemsRange(Boolean(currentUser?.isVip)),
    [currentUser?.isVip]
  );

  const activeMyChallengesCount = useMemo(
    () => myChallenges.filter((c) => c.status !== 'FINISHED').length,
    [myChallenges]
  );

return (
    <section
      className={`tt-retos-view ${modeClass}`}
      aria-label="Retos y Cartelera Oficial TOTAL TENIS"
    >
      {/* ====================================================================
          1. CARRUSEL HERO 3D INSTANTÁNEO (3 FOTOS PRECARGADAS + CROSSFADE)
          ==================================================================== */}
      <div className="tt-hero-stage">
        {heroSlides.map((slide, idx) => (
          <SmartImage
            key={slide.id}
            src={slide.image}
            fallbackSrc={ASSETS.bienvenidaOscuro}
            alt={slide.title}
            priority
            className={`tt-hero-stage-bg ${idx === currentSlideIdx ? 'is-visible' : ''}`}
          />
        ))}
        <div className="tt-hero-stage-scrim" />

        <div className="tt-hero-stage-content">
          <span className="tt-hero-eyebrow">
            <span className="tt-live-dot-inline" />
            {activeSlide.tag}
          </span>

          <h1 key={activeSlide.id} className="tt-hero-headline">
            {activeSlide.title}
          </h1>
          <p className="tt-hero-subcopy">{activeSlide.subtitle}</p>

          <div className="tt-hero-footer-row">
            <button
              type="button"
              className="tt-hero-cta-3d"
              onClick={activeSlide.onCta}
            >
              <span className="tt-cta-emerald-dot" />
              {activeSlide.ctaLabel}
            </button>

            <div className="tt-hero-controls">
              <div className="tt-hero-dots" aria-hidden="true">
                {heroSlides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`tt-hero-dot ${idx === currentSlideIdx ? 'is-active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setHeroSlideIdx(idx);
                    }}
                    aria-label={`Ir a diapositiva ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="tt-hero-arrows">
                <button
                  type="button"
                  aria-label="Anterior"
                  className="tt-circle-nav-btn"
                  onClick={() => {
                    triggerHaptic('light');
                    setHeroSlideIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  className="tt-circle-nav-btn"
                  onClick={() => {
                    triggerHaptic('light');
                    setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
                  }}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. ALERTA PRIORITARIA 3D DE RETOS ENTRANTES PENDIENTES
          ==================================================================== */}
      {incomingPending.length > 0 && (
        <div className="tt-incoming-alert">
          <div className="tt-incoming-alert-head">
            <IconBadge name="challenge" variant="emerald" size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="tt-incoming-kicker">
                TIENES {incomingPending.length}{' '}
                {incomingPending.length === 1 ? 'DESAFÍO PENDIENTE' : 'DESAFÍOS PENDIENTES'}
              </span>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#FAF9F5' }}>
                {playersMap[incomingPending[0].playerAId]?.name || 'Un jugador'} te retó en{' '}
                {incomingPending[0].clubName}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 11 }}>
            <button
              type="button"
              className="tt-btn tt-btn-primary tt-btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                triggerHaptic('success');
                handleAcceptChallenge(incomingPending[0]);
              }}
            >
              Aceptar ahora
            </button>
            <button
              type="button"
              className="tt-rt-hero-ghost-btn"
              onClick={() => {
                triggerHaptic('light');
                setSubTab('mis-retos');
              }}
            >
              Ver detalles
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          3. DOCK 3D TÁCTIL DE 3 SUB-VISTAS (CARTELERA | TUS DESAFÍOS | LANZAR RETO)
          ==================================================================== */}
      <div className="tt-rt-3d-dock" role="tablist" aria-label="Secciones de Retos">
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'cartelera'}
          className={`tt-rt-3d-tab ${subTab === 'cartelera' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setSubTab('cartelera');
          }}
        >
          <span>Cartelera</span>
          {liveChallenges.length > 0 && (
            <span className="tt-subtab-chip is-live">{liveChallenges.length}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'mis-retos'}
          className={`tt-rt-3d-tab ${subTab === 'mis-retos' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setSubTab('mis-retos');
          }}
        >
          <span>Tus Desafíos</span>
          {activeMyChallengesCount > 0 && (
            <span className="tt-subtab-chip">{activeMyChallengesCount}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'lanzar'}
          className={`tt-rt-3d-tab is-cta ${subTab === 'lanzar' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setSubTab('lanzar');
          }}
        >
          <TTIcon name="challenge" size={15} />
          <span>Lanzar Reto</span>
        </button>
      </div>

      {/* ====================================================================
          4A. CARTELERA PÚBLICA (FILTROS 3D + TARJETAS PÓSTER VS CON RELIEVE)
          ==================================================================== */}
      {subTab === 'cartelera' && (
        <div key="panel-cartelera" className="tt-retos-panel tt-rt-panel-in">
          <div className="tt-filter-pills-row">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'IN_PLAY', label: 'En juego' },
              { id: 'SCHEDULED', label: 'Programados' },
              { id: 'FINISHED', label: 'Resultados' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`tt-rt-3d-chip ${boardFilter === f.id ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setBoardFilter(f.id);
                }}
              >
                {f.id === 'IN_PLAY' && <span className="tt-chip-live-dot" aria-hidden="true" />}
                <span>{f.label}</span>
              </button>
            ))}
          </div>
          <SponsorStaticBanner
         sponsorsConfig={sponsorsConfig}
         theme={theme}
         onTrackImpression={onTrackSponsorImpression}
         onTrackClick={onTrackSponsorClick}
       />
          {publicBoardChallenges.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="La cancha está esperando"
              description="Todavía no hay duelos publicados en este filtro. Sé el primero en abrir la jornada."
              actionLabel="Lanzar un Reto"
              onAction={() => setSubTab('lanzar')}
            />
          ) : (
            <div className="tt-matches-grid">
              {publicBoardChallenges.map((ch) => (
                <MatchPosterCard
                  key={ch.id}
                  challenge={ch}
                  playerA={playersMap[ch.playerAId]}
                  playerB={playersMap[ch.playerBId]}
                  judgePlayer={ch.judgeId ? playersMap[ch.judgeId] : null}
                  clubs={clubs}
                  allPlayers={players}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onOpenScoreModal={openScoreModal}
                  onAcceptChallenge={handleAcceptChallenge}
                  onDeclineChallenge={handleDeclineChallenge}
                  onOpenReschedule={(item) => {
                    setReschedDate(getTodayDateInputValue(2));
                    setReschedTime('19:00');
                    setRescheduleTarget(item);
                  }}
                  onOpenPlayerProfile={onOpenPlayerProfile}
                  onOpenStories={onOpenStoriesWithMatch}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          4B. TUS DESAFÍOS
          ==================================================================== */}
      {subTab === 'mis-retos' && (
        <div key="panel-mis-retos" className="tt-retos-panel tt-rt-panel-in">
          {!currentUser ? (
            <EmptyStateCard
              theme={theme}
              title="Inicia sesión para gestionar tus partidos"
              description="Aquí verás tus retos recibidos, partidos programados y resultados por confirmar."
              actionLabel="Iniciar Sesión"
              onAction={() => onOpenAuth && onOpenAuth('login')}
            />
          ) : currentUser.isTutorOnly ? (
            <EmptyStateCard
              theme={theme}
              title="Cuenta en Modo Solo Padre / Tutor"
              description="Entra a la pestaña Perfil y toca «Entrar como...» en la ficha de tu hijo/a para ver y confirmar sus partidos."
            />
          ) : myChallenges.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Aún no tienes duelos pactados"
              description="Elige un rival de tu categoría en Lanzar Reto, acuerda sede y suma puntos oficiales."
              actionLabel="Lanzar mi Primer Reto"
              onAction={() => setSubTab('lanzar')}
            />
          ) : (
            <div className="tt-matches-grid">
              {myChallenges.map((ch) => (
                <MatchPosterCard
                  key={ch.id}
                  challenge={ch}
                  playerA={playersMap[ch.playerAId]}
                  playerB={playersMap[ch.playerBId]}
                  judgePlayer={ch.judgeId ? playersMap[ch.judgeId] : null}
                  clubs={clubs}
                  allPlayers={players}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onOpenScoreModal={openScoreModal}
                  onAcceptChallenge={handleAcceptChallenge}
                  onDeclineChallenge={handleDeclineChallenge}
                  onOpenReschedule={(item) => {
                    setReschedDate(getTodayDateInputValue(2));
                    setReschedTime('19:00');
                    setRescheduleTarget(item);
                  }}
                  onOpenPlayerProfile={onOpenPlayerProfile}
                  onOpenStories={onOpenStoriesWithMatch}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          4C. LANZAR RETO (RADAR 3D CON ANTI-ESCASEZ + PROTECCIÓN TUTELA)
          ==================================================================== */}
      {subTab === 'lanzar' && (
        <div key="panel-lanzar" className="tt-retos-panel tt-rt-panel-in">
          {currentUser?.isTutorOnly && (
            <div className="tt-tutor-only-card">
              <TTIcon name="shield" size={18} style={{ color: 'var(--tt-sky-text, #7DD3FC)', flexShrink: 0 }} />
              <div>
                <strong>Cuenta Solo Padre / Tutor</strong>
                <p>
                  Para retar a nombre de tu hijo/a (-18), ve a la pestaña <b>Perfil</b> y toca{' '}
                  <b>Entrar como...</b> en su subcuenta tutelada.
                </p>
              </div>
            </div>
          )}

          {adaptiveRadar.expanded && currentUser && !currentUser.isTutorOnly && (
            <div className="tt-scarcity-banner">
              <TTIcon name="shield" size={18} style={{ color: 'var(--tt-emerald-text)', flexShrink: 0 }} />
              <div>
                <strong>Ventana Anti-Escasez activa (±1,800 pts)</strong>
                <p>
                  Como hay menos de 6 rivales en tu rango base (±1,200), ampliamos tus retos
                  oficiales a los 8 rivales más cercanos y tu cuota mensual baja a{' '}
                  <b>{adaptiveRadar.monthlyQuota} partidos/mes</b>.
                </p>
              </div>
            </div>
          )}

          <div className="tt-radar-controls">
            <div className="tt-search-box">
              <TTIcon name="search" size={17} style={{ opacity: 0.7 }} />
              <input
                type="search"
                value={rivalSearch}
                onChange={(e) => setRivalSearch(e.target.value)}
                placeholder="Buscar rival por nombre o club..."
                aria-label="Buscar rival"
              />
            </div>

            <div className="tt-filter-pills-row">
              <button
                type="button"
                className={`tt-rt-3d-chip ${onlyInRange ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setOnlyInRange((v) => !v);
                }}
              >
                {onlyInRange
                  ? adaptiveRadar.expanded
                    ? 'Mi rango ampliado (±1,800)'
                    : 'Solo en mi rango (±1,200)'
                  : 'Ver todos los niveles'}
              </button>

              <button
                type="button"
                className={`tt-rt-3d-chip ${categoryFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setCategoryFilter('ALL');
                }}
              >
                Todas las categorías
              </button>

              {CATEGORIES_SCALE.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`tt-rt-3d-chip ${categoryFilter === cat.id ? 'is-active' : ''}`}
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

          {availableRivals.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin rivales con esos filtros"
              description="Amplía el rango de categorías o borra la búsqueda para ver todos los jugadores activos."
              actionLabel="Mostrar todos"
              onAction={() => {
                setRivalSearch('');
                setCategoryFilter('ALL');
                setOnlyInRange(false);
              }}
            />
          ) : (
            <div className="tt-rivals-list">
              {availableRivals.map(({ player, inOfficialRange, viaExpanded }) => {
                const cat = getCategoryByPoints(player.points);
                const forecast =
                  currentUser && !currentUser.isTutorOnly
                    ? getPreMatchForecast(
                        currentUser,
                        player,
                        challenges,
                        Math.max(players.length, 130)
                      )
                    : null;
                const wins = Number(player.wins) || 0;
                const losses = Number(player.losses) || 0;
                const total = wins + losses;
                const eff = total > 0 ? Math.round((wins / total) * 100) : 0;

                return (
                  <div
                    key={player.id}
                    className={`tt-rival-row ${!inOfficialRange ? 'is-out-of-range' : ''}`}
                  >
                    <PlayerAvatarWithClub
                      player={player}
                      clubs={clubs}
                      size={52}
                      ringColor={cat.color}
                      onClick={onOpenPlayerProfile}
                    />

                    <div className="tt-rival-info">
                      <div className="tt-rival-name-line">
                        <strong>{player.name}</strong>
                        {player.isVip && <span className="tt-vip-micro-pill">VIP</span>}
                        {player.isTutelado && <span className="tt-tutela-mini-pill">Tutelada</span>}
                      </div>

                      <div className="tt-rival-meta-line">
                        <span className="tt-cat-mini-pill">
                          <i className="tt-cat-dot-inline" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                        <span>{Number(player.points || 0).toLocaleString('es-PE')} pts</span>
                        <span>·</span>
                        <span>{eff}% Victorias</span>
                      </div>

                      {forecast && inOfficialRange ? (
                        <div className="tt-rival-forecast-line">
                          <span className="is-win">
                            +{forecast.playerA.minWin} a +{forecast.playerA.maxWin} pts
                          </span>
                          <span>·</span>
                          <span className="is-gems">
                            +{victoryGemsRange.min} a +{victoryGemsRange.max} 💎
                          </span>
                          <span>·</span>
                          <span className="is-loss">
                            {forecast.playerA.minLoss} a {forecast.playerA.maxLoss} pts
                          </span>
                          {viaExpanded && <span className="is-expanded">· Rango ampliado</span>}
                        </div>
                      ) : !inOfficialRange ? (
                        <div className="tt-rival-forecast-line">
                          <span>
                            Fuera de tu rango oficial (±
                            {adaptiveRadar.effectiveWindow.toLocaleString('es-PE')} pts) · Disponible
                            como amistoso
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="tt-rival-cta-col">
                      {inOfficialRange ? (
                        <button
                          type="button"
                          className="tt-btn tt-btn-primary tt-btn-sm"
                          onClick={() => {
                            triggerHaptic('medium');
                            openCreateChallengeModal(player, false);
                          }}
                        >
                          {player.isTutelado ? 'Retar (Tutor)' : 'Desafiar'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="tt-btn tt-btn-ghost tt-btn-sm"
                          onClick={() => {
                            triggerHaptic('light');
                            openCreateChallengeModal(player, true);
                          }}
                        >
                          Amistoso
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL 1: PACTAR NUEVO DESAFÍO (ELO + GEMAS HASTA 6-0, 6-0 + MODO CLARO)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(challengeTarget)}
        onClose={() => setChallengeTarget(null)}
        title="Pactar Nuevo Desafío"
        subtitle={
          challengeTarget ? `${currentUser?.name || 'Tú'} vs. ${challengeTarget.name}` : ''
        }
        icon={<IconBadge name="challenge" variant="emerald" size={38} />}
      >
        {challengeTarget && (
          <form onSubmit={handleSubmitNewChallenge} className={`tt-form-stack ${modeClass}`}>
            {challengeTarget.isTutelado && (
              <div className="tt-tutor-only-card">
                <TTIcon
                  name="shield"
                  size={17}
                  style={{ color: 'var(--tt-sky-text, #7DD3FC)', flexShrink: 0 }}
                />
                <div>
                  <strong>Cuenta Juvenil Tutelada (-18)</strong>
                  <p>
                    Este reto y toda coordinación por WhatsApp se enviarán directamente al
                    padre/madre verificado ({challengeTarget.tutorName || 'Tutor'}).
                  </p>
                </div>
              </div>
            )}

            {preMatchForecast && formMode === 'Por puntos' && (
              <div className="tt-forecast-box">
                <div className="tt-forecast-head">
                  <strong>Puntos y Gemas en juego</strong>
                  <span className="tt-rematch-tag">{preMatchForecast.rematch.label}</span>
                </div>

                <div className="tt-forecast-grid">
                  <div className="tt-forecast-cell is-win">
                    <span>Si ganas (hasta)</span>
                    <strong>+{preMatchForecast.playerA.maxWin} pts</strong>
                    <small>
                      Según marcador: +{preMatchForecast.playerA.minWin} a +
                      {preMatchForecast.playerA.maxWin}
                    </small>
                  </div>
                  <div className="tt-forecast-cell is-loss">
                    <span>Si pierdes (hasta)</span>
                    <strong>{preMatchForecast.playerA.maxLoss} pts</strong>
                    <small>En 3 sets: {preMatchForecast.playerA.minLoss} pts</small>
                  </div>
                </div>

                <div className="tt-gems-forecast-strip">
                  <div className="tt-gems-forecast-top">
                    <span>
                      Gemas por victoria{' '}
                      {currentUser?.isVip ? '· Socio VIP (×2.5)' : '· Plan Estándar'}
                    </span>
                    <strong>
                      +{victoryGemsRange.min} a +{victoryGemsRange.max} 💎
                    </strong>
                  </div>

                  <div className="tt-gems-tiers-row">
                    <span>
                      <b>3 sets:</b> +{currentUser?.isVip ? 10 : 4} 💎
                    </span>
                    <span>
                      <b>2 sets:</b> +{currentUser?.isVip ? 15 : 6} 💎
                    </span>
                    <span>
                      <b>≤4 games:</b> +{currentUser?.isVip ? 20 : 8} 💎
                    </span>
                    <span className="is-max">
                      <b>6-0, 6-0:</b> +{victoryGemsRange.max} 💎
                    </span>
                  </div>

                  {!currentUser?.isVip && (
                    <small className="tt-gems-vip-upsell">
                      Máximo posible con <b>6-0, 6-0</b>: <b>+{victoryGemsRange.standardMax} 💎</b>{' '}
                      (Socio VIP gana hasta <b>+{victoryGemsRange.vipMax} 💎</b>).
                    </small>
                  )}
                </div>
              </div>
            )}

            <div className="tt-field-group">
              <label className="tt-field-label">Modalidad del partido</label>
              <div className="tt-toggle-pair">
                {['Por puntos', 'Amistoso'].map((m) => {
                  const blocked = m === 'Por puntos' && !isRivalInOfficialRange(challengeTarget);
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={blocked}
                      className={`tt-choice-pill ${formMode === m ? 'is-selected' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setFormMode(m);
                      }}
                    >
                      {m === 'Por puntos' ? 'Oficial · Por puntos' : 'Amistoso'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="tt-field-group">
              <label className="tt-field-label">Elige la sede del encuentro</label>
              <div className="tt-venues-select-grid">
                {(clubs || []).map((club) => {
                  const selected = formClubId === club.id;
                  return (
                    <button
                      key={club.id}
                      type="button"
                      className={`tt-venue-option ${selected ? 'is-selected' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setFormClubId(club.id);
                      }}
                    >
                      <SmartImage
                        src={club.logo}
                        alt={club.shortName}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          backgroundColor: '#FFFFFF',
                          flexShrink: 0,
                        }}
                      />
                      <span>{club.shortName || club.name}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  className={`tt-venue-option is-custom ${
                    formClubId === 'custom' ? 'is-selected' : ''
                  }`}
                  onClick={() => {
                    triggerHaptic('light');
                    setFormClubId('custom');
                  }}
                >
                  <TTIcon name="mapPin" size={18} />
                  <span>Otra Cancha / Sede Personalizada</span>
                </button>
              </div>

              {formClubId === 'custom' && (
                <input
                  type="text"
                  className="tt-input"
                  value={formCustomVenue}
                  onChange={(e) => setFormCustomVenue(e.target.value)}
                  placeholder="Ej. Cancha Municipal, Club Privado o dirección..."
                  maxLength={70}
                  required
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <div className="tt-date-time-grid">
              <div className="tt-field-group">
                <label className="tt-field-label" htmlFor="tt-reto-date">
                  Fecha
                </label>
                <input
                  id="tt-reto-date"
                  type="date"
                  className="tt-input"
                  value={formDate}
                  min={getTodayDateInputValue(0)}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div className="tt-field-group">
                <label className="tt-field-label" htmlFor="tt-reto-time">
                  Hora
                </label>
                <input
                  id="tt-reto-time"
                  type="time"
                  className="tt-input"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="tt-quick-slots-row">
              {QUICK_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`tt-slot-chip ${formTime === slot ? 'is-selected' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setFormTime(slot);
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="tt-field-group">
              <label className="tt-field-label">Acuerdo de pelotas</label>
              <div className="tt-balls-stack">
                {BALLS_AGREEMENTS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`tt-choice-pill ${formBalls === opt ? 'is-selected' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setFormBalls(opt);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
              <button
                type="button"
                className="tt-btn tt-btn-ghost"
                onClick={() => setChallengeTarget(null)}
              >
                Cancelar
              </button>
              <button type="submit" className="tt-btn tt-btn-primary" style={{ flex: 1 }}>
                Enviar Desafío
              </button>
            </div>
          </form>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 2: SUBIR RESULTADO DIRECTO (JUGADORES) | EN VIVO (ÁRBITRO 3D)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(activeScoreboardChallenge && activeSbData)}
        onClose={() => {
          setShowWalkoverBox(false);
          setActiveScoreboardId(null);
        }}
        title={
          scoreModalMode === 'direct' && activeSbData?.perms?.canConfirmOfficial
            ? 'Subir Resultado Final'
            : 'Marcador en Vivo'
        }
        subtitle={activeScoreboardChallenge?.clubName || ''}
        icon={<IconBadge name="scoreboard" variant="emerald" size={38} />}
        isWide
      >
        {activeScoreboardChallenge && activeSbData && (
          <div className={`tt-mc-container ${modeClass}`}>
            {activeSbData.perms.canConfirmOfficial && (
              <div className="tt-rt-3d-dock is-two" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={scoreModalMode === 'direct'}
                  className={`tt-rt-3d-tab ${scoreModalMode === 'direct' ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setScoreModalMode('direct');
                  }}
                >
                  Resultado directo
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={scoreModalMode === 'live'}
                  className={`tt-rt-3d-tab ${scoreModalMode === 'live' ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    handleActivateLiveRefereeMode(activeScoreboardChallenge);
                  }}
                >
                  Modo Árbitro (en vivo)
                </button>
              </div>
            )}

            <div className="tt-stadium-board">
              <div className="tt-stadium-head">
                <span>JUGADORES</span>
                <div className="tt-stadium-cols">
                  <span>S1</span>
                  <span>S2</span>
                  {(activeSbData.scoreEval.needsSuperTieBreak || directBuilt.needsStb) && (
                    <span style={{ color: '#F4DA92' }}>STB</span>
                  )}
                </div>
              </div>

              <div className="tt-stadium-row">
                <div className="tt-stadium-player">
                  <PlayerAvatarWithClub
                    player={activeSbData.pA}
                    clubs={clubs}
                    size={38}
                    ringColor="#00DC7D"
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong>{activeSbData.pA?.name}</strong>
                    <small>{getCategoryByPoints(activeSbData.pA?.points).name}</small>
                  </div>
                </div>
                <div className="tt-stadium-cols">
                  <span className="tt-st-num">
                    {activeSbData.effectiveScore.set1.a}
                    {activeSbData.effectiveScore.set1.tbA > 0 ||
                    activeSbData.effectiveScore.set1.tbB > 0 ? (
                      <sup>{activeSbData.effectiveScore.set1.tbA}</sup>
                    ) : null}
                  </span>
                  <span className="tt-st-num">
                    {activeSbData.effectiveScore.set2.a}
                    {activeSbData.effectiveScore.set2.tbA > 0 ||
                    activeSbData.effectiveScore.set2.tbB > 0 ? (
                      <sup>{activeSbData.effectiveScore.set2.tbA}</sup>
                    ) : null}
                  </span>
                  {(activeSbData.scoreEval.needsSuperTieBreak || directBuilt.needsStb) && (
                    <span className="tt-st-num is-stb">
                      {activeSbData.effectiveScore.set3.a}
                    </span>
                  )}
                </div>
              </div>

              <div className="tt-stadium-row">
                <div className="tt-stadium-player">
                  <PlayerAvatarWithClub
                    player={activeSbData.pB}
                    clubs={clubs}
                    size={38}
                    ringColor="#E5C16C"
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong>{activeSbData.pB?.name}</strong>
                    <small>{getCategoryByPoints(activeSbData.pB?.points).name}</small>
                  </div>
                </div>
                <div className="tt-stadium-cols">
                  <span className="tt-st-num">
                    {activeSbData.effectiveScore.set1.b}
                    {activeSbData.effectiveScore.set1.tbA > 0 ||
                    activeSbData.effectiveScore.set1.tbB > 0 ? (
                      <sup>{activeSbData.effectiveScore.set1.tbB}</sup>
                    ) : null}
                  </span>
                  <span className="tt-st-num">
                    {activeSbData.effectiveScore.set2.b}
                    {activeSbData.effectiveScore.set2.tbA > 0 ||
                    activeSbData.effectiveScore.set2.tbB > 0 ? (
                      <sup>{activeSbData.effectiveScore.set2.tbB}</sup>
                    ) : null}
                  </span>
                  {(activeSbData.scoreEval.needsSuperTieBreak || directBuilt.needsStb) && (
                    <span className="tt-st-num is-stb">
                      {activeSbData.effectiveScore.set3.b}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {activeSbData.perms.canConfirmOfficial && scoreModalMode === 'direct' && (
              <div className="tt-mc-controls-wrap">
                <p className="tt-direct-hint">
                  Escribe el marcador final de cada set. Al enviarlo, tu rival recibirá una alerta
                  para confirmarlo.
                </p>

                <div className="tt-direct-set-box">
                  <div className="tt-direct-set-head">
                    <strong>Set 1</strong>
                    <span>Ej. 6 - 4, 7 - 5 o 7 - 6</span>
                  </div>
                  <div className="tt-direct-inputs-row">
                    <label className="tt-direct-field">
                      <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        placeholder="0"
                        className="tt-direct-num-input"
                        value={directDraft.s1a}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, s1a: e.target.value.slice(0, 1) }))
                        }
                      />
                    </label>
                    <span className="tt-direct-dash">–</span>
                    <label className="tt-direct-field">
                      <span>{activeSbData.pB?.name?.split(' ')[0]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        placeholder="0"
                        className="tt-direct-num-input"
                        value={directDraft.s1b}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, s1b: e.target.value.slice(0, 1) }))
                        }
                      />
                    </label>
                  </div>

                  {directBuilt.s1Tb && (
                    <div className="tt-direct-tb-row">
                      <span>Tie-Break Set 1 (opcional):</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder={Number(directDraft.s1a) === 7 ? '7' : '5'}
                        className="tt-direct-tb-input"
                        value={directDraft.tb1a}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, tb1a: e.target.value.slice(0, 2) }))
                        }
                      />
                      <span>–</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder={Number(directDraft.s1b) === 7 ? '7' : '5'}
                        className="tt-direct-tb-input"
                        value={directDraft.tb1b}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, tb1b: e.target.value.slice(0, 2) }))
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="tt-direct-set-box">
                  <div className="tt-direct-set-head">
                    <strong>Set 2</strong>
                    <span>Ej. 6 - 3, 4 - 6 o 7 - 6</span>
                  </div>
                  <div className="tt-direct-inputs-row">
                    <label className="tt-direct-field">
                      <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        placeholder="0"
                        className="tt-direct-num-input"
                        value={directDraft.s2a}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, s2a: e.target.value.slice(0, 1) }))
                        }
                      />
                    </label>
                    <span className="tt-direct-dash">–</span>
                    <label className="tt-direct-field">
                      <span>{activeSbData.pB?.name?.split(' ')[0]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        placeholder="0"
                        className="tt-direct-num-input"
                        value={directDraft.s2b}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, s2b: e.target.value.slice(0, 1) }))
                        }
                      />
                    </label>
                  </div>

                  {directBuilt.s2Tb && (
                    <div className="tt-direct-tb-row">
                      <span>Tie-Break Set 2 (opcional):</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder={Number(directDraft.s2a) === 7 ? '7' : '5'}
                        className="tt-direct-tb-input"
                        value={directDraft.tb2a}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, tb2a: e.target.value.slice(0, 2) }))
                        }
                      />
                      <span>–</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder={Number(directDraft.s2b) === 7 ? '7' : '5'}
                        className="tt-direct-tb-input"
                        value={directDraft.tb2b}
                        onChange={(e) =>
                          setDirectDraft((d) => ({ ...d, tb2b: e.target.value.slice(0, 2) }))
                        }
                      />
                    </div>
                  )}
                </div>

                {directBuilt.needsStb && (
                  <div className="tt-direct-set-box is-stb-card">
                    <div className="tt-direct-set-head">
                      <strong>3er Set · Super Tie-Break (a 10+)</strong>
                      <span>Diferencia de 2 puntos</span>
                    </div>
                    <div className="tt-direct-inputs-row">
                      <label className="tt-direct-field">
                        <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={30}
                          placeholder="10"
                          className="tt-direct-num-input"
                          value={directDraft.s3a}
                          onChange={(e) =>
                            setDirectDraft((d) => ({ ...d, s3a: e.target.value.slice(0, 2) }))
                          }
                        />
                      </label>
                      <span className="tt-direct-dash">–</span>
                      <label className="tt-direct-field">
                        <span>{activeSbData.pB?.name?.split(' ')[0]}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={30}
                          placeholder="8"
                          className="tt-direct-num-input"
                          value={directDraft.s3b}
                          onChange={(e) =>
                            setDirectDraft((d) => ({ ...d, s3b: e.target.value.slice(0, 2) }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                )}

                {activeSbData.scoreEval.finished ? (
                  <div className="tt-elo-preview-card">
                    <div className="tt-elo-preview-head">
                      <strong>Marcador listo: {activeSbData.scoreEval.summary}</strong>
                      <span>
                        {activeScoreboardChallenge.mode === 'Amistoso'
                          ? 'Partido amistoso (sin cambio de puntos)'
                          : 'Se enviará a tu rival para confirmar puntos y Gemas'}
                      </span>
                    </div>

                    {activeSbData.previewElo?.ok && (
                      <div className="tt-elo-preview-deltas">
                        <div>
                          <span>{activeSbData.pA?.name?.split(' ')[0]}</span>
                          <strong
                            style={{
                              color:
                                activeSbData.previewElo.deltaA >= 0
                                  ? 'var(--tt-emerald-text)'
                                  : 'var(--tt-danger-text, #EF4444)',
                            }}
                          >
                            {activeSbData.previewElo.deltaA >= 0
                              ? `+${activeSbData.previewElo.deltaA}`
                              : activeSbData.previewElo.deltaA}{' '}
                            pts
                          </strong>
                        </div>
                        <div>
                          <span>{activeSbData.pB?.name?.split(' ')[0]}</span>
                          <strong
                            style={{
                              color:
                                activeSbData.previewElo.deltaB >= 0
                                  ? 'var(--tt-emerald-text)'
                                  : 'var(--tt-danger-text, #EF4444)',
                            }}
                          >
                            {activeSbData.previewElo.deltaB >= 0
                              ? `+${activeSbData.previewElo.deltaB}`
                              : activeSbData.previewElo.deltaB}{' '}
                            pts
                          </strong>
                        </div>
                      </div>
                    )}

                    {activeSbData.previewVictoryGems?.awarded > 0 && (
                      <div className="tt-gems-preview-pill">
                        <span>
                          Gemas para {activeSbData.winnerPreviewObj?.name?.split(' ')[0]} ·{' '}
                          {activeSbData.previewVictoryGems.tierLabel}
                        </span>
                        <strong>+{activeSbData.previewVictoryGems.awarded} 💎</strong>
                      </div>
                    )}

                    <button
                      type="button"
                      className="tt-btn tt-btn-primary"
                      style={{ width: '100%', marginTop: 10 }}
                      onClick={() =>
                        handleSubmitMatchResult({
                          scoreObj: activeSbData.effectiveScore,
                          isWalkover: false,
                        })
                      }
                    >
                      {isAdmin ? 'Confirmar Resultado Oficial' : 'Enviar Resultado a mi Rival'}
                    </button>
                  </div>
                ) : (
                  <div className="tt-direct-validation-note">
                    {directBuilt.needsStb
                      ? 'Empataron 1-1 en sets: ingresa el Super Tie-Break (a 10 puntos con diferencia de 2).'
                      : 'Completa Set 1 y Set 2 con un marcador válido (ej. 6-4, 6-2 o 7-6) para enviar el resultado.'}
                  </div>
                )}

                <div className="tt-mc-secondary-bar">
                  <button
                    type="button"
                    className="tt-text-action"
                    onClick={() => setShowWalkoverBox((v) => !v)}
                  >
                    Reportar Walkover (Inasistencia)
                  </button>
                </div>

                {showWalkoverBox && (
                  <div className="tt-wo-box">
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem' }}>
                      Selecciona quién se presentó en cancha para registrar el Walkover:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        onClick={() =>
                          handleSubmitMatchResult({
                            scoreObj: createEmptyLiveScore(),
                            isWalkover: true,
                            walkoverWinnerSide: 'A',
                          })
                        }
                      >
                        Gana {activeSbData.pA?.name?.split(' ')[0]} (W.O.)
                      </button>
                      <button
                        type="button"
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        onClick={() =>
                          handleSubmitMatchResult({
                            scoreObj: createEmptyLiveScore(),
                            isWalkover: true,
                            walkoverWinnerSide: 'B',
                          })
                        }
                      >
                        Gana {activeSbData.pB?.name?.split(' ')[0]} (W.O.)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSbData.perms.canEditScore &&
              (scoreModalMode === 'live' || !activeSbData.perms.canConfirmOfficial) && (
                <div className="tt-mc-controls-wrap">
                  {activeSbData.perms.canAssignJudge && (
                    <div className="tt-judge-assign-box">
                      <label className="tt-field-label" htmlFor="tt-judge-select">
                        Designar Árbitro en Cancha (lleva los games en vivo)
                      </label>
                      <select
                        id="tt-judge-select"
                        className="tt-input"
                        value={activeScoreboardChallenge.judgeId || ''}
                        onChange={(e) => handleAssignJudge(e.target.value)}
                      >
                        <option value="">Sin árbitro externo asignado</option>
                        {players
                          .filter(
                            (p) =>
                              !p.isTutorOnly &&
                              p.id !== activeScoreboardChallenge.playerAId &&
                              p.id !== activeScoreboardChallenge.playerBId
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({getCategoryByPoints(p.points).name})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {['set1', 'set2'].map((setKey, idx) => {
                    const sObj = activeSbData.liveScore[setKey];
                    const setLabel = idx === 0 ? 'Set 1' : 'Set 2';
                    const inTieBreak = sObj.a === 6 && sObj.b === 6 && !sObj.locked;
                    const canAddA = canIncrementRegularGame(sObj, 'A');
                    const canAddB = canIncrementRegularGame(sObj, 'B');

                    if (
                      setKey === 'set2' &&
                      !activeSbData.liveScore.set1.locked &&
                      sObj.a === 0 &&
                      sObj.b === 0
                    ) {
                      return null;
                    }

                    return (
                      <div key={setKey} className="tt-set-control-card">
                        <div className="tt-set-control-head">
                          <strong>
                            {setLabel}{' '}
                            {sObj.locked
                              ? '· Cerrado'
                              : inTieBreak
                              ? '· Tie-Break a 7+'
                              : '· En curso'}
                          </strong>
                          {sObj.locked && (
                            <button
                              type="button"
                              className="tt-unlock-btn"
                              onClick={() => {
                                triggerHaptic('light');
                                handleScoreboardAction({ type: 'UNLOCK_SET', setKey });
                              }}
                            >
                              Corregir set
                            </button>
                          )}
                        </div>

                        {!sObj.locked && !inTieBreak && (
                          <div className="tt-dual-stepper">
                            <div className="tt-stepper-side">
                              <span className="tt-stepper-name">
                                {activeSbData.pA?.name?.split(' ')[0]}
                              </span>
                              <div className="tt-stepper-btns">
                                <button
                                  type="button"
                                  className="tt-step-minus"
                                  disabled={sObj.a <= 0}
                                  onClick={() => {
                                    triggerHaptic('light');
                                    handleScoreboardAction({
                                      type: 'GAME_DELTA',
                                      setKey,
                                      side: 'A',
                                      delta: -1,
                                    });
                                  }}
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  className="tt-step-plus"
                                  disabled={!canAddA}
                                  onClick={() => {
                                    triggerHaptic('score');
                                    handleScoreboardAction({
                                      type: 'GAME_DELTA',
                                      setKey,
                                      side: 'A',
                                      delta: 1,
                                    });
                                  }}
                                >
                                  +1 Game
                                </button>
                              </div>
                            </div>

                            <div className="tt-stepper-side">
                              <span className="tt-stepper-name">
                                {activeSbData.pB?.name?.split(' ')[0]}
                              </span>
                              <div className="tt-stepper-btns">
                                <button
                                  type="button"
                                  className="tt-step-minus"
                                  disabled={sObj.b <= 0}
                                  onClick={() => {
                                    triggerHaptic('light');
                                    handleScoreboardAction({
                                      type: 'GAME_DELTA',
                                      setKey,
                                      side: 'B',
                                      delta: -1,
                                    });
                                  }}
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  className="tt-step-plus is-champagne"
                                  disabled={!canAddB}
                                  onClick={() => {
                                    triggerHaptic('score');
                                    handleScoreboardAction({
                                      type: 'GAME_DELTA',
                                      setKey,
                                      side: 'B',
                                      delta: 1,
                                    });
                                  }}
                                >
                                  +1 Game
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {inTieBreak && (
                          <div className="tt-tb-panel">
                            <div className="tt-tb-banner">TIE-BREAK A 7+ (DIFERENCIA DE 2)</div>
                            <div className="tt-dual-stepper">
                              <div className="tt-stepper-side">
                                <span className="tt-stepper-name">
                                  {activeSbData.pA?.name?.split(' ')[0]} ({sObj.tbA})
                                </span>
                                <div className="tt-stepper-btns">
                                  <button
                                    type="button"
                                    className="tt-step-minus"
                                    disabled={sObj.tbA <= 0}
                                    onClick={() =>
                                      handleScoreboardAction({
                                        type: 'TB_DELTA',
                                        setKey,
                                        side: 'A',
                                        delta: -1,
                                      })
                                    }
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    className="tt-step-plus"
                                    onClick={() =>
                                      handleScoreboardAction({
                                        type: 'TB_DELTA',
                                        setKey,
                                        side: 'A',
                                        delta: 1,
                                      })
                                    }
                                  >
                                    +1 Pt TB
                                  </button>
                                </div>
                              </div>

                              <div className="tt-stepper-side">
                                <span className="tt-stepper-name">
                                  {activeSbData.pB?.name?.split(' ')[0]} ({sObj.tbB})
                                </span>
                                <div className="tt-stepper-btns">
                                  <button
                                    type="button"
                                    className="tt-step-minus"
                                    disabled={sObj.tbB <= 0}
                                    onClick={() =>
                                      handleScoreboardAction({
                                        type: 'TB_DELTA',
                                        setKey,
                                        side: 'B',
                                        delta: -1,
                                      })
                                    }
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    className="tt-step-plus is-champagne"
                                    onClick={() =>
                                      handleScoreboardAction({
                                        type: 'TB_DELTA',
                                        setKey,
                                        side: 'B',
                                        delta: 1,
                                      })
                                    }
                                  >
                                    +1 Pt TB
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activeSbData.scoreEval.needsSuperTieBreak && (
                    <div className="tt-set-control-card is-stb-card">
                      <div className="tt-set-control-head">
                        <strong>3er Set · Super Tie-Break a 10+</strong>
                        {activeSbData.liveScore.set3.locked && (
                          <button
                            type="button"
                            className="tt-unlock-btn"
                            onClick={() =>
                              handleScoreboardAction({ type: 'UNLOCK_SET', setKey: 'set3' })
                            }
                          >
                            Corregir STB
                          </button>
                        )}
                      </div>

                      {!activeSbData.liveScore.set3.locked && (
                        <div className="tt-dual-stepper">
                          <div className="tt-stepper-side">
                            <span className="tt-stepper-name">
                              {activeSbData.pA?.name?.split(' ')[0]} (
                              {activeSbData.liveScore.set3.a})
                            </span>
                            <div className="tt-stepper-btns">
                              <button
                                type="button"
                                className="tt-step-minus"
                                disabled={activeSbData.liveScore.set3.a <= 0}
                                onClick={() =>
                                  handleScoreboardAction({
                                    type: 'STB_DELTA',
                                    side: 'A',
                                    delta: -1,
                                  })
                                }
                              >
                                −
                              </button>
                              <button
                                type="button"
                                className="tt-step-plus"
                                onClick={() =>
                                  handleScoreboardAction({
                                    type: 'STB_DELTA',
                                    side: 'A',
                                    delta: 1,
                                  })
                                }
                              >
                                +1 Punto
                              </button>
                            </div>
                          </div>

                          <div className="tt-stepper-side">
                            <span className="tt-stepper-name">
                              {activeSbData.pB?.name?.split(' ')[0]} (
                              {activeSbData.liveScore.set3.b})
                            </span>
                            <div className="tt-stepper-btns">
                              <button
                                type="button"
                                className="tt-step-minus"
                                disabled={activeSbData.liveScore.set3.b <= 0}
                                onClick={() =>
                                  handleScoreboardAction({
                                    type: 'STB_DELTA',
                                    side: 'B',
                                    delta: -1,
                                  })
                                }
                              >
                                −
                              </button>
                              <button
                                type="button"
                                className="tt-step-plus is-champagne"
                                onClick={() =>
                                  handleScoreboardAction({
                                    type: 'STB_DELTA',
                                    side: 'B',
                                    delta: 1,
                                  })
                                }
                              >
                                +1 Punto
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSbData.scoreEval.finished && (
                    <div className="tt-elo-preview-card">
                      <div className="tt-elo-preview-head">
                        <strong>Marcador completo: {activeSbData.scoreEval.summary}</strong>
                      </div>

                      {activeSbData.previewVictoryGems?.awarded > 0 && (
                        <div className="tt-gems-preview-pill" style={{ marginBottom: 10 }}>
                          <span>
                            Gemas para {activeSbData.winnerPreviewObj?.name?.split(' ')[0]} ·{' '}
                            {activeSbData.previewVictoryGems.tierLabel}
                          </span>
                          <strong>+{activeSbData.previewVictoryGems.awarded} 💎</strong>
                        </div>
                      )}

                      {activeSbData.perms.canConfirmOfficial ? (
                        <button
                          type="button"
                          className="tt-btn tt-btn-primary"
                          style={{ width: '100%' }}
                          onClick={() =>
                            handleSubmitMatchResult({
                              scoreObj: activeSbData.liveScore,
                              isWalkover: false,
                            })
                          }
                        >
                          {isAdmin ? 'Confirmar Resultado Oficial' : 'Enviar Resultado a mi Rival'}
                        </button>
                      ) : (
                        <p className="tt-muted" style={{ margin: 0, fontSize: '0.78rem' }}>
                          Como Árbitro en cancha completaste el marcador. Los dos jugadores ya
                          pueden confirmar el resultado final.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="tt-mc-secondary-bar">
                    <button
                      type="button"
                      className="tt-text-action is-danger"
                      onClick={() => {
                        triggerHaptic('warning');
                        handleScoreboardAction({ type: 'RESET' });
                      }}
                    >
                      Reiniciar marcador a 0-0
                    </button>
                  </div>
                </div>
              )}

            {!activeSbData.perms.canEditScore && (
              <div className="tt-spectator-note">
                <TTIcon name="vision" size={18} style={{ color: 'var(--tt-emerald-text)' }} />
                <span>
                  Estás viendo el partido en modo espectador. El marcador se actualiza en vivo
                  desde cancha.
                </span>
              </div>
            )}
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODALES 3 y 4: REPROGRAMACIÓN 24H + CELEBRACIÓN POST-PARTIDO
          ==================================================================== */}
      <RetosRescheduleModal
        rescheduleTarget={rescheduleTarget}
        currentUser={currentUser}
        isAdmin={isAdmin}
        reschedDate={reschedDate}
        setReschedDate={setReschedDate}
        reschedTime={reschedTime}
        setReschedTime={setReschedTime}
        reschedReason={reschedReason}
        setReschedReason={setReschedReason}
        onConfirm={handleConfirmReschedule}
        onClose={() => setRescheduleTarget(null)}
      />

      <RetosCelebrationModal
        celebrationPayload={celebrationPayload}
        onOpenStoriesWithMatch={onOpenStoriesWithMatch}
        onClose={() => setCelebrationPayload(null)}
      />

      <style>{`
        .tt-retos-view {
          display: flex;
          flex-direction: column;
          gap: 14px;
          color: var(--tt-text);
        }
        .tt-retos-view.is-light {
          color: #1E0734;
        }

        /* Física táctil compartida */
        .tt-glass-press {
          transition:
            transform 125ms cubic-bezier(0.22, 1.35, 0.36, 1),
            box-shadow 125ms ease,
            border-color 180ms ease,
            background-color 180ms ease !important;
        }
        .tt-glass-press:active {
          transform: translateY(2px) scale(0.97) !important;
        }
        .tt-rt-avatar-btn {
          transition: transform 160ms cubic-bezier(0.22, 1.35, 0.36, 1);
        }
        .tt-rt-avatar-btn:active {
          transform: scale(0.93);
        }

        /* ==================================================================
           1. CARRUSEL HERO 3D (3 CAPAS PRECARGADAS + CTA 3D TÁCTIL)
           ================================================================== */
        .tt-hero-stage {
          position: relative;
          min-height: 184px;
          border-radius: 24px;
          overflow: hidden;
          background: linear-gradient(135deg, #270A45 0%, #140324 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            0 5px 0 #0D0219,
            0 16px 32px rgba(0, 0, 0, 0.38);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .tt-retos-view.is-light .tt-hero-stage {
          border-color: rgba(30, 7, 52, 0.24);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 5px 0 #CBBFE3,
            0 14px 28px rgba(30, 7, 52, 0.16);
        }
        .tt-hero-stage-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 28%;
          opacity: 0;
          transform: scale(1.04);
          transition: opacity 520ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .tt-hero-stage-bg.is-visible {
          opacity: 1;
          transform: scale(1);
        }
        .tt-hero-stage-scrim {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(
            180deg,
            rgba(20, 5, 36, 0.26) 0%,
            rgba(20, 5, 36, 0.64) 48%,
            rgba(16, 3, 29, 0.96) 100%
          );
        }
        .tt-hero-stage-content {
          position: relative;
          z-index: 2;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          align-self: flex-start;
          padding: 4px 11px;
          border-radius: 999px;
          background: rgba(16, 3, 30, 0.78);
          border: 1px solid rgba(0, 220, 125, 0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #22F397;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(0, 220, 125, 0.22);
        }
        .tt-hero-headline {
          margin: 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: clamp(1.28rem, 5vw, 1.74rem);
          line-height: 1.04;
          color: #FAF9F5;
          text-shadow: 0 3px 14px rgba(0, 0, 0, 0.7);
          animation: ttRtSlideText 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ttRtSlideText {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tt-hero-subcopy {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.35;
          color: rgba(250, 249, 245, 0.88);
        }
        .tt-hero-footer-row {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-hero-cta-3d,
        .tt-hero-cta-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 39px;
          padding: 0 15px;
          border-radius: 13px;
          background: linear-gradient(180deg, #FFFFFF 0%, #ECE6F6 100%);
          border: 1px solid #FFFFFF;
          color: #160428;
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #B6A7D4,
            0 10px 20px rgba(0, 0, 0, 0.38);
          transition: transform 110ms ease, box-shadow 110ms ease;
        }
        .tt-hero-cta-3d:active,
        .tt-hero-cta-pill:active {
          transform: translateY(3px) scale(0.98);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 1px 0 #B6A7D4;
        }
        .tt-cta-emerald-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #00DC7D;
          box-shadow: 0 0 8px rgba(0, 220, 125, 0.85);
          flex-shrink: 0;
        }
        .tt-hero-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tt-hero-dots {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .tt-hero-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.42);
          transition: width 240ms cubic-bezier(0.22, 1.25, 0.36, 1), background-color 200ms ease;
        }
        .tt-hero-dot.is-active {
          width: 24px;
          background: #00E582;
          box-shadow: 0 0 10px rgba(0, 229, 130, 0.7);
        }
        .tt-hero-arrows {
          display: flex;
          gap: 6px;
        }
        .tt-circle-nav-btn {
          width: 31px;
          height: 31px;
          border-radius: 10px;
          background: rgba(26, 8, 46, 0.76);
          border: 1px solid rgba(250, 249, 245, 0.3);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #FAF9F5;
          font-size: 1.05rem;
          font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 0 #0D0219;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 110ms ease;
        }
        .tt-circle-nav-btn:active {
          transform: translateY(2px);
        }
        .tt-live-dot-inline {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00DC7D;
          display: inline-block;
          animation: ttLivePulse 1.6s infinite;
        }

        /* ==================================================================
           2. ALERTA PRIORITARIA 3D DE RETOS ENTRANTES
           ================================================================== */
        .tt-incoming-alert {
          border-radius: 20px;
          padding: 14px;
          background: linear-gradient(145deg, #270A46 0%, #150328 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.62);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 5px 0 #0D0219,
            0 12px 26px rgba(0, 220, 125, 0.18);
          color: #FAF9F5;
        }
        .tt-incoming-alert-head {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .tt-incoming-kicker {
          display: block;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #22F397;
        }
        .tt-rt-hero-ghost-btn {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 12px;
          background: linear-gradient(180deg, #3A1763 0%, #240B41 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.24);
          color: #FAF9F5;
          font-size: 0.77rem;
          font-weight: 900;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 3px 0 #0E021A;
          transition: transform 110ms ease, box-shadow 110ms ease;
        }
        .tt-rt-hero-ghost-btn:active {
          transform: translateY(2px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #0E021A;
        }

        /* ==================================================================
           3. DOCK 3D TÁCTIL (CARTELERA | TUS DESAFÍOS | LANZAR RETO)
           ================================================================== */
        .tt-rt-3d-dock {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
          padding: 6px;
          border-radius: 19px;
          background: rgba(13, 2, 25, 0.82);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            inset 0 2px 7px rgba(0, 0, 0, 0.54),
            0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .tt-rt-3d-dock.is-two {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-retos-view.is-light .tt-rt-3d-dock,
        .tt-mc-container.is-light .tt-rt-3d-dock,
        html[data-theme='light'] .tt-rt-3d-dock {
          background: #E8E1F4;
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow: inset 0 2px 6px rgba(30, 7, 52, 0.14);
        }

        .tt-rt-3d-tab {
          min-height: 43px;
          padding: 0 7px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 0.76rem;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          color: rgba(250, 249, 245, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 4px 0 #10021E,
            0 6px 12px rgba(0, 0, 0, 0.26);
          transition:
            transform 115ms cubic-bezier(0.22, 1.35, 0.36, 1),
            box-shadow 115ms ease,
            background 170ms ease,
            color 150ms ease;
        }
        .tt-rt-3d-tab:active {
          transform: translateY(3px) scale(0.985);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-rt-3d-tab.is-active {
          background: linear-gradient(180deg, #22F397 0%, #00C96F 56%, #00A85B 100%);
          color: #0D0219;
          font-weight: 900;
          border-color: rgba(170, 255, 218, 0.8);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 4px 0 #007540,
            0 10px 20px rgba(0, 220, 125, 0.34);
        }
        .tt-rt-3d-tab.is-active:active {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 0 #007540;
        }

        .tt-retos-view.is-light .tt-rt-3d-tab,
        .tt-mc-container.is-light .tt-rt-3d-tab,
        html[data-theme='light'] .tt-rt-3d-tab {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1ECF9 100%);
          color: #2B1147;
          border-color: rgba(30, 7, 52, 0.18);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #C8BDDF,
            0 5px 10px rgba(30, 7, 52, 0.08);
        }
        .tt-retos-view.is-light .tt-rt-3d-tab:active,
        .tt-mc-container.is-light .tt-rt-3d-tab:active,
        html[data-theme='light'] .tt-rt-3d-tab:active {
          box-shadow: inset 0 1px 0 #FFFFFF, 0 1px 0 #C8BDDF;
        }
        .tt-retos-view.is-light .tt-rt-3d-tab.is-active,
        .tt-mc-container.is-light .tt-rt-3d-tab.is-active,
        html[data-theme='light'] .tt-rt-3d-tab.is-active {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          color: #00E582;
          border-color: #1E0734;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.28),
            0 4px 0 #0D0218,
            0 8px 18px rgba(30, 7, 52, 0.26);
        }

        .tt-subtab-chip {
          min-width: 19px;
          height: 19px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.22);
          color: #22F397;
          font-size: 0.65rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-retos-view.is-light .tt-subtab-chip {
          background: rgba(30, 7, 52, 0.12);
          color: #1E0734;
        }
        .tt-retos-view.is-dark .tt-rt-3d-tab.is-active .tt-subtab-chip {
          background: rgba(13, 2, 25, 0.22);
          color: #0D0219;
        }
        .tt-retos-view.is-light .tt-rt-3d-tab.is-active .tt-subtab-chip {
          background: rgba(0, 229, 130, 0.22);
          color: #00E582;
        }

        /* ==================================================================
           4. FILTROS 3D TÁCTILES (TODOS | EN JUEGO | PROGRAMADOS | RESULTADOS)
           ================================================================== */
        .tt-retos-panel {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-rt-panel-in {
          animation: ttRtFade 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ttRtFade {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tt-filter-pills-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 2px 1px 6px;
          scrollbar-width: none;
        }
        .tt-filter-pills-row::-webkit-scrollbar {
          display: none;
        }

        .tt-rt-3d-chip {
          flex-shrink: 0;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.17);
          color: #EDE8F5;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 3px 0 #10021E,
            0 6px 12px rgba(0, 0, 0, 0.24);
          transition:
            transform 110ms cubic-bezier(0.22, 1.35, 0.36, 1),
            box-shadow 110ms ease,
            background 160ms ease,
            color 150ms ease;
        }
        .tt-rt-3d-chip:active {
          transform: translateY(2px) scale(0.97);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-rt-3d-chip.is-active {
          background: linear-gradient(180deg, #22F397 0%, #00C96F 56%, #00A85B 100%);
          border-color: rgba(170, 255, 218, 0.8);
          color: #0D0219;
          font-weight: 900;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 3px 0 #007540,
            0 8px 18px rgba(0, 220, 125, 0.32);
        }
        .tt-retos-view.is-light .tt-rt-3d-chip {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1ECF9 100%);
          border-color: rgba(30, 7, 52, 0.19);
          color: #1E0734;
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 3px 0 #C8BDDF,
            0 4px 10px rgba(30, 7, 52, 0.08);
        }
        .tt-retos-view.is-light .tt-rt-3d-chip.is-active {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          border-color: #1E0734;
          color: #00E582;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.28),
            0 3px 0 #0D0218,
            0 8px 16px rgba(30, 7, 52, 0.24);
        }
        .tt-chip-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00E582;
          box-shadow: 0 0 8px rgba(0, 229, 130, 0.9);
          flex-shrink: 0;
        }
        .tt-retos-view.is-dark .tt-rt-3d-chip.is-active .tt-chip-live-dot {
          background: #0D0219;
          box-shadow: none;
        }

        /* BANNERS ANTI-ESCASEZ Y TUTELA */
        .tt-scarcity-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 13px;
          border-radius: 16px;
          background: rgba(0, 220, 125, 0.13);
          border: 1.5px solid rgba(0, 220, 125, 0.45);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 3px 0 rgba(0, 117, 64, 0.35);
          font-size: 0.75rem;
        }
        .tt-scarcity-banner strong {
          display: block;
          color: var(--tt-emerald-text);
          font-size: 0.79rem;
        }
        .tt-scarcity-banner p {
          margin: 2px 0 0;
          color: var(--tt-text-muted);
          line-height: 1.4;
        }

        .tt-tutor-only-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 13px;
          border-radius: 16px;
          background: rgba(56, 189, 248, 0.14);
          border: 1.5px solid rgba(56, 189, 248, 0.46);
          font-size: 0.75rem;
        }
        .tt-retos-view.is-light .tt-tutor-only-card,
        .tt-form-stack.is-light .tt-tutor-only-card {
          background: #E8F6FE;
          border-color: rgba(14, 138, 198, 0.42);
        }
        .tt-tutor-only-card strong {
          display: block;
          font-size: 0.79rem;
          color: var(--tt-text);
        }
        .tt-tutor-only-card p {
          margin: 2px 0 0;
          color: var(--tt-text-muted);
          line-height: 1.4;
        }

        .tt-tutela-mini-pill {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 7px;
          background: rgba(56, 189, 248, 0.2);
          border: 1px solid rgba(125, 211, 252, 0.5);
          color: #7DD3FC;
          font-size: 0.57rem;
          font-weight: 900;
          letter-spacing: 0.04em;
        }
        .tt-retos-view.is-light .tt-tutela-mini-pill {
          background: #E0F2FE;
          border-color: #38BDF8;
          color: #0369A1;
        }

        /* ==================================================================
           5. TARJETAS PÓSTER VS 3D + BADGES ILUMINADOS (CLARO Y OSCURO)
           ================================================================== */
        .tt-matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 760px) {
          .tt-matches-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .tt-match-card {
          border-radius: 23px;
          padding: 15px;
          background: linear-gradient(180deg, rgba(44, 17, 74, 0.96) 0%, rgba(23, 6, 42, 0.99) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 5px 0 #0F021C,
            0 14px 26px rgba(0, 0, 0, 0.32);
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-retos-view.is-light .tt-match-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F7F4FC 100%);
          border-color: rgba(30, 7, 52, 0.18);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 5px 0 #D2C8E6,
            0 12px 24px rgba(30, 7, 52, 0.1);
        }
        .tt-match-card.is-live {
          border-color: rgba(0, 229, 130, 0.62);
          box-shadow:
            inset 0 1px 0 rgba(168, 255, 218, 0.28),
            0 5px 0 #005C32,
            0 12px 28px rgba(0, 220, 125, 0.2);
        }
        .tt-match-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        /* BADGES DE ESTADO 3D CON VOLUMEN Y CONTRASTE REAL */
        .tt-match-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 10px;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .tt-match-pill.is-live {
          background: linear-gradient(180deg, #22F397 0%, #00B966 100%);
          color: #0D0219;
          border: 1px solid rgba(170, 255, 218, 0.78);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.68),
            0 2px 0 #007540,
            0 6px 14px rgba(0, 220, 125, 0.3);
        }
        .tt-retos-view.is-light .tt-match-pill.is-live {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          color: #00E582;
          border-color: #1E0734;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 2px 0 #0D0218;
        }
        .tt-match-pill.is-scheduled {
          background: linear-gradient(180deg, rgba(96, 165, 250, 0.28) 0%, rgba(37, 99, 235, 0.18) 100%);
          color: #BAE6FD;
          border: 1px solid rgba(125, 211, 252, 0.56);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 0 rgba(12, 74, 110, 0.65);
        }
        .tt-retos-view.is-light .tt-match-pill.is-scheduled {
          background: linear-gradient(180deg, #E8F6FE 0%, #D5ECFC 100%);
          color: #0369A1;
          border-color: #7DD3FC;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 2px 0 #93C5FD;
        }
        .tt-match-pill.is-pending {
          background: linear-gradient(180deg, rgba(249, 231, 178, 0.26) 0%, rgba(201, 155, 59, 0.14) 100%);
          color: #F8E5AC;
          border: 1px solid rgba(229, 193, 108, 0.62);
          box-shadow:
            inset 0 1px 0 rgba(255, 245, 214, 0.3),
            0 2px 0 rgba(92, 62, 10, 0.68),
            0 4px 12px rgba(229, 193, 108, 0.16);
        }
        .tt-retos-view.is-light .tt-match-pill.is-pending {
          background: linear-gradient(180deg, #FFFBF0 0%, #F9E9BC 100%);
          color: #7A4F05;
          border-color: rgba(180, 126, 22, 0.52);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 2px 0 #DEC277;
        }
        .tt-match-pill.is-disputed {
          background: linear-gradient(180deg, rgba(248, 113, 113, 0.28) 0%, rgba(185, 28, 28, 0.18) 100%);
          color: #FECACA;
          border: 1px solid rgba(248, 113, 113, 0.58);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 2px 0 rgba(127, 29, 29, 0.7);
        }
        .tt-retos-view.is-light .tt-match-pill.is-disputed {
          background: linear-gradient(180deg, #FFF5F5 0%, #FEE2E2 100%);
          color: #B91C1C;
          border-color: #F87171;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 2px 0 #FCA5A5;
        }
        .tt-match-pill.is-finished {
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          color: rgba(250, 249, 245, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 2px 0 #10021E;
        }
        .tt-retos-view.is-light .tt-match-pill.is-finished {
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEAF8 100%);
          color: #361C54;
          border-color: rgba(30, 7, 52, 0.18);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 2px 0 #C8BDDF;
        }

        .tt-match-mode-tag {
          padding: 3px 9px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 0.68rem;
          font-weight: 800;
          color: rgba(250, 249, 245, 0.84);
        }
        .tt-retos-view.is-light .tt-match-mode-tag {
          background: #F1ECF9;
          border-color: rgba(30, 7, 52, 0.14);
          color: #361C54;
        }

        .tt-match-vs-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: start;
          gap: 8px;
        }
        .tt-match-side {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 5px;
          min-width: 0;
        }
        .tt-match-player-name {
          font-size: 0.87rem;
          font-weight: 900;
          line-height: 1.18;
          color: var(--tt-text);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .tt-match-player-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 0.71rem;
          font-weight: 700;
          color: var(--tt-text-muted);
          flex-wrap: wrap;
        }
        .tt-cat-dot-inline {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .tt-winner-chip {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 8px;
          background: linear-gradient(180deg, #22F397 0%, #00B866 100%);
          color: #0D0219;
          font-size: 0.61rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          box-shadow: 0 2px 0 #007540;
        }
        .tt-match-center-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding-top: 8px;
        }
        .tt-vs-emblem {
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 1.24rem;
          color: #F4DA92;
          line-height: 1;
          text-shadow: 0 2px 10px rgba(229, 193, 108, 0.35);
        }
        .tt-retos-view.is-light .tt-vs-emblem {
          color: #8A5D10;
          text-shadow: none;
        }
        .tt-match-date-chip {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--tt-text);
          white-space: nowrap;
        }
        .tt-match-time-chip {
          font-size: 0.69rem;
          font-weight: 700;
          color: var(--tt-text-muted);
          white-space: nowrap;
        }

        /* MINI MARCADOR EN TARJETA */
        .tt-mini-scoreboard {
          border-radius: 15px;
          padding: 11px 12px;
          background: linear-gradient(180deg, #1E0636 0%, #130324 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.34);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 3px 0 #0A0114;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-mini-sb-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-mini-sb-name {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          font-weight: 800;
          min-width: 76px;
        }
        .tt-mini-sb-sets {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }
        .tt-sb-cell {
          width: 27px;
          height: 25px;
          border-radius: 7px;
          background: rgba(250, 249, 245, 0.14);
          font-weight: 900;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-sb-cell.is-stb {
          background: rgba(229, 193, 108, 0.24);
          color: #F6E2A8;
          min-width: 30px;
          width: auto;
          padding: 0 6px;
        }
        .tt-delta-pill {
          min-width: 40px;
          text-align: right;
          font-size: 0.76rem;
          font-weight: 900;
        }
        .tt-delta-pill.is-pos { color: #00E582; }
        .tt-delta-pill.is-neg { color: #F87171; }
        .tt-mini-sb-foot {
          margin-top: 2px;
          padding-top: 6px;
          border-top: 1px solid rgba(250, 249, 245, 0.14);
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.69rem;
          color: rgba(250, 249, 245, 0.8);
        }

        /* BARRA DE SEDE + ACCIONES + MODO ESPECTADOR CON PROFUNDIDAD */
        .tt-match-venue-bar {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(13, 2, 25, 0.56);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.32);
        }
        .tt-retos-view.is-light .tt-match-venue-bar {
          background: #F2EEFA;
          border-color: rgba(30, 7, 52, 0.14);
          box-shadow: inset 0 2px 4px rgba(30, 7, 52, 0.08);
        }
        .tt-match-venue-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--tt-text);
        }
        .tt-match-venue-item.is-subtle {
          font-size: 0.71rem;
          font-weight: 600;
          color: var(--tt-text-muted);
        }
        .tt-match-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tt-btn-sm {
          min-height: 40px !important;
          padding: 0 13px !important;
          font-size: 0.77rem !important;
          border-radius: 13px !important;
        }
        .tt-icon-action-btn {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 110ms ease, box-shadow 110ms ease;
        }
        .tt-icon-action-btn:active {
          transform: translateY(2px);
        }
        .tt-icon-action-btn.is-wa {
          background: linear-gradient(180deg, rgba(37, 211, 102, 0.24) 0%, rgba(22, 163, 74, 0.14) 100%);
          color: #4ADE80;
          border: 1.5px solid rgba(37, 211, 102, 0.5);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 3px 0 rgba(20, 83, 45, 0.7);
        }
        .tt-retos-view.is-light .tt-icon-action-btn.is-wa {
          background: linear-gradient(180deg, #EBFCF2 0%, #D3F8E2 100%);
          color: #15803D;
          border-color: rgba(22, 163, 74, 0.45);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #86EFAC;
        }

        .tt-waiting-banner {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 12px;
          border-radius: 13px;
          background: linear-gradient(180deg, rgba(229, 193, 108, 0.18) 0%, rgba(229, 193, 108, 0.09) 100%);
          border: 1.5px solid rgba(229, 193, 108, 0.46);
          color: #F6E2A8;
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-retos-view.is-light .tt-waiting-banner {
          background: linear-gradient(180deg, #FFFBF0 0%, #FAF0D1 100%);
          border-color: rgba(168, 118, 22, 0.42);
          color: #7A4F05;
        }

        .tt-spectator-pill {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 38px;
          border-radius: 12px;
          background: linear-gradient(180deg, #2D104F 0%, #1F0839 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 2px 0 #0F021C;
          color: rgba(250, 249, 245, 0.8);
          font-size: 0.73rem;
          font-weight: 800;
        }
        .tt-retos-view.is-light .tt-spectator-pill {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1ECF9 100%);
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 2px 0 #D2C8E6;
          color: #46325E;
        }

        /* ==================================================================
           6. RADAR DE RIVALES 3D
           ================================================================== */
        .tt-radar-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-search-box {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 14px;
          min-height: 46px;
          border-radius: 15px;
          background: var(--tt-bg-input);
          border: 1.5px solid var(--tt-border-medium);
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.18);
          color: var(--tt-text);
        }
        .tt-retos-view.is-light .tt-search-box {
          background: #FFFFFF;
          border-color: rgba(30, 7, 52, 0.22);
          color: #1E0734;
          box-shadow: inset 0 2px 4px rgba(30, 7, 52, 0.06);
        }
        .tt-search-box input {
          width: 100%;
          border: none;
          background: transparent;
          color: inherit;
          font-size: 16px;
          outline: none;
        }
        .tt-rivals-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-rival-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border-radius: 19px;
          background: linear-gradient(180deg, rgba(44, 17, 74, 0.96) 0%, rgba(23, 6, 42, 0.98) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 4px 0 #0F021C;
        }
        .tt-retos-view.is-light .tt-rival-row {
          background: linear-gradient(180deg, #FFFFFF 0%, #F7F4FC 100%);
          border-color: rgba(30, 7, 52, 0.17);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #D2C8E6;
        }
        .tt-rival-row.is-out-of-range {
          opacity: 0.78;
        }
        .tt-rival-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .tt-rival-name-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.91rem;
          flex-wrap: wrap;
        }
        .tt-rival-name-line strong {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-vip-micro-pill {
          padding: 2px 6px;
          border-radius: 6px;
          background: linear-gradient(180deg, #FAE9B6 0%, #D4A33D 100%);
          color: #1A1002;
          font-size: 0.58rem;
          font-weight: 900;
        }
        .tt-rival-meta-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: var(--tt-text-muted);
          flex-wrap: wrap;
        }
        .tt-cat-mini-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-secondary);
          font-weight: 800;
          font-size: 0.66rem;
        }
        .tt-rival-forecast-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.71rem;
          color: var(--tt-text-muted);
          flex-wrap: wrap;
        }
        .tt-rival-forecast-line .is-win {
          color: var(--tt-emerald-text);
          font-weight: 900;
        }
        .tt-rival-forecast-line .is-gems {
          color: var(--tt-gold-text, #F4DA92);
          font-weight: 900;
        }
        .tt-rival-forecast-line .is-loss {
          color: var(--tt-danger-text, #F87171);
          font-weight: 700;
        }
        .tt-rival-forecast-line .is-expanded {
          color: var(--tt-sky-text, #7DD3FC);
          font-weight: 800;
        }
        .tt-rival-cta-col {
          flex-shrink: 0;
        }

        /* ==================================================================
           7. MODAL 1: PACTAR DESAFÍO (SELECTORES 3D + GEMAS 6-0, 6-0 + MODO CLARO)
           ================================================================== */
        .tt-form-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
          color: var(--tt-text);
        }
        .tt-form-stack.is-light {
          color: #1E0734;
        }
        .tt-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-field-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-forecast-box {
          border-radius: 17px;
          padding: 13px;
          background: linear-gradient(145deg, #250A42 0%, #140324 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.44);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 4px 0 #0D0219;
        }
        .tt-forecast-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 0.81rem;
        }
        .tt-rematch-tag {
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(229, 193, 108, 0.22);
          border: 1px solid rgba(229, 193, 108, 0.45);
          color: #F6E2A8;
          font-size: 0.66rem;
          font-weight: 900;
        }
        .tt-forecast-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-forecast-cell {
          padding: 9px 10px;
          border-radius: 12px;
          background: rgba(250, 249, 245, 0.08);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-forecast-cell span { font-size: 0.68rem; opacity: 0.82; }
        .tt-forecast-cell strong { font-size: 1.15rem; font-weight: 900; }
        .tt-forecast-cell.is-win strong { color: #00E582; }
        .tt-forecast-cell.is-loss strong { color: #F87171; }
        .tt-forecast-cell small { font-size: 0.66rem; opacity: 0.78; }

        .tt-gems-forecast-strip {
          margin-top: 10px;
          padding: 10px 11px;
          border-radius: 13px;
          background: linear-gradient(135deg, rgba(0, 220, 125, 0.16) 0%, rgba(229, 193, 108, 0.12) 100%);
          border: 1px solid rgba(0, 220, 125, 0.42);
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-gems-forecast-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.74rem;
        }
        .tt-gems-forecast-top span { color: rgba(250, 249, 245, 0.9); font-weight: 700; }
        .tt-gems-forecast-top strong { color: #22F397; font-size: 0.85rem; font-weight: 900; white-space: nowrap; }
        .tt-gems-tiers-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 5px;
        }
        @media (min-width: 480px) {
          .tt-gems-tiers-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        .tt-gems-tiers-row span {
          padding: 5px 7px;
          border-radius: 9px;
          background: rgba(16, 3, 29, 0.6);
          border: 1px solid rgba(250, 249, 245, 0.12);
          font-size: 0.64rem;
          color: rgba(250, 249, 245, 0.9);
          text-align: center;
          white-space: nowrap;
        }
        .tt-gems-tiers-row span.is-max {
          background: rgba(229, 193, 108, 0.22);
          border-color: rgba(229, 193, 108, 0.55);
          color: #F8E5AC;
        }
        .tt-gems-vip-upsell {
          font-size: 0.66rem;
          line-height: 1.35;
          color: rgba(250, 249, 245, 0.82);
        }
        .tt-gems-vip-upsell b { color: #F8E5AC; }

        .tt-gems-preview-pill {
          margin-top: 9px;
          padding: 9px 12px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(0, 220, 125, 0.16) 0%, rgba(229, 193, 108, 0.12) 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.45);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 0.75rem;
          color: var(--tt-text);
          text-align: left;
        }
        .tt-gems-preview-pill strong {
          color: var(--tt-emerald-text);
          font-size: 0.87rem;
          font-weight: 900;
          white-space: nowrap;
        }

        /* SELECTORES 3D DE MODALIDAD, SEDE, HORARIO Y PELOTAS */
        .tt-toggle-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }
        .tt-choice-pill,
        .tt-venue-option,
        .tt-slot-chip {
          cursor: pointer;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          color: #FAF9F5;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 3px 0 #10021E;
          transition: transform 110ms ease, box-shadow 110ms ease, background 150ms ease;
        }
        .tt-choice-pill:active:not(:disabled),
        .tt-venue-option:active,
        .tt-slot-chip:active {
          transform: translateY(2px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 0 #10021E;
        }
        .tt-form-stack.is-light .tt-choice-pill,
        .tt-form-stack.is-light .tt-venue-option,
        .tt-form-stack.is-light .tt-slot-chip,
        html[data-theme='light'] .tt-choice-pill,
        html[data-theme='light'] .tt-venue-option,
        html[data-theme='light'] .tt-slot-chip {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1ECF9 100%);
          border-color: rgba(30, 7, 52, 0.19);
          color: #1E0734;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #C8BDDF;
        }

        .tt-choice-pill {
          min-height: 43px;
          padding: 8px 12px;
          border-radius: 13px;
          font-size: 0.78rem;
          font-weight: 800;
          text-align: center;
        }
        .tt-choice-pill:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .tt-choice-pill.is-selected,
        .tt-venue-option.is-selected,
        .tt-slot-chip.is-selected {
          background: linear-gradient(180deg, #22F397 0%, #00C96F 56%, #00A85B 100%) !important;
          border-color: rgba(170, 255, 218, 0.8) !important;
          color: #0D0219 !important;
          font-weight: 900;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 3px 0 #007540,
            0 6px 14px rgba(0, 220, 125, 0.28) !important;
        }
        .tt-form-stack.is-light .tt-choice-pill.is-selected,
        .tt-form-stack.is-light .tt-venue-option.is-selected,
        .tt-form-stack.is-light .tt-slot-chip.is-selected,
        html[data-theme='light'] .tt-choice-pill.is-selected,
        html[data-theme='light'] .tt-venue-option.is-selected,
        html[data-theme='light'] .tt-slot-chip.is-selected {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%) !important;
          border-color: #1E0734 !important;
          color: #00E582 !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.26),
            0 3px 0 #0D0218,
            0 6px 14px rgba(30, 7, 52, 0.24) !important;
        }

        .tt-venues-select-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }
        .tt-venue-option {
          min-height: 48px;
          padding: 8px 10px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.77rem;
          font-weight: 800;
          text-align: left;
        }
        .tt-venue-option.is-custom {
          grid-column: 1 / -1;
          justify-content: center;
        }
        .tt-date-time-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 10px;
        }
        .tt-quick-slots-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding: 2px 1px 6px;
        }
        .tt-slot-chip {
          flex-shrink: 0;
          padding: 7px 12px;
          border-radius: 11px;
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-balls-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* ==================================================================
           8. MODAL 2: MARCADOR DIRECTO + MODO ÁRBITRO 3D (OSCURO Y CLARO)
           ================================================================== */
        .tt-mc-container {
          display: flex;
          flex-direction: column;
          gap: 13px;
          color: var(--tt-text);
        }
        .tt-mc-container.is-light {
          color: #1E0734;
        }

        .tt-stadium-board {
          border-radius: 19px;
          padding: 14px;
          background: linear-gradient(145deg, #270A45 0%, #140324 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.42);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 4px 0 #0C0117;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-stadium-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: rgba(250, 249, 245, 0.65);
        }
        .tt-stadium-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(250, 249, 245, 0.12);
        }
        .tt-stadium-player {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }
        .tt-stadium-player strong {
          display: block;
          font-size: 0.87rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-stadium-player small {
          font-size: 0.68rem;
          color: rgba(250, 249, 245, 0.7);
        }
        .tt-stadium-cols {
          display: flex;
          gap: 7px;
          flex-shrink: 0;
        }
        .tt-stadium-head .tt-stadium-cols span {
          width: 35px;
          text-align: center;
        }
        .tt-st-num {
          width: 35px;
          height: 35px;
          border-radius: 10px;
          background: rgba(250, 249, 245, 0.14);
          font-family: var(--tt-font-display);
          font-size: 1.18rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-st-num sup {
          font-size: 0.6rem;
          color: #22F397;
          margin-left: 1px;
        }
        .tt-st-num.is-stb {
          background: rgba(229, 193, 108, 0.24);
          color: #F6E2A8;
          min-width: 38px;
          width: auto;
          padding: 0 6px;
        }

        .tt-direct-hint {
          margin: 0;
          font-size: 0.77rem;
          color: var(--tt-text-muted);
          line-height: 1.42;
        }
        .tt-direct-set-box,
        .tt-set-control-card {
          border-radius: 17px;
          padding: 13px;
          background: linear-gradient(180deg, #2D104F 0%, #1E0838 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 0 #0F021C;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-mc-container.is-light .tt-direct-set-box,
        .tt-mc-container.is-light .tt-set-control-card,
        html[data-theme='light'] .tt-direct-set-box,
        html[data-theme='light'] .tt-set-control-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F0FA 100%);
          border-color: rgba(30, 7, 52, 0.17);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #D2C8E6;
        }
        .tt-direct-set-box.is-stb-card,
        .tt-set-control-card.is-stb-card {
          border-color: rgba(229, 193, 108, 0.56);
        }
        .tt-direct-set-head,
        .tt-set-control-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.81rem;
        }
        .tt-direct-set-head span {
          font-size: 0.7rem;
          color: var(--tt-text-muted);
        }
        .tt-direct-inputs-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: end;
          gap: 10px;
        }
        .tt-direct-field {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .tt-direct-field span {
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-direct-num-input {
          width: 100%;
          height: 54px;
          border-radius: 14px;
          background: var(--tt-bg-input);
          border: 1.5px solid var(--tt-border-medium);
          color: var(--tt-text);
          text-align: center;
          font-family: var(--tt-font-display);
          font-size: 1.7rem;
          font-weight: 900;
        }
        .tt-mc-container.is-light .tt-direct-num-input {
          background: #FFFFFF;
          color: #1E0734;
          border-color: rgba(30, 7, 52, 0.24);
        }
        .tt-direct-num-input:focus {
          outline: none;
          border-color: #00DC7D;
          box-shadow: 0 0 0 3px rgba(0, 220, 125, 0.2);
        }
        .tt-direct-dash {
          font-size: 1.4rem;
          font-weight: 900;
          padding-bottom: 13px;
          color: var(--tt-text-muted);
        }
        .tt-direct-tb-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding-top: 7px;
          border-top: 1px solid var(--tt-border);
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }
        .tt-direct-tb-input {
          width: 50px;
          height: 36px;
          border-radius: 10px;
          background: var(--tt-bg-input);
          border: 1.5px solid var(--tt-border-medium);
          color: var(--tt-text);
          text-align: center;
          font-weight: 900;
        }
        .tt-direct-validation-note {
          padding: 12px 13px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1.5px dashed var(--tt-border-medium);
          color: var(--tt-text-muted);
          font-size: 0.76rem;
          font-weight: 700;
          text-align: center;
        }

        .tt-mc-controls-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-unlock-btn {
          padding: 5px 11px;
          border-radius: 10px;
          background: rgba(229, 193, 108, 0.2);
          border: 1px solid rgba(229, 193, 108, 0.45);
          color: var(--tt-gold-text, #F4DA92);
          font-size: 0.7rem;
          font-weight: 900;
        }
        .tt-tb-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-tb-banner {
          text-align: center;
          padding: 6px 10px;
          border-radius: 10px;
          background: rgba(0, 220, 125, 0.16);
          border: 1px solid rgba(0, 220, 125, 0.4);
          color: var(--tt-emerald-text);
          font-size: 0.69rem;
          font-weight: 900;
        }
        .tt-dual-stepper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .tt-stepper-side {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-stepper-name {
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          text-align: center;
        }
        .tt-stepper-btns {
          display: flex;
          gap: 7px;
        }
        .tt-step-minus {
          width: 42px;
          height: 46px;
          border-radius: 13px;
          background: linear-gradient(180deg, #35155A 0%, #230A40 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          color: #FAF9F5;
          font-size: 1.25rem;
          font-weight: 900;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 0 #10021E;
          transition: transform 105ms ease, box-shadow 105ms ease;
        }
        .tt-step-minus:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-mc-container.is-light .tt-step-minus {
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEAF8 100%);
          border-color: rgba(30, 7, 52, 0.2);
          color: #1E0734;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #C8BDDF;
        }

        .tt-step-plus {
          flex: 1;
          height: 46px;
          border-radius: 13px;
          background: linear-gradient(180deg, #22F397 0%, #00C96F 56%, #00A85B 100%);
          border: 1px solid rgba(170, 255, 218, 0.78);
          color: #0D0219;
          font-size: 0.83rem;
          font-weight: 900;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.7),
            0 4px 0 #007540,
            0 8px 16px rgba(0, 220, 125, 0.28);
          transition: transform 105ms ease, box-shadow 105ms ease;
        }
        .tt-step-plus:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 0 #007540;
        }
        .tt-step-plus.is-champagne {
          background: linear-gradient(180deg, #FAE9B6 0%, #E5C16C 56%, #C89938 100%);
          border-color: rgba(255, 245, 214, 0.78);
          color: #1A1002;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 4px 0 #8A6012,
            0 8px 16px rgba(229, 193, 108, 0.28);
        }
        .tt-step-plus.is-champagne:active:not(:disabled) {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 0 #8A6012;
        }

        .tt-judge-assign-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-elo-preview-card {
          border-radius: 17px;
          padding: 14px;
          background: rgba(0, 220, 125, 0.12);
          border: 1.5px solid rgba(0, 220, 125, 0.5);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 0 rgba(0, 117, 64, 0.36);
        }
        .tt-elo-preview-head {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 10px;
        }
        .tt-elo-preview-head span {
          font-size: 0.73rem;
          color: var(--tt-text-muted);
        }
        .tt-elo-preview-deltas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-elo-preview-deltas > div {
          padding: 9px 10px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.76rem;
        }
        .tt-mc-secondary-bar {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 2px;
        }
        .tt-text-action {
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          text-decoration: underline;
        }
        .tt-text-action.is-danger {
          color: var(--tt-danger-text, #EF4444);
        }
        .tt-wo-box {
          padding: 12px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.12);
          border: 1.5px solid rgba(239, 68, 68, 0.4);
        }
        .tt-spectator-note {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          font-size: 0.8rem;
          color: var(--tt-text-muted);
        }
        .tt-rule-callout {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          font-size: 0.82rem;
        }
        .tt-rule-callout.is-ok {
          background: rgba(0, 220, 125, 0.14);
          border: 1.5px solid rgba(0, 220, 125, 0.45);
        }
        .tt-rule-callout.is-warn {
          background: rgba(229, 193, 108, 0.16);
          border: 1.5px solid rgba(229, 193, 108, 0.48);
        }
      `}</style>
    </section>
  );
}
