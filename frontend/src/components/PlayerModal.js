import React, { useState, useEffect } from 'react';
import axios, { API } from '../lib/api';
import { MapPin, GraduationCap, User, Trophy, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const placementLabels = {
  1: 'Campeão', 2: 'Vice', 3: 'Semi Final', 4: 'Semi Final',
  5: 'Quarta Final', 6: 'Quarta Final', 7: 'Quarta Final', 8: 'Quarta Final'
};

// Aceita tanto playerId (string) quanto player (objeto com id ou player_id)
const PlayerModal = ({ playerId, player, onClose }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const resolvedId = playerId || player?.id || player?.player_id;

  useEffect(() => {
    if (!resolvedId) return;
    setPlayerDetails(null);
    setLoading(true);

    const fetchDetails = async () => {
      try {
        // Se já temos o objeto player completo, usa direto sem buscar /players
        if (player && (player.id || player.player_id)) {
          setSelectedPlayer(player);
        }

        const detailsRes = await axios.get(`${API}/players/${resolvedId}/details`);
        setPlayerDetails(detailsRes.data);

        // Se não tinha player, busca agora
        if (!player || (!player.id && !player.player_id)) {
          const playersRes = await axios.get(`${API}/players`);
          const found = playersRes.data.find(p => p.id === resolvedId);
          setSelectedPlayer(found || null);
        }
      } catch {
        toast.error('Erro ao carregar detalhes do jogador');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [resolvedId]);

  const isOpen = !!resolvedId;

  const handleClose = () => {
    setSelectedPlayer(null);
    setPlayerDetails(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-green-500/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
        {loading ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Carregando...</DialogTitle>
            </DialogHeader>
            <div className="py-12 text-center text-gray-400">Carregando detalhes...</div>
          </>
        ) : selectedPlayer ? (
          <>
            <DialogHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  <AvatarImage src={selectedPlayer.photo_url || "/fsp.jpeg"} />
                  <AvatarFallback><img src="/fsp.jpeg" alt="FSP" className="w-full h-full object-cover rounded-full" /></AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-white text-xl sm:text-2xl">{selectedPlayer.name}</DialogTitle>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPlayer.main_class && <Badge className="bg-blue-500">{selectedPlayer.main_class}</Badge>}
                    {selectedPlayer.gender && <Badge className="bg-purple-500">{selectedPlayer.gender}</Badge>}
                    {selectedPlayer.birth_date && (
                      <Badge className="bg-slate-600">
                        {(() => { const t = new Date(); const b = new Date(selectedPlayer.birth_date + 'T00:00:00'); return t.getFullYear() - b.getFullYear() - (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0); })()} anos
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {playerDetails ? (
              <div className="space-y-4 mt-2">

                {/* Info básica */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  {selectedPlayer.city && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center text-gray-400 mb-1"><MapPin className="w-4 h-4 mr-2" /><span className="text-xs">Cidade</span></div>
                      <p className="text-white font-semibold text-sm">{selectedPlayer.city}</p>
                    </div>
                  )}
                  {selectedPlayer.academy && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center text-gray-400 mb-1"><GraduationCap className="w-4 h-4 mr-2" /><span className="text-xs">Academia</span></div>
                      <p className="text-white font-semibold text-sm">{selectedPlayer.academy}</p>
                    </div>
                  )}
                  {selectedPlayer.coach && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center text-gray-400 mb-1"><User className="w-4 h-4 mr-2" /><span className="text-xs">Treinador</span></div>
                      <p className="text-white font-semibold text-sm">{selectedPlayer.coach}</p>
                    </div>
                  )}
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center text-gray-400 mb-1"><Trophy className="w-4 h-4 mr-2" /><span className="text-xs">Torneios</span></div>
                    <p className="text-white font-semibold text-2xl">{playerDetails.total_tournaments}</p>
                  </div>
                </div>

                {/* Rankings */}
                {playerDetails.rankings && Object.keys(playerDetails.rankings).length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-400" />Posição nos Rankings
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.values(playerDetails.rankings).map((ranking, idx) => (
                        <div key={idx} className="bg-slate-800 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-400 text-xs">{ranking.class} - {ranking.category}</span>
                            <Badge className="bg-green-500 text-xs">{ranking.points} pts</Badge>
                          </div>
                          <p className="text-white font-bold">{ranking.rank}º <span className="text-xs text-gray-400 font-normal">de {ranking.total}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Última partida */}
                {playerDetails.last_match && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 text-sm">Última Partida</h3>
                    <div className="bg-slate-800 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-gray-400 text-xs">{playerDetails.last_match.tournament_name}</p>
                          <p className="text-white font-medium">vs {playerDetails.last_match.opponent_name}</p>
                        </div>
                        <Badge className={playerDetails.last_match.result === 'Win' ? 'bg-green-500' : 'bg-red-500'}>
                          {playerDetails.last_match.result === 'Win' ? 'Vitória' : 'Derrota'}
                        </Badge>
                      </div>
                      <p className="text-gray-300 font-mono text-sm">{playerDetails.last_match.score_formatted}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {format(new Date(playerDetails.last_match.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Histórico de torneios */}
                {playerDetails.recent_tournaments && playerDetails.recent_tournaments.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center text-sm">
                      <Trophy className="w-4 h-4 mr-2 text-green-400" />Histórico de Torneios
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700 text-xs text-gray-400">
                            <th className="text-left py-2 px-2">Torneio</th>
                            <th className="text-left py-2 px-2 hidden sm:table-cell">Ano</th>
                            <th className="text-left py-2 px-2">Resultado</th>
                            <th className="text-right py-2 px-2">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerDetails.recent_tournaments.map((t, idx) => (
                            <tr key={idx} className="border-b border-slate-700/50">
                              <td className="py-2 px-2 text-white text-xs">{t.tournament_name}</td>
                              <td className="py-2 px-2 text-gray-300 text-xs hidden sm:table-cell">
                                {new Date(t.tournament_date).getFullYear()}
                              </td>
                              <td className="py-2 px-2">
                                <Badge className={`text-xs ${t.placement <= 3 ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                                  {placementLabels[t.placement] || `${t.placement}º`}
                                </Badge>
                              </td>
                              <td className="py-2 px-2 text-right text-green-400 font-semibold text-xs">{t.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Histórico de partidas */}
                {playerDetails.match_history && playerDetails.match_history.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center text-sm">
                      <Trophy className="w-4 h-4 mr-2 text-green-400" />Histórico de Partidas
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700 text-xs text-gray-400">
                            <th className="text-left py-2 px-2">Oponente</th>
                            <th className="text-left py-2 px-2 hidden md:table-cell">Torneio</th>
                            <th className="text-left py-2 px-2 hidden sm:table-cell">Rodada</th>
                            <th className="text-left py-2 px-2">Placar</th>
                            <th className="text-left py-2 px-2">Resultado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerDetails.match_history.slice(0, 10).map((match, idx) => (
                            <tr key={idx} className="border-b border-slate-700/50">
                              <td className="py-2 px-2 text-white text-xs">{match.opponent_name}</td>
                              <td className="py-2 px-2 text-gray-300 text-xs hidden md:table-cell">{match.tournament_name}</td>
                              <td className="py-2 px-2 hidden sm:table-cell">
                                <Badge className="bg-purple-500 text-xs">{match.round}</Badge>
                              </td>
                              <td className="py-2 px-2 text-gray-300 font-mono text-xs">{match.score_formatted}</td>
                              <td className="py-2 px-2">
                                <Badge className={`text-xs ${match.result === 'Win' ? 'bg-green-500' : 'bg-red-500'}`}>
                                  {match.result === 'Win' ? 'V' : 'D'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Head to Head */}
                {playerDetails.head_to_head && playerDetails.head_to_head.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center text-sm">
                      <Trophy className="w-4 h-4 mr-2 text-green-400" />Head-to-Head
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700 text-xs text-gray-400">
                            <th className="text-left py-2 px-2">Oponente</th>
                            <th className="text-center py-2 px-2">Jogos</th>
                            <th className="text-center py-2 px-2">V</th>
                            <th className="text-center py-2 px-2">D</th>
                            <th className="text-center py-2 px-2">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerDetails.head_to_head.map((h2h, idx) => (
                            <tr key={idx} className="border-b border-slate-700/50">
                              <td className="py-2 px-2 text-white text-xs">{h2h.opponent_name}</td>
                              <td className="py-2 px-2 text-center"><Badge className="bg-blue-500 text-xs">{h2h.matches_played}</Badge></td>
                              <td className="py-2 px-2 text-center"><Badge className="bg-green-500 text-xs">{h2h.wins}</Badge></td>
                              <td className="py-2 px-2 text-center"><Badge className="bg-red-500 text-xs">{h2h.losses}</Badge></td>
                              <td className="py-2 px-2 text-center text-gray-300 text-xs font-semibold">
                                {((h2h.wins / h2h.matches_played) * 100).toFixed(0)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">Nenhum dado disponível</div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default PlayerModal;
