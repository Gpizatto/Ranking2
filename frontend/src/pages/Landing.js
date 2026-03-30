import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Search, MapPin, ChevronRight, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Landing = () => {
  const [federations, setFederations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFederations();
  }, []);

  const fetchFederations = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/federations`);
      setFederations(response.data);
    } catch (error) {
      console.error('Erro ao carregar federações');
    } finally {
      setLoading(false);
    }
  };

  const filtered = federations.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">SquashRank Pro</h1>
          </div>
          <p className="text-xl text-gray-400 mb-3">Sistema oficial de rankings de squash</p>
          <p className="text-gray-500 mb-10">Selecione sua federação para acessar rankings, torneios e jogadores</p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar federação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Federations grid */}
      <div className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando federações...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Nenhuma federação encontrada</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6 text-center">{filtered.length} federação{filtered.length !== 1 ? 'ões' : ''} disponível{filtered.length !== 1 ? 'is' : ''}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((federation) => (
                <button
                  key={federation.id}
                  onClick={() => navigate(`/${federation.slug}`)}
                  className="group text-left bg-slate-800/60 border border-slate-700 hover:border-green-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Logo area */}
                  <div className="h-36 bg-slate-900 flex items-center justify-center overflow-hidden relative">
                    {federation.logo_url ? (
                      <img
                        src={federation.logo_url}
                        alt={federation.name}
                        className="w-24 h-24 object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-green-500/20">
                        <Trophy className="w-10 h-10 text-green-400/60" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${federation.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {federation.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm leading-tight group-hover:text-green-400 transition-colors mb-1">
                          {federation.name}
                        </h3>
                        {federation.state && (
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <MapPin className="w-3 h-3" />
                            {federation.state}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-colors flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Stats */}
                    {(federation.total_players > 0 || federation.total_tournaments > 0) && (
                      <div className="flex gap-3 mt-3 pt-3 border-t border-slate-700">
                        {federation.total_players > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            {federation.total_players} jogadores
                          </div>
                        )}
                        {federation.total_tournaments > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Trophy className="w-3 h-3" />
                            {federation.total_tournaments} torneios
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-600 font-mono">
                      squashrank.com.br/{federation.slug}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-8 text-center text-gray-600 text-sm">
        SquashRank Pro © {new Date().getFullYear()} — Sistema de Rankings de Squash
      </div>
    </div>
  );
};

export default Landing;