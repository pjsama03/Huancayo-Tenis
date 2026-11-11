// ============================================================================
// MATCHPOINT — CIRCUITO OFICIAL DE TENIS (VERSIÓN PRODUCCIÓN 60-30-10)
// PARTE 1 DE 3: IMPORTS, ACTIVOS VECTORIALES, DATOS MAESTROS Y COMPONENTES PRO
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Swords, MapPin, User, X, Phone, Shield, 
  Calendar, QrCode, Lock, CloudRain, Sun, 
  LogOut, Camera, Loader2, Sparkles, 
  Clock, CheckCircle2, Users, ChevronRight, 
  Eye, EyeOff, Bell, Menu, Award, Trash2, 
  MessageSquare, Gift, ShoppingBag, 
  Download, Check, BookOpen, Crown, GraduationCap, 
  Edit3, Settings, Star, ArrowLeft
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ============================================================================
// 1. ACTIVOS VECTORIALES SVG DE ALTA PRECISIÓN (SIN RECUADROS ARTIFICIALES)
// ============================================================================
const SvgTennisBall = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="mpBallGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#E9FF54" />
        <stop offset="55%" stopColor="#B8E61E" />
        <stop offset="100%" stopColor="#6E9900" />
      </radialGradient>
      <filter id="mpBallGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#10B981" floodOpacity="0.22" />
      </filter>
    </defs>
    <circle cx="60" cy="60" r="50" fill="url(#mpBallGrad)" filter="url(#mpBallGlow)" />
    <path d="M23 30 C 48 48, 48 72, 23 90" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
    <path d="M97 30 C 72 48, 72 72, 97 90" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
    <circle cx="60" cy="60" r="50" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.25" />
  </svg>
);

const SvgFlame = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mpFlameOuter" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="55%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <linearGradient id="mpFlameInner" x1="18" y1="12" x2="18" y2="33" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
    </defs>
    <path d="M19.5 2.5C19.5 2.5 28.5 10.2 28.5 19.5C28.5 26.8 23.6 32.5 17.5 32.5C11.2 32.5 6.5 27.1 6.5 20C6.5 14.8 9.8 10.3 12.2 8.2C12.2 8.2 11.5 13.2 14.5 14.2C13.2 9.4 16.2 4.8 19.5 2.5Z" fill="url(#mpFlameOuter)" />
    <path d="M17.8 13.5C17.8 13.5 23.2 18.2 23.2 23.5C23.2 27.9 20.4 31.2 16.8 31.2C13.2 31.2 10.8 28.1 10.8 24.2C10.8 20.9 13.4 18.5 14.8 17C14.8 17 14.5 20.1 16.4 20.6C15.6 17.8 16.4 15.2 17.8 13.5Z" fill="url(#mpFlameInner)" />
  </svg>
);

const SvgMedal = ({ rank = 1, className = "w-7 h-7" }) => {
  const palette = {
    1: { top: '#FDE047', bot: '#CA8A04', rim: '#FEF08A', text: '#422006' },
    2: { top: '#E4E4E7', bot: '#71717A', rim: '#FAFAFA', text: '#18181B' },
    3: { top: '#FDBA74', bot: '#9A3412', rim: '#FED7AA', text: '#431407' }
  }[rank] || { top: '#FDE047', bot: '#CA8A04', rim: '#FEF08A', text: '#422006' };

  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 5L17.5 15H11L8.5 5H13Z" fill="#D96B43" opacity="0.85" />
      <path d="M27 5L22.5 15H29L31.5 5H27Z" fill="#D96B43" opacity="0.85" />
      <circle cx="20" cy="24" r="11.5" fill={palette.top} stroke={palette.rim} strokeWidth="1.5" />
      <circle cx="20" cy="24" r="8.5" fill={palette.bot} fillOpacity="0.25" />
      <text x="20" y="28" textAnchor="middle" fill={palette.text} fontSize="11.5" fontWeight="900" fontFamily="Outfit, sans-serif">
        {rank}
      </text>
    </svg>
  );
};

const SvgTrophy = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mpTrophyGold" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="55%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#A16207" />
      </linearGradient>
    </defs>
    <path d="M11 8H29V17C29 22.5 25 26.5 20 26.5C15 26.5 11 22.5 11 17V8Z" fill="url(#mpTrophyGold)" />
    <path d="M11 10H6.5V15C6.5 18.2 8.5 20 11 20" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M29 10H33.5V15C33.5 18.2 31.5 20 29 20" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="17.5" y="26" width="5" height="6" rx="1" fill="#CA8A04" />
    <rect x="12.5" y="32" width="15" height="3.5" rx="1.75" fill="url(#mpTrophyGold)" />
  </svg>
);

// Trama arquitectónica de cancha de tenis para cabeceras y Carnet VIP
const SvgCourtLinesBg = ({ className = "w-full h-full opacity-[0.04]" }) => (
  <svg viewBox="0 0 400 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <rect x="20" y="15" width="360" height="170" stroke="#FFFFFF" strokeWidth="2" />
    <line x1="20" y1="38" x2="380" y2="38" stroke="#FFFFFF" strokeWidth="1.5" />
    <line x1="20" y1="162" x2="380" y2="162" stroke="#FFFFFF" strokeWidth="1.5" />
    <line x1="200" y1="15" x2="200" y2="185" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="110" y1="38" x2="110" y2="162" stroke="#FFFFFF" strokeWidth="1.5" />
    <line x1="290" y1="38" x2="290" y2="162" stroke="#FFFFFF" strokeWidth="1.5" />
    <line x1="110" y1="100" x2="290" y2="100" stroke="#FFFFFF" strokeWidth="1.5" />
  </svg>
);

// ============================================================================
// 2. MENSAJES EMOTIVOS EN MOMENTOS CRUCIALES (SIN MARQUESINA EN EL HEADER)
// ============================================================================
const FRASES_MOMENTOS_CRUCIALES = {
  victoria: [
    "Gran cierre de partido. La constancia en los puntos importantes marca la diferencia en el circuito.",
    "Victoria oficial sumada. Descansa el brazo, hidrátate bien y prepara tu próximo ascenso en la tabla.",
    "Triunfo sólido en cancha. Mantén el enfoque y defiende tu racha en el siguiente desafío."
  ],
  derrota: [
    "El tenis da revanchas cada semana. Analiza los momentos clave del set y vuelve más firme a la cancha.",
    "Todo partido disputado suma experiencia y ritmo de competencia. Tu próximo desafío ya te espera.",
    "Los mejores tenistas del circuito se forjan en los partidos más duros. ¡A levantar cabeza y seguir jugando!"
  ],
  calibracionCompleta: [
    "¡Has completado tus 5 partidos oficiales de calibración! Tu categoría oficial ha sido desbloqueada en el circuito."
  ]
};

// ============================================================================
// 3. UTILIDAD DE COMPRESIÓN DE IMÁGENES EN CLIENTE (COSTO CERO)
// ============================================================================
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const max = 720;
        let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round((h * max) / w); w = max; }
        else if (h >= w && h > max) { w = Math.round((w * max) / h); h = max; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Error al procesar imagen'));
          const newFile = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
          resolve({ file: newFile, preview: canvas.toDataURL('image/jpeg', 0.82) });
        }, 'image/jpeg', 0.82);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// ============================================================================
// 4. ESCALA DE CATEGORÍAS Y 4 PREGUNTAS DIRECTAS (SIN COLORES CHILLONES)
// ============================================================================
const ESCALA_CATEGORIAS = [
  { id: '5ª P', nombre: '5ª P · Principiante', min: 0, max: 600, badge: 'Iniciación' },
  { id: '5ª B', nombre: '5ª B · Inicial', min: 601, max: 1200, badge: 'Regular Inicial' },
  { id: '5ª A', nombre: '5ª A · Consolidado', min: 1201, max: 1800, badge: 'Intermedio' },
  { id: '4ª', nombre: '4ª Categoría', min: 1801, max: 2800, badge: 'Avanzado de Club' },
  { id: '3ª', nombre: '3ª Categoría', min: 2801, max: 3800, badge: 'Primera Fuerza Local' },
  { id: '2ª', nombre: '2ª Categoría', min: 3801, max: 4800, badge: 'Élite Regional' },
  { id: '1ª', nombre: '1ª Categoría', min: 4801, max: 6000, badge: 'Máster Pro' }
];

const getInfoCategoria = (puntos = 1000) => {
  return ESCALA_CATEGORIAS.find(c => puntos >= c.min && puntos <= c.max) || ESCALA_CATEGORIAS[6];
};

const FLASH_CARDS_4_OPCIONES = [
  {
    paso: 1,
    titulo: 'Experiencia en Cancha',
    pregunta: '¿Cuál es tu experiencia actual jugando al tenis?',
    nota: 'Si estás empezando desde cero, elige la primera opción para ubicarte con rivales de iniciación.',
    escala: [
      { valor: 1, label: 'Empiezo de cero: No sé nada de tenis o recién voy a tomar clases' },
      { valor: 2, label: 'Principiante: Peloteo suave de vez en cuando con amigos' },
      { valor: 3, label: 'Intermedio: Juego seguido y mantengo peloteos largos de fondo' },
      { valor: 4, label: 'Avanzado: Juego hace años, entreno firme y compito en torneos' }
    ]
  },
  {
    paso: 2,
    titulo: 'Al Momento de Sacar',
    pregunta: 'Al momento de sacar, ¿cómo es tu servicio?',
    nota: 'Tu regularidad con el saque nos permite emparejarte en partidos equilibrados.',
    escala: [
      { valor: 1, label: 'Aún no sé sacar: Recién estoy aprendiendo el movimiento' },
      { valor: 2, label: 'Saque suave: Solo busco pasar la pelota para no hacer doble falta' },
      { valor: 3, label: 'Saque seguro: Buen primer saque y segundo saque constante' },
      { valor: 4, label: 'Saque de ataque: Saco fuerte, colocado a las esquinas y con efecto' }
    ]
  },
  {
    paso: 3,
    titulo: 'Control de Golpes y Efectos',
    pregunta: '¿Dominas efectos como el Topspin (con giro) o el Slice (cortado)?',
    nota: 'Nos ayuda a diferenciar el juego recreativo del juego competitivo de club.',
    escala: [
      { valor: 1, label: 'No sé qué son: Recién estoy aprendiendo a impactar la pelota' },
      { valor: 2, label: 'Golpeo plano: Sé qué son, pero pego casi siempre plano por seguridad' },
      { valor: 3, label: 'Los uso bien: Pego con topspin de fondo y uso slice para defenderme' },
      { valor: 4, label: 'Dominio completo: Controlo topspin pesado, slice, globos y voleas' }
    ]
  },
  {
    paso: 4,
    titulo: 'Partidos a Sets Completos',
    pregunta: '¿Qué tanta costumbre tienes jugando sets con puntaje oficial (15, 30, 40, Set)?',
    nota: 'Tu categoría estará protegida durante tus primeros 5 partidos mientras se calibra tu nivel.',
    escala: [
      { valor: 1, label: 'Ninguna aún: Todavía no he jugado sets o estoy aprendiendo a contar' },
      { valor: 2, label: 'Poca: Juego sets amistosos ocasionales sin tanta exigencia física' },
      { valor: 3, label: 'Frecuente: Juego partidos completos casi todas las semanas' },
      { valor: 4, label: 'Nivel Torneo: He competido en campeonatos llegando a rondas finales' }
    ]
  }
];

const calcularPuntos4Opciones = (respuestas) => {
  const pts = respuestas.reduce((a, b) => a + (b - 1), 0);
  if (pts <= 2) return { elo: 350 + pts * 60, cat: '5ª P' };
  if (pts <= 5) return { elo: 720 + (pts - 3) * 120, cat: '5ª B' };
  if (pts <= 8) return { elo: 1320 + (pts - 6) * 130, cat: '5ª A' };
  if (pts <= 10) return { elo: 2050 + (pts - 9) * 260, cat: '4ª' };
  return { elo: 2950 + (pts - 11) * 250, cat: '3ª' };
};

const calcularFactorDominio = (scoreStr) => {
  try {
    const sets = scoreStr.split(',').map(s => s.trim());
    let gA = 0, gB = 0;
    sets.forEach(s => {
      const partes = s.replace(/\[|\]/g, '').split('-').map(n => parseInt(n.trim(), 10));
      if (partes.length === 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
        if (partes[0] >= 10 || partes[1] >= 10) {
          if (partes[0] > partes[1]) gA += 1; else gB += 1;
        } else {
          gA += partes[0]; gB += partes[1];
        }
      }
    });
    const total = gA + gB;
    if (total === 0) return { fd: 1.0, label: 'Partido Estándar' };
    const margen = Math.abs(gA - gB) / total;
    if (margen >= 0.70) return { fd: 1.8, label: 'Victoria Contundente' };
    if (margen >= 0.40) return { fd: 1.35, label: 'Victoria Clara' };
    if (margen >= 0.18) return { fd: 1.0, label: 'Resultado Estándar' };
    return { fd: 0.5, label: 'Encuentro Muy Parejo' };
  } catch {
    return { fd: 1.0, label: 'Resultado Estándar' };
  }
};

// ============================================================================
// 5. DATOS DE SEDES, MARKETPLACE COACH PRO, TORNEOS EN VIVO Y PATROCINADORES
// ============================================================================
const PATROCINADORES_INICIALES = {
  torneoPrincipal: 'Wilson & Gatorade Huancayo',
  pelotaOficial: 'Wilson Roland Garros All Court',
  clinicaAliada: 'Centro Fisioterapia ProSport'
};

const SEDES_CLUB_PRO = [
  {
    id: 'club-country',
    nombre: 'Country Club Huancayo',
    canchas: '3 Canchas de Arcilla Reglamentarias',
    zona: 'El Tambo',
    tel: '964123456',
    servicios: ['Iluminación Nocturna', 'Restaurante', 'Vestuarios', 'Estacionamiento'],
    beneficioMatchpoint: '15% de descuento en alquiler de cancha en horario valle (10:00 a 15:00) presentando tu Carnet VIP Matchpoint.',
    sponsorBadge: 'SEDE OFICIAL',
    pelotaSponsor: 'Canchas provistas con pelotas Wilson Roland Garros',
    img: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'club-tauro',
    nombre: 'Club Tauro Tenis',
    canchas: '2 Canchas de Arcilla Techadas',
    zona: 'San Carlos',
    tel: '954987654',
    servicios: ['100% Techadas', 'Iluminación LED', 'Encordado Express', 'Tribuna'],
    beneficioMatchpoint: 'Prioridad de reserva en días de lluvia para partidos oficiales del ranking.',
    sponsorBadge: 'SEDE TECHADA',
    pelotaSponsor: 'Iluminación y mantenimiento respaldado por Babolat Perú',
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'club-romina',
    nombre: 'Academia Romina Cutipa',
    canchas: '2 Canchas de Arcilla',
    zona: 'Huancayo Este',
    tel: '999555444',
    servicios: ['Academia Formativa', 'Canasto de Pelotas', 'Alquiler de Raquetas', 'Kiosco'],
    beneficioMatchpoint: '20% de descuento en tu primera sesión de diagnóstico técnico.',
    sponsorBadge: 'SEDE FORMATIVA',
    pelotaSponsor: 'Hidratación oficial Powerade & Gatorade en sede',
    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'club-shyam',
    nombre: 'Complejo Shyam Huilca',
    canchas: '1 Rápida / 1 Arcilla',
    zona: 'Chilca',
    tel: '988333222',
    servicios: ['Doble Superficie', 'Iluminación', 'Parqueo Privado'],
    beneficioMatchpoint: 'Préstamo de tubo de pelotas sin costo al reservar 2 horas continuas para retos.',
    sponsorBadge: 'CLUB ASOCIADO',
    pelotaSponsor: 'Superficie mantenida junto a ProShop Huancayo',
    img: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=900&q=80'
  }
];

const PROFESORES_INICIALES = [
  {
    id: 'prof-1',
    nombre: 'Rodrigo Quispe',
    certificacion: 'Coach Nivel ITF · Ex N°1 Regional',
    rating: '4.9',
    resenasCount: 34,
    horasImpartidas: '+420h',
    tarifaBase: 50,
    sede: 'Country Club Huancayo · Academia Romina',
    tel: '944889900',
    activo: true,
    nichos: ['Adultos +40', 'Biomecánica de Saque', 'Táctica de Singles'],
    bioCorta: 'Especialista en corrección técnica para jugadores de club y preparación táctica para torneos.',
    fotoAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    fotoBanner: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80',
    programas: [
      { id: 'p1', titulo: 'Sesión Individual 1 a 1', detalle: '60 min · Corrección de golpes y peloteo intensivo con canasto', precio: 'S/ 50' },
      { id: 'p2', titulo: 'Pack 4 Clases · Subida de Categoría', detalle: '4 horas al mes · Plan táctico para pasar de 5ª a 4ª categoría', precio: 'S/ 180' },
      { id: 'p3', titulo: 'Clínica Grupal Senior +40 (Sábados)', detalle: '90 min · Máximo 4 jugadores · Juego de red, dobles y colocación', precio: 'S/ 35 / alumno' }
    ],
    turnosLibres: [
      { id: 't1', dia: 'Mañana', hora: '08:00 AM', club: 'Country Club', disponible: true },
      { id: 't2', dia: 'Mañana', hora: '10:00 AM', club: 'Country Club', disponible: true },
      { id: 't3', dia: 'Jueves', hora: '07:00 PM', club: 'Academia Romina', disponible: true },
      { id: 't4', dia: 'Sábado', hora: '09:00 AM', club: 'Country Club', disponible: true },
      { id: 't5', dia: 'Sábado', hora: '04:00 PM', club: 'Country Club', disponible: true }
    ],
    resenas: [
      { autor: 'Alejandro Tovar (+40)', texto: 'Corrigió mi segundo saque en dos sesiones. Muy claro para explicar.', estrellas: 5 },
      { autor: 'Mateo Samaniego (Cat. 4ª)', texto: 'Excelentes ejercicios de ritmo de fondo y subida a la red.', estrellas: 5 }
    ]
  },
  {
    id: 'prof-2',
    nombre: 'Romina Cutipa',
    certificacion: 'Directora de Academia · Coach FPT',
    rating: '5.0',
    resenasCount: 41,
    horasImpartidas: '+650h',
    tarifaBase: 45,
    sede: 'Academia Romina Cutipa',
    tel: '999555444',
    activo: true,
    nichos: ['Iniciación desde Cero', 'Rama Damas', 'Grupos Formativos'],
    bioCorta: 'Metodología paso a paso ideal para adultos que empiezan de cero y jugadoras que buscan competir.',
    fotoAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    fotoBanner: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80',
    programas: [
      { id: 'r1', titulo: 'Clase Particular de Diagnóstico', detalle: '60 min · Incluye préstamo de raqueta y canasto de pelotas', precio: 'S/ 45' },
      { id: 'r2', titulo: 'Programa "De Cero a tu Primer Set"', detalle: '4 sesiones · Aprende derecha, revés, saque y conteo oficial', precio: 'S/ 160' },
      { id: 'r3', titulo: 'Grupo Oficial Damas (Mar / Jue)', detalle: 'Turnos mañana y noche · Técnica, movilidad y partidos guiados', precio: 'S/ 150 / mes' }
    ],
    turnosLibres: [
      { id: 'tr1', dia: 'Hoy', hora: '05:00 PM', club: 'Academia Romina', disponible: true },
      { id: 'tr2', dia: 'Mañana', hora: '09:00 AM', club: 'Academia Romina', disponible: true },
      { id: 'tr3', dia: 'Viernes', hora: '06:00 PM', club: 'Academia Romina', disponible: true },
      { id: 'tr4', dia: 'Sábado', hora: '11:00 AM', club: 'Academia Romina', disponible: true }
    ],
    resenas: [
      { autor: 'Claudia Soto (Damas)', texto: 'Empecé sin saber agarrar la raqueta y hoy ya juego mis primeros torneos.', estrellas: 5 },
      { autor: 'Ernesto Velarde (5ª P)', texto: 'Paciencia total y clases súper dinámicas.', estrellas: 5 }
    ]
  }
];

const SALON_DE_LA_FAMA_HISTORICO = [
  {
    temporada: 'Temporada Invierno 2026',
    campeones: [
      { division: '3ª Categoría', nombre: 'Carlos Mendoza', club: 'Country Club Huancayo', record: '11G - 1P' },
      { division: '4ª Categoría', nombre: 'Diego Cárdenas', club: 'Academia Romina Cutipa', record: '9G - 2P' },
      { division: '5ª Categoría A', nombre: 'Gonzalo Palacios', club: 'Complejo Shyam Huilca', record: '8G - 1P' },
      { division: 'Senior +40', nombre: 'Alejandro Tovar', club: 'Country Club Huancayo', record: '7G - 1P' },
      { division: 'Damas Oficial', nombre: 'Romina Cutipa', club: 'Academia Romina Cutipa', record: '8G - 0P' }
    ]
  }
];

