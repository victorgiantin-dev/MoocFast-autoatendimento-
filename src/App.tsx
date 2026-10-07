/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { CustomizationModal } from './components/CustomizationModal';
import { CartDrawer } from './components/CartDrawer';
import { PaymentModal } from './components/PaymentModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ActiveOrdersModal } from './components/ActiveOrdersModal';
import { CallWaiterModal } from './components/CallWaiterModal';
import { AdminPanel } from './components/AdminPanel';
import { MenuItem } from './types';
import { Sparkles, Utensils, Flame, ChefHat, Info } from 'lucide-react';

function KioskContent() {
  const {
    menuItems,
    selectedCategory,
    searchQuery,
    isLoadingMenu,
    isAdminOpen,
    setIsAdminOpen,
    categories,
    tableNumber,
  } = useRestaurant();

  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [isActiveOrdersOpen, setIsActiveOrdersOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);

  // Filter menu items by search or selected category
  const filteredItems = menuItems.filter(item => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return item.category === selectedCategory;
  });

  const currentCategoryObj = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
      
      {/* Kiosk Header */}
      <Header
        onOpenActiveOrders={() => setIsActiveOrdersOpen(true)}
        onOpenWaiterModal={() => setIsWaiterModalOpen(true)}
      />

      {/* Category Navigation Bar */}
      <CategoryNav />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        
        {/* Welcome / Table Hero Kiosk Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-900 via-stone-900 to-amber-900 border border-amber-500/30 p-4 sm:p-6 shadow-2xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  Tablet de Autoatendimento
                </span>
                <span className="text-xs font-bold text-amber-200">
                  {tableNumber}
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Peça direto pelo tablet. <span className="text-amber-300">Sem filas, lanches artesanais na brasa!</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Monte seu burger com o ponto perfeito, adicione acompanhamentos crocantes e pague via PIX ou cartão na mesa.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={() => setIsActiveOrdersOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-stone-800/80 hover:bg-stone-700/80 border border-stone-600 text-amber-300 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>Ver Meus Pedidos</span>
              </button>
            </div>
          </div>

          {/* Background burger watermark */}
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-4">
            <span className="text-9xl">🍔</span>
          </div>
        </div>

        {/* Category Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{currentCategoryObj?.icon}</span>
              <span>{searchQuery ? `Resultados para "${searchQuery}"` : currentCategoryObj?.name}</span>
            </h2>
            <p className="text-xs text-stone-400">
              {searchQuery
                ? `${filteredItems.length} opções encontradas`
                : currentCategoryObj?.description}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {isLoadingMenu ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-400">Carregando cardápio suculento do MoocFast...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-stone-900/40 rounded-3xl border border-stone-800 p-8">
            <div className="text-4xl">🔍</div>
            <h3 className="text-base font-black text-stone-200">Nenhum item encontrado</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Não encontramos nenhum lanche correspondente à sua busca. Tente buscar por outros termos ou navegue pelas categorias acima.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredItems.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={prod => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer / Table Info */}
      <footer className="mt-auto bg-stone-950 border-t border-stone-900 py-4 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-stone-400 tracking-wider font-['Bebas_Neue',sans-serif] text-base">
              MOOC<span className="text-amber-400">FAST</span>
            </span>
            <span>• Totem de Autoatendimento na Mesa ({tableNumber})</span>
          </div>
          <div className="text-[11px] text-stone-600">
            Hambúrgueres Artesanais • Ponto Perfeito • Chapa Quente
          </div>
        </div>
      </footer>

      {/* Product Customization Modal */}
      {selectedProduct && (
        <CustomizationModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        onOpenPayment={() => setIsPaymentOpen(true)}
      />

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={() => {
            setIsPaymentOpen(false);
            setIsOrderSuccessOpen(true);
          }}
        />
      )}

      {/* Order Success Confirmation */}
      {isOrderSuccessOpen && (
        <OrderSuccessModal
          onClose={() => setIsOrderSuccessOpen(false)}
          onTrackOrder={() => setIsActiveOrdersOpen(true)}
        />
      )}

      {/* Active Orders Status Modal */}
      {isActiveOrdersOpen && (
        <ActiveOrdersModal
          onClose={() => setIsActiveOrdersOpen(false)}
        />
      )}

      {/* Call Waiter Modal */}
      {isWaiterModalOpen && (
        <CallWaiterModal
          onClose={() => setIsWaiterModalOpen(false)}
        />
      )}

      {/* Admin Panel (Stock & Supabase) */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <KioskContent />
    </RestaurantProvider>
  );
}
