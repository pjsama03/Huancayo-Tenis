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
import { isCloudReady, uploadCompressedMedia } from '../utils/cloudService';

/* ==========================================================================
   FONDOS DE PERFIL (BASE CLARO/OSCURO + 4 GRAND SLAM CANJEABLES CON GEMAS)
   ========================================================================== */
const PROFILE_SCENARIOS = [
  {
    id: 'default',
    name: 'Estadio TOTAL TENIS',
    subtitle: 'Incluido por defecto',
    imageDark: '/assets/perfil-bg-purpura-oscuro.jpg',
    imageLight: '/assets/perfil-bg-marfil-claro.jpg',
    gemsCost: 0,
    accent: '#00DC7D',
  },
  {
    id: 'arcilla',
    name: 'Tierra Batida',
    subtitle: 'Polvo de ladrillo terracota',
    imageDark: '/assets/perfil-bg-arcilla.jpg',
    imageLight: '/assets/perfil-bg-arcilla.jpg',
    gemsCost: 60,
    accent: '#DE8566',
  },
  {
    id: 'cesped',
    name: 'Césped Clásico',
    subtitle: 'Pasto sagrado esmeralda',
    imageDark: '/assets/perfil-bg-cesped.jpg',
    imageLight: '/assets/perfil-bg-cesped.jpg',
    gemsCost: 80,
    accent: '#00DC7D',
  },
  {
    id: 'dura',
    name: 'Pista Dura Nocturna',
    subtitle: 'Azul cobalto de velocidad',
    imageDark: '/assets/perfil-bg-dura.jpg',
    imageLight: '/assets/perfil-bg-dura.jpg',
    gemsCost: 80,
    accent: '#60A5FA',
  },
  {
    id: 'finals',
    name: 'Gala Night Finals',
    subtitle: 'Láser esmeralda y champán',
    imageDark: '/assets/perfil-bg-finals.jpg',
    imageLight: '/assets/perfil-bg-finals.jpg',
    gemsCost: 120,
    accent: '#E5C16C',
  },
];

/* ==========================================================================
   OPCIONES TÁCTILES DEL MODAL DE AJUSTES
   ========================================================================== */
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

