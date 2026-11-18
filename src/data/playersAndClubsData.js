import { ASSETS } from '../components/AppIcons';
import * as supabaseModule from '../supabaseClient';

const supabase = supabaseModule?.supabase || supabaseModule?.default || null;

/* ==========================================================================
   1. INTERRUPTOR MAESTRO DE LANZAMIENTO (DEMO vs. BETA REAL VACÍA)
   --------------------------------------------------------------------------
   - false = Modo Pruebas: carga jugadores y partidos de demostración (isDemo: true).
   - true  = Modo Beta Real: arranca con 0 jugadores ficticios y 0 retos ficticios,
             conservando únicamente Clubes, Coaches, Categorías y Tienda.
   ========================================================================== */
export const BETA_LAUNCH_MODE = false;

export const APP_CONFIG = {
  brandName: 'TOTAL TENIS',
  shortTag: 'TT',
  version: '3.0.0',
  maxPlayersCapacity: 10000, // Capacidad ampliada de 500 -> 10,000 jugadores
  gemsPerSol: 20, // Constante inamovible: 20 Gemas = S/ 1.00 (1 Gema = S/ 0.05)
  vipMonthlyPricePen: 29.9,
  vipMonthlyGemsBonus: 200,
  vipCourtSavingsPerHour: 8,
  vipGemsMultiplier: 2.5,
  standardWeeklyGemCap: 25,
  vipWeeklyGemCap: 65,
  adminPin: '1234',
  supportWhatsApp: '51999888777',
  timezone: 'America/Lima',
  copyright: '© 2026 TOTAL TENIS. Todos los derechos reservados.',
  legalEntity: 'TOTAL TENIS PERÚ · Circuito Oficial de Competencia',
  storageKeys: {
    players: 'tt_players_v3',
    challenges: 'tt_challenges_v3',
    tournaments: 'tt_tournaments_v3',
    clubs: 'tt_clubs_v3',
    coaches: 'tt_coaches_v3',
    seasonSnapshots: 'tt_season_snapshots_v3',
    session: 'tt_session_v3',
    claims: 'tt_claims_v3',
    orders: 'tt_proshop_orders_v3',
    bookings: 'tt_partner_bookings_v3',
    betaCleanFlag: 'tt_beta_clean_mode',
  },
};

/* ==========================================================================
   2. ESCALA OFICIAL DE CATEGORÍAS (0 a 5,000+ PTS · ANCHO 1,000 PTS)
   Motor ELO Intacto: pisos protectores, checkpoints y etiquetas limpias.
   ========================================================================== */
export const CATEGORIES_SCALE = [
  {
    id: '5P',
    name: '5ª P',
    fullName: '5ª Categoría Principiante',
    tierGroup: 'Iniciación',
    min: 0,
    max: 999,
    floor: 0,
    seedPoints: 300,
    color: '#94A3B8',
    badgeBg: 'rgba(148, 163, 184, 0.16)',
    description: 'Primeros partidos oficiales, control de saque y ritmo de juego.',
    seasonGemBonus: { first: 120, second: 70, third: 40 },
  },
  {
    id: '5B',
    name: '5ª B',
    fullName: '5ª Categoría Intermedio Bajo',
    tierGroup: 'Iniciación',
    min: 1000,
    max: 1999,
    floor: 1000,
    seedPoints: 1000,
    color: '#D97757',
    badgeBg: 'rgba(217, 119, 87, 0.18)',
    description: 'Peloteo constante de fondo, consistencia en primer y segundo saque.',
    seasonGemBonus: { first: 160, second: 90, third: 55 },
  },
  {
    id: '5A',
    name: '5ª A',
    fullName: '5ª Categoría Consolidado',
    tierGroup: 'Intermedio',
    min: 2000,
    max: 2999,
    floor: 2000,
    seedPoints: 2000,
    color: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.16)',
    description: 'Dirección de bola, táctica de partido y defensa sólida en rallies.',
    seasonGemBonus: { first: 200, second: 120, third: 75 },
  },
  {
    id: '4A',
    name: '4ª Cat.',
    fullName: '4ª Categoría Oficial',
    tierGroup: 'Intermedio',
    min: 3000,
    max: 3999,
    floor: 3000,
    seedPoints: 3000,
    color: '#00DC7D',
    badgeBg: 'rgba(0, 220, 125, 0.16)',
    description: 'Topspin, slice, juego en red y partidos competitivos de alta intensidad.',
    seasonGemBonus: { first: 260, second: 150, third: 95 },
  },
  {
    id: '3A',
    name: '3ª Cat.',
    fullName: '3ª Categoría Avanzada',
    tierGroup: 'Élite',
    min: 4000,
    max: 4999,
    floor: 4000,
    seedPoints: 4000,
    color: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.18)',
    description: 'Saque potente con efecto, ritmo agresivo y campeones de torneos.',
    seasonGemBonus: { first: 340, second: 200, third: 120 },
  },
  {
    id: '2A',
    name: '2ª Libre',
    fullName: '2ª Categoría Libre / Abierta',
    tierGroup: 'Élite',
    min: 5000,
    max: 99999,
    floor: 5000,
    seedPoints: 5000,
    color: '#E879F9',
    badgeBg: 'rgba(232, 121, 249, 0.18)',
    description: 'Techo competitivo abierto del circuito regional y nacional.',
    seasonGemBonus: { first: 420, second: 250, third: 150 },
  },
];

export const DIVISIONS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'Varones', label: 'Varones' },
  { id: 'Damas', label: 'Damas' },
  { id: 'Senior +40', label: 'Senior +40' },
];

export function getCategoryByPoints(points = 0) {
  const safePts = Math.max(0, Number(points) || 0);
  return (
    CATEGORIES_SCALE.find((c) => safePts >= c.min && safePts <= c.max) ||
    CATEGORIES_SCALE[CATEGORIES_SCALE.length - 1]
  );
}

/* ==========================================================================
   3. LOS 4 CLUBES FUNDADORES (SOLO GOOGLE MAPS · CERO WAZE · CARRUSEL EDITORIAL)
   ========================================================================== */
