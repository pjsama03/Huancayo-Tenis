import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Swords, MapPin, User, X, Phone, Shield, 
  Calendar, QrCode, Lock, CloudRain, Sun, 
  LogOut, Camera, Loader2, Sparkles, 
  Clock, CheckCircle2, Users, ChevronRight, 
  Eye, EyeOff, Bell, Menu, Award, Trash2, 
  MessageSquare, Gift, ShoppingBag, 
  Download, Check, BookOpen, Crown, GraduationCap, Edit3
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ============================================================================
// 1. ACTIVOS VECTORIALES SVG PREMIUM (DISEÑO DETALLADO SIN RECUADROS)
// ============================================================================
const SvgTennisBall = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ballGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#E9FF54" />
        <stop offset="55%" stopColor="#B8E61E" />
        <stop offset="100%" stopColor="#6E9900" />
      </radialGradient>
      <filter id="ballGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#B8E61E" floodOpacity="0.35" />
      </filter>
    </defs>
    <circle cx="60" cy="60" r="50" fill="url(#ballGrad)" filter="url(#ballGlow)" />
    <path d="M23 30 C 48 48, 48 72, 23 90" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" opacity="0.92" />
    <path d="M97 30 C 72 48, 72 72, 97 90" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" opacity="0.92" />
    <circle cx="60" cy="60" r="50" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.3" />
  </svg>
);

const SvgFlame = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flameOuter" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF9F1C" />
        <stop offset="50%" stopColor="#FF5400" />
        <stop offset="100%" stopColor="#D90429" />
      </linearGradient>
      <linearGradient id="flameInner" x1="18" y1="12" x2="18" y2="33" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF3B0" />
        <stop offset="100%" stopColor="#FFBE0B" />
      </linearGradient>
    </defs>
    <path d="M19.5 2.5C19.5 2.5 28.5 10.2 28.5 19.5C28.5 26.8 23.6 32.5 17.5 32.5C11.2 32.5 6.5 27.1 6.5 20C6.5 14.8 9.8 10.3 12.2 8.2C12.2 8.2 11.5 13.2 14.5 14.2C13.2 9.4 16.2 4.8 19.5 2.5Z" fill="url(#flameOuter)" />
    <path d="M17.8 13.5C17.8 13.5 23.2 18.2 23.2 23.5C23.2 27.9 20.4 31.2 16.8 31.2C13.2 31.2 10.8 28.1 10.8 24.2C10.8 20.9 13.4 18.5 14.8 17C14.8 17 14.5 20.1 16.4 20.6C15.6 17.8 16.4 15.2 17.8 13.5Z" fill="url(#flameInner)" />
  </svg>
);

const SvgMedal = ({ rank = 1, className = "w-7 h-7" }) => {
  const colors = {
    1: { top: '#FFE066', bot: '#D97706', rim: '#FEF08A', ribbon: '#E11D48', text: '#451A03' },
    2: { top: '#F4F4F5', bot: '#71717A', rim: '#FFFFFF', ribbon: '#2563EB', text: '#18181B' },
    3: { top: '#FDBA74', bot: '#9A3412', rim: '#FED7AA', ribbon: '#059669', text: '#431407' }
  }[rank] || { top: '#FFE066', bot: '#D97706', rim: '#FEF08A', ribbon: '#E11D48', text: '#451A03' };

  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L17 16H10L7 4H12Z" fill={colors.ribbon} />
      <path d="M28 4L23 16H30L33 4H28Z" fill={colors.ribbon} />
      <circle cx="20" cy="24" r="12" fill={colors.top} stroke={colors.rim} strokeWidth="2" />
      <circle cx="20" cy="24" r="9" fill={colors.bot} fillOpacity="0.25" />
      <text x="20" y="28" textAnchor="middle" fill={colors.text} fontSize="12" fontWeight="900" fontFamily="sans-serif">
        {rank}
      </text>
    </svg>
  );
};

const SvgTrophy = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trophyGold" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="55%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <path d="M11 8H29V17C29 22.5 25 26.5 20 26.5C15 26.5 11 22.5 11 17V8Z" fill="url(#trophyGold)" />
    <path d="M11 10H6V15C6 18.5 8.5 20.5 11 20.5" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M29 10H34V15C34 18.5 31.5 20.5 29 20.5" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
    <rect x="17.5" y="26" width="5" height="6" rx="1" fill="#D97706" />
    <rect x="12" y="32" width="16" height="4" rx="2" fill="url(#trophyGold)" />
  </svg>
);

// ============================================================================
// 2. TIPS DE TENIS ROTATIVOS (ESTILO VIDEOJUEGO EN PANTALLAS Y TRANSICIONES)
// ============================================================================
const TIPS_DE_TENIS = [
  "💡 Tip de Cancha: En el segundo saque, busca altura y efecto sobre la red antes que velocidad.",
  "💡 Táctica Pro: En arcilla, inicia el deslizamiento antes de golpear la pelota, nunca después.",
  "💡 Estrategia: Juega cruzado para construir el punto y cambia paralelo cuando entres dentro de la cancha.",
  "💡 Mentalidad: Juega cada punto como si fuera 0-0; el punto anterior ya quedó atrás.",
  "💡 Físico: Hidrátate en cada cambio de lado con pequeños sorbos antes de sentir sed."
];

// ============================================================================
// 3. COMPRESIÓN DE IMÁGENES EN CLIENTE
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
          resolve({ file: newFile, preview: canvas.toDataURL('image/jpeg', 0.8) });
        }, 'image/jpeg', 0.8);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// ============================================================================
// 4. ESCALA DE CATEGORÍAS Y 4 PREGUNTAS DIRECTAS (4 OPCIONES + NIVEL CERO)
// ============================================================================
const ESCALA_CATEGORIAS = [
  { id: '5ª P', nombre: '5ª P · Principiante', min: 0, max: 600, badge: 'Iniciación', color: 'text-amber-300 border-amber-500/40 bg-amber-500/15' },
  { id: '5ª B', nombre: '5ª B · Inicial', min: 601, max: 1200, badge: 'Intermedio Bajo', color: 'text-orange-300 border-orange-400/40 bg-orange-400/15' },
  { id: '5ª A', nombre: '5ª A · Consolidado', min: 1201, max: 1800, badge: 'Intermedio', color: 'text-sky-300 border-sky-400/40 bg-sky-400/15' },
  { id: '4ª', nombre: '4ª Categoría', min: 1801, max: 2800, badge: 'Competitivo Regular', color: 'text-zinc-100 border-zinc-400/50 bg-zinc-400/15' },
  { id: '3ª', nombre: '3ª Categoría', min: 2801, max: 3800, badge: 'Nivel Máximo Local', color: 'text-yellow-300 border-yellow-400/50 bg-yellow-400/15' },
  { id: '2ª', nombre: '2ª Categoría', min: 3801, max: 4800, badge: 'Zafiro Nacional', color: 'text-cyan-300 border-cyan-400/50 bg-cyan-400/15' },
  { id: '1ª', nombre: '1ª Categoría', min: 4801, max: 6000, badge: 'Corona Pro', color: 'text-emerald-300 border-emerald-400/50 bg-emerald-400/15' }
];

const getInfoCategoria = (puntos = 1000) => {
  return ESCALA_CATEGORIAS.find(c => puntos >= c.min && puntos <= c.max) || ESCALA_CATEGORIAS[6];
};

// 4 PREGUNTAS DIRECTAS, NATURALES Y CON OPCIÓN "EMPIEZO DE CERO"
const FLASH_CARDS_4_OPCIONES = [
  {
    paso: 1,
    titulo: 'Experiencia en el Tenis',
    pregunta: '¿Cuál es tu experiencia actual jugando al tenis?',
    ejemplo: '💡 Si recién vas a empezar desde cero, marca la primera opción sin problema.',
    escala: [
      { valor: 1, label: '1 · Empiezo de cero: No sé nada de tenis o recién voy a aprender' },
      { valor: 2, label: '2 · Principiante: Peloteo suave de vez en cuando con amigos' },
      { valor: 3, label: '3 · Intermedio: Juego seguido y mantengo peloteos largos de fondo' },
      { valor: 4, label: '4 · Avanzado: Juego hace años, entreno fuerte y compito en torneos' }
    ]
  },
  {
    paso: 2,
    titulo: 'Al Momento de Sacar',
    pregunta: 'Al momento de sacar, ¿cómo es tu servicio?',
    ejemplo: '💡 El saque define qué tan parejos serán tus primeros partidos.',
    escala: [
      { valor: 1, label: '1 · Aún no sé sacar: Recién estoy aprendiendo el movimiento' },
      { valor: 2, label: '2 · Saque suave: Solo busco pasar la pelota para no hacer doble falta' },
      { valor: 3, label: '3 · Saque seguro: Buen primer saque y segundo saque constante' },
      { valor: 4, label: '4 · Saque de ataque: Saco fuerte, colocado a las esquinas y con efecto' }
    ]
  },
  {
    paso: 3,
    titulo: 'Golpes y Efectos (Topspin y Slice)',
    pregunta: '¿Dominas efectos como el Topspin (con giro hacia adelante) o el Slice (cortado)?',
    ejemplo: '💡 Saber si golpeas plano o con efecto nos ayuda a ubicarte con precisión.',
    escala: [
      { valor: 1, label: '1 · No sé qué son: Recién estoy aprendiendo a golpear la pelota' },
      { valor: 2, label: '2 · Golpeo plano: Sé qué son, pero pego casi siempre plano por seguridad' },
      { valor: 3, label: '3 · Los uso bien: Pego con topspin de fondo y uso slice para defenderme' },
      { valor: 4, label: '4 · Dominio total: Controlo topspin pesado, slice, globos y voleas en la red' }
    ]
  },
  {
    paso: 4,
    titulo: 'Partidos a Sets Completos',
    pregunta: '¿Qué tanta costumbre tienes jugando partidos con puntaje oficial (15, 30, 40, Set)?',
    ejemplo: '💡 Recuerda que tu categoría estará protegida durante tus primeros 5 partidos.',
    escala: [
      { valor: 1, label: '1 · Ninguna aún: Todavía no he jugado sets o estoy aprendiendo a contar' },
      { valor: 2, label: '2 · Poca: Juego sets amistosos ocasionales sin tanta exigencia' },
      { valor: 3, label: '3 · Frecuente: Juego partidos completos casi todas las semanas' },
      { valor: 4, label: '4 · Nivel Torneo: He competido en campeonatos llegando a rondas finales' }
    ]
  }
];

const calcularPuntos4Opciones = (respuestas) => {
  // Suma de 4 preguntas con valores de 1 a 4 -> base de 0 a 12
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
    return { fd: 0.5, label: 'Duelo Muy Parejo' };
  } catch {
    return { fd: 1.0, label: 'Resultado Estándar' };
  }
};

// ============================================================================
// 5. SEDES, PROFESORES, TORNEOS, SALÓN DE LA FAMA Y TIENDA OFICIAL
// ============================================================================
const SEDES_CLUB_PRO = [
  {
    id: 'club-country',
    nombre: 'Country Club Huancayo',
    canchas: '3 Canchas de Arcilla Reglamentarias',
    zona: 'El Tambo',
    tel: '964123456',
    servicios: ['Iluminación Nocturna', 'Cafetería & Restaurante', 'Vestuarios', 'Estacionamiento'],
    beneficioMatchpoint: '15% de descuento en alquiler de cancha en horario valle (10:00 a 15:00) presentando tu Carnet Matchpoint.',
    sponsorBadge: 'CLUB PRO ALIADO',
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
    sponsorBadge: 'CLUB PRO TECHADO',
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'club-romina',
    nombre: 'Academia Romina Cutipa',
    canchas: '2 Canchas de Arcilla',
    zona: 'Huancayo Este',
    tel: '999555444',
    servicios: ['Academia Formativa', 'Canasto de Pelotas', 'Alquiler de Raquetas', 'Kiosco'],
    beneficioMatchpoint: '20% de descuento en tu primera clase de evaluación técnica.',
    sponsorBadge: 'SEDE ACADEMIA PRO',
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
    sponsorBadge: 'CLUB PRO ASOCIADO',
    img: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=900&q=80'
  }
];

