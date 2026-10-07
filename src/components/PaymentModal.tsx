import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { PaymentMethod } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  X,
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  SmartphoneNfc,
  Wifi,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess }) => {
  const { cartTotal, tableNumber, createNewOrder, cart } = useRestaurant();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixTimeRemaining, setPixTimeRemaining] = useState(300); // 5 min
  const [copiedPix, setCopiedPix] = useState(false);
  const [cardStep, setCardStep] = useState<'tap' | 'processing' | 'approved'>('tap');

  // Simulated Pix Code
  const pixCopiaECola = `00020126580014br.gov.bcb.pix0136moocfast-pagamentos-totem-${Date.now()}520400005303986540${cartTotal.toFixed(2)}5802BR5908MOOCFAST6009SAOPAULO62070503***6304E8A2`;

  // Countdown timer for Pix
  useEffect(() => {
    if (selectedMethod !== 'pix') return;
    const interval = setInterval(() => {
      setPixTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedMethod]);

  const copyPixCode = () => {
    navigator.clipboard?.writeText(pixCopiaECola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleFinishPayment = async (method: PaymentMethod) => {
    setIsProcessing(true);

    try {
      // Simulate real bank gateway response delay
      await new Promise(resolve => setTimeout(resolve, 1400));

      // Trigger confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DC2626', '#F59E0B', '#10B981', '#FBBF24'],
      });

      await createNewOrder(method, customerName.trim() || undefined);
      onSuccess();
    } catch (err) {
      console.error('Erro ao registrar pedido', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Card contactless tap simulation
  const handleCardTap = () => {
    setCardStep('processing');
    setTimeout(() => {
      setCardStep('approved');
      setTimeout(() => {
        handleFinishPayment(selectedMethod);
      }, 900);
    }, 1600);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-stone-900 border-2 border-stone-700 max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-200">
              {tableNumber} • Pagamento Seguro Integrado
            </div>
            <h2 className="text-xl sm:text-2xl font-black leading-tight">
              Total: {formatCurrency(cartTotal)}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-9 h-9 rounded-xl bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name input */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800">
          <label className="block text-xs font-bold text-stone-300 mb-1">
            Nome para chamar quando ficar pronto (Opcional):
          </label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Ex: Victor, Carlos, Família Silva..."
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Method Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-3 bg-stone-950 border-b border-stone-800">
          <button
            type="button"
            onClick={() => setSelectedMethod('pix')}
            className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              selectedMethod === 'pix'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg ring-1 ring-amber-400'
                : 'bg-stone-800/60 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-300" />
            <span>PIX Instantâneo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMethod('credit');
              setCardStep('tap');
            }}
            className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              selectedMethod === 'credit' || selectedMethod === 'debit'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg ring-1 ring-amber-400'
                : 'bg-stone-800/60 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <SmartphoneNfc className="w-4 h-4 text-amber-300" />
            <span>Cartão na Mesa</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('counter')}
            className={`py-3 px-2 rounded-2xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              selectedMethod === 'counter'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg ring-1 ring-amber-400'
                : 'bg-stone-800/60 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-300" />
            <span>Pagar no Caixa</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* 1. PIX */}
          {selectedMethod === 'pix' && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 py-1.5 px-3 rounded-full w-fit mx-auto">
                <Clock className="w-3.5 h-3.5" />
                <span>Expira em: {formatTimer(pixTimeRemaining)}</span>
              </div>

              {/* Dynamic QR Code mockup with SVG pattern */}
              <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 bg-white p-3.5 rounded-3xl shadow-xl border-4 border-amber-400 flex flex-col items-center justify-center">
                {/* Real-like QR code graphic */}
                <div className="w-full h-full bg-stone-950 rounded-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:10px_10px] opacity-90" />
                  <div className="relative z-10 bg-amber-400 text-stone-950 font-black text-xs px-2.5 py-1 rounded-lg shadow-md border border-stone-900">
                    MOOC FAST PIX
                  </div>
                  <div className="relative z-10 text-[10px] text-white mt-1 font-bold">
                    {formatCurrency(cartTotal)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-300">
                Abra o app do seu banco no celular e aponte a câmera para o QR Code acima.
              </p>

              {/* Pix copia e cola */}
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixCopiaECola}
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-400 truncate select-all"
                />
                <button
                  type="button"
                  onClick={copyPixCode}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-stone-600 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* Instant Auto-approval Simulator for Tablet Kiosk */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleFinishPayment('pix')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-950/40 border border-emerald-300/40 flex items-center justify-center gap-2 transition-all"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirmando PIX no Banco Central...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Simular Aprovação Automática do PIX</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 2. CARD CONTACTLESS ON TABLE */}
          {(selectedMethod === 'credit' || selectedMethod === 'debit') && (
            <div className="space-y-5 text-center py-2">
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('credit')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                    selectedMethod === 'credit'
                      ? 'bg-amber-400 text-stone-950 font-black'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('debit')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                    selectedMethod === 'debit'
                      ? 'bg-amber-400 text-stone-950 font-black'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  Débito
                </button>
              </div>

              {/* Contactless terminal simulation */}
              <div className="bg-stone-950 border-2 border-dashed border-amber-500/50 rounded-3xl p-6 relative overflow-hidden">
                {cardStep === 'tap' && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                      <Wifi className="w-8 h-8 transform rotate-90" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        Aproximação Contactless no Tablet
                      </h3>
                      <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                        Aproxime seu cartão com tecnologia por aproximação, celular (Apple Pay / Google Pay) ou smartwatch na lateral do tablet.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCardTap}
                      className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm shadow-lg shadow-amber-950/40 inline-flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Simular Aproximação de Cartão</span>
                    </button>
                  </div>
                )}

                {cardStep === 'processing' && (
                  <div className="space-y-3 py-4">
                    <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h3 className="text-base font-black text-white">Processando Cartão...</h3>
                    <p className="text-xs text-stone-400">Não retire o cartão</p>
                  </div>
                )}

                {cardStep === 'approved' && (
                  <div className="space-y-2 py-4 text-emerald-400">
                    <CheckCircle2 className="w-14 h-14 mx-auto animate-bounce" />
                    <h3 className="text-lg font-black text-white">Pagamento Aprovado!</h3>
                    <p className="text-xs text-stone-300">Enviando pedido para a chapa...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. COUNTER / CASHIER */}
          {selectedMethod === 'counter' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Pagar no Caixa ou ao Garçom
                </h3>
                <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Seu pedido será enviado imediatamente para a cozinha para já começar o preparo. Você poderá efetuar o pagamento diretamente no caixa ou solicitar a maquininha na mesa quando for embora.
                </p>
              </div>

              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-left space-y-1">
                <div className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pedido lançado na {tableNumber}</span>
                </div>
                <div className="text-xs text-stone-400">
                  Total de {formatCurrency(cartTotal)} pendente de acerto.
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleFinishPayment('counter')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-red-950/40 border border-amber-300/40 flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? 'Enviando para a cozinha...' : 'Confirmar e Enviar Pedido para a Cozinha'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
