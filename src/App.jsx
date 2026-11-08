import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Swords, MapPin, User, X, Phone, Shield, 
  Calendar, QrCode, Lock, CloudRain, Sun, 
  LogIn, LogOut, Camera, Loader2, Sparkles, Flame
} from 'lucide-react';
import { supabase } from './supabaseClient';

// --- COMPRESIÓN NATIVA DE IMÁGENES (HTML5 CANVAS -> JPEG LIGERO) ---
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

// --- ESCALA OFICIAL HUANCAYO (0 A 5,500+ ELO) ---
const ESCALA_CATEGORIAS = [
  { id: '5ª P', nombre: '5ª P · Principiante', min: 0, max: 600, badge: 'Bronce Base', color: 'text-amber-500 border-amber-500/30 bg-amber-500/10' },
  { id: '5ª B', nombre: '5ª B · Inicial', min: 601, max: 1200, badge: 'Bronce Avanzado', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  { id: '5ª A', nombre: '5ª A · Consolidado', min: 1201, max: 1800, badge: 'Hierro Competitivo', color: 'text-sky-400 border-sky-400/30 bg-sky-400/10' },
  { id: '4ª', nombre: '4ª Categoría', min: 1801, max: 2800, badge: 'Plata Huancayo', color: 'text-slate-200 border-slate-400/40 bg-slate-400/10' },
  { id: '3ª', nombre: '3ª · Olimpo Huancayo', min: 2801, max: 3800, badge: 'Oro Local', color: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/15' },
  { id: '2ª', nombre: '2ª · Zafiro Nacional', min: 3801, max: 4800, badge: 'Zafiro Élite', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/15' },
  { id: '1ª', nombre: '1ª · Corona Pro', min: 4801, max: 6000, badge: 'Corona Pro', color: 'text-lime-400 border-lime-400/50 bg-lime-400/15' }
];

const getInfoCategoria = (elo = 1000) => {
  return ESCALA_CATEGORIAS.find(c => elo >= c.min && elo <= c.max) || ESCALA_CATEGORIAS[6];
};

// --- CUESTIONARIO TÉCNICO SITUACIONAL (4 PREGUNTAS) ---
const PREGUNTAS_FILTRO = [
  {
    titulo: '1. Segundo saque en punto de quiebre (30-40)',
    opciones: [
      { texto: 'Empuje suave ("cuchara") para asegurar que pase la red', pts: 0 },
      { texto: 'Mismo gesto que el primero pero lento; a veces doble falta', pts: 1 },
      { texto: 'Saque regular colocado para poner la bola en juego', pts: 2 },
      { texto: 'Slice o kick profundo con dirección para no quedar vendido', pts: 3 },
      { texto: 'Varío efecto, bote y velocidad buscando ventaja directa', pts: 4 }
    ]
  },
  {
    titulo: '2. Dinámica de peloteo desde el fondo de cancha',
    opciones: [
      { texto: '2 o 3 intercambios y la pelota se va larga o a la malla', pts: 0 },
      { texto: 'Sostengo 4 a 6 tiros si la bola viene cómoda al centro', pts: 1 },
      { texto: 'Más de 8 peloteos cruzados y acelero bolas cortas', pts: 2 },
      { texto: 'Topspin consistente, cambio de cruzado a paralelo con control', pts: 3 },
      { texto: 'Domino ritmo, peso de bola, retroceso y contraataque', pts: 4 }
    ]
  },
  {
    titulo: '3. Respuesta ante bola rápida o pesada a las esquinas',
    opciones: [
      { texto: 'No llego a armar a tiempo y bloqueo como puedo o fallo', pts: 0 },
      { texto: 'La paso alta al medio tratando únicamente de no fallar', pts: 1 },
      { texto: 'Defiendo con globo alto para recuperar el centro de la cancha', pts: 2 },
      { texto: 'Ajusto apoyos rápido y devuelvo profundo con slice o drive', pts: 3 },
      { texto: 'Neutralizo el peso rival y contraataco o tiro drop-shot', pts: 4 }
    ]
  },
  {
    titulo: '4. Historial competitivo en partidos y torneos',
    opciones: [
      { texto: 'Solo peloteos recreativos; casi no juego sets oficiales', pts: 0 },
      { texto: 'Partidos amistosos esporádicos con amigos', pts: 1 },
      { texto: 'Partidos frecuentes de club/academia con sets y tie-breaks', pts: 2 },
      { texto: 'Torneos internos de clubes en Huancayo superando rondas', pts: 3 },
      { texto: 'Finales/semis en 4ª o 3ª abierta, o soy entrenador/profesor', pts: 4 }
    ]
  }
];

const calcularEloProvisional = (resp) => {
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

export default function App() {
  const [tab, setTab] = useState('perfil');
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('Todas');

  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);

  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const precioTorneo = 40;

  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [score, setScore] = useState('6-4, 6-3');
  const [winnerId, setWinnerId] = useState('');
  const [calculatingMatch, setCalculatingMatch] = useState(false);

  const [climaSedes, setClimaSedes] = useState({
    'Country Club Huancayo': { estado: 'Seco / Jugable', hora: 'Hace 15m' },
    'Club Tauro Tenis': { estado: 'Techado / Óptimo', hora: 'Hace 30m' },
    'Academia Romina Cutipa': { estado: 'Llovizna leve', hora: 'Hace 5m' },
    'Complejo Shyam Huilca': { estado: 'Seco / Jugable', hora: 'Hace 1h' }
  });

  const clubesHuancayo = [
    { nombre: 'Country Club Huancayo', canchas: '3 Arcilla', zona: 'El Tambo', tel: '964123456' },
    { nombre: 'Club Tauro Tenis', canchas: '2 Arcilla techadas', zona: 'San Carlos', tel: '954987654' },
    { nombre: 'Academia Romina Cutipa', canchas: '2 Arcilla', zona: 'Huancayo Este', tel: '999555444' },
    { nombre: 'Complejo Shyam Huilca', canchas: '1 Rápida / 1 Arcilla', zona: 'Chilca', tel: '988333222' }
  ];

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
          alert('Este usuario ya existe. Inicia sesión.');
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

      const calib = calcularEloProvisional(respuestasQuiz);

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

  async function handleProcesarPartido(e) {
    e.preventDefault();
    if (!p1Id || !p2Id || !winnerId) return alert('Completa los jugadores y el ganador.');
    if (p1Id === p2Id) return alert('Los rivales deben ser distintos.');

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

      alert(
        `✅ Partido Oficial Procesado (${fdLabel})\n\n` +
        `🎾 ${player1.nombre}: ${newElo1} pts (${delta1 >= 0 ? '+' : ''}${delta1}) · Cat. ${newCat1}\n` +
        `🎾 ${player2.nombre}: ${newElo2} pts (${delta2 >= 0 ? '+' : ''}${delta2}) · Cat. ${newCat2}`
      );

      setShowMatchModal(false);
      await fetchData();
    } catch (err) {
      alert('Error al procesar partido: ' + err.message);
    } finally {
      setCalculatingMatch(false);
    }
  }

  function reportarLluvia(clubName) {
    const actual = climaSedes[clubName]?.estado || '';
    const nuevo = actual.includes('Lluvia') ? 'Seco / Jugable' : 'Lluvia / Cancha Pesada';
    setClimaSedes({ ...climaSedes, [clubName]: { estado: nuevo, hora: 'Ahora mismo' } });
  }

  const clubStats = clubesHuancayo.map(c => {
    const socios = jugadores.filter(j => j.club === c.nombre);
    const totalElo = socios.reduce((sum, j) => sum + (j.elo || 1000), 0);
    return { ...c, sociosCount: socios.length, totalElo };
  }).sort((a, b) => b.totalElo - a.totalElo);

  const myPlayer = currentUser ? jugadores.find(j => j.id === currentUser.id) || currentUser : null;
  const myRankPos = myPlayer ? jugadores.findIndex(j => j.id === myPlayer.id) + 1 : 0;
  const myTotalMatches = myPlayer ? (myPlayer.victorias || 0) + (myPlayer.derrotas || 0) : 0;
  const myWinRate = myTotalMatches > 0 ? Math.round(((myPlayer.victorias || 0) / myTotalMatches) * 100) : 0;
  const myCatInfo = getInfoCategoria(myPlayer?.elo || 1000);
  const progresoCat = myPlayer
    ? Math.min(100, Math.max(5, Math.round(((myPlayer.elo - myCatInfo.min) / (myCatInfo.max - myCatInfo.min)) * 100)))
    : 0;
  const enPromocion = progresoCat >= 92 && myCatInfo.id !== '1ª';

  const jugadoresFiltrados = jugadores.filter(j => {
    if (filtroCat === 'Todas') return true;
    return getInfoCategoria(j.elo || 1000).id === filtroCat;
  });

  const previewCalib = calcularEloProvisional(respuestasQuiz);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl pb-28 border-x border-slate-800/80 relative">
      
      {/* HEADER OPTIMIZADO CON ESPACIO SUPERIOR (pt-11) PARA CELULARES */}
      <header className="pt-11 pb-3.5 px-5 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 flex justify-between items-center sticky top-0 z-30 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-[0_0_20px_rgba(163,230,53,0.45)]">
            🎾
          </div>
          <div>
            <span className="text-[10px] tracking-widest uppercase font-extrabold text-lime-400 block leading-none">
              Huancayo Circuit
            </span>
            <h1 className="text-lg font-black tracking-tight text-white leading-tight mt-0.5">
              MATCHPOINT
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {myPlayer ? (
            <button 
              onClick={() => setTab('perfil')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 border border-lime-400/40 px-3 py-1.5 rounded-xl text-xs font-black text-lime-400"
            >
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[90px] truncate">{myPlayer.nombre.split(' ')[0]}</span>
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
          >
            <Lock className="w-4 h-4 text-lime-400" />
          </button>
        </div>
      </header>

      <main className="p-4 flex-1 space-y-4">

        {/* 1. MI PERFIL (PRIMERO A LA IZQUIERDA, GRANDE E INTERACTIVO) */}
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
                    {myTotalMatches < 5 ? `⚡ Calibrando (${myTotalMatches}/5)` : '✔ Ranking Oficial'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {myCatInfo.badge}
                  </span>
                </div>

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
                      <p className="text-[11px] text-slate-300">A {myCatInfo.max + 1 - (myPlayer.elo || 0)} pts de subir de categoría.</p>
                    </div>
                  </div>
                )}

                <div className="mt-5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/90 text-left">
                  <div className="flex justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-slate-400">Rango {myCatInfo.id} ({myCatInfo.min}–{myCatInfo.max} pts)</span>
                    <span className="text-lime-400 font-mono">{progresoCat}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full"
                      style={{ width: `${progresoCat}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Puesto</span>
                    <span className="text-base font-black text-white font-mono">
                      {myTotalMatches < 5 ? 'Calib.' : `#${myRankPos}`}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">ELO</span>
                    <span className="text-base font-black text-lime-400 font-mono">{myPlayer.elo || 1000}</span>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Récord</span>
                    <span className="text-base font-black text-white font-mono">
                      {myPlayer.victorias || 0}-{myPlayer.derrotas || 0}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Win Rate</span>
                    <span className="text-base font-black text-emerald-400 font-mono">{myWinRate}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
                  <button 
                    onClick={() => setTab('match')}
                    className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Swords className="w-4 h-4" /> Ir a Retos
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="bg-slate-800 hover:bg-slate-750 text-rose-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <LogOut className="w-4 h-4" /> Salir
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-7 rounded-3xl text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center mx-auto text-lime-400">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Tu Ficha Oficial ELO</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Responde las 4 preguntas técnicas situacionales para calibrar tu ELO inicial y competir en Huancayo.
                  </p>
                </div>
                <div className="flex gap-2.5 justify-center pt-2">
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="bg-lime-400 text-slate-950 font-black px-5 py-3 rounded-xl text-xs"
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

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-4 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 block">
                Bandas Oficiales ELO Huancayo (0 – 5,000+ pts)
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {ESCALA_CATEGORIAS.map(c => (
                  <div key={c.id} className="bg-slate-950/70 border border-slate-800/80 px-2.5 py-1.5 rounded-xl flex justify-between items-center">
                    <span className="font-black text-white">{c.id}</span>
                    <span className="font-mono text-lime-400 text-[10px]">{c.min}–{c.max} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. RANKING (CLASIFICACIÓN GENERAL PRIMERO, SIN BOTÓN SUBIR SCORE) */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Circuito Oficial Huancayo
              </span>
              <h2 className="text-lg font-black text-white mt-0.5">Clasificación General ELO</h2>
              <div className="flex gap-1.5 overflow-x-auto pt-3 pb-1">
                {['Todas', '3ª', '4ª', '5ª A', '5ª B', '5ª P'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFiltroCat(cat)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black shrink-0 border ${
                      filtroCat === cat 
                        ? 'bg-lime-400 text-slate-950 border-lime-400' 
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {cat === 'Todas' ? 'Todas' : `Cat. ${cat}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                <div className="text-center py-12 text-slate-500 text-xs">Cargando clasificación...</div>
              ) : jugadoresFiltrados.map((j, idx) => {
                const catInfo = getInfoCategoria(j.elo || 1000);
                const totalJ = (j.victorias || 0) + (j.derrotas || 0);
                return (
                  <div 
                    key={j.id || idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      idx === 0 
                        ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/40' 
                        : idx === 1 
                        ? 'bg-gradient-to-r from-slate-300/10 via-slate-900 to-slate-900 border-slate-400/30'
                        : idx === 2
                        ? 'bg-gradient-to-r from-amber-700/15 via-slate-900 to-slate-900 border-amber-700/40'
                        : 'bg-slate-900/90 border-slate-800/80'
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
                          {j.club || 'Independiente'} · <span className="text-lime-400 font-black">Cat. {catInfo.id}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-mono font-black text-lime-400">{j.elo || 1000}</span>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">
                        {j.victorias || 0}G - {j.derrotas || 0}P
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Copa de Clubes (Acumulado ELO)
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {clubStats.map((c, i) => (
                  <div key={i} className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-mono text-lime-400 font-extrabold block">
                      #{i + 1} {c.nombre.replace('Club ', '')}
                    </span>
                    <span className="text-sm font-black text-white mt-0.5 block">{c.totalElo} pts</span>
                    <span className="text-[10px] text-slate-500 block">{c.sociosCount} tenistas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. RETOS (ÚNICO BOTÓN SUBIR SCORE + VENTANA ±1,200 PTS) */}
        {tab === 'match' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center shadow-lg">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-lime-400" /> Desafíos Directos
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ventana oficial permitida: ±1,200 pts ELO
                </p>
              </div>
              <button
                onClick={() => setShowMatchModal(true)}
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black px-3.5 py-2.5 rounded-xl shadow-md"
              >
                + Subir Score
              </button>
            </div>

            <div className="space-y-2.5">
              {jugadores
                .filter(j => !myPlayer || j.id !== myPlayer.id)
                .map((j) => {
                  const diff = myPlayer ? Math.abs((myPlayer.elo || 1000) - (j.elo || 1000)) : 0;
                  const dentroVentana = diff <= 1200;
                  const catJ = getInfoCategoria(j.elo || 1000);

                  return (
                    <div key={j.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
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
                            Cat. <span className="text-lime-400 font-bold">{catJ.id}</span> · {j.elo || 1000} pts
                          </p>
                        </div>
                      </div>

                      {dentroVentana ? (
                        <a
                          href={`https://wa.me/51${(j.telefono || '964000000').replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(j.nombre)},%20jugamos%20un%20reto%20por%20puntos%20en%20MatchPoint%20Huancayo?`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" /> Retar
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                          Fuera de rango
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 4. CANCHAS */}
        {tab === 'clubs' && (
          <div className="space-y-3">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-black text-white">Estado de Canchas en Huancayo</h3>
              <p className="text-xs text-slate-400 mt-1">Toca el estado climático para reportar lluvia o cancha lista.</p>
            </div>

            {clubesHuancayo.map((c, idx) => {
              const infoClima = climaSedes[c.nombre] || { estado: 'Seco', hora: 'Hoy' };
              const isRain = infoClima.estado.includes('Lluvia');
              return (
                <div key={idx} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-white">{c.nombre}</h4>
                      <span className="text-xs text-lime-400 font-bold">{c.zona} · {c.canchas}</span>
                    </div>
                    <button
                      onClick={() => reportarLluvia(c.nombre)}
                      className={`text-[10px] px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 border ${
                        isRain ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isRain ? <CloudRain className="w-3.5 h-3.5 text-rose-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                      {infoClima.estado}
                    </button>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Reporte: {infoClima.hora}</span>
                    <a href={`https://wa.me/51${c.tel}`} target="_blank" rel="noreferrer" className="text-emerald-400 font-black">
                      Reservar Cancha ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. TORNEOS */}
        {tab === 'torneos' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black text-lime-400 bg-lime-950/60 border border-lime-800/80 px-2.5 py-0.5 rounded-md">
                  Inscripciones Abiertas
                </span>
                <span className="text-xs text-slate-400">Por Categoría Oficial</span>
              </div>
              <h3 className="text-lg font-black text-white">Copa Apertura Bimestral Huancayo</h3>
              <p className="text-xs text-slate-400">
                Cuadros paralelos en 5ª P, 5ª B, 5ª A, 4ª y 3ª. Clasifica al Masters de Fin de Año (Top 8 de cada categoría).
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block font-semibold">Inscripción:</span>
                  <span className="font-black text-lime-400 text-sm">S/ {precioTorneo}.00</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Sede:</span>
                  <span className="font-black text-white text-sm">Country Club</span>
                </div>
              </div>
              <button 
                onClick={() => setShowTournamentModal(true)}
                className="w-full bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-3 rounded-2xl text-xs"
              >
                Inscribirme vía Yape / Plin
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL LOGIN / REGISTRO */}
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
                {authLoading ? 'Verificando...' : (authMode === 'login' ? 'Entrar' : 'Continuar al Test ELO')}
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

      {/* MODAL TEST DE CALIBRACIÓN ELO (4 PREGUNTAS) */}
      {showProfileSetup && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-black text-white">Calibración Técnica ELO</h3>
            <p className="text-xs text-slate-400 mb-3">
              Responde las 4 situaciones de cancha para asignar tu ELO provisional (Calibrando 0/5).
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
                <span className="text-[10px] text-slate-400 mt-1">Toca para elegir foto de tu galería</span>
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
                <option value="Country Club Huancayo">Country Club Huancayo</option>
                <option value="Club Tauro Tenis">Club Tauro Tenis</option>
                <option value="Academia Romina Cutipa">Academia Romina Cutipa</option>
                <option value="Complejo Shyam Huilca">Complejo Shyam Huilca</option>
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
                <span className="text-xs font-black text-white">Provisional: Cat. {previewCalib.cat}</span>
                <span className="text-base font-mono font-black text-lime-400">{previewCalib.elo} ELO</span>
              </div>

              <button
                type="submit"
                disabled={savingPlayer || isCompressing}
                className="w-full bg-lime-400 text-slate-950 font-black py-3 rounded-xl text-xs"
              >
                {savingPlayer ? 'Guardando Ficha...' : 'Confirmar y Entrar al Circuito'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUBIR SCORE */}
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
                  <option key={j.id} value={j.id.toString()}>{j.nombre} ({j.elo || 1000} pts · {getInfoCategoria(j.elo).id})</option>
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
                  <option key={j.id} value={j.id.toString()}>{j.nombre} ({j.elo || 1000} pts · {getInfoCategoria(j.elo).id})</option>
                ))}
              </select>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Marcador: Ej. 6-3, 6-2"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <span className="text-[10px] text-lime-400 font-bold block mt-1">
                  Impacto: {calcularFactorDominio(score).label}
                </span>
              </div>

              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
              >
                <option value="">Ganador del partido...</option>
                {p1Id && <option value={p1Id}>{jugadores.find(j => j.id.toString() === p1Id)?.nombre}</option>}
                {p2Id && <option value={p2Id}>{jugadores.find(j => j.id.toString() === p2Id)?.nombre}</option>}
              </select>

              <button
                type="submit"
                disabled={calculatingMatch}
                className="w-full bg-lime-400 text-slate-950 font-black py-3 rounded-xl text-xs"
              >
                {calculatingMatch ? 'Calculando ELO...' : 'Confirmar Resultado'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TORNEO */}
      {showTournamentModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Inscripción Copa Apertura</h3>
              <button onClick={() => setShowTournamentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
              <QrCode className="w-16 h-16 mx-auto text-lime-400" />
              <p className="text-xs font-black text-white">Yape / Plin: 964-000000</p>
              <p className="text-[11px] text-slate-400">Monto: S/ {precioTorneo}.00</p>
            </div>
            <a
              href={`https://wa.me/51964000000?text=Hola,%20envío%20comprobante%20de%20S/%20${precioTorneo}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-emerald-500 text-slate-950 font-black py-3 rounded-xl text-xs"
            >
              Enviar Constancia por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* MODAL ADMIN */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-lime-400" /> Panel Admin
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
                  <span className="text-[10px] font-bold uppercase text-lime-400 block">Recaudación Torneo</span>
                  <p className="text-white font-bold mt-1">16 inscritos × S/ {precioTorneo} = <span className="text-emerald-400">S/ {16 * precioTorneo}.00</span></p>
                </div>
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="block w-full bg-slate-800 text-center py-2.5 rounded-xl font-bold text-lime-400">
                  Abrir Supabase ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR (MI PERFIL PRIMERO A LA IZQUIERDA) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex justify-around py-3 pb-5 px-1 z-40">
        <button onClick={() => setTab('perfil')} className={`flex flex-col items-center text-[10px] ${tab === 'perfil' ? 'text-lime-400 font-black' : 'text-slate-400'}`}>
          <User className="w-4 h-4 mb-1" /> Mi Perfil
        </button>
        <button onClick={() => setTab('ranking')} className={`flex flex-col items-center text-[10px] ${tab === 'ranking' ? 'text-lime-400 font-black' : 'text-slate-400'}`}>
          <Trophy className="w-4 h-4 mb-1" /> Ranking
        </button>
        <button onClick={() => setTab('match')} className={`flex flex-col items-center text-[10px] ${tab === 'match' ? 'text-lime-400 font-black' : 'text-slate-400'}`}>
          <Swords className="w-4 h-4 mb-1" /> Retos
        </button>
        <button onClick={() => setTab('clubs')} className={`flex flex-col items-center text-[10px] ${tab === 'clubs' ? 'text-lime-400 font-black' : 'text-slate-400'}`}>
          <MapPin className="w-4 h-4 mb-1" /> Canchas
        </button>
        <button onClick={() => setTab('torneos')} className={`flex flex-col items-center text-[10px] ${tab === 'torneos' ? 'text-lime-400 font-black' : 'text-slate-400'}`}>
          <Calendar className="w-4 h-4 mb-1" /> Torneos
        </button>
      </nav>
    </div>
  );
}
