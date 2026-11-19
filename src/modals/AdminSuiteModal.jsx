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
import * as TenisEngine from '../utils/tenisEngine';

const { buildWhatsAppLink } = TenisEngine;

function closeSeasonSnapshot(seasonSnapshots, players = []) {
  if (typeof TenisEngine.closeSeasonSnapshot === 'function') {
    return TenisEngine.closeSeasonSnapshot(seasonSnapshots, players);
  }
  const year = seasonSnapshots?.year || new Date().getFullYear();
  const current = Number(seasonSnapshots?.currentSeason) || 1;
  const frozenScores = {};
  (players || []).forEach((p) => {
    frozenScores[p.id] = Number(p.points) || 0;
  });

  const existing = Array.isArray(seasonSnapshots?.seasons)
    ? seasonSnapshots.seasons
    : [1, 2, 3, 4].map((n) => ({
        number: n,
        label: `T${n}`,
        locked: false,
        scores: {},
      }));

  const updatedSeasons = existing.map((s) =>
    s.number === current
      ? { ...s, locked: true, closedAt: new Date().toISOString(), scores: frozenScores }
      : s
  );

  return {
    year: current >= 4 ? year + 1 : year,
    currentSeason: current >= 4 ? 1 : current + 1,
    seasons: updatedSeasons,
  };
}

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (PIN MAESTRO, CAPACIDAD 10,000 Y UMBRAL DE MEMORIA)
   --------------------------------------------------------------------------
   - Cambia tu PIN o la clave temporal de reseteo aquí en 1 segundo.
   ========================================================================== */
