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
import { buildWhatsappLink } from '../utils/cloudService';

/* ==========================================================================
   ESTADOS DE CLIMA EN VIVO (CON TUS 4 ACTIVOS 3D OFICIALES)
   ========================================================================== */
const WEATHER_CONDITIONS = [
  {
    key: 'seco',
    label: 'Cancha Seca',
    shortLabel: 'Seca',
    temp: '21°C',
    note: 'Condición óptima · Lista para jugar',
    image: ASSETS.climaSeco,
    tone: 'emerald',
  },
  {
    key: 'humeda',
    label: 'Arcilla Húmeda',
    shortLabel: 'Húmeda',
    temp: '17°C',
    note: 'Bote lento · Se juega con normalidad',
    image: ASSETS.climaHumedad,
    tone: 'sky',
  },
  {
    key: 'llovizna',
    label: 'Llovizna Ligera',
    shortLabel: 'Llovizna',
    temp: '14°C',
    note: 'Precaución · Verificar con recepción',
    image: ASSETS.climaLlovizna,
    tone: 'gold',
  },
  {
    key: 'lluvia',
    label: 'Lluvia / Pausa',
    shortLabel: 'Lluvia',
    temp: '12°C',
    note: 'Canchas detenidas · Aplica reprogramación',
    image: ASSETS.climaLluvia,
    tone: 'danger',
  },
];

/* ==========================================================================
   SEEDS DE ENRIQUECIMIENTO (HIDRATACIÓN ANTI-VACÍOS SI SUPABASE TIENE [])
   Si el club o coach edita algo en Estudio Aliado, sus datos de Supabase ganan.
   (Sin "Código VIP": los beneficios VIP se validan con Carnet Digital 3D).
   ========================================================================== */
const CLUB_ENRICHMENT_MAP = {
  'club-country': {
    logo: ASSETS.clubCountry,
    cover: ASSETS.sedeCountry,
    district: 'El Tambo',
    address: 'Av. Mariscal Castilla Km 4.5, El Tambo, Huancayo',
    hours: '06:00 a. m. – 10:00 p. m.',
    surface: 'Arcilla Profesional',
    courtsCount: 6,
    dayRate: 36,
    nightRate: 46,
    vipDayRate: 28,
    vipNightRate: 38,
    whatsapp: '51964812340',
    bookingUrl: '',
    gallery: [
      { url: ASSETS.sedeCountry, caption: 'Cancha Central de Arcilla · Vista Panorámica' },
      { url: ASSETS.torneoApertura, caption: 'Pistas iluminadas para retos nocturnos' },
      { url: ASSETS.torneoDoblesValle, caption: 'Zona de partidos oficiales y dobles' },
    ],
    videos: [
      {
        id: 'v-country-1',
        title: 'Recorrido Cancha Central Los Huancas',
        duration: '0:28',
        url: ASSETS.videoCircuito1,
        poster: ASSETS.sedeCountry,
      },
    ],
    facilities: [
      { icon: 'club', title: '6 canchas de arcilla', detail: 'Mantenimiento diario con polvo fino' },
      { icon: 'sun', title: 'Iluminación LED pro', detail: 'Partidos nocturnos hasta las 10:00 p. m.' },
      { icon: 'shield', title: 'Estacionamiento privado', detail: 'Vigilancia y vestuarios con ducha' },
      { icon: 'shop', title: 'Cafetería & Terraza', detail: 'Hidratación y vista a la cancha central' },
    ],
    promos: [
      {
        id: 'pr-c1',
        tag: 'HORAS VALLE',
        title: 'Mañanas Activas · 20% OFF',
        schedule: 'Lun a Vie · 09:00 a. m. – 12:00 p. m.',
        priceText: 'S/ 29 / hora',
      },
      {
        id: 'pr-c2',
        tag: 'DOBLES',
        title: 'Bono 2 Horas Dobles + Agua',
        schedule: 'Mar y Jue · 02:00 p. m. – 05:00 p. m.',
        priceText: 'S/ 62 total',
      },
    ],
    vipBenefits: [
      'Tarifa preferencial VIP desde S/ 28 en horario diurno',
      'Prioridad de reserva en canchas iluminadas (6–9 p. m.)',
      'Descuento en tarros de pelotas y encordado en sede',
    ],
    internalEvents: [
      {
        id: 'ev-c1',
        title: 'Noche de Dobles Los Huancas',
        date: 'Este Viernes · 7:00 p. m.',
        spots: '10 / 16 cupos',
        pct: 63,
        fee: 'S/ 25',
      },
    ],
  },
  'club-romina': {
    logo: ASSETS.clubRomina,
    cover: ASSETS.sedeRomina,
    district: 'El Tambo',
    address: 'Prolongación Nemesio Ráez 420, El Tambo, Huancayo',
    hours: '06:30 a. m. – 09:30 p. m.',
    surface: 'Arcilla Formativa',
    courtsCount: 3,
    dayRate: 30,
    nightRate: 40,
    vipDayRate: 24,
    vipNightRate: 34,
    whatsapp: '51964201001',
    bookingUrl: '',
    gallery: [
      { url: ASSETS.sedeRomina, caption: 'Canchas de arcilla · Academia Romina Cutipa' },
      { url: ASSETS.portadaTipsSemana, caption: 'Zona de entrenamiento técnico y canastos' },
      { url: ASSETS.torneoAltura, caption: 'Ambiente de competencia en altura' },
    ],
    videos: [
      {
        id: 'v-romina-club',
        title: 'Tour Academia Romina Cutipa en Cancha',
        duration: '0:32',
        url: ASSETS.videoCircuito2,
        poster: ASSETS.sedeRomina,
      },
    ],
    facilities: [
      { icon: 'club', title: '3 pistas de arcilla', detail: 'Piso compacto ideal para entrenamiento' },
      { icon: 'video', title: 'Cancha con video análisis', detail: 'Soporte para grabar saque y derecha' },
      { icon: 'users', title: 'Academia formativa', detail: 'Grupos por categoría y sparring' },
      { icon: 'shield', title: 'Zona de calentamiento', detail: 'Conos, escaleras y estación de agua' },
    ],
    promos: [
      {
        id: 'pr-r1',
        tag: 'HORAS VALLE',
        title: 'Turno Mediodía Entrenamiento',
        schedule: 'Lun a Vie · 11:00 a. m. – 02:30 p. m.',
        priceText: 'S/ 24 / hora',
      },
      {
        id: 'pr-r2',
        tag: 'PACK 4H',
        title: 'Bono Mensual de Práctica (4 hrs)',
        schedule: 'Horario diurno flexible',
        priceText: 'S/ 96 pack',
      },
    ],
    vipBenefits: [
      'Ahorro directo de S/ 6 por hora en cada reserva',
      'Primera evaluación técnica de 15 min incluida con Academia',
      'Acceso prioritario a clínicas de fin de semana',
    ],
    internalEvents: [
      {
        id: 'ev-r1',
        title: 'Clínica Abierta de Topspin & Saque',
        date: 'Sábado · 10:00 a. m.',
        spots: '6 / 8 cupos',
        pct: 75,
        fee: 'S/ 35',
      },
    ],
  },
  'club-tauro': {
    logo: ASSETS.clubTauro,
    cover: ASSETS.sedeTauro,
    district: 'Huancayo Centro',
    address: 'Av. Ferrocarril Norte 1180, Huancayo',
    hours: '07:00 a. m. – 10:00 p. m.',
    surface: 'Arcilla Competitiva',
    courtsCount: 4,
    dayRate: 32,
    nightRate: 42,
    vipDayRate: 26,
    vipNightRate: 36,
    whatsapp: '51964501220',
    bookingUrl: '',
    gallery: [
      { url: ASSETS.sedeTauro, caption: 'Canchas competitivas · Club Tauro Tenis' },
      { url: ASSETS.torneoMasterTop8, caption: 'Iluminación nocturna LED de torneo' },
    ],
    videos: [
      {
        id: 'v-tauro-1',
        title: 'Ambiente de Retos Nocturnos · Club Tauro',
        duration: '0:25',
        url: ASSETS.videoCircuito3,
        poster: ASSETS.sedeTauro,
      },
    ],
    facilities: [
      { icon: 'club', title: '4 canchas rápidas', detail: 'Arcilla firme con líneas reglamentarias' },
      { icon: 'sun', title: 'Reflectores LED', detail: 'Visibilidad nítida para partidos nocturnos' },
      { icon: 'trophy', title: 'Sede de Relámpagos', detail: 'Torneos cortos todos los meses' },
      { icon: 'shield', title: 'Ubicación céntrica', detail: 'Acceso rápido y zona de descanso' },
    ],
    promos: [
      {
        id: 'pr-t1',
        tag: 'NOCTURNO',
        title: 'Cierre Nocturno (9 p. m. – 10 p. m.)',
        schedule: 'Lun a Jue · Último turno LED',
        priceText: 'S/ 35 / hora',
      },
    ],
    vipBenefits: [
      'Tarifa fija VIP S/ 26 día · S/ 36 noche con luz LED',
      'Sin recargo al reprogramar por lluvia con 2 horas de aviso',
      'Inscripción preferencial en Relámpagos Nocturnos',
    ],
    internalEvents: [
      {
        id: 'ev-t1',
        title: 'Americano Nocturno de 4ª y 5ª A',
        date: 'Jueves · 8:00 p. m.',
        spots: '12 / 16 cupos',
        pct: 75,
        fee: 'S/ 30',
      },
    ],
  },
  'club-inkas': {
    logo: ASSETS.clubInkas,
    cover: ASSETS.sedeInkas,
    district: 'San Carlos',
    address: 'Jr. Los Eucaliptos 290, San Carlos, Huancayo',
    hours: '06:30 a. m. – 08:30 p. m.',
    surface: 'Arcilla Campestre',
    courtsCount: 3,
    dayRate: 28,
    nightRate: 38,
    vipDayRate: 22,
    vipNightRate: 32,
    whatsapp: '51964708811',
    bookingUrl: '',
    gallery: [
      { url: ASSETS.sedeInkas, caption: 'Canchas rodeadas de eucaliptos · Los Inkas' },
      { url: ASSETS.torneoAltura, caption: 'Vista despejada de mañana en San Carlos' },
    ],
    videos: [
      {
        id: 'v-inkas-1',
        title: 'Mañanas de Arcilla en Club Los Inkas',
        duration: '0:24',
        url: ASSETS.videoCircuito4,
        poster: ASSETS.sedeInkas,
      },
    ],
    facilities: [
      { icon: 'club', title: '3 pistas rodeadas de verde', detail: 'Entorno natural protegido del viento' },
      { icon: 'sun', title: 'Sol de mañana ideal', detail: 'Temperatura agradable desde las 7 a. m.' },
      { icon: 'users', title: 'Ambiente familiar', detail: 'Área social y espacio para acompañantes' },
      { icon: 'shield', title: 'Parqueo interior', detail: 'Ingreso seguro directo a las canchas' },
    ],
    promos: [
      {
        id: 'pr-i1',
        tag: 'MAÑANA',
        title: 'Madrugadores Los Inkas',
        schedule: 'Lun a Vie · 06:30 a. m. – 09:00 a. m.',
        priceText: 'S/ 22 / hora',
      },
    ],
    vipBenefits: [
      'Tarifa Socio VIP desde S/ 22 la hora en turno diurno',
      'Descuento en reservas continuas de fin de semana',
      'Acceso libre a zona de calentamiento y peloteo en frontón',
    ],
    internalEvents: [
      {
        id: 'ev-i1',
        title: 'Encuentro Social Damas & Mixto',
        date: 'Domingo · 9:30 a. m.',
        spots: '8 / 12 cupos',
        pct: 67,
        fee: 'S/ 25',
      },
    ],
  },
};

