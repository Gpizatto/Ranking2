import React, { useState, useEffect } from 'react';
import axios, { API } from '../../lib/api';
import { Palette, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

const THEMES = [
  {
    id: 'green',
    name: 'Verde Escuro',
    description: 'Tema padrão',
    accent: '#22c55e',
    bg: 'linear-gradient(135deg, #0f172a, #1e293b)',
    preview: ['#0f172a', '#22c55e', '#4ade80'],
  },
  {
    id: 'blue',
    name: 'Azul Royal',
    description: 'Azul profissional',
    accent: '#3b82f6',
    bg: 'linear-gradient(135deg, #0c1a2e, #0f2847)',
    preview: ['#0c1a2e', '#3b82f6', '#60a5fa'],
  },
  {
    id: 'purple',
    name: 'Roxo',
    description: 'Elegante e moderno',
    accent: '#a855f7',
    bg: 'linear-gradient(135deg, #130d1f, #1e1035)',
    preview: ['#130d1f', '#a855f7', '#c084fc'],
  },
  {
    id: 'red',
    name: 'Vermelho / Vinho',
    description: 'Forte e marcante',
    accent: '#ef4444',
    bg: 'linear-gradient(135deg, #1a0a0a, #2d1010)',
    preview: ['#1a0a0a', '#ef4444', '#f87171'],
  },
  {
    id: 'orange',
    name: 'Laranja',
    description: 'Energético e vibrante',
    accent: '#f97316',
    bg: 'linear-gradient(135deg, #1a0f00, #2d1a00)',
    preview: ['#1a0f00', '#f97316', '#fb923c'],
  },
  {
    id: 'silver',
    name: 'Cinza / Prata',
    description: 'Neutro e sofisticado',
    accent: '#94a3b8',
    bg: 'linear-gradient(135deg, #0d0f12, #1a1f27)',
    preview: ['#0d0f12', '#94a3b8', '#cbd5e1'],
  },
];

const AdminLayout = () => {
  const [currentTheme, setCurrentTheme] = useState('green');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/theme`).then(res => {
      setCurrentTheme(res.data.theme || 'green');
    }).catch(() => {});
  }, []);

  const handleSelectTheme = async (themeId) => {
    setSaving(true);
    try {
      await axios.put(`${API}/theme?theme=${themeId}`);
      setCurrentTheme(themeId);
      document.documentElement.setAttribute('data-theme', themeId);
      toast.success('Tema aplicado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar tema');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Palette className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          Layout & Cores
        </h1>
        <p className="text-gray-400 text-sm">Escolha o tema de cores do sistema. A mudança é aplicada para todos os visitantes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {THEMES.map((theme) => {
          const isActive = currentTheme === theme.id;
          return (
            <Card
              key={theme.id}
              onClick={() => !saving && handleSelectTheme(theme.id)}
              className={`cursor-pointer transition-all duration-200 overflow-hidden border-2 ${
                isActive
                  ? 'border-white/40 scale-[1.02] shadow-xl'
                  : 'border-slate-700 hover:border-slate-500 hover:scale-[1.01]'
              }`}
              style={{ background: theme.bg }}
            >
              {/* Color strip preview */}
              <div className="flex h-3">
                {theme.preview.map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>

              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {isActive && <Check className="w-5 h-5 text-white font-bold" />}
                  </div>
                  {isActive && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                      Ativo
                    </span>
                  )}
                </div>
                <h3 className="text-white font-bold text-lg">{theme.name}</h3>
                <p className="text-gray-400 text-sm mt-0.5">{theme.description}</p>

                {/* Mini UI preview */}
                <div className="mt-4 space-y-1.5">
                  <div className="h-2 rounded-full w-3/4 opacity-30" style={{ backgroundColor: theme.accent }} />
                  <div className="h-2 rounded-full w-1/2 bg-white/10" />
                  <div className="mt-2 flex gap-1.5">
                    <div className="h-5 w-12 rounded text-xs flex items-center justify-center text-white font-semibold text-[10px]"
                      style={{ backgroundColor: theme.accent }}>
                      Botão
                    </div>
                    <div className="h-5 w-16 rounded bg-white/10 text-[10px] text-gray-400 flex items-center justify-center">
                      Cancelar
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">ℹ️ Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 text-sm space-y-1">
          <p>• O tema é salvo no banco de dados e aplicado para todos os visitantes do site.</p>
          <p>• A cor de destaque afeta botões, bordas, links ativos e elementos de navegação.</p>
          <p>• O fundo escuro muda de tom junto com a cor escolhida.</p>
          <p>• A mudança é aplicada imediatamente, sem precisar recarregar a página.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLayout;
