import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { formatCurrency, formatTime } from '../utils/formatters';
import { CheckCircle2, Clock, Utensils, ChefHat, Sparkles, X } from 'lucide-react';

interface OrderSuccessModalProps {
  onClose: () => void;
  onTrackOrder: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ onClose, onTrackOrder }) => {
  const { lastSubmittedOrder } = useRestaurant();

  if (!lastSubmittedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in zoom-in-95 duration-250">
      <div className="bg-stone-900 border-2 border-amber-500 max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col text-center my-auto">
        
        {/* Banner with celebration */}
        <div className="p-6 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white relative">
          <div className="w-16 h-16 bg-amber-400 text-stone-950 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-xl transform rotate-3">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            PEDIDO ENVIADO!
          </h2>
          <p className="text-xs sm:text-sm text-amber-200 font-bold mt-1">
            Já está sendo preparado com todo carinho na nossa chapa 🔥
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Ticket Details */}
        <div className="p-5 sm:p-6 space-y-5 text-left bg-stone-900">
          {/* Order Number Big Display */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-stone-400 uppercase font-black tracking-wider">
                Número do Pedido
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-wider">
                {lastSubmittedOrder.orderNumber}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-stone-400 uppercase font-black tracking-wider">
                Local
              </div>
              <div className="text-lg font-black text-white">
                {lastSubmittedOrder.tableNumber}
              </div>
            </div>
          </div>

          {/* Kitchen Progress Tracker */}
          <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-stone-300 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>Status da Cozinha</span>
              </span>
              <span className="text-amber-400 font-black animate-pulse">
                Em Preparo na Chapa
              </span>
            </div>

            {/* Stepper bar */}
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-amber-400 h-full w-2/3 rounded-full animate-pulse" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>Tempo estimado: 15-20 min</span>
              </span>
              <span>{formatTime(lastSubmittedOrder.createdAt)}</span>
            </div>
          </div>

          {/* Items Summary list */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase text-stone-400 tracking-wider">
              Resumo dos Itens ({lastSubmittedOrder.items.length})
            </div>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {lastSubmittedOrder.items.map(item => (
                <div
                  key={item.cartId}
                  className="text-xs flex items-center justify-between bg-stone-950/50 p-2 rounded-xl border border-stone-800"
                >
                  <div className="truncate pr-2">
                    <span className="font-black text-amber-400 mr-2">{item.quantity}x</span>
                    <span className="text-stone-200 font-bold">{item.product.name}</span>
                    {item.selectedMeatPoint && (
                      <span className="text-[10px] text-amber-300 ml-1">({item.selectedMeatPoint})</span>
                    )}
                  </div>
                  <span className="text-stone-400 font-bold shrink-0">
                    {formatCurrency(item.totalItemPrice)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-stone-800 flex justify-between text-sm font-black">
              <span className="text-stone-300">Total Pago</span>
              <span className="text-amber-400">{formatCurrency(lastSubmittedOrder.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 flex gap-2">
          <button
            onClick={() => {
              onClose();
              onTrackOrder();
            }}
            className="flex-1 py-3 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 font-black text-amber-300 text-xs sm:text-sm transition-all"
          >
            Acompanhar Pedidos
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 font-black text-white text-xs sm:text-sm shadow-lg shadow-red-950/40"
          >
            Voltar ao Cardápio
          </button>
        </div>
      </div>
    </div>
  );
};
