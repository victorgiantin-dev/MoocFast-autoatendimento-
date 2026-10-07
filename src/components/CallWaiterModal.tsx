import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { X, BellRing, Receipt, Coffee, HelpCircle, CheckCircle2 } from 'lucide-react';

interface CallWaiterModalProps {
  onClose: () => void;
}

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({ onClose }) => {
  const { tableNumber, callWaiter, waiterCallReason, dismissWaiterCall } = useRestaurant();
  const [successMessage, setSuccessMessage] = useState(false);

  const options = [
    { id: 'garcom', label: 'Chamar Garçom na Mesa', icon: BellRing, desc: 'Dúvidas ou atendimento presencial' },
    { id: 'conta', label: 'Trazer a Conta / Fechamento', icon: Receipt, desc: 'Solicitar fechamento e conferência' },
    { id: 'guardanapo', label: 'Guardanapos & Molhos Extras', icon: Coffee, desc: 'Ketchup, maionese extra ou guardanapos' },
    { id: 'outro', label: 'Outra Solicitação', icon: HelpCircle, desc: 'Ajuda da equipe' },
  ];

  const handleSelect = (label: string) => {
    callWaiter(`${label} (${tableNumber})`);
    setSuccessMessage(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleCancelCall = () => {
    dismissWaiterCall();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-stone-900 border-2 border-stone-700 max-w-md w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-amber-400 text-stone-950 rounded-xl flex items-center justify-center font-black">
              🛎️
            </div>
            <div>
              <h2 className="text-lg font-black">Atendimento na {tableNumber}</h2>
              <p className="text-xs text-amber-200">Como podemos ajudar?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-black/30 hover:bg-black/50 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3">
          {successMessage ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-black text-white">Chamado Enviado!</h3>
              <p className="text-xs text-stone-300">
                Um membro da equipe MoocFast já está a caminho da {tableNumber}.
              </p>
            </div>
          ) : waiterCallReason ? (
            <div className="py-4 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold">
                ⚠️ Há um chamado ativo para a sua mesa:
                <div className="text-white font-black text-sm mt-1">{waiterCallReason}</div>
              </div>
              <button
                onClick={handleCancelCall}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
              >
                Cancelar Chamado
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {options.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.label)}
                    className="w-full p-3.5 rounded-2xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700 hover:border-amber-400 text-left flex items-center gap-3.5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-stone-700 group-hover:bg-amber-400 group-hover:text-stone-950 text-amber-400 flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300">
                        {opt.label}
                      </h4>
                      <p className="text-[11px] text-stone-400">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
