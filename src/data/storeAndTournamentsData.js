import { ASSETS } from '../components/AppIcons';
import { APP_CONFIG, CATEGORIES_SCALE, isBetaCleanActive } from './playersAndClubsData';

/* ==========================================================================
   1. MOTOR MATEMÁTICO DE PRECIOS PRO SHOP (CONSTANTE: 20 GEMAS = S/ 1.00)
   Garantiza proporcionalidad exacta y cero pérdida en cualquier producto.
   ========================================================================== */
export function calculateProShopPricing(product) {
  const regular = Number(product.priceRegular) || 0;
  const vip = Number(product.priceVip ?? regular);
  const fullGemsVip = Math.round(regular * APP_CONFIG.gemsPerSol);

  let copay = null;
  if (product.copayCashPen !== null && product.copayCashPen !== undefined) {
    const cash = Number(product.copayCashPen);
    const discountPen = Math.max(0, Number((regular - cash).toFixed(2)));
    const gemsRequired = Math.round(discountPen * APP_CONFIG.gemsPerSol);
    copay = {
      gems: gemsRequired,
      cashPen: cash,
      discountPen,
      label: `${gemsRequired.toLocaleString('es-PE')} Gemas + S/ ${cash.toFixed(2)}`,
    };
  }

  return {
    regularPen: regular,
    vipPen: vip,
    fullGemsVip,
    copay,
  };
}

export const PROSHOP_CATEGORIES = [
  { id: 'ALL', label: 'Todo' },
  { id: 'EQUIPAMIENTO', label: 'Equipamiento' },
  { id: 'ESCENARIOS', label: 'Escenarios' },
  { id: 'INSIGNIAS', label: 'Insignias' },
  { id: 'SERVICIOS', label: 'Canchas & Coach' },
];

/* ==========================================================================
   2. CATÁLOGO OFICIAL PRO SHOP ESTILO AMAZON (FOTOS LIMPIAS + FICHAS TÉCNICAS)
   ========================================================================== */