export const INITIAL_CLUBS = [
  {
    id: 'club-country',
    name: 'Country Club Los Huancas',
    shortName: 'Country Club',
    city: 'Huancayo',
    district: 'El Tambo',
    address: 'Av. Mariscal Castilla Km 4.5, El Tambo, Huancayo',
    logo: ASSETS.clubCountry,
    cover: ASSETS.torneoApertura,
    surface: 'Arcilla (Polvo de Ladrillo)',
    courtsCount: 6,
    hours: '06:00 a. m. – 10:00 p. m.',
    whatsapp: '51964101001',
    partnerPin: '4001',
    coordinates: { lat: -12.0432, lng: -75.2178 },
    // Exclusivamente Google Maps (Cero Waze)
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Country+Club+Los+Huancas+Huancayo',
    googleMapsDirectionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Country+Club+Los+Huancas+Huancayo',
    tarifas: {
      diaRegular: 36,
      diaVip: 28,
      nocheRegular: 46,
      nocheVip: 38,
    },
    instalaciones: [
      { id: 'arcilla', label: '6 Canchas de Arcilla Profesional', detail: 'Mantenimiento y regado diario' },
      { id: 'led', label: 'Iluminación LED Nocturna', detail: 'Estándar competitivo hasta las 10:00 p. m.' },
      { id: 'vestuarios', label: 'Vestuarios y Duchas', detail: 'Agua caliente y casilleros privados' },
      { id: 'parking', label: 'Estacionamiento Privado', detail: 'Vigilancia permanente dentro del club' },
      { id: 'cafe', label: 'Cafetería e Hidratación', detail: 'Bebidas deportivas, snacks y terraza' },
      { id: 'encordado', label: 'Servicio de Encordado', detail: 'Recepción express en pro shop local' },
    ],
    galeria: [
      { id: 'g1', title: 'Cancha Central de Arcilla', image: ASSETS.torneoApertura },
      { id: 'g2', title: 'Pistas Exteriores 2 y 3', image: ASSETS.bgArcilla },
      { id: 'g3', title: 'Jornada Nocturna LED', image: ASSETS.bienvenidaOscuro },
    ],
    videos: [
      {
        id: 'cv1',
        title: 'Recorrido Cancha Central Los Huancas',
        duration: '0:12',
        src: ASSETS.videoCircuito1,
        poster: ASSETS.torneoApertura,
      },
      {
        id: 'cv2',
        title: 'Ambiente de Retos Fin de Semana',
        duration: '0:10',
        src: ASSETS.videoCircuito3,
        poster: ASSETS.bgArcilla,
      },
    ],
    climaBase: {
      status: 'Seco y Óptimo',
      tempC: 19,
      uvIndex: 7,
      windKmh: 11,
      rainChance: 10,
      conditionKey: 'seco',
    },
    promosHorasValle: [
      {
        id: 'p-cc-1',
        title: 'Horas Valle Mañana (Mar y Jue)',
        schedule: '10:00 a. m. – 02:00 p. m.',
        pricePen: 22,
        vipPricePen: 18,
        active: true,
      },
      {
        id: 'p-cc-2',
        title: 'Pack 4 Horas Nocturnas LED',
        schedule: 'Lunes a Viernes · 07:00 p. m. – 10:00 p. m.',
        pricePen: 152,
        vipPricePen: 132,
        active: true,
      },
    ],
    torneosInternos: [
      {
        id: 'ti-cc-1',
        title: 'Noche de Dobles Los Huancas',
        date: 'Viernes 27 Nov · 07:00 p. m.',
        entryPen: 35,
        spotsLeft: 6,
        format: 'Rotación americana · 2 horas de juego + hidratación',
      },
    ],
    openCourtMatches: [
      {
        id: 'oc-1',
        playerName: 'Carlos Méndez',
        category: '4ª Cat.',
        need: 'Busco rival Singles (1 hora)',
        timeLabel: 'Hoy · 06:00 p. m.',
      },
    ],
  },
  {
    id: 'club-romina',
    name: 'Academia de Tenis Romina Cutipa',
    shortName: 'Acad. Romina Cutipa',
    city: 'Huancayo',
    district: 'San Carlos',
    address: 'Urb. San Carlos, Sector Deportivo, Huancayo',
    logo: ASSETS.clubRomina,
    cover: ASSETS.torneoAltura,
    surface: 'Arcilla (Polvo de Ladrillo)',
    courtsCount: 4,
    hours: '06:30 a. m. – 09:30 p. m.',
    whatsapp: '51964102002',
    partnerPin: '4002',
    coordinates: { lat: -12.0621, lng: -75.1984 },
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Academia+de+Tenis+Romina+Cutipa+Huancayo',
    googleMapsDirectionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Academia+de+Tenis+Romina+Cutipa+Huancayo',
    tarifas: {
      diaRegular: 32,
      diaVip: 24,
      nocheRegular: 42,
      nocheVip: 34,
    },
    instalaciones: [
      { id: 'arcilla', label: '4 Canchas de Arcilla Rápida', detail: 'Drenaje optimizado contra lluvias' },
      { id: 'led', label: 'Iluminación LED Antideslumbrante', detail: 'Visibilidad limpia en juego nocturno' },
      { id: 'academia', label: 'Zona de Preparación Física', detail: 'Conos, escaleras y calentamiento funcional' },
      { id: 'vestuarios', label: 'Vestuarios y Zona de Espera', detail: 'Área techada con vista directa a pista' },
      { id: 'hidratacion', label: 'Punto de Hidratación y Overgrips', detail: 'Venta en recepción de la academia' },
    ],
    galeria: [
      { id: 'gr1', title: 'Pista Principal San Carlos', image: ASSETS.torneoAltura },
      { id: 'gr2', title: 'Cancha de Entrenamiento Técnico', image: ASSETS.portadaTipsSemana },
      { id: 'gr3', title: 'Superficie Polvo de Ladrillo', image: ASSETS.bgArcilla },
    ],
    videos: [
      {
        id: 'rv1',
        title: 'Sesión de Alto Rendimiento en Arcilla',
        duration: '0:11',
        src: ASSETS.videoCoachRomina,
        poster: ASSETS.torneoAltura,
      },
      {
        id: 'rv2',
        title: 'Clínica de Saque y Devolución',
        duration: '0:10',
        src: ASSETS.videoCircuito2,
        poster: ASSETS.portadaAcademiaTv,
      },
    ],
    climaBase: {
      status: 'Despejado',
      tempC: 18,
      uvIndex: 8,
      windKmh: 9,
      rainChance: 15,
      conditionKey: 'seco',
    },
    promosHorasValle: [
      {
        id: 'p-rc-1',
        title: 'Mañanas Activas (Lun a Vie)',
        schedule: '08:00 a. m. – 12:00 m.',
        pricePen: 20,
        vipPricePen: 16,
        active: true,
      },
    ],
    torneosInternos: [
      {
        id: 'ti-rc-1',
        title: 'Torneo Relámpago 5ª Categoría',
        date: 'Sábado 5 Dic · 02:00 p. m.',
        entryPen: 40,
        spotsLeft: 8,
        format: 'Mini-sets a 4 games · Mínimo 3 partidos garantizados',
      },
    ],
    openCourtMatches: [
      {
        id: 'oc-2',
        playerName: 'Valeria Paredes',
        category: '5ª A · Damas',
        need: 'Busco 4ª jugadora para Dobles Damas',
        timeLabel: 'Mañana · 09:00 a. m.',
      },
    ],
  },
  {
    id: 'club-tauro',
    name: 'Club Tauro Tenis',
    shortName: 'Tauro Tenis',
    city: 'Huancayo',
    district: 'El Tambo',
    address: 'Sector La Florida, El Tambo, Huancayo',
    logo: ASSETS.clubTauro,
    cover: ASSETS.torneoDoblesValle,
    surface: 'Arcilla (Polvo de Ladrillo)',
    courtsCount: 3,
    hours: '06:00 a. m. – 09:30 p. m.',
    whatsapp: '51964103003',
    partnerPin: '4003',
    coordinates: { lat: -12.0518, lng: -75.2241 },
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tauro+Tenis+Huancayo',
    googleMapsDirectionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Tauro+Tenis+Huancayo',
    tarifas: {
      diaRegular: 30,
      diaVip: 22,
      nocheRegular: 40,
      nocheVip: 32,
    },
    instalaciones: [
      { id: 'arcilla', label: '3 Canchas de Arcilla Compacta', detail: 'Bote limpio y líneas fijas' },
      { id: 'led', label: 'Torres LED Nocturnas', detail: 'Turnos estelares de 6:00 p. m. a 9:30 p. m.' },
      { id: 'parking', label: 'Estacionamiento Seguro', detail: 'Acceso directo a pista' },
      { id: 'lounge', label: 'Terraza de Jugadores', detail: 'Zona social post-partido' },
    ],
    galeria: [
      { id: 'gt1', title: 'Canchas Tauro Tenis', image: ASSETS.torneoDoblesValle },
      { id: 'gt2', title: 'Arcilla al Atardecer', image: ASSETS.bienvenidaClaro },
    ],
    videos: [
      {
        id: 'tv1',
        title: 'Peloteo Nocturno en Tauro Tenis',
        duration: '0:10',
        src: ASSETS.videoCircuito4,
        poster: ASSETS.torneoDoblesValle,
      },
    ],
    climaBase: {
      status: 'Humedad Ligera',
      tempC: 17,
      uvIndex: 6,
      windKmh: 12,
      rainChance: 20,
      conditionKey: 'humedad',
    },
    promosHorasValle: [
      {
        id: 'p-tt-1',
        title: 'Promo Mediodía Tauro (Lun a Jue)',
        schedule: '11:00 a. m. – 03:00 p. m.',
        pricePen: 18,
        vipPricePen: 15,
        active: true,
      },
    ],
    torneosInternos: [
      {
        id: 'ti-tt-1',
        title: 'Copa Escalera Tauro Senior +40',
        date: 'Domingo 13 Dic · 08:30 a. m.',
        entryPen: 45,
        spotsLeft: 5,
        format: 'Grupos de 4 + Semifinal y Final',
      },
    ],
    openCourtMatches: [],
  },
  {
    id: 'club-inkas',
    name: 'Club Los Inkas Huancayo',
    shortName: 'Club Los Inkas',
    city: 'Huancayo',
    district: 'Pilcomayo / Valle',
    address: 'Av. Los Inkas, Zona Campestre, Huancayo',
    logo: ASSETS.clubInkas,
    cover: ASSETS.bienvenidaClaro,
    surface: 'Arcilla (Polvo de Ladrillo)',
    courtsCount: 4,
    hours: '06:30 a. m. – 09:00 p. m.',
    whatsapp: '51964104004',
    partnerPin: '4004',
    coordinates: { lat: -12.0574, lng: -75.2392 },
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Club+Los+Inkas+Huancayo+Tenis',
    googleMapsDirectionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Club+Los+Inkas+Huancayo',
    tarifas: {
      diaRegular: 30,
      diaVip: 22,
      nocheRegular: 38,
      nocheVip: 30,
    },
    instalaciones: [
      { id: 'arcilla', label: '4 Canchas Campestres de Arcilla', detail: 'Entorno abierto con vista al valle' },
      { id: 'led', label: 'Iluminación LED en Canchas 1 y 2', detail: 'Reservas nocturnas habilitadas' },
      { id: 'familiar', label: 'Áreas Verdes y Zona Familiar', detail: 'Ideal para jornadas de torneo dominical' },
      { id: 'vestuarios', label: 'Vestuarios Amplios y Estacionamiento', detail: 'Acceso vehicular amplio' },
    ],
    galeria: [
      { id: 'gi1', title: 'Vista Campestre Los Inkas', image: ASSETS.bienvenidaClaro },
      { id: 'gi2', title: 'Cancha 1 Oficial', image: ASSETS.torneoAltura },
    ],
    videos: [
      {
        id: 'iv1',
        title: 'Jornada de Circuito en Los Inkas',
        duration: '0:10',
        src: ASSETS.videoCircuito1,
        poster: ASSETS.bienvenidaClaro,
      },
    ],
    climaBase: {
      status: 'Seco y Soleado',
      tempC: 20,
      uvIndex: 8,
      windKmh: 8,
      rainChance: 10,
      conditionKey: 'seco',
    },
    promosHorasValle: [
      {
        id: 'p-li-1',
        title: 'Tarifa Plana Martes y Miércoles',
        schedule: '09:00 a. m. – 02:00 p. m.',
        pricePen: 18,
        vipPricePen: 14,
        active: true,
      },
    ],
    torneosInternos: [
      {
        id: 'ti-li-1',
        title: 'Abierto Campestre Mixto',
        date: 'Domingo 20 Dic · 09:00 a. m.',
        entryPen: 35,
        spotsLeft: 10,
        format: 'Dobles Mixtos · Categorías 5ª y 4ª',
      },
    ],
    openCourtMatches: [],
  },
];

