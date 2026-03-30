import React, { useState, useEffect } from 'react';
import axios, { API } from '../../lib/api';
import { Users, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/pending-users`);
      setUsers(res.data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (username) => {
    try {
      await axios.post(`${API}/admin/approve-user/${encodeURIComponent(username)}`);
      toast.success(`${username} aprovado!`);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao aprovar');
    }
  };

  const handleRevoke = async (username) => {
    if (!window.confirm(`Revogar acesso de ${username}?`)) return;
    try {
      await axios.post(`${API}/admin/revoke-user/${encodeURIComponent(username)}`);
      toast.success(`Acesso de ${username} revogado`);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao revogar');
    }
  };

  // Also fetch all users to show approved ones
  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => {
    axios.get(`${API}/admin/all-users`).then(r => setAllUsers(r.data)).catch(() => {});
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          Gestão de Usuários
        </h1>
        <p className="text-gray-400 text-sm">Aprove ou revogue acesso dos usuários que realizaram pagamento.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Aguardando Aprovação ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">Nenhum usuário pendente.</p>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{u.username}</p>
                      <p className="text-gray-400 text-xs">
                        Cadastrado em {u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                      </p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shrink-0">
                      Pendente
                    </Badge>
                    <Button
                      onClick={() => handleApprove(u.username)}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {allUsers.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Todos os Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{u.username}</p>
                  </div>
                  {u.is_owner ? (
                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">Dono</Badge>
                  ) : u.is_approved ? (
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">Aprovado</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shrink-0">Pendente</Badge>
                  )}
                  {!u.is_owner && u.is_approved && (
                    <Button onClick={() => handleRevoke(u.username)} size="sm" className="bg-red-500 hover:bg-red-600 shrink-0">
                      <XCircle className="w-4 h-4 mr-1" /> Revogar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUsers;
