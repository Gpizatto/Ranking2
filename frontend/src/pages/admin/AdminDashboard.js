import React, { useState, useEffect } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { Trophy, Users, Calendar, FileText, Crown, AlertCircle, UserCheck, UserX, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import SubscriptionCard from '../../components/SubscriptionCard';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    players: 0,
    tournaments: 0,
    results: 0
  });
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchStats();
    // Check owner status and pending registrations
    axios.get(`${API}/auth/me`).then(res => {
      if (res.data.is_owner) {
        setIsOwner(true);
        axios.get(`${API}/admin/pending-users`).then(r => { setPendingCount(r.data.length); setPendingUsers(r.data); }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const fetchStats = async () => {
    try {
      const [playersRes, tournamentsRes, resultsRes] = await Promise.all([
        axios.get(`${API}/players`),
        axios.get(`${API}/tournaments`),
        axios.get(`${API}/results`)
      ]);
      
      setStats({
        players: playersRes.data.length,
        tournaments: tournamentsRes.data.length,
        results: resultsRes.data.length
      });
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Jogadores', value: stats.players, icon: Users, color: 'from-green-400 to-green-600' },
    { title: 'Torneios', value: stats.tournaments, icon: Calendar, color: 'from-blue-400 to-blue-600' },
    { title: 'Resultados', value: stats.results, icon: FileText, color: 'from-purple-400 to-purple-600' },
  ];

  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  const runMigration = async () => {
    if (!window.confirm('Isso vai atualizar todos os registros no banco (1a→1ª, etc). Fazer apenas uma vez. Continuar?')) return;
    setMigrating(true);
    try {
      const res = await axios.post(`${API}/admin/migrate-class-names`);
      toast.success(`Migração OK — ${res.data.results_updated} resultados, ${res.data.matches_updated} partidas, ${res.data.players_updated} jogadores atualizados`);
      setMigrationDone(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro na migração');
    } finally {
      setMigrating(false);
    }
  };

  const handleApprove = async (username, name) => {
    setActionLoading(username + '_approve');
    try {
      await axios.post(`${API}/admin/approve-user/${username}`);
      toast.success(`${name} aprovado com sucesso!`);
      const updated = pendingUsers.filter(u => u.username !== username);
      setPendingUsers(updated);
      setPendingCount(updated.length);
    } catch (e) {
      toast.error('Erro ao aprovar cadastro');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (username, name) => {
    if (!window.confirm(`Rejeitar o cadastro de "${name}"? O acesso não será liberado.`)) return;
    setActionLoading(username + '_reject');
    try {
      await axios.post(`${API}/admin/revoke-user/${username}`);
      toast.success(`Cadastro de ${name} rejeitado.`);
      const updated = pendingUsers.filter(u => u.username !== username);
      setPendingUsers(updated);
      setPendingCount(updated.length);
    } catch (e) {
      toast.error('Erro ao rejeitar cadastro');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2" data-testid="admin-dashboard-title">Dashboard Administrativo</h1>
        <p className="text-gray-400">Visão geral do sistema</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          {/* Cadastros pendentes */}
          {isOwner && pendingCount > 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-300 flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5" />
                  {pendingCount} cadastro{pendingCount !== 1 ? 's' : ''} aguardando aprovação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingUsers.map(user => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 rounded-lg p-3 border border-yellow-500/20">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{user.federation_name || '—'}</span>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Aguardando</Badge>
                      </div>
                      <div className="text-sm text-gray-400">{user.username}</div>
                      <div className="text-xs text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : '—'}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => handleApprove(user.username, user.federation_name || user.username)}
                        disabled={actionLoading === user.username + '_approve'}
                        className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                        size="sm"
                      >
                        <UserCheck className="w-4 h-4" />
                        {actionLoading === user.username + '_approve' ? 'Aprovando...' : 'Aprovar'}
                      </Button>
                      <Button
                        onClick={() => handleReject(user.username, user.federation_name || user.username)}
                        disabled={actionLoading === user.username + '_reject'}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-1.5"
                        size="sm"
                      >
                        <UserX className="w-4 h-4" />
                        {actionLoading === user.username + '_reject' ? 'Rejeitando...' : 'Rejeitar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Subscription Card */}
          <SubscriptionCard />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="bg-slate-800/50 border-blue-500/20" data-testid={`stat-card-${stat.title.toLowerCase()}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">{stat.title}</CardTitle>
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white">Bem-vindo ao Painel Administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">
            Use o menu acima para gerenciar torneios, jogadores, resultados e configurações do ranking.
          </p>
         </CardContent>
      </Card>
      {/* Migração */}
      {!migrationDone && (
       <Card className="bg-orange-500/10 border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-orange-400 text-sm">🔧 Migração de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm mb-3">
              Atualiza os registros do banco de dados para o novo formato de classes (1a → 1ª, 2a → 2ª...).
              Execute apenas uma vez após o deploy.
            </p>
            <Button
              onClick={runMigration}
              disabled={migrating}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {migrating ? 'Migrando...' : 'Executar Migração'}
            </Button>
          </CardContent>
        </Card> 
      )}
    </div>
  );
};

export default AdminDashboard;