const COACH_ENRICHMENT_LIST = [
  {
    id: 'coach-romina',
    matchKeys: ['romina', 'cutipa'],
    name: 'Romina Cutipa',
    role: 'Head Coach · Directora de Academia',
    clubName: 'Academia Romina Cutipa',
    whatsapp: '51964201001',
    photo: ASSETS.portadaTipsSemana,
    accent: '#00DC7D',
    experience: '10 años',
    studentsCount: '65+ alumnos',
    rating: '4.9',
    availableToday: true,
    bio: 'Especialista en técnica limpia sobre arcilla, corrección biomecánica de derecha/revés y preparación competitiva para damas y varones.',
    specialties: ['Técnica & Biomecánica', 'Topspin en Arcilla', 'Táctica Competitiva'],
    gallery: [
      { url: ASSETS.portadaTipsSemana, caption: 'Corrección de empuñadura y punto de impacto' },
      { url: ASSETS.sedeRomina, caption: 'Sesión en Academia Romina Cutipa' },
      { url: ASSETS.portadaAcademiaTv, caption: 'Trabajo de efecto y control en altura' },
    ],
    videos: [
      {
        id: 'vid-romina-1',
        title: 'Tip Gratis: Cómo controlar la pelota en altura',
        duration: '0:42',
        url: ASSETS.videoCoachRomina,
        poster: ASSETS.portadaTipsSemana,
        isFree: true,
        gemsCost: 0,
      },
      {
        id: 'vid-romina-2',
        title: 'Masterclass: Derecha pesada con Topspin',
        duration: '2:15',
        url: ASSETS.videoCircuito2,
        poster: ASSETS.portadaAcademiaTv,
        isFree: false,
        gemsCost: 45,
      },
    ],
    packages: [
      {
        id: 'pk-r1',
        type: 'PRIVADA 1 A 1',
        tag: 'MÁS PEDIDA',
        title: 'Sesión Técnica Personalizada (60 min)',
        desc: 'Diagnóstico + corrección en vivo + video corto de feedback.',
        priceRegular: 60,
        priceVip: 50,
        spotsFilled: null,
        spotsMax: null,
      },
      {
        id: 'pk-r2',
        type: 'GRUPAL',
        tag: '3/4 CUPOS',
        title: 'Entrenamiento Grupal Nivel 5ª A / 4ª',
        desc: 'Peloteo intenso, situaciones de partido y juego de pies.',
        priceRegular: 30,
        priceVip: 25,
        spotsFilled: 3,
        spotsMax: 4,
      },
      {
        id: 'pk-r3',
        type: 'PACK MENSUAL',
        tag: 'AHORRA S/ 80',
        title: 'Plan Pro 8 Clases Privadas / Mes',
        desc: 'Seguimiento mensual de ascenso de categoría + video análisis.',
        priceRegular: 400,
        priceVip: 350,
        spotsFilled: null,
        spotsMax: null,
      },
    ],
    schedule: [
      { id: 'hs-r1', day: 'Hoy', time: '05:00 p. m.', status: 'open' },
      { id: 'hs-r2', day: 'Hoy', time: '07:00 p. m.', status: 'open' },
      { id: 'hs-r3', day: 'Mañana', time: '08:00 a. m.', status: 'open' },
      { id: 'hs-r4', day: 'Mañana', time: '06:00 p. m.', status: 'few' },
      { id: 'hs-r5', day: 'Jueves', time: '07:00 p. m.', status: 'open' },
      { id: 'hs-r6', day: 'Sábado', time: '09:00 a. m.', status: 'open' },
    ],
  },
  {
    id: 'coach-rodrigo',
    matchKeys: ['rodrigo', 'quispe', 'villavicencio'],
    name: 'Rodrigo Quispe',
    role: 'Coach Competitivo · Ex Top Regional',
    clubName: 'Country Club Los Huancas',
    whatsapp: '51964202002',
    photo: ASSETS.portadaAcademiaTv,
    accent: '#E5C16C',
    experience: '8 años',
    studentsCount: '48+ alumnos',
    rating: '4.9',
    availableToday: true,
    bio: 'Enfoque 100 % práctico para ganar partidos reales: construcción de puntos, primer saque consistente y sparring de ritmo alto.',
    specialties: ['Sparring Competitivo', 'Primer Saque', 'Mentalidad en Tie-Break'],
    gallery: [
      { url: ASSETS.portadaAcademiaTv, caption: 'Entrenamiento de impacto y aceleración' },
      { url: ASSETS.sedeCountry, caption: 'Cancha Central Country Club Los Huancas' },
    ],
    videos: [
      {
        id: 'vid-rodrigo-1',
        title: 'Tip Gratis: 3 claves para no fallar el 2º saque',
        duration: '0:38',
        url: ASSETS.videoCoachRodrigo,
        poster: ASSETS.portadaAcademiaTv,
        isFree: true,
        gemsCost: 0,
      },
      {
        id: 'vid-rodrigo-2',
        title: 'Masterclass: Cómo cerrar partidos en 3er set',
        duration: '2:40',
        url: ASSETS.videoCircuito1,
        poster: ASSETS.sedeCountry,
        isFree: false,
        gemsCost: 50,
      },
    ],
    packages: [
      {
        id: 'pk-rd1',
        type: 'SPARRING + COACH',
        tag: 'COMPETITIVO',
        title: 'Sparring Táctico + Corrección (60 min)',
        desc: 'Sets con lectura táctica real para preparar retos oficiales.',
        priceRegular: 65,
        priceVip: 55,
        spotsFilled: null,
        spotsMax: null,
      },
      {
        id: 'pk-rd2',
        type: 'CLÍNICA SAQUE',
        tag: '2/4 CUPOS',
        title: 'Clínica Intensiva de Saque y Resto',
        desc: 'Mecánica de lanzamiento, slice abierto y devolución profunda.',
        priceRegular: 35,
        priceVip: 28,
        spotsFilled: 2,
        spotsMax: 4,
      },
      {
        id: 'pk-rd3',
        type: 'PACK 4 SESIONES',
        tag: 'AHORRA S/ 40',
        title: 'Pack Quincenal Ascenso de Categoría',
        desc: '4 sesiones privadas enfocadas en tu siguiente categoría.',
        priceRegular: 220,
        priceVip: 190,
        spotsFilled: null,
        spotsMax: null,
      },
    ],
    schedule: [
      { id: 'hs-rd1', day: 'Hoy', time: '06:00 p. m.', status: 'open' },
      { id: 'hs-rd2', day: 'Mañana', time: '07:00 a. m.', status: 'open' },
      { id: 'hs-rd3', day: 'Mañana', time: '08:00 p. m.', status: 'open' },
      { id: 'hs-rd4', day: 'Viernes', time: '05:00 p. m.', status: 'few' },
      { id: 'hs-rd5', day: 'Sábado', time: '10:30 a. m.', status: 'open' },
    ],
  },
  {
    id: 'coach-carlos',
    matchKeys: ['carlos', 'mendoza', 'mendez'],
    name: 'Carlos Mendoza',
    role: 'Coach Formativo · Especialista Principiantes',
    clubName: 'Club Tauro Tenis',
    whatsapp: '51964203003',
    photo: ASSETS.sedeTauro,
    accent: '#DE8566',
    experience: '7 años',
    studentsCount: '52+ alumnos',
    rating: '4.8',
    availableToday: false,
    bio: 'Metodología clara y sin frustración para pasar de nivel cero a jugar tus primeros partidos completos en menos de 6 semanas.',
    specialties: ['Desde Cero (5ª P / 5ª B)', 'Juego de Pies', 'Dobles Recreativo'],
    gallery: [
      { url: ASSETS.sedeTauro, caption: 'Pistas de arcilla Club Tauro Tenis' },
      { url: ASSETS.torneoDoblesValle, caption: 'Clases grupales de iniciación y dobles' },
    ],
    videos: [
      {
        id: 'vid-carlos-1',
        title: 'Tip Gratis: Empuñadura fácil para empezar hoy',
        duration: '0:45',
        url: ASSETS.videoCoach3,
        poster: ASSETS.sedeTauro,
        isFree: true,
        gemsCost: 0,
      },
    ],
    packages: [
      {
        id: 'pk-c1',
        type: 'INICIACIÓN',
        tag: 'NIVEL CERO',
        title: 'Clase Inicial 1 a 1 (Raqueta incluida)',
        desc: 'Te prestamos raqueta y pelotas para que pruebes sin invertir.',
        priceRegular: 50,
        priceVip: 42,
        spotsFilled: null,
        spotsMax: null,
      },
      {
        id: 'pk-c2',
        type: 'GRUPAL MIXTO',
        tag: '3/6 CUPOS',
        title: 'Grupo Recreativo Tardes',
        desc: 'Ambiente amigable, drills dinámicos y puntos cortos.',
        priceRegular: 25,
        priceVip: 20,
        spotsFilled: 3,
        spotsMax: 6,
      },
    ],
    schedule: [
      { id: 'hs-c1', day: 'Mañana', time: '04:00 p. m.', status: 'open' },
      { id: 'hs-c2', day: 'Miércoles', time: '06:00 p. m.', status: 'open' },
      { id: 'hs-c3', day: 'Viernes', time: '06:00 p. m.', status: 'open' },
      { id: 'hs-c4', day: 'Domingo', time: '09:00 a. m.', status: 'open' },
    ],
  },
  {
    id: 'coach-diego',
    matchKeys: ['diego', 'salazar', 'inkas', 'andres'],
    name: 'Diego Salazar',
    role: 'Preparador Físico & Coach de Cancha',
    clubName: 'Club Los Inkas',
    whatsapp: '51964204004',
    photo: ASSETS.sedeInkas,
    accent: '#60A5FA',
    experience: '6 años',
    studentsCount: '35+ alumnos',
    rating: '4.8',
    availableToday: true,
    bio: 'Combina tenis de fondo con agilidad, prevención de lesiones y resistencia física adaptada a la altura de Huancayo.',
    specialties: ['Físico en Altura', 'Prevención de Lesiones', 'Revés & Defensa'],
    gallery: [
      { url: ASSETS.sedeInkas, caption: 'Entrenamiento matutino en Club Los Inkas' },
      { url: ASSETS.torneoAltura, caption: 'Acondicionamiento en arcilla' },
    ],
    videos: [
      {
        id: 'vid-diego-1',
        title: 'Tip Gratis: Calentamiento de 3 min antes de sacar',
        duration: '0:40',
        url: ASSETS.videoCoach4,
        poster: ASSETS.sedeInkas,
        isFree: true,
        gemsCost: 0,
      },
    ],
    packages: [
      {
        id: 'pk-d1',
        type: 'TENIS + FÍSICO',
        tag: 'INTEGRAL',
        title: 'Sesión Técnica + Desplazamiento (60 min)',
        desc: 'Mejora tu llegada a bolas abiertas y cuida rodillas/hombro.',
        priceRegular: 55,
        priceVip: 45,
        spotsFilled: null,
        spotsMax: null,
      },
      {
        id: 'pk-d2',
        type: 'PACK 6 CLASES',
        tag: 'AHORRA S/ 45',
        title: 'Bono Físico & Cancha (6 sesiones)',
        desc: 'Ideal para preparar torneos de fin de semana.',
        priceRegular: 285,
        priceVip: 245,
        spotsFilled: null,
        spotsMax: null,
      },
    ],
    schedule: [
      { id: 'hs-d1', day: 'Hoy', time: '04:30 p. m.', status: 'open' },
      { id: 'hs-d2', day: 'Jueves', time: '07:30 a. m.', status: 'open' },
      { id: 'hs-d3', day: 'Sábado', time: '08:00 a. m.', status: 'open' },
    ],
  },
];

/* ==========================================================================
   HELPERS DE HIDRATACIÓN SEGURA (RESPETA SUPABASE · RELLENA SI LLEGA VACÍO)
   ========================================================================== */
