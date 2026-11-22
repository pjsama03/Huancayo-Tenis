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
   METADATOS EXTENDIDOS SIN CAMBIAR SQL (VARIANTES, CÓDIGO PROMO, MARCA)
   Se guardan de forma invisible dentro de `description` en Supabase y el
   cliente solo ve el texto limpio y los botones táctiles de selección.
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

  // Solo el Almacén Propio permite canje de Gemas
  const gemsCost = channel === 'OWN_STOCK' ? Math.max(0, Number(raw?.gemsCost) || 0) : 0;

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
   MOSTRADOR DEMO INICIAL (3 CARRILES HÍBRIDOS LISTOS PARA PRESENTAR A MARCAS)
   Se reemplaza automáticamente en cuanto cargan o editas tus productos en Supabase.
   ========================================================================== */
export const DEFAULT_HYBRID_CATALOG = [
  // CARRIL 1: MARCAS OFICIALES / TIENDAS ALIADAS (LINK EXACTO AL PRODUCTO · SIN GEMAS)
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
    externalUrl: 'https://www.babolat.com/us/pure-aero-98-unstrung/101499.html',
    promoCode: '',
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
   MISIONES LIMPIAS DE GEMAS (ALINEADAS AL ANTI-FARMEO +3 💎 · CERO SOLES)
   ========================================================================== */
const GEM_MISSIONS = [
  {
    id: 'm-streak',
    icon: 'trophy',
    variant: 'gold',
    title: 'Racha de 3+ victorias seguidas',
    standard: '+5 💎',
    vip: '+13 💎 (×2.5)',
    note: 'En partidos oficiales confirmados',
  },
  {
    id: 'm-giant',
    icon: 'challenge',
    variant: 'emerald',
    title: 'Victoria ante categoría superior',
    standard: '+10 💎',
    vip: '+25 💎 (×2.5)',
    note: 'Premio al mérito deportivo',
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
    icon: 'crown',
    variant: 'gold',
    title: 'Podio en Torneos Oficiales',
    standard: '+120 a +300 💎',
    vip: '+120 a +300 💎',
    note: 'Acreditado al cierre oficial del cuadro',
  },
];

const CHANNEL_FILTERS = [
  { id: 'ALL', label: 'Todo' },
  { id: 'OWN_STOCK', label: 'En Stock · Gemas' },
  { id: 'SPONSOR', label: 'Marcas Oficiales' },
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
  externalUrl: '',
  promoCode: '',
  variantLabel: 'Opción / Talla',
  variantsCsv: '',
  coachWhatsapp: '',
  badgeText: '',
  inStock: true,
};

/* ==========================================================================
   COMPONENTE PRINCIPAL: ProShopAndGemsModal (3 CARRILES + GESTOR ADMIN)
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
     ACCIONES DE COMPRA, LINK EXTERNO CON RASTREO Y CANJE DE GEMAS
     ------------------------------------------------------------------------ */
  const openProductDetail = (item) => {
    triggerHaptic('light');
    setSelectedProductId(item.id);
    setSelectedVariant(item.variants?.[0] || '');
    setPurchaseMethod('direct');
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
     GESTOR ADMIN INTEGRADO (SUBIR STOCK/SPONSORS SIN TOCAR CÓDIGO JAMÁS)
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
     SUBCOMPONENTE INTERNO: TARJETA LIMPIA DE PRODUCTO
     ------------------------------------------------------------------------ */
  const renderProductCard = (item, idx) => {
    const isSponsor = item.channel === 'SPONSOR';
    const isOwn = item.channel === 'OWN_STOCK';

    return (
      <article
        key={item.id}
        className={`tt-prod-card is-ch-${item.channel.toLowerCase()}`}
        style={{ '--ps-delay': `${Math.min(idx, 8) * 40}ms` }}
        onClick={() => openProductDetail(item)}
      >
        <div className="tt-prod-media">
          <SmartImage
            src={item.imageUrl}
            fallbackSrc={item.fallbackImage || ASSETS.logo}
            alt={item.name}
            className="tt-prod-img"
          />
          {item.badgeText && <span className="tt-prod-tag">{item.badgeText}</span>}
          {isOwn && item.inStock && <span className="tt-prod-stock-dot">En Stock</span>}
        </div>

        <div className="tt-prod-body">
          <span className="tt-prod-brand">{item.brand}</span>
          <h3 className="tt-prod-name">{item.name}</h3>

          <div className="tt-prod-price-block">
            <div className="tt-prod-price-row">
              {item.oldPriceSoles && item.oldPriceSoles > item.priceSoles && (
                <span className="tt-prod-strike">S/ {item.oldPriceSoles}</span>
              )}
              <strong className="tt-prod-price">
                S/ {item.vipPriceSoles && isVip ? item.vipPriceSoles : item.priceSoles}
              </strong>
              {!isSponsor && item.vipPriceSoles && item.vipPriceSoles < item.priceSoles && (
                <span className="tt-prod-vip-chip">VIP S/ {item.vipPriceSoles}</span>
              )}
            </div>

            {isOwn && item.gemsCost > 0 && (
              <span className="tt-prod-gems-line">
                Canjeable con <strong>{item.gemsCost.toLocaleString('es-PE')} 💎</strong>
              </span>
            )}
            {isSponsor && item.promoCode && (
              <span className="tt-prod-code-hint">Código: {item.promoCode}</span>
            )}
          </div>

          <div className="tt-prod-foot">
            <span className="tt-prod-cta-label">
              {isSponsor ? 'Ver en tienda ↗' : isOwn ? 'Ver tallas / Canjear ›' : 'Ver sesión ›'}
            </span>
          </div>
        </div>
      </article>
    );
  };

  const modalTitle = showAdminManager
    ? 'Gestionar Tienda Pro Shop'
    : selectedProduct
    ? selectedProduct.name
    : activeMode === 'vault'
    ? 'Mi Bóveda de Gemas'
    : 'Pro Shop Oficial';

  const modalSubtitle = showAdminManager
    ? 'Sube stock propio o productos de marcas aliadas en segundos'
    : selectedProduct
    ? `${selectedProduct.brand} · ${
        selectedProduct.channel === 'SPONSOR'
          ? 'Tienda Oficial Aliada'
          : selectedProduct.channel === 'OWN_STOCK'
          ? 'En Stock · Almacén TOTAL TENIS'
          : 'Vitrina de Entrenadores'
      }`
    : activeMode === 'vault'
    ? `Saldo disponible: ${myGems.toLocaleString('es-PE')} 💎`
    : 'Equipamiento de marcas aliadas, stock propio y entrenadores';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={
        <IconBadge
          name={showAdminManager ? 'settings' : activeMode === 'vault' && !selectedProduct ? 'gem' : 'shop'}
          variant={activeMode === 'vault' && !selectedProduct ? 'purple' : 'emerald'}
          size={38}
        />
      }
      isWide
      isTopLayer
    >
      <div className={`tt-ps-root ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* ==================================================================
            CONMUTADOR SUPERIOR (PRO SHOP | BÓVEDA) + ACCESO ADMIN DISCRETO
            ================================================================== */}
        {!selectedProduct && !showAdminManager && (
          <div className="tt-ps-top-row">
            <div className="tt-ps-mode-bar" role="tablist" style={{ flex: 1 }}>
              <span
                className="tt-ps-mode-slider"
                aria-hidden="true"
                style={{ transform: `translateX(${activeMode === 'shop' ? '0%' : '100%'})` }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'shop'}
                className={`tt-ps-mode-btn ${activeMode === 'shop' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveMode('shop');
                }}
              >
                <TTIcon name="shop" size={15} />
                <span>Pro Shop</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'vault'}
                className={`tt-ps-mode-btn ${activeMode === 'vault' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveMode('vault');
                }}
              >
                <TTIcon name="gem" size={15} />
                <span>Bóveda ({myGems.toLocaleString('es-PE')})</span>
              </button>
            </div>

            {canManageStore && (
              <button
                type="button"
                className="tt-ps-admin-btn"
                onClick={openAdminForNew}
                title="Gestionar catálogo de la tienda"
              >
                <TTIcon name="settings" size={16} />
                <span>Gestionar</span>
              </button>
            )}
          </div>
        )}

        {/* ==================================================================
            VISTA ADMIN: GESTOR RÁPIDO DE TIENDA (SIN TOCAR CÓDIGO NUNCA MÁS)
            ================================================================== */}
        {showAdminManager && canManageStore && (
          <div className="tt-ps-stack tt-ps-enter">
            <button
              type="button"
              className="tt-detail-back-btn"
              onClick={() => setShowAdminManager(false)}
            >
              ‹ Volver a la tienda
            </button>

            <form onSubmit={handleSaveAdminProduct} className="tt-admin-form-card">
              <span className="tt-ps-kicker">
                {adminForm.id ? 'EDITAR ARTÍCULO' : 'SUBIR NUEVO ARTÍCULO AL MOSTRADOR'}
              </span>

              {/* Selector de Carril */}
              <div className="tt-admin-channel-row">
                {[
                  { id: 'OWN_STOCK', label: 'En Stock (Gemas)' },
                  { id: 'SPONSOR', label: 'Marca Aliada (Link)' },
                  { id: 'COACH', label: 'Vitrina Coach' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    className={`tt-adm-ch-btn ${adminForm.channel === ch.id ? 'is-on' : ''}`}
                    onClick={() => setAdminForm((p) => ({ ...p, channel: ch.id }))}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              {/* Foto directa desde celular o URL */}
              <div className="tt-adm-photo-row">
                <div className="tt-adm-thumb">
                  <SmartImage
                    src={adminForm.imageUrl}
                    fallbackSrc={ASSETS.logo}
                    alt="Vista previa"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    ref={adminPhotoRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadProductPhoto}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingImg}
                    className="tt-btn tt-btn-ghost tt-btn-sm"
                    onClick={() => adminPhotoRef.current?.click()}
                  >
                    <TTIcon name="camera" size={15} />
                    {isUploadingImg ? 'Subiendo foto...' : 'Tomar / Subir foto'}
                  </button>
                  <input
                    type="url"
                    className="tt-ps-input"
                    value={adminForm.imageUrl}
                    onChange={(e) => setAdminForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="O pega URL directa de la imagen"
                  />
                </div>
              </div>

              <div className="tt-adm-grid-2">
                <input
                  type="text"
                  className="tt-ps-input"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nombre del producto *"
                  required
                />
                <input
                  type="text"
                  className="tt-ps-input"
                  value={adminForm.brand}
                  onChange={(e) => setAdminForm((p) => ({ ...p, brand: e.target.value }))}
                  placeholder="Marca o tienda (ej. Wilson)"
                />
              </div>

              <div className="tt-adm-grid-3">
                <input
                  type="number"
                  className="tt-ps-input"
                  value={adminForm.priceSoles}
                  onChange={(e) => setAdminForm((p) => ({ ...p, priceSoles: e.target.value }))}
                  placeholder="Precio S/"
                />
                {adminForm.channel !== 'SPONSOR' ? (
                  <input
                    type="number"
                    className="tt-ps-input"
                    value={adminForm.vipPriceSoles}
                    onChange={(e) => setAdminForm((p) => ({ ...p, vipPriceSoles: e.target.value }))}
                    placeholder="Precio VIP S/"
                  />
                ) : (
                  <input
                    type="number"
                    className="tt-ps-input"
                    value={adminForm.oldPriceSoles}
                    onChange={(e) => setAdminForm((p) => ({ ...p, oldPriceSoles: e.target.value }))}
                    placeholder="Antes S/ (opc.)"
                  />
                )}
                {adminForm.channel === 'OWN_STOCK' ? (
                  <input
                    type="number"
                    className="tt-ps-input"
                    value={adminForm.gemsCost}
                    onChange={(e) => setAdminForm((p) => ({ ...p, gemsCost: e.target.value }))}
                    placeholder="Canje 💎"
                  />
                ) : (
                  <input
                    type="text"
                    className="tt-ps-input"
                    value={adminForm.badgeText}
                    onChange={(e) => setAdminForm((p) => ({ ...p, badgeText: e.target.value }))}
                    placeholder="Etiqueta (ej. PRO)"
                  />
                )}
              </div>

              {adminForm.channel === 'SPONSOR' && (
                <div className="tt-adm-grid-2">
                  <input
                    type="url"
                    className="tt-ps-input"
                    value={adminForm.externalUrl}
                    onChange={(e) => setAdminForm((p) => ({ ...p, externalUrl: e.target.value }))}
                    placeholder="Link exacto al producto (https://...)"
                  />
                  <input
                    type="text"
                    className="tt-ps-input"
                    value={adminForm.promoCode}
                    onChange={(e) => setAdminForm((p) => ({ ...p, promoCode: e.target.value }))}
                    placeholder="Código dcto (ej. TOTALTENIS10)"
                  />
                </div>
              )}

              {adminForm.channel === 'COACH' && (
                <input
                  type="tel"
                  className="tt-ps-input"
                  value={adminForm.coachWhatsapp}
                  onChange={(e) => setAdminForm((p) => ({ ...p, coachWhatsapp: e.target.value }))}
                  placeholder="WhatsApp del Coach (9 dígitos)"
                />
              )}

              <div className="tt-adm-grid-2">
                <input
                  type="text"
                  className="tt-ps-input"
                  value={adminForm.variantLabel}
                  onChange={(e) => setAdminForm((p) => ({ ...p, variantLabel: e.target.value }))}
                  placeholder="Título variante (ej. Tamaño de grip)"
                />
                <input
                  type="text"
                  className="tt-ps-input"
                  value={adminForm.variantsCsv}
                  onChange={(e) => setAdminForm((p) => ({ ...p, variantsCsv: e.target.value }))}
                  placeholder="Opciones: L2 (4 1/4), L3 (4 3/8)"
                />
              </div>

              <textarea
                rows={2}
                className="tt-ps-input"
                value={adminForm.description}
                onChange={(e) => setAdminForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descripción breve y clara del producto..."
              />

              <div style={{ display: 'flex', gap: 8 }}>
                {adminForm.id && (
                  <button
                    type="button"
                    className="tt-btn tt-btn-ghost tt-btn-sm"
                    onClick={() => setAdminForm(EMPTY_ADMIN_FORM)}
                  >
                    Nuevo
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="tt-btn tt-btn-primary tt-btn-sm"
                  style={{ flex: 1 }}
                >
                  {isSavingProduct
                    ? 'Guardando en la nube...'
                    : adminForm.id
                    ? 'Actualizar Producto'
                    : 'Publicar en Tienda'}
                </button>
              </div>
            </form>

            {/* Listado Admin con clics de sponsors en vivo */}
            <div>
              <span className="tt-ps-kicker">CATÁLOGO ACTIVO ({localProducts.length})</span>
              <div className="tt-adm-list">
                {localProducts.map((item) => (
                  <div key={item.id} className="tt-adm-row">
                    <div className="tt-adm-row-img">
                      <SmartImage
                        src={item.imageUrl}
                        fallbackSrc={item.fallbackImage || ASSETS.logo}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{item.name}</strong>
                      <small>
                        {item.channel === 'SPONSOR'
                          ? `Marca · ${item.clicksCount || 0} clics`
                          : item.channel === 'OWN_STOCK'
                          ? `En Stock · S/ ${item.priceSoles}${item.gemsCost ? ` · ${item.gemsCost} 💎` : ''}`
                          : `Coach · S/ ${item.priceSoles}`}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="tt-adm-edit-btn"
                      onClick={() => openAdminForEdit(item)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="tt-adm-del-btn"
                      onClick={() => handleDeleteAdminProduct(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            VISTA 1: BÓVEDA DE GEMAS (SIN EQUIVALENCIA EN SOLES — PUNTO 9)
            ================================================================== */}
        {!selectedProduct && !showAdminManager && activeMode === 'vault' && (
          <div key="ps-vault" className="tt-ps-stack tt-ps-enter">
            <div className="tt-vault-hero-card">
              <div className="tt-vh-top">
                <div>
                  <span className="tt-vh-kicker">SALDO DISPONIBLE</span>
                  <div className="tt-vh-balance">
                    <TTIcon name="gem" size={28} style={{ color: '#00DC7D' }} />
                    <strong>{myGems.toLocaleString('es-PE')}</strong>
                    <span>GEMAS</span>
                  </div>
                </div>
                <span className={`tt-vh-plan-pill ${isVip ? 'is-vip' : ''}`}>
                  {isVip ? 'SOCIO VIP · ×2.5' : 'ESTÁNDAR'}
                </span>
              </div>

              <div className="tt-vh-cap-box">
                <div className="tt-vh-cap-head">
                  <span>Avance semanal en cancha</span>
                  <strong>
                    {weeklyEarned} / {weeklyCap} 💎
                  </strong>
                </div>
                <div className="tt-vh-cap-track">
                  <div className="tt-vh-cap-fill" style={{ width: `${weeklyPct}%` }} />
                </div>
              </div>

              <div className="tt-vh-actions">
                <button
                  type="button"
                  className="tt-btn tt-btn-primary tt-btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    triggerHaptic('light');
                    setChannelFilter('OWN_STOCK');
                    setActiveMode('shop');
                  }}
                >
                  Canjear en Almacén
                </button>

                {!isVip && onOpenVipCard && (
                  <button
                    type="button"
                    className="tt-btn tt-btn-secondary tt-btn-sm"
                    onClick={() => {
                      triggerHaptic('medium');
                      if (onClose) onClose();
                      onOpenVipCard();
                    }}
                  >
                    +200 💎/mes VIP
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="tt-ps-kicker">CÓMO GANAR GEMAS</span>
              <div className="tt-missions-grid">
                {GEM_MISSIONS.map((m) => (
                  <div key={m.id} className="tt-mission-tile">
                    <IconBadge name={m.icon} variant={m.variant} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{m.title}</strong>
                      <small>{m.note}</small>
                      <div className="tt-mission-rates">
                        <span>Estándar: {m.standard}</span>
                        <span className="is-vip">VIP: {m.vip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="tt-ps-kicker">HISTORIAL DE MOVIMIENTOS</span>
              <div className="tt-ledger-list">
                {effectiveLedger.map((entry) => (
                  <div key={entry.id} className="tt-ledger-row">
                    <div className={`tt-ledger-dot ${entry.type === 'debit' ? 'is-out' : 'is-in'}`}>
                      {entry.type === 'debit' ? '−' : '+'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{entry.title}</strong>
                      <small>
                        {entry.date} · {entry.detail}
                      </small>
                    </div>
                    <strong className={`tt-ledger-amt ${entry.type === 'debit' ? 'is-out' : 'is-in'}`}>
                      {entry.type === 'debit' ? `-${entry.amount}` : `+${entry.amount}`} 💎
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            VISTA 2: PRO SHOP HÍBRIDO EN 3 CARRILES (MOSTRADOR LIMPIO)
            ================================================================== */}
        {!selectedProduct && !showAdminManager && activeMode === 'shop' && (
          <div key="ps-shop" className="tt-ps-stack tt-ps-enter">
            {/* Buscador + Filtros de Carril */}
            <div className="tt-shop-controls">
              <div className="tt-shop-search">
                <TTIcon name="search" size={16} style={{ opacity: 0.65, flexShrink: 0 }} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar raquetas, pelotas, encordado..."
                  aria-label="Buscar en Pro Shop"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="tt-shop-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    <TTIcon name="close" size={13} />
                  </button>
                )}
              </div>

              <div className="tt-shop-cats-row">
                {CHANNEL_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`tt-shop-cat-pill ${channelFilter === f.id ? 'is-active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setChannelFilter(f.id);
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <EmptyStateCard
                theme={theme}
                title="Sin resultados en esta sección"
                description="Prueba con otro término o revisa todo el escaparate disponible."
                actionLabel="Ver todo"
                onAction={() => {
                  setSearchQuery('');
                  setChannelFilter('ALL');
                }}
              />
            ) : (
              <div className="tt-lanes-stack">
                {/* CARRIL 1: MARCAS OFICIALES & TIENDAS ALIADAS */}
                {lanes.sponsors.length > 0 && (
                  <section className="tt-lane-block">
                    <div className="tt-lane-head">
                      <div>
                        <span className="tt-ps-kicker">TIENDAS OFICIALES · COMPRA DIRECTA</span>
                        <h3>Marcas Aliadas</h3>
                      </div>
                      <span className="tt-lane-tag">Enlace directo</span>
                    </div>
                    <div className="tt-shop-grid">
                      {lanes.sponsors.map((item, idx) => renderProductCard(item, idx))}
                    </div>
                  </section>
                )}

                {/* CARRIL 2: EN STOCK · ALMACÉN TOTAL TENIS (ÚNICO CON GEMAS) */}
                {lanes.own.length > 0 && (
                  <section className="tt-lane-block">
                    <div className="tt-lane-head">
                      <div>
                        <span className="tt-ps-kicker">ENTREGA EN SEDE · CANJE DE GEMAS</span>
                        <h3>En Stock · Almacén & Taller</h3>
                      </div>
                      <span className="tt-lane-tag is-emerald">Acepta 💎</span>
                    </div>
                    <div className="tt-shop-grid">
                      {lanes.own.map((item, idx) => renderProductCard(item, idx))}
                    </div>
                  </section>
                )}

                {/* CARRIL 3: VITRINA DE COACHES */}
                {lanes.coaches.length > 0 && (
                  <section className="tt-lane-block">
                    <div className="tt-lane-head">
                      <div>
                        <span className="tt-ps-kicker">PROGRAMAS Y SERVICIOS EN CANCHA</span>
                        <h3>Vitrina de Entrenadores</h3>
                      </div>
                    </div>
                    <div className="tt-shop-grid">
                      {lanes.coaches.map((item, idx) => renderProductCard(item, idx))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            VISTA 3: SUB-PANTALLA DE PRODUCTO (VARIANTES, GRIP, EDICIÓN Y PAGO)
            ================================================================== */}
        {selectedProduct && !showAdminManager && detailPricing && (
          <div key={selectedProduct.id} className="tt-ps-stack tt-ps-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="tt-detail-back-btn"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedProductId(null);
                }}
              >
                ‹ Volver al Pro Shop
              </button>

              {canManageStore && (
                <button
                  type="button"
                  className="tt-detail-back-btn"
                  onClick={() => openAdminForEdit(selectedProduct)}
                >
                  Editar artículo
                </button>
              )}
            </div>

            <div className="tt-detail-hero">
              <div className="tt-detail-media">
                <SmartImage
                  src={selectedProduct.imageUrl}
                  fallbackSrc={selectedProduct.fallbackImage || ASSETS.logo}
                  alt={selectedProduct.name}
                  className="tt-detail-img"
                />
              </div>

              <div className="tt-detail-summary">
                <span className="tt-ps-kicker">{selectedProduct.brand}</span>
                <h3>{selectedProduct.name}</h3>
                {selectedProduct.description && (
                  <p className="tt-detail-desc">{selectedProduct.description}</p>
                )}

                {/* Comparador limpio según carril */}
                <div className="tt-detail-compare-grid">
                  <div>
                    <span>Precio</span>
                    <strong>S/ {detailPricing.regularPrice}</strong>
                  </div>
                  {selectedProduct.channel !== 'SPONSOR' && (
                    <div className="is-vip">
                      <span>Socio VIP</span>
                      <strong>S/ {detailPricing.vipPrice}</strong>
                    </div>
                  )}
                  {selectedProduct.channel === 'OWN_STOCK' && selectedProduct.gemsCost > 0 && (
                    <div className="is-gems">
                      <span>Canje</span>
                      <strong>{selectedProduct.gemsCost.toLocaleString('es-PE')} 💎</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selector interactivo de variantes (Grip, Edición, Color) */}
            {selectedProduct.variants.length > 0 && (
              <div className="tt-detail-box">
                <span className="tt-ps-kicker">{selectedProduct.variantLabel}</span>
                <div className="tt-variants-row">
                  {selectedProduct.variants.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`tt-var-pill ${selectedVariant === v ? 'is-on' : ''}`}
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

            {/* Configurador del Taller de Encordado */}
            {selectedProduct.isStringingService && (
              <div className="tt-detail-box">
                <span className="tt-ps-kicker">CONFIGURA TU ENCORDADO</span>
                <div className="tt-str-options">
                  {PROSHOP_EDITABLE_CONFIG.stringingOptions.strings.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`tt-str-pill ${stringId === st.id ? 'is-on' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setStringId(st.id);
                      }}
                    >
                      <span>{st.name}</span>
                      {st.extraSoles !== 0 && (
                        <strong>
                          {st.extraSoles > 0
                            ? `+S/ ${st.extraSoles}`
                            : `-S/ ${Math.abs(st.extraSoles)}`}
                        </strong>
                      )}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span>Tensión deseada</span>
                    <strong style={{ color: '#00DC7D' }}>{tensionLbs} lbs</strong>
                  </div>
                  <input
                    type="range"
                    min={PROSHOP_EDITABLE_CONFIG.stringingOptions.minLbs}
                    max={PROSHOP_EDITABLE_CONFIG.stringingOptions.maxLbs}
                    step="1"
                    value={tensionLbs}
                    style={{ width: '100%', accentColor: '#00DC7D', marginTop: 6 }}
                    onChange={(e) => setTensionLbs(Number(e.target.value))}
                  />
                  <small className="tt-muted" style={{ display: 'block', fontSize: '0.7rem', marginTop: 4 }}>
                    {PROSHOP_EDITABLE_CONFIG.stringingOptions.altitudeTip}
                  </small>
                </div>
              </div>
            )}

            {/* Especificaciones técnicas */}
            {selectedProduct.specs.length > 0 && (
              <div className="tt-detail-box">
                <span className="tt-ps-kicker">ESPECIFICACIONES</span>
                <div className="tt-specs-grid">
                  {selectedProduct.specs.map((sp, i) => (
                    <div key={i} className="tt-spec-row">
                      <span>{sp.label}</span>
                      <strong>{sp.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FLUJO SEGÚN CARRIL */}
            {selectedProduct.channel === 'SPONSOR' ? (
              <div className="tt-sponsor-cta-box">
                {selectedProduct.promoCode && (
                  <div className="tt-promo-code-bar">
                    <div>
                      <small>CÓDIGO DE BENEFICIO EN TIENDA</small>
                      <strong>{selectedProduct.promoCode}</strong>
                    </div>
                    <button
                      type="button"
                      className="tt-ps-copy-btn"
                      onClick={() =>
                        handleCopyText(selectedProduct.promoCode, 'Código', selectedProduct.id)
                      }
                    >
                      {copiedCodeId === selectedProduct.id ? '✓ Copiado' : 'Copiar código'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="tt-btn tt-btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => handleOpenSponsorLink(selectedProduct)}
                >
                  Ir a tienda oficial ({selectedProduct.brand}) ↗
                </button>
              </div>
            ) : (
              <>
                {/* Modalidades para Stock Propio (Pago directo o Canje con Gemas) */}
                {selectedProduct.channel === 'OWN_STOCK' && (
                  <div className="tt-detail-methods">
                    <span className="tt-ps-kicker">
                      FORMA DE ADQUISICIÓN (TU SALDO: {myGems.toLocaleString('es-PE')} 💎)
                    </span>

                    <button
                      type="button"
                      className={`tt-method-tile ${purchaseMethod === 'direct' ? 'is-on' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setPurchaseMethod('direct');
                      }}
                    >
                      <div>
                        <strong>{isVip ? 'Pago Directo · Tarifa Socio VIP' : 'Pago Directo (Yape / Plin)'}</strong>
                        <small>Conservas todas tus Gemas acumuladas</small>
                      </div>
                      <strong className="tt-method-val">S/ {detailPricing.effectiveCash}</strong>
                    </button>

                    {selectedProduct.gemsCost > 0 && (
                      <button
                        type="button"
                        className={`tt-method-tile ${purchaseMethod === 'full_gems' ? 'is-on' : ''} ${
                          !detailPricing.canRedeemGems ? 'is-low' : ''
                        }`}
                        onClick={() => {
                          triggerHaptic('light');
                          setPurchaseMethod('full_gems');
                        }}
                      >
                        <div>
                          <strong>Canjear con Gemas</strong>
                          <small>
                            {detailPricing.canRedeemGems
                              ? '¡Tienes saldo suficiente para canjear ahora!'
                              : `Te faltan ${(selectedProduct.gemsCost - myGems).toLocaleString('es-PE')} 💎`}
                          </small>
                        </div>
                        <strong className="tt-method-val is-emerald">
                          {selectedProduct.gemsCost.toLocaleString('es-PE')} 💎
                        </strong>
                      </button>
                    )}

                    {/* Sede de entrega */}
                    <div className="tt-detail-box" style={{ padding: 11 }}>
                      <label htmlFor="tt-ps-pickup" className="tt-ps-kicker" style={{ marginBottom: 5 }}>
                        SEDE DE ENTREGA O RECOJO
                      </label>
                      <select
                        id="tt-ps-pickup"
                        className="tt-ps-input"
                        value={pickupClubId}
                        onChange={(e) => setPickupClubId(e.target.value)}
                      >
                        {(clubs || INITIAL_CLUBS).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value="coordinar">Coordinar entrega directa</option>
                      </select>
                    </div>

                    {purchaseMethod !== 'full_gems' && (
                      <div className="tt-ps-pay-bar">
                        <div>
                          <small>Yape / Plin ({PROSHOP_EDITABLE_CONFIG.payment.holder})</small>
                          <strong>{PROSHOP_EDITABLE_CONFIG.payment.yapePlin}</strong>
                        </div>
                        <button
                          type="button"
                          className="tt-ps-copy-btn"
                          onClick={() =>
                            handleCopyText(PROSHOP_EDITABLE_CONFIG.payment.yapePlin, 'Yape / Plin')
                          }
                        >
                          Copiar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="tt-btn tt-btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleConfirmOwnOrCoachOrder}
                >
                  <TTIcon name="whatsapp" size={18} />
                  {selectedProduct.channel === 'COACH'
                    ? 'Coordinar con Coach por WhatsApp'
                    : purchaseMethod === 'full_gems'
                    ? 'Confirmar Canje con Gemas'
                    : 'Confirmar Pedido por WhatsApp'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tt-ps-root,
        .tt-ps-stack { display: flex; flex-direction: column; gap: 14px; }
        .tt-ps-enter { animation: ttPsIn 300ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes ttPsIn {
          from { opacity: 0; transform: translateY(9px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tt-ps-kicker {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: var(--tt-emerald-text);
          margin-bottom: 6px;
        }

        .tt-ps-top-row { display: flex; align-items: stretch; gap: 8px; }
        .tt-ps-mode-bar {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 4px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-ps-mode-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc((100% - 8px) / 2);
          border-radius: 12px;
          background: linear-gradient(135deg, #00DC7D 0%, #00B365 100%);
          transition: transform 300ms cubic-bezier(0.22, 1.24, 0.36, 1);
          pointer-events: none;
          z-index: 0;
        }
        .tt-ps-root.is-light .tt-ps-mode-slider { background: #1E0734; }
        .tt-ps-mode-btn {
          position: relative;
          z-index: 1;
          min-height: 39px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.77rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-ps-mode-btn.is-active { color: #10021E; font-weight: 900; }
        .tt-ps-root.is-light .tt-ps-mode-btn.is-active { color: #00DC7D; }

        .tt-ps-admin-btn {
          padding: 0 12px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border-medium);
          color: var(--tt-text);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* BÓVEDA (CERO SOLES) */
        .tt-vault-hero-card {
          border-radius: 22px;
          padding: 16px;
          background: linear-gradient(135deg, #24093F 0%, #130322 100%);
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.34);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-vh-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .tt-vh-kicker { display: block; font-size: 0.6rem; font-weight: 900; letter-spacing: 0.09em; color: #7CF5C0; margin-bottom: 4px; }
        .tt-vh-balance { display: flex; align-items: baseline; gap: 8px; }
        .tt-vh-balance strong { font-family: var(--tt-font-display); font-size: 2.35rem; line-height: 0.95; font-variant-numeric: tabular-nums; }
        .tt-vh-balance span { font-size: 0.72rem; font-weight: 900; letter-spacing: 0.08em; color: #00DC7D; }
        .tt-vh-plan-pill { padding: 5px 10px; border-radius: 999px; background: rgba(250, 249, 245, 0.14); font-size: 0.62rem; font-weight: 900; }
        .tt-vh-plan-pill.is-vip { background: linear-gradient(135deg, #F3DC9B 0%, #C89F45 100%); color: #1A0D00; }
        .tt-vh-cap-box { padding: 10px 12px; border-radius: 14px; background: rgba(250, 249, 245, 0.06); display: flex; flex-direction: column; gap: 6px; }
        .tt-vh-cap-head { display: flex; justify-content: space-between; font-size: 0.72rem; }
        .tt-vh-cap-track { height: 7px; border-radius: 999px; background: rgba(250, 249, 245, 0.14); overflow: hidden; }
        .tt-vh-cap-fill { height: 100%; border-radius: 999px; background: #00DC7D; }
        .tt-vh-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .tt-missions-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
        @media (min-width: 600px) {
          .tt-missions-grid { grid-template-columns: 1fr 1fr; }
        }
        .tt-mission-tile { display: flex; align-items: flex-start; gap: 10px; padding: 11px; border-radius: 15px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-mission-tile strong { display: block; font-size: 0.8rem; }
        .tt-mission-tile small { display: block; font-size: 0.7rem; color: var(--tt-text-muted); margin-top: 2px; }
        .tt-mission-rates { margin-top: 5px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.68rem; font-weight: 800; }
        .tt-mission-rates .is-vip { color: #E5C16C; }
        .tt-ps-root.is-light .tt-mission-rates .is-vip { color: #9A6B16; }

        .tt-ledger-list { display: flex; flex-direction: column; gap: 7px; }
        .tt-ledger-row { display: flex; align-items: center; gap: 10px; padding: 10px 11px; border-radius: 14px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-ledger-dot { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0; }
        .tt-ledger-dot.is-in { background: rgba(0, 220, 125, 0.16); color: #00DC7D; }
        .tt-ledger-dot.is-out { background: rgba(248, 113, 113, 0.16); color: #F87171; }
        .tt-ledger-row strong { display: block; font-size: 0.8rem; }
        .tt-ledger-row small { display: block; font-size: 0.68rem; color: var(--tt-text-muted); }
        .tt-ledger-amt { font-size: 0.82rem; white-space: nowrap; }
        .tt-ledger-amt.is-in { color: var(--tt-emerald-text); }
        .tt-ledger-amt.is-out { color: #F87171; }

        /* PRO SHOP 3 CARRILES */
        .tt-shop-controls { display: flex; flex-direction: column; gap: 9px; }
        .tt-shop-search { display: flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 13px; border-radius: 14px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-shop-search input { width: 100%; border: none; background: transparent; color: var(--tt-text); font-size: 16px; outline: none; }
        .tt-shop-clear { width: 24px; height: 24px; border-radius: 50%; background: var(--tt-surface); color: var(--tt-text-muted); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tt-shop-cats-row { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .tt-shop-cats-row::-webkit-scrollbar { display: none; }
        .tt-shop-cat-pill {
          flex-shrink: 0;
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.74rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .tt-shop-cat-pill.is-active { background: #1E0734; border-color: #00DC7D; color: #00DC7D; }

        .tt-lanes-stack { display: flex; flex-direction: column; gap: 18px; }
        .tt-lane-block { display: flex; flex-direction: column; gap: 10px; }
        .tt-lane-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .tt-lane-head h3 { margin: 0; font-family: var(--tt-font-display); font-size: 1.24rem; line-height: 1.04; }
        .tt-lane-tag {
          padding: 3px 9px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text-muted);
          font-size: 0.64rem;
          font-weight: 800;
        }
        .tt-lane-tag.is-emerald {
          background: rgba(0, 220, 125, 0.14);
          border-color: rgba(0, 220, 125, 0.42);
          color: var(--tt-emerald-text);
        }

        .tt-shop-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        @media (min-width: 700px) {
          .tt-shop-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        .tt-prod-card {
          border-radius: 18px;
          overflow: hidden;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 180ms cubic-bezier(0.22, 1.25, 0.36, 1), border-color 180ms ease;
          animation: ttPsIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--ps-delay, 0ms);
        }
        .tt-prod-card:active { transform: scale(0.97); border-color: #00DC7D; }
        .tt-prod-media {
          position: relative;
          aspect-ratio: 4 / 3;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          overflow: hidden;
        }
        .tt-prod-img { width: 100%; height: 100%; object-fit: contain; }
        .tt-prod-tag {
          position: absolute;
          left: 7px;
          top: 7px;
          padding: 3px 7px;
          border-radius: 7px;
          background: rgba(24, 6, 43, 0.88);
          color: #FAF9F5;
          font-size: 0.54rem;
          font-weight: 900;
          letter-spacing: 0.05em;
        }
        .tt-prod-stock-dot {
          position: absolute;
          right: 7px;
          bottom: 7px;
          padding: 2px 7px;
          border-radius: 999px;
          background: #00DC7D;
          color: #10021E;
          font-size: 0.56rem;
          font-weight: 900;
        }
        .tt-prod-body { padding: 10px; display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .tt-prod-brand { font-size: 0.62rem; font-weight: 800; color: var(--tt-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-prod-name { margin: 0; font-size: 0.8rem; font-weight: 800; line-height: 1.22; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.4em; }
        .tt-prod-price-block { display: flex; flex-direction: column; gap: 3px; margin-top: 2px; }
        .tt-prod-price-row { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
        .tt-prod-strike { font-size: 0.68rem; text-decoration: line-through; color: var(--tt-text-muted); }
        .tt-prod-price { font-family: var(--tt-font-display); font-size: 1.16rem; line-height: 1; color: var(--tt-text); }
        .tt-prod-vip-chip { padding: 2px 6px; border-radius: 6px; background: rgba(229, 193, 108, 0.16); color: #E5C16C; font-size: 0.58rem; font-weight: 900; }
        .tt-ps-root.is-light .tt-prod-vip-chip { color: #8A5D10; }
        .tt-prod-gems-line { font-size: 0.66rem; color: var(--tt-emerald-text); font-weight: 700; }
        .tt-prod-code-hint { font-size: 0.64rem; font-weight: 800; color: var(--tt-text-muted); }
        .tt-prod-foot { margin-top: auto; padding-top: 6px; border-top: 1px solid var(--tt-border); font-size: 0.66rem; font-weight: 800; color: var(--tt-emerald-text); }

        /* SUB-PANTALLA DETALLE DE PRODUCTO */
        .tt-detail-back-btn { padding: 6px 12px; border-radius: 999px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); color: var(--tt-text); font-size: 0.74rem; font-weight: 800; }
        .tt-detail-hero { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 600px) {
          .tt-detail-hero { grid-template-columns: 0.9fr 1.1fr; align-items: center; }
        }
        .tt-detail-media { background: #FFFFFF; border-radius: 18px; padding: 14px; aspect-ratio: 4 / 3; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .tt-detail-img { width: 100%; height: 100%; object-fit: contain; }
        .tt-detail-summary { display: flex; flex-direction: column; gap: 6px; }
        .tt-detail-summary h3 { margin: 0; font-family: var(--tt-font-display); font-size: 1.42rem; line-height: 1.06; }
        .tt-detail-desc { margin: 0; font-size: 0.78rem; line-height: 1.44; color: var(--tt-text-muted); }

        .tt-detail-compare-grid { margin-top: 4px; display: grid; grid-template-columns: repeat(auto-fit, minmax(84px, 1fr)); gap: 7px; text-align: center; }
        .tt-detail-compare-grid > div { padding: 9px 6px; border-radius: 12px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-detail-compare-grid span { display: block; font-size: 0.62rem; color: var(--tt-text-muted); }
        .tt-detail-compare-grid strong { font-size: 0.9rem; font-weight: 900; }
        .tt-detail-compare-grid .is-vip strong { color: #E5C16C; }
        .tt-ps-root.is-light .tt-detail-compare-grid .is-vip strong { color: #8A5D10; }
        .tt-detail-compare-grid .is-gems strong { color: var(--tt-emerald-text); }

        .tt-detail-box { padding: 13px; border-radius: 16px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 8px; }
        .tt-variants-row { display: flex; flex-wrap: wrap; gap: 7px; }
        .tt-var-pill { min-height: 36px; padding: 0 12px; border-radius: 11px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); color: var(--tt-text); font-size: 0.75rem; font-weight: 800; }
        .tt-var-pill.is-on { border-color: #00DC7D; background: rgba(0, 220, 125, 0.14); color: var(--tt-emerald-text); }

        .tt-str-options { display: flex; flex-direction: column; gap: 6px; }
        .tt-str-pill { width: 100%; padding: 9px 11px; border-radius: 12px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); color: var(--tt-text); display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.76rem; font-weight: 700; text-align: left; }
        .tt-str-pill.is-on { border-color: #00DC7D; background: rgba(0, 220, 125, 0.12); }

        .tt-specs-grid { display: grid; grid-template-columns: 1fr; gap: 7px; }
        @media (min-width: 560px) {
          .tt-specs-grid { grid-template-columns: 1fr 1fr; }
        }
        .tt-spec-row { padding: 8px 10px; border-radius: 11px; background: var(--tt-surface); }
        .tt-spec-row span { display: block; font-size: 0.64rem; color: var(--tt-text-muted); }
        .tt-spec-row strong { font-size: 0.77rem; }

        .tt-sponsor-cta-box, .tt-detail-methods { display: flex; flex-direction: column; gap: 9px; }
        .tt-promo-code-bar, .tt-ps-pay-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 13px;
          border-radius: 14px;
          background: #1A0530;
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.38);
        }
        .tt-promo-code-bar small, .tt-ps-pay-bar small { display: block; font-size: 0.6rem; opacity: 0.76; letter-spacing: 0.06em; }
        .tt-promo-code-bar strong, .tt-ps-pay-bar strong { font-size: 0.96rem; color: #00DC7D; letter-spacing: 0.05em; }
        .tt-ps-copy-btn { padding: 6px 12px; border-radius: 999px; background: #00DC7D; color: #10021E; font-size: 0.72rem; font-weight: 900; }

        .tt-method-tile {
          width: 100%;
          padding: 11px 12px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          text-align: left;
        }
        .tt-method-tile.is-on { border-color: #00DC7D; background: rgba(0, 220, 125, 0.12); }
        .tt-method-tile.is-low { opacity: 0.68; }
        .tt-method-tile strong { display: block; font-size: 0.8rem; }
        .tt-method-tile small { display: block; font-size: 0.7rem; color: var(--tt-text-muted); margin-top: 2px; }
        .tt-method-val { font-family: var(--tt-font-display); font-size: 1.15rem; white-space: nowrap; }
        .tt-method-val.is-emerald { color: var(--tt-emerald-text); }

        /* GESTOR ADMIN INTEGRADO */
        .tt-admin-form-card { padding: 14px; border-radius: 18px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); display: flex; flex-direction: column; gap: 10px; }
        .tt-admin-channel-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .tt-adm-ch-btn { min-height: 36px; border-radius: 10px; background: var(--tt-surface); border: 1.5px solid var(--tt-border); color: var(--tt-text-muted); font-size: 0.7rem; font-weight: 800; }
        .tt-adm-ch-btn.is-on { border-color: #00DC7D; background: rgba(0, 220, 125, 0.14); color: var(--tt-emerald-text); }
        .tt-adm-photo-row { display: flex; gap: 10px; align-items: center; }
        .tt-adm-thumb { width: 70px; height: 70px; border-radius: 14px; background: #FFFFFF; padding: 6px; flex-shrink: 0; overflow: hidden; }
        .tt-adm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tt-adm-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tt-ps-input { width: 100%; min-height: 42px; padding: 8px 12px; border-radius: 12px; background: var(--tt-surface); border: 1px solid var(--tt-border-medium); color: var(--tt-text); font-size: 16px; font-family: inherit; }

        .tt-adm-list { display: flex; flex-direction: column; gap: 7px; }
        .tt-adm-row { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 14px; background: var(--tt-surface-2); border: 1px solid var(--tt-border); }
        .tt-adm-row-img { width: 42px; height: 42px; border-radius: 10px; background: #FFFFFF; padding: 4px; flex-shrink: 0; }
        .tt-adm-row strong { display: block; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tt-adm-row small { display: block; font-size: 0.69rem; color: var(--tt-text-muted); }
        .tt-adm-edit-btn { padding: 5px 10px; border-radius: 999px; background: var(--tt-surface); border: 1px solid var(--tt-border); color: var(--tt-text); font-size: 0.7rem; font-weight: 800; }
        .tt-adm-del-btn { width: 28px; height: 28px; border-radius: 50%; background: var(--tt-danger-soft); color: #F87171; font-size: 0.74rem; }

        html[data-tier='lite'] .tt-prod-card { animation: none !important; }
      `}</style>
    </ModalPortal>
  );
}
