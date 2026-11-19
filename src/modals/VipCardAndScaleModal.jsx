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
  CATEGORIES_SCALE,
  getCategoryByPoints,
  getClubById,
  INITIAL_CLUBS,
} from '../data/playersAndClubsData';
import { buildWhatsAppLink } from '../utils/tenisEngine';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (PRECIOS VIP, ARTE CANVA PRO, PAGOS Y BENEFICIOS)
   --------------------------------------------------------------------------
   - Cambia cualquier tarifa, texto o ruta de imagen aquí y toda la pantalla
     se actualizará automáticamente sin tocar lógica ni estilos.
   ========================================================================== */
export const VIP_AND_SCALE_EDITABLE_CONFIG = {
  gemsPerSol: APP_CONFIG.gemsPerSol || 20, // 20 Gemas = S/ 1.00
  monthlyGemsIncluded: 200, // +200 Gemas mensuales incluidas (= S/ 10.00 en Pro Shop)
  savingsPerHourSoles: 8, // Ahorro promedio VIP por hora en canchas aliadas (13h = S/ 104)
  cardArtwork: {
    frontImage: '/assets/carnet-vip-anverso.png',
    backImage: '/assets/carnet-vip-reverso.png',
  },
  payment: {
    yapePlin: APP_CONFIG.paymentYapePlin || '964 812 340',
    holder: APP_CONFIG.paymentHolder || 'TOTAL TENIS · Membresía Oficial',
    bankName: APP_CONFIG.paymentBank || 'BCP Soles',
    bankAccount: APP_CONFIG.paymentBankAccount || '355-98412031-0-42',
    cci: APP_CONFIG.paymentCci || '002-355-198412031042-61',
  },
  plans: [
    {
      id: 'vip-mensual',
      name: 'Mensual',
      price: 29.9,
      periodLabel: '/ mes',
      badge: 'MÁS POPULAR',
      saveLabel: 'Se paga solo jugando 4 h/mes',
    },
    {
      id: 'vip-trimestral',
      name: 'Temporada (3 meses)',
      price: 79.9,
      periodLabel: '/ 3 meses',
      badge: 'AHORRAS 11%',
      saveLabel: 'Cubre 1 temporada completa',
    },
    {
      id: 'vip-anual',
      name: 'Anual Maestro',
      price: 269.0,
      periodLabel: '/ año',
      badge: 'MEJOR VALOR',
      saveLabel: '25% menos · 4 temporadas + Master',
    },
  ],
  visualBenefits: [
    {
      id: 'ben-golden',
      title: 'Golden Ticket en 4 Sedes',
      highlight: '-15% a -20% en cancha',
      desc: 'Presenta tu Carnet 3D en recepción y ahorra de S/ 5 a S/ 10 por hora.',
      image: '/assets/canva-golden-ticket.png',
      fallback: ASSETS.logo,
      accent: '#F59E0B',
    },
    {
      id: 'ben-gems',
      title: '+200 Gemas cada mes',
      highlight: 'Multiplicador ×2.5',
      desc: 'Recibes 200 Gemas al renovar y aceleras tu saldo en rachas y victorias.',
      image: '/assets/fuego-racha-3d.png',
      fallback: ASSETS.logo,
      accent: '#00DC7D',
    },
    {
      id: 'ben-shop',
      title: 'Tarifa Socio en Pro Shop',
      highlight: 'Canje 100 % Gemas',
      desc: 'Descuentos directos en encordados, pelotas y canje completo habilitado.',
      image: '/assets/pelota-3d-volt-azul.png',
      fallback: ASSETS.logo,
      accent: '#38BDF8',
    },
    {
      id: 'ben-tourney',
      title: 'Prioridad en Torneos',
      highlight: 'Cupos y Clases VIP',
      desc: 'Acceso preferente a cuadros oficiales y tarifa VIP con Coaches aliados.',
      image: ASSETS.gifCelebracion2 || '/assets/gif-celebracion-2.gif',
      fallback: ASSETS.trofeoMasterTop8,
      accent: '#C85A32',
    },
  ],
  visualRulesCards: [
    {
      id: 'rule-games',
      kicker: 'CADA GAME CUENTA',
      title: 'Dominio premiado · Pelea protegida',
      bullets: [
        'Ganar 6-0, 6-0 otorga el 100 % del techo.',
        'Perder en 3 sets o tie-break protege tu puntaje.',
      ],
      image: '/assets/pelota-3d-volt-azul.png',
      accent: '#00DC7D',
    },
    {
      id: 'rule-calib',
      kicker: 'PRIMEROS 5 PARTIDOS',
      title: 'Fase de Calibración Oficial',
      bullets: [
        'Tus primeros 5 partidos fijan tu nivel real.',
        'Ventana de retos oficiales: ±1,200 pts.',
      ],
      image: '/assets/fuego-racha-3d.png',
      accent: '#38BDF8',
    },
    {
      id: 'rule-rematch',
      kicker: 'JUEGO LIMPIO',
      title: 'Revanchas flexibles sin bloqueos',
      bullets: [
        '1º duelo semanal: 100 % · 2º: 75 % · 3º+: 50 %.',
        'Se reinicia al 100 % cada lunes automáticamente.',
      ],
      image: '/assets/canva-golden-ticket.png',
      accent: '#F59E0B',
    },
    {
      id: 'rule-master',
      kicker: '4 TEMPORADAS AL AÑO',
      title: 'Carrera al Master Top 8',
      bullets: [
        'Al cierre trimestral tus puntos se congelan en la tabla anual.',
        'Los puestos #1 al #8 juegan el Master sin costo.',
      ],
      image: ASSETS.trofeoMasterTop8,
      accent: '#C85A32',
    },
  ],
};

