import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { MenuItem, OrderStatus, CategoryId } from '../types';
import { formatCurrency, formatTime } from '../utils/formatters';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
  uploadInitialMenuToSupabase,
  SUPABASE_SQL_SETUP_SCRIPT,
} from '../services/supabase';
import {
  X,
  Package,
  ChefHat,
  Database,
  Sliders,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  RotateCcw,
  Copy,
  ExternalLink,
  Save,
  Trash2,
  Edit,
  Shield,
  Layers,
  Sparkles,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const {
    menuItems,
    updateProductStock,
    saveProduct,
    orders,
    updateOrderState,
    tableNumber,
    setTableNumber,
    logoutAdmin,
    categories,
    waiterCallReason,
    dismissWaiterCall,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'stock' | 'kitchen' | 'supabase' | 'table'>('stock');

  // Supabase Config form state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ loading: boolean; result?: { success: boolean; message: string } }>({
    loading: false,
  });
  const [sqlCopied, setSqlCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });

  // Edit / Add product state
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // New product form
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<CategoryId>('burgers');
  const [newProductPrice, setNewProductPrice] = useState('34.90');
  const [newProductStock, setNewProductStock] = useState('20');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImage, setNewProductImage] = useState(
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80'
  );
  const [newProductBadge, setNewProductBadge] = useState('');

  // Check if missing table was detected
  const [missingOrdersTableDetected, setMissingOrdersTableDetected] = useState(false);

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseAnonKey(cfg.anonKey);
  }, []);

  useEffect(() => {
    const hasMissingOrders = localStorage.getItem('moocfast_missing_orders_table_detected') === 'true';
    const hasMissingMenu = localStorage.getItem('moocfast_missing_menu_table_detected') === 'true';
    setMissingOrdersTableDetected(hasMissingOrders || hasMissingMenu);
  }, [activeTab]);

  const handleDismissTableWarning = () => {
    localStorage.removeItem('moocfast_missing_orders_table_detected');
    localStorage.removeItem('moocfast_missing_menu_table_detected');
    setMissingOrdersTableDetected(false);
  };

  const handleSaveSupabaseConfig = () => {
    saveStoredSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
    });
    handleTestSupabase();
  };

  const handleTestSupabase = async () => {
    setSupabaseTestStatus({ loading: true });
    const result = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
    setSupabaseTestStatus({ loading: false, result });
  };

  const handleSyncMenuToSupabase = async () => {
    setSyncStatus({ loading: true });
    const res = await uploadInitialMenuToSupabase();
    setSyncStatus({ loading: false, message: res.message, success: res.success });
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const handleQuickStockChange = async (item: MenuItem, delta: number) => {
    const nextStock = Math.max(0, item.stock + delta);
    const nextAvailable = nextStock > 0 ? item.is_available : false;
    await updateProductStock(item.id, nextStock, nextAvailable);
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    const nextAvailable = !item.is_available;
    // If toggling available to true but stock was 0, grant default 10 units
    const nextStock = nextAvailable && item.stock <= 0 ? 10 : item.stock;
    await updateProductStock(item.id, nextStock, nextAvailable);
  };

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const newItem: MenuItem = {
      id: `item_${Date.now()}`,
      name: newProductName.trim(),
      category: newProductCategory,
      price: parseFloat(newProductPrice) || 0,
      stock: parseInt(newProductStock, 10) || 0,
      is_available: (parseInt(newProductStock, 10) || 0) > 0,
      description: newProductDescription.trim(),
      image: newProductImage.trim() || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
      badge: newProductBadge.trim() || undefined,
      meatDonenessRequired: newProductCategory === 'burgers',
      removableIngredients: ['Sem Cebola', 'Sem Molho'],
      availableExtras: [
        { id: 'ext-bacon', name: 'Bacon Extra', price: 4.50 },
        { id: 'ext-cheese', name: 'Queijo Cheddar Extra', price: 4.00 },
      ],
    };

    await saveProduct(newItem);
    setIsNewProductModalOpen(false);
    // Reset form
    setNewProductName('');
    setNewProductDescription('');
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await saveProduct(editingProduct);
    setEditingProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="bg-stone-950 border-b border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                Painel Administrativo MoocFast
              </h2>
              <span className="bg-red-950 text-red-400 border border-red-700/60 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                Privado (Equipe)
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Gerenciamento em tempo real de estoque, pedidos e banco de dados Supabase
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {waiterCallReason && (
            <div className="bg-amber-400 text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 animate-pulse">
              <span>Chamado ativo: {waiterCallReason}</span>
              <button
                onClick={dismissWaiterCall}
                className="bg-black/30 hover:bg-black text-white text-[10px] px-2 py-0.5 rounded"
              >
                Concluir
              </button>
            </div>
          )}

          <button
            onClick={() => {
              logoutAdmin();
              onClose();
            }}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition-all"
          >
            Sair do Admin
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'stock'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Controle de Estoque & Produtos</span>
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'kitchen'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>KDS Cozinha ({orders.length} pedidos)</span>
        </button>

        {/* Supabase Tab - ONLY visible to ADMIN */}
        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'supabase'
              ? 'bg-emerald-500 text-stone-950 shadow-md ring-2 ring-emerald-300'
              : 'text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Banco Supabase (Exclusivo ADM)</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'table'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuração da Mesa ({tableNumber})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950">
        
        {/* Missing Table Warning for Admin */}
        {missingOrdersTableDetected && (
          <div className="max-w-7xl mx-auto mb-6 bg-amber-950/70 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-300">
                  Atenção Administrador: Tabela mooc_orders ainda não criada no Supabase
                </h4>
                <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                  Os pedidos dos clientes continuam funcionando normalmente e são salvos com segurança no tablet! Para sincronizar os pedidos com o Supabase em tempo real, copie o script SQL e execute no Supabase SQL Editor.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('supabase')}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow"
              >
                <span>Ver Script SQL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDismissTableWarning}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-bold"
              >
                Dispensar
              </button>
            </div>
          </div>
        )}
        
        {/* ============================================================== */}
        {/* 1. STOCK MANAGEMENT TAB */}
        {/* ============================================================== */}
        {activeTab === 'stock' && (
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Info Banner on the exact Stock rule */}
            <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 border border-red-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Regra de Visibilidade de Estoque Ativa
                  </h3>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
                  <strong>O cliente NÃO vê a quantidade numérica de estoque.</strong> Apenas você (administrador) visualiza os números exatos. Quando você zerar o estoque ou marcar como esgotado, o cliente verá imediatamente o aviso em vermelho: <span className="text-red-400 font-black">"ESGOTADO / INDISPONÍVEL NO MOMENTO"</span> e o botão de adicionar será bloqueado!
                </p>
              </div>

              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Produto</span>
              </button>
            </div>

            {/* Products Table/Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => {
                const isOutOfStock = item.stock <= 0 || !item.is_available;

                return (
                  <div
                    key={item.id}
                    className={`bg-stone-900 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                      isOutOfStock
                        ? 'border-red-600/70 bg-stone-900/90 ring-1 ring-red-600/30'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      {/* Product Header */}
                      <div className="flex items-start gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover bg-stone-950 shrink-0 border border-stone-800"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-stone-400">
                              {item.category}
                            </span>
                            <button
                              onClick={() => setEditingProduct(item)}
                              className="text-stone-400 hover:text-white p-1"
                              title="Editar Produto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="text-sm font-black text-white truncate">{item.name}</h4>
                          <span className="text-xs font-black text-amber-400">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>

                      {/* Client View Status Indicator */}
                      <div className="mt-3 p-2 rounded-xl text-xs font-bold border flex items-center justify-between bg-stone-950">
                        <span className="text-[11px] text-stone-400">Visão do Cliente:</span>
                        {isOutOfStock ? (
                          <span className="text-red-400 font-black flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            ESGOTADO (Vermelho)
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Disponível p/ Pedir
                          </span>
                        )}
                      </div>

                      {/* Real Stock Count (ADM ONLY) */}
                      <div className="mt-3 bg-stone-800/80 p-3 rounded-xl border border-stone-700/60">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-stone-300">
                            Estoque Real em Unidades:
                          </span>
                          <span
                            className={`font-black font-mono text-sm px-2 py-0.5 rounded ${
                              isOutOfStock
                                ? 'bg-red-950 text-red-400 border border-red-700'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            }`}
                          >
                            {item.stock} un.
                          </span>
                        </div>

                        {/* Quick stock adjustment buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickStockChange(item, -1)}
                            className="flex-1 py-1.5 bg-stone-700 hover:bg-stone-600 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                            title="Diminuir 1"
                          >
                            <Minus className="w-3 h-3" />
                            <span>-1</span>
                          </button>

                          <button
                            onClick={() => handleQuickStockChange(item, 1)}
                            className="flex-1 py-1.5 bg-stone-700 hover:bg-stone-600 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                            title="Aumentar 1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+1</span>
                          </button>

                          <button
                            onClick={() => handleQuickStockChange(item, 10)}
                            className="flex-1 py-1.5 bg-stone-700 hover:bg-stone-600 active:scale-95 text-amber-300 font-bold text-xs rounded-lg"
                            title="Adicionar 10"
                          >
                            +10
                          </button>

                          <button
                            onClick={() => updateProductStock(item.id, 0, false)}
                            className="py-1.5 px-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 font-bold text-[10px] rounded-lg"
                            title="Zerar Estoque Imediatamente"
                          >
                            Zerar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Availability Switch */}
                    <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between">
                      <span className="text-xs text-stone-400">Status do Produto:</span>
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                          item.is_available && item.stock > 0
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/40'
                            : 'bg-red-600/30 text-red-300 border border-red-500/50 hover:bg-red-600/40'
                        }`}
                      >
                        {item.is_available && item.stock > 0 ? '🟢 Em Linha' : '🔴 Forçar Esgotado'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. KDS KITCHEN TAB */}
        {/* ============================================================== */}
        {activeTab === 'kitchen' && (
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  Quadro de Pedidos da Cozinha (KDS ao Vivo)
                </h3>
                <p className="text-xs text-stone-400">
                  Acompanhe os pedidos de todas as mesas e avance as etapas de preparo
                </p>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['received', 'preparing', 'ready', 'delivered'] as OrderStatus[]).map(status => {
                const columnOrders = orders.filter(o => o.orderStatus === status);
                const titleMap: Record<OrderStatus, { title: string; color: string }> = {
                  received: { title: 'Recebidos / Chapa', color: 'border-blue-500 text-blue-400' },
                  preparing: { title: 'Em Preparo', color: 'border-amber-500 text-amber-400' },
                  ready: { title: 'Pronto p/ Servir', color: 'border-emerald-500 text-emerald-400' },
                  delivered: { title: 'Entregues', color: 'border-stone-600 text-stone-400' },
                };

                return (
                  <div
                    key={status}
                    className="bg-stone-900 rounded-2xl border border-stone-800 p-3 space-y-3 flex flex-col"
                  >
                    <div className={`pb-2 border-b-2 flex items-center justify-between ${titleMap[status].color}`}>
                      <span className="font-black text-xs uppercase tracking-wider">
                        {titleMap[status].title}
                      </span>
                      <span className="text-xs font-black bg-stone-800 px-2 py-0.5 rounded-full text-white">
                        {columnOrders.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[65vh]">
                      {columnOrders.length === 0 ? (
                        <div className="text-center py-8 text-stone-600 text-xs font-medium">
                          Nenhum pedido nesta etapa
                        </div>
                      ) : (
                        columnOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-amber-400 text-sm">
                                {order.orderNumber}
                              </span>
                              <span className="bg-stone-800 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-md">
                                {order.tableNumber}
                              </span>
                            </div>

                            <div className="text-[11px] text-stone-400 flex justify-between">
                              <span>{formatTime(order.createdAt)}</span>
                              <span className="uppercase font-bold text-stone-300">
                                {order.paymentMethod} • {order.paymentStatus}
                              </span>
                            </div>

                            {/* Items list */}
                            <div className="space-y-1 pt-1 border-t border-stone-900 text-xs">
                              {order.items.map(item => (
                                <div key={item.cartId} className="text-stone-300">
                                  <span className="font-black text-amber-400 mr-1.5">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-bold">{item.product.name}</span>
                                  {item.selectedMeatPoint && (
                                    <span className="text-amber-300 text-[10px] ml-1 font-bold">
                                      ({item.selectedMeatPoint})
                                    </span>
                                  )}
                                  {item.removedIngredients.length > 0 && (
                                    <div className="text-[10px] text-red-400 font-bold ml-4">
                                      {item.removedIngredients.join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Action to advance status */}
                            <div className="pt-2 border-t border-stone-900 flex gap-1">
                              {status === 'received' && (
                                <button
                                  onClick={() => updateOrderState(order.id, 'preparing')}
                                  className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs"
                                >
                                  Iniciar Preparo
                                </button>
                              )}
                              {status === 'preparing' && (
                                <button
                                  onClick={() => updateOrderState(order.id, 'ready')}
                                  className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs"
                                >
                                  Pronto p/ Mesa!
                                </button>
                              )}
                              {status === 'ready' && (
                                <button
                                  onClick={() => updateOrderState(order.id, 'delivered')}
                                  className="w-full py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white font-black text-xs"
                                >
                                  Concluir Entrega
                                </button>
                              )}
                              {status === 'delivered' && (
                                <span className="text-[11px] text-stone-500 font-bold text-center w-full">
                                  Entregue com sucesso
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. SUPABASE CONFIGURATION TAB (ADM EXCLUSIVE) */}
        {/* ============================================================== */}
        {activeTab === 'supabase' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header info */}
            <div className="bg-stone-900 border border-emerald-500/40 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Integração com Banco de Dados Supabase
                  </h3>
                  <p className="text-xs text-stone-300">
                    Esta aba é <strong>100% restrita ao Administrador</strong>. O cliente no tablet nunca tem acesso a estas configurações nem sabe da existência do Supabase.
                  </p>
                </div>
              </div>
            </div>

            {/* Supabase Credentials Form */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>1. Credenciais do seu Projeto Supabase</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={e => setSupabaseUrl(e.target.value)}
                    placeholder="https://seu-projeto.supabase.co"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Supabase Anon / Public Key (chave pública anônima)
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={e => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-white text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar e Conectar ao Supabase</span>
                </button>

                <button
                  type="button"
                  disabled={supabaseTestStatus.loading}
                  onClick={handleTestSupabase}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-2"
                >
                  {supabaseTestStatus.loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>Testar Conexão</span>
                </button>
              </div>

              {/* Test Status feedback */}
              {supabaseTestStatus.result && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                    supabaseTestStatus.result.success
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-red-950/80 border-red-500 text-red-300'
                  }`}
                >
                  {supabaseTestStatus.result.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{supabaseTestStatus.result.message}</span>
                </div>
              )}
            </div>

            {/* Sync Menu to Supabase */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                2. Sincronizar Cardápio Inicial MoocFast com o Supabase
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Clique no botão abaixo para fazer o upload automático de todos os hambúrgueres, smashes, porções, bebidas e níveis de estoque para a tabela <code>mooc_menu_items</code> do seu Supabase.
              </p>

              <button
                type="button"
                disabled={syncStatus.loading || !supabaseUrl}
                onClick={handleSyncMenuToSupabase}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {syncStatus.loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-200" />
                )}
                <span>Subir Cardápio Atual para o Supabase</span>
              </button>

              {syncStatus.message && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold border ${
                    syncStatus.success
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-amber-950 border-amber-500 text-amber-300'
                  }`}
                >
                  {syncStatus.message}
                </div>
              )}
            </div>

            {/* SQL Script Viewer */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    3. Script SQL para Criação das Tabelas no Supabase
                  </h4>
                  <p className="text-xs text-stone-400">
                    Cole no menu <strong>SQL Editor</strong> do painel do Supabase e clique em <strong>RUN</strong>.
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-stone-700 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{sqlCopied ? 'SQL Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="relative bg-stone-950 rounded-2xl p-4 border border-stone-800 max-h-56 overflow-y-auto">
                <pre className="text-[11px] text-stone-300 font-mono leading-relaxed select-all">
                  {SUPABASE_SQL_SETUP_SCRIPT}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. TABLE CONFIGURATION TAB */}
        {/* ============================================================== */}
        {activeTab === 'table' && (
          <div className="max-w-md mx-auto space-y-6 pt-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Identificação deste Tablet</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Selecione ou digite em qual mesa este tablet está fixado no salão da hamburgueria.
                </p>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-stone-300">Número da Mesa:</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  placeholder="Ex: Mesa 04, Mesa 07, Balcão 02..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400 text-center"
                />
              </div>

              {/* Quick Table Presets */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {['Mesa 01', 'Mesa 02', 'Mesa 03', 'Mesa 04', 'Mesa 05', 'Mesa 06', 'Mesa 07', 'Balcão 01'].map(
                  preset => (
                    <button
                      key={preset}
                      onClick={() => setTableNumber(preset)}
                      className={`p-2 rounded-xl text-xs font-black transition-all ${
                        tableNumber === preset
                          ? 'bg-amber-400 text-stone-950'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Editar Produto</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-300">Nome:</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300">Preço (R$):</label>
                  <input
                    type="number"
                    step="0.10"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300">Estoque (Unidades):</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={e => {
                      const st = parseInt(e.target.value, 10) || 0;
                      setEditingProduct({
                        ...editingProduct,
                        stock: st,
                        is_available: st > 0,
                      });
                    }}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300">Descrição:</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-stone-800 text-stone-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 text-stone-950 font-black rounded-xl text-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Criar Novo Produto no Cardápio</h3>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-300">Nome do Produto:</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  placeholder="Ex: Mooc Cheddar Melt Deluxe"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300">Categoria:</label>
                  <select
                    value={newProductCategory}
                    onChange={e => setNewProductCategory(e.target.value as CategoryId)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300">Preço (R$):</label>
                  <input
                    type="number"
                    step="0.10"
                    value={newProductPrice}
                    onChange={e => setNewProductPrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300">Estoque Inicial:</label>
                  <input
                    type="number"
                    value={newProductStock}
                    onChange={e => setNewProductStock(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300">Selo / Destaque (Opcional):</label>
                  <input
                    type="text"
                    value={newProductBadge}
                    onChange={e => setNewProductBadge(e.target.value)}
                    placeholder="Ex: Lançamento"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300">Descrição:</label>
                <textarea
                  rows={2}
                  value={newProductDescription}
                  onChange={e => setNewProductDescription(e.target.value)}
                  placeholder="Ingredientes e detalhes saborosos..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300">URL da Imagem:</label>
                <input
                  type="url"
                  value={newProductImage}
                  onChange={e => setNewProductImage(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-800 text-stone-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black rounded-xl text-xs"
                >
                  Criar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
