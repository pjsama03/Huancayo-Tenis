import React, { useState, useEffect } from 'react';
import { Trophy, Users, Swords, MapPin, User, ChevronRight, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [tab, setTab] = useState('ranking');
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar jugadores de Supabase
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
      console.error('Error cargando ranking:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1C1B1A] text-[#F2EFEB] flex flex-col font-sans max-w-md mx-auto shadow-2xl pb-20 border-x border-stone-800">
      {/* Header */}
      <header className="px-5 py-4 bg-[#252422] border-b border-stone-800 flex justify-between items-center sticky top-0 z-30">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-semibold text-[#C86446]">Huancayo Circuit</span>
          <h1 className="text-xl font-bold tracking-tight text-[#F2EFEB]">Tennis Hub</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-stone-400 font-mono">En vivo</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1">
        {tab === 'ranking' && (
          <div className="space-y-4">
            <div className="bg-[#2B2927] p-4 rounded-xl border border-stone-800">
              <h2 className="text-sm uppercase tracking-wider text-stone-400 font-semibold mb-1">Ranking Oficial ELO</h2>
              <p className="text-xs text-stone-500">Actualizado con la base de datos oficial de Huancayo.</p>
            </div>

            {loading ? (
              <div className="text-center py-10 text-stone-500 text-sm">Cargando jugadores...</div>
            ) : jugadores.length === 0 ? (
              <div className="text-center py-12 px-4 bg-[#252422] rounded-xl border border-stone-800">
                <Users className="w-10 h-10 mx-auto text-stone-600 mb-2" />
                <p className="text-sm font-medium text-stone-300">Aún no hay jugadores registrados</p>
                <p className="text-xs text-stone-500 mt-1">Los nuevos registros en Supabase aparecerán aquí automáticamente.</p>
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
                        <p className="text-xs text-stone-400">{j.club || 'Independiente'} · <span className="text-[#C86446]">{j.categoria || '5ª A'}</span></p>
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

        {tab === 'match' && (
          <div className="space-y-4">
            <div className="bg-[#252422] p-5 rounded-xl border border-stone-800 text-center">
              <Swords className="w-12 h-12 text-[#C86446] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-stone-100">Matchmaking Oficial</h3>
              <p className="text-xs text-stone-400 mt-1">Busca rivales en Huancayo dentro de tu rango de nivel (+/- 1,200 ELO).</p>
            </div>
          </div>
        )}

        {tab === 'clubs' && (
          <div className="space-y-3">
            <div className="bg-[#252422] p-4 rounded-xl border border-stone-800">
              <h3 className="text-sm font-bold text-stone-200">Sedes y Clubes</h3>
              <p className="text-xs text-stone-400 mt-1">Country Club, Tauro Tenis, Romina Cutipa y Shyam Huilca.</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#252422] border-t border-stone-800 flex justify-around py-3 px-2 z-40">
        <button onClick={() => setTab('ranking')} className={`flex flex-col items-center text-xs ${tab === 'ranking' ? 'text-[#C86446] font-bold' : 'text-stone-400'}`}>
          <Trophy className="w-5 h-5 mb-1" />
          Ranking
        </button>
        <button onClick={() => setTab('match')} className={`flex flex-col items-center text-xs ${tab === 'match' ? 'text-[#C86446] font-bold' : 'text-stone-400'}`}>
          <Swords className="w-5 h-5 mb-1" />
          Retos
        </button>
        <button onClick={() => setTab('clubs')} className={`flex flex-col items-center text-xs ${tab === 'clubs' ? 'text-[#C86446] font-bold' : 'text-stone-400'}`}>
          <MapPin className="w-5 h-5 mb-1" />
          Clubes
        </button>
      </nav>
    </div>
  );
}