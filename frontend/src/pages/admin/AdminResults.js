import React, { useState, useEffect, useRef } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { FileText, Plus, Trash2, Upload, Image, CheckSquare, Square, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sortAlpha = arr => [...arr].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));


const CLASSES = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª', 'Duplas'];
const CATEGORIES = ['Feminina', 'Masculina', 'Mista'];

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filterTournament, setFilterTournament] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelectMode = () => {
    setSelectMode(v => !v);
    setSelectedIds(new Set());
  };

  const toggleSelectId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResults.map(r => r.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Excluir ${selectedIds.size} resultado(s)?`)) return;
    try {
      await Promise.all([...selectedIds].map(id => axios.delete(`${API}/results/${id}`)));
      toast.success(`${selectedIds.size} resultado(s) excluído(s)!`);
      setSelectedIds(new Set());
      setSelectMode(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir resultados');
    }
  };

  const [formData, setFormData] = useState({
    tournament_id: '',
    player_id: '',
    class_category: '1ª',
    gender_category: 'Masculina',
    placement: 1
  });
  const [importData, setImportData] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = results;
    
    if (filterTournament && filterTournament !== 'all') {
      filtered = filtered.filter(r => r.tournament_id === filterTournament);
    }
    
    if (filterClass && filterClass !== 'all') {
      filtered = filtered.filter(r => r.class_category === filterClass);
    }
    
    if (filterCategory && filterCategory !== 'all') {
      filtered = filtered.filter(r => r.gender_category === filterCategory);
    }
    
    setFilteredResults(filtered);
  }, [results, filterTournament, filterClass, filterCategory]);

  const fetchData = async () => {
    try {
      const [resultsRes, playersRes, tournamentsRes] = await Promise.all([
        axios.get(`${API}/results`),
        axios.get(`${API}/players`),
        axios.get(`${API}/tournaments`)
      ]);
      
      setResults(resultsRes.data);
      setFilteredResults(resultsRes.data);
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
    
    try {
      await axios.post(`${API}/results`, formData);
      toast.success('Resultado criado com sucesso!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar resultado');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este resultado?')) return;

    try {
      await axios.delete(`${API}/results/${id}`);
      toast.success('Resultado excluído com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir resultado');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    setImportLoading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await axios.post(`${API}/import-from-image`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportData(response.data);
      toast.success('Resultados extraídos com sucesso! Revise e salve.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao processar imagem');
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveImported = async () => {
    if (!importData || !importData.results || importData.results.length === 0) {
      toast.error('Nenhum resultado para salvar');
      return;
    }

    // Find or create tournament
    let tournamentId;
    const existingTournament = tournaments.find(t => t.name === importData.tournament_name);
    
    if (existingTournament) {
      tournamentId = existingTournament.id;
    } else {
      // Create new tournament
      try {
        const newTournament = await axios.post(`${API}/tournaments`, {
          name: importData.tournament_name,
          date: new Date().toISOString(),
          location: ''
        });
        tournamentId = newTournament.data.id;
        toast.success('Novo torneio criado!');
      } catch (error) {
        toast.error('Erro ao criar torneio');
        return;
      }
    }

    // Save all results
    let successCount = 0;
    let errorCount = 0;

    for (const result of importData.results) {
      // Try to find matching player
      let playerId;
      const matchingPlayer = players.find(p => 
        p.name.toLowerCase().trim() === result.player_name.toLowerCase().trim()
      );

      if (matchingPlayer) {
        playerId = matchingPlayer.id;
      } else {
        // Create new player
        try {
          const newPlayer = await axios.post(`${API}/players`, {
            name: result.player_name,
            photo_url: null
          });
          playerId = newPlayer.data.id;
          players.push(newPlayer.data); // Add to local array
        } catch (error) {
          console.error('Error creating player:', error);
          errorCount++;
          continue;
        }
      }

      // Create result
      try {
        await axios.post(`${API}/results`, {
          tournament_id: tournamentId,
          player_id: playerId,
          class_category: importData.class_category || '1ª',
          gender_category: result.category,
          placement: result.placement
        });
        successCount++;
      } catch (error) {
        console.error('Error creating result:', error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} resultados salvos com sucesso!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} resultados falharam`);
    }

    setImportDialogOpen(false);
    setImportData(null);
    fetchData();
  };

  const resetForm = () => {
    setFormData({
      tournament_id: '',
      player_id: '',
      class_category: '1ª',
      gender_category: 'Masculina',
      placement: 1
    });
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/results/template`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modelo_resultados.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Modelo baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar modelo');
    }
  };

  // Import from Excel
  const [importResultsDialogOpen, setImportResultsDialogOpen] = useState(false);
  const [selectedTournamentForImport, setSelectedTournamentForImport] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importResultsLoading, setImportResultsLoading] = useState(false);
  const importFileInputRef = useRef(null);

  const handleImportResults = async () => {
    if (!selectedTournamentForImport) {
      toast.error('Selecione um torneio');
      return;
    }
    
    if (!importFile) {
      toast.error('Selecione um arquivo Excel');
      return;
    }

    setImportResultsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await axios.post(
        `${API}/results/import?tournament_id=${selectedTournamentForImport}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success(response.data.message || `${response.data.results_created} resultados importados, ${response.data.results_updated || 0} atualizados`);
      
      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.slice(0, 5).forEach(err => toast.warning(err, { duration: 6000 }));
        if (response.data.errors.length > 5) {
          toast.warning(`... e mais ${response.data.errors.length - 5} avisos`);
        }
      }

      setImportResultsDialogOpen(false);
      setSelectedTournamentForImport('');
      setImportFile(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao importar resultados');
    } finally {
      setImportResultsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2" data-testid="admin-results-title">Gerenciar Resultados</h1>
          <p className="text-gray-400 text-sm">Registre resultados de torneios</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectMode ? (
            <>
              <Button
                onClick={handleDeleteSelected}
                className="bg-red-500 hover:bg-red-600 gap-2"
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="w-4 h-4" />
                Excluir {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </Button>
              <Button
                onClick={toggleSelectMode}
                variant="outline"
                className="border-slate-600 text-gray-300 hover:bg-slate-700 gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </>
          ) : (
            <Button
              onClick={toggleSelectMode}
              variant="outline"
              className="border-slate-600 text-gray-300 hover:bg-slate-700 gap-2"
            >
              <CheckSquare className="w-4 h-4" /> Selecionar
            </Button>
          )}
          <Button 
            onClick={handleDownloadTemplate}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <FileText className="w-4 h-4 mr-2" />
            Baixar Modelo
          </Button>

          <Dialog open={importResultsDialogOpen} onOpenChange={setImportResultsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600">
                <Upload className="w-4 h-4 mr-2" />
                Importar Resultados
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-green-500/20">
              <DialogHeader>
                <DialogTitle className="text-white">Importar Resultados via Excel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Selecione o Torneio</Label>
                  <Select
                    value={selectedTournamentForImport}
                    onValueChange={setSelectedTournamentForImport}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Escolha um torneio" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} - {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">Arquivo Excel</Label>
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => importFileInputRef.current?.click()}
                      variant="outline"
                      className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {importFile ? importFile.name : 'Escolher arquivo'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Formato: Player | Classe | Position
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleImportResults}
                    disabled={importResultsLoading || !selectedTournamentForImport || !importFile}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    {importResultsLoading ? 'Importando...' : 'Importar'}
                  </Button>
                  <Button
                    onClick={() => {
                      setImportResultsDialogOpen(false);
                      setSelectedTournamentForImport('');
                      setImportFile(null);
                    }}
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-500 hover:bg-purple-600" data-testid="import-button">
                <Image className="w-4 h-4 mr-2" />
                Importar de Imagem
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-purple-500/20 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Importar Resultados de Imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!importData ? (
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400 mb-4">
                      Faça upload de uma captura de tela da chave do torneio
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importLoading}
                      className="bg-blue-500 hover:bg-blue-600"
                      data-testid="upload-image-button"
                    >
                      {importLoading ? 'Processando...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Torneio Identificado</Label>
                      <Input
                        value={importData.tournament_name || ''}
                        onChange={(e) => setImportData({ ...importData, tournament_name: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Classe</Label>
                      <Select
                        value={importData.class_category || '1ª'}
                        onValueChange={(value) => setImportData({ ...importData, class_category: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSES.map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Resultados Extraídos ({importData.results?.length || 0})</Label>
                      <div className="max-h-60 overflow-y-auto bg-slate-700 rounded p-3 space-y-2">
                        {importData.results?.map((result, index) => (
                          <div key={index} className="flex items-center justify-between text-sm border-b border-slate-600 pb-2">
                            <span className="text-white">{result.placement}º - {result.player_name}</span>
                            <span className="text-gray-400">{result.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setImportData(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="flex-1 bg-gray-600 hover:bg-gray-700"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveImported}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        data-testid="save-imported-button"
                      >
                        Salvar Todos
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600" data-testid="add-result-button">
                <Plus className="w-4 h-4 mr-2" />
                Novo Resultado
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-green-500/20">
              <DialogHeader>
                <DialogTitle className="text-white">Novo Resultado</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label className="text-gray-300">Jogador</Label>
                  <Select
                    value={formData.player_id}
                    onValueChange={(value) => setFormData({ ...formData, player_id: value })}
                    required
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="player-select">
                      <SelectValue placeholder="Selecione o jogador" />
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-300">Classe</Label>
                    <Select
                      value={formData.class_category}
                      onValueChange={(value) => setFormData({ ...formData, class_category: value, gender_category: value === 'Duplas' ? 'Mista' : (formData.gender_category === 'Mista' ? 'Masculina' : formData.gender_category) })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="class-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Categoria</Label>
                    <Select
                      value={formData.gender_category}
                      onValueChange={(value) => setFormData({ ...formData, gender_category: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.class_category === 'Duplas'
                          ? ['Mista']
                          : ['Feminina', 'Masculina']
                        ).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Colocação</Label>
                  <Select
                    value={formData.placement.toString()}
                    onValueChange={(value) => setFormData({ ...formData, placement: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="placement-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}º Lugar
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" data-testid="result-submit-button">
                  Criar Resultado
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300 mb-2 block">Filtrar por Torneio</Label>
              <Select value={filterTournament} onValueChange={setFilterTournament}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="filter-tournament-select">
                  <SelectValue placeholder="Todos os torneios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os torneios</SelectItem>
                  {tournaments.map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 mb-2 block">Filtrar por Classe</Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="filter-class-select">
                  <SelectValue placeholder="Todas as classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as classes</SelectItem>
                  {CLASSES.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 mb-2 block">Filtrar por Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="filter-category-select">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : results.length === 0 ? (
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhum resultado cadastrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Todos os Resultados</CardTitle>
              {selectMode && (
                <span className="text-sm text-blue-400">
                  {selectedIds.size > 0 ? `${selectedIds.size} selecionado(s)` : 'Clique nas linhas para selecionar'}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="results-table">
                <thead>
                  <tr className="border-b border-slate-700">
                    {selectMode && (
                      <th className="py-3 px-2 w-8">
                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                          {selectedIds.size === filteredResults.length && filteredResults.length > 0
                            ? <CheckSquare className="w-4 h-4 text-blue-400" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                    )}
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm">Jogador</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm hidden sm:table-cell">Classe</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-semibold text-sm hidden md:table-cell">Categoria</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-semibold text-sm">Pos.</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-semibold text-sm hidden sm:table-cell">Pts</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr
                      key={result.id}
                      className={`border-b border-slate-700/50 transition-colors cursor-pointer ${selectMode && selectedIds.has(result.id) ? 'bg-blue-500/20' : 'hover:bg-slate-700/30'}`}
                      onClick={selectMode ? () => toggleSelectId(result.id) : undefined}
                      data-testid={`result-row-${result.id}`}
                    >
                      {selectMode && (
                        <td className="py-3 px-2">
                          {selectedIds.has(result.id)
                            ? <CheckSquare className="w-4 h-4 text-blue-400" />
                            : <Square className="w-4 h-4 text-gray-500" />}
                        </td>
                      )}
                      <td className="py-3 px-2 text-white text-sm">{result.player_name}</td>
                      <td className="py-3 px-2 text-gray-300 text-sm hidden sm:table-cell">{result.class_category}</td>
                      <td className="py-3 px-2 text-gray-300 text-sm hidden md:table-cell">{result.gender_category}</td>
                      <td className="py-3 px-2 text-center text-white font-semibold text-sm">{result.placement}º</td>
                      <td className="py-3 px-2 text-center text-green-400 font-semibold text-sm hidden sm:table-cell">{result.points}</td>
                      <td className="py-3 px-4 text-center">
                        {!selectMode && (
                          <Button
                            onClick={() => handleDelete(result.id)}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600"
                            data-testid={`delete-result-${result.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminResults;
