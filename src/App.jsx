import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Swords, MapPin, User, X, Phone, Shield, 
  Calendar, QrCode, Lock, CloudRain, Sun, 
  LogOut, Camera, Loader2, Sparkles, Flame, 
  Clock, CheckCircle2, Users, Plus, ChevronRight, 
  Eye, EyeOff, Bell, Menu, Award, Trash2, 
  MessageSquare, Info, Gift, ShoppingBag, Sliders, 
  Download, RefreshCw, Check, AlertCircle
} from 'lucide-react';
import { supabase } from './supabaseClient';

// ============================================================================
// 1. ACTIVOS VECTORIALES SVG PREMIUM (CERO EMOJIS POBRES / DISEÑO ELABORADO)
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
// 2. COMPRESIÓN DE IMÁGENES EN CLIENTE (JPEG LIGERO PARA AHORRAR STORAGE)
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
          if (!blob) return reject(new Error('Error al comprimir'));
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
// 3. ESCALA DE CATEGORÍAS Y TARJETAS LIKERT DE CALIBRACIÓN
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

const FLASH_CARDS_LIKERT = [
  {
    paso: 1,
    titulo: 'Tu Saque o Servicio',
    pregunta: 'Cuando sacas para iniciar un punto, ¿qué tan seguro te sientes?',
    ejemplo: '💡 Guía: 1 es pasarla suave para no cometer doble falta; 5 es sacar fuerte con efecto y dirección.',
    escala: [
      { valor: 1, label: '1 · Recién aprendo a pasarla' },
      { valor: 2, label: '2 · Segundo saque suave por seguridad' },
      { valor: 3, label: '3 · Saque regular y constante' },
      { valor: 4, label: '4 · Saque profundo a las esquinas' },
      { valor: 5, label: '5 · Saque potente con efecto (Slice/Kick)' }
    ]
  },
  {
    paso: 2,
    titulo: 'Peloteo desde el Fondo',
    pregunta: 'Si peloteas seguido desde el fondo de la cancha, ¿cuántos tiros mantienes?',
    ejemplo: '💡 Guía: Cuenta cuántas veces seguidas pasas la red a ritmo normal sin tirarla afuera.',
    escala: [
      { valor: 1, label: '1 · De 1 a 3 tiros seguidos' },
      { valor: 2, label: '2 · De 4 a 6 tiros si viene cómoda' },
      { valor: 3, label: '3 · Más de 8 tiros cruzados con control' },
      { valor: 4, label: '4 · Peloteo firme y ataco bolas cortas' },
      { valor: 5, label: '5 · Domino el ritmo y peso de bola' }
    ]
  },
  {
    paso: 3,
    titulo: 'Defensa en Movimiento',
    pregunta: 'Cuando el rival te tira una pelota rápida a las esquinas, ¿cómo respondes?',
    ejemplo: '💡 Guía: 1 es no llegar a tiempo; 3 es devolver un globo alto; 5 es contraatacar en carrera.',
    escala: [
      { valor: 1, label: '1 · Me cuesta llegar y armar el golpe' },
      { valor: 2, label: '2 · Solo pongo la raqueta para bloquear' },
      { valor: 3, label: '3 · Tiro un globo alto para recuperar' },
      { valor: 4, label: '4 · Llego bien y devuelvo profundo' },
      { valor: 5, label: '5 · Contraataco con total control' }
    ]
  },
  {
    paso: 4,
    titulo: 'Experiencia en Partidos',
    pregunta: '¿Qué tanta experiencia tienes jugando sets completos con puntaje?',
    ejemplo: '💡 Guía: Tus primeros 5 partidos serán de Calibración y tu nivel estará oculto hasta terminarlos.',
    escala: [
      { valor: 1, label: '1 · Solo peloteo por diversión' },
      { valor: 2, label: '2 · Juego sets amistosos ocasionales' },
      { valor: 3, label: '3 · Juego partidos de club cada semana' },
      { valor: 4, label: '4 · He jugado torneos avanzando rondas' },
      { valor: 5, label: '5 · Juego finales abiertas o soy entrenador' }
    ]
  }
];

const calcularPuntosLikert = (respuestas) => {
  const pts = respuestas.reduce((a, b) => a + (b - 1), 0);
  if (pts <= 3) return { elo: 350 + pts * 45, cat: '5ª P' };
  if (pts <= 7) return { elo: 700 + (pts - 4) * 90, cat: '5ª B' };
  if (pts <= 11) return { elo: 1300 + (pts - 8) * 90, cat: '5ª A' };
  if (pts <= 14) return { elo: 2000 + (pts - 12) * 220, cat: '4ª' };
  return { elo: 2950 + (pts - 15) * 200, cat: '3ª' };
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
    if (total === 0) return { fd: 1.0, label: 'Resultado Estándar (x1.0)' };
    const margen = Math.abs(gA - gB) / total;
    if (margen >= 0.70) return { fd: 1.8, label: 'Dominio Contundente (x1.8)' };
    if (margen >= 0.40) return { fd: 1.35, label: 'Victoria Clara (x1.35)' };
    if (margen >= 0.18) return { fd: 1.0, label: 'Resultado Estándar (x1.0)' };
    return { fd: 0.5, label: 'Partido Muy Parejo (x0.5)' };
  } catch {
    return { fd: 1.0, label: 'Resultado Estándar (x1.0)' };
  }
};

// ============================================================================
// 4. DATOS DE CLUBES PRO, PROFESORES, TORNEOS Y TIENDA OFICIAL
// ============================================================================
const SEDES_CLUB_PRO = [
  {
    id: 'club-country',
    nombre: 'Country Club Huancayo',
    canchas: '3 Canchas de Arcilla Reglamentarias',
    zona: 'El Tambo',
    tel: '964123456',
    servicios: ['Iluminación Nocturna', 'Cafetería & Restaurante', 'Vestuarios', 'Estacionamiento'],
    beneficioMatchpoint: '15% de descuento en alquiler de cancha en horario valle (10:00 a 15:00) para miembros activos.',
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
    beneficioMatchpoint: '20% de descuento en tu primera clase de evaluación técnica al registrarte en la app.',
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
    especialidad: 'Alta Competencia, Biomecánica de Saque y Estrategia',
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
    especialidad: 'Iniciación para Adultos (40+), Consistencia y Técnica Base',
    niveles: 'Especialista en 5ª P, 5ª B y 5ª A',
    sede: 'Academia Romina Cutipa',
    tarifa: 'S/ 45 / hora individual · Grupal disponible',
    tel: '999555444',
    destacado: 'Directora de Academia Aliada',
    activo: true,
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
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
      { nombre: 'Luis Fernando Paz', club: 'Independiente', pts: 1850 },
      { nombre: 'Álvaro Breña', club: 'Country Club Huancayo', pts: 1820 }
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
    desc: 'Cuerdas Poliéster Control o Multifilamento Confort. Ajustamos la tensión exacta en libras según tu brazo.',
    precio: 35,
    precioRacha: 30,
    badge: 'Descuento por Racha 🔥',
    img: 'https://images.unsplash.com/photo-1617083934555-5fc3dc254752?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prod-overgrip',
    tipo: 'Accesorios Oficiales',
    nombre: 'Pack x3 Overgrips Matchpoint Pro Tacky',
    desc: 'Máxima absorción y agarre antideslizante para arcilla.',
    precio: 25,
    precioRacha: 20,
    badge: 'Alta Rotación',
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prod-antivib',
    tipo: 'Accesorios Oficiales',
    nombre: 'Antivibradores Oficiales Matchpoint (Par)',
    desc: 'Protege tu codo y muñeca reduciendo la vibración del encordado.',
    precio: 15,
    precioRacha: 12,
    badge: 'Edición Circuito',
    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prod-raqueta-semi',
    tipo: 'Seminuevos Certificados',
    nombre: 'Babolat Pure Drive 300g (Estado 9.5/10 · Revisada)',
    desc: 'Verificada sin fisuras por nuestros profesores aliados. Encordado nuevo incluido.',
    precio: 580,
    precioRacha: 550,
    badge: 'Garantía Matchpoint',
    img: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=600&q=80'
  }
];