/* ==========================================================================
   METADATOS HERÁLDICOS PARA CADA NIVEL DEL MAPA DE CATEGORÍAS
   ========================================================================== */
function getTierVisualMeta(catId) {
  switch (catId) {
    case '5p':
      return { tier: 'INICIACIÓN', note: 'Primeros peloteos y saque base', badge: 'shield' };
    case '5b':
      return { tier: 'INICIAL', note: 'Peloteo regular y control de red', badge: 'shield' };
    case '5a':
      return { tier: 'CONSOLIDADO', note: 'Saque estable y partidos completos', badge: 'challenge' };
    case '4a':
      return { tier: 'COMPETITIVO', note: 'Topspin, slice y ritmo de club', badge: 'trophy' };
    case '3a':
      return { tier: 'PRIMERA FUERZA', note: 'Campeones locales y alto ritmo', badge: 'crown' };
    default:
      return { tier: 'ÉLITE LIBRE', note: 'Máximo escalafón del circuito', badge: 'crown' };
  }
}

/* ==========================================================================
   SUBCOMPONENTE: CARNET DIGITAL 3D INTERACTIVO (ANVERSO + REVERSO + GIRO 3D)
   - Monta automáticamente carnet-vip-anverso.png y carnet-vip-reverso.png
     cuando los subas a public/assets/, con fallback metálico de lujo.
   ========================================================================== */
