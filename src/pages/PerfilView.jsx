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
  { id: 'default', name: 'Estadio TOTAL TENIS', subtitle: 'Incluido', imageDark: '/assets/perfil-bg-purpura-oscuro.jpg', imageLight: '/assets/perfil-bg-marfil-claro.jpg', gemsCost: 0, accent: '#00DC7D' },
  { id: 'arcilla', name: 'Tierra Batida', subtitle: 'Polvo de ladrillo', imageDark: '/assets/perfil-bg-arcilla.jpg', imageLight: '/assets/perfil-bg-arcilla.jpg', gemsCost: 60, accent: '#DE8566' },
  { id: 'cesped', name: 'Césped Clásico', subtitle: 'Pasto esmeralda', imageDark: '/assets/perfil-bg-cesped.jpg', imageLight: '/assets/perfil-bg-cesped.jpg', gemsCost: 80, accent: '#00DC7D' },
  { id: 'dura', name: 'Pista Dura Nocturna', subtitle: 'Azul cobalto', imageDark: '/assets/perfil-bg-dura.jpg', imageLight: '/assets/perfil-bg-dura.jpg', gemsCost: 80, accent: '#38BDF8' },
  { id: 'finals', name: 'Gala Night Finals', subtitle: 'Esmeralda y oro', imageDark: '/assets/perfil-bg-finals.jpg', imageLight: '/assets/perfil-bg-finals.jpg', gemsCost: 120, accent: '#E5C16C' },
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
    const pct = Math.min(99, Math.max(4, Math.round((Math.max(0, pts - category.min) / span) * 100)));
    return { pct, remaining: Math.max(0, nextCategory.min - pts) };
  }, [category, nextCategory, profile?.points]);

  const myChildren = useMemo(() => {
    if (!profile?.id || profile.isTutelado) return [];
    return (players || []).filter((p) => p.isTutelado && p.tutorId === profile.id);
  }, [players, profile?.id, profile?.isTutelado]);

  const finishedMatches = useMemo(() => {
    if (!profile?.id) return [];
    const map = {};
    (players || []).forEach((p) => { map[p.id] = p; });
    return (challenges || [])
      .filter((c) => c.status === 'FINISHED' && (c.playerAId === profile.id || c.playerBId === profile.id))
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

  // Logros sutiles por mérito real en cancha (gratis, sin stickers IA con fondo blanco)
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
    if ((profile.unlockedBadges || []).includes('mata-gigantes')) list.push({ id: 'giant', label: 'Mata Gigantes', tone: 'clay' });
    if (pts >= 4000) list.push({ id: 'elite', label: 'Élite Circuito', tone: 'gold' });
    if (Number(profile.age) >= 40) list.push({ id: 'senior', label: 'Senior +40', tone: 'neutral' });
    return list.slice(0, 4);
  }, [profile, officialRank]);

  if (!profile) {
    return (
      <section className="tt-perfil-view" aria-label="Mi Perfil TOTAL TENIS">
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
  const calibPlayed = profile.calibrationPlayed !== undefined ? Number(profile.calibrationPlayed) : (Number(profile.wins) || 0) + (Number(profile.losses) || 0);
  const isCalibrating = !profile.isTutorOnly && calibPlayed < ELO_CONFIG.CALIBRATION_MATCHES;
  const ownedScenarios = Array.from(new Set(['default', ...(profile.unlockedScenarios || [])]));
  const activeScenario = PROFILE_SCENARIOS.find((s) => s.id === (profile.scenarioId || 'default')) || PROFILE_SCENARIOS[0];
  const scenarioBgImg = theme === 'light' ? activeScenario.imageLight : activeScenario.imageDark;
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
        if (onNotify) onNotify(`Necesitas ${scenarioObj.gemsCost} 💎 para "${scenarioObj.name}" (tienes ${myGems} 💎).`, 'warning');
        return;
      }
      if (onUnlockScenario) onUnlockScenario({ scenarioId: scenarioObj.id, gemsCost: scenarioObj.gemsCost });
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
    setDraftStrokes(Array.isArray(profile.bestStrokes) && profile.bestStrokes.length ? profile.bestStrokes : [profile.bestStroke || 'Derecha (Forehand)']);
    setDraftDays(Array.isArray(profile.availabilityDays) && profile.availabilityDays.length ? profile.availabilityDays : ['M', 'J', 'S']);
    setDraftTimes(Array.isArray(profile.availabilityTimes) && profile.availabilityTimes.length ? profile.availabilityTimes : ['noche']);
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
      if (onNotify) onNotify('Debes confirmar la declaración de patria potestad / tutela legal.', 'warning');
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
        try { await navigator.clipboard.writeText(code); } catch {}
        if (onNotify) onNotify(`Código +18 generado y copiado: ${code}. Conserva 100% de sus puntos.`, 'success');
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
    <section className={`tt-perfil-view ${theme === 'light' ? 'is-light' : 'is-dark'}`} aria-label={`Perfil de ${profile.name}`}>
      {/* BANNER ACTIVO SI EL PADRE ESTÁ OPERANDO LA SUBCUENTA DE SU HIJO */}
      {isOwnProfile && profile.isTutelado && (
        <div className="tt-pf-tutor-bar">
          <div style={{ minWidth: 0 }}>
            <span>GESTIONANDO SUBCUENTA JUVENIL (-18)</span>
            <strong>{profile.name} · {profile.age} años</strong>
          </div>
          {onSwitchActiveProfile && profile.tutorId && (
            <button
              type="button"
              className="tt-pf-tutor-back tt-pf-press"
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

      {/* 1. PORTADA EDITORIAL LIQUID GLASS */}
      <div className="tt-pf-hero">
        <SmartImage src={scenarioBgImg} fallbackSrc={ASSETS.bgPurpuraOscuro} alt="" className="tt-pf-hero-bg" priority />
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
              <button type="button" className="tt-pf-icon-btn tt-pf-press" aria-label="Cambiar foto y fondo" onClick={openPhotoStudio}>
                <TTIcon name="camera" size={16} />
              </button>
              <button type="button" className="tt-pf-icon-btn tt-pf-press" aria-label="Ajustes" onClick={openTactileSettings}>
                <TTIcon name="settings" size={16} />
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
                  <span key={m.id} className={`tt-pf-merit is-${m.tone}`}>{m.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones: Propias vs Ajenas */}
        {isOwnProfile ? (
          <div className="tt-pf-own-actions">
            {!profile.isTutorOnly && onOpenVipCard && (
              <button type="button" className="tt-btn tt-btn-primary tt-btn-sm tt-pf-press" style={{ flex: 1 }} onClick={() => { triggerHaptic('medium'); onOpenVipCard(); }}>
                <TTIcon name="crown" size={15} /> {profile.isVip ? 'Mi Carnet VIP 3D' : 'Carnet & Pase VIP'}
              </button>
            )}
            <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm tt-pf-press" onClick={openPhotoStudio}>
              Fondos ({ownedScenarios.length}/{PROFILE_SCENARIOS.length})
            </button>
          </div>
        ) : (
          <div className="tt-pf-own-actions">
            {onQuickChallenge && !profile.isTutorOnly && (
              <button type="button" className="tt-btn tt-btn-primary tt-btn-sm tt-pf-press" style={{ flex: 1 }} onClick={() => { triggerHaptic('medium'); onQuickChallenge(profile); }}>
                <TTIcon name="challenge" size={15} /> {profile.isTutelado ? 'Retar (Vía Tutor)' : 'Lanzar Reto'}
              </button>
            )}
            {onOpenHeadToHead && !profile.isTutorOnly && (
              <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm tt-pf-press" onClick={() => { triggerHaptic('light'); onOpenHeadToHead(profile); }}>
                <TTIcon name="swap" size={15} /> H2H
              </button>
            )}
            {contactPhone && (!profile.hideWhatsapp || profile.isTutelado) && (
              <a
                href={buildWhatsappLink(contactPhone, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="tt-btn tt-btn-ghost tt-btn-sm tt-pf-press"
                style={{ textDecoration: 'none' }}
              >
                <TTIcon name="whatsapp" size={15} /> {profile.isTutelado ? 'WhatsApp Tutor' : 'WhatsApp'}
              </a>
            )}
          </div>
        )}
      </div>

      {/* 2. MÉTRICAS DEPORTIVAS (TEMPORADA 2026 | CARRERA) */}
      {!profile.isTutorOnly && (
        <div className="tt-pf-card">
          <div className="tt-pf-scope-tabs" role="tablist">
            <span className="tt-pf-scope-slider" style={{ transform: `translateX(${statsScope === 'temporada' ? '0%' : '100%'})` }} />
            <button type="button" className={statsScope === 'temporada' ? 'is-active' : ''} onClick={() => { triggerHaptic('light'); setStatsScope('temporada'); }}>
              Temporada {new Date().getFullYear()}
            </button>
            <button type="button" className={statsScope === 'carrera' ? 'is-active' : ''} onClick={() => { triggerHaptic('light'); setStatsScope('carrera'); }}>
              Carrera Total
            </button>
          </div>

          <div className="tt-pf-kpi-grid">
            <div><span>PUESTO</span><strong>{officialRank ? `#${officialRank}` : '—'}</strong></div>
            <div className="is-emerald"><span>PUNTOS</span><strong>{Number(profile.points || 0).toLocaleString('es-PE')}</strong></div>
            <div><span>RÉCORD</span><strong>{scopedMetrics.wins}V–{scopedMetrics.losses}D</strong></div>
            <div><span>EFECTIV.</span><strong>{scopedMetrics.eff}%</strong></div>
          </div>

          {/* Barra de progreso hacia siguiente categoría o calibración */}
          <div className="tt-pf-prog-box">
            <div className="tt-pf-prog-head">
              <span>{isCalibrating ? `Partidos de prueba: ${calibPlayed}/${ELO_CONFIG.CALIBRATION_MATCHES}` : nextCategory ? `Camino a ${nextCategory.name}` : 'Categoría máxima del circuito'}</span>
              <strong>{isCalibrating ? 'Calibrando' : nextCategory ? `Faltan ${levelProgress.remaining} pts` : 'Élite'}</strong>
            </div>
            <div className="tt-pf-prog-track">
              <div className="tt-pf-prog-fill" style={{ width: `${isCalibrating ? Math.max(12, Math.round((calibPlayed / ELO_CONFIG.CALIBRATION_MATCHES) * 100)) : levelProgress.pct}%` }} />
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
              <button type="button" className="tt-btn tt-btn-primary tt-btn-sm tt-pf-press" onClick={() => { triggerHaptic('light'); setIsAddChildOpen(true); }}>
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
                      <SmartImage src={ch.avatar} alt={ch.name} initials={ch.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{ch.name}</strong>
                        <small>{ch.age} años · {getCategoryByPoints(ch.points).name} · {Number(ch.points || 0)} pts</small>
                      </div>
                    </div>

                    <div className="tt-pf-child-actions">
                      {onSwitchActiveProfile && (
                        <button type="button" className="tt-btn tt-btn-primary tt-btn-sm tt-pf-press" style={{ flex: 1 }} onClick={() => { triggerHaptic('medium'); onSwitchActiveProfile(ch.id); }}>
                          Entrar como {ch.name.split(' ')[0]}
                        </button>
                      )}
                      <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm tt-pf-press" onClick={() => handleEmancipateChild(ch)}>
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
                          className="tt-pf-copy-mini"
                          onClick={async () => {
                            try { await navigator.clipboard.writeText(emCode); } catch {}
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
              <div><small>Mano</small><strong>{profile.hand || 'Diestro'}</strong></div>
              <div><small>Arma</small><strong>{profile.bestStroke || profile.weapon || 'Derecha'}</strong></div>
              <div><small>Disponibilidad</small><strong>{profile.availability || 'Noches y fines de semana'}</strong></div>
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
                    <span className={`tt-pf-res-dot ${didWin ? 'is-w' : 'is-l'}`}>{didWin ? 'V' : 'D'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>vs. {rival?.name || 'Rival'}</strong>
                      <small>{challenge.scoreSummary || 'Oficial'} · {challenge.clubName}</small>
                    </div>
                    <strong className={`tt-pf-delta ${Number(delta) >= 0 ? 'is-w' : 'is-l'}`}>
                      {Number(delta) >= 0 ? `+${delta}` : delta}
                    </strong>
                    {isOwnProfile && onOpenStoriesWithMatch && (
                      <button type="button" className="tt-pf-story-btn tt-pf-press" aria-label="Compartir en Story" onClick={() => onOpenStoriesWithMatch(challenge)}>
                        <TTIcon name="stories" size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL 1: ESTUDIO DE FOTO Y FONDOS CANJEABLES */}
      <ModalPortal isOpen={isPhotoStudioOpen} onClose={() => setIsPhotoStudioOpen(false)} title="Foto y Fondos de Perfil" subtitle="Personaliza tu portada con tus Gemas" icon={<IconBadge name="camera" variant="emerald" size={36} />} isTopLayer>
        <div className="tt-pf-modal-stack">
          <div className="tt-pf-preview-box">
            <SmartImage src={draftPhoto || profile.avatar} alt="" initials={profile.name} style={{ width: 92, height: 92, borderRadius: '50%', objectFit: 'cover', border: '2px solid #00DC7D' }} />
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFilePicked} />
            <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={() => fileInputRef.current?.click()}>
              <TTIcon name="camera" size={14} /> Elegir Foto del Celular
            </button>
          </div>

          <span className="tt-pf-kicker">ESCENARIOS DE PORTADA (TU SALDO: {Number(profile.gems || 0)} 💎)</span>
          <div className="tt-pf-scen-grid">
            {PROFILE_SCENARIOS.map((sc) => {
              const owned = ownedScenarios.includes(sc.id);
              const active = draftScenarioId === sc.id;
              return (
                <button key={sc.id} type="button" className={`tt-pf-scen-tile ${active ? 'is-on' : ''}`} onClick={() => { triggerHaptic('light'); setDraftScenarioId(sc.id); }}>
                  <SmartImage src={sc.imageDark} alt={sc.name} style={{ width: '100%', height: 54, objectFit: 'cover', borderRadius: 10 }} />
                  <strong>{sc.name}</strong>
                  <small>{owned ? 'Tuyo' : `${sc.gemsCost} 💎`}</small>
                </button>
              );
            })}
          </div>

          <button type="button" disabled={isSavingPhoto} className="tt-btn tt-btn-primary" style={{ width: '100%' }} onClick={handleSavePhotoStudio}>
            {isSavingPhoto ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </ModalPortal>

      {/* MODAL 2: AJUSTES TÁCTILES + MODO SOLO TUTOR */}
      <ModalPortal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Ajustes Deportivos y Privacidad" icon={<IconBadge name="settings" variant="purple" size={36} />} isTopLayer>
        <form onSubmit={handleSaveSettings} className="tt-pf-modal-stack">
          <div className="tt-pf-set-group">
            <span className="tt-pf-kicker">MANO HÁBIL</span>
            <div className="tt-pf-chips">
              {['Diestro', 'Zurdo'].map((h) => (
                <button key={h} type="button" className={`tt-pf-chip ${draftHand === h ? 'is-on' : ''}`} onClick={() => setDraftHand(h)}>{h}</button>
              ))}
            </div>
          </div>

          <div className="tt-pf-set-group">
            <span className="tt-pf-kicker">MEJORES GOLPES (MÁX. 2)</span>
            <div className="tt-pf-chips">
              {STROKE_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`tt-pf-chip ${draftStrokes.includes(st) ? 'is-on' : ''}`}
                  onClick={() => setDraftStrokes((prev) => (prev.includes(st) ? (prev.length > 1 ? prev.filter((x) => x !== st) : prev) : [...prev.slice(-1), st]))}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="tt-pf-set-group">
            <span className="tt-pf-kicker">CLUB BASE</span>
            <select className="tt-pf-input" value={draftClubId} onChange={(e) => setDraftClubId(e.target.value)}>
              <option value="independiente">Independiente</option>
              {(clubs || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="tt-pf-set-group">
            <span className="tt-pf-kicker">DISPONIBILIDAD</span>
            <div className="tt-pf-chips">
              {WEEK_DAYS.map((d) => (
                <button key={d.id} type="button" className={`tt-pf-chip ${draftDays.includes(d.id) ? 'is-on' : ''}`} onClick={() => setDraftDays((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id]))}>
                  {d.label}
                </button>
              ))}
            </div>
            <div className="tt-pf-chips" style={{ marginTop: 6 }}>
              {TIME_WINDOWS.map((tw) => (
                <button key={tw.id} type="button" className={`tt-pf-chip ${draftTimes.includes(tw.id) ? 'is-on' : ''}`} onClick={() => setDraftTimes((p) => (p.includes(tw.id) && p.length > 1 ? p.filter((x) => x !== tw.id) : Array.from(new Set([...p, tw.id]))))}>
                  {tw.label}
                </button>
              ))}
            </div>
          </div>

          <label className="tt-pf-check-row">
            <input type="checkbox" checked={draftHideWhatsapp} onChange={(e) => setDraftHideWhatsapp(e.target.checked)} />
            <span>Ocultar mi botón de WhatsApp en mi ficha pública</span>
          </label>

          {!profile.isTutelado && (
            <label className="tt-pf-check-row">
              <input type="checkbox" checked={draftTutorOnly} onChange={(e) => setDraftTutorOnly(e.target.checked)} />
              <span><strong>Modo Solo Padre/Tutor:</strong> No competir en el ranking adulto, solo gestionar a mis hijos</span>
            </label>
          )}

          <button type="submit" className="tt-btn tt-btn-primary" style={{ width: '100%' }}>Guardar Preferencias</button>
        </form>
      </ModalPortal>

      {/* MODAL 3: AFILIAR HIJO TUTELADO (-18) */}
      <ModalPortal isOpen={isAddChildOpen} onClose={() => setIsAddChildOpen(false)} title="Afiliar Hijo Menor (-18)" subtitle="Subcuenta tutelada 100% legal · Cero datos privados del menor" icon={<IconBadge name="shield" variant="emerald" size={36} />} isTopLayer>
        <form onSubmit={handleCreateChildSubmit} className="tt-pf-modal-stack">
          <input className="tt-pf-input" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Nombre y apellido de tu hijo/a" required />

          <div className="tt-pf-g2">
            <input type="number" min={6} max={17} className="tt-pf-input" value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="Edad (6 a 17)" required />
            <select className="tt-pf-input" value={childDivision} onChange={(e) => setChildDivision(e.target.value)}>
              <option value="Varones">Varones</option>
              <option value="Damas">Damas</option>
            </select>
          </div>

          <div className="tt-pf-g2">
            <select className="tt-pf-input" value={childClubId} onChange={(e) => setChildClubId(e.target.value)}>
              <option value="independiente">Independiente</option>
              {(clubs || []).map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
            </select>
            <select className="tt-pf-input" value={childHand} onChange={(e) => setChildHand(e.target.value)}>
              <option value="Diestro">Diestro</option>
              <option value="Zurdo">Zurdo</option>
            </select>
          </div>

          <div>
            <span className="tt-pf-kicker">NIVEL INICIAL EN CANCHA (AJUSTABLE EN 5 PARTIDOS)</span>
            <div className="tt-pf-lvl-grid">
              {CHILD_LEVEL_PRESETS.map((lv) => (
                <button key={lv.id} type="button" className={`tt-pf-lvl-btn ${childLevelPts === lv.points ? 'is-on' : ''}`} onClick={() => setChildLevelPts(lv.points)}>
                  <strong>{lv.label}</strong>
                  <small>{lv.desc}</small>
                </button>
              ))}
            </div>
          </div>

          <label className="tt-pf-check-row is-legal">
            <input type="checkbox" checked={childLegalOk} onChange={(e) => setChildLegalOk(e.target.checked)} />
            <span>
              Declaro ser padre, madre o apoderado legal del menor (patria potestad), autorizo su participación en TOTAL TENIS y asumo el control exclusivo de sus retos y contacto vía mi WhatsApp.
            </span>
          </label>

          <button type="submit" disabled={isSavingChild} className="tt-btn tt-btn-primary" style={{ width: '100%' }}>
            {isSavingChild ? 'Creando subcuenta...' : 'Crear Subcuenta Tutelada'}
          </button>
        </form>
      </ModalPortal>

      <style>{`
        .tt-perfil-view { display: flex; flex-direction: column; gap: 13px; }
        .tt-pf-press { transition: transform 165ms cubic-bezier(0.22, 1.38, 0.36, 1) !important; }
        .tt-pf-press:active { transform: scale(0.95) !important; }

        .tt-pf-tutor-bar {
          padding: 11px 13px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(30, 7, 52, 0.92) 100%);
          border: 1px solid rgba(56, 189, 248, 0.55); color: #FAF9F5;
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
        }
        .tt-pf-tutor-bar span { display: block; font-size: 0.56rem; font-weight: 900; letter-spacing: 0.08em; color: #7DD3FC; }
        .tt-pf-tutor-bar strong { font-size: 0.86rem; }
        .tt-pf-tutor-back { padding: 7px 11px; border-radius: 999px; background: #FAF9F5; color: #1E0734; font-size: 0.72rem; font-weight: 900; white-space: nowrap; }

        .tt-pf-hero {
          position: relative; border-radius: 24px; overflow: hidden; padding: 15px;
          background: #160428; color: #FAF9F5; border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), var(--tt-shadow-sm);
          display: flex; flex-direction: column; gap: 13px;
        }
        .tt-pf-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.45; }
        .tt-pf-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(22, 4, 40, 0.48) 0%, rgba(18, 3, 33, 0.94) 100%); }
        .tt-pf-hero-top, .tt-pf-hero-main, .tt-pf-own-actions { position: relative; z-index: 2; }
        .tt-pf-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .tt-pf-pills-left { display: flex; flex-wrap: wrap; gap: 6px; }
        .tt-pf-tutela-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; background: rgba(56, 189, 248, 0.22); border: 1px solid rgba(125, 211, 252, 0.55); color: #E0F2FE; font-size: 0.62rem; font-weight: 900; }
        .tt-pf-vip-pill { padding: 4px 9px; border-radius: 999px; background: linear-gradient(135deg, #F5E1A4 0%, #CCA046 100%); color: #1A1102; font-size: 0.62rem; font-weight: 900; }
        .tt-pf-top-btns { display: flex; gap: 7px; }
        .tt-pf-icon-btn { width: 36px; height: 36px; border-radius: 12px; background: rgba(250, 249, 245, 0.14); border: 1px solid rgba(250, 249, 245, 0.22); color: #FAF9F5; display: inline-flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }

        .tt-pf-hero-main { display: flex; align-items: center; gap: 13px; }
        .tt-pf-avatar-wrap { width: 78px; height: 94px; border-radius: 18px; overflow: hidden; border: 2px solid #00DC7D; flex-shrink: 0; background: #1E0734; }
        .tt-pf-avatar-wrap.is-editable { cursor: pointer; }
        .tt-pf-id-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .tt-pf-name { margin: 0; font-family: var(--tt-font-display); font-size: 1.56rem; line-height: 1; color: #FAF9F5; }
        .tt-pf-sub-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 0.74rem; color: rgba(250, 249, 245, 0.82); }
        .tt-pf-cat-chip { padding: 2px 8px; border-radius: 999px; background: rgba(0, 220, 125, 0.2); border: 1px solid rgba(0, 220, 125, 0.45); color: #7CF5C0; font-size: 0.66rem; font-weight: 900; }

        .tt-pf-merits-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
        .tt-pf-merit { padding: 2px 8px; border-radius: 999px; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.04em; background: rgba(255, 255, 255, 0.12); color: #FAF9F5; }
        .tt-pf-merit.is-gold { background: rgba(229, 193, 108, 0.22); color: #F5E1A4; border: 1px solid rgba(229, 193, 108, 0.45); }
        .tt-pf-merit.is-emerald { background: rgba(0, 220, 125, 0.18); color: #7CF5C0; border: 1px solid rgba(0, 220, 125, 0.4); }
        .tt-pf-merit.is-clay { background: rgba(222, 133, 102, 0.22); color: #FBD3C4; border: 1px solid rgba(222, 133, 102, 0.45); }

        .tt-pf-own-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .tt-pf-card {
          padding: 14px; border-radius: 21px; background: var(--tt-surface); border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09), var(--tt-shadow-sm);
          display: flex; flex-direction: column; gap: 11px;
        }
        .tt-pf-card.is-family { border-color: rgba(56, 189, 248, 0.42); }
        .tt-pf-card-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .tt-pf-card h3 { margin: 2px 0 0; font-family: var(--tt-font-display); font-size: 1.18rem; line-height: 1.06; }
        .tt-pf-kicker { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.09em; color: var(--tt-emerald-text); }
        .tt-pf-hint { margin: 0; font-size: 0.76rem; line-height: 1.44; color: var(--tt-text-muted); }

        .tt-pf-scope-tabs { position: relative; display: grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: 14px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-pf-scope-slider { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 2); border-radius: 10px; background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%); transition: transform 280ms cubic-bezier(0.22, 1.24, 0.36, 1); pointer-events: none; }
        .tt-perfil-view.is-light .tt-pf-scope-slider { background: #1E0734; }
        .tt-pf-scope-tabs button { position: relative; z-index: 1; min-height: 35px; font-size: 0.74rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-pf-scope-tabs button.is-active { color: #10021E; font-weight: 900; }
        .tt-perfil-view.is-light .tt-pf-scope-tabs button.is-active { color: #00DC7D; }

        .tt-pf-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
        .tt-pf-kpi-grid > div { padding: 9px 5px; border-radius: 13px; background: var(--tt-surface-2); text-align: center; }
        .tt-pf-kpi-grid span { display: block; font-size: 0.54rem; font-weight: 900; color: var(--tt-text-muted); }
        .tt-pf-kpi-grid strong { font-family: var(--tt-font-display); font-size: 1.22rem; line-height: 1.05; }
        .tt-pf-kpi-grid .is-emerald strong { color: var(--tt-emerald-text); }

        .tt-pf-prog-box { display: flex; flex-direction: column; gap: 5px; }
        .tt-pf-prog-head { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--tt-text-muted); }
        .tt-pf-prog-head strong { color: var(--tt-text); }
        .tt-pf-prog-track { height: 7px; border-radius: 999px; background: var(--tt-surface-2); overflow: hidden; }
        .tt-pf-prog-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00DC7D 0%, #E5C16C 100%); }

        .tt-pf-child-list, .tt-pf-matches-list, .tt-pf-modal-stack { display: flex; flex-direction: column; gap: 9px; }
        .tt-pf-child-item { padding: 11px; border-radius: 15px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 9px; }
        .tt-pf-child-top { display: flex; align-items: center; gap: 10px; }
        .tt-pf-child-top strong { display: block; font-size: 0.88rem; }
        .tt-pf-child-top small { font-size: 0.71rem; color: var(--tt-text-muted); }
        .tt-pf-child-actions { display: flex; gap: 7px; }
        .tt-pf-emanc-box { padding: 9px 11px; border-radius: 12px; background: rgba(0, 220, 125, 0.12); border: 1px solid rgba(0, 220, 125, 0.42); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tt-pf-emanc-box small { display: block; font-size: 0.54rem; font-weight: 900; color: var(--tt-emerald-text); }
        .tt-pf-emanc-box strong { font-family: ui-monospace, monospace; font-size: 1rem; letter-spacing: 0.08em; }
        .tt-pf-copy-mini { padding: 5px 10px; border-radius: 999px; background: #00DC7D; color: #10021E; font-size: 0.68rem; font-weight: 900; }

        .tt-pf-tags-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tt-pf-tags-grid > div { padding: 9px; border-radius: 13px; background: var(--tt-surface-2); }
        .tt-pf-tags-grid small { display: block; font-size: 0.62rem; color: var(--tt-text-muted); }
        .tt-pf-tags-grid strong { display: block; font-size: 0.78rem; margin-top: 2px; }

        .tt-pf-match-row { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 13px; background: var(--tt-surface-2); }
        .tt-pf-res-dot { width: 26px; height: 26px; border-radius: 8px; font-weight: 900; font-size: 0.72rem; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tt-pf-res-dot.is-w { background: rgba(0, 220, 125, 0.2); color: var(--tt-emerald-text); }
        .tt-pf-res-dot.is-l { background: rgba(239, 68, 68, 0.18); color: #F87171; }
        .tt-pf-match-row strong { display: block; font-size: 0.82rem; }
        .tt-pf-match-row small { display: block; font-size: 0.68rem; color: var(--tt-text-muted); }
        .tt-pf-delta { font-family: var(--tt-font-display); font-size: 1.05rem; }
        .tt-pf-delta.is-w { color: var(--tt-emerald-text); }
        .tt-pf-delta.is-l { color: #F87171; }
        .tt-pf-story-btn { width: 30px; height: 30px; border-radius: 9px; background: var(--tt-surface); border: 1px solid var(--tt-border); color: var(--tt-text); display: inline-flex; align-items: center; justify-content: center; }

        .tt-pf-preview-box { display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 10px; border-radius: 15px; background: var(--tt-surface-2); }
        .tt-pf-scen-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .tt-pf-scen-tile { padding: 8px; border-radius: 13px; background: var(--tt-surface-2); border: 1.5px solid var(--tt-border); text-align: left; color: var(--tt-text); display: flex; flex-direction: column; gap: 4px; }
        .tt-pf-scen-tile.is-on { border-color: #00DC7D; }
        .tt-pf-scen-tile strong { font-size: 0.76rem; }
        .tt-pf-scen-tile small { font-size: 0.66rem; color: var(--tt-emerald-text); font-weight: 800; }

        .tt-pf-set-group { display: flex; flex-direction: column; gap: 6px; }
        .tt-pf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .tt-pf-chip { padding: 6px 11px; border-radius: 999px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.72rem; font-weight: 800; }
        .tt-pf-chip.is-on { background: rgba(0, 220, 125, 0.16); border-color: #00DC7D; color: var(--tt-emerald-text); }
        .tt-pf-input { width: 100%; min-height: 42px; padding: 0 11px; border-radius: 12px; background: var(--tt-surface-2); border: 1px solid var(--tt-border-medium); color: var(--tt-text); font-size: 16px; }
        .tt-pf-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tt-pf-lvl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .tt-pf-lvl-btn { padding: 9px; border-radius: 12px; background: var(--tt-surface-2); border: 1.5px solid var(--tt-border); text-align: left; color: var(--tt-text); display: flex; flex-direction: column; gap: 2px; }
        .tt-pf-lvl-btn.is-on { border-color: #00DC7D; background: rgba(0, 220, 125, 0.12); }
        .tt-pf-lvl-btn strong { font-size: 0.74rem; }
        .tt-pf-lvl-btn small { font-size: 0.64rem; color: var(--tt-text-muted); }
        .tt-pf-check-row { display: flex; align-items: flex-start; gap: 9px; font-size: 0.74rem; line-height: 1.38; color: var(--tt-text-secondary); cursor: pointer; }
        .tt-pf-check-row input { width: 18px; height: 18px; margin-top: 2px; accent-color: #00DC7D; flex-shrink: 0; }
        .tt-pf-check-row.is-legal { padding: 10px; border-radius: 12px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.35); }
      `}</style>
    </section>
  );
}
