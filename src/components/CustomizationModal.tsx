import React, { useState, useId } from 'react';
import { MenuItem, ExtraOption, CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { X, Plus, Minus, Check, Flame, AlertCircle } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

interface CustomizationModalProps {
  product: MenuItem;
  onClose: () => void;
}

const MEAT_POINTS = [
  { id: 'Ao Ponto', label: 'Ao Ponto (Recomendado)', desc: 'Centro rosado e ultra suculento' },
  { id: 'Bem Passado', label: 'Bem Passado', desc: 'Carne totalmente tostada e firme' },
  { id: 'Mal Passado', label: 'Mal Passado', desc: 'Selada por fora e vermelha no centro' },
];

export const CustomizationModal: React.FC<CustomizationModalProps> = ({ product, onClose }) => {
  const { addToCart, setIsCartOpen } = useRestaurant();
  const [quantity, setQuantity] = useState(1);
  const [selectedMeatPoint, setSelectedMeatPoint] = useState<string>(
    product.meatDonenessRequired ? 'Ao Ponto' : ''
  );
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraOption[]>([]);
  const [notes, setNotes] = useState('');

  // Safeguard: Cannot order if out of stock
  const isOutOfStock = product.stock <= 0 || !product.is_available;

  const toggleRemoved = (ingredient: string) => {
    setRemovedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const toggleExtra = (extra: ExtraOption) => {
    setSelectedExtras(prev =>
      prev.some(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = product.price + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (isOutOfStock) return;

    const cartItem: CartItem = {
      cartId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      product,
      quantity,
      selectedMeatPoint: product.meatDonenessRequired ? selectedMeatPoint : undefined,
      removedIngredients,
      selectedExtras,
      notes: notes.trim() ? notes.trim() : undefined,
      totalItemPrice: totalPrice,
    };

    addToCart(cartItem);
    onClose();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border-2 border-stone-700 max-w-2xl w-full max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header with image */}
        <div className="relative h-44 sm:h-56 w-full shrink-0 bg-stone-950">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-black/60" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title on image */}
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow leading-tight">
              {product.name}
            </h2>
            <p className="text-xs text-amber-300 font-bold mt-0.5">
              A partir de {formatCurrency(product.price)}
            </p>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-stone-800">
          
          {/* Description */}
          <div className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            {product.description}
          </div>

          {/* Out of Stock Warning if triggered */}
          {isOutOfStock && (
            <div className="pt-4 bg-red-950/60 border border-red-600 rounded-2xl p-4 text-center">
              <div className="text-red-400 font-black text-sm flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span>ESGOTADO / INDISPONÍVEL NO MOMENTO</span>
              </div>
              <p className="text-xs text-stone-300 mt-1">
                Lamentamos, este produto acabou de esgotar na cozinha. Por favor escolha outra opção!
              </p>
            </div>
          )}

          {/* 1. Meat Doneness (if burger) */}
          {product.meatDonenessRequired && !isOutOfStock && (
            <div className="pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span>Ponto da Carne (Obrigatório)</span>
                </label>
                <span className="text-[11px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full font-bold">
                  Escolha 1 opção
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MEAT_POINTS.map(point => {
                  const isChecked = selectedMeatPoint === point.id;
                  return (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => setSelectedMeatPoint(point.id)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        isChecked
                          ? 'bg-red-950/60 border-amber-400 ring-2 ring-amber-400/50 text-white'
                          : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{point.id}</span>
                        {isChecked && (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">{point.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Removable Ingredients */}
          {product.removableIngredients && product.removableIngredients.length > 0 && !isOutOfStock && (
            <div className="pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-stone-200 uppercase tracking-wide">
                  Deseja retirar algum ingrediente?
                </label>
                <span className="text-[11px] text-stone-400">Opcional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.removableIngredients.map(ing => {
                  const isRemoved = removedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleRemoved(ing)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isRemoved
                          ? 'bg-red-900/40 border-red-500 text-red-200'
                          : 'bg-stone-800/60 border-stone-700/80 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isRemoved ? 'line-through text-red-300' : ''}`}>
                        {ing}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black border ${
                          isRemoved
                            ? 'bg-red-600 border-red-400 text-white'
                            : 'border-stone-600 bg-stone-900 text-transparent'
                        }`}
                      >
                        {isRemoved ? '✕' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Available Extras / Turbinar */}
          {product.availableExtras && product.availableExtras.length > 0 && !isOutOfStock && (
            <div className="pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span>Turbine seu pedido (Adicionais)</span>
                </label>
                <span className="text-[11px] text-amber-300/80 font-bold">Opcional</span>
              </div>

              <div className="space-y-2">
                {product.availableExtras.map(extra => {
                  const isChecked = selectedExtras.some(e => e.id === extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400 text-white'
                          : 'bg-stone-800/70 border-stone-700 text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                            isChecked
                              ? 'bg-amber-400 border-amber-300 text-stone-950'
                              : 'border-stone-600 bg-stone-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-bold">{extra.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-amber-400">
                        +{formatCurrency(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Notes / Kitchen observations */}
          {!isOutOfStock && (
            <div className="pt-4 space-y-2">
              <label className="text-xs font-bold text-stone-300">
                Observações para a cozinha (ex: "pouco sal", "molho à parte"):
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={140}
                placeholder="Escreva aqui caso tenha alguma preferência..."
                rows={2}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs sm:text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>

        {/* Modal Footer (Quantity Stepper & Confirm) */}
        <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          
          {/* Quantity Stepper */}
          {!isOutOfStock && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-800 p-1.5 rounded-2xl border border-stone-700">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-xl bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-7 text-center font-black text-sm text-amber-300">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-xl bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Add to Order Button */}
          {isOutOfStock ? (
            <button
              disabled
              className="flex-1 py-3.5 rounded-2xl bg-stone-800 text-stone-500 font-bold text-sm cursor-not-allowed border border-red-900"
            >
              Produto Indisponível
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 active:scale-98 font-black text-white text-sm sm:text-base shadow-xl shadow-red-950/60 border border-amber-300/40 flex items-center justify-between transition-all"
            >
              <span>Adicionar ao Pedido</span>
              <span className="bg-black/30 px-3 py-1 rounded-xl text-amber-200 font-extrabold text-xs sm:text-sm">
                {formatCurrency(totalPrice)}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