export default function App() {
  // Splash Screen Cinemático sin recuadro
  const [showSplash, setShowSplash] = useState(true);

  // Navegación Principal
  const [tab, setTab] = useState('perfil');
  const [retosSubTab, setRetosSubTab] = useState('mis_retos');
  const [canchasSubTab, setCanchasSubTab] = useState('clubes');
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('Todas');

  // Usuario y Modo Sandbox
  const [currentUser, setCurrentUser] = useState(null);
  const [sandboxLabel, setSandboxLabel] = useState(null);
  const [keepSession, setKeepSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hidePhonePublic, setHidePhonePublic] = useState(false);

  // Modales Globales
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [showSeasonCalendarModal, setShowSeasonCalendarModal] = useState(false);
  const [pendingPopupAlert, setPendingPopupAlert] = useState(null);

  // Auth y Registro Likert
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [quizStep, setQuizStep] = useState(0);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [nombre, setNombre] = useState('');
  const [club, setClub] = useState('Country Club Huancayo');
  const [telefono, setTelefono] = useState('');
  const [respuestasLikert, setRespuestasLikert] = useState([3, 3, 3, 2]);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const fileInputRef = useRef(null);
  const profileAvatarInputRef = useRef(null);
  const realtimeChannelRef = useRef(null);

  // Modales de Juego, Clima y Torneos
  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);
  const [challengeTargetModal, setChallengeTargetModal] = useState(null);
  const [challengeSede, setChallengeSede] = useState('Country Club Huancayo');
  const [challengeFecha, setChallengeFecha] = useState('Sábado 16:00 hrs');
  const [activeChatReto, setActiveChatReto] = useState(null);
  const [chatMessageInput, setChatMessageInput] = useState('');

  // Modal Técnico de Clima (Sin toque accidental)
  const [weatherModalClub, setWeatherModalClub] = useState(null);
  const [weatherEstadoInput, setWeatherEstadoInput] = useState('Cancha Seca · Óptima');
  const [weatherDetalleInput, setWeatherDetalleInput] = useState('19°C · Sin viento');

  // Modal de Torneo con Lista de Inscritos
  const [torneosData, setTorneosData] = useState(() => {
    const saved = localStorage.getItem('mp_torneos_v4');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return TORNEOS_INICIALES;
  });
  const [selectedTorneoModal, setSelectedTorneoModal] = useState(null);

  // Admin Suite, Feature Toggles y Memoria
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
  const [simulateHighMemory, setSimulateHighMemory] = useState(false);

  // Feature Toggles (Activar / Desactivar Clubes, Profesores o Tienda sin perder datos)
  const [featureToggles, setFeatureToggles] = useState(() => {
    const saved = localStorage.getItem('mp_feature_toggles');
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

  // Subir Score (Exclusivo desde reto confirmado)
  const [activeRetoId, setActiveRetoId] = useState(null);
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [score, setScore] = useState('6-4, 6-3');
  const [winnerId, setWinnerId] = useState('');
  const [calculatingMatch, setCalculatingMatch] = useState(false);

  // Profesores
  const [profesores, setProfesores] = useState(() => {
    const saved = localStorage.getItem('mp_profesores_v4');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return PROFESORES_INICIALES;
  });

  // Retos en Vivo
  const [retosProgramados, setRetosProgramados] = useState(() => {
    const saved = localStorage.getItem('mp_retos_v4');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [
      { 
        id: 101, 
        jugador1: 'Mateo Samaniego', 
        jugador2: 'Alejandro Tovar', 
        sede: 'Country Club Huancayo', 
        fecha: 'Sábado 17:00 hrs', 
        cat: 'Duelo Oficial por Puntos', 
        estado: 'Programado',
        mensajes: [{ autor: 'Mateo', texto: '¡Listo para el sábado! Llevo tubo de pelotas nuevas.', hora: '14:20' }]
      },
      { 
        id: 102, 
        jugador1: 'Diego Cárdenas', 
        jugador2: 'Carlos Mendoza', 
        sede: 'Academia Romina Cutipa', 
        fecha: 'Domingo 10:00 hrs', 
        cat: '3ª Categoría', 
        estado: 'Programado',
        mensajes: [{ autor: 'Diego', texto: 'Cancha 1 reservada a las 10:00 am.', hora: '18:05' }]
      }
    ];
  });

  // Archivo Histórico Compacto (Para exportar a CSV/Google Drive y purgar memoria)
  const [historialPartidosCSV, setHistorialPartidosCSV] = useState(() => {
    const saved = localStorage.getItem('mp_historial_csv');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [
      { fecha: '2026-11-05', ganador: 'Carlos Mendoza', perdedor: 'Renato Vilchez', marcador: '6-4, 6-4', delta: '+42 Pts' },
      { fecha: '2026-11-07', ganador: 'Rodrigo Quispe', perdedor: 'Franco Huamán', marcador: '6-2, 6-3', delta: '+51 Pts' }
    ];
  });

  // Validaciones Antifraude y Cruces Semanales
  const [validacionesPendientes, setValidacionesPendientes] = useState(() => {
    const saved = localStorage.getItem('mp_validaciones_v4');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return [];
  });

  const [historialCruces, setHistorialCruces] = useState(() => {
    const saved = localStorage.getItem('mp_cruces_v4');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return {};
  });

  const [rachasUsuarios, setRachasUsuarios] = useState(() => {
    const saved = localStorage.getItem('mp_rachas_v4');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return { 'Carlos Mendoza': 4, 'Rodrigo Quispe': 5, 'Gonzalo Palacios': 3, 'Mateo Samaniego': 2 };
  });

  const [climaSedes, setClimaSedes] = useState(() => {
    const saved = localStorage.getItem('mp_clima_v4');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return {
      'Country Club Huancayo': { estado: 'Cancha Seca · Óptima', detalle: '20°C · Soleado', hora: '15:10', reportadoPor: 'Rodrigo Quispe' },
      'Club Tauro Tenis': { estado: 'Techado · 100% Jugable', detalle: '18°C · Cubierto', hora: '14:45', reportadoPor: 'Gonzalo Palacios' },
      'Academia Romina Cutipa': { estado: 'Cancha Seca · Óptima', detalle: '19°C · Nublado parcial', hora: '16:00', reportadoPor: 'Diego Cárdenas' },
      'Complejo Shyam Huilca': { estado: 'Humedad Leve · Jugable', detalle: '17°C · Viento ligero', hora: '15:30', reportadoPor: 'Mateo Samaniego' }
    };
  });

  // ============================================================================
  // 5. INYECCIÓN TIPOGRAFÍA LEGIBLE + SUPABASE REALTIME MULTIDISPOSITIVO
  // ============================================================================
  useEffect(() => {
    // Inyectar Google Fonts: Plus Jakarta Sans & Outfit para máxima legibilidad
    if (!document.getElementById('mp-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'mp-google-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    const timer = setTimeout(() => setShowSplash(false), 1400);
    fetchData();

    const session = localStorage.getItem('tennis_user_session') || sessionStorage.getItem('tennis_user_session');
    if (session) {
      try { setCurrentUser(JSON.parse(session)); } catch { /* ignore */ }
    }

    // Canal Realtime Bidireccional: Base de datos + Broadcast en vivo entre celulares
    const channel = supabase
      .channel('matchpoint_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jugadores' }, () => {
        fetchData();
      })
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        if (payload?.retos) {
          setRetosProgramados(payload.retos);
          localStorage.setItem('mp_retos_v4', JSON.stringify(payload.retos));
        }
        if (payload?.clima) {
          setClimaSedes(payload.clima);
          localStorage.setItem('mp_clima_v4', JSON.stringify(payload.clima));
        }
        if (payload?.validaciones) {
          setValidacionesPendientes(payload.validaciones);
          localStorage.setItem('mp_validaciones_v4', JSON.stringify(payload.validaciones));
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    // Sincronización instantánea si tienes 2 pestañas abiertas en el mismo equipo
    const handleStorageSync = (e) => {
      if (e.key === 'mp_retos_v4' && e.newValue) setRetosProgramados(JSON.parse(e.newValue));
      if (e.key === 'mp_clima_v4' && e.newValue) setClimaSedes(JSON.parse(e.newValue));
      if (e.key === 'mp_validaciones_v4' && e.newValue) setValidacionesPendientes(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageSync);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageSync);
      supabase.removeChannel(channel);
    };
  }, []);

  // Emitir cambios en tiempo real a otros celulares conectados
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

  // Detector Automático de Retos Entrantes o Validaciones al cambiar de usuario
  useEffect(() => {
    if (!currentUser) return;
    const miNombre = currentUser.nombre?.toLowerCase() || '';
    const retoNuevo = retosProgramados.find(
      r => r.jugador2.toLowerCase().includes(miNombre) && r.estado === 'Pendiente de Aceptación'
    );
    const validacionMia = validacionesPendientes.find(
      v => (v.perdedorNombre?.toLowerCase().includes(miNombre) || v.ganadorNombre?.toLowerCase().includes(miNombre)) && v.estado === 'Pendiente'
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

  // Cálculo de métricas del jugador activo
  const myPlayer = currentUser ? (jugadores.find(j => j.id === currentUser.id) || currentUser) : null;
  const myRankPos = myPlayer ? jugadores.findIndex(j => j.id === myPlayer.id) + 1 : 0;
  const myWins = myPlayer?.victorias || 0;
  const myLosses = myPlayer?.derrotas || 0;
  const myTotalMatches = myWins + myLosses;
  const isCalibrated = myTotalMatches >= 5;
  const myWinRate = myTotalMatches > 0 ? Math.round((myWins / myTotalMatches) * 100) : 0;
  const myCatInfo = getInfoCategoria(myPlayer?.elo || 1000);
  const myStreak = myPlayer ? (rachasUsuarios[myPlayer.nombre] ?? (myWins > 0 && myLosses === 0 ? myWins : 1)) : 0;

  // Jugador justo arriba de ti en el Ranking ("Rival a Tiro")
  const playerAboveMe = myRankPos > 1 ? jugadores[myRankPos - 2] : null;
  const ptsToOvertake = playerAboveMe && myPlayer ? Math.max(1, (playerAboveMe.elo || 1000) - (myPlayer.elo || 1000) + 1) : 0;

  const puntosEnCat = Math.max(0, (myPlayer?.elo || 1000) - myCatInfo.min);
  const totalRangoCat = myCatInfo.max - myCatInfo.min;
  const faltanParaSubir = Math.max(0, myCatInfo.max + 1 - (myPlayer?.elo || 1000));

  const misRetos = retosProgramados.filter(r => {
    if (!myPlayer) return false;
    const miNombre = myPlayer.nombre.toLowerCase();
    return r.jugador1.toLowerCase().includes(miNombre) || r.jugador2.toLowerCase().includes(miNombre);
  });

  const misNotificacionesCount = misRetos.length + validacionesPendientes.filter(v => v.estado === 'Pendiente').length;

  // Cálculo del Umbral de Memoria (Alerta al 80%)
  const memoryUsagePercent = simulateHighMemory 
    ? 84 
    : Math.min(95, Math.round(((jugadores.length * 2 + historialPartidosCSV.length * 3 + retosProgramados.length * 2) / 250) * 100));

  // Halo Dinámico para Fotos de Perfil (Fuego si racha >= 3, o Oro/Plata/Bronce si es Top 3)
  const getAvatarHaloClass = (playerName, rankIndex) => {
    const racha = rachasUsuarios[playerName] || 0;
    if (rankIndex === 0) return 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.55)]';
    if (rankIndex === 1) return 'ring-4 ring-zinc-300 shadow-[0_0_16px_rgba(212,212,216,0.4)]';
    if (rankIndex === 2) return 'ring-4 ring-amber-600 shadow-[0_0_16px_rgba(217,119,6,0.45)]';
    if (racha >= 3) return 'ring-4 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]';
    return 'ring-2 ring-emerald-500/60';
  };

  // ============================================================================
  // 6. FUNCIONES DE FOTOS, AUTENTICACIÓN Y MODO SANDBOX
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
        setTab('perfil');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCompleteProfile() {
    if (!nombre.trim()) return alert('Ingresa tu nombre y apellido.');
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

      const calib = calcularPuntosLikert(respuestasLikert);

      const { data, error } = await supabase.from('jugadores').insert([{
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

      if (error) throw error;
      if (data?.[0]) {
        setCurrentUser(data[0]);
        localStorage.setItem('tennis_user_session', JSON.stringify(data[0]));
      }
      setShowProfileSetup(false);
      setNombre('');
      setTelefono('');
      setFotoFile(null);
      setFotoPreview(null);
      await fetchData();
      setTab('perfil');
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
    setTab('perfil');
  }

  // --- MODO SANDBOX ADMIN: CAMBIAR DE CUENTA Y PROBAR FLUJOS EN 1 CLIC ---
  function handleActivateSandboxUser(targetPlayer, label = 'Modo Sandbox Activo') {
    if (!targetPlayer) return;
    setCurrentUser(targetPlayer);
    setSandboxLabel(label);
    localStorage.setItem('tennis_user_session', JSON.stringify(targetPlayer));
    setShowAdminModal(false);
    setShowSideDrawer(false);
  }

  function handleSimulateIncomingChallenge() {
    const receptor = myPlayer || jugadores[0] || { id: 991, nombre: 'Mateo Samaniego', elo: 1340 };
    const retador = jugadores.find(j => j.nombre !== receptor.nombre) || { id: 992, nombre: 'Alejandro Tovar', elo: 1450 };
    const retoTest = {
      id: Date.now(),
      jugador1: retador.nombre,
      jugador2: receptor.nombre,
      sede: 'Country Club Huancayo',
      fecha: 'Mañana 18:00 hrs (Prueba Sandbox)',
      cat: 'Reto Oficial Sandbox',
      estado: 'Pendiente de Aceptación',
      mensajes: [
        { autor: retador.nombre.split(' ')[0], texto: `¡Hola ${receptor.nombre.split(' ')[0]}! Te acabo de lanzar un reto de prueba desde el Sandbox.`, hora: 'Ahora' }
      ]
    };
    const actualizados = [retoTest, ...retosProgramados];
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v4', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);
    setCurrentUser(receptor);
    setSandboxLabel(`Sandbox: ${receptor.nombre}`);
    setShowAdminModal(false);
    setPendingPopupAlert({ tipo: 'reto', data: retoTest });
  }

  // ============================================================================
  // 7. RETOS, CHAT EN VIVO, AUTOLIMPIEZA Y EXPORTACIÓN CSV A GOOGLE DRIVE
  // ============================================================================
  function handleConfirmarNuevoReto(e) {
    e.preventDefault();
    if (!challengeTargetModal) return;
    const retadorNombre = myPlayer ? myPlayer.nombre : 'Mateo Samaniego';

    const nuevoReto = {
      id: Date.now(),
      jugador1: retadorNombre,
      jugador2: challengeTargetModal.nombre,
      sede: challengeSede,
      fecha: challengeFecha,
      cat: 'Partido Oficial por Puntos',
      estado: 'Pendiente de Aceptación',
      mensajes: [
        { autor: retadorNombre.split(' ')[0], texto: `Hola ${challengeTargetModal.nombre.split(' ')[0]}, juguemos en ${challengeSede} el ${challengeFecha}.`, hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    };

    const actualizados = [nuevoReto, ...retosProgramados];
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v4', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);

    const rivalTel = challengeTargetModal.telefono || '';
    setChallengeTargetModal(null);
    setRetosSubTab('mis_retos');

    if (rivalTel && window.confirm(`✅ Reto enviado en tiempo real a ${challengeTargetModal.nombre}.\n\n¿Deseas disparar también la alerta directa a su WhatsApp para garantizar que la vea si tiene su iPhone/Android bloqueado?`)) {
      const msg = `🎾 *MATCHPOINT OFICIAL*: Hola ${challengeTargetModal.nombre.split(' ')[0]}, te he lanzado un desafío oficial por puntos en *${challengeSede}* (${challengeFecha}). Entra a la app para aceptar el partido: https://huancayo-tenis.vercel.app`;
      window.open(`https://wa.me/51${rivalTel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }

  function handleAceptarRetoEntrante(retoId) {
    const actualizados = retosProgramados.map(r => 
      r.id === retoId ? { ...r, estado: 'Programado' } : r
    );
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v4', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);
    setPendingPopupAlert(null);
    setTab('match');
    setRetosSubTab('mis_retos');
  }

  function handleEnviarMensajeInterno(e) {
    e.preventDefault();
    if (!chatMessageInput.trim() || !activeChatReto) return;
    const autor = myPlayer ? myPlayer.nombre.split(' ')[0] : 'Tenista';
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nuevoMsg = { autor, texto: chatMessageInput.trim(), hora: horaActual };
    const actualizados = retosProgramados.map(r => {
      if (r.id === activeChatReto.id) {
        return { ...r, mensajes: [...(r.mensajes || []), nuevoMsg] };
      }
      return r;
    });
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v4', JSON.stringify(actualizados));
    broadcastLiveUpdate(actualizados, null, null);
    setActiveChatReto(actualizados.find(r => r.id === activeChatReto.id));
    setChatMessageInput('');
  }

  async function handleProcesarPartido(e) {
    e.preventDefault();
    if (!p1Id || !p2Id || !winnerId) return alert('Selecciona el ganador del encuentro.');
    if (p1Id === p2Id) return alert('Los rivales deben ser distintos.');

    const player1 = jugadores.find(j => j.id.toString() === p1Id);
    const player2 = jugadores.find(j => j.id.toString() === p2Id);
    if (!player1 || !player2) return;

    const pairKey = [player1.id, player2.id].sort().join('_');
    const enfrentamientosPrevios = historialCruces[pairKey] || 0;
    if (enfrentamientosPrevios >= 2) {
      return alert(
        '🛡️ BLOQUEO ANTIFRAUDE (Anti-Colusión):\n\n' +
        `${player1.nombre} y ${player2.nombre} ya registraron ${enfrentamientosPrevios} partidos entre sí esta semana.\n` +
        'Para proteger el ranking, debes retar a otros miembros del circuito.'
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
      const nuevaRachaGanador = (rachasUsuarios[ganadorObj.nombre] || 0) + 1;
      const bonoRacha1 = S1 === 1 && nuevaRachaGanador >= 3 ? 15 : 0;
      const bonoRacha2 = S2 === 1 && nuevaRachaGanador >= 3 ? 15 : 0;

      const nuevasRachas = {
        ...rachasUsuarios,
        [ganadorObj.nombre]: nuevaRachaGanador,
        [perdedorObj.nombre]: 0
      };
      setRachasUsuarios(nuevasRachas);
      localStorage.setItem('mp_rachas_v4', JSON.stringify(nuevasRachas));

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
      localStorage.setItem('mp_cruces_v4', JSON.stringify(nuevoCruces));

      // Guardar 1 línea ligera para el respaldo CSV en Google Drive
      const lineaHistorica = {
        fecha: new Date().toISOString().split('T')[0],
        ganador: ganadorObj.nombre,
        perdedor: perdedorObj.nombre,
        marcador: score,
        delta: `+${S1 === 1 ? delta1 : delta2} Pts`
      };
      const nuevoHistCSV = [lineaHistorica, ...historialPartidosCSV];
      setHistorialPartidosCSV(nuevoHistCSV);
      localStorage.setItem('mp_historial_csv', JSON.stringify(nuevoHistCSV));

      // Crear alerta de validación antifraude para el rival
      const registroAuditoria = {
        id: Date.now(),
        ganadorNombre: ganadorObj.nombre,
        perdedorNombre: perdedorObj.nombre,
        score,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estado: 'Pendiente'
      };
      const nuevasVal = [registroAuditoria, ...validacionesPendientes];
      setValidacionesPendientes(nuevasVal);
      localStorage.setItem('mp_validaciones_v4', JSON.stringify(nuevasVal));

      // AUTOLIMPIEZA INMEDIATA: El juego y su chat temporal se borran de los retos activos
      let restantes = retosProgramados;
      if (activeRetoId) {
        restantes = retosProgramados.filter(r => r.id !== activeRetoId);
        setRetosProgramados(restantes);
        localStorage.setItem('mp_retos_v4', JSON.stringify(restantes));
        setActiveRetoId(null);
      }

      broadcastLiveUpdate(restantes, null, nuevasVal);

      alert(
        `✅ Marcador Oficial Procesado (${fdLabel})\n\n` +
        `🎾 ${player1.nombre}: ${newElo1} Puntos (${delta1 >= 0 ? '+' : ''}${delta1})\n` +
        `🎾 ${player2.nombre}: ${newElo2} Puntos (${delta2 >= 0 ? '+' : ''}${delta2})\n` +
        `🔥 Racha de ${ganadorObj.nombre}: ${nuevaRachaGanador} seguidas\n` +
        `🧹 Memoria Optimizada: El chat temporal del partido fue eliminado y el resultado quedó listo para tu respaldo en Google Drive.`
      );

      setShowMatchModal(false);
      await fetchData();
    } catch (err) {
      alert('Error al actualizar puntos: ' + err.message);
    } finally {
      setCalculatingMatch(false);
    }
  }

  // Exportar CSV para Google Drive (4 TB) y limpiar memoria temporal
  function handleExportAndPurgeHistory() {
    const headers = ['Fecha,Ganador,Perdedor,Marcador,Variacion_Puntos'];
    const rows = historialPartidosCSV.map(
      h => `${h.fecha},"${h.ganador}","${h.perdedor}","${h.marcador}","${h.delta}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MATCHPOINT_Respaldo_Partidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Purgar memoria local e historial temporal tras descargar
    setHistorialPartidosCSV([]);
    setValidacionesPendientes([]);
    setHistorialCruces({});
    setSimulateHighMemory(false);
    localStorage.setItem('mp_historial_csv', JSON.stringify([]));
    localStorage.setItem('mp_validaciones_v4', JSON.stringify([]));
    localStorage.setItem('mp_cruces_v4', JSON.stringify({}));
    alert('✅ Archivo CSV descargado para tu Google Drive.\n🧹 La memoria histórica de partidos y chats antiguos ha sido vaciada al 0%.');
  }

  //Guardar Reporte Meteorológico desde el Modal Técnico
  function handleGuardarClimaModal(e) {
    e.preventDefault();
    if (!weatherModalClub) return;
    const autor = myPlayer ? myPlayer.nombre : 'Jugador Verificado';
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
    localStorage.setItem('mp_clima_v4', JSON.stringify(nuevoMapa));
    broadcastLiveUpdate(null, nuevoMapa, null);
    setWeatherModalClub(null);
  }

  // Inscribirse en Torneo en Vivo (Actualiza la lista nominal de participantes)
  function handleInscribirEnTorneo(torneo) {
    const inscritoNombre = myPlayer ? myPlayer.nombre : 'Tenista Invitado';
    const inscritoClub = myPlayer ? (myPlayer.club || 'Independiente') : 'Independiente';
    const inscritoPts = myPlayer ? (myPlayer.elo || 1200) : 1200;

    const yaInscrito = torneo.participantes.some(p => p.nombre.toLowerCase() === inscritoNombre.toLowerCase());
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
      localStorage.setItem('mp_torneos_v4', JSON.stringify(actualizados));
      setSelectedTorneoModal(actualizados.find(t => t.id === torneo.id));
    }
  }

  async function handleAdminDeletePlayer(player) {
    if (!window.confirm(`¿Seguro que deseas ELIMINAR la cuenta de "${player.nombre}" (${player.elo} Pts) de Supabase?`)) return;
    try {
      const { error } = await supabase.from('jugadores').delete().eq('id', player.id);
      if (error) throw error;
      await fetchData();
      alert(`Cuenta de ${player.nombre} eliminada.`);
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
    localStorage.setItem('mp_profesores_v4', JSON.stringify(lista));
    setNewProfNombre('');
    setNewProfEsp('');
    setNewProfTel('');
    alert('✅ Profesor agregado al directorio.');
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
    localStorage.setItem('mp_feature_toggles', JSON.stringify(updated));
  }

  function toggleProfesorVisibility(profId) {
    const updated = profesores.map(p => p.id === profId ? { ...p, activo: p.activo === false ? true : false } : p);
    setProfesores(updated);
    localStorage.setItem('mp_profesores_v4', JSON.stringify(updated));
  }

  const sedesVisibles = SEDES_CLUB_PRO.filter(c => featureToggles.clubesActivos?.[c.nombre] !== false);
  const profesoresVisibles = profesores.filter(p => p.activo !== false);

  const clubStats = sedesVisibles.map(c => {
    const socios = jugadores.filter(j => j.club === c.nombre);
    const totalPuntos = socios.reduce((sum, j) => sum + (j.elo || 1000), 0);
    return { ...c, sociosCount: socios.length, totalPuntos };
  }).sort((a, b) => b.totalPuntos - a.totalPuntos);

  const previewCalib = calcularPuntosLikert(respuestasLikert);

  // ============================================================================
  // 8. PANTALLA SPLASH CINEMÁTICA (PELOTA GRANDE SIN RECUADRO)
  // ============================================================================
  if (showSplash) {
    return (
      <div 
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        className="min-h-screen bg-[#111318] text-[#F4F4F6] flex flex-col items-center justify-center p-6 max-w-md mx-auto select-none relative overflow-hidden"
      >
        <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        {/* Pelota de Tenis Vectorial Grande Sin Recuadro */}
        <div className="animate-bounce mb-6">
          <SvgTennisBall className="w-28 h-28" />
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-4xl font-black tracking-tight text-white">
          MATCHPOINT
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-[#E06D44] font-extrabold mt-2">
          Circuito Oficial de Tenis
        </p>
        <div className="w-44 h-1.5 bg-zinc-800/90 rounded-full overflow-hidden mt-8">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-[#E06D44] rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-[#111318] text-[#F5F5F7] flex flex-col max-w-md mx-auto shadow-2xl pb-32 border-x border-zinc-800/80 relative"
    >
      {/* BARRA FLOTANTE SI EL MODO SANDBOX DE PRUEBAS ESTÁ ACTIVO */}
      {sandboxLabel && (
        <div className="bg-amber-500 text-zinc-950 px-3 py-1.5 text-xs font-black flex items-center justify-between sticky top-0 z-50">
          <span>🧪 {sandboxLabel} ({myPlayer?.nombre})</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const otro = jugadores.find(j => j.id !== myPlayer?.id) || jugadores[0];
                if (otro) handleActivateSandboxUser(otro, `Sandbox: ${otro.nombre.split(' ')[0]}`);
              }}
              className="bg-zinc-950 text-amber-400 px-2 py-0.5 rounded-md text-[11px] font-black"
            >
              ⇄ Cambiar Rival
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
          HEADER PREMIUM CENTRADO CON 3 RAYITAS, TIENDA Y CAMPANA IN-APP
      ======================================================================== */}
      <header className="pt-12 pb-3.5 px-4 bg-[#161920]/95 backdrop-blur-md border-b border-zinc-800/90 grid grid-cols-3 items-center sticky top-0 z-30">
        {/* Izquierda: Menú 3 Rayitas + Acceso Directo Tienda */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSideDrawer(true)}
            className="p-2.5 bg-[#1F232D] hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-100 active:scale-95 transition"
            title="Menú y Configuración"
          >
            <Menu className="w-5 h-5 text-emerald-400" />
          </button>
          {featureToggles.tiendaActiva && (
            <button
              onClick={() => setShowStoreModal(true)}
              className="p-2.5 bg-[#1F232D] hover:bg-zinc-800 border border-[#E06D44]/40 rounded-xl text-[#E06D44] active:scale-95 transition flex items-center gap-1"
              title="Tienda & Encordado"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Centro: Marca Centrada y Grande */}
        <div className="text-center">
          <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black tracking-tight text-white leading-none">
            MATCHPOINT
          </h1>
          <span className="text-[10px] tracking-[0.18em] uppercase font-extrabold text-[#E06D44] block mt-1">
            Circuito Oficial
          </span>
        </div>

        {/* Derecha: Campana de Notificaciones + Usuario */}
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
              onClick={() => setTab('perfil')}
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

      <main className="p-4 flex-1 space-y-4">

        {/* ======================================================================
            1. PESTAÑA: MI PERFIL (VISUAL, CERO EXCESO DE TEXTO, HALOS Y RACHA)
        ====================================================================== */}
        {tab === 'perfil' && (
          <div className="space-y-4">
            {myPlayer ? (
              <div className="bg-[#181B22] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Banner Superior Cálido Estilo Roland Garros / ATP */}
                <div className="relative h-28 bg-gradient-to-r from-[#2A1812] via-[#1B222C] to-[#122620] p-4 flex justify-between items-start">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border backdrop-blur-md ${
                    !isCalibrated 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  }`}>
                    {!isCalibrated ? `🔒 Calibrando (${myTotalMatches}/5)` : `✔ Oficial · Puesto #${myRankPos}`}
                  </span>

                  {/* Insignia Vectorial SVG de Racha Duolingo */}
                  <div className="inline-flex items-center gap-1.5 bg-zinc-950/80 border border-orange-500/50 px-3 py-1 rounded-full shadow-lg">
                    <SvgFlame className="w-5 h-5" />
                    <span className="text-xs font-black text-orange-300">{myStreak} en racha</span>
                  </div>
                </div>

                {/* Avatar Grande con Halo Dinámico (Fuego o Podio Metálico) */}
                <div className="px-6 pb-6 text-center -mt-14 relative">
                  <div className="relative w-28 h-28 mx-auto mb-3">
                    <div 
                      onClick={() => profileAvatarInputRef.current?.click()}
                      className={`w-28 h-28 rounded-full bg-zinc-800 p-1 cursor-pointer overflow-hidden flex items-center justify-center transition ${getAvatarHaloClass(myPlayer.nombre, myRankPos - 1)}`}
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

                  <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-black text-white">
                    {myPlayer.nombre}
                  </h2>
                  <p className="text-sm text-zinc-300 font-semibold mt-0.5">{myPlayer.club || 'Independiente'}</p>

                  {/* CANDADO ESTRICTO DE CATEGORÍA HASTA COMPLETAR 5 PARTIDOS */}
                  {!isCalibrated ? (
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-zinc-900 text-amber-300 border border-amber-500/40">
                      <Lock className="w-3.5 h-3.5" /> Nivel Oculto hasta jugar 5 partidos
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-xs font-extrabold border ${myCatInfo.color}`}>
                      <SvgTrophy className="w-4 h-4" /> {myCatInfo.nombre}
                    </div>
                  )}

                  {/* 3 TARJETAS VISUALES GRANDES (SIN EXCESO DE TEXTO) */}
                  <div className="grid grid-cols-3 gap-2.5 mt-5">
                    <div className="bg-[#12141A] p-3.5 rounded-2xl border border-zinc-800 flex flex-col items-center">
                      <SvgTrophy className="w-6 h-6 mb-1" />
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-emerald-400">
                        {myPlayer.elo || 1000}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">Puntos</span>
                    </div>

                    <div className="bg-[#12141A] p-3.5 rounded-2xl border border-orange-500/30 flex flex-col items-center">
                      <SvgFlame className="w-6 h-6 mb-1" />
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-orange-400">
                        {myStreak}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">Racha</span>
                    </div>

                    <div className="bg-[#12141A] p-3.5 rounded-2xl border border-zinc-800 flex flex-col items-center">
                      <Award className="w-6 h-6 text-sky-400 mb-1" />
                      <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-sky-300">
                        {myWinRate}%
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">Efectividad</span>
                    </div>
                  </div>

                  {/* BARRA GRÁFICA DE RÉCORD (GANADOS VS PERDIDOS SUPER CLARA) */}
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

                  {/* BARRA DE CALIBRACIÓN O DE ASCENSO COMPACTA */}
                  {!isCalibrated ? (
                    <div className="mt-3 bg-[#12141A] p-4 rounded-2xl border border-amber-500/30 text-left">
                      <div className="flex justify-between text-xs font-extrabold mb-1.5">
                        <span className="text-amber-300">Fase de Calibración</span>
                        <span className="text-white">{myTotalMatches} / 5 partidos</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.max(12, (myTotalMatches / 5) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-zinc-300 mt-2">
                        Faltan <strong>{5 - myTotalMatches} partido(s)</strong> para desbloquear tu categoría oficial.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 bg-[#12141A] p-4 rounded-2xl border border-zinc-800 text-left">
                      <div className="flex justify-between text-xs font-extrabold mb-1.5">
                        <span className="text-zinc-300">Próximo Ascenso</span>
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

                  {/* ACCIONES DIRECTAS */}
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button 
                      onClick={() => { setTab('match'); setRetosSubTab('nuevo'); }}
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
              /* BIENVENIDA CÁLIDA Y ATRACTIVA PARA NUEVOS USUARIOS */
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
                    Encuentra rivales de tu mismo nivel en segundos, lleva tu récord oficial y reserva canchas o clases con entrenadores verificados.
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
                  <button
                    onClick={() => {
                      if (jugadores.length > 0) {
                        handleActivateSandboxUser(jugadores[0], 'Modo Prueba Directa');
                      } else {
                        setShowAdminModal(true);
                      }
                    }}
                    className="w-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold py-3 rounded-2xl text-xs"
                  >
                    🧪 Entrar en Modo Sandbox (Probar Cuentas sin Registro)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            2. PESTAÑA: RANKING (TEMPORADA EN VIVO, PODIO METÁLICO Y NIVELES)
        ====================================================================== */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            {/* Banner de Temporada con Cuenta Regresiva y Botón de Niveles */}
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
                    onClick={() => setShowSeasonCalendarModal(true)}
                    className="bg-zinc-900/90 hover:bg-zinc-800 text-xs font-extrabold text-zinc-200 px-3 py-2 rounded-xl border border-zinc-700"
                  >
                    📅 Calendario
                  </button>
                  <button
                    onClick={() => setShowLevelsModal(true)}
                    className="bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-extrabold text-emerald-300 px-3 py-2 rounded-xl border border-emerald-500/30"
                  >
                    🏆 Niveles
                  </button>
                </div>
              </div>

              {/* Indicador Adictivo: "Rival a Tiro" */}
              {playerAboveMe && (
                <div className="bg-[#14171E] px-4 py-2.5 border-b border-zinc-800/80 flex justify-between items-center text-xs">
                  <span className="text-zinc-300">
                    🎯 <strong>Rival a tiro:</strong> Estás a <strong className="text-emerald-400">{ptsToOvertake} Pts</strong> de superar a <strong>{playerAboveMe.nombre}</strong>
                  </span>
                  <button
                    onClick={() => setChallengeTargetModal(playerAboveMe)}
                    className="text-emerald-400 font-black underline ml-2 shrink-0"
                  >
                    Retarlo
                  </button>
                </div>
              )}

              <div className="p-4">
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['Todas', '3ª', '4ª', '5ª A', '5ª B', '5ª P', 'Clubes'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFiltroCat(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 border transition ${
                        filtroCat === cat 
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow' 
                          : 'bg-[#111318] text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {cat === 'Todas' ? 'General' : cat === 'Clubes' ? '🏟️ Clubes' : `Cat. ${cat}`}
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
                  <div className="text-center py-12 text-zinc-400 text-sm font-bold">Cargando escalafón oficial...</div>
                ) : jugadores
                    .filter(j => filtroCat === 'Todas' || getInfoCategoria(j.elo || 1000).id === filtroCat)
                    .map((j, idx) => {
                      const catInfo = getInfoCategoria(j.elo || 1000);
                      const totalJ = (j.victorias || 0) + (j.derrotas || 0);
                      const rachaJ = rachasUsuarios[j.nombre] || 0;

                      return (
                        <div 
                          key={j.id || idx}
                          onClick={() => setSelectedPlayerModal(j)}
                          className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer active:scale-[0.99] transition ${
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
                            {/* Medalla SVG para el Top 3 o Número Grande */}
                            <div className="w-8 flex justify-center shrink-0">
                              {idx < 3 ? (
                                <SvgMedal rank={idx + 1} className="w-8 h-8" />
                              ) : (
                                <span style={{ fontFamily: "'Outfit', sans-serif" }} className="font-black text-base text-zinc-400">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Avatar con Halo Metálico o Halo de Fuego */}
                            <div className={`w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 ${getAvatarHaloClass(j.nombre, idx)}`}>
                              {j.foto_url ? (
                                <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-zinc-400" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-base font-extrabold text-white leading-tight">{j.nombre}</p>
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
                    })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            3. PESTAÑA CENTRAL: RETOS (REGLA ESTRICTA DE SUBIR SCORE + CHAT VIVO)
        ====================================================================== */}
        {tab === 'match' && (
          <div className="space-y-4">
            <div className="bg-[#181B22] border border-zinc-800 p-5 rounded-3xl shadow-xl text-center space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E06D44] block">
                Sincronización en Tiempo Real
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

            {/* SUB-VISTA A: TUS DESAFÍOS (BOTÓN SUBIR SCORE SOLO DENTRO DE PARTIDO ACTIVO) */}
            {retosSubTab === 'mis_retos' && (
              <div className="space-y-3">
                {misRetos.length === 0 ? (
                  <div className="bg-[#181B22] border border-zinc-800 p-7 rounded-3xl text-center space-y-3">
                    <Swords className="w-11 h-11 text-emerald-400 mx-auto" />
                    <h4 className="text-lg font-black text-white">No tienes partidos activos hoy</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      El botón para subir marcador se habilitará automáticamente aquí en cuanto tengas un desafío aceptado con un rival.
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
                    const otroNombre = myPlayer && r.jugador1.toLowerCase().includes(myPlayer.nombre.toLowerCase()) ? r.jugador2 : r.jugador1;
                    const rivalObj = jugadores.find(j => j.nombre.toLowerCase().includes(otroNombre.split(' ')[0].toLowerCase()));
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

                        {/* Doble Canal de Coordinación: Chat Interno en Vivo + WhatsApp Directo */}
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

                        {/* Botón de Aceptar (si está pendiente) o Botón Único de Subir Score (si ya está programado) */}
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
                              const p1 = jugadores.find(j => j.nombre.toLowerCase().includes(r.jugador1.split(' ')[0].toLowerCase())) || jugadores[0];
                              const p2 = jugadores.find(j => j.nombre.toLowerCase().includes(r.jugador2.split(' ')[0].toLowerCase())) || jugadores[1];
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

            {/* SUB-VISTA B: CARTELERA PÚBLICA EN VIVO */}
            {retosSubTab === 'cartelera' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-300 font-semibold px-1">
                  Encuentros oficiales pactados en la comunidad (Modo Espectador):
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

            {/* SUB-VISTA C: CREAR NUEVO DESAFÍO (±1,200 PUNTOS) */}
            {retosSubTab === 'nuevo' && (
              <div className="space-y-2.5">
                <div className="bg-[#181B22] border border-zinc-800 p-3.5 rounded-2xl text-xs text-zinc-300">
                  <span className="font-black text-emerald-400">Ventana Oficial (±1,200 Puntos):</span> Elige a tu rival para agendar cancha y horario.
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
            4. PESTAÑA: DIRECTORIO UNIFICADO ("CLUBES & COACHES" + CLIMA MODAL)
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
                  const infoClima = climaSedes[c.nombre] || { estado: 'Cancha Seca · Óptima', detalle: '19°C · Soleado', hora: 'Hoy', reportadoPor: 'Admin' };
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

                        {/* PANEL DE CLIMA VERIFICADO (ABRE MODAL PRECISO, NO CAMBIA POR ERROR) */}
                        <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                          <div>
                            <span className="text-[11px] uppercase font-bold text-zinc-400 block">
                              Reporte de Pista · {infoClima.hora} hrs
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
                            Reportar Estado
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
              /* SUBPESTAÑA: PROFESORES Y ENTRENADORES */
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
                      href={`https://wa.me/51${prof.tel.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(prof.nombre)},%20vi%20tu%20perfil%20en%20MATCHPOINT%20y%20quisiera%20reservar%20una%20clase%20de%20tenis.`}
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
            5. PESTAÑA: TORNEOS (VISUALMENTE VIVA + CLIC PARA VER INSCRITOS Y CUPOS)
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
                Toca cualquier categoría para ver la <strong>lista de jugadores inscritos</strong> y los cupos disponibles.
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
                  className="bg-[#181B22] rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl cursor-pointer active:scale-[0.99] transition"
                >
                  {/* Cabecera Fotográfica Viva del Torneo */}
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
                    {/* Barra de Inscritos vs Cupos Disponibles */}
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

                    {/* Avatares Previos de Jugadores Inscritos */}
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
                      <Users className="w-4 h-4" /> Ver los {inscritosCount} Jugadores Inscritos e Inscribirme
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================
          MODAL: LISTA DE JUGADORES INSCRITOS EN TORNEO Y CUPOS DISPONIBLES
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

            {/* Resumen de Cupos */}
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

            {/* Lista Nominal de Participantes Confirmados */}
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

            {/* Pasarela Yape / Plin + Inscripción */}
            <div className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 text-center space-y-2">
              <QrCode className="w-12 h-12 mx-auto text-emerald-400" />
              <p className="text-xs font-black text-white">Inscripción Oficial: S/ {selectedTorneoModal.precio}.00 (Yape/Plin: 964-000000)</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleInscribirEnTorneo(selectedTorneoModal)}
                className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-extrabold py-3 rounded-2xl text-xs border border-amber-500/30"
              >
                + Simular mi Inscripción
              </button>
              <a
                href={`https://wa.me/51964000000?text=Hola,%20envío%20mi%20comprobante%20de%20S/%20${selectedTorneoModal.precio}%20para%20inscribirme%20en%20${encodeURIComponent(selectedTorneoModal.titulo)}.`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" /> Enviar Voucher
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL TÉCNICO DE REPORTE METEOROLÓGICO (SIN TOQUE ACCIDENTAL)
      ======================================================================== */}
      {weatherModalClub && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400">Reporte Verificado en Tiempo Real</span>
                <h3 className="text-lg font-black text-white">{weatherModalClub}</h3>
              </div>
              <button onClick={() => setWeatherModalClub(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarClimaModal} className="space-y-3.5">
              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-2">Selecciona el Estado Exacto de la Pista:</label>
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
                <label className="text-xs font-extrabold text-zinc-300 block mb-1">Clima / Detalle Adicional:</label>
                <input
                  type="text"
                  value={weatherDetalleInput}
                  onChange={(e) => setWeatherDetalleInput(e.target.value)}
                  placeholder="Ej. 19°C · Soleado sin viento"
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <p className="text-[11px] text-zinc-400">
                ✔ Se registrará la hora actual y tu firma: <strong className="text-emerald-400">{myPlayer ? myPlayer.nombre : 'Jugador Verificado'}</strong>
              </p>

              <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs">
                Publicar Estado de Cancha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: TIENDA OFICIAL & TALLER DE ENCORDADO MATCHPOINT
      ======================================================================== */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-[#E06D44] tracking-widest">Matchpoint Official Pro-Shop</span>
                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
                  Tienda & Taller de Encordado
                </h3>
              </div>
              <button onClick={() => setShowStoreModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner de Beneficio por Racha Activa */}
            <div className="bg-gradient-to-r from-orange-950/60 to-[#12141A] border border-orange-500/40 p-3.5 rounded-2xl flex items-center gap-3">
              <SvgFlame className="w-8 h-8 shrink-0" />
              <div className="text-xs">
                <span className="font-black text-orange-300 block">
                  {myStreak >= 3 ? `¡Descuento Pro Desbloqueado por tu Racha de ${myStreak}!` : 'Premio a la Constancia y Racha'}
                </span>
                <span className="text-zinc-300">
                  Con 3 victorias en racha accedes al <strong>Precio Racha</strong> en encordados, grips y accesorios.
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {PRODUCTOS_TIENDA.map(prod => (
                <div key={prod.id} className="bg-[#111318] border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-400">{prod.tipo} · {prod.badge}</span>
                      <h4 className="text-sm font-black text-white mt-0.5">{prod.nombre}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{prod.desc}</p>
                    </div>
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
                      Pedir por WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: TABLA DE NIVELES Y LOGROS (REUBICADA EN RANKING)
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
            <p className="text-xs text-zinc-300">
              Acumula puntos ganando desafíos oficiales para ascender automáticamente de división:
            </p>
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
          MODAL: CALENDARIO DE TEMPORADA
      ======================================================================== */}
      {showSeasonCalendarModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Calendario Temporada Apertura</h3>
              <button onClick={() => setShowSeasonCalendarModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="bg-[#111318] p-3.5 rounded-2xl border border-emerald-500/30">
                <span className="text-emerald-400 font-black block">● Fase Activa: Retos Libres de Ranking</span>
                <p className="text-zinc-300 mt-0.5">Suma puntos retando rivales dentro de ±1,200 Pts y mantén tu racha activa.</p>
              </div>
              <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-amber-300 font-black block">📅 21–29 Noviembre · Copa Apertura</span>
                <p className="text-zinc-300 mt-0.5">Torneos presenciales por categoría (mínimo 8 inscritos por cuadro).</p>
              </div>
              <div className="bg-[#111318] p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[#E06D44] font-black block">🏆 Cierre de Temporada y Ascensos</span>
                <p className="text-zinc-300 mt-0.5">Entrega de medallas al Top 3 de cada categoría y sorteo de premios por actividad.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          POP-UP AUTOMÁTICO AL ENTRAR SI TIENES UN RETO O VALIDACIÓN
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
                  ¡Nuevo Desafío Recibido!
                </span>
                <h3 className="text-xl font-black text-white">
                  {pendingPopupAlert.data.jugador1} te ha retado
                </h3>
                <p className="text-xs text-zinc-300">
                  📍 Sede propuesta: <strong>{pendingPopupAlert.data.sede}</strong><br />
                  📅 Horario: <strong>{pendingPopupAlert.data.fecha}</strong>
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => handleAceptarRetoEntrante(pendingPopupAlert.data.id)}
                    className="bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-xs"
                  >
                    ✔ Aceptar Reto
                  </button>
                  <button
                    onClick={() => setPendingPopupAlert(null)}
                    className="bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl text-xs"
                  >
                    Después
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">
                  Validación Antifraude de Marcador
                </span>
                <h3 className="text-lg font-black text-white">
                  Confirmar Resultado Oficial
                </h3>
                <p className="text-xs text-zinc-300">
                  <strong>{pendingPopupAlert.data.ganadorNombre}</strong> reportó victoria sobre <strong>{pendingPopupAlert.data.perdedorNombre}</strong> por <strong>{pendingPopupAlert.data.score}</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      const nuevas = validacionesPendientes.map(v => v.id === pendingPopupAlert.data.id ? { ...v, estado: 'Confirmado' } : v);
                      setValidacionesPendientes(nuevas);
                      localStorage.setItem('mp_validaciones_v4', JSON.stringify(nuevas));
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
                      localStorage.setItem('mp_validaciones_v4', JSON.stringify(nuevas));
                      broadcastLiveUpdate(null, null, nuevas);
                      setPendingPopupAlert(null);
                      alert('⚠️ Partido enviado a revisión del Administrador.');
                    }}
                    className="bg-rose-950 text-rose-300 border border-rose-800 font-bold py-3 rounded-xl text-xs"
                  >
                    Reportar Disputa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MENÚ DESPLEGABLE DE 3 RAYITAS (TIENDA, PREMIOS, PRIVACIDAD Y ADMIN SANDBOX)
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
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Menú y Configuración</span>
                  </div>
                </div>
                <button onClick={() => setShowSideDrawer(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Premios Mensuales a la Constancia */}
              <div className="bg-[#1E222B] border border-amber-500/30 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase">
                  <Gift className="w-4 h-4" /> Sorteo Mensual por Actividad
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Juega <strong>4 partidos al mes</strong> para entrar al sorteo de tubos de pelotas y descuentos en canchas.
                </p>
                <span className="text-xs font-extrabold text-emerald-400 block pt-1">
                  Tu progreso: {myTotalMatches} / 4 partidos
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
                  onClick={() => setHidePhonePublic(!hidePhonePublic)}
                  className="w-full bg-[#111318] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-zinc-200 font-bold">Privacidad de mi WhatsApp</span>
                  <span className="text-emerald-400 font-black">{hidePhonePublic ? 'Solo Rivales' : 'Público'}</span>
                </button>

                <button
                  onClick={() => { setShowSideDrawer(false); setShowAllianceModal(true); }}
                  className="w-full bg-[#111318] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-zinc-200 font-bold">Alianza Club Pro / Profesores</span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                <button
                  onClick={() => { setShowSideDrawer(false); setShowAdminModal(true); }}
                  className="w-full bg-amber-500/15 border border-amber-500/40 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-amber-300 font-black flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Panel Admin + Modo Sandbox
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
          MODAL: SUITE DE ADMINISTRACIÓN (SANDBOX, MEMORIA 80%, TOGGLES Y CUENTAS)
      ======================================================================== */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Shield className="w-5 h-5 text-emerald-400" /> Suite Admin & Sandbox
              </h3>
              <button onClick={() => { setShowAdminModal(false); setIsAdminAuth(false); }} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isAdminAuth ? (
              <form onSubmit={(e) => { e.preventDefault(); adminPin === '1234' ? setIsAdminAuth(true) : alert('PIN Incorrecto (Usa 1234)'); }} className="space-y-3">
                <input
                  type="password"
                  placeholder="PIN Administrador (1234)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-3 text-center text-lg tracking-widest text-emerald-400 font-mono"
                />
                <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-xl text-xs">
                  Desbloquear Suite Admin (PIN: 1234)
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-xs">
                {/* 1. MODO SANDBOX PARA PROBAR SIN CREAR CUENTAS */}
                <div className="bg-[#111318] p-4 rounded-2xl border border-amber-500/40 space-y-2.5">
                  <span className="text-[11px] font-black uppercase text-amber-400 block">
                    🧪 1. Modo Sandbox (Pruebas Rápidas en 1 Clic)
                  </span>
                  <p className="text-zinc-300">
                    Cambia de jugador al instante para probarte a ti mismo lanzando retos, chateando y subiendo marcadores:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pA = jugadores.find(j => j.nombre.includes('Mateo')) || jugadores[0] || { id: 901, nombre: 'Mateo Samaniego', elo: 1340, victorias: 6, derrotas: 2 };
                        handleActivateSandboxUser(pA, 'Sandbox Jugador A');
                      }}
                      className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-black py-2.5 px-2 rounded-xl"
                    >
                      👤 Usar Tenista A
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const pB = jugadores.find(j => j.nombre.includes('Alejandro')) || jugadores[1] || { id: 902, nombre: 'Alejandro Tovar', elo: 1450, victorias: 7, derrotas: 3 };
                        handleActivateSandboxUser(pB, 'Sandbox Jugador B');
                      }}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-black py-2.5 px-2 rounded-xl"
                    >
                      👤 Usar Tenista B
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateIncomingChallenge}
                    className="w-full bg-emerald-500 text-zinc-950 font-black py-2.5 rounded-xl"
                  >
                    ⚡ Simular Reto Entrante (Probar Pop-up y Aceptación)
                  </button>
                </div>

                {/* 2. MONITOR DE MEMORIA Y UMBRAL 80% + DESCARGA CSV A GOOGLE DRIVE */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  memoryUsagePercent >= 80 ? 'bg-rose-950/30 border-rose-500' : 'bg-[#111318] border-zinc-800'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase text-emerald-400">
                      💾 2. Memoria y Respaldo Google Drive
                    </span>
                    <button
                      type="button"
                      onClick={() => setSimulateHighMemory(!simulateHighMemory)}
                      className="text-[10px] underline text-zinc-400"
                    >
                      {simulateHighMemory ? 'Ver Real' : 'Simular Tope 80%'}
                    </button>
                  </div>

                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-300">Capacidad Buffer Histórico:</span>
                    <span className={memoryUsagePercent >= 80 ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                      {memoryUsagePercent}% {memoryUsagePercent >= 80 && '⚠️ ¡TOPE ALCANZADO!'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${memoryUsagePercent >= 80 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}
                      style={{ width: `${memoryUsagePercent}%` }}
                    ></div>
                  </div>
                  {memoryUsagePercent >= 80 && (
                    <p className="text-[11px] text-rose-300 font-bold">
                      ⚠️ Alerta de Umbral: Descarga el archivo CSV para tu Google Drive de 4 TB y limpia la memoria operativa.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleExportAndPurgeHistory}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Descargar .CSV (Google Drive) y Limpiar Memoria
                  </button>
                </div>

                {/* 3. FEATURE TOGGLES: ACTIVAR / OCULTAR PATROCINADORES Y CLUBES */}
                <div className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-black uppercase text-sky-400 block">
                    🎛️ 3. Interruptores de Patrocinadores (Sin Borrar Datos)
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

                {/* 4. CONTROL DE CUENTAS Y DEPURACIÓN */}
                <div className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 space-y-2.5">
                  <span className="text-[11px] font-black uppercase text-emerald-400 block">
                    👥 4. Control de Cuentas ({jugadores.length} en Supabase)
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
                      .filter(j => j.nombre.toLowerCase().includes(adminSearch.toLowerCase()))
                      .map(j => (
                        <div key={j.id} className="bg-[#181B22] px-3 py-2 rounded-xl flex justify-between items-center border border-zinc-800">
                          <div>
                            <p className="font-bold text-white">{j.nombre}</p>
                            <span className="text-[10px] text-zinc-400">{j.elo} Pts · {j.club}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleActivateSandboxUser(j, `Sandbox: ${j.nombre.split(' ')[0]}`)}
                              className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-[10px] font-black"
                              title="Usar esta cuenta en Sandbox"
                            >
                              Usar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminDeletePlayer(j)}
                              className="p-1.5 bg-rose-950 text-rose-400 rounded-lg border border-rose-800"
                              title="Eliminar cuenta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 5. ALTA DE PROFESORES */}
                <form onSubmit={handleAdminAddProfesor} className="bg-[#111318] p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-black uppercase text-amber-400 block">
                    🎓 5. Agregar Profesor Verificado
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
          MODALES RESTANTES: NOTIFICACIONES, CHAT INTERNO, PERFIL PÚBLICO, AUTH, LIKERT
      ======================================================================== */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" /> Centro de Avisos
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
                  <span className="text-[10px] font-black text-amber-400 uppercase">Auditoría · {v.estado}</span>
                  <p className="font-bold text-white">{v.ganadorNombre} venció a {v.perdedorNombre} ({v.score})</p>
                </div>
              ))}
              {misRetos.length === 0 && validacionesPendientes.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-6">No tienes notificaciones pendientes.</p>
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
                <h3 className="text-sm font-black text-white">Chat en Vivo del Partido</h3>
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

      {selectedPlayerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center relative">
            <button onClick={() => setSelectedPlayerModal(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="w-24 h-24 mx-auto rounded-full bg-zinc-800 p-1 border-2 border-emerald-400 mb-3 overflow-hidden flex items-center justify-center">
              {selectedPlayerModal.foto_url ? (
                <img src={selectedPlayerModal.foto_url} alt={selectedPlayerModal.nombre} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-zinc-400" />
              )}
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl font-black text-white">
              {selectedPlayerModal.nombre}
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">{selectedPlayerModal.club || 'Independiente'}</p>

            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-[#111318] p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Puntos</span>
                <span className="text-base font-black text-emerald-400 font-mono">{selectedPlayerModal.elo || 1000}</span>
              </div>
              <div className="bg-[#111318] p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Ganados</span>
                <span className="text-base font-black text-white font-mono">{selectedPlayerModal.victorias || 0}</span>
              </div>
              <div className="bg-[#111318] p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Perdidos</span>
                <span className="text-base font-black text-white font-mono">{selectedPlayerModal.derrotas || 0}</span>
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
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Swords className="w-4 h-4" /> Lanzar Desafío Oficial
                  </button>
                ) : (
                  <div className="bg-[#111318] border border-zinc-800 text-zinc-400 text-xs font-bold py-3 rounded-2xl">
                    Fuera de tu ventana de reto (±1,200 Puntos)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                <span className="text-xs text-zinc-400">{challengeTargetModal.elo || 1000} Puntos</span>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Sede Propuesta</label>
                <select
                  value={challengeSede}
                  onChange={(e) => setChallengeSede(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white"
                >
                  {sedesVisibles.map((s, i) => (
                    <option key={i} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>
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
              <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs">
                Confirmar y Enviar Reto en Tiempo Real
              </button>
            </form>
          </div>
        </div>
      )}

      {showMatchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-emerald-400" /> Subir Marcador del Partido
              </h3>
              <button onClick={() => setShowMatchModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProcesarPartido} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Marcador por Sets</label>
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
                <option value="">¿Quién ganó el partido?</option>
                {p1Id && <option value={p1Id}>{jugadores.find(j => j.id.toString() === p1Id)?.nombre}</option>}
                {p2Id && <option value={p2Id}>{jugadores.find(j => j.id.toString() === p2Id)?.nombre}</option>}
              </select>

              <button
                type="submit"
                disabled={calculatingMatch}
                className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
              >
                {calculatingMatch ? 'Calculando Puntos...' : 'Confirmar Resultado y Limpiar Chat'}
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
                {authLoading ? 'Verificando...' : (authMode === 'login' ? 'Entrar a MATCHPOINT' : 'Continuar a las 4 Tarjetas')}
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

      {showProfileSetup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            {quizStep === 0 ? (
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase text-emerald-400">Paso 1 de 5 · Tus Datos</span>
                <h3 className="text-xl font-black text-white">Configura tu Perfil</h3>
                <div className="flex flex-col items-center py-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-[#111318] border-2 border-dashed border-emerald-400 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {isCompressing ? (
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    ) : fotoPreview ? (
                      <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-emerald-400" />
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido *"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="Celular / WhatsApp *"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white"
                />
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full bg-[#111318] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white"
                >
                  {SEDES_CLUB_PRO.map((s, i) => (
                    <option key={i} value={s.nombre}>{s.nombre}</option>
                  ))}
                  <option value="Independiente">Independiente</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!nombre.trim() || !telefono.trim()) return alert('Completa tu nombre y WhatsApp.');
                    setQuizStep(1);
                  }}
                  className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-sm"
                >
                  Siguiente: 4 Tarjetas Likert ➔
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const card = FLASH_CARDS_LIKERT[quizStep - 1];
                  const valorActual = respuestasLikert[quizStep - 1];
                  return (
                    <>
                      <span className="text-xs font-black uppercase text-emerald-400">Tarjeta {quizStep} de 4</span>
                      <h3 className="text-xl font-black text-white">{card.titulo}</h3>
                      <p className="text-sm text-zinc-200 font-semibold">{card.pregunta}</p>
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
                            {valorActual === item.valor && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
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
                            {savingPlayer ? 'Guardando...' : 'Finalizar Registro'}
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

      {showAllianceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181B22] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Alianza Club Pro & Coach Pro</h3>
              <button onClick={() => setShowAllianceModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Posicionamos tu club o academia frente a toda la comunidad tenística local, derivando reservas en horas valle y alumnos nuevos cada semana.
            </p>
            <a
              href="https://wa.me/51964000000?text=Hola,%20deseo%20información%20sobre%20la%20Alianza%20Club%20Pro%20/%20Coach%20Pro%20en%20MATCHPOINT."
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
            >
              Contactar Administración por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================
          BARRA DE NAVEGACIÓN INFERIOR CON NODO CENTRAL DE RETOS
      ======================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#161920]/95 backdrop-blur-xl border-t border-zinc-800 flex justify-around items-center py-2.5 pb-5 px-2 z-40">
        <button 
          onClick={() => setTab('perfil')} 
          className={`flex flex-col items-center text-xs w-16 transition ${tab === 'perfil' ? 'text-emerald-400 font-black' : 'text-zinc-400 font-semibold'}`}
        >
          <User className="w-5 h-5 mb-1" /> Mi Perfil
        </button>

        <button 
          onClick={() => setTab('ranking')} 
          className={`flex flex-col items-center text-xs w-16 transition ${tab === 'ranking' ? 'text-emerald-400 font-black' : 'text-zinc-400 font-semibold'}`}
        >
          <Trophy className="w-5 h-5 mb-1" /> Ranking
        </button>

        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => setTab('match')}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#111318] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition transform active:scale-95"
          >
            <Swords className="w-6 h-6" />
          </button>
          <span className={`text-xs mt-1 font-black ${tab === 'match' ? 'text-emerald-400' : 'text-zinc-200'}`}>
            Retos
          </span>
        </div>

        <button 
          onClick={() => setTab('clubs')} 
          className={`flex flex-col items-center text-xs w-16 transition ${tab === 'clubs' ? 'text-emerald-400 font-black' : 'text-zinc-400 font-semibold'}`}
        >
          <MapPin className="w-5 h-5 mb-1" /> Directorio
        </button>

        <button 
          onClick={() => setTab('torneos')} 
          className={`flex flex-col items-center text-xs w-16 transition ${tab === 'torneos' ? 'text-emerald-400 font-black' : 'text-zinc-400 font-semibold'}`}
        >
          <Calendar className="w-5 h-5 mb-1" /> Torneos
        </button>
      </nav>
    </div>
  );
}