// TORNEOS DINÁMICOS CON 3 ETAPAS VIVAS Y CUADROS DE ELIMINATORIA (BRACKETS)
const TORNEOS_INICIALES = [
  {
    id: 't-3a',
    cat: '3ª',
    titulo: 'Abierto de Huancayo · 3ª Categoría',
    subtitulo: 'Cuadro de Maestros · Eliminatoria Directa + Consuelo',
    sponsor: 'Wilson & Gatorade',
    sede: 'Country Club Huancayo',
    fecha: '21 y 22 de Noviembre',
    precio: 45,
    min: 8,
    maxCupos: 16,
    estadoTorneo: 'en_juego', // 'inscripciones' | 'en_juego' | 'finalizado'
    img: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
    participantes: [
      { nombre: 'Carlos Mendoza', club: 'Country Club Huancayo', pts: 3120 },
      { nombre: 'Renato Vilchez', club: 'Club Tauro Tenis', pts: 2980 },
      { nombre: 'Diego Cárdenas', club: 'Academia Romina Cutipa', pts: 2890 },
      { nombre: 'Alejandro Tovar', club: 'Country Club Huancayo', pts: 2850 },
      { nombre: 'Gonzalo Palacios', club: 'Complejo Shyam Huilca', pts: 2780 },
      { nombre: 'Mateo Samaniego', club: 'Country Club Huancayo', pts: 2740 },
      { nombre: 'Sebastián Romero', club: 'Club Tauro Tenis', pts: 2660 },
      { nombre: 'Rodrigo Quispe', club: 'Country Club Huancayo', pts: 2620 }
    ],
    brackets: {
      cuartos: [
        { id: 'qf1', j1: '#1 Carlos Mendoza', j2: '#8 Rodrigo Quispe', cancha: 'Cancha 1 · Sáb 09:00', score: '6-3, 6-4', ganador: '#1 Carlos Mendoza', perdedor: '#8 Rodrigo Quispe' },
        { id: 'qf2', j1: '#4 Alejandro Tovar', j2: '#5 Gonzalo Palacios', cancha: 'Cancha 2 · Sáb 09:00', score: '7-5, 6-4', ganador: '#4 Alejandro Tovar', perdedor: '#5 Gonzalo Palacios' },
        { id: 'qf3', j1: '#3 Diego Cárdenas', j2: '#6 Mateo Samaniego', cancha: 'Cancha 1 · Sáb 11:00', score: 'En Cancha', ganador: null, perdedor: null },
        { id: 'qf4', j1: '#2 Renato Vilchez', j2: '#7 Sebastián Romero', cancha: 'Cancha 2 · Sáb 11:00', score: 'Programado', ganador: null, perdedor: null }
      ],
      semis: [
        { id: 'sf1', j1: '#1 Carlos Mendoza', j2: '#4 Alejandro Tovar', cancha: 'Cancha Central · Dom 09:30', score: 'Programado', ganador: null },
        { id: 'sf2', j1: 'Ganador QF3', j2: 'Ganador QF4', cancha: 'Cancha Central · Dom 11:30', score: 'Por Definir', ganador: null }
      ],
      final: [
        { id: 'f1', j1: 'Ganador Semifinal 1', j2: 'Ganador Semifinal 2', cancha: 'Cancha Central · Dom 16:00', score: 'Gran Final', ganador: null }
      ],
      consueloSemis: [
        { id: 'csf1', j1: '#8 Rodrigo Quispe', j2: '#5 Gonzalo Palacios', cancha: 'Cancha 3 · Dom 09:00', score: 'Programado', ganador: null },
        { id: 'csf2', j1: 'Perdedor QF3', j2: 'Perdedor QF4', cancha: 'Cancha 3 · Dom 10:30', score: 'Por Definir', ganador: null }
      ],
      consueloFinal: [
        { id: 'cf1', j1: 'Ganador Consuelo 1', j2: 'Ganador Consuelo 2', cancha: 'Cancha 2 · Dom 15:00', score: 'Final Consuelo', ganador: null }
      ]
    }
  },
  {
    id: 't-4a',
    cat: '4ª',
    titulo: 'Copa Apertura · 4ª Categoría',
    subtitulo: 'Cuadro Principal + Ronda Consuelo Garantizada',
    sponsor: 'Babolat & ProSport',
    sede: 'Country Club Huancayo',
    fecha: '21 y 22 de Noviembre',
    precio: 40,
    min: 8,
    maxCupos: 16,
    estadoTorneo: 'inscripciones',
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    participantes: [
      { nombre: 'Martín Santillán', club: 'Country Club Huancayo', pts: 2420 },
      { nombre: 'Jorge Villavicencio', club: 'Club Tauro Tenis', pts: 2390 },
      { nombre: 'Luis Fernando Paz', club: 'Independiente', pts: 2250 },
      { nombre: 'Gonzalo Palacios', club: 'Complejo Shyam Huilca', pts: 2180 },
      { nombre: 'Mateo Samaniego', club: 'Country Club Huancayo', pts: 2140 },
      { nombre: 'Sebastián Romero', club: 'Club Tauro Tenis', pts: 2060 },
      { nombre: 'Franco Huamán', club: 'Academia Romina Cutipa', pts: 1980 },
      { nombre: 'Héctor Baldeón', club: 'Club Tauro Tenis', pts: 1910 }
    ],
    brackets: {
      cuartos: [
        { id: 'qf1', j1: '#1 Martín Santillán', j2: '#8 Héctor Baldeón', cancha: 'Sáb 10:00', score: 'Programado', ganador: null, perdedor: null },
        { id: 'qf2', j1: '#4 Gonzalo Palacios', j2: '#5 Mateo Samaniego', cancha: 'Sáb 10:00', score: 'Programado', ganador: null, perdedor: null },
        { id: 'qf3', j1: '#3 Luis Fernando Paz', j2: '#6 Sebastián Romero', cancha: 'Sáb 12:00', score: 'Programado', ganador: null, perdedor: null },
        { id: 'qf4', j1: '#2 Jorge Villavicencio', j2: '#7 Franco Huamán', cancha: 'Sáb 12:00', score: 'Programado', ganador: null, perdedor: null }
      ],
      semis: [
        { id: 'sf1', j1: 'Ganador QF1', j2: 'Ganador QF2', cancha: 'Dom 10:00', score: 'Por Definir', ganador: null },
        { id: 'sf2', j1: 'Ganador QF3', j2: 'Ganador QF4', cancha: 'Dom 11:30', score: 'Por Definir', ganador: null }
      ],
      final: [
        { id: 'f1', j1: 'Finalista 1', j2: 'Finalista 2', cancha: 'Dom 16:00', score: 'Gran Final', ganador: null }
      ],
      consueloSemis: [
        { id: 'csf1', j1: 'Perdedor QF1', j2: 'Perdedor QF2', cancha: 'Dom 09:00', score: 'Por Definir', ganador: null },
        { id: 'csf2', j1: 'Perdedor QF3', j2: 'Perdedor QF4', cancha: 'Dom 10:30', score: 'Por Definir', ganador: null }
      ],
      consueloFinal: [
        { id: 'cf1', j1: 'Ganador Consuelo 1', j2: 'Ganador Consuelo 2', cancha: 'Dom 14:30', score: 'Final Consuelo', ganador: null }
      ]
    }
  },
  {
    id: 't-5a',
    cat: '5ª A',
    titulo: 'Copa Apertura · 5ª Categoría A',
    subtitulo: 'Intermedio Consolidado · Puntos Oficiales de Circuito',
    sponsor: 'Tienda ProShop Huancayo',
    sede: 'Club Tauro Tenis',
    fecha: '28 y 29 de Noviembre',
    precio: 40,
    min: 8,
    maxCupos: 16,
    estadoTorneo: 'inscripciones',
    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    participantes: [
      { nombre: 'Pedro Pablo Lazo', club: 'Country Club Huancayo', pts: 1680 },
      { nombre: 'Héctor Baldeón', club: 'Club Tauro Tenis', pts: 1610 },
      { nombre: 'César Augusto Ríos', club: 'Independiente', pts: 1550 },
      { nombre: 'Daniel Verástegui', club: 'Club Tauro Tenis', pts: 1530 },
      { nombre: 'Roberto Gómez', club: 'Country Club Huancayo', pts: 1510 },
      { nombre: 'Miguel Ángel Soto', club: 'Academia Romina Cutipa', pts: 1490 },
      { nombre: 'Franco Huamán', club: 'Academia Romina Cutipa', pts: 1480 },
      { nombre: 'Joaquín Paredes', club: 'Complejo Shyam Huilca', pts: 1440 }
    ],
    brackets: {
      cuartos: [
        { id: 'qf1', j1: '#1 Pedro Pablo Lazo', j2: '#8 Joaquín Paredes', cancha: 'Sáb 09:00', score: 'Programado', ganador: null, perdedor: null },
        { id: 'qf2', j1: '#4 Daniel Verástegui', j2: '#5 Roberto Gómez', cancha: 'Sáb 09:00', score: 'Programado', ganador: null, perdedor: null },
        { id: 'qf3', j1: '#3 César Augusto Ríos', j2: '#6 Miguel Ángel Soto', cancha: 'Sáb 11:00', score: 'Programado', ganador: null, perdedor: null },
        { id: 'qf4', j1: '#2 Héctor Baldeón', j2: '#7 Franco Huamán', cancha: 'Sáb 11:00', score: 'Programado', ganador: null, perdedor: null }
      ],
      semis: [
        { id: 'sf1', j1: 'Ganador QF1', j2: 'Ganador QF2', cancha: 'Dom 09:30', score: 'Por Definir', ganador: null },
        { id: 'sf2', j1: 'Ganador QF3', j2: 'Ganador QF4', cancha: 'Dom 11:00', score: 'Por Definir', ganador: null }
      ],
      final: [
        { id: 'f1', j1: 'Finalista 1', j2: 'Finalista 2', cancha: 'Dom 15:30', score: 'Gran Final', ganador: null }
      ],
      consueloSemis: [
        { id: 'csf1', j1: 'Perdedor QF1', j2: 'Perdedor QF2', cancha: 'Dom 09:00', score: 'Por Definir', ganador: null },
        { id: 'csf2', j1: 'Perdedor QF3', j2: 'Perdedor QF4', cancha: 'Dom 10:30', score: 'Por Definir', ganador: null }
      ],
      consueloFinal: [
        { id: 'cf1', j1: 'Ganador Consuelo 1', j2: 'Ganador Consuelo 2', cancha: 'Dom 14:00', score: 'Final Consuelo', ganador: null }
      ]
    }
  }
];

const PRODUCTOS_TIENDA = [
  {
    id: 'srv-encordado',
    tipo: 'Taller Oficial',
    nombre: 'Encordado Profesional + Recojo en Club',
    desc: 'Poliéster Control o Multifilamento. Calibración electrónica exacta en libras.',
    precio: 35,
    precioRacha: 30,
    badge: 'Servicio Oficial'
  },
  {
    id: 'prod-overgrip',
    tipo: 'Accesorios',
    nombre: 'Pack x3 Overgrips Pro Tacky',
    desc: 'Agarre antideslizante de alta absorción para arcilla.',
    precio: 25,
    precioRacha: 20,
    badge: 'Alta Rotación'
  },
  {
    id: 'prod-pelotas',
    tipo: 'Material Oficial',
    nombre: 'Tubo de Pelotas Wilson Roland Garros (x3)',
    desc: 'Fieltro tejido para máxima durabilidad en polvo de ladrillo.',
    precio: 32,
    precioRacha: 28,
    badge: 'Pelota Oficial'
  },
  {
    id: 'prod-raqueta-semi',
    tipo: 'Seminuevos Certificados',
    nombre: 'Babolat Pure Drive 300g (Estado 9.5/10)',
    desc: 'Inspeccionada por nuestros entrenadores. Incluye encordado nuevo.',
    precio: 580,
    precioRacha: 550,
    badge: 'Garantía Club'
  }
];

