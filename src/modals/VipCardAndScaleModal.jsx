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
import { buildWhatsappLink } from '../utils/cloudService';

export const VIP_AND_SCALE_EDITABLE_CONFIG = {
  monthlyGemsIncluded: 200,
  savingsPerHourSoles: 8,
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
    { id: 'vip-mensual', name: 'Mensual', price: 29.9, periodLabel: '/ mes', badge: 'MÁS POPULAR', saveLabel: 'Se cubre jugando 4 h/mes' },
    { id: 'vip-trimestral', name: 'Temporada (3 meses)', price: 79.9, periodLabel: '/ 3 meses', badge: 'AHORRAS 11%', saveLabel: 'Cubre 1 temporada completa' },
    { id: 'vip-anual', name: 'Anual Maestro', price: 269.0, periodLabel: '/ año', badge: 'MEJOR VALOR', saveLabel: '25% menos · 4 temporadas + Master' },
  ],
  visualBenefits: [
    { id: 'ben-golden', title: 'Beneficios en 4 Sedes', highlight: '-15% a -20% en cancha', desc: 'Presenta tu Carnet 3D en recepción y ahorra directo en cada reserva.', image: '/assets/canva-golden-ticket.png', fallback: ASSETS.logo, accent: '#E5C16C' },
    { id: 'ben-gems', title: '+200 Gemas cada mes', highlight: 'Multiplicador ×2.5', desc: 'Recibes 200 Gemas al renovar y aceleras tu saldo en rachas y victorias.', image: '/assets/fuego-racha-3d.png', fallback: ASSETS.logo, accent: '#00DC7D' },
    { id: 'ben-shop', title: 'Tarifa Socio en Pro Shop', highlight: 'Canjes exclusivos', desc: 'Descuentos directos en stock del almacén y taller de encordado.', image: '/assets/pelota-3d-volt-azul.png', fallback: ASSETS.logo, accent: '#38BDF8' },
    { id: 'ben-tourney', title: 'Prioridad en Torneos', highlight: 'Cupos y Clases VIP', desc: 'Acceso preferente a cuadros oficiales y tarifa preferencial con Coaches.', image: ASSETS.trofeoMasterTop8, fallback: ASSETS.logo, accent: '#DE8566' },
  ],
  visualRulesCards: [
    {
      id: 'rule-games',
      kicker: 'CADA GAME CUENTA',
      title: 'Dominio premiado · Pelea protegida',
      bullets: [
        'Ganar con ventaja amplia entrega el máximo puntaje oficial.',
        'Llevar el duelo al 3er set o tie-break protege tus puntos.',
      ],
      image: '/assets/pelota-3d-volt-azul.png',
      accent: '#00DC7D',
    },
    {
      id: 'rule-radar',
      kicker: 'RADAR ANTI-ESCASEZ',
      title: 'Calibración 5 PJ · Ventana adaptativa',
      bullets: [
        'Ventana oficial ±1,200 pts (si hay menos de 6 rivales en tu nivel, se amplía hasta ±1,800 pts a los 8 más cercanos).',
        'Revanchas semanales: 1º duelo 100%, 2º 75%, 3º+ 50% (reinicia cada lunes).',
      ],
      image: '/assets/fuego-racha-3d.png',
      accent: '#38BDF8',
    },
    {
      id: 'rule-inactivity',
      kicker: 'ACTIVIDAD TRANSPARENTE',
      title: 'Cuota mensual y piso protector',
      bullets: [
        'Meta: 4 partidos/mes (baja a 2/mes si hay menos de 6 rivales). Lanzar 2+ retos rechazados te protege ese mes.',
        'Inactividad (>2,000 pts): -35 pts/mes sin bajar de categoría. 1 Escudo de Pausa (30 días) por lesión o viaje.',
      ],
      image: '/assets/canva-golden-ticket.png',
      accent: '#E5C16C',
    },
    {
      id: 'rule-seasons',
      kicker: '4 TEMPORADAS · CIERRE 00:00',
      title: 'Reset al piso + Master Top 8',
      bullets: [
        'Al cierre automático 00:00 se guarda tu puntaje para el acumulado anual (Top 8 van al Master gratis).',
        'Cada temporada arrancas en el piso de tu categoría (300 / 1,000 / 2,000 / 3,000 / 4,000 / 5,000 pts).',
      ],
      image: ASSETS.trofeoMasterTop8,
      accent: '#DE8566',
    },
    {
      id: 'rule-tutela',
      kicker: 'PROTECCIÓN LEGAL (-18 PERÚ)',
      title: 'Cuentas Tuteladas y Emancipación +18',
      bullets: [
        'Los padres (+18) administran subcuentas juveniles sin exponer correo ni celular del menor.',
        'Al cumplir 18 años se transfiere el perfil a cuenta propia conservando el 100% de puntos e historial.',
      ],
      image: ASSETS.logo,
      accent: '#7DD3FC',
    },
  ],
};

