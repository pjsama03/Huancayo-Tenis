import React, { useState, useEffect } from 'react';
import { 
  Trophy, Users, Swords, MapPin, User, Plus, X, Phone, Shield, 
  Calendar, Award, QrCode, Lock, Camera, Loader2 
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [tab, setTab] = useState('inicio');
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  
  // Auth Admin
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  // Formulario Registro Jugador
  const [nombre, setNombre] = useState('');
  const [club, setClub] = useState('Country Club Huancayo');
  const [categoria, setCategoria] = useState('5ª A');
  const [telefono, setTelefono] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [savingPlayer, setSavingPlayer] = useState(false);

  const clubesHuancayo = [
    { nombre: 'Country Club Huancayo', canchas: '3 Arcilla', zona: 'El Tambo', tel: '964-123456' },
    { nombre: 'Club Tauro Tenis', canchas: '2 Arcilla techadas', zona: 'San Carlos', tel: '954-987654' },
    { nombre: 'Academia Romina Cutipa', canchas: '2 Arcilla', zona: 'Huancayo Este', tel: '999-555444' },
    { nombre: 'Complejo Shyam Huilca', canchas: '1 Rápida / 1 Arcilla', zona: 'Chilca', tel: '988-333222' }
  ];

  useEffect(() => {
    fetchJugadores();
  }, []);

  async function fetchJugadores() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('elo', { ascending: false });

      if (error) throw error;
      setJugadores(data || []);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleCrearJugador(e) {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      setSavingPlayer(true);
      let publicFotoUrl = null;

      // 1. Si eligió foto, subirla al bucket 'avatars' de Supabase
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, fotoFile);

        if (uploadError) {
          console.error('Error subiendo avatar:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          publicFotoUrl = publicUrlData.publicUrl;
        }
      }

      // 2. Insertar en la tabla SQL 'jugadores'
      const { error: insertError } = await supabase.from('jugadores').insert([
        {
          nombre: nombre.trim(),
          club: club.trim(),
          categoria,
          telefono: telefono.trim(),
          foto_url: publicFotoUrl,
          elo: 1200,
        },
      ]);

      if (insertError) throw insertError;

      // Limpiar formulario y cerrar
      setNombre('');
      setTelefono('');
      setFotoFile(null);
      setFotoPreview(null);
      setShowRegisterModal(false);
      await fetchJugadores();
      setTab('ranking');
    } catch (err) {
      alert('Error al registrar: ' + err.message);
    } finally {
      setSavingPlayer(false);
    }
  }

  function handleVerifyAdmin(e) {
    e.preventDefault();
    if (adminPin === '1234') {
      setIsAdminAuth(true);
    } else {
      alert('PIN de administrador incorrecto');
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#F2EFEB] flex flex-col font-sans max-w-md mx-auto shadow-2xl pb-24 border-x border-stone-800 relative">
      
      {/* Header */}
      <header className="px-5 py-3.5 bg-[#1C1B1A] border-b border-stone-800 flex justify-between items-center sticky top-0 z-30">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-bold text-[#C86446]">Huancayo Circuit</span>
          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            MATCHPOINT <span className="text-xs px-1.5 py-0.5 rounded bg-[#C86446]/20 text-[#C86446] font-mono">HUB</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowAdminModal(true)}
            className="p-1.5 bg-[#252422] hover:bg-stone-800 border border-stone-700 rounded-lg text-stone-300"
            title="Panel Admin"
          >
            <Lock className="w-4 h-4 text-[#C86446]" />
          </button>
          <div className="flex items-center space-x-1.5 bg-[#252422] px-2 py-1 rounded-full border border-stone-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-stone-400 font-mono">En vivo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 space-y-4">
        
        {/* INICIO */}
        {tab === 'inicio' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#2B2927] to-[#1C1B1A] p-5 rounded-2xl border border-stone-800 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C86446] block mb-1">Comunidad Huancayo</span>
              <h2 className="text-xl font-black text-white leading-tight">Encuentra rivales y escala en el ranking oficial</h2>
              <p className="text-xs text-stone-400 mt-1 mb-4">Conecta con jugadores del Country Club, Tauro Tenis y academias locales.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-[#C86446] hover:bg-[#b05338] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Crear Perfil
                </button>
                <button 
                  onClick={() => setTab('ranking')}
                  className="bg-[#252422] hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Ver Ranking
                </button>
              </div>
            </div>

            <div className="bg-[#252422] p-4 rounded-xl border border-stone-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase">Inscripciones Abiertas</span>
                <h3 className="text-sm font-bold text-stone-100">Torneo Apertura Huancayo 2026</h3>
                <p className="text-xs text-stone-400">Pozo acumulado · Categorías 4ª y 5ª</p>
              </div>
              <button 
                onClick={() => setShowTournamentModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
              >
                Inscribirme
              </button>
            </div>

            <div>
              <h3 className="text-xs uppercase font-bold text-stone-400 tracking-wider mb-2">Líderes del Circuito</h3>
              {jugadores.slice(0, 3).map((j, idx) => (
                <div key={j.id || idx} className="bg-[#252422] p-3 rounded-lg border border-stone-800 flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-black text-[#C86446] w-5">#{idx + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-stone-700 overflow-hidden flex items-center justify-center border border-stone-600">
                      {j.foto_url ? (
                        <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{j.nombre}</p>
                      <p className="text-xs text-stone-400">{j.club} · {j.categoria}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold bg-[#1C1B1A] px-2 py-1 rounded text-stone-200 border border-stone-800">
                    {j.elo || 1200} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RANKING */}
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#252422] p-4 rounded-xl border border-stone-800">
              <div>
                <h2 className="text-sm uppercase tracking-wider text-stone-200 font-bold">Ranking Oficial ELO</h2>
                <p className="text-xs text-stone-400">Total registrados: {jugadores.length}</p>
              </div>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-[#C86446] hover:bg-[#b05338] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 shadow-md"
              >
                <Plus className="w-4 h-4" /> Nuevo
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-stone-500 text-sm">Cargando clasificación...</div>
            ) : jugadores.length === 0 ? (
              <div className="text-center py-12 px-4 bg-[#252422] rounded-xl border border-stone-800">
                <Users className="w-10 h-10 mx-auto text-stone-600 mb-2" />
                <p className="text-sm font-medium text-stone-300">Aún no hay jugadores registrados</p>
                <p className="text-xs text-stone-500 mt-1">Usa el botón "Nuevo" para registrarte.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jugadores.map((j, idx) => (
                  <div key={j.id || idx} className="bg-[#252422] p-3 rounded-lg border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-[#C86446] w-6">{idx + 1}</span>
                      <div className="w-10 h-10 rounded-full bg-stone-700 overflow-hidden flex items-center justify-center border border-stone-600">
                        {j.foto_url ? (
                          <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-100">{j.nombre}</p>
                        <p className="text-xs text-stone-400">
                          {j.club || 'Independiente'} · <span className="text-[#C86446]">{j.categoria || '5ª A'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-stone-100">{j.elo || 1200}</span>
                      <p className="text-[10px] text-stone-500">PTS ELO</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RETOS */}
        {tab === 'match' && (
          <div className="space-y-4">
            <div className="bg-[#252422] p-5 rounded-xl border border-stone-800 text-center">
              <Swords className="w-10 h-10 text-[#C86446] mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Retos Directos ELO</h3>
              <p className="text-xs text-stone-400 mt-1">Desafía rivales en Huancayo y reporta el resultado al administrador.</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs uppercase font-bold text-stone-400 tracking-wider">Jugadores Disponibles</h4>
              {jugadores.map((j) => (
                <div key={j.id} className="bg-[#252422] p-3 rounded-lg border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-stone-700 overflow-hidden flex items-center justify-center">
                      {j.foto_url ? (
                        <img src={j.foto_url} alt={j.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{j.nombre}</p>
                      <p className="text-xs text-stone-400">{j.club} · {j.categoria}</p>
                    </div>
                  </div>
                  {j.telefono ? (
                    <a
                      href={`https://wa.me/51${j.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(j.nombre)},%20te%20contacto%20desde%20la%20app%20de%20Tenis%20de%20Huancayo%20para%20pactar%20un%20partido.`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Retar
                    </a>
                  ) : (
                    <span className="text-xs text-stone-500">Sin contacto</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CANCHAS */}
        {tab === 'clubs' && (
          <div className="space-y-3">
            <div className="bg-[#252422] p-4 rounded-xl border border-stone-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sedes Afiliadas en Huancayo</h3>
              <p className="text-xs text-stone-400 mt-1">Canchas disponibles para juego libre y partidos oficiales.</p>
            </div>

            {clubesHuancayo.map((c, idx) => (
              <div key={idx} className="bg-[#252422] p-4 rounded-xl border border-stone-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-stone-100">{c.nombre}</h4>
                    <span className="text-xs text-[#C86446] font-medium">{c.zona}</span>
                  </div>
                  <span className="text-xs bg-stone-800 text-stone-300 px-2 py-1 rounded border border-stone-700">
                    {c.canchas}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-xs">
                  <span className="text-stone-400">Tel: {c.tel}</span>
                  <a 
                    href={`https://wa.me/51${c.tel.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-emerald-400 font-semibold hover:underline"
                  >
                    Contactar Cancha
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TORNEOS */}
        {tab === 'torneos' && (
          <div className="space-y-4">
            <div className="bg-[#252422] p-5 rounded-2xl border border-stone-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Fase de Registro
                </span>
                <span className="text-xs text-stone-400">Cierre: 30 Nov</span>
              </div>
              <h3 className="text-lg font-black text-white">Torneo Apertura Huancayo 2026</h3>
              <p className="text-xs text-stone-300 mt-1">Cuadro eliminatorio con ronda consuelo. Suma puntos al ranking oficial.</p>
              
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-[#1C1B1A] p-3 rounded-xl border border-stone-800">
                <div>
                  <span className="text-stone-500 block">Inscripción:</span>
                  <span className="font-bold text-stone-100">S/ 40.00</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Sede Central:</span>
                  <span className="font-bold text-stone-100">Country Club</span>
                </div>
              </div>

              <button 
                onClick={() => setShowTournamentModal(true)}
                className="w-full mt-4 bg-[#C86446] hover:bg-[#b05338] text-white font-bold py-2.5 rounded-xl text-sm transition"
              >
                Inscribirme vía Yape / Plin
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Registro con FOTO */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#252422] border border-stone-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Crear Perfil de Tenista</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearJugador} className="space-y-3">
              {/* Selector de Foto */}
              <div className="flex flex-col items-center justify-center mb-2">
                <label className="cursor-pointer group flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-stone-800 border-2 border-dashed border-[#C86446] flex items-center justify-center overflow-hidden relative group-hover:border-[#b05338] transition">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <Camera className="w-6 h-6 text-[#C86446] mx-auto mb-1" />
                        <span className="text-[9px] text-stone-400 block leading-tight">Subir foto</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
                <span className="text-[10px] text-stone-500 mt-1">Toca para elegir desde tu celular</span>
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#1C1B1A] border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C86446]"
                />
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1">Club o Cancha habitual</label>
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full bg-[#1C1B1A] border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C86446]"
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
                  <label className="text-xs text-stone-400 block mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-[#1C1B1A] border border-stone-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-[#C86446]"
                  >
                    <option value="1ª">1ª Categoría</option>
                    <option value="2ª">2ª Categoría</option>
                    <option value="3ª">3ª Categoría</option>
                    <option value="4ª">4ª Categoría</option>
                    <option value="5ª A">5ª A</option>
                    <option value="5ª B">5ª B</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">WhatsApp / Móvil</label>
                  <input
                    type="tel"
                    placeholder="999..."
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-[#1C1B1A] border border-stone-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-[#C86446]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPlayer}
                  className="w-full bg-[#C86446] hover:bg-[#b05338] disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {savingPlayer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Subiendo perfil...
                    </>
                  ) : (
                    'Completar Registro con Foto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Torneo y Pago */}
      {showTournamentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#252422] border border-stone-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Inscripción al Torneo</h3>
              <button onClick={() => setShowTournamentModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-[#1C1B1A] p-4 rounded-xl border border-stone-800 text-center space-y-2">
              <QrCode className="w-16 h-16 mx-auto text-[#C86446]" />
              <p className="text-xs font-bold text-stone-200">Yape o Plin al: 964-000000</p>
              <p className="text-[11px] text-stone-400">Monto: S/ 40.00 (Titular: Tenis Huancayo)</p>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Realiza el pago y envía la constancia por WhatsApp para validar tu cupo y asignarte el cuadro oficial.
            </p>

            <a
              href="https://wa.me/51964000000?text=Hola,%20adjunto%20mi%20comprobante%20para%20el%20Torneo%20Apertura%20Huancayo"
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-sm transition"
            >
              Enviar Constancia al WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Modal: Panel Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#252422] border border-stone-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#C86446]" /> Panel de Control
              </h3>
              <button onClick={() => { setShowAdminModal(false); setIsAdminAuth(false); }} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isAdminAuth ? (
              <form onSubmit={handleVerifyAdmin} className="space-y-3">
                <p className="text-xs text-stone-400">Ingresa tu clave de administrador para gestionar la aplicación:</p>
                <input
                  type="password"
                  placeholder="PIN secreto (1234)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-[#1C1B1A] border border-stone-700 rounded-lg px-3 py-2 text-center text-lg tracking-widest text-white focus:outline-none focus:border-[#C86446]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#C86446] hover:bg-[#b05338] text-white font-bold py-2 rounded-lg text-sm"
                >
                  Entrar
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#1C1B1A] p-3 rounded-lg border border-stone-800">
                  <span className="text-xs text-emerald-400 font-bold block mb-1">Acceso Concedido</span>
                  <p className="text-xs text-stone-300">Total Jugadores: {jugadores.length}</p>
                  <p className="text-xs text-stone-300">Base de datos: Supabase (Conectada)</p>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => { setShowAdminModal(false); setShowRegisterModal(true); }}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-bold py-2 rounded-lg text-left px-3"
                  >
                    + Agregar Jugador Manualmente
                  </button>
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-bold py-2 rounded-lg text-left px-3"
                  >
                    Abrir Base de Datos Supabase ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navegación Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1C1B1A] border-t border-stone-800 flex justify-around py-2.5 px-1 z-40">
        <button onClick={() => setTab('inicio')} className={`flex flex-col items-center text-[10px] ${tab === 'inicio' ? 'text-[#C86446] font-bold' : 'text-stone-400'}`}>
          <Trophy className="w-4 h-4 mb-1" />
          Inicio
        </button>
        <button onClick={() => setTab('ranking')} className={`flex flex-col items-center text-[10px] ${tab === 'ranking' ? 'text-[#C86446] font-bold' : 'text-stone-400'}`}>
          <Award className="w-4 h-4 mb-1" />
          Ranking
        </button>
        <button onClick={() => setTab('match')} className={`flex flex-col items-center text-[10px] ${tab === 'match' ? 'text-[#C86446] font-bold' : 'text-stone-400'}`}>
          <Swords className="w-4 h-4 mb-1" />
          Retos
        </button>
        <button onClick={() => setTab('clubs')} className={`flex flex-col items-center text-[10px] ${tab === 'clubs' ? 'text-[#C86446] font-bold' : 'text-stone-400'}`}>
          <MapPin className="w-4 h-4 mb-1" />
          Canchas
        </button>
        <button onClick={() => setTab('torneos')} className={`flex flex-col items-center text-[10px] ${tab === 'torneos' ? 'text-[#C86446] font-bold' : 'text-stone-400'}`}>
          <Calendar className="w-4 h-4 mb-1" />
          Torneos
        </button>
      </nav>

    </div>
  );
}