export const PROSHOP_PRODUCTS = [
  // --- EQUIPAMIENTO FÍSICO (VITRINA ESTUDIO FONDO BLANCO #FFFFFF) ---
  {
    id: 'prod-overgrip',
    category: 'EQUIPAMIENTO',
    type: 'physical',
    studioWhiteBg: true,
    name: 'Pack Overgrips Pro Alta Absorción (x3)',
    shortDesc: 'Agarre seco y antideslizante ideal para arcilla y altura.',
    image: ASSETS.proshopOvergrip,
    fallbackImage: ASSETS.proshopRollo,
    priceRegular: 15.0,
    priceVip: 12.0,
    copayCashPen: 10.0, // 100 Gemas + S/ 10.00 (Ahorro S/ 5.00) | 100% VIP: 300 Gemas
    stock: 28,
    deliveryNote: 'Entrega directa en tu club sede o coordinación por WhatsApp.',
    specs: [
      { label: 'Contenido', value: 'Blíster x 3 unidades (Blanco / Negro / Neón)' },
      { label: 'Espesor', value: '0.60 mm · Tacto adherente de larga duración' },
      { label: 'Recomendado', value: 'Partidos intensos en clima seco o húmedo' },
      { label: 'Garantía', value: 'Producto sellado de fábrica' },
    ],
  },
  {
    id: 'prod-antivibrador',
    category: 'EQUIPAMIENTO',
    type: 'physical',
    studioWhiteBg: true,
    name: 'Kit Antivibrador + Muñequera Deportiva Pro',
    shortDesc: 'Reduce vibración de impacto y mejora el confort del antebrazo.',
    image: ASSETS.proshopAntivibrador,
    fallbackImage: ASSETS.pelotaClasica,
    priceRegular: 25.0,
    priceVip: 20.0,
    copayCashPen: 15.0, // 200 Gemas + S/ 15.00 (Ahorro S/ 10.00) | 100% VIP: 500 Gemas
    stock: 19,
    deliveryNote: 'Disponible para recojo inmediato en las 4 sedes aliadas.',
    specs: [
      { label: 'Incluye', value: '1 Antivibrador de silicona + 1 Muñequera doble algodón' },
      { label: 'Protección', value: 'Amortiguación en cuerdas poliéster de alta tensión' },
      { label: 'Talla', value: 'Estándar elástica respirable' },
      { label: 'Cuidado', value: 'Lavable a mano · Secado rápido' },
    ],
  },
  {
    id: 'prod-pelotas',
    category: 'EQUIPAMIENTO',
    type: 'physical',
    studioWhiteBg: true,
    name: 'Tarro 3 Pelotas Presurizadas de Competición',
    shortDesc: 'Fieltro reforzado de bote uniforme calibrado para arcilla.',
    image: ASSETS.proshopPelotas,
    fallbackImage: ASSETS.pelotaVolt,
    priceRegular: 50.0,
    priceVip: 42.0,
    copayCashPen: 35.0, // 300 Gemas + S/ 35.00 (Ahorro S/ 15.00) | 100% VIP: 1,000 Gemas
    stock: 34,
    featuredTag: 'Más pedido',
    deliveryNote: 'Entrega en club antes de tu partido oficial.',
    specs: [
      { label: 'Formato', value: 'Lata presurizada hermética x 3 pelotas' },
      { label: 'Superficie', value: 'Arcilla (Polvo de Ladrillo) y Pista Dura' },
      { label: 'Presión', value: 'Control de bote optimizado para altura' },
      { label: 'Uso oficial', value: 'Aprobadas para retos y torneos TOTAL TENIS' },
    ],
  },
  {
    id: 'prod-encordado',
    category: 'EQUIPAMIENTO',
    type: 'physical',
    studioWhiteBg: true,
    name: 'Encordado Profesional Completo (Cuerda + Instalación)',
    shortDesc: 'Monofilamento poliéster de control + calibración de tensión exacta.',
    image: ASSETS.proshopCuerda,
    fallbackImage: ASSETS.proshopRollo,
    priceRegular: 55.0,
    priceVip: 45.0,
    copayCashPen: 35.0, // 400 Gemas + S/ 35.00 (Ahorro S/ 20.00) | 100% VIP: 1,100 Gemas
    stock: 20,
    featuredTag: 'Top Ventas',
    deliveryNote: 'Recojo y entrega en 24 horas en cualquiera de las sedes.',
    specs: [
      { label: 'Calibre', value: '1.25 mm (16L) · Poliéster copolímero de alto spin' },
      { label: 'Tensión recomendada', value: '50 a 54 lbs (calibración especial en altura)' },
      { label: 'Incluye', value: '12 metros de cuerda + mano de obra electrónica' },
      { label: 'Garantía', value: 'Verificación de nudos y tensión al entregar' },
    ],
  },
  {
    id: 'prod-raquetero',
    category: 'EQUIPAMIENTO',
    type: 'physical',
    studioWhiteBg: true,
    name: 'Raquetero Térmico Pro (Capacidad 6 Raquetas)',
    shortDesc: 'Doble compartimento isotérmico, bolsillo para zapatillas y correas acolchadas.',
    image: ASSETS.proshopRaquetero,
    fallbackImage: ASSETS.raquetaPro,
    priceRegular: 240.0,
    priceVip: 210.0,
    copayCashPen: 180.0, // 1,200 Gemas + S/ 180.00 (Ahorro S/ 60.00) | 100% VIP: 4,800 Gemas
    stock: 6,
    deliveryNote: 'Entrega coordinada en 24-48h · Pago Yape / Plin.',
    specs: [
      { label: 'Capacidad', value: 'Hasta 6 raquetas + indumentaria completa' },
      { label: 'Protección térmica', value: 'Forro térmico que protege la tensión de las cuerdas' },
      { label: 'Compartimentos', value: 'Zapatero ventilado + bolsillo lateral para accesorios' },
      { label: 'Transporte', value: 'Modo mochila ergonómica o asa de mano' },
    ],
  },
  {
    id: 'prod-raqueta',
    category: 'EQUIPAMIENTO',
    type: 'physical',
    studioWhiteBg: true,
    name: 'Raqueta Grafito Competición 300g (Sin Encordar)',
    shortDesc: 'Marco 100 % grafito de alto módulo, aro 100 sq. in. y patrón 16x19.',
    image: ASSETS.proshopRaqueta,
    fallbackImage: ASSETS.raquetaPro,
    priceRegular: 650.0,
    priceVip: 580.0,
    copayCashPen: 500.0, // 3,000 Gemas + S/ 500.00 (Ahorro S/ 150.00) | 100% VIP: 13,000 Gemas
    stock: 3,
    featuredTag: 'Edición Pro',
    deliveryNote: 'Incluye asesoría de grip y tensión ideal antes de entrega.',
    specs: [
      { label: 'Peso', value: '300 g (equilibrio 320 mm · manejabilidad total)' },
      { label: 'Tamaño de aro', value: '100 sq. in. · Amplio punto dulce' },
      { label: 'Patrón de encordado', value: '16 x 19 optimizado para efecto topspin' },
      { label: 'Garantía', value: 'Garantía oficial contra defectos de marco' },
    ],
  },

  // --- SERVICIO COACH INTEGRADO (COPAGO CON GEMAS) ---
  {
    id: 'prod-bono-coach',
    category: 'SERVICIOS',
    type: 'service',
    studioWhiteBg: false,
    name: 'Bono Clase Privada Coach Pro (60 min)',
    shortDesc: 'Válido con cualquier entrenador certificado del directorio Sedes & Coach.',
    image: ASSETS.portadaTipsSemana,
    fallbackImage: ASSETS.escudoCoach,
    priceRegular: 60.0,
    priceVip: 52.0,
    copayCashPen: 50.0, // 200 Gemas + S/ 50.00 (Ahorro S/ 10.00) | 100% VIP: 1,200 Gemas
    stock: 50,
    deliveryNote: 'El Coach recibe el 100 % de su tarifa; tus Gemas se compensan internamente.',
    specs: [
      { label: 'Duración', value: '60 minutos en cancha de arcilla' },
      { label: 'Sedes válidas', value: 'Country Club, Romina Cutipa, Tauro y Los Inkas' },
      { label: 'Nivel', value: 'Desde 5ª P hasta 2ª Libre' },
      { label: 'Vigencia', value: '30 días desde la fecha de canje' },
    ],
  },

  // --- ESCENARIOS GRAND SLAM PARA PERFIL (EXACTAMENTE S/ 5.00 = 100 GEMAS) ---
  {
    id: 'scene-arcilla',
    category: 'ESCENARIOS',
    type: 'digital_scene',
    sceneKey: 'arcilla',
    studioWhiteBg: false,
    name: 'Escenario Polvo de Ladrillo (Arcilla Clásica)',
    shortDesc: 'Textura limpia de tierra batida con líneas blancas para tu portada de perfil.',
    image: ASSETS.bgArcilla,
    priceRegular: 5.0,
    priceVip: 5.0,
    copayCashPen: null, // Canje directo 100 Gemas (5 x 20)
    stock: 999,
    specs: [
      { label: 'Tipo', value: 'Escenario digital permanente para Mi Perfil y Stories' },
      { label: 'Superficie', value: 'Arcilla roja de alta nitidez (sin distractores)' },
      { label: 'Activación', value: 'Instantánea al confirmar canje' },
    ],
  },
  {
    id: 'scene-cesped',
    category: 'ESCENARIOS',
    type: 'digital_scene',
    sceneKey: 'cesped',
    studioWhiteBg: false,
    name: 'Escenario Césped Clásico (Hierba Natural)',
    shortDesc: 'Cancha de césped verde natural cortado a franjas de campeonato.',
    image: ASSETS.bgCesped, // Corregido: césped real (nunca foto de gimnasio)
    priceRegular: 5.0,
    priceVip: 5.0,
    copayCashPen: null, // Corregido: 100 Gemas exactas (5 x 20)
    stock: 999,
    specs: [
      { label: 'Tipo', value: 'Escenario digital permanente para Mi Perfil y Stories' },
      { label: 'Superficie', value: 'Césped clásico verde natural de alta definición' },
      { label: 'Activación', value: 'Instantánea al confirmar canje' },
    ],
  },
  {
    id: 'scene-dura',
    category: 'ESCENARIOS',
    type: 'digital_scene',
    sceneKey: 'dura',
    studioWhiteBg: false,
    name: 'Escenario Pista Dura Azul (Hard Court)',
    shortDesc: 'Pista rápida azul oceánico y verde exterior con líneas nítidas.',
    image: ASSETS.bgDura,
    priceRegular: 5.0,
    priceVip: 5.0,
    copayCashPen: null, // 100 Gemas exactas
    stock: 999,
    specs: [
      { label: 'Tipo', value: 'Escenario digital permanente para Mi Perfil y Stories' },
      { label: 'Superficie', value: 'Pista dura acrílica profesional' },
      { label: 'Activación', value: 'Instantánea al confirmar canje' },
    ],
  },
  {
    id: 'scene-finals',
    category: 'ESCENARIOS',
    type: 'digital_scene',
    sceneKey: 'finals',
    studioWhiteBg: false,
    name: 'Escenario Estadio Nocturno Finals',
    shortDesc: 'Estadio cubierto en Púrpura Noche con haces de luz Verde Esmeralda.',
    image: ASSETS.bgFinals,
    priceRegular: 5.0,
    priceVip: 5.0,
    copayCashPen: null, // 100 Gemas exactas
    stock: 999,
    featuredTag: 'Exclusivo',
    specs: [
      { label: 'Tipo', value: 'Escenario digital nocturno para Mi Perfil y Stories' },
      { label: 'Iluminación', value: 'Reflectores esmeralda sobre arena cubierta' },
      { label: 'Activación', value: 'Instantánea al confirmar canje' },
    ],
  },
  {
    id: 'scene-purpura',
    category: 'ESCENARIOS',
    type: 'digital_scene',
    sceneKey: 'purpura',
    studioWhiteBg: false,
    name: 'Escenario Púrpura Noche Arena',
    shortDesc: 'Estética oficial TOTAL TENIS con gradería iluminada nocturna.',
    image: ASSETS.bgPurpuraOscuro,
    priceRegular: 5.0,
    priceVip: 5.0,
    copayCashPen: null, // 100 Gemas exactas
    stock: 999,
    specs: [
      { label: 'Tipo', value: 'Escenario digital oficial TOTAL TENIS' },
      { label: 'Estilo', value: 'Púrpura Noche y reflejos esmeralda' },
      { label: 'Activación', value: 'Instantánea al confirmar canje' },
    ],
  },

  // --- INSIGNIAS DIGITALES DE PERFIL (EXACTAMENTE S/ 3.00 = 60 GEMAS) ---
  {
    id: 'badge-rey-arcilla',
    category: 'INSIGNIAS',
    type: 'digital_badge',
    badgeKey: 'badge-rey-arcilla',
    studioWhiteBg: false,
    name: 'Distintivo "Rey de la Arcilla"',
    shortDesc: 'Escudo dorado y terracota con raquetas cruzadas para tu perfil.',
    image: ASSETS.badgeReyArcilla,
    priceRegular: 3.0,
    priceVip: 3.0,
    copayCashPen: null, // 60 Gemas (3 x 20)
    stock: 999,
    specs: [{ label: 'Ubicación', value: 'Visible en tu ficha de perfil y tarjetas de Stories' }],
  },
  {
    id: 'badge-invicto',
    category: 'INSIGNIAS',
    type: 'digital_badge',
    badgeKey: 'badge-invicto',
    studioWhiteBg: false,
    name: 'Distintivo "Racha Imparable"',
    shortDesc: 'Medallón hexagonal esmeralda de llama competitiva.',
    image: ASSETS.badgeInvicto,
    priceRegular: 3.0,
    priceVip: 3.0,
    copayCashPen: null, // 60 Gemas
    stock: 999,
    specs: [{ label: 'Ubicación', value: 'Visible en tu ficha de perfil y tarjetas de Stories' }],
  },
  {
    id: 'badge-mata-gigantes',
    category: 'INSIGNIAS',
    type: 'digital_badge',
    badgeKey: 'badge-mata-gigantes',
    studioWhiteBg: false,
    name: 'Distintivo "Matagigantes"',
    shortDesc: 'Escudo blindado por derrotar rivales de categoría superior.',
    image: ASSETS.badgeMataGigantes,
    priceRegular: 3.0,
    priceVip: 3.0,
    copayCashPen: null, // 60 Gemas
    stock: 999,
    specs: [{ label: 'Ubicación', value: 'Visible en tu ficha de perfil y tarjetas de Stories' }],
  },
  {
    id: 'badge-saque-canon',
    category: 'INSIGNIAS',
    type: 'digital_badge',
    badgeKey: 'badge-saque-canon',
    studioWhiteBg: false,
    name: 'Distintivo "Saque Cañón"',
    shortDesc: 'Emblema esmeralda de servicio veloz y aces.',
    image: ASSETS.badgeSaqueCanon,
    priceRegular: 3.0,
    priceVip: 3.0,
    copayCashPen: null, // 60 Gemas
    stock: 999,
    specs: [{ label: 'Ubicación', value: 'Visible en tu ficha de perfil y tarjetas de Stories' }],
  },
  {
    id: 'badge-veterano-oro',
    category: 'INSIGNIAS',
    type: 'digital_badge',
    badgeKey: 'badge-veterano-oro',
    studioWhiteBg: false,
    name: 'Distintivo "Honor Senior +40"',
    shortDesc: 'Laurel dorado clásico para referentes de trayectoria.',
    image: ASSETS.badgeVeteranoOro,
    priceRegular: 3.0,
    priceVip: 3.0,
    copayCashPen: null, // 60 Gemas
    stock: 999,
    specs: [{ label: 'Ubicación', value: 'Visible en tu ficha de perfil y tarjetas de Stories' }],
  },
];

