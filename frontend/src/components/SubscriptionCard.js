import React from 'react';
import { CheckCircle, Mail, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

// Suas informações de contato para pagamento
const PIX_KEY = 'gustavopizatto@hotmail.com';
const WHATSAPP = '41992512250'; // substitua pelo seu número
const EMAIL = 'gustavopizatto@hotmail.com';

const SubscriptionCard = () => {
  return (
    <Card className="bg-slate-800/50 border-green-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Sistema Ativo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-gray-400 text-sm">
          Para renovar ou contratar o sistema, entre em contato via Pix ou WhatsApp.
        </p>
        <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
          <p className="text-gray-400 text-xs mb-1">Chave Pix</p>
          <p className="text-white font-mono">{PIX_KEY}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => window.open(`https://wa.me/${WHATSAPP}`, '_blank')}
            className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          <Button
            onClick={() => window.location.href = `mailto:${EMAIL}`}
            variant="outline"
            className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700 gap-2"
          >
            <Mail className="w-4 h-4" />
            E-mail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