function getTierVisualMeta(catId) {
  switch (catId) {
    case '5p': return { tier: 'INICIACIÓN', note: 'Primeros peloteos y saque base · Piso temporada 300 pts', badge: 'shield' };
    case '5b': return { tier: 'INICIAL', note: 'Peloteo regular y control de red · Piso 1,000 pts', badge: 'shield' };
    case '5a': return { tier: 'CONSOLIDADO', note: 'Saque estable y partidos completos · Piso 2,000 pts', badge: 'challenge' };
    case '4a': return { tier: 'COMPETITIVO', note: 'Topspin, slice y ritmo de club · Piso 3,000 pts', badge: 'trophy' };
    case '3a': return { tier: 'PRIMERA FUERZA', note: 'Campeones locales y alto ritmo · Piso 4,000 pts', badge: 'crown' };
    default: return { tier: 'ÉLITE LIBRE', note: 'Máximo escalafón del circuito · Piso 5,000 pts', badge: 'crown' };
  }
}

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
    if (typeof document !== 'undefined' && document.documentElement.dataset.tier === 'lite') return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt({
      rx: Number((-((e.clientY - rect.top) / rect.height - 0.5) * 10).toFixed(2)),
      ry: Number((((e.clientX - rect.left) / rect.width - 0.5) * 12).toFixed(2)),
    });
  };

  const toggleFlip = () => {
    triggerHaptic('medium');
    setTilt({ rx: 0, ry: 0 });
    setIsFlipped((v) => !v);
  };

  return (
    <div className="tt-vip3d-wrapper">
      <div
        className="tt-vip3d-scene"
        onMouseMove={handlePointerMove}
        onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
        onClick={toggleFlip}
        role="button"
        tabIndex={0}
        aria-label="Girar Carnet Digital 3D"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip(); } }}
      >
        <div
          className={`tt-vip3d-card ${isFlipped ? 'is-flipped' : ''}`}
          style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${isFlipped ? 180 + tilt.ry : tilt.ry}deg)` }}
        >
          <div className={`tt-vip3d-face is-front ${isVip ? 'is-gold' : 'is-std'}`}>
            <img src={VIP_AND_SCALE_EDITABLE_CONFIG.cardArtwork.frontImage} alt="" className={`tt-vip3d-custom-art ${frontArtLoaded ? 'is-visible' : ''}`} onLoad={() => setFrontArtLoaded(true)} onError={() => setFrontArtLoaded(false)} />
            {!frontArtLoaded && <div className="tt-vip3d-etched-court" aria-hidden="true" />}
            <span className="tt-vip3d-foil-sheen" aria-hidden="true" />
            <div className="tt-vip3d-layer is-front-layer">
              <div className="tt-vip3d-top">
                <div className="tt-vip3d-brand-pair">
                  <SmartImage src={ASSETS.logo} alt="TOTAL TENIS" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(250,249,245,0.42)' }} />
                  <span>TOTAL TENIS</span>
                </div>
                <span className={`tt-vip3d-status ${isVip ? 'is-gold' : isPendingPayment ? 'is-pending' : ''}`}>
                  {isVip ? 'SOCIO VIP' : isPendingPayment ? 'EN VERIFICACIÓN' : 'ESTÁNDAR'}
                </span>
              </div>
              <div className="tt-vip3d-middle">
                <SmartImage src={player?.avatar} alt={holderName} initials={player?.name || 'TT'} style={{ width: 56, height: 56, borderRadius: 15, objectFit: 'cover', objectPosition: 'center top', border: isVip ? '2px solid #E5C16C' : '1.5px solid rgba(250,249,245,0.42)', flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong className="tt-vip3d-holder">{holderName}</strong>
                  <span className="tt-vip3d-code">{memberCode}</span>
                  <small className="tt-vip3d-club-cat">{category.name} · {club ? club.shortName : 'Independiente'}</small>
                </div>
                <div className="tt-vip3d-chip" aria-hidden="true"><span /></div>
              </div>
              <div className="tt-vip3d-bottom">
                <div><small>VIGENCIA TEMPORADA</small><strong>{validYear} · {Number(player?.points || 0).toLocaleString('es-PE')} PTS</strong></div>
                <span className="tt-vip3d-flip-hint">Toca para girar ↻</span>
              </div>
            </div>
          </div>

          <div className={`tt-vip3d-face is-back ${isVip ? 'is-gold' : 'is-std'}`}>
            <img src={VIP_AND_SCALE_EDITABLE_CONFIG.cardArtwork.backImage} alt="" className={`tt-vip3d-custom-art ${backArtLoaded ? 'is-visible' : ''}`} onLoad={() => setBackArtLoaded(true)} onError={() => setBackArtLoaded(false)} />
            <div className="tt-vip3d-layer is-back-layout is-back-layer">
              <div className="tt-vip3d-magstrip"><span>CREDENCIAL VERIFICABLE · 4 SEDES OFICIALES</span></div>
              <div className="tt-vip3d-back-center">
                <div className="tt-vip3d-qr-frame" aria-label={`QR ${memberCode}`}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="4" y="4" width="18" height="18" rx="3" stroke="#1E0734" strokeWidth="3.5" />
                    <rect x="9" y="9" width="8" height="8" rx="1.5" fill="#1E0734" />
                    <rect x="42" y="4" width="18" height="18" rx="3" stroke="#1E0734" strokeWidth="3.5" />
                    <rect x="47" y="9" width="8" height="8" rx="1.5" fill="#1E0734" />
                    <rect x="4" y="42" width="18" height="18" rx="3" stroke="#1E0734" strokeWidth="3.5" />
                    <rect x="9" y="47" width="8" height="8" rx="1.5" fill="#1E0734" />
                    <path d="M28 6H34V12H28V6ZM28 18H36V24H28V18ZM6 28H14V34H6V28ZM20 28H28V36H20V28ZM34 28H44V34H34V28ZM50 28H60V36H50V28ZM28 42H36V50H28V42ZM42 42H52V48H42V42ZM42 54H60V60H42V54ZM28 54H36V60H28V54Z" fill="#1E0734" />
                  </svg>
                </div>
                <div className="tt-vip3d-back-info">
                  <small>ID DE VERIFICACIÓN EN RECEPCIÓN</small>
                  <strong>{memberCode}</strong>
                  <span>Saldo actual: {Number(player?.gems || 0).toLocaleString('es-PE')} 💎 · Canjeable en Pro Shop</span>
                </div>
              </div>
              <div className="tt-vip3d-barcode" aria-hidden="true">
                {[3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4].map((w, i) => <span key={i} style={{ width: w * 2 }} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <button type="button" className="tt-vip3d-flip-btn" onClick={toggleFlip}>
        ↻ {isFlipped ? 'Ver Anverso del Carnet' : 'Ver Reverso con QR Verificable'}
      </button>
    </div>
  );
}

export default function VipCardAndScaleModal({
  isOpen = false,
  initialTab = 'vip',
  onClose,
  currentUser = null,
  clubs = INITIAL_CLUBS,
  theme = 'dark',
  onRequestVipUpgrade,
  onOpenAuth,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState(initialTab === 'escala' ? 'escala' : 'vip');
  const [selectedPlanId, setSelectedPlanId] = useState(VIP_AND_SCALE_EDITABLE_CONFIG.plans[0].id);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [localPendingVip, setLocalPendingVip] = useState(false);
  const [hoursPerMonth, setHoursPerMonth] = useState(12);

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
    () => VIP_AND_SCALE_EDITABLE_CONFIG.plans.find((p) => p.id === selectedPlanId) || VIP_AND_SCALE_EDITABLE_CONFIG.plans[0],
    [selectedPlanId]
  );

  const savingsCalc = useMemo(() => {
    const courtSavings = hoursPerMonth * VIP_AND_SCALE_EDITABLE_CONFIG.savingsPerHourSoles;
    const monthlyFee = VIP_AND_SCALE_EDITABLE_CONFIG.plans[0].price;
    return {
      courtSavings,
      monthlyFee,
      netGain: Number((courtSavings - monthlyFee).toFixed(2)),
      sliderPct: Math.round(((hoursPerMonth - 2) / 22) * 100),
    };
  }, [hoursPerMonth]);

  const scaleRoadTopDown = useMemo(() => [...CATEGORIES_SCALE].reverse(), []);

  const handleCopyAccount = async (val, label) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(val);
      if (onNotify) onNotify(`${label} copiado.`, 'success');
    } catch {
      if (onNotify) onNotify(`${label}: ${val}`, 'info');
    }
  };

  const handleSendVipVoucher = () => {
    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para activar tu Pase Socio VIP.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    setLocalPendingVip(true);
    if (onRequestVipUpgrade) {
      onRequestVipUpgrade({ playerId: currentUser.id, planId: selectedPlan.id, planName: selectedPlan.name, amount: selectedPlan.price });
    }
    const waMsg = [
      'Hola organización de TOTAL TENIS, solicito activación de mi Pase Socio VIP:',
      `• Plan: ${selectedPlan.name} (S/ ${selectedPlan.price.toFixed(2)})`,
      `• Jugador: ${currentUser.name} (${currentUser.credentialId || 'Socio'})`,
      'Adjunto la constancia de mi Yape / Plin / Depósito.',
    ].join('\n');
    window.open(buildWhatsappLink(APP_CONFIG.supportWhatsApp, waMsg), '_blank', 'noopener,noreferrer');
    triggerHaptic('success');
    if (onNotify) onNotify('Constancia enviada. Tu solicitud quedó en "Pago en Verificación".', 'success');
    setShowPaymentStep(false);
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === 'escala' ? 'Categorías y Reglamento' : 'Pase Socio VIP & Carnet 3D'}
      subtitle={activeTab === 'escala' ? 'Escala oficial, anti-escasez, temporadas y tutela' : 'Ahorro en canchas, +200 Gemas al mes y Pro Shop VIP'}
      icon={<IconBadge name={activeTab === 'escala' ? 'chart' : 'crown'} variant={activeTab === 'escala' ? 'emerald' : 'gold'} size={38} />}
      isWide
      isTopLayer
    >
      <div className={`tt-vs-root ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        <div className="tt-vs-tabs" role="tablist">
          <span className={`tt-vs-tab-slider ${activeTab === 'vip' ? 'is-gold' : 'is-emerald'}`} aria-hidden="true" style={{ transform: `translateX(${activeTab === 'vip' ? '0%' : '100%'})` }} />
          <button type="button" role="tab" aria-selected={activeTab === 'vip'} className={`tt-vs-tab is-gold ${activeTab === 'vip' ? 'is-active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('vip'); }}>
            <TTIcon name="crown" size={16} /><span>Pase Socio VIP</span>
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'escala'} className={`tt-vs-tab ${activeTab === 'escala' ? 'is-active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('escala'); }}>
            <TTIcon name="chart" size={16} /><span>Categorías y Reglas</span>
          </button>
        </div>

        {activeTab === 'vip' && (
          <div key="vs-vip" className="tt-vs-stack tt-vs-panel-enter">
            <div className="tt-vip-bicolor-banner">
              <div className="tt-vbb-left">
                <span className="tt-vbb-kicker">{isVip ? 'MEMBRESÍA ACTIVA' : 'MEMBRESÍA OFICIAL TOTAL TENIS'}</span>
                <h2>{isVip ? 'DISFRUTA TU EXPERIENCIA VIP' : 'DESBLOQUEA TU EXPERIENCIA VIP'}</h2>
                <p>Descuentos directos en las 4 sedes aliadas, <strong>+{VIP_AND_SCALE_EDITABLE_CONFIG.monthlyGemsIncluded} Gemas mensuales</strong> y tarifa Socio en Pro Shop.</p>
              </div>
              <div className="tt-vbb-right">
                <SmartImage src="/assets/banner-pase-vip.jpg" fallbackSrc={ASSETS.trofeoMasterTop8} alt="Socio VIP" className="tt-vbb-img" />
                <div className="tt-vbb-price-chip"><strong>S/ {VIP_AND_SCALE_EDITABLE_CONFIG.plans[0].price.toFixed(2)}</strong><span>al mes</span></div>
              </div>
            </div>

            <InteractiveVipCard3D player={currentUser} club={userClub} category={userCategory} isPendingPayment={isPendingVip} />

            <div>
              <span className="tt-vs-kicker">BENEFICIOS REALES DESDE EL DÍA 1</span>
              <div className="tt-vip-benefits-grid">
                {VIP_AND_SCALE_EDITABLE_CONFIG.visualBenefits.map((b, idx) => (
                  <article key={b.id} className="tt-vip-ben-card" style={{ '--vs-delay': `${idx * 55}ms` }}>
                    <div className="tt-vip-ben-media" style={{ borderColor: `${b.accent}55` }}>
                      <SmartImage src={b.image} fallbackSrc={b.fallback} alt={b.title} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10 }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span className="tt-vip-ben-tag" style={{ color: b.accent }}>{b.highlight}</span>
                      <strong>{b.title}</strong>
                      <p>{b.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="tt-vip-calc-card">
              <div className="tt-vcc-head">
                <div><span className="tt-vs-kicker is-on-dark" style={{ marginBottom: 2 }}>CALCULADORA DE AHORRO EN CANCHA</span><strong>¿Cuánto ahorras jugando cada mes?</strong></div>
                <span className="tt-vcc-hours-pill">{hoursPerMonth} h / mes</span>
              </div>
              <input type="range" min="2" max="24" step="1" value={hoursPerMonth} className="tt-vcc-slider" style={{ background: `linear-gradient(90deg, #00DC7D 0%, #00DC7D ${savingsCalc.sliderPct}%, rgba(250,249,245,0.2) ${savingsCalc.sliderPct}%, rgba(250,249,245,0.2) 100%)` }} onChange={(e) => setHoursPerMonth(Number(e.target.value))} />
              <div className="tt-vcc-breakdown">
                <div><span>Ahorro estimado en canchas</span><strong>S/ {savingsCalc.courtSavings.toFixed(2)} / mes</strong></div>
                <div><span>Bono mensual de membresía</span><strong style={{ color: '#7CF5C0' }}>+{VIP_AND_SCALE_EDITABLE_CONFIG.monthlyGemsIncluded} 💎 Pro Shop</strong></div>
                <div className="is-net"><span>Balance en cancha vs. S/ {savingsCalc.monthlyFee.toFixed(2)}</span><strong style={{ color: savingsCalc.netGain >= 0 ? '#00DC7D' : '#F3DC9B' }}>{savingsCalc.netGain >= 0 ? `+S/ ${savingsCalc.netGain.toFixed(2)} a tu favor` : `Ahorras S/ ${savingsCalc.courtSavings.toFixed(2)} + 200 💎`}</strong></div>
              </div>
            </div>

            {!isVip && (
              <div className="tt-vip-checkout-card">
                <span className="tt-vs-kicker">ELIGE TU PLAN SOCIO VIP</span>
                <div className="tt-vip-plans-grid">
                  {VIP_AND_SCALE_EDITABLE_CONFIG.plans.map((plan) => (
                    <button key={plan.id} type="button" className={`tt-vip-plan-tile ${selectedPlan.id === plan.id ? 'is-active' : ''}`} onClick={() => { triggerHaptic('light'); setSelectedPlanId(plan.id); }}>
                      <span className="tt-vpt-badge">{plan.badge}</span>
                      <strong>{plan.name}</strong>
                      <div className="tt-vpt-price"><b>S/ {plan.price.toFixed(2)}</b><small>{plan.periodLabel}</small></div>
                      <span className="tt-vpt-save">{plan.saveLabel}</span>
                    </button>
                  ))}
                </div>

                {isPendingVip ? (
                  <div className="tt-vip-pending-strip">
                    <TTIcon name="clock" size={18} style={{ color: '#E5C16C', flexShrink: 0 }} />
                    <div><strong>Solicitud en «Pago en Verificación»</strong><p>Apenas validemos tu constancia, tu Carnet pasará a Oro VIP con +{VIP_AND_SCALE_EDITABLE_CONFIG.monthlyGemsIncluded} 💎.</p></div>
                  </div>
                ) : !showPaymentStep ? (
                  <button type="button" className="tt-btn tt-btn-primary" style={{ width: '100%' }} onClick={() => { if (!currentUser) { if (onOpenAuth) onOpenAuth('login'); return; } triggerHaptic('medium'); setShowPaymentStep(true); }}>
                    Activar Plan {selectedPlan.name} · S/ {selectedPlan.price.toFixed(2)}
                  </button>
                ) : (
                  <div className="tt-vip-pay-box">
                    <div className="tt-vpb-head"><strong>Medios de Pago Oficiales (0 % comisión)</strong><small>Titular: {VIP_AND_SCALE_EDITABLE_CONFIG.payment.holder}</small></div>
                    <div className="tt-vpb-row">
                      <div><small>Yape / Plin</small><strong>{VIP_AND_SCALE_EDITABLE_CONFIG.payment.yapePlin}</strong></div>
                      <button type="button" className="tt-vpb-copy" onClick={() => handleCopyAccount(VIP_AND_SCALE_EDITABLE_CONFIG.payment.yapePlin, 'Yape / Plin')}>Copiar</button>
                    </div>
                    <div className="tt-vpb-row">
                      <div><small>{VIP_AND_SCALE_EDITABLE_CONFIG.payment.bankName}</small><strong>{VIP_AND_SCALE_EDITABLE_CONFIG.payment.bankAccount}</strong></div>
                      <button type="button" className="tt-vpb-copy" onClick={() => handleCopyAccount(VIP_AND_SCALE_EDITABLE_CONFIG.payment.bankAccount, 'Cuenta')}>Copiar</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={() => setShowPaymentStep(false)}>Volver</button>
                      <button type="button" className="tt-btn tt-btn-primary tt-btn-sm" style={{ flex: 1 }} onClick={handleSendVipVoucher}>
                        <TTIcon name="whatsapp" size={17} /> Enviar Constancia
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'escala' && (
          <div key="vs-escala" className="tt-vs-stack tt-vs-panel-enter">
            {currentUser && !currentUser.isTutorOnly && (
              <div className="tt-road-you-banner">
                <div>
                  <span className="tt-road-you-kicker">TU NIVEL ACTUAL</span>
                  <strong>{userCategory.name} · {userPoints.toLocaleString('es-PE')} pts</strong>
                  <small>
                    {(() => {
                      const idx = CATEGORIES_SCALE.findIndex((c) => c.id === userCategory.id);
                      const next = idx >= 0 && idx < CATEGORIES_SCALE.length - 1 ? CATEGORIES_SCALE[idx + 1] : null;
                      return next ? `A ${Math.max(0, next.min - userPoints).toLocaleString('es-PE')} pts de ${next.name}` : 'Categoría máxima del circuito oficial.';
                    })()}
                  </small>
                </div>
                <IconBadge name="trophy" variant="emerald" size={42} />
              </div>
            )}

            <div className="tt-road-container">
              <span className="tt-vs-kicker">ESCALERA OFICIAL DE CATEGORÍAS</span>
              <div className="tt-road-timeline">
                <div className="tt-road-spine" aria-hidden="true" />
                {scaleRoadTopDown.map((cat, idx) => {
                  const isMine = Boolean(currentUser && !currentUser.isTutorOnly && userCategory.id === cat.id);
                  const visual = getTierVisualMeta(cat.id);
                  const rangeText = cat.max >= 9000 ? `${cat.min.toLocaleString('es-PE')}+ pts` : `${cat.min.toLocaleString('es-PE')} – ${cat.max.toLocaleString('es-PE')} pts`;
                  return (
                    <div key={cat.id} className={`tt-road-node ${isMine ? 'is-current' : ''}`} style={{ '--vs-delay': `${idx * 50}ms` }}>
                      <div className={`tt-road-emblem ${isMine ? 'is-pulsing' : ''}`} style={{ borderColor: isMine ? '#00DC7D' : cat.color, backgroundColor: isMine ? '#00DC7D' : '#1E0734', color: isMine ? '#120321' : cat.color }}>
                        <TTIcon name={visual.badge} size={18} />
                      </div>
                      <div className="tt-road-card">
                        <div className="tt-road-card-top">
                          <span className="tt-road-tier" style={{ color: cat.color }}>{visual.tier}</span>
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

            <div>
              <span className="tt-vs-kicker">REGLAMENTO OFICIAL DEL CIRCUITO</span>
              <div className="tt-rules-visual-grid">
                {VIP_AND_SCALE_EDITABLE_CONFIG.visualRulesCards.map((rule, idx) => (
                  <article key={rule.id} className="tt-rule-vcard" style={{ '--vs-delay': `${idx * 55}ms` }}>
                    <div className="tt-rv-head">
                      <SmartImage src={rule.image} fallbackSrc={ASSETS.logo} alt={rule.title} style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
                      <div>
                        <span style={{ color: rule.accent }}>{rule.kicker}</span>
                        <h4>{rule.title}</h4>
                      </div>
                    </div>
                    <ul>
                      {rule.bullets.map((b, i) => (
                        <li key={i}><TTIcon name="check" size={13} style={{ color: '#00DC7D', flexShrink: 0 }} /><span>{b}</span></li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .tt-vs-root, .tt-vs-stack { display: flex; flex-direction: column; gap: 13px; }
        .tt-vs-panel-enter { animation: ttVsEnter 320ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes ttVsEnter { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        .tt-vs-kicker { display: block; font-size: 0.62rem; font-weight: 900; letter-spacing: 0.09em; color: var(--tt-emerald-text); margin-bottom: 7px; }
        .tt-vs-kicker.is-on-dark { color: #00DC7D !important; }

        .tt-vs-tabs { position: relative; display: grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: 16px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-vs-tab-slider { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 2); border-radius: 12px; transition: transform 320ms cubic-bezier(0.22, 1.24, 0.36, 1), background 300ms ease; pointer-events: none; z-index: 0; }
        .tt-vs-tab-slider.is-gold { background: linear-gradient(135deg, #F5E1A4 0%, #E5C16C 52%, #A67C23 100%); box-shadow: 0 6px 16px rgba(229,193,108,0.34); }
        .tt-vs-tab-slider.is-emerald { background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%); box-shadow: 0 6px 16px rgba(0,220,125,0.28); }
        .tt-vs-root.is-light .tt-vs-tab-slider.is-emerald { background: #1E0734; }
        .tt-vs-tab { position: relative; z-index: 1; min-height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; font-size: 0.77rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-vs-tab.is-active { color: #120321; font-weight: 900; }
        .tt-vs-tab.is-gold.is-active { color: #1A0D00; }
        .tt-vs-root.is-light .tt-vs-tab:not(.is-gold).is-active { color: #00DC7D; }

        .tt-vip-bicolor-banner { border-radius: 22px; overflow: hidden; display: grid; grid-template-columns: 1fr; background: #23083C; color: #FAF9F5; border: 1px solid rgba(229,193,108,0.42); }
        @media (min-width: 640px) { .tt-vip-bicolor-banner { grid-template-columns: 1.25fr 0.85fr; } }
        .tt-vbb-left { padding: 15px; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
        .tt-vbb-kicker { font-size: 0.6rem; font-weight: 900; letter-spacing: 0.1em; color: #F3DC9B; }
        .tt-vbb-left h2 { margin: 0; font-family: var(--tt-font-display); font-style: italic; font-weight: 900; font-size: 1.5rem; line-height: 0.98; color: #00DC7D; }
        .tt-vbb-left p { margin: 0; font-size: 0.77rem; line-height: 1.4; color: rgba(250,249,245,0.88); }
        .tt-vbb-right { position: relative; min-height: 120px; background: linear-gradient(135deg, #00DC7D 0%, #6EF2B5 100%); overflow: hidden; }
        .tt-vbb-img { width: 100%; height: 100%; object-fit: cover; }
        .tt-vbb-price-chip { position: absolute; right: 10px; bottom: 10px; padding: 6px 12px; border-radius: 13px; background: rgba(18,3,33,0.92); border: 1px solid #00DC7D; color: #FAF9F5; text-align: center; }
        .tt-vbb-price-chip strong { display: block; font-family: var(--tt-font-display); font-size: 1.22rem; line-height: 1; color: #00DC7D; }
        .tt-vbb-price-chip span { font-size: 0.62rem; font-weight: 700; opacity: 0.82; }

        .tt-vip3d-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .tt-vip3d-scene { width: 100%; max-width: 410px; aspect-ratio: 1.58 / 1; perspective: 1200px; -webkit-perspective: 1200px; cursor: pointer; }
        .tt-vip3d-card { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; transition: transform 660ms cubic-bezier(0.22, 1.12, 0.36, 1); will-change: transform; }
        .tt-vip3d-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 22px; overflow: hidden; color: #FAF9F5; background: linear-gradient(135deg, #1E0734 0%, #10021C 58%, #21100B 100%); border: 1.5px solid rgba(250,249,245,0.2); box-shadow: 0 20px 42px rgba(8,1,18,0.46); }
        .tt-vip3d-face.is-front { transform: rotateY(0deg) translateZ(2px); -webkit-transform: rotateY(0deg) translateZ(2px); }
        .tt-vip3d-face.is-back { transform: rotateY(180deg) translateZ(2px); -webkit-transform: rotateY(180deg) translateZ(2px); }
        .tt-vip3d-face.is-gold { background: linear-gradient(135deg, #2B1A04 0%, #523308 32%, #1D0A2E 78%, #3B2305 100%); border-color: rgba(252,227,138,0.78); }
        .tt-vip3d-card:not(.is-flipped) .tt-vip3d-face.is-front .is-front-layer { opacity: 1; visibility: visible; transition: opacity 110ms linear 165ms, visibility 0s linear 150ms; }
        .tt-vip3d-card.is-flipped .tt-vip3d-face.is-front .is-front-layer { opacity: 0; visibility: hidden; transition: opacity 80ms linear 130ms, visibility 0s linear 210ms; }
        .tt-vip3d-card.is-flipped .tt-vip3d-face.is-back .is-back-layer { opacity: 1; visibility: visible; transition: opacity 110ms linear 165ms, visibility 0s linear 150ms; }
        .tt-vip3d-card:not(.is-flipped) .tt-vip3d-face.is-back .is-back-layer { opacity: 0; visibility: hidden; transition: opacity 80ms linear 130ms, visibility 0s linear 210ms; }
        .tt-vip3d-foil-sheen { position: absolute; inset: -35%; background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.14) 49%, rgba(245,225,164,0.18) 52%, transparent 60%); transform: translateX(-110%); animation: ttVipFoil 5.5s ease-in-out infinite; pointer-events: none; z-index: 1; }
        @keyframes ttVipFoil { 0%, 64% { transform: translateX(-110%); } 100% { transform: translateX(120%); } }
        .tt-vip3d-custom-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; pointer-events: none; }
        .tt-vip3d-custom-art.is-visible { opacity: 1; }
        .tt-vip3d-etched-court { position: absolute; inset: 14px; border: 1px solid rgba(250,249,245,0.08); border-radius: 13px; pointer-events: none; }
        .tt-vip3d-layer { position: relative; z-index: 2; height: 100%; padding: 15px 17px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(180deg, rgba(16,3,29,0.28) 0%, rgba(16,3,29,0.56) 100%); }
        .tt-vip3d-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tt-vip3d-brand-pair { display: inline-flex; align-items: center; gap: 8px; font-family: var(--tt-font-display); font-style: italic; font-weight: 900; font-size: 1.15rem; }
        .tt-vip3d-status { padding: 4px 10px; border-radius: 999px; background: rgba(250,249,245,0.16); font-size: 0.62rem; font-weight: 900; }
        .tt-vip3d-status.is-gold { background: linear-gradient(135deg, #F5E1A4 0%, #CCA046 100%); color: #1A1102; }
        .tt-vip3d-status.is-pending { background: rgba(229,193,108,0.24); border: 1px solid #E5C16C; color: #F3DC9B; }
        .tt-vip3d-middle { display: flex; align-items: center; gap: 11px; }
        .tt-vip3d-holder { display: block; font-size: 0.94rem; letter-spacing: 0.07em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-vip3d-code { display: block; margin-top: 2px; font-family: ui-monospace, monospace; font-size: 0.74rem; font-weight: 700; color: #00DC7D; }
        .tt-vip3d-club-cat { display: block; font-size: 0.68rem; opacity: 0.8; }
        .tt-vip3d-chip { width: 34px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, #F5E1A4 0%, #B8872C 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tt-vip3d-chip span { width: 18px; height: 12px; border-radius: 3px; border: 1px solid rgba(30,17,2,0.45); }
        .tt-vip3d-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .tt-vip3d-bottom small { display: block; font-size: 0.56rem; opacity: 0.7; }
        .tt-vip3d-bottom strong { font-size: 0.78rem; }
        .tt-vip3d-flip-hint { font-size: 0.65rem; font-weight: 800; color: #7CF5C0; }
        .tt-vip3d-layer.is-back-layout { padding: 12px 16px; }
        .tt-vip3d-magstrip { margin: -12px -16px 0; padding: 7px 16px; background: rgba(8,1,18,0.88); font-size: 0.58rem; font-weight: 900; letter-spacing: 0.1em; color: #00DC7D; text-align: center; }
        .tt-vip3d-back-center { display: flex; align-items: center; gap: 12px; }
        .tt-vip3d-qr-frame { padding: 5px; border-radius: 12px; background: #FAF9F5; flex-shrink: 0; }
        .tt-vip3d-back-info small { display: block; font-size: 0.58rem; opacity: 0.74; }
        .tt-vip3d-back-info strong { display: block; font-family: ui-monospace, monospace; font-size: 0.96rem; color: #F3DC9B; margin: 2px 0; }
        .tt-vip3d-back-info span { display: block; font-size: 0.68rem; opacity: 0.88; }
        .tt-vip3d-barcode { height: 16px; display: flex; align-items: stretch; justify-content: center; gap: 3px; opacity: 0.72; }
        .tt-vip3d-barcode span { background: #FAF9F5; border-radius: 1px; }
        .tt-vip3d-flip-btn { padding: 7px 15px; border-radius: 999px; background: var(--tt-surface-2); border: 1px solid var(--tt-border-medium); color: var(--tt-text); font-size: 0.73rem; font-weight: 800; }

        .tt-vip-benefits-grid, .tt-rules-visual-grid { display: grid; grid-template-columns: 1fr; gap: 9px; }
        @media (min-width: 600px) { .tt-vip-benefits-grid, .tt-rules-visual-grid { grid-template-columns: 1fr 1fr; } }
        .tt-vip-ben-card { display: flex; align-items: center; gap: 11px; padding: 11px; border-radius: 16px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-vip-ben-media { width: 54px; height: 54px; border-radius: 14px; background: #1B0630; border: 1.5px solid transparent; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tt-vip-ben-tag { display: block; font-size: 0.62rem; font-weight: 900; text-transform: uppercase; }
        .tt-vip-ben-card strong { display: block; font-size: 0.84rem; margin-top: 1px; }
        .tt-vip-ben-card p { margin: 2px 0 0; font-size: 0.71rem; line-height: 1.35; color: var(--tt-text-muted); }

        .tt-vip-calc-card { padding: 14px; border-radius: 18px; background: linear-gradient(135deg, #250942 0%, #140324 100%); color: #FAF9F5; border: 1px solid rgba(0,220,125,0.36); display: flex; flex-direction: column; gap: 10px; }
        .tt-vcc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tt-vcc-head strong { font-size: 0.85rem; }
        .tt-vcc-hours-pill { padding: 5px 11px; border-radius: 999px; background: #00DC7D; color: #120321; font-size: 0.74rem; font-weight: 900; }
        .tt-vcc-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: 999px; outline: none; }
        .tt-vcc-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #FAF9F5; border: 3px solid #00DC7D; cursor: pointer; }
        .tt-vcc-breakdown { display: flex; flex-direction: column; gap: 6px; }
        .tt-vcc-breakdown > div { display: flex; justify-content: space-between; gap: 8px; font-size: 0.76rem; }
        .tt-vcc-breakdown .is-net { padding-top: 7px; border-top: 1px solid rgba(250,249,245,0.14); font-size: 0.82rem; }

        .tt-vip-checkout-card { padding: 14px; border-radius: 18px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 11px; }
        .tt-vip-plans-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
        @media (min-width: 600px) { .tt-vip-plans-grid { grid-template-columns: repeat(3, 1fr); } }
        .tt-vip-plan-tile { padding: 11px; border-radius: 15px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); color: var(--tt-text); text-align: left; display: flex; flex-direction: column; gap: 4px; }
        .tt-vip-plan-tile.is-active { border-color: #00DC7D; background: rgba(0,220,125,0.12); }
        .tt-vpt-badge { align-self: flex-start; padding: 2px 7px; border-radius: 999px; background: rgba(229,193,108,0.2); color: #B8872C; font-size: 0.58rem; font-weight: 900; }
        .tt-vs-root.is-dark .tt-vpt-badge { color: #F3DC9B; }
        .tt-vpt-price { display: flex; align-items: baseline; gap: 4px; }
        .tt-vpt-price b { font-family: var(--tt-font-display); font-size: 1.35rem; color: var(--tt-emerald-text); }
        .tt-vpt-price small, .tt-vpt-save { font-size: 0.67rem; color: var(--tt-text-muted); }
        .tt-vip-pending-strip { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-radius: 14px; background: rgba(229,193,108,0.15); border: 1px solid rgba(229,193,108,0.45); font-size: 0.77rem; }
        .tt-vip-pending-strip p { margin: 3px 0 0; font-size: 0.72rem; color: var(--tt-text-muted); }
        .tt-vip-pay-box { display: flex; flex-direction: column; gap: 8px; }
        .tt-vpb-head strong { display: block; font-size: 0.82rem; }
        .tt-vpb-head small { font-size: 0.7rem; color: var(--tt-text-muted); }
        .tt-vpb-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 11px; border-radius: 12px; background: var(--tt-surface); border: 1px solid var(--tt-border); }
        .tt-vpb-row small { display: block; font-size: 0.64rem; color: var(--tt-text-muted); }
        .tt-vpb-row strong { font-size: 0.86rem; }
        .tt-vpb-copy { padding: 5px 11px; border-radius: 999px; background: rgba(0,220,125,0.16); color: #00DC7D; font-size: 0.7rem; font-weight: 800; }
        .tt-vs-root.is-light .tt-vpb-copy { background: #1E0734; color: #00DC7D; }

        .tt-road-you-banner { padding: 14px; border-radius: 18px; background: linear-gradient(135deg, #1E0734 0%, #103F30 100%); color: #FAF9F5; border: 1.5px solid rgba(0,220,125,0.52); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .tt-road-you-kicker { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.09em; color: #7CF5C0; }
        .tt-road-you-banner strong { display: block; font-family: var(--tt-font-display); font-size: 1.35rem; line-height: 1.08; }
        .tt-road-you-banner small { display: block; margin-top: 2px; font-size: 0.74rem; color: rgba(250,249,245,0.86); }
        .tt-road-timeline { position: relative; display: flex; flex-direction: column; gap: 10px; padding-left: 8px; }
        .tt-road-spine { position: absolute; left: 27px; top: 18px; bottom: 18px; width: 3px; border-radius: 999px; background: linear-gradient(180deg, #E5C16C 0%, #00DC7D 52%, #DE8566 100%); opacity: 0.7; }
        .tt-road-node { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; }
        .tt-road-emblem { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #00DC7D; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tt-road-emblem.is-pulsing { animation: ttLivePulse 2s infinite; }
        .tt-road-card { flex: 1; padding: 11px 13px; border-radius: 16px; background: var(--tt-surface-2); border: 1.5px solid var(--tt-border); }
        .tt-road-node.is-current .tt-road-card { border-color: #00DC7D; background: rgba(0,220,125,0.12); }
        .tt-road-card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .tt-road-tier { font-size: 0.6rem; font-weight: 900; letter-spacing: 0.08em; }
        .tt-road-range { font-size: 0.73rem; font-variant-numeric: tabular-nums; }
        .tt-road-card-mid { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
        .tt-road-card-mid h4 { margin: 0; font-family: var(--tt-font-display); font-size: 1.14rem; }
        .tt-road-here-pill { padding: 2px 8px; border-radius: 999px; background: #00DC7D; color: #120321; font-size: 0.58rem; font-weight: 900; }
        .tt-road-card p { margin: 3px 0 0; font-size: 0.72rem; color: var(--tt-text-muted); }

        .tt-rule-vcard { padding: 13px; border-radius: 16px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 8px; }
        .tt-rv-head { display: flex; align-items: center; gap: 10px; }
        .tt-rv-head span { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.08em; }
        .tt-rv-head h4 { margin: 2px 0 0; font-size: 0.85rem; line-height: 1.2; }
        .tt-rule-vcard ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
        .tt-rule-vcard li { display: flex; align-items: flex-start; gap: 6px; font-size: 0.73rem; color: var(--tt-text-muted); line-height: 1.36; }
        html[data-tier='lite'] .tt-vip3d-foil-sheen { display: none !important; }
      `}</style>
    </ModalPortal>
  );
}