/* ==========================================================================
   4. COACHES CERTIFICADOS (CERO COMENTARIOS ESCRITOS · VIDEOS EN CANCHA · GEMAS)
   Tarifa Regular vs. Tarifa VIP REALMENTE diferenciada + Copago 20 Gemas = S/ 1
   ========================================================================== */
export const INITIAL_COACHES = [
  {
    id: 'coach-romina',
    name: 'Romina Cutipa',
    title: 'Head Coach · Directora de Academia',
    featured: true,
    clubId: 'club-romina',
    clubName: 'Academia de Tenis Romina Cutipa',
    city: 'Huancayo',
    specialty: 'Construcción de punto en arcilla, técnica moderna y formación femenina/mixta',
    experienceYears: 11,
    studentsPromoted: 48,
    activeStudentsCount: 34,
    whatsapp: '51964201001',
    partnerPin: '7771',
    portrait: ASSETS.loginPoster,
    courtBackground: ASSETS.bgArcilla,
    badge: 'Head Coach Certificada',
    basePriceRegular: 60,
    basePriceVip: 50,
    videosEnCancha: [
      {
        id: 'vc-rom-1',
        title: 'Cómo generar topspin profundo en altura',
        tag: 'Tip Técnico',
        duration: '0:10',
        views: 312,
        src: ASSETS.videoCoachRomina,
        poster: ASSETS.torneoAltura,
      },
      {
        id: 'vc-rom-2',
        title: 'Corrección de primer saque con efecto slice',
        tag: 'En Cancha',
        duration: '0:10',
        views: 248,
        src: ASSETS.videoCircuito2,
        poster: ASSETS.portadaTipsSemana,
      },
    ],
    modalidades: [
      {
        id: 'm-rom-priv',
        type: 'Clase Privada 1 a 1',
        duration: '60 min',
        priceRegular: 60,
        priceVip: 50,
        gemsCopay: { gems: 200, cashPen: 50, discountPen: 10 },
        spotsUsed: 0,
        spotsMax: 1,
        highlight: 'Diagnóstico personalizado + plan táctico',
      },
      {
        id: 'm-rom-grup',
        type: 'Clase Grupal Arcilla (Máx. 4)',
        duration: '90 min',
        priceRegular: 35,
        priceVip: 28,
        gemsCopay: { gems: 100, cashPen: 30, discountPen: 5 },
        spotsUsed: 3,
        spotsMax: 4,
        highlight: 'Último cupo disponible esta semana',
      },
      {
        id: 'm-rom-clin',
        type: 'Clínica de Saque y Resto',
        duration: '90 min',
        priceRegular: 45,
        priceVip: 36,
        gemsCopay: { gems: 140, cashPen: 38, discountPen: 7 },
        spotsUsed: 4,
        spotsMax: 6,
        highlight: 'Sábados 09:00 a. m. · Cancha 1',
      },
      {
        id: 'm-rom-pack',
        type: 'Pack Mensual 8 Clases Privadas',
        duration: '8 sesiones',
        priceRegular: 440,
        priceVip: 380,
        gemsCopay: { gems: 400, cashPen: 420, discountPen: 20 },
        spotsUsed: 0,
        spotsMax: 1,
        highlight: 'Ahorras S/ 40 + seguimiento en partidos oficiales',
      },
    ],
    horariosSemanales: [
      { id: 'h-r1', day: 'Lunes', slot: '07:00 a. m. · Privada', available: true },
      { id: 'h-r2', day: 'Martes', slot: '06:00 p. m. · Grupal (3/4)', available: true },
      { id: 'h-r3', day: 'Miércoles', slot: '08:00 a. m. · Privada', available: true },
      { id: 'h-r4', day: 'Jueves', slot: '07:00 p. m. · Grupal (2/4)', available: true },
      { id: 'h-r5', day: 'Sábado', slot: '09:00 a. m. · Clínica', available: true },
    ],
    alumnosActivos: [
      { id: 'al-1', name: 'Valeria Paredes', level: '5ª A', attendance: '92%', plan: 'Grupal Arcilla' },
      { id: 'al-2', name: 'Sofía Lazo', level: '5ª B', attendance: '88%', plan: 'Privada 1 a 1' },
      { id: 'al-3', name: 'Diego Torres', level: '4ª Cat.', attendance: '95%', plan: 'Pack Mensual' },
    ],
  },
  {
    id: 'coach-rodrigo',
    name: 'Rodrigo Quispe',
    title: 'Coach Competitivo · Ex Top Regional',
    featured: false,
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    city: 'Huancayo',
    specialty: 'Potencia de derecha, juego de ataque y preparación para torneos 4ª / 3ª',
    experienceYears: 9,
    studentsPromoted: 37,
    activeStudentsCount: 28,
    whatsapp: '51964202002',
    partnerPin: '7777',
    portrait: ASSETS.registroPoster,
    courtBackground: ASSETS.bgArcilla,
    badge: 'Coach Oficial 3ª/2ª',
    basePriceRegular: 65,
    basePriceVip: 54,
    videosEnCancha: [
      {
        id: 'vc-rod-1',
        title: 'Aceleración de derecha invertida en polvo de ladrillo',
        tag: 'Tip Técnico',
        duration: '0:10',
        views: 418,
        src: ASSETS.videoCoachRodrigo,
        poster: ASSETS.torneoApertura,
      },
      {
        id: 'vc-rod-2',
        title: 'Transición ataque-volea para cerrar puntos',
        tag: 'Sparring Pro',
        duration: '0:10',
        views: 274,
        src: ASSETS.videoCircuito1,
        poster: ASSETS.portadaAcademiaTv,
      },
    ],
    modalidades: [
      {
        id: 'm-rod-priv',
        type: 'Clase Privada Competitiva',
        duration: '60 min',
        priceRegular: 65,
        priceVip: 54,
        gemsCopay: { gems: 200, cashPen: 55, discountPen: 10 },
        spotsUsed: 0,
        spotsMax: 1,
        highlight: 'Corrección biomecánica y patrones de juego',
      },
      {
        id: 'm-rod-spar',
        type: 'Sparring Competitivo con Feedback',
        duration: '75 min',
        priceRegular: 55,
        priceVip: 46,
        gemsCopay: { gems: 200, cashPen: 45, discountPen: 10 },
        spotsUsed: 0,
        spotsMax: 1,
        highlight: 'Set de práctica real + ajuste táctico en vivo',
      },
      {
        id: 'm-rod-grup',
        type: 'Grupo Competitivo 4ª / 3ª',
        duration: '90 min',
        priceRegular: 38,
        priceVip: 30,
        gemsCopay: { gems: 120, cashPen: 32, discountPen: 6 },
        spotsUsed: 2,
        spotsMax: 4,
        highlight: 'Drills de alta intensidad y puntos con presión',
      },
      {
        id: 'm-rod-eval',
        type: 'Evaluación Diagnóstica de Nivel',
        duration: '45 min',
        priceRegular: 40,
        priceVip: 32,
        gemsCopay: { gems: 100, cashPen: 35, discountPen: 5 },
        spotsUsed: 0,
        spotsMax: 1,
        highlight: 'Informe técnico completo de 5 golpes clave',
      },
    ],
    horariosSemanales: [
      { id: 'h-q1', day: 'Lunes', slot: '06:00 p. m. · Sparring', available: true },
      { id: 'h-q2', day: 'Martes', slot: '07:00 a. m. · Privada', available: true },
      { id: 'h-q3', day: 'Jueves', slot: '06:30 p. m. · Grupo 4ª/3ª (2/4)', available: true },
      { id: 'h-q4', day: 'Viernes', slot: '05:00 p. m. · Evaluación', available: true },
    ],
    alumnosActivos: [
      { id: 'al-4', name: 'Pablo Samaniego', level: '4ª Cat.', attendance: '96%', plan: 'Sparring Pro' },
      { id: 'al-5', name: 'Mateo Villavicencio', level: '3ª Cat.', attendance: '91%', plan: 'Privada Competitiva' },
    ],
  },
  {
    id: 'coach-carlos',
    name: 'Carlos Mendoza',
    title: 'Especialista en Iniciación y Base Técnica',
    featured: false,
    clubId: 'club-tauro',
    clubName: 'Club Tauro Tenis',
    city: 'Huancayo',
    specialty: 'Progresión rápida desde 5ª P a 5ª A, empuñaduras y regularidad de fondo',
    experienceYears: 7,
    studentsPromoted: 29,
    activeStudentsCount: 22,
    whatsapp: '51964203003',
    partnerPin: '7773',
    portrait: ASSETS.poolTenistaAccion,
    courtBackground: ASSETS.bgDura,
    badge: 'Especialista 5ª Cat.',
    basePriceRegular: 50,
    basePriceVip: 42,
    videosEnCancha: [
      {
        id: 'vc-car-1',
        title: 'Los 3 errores más comunes al empezar en 5ª P',
        tag: 'Iniciación',
        duration: '0:10',
        views: 195,
        src: ASSETS.videoCoach3,
        poster: ASSETS.torneoDoblesValle,
      },
    ],
    modalidades: [
      {
        id: 'm-car-priv',
        type: 'Clase Privada Fundamentos',
        duration: '60 min',
        priceRegular: 50,
        priceVip: 42,
        gemsCopay: { gems: 160, cashPen: 42, discountPen: 8 },
        spotsUsed: 0,
        spotsMax: 1,
        highlight: 'Ideal para pasar de 5ª P a 5ª B rápido',
      },
      {
        id: 'm-car-grup',
        type: 'Escuela Nocturna 5ª Categoría',
        duration: '90 min',
        priceRegular: 30,
        priceVip: 24,
        gemsCopay: { gems: 100, cashPen: 25, discountPen: 5 },
        spotsUsed: 2,
        spotsMax: 4,
        highlight: 'Martes y Jueves · Cancha 2 LED',
      },
    ],
    horariosSemanales: [
      { id: 'h-c1', day: 'Martes', slot: '07:00 p. m. · Grupo 5ª (2/4)', available: true },
      { id: 'h-c2', day: 'Jueves', slot: '07:00 p. m. · Grupo 5ª (2/4)', available: true },
      { id: 'h-c3', day: 'Sábado', slot: '10:00 a. m. · Privada', available: true },
    ],
    alumnosActivos: [
      { id: 'al-6', name: 'Andrés Quispe', level: '5ª P', attendance: '100%', plan: 'Fundamentos' },
    ],
  },
  {
    id: 'coach-andrea',
    name: 'Andrea Salvatierra',
    title: 'Coach de Dobles y Preparación Física en Tenis',
    featured: false,
    clubId: 'club-inkas',
    clubName: 'Club Los Inkas Huancayo',
    city: 'Huancayo',
    specialty: 'Juego de dobles, desplazamientos en arcilla y prevención de lesiones',
    experienceYears: 6,
    studentsPromoted: 19,
    activeStudentsCount: 18,
    whatsapp: '51964204004',
    partnerPin: '7774',
    portrait: ASSETS.portadaTipsSemana,
    courtBackground: ASSETS.bgCesped,
    badge: 'Coach Dobles & Físico',
    basePriceRegular: 55,
    basePriceVip: 45,
    videosEnCancha: [
      {
        id: 'vc-and-1',
        title: 'Split-step y juego de red en parejas',
        tag: 'Dobles',
        duration: '0:10',
        views: 164,
        src: ASSETS.videoCoach4,
        poster: ASSETS.bienvenidaClaro,
      },
    ],
    modalidades: [
      {
        id: 'm-and-priv',
        type: 'Sesión Privada Técnica + Desplazamiento',
        duration: '60 min',
        priceRegular: 55,
        priceVip: 45,
        gemsCopay: { gems: 200, cashPen: 45, discountPen: 10 },
        spotsUsed: 0,
        spotsMax: 1,
        highlight: 'Velocidad de pies y lectura de bola',
      },
      {
        id: 'm-and-dob',
        type: 'Clínica Táctica de Dobles',
        duration: '90 min',
        priceRegular: 35,
        priceVip: 28,
        gemsCopay: { gems: 100, cashPen: 30, discountPen: 5 },
        spotsUsed: 3,
        spotsMax: 4,
        highlight: 'Domingos 08:30 a. m. · Club Los Inkas',
      },
    ],
    horariosSemanales: [
      { id: 'h-a1', day: 'Miércoles', slot: '05:00 p. m. · Privada', available: true },
      { id: 'h-a2', day: 'Domingo', slot: '08:30 a. m. · Clínica Dobles (3/4)', available: true },
    ],
    alumnosActivos: [],
  },
];