// Premio del sorteo mensual sin cortes de texto
export const MONTHLY_RAFFLE = {
  title: 'Sorteo Mensual Oficial TOTAL TENIS',
  prizeFullText: '2 Tarros de Pelotas Presurizadas + 1 Encordado Profesional Completo',
  drawDateLabel: 'Último sábado de cada mes · 08:00 p. m.',
  ticketNote: 'Participas automáticamente jugando al menos 2 retos oficiales en el mes (Socios VIP obtienen doble opción).',
};

/* ==========================================================================
   3. OBJETIVOS DEPORTIVOS Y TRIVIA DE LA BÓVEDA DE GEMAS (ESTILO PASS EJECUTIVO)
   Cero estética de cofre barato · Tope Estándar 25/sem · VIP x2.5 (65/sem)
   ========================================================================== */
export const GEMS_MISSIONS = [
  {
    id: 'mis-racha',
    title: 'Racha de 3 victorias consecutivas',
    subtitle: 'Completa 3 partidos oficiales ganados seguidos en cancha',
    baseGems: 5,
    vipGems: 13,
    progressTarget: 3,
    metricKey: 'streak',
  },
  {
    id: 'mis-matagigantes',
    title: 'Victoria ante rival de categoría superior',
    subtitle: 'Derrota en partido oficial a un oponente con mayor puntaje de división',
    baseGems: 10,
    vipGems: 25,
    progressTarget: 1,
    metricKey: 'upset',
  },
  {
    id: 'mis-trivia',
    title: 'Trivia semanal de reglamento y táctica',
    subtitle: 'Responde correctamente la pregunta técnica de esta semana',
    baseGems: 5,
    vipGems: 12,
    progressTarget: 1,
    metricKey: 'trivia',
  },
  {
    id: 'mis-clima',
    title: 'Reporte de estado real de cancha',
    subtitle: 'Actualiza si tu club está seco o con lluvia para ayudar a la comunidad',
    baseGems: 5,
    vipGems: 12,
    progressTarget: 1,
    metricKey: 'weather',
  },
];

