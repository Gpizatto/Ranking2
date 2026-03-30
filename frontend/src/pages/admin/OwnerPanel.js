import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import {
  Crown, UserCheck, UserX, Users, Clock, CheckCircle,
  XCircle, ShieldOff, RefreshCw, BadgeAlert, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

const statusColor = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  canceled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusLabel = {
  active: 'Ativa',
  pending: 'Pendente pagamento',
  expired: 'Expirada',
  canceled: 'Cancelada',
};

const planLabel = {
  mensal: 'Mensal',
  anual: 'Anual',
};

const OwnerPanel = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        axios.get(`${API}/admin/pending-users`),
        axios.get(`${API}/admin/all-users`),
      ]);
      setPending(pendingRes.data);
      setAllUsers(allRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados. Verifique se você é o owner.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (username, name) => {
    setActionLoading(username + '_approve');
    try {
      await axios.post(`${API}/admin/approve-user/${username}`);
      toast.success(`${name} aprovado com sucesso!`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao aprovar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (username, name) => {
    if (!window.confirm(`Rejeitar o cadastro de "${name}"? O acesso não será liberado.`)) return;
    setActionLoading(username + '_reject');
    try {
      await axios.post(`${API}/admin/revoke-user/${username}`);
      toast.success(`Cadastro de ${name} rejeitado.`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao rejeitar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (username, name) => {
    if (!window.confirm(`Revogar acesso de "${name}"? O usuário ficará bloqueado.`)) return;
    setActionLoading(username + '_revoke');
    try {
      await axios.post(`${API}/admin/revoke-user/${username}`);
      toast.success(`Acesso de ${name} revogado.`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao revogar');
    } finally {
      setActionLoading(null);
    }
  };

  const approved = allUsers.filter(u => u.is_approved);
  const notApproved = allUsers.filter(u => !u.is_approved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Painel Owner</h1>
            <p className="text-gray-400 text-sm">Gerenciamento de contas e acessos</p>
          </div>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-slate-600 text-gray-300 hover:bg-slate-700"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Aguardando aprovação', value: pending.length, icon: Clock, color: 'from-yellow-400 to-orange-500', alert: pending.length > 0 },
          { label: 'Contas aprovadas', value: approved.length, icon: UserCheck, color: 'from-green-400 to-green-600' },
          { label: 'Contas bloqueadas', value: notApproved.length, icon: UserX, color: 'from-red-400 to-red-600' },
          { label: 'Total de contas', value: allUsers.length, icon: Users, color: 'from-blue-400 to-blue-600' },
        ].map(({ label, value, icon: Icon, color, alert }) => (
          <Card key={label} className={`bg-slate-800/50 ${alert ? 'border-yellow-500/40' : 'border-blue-500/20'}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {alert && <BadgeAlert className="w-4 h-4 text-yellow-400 animate-pulse" />}
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-0">
        {[
          { key: 'pending', label: `Pendentes (${pending.length})`, icon: Clock },
          { key: 'approved', label: `Aprovadas (${approved.length})`, icon: CheckCircle },
          { key: 'blocked', label: `Bloqueadas (${notApproved.length})`, icon: XCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-blue-500 text-white bg-slate-800/50'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {key === 'pending' && pending.length > 0 && (
              <span className="ml-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
          Carregando...
        </div>
      ) : (
        <>
          {/* PENDENTES */}
          {tab === 'pending' && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3 opacity-60" />
                    <p className="text-gray-400">Nenhum cadastro aguardando aprovação.</p>
                  </CardContent>
                </Card>
              ) : pending.map(user => (
                <Card key={user.id} className="bg-slate-800/50 border-yellow-500/30">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{user.federation_name || '—'}</span>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                            Aguardando aprovação
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">{user.username}</div>
                        <div className="text-xs text-gray-500">
                          Registrado em: {user.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : '—'}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* APROVADAS */}
          {tab === 'approved' && (
            <div className="space-y-3">
              {approved.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center text-gray-400">
                    Nenhuma conta aprovada ainda.
                  </CardContent>
                </Card>
              ) : approved.map(user => {
                const sub = user.subscription;
                const endDate = sub?.end_date ? new Date(sub.end_date) : null;
                const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - new Date()) / 86400000)) : null;

                return (
                  <Card key={user.id} className="bg-slate-800/50 border-green-500/20">
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">{user.federation_name || '—'}</span>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Aprovada
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400">{user.username}</div>
                          {sub && (
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusColor[sub.status] || statusColor.pending}`}>
                                <CreditCard className="w-3 h-3" />
                                {statusLabel[sub.status] || sub.status} — {planLabel[sub.plan_type] || sub.plan_type}
                              </span>
                              {endDate && (
                                <span className={`text-xs ${daysLeft <= 7 ? 'text-red-400' : 'text-gray-500'}`}>
                                  {daysLeft > 0 ? `Expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}` : 'Expirada'}
                                  {' '}({endDate.toLocaleDateString('pt-BR')})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleRevoke(user.username, user.federation_name || user.username)}
                          disabled={actionLoading === user.username + '_revoke'}
                          variant="outline"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1.5 shrink-0"
                          size="sm"
                        >
                          <ShieldOff className="w-4 h-4" />
                          {actionLoading === user.username + '_revoke' ? 'Revogando...' : 'Revogar acesso'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* BLOQUEADAS */}
          {tab === 'blocked' && (
            <div className="space-y-3">
              {notApproved.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center text-gray-400">
                    Nenhuma conta bloqueada.
                  </CardContent>
                </Card>
              ) : notApproved.map(user => (
                <Card key={user.id} className="bg-slate-800/50 border-red-500/20">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{user.federation_name || '—'}</span>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            Bloqueada
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">{user.username}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          onClick={() => handleApprove(user.username, user.federation_name || user.username)}
                          disabled={actionLoading === user.username + '_approve'}
                          className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                          size="sm"
                        >
                          <UserCheck className="w-4 h-4" />
                          {actionLoading === user.username + '_approve' ? 'Aprovando...' : 'Reativar'}
                        </Button>
                        <Button
                          onClick={() => handleReject(user.username, user.federation_name || user.username)}
                          disabled={actionLoading === user.username + '_reject'}
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-1.5"
                          size="sm"
                        >
                          <UserX className="w-4 h-4" />
                          {actionLoading === user.id + '_reject' ? 'Removendo...' : 'Remover'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OwnerPanel;
