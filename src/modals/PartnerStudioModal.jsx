import React, { useEffect, useMemo, useState } from 'react';
import {
  ASSETS,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import {
  APP_CONFIG,
  INITIAL_CLUBS,
  getCategoryByPoints,
} from '../data/playersAndClubsData';
import { buildWhatsAppLink } from '../utils/tenisEngine';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (TARIFAS ALIADOS, COMPENSACIÓN GEMAS Y DATOS BASE)
   --------------------------------------------------------------------------
   - Cambia aquí suscripciones, videos base o cupos iniciales sin tocar CSS.
   - Preparado para escalar a N coaches y N clubes en Supabase.
   ========================================================================== */
export const PARTNER_STUDIO_EDITABLE_CONFIG = {
  gemsPerSol: APP_CONFIG.gemsPerSol || 20, // 20 Gemas = S/ 1.00
  monthlyCoachFeeSoles: 49, // Suscripción mensual Coach Pro (referencia editable)
  monthlyClubFeeSoles: 79, // Suscripción mensual Club Aliado (referencia editable)
  storageKey: 'tt_partner_studio_state_v1',

  defaultCoachData: {
    'coach-romina': {
      id: 'coach-romina',
      name: 'Romina Cutipa',
      clubId: 'club-cutipa',
      clubName: 'Academia Romina Cutipa',
      title: 'Directora Técnica · Alta Competencia',
      bio: 'Transición de 5ª A hacia 4ª y 3ª categoría mediante corrección biomecánica y patrones tácticos en arcilla.',
      baseRate: 65,
      vipRate: 52,
      studentsPromoted: 14,
      gemsCopayAccumulatedThisMonth: 360, // 360 Gemas = S/ 18.00 descontados de su cuota
      videos: [
        {
          id: 'pv-1',
          title: '2º saque con altura sin doble falta',
          tag: 'TIP GRATIS',
          duration: '01:45',
          gemsCost: 0,
          src: '/assets/video-coach-romina.mp4',
          poster: '/assets/portada-tips-semana.jpg',
          active: true,
        },
        {
          id: 'pv-2',
          title: 'Ángulos cortos en arcilla paso a paso',
          tag: 'MASTERCLASS',
          duration: '05:20',
          gemsCost: 40,
          src: '/assets/video-coach-demo-3.mp4',
          poster: '/assets/portada-academia-tv.jpg',
          active: true,
        },
        {
          id: 'pv-3',
          title: 'Rutina de calentamiento 4 min antes de jugar',
          tag: 'TIP GRATIS',
          duration: '02:10',
          gemsCost: 0,
          src: '/assets/video-coach-rodrigo.mp4',
          poster: '/assets/sede-romina-cutipa.jpg',
          active: true,
        },
      ],
      groups: [
        {
          id: 'grp-1',
          name: 'Grupo Competitivo 5ª A / 4ª',
          schedule: 'Mié & Vie · 06:00 PM',
          type: 'Grupal',
          price: 35,
          vipPrice: 28,
          spotsUsed: 3,
          spotsTotal: 4,
          active: true,
        },
        {
          id: 'grp-2',
          name: 'Clínica de Saque y Devolución',
          schedule: 'Sáb · 09:30 AM',
          type: 'Clínica',
          price: 40,
          vipPrice: 32,
          spotsUsed: 2,
          spotsTotal: 4,
          active: true,
        },
        {
          id: 'grp-3',
          name: 'Iniciación Damas · Nivel Cero',
          schedule: 'Mar & Jue · 08:30 AM',
          type: 'Grupal',
          price: 30,
          vipPrice: 24,
          spotsUsed: 3,
          spotsTotal: 4,
          active: true,
        },
      ],
      students: [
        {
          id: 'st-1',
          name: 'Valeria Mendoza',
          level: '5ª A',
          groupName: 'Grupo Competitivo 5ª A / 4ª',
          whatsapp: '964112233',
          feeStatus: 'AL_DIA', // AL_DIA | PENDIENTE
          attendedToday: true,
        },
        {
          id: 'st-2',
          name: 'Diego Paredes',
          level: '4ª Cat.',
          groupName: 'Clínica de Saque y Devolución',
          whatsapp: '964223344',
          feeStatus: 'AL_DIA',
          attendedToday: false,
        },
        {
          id: 'st-3',
          name: 'Lucía Fernández',
          level: '5ª B',
          groupName: 'Iniciación Damas · Nivel Cero',
          whatsapp: '964334455',
          feeStatus: 'PENDIENTE',
          attendedToday: false,
        },
      ],
    },
  },

  defaultClubExtras: {
    promos: [
      {
        id: 'pr-valle-1',
        title: 'Promo Horas Valle · -20 % en Arcilla',
        schedule: 'Lunes a Viernes · 10:00 AM a 03:00 PM',
        priceNote: 'S/ 24 / hora (en lugar de S/ 30)',
        vipExtra: 'Socios VIP: S/ 20 / hora',
        active: true,
      },
      {
        id: 'pr-valle-2',
        title: 'Pack 2 Horas Nocturnas con LED',
        schedule: 'Martes y Jueves · 08:00 PM a 10:00 PM',
        priceNote: 'S/ 78 por 2 horas seguidas',
        vipExtra: 'Incluye 1 hidratación de cortesía VIP',
        active: true,
      },
    ],
    internalEvents: [
      {
        id: 'ev-club-1',
        title: 'Noche de Dobles Americano',
        dateLabel: 'Viernes · 07:00 PM',
        fee: 25,
        spotsUsed: 10,
        spotsTotal: 16,
        note: 'Parejas rotativas · Ideal para conocer nuevos rivales del club',
      },
      {
        id: 'ev-club-2',
        title: 'Relámpago Interno de 5ª Categoría',
        dateLabel: 'Domingo · 09:00 AM',
        fee: 30,
        spotsUsed: 6,
        spotsTotal: 8,
        note: 'Sets cortos a 4 games · Trofeo del club al ganador',
      },
    ],
  },
};

/* ==========================================================================
   COMPONENTE PRINCIPAL: PartnerStudioModal (BLOQUE 22 DE 26)
   ========================================================================== */
export default function PartnerStudioModal({
  isOpen = false,
  onClose,
  partner = null, // { id, name, role: 'COACH' | 'CLUB', clubId }
  players = [],
  clubs = INITIAL_CLUBS,
  theme = 'dark',
  onSaveCoachChanges,
  onSaveClubChanges,
  onUpdateClubWeather,
  onNotify,
}) {
  // Permite alternar entre Estudio Coach Pro y Panel Club Aliado (útil para dueños de academia)
  const [studioRole, setStudioRole] = useState(partner?.role === 'CLUB' ? 'CLUB' : 'COACH');
  const [coachTab, setCoachTab] = useState('videos'); // 'videos' | 'clases' | 'alumnos' | 'vitrina'
  const [clubTab, setClubTab] = useState('valle'); // 'valle' | 'eventos' | 'validar'

  // Estado persistente de Coach
  const [coachState, setCoachState] = useState(() => {
    const base = PARTNER_STUDIO_EDITABLE_CONFIG.defaultCoachData['coach-romina'];
    try {
      const saved = window.localStorage.getItem(PARTNER_STUDIO_EDITABLE_CONFIG.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.coach) return { ...base, ...parsed.coach };
      }
    } catch (e) {
      // fallback seguro
    }
    return base;
  });

  // Estado persistente de Club Aliado
  const [selectedClubId, setSelectedClubId] = useState(
    partner?.clubId || clubs?.[0]?.id || 'club-country'
  );
  const [clubPromos, setClubPromos] = useState(
    PARTNER_STUDIO_EDITABLE_CONFIG.defaultClubExtras.promos
  );
  const [clubEvents, setClubEvents] = useState(
    PARTNER_STUDIO_EDITABLE_CONFIG.defaultClubExtras.internalEvents
  );

  // Sub-formularios colapsables limpios
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVidTitle, setNewVidTitle] = useState('');
  const [newVidDuration, setNewVidDuration] = useState('01:30');
  const [newVidExclusive, setNewVidExclusive] = useState(false);
  const [newVidGems, setNewVidGems] = useState(40);
  const [previewVideo, setPreviewVideo] = useState(null);

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGrpName, setNewGrpName] = useState('');
  const [newGrpSchedule, setNewGrpSchedule] = useState('Sáb · 10:00 AM');
  const [newGrpPrice, setNewGrpPrice] = useState(35);
  const [newGrpVipPrice, setNewGrpVipPrice] = useState(28);
  const [newGrpSpots, setNewGrpSpots] = useState(4);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStName, setNewStName] = useState('');
  const [newStLevel, setNewStLevel] = useState('5ª B');
  const [newStPhone, setNewStPhone] = useState('');

  const [showAddPromo, setShowAddPromo] = useState(false);
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoSchedule, setNewPromoSchedule] = useState('Lun–Vie · 11:00 AM a 03:00 PM');
  const [newPromoPrice, setNewPromoPrice] = useState('');

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvDate, setNewEvDate] = useState('Sábado · 06:00 PM');
  const [newEvFee, setNewEvFee] = useState(25);
  const [newEvSpots, setNewEvSpots] = useState(12);

  // Buscador del Validador de Carnet VIP en Recepción
  const [vipSearch, setVipSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (partner?.role === 'CLUB') setStudioRole('CLUB');
    else setStudioRole('COACH');
    if (partner?.name) {
      setCoachState((prev) => ({
        ...prev,
        id: partner.id || prev.id,
        name: partner.name,
      }));
    }
    if (partner?.clubId) setSelectedClubId(partner.clubId);
    setPreviewVideo(null);
  }, [isOpen, partner]);

  // Guardar estado aliado en localStorage automáticamente
  const persistCoachUpdate = (updater) => {
    setCoachState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        window.localStorage.setItem(
          PARTNER_STUDIO_EDITABLE_CONFIG.storageKey,
          JSON.stringify({ coach: next })
        );
      } catch (e) {
        // continuar
      }
      if (onSaveCoachChanges) onSaveCoachChanges(next);
      return next;
    });
  };

  const activeClub = useMemo(
    () => (clubs || []).find((c) => c.id === selectedClubId) || clubs?.[0] || null,
    [clubs, selectedClubId]
  );

  // Cálculos de Compensación de Copago con Gemas para el Coach
  const gemCompensation = useMemo(() => {
    const gems = Number(coachState.gemsCopayAccumulatedThisMonth) || 0;
    const creditSoles = Number((gems / PARTNER_STUDIO_EDITABLE_CONFIG.gemsPerSol).toFixed(2));
    const baseFee = PARTNER_STUDIO_EDITABLE_CONFIG.monthlyCoachFeeSoles;
    const netMonthlyFee = Math.max(0, Number((baseFee - creditSoles).toFixed(2)));
    return { gems, creditSoles, baseFee, netMonthlyFee };
  }, [coachState.gemsCopayAccumulatedThisMonth]);

  // Resultados del Validador de Carnet Socio VIP en Recepción del Club
  const vipValidationMatches = useMemo(() => {
    const q = vipSearch.trim().toLowerCase();
    if (!q) return [];
    return (players || [])
      .filter((p) => {
        const hay = `${p.name || ''} ${p.credentialId || ''} ${p.whatsapp || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 6);
  }, [players, vipSearch]);

  /* ------------------------------------------------------------------------
     ACCIONES COACH PRO (VIDEOS, CUPOS EN VIVO, ALUMNOS, VITRINA)
     ------------------------------------------------------------------------ */
  const handleAddVideo = (e) => {
    e.preventDefault();
    if (newVidTitle.trim().length < 4) return;
    const created = {
      id: `pv-${Date.now()}`,
      title: newVidTitle.trim(),
      tag: newVidExclusive ? 'MASTERCLASS' : 'TIP GRATIS',
      duration: newVidDuration.trim() || '01:30',
      gemsCost: newVidExclusive ? Number(newVidGems) || 40 : 0,
      src: '/assets/video-coach-romina.mp4',
      poster: newVidExclusive ? '/assets/portada-academia-tv.jpg' : '/assets/portada-tips-semana.jpg',
      active: true,
    };
    persistCoachUpdate((prev) => ({ ...prev, videos: [created, ...(prev.videos || [])] }));
    setNewVidTitle('');
    setShowAddVideo(false);
    triggerHaptic('success');
    if (onNotify) onNotify('Video publicado en tu carrusel de cancha.', 'success');
  };

  const handleToggleVideoActive = (vidId) => {
    triggerHaptic('light');
    persistCoachUpdate((prev) => ({
      ...prev,
      videos: (prev.videos || []).map((v) => (v.id === vidId ? { ...v, active: !v.active } : v)),
    }));
  };

  const handleStepGroupSpots = (grpId, delta) => {
    triggerHaptic('light');
    persistCoachUpdate((prev) => ({
      ...prev,
      groups: (prev.groups || []).map((g) => {
        if (g.id !== grpId) return g;
        const nextUsed = Math.max(0, Math.min(g.spotsTotal, g.spotsUsed + delta));
        return { ...g, spotsUsed: nextUsed };
      }),
    }));
  };

  const handleAddGroup = (e) => {
    e.preventDefault();
    if (newGrpName.trim().length < 3) return;
    const created = {
      id: `grp-${Date.now()}`,
      name: newGrpName.trim(),
      schedule: newGrpSchedule.trim() || 'Por coordinar',
      type: 'Grupal',
      price: Number(newGrpPrice) || 35,
      vipPrice: Math.min(Number(newGrpVipPrice) || 28, Number(newGrpPrice) || 35),
      spotsUsed: 1,
      spotsTotal: Math.max(2, Number(newGrpSpots) || 4),
      active: true,
    };
    persistCoachUpdate((prev) => ({ ...prev, groups: [created, ...(prev.groups || [])] }));
    setNewGrpName('');
    setShowAddGroup(false);
    triggerHaptic('success');
    if (onNotify) onNotify('Clase grupal creada y visible con cupos en vivo.', 'success');
  };

  const handleBroadcastGroupWhatsApp = (grp) => {
    triggerHaptic('medium');
    const freeSpots = Math.max(0, grp.spotsTotal - grp.spotsUsed);
    const msg = [
      `🎾 ¡Quedan ${freeSpots} ${freeSpots === 1 ? 'cupo libre' : 'cupos libres'} en mi clase!`,
      `• Grupo: ${grp.name}`,
      `• Horario: ${grp.schedule} (${coachState.clubName})`,
      `• Tarifa: S/ ${grp.price} · Socio VIP: S/ ${grp.vipPrice} (aceptamos Copago con Gemas 💎)`,
      `Reserva tu lugar respondiendo este mensaje o desde TOTAL TENIS.`,
    ].join('\n');
    window.open(buildWhatsAppLink('', msg), '_blank', 'noopener,noreferrer');
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (newStName.trim().length < 3) return;
    const created = {
      id: `st-${Date.now()}`,
      name: newStName.trim(),
      level: newStLevel,
      groupName: coachState.groups?.[0]?.name || 'Clases particulares',
      whatsapp: newStPhone.replace(/\D/g, ''),
      feeStatus: 'AL_DIA',
      attendedToday: true,
    };
    persistCoachUpdate((prev) => ({ ...prev, students: [created, ...(prev.students || [])] }));
    setNewStName('');
    setNewStPhone('');
    setShowAddStudent(false);
    triggerHaptic('success');
    if (onNotify) onNotify(`${created.name} agregado a tu padrón de alumnos.`, 'success');
  };

  const handleToggleStudentAttendance = (stId) => {
    triggerHaptic('light');
    persistCoachUpdate((prev) => ({
      ...prev,
      students: (prev.students || []).map((s) =>
        s.id === stId ? { ...s, attendedToday: !s.attendedToday } : s
      ),
    }));
  };

  const handleToggleStudentFee = (stId) => {
    triggerHaptic('light');
    persistCoachUpdate((prev) => ({
      ...prev,
      students: (prev.students || []).map((s) =>
        s.id === stId
          ? { ...s, feeStatus: s.feeStatus === 'AL_DIA' ? 'PENDIENTE' : 'AL_DIA' }
          : s
      ),
    }));
  };

  /* ------------------------------------------------------------------------
     ACCIONES CLUB ALIADO (PROMOS HORAS VALLE Y TORNEOS INTERNOS)
     ------------------------------------------------------------------------ */
  const handleAddPromo = (e) => {
    e.preventDefault();
    if (newPromoTitle.trim().length < 4) return;
    const created = {
      id: `pr-${Date.now()}`,
      title: newPromoTitle.trim(),
      schedule: newPromoSchedule.trim(),
      priceNote: newPromoPrice.trim() || 'Tarifa promocional valle',
      vipExtra: 'Beneficio adicional Socio VIP',
      active: true,
    };
    const next = [created, ...clubPromos];
    setClubPromos(next);
    if (onSaveClubChanges && activeClub) {
      onSaveClubChanges(activeClub.id, { promos: next });
    }
    setNewPromoTitle('');
    setNewPromoPrice('');
    setShowAddPromo(false);
    triggerHaptic('success');
    if (onNotify) onNotify('Promoción de Hora Valle publicada en la ficha del club.', 'success');
  };

  const handleAddClubEvent = (e) => {
    e.preventDefault();
    if (newEvTitle.trim().length < 4) return;
    const created = {
      id: `ev-${Date.now()}`,
      title: newEvTitle.trim(),
      dateLabel: newEvDate.trim(),
      fee: Number(newEvFee) || 25,
      spotsUsed: 1,
      spotsTotal: Math.max(4, Number(newEvSpots) || 12),
      note: 'Evento interno oficial del club aliado',
    };
    const next = [created, ...clubEvents];
    setClubEvents(next);
    if (onSaveClubChanges && activeClub) {
      onSaveClubChanges(activeClub.id, { internalEvents: next });
    }
    setNewEvTitle('');
    setShowAddEvent(false);
    triggerHaptic('success');
    if (onNotify) onNotify('Torneo interno publicado en el calendario del club.', 'success');
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={studioRole === 'COACH' ? 'Estudio Coach Pro' : 'Panel de Club Aliado'}
      subtitle={
        studioRole === 'COACH'
          ? `${coachState.name} · ${coachState.clubName}`
          : activeClub?.name || 'Gestión de Sede Oficial'
      }
      icon={
        <IconBadge
          name={studioRole === 'COACH' ? 'users' : 'shield'}
          variant={studioRole === 'COACH' ? 'emerald' : 'gold'}
          size={38}
        />
      }
      isWide
      isTopLayer
    >
      <div className={`tt-ps-studio ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* ==================================================================
            CABECERA EJECUTIVA + CONMUTADOR DE ROL ALIADO (COACH | CLUB)
            ================================================================== */}
        <div className="tt-pst-hero">
          <div className="tt-pst-hero-top">
            <div>
              <span className="tt-pst-kicker">PORTAL ALIADOS B2B · TOTAL TENIS</span>
              <h2>{studioRole === 'COACH' ? coachState.name : activeClub?.name}</h2>
            </div>

            <div className="tt-pst-role-switch" role="tablist" aria-label="Cambiar vista de aliado">
              <button
                type="button"
                role="tab"
                aria-selected={studioRole === 'COACH'}
                className={studioRole === 'COACH' ? 'is-active' : ''}
                onClick={() => {
                  triggerHaptic('light');
                  setStudioRole('COACH');
                }}
              >
                Estudio Coach
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={studioRole === 'CLUB'}
                className={studioRole === 'CLUB' ? 'is-active' : ''}
                onClick={() => {
                  triggerHaptic('light');
                  setStudioRole('CLUB');
                }}
              >
                Panel Club
              </button>
            </div>
          </div>

          {/* Métricas Ejecutivas Rápidas */}
          {studioRole === 'COACH' ? (
            <div className="tt-pst-kpi-strip">
              <div>
                <span>VIDEOS EN CANCHA</span>
                <strong>{(coachState.videos || []).filter((v) => v.active).length}</strong>
              </div>
              <div>
                <span>ALUMNOS ACTIVOS</span>
                <strong>{(coachState.students || []).length}</strong>
              </div>
              <div className="is-emerald">
                <span>CRÉDITO GEMAS</span>
                <strong>-S/ {gemCompensation.creditSoles.toFixed(0)}</strong>
              </div>
            </div>
          ) : (
            <div className="tt-pst-kpi-strip">
              <div>
                <span>PROMOS VALLE</span>
                <strong>{clubPromos.filter((p) => p.active).length}</strong>
              </div>
              <div>
                <span>EVENTOS CLUB</span>
                <strong>{clubEvents.length}</strong>
              </div>
              <div className="is-emerald">
                <span>SOCIOS VIP</span>
                <strong>{(players || []).filter((p) => p.isVip).length}</strong>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================
            MODO 1: ESTUDIO COACH PRO (4 PESTAÑAS)
            ================================================================== */}
        {studioRole === 'COACH' && (
          <>
            <div className="tt-pst-subtabs" role="tablist">
              {[
                { id: 'videos', label: 'Mis Videos' },
                { id: 'clases', label: 'Clases & Cupos' },
                { id: 'alumnos', label: 'Alumnos' },
                { id: 'vitrina', label: 'Mi Vitrina' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={coachTab === t.id}
                  className={`tt-pst-subtab ${coachTab === t.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setCoachTab(t.id);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: CARRUSEL VERTICAL DE VIDEOS CORTOS EN CANCHA (9:16) */}
            {coachTab === 'videos' && (
              <div className="tt-pst-section">
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">FORMATO REELS 9:16 · CERO RESEÑAS FALSAS</span>
                    <h3>Mis Videos en Cancha</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowAddVideo((v) => !v);
                    }}
                  >
                    {showAddVideo ? 'Cerrar' : '+ Subir Video'}
                  </button>
                </div>

                {showAddVideo && (
                  <form onSubmit={handleAddVideo} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newVidTitle}
                      onChange={(e) => setNewVidTitle(e.target.value)}
                      placeholder="Título del tip o corrección (ej. Revés cruzado con altura)"
                      required
                    />
                    <div className="tt-pst-grid-2">
                      <input
                        type="text"
                        className="tt-pst-input"
                        value={newVidDuration}
                        onChange={(e) => setNewVidDuration(e.target.value)}
                        placeholder="Duración (01:30)"
                      />
                      <button
                        type="button"
                        className={`tt-pst-toggle-btn ${newVidExclusive ? 'is-on' : ''}`}
                        onClick={() => setNewVidExclusive((v) => !v)}
                      >
                        {newVidExclusive ? `Masterclass (${newVidGems} 💎)` : 'Tip Gratis (Abierto)'}
                      </button>
                    </div>
                    {newVidExclusive && (
                      <input
                        type="number"
                        min="20"
                        max="200"
                        step="20"
                        className="tt-pst-input"
                        value={newVidGems}
                        onChange={(e) => setNewVidGems(Number(e.target.value))}
                        placeholder="Costo en Gemas (ej. 40)"
                      />
                    )}
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Publicar Video en mi Perfil
                    </button>
                  </form>
                )}

                {/* Reproductor inline si el coach toca un reel para previsualizar */}
                {previewVideo && (
                  <div className="tt-pst-vid-preview">
                    <div className="tt-pst-vp-head">
                      <strong>{previewVideo.title}</strong>
                      <button type="button" onClick={() => setPreviewVideo(null)}>
                        Cerrar ✕
                      </button>
                    </div>
                    <video
                      src={previewVideo.src}
                      poster={previewVideo.poster}
                      controls
                      autoPlay
                      playsInline
                      style={{ width: '100%', maxHeight: 260, borderRadius: 14, background: '#000' }}
                    />
                  </div>
                )}

                {/* Carrusel Vertical 9:16 con scroll-snap (Diseño Aprobado) */}
                <div className="tt-pst-reels-carousel">
                  {(coachState.videos || []).map((vid) => (
                    <article
                      key={vid.id}
                      className={`tt-reel-card ${!vid.active ? 'is-paused' : ''}`}
                    >
                      <div
                        className="tt-reel-poster-wrap"
                        onClick={() => {
                          triggerHaptic('light');
                          setPreviewVideo(vid);
                        }}
                      >
                        <SmartImage
                          src={vid.poster}
                          fallbackSrc={ASSETS.torneoApertura}
                          alt={vid.title}
                          className="tt-reel-img"
                        />
                        <div className="tt-reel-scrim" />

                        <div className="tt-reel-top">
                          <span className={`tt-reel-tag ${vid.gemsCost > 0 ? 'is-gold' : ''}`}>
                            {vid.gemsCost > 0 ? `${vid.gemsCost} 💎` : vid.tag}
                          </span>
                          <span className="tt-reel-dur">▶ {vid.duration}</span>
                        </div>

                        <div className="tt-reel-bottom">
                          <strong>{vid.title}</strong>
                        </div>
                      </div>

                      <div className="tt-reel-foot">
                        <button
                          type="button"
                          className={`tt-reel-vis-btn ${vid.active ? 'is-live' : ''}`}
                          onClick={() => handleToggleVideoActive(vid.id)}
                        >
                          {vid.active ? '● Visible' : '○ Oculto'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CLASES GRUPALES CON CUPOS EN VIVO (3/4 CUPOS) + WHATSAPP */}
            {coachTab === 'clases' && (
              <div className="tt-pst-section">
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">CONTROL DE VACANTES EN TIEMPO REAL</span>
                    <h3>Clases Grupales & Clínicas</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowAddGroup((v) => !v);
                    }}
                  >
                    {showAddGroup ? 'Cerrar' : '+ Nueva Clase'}
                  </button>
                </div>

                {showAddGroup && (
                  <form onSubmit={handleAddGroup} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newGrpName}
                      onChange={(e) => setNewGrpName(e.target.value)}
                      placeholder="Nombre del grupo (ej. Clínica Topspin Adultos)"
                      required
                    />
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newGrpSchedule}
                      onChange={(e) => setNewGrpSchedule(e.target.value)}
                      placeholder="Horario (ej. Mar & Jue · 07:00 PM)"
                      required
                    />
                    <div className="tt-pst-grid-3">
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={newGrpPrice}
                        onChange={(e) => setNewGrpPrice(e.target.value)}
                        placeholder="Precio S/"
                      />
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={newGrpVipPrice}
                        onChange={(e) => setNewGrpVipPrice(e.target.value)}
                        placeholder="VIP S/"
                      />
                      <input
                        type="number"
                        min="2"
                        max="12"
                        className="tt-pst-input"
                        value={newGrpSpots}
                        onChange={(e) => setNewGrpSpots(e.target.value)}
                        placeholder="Cupos"
                      />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Crear Grupo con Cupos Vivos
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {(coachState.groups || []).map((grp) => {
                    const isFull = grp.spotsUsed >= grp.spotsTotal;
                    const pct = Math.min(100, Math.round((grp.spotsUsed / grp.spotsTotal) * 100));
                    return (
                      <article key={grp.id} className="tt-pst-group-card">
                        <div className="tt-pgc-top">
                          <div>
                            <span className="tt-pgc-type">{grp.type}</span>
                            <h4>{grp.name}</h4>
                            <small>{grp.schedule}</small>
                          </div>
                          <div className="tt-pgc-spots-badge">
                            <strong>
                              {grp.spotsUsed}/{grp.spotsTotal}
                            </strong>
                            <span>CUPOS</span>
                          </div>
                        </div>

                        <div className="tt-pgc-bar">
                          <div style={{ width: `${pct}%` }} />
                        </div>

                        <div className="tt-pgc-bottom">
                          <div className="tt-pgc-prices">
                            <span>Regular: S/ {grp.price}</span>
                            <strong style={{ color: '#F59E0B' }}>VIP: S/ {grp.vipPrice}</strong>
                          </div>

                          <div className="tt-pgc-controls">
                            <button
                              type="button"
                              className="tt-mini-step"
                              disabled={grp.spotsUsed <= 0}
                              onClick={() => handleStepGroupSpots(grp.id, -1)}
                              aria-label="Restar 1 cupo ocupado"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              className="tt-mini-step is-plus"
                              disabled={isFull}
                              onClick={() => handleStepGroupSpots(grp.id, 1)}
                              aria-label="Sumar 1 cupo ocupado"
                            >
                              +
                            </button>
                            {!isFull && (
                              <button
                                type="button"
                                className="tt-pgc-wa-btn"
                                onClick={() => handleBroadcastGroupWhatsApp(grp)}
                              >
                                <TTIcon name="whatsapp" size={14} />
                                Convocar
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PADRÓN DE ALUMNOS, ASISTENCIA Y SEMÁFORO DE CUOTAS */}
            {coachTab === 'alumnos' && (
              <div className="tt-pst-section">
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">CONTROL PRIVADO DE ACADEMIA</span>
                    <h3>Alumnos y Asistencia</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowAddStudent((v) => !v);
                    }}
                  >
                    {showAddStudent ? 'Cerrar' : '+ Alumno'}
                  </button>
                </div>

                {showAddStudent && (
                  <form onSubmit={handleAddStudent} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newStName}
                      onChange={(e) => setNewStName(e.target.value)}
                      placeholder="Nombre del alumno"
                      required
                    />
                    <div className="tt-pst-grid-2">
                      <select
                        className="tt-pst-input"
                        value={newStLevel}
                        onChange={(e) => setNewStLevel(e.target.value)}
                      >
                        {['5ª P', '5ª B', '5ª A', '4ª Cat.', '3ª Cat.'].map((lv) => (
                          <option key={lv} value={lv}>
                            {lv}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        className="tt-pst-input"
                        value={newStPhone}
                        onChange={(e) => setNewStPhone(e.target.value)}
                        placeholder="WhatsApp (opcional)"
                      />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Guardar Alumno
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {(coachState.students || []).map((st) => (
                    <div key={st.id} className="tt-pst-student-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong>{st.name}</strong>
                          <span className="tt-st-level-chip">{st.level}</span>
                        </div>
                        <small>{st.groupName}</small>
                      </div>

                      <div className="tt-st-actions">
                        <button
                          type="button"
                          className={`tt-st-pill ${st.attendedToday ? 'is-ok' : ''}`}
                          onClick={() => handleToggleStudentAttendance(st.id)}
                        >
                          {st.attendedToday ? '✓ Asistió' : 'Pendiente'}
                        </button>

                        <button
                          type="button"
                          className={`tt-st-pill ${st.feeStatus === 'AL_DIA' ? 'is-paid' : 'is-due'}`}
                          onClick={() => handleToggleStudentFee(st.id)}
                        >
                          {st.feeStatus === 'AL_DIA' ? 'Al día' : 'Por renovar'}
                        </button>

                        {st.whatsapp && (
                          <a
                            href={buildWhatsAppLink(
                              st.whatsapp,
                              `Hola ${st.name}, te escribo tu Coach ${coachState.name} para confirmar nuestra próxima sesión en ${coachState.clubName}.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tt-st-wa-icon"
                            aria-label={`Escribir a ${st.name} por WhatsApp`}
                          >
                            <TTIcon name="whatsapp" size={15} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: MI VITRINA PÚBLICA Y COMPENSACIÓN DE GEMAS (20 💎 = S/ 1.00) */}
            {coachTab === 'vitrina' && (
              <div className="tt-pst-section">
                {/* Tarjeta Transparente de Compensación de Gemas */}
                <div className="tt-pst-gems-comp">
                  <span className="tt-pst-kicker">COMPENSACIÓN DE COPAGOS CON GEMAS</span>
                  <div className="tt-pgc-comp-grid">
                    <div>
                      <span>Gemas canjeadas por alumnos</span>
                      <strong>{gemCompensation.gems} 💎</strong>
                    </div>
                    <div>
                      <span>Crédito a tu favor (20 💎 = S/ 1)</span>
                      <strong style={{ color: '#00DC7D' }}>-S/ {gemCompensation.creditSoles.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>Tu cuota mensual neta</span>
                      <strong style={{ color: '#FDE68A' }}>S/ {gemCompensation.netMonthlyFee.toFixed(2)}</strong>
                    </div>
                  </div>
                  <small>
                    Cada descuento que un alumno aplica con Gemas se descuenta de tu mensualidad de Coach Pro (S/ {gemCompensation.baseFee}). Recibes siempre el 100 % de tu tarifa.
                  </small>
                </div>

                {/* Edición directa de Tarifa Estándar, Tarifa VIP y Bio */}
                <div className="tt-pst-inline-form">
                  <div className="tt-pst-grid-2">
                    <label className="tt-pst-lbl">
                      <span>Tarifa Hora Regular (S/)</span>
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={coachState.baseRate}
                        onChange={(e) =>
                          persistCoachUpdate((prev) => ({
                            ...prev,
                            baseRate: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                    <label className="tt-pst-lbl">
                      <span>Tarifa Socio VIP (S/)</span>
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={coachState.vipRate}
                        onChange={(e) =>
                          persistCoachUpdate((prev) => ({
                            ...prev,
                            vipRate: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className="tt-pst-lbl">
                    <span>Presentación pública en tu vitrina</span>
                    <textarea
                      rows={3}
                      className="tt-pst-textarea"
                      value={coachState.bio}
                      onChange={(e) =>
                        persistCoachUpdate((prev) => ({ ...prev, bio: e.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================================================================
            MODO 2: PANEL DE CLUB ALIADO (HORAS VALLE, TORNEOS Y VALIDADOR VIP)
            ================================================================== */}
        {studioRole === 'CLUB' && (
          <>
            {/* Selector de Sede si gestionas más de un club */}
            <div className="tt-pst-club-picker">
              {(clubs || []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`tt-pst-club-chip ${selectedClubId === c.id ? 'is-on' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedClubId(c.id);
                  }}
                >
                  {c.shortName}
                </button>
              ))}
            </div>

            <div className="tt-pst-subtabs is-3" role="tablist">
              {[
                { id: 'valle', label: 'Horas Valle' },
                { id: 'eventos', label: 'Torneos Club' },
                { id: 'validar', label: 'Validar VIP' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={clubTab === t.id}
                  className={`tt-pst-subtab ${clubTab === t.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setClubTab(t.id);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* CLUB TAB 1: PROMOS HORAS VALLE + REPORTE RÁPIDO DE CLIMA */}
            {clubTab === 'valle' && (
              <div className="tt-pst-section">
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">LLENA TUS CANCHAS EN HORAS MUERTAS</span>
                    <h3>Promos en Horario Valle</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
                    onClick={() => setShowAddPromo((v) => !v)}
                  >
                    {showAddPromo ? 'Cerrar' : '+ Promo'}
                  </button>
                </div>

                {showAddPromo && (
                  <form onSubmit={handleAddPromo} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newPromoTitle}
                      onChange={(e) => setNewPromoTitle(e.target.value)}
                      placeholder="Título (ej. 25 % Dcto Mañanas de Arcilla)"
                      required
                    />
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newPromoSchedule}
                      onChange={(e) => setNewPromoSchedule(e.target.value)}
                      placeholder="Días y horario"
                    />
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newPromoPrice}
                      onChange={(e) => setNewPromoPrice(e.target.value)}
                      placeholder="Precio promo (ej. S/ 22 la hora)"
                    />
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Publicar Promo Hora Valle
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {clubPromos.map((pr) => (
                    <article key={pr.id} className={`tt-pst-promo-card ${!pr.active ? 'is-off' : ''}`}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{pr.title}</strong>
                        <small>{pr.schedule}</small>
                        <div className="tt-pr-notes">
                          <span>{pr.priceNote}</span>
                          <span style={{ color: '#F59E0B' }}>{pr.vipExtra}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`tt-st-pill ${pr.active ? 'is-ok' : ''}`}
                        onClick={() => {
                          triggerHaptic('light');
                          setClubPromos((prev) =>
                            prev.map((item) =>
                              item.id === pr.id ? { ...item, active: !item.active } : item
                            )
                          );
                        }}
                      >
                        {pr.active ? 'Activa' : 'Pausada'}
                      </button>
                    </article>
                  ))}
                </div>

                {/* Actualización Rápida de Clima en Sede desde Recepción */}
                {activeClub && (
                  <div className="tt-pst-weather-quick">
                    <span className="tt-pst-mini-kicker">ACTUALIZAR CLIMA EN {activeClub.shortName.toUpperCase()}</span>
                    <div className="tt-pst-wq-row">
                      {[
                        { key: 'seco', label: 'Seca' },
                        { key: 'humedad', label: 'Húmeda' },
                        { key: 'llovizna', label: 'Llovizna' },
                        { key: 'lluvia', label: 'Lluvia' },
                      ].map((w) => (
                        <button
                          key={w.key}
                          type="button"
                          className="tt-pst-wq-btn"
                          onClick={() => {
                            triggerHaptic('success');
                            if (onUpdateClubWeather) {
                              onUpdateClubWeather({ clubId: activeClub.id, conditionKey: w.key });
                            }
                            if (onNotify) {
                              onNotify(`Clima de ${activeClub.shortName} actualizado a: ${w.label}.`, 'success');
                            }
                          }}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CLUB TAB 2: TORNEOS INTERNOS Y NOCHES DE DOBLES */}
            {clubTab === 'eventos' && (
              <div className="tt-pst-section">
                <div className="tt-pst-sec-head">
                  <div>
                    <span className="tt-pst-mini-kicker">DINAMIZA TU COMUNIDAD LOCAL</span>
                    <h3>Torneos Internos del Club</h3>
                  </div>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary tt-btn-sm"
                    onClick={() => setShowAddEvent((v) => !v)}
                  >
                    {showAddEvent ? 'Cerrar' : '+ Evento'}
                  </button>
                </div>

                {showAddEvent && (
                  <form onSubmit={handleAddClubEvent} className="tt-pst-inline-form">
                    <input
                      type="text"
                      className="tt-pst-input"
                      value={newEvTitle}
                      onChange={(e) => setNewEvTitle(e.target.value)}
                      placeholder="Nombre (ej. Noche de Dobles Mixto)"
                      required
                    />
                    <div className="tt-pst-grid-3">
                      <input
                        type="text"
                        className="tt-pst-input"
                        value={newEvDate}
                        onChange={(e) => setNewEvDate(e.target.value)}
                        placeholder="Fecha / Hora"
                      />
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={newEvFee}
                        onChange={(e) => setNewEvFee(e.target.value)}
                        placeholder="Cuota S/"
                      />
                      <input
                        type="number"
                        className="tt-pst-input"
                        value={newEvSpots}
                        onChange={(e) => setNewEvSpots(e.target.value)}
                        placeholder="Cupos"
                      />
                    </div>
                    <button type="submit" className="tt-btn tt-btn-primary tt-btn-sm">
                      Publicar Torneo Interno
                    </button>
                  </form>
                )}

                <div className="tt-pst-cards-stack">
                  {clubEvents.map((ev) => (
                    <article key={ev.id} className="tt-pst-group-card">
                      <div className="tt-pgc-top">
                        <div>
                          <span className="tt-pgc-type">{ev.dateLabel}</span>
                          <h4>{ev.title}</h4>
                          <small>{ev.note}</small>
                        </div>
                        <div className="tt-pgc-spots-badge">
                          <strong>S/ {ev.fee}</strong>
                          <span>
                            {ev.spotsUsed}/{ev.spotsTotal}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* CLUB TAB 3: VALIDADOR INSTANTÁNEO DE CARNET SOCIO VIP EN RECEPCIÓN */}
            {clubTab === 'validar' && (
              <div className="tt-pst-section">
                <div className="tt-pst-validator-box">
                  <span className="tt-pst-mini-kicker">VERIFICACIÓN EN RECEPCIÓN · GOLDEN TICKET</span>
                  <h3>Validar Carnet Socio VIP</h3>
                  <p>
                    Escribe el nombre del tenista o el código de su Carnet 3D (ej. TT-2026-...) para verificar al instante si tiene su beneficio VIP activo.
                  </p>

                  <input
                    type="search"
                    className="tt-pst-input"
                    value={vipSearch}
                    onChange={(e) => setVipSearch(e.target.value)}
                    placeholder="Buscar por nombre o código TT-2026..."
                  />

                  {vipSearch.trim().length > 0 && (
                    <div className="tt-pst-val-results">
                      {vipValidationMatches.length === 0 ? (
                        <small style={{ color: 'var(--tt-text-muted)' }}>
                          No se encontró ningún socio con ese dato.
                        </small>
                      ) : (
                        vipValidationMatches.map((p) => (
                          <div key={p.id} className="tt-pst-val-row">
                            <SmartImage
                              src={p.avatar}
                              alt={p.name}
                              initials={p.name}
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                objectPosition: 'center top',
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong>{p.name}</strong>
                              <small>
                                {p.credentialId || 'Sin código'} · {getCategoryByPoints(p.points).name}
                              </small>
                            </div>
                            <span className={`tt-val-pill ${p.isVip ? 'is-vip' : 'is-std'}`}>
                              {p.isVip ? '✓ VIP ACTIVO' : 'ESTÁNDAR'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====================================================================
          ESTILOS ENCAPSULADOS (PORTAL ALIADOS B2B · ESTÉTICA TOTAL TENIS)
          ==================================================================== */}
      <style>{`
        .tt-ps-studio {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-pst-hero {
          border-radius: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #270A44 0%, #140324 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.34);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-pst-hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-pst-kicker {
          display: block;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #00DC7D;
        }
        .tt-pst-hero h2 {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.45rem;
          line-height: 1.04;
        }
        .tt-pst-role-switch {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.1);
        }
        .tt-pst-role-switch button {
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 800;
          color: rgba(250, 249, 245, 0.74);
        }
        .tt-pst-role-switch button.is-active {
          background: #00DC7D;
          color: #120321;
        }
        .tt-pst-kpi-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .tt-pst-kpi-strip > div {
          padding: 9px 8px;
          border-radius: 13px;
          background: rgba(250, 249, 245, 0.07);
          text-align: center;
        }
        .tt-pst-kpi-strip span {
          display: block;
          font-size: 0.56rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          opacity: 0.7;
        }
        .tt-pst-kpi-strip strong {
          font-family: var(--tt-font-display);
          font-size: 1.32rem;
          line-height: 1.05;
        }
        .tt-pst-kpi-strip .is-emerald strong {
          color: #00DC7D;
        }

        .tt-pst-subtabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 5px;
          padding: 4px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-pst-subtabs.is-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .tt-pst-subtab {
          min-height: 38px;
          padding: 0 5px;
          border-radius: 11px;
          font-size: 0.71rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          white-space: nowrap;
        }
        .tt-pst-subtab.is-active {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-ps-studio.is-dark .tt-pst-subtab.is-active {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }

        .tt-pst-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-pst-sec-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-pst-mini-kicker {
          display: block;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
        }
        .tt-ps-studio.is-light .tt-pst-mini-kicker {
          color: #008A4E;
        }
        .tt-pst-sec-head h3 {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-size: 1.24rem;
          line-height: 1.05;
        }

        /* Formularios Inline */
        .tt-pst-inline-form {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-pst-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-pst-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .tt-pst-lbl {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-pst-input,
        .tt-pst-textarea {
          width: 100%;
          padding: 9px 12px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.84rem;
          font-family: inherit;
        }
        .tt-pst-input {
          min-height: 42px;
        }
        .tt-pst-toggle-btn {
          min-height: 42px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-pst-toggle-btn.is-on {
          border-color: #F59E0B;
          color: #F59E0B;
        }

        /* Carrusel Vertical 9:16 "Mis Videos en Cancha" */
        .tt-pst-vid-preview {
          padding: 11px;
          border-radius: 16px;
          background: #140324;
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-pst-vp-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .tt-pst-vp-head button {
          color: #00DC7D;
          font-weight: 800;
        }
        .tt-pst-reels-carousel {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .tt-pst-reels-carousel::-webkit-scrollbar {
          display: none;
        }
        .tt-reel-card {
          flex: 0 0 162px;
          scroll-snap-align: start;
          border-radius: 18px;
          overflow: hidden;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
        }
        .tt-reel-card.is-paused {
          opacity: 0.56;
        }
        .tt-reel-poster-wrap {
          position: relative;
          aspect-ratio: 9 / 14;
          background: #140324;
          cursor: pointer;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .tt-reel-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-reel-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(16, 3, 29, 0.35) 0%, rgba(16, 3, 29, 0.92) 100%);
        }
        .tt-reel-top,
        .tt-reel-bottom {
          position: relative;
          z-index: 2;
        }
        .tt-reel-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
        }
        .tt-reel-tag {
          padding: 2px 7px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.58rem;
          font-weight: 900;
        }
        .tt-reel-tag.is-gold {
          background: #F59E0B;
          color: #1E1102;
        }
        .tt-reel-dur {
          font-size: 0.62rem;
          font-weight: 800;
          color: #FAF9F5;
        }
        .tt-reel-bottom strong {
          font-size: 0.78rem;
          line-height: 1.22;
          color: #FAF9F5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .tt-reel-foot {
          padding: 7px;
          display: flex;
          justify-content: center;
        }
        .tt-reel-vis-btn {
          width: 100%;
          min-height: 28px;
          border-radius: 9px;
          background: var(--tt-surface);
          color: var(--tt-text-muted);
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-reel-vis-btn.is-live {
          color: #00DC7D;
        }
        .tt-ps-studio.is-light .tt-reel-vis-btn.is-live {
          color: #008A4E;
        }

        /* Clases Grupales, Alumnos y Promos */
        .tt-pst-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-pst-group-card,
        .tt-pst-promo-card {
          padding: 12px 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-pst-promo-card {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
        .tt-pst-promo-card.is-off {
          opacity: 0.58;
        }
        .tt-pst-promo-card small {
          display: block;
          font-size: 0.71rem;
          color: var(--tt-text-muted);
          margin-top: 2px;
        }
        .tt-pr-notes {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 0.72rem;
          font-weight: 800;
          margin-top: 4px;
        }

        .tt-pgc-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .tt-pgc-type {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
          text-transform: uppercase;
        }
        .tt-ps-studio.is-light .tt-pgc-type {
          color: #008A4E;
        }
        .tt-pgc-top h4 {
          margin: 2px 0 0;
          font-size: 0.88rem;
        }
        .tt-pgc-top small {
          font-size: 0.72rem;
          color: var(--tt-text-muted);
        }
        .tt-pgc-spots-badge {
          padding: 5px 10px;
          border-radius: 12px;
          background: #1E0734;
          color: #FAF9F5;
          text-align: center;
          flex-shrink: 0;
        }
        .tt-pgc-spots-badge strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.12rem;
          line-height: 1;
          color: #00DC7D;
        }
        .tt-pgc-spots-badge span {
          font-size: 0.56rem;
          font-weight: 800;
          opacity: 0.75;
        }
        .tt-pgc-bar {
          height: 6px;
          border-radius: 999px;
          background: var(--tt-surface);
          overflow: hidden;
        }
        .tt-pgc-bar > div {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00DC7D 0%, #F59E0B 100%);
        }
        .tt-pgc-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tt-pgc-prices {
          display: flex;
          gap: 9px;
          font-size: 0.73rem;
          color: var(--tt-text-muted);
        }
        .tt-pgc-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tt-mini-step {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 1rem;
          font-weight: 900;
        }
        .tt-mini-step.is-plus {
          background: #00DC7D;
          border-color: #00DC7D;
          color: #120321;
        }
        .tt-mini-step:disabled {
          opacity: 0.35;
        }
        .tt-pgc-wa-btn {
          min-height: 32px;
          padding: 0 10px;
          border-radius: 10px;
          background: rgba(37, 211, 102, 0.16);
          border: 1px solid rgba(37, 211, 102, 0.4);
          color: #25D366;
          font-size: 0.7rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        /* Alumnos */
        .tt-pst-student-row {
          padding: 11px 12px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-pst-student-row small {
          display: block;
          font-size: 0.7rem;
          color: var(--tt-text-muted);
        }
        .tt-st-level-chip {
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.14);
          color: #00DC7D;
          font-size: 0.62rem;
          font-weight: 900;
        }
        .tt-ps-studio.is-light .tt-st-level-chip {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-st-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tt-st-pill {
          min-height: 30px;
          padding: 0 9px;
          border-radius: 999px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-st-pill.is-ok,
        .tt-st-pill.is-paid {
          background: rgba(0, 220, 125, 0.16);
          border-color: rgba(0, 220, 125, 0.45);
          color: #00DC7D;
        }
        .tt-ps-studio.is-light .tt-st-pill.is-ok,
        .tt-ps-studio.is-light .tt-st-pill.is-paid {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-st-pill.is-due {
          background: rgba(245, 158, 11, 0.16);
          border-color: rgba(245, 158, 11, 0.45);
          color: #F59E0B;
        }
        .tt-st-wa-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(37, 211, 102, 0.16);
          color: #25D366;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* Compensación de Gemas */
        .tt-pst-gems-comp {
          padding: 14px;
          border-radius: 17px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.34);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-pgc-comp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          text-align: center;
        }
        .tt-pgc-comp-grid > div {
          padding: 8px 6px;
          border-radius: 12px;
          background: rgba(250, 249, 245, 0.07);
        }
        .tt-pgc-comp-grid span {
          display: block;
          font-size: 0.6rem;
          opacity: 0.72;
        }
        .tt-pgc-comp-grid strong {
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
        }
        .tt-pst-gems-comp small {
          font-size: 0.71rem;
          opacity: 0.78;
          line-height: 1.4;
        }

        /* Panel Club */
        .tt-pst-club-picker {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .tt-pst-club-chip {
          flex-shrink: 0;
          padding: 6px 12px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.72rem;
          font-weight: 800;
        }
        .tt-pst-club-chip.is-on {
          background: #1E0734;
          border-color: #F59E0B;
          color: #FDE68A;
        }
        .tt-pst-weather-quick {
          padding: 12px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-pst-wq-row {
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .tt-pst-wq-btn {
          min-height: 36px;
          border-radius: 10px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.74rem;
          font-weight: 800;
        }
        .tt-pst-validator-box {
          padding: 14px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-pst-validator-box h3 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.25rem;
        }
        .tt-pst-validator-box p {
          margin: 0;
          font-size: 0.76rem;
          color: var(--tt-text-muted);
        }
        .tt-pst-val-results {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 4px;
        }
        .tt-pst-val-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 13px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
        }
        .tt-pst-val-row strong {
          display: block;
          font-size: 0.84rem;
        }
        .tt-pst-val-row small {
          font-size: 0.69rem;
          color: var(--tt-text-muted);
        }
        .tt-val-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .tt-val-pill.is-vip {
          background: linear-gradient(135deg, #FEF08A 0%, #F59E0B 100%);
          color: #1E1102;
        }
        .tt-val-pill.is-std {
          background: var(--tt-surface-2);
          color: var(--tt-text-muted);
        }
      `}</style>
    </ModalPortal>
  );
}
