import React, { useState, useEffect } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { Settings, Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const AdminRankingConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pointsTable, setPointsTable] = useState({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/ranking-config`);
      setConfig(response.data);
      setPointsTable(response.data.points_table);
    } catch (error) {
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await axios.put(`${API}/ranking-config`, {
        formula: config.formula,
        top_n_count: config.top_n_count,
        points_table: pointsTable
      });
      toast.success('Configuração salva com sucesso!');
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const addPlacement = () => {
    const maxPlacement = Math.max(...Object.keys(pointsTable).map(Number));
    const newPlacement = maxPlacement + 1;
    setPointsTable({ ...pointsTable, [newPlacement]: 0 });
  };

  const removePlacement = (placement) => {
    const newTable = { ...pointsTable };
    delete newTable[placement];
    setPointsTable(newTable);
  };

  const updatePoints = (placement, points) => {
    setPointsTable({ ...pointsTable, [placement]: parseFloat(points) || 0 });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Carregando...</div>;
  }

  if (!config) {
    return <div className="text-center py-12 text-gray-400">Erro ao carregar configuração</div>;
  }

  const sortedPlacements = Object.keys(pointsTable)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" data-testid="admin-config-title">Configuração do Ranking</h1>
        <p className="text-gray-400">Defina a fórmula de cálculo e a tabela de pontuação</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formula Selection */}
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Fórmula de Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Método de Cálculo</Label>
              <Select
                value={config.formula}
                onValueChange={(value) => setConfig({ ...config, formula: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="formula-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum_all">Soma de todos os resultados</SelectItem>
                  <SelectItem value="top_n">Média dos N melhores resultados</SelectItem>
                  <SelectItem value="decay">Decaimento por antiguidade</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-400 mt-2">
                {config.formula === 'sum_all' && 'Soma todos os pontos obtidos pelo jogador'}
                {config.formula === 'top_n' && 'Considera apenas os N melhores resultados'}
                {config.formula === 'decay' && 'Aplica fator de decaimento em resultados mais antigos'}
              </p>
            </div>

            {config.formula === 'top_n' && (
              <div>
                <Label className="text-gray-300">Número de Resultados (N)</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.top_n_count}
                  onChange={(e) => setConfig({ ...config, top_n_count: parseInt(e.target.value) || 1 })}
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="top-n-input"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Serão considerados os {config.top_n_count} melhores resultados de cada jogador
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Table */}
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Tabela de Pontuação</CardTitle>
              <Button
                onClick={addPlacement}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
                data-testid="add-placement-button"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {sortedPlacements.map((placement) => (
                <div key={placement} className="flex items-center gap-2" data-testid={`placement-row-${placement}`}>
                  <div className="w-20 text-white font-semibold">{placement}º lugar</div>
                  <Input
                    type="number"
                    step="0.1"
                    value={pointsTable[placement]}
                    onChange={(e) => updatePoints(placement, e.target.value)}
                    className="flex-1 bg-slate-700 border-slate-600 text-white"
                    data-testid={`points-input-${placement}`}
                  />
                  <span className="text-gray-400 w-12">pts</span>
                  <Button
                    onClick={() => removePlacement(placement)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    data-testid={`remove-placement-${placement}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 px-8"
          data-testid="save-config-button"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white text-sm">Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400 space-y-2">
          <p>• A tabela de pontuação define quantos pontos cada colocação vale</p>
          <p>• A fórmula escolhida determina como os pontos são calculados para o ranking final</p>
          <p>• Alterações afetam imediatamente todos os rankings exibidos no sistema</p>
          <p>• Você pode adicionar ou remover colocações conforme necessário</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRankingConfig;
