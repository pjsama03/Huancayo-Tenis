import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSETS,
  EmptyStateCard,
  IconBadge,
  ModalPortal,
  SmartImage,
  TTIcon,
  triggerHaptic,
} from '../components/AppIcons';
import { APP_CONFIG, INITIAL_CLUBS } from '../data/playersAndClubsData';
import {
  buildWhatsappLink,
  deleteCloudProduct,
  fetchPlayerGemLedger,
  incrementProductClick,
  isCloudReady,
  uploadCompressedMedia,
  upsertCloudProduct,
} from '../utils/cloudService';

/* ==========================================================================
   CONFIGURACIÓN BASE (SIN EQUIVALENCIAS DE GEMAS EN SOLES)
   ========================================================================== */
export const PROSHOP_EDITABLE_CONFIG = {
  weeklyCapStandard: 25,
  weeklyCapVip: 65,
  vipMonthlyChest: 200,
  payment: {
    yapePlin: APP_CONFIG.paymentYapePlin || '964 812 340',
    holder: APP_CONFIG.paymentHolder || 'TOTAL TENIS · Pro Shop Oficial',
    bankName: APP_CONFIG.paymentBank || 'BCP Soles',
    bankAccount: APP_CONFIG.paymentBankAccount || '355-98412031-0-42',
  },
  stringingOptions: {
    strings: [
      { id: 'poly-control', name: 'Poliéster Control 1.25 mm (Topspin y durabilidad)', extraSoles: 0 },
      { id: 'multi-comfort', name: 'Multifilamento Confort 1.30 mm (Cuida brazo)', extraSoles: 10 },
      { id: 'hybrid-pro', name: 'Híbrido Pro (Poliéster + Multifilamento)', extraSoles: 15 },
      { id: 'own-string', name: 'Solo mano de obra (Llevo mi cuerda)', extraSoles: -25 },
    ],
    minLbs: 46,
    maxLbs: 58,
    defaultLbs: 52,
    altitudeTip: 'Altura de Huancayo (3,259 m): sugerimos 50 a 53 lbs para controlar el vuelo sin perder salida.',
  },
};

/* ==========================================================================
   METADATOS EXTENDIDOS SIN CAMBIAR SQL
   (VARIANTES, CÓDIGO PROMO, MARCA Y CASHBACK EN GEMAS PARA MARCAS ALIADAS)
   Se guardan de forma invisible dentro de `description` en Supabase y el
   jugador solo ve el texto limpio, los botones 3D y sus Gemas de recompensa.
   ========================================================================== */
const META_REGEX = /\n?<!--tt_meta:([\s\S]*?)-->$/;

function parseProductMeta(raw) {
  const rawDesc = String(raw?.description || '');
  const match = rawDesc.match(META_REGEX);
  let meta = {};
  let cleanDescription = rawDesc;

  if (match) {
    cleanDescription = rawDesc.replace(META_REGEX, '').trim();
    try {
      meta = JSON.parse(match[1]) || {};
    } catch {
      meta = {};
    }
  }

  const channel =
    raw?.channel === 'SPONSOR' || raw?.channel === 'COACH' || raw?.channel === 'OWN_STOCK'
      ? raw.channel
      : raw?.externalUrl
      ? 'SPONSOR'
      : raw?.coachId
      ? 'COACH'
      : 'OWN_STOCK';

  const priceSoles = Number(raw?.priceSoles ?? raw?.priceRegular ?? raw?.price) || 0;
  const oldPriceSoles = raw?.oldPriceSoles ? Number(raw.oldPriceSoles) : null;
  const vipPriceSoles =
    raw?.vipPriceSoles !== null && raw?.vipPriceSoles !== undefined
      ? Number(raw.vipPriceSoles)
      : raw?.priceVip !== undefined
      ? Number(raw.priceVip)
      : null;

  // Solo Almacén Propio permite canje directo con Gemas
  const gemsCost = channel === 'OWN_STOCK' ? Math.max(0, Number(raw?.gemsCost) || 0) : 0;

  // Solo Marcas Aliadas entregan Cashback en Gemas al validar compra con enlace/código
  const cashbackGems =
    channel === 'SPONSOR'
      ? Math.max(0, Number(meta.cashbackGems ?? raw?.cashbackGems) || 0)
      : 0;

  return {
    id: raw?.id || `prod-${Date.now()}`,
    channel,
    name: raw?.name || 'Artículo Oficial',
    subtitle: raw?.subtitle || meta.brand || '',
    brand: meta.brand || raw?.brand || raw?.subtitle || 'TOTAL TENIS',
    description: cleanDescription,
    imageUrl: raw?.imageUrl || raw?.image || '',
    fallbackImage: raw?.fallbackImage || ASSETS.logo,
    priceSoles,
    oldPriceSoles,
    vipPriceSoles,
    gemsCost,
    cashbackGems,
    externalUrl: raw?.externalUrl || '',
    promoCode: meta.promoCode || raw?.promoCode || '',
    variantLabel: meta.variantLabel || raw?.variantLabel || 'Opción disponible',
    variants: Array.isArray(meta.variants)
      ? meta.variants
      : Array.isArray(raw?.variants)
      ? raw.variants
      : [],
    isStringingService: Boolean(meta.isStringingService || raw?.isStringingService),
    coachId: raw?.coachId || '',
    coachWhatsapp: raw?.coachWhatsapp || '',
    badgeText: raw?.badgeText || raw?.shortTag || '',
    specs: Array.isArray(meta.specs)
      ? meta.specs
      : Array.isArray(raw?.specs)
      ? raw.specs
      : [],
    inStock: raw?.inStock !== false,
    clicksCount: Number(raw?.clicksCount) || 0,
    active: raw?.active !== false,
    sortOrder: Number(raw?.sortOrder) || 10,
  };
}

function serializeProductDescription(cleanDescription, meta) {
  const payload = {};
  if (meta.brand) payload.brand = meta.brand;
  if (meta.promoCode) payload.promoCode = meta.promoCode;
  if (Number(meta.cashbackGems) > 0) payload.cashbackGems = Math.round(Number(meta.cashbackGems));
  if (meta.variantLabel) payload.variantLabel = meta.variantLabel;
  if (Array.isArray(meta.variants) && meta.variants.length > 0) payload.variants = meta.variants;
  if (meta.isStringingService) payload.isStringingService = true;
  if (Array.isArray(meta.specs) && meta.specs.length > 0) payload.specs = meta.specs;

  const base = String(cleanDescription || '').replace(META_REGEX, '').trim();
  if (Object.keys(payload).length === 0) return base;
  return `${base}\n<!--tt_meta:${JSON.stringify(payload)}-->`.trim();
}