function compressImageFileToDataUrl(file, maxDim = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no soportado'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ==========================================================================
   VISTA PRINCIPAL: PerfilView (LIMPIO, AISLADO EN READONLY, LIQUID GLASS)
   ========================================================================== */
export default function PerfilView({
  player = null,
  currentUser = null,
  players = [],
  clubs = INITIAL_CLUBS,
  challenges = [],
  seasonSnapshots = null,
  theme = 'dark',
  readOnly = false,
  onUpdateProfile,
  onUnlockScenario,
  onOpenVipCard,
  onOpenHeadToHead,
  onOpenStoriesWithMatch,
  onQuickChallenge,
  onOpenAuth,
  onNotify,
}) {
  const fileInputRef = useRef(null);

  const profile = player || currentUser;
  const isOwnProfile = !readOnly && Boolean(currentUser && profile && currentUser.id === profile.id);

  const [statsScope, setStatsScope] = useState('temporada'); // 'temporada' | 'carrera'
  const [isPhotoStudioOpen, setIsPhotoStudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // Estudio de Foto y Fondos
  const [draftPhoto, setDraftPhoto] = useState('');
  const [draftZoom, setDraftZoom] = useState(1);
  const [draftOffsetX, setDraftOffsetX] = useState(0);
  const [draftOffsetY, setDraftOffsetY] = useState(0);
  const [draftRotate, setDraftRotate] = useState(0);
  const [draftSilhouetteMode, setDraftSilhouetteMode] = useState(false);
  const [draftScenarioId, setDraftScenarioId] = useState('default');

  // Ajustes Táctiles
  const [draftHand, setDraftHand] = useState('Diestro');
  const [draftStrokes, setDraftStrokes] = useState(['Derecha (Forehand)']);
  const [draftDays, setDraftDays] = useState(['M', 'J', 'S']);
  const [draftTimes, setDraftTimes] = useState(['noche']);
  const [draftClubId, setDraftClubId] = useState('independiente');
  const [draftHideWhatsapp, setDraftHideWhatsapp] = useState(false);

  const category = getCategoryByPoints(profile?.points || 0);

  const nextCategory = useMemo(() => {
    const idx = CATEGORIES_SCALE.findIndex((c) => c.id === category.id);
    return idx >= 0 && idx < CATEGORIES_SCALE.length - 1 ? CATEGORIES_SCALE[idx + 1] : null;
  }, [category]);

  const officialRank = useMemo(() => {
    if (!profile?.id) return null;
    const sorted = [...(players || [])].sort((a, b) => {
      const diff = (Number(b.points) || 0) - (Number(a.points) || 0);
      if (diff !== 0) return diff;
      return (Number(b.wins) || 0) - (Number(a.wins) || 0);
    });
    const idx = sorted.findIndex((p) => p.id === profile.id);
    return idx >= 0 ? idx + 1 : null;
  }, [players, profile?.id]);

  const levelProgress = useMemo(() => {
    if (!nextCategory) {
      return { pct: 100, remaining: 0, isMatchPointAscenso: false };
    }
    const pts = Number(profile?.points) || 0;
    const span = Math.max(1, nextCategory.min - category.min);
    const gained = Math.max(0, pts - category.min);
    const pct = Math.min(99, Math.max(4, Math.round((gained / span) * 100)));
    const remaining = Math.max(0, nextCategory.min - pts);
    return {
      pct,
      remaining,
      isMatchPointAscenso: pct >= 90 && remaining > 0,
    };
  }, [category, nextCategory, profile?.points]);

  const playersById = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  const allPlayerMatches = useMemo(() => {
    if (!profile?.id) return [];
    return (challenges || [])
      .filter(
        (c) =>
          c.status === 'FINISHED' &&
          (c.playerAId === profile.id || c.playerBId === profile.id)
      )
      .map((c) => {
        const isA = c.playerAId === profile.id;
        const rival = playersById[isA ? c.playerBId : c.playerAId];
        const didWin = c.winnerId === profile.id;
        const delta = isA ? c.eloDeltaA : c.eloDeltaB;
        return { challenge: c, isA, rival, didWin, delta };
      });
  }, [challenges, playersById, profile?.id]);

  const recentMatches = useMemo(() => allPlayerMatches.slice(0, 6), [allPlayerMatches]);

  /* Métricas diferenciadas reales para Temporada 2026 vs Carrera */
  const careerMetrics = useMemo(() => {
    if (!profile) {
      return { annualTotal: 0, peakPoints: 0, seasonsPlayed: 1, officialWins: 0 };
    }
    const currentPts = Number(profile.points) || 0;
    let annualTotal = currentPts;
    let peakPoints = currentPts;
    let seasonsPlayed = 1;

    if (Array.isArray(seasonSnapshots?.seasons) && seasonSnapshots.seasons.length > 0) {
      let sum = 0;
      let count = 0;
      seasonSnapshots.seasons.forEach((s) => {
        const val = s.locked
          ? Number(s.scores?.[profile.id]) || 0
          : s.number === seasonSnapshots.currentSeason
          ? currentPts
          : 0;
        if (val > 0) {
          sum += val;
          count += 1;
          if (val > peakPoints) peakPoints = val;
        }
      });
      if (sum > 0) annualTotal = sum;
      if (count > 0) seasonsPlayed = count;
    }

    return {
      annualTotal,
      peakPoints,
      seasonsPlayed,
      officialWins: Number(profile.wins) || 0,
    };
  }, [profile, seasonSnapshots]);

  /* Logros sutiles ganados estrictamente por mérito en cancha (gratis, sin stickers IA) */
  const earnedMerits = useMemo(() => {
    if (!profile) return [];
    const list = [];
    const w = Number(profile.wins) || 0;
    const l = Number(profile.losses) || 0;
    const st = Number(profile.streak) || 0;
    const pts = Number(profile.points) || 0;
    const cal = profile.calibrationPlayed !== undefined ? Number(profile.calibrationPlayed) : w + l;
    const isCalib = cal < ELO_CONFIG.CALIBRATION_MATCHES;

    if (!isCalib && officialRank && officialRank <= 8) {
      list.push({ id: 'top8', label: 'Maestro Top 8', icon: 'crown', tone: 'gold' });
    }

    const beatGiant =
      allPlayerMatches.some(
        (m) => m.didWin && m.rival && Number(m.rival.points || 0) >= pts + 250
      ) ||
      (Array.isArray(profile.unlockedBadges) &&
        profile.unlockedBadges.some((b) => String(b).includes('mata-gigantes')));
    if (beatGiant) {
      list.push({ id: 'giant', label: 'Mata Gigantes', icon: 'challenge', tone: 'emerald' });
    }

    if (w >= 3 && l === 0) {
      list.push({ id: 'unbeaten', label: 'Invicto', icon: 'shield', tone: 'emerald' });
    } else if (st >= 3) {
      list.push({ id: 'streak', label: `Racha +${st}`, icon: 'flame', tone: 'emerald' });
    }

    if (pts >= 4000) {
      list.push({ id: 'elite', label: 'Élite Circuito', icon: 'trophy', tone: 'gold' });
    }

    return list.slice(0, 3);
  }, [profile, officialRank, allPlayerMatches]);

  if (!profile) {
    return (
      <section className="tt-perfil-view" aria-label="Mi Perfil TOTAL TENIS">
        <EmptyStateCard
          theme={theme}
          title="Tu Ficha Oficial te espera"
          description="Crea tu cuenta (+18) o inicia sesión para personalizar tu perfil, subir tu foto de cancha y seguir tu progreso."
          actionLabel="Iniciar Sesión / Crear Cuenta"
          onAction={() => onOpenAuth && onOpenAuth('login')}
        />
      </section>
    );
  }

  const club = getClubById(clubs, profile.clubId);
  const wins = Number(profile.wins) || 0;
  const losses = Number(profile.losses) || 0;
  const played = wins + losses;
  const calibPlayed =
    profile.calibrationPlayed !== undefined ? Number(profile.calibrationPlayed) : played;
  const isCalibrating = calibPlayed < ELO_CONFIG.CALIBRATION_MATCHES;
  const streak = Number(profile.streak) || 0;
  const eff = played > 0 ? Math.round((wins / played) * 100) : 0;

  const ownedScenarios = Array.from(
    new Set(['default', ...(profile.unlockedScenarios || [])])
  );
  const currentScenarioKey = profile.scenarioId || profile.coverScenario || 'default';
  const activeScenario =
    PROFILE_SCENARIOS.find((s) => s.id === currentScenarioKey) || PROFILE_SCENARIOS[0];
  const scenarioBgImg =
    theme === 'light' ? activeScenario.imageLight : activeScenario.imageDark;

  const nameParts = String(profile.name || 'Jugador').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const openUnifiedVipModal = () => {
    if (!isOwnProfile) return;
    triggerHaptic('medium');
    if (onOpenVipCard) onOpenVipCard();
  };

  /* ------------------------------------------------------------------------
     ESTUDIO DE FOTO Y FONDOS DE PERFIL (SUBIDA REAL A STORAGE 'media')
     ------------------------------------------------------------------------ */
  const openPhotoStudio = () => {
    if (!isOwnProfile) return;
    triggerHaptic('light');
    setDraftPhoto(profile.fullBodyPhoto || profile.avatar || '');
    setDraftZoom(profile.photoTransform?.zoom ?? 1);
    setDraftOffsetX(profile.photoTransform?.x ?? 0);
    setDraftOffsetY(profile.photoTransform?.y ?? 0);
    setDraftRotate(profile.photoTransform?.rotate ?? 0);
    setDraftSilhouetteMode(Boolean(profile.photoTransform?.silhouette));
    setDraftScenarioId(currentScenarioKey);
    setIsPhotoStudioOpen(true);
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setDraftPhoto(compressed);
      triggerHaptic('success');
      if (onNotify) {
        onNotify('Foto cargada. Ajusta el zoom o encuadre y guarda los cambios.', 'success');
      }
    } catch {
      if (onNotify) onNotify('No pudimos procesar esa foto. Prueba con JPG o PNG.', 'warning');
    }
  };

  const handleSavePhotoStudio = async () => {
    if (!isOwnProfile || isSavingPhoto) return;

    const scenarioObj = PROFILE_SCENARIOS.find((s) => s.id === draftScenarioId);
    const isOwned = ownedScenarios.includes(draftScenarioId);

    if (!isOwned && scenarioObj) {
      const myGems = Number(profile.gems) || 0;
      if (myGems < scenarioObj.gemsCost) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            `Necesitas ${scenarioObj.gemsCost} Gemas para desbloquear "${scenarioObj.name}" (tienes ${myGems}).`,
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
      let finalPhotoUrl = draftPhoto || profile.avatar || '';

      if (finalPhotoUrl && String(finalPhotoUrl).startsWith('data:image/') && isCloudReady) {
        const uploadedUrl = await uploadCompressedMedia(finalPhotoUrl, 'avatars', profile.id);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
        }
      }

      if (onUpdateProfile) {
        await onUpdateProfile(profile.id, {
          avatar: finalPhotoUrl,
          fullBodyPhoto: finalPhotoUrl,
          scenarioId: draftScenarioId,
          coverScenario: draftScenarioId,
          photoTransform: {
            zoom: draftZoom,
            x: draftOffsetX,
            y: draftOffsetY,
            rotate: draftRotate,
            silhouette: draftSilhouetteMode,
          },
        });
      }

      triggerHaptic('success');
      if (onNotify) onNotify('Foto y fondo guardados en tu perfil.', 'success');
      setIsPhotoStudioOpen(false);
    } catch (err) {
      console.error('[TOTAL TENIS] Error guardando foto de perfil:', err);
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos subir la foto ahora. Revisa tu señal e intenta de nuevo.', 'warning');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  /* ------------------------------------------------------------------------
     AJUSTES TÁCTILES (SOLO PERFIL PROPIO)
     ------------------------------------------------------------------------ */
  const openTactileSettings = () => {
    if (!isOwnProfile) return;
    triggerHaptic('light');
    setDraftHand(profile.hand || 'Diestro');
    setDraftStrokes(
      Array.isArray(profile.bestStrokes) && profile.bestStrokes.length > 0
        ? profile.bestStrokes
        : [profile.bestStroke || 'Derecha (Forehand)']
    );
    setDraftDays(
      Array.isArray(profile.availabilityDays) && profile.availabilityDays.length > 0
        ? profile.availabilityDays
        : ['M', 'J', 'S']
    );
    setDraftTimes(
      Array.isArray(profile.availabilityTimes) && profile.availabilityTimes.length > 0
        ? profile.availabilityTimes
        : ['noche']
    );
    setDraftClubId(profile.clubId || 'independiente');
    setDraftHideWhatsapp(Boolean(profile.hideWhatsapp));
    setIsSettingsOpen(true);
  };

  const toggleDraftStroke = (stroke) => {
    triggerHaptic('light');
    setDraftStrokes((prev) => {
      if (prev.includes(stroke)) {
        return prev.length > 1 ? prev.filter((s) => s !== stroke) : prev;
      }
      if (prev.length >= 2) return [prev[1], stroke];
      return [...prev, stroke];
    });
  };

  const toggleDraftDay = (dayId) => {
    triggerHaptic('light');
    setDraftDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const toggleDraftTime = (tId) => {
    triggerHaptic('light');
    setDraftTimes((prev) => {
      if (prev.includes(tId)) {
        return prev.length > 1 ? prev.filter((t) => t !== tId) : prev;
      }
      return [...prev, tId];
    });
  };

  const handleSaveTactileSettings = (e) => {
    e.preventDefault();
    if (!isOwnProfile || !onUpdateProfile) {
      setIsSettingsOpen(false);
      return;
    }
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
    });
    triggerHaptic('success');
    if (onNotify) onNotify('Tus preferencias deportivas fueron guardadas.', 'success');
    setIsSettingsOpen(false);
  };

  const photoT = profile.photoTransform || { zoom: 1, x: 0, y: 0, rotate: 0, silhouette: false };
  const playerPhotoSrc = profile.fullBodyPhoto || profile.avatar;

  return (
    <section
      className={`tt-perfil-view ${theme === 'light' ? 'is-light' : 'is-dark'}`}
      aria-label={`Perfil oficial de ${profile.name}`}
    >
      {/* ====================================================================
          1. PORTADA HEROICA EDITORIAL (LIQUID GLASS + LOGROS SUTILES POR MÉRITO)
          ==================================================================== */}
      <header className="tt-pf-hero">
        <SmartImage
          src={scenarioBgImg}
          fallbackSrc={ASSETS.bienvenidaOscuro}
          alt=""
          priority
          className="tt-pf-hero-bg"
        />
        <div className="tt-pf-hero-scrim" />
        <div className="tt-pf-court-line" aria-hidden="true" />

        {officialRank && (
          <span className="tt-pf-rank-watermark" aria-hidden="true">
            #{officialRank}
          </span>
        )}

        <div className="tt-pf-top-bar">
          <div className="tt-pf-status-row">
            {isCalibrating ? (
              <span className="tt-pf-pill is-calib">
                Prueba {calibPlayed}/{ELO_CONFIG.CALIBRATION_MATCHES}
              </span>
            ) : officialRank && officialRank <= 8 ? (
              <span className="tt-pf-pill is-master">ZONA MASTER TOP 8</span>
            ) : profile.isVip ? (
              <span className="tt-pf-pill is-vip">SOCIO VIP</span>
            ) : (
              <span className="tt-pf-pill is-cat">{category.name}</span>
            )}
          </div>

          <div className="tt-pf-top-actions">
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  className="tt-pf-circle-btn"
                  aria-label="Cambiar foto y fondos de perfil"
                  title="Foto y Fondos"
                  onClick={openPhotoStudio}
                >
                  <TTIcon name="camera" size={17} />
                </button>
                <button
                  type="button"
                  className="tt-pf-circle-btn"
                  aria-label="Ajustes de perfil"
                  title="Ajustes"
                  onClick={openTactileSettings}
                >
                  <TTIcon name="settings" size={17} />
                </button>
              </>
            )}

            {!isOwnProfile && onOpenHeadToHead && (
              <button
                type="button"
                className="tt-pf-circle-btn is-emerald"
                aria-label="Comparar Cara a Cara"
                title="Cara a Cara (H2H)"
                onClick={() => {
                  triggerHaptic('light');
                  onOpenHeadToHead(profile);
                }}
              >
                <TTIcon name="swap" size={17} />
              </button>
            )}
          </div>
        </div>

        <div className="tt-pf-hero-main">
          <div className="tt-pf-identity">
            <h1 className="tt-pf-name-stack">
              <span className="tt-pf-firstname">{firstName}</span>
              {lastName && <span className="tt-pf-lastname">{lastName}</span>}
            </h1>

            <div className="tt-pf-meta-line">
              {club?.logo ? (
                <SmartImage
                  src={club.logo}
                  alt={club.shortName}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(250, 249, 245, 0.5)',
                  }}
                />
              ) : null}
              <span>{club ? club.shortName : 'Independiente'}</span>
              {profile.age ? (
                <>
                  <span>·</span>
                  <span>{profile.age} años</span>
                </>
              ) : null}
              <span>·</span>
              <span>{profile.hand || 'Diestro'}</span>
            </div>

            {/* Logros ganados por mérito en cancha: sutiles, sin fondo blanco ni stickers IA */}
            {earnedMerits.length > 0 && (
              <div className="tt-pf-merits-row" aria-label="Logros deportivos obtenidos">
                {earnedMerits.map((m) => (
                  <span key={m.id} className={`tt-merit-pill is-${m.tone}`}>
                    <TTIcon name={m.icon} size={12} />
                    <span>{m.label}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Conmutador real Temporada 2026 | Carrera + Carnet (solo propio) / Retar (ajeno) */}
            <div className="tt-pf-scope-row">
              <div className="tt-pf-scope-toggle" role="tablist" aria-label="Alcance de estadísticas">
                <span
                  className="tt-pf-scope-slider"
                  aria-hidden="true"
                  style={{
                    transform: `translateX(${statsScope === 'temporada' ? '0%' : '100%'})`,
                  }}
                />
                <button
                  type="button"
                  role="tab"
                  aria-selected={statsScope === 'temporada'}
                  className={statsScope === 'temporada' ? 'is-active' : ''}
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
                  className={statsScope === 'carrera' ? 'is-active' : ''}
                  onClick={() => {
                    triggerHaptic('light');
                    setStatsScope('carrera');
                  }}
                >
                  Carrera
                </button>
              </div>

              {isOwnProfile ? (
                <button
                  type="button"
                  className="tt-pf-pass-mini"
                  onClick={openUnifiedVipModal}
                >
                  <TTIcon name="crown" size={14} />
                  Carnet 3D
                </button>
              ) : (
                onQuickChallenge && (
                  <button
                    type="button"
                    className="tt-pf-pass-mini is-reto"
                    onClick={() => {
                      triggerHaptic('medium');
                      onQuickChallenge(profile);
                    }}
                  >
                    <TTIcon name="challenge" size={14} />
                    Retar
                  </button>
                )
              )}
            </div>
          </div>

          <div
            className={`tt-pf-portrait-stage ${photoT.silhouette ? 'is-silhouette' : ''} ${
              isOwnProfile ? 'is-editable' : ''
            }`}
            onClick={() => {
              if (isOwnProfile) openPhotoStudio();
            }}
          >
            <SmartImage
              src={playerPhotoSrc}
              alt={profile.name}
              initials={profile.name}
              priority
              className="tt-pf-portrait-img"
              style={{
                transform: `translate(${photoT.x}%, ${photoT.y}%) scale(${photoT.zoom}) rotate(${photoT.rotate}deg)`,
              }}
            />
          </div>
        </div>

        {/* 4 TARJETAS GLASSMORPHISM DINÁMICAS (CAMBIAN REALMENTE ENTRE TEMPORADA Y CARRERA) */}
        {statsScope === 'temporada' ? (
          <div key="scope-temp" className="tt-pf-glass-grid">
            <div className="tt-pf-glass-card" style={{ '--pf-delay': '0ms' }}>
              <span>PUESTO</span>
              <strong>{officialRank ? `#${officialRank}` : 'Nuevo'}</strong>
              <small>{category.name}</small>
            </div>

            <div className="tt-pf-glass-card is-emerald" style={{ '--pf-delay': '45ms' }}>
              <span>PUNTOS</span>
              <strong>{Number(profile.points || 0).toLocaleString('es-PE')}</strong>
              <small>Temporada {new Date().getFullYear()}</small>
            </div>

            <div className="tt-pf-glass-card" style={{ '--pf-delay': '90ms' }}>
              {played > 0 ? (
                <>
                  <span>VICTORIAS</span>
                  <strong>{eff}%</strong>
                  <small>
                    {wins}V – {losses}D
                  </small>
                </>
              ) : (
                <>
                  <span>GOLPE FIRMA</span>
                  <strong style={{ fontSize: '0.96rem', lineHeight: 1.1 }}>
                    {(profile.bestStroke || 'Derecha').split(' ')[0]}
                  </strong>
                  <small>{isCalibrating ? 'En prueba' : 'Listo en cancha'}</small>
                </>
              )}
            </div>

            <div className="tt-pf-glass-card is-gold" style={{ '--pf-delay': '135ms' }}>
              {wins > 0 && streak >= 1 ? (
                <>
                  <span>RACHA ACTIVA</span>
                  <strong>+{streak}</strong>
                  <small>{streak >= 3 ? 'En racha' : 'Seguidas'}</small>
                </>
              ) : isOwnProfile ? (
                <>
                  <span>GEMAS 💎</span>
                  <strong>{Number(profile.gems || 0).toLocaleString('es-PE')}</strong>
                  <small>Pro Shop y Fondos</small>
                </>
              ) : (
                <>
                  <span>PARTIDOS</span>
                  <strong>{played}</strong>
                  <small>Oficiales</small>
                </>
              )}
            </div>
          </div>
        ) : (
          <div key="scope-career" className="tt-pf-glass-grid">
            <div className="tt-pf-glass-card is-gold" style={{ '--pf-delay': '0ms' }}>
              <span>PTS AÑO</span>
              <strong>{careerMetrics.annualTotal.toLocaleString('es-PE')}</strong>
              <small>Carrera Top 8</small>
            </div>

            <div className="tt-pf-glass-card is-emerald" style={{ '--pf-delay': '45ms' }}>
              <span>MEJOR PICO</span>
              <strong>{careerMetrics.peakPoints.toLocaleString('es-PE')}</strong>
              <small>Máx. puntaje</small>
            </div>

            <div className="tt-pf-glass-card" style={{ '--pf-delay': '90ms' }}>
              <span>RÉCORD TOTAL</span>
              <strong>
                {wins}V–{losses}D
              </strong>
              <small>{eff}% efectividad</small>
            </div>

            <div className="tt-pf-glass-card" style={{ '--pf-delay': '135ms' }}>
              <span>TRAYECTORIA</span>
              <strong>{played} PJ</strong>
              <small>
                {careerMetrics.seasonsPlayed}{' '}
                {careerMetrics.seasonsPlayed === 1 ? 'temporada' : 'temporadas'}
              </small>
            </div>
          </div>
        )}
      </header>

      {/* ====================================================================
          2. PARTIDOS DE PRUEBA (OCULTA AL 5/5) + TERMÓMETRO CON PELOTA 3D
          ==================================================================== */}
      <div className="tt-pf-progress-stack">
        {isCalibrating && (
          <div className="tt-calib-card">
            <div className="tt-calib-head">
              <strong>
                Partidos de prueba: {calibPlayed} de {ELO_CONFIG.CALIBRATION_MATCHES}
              </strong>
              <span>Faltan {ELO_CONFIG.CALIBRATION_MATCHES - calibPlayed}</span>
            </div>
            <div className="tt-calib-steps">
              {Array.from({ length: ELO_CONFIG.CALIBRATION_MATCHES }).map((_, idx) => (
                <span
                  key={idx}
                  className={`tt-calib-seg ${idx < calibPlayed ? 'is-filled' : ''}`}
                />
              ))}
            </div>
            <p className="tt-calib-hint">
              Cada game y cada tie-break cuentan para ubicar tu categoría real en el circuito.
            </p>
          </div>
        )}

        <div className="tt-thermo-card">
          <div className="tt-thermo-head">
            <div>
              <span className="tt-thermo-kicker">
                {levelProgress.isMatchPointAscenso
                  ? 'MATCH POINT DE ASCENSO'
                  : nextCategory
                  ? `CAMINO A ${nextCategory.name.toUpperCase()}`
                  : 'CATEGORÍA MÁXIMA ALCANZADA'}
              </span>
              <strong>
                {nextCategory
                  ? `Faltan ${levelProgress.remaining.toLocaleString('es-PE')} pts para ${nextCategory.name}`
                  : 'Élite del Circuito TOTAL TENIS'}
              </strong>
            </div>
            <span className="tt-thermo-pct">{levelProgress.pct}%</span>
          </div>

          <div className="tt-thermo-track-wrap">
            <div className="tt-thermo-track">
              <div className="tt-thermo-fill" style={{ width: `${levelProgress.pct}%` }} />
            </div>
            <div
              className="tt-thermo-ball-pin"
              style={{ left: `calc(${levelProgress.pct}% - 15px)` }}
              aria-hidden="true"
            >
              <SmartImage
                src="/assets/pelota-3d-volt-azul.png"
                fallbackSrc={ASSETS.logo}
                alt=""
                style={{ width: 30, height: 30, objectFit: 'contain' }}
              />
            </div>
          </div>

          <div className="tt-thermo-scale">
            <span>
              {category.name} ({category.min.toLocaleString('es-PE')})
            </span>
            {nextCategory && (
              <span>
                {nextCategory.name} ({nextCategory.min.toLocaleString('es-PE')})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. ADN DEPORTIVO + ACCESO RÁPIDO A FONDOS (SOLO DUEÑO)
          ==================================================================== */}
      <div className="tt-dna-grid">
        <div className="tt-dna-card">
          <div className="tt-dna-card-head">
            <IconBadge name="challenge" variant="emerald" size={34} />
            <div>
              <span>ESTILO DE JUEGO</span>
              <strong>{profile.hand || 'Diestro'}</strong>
            </div>
          </div>
          <div className="tt-dna-pills">
            {(Array.isArray(profile.bestStrokes) && profile.bestStrokes.length > 0
              ? profile.bestStrokes
              : [profile.bestStroke || 'Derecha (Forehand)']
            ).map((st) => (
              <span key={st} className="tt-dna-chip">
                {st}
              </span>
            ))}
          </div>
        </div>

        <div className="tt-dna-card">
          <div className="tt-dna-card-head">
            <IconBadge name="clock" variant="gold" size={34} />
            <div>
              <span>DISPONIBILIDAD</span>
              <strong>
                {(profile.availabilityTimes || ['noche'])
                  .map((t) => (t === 'manana' ? 'Mañana' : t === 'tarde' ? 'Tarde' : 'Noche'))
                  .join(' · ')}
              </strong>
            </div>
          </div>
          <div className="tt-dna-days-row">
            {WEEK_DAYS.map((d) => {
              const active = (profile.availabilityDays || ['M', 'J', 'S']).includes(d.id);
              return (
                <span key={d.id} className={`tt-dna-day ${active ? 'is-on' : ''}`}>
                  {d.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Acceso compacto para personalizar Fondos de Perfil con Gemas (solo dueño) */}
      {isOwnProfile && (
        <button
          type="button"
          className="tt-pf-backgrounds-bar"
          onClick={openPhotoStudio}
        >
          <div className="tt-pfb-thumb">
            <SmartImage
              src={scenarioBgImg}
              alt={activeScenario.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <span className="tt-pf-sec-kicker">PERSONALIZACIÓN · CANJE CON GEMAS</span>
            <strong style={{ display: 'block', fontSize: '0.88rem' }}>
              Fondo activo: {activeScenario.name}
            </strong>
            <small className="tt-muted" style={{ fontSize: '0.72rem' }}>
              Cambia tu foto o desbloquea escenarios Grand Slam
            </small>
          </div>
          <TTIcon name="chevronRight" size={18} style={{ opacity: 0.6, flexShrink: 0 }} />
        </button>
      )}

      {/* ====================================================================
          4. CARNET DIGITAL UNIFICADO (EXCLUSIVO DEL DUEÑO DEL PERFIL)
          ==================================================================== */}
      {isOwnProfile && (
        <div className="tt-pf-section-card">
          <div className="tt-pf-sec-head">
            <div>
              <span className="tt-pf-sec-kicker">CREDENCIAL OFICIAL DEL CIRCUITO</span>
              <h3>{profile.isVip ? 'Carnet Digital Socio VIP' : 'Pase Digital 3D y Ahorro VIP'}</h3>
            </div>
            <button type="button" className="tt-pf-sec-action is-gold" onClick={openUnifiedVipModal}>
              Abrir Carnet 3D ↻
            </button>
          </div>

          <div
            role="button"
            tabIndex={0}
            className={`tt-wallet-card ${profile.isVip ? 'is-vip-gold' : 'is-std'}`}
            onClick={openUnifiedVipModal}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openUnifiedVipModal();
              }
            }}
          >
            <span className="tt-wc-foil-sheen" aria-hidden="true" />
            <div className="tt-wc-court-lines" aria-hidden="true" />
            <div className="tt-wc-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SmartImage
                  src={ASSETS.logo}
                  alt="TOTAL TENIS"
                  style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}
                />
                <span className="tt-wc-brand">TOTAL TENIS</span>
              </div>
              <span className={`tt-wc-tier ${profile.isVip ? 'is-vip' : ''}`}>
                {profile.isVip ? 'SOCIO VIP' : 'ESTÁNDAR'}
              </span>
            </div>

            <div className="tt-wc-mid">
              <SmartImage
                src={profile.avatar}
                alt={profile.name}
                initials={profile.name}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  border: profile.isVip
                    ? '2px solid #E5C16C'
                    : '1.5px solid rgba(250, 249, 245, 0.35)',
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong className="tt-wc-holder">{profile.name.toUpperCase()}</strong>
                <span className="tt-wc-code">
                  {profile.credentialId || 'TT-2026-0041'} · {category.name}
                </span>
              </div>
            </div>

            <div className="tt-wc-bottom">
              <div>
                <small>TOCA PARA VER EN 3D Y QR</small>
                <strong>{new Date().getFullYear()} · ACTIVO</strong>
              </div>
              <div className="tt-wc-qr-box" aria-label="Código QR de verificación">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="2" y="2" width="10" height="10" rx="2" stroke="#1E0734" strokeWidth="2.4" />
                  <rect x="5" y="5" width="4" height="4" fill="#1E0734" />
                  <rect x="24" y="2" width="10" height="10" rx="2" stroke="#1E0734" strokeWidth="2.4" />
                  <rect x="27" y="5" width="4" height="4" fill="#1E0734" />
                  <rect x="2" y="24" width="10" height="10" rx="2" stroke="#1E0734" strokeWidth="2.4" />
                  <rect x="5" y="27" width="4" height="4" fill="#1E0734" />
                  <path
                    d="M16 4H20V8H16V4ZM16 14H22V18H16V14ZM26 16H34V20H26V16ZM16 24H20V34H16V24ZM24 24H30V30H24V24ZM30 30H34V34H30V30Z"
                    fill="#1E0734"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. ÚLTIMOS RESULTADOS
          ==================================================================== */}
      <div className="tt-pf-section-card">
        <div className="tt-pf-sec-head">
          <div>
            <span className="tt-pf-sec-kicker">HISTORIAL RECIENTE EN CANCHA</span>
            <h3>Últimos Resultados</h3>
          </div>
        </div>

        {recentMatches.length === 0 ? (
          <p className="tt-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
            Todavía no hay resultados oficiales registrados.
          </p>
        ) : (
          <div className="tt-recent-list">
            {recentMatches.map(({ challenge, isA, rival, didWin, delta }) => {
              const s1A = challenge.liveScore?.set1?.a ?? 0;
              const s1B = challenge.liveScore?.set1?.b ?? 0;
              const s2A = challenge.liveScore?.set2?.a ?? 0;
              const s2B = challenge.liveScore?.set2?.b ?? 0;

              return (
                <article key={challenge.id} className="tt-recent-card">
                  <div className="tt-rc-top">
                    <span>{challenge.clubName}</span>
                    <span className={didWin ? 'is-win' : 'is-loss'}>
                      {didWin ? 'VICTORIA' : 'DERROTA'}
                      {typeof delta === 'number' && delta !== 0
                        ? ` (${delta > 0 ? `+${delta}` : delta} pts)`
                        : ''}
                    </span>
                  </div>

                  <div className={`tt-rc-row ${didWin ? 'is-winner' : ''}`}>
                    <strong>{profile.name}</strong>
                    <div className="tt-rc-sets">
                      <span>{isA ? s1A : s1B}</span>
                      <span>{isA ? s2A : s2B}</span>
                      {didWin && <em className="tt-rc-arrow">◀</em>}
                    </div>
                  </div>

                  <div className={`tt-rc-row ${!didWin ? 'is-winner' : ''}`}>
                    <strong>{rival?.name || 'Rival del circuito'}</strong>
                    <div className="tt-rc-sets">
                      <span>{isA ? s1B : s1A}</span>
                      <span>{isA ? s2B : s2A}</span>
                      {!didWin && <em className="tt-rc-arrow">◀</em>}
                    </div>
                  </div>

                  {isOwnProfile && onOpenStoriesWithMatch && (
                    <div className="tt-rc-foot">
                      <span>{challenge.scoreSummary || 'Resultado confirmado'}</span>
                      <button
                        type="button"
                        className="tt-rc-story-btn"
                        onClick={() => {
                          triggerHaptic('light');
                          onOpenStoriesWithMatch({
                            challenge,
                            playerA: isA ? profile : rival,
                            playerB: isA ? rival : profile,
                          });
                        }}
                      >
                        Publicar en Stories
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL 1 (SOLO DUEÑO): ESTUDIO DE FOTO + FONDOS DE PERFIL
          ==================================================================== */}
      {isOwnProfile && (
        <ModalPortal
          isOpen={isPhotoStudioOpen}
          onClose={() => !isSavingPhoto && setIsPhotoStudioOpen(false)}
          title="Foto y Fondos de Perfil"
          subtitle="Ajusta tu retrato o desbloquea escenarios Grand Slam con Gemas"
          icon={<IconBadge name="camera" variant="emerald" size={38} />}
          isWide
        >
          <div className="tt-studio-stack">
            <div className="tt-studio-preview">
              <SmartImage
                src={
                  (PROFILE_SCENARIOS.find((s) => s.id === draftScenarioId) || PROFILE_SCENARIOS[0])
                    .imageDark
                }
                alt="Escenario seleccionado"
                className="tt-studio-bg"
              />
              <div className="tt-studio-scrim" />
              <div className={`tt-studio-subject ${draftSilhouetteMode ? 'is-silhouette' : ''}`}>
                <SmartImage
                  src={draftPhoto || profile.avatar}
                  alt={profile.name}
                  initials={profile.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    transform: `translate(${draftOffsetX}%, ${draftOffsetY}%) scale(${draftZoom}) rotate(${draftRotate}deg)`,
                  }}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFilePicked}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="tt-studio-upload-btn"
                disabled={isSavingPhoto}
                onClick={() => fileInputRef.current?.click()}
              >
                <TTIcon name="camera" size={16} />
                Subir foto desde mi celular
              </button>
            </div>

            <div className="tt-studio-sliders">
              <label>
                <span>Zoom ({draftZoom.toFixed(2)}x)</span>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={draftZoom}
                  onChange={(e) => setDraftZoom(Number(e.target.value))}
                />
              </label>
              <label>
                <span>Desplazamiento Vertical ({draftOffsetY}%)</span>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  step="1"
                  value={draftOffsetY}
                  onChange={(e) => setDraftOffsetY(Number(e.target.value))}
                />
              </label>
              <label>
                <span>Desplazamiento Horizontal ({draftOffsetX}%)</span>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  step="1"
                  value={draftOffsetX}
                  onChange={(e) => setDraftOffsetX(Number(e.target.value))}
                />
              </label>
              <label>
                <span>Rotación ({draftRotate}°)</span>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={draftRotate}
                  onChange={(e) => setDraftRotate(Number(e.target.value))}
                />
              </label>

              <button
                type="button"
                className={`tt-silhouette-toggle ${draftSilhouetteMode ? 'is-on' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setDraftSilhouetteMode((v) => !v);
                }}
              >
                {draftSilhouetteMode
                  ? '✓ Efecto Silueta Editorial Activo'
                  : 'Activar Recorte / Silueta Editorial'}
              </button>
            </div>

            <div>
              <span className="tt-pf-sec-kicker" style={{ marginBottom: 8 }}>
                FONDOS DE PERFIL DISPONIBLES (TU SALDO: {Number(profile.gems || 0).toLocaleString('es-PE')} 💎)
              </span>
              <div className="tt-scenarios-grid">
                {PROFILE_SCENARIOS.map((sc) => {
                  const owned = ownedScenarios.includes(sc.id);
                  const selected = draftScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      className={`tt-scenario-tile ${selected ? 'is-selected' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setDraftScenarioId(sc.id);
                      }}
                    >
                      <SmartImage src={sc.imageDark} alt={sc.name} className="tt-scenario-img" />
                      <div className="tt-scenario-caption">
                        <strong>{sc.name}</strong>
                        <span>{owned ? 'Disponible' : `Canjear · ${sc.gemsCost} 💎`}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="tt-btn tt-btn-primary"
              style={{ width: '100%' }}
              disabled={isSavingPhoto}
              onClick={handleSavePhotoStudio}
            >
              {isSavingPhoto ? 'Subiendo foto en la nube...' : 'Guardar Foto y Fondo'}
            </button>
          </div>
        </ModalPortal>
      )}

      {/* ====================================================================
          MODAL 2 (SOLO DUEÑO): AJUSTES 100 % TÁCTILES
          ==================================================================== */}
      {isOwnProfile && (
        <ModalPortal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title="Ajustes Deportivos y Privacidad"
          subtitle="Personaliza tu ficha en segundos"
          icon={<IconBadge name="settings" variant="purple" size={38} />}
        >
          <form onSubmit={handleSaveTactileSettings} className="tt-settings-stack">
            <div className="tt-set-block">
              <label>Mano Hábil</label>
              <div className="tt-set-pair">
                {['Diestro', 'Zurdo'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`tt-tactile-pill ${draftHand === h ? 'is-on' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setDraftHand(h);
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="tt-set-block">
              <label>Mejor Golpe / Arma Principal (Máx. 2)</label>
              <div className="tt-set-pills-wrap">
                {STROKE_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`tt-tactile-pill ${draftStrokes.includes(st) ? 'is-on' : ''}`}
                    onClick={() => toggleDraftStroke(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="tt-set-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Días Disponibles</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button
                    type="button"
                    className="tt-preset-mini"
                    onClick={() => setDraftDays(['L', 'M', 'X', 'J', 'V'])}
                  >
                    Lun–Vie
                  </button>
                  <button
                    type="button"
                    className="tt-preset-mini"
                    onClick={() => setDraftDays(['S', 'D'])}
                  >
                    Fin de Sem.
                  </button>
                  <button
                    type="button"
                    className="tt-preset-mini"
                    onClick={() => setDraftDays(['L', 'M', 'X', 'J', 'V', 'S', 'D'])}
                  >
                    Todos
                  </button>
                </div>
              </div>

              <div className="tt-days-circle-row">
                {WEEK_DAYS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`tt-day-circle-btn ${draftDays.includes(d.id) ? 'is-on' : ''}`}
                    onClick={() => toggleDraftDay(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="tt-times-stack">
                {TIME_WINDOWS.map((tw) => (
                  <button
                    key={tw.id}
                    type="button"
                    className={`tt-tactile-pill ${draftTimes.includes(tw.id) ? 'is-on' : ''}`}
                    onClick={() => toggleDraftTime(tw.id)}
                  >
                    {tw.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="tt-set-block">
              <label htmlFor="tt-set-club">Club o Sede Representada</label>
              <select
                id="tt-set-club"
                className="tt-set-select"
                value={draftClubId}
                onChange={(e) => setDraftClubId(e.target.value)}
              >
                <option value="independiente">Jugador Independiente</option>
                {(clubs || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="tt-privacy-row">
              <div>
                <strong>Ocultar WhatsApp al público</strong>
                <small>Solo se mostrará cuando aceptes un partido oficial.</small>
              </div>
              <button
                type="button"
                className={`tt-privacy-toggle ${draftHideWhatsapp ? 'is-on' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setDraftHideWhatsapp((v) => !v);
                }}
              >
                {draftHideWhatsapp ? 'Privado' : 'Visible'}
              </button>
            </div>

            <button type="submit" className="tt-btn tt-btn-primary" style={{ width: '100%' }}>
              Guardar Ajustes
            </button>
          </form>
        </ModalPortal>
      )}

      <style>{`
        .tt-perfil-view {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* 1. PORTADA HEROICA EDITORIAL LIQUID GLASS */
        .tt-pf-hero {
          position: relative;
          border-radius: 26px;
          overflow: hidden;
          padding: 16px;
          background: #1A0530;
          color: #FAF9F5;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 18px 42px rgba(8, 1, 18, 0.42);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-pf-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .tt-pf-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(22, 4, 40, 0.52) 0%,
            rgba(20, 4, 36, 0.66) 54%,
            rgba(14, 2, 26, 0.96) 100%
          );
        }
        .tt-pf-court-line {
          position: absolute;
          left: 0;
          right: 0;
          top: 52%;
          height: 1px;
          background: rgba(250, 249, 245, 0.14);
          pointer-events: none;
          z-index: 1;
        }
        .tt-pf-rank-watermark {
          position: absolute;
          right: 12px;
          top: 34px;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 6.2rem;
          line-height: 0.8;
          color: rgba(250, 249, 245, 0.06);
          pointer-events: none;
          z-index: 1;
        }
        .tt-pf-top-bar { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tt-pf-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 11px;
          border-radius: 999px;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .tt-pf-pill.is-master { background: #00DC7D; color: #10021E; }
        .tt-pf-pill.is-vip { background: linear-gradient(135deg, #F5E1A4 0%, #CCA046 100%); color: #1A1102; }
        .tt-pf-pill.is-calib { background: rgba(56, 189, 248, 0.24); border: 1px solid rgba(56, 189, 248, 0.55); color: #BAE6FD; }
        .tt-pf-pill.is-cat { background: rgba(250, 249, 245, 0.16); border: 1px solid rgba(250, 249, 245, 0.26); color: #FAF9F5; }
        .tt-pf-top-actions { display: flex; gap: 7px; }
        .tt-pf-circle-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(18, 3, 33, 0.56);
          border: 1px solid rgba(250, 249, 245, 0.24);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
          color: #FAF9F5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: transform 170ms cubic-bezier(0.22, 1.4, 0.36, 1);
        }
        .tt-pf-circle-btn:active { transform: scale(0.88); }
        .tt-pf-circle-btn.is-emerald { background: #00DC7D; border-color: #00DC7D; color: #10021E; }

        .tt-pf-hero-main { position: relative; z-index: 2; display: grid; grid-template-columns: 1.2fr 0.85fr; align-items: end; gap: 10px; }
        .tt-pf-identity { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
        .tt-pf-name-stack { margin: 0; font-family: var(--tt-font-display); font-weight: 900; text-transform: uppercase; line-height: 0.92; display: flex; flex-direction: column; }
        .tt-pf-firstname { font-size: clamp(1.5rem, 6.2vw, 2.25rem); color: #FAF9F5; }
        .tt-pf-lastname { font-size: clamp(1.65rem, 6.8vw, 2.5rem); color: #00DC7D; text-shadow: 0 4px 18px rgba(0, 220, 125, 0.32); }
        .tt-pf-meta-line { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 0.76rem; font-weight: 700; color: rgba(250, 249, 245, 0.88); }

        /* Logros sutiles ganados por mérito (cero fondo blanco, cero aire videojuego) */
        .tt-pf-merits-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
        .tt-merit-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .tt-merit-pill.is-emerald {
          background: rgba(0, 220, 125, 0.16);
          border: 1px solid rgba(0, 220, 125, 0.44);
          color: #86F7C3;
        }
        .tt-merit-pill.is-gold {
          background: rgba(229, 193, 108, 0.16);
          border: 1px solid rgba(229, 193, 108, 0.48);
          color: #F3DC9B;
        }

        /* Conmutador Temporada 2026 | Carrera con slider elástico Liquid Glass */
        .tt-pf-scope-row { margin-top: 4px; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .tt-pf-scope-toggle {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 3px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.12);
          border: 1px solid rgba(250, 249, 245, 0.2);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .tt-pf-scope-slider {
          position: absolute;
          top: 3px;
          bottom: 3px;
          left: 3px;
          width: calc((100% - 6px) / 2);
          border-radius: 999px;
          background: #FAF9F5;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
          transition: transform 280ms cubic-bezier(0.22, 1.24, 0.36, 1);
          pointer-events: none;
          z-index: 0;
        }
        .tt-pf-scope-toggle button {
          position: relative;
          z-index: 1;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 800;
          color: rgba(250, 249, 245, 0.8);
          white-space: nowrap;
          transition: color 200ms ease;
        }
        .tt-pf-scope-toggle button.is-active { color: #1E0734; font-weight: 900; }

        .tt-pf-pass-mini {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(229, 193, 108, 0.18);
          border: 1px solid rgba(229, 193, 108, 0.56);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #F3DC9B;
          font-size: 0.68rem;
          font-weight: 900;
          transition: transform 170ms cubic-bezier(0.22, 1.38, 0.36, 1);
        }
        .tt-pf-pass-mini:active { transform: scale(0.92); }
        .tt-pf-pass-mini.is-reto {
          background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%);
          border-color: transparent;
          color: #10021E;
        }

        .tt-pf-portrait-stage {
          width: 100%;
          aspect-ratio: 3 / 4;
          max-height: 215px;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid rgba(0, 220, 125, 0.46);
          background: rgba(20, 4, 36, 0.5);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.45);
        }
        .tt-pf-portrait-stage.is-editable { cursor: pointer; }
        .tt-pf-portrait-stage.is-silhouette {
          border-color: transparent;
          background: transparent;
          box-shadow: none;
          mask-image: linear-gradient(180deg, #000 72%, transparent 100%);
          -webkit-mask-image: linear-gradient(180deg, #000 72%, transparent 100%);
        }
        .tt-pf-portrait-img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }

        /* 2. LAS 4 TARJETAS GLASSMORPHISM (ANIMADAS AL CAMBIAR TEMPORADA / CARRERA) */
        .tt-pf-glass-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        @media (min-width: 620px) {
          .tt-pf-glass-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        .tt-pf-glass-card {
          padding: 11px 10px;
          border-radius: 16px;
          background: rgba(250, 249, 245, 0.1);
          border: 1px solid rgba(250, 249, 245, 0.18);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(16px) saturate(140%);
          -webkit-backdrop-filter: blur(16px) saturate(140%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 82px;
          gap: 2px;
          animation: ttGlassPop 360ms cubic-bezier(0.22, 1.18, 0.36, 1) both;
          animation-delay: var(--pf-delay, 0ms);
        }
        @keyframes ttGlassPop {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tt-pf-glass-card span { font-size: 0.59rem; font-weight: 800; letter-spacing: 0.08em; opacity: 0.76; }
        .tt-pf-glass-card strong { font-family: var(--tt-font-display); font-size: 1.46rem; font-weight: 900; line-height: 1; color: #FAF9F5; }
        .tt-pf-glass-card.is-emerald strong { color: #00DC7D; }
        .tt-pf-glass-card.is-gold strong { color: #F3DC9B; }
        .tt-pf-glass-card small { font-size: 0.65rem; opacity: 0.78; }

        /* 3. PARTIDOS DE PRUEBA Y TERMÓMETRO 3D */
        .tt-pf-progress-stack { display: flex; flex-direction: column; gap: 10px; }
        .tt-calib-card,
        .tt-thermo-card {
          border-radius: 20px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-calib-head { display: flex; justify-content: space-between; font-size: 0.82rem; }
        .tt-calib-head span { color: #38BDF8; font-weight: 800; }
        .tt-calib-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .tt-calib-seg { height: 8px; border-radius: 999px; background: var(--tt-surface-2); }
        .tt-calib-seg.is-filled { background: #38BDF8; }
        .tt-calib-hint { margin: 0; font-size: 0.74rem; color: var(--tt-text-muted); }

        .tt-thermo-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .tt-thermo-kicker { display: block; font-size: 0.63rem; font-weight: 900; letter-spacing: 0.09em; color: var(--tt-emerald-text); }
        .tt-thermo-head strong { font-size: 0.92rem; }
        .tt-thermo-pct { font-family: var(--tt-font-display); font-size: 1.3rem; font-weight: 900; }
        .tt-thermo-track-wrap { position: relative; padding: 10px 0; }
        .tt-thermo-track { height: 10px; border-radius: 999px; background: var(--tt-surface-2); overflow: hidden; }
        .tt-thermo-fill {
          height: 100%;
          border-radius: 999px;
          background: #FFFFFF;
          transition: width 520ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tt-perfil-view.is-light .tt-thermo-fill { background: #1E0734; }
        .tt-thermo-ball-pin {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          transition: left 520ms cubic-bezier(0.22, 1, 0.36, 1);
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
          animation: ttBallFloat 3s ease-in-out infinite;
        }
        @keyframes ttBallFloat {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-56%) scale(1.06); }
        }
        .tt-thermo-scale { display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; color: var(--tt-text-muted); }

        /* 4. ADN DEPORTIVO + BARRA DE FONDOS */
        .tt-dna-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 640px) {
          .tt-dna-grid { grid-template-columns: 1fr 1fr; }
        }
        .tt-dna-card {
          border-radius: 20px;
          padding: 14px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-dna-card-head { display: flex; align-items: center; gap: 10px; }
        .tt-dna-card-head span { display: block; font-size: 0.62rem; font-weight: 900; letter-spacing: 0.08em; color: var(--tt-text-muted); }
        .tt-dna-card-head strong { font-size: 0.9rem; }
        .tt-dna-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .tt-dna-chip { padding: 5px 10px; border-radius: 999px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); font-size: 0.74rem; font-weight: 800; }
        .tt-dna-days-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
        .tt-dna-day { height: 30px; border-radius: 10px; background: var(--tt-surface-2); color: var(--tt-text-muted); font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; }
        .tt-dna-day.is-on { background: #00DC7D; color: #10021E; }

        .tt-pf-backgrounds-bar {
          width: 100%;
          padding: 11px 13px;
          border-radius: 20px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), var(--tt-shadow-sm);
          color: var(--tt-text);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 170ms cubic-bezier(0.22, 1.38, 0.36, 1), border-color 200ms ease;
        }
        .tt-pf-backgrounds-bar:active { transform: scale(0.97); border-color: #00DC7D; }
        .tt-pfb-thumb {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          overflow: hidden;
          border: 1.5px solid rgba(0, 220, 125, 0.45);
          flex-shrink: 0;
        }

        /* 5. SECCIONES + CARNET DIGITAL */
        .tt-pf-section-card {
          border-radius: 22px;
          padding: 15px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), var(--tt-shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-pf-sec-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .tt-pf-sec-kicker { display: block; font-size: 0.62rem; font-weight: 900; letter-spacing: 0.09em; color: var(--tt-emerald-text); }
        .tt-pf-sec-head h3 { margin: 2px 0 0; font-family: var(--tt-font-display); font-size: 1.24rem; line-height: 1.05; }
        .tt-pf-sec-action {
          padding: 6px 11px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.72rem;
          font-weight: 800;
          white-space: nowrap;
          transition: transform 160ms cubic-bezier(0.22, 1.38, 0.36, 1);
        }
        .tt-pf-sec-action:active { transform: scale(0.94); }
        .tt-pf-sec-action.is-gold {
          background: rgba(229, 193, 108, 0.14);
          border-color: rgba(229, 193, 108, 0.44);
          color: #9A6B16;
        }
        .tt-perfil-view.is-dark .tt-pf-sec-action.is-gold { color: #F3DC9B; }

        .tt-wallet-card {
          position: relative;
          aspect-ratio: 1.58 / 1;
          max-width: 410px;
          width: 100%;
          margin: 0 auto;
          border-radius: 22px;
          padding: 16px 18px;
          background: linear-gradient(135deg, #1E0734 0%, #11031F 60%, #1F120A 100%);
          color: #FAF9F5;
          border: 1px solid rgba(250, 249, 245, 0.22);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 18px 36px rgba(6, 1, 14, 0.44);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          cursor: pointer;
          transition: transform 200ms cubic-bezier(0.22, 1.32, 0.36, 1);
        }
        .tt-wallet-card:active { transform: scale(0.97); }
        .tt-wallet-card.is-vip-gold {
          background: linear-gradient(135deg, #2B1A04 0%, #523308 32%, #1D0A2E 78%, #3B2305 100%);
          border-color: rgba(243, 220, 155, 0.68);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 18px 38px rgba(229, 193, 108, 0.22);
        }
        .tt-wc-foil-sheen {
          position: absolute;
          inset: -35%;
          background: linear-gradient(114deg, transparent 42%, rgba(255, 255, 255, 0.14) 50%, transparent 58%);
          transform: translateX(-110%);
          animation: ttWalletFoil 5.8s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes ttWalletFoil {
          0%, 66% { transform: translateX(-110%); }
          100% { transform: translateX(120%); }
        }
        .tt-wc-court-lines { position: absolute; inset: 14px; border: 1px solid rgba(250, 249, 245, 0.06); border-radius: 12px; pointer-events: none; }
        .tt-wc-top, .tt-wc-mid, .tt-wc-bottom { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .tt-wc-brand { font-family: var(--tt-font-display); font-style: italic; font-weight: 900; font-size: 1.1rem; letter-spacing: 0.06em; }
        .tt-wc-tier { padding: 4px 10px; border-radius: 999px; background: rgba(250, 249, 245, 0.14); font-size: 0.65rem; font-weight: 900; letter-spacing: 0.09em; }
        .tt-wc-tier.is-vip { background: linear-gradient(135deg, #F5E1A4 0%, #CCA046 100%); color: #1A1102; }
        .tt-wc-holder { display: block; font-size: 0.96rem; letter-spacing: 0.08em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-wc-code { display: block; margin-top: 2px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.72rem; color: #00DC7D; }
        .tt-wc-bottom small { display: block; font-size: 0.56rem; letter-spacing: 0.08em; color: #7CF5C0; font-weight: 800; }
        .tt-wc-bottom strong { font-size: 0.78rem; letter-spacing: 0.05em; }
        .tt-wc-qr-box { padding: 4px; border-radius: 10px; background: #FAF9F5; display: inline-flex; }

        /* 6. ÚLTIMOS RESULTADOS */
        .tt-recent-list { display: flex; flex-direction: column; gap: 9px; }
        .tt-recent-card { border-radius: 16px; padding: 12px; background: #1B0630; color: #FAF9F5; border: 1px solid rgba(250, 249, 245, 0.12); display: flex; flex-direction: column; gap: 6px; }
        .tt-rc-top { display: flex; justify-content: space-between; font-size: 0.68rem; font-weight: 800; opacity: 0.78; }
        .tt-rc-top .is-win { color: #00DC7D; opacity: 1; }
        .tt-rc-top .is-loss { color: #F87171; opacity: 1; }
        .tt-rc-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; }
        .tt-rc-row.is-winner strong { color: #00DC7D; }
        .tt-rc-sets { display: flex; align-items: center; gap: 8px; font-family: var(--tt-font-display); font-size: 1.05rem; }
        .tt-rc-arrow { font-style: normal; color: #00DC7D; font-size: 0.72rem; }
        .tt-rc-foot { margin-top: 2px; padding-top: 7px; border-top: 1px solid rgba(250, 249, 245, 0.1); display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: rgba(250, 249, 245, 0.74); }
        .tt-rc-story-btn { padding: 4px 10px; border-radius: 999px; background: rgba(0, 220, 125, 0.18); color: #00DC7D; font-weight: 800; font-size: 0.68rem; }

        /* 7. ESTUDIO DE FOTO & AJUSTES */
        .tt-studio-stack,
        .tt-settings-stack { display: flex; flex-direction: column; gap: 14px; }
        .tt-studio-preview { position: relative; height: 230px; border-radius: 20px; overflow: hidden; background: #140324; display: flex; align-items: center; justify-content: center; }
        .tt-studio-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .tt-studio-scrim { position: absolute; inset: 0; background: rgba(16, 3, 29, 0.35); }
        .tt-studio-subject { position: relative; z-index: 2; width: 148px; height: 188px; border-radius: 18px; overflow: hidden; border: 2px solid #00DC7D; }
        .tt-studio-subject.is-silhouette { border-color: transparent; mask-image: linear-gradient(180deg, #000 72%, transparent 100%); -webkit-mask-image: linear-gradient(180deg, #000 72%, transparent 100%); }
        .tt-studio-upload-btn { position: absolute; right: 10px; bottom: 10px; z-index: 3; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; background: #FAF9F5; color: #1E0734; font-size: 0.72rem; font-weight: 900; }
        .tt-studio-sliders { display: flex; flex-direction: column; gap: 9px; }
        .tt-studio-sliders label { display: flex; flex-direction: column; gap: 4px; font-size: 0.74rem; font-weight: 700; color: var(--tt-text-muted); }
        .tt-studio-sliders input[type='range'] { accent-color: #00DC7D; }
        .tt-silhouette-toggle { min-height: 40px; border-radius: 13px; background: var(--tt-surface-2); border: 1.5px solid var(--tt-border); color: var(--tt-text); font-size: 0.78rem; font-weight: 800; }
        .tt-silhouette-toggle.is-on { border-color: #00DC7D; background: rgba(0, 220, 125, 0.14); color: var(--tt-emerald-text); }
        .tt-scenarios-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .tt-scenario-tile { position: relative; border-radius: 14px; overflow: hidden; height: 84px; border: 2px solid transparent; padding: 0; text-align: left; transition: transform 160ms ease, border-color 180ms ease; }
        .tt-scenario-tile:active { transform: scale(0.96); }
        .tt-scenario-tile.is-selected { border-color: #00DC7D; }
        .tt-scenario-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .tt-scenario-caption { position: relative; z-index: 2; height: 100%; padding: 8px; background: linear-gradient(180deg, rgba(16, 3, 29, 0.15) 0%, rgba(16, 3, 29, 0.9) 100%); color: #FAF9F5; display: flex; flex-direction: column; justify-content: flex-end; }
        .tt-scenario-caption strong { font-size: 0.78rem; }
        .tt-scenario-caption span { font-size: 0.65rem; color: #7CF5C0; font-weight: 800; }

        .tt-set-block { display: flex; flex-direction: column; gap: 7px; }
        .tt-set-block label { font-size: 0.75rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-set-pair, .tt-set-pills-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .tt-tactile-pill { min-height: 40px; padding: 7px 10px; border-radius: 12px; background: var(--tt-surface-2); border: 1.5px solid var(--tt-border); color: var(--tt-text); font-size: 0.76rem; font-weight: 700; transition: transform 150ms ease; }
        .tt-tactile-pill:active { transform: scale(0.95); }
        .tt-tactile-pill.is-on { border-color: #00DC7D; background: rgba(0, 220, 125, 0.16); color: var(--tt-emerald-text); font-weight: 800; }
        .tt-perfil-view.is-light .tt-tactile-pill.is-on { background: #1E0734; border-color: #1E0734; color: #00DC7D; }
        .tt-preset-mini { padding: 3px 8px; border-radius: 999px; background: var(--tt-surface-2); color: var(--tt-text-muted); font-size: 0.66rem; font-weight: 800; }
        .tt-days-circle-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .tt-day-circle-btn { height: 38px; border-radius: 50%; background: var(--tt-surface-2); border: 1.5px solid var(--tt-border); color: var(--tt-text); font-weight: 800; font-size: 0.78rem; }
        .tt-day-circle-btn.is-on { background: #00DC7D; border-color: #00DC7D; color: #10021E; }
        .tt-times-stack { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
        .tt-set-select { min-height: 44px; padding: 0 12px; border-radius: 13px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text); font-size: 16px; }
        .tt-privacy-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px; border-radius: 14px; background: var(--tt-surface-2); }
        .tt-privacy-row strong { display: block; font-size: 0.82rem; }
        .tt-privacy-row small { display: block; font-size: 0.7rem; color: var(--tt-text-muted); }
        .tt-privacy-toggle { padding: 7px 13px; border-radius: 999px; background: var(--tt-surface); border: 1.5px solid var(--tt-border-medium); color: var(--tt-text); font-size: 0.72rem; font-weight: 900; }
        .tt-privacy-toggle.is-on { background: #1E0734; border-color: #00DC7D; color: #00DC7D; }

        html[data-tier='lite'] .tt-wc-foil-sheen { display: none !important; }
        html[data-tier='lite'] .tt-pf-glass-card,
        html[data-tier='lite'] .tt-thermo-ball-pin { animation: none !important; }
      `}</style>
    </section>
  );
}