export const WEEKLY_TRIVIA_BANK = [
  {
    id: 'triv-1',
    question: 'En un Tie-Break de set (6-6), ¿cuántos puntos mínimos y qué diferencia se necesitan para cerrarlo?',
    options: [
      '7 puntos con diferencia mínima de 2',
      '6 puntos sin importar la diferencia',
      '10 puntos con diferencia de 1',
    ],
    correctIndex: 0,
    explanation: 'Todo Tie-Break de set exige llegar al menos a 7 puntos con ventaja mínima de 2 (ej. 7-5, 8-6, 10-8).',
  },
  {
    id: 'triv-2',
    question: 'En TOTAL TENIS, si un partido se empata 1-1 en sets, ¿cómo se define el 3er set oficial?',
    options: [
      'Set completo a 6 games',
      'Super Tie-Break a 10 puntos (diferencia mínima de 2)',
      'Muerte súbita a 5 puntos',
    ],
    correctIndex: 1,
    explanation: 'El 3er set se juega como Super Tie-Break a 10 puntos con diferencia mínima de 2 para cuidar tiempos de cancha.',
  },
  {
    id: 'triv-3',
    question: '¿Cuál es el mínimo de partidos oficiales en la temporada para acceder al premio físico del #1?',
    options: ['2 partidos', '5 partidos contra rivales distintos', '15 partidos'],
    correctIndex: 1,
    explanation: 'Se exige un mínimo reglamentario de 5 partidos oficiales para garantizar mérito real en cancha.',
  },
];