/* ==========================================================================
   5. JUGADORES DEMO (SOLO PRUEBAS · MARCADOS CON isDemo: true)
   En BETA_LAUNCH_MODE = true se reemplazan automáticamente por [].
   ========================================================================== */
export const DEMO_PLAYERS = [
  {
    id: 'plr-elias',
    isDemo: true,
    credentialId: 'TT-2026-0001',
    name: 'Elías Villa',
    email: 'elias@totaltenis.pe',
    whatsapp: '51964000001',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Varones',
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    points: 4680,
    prevRank: 1,
    wins: 18,
    losses: 2,
    streak: 6,
    calibrationPlayed: 5,
    isVip: true,
    gems: 420,
    weeklyGemsEarned: 45,
    avatar: ASSETS.loginPoster,
    heroBg: 'finals',
    hand: 'Diestro · Revés a 2 manos',
    racket: 'Babolat Pure Aero 98',
    availability: 'Noches L-V y Sábados',
    badges: ['badge-maestro-top8', 'badge-invicto', 'badge-rey-arcilla'],
    gemLog: [
      { id: 'gl-e1', date: '17 Nov', label: 'Cofre Mensual Socio VIP', delta: +200 },
      { id: 'gl-e2', date: '15 Nov', label: 'Racha de 3+ Victorias', delta: +12 },
    ],
  },
  {
    id: 'plr-mateo',
    isDemo: true,
    credentialId: 'TT-2026-0002',
    name: 'Mateo Villavicencio',
    email: 'mateo@totaltenis.pe',
    whatsapp: '51964000002',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Varones',
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    points: 4320,
    prevRank: 3,
    wins: 15,
    losses: 4,
    streak: 4,
    calibrationPlayed: 5,
    isVip: true,
    gems: 310,
    weeklyGemsEarned: 35,
    avatar: ASSETS.registroPoster,
    heroBg: 'arcilla',
    hand: 'Diestro · Revés a 1 mano',
    racket: 'Wilson Blade 98 v9',
    availability: 'Mar, Jue y Domingos',
    badges: ['badge-saque-canon', 'badge-rey-arcilla'],
    gemLog: [
      { id: 'gl-m1', date: '16 Nov', label: 'Cofre Mensual Socio VIP', delta: +200 },
      { id: 'gl-m2', date: '14 Nov', label: 'Victoria Matagigantes', delta: +25 },
    ],
  },
  {
    id: 'plr-pablo',
    isDemo: true,
    credentialId: 'TT-2026-0003',
    name: 'Pablo Samaniego',
    email: 'pablo@totaltenis.pe',
    whatsapp: '51964000003',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Senior +40',
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    points: 3080,
    prevRank: 4,
    wins: 11,
    losses: 3,
    streak: 3,
    calibrationPlayed: 5,
    isVip: true,
    gems: 245, // Saldo restaurado y consistente con el abono VIP +200 Gemas
    weeklyGemsEarned: 25,
    avatar: ASSETS.poolTenistaAccion,
    heroBg: 'arcilla',
    hand: 'Diestro · Revés a 2 manos',
    racket: 'Head Speed MP',
    availability: 'Lunes a Viernes 06:00 p. m. · Fines de semana',
    badges: ['badge-veterano-oro', 'badge-rey-arcilla', 'badge-invicto'],
    gemLog: [
      { id: 'gl-p1', date: '18 Nov', label: 'Abono Mensual Socio VIP', delta: +200 },
      { id: 'gl-p2', date: '16 Nov', label: 'Victoria en Reto Oficial', delta: +15 },
      { id: 'gl-p3', date: '14 Nov', label: 'Racha de 3 Victorias (x2.5 VIP)', delta: +15 },
      { id: 'gl-p4', date: '11 Nov', label: 'Trivia Semanal + Reporte Clima', delta: +15 },
    ],
  },
  {
    id: 'plr-alejandro',
    isDemo: true,
    credentialId: 'TT-2026-0004',
    name: 'Alejandro Santiváñez',
    email: 'alejandro@totaltenis.pe',
    whatsapp: '51964000004',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Varones',
    clubId: 'club-romina',
    clubName: 'Academia de Tenis Romina Cutipa',
    points: 4190,
    prevRank: 2,
    wins: 14,
    losses: 5,
    streak: 2,
    calibrationPlayed: 5,
    isVip: false,
    gems: 95,
    weeklyGemsEarned: 15,
    avatar: ASSETS.portadaTipsSemana,
    heroBg: 'dura',
    hand: 'Zurdo · Revés a 2 manos',
    racket: 'Yonex EZONE 100',
    availability: 'Mañanas y Sábados',
    badges: ['badge-mata-gigantes'],
    gemLog: [{ id: 'gl-a1', date: '12 Nov', label: 'Bono de Registro + Retos', delta: +95 }],
  },
  {
    id: 'plr-rodrigo',
    isDemo: true,
    credentialId: 'TT-2026-0005',
    name: 'Rodrigo Quispe',
    email: 'rodrigo@totaltenis.pe',
    whatsapp: '51964000005',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Varones',
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    points: 4510,
    prevRank: 2,
    wins: 16,
    losses: 3,
    streak: 5,
    calibrationPlayed: 5,
    isVip: true,
    gems: 360,
    weeklyGemsEarned: 40,
    avatar: ASSETS.portadaAcademiaTv,
    heroBg: 'finals',
    hand: 'Diestro · Revés a 1 mano',
    racket: 'Wilson Pro Staff 97',
    availability: 'Tardes L-V',
    badges: ['badge-saque-canon', 'badge-maestro-top8'],
    gemLog: [{ id: 'gl-r1', date: '15 Nov', label: 'Abono Mensual Socio VIP', delta: +200 }],
  },
  {
    id: 'plr-diego',
    isDemo: true,
    credentialId: 'TT-2026-0006',
    name: 'Diego Torres',
    email: 'diego@totaltenis.pe',
    whatsapp: '51964000006',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Varones',
    clubId: 'club-tauro',
    clubName: 'Club Tauro Tenis',
    points: 3420,
    prevRank: 6,
    wins: 10,
    losses: 4,
    streak: 2,
    calibrationPlayed: 5,
    isVip: false,
    gems: 110,
    weeklyGemsEarned: 20,
    avatar: ASSETS.cancha1,
    heroBg: 'arcilla',
    hand: 'Diestro · Revés a 2 manos',
    racket: 'Head Radical MP',
    availability: 'Noches Mar-Jue',
    badges: ['badge-rey-arcilla'],
    gemLog: [{ id: 'gl-d1', date: '10 Nov', label: 'Misiones Semanales', delta: +110 }],
  },
  {
    id: 'plr-valeria',
    isDemo: true,
    credentialId: 'TT-2026-0007',
    name: 'Valeria Paredes',
    email: 'valeria@totaltenis.pe',
    whatsapp: '51964000007',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Damas',
    clubId: 'club-romina',
    clubName: 'Academia de Tenis Romina Cutipa',
    points: 2680,
    prevRank: 7,
    wins: 9,
    losses: 3,
    streak: 3,
    calibrationPlayed: 5,
    isVip: true,
    gems: 270,
    weeklyGemsEarned: 30,
    avatar: ASSETS.bienvenidaClaro,
    heroBg: 'cesped',
    hand: 'Diestra · Revés a 2 manos',
    racket: 'Babolat Pure Drive',
    availability: 'Mañanas y Fines de Semana',
    badges: ['badge-invicto'],
    gemLog: [{ id: 'gl-v1', date: '16 Nov', label: 'Abono Mensual Socio VIP', delta: +200 }],
  },
  {
    id: 'plr-sofia',
    isDemo: true,
    credentialId: 'TT-2026-0008',
    name: 'Sofía Lazo',
    email: 'sofia@totaltenis.pe',
    whatsapp: '51964000008',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Damas',
    clubId: 'club-inkas',
    clubName: 'Club Los Inkas Huancayo',
    points: 1840,
    prevRank: 8,
    wins: 6,
    losses: 4,
    streak: 1,
    calibrationPlayed: 5,
    isVip: false,
    gems: 65,
    weeklyGemsEarned: 10,
    avatar: ASSETS.torneoDoblesValle,
    heroBg: 'arcilla',
    hand: 'Diestra · Revés a 2 manos',
    racket: 'Wilson Clash 100',
    availability: 'Fines de Semana',
    badges: [],
    gemLog: [{ id: 'gl-s1', date: '08 Nov', label: 'Bono de Registro + Partidos', delta: +65 }],
  },
  {
    id: 'plr-carlos',
    isDemo: true,
    credentialId: 'TT-2026-0009',
    name: 'Carlos Méndez',
    email: 'carlos@totaltenis.pe',
    whatsapp: '51964000009',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Senior +40',
    clubId: 'club-tauro',
    clubName: 'Club Tauro Tenis',
    points: 2490,
    prevRank: 9,
    wins: 8,
    losses: 6,
    streak: 0,
    calibrationPlayed: 5,
    isVip: false,
    gems: 80,
    weeklyGemsEarned: 10,
    avatar: ASSETS.poolRaquetaPelota,
    heroBg: 'dura',
    hand: 'Diestro · Revés a 1 mano',
    racket: 'Tecnifibre TFight 300',
    availability: 'Lunes, Miércoles y Viernes',
    badges: ['badge-veterano-oro'],
    gemLog: [{ id: 'gl-c1', date: '09 Nov', label: 'Partidos Oficiales', delta: +80 }],
  },
  {
    id: 'plr-andres',
    isDemo: true,
    credentialId: 'TT-2026-0010',
    name: 'Andrés Quispe',
    email: 'andres@totaltenis.pe',
    whatsapp: '51964000010',
    hideWhatsapp: false,
    city: 'Huancayo',
    division: 'Varones',
    clubId: 'club-inkas',
    clubName: 'Club Los Inkas Huancayo',
    points: 620,
    prevRank: 10,
    wins: 2,
    losses: 1,
    streak: 2,
    calibrationPlayed: 3, // En fase de calibración 3/5
    isVip: false,
    gems: 40,
    weeklyGemsEarned: 15,
    avatar: ASSETS.torneoAltura,
    heroBg: 'arcilla',
    hand: 'Diestro · Revés a 2 manos',
    racket: 'Head Instinct Team',
    availability: 'Sábados y Domingos',
    badges: [],
    gemLog: [{ id: 'gl-an1', date: '14 Nov', label: 'Bono de Registro + Calibración', delta: +40 }],
  },
];