export const ADMIN_SUITE_EDITABLE_CONFIG = {
  adminPin: '1234',
  defaultResetPassword: 'Tenis2026',
  vipMonthlyBonusGems: 200,
  maxPlayersCapacity: 10000,
  maxMatchesBuffer: 10000,
  memoryAlertThresholdPct: 75, // Alerta preventiva al 75%-80% de capacidad
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

/* ==========================================================================
   EXPORTADOR EXCEL (.CSV CON BOM UTF-8 PARA ABRIR CON TILDES EN EXCEL)
   ========================================================================== */
function downloadExcelCsv(filename, headers, rows) {
  const escapeCell = (val) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };
  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\r\n');

  // BOM UTF-8 (\uFEFF) para que Microsoft Excel lea tildes y ñ sin caracteres raros
  const blob = new Blob([`\uFEFF${csvLines}`], { type: 'text/csv;charset=utf-8;' });
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
   COMPONENTE PRINCIPAL: AdminSuiteModal (BLOQUE 23 DE 26)
   - Paleta oscura blindada permanente: 100 % legible incluso en Modo Claro.
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

  // Buscador y edición inline en Cuentas
  const [accountSearch, setAccountSearch] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editGems, setEditGems] = useState('');

  // Creador rápido de Torneo Personalizable
  const [showNewTourney, setShowNewTourney] = useState(false);
  const [ntName, setNtName] = useState('');
  const [ntClubId, setNtClubId] = useState(clubs?.[0]?.id || 'club-country');
  const [ntDate, setNtDate] = useState('10 – 19 ENE');
  const [ntDrawSize, setNtDrawSize] = useState(16);
  const [ntFee, setNtFee] = useState(45);
  const [ntIncludesBalls, setNtIncludesBalls] = useState(true);
  const [ntHasConsolation, setNtHasConsolation] = useState(true);

  // Feature Toggles de Clubes y Pro Shop (locales + propagados)
  const [disabledClubIds, setDisabledClubIds] = useState([]);
  const [shopQuickItems, setShopQuickItems] = useState([
    { id: 'ps-encordado', name: 'Encordado Profesional', price: 55, vipPrice: 45, active: true },
    { id: 'ps-pelotas', name: 'Tarro 3 Pelotas Pro', price: 50, vipPrice: 42, active: true },
    { id: 'ps-overgrip', name: 'Overgrip Pro', price: 15, vipPrice: 12, active: true },
    { id: 'ps-raquetero', name: 'Raquetero Térmico 6R', price: 240, vipPrice: 210, active: true },
  ]);

  // CMS de Patrocinadores Nativos (Pestaña 5)
  const [sponsors, setSponsors] = useState(() => {
    if (sponsorsConfig) return sponsorsConfig;
    try {
      const saved = window.localStorage.getItem(ADMIN_SUITE_EDITABLE_CONFIG.sponsorsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // default limpio (cero marcas inventadas)
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

  // Estado de Reclamaciones (fusiona prop + localStorage)
  const [localComplaints, setLocalComplaints] = useState([]);
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isUnlockedInitially) setIsUnlocked(true);
    setPinInput('');
    setPinError('');

    // Cargar reclamaciones guardadas en el dispositivo
    try {
      const raw = window.localStorage.getItem(ADMIN_SUITE_EDITABLE_CONFIG.complaintsStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setLocalComplaints(parsed);
    } catch (e) {
      setLocalComplaints([]);
    }
  }, [isOpen, isUnlockedInitially]);

  const playersMap = useMemo(() => {
    const m = {};
    (players || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [players]);

  // Solicitudes pendientes de VIP y de Torneos
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

  // Partidos en disputa o por auditar
  const disputedChallenges = useMemo(
    () => (challenges || []).filter((c) => c.status === 'DISPUTED' || c.status === 'IN_PLAY'),
    [challenges]
  );

  // Filtrado de cuentas
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

  // Combinación de reclamaciones sin duplicar por código
  const allComplaints = useMemo(() => {
    const map = new Map();
    [...(complaints || []), ...(localComplaints || [])].forEach((c) => {
      if (c?.code) map.set(c.code, c);
    });
    return Array.from(map.values());
  }, [complaints, localComplaints]);

  // Métricas de Almacenamiento y Umbral de Seguridad (sobre 10,000 jugadores)
  const storageStats = useMemo(() => {
    const pCount = players.length;
    const mCount = challenges.length;
    const pPct = Math.min(
      100,
      Math.round((pCount / ADMIN_SUITE_EDITABLE_CONFIG.maxPlayersCapacity) * 100)
    );
    const mPct = Math.min(
      100,
      Math.round((mCount / ADMIN_SUITE_EDITABLE_CONFIG.maxMatchesBuffer) * 100)
    );
    const maxPct = Math.max(pPct, mPct);
    const isWarning = maxPct >= ADMIN_SUITE_EDITABLE_CONFIG.memoryAlertThresholdPct;
    return { pCount, mCount, pPct, mPct, maxPct, isWarning };
  }, [players.length, challenges.length]);

  /* ------------------------------------------------------------------------
     VALIDACIÓN DEL PIN MAESTRO (1234)
     ------------------------------------------------------------------------ */
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
      setPinError('PIN incorrecto. Acceso reservado exclusivamente al organizador.');
    }
  };

  /* ------------------------------------------------------------------------
     ACCIONES ADMINISTRATIVAS (CUENTAS, PAGOS, TEMPORADAS, SPONSORS, BACKUP)
     ------------------------------------------------------------------------ */
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

  const handleResetPasswordOneTap = (p) => {
    triggerHaptic('medium');
    if (onAdminUpdatePlayer) {
      onAdminUpdatePlayer(p.id, {
        password: ADMIN_SUITE_EDITABLE_CONFIG.defaultResetPassword,
      });
    }
    if (onNotify) {
      onNotify(
        `Clave de ${p.name} restablecida a "${ADMIN_SUITE_EDITABLE_CONFIG.defaultResetPassword}".`,
        'success'
      );
    }
  };

  const handleUnlinkEmail = (p) => {
    triggerHaptic('warning');
    if (onAdminUpdatePlayer) {
      onAdminUpdatePlayer(p.id, { email: '' });
    }
    if (onNotify) {
      onNotify(`Correo desvinculado en ${p.name}. Sus puntos e historial siguen intactos.`, 'info');
    }
  };

  const handleTogglePausePlayer = (p) => {
    triggerHaptic('light');
    const nextPaused = !p.isPaused;
    if (onAdminUpdatePlayer) {
      onAdminUpdatePlayer(p.id, { isPaused: nextPaused });
    }
    if (onNotify) {
      onNotify(
        nextPaused
          ? `${p.name} pausado (oculto del Ranking activo sin perder su historial).`
          : `${p.name} reactivado en el Ranking oficial.`,
        'info'
      );
    }
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
        ntIncludesBalls
          ? 'Pelotas presurizadas nuevas incluidas'
          : 'Pelotas por acuerdo en cancha',
        ntHasConsolation
          ? 'Incluye Ronda Consuelo (Copa de Plata)'
          : 'Eliminación directa oficial',
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
    if (onNotify) onNotify(`Torneo "${created.name}" publicado en la pestaña Torneos.`, 'success');
  };

  const handleExecuteSeasonClose = () => {
    triggerHaptic('success');
    const nextSnap = closeSeasonSnapshot(seasonSnapshots, players);
    if (onAdminCloseSeason) onAdminCloseSeason(nextSnap);
    if (onNotify) {
      onNotify(
        `Temporada congelada oficialmente (00:00). Tabla estática anual del Master Top 8 actualizada sin alterar el ELO.`,
        'success'
      );
    }
  };

  const handleSaveSponsorsConfig = (e) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(
        ADMIN_SUITE_EDITABLE_CONFIG.sponsorsStorageKey,
        JSON.stringify(sponsors)
      );
    } catch (err) {
      // continuar
    }
    if (onAdminSaveSponsors) onAdminSaveSponsors(sponsors);
    triggerHaptic('success');
    if (onNotify) onNotify('Configuración de patrocinadores guardada.', 'success');
  };

  const handleToggleComplaintDone = (code) => {
    triggerHaptic('light');
    const updated = allComplaints.map((c) =>
      c.code === code
        ? { ...c, status: c.status === 'ATENDIDA' ? 'REGISTRADA' : 'ATENDIDA' }
        : c
    );
    setLocalComplaints(updated);
    try {
      window.localStorage.setItem(
        ADMIN_SUITE_EDITABLE_CONFIG.complaintsStorageKey,
        JSON.stringify(updated)
      );
    } catch (e) {
      // continuar
    }
  };

  const handleExportPlayersExcel = () => {
    triggerHaptic('success');
    const headers = [
      'ID_Credencial',
      'Nombre',
      'Correo',
      'WhatsApp',
      'Edad',
      'Rama',
      'Club',
      'Categoria',
      'Puntos_Oficiales',
      'Victorias',
      'Derrotas',
      'Gemas',
      'Plan',
      'Estado',
    ];
    const rows = (players || []).map((p) => [
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
    ]);
    downloadExcelCsv(`TotalTenis-Jugadores-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    setHasDownloadedBackup(true);
    if (onNotify) onNotify('Archivo Excel (.csv) de jugadores descargado.', 'success');
  };

  const handleExportMatchesExcel = () => {
    triggerHaptic('success');
    const headers = [
      'ID_Partido',
      'Fecha',
      'Sede',
      'Modalidad',
      'Jugador_A',
      'Jugador_B',
      'Marcador',
      'Ganador',
      'Delta_A',
      'Delta_B',
      'Estado',
    ];
    const rows = (challenges || []).map((c) => [
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
    ]);
    downloadExcelCsv(`TotalTenis-Partidos-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    setHasDownloadedBackup(true);
    if (onNotify) onNotify('Respaldo Excel (.csv) de partidos descargado.', 'success');
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Suite Maestra · Administración"
      subtitle="Panel privado del organizador · TOTAL TENIS"
      icon={<IconBadge name="shield" variant="gold" size={38} />}
      isWide
      isTopLayer
    >
      {/* CONTENEDOR BLINDADO EN PALETA OSCURA PERMANENTE (100 % LEGIBLE EN MODO CLARO) */}
      <div className="tt-adm-shell">
        {!isUnlocked ? (
          /* PANTALLA DE DESBLOQUEO CON PIN PRIVADO */
          <form onSubmit={handleUnlockSubmit} className="tt-adm-lock-screen">
            <div className="tt-adm-lock-icon">
              <TTIcon name="shield" size={34} style={{ color: '#00DC7D' }} />
            </div>
            <h3>Acceso Restringido del Organizador</h3>
            <p>
              Ingresa tu PIN maestro de 4 dígitos para aprobar pagos, gestionar cuentas, cerrar temporadas y administrar el circuito.
            </p>

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
            {/* RESUMEN EJECUTIVO SUPERIOR */}
            <div className="tt-adm-kpi-grid">
              <div>
                <span>JUGADORES</span>
                <strong>{players.length}</strong>
                <small>de {ADMIN_SUITE_EDITABLE_CONFIG.maxPlayersCapacity.toLocaleString('es-PE')}</small>
              </div>
              <div className="is-gold">
                <span>SOCIOS VIP</span>
                <strong>{players.filter((p) => p.isVip).length}</strong>
                <small>{pendingVipPlayers.length} por aprobar</small>
              </div>
              <div className="is-emerald">
                <span>PAGOS TORNEO</span>
                <strong>{pendingTournamentRequests.length}</strong>
                <small>en verificación</small>
              </div>
              <div>
                <span>RECLAMOS</span>
                <strong>{allComplaints.filter((c) => c.status !== 'ATENDIDA').length}</strong>
                <small>pendientes</small>
              </div>
            </div>

            {/* BARRA DE 7 PESTAÑAS OPERATIVAS */}
            <div className="tt-adm-tabs" role="tablist" aria-label="Módulos de Administración">
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

            {/* ==============================================================
                PESTAÑA 1: PAGOS PENDIENTES Y APROBACIÓN DE SOCIOS VIP
                ============================================================== */}
            {activeTab === 'pagos' && (
              <div className="tt-adm-stack">
                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">INSCRIPCIONES A TORNEOS (PAGO EN VERIFICACIÓN)</span>
                  {pendingTournamentRequests.length === 0 ? (
                    <p className="tt-adm-empty">No hay constancias de torneos pendientes por aprobar.</p>
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
                            Aprobar e Inscribir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">SOLICITUDES PASE SOCIO VIP (+{ADMIN_SUITE_EDITABLE_CONFIG.vipMonthlyBonusGems} 💎)</span>
                  {pendingVipPlayers.length === 0 ? (
                    <p className="tt-adm-empty">No hay solicitudes VIP pendientes. Puedes activar VIP directamente desde abajo.</p>
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
                                onAdminApproveVip(p.id, true, ADMIN_SUITE_EDITABLE_CONFIG.vipMonthlyBonusGems);
                              }
                            }}
                          >
                            Activar VIP +200 💎
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">CONTROL DIRECTO DE MEMBRESÍA VIP</span>
                  <div className="tt-adm-list">
                    {players.slice(0, 8).map((p) => (
                      <div key={p.id} className="tt-adm-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{p.name}</strong>
                          <small>
                            {p.isVip ? 'Socio VIP Activo' : 'Plan Estándar'} · {Number(p.gems || 0)} 💎
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

            {/* ==============================================================
                PESTAÑA 2: CUENTAS, SANDBOX, CORREOS Y CLAVES (Tenis2026)
                ============================================================== */}
            {activeTab === 'cuentas' && (
              <div className="tt-adm-stack">
                <input
                  type="search"
                  className="tt-adm-input"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo, WhatsApp o código TT-2026..."
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <strong>{p.name}</strong>
                              {p.isVip && <span className="tt-adm-tag-gold">VIP</span>}
                              {p.isPaused && <span className="tt-adm-tag-red">PAUSADO</span>}
                            </div>
                            <small>
                              {getCategoryByPoints(p.points).name} · {Number(p.points || 0)} pts · {Number(p.gems || 0)} 💎 · {p.email || 'Sin correo'}
                            </small>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="tt-adm-edit-box">
                            <input
                              type="email"
                              className="tt-adm-input"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="Correo electrónico"
                            />
                            <div className="tt-adm-grid-2">
                              <input
                                type="number"
                                className="tt-adm-input"
                                value={editPoints}
                                onChange={(e) => setEditPoints(e.target.value)}
                                placeholder="Puntos"
                              />
                              <input
                                type="number"
                                className="tt-adm-input"
                                value={editGems}
                                onChange={(e) => setEditGems(e.target.value)}
                                placeholder="Gemas"
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 7 }}>
                              <button
                                type="button"
                                className="tt-adm-btn-emerald is-sm"
                                style={{ flex: 1 }}
                                onClick={() => handleSaveAccountEdit(p)}
                              >
                                Guardar cambios
                              </button>
                              <button
                                type="button"
                                className="tt-adm-btn-ghost is-sm"
                                onClick={() => setEditingPlayerId(null)}
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
                                Probar como él (Sandbox)
                              </button>
                            )}
                            <button
                              type="button"
                              className="tt-adm-chip"
                              onClick={() => openEditAccount(p)}
                            >
                              Editar ELO / Gemas
                            </button>
                            <button
                              type="button"
                              className="tt-adm-chip"
                              onClick={() => handleUnlinkEmail(p)}
                            >
                              Desvincular correo
                            </button>
                            <button
                              type="button"
                              className="tt-adm-chip is-gold"
                              onClick={() => handleResetPasswordOneTap(p)}
                            >
                              Clave → Tenis2026
                            </button>
                            <button
                              type="button"
                              className="tt-adm-chip"
                              onClick={() => handleTogglePausePlayer(p)}
                            >
                              {p.isPaused ? 'Reactivar' : 'Pausar'}
                            </button>
                            {onAdminDeletePlayer && (
                              <button
                                type="button"
                                className="tt-adm-chip is-danger"
                                onClick={() => {
                                  triggerHaptic('warning');
                                  onAdminDeletePlayer(p.id);
                                }}
                              >
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

            {/* ==============================================================
                PESTAÑA 3: CIERRE DE TEMPORADA (00:00), TORNEOS Y DISPUTAS
                ============================================================== */}
            {activeTab === 'temporadas' && (
              <div className="tt-adm-stack">
                {/* Cierre Oficial de Trimestre hacia Tabla Estática Master Top 8 */}
                <div className="tt-adm-panel is-highlight">
                  <span className="tt-adm-kicker">TABLA ESTÁTICA 4 TEMPORADAS · MASTER TOP 8</span>
                  <h4 style={{ margin: '2px 0 4px' }}>
                    Temporada actual activa: T{seasonSnapshots?.currentSeason || 4} ({seasonSnapshots?.year || new Date().getFullYear()})
                  </h4>
                  <p className="tt-adm-subcopy">
                    Congela a las 00:00 los puntajes actuales en la tabla anual independiente del Master Top 8 sin alterar ni reiniciar el Ranking ELO en vivo.
                  </p>
                  <button
                    type="button"
                    className="tt-adm-btn-gold"
                    onClick={handleExecuteSeasonClose}
                  >
                    Congelar Trimestre Actual en Tabla Master Top 8
                  </button>
                </div>

                {/* Creador Rápido de Torneo Personalizable */}
                <div className="tt-adm-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="tt-adm-kicker" style={{ margin: 0 }}>
                      CREAR TORNEO PERSONALIZABLE
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
                    <form onSubmit={handleCreateCustomTournament} className="tt-adm-form-stack" style={{ marginTop: 10 }}>
                      <input
                        type="text"
                        className="tt-adm-input"
                        value={ntName}
                        onChange={(e) => setNtName(e.target.value)}
                        placeholder="Nombre del torneo (ej. Abierto de Verano · 4ª Cat.)"
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
                          type="text"
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
                          <option value={16}>Cuadro 16 (desde Octavos)</option>
                          <option value={8}>Cuadro 8 (desde Cuartos)</option>
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
                          {ntIncludesBalls ? '✓ Incluye pelotas' : 'Sin pelotas'}
                        </button>
                        <button
                          type="button"
                          className={`tt-adm-chip ${ntHasConsolation ? 'is-emerald' : ''}`}
                          onClick={() => setNtHasConsolation((v) => !v)}
                        >
                          {ntHasConsolation ? '✓ Ronda Consuelo ON' : 'Ronda Consuelo OFF'}
                        </button>
                      </div>
                      <button type="submit" className="tt-adm-btn-emerald">
                        Publicar Torneo Oficial
                      </button>
                    </form>
                  )}
                </div>

                {/* Bandeja de Disputas / Partidos en Curso */}
                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">RESOLUCIÓN DE DISPUTAS Y PARTIDOS EN CANCHA</span>
                  {disputedChallenges.length === 0 ? (
                    <p className="tt-adm-empty">Sin disputas abiertas. Todos los marcadores están en orden.</p>
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
                              {ch.clubName} · Estado: {ch.status}
                            </small>
                          </div>
                          {onAdminResolveDispute && (
                            <button
                              type="button"
                              className="tt-adm-chip is-danger"
                              onClick={() => {
                                triggerHaptic('warning');
                                onAdminResolveDispute(ch.id, 'CANCEL');
                              }}
                            >
                              Anular
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================
                PESTAÑA 4: CLUBES ALIADOS (FEATURE TOGGLES) & PRO SHOP
                ============================================================== */}
            {activeTab === 'clubshop' && (
              <div className="tt-adm-stack">
                <div className="tt-adm-panel">
                  <span className="tt-adm-kicker">FEATURE TOGGLES · SEDES OFICIALES (ON / OFF SIN BORRAR)</span>
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
                  <span className="tt-adm-kicker">STOCK Y TARIFAS RÁPIDAS · PRO SHOP</span>
                  <div className="tt-adm-list">
                    {shopQuickItems.map((it) => (
                      <div key={it.id} className="tt-adm-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{it.name}</strong>
                          <small>
                            Regular: S/ {it.price} · Socio VIP: S/ {it.vipPrice}
                          </small>
                        </div>
                        <button
                          type="button"
                          className={`tt-adm-chip ${it.active ? 'is-emerald' : 'is-danger'}`}
                          onClick={() => {
                            triggerHaptic('light');
                            setShopQuickItems((prev) =>
                              prev.map((x) => (x.id === it.id ? { ...x, active: !x.active } : x))
                            );
                          }}
                        >
                          {it.active ? 'En stock' : 'Agotado'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================
                PESTAÑA 5: CMS DE PATROCINADORES NATIVOS (CERO MARCAS FALSAS)
                ============================================================== */}
            {activeTab === 'sponsors' && (
              <form onSubmit={handleSaveSponsorsConfig} className="tt-adm-panel tt-adm-form-stack">
                <span className="tt-adm-kicker">MONETIZACIÓN NATIVA · PATROCINADORES REALES</span>
                <p className="tt-adm-subcopy">
                  Activa los espacios solo cuando cierres convenio comercial real en Huancayo.
                </p>

                <div className="tt-adm-toggle-line">
                  <div>
                    <strong>Title Sponsor (Co-branding TOTAL TENIS | Marca)</strong>
                    <small>Aparece en cabecera y pie de Stories 9:16.</small>
                  </div>
                  <button
                    type="button"
                    className={`tt-adm-chip ${sponsors.titleSponsorActive ? 'is-emerald' : ''}`}
                    onClick={() =>
                      setSponsors((s) => ({ ...s, titleSponsorActive: !s.titleSponsorActive }))
                    }
                  >
                    {sponsors.titleSponsorActive ? 'ON' : 'OFF'}
                  </button>
                </div>

                <input
                  type="text"
                  className="tt-adm-input"
                  value={sponsors.titleSponsorName}
                  onChange={(e) => setSponsors((s) => ({ ...s, titleSponsorName: e.target.value }))}
                  placeholder="Nombre del Sponsor Principal (ej. Clínica Deportiva Junín)"
                />

                <div className="tt-adm-toggle-line">
                  <div>
                    <strong>Auspiciador Widget Hora & Clima</strong>
                    <small>Acompaña el reloj analógico y clima UV en Retos.</small>
                  </div>
                  <button
                    type="button"
                    className={`tt-adm-chip ${sponsors.weatherSponsorActive ? 'is-emerald' : ''}`}
                    onClick={() =>
                      setSponsors((s) => ({ ...s, weatherSponsorActive: !s.weatherSponsorActive }))
                    }
                  >
                    {sponsors.weatherSponsorActive ? 'ON' : 'OFF'}
                  </button>
                </div>

                <input
                  type="text"
                  className="tt-adm-input"
                  value={sponsors.weatherSponsorName}
                  onChange={(e) => setSponsors((s) => ({ ...s, weatherSponsorName: e.target.value }))}
                  placeholder="Nombre del Sponsor de Clima (opcional)"
                />

                <label className="tt-adm-lbl">
                  <span>Premio del Sorteo Mensual (Pro Shop)</span>
                  <input
                    type="text"
                    className="tt-adm-input"
                    value={sponsors.rafflePrizeText}
                    onChange={(e) => setSponsors((s) => ({ ...s, rafflePrizeText: e.target.value }))}
                  />
                </label>

                <button type="submit" className="tt-adm-btn-emerald">
                  Guardar Configuración de Patrocinadores
                </button>
              </form>
            )}

            {/* ==============================================================
                PESTAÑA 6: LIBRO DE RECLAMACIONES (BANDEJA INDECOPI)
                ============================================================== */}
            {activeTab === 'reclamaciones' && (
              <div className="tt-adm-panel">
                <span className="tt-adm-kicker">HOJAS DE RECLAMACIÓN REGISTRADAS (PLAZO 15 DÍAS HÁBILES)</span>
                {allComplaints.length === 0 ? (
                  <p className="tt-adm-empty">No hay hojas de reclamación registradas hasta el momento.</p>
                ) : (
                  <div className="tt-adm-list">
                    {allComplaints.map((c) => (
                      <div key={c.code} className="tt-adm-account-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <strong style={{ color: '#FDE68A' }}>
                            {c.code} · {c.type}
                          </strong>
                          <span className={c.status === 'ATENDIDA' ? 'tt-adm-tag-emerald' : 'tt-adm-tag-gold'}>
                            {c.status}
                          </span>
                        </div>
                        <small style={{ color: 'rgba(250,249,245,0.85)' }}>
                          {c.fullName} ({c.docType} {c.docNumber}) · {c.createdAtFormatted}
                        </small>
                        <p className="tt-adm-subcopy" style={{ margin: '4px 0' }}>
                          {c.detail}
                        </p>
                        <div className="tt-adm-acc-actions">
                          <button
                            type="button"
                            className="tt-adm-chip is-emerald"
                            onClick={() => handleToggleComplaintDone(c.code)}
                          >
                            {c.status === 'ATENDIDA' ? 'Reabrir' : 'Marcar Atendida'}
                          </button>
                          {c.phone && (
                            <a
                              href={buildWhatsAppLink(
                                c.phone,
                                `Hola ${c.fullName}, te contactamos de TOTAL TENIS en respuesta a tu Hoja de Reclamación ${c.code}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tt-adm-chip"
                              style={{ textDecoration: 'none' }}
                            >
                              Responder WhatsApp ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==============================================================
                PESTAÑA 7: RESPALDO EXCEL (.CSV) Y UMBRAL DE MEMORIA (10,000)
                ============================================================== */}
            {activeTab === 'respaldo' && (
              <div className="tt-adm-stack">
                <div className={`tt-adm-panel ${storageStats.isWarning ? 'is-alert' : ''}`}>
                  <span className="tt-adm-kicker">CAPACIDAD OPERATIVA Y UMBRAL AUTOMÁTICO</span>
                  <div className="tt-adm-mem-row">
                    <span>Jugadores registrados</span>
                    <strong>
                      {storageStats.pCount.toLocaleString('es-PE')} /{' '}
                      {ADMIN_SUITE_EDITABLE_CONFIG.maxPlayersCapacity.toLocaleString('es-PE')} ({storageStats.pPct}%)
                    </strong>
                  </div>
                  <div className="tt-adm-bar">
                    <div style={{ width: `${Math.max(2, storageStats.pPct)}%` }} />
                  </div>

                  <div className="tt-adm-mem-row" style={{ marginTop: 10 }}>
                    <span>Historial de partidos en búfer</span>
                    <strong>
                      {storageStats.mCount.toLocaleString('es-PE')} /{' '}
                      {ADMIN_SUITE_EDITABLE_CONFIG.maxMatchesBuffer.toLocaleString('es-PE')} ({storageStats.mPct}%)
                    </strong>
                  </div>
                  <div className="tt-adm-bar">
                    <div style={{ width: `${Math.max(2, storageStats.mPct)}%` }} />
                  </div>

                  {storageStats.isWarning && (
                    <p className="tt-adm-alert-msg">
                      Alerta de Almacenamiento: memoria sobre el {ADMIN_SUITE_EDITABLE_CONFIG.memoryAlertThresholdPct}% de capacidad recomendada. Descarga tu respaldo Excel para archivar en Google Drive y liberar espacio.
                    </p>
                  )}
                </div>

                <div className="tt-adm-panel tt-adm-form-stack">
                  <span className="tt-adm-kicker">EXPORTACIÓN EXCEL (.CSV UTF-8) Y PURGA CONTROLADA</span>
                  <div className="tt-adm-grid-2">
                    <button
                      type="button"
                      className="tt-adm-btn-emerald"
                      onClick={handleExportPlayersExcel}
                    >
                      Descargar Excel Jugadores
                    </button>
                    <button
                      type="button"
                      className="tt-adm-btn-gold"
                      onClick={handleExportMatchesExcel}
                    >
                      Descargar Excel Partidos
                    </button>
                  </div>

                  <button
                    type="button"
                    className="tt-adm-btn-danger"
                    disabled={!hasDownloadedBackup}
                    onClick={() => {
                      triggerHaptic('warning');
                      if (onAdminPurgeArchivedMatches) onAdminPurgeArchivedMatches();
                      if (onNotify) {
                        onNotify(
                          'Partidos antiguos archivados purgados. Perfiles, puntos y clasificaciones siguen 100 % intactos.',
                          'success'
                        );
                      }
                    }}
                  >
                    {hasDownloadedBackup
                      ? 'Liberar Partidos Archivados (Conserva Perfiles y ELO)'
                      : 'Descarga primero un respaldo Excel para habilitar la purga'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================================================================
          ESTILOS ENCAPSULADOS BLINDADOS EN PALETA OSCURA PERMANENTE (#1E0734)
          Garantiza contraste AAA incluso si el usuario usa Modo Claro.
          ==================================================================== */}
      <style>{`
        .tt-adm-shell {
          border-radius: 20px;
          padding: 15px;
          background: linear-gradient(180deg, #1E0734 0%, #120321 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.35);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-adm-shell * {
          box-sizing: border-box;
        }

        /* Pantalla de PIN */
        .tt-adm-lock-screen {
          padding: 20px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 11px;
        }
        .tt-adm-lock-icon {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          background: rgba(0, 220, 125, 0.14);
          border: 1.5px solid rgba(0, 220, 125, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tt-adm-lock-screen h3 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.4rem;
          color: #FAF9F5;
        }
        .tt-adm-lock-screen p {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.44;
          color: rgba(250, 249, 245, 0.76);
          max-width: 380px;
        }
        .tt-adm-pin-input {
          width: 180px;
          height: 52px;
          border-radius: 14px;
          background: rgba(250, 249, 245, 0.1);
          border: 1.5px solid #00DC7D;
          color: #FAF9F5;
          text-align: center;
          font-size: 1.65rem;
          letter-spacing: 0.35em;
          font-weight: 900;
          outline: none;
        }
        .tt-adm-pin-error {
          font-size: 0.75rem;
          font-weight: 800;
          color: #FCA5A5;
        }

        /* Cuerpo Admin */
        .tt-adm-body,
        .tt-adm-stack,
        .tt-adm-form-stack,
        .tt-adm-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
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
          border-radius: 14px;
          background: rgba(250, 249, 245, 0.07);
          border: 1px solid rgba(250, 249, 245, 0.12);
          text-align: center;
        }
        .tt-adm-kpi-grid span {
          display: block;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: rgba(250, 249, 245, 0.65);
        }
        .tt-adm-kpi-grid strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.48rem;
          line-height: 1.05;
          color: #FAF9F5;
        }
        .tt-adm-kpi-grid .is-gold strong {
          color: #FDE68A;
        }
        .tt-adm-kpi-grid .is-emerald strong {
          color: #00DC7D;
        }
        .tt-adm-kpi-grid small {
          font-size: 0.64rem;
          color: rgba(250, 249, 245, 0.66);
        }

        /* Tabs Admin */
        .tt-adm-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tt-adm-tabs::-webkit-scrollbar {
          display: none;
        }
        .tt-adm-tab {
          flex-shrink: 0;
          min-height: 36px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.08);
          border: 1px solid rgba(250, 249, 245, 0.14);
          color: rgba(250, 249, 245, 0.78);
          font-size: 0.73rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .tt-adm-tab.is-active {
          background: #00DC7D;
          border-color: #00DC7D;
          color: #120321;
          font-weight: 900;
        }

        .tt-adm-panel {
          padding: 13px;
          border-radius: 16px;
          background: rgba(250, 249, 245, 0.06);
          border: 1px solid rgba(250, 249, 245, 0.12);
        }
        .tt-adm-panel.is-highlight {
          border-color: rgba(245, 158, 11, 0.55);
          background: rgba(245, 158, 11, 0.08);
        }
        .tt-adm-panel.is-alert {
          border-color: #F87171;
          background: rgba(248, 113, 113, 0.12);
        }
        .tt-adm-kicker {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
          margin-bottom: 9px;
        }
        .tt-adm-empty,
        .tt-adm-subcopy {
          margin: 0;
          font-size: 0.76rem;
          line-height: 1.42;
          color: rgba(250, 249, 245, 0.74);
        }

        .tt-adm-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 12px;
          background: rgba(18, 3, 33, 0.65);
          border: 1px solid rgba(250, 249, 245, 0.1);
        }
        .tt-adm-row strong {
          display: block;
          font-size: 0.82rem;
          color: #FAF9F5;
        }
        .tt-adm-row small {
          display: block;
          font-size: 0.69rem;
          color: rgba(250, 249, 245, 0.68);
        }

        /* Tarjetas de Cuenta */
        .tt-adm-account-card {
          padding: 11px;
          border-radius: 14px;
          background: rgba(18, 3, 33, 0.7);
          border: 1px solid rgba(250, 249, 245, 0.12);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-adm-account-card.is-paused {
          opacity: 0.68;
          border-style: dashed;
        }
        .tt-adm-acc-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-adm-acc-top strong {
          font-size: 0.86rem;
          color: #FAF9F5;
        }
        .tt-adm-acc-top small {
          display: block;
          font-size: 0.69rem;
          color: rgba(250, 249, 245, 0.7);
        }
        .tt-adm-acc-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tt-adm-edit-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 4px;
        }

        /* Inputs y Botones de Alto Contraste */
        .tt-adm-input {
          width: 100%;
          min-height: 42px;
          padding: 0 12px;
          border-radius: 12px;
          background: #140324;
          border: 1px solid rgba(250, 249, 245, 0.22);
          color: #FAF9F5;
          font-size: 0.84rem;
        }
        .tt-adm-input::placeholder {
          color: rgba(250, 249, 245, 0.48);
        }
        .tt-adm-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-adm-lbl {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 0.73rem;
          font-weight: 800;
          color: rgba(250, 249, 245, 0.8);
        }
        .tt-adm-toggle-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-adm-toggle-line strong {
          display: block;
          font-size: 0.8rem;
        }
        .tt-adm-toggle-line small {
          display: block;
          font-size: 0.69rem;
          color: rgba(250, 249, 245, 0.68);
        }

        .tt-adm-btn-emerald,
        .tt-adm-btn-gold,
        .tt-adm-btn-ghost,
        .tt-adm-btn-danger {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .tt-adm-btn-emerald.is-sm,
        .tt-adm-btn-gold.is-sm,
        .tt-adm-btn-ghost.is-sm {
          min-height: 34px;
          padding: 0 11px;
          font-size: 0.72rem;
        }
        .tt-adm-btn-emerald {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }
        .tt-adm-btn-gold {
          background: linear-gradient(135deg, #FEF08A 0%, #F59E0B 100%);
          color: #1E1102;
        }
        .tt-adm-btn-ghost {
          background: rgba(250, 249, 245, 0.12);
          color: #FAF9F5;
        }
        .tt-adm-btn-danger {
          background: rgba(248, 113, 113, 0.2);
          border: 1px solid rgba(248, 113, 113, 0.5);
          color: #FECACA;
        }
        .tt-adm-btn-danger:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .tt-adm-chip {
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.1);
          border: 1px solid rgba(250, 249, 245, 0.18);
          color: #FAF9F5;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-adm-chip.is-emerald {
          background: rgba(0, 220, 125, 0.18);
          border-color: #00DC7D;
          color: #7CF5C0;
        }
        .tt-adm-chip.is-gold {
          background: rgba(245, 158, 11, 0.2);
          border-color: #F59E0B;
          color: #FDE68A;
        }
        .tt-adm-chip.is-danger {
          background: rgba(248, 113, 113, 0.18);
          border-color: #F87171;
          color: #FECACA;
        }

        .tt-adm-tag-gold,
        .tt-adm-tag-emerald,
        .tt-adm-tag-red {
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.58rem;
          font-weight: 900;
        }
        .tt-adm-tag-gold {
          background: #F59E0B;
          color: #1E1102;
        }
        .tt-adm-tag-emerald {
          background: #00DC7D;
          color: #120321;
        }
        .tt-adm-tag-red {
          background: #EF4444;
          color: #FFFFFF;
        }

        /* Medidor de Memoria */
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
          background: linear-gradient(90deg, #00DC7D 0%, #F59E0B 100%);
        }
        .tt-adm-alert-msg {
          margin: 10px 0 0;
          font-size: 0.75rem;
          font-weight: 800;
          color: #FECACA;
        }
      `}</style>
    </ModalPortal>
  );
}