function InteractiveVipCard3D({ player, club, category, isPendingPayment }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [frontArtLoaded, setFrontArtLoaded] = useState(false);
  const [backArtLoaded, setBackArtLoaded] = useState(false);

  const isVip = Boolean(player?.isVip);
  const memberCode = player?.credentialId || 'TT-2026-0041';
  const holderName = (player?.name || 'SOCIO TOTAL TENIS').toUpperCase();
  const validYear = new Date().getFullYear();

  const handlePointerMove = (e) => {
    if (typeof document !== 'undefined' && document.documentElement.dataset.tier === 'lite') {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-py * 11).toFixed(2)),
      ry: Number((px * 13).toFixed(2)),
    });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div className="tt-vip3d-wrapper">
      <div
        className="tt-vip3d-scene"
        onMouseMove={handlePointerMove}
        onMouseLeave={resetTilt}
        onClick={() => {
          triggerHaptic('light');
          setIsFlipped((v) => !v);
        }}
        role="button"
        tabIndex={0}
        aria-label="Girar Carnet Digital 3D para ver anverso y reverso"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsFlipped((v) => !v);
          }
        }}
      >
        <div
          className={`tt-vip3d-card ${isFlipped ? 'is-flipped' : ''}`}
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${
              isFlipped ? 180 + tilt.ry : tilt.ry
            }deg)`,
          }}
        >
          {/* CARA FRONTAL (ANVERSO) */}
          <div className={`tt-vip3d-face is-front ${isVip ? 'is-gold' : 'is-std'}`}>
            {/* Soporte nativo para arte personalizado Canva Pro */}
            <img
              src={VIP_AND_SCALE_EDITABLE_CONFIG.cardArtwork.frontImage}
              alt=""
              className={`tt-vip3d-custom-art ${frontArtLoaded ? 'is-visible' : ''}`}
              onLoad={() => setFrontArtLoaded(true)}
              onError={() => setFrontArtLoaded(false)}
            />

            {/* Líneas tenues grabadas de pista si aún no se carga arte Canva */}
            {!frontArtLoaded && <div className="tt-vip3d-etched-court" aria-hidden="true" />}

            {/* Datos dinámicos superpuestos con alta nitidez */}
            <div className="tt-vip3d-layer">
              <div className="tt-vip3d-top">
                <div className="tt-vip3d-brand-pair">
                  <SmartImage
                    src={ASSETS.logo}
                    alt="TOTAL TENIS"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid rgba(250, 249, 245, 0.35)',
                    }}
                  />
                  <span>TOTAL TENIS</span>
                </div>

                <span className={`tt-vip3d-status ${isVip ? 'is-gold' : isPendingPayment ? 'is-pending' : ''}`}>
                  {isVip ? 'SOCIO VIP' : isPendingPayment ? 'EN VERIFICACIÓN' : 'ESTÁNDAR'}
                </span>
              </div>

              <div className="tt-vip3d-middle">
                <SmartImage
                  src={player?.avatar}
                  alt={holderName}
                  initials={player?.name || 'TT'}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 15,
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    border: isVip
                      ? '2px solid #F59E0B'
                      : '1.5px solid rgba(250, 249, 245, 0.4)',
                    flexShrink: 0,
                  }}
                />

                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong className="tt-vip3d-holder">{holderName}</strong>
                  <span className="tt-vip3d-code">{memberCode}</span>
                  <small className="tt-vip3d-club-cat">
                    {category.name} · {club ? club.shortName : 'Independiente'}
                  </small>
                </div>

                {/* Chip holográfico discreto */}
                <div className="tt-vip3d-chip" aria-hidden="true">
                  <span />
                </div>
              </div>

              <div className="tt-vip3d-bottom">
                <div>
                  <small>VÁLIDO TEMPORADA</small>
                  <strong>{validYear} · {Number(player?.points || 0).toLocaleString('es-PE')} PTS</strong>
                </div>
                <span className="tt-vip3d-flip-hint">Toca para girar ↻</span>
              </div>
            </div>
          </div>

          {/* CARA TRASERA (REVERSO CON QR VERIFICABLE Y CÓDIGO DE BARRAS) */}
          <div className={`tt-vip3d-face is-back ${isVip ? 'is-gold' : 'is-std'}`}>
            <img
              src={VIP_AND_SCALE_EDITABLE_CONFIG.cardArtwork.backImage}
              alt=""
              className={`tt-vip3d-custom-art ${backArtLoaded ? 'is-visible' : ''}`}
              onLoad={() => setBackArtLoaded(true)}
              onError={() => setBackArtLoaded(false)}
            />

            <div className="tt-vip3d-layer is-back-layout">
              <div className="tt-vip3d-magstrip">
                <span>CREDENCIAL VERIFICABLE · 4 SEDES OFICIALES</span>
              </div>

              <div className="tt-vip3d-back-center">
                <div className="tt-vip3d-qr-frame" aria-label={`Código QR de ${memberCode}`}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="4" y="4" width="18" height="18" rx="3" stroke="#1E0734" strokeWidth="3.5" />
                    <rect x="9" y="9" width="8" height="8" rx="1.5" fill="#1E0734" />
                    <rect x="42" y="4" width="18" height="18" rx="3" stroke="#1E0734" strokeWidth="3.5" />
                    <rect x="47" y="9" width="8" height="8" rx="1.5" fill="#1E0734" />
                    <rect x="4" y="42" width="18" height="18" rx="3" stroke="#1E0734" strokeWidth="3.5" />
                    <rect x="9" y="47" width="8" height="8" rx="1.5" fill="#1E0734" />
                    <path
                      d="M28 6H34V12H28V6ZM28 18H36V24H28V18ZM6 28H14V34H6V28ZM20 28H28V36H20V28ZM34 28H44V34H34V28ZM50 28H60V36H50V28ZM28 42H36V50H28V42ZM42 42H52V48H42V42ZM42 54H60V60H42V54ZM28 54H36V60H28V54Z"
                      fill="#1E0734"
                    />
                  </svg>
                </div>

                <div className="tt-vip3d-back-info">
                  <small>ID DE VERIFICACIÓN EN RECEPCIÓN</small>
                  <strong>{memberCode}</strong>
                  <span>
                    Saldo actual: {Number(player?.gems || 0).toLocaleString('es-PE')} 💎 · 20 💎 = S/ 1.00
                  </span>
                </div>
              </div>

              {/* Código de barras decorativo verificable */}
              <div className="tt-vip3d-barcode" aria-hidden="true">
                {[3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4].map(
                  (w, i) => (
                    <span key={i} style={{ width: w * 2 }} />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="tt-vip3d-flip-btn"
        onClick={() => {
          triggerHaptic('light');
          setIsFlipped((v) => !v);
        }}
      >
        ↻ {isFlipped ? 'Ver Anverso del Carnet' : 'Ver Reverso con QR Verificable'}
      </button>
    </div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: VipCardAndScaleModal (BLOQUE 19 DE 26)
   ========================================================================== */
export default function VipCardAndScaleModal({
  isOpen = false,
  initialTab = 'vip', // 'vip' (Pase Socio VIP & Carnet 3D) | 'escala' (Mapa Categorías & Reglas ELO)
  onClose,
  currentUser = null,
  clubs = INITIAL_CLUBS,
  theme = 'dark',
  onRequestVipUpgrade,
  onOpenAuth,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPlanId, setSelectedPlanId] = useState(VIP_AND_SCALE_EDITABLE_CONFIG.plans[0].id);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [localPendingVip, setLocalPendingVip] = useState(false);

  // Deslizador interactivo de la Calculadora de Ahorro (default 13 h/mes = S/ 104.00/mes)
  const [hoursPerMonth, setHoursPerMonth] = useState(13);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'escala' ? 'escala' : 'vip');
      setShowPaymentStep(false);
    }
  }, [isOpen, initialTab]);

  const isVip = Boolean(currentUser?.isVip);
  const isPendingVip = Boolean(currentUser?.vipStatus === 'PENDING_PAYMENT') || localPendingVip;
  const userPoints = Number(currentUser?.points) || 0;
  const userCategory = getCategoryByPoints(userPoints);
  const userClub = getClubById(clubs, currentUser?.clubId);

  const selectedPlan = useMemo(
    () =>
      VIP_AND_SCALE_EDITABLE_CONFIG.plans.find((p) => p.id === selectedPlanId) ||
      VIP_AND_SCALE_EDITABLE_CONFIG.plans[0],
    [selectedPlanId]
  );

  // Cálculo transparente de ahorro mensual VIP
  const savingsCalc = useMemo(() => {
    const courtSavings = hoursPerMonth * VIP_AND_SCALE_EDITABLE_CONFIG.savingsPerHourSoles;
    const gemsSolesValue =
      VIP_AND_SCALE_EDITABLE_CONFIG.monthlyGemsIncluded /
      VIP_AND_SCALE_EDITABLE_CONFIG.gemsPerSol;
    const totalMonthlyValue = courtSavings + gemsSolesValue;
    const monthlyFee = VIP_AND_SCALE_EDITABLE_CONFIG.plans[0].price;
    const netGain = Number((totalMonthlyValue - monthlyFee).toFixed(2));
    return {
      courtSavings,
      gemsSolesValue,
      totalMonthlyValue,
      monthlyFee,
      netGain,
    };
  }, [hoursPerMonth]);

  // Orden descendente visual para el Mapa de Progresión (de 2ª Libre arriba hasta 5ª P abajo)
  const scaleRoadTopDown = useMemo(() => [...CATEGORIES_SCALE].reverse(), []);

  const handleCopyAccount = async (val, label) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(val);
      if (onNotify) onNotify(`${label} copiado al portapapeles.`, 'success');
    } catch (e) {
      if (onNotify) onNotify(`${label}: ${val}`, 'info');
    }
  };

  const handleSendVipVoucher = () => {
    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para activar tu Pase Socio VIP.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    // Registrar estado "Pago en Verificación" (NUNCA auto-activa VIP sin aprobación Admin)
    setLocalPendingVip(true);
    if (onRequestVipUpgrade) {
      onRequestVipUpgrade({
        playerId: currentUser.id,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.price,
      });
    }

    const waMsg = [
      `Hola organización de TOTAL TENIS, solicito activación de mi Pase Socio VIP:`,
      `• Plan elegido: ${selectedPlan.name} (S/ ${selectedPlan.price.toFixed(2)})`,
      `• Jugador: ${currentUser.name} (${currentUser.credentialId || 'Socio'})`,
      `• Beneficios incluidos: Carnet 3D + Golden Ticket en 4 sedes + ${VIP_AND_SCALE_EDITABLE_CONFIG.monthlyGemsIncluded} Gemas mensuales.`,
      `Adjunto aquí la constancia de mi Yape / Plin / Depósito para validación.`,
    ].join('\n');

    window.open(
      buildWhatsAppLink(APP_CONFIG.supportWhatsApp, waMsg),
      '_blank',
      'noopener,noreferrer'
    );

    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        'Constancia enviada. Tu solicitud quedó en estado "Pago en Verificación" hasta confirmación.',
        'success'
      );
    }
    setShowPaymentStep(false);
  };

  const modalTitle =
    activeTab === 'escala' ? 'Escala de Categorías y Reglas' : 'Pase Socio VIP & Carnet 3D';
  const modalSubtitle =
    activeTab === 'escala'
      ? 'Tu mapa visual de progreso oficial (0 a 5,000+ pts)'
      : 'Ahorro directo en canchas, +200 Gemas al mes y Pro Shop VIP';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={
        <IconBadge
          name={activeTab === 'escala' ? 'chart' : 'crown'}
          variant={activeTab === 'escala' ? 'emerald' : 'gold'}
          size={38}
        />
      }
      isWide
      isTopLayer
    >
      <div className={`tt-vs-root ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* Conmutador Superior Limpio: Pase Socio VIP | Escala & Reglas */}
        <div className="tt-vs-tabs" role="tablist" aria-label="Pase VIP o Escala de Categorías">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vip'}
            className={`tt-vs-tab is-gold ${activeTab === 'vip' ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('vip');
            }}
          >
            <TTIcon name="crown" size={16} />
            <span>Pase Socio VIP</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'escala'}
            className={`tt-vs-tab ${activeTab === 'escala' ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('escala');
            }}
          >
            <TTIcon name="chart" size={16} />
            <span>Categorías y Reglas</span>
          </button>
        </div>

        {/* ==================================================================
            PESTAÑA 1: PASE SOCIO VIP + CARNET 3D + CALCULADORA + PAGO REAL
            ================================================================== */}
        {activeTab === 'vip' && (
          <div className="tt-vs-stack">
            {/* 1. Banner Bicolor de Alto Impacto (Púrpura Noche + Verde Esmeralda) */}
            <div className="tt-vip-bicolor-banner">
              <div className="tt-vbb-left">
                <span className="tt-vbb-kicker">
                  {isVip ? 'MEMBRESÍA ACTIVA' : 'MEMBRESÍA OFICIAL TOTAL TENIS'}
                </span>
                <h2>
                  {isVip
                    ? 'DISFRUTA TU EXPERIENCIA SOCIO VIP'
                    : 'DESBLOQUEA TU EXPERIENCIA VIP'}
                </h2>
                <p>
                  Descuentos directos en las 4 sedes aliadas, <strong>+{VIP_AND_SCALE_EDITABLE_CONFIG.monthlyGemsIncluded} Gemas mensuales incluidas</strong> y acceso total al Pro Shop.
                </p>
              </div>

              <div className="tt-vbb-right">
                <SmartImage
                  src="/assets/banner-pase-vip.jpg"
                  fallbackSrc={ASSETS.trofeoMasterTop8}
                  alt="Beneficios Socio VIP"
                  className="tt-vbb-img"
                />
                <div className="tt-vbb-price-chip">
                  <strong>S/ {VIP_AND_SCALE_EDITABLE_CONFIG.plans[0].price.toFixed(2)}</strong>
                  <span>al mes</span>
                </div>
              </div>
            </div>

            {/* 2. Carnet Digital Socio VIP 3D (Anverso + Reverso con giro 3D) */}
            <InteractiveVipCard3D
              player={currentUser}
              club={userClub}
              category={userCategory}
              isPendingPayment={isPendingVip}
            />

            {/* 3. Beneficios VIP 100 % Visuales (Iconos 3D / GIFs, cero bloques planos) */}
            <div>
              <span className="tt-vs-kicker">BENEFICIOS REALES DESDE EL DÍA 1</span>
              <div className="tt-vip-benefits-grid">
                {VIP_AND_SCALE_EDITABLE_CONFIG.visualBenefits.map((b) => (
                  <article key={b.id} className="tt-vip-ben-card">
                    <div
                      className="tt-vip-ben-media"
                      style={{ borderColor: `${b.accent}55` }}
                    >
                      <SmartImage
                        src={b.image}
                        fallbackSrc={b.fallback}
                        alt={b.title}
                        style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 10 }}
                      />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span className="tt-vip-ben-tag" style={{ color: b.accent }}>
                        {b.highlight}
                      </span>
                      <strong>{b.title}</strong>
                      <p>{b.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* 4. Calculadora Interactiva de Ahorro (Texto exacto: +200 Gemas mensuales incluidas) */}
            <div className="tt-vip-calc-card">
              <div className="tt-vcc-head">
                <div>
                  <span className="tt-vs-kicker" style={{ marginBottom: 2 }}>
                    CALCULADORA DE AHORRO EN CANCHA
                  </span>
                  <strong>¿Cuánto recuperas jugando cada mes?</strong>
                </div>
                <span className="tt-vcc-hours-pill">{hoursPerMonth} h / mes</span>
              </div>

              <input
                type="range"
                min="2"
                max="24"
                step="1"
                value={hoursPerMonth}
                onChange={(e) => setHoursPerMonth(Number(e.target.value))}
                aria-label="Horas de tenis jugadas al mes"
              />

              <div className="tt-vcc-breakdown">
                <div>
                  <span>Ahorro estimado en canchas</span>
                  <strong>S/ {savingsCalc.courtSavings.toFixed(2)} / mes</strong>
                </div>
                <div>
                  <span>Más tus +{VIP_AND_SCALE_EDITABLE_CONFIG.monthlyGemsIncluded} Gemas mensuales incluidas</span>
                  <strong>S/ {savingsCalc.gemsSolesValue.toFixed(2)} en tienda</strong>
                </div>
                <div className="is-net">
                  <span>Retorno total mensual vs. S/ {savingsCalc.monthlyFee.toFixed(2)}</span>
                  <strong style={{ color: savingsCalc.netGain >= 0 ? '#00DC7D' : '#F59E0B' }}>
                    {savingsCalc.netGain >= 0
                      ? `+S/ ${savingsCalc.netGain.toFixed(2)} a tu favor`
                      : `S/ ${savingsCalc.totalMonthlyValue.toFixed(2)} en valor`}
                  </strong>
                </div>
              </div>
            </div>

            {/* 5. Selector de Plan y Flujo Real de Pago (Yape / Plin / Banco) */}
            {!isVip && (
              <div className="tt-vip-checkout-card">
                <span className="tt-vs-kicker">ELIGE TU PLAN SOCIO VIP</span>

                <div className="tt-vip-plans-grid">
                  {VIP_AND_SCALE_EDITABLE_CONFIG.plans.map((plan) => {
                    const active = selectedPlan.id === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        className={`tt-vip-plan-tile ${active ? 'is-active' : ''}`}
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedPlanId(plan.id);
                        }}
                      >
                        <span className="tt-vpt-badge">{plan.badge}</span>
                        <strong>{plan.name}</strong>
                        <div className="tt-vpt-price">
                          <b>S/ {plan.price.toFixed(2)}</b>
                          <small>{plan.periodLabel}</small>
                        </div>
                        <span className="tt-vpt-save">{plan.saveLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {isPendingVip ? (
                  <div className="tt-vip-pending-strip">
                    <TTIcon name="clock" size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
                    <div>
                      <strong>Solicitud en estado «Pago en Verificación»</strong>
                      <p>
                        Apenas validemos tu constancia de Yape / Plin, tu Carnet 3D pasará a Oro VIP y recibirás tus +{VIP_AND_SCALE_EDITABLE_CONFIG.monthlyGemsIncluded} Gemas al instante.
                      </p>
                    </div>
                  </div>
                ) : !showPaymentStep ? (
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      if (!currentUser) {
                        if (onNotify) onNotify('Inicia sesión para activar tu Pase Socio VIP.', 'info');
                        if (onOpenAuth) onOpenAuth('login');
                        return;
                      }
                      triggerHaptic('medium');
                      setShowPaymentStep(true);
                    }}
                  >
                    Activar Plan {selectedPlan.name} · S/ {selectedPlan.price.toFixed(2)}
                  </button>
                ) : (
                  <div className="tt-vip-pay-box">
                    <div className="tt-vpb-head">
                      <strong>Medios de Pago Oficiales (0 % comisión)</strong>
                      <small>Titular: {VIP_AND_SCALE_EDITABLE_CONFIG.payment.holder}</small>
                    </div>

                    <div className="tt-vpb-row">
                      <div>
                        <small>Yape / Plin</small>
                        <strong>{VIP_AND_SCALE_EDITABLE_CONFIG.payment.yapePlin}</strong>
                      </div>
                      <button
                        type="button"
                        className="tt-vpb-copy"
                        onClick={() =>
                          handleCopyAccount(
                            VIP_AND_SCALE_EDITABLE_CONFIG.payment.yapePlin,
                            'Yape / Plin'
                          )
                        }
                      >
                        Copiar
                      </button>
                    </div>

                    <div className="tt-vpb-row">
                      <div>
                        <small>{VIP_AND_SCALE_EDITABLE_CONFIG.payment.bankName}</small>
                        <strong>{VIP_AND_SCALE_EDITABLE_CONFIG.payment.bankAccount}</strong>
                      </div>
                      <button
                        type="button"
                        className="tt-vpb-copy"
                        onClick={() =>
                          handleCopyAccount(
                            VIP_AND_SCALE_EDITABLE_CONFIG.payment.bankAccount,
                            'Cuenta Bancaria'
                          )
                        }
                      >
                        Copiar
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        className="tt-btn tt-btn-ghost tt-btn-sm"
                        onClick={() => setShowPaymentStep(false)}
                      >
                        Volver
                      </button>
                      <button
                        type="button"
                        className="tt-btn tt-btn-primary tt-btn-sm"
                        style={{ flex: 1 }}
                        onClick={handleSendVipVoucher}
                      >
                        <TTIcon name="whatsapp" size={17} />
                        Enviar Constancia por WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 2: MAPA VISUAL DE CATEGORÍAS ("CAMINO A LA ÉLITE") + REGLAS
            ================================================================== */}
        {activeTab === 'escala' && (
          <div className="tt-vs-stack">
            {/* Cabecera Personalizada de tu Ubicación en la Escalera */}
            {currentUser && (
              <div className="tt-road-you-banner">
                <div>
                  <span className="tt-road-you-kicker">TU NIVEL ACTUAL EN EL CIRCUITO</span>
                  <strong>
                    {userCategory.name} · {userPoints.toLocaleString('es-PE')} pts
                  </strong>
                  <small>
                    {(() => {
                      const idx = CATEGORIES_SCALE.findIndex((c) => c.id === userCategory.id);
                      const next =
                        idx >= 0 && idx < CATEGORIES_SCALE.length - 1
                          ? CATEGORIES_SCALE[idx + 1]
                          : null;
                      if (!next) return 'Estás en la categoría máxima del circuito oficial.';
                      const diff = Math.max(0, next.min - userPoints);
                      return `A ${diff.toLocaleString('es-PE')} puntos de ascender a ${next.name}`;
                    })()}
                  </small>
                </div>
                <IconBadge name="trophy" variant="emerald" size={42} />
              </div>
            )}

            {/* Mapa Vertical con Línea de Energía Luminosa (Cero lista de supermercado) */}
            <div className="tt-road-container">
              <span className="tt-vs-kicker">ESCALERA OFICIAL DE CATEGORÍAS</span>

              <div className="tt-road-timeline">
                <div className="tt-road-spine" aria-hidden="true" />

                {scaleRoadTopDown.map((cat) => {
                  const isMine = Boolean(currentUser && userCategory.id === cat.id);
                  const isReached = Boolean(currentUser && userPoints >= cat.min);
                  const visual = getTierVisualMeta(cat.id);
                  const rangeText =
                    cat.max >= 9000
                      ? `${cat.min.toLocaleString('es-PE')}+ pts`
                      : `${cat.min.toLocaleString('es-PE')} – ${cat.max.toLocaleString('es-PE')} pts`;

                  return (
                    <div
                      key={cat.id}
                      className={`tt-road-node ${isMine ? 'is-current' : ''} ${
                        isReached ? 'is-reached' : ''
                      }`}
                    >
                      {/* Emblema circular sobre la línea de energía */}
                      <div
                        className="tt-road-emblem"
                        style={{
                          borderColor: isMine ? '#00DC7D' : cat.color,
                          backgroundColor: isMine ? '#00DC7D' : '#1E0734',
                          color: isMine ? '#120321' : cat.color,
                        }}
                      >
                        <TTIcon name={visual.badge} size={18} />
                      </div>

                      {/* Tarjeta de Categoría */}
                      <div className="tt-road-card">
                        <div className="tt-road-card-top">
                          <span className="tt-road-tier" style={{ color: cat.color }}>
                            {visual.tier}
                          </span>
                          <strong className="tt-road-range">{rangeText}</strong>
                        </div>

                        <div className="tt-road-card-mid">
                          <h4>{cat.name}</h4>
                          {isMine && <span className="tt-road-here-pill">ESTÁS AQUÍ</span>}
                        </div>

                        <p>{visual.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reglas Deportivas 100 % Visuales (Iconos 3D + Frases Cortas · Cero Enciclopedia) */}
            <div>
              <span className="tt-vs-kicker">CÓMO FUNCIONAN LOS PUNTOS (EN 30 SEGUNDOS)</span>
              <div className="tt-rules-visual-grid">
                {VIP_AND_SCALE_EDITABLE_CONFIG.visualRulesCards.map((rule) => (
                  <article key={rule.id} className="tt-rule-vcard">
                    <div className="tt-rv-head">
                      <SmartImage
                        src={rule.image}
                        fallbackSrc={ASSETS.logo}
                        alt={rule.title}
                        style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }}
                      />
                      <div>
                        <span style={{ color: rule.accent }}>{rule.kicker}</span>
                        <h4>{rule.title}</h4>
                      </div>
                    </div>
                    <ul>
                      {rule.bullets.map((b, i) => (
                        <li key={i}>
                          <TTIcon name="check" size={13} style={{ color: '#00DC7D', flexShrink: 0 }} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          ESTILOS ENCAPSULADOS (ARMONÍA TOTAL TENIS · CARNET 3D · MAPA ÉLITE)
          ==================================================================== */}
      <style>{`
        .tt-vs-root {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-vs-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-vs-kicker {
          display: block;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
          margin-bottom: 8px;
        }
        .tt-vs-root.is-light .tt-vs-kicker {
          color: #008A4E;
        }

        /* Conmutador Superior */
        .tt-vs-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 5px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-vs-tab {
          min-height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          transition: background-color 180ms ease, color 180ms ease, transform 120ms ease;
        }
        .tt-vs-tab:active {
          transform: scale(0.97);
        }
        .tt-vs-tab.is-active {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-vs-root.is-dark .tt-vs-tab.is-active {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }
        .tt-vs-root.is-dark .tt-vs-tab.is-gold.is-active {
          background: linear-gradient(135deg, #FBBF24 0%, #D97706 100%);
          color: #1E1102;
        }

        /* 1. BANNER BICOLOR VIP */
        .tt-vip-bicolor-banner {
          border-radius: 22px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr;
          background: #23083C;
          color: #FAF9F5;
          border: 1px solid rgba(245, 158, 11, 0.38);
        }
        @media (min-width: 640px) {
          .tt-vip-bicolor-banner {
            grid-template-columns: 1.25fr 0.85fr;
          }
        }
        .tt-vbb-left {
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }
        .tt-vbb-kicker {
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #FDE68A;
        }
        .tt-vbb-left h2 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 1.55rem;
          line-height: 0.98;
          color: #00DC7D;
        }
        .tt-vbb-left p {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.42;
          color: rgba(250, 249, 245, 0.86);
        }
        .tt-vbb-right {
          position: relative;
          min-height: 124px;
          background: linear-gradient(135deg, #00DC7D 0%, #6EF2B5 100%);
          overflow: hidden;
        }
        .tt-vbb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-vbb-price-chip {
          position: absolute;
          right: 10px;
          bottom: 10px;
          padding: 6px 12px;
          border-radius: 13px;
          background: rgba(18, 3, 33, 0.9);
          border: 1px solid #00DC7D;
          color: #FAF9F5;
          text-align: center;
        }
        .tt-vbb-price-chip strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.25rem;
          line-height: 1;
          color: #00DC7D;
        }
        .tt-vbb-price-chip span {
          font-size: 0.62rem;
          font-weight: 700;
          opacity: 0.8;
        }

        /* 2. CARNET DIGITAL 3D (PROPORCIÓN ÁUREA 1.58:1 + FLIP 180°) */
        .tt-vip3d-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
        }
        .tt-vip3d-scene {
          width: 100%;
          max-width: 410px;
          aspect-ratio: 1.58 / 1;
          perspective: 1100px;
          cursor: pointer;
        }
        .tt-vip3d-card {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 540ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tt-vip3d-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 22px;
          overflow: hidden;
          color: #FAF9F5;
          background: linear-gradient(135deg, #1E0734 0%, #10021C 58%, #21100B 100%);
          border: 1.5px solid rgba(250, 249, 245, 0.18);
          box-shadow: 0 20px 40px rgba(8, 1, 18, 0.45);
        }
        .tt-vip3d-face.is-gold {
          border-color: rgba(245, 158, 11, 0.78);
          box-shadow: 0 20px 42px rgba(245, 158, 11, 0.24);
        }
        .tt-vip3d-face.is-back {
          transform: rotateY(180deg);
        }
        .tt-vip3d-custom-art {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          pointer-events: none;
        }
        .tt-vip3d-custom-art.is-visible {
          opacity: 1;
        }
        .tt-vip3d-etched-court {
          position: absolute;
          inset: 14px;
          border: 1px solid rgba(250, 249, 245, 0.07);
          border-radius: 13px;
          pointer-events: none;
        }
        .tt-vip3d-etched-court::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(250, 249, 245, 0.06);
        }
        .tt-vip3d-layer {
          position: relative;
          z-index: 2;
          height: 100%;
          padding: 15px 17px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: linear-gradient(180deg, rgba(16, 3, 29, 0.34) 0%, rgba(16, 3, 29, 0.56) 100%);
        }
        .tt-vip3d-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-vip3d-brand-pair {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--tt-font-display);
          font-style: italic;
          font-weight: 900;
          font-size: 1.15rem;
          letter-spacing: 0.05em;
        }
        .tt-vip3d-status {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.16);
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.09em;
        }
        .tt-vip3d-status.is-gold {
          background: linear-gradient(135deg, #FEF08A 0%, #F59E0B 100%);
          color: #1E1102;
        }
        .tt-vip3d-status.is-pending {
          background: rgba(245, 158, 11, 0.25);
          border: 1px solid #F59E0B;
          color: #FDE68A;
        }
        .tt-vip3d-middle {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .tt-vip3d-holder {
          display: block;
          font-size: 0.94rem;
          letter-spacing: 0.07em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-vip3d-code {
          display: block;
          margin-top: 2px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.74rem;
          font-weight: 700;
          color: #00DC7D;
        }
        .tt-vip3d-club-cat {
          display: block;
          font-size: 0.68rem;
          opacity: 0.78;
        }
        .tt-vip3d-chip {
          width: 34px;
          height: 24px;
          border-radius: 6px;
          background: linear-gradient(135deg, #FDE68A 0%, #D97706 100%);
          border: 1px solid rgba(255, 255, 255, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-vip3d-chip span {
          width: 18px;
          height: 12px;
          border-radius: 3px;
          border: 1px solid rgba(30, 17, 2, 0.45);
        }
        .tt-vip3d-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-vip3d-bottom small {
          display: block;
          font-size: 0.56rem;
          letter-spacing: 0.08em;
          opacity: 0.68;
        }
        .tt-vip3d-bottom strong {
          font-size: 0.78rem;
          letter-spacing: 0.04em;
        }
        .tt-vip3d-flip-hint {
          font-size: 0.65rem;
          font-weight: 800;
          color: #7CF5C0;
        }

        /* Reverso del Carnet */
        .tt-vip3d-layer.is-back-layout {
          padding: 12px 16px;
        }
        .tt-vip3d-magstrip {
          margin: -12px -16px 0;
          padding: 7px 16px;
          background: rgba(8, 1, 18, 0.85);
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #00DC7D;
          text-align: center;
        }
        .tt-vip3d-back-center {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tt-vip3d-qr-frame {
          padding: 5px;
          border-radius: 12px;
          background: #FAF9F5;
          flex-shrink: 0;
        }
        .tt-vip3d-back-info small {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.08em;
          opacity: 0.72;
        }
        .tt-vip3d-back-info strong {
          display: block;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.96rem;
          color: #FDE68A;
          margin: 2px 0;
        }
        .tt-vip3d-back-info span {
          display: block;
          font-size: 0.68rem;
          opacity: 0.84;
        }
        .tt-vip3d-barcode {
          height: 16px;
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 3px;
          opacity: 0.7;
        }
        .tt-vip3d-barcode span {
          background: #FAF9F5;
          border-radius: 1px;
        }
        .tt-vip3d-flip-btn {
          padding: 6px 14px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.73rem;
          font-weight: 800;
        }

        /* 3. BENEFICIOS VISUALES CON ICONOS 3D Y GIFS */
        .tt-vip-benefits-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 9px;
        }
        @media (min-width: 600px) {
          .tt-vip-benefits-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-vip-ben-card {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-vip-ben-media {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: #1B0630;
          border: 1.5px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-vip-ben-tag {
          display: block;
          font-size: 0.63rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .tt-vip-ben-card strong {
          display: block;
          font-size: 0.84rem;
          margin-top: 1px;
        }
        .tt-vip-ben-card p {
          margin: 2px 0 0;
          font-size: 0.71rem;
          line-height: 1.35;
          color: var(--tt-text-muted);
        }

        /* 4. CALCULADORA DE AHORRO */
        .tt-vip-calc-card {
          padding: 14px;
          border-radius: 18px;
          background: linear-gradient(135deg, #250942 0%, #140324 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.32);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-vcc-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-vcc-head strong {
          font-size: 0.86rem;
        }
        .tt-vcc-hours-pill {
          padding: 5px 11px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.75rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .tt-vcc-breakdown {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding-top: 6px;
        }
        .tt-vcc-breakdown > div {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.77rem;
        }
        .tt-vcc-breakdown .is-net {
          padding-top: 8px;
          border-top: 1px solid rgba(250, 249, 245, 0.14);
          font-size: 0.84rem;
        }

        /* 5. PLANES Y PAGO YAPE / PLIN */
        .tt-vip-checkout-card {
          padding: 14px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-vip-plans-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media (min-width: 600px) {
          .tt-vip-plans-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .tt-vip-plan-tile {
          padding: 11px;
          border-radius: 15px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text);
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tt-vip-plan-tile.is-active {
          border-color: #00DC7D;
          background: rgba(0, 220, 125, 0.12);
        }
        .tt-vpt-badge {
          align-self: flex-start;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
          font-size: 0.58rem;
          font-weight: 900;
        }
        .tt-vpt-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .tt-vpt-price b {
          font-family: var(--tt-font-display);
          font-size: 1.38rem;
          color: #00DC7D;
        }
        .tt-vs-root.is-light .tt-vpt-price b {
          color: #1E0734;
        }
        .tt-vpt-price small {
          font-size: 0.7rem;
          color: var(--tt-text-muted);
        }
        .tt-vpt-save {
          font-size: 0.67rem;
          color: var(--tt-text-muted);
        }

        .tt-vip-pending-strip {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.45);
          font-size: 0.78rem;
        }
        .tt-vip-pending-strip p {
          margin: 3px 0 0;
          font-size: 0.73rem;
          color: var(--tt-text-muted);
        }

        .tt-vip-pay-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 4px;
        }
        .tt-vpb-head strong {
          display: block;
          font-size: 0.82rem;
        }
        .tt-vpb-head small {
          font-size: 0.7rem;
          color: var(--tt-text-muted);
        }
        .tt-vpb-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 11px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
        }
        .tt-vpb-row small {
          display: block;
          font-size: 0.64rem;
          color: var(--tt-text-muted);
        }
        .tt-vpb-row strong {
          font-size: 0.88rem;
        }
        .tt-vpb-copy {
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.16);
          color: #00DC7D;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .tt-vs-root.is-light .tt-vpb-copy {
          background: #1E0734;
          color: #00DC7D;
        }

        /* 6. MAPA VISUAL DE CATEGORÍAS ("CAMINO A LA ÉLITE") */
        .tt-road-you-banner {
          padding: 14px;
          border-radius: 18px;
          background: linear-gradient(135deg, #1E0734 0%, #103F30 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.5);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-road-you-kicker {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #7CF5C0;
        }
        .tt-road-you-banner strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.38rem;
          line-height: 1.08;
        }
        .tt-road-you-banner small {
          display: block;
          margin-top: 2px;
          font-size: 0.74rem;
          color: rgba(250, 249, 245, 0.84);
        }

        .tt-road-timeline {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-left: 8px;
        }
        .tt-road-spine {
          position: absolute;
          left: 27px;
          top: 18px;
          bottom: 18px;
          width: 3px;
          border-radius: 999px;
          background: linear-gradient(180deg, #F59E0B 0%, #00DC7D 52%, #C85A32 100%);
          opacity: 0.65;
        }
        .tt-road-node {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tt-road-emblem {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #00DC7D;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .tt-road-card {
          flex: 1;
          padding: 11px 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1.5px solid var(--tt-border);
        }
        .tt-road-node.is-current .tt-road-card {
          border-color: #00DC7D;
          background: rgba(0, 220, 125, 0.12);
          box-shadow: 0 8px 20px rgba(0, 220, 125, 0.16);
        }
        .tt-road-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .tt-road-tier {
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .tt-road-range {
          font-size: 0.74rem;
          font-variant-numeric: tabular-nums;
          color: var(--tt-text);
        }
        .tt-road-card-mid {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }
        .tt-road-card-mid h4 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          line-height: 1.05;
        }
        .tt-road-here-pill {
          padding: 2px 8px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.6rem;
          font-weight: 900;
        }
        .tt-road-card p {
          margin: 3px 0 0;
          font-size: 0.72rem;
          color: var(--tt-text-muted);
        }

        /* 7. TARJETAS VISUALES DE REGLAS ELO */
        .tt-rules-visual-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 9px;
        }
        @media (min-width: 600px) {
          .tt-rules-visual-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-rule-vcard {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-rv-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-rv-head span {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .tt-rv-head h4 {
          margin: 2px 0 0;
          font-size: 0.86rem;
          line-height: 1.2;
        }
        .tt-rule-vcard ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-rule-vcard li {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 0.74rem;
          color: var(--tt-text-muted);
          line-height: 1.35;
        }
      `}</style>
    </ModalPortal>
  );
}
