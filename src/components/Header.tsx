import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { ShoppingBag, BellRing, Clock, Lock, UtensilsCrossed, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  onOpenActiveOrders: () => void;
  onOpenWaiterModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenActiveOrders, onOpenWaiterModal }) => {
  const {
    tableNumber,
    cartCount,
    cartTotal,
    setIsCartOpen,
    setIsAdminOpen,
    isAdminAuthenticated,
    tableOrders,
    waiterCallReason,
  } = useRestaurant();

  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const { loginAdmin } = useRestaurant();

  const activeOrdersCount = tableOrders.filter(
    o => o.orderStatus === 'received' || o.orderStatus === 'preparing'
  ).length;

  const handleAdminLockClick = () => {
    if (isAdminAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setPinPromptOpen(true);
      setPinInput('');
      setPinError(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(pinInput)) {
      setPinPromptOpen(false);
      setIsAdminOpen(true);
    } else {
      setPinError(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 shadow-xl border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 border-2 border-red-900 shrink-0">
              <span className="text-2xl sm:text-3xl leading-none">🍔</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-white drop-shadow-md font-['Bebas_Neue',sans-serif] tracking-widest text-shadow">
                  MOOC<span className="text-amber-300">FAST</span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-red-950/60 text-amber-300 tracking-wide uppercase border border-amber-400/40 hidden xs:inline-block">
                  Burger Bar
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-red-100 font-medium hidden sm:block">
                Autoatendimento no Tablet • Peça direto na mesa
              </p>
            </div>
          </div>

          {/* Table Indicator & Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Table Badge */}
            <div className="flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-400/30 text-amber-200">
              <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider text-red-200 font-semibold leading-tight">
                  Sua Mesa
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                  {tableNumber}
                </div>
              </div>
            </div>

            {/* Waiter Assistance button */}
            <button
              onClick={onOpenWaiterModal}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
                waiterCallReason
                  ? 'bg-amber-400 text-stone-900 ring-2 ring-white animate-pulse'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
              title="Chamar Atendente"
            >
              <BellRing className="w-4 h-4" />
              <span className="hidden md:inline">
                {waiterCallReason ? 'Atendente Chamado' : 'Chamar Garçom'}
              </span>
            </button>

            {/* Active Orders Tracker */}
            {tableOrders.length > 0 && (
              <button
                onClick={onOpenActiveOrders}
                className="relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 border border-white/20 font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <Clock className="w-4 h-4 text-amber-300" />
                <span className="hidden lg:inline">Acompanhar Pedido</span>
                {activeOrdersCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
                )}
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-900 font-extrabold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg border-2 border-amber-300 transition-all"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-red-900" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-amber-400 animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="text-left hidden xs:block">
                <div className="text-[10px] text-red-950 font-bold uppercase leading-none">
                  {cartCount === 0 ? 'Sacola' : `${cartCount} itens`}
                </div>
                <div className="text-xs sm:text-sm font-black text-stone-950 leading-tight">
                  {formatCurrency(cartTotal)}
                </div>
              </div>
            </button>

            {/* Admin Lock Button (Discreet, for staff only) */}
            <button
              onClick={handleAdminLockClick}
              className={`p-2 rounded-xl transition-all border ${
                isAdminAuthenticated
                  ? 'bg-amber-950/80 text-amber-300 border-amber-400'
                  : 'bg-black/20 text-red-200/60 hover:text-white border-transparent hover:border-white/20'
              }`}
              title="Painel Administrativo (Exclusivo Funcionários)"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin PIN Prompt Modal */}
      {pinPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-600/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">
              Acesso Administrativo
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Área restrita aos funcionários da hamburgueria. Digite a senha/PIN de 4 dígitos.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="PIN (Padrão: 1234)"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 px-4 rounded-xl bg-stone-950 border-2 border-stone-700 text-amber-400 focus:border-amber-400 focus:outline-none"
                />
                {pinError && (
                  <p className="text-xs text-red-500 font-bold mt-2">
                    Senha incorreta! (Dica padrão: 1234)
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinPromptOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 font-bold text-stone-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 font-black text-white text-sm shadow-lg shadow-red-900/40"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
