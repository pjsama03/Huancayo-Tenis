import React, { useState, useEffect } from 'react';
import { 
  Trophy, Swords, MapPin, User, Plus, X, Phone, Shield, 
  Calendar, Award, QrCode, Lock, CloudRain, Sun, 
  AlertTriangle, Users, LogIn, LogOut, Camera, Loader2
} from 'lucide-react';
import { supabase } from './supabaseClient';

// --- UTILIDAD DE COMPRESIÓN NATIVA DE IMÁGENES ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Reducir la imagen a un máximo de 800x800 px
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG comprimido al 80% de calidad
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Fallo en la compresión del canvas"));
            return;
          }
          const newFile = new File([blob], `avatar_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve({ file: newFile, preview: canvas.toDataURL('image/jpeg', 0.8) });
        }, 'image/jpeg', 0.8);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function App() {
  const [tab, setTab] = useState('ranking');
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sesión y Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Formulario Auth
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Formulario Perfil con Foto
  const [nombre, setNombre] = useState('');
  const [club, setClub] = useState('Country Club Huancayo');
  const [categoria, setCategoria] = useState('4ª');
  const [telefono, setTelefono] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);

  // Modales
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);

  // Panel Admin
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const precioTorneo = 40;

  // Formulario Partido ELO
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [score, setScore] = useState('6-4, 6-3');
  const [winnerId, setWinnerId] = useState('');
  const [calculatingMatch, setCalculatingMatch] = useState(false);

  // Clima
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
    checkLocalSession();
  }, []);

  function checkLocalSession() {
    const session = localStorage.getItem('tennis_user_session');
    if (session) {
      try {
        setCurrentUser(JSON.parse(session));
      } catch (e) {
        localStorage.removeItem('tennis_user_session');
      }
    }
  }

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

  // --- PROCESAMIENTO SILENCIOSO DE LA FOTO ---
  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setFotoFile(compressed.file);
        setFotoPreview(compressed.preview);
      } catch (error) {
        console.error("Error optimizando la imagen:", error);
        alert("Hubo un problema al preparar tu foto. Intenta con otra.");
      } finally {
        setIsCompressing(false);
      }
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
        setShowProfileSetup(true);
      } else {
        const { data, error } = await supabase
          .from('jugadores')
          .select('*')
          .eq('email', authEmail.trim())
          .eq('password', authPassword.trim())
          .maybeSingle();

        if (error || !data) {
          alert('Credenciales no válidas.');
          return;
        }

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
        // Generar un nombre único para el archivo
        const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fotoFile);

        if (uploadError) {
          console.error('Error subiendo imagen a Supabase:', uploadError);
          alert('Tu perfil se creará, pero hubo un error guardando la foto. Verifica los permisos de Storage.');
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          publicFotoUrl = publicUrlData.publicUrl;
        }
      }

      const { data, error } = await supabase.from('jugadores').insert([
        {
          email: authEmail.trim(),
          password: authPassword.trim(),
          nombre: nombre.trim(),
          club: club.trim(),
          categoria,
          telefono: telefono.trim(),
          foto_url: publicFotoUrl,
          elo: 1200,
          victorias: 0,
          derrotas: 0
        },
      ]).select();

      if (error) throw error;

      if (data && data[0]) {
        setCurrentUser(data[0]);
        localStorage.setItem('tennis_user_session', JSON.stringify(data[0]));
      }

      setShowProfileSetup(false);
      setAuthEmail('');
      setAuthPassword('');
      setNombre('');
      setTelefono('');
      setFotoFile(null);
      setFotoPreview(null);
      await fetchData();
      setTab('perfil');
    } catch (err) {
      alert('Error guardando perfil: ' + err.message);
    } finally {
      setSavingPlayer(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('tennis_user_session');
    setCurrentUser(null);
    setTab('ranking');
  }

  async function handleProcesarPartido(e) {
    e.preventDefault();
    if (!p1Id || !p2Id || !winnerId) {
      alert('Selecciona ambos rivales y el ganador.');
      return;
    }
    if (p1Id === p2Id) {
      alert('Los tenistas deben ser diferentes.');
      return;
    }

    try {
      setCalculatingMatch(true);
      const player1 = jugadores.find(j => j.id.toString() === p1Id);
      const player2 = jugadores.find(j => j.id.toString() === p2Id);

      const R1 = player1.elo || 1200;
      const R2 = player2.elo || 1200;
      const K = 32;

      const expected1 = 1 / (1 + Math.pow(10, (R2 - R1) / 400));
      const expected2 = 1 / (1 + Math.pow(10, (R1 - R2) / 400));

      const actual1 = winnerId === p1Id ? 1 : 0;
      const actual2 = winnerId === p2Id ? 1 : 0;

      const delta1 = Math.round(K * (actual1 - expected1));
      const delta2 = Math.round(K * (actual2 - expected2));

      const newElo1 = Math.max(800, R1 + delta1);
      const newElo2 = Math.max(800, R2 + delta2);

      await supabase.from('jugadores').update({
        elo: newElo1,
        victorias: (player1.victorias || 0) + (actual1 === 1 ? 1 : 0),
        derrotas: (player1.derrotas || 0) + (actual1 === 0 ? 1 : 0)
      }).eq('id', player1.id);

      await supabase.from('jugadores').update({
        elo: newElo2,
        victorias: (player2.victorias || 0) + (actual2 === 1 ? 1 : 0),
        derrotas: (player2.derrotas || 0) + (actual2 === 0 ? 1 : 0)
      }).eq('id', player2.id);

      alert(`✅ Partido Oficial Registrado:\n\n` +
            `${player1.nombre}: ${newElo1} ELO (${delta1 >= 0 ? '+' : ''}${delta1})\n` +
            `${player2.nombre}: ${newElo2} ELO (${delta2 >= 0 ? '+' : ''}${delta2})`);

      setShowMatchModal(false);
      await fetchData();
    } catch (err) {
      alert('Error procesando score: ' + err.message);
    } finally {
      setCalculatingMatch(false);
    }
  }

  function reportarLluvia(clubName) {
    const actual = climaSedes[clubName]?.estado;
    const nuevo = actual.includes('Lluvia') ? 'Seco / Jugable' : 'Lluvia / Cancha Pesada';
    setClimaSedes({
      ...climaSedes,
      [clubName]: { estado: nuevo, hora: 'Ahora mismo' }
    });
  }

  function handleVerifyAdmin(e) {
    e.preventDefault();
    if (adminPin === '1234') {
      setIsAdminAuth(true);
    } else {
      alert('PIN de Administrador Incorrecto');
    }
  }

  const clubStats = clubesHuancayo.map(c => {
    const socios = jugadores.filter(j => j.club === c.nombre);
    const totalElo = socios.reduce((sum, j) => sum + (j.elo || 1200), 0);
    return { ...c, sociosCount: socios.length, totalElo };
  }).sort((a, b) => b.totalElo - a.totalElo);

  const myPlayer = currentUser ? jugadores.find(j => j.id === currentUser.id) || currentUser : null;
  const myRankPos = myPlayer ? jugadores.findIndex(j => j.id === myPlayer.id) + 1 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl pb-24 border-x border-slate-800 relative">
      
      <header className="px-5 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center font-black text-slate-950 text-base shadow-[0_0_15px_rgba(163,230,53,0.35)]">
            🎾
          </div>
          <div>
            <span className="text-[10px] tracking-widest uppercase font-black text-lime-400 block leading-none">Huancayo Circuit</span>
            <h1 className="text-base font-black tracking-tight text-white leading-tight">MATCHPOINT</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser ? (
            <button 
              onClick={() => setTab('perfil')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold text-lime-400"
            >
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[75px] truncate">{currentUser.nombre.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="bg-lime-400 hover:bg-lime-300 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-md shadow-lime-500/10"
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
          )}

          <button 
            onClick={() => setShowAdminModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300"
          >
            <Lock className="w-4 h-4 text-lime-400" />
          </button>
        </div>
      </header>

      <main className="p-4 flex-1 space-y-4">
        {/* RANKING */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400">Circuito Oficial Huancayo</span>
                <h2 className="text-base font-black text-white">Tabla ELO</h2>
                <p className="text-xs text-slate-400">K=32 · {jugadores.length} tenistas</p>
              </div>
              <button
                onClick={() => setShowMatchModal(true)}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-lime-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Swords className="w-4 h-4" /> Score
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Copa de Clubes</h3>
              <div className="grid grid-cols-2 gap-2">
                {clubStats.slice(0, 4).map((c, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                    <span className="text-[10px] font-mono text-lime-400 font-bold block">#{i + 1} {c.nombre.replace('Club ', '')}</span>
                    <span className="text-sm font-black text-white">{c.totalElo} pts</span>
                    <span className="text-[10px] text-slate-500 block">{c.sociosCount} tenistas</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ranking Individual</h3>
              {loading ? (
                <div className="text-center py-10 text-slate-500 text-xs">Cargando circuito...</div>
              ) : jugadores.map((j, idx) => (
                <div 
                  key
