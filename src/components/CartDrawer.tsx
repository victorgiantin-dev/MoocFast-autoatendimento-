import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { formatCurrency } from '../utils/formatters';
import { X, Trash2, Plus, Minus, ArrowRight, UtensilsCrossed, AlertTriangle } from 'lucide-react';

interface CartDrawerProps {
  onOpenPayment: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenPayment }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    cartCount,
    tableNumber,
    menuItems,
  } = useRestaurant();

  if (!isCartOpen) return null;

  // Verify if any item in cart is currently out of stock
  const hasOutOfStockItem = cart.some(cartItem => {
    const liveProduct = menuItems.find(m => m.id === cartItem.product.id);
    return liveProduct ? (liveProduct.stock <= 0 || !liveProduct.is_available) : false;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l-2 border-stone-700 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 border-b border-amber-400/30 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center text-stone-950 font-black shadow-md">
                🍔
              </div>
              <div>
                <h2 className="text-lg font-black leading-tight">Seu Pedido</h2>
                <p className="text-xs text-amber-200 font-semibold flex items-center gap-1">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>{tableNumber}</span> • {cartCount} {cartCount === 1 ? 'item' : 'itens'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-9 h-9 rounded-xl bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-800">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-3xl">
                  🛒
                </div>
                <h3 className="text-base font-bold text-stone-200">Sua sacola está vazia</h3>
                <p className="text-xs text-stone-400 max-w-xs">
                  Toque nos hambúrgueres e acompanhamentos do cardápio para montar seu pedido nesta mesa.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-3 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs"
                >
                  Explorar Cardápio
                </button>
              </div>
            ) : (
              cart.map(item => {
                const liveProduct = menuItems.find(m => m.id === item.product.id);
                const itemIsEsgotado = liveProduct ? (liveProduct.stock <= 0 || !liveProduct.is_available) : false;

                return (
                  <div key={item.cartId} className="pt-3 first:pt-0 space-y-2">
                    {itemIsEsgotado && (
                      <div className="bg-red-950 border border-red-600 text-red-300 p-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        <span>Produto esgotado! Remova para finalizar o pedido.</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-2xl object-cover bg-stone-950 shrink-0 border border-stone-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-extrabold text-white text-sm leading-tight truncate">
                            {item.product.name}
                          </h4>
                          <span className="font-black text-amber-400 text-sm whitespace-nowrap">
                            {formatCurrency(item.totalItemPrice)}
                          </span>
                        </div>

                        {/* Meat Point badge */}
                        {item.selectedMeatPoint && (
                          <div className="text-[11px] text-amber-300 font-bold mt-0.5">
                            🔥 {item.selectedMeatPoint}
                          </div>
                        )}

                        {/* Removed items */}
                        {item.removedIngredients.length > 0 && (
                          <div className="text-[10px] text-red-400 font-semibold mt-0.5">
                            {item.removedIngredients.join(' • ')}
                          </div>
                        )}

                        {/* Extras */}
                        {item.selectedExtras.length > 0 && (
                          <div className="text-[10px] text-stone-300 mt-0.5">
                            + {item.selectedExtras.map(e => e.name).join(', ')}
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <div className="text-[10px] italic text-stone-400 mt-0.5">
                            Obs: "{item.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stepper & Delete */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 bg-stone-800 p-1 rounded-xl border border-stone-700">
                        <button
                          onClick={() => updateCartQuantity(item.cartId, -1)}
                          className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-black text-xs text-amber-300">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.cartId, 1)}
                          className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Totals & Advance */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal ({cartCount} itens)</span>
                  <span className="font-bold text-stone-200">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Taxa de Serviço</span>
                  <span className="font-bold text-emerald-400">R$ 0,00 (Autoatendimento)</span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex justify-between text-base">
                  <span className="font-black text-white">Total a Pagar</span>
                  <span className="font-black text-amber-400 text-xl">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                {hasOutOfStockItem ? (
                  <div className="w-full py-3 px-4 rounded-2xl bg-red-950/80 border border-red-600 text-red-300 font-bold text-xs text-center">
                    ⛔ Remova os itens esgotados em vermelho para prosseguir com o pagamento.
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      onOpenPayment();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 active:scale-98 font-black text-white text-base shadow-xl shadow-red-950/60 border border-amber-300/40 flex items-center justify-between transition-all"
                  >
                    <span>Finalizar e Pagar</span>
                    <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-xl text-amber-200 text-sm">
                      <span>{formatCurrency(cartTotal)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                )}

                <button
                  onClick={clearCart}
                  className="w-full py-2 text-stone-500 hover:text-stone-300 text-xs font-semibold text-center transition-colors"
                >
                  Limpar todo o pedido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
