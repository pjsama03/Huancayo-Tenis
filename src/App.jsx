import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Swords, MapPin, User, X, Phone, Shield, 
  Calendar, QrCode, Lock, CloudRain, Sun, 
  LogIn, LogOut, Camera, Loader2, Sparkles, Flame, 
  Clock, CheckCircle2, Users, Plus, ChevronRight, Eye
} from 'lucide-react';
import { supabase } from './supabaseClient';

// --- COMPRESIÓN SILENCIOSA DE IMÁGENES (HTML5 CANVAS -> JPEG LIGERO) ---
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
          if (!blob) return reject(new Error('Error de compresión'));
          const newFile = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
          resolve({ file: newFile, preview: canvas.toDataURL('image/jpeg', 0.82) });
        }, 'image/jpeg', 0.82);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// --- CLASIFICACIÓN POR NIVELES Y CATEGORÍAS (0 A 5,000+ PUNTOS) ---
const ESCALA_CATEGORIAS = [
  { id: '5ª P', nombre: '5ª P · Principiante', min: 0, max: 600, badge: 'Iniciación', color: 'text-amber-500 border-amber-500/30 bg-amber-500/10' },
  { id: '5ª B', nombre: '5ª B · Inicial', min: 601, max: 1200, badge: 'Intermedio Bajo', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  { id: '5ª A', nombre: '5ª A · Consolidado', min: 1201, max: 1800, badge: 'Intermedio', color: 'text-sky-400 border-sky-400/30 bg-sky-400/10' },
  { id: '4ª', nombre: '4ª Categoría', min: 1801, max: 2800, badge: 'Competitivo Regular', color: 'text-slate-200 border-slate-400/40 bg-slate-400/10' },
  { id: '3ª', nombre: '3ª Categoría', min: 2801, max: 3800, badge: 'Nivel Máximo Local', color: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/15' },
  { id: '2ª', nombre: '2ª Categoría', min: 3801, max: 4800, badge: 'Zafiro Nacional', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/15' },
  { id: '1ª', nombre: '1ª Categoría', min: 4801, max: 6000, badge: 'Corona Pro', color: 'text-lime-400 border-lime-400/50 bg-lime-400/15' }
];

const getInfoCategoria = (puntos = 1000) => {
  return ESCALA_CATEGORIAS.find(c => puntos >= c.min && puntos <= c.max) || ESCALA_CATEGORIAS[6];
};

// --- CUESTIONARIO TÉCNICO SITUACIONAL (4 PREGUNTAS FILTRO) ---
const PREGUNTAS_FILTRO = [
  {
    titulo: '1. Segundo saque en punto de presión (30-40)',
    opciones: [
      { texto: 'Empuje suave para asegurar que pase la red', pts: 0 },
      { texto: 'Mismo gesto que el primero pero lento; riesgo de doble falta', pts: 1 },
      { texto: 'Saque colocado con efecto para iniciar el punto', pts: 2 },
      { texto: 'Slice o kick profundo con dirección elegida', pts: 3 },
      { texto: 'Varío efecto y bote buscando ventaja táctica directa', pts: 4 }
    ]
  },
  {
    titulo: '2. Dinámica de peloteo de fondo de cancha',
    opciones: [
      { texto: '2 o 3 intercambios y la pelota se va larga o a la red', pts: 0 },
      { texto: 'Sostengo 4 a 6 tiros si la pelota viene cómoda al centro', pts: 1 },
      { texto: 'Más de 8 peloteos cruzados y ataco bolas cortas', pts: 2 },
      { texto: 'Topspin consistente con cambio de dirección controlado', pts: 3 },
      { texto: 'Domino aceleración, retroceso y peso de pelota', pts: 4 }
    ]
  },
  {
    titulo: '3. Respuesta ante pelota rápida a las esquinas',
    opciones: [
      { texto: 'No llego a armar a tiempo y bloqueo como puedo o fallo', pts: 0 },
      { texto: 'Defiendo alto al medio buscando pasar la bola', pts: 1 },
      { texto: 'Globo defensivo profundo para recuperar el centro', pts: 2 },
      { texto: 'Apoyos firmes y devolución profunda con slice o drive', pts: 3 },
      { texto: 'Neutralizo el peso rival y contraataco o tiro drop-shot', pts: 4 }
    ]
  },
  {
    titulo: '4. Historial competitivo en partidos y torneos',
    opciones: [
      { texto: 'Peloteos recreativos; casi no cuento sets oficiales', pts: 0 },
      { texto: 'Partidos amistosos esporádicos con amigos', pts: 1 },
      { texto: 'Partidos frecuentes de club/academia con sets y tie-breaks', pts: 2 },
      { texto: 'Torneos internos de clubes superando rondas', pts: 3 },
      { texto: 'Finales de torneos abiertos en 4ª/3ª, o soy instructor', pts: 4 }
    ]
  }
];

const calcularPuntosIniciales = (resp) => {
  const suma = resp.reduce((a, b) => a + b, 0);
  if (suma <= 3) return { elo: 350 + suma * 45, cat: '5ª P' };
  if (suma <= 7) return { elo: 700 + (suma - 4) * 90, cat: '5ª B' };
  if (suma <= 11) return { elo: 1300 + (suma - 8) * 90, cat: '5ª A' };
  if (suma <= 14) return { elo: 2000 + (suma - 12) * 220, cat: '4ª' };
  return { elo: 2950 + (suma - 15) * 200, cat: '3ª' };
};

// --- FACTOR DE DOMINIO POR DIFERENCIA DE GAMES (GAME SPREAD) ---
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
    if (total === 0) return { fd: 1.0, label: 'Estándar (x1.0)' };
    const margen = Math.abs(gA - gB) / total;
    if (margen >= 0.70) return { fd: 1.8, label: 'Dominio Absoluto (x1.8)' };
    if (margen >= 0.40) return { fd: 1.35, label: 'Victoria Contundente (x1.35)' };
    if (margen >= 0.18) return { fd: 1.0, label: 'Victoria Estándar (x1.0)' };
    return { fd: 0.5, label: 'Paridad Técnica (x0.5)' };
  } catch {
    return { fd: 1.0, label: 'Estándar (x1.0)' };
  }
};

// --- SEDES PATROCINADAS CON FOTOS PREDETERMINADAS ---
const SEDES_OFICIALES = [
  {
    nombre: 'Country Club Huancayo',
    canchas: '3 Canchas de Arcilla',
    zona: 'El Tambo',
    tel: '964123456',
    tarifa: 'S/ 15 por persona / hora',
    sponsor: 'Sede Oficial Patrocinada',
    img: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80'
  },
  {
    nombre: 'Club Tauro Tenis',
    canchas: '2 Canchas de Arcilla Techadas',
    zona: 'San Carlos',
    tel: '954987654',
    tarifa: 'Alquiler directo en sede',
    sponsor: 'Sede Oficial Techada',
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80'
  },
  {
    nombre: 'Academia Romina Cutipa',
    canchas: '2 Canchas de Arcilla',
    zona: 'Huancayo Este',
    tel: '999555444',
    tarifa: 'Academia y Alquiler de Canchas',
    sponsor: 'Academia Patrocinadora',
    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80'
  },
  {
    nombre: 'Complejo Shyam Huilca',
    canchas: '1 Rápida / 1 Arcilla',
    zona: 'Chilca',
    tel: '988333222',
    tarifa: 'Alquiler directo por hora',
    sponsor: 'Sede Oficial Asociada',
    img: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=900&q=80'
  }
];

// --- 5 TORNEOS ACTIVOS POR CATEGORÍA (MÍNIMO 8 PARTICIPANTES) ---
const TORNEOS_INICIALES = [
  { id: 't-3a', cat: '3ª', titulo: 'Copa Apertura · 3ª Categoría', subtitulo: 'Olimpo Local · Maestros e Instructores', sede: 'Country Club Huancayo', fecha: '21 y 22 de Noviembre', precio: 40, min: 8, max: 16, inscritos: 8 },
  { id: 't-4a', cat: '4ª', titulo: 'Copa Apertura · 4ª Categoría', subtitulo: 'Cuadro Eliminatorio + Ronda Consuelo', sede: 'Country Club Huancayo', fecha: '21 y 22 de Noviembre', precio: 40, min: 8, max: 16, inscritos: 11 },
  { id: 't-5a', cat: '5ª A', titulo: 'Copa Apertura · 5ª Categoría A', subtitulo: 'Competitivo Consolidado', sede: 'Club Tauro Tenis', fecha: '28 y 29 de Noviembre', precio: 40, min: 8, max: 16, inscritos: 9 },
  { id: 't-5b', cat: '5ª B', titulo: 'Copa Apertura · 5ª Categoría B', subtitulo: 'Nivel Intermedio Inicial', sede: 'Academia Romina Cutipa', fecha: '28 y 29 de Noviembre', precio: 40, min: 8, max: 16, inscritos: 7 },
  { id: 't-5p', cat: '5ª P', titulo: 'Copa Apertura · 5ª Principiantes', subtitulo: 'Circuito de Iniciación Oficial', sede: 'Complejo Shyam Huilca', fecha: '5 y 6 de Diciembre', precio: 35, min: 8, max: 16, inscritos: 6 }
];

export default function App() {
  // Navegación principal (Mi Perfil primero a la izquierda)
  const [tab, setTab] = useState('perfil');
  const [retosSubTab, setRetosSubTab] = useState('mis_retos'); // 'mis_retos' | 'cartelera' | 'nuevo'
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('Todas');

  // Sesión y Autenticación
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Registro con Cuestionario Técnico
  const [nombre, setNombre] = useState('');
  const [club, setClub] = useState('Country Club Huancayo');
  const [telefono, setTelefono] = useState('');
  const [respuestasQuiz, setRespuestasQuiz] = useState([2, 2, 2, 2]);
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

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedTorneoModal, setSelectedTorneoModal] = useState(null);

  // Admin
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  // Formulario de Subir Score
  const [activeRetoId, setActiveRetoId] = useState(null);
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [score, setScore] = useState('6-4, 6-3');
  const [winnerId, setWinnerId] = useState('');
  const [calculatingMatch, setCalculatingMatch] = useState(false);

  // Estado de Retos Programados (Cartelera Pública y Mis Desafíos)
  const [retosProgramados, setRetosProgramados] = useState(() => {
    const saved = localStorage.getItem('mp_retos_programados');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return [
      { id: 101, jugador1: 'Mateo Samaniego', jugador2: 'Alejandro Tovar', sede: 'Country Club Huancayo', fecha: 'Sábado 17:00 hrs', cat: '3ª vs 4ª', estado: 'Programado' },
      { id: 102, jugador1: 'Diego Cárdenas', jugador2: 'Carlos Mendoza', sede: 'Academia Romina Cutipa', fecha: 'Domingo 10:00 hrs', cat: '4ª Categoría', estado: 'Programado' },
      { id: 103, jugador1: 'Rodrigo Quispe', jugador2: 'Gonzalo Palacios', sede: 'Club Tauro Tenis', fecha: 'Domingo 18:30 hrs', cat: '3ª Categoría', estado: 'Programado' }
    ];
  });

  // Estado Climático Verificable con Nombre de Jugador
  const [climaSedes, setClimaSedes] = useState(() => {
    const saved = localStorage.getItem('mp_clima_sedes');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return {
      'Country Club Huancayo': { estado: 'Soleado / Cancha Seca', hora: 'Hace 15 min', reportadoPor: 'Rodrigo Quispe' },
      'Club Tauro Tenis': { estado: 'Techado / Óptimo', hora: 'Hace 30 min', reportadoPor: 'Gonzalo Palacios' },
      'Academia Romina Cutipa': { estado: 'Nublado / Jugable', hora: 'Hace 10 min', reportadoPor: 'Diego Cárdenas' },
      'Complejo Shyam Huilca': { estado: 'Soleado / Cancha Seca', hora: 'Hace 45 min', reportadoPor: 'Mateo Samaniego' }
    };
  });

  useEffect(() => {
    fetchData();
    const session = localStorage.getItem('tennis_user_session');
    if (session) {
      try { setCurrentUser(JSON.parse(session)); }
      catch { localStorage.removeItem('tennis_user_session'); }
    }
  }, []);

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
  const myTotalMatches = myPlayer ? (myPlayer.victorias || 0) + (myPlayer.derrotas || 0) : 0;
  const myWinRate = myTotalMatches > 0 ? Math.round(((myPlayer.victorias || 0) / myTotalMatches) * 100) : 0;
  const myCatInfo = getInfoCategoria(myPlayer?.elo || 1000);

  // Cálculo de barra de progreso
  const puntosEnCat = Math.max(0, (myPlayer?.elo || 1000) - myCatInfo.min);
  const totalRangoCat = myCatInfo.max - myCatInfo.min;
  const faltanParaSubir = Math.max(0, myCatInfo.max + 1 - (myPlayer?.elo || 1000));
  const enPromocion = myTotalMatches >= 5 && puntosEnCat >= (totalRangoCat * 0.90) && myCatInfo.id !== '1ª';

  // Filtrar Mis Desafíos vs Cartelera de la Comunidad
  const misRetos = retosProgramados.filter(r => {
    if (!myPlayer) return false;
    const miNombre = myPlayer.nombre.toLowerCase();
    return r.jugador1.toLowerCase().includes(miNombre) || r.jugador2.toLowerCase().includes(miNombre);
  });

  // --- SUBIDA Y COMPRESIÓN DE FOTOS ---
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setFotoFile(compressed.file);
      setFotoPreview(compressed.preview);
    } catch {
      alert('No se pudo procesar la foto.');
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

  // --- AUTENTICACIÓN Y REGISTRO ---
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
          alert('Este correo o celular ya está registrado. Inicia sesión.');
          setAuthMode('login');
          return;
        }
        setShowAuthModal(false);
        setShowProfileSetup(true);
      } else {
        const { data, error } = await supabase
          .from('jugadores')
          .select('*')
          .eq('email', authEmail.trim())
          .eq('password', authPassword.trim())
          .maybeSingle();
        if (error || !data) return alert('Credenciales incorrectas.');
        setCurrentUser(data);
        localStorage.setItem('tennis_user_session', JSON.stringify(data));
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

  async function handleCompleteProfile(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
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

      const calib = calcularPuntosIniciales(respuestasQuiz);

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
    setCurrentUser(null);
    setTab('perfil');
  }

  // --- CREAR NUEVO DESAFÍO OFICIAL ---
  function handleConfirmarNuevoReto(e) {
    e.preventDefault();
    if (!challengeTargetModal) return;
    const retadorNombre = myPlayer ? myPlayer.nombre : 'Jugador Local';
    const catRetador = myPlayer ? getInfoCategoria(myPlayer.elo).id : '4ª';
    const catRival = getInfoCategoria(challengeTargetModal.elo).id;

    const nuevoReto = {
      id: Date.now(),
      jugador1: retadorNombre,
      jugador2: challengeTargetModal.nombre,
      sede: challengeSede,
      fecha: challengeFecha,
      cat: catRetador === catRival ? `Cat. ${catRetador}` : `Ascenso ${catRetador} vs ${catRival}`,
      estado: 'Programado'
    };

    const actualizados = [nuevoReto, ...retosProgramados];
    setRetosProgramados(actualizados);
    localStorage.setItem('mp_retos_programados', JSON.stringify(actualizados));

    // Abrir WhatsApp con mensaje estructurado
    const telLimpio = (challengeTargetModal.telefono || '964000000').replace(/\D/g, '');
    const msg = `Hola ${challengeTargetModal.nombre}, te he lanzado un desafío oficial por puntos en MATCHPOINT.\n🎾 Sede propuesta: ${challengeSede}\n📅 Horario: ${challengeFecha}\n¿Confirmamos cancha?`;
    window.open(`https://wa.me/51${telLimpio}?text=${encodeURIComponent(msg)}`, '_blank');

    setChallengeTargetModal(null);
    setRetosSubTab('mis_retos');
  }

  // --- MOTOR MATEMÁTICO DE PUNTOS (DIVISOR 1200 + FACTOR DE DOMINIO) ---
  async function handleProcesarPartido(e) {
    e.preventDefault();
    if (!p1Id || !p2Id || !winnerId) return alert('Selecciona ambos tenistas y el ganador.');
    if (p1Id === p2Id) return alert('Los rivales deben ser diferentes.');

    try {
      setCalculatingMatch(true);
      const player1 = jugadores.find(j => j.id.toString() === p1Id);
      const player2 = jugadores.find(j => j.id.toString() === p2Id);

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
      const bono = 10;

      const delta1 = Math.round(K1 * (S1 - E1) * fd + bono);
      const delta2 = Math.round(K2 * (S2 - E2) * fd + bono);

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

      // Si venía de un reto programado, retirarlo de pendientes
      if (activeRetoId) {
        const restantes = retosProgramados.filter(r => r.id !== activeRetoId);
        setRetosProgramados(restantes);
        localStorage.setItem('mp_retos_programados', JSON.stringify(restantes));
        setActiveRetoId(null);
      }

      alert(
        `✅ Resultado Oficial Registrado (${fdLabel})\n\n` +
        `🎾 ${player1.nombre}: ${newElo1} Pts (${delta1 >= 0 ? '+' : ''}${delta1}) · Cat. ${newCat1}\n` +
        `🎾 ${player2.nombre}: ${newElo2} Pts (${delta2 >= 0 ? '+' : ''}${delta2}) · Cat. ${newCat2}`
      );

      setShowMatchModal(false);
      await fetchData();
    } catch (err) {
      alert('Error al procesar resultado: ' + err.message);
    } finally {
      setCalculatingMatch(false);
    }
  }

  // --- REPORTE CLIMÁTICO CON TRAZABILIDAD DE USUARIO ---
  function cambiarClimaSede(clubName) {
    if (!myPlayer) {
      alert('Inicia sesión con tu perfil para reportar el estado del clima con tu nombre.');
      setShowAuthModal(true);
      return;
    }
    const estados = [
      'Soleado / Cancha Seca',
      'Nublado / Jugable',
      'Llovizna leve / Precaución',
      'Lluvia / Cancha Pesada'
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

  const clubStats = SEDES_OFICIALES.map(c => {
    const socios = jugadores.filter(j => j.club === c.nombre);
    const totalPuntos = socios.reduce((sum, j) => sum + (j.elo || 1000), 0);
    return { ...c, sociosCount: socios.length, totalPuntos };
  }).sort((a, b) => b.totalPuntos - a.totalPuntos);

  const previewCalib = calcularPuntosIniciales(respuestasQuiz);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl pb-32 border-x border-slate-800/80 relative">
      
      {/* HEADER OPTIMIZADO CON MARGEN SEGURO (pt-14) Y MARCA ESCALABLE */}
      <header className="pt-14 pb-3.5 px-5 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 flex justify-between items-center sticky top-0 z-30 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-[0_0_20px_rgba(163,230,53,0.45)]">
            🎾
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">
              MATCHPOINT
            </h1>
            <span className="text-[10px] tracking-wider uppercase font-bold text-lime-400 block mt-1">
              Circuito Oficial de Tenis
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {myPlayer ? (
            <button 
              onClick={() => setTab('perfil')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 border border-lime-400/40 px-3 py-1.5 rounded-xl text-xs font-black text-lime-400 shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[85px] truncate">{myPlayer.nombre.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="bg-lime-400 hover:bg-lime-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg"
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
          )}

          <button 
            onClick={() => setShowAdminModal(true)}
            className="p-2 bg-slate-800/90 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-300"
            title="Panel Organizador"
          >
            <Lock className="w-4 h-4 text-lime-400" />
          </button>
        </div>
      </header>

      <main className="p-4 flex-1 space-y-4">

        {/* =========================================================
            1. PESTAÑA: MI PERFIL (PRIMERA A LA IZQUIERDA)
        ========================================================= */}
        {tab === 'perfil' && (
          <div className="space-y-4">
            {myPlayer ? (
              <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-500"></div>

                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    myTotalMatches < 5 
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {myTotalMatches < 5 ? `⚡ Calibrando (${myTotalMatches}/5)` : '✔ Nivel Oficial Verificado'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {myCatInfo.badge}
                  </span>
                </div>

                {/* Foto de Perfil Grande con Cambio Directo */}
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <div 
                    onClick={() => profileAvatarInputRef.current?.click()}
                    className="w-28 h-28 rounded-full bg-slate-800 p-1 border-2 border-lime-400 shadow-[0_0_30px_rgba(163,230,53,0.3)] cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {updatingAvatar ? (
                      <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
                    ) : myPlayer.foto_url ? (
                      <img src={myPlayer.foto_url} alt={myPlayer.nombre} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-14 h-14 text-slate-500" />
                    )}
                  </div>
                  <button
                    onClick={() => profileAvatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-lime-400 text-slate-950 p-2 rounded-full shadow-lg border-2 border-slate-950"
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
                <p className="text-xs text-slate-400 mt-0.5">{myPlayer.club || 'Independiente'}</p>

                <div className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1 rounded-full text-xs font-black uppercase border ${myCatInfo.color}`}>
                  <Trophy className="w-3.5 h-3.5" /> {myCatInfo.nombre}
                </div>

                {enPromocion && (
                  <div className="mt-4 bg-amber-500/15 border border-amber-400/40 rounded-2xl p-3 text-left flex items-center gap-2.5">
                    <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-amber-300 uppercase">¡Match Point de Ascenso!</p>
                      <p className="text-[11px] text-slate-300">Estás a solo {faltanParaSubir} puntos de ascender a la siguiente categoría.</p>
                    </div>
                  </div>
                )}

                {/* Barra de Progreso Explicativa (Sin porcentajes confusos) */}
                {myTotalMatches < 5 ? (
                  <div className="mt-5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/90 text-left">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-slate-300">Fase de Calibración Inicial</span>
                      <span className="text-amber-400 font-mono">Partido {myTotalMatches} de 5</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-lime-400 rounded-full transition-all"
                        style={{ width: `${Math.max(8, (myTotalMatches / 5) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      Te faltan {5 - myTotalMatches} partidos oficiales para fijar tu puesto en el ranking general.
                    </span>
                  </div>
                ) : (
                  <div className="mt-5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/90 text-left">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-slate-300">Progreso en {myCatInfo.id} ({myCatInfo.min}–{myCatInfo.max} Pts)</span>
                      <span className="text-lime-400 font-mono">Faltan {faltanParaSubir} Pts</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(6, Math.round((puntosEnCat / totalRangoCat) * 100)))}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      Acumulas {myPlayer.elo} puntos oficiales en el circuito.
                    </span>
                  </div>
                )}

                {/* 4 Tarjetas de Estadísticas con Terminología Deportiva */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Puesto</span>
                    <span className="text-base font-black text-white font-mono">
                      {myTotalMatches < 5 ? 'Calib.' : `#${myRankPos}`}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Puntos</span>
                    <span className="text-base font-black text-lime-400 font-mono">{myPlayer.elo || 1000}</span>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Récord</span>
                    <span className="text-base font-black text-white font-mono">
                      {myPlayer.victorias || 0}-{myPlayer.derrotas || 0}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Efectividad</span>
                    <span className="text-base font-black text-emerald-400 font-mono">{myWinRate}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
                  <button 
                    onClick={() => { setTab('match'); setRetosSubTab('mis_retos'); }}
                    className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Swords className="w-4 h-4" /> Tus Desafíos
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="bg-slate-800 hover:bg-slate-750 text-rose-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-7 rounded-3xl text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center mx-auto text-lime-400">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Tu Ficha de Tenista</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Completa el test situacional de 4 preguntas para recibir tus puntos iniciales y calibrar tu categoría oficial en 5 partidos.
                  </p>
                </div>
                <div className="flex gap-2.5 justify-center pt-2">
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="bg-lime-400 text-slate-950 font-black px-5 py-3 rounded-xl text-xs shadow-md"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                    className="bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs border border-slate-700"
                  >
                    Crear Cuenta
                  </button>
                </div>
              </div>
            )}

            {/* Clasificación por Niveles y Categorías */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-4 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 block">
                Clasificación por Niveles y Categorías (0 – 5,000+ Puntos)
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {ESCALA_CATEGORIAS.map(c => (
                  <div key={c.id} className="bg-slate-950/70 border border-slate-800/80 px-2.5 py-1.5 rounded-xl flex justify-between items-center">
                    <span className="font-black text-white">{c.id}</span>
                    <span className="font-mono text-lime-400 text-[10px]">{c.min}–{c.max} Pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            2. PESTAÑA: RANKING (CLASIFICACIÓN GENERAL Y CLUBES)
        ========================================================= */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Escalafón Oficial
              </span>
              <h2 className="text-lg font-black text-white mt-0.5">Clasificación General</h2>
              <p className="text-[11px] text-slate-400">Toca a cualquier tenista para ver su ficha completa</p>
              
              <div className="flex gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
                {['Todas', '3ª', '4ª', '5ª A', '5ª B', '5ª P', 'Clubes'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFiltroCat(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 border transition ${
                      filtroCat === cat 
                        ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-sm' 
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {cat === 'Todas' ? 'Todas' : cat === 'Clubes' ? '🏆 Clubes' : `Cat. ${cat}`}
                  </button>
                ))}
              </div>
            </div>

            {filtroCat === 'Clubes' ? (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Clasificación Colectiva de Clubes y Academias
                </h3>
                {clubStats.map((c, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                        i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{i + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{c.nombre}</h4>
                        <p className="text-[11px] text-slate-400">{c.sociosCount} tenistas activos sumando puntos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-mono font-black text-lime-400">{c.totalPuntos}</span>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Puntos</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {loading ? (
                  <div className="text-center py-12 text-slate-500 text-xs">Cargando clasificación...</div>
                ) : jugadores
                    .filter(j => filtroCat === 'Todas' || getInfoCategoria(j.elo || 1000).id === filtroCat)
                    .map((j, idx) => {
                      const catInfo = getInfoCategoria(j.elo || 1000);
                      const totalJ = (j.victorias || 0) + (j.derrotas || 0);
                      return (
                        <div 
                          key={j.id || idx}
                          onClick={() => setSelectedPlayerModal(j)}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer active:scale-[0.99] transition ${
                            idx === 0 
                              ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/40 shadow-md' 
                              : idx === 1 
                              ? 'bg-gradient-to-r from-slate-300/10 via-slate-900 to-slate-900 border-slate-400/30'
                              : idx === 2
                              ? 'bg-gradient-to-r from-amber-700/15 via-slate-900 to-slate-900 border-amber-700/40'
                              : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-7 text-center font-mono font-black text-sm ${
                              idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                              #{idx + 1}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border-2 border-slate-700 shrink-0">
                              {j.foto_url ? (
                                <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-black text-white">{j.nombre}</p>
                                {totalJ < 5 && (
                                  <span className="text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                                    Calib. {totalJ}/5
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {j.club || 'Independiente'} · <span className="text-lime-400 font-bold">Cat. {catInfo.id}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-base font-mono font-black text-lime-400">{j.elo || 1000}</span>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">
                                Puntos
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            3. PESTAÑA CENTRAL: RETOS (3 VISTAS DIFERENCIADAS)
        ========================================================= */}
        {tab === 'match' && (
          <div className="space-y-4">
            {/* Selector de las 3 Sub-Vistas de Retos */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime-400 block">
                    Centro Competitivo
                  </span>
                  <h2 className="text-lg font-black text-white">Desafíos y Partidos</h2>
                </div>
                <button
                  onClick={() => setRetosSubTab('nuevo')}
                  className="bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Crear Desafío
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setRetosSubTab('mis_retos')}
                  className={`py-2 rounded-xl text-[11px] font-black transition ${
                    retosSubTab === 'mis_retos' ? 'bg-lime-400 text-slate-950 shadow' : 'text-slate-400'
                  }`}
                >
                  Tus Desafíos ({misRetos.length})
                </button>
                <button
                  onClick={() => setRetosSubTab('cartelera')}
                  className={`py-2 rounded-xl text-[11px] font-black transition ${
                    retosSubTab === 'cartelera' ? 'bg-lime-400 text-slate-950 shadow' : 'text-slate-400'
                  }`}
                >
                  Cartelera ({retosProgramados.length})
                </button>
                <button
                  onClick={() => setRetosSubTab('nuevo')}
                  className={`py-2 rounded-xl text-[11px] font-black transition ${
                    retosSubTab === 'nuevo' ? 'bg-lime-400 text-slate-950 shadow' : 'text-slate-400'
                  }`}
                >
                  + Nuevo Reto
                </button>
              </div>
            </div>

            {/* VISTA A: TUS DESAFÍOS (CON EL BOTÓN EXCLUSIVO DE SUBIR SCORE) */}
            {retosSubTab === 'mis_retos' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tus Partidos Pendientes
                  </span>
                  <button
                    onClick={() => {
                      if (myPlayer) setP1Id(myPlayer.id.toString());
                      setActiveRetoId(null);
                      setShowMatchModal(true);
                    }}
                    className="text-xs font-black text-lime-400 bg-lime-400/10 border border-lime-400/30 px-3 py-1.5 rounded-xl flex items-center gap-1"
                  >
                    <Swords className="w-3.5 h-3.5" /> + Subir Score
                  </button>
                </div>

                {misRetos.length === 0 ? (
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl text-center space-y-3">
                    <Swords className="w-10 h-10 text-lime-400 mx-auto opacity-80" />
                    <div>
                      <h4 className="text-sm font-black text-white">No tienes desafíos programados hoy</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Reta a un tenista dentro de tu rango de puntos o registra el marcador de tu último partido.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center pt-1">
                      <button
                        onClick={() => setRetosSubTab('nuevo')}
                        className="bg-lime-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs"
                      >
                        Buscar Rival para Retar
                      </button>
                      <button
                        onClick={() => {
                          if (myPlayer) setP1Id(myPlayer.id.toString());
                          setShowMatchModal(true);
                        }}
                        className="bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-700"
                      >
                        Subir Score
                      </button>
                    </div>
                  </div>
                ) : (
                  misRetos.map(r => (
                    <div key={r.id} className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-lime-400/40 p-4 rounded-2xl space-y-3 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase bg-lime-400/15 text-lime-400 border border-lime-400/30 px-2.5 py-0.5 rounded-md">
                          Tu Duelo Oficial · {r.cat}
                        </span>
                        <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {r.estado}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-black text-white">
                          {r.jugador1} <span className="text-lime-400 px-1">vs</span> {r.jugador2}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          📍 {r.sede} · 📅 {r.fecha}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const p1 = jugadores.find(j => j.nombre.toLowerCase().includes(r.jugador1.split(' ')[0].toLowerCase()));
                          const p2 = jugadores.find(j => j.nombre.toLowerCase().includes(r.jugador2.split(' ')[0].toLowerCase()));
                          if (p1) setP1Id(p1.id.toString());
                          if (p2) setP2Id(p2.id.toString());
                          setActiveRetoId(r.id);
                          setShowMatchModal(true);
                        }}
                        className="w-full bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Subir Score de este Partido
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VISTA B: CARTELERA PÚBLICA (MODO ESPECTADOR) */}
            {retosSubTab === 'cartelera' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-lime-400" /> Cartelera de Partidos Oficiales
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Modo Espectador</span>
                </div>
                {retosProgramados.map(r => (
                  <div key={r.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-lime-400 uppercase bg-lime-950/60 border border-lime-800/70 px-2.5 py-0.5 rounded-md">
                        {r.cat} · Por Puntos Oficiales
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">● Programado</span>
                    </div>
                    <p className="text-base font-black text-white">
                      {r.jugador1} <span className="text-lime-400 px-1">vs</span> {r.jugador2}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                      <span>📍 {r.sede}</span>
                      <span>📅 {r.fecha}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VISTA C: CREAR NUEVO DESAFÍO (VENTANA ±1,200 PUNTOS) */}
            {retosSubTab === 'nuevo' && (
              <div className="space-y-2.5">
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-xs text-slate-300">
                  <span className="font-black text-lime-400">Regla de Equidad:</span> Puedes retar a tenistas dentro de una ventana máxima de <span className="font-bold text-white">±1,200 Puntos</span> respecto a tu nivel actual.
                </div>

                {jugadores
                  .filter(j => !myPlayer || j.id !== myPlayer.id)
                  .map((j) => {
                    const diff = myPlayer ? Math.abs((myPlayer.elo || 1000) - (j.elo || 1000)) : 0;
                    const dentroVentana = diff <= 1200;
                    const catJ = getInfoCategoria(j.elo || 1000);

                    return (
                      <div key={j.id} className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        dentroVentana ? 'bg-slate-900 border-slate-800' : 'bg-slate-950/60 border-slate-900 opacity-60'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{j.nombre}</p>
                            <p className="text-xs text-slate-400">
                              Cat. <span className="text-lime-400 font-bold">{catJ.id}</span> · {j.elo || 1000} Pts
                            </p>
                          </div>
                        </div>

                        {dentroVentana ? (
                          <button
                            onClick={() => setChallengeTargetModal(j)}
                            className="bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                          >
                            <Swords className="w-3.5 h-3.5" /> Retar
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
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
            4. PESTAÑA: CANCHAS (FOTOS PATROCINADAS Y CLIMA VERIFICADO)
        ========================================================= */}
        {tab === 'clubs' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-lg">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime-400 block">
                Directorio Oficial
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">Clubes y Canchas</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Consulta disponibilidad por WhatsApp y revisa el reporte del clima verificado por jugadores.
              </p>
            </div>

            {SEDES_OFICIALES.map((c, idx) => {
              const infoClima = climaSedes[c.nombre] || { estado: 'Soleado / Cancha Seca', hora: 'Hoy', reportadoPor: 'Admin' };
              const isRain = infoClima.estado.includes('Lluvia') || infoClima.estado.includes('Llovizna');

              return (
                <div key={idx} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                  {/* Imagen Predeterminada Patrocinada */}
                  <div className="relative h-36 w-full bg-slate-800">
                    <img src={c.img} alt={c.nombre} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
                    <span className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-lime-400 border border-lime-400/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                      ★ {c.sponsor}
                    </span>
                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                      <div>
                        <h4 className="text-base font-black text-white leading-tight">{c.nombre}</h4>
                        <span className="text-xs text-lime-400 font-bold">{c.zona} · {c.canchas}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estado Climático Verificado y Reserva */}
                  <div className="p-4 space-y-3">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/90 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Último Reporte Climático ({infoClima.hora})
                        </span>
                        <p className="text-xs font-black text-white mt-0.5 flex items-center gap-1.5">
                          {isRain ? <CloudRain className="w-4 h-4 text-rose-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                          {infoClima.estado}
                        </p>
                        <span className="text-[10px] text-lime-400/90 font-semibold block mt-0.5">
                          ✔ Reportado por: {infoClima.reportadoPor}
                        </span>
                      </div>
                      <button
                        onClick={() => cambiarClimaSede(c.nombre)}
                        className="bg-slate-800 hover:bg-slate-750 text-[10px] font-black text-slate-200 px-3 py-2 rounded-xl border border-slate-700 shrink-0"
                      >
                        Actualizar Clima
                      </button>
                    </div>

                    <a
                      href={`https://wa.me/51${c.tel}?text=Hola,%20escribo%20desde%20MATCHPOINT%20para%20consultar%20disponibilidad%20de%20cancha%20en%20${encodeURIComponent(c.nombre)}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <Phone className="w-4 h-4" /> Consultar Disponibilidad (WhatsApp)
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================
            5. PESTAÑA: TORNEOS (5 CATEGORÍAS ACTIVAS · MÍNIMO 8)
        ========================================================= */}
        {tab === 'torneos' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-lg">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime-400 block">
                Calendario Oficial
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">Torneos Activos por Categoría</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Requisito oficial: Mínimo 8 participantes inscritos por categoría para aperturar y sortear el cuadro.
              </p>
            </div>

            {TORNEOS_INICIALES.map((t) => {
              const cumpleMinimo = t.inscritos >= t.min;
              const porcentajeCupo = Math.min(100, Math.round((t.inscritos / t.min) * 100));

              return (
                <div key={t.id} className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md border ${
                      cumpleMinimo 
                        ? 'text-lime-400 bg-lime-950/60 border-lime-800/80' 
                        : 'text-amber-300 bg-amber-950/50 border-amber-800/70'
                    }`}>
                      {cumpleMinimo ? '✔ Cuadro Confirmado (+8)' : `⏳ Faltan ${t.min - t.inscritos} para el mínimo`}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Cat. {t.cat}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white">{t.titulo}</h4>
                    <p className="text-xs text-slate-400">{t.subtitulo}</p>
                  </div>

                  {/* Barra de Mínimo 8 Jugadores */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-slate-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-lime-400" /> Inscritos: {t.inscritos} tenistas
                      </span>
                      <span className="text-lime-400 font-mono">Mínimo requerido: {t.min}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cumpleMinimo ? 'bg-lime-400' : 'bg-amber-400'}`}
                        style={{ width: `${porcentajeCupo}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block font-semibold">Sede y Fecha:</span>
                      <span className="font-bold text-white text-[11px]">{t.sede} · {t.fecha}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block font-semibold">Inscripción:</span>
                      <span className="font-black text-lime-400 text-sm">S/ {t.precio}.00</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedTorneoModal(t)}
                    className="w-full bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-md transition"
                  >
                    Inscribirme en Categoría {t.cat} (Yape / Plin)
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================
          MODAL: FICHA PÚBLICA DE TENISTA (AL TOCAR EN EL RANKING)
      ========================================================= */}
      {selectedPlayerModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center relative">
            <button 
              onClick={() => setSelectedPlayerModal(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 p-1 border-2 border-lime-400 mb-3 overflow-hidden flex items-center justify-center">
              {selectedPlayerModal.foto_url ? (
                <img src={selectedPlayerModal.foto_url} alt={selectedPlayerModal.nombre} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <h3 className="text-xl font-black text-white">{selectedPlayerModal.nombre}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{selectedPlayerModal.club || 'Independiente'}</p>

            <div className="inline-block mt-2.5 px-3.5 py-1 rounded-full text-xs font-black uppercase bg-lime-400/15 text-lime-400 border border-lime-400/30">
              {getInfoCategoria(selectedPlayerModal.elo).nombre}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Puntos</span>
                <span className="text-base font-black text-lime-400 font-mono">{selectedPlayerModal.elo || 1000}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Récord</span>
                <span className="text-base font-black text-white font-mono">
                  {selectedPlayerModal.victorias || 0}G-{selectedPlayerModal.derrotas || 0}P
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Efectividad</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {((selectedPlayerModal.victorias || 0) + (selectedPlayerModal.derrotas || 0)) > 0
                    ? Math.round(((selectedPlayerModal.victorias || 0) / ((selectedPlayerModal.victorias || 0) + (selectedPlayerModal.derrotas || 0))) * 100)
                    : 0}%
                </span>
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
                    className="w-full bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Swords className="w-4 h-4" /> Lanzar Desafío Oficial
                  </button>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 text-slate-500 text-xs font-bold py-2.5 rounded-2xl">
                    Fuera de tu ventana de reto (±1,200 Pts)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: PROGRAMAR NUEVO RETO Y PUBLICAR EN CARTELERA
      ========================================================= */}
      {challengeTargetModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-lime-400" /> Programar Desafío Oficial
              </h3>
              <button onClick={() => setChallengeTargetModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarNuevoReto} className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-lime-400 block">Rival Seleccionado</span>
                <p className="text-sm font-black text-white">{challengeTargetModal.nombre}</p>
                <span className="text-xs text-slate-400">{challengeTargetModal.elo || 1000} Puntos · Cat. {getInfoCategoria(challengeTargetModal.elo).id}</span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cancha / Sede Propuesta</label>
                <select
                  value={challengeSede}
                  onChange={(e) => setChallengeSede(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  {SEDES_OFICIALES.map((s, i) => (
                    <option key={i} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Día y Hora Tentativa</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sábado 16:00 hrs"
                  value={challengeFecha}
                  onChange={(e) => setChallengeFecha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 mt-2"
              >
                <Phone className="w-4 h-4" /> Publicar en Cartelera y Coordinar por WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: INICIAR SESIÓN / CREAR CUENTA
      ========================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white">
                {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAuth} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Correo o Celular"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white"
              />
              <input
                type="password"
                required
                placeholder="Contraseña"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-lime-400 text-slate-950 font-black py-3 rounded-xl text-xs"
              >
                {authLoading ? 'Verificando...' : (authMode === 'login' ? 'Entrar' : 'Continuar al Test Técnico')}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="w-full text-center text-xs text-lime-400 font-semibold pt-1"
              >
                {authMode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: TEST TÉCNICO DE CALIBRACIÓN (4 PREGUNTAS)
      ========================================================= */}
      {showProfileSetup && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-black text-white">Calibración Técnica de Nivel</h3>
            <p className="text-xs text-slate-400 mb-3">
              Responde estas 4 situaciones de partido para calcular tus puntos iniciales provisionales (Calibrando 0/5).
            </p>
            <form onSubmit={handleCompleteProfile} className="space-y-3">
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-slate-950 border-2 border-dashed border-lime-400 flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  {isCompressing ? (
                    <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
                  ) : fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-7 h-7 text-lime-400" />
                  )}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <span className="text-[10px] text-slate-400 mt-1">Toca para subir tu foto de la galería</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido *"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp *"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <select
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {SEDES_OFICIALES.map((s, i) => (
                  <option key={i} value={s.nombre}>{s.nombre}</option>
                ))}
                <option value="Independiente">Independiente</option>
              </select>

              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                {PREGUNTAS_FILTRO.map((preg, qIdx) => (
                  <div key={qIdx} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                    <label className="text-[11px] font-black text-lime-400 block mb-1">{preg.titulo}</label>
                    <select
                      value={respuestasQuiz[qIdx]}
                      onChange={(e) => {
                        const nuevo = [...respuestasQuiz];
                        nuevo[qIdx] = parseInt(e.target.value, 10);
                        setRespuestasQuiz(nuevo);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                    >
                      {preg.opciones.map((op, opIdx) => (
                        <option key={opIdx} value={op.pts}>{op.texto}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-lime-400/10 border border-lime-400/30 p-3 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-black text-white">Nivel Provisional: Cat. {previewCalib.cat}</span>
                <span className="text-base font-mono font-black text-lime-400">{previewCalib.elo} Pts</span>
              </div>

              <button
                type="submit"
                disabled={savingPlayer || isCompressing}
                className="w-full bg-lime-400 text-slate-950 font-black py-3 rounded-xl text-xs"
              >
                {savingPlayer ? 'Guardando Ficha...' : 'Confirmar e Ingresar al Circuito'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: SUBIR SCORE OFICIAL (EXCLUSIVO DE TUS RETOS)
      ========================================================= */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-lime-400" /> Subir Score Oficial
              </h3>
              <button onClick={() => setShowMatchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProcesarPartido} className="space-y-3">
              <select
                value={p1Id}
                onChange={(e) => setP1Id(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="">Tenista 1...</option>
                {jugadores.map(j => (
                  <option key={j.id} value={j.id.toString()}>{j.nombre} ({j.elo || 1000} Pts · Cat. {getInfoCategoria(j.elo).id})</option>
                ))}
              </select>

              <select
                value={p2Id}
                onChange={(e) => setP2Id(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="">Tenista 2 (Rival)...</option>
                {jugadores.map(j => (
                  <option key={j.id} value={j.id.toString()}>{j.nombre} ({j.elo || 1000} Pts · Cat. {getInfoCategoria(j.elo).id})</option>
                ))}
              </select>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Marcador: Ej. 6-3, 6-2 o 7-6, 6-7, 10-8"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <span className="text-[10px] text-lime-400 font-bold block mt-1">
                  Factor de Dominio detectado: {calcularFactorDominio(score).label}
                </span>
              </div>

              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
              >
                <option value="">Ganador del encuentro...</option>
                {p1Id && <option value={p1Id}>{jugadores.find(j => j.id.toString() === p1Id)?.nombre}</option>}
                {p2Id && <option value={p2Id}>{jugadores.find(j => j.id.toString() === p2Id)?.nombre}</option>}
              </select>

              <button
                type="submit"
                disabled={calculatingMatch}
                className="w-full bg-lime-400 text-slate-950 font-black py-3 rounded-xl text-xs"
              >
                {calculatingMatch ? 'Actualizando Puntos...' : 'Confirmar y Actualizar Ranking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: INSCRIPCIÓN A TORNEO ESPECÍFICO POR CATEGORÍA
      ========================================================= */}
      {selectedTorneoModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">{selectedTorneoModal.titulo}</h3>
              <button onClick={() => setSelectedTorneoModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
              <QrCode className="w-16 h-16 mx-auto text-lime-400" />
              <p className="text-xs font-black text-white">Yape / Plin Oficial: 964-000000</p>
              <p className="text-[11px] text-slate-400">
                Inscripción: S/ {selectedTorneoModal.precio}.00 · Sede: {selectedTorneoModal.sede}
              </p>
            </div>
            <a
              href={`https://wa.me/51964000000?text=Hola,%20envío%20mi%20comprobante%20de%20S/%20${selectedTorneoModal.precio}%20para%20inscribirme%20en%20${encodeURIComponent(selectedTorneoModal.titulo)}.`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-emerald-500 text-slate-950 font-black py-3 rounded-xl text-xs"
            >
              Enviar Constancia por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: PANEL DE CONTROL ADMIN (PIN 1234)
      ========================================================= */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-lime-400" /> Panel Organizador
              </h3>
              <button onClick={() => { setShowAdminModal(false); setIsAdminAuth(false); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {!isAdminAuth ? (
              <form onSubmit={(e) => { e.preventDefault(); adminPin === '1234' ? setIsAdminAuth(true) : alert('PIN Incorrecto'); }} className="space-y-3">
                <input
                  type="password"
                  placeholder="PIN (1234)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg tracking-widest text-lime-400 font-mono"
                />
                <button type="submit" className="w-full bg-lime-400 text-slate-950 font-black py-2.5 rounded-xl text-xs">
                  Desbloquear
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-lime-400 block">Resumen de Torneos Activos</span>
                  <p className="text-white font-bold mt-1">5 Categorías Abiertas (Mín. 8 por cuadro)</p>
                </div>
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="block w-full bg-slate-800 text-center py-2.5 rounded-xl font-bold text-lime-400">
                  Abrir Base de Datos Supabase ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          BARRA DE NAVEGACIÓN INFERIOR CON BOTÓN CENTRAL CIRCULAR
      ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center py-2.5 pb-5 px-2 z-40">
        <button 
          onClick={() => setTab('perfil')} 
          className={`flex flex-col items-center text-[10px] w-14 transition ${tab === 'perfil' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <User className="w-5 h-5 mb-1" /> Mi Perfil
        </button>

        <button 
          onClick={() => setTab('ranking')} 
          className={`flex flex-col items-center text-[10px] w-14 transition ${tab === 'ranking' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <Trophy className="w-5 h-5 mb-1" /> Ranking
        </button>

        {/* BOTÓN CENTRAL DESTACADO Y CIRCULAR: RETOS */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => setTab('match')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.45)] border-4 border-slate-950 transition transform active:scale-95 ${
              tab === 'match' 
                ? 'bg-gradient-to-br from-lime-300 to-emerald-400 text-slate-950' 
                : 'bg-lime-400 text-slate-950'
            }`}
          >
            <Swords className="w-6 h-6" />
          </button>
          <span className={`text-[10px] mt-1 font-black tracking-tight ${tab === 'match' ? 'text-lime-400' : 'text-slate-300'}`}>
            Retos
          </span>
        </div>

        <button 
          onClick={() => setTab('clubs')} 
          className={`flex flex-col items-center text-[10px] w-14 transition ${tab === 'clubs' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <MapPin className="w-5 h-5 mb-1" /> Canchas
        </button>

        <button 
          onClick={() => setTab('torneos')} 
          className={`flex flex-col items-center text-[10px] w-14 transition ${tab === 'torneos' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <Calendar className="w-5 h-5 mb-1" /> Torneos
        </button>
      </nav>
    </div>
  );
}