/* ==========================================================================
   6. RETOS DEMO (MARCADOS CON isDemo: true · INCLUYEN CONTROL DE JUEZ Y 24h)
   ========================================================================== */
function getFutureIsoDate(daysAhead, hour = 18, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const DEMO_CHALLENGES = [
  {
    id: 'ch-live-1',
    isDemo: true,
    playerAId: 'plr-mateo',
    playerBId: 'plr-alejandro',
    judgeId: null, // Opcional: los protagonistas pueden asignar un Juez en Cancha
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    scheduledIso: getFutureIsoDate(0, 18, 0),
    dateLabel: 'Hoy',
    timeLabel: '06:00 p. m.',
    mode: 'Por puntos',
    ballsAgreement: 'Lata nueva a medias (50/50)',
    status: 'IN_PLAY', // EN JUEGO -> oculta Cambiar hora; solo editan Mateo, Alejandro o Juez
    rescheduleCount: 0,
    liveScore: {
      set1: { a: 6, b: 4, tbA: 0, tbB: 0, locked: true },
      set2: { a: 6, b: 6, tbA: 4, tbB: 3, locked: false },
      set3: { a: 0, b: 0, locked: false },
      currentSet: 2,
    },
    winnerId: null,
  },
  {
    id: 'ch-pablo-1',
    isDemo: true,
    playerAId: 'plr-pablo',
    playerBId: 'plr-diego',
    judgeId: null,
    clubId: 'club-country',
    clubName: 'Country Club Los Huancas',
    scheduledIso: getFutureIsoDate(2, 19, 0), // +48h -> permite 1 cambio ordinario (>24h)
    dateLabel: 'En 2 días',
    timeLabel: '07:00 p. m.',
    mode: 'Por puntos',
    ballsAgreement: 'Tarro nuevo (lleva retador)',
    status: 'SCHEDULED',
    rescheduleCount: 0,
    liveScore: {
      set1: { a: 0, b: 0, tbA: 0, tbB: 0, locked: false },
      set2: { a: 0, b: 0, tbA: 0, tbB: 0, locked: false },
      set3: { a: 0, b: 0, locked: false },
      currentSet: 1,
    },
    winnerId: null,
  },
  {
    id: 'ch-pablo-2',
    isDemo: true,
    playerAId: 'plr-rodrigo',
    playerBId: 'plr-pablo',
    judgeId: null,
    clubId: 'club-romina',
    clubName: 'Academia de Tenis Romina Cutipa',
    scheduledIso: getFutureIsoDate(0, 21, 0), // <24h -> solo permite suspensión por Clima/Emergencia
    dateLabel: 'Hoy',
    timeLabel: '09:00 p. m.',
    mode: 'Por puntos',
    ballsAgreement: 'Pelotas en buen estado',
    status: 'SCHEDULED',
    rescheduleCount: 0,
    liveScore: {
      set1: { a: 0, b: 0, tbA: 0, tbB: 0, locked: false },
      set2: { a: 0, b: 0, tbA: 0, tbB: 0, locked: false },
      set3: { a: 0, b: 0, locked: false },
      currentSet: 1,
    },
    winnerId: null,
  },
  {
    id: 'ch-done-1',
    isDemo: true,
    playerAId: 'plr-pablo',
    playerBId: 'plr-carlos',
    judgeId: 'plr-mateo',
    clubId: 'club-tauro',
    clubName: 'Club Tauro Tenis',
    scheduledIso: getFutureIsoDate(-3, 18, 30),
    dateLabel: 'Hace 3 días',
    timeLabel: '06:30 p. m.',
    mode: 'Por puntos',
    ballsAgreement: 'Lata nueva a medias (50/50)',
    status: 'FINISHED',
    rescheduleCount: 0,
    scoreSummary: '6-4, 4-6, [10-7]',
    eloDeltaA: +48,
    eloDeltaB: -26,
    winnerId: 'plr-pablo',
    liveScore: {
      set1: { a: 6, b: 4, tbA: 0, tbB: 0, locked: true },
      set2: { a: 4, b: 6, tbA: 0, tbB: 0, locked: true },
      set3: { a: 10, b: 7, locked: true },
      currentSet: 3,
    },
  },
];

/* ==========================================================================
   7. TABLA ESTÁTICA INAMOVIBLE DE 4 TEMPORADAS (CARRERA AL TORNEO DE MAESTROS)
   A la medianoche (00:00) del cierre de cada trimestre se congela una foto
   exacta de los puntos ELO sin modificar el Ranking Oficial.
   ========================================================================== */
export const INITIAL_SEASON_SNAPSHOTS = {
  year: 2026,
  currentSeason: 4, // T1, T2 y T3 cerradas e inamovibles; T4 en curso
  seasons: [
    {
      number: 1,
      label: 'Temporada 1 (Ene – Mar)',
      locked: true,
      exportedAt: '2026-03-31T23:59:59-05:00',
      scores: BETA_LAUNCH_MODE
        ? {}
        : {
            'plr-elias': 4420,
            'plr-rodrigo': 4280,
            'plr-mateo': 4050,
            'plr-alejandro': 3980,
            'plr-diego': 3150,
            'plr-pablo': 2890,
            'plr-valeria': 2410,
            'plr-carlos': 2340,
            'plr-sofia': 1620,
            'plr-andres': 420,
          },
    },
    {
      number: 2,
      label: 'Temporada 2 (Abr – Jun)',
      locked: true,
      exportedAt: '2026-06-30T23:59:59-05:00',
      scores: BETA_LAUNCH_MODE
        ? {}
        : {
            'plr-elias': 4510,
            'plr-rodrigo': 4390,
            'plr-mateo': 4180,
            'plr-alejandro': 4090,
            'plr-diego': 3290,
            'plr-pablo': 2970,
            'plr-valeria': 2520,
            'plr-carlos': 2410,
            'plr-sofia': 1710,
            'plr-andres': 510,
          },
    },
    {
      number: 3,
      label: 'Temporada 3 (Jul – Sep)',
      locked: true,
      exportedAt: '2026-09-30T23:59:59-05:00',
      scores: BETA_LAUNCH_MODE
        ? {}
        : {
            'plr-elias': 4610,
            'plr-rodrigo': 4460,
            'plr-mateo': 4260,
            'plr-alejandro': 4150,
            'plr-diego': 3360,
            'plr-pablo': 3030,
            'plr-valeria': 2610,
            'plr-carlos': 2460,
            'plr-sofia': 1790,
            'plr-andres': 580,
          },
    },
    {
      number: 4,
      label: 'Temporada 4 (Oct – Dic)',
      locked: false, // Se congela a medianoche del 31 Dic 2026
      exportedAt: null,
      scores: {},
    },
  ],
};

/* ==========================================================================
   8. UTILIDADES DE CARGA, MIGRACIÓN SILENCIOSA (FIX 0 GEMAS) Y PUENTE SUPABASE
   ========================================================================== */
export function isBetaCleanActive() {
  if (BETA_LAUNCH_MODE) return true;
  try {
    return localStorage.getItem(APP_CONFIG.storageKeys.betaCleanFlag) === 'true';
  } catch (e) {
    return false;
  }
}

export function getInitialPlayers() {
  return isBetaCleanActive() ? [] : DEMO_PLAYERS;
}

export function getInitialChallenges() {
  return isBetaCleanActive() ? [] : DEMO_CHALLENGES;
}

export function loadLocalState(key, fallbackValue, legacyKey = null) {
  try {
    const raw = localStorage.getItem(key) || (legacyKey ? localStorage.getItem(legacyKey) : null);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);

    // Migración silenciosa: corregir saldos de Gemas atrapados en 0 en socios VIP demo
    if (key === APP_CONFIG.storageKeys.players && Array.isArray(parsed)) {
      return parsed.map((p) => {
        const fixedId =
          p.credentialId && p.credentialId.startsWith('MP-')
            ? p.credentialId.replace('MP-', 'TT-')
            : p.credentialId || `TT-2026-${String(Math.floor(1000 + Math.random() * 8999))}`;
        const fixedGems =
          p.isVip && (!p.gems || p.gems === 0) ? APP_CONFIG.vipMonthlyGemsBonus : Number(p.gems) || 0;
        return { ...p, credentialId: fixedId, gems: fixedGems };
      });
    }
    return parsed;
  } catch (e) {
    return fallbackValue;
  }
}

export function saveLocalState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Protección contra cuota llena en navegadores móviles antiguos (2018)
  }
}

export async function syncWithSupabase(tableName, payload) {
  if (!supabase || !tableName || !payload) return { ok: false, offline: true };
  try {
    const { data, error } = await supabase.from(tableName).upsert(payload);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, offline: true };
  }
}

export function getClubById(clubs, clubId) {
  if (!clubId || clubId === 'independiente') return null;
  return (clubs || INITIAL_CLUBS).find((c) => c.id === clubId) || null;
}