// ============================================================================
// 6. COMPONENTE ÉLITE 1: CARNET DIGITAL VIP (ESTÉTICA BLACK METAL / APPLE WALLET)
// ============================================================================
const CarnetDigitalVIP = ({ player, catInfo, rankPos, onClose }) => {
  if (!player) return null;
  const codigoSocio = `MP-2026-${String(player.id || 104).padStart(4, '0')}`;
  const totalPartidos = (player.victorias || 0) + (player.derrotas || 0);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 animate-[mpFadeSlide_0.22s_ease-out]"
      >
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#8E98A8]">
            Credencial Oficial de Socio
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#14171F] border border-[#222631] flex items-center justify-center text-zinc-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TARJETA PROPORCIÓN METAL CARD 1.58:1 */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1E29] via-[#11141B] to-[#0B0D11] border border-white/15 shadow-[0_24px_48px_rgba(0,0,0,0.85)] p-6 select-none">
          {/* Trama de cancha grabada al láser en bajo relieve */}
          <div className="absolute inset-0 pointer-events-none">
            <SvgCourtLinesBg className="w-full h-full opacity-[0.045]" />
          </div>
          {/* Luz radial sutil en esquina superior derecha */}
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#EAB308]/10 blur-3xl pointer-events-none"></div>

          {/* Fila Superior: Marca + Chip Metálico + Categoría */}
          <div className="relative flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black tracking-tight text-white">
                  MATCHPOINT
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30">
                  VIP PASS
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#8E98A8] block mt-0.5">
                Circuito Oficial · Huancayo
              </span>
            </div>

            {/* Chip de seguridad metálico simulado */}
            <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-zinc-400/30 via-zinc-200/40 to-amber-200/30 border border-white/20 flex items-center justify-center">
              <div className="w-6 h-4 border border-black/30 rounded-sm grid grid-cols-2 gap-px p-0.5">
                <div className="bg-black/20 rounded-xs"></div>
                <div className="bg-black/20 rounded-xs"></div>
              </div>
            </div>
          </div>

          {/* Fila Central: Foto Biselada + Datos Grabados */}
          <div className="relative flex items-center gap-4 my-6">
            <div className="w-16 h-16 rounded-2xl bg-[#0B0D11] border border-white/20 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
              {player.foto_url ? (
                <img src={player.foto_url} alt={player.nombre} className="w-full h-full object-cover object-center" />
              ) : (
                <User className="w-8 h-8 text-zinc-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#10B981] block">
                {totalPartidos < 5 ? 'EN CALIBRACIÓN OFICIAL' : `${catInfo.nombre.toUpperCase()}`}
              </span>
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white truncate tracking-tight mt-0.5">
                {player.nombre}
              </h3>
              <p className="text-xs text-[#8E98A8] font-medium truncate">
                {player.club || 'Socio Independiente'} · {player.mano || 'Diestro'}
              </p>
            </div>
          </div>

          {/* Fila Inferior: Métricas + Código QR Integrado */}
          <div className="relative pt-4 border-t border-white/10 flex items-end justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#8E98A8] block">RANKING</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-sm font-black text-white">
                    {rankPos > 0 ? `#${rankPos}` : '—'}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#8E98A8] block">PUNTOS</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-sm font-black text-[#10B981]">
                    {player.elo || 1000}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#8E98A8] block">TEMPORADA</span>
                  <span className="text-xs font-bold text-zinc-200">APERTURA 26</span>
                </div>
              </div>
              <p className="text-[11px] font-mono tracking-[0.22em] text-zinc-400 pt-1">
                {codigoSocio}
              </p>
            </div>

            <div className="p-2 rounded-xl bg-white text-zinc-950 shadow-md shrink-0">
              <QrCode className="w-11 h-11" />
            </div>
          </div>
        </div>

        {/* Nota de Beneficios Reales */}
        <div className="bg-[#14171F] border border-[#222631] rounded-2xl p-4 text-center space-y-1">
          <p className="text-xs font-bold text-white">
            Beneficio Activo en Sedes Aliadas y Taller de Encordado
          </p>
          <p className="text-[11px] text-[#8E98A8]">
            Muestra esta credencial en recepción del club o al solicitar encordado para aplicar tu tarifa de socio.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. COMPONENTE ÉLITE 2: FICHA MARKETPLACE DE ENTRENADOR (COACH PRO MODAL)
// ============================================================================
const CoachProProfileModal = ({ prof, onClose }) => {
  const [selectedTurno, setSelectedTurno] = useState(prof?.turnosLibres?.[0] || null);
  const [selectedProg, setSelectedProg] = useState(prof?.programas?.[0] || null);

  if (!prof) return null;

  const armarMensajeWhatsApp = () => {
    const turnoTxt = selectedTurno ? ` en el horario de ${selectedTurno.dia} a las ${selectedTurno.hora} (${selectedTurno.club})` : '';
    const progTxt = selectedProg ? ` para el programa "${selectedProg.titulo}" (${selectedProg.precio})` : '';
    return `Hola Prof. ${prof.nombre}, vi tu perfil oficial en MATCHPOINT y deseo reservar cupo${progTxt}${turnoTxt}.`;
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14171F] border border-[#222631] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-[mpFadeSlide_0.22s_ease-out]"
      >
        {/* Cabecera Multimedia 16:9 */}
        <div className="relative h-44 w-full bg-[#0B0D11] shrink-0">
          <img src={prof.fotoBanner || prof.fotoAvatar} alt={prof.nombre} className="w-full h-full object-cover opacity-65" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14171F] via-[#14171F]/40 to-transparent"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#0B0D11]/80 border border-white/15 flex items-center justify-center text-zinc-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-5 right-5 flex items-end gap-3.5">
            <div className="w-20 h-20 rounded-2xl bg-[#0B0D11] border-2 border-[#EAB308] overflow-hidden shrink-0 shadow-xl">
              {prof.fotoAvatar ? (
                <img src={prof.fotoAvatar} alt={prof.nombre} className="w-full h-full object-cover object-center" />
              ) : (
                <GraduationCap className="w-10 h-10 text-[#EAB308] m-auto mt-4" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30 mb-1">
                {prof.certificacion || 'Coach Pro Verificado'}
              </span>
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white leading-none truncate">
                {prof.nombre}
              </h3>
              <p className="text-xs text-[#8E98A8] font-medium truncate mt-1">
                📍 {prof.sede}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Confianza (Social Proof) */}
        <div className="grid grid-cols-3 border-y border-[#222631] bg-[#0B0D11]/60 py-3 px-4 text-center shrink-0">
          <div>
            <div className="flex items-center justify-center gap-1 text-white font-black text-sm">
              <Star className="w-3.5 h-3.5 text-[#EAB308] fill-[#EAB308]" /> {prof.rating || '4.9'}
            </div>
            <span className="text-[10px] text-[#8E98A8] font-semibold">{prof.resenasCount || 28} reseñas</span>
          </div>
          <div className="border-x border-[#222631]">
            <span className="text-sm font-black text-white block">{prof.horasImpartidas || '+300h'}</span>
            <span className="text-[10px] text-[#8E98A8] font-semibold">En cancha</span>
          </div>
          <div>
            <span className="text-sm font-black text-[#10B981] block">S/ {prof.tarifaBase || 45}</span>
            <span className="text-[10px] text-[#8E98A8] font-semibold">Hora base</span>
          </div>
        </div>

        {/* Cuerpo Scrollable: Especialidades, Programas y Turnos Libres */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Píldoras de Especialidad */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-300 leading-relaxed">{prof.bioCorta}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(prof.nichos || ['Técnica General', 'Partidos']).map((n, i) => (
                <span key={i} className="text-[11px] font-bold bg-[#0B0D11] text-zinc-200 border border-[#222631] px-3 py-1 rounded-lg">
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* 1. Selector de Programas y Paquetes */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8E98A8] block">
              1. Elige tu Modalidad o Programa
            </span>
            <div className="space-y-2">
              {(prof.programas || []).map((prog) => {
                const active = selectedProg?.id === prog.id;
                return (
                  <div
                    key={prog.id}
                    onClick={() => setSelectedProg(prog)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex justify-between items-center ${
                      active 
                        ? 'bg-[#0B0D11] border-[#10B981] shadow-md' 
                        : 'bg-[#0B0D11]/60 border-[#222631] hover:border-zinc-700'
                    }`}
                  >
                    <div className="pr-3">
                      <p className="text-xs font-extrabold text-white">{prog.titulo}</p>
                      <p className="text-[11px] text-[#8E98A8] mt-0.5">{prog.detalle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-sm font-black text-[#10B981] block">
                        {prog.precio}
                      </span>
                      {active && <span className="text-[10px] font-bold text-[#10B981]">✓ Elegido</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Selector de Huecos Libres en Cancha */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#8E98A8]">
                2. Horarios Disponibles esta Semana
              </span>
              <span className="text-[10px] font-bold text-[#10B981]">Actualizado hoy</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(prof.turnosLibres || []).filter(t => t.disponible !== false).map((t) => {
                const isSelected = selectedTurno?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTurno(t)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-[#10B981]/15 border-[#10B981] text-white'
                        : 'bg-[#0B0D11] border-[#222631] text-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-extrabold text-white">{t.dia} · {t.hora}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
                    </div>
                    <span className="text-[10px] text-[#8E98A8] block mt-0.5">{t.club}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Reseñas Verificadas de Alumnos */}
          {prof.resenas && prof.resenas.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#8E98A8] block">
                Comentarios de Jugadores del Circuito
              </span>
              <div className="space-y-2">
                {prof.resenas.map((r, i) => (
                  <div key={i} className="bg-[#0B0D11] border border-[#222631] p-3 rounded-2xl text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">{r.autor}</span>
                      <span className="text-[#EAB308] text-[11px]">★★★★★</span>
                    </div>
                    <p className="text-[#8E98A8] text-[11px] leading-relaxed">"{r.texto}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie Fijo: Botón de Reserva Inteligente */}
        <div className="p-4 border-t border-[#222631] bg-[#0B0D11] shrink-0">
          <a
            href={`https://wa.me/51${prof.tel.replace(/\D/g, '')}?text=${encodeURIComponent(armarMensajeWhatsApp())}`}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-[#10B981] hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
          >
            <Phone className="w-4 h-4" /> 
            {selectedTurno ? `Reservar ${selectedTurno.dia} ${selectedTurno.hora}` : 'Reservar Clase por WhatsApp'}
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 8. COMPONENTE ÉLITE 3: MOTOR DINÁMICO DE TORNEOS (BRACKETS + CONSUELO + SIEMBRA)
// ============================================================================
const TorneoDinamicoModal = ({ torneo, myPlayer, onClose, onInscribir, onUpdateBracketMatch, onToggleStage }) => {
  const [vistaInterna, setVistaInterna] = useState(
    torneo?.estadoTorneo === 'inscripciones' ? 'inscritos' : 'principal'
  );
  const [rondaActiva, setRondaActiva] = useState('cuartos');
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchScoreInput, setMatchScoreInput] = useState('6-4, 6-3');
  const [matchWinnerSide, setMatchWinnerSide] = useState('j1');

  if (!torneo) return null;

  // Ordenar participantes por puntos para asignar Cabezas de Serie (Seeding) automático
  const inscritosOrdenados = [...(torneo.participantes || [])].sort((a, b) => (b.pts || 1000) - (a.pts || 1000));
  const inscritosCount = inscritosOrdenados.length;
  const cuposLibres = Math.max(0, torneo.maxCupos - inscritosCount);

  const handleGuardarResultadoLlave = (e) => {
    e.preventDefault();
    if (!editingMatch) return;
    const ganadorNombre = matchWinnerSide === 'j1' ? editingMatch.match.j1 : editingMatch.match.j2;
    const perdedorNombre = matchWinnerSide === 'j1' ? editingMatch.match.j2 : editingMatch.match.j1;
    onUpdateBracketMatch(torneo.id, editingMatch.fase, editingMatch.index, matchScoreInput, ganadorNombre, perdedorNombre);
    setEditingMatch(null);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14171F] border border-[#222631] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-[mpFadeSlide_0.22s_ease-out]"
      >
        {/* Cabecera del Torneo con Patrocinador Oficial */}
        <div className="relative h-36 w-full bg-[#0B0D11] shrink-0">
          <img src={torneo.img} alt={torneo.titulo} className="w-full h-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14171F] via-[#14171F]/50 to-transparent"></div>

          <div className="absolute top-3.5 left-4 right-4 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#0B0D11]/85 text-[#D96B43] border border-[#D96B43]/40">
              Presentado por {torneo.sponsor || 'Sponsor Oficial'}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#0B0D11]/85 border border-white/15 flex items-center justify-center text-zinc-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-3 left-5 right-5 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10B981] block">
                📍 {torneo.sede} · {torneo.fecha}
              </span>
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white leading-tight mt-0.5">
                {torneo.titulo}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onToggleStage(torneo.id)}
              title="Cambiar fase del torneo para demostración en vivo"
              className="text-[10px] font-bold bg-[#0B0D11]/90 border border-[#222631] text-zinc-300 px-2.5 py-1 rounded-lg hover:border-zinc-600 shrink-0"
            >
              {torneo.estadoTorneo === 'inscripciones' ? '⚡ Ver Cuadro en Vivo' : '📋 Fase Inscripción'}
            </button>
          </div>
        </div>

        {/* Selector de las 3 Vistas del Torneo */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#0B0D11] p-2 border-b border-[#222631] shrink-0">
          <button
            type="button"
            onClick={() => setVistaInterna('principal')}
            className={`py-2 rounded-xl text-[11px] font-extrabold transition ${
              vistaInterna === 'principal' ? 'bg-[#14171F] text-[#10B981] border border-[#222631]' : 'text-[#8E98A8]'
            }`}
          >
            🏆 Cuadro Principal
          </button>
          <button
            type="button"
            onClick={() => setVistaInterna('consuelo')}
            className={`py-2 rounded-xl text-[11px] font-extrabold transition ${
              vistaInterna === 'consuelo' ? 'bg-[#14171F] text-[#D96B43] border border-[#222631]' : 'text-[#8E98A8]'
            }`}
          >
            🛡️ Ronda Consuelo
          </button>
          <button
            type="button"
            onClick={() => setVistaInterna('inscritos')}
            className={`py-2 rounded-xl text-[11px] font-extrabold transition ${
              vistaInterna === 'inscritos' ? 'bg-[#14171F] text-white border border-[#222631]' : 'text-[#8E98A8]'
            }`}
          >
            👥 Siembra ({inscritosCount})
          </button>
        </div>

        {/* Contenido Dinámico según Pestaña */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {vistaInterna === 'principal' && (
            <div className="space-y-4">
              {/* Sub-navegador de Rondas: Cuartos -> Semis -> Final */}
              <div className="flex items-center justify-between bg-[#0B0D11] p-1.5 rounded-2xl border border-[#222631]">
                {[
                  { id: 'cuartos', label: 'Cuartos de Final' },
                  { id: 'semis', label: 'Semifinales' },
                  { id: 'final', label: 'Gran Final' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRondaActiva(r.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition ${
                      rondaActiva === r.id ? 'bg-[#10B981] text-zinc-950 shadow' : 'text-[#8E98A8]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-[#8E98A8] px-1">
                Toca cualquier llave para registrar el marcador oficial; el ganador avanza automáticamente a la siguiente ronda.
              </p>

              {/* Lista de Llaves de la Ronda Activa */}
              <div className="space-y-2.5">
                {(torneo.brackets?.[rondaActiva] || []).map((match, idx) => (
                  <div
                    key={match.id || idx}
                    onClick={() => {
                      setEditingMatch({ fase: rondaActiva, index: idx, match });
                      setMatchScoreInput(match.score && match.score.includes('-') ? match.score : '6-4, 6-3');
                      setMatchWinnerSide('j1');
                    }}
                    className="bg-[#0B0D11] border border-[#222631] hover:border-zinc-700 rounded-2xl p-3.5 cursor-pointer transition space-y-2"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-[#8E98A8]">
                      <span>📍 {match.cancha}</span>
                      <span className={`px-2 py-0.5 rounded font-black ${
                        match.ganador ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-white/5 text-zinc-300'
                      }`}>
                        {match.score}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-extrabold ${match.ganador === match.j1 ? 'text-[#10B981]' : 'text-white'}`}>
                          {match.j1}
                        </span>
                        {match.ganador === match.j1 && <Check className="w-4 h-4 text-[#10B981]" />}
                      </div>
                      <div className="h-px bg-[#222631]"></div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-extrabold ${match.ganador === match.j2 ? 'text-[#10B981]' : 'text-white'}`}>
                          {match.j2}
                        </span>
                        {match.ganador === match.j2 && <Check className="w-4 h-4 text-[#10B981]" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vistaInterna === 'consuelo' && (
            <div className="space-y-3">
              <div className="bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl text-xs">
                <span className="font-extrabold text-[#D96B43] block">🛡️ Garantía de Segundo Partido</span>
                <p className="text-[#8E98A8] text-[11px] mt-0.5">
                  Los jugadores que caen en Cuartos de Final pasan automáticamente al cuadro de Consuelo para seguir compitiendo por puntos y trofeo.
                </p>
              </div>

              <span className="text-[11px] font-black uppercase tracking-wider text-[#8E98A8] block">
                Semifinales de Consuelo
              </span>
              {(torneo.brackets?.consueloSemis || []).map((match, idx) => (
                <div
                  key={match.id || idx}
                  onClick={() => {
                    setEditingMatch({ fase: 'consueloSemis', index: idx, match });
                    setMatchScoreInput('6-4, 6-4');
                  }}
                  className="bg-[#0B0D11] border border-[#222631] rounded-2xl p-3.5 cursor-pointer space-y-1.5"
                >
                  <div className="flex justify-between text-[10px] text-[#8E98A8] font-bold">
                    <span>{match.cancha}</span>
                    <span className="text-[#D96B43]">{match.score}</span>
                  </div>
                  <p className="text-xs font-extrabold text-white">{match.j1}</p>
                  <div className="h-px bg-[#222631]"></div>
                  <p className="text-xs font-extrabold text-white">{match.j2}</p>
                </div>
              ))}
            </div>
          )}

          {vistaInterna === 'inscritos' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] text-center">
                <div>
                  <span className="text-[10px] font-bold text-[#8E98A8] uppercase block">Confirmados</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                    {inscritosCount} / {torneo.maxCupos}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8E98A8] uppercase block">Vacantes Libres</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-[#10B981]">
                    {cuposLibres} cupos
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-black uppercase tracking-wider text-[#8E98A8] block">
                Orden de Siembra por Ranking Oficial
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {inscritosOrdenados.map((p, idx) => (
                  <div key={idx} className="bg-[#0B0D11] border border-[#222631] px-3.5 py-2.5 rounded-xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                        idx < 4 ? 'bg-[#EAB308]/15 text-[#EAB308]' : 'text-[#8E98A8]'
                      }`}>
                        {idx < 4 ? `Siembra #${idx + 1}` : `#${idx + 1}`}
                      </span>
                      <div>
                        <p className="font-extrabold text-white">{p.nombre}</p>
                        <span className="text-[10px] text-[#8E98A8]">{p.club}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#10B981]">{p.pts} Pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini-editor de Resultado de Llave en Vivo */}
          {editingMatch && (
            <form onSubmit={handleGuardarResultadoLlave} className="bg-[#0B0D11] border border-[#10B981] p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase text-[#10B981]">
                  Actualizar Llave en Vivo
                </span>
                <button type="button" onClick={() => setEditingMatch(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMatchWinnerSide('j1')}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold truncate ${
                    matchWinnerSide === 'j1' ? 'bg-[#10B981]/20 border-[#10B981] text-white' : 'border-[#222631] text-zinc-400'
                  }`}
                >
                  🏆 {editingMatch.match.j1}
                </button>
                <button
                  type="button"
                  onClick={() => setMatchWinnerSide('j2')}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold truncate ${
                    matchWinnerSide === 'j2' ? 'bg-[#10B981]/20 border-[#10B981] text-white' : 'border-[#222631] text-zinc-400'
                  }`}
                >
                  🏆 {editingMatch.match.j2}
                </button>
              </div>
              <input
                type="text"
                required
                value={matchScoreInput}
                onChange={(e) => setMatchScoreInput(e.target.value)}
                placeholder="Marcador (ej. 6-4, 6-3)"
                className="w-full bg-[#14171F] border border-[#222631] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <button type="submit" className="w-full bg-[#10B981] text-zinc-950 font-black py-2.5 rounded-xl text-xs">
                Confirmar y Avanzar Ganador de Ronda
              </button>
            </form>
          )}
        </div>

        {/* Pie del Modal de Torneo */}
        <div className="p-4 border-t border-[#222631] bg-[#0B0D11] grid grid-cols-2 gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onInscribir(torneo)}
            className="bg-[#14171F] hover:bg-zinc-800 text-white font-extrabold py-3 rounded-2xl text-xs border border-[#222631]"
          >
            + Inscribirme en Lista
          </button>
          <a
            href={`https://wa.me/51964000000?text=${encodeURIComponent(`Hola MATCHPOINT, envío mi comprobante de S/ ${torneo.precio} para confirmar mi cupo en ${torneo.titulo}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="bg-[#10B981] hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" /> Confirmar Cupo (S/ {torneo.precio})
          </a>
        </div>
      </div>
    </div>
  );// ============================================================================
// PARTE 2 DE 3: COMPONENTE PRINCIPAL APP, ESTADOS, ACCESO DUAL Y LÓGICA EN VIVO
// ============================================================================
export default function App() {
  // Splash Screen Cinemático
  const [showSplash, setShowSplash] = useState(true);

  // Navegación Principal y Sub-pestañas Descentralizadas
  const [tab, setTab] = useState('perfil');
  const [rankingSubTab, setRankingSubTab] = useState('temporada'); // 'temporada' | 'salon_fama'
  const [retosSubTab, setRetosSubTab] = useState('mis_retos');
  const [canchasSubTab, setCanchasSubTab] = useState('clubes');
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('General');

  // Usuario, Ajustes de Cuenta (Tuerca ⚙️) y Modo Pruebas
  const [currentUser, setCurrentUser] = useState(null);
  const [sandboxLabel, setSandboxLabel] = useState(null);
  const [keepSession, setKeepSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hidePhonePublic, setHidePhonePublic] = useState(false);

  // Modales Globales y Descentralizados
  const [showSideDrawer, setShowSideDrawer] = useState(false); // Solo Institucional (Reglamento, Sedes, Comité)
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Tuerca ⚙️ en Mi Perfil
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showMemberPassModal, setShowMemberPassModal] = useState(false);
  const [showCoachProModal, setShowCoachProModal] = useState(false);
  const [selectedCoachModal, setSelectedCoachModal] = useState(null);
  const [pendingPopupAlert, setPendingPopupAlert] = useState(null);

  // Modal de Momentos Cruciales (Felicitación al ganador / Ánimo al perdedor / Calibración)
  const [crucialMomentAlert, setCrucialMomentAlert] = useState(null);

  // Patrocinadores Administrables (Visibilidad Comercial B2B)
  const [sponsorsData, setSponsorsData] = useState(() => {
    const saved = localStorage.getItem('mp_sponsors_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return PATROCINADORES_INICIALES;
  });

  // Portal Privado Coach Pro (Autogestión de Turnos Libres y Alumnos con PIN 7777)
  const [coachPinInput, setCoachPinInput] = useState('');
  const [isCoachProUnlocked, setIsCoachProUnlocked] = useState(false);
  const [coachAlumnos, setCoachAlumnos] = useState(() => {
    const saved = localStorage.getItem('mp_coach_alumnos_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [
      { id: 1, nombre: 'Marcelo Quintana', grupo: 'Adultos Iniciación · Mar/Jue 19:00', asistencias: '7/8 sesiones', nivel: '5ª P' },
      { id: 2, nombre: 'Ernesto Velarde', grupo: 'Adultos Iniciación · Mar/Jue 19:00', asistencias: '6/8 sesiones', nivel: '5ª P' },
      { id: 3, nombre: 'Claudia Soto', grupo: 'Damas Intermedio · Sáb 10:00', asistencias: '4/4 sesiones', nivel: '5ª B' }
    ];
  });
  const [newAlumnoNombre, setNewAlumnoNombre] = useState('');
  const [newAlumnoGrupo, setNewAlumnoGrupo] = useState('Adultos Iniciación · Mar/Jue 19:00');
  const [newTurnoDia, setNewTurnoDia] = useState('Viernes');
  const [newTurnoHora, setNewTurnoHora] = useState('04:00 PM');
  const [newTurnoClub, setNewTurnoClub] = useState('Country Club');

  // Autenticación Dual: Celular (WhatsApp 9 dígitos) o Correo Electrónico
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authMethod, setAuthMethod] = useState('celular'); // 'celular' | 'correo'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [quizStep, setQuizStep] = useState(0);

  const [authPhoneInput, setAuthPhoneInput] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Datos de Ficha Deportiva (+40 Senior, Damas, Mano Hábil, Horario)
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('36');
  const [genero, setGenero] = useState('Varones');
  const [mano, setMano] = useState('Diestro');
  const [horarioPref, setHorarioPref] = useState('Fines de Semana');
  const [club, setClub] = useState('Country Club Huancayo');
  const [telefono, setTelefono] = useState('');
  const [respuestasLikert, setRespuestasLikert] = useState([2, 2, 2, 2]);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const fileInputRef = useRef(null);
  const profileAvatarInputRef = useRef(null);
  const realtimeChannelRef = useRef(null);

  // Modales de Juego, Sede Personalizada, Clima y Torneos
  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);
  const [challengeTargetModal, setChallengeTargetModal] = useState(null);
  const [challengeSede, setChallengeSede] = useState('Country Club Huancayo');
  const [customSedeText, setCustomSedeText] = useState('');
  const [challengeFecha, setChallengeFecha] = useState('Sábado 16:00 hrs');
  const [activeChatReto, setActiveChatReto] = useState(null);
  const [chatMessageInput, setChatMessageInput] = useState('');

  // Modal de Estado de Canchas
  const [weatherModalClub, setWeatherModalClub] = useState(null);
  const [weatherEstadoInput, setWeatherEstadoInput] = useState('Cancha Seca · Óptima');
  const [weatherDetalleInput, setWeatherDetalleInput] = useState('19°C · Sin viento');

  // Torneos Dinámicos con Brackets en Vivo
  const [torneosData, setTorneosData] = useState(() => {
    const saved = localStorage.getItem('mp_torneos_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return TORNEOS_INICIALES;
  });
  const [selectedTorneoModal, setSelectedTorneoModal] = useState(null);

  // Suite de Administración y Disputas (PIN 1234)
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [newProfNombre, setNewProfNombre] = useState('');
  const [newProfEsp, setNewProfEsp] = useState('');
  const [newProfTarifa, setNewProfTarifa] = useState('50');
  const [newProfTel, setNewProfTel] = useState('');

  const [featureToggles, setFeatureToggles] = useState(() => {
    const saved = localStorage.getItem('mp_feature_toggles_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return {
      tiendaActiva: true,
      clubesActivos: {
        'Country Club Huancayo': true,
        'Club Tauro Tenis': true,
        'Academia Romina Cutipa': true,
        'Complejo Shyam Huilca': true
      }
    };
  });

  // Registro Oficial de Marcador
  const [activeRetoId, setActiveRetoId] = useState(null);
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [score, setScore] = useState('6-4, 6-3');
  const [winnerId, setWinnerId] = useState('');
  const [calculatingMatch, setCalculatingMatch] = useState(false);

  // Directorio de Profesores (Marketplace Coach Pro)
  const [profesores, setProfesores] = useState(() => {
    const saved = localStorage.getItem('mp_profesores_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return PROFESORES_INICIALES;
  });

  // Retos en Vivo (Sincronizados con Supabase retos_activos)
  const [retosProgramados, setRetosProgramados] = useState(() => {
    const saved = localStorage.getItem('mp_retos_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [
      { 
        id: 101, 
        retador_id: null,
        retado_id: null,
        jugador1: 'Mateo Samaniego', 
        jugador2: 'Alejandro Tovar', 
        sede: 'Country Club Huancayo', 
        fecha: 'Sábado 17:00 hrs', 
        cat: 'Partido Oficial', 
        estado: 'Programado',
        mensajes: [{ autor: 'Mateo', texto: '¡Listo para el sábado! Llevo tubo de pelotas.', hora: '14:20' }]
      }
    ];
  });

  // Historial de Partidos para Cara a Cara (H2H) y Exportación CSV
  const [historialPartidosCSV, setHistorialPartidosCSV] = useState(() => {
    const saved = localStorage.getItem('mp_historial_csv_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [
      { fecha: '2026-11-05', ganador: 'Carlos Mendoza', perdedor: 'Renato Vilchez', marcador: '6-4, 6-4', delta: '+42 Pts' },
      { fecha: '2026-11-07', ganador: 'Rodrigo Quispe', perdedor: 'Franco Huamán', marcador: '6-2, 6-3', delta: '+51 Pts' }
    ];
  });

  // Validaciones y Disputas para el Comité Deportivo
  const [validacionesPendientes, setValidacionesPendientes] = useState(() => {
    const saved = localStorage.getItem('mp_validaciones_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [];
  });

  const [historialCruces, setHistorialCruces] = useState(() => {
    const saved = localStorage.getItem('mp_cruces_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return {};
  });

  // Rachas Activas (Solo para jugadores con victorias reales)
  const [rachasUsuarios, setRachasUsuarios] = useState(() => {
    const saved = localStorage.getItem('mp_rachas_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return { 'Carlos Mendoza': 4, 'Rodrigo Quispe': 5, 'Gonzalo Palacios': 3 };
  });

  const [climaSedes, setClimaSedes] = useState(() => {
    const saved = localStorage.getItem('mp_clima_v6');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return {
      'Country Club Huancayo': { estado: 'Cancha Seca · Óptima', detalle: '20°C · Soleado', hora: '15:10', reportadoPor: 'Rodrigo Quispe' },
      'Club Tauro Tenis': { estado: 'Techado · 100% Jugable', detalle: '18°C · Cubierto', hora: '14:45', reportadoPor: 'Gonzalo Palacios' },
      'Academia Romina Cutipa': { estado: 'Cancha Seca · Óptima', detalle: '19°C · Nublado parcial', hora: '16:00', reportadoPor: 'Diego Cárdenas' },
      'Complejo Shyam Huilca': { estado: 'Humedad Leve · Jugable', detalle: '17°C · Viento ligero', hora: '15:30', reportadoPor: 'Mateo Samaniego' }
    };
  });

  // ============================================================================
  // INICIALIZACIÓN, DESBLOQUEO UNIVERSAL CON TECLA ESCAPE Y SUPABASE REALTIME
  // ============================================================================
  useEffect(() => {
    if (!document.getElementById('mp-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'mp-google-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    if (!document.getElementById('mp-animations-css')) {
      const style = document.createElement('style');
      style.id = 'mp-animations-css';
      style.innerHTML = `
        @keyframes mpFadeSlide {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .mp-page-transition {
          animation: mpFadeSlide 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        button, a {
          transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.18s ease, border-color 0.18s ease;
        }
        button:active, a:active {
          transform: scale(0.97);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `;
      document.head.appendChild(style);
    }

    // Listener Universal de Tecla Escape (Evita quedarse atrapado en Laptop / Desktop)
    const handleKeyDownEscape = (e) => {
      if (e.key === 'Escape') {
        setShowAuthModal(false);
        setShowProfileSetup(false);
        setSelectedPlayerModal(null);
        setChallengeTargetModal(null);
        setSelectedTorneoModal(null);
        setSelectedCoachModal(null);
        setShowMemberPassModal(false);
        setShowSettingsModal(false);
        setShowSideDrawer(false);
        setShowStoreModal(false);
        setShowLevelsModal(false);
        setShowRulesModal(false);
        setShowCoachProModal(false);
        setShowAdminModal(false);
        setShowMatchModal(false);
        setShowNotifModal(false);
        setWeatherModalClub(null);
        setActiveChatReto(null);
        setCrucialMomentAlert(null);
      }
    };
    window.addEventListener('keydown', handleKeyDownEscape);

    const timer = setTimeout(() => setShowSplash(false), 1250);

    fetchData();
    fetchRetosFromSupabase();

    const session = localStorage.getItem('tennis_user_session') || sessionStorage.getItem('tennis_user_session');
    if (session) {
      try { setCurrentUser(JSON.parse(session)); } catch { /* ignore */ }
    }

    const channel = supabase
      .channel('matchpoint_v6_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jugadores' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retos_activos' }, () => {
        fetchRetosFromSupabase();
      })
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        if (payload?.retos) {
          setRetosProgramados(payload.retos);
          localStorage.setItem('mp_retos_v6', JSON.stringify(payload.retos));
        }
        if (payload?.clima) {
          setClimaSedes(payload.clima);
          localStorage.setItem('mp_clima_v6', JSON.stringify(payload.clima));
        }
        if (payload?.validaciones) {
          setValidacionesPendientes(payload.validaciones);
          localStorage.setItem('mp_validaciones_v6', JSON.stringify(payload.validaciones));
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDownEscape);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTabChange = (newTab) => {
    setTab(newTab);
  };

  async function fetchRetosFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('retos_activos')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setRetosProgramados(data);
        localStorage.setItem('mp_retos_v6', JSON.stringify(data));
      }
    } catch { /* fallback local */ }
  }

  const broadcastLiveUpdate = (newRetos, newClima, newValidaciones) => {
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: {
          retos: newRetos || retosProgramados,
          clima: newClima || climaSedes,
          validaciones: newValidaciones || validacionesPendientes
        }
      });
    }
  };

  // Detector Exacto por ID Único o Nombre Normalizado
  const normalizeText = (str = '') => String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

  const isPlayerInReto = (reto, player) => {
    if (!player || !reto) return false;
    if (reto.retador_id && String(reto.retador_id) === String(player.id)) return true;
    if (reto.retado_id && String(reto.retado_id) === String(player.id)) return true;
    const pName = normalizeText(player.nombre);
    const j1 = normalizeText(reto.jugador1);
    const j2 = normalizeText(reto.jugador2);
    return j1 === pName || j2 === pName || j1.includes(pName) || j2.includes(pName);
  };

  const isPlayerChallengedRecipient = (reto, player) => {
    if (!player || !reto) return false;
    if (reto.retado_id && String(reto.retado_id) === String(player.id)) return true;
    const pName = normalizeText(player.nombre);
    const j2 = normalizeText(reto.jugador2);
    return j2 === pName || j2.includes(pName);
  };

  useEffect(() => {
    if (!currentUser) return;
    const retoNuevo = retosProgramados.find(
      r => isPlayerChallengedRecipient(r, currentUser) && r.estado === 'Pendiente de Aceptación'
    );
    const validacionMia = validacionesPendientes.find(
      v => (normalizeText(v.perdedorNombre) === normalizeText(currentUser.nombre) || String(v.perdedorId) === String(currentUser.id)) && v.estado === 'Pendiente'
    );

    if (retoNuevo) {
      setPendingPopupAlert({ tipo: 'reto', data: retoNuevo });
    } else if (validacionMia) {
      setPendingPopupAlert({ tipo: 'validacion', data: validacionMia });
    } else {
      setPendingPopupAlert(null);
    }
  }, [currentUser, retosProgramados, validacionesPendientes]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('elo', { ascending: false });
      if (error) throw error;
      setJugadores(data || []);
    } catch (err) {
      console.error('Error cargando ranking:', err);
    } finally {
      setLoading(false);
    }
  }

  // Métricas Calculadas del Jugador Activo
  const myPlayer = currentUser ? (jugadores.find(j => j.id === currentUser.id) || currentUser) : null;
  const myRankPos = myPlayer ? jugadores.findIndex(j => j.id === myPlayer.id) + 1 : 0;
  const myWins = myPlayer?.victorias || 0;
  const myLosses = myPlayer?.derrotas || 0;
  const myTotalMatches = myWins + myLosses;
  const isCalibrated = myTotalMatches >= 5;
  const myWinRate = myTotalMatches > 0 ? Math.round((myWins / myTotalMatches) * 100) : 0;
  const myCatInfo = getInfoCategoria(myPlayer?.elo || 1000);

  // Regla Estricta: Si victorias === 0, la racha es 0 y permanece invisible
  const getPlayerStreak = (playerObj) => {
    if (!playerObj) return 0;
    const wins = playerObj.victorias || 0;
    if (wins === 0) return 0;
    const savedStreak = rachasUsuarios[playerObj.nombre];
    if (typeof savedStreak === 'number') return savedStreak;
    return (playerObj.derrotas || 0) === 0 ? wins : 0;
  };

  const myStreak = getPlayerStreak(myPlayer);

  // Jugador Inmediatamente Superior ("Objetivo de Ascenso")
  const playerAboveMe = myRankPos > 1 ? jugadores[myRankPos - 2] : null;
  const ptsToOvertake = playerAboveMe && myPlayer ? Math.max(1, (playerAboveMe.elo || 1000) - (myPlayer.elo || 1000) + 1) : 0;

  const puntosEnCat = Math.max(0, (myPlayer?.elo || 1000) - myCatInfo.min);
  const totalRangoCat = myCatInfo.max - myCatInfo.min;
  const faltanParaSubir = Math.max(0, myCatInfo.max + 1 - (myPlayer?.elo || 1000));

  const misRetos = retosProgramados.filter(r => isPlayerInReto(r, myPlayer));
  const disputasActivas = validacionesPendientes.filter(v => v.estado === 'En Disputa');
  const misNotificacionesCount = misRetos.length + validacionesPendientes.filter(v => v.estado === 'Pendiente').length;

  // Halos Sobrios 60-30-10
  const getAvatarHaloClass = (playerObj, rankIndex) => {
    const racha = getPlayerStreak(playerObj);
    if (rankIndex === 0) return 'ring-2 ring-[#EAB308] shadow-[0_0_18px_rgba(234,179,8,0.35)]';
    if (rankIndex === 1) return 'ring-2 ring-zinc-300';
    if (rankIndex === 2) return 'ring-2 ring-[#D96B43]';
    if (racha >= 3) return 'ring-2 ring-[#D96B43]';
    return 'ring-1 ring-white/15';
  };

  // Historial Cara a Cara (Head-to-Head)
  const getHeadToHead = (targetPlayer) => {
    if (!myPlayer || !targetPlayer) return { myWinsH2H: 0, rivalWinsH2H: 0, totalH2H: 0 };
    const mName = normalizeText(myPlayer.nombre);
    const tName = normalizeText(targetPlayer.nombre);
    let myWinsH2H = 0, rivalWinsH2H = 0;
    historialPartidosCSV.forEach(h => {
      const g = normalizeText(h.ganador);
      const p = normalizeText(h.perdedor);
      if (g === mName && p === tName) myWinsH2H++;
      if (g === tName && p === mName) rivalWinsH2H++;
    });
    return { myWinsH2H, rivalWinsH2H, totalH2H: myWinsH2H + rivalWinsH2H };
  };

  // ============================================================================
  // GESTIÓN DE IMÁGENES, ACCESO DUAL (CELULAR / CORREO) Y FICHA DEL TENISTA
  // ============================================================================
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setFotoFile(compressed.file);
      setFotoPreview(compressed.preview);
    } catch {
      alert('No se pudo procesar la fotografía.');
    } finally {
      setIsCompressing(false);
    }
  }

  async function handleUpdateProfilePhoto(e) {
    const file = e.target.files?.[0];
    if (!file || !myPlayer) return;
    setUpdatingAvatar(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `avatar_${myPlayer.id}_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, compressed.file);
      if (upErr) throw upErr;
      const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newUrl = pubData.publicUrl;
      const { error: dbErr } = await supabase.from('jugadores').update({ foto_url: newUrl }).eq('id', myPlayer.id);
      if (dbErr) throw dbErr;
      const updated = { ...myPlayer, foto_url: newUrl };
      setCurrentUser(updated);
      localStorage.setItem('tennis_user_session', JSON.stringify(updated));
      await fetchData();
    } catch (err) {
      alert('Error actualizando foto: ' + err.message);
    } finally {
      setUpdatingAvatar(false);
    }
  }

  // AUTENTICACIÓN DUAL: PERMITE ENTRAR CON NÚMERO DE CELULAR O CON CORREO
  async function handleAuth(e) {
    e.preventDefault();
    const cleanPhone = authPhoneInput.replace(/\D/g, '').trim();
    const effectiveEmail = authMethod === 'celular' 
      ? `${cleanPhone}@matchpoint.pe` 
      : authEmail.trim().toLowerCase();

    if (authMethod === 'celular' && cleanPhone.length < 9) {
      return alert('Ingresa un número de celular válido de 9 dígitos.');
    }
    if (authMethod === 'correo' && !authEmail.trim()) {
      return alert('Ingresa tu correo electrónico.');
    }
    if (!authPassword.trim()) {
      return alert('Ingresa tu contraseña.');
    }

    try {
      setAuthLoading(true);
      if (authMode === 'signup') {
        // Verificar si ya existe por correo o por teléfono
        let query = supabase.from('jugadores').select('id, email, telefono');
        if (authMethod === 'celular') {
          query = query.or(`telefono.eq.${cleanPhone},email.eq.${effectiveEmail}`);
        } else {
          query = query.eq('email', effectiveEmail);
        }
        const { data: existing } = await query.maybeSingle();
        if (existing) {
          alert('Este número o correo ya tiene una cuenta registrada. Inicia sesión.');
          setAuthMode('login');
          return;
        }
        if (authMethod === 'celular') {
          setTelefono(cleanPhone);
        }
        setShowAuthModal(false);
        setQuizStep(0);
        setShowProfileSetup(true);
      } else {
        // Login por Celular o por Correo
        let data = null;
        if (authMethod === 'celular') {
          const resPhone = await supabase
            .from('jugadores')
            .select('*')
            .or(`telefono.eq.${cleanPhone},email.eq.${effectiveEmail}`)
            .eq('password', authPassword.trim())
            .maybeSingle();
          data = resPhone.data;
        } else {
          const resMail = await supabase
            .from('jugadores')
            .select('*')
            .eq('email', effectiveEmail)
            .eq('password', authPassword.trim())
            .maybeSingle();
          data = resMail.data;
        }

        if (!data) {
          return alert('Datos de acceso incorrectos. Verifica tu número/correo y contraseña.');
        }

        setCurrentUser(data);
        setSandboxLabel(null);
        if (keepSession) {
          localStorage.setItem('tennis_user_session', JSON.stringify(data));
        } else {
          sessionStorage.setItem('tennis_user_session', JSON.stringify(data));
        }
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPhoneInput('');
        setAuthPassword('');
        handleTabChange('perfil');
      }
    } catch (err) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCompleteProfile() {
    if (!nombre.trim()) return alert('Ingresa tu nombre y apellido.');
    const cleanPhone = (telefono || authPhoneInput).replace(/\D/g, '').trim();
    if (!cleanPhone) return alert('Ingresa tu número de WhatsApp para coordinar tus partidos.');

    const effectiveEmail = authMethod === 'celular' && !authEmail.trim()
      ? `${cleanPhone}@matchpoint.pe`
      : authEmail.trim().toLowerCase();

    const edadNum = parseInt(edad, 10) || 34;

    try {
      setSavingPlayer(true);
      let publicFotoUrl = null;
      if (fotoFile) {
        const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, fotoFile);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          publicFotoUrl = publicUrlData.publicUrl;
        }
      }

      const calib = calcularPuntos4Opciones(respuestasLikert);

      let { data, error } = await supabase.from('jugadores').insert([{
        email: effectiveEmail,
        password: authPassword.trim(),
        nombre: nombre.trim(),
        club: club.trim(),
        categoria: calib.cat,
        telefono: cleanPhone,
        foto_url: publicFotoUrl,
        elo: calib.elo,
        victorias: 0,
        derrotas: 0,
        edad: edadNum,
        genero,
        mano,
        horario: horarioPref
      }]).select();

      if (error) {
        const fallbackRes = await supabase.from('jugadores').insert([{
          email: effectiveEmail,
          password: authPassword.trim(),
          nombre: nombre.trim(),
          club: club.trim(),
          categoria: calib.cat,
          telefono: cleanPhone,
          foto_url: publicFotoUrl,
          elo: calib.elo,
          victorias: 0,
          derrotas: 0
        }]).select();
        if (fallbackRes.error) throw fallbackRes.error;
        data = fallbackRes.data;
      }

      if (data?.[0]) {
        const creado = { ...data[0], edad: edadNum, genero, mano, horario: horarioPref };
        setCurrentUser(creado);
        localStorage.setItem('tennis_user_session', JSON.stringify(creado));
      }
      setShowProfileSetup(false);
      setNombre('');
      setFotoFile(null);
      setFotoPreview(null);
      await fetchData();

      // Si empieza desde cero (5ª P), ofrecerle conexión directa con entrenadores oficiales
      if (calib.cat === '5ª P') {
        setCrucialMomentAlert({
          tipo: 'bienvenida_5p',
          titulo: '¡Bienvenido al Circuito Oficial!',
          subtitulo: 'Has sido ubicado en 5ª Principiante (5ª P)',
          mensaje: 'Tu categoría estará protegida durante tus primeros 5 partidos. Si deseas tomar clases o perfeccionar tu saque, visita la pestaña de Entrenadores Oficiales.'
        });
      }
      handleTabChange('perfil');
    } catch (err) {
      alert('Error registrando ficha: ' + err.message);
    } finally {
      setSavingPlayer(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('tennis_user_session');
    sessionStorage.removeItem('tennis_user_session');
    setCurrentUser(null);
    setSandboxLabel(null);
    setShowSettingsModal(false);
    setShowSideDrawer(false);
    handleTabChange('perfil');
  }

  function handleActivateSandboxUser(targetPlayer, label = 'Modo Pruebas') {
    if (!targetPlayer) return;
    setCurrentUser(targetPlayer);
    setSandboxLabel(label);
    localStorage.setItem('tennis_user_session', JSON.stringify(targetPlayer));
    setShowAdminModal(false);
    setShowSettingsModal(false);
  }

  async function handleSimulateIncomingChallenge() {
    const receptor = myPlayer || jugadores[0] || { id: 991, nombre: 'Mateo Samaniego', elo: 1340 };
    const retador = jugadores.find(j => j.id !== receptor.id) || { id: 992, nombre: 'Alejandro Tovar', elo: 1450 };
    const retoTest = {
      id: Date.now(),
      retador_id: retador.id,
      retado_id: receptor.id,
      jugador1: retador.nombre,
      jugador2: receptor.nombre,
      sede: 'Country Club Huancayo',
      fecha: 'Mañana 18:00 hrs',
      cat: 'Partido Oficial',
      estado: 'Pendiente de Aceptación',
      mensajes: [
        { autor: retador.nombre.split(' ')[0], texto: `¡Hola ${receptor.nombre.split(' ')[0]}! Te envié una invitación para jugar.`, hora: 'Ahora' }
      ]
    };

    try { await supabase.from('retos_activos').insert([retoTest]); } catch { /* fallback */ }
    const actualizados = [retoTest, ...retosProgramados];
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v6', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);
    setCurrentUser(receptor);
    setSandboxLabel(`Vista: ${receptor.nombre}`);
    setShowAdminModal(false);
    setPendingPopupAlert({ tipo: 'reto', data: retoTest });
  }

  function handleSimulateDisputeForAdmin() {
    const pA = jugadores[0]?.nombre || 'Carlos Mendoza';
    const pB = jugadores[1]?.nombre || 'Renato Vilchez';
    const disputaTest = {
      id: Date.now(),
      ganadorId: jugadores[0]?.id || 1,
      perdedorId: jugadores[1]?.id || 2,
      ganadorNombre: pA,
      perdedorNombre: pB,
      score: '6-4, 7-6',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'En Disputa'
    };
    const nuevas = [disputaTest, ...validacionesPendientes];
    setValidacionesPendientes(nuevas);
    localStorage.setItem('mp_validaciones_v6', JSON.stringify(nuevas));
    broadcastLiveUpdate(null, null, nuevas);
  }

  // ============================================================================
  // RETOS OFICIALES, MARCADORES CON MOMENTOS CRUCIALES Y AVANCE DE TORNEOS
  // ============================================================================
  async function handleConfirmarNuevoReto(e) {
    e.preventDefault();
    if (!challengeTargetModal) return;
    if (challengeSede === 'OTRA_SEDE' && !customSedeText.trim()) {
      return alert('Escribe el nombre o dirección de la cancha donde jugarán.');
    }

    const sedeFinal = challengeSede === 'OTRA_SEDE' ? customSedeText.trim() : challengeSede;
    const retadorNombre = myPlayer ? myPlayer.nombre : 'Jugador Local';

    const nuevoReto = {
      id: Date.now(),
      retador_id: myPlayer?.id || null,
      retado_id: challengeTargetModal.id || null,
      jugador1: retadorNombre,
      jugador2: challengeTargetModal.nombre,
      sede: sedeFinal,
      fecha: challengeFecha,
      cat: 'Partido Oficial',
      estado: 'Pendiente de Aceptación',
      mensajes: [
        { autor: retadorNombre.split(' ')[0], texto: `Hola ${challengeTargetModal.nombre.split(' ')[0]}, te propongo jugar en ${sedeFinal} el ${challengeFecha}.`, hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    };

    try { await supabase.from('retos_activos').insert([nuevoReto]); } catch { /* fallback */ }

    const actualizados = [nuevoReto, ...retosProgramados];
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v6', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);

    const rivalTel = challengeTargetModal.telefono || '';
    const rivalNombre = challengeTargetModal.nombre;
    setChallengeTargetModal(null);
    setCustomSedeText('');
    handleTabChange('match');
    setRetosSubTab('mis_retos');

    if (rivalTel && window.confirm(`Desafío registrado contra ${rivalNombre}.\n\n¿Deseas enviarle el aviso directo por WhatsApp?`)) {
      const msg = `🎾 *MATCHPOINT OFICIAL*: Hola ${rivalNombre.split(' ')[0]}, te he lanzado un desafío oficial en *${sedeFinal}* (${challengeFecha}). Entra a la app para confirmar el partido: https://huancayo-tenis.vercel.app`;
      window.open(`https://wa.me/51${rivalTel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }

  async function handleAceptarRetoEntrante(retoId) {
    try { await supabase.from('retos_activos').update({ estado: 'Programado' }).eq('id', retoId); } catch { /* ignore */ }
    const actualizados = retosProgramados.map(r => r.id === retoId ? { ...r, estado: 'Programado' } : r);
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v6', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);
    setPendingPopupAlert(null);
    handleTabChange('match');
    setRetosSubTab('mis_retos');
  }

  async function handleEnviarMensajeInterno(e) {
    e.preventDefault();
    if (!chatMessageInput.trim() || !activeChatReto) return;
    const autor = myPlayer ? myPlayer.nombre.split(' ')[0] : 'Tenista';
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nuevoMsg = { autor, texto: chatMessageInput.trim(), hora: horaActual };
    const nuevosMensajes = [...(activeChatReto.mensajes || []), nuevoMsg];

    try { await supabase.from('retos_activos').update({ mensajes: nuevosMensajes }).eq('id', activeChatReto.id); } catch { /* ignore */ }

    const actualizados = retosProgramados.map(r => r.id === activeChatReto.id ? { ...r, mensajes: nuevosMensajes } : r);
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v6', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);
    setActiveChatReto(actualizados.find(r => r.id === activeChatReto.id));
    setChatMessageInput('');
  }

  // PROCESAR MARCADOR OFICIAL + DISPARAR MENSAJE EMOTIVO CRUCIAL
  async function handleProcesarPartido(e) {
    e.preventDefault();
    if (!p1Id || !p2Id || !winnerId) return alert('Selecciona al ganador del encuentro.');
    if (p1Id === p2Id) return alert('Los competidores deben ser distintos.');

    const player1 = jugadores.find(j => j.id.toString() === p1Id);
    const player2 = jugadores.find(j => j.id.toString() === p2Id);
    if (!player1 || !player2) return;

    const pairKey = [player1.id, player2.id].sort().join('_');
    const enfrentamientosPrevios = historialCruces[pairKey] || 0;
    if (enfrentamientosPrevios >= 2) {
      return alert(
        'Reglamento del Circuito:\n\n' +
        `${player1.nombre} y ${player2.nombre} ya disputaron ${enfrentamientosPrevios} partidos oficiales esta semana.`
      );
    }

    try {
      setCalculatingMatch(true);
      const R1 = player1.elo ?? 1000;
      const R2 = player2.elo ?? 1000;

      const juegos1 = (player1.victorias || 0) + (player1.derrotas || 0);
      const juegos2 = (player2.victorias || 0) + (player2.derrotas || 0);

      const K1 = juegos1 < 5 ? 180 : 60;
      const K2 = juegos2 < 5 ? 180 : 60;

      const E1 = 1 / (1 + Math.pow(10, (R2 - R1) / 1200));
      const E2 = 1 / (1 + Math.pow(10, (R1 - R2) / 1200));

      const S1 = winnerId === p1Id ? 1 : 0;
      const S2 = winnerId === p2Id ? 1 : 0;

      const { fd, label: fdLabel } = calcularFactorDominio(score);
      const bonoAsistencia = 10;

      const ganadorObj = S1 === 1 ? player1 : player2;
      const perdedorObj = S1 === 1 ? player2 : player1;
      const nuevaRachaGanador = getPlayerStreak(ganadorObj) + 1;
      const bonoRacha1 = S1 === 1 && nuevaRachaGanador >= 3 ? 15 : 0;
      const bonoRacha2 = S2 === 1 && nuevaRachaGanador >= 3 ? 15 : 0;

      const nuevasRachas = {
        ...rachasUsuarios,
        [ganadorObj.nombre]: nuevaRachaGanador,
        [perdedorObj.nombre]: 0
      };
      setRachasUsuarios(nuevasRachas);
      localStorage.setItem('mp_rachas_v6', JSON.stringify(nuevasRachas));

      const delta1 = Math.round(K1 * (S1 - E1) * fd + bonoAsistencia + bonoRacha1);
      const delta2 = Math.round(K2 * (S2 - E2) * fd + bonoAsistencia + bonoRacha2);

      let newElo1 = Math.max(100, R1 + delta1);
      let newElo2 = Math.max(100, R2 + delta2);
      if (R1 <= 3800 && newElo1 > 3800 && R2 < 3400) newElo1 = 3800;
      if (R2 <= 3800 && newElo2 > 3800 && R1 < 3400) newElo2 = 3800;

      const newCat1 = getInfoCategoria(newElo1).id;
      const newCat2 = getInfoCategoria(newElo2).id;

      await supabase.from('jugadores').update({
        elo: newElo1,
        categoria: newCat1,
        victorias: (player1.victorias || 0) + S1,
        derrotas: (player1.derrotas || 0) + (1 - S1)
      }).eq('id', player1.id);

      await supabase.from('jugadores').update({
        elo: newElo2,
        categoria: newCat2,
        victorias: (player2.victorias || 0) + S2,
        derrotas: (player2.derrotas || 0) + (1 - S2)
      }).eq('id', player2.id);

      const nuevoCruces = { ...historialCruces, [pairKey]: enfrentamientosPrevios + 1 };
      setHistorialCruces(nuevoCruces);
      localStorage.setItem('mp_cruces_v6', JSON.stringify(nuevoCruces));

      const deltaGanador = S1 === 1 ? delta1 : delta2;
      const deltaPerdedor = S1 === 1 ? delta2 : delta1;

      const lineaHistorica = {
        fecha: new Date().toISOString().split('T')[0],
        ganador: ganadorObj.nombre,
        perdedor: perdedorObj.nombre,
        marcador: score,
        delta: `+${deltaGanador} Pts`
      };
      const nuevoHistCSV = [lineaHistorica, ...historialPartidosCSV];
      setHistorialPartidosCSV(nuevoHistCSV);
      localStorage.setItem('mp_historial_csv_v6', JSON.stringify(nuevoHistCSV));

      const registroAuditoria = {
        id: Date.now(),
        ganadorId: ganadorObj.id,
        perdedorId: perdedorObj.id,
        ganadorNombre: ganadorObj.nombre,
        perdedorNombre: perdedorObj.nombre,
        score,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estado: 'Pendiente'
      };
      const nuevasVal = [registroAuditoria, ...validacionesPendientes];
      setValidacionesPendientes(nuevasVal);
      localStorage.setItem('mp_validaciones_v6', JSON.stringify(nuevasVal));

      let restantes = retosProgramados;
      if (activeRetoId) {
        try { await supabase.from('retos_activos').delete().eq('id', activeRetoId); } catch { /* ignore */ }
        restantes = retosProgramados.filter(r => r.id !== activeRetoId);
        setRetosProgramados(restantes);
        localStorage.setItem('mp_retos_v6', JSON.stringify(restantes));
        setActiveRetoId(null);
      }

      broadcastLiveUpdate(restantes, null, nuevasVal);
      setShowMatchModal(false);
      await fetchData();

      // DISPARADOR DE MOMENTO CRUCIAL PERSONALIZADO (GANADOR VS PERDEDOR)
      const soyElPerdedor = myPlayer && String(myPlayer.id) === String(perdedorObj.id);
      const fraseVictoria = FRASES_MOMENTOS_CRUCIALES.victoria[Math.floor(Math.random() * FRASES_MOMENTOS_CRUCIALES.victoria.length)];
      const fraseDerrota = FRASES_MOMENTOS_CRUCIALES.derrota[Math.floor(Math.random() * FRASES_MOMENTOS_CRUCIALES.derrota.length)];

      setCrucialMomentAlert({
        tipo: soyElPerdedor ? 'derrota' : 'victoria',
        titulo: soyElPerdedor ? 'Partido Oficial Completado' : `¡Victoria Oficial Registrada! (${fdLabel})`,
        subtitulo: `${ganadorObj.nombre} venció a ${perdedorObj.nombre} por ${score}`,
        detallePuntos: `${ganadorObj.nombre}: +${deltaGanador} Pts  ·  ${perdedorObj.nombre}: ${deltaPerdedor >= 0 ? '+' : ''}${deltaPerdedor} Pts`,
        mensaje: soyElPerdedor ? fraseDerrota : fraseVictoria
      });
    } catch (err) {
      alert('Error al registrar el marcador: ' + err.message);
    } finally {
      setCalculatingMatch(false);
    }
  }

  // MOTOR DINÁMICO DE AVANCE EN CUADROS DE TORNEOS (QF -> SEMIS -> FINAL + CONSUELO)
  function handleUpdateBracketMatch(torneoId, fase, matchIndex, nuevoScore, ganadorNombre, perdedorNombre) {
    const actualizados = torneosData.map((t) => {
      if (t.id !== torneoId) return t;
      const copiaBrackets = JSON.parse(JSON.stringify(t.brackets));

      if (copiaBrackets[fase] && copiaBrackets[fase][matchIndex]) {
        copiaBrackets[fase][matchIndex].score = nuevoScore;
        copiaBrackets[fase][matchIndex].ganador = ganadorNombre;
        copiaBrackets[fase][matchIndex].perdedor = perdedorNombre;
      }

      // Si es Cuartos de Final: el ganador avanza a Semifinales y el perdedor va a Ronda Consuelo
      if (fase === 'cuartos') {
        const semiIndex = Math.floor(matchIndex / 2);
        const side = matchIndex % 2 === 0 ? 'j1' : 'j2';
        if (copiaBrackets.semis?.[semiIndex]) {
          copiaBrackets.semis[semiIndex][side] = ganadorNombre;
          if (copiaBrackets.semis[semiIndex].score === 'Por Definir') {
            copiaBrackets.semis[semiIndex].score = 'Programado';
          }
        }
        if (copiaBrackets.consueloSemis?.[semiIndex]) {
          copiaBrackets.consueloSemis[semiIndex][side] = perdedorNombre;
          if (copiaBrackets.consueloSemis[semiIndex].score === 'Por Definir') {
            copiaBrackets.consueloSemis[semiIndex].score = 'Programado';
          }
        }
      }

      // Si es Semifinales: el ganador avanza a la Gran Final
      if (fase === 'semis') {
        const side = matchIndex === 0 ? 'j1' : 'j2';
        if (copiaBrackets.final?.[0]) {
          copiaBrackets.final[0][side] = ganadorNombre;
        }
      }

      return { ...t, brackets: copiaBrackets };
    });

    setTorneosData(actualizados);
    localStorage.setItem('mp_torneos_v6', JSON.stringify(actualizados));
    setSelectedTorneoModal(actualizados.find(t => t.id === torneoId));
  }

  function handleToggleTorneoStage(torneoId) {
    const actualizados = torneosData.map(t => {
      if (t.id !== torneoId) return t;
      return {
        ...t,
        estadoTorneo: t.estadoTorneo === 'inscripciones' ? 'en_juego' : 'inscripciones'
      };
    });
    setTorneosData(actualizados);
    localStorage.setItem('mp_torneos_v6', JSON.stringify(actualizados));
    setSelectedTorneoModal(actualizados.find(t => t.id === torneoId));
  }

  function handleExportAndPurgeHistory() {
    const headers = ['Fecha,Ganador,Perdedor,Marcador,Variacion_Puntos'];
    const rows = historialPartidosCSV.map(
      h => `${h.fecha},"${h.ganador}","${h.perdedor}","${h.marcador}","${h.delta}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MATCHPOINT_Partidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleAdminResolveDispute(disputa, accion) {
    if (accion === 'aprobar') {
      const nuevas = validacionesPendientes.map(v => v.id === disputa.id ? { ...v, estado: 'Confirmado por Comité' } : v);
      setValidacionesPendientes(nuevas);
      localStorage.setItem('mp_validaciones_v6', JSON.stringify(nuevas));
      broadcastLiveUpdate(null, null, nuevas);
    } else if (accion === 'editar') {
      const nuevoScore = window.prompt('Ingresa el marcador corregido por el Comité:', disputa.score);
      if (!nuevoScore) return;
      const nuevas = validacionesPendientes.map(v => v.id === disputa.id ? { ...v, score: nuevoScore, estado: 'Corregido por Comité' } : v);
      setValidacionesPendientes(nuevas);
      localStorage.setItem('mp_validaciones_v6', JSON.stringify(nuevas));
      broadcastLiveUpdate(null, null, nuevas);
    } else if (accion === 'anular') {
      const nuevas = validacionesPendientes.filter(v => v.id !== disputa.id);
      setValidacionesPendientes(nuevas);
      localStorage.setItem('mp_validaciones_v6', JSON.stringify(nuevas));
      broadcastLiveUpdate(null, null, nuevas);
    }
  }

  function handleGuardarClimaModal(e) {
    e.preventDefault();
    if (!weatherModalClub) return;
    const autor = myPlayer ? myPlayer.nombre : 'Socio Oficial';
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nuevoMapa = {
      ...climaSedes,
      [weatherModalClub]: {
        estado: weatherEstadoInput,
        detalle: weatherDetalleInput,
        hora: horaActual,
        reportadoPor: autor
      }
    };
    setClimaSedes(nuevoMapa);
    localStorage.setItem('mp_clima_v6', JSON.stringify(nuevoMapa));
    broadcastLiveUpdate(null, nuevoMapa, null);
    setWeatherModalClub(null);
  }

  function handleInscribirEnTorneo(torneo) {
    const inscritoNombre = myPlayer ? myPlayer.nombre : 'Tenista Invitado';
    const inscritoClub = myPlayer ? (myPlayer.club || 'Independiente') : 'Independiente';
    const inscritoPts = myPlayer ? (myPlayer.elo || 1200) : 1200;

    const yaInscrito = torneo.participantes.some(p => normalizeText(p.nombre) === normalizeText(inscritoNombre));
    if (!yaInscrito) {
      const actualizados = torneosData.map(t => {
        if (t.id === torneo.id) {
          return {
            ...t,
            participantes: [...t.participantes, { nombre: inscritoNombre, club: inscritoClub, pts: inscritoPts }]
          };
        }
        return t;
      });
      setTorneosData(actualizados);
      localStorage.setItem('mp_torneos_v6', JSON.stringify(actualizados));
      setSelectedTorneoModal(actualizados.find(t => t.id === torneo.id));
    }
  }

  async function handleAdminDeletePlayer(player) {
    if (!window.confirm(`¿Eliminar la ficha de "${player.nombre}"?`)) return;
    try {
      const { error } = await supabase.from('jugadores').delete().eq('id', player.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  function handleAdminAddProfesor(e) {
    e.preventDefault();
    if (!newProfNombre.trim() || !newProfTel.trim()) return;
    const nuevo = {
      id: `prof-${Date.now()}`,
      nombre: newProfNombre.trim(),
      certificacion: 'Coach Pro Verificado',
      rating: '5.0',
      resenasCount: 12,
      horasImpartidas: '+150h',
      tarifaBase: parseInt(newProfTarifa, 10) || 50,
      sede: 'Sede Oficial Asociada',
      tel: newProfTel.trim(),
      activo: true,
      nichos: [newProfEsp.trim() || 'Técnica & Táctica', 'Todos los niveles'],
      bioCorta: newProfEsp.trim() || 'Entrenamiento personalizado y formación competitiva en cancha.',
      fotoAvatar: null,
      fotoBanner: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80',
      programas: [
        { id: 'prog-1', titulo: 'Clase Individual 1 a 1', detalle: '60 min · Corrección técnica personalizada', precio: `S/ ${parseInt(newProfTarifa, 10) || 50}` }
      ],
      turnosLibres: [
        { id: 't-new-1', dia: 'Sábado', hora: '10:00 AM', club: 'Country Club', disponible: true }
      ],
      resenas: []
    };
    const lista = [nuevo, ...profesores];
    setProfesores(lista);
    localStorage.setItem('mp_profesores_v6', JSON.stringify(lista));
    setNewProfNombre('');
    setNewProfEsp('');
    setNewProfTel('');
  }

  function handleAddCoachFreeSlot(e) {
    e.preventDefault();
    if (!profesores.length) return;
    const nuevoSlot = {
      id: `slot-${Date.now()}`,
      dia: newTurnoDia,
      hora: newTurnoHora,
      club: newTurnoClub,
      disponible: true
    };
    const actualizados = profesores.map((p, idx) => {
      if (idx === 0) {
        return { ...p, turnosLibres: [nuevoSlot, ...(p.turnosLibres || [])] };
      }
      return p;
    });
    setProfesores(actualizados);
    localStorage.setItem('mp_profesores_v6', JSON.stringify(actualizados));
  }

  function toggleClubVisibility(clubNombre) {
    const updated = {
      ...featureToggles,
      clubesActivos: {
        ...featureToggles.clubesActivos,
        [clubNombre]: !featureToggles.clubesActivos[clubNombre]
      }
    };
    setFeatureToggles(updated);
    localStorage.setItem('mp_feature_toggles_v6', JSON.stringify(updated));
  }

  function toggleProfesorVisibility(profId) {
    const updated = profesores.map(p => p.id === profId ? { ...p, activo: p.activo === false ? true : false } : p);
    setProfesores(updated);
    localStorage.setItem('mp_profesores_v6', JSON.stringify(updated));
  }

  const sedesVisibles = SEDES_CLUB_PRO.filter(c => featureToggles.clubesActivos?.[c.nombre] !== false);
  const profesoresVisibles = profesores.filter(p => p.activo !== false);

  const clubStats = sedesVisibles.map(c => {
    const socios = jugadores.filter(j => j.club === c.nombre);
    const totalPuntos = socios.reduce((sum, j) => sum + (j.elo || 1000), 0);
    return { ...c, sociosCount: socios.length, totalPuntos };
  }).sort((a, b) => b.totalPuntos - a.totalPuntos);

  const jugadoresFiltrados = jugadores.filter(j => {
    if (filtroCat === 'General') return true;
    if (filtroCat === 'Damas') return j.genero === 'Damas' || ['romina', 'claudia', 'maria', 'lucia', 'ana', 'sofia'].some(n => normalizeText(j.nombre).includes(n));
    if (filtroCat === '+40 Senior') return (j.edad && Number(j.edad) >= 40) || (!j.edad && (j.elo || 1000) >= 1350);
    return getInfoCategoria(j.elo || 1000).id === filtroCat;
  });// ============================================================================
// PARTE 3 DE 3: VISTAS 60-30-10, MODALES DESBLOQUEADOS Y BARRA INFERIOR 76PX
// ============================================================================

  // PANTALLA DE CARGA INICIAL SOBRIA
  if (showSplash) {
    return (
      <div 
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        className="min-h-screen bg-[#0B0D11] text-white flex flex-col items-center justify-center p-6 max-w-md mx-auto select-none relative overflow-hidden"
      >
        <div className="mb-6">
          <SvgTennisBall className="w-24 h-24" />
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-3xl font-black tracking-tight text-white">
          MATCHPOINT
        </h1>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#D96B43] font-extrabold mt-1.5">
          Circuito Oficial de Tenis
        </p>
        <div className="w-40 h-1 bg-[#14171F] rounded-full overflow-hidden mt-7 border border-[#222631]">
          <div className="h-full bg-[#10B981] rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-[#0B0D11] text-white flex flex-col max-w-md mx-auto shadow-2xl pb-32 border-x border-[#222631] relative"
    >
      {/* BARRA SUPERIOR DE PRUEBAS (SOLO CUANDO EL MODO SANDBOX ESTÁ ACTIVO) */}
      {sandboxLabel && (
        <div className="bg-[#14171F] border-b border-[#EAB308]/40 text-white px-3.5 py-2 text-xs font-bold flex items-center justify-between sticky top-0 z-50">
          <span className="text-[#EAB308] truncate">🧪 {sandboxLabel} ({myPlayer?.nombre})</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const otro = jugadores.find(j => j.id !== myPlayer?.id) || jugadores[0];
                if (otro) handleActivateSandboxUser(otro, `Vista: ${otro.nombre.split(' ')[0]}`);
              }}
              className="bg-[#0B0D11] border border-[#222631] text-zinc-200 px-2.5 py-1 rounded-lg text-[11px] font-extrabold"
            >
              ⇄ Cambiar Jugador
            </button>
            <button
              onClick={() => setSandboxLabel(null)}
              className="text-zinc-400 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
          HEADER INSTITUCIONAL LIMPIO (SIN MARQUESINA DE TEXTO)
      ======================================================================== */}
      <header className="pt-11 pb-3.5 px-4 bg-[#0B0D11]/95 backdrop-blur-md border-b border-[#222631] grid grid-cols-3 items-center sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSideDrawer(true)}
            className="w-10 h-10 bg-[#14171F] hover:border-zinc-700 border border-[#222631] rounded-xl flex items-center justify-center text-zinc-200"
            title="Información del Circuito"
          >
            <Menu className="w-5 h-5" />
          </button>
          {featureToggles.tiendaActiva && (
            <button
              onClick={() => setShowStoreModal(true)}
              className="w-10 h-10 bg-[#14171F] hover:border-zinc-700 border border-[#222631] rounded-xl flex items-center justify-center text-[#D96B43]"
              title="Pro-Shop & Encordado"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-center">
          <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black tracking-tight text-white leading-none">
            MATCHPOINT
          </h1>
          <span className="text-[9px] tracking-[0.22em] uppercase font-bold text-[#8E98A8] block mt-1">
            Huancayo · Oficial
          </span>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowNotifModal(true)}
            className="relative w-10 h-10 bg-[#14171F] hover:border-zinc-700 border border-[#222631] rounded-xl flex items-center justify-center text-zinc-200"
            title="Avisos"
          >
            <Bell className="w-4 h-4" />
            {misNotificacionesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D96B43] text-white text-[10px] font-black flex items-center justify-center">
                {misNotificacionesCount}
              </span>
            )}
          </button>

          {myPlayer ? (
            <button 
              onClick={() => handleTabChange('perfil')}
              className="bg-[#14171F] border border-[#222631] px-3 py-2 rounded-xl text-xs font-extrabold text-white truncate max-w-[82px]"
            >
              {myPlayer.nombre.split(' ')[0]}
            </button>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="bg-[#10B981] hover:bg-emerald-400 text-zinc-950 px-3.5 py-2 rounded-xl text-xs font-black"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      <main key={tab} className="p-4 flex-1 space-y-4 mp-page-transition">

        {/* ======================================================================
            1. PESTAÑA: MI PERFIL (ARQUITECTURA SOBRIA 60-30-10 + TUERCA ⚙️ + CARNET VIP)
        ====================================================================== */}
        {tab === 'perfil' && (
          <div className="space-y-4">
            {myPlayer ? (
              <div className="bg-[#14171F] border border-[#222631] rounded-3xl overflow-hidden shadow-2xl">
                {/* Cabecera Arquitectónica con Trama de Pista en Bajo Relieve (Sin degradado tricolor) */}
                <div className="relative h-28 bg-[#0B0D11] border-b border-[#222631] p-4 flex justify-between items-start overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <SvgCourtLinesBg className="w-full h-full opacity-[0.05]" />
                  </div>

                  {/* Estado de Calibración o Puesto Oficial */}
                  <span className="relative z-10 text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-[#14171F] border border-[#222631] text-zinc-200">
                    {!isCalibrated ? `Calibración (${myTotalMatches}/5)` : `Ranking Oficial · #${myRankPos}`}
                  </span>

                  {/* Acciones de Cabecera: Carnet VIP + Tuerca de Ajustes ⚙️ */}
                  <div className="relative z-10 flex items-center gap-2">
                    <button
                      onClick={() => setShowMemberPassModal(true)}
                      className="bg-[#14171F] hover:border-zinc-600 border border-[#222631] text-white px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#EAB308]" /> Carnet VIP
                    </button>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="w-8 h-8 rounded-xl bg-[#14171F] hover:border-zinc-600 border border-[#222631] flex items-center justify-center text-zinc-300 hover:text-white"
                      title="Ajustes de Cuenta"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bloque Central de Identidad del Jugador */}
                <div className="px-6 pb-6 text-center -mt-14 relative z-10">
                  <div className="relative w-28 h-28 mx-auto mb-3">
                    <div 
                      onClick={() => profileAvatarInputRef.current?.click()}
                      className={`w-28 h-28 rounded-full bg-[#0B0D11] p-1 cursor-pointer overflow-hidden flex items-center justify-center transition ${getAvatarHaloClass(myPlayer, myRankPos - 1)}`}
                    >
                      {updatingAvatar ? (
                        <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
                      ) : myPlayer.foto_url ? (
                        <img src={myPlayer.foto_url} alt={myPlayer.nombre} className="w-full h-full rounded-full object-cover object-center" />
                      ) : (
                        <User className="w-12 h-12 text-zinc-500" />
                      )}
                    </div>
                    <button
                      onClick={() => profileAvatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-[#14171F] text-white p-2 rounded-full shadow-lg border border-[#222631] hover:border-zinc-500"
                      title="Actualizar fotografía"
                    >
                      <Camera className="w-4 h-4 text-[#10B981]" />
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={profileAvatarInputRef}
                      onChange={handleUpdateProfilePhoto} 
                      className="hidden" 
                    />
                  </div>

                  {/* Insignia de Campeón Vigente si es #1 y tiene >= 5 partidos */}
                  {myRankPos === 1 && isCalibrated && (
                    <div className="mb-1.5 inline-flex items-center gap-1.5 bg-[#EAB308]/15 border border-[#EAB308]/40 text-[#EAB308] px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <Crown className="w-3.5 h-3.5" /> Campeón Vigente del Circuito
                    </div>
                  )}

                  <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white tracking-tight">
                    {myPlayer.nombre}
                  </h2>
                  <p className="text-xs text-[#8E98A8] font-semibold mt-0.5">
                    {myPlayer.club || 'Socio Independiente'} · {myPlayer.mano || 'Diestro'}
                    {myPlayer.edad && Number(myPlayer.edad) >= 40 ? ' · Senior +40' : ''}
                  </p>

                  {/* Píldora Sobria de Categoría o Estado Oculto */}
                  <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                    {!isCalibrated ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#0B0D11] text-[#8E98A8] border border-[#222631]">
                        <Lock className="w-3 h-3 text-[#EAB308]" /> Categoría protegida hasta cumplir 5 partidos
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-extrabold bg-[#0B0D11] text-white border border-[#222631]">
                        <SvgTrophy className="w-4 h-4" /> {myCatInfo.nombre}
                      </span>
                    )}

                    {/* Racha solo visible cuando victorias >= 1 */}
                    {myStreak >= 1 && (
                      <span className="inline-flex items-center gap-1 bg-[#0B0D11] border border-[#222631] px-3 py-1 rounded-full text-xs font-extrabold text-white">
                        <SvgFlame className="w-4 h-4" /> {myStreak} en racha
                      </span>
                    )}
                  </div>

                  {/* Métricas Principales en Superficie Homogénea Carbón Mate */}
                  <div className="grid grid-cols-3 gap-2.5 mt-5">
                    <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] flex flex-col items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E98A8]">Puntos</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white mt-0.5">
                        {myPlayer.elo || 1000}
                      </span>
                    </div>

                    <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] flex flex-col items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E98A8]">Puesto</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-[#10B981] mt-0.5">
                        {myRankPos > 0 ? `#${myRankPos}` : '—'}
                      </span>
                    </div>

                    <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] flex flex-col items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E98A8]">Efectividad</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white mt-0.5">
                        {myTotalMatches > 0 ? `${myWinRate}%` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Récord de Partidos: Estado Neutro si tiene 0 partidos (Sin barra verde/roja falsa) */}
                  {myTotalMatches === 0 ? (
                    <div className="mt-3 bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] text-center space-y-1">
                      <p className="text-xs font-bold text-white">
                        Temporada Inaugural · Sin partidos registrados
                      </p>
                      <p className="text-[11px] text-[#8E98A8]">
                        Completa tus primeros 5 desafíos oficiales para desbloquear tu historial y categoría.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] text-left space-y-2">
                      <div className="flex justify-between items-center text-xs font-extrabold">
                        <span className="text-[#10B981]">{myWins} Ganados</span>
                        <span className="text-[#8E98A8]">{myTotalMatches} Jugados</span>
                        <span className="text-zinc-400">{myLosses} Perdidos</span>
                      </div>
                      <div className="w-full h-2 bg-[#14171F] rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-[#10B981] transition-all"
                          style={{ width: `${myWinRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Barra de Progreso al Siguiente Nivel */}
                  {isCalibrated && (
                    <div className="mt-3 bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] text-left">
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-[#8E98A8]">Progreso de Categoría</span>
                        <span className="text-white">A {faltanParaSubir} Pts del ascenso</span>
                      </div>
                      <div className="w-full h-2 bg-[#14171F] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#10B981] rounded-full"
                          style={{ width: `${Math.min(100, Math.max(8, Math.round((puntosEnCat / totalRangoCat) * 100)))}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Botones de Acción Principal */}
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button 
                      onClick={() => { handleTabChange('match'); setRetosSubTab('nuevo'); }}
                      className="bg-[#10B981] hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Swords className="w-4 h-4" /> Lanzar Reto
                    </button>
                    <button 
                      onClick={() => setShowMemberPassModal(true)}
                      className="bg-[#0B0D11] hover:border-zinc-600 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-[#222631]"
                    >
                      <QrCode className="w-4 h-4 text-[#EAB308]" /> Ver Carnet VIP
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Vista de Invitado (No bloqueante) */
              <div className="bg-[#14171F] border border-[#222631] rounded-3xl overflow-hidden shadow-2xl">
                <div className="relative h-44 w-full bg-[#0B0D11]">
                  <img 
                    src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80" 
                    alt="Circuito Matchpoint" 
                    className="w-full h-full object-cover opacity-65"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14171F] via-[#14171F]/40 to-transparent"></div>
                  <div className="absolute bottom-3 left-5 right-5 flex items-center gap-3.5">
                    <SvgTennisBall className="w-12 h-12 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#D96B43] block">
                        Circuito Oficial · Huancayo
                      </span>
                      <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                        Compite en tu Categoría
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-center">
                  <p className="text-xs text-[#8E98A8] leading-relaxed">
                    Ingresa con tu número de WhatsApp o correo para registrar tus partidos, obtener tu Carnet VIP y competir en las divisiones General, Damas y Senior +40.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                      className="bg-[#10B981] hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs shadow-lg"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                      className="bg-[#0B0D11] hover:border-zinc-600 text-white font-extrabold py-3.5 rounded-2xl text-xs border border-[#222631]"
                    >
                      Crear Cuenta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            2. PESTAÑA: RANKING (CON SALÓN DE LA FAMA INTEGRADO Y CERO LINKS SUBRAYADOS)
        ====================================================================== */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="bg-[#14171F] border border-[#222631] rounded-3xl overflow-hidden shadow-2xl">
              {/* Conmutador Superior: Temporada Actual vs Salón de la Fama */}
              <div className="p-3 bg-[#0B0D11] border-b border-[#222631] flex items-center justify-between gap-2">
                <div className="grid grid-cols-2 gap-1.5 bg-[#14171F] p-1 rounded-2xl border border-[#222631] flex-1">
                  <button
                    onClick={() => setRankingSubTab('temporada')}
                    className={`py-2 rounded-xl text-xs font-extrabold transition ${
                      rankingSubTab === 'temporada' ? 'bg-[#10B981] text-zinc-950 shadow' : 'text-[#8E98A8]'
                    }`}
                  >
                    Clasificación Actual
                  </button>
                  <button
                    onClick={() => setRankingSubTab('salon_fama')}
                    className={`py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1 ${
                      rankingSubTab === 'salon_fama' ? 'bg-[#EAB308] text-zinc-950 shadow' : 'text-[#8E98A8]'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" /> Salón de la Fama
                  </button>
                </div>

                <button
                  onClick={() => setShowLevelsModal(true)}
                  className="bg-[#14171F] hover:border-zinc-600 text-[11px] font-extrabold text-zinc-200 px-3 py-2.5 rounded-xl border border-[#222631] shrink-0"
                >
                  Niveles
                </button>
              </div>

              {rankingSubTab === 'temporada' && (
                <>
                  {/* WIDGET DE COMPETICIÓN "OBJETIVO DE ASCENSO" (SIN LINKS SUBRAYADOS) */}
                  {playerAboveMe && (
                    <div className="bg-[#0B0D11]/60 px-4 py-3 border-b border-[#222631] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E98A8] block">
                          Objetivo Inmediato · Puesto #{myRankPos - 1}
                        </span>
                        <p className="text-xs font-bold text-white truncate mt-0.5">
                          {playerAboveMe.nombre} <span className="text-[#10B981] font-extrabold">· A {ptsToOvertake} Pts</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setChallengeTargetModal(playerAboveMe)}
                        className="bg-[#14171F] hover:border-[#10B981] border border-[#222631] text-white text-[11px] font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm"
                      >
                        <Swords className="w-3.5 h-3.5 text-[#10B981]" /> Retar
                      </button>
                    </div>
                  )}

                  {/* Filtros de División */}
                  <div className="p-3.5">
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                      {['General', 'Damas', '+40 Senior', '3ª', '4ª', '5ª A', '5ª B', '5ª P', 'Clubes'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setFiltroCat(cat)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 border transition ${
                            filtroCat === cat 
                              ? 'bg-[#10B981] text-zinc-950 border-[#10B981]' 
                              : 'bg-[#0B0D11] text-[#8E98A8] border-[#222631]'
                          }`}
                        >
                          {cat === 'General' ? 'General' : cat === 'Damas' ? 'Damas' : cat === '+40 Senior' ? '+40 Senior' : cat === 'Clubes' ? 'Clubes' : `Cat. ${cat}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {rankingSubTab === 'salon_fama' ? (
              /* Vista Integrada del Salón de la Fama y Regla de Mérito */
              <div className="space-y-3">
                <div className="bg-[#14171F] border border-[#222631] p-4 rounded-3xl space-y-1.5">
                  <div className="flex items-center gap-2 text-[#EAB308] text-xs font-black uppercase tracking-wider">
                    <Crown className="w-4 h-4" /> Regla Oficial de Coronación y Premios
                  </div>
                  <p className="text-xs text-[#8E98A8] leading-relaxed">
                    Para proclamarse <strong className="text-white">Campeón Vigente</strong> y adjudicarse el trofeo físico al cierre de temporada, el jugador debe liderar su división habiendo disputado un <strong className="text-white">mínimo reglamentario de 5 partidos oficiales</strong>.
                  </p>
                </div>

                {SALON_DE_LA_FAMA_HISTORICO.map((item, idx) => (
                  <div key={idx} className="bg-[#14171F] border border-[#222631] p-4 rounded-3xl space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#8E98A8] block">
                      {item.temporada} · Cuadro de Honor
                    </span>
                    <div className="space-y-2">
                      {item.campeones.map((c, cIdx) => (
                        <div key={cIdx} className="bg-[#0B0D11] border border-[#222631] px-4 py-3 rounded-2xl flex justify-between items-center text-xs">
                          <div className="flex items-center gap-3">
                            <SvgMedal rank={1} className="w-7 h-7 shrink-0" />
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-[#EAB308] block">{c.division}</span>
                              <p className="font-black text-white text-sm">{c.nombre}</p>
                              <span className="text-[11px] text-[#8E98A8]">{c.club}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#10B981]">{c.record}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filtroCat === 'Clubes' ? (
              <div className="space-y-2.5">
                {clubStats.map((c, i) => (
                  <div key={i} className="bg-[#14171F] border border-[#222631] p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3.5">
                      {i < 3 ? <SvgMedal rank={i + 1} className="w-8 h-8 shrink-0" /> : (
                        <div className="w-8 h-8 rounded-xl bg-[#0B0D11] border border-[#222631] flex items-center justify-center font-black text-xs text-[#8E98A8]">
                          #{i + 1}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-black text-white">{c.nombre}</h4>
                        <p className="text-xs text-[#8E98A8]">{c.sociosCount} tenistas activos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-[#10B981]">
                        {c.totalPuntos}
                      </span>
                      <span className="text-[10px] text-[#8E98A8] block uppercase font-bold">Puntos</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-12 text-[#8E98A8] text-xs font-bold">Actualizando clasificación oficial...</div>
                ) : jugadoresFiltrados.length === 0 ? (
                  <div className="bg-[#14171F] border border-[#222631] p-6 rounded-3xl text-center text-xs text-[#8E98A8]">
                    Aún no hay tenistas registrados en la división <strong className="text-white">{filtroCat}</strong>.
                  </div>
                ) : (
                  jugadoresFiltrados.map((j, idx) => {
                    const catInfo = getInfoCategoria(j.elo || 1000);
                    const totalJ = (j.victorias || 0) + (j.derrotas || 0);
                    const rachaJ = getPlayerStreak(j);

                    return (
                      <div 
                        key={j.id || idx}
                        onClick={() => setSelectedPlayerModal(j)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition bg-[#14171F] hover:border-zinc-700 ${
                          idx === 0 ? 'border-[#EAB308]/50' : 'border-[#222631]'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-7 flex justify-center shrink-0">
                            {idx < 3 ? (
                              <SvgMedal rank={idx + 1} className="w-7 h-7" />
                            ) : (
                              <span style={{ fontFamily: "'Outfit', sans-serif" }} className="font-black text-sm text-[#8E98A8]">
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          <div className={`w-12 h-12 rounded-full bg-[#0B0D11] overflow-hidden flex items-center justify-center shrink-0 ${getAvatarHaloClass(j, idx)}`}>
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover object-center" />
                            ) : (
                              <User className="w-6 h-6 text-zinc-500" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-extrabold text-white truncate">{j.nombre}</p>
                              {idx === 0 && totalJ >= 5 && (
                                <span className="text-[9px] font-black uppercase bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30 px-2 py-0.5 rounded-md">
                                  Campeón
                                </span>
                              )}
                              {rachaJ >= 3 && (
                                <span className="text-[10px] font-black bg-[#0B0D11] text-white border border-[#222631] px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                  <SvgFlame className="w-3 h-3" /> {rachaJ}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#8E98A8] truncate mt-0.5">
                              {j.club || 'Independiente'} ·{' '}
                              {totalJ < 5 ? (
                                <span className="text-zinc-300 font-semibold">Calibrando ({totalJ}/5)</span>
                              ) : (
                                <span className="text-white font-bold">Cat. {catInfo.id}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-2">
                          <div className="text-right">
                            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-base font-black text-white">
                              {j.elo || 1000}
                            </span>
                            <p className="text-[10px] text-[#8E98A8] font-bold">
                              {j.victorias || 0}G · {j.derrotas || 0}P
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            3. PESTAÑA CENTRAL: RETOS (DETECCIÓN POR ID Y SEDE PERSONALIZADA)
        ====================================================================== */}
        {tab === 'match' && (
          <div className="space-y-4">
            <div className="bg-[#14171F] border border-[#222631] p-5 rounded-3xl shadow-xl text-center space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D96B43] block">
                Competición Oficial
              </span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                Central de Desafíos
              </h2>

              <div className="grid grid-cols-3 gap-1.5 bg-[#0B0D11] p-1.5 rounded-2xl border border-[#222631]">
                <button
                  onClick={() => setRetosSubTab('mis_retos')}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition ${
                    retosSubTab === 'mis_retos' ? 'bg-[#10B981] text-zinc-950 shadow' : 'text-[#8E98A8]'
                  }`}
                >
                  Tus Retos ({misRetos.length})
                </button>
                <button
                  onClick={() => setRetosSubTab('cartelera')}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition ${
                    retosSubTab === 'cartelera' ? 'bg-[#10B981] text-zinc-950 shadow' : 'text-[#8E98A8]'
                  }`}
                >
                  Cartelera ({retosProgramados.length})
                </button>
                <button
                  onClick={() => setRetosSubTab('nuevo')}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition ${
                    retosSubTab === 'nuevo' ? 'bg-[#10B981] text-zinc-950 shadow' : 'text-[#8E98A8]'
                  }`}
                >
                  + Lanzar Reto
                </button>
              </div>
            </div>

            {retosSubTab === 'mis_retos' && (
              <div className="space-y-3">
                {misRetos.length === 0 ? (
                  <div className="bg-[#14171F] border border-[#222631] p-7 rounded-3xl text-center space-y-3">
                    <Swords className="w-10 h-10 text-[#10B981] mx-auto" />
                    <h4 className="text-base font-black text-white">Sin partidos pendientes hoy</h4>
                    <p className="text-xs text-[#8E98A8] leading-relaxed">
                      Elige a un rival dentro de tu rango competitivo para acordar sede, fecha y disputar puntos oficiales.
                    </p>
                    <button
                      onClick={() => setRetosSubTab('nuevo')}
                      className="bg-[#10B981] text-zinc-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg"
                    >
                      Explorar Rivales Disponibles
                    </button>
                  </div>
                ) : (
                  misRetos.map(r => {
                    const soyElRetador = myPlayer && (String(r.retador_id) === String(myPlayer.id) || normalizeText(r.jugador1).includes(normalizeText(myPlayer.nombre)));
                    const otroNombre = soyElRetador ? r.jugador2 : r.jugador1;
                    const rivalObj = jugadores.find(j => normalizeText(j.nombre).includes(normalizeText(otroNombre.split(' ')[0])));
                    const rivalTel = rivalObj?.telefono || '964123456';

                    return (
                      <div key={r.id} className="bg-[#14171F] border border-[#222631] p-5 rounded-3xl space-y-3.5 shadow-xl">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase bg-[#0B0D11] text-zinc-200 border border-[#222631] px-3 py-1 rounded-lg">
                            {r.cat}
                          </span>
                          <span className={`text-xs font-extrabold flex items-center gap-1 ${
                            r.estado === 'Programado' ? 'text-[#10B981]' : 'text-[#EAB308]'
                          }`}>
                            <Clock className="w-3.5 h-3.5" /> {r.estado}
                          </span>
                        </div>

                        <div>
                          <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white">
                            {r.jugador1} <span className="text-[#D96B43] px-1">vs</span> {r.jugador2}
                          </p>
                          <p className="text-xs text-[#8E98A8] font-medium mt-1">
                            📍 {r.sede} · 📅 {r.fecha}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setActiveChatReto(r)}
                            className="bg-[#0B0D11] hover:border-zinc-600 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#222631]"
                          >
                            <MessageSquare className="w-4 h-4 text-[#10B981]" /> Mensajes ({(r.mensajes || []).length})
                          </button>

                          <a
                            href={`https://wa.me/51${rivalTel.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${otroNombre.split(' ')[0]}, coordinemos nuestro partido oficial de MATCHPOINT en ${r.sede} (${r.fecha}).`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#0B0D11] hover:border-zinc-600 text-[#10B981] font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#222631]"
                          >
                            <Phone className="w-4 h-4" /> WhatsApp
                          </a>
                        </div>

                        {r.estado === 'Pendiente de Aceptación' ? (
                          <button
                            onClick={() => handleAceptarRetoEntrante(r.id)}
                            className="w-full bg-[#EAB308] hover:bg-amber-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <Check className="w-4 h-4" /> Confirmar y Aceptar Partido
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const p1 = jugadores.find(j => String(j.id) === String(r.retador_id) || normalizeText(j.nombre).includes(normalizeText(r.jugador1.split(' ')[0]))) || jugadores[0];
                              const p2 = jugadores.find(j => String(j.id) === String(r.retado_id) || normalizeText(j.nombre).includes(normalizeText(r.jugador2.split(' ')[0]))) || jugadores[1];
                              if (p1) setP1Id(p1.id.toString());
                              if (p2) setP2Id(p2.id.toString());
                              setActiveRetoId(r.id);
                              setShowMatchModal(true);
                            }}
                            className="w-full bg-[#10B981] hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Registrar Marcador Oficial
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {retosSubTab === 'cartelera' && (
              <div className="space-y-2.5">
                {retosProgramados.map(r => (
                  <div key={r.id} className="bg-[#14171F] border border-[#222631] p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#8E98A8] uppercase bg-[#0B0D11] border border-[#222631] px-2.5 py-0.5 rounded-md">
                        {r.cat}
                      </span>
                      <span className="text-xs text-[#10B981] font-bold">● {r.estado}</span>
                    </div>
                    <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-base font-black text-white">
                      {r.jugador1} <span className="text-[#D96B43] px-1">vs</span> {r.jugador2}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-[#222631] text-xs text-[#8E98A8]">
                      <span>📍 {r.sede}</span>
                      <span>📅 {r.fecha}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {retosSubTab === 'nuevo' && (
              <div className="space-y-2.5">
                <div className="bg-[#14171F] border border-[#222631] p-3.5 rounded-2xl text-xs text-[#8E98A8]">
                  <strong className="text-white">Rango Competitivo (±1,200 Puntos):</strong> Selecciona a un rival habilitado para proponer cancha y turno.
                </div>

                {jugadores
                  .filter(j => !myPlayer || j.id !== myPlayer.id)
                  .map((j) => {
                    const diff = myPlayer ? Math.abs((myPlayer.elo || 1000) - (j.elo || 1000)) : 0;
                    const dentroVentana = diff <= 1200;
                    const totalJ = (j.victorias || 0) + (j.derrotas || 0);
                    const catJ = getInfoCategoria(j.elo || 1000);

                    return (
                      <div key={j.id} className={`p-3.5 rounded-2xl border flex items-center justify-between bg-[#14171F] ${
                        dentroVentana ? 'border-[#222631]' : 'border-[#222631]/50 opacity-45'
                      }`}>
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-[#0B0D11] overflow-hidden flex items-center justify-center border border-[#222631] shrink-0">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover object-center" />
                            ) : (
                              <User className="w-5 h-5 text-zinc-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-white truncate">{j.nombre}</p>
                            <p className="text-xs text-[#8E98A8]">
                              {totalJ < 5 ? 'Calibrando' : `Cat. ${catJ.id}`} · <span className="text-white font-bold">{j.elo || 1000} Pts</span>
                            </p>
                          </div>
                        </div>

                        {dentroVentana ? (
                          <button
                            onClick={() => setChallengeTargetModal(j)}
                            className="bg-[#10B981] hover:bg-emerald-400 text-zinc-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0"
                          >
                            <Swords className="w-3.5 h-3.5" /> Retar
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-[#8E98A8] bg-[#0B0D11] px-3 py-1.5 rounded-xl border border-[#222631]">
                            Fuera de rango
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            4. PESTAÑA: DIRECTORIO (CLUBES ALIADOS + MARKETPLACE DE ENTRENADORES)
        ====================================================================== */}
        {tab === 'clubs' && (
          <div className="space-y-4">
            <div className="bg-[#14171F] p-5 rounded-3xl border border-[#222631] text-center space-y-3 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D96B43] block">
                Ecosistema Oficial
              </span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                Sedes & Entrenadores
              </h2>

              <div className="grid grid-cols-2 gap-2 bg-[#0B0D11] p-1.5 rounded-2xl border border-[#222631]">
                <button
                  onClick={() => setCanchasSubTab('clubes')}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition ${
                    canchasSubTab === 'clubes' ? 'bg-[#10B981] text-zinc-950 shadow' : 'text-[#8E98A8]'
                  }`}
                >
                  Canchas & Clubes ({sedesVisibles.length})
                </button>
                <button
                  onClick={() => setCanchasSubTab('profesores')}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition ${
                    canchasSubTab === 'profesores' ? 'bg-[#10B981] text-zinc-950 shadow' : 'text-[#8E98A8]'
                  }`}
                >
                  Coach Pro ({profesoresVisibles.length})
                </button>
              </div>
            </div>

            {canchasSubTab === 'clubes' ? (
              <div className="space-y-4">
                {sedesVisibles.map((c, idx) => {
                  const infoClima = climaSedes[c.nombre] || { estado: 'Cancha Seca · Óptima', detalle: '19°C · Soleado', hora: 'Hoy', reportadoPor: 'Comité' };
                  const isRain = infoClima.estado.includes('Lluvia') || infoClima.estado.includes('Pesada');

                  return (
                    <div key={idx} className="bg-[#14171F] rounded-3xl border border-[#222631] overflow-hidden shadow-2xl">
                      <div className="relative h-40 w-full bg-[#0B0D11]">
                        <img src={c.img} alt={c.nombre} className="w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#14171F] via-black/30 to-transparent"></div>
                        <span className="absolute top-3 left-3 bg-[#0B0D11]/90 text-white border border-white/15 text-[10px] font-black uppercase px-3 py-1 rounded-lg">
                          {c.sponsorBadge}
                        </span>
                        <div className="absolute bottom-3 left-4 right-4">
                          <h4 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                            {c.nombre}
                          </h4>
                          <span className="text-xs text-[#8E98A8] font-semibold">{c.zona} · {c.canchas}</span>
                        </div>
                      </div>

                      <div className="p-5 space-y-3.5">
                        {/* Cintillo de Marca Patrocinadora en Sede */}
                        <div className="flex items-center justify-between text-[11px] bg-[#0B0D11] border border-[#222631] px-3 py-2 rounded-xl">
                          <span className="text-[#8E98A8]">{c.pelotaSponsor || sponsorsData.pelotaOficial}</span>
                          <span className="text-[#D96B43] font-extrabold uppercase text-[9px] tracking-wider">Partner</span>
                        </div>

                        <div className="bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl text-xs">
                          <span className="font-extrabold text-[#10B981] block uppercase text-[10px] tracking-wider">
                            Beneficio con Carnet VIP Matchpoint
                          </span>
                          <p className="text-zinc-200 mt-1">{c.beneficioMatchpoint}</p>
                        </div>

                        <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] flex justify-between items-center">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8E98A8] block">
                              Reporte de Superficie · {infoClima.hora}
                            </span>
                            <p className="text-xs font-black text-white mt-0.5 flex items-center gap-1.5">
                              {isRain ? <CloudRain className="w-4 h-4 text-[#D96B43]" /> : <Sun className="w-4 h-4 text-[#EAB308]" />}
                              {infoClima.estado}
                            </p>
                            <span className="text-[11px] text-[#8E98A8] block mt-0.5">
                              {infoClima.detalle} · Por {infoClima.reportadoPor}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setWeatherModalClub(c.nombre);
                              setWeatherEstadoInput(infoClima.estado);
                              setWeatherDetalleInput(infoClima.detalle || '19°C · Sin viento');
                            }}
                            className="bg-[#14171F] hover:border-zinc-600 text-xs font-extrabold text-white px-3 py-2 rounded-xl border border-[#222631] shrink-0"
                          >
                            Reportar
                          </button>
                        </div>

                        <a
                          href={`https://wa.me/51${c.tel}?text=Hola,%20soy%20socio%20de%20MATCHPOINT%20y%20deseo%20consultar%20disponibilidad%20de%20cancha%20en%20${encodeURIComponent(c.nombre)}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-[#10B981] hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Phone className="w-4 h-4" /> Reservar Cancha por WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MARKETPLACE VISUAL DE ENTRENADORES (CERO MURO DE TEXTO) */
              <div className="space-y-4">
                {profesoresVisibles.map((prof) => {
                  const turnosCount = (prof.turnosLibres || []).filter(t => t.disponible !== false).length;
                  return (
                    <div 
                      key={prof.id} 
                      onClick={() => setSelectedCoachModal(prof)}
                      className="bg-[#14171F] border border-[#222631] hover:border-zinc-700 rounded-3xl overflow-hidden shadow-2xl cursor-pointer transition"
                    >
                      {/* Cabecera Visual 16:9 */}
                      <div className="relative h-32 w-full bg-[#0B0D11]">
                        <img src={prof.fotoBanner || prof.fotoAvatar} alt={prof.nombre} className="w-full h-full object-cover opacity-55" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#14171F] via-[#14171F]/40 to-transparent"></div>
                        <span className="absolute top-3 left-3 bg-[#0B0D11]/90 text-[#EAB308] border border-[#EAB308]/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                          {prof.certificacion || 'Coach Pro'}
                        </span>
                        <span className="absolute top-3 right-3 bg-[#0B0D11]/90 text-[#10B981] border border-[#222631] text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                          {turnosCount} turnos libres
                        </span>
                      </div>

                      <div className="px-5 pb-5 -mt-8 relative z-10 space-y-3.5">
                        <div className="flex items-end justify-between gap-3">
                          <div className="flex items-end gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-[#0B0D11] border-2 border-[#EAB308] overflow-hidden shrink-0 shadow-lg flex items-center justify-center">
                              {prof.fotoAvatar ? (
                                <img src={prof.fotoAvatar} alt={prof.nombre} className="w-full h-full object-cover object-center" />
                              ) : (
                                <GraduationCap className="w-8 h-8 text-[#EAB308]" />
                              )}
                            </div>
                            <div>
                              <h4 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white leading-tight">
                                {prof.nombre}
                              </h4>
                              <p className="text-[11px] text-[#8E98A8] font-medium">{prof.sede}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-[#8E98A8] uppercase font-bold block">Desde</span>
                            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-base font-black text-[#10B981]">
                              S/ {prof.tarifaBase || 45}/h
                            </span>
                          </div>
                        </div>

                        {/* Píldoras Limpias de Especialidad */}
                        <div className="flex flex-wrap gap-1.5">
                          {(prof.nichos || []).map((n, i) => (
                            <span key={i} className="text-[11px] font-bold bg-[#0B0D11] text-zinc-200 border border-[#222631] px-2.5 py-1 rounded-lg">
                              {n}
                            </span>
                          ))}
                        </div>

                        {/* Fila de Métricas + Botón de Apertura de Ficha Completa */}
                        <div className="pt-2 border-t border-[#222631] flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-extrabold text-white flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-[#EAB308] fill-[#EAB308]" /> {prof.rating || '4.9'}
                            </span>
                            <span className="text-[#8E98A8] text-[11px]">{prof.horasImpartidas || '+300h'} en cancha</span>
                          </div>
                          <span className="text-xs font-extrabold text-[#10B981] flex items-center gap-1">
                            Ver Horarios & Packs <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Acceso Contextual Discreto para Entrenadores (Descentralizado del menú principal) */}
                <div className="bg-[#14171F] border border-[#222631] p-4 rounded-3xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8E98A8] block">
                      Suite para Entrenadores
                    </span>
                    <p className="text-xs font-bold text-white mt-0.5">
                      ¿Eres profesor afiliado? Actualiza tus horas libres
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCoachProModal(true)}
                    className="bg-[#0B0D11] hover:border-zinc-600 border border-[#222631] text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shrink-0"
                  >
                    Coach Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            5. PESTAÑA: TORNEOS DINÁMICOS (CUADROS EN VIVO, SIEMBRA Y CONSUELO)
        ====================================================================== */}
        {tab === 'torneos' && (
          <div className="space-y-4">
            <div className="bg-[#14171F] p-5 rounded-3xl border border-[#222631] text-center space-y-1 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D96B43] block">
                Presentado por {sponsorsData.torneoPrincipal}
              </span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                Torneos & Cuadros en Vivo
              </h2>
              <p className="text-xs text-[#8E98A8]">
                Consulta las llaves de eliminación directa, ronda consuelo y cabezas de serie.
              </p>
            </div>

            {torneosData.map((t) => {
              const inscritosCount = t.participantes.length;
              const enJuego = t.estadoTorneo === 'en_juego';
              const cuposLibres = Math.max(0, t.maxCupos - inscritosCount);
              const porcentajeCupo = Math.min(100, Math.round((inscritosCount / t.maxCupos) * 100));

              return (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTorneoModal(t)}
                  className="bg-[#14171F] rounded-3xl border border-[#222631] hover:border-zinc-700 overflow-hidden shadow-2xl cursor-pointer transition"
                >
                  <div className="relative h-36 w-full bg-[#0B0D11]">
                    <img src={t.img} alt={t.titulo} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14171F] via-[#14171F]/40 to-transparent"></div>
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                      <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-lg border ${
                        enJuego 
                          ? 'text-[#10B981] bg-[#0B0D11]/90 border-[#10B981]/40' 
                          : 'text-[#EAB308] bg-[#0B0D11]/90 border-[#EAB308]/40'
                      }`}>
                        {enJuego ? '● Cuadro en Juego (Ver Llaves)' : `Inscripciones Abiertas (${cuposLibres} libres)`}
                      </span>
                      <span className="bg-[#0B0D11]/90 text-white font-black text-xs px-3 py-1 rounded-lg border border-[#222631]">
                        Cat. {t.cat}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-4 right-4 flex items-center gap-2.5">
                      <SvgTrophy className="w-7 h-7 shrink-0" />
                      <div>
                        <h4 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white leading-tight">
                          {t.titulo}
                        </h4>
                        <p className="text-[11px] text-[#8E98A8] font-medium">
                          Sponsor: {t.sponsor || sponsorsData.torneoPrincipal}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3.5">
                    <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631]">
                      <div className="flex justify-between text-xs font-extrabold mb-1.5">
                        <span className="text-white flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#10B981]" /> {inscritosCount} de {t.maxCupos} tenistas
                        </span>
                        <span className="text-[#8E98A8]">{t.fecha}</span>
                      </div>
                      <div className="w-full h-2 bg-[#14171F] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#10B981]"
                          style={{ width: `${porcentajeCupo}%` }}
                        ></div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="w-full bg-[#0B0D11] hover:border-zinc-600 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 border border-[#222631]"
                    >
                      {enJuego ? '🏆 Abrir Cuadro Eliminatorio y Resultados' : '👥 Ver Cabezas de Serie e Inscribirme'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================
          RENDERIZADO DE LOS 3 COMPONENTES ÉLITE (DEFINIDOS EN EL BLOQUE 1)
      ======================================================================== */}
      {showMemberPassModal && (
        <CarnetDigitalVIP
          player={myPlayer}
          catInfo={myCatInfo}
          rankPos={myRankPos}
          onClose={() => setShowMemberPassModal(false)}
        />
      )}

      {selectedCoachModal && (
        <CoachProProfileModal
          prof={selectedCoachModal}
          onClose={() => setSelectedCoachModal(null)}
        />
      )}

      {selectedTorneoModal && (
        <TorneoDinamicoModal
          torneo={selectedTorneoModal}
          myPlayer={myPlayer}
          onClose={() => setSelectedTorneoModal(null)}
          onInscribir={handleInscribirEnTorneo}
          onUpdateBracketMatch={handleUpdateBracketMatch}
          onToggleStage={handleToggleTorneoStage}
        />
      )}

      {/* ========================================================================
          MODAL: FICHA DE JUGADOR DESDE EL RANKING (SOBRIA 60-30-10 + H2H REAL)
      ======================================================================== */}
      {selectedPlayerModal && (() => {
        const pRankIdx = jugadores.findIndex(j => j.id === selectedPlayerModal.id);
        const pWins = selectedPlayerModal.victorias || 0;
        const pLosses = selectedPlayerModal.derrotas || 0;
        const pTotal = pWins + pLosses;
        const pCalibrated = pTotal >= 5;
        const pWinRate = pTotal > 0 ? Math.round((pWins / pTotal) * 100) : 0;
        const pCatInfo = getInfoCategoria(selectedPlayerModal.elo || 1000);
        const pStreak = getPlayerStreak(selectedPlayerModal);
        const { myWinsH2H, rivalWinsH2H, totalH2H } = getHeadToHead(selectedPlayerModal);

        return (
          <div 
            onClick={() => setSelectedPlayerModal(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14171F] border border-[#222631] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative max-h-[92vh] overflow-y-auto animate-[mpFadeSlide_0.2s_ease-out]"
            >
              <div className="relative h-24 bg-[#0B0D11] border-b border-[#222631] p-4 flex justify-between items-start overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <SvgCourtLinesBg className="w-full h-full opacity-[0.05]" />
                </div>
                <span className="relative z-10 text-[11px] font-extrabold px-3 py-1 rounded-xl bg-[#14171F] border border-[#222631] text-zinc-200">
                  {!pCalibrated ? `Calibrando (${pTotal}/5)` : `Puesto Oficial #${pRankIdx + 1}`}
                </span>
                <button
                  onClick={() => setSelectedPlayerModal(null)}
                  className="relative z-10 w-8 h-8 rounded-full bg-[#14171F] border border-[#222631] flex items-center justify-center text-zinc-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 pb-6 text-center -mt-12 relative z-10">
                <div className={`w-24 h-24 mx-auto rounded-full bg-[#0B0D11] p-1 mb-3 overflow-hidden flex items-center justify-center ${getAvatarHaloClass(selectedPlayerModal, pRankIdx)}`}>
                  {selectedPlayerModal.foto_url ? (
                    <img src={selectedPlayerModal.foto_url} alt={selectedPlayerModal.nombre} className="w-full h-full rounded-full object-cover object-center" />
                  ) : (
                    <User className="w-12 h-12 text-zinc-500" />
                  )}
                </div>

                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                  {selectedPlayerModal.nombre}
                </h3>
                <p className="text-xs text-[#8E98A8] font-semibold mt-0.5">
                  {selectedPlayerModal.club || 'Independiente'} · {selectedPlayerModal.mano || 'Diestro'}
                </p>

                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#0B0D11] text-white border border-[#222631]">
                    {!pCalibrated ? 'Nivel en Calibración' : pCatInfo.nombre}
                  </span>
                  {pStreak >= 1 && (
                    <span className="inline-flex items-center gap-1 bg-[#0B0D11] border border-[#222631] px-3 py-1 rounded-full text-xs font-extrabold text-white">
                      <SvgFlame className="w-3.5 h-3.5" /> {pStreak}
                    </span>
                  )}
                </div>

                {/* Historial Cara a Cara (Sin mostrar 0 - 0 cuando no han jugado) */}
                {myPlayer && myPlayer.id !== selectedPlayerModal.id && (
                  <div className="mt-4 bg-[#0B0D11] border border-[#222631] px-4 py-2.5 rounded-2xl flex justify-between items-center text-xs">
                    {totalH2H === 0 ? (
                      <span className="w-full text-center text-[#8E98A8] font-bold">
                        Primer enfrentamiento directo en el circuito
                      </span>
                    ) : (
                      <>
                        <span className="font-black text-[#10B981]">TÚ: {myWinsH2H}</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E98A8]">Frente a Frente</span>
                        <span className="font-black text-white">{selectedPlayerModal.nombre.split(' ')[0].toUpperCase()}: {rivalWinsH2H}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-[#8E98A8]">Puntos Oficiales</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white mt-0.5">
                      {selectedPlayerModal.elo || 1000}
                    </span>
                  </div>
                  <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-[#8E98A8]">Efectividad</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white mt-0.5">
                      {pTotal > 0 ? `${pWinRate}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* Barra de Récord: Estado Neutro si pTotal === 0 */}
                {pTotal === 0 ? (
                  <div className="mt-3 bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] text-xs text-[#8E98A8] font-semibold">
                    Aún sin partidos registrados en la temporada
                  </div>
                ) : (
                  <div className="mt-3 bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] text-left space-y-2">
                    <div className="flex justify-between items-center text-xs font-extrabold">
                      <span className="text-[#10B981]">{pWins} Ganados</span>
                      <span className="text-[#8E98A8]">{pTotal} Jugados</span>
                      <span className="text-zinc-400">{pLosses} Perdidos</span>
                    </div>
                    <div className="w-full h-2 bg-[#14171F] rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#10B981]" style={{ width: `${pWinRate}%` }}></div>
                    </div>
                  </div>
                )}

                {(!myPlayer || myPlayer.id !== selectedPlayerModal.id) && (
                  <div className="mt-5">
                    {Math.abs(((myPlayer?.elo || 1000) - (selectedPlayerModal.elo || 1000))) <= 1200 ? (
                      <button
                        onClick={() => {
                          const target = selectedPlayerModal;
                          setSelectedPlayerModal(null);
                          setChallengeTargetModal(target);
                        }}
                        className="w-full bg-[#10B981] hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Swords className="w-4 h-4" /> Lanzar Desafío Oficial
                      </button>
                    ) : (
                      <div className="bg-[#0B0D11] border border-[#222631] text-[#8E98A8] text-xs font-bold py-3.5 rounded-2xl">
                        Fuera del rango reglamentario de desafío (±1,200 Puntos)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================
          MODAL: MOMENTOS CRUCIALES (FELICITACIÓN AL GANADOR / ÁNIMO AL PERDEDOR)
      ======================================================================== */}
      {crucialMomentAlert && (
        <div 
          onClick={() => setCrucialMomentAlert(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-[mpFadeSlide_0.22s_ease-out]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#0B0D11] border border-[#222631] flex items-center justify-center mx-auto">
              {crucialMomentAlert.tipo === 'victoria' ? (
                <SvgTrophy className="w-8 h-8" />
              ) : (
                <Sparkles className="w-7 h-7 text-[#10B981]" />
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] block">
                Comité Deportivo Matchpoint
              </span>
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                {crucialMomentAlert.titulo}
              </h3>
              <p className="text-xs font-bold text-zinc-300">{crucialMomentAlert.subtitulo}</p>
            </div>

            {crucialMomentAlert.detallePuntos && (
              <div className="bg-[#0B0D11] border border-[#222631] py-2.5 px-3 rounded-xl text-xs font-mono text-[#10B981] font-bold">
                {crucialMomentAlert.detallePuntos}
              </div>
            )}

            <p className="text-xs text-[#8E98A8] leading-relaxed bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631]">
              "{crucialMomentAlert.mensaje}"
            </p>

            <button
              onClick={() => setCrucialMomentAlert(null)}
              className="w-full bg-[#10B981] text-zinc-950 font-black py-3 rounded-2xl text-xs"
            >
              Continuar en el Circuito
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: TUERCA DE AJUSTES DE CUENTA (⚙️ EN MI PERFIL - DESCENTRALIZADO)
      ======================================================================== */}
      {showSettingsModal && (
        <div 
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#10B981]" /> Ajustes de Mi Perfil
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                onClick={() => setHidePhonePublic(!hidePhonePublic)}
                className="w-full bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl flex justify-between items-center"
              >
                <span className="text-zinc-200 font-bold">Visibilidad de mi WhatsApp</span>
                <span className="text-[#10B981] font-extrabold">{hidePhonePublic ? 'Solo Rivales' : 'Público'}</span>
              </button>

              <div className="bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl flex justify-between items-center">
                <span className="text-zinc-200 font-bold">Mano de Juego</span>
                <span className="text-[#8E98A8] font-bold">{myPlayer?.mano || 'Diestro'}</span>
              </div>

              <div className="bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl flex justify-between items-center">
                <span className="text-zinc-200 font-bold">Disponibilidad Preferida</span>
                <span className="text-[#8E98A8] font-bold">{myPlayer?.horario || 'Fines de Semana'}</span>
              </div>

              {myPlayer && (
                <button
                  onClick={handleLogout}
                  className="w-full bg-[#0B0D11] hover:border-rose-800 border border-[#222631] text-rose-400 font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 mt-2"
                >
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              )}

              <div className="pt-3 border-t border-[#222631] text-center">
                <button
                  onClick={() => { setShowSettingsModal(false); setShowAdminModal(true); }}
                  className="text-[11px] text-[#8E98A8] hover:text-white font-semibold"
                >
                  Acceso Técnico del Comité (Admin)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MENÚ LATERAL DE 3 RAYITAS (DEPURADO: SOLO INSTITUCIONAL Y REGLAMENTO)
      ======================================================================== */}
      {showSideDrawer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
          <div className="bg-[#14171F] border-r border-[#222631] w-80 max-w-[85vw] h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-[#222631]">
                <div className="flex items-center gap-2.5">
                  <SvgTennisBall className="w-7 h-7" />
                  <div>
                    <h3 className="text-sm font-black text-white leading-none">MATCHPOINT</h3>
                    <span className="text-[10px] text-[#8E98A8] font-bold uppercase">Información Oficial</span>
                  </div>
                </div>
                <button onClick={() => setShowSideDrawer(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#0B0D11] border border-[#222631] p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-[#EAB308] font-extrabold text-xs">
                  <Gift className="w-4 h-4" /> Incentivo Mensual de Cancha
                </div>
                <p className="text-xs text-[#8E98A8] leading-relaxed">
                  Todo socio con <strong className="text-white">4 partidos oficiales al mes</strong> entra al sorteo de tubos de pelotas y horas de cancha.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { setShowSideDrawer(false); setShowRulesModal(true); }}
                  className="w-full bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold text-white"
                >
                  <span className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-[#10B981]" /> Reglamento y Sistema de Puntos</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                <button
                  onClick={() => { setShowSideDrawer(false); handleTabChange('clubs'); setCanchasSubTab('clubes'); }}
                  className="w-full bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold text-white"
                >
                  <span className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-[#D96B43]" /> Sedes y Beneficios de Clubes</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                <button
                  onClick={() => { setShowSideDrawer(false); setShowStoreModal(true); }}
                  className="w-full bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold text-white"
                >
                  <span className="flex items-center gap-2.5"><ShoppingBag className="w-4 h-4 text-[#EAB308]" /> Taller de Encordado & Pro-Shop</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                <a
                  href="https://wa.me/51964000000?text=Hola%20Comité%20MATCHPOINT,%20tengo%20una%20consulta%20sobre%20el%20circuito."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold text-white"
                >
                  <span className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-[#10B981]" /> Contacto con el Comité</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-[#222631] flex justify-between items-center text-[11px] text-[#8E98A8]">
              <span>Temporada Apertura 2026</span>
              <button
                onClick={() => { setShowSideDrawer(false); setShowAdminModal(true); }}
                className="text-zinc-500 hover:text-zinc-300 font-semibold"
              >
                Comité {disputasActivas.length > 0 ? `(${disputasActivas.length})` : ''}
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowSideDrawer(false)}></div>
        </div>
      )}

      {/* ========================================================================
          MODAL: LANZAR DESAFÍO CON SEDE PERSONALIZADA
      ======================================================================== */}
      {challengeTargetModal && (
        <div 
          onClick={() => setChallengeTargetModal(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-[#10B981]" /> Lanzar Desafío Oficial
              </h3>
              <button onClick={() => setChallengeTargetModal(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmarNuevoReto} className="space-y-3.5">
              <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631]">
                <span className="text-[10px] uppercase font-bold text-[#10B981] block">Rival Seleccionado</span>
                <p className="text-base font-black text-white">{challengeTargetModal.nombre}</p>
                <span className="text-xs text-[#8E98A8]">{challengeTargetModal.elo || 1000} Puntos Oficiales</span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Sede del Encuentro</label>
                <select
                  value={challengeSede}
                  onChange={(e) => setChallengeSede(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-3 text-xs text-white font-semibold"
                >
                  {sedesVisibles.map((s, i) => (
                    <option key={i} value={s.nombre}>{s.nombre}</option>
                  ))}
                  <option value="OTRA_SEDE">📍 Otra cancha / Sede particular (Escribir...)</option>
                </select>
              </div>

              {challengeSede === 'OTRA_SEDE' && (
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Nombre o ubicación de la cancha *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cancha Privada / Condominio"
                    value={customSedeText}
                    onChange={(e) => setCustomSedeText(e.target.value)}
                    className="w-full bg-[#0B0D11] border border-[#10B981] rounded-xl px-3 py-3 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Día y Hora Propuesta</label>
                <input
                  type="text"
                  required
                  value={challengeFecha}
                  onChange={(e) => setChallengeFecha(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-3 text-xs text-white"
                />
              </div>

              <button type="submit" className="w-full bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-2xl text-xs shadow-lg">
                Enviar Invitación Oficial
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: PORTAL PRIVADO COACH PRO (AUTOGESTIÓN DE TURNOS LIBRES Y ALUMNOS)
      ======================================================================== */}
      {showCoachProModal && (
        <div 
          onClick={() => setShowCoachProModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#EAB308]" />
                <div>
                  <span className="text-[10px] font-black uppercase text-[#8E98A8] block">Autogestión de Academia</span>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white">
                    Portal Coach Pro
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowCoachProModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isCoachProUnlocked ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (coachPinInput === '7777' || coachPinInput === '1234') {
                    setIsCoachProUnlocked(true);
                  } else {
                    alert('Código incorrecto (Usa 7777).');
                  }
                }}
                className="space-y-3"
              >
                <p className="text-xs text-[#8E98A8]">
                  Ingresa tu clave de entrenador para publicar tus horas libres de cancha de esta semana y gestionar tus grupos:
                </p>
                <input
                  type="password"
                  placeholder="PIN Entrenador (7777)"
                  value={coachPinInput}
                  onChange={(e) => setCoachPinInput(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-3 text-center text-lg tracking-widest text-white font-mono"
                />
                <button type="submit" className="w-full bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-xl text-xs">
                  Ingresar a Mi Academia
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                {/* 1. Publicar Nuevo Hueco Libre en Cancha */}
                <form onSubmit={handleAddCoachFreeSlot} className="bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-[#10B981] block">
                    1. Publicar Turno Libre en mi Perfil Público
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newTurnoDia}
                      onChange={(e) => setNewTurnoDia(e.target.value)}
                      placeholder="Día"
                      className="bg-[#14171F] border border-[#222631] rounded-xl px-2.5 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newTurnoHora}
                      onChange={(e) => setNewTurnoHora(e.target.value)}
                      placeholder="Hora"
                      className="bg-[#14171F] border border-[#222631] rounded-xl px-2.5 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newTurnoClub}
                      onChange={(e) => setNewTurnoClub(e.target.value)}
                      placeholder="Sede"
                      className="bg-[#14171F] border border-[#222631] rounded-xl px-2.5 py-2 text-xs text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#10B981] text-zinc-950 font-black py-2.5 rounded-xl text-xs">
                    + Habilitar Turno Disponible
                  </button>
                </form>

                {/* 2. Padrón de Alumnos Activos en el Circuito */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-[#8E98A8] block">
                    2. Alumnos de mi Academia ({coachAlumnos.length})
                  </span>
                  {coachAlumnos.map(al => (
                    <div key={al.id} className="bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-extrabold text-white text-sm">{al.nombre}</p>
                        <p className="text-[11px] text-[#8E98A8]">{al.grupo}</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#10B981] bg-[#14171F] px-2.5 py-1 rounded-lg border border-[#222631]">
                        {al.asistencias}
                      </span>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newAlumnoNombre.trim()) return;
                    const nuevo = {
                      id: Date.now(),
                      nombre: newAlumnoNombre.trim(),
                      grupo: newAlumnoGrupo,
                      asistencias: '1/8 sesiones',
                      nivel: '5ª P'
                    };
                    const lista = [nuevo, ...coachAlumnos];
                    setCoachAlumnos(lista);
                    localStorage.setItem('mp_coach_alumnos_v6', JSON.stringify(lista));
                    setNewAlumnoNombre('');
                  }}
                  className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631] space-y-2"
                >
                  <span className="text-[10px] font-black uppercase text-[#8E98A8] block">+ Agregar Alumno al Grupo</span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del Alumno"
                    value={newAlumnoNombre}
                    onChange={(e) => setNewAlumnoNombre(e.target.value)}
                    className="w-full bg-[#14171F] border border-[#222631] rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button type="submit" className="w-full bg-[#14171F] border border-[#222631] text-white font-extrabold py-2.5 rounded-xl text-xs">
                    Guardar en Padrón
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: REGLAMENTO OFICIAL Y TÉRMINOS
      ======================================================================== */}
      {showRulesModal && (
        <div 
          onClick={() => setShowRulesModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[88vh]"
          >
            <div className="flex justify-between items-center">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#10B981]" /> Reglamento del Circuito
              </h3>
              <button onClick={() => setShowRulesModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#8E98A8] leading-relaxed">
              <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631]">
                <span className="font-extrabold text-white block uppercase mb-1">1. Puntuación por Mérito y Rival</span>
                Vencer a un oponente con mayor puntaje otorga un salto mayor en la clasificación. Los marcadores amplios en sets bonifican el dominio en cancha.
              </div>
              <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631]">
                <span className="font-extrabold text-white block uppercase mb-1">2. Calibración Inicial (5 Partidos)</span>
                Todo jugador nuevo protege su categoría durante sus primeros 5 encuentros mientras el sistema consolida su nivel real.
              </div>
              <div className="bg-[#0B0D11] p-3.5 rounded-2xl border border-[#222631]">
                <span className="font-extrabold text-white block uppercase mb-1">3. Elegibilidad de Campeón Vigente</span>
                Para recibir premios físicos al cierre de temporada es obligatorio haber completado al menos 5 partidos oficiales en la división.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: SUITE DE ADMINISTRACIÓN (DISPUTAS, PATROCINADORES Y SANDBOX)
      ======================================================================== */}
      {showAdminModal && (
        <div 
          onClick={() => { setShowAdminModal(false); setIsAdminAuth(false); }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Shield className="w-5 h-5 text-[#10B981]" /> Suite del Comité Deportivo
              </h3>
              <button onClick={() => { setShowAdminModal(false); setIsAdminAuth(false); }} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isAdminAuth ? (
              <form onSubmit={(e) => { e.preventDefault(); adminPin === '1234' ? setIsAdminAuth(true) : alert('PIN Incorrecto (1234)'); }} className="space-y-3">
                <input
                  type="password"
                  placeholder="PIN Comité (1234)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-3 text-center text-lg tracking-widest text-white font-mono"
                />
                <button type="submit" className="w-full bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-xl text-xs">
                  Desbloquear Panel
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                {/* 1. Bandeja de Disputas */}
                <div className="bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase text-[#D96B43]">
                      1. Partidos en Disputa ({disputasActivas.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleSimulateDisputeForAdmin}
                      className="text-[10px] bg-[#14171F] text-zinc-300 border border-[#222631] px-2.5 py-1 rounded-lg font-bold"
                    >
                      + Simular Caso
                    </button>
                  </div>

                  {disputasActivas.length === 0 ? (
                    <p className="text-[#8E98A8] text-center py-1">Sin marcadores observados.</p>
                  ) : (
                    <div className="space-y-2">
                      {disputasActivas.map(d => (
                        <div key={d.id} className="bg-[#14171F] border border-[#222631] p-3 rounded-xl space-y-2">
                          <div className="flex justify-between">
                            <span className="font-black text-white">{d.ganadorNombre} vs {d.perdedorNombre}</span>
                            <span className="font-mono text-[#EAB308] font-bold">{d.score}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdminResolveDispute(d, 'aprobar')}
                              className="bg-[#10B981] text-zinc-950 font-black py-1.5 rounded-lg text-[11px]"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminResolveDispute(d, 'editar')}
                              className="bg-[#EAB308] text-zinc-950 font-black py-1.5 rounded-lg text-[11px]"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminResolveDispute(d, 'anular')}
                              className="bg-[#0B0D11] text-rose-400 border border-[#222631] font-bold py-1.5 rounded-lg text-[11px]"
                            >
                              Anular
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Gestor Comercial de Patrocinadores */}
                <div className="bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] space-y-2">
                  <span className="text-[11px] font-black uppercase text-[#EAB308] block">
                    2. Patrocinador Principal de Torneos
                  </span>
                  <input
                    type="text"
                    value={sponsorsData.torneoPrincipal}
                    onChange={(e) => {
                      const nuevo = { ...sponsorsData, torneoPrincipal: e.target.value };
                      setSponsorsData(nuevo);
                      localStorage.setItem('mp_sponsors_v6', JSON.stringify(nuevo));
                    }}
                    className="w-full bg-[#14171F] border border-[#222631] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* 3. Modo Sandbox */}
                <div className="bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] space-y-2.5">
                  <span className="text-[11px] font-black uppercase text-white block">
                    3. Simulación de Cuentas (Sandbox)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pA = jugadores[0] || { id: 901, nombre: 'Mateo Samaniego', elo: 1340, victorias: 6, derrotas: 2 };
                        handleActivateSandboxUser(pA, `Vista: ${pA.nombre.split(' ')[0]}`);
                      }}
                      className="bg-[#14171F] border border-[#222631] text-white font-bold py-2.5 px-2 rounded-xl"
                    >
                      👤 Jugador 1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const pB = jugadores[1] || { id: 902, nombre: 'Alejandro Tovar', elo: 1450, victorias: 7, derrotas: 3 };
                        handleActivateSandboxUser(pB, `Vista: ${pB.nombre.split(' ')[0]}`);
                      }}
                      className="bg-[#14171F] border border-[#222631] text-white font-bold py-2.5 px-2 rounded-xl"
                    >
                      👤 Jugador 2
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateIncomingChallenge}
                    className="w-full bg-[#10B981] text-zinc-950 font-black py-2.5 rounded-xl"
                  >
                    ⚡ Simular Reto Entrante
                  </button>
                </div>

                {/* 4. Respaldo CSV */}
                <div className="bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] space-y-2">
                  <span className="text-[11px] font-black uppercase text-[#10B981] block">
                    4. Respaldo de Partidos ({historialPartidosCSV.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleExportAndPurgeHistory}
                    className="w-full bg-[#14171F] border border-[#222631] text-white font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-[#10B981]" /> Exportar Historial (.CSV)
                  </button>
                </div>

                {/* 5. Cuentas Registradas */}
                <div className="bg-[#0B0D11] p-4 rounded-2xl border border-[#222631] space-y-2.5">
                  <span className="text-[11px] font-black uppercase text-[#8E98A8] block">
                    5. Padrón de Jugadores ({jugadores.length})
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar tenista..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full bg-[#14171F] border border-[#222631] rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {jugadores
                      .filter(j => normalizeText(j.nombre).includes(normalizeText(adminSearch)))
                      .map(j => (
                        <div key={j.id} className="bg-[#14171F] px-3 py-2 rounded-xl flex justify-between items-center border border-[#222631]">
                          <div>
                            <p className="font-bold text-white">{j.nombre}</p>
                            <span className="text-[10px] text-[#8E98A8]">{j.elo} Pts · {j.telefono || 'Sin tel'}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleActivateSandboxUser(j, `Vista: ${j.nombre.split(' ')[0]}`)}
                              className="px-2 py-1 bg-[#0B0D11] border border-[#222631] text-zinc-200 rounded-lg text-[10px] font-bold"
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminDeletePlayer(j)}
                              className="p-1.5 bg-[#0B0D11] text-rose-400 rounded-lg border border-[#222631]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MODALES DE CLIMA, TIENDA, NIVELES, POP-UP DE RETO, CHAT Y SCORE
      ======================================================================== */}
      {weatherModalClub && (
        <div 
          onClick={() => setWeatherModalClub(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-[#10B981]">Estado de Cancha</span>
                <h3 className="text-lg font-black text-white">{weatherModalClub}</h3>
              </div>
              <button onClick={() => setWeatherModalClub(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarClimaModal} className="space-y-3">
              <div className="space-y-2">
                {[
                  'Cancha Seca · Óptima',
                  'Humedad Leve · Jugable',
                  'Llovizna · Precaución',
                  'Lluvia · Cancha Pesada (No Jugable)'
                ].map(est => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setWeatherEstadoInput(est)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl border text-xs font-extrabold flex justify-between items-center ${
                      weatherEstadoInput === est 
                        ? 'bg-[#0B0D11] border-[#10B981] text-white' 
                        : 'bg-[#0B0D11]/60 border-[#222631] text-[#8E98A8]'
                    }`}
                  >
                    <span>{est}</span>
                    {weatherEstadoInput === est && <Check className="w-4 h-4 text-[#10B981]" />}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={weatherDetalleInput}
                onChange={(e) => setWeatherDetalleInput(e.target.value)}
                placeholder="Ej. 19°C · Sin viento"
                className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
              <button type="submit" className="w-full bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-2xl text-xs">
                Publicar Estado
              </button>
            </form>
          </div>
        </div>
      )}

      {showStoreModal && (
        <div 
          onClick={() => setShowStoreModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-[#D96B43] tracking-widest">Matchpoint Pro-Shop</span>
                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                  Taller de Encordado & Tienda
                </h3>
              </div>
              <button onClick={() => setShowStoreModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {PRODUCTOS_TIENDA.map(prod => (
                <div key={prod.id} className="bg-[#0B0D11] border border-[#222631] rounded-2xl p-4 space-y-2.5">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#10B981]">{prod.tipo} · {prod.badge}</span>
                    <h4 className="text-sm font-black text-white mt-0.5">{prod.nombre}</h4>
                    <p className="text-xs text-[#8E98A8] mt-1">{prod.desc}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#222631]">
                    <div>
                      <span className="text-xs text-[#8E98A8] line-through mr-2">S/ {prod.precio}.00</span>
                      <span className="text-sm font-black text-white">Socio / Racha: S/ {prod.precioRacha}.00</span>
                    </div>
                    <a
                      href={`https://wa.me/51964000000?text=${encodeURIComponent(`Hola MATCHPOINT, quiero solicitar: ${prod.nombre} (S/ ${myStreak >= 3 ? prod.precioRacha : prod.precio}).`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#10B981] text-zinc-950 font-black px-3.5 py-2 rounded-xl text-xs"
                    >
                      Solicitar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showLevelsModal && (
        <div 
          onClick={() => setShowLevelsModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Escala Oficial de Categorías</h3>
              <button onClick={() => setShowLevelsModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {ESCALA_CATEGORIAS.map(c => (
                <div key={c.id} className="bg-[#0B0D11] border border-[#222631] px-3.5 py-2.5 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-extrabold text-white">{c.nombre}</span>
                  <span className="font-mono font-bold text-[#10B981]">{c.min} – {c.max} Pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pendingPopupAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-[#10B981] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0B0D11] border border-[#222631] flex items-center justify-center mx-auto text-[#10B981]">
              <Bell className="w-6 h-6" />
            </div>
            {pendingPopupAlert.tipo === 'reto' ? (
              <>
                <span className="text-[10px] font-black uppercase text-[#10B981] tracking-widest">
                  Invitación Oficial de Partido
                </span>
                <h3 className="text-xl font-black text-white">
                  {pendingPopupAlert.data.jugador1} te ha desafiado
                </h3>
                <p className="text-xs text-[#8E98A8]">
                  📍 Sede: <strong className="text-white">{pendingPopupAlert.data.sede}</strong><br />
                  📅 Turno: <strong className="text-white">{pendingPopupAlert.data.fecha}</strong>
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => handleAceptarRetoEntrante(pendingPopupAlert.data.id)}
                    className="bg-[#10B981] text-zinc-950 font-black py-3 rounded-xl text-xs"
                  >
                    Aceptar Partido
                  </button>
                  <button
                    onClick={() => setPendingPopupAlert(null)}
                    className="bg-[#0B0D11] border border-[#222631] text-zinc-300 font-bold py-3 rounded-xl text-xs"
                  >
                    Ver después
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black uppercase text-[#EAB308] tracking-widest">
                  Confirmación de Marcador
                </span>
                <h3 className="text-lg font-black text-white">
                  Verificar Resultado Oficial
                </h3>
                <p className="text-xs text-[#8E98A8]">
                  <strong className="text-white">{pendingPopupAlert.data.ganadorNombre}</strong> registró victoria ante <strong className="text-white">{pendingPopupAlert.data.perdedorNombre}</strong> por <strong className="text-white">{pendingPopupAlert.data.score}</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      const nuevas = validacionesPendientes.map(v => v.id === pendingPopupAlert.data.id ? { ...v, estado: 'Confirmado' } : v);
                      setValidacionesPendientes(nuevas);
                      localStorage.setItem('mp_validaciones_v6', JSON.stringify(nuevas));
                      broadcastLiveUpdate(null, null, nuevas);
                      setPendingPopupAlert(null);
                    }}
                    className="bg-[#10B981] text-zinc-950 font-black py-3 rounded-xl text-xs"
                  >
                    Confirmar Score
                  </button>
                  <button
                    onClick={() => {
                      const nuevas = validacionesPendientes.map(v => v.id === pendingPopupAlert.data.id ? { ...v, estado: 'En Disputa' } : v);
                      setValidacionesPendientes(nuevas);
                      localStorage.setItem('mp_validaciones_v6', JSON.stringify(nuevas));
                      broadcastLiveUpdate(null, null, nuevas);
                      setPendingPopupAlert(null);
                    }}
                    className="bg-[#0B0D11] text-rose-400 border border-[#222631] font-bold py-3 rounded-xl text-xs"
                  >
                    Observar Score
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showNotifModal && (
        <div 
          onClick={() => setShowNotifModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#10B981]" /> Avisos del Circuito
              </h3>
              <button onClick={() => setShowNotifModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {misRetos.map(r => (
                <div key={r.id} className="bg-[#0B0D11] border border-[#222631] p-3.5 rounded-2xl text-xs space-y-1">
                  <span className="text-[10px] font-black text-[#10B981] uppercase">{r.estado}</span>
                  <p className="font-bold text-white">{r.jugador1} vs {r.jugador2}</p>
                  <p className="text-[#8E98A8]">📍 {r.sede} · {r.fecha}</p>
                </div>
              ))}
              {misRetos.length === 0 && (
                <p className="text-xs text-[#8E98A8] text-center py-6">Sin avisos pendientes.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeChatReto && (
        <div 
          onClick={() => setActiveChatReto(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#222631]">
              <div>
                <h3 className="text-sm font-black text-white">Coordinación del Partido</h3>
                <p className="text-[11px] text-[#10B981]">{activeChatReto.jugador1} vs {activeChatReto.jugador2}</p>
              </div>
              <button onClick={() => setActiveChatReto(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#0B0D11] p-3 rounded-2xl border border-[#222631] h-52 overflow-y-auto space-y-2">
              {(activeChatReto.mensajes || []).map((m, i) => (
                <div key={i} className="bg-[#14171F] border border-[#222631] p-2.5 rounded-xl text-xs">
                  <div className="flex justify-between text-[10px] text-[#10B981] font-bold">
                    <span>{m.autor}</span>
                    <span className="text-[#8E98A8]">{m.hora}</span>
                  </div>
                  <p className="text-zinc-100 mt-0.5">{m.texto}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleEnviarMensajeInterno} className="flex gap-2">
              <input
                type="text"
                placeholder="Acordar cancha, pelotas o turno..."
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                className="flex-1 bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-2.5 text-xs text-white"
              />
              <button type="submit" className="bg-[#10B981] text-zinc-950 font-black px-4 rounded-xl text-xs">
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {showMatchModal && (
        <div 
          onClick={() => setShowMatchModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-[#10B981]" /> Registrar Marcador Oficial
              </h3>
              <button onClick={() => setShowMatchModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProcesarPartido} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Resultado por Sets</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 6-4, 6-3"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-2.5 text-sm text-white font-mono"
                />
                <span className="text-[11px] text-[#10B981] font-bold block mt-1">
                  {calcularFactorDominio(score).label}
                </span>
              </div>

              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                required
                className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-3 text-xs text-white font-bold"
              >
                <option value="">¿Quién ganó el encuentro?</option>
                {p1Id && <option value={p1Id}>{jugadores.find(j => j.id.toString() === p1Id)?.nombre}</option>}
                {p2Id && <option value={p2Id}>{jugadores.find(j => j.id.toString() === p2Id)?.nombre}</option>}
              </select>

              <button
                type="submit"
                disabled={calculatingMatch}
                className="w-full bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-2xl text-xs shadow-lg"
              >
                {calculatingMatch ? 'Validando Resultado...' : 'Confirmar Marcador Oficial'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL DE ACCESO DUAL: CELULAR (WHATSAPP) O CORREO + SALIDA EN LAPTOP
      ======================================================================== */}
      {showAuthModal && (
        <div 
          onClick={() => setShowAuthModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                {authMode === 'login' ? 'Ingresar a Matchpoint' : 'Crear Cuenta Oficial'}
              </h3>
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="w-8 h-8 rounded-full bg-[#0B0D11] border border-[#222631] flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Dual: Con mi Celular vs Con mi Correo */}
            <div className="grid grid-cols-2 gap-1.5 bg-[#0B0D11] p-1 rounded-2xl border border-[#222631]">
              <button
                type="button"
                onClick={() => setAuthMethod('celular')}
                className={`py-2 rounded-xl text-xs font-extrabold transition ${
                  authMethod === 'celular' ? 'bg-[#14171F] text-[#10B981] border border-[#222631]' : 'text-[#8E98A8]'
                }`}
              >
                📱 Con mi Celular
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('correo')}
                className={`py-2 rounded-xl text-xs font-extrabold transition ${
                  authMethod === 'correo' ? 'bg-[#14171F] text-[#10B981] border border-[#222631]' : 'text-[#8E98A8]'
                }`}
              >
                ✉️ Con mi Correo
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-3.5">
              {authMethod === 'celular' ? (
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Número de Celular / WhatsApp (9 dígitos) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 964123456"
                    value={authPhoneInput}
                    onChange={(e) => setAuthPhoneInput(e.target.value)}
                    className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3.5 py-3 text-sm text-white font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="tucorreo@ejemplo.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3.5 py-3 text-sm text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Escribe tu contraseña"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3.5 py-3 pr-11 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#8E98A8] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={keepSession}
                  onChange={(e) => setKeepSession(e.target.checked)}
                  className="rounded accent-[#10B981] w-4 h-4"
                />
                Mantener mi sesión iniciada
              </label>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-2xl text-xs shadow-lg"
              >
                {authLoading ? 'Verificando...' : (authMode === 'login' ? 'Entrar al Circuito' : 'Continuar al Paso 2')}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="w-full text-center text-xs text-[#10B981] font-bold pt-1"
              >
                {authMode === 'login' ? '¿Nuevo tenista? Crea tu cuenta aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full text-center text-[11px] text-[#8E98A8] hover:text-white font-semibold pt-1 border-t border-[#222631]"
              >
                Explorar el Circuito como Invitado
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL CREACIÓN DE PERFIL: DESBLOQUEADO EN LAPTOP/WEB CON BOTÓN SALIR
      ======================================================================== */}
      {showProfileSetup && (
        <div 
          onClick={() => setShowProfileSetup(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14171F] border border-[#222631] w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]"
          >
            {/* Barra Superior con Botón de Retroceso y Cierre Visible (Fin al bloqueo en Desktop) */}
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#222631]">
              <button
                type="button"
                onClick={() => {
                  if (quizStep > 0) setQuizStep(quizStep - 1);
                  else setShowProfileSetup(false);
                }}
                className="text-xs font-bold text-[#8E98A8] hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> {quizStep > 0 ? 'Paso anterior' : 'Volver al inicio'}
              </button>
              <button
                type="button"
                onClick={() => setShowProfileSetup(false)}
                className="w-8 h-8 rounded-full bg-[#0B0D11] border border-[#222631] flex items-center justify-center text-zinc-400 hover:text-white"
                title="Cerrar y explorar como invitado"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quizStep === 0 ? (
              <div className="space-y-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#10B981]">Paso 1 de 5 · Datos Oficiales</span>
                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">Ficha del Tenista</h3>

                <div className="flex flex-col items-center py-1">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-[#0B0D11] border border-dashed border-[#10B981] flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {isCompressing ? (
                      <Loader2 className="w-6 h-6 text-[#10B981] animate-spin" />
                    ) : fotoPreview ? (
                      <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover object-center" />
                    ) : (
                      <Camera className="w-6 h-6 text-[#10B981]" />
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <span className="text-[11px] text-[#8E98A8] mt-1">Subir fotografía (Opcional)</span>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido *"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3.5 py-2.5 text-sm text-white"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#8E98A8] block mb-1">Edad (Habilita +40) *</label>
                    <input
                      type="number"
                      min="12"
                      max="90"
                      required
                      value={edad}
                      onChange={(e) => setEdad(e.target.value)}
                      className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#8E98A8] block mb-1">Rama / División *</label>
                    <select
                      value={genero}
                      onChange={(e) => setGenero(e.target.value)}
                      className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-2.5 text-sm text-white"
                    >
                      <option value="Varones">Varones</option>
                      <option value="Damas">Damas</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#8E98A8] block mb-1">Mano Hábil</label>
                    <select
                      value={mano}
                      onChange={(e) => setMano(e.target.value)}
                      className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-2.5 text-sm text-white"
                    >
                      <option value="Diestro">Diestro</option>
                      <option value="Zurdo">Zurdo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#8E98A8] block mb-1">Horario Preferido</label>
                    <select
                      value={horarioPref}
                      onChange={(e) => setHorarioPref(e.target.value)}
                      className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3 py-2.5 text-sm text-white"
                    >
                      <option value="Fines de Semana">Fines de Semana</option>
                      <option value="Noches (Lun-Vie)">Noches (Lun-Vie)</option>
                      <option value="Mañanas">Mañanas</option>
                    </select>
                  </div>
                </div>

                <input
                  type="tel"
                  required
                  placeholder="Celular / WhatsApp (9 dígitos) *"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3.5 py-2.5 text-sm text-white"
                />

                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-[#222631] rounded-xl px-3.5 py-2.5 text-sm text-white"
                >
                  {SEDES_CLUB_PRO.map((s, i) => (
                    <option key={i} value={s.nombre}>{s.nombre}</option>
                  ))}
                  <option value="Independiente">Independiente / Otra Cancha</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (!nombre.trim() || !(telefono.trim() || authPhoneInput.trim())) {
                      return alert('Completa tu nombre y número de WhatsApp.');
                    }
                    setQuizStep(1);
                  }}
                  className="w-full bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
                >
                  Continuar a Calibración (4 Preguntas) ➔
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const card = FLASH_CARDS_4_OPCIONES[quizStep - 1];
                  const valorActual = respuestasLikert[quizStep - 1];
                  return (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                        Calibración Inicial · Pregunta {quizStep} de 4
                      </span>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                        {card.titulo}
                      </h3>
                      <p className="text-xs text-zinc-200 font-semibold">{card.pregunta}</p>
                      <div className="bg-[#0B0D11] border border-[#222631] p-3 rounded-2xl text-[11px] text-[#8E98A8]">
                        {card.nota}
                      </div>
                      <div className="space-y-2">
                        {card.escala.map((item) => (
                          <button
                            key={item.valor}
                            type="button"
                            onClick={() => {
                              const copia = [...respuestasLikert];
                              copia[quizStep - 1] = item.valor;
                              setRespuestasLikert(copia);
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold flex justify-between items-center ${
                              valorActual === item.valor
                                ? 'bg-[#0B0D11] border-[#10B981] text-white'
                                : 'bg-[#0B0D11]/60 border-[#222631] text-[#8E98A8]'
                            }`}
                          >
                            <span>{item.label}</span>
                            {valorActual === item.valor && <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 ml-2" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setQuizStep(quizStep - 1)}
                          className="w-1/3 bg-[#0B0D11] border border-[#222631] text-zinc-300 font-bold py-3.5 rounded-2xl text-xs"
                        >
                          Atrás
                        </button>
                        {quizStep < 4 ? (
                          <button
                            type="button"
                            onClick={() => setQuizStep(quizStep + 1)}
                            className="w-2/3 bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
                          >
                            Siguiente ➔
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={savingPlayer}
                            onClick={handleCompleteProfile}
                            className="w-2/3 bg-[#10B981] text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
                          >
                            {savingPlayer ? 'Activando Cuenta...' : 'Finalizar y Crear Cuenta'}
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          BARRA DE NAVEGACIÓN INFERIOR ERGONÓMICA DE 76PX (SIN CAJAS TIPO WORD)
      ======================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[76px] bg-[#0B0D11]/95 backdrop-blur-xl border-t border-white/[0.08] flex justify-around items-center px-2 z-40 select-none">
        <button 
          onClick={() => handleTabChange('perfil')} 
          className={`flex flex-col items-center justify-center w-16 h-14 transition-colors ${
            tab === 'perfil' ? 'text-[#10B981]' : 'text-[#8E98A8] hover:text-zinc-200'
          }`}
        >
          <User className="w-6 h-6" strokeWidth={tab === 'perfil' ? 2.5 : 2} />
          <span className={`text-[11px] mt-1 ${tab === 'perfil' ? 'font-extrabold text-white' : 'font-medium'}`}>
            Mi Perfil
          </span>
          <span className={`w-1 h-1 rounded-full mt-0.5 transition-all ${tab === 'perfil' ? 'bg-[#10B981]' : 'bg-transparent'}`} />
        </button>

        <button 
          onClick={() => handleTabChange('ranking')} 
          className={`flex flex-col items-center justify-center w-16 h-14 transition-colors ${
            tab === 'ranking' ? 'text-[#10B981]' : 'text-[#8E98A8] hover:text-zinc-200'
          }`}
        >
          <Trophy className="w-6 h-6" strokeWidth={tab === 'ranking' ? 2.5 : 2} />
          <span className={`text-[11px] mt-1 ${tab === 'ranking' ? 'font-extrabold text-white' : 'font-medium'}`}>
            Ranking
          </span>
          <span className={`w-1 h-1 rounded-full mt-0.5 transition-all ${tab === 'ranking' ? 'bg-[#10B981]' : 'bg-transparent'}`} />
        </button>

        {/* Botón Central Flotante "Retos" con Elevación Física */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            onClick={() => handleTabChange('match')}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-[#0B0D11] transition-all ${
              tab === 'match' 
                ? 'bg-[#10B981] text-zinc-950 shadow-[0_8px_24px_rgba(16,185,129,0.45)] scale-105' 
                : 'bg-[#14171F] text-[#10B981] border-[#222631] shadow-[0_8px_20px_rgba(0,0,0,0.6)]'
            }`}
          >
            <Swords className="w-6 h-6" strokeWidth={2.4} />
          </button>
          <span className={`text-[11px] mt-1 ${tab === 'match' ? 'font-extrabold text-[#10B981]' : 'font-semibold text-[#8E98A8]'}`}>
            Retos
          </span>
        </div>

        <button 
          onClick={() => handleTabChange('clubs')} 
          className={`flex flex-col items-center justify-center w-16 h-14 transition-colors ${
            tab === 'clubs' ? 'text-[#10B981]' : 'text-[#8E98A8] hover:text-zinc-200'
          }`}
        >
          <MapPin className="w-6 h-6" strokeWidth={tab === 'clubs' ? 2.5 : 2} />
          <span className={`text-[11px] mt-1 ${tab === 'clubs' ? 'font-extrabold text-white' : 'font-medium'}`}>
            Directorio
          </span>
          <span className={`w-1 h-1 rounded-full mt-0.5 transition-all ${tab === 'clubs' ? 'bg-[#10B981]' : 'bg-transparent'}`} />
        </button>

        <button 
          onClick={() => handleTabChange('torneos')} 
          className={`flex flex-col items-center justify-center w-16 h-14 transition-colors ${
            tab === 'torneos' ? 'text-[#10B981]' : 'text-[#8E98A8] hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-6 h-6" strokeWidth={tab === 'torneos' ? 2.5 : 2} />
          <span className={`text-[11px] mt-1 ${tab === 'torneos' ? 'font-extrabold text-white' : 'font-medium'}`}>
            Torneos
          </span>
          <span className={`w-1 h-1 rounded-full mt-0.5 transition-all ${tab === 'torneos' ? 'bg-[#10B981]' : 'bg-transparent'}`} />
        </button>
      </nav>
    </div>
  );
}
};
