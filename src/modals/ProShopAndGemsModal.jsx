import React, { useEffect, useMemo, useState } from 'react';
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
import { buildWhatsAppLink } from '../utils/tenisEngine';

/* ==========================================================================
   ZONA DE EDICIÓN RÁPIDA (CAMBIA PRECIOS, SORTEO, YAPE O PRODUCTOS AQUÍ)
   --------------------------------------------------------------------------
   - Toda la tienda se calcula con la tasa inamovible: 20 Gemas = S/ 1.00.
   - Para subir tus propias fotos de producto sobre fondo blanco, súbelas a
     public/assets/ con el nombre indicado en `image` (ej. proshop-pelotas.png).
   ========================================================================== */
export const PROSHOP_EDITABLE_CONFIG = {
  gemsPerSol: APP_CONFIG.gemsPerSol || 20, // 20 Gemas = S/ 1.00 (1 Gema = S/ 0.05)
  weeklyCapStandard: 25, // Tope semanal jugador Estándar (S/ 1.25/sem)
  weeklyCapVip: 65, // Tope semanal Socio VIP (S/ 3.25/sem)
  vipMonthlyChest: 200, // Cofre mensual incluido en el Pase VIP (S/ 10.00)
  vipMonthlyPrice: 29.9,
  payment: {
    yapePlin: APP_CONFIG.paymentYapePlin || '964 812 340',
    holder: APP_CONFIG.paymentHolder || 'TOTAL TENIS · Pro Shop Oficial',
    bankName: APP_CONFIG.paymentBank || 'BCP Soles',
    bankAccount: APP_CONFIG.paymentBankAccount || '355-98412031-0-42',
  },
  monthlyRaffle: {
    active: true,
    badge: 'SORTEO MENSUAL ACTIVO',
    title: '2 Tarros de Pelotas Pro + 1 Encordado Completo',
    requirement: 'Participan todos los jugadores con 2 o más partidos oficiales jugados este mes.',
    sponsorNote: 'Respaldado por aliados del circuito TOTAL TENIS',
  },
  stringingOptions: {
    strings: [
      { id: 'poly-control', name: 'Poliéster Control 1.25mm (Topspin y durabilidad)', extraSoles: 0 },
      { id: 'multi-comfort', name: 'Multifilamento Confort 1.30mm (Cuida codo/brazo)', extraSoles: 10 },
      { id: 'hybrid-pro', name: 'Híbrido Pro (Poliéster + Multifilamento)', extraSoles: 15 },
      { id: 'own-string', name: 'Solo mano de obra (Llevo mi propia cuerda)', extraSoles: -25 },
    ],
    minLbs: 46,
    maxLbs: 58,
    defaultLbs: 52,
    altitudeTip: 'Recomendación en altura (Huancayo 3,259 m): 50 a 53 lbs para controlar el vuelo sin perder salida de bola.',
  },
};

/* ==========================================================================
   CATÁLOGO OFICIAL PRO SHOP (TABLA PROPORCIONAL EXACTA · 20 GEMAS = S/ 1.00)
   ========================================================================== */
