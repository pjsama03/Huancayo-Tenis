import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ASSETS, SmartImage, TTIcon, triggerHaptic } from './AppIcons';
import { buildWhatsappLink, uploadCompressedMedia } from '../utils/cloudService';

/* ==========================================================================
   MOTOR COMERCIAL DE PATROCINADORES · 3 NIVELES + CACHÉ 0 MS + EXENCIÓN VIP
   Nivel 1 (CAROUSEL)     : Slide en Carrusel Hero Rotativo (Contrato Básico)
   Nivel 2 (STATIC)       : Espacio Estático Exclusivo fijo (Contrato Medio)
   Nivel 3 (INTERSTITIAL) : Pantalla Completa Invasiva (Contrato Premium · VIP exento)
   ========================================================================== */
export const SPONSORS_CACHE_KEY = 'tt_sponsors_config_cache_v2';
const INTERSTITIAL_COOLDOWN_PREFIX = 'tt_sp_interstitial_seen_v1_';

export const SPONSOR_LEVELS = {
  CAROUSEL: {
    id: 'CAROUSEL',
    tier: 'Nivel 1 · Básico',
    shortLabel: 'Carrusel Superior',
    hint: 'Rota en el banner principal junto al circuito.',
    tone: 'emerald',
  },
  STATIC: {
    id: 'STATIC',
    tier: 'Nivel 2 · Exclusivo',
    shortLabel: 'Banner Estático Fijo',
    hint: 'Espacio propio fijo que no se mezcla con otras marcas.',
    tone: 'sky',
  },
  INTERSTITIAL: {
    id: 'INTERSTITIAL',
    tier: 'Nivel 3 · Alto Impacto',
    shortLabel: 'Pop-Up Pantalla Completa',
    hint: 'Anuncio grande tras X seg de uso. Socios VIP nunca lo ven.',
    tone: 'gold',
  },
};

export function createDefaultSponsorsConfig() {
  return {
    titleSponsorActive: false,
    titleSponsorName: '',
    titleSponsorUrl: '',
    weatherSponsorActive: false,
    weatherSponsorName: '',
    raffleSponsorActive: true,
    rafflePrizeText: '2 Tarros de Pelotas Pro + 1 Encordado Completo',
    campaigns: [],
  };
}

export function normalizeSponsorsConfig(raw) {
  const base = createDefaultSponsorsConfig();
  if (!raw || typeof raw !== 'object') return base;
  const rawCampaigns = Array.isArray(raw.campaigns) ? raw.campaigns : [];

  const campaigns = rawCampaigns
    .filter((c) => c && typeof c === 'object')
    .map((c, idx) => {
      const level = SPONSOR_LEVELS[c.level] ? c.level : 'CAROUSEL';
      return {
        id: String(c.id || `sp-${idx + 1}`),
        level,
        brandName: String(c.brandName || '').trim(),
        tag: String(c.tag || 'PATROCINADOR OFICIAL').trim(),
        title: String(c.title || '').trim(),
        description: String(c.description || '').trim(),
        priceText: String(c.priceText || '').trim(),
        ctaLabel: String(c.ctaLabel || 'Ver Oferta').trim(),
        targetUrl: String(c.targetUrl || '').trim(),
        whatsapp: String(c.whatsapp || '').trim(),
        imageUrl: String(c.imageUrl || '').trim(),
        active: c.active !== false,
        delaySec: Math.max(4, Math.min(180, Number(c.delaySec) || 14)),
        countdownSec: Math.max(0, Math.min(10, Number(c.countdownSec ?? 4))),
        cooldownMin: Math.max(1, Math.min(1440, Number(c.cooldownMin) || 20)),
        priority: Number(c.priority) || idx + 1,
        impressions: Math.max(0, Number(c.impressions) || 0),
        clicks: Math.max(0, Number(c.clicks) || 0),
        createdAt: c.createdAt || new Date().toISOString(),
      };
    })
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  return {
    ...base,
    ...raw,
    campaigns,
  };
}

export function readCachedSponsorsConfig() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SPONSORS_CACHE_KEY);
    if (!raw) return null;
    return normalizeSponsorsConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeCachedSponsorsConfig(cfg) {
  if (typeof window === 'undefined' || !cfg) return;
  try {
    window.localStorage.setItem(SPONSORS_CACHE_KEY, JSON.stringify(normalizeSponsorsConfig(cfg)));
  } catch {
    // continuar si el navegador bloquea storage
  }
}

export function buildSponsorHref(campaign) {
  if (!campaign) return '';
  const cleanUrl = String(campaign.targetUrl || '').trim();
  if (/^https?:\/\//i.test(cleanUrl)) {
    try {
      const u = new URL(cleanUrl);
      if (!u.searchParams.has('utm_source')) {
        u.searchParams.set('utm_source', 'totaltenis');
        u.searchParams.set('utm_medium', `sponsor_${String(campaign.level || 'app').toLowerCase()}`);
      }
      return u.toString();
    } catch {
      return cleanUrl;
    }
  }
  const cleanWa = String(campaign.whatsapp || '').replace(/\D/g, '');
  if (cleanWa.length >= 9) {
    const msg = `Hola ${campaign.brandName || ''}, vi su promoción "${
      campaign.title || 'TOTAL TENIS'
    }" en la app TOTAL TENIS y quisiera más información.`;
    return buildWhatsappLink(cleanWa, msg);
  }
  return '';
}

export function getActiveSponsorsByLevel(sponsorsConfig, level) {
  const norm = normalizeSponsorsConfig(sponsorsConfig);
  return norm.campaigns.filter((c) => c.active && c.level === level && (c.title || c.imageUrl));
}

