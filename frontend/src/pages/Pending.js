import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Copy, CheckCircle, LogOut, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { logout } from '../lib/api';

// Substitua pela sua chave Pix e QR code
const PIX_KEY = '41992512250';
const PIX_NAME = 'Gustavo Pizatto';
const PIX_VALUE = 'R$ 79,90/mês ou 600,00/anual';

const Pending = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    toast.success('Chave Pix copiada!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acesso Pendente</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Sua conta foi criada. Para ativar o acesso, realize o pagamento via Pix e aguarde a confirmação manual.
          </p>
        </div>

        {/* Pix Card */}
        <Card className="bg-slate-800/60 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <QrCode className="w-5 h-5 text-green-400" />
              Pagamento via Pix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* QR Code placeholder — substitua pela imagem do seu QR */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl">
                <img
                  src="/qrcode-pix.png"
                  alt="QR Code Pix"
                  className="w-48 h-48 object-contain rounded"
                />
              </div>
            </div>

            {/* Chave Pix */}
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Chave Pix</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-mono text-sm break-all">{PIX_KEY}</span>
                <Button
                  onClick={handleCopy}
                  size="sm"
                  variant="outline"
                  className="border-slate-500 text-gray-300 hover:bg-slate-600 shrink-0"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Beneficiário</p>
                <p className="text-white font-semibold">{PIX_NAME}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Valor</p>
                <p className="text-green-400 font-bold">{PIX_VALUE}</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
              ⏳ Após o pagamento, envie o comprovante para <strong>{PIX_KEY}</strong>. 
              O acesso será liberado manualmente em até 24h.
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-slate-600 text-gray-400 hover:bg-slate-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>

      </div>
    </div>
  );
};

export default Pending;