export const DEFAULT_PROSHOP_CATALOG = [
  {
    id: 'ps-encordado',
    category: 'encordado',
    kind: 'service', // 'digital' | 'physical' | 'service'
    isStringingService: true,
    name: 'Encordado Profesional Completo',
    shortTag: 'TALLER OFICIAL',
    brand: 'Taller TOTAL TENIS',
    image: '/assets/proshop-encordado.png',
    fallbackImage: ASSETS.torneoApertura,
    priceRegular: 55,
    priceVip: 45,
    copayCash: 35, // Copago: 400 Gemas + S/ 35.00 (Ahorro S/ 20.00)
    fullGemsVipOnly: true,
    inStock: true,
    deliveryNote: 'Recojo y entrega en cualquiera de las 4 sedes (24h)',
    highlight: 'Más solicitado en altura',
    specs: [
      { label: 'Calibración', value: 'Máquina electrónica tensión constante' },
      { label: 'Cuerda incluida', value: 'Poliéster profesional 1.25mm o elección' },
      { label: 'Tensión ideal', value: '50 – 53 lbs sugeridas para Huancayo' },
      { label: 'Garantía', value: 'Revisión de ojales y nudo profesional' },
    ],
  },
  {
    id: 'ps-pelotas',
    category: 'pelotas',
    kind: 'physical',
    name: 'Tarro 3 Pelotas Presurizadas Pro',
    shortTag: 'ALTA DURABILIDAD',
    brand: 'Head Pro / Wilson US Open',
    image: '/assets/proshop-pelotas.png',
    fallbackImage: '/assets/pelota-3d-volt-azul.png',
    priceRegular: 50,
    priceVip: 42,
    copayCash: 35, // Copago: 300 Gemas + S/ 35.00 (Ahorro S/ 15.00)
    fullGemsVipOnly: true,
    inStock: true,
    deliveryNote: 'Entrega inmediata en sede antes de tu partido',
    highlight: 'Aprobadas para torneos',
    specs: [
      { label: 'Presentación', value: 'Tarro hermético presurizado × 3 unidades' },
      { label: 'Fieltro', value: 'Extra Duty resistente a arcilla abrasiva' },
      { label: 'Superficie', value: 'Polvo de ladrillo y pista rápida' },
      { label: 'Uso', value: 'Partidos oficiales de ranking y torneos' },
    ],
  },
  {
    id: 'ps-overgrip',
    category: 'accesorios',
    kind: 'physical',
    name: 'Overgrip Profesional Pro Overgrip',
    shortTag: 'AGARRE SECO',
    brand: 'Wilson / Head',
    image: '/assets/proshop-overgrip.png',
    fallbackImage: ASSETS.torneoAltura,
    priceRegular: 15,
    priceVip: 12,
    copayCash: 10, // Copago: 100 Gemas + S/ 10.00 (Ahorro S/ 5.00)
    fullGemsVipOnly: true,
    inStock: true,
    deliveryNote: 'Stock disponible en blanco, negro y verde menta',
    highlight: 'Accesible con Gemas',
    specs: [
      { label: 'Espesor', value: '0.55 mm ultra fino de tacto adherente' },
      { label: 'Absorción', value: 'Control de sudor y secado rápido' },
      { label: 'Instalación', value: 'Colocación sin costo en tu sede' },
      { label: 'Origen', value: 'Original sellado de distribuidor' },
    ],
  },
  {
    id: 'ps-antivibrador',
    category: 'accesorios',
    kind: 'physical',
    name: 'Pack Antivibrador + Muñequera Pro',
    shortTag: 'CONFORT DE BRAZO',
    brand: 'TOTAL TENIS Edition',
    image: '/assets/proshop-antivibrador.png',
    fallbackImage: ASSETS.logo,
    priceRegular: 25,
    priceVip: 20,
    copayCash: 15, // Copago: 200 Gemas + S/ 15.00 (Ahorro S/ 10.00)
    fullGemsVipOnly: true,
    inStock: true,
    deliveryNote: 'Disponible en tonos Púrpura Noche y Esmeralda',
    highlight: 'Pack ahorro 2 en 1',
    specs: [
      { label: 'Antivibrador', value: 'Silicona de alta absorción entre cuerdas' },
      { label: 'Muñequera', value: 'Algodón técnico respirable de doble ancho' },
      { label: 'Beneficio', value: 'Reduce vibración en el impacto de voleas' },
      { label: 'Entrega', value: 'En sede o coordinación directa' },
    ],
  },
  {
    id: 'ps-bono-coach',
    category: 'encordado',
    kind: 'service',
    name: 'Bono Clase Privada Coach Pro (60 min)',
    shortTag: 'ENTRENAMIENTO',
    brand: 'Coaches Certificados',
    image: '/assets/portada-tips-semana.jpg',
    fallbackImage: ASSETS.sedeRomina,
    priceRegular: 60,
    priceVip: 52,
    copayCash: 50, // Copago: 200 Gemas + S/ 50.00 (Ahorro S/ 10.00)
    fullGemsVipOnly: true,
    inStock: true,
    deliveryNote: 'Válido con cualquier entrenador oficial del circuito',
    highlight: 'Canjeable en 4 sedes',
    specs: [
      { label: 'Duración', value: '60 minutos en cancha de arcilla' },
      { label: 'Enfoque', value: 'Saque, derecha, revés o táctica de partido' },
      { label: 'Compensación', value: 'El coach recibe su tarifa íntegra' },
      { label: 'Vigencia', value: '30 días desde el canje' },
    ],
  },
  {
    id: 'ps-raquetero',
    category: 'raquetas',
    kind: 'physical',
    name: 'Raquetero Térmico Pro (6 Raquetas)',
    shortTag: 'PROTECCIÓN TÉRMICA',
    brand: 'Babolat / Wilson Tour',
    image: '/assets/proshop-raquetero.png',
    fallbackImage: ASSETS.torneoMasterTop8,
    priceRegular: 240,
    priceVip: 210,
    copayCash: 180, // Copago: 1,200 Gemas + S/ 180.00 (Ahorro S/ 60.00)
    fullGemsVipOnly: true,
    inStock: true,
    deliveryNote: 'Entrega programada en 24–48 horas',
    highlight: 'Compartimento térmico',
    specs: [
      { label: 'Capacidad', value: 'Hasta 6 raquetas + zapatillero ventilado' },
      { label: 'Aislamiento', value: 'Forro térmico que protege la tensión de cuerdas' },
      { label: 'Transporte', value: 'Correas acolchadas tipo mochila ergonómica' },
      { label: 'Garantía', value: '6 meses por cierres y costuras' },
    ],
  },
  {
    id: 'ps-raqueta',
    category: 'raquetas',
    kind: 'physical',
    name: 'Raqueta Grafito Competición (300 g)',
    shortTag: 'GAMA COMPETITIVA',
    brand: 'Curada · Certificada Pro',
    image: '/assets/proshop-raqueta.png',
    fallbackImage: ASSETS.bannerVisionIa,
    priceRegular: 650,
    priceVip: 580,
    copayCash: 500, // Copago: 3,000 Gemas + S/ 500.00 (Ahorro S/ 150.00)
    fullGemsVipOnly: true,
    inStock: true,
    deliveryNote: 'Prueba en cancha disponible antes de cerrar compra',
    highlight: 'Asesoría de grip y balance',
    specs: [
      { label: 'Peso sin cuerda', value: '300 g · Aro 100 sq. in.' },
      { label: 'Patrón', value: '16 × 19 ideal para spin y potencia' },
      { label: 'Material', value: '100 % Grafito trenzado de alto módulo' },
      { label: 'Incluye', value: 'Asesoría de tensión + overgrip instalado' },
    ],
  },
  {
    id: 'ps-escenario-digital',
    category: 'digital',
    kind: 'digital',
    name: 'Escenario Grand Slam para Mi Perfil',
    shortTag: 'ENTREGA INSTANTÁNEA',
    brand: 'Estudio Digital TOTAL TENIS',
    image: '/assets/perfil-bg-arcilla.jpg',
    fallbackImage: ASSETS.torneoApertura,
    priceRegular: 5,
    priceVip: 5,
    copayCash: null, // Canje directo 100% digital abierto a todos
    fullGemsVipOnly: false,
    inStock: true,
    deliveryNote: 'Desbloqueo inmediato en tu Estudio de Perfil',
    highlight: 'Abierto a todos · Sin costo S/',
    specs: [
      { label: 'Escenarios', value: 'Arcilla, Césped, Pista Dura o Night Finals' },
      { label: 'Compatibilidad', value: 'Modo Oscuro y Modo Claro' },
      { label: 'Duración', value: 'Permanente en tu cuenta oficial' },
      { label: 'Acceso', value: 'Disponible para Estándar y Socio VIP' },
    ],
  },
  {
    id: 'ps-distintivo-digital',
    category: 'digital',
    kind: 'digital',
    name: 'Distintivo Oficial 3D junto a tu Nombre',
    shortTag: 'PRESTIGIO DIGITAL',
    brand: 'Estudio Digital TOTAL TENIS',
    image: '/assets/badge-rey-arcilla.png',
    fallbackImage: ASSETS.logo,
    priceRegular: 3,
    priceVip: 3,
    copayCash: null,
    fullGemsVipOnly: false,
    inStock: true,
    deliveryNote: 'Visible en Ranking, Cartelera y Stories 9:16',
    highlight: 'Desde 60 Gemas',
    specs: [
      { label: 'Opciones', value: 'Rey de Arcilla, Invicto, Mata Gigantes y más' },
      { label: 'Visibilidad', value: 'Se luce en tu ficha y en cada partido' },
      { label: 'Duración', value: 'Permanente e intercambiable cuando quieras' },
      { label: 'Acceso', value: 'Disponible para Estándar y Socio VIP' },
    ],
  },
];

const SHOP_CATEGORIES = [
  { id: 'ALL', label: 'Todo' },
  { id: 'accesorios', label: 'Accesorios' },
  { id: 'pelotas', label: 'Pelotas' },
  { id: 'encordado', label: 'Encordado' },
  { id: 'raquetas', label: 'Raquetas' },
  { id: 'digital', label: 'Digital' },
];

/* ==========================================================================
   MISIONES TRANSPARENTES DE EMISIÓN DE GEMAS (SIN PROMESAS INVIABLES)
   ========================================================================== */
const GEM_MISSIONS = [
  {
    id: 'm-streak',
    icon: 'trophy',
    variant: 'gold',
    title: 'Racha de 3+ victorias seguidas',
    standard: '+5 💎',
    vip: '+13 💎 (×2.5)',
    note: 'Ante rivales competitivos dentro de rango',
  },
  {
    id: 'm-giant',
    icon: 'challenge',
    variant: 'emerald',
    title: 'Victoria Mata Gigantes',
    standard: '+10 💎',
    vip: '+25 💎 (×2.5)',
    note: 'Al vencer a un rival de categoría superior',
  },
  {
    id: 'm-weather',
    icon: 'sun',
    variant: 'clay',
    title: 'Reportar clima en cancha',
    standard: '+5 💎',
    vip: '+5 💎',
    note: 'Ayuda a la comunidad antes de salir al club',
  },
  {
    id: 'm-tourney',
    icon: 'crown',
    variant: 'purple',
    title: 'Podio en Torneos Oficiales',
    standard: '+250 a +500 💎',
    vip: '+250 a +500 💎',
    note: 'Financiado al 100 % por la bolsa del torneo',
  },
];