function appendUtmToExternalUrl(url = '', productId = '') {
  const trimmed = String(url || '').trim();
  if (!/^https?:\/\//i.test(trimmed)) return '';
  try {
    const parsed = new URL(trimmed);
    if (!parsed.searchParams.has('utm_source')) {
      parsed.searchParams.set('utm_source', 'totaltenis');
      parsed.searchParams.set('utm_medium', 'proshop');
      if (productId) parsed.searchParams.set('utm_content', productId);
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

/* ==========================================================================
   MOSTRADOR DEMO INICIAL (3 CARRILES HÍBRIDOS + CASHBACK EN MARCAS ALIADAS)
   ========================================================================== */
export const DEFAULT_HYBRID_CATALOG = [
  // CARRIL 1: MARCAS OFICIALES / TIENDAS ALIADAS (ENLACE + CÓDIGO + CASHBACK 💎)
  {
    id: 'sp-wilson-blade',
    channel: 'SPONSOR',
    name: 'Wilson Blade 98 v9 (16x19)',
    subtitle: 'Wilson · Tienda Oficial',
    brand: 'Wilson',
    description:
      'Control quirúrgico y sensación estable en cada impacto. Ideal para jugadores competitivos de 4ª a 2ª categoría en arcilla.',
    imageUrl: '/assets/proshop-raqueta.png',
    fallbackImage: ASSETS.torneoMasterTop8,
    priceSoles: 989,
    oldPriceSoles: 1099,
    vipPriceSoles: null,
    gemsCost: 0,
    cashbackGems: 35,
    externalUrl: 'https://www.wilson.com/en-us/product/blade-98-16x19-v9-frm-wr14980',
    promoCode: 'TOTALTENIS10',
    variantLabel: 'Grips disponibles en tienda',
    variants: ['L2 (4 1/4)', 'L3 (4 3/8)', 'L4 (4 1/2)'],
    badgeText: 'MARCA ALIADA',
    specs: [
      { label: 'Peso sin cuerda', value: '305 g · Aro 98 sq. in.' },
      { label: 'Patrón', value: '16 × 19 · Control y efecto' },
    ],
    inStock: true,
    sortOrder: 1,
  },
  {
    id: 'sp-babolat-aero',
    channel: 'SPONSOR',
    name: 'Babolat Pure Aero 98',
    subtitle: 'Babolat · Tienda Oficial',
    brand: 'Babolat',
    description:
      'Máxima generación de topspin y aceleración para dominar desde el fondo en polvo de ladrillo.',
    imageUrl: '/assets/proshop-raquetero.png',
    fallbackImage: ASSETS.torneoApertura,
    priceSoles: 1049,
    oldPriceSoles: null,
    vipPriceSoles: null,
    gemsCost: 0,
    cashbackGems: 40,
    externalUrl: 'https://www.babolat.com/us/pure-aero-98-unstrung/101499.html',
    promoCode: 'TOTALTENIS',
    variantLabel: 'Grips en tienda oficial',
    variants: ['L2 (4 1/4)', 'L3 (4 3/8)'],
    badgeText: 'DESTACADO PRO',
    specs: [
      { label: 'Peso sin cuerda', value: '305 g · Aro 98 sq. in.' },
      { label: 'Perfil', value: 'Spin explosivo en arcilla' },
    ],
    inStock: true,
    sortOrder: 2,
  },

  // CARRIL 2: EN STOCK · ALMACÉN TOTAL TENIS (ÚNICO LUGAR DE CANJE DE GEMAS)
  {
    id: 'own-encordado',
    channel: 'OWN_STOCK',
    isStringingService: true,
    name: 'Encordado Profesional en Altura',
    subtitle: 'Taller TOTAL TENIS',
    brand: 'Taller TOTAL TENIS',
    description:
      'Calibración electrónica de tensión constante con recojo y entrega en cualquiera de las 4 sedes oficiales en 24 horas.',
    imageUrl: '/assets/proshop-encordado.png',
    fallbackImage: ASSETS.torneoApertura,
    priceSoles: 55,
    oldPriceSoles: null,
    vipPriceSoles: 45,
    gemsCost: 900,
    cashbackGems: 0,
    variantLabel: 'Servicio en taller',
    variants: [],
    badgeText: 'TALLER OFICIAL',
    specs: [
      { label: 'Entrega', value: '24 horas en cualquiera de las 4 sedes' },
      { label: 'Calibración', value: 'Máquina electrónica tensión constante' },
    ],
    inStock: true,
    sortOrder: 3,
  },
  {
    id: 'own-pelotas',
    channel: 'OWN_STOCK',
    name: 'Tarro 3 Pelotas Presurizadas Pro',
    subtitle: 'Stock Almacén · Entrega Hoy',
    brand: 'Almacén TOTAL TENIS',
    description:
      'Tarro hermético presurizado con fieltro resistente a la arcilla. Entrega inmediata antes de tu partido oficial.',
    imageUrl: '/assets/proshop-pelotas.png',
    fallbackImage: '/assets/pelota-3d-volt-azul.png',
    priceSoles: 50,
    oldPriceSoles: null,
    vipPriceSoles: 42,
    gemsCost: 750,
    cashbackGems: 0,
    variantLabel: 'Edición disponible',
    variants: ['Arcilla Extra Duty', 'All Court Pro', 'Altura Oficial'],
    badgeText: 'EN STOCK',
    specs: [
      { label: 'Presentación', value: 'Tarro presurizado × 3 pelotas' },
      { label: 'Entrega', value: 'Inmediata en sede antes del partido' },
    ],
    inStock: true,
    sortOrder: 4,
  },
  {
    id: 'own-overgrip',
    channel: 'OWN_STOCK',
    name: 'Overgrip Profesional Adherente',
    subtitle: 'Stock Almacén · Colocación Gratis',
    brand: 'Almacén TOTAL TENIS',
    description:
      'Espesor de 0.55 mm de secado rápido y tacto firme para partidos intensos. Te lo colocamos gratis en tu sede.',
    imageUrl: '/assets/proshop-overgrip.png',
    fallbackImage: ASSETS.torneoAltura,
    priceSoles: 15,
    oldPriceSoles: null,
    vipPriceSoles: 12,
    gemsCost: 220,
    cashbackGems: 0,
    variantLabel: 'Color en stock',
    variants: ['Blanco Pro', 'Negro Mate', 'Verde Esmeralda'],
    badgeText: 'CANJE RÁPIDO',
    specs: [
      { label: 'Espesor', value: '0.55 mm · Control de sudor' },
      { label: 'Extra', value: 'Instalación sin costo en cancha' },
    ],
    inStock: true,
    sortOrder: 5,
  },
  {
    id: 'own-antivibrador',
    channel: 'OWN_STOCK',
    name: 'Pack Antivibrador + Muñequera',
    subtitle: 'Stock Almacén · Edición Circuito',
    brand: 'Almacén TOTAL TENIS',
    description:
      'Silicona de absorción directa entre cuerdas junto a muñequera técnica respirable de doble ancho.',
    imageUrl: '/assets/proshop-antivibrador.png',
    fallbackImage: ASSETS.logo,
    priceSoles: 25,
    oldPriceSoles: null,
    vipPriceSoles: 20,
    gemsCost: 360,
    cashbackGems: 0,
    variantLabel: 'Color disponible',
    variants: ['Púrpura Noche', 'Blanco Editorial', 'Negro'],
    badgeText: 'PACK 2 EN 1',
    specs: [
      { label: 'Confort', value: 'Reduce vibración en el brazo' },
      { label: 'Stock', value: 'Entrega en sede' },
    ],
    inStock: true,
    sortOrder: 6,
  },

  // CARRIL 3: VITRINA DE COACHES
  {
    id: 'coach-pack-romina',
    channel: 'COACH',
    name: 'Evaluación Técnica + Video Análisis',
    subtitle: 'Coach Romina Cutipa',
    brand: 'Academia Romina Cutipa',
    description:
      'Sesión diagnóstica de 60 minutos en cancha con grabación de saque, derecha y revés para acelerar tu ascenso.',
    imageUrl: '/assets/portada-tips-semana.jpg',
    fallbackImage: ASSETS.torneoAltura,
    priceSoles: 60,
    oldPriceSoles: null,
    vipPriceSoles: 50,
    gemsCost: 0,
    cashbackGems: 0,
    coachId: 'coach-romina',
    coachWhatsapp: '51964201001',
    variantLabel: 'Enfoque de sesión',
    variants: ['Saque y Resto', 'Derecha y Topspin', 'Táctica de Partido'],
    badgeText: 'COACH OFICIAL',
    specs: [
      { label: 'Duración', value: '60 minutos en arcilla' },
      { label: 'Incluye', value: 'Clips de corrección por WhatsApp' },
    ],
    inStock: true,
    sortOrder: 7,
  },
];

/* ==========================================================================
   MISIONES LIMPIAS DE GEMAS (VICTORIA HASTA 6-0, 6-0 + CASHBACK · CERO SOLES)
   ========================================================================== */
const GEM_MISSIONS = [
  {
    id: 'm-victory',
    icon: 'challenge',
    variant: 'emerald',
    title: 'Victoria oficial en cancha (hasta 6-0, 6-0)',
    standard: '+4 a +10 💎',
    vip: '+10 a +25 💎 (×2.5)',
    note: 'Escala según dominio: 3 sets (+4), 2 sets (+6), ≤4 games (+8), doble 6-0 (+10)',
  },
  {
    id: 'm-cashback',
    icon: 'shop',
    variant: 'gold',
    title: 'Cashback en Marcas Aliadas (Pro Shop)',
    standard: '+💎 por compra',
    vip: '+💎 por compra',
    note: 'Compra usando nuestro enlace/código oficial y reclama tus Gemas de recompensa',
  },
  {
    id: 'm-streak',
    icon: 'trophy',
    variant: 'gold',
    title: 'Racha de 3+ victorias seguidas',
    standard: '+5 💎',
    vip: '+13 💎 (×2.5)',
    note: 'Bono adicional en partidos oficiales confirmados',
  },
  {
    id: 'm-giant',
    icon: 'crown',
    variant: 'emerald',
    title: 'Victoria ante categoría superior',
    standard: '+10 💎',
    vip: '+25 💎 (×2.5)',
    note: 'Bono Mata Gigantes al mérito deportivo',
  },
  {
    id: 'm-weather',
    icon: 'sun',
    variant: 'purple',
    title: 'Reportar clima dentro de tu sede',
    standard: '+3 💎',
    vip: '+3 💎',
    note: 'Máximo 1 premio cada 24 h por jugador',
  },
  {
    id: 'm-tourney',
    icon: 'trophy',
    variant: 'gold',
    title: 'Podio en Torneos Oficiales',
    standard: '+120 a +300 💎',
    vip: '+120 a +300 💎',
    note: 'Acreditado al cierre oficial del cuadro',
  },
];

const CHANNEL_FILTERS = [
  { id: 'ALL', label: 'Todo' },
  { id: 'SPONSOR', label: 'Marcas · Cashback 💎' },
  { id: 'OWN_STOCK', label: 'En Stock · Canje' },
  { id: 'COACH', label: 'Coaches' },
];

const EMPTY_ADMIN_FORM = {
  id: '',
  channel: 'OWN_STOCK',
  name: '',
  brand: '',
  description: '',
  imageUrl: '',
  priceSoles: '',
  oldPriceSoles: '',
  vipPriceSoles: '',
  gemsCost: '',
  cashbackGems: '',
  externalUrl: '',
  promoCode: '',
  variantLabel: 'Opción / Talla',
  variantsCsv: '',
  coachWhatsapp: '',
  badgeText: '',
  inStock: true,
};

/* ==========================================================================
   COMPONENTE PRINCIPAL: ProShopAndGemsModal
   (3 CARRILES 3D TÁCTILES + CASHBACK EN GEMAS + GESTOR ADMIN + MODO CLARO)
   ========================================================================== */
export default function ProShopAndGemsModal({
  isOpen = false,
  initialMode = 'shop',
  onClose,
  currentUser = null,
  isAdmin = false,
  products = [],
  clubs = INITIAL_CLUBS,
  gemLedger = [],
  theme = 'dark',
  onProShopRedeem,
  onProductsUpdated,
  onOpenVipCard,
  onOpenAuth,
  onNotify,
}) {
  const adminPhotoRef = useRef(null);
  const cashbackReceiptRef = useRef(null);

  const canManageStore = Boolean(isAdmin || currentUser?.isAdmin);
  const [activeMode, setActiveMode] = useState(initialMode === 'vault' ? 'vault' : 'shop');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Catálogo local sincronizado con props/Supabase para reflejo instantáneo
  const [localProducts, setLocalProducts] = useState([]);
  const [cloudLedger, setCloudLedger] = useState([]);
  const [localSessionLedger, setLocalSessionLedger] = useState([]);

  // Sub-pantalla de Ficha de Producto
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [purchaseMethod, setPurchaseMethod] = useState('direct'); // 'direct' | 'full_gems'
  const [stringId, setStringId] = useState(PROSHOP_EDITABLE_CONFIG.stringingOptions.strings[0].id);
  const [tensionLbs, setTensionLbs] = useState(PROSHOP_EDITABLE_CONFIG.stringingOptions.defaultLbs);
  const [pickupClubId, setPickupClubId] = useState(clubs?.[0]?.id || 'club-country');
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Flujo Cashback en Gemas (Reclamo de compra en Marca Aliada)
  const [showCashbackClaim, setShowCashbackClaim] = useState(false);
  const [cashbackOrderRef, setCashbackOrderRef] = useState('');
  const [cashbackReceiptUrl, setCashbackReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [submittedCashbackIds, setSubmittedCashbackIds] = useState({});

  // Sub-pantalla Gestor Rápido de Tienda (Solo Admin)
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  useEffect(() => {
    const source =
      Array.isArray(products) && products.length > 0 ? products : DEFAULT_HYBRID_CATALOG;
    setLocalProducts(source.filter((p) => p.active !== false).map(parseProductMeta));
  }, [products]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveMode(initialMode === 'vault' ? 'vault' : 'shop');
    setSelectedProductId(null);
    setShowAdminManager(false);
    setShowCashbackClaim(false);
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen || activeMode !== 'vault' || !currentUser?.id || !isCloudReady) return;
    let active = true;
    fetchPlayerGemLedger(currentUser.id)
      .then((rows) => {
        if (active && Array.isArray(rows)) setCloudLedger(rows);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, activeMode, currentUser?.id]);

  const isVip = Boolean(currentUser?.isVip);
  const myGems = Number(currentUser?.gems) || 0;
  const weeklyCap = isVip
    ? PROSHOP_EDITABLE_CONFIG.weeklyCapVip
    : PROSHOP_EDITABLE_CONFIG.weeklyCapStandard;
  const weeklyEarned = Math.min(weeklyCap, Number(currentUser?.weeklyGemsEarned) || 0);
  const weeklyPct = Math.min(100, Math.round((weeklyEarned / weeklyCap) * 100));

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return localProducts.filter((item) => {
      if (channelFilter !== 'ALL' && item.channel !== channelFilter) return false;
      if (q) {
        const hay = `${item.name} ${item.brand} ${item.badgeText} ${item.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [localProducts, channelFilter, searchQuery]);

  const lanes = useMemo(() => {
    const own = filteredProducts.filter((p) => p.channel === 'OWN_STOCK');
    const sponsors = filteredProducts.filter((p) => p.channel === 'SPONSOR');
    const coaches = filteredProducts.filter((p) => p.channel === 'COACH');
    return { own, sponsors, coaches };
  }, [filteredProducts]);

  const selectedProduct = useMemo(
    () => localProducts.find((p) => p.id === selectedProductId) || null,
    [localProducts, selectedProductId]
  );

  const effectiveLedger = useMemo(() => {
    const source =
      cloudLedger.length > 0
        ? cloudLedger
        : Array.isArray(gemLedger) && gemLedger.length > 0
        ? gemLedger
        : [
            ...(isVip
              ? [
                  {
                    id: 'lg-vip',
                    type: 'credit',
                    amount: PROSHOP_EDITABLE_CONFIG.vipMonthlyChest,
                    title: 'Cofre Mensual Socio VIP',
                    date: 'Membresía activa',
                    detail: 'Disponible para canjes en Stock Propio',
                  },
                ]
              : []),
            {
              id: 'lg-reg',
              type: 'credit',
              amount: 20,
              title: 'Bono de Bienvenida TOTAL TENIS',
              date: 'Registro oficial',
              detail: 'Cuenta verificada en el circuito',
            },
          ];
    return [...localSessionLedger, ...source];
  }, [cloudLedger, gemLedger, localSessionLedger, isVip]);

  /* ------------------------------------------------------------------------
     ACCIONES DE COMPRA, LINK EXTERNO, CASHBACK EN GEMAS Y CANJE
     ------------------------------------------------------------------------ */
  const openProductDetail = (item) => {
    triggerHaptic('light');
    setSelectedProductId(item.id);
    setSelectedVariant(item.variants?.[0] || '');
    setPurchaseMethod('direct');
    setShowCashbackClaim(false);
    setCashbackOrderRef('');
    setCashbackReceiptUrl('');
    setStringId(PROSHOP_EDITABLE_CONFIG.stringingOptions.strings[0].id);
    setTensionLbs(PROSHOP_EDITABLE_CONFIG.stringingOptions.defaultLbs);
    setPickupClubId(
      currentUser?.clubId && currentUser.clubId !== 'independiente'
        ? currentUser.clubId
        : clubs?.[0]?.id || 'club-country'
    );
  };

  const handleCopyText = async (val, label, codeId = null) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(val);
      if (codeId) {
        setCopiedCodeId(codeId);
        window.setTimeout(() => setCopiedCodeId(null), 2000);
      }
      if (onNotify) onNotify(`${label} copiado.`, 'success');
    } catch {
      if (onNotify) onNotify(`${label}: ${val}`, 'info');
    }
  };

  const handleOpenSponsorLink = (item) => {
    triggerHaptic('medium');
    incrementProductClick(item.id);
    setLocalProducts((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, clicksCount: (p.clicksCount || 0) + 1 } : p))
    );
    const targetUrl = appendUtmToExternalUrl(item.externalUrl, item.id);
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else if (onNotify) {
      onNotify('Este artículo aún no tiene enlace externo configurado.', 'info');
    }
  };

  const handleUploadCashbackReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      const url = await uploadCompressedMedia(
        file,
        'cashback',
        `${currentUser?.id || 'guest'}-${selectedProduct?.id || 'item'}`
      );
      if (url) {
        setCashbackReceiptUrl(url);
        triggerHaptic('success');
        if (onNotify) onNotify('Comprobante adjuntado correctamente.', 'success');
      }
    } catch {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify('No se pudo subir la captura. Puedes enviarla directo al abrir WhatsApp.', 'info');
      }
    } finally {
      setIsUploadingReceipt(false);
      e.target.value = '';
    }
  };

  const handleSubmitCashbackClaim = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para reclamar tus Gemas de Cashback.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const cleanOrderRef = cashbackOrderRef.trim();
    if (cleanOrderRef.length < 3 && !cashbackReceiptUrl) {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify('Ingresa tu número de pedido/boleta o adjunta una captura de compra.', 'warning');
      }
      return;
    }

    const rewardGems = Number(selectedProduct.cashbackGems) || 0;
    const claimCode = `CB-${String(Date.now()).slice(-6)}`;

    const waLines = [
      'Hola Comité TOTAL TENIS, quiero reclamar mi Cashback en Gemas por compra en Marca Aliada:',
      `• Ticket de reclamo: ${claimCode}`,
      `• Jugador: ${currentUser.name} (${currentUser.credentialId || currentUser.id})`,
      `• Marca / Producto: ${selectedProduct.brand} — ${selectedProduct.name}`,
      selectedVariant ? `• Variante: ${selectedVariant}` : '',
      selectedProduct.promoCode ? `• Código utilizado: ${selectedProduct.promoCode}` : '',
      cleanOrderRef ? `• Nº Pedido / Boleta: ${cleanOrderRef}` : '',
      cashbackReceiptUrl ? `• Captura de comprobante: ${cashbackReceiptUrl}` : '• Adjunto captura de compra aquí en el chat.',
      rewardGems > 0
        ? `• Recompensa publicada: +${rewardGems.toLocaleString('es-PE')} Gemas`
        : '• Recompensa: Según compra verificada',
    ].filter(Boolean);

    window.open(
      buildWhatsappLink(APP_CONFIG.supportWhatsApp, waLines.join('\n')),
      '_blank',
      'noopener,noreferrer'
    );

    setSubmittedCashbackIds((prev) => ({ ...prev, [selectedProduct.id]: claimCode }));
    setShowCashbackClaim(false);
    setCashbackOrderRef('');
    setCashbackReceiptUrl('');

    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        `Solicitud ${claimCode} enviada. Al verificar la compra acreditaremos tus Gemas en tu Bóveda.`,
        'success'
      );
    }
  };

  const detailPricing = useMemo(() => {
    if (!selectedProduct) return null;
    const chosenString = selectedProduct.isStringingService
      ? PROSHOP_EDITABLE_CONFIG.stringingOptions.strings.find((s) => s.id === stringId) ||
        PROSHOP_EDITABLE_CONFIG.stringingOptions.strings[0]
      : null;
    const extraSoles = chosenString ? chosenString.extraSoles : 0;
    const regularPrice = Math.max(0, (Number(selectedProduct.priceSoles) || 0) + extraSoles);
    const vipPrice =
      selectedProduct.vipPriceSoles !== null
        ? Math.max(0, Number(selectedProduct.vipPriceSoles) + extraSoles)
        : regularPrice;
    const canRedeemGems =
      selectedProduct.channel === 'OWN_STOCK' &&
      selectedProduct.gemsCost > 0 &&
      myGems >= selectedProduct.gemsCost;

    return {
      chosenString,
      regularPrice,
      vipPrice,
      effectiveCash: isVip ? vipPrice : regularPrice,
      canRedeemGems,
    };
  }, [selectedProduct, stringId, isVip, myGems]);

  const handleConfirmOwnOrCoachOrder = () => {
    if (!selectedProduct || !detailPricing) return;

    if (selectedProduct.channel === 'SPONSOR') {
      handleOpenSponsorLink(selectedProduct);
      return;
    }

    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para reservar o canjear en el Pro Shop.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const usingGems = purchaseMethod === 'full_gems' && selectedProduct.channel === 'OWN_STOCK';
    let gemsToSpend = 0;
    let cashToPay = detailPricing.effectiveCash;

    if (usingGems) {
      if (myGems < selectedProduct.gemsCost) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            `Te faltan ${(selectedProduct.gemsCost - myGems).toLocaleString('es-PE')} 💎 para canjear este artículo.`,
            'warning'
          );
        }
        return;
      }
      gemsToSpend = selectedProduct.gemsCost;
      cashToPay = 0;

      const entry = {
        id: `lg-${Date.now()}`,
        type: 'debit',
        amount: gemsToSpend,
        title: `Canje en Pro Shop: ${selectedProduct.name}`,
        date: 'Ahora mismo',
        detail: selectedVariant || 'Almacén TOTAL TENIS',
      };
      setLocalSessionLedger((prev) => [entry, ...prev]);

      if (onProShopRedeem) {
        onProShopRedeem({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          gemsSpent: gemsToSpend,
          cashAmount: 0,
          method: 'full_gems',
          ledgerEntry: entry,
        });
      }
    }

    const pickupClub = clubs.find((c) => c.id === pickupClubId);
    const targetPhone =
      selectedProduct.channel === 'COACH' && selectedProduct.coachWhatsapp
        ? selectedProduct.coachWhatsapp
        : APP_CONFIG.supportWhatsApp;

    const waLines = [
      selectedProduct.channel === 'COACH'
        ? `Hola ${selectedProduct.brand || 'Coach'}, te escribo desde TOTAL TENIS:`
        : 'Hola Pro Shop TOTAL TENIS, quiero confirmar mi pedido:',
      `• Artículo: ${selectedProduct.name}`,
      selectedVariant ? `• ${selectedProduct.variantLabel || 'Opción'}: ${selectedVariant}` : '',
      detailPricing.chosenString ? `• Cuerda: ${detailPricing.chosenString.name}` : '',
      selectedProduct.isStringingService ? `• Tensión: ${tensionLbs} lbs` : '',
      usingGems
        ? `• Modalidad: Canje con ${gemsToSpend.toLocaleString('es-PE')} Gemas`
        : `• Precio: S/ ${cashToPay} (${isVip ? 'Tarifa Socio VIP' : 'Regular'})`,
      selectedProduct.channel === 'OWN_STOCK'
        ? `• Entrega en sede: ${pickupClub ? pickupClub.name : 'Por coordinar'}`
        : '',
      `• Jugador: ${currentUser.name}`,
    ].filter(Boolean);

    window.open(
      buildWhatsappLink(targetPhone, waLines.join('\n')),
      '_blank',
      'noopener,noreferrer'
    );

    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        usingGems
          ? 'Canje registrado. Coordina la entrega inmediata por WhatsApp.'
          : 'Pedido enviado por WhatsApp para coordinar entrega.',
        'success'
      );
    }
    setSelectedProductId(null);
  };

  /* ------------------------------------------------------------------------
     GESTOR ADMIN INTEGRADO (SUBIR STOCK/SPONSORS + CASHBACK SIN TOCAR CÓDIGO)
     ------------------------------------------------------------------------ */
  const openAdminForNew = () => {
    triggerHaptic('light');
    setAdminForm(EMPTY_ADMIN_FORM);
    setShowAdminManager(true);
  };

  const openAdminForEdit = (item) => {
    triggerHaptic('light');
    setAdminForm({
      id: item.id,
      channel: item.channel,
      name: item.name,
      brand: item.brand || item.subtitle || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      priceSoles: item.priceSoles || '',
      oldPriceSoles: item.oldPriceSoles || '',
      vipPriceSoles: item.vipPriceSoles ?? '',
      gemsCost: item.gemsCost || '',
      cashbackGems: item.cashbackGems || '',
      externalUrl: item.externalUrl || '',
      promoCode: item.promoCode || '',
      variantLabel: item.variantLabel || 'Opción / Talla',
      variantsCsv: (item.variants || []).join(', '),
      coachWhatsapp: item.coachWhatsapp || '',
      badgeText: item.badgeText || '',
      inStock: item.inStock !== false,
    });
    setShowAdminManager(true);
  };

  const handleUploadProductPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImg(true);
    try {
      const url = await uploadCompressedMedia(file, 'proshop', adminForm.id || 'prod');
      if (url) {
        setAdminForm((prev) => ({ ...prev, imageUrl: url }));
        triggerHaptic('success');
        if (onNotify) onNotify('Foto optimizada y cargada en la nube.', 'success');
      }
    } catch {
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos subir la foto. Intenta nuevamente.', 'warning');
    } finally {
      setIsUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleSaveAdminProduct = async (e) => {
    e.preventDefault();
    if (!adminForm.name.trim() || isSavingProduct) return;

    setIsSavingProduct(true);
    try {
      const variants = String(adminForm.variantsCsv || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      const serializedDesc = serializeProductDescription(adminForm.description, {
        brand: adminForm.brand.trim() || 'TOTAL TENIS',
        promoCode: adminForm.channel === 'SPONSOR' ? adminForm.promoCode.trim().toUpperCase() : '',
        cashbackGems:
          adminForm.channel === 'SPONSOR' ? Math.max(0, Number(adminForm.cashbackGems) || 0) : 0,
        variantLabel: adminForm.variantLabel.trim() || 'Opción disponible',
        variants,
      });

      const payload = {
        id: adminForm.id || `prod-${Date.now()}`,
        channel: adminForm.channel,
        name: adminForm.name.trim(),
        subtitle: adminForm.brand.trim() || 'TOTAL TENIS',
        description: serializedDesc,
        imageUrl: adminForm.imageUrl.trim(),
        priceSoles: Number(adminForm.priceSoles) || 0,
        oldPriceSoles: adminForm.oldPriceSoles ? Number(adminForm.oldPriceSoles) : null,
        vipPriceSoles:
          adminForm.channel !== 'SPONSOR' && adminForm.vipPriceSoles !== ''
            ? Number(adminForm.vipPriceSoles)
            : null,
        gemsCost: adminForm.channel === 'OWN_STOCK' ? Number(adminForm.gemsCost) || 0 : 0,
        cashbackGems:
          adminForm.channel === 'SPONSOR' ? Math.max(0, Number(adminForm.cashbackGems) || 0) : 0,
        externalUrl: adminForm.channel === 'SPONSOR' ? adminForm.externalUrl.trim() : '',
        coachWhatsapp: adminForm.channel === 'COACH' ? adminForm.coachWhatsapp.trim() : '',
        badgeText: adminForm.badgeText.trim().toUpperCase(),
        inStock: adminForm.inStock,
        active: true,
        sortOrder: 5,
      };

      let saved = payload;
      if (isCloudReady) {
        const res = await upsertCloudProduct(payload);
        if (res) saved = res;
      }

      const parsedSaved = parseProductMeta(saved);
      setLocalProducts((prev) => {
        const exists = prev.some((p) => p.id === parsedSaved.id);
        const next = exists
          ? prev.map((p) => (p.id === parsedSaved.id ? parsedSaved : p))
          : [parsedSaved, ...prev];
        if (onProductsUpdated) onProductsUpdated(next);
        return next;
      });

      triggerHaptic('success');
      if (onNotify) onNotify('Producto publicado en tiempo real en tu Pro Shop.', 'success');
      setAdminForm(EMPTY_ADMIN_FORM);
    } catch (err) {
      console.error('[ProShop Admin] Error:', err);
      triggerHaptic('warning');
      if (onNotify) onNotify('No pudimos guardar en Supabase. Revisa tu conexión.', 'warning');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteAdminProduct = async (productId) => {
    triggerHaptic('warning');
    try {
      if (isCloudReady) await deleteCloudProduct(productId);
    } catch {
      // continuar limpieza local
    }
    setLocalProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      if (onProductsUpdated) onProductsUpdated(next);
      return next;
    });
    if (onNotify) onNotify('Producto retirado del catálogo.', 'info');
  };

/* ------------------------------------------------------------------------
     RENDER DE TARJETA DE PRODUCTO 3D TÁCTIL (3 CARRILES + BADGE CASHBACK 💎)
     ------------------------------------------------------------------------ */
  const renderProductCard = (item) => {
    const isSponsor = item.channel === 'SPONSOR';
    const isOwn = item.channel === 'OWN_STOCK';
    const isCoach = item.channel === 'COACH';
    const hasVipPrice = !isSponsor && item.vipPriceSoles !== null && item.vipPriceSoles < item.priceSoles;

    return (
      <article
        key={item.id}
        className={`tt-ps-card ${isSponsor ? 'is-sponsor' : isOwn ? 'is-own' : 'is-coach'}`}
        onClick={() => openProductDetail(item)}
      >
        <div className="tt-ps-card-media">
          <SmartImage
            src={item.imageUrl}
            fallbackSrc={item.fallbackImage || ASSETS.logo}
            alt={item.name}
            className="tt-ps-card-img"
          />

          {item.badgeText && (
            <span className={`tt-ps-card-badge ${isSponsor ? 'is-gold' : isOwn ? 'is-emerald' : 'is-sky'}`}>
              {item.badgeText}
            </span>
          )}

          {isSponsor && item.cashbackGems > 0 && (
            <span className="tt-ps-cashback-pill">
              +{item.cashbackGems} 💎 Cashback
            </span>
          )}

          {canManageStore && (
            <button
              type="button"
              className="tt-ps-admin-edit-fab"
              aria-label={`Editar ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                openAdminForEdit(item);
              }}
            >
              ✎
            </button>
          )}
        </div>

        <div className="tt-ps-card-body">
          <span className="tt-ps-card-brand">{item.brand}</span>
          <h4 className="tt-ps-card-title">{item.name}</h4>

          <div className="tt-ps-price-stack">
            <div className="tt-ps-price-line">
              {item.priceSoles > 0 ? (
                <>
                  <strong>S/ {isVip && hasVipPrice ? item.vipPriceSoles : item.priceSoles}</strong>
                  {item.oldPriceSoles && item.oldPriceSoles > item.priceSoles && (
                    <span className="tt-ps-old-price">S/ {item.oldPriceSoles}</span>
                  )}
                  {hasVipPrice && !isVip && (
                    <span className="tt-ps-vip-tag">VIP S/ {item.vipPriceSoles}</span>
                  )}
                </>
              ) : (
                <strong>A consultar</strong>
              )}
            </div>

            {isOwn && item.gemsCost > 0 && (
              <div className="tt-ps-gems-cost-line">
                <span>O canje directo:</span>
                <strong>{item.gemsCost.toLocaleString('es-PE')} 💎</strong>
              </div>
            )}

            {isSponsor && item.promoCode && (
              <button
                type="button"
                className="tt-ps-code-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyText(item.promoCode, 'Código', item.id);
                }}
              >
                <span>Código: <b>{item.promoCode}</b></span>
                <small>{copiedCodeId === item.id ? 'Copiado ✓' : 'Copiar'}</small>
              </button>
            )}
          </div>

          <button
            type="button"
            className={`tt-ps-3d-btn ${isSponsor ? 'is-gold' : isCoach ? 'is-sky' : 'is-emerald'}`}
            onClick={(e) => {
              e.stopPropagation();
              openProductDetail(item);
            }}
          >
            {isSponsor
              ? item.cashbackGems > 0
                ? `Comprar y ganar +${item.cashbackGems} 💎`
                : 'Ver en tienda oficial'
              : isOwn
              ? item.gemsCost > 0
                ? 'Ver · Canjear / Comprar'
                : 'Ver en stock'
              : 'Reservar sesión'}
          </button>
        </div>
      </article>
    );
  };

  /* ------------------------------------------------------------------------
     MODAL PRINCIPAL
     ------------------------------------------------------------------------ */
  const modalTitle = showAdminManager
    ? 'Gestor de Pro Shop (Admin)'
    : selectedProduct
    ? selectedProduct.name
    : activeMode === 'vault'
    ? 'Tu Bóveda de Gemas'
    : 'Pro Shop TOTAL TENIS';

  const modalSubtitle = showAdminManager
    ? 'Stock propio, Marcas Aliadas con Cashback y Vitrina de Coaches'
    : selectedProduct
    ? selectedProduct.brand
    : activeMode === 'vault'
    ? 'Gana Gemas compitiendo o comprando en marcas aliadas'
    : 'Equipamiento oficial, taller de encordado y beneficios';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={<IconBadge name={activeMode === 'vault' ? 'gem' : 'shop'} variant="emerald" size={38} />}
      isWide
    >
      <div className={`tt-ps-root ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* ==================================================================
            BARRA SUPERIOR 3D: CAMBIO PRO SHOP / BÓVEDA + SALDO + ADMIN
            ================================================================== */}
        {!selectedProduct && !showAdminManager && (
          <div className="tt-ps-top-bar">
            <div className="tt-ps-mode-switch" role="tablist" aria-label="Modo Tienda o Bóveda">
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'shop'}
                className={`tt-ps-3d-tab ${activeMode === 'shop' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveMode('shop');
                }}
              >
                <TTIcon name="shop" size={16} />
                <span>Pro Shop</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'vault'}
                className={`tt-ps-3d-tab ${activeMode === 'vault' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveMode('vault');
                }}
              >
                <TTIcon name="gem" size={16} />
                <span>Bóveda</span>
                <span className="tt-ps-gem-counter">{myGems.toLocaleString('es-PE')} 💎</span>
              </button>
            </div>

            {canManageStore && (
              <button
                type="button"
                className="tt-ps-3d-btn is-dark-pill"
                onClick={openAdminForNew}
              >
                + Gestionar Catálogo
              </button>
            )}
          </div>
        )}

        {/* ==================================================================
            SUB-VISTA A: GESTOR ADMIN (CON CAMPO CASHBACK EN GEMAS)
            ================================================================== */}
        {showAdminManager && (
          <div className="tt-ps-admin-wrap">
            <button
              type="button"
              className="tt-ps-back-3d"
              onClick={() => {
                triggerHaptic('light');
                setShowAdminManager(false);
                setAdminForm(EMPTY_ADMIN_FORM);
              }}
            >
              ← Volver al Pro Shop
            </button>

            <form onSubmit={handleSaveAdminProduct} className="tt-ps-admin-form">
              <div className="tt-ps-admin-section-title">
                <strong>{adminForm.id ? 'Editar artículo publicado' : 'Publicar nuevo artículo'}</strong>
                <span>Se guarda en tiempo real en Supabase</span>
              </div>

              <div className="tt-ps-field">
                <label>Carril / Tipo de publicación</label>
                <div className="tt-ps-channel-pills">
                  {[
                    { id: 'OWN_STOCK', label: 'Stock Propio (Canje 💎)' },
                    { id: 'SPONSOR', label: 'Marca Aliada (Cashback 💎)' },
                    { id: 'COACH', label: 'Vitrina Coach' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      className={`tt-ps-3d-chip ${adminForm.channel === ch.id ? 'is-active' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setAdminForm((prev) => ({ ...prev, channel: ch.id }));
                      }}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tt-ps-admin-grid-2">
                <div className="tt-ps-field">
                  <label>Nombre del artículo *</label>
                  <input
                    type="text"
                    className="tt-input"
                    required
                    value={adminForm.name}
                    onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Wilson Blade 98 v9"
                  />
                </div>
                <div className="tt-ps-field">
                  <label>Marca / Autor</label>
                  <input
                    type="text"
                    className="tt-input"
                    value={adminForm.brand}
                    onChange={(e) => setAdminForm((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="Ej. Wilson · Tienda Oficial"
                  />
                </div>
              </div>

              <div className="tt-ps-field">
                <label>Descripción clara para el jugador</label>
                <textarea
                  rows={2}
                  className="tt-input"
                  value={adminForm.description}
                  onChange={(e) => setAdminForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Detalles clave de uso, entrega o garantía..."
                />
              </div>

              <div className="tt-ps-admin-grid-2">
                <div className="tt-ps-field">
                  <label>Foto del producto</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      ref={adminPhotoRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleUploadProductPhoto}
                    />
                    <button
                      type="button"
                      className="tt-ps-3d-btn is-dark-pill"
                      style={{ flex: 1 }}
                      disabled={isUploadingImg}
                      onClick={() => adminPhotoRef.current?.click()}
                    >
                      {isUploadingImg ? 'Subiendo...' : 'Subir foto'}
                    </button>
                  </div>
                </div>

                <div className="tt-ps-field">
                  <label>O pega URL de imagen</label>
                  <input
                    type="text"
                    className="tt-input"
                    value={adminForm.imageUrl}
                    onChange={(e) => setAdminForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="tt-ps-admin-grid-3">
                <div className="tt-ps-field">
                  <label>Precio Regular (S/)</label>
                  <input
                    type="number"
                    min={0}
                    className="tt-input"
                    value={adminForm.priceSoles}
                    onChange={(e) => setAdminForm((p) => ({ ...p, priceSoles: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="tt-ps-field">
                  <label>Precio Antes (S/)</label>
                  <input
                    type="number"
                    min={0}
                    className="tt-input"
                    value={adminForm.oldPriceSoles}
                    onChange={(e) => setAdminForm((p) => ({ ...p, oldPriceSoles: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
                {adminForm.channel !== 'SPONSOR' ? (
                  <div className="tt-ps-field">
                    <label>Precio Socio VIP (S/)</label>
                    <input
                      type="number"
                      min={0}
                      className="tt-input"
                      value={adminForm.vipPriceSoles}
                      onChange={(e) =>
                        setAdminForm((p) => ({ ...p, vipPriceSoles: e.target.value }))
                      }
                      placeholder="Opcional"
                    />
                  </div>
                ) : (
                  <div className="tt-ps-field">
                    <label>Cashback en Gemas (💎)</label>
                    <input
                      type="number"
                      min={0}
                      className="tt-input"
                      value={adminForm.cashbackGems}
                      onChange={(e) =>
                        setAdminForm((p) => ({ ...p, cashbackGems: e.target.value }))
                      }
                      placeholder="Ej. 35"
                    />
                  </div>
                )}
              </div>

              {adminForm.channel === 'OWN_STOCK' && (
                <div className="tt-ps-field">
                  <label>Costo de canje directo en Gemas (💎)</label>
                  <input
                    type="number"
                    min={0}
                    className="tt-input"
                    value={adminForm.gemsCost}
                    onChange={(e) => setAdminForm((p) => ({ ...p, gemsCost: e.target.value }))}
                    placeholder="Ej. 220 (0 si no se canjea con Gemas)"
                  />
                </div>
              )}

              {adminForm.channel === 'SPONSOR' && (
                <div className="tt-ps-admin-sponsor-box">
                  <div className="tt-ps-admin-grid-2">
                    <div className="tt-ps-field">
                      <label>Enlace oficial de afiliado / marca *</label>
                      <input
                        type="url"
                        className="tt-input"
                        value={adminForm.externalUrl}
                        onChange={(e) =>
                          setAdminForm((p) => ({ ...p, externalUrl: e.target.value }))
                        }
                        placeholder="https://www.wilson.com/..."
                      />
                    </div>
                    <div className="tt-ps-field">
                      <label>Código de descuento / afiliado</label>
                      <input
                        type="text"
                        className="tt-input"
                        value={adminForm.promoCode}
                        onChange={(e) =>
                          setAdminForm((p) => ({ ...p, promoCode: e.target.value.toUpperCase() }))
                        }
                        placeholder="Ej. TOTALTENIS10"
                      />
                    </div>
                  </div>
                  <small className="tt-ps-admin-note">
                    Calcula internamente cuántas Gemas otorgar según tu comisión de afiliado. Al jugador solo se le muestra la recompensa en 💎 (nunca equivalencia en soles).
                  </small>
                </div>
              )}

              {adminForm.channel === 'COACH' && (
                <div className="tt-ps-field">
                  <label>WhatsApp del Coach (con 51)</label>
                  <input
                    type="tel"
                    className="tt-input"
                    value={adminForm.coachWhatsapp}
                    onChange={(e) =>
                      setAdminForm((p) => ({ ...p, coachWhatsapp: e.target.value }))
                    }
                    placeholder="51964201001"
                  />
                </div>
              )}

              <div className="tt-ps-admin-grid-3">
                <div className="tt-ps-field">
                  <label>Etiqueta (Badge)</label>
                  <input
                    type="text"
                    className="tt-input"
                    value={adminForm.badgeText}
                    onChange={(e) => setAdminForm((p) => ({ ...p, badgeText: e.target.value }))}
                    placeholder="MARCA ALIADA / EN STOCK"
                  />
                </div>
                <div className="tt-ps-field">
                  <label>Título de opciones</label>
                  <input
                    type="text"
                    className="tt-input"
                    value={adminForm.variantLabel}
                    onChange={(e) => setAdminForm((p) => ({ ...p, variantLabel: e.target.value }))}
                    placeholder="Grip / Color / Talla"
                  />
                </div>
                <div className="tt-ps-field">
                  <label>Opciones (separadas por coma)</label>
                  <input
                    type="text"
                    className="tt-input"
                    value={adminForm.variantsCsv}
                    onChange={(e) => setAdminForm((p) => ({ ...p, variantsCsv: e.target.value }))}
                    placeholder="L2, L3, L4"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {adminForm.id && (
                  <button
                    type="button"
                    className="tt-ps-3d-btn is-dark-pill"
                    onClick={() => setAdminForm(EMPTY_ADMIN_FORM)}
                  >
                    Cancelar edición
                  </button>
                )}
                <button
                  type="submit"
                  className="tt-ps-3d-btn is-emerald"
                  style={{ flex: 1 }}
                  disabled={isSavingProduct}
                >
                  {isSavingProduct
                    ? 'Guardando en Supabase...'
                    : adminForm.id
                    ? 'Guardar cambios'
                    : 'Publicar en Pro Shop'}
                </button>
              </div>
            </form>

            <div className="tt-ps-admin-list">
              <h5>Artículos activos ({localProducts.length})</h5>
              {localProducts.map((p) => (
                <div key={p.id} className="tt-ps-admin-item">
                  <SmartImage
                    src={p.imageUrl}
                    fallbackSrc={ASSETS.logo}
                    alt={p.name}
                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{p.name}</strong>
                    <small>
                      {p.channel === 'SPONSOR'
                        ? `Marca Aliada · +${p.cashbackGems || 0} 💎 Cashback · ${p.clicksCount} clics`
                        : p.channel === 'OWN_STOCK'
                        ? `Stock Propio · S/ ${p.priceSoles}${p.gemsCost > 0 ? ` · ${p.gemsCost} 💎` : ''}`
                        : `Coach · S/ ${p.priceSoles}`}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="tt-ps-3d-chip"
                    onClick={() => openAdminForEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="tt-ps-3d-chip is-danger"
                    onClick={() => handleDeleteAdminProduct(p.id)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            SUB-VISTA B: FICHA DETALLADA + RECLAMO CASHBACK EN GEMAS
            ================================================================== */}
        {selectedProduct && !showAdminManager && detailPricing && (
          <div className="tt-ps-detail-wrap">
            <button
              type="button"
              className="tt-ps-back-3d"
              onClick={() => {
                triggerHaptic('light');
                setSelectedProductId(null);
              }}
            >
              ← Volver al catálogo
            </button>

            <div className="tt-ps-detail-hero">
              <SmartImage
                src={selectedProduct.imageUrl}
                fallbackSrc={selectedProduct.fallbackImage || ASSETS.logo}
                alt={selectedProduct.name}
                className="tt-ps-detail-img"
              />
              {selectedProduct.channel === 'SPONSOR' && selectedProduct.cashbackGems > 0 && (
                <div className="tt-ps-detail-cashback-float">
                  Recompensa por compra: <strong>+{selectedProduct.cashbackGems} 💎</strong>
                </div>
              )}
            </div>

            <div className="tt-ps-detail-info">
              <div className="tt-ps-detail-head">
                <div>
                  <span className="tt-ps-card-brand">{selectedProduct.brand}</span>
                  <h3>{selectedProduct.name}</h3>
                </div>
                <div className="tt-ps-detail-price-col">
                  {detailPricing.regularPrice > 0 && (
                    <strong>S/ {detailPricing.effectiveCash}</strong>
                  )}
                  {selectedProduct.oldPriceSoles && (
                    <span className="tt-ps-old-price">S/ {selectedProduct.oldPriceSoles}</span>
                  )}
                </div>
              </div>

              {selectedProduct.description && (
                <p className="tt-ps-detail-desc">{selectedProduct.description}</p>
              )}

              {selectedProduct.specs?.length > 0 && (
                <div className="tt-ps-specs-grid">
                  {selectedProduct.specs.map((sp, i) => (
                    <div key={`${sp.label}-${i}`} className="tt-ps-spec-box">
                      <span>{sp.label}</span>
                      <strong>{sp.value}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Selector de variante (grip / color / enfoque) */}
              {selectedProduct.variants?.length > 0 && (
                <div className="tt-ps-field">
                  <label>{selectedProduct.variantLabel || 'Opción disponible'}</label>
                  <div className="tt-ps-variants-row">
                    {selectedProduct.variants.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`tt-ps-3d-chip ${selectedVariant === v ? 'is-active' : ''}`}
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedVariant(v);
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* === FLUJO 1: MARCA ALIADA + CASHBACK EN GEMAS === */}
              {selectedProduct.channel === 'SPONSOR' && (
                <div className="tt-ps-sponsor-panel">
                  <div className="tt-ps-cashback-box">
                    <div className="tt-ps-cashback-box-head">
                      <IconBadge name="gem" variant="gold" size={34} />
                      <div>
                        <strong>
                          {selectedProduct.cashbackGems > 0
                            ? `Gana +${selectedProduct.cashbackGems} 💎 al comprar aquí`
                            : 'Beneficio exclusivo comunidad TOTAL TENIS'}
                        </strong>
                        <p>
                          Entra con nuestro enlace oficial{selectedProduct.promoCode ? ` y aplica el código ${selectedProduct.promoCode}` : ''}. Al terminar tu compra, presiona «Ya compré» y acreditamos tus Gemas en tu Bóveda.
                        </p>
                      </div>
                    </div>

                    {selectedProduct.promoCode && (
                      <div className="tt-ps-code-banner">
                        <div>
                          <span>CÓDIGO DE AFILIADO</span>
                          <strong>{selectedProduct.promoCode}</strong>
                        </div>
                        <button
                          type="button"
                          className="tt-ps-3d-btn is-gold"
                          style={{ minHeight: 38, padding: '0 14px' }}
                          onClick={() =>
                            handleCopyText(selectedProduct.promoCode, 'Código', selectedProduct.id)
                          }
                        >
                          {copiedCodeId === selectedProduct.id ? 'Copiado ✓' : 'Copiar código'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="tt-ps-sponsor-actions">
                    <button
                      type="button"
                      className="tt-ps-3d-btn is-emerald"
                      onClick={() => handleOpenSponsorLink(selectedProduct)}
                    >
                      Ir a la tienda oficial de {selectedProduct.brand} ↗
                    </button>

                    <button
                      type="button"
                      className="tt-ps-3d-btn is-gold"
                      onClick={() => {
                        triggerHaptic('medium');
                        setShowCashbackClaim((v) => !v);
                      }}
                    >
                      {showCashbackClaim
                        ? 'Ocultar formulario de reclamo'
                        : selectedProduct.cashbackGems > 0
                        ? `Ya compré · Reclamar mis +${selectedProduct.cashbackGems} 💎`
                        : 'Ya compré · Registrar mi compra'}
                    </button>
                  </div>

                  {submittedCashbackIds[selectedProduct.id] && (
                    <div className="tt-ps-claim-done-banner">
                      <TTIcon name="check" size={16} />
                      <span>
                        Ticket <b>{submittedCashbackIds[selectedProduct.id]}</b> enviado al Comité. Apenas confirmemos la boleta verás tus Gemas acreditadas en tu Bóveda.
                      </span>
                    </div>
                  )}

                  {showCashbackClaim && (
                    <form onSubmit={handleSubmitCashbackClaim} className="tt-ps-claim-form">
                      <div className="tt-ps-claim-head">
                        <strong>Valida tu compra y recibe tus Gemas</strong>
                        <small>Paso rápido · El Comité verifica tu pedido en minutos</small>
                      </div>

                      <div className="tt-ps-field">
                        <label htmlFor="tt-cb-order">Nº de pedido, boleta o correo de compra</label>
                        <input
                          id="tt-cb-order"
                          type="text"
                          className="tt-input"
                          value={cashbackOrderRef}
                          onChange={(e) => setCashbackOrderRef(e.target.value)}
                          placeholder="Ej. Pedido #W-89412 o boleta F001-234"
                        />
                      </div>

                      <div className="tt-ps-field">
                        <label>Captura de boleta o confirmación (opcional aquí)</label>
                        <input
                          ref={cashbackReceiptRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleUploadCashbackReceipt}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            type="button"
                            className="tt-ps-3d-btn is-dark-pill"
                            style={{ flex: 1 }}
                            disabled={isUploadingReceipt}
                            onClick={() => cashbackReceiptRef.current?.click()}
                          >
                            {isUploadingReceipt
                              ? 'Subiendo captura...'
                              : cashbackReceiptUrl
                              ? 'Captura lista ✓ (cambiar)'
                              : 'Adjuntar foto de boleta'}
                          </button>
                          {cashbackReceiptUrl && (
                            <SmartImage
                              src={cashbackReceiptUrl}
                              alt="Comprobante"
                              style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                            />
                          )}
                        </div>
                      </div>

                      <button type="submit" className="tt-ps-3d-btn is-emerald">
                        Enviar comprobante y reclamar{' '}
                        {selectedProduct.cashbackGems > 0
                          ? `+${selectedProduct.cashbackGems} 💎`
                          : 'recompensa'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* === FLUJO 2: STOCK PROPIO (CANJE CON GEMAS O PAGO) Y COACHES === */}
              {selectedProduct.channel !== 'SPONSOR' && (
                <div className="tt-ps-order-panel">
                  {selectedProduct.isStringingService && (
                    <div className="tt-ps-string-box">
                      <div className="tt-ps-field">
                        <label>Tipo de cuerda</label>
                        <div className="tt-ps-string-list">
                          {PROSHOP_EDITABLE_CONFIG.stringingOptions.strings.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              className={`tt-ps-3d-chip ${stringId === st.id ? 'is-active' : ''}`}
                              style={{ textAlign: 'left', justifyContent: 'space-between' }}
                              onClick={() => {
                                triggerHaptic('light');
                                setStringId(st.id);
                              }}
                            >
                              <span>{st.name}</span>
                              {st.extraSoles !== 0 && (
                                <b>{st.extraSoles > 0 ? `+S/ ${st.extraSoles}` : `S/ ${st.extraSoles}`}</b>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="tt-ps-field">
                        <label>Tensión recomendada: <b>{tensionLbs} lbs</b></label>
                        <input
                          type="range"
                          min={PROSHOP_EDITABLE_CONFIG.stringingOptions.minLbs}
                          max={PROSHOP_EDITABLE_CONFIG.stringingOptions.maxLbs}
                          value={tensionLbs}
                          onChange={(e) => setTensionLbs(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#00DC7D' }}
                        />
                        <small className="tt-ps-altitude-tip">
                          {PROSHOP_EDITABLE_CONFIG.stringingOptions.altitudeTip}
                        </small>
                      </div>
                    </div>
                  )}

                  {selectedProduct.channel === 'OWN_STOCK' && selectedProduct.gemsCost > 0 && (
                    <div className="tt-ps-field">
                      <label>¿Cómo prefieres obtenerlo?</label>
                      <div className="tt-ps-pay-toggle">
                        <button
                          type="button"
                          className={`tt-ps-3d-chip ${purchaseMethod === 'direct' ? 'is-active' : ''}`}
                          onClick={() => {
                            triggerHaptic('light');
                            setPurchaseMethod('direct');
                          }}
                        >
                          Pago directo · S/ {detailPricing.effectiveCash}
                        </button>
                        <button
                          type="button"
                          className={`tt-ps-3d-chip ${purchaseMethod === 'full_gems' ? 'is-active' : ''}`}
                          onClick={() => {
                            triggerHaptic('light');
                            setPurchaseMethod('full_gems');
                          }}
                        >
                          Canje · {selectedProduct.gemsCost.toLocaleString('es-PE')} 💎
                        </button>
                      </div>
                      {purchaseMethod === 'full_gems' && !detailPricing.canRedeemGems && (
                        <small className="tt-ps-warn-inline">
                          Tienes {myGems.toLocaleString('es-PE')} 💎. Te faltan{' '}
                          {(selectedProduct.gemsCost - myGems).toLocaleString('es-PE')} 💎 para este canje.
                        </small>
                      )}
                    </div>
                  )}

                  {selectedProduct.channel === 'OWN_STOCK' && (
                    <div className="tt-ps-field">
                      <label htmlFor="tt-ps-pickup">Sede de entrega</label>
                      <select
                        id="tt-ps-pickup"
                        className="tt-input"
                        value={pickupClubId}
                        onChange={(e) => setPickupClubId(e.target.value)}
                      >
                        {(clubs || []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {purchaseMethod === 'direct' && selectedProduct.channel === 'OWN_STOCK' && (
                    <div className="tt-ps-payment-card">
                      <div>
                        <span>Yape / Plin Oficial</span>
                        <strong>{PROSHOP_EDITABLE_CONFIG.payment.yapePlin}</strong>
                        <small>{PROSHOP_EDITABLE_CONFIG.payment.holder}</small>
                      </div>
                      <button
                        type="button"
                        className="tt-ps-3d-chip"
                        onClick={() =>
                          handleCopyText(PROSHOP_EDITABLE_CONFIG.payment.yapePlin, 'Número Yape/Plin')
                        }
                      >
                        Copiar
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="tt-ps-3d-btn is-emerald"
                    onClick={handleConfirmOwnOrCoachOrder}
                  >
                    <TTIcon name="whatsapp" size={18} />
                    {purchaseMethod === 'full_gems' && selectedProduct.channel === 'OWN_STOCK'
                      ? `Canjear por ${selectedProduct.gemsCost.toLocaleString('es-PE')} 💎 y coordinar entrega`
                      : selectedProduct.channel === 'COACH'
                      ? `Reservar con ${selectedProduct.brand} (S/ ${detailPricing.effectiveCash})`
                      : `Confirmar pedido por WhatsApp (S/ ${detailPricing.effectiveCash})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================
            SUB-VISTA C: BÓVEDA DE GEMAS (VICTORIA HASTA 6-0, 6-0 + CASHBACK)
            ================================================================== */}
        {activeMode === 'vault' && !selectedProduct && !showAdminManager && (
          <div className="tt-ps-vault-wrap">
            <div className="tt-ps-vault-hero">
              <div className="tt-ps-vault-balance">
                <span>TU SALDO DISPONIBLE</span>
                <strong>{myGems.toLocaleString('es-PE')} 💎</strong>
                <small>
                  Puntos de fidelidad sin valor monetario · Canjeables en Stock Propio y Fondos de Perfil
                </small>
              </div>

              <div className="tt-ps-vault-cap">
                <div className="tt-ps-vault-cap-head">
                  <span>Progreso semanal en cancha</span>
                  <strong>
                    {weeklyEarned} / {weeklyCap} 💎 {isVip ? '(VIP ×2.5)' : ''}
                  </strong>
                </div>
                <div className="tt-ps-vault-bar">
                  <div className="tt-ps-vault-bar-fill" style={{ width: `${weeklyPct}%` }} />
                </div>
              </div>

              {!isVip && onOpenVipCard && (
                <button
                  type="button"
                  className="tt-ps-3d-btn is-gold"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose?.();
                    onOpenVipCard();
                  }}
                >
                  Activar Socio VIP · Multiplica tus Gemas ×2.5
                </button>
              )}
            </div>

            <div className="tt-ps-section-block">
              <div className="tt-ps-section-head">
                <h4>Cómo ganar Gemas</h4>
                <span>Cancha + Cashback</span>
              </div>

              <div className="tt-ps-missions-list">
                {GEM_MISSIONS.map((m) => (
                  <div key={m.id} className="tt-ps-mission-card">
                    <IconBadge name={m.icon} variant={m.variant} size={36} />
                    <div className="tt-ps-mission-copy">
                      <strong>{m.title}</strong>
                      <p>{m.note}</p>
                    </div>
                    <div className="tt-ps-mission-reward">
                      <strong>{isVip ? m.vip : m.standard}</strong>
                      {!isVip && m.vip !== m.standard && <small>VIP: {m.vip}</small>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tt-ps-section-block">
              <div className="tt-ps-section-head">
                <h4>Últimos movimientos</h4>
                <span>{effectiveLedger.length} registros</span>
              </div>

              <div className="tt-ps-ledger-list">
                {effectiveLedger.map((item) => {
                  const isDebit = item.type === 'debit';
                  return (
                    <div key={item.id} className="tt-ps-ledger-row">
                      <div style={{ minWidth: 0 }}>
                        <strong>{item.title}</strong>
                        <small>
                          {item.detail ? `${item.detail} · ` : ''}
                          {item.date || 'Reciente'}
                        </small>
                      </div>
                      <span className={`tt-ps-ledger-amt ${isDebit ? 'is-debit' : 'is-credit'}`}>
                        {isDebit ? `-${item.amount}` : `+${item.amount}`} 💎
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            SUB-VISTA D: CATÁLOGO PRO SHOP (3 CARRILES CON BOTONES 3D)
            ================================================================== */}
        {activeMode === 'shop' && !selectedProduct && !showAdminManager && (
          <div className="tt-ps-catalog-wrap">
            <div className="tt-ps-search-row">
              <TTIcon name="search" size={17} style={{ opacity: 0.65 }} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar raquetas, pelotas, encordado o marcas..."
                aria-label="Buscar en Pro Shop"
              />
            </div>

            <div className="tt-ps-filters-row">
              {CHANNEL_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`tt-ps-3d-chip ${channelFilter === f.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setChannelFilter(f.id);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <EmptyStateCard
                theme={theme}
                title="No encontramos ese artículo"
                description="Prueba con otro filtro o limpia el buscador para ver todo el Pro Shop."
                actionLabel="Ver todo"
                onAction={() => {
                  setChannelFilter('ALL');
                  setSearchQuery('');
                }}
              />
            ) : (
              <div className="tt-ps-lanes-stack">
                {lanes.sponsors.length > 0 && (
                  <section className="tt-ps-lane">
                    <div className="tt-ps-lane-head">
                      <div>
                        <h4>Marcas Aliadas · Cashback en Gemas 💎</h4>
                        <p>Compra con nuestro enlace/código y te devolvemos Gemas en tu Bóveda.</p>
                      </div>
                    </div>
                    <div className="tt-ps-grid">{lanes.sponsors.map(renderProductCard)}</div>
                  </section>
                )}

                {lanes.own.length > 0 && (
                  <section className="tt-ps-lane">
                    <div className="tt-ps-lane-head">
                      <div>
                        <h4>Almacén y Taller TOTAL TENIS</h4>
                        <p>Entrega inmediata en sede · Único carril canjeable con tus Gemas.</p>
                      </div>
                    </div>
                    <div className="tt-ps-grid">{lanes.own.map(renderProductCard)}</div>
                  </section>
                )}

                {lanes.coaches.length > 0 && (
                  <section className="tt-ps-lane">
                    <div className="tt-ps-lane-head">
                      <div>
                        <h4>Vitrina de Coaches Oficiales</h4>
                        <p>Evaluaciones técnicas y packs directos con entrenadores del circuito.</p>
                      </div>
                    </div>
                    <div className="tt-ps-grid">{lanes.coaches.map(renderProductCard)}</div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tt-ps-root {
          display: flex;
          flex-direction: column;
          gap: 14px;
          color: var(--tt-text);
        }

        /* ==================================================================
           SISTEMA 3D TÁCTIL + LIQUID GLASS (OSCURO Y CLARO CON CONTRASTE REAL)
           ================================================================== */
        .tt-ps-3d-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.01em;
          cursor: pointer;
          border: 1px solid transparent;
          transition:
            transform 120ms cubic-bezier(0.22, 1.35, 0.36, 1),
            box-shadow 120ms ease,
            filter 160ms ease;
        }
        .tt-ps-3d-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .tt-ps-3d-btn:active:not(:disabled) {
          transform: translateY(3px) scale(0.985);
        }

        .tt-ps-3d-btn.is-emerald {
          background: linear-gradient(180deg, #1EF093 0%, #00C96F 55%, #00A95C 100%);
          color: #0D0219;
          border-color: rgba(152, 255, 207, 0.65);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.65),
            0 4px 0 #007540,
            0 10px 20px rgba(0, 220, 125, 0.28);
        }
        .tt-ps-3d-btn.is-emerald:active:not(:disabled) {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            0 1px 0 #007540,
            0 4px 10px rgba(0, 220, 125, 0.22);
        }

        .tt-ps-3d-btn.is-gold {
          background: linear-gradient(180deg, #F9E7B2 0%, #E5C16C 55%, #C99B3B 100%);
          color: #1A1002;
          border-color: rgba(255, 245, 210, 0.72);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 4px 0 #8A6114,
            0 10px 20px rgba(229, 193, 108, 0.28);
        }
        .tt-ps-3d-btn.is-gold:active:not(:disabled) {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            0 1px 0 #8A6114,
            0 4px 10px rgba(229, 193, 108, 0.22);
        }

        .tt-ps-3d-btn.is-sky {
          background: linear-gradient(180deg, #60D5FF 0%, #24B0EE 58%, #0F8AC6 100%);
          color: #061A29;
          border-color: rgba(186, 236, 255, 0.7);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.62),
            0 4px 0 #075B87,
            0 10px 20px rgba(56, 189, 248, 0.26);
        }
        .tt-ps-3d-btn.is-sky:active:not(:disabled) {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            0 1px 0 #075B87,
            0 4px 10px rgba(56, 189, 248, 0.2);
        }

        .tt-ps-3d-btn.is-dark-pill {
          background: linear-gradient(180deg, #35155A 0%, #240B41 100%);
          color: #FAF9F5;
          border-color: rgba(255, 255, 255, 0.18);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            0 4px 0 #120322,
            0 8px 16px rgba(0, 0, 0, 0.34);
        }
        .tt-ps-3d-btn.is-dark-pill:active:not(:disabled) {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 1px 0 #120322,
            0 3px 8px rgba(0, 0, 0, 0.28);
        }
        .tt-ps-root.is-light .tt-ps-3d-btn.is-dark-pill {
          background: linear-gradient(180deg, #FFFFFF 0%, #EEEAF6 100%);
          color: #1E0734;
          border-color: rgba(30, 7, 52, 0.2);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #C9BEDE,
            0 8px 16px rgba(30, 7, 52, 0.12);
        }
        .tt-ps-root.is-light .tt-ps-3d-btn.is-dark-pill:active:not(:disabled) {
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 1px 0 #C9BEDE,
            0 3px 8px rgba(30, 7, 52, 0.1);
        }

        /* BOTÓN VOLVER 3D */
        .tt-ps-back-3d {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 12px;
          background: linear-gradient(180deg, #321355 0%, #220A3D 100%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #FAF9F5;
          font-size: 0.76rem;
          font-weight: 800;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            0 3px 0 #110320;
          transition: transform 110ms ease, box-shadow 110ms ease;
        }
        .tt-ps-back-3d:active {
          transform: translateY(2px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #110320;
        }
        .tt-ps-root.is-light .tt-ps-back-3d {
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEBF6 100%);
          border-color: rgba(30, 7, 52, 0.18);
          color: #1E0734;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #C8BEDC;
        }

        /* BARRA SUPERIOR CON TABS 3D REALES (PRO SHOP | BÓVEDA) */
        .tt-ps-top-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-ps-mode-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 6px;
          border-radius: 18px;
          background: rgba(14, 3, 26, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.45);
        }
        .tt-ps-root.is-light .tt-ps-mode-switch {
          background: #E8E2F2;
          border-color: rgba(30, 7, 52, 0.14);
          box-shadow: inset 0 2px 5px rgba(30, 7, 52, 0.12);
        }
        .tt-ps-3d-tab {
          min-height: 44px;
          padding: 0 12px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 0.8rem;
          font-weight: 800;
          background: linear-gradient(180deg, #2D114D 0%, #1E0838 100%);
          color: rgba(250, 249, 245, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.14),
            0 3px 0 #10021E;
          transition: transform 110ms ease, box-shadow 110ms ease, background 180ms ease;
        }
        .tt-ps-3d-tab:active {
          transform: translateY(2px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-ps-3d-tab.is-active {
          background: linear-gradient(180deg, #1CF092 0%, #00C86E 55%, #00A95C 100%);
          color: #0D0219;
          font-weight: 900;
          border-color: rgba(164, 255, 214, 0.72);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.65),
            0 4px 0 #007540,
            0 8px 18px rgba(0, 220, 125, 0.3);
        }
        .tt-ps-root.is-light .tt-ps-3d-tab {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1EDF8 100%);
          color: #361C54;
          border-color: rgba(30, 7, 52, 0.14);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #CFC5E2;
        }
        .tt-ps-root.is-light .tt-ps-3d-tab.is-active {
          background: linear-gradient(180deg, #331059 0%, #1E0734 100%);
          color: #00DC7D;
          border-color: #1E0734;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 4px 0 #0E021A,
            0 8px 16px rgba(30, 7, 52, 0.24);
        }
        .tt-ps-gem-counter {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(16, 2, 30, 0.28);
          font-size: 0.7rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .tt-ps-root.is-light .tt-ps-3d-tab:not(.is-active) .tt-ps-gem-counter {
          background: rgba(30, 7, 52, 0.1);
          color: #1E0734;
        }
        .tt-ps-root.is-light .tt-ps-3d-tab.is-active .tt-ps-gem-counter {
          background: rgba(0, 220, 125, 0.18);
          color: #00DC7D;
        }

        /* CHIPS / FILTROS 3D CON RELIEVE FÍSICO */
        .tt-ps-3d-chip {
          flex-shrink: 0;
          min-height: 36px;
          padding: 6px 13px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 800;
          background: linear-gradient(180deg, #311254 0%, #21093C 100%);
          color: #EDE8F5;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 3px 0 #10021E;
          transition: transform 110ms ease, box-shadow 110ms ease, background 160ms ease;
        }
        .tt-ps-3d-chip:active {
          transform: translateY(2px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 0 #10021E;
        }
        .tt-ps-3d-chip.is-active {
          background: linear-gradient(180deg, #1CF092 0%, #00C96F 60%, #00A85B 100%);
          color: #0E021A;
          border-color: rgba(164, 255, 214, 0.72);
          font-weight: 900;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.62),
            0 3px 0 #007540,
            0 6px 14px rgba(0, 220, 125, 0.28);
        }
        .tt-ps-3d-chip.is-danger {
          background: linear-gradient(180deg, #F87171 0%, #DC2626 100%);
          color: #FFFFFF;
          border-color: rgba(254, 202, 202, 0.55);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 3px 0 #991B1B;
        }
        .tt-ps-root.is-light .tt-ps-3d-chip {
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEBF7 100%);
          color: #1E0734;
          border-color: rgba(30, 7, 52, 0.18);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #C7BDDC;
        }
        .tt-ps-root.is-light .tt-ps-3d-chip.is-active {
          background: linear-gradient(180deg, #321057 0%, #1E0734 100%);
          color: #00DC7D;
          border-color: #1E0734;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 3px 0 #0D0218,
            0 6px 14px rgba(30, 7, 52, 0.22);
        }

        /* ==================================================================
           CATÁLOGO 3 CARRILES + TARJETAS CON PROFUNDIDAD Y BRILLO
           ================================================================== */
        .tt-ps-catalog-wrap {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-ps-search-row {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 46px;
          padding: 0 14px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1.5px solid var(--tt-border);
          box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.12);
        }
        .tt-ps-root.is-light .tt-ps-search-row {
          background: #FFFFFF;
          border-color: rgba(30, 7, 52, 0.18);
          color: #1E0734;
        }
        .tt-ps-search-row input {
          width: 100%;
          border: none;
          background: transparent;
          color: inherit;
          font-size: 16px;
          outline: none;
        }
        .tt-ps-filters-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 2px 1px 6px;
          scrollbar-width: none;
        }
        .tt-ps-filters-row::-webkit-scrollbar {
          display: none;
        }

        .tt-ps-lanes-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .tt-ps-lane {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-ps-lane-head h4 {
          margin: 0;
          font-size: 0.96rem;
          font-weight: 900;
          color: var(--tt-text);
        }
        .tt-ps-lane-head p {
          margin: 2px 0 0;
          font-size: 0.74rem;
          color: var(--tt-text-muted);
        }
        .tt-ps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 560px) {
          .tt-ps-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .tt-ps-card {
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(42, 16, 72, 0.94) 0%, rgba(24, 7, 44, 0.98) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 5px 0 rgba(10, 2, 20, 0.78),
            0 12px 24px rgba(0, 0, 0, 0.28);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 150ms cubic-bezier(0.22, 1.35, 0.36, 1), border-color 180ms ease;
        }
        .tt-ps-card:active {
          transform: translateY(2px) scale(0.99);
        }
        .tt-ps-card.is-sponsor {
          border-color: rgba(229, 193, 108, 0.48);
        }
        .tt-ps-card.is-own {
          border-color: rgba(0, 220, 125, 0.42);
        }
        .tt-ps-card.is-coach {
          border-color: rgba(56, 189, 248, 0.42);
        }
        .tt-ps-root.is-light .tt-ps-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F7F4FC 100%);
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 5px 0 #D6CEE6,
            0 12px 22px rgba(30, 7, 52, 0.1);
        }
        .tt-ps-root.is-light .tt-ps-card.is-sponsor {
          border-color: rgba(180, 126, 22, 0.42);
        }
        .tt-ps-root.is-light .tt-ps-card.is-own {
          border-color: rgba(0, 150, 84, 0.36);
        }

        .tt-ps-card-media {
          position: relative;
          height: 148px;
          background: radial-gradient(circle at 50% 35%, rgba(0, 220, 125, 0.14), rgba(16, 3, 29, 0.92));
          overflow: hidden;
        }
        .tt-ps-root.is-light .tt-ps-card-media {
          background: radial-gradient(circle at 50% 35%, #EFEAF9, #E1D9F0);
        }
        .tt-ps-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-ps-card-badge {
          position: absolute;
          top: 9px;
          left: 9px;
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
        }
        .tt-ps-card-badge.is-gold {
          background: linear-gradient(180deg, #F8E5AC 0%, #D4A442 100%);
          color: #1A1002;
        }
        .tt-ps-card-badge.is-emerald {
          background: linear-gradient(180deg, #1EF093 0%, #00B966 100%);
          color: #0D0219;
        }
        .tt-ps-card-badge.is-sky {
          background: linear-gradient(180deg, #68D8FF 0%, #0EA5E9 100%);
          color: #051A2A;
        }

        .tt-ps-cashback-pill {
          position: absolute;
          left: 9px;
          bottom: 9px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(20, 4, 36, 0.92);
          border: 1.5px solid #E5C16C;
          color: #F7E2A6;
          font-size: 0.68rem;
          font-weight: 900;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.45);
        }

        .tt-ps-admin-edit-fab {
          position: absolute;
          top: 9px;
          right: 9px;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(18, 4, 32, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #FAF9F5;
          font-size: 0.85rem;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .tt-ps-card-body {
          padding: 12px 13px 14px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          flex: 1;
        }
        .tt-ps-card-brand {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #00DC7D;
        }
        .tt-ps-root.is-light .tt-ps-card-brand {
          color: #007A44;
        }
        .tt-ps-card-title {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 900;
          line-height: 1.24;
          color: var(--tt-text);
        }
        .tt-ps-price-stack {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 4px;
        }
        .tt-ps-price-line {
          display: flex;
          align-items: baseline;
          gap: 7px;
          flex-wrap: wrap;
        }
        .tt-ps-price-line strong {
          font-size: 1.08rem;
          font-weight: 900;
          color: var(--tt-text);
        }
        .tt-ps-old-price {
          font-size: 0.74rem;
          text-decoration: line-through;
          color: var(--tt-text-muted);
        }
        .tt-ps-vip-tag {
          padding: 2px 7px;
          border-radius: 7px;
          background: rgba(229, 193, 108, 0.18);
          border: 1px solid rgba(229, 193, 108, 0.45);
          color: #F3DC9B;
          font-size: 0.66rem;
          font-weight: 900;
        }
        .tt-ps-root.is-light .tt-ps-vip-tag {
          background: #FBF1D4;
          border-color: rgba(154, 107, 22, 0.35);
          color: #82560B;
        }
        .tt-ps-gems-cost-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 9px;
          border-radius: 10px;
          background: rgba(0, 220, 125, 0.12);
          border: 1px solid rgba(0, 220, 125, 0.32);
          font-size: 0.7rem;
          color: var(--tt-text);
        }
        .tt-ps-gems-cost-line strong {
          color: #00DC7D;
          font-weight: 900;
        }
        .tt-ps-root.is-light .tt-ps-gems-cost-line {
          background: #E7F9F0;
          border-color: rgba(0, 140, 78, 0.3);
          color: #163327;
        }
        .tt-ps-root.is-light .tt-ps-gems-cost-line strong {
          color: #007A44;
        }

        .tt-ps-code-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 6px 9px;
          border-radius: 10px;
          background: rgba(229, 193, 108, 0.14);
          border: 1px dashed rgba(229, 193, 108, 0.52);
          color: #F6E2A8;
          font-size: 0.7rem;
        }
        .tt-ps-code-chip small {
          font-weight: 900;
          color: #00DC7D;
        }
        .tt-ps-root.is-light .tt-ps-code-chip {
          background: #FDF6E2;
          border-color: rgba(154, 107, 22, 0.45);
          color: #6B4506;
        }
        .tt-ps-root.is-light .tt-ps-code-chip small {
          color: #007A44;
        }
        .tt-ps-card .tt-ps-3d-btn {
          margin-top: auto;
          width: 100%;
          min-height: 40px;
          font-size: 0.76rem;
        }

        /* ==================================================================
           FICHA DETALLADA + PANEL CASHBACK EN GEMAS + FORMULARIO RECLAMO
           ================================================================== */
        .tt-ps-detail-wrap {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-ps-detail-hero {
          position: relative;
          height: 205px;
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid var(--tt-border);
          background: #17042A;
        }
        .tt-ps-detail-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-ps-detail-cashback-float {
          position: absolute;
          left: 12px;
          bottom: 12px;
          padding: 7px 12px;
          border-radius: 12px;
          background: rgba(18, 4, 34, 0.92);
          border: 1.5px solid #E5C16C;
          color: #FAF9F5;
          font-size: 0.76rem;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
        }
        .tt-ps-detail-cashback-float strong {
          color: #F6E2A8;
          font-weight: 900;
        }

        .tt-ps-detail-info {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .tt-ps-detail-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-ps-detail-head h3 {
          margin: 3px 0 0;
          font-size: 1.12rem;
          font-weight: 900;
          color: var(--tt-text);
        }
        .tt-ps-detail-price-col {
          text-align: right;
          flex-shrink: 0;
        }
        .tt-ps-detail-price-col strong {
          display: block;
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--tt-text);
        }
        .tt-ps-detail-desc {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.48;
          color: var(--tt-text-muted);
        }
        .tt-ps-specs-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .tt-ps-spec-box {
          padding: 10px 11px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-ps-root.is-light .tt-ps-spec-box {
          background: #F4F1FA;
          border-color: rgba(30, 7, 52, 0.14);
        }
        .tt-ps-spec-box span {
          font-size: 0.67rem;
          color: var(--tt-text-muted);
          font-weight: 700;
        }
        .tt-ps-spec-box strong {
          font-size: 0.77rem;
          color: var(--tt-text);
        }

        .tt-ps-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-ps-field label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-ps-variants-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tt-ps-sponsor-panel {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-ps-cashback-box {
          padding: 13px;
          border-radius: 17px;
          background: linear-gradient(135deg, #270B46 0%, #16042A 100%);
          border: 1.5px solid rgba(229, 193, 108, 0.55);
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          gap: 11px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 10px 22px rgba(0, 0, 0, 0.25);
        }
        .tt-ps-cashback-box-head {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .tt-ps-cashback-box-head strong {
          display: block;
          font-size: 0.9rem;
          color: #F8E5AC;
        }
        .tt-ps-cashback-box-head p {
          margin: 3px 0 0;
          font-size: 0.75rem;
          line-height: 1.42;
          color: rgba(250, 249, 245, 0.85);
        }
        .tt-ps-code-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 11px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px dashed rgba(229, 193, 108, 0.55);
        }
        .tt-ps-code-banner span {
          display: block;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: rgba(250, 249, 245, 0.7);
        }
        .tt-ps-code-banner strong {
          font-size: 0.96rem;
          letter-spacing: 0.06em;
          color: #FFFFFF;
        }

        .tt-ps-sponsor-actions {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-ps-claim-done-banner {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px 12px;
          border-radius: 14px;
          background: rgba(0, 220, 125, 0.14);
          border: 1.5px solid rgba(0, 220, 125, 0.45);
          font-size: 0.76rem;
          line-height: 1.4;
          color: var(--tt-text);
        }
        .tt-ps-claim-form {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1.5px solid rgba(0, 220, 125, 0.4);
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-ps-root.is-light .tt-ps-claim-form {
          background: #F6F3FC;
          border-color: rgba(0, 150, 84, 0.35);
        }
        .tt-ps-claim-head strong {
          display: block;
          font-size: 0.86rem;
          color: var(--tt-text);
        }
        .tt-ps-claim-head small {
          font-size: 0.72rem;
          color: var(--tt-text-muted);
        }

        .tt-ps-order-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-ps-string-box {
          padding: 12px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-ps-string-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-ps-altitude-tip {
          font-size: 0.71rem;
          color: var(--tt-text-muted);
          line-height: 1.38;
        }
        .tt-ps-pay-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tt-ps-warn-inline {
          font-size: 0.72rem;
          font-weight: 800;
          color: #F59E0B;
        }
        .tt-ps-root.is-light .tt-ps-warn-inline {
          color: #B45309;
        }
        .tt-ps-payment-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 13px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-ps-payment-card span {
          display: block;
          font-size: 0.67rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-ps-payment-card strong {
          display: block;
          font-size: 0.96rem;
          color: var(--tt-text);
        }
        .tt-ps-payment-card small {
          font-size: 0.69rem;
          color: var(--tt-text-muted);
        }

        /* ==================================================================
           BÓVEDA DE GEMAS
           ================================================================== */
        .tt-ps-vault-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tt-ps-vault-hero {
          padding: 16px;
          border-radius: 20px;
          background: linear-gradient(145deg, #2A0C4B 0%, #150327 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.42);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 5px 0 rgba(9, 2, 18, 0.8),
            0 12px 24px rgba(0, 0, 0, 0.3);
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-ps-vault-balance span {
          display: block;
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
        }
        .tt-ps-vault-balance strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 2rem;
          font-weight: 900;
          line-height: 1.08;
          margin: 3px 0;
          color: #FAF9F5;
        }
        .tt-ps-vault-balance small {
          font-size: 0.72rem;
          color: rgba(250, 249, 245, 0.76);
        }
        .tt-ps-vault-cap {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-ps-vault-cap-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.74rem;
          color: rgba(250, 249, 245, 0.88);
        }
        .tt-ps-vault-bar {
          height: 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          overflow: hidden;
        }
        .tt-ps-vault-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00DC7D 0%, #E5C16C 100%);
        }

        .tt-ps-section-block {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-ps-section-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-ps-section-head h4 {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 900;
          color: var(--tt-text);
        }
        .tt-ps-section-head span {
          font-size: 0.71rem;
          font-weight: 700;
          color: var(--tt-text-muted);
        }
        .tt-ps-missions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-ps-mission-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 3px 0 rgba(0, 0, 0, 0.16);
        }
        .tt-ps-root.is-light .tt-ps-mission-card {
          background: #FFFFFF;
          border-color: rgba(30, 7, 52, 0.14);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #DAD2EA;
        }
        .tt-ps-mission-copy {
          flex: 1;
          min-width: 0;
        }
        .tt-ps-mission-copy strong {
          display: block;
          font-size: 0.8rem;
          color: var(--tt-text);
        }
        .tt-ps-mission-copy p {
          margin: 2px 0 0;
          font-size: 0.7rem;
          line-height: 1.35;
          color: var(--tt-text-muted);
        }
        .tt-ps-mission-reward {
          text-align: right;
          flex-shrink: 0;
        }
        .tt-ps-mission-reward strong {
          display: block;
          font-size: 0.78rem;
          font-weight: 900;
          color: var(--tt-emerald-text);
        }
        .tt-ps-mission-reward small {
          display: block;
          font-size: 0.64rem;
          color: #E5C16C;
          font-weight: 800;
        }
        .tt-ps-root.is-light .tt-ps-mission-reward small {
          color: #8A5D10;
        }

        .tt-ps-ledger-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-ps-ledger-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-ps-root.is-light .tt-ps-ledger-row {
          background: #FFFFFF;
          border-color: rgba(30, 7, 52, 0.12);
        }
        .tt-ps-ledger-row strong {
          display: block;
          font-size: 0.79rem;
          color: var(--tt-text);
        }
        .tt-ps-ledger-row small {
          display: block;
          font-size: 0.69rem;
          color: var(--tt-text-muted);
        }
        .tt-ps-ledger-amt {
          font-size: 0.82rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .tt-ps-ledger-amt.is-credit {
          color: var(--tt-emerald-text);
        }
        .tt-ps-ledger-amt.is-debit {
          color: #EF4444;
        }

        /* ==================================================================
           GESTOR ADMIN DEL PRO SHOP
           ================================================================== */
        .tt-ps-admin-wrap {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-ps-admin-form {
          padding: 14px;
          border-radius: 18px;
          background: var(--tt-surface-2);
          border: 1.5px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-ps-root.is-light .tt-ps-admin-form {
          background: #F6F3FC;
          border-color: rgba(30, 7, 52, 0.16);
        }
        .tt-ps-admin-section-title strong {
          display: block;
          font-size: 0.9rem;
          color: var(--tt-text);
        }
        .tt-ps-admin-section-title span {
          font-size: 0.72rem;
          color: var(--tt-text-muted);
        }
        .tt-ps-channel-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .tt-ps-admin-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .tt-ps-admin-grid-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 560px) {
          .tt-ps-admin-grid-2 {
            grid-template-columns: 1fr 1fr;
          }
          .tt-ps-admin-grid-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .tt-ps-admin-sponsor-box {
          padding: 11px;
          border-radius: 14px;
          background: rgba(229, 193, 108, 0.1);
          border: 1px solid rgba(229, 193, 108, 0.42);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-ps-admin-note {
          font-size: 0.7rem;
          line-height: 1.38;
          color: var(--tt-text-muted);
        }
        .tt-ps-admin-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-ps-admin-list h5 {
          margin: 0;
          font-size: 0.85rem;
          color: var(--tt-text);
        }
        .tt-ps-admin-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-ps-admin-item strong {
          display: block;
          font-size: 0.8rem;
          color: var(--tt-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-ps-admin-item small {
          display: block;
          font-size: 0.69rem;
          color: var(--tt-text-muted);
        }
      `}</style>
    </ModalPortal>
  );
}
