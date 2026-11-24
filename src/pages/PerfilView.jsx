import React, { useMemo, useRef, useState } from 'react';
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
  CATEGORIES_SCALE,
  INITIAL_CLUBS,
  getCategoryByPoints,
  getClubById,
} from '../data/playersAndClubsData';
import { ELO_CONFIG } from '../utils/tenisEngine';
import {
  buildWhatsappLink,
  createTuteladoProfile,
  getEffectiveContactPhone,
  isCloudReady,
  startMinorEmancipation,
  uploadCompressedMedia,
} from '../utils/cloudService';

const PROFILE_SCENARIOS = [
  {
    id: 'default',
    name: 'Estadio TOTAL TENIS',
    subtitle: 'Incluido',
    imageDark: '/assets/perfil-bg-purpura-oscuro.jpg',
    imageLight: '/assets/perfil-bg-marfil-claro.jpg',
    gemsCost: 0,
    accent: '#00DC7D',
  },
  {
    id: 'arcilla',
    name: 'Tierra Batida',
    subtitle: 'Polvo de ladrillo',
    imageDark: '/assets/perfil-bg-arcilla.jpg',
    imageLight: '/assets/perfil-bg-arcilla.jpg',
    gemsCost: 60,
    accent: '#DE8566',
  },
  {
    id: 'cesped',
    name: 'Césped Clásico',
    subtitle: 'Pasto esmeralda',
    imageDark: '/assets/perfil-bg-cesped.jpg',
    imageLight: '/assets/perfil-bg-cesped.jpg',
    gemsCost: 80,
    accent: '#00DC7D',
  },
  {
    id: 'dura',
    name: 'Pista Dura Nocturna',
    subtitle: 'Azul cobalto',
    imageDark: '/assets/perfil-bg-dura.jpg',
    imageLight: '/assets/perfil-bg-dura.jpg',
    gemsCost: 80,
    accent: '#38BDF8',
  },
  {
    id: 'finals',
    name: 'Gala Night Finals',
    subtitle: 'Esmeralda y oro',
    imageDark: '/assets/perfil-bg-finals.jpg',
    imageLight: '/assets/perfil-bg-finals.jpg',
    gemsCost: 120,
    accent: '#E5C16C',
  },
];

const STROKE_OPTIONS = [
  'Derecha (Forehand)',
  'Revés a 2 Manos',
  'Revés a 1 Mano',
  '1er Saque',
  'Slice / Drop Shot',
  'Volea y Red',
];

const WEEK_DAYS = [
  { id: 'L', label: 'L' },
  { id: 'M', label: 'M' },
  { id: 'X', label: 'M' },
  { id: 'J', label: 'J' },
  { id: 'V', label: 'V' },
  { id: 'S', label: 'S' },
  { id: 'D', label: 'D' },
];

const TIME_WINDOWS = [
  { id: 'manana', label: 'Mañana · 07:00–12:00' },
  { id: 'tarde', label: 'Tarde · 12:00–18:00' },
  { id: 'noche', label: 'Noche · 18:00–22:00' },
];

const CHILD_LEVEL_PRESETS = [
  { id: 'lvl-0', label: 'Iniciación · 5ª P', desc: 'Recién empieza o peloteo básico', points: 400 },
  { id: 'lvl-1', label: 'Peloteo · 5ª P', desc: 'Mantiene peloteos y juega puntos', points: 750 },
  { id: 'lvl-2', label: 'Juvenil Activo · 5ª B', desc: 'Saque regular y partidos completos', points: 1250 },
  { id: 'lvl-3', label: 'Competitivo · 5ª A', desc: 'Entrena en academia y juega torneos', points: 2100 },
];

