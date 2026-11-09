import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Swords, MapPin, User, X, Phone, Shield, 
  Calendar, QrCode, Lock, CloudRain, Sun, 
  LogIn, LogOut, Camera, Loader2, Sparkles, Flame, 
  Clock, CheckCircle2, Users, Plus, ChevronRight, 
  Eye, EyeOff, Bell, Menu, Award, AlertTriangle, 
  Trash2, MessageSquare, GraduationCap, Building2, Info, Gift
} from 'lucide-react';
import { supabase } from './supabaseClient';

// --- COMPRESIÓN DE IMÁGENES EN CLIENTE (JPEG LIGERO) ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const max = 800;
        let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round((h * max) / w); w = max; }
        else if (h >= w && h > max) { w = Math.round((w * max) / h); h = max; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Error al comprimir'));
          const newFile = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
          resolve({ file: newFile, preview: canvas.toDataURL('image/jpeg', 0.82) });
        }, 'image/jpeg', 0.82);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// --- ESCALA OFICIAL DE NIVELES (0 A 5,000+ PUNTOS) ---
const ESCALA_CATEGORIAS = [
  { id: '5ª P', nombre: '5ª P · Principiante', min: 0, max: 600, badge: 'Iniciación', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { id: '5ª B', nombre: '5ª B · Inicial', min: 601, max: 1200, badge: 'Intermedio Bajo', color: 'text-orange-300 border-orange-400/30 bg-orange-400/10' },
  { id: '5ª A', nombre: '5ª A · Consolidado', min: 1201, max: 1800, badge: 'Intermedio', color: 'text-sky-300 border-sky-400/30 bg-sky-400/10' },
  { id: '4ª', nombre: '4ª Categoría', min: 1801, max: 2800, badge: 'Competitivo Regular', color: 'text-zinc-200 border-zinc-400/40 bg-zinc-400/10' },
  { id: '3ª', nombre: '3ª Categoría', min: 2801, max: 3800, badge: 'Nivel Máximo Local', color: 'text-yellow-300 border-yellow-400/40 bg-yellow-400/15' },
  { id: '2ª', nombre: '2ª Categoría', min: 3801, max: 4800, badge: 'Zafiro Nacional', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/15' },
  { id: '1ª', nombre: '1ª Categoría', min: 4801, max: 6000, badge: 'Corona Pro', color: 'text-emerald-300 border-emerald-400/50 bg-emerald-400/15' }
];

const getInfoCategoria = (puntos = 1000) => {
  return ESCALA_CATEGORIAS.find(c => puntos >= c.min && puntos <= c.max) || ESCALA_CATEGORIAS[6];
};

// --- FLASH CARDS AMIGABLES PARA NOVATOS CON ESCALA LIKERT (1 AL 5) ---
const FLASH_CARDS_LIKERT = [
  {
    paso: 1,
    titulo: 'Tu Saque o Servicio',
    pregunta: 'Cuando sacas para iniciar un punto, ¿qué tan seguro te sientes?',
    ejemplo: '💡 Ejemplo: 1 es pasarla suave por arriba para no fallar; 5 es sacar fuerte con efecto a las esquinas.',
    escala: [
      { valor: 1, label: '1 · Recién aprendo a pasarla' },
      { valor: 2, label: '2 · La paso suave por seguridad' },
      { valor: 3, label: '3 · Saque regular y constante' },
      { valor: 4, label: '4 · Saque profundo con dirección' },
      { valor: 5, label: '5 · Saque potente y con efecto' }
    ]
  },
  {
    paso: 2,
    titulo: 'Peloteo desde el Fondo',
    pregunta: 'Si peloteas seguido desde el fondo de la cancha, ¿cuántos tiros mantienes?',
    ejemplo: '💡 Ejemplo: Cuenta cuántas veces seguidas pasas la red a ritmo normal sin tirarla afuera.',
    escala: [
      { valor: 1, label: '1 · De 1 a 3 tiros seguidos' },
      { valor: 2, label: '2 · De 4 a 6 tiros si viene cómoda' },
      { valor: 3, label: '3 · Más de 8 tiros cruzados' },
      { valor: 4, label: '4 · Peloteo firme y ataco bolas cortas' },
      { valor: 5, label: '5 · Domino el ritmo y peso de bola' }
    ]
  },
  {
    paso: 3,
    titulo: 'Defensa en Movimiento',
    pregunta: 'Cuando el rival te tira una pelota rápida a las esquinas, ¿cómo respondes?',
    ejemplo: '💡 Ejemplo: 1 es no llegar a tiempo; 3 es devolver un globo alto; 5 es contraatacar corriendo.',
    escala: [
      { valor: 1, label: '1 · Me cuesta llegar y armar el golpe' },
      { valor: 2, label: '2 · Solo pongo la raqueta para bloquear' },
      { valor: 3, label: '3 · Tiro un globo alto para defenderme' },
      { valor: 4, label: '4 · Llego bien y devuelvo profundo' },
      { valor: 5, label: '5 · Contraataco con total control' }
    ]
  },
  {
    paso: 4,
    titulo: 'Experiencia en Partidos',
    pregunta: '¿Qué tanta experiencia tienes jugando sets completos con puntaje?',
    ejemplo: '💡 Ejemplo: No importa si nunca jugaste un torneo; esto nos ayuda a buscarte rivales parejos.',
    escala: [
      { valor: 1, label: '1 · Solo peloteo por diversión' },
      { valor: 2, label: '2 · Juego sets amistosos de vez en cuando' },
      { valor: 3, label: '3 · Juego partidos de club cada semana' },
      { valor: 4, label: '4 · He jugado torneos internos avanzando rondas' },
      { valor: 5, label: '5 · Juego finales abiertas o soy entrenador' }
    ]
  }
];

const calcularPuntosLikert = (respuestas) => {
  // respuestas tiene 4 valores del 1 al 5 (suma de 4 a 20)
  const pts = respuestas.reduce((a, b) => a + (b - 1), 0); // normalizado de 0 a 16
  if (pts <= 3) return { elo: 350 + pts * 45, cat: '5ª P' };
  if (pts <= 7) return { elo: 700 + (pts - 4) * 90, cat: '5ª B' };
  if (pts <= 11) return { elo: 1300 + (pts - 8) * 90, cat: '5ª A' };
  if (pts <= 14) return { elo: 2000 + (pts - 12) * 220, cat: '4ª' };
  return { elo: 2950 + (pts - 15) * 200, cat: '3ª' };
};

// --- FACTOR DE DOMINIO POR GAMES (GAME SPREAD) ---
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

// --- PERFILES "CLUB PRO" (ALIANZA ESTRATÉGICA B2B) ---
const SEDES_CLUB_PRO = [
  {
    nombre: 'Country Club Huancayo',
    canchas: '3 Canchas de Arcilla',
    zona: 'El Tambo',
    tel: '964123456',
    servicios: ['Iluminación Nocturna', 'Cafetería &Restaurante', 'Vestuarios', 'Estacionamiento'],
    beneficioMatchpoint: '15% de descuento en alquiler de cancha en horario valle (10:00 a 15:00) para jugadores activos de Matchpoint.',
    sponsorBadge: 'CLUB PRO ALIADO',
    img: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80'
  },
  {
    nombre: 'Club Tauro Tenis',
    canchas: '2 Canchas de Arcilla Techadas',
    zona: 'San Carlos',
    tel: '954987654',
    servicios: ['Canchas 100% Techadas', 'Iluminación LED', 'Tienda Encordado', 'Tribuna'],
    beneficioMatchpoint: 'Prioridad de reserva en días de lluvia para partidos oficiales del ranking Matchpoint.',
    sponsorBadge: 'CLUB PRO TECHADO',
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80'
  },
  {
    nombre: 'Academia Romina Cutipa',
    canchas: '2 Canchas de Arcilla',
    zona: 'Huancayo Este',
    tel: '999555444',
    servicios: ['Academia Formativa', 'Canasto de Pelotas', 'Alquiler de Raquetas', 'Kiosco'],
    beneficioMatchpoint: '1 clase grupal de evaluación con 20% de descuento para nuevos registrados en la app.',
    sponsorBadge: 'SEDE OFICIAL ACADEMIA',
    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80'
  },
  {
    nombre: 'Complejo Shyam Huilca',
    canchas: '1 Rápida / 1 Arcilla',
    zona: 'Chilca',
    tel: '988333222',
    servicios: ['Doble Superficie', 'Iluminación', 'Parqueo Privado'],
    beneficioMatchpoint: 'Tubo de pelotas de préstamo sin costo al alquilar 2 horas seguidas para retos oficiales.',
    sponsorBadge: 'CLUB PRO ASOCIADO',
    img: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=900&q=80'
  }
];

// --- DIRECTORIO INICIAL DE PROFESORES PATROCINADOS ---
const PROFESORES_INICIALES = [
  {
    id: 'prof-1',
    nombre: 'Prof. Rodrigo Quispe',
    especialidad: 'Alta Competencia y Técnica de Golpes',
    niveles: 'Todos los niveles (5ª P hasta 3ª)',
    sede: 'Academia Romina Cutipa / Country Club',
    tarifa: 'S/ 50 / hora individual',
    tel: '944889900',
    destacado: 'Entrenador Oficial Verificado',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'prof-2',
    nombre: 'Prof. Romina Cutipa',
    especialidad: 'Formación de Base, Adultos Novatos y Táctica',
    niveles: 'Especialista en Iniciación (5ª P, 5ª B) e Intermedios',
    sede: 'Academia Romina Cutipa',
    tarifa: 'S/ 45 / hora individual · Grupal disponible',
    tel: '999555444',
    destacado: 'Directora de Academia Aliada',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
  }
];

// --- 5 TORNEOS ACTIVOS POR CATEGORÍA (MÍNIMO 8 INSCRITOS) ---
const TORNEOS_OFICIALES = [
  { id: 't-3a', cat: '3ª', titulo: 'Torneo Apertura · 3ª Categoría', subtitulo: 'Nivel Máximo Local · Maestros', sede: 'Country Club Huancayo', fecha: '21 y 22 de Noviembre', precio: 40, min: 8, inscritos: 8 },
  { id: 't-4a', cat: '4ª', titulo: 'Torneo Apertura · 4ª Categoría', subtitulo: 'Cuadro Principal + Ronda Consuelo', sede: 'Country Club Huancayo', fecha: '21 y 22 de Noviembre', precio: 40, min: 8, inscritos: 11 },
  { id: 't-5a', cat: '5ª A', titulo: 'Torneo Apertura · 5ª Categoría A', subtitulo: 'Intermedio Consolidado', sede: 'Club Tauro Tenis', fecha: '28 y 29 de Noviembre', precio: 40, min: 8, inscritos: 9 },
  { id: 't-5b', cat: '5ª B', titulo: 'Torneo Apertura · 5ª Categoría B', subtitulo: 'Intermedio Inicial', sede: 'Academia Romina Cutipa', fecha: '28 y 29 de Noviembre', precio: 40, min: 8, inscritos: 7 },
  { id: 't-5p', cat: '5ª P', titulo: 'Torneo Apertura · 5ª Principiantes', subtitulo: 'Ideal para tu primer torneo oficial', sede: 'Complejo Shyam Huilca', fecha: '5 y 6 de Diciembre', precio: 35, min: 8, inscritos: 6 }
];

export default function App() {
  // Splash Screen Cinemático al iniciar
  const [showSplash, setShowSplash] = useState(true);

  // Navegación principal (Mi Perfil primero a la izquierda)
  const [tab, setTab] = useState('perfil');
  const [retosSubTab, setRetosSubTab] = useState('mis_retos');
  const [canchasSubTab, setCanchasSubTab] = useState('clubes'); // 'clubes' | 'profesores'
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('Todas');

  // Sesión, Privacidad y Menú Lateral (3 Rayitas)
  const [currentUser, setCurrentUser] = useState(null);
  const [keepSession, setKeepSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hidePhonePublic, setHidePhonePublic] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [pendingPopupAlert, setPendingPopupAlert] = useState(null);

  // Modales de Auth y Flash Cards de Registro
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [quizStep, setQuizStep] = useState(0); // 0 = Datos personales, 1..4 = Flash Cards Likert

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

  // Modales Interactivos
  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);
  const [challengeTargetModal, setChallengeTargetModal] = useState(null);
  const [challengeSede, setChallengeSede] = useState('Country Club Huancayo');
  const [challengeFecha, setChallengeFecha] = useState('Sábado 16:00 hrs');
  const [activeChatReto, setActiveChatReto] = useState(null);
  const [chatMessageInput, setChatMessageInput] = useState('');

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedTorneoModal, setSelectedTorneoModal] = useState(null);
  const [showAllianceModal, setShowAllianceModal] = useState(false);

  // Admin Suite
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [newProfNombre, setNewProfNombre] = useState('');
  const [newProfEsp, setNewProfEsp] = useState('');
  const [newProfTarifa, setNewProfTarifa] = useState('S/ 50 / hora');
  const [newProfTel, setNewProfTel] = useState('');

  // Subir Score y Validación Antifraude
  const [activeRetoId, setActiveRetoId] = useState(null);
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [score, setScore] = useState('6-4, 6-3');
  const [winnerId, setWinnerId] = useState('');
  const [calculatingMatch, setCalculatingMatch] = useState(false);

  // Profesores Patrocinados (Persistentes)
  const [profesores, setProfesores] = useState(() => {
    const saved = localStorage.getItem('mp_profesores_pro');
    if (saved) { try { return JSON.parse(saved); } catch { /* fallback */ } }
    return PROFESORES_INICIALES;
  });

  // Retos Programados con Chat Interno y Validación Asimétrica
  const [retosProgramados, setRetosProgramados] = useState(() => {
    const saved = localStorage.getItem('mp_retos_v3');
    if (saved) { try { return JSON.parse(saved); } catch { /* fallback */ } }
    return [
      { 
        id: 101, 
        jugador1: 'Mateo Samaniego', 
        jugador2: 'Alejandro Tovar', 
        sede: 'Country Club Huancayo', 
        fecha: 'Sábado 17:00 hrs', 
        cat: 'Duelo Oficial', 
        estado: 'Programado',
        mensajes: [{ autor: 'Mateo', texto: '¡Listo para el sábado! Llevo tubo de pelotas nuevas.', hora: '14:20' }]
      },
      { 
        id: 102, 
        jugador1: 'Diego Cárdenas', 
        jugador2: 'Carlos Mendoza', 
        sede: 'Academia Romina Cutipa', 
        fecha: 'Domingo 10:00 hrs', 
        cat: '4ª Categoría', 
        estado: 'Programado',
        mensajes: [{ autor: 'Diego', texto: 'Cancha 1 reservada a las 10 am.', hora: '18:05' }]
      }
    ];
  });

  // Historial Antifraude de Partidos por Validación Asimétrica
  const [validacionesPendientes, setValidacionesPendientes] = useState(() => {
    const saved = localStorage.getItem('mp_validaciones_antifraude');
    if (saved) { try { return JSON.parse(saved); } catch { /* fallback */ } }
    return [];
  });

  // Historial de enfrentamientos semanales (Detector Anti-Colusión / Anti-Farm)
  const [historialCruces, setHistorialCruces] = useState(() => {
    const saved = localStorage.getItem('mp_historial_cruces');
    if (saved) { try { return JSON.parse(saved); } catch { /* fallback */ } }
    return {};
  });

  // Rachas de Victorias (Estilo Duolingo)
  const [rachasUsuarios, setRachasUsuarios] = useState(() => {
    const saved = localStorage.getItem('mp_rachas_duolingo');
    if (saved) { try { return JSON.parse(saved); } catch { /* fallback */ } }
    return { 'Rodrigo Quispe': 5, 'Gonzalo Palacios': 3, 'Mateo Samaniego': 2 };
  });

  // Clima Verificado por Jugador
  const [climaSedes, setClimaSedes] = useState(() => {
    const saved = localStorage.getItem('mp_clima_sedes');
    if (saved) { try { return JSON.parse(saved); } catch { /* fallback */ } }
    return {
      'Country Club Huancayo': { estado: 'Soleado · Cancha Seca', hora: 'Hace 15 min', reportadoPor: 'Rodrigo Quispe' },
      'Club Tauro Tenis': { estado: 'Techado · Óptimo', hora: 'Hace 30 min', reportadoPor: 'Gonzalo Palacios' },
      'Academia Romina Cutipa': { estado: 'Nublado · Jugable', hora: 'Hace 10 min', reportadoPor: 'Diego Cárdenas' },
      'Complejo Shyam Huilca': { estado: 'Soleado · Cancha Seca', hora: 'Hace 45 min', reportadoPor: 'Mateo Samaniego' }
    };
  });

  // Inicialización + Splash + Suscripción Realtime a Supabase
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1350);
    fetchData();

    const session = localStorage.getItem('tennis_user_session') || sessionStorage.getItem('tennis_user_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem('tennis_user_session');
      }
    }

    // Suscripción en Tiempo Real a cambios en la tabla jugadores
    const channel = supabase
      .channel('realtime_jugadores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jugadores' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Detector Automático de Retos Entrantes (Salta Pop-up al abrir sesión)
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

  const myPlayer = currentUser ? jugadores.find(j => j.id === currentUser.id) || currentUser : null;
  const myRankPos = myPlayer ? jugadores.findIndex(j => j.id === myPlayer.id) + 1 : 0;
  const myWins = myPlayer?.victorias || 0;
  const myLosses = myPlayer?.derrotas || 0;
  const myTotalMatches = myWins + myLosses;
  const isCalibrated = myTotalMatches >= 5;
  const myWinRate = myTotalMatches > 0 ? Math.round((myWins / myTotalMatches) * 100) : 0;
  const myCatInfo = getInfoCategoria(myPlayer?.elo || 1000);
  const myStreak = myPlayer ? (rachasUsuarios[myPlayer.nombre] ?? (myWins > 0 && myLosses === 0 ? myWins : 1)) : 0;

  const puntosEnCat = Math.max(0, (myPlayer?.elo || 1000) - myCatInfo.min);
  const totalRangoCat = myCatInfo.max - myCatInfo.min;
  const faltanParaSubir = Math.max(0, myCatInfo.max + 1 - (myPlayer?.elo || 1000));
  const enPromocion = isCalibrated && puntosEnCat >= (totalRangoCat * 0.90) && myCatInfo.id !== '1ª';

  const misRetos = retosProgramados.filter(r => {
    if (!myPlayer) return false;
    const miNombre = myPlayer.nombre.toLowerCase();
    return r.jugador1.toLowerCase().includes(miNombre) || r.jugador2.toLowerCase().includes(miNombre);
  });

  const misNotificacionesCount = misRetos.length + validacionesPendientes.filter(v => v.estado === 'Pendiente').length;

  // --- COMPRESIÓN Y ACTUALIZACIÓN DE FOTO ---
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

  // --- AUTENTICACIÓN PREMIUM CON CORREO Y PERSISTENCIA ---
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
    setShowSideDrawer(false);
    setTab('perfil');
  }

  // --- CREAR DESAFÍO + NOTIFICACIÓN IN-APP + PUSH NATIVA ---
  function handleConfirmarNuevoReto(e) {
    e.preventDefault();
    if (!challengeTargetModal) return;
    const retadorNombre = myPlayer ? myPlayer.nombre : 'Jugador Local';

    const nuevoReto = {
      id: Date.now(),
      jugador1: retadorNombre,
      jugador2: challengeTargetModal.nombre,
      sede: challengeSede,
      fecha: challengeFecha,
      cat: 'Partido Oficial por Puntos',
      estado: 'Pendiente de Aceptación',
      mensajes: [
        { autor: retadorNombre.split(' ')[0], texto: `Hola ${challengeTargetModal.nombre.split(' ')[0]}, te propongo jugar en ${challengeSede} el ${challengeFecha}.`, hora: 'Ahora' }
      ]
    };

    const actualizados = [nuevoReto, ...retosProgramados];
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v3', JSON.stringify(actualizados));

    // Notificación Push del navegador si está permitida
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MATCHPOINT · Desafío Enviado', {
        body: `Reto registrado contra ${challengeTargetModal.nombre} en ${challengeSede}.`
      });
    }

    setChallengeTargetModal(null);
    setRetosSubTab('mis_retos');
    alert(`✅ Desafío enviado a ${challengeTargetModal.nombre}.\n\nSe le mostrará un aviso emergente en su pantalla al abrir la app. También puedes usar el Chat Interno del reto o escribirle por WhatsApp.`);
  }

  function handleAceptarRetoEntrante(retoId) {
    const actualizados = retosProgramados.map(r => 
      r.id === retoId ? { ...r, estado: 'Programado' } : r
    );
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v3', JSON.stringify(actualizados));
    setPendingPopupAlert(null);
  }

  function handleEnviarMensajeInterno(e) {
    e.preventDefault();
    if (!chatMessageInput.trim() || !activeChatReto) return;
    const autor = myPlayer ? myPlayer.nombre.split(' ')[0] : 'Tenista';
    const nuevoMsg = { autor, texto: chatMessageInput.trim(), hora: 'Ahora' };
    const actualizados = retosProgramados.map(r => {
      if (r.id === activeChatReto.id) {
        const msgs = [...(r.mensajes || []), nuevoMsg];
        return { ...r, mensajes: msgs };
      }
      return r;
    });
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_v3', JSON.stringify(actualizados));
    setActiveChatReto(actualizados.find(r => r.id === activeChatReto.id));
    setChatMessageInput('');
  }

  // --- MOTOR ANTIFRAUDE + CÁLCULO DE PUNTOS + RACHA DUOLINGO ---
  async function handleProcesarPartido(e) {
    e.preventDefault();
    if (!p1Id || !p2Id || !winnerId) return alert('Selecciona ambos jugadores y el ganador.');
    if (p1Id === p2Id) return alert('Los rivales deben ser distintos.');

    const player1 = jugadores.find(j => j.id.toString() === p1Id);
    const player2 = jugadores.find(j => j.id.toString() === p2Id);
    if (!player1 || !player2) return;

    // 1. FILTRO ANTIFRAUDE (ANTI-FARM / PARTIDOS ARREGLADOS REPETITIVOS)
    const pairKey = [player1.id, player2.id].sort().join('_');
    const enfrentamientosPrevios = historialCruces[pairKey] || 0;
    if (enfrentamientosPrevios >= 2) {
      return alert(
        '🛡️ BLOQUEO ANTIFRAUDE (Anti-Colusión):\n\n' +
        `${player1.nombre} y ${player2.nombre} ya registraron ${enfrentamientosPrevios} partidos entre sí esta semana.\n` +
        'Para evitar manipulación de puntos, debes retar a otros rivales del circuito.'
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

      // Actualizar Racha Duolingo y Bono de Racha (+15 Pts si lleva >= 3 victorias seguidas)
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
      localStorage.setItem('mp_rachas_duolingo', JSON.stringify(nuevasRachas));

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

      // Registrar en auditoría antifraude y contador semanal de cruces
      const nuevoCruces = { ...historialCruces, [pairKey]: enfrentamientosPrevios + 1 };
      setHistorialCruces(nuevoCruces);
      localStorage.setItem('mp_historial_cruces', JSON.stringify(nuevoCruces));

      const registroAuditoria = {
        id: Date.now(),
        ganadorNombre: ganadorObj.nombre,
        perdedorNombre: perdedorObj.nombre,
        score,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reportadoPor: myPlayer?.nombre || ganadorObj.nombre,
        estado: 'Pendiente'
      };
      const nuevasVal = [registroAuditoria, ...validacionesPendientes];
      setValidacionesPendientes(nuevasVal);
      localStorage.setItem('mp_validaciones_antifraude', JSON.stringify(nuevasVal));

      if (activeRetoId) {
        const restantes = retosProgramados.filter(r => r.id !== activeRetoId);
        setRetosProgramados(restantes);
        localStorage.setItem('mp_retos_v3', JSON.stringify(restantes));
        setActiveRetoId(null);
      }

      alert(
        `✅ Resultado Oficial Procesado (${fdLabel})\n\n` +
        `🎾 ${player1.nombre}: ${newElo1} Puntos (${delta1 >= 0 ? '+' : ''}${delta1})\n` +
        `🎾 ${player2.nombre}: ${newElo2} Puntos (${delta2 >= 0 ? '+' : ''}${delta2})\n` +
        `🔥 Racha de ${ganadorObj.nombre}: ${nuevaRachaGanador} victorias seguidas${nuevaRachaGanador >= 3 ? ' (+15 Pts Bono Racha)' : ''}\n` +
        `🛡️ Auditoría Antifraude enviada a ${perdedorObj.nombre}.`
      );

      setShowMatchModal(false);
      await fetchData();
    } catch (err) {
      alert('Error al actualizar puntos: ' + err.message);
    } finally {
      setCalculatingMatch(false);
    }
  }

  // --- ADMIN SUITE: ELIMINAR CUENTAS DUPLICADAS / FALSAS Y GESTIONAR PROFESORES ---
  async function handleAdminDeletePlayer(player) {
    if (!window.confirm(`¿Seguro que deseas ELIMINAR la cuenta de "${player.nombre}" (${player.elo} Pts)? Esta acción depurará el perfil de Supabase.`)) return;
    try {
      const { error } = await supabase.from('jugadores').delete().eq('id', player.id);
      if (error) throw error;
      await fetchData();
      alert(`Cuenta de ${player.nombre} eliminada correctamente.`);
    } catch (err) {
      alert('Error al eliminar cuenta: ' + err.message);
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
      destacado: 'Entrenador Oficial Verificado',
      foto: null
    };
    const lista = [nuevo, ...profesores];
    setProfesores(lista);
    localStorage.setItem('mp_profesores_pro', JSON.stringify(lista));
    setNewProfNombre('');
    setNewProfEsp('');
    setNewProfTel('');
    alert('✅ Profesor publicado en el directorio oficial.');
  }

  function cambiarClimaSede(clubName) {
    if (!myPlayer) {
      alert('Inicia sesión para reportar el clima con tu nombre verificado.');
      setShowAuthModal(true);
      return;
    }
    const estados = [
      'Soleado · Cancha Seca',
      'Nublado · Jugable',
      'Llovizna leve · Precaución',
      'Lluvia · Cancha Pesada'
    ];
    const actual = climaSedes[clubName]?.estado || estados[0];
    const nextIdx = (estados.indexOf(actual) + 1) % estados.length;
    const nuevoMapa = {
      ...climaSedes,
      [clubName]: {
        estado: estados[nextIdx],
        hora: 'Ahora mismo',
        reportadoPor: myPlayer.nombre
      }
    };
    setClimaSedes(nuevoMapa);
    localStorage.setItem('mp_clima_sedes', JSON.stringify(nuevoMapa));
  }

  const clubStats = SEDES_CLUB_PRO.map(c => {
    const socios = jugadores.filter(j => j.club === c.nombre);
    const totalPuntos = socios.reduce((sum, j) => sum + (j.elo || 1000), 0);
    return { ...c, sociosCount: socios.length, totalPuntos };
  }).sort((a, b) => b.totalPuntos - a.totalPuntos);

  const previewCalib = calcularPuntosLikert(respuestasLikert);

  // --- PANTALLA SPLASH CINEMÁTICA DE APERTURA ---
  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#121316] text-[#F4F4F6] flex flex-col items-center justify-center p-6 max-w-md mx-auto select-none">
        <div className="w-20 h-20 rounded-3xl bg-[#1A1D24] border border-emerald-500/40 flex items-center justify-center text-4xl shadow-2xl mb-5 animate-bounce">
          🎾
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">MATCHPOINT</h1>
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mt-1.5">
          Circuito Oficial de Tenis
        </p>
        <div className="w-40 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-8">
          <div className="h-full bg-emerald-400 rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121316] text-[#F4F4F6] flex flex-col font-sans max-w-md mx-auto shadow-2xl pb-32 border-x border-zinc-800/80 relative">
      
      {/* =========================================================
          HEADER MATE CENTRADO CON MENÚ 3 RAYITAS Y CAMPANA IN-APP
      ========================================================= */}
      <header className="pt-14 pb-3.5 px-4 bg-[#16181D]/95 backdrop-blur-md border-b border-zinc-800/90 grid grid-cols-3 items-center sticky top-0 z-30">
        {/* Izquierda: Menú 3 Rayitas (Ajustes, Premios y Admin) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSideDrawer(true)}
            className="p-2.5 bg-[#1E2028] hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-200 active:scale-95 transition"
            title="Menú y Configuración"
          >
            <Menu className="w-5 h-5 text-emerald-400" />
          </button>
        </div>

        {/* Centro: Título Grande y Centrado */}
        <div className="text-center">
          <h1 className="text-lg font-black tracking-tight text-white leading-none">
            MATCHPOINT
          </h1>
          <span className="text-[10px] tracking-widest uppercase font-bold text-emerald-400 block mt-1">
            Circuito Oficial
          </span>
        </div>

        {/* Derecha: Campana de Notificaciones + Acceso Rápido */}
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowNotifModal(true)}
            className="relative p-2.5 bg-[#1E2028] hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-200"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            {misNotificacionesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black flex items-center justify-center">
                {misNotificacionesCount}
              </span>
            )}
          </button>

          {myPlayer ? (
            <button 
              onClick={() => setTab('perfil')}
              className="bg-[#1E2028] border border-emerald-500/40 px-2.5 py-2 rounded-xl text-xs font-extrabold text-emerald-400 truncate max-w-[76px]"
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

        {/* =========================================================
            1. PESTAÑA: MI PERFIL (CANDADO 5/5 + RACHA DUOLINGO + RÉCORD CLARO)
        ========================================================= */}
        {tab === 'perfil' && (
          <div className="space-y-4">
            {myPlayer ? (
              <div className="bg-[#181A20] border border-zinc-800 rounded-3xl p-6 text-center shadow-xl relative">
                {/* Estado Superior: Calibración o Verificado */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${
                    !isCalibrated 
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {!isCalibrated ? `⚡ Calibrando (${myTotalMatches}/5)` : '✔ Jugador Consolidado'}
                  </span>

                  {/* Contador de Racha Estilo Duolingo */}
                  <div className="inline-flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/40 px-3 py-1 rounded-full">
                    <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                    <span className="text-xs font-black text-orange-300">Racha: {myStreak}</span>
                  </div>
                </div>

                {/* Foto de Perfil Grande (112x112px) */}
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <div 
                    onClick={() => profileAvatarInputRef.current?.click()}
                    className="w-28 h-28 rounded-full bg-zinc-800 p-1 border-2 border-emerald-400 cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {updatingAvatar ? (
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    ) : myPlayer.foto_url ? (
                      <img src={myPlayer.foto_url} alt={myPlayer.nombre} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-14 h-14 text-zinc-500" />
                    )}
                  </div>
                  <button
                    onClick={() => profileAvatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-emerald-500 text-zinc-950 p-2 rounded-full shadow-lg border-2 border-[#181A20]"
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

                <h2 className="text-2xl font-black text-white">{myPlayer.nombre}</h2>
                <p className="text-sm text-zinc-400 mt-0.5">{myPlayer.club || 'Independiente'}</p>

                {/* CANDADO ESTRICTO DE CATEGORÍA: OCULTO HASTA COMPLETAR 5 PARTIDOS */}
                {!isCalibrated ? (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase bg-zinc-900 text-amber-300 border border-amber-500/30">
                    <Lock className="w-3.5 h-3.5" /> Categoría Oculta hasta 5/5 Partidos
                  </div>
                ) : (
                  <div className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-xs font-black uppercase border ${myCatInfo.color}`}>
                    <Trophy className="w-3.5 h-3.5" /> {myCatInfo.nombre}
                  </div>
                )}

                {/* Tarjeta Destacada Racha Duolingo */}
                <div className="mt-5 bg-gradient-to-r from-orange-950/40 via-[#14161B] to-[#14161B] border border-orange-500/30 rounded-2xl p-3.5 text-left flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                      <Flame className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase">
                        {myStreak >= 3 ? `¡Racha Encendida de ${myStreak} Victorias!` : `Racha Actual: ${myStreak} Victoria(s)`}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {myStreak >= 3 
                          ? 'Ganas +15 Puntos extra de bonificación en cada triunfo.' 
                          : `Encadena 3 victorias seguidas para activar el bono de +15 Puntos.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Barra de Progreso Explicativa */}
                {!isCalibrated ? (
                  <div className="mt-4 bg-[#121316] p-4 rounded-2xl border border-zinc-800 text-left">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-zinc-200">Progreso de Calibración</span>
                      <span className="text-amber-400 font-mono">{myTotalMatches} de 5 partidos</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${Math.max(10, (myTotalMatches / 5) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      💡 <strong>Guía:</strong> Tus puntos iniciales ({myPlayer.elo} Pts) son provisionales. Juega <strong>{5 - myTotalMatches} partido(s) más</strong> para revelar tu categoría y puesto oficial.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 bg-[#121316] p-4 rounded-2xl border border-zinc-800 text-left">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-zinc-300">Camino al siguiente nivel</span>
                      <span className="text-emerald-400 font-mono">Faltan {faltanParaSubir} Pts</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(8, Math.round((puntosEnCat / totalRangoCat) * 100)))}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {enPromocion && (
                  <div className="mt-3 bg-amber-500/15 border border-amber-400/40 rounded-2xl p-3 text-left flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-200 font-bold">
                      ¡Estás en zona de ascenso! A solo {faltanParaSubir} puntos de subir de categoría.
                    </p>
                  </div>
                )}

                {/* Resumen Claro de Récord y Puntos */}
                <div className="mt-4 pt-4 border-t border-zinc-800/80 text-left">
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-2.5 text-center">
                    Resumen Oficial de Rendimiento
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#121316] p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">Puntos Ranking</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">{myPlayer.elo || 1000}</span>
                      </div>
                      <Trophy className="w-5 h-5 text-emerald-400/60" />
                    </div>
                    <div className="bg-[#121316] p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">Puesto General</span>
                        <span className="text-lg font-black text-white font-mono">
                          {!isCalibrated ? 'En Calib.' : `#${myRankPos}`}
                        </span>
                      </div>
                      <Award className="w-5 h-5 text-amber-400/60" />
                    </div>
                  </div>

                  {/* Desglose Claro de Partidos Ganados / Perdidos / Jugados / Efectividad */}
                  <div className="grid grid-cols-4 gap-2 mt-2.5 text-center">
                    <div className="bg-[#121316] p-2.5 rounded-2xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-emerald-400 block">Ganados</span>
                      <span className="text-base font-black text-white font-mono">{myWins}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-2xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-rose-400 block">Perdidos</span>
                      <span className="text-base font-black text-white font-mono">{myLosses}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-2xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-400 block">Jugados</span>
                      <span className="text-base font-black text-white font-mono">{myTotalMatches}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-2xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-sky-400 block">Efectividad</span>
                      <span className="text-base font-black text-sky-300 font-mono">{myWinRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Botones Grandes de Acción */}
                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-zinc-800">
                  <button 
                    onClick={() => { setTab('match'); setRetosSubTab('nuevo'); }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Swords className="w-4 h-4" /> Retar un Rival
                  </button>
                  <button 
                    onClick={() => setShowSideDrawer(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-zinc-700"
                  >
                    <Gift className="w-4 h-4 text-amber-400" /> Ver Premios
                  </button>
                </div>
              </div>
            ) : (
              /* Bienvenida Intuitiva para Nuevos Usuarios */
              <div className="bg-[#181A20] border border-zinc-800 p-7 rounded-3xl text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Bienvenido a MATCHPOINT</h2>
                  <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                    Encuentra rivales de tu mismo nivel, suma puntos oficiales en cada partido y reserva canchas o clases con profesores verificados.
                  </p>
                </div>
                <div className="bg-[#121316] border border-zinc-800 p-3.5 rounded-2xl text-left text-xs text-zinc-300 space-y-1">
                  <p className="font-black text-emerald-400">✨ ¿Eres nuevo en la aplicación?</p>
                  <p className="text-zinc-400">
                    Al crear tu cuenta responderás 4 tarjetas rápidas (del 1 al 5). Tu categoría estará protegida durante tus primeros 5 partidos de calibración.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-sm shadow-md"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-2xl text-sm border border-zinc-700"
                  >
                    Crear Cuenta
                  </button>
                </div>
              </div>
            )}

            {/* Tabla de Clasificación por Niveles y Categorías */}
            <div className="bg-[#181A20] border border-zinc-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 text-center">
                Clasificación por Niveles y Categorías (0 – 5,000+ Puntos)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {ESCALA_CATEGORIAS.map(c => (
                  <div key={c.id} className="bg-[#121316] border border-zinc-800/90 px-3 py-2 rounded-xl flex justify-between items-center">
                    <span className="font-black text-white">{c.id}</span>
                    <span className="font-mono text-emerald-400 text-[11px]">{c.min}–{c.max} Pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            2. PESTAÑA: RANKING GENERAL Y DE CLUBES
        ========================================================= */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="bg-[#181A20] border border-zinc-800 p-5 rounded-3xl shadow-xl text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                Escalafón Oficial
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">Clasificación General</h2>
              <p className="text-xs text-zinc-400 mt-1">Toca el nombre de cualquier tenista para abrir su ficha completa</p>
              
              <div className="flex gap-1.5 overflow-x-auto pt-3.5 pb-1 no-scrollbar justify-start">
                {['Todas', '3ª', '4ª', '5ª A', '5ª B', '5ª P', 'Clubes'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFiltroCat(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 border transition ${
                      filtroCat === cat 
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400' 
                        : 'bg-[#121316] text-zinc-300 border-zinc-800'
                    }`}
                  >
                    {cat === 'Todas' ? 'Todas' : cat === 'Clubes' ? '🏆 Clubes' : `Cat. ${cat}`}
                  </button>
                ))}
              </div>
            </div>

            {filtroCat === 'Clubes' ? (
              <div className="space-y-2.5">
                {clubStats.map((c, i) => (
                  <div key={i} className="bg-[#181A20] border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                        i === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        #{i + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{c.nombre}</h4>
                        <p className="text-xs text-zinc-400">{c.sociosCount} tenistas activos sumando puntos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-mono font-black text-emerald-400">{c.totalPuntos}</span>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Puntos</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {loading ? (
                  <div className="text-center py-12 text-zinc-500 text-sm">Cargando clasificación...</div>
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
                              ? 'bg-[#1E2028] border-amber-500/40 shadow-md' 
                              : idx === 1 
                              ? 'bg-[#1A1C23] border-zinc-400/30'
                              : idx === 2
                              ? 'bg-[#1A1C23] border-amber-700/40'
                              : 'bg-[#181A20] border-zinc-800/90'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-7 text-center font-mono font-black text-sm ${
                              idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-500'
                            }`}>
                              #{idx + 1}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700 shrink-0">
                              {j.foto_url ? (
                                <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-zinc-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-black text-white">{j.nombre}</p>
                                {rachaJ >= 3 && (
                                  <span className="text-[10px] font-black bg-orange-500/15 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    🔥 {rachaJ}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {j.club || 'Independiente'} ·{' '}
                                {totalJ < 5 ? (
                                  <span className="text-amber-300 font-bold">Calibrando ({totalJ}/5)</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">Cat. {catInfo.id}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-base font-mono font-black text-emerald-400">{j.elo || 1000}</span>
                              <p className="text-[10px] text-zinc-400 font-bold">
                                {j.victorias || 0}G - {j.derrotas || 0}P
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600" />
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            3. PESTAÑA CENTRAL: RETOS (TUS DESAFÍOS + CARTELERA + NUEVO)
        ========================================================= */}
        {tab === 'match' && (
          <div className="space-y-4">
            <div className="bg-[#181A20] border border-zinc-800 p-5 rounded-3xl shadow-xl text-center space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                Motor Competitivo
              </span>
              <h2 className="text-xl font-black text-white">Central de Desafíos</h2>

              <div className="grid grid-cols-3 gap-1.5 bg-[#121316] p-1.5 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setRetosSubTab('mis_retos')}
                  className={`py-2.5 rounded-xl text-xs font-black transition ${
                    retosSubTab === 'mis_retos' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'
                  }`}
                >
                  Tus Retos ({misRetos.length})
                </button>
                <button
                  onClick={() => setRetosSubTab('cartelera')}
                  className={`py-2.5 rounded-xl text-xs font-black transition ${
                    retosSubTab === 'cartelera' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'
                  }`}
                >
                  Cartelera ({retosProgramados.length})
                </button>
                <button
                  onClick={() => setRetosSubTab('nuevo')}
                  className={`py-2.5 rounded-xl text-xs font-black transition ${
                    retosSubTab === 'nuevo' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'
                  }`}
                >
                  + Retar
                </button>
              </div>
            </div>

            {/* SUB-VISTA A: TUS DESAFÍOS (BOTÓN EXCLUSIVO SUBIR SCORE + CHAT INTERNO) */}
            {retosSubTab === 'mis_retos' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Tus Partidos Activos
                  </span>
                  <button
                    onClick={() => {
                      if (myPlayer) setP1Id(myPlayer.id.toString());
                      setActiveRetoId(null);
                      setShowMatchModal(true);
                    }}
                    className="text-xs font-black text-zinc-950 bg-emerald-400 hover:bg-emerald-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Swords className="w-3.5 h-3.5" /> + Subir Score
                  </button>
                </div>

                {misRetos.length === 0 ? (
                  <div className="bg-[#181A20] border border-zinc-800 p-6 rounded-3xl text-center space-y-3">
                    <Swords className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="text-base font-black text-white">No tienes retos pendientes hoy</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Lanza un desafío a un jugador dentro de tu rango (±1,200 Puntos) o registra el resultado de tu último partido.
                    </p>
                    <button
                      onClick={() => setRetosSubTab('nuevo')}
                      className="bg-emerald-500 text-zinc-950 font-black px-5 py-3 rounded-2xl text-xs"
                    >
                      Buscar Rival para Retar
                    </button>
                  </div>
                ) : (
                  misRetos.map(r => (
                    <div key={r.id} className="bg-[#181A20] border border-emerald-500/40 p-4 rounded-2xl space-y-3 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                          {r.cat}
                        </span>
                        <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {r.estado}
                        </span>
                      </div>

                      <div>
                        <p className="text-base font-black text-white">
                          {r.jugador1} <span className="text-emerald-400 px-1">vs</span> {r.jugador2}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          📍 {r.sede} · 📅 {r.fecha}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => setActiveChatReto(r)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-zinc-700"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Chat Interno ({(r.mensajes || []).length})
                        </button>
                        <button
                          onClick={() => {
                            const p1 = jugadores.find(j => j.nombre.toLowerCase().includes(r.jugador1.split(' ')[0].toLowerCase()));
                            const p2 = jugadores.find(j => j.nombre.toLowerCase().includes(r.jugador2.split(' ')[0].toLowerCase()));
                            if (p1) setP1Id(p1.id.toString());
                            if (p2) setP2Id(p2.id.toString());
                            setActiveRetoId(r.id);
                            setShowMatchModal(true);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Subir Score
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUB-VISTA B: CARTELERA PÚBLICA (MODO ESPECTADOR) */}
            {retosSubTab === 'cartelera' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 px-1">
                  Partidos oficiales programados en la comunidad (Modo Espectador):
                </p>
                {retosProgramados.map(r => (
                  <div key={r.id} className="bg-[#181A20] border border-zinc-800 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                        {r.cat}
                      </span>
                      <span className="text-[11px] text-amber-300 font-bold">● {r.estado}</span>
                    </div>
                    <p className="text-base font-black text-white">
                      {r.jugador1} <span className="text-emerald-400 px-1">vs</span> {r.jugador2}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                      <span>📍 {r.sede}</span>
                      <span>📅 {r.fecha}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUB-VISTA C: CREAR NUEVO DESAFÍO (VENTANA ±1,200 PUNTOS) */}
            {retosSubTab === 'nuevo' && (
              <div className="space-y-2.5">
                <div className="bg-[#181A20] border border-zinc-800 p-3.5 rounded-2xl text-xs text-zinc-300">
                  <span className="font-black text-emerald-400">Ventana Oficial (±1,200 Puntos):</span> Reta a cualquier jugador habilitado. Recibirá una alerta en su aplicación y podrás coordinar por chat interno o WhatsApp.
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
                        dentroVentana ? 'bg-[#181A20] border-zinc-800' : 'bg-[#141519] border-zinc-900 opacity-55'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{j.nombre}</p>
                            <p className="text-xs text-zinc-400">
                              {totalJ < 5 ? 'Calibrando' : `Cat. ${catJ.id}`} · <span className="text-emerald-400 font-bold">{j.elo || 1000} Pts</span>
                            </p>
                          </div>
                        </div>

                        {dentroVentana ? (
                          <button
                            onClick={() => setChallengeTargetModal(j)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                          >
                            <Swords className="w-3.5 h-3.5" /> Retar
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
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

        {/* =========================================================
            4. PESTAÑA: SEDES "CLUB PRO" Y DIRECTORIO DE PROFESORES
        ========================================================= */}
        {tab === 'clubs' && (
          <div className="space-y-4">
            {/* Selector Superior: Clubes Pro vs Entrenadores Oficiales */}
            <div className="bg-[#181A20] p-4 rounded-3xl border border-zinc-800 text-center space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                Aliados Estratégicos
              </span>
              <h2 className="text-xl font-black text-white">Sedes y Entrenadores</h2>

              <div className="grid grid-cols-2 gap-2 bg-[#121316] p-1.5 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setCanchasSubTab('clubes')}
                  className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    canchasSubTab === 'clubes' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Clubes Pro ({SEDES_CLUB_PRO.length})
                </button>
                <button
                  onClick={() => setCanchasSubTab('profesores')}
                  className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    canchasSubTab === 'profesores' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" /> Profesores ({profesores.length})
                </button>
              </div>
            </div>

            {canchasSubTab === 'clubes' ? (
              <div className="space-y-4">
                {SEDES_CLUB_PRO.map((c, idx) => {
                  const infoClima = climaSedes[c.nombre] || { estado: 'Soleado · Cancha Seca', hora: 'Hoy', reportadoPor: 'Admin' };
                  const isRain = infoClima.estado.includes('Lluvia') || infoClima.estado.includes('Llovizna');

                  return (
                    <div key={idx} className="bg-[#181A20] rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
                      <div className="relative h-40 w-full bg-zinc-900">
                        <img src={c.img} alt={c.nombre} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#181A20] via-black/30 to-transparent"></div>
                        <span className="absolute top-3 left-3 bg-zinc-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                          ★ {c.sponsorBadge}
                        </span>
                        <div className="absolute bottom-3 left-4 right-4">
                          <h4 className="text-lg font-black text-white">{c.nombre}</h4>
                          <span className="text-xs text-emerald-400 font-bold">{c.zona} · {c.canchas}</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Servicios del Club Pro */}
                        <div className="flex flex-wrap gap-1.5">
                          {c.servicios.map((srv, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-semibold bg-[#121316] text-zinc-300 border border-zinc-800 px-2.5 py-1 rounded-lg">
                              {srv}
                            </span>
                          ))}
                        </div>

                        {/* Beneficio Cruzado para Usuarios Matchpoint */}
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-xs">
                          <span className="font-black text-emerald-400 block uppercase text-[10px]">
                            🎁 Beneficio Exclusivo Jugador Matchpoint:
                          </span>
                          <p className="text-zinc-200 mt-0.5">{c.beneficioMatchpoint}</p>
                        </div>

                        {/* Clima Verificado por Jugador */}
                        <div className="bg-[#121316] p-3.5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                              Estado de Pista ({infoClima.hora})
                            </span>
                            <p className="text-xs font-black text-white mt-0.5 flex items-center gap-1.5">
                              {isRain ? <CloudRain className="w-4 h-4 text-rose-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                              {infoClima.estado}
                            </p>
                            <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                              ✔ Reportado por: {infoClima.reportadoPor}
                            </span>
                          </div>
                          <button
                            onClick={() => cambiarClimaSede(c.nombre)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 px-3 py-2 rounded-xl border border-zinc-700 shrink-0"
                          >
                            Cambiar Clima
                          </button>
                        </div>

                        <a
                          href={`https://wa.me/51${c.tel}?text=Hola,%20soy%20jugador%20oficial%20de%20MATCHPOINT%20y%20deseo%20consultar%20disponibilidad%20de%20cancha%20en%20${encodeURIComponent(c.nombre)}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md"
                        >
                          <Phone className="w-4 h-4" /> Consultar Disponibilidad (WhatsApp)
                        </a>
                      </div>
                    </div>
                  );
                })}

                {/* Botón Alianza Estratégica B2B */}
                <button
                  onClick={() => setShowAllianceModal(true)}
                  className="w-full bg-[#181A20] hover:bg-zinc-800 border border-zinc-700 p-4 rounded-2xl text-xs font-bold text-emerald-400 flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" /> ¿Administras un Club o Academia? Conoce la Alianza Pro
                </button>
              </div>
            ) : (
              /* DIRECTORIO MONETIZADO DE PROFESORES Y ENTRENADORES */
              <div className="space-y-3.5">
                <div className="bg-[#181A20] border border-zinc-800 p-3.5 rounded-2xl text-xs text-zinc-300">
                  Reserva clases particulares o grupales con entrenadores verificados del circuito para mejorar tu técnica y subir de categoría.
                </div>

                {profesores.map((prof) => (
                  <div key={prof.id} className="bg-[#181A20] border border-zinc-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-emerald-400 overflow-hidden flex items-center justify-center shrink-0">
                        {prof.foto ? (
                          <img src={prof.foto} alt={prof.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap className="w-8 h-8 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                          ★ {prof.destacado}
                        </span>
                        <h4 className="text-base font-black text-white mt-1">{prof.nombre}</h4>
                        <p className="text-xs text-zinc-400">{prof.especialidad}</p>
                      </div>
                    </div>

                    <div className="bg-[#121316] p-3.5 rounded-2xl border border-zinc-800 space-y-1 text-xs">
                      <p className="text-zinc-300"><strong className="text-zinc-400">Niveles:</strong> {prof.niveles}</p>
                      <p className="text-zinc-300"><strong className="text-zinc-400">Sede:</strong> {prof.sede}</p>
                      <p className="text-emerald-400 font-black pt-1">Tarifa: {prof.tarifa}</p>
                    </div>

                    <a
                      href={`https://wa.me/51${prof.tel.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(prof.nombre)},%20vi%20tu%20perfil%20verificado%20en%20MATCHPOINT%20y%20quisiera%20reservar%20una%20clase%20de%20tenis.`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md"
                    >
                      <Phone className="w-4 h-4" /> Contactar y Reservar Clase
                    </a>
                  </div>
                ))}

                <div className="bg-[#181A20] border border-zinc-800 p-4 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-white">¿Eres Profesor de Tenis?</p>
                  <p className="text-[11px] text-zinc-400">
                    Publica tu perfil oficial verificado en MATCHPOINT y recibe alumnos todas las semanas. Solicita tu alta con el Administrador.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            5. PESTAÑA: TORNEOS (5 CATEGORÍAS · MÍNIMO 8 JUGADORES)
        ========================================================= */}
        {tab === 'torneos' && (
          <div className="space-y-4">
            <div className="bg-[#181A20] p-5 rounded-3xl border border-zinc-800 text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                Competición Oficial
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">Torneos por Categoría</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Cada categoría requiere un mínimo de 8 participantes confirmados para abrir el sorteo del cuadro.
              </p>
            </div>

            {TORNEOS_OFICIALES.map((t) => {
              const cumpleMinimo = t.inscritos >= t.min;
              const porcentajeCupo = Math.min(100, Math.round((t.inscritos / t.min) * 100));

              return (
                <div key={t.id} className="bg-[#181A20] p-5 rounded-3xl border border-zinc-800 space-y-3.5 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md border ${
                      cumpleMinimo 
                        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80' 
                        : 'text-amber-300 bg-amber-950/50 border-amber-800/70'
                    }`}>
                      {cumpleMinimo ? '✔ Cuadro Confirmado (+8)' : `⏳ Faltan ${t.min - t.inscritos} para abrir cuadro`}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      Categoría {t.cat}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white">{t.titulo}</h4>
                    <p className="text-xs text-zinc-400">{t.subtitulo}</p>
                  </div>

                  <div className="bg-[#121316] p-3.5 rounded-2xl border border-zinc-800">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-zinc-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-400" /> Inscritos: {t.inscritos} tenistas
                      </span>
                      <span className="text-emerald-400 font-mono">Mínimo: {t.min}</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cumpleMinimo ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${porcentajeCupo}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#121316] p-3 rounded-2xl border border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block font-semibold">Sede y Fecha:</span>
                      <span className="font-bold text-white">{t.sede} · {t.fecha}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block font-semibold">Inscripción:</span>
                      <span className="font-black text-emerald-400 text-sm">S/ {t.precio}.00</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedTorneoModal(t)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs shadow-md"
                  >
                    Inscribirme en Categoría {t.cat}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================
          POP-UP AUTOMÁTICO AL ENTRAR SI TIENES UN RETO O VALIDACIÓN
      ========================================================= */}
      {pendingPopupAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border-2 border-emerald-500 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <Bell className="w-7 h-7 animate-bounce" />
            </div>
            {pendingPopupAlert.tipo === 'reto' ? (
              <>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                  ¡Nuevo Desafío Recibido!
                </span>
                <h3 className="text-lg font-black text-white">
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
                    Ver más tarde
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
                      localStorage.setItem('mp_validaciones_antifraude', JSON.stringify(nuevas));
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
                      localStorage.setItem('mp_validaciones_antifraude', JSON.stringify(nuevas));
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

      {/* =========================================================
          MENÚ DESPLEGABLE DE 3 RAYITAS (PREMIOS, AJUSTES Y ADMIN)
      ========================================================= */}
      {showSideDrawer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
          <div className="bg-[#16181D] border-r border-zinc-800 w-80 max-w-[85vw] h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎾</span>
                  <div>
                    <h3 className="text-base font-black text-white leading-none">MATCHPOINT</h3>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Menú y Configuración</span>
                  </div>
                </div>
                <button onClick={() => setShowSideDrawer(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sistema de Recompensas Sostenibles por Actividad */}
              <div className="bg-[#1E2028] border border-amber-500/30 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase">
                  <Gift className="w-4 h-4" /> Premios a la Constancia Mensual
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  No necesitas ser #1 para ganar. Al completar <strong>4 partidos verificados al mes</strong> entras automáticamente al sorteo de:
                </p>
                <ul className="text-[11px] text-zinc-400 space-y-1 pl-2">
                  <li>• 🎾 Tubos de pelotas oficiales nuevas</li>
                  <li>• 🏟️ Horas de cancha con descuento en Clubes Pro</li>
                  <li>• 🏆 Cupos bonificados a la Copa Apertura</li>
                </ul>
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-emerald-400 block">
                    Tu actividad este mes: {myTotalMatches} / 4 partidos
                  </span>
                </div>
              </div>

              {/* Ajustes de Personalización y Privacidad */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                  Ajustes de Privacidad y Dispositivo
                </span>

                <button
                  onClick={() => setHidePhonePublic(!hidePhonePublic)}
                  className="w-full bg-[#121316] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-zinc-200 font-bold">Privacidad de mi WhatsApp</span>
                  <span className="text-emerald-400 font-black">
                    {hidePhonePublic ? 'Solo Rivales' : 'Público'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    if ('Notification' in window) {
                      Notification.requestPermission().then(perm => {
                        alert(perm === 'granted' ? '✅ Notificaciones activadas en tu celular.' : 'Permiso pendiente en ajustes del navegador.');
                      });
                    } else {
                      alert('Las alertas internas ya están activas en tu cuenta.');
                    }
                  }}
                  className="w-full bg-[#121316] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-zinc-200 font-bold">Alertas Push en el Celular</span>
                  <span className="text-emerald-400 font-black">Activar 🔔</span>
                </button>

                <button
                  onClick={() => {
                    setShowSideDrawer(false);
                    setShowAllianceModal(true);
                  }}
                  className="w-full bg-[#121316] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-zinc-200 font-bold">Alianza Clubes y Profesores</span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                <button
                  onClick={() => {
                    setShowSideDrawer(false);
                    setShowAdminModal(true);
                  }}
                  className="w-full bg-[#121316] border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                >
                  <span className="text-amber-300 font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Panel Administrador (Admin)
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
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

      {/* =========================================================
          MODAL: CENTRO DE NOTIFICACIONES IN-APP (CAMPANA)
      ========================================================= */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
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
                <div key={r.id} className="bg-[#121316] border border-zinc-800 p-3.5 rounded-2xl text-xs space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase">{r.estado}</span>
                  <p className="font-bold text-white">{r.jugador1} vs {r.jugador2}</p>
                  <p className="text-zinc-400">📍 {r.sede} · {r.fecha}</p>
                </div>
              ))}
              {validacionesPendientes.map(v => (
                <div key={v.id} className="bg-[#121316] border border-zinc-800 p-3.5 rounded-2xl text-xs space-y-1">
                  <span className="text-[10px] font-black text-amber-400 uppercase">Auditoría · {v.estado}</span>
                  <p className="font-bold text-white">{v.ganadorNombre} venció a {v.perdedorNombre} ({v.score})</p>
                </div>
              ))}
              {misRetos.length === 0 && validacionesPendientes.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-6">No tienes notificaciones pendientes.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CHAT / COORDINACIÓN INTERNA DEL PARTIDO
      ========================================================= */}
      {activeChatReto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-black text-white">Coordinación Interna</h3>
                <p className="text-[11px] text-emerald-400">{activeChatReto.jugador1} vs {activeChatReto.jugador2}</p>
              </div>
              <button onClick={() => setActiveChatReto(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#121316] p-3 rounded-2xl border border-zinc-800 h-48 overflow-y-auto space-y-2">
              {(activeChatReto.mensajes || []).map((m, i) => (
                <div key={i} className="bg-[#1E2028] p-2.5 rounded-xl text-xs">
                  <div className="flex justify-between text-[10px] text-emerald-400 font-bold">
                    <span>{m.autor}</span>
                    <span className="text-zinc-500">{m.hora}</span>
                  </div>
                  <p className="text-zinc-200 mt-0.5">{m.texto}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleEnviarMensajeInterno} className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe para acordar cancha o bolas..."
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                className="flex-1 bg-[#121316] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white"
              />
              <button type="submit" className="bg-emerald-500 text-zinc-950 font-black px-4 rounded-xl text-xs">
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: FICHA PÚBLICA DE JUGADOR (DESDE EL RANKING)
      ========================================================= */}
      {selectedPlayerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center relative">
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

            <h3 className="text-xl font-black text-white">{selectedPlayerModal.nombre}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{selectedPlayerModal.club || 'Independiente'}</p>

            {((selectedPlayerModal.victorias || 0) + (selectedPlayerModal.derrotas || 0)) < 5 ? (
              <span className="inline-block mt-2.5 px-3.5 py-1 rounded-full text-xs font-black uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ⚡ En Calibración ({(selectedPlayerModal.victorias || 0) + (selectedPlayerModal.derrotas || 0)}/5)
              </span>
            ) : (
              <span className="inline-block mt-2.5 px-3.5 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {getInfoCategoria(selectedPlayerModal.elo).nombre}
              </span>
            )}

            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-[#121316] p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Puntos</span>
                <span className="text-base font-black text-emerald-400 font-mono">{selectedPlayerModal.elo || 1000}</span>
              </div>
              <div className="bg-[#121316] p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Ganados</span>
                <span className="text-base font-black text-white font-mono">{selectedPlayerModal.victorias || 0}</span>
              </div>
              <div className="bg-[#121316] p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Perdidos</span>
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
                  <div className="bg-[#121316] border border-zinc-800 text-zinc-500 text-xs font-bold py-3 rounded-2xl">
                    Fuera de tu ventana de reto (±1,200 Puntos)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: PROGRAMAR DESAFÍO OFICIAL
      ========================================================= */}
      {challengeTargetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-emerald-400" /> Programar Desafío
              </h3>
              <button onClick={() => setChallengeTargetModal(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarNuevoReto} className="space-y-3.5">
              <div className="bg-[#121316] p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Rival a Desafiar</span>
                <p className="text-base font-black text-white">{challengeTargetModal.nombre}</p>
                <span className="text-xs text-zinc-400">{challengeTargetModal.elo || 1000} Puntos</span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Cancha / Sede Propuesta</label>
                <select
                  value={challengeSede}
                  onChange={(e) => setChallengeSede(e.target.value)}
                  className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white"
                >
                  {SEDES_CLUB_PRO.map((s, i) => (
                    <option key={i} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Día y Hora Propuesta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sábado 16:00 hrs"
                  value={challengeFecha}
                  onChange={(e) => setChallengeFecha(e.target.value)}
                  className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5"
              >
                <Bell className="w-4 h-4" /> Enviar Reto a la App del Rival
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: INICIAR SESIÓN / REGISTRO CON OJO DE CONTRASEÑA
      ========================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
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
                  className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white"
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
                    className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3.5 py-3 pr-11 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                    title="Mostrar u ocultar contraseña"
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
                Mantener mi sesión abierta en este celular
              </label>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-2xl text-sm shadow-md"
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

      {/* =========================================================
          MODAL: FLASH CARDS DE CALIBRACIÓN CON ESCALA LIKERT (1 AL 5)
      ========================================================= */}
      {showProfileSetup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            {quizStep === 0 ? (
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">
                  Paso 1 de 5 · Tus Datos Básicos
                </span>
                <h3 className="text-xl font-black text-white">Configura tu Ficha</h3>

                <div className="flex flex-col items-center py-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-[#121316] border-2 border-dashed border-emerald-400 flex items-center justify-center overflow-hidden cursor-pointer"
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
                  <span className="text-xs text-zinc-400 mt-1.5">Toca el círculo para subir tu foto</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Nombre y Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Gómez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Celular / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="999888777"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Club donde sueles jugar</label>
                  <select
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                    className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white"
                  >
                    {SEDES_CLUB_PRO.map((s, i) => (
                      <option key={i} value={s.nombre}>{s.nombre}</option>
                    ))}
                    <option value="Independiente">Independiente</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!nombre.trim() || !telefono.trim()) return alert('Completa tu nombre y WhatsApp para continuar.');
                    setQuizStep(1);
                  }}
                  className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-sm mt-2"
                >
                  Siguiente: 4 Tarjetas Rápidas ➔
                </button>
              </div>
            ) : (
              /* FLASH CARD INDIVIDUAL CON ESCALA LIKERT 1 AL 5 */
              <div className="space-y-4">
                {(() => {
                  const card = FLASH_CARDS_LIKERT[quizStep - 1];
                  const valorActual = respuestasLikert[quizStep - 1];
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-emerald-400">
                          Tarjeta {quizStep} de 4
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(n => (
                            <span key={n} className={`w-6 h-1.5 rounded-full ${n <= quizStep ? 'bg-emerald-400' : 'bg-zinc-800'}`}></span>
                          ))}
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-white">{card.titulo}</h3>
                      <p className="text-sm text-zinc-200 font-semibold leading-snug">{card.pregunta}</p>
                      <div className="bg-[#121316] border border-zinc-800 p-3 rounded-2xl text-xs text-zinc-400">
                        {card.ejemplo}
                      </div>

                      {/* Opciones Likert Grandes (1 al 5) */}
                      <div className="space-y-2 pt-1">
                        {card.escala.map((item) => (
                          <button
                            key={item.valor}
                            type="button"
                            onClick={() => {
                              const copia = [...respuestasLikert];
                              copia[quizStep - 1] = item.valor;
                              setRespuestasLikert(copia);
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold flex justify-between items-center transition ${
                              valorActual === item.valor
                                ? 'bg-emerald-500/20 border-emerald-400 text-white'
                                : 'bg-[#121316] border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <span>{item.label}</span>
                            {valorActual === item.valor && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2.5 pt-3">
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
                            Siguiente Tarjeta ➔
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={savingPlayer}
                            onClick={handleCompleteProfile}
                            className="w-2/3 bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
                          >
                            {savingPlayer ? 'Creando Cuenta...' : `Finalizar (${previewCalib.elo} Pts Iniciales)`}
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

      {/* =========================================================
          MODAL: SUBIR SCORE CON AUDITORÍA ANTIFRAUDE
      ========================================================= */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-emerald-400" /> Subir Score Oficial
              </h3>
              <button onClick={() => setShowMatchModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProcesarPartido} className="space-y-3">
              <select
                value={p1Id}
                onChange={(e) => setP1Id(e.target.value)}
                required
                className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white"
              >
                <option value="">Selecciona Tenista 1...</option>
                {jugadores.map(j => (
                  <option key={j.id} value={j.id.toString()}>{j.nombre} ({j.elo || 1000} Pts)</option>
                ))}
              </select>

              <select
                value={p2Id}
                onChange={(e) => setP2Id(e.target.value)}
                required
                className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white"
              >
                <option value="">Selecciona Tenista 2 (Rival)...</option>
                {jugadores.map(j => (
                  <option key={j.id} value={j.id.toString()}>{j.nombre} ({j.elo || 1000} Pts)</option>
                ))}
              </select>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Marcador por Sets</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 6-3, 6-2 o 7-6, 6-7, 10-8"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                />
                <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                  {calcularFactorDominio(score).label}
                </span>
              </div>

              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                required
                className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white font-bold"
              >
                <option value="">¿Quién ganó el partido?</option>
                {p1Id && <option value={p1Id}>{jugadores.find(j => j.id.toString() === p1Id)?.nombre}</option>}
                {p2Id && <option value={p2Id}>{jugadores.find(j => j.id.toString() === p2Id)?.nombre}</option>}
              </select>

              <div className="bg-[#121316] border border-zinc-800 p-2.5 rounded-xl text-[11px] text-zinc-400">
                🛡️ <strong>Protección Antifraude:</strong> El rival recibirá una notificación para validar este marcador. Máximo 2 partidos puntuables por semana contra el mismo rival.
              </div>

              <button
                type="submit"
                disabled={calculatingMatch}
                className="w-full bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
              >
                {calculatingMatch ? 'Procesando Puntos...' : 'Confirmar y Actualizar Ranking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ALIANZA ESTRATÉGICA B2B (CLUBES Y PROFESORES)
      ========================================================= */}
      {showAllianceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[88vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Alianza Estratégica MATCHPOINT</h3>
              <button onClick={() => setShowAllianceModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#121316] border border-emerald-500/30 p-4 rounded-2xl space-y-2 text-xs">
              <span className="font-black text-emerald-400 uppercase block">🏟️ Para Clubes y Sedes (Perfil Club Pro)</span>
              <p className="text-zinc-300"><strong>¿Qué le damos al Club?</strong> Tráfico diario de tenistas jugando retos oficiales en horas valle, sede de torneos bimestrales y vitrina comercial destacada.</p>
              <p className="text-zinc-300"><strong>¿Qué nos brinda el Club?</strong> Beneficios o tarifas preferenciales para miembros activos y exhibición del código QR oficial del circuito en recepción.</p>
            </div>

            <div className="bg-[#121316] border border-amber-500/30 p-4 rounded-2xl space-y-2 text-xs">
              <span className="font-black text-amber-400 uppercase block">🎓 Para Entrenadores (Directorio Coach Pro)</span>
              <p className="text-zinc-300"><strong>¿Qué le damos al Profesor?</strong> Perfil verificado con tarifas, especialidad y botón directo de reserva frente a todos los nuevos tenistas que buscan aprender o subir de nivel.</p>
            </div>

            <a
              href="https://wa.me/51964000000?text=Hola,%20quiero%20información%20sobre%20la%20Alianza%20Club%20Pro%20/%20Profesor%20en%20MATCHPOINT."
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
            >
              Contactar Administración por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: INSCRIPCIÓN A TORNEO POR CATEGORÍA
      ========================================================= */}
      {selectedTorneoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">{selectedTorneoModal.titulo}</h3>
              <button onClick={() => setSelectedTorneoModal(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#121316] p-4 rounded-2xl border border-zinc-800 text-center space-y-2">
              <QrCode className="w-16 h-16 mx-auto text-emerald-400" />
              <p className="text-xs font-black text-white">Yape / Plin Oficial: 964-000000</p>
              <p className="text-xs text-zinc-400">
                Inscripción: S/ {selectedTorneoModal.precio}.00 · Sede: {selectedTorneoModal.sede}
              </p>
            </div>
            <a
              href={`https://wa.me/51964000000?text=Hola,%20envío%20mi%20comprobante%20de%20S/%20${selectedTorneoModal.precio}%20para%20inscribirme%20en%20${encodeURIComponent(selectedTorneoModal.titulo)}.`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-emerald-500 text-zinc-950 font-black py-3.5 rounded-2xl text-xs"
            >
              Enviar Comprobante por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADMIN SUITE INTEGRAL (PIN 1234 · GESTIÓN DE CUENTAS Y PROFESORES)
      ========================================================= */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Shield className="w-5 h-5 text-emerald-400" /> Suite de Administración
              </h3>
              <button onClick={() => { setShowAdminModal(false); setIsAdminAuth(false); }} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isAdminAuth ? (
              <form onSubmit={(e) => { e.preventDefault(); adminPin === '1234' ? setIsAdminAuth(true) : alert('PIN Incorrecto'); }} className="space-y-3">
                <input
                  type="password"
                  placeholder="PIN Administrador (1234)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-3 text-center text-lg tracking-widest text-emerald-400 font-mono"
                />
                <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-xs">
                  Desbloquear Suite Admin
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-xs">
                {/* 1. Depuración de Perfiles Repetidos, Ausentes o Falsos */}
                <div className="bg-[#121316] p-4 rounded-2xl border border-zinc-800 space-y-3">
                  <span className="text-[10px] font-black uppercase text-emerald-400 block">
                    1. Control General de Cuentas ({jugadores.length} registradas)
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar jugador por nombre o correo..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full bg-[#181A20] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="max-h-44 overflow-y-auto space-y-1.5">
                    {jugadores
                      .filter(j => j.nombre.toLowerCase().includes(adminSearch.toLowerCase()))
                      .map(j => (
                        <div key={j.id} className="bg-[#181A20] px-3 py-2 rounded-xl flex justify-between items-center border border-zinc-800">
                          <div>
                            <p className="font-bold text-white">{j.nombre}</p>
                            <span className="text-[10px] text-zinc-400">{j.elo} Pts · {j.email || 'Sin correo'}</span>
                          </div>
                          <button
                            onClick={() => handleAdminDeletePlayer(j)}
                            className="p-1.5 bg-rose-950 text-rose-400 rounded-lg border border-rose-800 hover:bg-rose-900"
                            title="Eliminar cuenta duplicada o falsa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 2. Alta de Profesores Patrocinados */}
                <form onSubmit={handleAdminAddProfesor} className="bg-[#121316] p-4 rounded-2xl border border-zinc-800 space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-amber-400 block">
                    2. Publicar Nuevo Profesor Verificado (Monetización)
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del Profesor (Ej. Prof. Carlos Ríos)"
                    value={newProfNombre}
                    onChange={(e) => setNewProfNombre(e.target.value)}
                    className="w-full bg-[#181A20] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Especialidad (Ej. Saque, Adultos Novatos)"
                    value={newProfEsp}
                    onChange={(e) => setNewProfEsp(e.target.value)}
                    className="w-full bg-[#181A20] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Tarifa (S/ 50 / h)"
                      value={newProfTarifa}
                      onChange={(e) => setNewProfTarifa(e.target.value)}
                      className="w-full bg-[#181A20] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp *"
                      value={newProfTel}
                      onChange={(e) => setNewProfTel(e.target.value)}
                      className="w-full bg-[#181A20] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black py-2.5 rounded-xl text-xs">
                    + Publicar Profesor en la App
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          BARRA DE NAVEGACIÓN INFERIOR CON BOTÓN CENTRAL CIRCULAR
      ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#16181D]/95 backdrop-blur-xl border-t border-zinc-800 flex justify-around items-center py-2.5 pb-5 px-2 z-40">
        <button 
          onClick={() => setTab('perfil')} 
          className={`flex flex-col items-center text-[11px] w-16 transition ${tab === 'perfil' ? 'text-emerald-400 font-black' : 'text-zinc-400'}`}
        >
          <User className="w-5 h-5 mb-1" /> Mi Perfil
        </button>

        <button 
          onClick={() => setTab('ranking')} 
          className={`flex flex-col items-center text-[11px] w-16 transition ${tab === 'ranking' ? 'text-emerald-400 font-black' : 'text-zinc-400'}`}
        >
          <Trophy className="w-5 h-5 mb-1" /> Ranking
        </button>

        {/* NODO CENTRAL DESTACADO Y CIRCULAR: RETOS */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => setTab('match')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-[#121316] transition transform active:scale-95 ${
              tab === 'match' 
                ? 'bg-emerald-400 text-zinc-950' 
                : 'bg-emerald-500 text-zinc-950'
            }`}
          >
            <Swords className="w-6 h-6" />
          </button>
          <span className={`text-[11px] mt-1 font-black ${tab === 'match' ? 'text-emerald-400' : 'text-zinc-300'}`}>
            Retos
          </span>
        </div>

        <button 
          onClick={() => setTab('clubs')} 
          className={`flex flex-col items-center text-[11px] w-16 transition ${tab === 'clubs' ? 'text-emerald-400 font-black' : 'text-zinc-400'}`}
        >
          <MapPin className="w-5 h-5 mb-1" /> Canchas
        </button>

        <button 
          onClick={() => setTab('torneos')} 
          className={`flex flex-col items-center text-[11px] w-16 transition ${tab === 'torneos' ? 'text-emerald-400 font-black' : 'text-zinc-400'}`}
        >
          <Calendar className="w-5 h-5 mb-1" /> Torneos
        </button>
      </nav>
    </div>
  );
}
