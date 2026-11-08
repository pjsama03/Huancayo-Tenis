import React, { useState, useEffect } from 'react';
import { 
  Trophy, Swords, MapPin, User, Plus, X, Phone, Shield, 
  Calendar, Award, QrCode, Lock, CloudRain, Sun, 
  AlertTriangle, Users, LogIn, LogOut, Edit3, CheckCircle2
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [tab, setTab] = useState('ranking');
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sesión y Auth del Usuario
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'signup'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Form Auth
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form Perfil / Registro
  const [nombre, setNombre] = useState('');
  const [club, setClub] = useState('Country Club Huancayo');
  const [categoria, setCategoria] = useState('4ª');
  const [telefono, setTelefono] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [savingPlayer, setSavingPlayer] = useState(false);

  // Modales adicionales
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);

  // Panel Admin
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const precioTorneo = 40;

  // Form Partido ELO
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

  // Manejador de Autenticación (Login / Registro)
  async function handleAuth(e) {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) return;

    try {
      setAuthLoading(true);

      if (authMode === 'signup') {
        // Verificar si el correo ya existe
        const { data: existing } = await supabase
          .from('jugadores')
          .select('id')
          .eq('email', authEmail.trim())
          .maybeSingle();

        if (existing) {
          alert('Este correo ya tiene una cuenta. Inicia sesión.');
          setAuthMode('login');
          return;
        }

        // Abrir paso de completar perfil
        setShowAuthModal(false);
        setShowProfileSetup(true);
      } else {
        // Iniciar Sesión
        const { data, error } = await supabase
          .from('jugadores')
          .select('*')
          .eq('email', authEmail.trim())
          .eq('password', authPassword.trim())
          .maybeSingle();

        if (error || !data) {
          alert('Credenciales incorrectas. Verifica tu correo y contraseña.');
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

  // Guardar Perfil tras Registro
  async function handleCompleteProfile(e) {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      setSavingPlayer(true);
      const { data, error } = await supabase.from('jugadores').insert([
        {
          email: authEmail.trim(),
          password: authPassword.trim(),
          nombre: nombre.trim(),
          club: club.trim(),
          categoria,
          telefono: telefono.trim(),
          foto_url: fotoUrl.trim() || null,
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
      setFotoUrl('');
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

  // Motor ELO Oficial
  async function handleProcesarPartido(e) {
    e.preventDefault();
    if (!p1Id || !p2Id || !winnerId) {
      alert('Selecciona ambos jugadores y define al ganador.');
      return;
    }
    if (p1Id === p2Id) {
      alert('Los rivales deben ser diferentes.');
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

      alert(`✅ Partido Registrado:\n\n` +
            `${player1.nombre}: ${newElo1} ELO (${delta1 >= 0 ? '+' : ''}${delta1})\n` +
            `${player2.nombre}: ${newElo2} ELO (${delta2 >= 0 ? '+' : ''}${delta2})`);

      setShowMatchModal(false);
      await fetchData();
    } catch (err) {
      alert('Error al registrar resultado: ' + err.message);
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

  // Club ranking acumulativo
  const clubStats = clubesHuancayo.map(c => {
    const socios = jugadores.filter(j => j.club === c.nombre);
    const totalElo = socios.reduce((sum, j) => sum + (j.elo || 1200), 0);
    return { ...c, sociosCount: socios.length, totalElo };
  }).sort((a, b) => b.totalElo - a.totalElo);

  // Perfil activo
  const myPlayer = currentUser ? jugadores.find(j => j.id === currentUser.id) || currentUser : null;
  const myRankPos = myPlayer ? jugadores.findIndex(j => j.id === myPlayer.id) + 1 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl pb-24 border-x border-slate-800 relative">
      
      {/* Header */}
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
              <span className="max-w-[70px] truncate">{currentUser.nombre.split(' ')[0]}</span>
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
            title="Panel Admin"
          >
            <Lock className="w-4 h-4 text-lime-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 space-y-4">

        {/* 1. RANKING */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400">Circuito Oficial Huancayo</span>
                <h2 className="text-base font-black text-white">Tabla Clasificatoria ELO</h2>
                <p className="text-xs text-slate-400">Factor dinámico K=32 · {jugadores.length} tenistas</p>
              </div>
              <button
                onClick={() => setShowMatchModal(true)}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-lime-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Swords className="w-4 h-4" /> Score
              </button>
            </div>

            {/* Clasificación de Clubes */}
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

            {/* Lista General de Tenistas */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ranking Individual</h3>
              {loading ? (
                <div className="text-center py-10 text-slate-500 text-xs">Cargando circuito...</div>
              ) : jugadores.map((j, idx) => (
                <div 
                  key={j.id || idx}
                  className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-7 text-center font-mono font-black text-sm ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                      #{idx + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
                      {j.foto_url ? (
                        <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white leading-tight">{j.nombre}</p>
                      <p className="text-xs text-slate-400">
                        {j.club || 'Independiente'} · <span className="text-lime-400 font-bold">{j.categoria || '4ª'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-mono font-black text-lime-400">{j.elo || 1200}</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">ELO</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. MI PERFIL */}
        {tab === 'perfil' && (
          <div className="space-y-4">
            {currentUser && myPlayer ? (
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-lime-400 to-emerald-500"></div>
                
                <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 p-1 border-2 border-lime-400 mb-3 shadow-[0_0_20px_rgba(163,230,53,0.25)]">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-900">
                    {myPlayer.foto_url ? (
                      <img src={myPlayer.foto_url} alt={myPlayer.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-500" />
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-black text-white">{myPlayer.nombre}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{myPlayer.club || 'Independiente'}</p>
                <div className="inline-block mt-2 bg-lime-400/10 text-lime-400 border border-lime-400/30 text-xs font-black px-3 py-1 rounded-full uppercase">
                  Categoría {myPlayer.categoria || '4ª'}
                </div>

                {/* Métricas del Jugador */}
                <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-800/80">
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Posición</span>
                    <span className="text-lg font-black text-white font-mono">#{myRankPos}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">ELO FNT</span>
                    <span className="text-lg font-black text-lime-400 font-mono">{myPlayer.elo || 1200}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Record W/L</span>
                    <span className="text-lg font-black text-white font-mono">
                      {myPlayer.victorias || 0}-{myPlayer.derrotas || 0}
                    </span>
                  </div>
                </div>

                {/* Acciones de Cuenta (Sin autoreto) */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex gap-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
                <User className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-black text-white">Accede a tu Perfil de Jugador</h3>
                  <p className="text-xs text-slate-400 mt-1">Crea una cuenta o inicia sesión para registrar tus partidos y escalar en el ranking.</p>
                </div>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="bg-lime-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                    className="bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-700"
                  >
                    Registrarme
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. RETOS */}
        {tab === 'match' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-white">Desafíos Directos</h3>
                <p className="text-xs text-slate-400">Pacta encuentros por WhatsApp</p>
              </div>
              <button
                onClick={() => setShowMatchModal(true)}
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black px-3 py-2 rounded-xl"
              >
                + Subir Score
              </button>
            </div>

            <div className="space-y-2">
              {jugadores
                .filter(j => !currentUser || j.id !== currentUser.id) // Ocultar al usuario actual de la lista de rivales
                .map((j) => (
                  <div key={j.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
                        {j.foto_url ? (
                          <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{j.nombre}</p>
                        <p className="text-xs text-slate-400">{j.club || 'Independiente'} · <span className="text-lime-400">{j.elo || 1200} pts</span></p>
                      </div>
                    </div>
                    {j.telefono ? (
                      <a
                        href={`https://wa.me/51${j.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(j.nombre)},%20te%20escribo%20desde%20MatchPoint%20para%20jugar%20un%20partido%20de%20ranking.`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-800 hover:bg-slate-750 text-lime-400 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" /> Retar
                      </a>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 4. CANCHAS */}
        {tab === 'clubs' && (
          <div className="space-y-3">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-black text-white">Estado de Sedes en Huancayo</h3>
              <p className="text-xs text-slate-400 mt-1">Monitorea el estado de la arcilla antes de jugar.</p>
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
                      className={`text-[10px] px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 border ${isRain ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    >
                      {isRain ? <CloudRain className="w-3.5 h-3.5 text-rose-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                      {infoClima.estado}
                    </button>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Reporte: {infoClima.hora}</span>
                    <a 
                      href={`https://wa.me/51${c.tel}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-400 font-black hover:underline"
                    >
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
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-black text-lime-400 bg-lime-950/60 border border-lime-800/80 px-2.5 py-0.5 rounded-md">
                  Inscripciones Abiertas
                </span>
                <span className="text-xs text-slate-400">Cupos: 16 tenistas</span>
              </div>
              <h3 className="text-lg font-black text-white">Torneo Apertura Huancayo 2026</h3>
              <p className="text-xs text-slate-400 mt-1">Cuadro eliminatorio oficial con puntaje ELO.</p>
              
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
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
                className="w-full mt-4 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-3 rounded-2xl text-xs transition shadow-md shadow-lime-500/10"
              >
                Inscribirme vía Yape / Plin
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Autenticación (Login / Registro de Credenciales) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
              <div>
                <label className="text-xs text-slate-400 block mb-1">Correo electrónico o Celular *</label>
                <input
                  type="text"
                  required
                  placeholder="ejemplo@correo.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs transition"
                >
                  {authLoading ? 'Verificando...' : (authMode === 'login' ? 'Entrar a mi Cuenta' : 'Continuar al Perfil')}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-lime-400 hover:underline font-semibold"
                >
                  {authMode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configuración de Perfil tras Registro */}
      {showProfileSetup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-black text-white mb-1">Configura tu Ficha de Tenista</h3>
            <p className="text-xs text-slate-400 mb-4">Esta información aparecerá en el ranking de Huancayo.</p>

            <form onSubmit={handleCompleteProfile} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Club o Cancha habitual</label>
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
                >
                  <option value="Country Club Huancayo">Country Club Huancayo</option>
                  <option value="Club Tauro Tenis">Club Tauro Tenis</option>
                  <option value="Academia Romina Cutipa">Academia Romina Cutipa</option>
                  <option value="Complejo Shyam Huilca">Complejo Shyam Huilca</option>
                  <option value="Independiente">Independiente</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value="1ª">1ª</option>
                    <option value="2ª">2ª</option>
                    <option value="3ª">3ª</option>
                    <option value="4ª">4ª</option>
                    <option value="5ª A">5ª A</option>
                    <option value="5ª B">5ª B</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="999..."
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">URL de Foto (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPlayer}
                  className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs transition"
                >
                  {savingPlayer ? 'Creando Perfil...' : 'Guardar y Entrar al Circuito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Subir Score */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-lime-400" /> Reportar Partido
              </h3>
              <button onClick={() => setShowMatchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcesarPartido} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tenista 1</label>
                <select
                  value={p1Id}
                  onChange={(e) => setP1Id(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                >
                  <option value="">Selecciona al primer jugador...</option>
                  {jugadores.map(j => (
                    <option key={j.id} value={j.id.toString()}>{j.nombre} ({j.elo || 1200} pts)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tenista 2 (Rival)</label>
                <select
                  value={p2Id}
                  onChange={(e) => setP2Id(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                >
                  <option value="">Selecciona al segundo jugador...</option>
                  {jugadores.map(j => (
                    <option key={j.id} value={j.id.toString()}>{j.nombre} ({j.elo || 1200} pts)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Marcador Oficial (Sets)</label>
                <input
                  type="text"
                  placeholder="Ej. 6-4, 7-5"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Ganador</label>
                <select
                  value={winnerId}
                  onChange={(e) => setWinnerId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400 font-bold"
                >
                  <option value="">Elige al ganador...</option>
                  {p1Id && <option value={p1Id}>{jugadores.find(j => j.id.toString() === p1Id)?.nombre}</option>}
                  {p2Id && <option value={p2Id}>{jugadores.find(j => j.id.toString() === p2Id)?.nombre}</option>}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={calculatingMatch}
                  className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs transition"
                >
                  {calculatingMatch ? 'Calculando nuevo ELO...' : 'Confirmar Resultado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Torneo Yape/Plin */}
      {showTournamentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Inscripción al Torneo</h3>
              <button onClick={() => setShowTournamentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
              <QrCode className="w-16 h-16 mx-auto text-lime-400" />
              <p className="text-xs font-black text-white">Yape o Plin al: 964-000000</p>
              <p className="text-[11px] text-slate-400">Monto: S/ {precioTorneo}.00 (Titular: Tenis Huancayo)</p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Realiza el pago y envía tu constancia por WhatsApp para validar tu cupo y asignarte el cuadro oficial.
            </p>

            <a
              href={`https://wa.me/51964000000?text=Hola,%20adjunto%20mi%20comprobante%20de%20S/%20${precioTorneo}%20para%20el%20Torneo%20Apertura%20Huancayo`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition"
            >
              Enviar Constancia al WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Modal: Panel Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-lime-400" /> Panel de Control y Caja
              </h3>
              <button onClick={() => { setShowAdminModal(false); setIsAdminAuth(false); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isAdminAuth ? (
              <form onSubmit={handleVerifyAdmin} className="space-y-3">
                <p className="text-xs text-slate-400">Clave secreta de administrador:</p>
                <input
                  type="password"
                  placeholder="PIN (1234)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg tracking-widest text-lime-400 font-mono focus:outline-none focus:border-lime-400"
                />
                <button
                  type="submit"
                  className="w-full bg-lime-400 hover:bg-lime-300 text-slate-950 font-black py-2.5 rounded-xl text-xs"
                >
                  Desbloquear
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-lime-400">Simulador de Ingresos Torneo</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Inscritos estimados:</span>
                      <span className="font-bold text-white">16 jugadores</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Recaudación Bruta:</span>
                      <span className="font-bold text-emerald-400 font-mono">S/ {16 * precioTorneo}.00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold py-2.5 rounded-xl text-left px-3.5 border border-slate-700"
                  >
                    Acceder a Base de Datos Supabase ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barra de Navegación Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around py-3 px-1 z-40">
        <button 
          onClick={() => setTab('ranking')} 
          className={`flex flex-col items-center text-[10px] transition ${tab === 'ranking' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <Trophy className="w-4 h-4 mb-1" />
          Ranking
        </button>
        <button 
          onClick={() => setTab('perfil')} 
          className={`flex flex-col items-center text-[10px] transition ${tab === 'perfil' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <User className="w-4 h-4 mb-1" />
          Mi Perfil
        </button>
        <button 
          onClick={() => setTab('match')} 
          className={`flex flex-col items-center text-[10px] transition ${tab === 'match' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <Swords className="w-4 h-4 mb-1" />
          Retos
        </button>
        <button 
          onClick={() => setTab('clubs')} 
          className={`flex flex-col items-center text-[10px] transition ${tab === 'clubs' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <MapPin className="w-4 h-4 mb-1" />
          Canchas
        </button>
        <button 
          onClick={() => setTab('torneos')} 
          className={`flex flex-col items-center text-[10px] transition ${tab === 'torneos' ? 'text-lime-400 font-black' : 'text-slate-400'}`}
        >
          <Calendar className="w-4 h-4 mb-1" />
          Torneos
        </button>
      </nav>

    </div>
  );
}