function compressImageFileToDataUrl(file, maxDim = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato no soportado'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PerfilView({
  player = null,
  currentUser = null,
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  theme = 'dark',
  readOnly = false,
  activeTutorParent = null,
  onUpdateProfile,
  onUnlockScenario,
  onOpenVipCard,
  onOpenHeadToHead,
  onOpenStoriesWithMatch,
  onQuickChallenge,
  onOpenAuth,
  onCreateTutelado,
  onSwitchActiveProfile,
  onStartEmancipation,
  onNotify,
}) {
  const fileInputRef = useRef(null);
  const profile = player || currentUser;
  const isOwnProfile = Boolean(!readOnly && currentUser && profile && currentUser.id === profile.id);
  const isLight = theme === 'light';
  const modeClass = isLight ? 'is-light' : 'is-dark';

  const [statsScope, setStatsScope] = useState('temporada'); // 'temporada' | 'carrera'
  const [isPhotoStudioOpen, setIsPhotoStudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // Estudio de Foto y Fondo
  const [draftPhoto, setDraftPhoto] = useState('');
  const [draftZoom, setDraftZoom] = useState(1);
  const [draftOffsetX, setDraftOffsetX] = useState(0);
  const [draftOffsetY, setDraftOffsetY] = useState(0);
  const [draftScenarioId, setDraftScenarioId] = useState('default');

  // Ajustes táctiles
  const [draftHand, setDraftHand] = useState('Diestro');
  const [draftStrokes, setDraftStrokes] = useState(['Derecha (Forehand)']);
  const [draftDays, setDraftDays] = useState(['M', 'J', 'S']);
  const [draftTimes, setDraftTimes] = useState(['noche']);
  const [draftClubId, setDraftClubId] = useState('independiente');
  const [draftHideWhatsapp, setDraftHideWhatsapp] = useState(false);
  const [draftTutorOnly, setDraftTutorOnly] = useState(false);

  // Modal Afiliar Hijo Tutelado (-18)
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('14');
  const [childDivision, setChildDivision] = useState('Varones');
  const [childClubId, setChildClubId] = useState('independiente');
  const [childHand, setChildHand] = useState('Diestro');
  const [childLevelPts, setChildLevelPts] = useState(750);
  const [childLegalOk, setChildLegalOk] = useState(false);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [localEmancCodes, setLocalEmancCodes] = useState({});

  const category = getCategoryByPoints(profile?.points || 0);

  const nextCategory = useMemo(() => {
    const idx = CATEGORIES_SCALE.findIndex((c) => c.id === category.id);
    return idx >= 0 && idx < CATEGORIES_SCALE.length - 1 ? CATEGORIES_SCALE[idx + 1] : null;
  }, [category]);

  const officialRank = useMemo(() => {
    if (!profile?.id || profile.isTutorOnly) return null;
    const sorted = [...(players || [])]
      .filter((p) => !p.isTutorOnly)
      .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
    const idx = sorted.findIndex((p) => p.id === profile.id);
    return idx >= 0 ? idx + 1 : null;
  }, [players, profile?.id, profile?.isTutorOnly]);

  const levelProgress = useMemo(() => {
    if (!nextCategory) return { pct: 100, remaining: 0 };
    const pts = Number(profile?.points) || 0;
    const span = Math.max(1, nextCategory.min - category.min);
    const pct = Math.min(
      99,
      Math.max(4, Math.round((Math.max(0, pts - category.min) / span) * 100))
    );
    return { pct, remaining: Math.max(0, nextCategory.min - pts) };
  }, [category, nextCategory, profile?.points]);

  const myChildren = useMemo(() => {
    if (!profile?.id || profile.isTutelado) return [];
    return (players || []).filter((p) => p.isTutelado && p.tutorId === profile.id);
  }, [players, profile?.id, profile?.isTutelado]);

  const finishedMatches = useMemo(() => {
    if (!profile?.id) return [];
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p;
    });
    return (challenges || [])
      .filter(
        (c) =>
          c.status === 'FINISHED' &&
          (c.playerAId === profile.id || c.playerBId === profile.id)
      )
      .map((c) => {
        const isA = c.playerAId === profile.id;
        return {
          challenge: c,
          isA,
          rival: map[isA ? c.playerBId : c.playerAId],
          didWin: c.winnerId === profile.id,
          delta: isA ? c.eloDeltaA : c.eloDeltaB,
        };
      });
  }, [challenges, players, profile?.id]);

  // Métricas reales diferenciadas: Temporada actual (~90 días) vs Carrera total
  const scopedMetrics = useMemo(() => {
    const careerWins = Number(profile?.wins) || 0;
    const careerLosses = Number(profile?.losses) || 0;
    const careerPlayed = careerWins + careerLosses;
    if (statsScope === 'carrera') {
      return {
        wins: careerWins,
        losses: careerLosses,
        played: careerPlayed,
        eff: careerPlayed > 0 ? Math.round((careerWins / careerPlayed) * 100) : 0,
        label: 'Carrera Histórica',
      };
    }
    const cutoffMs = Date.now() - 90 * 24 * 3600 * 1000;
    const seasonRows = finishedMatches.filter((m) => {
      const ts = new Date(m.challenge.finishedAt || m.challenge.createdAt || 0).getTime();
      return !Number.isNaN(ts) && ts >= cutoffMs;
    });
    const sWins = seasonRows.length > 0 ? seasonRows.filter((m) => m.didWin).length : careerWins;
    const sLosses = seasonRows.length > 0 ? seasonRows.length - sWins : careerLosses;
    const sPlayed = sWins + sLosses;
    return {
      wins: sWins,
      losses: sLosses,
      played: sPlayed,
      eff: sPlayed > 0 ? Math.round((sWins / sPlayed) * 100) : 0,
      label: `Temporada ${new Date().getFullYear()}`,
    };
  }, [statsScope, finishedMatches, profile?.wins, profile?.losses]);

  // Logros sutiles por mérito real en cancha
  const earnedMerits = useMemo(() => {
    if (!profile || profile.isTutorOnly) return [];
    const list = [];
    const pts = Number(profile.points) || 0;
    const wins = Number(profile.wins) || 0;
    const losses = Number(profile.losses) || 0;
    const streak = Number(profile.streak) || 0;

    if (officialRank && officialRank <= 8) list.push({ id: 'top8', label: 'Maestro Top 8', tone: 'gold' });
    if (wins >= 3 && losses === 0) list.push({ id: 'invicto', label: 'Invicto', tone: 'emerald' });
    if (streak >= 3) list.push({ id: 'racha', label: `Racha +${streak}`, tone: 'emerald' });
    if ((profile.unlockedBadges || []).includes('mata-gigantes')) {
      list.push({ id: 'giant', label: 'Mata Gigantes', tone: 'clay' });
    }
    if (pts >= 4000) list.push({ id: 'elite', label: 'Élite Circuito', tone: 'gold' });
    if (Number(profile.age) >= 40) list.push({ id: 'senior', label: 'Senior +40', tone: 'neutral' });
    return list.slice(0, 4);
  }, [profile, officialRank]);

  if (!profile) {
    return (
      <section className={`tt-perfil-view ${modeClass}`} aria-label="Mi Perfil TOTAL TENIS">
        <EmptyStateCard
          theme={theme}
          title="Tu Ficha Oficial te espera"
          description="Inicia sesión o crea tu cuenta (+18) para seguir tu ranking, subir tu foto de cancha y gestionar perfiles juveniles."
          actionLabel="Iniciar Sesión / Crear Cuenta"
          onAction={() => onOpenAuth && onOpenAuth('login')}
        />
      </section>
    );
  }

  const club = getClubById(clubs, profile.clubId);
  const calibPlayed =
    profile.calibrationPlayed !== undefined
      ? Number(profile.calibrationPlayed)
      : (Number(profile.wins) || 0) + (Number(profile.losses) || 0);
  const isCalibrating = !profile.isTutorOnly && calibPlayed < ELO_CONFIG.CALIBRATION_MATCHES;
  const ownedScenarios = Array.from(new Set(['default', ...(profile.unlockedScenarios || [])]));
  const activeScenario =
    PROFILE_SCENARIOS.find((s) => s.id === (profile.scenarioId || 'default')) ||
    PROFILE_SCENARIOS[0];
  const scenarioBgImg = isLight ? activeScenario.imageLight : activeScenario.imageDark;
  const useLightHero = isLight && activeScenario.id === 'default';
  const recentMatches = finishedMatches.slice(0, 6);

  const openPhotoStudio = () => {
    if (!isOwnProfile) return;
    triggerHaptic('light');
    setDraftPhoto(profile.fullBodyPhoto || profile.avatar || '');
    setDraftZoom(profile.photoTransform?.zoom ?? 1);
    setDraftOffsetX(profile.photoTransform?.x ?? 0);
    setDraftOffsetY(profile.photoTransform?.y ?? 0);
    setDraftScenarioId(profile.scenarioId || 'default');
    setIsPhotoStudioOpen(true);
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setDraftPhoto(compressed);
      triggerHaptic('success');
    } catch {
      if (onNotify) onNotify('No pudimos procesar esa foto. Usa JPG o PNG.', 'warning');
    }
  };

  const handleSavePhotoStudio = async () => {
    if (!isOwnProfile || isSavingPhoto) return;
    const scenarioObj = PROFILE_SCENARIOS.find((s) => s.id === draftScenarioId);
    if (scenarioObj && !ownedScenarios.includes(draftScenarioId)) {
      const myGems = Number(profile.gems) || 0;
      if (myGems < scenarioObj.gemsCost) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            `Necesitas ${scenarioObj.gemsCost} 💎 para "${scenarioObj.name}" (tienes ${myGems} 💎).`,
            'warning'
          );
        }
        return;
      }
      if (onUnlockScenario) {
        onUnlockScenario({ scenarioId: scenarioObj.id, gemsCost: scenarioObj.gemsCost });
      }
    }

    setIsSavingPhoto(true);
    try {
      let finalUrl = draftPhoto || profile.avatar || '';
      if (finalUrl && String(finalUrl).startsWith('data:image/') && isCloudReady) {
        const uploaded = await uploadCompressedMedia(finalUrl, 'avatars', profile.id);
        if (uploaded) finalUrl = uploaded;
      }
      if (onUpdateProfile) {
        await onUpdateProfile(profile.id, {
          avatar: finalUrl,
          fullBodyPhoto: finalUrl,
          scenarioId: draftScenarioId,
          photoTransform: { zoom: draftZoom, x: draftOffsetX, y: draftOffsetY },
        });
      }
      triggerHaptic('success');
      if (onNotify) onNotify('Foto y fondo actualizados.', 'success');
      setIsPhotoStudioOpen(false);
    } catch {
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos guardar la foto. Revisa tu conexión.', 'warning');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const openTactileSettings = () => {
    if (!isOwnProfile) return;
    triggerHaptic('light');
    setDraftHand(profile.hand || 'Diestro');
    setDraftStrokes(
      Array.isArray(profile.bestStrokes) && profile.bestStrokes.length
        ? profile.bestStrokes
        : [profile.bestStroke || 'Derecha (Forehand)']
    );
    setDraftDays(
      Array.isArray(profile.availabilityDays) && profile.availabilityDays.length
        ? profile.availabilityDays
        : ['M', 'J', 'S']
    );
    setDraftTimes(
      Array.isArray(profile.availabilityTimes) && profile.availabilityTimes.length
        ? profile.availabilityTimes
        : ['noche']
    );
    setDraftClubId(profile.clubId || 'independiente');
    setDraftHideWhatsapp(Boolean(profile.hideWhatsapp));
    setDraftTutorOnly(Boolean(profile.isTutorOnly));
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!isOwnProfile || !onUpdateProfile) return setIsSettingsOpen(false);
    const chosenClub = clubs.find((c) => c.id === draftClubId);
    onUpdateProfile(profile.id, {
      hand: draftHand,
      bestStroke: draftStrokes[0] || 'Derecha (Forehand)',
      bestStrokes: draftStrokes,
      availabilityDays: draftDays,
      availabilityTimes: draftTimes,
      clubId: chosenClub ? chosenClub.id : 'independiente',
      clubName: chosenClub ? chosenClub.name : 'Independiente',
      hideWhatsapp: draftHideWhatsapp,
      isTutorOnly: !profile.isTutelado ? draftTutorOnly : false,
    });
    triggerHaptic('success');
    if (onNotify) onNotify('Preferencias guardadas.', 'success');
    setIsSettingsOpen(false);
  };

  const handleCreateChildSubmit = async (e) => {
    e.preventDefault();
    if (!isOwnProfile || profile.isTutelado || isSavingChild) return;
    if (childName.trim().length < 3) {
      if (onNotify) onNotify('Ingresa el nombre completo de tu hijo/a.', 'warning');
      return;
    }
    const ageNum = Number(childAge);
    if (Number.isNaN(ageNum) || ageNum < 6 || ageNum >= 18) {
      if (onNotify) onNotify('La cuenta tutelada aplica para menores entre 6 y 17 años.', 'warning');
      return;
    }
    if (!childLegalOk) {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify('Debes confirmar la declaración de patria potestad / tutela legal.', 'warning');
      }
      return;
    }
    setIsSavingChild(true);
    try {
      const chosenClub = clubs.find((c) => c.id === childClubId);
      const payload = {
        name: childName.trim(),
        age: ageNum,
        division: childDivision,
        clubId: chosenClub ? chosenClub.id : 'independiente',
        clubName: chosenClub ? chosenClub.name : 'Independiente',
        hand: childHand,
        initialPoints: Number(childLevelPts) || 750,
      };
      if (onCreateTutelado) {
        await onCreateTutelado(profile, payload);
      } else {
        await createTuteladoProfile(profile, payload);
      }
      triggerHaptic('success');
      if (onNotify) onNotify(`Subcuenta tutelada de ${payload.name} creada con éxito.`, 'success');
      setChildName('');
      setChildAge('14');
      setChildLegalOk(false);
      setIsAddChildOpen(false);
    } catch (err) {
      triggerHaptic('warning');
      if (onNotify) onNotify(err?.message || 'No se pudo crear la subcuenta.', 'warning');
    } finally {
      setIsSavingChild(false);
    }
  };

  const handleEmancipateChild = async (child) => {
    triggerHaptic('medium');
    try {
      let updated = null;
      if (onStartEmancipation) {
        updated = await onStartEmancipation(child.id);
      } else {
        updated = await startMinorEmancipation(child.id);
      }
      const code = updated?.emancipationCode || child.emancipationCode;
      if (code) {
        setLocalEmancCodes((prev) => ({ ...prev, [child.id]: code }));
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          // continuar
        }
        if (onNotify) {
          onNotify(`Código +18 generado y copiado: ${code}. Conserva 100% de sus puntos.`, 'success');
        }
      }
    } catch {
      if (onNotify) onNotify('No se pudo generar el código de emancipación.', 'warning');
    }
  };

  const contactPhone = getEffectiveContactPhone(profile, players);
  const waMessage = profile.isTutelado
    ? `Hola ${profile.tutorName || 'Padre/Madre'}, te escribo desde TOTAL TENIS para coordinar un partido oficial con ${profile.name}.`
    : `Hola ${profile.name}, te escribo desde TOTAL TENIS para coordinar un partido.`;

  const tutorParentName = activeTutorParent?.name || profile.tutorName || 'mi cuenta de Padre';

  return (
    <section
      className={`tt-perfil-view ${modeClass}`}
      aria-label={`Perfil de ${profile.name}`}
    >
      {/* BANNER ACTIVO SI EL PADRE ESTÁ OPERANDO LA SUBCUENTA DE SU HIJO */}
      {isOwnProfile && profile.isTutelado && (
        <div className="tt-pf-tutor-bar">
          <div style={{ minWidth: 0 }}>
            <span>GESTIONANDO SUBCUENTA JUVENIL (-18)</span>
            <strong>
              {profile.name} · {profile.age} años
            </strong>
          </div>
          {onSwitchActiveProfile && profile.tutorId && (
            <button
              type="button"
              className="tt-pf-3d-btn is-gold is-sm"
              onClick={() => {
                triggerHaptic('medium');
                onSwitchActiveProfile(profile.tutorId);
              }}
            >
              ← Volver a {tutorParentName.split(' ')[0]}
            </button>
          )}
        </div>
      )}

      {/* 1. PORTADA EDITORIAL 3D (ADAPTATIVA MODO CLARO MARFIL / MODO OSCURO) */}
      <div className={`tt-pf-hero ${useLightHero ? 'is-light-hero' : 'is-dark-hero'}`}>
        <SmartImage
          src={scenarioBgImg}
          fallbackSrc={isLight ? ASSETS.bgMarfilClaro || ASSETS.bgPurpuraOscuro : ASSETS.bgPurpuraOscuro}
          alt=""
          className="tt-pf-hero-bg"
          priority
        />
        <div className="tt-pf-hero-scrim" />

        <div className="tt-pf-hero-top">
          <div className="tt-pf-pills-left">
            {profile.isTutelado && (
              <span className="tt-pf-tutela-badge">
                <TTIcon name="shield" size={12} /> Cuenta Tutelada · Padre/Madre Verificado
              </span>
            )}
            {profile.isTutorOnly && (
              <span className="tt-pf-tutela-badge">Cuenta Padre / Tutor</span>
            )}
            {profile.isVip && <span className="tt-pf-vip-pill">SOCIO VIP</span>}
          </div>

          {isOwnProfile && (
            <div className="tt-pf-top-btns">
              <button
                type="button"
                className="tt-pf-3d-icon-btn"
                aria-label="Cambiar foto y fondo"
                onClick={openPhotoStudio}
              >
                <TTIcon name="camera" size={17} />
              </button>
              <button
                type="button"
                className="tt-pf-3d-icon-btn"
                aria-label="Ajustes"
                onClick={openTactileSettings}
              >
                <TTIcon name="settings" size={17} />
              </button>
            </div>
          )}
        </div>

        <div className="tt-pf-hero-main">
          <div
            className={`tt-pf-avatar-wrap ${isOwnProfile ? 'is-editable' : ''}`}
            onClick={isOwnProfile ? openPhotoStudio : undefined}
          >
            <SmartImage
              src={profile.fullBodyPhoto || profile.avatar}
              alt={profile.name}
              initials={profile.name}
              priority
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            />
          </div>

          <div className="tt-pf-id-col">
            <h1 className="tt-pf-name">{profile.name}</h1>
            <div className="tt-pf-sub-row">
              {!profile.isTutorOnly && <span className="tt-pf-cat-chip">{category.name}</span>}
              <span>{club ? club.shortName : 'Independiente'}</span>
              {profile.age ? <span>· {profile.age} años</span> : null}
            </div>

            {earnedMerits.length > 0 && (
              <div className="tt-pf-merits-row">
                {earnedMerits.map((m) => (
                  <span key={m.id} className={`tt-pf-merit is-${m.tone}`}>
                    {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones 3D: Propias vs Ajenas (contraste garantizado en claro y oscuro) */}
        {isOwnProfile ? (
          <div className="tt-pf-own-actions">
            {!profile.isTutorOnly && onOpenVipCard && (
              <button
                type="button"
                className={`tt-pf-3d-btn ${profile.isVip ? 'is-gold' : 'is-emerald'}`}
                style={{ flex: 1 }}
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenVipCard();
                }}
              >
                <TTIcon name="crown" size={15} />{' '}
                {profile.isVip ? 'Mi Carnet VIP 3D' : 'Carnet & Pase VIP'}
              </button>
            )}
            <button
              type="button"
              className="tt-pf-3d-btn is-hero-secondary"
              onClick={openPhotoStudio}
            >
              <TTIcon name="camera" size={15} />
              Fondos ({ownedScenarios.length}/{PROFILE_SCENARIOS.length})
            </button>
          </div>
        ) : (
          <div className="tt-pf-own-actions">
            {onQuickChallenge && !profile.isTutorOnly && (
              <button
                type="button"
                className="tt-pf-3d-btn is-emerald"
                style={{ flex: 1 }}
                onClick={() => {
                  triggerHaptic('medium');
                  onQuickChallenge(profile);
                }}
              >
                <TTIcon name="challenge" size={15} />{' '}
                {profile.isTutelado ? 'Retar (Vía Tutor)' : 'Lanzar Reto'}
              </button>
            )}
            {onOpenHeadToHead && !profile.isTutorOnly && (
              <button
                type="button"
                className="tt-pf-3d-btn is-hero-secondary"
                onClick={() => {
                  triggerHaptic('light');
                  onOpenHeadToHead(profile);
                }}
              >
                <TTIcon name="swap" size={15} /> H2H
              </button>
            )}
            {contactPhone && (!profile.hideWhatsapp || profile.isTutelado) && (
              <a
                href={buildWhatsappLink(contactPhone, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="tt-pf-3d-btn is-hero-secondary"
              >
                <TTIcon name="whatsapp" size={15} />{' '}
                {profile.isTutelado ? 'WhatsApp Tutor' : 'WhatsApp'}
              </a>
            )}
          </div>
        )}
      </div>

      {/* 2. MÉTRICAS DEPORTIVAS 3D (TEMPORADA | CARRERA) */}
      {!profile.isTutorOnly && (
        <div className="tt-pf-card">
          <div className="tt-pf-3d-dock" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={statsScope === 'temporada'}
              className={`tt-pf-3d-tab ${statsScope === 'temporada' ? 'is-active' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setStatsScope('temporada');
              }}
            >
              Temporada {new Date().getFullYear()}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statsScope === 'carrera'}
              className={`tt-pf-3d-tab ${statsScope === 'carrera' ? 'is-active' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setStatsScope('carrera');
              }}
            >
              Carrera Total
            </button>
          </div>

          <div className="tt-pf-kpi-grid">
            <div className="tt-pf-kpi-tile">
              <span>PUESTO</span>
              <strong>{officialRank ? `#${officialRank}` : '—'}</strong>
            </div>
            <div className="tt-pf-kpi-tile is-emerald">
              <span>PUNTOS</span>
              <strong>{Number(profile.points || 0).toLocaleString('es-PE')}</strong>
            </div>
            <div className="tt-pf-kpi-tile">
              <span>RÉCORD</span>
              <strong>
                {scopedMetrics.wins}V–{scopedMetrics.losses}D
              </strong>
            </div>
            <div className="tt-pf-kpi-tile">
              <span>EFECTIV.</span>
              <strong>{scopedMetrics.eff}%</strong>
            </div>
          </div>

          {/* Barra de progreso hacia siguiente categoría o calibración */}
          <div className="tt-pf-prog-box">
            <div className="tt-pf-prog-head">
              <span>
                {isCalibrating
                  ? `Partidos de prueba: ${calibPlayed}/${ELO_CONFIG.CALIBRATION_MATCHES}`
                  : nextCategory
                  ? `Camino a ${nextCategory.name}`
                  : 'Categoría máxima del circuito'}
              </span>
              <strong>
                {isCalibrating
                  ? 'Calibrando'
                  : nextCategory
                  ? `Faltan ${levelProgress.remaining} pts`
                  : 'Élite'}
              </strong>
            </div>
            <div className="tt-pf-prog-track">
              <div
                className="tt-pf-prog-fill"
                style={{
                  width: `${
                    isCalibrating
                      ? Math.max(
                          12,
                          Math.round((calibPlayed / ELO_CONFIG.CALIBRATION_MATCHES) * 100)
                        )
                      : levelProgress.pct
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. MÓDULO FAMILIA · MIS HIJOS TUTELADOS (-18) + EMANCIPACIÓN (+18) */}
      {isOwnProfile && !profile.isTutelado && (
        <div className="tt-pf-card is-family">
          <div className="tt-pf-card-head">
            <div>
              <span className="tt-pf-kicker">PROTECCIÓN LEGAL PERÚ (-18)</span>
              <h3>Familia · Mis Hijos Tutelados ({myChildren.length}/3)</h3>
            </div>
            {myChildren.length < 3 && (
              <button
                type="button"
                className="tt-pf-3d-btn is-emerald is-sm"
                onClick={() => {
                  triggerHaptic('light');
                  setIsAddChildOpen(true);
                }}
              >
                + Afiliar Hijo
              </button>
            )}
          </div>

          {myChildren.length === 0 ? (
            <p className="tt-pf-hint">
              Si tienes hijos menores de 18 años que juegan tenis, afilia su perfil aquí: no exponen correo ni teléfono, todo contacto llega a tu WhatsApp y al cumplir 18 pueden llevarse el 100 % de sus puntos.
            </p>
          ) : (
            <div className="tt-pf-child-list">
              {myChildren.map((ch) => {
                const emCode = localEmancCodes[ch.id] || ch.emancipationCode;
                return (
                  <div key={ch.id} className="tt-pf-child-item">
                    <div className="tt-pf-child-top">
                      <SmartImage
                        src={ch.avatar}
                        alt={ch.name}
                        initials={ch.name}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '2px solid #38BDF8',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{ch.name}</strong>
                        <small>
                          {ch.age} años · {getCategoryByPoints(ch.points).name} ·{' '}
                          {Number(ch.points || 0)} pts
                        </small>
                      </div>
                    </div>

                    <div className="tt-pf-child-actions">
                      {onSwitchActiveProfile && (
                        <button
                          type="button"
                          className="tt-pf-3d-btn is-emerald is-sm"
                          style={{ flex: 1 }}
                          onClick={() => {
                            triggerHaptic('medium');
                            onSwitchActiveProfile(ch.id);
                          }}
                        >
                          Entrar como {ch.name.split(' ')[0]}
                        </button>
                      )}
                      <button
                        type="button"
                        className="tt-pf-3d-btn is-surface is-sm"
                        onClick={() => handleEmancipateChild(ch)}
                      >
                        {emCode ? 'Regenerar +18' : 'Emancipar (+18)'}
                      </button>
                    </div>

                    {emCode && (
                      <div className="tt-pf-emanc-box">
                        <div>
                          <small>CÓDIGO DE TRANSFERENCIA +18 (CONSERVA 100% PUNTOS)</small>
                          <strong>{emCode}</strong>
                        </div>
                        <button
                          type="button"
                          className="tt-pf-3d-btn is-emerald is-xs"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(emCode);
                            } catch {
                              // continuar
                            }
                            if (onNotify) onNotify(`Código ${emCode} copiado.`, 'success');
                          }}
                        >
                          Copiar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. ESTILO DE JUEGO Y ÚLTIMOS PARTIDOS */}
      {!profile.isTutorOnly && (
        <>
          <div className="tt-pf-card">
            <span className="tt-pf-kicker">PERFIL EN CANCHA</span>
            <div className="tt-pf-tags-grid">
              <div className="tt-pf-tag-tile">
                <small>Mano</small>
                <strong>{profile.hand || 'Diestro'}</strong>
              </div>
              <div className="tt-pf-tag-tile">
                <small>Arma</small>
                <strong>{profile.bestStroke || profile.weapon || 'Derecha'}</strong>
              </div>
              <div className="tt-pf-tag-tile">
                <small>Disponibilidad</small>
                <strong>{profile.availability || 'Noches y fines de semana'}</strong>
              </div>
            </div>
          </div>

          <div className="tt-pf-card">
            <span className="tt-pf-kicker">ÚLTIMOS RESULTADOS ({recentMatches.length})</span>
            {recentMatches.length === 0 ? (
              <p className="tt-pf-hint">Aún no hay partidos oficiales cerrados en esta ficha.</p>
            ) : (
              <div className="tt-pf-matches-list">
                {recentMatches.map(({ challenge, rival, didWin, delta }) => (
                  <div key={challenge.id} className="tt-pf-match-row">
                    <span className={`tt-pf-res-dot ${didWin ? 'is-w' : 'is-l'}`}>
                      {didWin ? 'V' : 'D'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>vs. {rival?.name || 'Rival'}</strong>
                      <small>
                        {challenge.scoreSummary || 'Oficial'} · {challenge.clubName}
                      </small>
                    </div>
                    <strong className={`tt-pf-delta ${Number(delta) >= 0 ? 'is-w' : 'is-l'}`}>
                      {Number(delta) >= 0 ? `+${delta}` : delta}
                    </strong>
                    {isOwnProfile && onOpenStoriesWithMatch && (
                      <button
                        type="button"
                        className="tt-pf-story-btn"
                        aria-label="Compartir en Story"
                        onClick={() => onOpenStoriesWithMatch(challenge)}
                      >
                        <TTIcon name="stories" size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