/* ==========================================================================
   4. SEPARACIÓN FINANCIERA ESTRICTA: PREMIOS TRIMESTRALES vs. MASTER TOP 8 ANUAL
   ========================================================================== */
export const SEASON_QUARTERLY_REWARDS = {
  badge: 'CIERRE DE TEMPORADA TRIMESTRAL (4 VECES AL AÑO)',
  title: 'Premios Oficiales al Top 3 de Cada Temporada',
  sustainabilityRule:
    'Premiación sostenible por categoría cada 3 meses (Ene-Mar, Abr-Jun, Jul-Sep, Oct-Dic). Requisito: mínimo 5 partidos oficiales jugados en la temporada.',
  podium: [
    {
      place: 1,
      label: 'Campeón de Categoría (#1)',
      accent: 'gold',
      physicalItems: ['Trofeo de Honor Oficial', '1 Tarro de Pelotas Presurizadas'],
      digitalPerk: 'Insignia "Campeón Vigente" durante la siguiente temporada',
      gemsRangeLabel: '120 a 420 Gemas (según categoría)',
    },
    {
      place: 2,
      label: 'Subcampeón de Temporada (#2)',
      accent: 'silver',
      physicalItems: ['Medalla / Trofeo de Honor'],
      digitalPerk: 'Distintivo Podio de Temporada',
      gemsRangeLabel: '70 a 250 Gemas (según categoría)',
    },
    {
      place: 3,
      label: 'Tercer Puesto de Temporada (#3)',
      accent: 'bronze',
      physicalItems: ['Medalla de Honor'],
      digitalPerk: 'Reconocimiento en Cuadro Oficial',
      gemsRangeLabel: '40 a 150 Gemas (según categoría)',
    },
  ],
  // Escalonamiento justo por exigencia de categoría (5ª P vs. 3ª / 2ª)
  categoryGemsScale: CATEGORIES_SCALE.map((c) => ({
    categoryId: c.id,
    categoryName: c.name,
    first: c.seasonGemBonus.first,
    second: c.seasonGemBonus.second,
    third: c.seasonGemBonus.third,
  })),
};

export const ANNUAL_MASTER_TOP8_REWARDS = {
  badge: 'EVENTO ÚNICO ANUAL · SOLO POR MÉRITO',
  title: 'Gran Premio Anual · Torneo de Maestros (Master Top 8)',
  qualificationRule:
    'Sin inscripción ni pago. Clasifican únicamente los 8 primeros jugadores (#1 al #8) con mayor suma acumulada en la Tabla Estática de las 4 Temporadas del año.',
  podium: [
    {
      place: 1,
      label: 'Campeón Maestro Anual (#1)',
      accent: 'gold',
      trophyImage: ASSETS.trofeoMasterTop8,
      rewards: [
        'Copa Mayor de Maestro TOTAL TENIS',
        'Raqueta Grafito Competición o Vale Pro Shop S/ 500 (según auspicio)',
        'Distintivo Vitalicio "Maestro 2026" en perfil',
        '+1,000 Gemas Oficiales (S/ 50 en tienda)',
      ],
    },
    {
      place: 2,
      label: 'Finalista del Master (#2)',
      accent: 'silver',
      trophyImage: ASSETS.trofeoCampeonGira,
      rewards: [
        'Trofeo Oficial de Finalista Master',
        'Raquetero Térmico Pro o Vale Pro Shop S/ 240',
        '+600 Gemas Oficiales',
      ],
    },
    {
      place: 3,
      label: 'Podio Semifinalista Master (#3)',
      accent: 'bronze',
      trophyImage: ASSETS.trofeoCampeonGira,
      rewards: [
        'Trofeo de Honor Master Top 8',
        'Pack Encordado Completo + 2 Tarros de Pelotas',
        '+350 Gemas Oficiales',
      ],
    },
  ],
};

/* ==========================================================================
   5. GENERADOR REAL DE LLAVES DE 16 PARTICIPANTES (DESDE OCTAVOS DE FINAL)
   16 inscritos -> 8 partidos Octavos -> 4 Cuartos -> 2 Semis -> 1 Gran Final
   Ronda Consuelo opcional configurable por torneo (activarConsuelo: true|false)
   ========================================================================== */
