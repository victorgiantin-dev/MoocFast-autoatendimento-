import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { formatCurrency, formatTime } from '../utils/formatters';
import { X, Clock, ChefHat, CheckCircle2, PackageCheck, Utensils } from 'lucide-react';
import { OrderStatus } from '../types';

interface ActiveOrdersModalProps {
  onClose: () => void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  received: { label: 'Pedido Recebido', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', icon: Clock },
  preparing: { label: 'Na Chapa / Preparando', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: ChefHat },
  ready: { label: 'Pronto p/ Entrega!', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: CheckCircle2 },
  delivered: { label: 'Entregue na Mesa', color: 'bg-stone-500/20 text-stone-400 border-stone-500/40', icon: PackageCheck },
};

export const ActiveOrdersModal: React.FC<ActiveOrdersModalProps> = ({ onClose }) => {
  const { tableOrders, tableNumber } = useRestaurant();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-stone-900 border-2 border-stone-700 max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-stone-950 font-black">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">Pedidos da {tableNumber}</h2>
              <p className="text-xs text-amber-200">Acompanhamento em tempo real na cozinha</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-black/30 hover:bg-black/50 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {tableOrders.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <p className="text-base font-bold text-stone-300">Nenhum pedido realizado ainda.</p>
              <p className="text-xs">Faça um pedido no cardápio e ele aparecerá aqui com status ao vivo!</p>
            </div>
          ) : (
            tableOrders.map(order => {
              const statusCfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.received;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={order.id}
                  className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-500 font-mono font-bold block">
                        {formatTime(order.createdAt)}
                      </span>
                      <span className="text-base font-black text-amber-400 font-mono">
                        {order.orderNumber}
                      </span>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${statusCfg.color}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 pt-1 border-t border-stone-900">
                    {order.items.map(item => (
                      <div key={item.cartId} className="text-xs flex justify-between text-stone-300">
                        <span>
                          <strong className="text-amber-400 mr-1.5">{item.quantity}x</strong>
                          {item.product.name}
                          {item.selectedMeatPoint && (
                            <span className="text-stone-400 text-[10px] ml-1">({item.selectedMeatPoint})</span>
                          )}
                        </span>
                        <span className="text-stone-400">{formatCurrency(item.totalItemPrice)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-900 flex items-center justify-between text-xs">
                    <span className="text-stone-500 uppercase font-bold">
                      Pagamento: {order.paymentMethod.toUpperCase()} ({order.paymentStatus === 'paid' ? 'Pago' : 'Pendente'})
                    </span>
                    <span className="text-sm font-black text-white">
                      Total: {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