/* ==========================================================================
   MOTOR DE PRECIOS PROPORCIONALES (20 GEMAS = S/ 1.00 SIEMPRE EXACTO)
   ========================================================================== */
function computeProductPricing(item, extraSoles = 0) {
  const rate = PROSHOP_EDITABLE_CONFIG.gemsPerSol;
  const priceRegular = Math.max(1, (Number(item.priceRegular) || 10) + extraSoles);
  const priceVip = Math.max(1, (Number(item.priceVip ?? item.priceRegular) || priceRegular) + extraSoles);
  const fullGemsCost = Math.round(priceRegular * rate);

  const hasCopay = item.copayCash !== null && item.copayCash !== undefined && item.kind !== 'digital';
  const copayCash = hasCopay ? Math.max(0, Number(item.copayCash) + extraSoles) : null;
  const copayDiscountSoles = hasCopay ? Math.max(0, priceRegular - copayCash) : 0;
  const copayGems = hasCopay ? Math.round(copayDiscountSoles * rate) : 0;
  const vipSavePct =
    priceRegular > priceVip ? Math.round(((priceRegular - priceVip) / priceRegular) * 100) : 0;

  return {
    priceRegular,
    priceVip,
    vipSavePct,
    fullGemsCost,
    hasCopay: hasCopay && copayGems > 0,
    copayCash,
    copayDiscountSoles,
    copayGems,
  };
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: ProShopAndGemsModal (BLOQUE 15 DE 26)
   ========================================================================== */
export default function ProShopAndGemsModal({
  isOpen = false,
  initialMode = 'shop', // 'shop' (Tienda Pro Shop) | 'vault' (Bóveda y Bitácora Gemas)
  onClose,
  currentUser = null,
  products = [],
  clubs = INITIAL_CLUBS,
  gemLedger = [],
  theme = 'dark',
  onProShopRedeem,
  onOpenVipCard,
  onOpenAuth,
  onNotify,
}) {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Estado dentro de la Ficha Detallada del Producto
  const [purchaseMethod, setPurchaseMethod] = useState('direct'); // 'direct' | 'copay' | 'full_gems'
  const [stringId, setStringId] = useState(PROSHOP_EDITABLE_CONFIG.stringingOptions.strings[0].id);
  const [tensionLbs, setTensionLbs] = useState(PROSHOP_EDITABLE_CONFIG.stringingOptions.defaultLbs);
  const [pickupClubId, setPickupClubId] = useState(clubs?.[0]?.id || 'club-country');
  const [localLedger, setLocalLedger] = useState([]);

  // Sincronizar destino de entrada cada vez que se abre el modal desde la cabecera
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode === 'vault' ? 'vault' : 'shop');
      setSelectedProduct(null);
    }
  }, [isOpen, initialMode]);

  const isVip = Boolean(currentUser?.isVip);
  const myGems = Number(currentUser?.gems) || 0;
  const myGemsInSoles = (myGems / PROSHOP_EDITABLE_CONFIG.gemsPerSol).toFixed(2);
  const weeklyCap = isVip
    ? PROSHOP_EDITABLE_CONFIG.weeklyCapVip
    : PROSHOP_EDITABLE_CONFIG.weeklyCapStandard;
  const weeklyEarned = Math.min(weeklyCap, Number(currentUser?.weeklyGemsEarned) || (isVip ? 35 : 15));
  const weeklyPct = Math.min(100, Math.round((weeklyEarned / weeklyCap) * 100));

  // Catálogo efectivo (permite inyección desde Admin/storeAndTournamentsData.js o respaldo completo)
  const effectiveCatalog = useMemo(() => {
    if (Array.isArray(products) && products.length > 0) {
      return products.map((p, idx) => ({
        ...DEFAULT_PROSHOP_CATALOG[idx % DEFAULT_PROSHOP_CATALOG.length],
        ...p,
      }));
    }
    return DEFAULT_PROSHOP_CATALOG;
  }, [products]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return effectiveCatalog.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (q) {
        const hay = `${item.name} ${item.brand || ''} ${item.shortTag || ''} ${item.category || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [effectiveCatalog, selectedCategory, searchQuery]);

  // Bitácora Ejecutiva de Gemas (combina historial global + canjes recientes de sesión)
  const effectiveLedger = useMemo(() => {
    const base =
      Array.isArray(gemLedger) && gemLedger.length > 0
        ? gemLedger
        : [
            ...(isVip
              ? [
                  {
                    id: 'lg-vip',
                    type: 'credit',
                    amount: PROSHOP_EDITABLE_CONFIG.vipMonthlyChest,
                    title: 'Cofre Mensual Socio VIP',
                    date: 'Inicio de mes',
                    detail: 'Equivalente a S/ 10.00 en Pro Shop',
                  },
                ]
              : []),
            {
              id: 'lg-1',
              type: 'credit',
              amount: 20,
              title: 'Bono de Bienvenida TOTAL TENIS',
              date: 'Registro oficial',
              detail: 'Activación de cuenta verificada (+18)',
            },
            {
              id: 'lg-2',
              type: 'credit',
              amount: 10,
              title: 'Victoria Mata Gigantes en cancha',
              date: 'Última jornada',
              detail: 'Mérito ante rival de categoría superior',
            },
            {
              id: 'lg-3',
              type: 'credit',
              amount: 5,
              title: 'Reporte climático de sede',
              date: 'Esta semana',
              detail: 'Estado de arcilla verificado para la comunidad',
            },
          ];
    return [...localLedger, ...base];
  }, [gemLedger, localLedger, isVip]);

  // Cálculos dinámicos para el producto abierto en la Ficha Detallada
  const selectedProductCalc = useMemo(() => {
    if (!selectedProduct) return null;
    const chosenString = selectedProduct.isStringingService
      ? PROSHOP_EDITABLE_CONFIG.stringingOptions.strings.find((s) => s.id === stringId) ||
        PROSHOP_EDITABLE_CONFIG.stringingOptions.strings[0]
      : null;
    const extraSoles = chosenString ? chosenString.extraSoles : 0;
    const pricing = computeProductPricing(selectedProduct, extraSoles);
    const canAffordCopay = pricing.hasCopay && myGems >= pricing.copayGems;
    const canAffordFullGems =
      myGems >= pricing.fullGemsCost && (!selectedProduct.fullGemsVipOnly || isVip);

    return {
      chosenString,
      pricing,
      canAffordCopay,
      canAffordFullGems,
    };
  }, [selectedProduct, stringId, myGems, isVip]);

  const openProductDetail = (item) => {
    triggerHaptic('light');
    setSelectedProduct(item);
    setPurchaseMethod(item.kind === 'digital' ? 'full_gems' : 'direct');
    setStringId(PROSHOP_EDITABLE_CONFIG.stringingOptions.strings[0].id);
    setTensionLbs(PROSHOP_EDITABLE_CONFIG.stringingOptions.defaultLbs);
    setPickupClubId(currentUser?.clubId && currentUser.clubId !== 'independiente' ? currentUser.clubId : clubs?.[0]?.id || 'club-country');
  };

  const handleCopyPayment = async (value, label) => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(value);
      if (onNotify) onNotify(`${label} copiado al portapapeles.`, 'success');
    } catch (e) {
      if (onNotify) onNotify(`${label}: ${value}`, 'info');
    }
  };

  const handleConfirmOrder = () => {
    if (!selectedProduct || !selectedProductCalc) return;
    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para realizar pedidos o canjear tus Gemas.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const { pricing, chosenString } = selectedProductCalc;
    let gemsToDeduct = 0;
    let cashToPay = isVip ? pricing.priceVip : pricing.priceRegular;
    let methodLabel = isVip ? 'Pago Directo Socio VIP' : 'Pago Directo Estándar';

    if (purchaseMethod === 'copay') {
      if (!pricing.hasCopay || myGems < pricing.copayGems) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            `Necesitas ${pricing.copayGems.toLocaleString('es-PE')} Gemas para aplicar el copago (tienes ${myGems.toLocaleString('es-PE')}).`,
            'warning'
          );
        }
        return;
      }
      gemsToDeduct = pricing.copayGems;
      cashToPay = pricing.copayCash;
      methodLabel = `Copago Inteligente (${pricing.copayGems} 💎 + S/ ${pricing.copayCash}.00)`;
    } else if (purchaseMethod === 'full_gems') {
      if (selectedProduct.fullGemsVipOnly && !isVip) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify('El canje 100 % con Gemas en artículos físicos es exclusivo de Socios VIP. Puedes usar el Copago con Gemas + Efectivo.', 'info');
        }
        return;
      }
      if (myGems < pricing.fullGemsCost) {
        triggerHaptic('warning');
        if (onNotify) {
          onNotify(
            `Te faltan ${(pricing.fullGemsCost - myGems).toLocaleString('es-PE')} Gemas para este canje completo.`,
            'warning'
          );
        }
        return;
      }
      gemsToDeduct = pricing.fullGemsCost;
      cashToPay = 0;
      methodLabel = `Canje 100 % Gemas (${pricing.fullGemsCost.toLocaleString('es-PE')} 💎)`;
    }

    // Registrar movimiento en Bitácora y descontar Gemas en el estado global
    if (gemsToDeduct > 0) {
      const entry = {
        id: `lg-${Date.now()}`,
        type: 'debit',
        amount: gemsToDeduct,
        title: `Canje Pro Shop: ${selectedProduct.name}`,
        date: 'Ahora mismo',
        detail: cashToPay > 0 ? `Copago + S/ ${cashToPay}.00` : 'Canje 100 % cubierto',
      };
      setLocalLedger((prev) => [entry, ...prev]);

      if (onProShopRedeem) {
        onProShopRedeem({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          gemsSpent: gemsToDeduct,
          cashAmount: cashToPay,
          method: purchaseMethod,
          ledgerEntry: entry,
        });
      }
    }

    // Si es un artículo digital 100% canjeado, confirmar al instante sin WhatsApp
    if (selectedProduct.kind === 'digital') {
      triggerHaptic('success');
      if (onNotify) {
        onNotify(
          `¡${selectedProduct.name} acreditado! Ya puedes equiparlo desde Mi Perfil.`,
          'success'
        );
      }
      setSelectedProduct(null);
      return;
    }

    // Pedido físico o servicio de encordado -> abrir ticket pre-armado en WhatsApp oficial
    const pickupClub = clubs.find((c) => c.id === pickupClubId);
    const waLines = [
      `Hola Pro Shop TOTAL TENIS, quiero confirmar mi pedido:`,
      `• Artículo: ${selectedProduct.name}`,
      chosenString ? `• Cuerda elegida: ${chosenString.name}` : '',
      selectedProduct.isStringingService ? `• Tensión solicitada: ${tensionLbs} lbs` : '',
      `• Modalidad: ${methodLabel}`,
      `• Total a abonar por Yape/Plin: S/ ${cashToPay}.00`,
      `• Punto de entrega/recojo: ${pickupClub ? pickupClub.name : 'Coordinación directa'}`,
      `• Jugador: ${currentUser.name} (${currentUser.isVip ? 'SOCIO VIP' : 'ESTÁNDAR'})`,
    ].filter(Boolean);

    window.open(
      buildWhatsAppLink(APP_CONFIG.supportWhatsApp, waLines.join('\n')),
      '_blank',
      'noopener,noreferrer'
    );

    triggerHaptic('success');
    if (onNotify) {
      onNotify('Pedido generado hacia WhatsApp del Pro Shop. Te confirmaremos stock y entrega enseguida.', 'success');
    }
    setSelectedProduct(null);
  };

  const modalTitle =
    selectedProduct
      ? selectedProduct.name
      : activeMode === 'vault'
      ? 'Bóveda y Bitácora de Gemas'
      : 'Tienda Oficial Pro Shop';

  const modalSubtitle =
    selectedProduct
      ? `${selectedProduct.brand || 'TOTAL TENIS'} · ${selectedProduct.deliveryNote || ''}`
      : activeMode === 'vault'
      ? `Saldo oficial: ${myGems.toLocaleString('es-PE')} Gemas · 20 Gemas = S/ 1.00`
      : 'Equipamiento oficial, encordado en altura y ahorro con Gemas';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={
        <IconBadge
          name={activeMode === 'vault' && !selectedProduct ? 'gem' : 'shop'}
          variant={activeMode === 'vault' && !selectedProduct ? 'purple' : 'emerald'}
          size={38}
        />
      }
      isWide
      isTopLayer
    >
      <div className={`tt-ps-root ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
        {/* ==================================================================
            CONMUTADOR SUPERIOR CLARO (SE OCULTA SI ESTÁS EN FICHA DE PRODUCTO)
            ================================================================== */}
        {!selectedProduct && (
          <div className="tt-ps-mode-bar" role="tablist" aria-label="Tienda o Bóveda de Gemas">
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
              <TTIcon name="shop" size={16} />
              <span>Pro Shop Oficial</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'vault'}
              className={`tt-ps-mode-btn is-vault ${activeMode === 'vault' ? 'is-active' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setActiveMode('vault');
              }}
            >
              <TTIcon name="gem" size={16} />
              <span>Bóveda ({myGems.toLocaleString('es-PE')} 💎)</span>
            </button>
          </div>
        )}

        {/* ==================================================================
            VISTA 1: BÓVEDA Y BITÁCORA EJECUTIVA DE GEMAS (DESTINO SEPARADO)
            ================================================================== */}
        {!selectedProduct && activeMode === 'vault' && (
          <div className="tt-vault-stack">
            {/* Tarjeta Principal de Saldo + Equivalencia Lineal */}
            <div className="tt-vault-hero-card">
              <div className="tt-vh-top">
                <div>
                  <span className="tt-vh-kicker">SALDO DISPONIBLE VERIFICADO</span>
                  <div className="tt-vh-balance">
                    <TTIcon name="gem" size={28} style={{ color: '#00DC7D' }} />
                    <strong>{myGems.toLocaleString('es-PE')}</strong>
                    <span>GEMAS</span>
                  </div>
                </div>
                <div className="tt-vh-soles-pill">
                  <small>EQUIVALENCIA EXACTA</small>
                  <strong>S/ {myGemsInSoles}</strong>
                </div>
              </div>

              <div className="tt-vh-rule-strip">
                <span>Tasa inamovible: <strong>20 Gemas = S/ 1.00</strong></span>
                <span>{isVip ? 'Multiplicador VIP ×2.5 activo' : 'Plan Estándar'}</span>
              </div>

              {/* Barra de Tope Semanal */}
              <div className="tt-vh-cap-box">
                <div className="tt-vh-cap-head">
                  <span>Progreso semanal en cancha</span>
                  <strong>
                    {weeklyEarned} / {weeklyCap} 💎 esta semana
                  </strong>
                </div>
                <div className="tt-vh-cap-track">
                  <div className="tt-vh-cap-fill" style={{ width: `${weeklyPct}%` }} />
                </div>
              </div>

              {/* Acciones rápidas desde la Bóveda */}
              <div className="tt-vh-actions">
                <button
                  type="button"
                  className="tt-btn tt-btn-primary tt-btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveMode('shop');
                  }}
                >
                  Canjear en Pro Shop
                </button>

                {!isVip && onOpenVipCard && (
                  <button
                    type="button"
                    className="tt-btn tt-btn-secondary tt-btn-sm"
                    onClick={() => {
                      triggerHaptic('medium');
                      onClose && onClose();
                      onOpenVipCard();
                    }}
                  >
                    +200 💎/mes con VIP
                  </button>
                )}
              </div>
            </div>

            {/* Cómo ganar Gemas (Tarjetas visuales limpias, cero muros de texto) */}
            <div className="tt-vault-block">
              <span className="tt-ps-kicker">CÓMO SUMAR GEMAS CADA SEMANA</span>
              <div className="tt-missions-grid">
                {GEM_MISSIONS.map((m) => (
                  <div key={m.id} className="tt-mission-tile">
                    <IconBadge name={m.icon} variant={m.variant} size={36} />
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

            {/* Bitácora Ejecutiva de Movimientos */}
            <div className="tt-vault-block">
              <span className="tt-ps-kicker">BITÁCORA DE MOVIMIENTOS</span>
              <div className="tt-ledger-list">
                {effectiveLedger.map((entry) => (
                  <div key={entry.id} className="tt-ledger-row">
                    <div
                      className={`tt-ledger-dot ${entry.type === 'debit' ? 'is-out' : 'is-in'}`}
                    >
                      {entry.type === 'debit' ? '−' : '+'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{entry.title}</strong>
                      <small>
                        {entry.date} · {entry.detail}
                      </small>
                    </div>
                    <strong
                      className={`tt-ledger-amt ${entry.type === 'debit' ? 'is-out' : 'is-in'}`}
                    >
                      {entry.type === 'debit' ? `-${entry.amount}` : `+${entry.amount}`} 💎
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            VISTA 2: TIENDA OFICIAL PRO SHOP (CATÁLOGO ESTILO AMAZON / TENNIS-POINT)
            ================================================================== */}
        {!selectedProduct && activeMode === 'shop' && (
          <div className="tt-shop-stack">
            {/* Banner Sorteo Mensual (Texto completo sin recortes con ...) */}
            {PROSHOP_EDITABLE_CONFIG.monthlyRaffle.active && (
              <div className="tt-raffle-banner">
                <div className="tt-raffle-text">
                  <span className="tt-raffle-kicker">
                    {PROSHOP_EDITABLE_CONFIG.monthlyRaffle.badge}
                  </span>
                  <strong>{PROSHOP_EDITABLE_CONFIG.monthlyRaffle.title}</strong>
                  <p>{PROSHOP_EDITABLE_CONFIG.monthlyRaffle.requirement}</p>
                </div>
                <SmartImage
                  src="/assets/pelota-3d-volt-azul.png"
                  fallbackSrc={ASSETS.logo}
                  alt="Sorteo Mensual"
                  style={{ width: 54, height: 54, objectFit: 'contain', flexShrink: 0 }}
                />
              </div>
            )}

            {/* Buscador Limpio + Píldoras de Categoría sin recortes */}
            <div className="tt-shop-controls">
              <div className="tt-shop-search">
                <TTIcon name="search" size={16} style={{ opacity: 0.65, flexShrink: 0 }} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar pelotas, encordado, grip..."
                  aria-label="Buscar producto en Pro Shop"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Borrar búsqueda"
                    className="tt-shop-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    <TTIcon name="close" size={13} />
                  </button>
                )}
              </div>

              <div className="tt-shop-cats-row">
                {SHOP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`tt-shop-cat-pill ${selectedCategory === cat.id ? 'is-active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedCategory(cat.id);
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grilla Comercial de Productos (Estilo Amazon / Tennis-Point) */}
            {filteredCatalog.length === 0 ? (
              <EmptyStateCard
                theme={theme}
                title="Sin artículos con esa búsqueda"
                description="Prueba con otro término o revisa todas las categorías disponibles del Pro Shop."
                actionLabel="Ver todo el catálogo"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
              />
            ) : (
              <div className="tt-shop-grid">
                {filteredCatalog.map((item) => {
                  const p = computeProductPricing(item);
                  return (
                    <article
                      key={item.id}
                      className="tt-prod-card"
                      onClick={() => openProductDetail(item)}
                    >
                      {/* Escenario limpio de fotografía (listo para PNG/JPG fondo blanco) */}
                      <div className="tt-prod-media">
                        <SmartImage
                          src={item.image}
                          fallbackSrc={item.fallbackImage || ASSETS.logo}
                          alt={item.name}
                          className="tt-prod-img"
                        />
                        {item.shortTag && (
                          <span className="tt-prod-tag">{item.shortTag}</span>
                        )}
                        {p.vipSavePct > 0 && (
                          <span className="tt-prod-save-badge">-{p.vipSavePct}% VIP</span>
                        )}
                      </div>

                      {/* Cuerpo comercial claro y legible */}
                      <div className="tt-prod-body">
                        <span className="tt-prod-brand">{item.brand}</span>
                        <h3 className="tt-prod-name">{item.name}</h3>

                        {/* Bloque de precios: Regular tachado vs VIP geométrico */}
                        {item.kind === 'digital' ? (
                          <div className="tt-prod-price-block">
                            <strong className="tt-prod-gems-only">
                              {p.fullGemsCost.toLocaleString('es-PE')} 💎
                            </strong>
                            <span className="tt-prod-digital-note">Canje digital directo</span>
                          </div>
                        ) : (
                          <div className="tt-prod-price-block">
                            <div className="tt-prod-price-row">
                              {p.priceVip < p.priceRegular && (
                                <span className="tt-prod-regular-strike">
                                  S/ {p.priceRegular.toFixed(2)}
                                </span>
                              )}
                              <strong className="tt-prod-vip-price">
                                S/ {p.priceVip.toFixed(2)}
                              </strong>
                              <span className="tt-prod-vip-label">VIP</span>
                            </div>

                            {p.hasCopay && (
                              <span className="tt-prod-copay-hint">
                                O copago: <strong>{p.copayGems} 💎 + S/ {p.copayCash}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        <div className="tt-prod-foot">
                          <span className="tt-prod-stock">
                            ● {item.inStock ? 'Disponible' : 'Bajo pedido'}
                          </span>
                          <span className="tt-prod-cta-link">Ver detalle ›</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            VISTA 3: FICHA DETALLADA DEL PRODUCTO + TALLER DE ENCORDADO + PAGO
            ================================================================== */}
        {selectedProduct && selectedProductCalc && (
          <div className="tt-detail-stack">
            <button
              type="button"
              className="tt-detail-back-btn"
              onClick={() => {
                triggerHaptic('light');
                setSelectedProduct(null);
              }}
            >
              ‹ Volver al catálogo Pro Shop
            </button>

            {/* Cabecera visual del producto */}
            <div className="tt-detail-hero">
              <div className="tt-detail-media">
                <SmartImage
                  src={selectedProduct.image}
                  fallbackSrc={selectedProduct.fallbackImage || ASSETS.logo}
                  alt={selectedProduct.name}
                  className="tt-detail-img"
                />
              </div>

              <div className="tt-detail-summary">
                <span className="tt-ps-kicker">{selectedProduct.brand}</span>
                <h3>{selectedProduct.name}</h3>
                {selectedProduct.highlight && (
                  <span className="tt-detail-highlight">{selectedProduct.highlight}</span>
                )}

                {/* Tabla comparativa rápida de precios */}
                <div className="tt-detail-compare-grid">
                  <div>
                    <span>Regular</span>
                    <strong>S/ {selectedProductCalc.pricing.priceRegular}.00</strong>
                  </div>
                  <div className="is-vip">
                    <span>Socio VIP</span>
                    <strong>S/ {selectedProductCalc.pricing.priceVip}.00</strong>
                  </div>
                  <div className="is-gems">
                    <span>100 % Gemas</span>
                    <strong>{selectedProductCalc.pricing.fullGemsCost.toLocaleString('es-PE')} 💎</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* CONFIGURADOR EXCLUSIVO DEL TALLER DE ENCORDADO */}
            {selectedProduct.isStringingService && (
              <div className="tt-stringing-box">
                <span className="tt-ps-kicker">CONFIGURA TU ENCORDADO PROFESIONAL</span>

                <div className="tt-str-field">
                  <label>1. Elige tu cuerda</label>
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
                            {st.extraSoles > 0 ? `+S/ ${st.extraSoles}` : `-S/ ${Math.abs(st.extraSoles)}`}
                          </strong>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tt-str-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>2. Tensión deseada (libraje)</label>
                    <strong style={{ color: '#00DC7D', fontSize: '1rem' }}>{tensionLbs} lbs</strong>
                  </div>
                  <input
                    type="range"
                    min={PROSHOP_EDITABLE_CONFIG.stringingOptions.minLbs}
                    max={PROSHOP_EDITABLE_CONFIG.stringingOptions.maxLbs}
                    step="1"
                    value={tensionLbs}
                    onChange={(e) => setTensionLbs(Number(e.target.value))}
                  />
                  <small className="tt-str-tip">
                    {PROSHOP_EDITABLE_CONFIG.stringingOptions.altitudeTip}
                  </small>
                </div>
              </div>
            )}

            {/* Especificaciones Técnicas */}
            {Array.isArray(selectedProduct.specs) && selectedProduct.specs.length > 0 && (
              <div className="tt-detail-specs-card">
                <span className="tt-ps-kicker">ESPECIFICACIONES TÉCNICAS</span>
                <div className="tt-specs-grid">
                  {selectedProduct.specs.map((sp) => (
                    <div key={sp.label} className="tt-spec-row">
                      <span>{sp.label}</span>
                      <strong>{sp.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de 3 Modalidades de Compra / Canje */}
            <div className="tt-detail-methods">
              <span className="tt-ps-kicker">ELIGE CÓMO ADQUIRIRLO (TU SALDO: {myGems.toLocaleString('es-PE')} 💎)</span>

              {selectedProduct.kind !== 'digital' && (
                <button
                  type="button"
                  className={`tt-method-tile ${purchaseMethod === 'direct' ? 'is-on' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setPurchaseMethod('direct');
                  }}
                >
                  <div>
                    <strong>{isVip ? 'Pago Directo (Tarifa Socio VIP)' : 'Pago Directo (Yape / Plin / Banco)'}</strong>
                    <small>Sin gastar tus Gemas acumuladas</small>
                  </div>
                  <strong className="tt-method-val">
                    S/ {isVip ? selectedProductCalc.pricing.priceVip : selectedProductCalc.pricing.priceRegular}.00
                  </strong>
                </button>
              )}

              {selectedProductCalc.pricing.hasCopay && (
                <button
                  type="button"
                  className={`tt-method-tile ${purchaseMethod === 'copay' ? 'is-on' : ''} ${
                    !selectedProductCalc.canAffordCopay ? 'is-low' : ''
                  }`}
                  onClick={() => {
                    triggerHaptic('light');
                    setPurchaseMethod('copay');
                  }}
                >
                  <div>
                    <strong>Copago Inteligente (Ahorras S/ {selectedProductCalc.pricing.copayDiscountSoles}.00)</strong>
                    <small>
                      {selectedProductCalc.canAffordCopay
                        ? 'Tienes Gemas suficientes para activar este descuento real'
                        : `Requiere ${selectedProductCalc.pricing.copayGems} 💎 (te faltan ${
                            selectedProductCalc.pricing.copayGems - myGems
                          } 💎)`}
                    </small>
                  </div>
                  <strong className="tt-method-val is-emerald">
                    {selectedProductCalc.pricing.copayGems} 💎 + S/ {selectedProductCalc.pricing.copayCash}
                  </strong>
                </button>
              )}

              <button
                type="button"
                className={`tt-method-tile ${purchaseMethod === 'full_gems' ? 'is-on' : ''} ${
                  !selectedProductCalc.canAffordFullGems ? 'is-low' : ''
                }`}
                onClick={() => {
                  triggerHaptic('light');
                  setPurchaseMethod('full_gems');
                }}
              >
                <div>
                  <strong>
                    Canje 100 % con Gemas{' '}
                    {selectedProduct.fullGemsVipOnly ? '(Exclusivo Socios VIP)' : '(Abierto a todos)'}
                  </strong>
                  <small>
                    {selectedProduct.fullGemsVipOnly && !isVip
                      ? 'Activa el Pase Socio VIP para desbloquear canjes físicos al 100 %'
                      : myGems >= selectedProductCalc.pricing.fullGemsCost
                      ? '¡Listo para canjear sin abonar efectivo!'
                      : `Te faltan ${(
                          selectedProductCalc.pricing.fullGemsCost - myGems
                        ).toLocaleString('es-PE')} 💎`}
                  </small>
                </div>
                <strong className="tt-method-val is-gold">
                  {selectedProductCalc.pricing.fullGemsCost.toLocaleString('es-PE')} 💎
                </strong>
              </button>
            </div>

            {/* Punto de Entrega en Sede + Medios de Pago (solo para artículos físicos/servicios) */}
            {selectedProduct.kind !== 'digital' && (
              <div className="tt-checkout-meta">
                <div className="tt-str-field">
                  <label htmlFor="tt-ps-club">Sede de entrega o recojo</label>
                  <select
                    id="tt-ps-club"
                    className="tt-ps-select"
                    value={pickupClubId}
                    onChange={(e) => setPickupClubId(e.target.value)}
                  >
                    {(clubs || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="coordinar">Coordinación directa en Huancayo</option>
                  </select>
                </div>

                {purchaseMethod !== 'full_gems' && (
                  <div className="tt-ps-pay-bar">
                    <div>
                      <small>Yape / Plin Oficial ({PROSHOP_EDITABLE_CONFIG.payment.holder})</small>
                      <strong>{PROSHOP_EDITABLE_CONFIG.payment.yapePlin}</strong>
                    </div>
                    <button
                      type="button"
                      className="tt-ps-copy-btn"
                      onClick={() =>
                        handleCopyPayment(PROSHOP_EDITABLE_CONFIG.payment.yapePlin, 'Yape / Plin')
                      }
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Botón Principal de Cierre */}
            <button
              type="button"
              className="tt-btn tt-btn-primary"
              style={{ width: '100%' }}
              onClick={handleConfirmOrder}
            >
              {selectedProduct.kind === 'digital' ? (
                <>Canjear Ahora ({selectedProductCalc.pricing.fullGemsCost} 💎)</>
              ) : (
                <>
                  <TTIcon name="whatsapp" size={18} />
                  {purchaseMethod === 'full_gems'
                    ? 'Confirmar Canje 100 % Gemas por WhatsApp'
                    : 'Confirmar Pedido y Coordinar Entrega'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================
          ESTILOS ENCAPSULADOS (AMAZON / TENNIS-POINT + BÓVEDA EJECUTIVA)
          ==================================================================== */}
      <style>{`
        .tt-ps-root {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-ps-kicker {
          display: block;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
          margin-bottom: 7px;
        }
        .tt-ps-root.is-light .tt-ps-kicker {
          color: #008A4E;
        }

        /* Conmutador Superior Pro Shop | Bóveda */
        .tt-ps-mode-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 5px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-ps-mode-btn {
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
        .tt-ps-mode-btn:active {
          transform: scale(0.97);
        }
        .tt-ps-mode-btn.is-active {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-ps-root.is-dark .tt-ps-mode-btn.is-active {
          background: linear-gradient(135deg, #00DC7D 0%, #00B868 100%);
          color: #120321;
        }

        /* 1. BÓVEDA EJECUTIVA DE GEMAS */
        .tt-vault-stack,
        .tt-shop-stack,
        .tt-detail-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tt-vault-hero-card {
          border-radius: 22px;
          padding: 16px;
          background: linear-gradient(135deg, #270A44 0%, #140324 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.36);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-vh-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-vh-kicker {
          display: block;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #7CF5C0;
          margin-bottom: 4px;
        }
        .tt-vh-balance {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .tt-vh-balance strong {
          font-family: var(--tt-font-display);
          font-size: 2.35rem;
          line-height: 0.95;
          font-variant-numeric: tabular-nums;
        }
        .tt-vh-balance span {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #00DC7D;
        }
        .tt-vh-soles-pill {
          padding: 8px 12px;
          border-radius: 14px;
          background: rgba(250, 249, 245, 0.1);
          border: 1px solid rgba(250, 249, 245, 0.16);
          text-align: right;
        }
        .tt-vh-soles-pill small {
          display: block;
          font-size: 0.56rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          opacity: 0.72;
        }
        .tt-vh-soles-pill strong {
          font-family: var(--tt-font-display);
          font-size: 1.3rem;
          color: #FDE68A;
        }
        .tt-vh-rule-strip {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.74rem;
          color: rgba(250, 249, 245, 0.82);
        }
        .tt-vh-cap-box {
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(250, 249, 245, 0.06);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-vh-cap-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
        }
        .tt-vh-cap-track {
          height: 7px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.14);
          overflow: hidden;
        }
        .tt-vh-cap-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00DC7D 0%, #F59E0B 100%);
        }
        .tt-vh-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tt-missions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media (min-width: 600px) {
          .tt-missions-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-mission-tile {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px;
          border-radius: 15px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-mission-tile strong {
          display: block;
          font-size: 0.8rem;
        }
        .tt-mission-tile small {
          display: block;
          font-size: 0.7rem;
          color: var(--tt-text-muted);
          margin-top: 2px;
        }
        .tt-mission-rates {
          margin-top: 5px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-mission-rates .is-vip {
          color: #F59E0B;
        }

        .tt-ledger-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .tt-ledger-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 11px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-ledger-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          flex-shrink: 0;
        }
        .tt-ledger-dot.is-in {
          background: rgba(0, 220, 125, 0.16);
          color: #00DC7D;
        }
        .tt-ledger-dot.is-out {
          background: rgba(248, 113, 113, 0.16);
          color: #F87171;
        }
        .tt-ledger-row strong {
          display: block;
          font-size: 0.8rem;
        }
        .tt-ledger-row small {
          display: block;
          font-size: 0.68rem;
          color: var(--tt-text-muted);
        }
        .tt-ledger-amt {
          font-size: 0.82rem;
          white-space: nowrap;
        }
        .tt-ledger-amt.is-in {
          color: #00DC7D;
        }
        .tt-ps-root.is-light .tt-ledger-amt.is-in {
          color: #008A4E;
        }
        .tt-ledger-amt.is-out {
          color: #F87171;
        }

        /* 2. PRO SHOP ESTILO AMAZON / TENNIS-POINT */
        .tt-raffle-banner {
          border-radius: 18px;
          padding: 13px 14px;
          background: linear-gradient(135deg, #1AE68A 0%, #7CF5C0 100%);
          color: #120321;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .tt-raffle-kicker {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          background: #1E0734;
          color: #00DC7D;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .tt-raffle-text strong {
          display: block;
          font-size: 0.9rem;
          font-weight: 900;
          line-height: 1.2;
        }
        .tt-raffle-text p {
          margin: 3px 0 0;
          font-size: 0.72rem;
          font-weight: 600;
          opacity: 0.86;
          line-height: 1.32;
        }

        .tt-shop-controls {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .tt-shop-search {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 44px;
          padding: 0 13px;
          border-radius: 14px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-shop-search input {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--tt-text);
          font-size: 0.86rem;
          outline: none;
        }
        .tt-shop-clear {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--tt-surface);
          color: var(--tt-text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-shop-cats-row {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tt-shop-cats-row::-webkit-scrollbar {
          display: none;
        }
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
        .tt-shop-cat-pill.is-active {
          background: #1E0734;
          border-color: #00DC7D;
          color: #00DC7D;
        }

        .tt-shop-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        @media (min-width: 700px) {
          .tt-shop-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .tt-prod-card {
          border-radius: 18px;
          overflow: hidden;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 150ms ease, border-color 180ms ease;
        }
        .tt-prod-card:active {
          transform: scale(0.98);
        }
        .tt-prod-media {
          position: relative;
          aspect-ratio: 4 / 3;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 8px;
        }
        .tt-prod-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .tt-prod-tag {
          position: absolute;
          left: 7px;
          top: 7px;
          padding: 3px 7px;
          border-radius: 7px;
          background: rgba(30, 7, 52, 0.88);
          color: #FAF9F5;
          font-size: 0.56rem;
          font-weight: 900;
          letter-spacing: 0.05em;
        }
        .tt-prod-save-badge {
          position: absolute;
          right: 7px;
          bottom: 7px;
          padding: 3px 7px;
          border-radius: 7px;
          background: #F59E0B;
          color: #1E1102;
          font-size: 0.6rem;
          font-weight: 900;
        }
        .tt-prod-body {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
        }
        .tt-prod-brand {
          font-size: 0.62rem;
          font-weight: 800;
          color: var(--tt-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-prod-name {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 800;
          line-height: 1.22;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.4em;
        }
        .tt-prod-price-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 2px;
        }
        .tt-prod-price-row {
          display: flex;
          align-items: baseline;
          gap: 5px;
          flex-wrap: wrap;
        }
        .tt-prod-regular-strike {
          font-size: 0.68rem;
          text-decoration: line-through;
          color: var(--tt-text-muted);
        }
        .tt-prod-vip-price,
        .tt-prod-gems-only {
          font-family: var(--tt-font-display);
          font-size: 1.15rem;
          line-height: 1;
          color: #00DC7D;
        }
        .tt-ps-root.is-light .tt-prod-vip-price,
        .tt-ps-root.is-light .tt-prod-gems-only {
          color: #1E0734;
        }
        .tt-prod-vip-label {
          padding: 1px 5px;
          border-radius: 5px;
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
          font-size: 0.56rem;
          font-weight: 900;
        }
        .tt-prod-copay-hint,
        .tt-prod-digital-note {
          font-size: 0.66rem;
          color: var(--tt-text-muted);
        }
        .tt-prod-foot {
          margin-top: auto;
          padding-top: 6px;
          border-top: 1px solid var(--tt-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.65rem;
        }
        .tt-prod-stock {
          color: #00DC7D;
          font-weight: 800;
        }
        .tt-ps-root.is-light .tt-prod-stock {
          color: #008A4E;
        }
        .tt-prod-cta-link {
          font-weight: 800;
          color: var(--tt-text);
        }

        /* 3. FICHA DETALLADA DEL PRODUCTO */
        .tt-detail-back-btn {
          align-self: flex-start;
          padding: 6px 12px;
          border-radius: 999px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.75rem;
          font-weight: 800;
        }
        .tt-detail-hero {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 600px) {
          .tt-detail-hero {
            grid-template-columns: 0.9fr 1.1fr;
            align-items: center;
          }
        }
        .tt-detail-media {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 14px;
          aspect-ratio: 4 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .tt-detail-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .tt-detail-summary {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-detail-summary h3 {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.38rem;
          line-height: 1.06;
        }
        .tt-detail-highlight {
          align-self: flex-start;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(0, 220, 125, 0.14);
          color: #00DC7D;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .tt-ps-root.is-light .tt-detail-highlight {
          background: #1E0734;
          color: #00DC7D;
        }
        .tt-detail-compare-grid {
          margin-top: 4px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          text-align: center;
        }
        .tt-detail-compare-grid > div {
          padding: 9px 6px;
          border-radius: 12px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-detail-compare-grid span {
          display: block;
          font-size: 0.62rem;
          color: var(--tt-text-muted);
        }
        .tt-detail-compare-grid strong {
          font-size: 0.86rem;
          font-weight: 900;
        }
        .tt-detail-compare-grid .is-vip strong {
          color: #F59E0B;
        }
        .tt-detail-compare-grid .is-gems strong {
          color: #00DC7D;
        }
        .tt-ps-root.is-light .tt-detail-compare-grid .is-gems strong {
          color: #008A4E;
        }

        /* Taller de Encordado */
        .tt-stringing-box {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid rgba(0, 220, 125, 0.35);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-str-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-str-field label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--tt-text-muted);
        }
        .tt-str-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-str-pill {
          width: 100%;
          padding: 9px 11px;
          border-radius: 12px;
          background: var(--tt-surface);
          border: 1.5px solid var(--tt-border);
          color: var(--tt-text);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          font-weight: 700;
          text-align: left;
        }
        .tt-str-pill.is-on {
          border-color: #00DC7D;
          background: rgba(0, 220, 125, 0.12);
        }
        .tt-str-tip {
          font-size: 0.71rem;
          color: var(--tt-text-muted);
          line-height: 1.38;
        }

        .tt-detail-specs-card {
          padding: 13px;
          border-radius: 16px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
        }
        .tt-specs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 7px;
        }
        @media (min-width: 560px) {
          .tt-specs-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .tt-spec-row {
          padding: 8px 10px;
          border-radius: 11px;
          background: var(--tt-surface);
        }
        .tt-spec-row span {
          display: block;
          font-size: 0.64rem;
          color: var(--tt-text-muted);
        }
        .tt-spec-row strong {
          font-size: 0.77rem;
        }

        .tt-detail-methods {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
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
        .tt-method-tile.is-on {
          border-color: #00DC7D;
          background: rgba(0, 220, 125, 0.12);
        }
        .tt-method-tile.is-low {
          opacity: 0.72;
        }
        .tt-method-tile strong {
          display: block;
          font-size: 0.8rem;
        }
        .tt-method-tile small {
          display: block;
          font-size: 0.7rem;
          color: var(--tt-text-muted);
          margin-top: 2px;
        }
        .tt-method-val {
          font-family: var(--tt-font-display);
          font-size: 1.05rem;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .tt-method-val.is-emerald {
          color: #00DC7D;
        }
        .tt-ps-root.is-light .tt-method-val.is-emerald {
          color: #008A4E;
        }
        .tt-method-val.is-gold {
          color: #F59E0B;
        }

        .tt-checkout-meta {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-ps-select {
          min-height: 44px;
          padding: 0 12px;
          border-radius: 13px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          color: var(--tt-text);
          font-size: 0.85rem;
          font-weight: 700;
        }
        .tt-ps-pay-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 13px;
          background: #1B0630;
          color: #FAF9F5;
          border: 1px solid rgba(0, 220, 125, 0.35);
        }
        .tt-ps-pay-bar small {
          display: block;
          font-size: 0.65rem;
          opacity: 0.76;
        }
        .tt-ps-pay-bar strong {
          font-size: 0.92rem;
          color: #00DC7D;
        }
        .tt-ps-copy-btn {
          padding: 6px 12px;
          border-radius: 999px;
          background: #00DC7D;
          color: #120321;
          font-size: 0.72rem;
          font-weight: 900;
        }
      `}</style>
    </ModalPortal>
  );
}
