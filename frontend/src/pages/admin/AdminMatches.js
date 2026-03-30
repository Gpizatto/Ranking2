import React, { useState, useEffect, useRef } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { Swords, Plus, Trash2, Upload, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sortAlpha = arr => [...arr].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));


const ROUNDS = ['Final', 'Semi Final', 'Quarter Final', 'Round of 16', 'Round of 32', 'Group Stage'];

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tournament_id: '',
    category: '1ª',
    player1_id: '',
    player2_id: '',
    winner_id: '',
    score: ['', '', ''],
    round: 'Final',
    date: new Date().toISOString().split('T')[0]
  });
  const [importResult, setImportResult] = useState(null);
  const [isWO, setIsWO] = useState(false);
  const [filterTournament, setFilterTournament] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRound, setFilterRound] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [importDialogMatchesOpen, setImportDialogMatchesOpen] = useState(false);
  const [importTournamentId, setImportTournamentId] = useState('');
  const [importMatchFile, setImportMatchFile] = useState(null);
  const [importMatchLoading, setImportMatchLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, playersRes, tournamentsRes] = await Promise.all([
        axios.get(`${API}/matches`),
        axios.get(`${API}/players`),
        axios.get(`${API}/tournaments`)
      ]);
      
      setMatches(matchesRes.data);
      setPlayers(sortAlpha(playersRes.data));
      setTournaments(tournamentsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty score entries
    const scoreFiltered = isWO ? ['W.O.'] : formData.score.filter(s => s.trim() !== '');
    
    if (!isWO && scoreFiltered.length === 0) {
      toast.error('Adicione pelo menos um placar ou marque como W.O.');
      return;
    }

    try {
      await axios.post(`${API}/matches`, {
        ...formData,
        score: scoreFiltered,
        date: new Date(formData.date).toISOString()
      });
      
      toast.success('Partida registrada com sucesso!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao registrar partida');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta partida?')) return;

    try {
      await axios.delete(`${API}/matches/${id}`);
      toast.success('Partida excluída com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir partida');
    }
  };

  const handleImportExcel = async () => {
    if (!importTournamentId) {
      toast.error('Selecione um torneio');
      return;
    }
    if (!importMatchFile) {
      toast.error('Selecione um arquivo Excel');
      return;
    }

    setImportMatchLoading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', importMatchFile);

    try {
      const response = await axios.post(
        `${API}/import-matches-excel?tournament_id=${importTournamentId}`,
        formDataUpload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setImportResult(response.data);

      if (response.data.matches_created > 0 || response.data.matches_skipped >= 0) {
        const msg = `${response.data.matches_created} partidas importadas` +
          (response.data.matches_skipped > 0 ? `, ${response.data.matches_skipped} ignoradas (duplicadas)` : '');
        toast.success(msg);
        fetchData();
      }

      if (response.data.errors && response.data.errors.length > 0) {
        toast.error(`${response.data.errors.length} erros encontrados`);
      }

      setImportDialogMatchesOpen(false);
      setImportTournamentId('');
      setImportMatchFile(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao importar Excel');
    } finally {
      setImportMatchLoading(false);
    }
  };

  const resetForm = () => {
    setIsWO(false);
    setFormData({
      tournament_id: '',
      category: '1ª',
      player1_id: '',
      player2_id: '',
      winner_id: '',
      score: ['', '', ''],
      round: 'Final',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const addScoreSet = () => {
    setFormData({ ...formData, score: [...formData.score, ''] });
  };

  const removeScoreSet = (index) => {
    const newScore = formData.score.filter((_, i) => i !== index);
    setFormData({ ...formData, score: newScore });
  };

  const updateScore = (index, value) => {
    const newScore = [...formData.score];
    newScore[index] = value;
    setFormData({ ...formData, score: newScore });
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/matches/template`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modelo_partidas.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Modelo baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar modelo');
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filterTournament !== 'all' && m.tournament_id !== filterTournament) return false;
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    if (filterRound !== 'all' && m.round !== filterRound) return false;
    if (filterSearch) {
      const s = filterSearch.toLowerCase();
      if (!m.player1_name.toLowerCase().includes(s) && !m.player2_name.toLowerCase().includes(s) && !m.tournament_name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const uniqueCategories = [...new Set(matches.map(m => m.category))].sort();
  const uniqueRounds = [...new Set(matches.map(m => m.round))].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2" data-testid="admin-matches-title">Gerenciar Partidas</h1>
          <p className="text-gray-400 text-sm">Registre partidas e histórico de jogos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownloadTemplate}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <FileText className="w-4 h-4 mr-2" />
            Baixar Modelo
          </Button>
          <Button
            onClick={() => setImportDialogMatchesOpen(true)}
            className="bg-purple-500 hover:bg-purple-600"
            data-testid="import-matches-button"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.XLSX,.XLS"
            onChange={(e) => setImportMatchFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          
          {/* Dialog de Importar Partidas */}
          <Dialog open={importDialogMatchesOpen} onOpenChange={setImportDialogMatchesOpen}>
            <DialogContent className="bg-slate-800 border-purple-500/20 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Importar Partidas (Tournament Planner)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Selecione o torneio e o arquivo Excel exportado do Tournament Planner.
                  O arquivo pode ter múltiplas abas (uma por dia).
                </p>
                <div>
                  <Label className="text-gray-300">Torneio *</Label>
                  <Select value={importTournamentId} onValueChange={setImportTournamentId}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Selecione o torneio" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {tournaments.map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-white hover:bg-slate-600">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Arquivo Excel *</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Escolher arquivo
                    </Button>
                    {importMatchFile && (
                      <span className="text-green-400 text-sm truncate max-w-[180px]">{importMatchFile.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    className="border-slate-600 text-gray-300"
                    onClick={() => { setImportDialogMatchesOpen(false); setImportTournamentId(''); setImportMatchFile(null); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-purple-500 hover:bg-purple-600"
                    onClick={handleImportExcel}
                    disabled={importMatchLoading}
                  >
                    {importMatchLoading ? 'Importando...' : 'Importar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600" data-testid="add-match-button">
                <Plus className="w-4 h-4 mr-2" />
                Nova Partida
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-green-500/20 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Registrar Nova Partida</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-300">Torneio</Label>
                    <Select
                      value={formData.tournament_id}
                      onValueChange={(value) => setFormData({ ...formData, tournament_id: value })}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="tournament-select">
                        <SelectValue placeholder="Selecione o torneio" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournaments.map(tournament => (
                          <SelectItem key={tournament.id} value={tournament.id}>
                            {tournament.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1ª">1ª Classe</SelectItem>
                        <SelectItem value="2ª">2ª Classe</SelectItem>
                        <SelectItem value="3ª">3ª Classe</SelectItem>
                        <SelectItem value="4ª">4ª Classe</SelectItem>
                        <SelectItem value="5ª">5ª Classe</SelectItem>
                        <SelectItem value="6ª">6ª Classe</SelectItem>
                        <SelectItem value="Duplas">Duplas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-300">Jogador 1</Label>
                    <Select
                      value={formData.player1_id}
                      onValueChange={(value) => setFormData({ ...formData, player1_id: value })}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="player1-select">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Jogador 2</Label>
                    <Select
                      value={formData.player2_id}
                      onValueChange={(value) => setFormData({ ...formData, player2_id: value })}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="player2-select">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="wo-checkbox"
                    checked={isWO}
                    onChange={(e) => {
                      setIsWO(e.target.checked);
                      if (e.target.checked) setFormData({ ...formData, score: [] });
                      else setFormData({ ...formData, score: ['', '', ''] });
                    }}
                    className="w-4 h-4 accent-green-500"
                  />
                  <label htmlFor="wo-checkbox" className="text-gray-300 font-medium cursor-pointer select-none">
                    W.O. (Walkover — adversário não compareceu)
                  </label>
                </div>

                <div className={isWO ? 'opacity-40 pointer-events-none' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-gray-300">Placar (formato: 11-7)</Label>
                    <Button type="button" onClick={addScoreSet} size="sm" variant="ghost" className="text-green-400">
                      + Set
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.score.map((score, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={score}
                          onChange={(e) => updateScore(index, e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="11-7"
                          data-testid={`score-input-${index}`}
                        />
                        {formData.score.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeScoreSet(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Exemplo: 11-7, 8-11, 11-6, 11-9</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-300">Vencedor</Label>
                    <Select
                      value={formData.winner_id}
                      onValueChange={(value) => setFormData({ ...formData, winner_id: value })}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="winner-select">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.player1_id && (
                          <SelectItem value={formData.player1_id}>
                            {players.find(p => p.id === formData.player1_id)?.name}
                          </SelectItem>
                        )}
                        {formData.player2_id && (
                          <SelectItem value={formData.player2_id}>
                            {players.find(p => p.id === formData.player2_id)?.name}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Rodada</Label>
                    <Select
                      value={formData.round}
                      onValueChange={(value) => setFormData({ ...formData, round: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="round-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROUNDS.map(round => (
                          <SelectItem key={round} value={round}>{round}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="match-date-input"
                  />
                </div>

                <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" data-testid="match-submit-button">
                  Registrar Partida
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <Card className="bg-blue-500/10 border-blue-500/50">
          <CardContent className="pt-6">
            <h3 className="text-white font-semibold mb-2">Resultado da Importação:</h3>
            <p className="text-green-400">✅ {importResult.matches_created} partidas criadas</p>
            {importResult.matches_skipped > 0 && (
              <p className="text-yellow-400">⏭️ {importResult.matches_skipped} ignoradas (já existiam)</p>
            )}
            {importResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-400">❌ {importResult.errors.length} erros:</p>
                <ul className="text-xs text-gray-400 mt-1 max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Matches List */}
      {/* Filtros */}
      {!loading && matches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar jogador ou torneio..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="bg-slate-800/50 border-slate-600 text-white pl-9 text-sm"
            />
          </div>
          <Select value={filterTournament} onValueChange={setFilterTournament}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white text-sm">
              <SelectValue placeholder="Todos os torneios" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">Todos os torneios</SelectItem>
              {tournaments.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white text-sm">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">Todas as categorias</SelectItem>
              {uniqueCategories.map(cat => (
                <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRound} onValueChange={setFilterRound}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white text-sm">
              <SelectValue placeholder="Todas as rodadas" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">Todas as rodadas</SelectItem>
              {uniqueRounds.map(r => (
                <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : matches.length === 0 ? (
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <Swords className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhuma partida registrada</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white">Todas as Partidas ({matches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="matches-table">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm hidden sm:table-cell">Data</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm hidden md:table-cell">Torneio</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm hidden sm:table-cell">Cat.</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm">Partida</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm hidden md:table-cell">Placar</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm hidden lg:table-cell">Rodada</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => (
                    <tr key={match.id} className="border-b border-slate-700/50 hover:bg-slate-700/30" data-testid={`match-row-${match.id}`}>
                      <td className="py-3 px-4 text-gray-300">
                        {format(new Date(match.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-white">{match.tournament_name}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-blue-500">{match.category}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white">
                          <span className={match.winner_id === match.player1_id ? 'font-bold text-green-400' : ''}>
                            {match.player1_name}
                          </span>
                          <span className="text-gray-400 mx-2">vs</span>
                          <span className={match.winner_id === match.player2_id ? 'font-bold text-green-400' : ''}>
                            {match.player2_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-300 font-mono text-xs hidden md:table-cell">
                        {match.score && match.score.includes('W.O.') ? <span className="text-yellow-400 font-semibold">W.O.</span> : match.score.join(' ')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-purple-500">{match.round}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          onClick={() => handleDelete(match.id)}
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                          data-testid={`delete-match-${match.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Excel Format Guide */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white text-sm">📋 Formato do Excel para Importação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400 space-y-2">
          <p><strong className="text-white">Sheet "Matches"</strong> com colunas:</p>
          <p className="font-mono bg-slate-900 p-2 rounded text-xs">
            Tournament | Category | Round | Player1 | Player2 | Score | Winner | Date
          </p>
          <p>Exemplo:</p>
          <p className="font-mono bg-slate-900 p-2 rounded text-xs">
            Copa PR | 1a | Final | João Silva | Pedro Lima | 11-7 8-11 11-6 | João Silva | 2025-01-15
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMatches;