export function buildBracket16(participants = [], activateConsolation = false) {
  const padded = Array.from({ length: 16 }, (_, idx) => {
    const p = participants[idx];
    return p || { id: `tbd-${idx + 1}`, name: 'Cupo Disponible', club: 'Por definir', seed: idx + 1, isPlaceholder: true };
  });

  // 8 partidos de Octavos de Final (16 jugadores)
  const octavos = Array.from({ length: 8 }, (_, i) => ({
    id: `R16-${i + 1}`,
    round: 'Octavos de Final',
    matchNumber: i + 1,
    playerA: padded[i * 2],
    playerB: padded[i * 2 + 1],
    score: '',
    winnerId: null,
    status: padded[i * 2].isPlaceholder || padded[i * 2 + 1].isPlaceholder ? 'PENDING' : 'SCHEDULED',
  }));

  // 4 partidos de Cuartos de Final
  const cuartos = Array.from({ length: 4 }, (_, i) => ({
    id: `QF-${i + 1}`,
    round: 'Cuartos de Final',
    matchNumber: i + 1,
    playerA: { id: null, name: `Ganador Octavos ${i * 2 + 1}`, isPlaceholder: true },
    playerB: { id: null, name: `Ganador Octavos ${i * 2 + 2}`, isPlaceholder: true },
    score: '',
    winnerId: null,
    status: 'WAITING',
  }));

  // 2 partidos de Semifinales
  const semis = Array.from({ length: 2 }, (_, i) => ({
    id: `SF-${i + 1}`,
    round: 'Semifinales',
    matchNumber: i + 1,
    playerA: { id: null, name: `Ganador Cuartos ${i * 2 + 1}`, isPlaceholder: true },
    playerB: { id: null, name: `Ganador Cuartos ${i * 2 + 2}`, isPlaceholder: true },
    score: '',
    winnerId: null,
    status: 'WAITING',
  }));

  // 1 Gran Final
  const finalMatch = [
    {
      id: 'F-1',
      round: 'Gran Final',
      matchNumber: 1,
      playerA: { id: null, name: 'Ganador Semifinal 1', isPlaceholder: true },
      playerB: { id: null, name: 'Ganador Semifinal 2', isPlaceholder: true },
      score: '',
      winnerId: null,
      status: 'WAITING',
    },
  ];

  // Ronda Consuelo opcional (solo si el torneo la habilita para los 8 perdedores de Octavos)
  const consuelo = activateConsolation
    ? {
        enabled: true,
        cuartos: Array.from({ length: 4 }, (_, i) => ({
          id: `CQ-${i + 1}`,
          round: 'Cuartos Consuelo',
          playerA: { id: null, name: `Perdedor Octavos ${i * 2 + 1}`, isPlaceholder: true },
          playerB: { id: null, name: `Perdedor Octavos ${i * 2 + 2}`, isPlaceholder: true },
          score: '',
          winnerId: null,
          status: 'WAITING',
        })),
        semis: Array.from({ length: 2 }, (_, i) => ({
          id: `CS-${i + 1}`,
          round: 'Semis Consuelo',
          playerA: { id: null, name: `Ganador Consuelo ${i * 2 + 1}`, isPlaceholder: true },
          playerB: { id: null, name: `Ganador Consuelo ${i * 2 + 2}`, isPlaceholder: true },
          score: '',
          winnerId: null,
          status: 'WAITING',
        })),
        final: [
          {
            id: 'CF-1',
            round: 'Final Ronda Consuelo',
            playerA: { id: null, name: 'Ganador Semi Consuelo 1', isPlaceholder: true },
            playerB: { id: null, name: 'Ganador Semi Consuelo 2', isPlaceholder: true },
            score: '',
            winnerId: null,
            status: 'WAITING',
          },
        ],
      }
    : { enabled: false, cuartos: [], semis: [], final: [] };

  return { octavos, cuartos, semis, final: finalMatch, consuelo };
}

const DEMO_PARTICIPANTS_16 = [
  { id: 'plr-elias', name: 'Elías Villa', club: 'Country Club', seed: 1, category: '3ª Cat.' },
  { id: 'plr-andres', name: 'Andrés Quispe', club: 'Club Los Inkas', seed: 16, category: '5ª P' },
  { id: 'plr-diego', name: 'Diego Torres', club: 'Tauro Tenis', seed: 8, category: '4ª Cat.' },
  { id: 'plr-carlos', name: 'Carlos Méndez', club: 'Tauro Tenis', seed: 9, category: '5ª A' },
  { id: 'plr-alejandro', name: 'Alejandro Santiváñez', club: 'Acad. Romina Cutipa', seed: 4, category: '3ª Cat.' },
  { id: 'plr-sofia', name: 'Sofía Lazo', club: 'Club Los Inkas', seed: 13, category: '5ª B' },
  { id: 'plr-pablo', name: 'Pablo Samaniego', club: 'Country Club', seed: 5, category: '4ª Cat.' },
  { id: 'plr-valeria', name: 'Valeria Paredes', club: 'Acad. Romina Cutipa', seed: 12, category: '5ª A' },
  { id: 'plr-mateo', name: 'Mateo Villavicencio', club: 'Country Club', seed: 3, category: '3ª Cat.' },
  { id: 'guest-1', name: 'Sebastián Ruiz', club: 'Country Club', seed: 14, category: '4ª Cat.' },
  { id: 'guest-2', name: 'Renato Paredes', club: 'Tauro Tenis', seed: 6, category: '4ª Cat.' },
  { id: 'guest-3', name: 'Jorge Salcedo', club: 'Club Los Inkas', seed: 11, category: '5ª A' },
  { id: 'guest-4', name: 'Gonzalo Meza', club: 'Country Club', seed: 7, category: '4ª Cat.' },
  { id: 'guest-5', name: 'Luis Ávila', club: 'Acad. Romina Cutipa', seed: 10, category: '5ª A' },
  { id: 'guest-6', name: 'Keny Huamán', club: 'Tauro Tenis', seed: 15, category: '5ª B' },
  { id: 'plr-rodrigo', name: 'Rodrigo Quispe', club: 'Country Club', seed: 2, category: '3ª Cat.' },
];

/* ==========================================================================
   6. GIRA DE TORNEOS OFICIALES (FOTOS ÚNICAS · OCTAVOS · COLLAGE DE PREMIOS)
   ========================================================================== */