const PROFESORES_INICIALES = [
  {
    id: 'prof-1',
    nombre: 'Prof. Rodrigo Quispe',
    especialidad: 'Alta Competencia, Técnica de Saque y Estrategia',
    niveles: 'Todos los niveles (5ª P hasta 3ª)',
    sede: 'Country Club Huancayo / Academia Romina Cutipa',
    tarifa: 'S/ 50 / hora individual',
    tel: '944889900',
    destacado: 'Coach Pro Verificado',
    activo: true,
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'prof-2',
    nombre: 'Prof. Romina Cutipa',
    especialidad: 'Iniciación para Adultos, Damas y Técnica Base',
    niveles: 'Especialista en 5ª P, 5ª B y 5ª A',
    sede: 'Academia Romina Cutipa',
    tarifa: 'S/ 45 / hora individual · Grupal disponible',
    tel: '999555444',
    destacado: 'Directora de Academia Aliada',
    activo: true,
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
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

const TORNEOS_INICIALES = [
  {
    id: 't-3a',
    cat: '3ª',
    titulo: 'Copa Apertura · 3ª Categoría',
    subtitulo: 'Nivel Máximo Local · Cuadro de Maestros',
    sede: 'Country Club Huancayo',
    fecha: '21 y 22 de Noviembre',
    precio: 45,
    min: 8,
    maxCupos: 16,
    img: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
    participantes: [
      { nombre: 'Carlos Mendoza', club: 'Country Club Huancayo', pts: 1620 },
      { nombre: 'Renato Vilchez', club: 'Club Tauro Tenis', pts: 1580 },
      { nombre: 'Diego Cárdenas', club: 'Academia Romina Cutipa', pts: 1490 },
      { nombre: 'Alejandro Tovar', club: 'Country Club Huancayo', pts: 1450 },
      { nombre: 'Gonzalo Palacios', club: 'Complejo Shyam Huilca', pts: 1380 },
      { nombre: 'Mateo Samaniego', club: 'Independiente', pts: 1340 },
      { nombre: 'Sebastián Romero', club: 'Club Tauro Tenis', pts: 1260 },
      { nombre: 'Rodrigo Quispe', club: 'Country Club Huancayo', pts: 1220 }
    ]
  },
  {
    id: 't-4a',
    cat: '4ª',
    titulo: 'Copa Apertura · 4ª Categoría',
    subtitulo: 'Cuadro Principal + Ronda Consuelo Garantizada',
    sede: 'Country Club Huancayo',
    fecha: '21 y 22 de Noviembre',
    precio: 40,
    min: 8,
    maxCupos: 16,
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    participantes: [
      { nombre: 'Gonzalo Palacios', club: 'Complejo Shyam Huilca', pts: 1380 },
      { nombre: 'Mateo Samaniego', club: 'Independiente', pts: 1340 },
      { nombre: 'Sebastián Romero', club: 'Club Tauro Tenis', pts: 1260 },
      { nombre: 'Rodrigo Quispe', club: 'Country Club Huancayo', pts: 1220 },
      { nombre: 'Franco Huamán', club: 'Academia Romina Cutipa', pts: 1180 },
      { nombre: 'Martín Santillán', club: 'Country Club Huancayo', pts: 1920 },
      { nombre: 'Jorge Villavicencio', club: 'Club Tauro Tenis', pts: 1890 },
      { nombre: 'Luis Fernando Paz', club: 'Independiente', pts: 1850 }
    ]
  },
  {
    id: 't-5a',
    cat: '5ª A',
    titulo: 'Copa Apertura · 5ª Categoría A',
    subtitulo: 'Intermedio Consolidado · Trofeo y Puntos Oficiales',
    sede: 'Club Tauro Tenis',
    fecha: '28 y 29 de Noviembre',
    precio: 40,
    min: 8,
    maxCupos: 16,
    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    participantes: [
      { nombre: 'Franco Huamán', club: 'Academia Romina Cutipa', pts: 1280 },
      { nombre: 'Joaquín Paredes', club: 'Complejo Shyam Huilca', pts: 1240 },
      { nombre: 'Roberto Gómez', club: 'Country Club Huancayo', pts: 1310 },
      { nombre: 'Héctor Baldeón', club: 'Club Tauro Tenis', pts: 1410 },
      { nombre: 'César Augusto Ríos', club: 'Independiente', pts: 1350 },
      { nombre: 'Pedro Pablo Lazo', club: 'Country Club Huancayo', pts: 1480 },
      { nombre: 'Miguel Ángel Soto', club: 'Academia Romina Cutipa', pts: 1290 },
      { nombre: 'Daniel Verástegui', club: 'Club Tauro Tenis', pts: 1330 }
    ]
  },
  {
    id: 't-5b',
    cat: '5ª B',
    titulo: 'Copa Apertura · 5ª Categoría B',
    subtitulo: 'Intermedio Inicial · Súmate y abre el cuadro',
    sede: 'Academia Romina Cutipa',
    fecha: '28 y 29 de Noviembre',
    precio: 40,
    min: 8,
    maxCupos: 16,
    img: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
    participantes: [
      { nombre: 'Joaquín Paredes', club: 'Complejo Shyam Huilca', pts: 1110 },
      { nombre: 'Fernando Calmell', club: 'Country Club Huancayo', pts: 980 },
      { nombre: 'Óscar Benavides', club: 'Independiente', pts: 890 },
      { nombre: 'Raúl Ordoñez', club: 'Club Tauro Tenis', pts: 1040 },
      { nombre: 'Víctor Hugo Meza', club: 'Academia Romina Cutipa', pts: 920 },
      { nombre: 'Arturo Peñaloza', club: 'Country Club Huancayo', pts: 860 },
      { nombre: 'Gabriel Salcedo', club: 'Independiente', pts: 950 }
    ]
  },
  {
    id: 't-5p',
    cat: '5ª P',
    titulo: 'Copa Apertura · 5ª Principiantes',
    subtitulo: 'Ideal para debutar en torneos con rivales de tu mismo nivel',
    sede: 'Complejo Shyam Huilca',
    fecha: '5 y 6 de Diciembre',
    precio: 35,
    min: 8,
    maxCupos: 16,
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    participantes: [
      { nombre: 'Ernesto Velarde', club: 'Academia Romina Cutipa', pts: 480 },
      { nombre: 'Julio César Tapia', club: 'Independiente', pts: 520 },
      { nombre: 'Marcelo Quintana', club: 'Country Club Huancayo', pts: 410 },
      { nombre: 'Sergio Bustamante', club: 'Complejo Shyam Huilca', pts: 450 },
      { nombre: 'Andrés Gutarra', club: 'Club Tauro Tenis', pts: 550 },
      { nombre: 'Ricardo Hinojosa', club: 'Independiente', pts: 390 }
    ]
  }
];

const PRODUCTOS_TIENDA = [
  {
    id: 'srv-encordado',
    tipo: 'Taller Oficial',
    nombre: 'Servicio de Encordado Profesional + Recojo en Club',
    desc: 'Cuerdas Poliéster Control o Multifilamento Confort. Ajustamos la tensión exacta en libras según tu estilo de juego.',
    precio: 35,
    precioRacha: 30,
    badge: 'Beneficio Racha Activa'
  },
  {
    id: 'prod-overgrip',
    tipo: 'Accesorios Oficiales',
    nombre: 'Pack x3 Overgrips Matchpoint Pro Tacky',
    desc: 'Máxima absorción y agarre antideslizante para arcilla.',
    precio: 25,
    precioRacha: 20,
    badge: 'Alta Rotación'
  },
  {
    id: 'prod-antivib',
    tipo: 'Accesorios Oficiales',
    nombre: 'Antivibradores Oficiales Matchpoint (Par)',
    desc: 'Protege tu codo y muñeca reduciendo la vibración del encordado.',
    precio: 15,
    precioRacha: 12,
    badge: 'Edición Circuito'
  },
  {
    id: 'prod-raqueta-semi',
    tipo: 'Seminuevos Certificados',
    nombre: 'Babolat Pure Drive 300g (Estado 9.5/10 · Certificada)',
    desc: 'Revisada por nuestros entrenadores aliados. Encordado nuevo incluido.',
    precio: 580,
    precioRacha: 550,
    badge: 'Garantía Oficial'
  }
];

export default function App() {
  // Splash Screen Cinemático + Tips de Tenis Rotativos
  const [showSplash, setShowSplash] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);

  // Navegación Principal con Transiciones Fluidas
  const [tab, setTab] = useState('perfil');
  const [retosSubTab, setRetosSubTab] = useState('mis_retos');
  const [canchasSubTab, setCanchasSubTab] = useState('clubes');
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('General');

  // Usuario y Modo Sandbox
  const [currentUser, setCurrentUser] = useState(null);
  const [sandboxLabel, setSandboxLabel] = useState(null);
  const [keepSession, setKeepSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hidePhonePublic, setHidePhonePublic] = useState(false);

  // Modales Globales Nuevos
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [showHallOfFameModal, setShowHallOfFameModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showMemberPassModal, setShowMemberPassModal] = useState(false);
  const [showCoachProModal, setShowCoachProModal] = useState(false);
  const [pendingPopupAlert, setPendingPopupAlert] = useState(null);

  // Portal Privado Coach Pro (Gestión de Academias y Alumnos para Profesores)
  const [coachPinInput, setCoachPinInput] = useState('');
  const [isCoachProUnlocked, setIsCoachProUnlocked] = useState(false);
  const [coachAlumnos, setCoachAlumnos] = useState(() => {
    const saved = localStorage.getItem('mp_coach_alumnos');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [
      { id: 1, nombre: 'Marcelo Quintana', grupo: 'Adultos Iniciación · Mar/Jue 19:00', asistencias: '7/8 clases', estadoPago: 'Pagado', monto: 'S/ 180' },
      { id: 2, nombre: 'Ernesto Velarde', grupo: 'Adultos Iniciación · Mar/Jue 19:00', asistencias: '6/8 clases', estadoPago: 'Pendiente', monto: 'S/ 180' },
      { id: 3, nombre: 'Claudia Soto', grupo: 'Damas Intermedio · Sáb 10:00', asistencias: '4/4 clases', estadoPago: 'Pagado', monto: 'S/ 140' }
    ];
  });
  const [newAlumnoNombre, setNewAlumnoNombre] = useState('');
  const [newAlumnoGrupo, setNewAlumnoGrupo] = useState('Adultos Iniciación · Mar/Jue 19:00');
  const [newAlumnoMonto, setNewAlumnoMonto] = useState('S/ 180');

  // Auth y Registro con Edad (+40), Género (Damas/Varones) y Mano Hábil
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [quizStep, setQuizStep] = useState(0);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('34');
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

  // Modal Técnico de Clima
  const [weatherModalClub, setWeatherModalClub] = useState(null);
  const [weatherEstadoInput, setWeatherEstadoInput] = useState('Cancha Seca · Óptima');
  const [weatherDetalleInput, setWeatherDetalleInput] = useState('19°C · Sin viento');

  // Torneos
  const [torneosData, setTorneosData] = useState(() => {
    const saved = localStorage.getItem('mp_torneos_v5');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return TORNEOS_INICIALES;
  });
  const [selectedTorneoModal, setSelectedTorneoModal] = useState(null);

  // Admin Suite, Disputas y Feature Toggles
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showAllianceModal, setShowAllianceModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [newProfNombre, setNewProfNombre] = useState('');
  const [newProfEsp, setNewProfEsp] = useState('');
  const [newProfTarifa, setNewProfTarifa] = useState('S/ 50 / hora');
  const [newProfTel, setNewProfTel] = useState('');

  const [featureToggles, setFeatureToggles] = useState(() => {
    const saved = localStorage.getItem('mp_feature_toggles_v5');
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

  // Subir Score
  const [activeRetoId, setActiveRetoId] = useState(null);
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [score, setScore] = useState('6-4, 6-3');
  const [winnerId, setWinnerId] = useState('');
  const [calculatingMatch, setCalculatingMatch] = useState(false);

  // Profesores
  const [profesores, setProfesores] = useState(() => {
    const saved = localStorage.getItem('mp_profesores_v5');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return PROFESORES_INICIALES;
  });

  // Retos en Vivo (Sincronizados con Supabase retos_activos + fallback local)
  const [retosProgramados, setRetosProgramados] = useState(() => {
    const saved = localStorage.getItem('mp_retos_v5');
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

  // Historial Compacto de Partidos (Para Cara a Cara y Respaldo CSV)
  const [historialPartidosCSV, setHistorialPartidosCSV] = useState(() => {
    const saved = localStorage.getItem('mp_historial_csv_v5');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [
      { fecha: '2026-11-05', ganador: 'Carlos Mendoza', perdedor: 'Renato Vilchez', marcador: '6-4, 6-4', delta: '+42 Pts' },
      { fecha: '2026-11-07', ganador: 'Rodrigo Quispe', perdedor: 'Franco Huamán', marcador: '6-2, 6-3', delta: '+51 Pts' }
    ];
  });

  // Validaciones y Disputas para el Panel Admin
  const [validacionesPendientes, setValidacionesPendientes] = useState(() => {
    const saved = localStorage.getItem('mp_validaciones_v5');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [];
  });

  const [historialCruces, setHistorialCruces] = useState(() => {
    const saved = localStorage.getItem('mp_cruces_v5');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return {};
  });

  // Rachas (Solo tienen racha quienes realmente han ganado partidos consecutivos)
  const [rachasUsuarios, setRachasUsuarios] = useState(() => {
    const saved = localStorage.getItem('mp_rachas_v5');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return { 'Carlos Mendoza': 4, 'Rodrigo Quispe': 5, 'Gonzalo Palacios': 3 };
  });

  const [climaSedes, setClimaSedes] = useState(() => {
    const saved = localStorage.getItem('mp_clima_v5');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return {
      'Country Club Huancayo': { estado: 'Cancha Seca · Óptima', detalle: '20°C · Soleado', hora: '15:10', reportadoPor: 'Rodrigo Quispe' },
      'Club Tauro Tenis': { estado: 'Techado · 100% Jugable', detalle: '18°C · Cubierto', hora: '14:45', reportadoPor: 'Gonzalo Palacios' },
      'Academia Romina Cutipa': { estado: 'Cancha Seca · Óptima', detalle: '19°C · Nublado parcial', hora: '16:00', reportadoPor: 'Diego Cárdenas' },
      'Complejo Shyam Huilca': { estado: 'Humedad Leve · Jugable', detalle: '17°C · Viento ligero', hora: '15:30', reportadoPor: 'Mateo Samaniego' }
    };
  });

  // ============================================================================
  // 6. INICIALIZACIÓN, ANIMACIONES CSS Y SINCRONIZACIÓN SUPABASE REALTIME
  // ============================================================================
  useEffect(() => {
    if (!document.getElementById('mp-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'mp-google-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    // Inyectar animaciones suaves de transición entre pestañas y botones interactivos
    if (!document.getElementById('mp-animations-css')) {
      const style = document.createElement('style');
      style.id = 'mp-animations-css';
      style.innerHTML = `
        @keyframes mpFadeSlide {
          0% { opacity: 0; transform: translateY(8px) scale(0.995); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mp-page-transition {
          animation: mpFadeSlide 0.26s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        button, a {
          transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.18s ease, box-shadow 0.18s ease;
        }
        button:active, a:active {
          transform: scale(0.96);
        }
      `;
      document.head.appendChild(style);
    }

    const timer = setTimeout(() => setShowSplash(false), 1450);
    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS_DE_TENIS.length);
    }, 6000);

    fetchData();
    fetchRetosFromSupabase();

    const session = localStorage.getItem('tennis_user_session') || sessionStorage.getItem('tennis_user_session');
    if (session) {
      try { setCurrentUser(JSON.parse(session)); } catch { /* ignore */ }
    }

    const channel = supabase
      .channel('matchpoint_v5_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jugadores' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retos_activos' }, () => {
        fetchRetosFromSupabase();
      })
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        if (payload?.retos) {
          setRetosProgramados(payload.retos);
          localStorage.setItem('mp_retos_v5', JSON.stringify(payload.retos));
        }
        if (payload?.clima) {
          setClimaSedes(payload.clima);
          localStorage.setItem('mp_clima_v5', JSON.stringify(payload.clima));
        }
        if (payload?.validaciones) {
          setValidacionesPendientes(payload.validaciones);
          localStorage.setItem('mp_validaciones_v5', JSON.stringify(payload.validaciones));
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    const handleStorageSync = (e) => {
      if (e.key === 'mp_retos_v5' && e.newValue) setRetosProgramados(JSON.parse(e.newValue));
      if (e.key === 'mp_validaciones_v5' && e.newValue) setValidacionesPendientes(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageSync);

    return () => {
      clearTimeout(timer);
      clearInterval(tipTimer);
      window.removeEventListener('storage', handleStorageSync);
      supabase.removeChannel(channel);
    };
  }, []);

  // Rotar tip de tenis cada vez que cambia de pestaña
  const handleTabChange = (newTab) => {
    setTipIndex(prev => (prev + 1) % TIPS_DE_TENIS.length);
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
        localStorage.setItem('mp_retos_v5', JSON.stringify(data));
      }
    } catch {
      // Si la tabla retos_activos aún no fue creada en SQL, usa localStorage + Broadcast sin fallar
    }
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

  // DETECTOR EXACTO POR ID O NOMBRE NORMALIZADO PARA RETOS ENTRANTES EN CELULARES REALES
  const normalizeText = (str = '') => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

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

  // Datos y Métricas del Usuario Actual
  const myPlayer = currentUser ? (jugadores.find(j => j.id === currentUser.id) || currentUser) : null;
  const myRankPos = myPlayer ? jugadores.findIndex(j => j.id === myPlayer.id) + 1 : 0;
  const myWins = myPlayer?.victorias || 0;
  const myLosses = myPlayer?.derrotas || 0;
  const myTotalMatches = myWins + myLosses;
  const isCalibrated = myTotalMatches >= 5;
  const myWinRate = myTotalMatches > 0 ? Math.round((myWins / myTotalMatches) * 100) : 0;
  const myCatInfo = getInfoCategoria(myPlayer?.elo || 1000);

  // REGLA ESTRICTA DE RACHA CERO: Si victorias === 0, la racha es 0 y NO se muestra en ningún lado
  const getPlayerStreak = (playerObj) => {
    if (!playerObj) return 0;
    const wins = playerObj.victorias || 0;
    if (wins === 0) return 0;
    const savedStreak = rachasUsuarios[playerObj.nombre];
    if (typeof savedStreak === 'number') return savedStreak;
    return (playerObj.derrotas || 0) === 0 ? wins : 0;
  };

  const myStreak = getPlayerStreak(myPlayer);

  // Jugador justo arriba ("Rival a Tiro")
  const playerAboveMe = myRankPos > 1 ? jugadores[myRankPos - 2] : null;
  const ptsToOvertake = playerAboveMe && myPlayer ? Math.max(1, (playerAboveMe.elo || 1000) - (myPlayer.elo || 1000) + 1) : 0;

  const puntosEnCat = Math.max(0, (myPlayer?.elo || 1000) - myCatInfo.min);
  const totalRangoCat = myCatInfo.max - myCatInfo.min;
  const faltanParaSubir = Math.max(0, myCatInfo.max + 1 - (myPlayer?.elo || 1000));

  const misRetos = retosProgramados.filter(r => isPlayerInReto(r, myPlayer));
  const disputasActivas = validacionesPendientes.filter(v => v.estado === 'En Disputa');
  const misNotificacionesCount = misRetos.length + validacionesPendientes.filter(v => v.estado === 'Pendiente').length;

  const getAvatarHaloClass = (playerObj, rankIndex) => {
    const racha = getPlayerStreak(playerObj);
    if (rankIndex === 0) return 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.55)]';
    if (rankIndex === 1) return 'ring-4 ring-zinc-300 shadow-[0_0_16px_rgba(212,212,216,0.4)]';
    if (rankIndex === 2) return 'ring-4 ring-amber-600 shadow-[0_0_16px_rgba(217,119,6,0.45)]';
    if (racha >= 3) return 'ring-4 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]';
    return 'ring-2 ring-emerald-500/60';
  };

  // Calcular Cara a Cara (Head-to-Head) entre el usuario y cualquier jugador seleccionado
  const getHeadToHead = (targetPlayer) => {
    if (!myPlayer || !targetPlayer) return { myWinsH2H: 0, rivalWinsH2H: 0 };
    const mName = normalizeText(myPlayer.nombre);
    const tName = normalizeText(targetPlayer.nombre);
    let myWinsH2H = 0, rivalWinsH2H = 0;
    historialPartidosCSV.forEach(h => {
      const g = normalizeText(h.ganador);
      const p = normalizeText(h.perdedor);
      if (g === mName && p === tName) myWinsH2H++;
      if (g === tName && p === mName) rivalWinsH2H++;
    });
    return { myWinsH2H, rivalWinsH2H };
  };

  // ============================================================================
  // 7. FOTOS, REGISTRO CON EDAD/GÉNERO Y MODO SANDBOX
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
      alert('No se pudo procesar la imagen.');
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

  async function handleAuth(e) {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) return;
    try {
      setAuthLoading(true);
      if (authMode === 'signup') {
        const { data: existing } = await supabase
          .from('jugadores')
          .select('id')
          .eq('email', authEmail.trim())
          .maybeSingle();
        if (existing) {
          alert('Este correo ya está registrado. Inicia sesión.');
          setAuthMode('login');
          return;
        }
        setShowAuthModal(false);
        setQuizStep(0);
        setShowProfileSetup(true);
      } else {
        const { data, error } = await supabase
          .from('jugadores')
          .select('*')
          .eq('email', authEmail.trim())
          .eq('password', authPassword.trim())
          .maybeSingle();
        if (error || !data) return alert('Correo o contraseña incorrectos.');
        setCurrentUser(data);
        setSandboxLabel(null);
        if (keepSession) {
          localStorage.setItem('tennis_user_session', JSON.stringify(data));
        } else {
          sessionStorage.setItem('tennis_user_session', JSON.stringify(data));
        }
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
        handleTabChange('perfil');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCompleteProfile() {
    if (!nombre.trim()) return alert('Ingresa tu nombre y apellido.');
    const edadNum = parseInt(edad, 10) || 30;
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

      // Intento principal con las nuevas columnas SQL (edad, genero, mano, horario)
      let { data, error } = await supabase.from('jugadores').insert([{
        email: authEmail.trim(),
        password: authPassword.trim(),
        nombre: nombre.trim(),
        club: club.trim(),
        categoria: calib.cat,
        telefono: telefono.trim(),
        foto_url: publicFotoUrl,
        elo: calib.elo,
        victorias: 0,
        derrotas: 0,
        edad: edadNum,
        genero,
        mano,
        horario: horarioPref
      }]).select();

      // Respaldo automático si el usuario aún no ejecutó el ALTER TABLE en SQL
      if (error) {
        const fallbackRes = await supabase.from('jugadores').insert([{
          email: authEmail.trim(),
          password: authPassword.trim(),
          nombre: nombre.trim(),
          club: club.trim(),
          categoria: calib.cat,
          telefono: telefono.trim(),
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
      setTelefono('');
      setFotoFile(null);
      setFotoPreview(null);
      await fetchData();
      handleTabChange('perfil');
    } catch (err) {
      alert('Error guardando ficha: ' + err.message);
    } finally {
      setSavingPlayer(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('tennis_user_session');
    sessionStorage.removeItem('tennis_user_session');
    setCurrentUser(null);
    setSandboxLabel(null);
    setShowSideDrawer(false);
    handleTabChange('perfil');
  }

  function handleActivateSandboxUser(targetPlayer, label = 'Modo Pruebas') {
    if (!targetPlayer) return;
    setCurrentUser(targetPlayer);
    setSandboxLabel(label);
    localStorage.setItem('tennis_user_session', JSON.stringify(targetPlayer));
    setShowAdminModal(false);
    setShowSideDrawer(false);
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
    localStorage.setItem('mp_retos_v5', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);
    setCurrentUser(receptor);
    setSandboxLabel(`Vista: ${receptor.nombre}`);
    setShowAdminModal(false);
    setPendingPopupAlert({ tipo: 'reto', data: retoTest });
  }

  // Simular un Partido en Disputa para probar la Bandeja de Disputas en el Panel Admin
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
    localStorage.setItem('mp_validaciones_v5', JSON.stringify(nuevas));
    broadcastLiveUpdate(null, null, nuevas);
    alert('✅ Se ha generado un partido "En Disputa" en la Bandeja de Resolución de Disputas de abajo.');
  }

  // ============================================================================
  // 8. CREACIÓN DE RETOS (CON SEDE PERSONALIZADA Y MATCHING POR ID EN SUPABASE)
  // ============================================================================
  async function handleConfirmarNuevoReto(e) {
    e.preventDefault();
    if (!challengeTargetModal) return;
    if (challengeSede === 'OTRA_SEDE' && !customSedeText.trim()) {
      return alert('Por favor escribe el nombre o dirección de la cancha donde jugarán.');
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

    try {
      await supabase.from('retos_activos').insert([nuevoReto]);
    } catch { /* fallback local */ }

    const actualizados = [nuevoReto, ...retosProgramados];
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v5', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);

    const rivalTel = challengeTargetModal.telefono || '';
    const rivalNombre = challengeTargetModal.nombre;
    setChallengeTargetModal(null);
    setCustomSedeText('');
    handleTabChange('match');
    setRetosSubTab('mis_retos');

    if (rivalTel && window.confirm(`✅ Desafío registrado contra ${rivalNombre}.\n\n¿Deseas enviarle también el aviso por WhatsApp?`)) {
      const msg = `🎾 *MATCHPOINT OFICIAL*: Hola ${rivalNombre.split(' ')[0]}, te he lanzado un desafío oficial en *${sedeFinal}* (${challengeFecha}). Entra a la app para aceptar el partido: https://huancayo-tenis.vercel.app`;
      window.open(`https://wa.me/51${rivalTel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }

  async function handleAceptarRetoEntrante(retoId) {
    try {
      await supabase.from('retos_activos').update({ estado: 'Programado' }).eq('id', retoId);
    } catch { /* ignore */ }

    const actualizados = retosProgramados.map(r => 
      r.id === retoId ? { ...r, estado: 'Programado' } : r
    );
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v5', JSON.stringify(actualizados));
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

    try {
      await supabase.from('retos_activos').update({ mensajes: nuevosMensajes }).eq('id', activeChatReto.id);
    } catch { /* ignore */ }

    const actualizados = retosProgramados.map(r => {
      if (r.id === activeChatReto.id) {
        return { ...r, mensajes: nuevosMensajes };
      }
      return r;
    });
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v5', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);
    setActiveChatReto(actualizados.find(r => r.id === activeChatReto.id));
    setChatMessageInput('');
  }

  // PROCESAR PARTIDO (LENGUAJE 100% DEPORTIVO, CERO MENCIÓN A MEMORIA O ALGORITMOS)
  async function handleProcesarPartido(e) {
    e.preventDefault();
    if (!p1Id || !p2Id || !winnerId) return alert('Selecciona quién ganó el partido.');
    if (p1Id === p2Id) return alert('Los competidores deben ser distintos.');

    const player1 = jugadores.find(j => j.id.toString() === p1Id);
    const player2 = jugadores.find(j => j.id.toString() === p2Id);
    if (!player1 || !player2) return;

    const pairKey = [player1.id, player2.id].sort().join('_');
    const enfrentamientosPrevios = historialCruces[pairKey] || 0;
    if (enfrentamientosPrevios >= 2) {
      return alert(
        'Reglamento del Circuito:\n\n' +
        `${player1.nombre} y ${player2.nombre} ya disputaron ${enfrentamientosPrevios} partidos puntuables entre sí esta semana.\n` +
        'Debes enfrentar a otros oponentes del ranking.'
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
      localStorage.setItem('mp_rachas_v5', JSON.stringify(nuevasRachas));

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
      localStorage.setItem('mp_cruces_v5', JSON.stringify(nuevoCruces));

      const lineaHistorica = {
        fecha: new Date().toISOString().split('T')[0],
        ganador: ganadorObj.nombre,
        perdedor: perdedorObj.nombre,
        marcador: score,
        delta: `+${S1 === 1 ? delta1 : delta2} Pts`
      };
      const nuevoHistCSV = [lineaHistorica, ...historialPartidosCSV];
      setHistorialPartidosCSV(nuevoHistCSV);
      localStorage.setItem('mp_historial_csv_v5', JSON.stringify(nuevoHistCSV));

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
      localStorage.setItem('mp_validaciones_v5', JSON.stringify(nuevasVal));

      // Silenciosamente retira el partido finalizado de retos activos (Opacidad Técnica Total)
      let restantes = retosProgramados;
      if (activeRetoId) {
        try { await supabase.from('retos_activos').delete().eq('id', activeRetoId); } catch { /* ignore */ }
        restantes = retosProgramados.filter(r => r.id !== activeRetoId);
        setRetosProgramados(restantes);
        localStorage.setItem('mp_retos_v5', JSON.stringify(restantes));
        setActiveRetoId(null);
      }

      broadcastLiveUpdate(restantes, null, nuevasVal);

      alert(
        `🎾 Marcador Oficial Registrado (${fdLabel})\n\n` +
        `• ${player1.nombre}: ${newElo1} Puntos (${delta1 >= 0 ? '+' : ''}${delta1})\n` +
        `• ${player2.nombre}: ${newElo2} Puntos (${delta2 >= 0 ? '+' : ''}${delta2})`
      );

      setShowMatchModal(false);
      await fetchData();
    } catch (err) {
      alert('Error al registrar el marcador: ' + err.message);
    } finally {
      setCalculatingMatch(false);
    }
  }

  // Exportación para el Administrador (Exclusivo en Panel Admin con PIN)
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

    setHistorialPartidosCSV([]);
    setValidacionesPendientes([]);
    setHistorialCruces({});
    localStorage.setItem('mp_historial_csv_v5', JSON.stringify([]));
    localStorage.setItem('mp_validaciones_v5', JSON.stringify([]));
    localStorage.setItem('mp_cruces_v5', JSON.stringify({}));
    alert('✅ Archivo CSV descargado para tu Google Drive.');
  }

  // Acciones del Administrador sobre Partidos en Disputa
  function handleAdminResolveDispute(disputa, accion) {
    if (accion === 'aprobar') {
      const nuevas = validacionesPendientes.map(v => v.id === disputa.id ? { ...v, estado: 'Confirmado por Comité' } : v);
      setValidacionesPendientes(nuevas);
      localStorage.setItem('mp_validaciones_v5', JSON.stringify(nuevas));
      broadcastLiveUpdate(null, null, nuevas);
      alert(`✔ Marcador (${disputa.score}) ratificado oficialmente.`);
    } else if (accion === 'editar') {
      const nuevoScore = window.prompt('Ingresa el marcador corregido por el Comité:', disputa.score);
      if (!nuevoScore) return;
      const nuevas = validacionesPendientes.map(v => v.id === disputa.id ? { ...v, score: nuevoScore, estado: 'Corregido por Comité' } : v);
      setValidacionesPendientes(nuevas);
      localStorage.setItem('mp_validaciones_v5', JSON.stringify(nuevas));
      broadcastLiveUpdate(null, null, nuevas);
      alert(`✏️ Marcador actualizado a ${nuevoScore}.`);
    } else if (accion === 'anular') {
      const nuevas = validacionesPendientes.filter(v => v.id !== disputa.id);
      setValidacionesPendientes(nuevas);
      localStorage.setItem('mp_validaciones_v5', JSON.stringify(nuevas));
      broadcastLiveUpdate(null, null, nuevas);
      alert('🗑️ Encuentro anulado del registro.');
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
    localStorage.setItem('mp_clima_v5', JSON.stringify(nuevoMapa));
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
      localStorage.setItem('mp_torneos_v5', JSON.stringify(actualizados));
      setSelectedTorneoModal(actualizados.find(t => t.id === torneo.id));
    }
  }

  async function handleAdminDeletePlayer(player) {
    if (!window.confirm(`¿Seguro que deseas eliminar la cuenta de "${player.nombre}"?`)) return;
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
      especialidad: newProfEsp.trim() || 'Entrenamiento Integral de Tenis',
      niveles: 'Todas las categorías',
      sede: 'Sede Oficial Asociada',
      tarifa: newProfTarifa.trim(),
      tel: newProfTel.trim(),
      destacado: 'Coach Pro Verificado',
      activo: true,
      foto: null
    };
    const lista = [nuevo, ...profesores];
    setProfesores(lista);
    localStorage.setItem('mp_profesores_v5', JSON.stringify(lista));
    setNewProfNombre('');
    setNewProfEsp('');
    setNewProfTel('');
    alert('✅ Entrenador publicado en el directorio.');
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
    localStorage.setItem('mp_feature_toggles_v5', JSON.stringify(updated));
  }

  function toggleProfesorVisibility(profId) {
    const updated = profesores.map(p => p.id === profId ? { ...p, activo: p.activo === false ? true : false } : p);
    setProfesores(updated);
    localStorage.setItem('mp_profesores_v5', JSON.stringify(updated));
  }

  const sedesVisibles = SEDES_CLUB_PRO.filter(c => featureToggles.clubesActivos?.[c.nombre] !== false);
  const profesoresVisibles = profesores.filter(p => p.activo !== false);

  const clubStats = sedesVisibles.map(c => {
    const socios = jugadores.filter(j => j.club === c.nombre);
    const totalPuntos = socios.reduce((sum, j) => sum + (j.elo || 1000), 0);
    return { ...c, sociosCount: socios.length, totalPuntos };
  }).sort((a, b) => b.totalPuntos - a.totalPuntos);

  // Filtrado de Jugadores para General, Damas, +40 Senior y Categorías
  const jugadoresFiltrados = jugadores.filter(j => {
    if (filtroCat === 'General') return true;
    if (filtroCat === 'Damas') return j.genero === 'Damas' || ['romina', 'claudia', 'maria', 'lucia', 'ana', 'sofia'].some(n => normalizeText(j.nombre).includes(n));
    if (filtroCat === '+40 Senior') return (j.edad && Number(j.edad) >= 40) || (!j.edad && (j.elo || 1000) >= 1350);
    return getInfoCategoria(j.elo || 1000).id === filtroCat;
  });

  // ============================================================================
  // 9. PANTALLA SPLASH CINEMÁTICA CON TIPS DE TENIS
  // ============================================================================
  if (showSplash) {
    return (
      <div 
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        className="min-h-screen bg-[#111318] text-[#F4F4F6] flex flex-col items-center justify-center p-6 max-w-md mx-auto select-none relative overflow-hidden"
      >
        <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="animate-bounce mb-6">
          <SvgTennisBall className="w-28 h-28" />
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-4xl font-black tracking-tight text-white">
          MATCHPOINT
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-[#E06D44] font-extrabold mt-2">
          Circuito Oficial de Tenis
        </p>
        <div className="w-48 h-1.5 bg-zinc-800/90 rounded-full overflow-hidden mt-7">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-[#E06D44] rounded-full animate-pulse w-full"></div>
        </div>
        <p className="text-xs text-zinc-300 text-center max-w-xs mt-6 bg-[#181B22] border border-zinc-800 px-4 py-2.5 rounded-2xl">
          {TIPS_DE_TENIS[0]}
        </p>
      </div>
    );
  }

  return (
    <div 
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-[#111318] text-[#F5F5F7] flex flex-col max-w-md mx-auto shadow-2xl pb-32 border-x border-zinc-800/80 relative"
    >
      {/* BARRA DE PRUEBA RÁPIDA SI EL MODO SANDBOX ESTÁ ACTIVO */}
      {sandboxLabel && (
        <div className="bg-amber-500 text-zinc-950 px-3 py-1.5 text-xs font-black flex items-center justify-between sticky top-0 z-50">
          <span>🧪 {sandboxLabel} ({myPlayer?.nombre})</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const otro = jugadores.find(j => j.id !== myPlayer?.id) || jugadores[0];
                if (otro) handleActivateSandboxUser(otro, `Vista: ${otro.nombre.split(' ')[0]}`);
              }}
              className="bg-zinc-950 text-amber-400 px-2 py-0.5 rounded-md text-[11px] font-black"
            >
              ⇄ Cambiar Cuenta
            </button>
            <button
              onClick={() => setSandboxLabel(null)}
              className="bg-zinc-900/20 px-1.5 py-0.5 rounded text-[11px]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
          HEADER PREMIUM CENTRADO
      ======================================================================== */}
      <header className="pt-12 pb-3.5 px-4 bg-[#161920]/95 backdrop-blur-md border-b border-zinc-800/90 grid grid-cols-3 items-center sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSideDrawer(true)}
            className="p-2.5 bg-[#1F232D] hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-100"
            title="Menú y Opciones"
          >
            <Menu className="w-5 h-5 text-emerald-400" />
          </button>
          {featureToggles.tiendaActiva && (
            <button
              onClick={() => setShowStoreModal(true)}
              className="p-2.5 bg-[#1F232D] hover:bg-zinc-800 border border-[#E06D44]/40 rounded-xl text-[#E06D44]"
              title="Tienda & Encordado"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-center">
          <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black tracking-tight text-white leading-none">
            MATCHPOINT
          </h1>
          <span className="text-[10px] tracking-[0.18em] uppercase font-extrabold text-[#E06D44] block mt-1">
            Circuito Oficial
          </span>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowNotifModal(true)}
            className="relative p-2.5 bg-[#1F232D] hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-100"
            title="Avisos"
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            {misNotificacionesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E06D44] text-white text-[10px] font-black flex items-center justify-center">
                {misNotificacionesCount}
              </span>
            )}
          </button>

          {myPlayer ? (
            <button 
              onClick={() => handleTabChange('perfil')}
              className="bg-[#1F232D] border border-emerald-500/40 px-2.5 py-2 rounded-xl text-xs font-extrabold text-emerald-400 truncate max-w-[78px]"
            >
              {myPlayer.nombre.split(' ')[0]}
            </button>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3 py-2 rounded-xl text-xs font-black"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* BARRA SUTIL DE TIPS DE TENIS ROTATIVOS */}
      <div className="bg-[#151821] border-b border-zinc-800/80 px-4 py-2 text-[11px] text-zinc-300 font-semibold text-center truncate">
        {TIPS_DE_TENIS[tipIndex]}
      </div>

      <main key={tab} className="p-4 flex-1 space-y-4 mp-page-transition">

        {/* ======================================================================
            1. PESTAÑA: MI PERFIL (RACHA OCULTA SI ES 0 + CARNET DIGITAL)
        ====================================================================== */}
        {tab === 'perfil' && (
          <div className="space-y-4">
            {myPlayer ? (
              <div className="bg-[#181B22] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="relative h-28 bg-gradient-to-r from-[#2A1812] via-[#1B222C] to-[#122620] p-4 flex justify-between items-start">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border backdrop-blur-md ${
                    !isCalibrated 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  }`}>
                    {!isCalibrated ? `🔒 Calibrando (${myTotalMatches}/5)` : `✔ Oficial · Puesto #${myRankPos}`}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* SOLO SE MUESTRA LA RACHA SI EL JUGADOR TIENE VICTORIAS ACTIVAS (myStreak >= 1) */}
                    {myStreak >= 1 && (
                      <div className="inline-flex items-center gap-1.5 bg-zinc-950/80 border border-orange-500/50 px-3 py-1 rounded-full shadow-lg">
                        <SvgFlame className="w-5 h-5" />
                        <span className="text-xs font-black text-orange-300">{myStreak} en racha</span>
                      </div>
                    )}
                    <button
                      onClick={() => setShowMemberPassModal(true)}
                      className="bg-zinc-950/80 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Carnet
                    </button>
                  </div>
                </div>

                <div className="px-6 pb-6 text-center -mt-14 relative">
                  <div className="relative w-28 h-28 mx-auto mb-3">
                    <div 
                      onClick={() => profileAvatarInputRef.current?.click()}
                      className={`w-28 h-28 rounded-full bg-zinc-800 p-1 cursor-pointer overflow-hidden flex items-center justify-center transition ${getAvatarHaloClass(myPlayer, myRankPos - 1)}`}
                    >
                      {updatingAvatar ? (
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      ) : myPlayer.foto_url ? (
                        <img src={myPlayer.foto_url} alt={myPlayer.nombre} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-14 h-14 text-zinc-400" />
                      )}
                    </div>
                    <button
                      onClick={() => profileAvatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-emerald-500 text-zinc-950 p-2 rounded-full shadow-lg border-2 border-[#181B22]"
                      title="Cambiar foto"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={profileAvatarInputRef}
                      onChange={handleUpdateProfilePhoto} 
                      className="hidden" 
                    />
                  </div>

                  {/* Insignia de Campeón Vigente si es #1 y cumple el mérito de >= 5 partidos */}
                  {myRankPos === 1 && isCalibrated && (
                    <div className="mb-1.5 inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/50 text-amber-300 px-3 py-0.5 rounded-full text-[11px] font-black uppercase">
                      <Crown className="w-3.5 h-3.5" /> Campeón Vigente del Circuito
                    </div>
                  )}

                  <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                    {myPlayer.nombre}
                  </h2>
                  <p className="text-sm text-zinc-300 font-semibold mt-0.5">
                    {myPlayer.club || 'Independiente'} · {myPlayer.mano || 'Diestro'}
                    {myPlayer.edad && Number(myPlayer.edad) >= 40 ? ' · Senior +40' : ''}
                  </p>

                  {!isCalibrated ? (
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-zinc-900 text-amber-300 border border-amber-500/40">
                      <Lock className="w-3.5 h-3.5" /> Nivel Oculto hasta jugar 5 partidos
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-xs font-extrabold border ${myCatInfo.color}`}>
                      <SvgTrophy className="w-4 h-4" /> {myCatInfo.nombre}
                    </div>
                  )}

                  {/* TARJETAS DE ESTADÍSTICAS GRANDES */}
                  <div className={`grid ${myStreak >= 1 ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 mt-5`}>
                    <div className="bg-[#12141A] p-3.5 rounded-2xl border border-zinc-800 flex flex-col items-center">
                      <SvgTrophy className="w-6 h-6 mb-1" />
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-emerald-400">
                        {myPlayer.elo || 1000}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">Puntos Oficiales</span>
                    </div>

                    {myStreak >= 1 && (
                      <div className="bg-[#12141A] p-3.5 rounded-2xl border border-orange-500/30 flex flex-col items-center">
                        <SvgFlame className="w-6 h-6 mb-1" />
                        <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-orange-400">
                          {myStreak}
                        </span>
                        <span className="text-[11px] font-bold text-zinc-400">Racha Activa</span>
                      </div>
                    )}

                    <div className="bg-[#12141A] p-3.5 rounded-2xl border border-zinc-800 flex flex-col items-center">
                      <Award className="w-6 h-6 text-sky-400 mb-1" />
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-sky-300">
                        {myWinRate}%
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">Efectividad</span>
                    </div>
                  </div>

                  {/* BARRA DE RÉCORD */}
                  <div className="mt-4 bg-[#12141A] p-4 rounded-2xl border border-zinc-800 text-left space-y-2.5">
                    <div className="flex justify-between items-center text-sm font-extrabold">
                      <span className="text-emerald-400">✔ {myWins} Ganados</span>
                      <span className="text-zinc-400 text-xs">{myTotalMatches} Jugados</span>
                      <span className="text-rose-400">{myLosses} Perdidos ✕</span>
                    </div>
                    <div className="w-full h-3 bg-rose-950 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-400 transition-all"
                        style={{ width: `${myTotalMatches > 0 ? myWinRate : 50}%` }}
                      ></div>
                    </div>
                  </div>

                  {!isCalibrated ? (
                    <div className="mt-3 bg-[#12141A] p-4 rounded-2xl border border-amber-500/30 text-left">
                      <div className="flex justify-between text-xs font-extrabold mb-1.5">
                        <span className="text-amber-300">Partidos de Calibración</span>
                        <span className="text-white">{myTotalMatches} / 5 completados</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.max(12, (myTotalMatches / 5) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-zinc-300 mt-2">
                        Completa <strong>{5 - myTotalMatches} partido(s) más</strong> para revelar tu categoría y competir por los trofeos de temporada.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 bg-[#12141A] p-4 rounded-2xl border border-zinc-800 text-left">
                      <div className="flex justify-between text-xs font-extrabold mb-1.5">
                        <span className="text-zinc-300">Camino al Ascenso</span>
                        <span className="text-emerald-400">A {faltanParaSubir} Pts</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(10, Math.round((puntosEnCat / totalRangoCat) * 100)))}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button 
                      onClick={() => { handleTabChange('match'); setRetosSubTab('nuevo'); }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Swords className="w-4 h-4" /> Lanzar Reto
                    </button>
                    <button 
                      onClick={() => setShowStoreModal(true)}
                      className="bg-[#231915] hover:bg-[#2F211B] text-[#F79D65] font-extrabold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 border border-[#E06D44]/40"
                    >
                      <ShoppingBag className="w-4 h-4" /> Tienda & Grips
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#181B22] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="relative h-44 w-full">
                  <img 
                    src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80" 
                    alt="Tenis" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-[#181B22]/50 to-transparent"></div>
                  <div className="absolute bottom-3 left-5 right-5 flex items-center gap-3">
                    <SvgTennisBall className="w-12 h-12 shrink-0" />
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#E06D44] block">
                        Comunidad Oficial
                      </span>
                      <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                        Juega, Reta y Sube de Nivel
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-center">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Encuentra rivales de tu mismo nivel, lleva tu récord oficial y participa en las divisiones General, Damas y Senior +40.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-sm shadow-lg"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold py-3.5 rounded-2xl text-sm border border-zinc-700"
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
            2. PESTAÑA: RANKING (DAMAS, +40 SENIOR, SALÓN DE LA FAMA Y PERFIL COMPLETO)
        ====================================================================== */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="bg-[#181B22] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-[#2D1810] via-[#1B222C] to-[#122620] p-4 flex justify-between items-center border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-[#E06D44]" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E06D44] block">
                      Temporada Apertura 2026
                    </span>
                    <p className="text-xs font-black text-white">
                      Cierra en: <span className="text-amber-300 font-mono">19 días · 08 hrs</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowHallOfFameModal(true)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-xs font-extrabold text-amber-300 px-3 py-2 rounded-xl border border-amber-500/40 flex items-center gap-1"
                  >
                    <Crown className="w-3.5 h-3.5" /> Campeones
                  </button>
                  <button
                    onClick={() => setShowLevelsModal(true)}
                    className="bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-extrabold text-emerald-300 px-3 py-2 rounded-xl border border-emerald-500/30"
                  >
                    Niveles
                  </button>
                </div>
              </div>

              {playerAboveMe && (
                <div className="bg-[#14171E] px-4 py-2.5 border-b border-zinc-800/80 flex justify-between items-center text-xs">
                  <span className="text-zinc-300">
                    🎯 Estás a <strong className="text-emerald-400">{ptsToOvertake} Pts</strong> de superar a <strong>{playerAboveMe.nombre}</strong>
                  </span>
                  <button
                    onClick={() => setChallengeTargetModal(playerAboveMe)}
                    className="text-emerald-400 font-black underline ml-2 shrink-0"
                  >
                    Retarlo
                  </button>
                </div>
              )}

              {/* PÍLDORAS DE FILTRO CON DAMAS Y +40 SENIOR */}
              <div className="p-4">
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['General', 'Damas', '+40 Senior', '3ª', '4ª', '5ª A', '5ª B', '5ª P', 'Clubes'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFiltroCat(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 border transition ${
                        filtroCat === cat 
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow' 
                          : 'bg-[#111318] text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {cat === 'General' ? 'General' : cat === 'Damas' ? '👩 Damas' : cat === '+40 Senior' ? '🏅 +40 Senior' : cat === 'Clubes' ? '🏟️ Clubes' : `Cat. ${cat}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filtroCat === 'Clubes' ? (
              <div className="space-y-3">
                {clubStats.map((c, i) => (
                  <div key={i} className="bg-[#181B22] border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3.5">
                      {i < 3 ? <SvgMedal rank={i + 1} className="w-9 h-9 shrink-0" /> : (
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-sm text-zinc-400">
                          #{i + 1}
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-black text-white">{c.nombre}</h4>
                        <p className="text-xs text-zinc-400 font-semibold">{c.sociosCount} tenistas activos sumando puntos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-emerald-400">
                        {c.totalPuntos}
                      </span>
                      <span className="text-[10px] text-zinc-400 block uppercase font-bold">Puntos</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {loading ? (
                  <div className="text-center py-12 text-zinc-400 text-sm font-bold">Cargando clasificación oficial...</div>
                ) : jugadoresFiltrados.length === 0 ? (
                  <div className="bg-[#181B22] border border-zinc-800 p-6 rounded-3xl text-center text-xs text-zinc-400">
                    Aún no hay jugadores registrados en la división <strong>{filtroCat}</strong>.
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
                        className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                          idx === 0 
                            ? 'bg-gradient-to-r from-amber-950/35 via-[#1C2029] to-[#181B22] border-amber-400/50 shadow-lg' 
                            : idx === 1 
                            ? 'bg-gradient-to-r from-zinc-800/40 via-[#1A1E26] to-[#181B22] border-zinc-300/40'
                            : idx === 2
                            ? 'bg-gradient-to-r from-orange-950/30 via-[#1A1E26] to-[#181B22] border-amber-600/40'
                            : 'bg-[#181B22] border-zinc-800/90'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="w-8 flex justify-center shrink-0">
                            {idx < 3 ? (
                              <SvgMedal rank={idx + 1} className="w-8 h-8" />
                            ) : (
                              <span style={{ fontFamily: "'Outfit', sans-serif" }} className="font-black text-base text-zinc-400">
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          <div className={`w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 ${getAvatarHaloClass(j, idx)}`}>
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-zinc-400" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-base font-extrabold text-white leading-tight">{j.nombre}</p>
                              {idx === 0 && totalJ >= 5 && (
                                <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <Crown className="w-3 h-3" /> Campeón Vigente
                                </span>
                              )}
                              {rachaJ >= 3 && (
                                <span className="text-[11px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <SvgFlame className="w-3.5 h-3.5" /> {rachaJ}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-300 font-medium mt-0.5">
                              {j.club || 'Independiente'} ·{' '}
                              {totalJ < 5 ? (
                                <span className="text-amber-300 font-bold">Calibrando ({totalJ}/5)</span>
                              ) : (
                                <span className="text-emerald-400 font-extrabold">Cat. {catInfo.id}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-emerald-400">
                              {j.elo || 1000}
                            </span>
                            <p className="text-[11px] text-zinc-400 font-bold">
                              {j.victorias || 0}G - {j.derrotas || 0}P
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-500" />
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
            3. PESTAÑA CENTRAL: RETOS (DETECCIÓN POR ID + SEDE PERSONALIZADA)
        ====================================================================== */}
        {tab === 'match' && (
          <div className="space-y-4">
            <div className="bg-[#181B22] border border-zinc-800 p-5 rounded-3xl shadow-xl text-center space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E06D44] block">
                Partidos Oficiales
              </span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                Central de Desafíos
              </h2>

              <div className="grid grid-cols-3 gap-1.5 bg-[#111318] p-1.5 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setRetosSubTab('mis_retos')}
                  className={`py-2.5 rounded-xl text-xs font-black transition ${
                    retosSubTab === 'mis_retos' ? 'bg-emerald-500 text-zinc-950 shadow' : 'text-zinc-300'
                  }`}
                >
                  Tus Retos ({misRetos.length})
                </button>
                <button
                  onClick={() => setRetosSubTab('cartelera')}
                  className={`py-2.5 rounded-xl text-xs font-black transition ${
                    retosSubTab === 'cartelera' ? 'bg-emerald-500 text-zinc-950 shadow' : 'text-zinc-300'
                  }`}
                >
                  Cartelera ({retosProgramados.length})
                </button>
                <button
                  onClick={() => setRetosSubTab('nuevo')}
                  className={`py-2.5 rounded-xl text-xs font-black transition ${
                    retosSubTab === 'nuevo' ? 'bg-emerald-500 text-zinc-950 shadow' : 'text-zinc-300'
                  }`}
                >
                  + Retar
                </button>
              </div>
            </div>

            {retosSubTab === 'mis_retos' && (
              <div className="space-y-3">
                {misRetos.length === 0 ? (
                  <div className="bg-[#181B22] border border-zinc-800 p-7 rounded-3xl text-center space-y-3">
                    <Swords className="w-11 h-11 text-emerald-400 mx-auto" />
                    <h4 className="text-lg font-black text-white">No tienes partidos agendados hoy</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Cuando tengas un desafío aceptado con un rival, aquí podrás coordinar por chat y registrar el marcador oficial.
                    </p>
                    <button
                      onClick={() => setRetosSubTab('nuevo')}
                      className="bg-emerald-500 text-zinc-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg"
                    >
                      Buscar Rival para Retar
                    </button>
                  </div>
                ) : (
                  misRetos.map(r => {
                    const soyElRetador = myPlayer && (String(r.retador_id) === String(myPlayer.id) || normalizeText(r.jugador1).includes(normalizeText(myPlayer.nombre)));
                    const otroNombre = soyElRetador ? r.jugador2 : r.jugador1;
                    const rivalObj = jugadores.find(j => normalizeText(j.nombre).includes(normalizeText(otroNombre.split(' ')[0])));
                    const rivalTel = rivalObj?.telefono || '964123456';

                    return (
                      <div key={r.id} className="bg-[#181B22] border-2 border-emerald-500/40 p-5 rounded-3xl space-y-3.5 shadow-xl">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                            {r.cat}
                          </span>
                          <span className={`text-xs font-extrabold flex items-center gap-1 ${
                            r.estado === 'Programado' ? 'text-emerald-400' : 'text-amber-300'
                          }`}>
                            <Clock className="w-3.5 h-3.5" /> {r.estado}
                          </span>
                        </div>

                        <div>
                          <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white">
                            {r.jugador1} <span className="text-[#E06D44] px-1">vs</span> {r.jugador2}
                          </p>
                          <p className="text-xs text-zinc-300 font-semibold mt-1">
                            📍 {r.sede} · 📅 {r.fecha}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setActiveChatReto(r)}
                            className="bg-[#111318] hover:bg-zinc-800 text-zinc-100 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-zinc-700"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-400" /> Chat ({(r.mensajes || []).length})
                          </button>

                          <a
                            href={`https://wa.me/51${rivalTel.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${otroNombre.split(' ')[0]}, coordinemos nuestro partido oficial de MATCHPOINT en ${r.sede} (${r.fecha}).`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#111318] hover:bg-zinc-800 text-emerald-400 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30"
                          >
                            <Phone className="w-4 h-4" /> WhatsApp
                          </a>
                        </div>

                        {r.estado === 'Pendiente de Aceptación' ? (
                          <button
                            onClick={() => handleAceptarRetoEntrante(r.id)}
                            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
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
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Subir Score de este Partido
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {retosSubTab === 'cartelera' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-300 font-semibold px-1">
                  Encuentros oficiales pactados en el circuito:
                </p>
                {retosProgramados.map(r => (
                  <div key={r.id} className="bg-[#181B22] border border-zinc-800 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                        {r.cat}
                      </span>
                      <span className="text-xs text-amber-300 font-bold">● {r.estado}</span>
                    </div>
                    <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-base font-black text-white">
                      {r.jugador1} <span className="text-[#E06D44] px-1">vs</span> {r.jugador2}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs text-zinc-300 font-medium">
                      <span>📍 {r.sede}</span>
                      <span>📅 {r.fecha}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {retosSubTab === 'nuevo' && (
              <div className="space-y-2.5">
                <div className="bg-[#181B22] border border-zinc-800 p-3.5 rounded-2xl text-xs text-zinc-300">
                  <span className="font-black text-emerald-400">Rango Reglamentario (±1,200 Puntos):</span> Elige a tu rival para proponer sede y horario.
                </div>

                {jugadores
                  .filter(j => !myPlayer || j.id !== myPlayer.id)
                  .map((j) => {
                    const diff = myPlayer ? Math.abs((myPlayer.elo || 1000) - (j.elo || 1000)) : 0;
                    const dentroVentana = diff <= 1200;
                    const totalJ = (j.victorias || 0) + (j.derrotas || 0);
                    const catJ = getInfoCategoria(j.elo || 1000);

                    return (
                      <div key={j.id} className={`p-4 rounded-2xl border flex items-center justify-between ${
                        dentroVentana ? 'bg-[#181B22] border-zinc-800' : 'bg-[#14161C] border-zinc-900 opacity-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700 shrink-0">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-base font-extrabold text-white">{j.nombre}</p>
                            <p className="text-xs text-zinc-300 font-medium">
                              {totalJ < 5 ? 'Calibrando' : `Cat. ${catJ.id}`} · <span className="text-emerald-400 font-black">{j.elo || 1000} Pts</span>
                            </p>
                          </div>
                        </div>

                        {dentroVentana ? (
                          <button
                            onClick={() => setChallengeTargetModal(j)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
                          >
                            <Swords className="w-4 h-4" /> Retar
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
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
            4. PESTAÑA: DIRECTORIO UNIFICADO ("CLUBES & ENTRENADORES")
        ====================================================================== */}
        {tab === 'clubs' && (
          <div className="space-y-4">
            <div className="bg-[#181B22] p-5 rounded-3xl border border-zinc-800 text-center space-y-3 shadow-xl">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E06D44] block">
                Directorio Oficial
              </span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                Clubes & Entrenadores
              </h2>

              <div className="grid grid-cols-2 gap-2 bg-[#111318] p-1.5 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setCanchasSubTab('clubes')}
                  className={`py-2.5 rounded-xl text-xs font-black transition ${
                    canchasSubTab === 'clubes' ? 'bg-emerald-500 text-zinc-950 shadow' : 'text-zinc-300'
                  }`}
                >
                  🏟️ Canchas & Clubes ({sedesVisibles.length})
                </button>
                <button
                  onClick={() => setCanchasSubTab('profesores')}
                  className={`py-2.5 rounded-xl text-xs font-black transition ${
                    canchasSubTab === 'profesores' ? 'bg-emerald-500 text-zinc-950 shadow' : 'text-zinc-300'
                  }`}
                >
                  🎓 Profesores ({profesoresVisibles.length})
                </button>
              </div>
            </div>

            {canchasSubTab === 'clubes' ? (
              <div className="space-y-4">
                {sedesVisibles.map((c, idx) => {
                  const infoClima = climaSedes[c.nombre] || { estado: 'Cancha Seca · Óptima', detalle: '19°C · Soleado', hora: 'Hoy', reportadoPor: 'Comité' };
                  const isRain = infoClima.estado.includes('Lluvia') || infoClima.estado.includes('Pesada');

                  return (
                    <div key={idx} className="bg-[#181B22] rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
                      <div className="relative h-44 w-full bg-zinc-900">
                        <img src={c.img} alt={c.nombre} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-black/30 to-transparent"></div>
                        <span className="absolute top-3 left-3 bg-zinc-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                          ★ {c.sponsorBadge}
                        </span>
                        <div className="absolute bottom-3 left-4 right-4">
                          <h4 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                            {c.nombre}
                          </h4>
                          <span className="text-xs text-emerald-400 font-extrabold">{c.zona} · {c.canchas}</span>
                        </div>
                      </div>

                      <div className="p-5 space-y-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {c.servicios.map((srv, sIdx) => (
                            <span key={sIdx} className="text-xs font-semibold bg-[#111318] text-zinc-200 border border-zinc-800 px-2.5 py-1 rounded-lg">
                              {srv}
                            </span>
                          ))}
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl text-xs">
                          <span className="font-black text-emerald-400 block uppercase text-[10px]">
                            🎁 Beneficio Socio Matchpoint:
                          </span>
                          <p className="text-zinc-200 font-medium mt-0.5">{c.beneficioMatchpoint}</p>
                        </div>

                        <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                          <div>
                            <span className="text-[11px] uppercase font-bold text-zinc-400 block">
                              Estado de Pista · {infoClima.hora} hrs
                            </span>
                            <p className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                              {isRain ? <CloudRain className="w-4 h-4 text-rose-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                              {infoClima.estado}
                            </p>
                            <span className="text-xs text-zinc-300 block mt-0.5">
                              {infoClima.detalle} · <strong className="text-emerald-400">Por: {infoClima.reportadoPor}</strong>
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setWeatherModalClub(c.nombre);
                              setWeatherEstadoInput(infoClima.estado);
                              setWeatherDetalleInput(infoClima.detalle || '19°C · Sin viento');
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-xs font-extrabold text-emerald-400 px-3 py-2.5 rounded-xl border border-zinc-700 shrink-0"
                          >
                            Actualizar
                          </button>
                        </div>

                        <a
                          href={`https://wa.me/51${c.tel}?text=Hola,%20soy%20jugador%20de%20MATCHPOINT%20y%20deseo%20consultar%20disponibilidad%20de%20cancha%20en%20${encodeURIComponent(c.nombre)}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Phone className="w-4 h-4" /> Consultar Disponibilidad (WhatsApp)
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3.5">
                {profesoresVisibles.map((prof) => (
                  <div key={prof.id} className="bg-[#181B22] border border-zinc-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-emerald-400 overflow-hidden flex items-center justify-center shrink-0">
                        {prof.foto ? (
                          <img src={prof.foto} alt={prof.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Award className="w-8 h-8 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                          ★ {prof.destacado}
                        </span>
                        <h4 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white mt-1">
                          {prof.nombre}
                        </h4>
                        <p className="text-xs text-zinc-300 font-medium">{prof.especialidad}</p>
                      </div>
                    </div>

                    <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800 space-y-1 text-xs">
                      <p className="text-zinc-200"><strong className="text-zinc-400">Niveles:</strong> {prof.niveles}</p>
                      <p className="text-zinc-200"><strong className="text-zinc-400">Sedes:</strong> {prof.sede}</p>
                      <p className="text-emerald-400 font-black text-sm pt-1">Tarifa: {prof.tarifa}</p>
                    </div>

                    <a
                      href={`https://wa.me/51${prof.tel.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(prof.nombre)},%20vi%20tu%20ficha%20oficial%20en%20MATCHPOINT%20y%20quisiera%20reservar%20una%20clase%20de%20tenis.`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md"
                    >
                      <Phone className="w-4 h-4" /> Reservar Clase por WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            5. PESTAÑA: TORNEOS (CLIC PARA VER INSCRITOS Y CUPOS DISPONIBLES)
        ====================================================================== */}
        {tab === 'torneos' && (
          <div className="space-y-4">
            <div className="bg-[#181B22] p-5 rounded-3xl border border-zinc-800 text-center space-y-1 shadow-xl">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E06D44] block">
                Calendario Oficial Bimestral
              </span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                Torneos por Categoría
              </h2>
              <p className="text-xs text-zinc-300 font-medium">
                Toca cualquier cuadro para ver la <strong>lista de inscritos</strong> y los cupos disponibles.
              </p>
            </div>

            {torneosData.map((t) => {
              const inscritosCount = t.participantes.length;
              const cumpleMinimo = inscritosCount >= t.min;
              const cuposLibres = Math.max(0, t.maxCupos - inscritosCount);
              const porcentajeCupo = Math.min(100, Math.round((inscritosCount / t.maxCupos) * 100));

              return (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTorneoModal(t)}
                  className="bg-[#181B22] rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl cursor-pointer transition"
                >
                  <div className="relative h-36 w-full bg-zinc-900">
                    <img src={t.img} alt={t.titulo} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-[#181B22]/40 to-transparent"></div>
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                      <span className={`text-[11px] uppercase font-black px-3 py-1 rounded-full border backdrop-blur-md ${
                        cumpleMinimo 
                          ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50' 
                          : 'text-amber-300 bg-amber-950/80 border-amber-500/50'
                      }`}>
                        {cumpleMinimo ? '✔ Cuadro Confirmado (+8)' : `⏳ Faltan ${t.min - inscritosCount} para abrir`}
                      </span>
                      <span className="bg-zinc-950/85 text-white font-black text-xs px-3 py-1 rounded-full border border-zinc-700">
                        Cat. {t.cat}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-4 right-4 flex items-center gap-2.5">
                      <SvgTrophy className="w-8 h-8 shrink-0" />
                      <div>
                        <h4 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white leading-tight">
                          {t.titulo}
                        </h4>
                        <p className="text-xs text-zinc-300 font-medium">{t.subtitulo}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3.5">
                    <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800">
                      <div className="flex justify-between text-xs font-extrabold mb-1.5">
                        <span className="text-white flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-emerald-400" /> {inscritosCount} de {t.maxCupos} inscritos
                        </span>
                        <span className="text-[#E06D44]">Quedan {cuposLibres} cupos libres</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${cumpleMinimo ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          style={{ width: `${porcentajeCupo}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-semibold">
                        📍 {t.sede} · {t.fecha}
                      </span>
                      <span className="text-emerald-400 font-black">S/ {t.precio}.00</span>
                    </div>

                    <button 
                      type="button"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Users className="w-4 h-4" /> Ver los {inscritosCount} Inscritos e Inscribirme
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================
          MODAL: PERFIL COMPLETO DE JUGADOR AL TOCAR EN EL RANKING (IDÉNTICO A MI PERFIL)
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
        const { myWinsH2H, rivalWinsH2H } = getHeadToHead(selectedPlayerModal);

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative max-h-[92vh] overflow-y-auto">
              {/* Banner idéntico a Mi Perfil */}
              <div className="relative h-28 bg-gradient-to-r from-[#2A1812] via-[#1B222C] to-[#122620] p-4 flex justify-between items-start">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border backdrop-blur-md ${
                  !pCalibrated 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                }`}>
                  {!pCalibrated ? `🔒 Calibrando (${pTotal}/5)` : `✔ Oficial · Puesto #${pRankIdx + 1}`}
                </span>

                <div className="flex items-center gap-2">
                  {pStreak >= 1 && (
                    <div className="inline-flex items-center gap-1.5 bg-zinc-950/80 border border-orange-500/50 px-3 py-1 rounded-full">
                      <SvgFlame className="w-4 h-4" />
                      <span className="text-xs font-black text-orange-300">{pStreak} en racha</span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedPlayerModal(null)}
                    className="bg-zinc-950/80 text-zinc-300 hover:text-white p-1.5 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 text-center -mt-14 relative">
                <div className={`w-28 h-28 mx-auto rounded-full bg-zinc-800 p-1 mb-3 overflow-hidden flex items-center justify-center ${getAvatarHaloClass(selectedPlayerModal, pRankIdx)}`}>
                  {selectedPlayerModal.foto_url ? (
                    <img src={selectedPlayerModal.foto_url} alt={selectedPlayerModal.nombre} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-zinc-400" />
                  )}
                </div>

                {pRankIdx === 0 && pCalibrated && (
                  <div className="mb-1.5 inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/50 text-amber-300 px-3 py-0.5 rounded-full text-[11px] font-black uppercase">
                    <Crown className="w-3.5 h-3.5" /> Campeón Vigente
                  </div>
                )}

                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                  {selectedPlayerModal.nombre}
                </h3>
                <p className="text-sm text-zinc-300 font-semibold mt-0.5">
                  {selectedPlayerModal.club || 'Independiente'} · {selectedPlayerModal.mano || 'Diestro'}
                </p>

                {!pCalibrated ? (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-zinc-900 text-amber-300 border border-amber-500/40">
                    <Lock className="w-3.5 h-3.5" /> Nivel Oculto hasta jugar 5 partidos
                  </div>
                ) : (
                  <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-xs font-extrabold border ${pCatInfo.color}`}>
                    <SvgTrophy className="w-4 h-4" /> {pCatInfo.nombre}
                  </div>
                )}

                {/* BARRA CARA A CARA (HEAD-TO-HEAD) */}
                {myPlayer && myPlayer.id !== selectedPlayerModal.id && (
                  <div className="mt-4 bg-[#12141A] border border-zinc-800 px-4 py-2.5 rounded-2xl flex justify-between items-center text-xs">
                    <span className="font-black text-emerald-400">TÚ: {myWinsH2H}</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Historial Cara a Cara</span>
                    <span className="font-black text-[#E06D44]">{selectedPlayerModal.nombre.split(' ')[0].toUpperCase()}: {rivalWinsH2H}</span>
                  </div>
                )}

                {/* TARJETAS GRANDES IDÉNTICAS A MI PERFIL */}
                <div className={`grid ${pStreak >= 1 ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 mt-4`}>
                  <div className="bg-[#12141A] p-3.5 rounded-2xl border border-zinc-800 flex flex-col items-center">
                    <SvgTrophy className="w-6 h-6 mb-1" />
                    <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-emerald-400">
                      {selectedPlayerModal.elo || 1000}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">Puntos Oficiales</span>
                  </div>

                  {pStreak >= 1 && (
                    <div className="bg-[#12141A] p-3.5 rounded-2xl border border-orange-500/30 flex flex-col items-center">
                      <SvgFlame className="w-6 h-6 mb-1" />
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-orange-400">
                        {pStreak}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">Racha Activa</span>
                    </div>
                  )}

                  <div className="bg-[#12141A] p-3.5 rounded-2xl border border-zinc-800 flex flex-col items-center">
                    <Award className="w-6 h-6 text-sky-400 mb-1" />
                    <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-sky-300">
                      {pWinRate}%
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">Efectividad</span>
                  </div>
                </div>

                {/* BARRA DE RÉCORD COMPLETA */}
                <div className="mt-4 bg-[#12141A] p-4 rounded-2xl border border-zinc-800 text-left space-y-2">
                  <div className="flex justify-between items-center text-sm font-extrabold">
                    <span className="text-emerald-400">✔ {pWins} Ganados</span>
                    <span className="text-zinc-400 text-xs">{pTotal} Jugados</span>
                    <span className="text-rose-400">{pLosses} Perdidos ✕</span>
                  </div>
                  <div className="w-full h-3 bg-rose-950 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-400"
                      style={{ width: `${pTotal > 0 ? pWinRate : 50}%` }}
                    ></div>
                  </div>
                </div>

                {(!myPlayer || myPlayer.id !== selectedPlayerModal.id) && (
                  <div className="mt-5">
                    {Math.abs(((myPlayer?.elo || 1000) - (selectedPlayerModal.elo || 1000))) <= 1200 ? (
                      <button
                        onClick={() => {
                          const target = selectedPlayerModal;
                          setSelectedPlayerModal(null);
                          setChallengeTargetModal(target);
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Swords className="w-4 h-4" /> Lanzar Desafío Oficial
                      </button>
                    ) : (
                      <div className="bg-[#111318] border border-zinc-800 text-zinc-400 text-xs font-bold py-3.5 rounded-2xl">
                        Fuera de tu rango reglamentario de reto (±1,200 Puntos)
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
          MODAL: LANZAR DESAFÍO CON SEDE PERSONALIZADA ("OTRA CANCHA")
      ======================================================================== */}
      {challengeTargetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-emerald-400" /> Lanzar Desafío Oficial
              </h3>
              <button onClick={() => setChallengeTargetModal(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmarNuevoReto} className="space-y-3.5">
              <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Rival Seleccionado</span>
                <p className="text-base font-black text-white">{challengeTargetModal.nombre}</p>
                <span className="text-xs text-zinc-400">{challengeTargetModal.elo || 1000} Puntos Oficiales</span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Cancha o Sede del Partido</label>
                <select
                  value={challengeSede}
                  onChange={(e) => setChallengeSede(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white font-semibold"
                >
                  {sedesVisibles.map((s, i) => (
                    <option key={i} value={s.nombre}>{s.nombre}</option>
                  ))}
                  <option value="OTRA_SEDE">📍 Otra cancha / Sede personalizada (Escribir...)</option>
                </select>
              </div>

              {challengeSede === 'OTRA_SEDE' && (
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Escribe el nombre o lugar de la cancha *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cancha Municipal / Condominio Los Sauces"
                    value={customSedeText}
                    onChange={(e) => setCustomSedeText(e.target.value)}
                    className="w-full bg-[#111318] border border-amber-500/50 rounded-xl px-3 py-3 text-xs text-white"
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
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs shadow-lg">
                Enviar Invitación de Partido
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: SALÓN DE LA FAMA E INSIGNIA CAMPEÓN VIGENTE (CANDADO 5 PARTIDOS)
      ======================================================================== */}
      {showHallOfFameModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                  Salón de la Fama
                </h3>
              </div>
              <button onClick={() => setShowHallOfFameModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Regla de Mérito para Trofeos y Premios de Temporada */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs space-y-1">
              <span className="font-black text-amber-300 uppercase block">🏆 Regla de Mérito para Premios de Temporada</span>
              <p className="text-zinc-200 leading-relaxed">
                Para coronarse <strong>Campeón Vigente</strong> y recibir el trofeo oficial al cierre de temporada, el jugador debe ocupar el puesto #1 de su categoría habiendo completado un <strong>mínimo de 5 partidos oficiales</strong>. Si una división tiene menos partidos, se define mediante un Playoff presencial.
              </p>
            </div>

            {SALON_DE_LA_FAMA_HISTORICO.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                  {item.temporada} (Registro Oficial Cerrado)
                </span>
                <div className="space-y-2">
                  {item.campeones.map((c, cIdx) => (
                    <div key={cIdx} className="bg-[#111318] border border-zinc-800 px-3.5 py-2.5 rounded-2xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <SvgMedal rank={1} className="w-7 h-7 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-400 block">{c.division}</span>
                          <p className="font-extrabold text-white text-sm">{c.nombre}</p>
                          <span className="text-[11px] text-zinc-400">{c.club}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-400">{c.record}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: REGLAMENTO OFICIAL Y TÉRMINOS (SIN REVELAR FÓRMULAS INTERNAS)
      ======================================================================== */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[88vh]">
            <div className="flex justify-between items-center">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" /> Reglamento y Sistema del Circuito
              </h3>
              <button onClick={() => setShowRulesModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800">
                <span className="font-black text-emerald-400 block uppercase mb-1">1. Cómo Subes o Bajas de Nivel</span>
                Vencer a un jugador con mayor puntaje te otorga una bonificación mayor de puntos. Además, ganar con un marcador contundente en sets suma un mérito adicional frente a un marcador ajustado.
              </div>
              <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800">
                <span className="font-black text-amber-300 block uppercase mb-1">2. Fase de Calibración (Primeros 5 Partidos)</span>
                Todo nuevo jugador mantiene su categoría protegida durante sus primeros 5 partidos oficiales mientras el sistema ajusta su nivel real en cancha.
              </div>
              <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800">
                <span className="font-black text-orange-400 block uppercase mb-1">3. Premio a la Constancia y Racha</span>
                Ambos jugadores reciben puntos fijos de asistencia por cada partido completado. Encadenar 3 o más victorias seguidas activa el bono de racha y descuentos en la Tienda Oficial.
              </div>
              <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800">
                <span className="font-black text-sky-400 block uppercase mb-1">4. Juego Limpio y Divisiones (+40 / Damas)</span>
                Solo se computan hasta 2 partidos por semana contra un mismo rival. La división Senior +40 es exclusiva para mayores de 40 años verificados.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: PORTAL PRIVADO "COACH PRO" (GESTIÓN DE ACADEMIAS Y ALUMNOS B2B)
      ======================================================================== */}
      {showCoachProModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 block">Herramienta Exclusiva Entrenadores</span>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-black text-white">
                    Portal Privado Coach Pro
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
                    alert('Código de Entrenador incorrecto (Usa 7777 o 1234 para demostración).');
                  }
                }}
                className="space-y-3"
              >
                <p className="text-xs text-zinc-300">
                  Acceso exclusivo para profesores afiliados a MATCHPOINT para controlar sus grupos, horarios, asistencias y mensualidades:
                </p>
                <input
                  type="password"
                  placeholder="Código Coach Pro (7777)"
                  value={coachPinInput}
                  onChange={(e) => setCoachPinInput(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-3 text-center text-lg tracking-widest text-emerald-400 font-mono"
                />
                <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-xl text-xs">
                  Abrir Mi Academia (Código: 7777)
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2.5 bg-[#111318] p-3.5 rounded-2xl border border-zinc-800 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Alumnos Activos</span>
                    <span className="text-xl font-black text-emerald-400">{coachAlumnos.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Pagos al Día</span>
                    <span className="text-xl font-black text-amber-300">
                      {coachAlumnos.filter(a => a.estadoPago === 'Pagado').length} / {coachAlumnos.length}
                    </span>
                  </div>
                </div>

                {/* Lista de Alumnos y Control de Mensualidades / Asistencia */}
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {coachAlumnos.map(al => (
                    <div key={al.id} className="bg-[#111318] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-black text-white text-sm">{al.nombre}</p>
                        <p className="text-[11px] text-zinc-400">{al.grupo}</p>
                        <span className="text-[11px] text-emerald-400 font-bold">Asistencia: {al.asistencias} · {al.monto}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nuevos = coachAlumnos.map(x => x.id === al.id ? { ...x, estadoPago: x.estadoPago === 'Pagado' ? 'Pendiente' : 'Pagado' } : x);
                          setCoachAlumnos(nuevos);
                          localStorage.setItem('mp_coach_alumnos', JSON.stringify(nuevos));
                        }}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] ${
                          al.estadoPago === 'Pagado'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {al.estadoPago}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Agregar Nuevo Alumno a la Academia */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newAlumnoNombre.trim()) return;
                    const nuevo = {
                      id: Date.now(),
                      nombre: newAlumnoNombre.trim(),
                      grupo: newAlumnoGrupo,
                      asistencias: '1/8 clases',
                      estadoPago: 'Pagado',
                      monto: newAlumnoMonto
                    };
                    const lista = [nuevo, ...coachAlumnos];
                    setCoachAlumnos(lista);
                    localStorage.setItem('mp_coach_alumnos', JSON.stringify(lista));
                    setNewAlumnoNombre('');
                  }}
                  className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800 space-y-2"
                >
                  <span className="text-[10px] font-black uppercase text-emerald-400 block">+ Inscribir Alumno en mi Academia</span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del Alumno"
                    value={newAlumnoNombre}
                    onChange={(e) => setNewAlumnoNombre(e.target.value)}
                    className="w-full bg-[#181B22] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newAlumnoGrupo}
                      onChange={(e) => setNewAlumnoGrupo(e.target.value)}
                      className="w-full bg-[#181B22] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newAlumnoMonto}
                      onChange={(e) => setNewAlumnoMonto(e.target.value)}
                      className="w-full bg-[#181B22] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-2.5 rounded-xl text-xs">
                    Guardar Alumno en mi Padrón
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: CARNET DIGITAL DE SOCIO OFICIAL MATCHPOINT
      ======================================================================== */}
      {showMemberPassModal && myPlayer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1E2430] to-[#12151C] border-2 border-emerald-500/60 w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center space-y-4 relative">
            <button onClick={() => setShowMemberPassModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 block">
              Pase Oficial Verificado
            </span>
            <div className="w-20 h-20 mx-auto rounded-full bg-zinc-800 border-2 border-emerald-400 overflow-hidden flex items-center justify-center">
              {myPlayer.foto_url ? (
                <img src={myPlayer.foto_url} alt={myPlayer.nombre} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-zinc-400" />
              )}
            </div>
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">{myPlayer.nombre}</h3>
              <p className="text-xs text-emerald-400 font-bold">{myPlayer.club || 'Socio Oficial'}</p>
            </div>
            <div className="bg-[#111318] p-4 rounded-2xl border border-zinc-800">
              <QrCode className="w-20 h-20 mx-auto text-white" />
              <span className="text-[11px] font-mono text-zinc-400 block mt-2">ID SOCIO #{myPlayer.id || '001'}</span>
            </div>
            <p className="text-[11px] text-zinc-300">
              Presenta este carnet en los Clubes Aliados y en el Taller de Encordado para aplicar tus beneficios activos.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: LISTA DE INSCRITOS EN TORNEO Y CUPOS DISPONIBLES
      ======================================================================== */}
      {selectedTorneoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                  Categoría {selectedTorneoModal.cat} · Quórum Mínimo {selectedTorneoModal.min}
                </span>
                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                  {selectedTorneoModal.titulo}
                </h3>
              </div>
              <button onClick={() => setSelectedTorneoModal(null)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 bg-[#111318] p-3.5 rounded-2xl border border-zinc-800 text-center">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 block">Jugadores Inscritos</span>
                <span className="text-xl font-black text-emerald-400">{selectedTorneoModal.participantes.length}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-zinc-400 block">Cupos Disponibles</span>
                <span className="text-xl font-black text-amber-400">
                  {Math.max(0, selectedTorneoModal.maxCupos - selectedTorneoModal.participantes.length)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 block mb-2">
                Lista Oficial de Inscritos ({selectedTorneoModal.participantes.length})
              </span>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {selectedTorneoModal.participantes.map((p, idx) => (
                  <div key={idx} className="bg-[#111318] border border-zinc-800 px-3.5 py-2.5 rounded-xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-emerald-400">#{idx + 1}</span>
                      <div>
                        <p className="font-extrabold text-white">{p.nombre}</p>
                        <span className="text-[11px] text-zinc-400">{p.club}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-zinc-300">{p.pts} Pts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 text-center space-y-2">
              <QrCode className="w-12 h-12 mx-auto text-emerald-400" />
              <p className="text-xs font-black text-white">Inscripción Oficial: S/ {selectedTorneoModal.precio}.00 (Yape/Plin: 964-000000)</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleInscribirEnTorneo(selectedTorneoModal)}
                className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-extrabold py-3 rounded-2xl text-xs border border-amber-500/30"
              >
                + Pre-inscribirme
              </button>
              <a
                href={`https://wa.me/51964000000?text=Hola,%20envío%20mi%20comprobante%20de%20S/%20${selectedTorneoModal.precio}%20para%20inscribirme%20en%20${encodeURIComponent(selectedTorneoModal.titulo)}.`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" /> Enviar Comprobante
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL TÉCNICO DE CLIMA
      ======================================================================== */}
      {weatherModalClub && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400">Estado de las Canchas</span>
                <h3 className="text-lg font-black text-white">{weatherModalClub}</h3>
              </div>
              <button onClick={() => setWeatherModalClub(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarClimaModal} className="space-y-3.5">
              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-2">Selecciona la Condición Actual:</label>
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
                          ? 'bg-emerald-500/20 border-emerald-400 text-white' 
                          : 'bg-[#111318] border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span>{est}</span>
                      {weatherEstadoInput === est && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-1">Temperatura / Detalle:</label>
                <input
                  type="text"
                  value={weatherDetalleInput}
                  onChange={(e) => setWeatherDetalleInput(e.target.value)}
                  placeholder="Ej. 19°C · Soleado sin viento"
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs">
                Publicar Reporte de Cancha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: TIENDA OFICIAL & TALLER DE ENCORDADO
      ======================================================================== */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-[#E06D44] tracking-widest">Matchpoint Pro-Shop</span>
                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                  Tienda & Taller de Encordado
                </h3>
              </div>
              <button onClick={() => setShowStoreModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-orange-950/60 to-[#12141A] border border-orange-500/40 p-3.5 rounded-2xl flex items-center gap-3">
              <SvgFlame className="w-8 h-8 shrink-0" />
              <div className="text-xs">
                <span className="font-black text-orange-300 block">
                  {myStreak >= 3 ? `¡Descuento Especial Activo por tu Racha de ${myStreak}!` : 'Beneficio por Racha de Victorias'}
                </span>
                <span className="text-zinc-300">
                  Al alcanzar 3 triunfos seguidos accedes al precio preferencial en encordados y accesorios.
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {PRODUCTOS_TIENDA.map(prod => (
                <div key={prod.id} className="bg-[#111318] border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400">{prod.tipo} · {prod.badge}</span>
                    <h4 className="text-sm font-black text-white mt-0.5">{prod.nombre}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{prod.desc}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80">
                    <div>
                      <span className="text-xs text-zinc-400 line-through mr-2">S/ {prod.precio}.00</span>
                      <span className="text-sm font-black text-emerald-400">Precio Racha: S/ {prod.precioRacha}.00</span>
                    </div>
                    <a
                      href={`https://wa.me/51964000000?text=${encodeURIComponent(`Hola MATCHPOINT, quiero solicitar: ${prod.nombre} (S/ ${myStreak >= 3 ? prod.precioRacha : prod.precio}).`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-500 text-zinc-950 font-black px-3.5 py-2 rounded-xl text-xs"
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

      {/* ========================================================================
          MODAL: TABLA DE NIVELES (EN RANKING)
      ======================================================================== */}
      {showLevelsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Escala Oficial de Categorías</h3>
              <button onClick={() => setShowLevelsModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {ESCALA_CATEGORIAS.map(c => (
                <div key={c.id} className="bg-[#111318] border border-zinc-800 px-3.5 py-2.5 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-extrabold text-white">{c.nombre}</span>
                  <span className="font-mono font-bold text-emerald-400">{c.min} – {c.max} Pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          POP-UP AUTOMÁTICO DE RETO O VALIDACIÓN DE MARCADOR
      ======================================================================== */}
      {pendingPopupAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border-2 border-emerald-500 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <Bell className="w-7 h-7 animate-bounce" />
            </div>
            {pendingPopupAlert.tipo === 'reto' ? (
              <>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                  ¡Invitación de Partido Recibida!
                </span>
                <h3 className="text-xl font-black text-white">
                  {pendingPopupAlert.data.jugador1} te ha retado
                </h3>
                <p className="text-xs text-zinc-300">
                  📍 Cancha propuesta: <strong>{pendingPopupAlert.data.sede}</strong><br />
                  📅 Horario: <strong>{pendingPopupAlert.data.fecha}</strong>
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => handleAceptarRetoEntrante(pendingPopupAlert.data.id)}
                    className="bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-xs"
                  >
                    ✔ Aceptar Partido
                  </button>
                  <button
                    onClick={() => setPendingPopupAlert(null)}
                    className="bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl text-xs"
                  >
                    Ver luego
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">
                  Confirmación Oficial de Resultado
                </span>
                <h3 className="text-lg font-black text-white">
                  Verificar Marcador del Partido
                </h3>
                <p className="text-xs text-zinc-300">
                  <strong>{pendingPopupAlert.data.ganadorNombre}</strong> registró victoria frente a <strong>{pendingPopupAlert.data.perdedorNombre}</strong> por <strong>{pendingPopupAlert.data.score}</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      const nuevas = validacionesPendientes.map(v => v.id === pendingPopupAlert.data.id ? { ...v, estado: 'Confirmado' } : v);
                      setValidacionesPendientes(nuevas);
                      localStorage.setItem('mp_validaciones_v5', JSON.stringify(nuevas));
                      broadcastLiveUpdate(null, null, nuevas);
                      setPendingPopupAlert(null);
                    }}
                    className="bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-xs"
                  >
                    ✔ Es Correcto
                  </button>
                  <button
                    onClick={() => {
                      const nuevas = validacionesPendientes.map(v => v.id === pendingPopupAlert.data.id ? { ...v, estado: 'En Disputa' } : v);
                      setValidacionesPendientes(nuevas);
                      localStorage.setItem('mp_validaciones_v5', JSON.stringify(nuevas));
                      broadcastLiveUpdate(null, null, nuevas);
                      setPendingPopupAlert(null);
                      alert('⚠️ El marcador fue enviado al Comité Deportivo para su revisión.');
                    }}
                    className="bg-rose-950 text-rose-300 border border-rose-800 font-bold py-3 rounded-xl text-xs"
                  >
                    Observación / Disputa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MENÚ DESPLEGABLE DE 3 RAYITAS (REGLAMENTO, COACH PRO, TIENDA Y ADMIN)
      ======================================================================== */}
      {showSideDrawer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
          <div className="bg-[#161920] border-r border-zinc-800 w-80 max-w-[85vw] h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <SvgTennisBall className="w-8 h-8" />
                  <div>
                    <h3 className="text-base font-black text-white leading-none">MATCHPOINT</h3>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Menú Oficial</span>
                  </div>
                </div>
                <button onClick={() => setShowSideDrawer(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#1E222B] border border-amber-500/30 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase">
                  <Gift className="w-4 h-4" /> Sorteo Mensual por Actividad
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Disputa <strong>4 partidos al mes</strong> para participar en el sorteo de tubos de pelotas y horas de cancha.
                </p>
                <span className="text-xs font-extrabold text-emerald-400 block pt-1">
                  Tu avance mensual: {myTotalMatches} / 4 partidos
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { setShowSideDrawer(false); setShowStoreModal(true); }}
                  className="w-full bg-[#111318] border border-[#E06D44]/40 p-3.5 rounded-2xl flex justify-between items-center text-xs font-extrabold text-[#F79D65]"
                >
                  <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Tienda & Taller de Encordado</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => { setShowSideDrawer(false); setShowHallOfFameModal(true); }}
                  className="w-full bg-[#111318] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold text-amber-300"
                >
                  <span className="flex items-center gap-2"><Crown className="w-4 h-4" /> Salón de la Fama y Campeones</span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                <button
                  onClick={() => { setShowSideDrawer(false); setShowRulesModal(true); }}
                  className="w-full bg-[#111318] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold text-zinc-200"
                >
                  <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-400" /> Reglamento y Términos</span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                <button
                  onClick={() => setHidePhonePublic(!hidePhonePublic)}
                  className="w-full bg-[#111318] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-zinc-200 font-bold">Privacidad de mi WhatsApp</span>
                  <span className="text-emerald-400 font-black">{hidePhonePublic ? 'Solo Rivales' : 'Público'}</span>
                </button>

                <button
                  onClick={() => { setShowSideDrawer(false); setShowCoachProModal(true); }}
                  className="w-full bg-[#111318] border border-emerald-500/30 p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold text-emerald-300"
                >
                  <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Portal Privado Coach Pro</span>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => { setShowSideDrawer(false); setShowAdminModal(true); }}
                  className="w-full bg-amber-500/15 border border-amber-500/40 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-amber-300 font-black flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Panel Administrador {disputasActivas.length > 0 && `(${disputasActivas.length} Disputas)`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>

            {myPlayer && (
              <button
                onClick={handleLogout}
                className="w-full bg-rose-950/60 border border-rose-800/60 text-rose-300 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 mt-6"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            )}
          </div>
          <div className="flex-1" onClick={() => setShowSideDrawer(false)}></div>
        </div>
      )}

      {/* ========================================================================
          MODAL: SUITE DE ADMINISTRACIÓN (INCLUYE BANDEJA DE DISPUTAS ACTIVA)
      ======================================================================== */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Shield className="w-5 h-5 text-emerald-400" /> Suite de Administración
              </h3>
              <button onClick={() => { setShowAdminModal(false); setIsAdminAuth(false); }} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isAdminAuth ? (
              <form onSubmit={(e) => { e.preventDefault(); adminPin === '1234' ? setIsAdminAuth(true) : alert('PIN Incorrecto (1234)'); }} className="space-y-3">
                <input
                  type="password"
                  placeholder="PIN Administrador (1234)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-3 text-center text-lg tracking-widest text-emerald-400 font-mono"
                />
                <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-xl text-xs">
                  Ingresar al Panel Admin
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-xs">
                {/* 1. BANDEJA DE PARTIDOS EN DISPUTA (SOLUCIÓN AL BUG DETECTADO) */}
                <div className="bg-[#111318] p-4 rounded-2xl border border-rose-500/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase text-rose-400">
                      ⚖️ 1. Bandeja de Partidos en Disputa ({disputasActivas.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleSimulateDisputeForAdmin}
                      className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-1 rounded-lg font-bold"
                    >
                      + Simular Disputa
                    </button>
                  </div>

                  {disputasActivas.length === 0 ? (
                    <p className="text-zinc-400 text-center py-2">
                      No hay marcadores impugnados en este momento.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {disputasActivas.map(d => (
                        <div key={d.id} className="bg-[#181B22] border border-rose-500/40 p-3 rounded-xl space-y-2">
                          <div className="flex justify-between">
                            <span className="font-black text-white">{d.ganadorNombre} vs {d.perdedorNombre}</span>
                            <span className="font-mono text-amber-300 font-bold">{d.score}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Observado a las {d.fecha}. Elige una resolución oficial:
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdminResolveDispute(d, 'aprobar')}
                              className="bg-emerald-500 text-zinc-950 font-black py-1.5 rounded-lg text-[11px]"
                            >
                              ✔ Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminResolveDispute(d, 'editar')}
                              className="bg-amber-400 text-zinc-950 font-black py-1.5 rounded-lg text-[11px] flex items-center justify-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminResolveDispute(d, 'anular')}
                              className="bg-rose-950 text-rose-300 border border-rose-800 font-bold py-1.5 rounded-lg text-[11px]"
                            >
                              ✕ Anular
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. MODO SANDBOX DE PRUEBAS */}
                <div className="bg-[#111318] p-4 rounded-2xl border border-amber-500/40 space-y-2.5">
                  <span className="text-[11px] font-black uppercase text-amber-400 block">
                    🧪 2. Modo Sandbox (Cambiar de Jugador en 1 Clic)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pA = jugadores[0] || { id: 901, nombre: 'Mateo Samaniego', elo: 1340, victorias: 6, derrotas: 2 };
                        handleActivateSandboxUser(pA, `Vista: ${pA.nombre.split(' ')[0]}`);
                      }}
                      className="bg-amber-500/20 border border-amber-500/40 text-amber-200 font-black py-2.5 px-2 rounded-xl"
                    >
                      👤 Jugador 1 ({jugadores[0]?.nombre.split(' ')[0] || 'Test A'})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const pB = jugadores[1] || { id: 902, nombre: 'Alejandro Tovar', elo: 1450, victorias: 7, derrotas: 3 };
                        handleActivateSandboxUser(pB, `Vista: ${pB.nombre.split(' ')[0]}`);
                      }}
                      className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-black py-2.5 px-2 rounded-xl"
                    >
                      👤 Jugador 2 ({jugadores[1]?.nombre.split(' ')[0] || 'Test B'})
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateIncomingChallenge}
                    className="w-full bg-emerald-500 text-zinc-950 font-black py-2.5 rounded-xl"
                  >
                    ⚡ Simular Reto Entrante
                  </button>
                </div>

                {/* 3. RESPALDO HISTÓRICO EN GOOGLE DRIVE */}
                <div className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 space-y-2.5">
                  <span className="text-[11px] font-black uppercase text-emerald-400 block">
                    💾 3. Respaldo de Partidos ({historialPartidosCSV.length} registrados)
                  </span>
                  <button
                    type="button"
                    onClick={handleExportAndPurgeHistory}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Descargar Historial (.CSV para Google Drive)
                  </button>
                </div>

                {/* 4. INTERRUPTORES DE PATROCINADORES Y SEDES */}
                <div className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-black uppercase text-sky-400 block">
                    🎛️ 4. Activar / Ocultar Clubes y Profesores
                  </span>
                  {SEDES_CLUB_PRO.map(c => {
                    const activo = featureToggles.clubesActivos?.[c.nombre] !== false;
                    return (
                      <div key={c.id} className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                        <span className="text-zinc-200 font-semibold">{c.nombre}</span>
                        <button
                          type="button"
                          onClick={() => toggleClubVisibility(c.nombre)}
                          className={`px-3 py-1 rounded-lg font-black text-[11px] ${
                            activo ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {activo ? 'VISIBLE' : 'OCULTO'}
                        </button>
                      </div>
                    );
                  })}
                  {profesores.map(p => (
                    <div key={p.id} className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-200 font-semibold">{p.nombre}</span>
                      <button
                        type="button"
                        onClick={() => toggleProfesorVisibility(p.id)}
                        className={`px-3 py-1 rounded-lg font-black text-[11px] ${
                          p.activo !== false ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {p.activo !== false ? 'VISIBLE' : 'OCULTO'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* 5. CONTROL DE CUENTAS */}
                <div className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 space-y-2.5">
                  <span className="text-[11px] font-black uppercase text-emerald-400 block">
                    👥 5. Cuentas Registradas ({jugadores.length})
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar jugador..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full bg-[#181B22] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {jugadores
                      .filter(j => normalizeText(j.nombre).includes(normalizeText(adminSearch)))
                      .map(j => (
                        <div key={j.id} className="bg-[#181B22] px-3 py-2 rounded-xl flex justify-between items-center border border-zinc-800">
                          <div>
                            <p className="font-bold text-white">{j.nombre}</p>
                            <span className="text-[10px] text-zinc-400">{j.elo} Pts · {j.club}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleActivateSandboxUser(j, `Vista: ${j.nombre.split(' ')[0]}`)}
                              className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-[10px] font-black"
                            >
                              Probar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminDeletePlayer(j)}
                              className="p-1.5 bg-rose-950 text-rose-400 rounded-lg border border-rose-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 6. ALTA DE PROFESORES */}
                <form onSubmit={handleAdminAddProfesor} className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-black uppercase text-amber-400 block">
                    🎓 6. Agregar Profesor Oficial
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del Profesor"
                    value={newProfNombre}
                    onChange={(e) => setNewProfNombre(e.target.value)}
                    className="w-full bg-[#181B22] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Especialidad"
                    value={newProfEsp}
                    onChange={(e) => setNewProfEsp(e.target.value)}
                    className="w-full bg-[#181B22] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Tarifa (S/ 50 / h)"
                      value={newProfTarifa}
                      onChange={(e) => setNewProfTarifa(e.target.value)}
                      className="w-full bg-[#181B22] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp *"
                      value={newProfTel}
                      onChange={(e) => setNewProfTel(e.target.value)}
                      className="w-full bg-[#181B22] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-2.5 rounded-xl text-xs">
                    + Publicar Profesor
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MODALES DE AVISOS, CHAT, MARCADOR, LOGIN Y REGISTRO (CON EDAD Y RAMA)
      ======================================================================== */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" /> Avisos del Circuito
              </h3>
              <button onClick={() => setShowNotifModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {misRetos.map(r => (
                <div key={r.id} className="bg-[#111318] border border-zinc-800 p-3.5 rounded-2xl text-xs space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase">{r.estado}</span>
                  <p className="font-bold text-white">{r.jugador1} vs {r.jugador2}</p>
                  <p className="text-zinc-400">📍 {r.sede} · {r.fecha}</p>
                </div>
              ))}
              {validacionesPendientes.map(v => (
                <div key={v.id} className="bg-[#111318] border border-zinc-800 p-3.5 rounded-2xl text-xs space-y-1">
                  <span className="text-[10px] font-black text-amber-400 uppercase">Marcador · {v.estado}</span>
                  <p className="font-bold text-white">{v.ganadorNombre} venció a {v.perdedorNombre} ({v.score})</p>
                </div>
              ))}
              {misRetos.length === 0 && validacionesPendientes.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-6">No tienes avisos pendientes.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeChatReto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-black text-white">Coordinación del Partido</h3>
                <p className="text-[11px] text-emerald-400">{activeChatReto.jugador1} vs {activeChatReto.jugador2}</p>
              </div>
              <button onClick={() => setActiveChatReto(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#111318] p-3 rounded-2xl border border-zinc-800 h-52 overflow-y-auto space-y-2">
              {(activeChatReto.mensajes || []).map((m, i) => (
                <div key={i} className="bg-[#1E222B] p-2.5 rounded-xl text-xs">
                  <div className="flex justify-between text-[10px] text-emerald-400 font-bold">
                    <span>{m.autor}</span>
                    <span className="text-zinc-400">{m.hora}</span>
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
                className="flex-1 bg-[#111318] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white"
              />
              <button type="submit" className="bg-emerald-500 text-zinc-950 font-black px-4 rounded-xl text-xs">
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUBIR SCORE (LENGUAJE 100% DEPORTIVO: "CONFIRMAR MARCADOR OFICIAL") */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-emerald-400" /> Registrar Marcador Oficial
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
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
                />
                <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                  {calcularFactorDominio(score).label}
                </span>
              </div>

              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                required
                className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white font-bold"
              >
                <option value="">¿Quién ganó el encuentro?</option>
                {p1Id && <option value={p1Id}>{jugadores.find(j => j.id.toString() === p1Id)?.nombre}</option>}
                {p2Id && <option value={p2Id}>{jugadores.find(j => j.id.toString() === p2Id)?.nombre}</option>}
              </select>

              <button
                type="submit"
                disabled={calculatingMatch}
                className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs shadow-lg"
              >
                {calculatingMatch ? 'Registrando Resultado...' : 'Confirmar Marcador Oficial'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-white">
                {authMode === 'login' ? 'Acceso a tu Cuenta' : 'Registro Oficial'}
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAuth} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="tucorreo@ejemplo.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Escribe tu contraseña"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-3 pr-11 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={keepSession}
                  onChange={(e) => setKeepSession(e.target.checked)}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
                Mantener mi sesión abierta
              </label>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-sm"
              >
                {authLoading ? 'Verificando...' : (authMode === 'login' ? 'Entrar a MATCHPOINT' : 'Continuar al Perfil Deportivo')}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="w-full text-center text-xs text-emerald-400 font-bold pt-2"
              >
                {authMode === 'login' ? '¿Eres nuevo? Crea tu cuenta aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL REGISTRO: DATOS DE PERFILADO (+40 / DAMAS / MANO) + 4 PREGUNTAS DIRECTAS
      ======================================================================== */}
      {showProfileSetup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            {quizStep === 0 ? (
              <div className="space-y-3.5">
                <span className="text-[11px] font-black uppercase text-emerald-400">Paso 1 de 5 · Ficha del Tenista</span>
                <h3 className="text-xl font-black text-white">Completa tus Datos</h3>

                <div className="flex flex-col items-center py-1">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-[#111318] border-2 border-dashed border-emerald-400 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {isCompressing ? (
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    ) : fotoPreview ? (
                      <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-7 h-7 text-emerald-400" />
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <span className="text-[11px] text-zinc-400 mt-1">Foto de Perfil (Opcional)</span>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido *"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />

                {/* EDAD Y GÉNERO PARA VALIDAR +40 SENIOR Y DAMAS */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Edad (Habilita +40) *</label>
                    <input
                      type="number"
                      min="12"
                      max="90"
                      required
                      value={edad}
                      onChange={(e) => setEdad(e.target.value)}
                      className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Rama / División *</label>
                    <select
                      value={genero}
                      onChange={(e) => setGenero(e.target.value)}
                      className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
                    >
                      <option value="Varones">Varones</option>
                      <option value="Damas">Damas</option>
                    </select>
                  </div>
                </div>

                {/* MANO HÁBIL Y DISPONIBILIDAD */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Mano Hábil</label>
                    <select
                      value={mano}
                      onChange={(e) => setMano(e.target.value)}
                      className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
                    >
                      <option value="Diestro">Diestro (Derecha)</option>
                      <option value="Zurdo">Zurdo (Izquierda)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Horario Preferido</label>
                    <select
                      value={horarioPref}
                      onChange={(e) => setHorarioPref(e.target.value)}
                      className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
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
                  placeholder="Celular / WhatsApp *"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />

                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                >
                  {SEDES_CLUB_PRO.map((s, i) => (
                    <option key={i} value={s.nombre}>{s.nombre}</option>
                  ))}
                  <option value="Independiente">Independiente / Otra Cancha</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (!nombre.trim() || !telefono.trim()) return alert('Completa tu nombre y WhatsApp.');
                    setQuizStep(1);
                  }}
                  className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-sm"
                >
                  Siguiente: 4 Preguntas Rápidas ➔
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const card = FLASH_CARDS_4_OPCIONES[quizStep - 1];
                  const valorActual = respuestasLikert[quizStep - 1];
                  return (
                    <>
                      <span className="text-xs font-black uppercase text-emerald-400">Pregunta {quizStep} de 4</span>
                      <h3 className="text-xl font-black text-white">{card.titulo}</h3>
                      <p className="text-sm text-zinc-100 font-semibold">{card.pregunta}</p>
                      <div className="bg-[#111318] border border-zinc-800 p-3 rounded-2xl text-xs text-zinc-300">
                        {card.ejemplo}
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
                                ? 'bg-emerald-500/20 border-emerald-400 text-white'
                                : 'bg-[#111318] border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <span>{item.label}</span>
                            {valorActual === item.valor && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setQuizStep(quizStep - 1)}
                          className="w-1/3 bg-zinc-800 text-zinc-300 font-bold py-3.5 rounded-2xl text-xs"
                        >
                          Atrás
                        </button>
                        {quizStep < 4 ? (
                          <button
                            type="button"
                            onClick={() => setQuizStep(quizStep + 1)}
                            className="w-2/3 bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
                          >
                            Siguiente ➔
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={savingPlayer}
                            onClick={handleCompleteProfile}
                            className="w-2/3 bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
                          >
                            {savingPlayer ? 'Guardando...' : 'Finalizar Registro Oficial'}
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
          BARRA DE NAVEGACIÓN INFERIOR CON CÁPSULA FLUIDA ESTILO LIQUID
      ======================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#161920]/95 backdrop-blur-xl border-t border-zinc-800 flex justify-around items-center py-2 pb-5 px-2 z-40">
        <button 
          onClick={() => handleTabChange('perfil')} 
          className={`flex flex-col items-center text-xs w-16 py-1 rounded-2xl transition-all ${
            tab === 'perfil' ? 'bg-emerald-500/15 text-emerald-400 font-black' : 'text-zinc-400 font-semibold'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" /> Mi Perfil
        </button>

        <button 
          onClick={() => handleTabChange('ranking')} 
          className={`flex flex-col items-center text-xs w-16 py-1 rounded-2xl transition-all ${
            tab === 'ranking' ? 'bg-emerald-500/15 text-emerald-400 font-black' : 'text-zinc-400 font-semibold'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" /> Ranking
        </button>

        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => handleTabChange('match')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#111318] transition-all ${
              tab === 'match' ? 'bg-emerald-400 text-zinc-950 scale-105' : 'bg-emerald-500 text-zinc-950'
            }`}
          >
            <Swords className="w-6 h-6" />
          </button>
          <span className={`text-xs mt-1 font-black ${tab === 'match' ? 'text-emerald-400' : 'text-zinc-200'}`}>
            Retos
          </span>
        </div>

        <button 
          onClick={() => handleTabChange('clubs')} 
          className={`flex flex-col items-center text-xs w-16 py-1 rounded-2xl transition-all ${
            tab === 'clubs' ? 'bg-emerald-500/15 text-emerald-400 font-black' : 'text-zinc-400 font-semibold'
          }`}
        >
          <MapPin className="w-5 h-5 mb-0.5" /> Directorio
        </button>

        <button 
          onClick={() => handleTabChange('torneos')} 
          className={`flex flex-col items-center text-xs w-16 py-1 rounded-2xl transition-all ${
            tab === 'torneos' ? 'bg-emerald-500/15 text-emerald-400 font-black' : 'text-zinc-400 font-semibold'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" /> Torneos
        </button>
      </nav>
    </div>
  );
}
