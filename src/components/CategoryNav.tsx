import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Search, X, Flame } from 'lucide-react';
import { CategoryId } from '../types';

export const CategoryNav: React.FC = () => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    menuItems,
  } = useRestaurant();

  return (
    <div className="bg-stone-900/90 backdrop-blur-md border-b border-stone-800 sticky top-[58px] sm:top-[68px] z-20 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 space-y-2.5">
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por lanche, smash, batata, sobremesa ou bebida..."
            className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-2xl text-stone-100 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Bar (horizontal touch scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const categoryItems = menuItems.filter(i => i.category === cat.id);
            const availableCount = categoryItems.filter(i => i.stock > 0 && i.is_available).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as CategoryId);
                  if (searchQuery) setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shrink-0 shadow-sm border ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-amber-400 shadow-red-900/40 shadow-md scale-102 font-extrabold ring-1 ring-amber-300'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700/80 hover:text-white border-stone-700/60'
                }`}
              >
                <span className="text-base sm:text-lg leading-none">{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    isSelected
                      ? 'bg-black/30 text-amber-200'
                      : 'bg-stone-700 text-stone-400'
                  }`}
                >
                  {categoryItems.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