export function getInitialTournaments() {
  const clean = isBetaCleanActive();
  const sampleParticipants = clean ? [] : DEMO_PARTICIPANTS_16;
  const sampleBracketOpen = buildBracket16(sampleParticipants, true);
  const sampleBracketNoConsolation = buildBracket16(sampleParticipants.slice(0, 10), false);

  // En modo demo, marcamos un par de resultados reales en Octavos para que el cuadro cobre vida
  if (!clean && sampleBracketOpen.octavos.length === 8) {
    sampleBracketOpen.octavos[0].score = '6-2, 6-3';
    sampleBracketOpen.octavos[0].winnerId = 'plr-elias';
    sampleBracketOpen.octavos[0].status = 'FINISHED';
    sampleBracketOpen.cuartos[0].playerA = sampleBracketOpen.octavos[0].playerA;

    sampleBracketOpen.octavos[1].score = '6-4, 7-5';
    sampleBracketOpen.octavos[1].winnerId = 'plr-diego';
    sampleBracketOpen.octavos[1].status = 'FINISHED';
    sampleBracketOpen.cuartos[0].playerB = sampleBracketOpen.octavos[1].playerA;
    sampleBracketOpen.cuartos[0].status = 'SCHEDULED';

    sampleBracketOpen.octavos[3].score = '6-3, 4-6, [10-8]';
    sampleBracketOpen.octavos[3].winnerId = 'plr-pablo';
    sampleBracketOpen.octavos[3].status = 'FINISHED';
    sampleBracketOpen.cuartos[1].playerB = sampleBracketOpen.octavos[3].playerA;
  }

  return [
    {
      id: 'trn-master-top8',
      isMasterTop8: true,
      allowRegistration: false, // Prohibido pagar o inscribirse manualmente
      adminOnlyUpdate: true,
      name: 'Torneo de Maestros · Master Top 8',
      edition: 'Gran Final Anual · 1 vez al año',
      dateRange: '12 – 20 DIC 2026',
      clubId: 'club-country',
      clubName: 'Sede Rotativa · 4 Clubes Aliados',
      surface: 'Arcilla (Polvo de Ladrillo)',
      cover: ASSETS.torneoMasterTop8,
      trophyImage: ASSETS.trofeoMasterTop8,
      status: 'RACE_ACTIVE',
      statusLabel: 'Carrera Clasificatoria Activa',
      drawSize: 8,
      activarConsuelo: false,
      entryFeeRegular: 0,
      entryFeeVip: 0,
      categories: ['3ª / 2ª Cat.', '4ª Cat.', '5ª A', '5ª B', '5ª P', 'Damas'],
      formatSummary:
        'Exclusivo por mérito deportivo. Clasifican los 8 primeros de la Suma de Temporadas: 2 Grupos de 4 (todos contra todos) + Semifinales + Gran Final.',
      prizesCollage: {
        championTrophy: 'Copa Mayor de Maestro',
        cashPen: 500,
        cashNote: 'Efectivo o Vale Pro Shop (según auspicio anual)',
        proShopBonus: 'Raqueta Grafito Competición + Raquetero Finalista',
        gemsChampion: 1000,
        gemsFinalist: 600,
        pointsChampion: '+350 PTS Oficiales',
      },
      participants: [],
      bracket: null,
    },
    {
      id: 'trn-abierto-huancas',
      isMasterTop8: false,
      allowRegistration: true,
      adminOnlyUpdate: false,
      name: 'Abierto Country Club Los Huancas',
      edition: 'Gira Oficial · Temporada 4',
      dateRange: '21 – 29 NOV 2026',
      clubId: 'club-country',
      clubName: 'Country Club Los Huancas',
      surface: 'Arcilla (Polvo de Ladrillo)',
      cover: ASSETS.torneoApertura,
      trophyImage: ASSETS.trofeoCampeonGira,
      status: 'IN_PROGRESS',
      statusLabel: 'En Juego · Octavos de Final',
      drawSize: 16,
      activarConsuelo: true, // Ronda Consuelo activada en este torneo
      entryFeeRegular: 60,
      entryFeeVip: 48,
      categories: ['3ª Cat.', '4ª Cat.', '5ª A', '5ª B', 'Damas'],
      formatSummary:
        'Cuadro de 16 jugadores arrancando en Octavos de Final (8 partidos) con Ronda Consuelo habilitada para quienes caen en primera ronda.',
      prizesCollage: {
        championTrophy: 'Trofeo Oficial + Medalla Finalista',
        cashPen: 300,
        cashNote: 'Premio en efectivo a repartir (Campeón S/ 200 · Finalista S/ 100)',
        proShopBonus: '2 Tarros de Pelotas + Encordado Pro',
        gemsChampion: 500,
        gemsFinalist: 250,
        pointsChampion: '+250 PTS Oficiales',
      },
      participants: sampleParticipants,
      bracket: sampleBracketOpen,
    },
    {
      id: 'trn-altura-tambo',
      isMasterTop8: false,
      allowRegistration: true,
      adminOnlyUpdate: false,
      name: 'Abierto de Altura · San Carlos',
      edition: 'Torneo Oficial Singles',
      dateRange: '05 – 13 DIC 2026',
      clubId: 'club-romina',
      clubName: 'Academia de Tenis Romina Cutipa',
      surface: 'Arcilla (Polvo de Ladrillo)',
      cover: ASSETS.torneoAltura,
      trophyImage: ASSETS.trofeoCampeonGira,
      status: 'OPEN',
      statusLabel: 'Inscripciones Abiertas',
      drawSize: 16,
      activarConsuelo: false, // Opcional desactivada para controlar costo de canchas
      entryFeeRegular: 55,
      entryFeeVip: 45,
      categories: ['4ª Cat.', '5ª A', '5ª B', '5ª P', 'Damas'],
      formatSummary:
        'Eliminación directa de 16 participantes desde Octavos de Final. Sin ronda consuelo para concentrar la bolsa de premios en el cuadro principal.',
      prizesCollage: {
        championTrophy: 'Trofeo de Campeón + Medallas',
        cashPen: 250,
        cashNote: 'Efectivo directo al Campeón y Finalista',
        proShopBonus: 'Tarro de Pelotas + Pack Overgrips',
        gemsChampion: 400,
        gemsFinalist: 200,
        pointsChampion: '+220 PTS Oficiales',
      },
      participants: clean ? [] : sampleParticipants.slice(0, 10),
      bracket: sampleBracketNoConsolation,
    },
    {
      id: 'trn-dobles-valle',
      isMasterTop8: false,
      allowRegistration: true,
      adminOnlyUpdate: false,
      name: 'Copa Dobles del Valle',
      edition: 'Especial Parejas & Mixtos',
      dateRange: '19 – 20 DIC 2026',
      clubId: 'club-tauro',
      clubName: 'Club Tauro Tenis',
      surface: 'Arcilla (Polvo de Ladrillo)',
      cover: ASSETS.torneoDoblesValle,
      trophyImage: ASSETS.trofeoCampeonGira,
      status: 'OPEN',
      statusLabel: 'Cupos Disponibles',
      drawSize: 16,
      activarConsuelo: false,
      entryFeeRegular: 45,
      entryFeeVip: 36,
      categories: ['Dobles Varones', 'Dobles Damas', 'Dobles Mixtos'],
      formatSummary:
        'Torneo de fin de semana a 16 parejas (Octavos, Cuartos, Semis y Final) con hidratación y premiación el domingo por la tarde.',
      prizesCollage: {
        championTrophy: 'Doble Trofeo Campeones',
        cashPen: 200,
        cashNote: 'Bolsa en efectivo para la pareja campeona',
        proShopBonus: '2 Tarros de Pelotas + Vales de Cancha',
        gemsChampion: 350,
        gemsFinalist: 180,
        pointsChampion: '+180 PTS Oficiales',
      },
      participants: clean ? [] : sampleParticipants.slice(0, 8),
      bracket: buildBracket16(clean ? [] : sampleParticipants.slice(0, 8), false),
    },
  ];
}