function appendUtm(url = '', sourceTag = 'club') {
  const clean = String(url || '').trim();
  if (!/^https?:\/\//i.test(clean)) return '';
  try {
    const u = new URL(clean);
    if (!u.searchParams.has('utm_source')) {
      u.searchParams.set('utm_source', 'totaltenis');
      u.searchParams.set('utm_medium', sourceTag);
    }
    return u.toString();
  } catch {
    return clean;
  }
}

function getWeatherObj(key) {
  const norm = String(key || 'seco').toLowerCase();
  return (
    WEATHER_CONDITIONS.find((w) => w.key === norm) ||
    WEATHER_CONDITIONS.find((w) => norm.includes(w.key)) ||
    WEATHER_CONDITIONS[0]
  );
}

function enrichClub(raw, idx = 0) {
  const id = raw?.id || `club-${idx + 1}`;
  const lookupKey =
    id === 'club-cutipa'
      ? 'club-romina'
      : CLUB_ENRICHMENT_MAP[id]
      ? id
      : Object.keys(CLUB_ENRICHMENT_MAP)[idx % 4];
  const seed = CLUB_ENRICHMENT_MAP[lookupKey] || CLUB_ENRICHMENT_MAP['club-country'];

  const rawGallery =
    Array.isArray(raw?.gallery) && raw.gallery.length > 0
      ? raw.gallery
      : Array.isArray(raw?.galeria) && raw.galeria.length > 0
      ? raw.galeria
      : seed.gallery;

  const gallery = rawGallery.map((g, i) =>
    typeof g === 'string'
      ? { url: g, caption: `${raw?.name || 'Sede'} · Vista ${i + 1}` }
      : { url: g.url || g.image || seed.cover, caption: g.caption || g.title || '' }
  );

  const videos = Array.isArray(raw?.videos) && raw.videos.length > 0 ? raw.videos : seed.videos;

  const rawPromos =
    Array.isArray(raw?.promos) && raw.promos.length > 0
      ? raw.promos
      : Array.isArray(raw?.promosHorasValle) && raw.promosHorasValle.length > 0
      ? raw.promosHorasValle
      : seed.promos;

  const rawEvents =
    Array.isArray(raw?.internalEvents) && raw.internalEvents.length > 0
      ? raw.internalEvents
      : Array.isArray(raw?.torneosInternos) && raw.torneosInternos.length > 0
      ? raw.torneosInternos
      : seed.internalEvents;

  const rawVip =
    Array.isArray(raw?.vipBenefits) && raw.vipBenefits.length > 0
      ? raw.vipBenefits
      : seed.vipBenefits;

  const rates = raw?.rates || raw?.tarifas || {};
  const dayRate = Number(raw?.dayRate ?? rates.day ?? rates.dia ?? seed.dayRate) || seed.dayRate;
  const nightRate =
    Number(raw?.nightRate ?? rates.night ?? rates.noche ?? seed.nightRate) || seed.nightRate;
  const vipDayRate =
    Number(raw?.vipDayRate ?? rates.vipDay ?? rates.vipDia ?? seed.vipDayRate) ||
    Math.max(15, dayRate - 6);
  const vipNightRate =
    Number(raw?.vipNightRate ?? rates.vipNight ?? rates.vipNoche ?? seed.vipNightRate) ||
    Math.max(20, nightRate - 8);

  const condKey = raw?.climaBase?.conditionKey || raw?.weatherCondition || raw?.weather || 'seco';
  const weather = getWeatherObj(condKey);

  const mapsUrl =
    raw?.mapsUrl ||
    raw?.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${raw?.name || 'Club de Tenis'} Huancayo Peru`
    )}`;

  return {
    id,
    name: raw?.name || 'Sede Oficial',
    shortName: raw?.shortName || raw?.name || 'Sede',
    district: raw?.district || seed.district,
    address: raw?.address || seed.address,
    hours: raw?.hours || raw?.schedule || seed.hours,
    surface: raw?.surface || seed.surface,
    courtsCount: Number(raw?.courtsCount) || seed.courtsCount,
    logo: raw?.logo || raw?.logoUrl || seed.logo,
    cover: raw?.cover || raw?.coverUrl || raw?.image || seed.cover,
    whatsapp: raw?.whatsapp || raw?.phone || seed.whatsapp,
    mapsUrl,
    bookingUrl: raw?.bookingUrl || raw?.externalBookingUrl || seed.bookingUrl || '',
    dayRate,
    nightRate,
    vipDayRate,
    vipNightRate,
    weather,
    gallery,
    videos,
    facilities: seed.facilities,
    promos: rawPromos,
    vipBenefits: rawVip,
    internalEvents: rawEvents,
  };
}

function enrichCoach(raw, idx = 0) {
  const hay = `${raw?.id || ''} ${raw?.name || ''}`.toLowerCase();
  const seed =
    COACH_ENRICHMENT_LIST.find((s) => s.matchKeys.some((k) => hay.includes(k))) ||
    COACH_ENRICHMENT_LIST[idx % COACH_ENRICHMENT_LIST.length];

  const rawVideos =
    Array.isArray(raw?.videos) && raw.videos.length > 0
      ? raw.videos
      : Array.isArray(raw?.videosEnCancha) && raw.videosEnCancha.length > 0
      ? raw.videosEnCancha
      : seed.videos;

  const videos = rawVideos.map((v, i) => ({
    id: v.id || `${raw?.id || seed.id}-v-${i}`,
    title: v.title || v.titulo || 'Clip en cancha',
    duration: v.duration || v.duracion || '0:45',
    url: v.url || v.videoUrl || seed.videos[0]?.url || ASSETS.videoCoachRomina,
    poster: v.poster || v.thumbnail || seed.photo,
    isFree: v.isFree !== false && !(Number(v.gemsCost) > 0),
    gemsCost: Number(v.gemsCost) || 0,
  }));

  const rawPackages =
    Array.isArray(raw?.packages) && raw.packages.length > 0
      ? raw.packages
      : Array.isArray(raw?.modalidades) && raw.modalidades.length > 0
      ? raw.modalidades
      : Array.isArray(raw?.programs) && raw.programs.length > 0
      ? raw.programs
      : seed.packages;

  const packages = rawPackages.map((pk, i) => ({
    id: pk.id || `pk-${i}`,
    type: String(pk.type || pk.tipo || 'SESIÓN').toUpperCase(),
    tag: String(pk.tag || pk.badge || '').toUpperCase(),
    title: pk.title || pk.name || pk.nombre || 'Sesión Técnica',
    desc: pk.desc || pk.description || pk.detalle || 'Entrenamiento práctico en cancha.',
    priceRegular: Number(pk.priceRegular ?? pk.price ?? pk.precio ?? 60) || 60,
    priceVip:
      Number(
        pk.priceVip ??
          pk.precioVip ??
          Math.max(20, (Number(pk.priceRegular ?? pk.price ?? 60) || 60) - 10)
      ) || 50,
    spotsFilled: pk.spotsFilled ?? pk.inscritos ?? null,
    spotsMax: pk.spotsMax ?? pk.cupos ?? null,
  }));

  const rawSchedule =
    Array.isArray(raw?.schedule) && raw.schedule.length > 0
      ? raw.schedule
      : Array.isArray(raw?.horariosSemanales) && raw.horariosSemanales.length > 0
      ? raw.horariosSemanales
      : Array.isArray(raw?.groups) && raw.groups.length > 0
      ? raw.groups
      : seed.schedule;

  const schedule = rawSchedule.map((slot, i) => ({
    id: slot.id || `sl-${i}`,
    day: slot.day || slot.dia || 'Esta semana',
    time: slot.time || slot.hora || slot.schedule || '06:00 p. m.',
    status: slot.status || 'open',
  }));

  const rawSpecialties =
    Array.isArray(raw?.specialties) && raw.specialties.length > 0
      ? raw.specialties
      : Array.isArray(raw?.especialidades) && raw.especialidades.length > 0
      ? raw.especialidades
      : seed.specialties;

  const rawGallery =
    Array.isArray(raw?.gallery) && raw.gallery.length > 0 ? raw.gallery : seed.gallery;

  const minPrice = Math.min(...packages.map((p) => p.priceRegular));
  const minVipPrice = Math.min(...packages.map((p) => p.priceVip));

  return {
    id: raw?.id || seed.id,
    name: raw?.name || seed.name,
    role: raw?.role || raw?.title || seed.role,
    clubName: raw?.clubName || raw?.club || seed.clubName,
    whatsapp: raw?.whatsapp || raw?.phone || seed.whatsapp,
    photo: raw?.photo || raw?.photoUrl || raw?.avatar || seed.photo,
    accent: raw?.accent || raw?.accentColor || raw?.temaColor || seed.accent,
    experience: raw?.experience || seed.experience,
    studentsCount: raw?.studentsCount || seed.studentsCount,
    rating: raw?.rating || seed.rating,
    availableToday:
      raw?.availableToday !== undefined ? Boolean(raw.availableToday) : seed.availableToday,
    bio: raw?.bio || raw?.description || seed.bio,
    specialties: rawSpecialties,
    gallery: rawGallery,
    videos,
    packages,
    schedule,
    minPrice,
    minVipPrice,
  };
}

/* ==========================================================================
   VISTA PRINCIPAL: SedesView
   (CLUBES & COACHES FLAGSHIP · ACABADO 3D TÁCTIL + LIQUID GLASS + SIN CÓDIGO VIP)
   ========================================================================== */
export default function SedesView({
  clubs = INITIAL_CLUBS,
  coaches = [],
  currentUser = null,
  theme = 'dark',
  onReportClubWeather,
  onUnlockMasterclassVideo,
  onOpenPartnerPortal,
  onOpenVipCard,
  onOpenAuth,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState('sedes'); // 'sedes' | 'coaches'

  // Estado Modal Club
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [clubMediaMode, setClubMediaMode] = useState('photos'); // 'photos' | 'video'
  const [clubSlideIdx, setClubSlideIdx] = useState(0);
  const [clubInnerTab, setClubInnerTab] = useState('canchas'); // 'canchas' | 'vip' | 'reservar'

  // Estado Modal Coach
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [coachMediaMode, setCoachMediaMode] = useState('videos'); // 'videos' | 'photos'
  const [coachInnerTab, setCoachInnerTab] = useState('packs'); // 'packs' | 'horarios'
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  const isVip = Boolean(currentUser?.isVip);
  const isLight = theme === 'light';
  const modeClass = isLight ? 'is-light' : 'is-dark';

  const unlockedVideos = useMemo(
    () => (Array.isArray(currentUser?.unlockedVideos) ? currentUser.unlockedVideos : []),
    [currentUser?.unlockedVideos]
  );

  const enrichedClubs = useMemo(() => {
    const src = Array.isArray(clubs) && clubs.length > 0 ? clubs : INITIAL_CLUBS;
    return src.map((c, idx) => enrichClub(c, idx));
  }, [clubs]);

  const enrichedCoaches = useMemo(() => {
    const src =
      Array.isArray(coaches) && coaches.length > 0 ? coaches : COACH_ENRICHMENT_LIST;
    return src.map((c, idx) => enrichCoach(c, idx));
  }, [coaches]);

  const selectedClub = useMemo(
    () => enrichedClubs.find((c) => c.id === selectedClubId) || null,
    [enrichedClubs, selectedClubId]
  );

  const selectedCoach = useMemo(
    () => enrichedCoaches.find((c) => c.id === selectedCoachId) || null,
    [enrichedCoaches, selectedCoachId]
  );

  useEffect(() => {
    if (!selectedCoach) return;
    setSelectedPackId(selectedCoach.packages[0]?.id || null);
    setSelectedSlotId(selectedCoach.schedule[0]?.id || null);
    setCoachMediaMode('videos');
    setCoachInnerTab('packs');
    setPlayingVideo(null);
  }, [selectedCoachId]);

  const openClubModal = (club) => {
    triggerHaptic('medium');
    setSelectedClubId(club.id);
    setClubMediaMode('photos');
    setClubSlideIdx(0);
    setClubInnerTab('canchas');
  };

  const openCoachModal = (coach) => {
    triggerHaptic('medium');
    setSelectedCoachId(coach.id);
  };

  const handleWeatherTap = (club, condKey) => {
    if (!currentUser) {
      triggerHaptic('light');
      if (onNotify) {
        onNotify('Inicia sesión para reportar el estado de cancha y ganar +3 Gemas.', 'info');
      }
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    triggerHaptic('success');
    if (onReportClubWeather) {
      onReportClubWeather({ clubId: club.id, conditionKey: condKey });
    }
  };

  const handlePlayCoachVideo = (video) => {
    triggerHaptic('medium');
    const isUnlocked =
      video.isFree || isVip || unlockedVideos.includes(video.id) || video.gemsCost <= 0;

    if (isUnlocked) {
      setPlayingVideo(video);
      return;
    }

    if (!currentUser) {
      if (onNotify) onNotify('Inicia sesión para desbloquear esta Masterclass con Gemas.', 'info');
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const myGems = Number(currentUser.gems) || 0;
    if (myGems < video.gemsCost) {
      triggerHaptic('warning');
      if (onNotify) {
        onNotify(
          `Te faltan ${video.gemsCost - myGems} 💎 para esta Masterclass (Gratis con Socio VIP).`,
          'warning'
        );
      }
      return;
    }

    if (onUnlockMasterclassVideo) {
      onUnlockMasterclassVideo({
        videoId: video.id,
        gemsCost: video.gemsCost,
        title: video.title,
      });
    }
    setPlayingVideo(video);
    triggerHaptic('success');
    if (onNotify) onNotify('¡Masterclass desbloqueada! Disfruta la sesión.', 'success');
  };

  const handleReserveCoachClass = () => {
    if (!selectedCoach) return;
    const pack =
      selectedCoach.packages.find((p) => p.id === selectedPackId) || selectedCoach.packages[0];
    const slot =
      selectedCoach.schedule.find((s) => s.id === selectedSlotId) || selectedCoach.schedule[0];
    const effectivePrice = isVip ? pack?.priceVip : pack?.priceRegular;

    const lines = [
      `Hola Coach ${selectedCoach.name}, te escribo desde TOTAL TENIS:`,
      pack ? `• Modalidad: ${pack.title}` : '',
      slot ? `• Horario que me interesa: ${slot.day} · ${slot.time}` : '',
      effectivePrice
        ? `• Tarifa vista en app: S/ ${effectivePrice} (${isVip ? 'Socio VIP' : 'Regular'})`
        : '',
      currentUser?.name ? `• Jugador: ${currentUser.name}` : '',
      '¿Tienes disponibilidad para confirmar?',
    ].filter(Boolean);

    triggerHaptic('success');
    window.open(
      buildWhatsappLink(selectedCoach.whatsapp || APP_CONFIG.supportWhatsApp, lines.join('\n')),
      '_blank',
      'noopener,noreferrer'
    );
  };

  const activePack = selectedCoach
    ? selectedCoach.packages.find((p) => p.id === selectedPackId) || selectedCoach.packages[0]
    : null;
  const activeSlot = selectedCoach
    ? selectedCoach.schedule.find((s) => s.id === selectedSlotId) || selectedCoach.schedule[0]
    : null;

  return (
    <section
      className={`tt-sedes-view ${modeClass}`}
      aria-label="Sedes Oficiales y Entrenadores TOTAL TENIS"
    >
      {/* ====================================================================
          1. CONMUTADOR PRINCIPAL 3D TÁCTIL (SEDES OFICIALES | COACHES PRO)
          ==================================================================== */}
      <div className="tt-sd-3d-dock" role="tablist" aria-label="Sedes o Entrenadores">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sedes'}
          className={`tt-sd-3d-tab ${activeTab === 'sedes' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('sedes');
          }}
        >
          <TTIcon name="club" size={16} />
          <span>Sedes ({enrichedClubs.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'coaches'}
          className={`tt-sd-3d-tab ${activeTab === 'coaches' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('coaches');
          }}
        >
          <TTIcon name="users" size={16} />
          <span>Coaches ({enrichedCoaches.length})</span>
        </button>
      </div>

      {/* ====================================================================
          2. CINTA ESTUDIO ALIADO 3D (B2B DIRECTO PARA CLUBES Y COACHES)
          ==================================================================== */}
      {onOpenPartnerPortal && (
        <button
          type="button"
          className="tt-partner-3d-strip"
          onClick={() => {
            triggerHaptic('medium');
            onOpenPartnerPortal();
          }}
        >
          <IconBadge name="settings" variant="purple" size={34} />
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <strong>¿Gestionas un Club o eres Coach?</strong>
            <small>Actualiza tarifas, horarios libres, fotos y videos desde Estudio Aliado</small>
          </div>
          <span className="tt-partner-strip-cta">Entrar ›</span>
        </button>
      )}

      {/* ====================================================================
          3A. CATÁLOGO DE SEDES OFICIALES (TARJETAS 3D CON VOLUMEN Y BRILLO)
          ==================================================================== */}
      {activeTab === 'sedes' && (
        <div key="tab-sedes" className="tt-sd-grid tt-sd-enter">
          {enrichedClubs.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin sedes disponibles"
              description="Pronto sumaremos más clubes aliados al circuito."
            />
          ) : (
            enrichedClubs.map((club, idx) => (
              <article
                key={club.id}
                className="tt-club-card"
                style={{ '--sd-delay': `${idx * 55}ms` }}
                onClick={() => openClubModal(club)}
              >
                <div className="tt-cc-hero">
                  <SmartImage
                    src={club.cover}
                    fallbackSrc={ASSETS.torneoApertura}
                    alt={club.name}
                    priority={idx < 2}
                    className="tt-cc-bg"
                  />
                  <div className="tt-cc-scrim" />

                  <div className="tt-cc-top-row">
                    <span className={`tt-cc-weather-pill is-${club.weather.tone}`}>
                      <SmartImage
                        src={club.weather.image}
                        alt={club.weather.shortLabel}
                        style={{ width: 18, height: 18, objectFit: 'contain' }}
                      />
                      <span>
                        {club.weather.shortLabel} · {club.weather.temp}
                      </span>
                    </span>

                    {club.videos.length > 0 && (
                      <span className="tt-cc-video-chip">
                        <TTIcon name="play" size={12} />
                        Video Tour
                      </span>
                    )}
                  </div>

                  <div className="tt-cc-bottom-row">
                    <div className="tt-cc-crest">
                      <SmartImage
                        src={club.logo}
                        alt={club.shortName}
                        initials={club.shortName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="tt-cc-district">
                        {club.district} · {club.courtsCount} canchas · {club.surface}
                      </span>
                      <h2 className="tt-cc-title">{club.name}</h2>
                    </div>
                  </div>
                </div>

                <div className="tt-cc-body">
                  <div className="tt-cc-rates-strip">
                    <div className="tt-cc-rate-tile">
                      <small>DÍA</small>
                      <strong>S/ {club.dayRate}</strong>
                    </div>
                    <div className="tt-cc-rate-tile">
                      <small>NOCHE LED</small>
                      <strong>S/ {club.nightRate}</strong>
                    </div>
                    <div className="tt-cc-rate-tile is-vip">
                      <small>SOCIO VIP</small>
                      <strong>
                        S/ {club.vipDayRate}–{club.vipNightRate}
                      </strong>
                    </div>
                  </div>

                  <div className="tt-cc-foot">
                    <span className="tt-cc-promo-hint">
                      {club.promos[0]
                        ? `${club.promos[0].tag}: ${club.promos[0].priceText}`
                        : club.hours}
                    </span>
                    <span className="tt-cc-open-3d">Explorar Sede ›</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* ====================================================================
          3B. VITRINA DE COACHES PRO (TARJETAS 3D CON ACENTO LUMINOSO)
          ==================================================================== */}
      {activeTab === 'coaches' && (
        <div key="tab-coaches" className="tt-sd-grid tt-sd-enter">
          {enrichedCoaches.length === 0 ? (
            <EmptyStateCard
              theme={theme}
              title="Sin entrenadores publicados"
              description="Pronto sumaremos entrenadores oficiales al directorio."
            />
          ) : (
            enrichedCoaches.map((coach, idx) => (
              <article
                key={coach.id}
                className="tt-coach-card"
                style={{ '--sd-delay': `${idx * 55}ms`, '--coach-accent': coach.accent }}
                onClick={() => openCoachModal(coach)}
              >
                <div className="tt-co-hero">
                  <SmartImage
                    src={coach.photo}
                    fallbackSrc={ASSETS.portadaTipsSemana}
                    alt={coach.name}
                    className="tt-co-bg"
                  />
                  <div className="tt-co-scrim" />

                  <div className="tt-co-top-row">
                    {coach.availableToday ? (
                      <span className="tt-co-avail-pill is-today">
                        <i />
                        Libre hoy
                      </span>
                    ) : (
                      <span className="tt-co-avail-pill">Ver horarios</span>
                    )}

                    <span className="tt-co-media-pill">
                      <TTIcon name="video" size={12} />
                      {coach.videos.length} {coach.videos.length === 1 ? 'video' : 'videos'}
                    </span>
                  </div>

                  <div className="tt-co-bottom-row">
                    <span className="tt-co-role">{coach.role}</span>
                    <h2 className="tt-co-name">{coach.name}</h2>
                    <span className="tt-co-club">
                      <TTIcon name="mapPin" size={12} />
                      {coach.clubName}
                    </span>
                  </div>
                </div>

                <div className="tt-co-body">
                  <div className="tt-co-tags-row">
                    {coach.specialties.slice(0, 3).map((sp) => (
                      <span key={sp} className="tt-co-tag">
                        {sp}
                      </span>
                    ))}
                  </div>

                  <div className="tt-co-foot">
                    <div className="tt-co-price-group">
                      <small>Desde S/ {coach.minPrice}</small>
                      <strong>VIP S/ {coach.minVipPrice}</strong>
                    </div>
                    <span className="tt-co-cta-3d">Ver Clases & Videos ›</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL 1: INTERIOR 3D DE CLUB (VIDEO TOUR + FOTOS + TABS 3D + SIN CÓDIGO VIP)
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(selectedClub)}
        onClose={() => setSelectedClubId(null)}
        title={selectedClub?.name || 'Sede Oficial'}
        subtitle={
          selectedClub
            ? `${selectedClub.district} · ${selectedClub.surface} · ${selectedClub.hours}`
            : ''
        }
        icon={
          selectedClub ? (
            <div className="tt-modal-crest">
              <SmartImage
                src={selectedClub.logo}
                alt={selectedClub.shortName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : null
        }
        isWide
      >
        {selectedClub && (
          <div className={`tt-club-modal-stack ${modeClass}`}>
            {/* 1. VISOR SUPERIOR MULTIMEDIA: FOTOS | VIDEO TOUR */}
            <div className="tt-cm-stage">
              {clubMediaMode === 'video' && selectedClub.videos[0] ? (
                <div className="tt-cm-video-wrap">
                  <video
                    key={selectedClub.videos[0].url}
                    src={selectedClub.videos[0].url}
                    poster={selectedClub.videos[0].poster || selectedClub.cover}
                    controls
                    playsInline
                    autoPlay
                    muted
                    className="tt-cm-video-el"
                  />
                </div>
              ) : (
                <>
                  <SmartImage
                    src={
                      selectedClub.gallery[clubSlideIdx % selectedClub.gallery.length]?.url ||
                      selectedClub.cover
                    }
                    fallbackSrc={selectedClub.cover}
                    alt={selectedClub.name}
                    priority
                    className="tt-cm-photo"
                  />
                  <div className="tt-cm-photo-scrim" />

                  {selectedClub.gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="tt-cm-arrow is-left"
                        aria-label="Foto anterior"
                        onClick={() => {
                          triggerHaptic('light');
                          setClubSlideIdx(
                            (prev) =>
                              (prev - 1 + selectedClub.gallery.length) %
                              selectedClub.gallery.length
                          );
                        }}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="tt-cm-arrow is-right"
                        aria-label="Foto siguiente"
                        onClick={() => {
                          triggerHaptic('light');
                          setClubSlideIdx((prev) => (prev + 1) % selectedClub.gallery.length);
                        }}
                      >
                        ›
                      </button>
                    </>
                  )}

                  <div className="tt-cm-caption">
                    <span>
                      {selectedClub.gallery[clubSlideIdx % selectedClub.gallery.length]?.caption ||
                        selectedClub.name}
                    </span>
                    {selectedClub.gallery.length > 1 && (
                      <div className="tt-cm-dots">
                        {selectedClub.gallery.map((_, i) => (
                          <i
                            key={i}
                            className={
                              i === clubSlideIdx % selectedClub.gallery.length ? 'is-on' : ''
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Switch flotante 3D: Fotos | Video Tour */}
              {selectedClub.videos.length > 0 && (
                <div className="tt-cm-media-pill" role="tablist">
                  <button
                    type="button"
                    className={clubMediaMode === 'photos' ? 'is-on' : ''}
                    onClick={() => {
                      triggerHaptic('light');
                      setClubMediaMode('photos');
                    }}
                  >
                    <TTIcon name="camera" size={13} />
                    Fotos ({selectedClub.gallery.length})
                  </button>
                  <button
                    type="button"
                    className={clubMediaMode === 'video' ? 'is-on' : ''}
                    onClick={() => {
                      triggerHaptic('medium');
                      setClubMediaMode('video');
                    }}
                  >
                    <TTIcon name="play" size={13} />
                    Video Tour
                  </button>
                </div>
              )}
            </div>

            {/* 2. PESTAÑAS INTERNAS 3D TÁCTILES DEL CLUB */}
            <div className="tt-sd-3d-dock is-three" role="tablist">
              {[
                { id: 'canchas', label: 'Canchas & Promos' },
                { id: 'vip', label: 'VIP & Clima' },
                { id: 'reservar', label: 'Reservar' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={clubInnerTab === t.id}
                  className={`tt-sd-3d-tab is-compact ${clubInnerTab === t.id ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setClubInnerTab(t.id);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* PESTAÑA A: CANCHAS, TARIFAS 3D, PROMOS LUMINOSAS Y BENTO */}
            {clubInnerTab === 'canchas' && (
              <div key="cm-canchas" className="tt-cm-panel tt-sd-enter">
                <div className="tt-rates-showcase">
                  <div className="tt-rate-3d-box">
                    <span>DÍA REGULAR</span>
                    <strong>S/ {selectedClub.dayRate}</strong>
                    <small>por hora</small>
                  </div>
                  <div className="tt-rate-3d-box">
                    <span>NOCHE LED</span>
                    <strong>S/ {selectedClub.nightRate}</strong>
                    <small>con luz</small>
                  </div>
                  <div className="tt-rate-3d-box is-vip">
                    <span>SOCIO VIP</span>
                    <strong>
                      S/ {selectedClub.vipDayRate}–{selectedClub.vipNightRate}
                    </strong>
                    <small>ahorra S/ {selectedClub.dayRate - selectedClub.vipDayRate}/h</small>
                  </div>
                </div>

                {selectedClub.promos.length > 0 && (
                  <div className="tt-cm-section">
                    <span className="tt-sd-kicker">PROMOCIONES ACTIVAS EN SEDE</span>
                    <div className="tt-promos-grid">
                      {selectedClub.promos.map((pr, i) => (
                        <div key={pr.id || i} className="tt-promo-3d-card">
                          <div className="tt-pgc-head">
                            <span className="tt-pgc-tag">{pr.tag || 'PROMO'}</span>
                            <strong className="tt-pgc-price">{pr.priceText || pr.price}</strong>
                          </div>
                          <strong className="tt-pgc-title">{pr.title}</strong>
                          <small>{pr.schedule || pr.detail}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="tt-cm-section">
                  <span className="tt-sd-kicker">EXPERIENCIA EN SEDE</span>
                  <div className="tt-bento-facilities">
                    {selectedClub.facilities.map((fac, i) => (
                      <div key={i} className="tt-bento-fac-card">
                        <IconBadge
                          name={fac.icon}
                          variant={i % 2 === 0 ? 'emerald' : 'purple'}
                          size={36}
                        />
                        <div style={{ minWidth: 0 }}>
                          <strong>{fac.title}</strong>
                          <small>{fac.detail}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA B: GOLDEN TICKET VIP + EVENTOS INTERNOS + CLIMA EN VIVO (+3 💎) */}
            {clubInnerTab === 'vip' && (
              <div key="cm-vip" className="tt-cm-panel tt-sd-enter">
                <div className="tt-golden-ticket-card">
                  <span className="tt-gt-sheen" aria-hidden="true" />
                  <div className="tt-gt-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <SmartImage
                        src={ASSETS.goldenTicket}
                        fallbackSrc={ASSETS.logo}
                        alt="Golden Ticket VIP"
                        style={{ width: 34, height: 34, objectFit: 'contain' }}
                      />
                      <div>
                        <span className="tt-gt-kicker">GOLDEN TICKET · SOCIO VIP</span>
                        <strong>Beneficios en {selectedClub.shortName}</strong>
                      </div>
                    </div>
                    {onOpenVipCard && (
                      <button
                        type="button"
                        className="tt-sd-3d-btn is-gold is-mini"
                        onClick={() => {
                          triggerHaptic('medium');
                          onOpenVipCard();
                        }}
                      >
                        Mi Carnet
                      </button>
                    )}
                  </div>

                  <div className="tt-gt-perks-grid">
                    {selectedClub.vipBenefits.map((perk, idx) => (
                      <div key={idx} className="tt-gt-perk-chip">
                        <TTIcon name="crown" size={13} style={{ color: '#E5C16C', flexShrink: 0 }} />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedClub.internalEvents.length > 0 && (
                  <div className="tt-cm-section">
                    <span className="tt-sd-kicker">EVENTOS Y AMERICANOS DEL CLUB</span>
                    {selectedClub.internalEvents.map((ev, i) => (
                      <div key={ev.id || i} className="tt-internal-event-card">
                        <div className="tt-iec-top">
                          <div>
                            <strong>{ev.title}</strong>
                            <small>{ev.date}</small>
                          </div>
                          <span className="tt-iec-fee">{ev.fee || 'Abierto'}</span>
                        </div>
                        <div className="tt-iec-bar-row">
                          <div className="tt-iec-track">
                            <div style={{ width: `${ev.pct || 65}%` }} />
                          </div>
                          <span>{ev.spots}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="tt-weather-box">
                  <div className="tt-wb-head">
                    <div>
                      <span className="tt-sd-kicker">ESTADO DE CANCHA EN VIVO · +3 💎</span>
                      <strong>
                        {selectedClub.weather.label} ({selectedClub.weather.temp})
                      </strong>
                      <small>{selectedClub.weather.note}</small>
                    </div>
                    <SmartImage
                      src={selectedClub.weather.image}
                      alt={selectedClub.weather.label}
                      style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }}
                    />
                  </div>

                  <div className="tt-weather-grid">
                    {WEATHER_CONDITIONS.map((wc) => {
                      const active = selectedClub.weather.key === wc.key;
                      return (
                        <button
                          key={wc.key}
                          type="button"
                          className={`tt-weather-3d-tile ${active ? 'is-active' : ''}`}
                          onClick={() => handleWeatherTap(selectedClub, wc.key)}
                        >
                          <SmartImage
                            src={wc.image}
                            alt={wc.shortLabel}
                            style={{ width: 32, height: 32, objectFit: 'contain' }}
                          />
                          <span>{wc.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA C: RESERVAR (WHATSAPP + MAPS + CARNET VIP 3D · SIN CÓDIGO VIP) */}
            {clubInnerTab === 'reservar' && (
              <div key="cm-reservar" className="tt-cm-panel tt-sd-enter">
                <div className="tt-address-3d-card">
                  <IconBadge name="mapPin" variant="emerald" size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{selectedClub.address}</strong>
                    <small>{selectedClub.hours}</small>
                  </div>
                </div>

                <div className="tt-vip-pass-reminder">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <IconBadge name="crown" variant="gold" size={34} />
                    <div style={{ minWidth: 0 }}>
                      <strong>¿Eres Socio VIP?</strong>
                      <small>
                        Solo muestra tu Carnet Digital 3D en recepción al llegar para aplicar tu tarifa preferencial.
                      </small>
                    </div>
                  </div>
                  {onOpenVipCard && (
                    <button
                      type="button"
                      className="tt-sd-3d-btn is-gold is-mini"
                      onClick={() => {
                        triggerHaptic('medium');
                        onOpenVipCard();
                      }}
                    >
                      Ver Carnet
                    </button>
                  )}
                </div>

                {selectedClub.bookingUrl && (
                  <a
                    href={appendUtm(selectedClub.bookingUrl, selectedClub.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tt-sd-3d-btn is-sky"
                    style={{ width: '100%' }}
                  >
                    <TTIcon name="externalLink" size={16} />
                    Reservar en Web Oficial del Club
                  </a>
                )}

                <div className="tt-club-action-pair">
                  <a
                    href={selectedClub.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tt-sd-3d-btn is-secondary"
                    style={{ flex: 1 }}
                  >
                    <TTIcon name="mapPin" size={16} />
                    Google Maps
                  </a>
                  <a
                    href={buildWhatsappLink(
                      selectedClub.whatsapp,
                      `Hola ${selectedClub.name}, te escribo desde TOTAL TENIS para reservar una cancha.${
                        isVip ? ' Soy Socio VIP.' : ''
                      }`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tt-sd-3d-btn is-emerald"
                    style={{ flex: 1.25 }}
                  >
                    <TTIcon name="whatsapp" size={17} />
                    Reservar por WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* Acceso rápido a Panel Club Aliado */}
            {onOpenPartnerPortal && (
              <button
                type="button"
                className="tt-modal-partner-foot-btn"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedClubId(null);
                  onOpenPartnerPortal();
                }}
              >
                <TTIcon name="settings" size={14} />
                <span>¿Administras {selectedClub.shortName}? Edita tarifas, fotos y promos aquí</span>
              </button>
            )}
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          MODAL 2: VITRINA INTERACTIVA 3D DE COACH PRO
          ==================================================================== */}
      <ModalPortal
        isOpen={Boolean(selectedCoach)}
        onClose={() => {
          setPlayingVideo(null);
          setSelectedCoachId(null);
        }}
        title={selectedCoach?.name || 'Entrenador Oficial'}
        subtitle={
          selectedCoach ? `${selectedCoach.role} · ${selectedCoach.clubName}` : ''
        }
        icon={<IconBadge name="users" variant="emerald" size={38} />}
        isWide
      >
        {selectedCoach && (
          <div
            className={`tt-coach-modal-stack ${modeClass}`}
            style={{ '--coach-accent': selectedCoach.accent || '#00DC7D' }}
          >
            {/* 1. HERO EDITORIAL DEL COACH + AUTORIDAD */}
            <div className="tt-chm-hero">
              <SmartImage
                src={selectedCoach.photo}
                fallbackSrc={ASSETS.portadaTipsSemana}
                alt={selectedCoach.name}
                className="tt-chm-bg"
              />
              <div className="tt-chm-scrim" />

              <div className="tt-chm-content">
                <div className="tt-chm-badges">
                  {selectedCoach.availableToday && (
                    <span className="tt-co-avail-pill is-today">
                      <i />
                      Disponible hoy
                    </span>
                  )}
                  <span className="tt-chm-stat-pill">★ {selectedCoach.rating}</span>
                  <span className="tt-chm-stat-pill">{selectedCoach.experience}</span>
                  <span className="tt-chm-stat-pill">{selectedCoach.studentsCount}</span>
                </div>

                <p className="tt-chm-bio">{selectedCoach.bio}</p>

                <div className="tt-chm-specs">
                  {selectedCoach.specialties.map((sp) => (
                    <span key={sp}>{sp}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. REPRODUCTOR ACTIVO DE VIDEO */}
            {playingVideo && (
              <div className="tt-video-theater tt-sd-enter">
                <div className="tt-vt-head">
                  <strong>{playingVideo.title}</strong>
                  <button
                    type="button"
                    className="tt-vt-close"
                    onClick={() => setPlayingVideo(null)}
                  >
                    Cerrar video ✕
                  </button>
                </div>
                <video
                  key={playingVideo.url}
                  src={playingVideo.url}
                  poster={playingVideo.poster}
                  controls
                  playsInline
                  autoPlay
                  className="tt-vt-player"
                />
              </div>
            )}

            {/* 3. CARRUSEL MULTIMEDIA: REELS EN CANCHA | FOTOS */}
            <div className="tt-cm-section">
              <div className="tt-media-header-row">
                <span className="tt-sd-kicker" style={{ margin: 0 }}>
                  CONTENIDO EN CANCHA
                </span>
                <div className="tt-mini-media-switch">
                  <button
                    type="button"
                    className={coachMediaMode === 'videos' ? 'is-on' : ''}
                    onClick={() => {
                      triggerHaptic('light');
                      setCoachMediaMode('videos');
                    }}
                  >
                    ▶ Videos ({selectedCoach.videos.length})
                  </button>
                  <button
                    type="button"
                    className={coachMediaMode === 'photos' ? 'is-on' : ''}
                    onClick={() => {
                      triggerHaptic('light');
                      setCoachMediaMode('photos');
                    }}
                  >
                    Fotos ({selectedCoach.gallery.length})
                  </button>
                </div>
              </div>

              {coachMediaMode === 'videos' ? (
                <div className="tt-reels-rail">
                  {selectedCoach.videos.map((vid) => {
                    const isUnlocked =
                      vid.isFree || isVip || unlockedVideos.includes(vid.id) || vid.gemsCost <= 0;
                    return (
                      <button
                        key={vid.id}
                        type="button"
                        className="tt-reel-card"
                        onClick={() => handlePlayCoachVideo(vid)}
                      >
                        <SmartImage
                          src={vid.poster}
                          fallbackSrc={selectedCoach.photo}
                          alt={vid.title}
                          className="tt-reel-poster"
                        />
                        <div className="tt-reel-scrim" />
                        <span className={`tt-reel-tag ${isUnlocked ? 'is-free' : 'is-lock'}`}>
                          {vid.isFree
                            ? 'TIP GRATIS'
                            : isUnlocked
                            ? 'DESBLOQUEADO'
                            : `${vid.gemsCost} 💎 · VIP Gratis`}
                        </span>
                        <span className="tt-reel-play-btn">
                          <TTIcon name={isUnlocked ? 'play' : 'lock'} size={20} />
                        </span>
                        <div className="tt-reel-foot">
                          <strong>{vid.title}</strong>
                          <small>{vid.duration}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="tt-coach-photos-rail">
                  {selectedCoach.gallery.map((ph, i) => (
                    <figure key={i} className="tt-coach-photo-tile">
                      <SmartImage
                        src={ph.url}
                        fallbackSrc={selectedCoach.photo}
                        alt={ph.caption || selectedCoach.name}
                        className="tt-coach-photo-img"
                      />
                      {ph.caption && <figcaption>{ph.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
            </div>

            {/* 4. CONSTRUCTOR DE RESERVA 3D (CLASES & PACKS | HORARIOS) */}
            <div className="tt-sd-3d-dock" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={coachInnerTab === 'packs'}
                className={`tt-sd-3d-tab is-compact ${coachInnerTab === 'packs' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setCoachInnerTab('packs');
                }}
              >
                1. Clases & Packs ({selectedCoach.packages.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={coachInnerTab === 'horarios'}
                className={`tt-sd-3d-tab is-compact ${coachInnerTab === 'horarios' ? 'is-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setCoachInnerTab('horarios');
                }}
              >
                2. Horarios Libres ({selectedCoach.schedule.length})
              </button>
            </div>

            {coachInnerTab === 'packs' ? (
              <div key="co-packs" className="tt-packs-stack tt-sd-enter">
                {selectedCoach.packages.map((pk) => {
                  const isPicked = activePack?.id === pk.id;
                  const hasSpots =
                    pk.spotsFilled !== null && pk.spotsMax !== null && pk.spotsMax > 0;
                  const spotsPct = hasSpots
                    ? Math.min(100, Math.round((pk.spotsFilled / pk.spotsMax) * 100))
                    : 0;

                  return (
                    <button
                      key={pk.id}
                      type="button"
                      className={`tt-pack-3d-card ${isPicked ? 'is-picked' : ''}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedPackId(pk.id);
                      }}
                    >
                      <div className="tt-pk-top">
                        <div className="tt-pk-badges">
                          <span className="tt-pk-type">{pk.type}</span>
                          {pk.tag && <span className="tt-pk-tag">{pk.tag}</span>}
                        </div>
                        <div className="tt-pk-price-col">
                          <strong>S/ {pk.priceRegular}</strong>
                          <span>VIP S/ {pk.priceVip}</span>
                        </div>
                      </div>

                      <h4 className="tt-pk-title">{pk.title}</h4>
                      <p className="tt-pk-desc">{pk.desc}</p>

                      {hasSpots && (
                        <div className="tt-pk-spots-row">
                          <div className="tt-pk-spots-track">
                            <div style={{ width: `${spotsPct}%` }} />
                          </div>
                          <span>
                            {pk.spotsFilled}/{pk.spotsMax} cupos
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div key="co-slots" className="tt-slots-panel tt-sd-enter">
                <span className="tt-sd-kicker">ELIGE TU TURNO PREFERIDO PARA COORDINAR</span>
                <div className="tt-slots-grid">
                  {selectedCoach.schedule.map((slot) => {
                    const isPicked = activeSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        className={`tt-slot-3d-tile ${isPicked ? 'is-picked' : ''}`}
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedSlotId(slot.id);
                        }}
                      >
                        <small>{slot.day}</small>
                        <strong>{slot.time}</strong>
                        <span>{slot.status === 'few' ? 'Último cupo' : 'Disponible'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. BARRA DE RESERVA EN VIVO 3D */}
            {activePack && (
              <div className="tt-coach-reserve-dock">
                <div className="tt-crd-summary">
                  <small>
                    {isVip ? 'TARIFA SOCIO VIP' : 'TARIFA REGULAR'}
                    {activeSlot ? ` · ${activeSlot.day} ${activeSlot.time}` : ''}
                  </small>
                  <strong>
                    S/ {isVip ? activePack.priceVip : activePack.priceRegular}
                    <span>{!isVip ? ` (VIP S/ ${activePack.priceVip})` : ''}</span>
                  </strong>
                </div>

                <button
                  type="button"
                  className="tt-sd-3d-btn is-emerald"
                  onClick={handleReserveCoachClass}
                >
                  <TTIcon name="whatsapp" size={17} />
                  Reservar Clase
                </button>
              </div>
            )}

            {onOpenPartnerPortal && (
              <button
                type="button"
                className="tt-modal-partner-foot-btn"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCoachId(null);
                  onOpenPartnerPortal();
                }}
              >
                <TTIcon name="settings" size={14} />
                <span>¿Eres {selectedCoach.name}? Edita tus paquetes, horarios y videos aquí</span>
              </button>
            )}
          </div>
        )}
      </ModalPortal>

      {/* ====================================================================
          ESTILOS FLAGSHIP 3D TÁCTIL + LIQUID GLASS (OSCURO Y CLARO BLINDADO)
          ==================================================================== */}
      <style>{`
        .tt-sedes-view {
          display: flex;
          flex-direction: column;
          gap: 14px;
          color: var(--tt-text);
        }
        .tt-sd-enter {
          animation: ttSdIn 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ttSdIn {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tt-sd-kicker {
          display: block;
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #00DC7D;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .tt-sedes-view.is-light .tt-sd-kicker,
        .tt-club-modal-stack.is-light .tt-sd-kicker,
        .tt-coach-modal-stack.is-light .tt-sd-kicker {
          color: #007A44;
        }

        /* ==================================================================
           1. SISTEMA 3D TÁCTIL COMPARTIDO (DOCKS, TABS Y BOTONES FÍSICOS)
           ================================================================== */
        .tt-sd-3d-dock {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 6px;
          border-radius: 19px;
          background: rgba(13, 2, 25, 0.78);
          border: 1.5px solid rgba(255, 255, 255, 0.13);
          box-shadow:
            inset 0 2px 7px rgba(0, 0, 0, 0.52),
            0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .tt-sd-3d-dock.is-three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }
        .tt-sedes-view.is-light .tt-sd-3d-dock,
        .tt-club-modal-stack.is-light .tt-sd-3d-dock,
        .tt-coach-modal-stack.is-light .tt-sd-3d-dock {
          background: #E8E1F4;
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow: inset 0 2px 6px rgba(30, 7, 52, 0.14);
        }

        .tt-sd-3d-tab {
          min-height: 44px;
          padding: 0 10px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.79rem;
          font-weight: 800;
          cursor: pointer;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          color: rgba(250, 249, 245, 0.86);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 4px 0 #10021E,
            0 6px 12px rgba(0, 0, 0, 0.26);
          transition:
            transform 115ms cubic-bezier(0.22, 1.35, 0.36, 1),
            box-shadow 115ms ease,
            background 180ms ease,
            color 160ms ease;
        }
        .tt-sd-3d-tab.is-compact {
          min-height: 40px;
          font-size: 0.73rem;
          padding: 0 6px;
          white-space: nowrap;
        }
        .tt-sd-3d-tab:active {
          transform: translateY(3px) scale(0.985);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 1px 0 #10021E;
        }
        .tt-sd-3d-tab.is-active {
          background: linear-gradient(180deg, #22F397 0%, #00C96F 56%, #00A85B 100%);
          color: #0D0219;
          font-weight: 900;
          border-color: rgba(168, 255, 218, 0.78);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.7),
            0 4px 0 #007540,
            0 10px 20px rgba(0, 220, 125, 0.34);
        }
        .tt-sd-3d-tab.is-active:active {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            0 1px 0 #007540,
            0 4px 10px rgba(0, 220, 125, 0.26);
        }

        .tt-sedes-view.is-light .tt-sd-3d-tab,
        .tt-club-modal-stack.is-light .tt-sd-3d-tab,
        .tt-coach-modal-stack.is-light .tt-sd-3d-tab {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1ECF9 100%);
          color: #2B1147;
          border-color: rgba(30, 7, 52, 0.18);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #C8BDDF,
            0 5px 10px rgba(30, 7, 52, 0.08);
        }
        .tt-sedes-view.is-light .tt-sd-3d-tab:active,
        .tt-club-modal-stack.is-light .tt-sd-3d-tab:active,
        .tt-coach-modal-stack.is-light .tt-sd-3d-tab:active {
          box-shadow: inset 0 1px 0 #FFFFFF, 0 1px 0 #C8BDDF;
        }
        .tt-sedes-view.is-light .tt-sd-3d-tab.is-active,
        .tt-club-modal-stack.is-light .tt-sd-3d-tab.is-active,
        .tt-coach-modal-stack.is-light .tt-sd-3d-tab.is-active {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          color: #00E582;
          border-color: #1E0734;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.26),
            0 4px 0 #0D0218,
            0 8px 18px rgba(30, 7, 52, 0.28);
        }

        /* BOTONES CTA 3D TÁCTILES */
        .tt-sd-3d-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.01em;
          text-decoration: none;
          cursor: pointer;
          border: 1px solid transparent;
          transition:
            transform 115ms cubic-bezier(0.22, 1.35, 0.36, 1),
            box-shadow 115ms ease;
        }
        .tt-sd-3d-btn.is-mini {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 11px;
          font-size: 0.72rem;
          flex-shrink: 0;
        }
        .tt-sd-3d-btn:active {
          transform: translateY(3px) scale(0.985);
        }

        .tt-sd-3d-btn.is-emerald {
          background: linear-gradient(180deg, #22F397 0%, #00C96F 55%, #00A85B 100%);
          color: #0D0219;
          border-color: rgba(164, 255, 214, 0.72);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.68),
            0 4px 0 #007540,
            0 10px 20px rgba(0, 220, 125, 0.3);
        }
        .tt-sd-3d-btn.is-emerald:active {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 0 #007540;
        }

        .tt-sd-3d-btn.is-gold {
          background: linear-gradient(180deg, #FAE9B6 0%, #E5C16C 55%, #C89938 100%);
          color: #1A1002;
          border-color: rgba(255, 245, 214, 0.75);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 4px 0 #8A6012,
            0 8px 18px rgba(229, 193, 108, 0.3);
        }
        .tt-sd-3d-btn.is-gold:active {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 0 #8A6012;
        }

        .tt-sd-3d-btn.is-sky {
          background: linear-gradient(180deg, #66D8FF 0%, #24B0EE 58%, #0E8AC6 100%);
          color: #051A2A;
          border-color: rgba(190, 238, 255, 0.7);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.65),
            0 4px 0 #075B87,
            0 10px 20px rgba(56, 189, 248, 0.28);
        }
        .tt-sd-3d-btn.is-sky:active {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 0 #075B87;
        }

        .tt-sd-3d-btn.is-secondary {
          background: linear-gradient(180deg, #35155A 0%, #230A40 100%);
          color: #FAF9F5;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            0 4px 0 #10021E,
            0 8px 16px rgba(0, 0, 0, 0.32);
        }
        .tt-sd-3d-btn.is-secondary:active {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-club-modal-stack.is-light .tt-sd-3d-btn.is-secondary,
        .tt-coach-modal-stack.is-light .tt-sd-3d-btn.is-secondary {
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEAF8 100%);
          color: #1E0734;
          border-color: rgba(30, 7, 52, 0.2);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #C7BDDC,
            0 6px 14px rgba(30, 7, 52, 0.1);
        }

        /* ==================================================================
           2. CINTA B2B ESTUDIO ALIADO 3D
           ================================================================== */
        .tt-partner-3d-strip {
          width: 100%;
          padding: 11px 13px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(46, 17, 78, 0.94) 0%, rgba(27, 8, 49, 0.98) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 4px 0 #10021E,
            0 10px 20px rgba(0, 0, 0, 0.24);
          color: #FAF9F5;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }
        .tt-partner-3d-strip:active {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-sedes-view.is-light .tt-partner-3d-strip {
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F0FA 100%);
          border-color: rgba(30, 7, 52, 0.18);
          color: #1E0734;
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #CFC5E3,
            0 8px 18px rgba(30, 7, 52, 0.08);
        }
        .tt-partner-3d-strip strong { display: block; font-size: 0.81rem; font-weight: 900; }
        .tt-partner-3d-strip small {
          display: block;
          font-size: 0.69rem;
          color: rgba(250, 249, 245, 0.72);
          margin-top: 1px;
        }
        .tt-sedes-view.is-light .tt-partner-3d-strip small {
          color: #57446E;
        }
        .tt-partner-strip-cta {
          padding: 6px 12px;
          border-radius: 10px;
          background: linear-gradient(180deg, #22F397 0%, #00B866 100%);
          color: #0D0219;
          font-size: 0.7rem;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 0 #007540;
        }

        /* ==================================================================
           3. GRILLA Y TARJETAS ARQUITECTÓNICAS 3D DE SEDES Y COACHES
           ================================================================== */
        .tt-sd-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 720px) {
          .tt-sd-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        .tt-club-card,
        .tt-coach-card {
          border-radius: 24px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(42, 16, 72, 0.96) 0%, rgba(23, 6, 42, 0.98) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 5px 0 #0F021C,
            0 14px 28px rgba(0, 0, 0, 0.34);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          animation: ttSdIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--sd-delay, 0ms);
          transition: transform 130ms cubic-bezier(0.22, 1.35, 0.36, 1), box-shadow 130ms ease;
        }
        .tt-club-card:active,
        .tt-coach-card:active {
          transform: translateY(3px) scale(0.99);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 2px 0 #0F021C;
        }
        .tt-sedes-view.is-light .tt-club-card,
        .tt-sedes-view.is-light .tt-coach-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F7F4FC 100%);
          border-color: rgba(30, 7, 52, 0.17);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 5px 0 #D2C8E6,
            0 14px 26px rgba(30, 7, 52, 0.11);
        }

        .tt-cc-hero,
        .tt-co-hero {
          position: relative;
          min-height: 180px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #160428;
          overflow: hidden;
        }
        .tt-cc-bg, .tt-co-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tt-cc-scrim, .tt-co-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(16, 4, 30, 0.44) 0%,
            rgba(16, 4, 30, 0.18) 44%,
            rgba(14, 3, 26, 0.94) 100%
          );
        }
        .tt-cc-top-row, .tt-co-top-row {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-cc-weather-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px 4px 7px;
          border-radius: 999px;
          background: rgba(16, 4, 30, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.24);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #FAF9F5;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-cc-weather-pill.is-emerald { border-color: rgba(0, 220, 125, 0.56); }
        .tt-cc-weather-pill.is-sky { border-color: rgba(56, 189, 248, 0.56); }
        .tt-cc-weather-pill.is-gold { border-color: rgba(229, 193, 108, 0.6); }
        .tt-cc-weather-pill.is-danger { border-color: rgba(248, 113, 113, 0.6); }

        .tt-cc-video-chip, .tt-co-media-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.18);
          border: 1px solid rgba(250, 249, 245, 0.34);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #FAF9F5;
          font-size: 0.65rem;
          font-weight: 800;
        }
        .tt-cc-bottom-row {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }
        .tt-cc-crest {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #FFFFFF;
          border: 2px solid #FAF9F5;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4);
        }
        .tt-cc-district {
          display: block;
          font-size: 0.67rem;
          font-weight: 700;
          color: rgba(250, 249, 245, 0.85);
        }
        .tt-cc-title {
          margin: 2px 0 0;
          font-family: var(--tt-font-display);
          font-weight: 900;
          font-size: 1.32rem;
          line-height: 1.04;
          color: #FAF9F5;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
        }

        .tt-cc-body {
          padding: 13px;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-cc-rates-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          text-align: center;
        }
        .tt-cc-rate-tile {
          padding: 9px 5px;
          border-radius: 13px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 3px 0 rgba(10, 2, 20, 0.6);
        }
        .tt-sedes-view.is-light .tt-cc-rate-tile {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1ECF9 100%);
          border-color: rgba(30, 7, 52, 0.15);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #D5CCE8;
        }
        .tt-cc-rate-tile small {
          display: block;
          font-size: 0.56rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: var(--tt-text-muted);
        }
        .tt-cc-rate-tile strong {
          font-family: var(--tt-font-display);
          font-size: 1.06rem;
          font-weight: 900;
          color: var(--tt-text);
        }
        .tt-cc-rate-tile.is-vip {
          background: linear-gradient(180deg, rgba(229, 193, 108, 0.22) 0%, rgba(229, 193, 108, 0.08) 100%);
          border-color: rgba(229, 193, 108, 0.52);
          box-shadow: inset 0 1px 0 rgba(255, 245, 214, 0.3), 0 3px 0 rgba(92, 62, 10, 0.55);
        }
        .tt-cc-rate-tile.is-vip strong { color: #F4DA92; }
        .tt-sedes-view.is-light .tt-cc-rate-tile.is-vip {
          background: linear-gradient(180deg, #FFFDF5 0%, #FAF0D1 100%);
          border-color: rgba(168, 118, 22, 0.48);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 0 #DFC684;
        }
        .tt-sedes-view.is-light .tt-cc-rate-tile.is-vip strong { color: #805408; }

        .tt-cc-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-cc-promo-hint {
          font-size: 0.71rem;
          font-weight: 700;
          color: var(--tt-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-cc-open-3d,
        .tt-co-cta-3d {
          padding: 7px 13px;
          border-radius: 11px;
          background: linear-gradient(180deg, #22F397 0%, #00C96F 60%, #00A85B 100%);
          color: #0D0219;
          font-size: 0.71rem;
          font-weight: 900;
          white-space: nowrap;
          border: 1px solid rgba(168, 255, 218, 0.65);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.65),
            0 3px 0 #007540,
            0 6px 14px rgba(0, 220, 125, 0.28);
        }

        /* TARJETA COACH */
        .tt-co-avail-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(16, 4, 30, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.24);
          color: #FAF9F5;
          font-size: 0.65rem;
          font-weight: 900;
          backdrop-filter: blur(8px);
        }
        .tt-co-avail-pill.is-today {
          background: rgba(0, 220, 125, 0.24);
          border-color: rgba(0, 220, 125, 0.72);
          color: #86F7C3;
        }
        .tt-co-avail-pill.is-today i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00DC7D;
          box-shadow: 0 0 8px #00DC7D;
          animation: ttLivePulse 1.6s infinite;
        }
        .tt-co-bottom-row {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-co-role {
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: var(--coach-accent, #00DC7D);
          text-transform: uppercase;
        }
        .tt-co-name {
          margin: 0;
          font-family: var(--tt-font-display);
          font-size: 1.5rem;
          font-weight: 900;
          line-height: 1.02;
          color: #FAF9F5;
        }
        .tt-co-club {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.71rem;
          font-weight: 700;
          color: rgba(250, 249, 245, 0.85);
          margin-top: 2px;
        }
        .tt-co-body {
          padding: 13px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tt-co-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tt-co-tag {
          padding: 4px 10px;
          border-radius: 9px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          font-size: 0.67rem;
          font-weight: 800;
          color: var(--tt-text-secondary);
        }
        .tt-sedes-view.is-light .tt-co-tag {
          background: #F1ECF9;
          border-color: rgba(30, 7, 52, 0.14);
          color: #2B1147;
        }
        .tt-co-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--tt-border);
        }
        .tt-co-price-group small {
          display: block;
          font-size: 0.68rem;
          color: var(--tt-text-muted);
          font-weight: 700;
        }
        .tt-co-price-group strong {
          font-size: 0.88rem;
          font-weight: 900;
          color: #F2D68B;
        }
        .tt-sedes-view.is-light .tt-co-price-group strong {
          color: #805408;
        }

        /* ==================================================================
           4. MODAL CLUB: VISOR MULTIMEDIA + TARIFAS 3D + PROMOS + CLIMA 3D
           ================================================================== */
        .tt-modal-crest {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #FFFFFF;
          overflow: hidden;
          border: 1.5px solid var(--tt-border-medium);
        }
        .tt-club-modal-stack,
        .tt-coach-modal-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
          color: var(--tt-text);
        }
        .tt-club-modal-stack.is-light,
        .tt-coach-modal-stack.is-light {
          color: #1E0734;
        }

        .tt-cm-stage {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 16 / 10;
          background: #140324;
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
        }
        .tt-cm-photo, .tt-cm-video-wrap, .tt-cm-video-el {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .tt-cm-photo-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(16, 4, 30, 0.25) 0%,
            transparent 45%,
            rgba(14, 2, 26, 0.9) 100%
          );
          pointer-events: none;
        }
        .tt-cm-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(16, 4, 30, 0.78);
          border: 1.5px solid rgba(255, 255, 255, 0.34);
          backdrop-filter: blur(8px);
          color: #FAF9F5;
          font-size: 1.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          transition: transform 110ms ease;
        }
        .tt-cm-arrow:active { transform: translateY(-50%) scale(0.92); }
        .tt-cm-arrow.is-left { left: 10px; }
        .tt-cm-arrow.is-right { right: 10px; }

        .tt-cm-caption {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 10px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #FAF9F5;
          font-size: 0.74rem;
          font-weight: 800;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
        }
        .tt-cm-dots { display: inline-flex; gap: 4px; }
        .tt-cm-dots i {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.44);
          transition: width 200ms ease;
        }
        .tt-cm-dots i.is-on { width: 18px; background: #00DC7D; }

        .tt-cm-media-pill {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 4;
          display: inline-flex;
          gap: 3px;
          padding: 4px;
          border-radius: 13px;
          background: rgba(14, 3, 28, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.42);
        }
        .tt-cm-media-pill button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 9px;
          font-size: 0.68rem;
          font-weight: 800;
          color: rgba(250, 249, 245, 0.84);
        }
        .tt-cm-media-pill button.is-on {
          background: linear-gradient(180deg, #22F397 0%, #00B866 100%);
          color: #0D0219;
          font-weight: 900;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 0 #007540;
        }

        .tt-cm-panel, .tt-cm-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* TARIFAS 3D SHOWCASE */
        .tt-rates-showcase {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
        }
        .tt-rate-3d-box {
          padding: 13px 8px;
          border-radius: 16px;
          background: linear-gradient(180deg, #321357 0%, #20083B 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 4px 0 #10021E,
            0 8px 16px rgba(0, 0, 0, 0.26);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .tt-club-modal-stack.is-light .tt-rate-3d-box {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1ECF9 100%);
          border-color: rgba(30, 7, 52, 0.17);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #CDC3E2,
            0 8px 14px rgba(30, 7, 52, 0.08);
        }
        .tt-rate-3d-box span {
          font-size: 0.57rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: rgba(250, 249, 245, 0.72);
        }
        .tt-club-modal-stack.is-light .tt-rate-3d-box span {
          color: #5C4974;
        }
        .tt-rate-3d-box strong {
          font-family: var(--tt-font-display);
          font-size: 1.32rem;
          line-height: 1.05;
          color: #FAF9F5;
        }
        .tt-club-modal-stack.is-light .tt-rate-3d-box strong {
          color: #1E0734;
        }
        .tt-rate-3d-box small {
          font-size: 0.65rem;
          color: rgba(250, 249, 245, 0.7);
        }
        .tt-club-modal-stack.is-light .tt-rate-3d-box small {
          color: #5C4974;
        }
        .tt-rate-3d-box.is-vip {
          background: linear-gradient(180deg, #432C0C 0%, #261607 100%);
          border-color: rgba(229, 193, 108, 0.65);
          box-shadow:
            inset 0 1px 0 rgba(255, 244, 212, 0.35),
            0 4px 0 #1A0F03,
            0 10px 20px rgba(229, 193, 108, 0.18);
        }
        .tt-rate-3d-box.is-vip span,
        .tt-rate-3d-box.is-vip small { color: rgba(249, 232, 184, 0.86); }
        .tt-rate-3d-box.is-vip strong { color: #F9E3A4; }

        .tt-club-modal-stack.is-light .tt-rate-3d-box.is-vip {
          background: linear-gradient(180deg, #FFFDF4 0%, #F9ECC7 100%);
          border-color: rgba(168, 118, 22, 0.56);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #D8BC74,
            0 8px 16px rgba(168, 118, 22, 0.14);
        }
        .tt-club-modal-stack.is-light .tt-rate-3d-box.is-vip span,
        .tt-club-modal-stack.is-light .tt-rate-3d-box.is-vip small { color: #7C540B; }
        .tt-club-modal-stack.is-light .tt-rate-3d-box.is-vip strong { color: #6B4404; }

        /* PROMOS HORAS VALLE 3D */
        .tt-promos-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 560px) {
          .tt-promos-grid { grid-template-columns: 1fr 1fr; }
        }
        .tt-promo-3d-card {
          padding: 13px;
          border-radius: 17px;
          background: linear-gradient(160deg, rgba(0, 220, 125, 0.16) 0%, #240A42 62%, #1A0632 100%);
          border: 1.5px solid rgba(0, 220, 125, 0.45);
          box-shadow:
            inset 0 1px 0 rgba(164, 255, 214, 0.25),
            0 4px 0 #0D0219,
            0 10px 20px rgba(0, 220, 125, 0.12);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tt-club-modal-stack.is-light .tt-promo-3d-card {
          background: linear-gradient(160deg, #EBFCF3 0%, #FFFFFF 65%, #F4F0FA 100%);
          border-color: rgba(0, 150, 84, 0.42);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #BFEAD3,
            0 8px 16px rgba(0, 150, 84, 0.1);
        }
        .tt-pgc-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .tt-pgc-tag {
          padding: 3px 8px;
          border-radius: 7px;
          background: linear-gradient(180deg, #22F397 0%, #00B966 100%);
          color: #0D0219;
          font-size: 0.59rem;
          font-weight: 900;
          box-shadow: 0 2px 0 #007540;
        }
        .tt-pgc-price {
          font-family: var(--tt-font-display);
          font-size: 1.12rem;
          font-weight: 900;
          color: #00E582;
        }
        .tt-club-modal-stack.is-light .tt-pgc-price { color: #007A44; }
        .tt-pgc-title {
          font-size: 0.86rem;
          font-weight: 900;
          color: #FAF9F5;
        }
        .tt-club-modal-stack.is-light .tt-pgc-title { color: #1E0734; }
        .tt-promo-3d-card small {
          font-size: 0.71rem;
          color: rgba(250, 249, 245, 0.76);
        }
        .tt-club-modal-stack.is-light .tt-promo-3d-card small { color: #54416B; }

        /* BENTO INSTALACIONES 3D */
        .tt-bento-facilities {
          display: grid;
          grid-template-columns: 1fr;
          gap: 9px;
        }
        @media (min-width: 520px) {
          .tt-bento-facilities { grid-template-columns: 1fr 1fr; }
        }
        .tt-bento-fac-card {
          padding: 12px;
          border-radius: 16px;
          background: linear-gradient(180deg, #2E1150 0%, #1E0838 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 4px 0 #10021E;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tt-club-modal-stack.is-light .tt-bento-fac-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F3EFFA 100%);
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #D2C8E6;
        }
        .tt-bento-fac-card strong {
          display: block;
          font-size: 0.81rem;
          font-weight: 900;
          color: #FAF9F5;
        }
        .tt-club-modal-stack.is-light .tt-bento-fac-card strong { color: #1E0734; }
        .tt-bento-fac-card small {
          display: block;
          font-size: 0.7rem;
          color: rgba(250, 249, 245, 0.72);
          margin-top: 1px;
        }
        .tt-club-modal-stack.is-light .tt-bento-fac-card small { color: #57446E; }

        /* GOLDEN TICKET VIP CARD */
        .tt-golden-ticket-card {
          position: relative;
          overflow: hidden;
          padding: 15px;
          border-radius: 20px;
          background: linear-gradient(135deg, #2E1B05 0%, #1D0833 56%, #3A2306 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(229, 193, 108, 0.65);
          box-shadow:
            inset 0 1px 0 rgba(255, 245, 214, 0.32),
            0 5px 0 #140902,
            0 14px 28px rgba(8, 1, 18, 0.36);
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .tt-gt-sheen {
          position: absolute;
          inset: -35%;
          background: linear-gradient(115deg, transparent 42%, rgba(250, 240, 202, 0.16) 50%, transparent 58%);
          transform: translateX(-110%);
          animation: ttGtSweep 5.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ttGtSweep {
          0%, 66% { transform: translateX(-110%); }
          100% { transform: translateX(120%); }
        }
        .tt-gt-top {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-gt-kicker {
          display: block;
          font-size: 0.59rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          color: #F4DA92;
        }
        .tt-gt-top strong { font-size: 0.9rem; color: #FAF9F5; }
        .tt-gt-perks-grid {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tt-gt-perk-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(250, 249, 245, 0.09);
          border: 1px solid rgba(250, 249, 245, 0.14);
          font-size: 0.74rem;
          font-weight: 700;
          color: #FAF9F5;
        }

        /* EVENTOS INTERNOS */
        .tt-internal-event-card {
          padding: 13px;
          border-radius: 16px;
          background: linear-gradient(180deg, #2E1150 0%, #1E0838 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 0 #10021E;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-club-modal-stack.is-light .tt-internal-event-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F3EFFA 100%);
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #D2C8E6;
        }
        .tt-iec-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-iec-top strong { display: block; font-size: 0.85rem; }
        .tt-iec-top small { display: block; font-size: 0.71rem; opacity: 0.75; }
        .tt-iec-fee {
          padding: 4px 10px;
          border-radius: 9px;
          background: #1E0734;
          color: #00DC7D;
          font-size: 0.7rem;
          font-weight: 900;
        }
        .tt-iec-bar-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.69rem;
          font-weight: 800;
          opacity: 0.82;
        }
        .tt-iec-track {
          flex: 1;
          height: 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          overflow: hidden;
        }
        .tt-club-modal-stack.is-light .tt-iec-track {
          background: #E4DCF2;
        }
        .tt-iec-track > div {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00DC7D 0%, #22F397 100%);
        }

        /* CLIMA EN VIVO 3D */
        .tt-weather-box {
          padding: 14px;
          border-radius: 18px;
          background: linear-gradient(180deg, #2A0F49 0%, #1B0733 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 0 #10021E;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tt-club-modal-stack.is-light .tt-weather-box {
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F0FA 100%);
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #D2C8E6;
        }
        .tt-wb-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tt-wb-head strong { display: block; font-size: 0.92rem; }
        .tt-wb-head small { display: block; font-size: 0.71rem; opacity: 0.76; }
        .tt-weather-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .tt-weather-3d-tile {
          padding: 10px 4px;
          border-radius: 14px;
          background: linear-gradient(180deg, #36165C 0%, #230A40 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 0 #10021E;
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          font-size: 0.7rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 110ms ease, box-shadow 110ms ease;
        }
        .tt-weather-3d-tile:active {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-weather-3d-tile.is-active {
          background: linear-gradient(180deg, #1EF093 0%, #00B866 100%);
          border-color: rgba(170, 255, 218, 0.75);
          color: #0D0219;
          font-weight: 900;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.65),
            0 4px 0 #007540,
            0 8px 16px rgba(0, 220, 125, 0.3);
        }
        .tt-club-modal-stack.is-light .tt-weather-3d-tile {
          background: linear-gradient(180deg, #FFFFFF 0%, #EFEBF7 100%);
          border-color: rgba(30, 7, 52, 0.18);
          color: #1E0734;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #C9BEDE;
        }
        .tt-club-modal-stack.is-light .tt-weather-3d-tile.is-active {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          border-color: #1E0734;
          color: #00E582;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #0D0218;
        }

        /* RESERVAR SEDE (SIN CÓDIGO VIP · SOLO CARNET DIGITAL 3D) */
        .tt-address-3d-card {
          padding: 13px;
          border-radius: 16px;
          background: linear-gradient(180deg, #2E1150 0%, #1E0838 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 4px 0 #10021E;
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .tt-club-modal-stack.is-light .tt-address-3d-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F0FA 100%);
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #D2C8E6;
        }
        .tt-address-3d-card strong { display: block; font-size: 0.85rem; }
        .tt-address-3d-card small { display: block; font-size: 0.72rem; opacity: 0.76; margin-top: 2px; }

        .tt-vip-pass-reminder {
          padding: 13px;
          border-radius: 17px;
          background: linear-gradient(145deg, #342108 0%, #1E0834 100%);
          border: 1.5px solid rgba(229, 193, 108, 0.56);
          box-shadow: inset 0 1px 0 rgba(255, 245, 214, 0.25), 0 4px 0 #120702;
          color: #FAF9F5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-vip-pass-reminder strong {
          display: block;
          font-size: 0.84rem;
          color: #F7E2A6;
        }
        .tt-vip-pass-reminder small {
          display: block;
          font-size: 0.71rem;
          color: rgba(250, 249, 245, 0.82);
          margin-top: 2px;
          line-height: 1.35;
        }

        .tt-club-action-pair {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tt-modal-partner-foot-btn {
          width: 100%;
          padding: 11px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px dashed rgba(255, 255, 255, 0.22);
          color: rgba(250, 249, 245, 0.76);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
        }
        .tt-club-modal-stack.is-light .tt-modal-partner-foot-btn,
        .tt-coach-modal-stack.is-light .tt-modal-partner-foot-btn {
          background: #F4F0FA;
          border-color: rgba(30, 7, 52, 0.24);
          color: #422A5D;
        }

        /* ==================================================================
           5. MODAL COACH: HERO + REELS + PACKS Y HORARIOS 3D
           ================================================================== */
        .tt-chm-hero {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          min-height: 158px;
          padding: 14px;
          background: #160428;
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border: 1.5px solid rgba(255, 255, 255, 0.16);
        }
        .tt-chm-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .tt-chm-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(16, 4, 30, 0.42) 0%, rgba(16, 4, 30, 0.94) 100%);
        }
        .tt-chm-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tt-chm-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .tt-chm-stat-pill {
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.18);
          backdrop-filter: blur(8px);
          font-size: 0.66rem;
          font-weight: 800;
          color: #FAF9F5;
        }
        .tt-chm-bio {
          margin: 0;
          font-size: 0.77rem;
          line-height: 1.42;
          color: rgba(250, 249, 245, 0.92);
        }
        .tt-chm-specs { display: flex; flex-wrap: wrap; gap: 5px; }
        .tt-chm-specs span {
          padding: 3px 8px;
          border-radius: 8px;
          background: rgba(0, 220, 125, 0.18);
          border: 1px solid rgba(0, 220, 125, 0.42);
          color: #86F7C3;
          font-size: 0.65rem;
          font-weight: 800;
        }

        /* VIDEO THEATER */
        .tt-video-theater {
          border-radius: 18px;
          overflow: hidden;
          background: #0E021A;
          border: 1.5px solid rgba(0, 220, 125, 0.5);
        }
        .tt-vt-head {
          padding: 9px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #FAF9F5;
          font-size: 0.76rem;
        }
        .tt-vt-close {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(250, 249, 245, 0.16);
          color: #FAF9F5;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .tt-vt-player {
          width: 100%;
          max-height: 300px;
          background: #000000;
          display: block;
        }

        /* CARRUSEL REELS Y FOTOS */
        .tt-media-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-mini-media-switch {
          display: inline-flex;
          gap: 4px;
          padding: 4px;
          border-radius: 12px;
          background: rgba(14, 3, 28, 0.68);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }
        .tt-coach-modal-stack.is-light .tt-mini-media-switch {
          background: #E8E1F4;
          border-color: rgba(30, 7, 52, 0.15);
        }
        .tt-mini-media-switch button {
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 0.68rem;
          font-weight: 800;
          color: rgba(250, 249, 245, 0.76);
        }
        .tt-coach-modal-stack.is-light .tt-mini-media-switch button { color: #3A2057; }
        .tt-mini-media-switch button.is-on {
          background: linear-gradient(180deg, #22F397 0%, #00B866 100%);
          color: #0D0219;
          font-weight: 900;
          box-shadow: 0 2px 0 #007540;
        }
        .tt-coach-modal-stack.is-light .tt-mini-media-switch button.is-on {
          background: #1E0734;
          color: #00E582;
          box-shadow: 0 2px 0 #0D0218;
        }

        .tt-reels-rail, .tt-coach-photos-rail {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 6px;
          scrollbar-width: none;
        }
        .tt-reels-rail::-webkit-scrollbar, .tt-coach-photos-rail::-webkit-scrollbar {
          display: none;
        }
        .tt-reel-card {
          position: relative;
          flex-shrink: 0;
          width: 152px;
          height: 202px;
          border-radius: 18px;
          overflow: hidden;
          background: #140324;
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 4px 0 #0D0219, 0 10px 18px rgba(0, 0, 0, 0.3);
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          color: #FAF9F5;
          cursor: pointer;
          transition: transform 120ms ease;
        }
        .tt-reel-card:active { transform: translateY(2px) scale(0.98); }
        .tt-reel-poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .tt-reel-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(16, 4, 30, 0.46) 0%,
            rgba(16, 4, 30, 0.16) 45%,
            rgba(14, 2, 26, 0.94) 100%
          );
        }
        .tt-reel-tag {
          position: relative;
          z-index: 2;
          align-self: flex-start;
          padding: 3px 7px;
          border-radius: 7px;
          font-size: 0.56rem;
          font-weight: 900;
          letter-spacing: 0.04em;
        }
        .tt-reel-tag.is-free { background: #00DC7D; color: #0D0219; }
        .tt-reel-tag.is-lock { background: #F0CF7B; color: #1A1102; }
        .tt-reel-play-btn {
          position: relative;
          z-index: 2;
          align-self: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(16, 4, 30, 0.72);
          border: 1.5px solid rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(8px);
          color: #FAF9F5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tt-reel-foot { position: relative; z-index: 2; }
        .tt-reel-foot strong { display: block; font-size: 0.74rem; line-height: 1.22; }
        .tt-reel-foot small { display: block; font-size: 0.64rem; opacity: 0.78; margin-top: 2px; }

        .tt-coach-photo-tile {
          margin: 0;
          flex-shrink: 0;
          width: 210px;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(180deg, #2E1150 0%, #1E0838 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 4px 0 #10021E;
        }
        .tt-coach-modal-stack.is-light .tt-coach-photo-tile {
          background: #FFFFFF;
          border-color: rgba(30, 7, 52, 0.16);
          box-shadow: 0 4px 0 #D2C8E6;
        }
        .tt-coach-photo-img { width: 100%; height: 132px; object-fit: cover; display: block; }
        .tt-coach-photo-tile figcaption {
          padding: 8px 10px;
          font-size: 0.7rem;
          font-weight: 700;
          opacity: 0.82;
        }

        /* PAQUETES Y HORARIOS 3D SELECCIONABLES */
        .tt-packs-stack { display: flex; flex-direction: column; gap: 10px; }
        .tt-pack-3d-card {
          width: 100%;
          padding: 14px;
          border-radius: 18px;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 4px 0 #10021E;
          color: #FAF9F5;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          transition: transform 115ms ease, box-shadow 115ms ease, border-color 160ms ease;
        }
        .tt-pack-3d-card:active {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-pack-3d-card.is-picked {
          border-color: #00E582;
          background: linear-gradient(160deg, rgba(0, 220, 125, 0.2) 0%, #250B44 65%, #1A0632 100%);
          box-shadow:
            inset 0 1px 0 rgba(164, 255, 214, 0.35),
            0 4px 0 #007540,
            0 10px 22px rgba(0, 220, 125, 0.22);
        }
        .tt-coach-modal-stack.is-light .tt-pack-3d-card {
          background: linear-gradient(180deg, #FFFFFF 0%, #F3EFFA 100%);
          border-color: rgba(30, 7, 52, 0.18);
          color: #1E0734;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #CDC3E2;
        }
        .tt-coach-modal-stack.is-light .tt-pack-3d-card.is-picked {
          border-color: #009B56;
          background: linear-gradient(160deg, #E8FBF1 0%, #FFFFFF 70%);
          box-shadow:
            inset 0 1px 0 #FFFFFF,
            0 4px 0 #007A44,
            0 8px 18px rgba(0, 155, 86, 0.18);
        }

        .tt-pk-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .tt-pk-badges { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
        .tt-pk-type {
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: #00E582;
        }
        .tt-coach-modal-stack.is-light .tt-pk-type { color: #007A44; }
        .tt-pk-tag {
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(229, 193, 108, 0.2);
          border: 1px solid rgba(229, 193, 108, 0.45);
          color: #F4DA92;
          font-size: 0.58rem;
          font-weight: 900;
        }
        .tt-coach-modal-stack.is-light .tt-pk-tag {
          background: #FBF1D4;
          border-color: rgba(154, 107, 22, 0.35);
          color: #7C540B;
        }
        .tt-pk-price-col { text-align: right; flex-shrink: 0; }
        .tt-pk-price-col strong {
          display: block;
          font-family: var(--tt-font-display);
          font-size: 1.24rem;
          line-height: 1;
        }
        .tt-pk-price-col span {
          display: block;
          font-size: 0.67rem;
          font-weight: 900;
          color: #F4DA92;
        }
        .tt-coach-modal-stack.is-light .tt-pk-price-col span { color: #805408; }
        .tt-pk-title { margin: 2px 0 0; font-size: 0.91rem; font-weight: 900; }
        .tt-pk-desc { margin: 0; font-size: 0.74rem; line-height: 1.38; opacity: 0.78; }
        .tt-pk-spots-row {
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.69rem;
          font-weight: 800;
          opacity: 0.82;
        }
        .tt-pk-spots-track {
          flex: 1;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          overflow: hidden;
        }
        .tt-coach-modal-stack.is-light .tt-pk-spots-track { background: #E4DCF2; }
        .tt-pk-spots-track > div { height: 100%; border-radius: 999px; background: #00DC7D; }

        .tt-slots-panel { display: flex; flex-direction: column; gap: 9px; }
        .tt-slots-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 9px;
        }
        @media (min-width: 520px) {
          .tt-slots-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .tt-slot-3d-tile {
          padding: 12px 9px;
          border-radius: 15px;
          background: linear-gradient(180deg, #321357 0%, #20093B 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 4px 0 #10021E;
          color: #FAF9F5;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-align: center;
          cursor: pointer;
          transition: transform 110ms ease, box-shadow 110ms ease;
        }
        .tt-slot-3d-tile:active {
          transform: translateY(3px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 0 #10021E;
        }
        .tt-slot-3d-tile small { font-size: 0.67rem; font-weight: 800; opacity: 0.76; }
        .tt-slot-3d-tile strong { font-family: var(--tt-font-display); font-size: 1.08rem; }
        .tt-slot-3d-tile span { font-size: 0.63rem; font-weight: 900; color: #00E582; }
        .tt-slot-3d-tile.is-picked {
          background: linear-gradient(180deg, #22F397 0%, #00B866 100%);
          border-color: rgba(170, 255, 218, 0.78);
          color: #0D0219;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.65),
            0 4px 0 #007540,
            0 8px 18px rgba(0, 220, 125, 0.3);
        }
        .tt-slot-3d-tile.is-picked small,
        .tt-slot-3d-tile.is-picked span { color: #0D0219; opacity: 0.85; }

        .tt-coach-modal-stack.is-light .tt-slot-3d-tile {
          background: linear-gradient(180deg, #FFFFFF 0%, #F1ECF9 100%);
          border-color: rgba(30, 7, 52, 0.18);
          color: #1E0734;
          box-shadow: inset 0 1px 0 #FFFFFF, 0 4px 0 #C9BEDE;
        }
        .tt-coach-modal-stack.is-light .tt-slot-3d-tile span { color: #007A44; }
        .tt-coach-modal-stack.is-light .tt-slot-3d-tile.is-picked {
          background: linear-gradient(180deg, #35115C 0%, #1E0734 100%);
          border-color: #1E0734;
          color: #FAF9F5;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #0D0218;
        }
        .tt-coach-modal-stack.is-light .tt-slot-3d-tile.is-picked small { color: rgba(250, 249, 245, 0.8); }
        .tt-coach-modal-stack.is-light .tt-slot-3d-tile.is-picked span { color: #00E582; }

        /* DOCK DE RESERVA FINAL COACH */
        .tt-coach-reserve-dock {
          padding: 13px 14px;
          border-radius: 18px;
          background: linear-gradient(145deg, #250A42 0%, #150328 100%);
          color: #FAF9F5;
          border: 1.5px solid rgba(0, 220, 125, 0.5);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 5px 0 #0D0219,
            0 12px 26px rgba(8, 1, 18, 0.36);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tt-crd-summary small {
          display: block;
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          color: #7CF5C0;
          font-weight: 800;
        }
        .tt-crd-summary strong {
          font-family: var(--tt-font-display);
          font-size: 1.48rem;
          line-height: 1;
          color: #FAF9F5;
        }
        .tt-crd-summary strong span {
          font-family: var(--tt-font-sans);
          font-size: 0.68rem;
          font-weight: 800;
          color: #F4DA92;
          margin-left: 5px;
        }

        html[data-tier='lite'] .tt-gt-sheen { display: none !important; }
      `}</style>
    </section>
  );
}
