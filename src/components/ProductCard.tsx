import React from 'react';
import { MenuItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Plus, AlertTriangle, Ban, Flame } from 'lucide-react';

interface ProductCardProps {
  product: MenuItem;
  onSelect: (product: MenuItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  // CRITICAL REQUIREMENT:
  // "não falar para o cliente sobre quantidade de estoque só mostra quando não tem com uma mensagem em vermelho e não permitir que o cliente clique para continuar o pedido"
  const isOutOfStock = product.stock <= 0 || !product.is_available;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl overflow-hidden transition-all duration-300 border ${
        isOutOfStock
          ? 'bg-stone-900/80 border-red-900/60 opacity-85 shadow-md ring-1 ring-red-600/30'
          : 'bg-stone-800/90 hover:bg-stone-800 border-stone-700 hover:border-amber-500/80 shadow-xl hover:shadow-2xl hover:shadow-amber-950/20 hover:-translate-y-1'
      }`}
    >
      {/* Top Banner / Image Container */}
      <div className="relative w-full h-44 sm:h-52 overflow-hidden bg-stone-950">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isOutOfStock
              ? 'filter grayscale contrast-125 brightness-75 scale-100'
              : 'group-hover:scale-108'
          }`}
          loading="lazy"
        />

        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-black/40" />

        {/* Badge (e.g. Mais Pedido, Edição Limitada) - Only if available */}
        {!isOutOfStock && product.badge && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg border border-amber-300 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
            <span>{product.badge}</span>
          </div>
        )}

        {/* SPECIFIC REQUIREMENT: OUT OF STOCK RED WARNING BANNER & BADGE */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
            <div className="bg-red-600 text-white px-4 py-2 rounded-2xl shadow-2xl border-2 border-red-300 flex items-center gap-2 transform -rotate-1 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-200 shrink-0" />
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow">
                ESGOTADO / INDISPONÍVEL NO MOMENTO
              </span>
            </div>
            <p className="text-[11px] text-red-200 mt-2 font-semibold">
              Item temporariamente fora do cardápio
            </p>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div className="space-y-2">
          {/* Out of stock inline red alert strip for maximum clarity */}
          {isOutOfStock && (
            <div className="bg-red-950/80 border border-red-600/70 text-red-400 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 mb-2">
              <Ban className="w-4 h-4 text-red-500 shrink-0" />
              <span>INDISPONÍVEL • Não pode ser adicionado</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-base sm:text-lg font-black leading-tight tracking-tight ${
                isOutOfStock ? 'text-stone-400 line-through decoration-red-500 decoration-2' : 'text-white'
              }`}
            >
              {product.name}
            </h3>
          </div>

          <p className="text-xs text-stone-400 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button Footer */}
        <div className="mt-4 pt-3 border-t border-stone-700/60 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
              Preço
            </div>
            <div
              className={`text-lg sm:text-xl font-black ${
                isOutOfStock ? 'text-stone-500' : 'text-amber-400'
              }`}
            >
              {formatCurrency(product.price)}
            </div>
          </div>

          {/* Action Button: Strictly disabled when out of stock */}
          {isOutOfStock ? (
            <button
              disabled={true}
              aria-disabled="true"
              className="cursor-not-allowed bg-stone-800 text-stone-500 border border-red-900/80 px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-none select-none opacity-70"
              title="Este produto está esgotado e não pode ser adicionado ao pedido"
            >
              <Ban className="w-4 h-4 text-red-500" />
              <span>Indisponível</span>
            </button>
          ) : (
            <button
              onClick={() => onSelect(product)}
              className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 active:scale-95 text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-2xl shadow-lg shadow-red-950/40 border border-amber-300/40 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-200 stroke-[3]" />
              <span>Pedir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