/* ==========================================================================
   7. SALÓN DE LA FAMA (CUADRO HISTÓRICO INMUTABLE) Y COMUNICADOS OFICIALES
   ========================================================================== */
export function getInitialHallOfFame() {
  if (isBetaCleanActive()) return [];
  return [
    {
      id: 'hof-t3-3a',
      seasonLabel: 'Temporada 3 · 2026',
      category: '3ª Categoría',
      championName: 'Elías Villa',
      clubName: 'Country Club Los Huancas',
      avatar: ASSETS.loginPoster,
      wins: 11,
      losses: 1,
      effectiveness: '91.6%',
      pointsAtClose: 4610,
    },
    {
      id: 'hof-t3-4a',
      seasonLabel: 'Temporada 3 · 2026',
      category: '4ª Categoría',
      championName: 'Pablo Samaniego',
      clubName: 'Country Club Los Huancas',
      avatar: ASSETS.poolTenistaAccion,
      wins: 9,
      losses: 2,
      effectiveness: '81.8%',
      pointsAtClose: 3030,
    },
    {
      id: 'hof-t3-damas',
      seasonLabel: 'Temporada 3 · 2026',
      category: 'Damas Oficial',
      championName: 'Valeria Paredes',
      clubName: 'Academia de Tenis Romina Cutipa',
      avatar: ASSETS.bienvenidaClaro,
      wins: 8,
      losses: 2,
      effectiveness: '80.0%',
      pointsAtClose: 2610,
    },
  ];
}

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    tag: 'COMUNICADO OFICIAL',
    date: '19 Nov 2026',
    title: 'Bienvenido a la nueva plataforma TOTAL TENIS',
    body: 'Estrenamos nueva identidad oficial, marcadores en cancha con Juez opcional, tienda Pro Shop con tasa exacta (20 Gemas = S/ 1.00) y Portal Aliados para Clubes y Coaches.',
    highlight: 'emerald',
  },
  {
    id: 'ann-2',
    tag: 'CARRERA ANUAL',
    date: '18 Nov 2026',
    title: 'Clasificación al Torneo de Maestros (Master Top 8)',
    body: 'A la medianoche del último día de cada una de las 4 temporadas trimestrales, tus puntos oficiales se exportan y congelan en la Tabla Estática de Clasificación. Al cerrar el año, la suma de las 4 temporadas define a los 8 clasificados (#1 al #8) sin costo de inscripción.',
    highlight: 'gold',
  },
  {
    id: 'ann-3',
    tag: 'REGLAMENTO DE CANCHA',
    date: '15 Nov 2026',
    title: 'Regla equilibrada de reprogramación (24 horas)',
    body: 'Para proteger las reservas de cancha, cada reto admite 1 cambio ordinario hasta 24 horas antes del partido. Si llueve o surge una emergencia dentro de las últimas 24 horas, usa la opción de Suspensión por Clima con aviso por WhatsApp.',
    highlight: 'purple',
  },
];