/* ==========================================================================
   NIVEL 2 (EXCLUSIVO): BANNER ESTÁTICO FIJO 3D (NO ROTA NI SE MEZCLA)
   ========================================================================== */
export function SponsorStaticBanner({
  sponsorsConfig = null,
  theme = 'dark',
  onTrackImpression,
  onTrackClick,
}) {
  const trackedIdsRef = useRef(new Set());
  const staticList = useMemo(
    () => getActiveSponsorsByLevel(sponsorsConfig, 'STATIC'),
    [sponsorsConfig]
  );

  // Contrato Exclusivo: muestra el patrocinador fijo de mayor prioridad sin mezclarlo
  const campaign = staticList[0] || null;

  useEffect(() => {
    if (!campaign?.id || trackedIdsRef.current.has(campaign.id)) return;
    trackedIdsRef.current.add(campaign.id);
    if (onTrackImpression) onTrackImpression(campaign.id);
  }, [campaign?.id, onTrackImpression]);

  if (!campaign) return null;

  const href = buildSponsorHref(campaign);
  const modeClass = theme === 'light' ? 'is-light' : 'is-dark';

  const handleActionClick = () => {
    triggerHaptic('medium');
    if (onTrackClick) onTrackClick(campaign.id);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <aside
      className={`tt-sp-static-card ${modeClass}`}
      aria-label={`Espacio exclusivo de ${campaign.brandName || campaign.title}`}
    >
      <div className="tt-sp-static-media">
        <SmartImage
          src={campaign.imageUrl || ASSETS.torneoApertura}
          fallbackSrc={ASSETS.torneoApertura}
          alt={campaign.title || campaign.brandName || 'Patrocinador Oficial'}
          priority
          className="tt-sp-static-img"
        />
        <span className="tt-sp-exclusive-pill">
          <i />
          {campaign.tag || 'PATROCINADOR EXCLUSIVO'}
        </span>
        {campaign.priceText && <span className="tt-sp-price-badge">{campaign.priceText}</span>}
      </div>

      <div className="tt-sp-static-body">
        <div className="tt-sp-static-text">
          {campaign.brandName && <span className="tt-sp-brand-kicker">{campaign.brandName}</span>}
          <h3>{campaign.title}</h3>
          {campaign.description && <p>{campaign.description}</p>}
        </div>

        {href && (
          <button type="button" className="tt-sp-3d-cta is-emerald" onClick={handleActionClick}>
            <span>{campaign.ctaLabel || 'Ver Oferta'}</span>
            <TTIcon name="externalLink" size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}

/* ==========================================================================
   NIVEL 3 (ALTO IMPACTO): INTERSTICIAL PANTALLA COMPLETA (SOCIOS VIP EXENTOS)
   ========================================================================== */
export function SponsorInterstitialModal({
  sponsorsConfig = null,
  isVip = false,
  isSuppressed = false,
  previewCampaign = null,
  onClosePreview,
  onOpenVipCard,
  onTrackImpression,
  onTrackClick,
}) {
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  const interstitialPool = useMemo(
    () => getActiveSponsorsByLevel(sponsorsConfig, 'INTERSTITIAL'),
    [sponsorsConfig]
  );

  // Modo Vista Previa directa desde el Panel Admin (ignora VIP y cooldown)
  useEffect(() => {
    if (!previewCampaign) return;
    setActiveCampaign(previewCampaign);
    setSecondsLeft(Math.max(0, Number(previewCampaign.countdownSec ?? 3)));
  }, [previewCampaign]);

  // Programador automático para usuarios gratuitos (VIP jamás ve pop-ups invasivos)
  useEffect(() => {
    if (previewCampaign) return undefined;
    if (isVip || isSuppressed || activeCampaign || interstitialPool.length === 0) {
      return undefined;
    }

    const now = Date.now();
    const eligible = interstitialPool.find((c) => {
      try {
        const raw = window.localStorage.getItem(`${INTERSTITIAL_COOLDOWN_PREFIX}${c.id}`);
        if (!raw) return true;
        const elapsedMin = (now - Number(raw)) / 60000;
        return Number.isNaN(elapsedMin) || elapsedMin >= (Number(c.cooldownMin) || 20);
      } catch {
        return true;
      }
    });

    if (!eligible) return undefined;

    const delayMs = Math.max(4, Number(eligible.delaySec) || 14) * 1000;
    timerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(`${INTERSTITIAL_COOLDOWN_PREFIX}${eligible.id}`, String(Date.now()));
      } catch {
        // continuar
      }
      setActiveCampaign(eligible);
      setSecondsLeft(Math.max(0, Number(eligible.countdownSec ?? 4)));
      if (onTrackImpression) onTrackImpression(eligible.id);
    }, delayMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [
    previewCampaign,
    isVip,
    isSuppressed,
    activeCampaign,
    interstitialPool,
    onTrackImpression,
  ]);

  // Cuenta regresiva del botón cerrar
  useEffect(() => {
    if (!activeCampaign || secondsLeft <= 0) return undefined;
    const id = window.setTimeout(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [activeCampaign, secondsLeft]);

  if (!activeCampaign) return null;

  const canClose = secondsLeft <= 0;
  const href = buildSponsorHref(activeCampaign);

  const handleClose = () => {
    if (!canClose) return;
    triggerHaptic('light');
    setActiveCampaign(null);
    if (previewCampaign && onClosePreview) onClosePreview();
  };

  const handlePrimaryCta = () => {
    triggerHaptic('success');
    if (!previewCampaign && onTrackClick) onTrackClick(activeCampaign.id);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    setActiveCampaign(null);
    if (previewCampaign && onClosePreview) onClosePreview();
  };

  return (
    <div
      className="tt-sp-interstitial-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Anuncio de ${activeCampaign.brandName || activeCampaign.title}`}
    >
      <div className="tt-sp-interstitial-card">
        {/* Cabecera flotante con etiqueta y botón de cierre con cuenta regresiva */}
        <div className="tt-sp-inter-top">
          <span className="tt-sp-inter-badge">
            {previewCampaign ? 'VISTA PREVIA · NIVEL 3' : activeCampaign.tag || 'PATROCINADOR OFICIAL'}
          </span>

          <button
            type="button"
            disabled={!canClose}
            className={`tt-sp-inter-close ${canClose ? 'is-ready' : ''}`}
            onClick={handleClose}
          >
            {canClose ? '✕ Cerrar' : `Cerrar en ${secondsLeft}s`}
          </button>
        </div>

        {/* Imagen de Alto Impacto */}
        <div className="tt-sp-inter-media">
          <SmartImage
            src={activeCampaign.imageUrl || ASSETS.torneoMasterTop8}
            fallbackSrc={ASSETS.torneoMasterTop8}
            alt={activeCampaign.title || activeCampaign.brandName || 'Anuncio'}
            priority
            className="tt-sp-inter-img"
          />
          <div className="tt-sp-inter-scrim" />
          {activeCampaign.priceText && (
            <span className="tt-sp-inter-price">{activeCampaign.priceText}</span>
          )}
        </div>

        {/* Contenido Comercial + Botón 3D + Conversión a Socio VIP */}
        <div className="tt-sp-inter-body">
          {activeCampaign.brandName && (
            <span className="tt-sp-inter-brand">{activeCampaign.brandName}</span>
          )}
          <h2>{activeCampaign.title || 'Promoción Exclusiva del Circuito'}</h2>
          {activeCampaign.description && <p>{activeCampaign.description}</p>}

          <div className="tt-sp-inter-actions">
            {href && (
              <button
                type="button"
                className="tt-sp-3d-cta is-gold"
                style={{ width: '100%' }}
                onClick={handlePrimaryCta}
              >
                <span>{activeCampaign.ctaLabel || 'Aprovechar Promoción'}</span>
                <TTIcon name="externalLink" size={16} />
              </button>
            )}

            {canClose && (
              <button
                type="button"
                className="tt-sp-inter-skip"
                onClick={handleClose}
              >
                Continuar a la app
              </button>
            )}
          </div>

          {!isVip && onOpenVipCard && (
            <button
              type="button"
              className="tt-sp-vip-upsell-bar"
              onClick={() => {
                triggerHaptic('medium');
                setActiveCampaign(null);
                if (previewCampaign && onClosePreview) onClosePreview();
                onOpenVipCard();
              }}
            >
              <TTIcon name="crown" size={14} style={{ color: '#F6E2A8', flexShrink: 0 }} />
              <span>¿Prefieres la app sin anuncios pantalla completa? Hazte Socio VIP →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   GESTOR COMERCIAL 3D PARA SUITE ADMIN (3 NIVELES + MÉTRICAS + SUBIDA FOTO)
   ========================================================================== */
function createBlankCampaignDraft(level = 'CAROUSEL') {
  return {
    id: null,
    level,
    brandName: '',
    tag:
      level === 'INTERSTITIAL'
        ? 'PRESENTADO POR'
        : level === 'STATIC'
        ? 'PATROCINADOR EXCLUSIVO'
        : 'PATROCINADOR OFICIAL',
    title: '',
    description: '',
    priceText: '',
    ctaLabel: 'Ver Oferta',
    targetUrl: '',
    whatsapp: '',
    imageUrl: '',
    active: true,
    delaySec: 12,
    countdownSec: 4,
    cooldownMin: 20,
  };
}

export function AdminSponsorsManager({
  sponsorsConfig = null,
  onSaveSponsors,
  onPreviewInterstitial,
  onNotify,
}) {
  const fileRef = useRef(null);
  const [config, setConfig] = useState(() => normalizeSponsorsConfig(sponsorsConfig));
  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState(() => createBlankCampaignDraft('CAROUSEL'));
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    setConfig(normalizeSponsorsConfig(sponsorsConfig));
  }, [sponsorsConfig]);

  const persistConfig = (nextRaw, toastMsg = '') => {
    const clean = normalizeSponsorsConfig(nextRaw);
    setConfig(clean);
    writeCachedSponsorsConfig(clean);
    if (onSaveSponsors) onSaveSponsors(clean);
    if (toastMsg && onNotify) onNotify(toastMsg, 'success');
  };

  const handlePickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const uploadedUrl = await uploadCompressedMedia(
        file,
        'sponsors',
        draft.id || `sp-${Date.now()}`
      );
      if (uploadedUrl) {
        setDraft((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        triggerHaptic('success');
        if (onNotify) onNotify('Imagen del patrocinador cargada y optimizada.', 'success');
      }
    } catch {
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos subir esa imagen. Usa JPG, PNG o WebP.', 'warning');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const openNewCampaign = (level = 'CAROUSEL') => {
    triggerHaptic('light');
    setDraft(createBlankCampaignDraft(level));
    setShowEditor(true);
  };

  const openEditCampaign = (item) => {
    triggerHaptic('light');
    setDraft({
      id: item.id,
      level: item.level || 'CAROUSEL',
      brandName: item.brandName || '',
      tag: item.tag || 'PATROCINADOR OFICIAL',
      title: item.title || '',
      description: item.description || '',
      priceText: item.priceText || '',
      ctaLabel: item.ctaLabel || 'Ver Oferta',
      targetUrl: item.targetUrl || '',
      whatsapp: item.whatsapp || '',
      imageUrl: item.imageUrl || '',
      active: item.active !== false,
      delaySec: item.delaySec ?? 12,
      countdownSec: item.countdownSec ?? 4,
      cooldownMin: item.cooldownMin ?? 20,
    });
    setShowEditor(true);
  };

  const handleSaveCampaign = (e) => {
    e.preventDefault();
    if (draft.title.trim().length < 3) {
      triggerHaptic('warning');
      if (onNotify) onNotify('Escribe un título llamativo para el anuncio.', 'warning');
      return;
    }

    const existingList = config.campaigns || [];
    const existingItem = draft.id ? existingList.find((c) => c.id === draft.id) : null;

    const itemToSave = {
      ...(existingItem || {}),
      id: draft.id || `sp-${Date.now()}`,
      level: draft.level,
      brandName: draft.brandName.trim(),
      tag: draft.tag.trim() || 'PATROCINADOR OFICIAL',
      title: draft.title.trim(),
      description: draft.description.trim(),
      priceText: draft.priceText.trim(),
      ctaLabel: draft.ctaLabel.trim() || 'Ver Oferta',
      targetUrl: draft.targetUrl.trim(),
      whatsapp: draft.whatsapp.trim(),
      imageUrl: draft.imageUrl.trim(),
      active: draft.active !== false,
      delaySec: Math.max(4, Math.min(180, Number(draft.delaySec) || 12)),
      countdownSec: Math.max(0, Math.min(10, Number(draft.countdownSec ?? 4))),
      cooldownMin: Math.max(1, Math.min(1440, Number(draft.cooldownMin) || 20)),
      priority: existingItem?.priority || existingList.length + 1,
      impressions: existingItem?.impressions || 0,
      clicks: existingItem?.clicks || 0,
      createdAt: existingItem?.createdAt || new Date().toISOString(),
    };

    const nextCampaigns = existingItem
      ? existingList.map((c) => (c.id === itemToSave.id ? itemToSave : c))
      : [itemToSave, ...existingList];

    triggerHaptic('success');
    persistConfig(
      { ...config, campaigns: nextCampaigns },
      existingItem
        ? `Anuncio "${itemToSave.title}" actualizado en vivo.`
        : `Patrocinador "${itemToSave.title}" publicado en vivo.`
    );
    setShowEditor(false);
    setDraft(createBlankCampaignDraft('CAROUSEL'));
  };

  const handleToggleActive = (id) => {
    triggerHaptic('light');
    const nextCampaigns = (config.campaigns || []).map((c) =>
      c.id === id ? { ...c, active: !c.active } : c
    );
    persistConfig({ ...config, campaigns: nextCampaigns }, 'Estado del patrocinador actualizado.');
  };

  const handleMovePriority = (id, dir) => {
    const list = [...(config.campaigns || [])];
    const idx = list.findIndex((c) => c.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;
    [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
    const reprioritized = list.map((c, i) => ({ ...c, priority: i + 1 }));
    triggerHaptic('light');
    persistConfig({ ...config, campaigns: reprioritized });
  };

  const handleDeleteCampaign = (id) => {
    if (confirmDeleteId !== id) {
      triggerHaptic('warning');
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    triggerHaptic('medium');
    const nextCampaigns = (config.campaigns || []).filter((c) => c.id !== id);
    persistConfig({ ...config, campaigns: nextCampaigns }, 'Patrocinador eliminado.');
  };

  const handleSaveGlobalBranding = (e) => {
    e.preventDefault();
    triggerHaptic('success');
    persistConfig(config, 'Co-branding y premio del sorteo guardados.');
  };

  const totals = useMemo(() => {
    const list = config.campaigns || [];
    const views = list.reduce((sum, c) => sum + (Number(c.impressions) || 0), 0);
    const clicks = list.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
    return {
      carousel: list.filter((c) => c.active && c.level === 'CAROUSEL').length,
      staticSlot: list.filter((c) => c.active && c.level === 'STATIC').length,
      interstitial: list.filter((c) => c.active && c.level === 'INTERSTITIAL').length,
      views,
      clicks,
      ctr: views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0',
    };
  }, [config.campaigns]);

  return (
    <div className="tt-adm-stack">
      {/* RESUMEN COMERCIAL 3 NIVELES + MÉTRICAS */}
      <div className="tt-adm-panel is-highlight tt-adm-form-stack">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span className="tt-adm-kicker" style={{ margin: 0 }}>
              MOTOR COMERCIAL · 3 NIVELES DE PATROCINIO
            </span>
            <small style={{ color: 'rgba(250, 249, 245, 0.78)', fontSize: '0.7rem' }}>
              {totals.views.toLocaleString('es-PE')} vistas · {totals.clicks.toLocaleString('es-PE')}{' '}
              clics · CTR {totals.ctr}%
            </small>
          </div>
          <button
            type="button"
            className="tt-adm-btn-emerald is-sm"
            onClick={() => (showEditor ? setShowEditor(false) : openNewCampaign('CAROUSEL'))}
          >
            {showEditor ? 'Cerrar Editor' : '+ Nuevo Anuncio'}
          </button>
        </div>

        <div className="tt-sp-tiers-summary">
          <button
            type="button"
            className="tt-sp-tier-pill is-emerald"
            onClick={() => openNewCampaign('CAROUSEL')}
          >
            <span>NIVEL 1 · BÁSICO</span>
            <strong>{totals.carousel} activos</strong>
            <small>Carrusel Superior</small>
          </button>
          <button
            type="button"
            className="tt-sp-tier-pill is-sky"
            onClick={() => openNewCampaign('STATIC')}
          >
            <span>NIVEL 2 · EXCLUSIVO</span>
            <strong>{totals.staticSlot} activos</strong>
            <small>Espacio Fijo Propio</small>
          </button>
          <button
            type="button"
            className="tt-sp-tier-pill is-gold"
            onClick={() => openNewCampaign('INTERSTITIAL')}
          >
            <span>NIVEL 3 · PREMIUM</span>
            <strong>{totals.interstitial} activos</strong>
            <small>Pop-Up (VIP exento)</small>
          </button>
        </div>
      </div>

      {/* EDITOR VISUAL 3D DE CAMPAÑA */}
      {showEditor && (
        <form onSubmit={handleSaveCampaign} className="tt-adm-panel tt-adm-form-stack">
          <span className="tt-adm-kicker" style={{ margin: 0 }}>
            {draft.id ? 'EDITAR ANUNCIO DE PATROCINADOR' : 'CREAR NUEVO PATROCINADOR'}
          </span>

          <div className="tt-sp-level-selector">
            {Object.values(SPONSOR_LEVELS).map((lv) => {
              const selected = draft.level === lv.id;
              return (
                <button
                  key={lv.id}
                  type="button"
                  className={`tt-sp-level-opt is-${lv.tone} ${selected ? 'is-selected' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setDraft((prev) => ({
                      ...prev,
                      level: lv.id,
                      tag:
                        !prev.id
                          ? lv.id === 'INTERSTITIAL'
                            ? 'PRESENTADO POR'
                            : lv.id === 'STATIC'
                            ? 'PATROCINADOR EXCLUSIVO'
                            : 'PATROCINADOR OFICIAL'
                          : prev.tag,
                    }));
                  }}
                >
                  <strong>{lv.tier}</strong>
                  <small>{lv.shortLabel}</small>
                </button>
              );
            })}
          </div>

          <p className="tt-adm-subcopy">{SPONSOR_LEVELS[draft.level]?.hint}</p>

          {/* Subida directa de foto del patrocinador */}
          <div className="tt-sp-photo-picker">
            <div className="tt-sp-photo-thumb">
              {draft.imageUrl ? (
                <SmartImage
                  src={draft.imageUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <TTIcon name="camera" size={22} style={{ opacity: 0.6 }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePickPhoto}
              />
              <button
                type="button"
                disabled={uploadingPhoto}
                className="tt-adm-btn-gold is-sm"
                onClick={() => fileRef.current?.click()}
              >
                <TTIcon name="camera" size={14} />
                {uploadingPhoto ? 'Optimizando y subiendo...' : 'Subir Foto / Banner del Celular'}
              </button>
              <input
                type="url"
                className="tt-adm-input"
                value={draft.imageUrl}
                onChange={(e) => setDraft((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="O pega URL directa de imagen (opcional)"
              />
            </div>
          </div>

          <div className="tt-adm-grid-2">
            <label className="tt-adm-lbl">
              <span>Marca / Empresa</span>
              <input
                className="tt-adm-input"
                value={draft.brandName}
                onChange={(e) => setDraft((p) => ({ ...p, brandName: e.target.value }))}
                placeholder="Ej. Clínica Dental / Babolat"
              />
            </label>
            <label className="tt-adm-lbl">
              <span>Etiqueta superior</span>
              <input
                className="tt-adm-input"
                value={draft.tag}
                onChange={(e) => setDraft((p) => ({ ...p, tag: e.target.value }))}
                placeholder="Ej. PATROCINADOR OFICIAL"
              />
            </label>
          </div>

          <label className="tt-adm-lbl">
            <span>Título principal del anuncio *</span>
            <input
              className="tt-adm-input"
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="Ej. 20% OFF en Encordado y Accesorios para Jugadores"
              required
            />
          </label>

          <label className="tt-adm-lbl">
            <span>Descripción corta</span>
            <textarea
              rows={2}
              className="tt-adm-input"
              style={{ paddingTop: 9, minHeight: 62 }}
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              placeholder="Detalle breve de la promoción o beneficio..."
            />
          </label>

          <div className="tt-adm-grid-2">
            <label className="tt-adm-lbl">
              <span>Precio o Promoción (opcional)</span>
              <input
                className="tt-adm-input"
                value={draft.priceText}
                onChange={(e) => setDraft((p) => ({ ...p, priceText: e.target.value }))}
                placeholder="Ej. S/ 99 · 20% OFF"
              />
            </label>
            <label className="tt-adm-lbl">
              <span>Texto del botón</span>
              <input
                className="tt-adm-input"
                value={draft.ctaLabel}
                onChange={(e) => setDraft((p) => ({ ...p, ctaLabel: e.target.value }))}
                placeholder="Ej. Ver Oferta / Reservar"
              />
            </label>
          </div>

          <div className="tt-adm-grid-2">
            <label className="tt-adm-lbl">
              <span>Enlace web externo</span>
              <input
                type="url"
                className="tt-adm-input"
                value={draft.targetUrl}
                onChange={(e) => setDraft((p) => ({ ...p, targetUrl: e.target.value }))}
                placeholder="Pega enlace web de la marca"
              />
            </label>
            <label className="tt-adm-lbl">
              <span>O WhatsApp directo (9 dígitos)</span>
              <input
                type="tel"
                className="tt-adm-input"
                value={draft.whatsapp}
                onChange={(e) => setDraft((p) => ({ ...p, whatsapp: e.target.value }))}
                placeholder="Ej. 964112233"
              />
            </label>
          </div>

          {draft.level === 'INTERSTITIAL' && (
            <div className="tt-adm-grid-3">
              <label className="tt-adm-lbl">
                <span>Sale tras (seg)</span>
                <input
                  type="number"
                  min={4}
                  max={180}
                  className="tt-adm-input"
                  value={draft.delaySec}
                  onChange={(e) => setDraft((p) => ({ ...p, delaySec: Number(e.target.value) || 12 }))}
                />
              </label>
              <label className="tt-adm-lbl">
                <span>Cierre en (seg)</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className="tt-adm-input"
                  value={draft.countdownSec}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, countdownSec: Math.max(0, Number(e.target.value) || 0) }))
                  }
                />
              </label>
              <label className="tt-adm-lbl">
                <span>Repetir cada (min)</span>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  className="tt-adm-input"
                  value={draft.cooldownMin}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, cooldownMin: Number(e.target.value) || 20 }))
                  }
                />
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="tt-adm-btn-emerald" style={{ flex: 1 }}>
              {draft.id ? 'Guardar Cambios en Vivo' : 'Publicar Patrocinador Ahora'}
            </button>
            <button
              type="button"
              className="tt-adm-btn-ghost"
              onClick={() => setShowEditor(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* LISTADO DE PATROCINADORES ACTIVOS Y PAUSADOS */}
      <div className="tt-adm-panel tt-adm-form-stack">
        <span className="tt-adm-kicker" style={{ margin: 0 }}>
          ANUNCIOS CONFIGURADOS ({(config.campaigns || []).length})
        </span>

        {(config.campaigns || []).length === 0 ? (
          <p className="tt-adm-empty">
            Aún no creaste ningún patrocinador. Pulsa <b>+ Nuevo Anuncio</b> para cargar tu primera
            marca en Carrusel, Banner Estático Exclusivo o Pop-Up Pantalla Completa.
          </p>
        ) : (
          <div className="tt-adm-list">
            {(config.campaigns || []).map((c, idx) => {
              const lv = SPONSOR_LEVELS[c.level] || SPONSOR_LEVELS.CAROUSEL;
              const ctr =
                c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : '0.0';
              return (
                <div
                  key={c.id}
                  className={`tt-adm-account-card ${!c.active ? 'is-paused' : ''}`}
                >
                  <div className="tt-adm-acc-top">
                    <SmartImage
                      src={c.imageUrl || ASSETS.torneoApertura}
                      fallbackSrc={ASSETS.torneoApertura}
                      alt={c.title}
                      style={{
                        width: 58,
                        height: 44,
                        borderRadius: 10,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span
                          className={
                            lv.tone === 'gold'
                              ? 'tt-adm-tag-gold'
                              : lv.tone === 'sky'
                              ? 'tt-adm-tag-sky'
                              : 'tt-adm-tag-emerald'
                          }
                        >
                          {lv.tier}
                        </span>
                        {c.priceText && <span className="tt-adm-tag-gold">{c.priceText}</span>}
                        {!c.active && <span className="tt-adm-tag-red">PAUSADO</span>}
                      </div>
                      <strong style={{ display: 'block', marginTop: 3 }}>
                        {c.brandName ? `${c.brandName} · ` : ''}
                        {c.title}
                      </strong>
                      <small>
                        👁 {c.impressions} vistas · 👆 {c.clicks} clics ({ctr}% CTR)
                      </small>
                    </div>
                  </div>

                  <div className="tt-adm-acc-actions">
                    <button
                      type="button"
                      className={`tt-adm-chip ${c.active ? 'is-emerald' : 'is-danger'}`}
                      onClick={() => handleToggleActive(c.id)}
                    >
                      {c.active ? 'ON · Activo' : 'OFF · Pausado'}
                    </button>
                    <button
                      type="button"
                      className="tt-adm-chip"
                      onClick={() => openEditCampaign(c)}
                    >
                      Editar
                    </button>
                    {c.level === 'INTERSTITIAL' && onPreviewInterstitial && (
                      <button
                        type="button"
                        className="tt-adm-chip is-gold"
                        onClick={() => {
                          triggerHaptic('medium');
                          onPreviewInterstitial(c);
                        }}
                      >
                        Probar Pop-Up
                      </button>
                    )}
                    {idx > 0 && (
                      <button
                        type="button"
                        className="tt-adm-chip"
                        onClick={() => handleMovePriority(c.id, -1)}
                      >
                        ↑ Subir
                      </button>
                    )}
                    <button
                      type="button"
                      className="tt-adm-chip is-danger"
                      onClick={() => handleDeleteCampaign(c.id)}
                    >
                      {confirmDeleteId === c.id ? 'Confirmar borrar' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CO-BRANDING INSTITUCIONAL Y SORTEO */}
      <form onSubmit={handleSaveGlobalBranding} className="tt-adm-panel tt-adm-form-stack">
        <span className="tt-adm-kicker" style={{ margin: 0 }}>
          CO-BRANDING INSTITUCIONAL & SORTEO MENSUAL
        </span>

        <div className="tt-adm-toggle-line">
          <div>
            <strong>Title Sponsor (Co-branding)</strong>
            <small>Aparece en cabecera, Splash y pie de Stories 9:16.</small>
          </div>
          <button
            type="button"
            className={`tt-adm-chip ${config.titleSponsorActive ? 'is-emerald' : ''}`}
            onClick={() =>
              setConfig((s) => ({ ...s, titleSponsorActive: !s.titleSponsorActive }))
            }
          >
            {config.titleSponsorActive ? 'ON' : 'OFF'}
          </button>
        </div>
        <input
          className="tt-adm-input"
          value={config.titleSponsorName || ''}
          onChange={(e) => setConfig((s) => ({ ...s, titleSponsorName: e.target.value }))}
          placeholder="Nombre del Sponsor Principal"
        />

        <div className="tt-adm-toggle-line">
          <div>
            <strong>Auspiciador Clima en Sedes</strong>
            <small>Acompaña el estado de canchas en Sedes Oficiales.</small>
          </div>
          <button
            type="button"
            className={`tt-adm-chip ${config.weatherSponsorActive ? 'is-emerald' : ''}`}
            onClick={() =>
              setConfig((s) => ({ ...s, weatherSponsorActive: !s.weatherSponsorActive }))
            }
          >
            {config.weatherSponsorActive ? 'ON' : 'OFF'}
          </button>
        </div>
        <input
          className="tt-adm-input"
          value={config.weatherSponsorName || ''}
          onChange={(e) => setConfig((s) => ({ ...s, weatherSponsorName: e.target.value }))}
          placeholder="Nombre del Sponsor de Clima"
        />

        <label className="tt-adm-lbl">
          <span>Premio del Sorteo Mensual (Pro Shop)</span>
          <input
            className="tt-adm-input"
            value={config.rafflePrizeText || ''}
            onChange={(e) => setConfig((s) => ({ ...s, rafflePrizeText: e.target.value }))}
          />
        </label>
        <button type="submit" className="tt-adm-btn-emerald">
          Guardar Co-Branding
        </button>
      </form>
    </div>
  );
}

/* ==========================================================================
   ESTILOS 3D TÁCTILES + LIQUID GLASS (INYECCIÓN ÚNICA GLOBAL · CLARO Y OSCURO)
   ========================================================================== */
const SPONSOR_PLACEMENTS_CSS = `
  /* NIVEL 2: BANNER ESTÁTICO EXCLUSIVO 3D */
  .tt-sp-static-card {
    border-radius: 22px;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(44, 17, 74, 0.96) 0%, rgba(23, 6, 42, 0.99) 100%);
    border: 1.5px solid rgba(56, 189, 248, 0.48);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 5px 0 #0E021A,
      0 14px 26px rgba(0, 0, 0, 0.32);
    display: flex;
    flex-direction: column;
    color: #FAF9F5;
  }
  .tt-sp-static-card.is-light {
    background: linear-gradient(180deg, #FFFFFF 0%, #F5F2FB 100%);
    border-color: rgba(14, 138, 198, 0.46);
    color: #1E0734;
    box-shadow:
      inset 0 1px 0 #FFFFFF,
      0 5px 0 #C8DDF0,
      0 12px 24px rgba(30, 7, 52, 0.11);
  }
  .tt-sp-static-media {
    position: relative;
    height: 126px;
    background: #140324;
    overflow: hidden;
  }
  .tt-sp-static-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .tt-sp-exclusive-pill {
    position: absolute;
    top: 10px;
    left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9px;
    background: rgba(14, 3, 28, 0.84);
    border: 1px solid rgba(125, 211, 252, 0.62);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #BAE6FD;
    font-size: 0.61rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .tt-sp-exclusive-pill i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #38BDF8;
    box-shadow: 0 0 8px #38BDF8;
  }
  .tt-sp-price-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 10px;
    border-radius: 9px;
    background: linear-gradient(180deg, #FAE9B6 0%, #D4A33D 100%);
    color: #1A1002;
    font-size: 0.7rem;
    font-weight: 900;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 2px 0 #8A6012;
  }
  .tt-sp-static-body {
    padding: 13px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .tt-sp-static-text {
    flex: 1;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .tt-sp-brand-kicker {
    font-size: 0.62rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7DD3FC;
  }
  .tt-sp-static-card.is-light .tt-sp-brand-kicker {
    color: #0369A1;
  }
  .tt-sp-static-text h3 {
    margin: 0;
    font-family: var(--tt-font-display);
    font-size: 1.18rem;
    line-height: 1.08;
    color: inherit;
  }
  .tt-sp-static-text p {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.38;
    opacity: 0.82;
  }

  /* BOTÓN CTA 3D COMERCIAL */
  .tt-sp-3d-cta {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-size: 0.79rem;
    font-weight: 900;
    cursor: pointer;
    border: 1px solid transparent;
    transition: transform 110ms cubic-bezier(0.22, 1.35, 0.36, 1), box-shadow 110ms ease;
    white-space: nowrap;
  }
  .tt-sp-3d-cta:active {
    transform: translateY(3px) scale(0.985);
  }
  .tt-sp-3d-cta.is-emerald {
    background: linear-gradient(180deg, #22F397 0%, #00C96F 56%, #00A85B 100%);
    color: #0D0219;
    border-color: rgba(170, 255, 218, 0.8);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      0 4px 0 #007540,
      0 8px 18px rgba(0, 220, 125, 0.3);
  }
  .tt-sp-3d-cta.is-gold {
    background: linear-gradient(180deg, #FAE9B6 0%, #E5C16C 56%, #C89938 100%);
    color: #1A1002;
    border-color: rgba(255, 245, 214, 0.8);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.75),
      0 4px 0 #8A6012,
      0 10px 22px rgba(229, 193, 108, 0.36);
  }

  /* NIVEL 3: INTERSTICIAL PANTALLA COMPLETA (INVASIVO · VIP EXENTO) */
  .tt-sp-interstitial-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1600;
    background: rgba(7, 1, 16, 0.88);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(env(safe-area-inset-top, 0px) + 14px) 14px calc(env(safe-area-inset-bottom, 0px) + 14px);
    animation: ttSpFadeIn 220ms ease both;
  }
  @keyframes ttSpFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .tt-sp-interstitial-card {
    position: relative;
    width: 100%;
    max-width: 440px;
    max-height: 92dvh;
    overflow-y: auto;
    border-radius: 28px;
    background: linear-gradient(180deg, #270A46 0%, #130323 100%);
    border: 1.5px solid rgba(229, 193, 108, 0.68);
    box-shadow:
      inset 0 1px 0 rgba(255, 245, 214, 0.35),
      0 8px 0 #0B0116,
      0 28px 64px rgba(0, 0, 0, 0.72);
    color: #FAF9F5;
    display: flex;
    flex-direction: column;
    animation: ttSpPop 320ms cubic-bezier(0.22, 1.24, 0.36, 1) both;
  }
  @keyframes ttSpPop {
    from { opacity: 0; transform: translateY(18px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .tt-sp-inter-top {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .tt-sp-inter-badge {
    padding: 5px 11px;
    border-radius: 10px;
    background: rgba(13, 2, 25, 0.82);
    border: 1px solid rgba(229, 193, 108, 0.65);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #F6E2A8;
    font-size: 0.62rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .tt-sp-inter-close {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 11px;
    background: rgba(13, 2, 25, 0.84);
    border: 1.5px solid rgba(255, 255, 255, 0.28);
    color: rgba(250, 249, 245, 0.78);
    font-size: 0.72rem;
    font-weight: 900;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .tt-sp-inter-close.is-ready {
    background: linear-gradient(180deg, #FFFFFF 0%, #EAE4F6 100%);
    border-color: #FFFFFF;
    color: #160428;
    box-shadow: 0 3px 0 #B6A7D4;
    cursor: pointer;
  }
  .tt-sp-inter-media {
    position: relative;
    aspect-ratio: 4 / 3;
    width: 100%;
    background: #140324;
    overflow: hidden;
  }
  .tt-sp-inter-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .tt-sp-inter-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(16, 4, 30, 0.45) 0%,
      transparent 40%,
      rgba(19, 3, 35, 0.96) 100%
    );
  }
  .tt-sp-inter-price {
    position: absolute;
    bottom: 12px;
    left: 16px;
    z-index: 3;
    padding: 5px 12px;
    border-radius: 10px;
    background: linear-gradient(180deg, #FAE9B6 0%, #D4A33D 100%);
    color: #1A1002;
    font-family: var(--tt-font-display);
    font-size: 1.05rem;
    font-weight: 900;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 3px 0 #8A6012;
  }
  .tt-sp-inter-body {
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tt-sp-inter-brand {
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #22F397;
  }
  .tt-sp-inter-body h2 {
    margin: 0;
    font-family: var(--tt-font-display);
    font-size: 1.56rem;
    line-height: 1.04;
    color: #FAF9F5;
  }
  .tt-sp-inter-body p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.44;
    color: rgba(250, 249, 245, 0.84);
  }
  .tt-sp-inter-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }
  .tt-sp-inter-skip {
    min-height: 36px;
    font-size: 0.75rem;
    font-weight: 800;
    color: rgba(250, 249, 245, 0.72);
    text-decoration: underline;
    cursor: pointer;
  }
  .tt-sp-vip-upsell-bar {
    margin-top: 4px;
    padding: 9px 11px;
    border-radius: 13px;
    background: rgba(229, 193, 108, 0.14);
    border: 1px solid rgba(229, 193, 108, 0.45);
    color: #F6E2A8;
    font-size: 0.7rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
  }

  /* ADMIN SPONSORS MANAGER 3D */
  .tt-sp-tiers-summary,
  .tt-sp-level-selector {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }
  @media (max-width: 480px) {
    .tt-sp-tiers-summary,
    .tt-sp-level-selector {
      grid-template-columns: 1fr;
    }
  }
  .tt-sp-tier-pill,
  .tt-sp-level-opt {
    padding: 10px 8px;
    border-radius: 13px;
    background: linear-gradient(180deg, #321357 0%, #20093B 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 3px 0 #0F021C;
    color: #FAF9F5;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 2px;
    cursor: pointer;
    transition: transform 110ms ease;
  }
  .tt-sp-tier-pill:active,
  .tt-sp-level-opt:active {
    transform: translateY(2px);
  }
  .tt-sp-tier-pill span {
    font-size: 0.56rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    opacity: 0.8;
  }
  .tt-sp-tier-pill strong,
  .tt-sp-level-opt strong {
    font-size: 0.79rem;
    font-weight: 900;
  }
  .tt-sp-tier-pill small,
  .tt-sp-level-opt small {
    font-size: 0.63rem;
    opacity: 0.75;
  }
  .tt-sp-tier-pill.is-emerald,
  .tt-sp-level-opt.is-emerald.is-selected {
    border-color: rgba(0, 229, 130, 0.65);
    background: linear-gradient(180deg, rgba(0, 220, 125, 0.24) 0%, #1F0839 100%);
  }
  .tt-sp-tier-pill.is-sky,
  .tt-sp-level-opt.is-sky.is-selected {
    border-color: rgba(56, 189, 248, 0.65);
    background: linear-gradient(180deg, rgba(56, 189, 248, 0.24) 0%, #1F0839 100%);
  }
  .tt-sp-tier-pill.is-gold,
  .tt-sp-level-opt.is-gold.is-selected {
    border-color: rgba(229, 193, 108, 0.72);
    background: linear-gradient(180deg, rgba(229, 193, 108, 0.26) 0%, #1F0839 100%);
  }

  .tt-sp-photo-picker {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 14px;
    background: rgba(14, 3, 27, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.14);
  }
  .tt-sp-photo-thumb {
    width: 78px;
    height: 78px;
    border-radius: 12px;
    overflow: hidden;
    background: #1B0633;
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
`;

if (typeof document !== 'undefined') {
  let styleEl = document.getElementById('tt-sponsor-placements-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'tt-sponsor-placements-styles';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = SPONSOR_PLACEMENTS_CSS;
}
